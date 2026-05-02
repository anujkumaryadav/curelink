"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GameInterface from "@/components/GameInterface";
import { SessionInfo } from "@/lib/types";

export default function GamePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7860";
        const response = await fetch(
          `${backendUrl}/api/session/${sessionId}`
        );

        if (!response.ok) {
          throw new Error("Session not found");
        }

        const data = await response.json();
        setSessionInfo(data);
      } catch (err) {
        setError("Failed to load session. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading game session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Session Not Found
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameInterface
      sessionId={sessionId}
    />
  );
}
