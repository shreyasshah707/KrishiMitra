"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Activity,
  Droplets,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export default function MapExplorerView() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [activeLayer, setActiveLayer] = useState("ndvi");

  useEffect(() => {
    if (!mapContainer.current) return;

    // Prevent duplicate initialization
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [73.8567, 18.5204],
      zoom: 12,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      map.addSource("farm-1", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {
            name: "North Sector",
            area: "12.4 acres",
            ndvi: "0.82",
            moisture: "42%",
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [73.82, 18.53],
                [73.86, 18.54],
                [73.87, 18.51],
                [73.83, 18.5],
                [73.82, 18.53],
              ],
            ],
          },
        },
      });

      map.addLayer({
        id: "farm-1-fill",
        type: "fill",
        source: "farm-1",
        paint: {
          "fill-color": "#22c55e",
          "fill-opacity": 0.4,
        },
      });

      map.addLayer({
        id: "farm-1-border",
        type: "line",
        source: "farm-1",
        paint: {
          "line-color": "#ffffff",
          "line-width": 2,
        },
      });

      // Force proper rendering
      setTimeout(() => {
        map.resize();
      }, 100);
    });

    // Also resize on window resize
    const handleResize = () => map.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="h-full w-full flex">
      {/* Map */}
      <div className="flex-1 relative min-h-[720px]">
        <div
          ref={mapContainer}
          className="absolute inset-0 w-full h-full"
        />

        {/* Layer Controls */}
        <div className="absolute top-4 left-4 z-10 w-64 rounded-xl border border-slate-800 bg-slate-950/90 p-3 backdrop-blur-md shadow-xl">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Layers size={16} />
            Map Layers
          </h3>

          <div className="space-y-2 text-sm">
            {[
              "ndvi",
              "soil_moisture",
              "rainfall",
              "temperature",
              "crop_health",
            ].map((layer) => (
              <label
                key={layer}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-800"
              >
                <input
                  type="radio"
                  name="layer"
                  checked={activeLayer === layer}
                  onChange={() => setActiveLayer(layer)}
                />
                <span className="capitalize">
                  {layer.replace("_", " ")}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 z-10 w-48 rounded-xl border border-slate-800 bg-slate-950/90 p-4 backdrop-blur-md">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Legend
          </h4>

          <div className="text-xs text-slate-300">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" />
            <div className="mt-2 flex justify-between">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="z-10 flex w-80 flex-col border-l border-slate-800 bg-slate-950/95 p-6">
        <h2 className="mb-6 text-xl font-bold">Farm Analytics</h2>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="mb-1 flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={16} />
              Selected Farm
            </h3>
            <p className="text-lg font-semibold">North Sector</p>
            <p className="text-sm text-slate-500">12.4 acres</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-2 flex items-center gap-1 text-xs text-slate-400">
                <Activity size={14} />
                NDVI
              </h3>
              <p className="text-xl font-bold text-green-400">0.82</p>
              <p className="mt-1 text-xs text-slate-500">Excellent</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-2 flex items-center gap-1 text-xs text-slate-400">
                <Droplets size={14} />
                Moisture
              </h3>
              <p className="text-xl font-bold text-blue-400">42%</p>
              <p className="mt-1 text-xs text-slate-500">Optimal</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="mb-2 flex items-center gap-1 text-xs text-slate-400">
              <AlertTriangle size={14} />
              Risk Level
            </h3>

            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">
                Medium (Pest Alert)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}