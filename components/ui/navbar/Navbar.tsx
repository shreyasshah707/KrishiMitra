"use client";

import { Bell, Search, User, LogOut, ChevronDown, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useState } from "react";

const initialNotifications = [
  {
    id: 1,
    type: 'alert',
    title: 'Moisture Alert: Field A',
    message: 'Soil moisture is below 30%. Irrigation recommended soon.',
    time: '10 min ago'
  },
  {
    id: 2,
    type: 'success',
    title: 'Crop Analysis Ready',
    message: 'Latest drone imagery analysis has been processed successfully.',
    time: '2 hours ago'
  },
  {
    id: 3,
    type: 'info',
    title: 'Weather Update',
    message: 'Expected rainfall in your area tomorrow afternoon.',
    time: 'Yesterday'
  }
];

export default function Navbar() {
  const { userName, logout, isAuthenticated } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

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

        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showDropdown) setShowDropdown(false);
            }}
            className="relative p-2 rounded-full hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <Bell className="text-slate-400 hover:text-white" size={22} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full outline outline-2 outline-slate-950"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
              <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    {notifications.length} New
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif, index) => (
                    <div 
                      key={notif.id}
                      className={`p-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${index !== notifications.length - 1 ? 'border-b border-slate-800/50' : ''}`}
                      onClick={() => {
                        // Mark individual as read (optional logic here)
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          notif.type === 'alert' ? 'bg-red-500/10 text-red-500' : 
                          notif.type === 'success' ? 'bg-green-500/10 text-green-500' : 
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {notif.type === 'alert' && <AlertCircle size={16} />}
                          {notif.type === 'success' && <CheckCircle2 size={16} />}
                          {notif.type === 'info' && <Info size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{notif.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-slate-800 bg-slate-900/80">
                  <button 
                    onClick={() => setNotifications([])}
                    className="w-full py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="relative">
            <button 
              onClick={() => {
                setShowDropdown(!showDropdown);
                if (showNotifications) setShowNotifications(false);
              }}
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