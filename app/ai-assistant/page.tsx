"use client";

import { useState, useEffect } from "react";
import { Bot, User, Send, MapPin, Cloud, Leaf, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function AIAssistantPage() {
  const { userName } = useAuth();

  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hello ${userName || 'Guest'}! I'm your KrishiMitra AI Assistant. I have live access to your farm's sensors, weather data, and satellite imagery. How can I help you today?` }
  ]);

  useEffect(() => {
    if (userName) {
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[0].role === 'ai' && newMessages[0].text.includes('Hello')) {
          newMessages[0] = { ...newMessages[0], text: `Hello ${userName}! I'm your KrishiMitra AI Assistant. I have live access to your farm's sensors, weather data, and satellite imagery. How can I help you today?` };
        }
        return newMessages;
      });
    }
  }, [userName]);

  const [inputValue, setInputValue] = useState("");

  const suggestedPrompts = [
    "How is my farm doing?",
    "Best crop this season?",
    "Explain NDVI",
    "Why is soil score low?",
    "What irrigation schedule should I follow?"
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue("");

    // Fake AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "Based on the current meteorological patterns and your soil's organic carbon levels, I strongly suggest maintaining the current irrigation schedule. Your NDVI looks excellent. For specific crop suitability, Soybean remains your most profitable option with an 87% confidence rate." }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="text-green-500" /> KrishiMitra AI Assistant
        </h1>
        <p className="text-slate-400 mt-1">Context-aware AI agricultural assistant powered by real-time data.</p>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-transparent">

        {/* Chat Interface */}
        <div className="lg:col-span-2 xl:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col relative overflow-hidden">
          {/* Chat Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 mt-1">
                    <Bot size={20} className="text-green-500" />
                  </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-green-600 text-white rounded-tr-sm' : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User size={20} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="px-6 py-2 flex gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
            {suggestedPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-green-500 transition-colors rounded-full text-xs text-slate-300"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Ask your agricultural intelligence..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-green-500 transition-colors text-sm"
              />
              <button
                onClick={() => handleSend(inputValue)}
                className="absolute right-3 p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Context Panel */}
        <div className="hidden lg:flex lg:col-span-1 border border-slate-800 bg-slate-900/50 rounded-xl flex-col p-6 space-y-6 overflow-y-auto">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">Active Context</h2>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><MapPin size={16} className="text-blue-400" /> Farm Data</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between"><span>Selected:</span><span className="text-white font-medium">North Sector</span></div>
              <div className="flex justify-between"><span>Area:</span><span className="text-white font-medium">12.4 Acres</span></div>
              <div className="flex justify-between"><span>Active Crop:</span><span className="text-white font-medium">None (Prep Phase)</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Cloud size={16} className="text-slate-400" /> Weather Context</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between"><span>Current Status:</span><span className="text-white font-medium">28°C, Partly Cloudy</span></div>
              <div className="flex justify-between"><span>Short-term:</span><span className="text-white font-medium">Rain expected Tue</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Leaf size={16} className="text-green-500" /> Soil Context</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between"><span>Score:</span><span className="text-green-400 font-bold">72 (Healthy)</span></div>
              <div className="flex justify-between"><span>Moisture:</span><span className="text-white font-medium">42% (Optimal)</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><AlertTriangle size={16} className="text-yellow-500" /> Risk Context</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between underline border-red-500"><span>Heat Stress:</span><span className="text-red-400 font-bold">High (Next month)</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
