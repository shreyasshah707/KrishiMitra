"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Leaf,
  CloudLightning,
  Tractor,
  AlertTriangle,
  Bot,
  FileText,
  Settings,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Map Explorer", href: "/map-explorer", icon: Map },
  { name: "Soil Health", href: "/soil-health", icon: Leaf },
  { name: "Weather & Climate", href: "/weather-climate", icon: CloudLightning },
  { name: "Crop Intelligence", href: "/crop-intelligence", icon: Tractor },
  { name: "Risk & Alerts", href: "/risk-alerts", icon: AlertTriangle },
  { name: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Farm Management", href: "/farm-management", icon: MapPin },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-slate-950 text-white border-r border-slate-800 p-6 flex flex-col fixed left-0 top-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Leaf className="text-green-500" /> KrishiMitra
        </h1>
        <p className="text-xs text-slate-400 mt-2 tracking-wider uppercase">
          Climate • Soil • Crop Intelligence
        </p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group",
                isActive
                  ? "bg-green-500/10 text-green-400 font-medium"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <Icon size={18} className={cn(isActive ? "text-green-400" : "group-hover:text-white")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}