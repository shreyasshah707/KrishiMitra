"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickAIWidget() {
  const [message, setMessage] = useState("");
  const router = useRouter();

  const askAI = () => {
    if (!message.trim()) return;

    router.push(
      `/ai-assistant?prompt=${encodeURIComponent(message)}`
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-4">
      <h3 className="font-semibold mb-3">
        Quick AI Assistant
      </h3>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask about crops, weather, soil..."
        className="w-full h-24 rounded-lg bg-slate-700 border border-slate-700 p-3 text-sm"
      />

      <button
        onClick={askAI}
        className="mt-3 w-full bg-green-600 hover:bg-green-500 rounded-lg py-2 font-medium"
      >
        Ask AI →
      </button>
    </div>
  );
}