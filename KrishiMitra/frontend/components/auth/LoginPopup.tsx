"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Bot, User as UserIcon, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPopup() {
  const { isAuthenticated, login, register, isMounted } = useAuth();
  
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isMounted) return null;
  if (isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (isRegisterMode) {
      if (!nameInput.trim()) {
        setErrorMsg("Name is required");
        return;
      }
      const res = register(nameInput, emailInput, passInput);
      if (!res.success) setErrorMsg(res.error || "Failed to register.");
    } else {
      const res = login(emailInput, passInput);
      if (!res.success) setErrorMsg(res.error || "Failed to login.");
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 pb-0.5">
            <Bot size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRegisterMode ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-400 text-sm">
            {isRegisterMode 
              ? "Join KrishiMitra to access personalized agricultural intelligence."
              : "Sign in to access your farm intelligence dashboard."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div className="relative">
              <UserIcon size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-green-500 transition-colors text-white"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-green-500 transition-colors text-white"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-green-500 transition-colors text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-green-900/20 mt-2"
          >
            {isRegisterMode ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isRegisterMode ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button" 
            onClick={toggleMode}
            className="text-green-400 hover:text-green-300 font-semibold transition-colors"
          >
            {isRegisterMode ? "Sign in" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
