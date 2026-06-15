"use client";

import { Plus, FileText, Tractor, Droplets, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    { label: "Add Farm", icon: Plus, color: "bg-green-600 hover:bg-green-500", href: "/farm-management" },
    { label: "Generate Report", icon: FileText, color: "bg-blue-600 hover:bg-blue-500", href: "/reports" },
    { label: "Crop Planner", icon: Tractor, color: "bg-orange-600 hover:bg-orange-500", href: "/crop-intelligence" },
    { label: "Irrigation Planner", icon: Droplets, color: "bg-cyan-600 hover:bg-cyan-500", href: "/crop-intelligence" },
    { label: "Download Advisory", icon: Download, color: "bg-purple-600 hover:bg-purple-500", href: "/risk-alerts" },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm max-w-6xl">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
        Quick Actions
      </h2>

      <div className="flex flex-wrap gap-6">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`${action.color} flex items-center gap-2 px-5 py-3 rounded-xl transition-colors font-medium`}
            >
              <Icon size={24} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}