"use client";

import { useState, useRef, type ChangeEvent } from "react";
import {
  ChevronDown,
  FlaskConical,
  X,
  Zap,
  Leaf,
  Sprout,
  Camera,
} from "lucide-react";
import { useCouncil, type FarmInputs } from "@/lib/councilStore";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FarmInputFormProps {
  /** Current question text from the chat input (sent alongside farm data) */
  question?: string;
  /** Callback fired after a successful council response */
  onCouncilResponse?: (data: {
    synthesis?: string;
    council_outputs?: Record<string, any>;
  }) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CROPS = [
  "rice",
  "maize",
  "chickpea",
  "kidneybeans",
  "pigeonpeas",
  "mothbeans",
  "mungbean",
  "blackgram",
  "lentil",
  "pomegranate",
  "banana",
  "mango",
  "grapes",
  "watermelon",
  "muskmelon",
  "apple",
  "orange",
  "papaya",
  "coconut",
  "cotton",
  "jute",
  "coffee",
];

const PARAM_CONFIG: {
  key: keyof FarmInputs;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  { key: "N", label: "Nitrogen (N)", min: 0, max: 140, step: 1, unit: "kg/ha" },
  { key: "P", label: "Phosphorus (P)", min: 0, max: 145, step: 1, unit: "kg/ha" },
  { key: "K", label: "Potassium (K)", min: 0, max: 205, step: 1, unit: "kg/ha" },
  { key: "temperature", label: "Temperature", min: 8, max: 44, step: 0.5, unit: "°C" },
  { key: "humidity", label: "Humidity", min: 14, max: 100, step: 1, unit: "%" },
  { key: "ph", label: "pH Level", min: 3.5, max: 10.0, step: 0.1, unit: "" },
  { key: "rainfall", label: "Rainfall", min: 20, max: 300, step: 1, unit: "mm" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FarmInputForm({
  question,
  onCouncilResponse,
}: FarmInputFormProps) {
  const { state, dispatch } = useCouncil();

  /* ---------- local UI state ---------- */
  const [isOpen, setIsOpen] = useState(false);

  const [leafBase64, setLeafBase64] = useState<string | null>(null);
  const [leafPreview, setLeafPreview] = useState<string | null>(null);
  const leafRef = useRef<HTMLInputElement>(null);

  const [fieldBase64, setFieldBase64] = useState<string | null>(null);
  const [fieldPreview, setFieldPreview] = useState<string | null>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  /* ---------- handlers ---------- */

  const handleImageSelect = (
    e: ChangeEvent<HTMLInputElement>,
    type: "leaf" | "field"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (type === "leaf") {
        setLeafBase64(base64);
        setLeafPreview(preview);
      } else {
        setFieldBase64(base64);
        setFieldPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (type: "leaf" | "field") => {
    if (type === "leaf") {
      setLeafBase64(null);
      setLeafPreview(null);
      if (leafRef.current) leafRef.current.value = "";
    } else {
      setFieldBase64(null);
      setFieldPreview(null);
      if (fieldRef.current) fieldRef.current.value = "";
    }
  };

  const handleConvene = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const body: Record<string, any> = {
        ...state.farmInputs,
      };
      if (question?.trim()) body.question = question;
      if (leafBase64) body.leaf_image_base64 = leafBase64;
      if (fieldBase64) body.field_image_base64 = fieldBase64;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/council/synthesize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      dispatch({
        type: "SET_COUNCIL_RESPONSE",
        payload: {
          councilOutputs: data.council_outputs ?? {},
          synthesis: data.synthesis ?? null,
        },
      });

      onCouncilResponse?.(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Council request failed";
      dispatch({ type: "SET_ERROR", payload: msg });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateInput = (key: keyof FarmInputs, value: number | string) => {
    dispatch({ type: "SET_FARM_INPUTS", payload: { [key]: value } });
  };

  /* ---------- render ---------- */

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm mb-4">
      {/* -------- Toggle Header -------- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical size={18} className="text-green-500 shrink-0" />
          <span className="font-semibold text-sm whitespace-nowrap">
            Council Analysis Parameters
          </span>

          {/* Compact summary when collapsed */}
          {!isOpen && (
            <span className="text-xs text-slate-500 truncate ml-2 hidden sm:inline">
              N:{state.farmInputs.N} P:{state.farmInputs.P} K:
              {state.farmInputs.K} pH:{state.farmInputs.ph} •{" "}
              <span className="capitalize">{state.farmInputs.crop}</span>
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* -------- Collapsible Body -------- */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-800">
          {/* ---- Parameter Sliders ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-4 mt-4">
            {PARAM_CONFIG.map((p) => {
              const val = state.farmInputs[p.key] as number;
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {p.label}
                    </label>
                    <span className="text-sm font-bold text-green-400 tabular-nums">
                      {val}
                      {p.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={val}
                    onChange={(e) =>
                      updateInput(p.key, parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-green-500"
                  />
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-slate-600">
                      {p.min}
                      {p.unit}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {p.max}
                      {p.unit}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* ---- Crop Dropdown ---- */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Crop Selection
              </label>
              <select
                value={state.farmInputs.crop}
                onChange={(e) => updateInput("crop", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors capitalize text-white"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ---- Image Uploads ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Leaf Image (Pest Detection) */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Leaf size={12} /> Leaf Photo (Pest Detection)
              </label>
              <input
                ref={leafRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, "leaf")}
                className="hidden"
              />
              {leafPreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={leafPreview}
                    alt="Leaf sample"
                    className="h-24 w-full object-cover"
                  />
                  <button
                    onClick={() => clearImage("leaf")}
                    className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-red-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => leafRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:border-green-500 hover:text-green-400 transition-colors cursor-pointer"
                >
                  <Camera size={20} />
                  <span className="text-xs font-medium">
                    Upload Leaf Photo
                  </span>
                </button>
              )}
            </div>

            {/* Field Image (Growth Stage) */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Sprout size={12} /> Field Photo (Growth Stage)
              </label>
              <input
                ref={fieldRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, "field")}
                className="hidden"
              />
              {fieldPreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={fieldPreview}
                    alt="Field sample"
                    className="h-24 w-full object-cover"
                  />
                  <button
                    onClick={() => clearImage("field")}
                    className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-red-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fieldRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:border-green-500 hover:text-green-400 transition-colors cursor-pointer"
                >
                  <Camera size={20} />
                  <span className="text-xs font-medium">
                    Upload Field Photo
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ---- Error Display ---- */}
          {state.error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
              {state.error}
            </div>
          )}

          {/* ---- Convene Button ---- */}
          <button
            onClick={handleConvene}
            disabled={state.isLoading}
            className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-900/20"
          >
            {state.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Council Models…
              </>
            ) : (
              <>
                <Zap size={18} />
                Convene Council
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
