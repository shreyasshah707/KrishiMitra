"use client";

import { useState } from "react";
import { MapPin, Plus, Sprout, Target, CloudRain, Droplets, Map as MapIcon, ShieldCheck } from "lucide-react";

const initialFarms = [
  { id: 1, name: 'North Sector', area: '12.4 acres', crop: 'Soybean', score: 88, location: 'Pune, MH' },
  { id: 2, name: 'South Valley', area: '45.0 acres', crop: 'Fallow', score: 65, location: 'Nashik, MH' },
  { id: 3, name: 'East Ridge', area: '18.2 acres', crop: 'Cotton', score: 92, location: 'Pune, MH' },
];

export default function FarmManagementPage() {
  const [farmsList, setFarmsList] = useState(initialFarms);
  const [activeFarm, setActiveFarm] = useState(initialFarms[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmArea, setNewFarmArea] = useState("");

  const handleAddFarm = () => {
    if (!newFarmName) return;
    
    const newFarm = {
      id: Date.now(),
      name: newFarmName,
      area: `${newFarmArea || '10.0'} acres`,
      crop: 'Pending Planting',
      score: 100,
      location: 'New Plot, MH'
    };

    setFarmsList([...farmsList, newFarm]);
    setActiveFarm(newFarm);
    setShowAddModal(false);
    setNewFarmName("");
    setNewFarmArea("");
  };

  return (
    <div className="flex flex-col h-full gap-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapIcon className="text-green-500" /> Farm Portfolio
          </h1>
          <p className="text-slate-400 mt-1">Manage boundaries, view operational metrics, and add new holding assets.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium transition-colors border border-green-500 shadow-lg shadow-green-900/20"
        >
          <Plus size={18} /> Add Farm
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
         {/* Farm List Sidebar */}
         <div className="lg:col-span-1 space-y-4">
           {farmsList.map(f => (
             <div 
               key={f.id} 
               onClick={() => setActiveFarm(f)}
               className={`bg-slate-900 border ${activeFarm.id === f.id ? 'border-green-500' : 'border-slate-800 hover:border-slate-700'} rounded-xl p-5 cursor-pointer transition-colors relative overflow-hidden group`}
             >
                {activeFarm.id === f.id && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-2xl rounded-full"></div>}
                
                <h3 className="font-bold text-lg mb-1">{f.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-3"><MapPin size={12}/> {f.location} • {f.area}</p>
                
                <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-3">
                   <div className="flex flex-col">
                     <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Crop</span>
                     <span className="font-medium text-slate-300 flex items-center gap-1 mt-0.5"><Sprout size={14} className="text-green-400"/> {f.crop}</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Health</span>
                     <span className={`font-bold mt-0.5 ${f.score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>{f.score}/100</span>
                   </div>
                </div>
             </div>
           ))}
         </div>

         {/* Farm Details View */}
         <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
           <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                 <h2 className="text-2xl font-bold mb-2">{activeFarm.name}</h2>
                 <div className="flex gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><MapPin size={14}/> {activeFarm.location}</span>
                    <span className="flex items-center gap-1"><Target size={14}/> {activeFarm.area}</span>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">Edit Details</button>
                 <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">Delete</button>
              </div>
           </div>
           
           {/* Detailed View Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-1 h-full min-h-[400px]">
              {/* Lightweight static map placeholder instead of full MapLibre */}
              <div className="md:col-span-2 relative h-64 md:h-full bg-slate-950 flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-slate-950 to-blue-950/20"></div>
                 {/* Static polygon visual */}
                 <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-60 relative z-10">
                   <polygon points="40,60 120,30 170,80 150,160 60,150" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" />
                   <polygon points="40,60 120,30 170,80 150,160 60,150" fill="#22c55e" fillOpacity="0.15" />
                   <text x="95" y="105" textAnchor="middle" fill="#94a3b8" fontSize="10">{activeFarm.name}</text>
                   <text x="95" y="120" textAnchor="middle" fill="#64748b" fontSize="8">{activeFarm.area}</text>
                 </svg>
                 <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded text-xs text-slate-400 z-10">
                   Farm Boundary Preview
                 </div>
              </div>
              <div className="bg-slate-900 p-6 space-y-6 flex flex-col justify-evenly">
                 <div>
                    <h4 className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-2 flex items-center gap-2"><Sprout size={14} className="text-green-500"/> Current Crop</h4>
                    <p className="text-xl font-bold">{activeFarm.crop}</p>
                 </div>
                 <div>
                    <h4 className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-2 flex items-center gap-2"><CloudRain size={14} className="text-blue-500"/> Est Rainfall</h4>
                    <p className="text-xl font-bold">120mm / mo</p>
                 </div>
                 <div>
                    <h4 className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-2 flex items-center gap-2"><Droplets size={14} className="text-cyan-500"/> Irrigation Need</h4>
                    <p className="text-xl font-bold">Low</p>
                 </div>
                 <div>
                    <h4 className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-2 flex items-center gap-2"><ShieldCheck size={14} className="text-yellow-500"/> Health Assessment</h4>
                    <p className={`text-3xl font-bold ${activeFarm.score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>{activeFarm.score}</p>
                    <p className="text-sm text-slate-400 mt-1">Status: Normal</p>
                 </div>
              </div>
           </div>
         </div>
      </div>

      {/* Mock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
              <h2 className="text-2xl font-bold mb-4">Add New Farm</h2>
              <p className="text-slate-400 text-sm mb-6">Enter farm details or upload a KML/Shapefile boundary.</p>
              
              <div className="space-y-4">
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Farm Name</label>
                   <input type="text" value={newFarmName} onChange={(e) => setNewFarmName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-green-500" placeholder="e.g. West Field" />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Total Area (Acres)</label>
                   <input type="number" value={newFarmArea} onChange={(e) => setNewFarmArea(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-green-500" placeholder="0.00" />
                 </div>
                 <div className="p-8 border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-xl text-center text-slate-400 cursor-pointer hover:bg-slate-800/50 hover:border-green-500 transition-colors">
                    <MapIcon className="mx-auto mb-2 text-slate-500" size={32} />
                    <p className="text-sm">Click to upload KML or Draw Polygon on Map</p>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors">Cancel</button>
                <button onClick={handleAddFarm} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors">Save Farm</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
