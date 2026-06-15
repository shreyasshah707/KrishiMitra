import KPICard from "@/components/ui/dashboard/KPICard";
import MapPlaceholder from "@/components/ui/map/MapPlaceholder";
import AIInsightSummary from "@/components/ui/dashboard/AIInsightSummary";
import QuickActions from "@/components/ui/dashboard/QuickActions";
import Alerts from "@/components/ui/dashboard/Alerts";
import QuickAIWidget from "@/components/ui/dashboard/QuickAIWidget";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Executive Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Overview of your farm and climate intelligence for today.
        </p>
      </div>

      {/* KPI Cards (5 cards as per spec) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Current Weather"
          value="28°C"
          subtitle="Partly Cloudy"
          icon="☁️"
        />
        <KPICard
          title="Soil Health"
          value="72/100"
          subtitle="Good (Carbon 1.35%)"
          icon="🌱"
        />
        <KPICard
          title="Recommended Crop"
          value="Soybean"
          subtitle="87% Confidence"
          icon="🌾"
        />
        <KPICard
          title="Rainfall (7 Days)"
          value="46 mm"
          subtitle="+12% from last week"
          icon="🌧️"
        />
        <KPICard
          title="Climate Risk"
          value="Medium"
          subtitle="Drought Risk (46/100)"
          icon="⚠️"
        />
      </div>

      {/* Main Section */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

  {/* Risk Alerts + AI Widget */}
  <div className="lg:col-span-3 flex flex-col gap-3">
    <Alerts />
    <QuickAIWidget />
  </div>

  {/* Map + Quick Actions */}
  <div className="lg:col-span-6 flex flex-col gap-4">
    <MapPlaceholder />
    <QuickActions />
  </div>

  {/* AI Summary */}
  <div className="lg:col-span-3">
    <AIInsightSummary />
  </div>
</div>
    </div>
  );
}
