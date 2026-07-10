"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, User, Send, MapPin, Cloud, Leaf, AlertTriangle, Mic } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { CouncilResponseCards } from '@/components/ui/ai/CouncilResponseCards';
import { useCouncil } from "@/lib/councilStore";
import FarmInputForm from "@/components/FarmInputForm";

type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

type WeatherSnapshot = {
  temperature?: number | string;
  windspeed?: number | string;
  weathercode?: number | string;
  condition?: string;
  summary?: string;
  forecast?: string;
};

type MandiRate = {
  mandi?: string;
  market?: string;
  district?: string;
  state?: string;
  commodity?: string;
  variety?: string;
  min_price?: number | string;
  max_price?: number | string;
  modal_price?: number | string;
  price?: number | string;
  unit?: string;
  price_unit?: string;
};

type MandiSnapshot = MandiRate & {
  source?: string;
  count?: number;
  data?: MandiRate[];
  rates?: MandiRate[];
};

type AssistantResponsePayload = {
  weather?: WeatherSnapshot;
  weather_snapshot?: WeatherSnapshot;
  mandi_snapshot?: MandiSnapshot;
  synthesis?: string;
  council_outputs?: Record<string, unknown>;
  audio_base64?: string;
  audioBase64?: string;
  message?: string;
  transcription?: string;
  text?: string;
  transcript?: string;
  answer?: string;
};

