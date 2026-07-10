import { AlertTriangle, Bot, CheckCircle, Info } from "lucide-react";

export default function AIInsightSummary() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col shadow-sm">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <Bot size={20} className="text-green-400" /> AI Insight Summary
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Based on real-time data from 3 local sensors and satellite imagery.
      </p>

      <div className="space-y-6 flex-1">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Farm Health Score
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-green-400">88/100</span>
            <span className="text-sm text-slate-400 mb-1">Excellent</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-500" /> Key Findings
          </h3>
          <ul className="text-sm space-y-2 text-slate-300">
            <li>• NDVI indicates highly vigorous vegetable growth in Northern sector.</li>
            <li>• Soil moisture levels are optimal (42%) following recent rainfall.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
            <Info size={16} className="text-blue-400" /> Recommended Actions
          </h3>
          <ul className="text-sm space-y-2 text-slate-300">
            <li>• Apply organic compost to Southern sector early next week.</li>
            <li>• Pause irrigation for the next 48 hours.</li>
          </ul>
        </div>

        <div>
           <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-yellow-500" /> Climate Risks
          </h3>
          <p className="text-sm text-slate-300">
             Moderate probability of heavy precipitation (20mm+) on Thursday. Ensure drainage channels are clear.
          </p>
        </div>
      </div>
    </div>
  );
}
