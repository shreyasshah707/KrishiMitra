"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend
} from "recharts";
import { Leaf, Info } from "lucide-react";

// Mock Data
const macroNutrients = [
  { name: 'Nitrogen (N)', current: 45, optimal: 50, max: 100 },
  { name: 'Phosphorus (P)', current: 30, optimal: 40, max: 100 },
  { name: 'Potassium (K)', current: 80, optimal: 60, max: 100 },
];

const nutrientRadar = [
  { subject: 'Nitrogen', A: 120, B: 110, fullMark: 150 },
  { subject: 'Organic C', A: 98, B: 130, fullMark: 150 },
  { subject: 'Phosphorus', A: 86, B: 130, fullMark: 150 },
  { subject: 'Potassium', A: 99, B: 100, fullMark: 150 },
  { subject: 'Sulfur', A: 85, B: 90, fullMark: 150 },
  { subject: 'Zinc', A: 65, B: 85, fullMark: 150 },
];

const historyData = [
  { year: '2021', score: 65, ph: 6.2, c: 0.9 },
  { year: '2022', score: 68, ph: 6.4, c: 1.1 },
  { year: '2023', score: 71, ph: 6.5, c: 1.25 },
  { year: '2024', score: 76, ph: 6.8, c: 1.4 },
];

export default function SoilHealthPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Leaf className="text-green-500" /> Soil Intelligence
        </h1>
        <p className="text-slate-400 mt-1">Deep analysis of soil nutrients, historical health, and recommendations.</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Soil Score", value: "76/100", status: "Good", color: "text-green-400" },
          { label: "Organic Carbon", value: "1.4%", status: "Optimal", color: "text-emerald-400" },
          { label: "pH Level", value: "6.8", status: "Slightly Acidic", color: "text-blue-400" },
          { label: "Moisture", value: "42%", status: "Ideal Range", color: "text-cyan-400" },
        ].map(item => (
           <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{item.label}</h3>
             <p className={`text-3xl font-bold ${item.color} mb-1`}>{item.value}</p>
             <p className="text-sm text-slate-300">{item.status}</p>
           </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Macro Nutrients */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
           <h2 className="text-xl font-bold mb-6">Macro Nutrients Current vs Optimal</h2>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macroNutrients} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Level" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="optimal" fill="#22c55e" name="Optimal Base" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Radar Chart - Micro & Overall Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
           <h2 className="text-xl font-bold mb-6">Nutrient Balance Matrix</h2>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={nutrientRadar}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#475569" />
                  <Radar name="Farm Average" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
                  <Radar name="Regional Benchmark" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
           <h2 className="text-xl font-bold mb-6">Historical Health Trend</h2>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[50, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3} activeDot={{ r: 8 }} name="Soil Health Score" />
                </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
           <h2 className="text-xl font-bold mb-4">Advisory & Actions</h2>
           <div className="flex-1 space-y-4">
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                 <h4 className="font-semibold text-green-400 mb-1">Fertilizer Guide</h4>
                 <p className="text-sm text-slate-300">Apply 40kg/ha of N-based fertilizer. Avoid Potassium additives currently.</p>
              </div>
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                 <h4 className="font-semibold text-yellow-400 mb-1">Deficiencies alert</h4>
                 <p className="text-sm text-slate-300">Moderate Zinc and Phosphorus deficiency noted in Western boundary.</p>
              </div>
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                 <h4 className="font-semibold text-blue-400 mb-1">Improvement</h4>
                 <p className="text-sm text-slate-300">Consider sowing leguminous cover crops post-harvest to fix Nitrogen.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
