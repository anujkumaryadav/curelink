import { GameState } from "../types/game.js";
import { GameManager } from "../processors/GameManager.js";
import { SpellingValidator } from "../processors/SpellingValidator.js";

export class DemoBot {
  private gameState: GameState;
  private gameManager: GameManager;
  private spellingValidator: SpellingValidator;
  private currentWordSpoken: boolean = false;

  constructor() {
    this.gameState = {
      score: 0,
      totalWords: 0,
      correctCount: 0,
      incorrectCount: 0,
      wordNumber: 0,
      currentWord: "",
      lastSpelling: "",
      lastResult: null,
      isActive: false,
    };

    this.gameManager = new GameManager(this.gameState);
    this.spellingValidator = new SpellingValidator(this.gameState);
  }

  async startGame(): Promise<string> {
    this.gameState.isActive = true;
    this.gameManager.resetGame();

    const greetings = [
      "Welcome to Disha Bot! I'm so excited to help you improve your spelling skills today! Let's see how many words you can spell correctly!",
      "Hello there! I'm Disha Bot, ready for an awesome spelling challenge! I've got some great words for you today!",
      "Hey! Welcome to Disha Bot! Let's have some fun with spelling! Are you ready?",
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  async presentNextWord(): Promise<string> {
    const word = this.gameManager.getNextWord();

    if (!word) {
      return "Wow! We've gone through all the words! You did an amazing job! Your final score is " + this.gameState.score + " points!";
    }

    this.currentWordSpoken = true;
    this.spellingValidator.reset();
    this.spellingValidator.startCapture();

    const sentences: { [key: string]: string } = {
      apple: "I ate a delicious red apple for lunch.",
      banana: "The monkey loves to eat a yellow banana.",
      cat: "My pet cat likes to sleep in the sun.",
      dog: "The friendly dog wagged its tail.",
      elephant: "The elephant has a very long trunk.",
      flower: "The flower smells wonderful.",
      garden: "We planted vegetables in the garden.",
      happy: "She felt happy on her birthday.",
      island: "We visited a tropical island.",
      jungle: "The jungle is full of wild animals.",
    };

    const sentence = sentences[word.toLowerCase()] || `Here's a word you might know: ${word}.`;

    return `Your word is ${word}. ${sentence} Let me spell it for you: ${word.split('').join(', ')}. Again, your word is ${word}. Go ahead and spell it!`;
  }

  async handleUserSpeech(transcribedText: string): Promise<string> {
    if (this.isInterruption(transcribedText)) {
      return await this.handleInterruption(transcribedText);
    }

    if (!this.currentWordSpoken) {
      return "Let me give you a word first! Just a moment...";
    }

    this.spellingValidator.addText(transcribedText);

    return "";
  }

  async handleUserTurnEnd(): Promise<string> {
    if (!this.currentWordSpoken) {
      return "";
    }

    return await this.validateAndRespond();
  }

  private async validateAndRespond(): Promise<string> {
    const result = this.spellingValidator.stopCapture();

    console.log("🔍 Validation result:", result);

    if (!result) {
      console.log("❌ No result - user spelling was empty");
      return "Hmm, I didn't quite catch that. Could you spell the word again? Remember to say each letter clearly!";
    }

    this.currentWordSpoken = false;

    if (result.isCorrect) {
      const praise = [
        "Fantastic! That's absolutely correct! You spelled it perfectly!",
        "Excellent work! You got it right! That's the correct spelling!",
        "Amazing! You nailed it! Perfect spelling!",
        "Wonderful! That's exactly right! Great job!",
        "Brilliant! You spelled that word perfectly!",
      ];
      
      const response = praise[Math.floor(Math.random() * praise.length)];
      console.log("✅ Correct spelling! Score:", this.gameState.score);
      return `${response} Your score is now ${this.gameState.score} points! Ready for the next word?`;
    } else {
      const encouragement = [
        "Not quite, but that was a great try!",
        "Good effort! Let me help you with that one.",
        "Nice attempt! Here's the correct spelling:",
        "You're doing great! Let me show you the right way:",
      ];
      
      const response = encouragement[Math.floor(Math.random() * encouragement.length)];
      console.log("❌ Incorrect spelling. User said:", result.userSpelling, "Correct:", this.gameState.currentWord);
      return `${response} The correct spelling is ${this.gameState.currentWord.split('').join(', ')}. Your score is ${this.gameState.score} points. Want to try another word?`;
    }
  }

  private isInterruption(text: string): boolean {
    const interruptionPhrases = [
      "wait",
      "stop",
      "hold on",
      "repeat",
      "say that again",
      "what was that",
      "can you repeat",
      "pause",
    ];

    const lowerText = text.toLowerCase();
    return interruptionPhrases.some((phrase) => lowerText.includes(phrase));
  }

  private async handleInterruption(text: string): Promise<string> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("repeat") || lowerText.includes("again")) {
      return `Of course! Let me repeat that. Your word is ${this.gameState.currentWord}. ${this.gameState.currentWord.split('').join(', ')}. Again, ${this.gameState.currentWord}.`;
    }
    
    if (lowerText.includes("wait") || lowerText.includes("hold")) {
      return "No problem! Take your time. Let me know when you're ready!";
    }
    
    if (lowerText.includes("stop")) {
      return "Okay, I'll pause. Just say 'continue' when you want to keep going!";
    }
    
    return "Sure thing! What can I help you with?";
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getGameStats() {
    return this.gameManager.getGameStats();
  }

  resetGame(): void {
    this.gameManager.resetGame();
    this.spellingValidator.reset();
    this.currentWordSpoken = false;
  }
}
