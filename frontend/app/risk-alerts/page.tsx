import { AlertTriangle, Flame, Droplet, Bug, Clock, ShieldAlert } from "lucide-react";

const risks = [
  { name: 'Drought Risk', level: 'Medium', score: 45, icon: Droplet, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'Flood Risk', level: 'Low', score: 12, icon: AlertTriangle, color: 'text-green-500', bg: 'bg-green-500/10' },
  { name: 'Heat Stress', level: 'High', score: 82, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
  { name: 'Pest Risk', level: 'Medium', score: 55, icon: Bug, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const timeline = [
  { time: 'Today, 08:30 AM', title: 'High surface temp warning', desc: 'Soil surface temp exceeds 35°C in North Sector.', type: 'critical' },
  { time: 'Yesterday, 14:15 PM', title: 'Pest activity detected', desc: 'Early signs of Aphids spotted via satellite proxy data.', type: 'warning' },
  { time: 'Oct 12, 10:00 AM', title: 'Optimal Sowing Window', desc: 'Moisture levels reached optimal range for Soybean.', type: 'info' },
];

const historyTable = [
  { date: 'Oct 10, 2024', event: 'Heavy Rainfall Alert', severity: 'Medium', action: 'Cleared drainage', status: 'Resolved' },
  { date: 'Sep 28, 2024', event: 'Fungal Infection Risk', severity: 'High', action: 'Applied Fungicide', status: 'Resolved' },
  { date: 'Sep 05, 2024', event: 'Heatwave', severity: 'Critical', action: 'Increased Irrigation', status: 'Resolved' },
  { date: 'Aug 14, 2024', event: 'Locust Warning (Regional)', severity: 'Low', action: 'Monitored', status: 'Resolved' },
];

export default function RiskAlertsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldAlert className="text-red-500" /> Risk & Alerts
        </h1>
        <p className="text-slate-400 mt-1">Real-time threat monitoring and historical risk management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {risks.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.name} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
               <div className={`absolute -right-4 -top-4 w-16 h-16 ${r.bg} rounded-full blur-xl`}></div>
               <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Icon size={16}/> {r.name}
               </h3>
               <div className="flex items-end gap-3 mt-4">
                 <span className={`text-3xl font-bold ${r.color}`}>{r.level}</span>
                 <span className="text-sm font-medium text-slate-500 mb-1">Score: {r.score}/100</span>
               </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Live Alert Timeline */}
         <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock size={20} className="text-slate-400"/> Live Alerts
            </h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
              {timeline.map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border-4 border-slate-900 ${item.type === 'critical' ? 'bg-red-500' : item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'} text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}></div>
                  
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold text-sm ${item.type === 'critical' ? 'text-red-400' : item.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>{item.title}</h3>
                    </div>
                    <time className="text-xs text-slate-400 mb-2 block">{item.time}</time>
                    <p className="text-sm text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
         </div>

         {/* Sector Risk Heatmap */}
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
           <h2 className="text-xl font-bold mb-4">Farm Sector Heatmap</h2>
           <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 grid grid-cols-4 grid-rows-4 gap-1 p-2 bg-slate-950">
             {Array.from({length: 16}).map((_, i) => {
               // Generate some fake intensity
               const isRed = [2, 3, 6, 7].includes(i);
               const isYellow = [1, 5, 9, 10, 11].includes(i);
               return (
                 <div key={i} className={`rounded-md flex items-center justify-center text-[10px] font-bold text-black/50 ${isRed ? 'bg-red-500' : isYellow ? 'bg-yellow-400' : 'bg-green-500'}`}>
                   S-{i+1}
                 </div>
               )
             })}
           </div>
           <div className="mt-4 flex justify-between text-xs text-slate-400">
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded"></div> Critical</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded"></div> Warning</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded"></div> Safe</div>
           </div>
         </div>

         {/* Priority Actions */}
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold mb-4">Priority Actions</h2>
            <div className="space-y-3 flex-1 overflow-y-auto">
               <div className="p-4 bg-red-950/20 border-l-4 border-red-500 rounded-r-lg">
                  <h4 className="font-semibold text-white">Deploy Shade Nets</h4>
                  <p className="text-sm text-slate-400 mt-1">Sectors 2, 3, 6 are highly exposed to upcoming heatwave.</p>
               </div>
               <div className="p-4 bg-yellow-950/20 border-l-4 border-yellow-500 rounded-r-lg">
                  <h4 className="font-semibold text-white">Pesticide Spraying</h4>
                  <p className="text-sm text-slate-400 mt-1">Pre-emptive organic neem spray recommended for Northern boundary.</p>
               </div>
            </div>
         </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-x-auto">
         <h2 className="text-xl font-bold mb-4">Alert History Log</h2>
         <table className="w-full text-sm text-left">
           <thead className="text-slate-400 text-xs uppercase bg-slate-800/50">
             <tr>
               <th className="px-4 py-3 rounded-tl-lg">Date</th>
               <th className="px-4 py-3">Event</th>
               <th className="px-4 py-3">Severity</th>
               <th className="px-4 py-3">Action Taken</th>
               <th className="px-4 py-3 rounded-tr-lg">Status</th>
             </tr>
           </thead>
           <tbody>
             {historyTable.map((row, i) => (
               <tr key={i} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/20 transition-colors">
                 <td className="px-4 py-4 font-medium text-slate-300">{row.date}</td>
                 <td className="px-4 py-4">{row.event}</td>
                 <td className="px-4 py-4">
                   <span className={`px-2 py-1 rounded text-xs font-semibold ${row.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : row.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : row.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                     {row.severity}
                   </span>
                 </td>
                 <td className="px-4 py-4 text-slate-400">{row.action}</td>
                 <td className="px-4 py-4 text-green-500 flex items-center gap-1"><ShieldAlert size={14}/> {row.status}</td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}
