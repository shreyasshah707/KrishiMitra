"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MapControls from "./MapControls";
import FarmInfoCard from "./FarmInfoCard";

export default function MapPlaceholder() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [73.8567, 18.5204], // Pune
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl());

    map.on("load", () => {
      // Farm Polygon
      map.addSource("farm", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[
              [73.75, 18.48],
              [73.80, 18.53],
              [73.86, 18.50],
              [73.83, 18.44],
              [73.75, 18.48],
            ]],
          },
        },
      });

      // Green Fill
      map.addLayer({
        id: "farm-fill",
        type: "fill",
        source: "farm",
        paint: {
          "fill-color": "#22c55e",
          "fill-opacity": 0.25,
        },
      });

      // White Border
      map.addLayer({
        id: "farm-border",
        type: "line",
        source: "farm",
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
        },
      });

      // Farm Marker
      new maplibregl.Marker({
        color: "#22c55e",
      })
        .setLngLat([73.80, 18.49])
        .addTo(map);
    });

    return () => map.remove();
  }, []);

  return (
    <div className="relative">
      <MapControls />

      <div
        ref={mapContainer}
        className="h-[420px] rounded-xl overflow-hidden border border-slate-700"
      />

      {/* NDVI Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 w-36 z-10">
        <h3 className="text-xs font-semibold mb-3 text-white">
          NDVI
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>High</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-400" />
            <span>Medium</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Low</span>
          </div>
        </div>
      </div>

      <FarmInfoCard />
    </div>
  );
}