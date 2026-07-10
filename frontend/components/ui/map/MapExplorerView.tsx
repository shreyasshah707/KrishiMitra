"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Activity, Droplets, MapPin, AlertTriangle } from "lucide-react";

export default function MapExplorerView() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState("ndvi");

  useEffect(() => {
    // Singleton init: do nothing if already mounted or container missing
    if (mapRef.current || !mapContainer.current) {
      console.debug("MapExplorerView: map already initialized or container missing", {
        initialized: !!mapRef.current,
        containerExists: !!mapContainer.current,
      });
      return;
    }

    console.debug("MapExplorerView: initializing map", { container: mapContainer.current });
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [73.8567, 18.5204], // Pune region mock
      zoom: 12,
    });

    console.debug("MapExplorerView: container dimensions", mapContainer.current?.getBoundingClientRect());

    mapRef.current.addControl(new maplibregl.NavigationControl(), "bottom-right");

    mapRef.current.on("error", (event) => {
      console.error("MapExplorerView map error:", event.error || event);
    });

    mapRef.current.on("load", () => {
      console.debug("MapExplorerView: map loaded", { map: mapRef.current });

      // Main Farm Polygon source
      mapRef.current?.addSource("farm-1", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { name: "North Sector", area: "12.4 acres", ndvi: 0.82, moisture: 42, rainfall: 150, temperature: 28, crop_health: 0.75 },
          geometry: {
            type: "Polygon",
            coordinates: [[[73.82, 18.53], [73.86, 18.54], [73.87, 18.51], [73.83, 18.50], [73.82, 18.53]]],
          },
        },
      });

      const layerStyles = {
        ndvi: { color: "#22c55e", opacity: 0.45 },
        soil_moisture: { color: "#38bdf8", opacity: 0.35 },
        rainfall: { color: "#818cf8", opacity: 0.35 },
        temperature: { color: "#fb7185", opacity: 0.35 },
        crop_health: { color: "#f97316", opacity: 0.35 },
      } as const;

      Object.entries(layerStyles).forEach(([layer, style]) => {
        mapRef.current?.addLayer({
          id: `farm-1-fill-${layer}`,
          type: "fill",
          source: "farm-1",
          layout: { visibility: layer === activeLayer ? "visible" : "none" },
          paint: {
            "fill-color": style.color,
            "fill-opacity": style.opacity,
          },
        });
      });

      mapRef.current?.addLayer({
        id: "farm-1-border",
        type: "line",
        source: "farm-1",
        paint: {
          "line-color": "#ffffff",
          "line-width": 2,
        },
      });

      // After layout paints, ensure map canvas has correct size
      setTimeout(() => {
        console.debug("MapExplorerView: resizing map after load");
        mapRef.current?.resize();
      }, 100);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    ["ndvi", "soil_moisture", "rainfall", "temperature", "crop_health"].forEach((layer) => {
      const layerId = `farm-1-fill-${layer}`;
      if (mapRef.current?.getLayer(layerId)) {
        mapRef.current.setLayoutProperty(layerId, "visibility", layer === activeLayer ? "visible" : "none");
      }
    });
  }, [activeLayer]);

  return (
    <div className="w-full flex">
      {/* Map Area */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 64px)', minHeight: '500px' }}>
        <div ref={mapContainer} className="w-full h-full rounded-xl" />

        {/* Floating Layer Controls */}
        <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 p-3 shadow-xl w-64 z-10">
          <h3 className="text-sm font-semibold mb-3 text-slate-300 flex items-center gap-2">
            <Layers size={16} /> Map Layers
          </h3>
          <div className="space-y-2 text-sm">
            {["ndvi", "soil_moisture", "rainfall", "temperature", "crop_health"].map((layer) => (
              <label key={layer} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="layer"
                  checked={activeLayer === layer}
                  onChange={() => setActiveLayer(layer)}
                  className="w-4 h-4 text-green-500 bg-slate-900 border-slate-700"
                />
                <span className="capitalize">{layer.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 p-4 w-48 z-10">
          <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Legend</h4>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full" />
              <div className="flex justify-between mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      <div className="w-80 bg-slate-950/95 border-l border-slate-800 p-6 flex flex-col z-10">
        <h2 className="text-xl font-bold mb-6">Farm Analytics</h2>

        <div className="space-y-6">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 className="text-sm text-slate-400 mb-1 flex items-center gap-2">
              <MapPin size={16} /> Selected Farm
            </h3>
            <p className="text-lg font-semibold text-white">North Sector</p>
            <p className="text-sm text-slate-500">12.4 acres</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <h3 className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Activity size={14} /> NDVI</h3>
              <p className="text-xl font-bold text-green-400">0.82</p>
              <p className="text-xs text-slate-500 mt-1">Excellent</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <h3 className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Droplets size={14} /> Moisture</h3>
              <p className="text-xl font-bold text-blue-400">42%</p>
              <p className="text-xs text-slate-500 mt-1">Optimal</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
             <h3 className="text-xs text-slate-400 mb-2 flex items-center gap-1">
               <AlertTriangle size={14} /> Risk Level
             </h3>
             <div className="flex items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
               <span className="text-sm font-medium">Medium (Pest Alert)</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
