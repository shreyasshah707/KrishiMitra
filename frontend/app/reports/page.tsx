"use client";

import { FileText, Download, FileBarChart, FilePieChart, Calendar, Eye, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const reportsList = [
  { 
    id: 1, 
    title: 'Monthly Yield Forecast', 
    date: 'Oct 24, 2024', 
    type: 'Forecast', 
    status: 'Ready', 
    desc: 'Updated yield calculations based on mid-season vegetative indices.',
    icon: FileBarChart 
  },
  { 
    id: 2, 
    title: 'Soil Health Assessment Q3', 
    date: 'Oct 15, 2024', 
    type: 'Assessment', 
    status: 'Ready', 
    desc: 'Comprehensive pH, NPK, and micronutrient lab and sensor analysis.',
    icon: FilePieChart 
  },
  { 
    id: 3, 
    title: 'Climate Risk Profile', 
    date: 'Oct 01, 2024', 
    type: 'Risk', 
    status: 'Ready', 
    desc: 'El Niño preparedness planning and resource allocation recommendations.',
    icon: FileText 
  },
  { 
    id: 4, 
    title: 'End of Year Financials (Est)', 
    date: 'Nov 01, 2024', 
    type: 'Financial', 
    status: 'Generating', 
    desc: 'Expected ROI mapping for current plantings.',
    icon: Calendar 
  }
];

export default function ReportsPage() {
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="text-green-500" /> Executive Reports
        </h1>
        <p className="text-slate-400 mt-1">Download and review compiled agricultural assessments and forecasts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
         {/* Reports List */}
         <div className="lg:col-span-2 space-y-4">
            {reportsList.map(report => {
              const Icon = report.icon;
              return (
                <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-5 transition-colors hover:border-slate-700">
                   <div className="bg-slate-800 p-4 rounded-xl shrink-0 self-start md:self-auto border border-slate-700/50">
                      <Icon size={32} className="text-green-500" />
                   </div>
                   
                   <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold">{report.title}</h2>
                        {report.status === 'Ready' ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                            <CheckCircle size={12}/> Ready
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                            <Clock size={12}/> Generating
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{report.desc}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium tracking-wide border-t border-slate-800 pt-3">
                         <span className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2"><strong>Generated:</strong> {report.date}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-700 hidden md:block"></span>
                         <span className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2"><strong>Type:</strong> {report.type}</span>
                      </div>
                   </div>

                   <div className="flex flex-row md:flex-col gap-2 shrink-0 md:self-center">
                     <button onClick={() => alert(`Previewing ${report.title}...`)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">
                       <Eye size={16} /> Preview
                     </button>
                     <button onClick={() => alert(`Downloading ${report.title}.pdf`)} disabled={report.status !== 'Ready'} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 rounded-lg text-sm transition-colors font-medium">
                       <Download size={16} /> Download
                     </button>
                   </div>
                </div>
              )
            })}
         </div>

         {/* Right Sidebar: Quick stats & Settings */}
         <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-green-900/40 to-slate-900 border border-green-800/50 rounded-xl p-6 shadow-sm relative overflow-hidden">
               <h3 className="text-lg font-bold text-white mb-2 relative z-10">Generate New Report</h3>
               <p className="text-sm text-slate-300 mb-5 relative z-10">Compile custom metrics into a professional PDF across specific date ranges.</p>
               <button onClick={() => setShowConfigModal(true)} className="w-full py-3 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-lg transition-colors relative z-10">
                 Configure Report
               </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
               <h3 className="font-bold mb-4 border-b border-slate-800 pb-2">Recent Archives</h3>
               <ul className="text-sm space-y-3">
                  <li className="flex justify-between items-center text-slate-300 hover:text-white cursor-pointer transition-colors">
                     <span>September 2024 Summary</span>
                     <Download size={14} className="text-slate-500" />
                  </li>
                  <li className="flex justify-between items-center text-slate-300 hover:text-white cursor-pointer transition-colors">
                     <span>August 2024 Summary</span>
                     <Download size={14} className="text-slate-500" />
                  </li>
                  <li className="flex justify-between items-center text-slate-300 hover:text-white cursor-pointer transition-colors">
                     <span>July 2024 Summary</span>
                     <Download size={14} className="text-slate-500" />
                  </li>
               </ul>
             </div>
          </div>
       </div>

       {/* Configure Report Modal */}
       {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <h2 className="text-2xl font-bold mb-4">Configure Report</h2>
              <p className="text-slate-400 text-sm mb-6">Select parameters for your custom agricultural report execution.</p>
              
              <div className="space-y-4">
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Date Range</label>
                   <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-green-500 text-white">
                      <option>Last 30 Days</option>
                      <option>Last Quarter</option>
                      <option>Year to Date</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Include Metrics</label>
                   <div className="flex flex-col gap-2 mt-2">
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-green-500" /> Yield Forecasts</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-green-500" /> Soil Telemetry</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-green-500" /> Financial Summaries</label>
                   </div>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowConfigModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors">Cancel</button>
                <button onClick={() => { setShowConfigModal(false); alert("Report compilation queued!"); }} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors">Start Generation</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
