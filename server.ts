import express from 'express';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

let ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY || "AIzaSyAiaCkCwW64XHOJQZwCjwgdGZq1a9F68kM";
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

app.use(express.json());

// Helper function to safely parse Gemini JSON response
function parseGeminiJson(text: string) {
  try {
    // Sometimes it wraps in ```json ... ```
    let cleanText = text.replace(/```json\s*/, '').replace(/```\s*$/, '');
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid output format from AI.");
  }
}

app.post('/api/parse-key', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const aiClient = getAiClient();
    
    // We expect the user to upload an image of the answer key
    // Let's support images (jpeg, png, etc.)
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
              }
            },
            {
              text: "Return ONLY a JSON array containing the correct answers extracted from this answer key. Each object should have 'questionNumber' (int) and 'correctAnswer' (string, like 'A', 'B', 'C', 'D', 'E'). Example: [{\"questionNumber\": 1, \"correctAnswer\": \"A\"}]"
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) throw new Error("No response from Gemini");
    
    const keyData = parseGeminiJson(response.text);
    res.json(keyData);
  } catch (error: any) {
    console.error("Error parsing key:", error);
    res.status(500).json({ error: error.message || 'Failed to parse answer key' });
  }
});

app.post('/api/evaluate-exam', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { answerKey } = req.body;
    if (!answerKey) {
      return res.status(400).json({ error: 'Missing answer key' });
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
              }
            },
            {
               text: `You are an expert exam grader. I am providing an image of a student's multiple-choice answer sheet.
Compare their marked answers against this official answer key: ${answerKey}.

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
}`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) throw new Error("No response from Gemini");
    
    const evalData = parseGeminiJson(response.text);
    res.json(evalData);
  } catch (error: any) {
    console.error("Error evaluating exam:", error);
    res.status(500).json({ error: error.message || 'Failed to evaluate exam' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
