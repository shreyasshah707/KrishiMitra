"use client";

import { Tractor, Sprout, Droplets, Banknote, CalendarCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const crops = [
  { name: 'Soybean', suitability: '92%', yield: '2.5 t/ha', water: 'Med (450mm)', profit: 'High', rank: 1, color: 'text-green-400' },
  { name: 'Cotton', suitability: '84%', yield: '1.2 t/ha', water: 'Med-High', profit: 'High', rank: 2, color: 'text-blue-400' },
  { name: 'Maize', suitability: '78%', yield: '6.0 t/ha', water: 'High (600mm)', profit: 'Medium', rank: 3, color: 'text-yellow-500' },
  { name: 'Millets', suitability: '65%', yield: '1.5 t/ha', water: 'Low (300mm)', profit: 'Low-Med', rank: 4, color: 'text-orange-400' },
];

const yieldProjections = [
  { year: '2020', yield: 2.1 },
  { year: '2021', yield: 2.3 },
  { year: '2022', yield: 2.2 },
  { year: '2023', yield: 2.45 },
  { year: '2024 (Est)', yield: 2.6 },
];

// Matrix mock
const parameters = ['Soil pH', 'Rainfall', 'Temp', 'Elevation', 'Pest Risk'];
const cropMatrix = ['Soybean', 'Cotton', 'Maize', 'Millets', 'Wheat'];
const heatValues = [
  [9, 8, 9, 6, 8],
  [8, 7, 9, 5, 6],
  [7, 9, 8, 4, 7],
  [9, 4, 9, 6, 9],
  [6, 6, 7, 5, 8],
];

function getHeatColor(val: number) {
  if (val >= 8) return 'bg-green-500';
  if (val >= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function CropIntelligencePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Tractor className="text-green-500" /> Crop Intelligence
        </h1>
        <p className="text-slate-400 mt-1">Advanced analytics for optimal seed selection and yield optimization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {crops.map(crop => (
          <div key={crop.name} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative pt-8">
            <div className="absolute -top-3 left-4 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
              Rank {crop.rank}
            </div>
            <h2 className="text-2xl font-bold mb-4">{crop.name}</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2"><Sprout size={14} /> Suitability</span>
                <span className={`font-bold ${crop.color}`}>{crop.suitability}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2"><CalendarCheck size={14}/> Est. Yield</span>
                <span className="text-white">{crop.yield}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2"><Droplets size={14}/> Water Req</span>
                <span className="text-white">{crop.water}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2"><Banknote size={14}/> Profitability</span>
                <span className="text-white">{crop.profit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suitability Matrix Heatmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Crop Suitability Matrix</h2>
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th className="p-2 text-slate-400 text-xs font-semibold">CROP</th>
                {parameters.map(p => (
                  <th key={p} className="p-2 text-slate-400 text-xs font-semibold text-center">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cropMatrix.map((crop, i) => (
                <tr key={crop} className="border-t border-slate-800/50">
                  <td className="p-2 font-medium">{crop}</td>
                  {heatValues[i].map((val, idx) => (
                    <td key={idx} className="p-1">
                      <div className={`h-8 w-full rounded-md ${getHeatColor(val)} opacity-80 flex items-center justify-center font-semibold text-white/90 text-xs shadow-inner`}>
                         {val}/10
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Yield Projections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Soybean Yield Forecasting</h2>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={yieldProjections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="year" stroke="#94a3b8" />
                 <YAxis stroke="#94a3b8" />
                 <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                 <Bar dataKey="yield" fill="#22c55e" radius={[4, 4, 0, 0]} name="Yield (tons/hectare)" />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Irrigation Recommendations */}
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Irrigation Schedule</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-800/50 border border-blue-900/30 rounded-lg">
                 <div className="mt-1 text-blue-400"><Droplets size={20} /></div>
                 <div>
                   <h4 className="font-semibold text-blue-400">Light Irrigation Required</h4>
                   <p className="text-sm text-slate-300 mb-1">Within the next 24-48 hours</p>
                   <p className="text-xs text-slate-400 text-opacity-80">Apply roughly 15mm. Expected rainfall is insufficient for germination stages.</p>
                 </div>
              </div>
            </div>
         </div>

         {/* Fertilizer Guidance */}
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Fertilizer Guidance</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-800/50 border border-green-900/30 rounded-lg">
                 <div className="mt-1 text-green-400"><Sprout size={20} /></div>
                 <div>
                   <h4 className="font-semibold text-green-400">Nitrogen Top-dressing</h4>
                   <p className="text-sm text-slate-300 mb-1">Week 4 after sowing (Est Nov 14)</p>
                   <p className="text-xs text-slate-400 text-opacity-80">Urea application @ 45 kg/ha spread evenly. Maintain high soil moisture during application.</p>
                 </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
