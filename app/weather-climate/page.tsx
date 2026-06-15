"use client";

import { Cloud, Droplets, Wind, Sun, ThermometerSun, AlertTriangle, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const currentMetrics = [
  { label: 'Temperature', value: '28°C', icon: ThermometerSun, color: 'text-orange-400' },
  { label: 'Humidity', value: '65%', icon: Droplets, color: 'text-blue-400' },
  { label: 'Rainfall', value: '0 mm', icon: Cloud, color: 'text-cyan-400' },
  { label: 'Wind', value: '12 km/h', icon: Wind, color: 'text-slate-400' },
  { label: 'Pressure', value: '1012 hPa', icon: Cloud, color: 'text-indigo-400' },
  { label: 'UV Index', value: '6 (High)', icon: Sun, color: 'text-yellow-400' },
];

const forecast7Days = [
  { day: 'Mon', tempMax: 29, tempMin: 18, condition: 'Sunny', icon: Sun },
  { day: 'Tue', tempMax: 27, tempMin: 17, condition: 'Rain', icon: Cloud },
  { day: 'Wed', tempMax: 26, tempMin: 16, condition: 'Cloudy', icon: Cloud },
  { day: 'Thu', tempMax: 29, tempMin: 18, condition: 'Sunny', icon: Sun },
  { day: 'Fri', tempMax: 27, tempMin: 17, condition: 'Rain', icon: Cloud },
  { day: 'Sat', tempMax: 26, tempMin: 16, condition: 'Cloudy', icon: Cloud },
  { day: 'Sun', tempMax: 30, tempMin: 19, condition: 'Sunny', icon: Sun },
];

const historicalClimate = [
  { month: 'Jan', rain: 10, temp: 22 },
  { month: 'Feb', rain: 15, temp: 24 },
  { month: 'Mar', rain: 30, temp: 28 },
  { month: 'Apr', rain: 45, temp: 32 },
  { month: 'May', rain: 80, temp: 34 },
  { month: 'Jun', rain: 250, temp: 28 },
];

export default function WeatherClimatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Cloud className="text-blue-400" /> Weather & Climate
        </h1>
        <p className="text-slate-400 mt-1">Real-time local tracking and macro-climatic forecasts.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {currentMetrics.map(item => {
           const Icon = item.icon;
           return (
             <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <Icon size={24} className={`${item.color} mb-2`} />
                <p className="font-bold text-xl">{item.value}</p>
                <h3 className="text-xs text-slate-400 uppercase tracking-widest">{item.label}</h3>
             </div>
           );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Top Anomalies */}
         <div className="lg:col-span-1 space-y-4 flex flex-col">
           <h2 className="text-xl font-bold">Climate Anomalies</h2>
           <div className="flex-1 bg-red-950/30 border border-red-900 rounded-xl p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold text-red-500 mb-2"><AlertTriangle size={18}/> Heatwave Risk</h3>
              <p className="text-sm text-slate-300">High probability of extreme temperatures exceeding 38°C late next month.</p>
           </div>
           <div className="flex-1 bg-blue-950/30 border border-blue-900 rounded-xl p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold text-blue-400 mb-2"><Droplets size={18}/> Rainfall Deviation</h3>
              <p className="text-sm text-slate-300">-12% regional rainfall deviation compared to 10-year historical average.</p>
           </div>
           <div className="flex-1 bg-yellow-950/30 border border-yellow-900 rounded-xl p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold text-yellow-500 mb-2"><AlertTriangle size={18}/> Drought Probability</h3>
              <p className="text-sm text-slate-300">Elevated to 45% for Q3 due to projected El Niño impacts.</p>
           </div>
         </div>

         {/* 7 Day Forecast Details */}
         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">7-Day Local Forecast</h2>
            <div className="grid grid-cols-7 gap-2 h-full">
               {forecast7Days.map((fw, index) => {
                 const Icon = fw.icon;
                 return (
                   <div key={index} className="flex flex-col items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
                      <p className="text-sm font-medium text-slate-300 mb-3">{fw.day}</p>
                      <Icon size={32} className={`mb-3 ${fw.condition === 'Sun' ? 'text-yellow-400' : 'text-blue-400'}`} />
                      <div className="mt-auto text-center">
                        <p className="text-lg font-bold">{fw.tempMax}°</p>
                        <p className="text-xs text-slate-400">{fw.tempMin}°</p>
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Trend charts */}
         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Historical Precipitation Overview</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={historicalClimate} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="month" stroke="#94a3b8" />
                   <YAxis stroke="#94a3b8" />
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                   <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                   <Area type="monotone" dataKey="rain" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRain)" />
                 </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Info size={20} className="text-green-500" /> Climate Insights</h2>
            <div className="text-sm text-slate-300 leading-relaxed flex-1 space-y-4">
               <p>
                 According to the consensus of recent local forecast models, we foresee a largely dry spell followed by intense intermittent showers.
               </p>
               <p>
                 <strong>Recommendation:</strong> Ensure rainwater harvesting catchments are clear. Prepare for reduced surface moisture in the first half of the coming month.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
