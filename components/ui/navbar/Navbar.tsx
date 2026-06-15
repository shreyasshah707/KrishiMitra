"use client";

import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { userName, logout, isAuthenticated } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="flex items-center justify-between xl:mb-8 mb-4">
      <div className="relative w-full max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-3 text-slate-400"
        />

        <input
          placeholder="Search location, farm, crop..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-green-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-5">
        <select className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl outline-none text-sm appearance-none cursor-pointer">
          <option>English</option>
          <option>Hindi</option>
        </select>

        <button className="relative p-2 rounded-full hover:bg-slate-800 transition-colors">
          <Bell className="text-slate-400 hover:text-white" size={22} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {isAuthenticated && (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center border border-green-500/30">
                <span className="text-green-500 font-bold text-sm">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-200 hidden md:block max-w-[100px] truncate">{userName}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{userName}</p>
                </div>
                <div className="p-1">
                  <button 
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}