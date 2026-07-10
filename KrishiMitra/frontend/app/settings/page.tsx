"use client";

import { useState } from "react";
import { Settings2, Globe, Bell, Map as MapIcon, Database, Bot, Check, LogOut } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function SettingsPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("General");
  const [prefs, setPrefs] = useState({
     lang: 'English',
     units: 'Metric (°C, mm, kg/ha)',
     emailNotif: true,
     smsNotif: false,
     mapTheme: 'Satellite (Dark)',
     aiAutonomy: true
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  const tabs = [
    { title: "General", icon: Settings2 },
    { title: "Localisation", icon: Globe },
    { title: "Notifications", icon: Bell },
    { title: "Map Preferences", icon: MapIcon },
    { title: "Data & Privacy", icon: Database },
    { title: "AI Assistant", icon: Bot },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings2 className="text-green-500" /> Platform Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure your dashboard preferences and AI thresholds.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
         {/* Tabs */}
         <div className="w-full md:w-64 shrink-0 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.title;
              return (
                <button 
                  key={tab.title}
                  onClick={() => setActiveTab(tab.title)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
                >
                  <Icon size={18} /> {tab.title}
                </button>
              )
            })}
         </div>

         {/* Content Area */}
         <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm h-[600px] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-slate-800">{activeTab}</h2>

            <div className="space-y-8 max-w-2xl">
              
              {(activeTab === "General" || activeTab === "Localisation") && (
                <>
                  <div className="space-y-3">
                     <label className="block text-sm font-semibold text-slate-400 uppercase tracking-widest">Language</label>
                     <select 
                       value={prefs.lang} 
                       onChange={(e) => setPrefs({...prefs, lang: e.target.value})}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-green-500 text-slate-200"
                     >
                       <option>English</option>
                       <option>Hindi</option>
                       <option>Marathi</option>
                     </select>
                  </div>
                  
                  <div className="space-y-3">
                     <label className="block text-sm font-semibold text-slate-400 uppercase tracking-widest">Unit System</label>
                     <select 
                       value={prefs.units} 
                       onChange={(e) => setPrefs({...prefs, units: e.target.value})}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-green-500 text-slate-200"
                     >
                       <option>Metric (°C, mm, kg/ha)</option>
                       <option>Imperial (°F, inches, lbs/acre)</option>
                     </select>
                  </div>

                  {activeTab === "General" && (
                    <div className="border-t border-slate-800 pt-6 mt-8">
                      <h4 className="font-semibold text-white mb-2">Account Actions</h4>
                      <p className="text-sm text-slate-400 mb-4">Sign out of your KrishiMitra account on this device.</p>
                      <button 
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold rounded-xl transition-colors"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  )}
                </>
              )}

              {activeTab === "Notifications" && (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                     <div>
                       <h4 className="font-semibold text-white">Email Daily Digest</h4>
                       <p className="text-sm text-slate-400">Receive morning summary of farm health.</p>
                     </div>
                     <button 
                       onClick={() => toggle('emailNotif')}
                       className={`relative w-12 h-6 rounded-full transition-colors ${prefs.emailNotif ? 'bg-green-500' : 'bg-slate-700'}`}
                     >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${prefs.emailNotif ? 'left-7' : 'left-1'}`}></span>
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                     <div>
                       <h4 className="font-semibold text-white">SMS Critical Alerts</h4>
                       <p className="text-sm text-slate-400">Immediate text for high-risk climate events.</p>
                     </div>
                     <button 
                       onClick={() => toggle('smsNotif')}
                       className={`relative w-12 h-6 rounded-full transition-colors ${prefs.smsNotif ? 'bg-green-500' : 'bg-slate-700'}`}
                     >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${prefs.smsNotif ? 'left-7' : 'left-1'}`}></span>
                     </button>
                  </div>
                </>
              )}

              {activeTab === "Map Preferences" && (
                <div className="grid grid-cols-2 gap-4">
                   {['Satellite (Dark)', 'Topo (Light)', 'Standard'].map(theme => (
                     <div 
                       key={theme} 
                       onClick={() => setPrefs({...prefs, mapTheme: theme})}
                       className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-colors ${prefs.mapTheme === theme ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}
                     >
                        <span className="font-medium">{theme}</span>
                        {prefs.mapTheme === theme && <Check size={18} className="text-green-500"/>}
                     </div>
                   ))}
                </div>
              )}

              {activeTab === "AI Assistant" && (
                <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                   <div className="pr-12">
                     <h4 className="font-semibold text-white">AI Agent Autonomy</h4>
                     <p className="text-sm text-slate-400 mt-1">Allow the Copilot to autonomously aggregate data from 3rd party climate APIs directly into your prompt context for superior insight accuracy.</p>
                   </div>
                   <button 
                     onClick={() => toggle('aiAutonomy')}
                     className={`relative w-12 h-6 rounded-full transition-colors shrink-0 mt-2 ${prefs.aiAutonomy ? 'bg-green-500' : 'bg-slate-700'}`}
                   >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${prefs.aiAutonomy ? 'left-7' : 'left-1'}`}></span>
                   </button>
                </div>
              )}

              <div className="border-t border-slate-800 pt-6 mt-8 flex justify-end">
                 <button className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-900/20">
                   Save Changes
                 </button>
              </div>

            </div>
         </div>
      </div>
    </div>
  );
}
