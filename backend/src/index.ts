import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import { SpellBeeBot } from "./bot/SpellBeeBot.js";
import { DemoBot } from "./bot/DemoBot.js";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 7860;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const USE_DEMO_MODE = !GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here";

const activeSessions = new Map<string, { bot: SpellBeeBot | DemoBot; ws: WebSocket }>();

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/session/create", async (req, res) => {
  try {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log("✅ Session created:", sessionId);
    console.log(USE_DEMO_MODE ? "🎮 Using Demo Mode" : "🤖 Using Gemini");

    res.json({
      sessionId,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      demoMode: USE_DEMO_MODE,
    });
  } catch (error: any) {
    console.error("❌ Error creating session:", error.message || error);
    res.status(500).json({ 
      error: "Failed to create session",
      details: error.message || "Unknown error"
    });
  }
});

app.get("/api/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    res.json({
      sessionId,
      active: true,
    });
  } catch (error) {
    res.status(404).json({ error: "Session not found" });
  }
});

app.delete("/api/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = activeSessions.get(sessionId);
    if (session) {
      session.ws.close();
      activeSessions.delete(sessionId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket connection");

  let sessionBot: SpellBeeBot | null = null;
  let sessionId: string | null = null;

  ws.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "init":
          sessionId = message.sessionId;
          
          if (USE_DEMO_MODE) {
            console.log("🎮 Initializing Demo Bot");
            sessionBot = new DemoBot();
          } else {
            console.log("🤖 Initializing Gemini Bot");
            sessionBot = new SpellBeeBot({
              geminiApiKey: GEMINI_API_KEY!,
            });
          }

          activeSessions.set(sessionId, { bot: sessionBot as any, ws });

          ws.send(
            JSON.stringify({
              type: "ready",
              sessionId,
            })
          );
          break;

        case "start_game":
          if (sessionBot) {
            const greeting = await sessionBot.startGame();
            ws.send(
              JSON.stringify({
                type: "bot_speech",
                text: greeting,
                action: "greeting",
              })
            );

            setTimeout(async () => {
              const wordPresentation = await sessionBot!.presentNextWord();
              ws.send(
                JSON.stringify({
                  type: "bot_speech",
                  text: wordPresentation,
                  action: "present_word",
                  gameState: sessionBot!.getGameState(),
                })
              );
            }, 2000);
          }
          break;

        case "user_speech":
          console.log("📝 Received user speech:", message.text);
          if (sessionBot) {
            try {
              const response = await sessionBot.handleUserSpeech(message.text);

              if (response) {
                console.log("🤖 Bot response:", response);
                ws.send(
                  JSON.stringify({
                    type: "bot_speech",
                    text: response,
                    gameState: sessionBot.getGameState(),
                  })
                );
              }
            } catch (error) {
              console.error("❌ Error handling user speech:", error);
            }
          }
          break;

        case "user_speech_end":
          console.log("🎤 User finished speaking");
          if (sessionBot) {
            try {
              const response = await sessionBot.handleUserTurnEnd();

              if (response) {
                console.log("🤖 Bot feedback:", response);
                ws.send(
                  JSON.stringify({
                    type: "bot_speech",
                    text: response,
                    action: "feedback",
                    gameState: sessionBot.getGameState(),
                  })
                );
              }
            } catch (error) {
              console.error("❌ Error handling turn end:", error);
            }
          }
          break;

        case "next_word":
          if (sessionBot) {
            const wordPresentation = await sessionBot.presentNextWord();
            ws.send(
              JSON.stringify({
                type: "bot_speech",
                text: wordPresentation,
                action: "present_word",
                gameState: sessionBot.getGameState(),
              })
            );
          }
          break;

        case "get_stats":
          if (sessionBot) {
            ws.send(
              JSON.stringify({
                type: "game_stats",
                stats: sessionBot.getGameStats(),
              })
            );
          }
          break;

        case "reset_game":
          if (sessionBot) {
            sessionBot.resetGame();
            ws.send(
              JSON.stringify({
                type: "game_reset",
                gameState: sessionBot.getGameState(),
              })
            );
          }
          break;

        default:
          console.log("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    if (sessionId) {
      activeSessions.delete(sessionId);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

server.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎤 Disha Bot Server Started`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📡 Server:     http://localhost:${PORT}`);
  console.log(`🔌 WebSocket:  ws://localhost:${PORT}`);
  console.log(`💚 Health:     http://localhost:${PORT}/health`);
  console.log(`${"=".repeat(60)}`);
  
  console.log(`\n🔑 API Keys Status:`);
  console.log(`   Gemini:    ${GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_api_key_here" ? "✅ Set" : "❌ Not set"}`);
  
  if (USE_DEMO_MODE) {
    console.log(`\n🎮 DEMO MODE ENABLED`);
    console.log(`   Running without Gemini - using pre-written responses`);
    console.log(`   Perfect for testing and demonstrations!`);
    console.log(`   To use Gemini: Add valid API key to backend/.env\n`);
  } else {
    console.log(`\n✅ Gemini Mode - Using gemini-2.5-flash model\n`);
  }
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
