import { GameState, ValidationResult } from "../types/game.js";

export class SpellingValidator {
  private gameState: GameState;
  private userSpelling: string = "";
  private isUserSpeaking: boolean = false;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  startCapture(): void {
    this.isUserSpeaking = true;
    this.userSpelling = "";
  }

  stopCapture(): ValidationResult | null {
    this.isUserSpeaking = false;

    if (!this.userSpelling || !this.gameState.currentWord) {
      return null;
    }

    const result = this.validateSpelling(
      this.userSpelling,
      this.gameState.currentWord
    );

    this.gameState.lastSpelling = this.userSpelling;
    this.gameState.lastResult = result.isCorrect;

    if (result.isCorrect) {
      this.gameState.score += 10;
      this.gameState.correctCount += 1;
    } else {
      this.gameState.incorrectCount += 1;
    }

    this.gameState.totalWords += 1;

    return result;
  }

  addText(text: string): void {
    if (this.isUserSpeaking) {
      this.userSpelling += " " + text;
    }
  }

  validateSpelling(userInput: string, correctWord: string): ValidationResult {
    const cleanedInput = this.cleanSpellingInput(userInput);
    const cleanedWord = correctWord.toLowerCase().trim();

    const isCorrect =
      cleanedInput === cleanedWord ||
      cleanedInput.replace(/[^a-z]/g, "") === cleanedWord;

    return {
      isCorrect,
      userSpelling: userInput,
      correctWord,
      cleanedInput,
    };
  }

  cleanSpellingInput(text: string): string {
    let cleaned = text.toLowerCase();

    const fillerWords = [
      "capital",
      "lowercase",
      "letter",
      "the",
      "is",
      "spell",
      "spelling",
      "it's",
      "its",
    ];

    fillerWords.forEach((word) => {
      cleaned = cleaned.replace(new RegExp(word, "g"), "");
    });

    const letters = cleaned.match(/[a-z]/g) || [];
    return letters.join("");
  }

  reset(): void {
    this.userSpelling = "";
    this.isUserSpeaking = false;
  }

  getCurrentSpelling(): string {
    return this.userSpelling;
  }
}
