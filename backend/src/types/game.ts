export interface GameState {
  score: number;
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  wordNumber: number;
  currentWord: string;
  lastSpelling: string;
  lastResult: boolean | null;
  isActive: boolean;
}

export interface GameStats {
  score: number;
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  wordNumber: number;
  currentWord: string;
}

export interface ValidationResult {
  isCorrect: boolean;
  userSpelling: string;
  correctWord: string;
  cleanedInput: string;
}

export interface BotMessage {
  type: "word" | "feedback" | "score" | "greeting" | "instruction";
  content: string;
  data?: any;
}

export interface UserMessage {
  type: "spelling" | "command";
  content: string;
  timestamp: number;
}
