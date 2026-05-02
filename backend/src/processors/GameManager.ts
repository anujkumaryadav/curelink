import { GameState, GameStats } from "../types/game.js";
import { getWords } from "../data/words.js";

export class GameManager {
  private words: string[];
  private usedWords: string[];
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.words = [...getWords()];
    this.usedWords = [];
    this.gameState = gameState;
    this.shuffleWords();
  }

  private shuffleWords(): void {
    for (let i = this.words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
    }
  }

  getNextWord(): string | null {
    if (this.words.length === 0) {
      this.words = [...this.usedWords];
      this.usedWords = [];
      this.shuffleWords();
    }

    if (this.words.length > 0) {
      const word = this.words.pop()!;
      this.usedWords.push(word);
      this.gameState.currentWord = word;
      this.gameState.wordNumber += 1;
      return word;
    }

    return null;
  }

  getGameStats(): GameStats {
    return {
      score: this.gameState.score,
      totalWords: this.gameState.totalWords,
      correctCount: this.gameState.correctCount,
      incorrectCount: this.gameState.incorrectCount,
      wordNumber: this.gameState.wordNumber,
      currentWord: this.gameState.currentWord,
    };
  }

  resetGame(): void {
    this.words.push(...this.usedWords);
    this.usedWords = [];
    this.shuffleWords();

    this.gameState.score = 0;
    this.gameState.totalWords = 0;
    this.gameState.correctCount = 0;
    this.gameState.incorrectCount = 0;
    this.gameState.wordNumber = 0;
    this.gameState.currentWord = "";
    this.gameState.lastSpelling = "";
    this.gameState.lastResult = null;
  }

  getCurrentWord(): string {
    return this.gameState.currentWord;
  }

  isGameActive(): boolean {
    return this.gameState.isActive;
  }

  setGameActive(active: boolean): void {
    this.gameState.isActive = active;
  }
}
