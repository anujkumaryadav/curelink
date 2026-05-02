"use client";

import { useState, useEffect, useRef } from "react";
import { GameState, BotMessage } from "@/lib/types";
import { useWebSocket } from "@/lib/useWebSocket";
import { FaMicrophone } from "react-icons/fa6";
import { HiArrowLongRight } from "react-icons/hi2";

interface GameInterfaceProps {
  sessionId: string;
}

export default function GameInterface({
  sessionId,
}: GameInterfaceProps) {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    totalWords: 0,
    correctCount: 0,
    incorrectCount: 0,
    wordNumber: 0,
    currentWord: "",
    lastSpelling: "",
    lastResult: null,
    isActive: false,
  });

  const [botMessages, setBotMessages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { isConnected, sendMessage } = useWebSocket({
    sessionId,
    onMessage: handleBotMessage,
    onGameStateUpdate: setGameState,
  });

  function handleBotMessage(message: BotMessage) {
    if (message.type === "bot_speech" && message.text) {
      setBotMessages((prev) => [...prev, message.text!]);
    }

    if (message.type === "ready") {
      console.log("Bot is ready");
    }
  }

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        console.log("🎤 Listening...");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("📝 Heard:", transcript);
        
        if (event.results[0].isFinal) {
          console.log("✅ Final transcript:", transcript);
          
          sendMessage({
            type: "user_speech",
            text: transcript,
          });

          setTimeout(() => {
            sendMessage({ type: "user_speech_end" });
          }, 500);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("🎤 Stopped listening");
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const startGame = () => {
    sendMessage({ type: "start_game" });
    setGameStarted(true);
  };

  const requestNextWord = () => {
    sendMessage({ type: "next_word" });
  };

  const resetGame = () => {
    sendMessage({ type: "reset_game" });
    setBotMessages([]);
    setGameStarted(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [botMessages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-offwhite p-4 md:p-8 relative">
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl pointer-events-none" 
           style={{ 
             background: 'radial-gradient(circle, #E08060 0%, #E8A882 40%, transparent 70%)',
             transform: 'translate(-50%, -50%)',
             animation: 'glow 8s ease-in-out infinite'
           }}></div>
      <div className="max-w-7xl mx-auto relative z-10">
    

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="backdrop-blur-xl rounded-3xl shadow-2xl border border-apricot p-6 md:p-8 bg-white/85">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-espresso flex items-center gap-3 font-playfair">
                  <svg className="w-7 h-7 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Voice Interface
                </h2>
              </div>
              
              <div className="rounded-2xl overflow-hidden backdrop-blur-sm border border-apricot p-8 md:p-7" 
                   style={{ background: 'rgba(242, 206, 173, 0.3)' }}>
                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-xl" 
                       style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}>
                    <FaMicrophone className="text-white" size={30}/>
                  </div>
                
                </div>

                {gameStarted && (
                  <div className="space-y-6">
                    <div className="text-center">
                      {!isListening && (
                        <p className="text-espresso font-medium">Ready to spell? Click below</p>
                      )}
                      {isListening && (
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-1 h-8 bg-coral rounded-full animate-pulse"></div>
                            <div className="w-1 h-10 bg-coral rounded-full animate-pulse delay-75"></div>
                            <div className="w-1 h-6 bg-coral rounded-full animate-pulse delay-150"></div>
                            <div className="w-1 h-9 bg-coral rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-terracotta font-bold text-lg">Listening...</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center">
                      {!isListening ? (
                        <button
                          onClick={startListening}
                          className="group text-offwhite font-bold py-5 px-10 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                          style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}
                        >
                          <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                          <span className="text-lg">Start Speaking</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopListening}
                          className="bg-red text-offwhite font-bold py-5 px-10 rounded-2xl shadow-2xl transition-all duration-300 flex items-center gap-3 animate-pulse-mic"
                        >
                          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          <span className="text-lg">Stop</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="backdrop-blur-xl rounded-3xl shadow-2xl border border-apricot p-6 md:p-8 bg-white/85">
              <h2 className="text-2xl font-bold text-espresso mb-6 flex items-center gap-3 font-playfair">
                <svg className="w-7 h-7 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Conversation
              </h2>
              
              <div className="h-80 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                {botMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" 
                         style={{ background: 'rgba(242, 206, 173, 0.3)' }}>
                      <svg className="w-9 h-9 text-espresso/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-espresso/70 font-medium">Start the game to begin your learning journey!</p>
                  </div>
                ) : (
                  botMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="backdrop-blur-sm rounded-2xl p-5 border border-apricot transition-all duration-300 animate-msgslide"
                      style={{ background: 'rgba(242, 206, 173, 0.3)' }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" 
                             style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}>
                          <svg className="w-6 h-6 text-offwhite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-espresso leading-relaxed">{msg}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="backdrop-blur-xl rounded-3xl shadow-2xl border border-apricot p-6 bg-white/85">
              <div className="flex gap-4">
                {!gameStarted ? (
                  <button
                    onClick={startGame}
                    disabled={!isConnected}
                    className="flex-1 bg-[#432C20] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-3"
                    
                  >
                    Start Learning
                  </button>
                ) : (
                  <>
                    <button
                      onClick={requestNextWord}
                      disabled={!isConnected}
                      className="flex-1 text-offwhite font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}
                    >
                      <HiArrowLongRight />

                      Next Word
                    </button>
                    <button
                      onClick={resetGame}
                      className="flex-1 text-espresso font-bold py-4 px-6 rounded-2xl transition-all duration-300 border border-apricot hover:scale-[1.02] flex items-center justify-center gap-2"
                      style={{ background: 'rgba(242, 206, 173, 0.3)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="backdrop-blur-xl rounded-3xl shadow-2xl border border-apricot p-8" 
                 style={{ background: 'rgba(242, 206, 173, 0.4)' }}>
              <h2 className="text-xl font-bold text-espresso mb-6 text-center font-playfair">Your Score</h2>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full shadow-2xl mb-4" 
                     style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}>
                  <span className="text-4xl font-black text-offwhite">{gameState.score}</span>
                </div>
                <p className="text-espresso/70 font-medium">total score</p>
              </div>
            </div>

            <div className="backdrop-blur-xl rounded-3xl shadow-2xl border border-apricot p-6 bg-white/85">
              <h2 className="text-xl font-bold text-espresso mb-6 flex items-center gap-2 font-playfair">
                <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistics
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl" 
                     style={{ background: 'rgba(242, 206, 173, 0.3)' }}>
                  <span className="text-espresso">Words Attempted</span>
                  <span className="font-bold text-espresso text-lg">{gameState.totalWords}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-green" 
                     style={{ background: 'rgba(90, 158, 114, 0.1)' }}>
                  <span className="text-green">Correct</span>
                  <span className="font-bold text-green text-lg">{gameState.correctCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-red" 
                     style={{ background: 'rgba(193, 82, 58, 0.1)' }}>
                  <span className="text-red">Incorrect</span>
                  <span className="font-bold text-red text-lg">{gameState.incorrectCount}</span>
                </div>
                {gameState.totalWords > 0 && (
                  <div className="pt-4 border-t border-apricot">
                    <div className="flex justify-between items-center p-3 rounded-xl border border-coral" 
                         style={{ background: 'rgba(224, 128, 96, 0.15)' }}>
                      <span className="text-terracotta">Accuracy</span>
                      <span className="font-bold text-terracotta text-xl">
                        {Math.round((gameState.correctCount / gameState.totalWords) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {gameState.currentWord && (
              <div className="backdrop-blur-xl rounded-3xl shadow-2xl border border-apricot p-6" 
                   style={{ background: 'rgba(242, 206, 173, 0.4)' }}>
                <h2 className="text-lg font-bold text-espresso mb-3 text-center font-playfair">Current Word</h2>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-xl" 
                       style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}>
                    <span className="text-3xl font-black text-offwhite">#{gameState.wordNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
