import MapExplorerView from "@/components\\ui/map/MapExplorerView";

export default function MapExplorerPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Map Explorer</h1>
        <p className="text-slate-400 mt-1">
          Interactive GIS analysis of your farm boundaries and soil simulated overlays.
        </p>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        <MapExplorerView />
      </div>
    </div>
  );
}
