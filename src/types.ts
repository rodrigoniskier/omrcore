export interface Answer {
  questionNumber: number;
  correctAnswer: string;
}

export interface ExamDetails {
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface ExamResult {
  studentId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  details: ExamDetails[];
}