export default function AIAssistantPage() {
  const { userName } = useAuth();
  const { state: councilState } = useCouncil();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const greetingMessage: ChatMessage = {
    role: "ai",
    text: `Hello ${userName || 'Guest'}! I'm your KrishiMitra AI Assistant. I have live access to your farm's sensors, weather data, and satellite imagery. How can I help you today?`,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [mandiData, setMandiData] = useState<MandiSnapshot | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const soilMetricControls: Array<{
    key: keyof typeof councilState.farmInputs;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
  }> = [
    { key: "N", label: "Nitrogen (N)", unit: "mg/kg", min: 0, max: 200, step: 1 },
    { key: "P", label: "Phosphorus (P)", unit: "mg/kg", min: 0, max: 200, step: 1 },
    { key: "K", label: "Potassium (K)", unit: "mg/kg", min: 0, max: 250, step: 1 },
    { key: "ph", label: "Soil pH", unit: "", min: 3.5, max: 9.5, step: 0.1 },
    { key: "rainfall", label: "Rainfall", unit: "mm", min: 0, max: 400, step: 1 },
  ];

  const suggestedPrompts = [
    "How is my farm doing?",
    "Best crop this season?",
    "Explain NDVI",
    "Why is soil score low?",
    "What irrigation schedule should I follow?"
  ];

  const visibleMessages = [greetingMessage, ...messages];
  const hasCouncilOutputs = Object.values(councilState.councilOutputs).some(Boolean);
  const { dispatch } = useCouncil();
  const mandiRates: MandiRate[] = [];

  if (Array.isArray(mandiData?.data)) {
    mandiRates.push(...mandiData.data);
  } else if (Array.isArray(mandiData?.rates)) {
    mandiRates.push(...mandiData.rates);
  } else if (mandiData) {
    mandiRates.push(mandiData);
  }

  const primaryMandi = mandiRates[0];
  const marketName = primaryMandi?.mandi || primaryMandi?.market || mandiData?.mandi || mandiData?.market;
  const marketCommodity = primaryMandi?.commodity || mandiData?.commodity || councilState.farmInputs.crop;
  const modalPrice = primaryMandi?.modal_price ?? primaryMandi?.price ?? mandiData?.modal_price ?? mandiData?.price;
  const marketUnit = primaryMandi?.unit || primaryMandi?.price_unit || mandiData?.unit || mandiData?.price_unit || "INR/quintal";
  const marketSource = mandiData?.source || "Awaiting live market source";
  const weatherTemperature = liveWeather?.temperature;
  const weatherWind = liveWeather?.windspeed;
  const weatherSummary = liveWeather?.condition || liveWeather?.summary || liveWeather?.forecast || (liveWeather?.weathercode !== undefined ? `Code ${liveWeather.weathercode}` : "Fetching climate status...");
  const soilHealth = councilState.councilOutputs.soil_health;
  const soilScore = soilHealth?.score;
  const soilGrade = soilHealth?.grade || "Awaiting model";
  const moistureProxy = Math.round(councilState.farmInputs.humidity * 0.6);
  const heatStressTemp = Number(weatherTemperature ?? councilState.farmInputs.temperature);
  const heatStressStatus = Number.isFinite(heatStressTemp)
    ? heatStressTemp >= 38
      ? "High"
      : heatStressTemp >= 32
        ? "Moderate"
        : "Low"
    : "Fetching climate risk...";
  const heatStressClass = heatStressStatus === "High"
    ? "text-red-400 font-bold"
    : heatStressStatus === "Moderate"
      ? "text-yellow-400 font-bold"
      : "text-green-400 font-bold";
  const formatMandiPrice = (value: number | string | undefined) => {
    if (value === undefined || value === null || value === "") return "Fetching...";
    return `INR ${value}`;
  };

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopActiveStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const playVoiceResponse = async (responseData: AssistantResponsePayload) => {
    const audioBase64 = responseData?.audio_base64 || responseData?.audioBase64;
    if (!audioBase64) return;

    const audioPlayer = new Audio("data:audio/mp3;base64," + audioBase64);
    await audioPlayer.play();
  };

  const sendVoiceClip = async (audioBlob: Blob) => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
    const formData = new FormData();
    formData.append("audio", audioBlob, "query.wav");
    formData.append("language", "hi-IN");

    const response = await fetch(`${baseUrl}/chat/voice`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const responseData = (await response.json()) as AssistantResponsePayload;

    const transcript = responseData.transcript;
    const answer = responseData.answer;
    if (responseData.weather_snapshot) setLiveWeather(responseData.weather_snapshot);
    if (responseData.mandi_snapshot) setMandiData(responseData.mandi_snapshot);

    // Show transcript in chat as the user's spoken message
    if (transcript) {
      setMessages((prev) => [...prev, { role: "user", text: "🎙️ (Voice Input): " + transcript }]);
    }

    // Show AI answer in chat
    if (answer) {
      setMessages((prev) => [...prev, { role: "ai", text: answer }]);
    }
    // Play audio response aloud via base64 data URL
    void playVoiceResponse(responseData).catch(() => {});
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessages((prev) => [...prev, { role: "ai", text: "Microphone access is not available in this browser." }]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/wav" });
          audioChunksRef.current = [];
          await sendVoiceClip(audioBlob);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "An error occurred while sending voice audio.";
          dispatch({ type: "SET_ERROR", payload: errorMessage });
          setMessages((prev) => [...prev, { role: "ai", text: errorMessage }]);
        } finally {
          stopActiveStream();
          setIsRecording(false);
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not access microphone.";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      setMessages((prev) => [...prev, { role: "ai", text: errorMessage }]);
      stopActiveStream();
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      stopActiveStream();
      return;
    }

    recorder.stop();
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    void startRecording();
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Optimistic UI: add user message immediately
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue("");
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
      const postBody = {
        N: councilState.farmInputs.N,
        P: councilState.farmInputs.P,
        K: councilState.farmInputs.K,
        temperature: councilState.farmInputs.temperature,
        humidity: councilState.farmInputs.humidity,
        ph: councilState.farmInputs.ph,
        rainfall: councilState.farmInputs.rainfall,
        crop: councilState.farmInputs.crop,
        question: text,
        leaf_image_base64: null,
        field_image_base64: null,
      };

      const response = await fetch(
        `${baseUrl}/council/synthesize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = (await response.json()) as AssistantResponsePayload;
      if (result.weather_snapshot) setLiveWeather(result.weather_snapshot);
      if (result.mandi_snapshot) setMandiData(result.mandi_snapshot);

      // Update store with council outputs and synthesis
      if (result.council_outputs || result.synthesis) {
        dispatch({
          type: "SET_COUNCIL_RESPONSE",
          payload: {
            councilOutputs: result.council_outputs || {},
            synthesis: result.synthesis,
          },
        });
      }

      // Add synthesis to chat
      const synthesisText = result.synthesis || 'Response received but no synthesis data.';
      setMessages(prev => [...prev, { role: 'ai', text: synthesisText }]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      setMessages(prev => [...prev, { role: 'ai', text: 'Council unavailable — check that the backend is running on port 8000.' }]);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="text-green-500" /> KrishiMitra AI Assistant
        </h1>
        <p className="text-slate-400 mt-1">Context-aware AI agricultural assistant powered by real-time data.</p>
      </div>

      <FarmInputForm
        question={inputValue}
        onCouncilResponse={(result: AssistantResponsePayload) => {
          if (result.weather_snapshot) setLiveWeather(result.weather_snapshot);
          if (result.mandi_snapshot) setMandiData(result.mandi_snapshot);
          if (result.synthesis) {
            setMessages((prev) => [...prev, { role: "ai", text: result.synthesis! }]);
          }
        }}
      />

      <div className="flex-1 min-h-0 rounded-xl overflow-hidden shadow-lg flex bg-transparent border border-slate-800">
        <aside className="sticky top-0 hidden h-full w-80 flex-shrink-0 overflow-y-auto border-r border-slate-100 bg-white p-6 lg:block">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Soil Inputs
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Live Field Metrics
            </h2>
          </div>

          <div className="space-y-6">
            {soilMetricControls.map((metric) => {
              const value = Number(councilState.farmInputs[metric.key]);
              const displayValue = value.toFixed(metric.step < 1 ? 1 : 0);

              return (
                <label key={metric.key} className="block">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {metric.label}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {displayValue}{metric.unit}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={metric.min}
                    max={metric.max}
                    step={metric.step}
                    value={councilState.farmInputs[metric.key]}
                    onChange={(event) =>
                      dispatch({
                        type: "SET_FARM_INPUTS",
                        payload: { [metric.key]: Number(event.target.value) },
                      })
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600"
                  />
                </label>
              );
            })}
          </div>
        </aside>

        {/* Chat Interface */}
        <div className="min-w-0 flex-1 bg-slate-900 flex flex-col relative overflow-hidden">
          {/* Chat Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {visibleMessages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 mt-1">
                    <Bot size={20} className="text-green-500" />
                  </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-green-600 text-white rounded-tr-sm' : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
                {msg.role === 'ai' && i === visibleMessages.length - 1 && !councilState.isLoading && hasCouncilOutputs && (
                  <div className="w-full">
                    <CouncilResponseCards />
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User size={20} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            {councilState.isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 mt-1">
                  <Bot size={20} className="text-green-500" />
                </div>
                <div className="w-full">
                  <CouncilResponseCards />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="px-6 py-2 flex gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
            {suggestedPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-green-500 transition-colors rounded-full text-xs text-slate-300"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Ask your agricultural intelligence..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-24 py-4 focus:outline-none focus:border-green-500 transition-colors text-sm"
              />
              <div className="absolute right-3 flex items-center gap-2">
                <button type="button" title={isRecording ? "Stop recording" : "Start recording"} onClick={toggleRecording} className={`p-3 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Mic className="h-5 w-5" /></button>
                <button  title="Send message"
                  onClick={() => handleSend(inputValue)}
                  className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Context Panel */}
        <div className="hidden lg:flex lg:col-span-1 border border-slate-800 bg-slate-900/50 rounded-xl flex-col p-6 space-y-6 overflow-y-auto">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">Active Context</h2>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><MapPin size={16} className="text-blue-400" /> Farm Data</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between gap-3"><span>Selected Crop:</span><span className="text-white font-medium capitalize">{councilState.farmInputs.crop || "Awaiting crop input"}</span></div>
              <div className="flex justify-between gap-3"><span>NPK Levels:</span><span className="text-white font-medium">{`${councilState.farmInputs.N}/${councilState.farmInputs.P}/${councilState.farmInputs.K} kg/ha`}</span></div>
              <div className="flex justify-between gap-3"><span>pH / Rainfall:</span><span className="text-white font-medium">{`${councilState.farmInputs.ph} pH / ${councilState.farmInputs.rainfall} mm`}</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Cloud size={16} className="text-slate-400" /> Weather Context</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between gap-3"><span>Temperature:</span><span className="text-white font-medium">{weatherTemperature !== undefined && weatherTemperature !== null ? `${weatherTemperature}\u00B0C` : "Fetching Live Climate Telemetry..."}</span></div>
              <div className="flex justify-between gap-3"><span>Wind Speed:</span><span className="text-white font-medium">{weatherWind !== undefined && weatherWind !== null ? `${weatherWind} km/h` : "Fetching..."}</span></div>
              <div className="flex justify-between gap-3"><span>Status:</span><span className="text-white font-medium">{weatherSummary}</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><MapPin size={16} className="text-emerald-400" /> Mandi Context</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between gap-3"><span>Regional Market:</span><span className="text-white font-medium">{marketName || "Fetching Mandi Feed..."}</span></div>
              <div className="flex justify-between gap-3"><span>Commodity:</span><span className="text-white font-medium capitalize">{marketCommodity || "Awaiting crop input"}</span></div>
              <div className="flex justify-between gap-3"><span>Modal Price:</span><span className="text-emerald-300 font-bold">{formatMandiPrice(modalPrice)}</span></div>
              <div className="flex justify-between gap-3"><span>Unit:</span><span className="text-white font-medium">{marketUnit}</span></div>
              <div className="flex justify-between gap-3"><span>Source:</span><span className="text-white font-medium">{marketSource}</span></div>
              {mandiRates.length > 1 && (
                <div className="space-y-1 border-t border-slate-700/50 pt-2">
                  {mandiRates.slice(0, 3).map((rate, index) => (
                    <div key={`${rate.mandi || rate.market || "mandi"}-${index}`} className="flex justify-between gap-3">
                      <span className="truncate">{rate.mandi || rate.market || `Market ${index + 1}`}</span>
                      <span className="shrink-0 text-emerald-300 font-semibold">{formatMandiPrice(rate.modal_price ?? rate.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Leaf size={16} className="text-green-500" /> Soil Context</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between gap-3"><span>Score:</span><span className="text-green-400 font-bold">{soilScore !== undefined && soilScore !== null ? `${Math.round(Number(soilScore))} (${soilGrade})` : "Awaiting soil model"}</span></div>
              <div className="flex justify-between gap-3"><span>Moisture Proxy:</span><span className="text-white font-medium">{`${moistureProxy}% from humidity`}</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300"><AlertTriangle size={16} className="text-yellow-500" /> Risk Context</h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs space-y-2 text-slate-400">
              <div className="flex justify-between gap-3 underline border-red-500"><span>Heat Stress:</span><span className={heatStressClass}>{heatStressStatus}</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
