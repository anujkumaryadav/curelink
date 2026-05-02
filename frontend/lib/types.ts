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

export interface BotMessage {
  type: "bot_speech" | "game_stats" | "game_reset" | "ready" | "error";
  text?: string;
  action?: string;
  gameState?: GameState;
  stats?: any;
  sessionId?: string;
  message?: string;
}

export interface SessionInfo {
  sessionId: string;
  roomUrl: string;
  roomName: string;
  expiresAt: string;
}
