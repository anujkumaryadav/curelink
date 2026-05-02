import { GoogleGenerativeAI } from "@google/generative-ai";
import { GameState } from "../types/game.js";
import { GameManager } from "../processors/GameManager.js";
import { SpellingValidator } from "../processors/SpellingValidator.js";

export interface BotConfig {
  geminiApiKey: string;
}

export class SpellBeeBot {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private gameState: GameState;
  private gameManager: GameManager;
  private spellingValidator: SpellingValidator;
  private conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  private isProcessing: boolean = false;
  private currentWordSpoken: boolean = false;

  constructor(config: BotConfig) {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    this.conversationHistory.push({
      role: "user",
      parts: [{ text: this.getSystemPrompt() }],
    });
    this.conversationHistory.push({
      role: "model",
      parts: [{ text: "I understand! I'm Disha Bot, your enthusiastic learning assistant ready to help you improve your spelling!" }],
    });
  }

  private getSystemPrompt(): string {
    return `You are Disha Bot, a friendly and encouraging learning assistant! Your personality is:

- Warm and supportive, celebrating both successes and efforts
- Clear and articulate when speaking words
- Patient and understanding with mistakes
- Uses encouraging phrases like "Great job!", "Excellent!", "Nice work!"
- Keeps responses SHORT and focused (2-3 sentences maximum)

Your responsibilities:
1. Greet players briefly (1-2 sentences only)
2. Speak each word clearly
3. Provide immediate, brief feedback
4. Keep track of the score
5. Handle interruptions gracefully

When speaking a word:
- Say it clearly: "Your word is [WORD]"
- Use it in a short sentence
- Repeat it once: "Again, [WORD]"

When giving feedback:
- If correct: Brief praise! "Excellent! That's correct! Score: [SCORE]"
- If incorrect: Brief encouragement! "Not quite. The correct spelling is [WORD]. Score: [SCORE]"

CRITICAL: Keep ALL responses under 3 sentences. Be concise and natural.`;
  }

  async startGame(): Promise<string> {
    this.gameState.isActive = true;
    this.gameManager.resetGame();

    const greeting = await this.generateResponse(
      "Give a brief, friendly greeting (2 sentences max) and say you're ready to start the spelling game."
    );

    return greeting;
  }

  async presentNextWord(): Promise<string> {
    const word = this.gameManager.getNextWord();

    if (!word) {
      return "We've gone through all the words! Great job!";
    }

    this.currentWordSpoken = true;
    this.spellingValidator.reset();
    this.spellingValidator.startCapture();

    const prompt = `Present the word "${word}" briefly. Format: "Your word is ${word}. [One short sentence using the word]. Again, ${word}." Keep it under 3 sentences total.`;

    const response = await this.generateResponse(prompt);

    return response;
  }

  async handleUserSpeech(transcribedText: string): Promise<string> {
    if (this.isInterruption(transcribedText)) {
      return await this.handleInterruption(transcribedText);
    }

    if (!this.currentWordSpoken) {
      return await this.generateResponse(transcribedText);
    }

    this.spellingValidator.addText(transcribedText);

    if (this.isSpellingComplete(transcribedText)) {
      return await this.validateAndRespond();
    }

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

    if (!result) {
      return "I didn't catch that. Could you spell the word again?";
    }

    this.currentWordSpoken = false;

    const feedbackPrompt = result.isCorrect
      ? `The player spelled "${this.gameState.currentWord}" CORRECTLY. Give brief praise (1 sentence). Mention score: ${this.gameState.score}. Ask if ready for next word (1 sentence). Total: 2-3 sentences max.`
      : `The player spelled "${this.gameState.currentWord}" INCORRECTLY as "${result.userSpelling}". Correct spelling is "${this.gameState.currentWord}". Be brief and encouraging (2 sentences). Mention score: ${this.gameState.score}. Ask if they want another word (1 sentence). Total: 3 sentences max.`;

    const feedback = await this.generateResponse(feedbackPrompt);

    return feedback;
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
    const prompt = `The player interrupted with: "${text}". Respond naturally and helpfully. If they want you to repeat the word, say the current word "${this.gameState.currentWord}" again clearly.`;

    return await this.generateResponse(prompt);
  }

  private isSpellingComplete(text: string): boolean {
    const completionPhrases = ["done", "finished", "that's it", "complete"];
    const lowerText = text.toLowerCase();
    return completionPhrases.some((phrase) => lowerText.includes(phrase));
  }

  private async generateResponse(userMessage: string): Promise<string> {
    if (this.isProcessing) {
      return "";
    }

    this.isProcessing = true;

    try {
      const chat = this.model.startChat({
        history: this.conversationHistory,
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.8,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response.text();

      this.conversationHistory.push({
        role: "user",
        parts: [{ text: userMessage }],
      });
      this.conversationHistory.push({
        role: "model",
        parts: [{ text: response }],
      });

      if (this.conversationHistory.length > 20) {
        this.conversationHistory = [
          this.conversationHistory[0],
          this.conversationHistory[1],
          ...this.conversationHistory.slice(-15),
        ];
      }

      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      return "I'm having trouble right now. Let's try again!";
    } finally {
      this.isProcessing = false;
    }
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
    
    this.conversationHistory = [
      this.conversationHistory[0],
      this.conversationHistory[1],
    ];
  }
}
