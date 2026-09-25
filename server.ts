import express from 'express';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_REQUESTS = 30;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 4,
    fieldSize: 64 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Unsupported file type.'));
    }
    cb(null, true);
  },
});

let ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; " +
      "script-src 'self'; connect-src 'self' ws: wss:; font-src 'self' data:; " +
      "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  );
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
app.use('/api', (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  current.count += 1;
  if (current.count > RATE_MAX_REQUESTS) {
    res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  next();
});

// Helper function to safely parse Gemini JSON response.
function parseGeminiJson(text: string) {
  try {
    const cleanText = text.replace(/```json\s*/, '').replace(/```\s*$/, '');
    return JSON.parse(cleanText);
  } catch {
    // Do not log the raw model response: it may contain student-identifying data.
    throw new Error('Invalid output format from AI.');
  }
}

function validateAnswerKey(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 200) {
    throw new Error('Invalid answer key.');
  }

  return value.map((item) => {
    const questionNumber = Number(item?.questionNumber);
    const correctAnswer = String(item?.correctAnswer || '').trim().toUpperCase();

    if (
      !Number.isInteger(questionNumber) ||
      questionNumber < 1 ||
      questionNumber > 1000 ||
      !/^[A-E]$/.test(correctAnswer)
    ) {
      throw new Error('Invalid answer key.');
    }

    return { questionNumber, correctAnswer };
  });
}

app.post('/api/parse-key', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const aiClient = getAiClient();
    const mimeType = req.file.mimetype;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType,
              },
            },
            {
              text: "Return ONLY a JSON array containing the correct answers extracted from this answer key. Each object should have 'questionNumber' (int) and 'correctAnswer' (string, like 'A', 'B', 'C', 'D', 'E'). Example: [{\"questionNumber\": 1, \"correctAnswer\": \"A\"}]",
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error('No response from Gemini');

    const keyData = validateAnswerKey(parseGeminiJson(response.text));
    res.json(keyData);
  } catch (error) {
    console.error('Error parsing answer key:', error instanceof Error ? error.message : 'unknown');
    res.status(500).json({ error: 'Failed to parse answer key.' });
  }
});

app.post('/api/evaluate-exam', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const answerKeyRaw = req.body?.answerKey;
    if (typeof answerKeyRaw !== 'string' || answerKeyRaw.length > 32_000) {
      return res.status(400).json({ error: 'Missing or invalid answer key' });
    }

    let answerKey;
    try {
      answerKey = validateAnswerKey(JSON.parse(answerKeyRaw));
    } catch {
      return res.status(400).json({ error: 'Missing or invalid answer key' });
    }

    const aiClient = getAiClient();
    const mimeType = req.file.mimetype;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType,
              },
            },
            {
              text: `You are an expert exam grader. I am providing an image of a student's multiple-choice answer sheet.
Compare their marked answers against this official answer key: ${JSON.stringify(answerKey)}.

Return ONLY a JSON object with this exact structure:
{
  "studentId": "extracted student ID or name, or 'Unknown'",
  "totalQuestions": 0,
  "correctAnswers": 0,
  "score": 0.0,
  "details": [
    {
      "questionNumber": 1,
      "studentAnswer": "A",
      "correctAnswer": "A",
      "isCorrect": true
    }
  ]
}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error('No response from Gemini');

    const evalData = parseGeminiJson(response.text);
    res.json(evalData);
  } catch (error) {
    console.error('Error evaluating exam:', error instanceof Error ? error.message : 'unknown');
    res.status(500).json({ error: 'Failed to evaluate exam.' });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large.' });
    }
    return res.status(400).json({ error: 'Invalid upload.' });
  }

  if (error instanceof Error && error.message === 'Unsupported file type.') {
    return res.status(415).json({ error: error.message });
  }

  next(error);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      dotfiles: 'deny',
      fallthrough: true,
      maxAge: '1h',
    }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
