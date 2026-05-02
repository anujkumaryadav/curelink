"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaMicrophone } from "react-icons/fa6";
import { MdArrowOutward } from "react-icons/md";

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  const handleStartGame = async () => {
    console.log("🎮 Start Learning button clicked!");
    setIsCreating(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7860";
      console.log("📡 Connecting to backend:", backendUrl);
      
      const response = await fetch(
        `${backendUrl}/api/session/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      console.log("✅ Session created:", data);
      console.log("🚀 Navigating to:", `/game/${data.sessionId}`);
      
      router.push(`/game/${data.sessionId}`);
    } catch (err) {
      console.error("❌ Error:", err);
      setError("Failed to start game. Please try again.");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#2D1A12] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full opacity-40 blur-3xl pointer-events-none" 
           ></div>
      
      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-24 md:h-24 rounded-xl md:rounded-3xl shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300 animate-iconbob" 
               style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}>
            <FaMicrophone size={30} className="text-white"/>

          </div>
          
          <h1 className="text-4xl md:text-7xl font-black text-[#FAF7F5] mb-4 tracking-tight font-playfair">
            Meet <span className="text-[#E8A882] italic">Disha</span> your coach.

          </h1>
          
          <div className="inline-block bg-[#432C20] px-4 py-1 md:px-6 md:py-2 backdrop-blur-md rounded-full border border-[#6E4B39] mb-6 mt-4" 
               >
            <p className="text-base md:text-xl text-[#E8A882] font-medium">
              AI-Powered Voice Learning Assistant
            </p>
          </div>
          
          <p className="text-sm md:text-lg text-[#94857E] max-w-2xl mx-auto">
            Master spelling through interactive voice conversations with advanced AI technology
          </p>
        </div>

                <button
            onClick={handleStartGame}
            disabled={isCreating}
            className="group w-full text-offwhite font-bold py-3 px-5 md:py-4 md:px-0 rounded-xl md:rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #E08060, #C1523A)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                 style={{ background: 'linear-gradient(135deg, #C1523A, #E08060)' }}></div>
            
            <span className="relative flex items-center justify-center gap-3 text-xl md:text-2xl">
              {isCreating ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6 text-offwhite"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Preparing Your Session...
                </>
              ) : (
                <>
                  Start Now
                  <MdArrowOutward />


                </>
              )}
            </span>
          </button>

      </div>
    </main>
  );
}
