"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Activity,
  Bug,
  Droplets,
  FlaskConical,
  Leaf,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCouncil } from "@/lib/councilStore";

type OutputRecord = Record<string, unknown>;
type ThemeName =
  | "green"
  | "blue"
  | "earth"
  | "orange"
  | "purple"
  | "teal"
  | "red";

type RankedItem = {
  label: string;
  confidence: number | null;
};

type AdviceItem = {
  nutrient: string;
  dose: string;
  timing: string;
};

const CARD_ORDER = [
  "crop_recommender",
  "fertilizer",
  "soil_health",
  "yield_predictor",
  "irrigation",
  "growth_stage",
  "pest_identifier",
] as const;

const CARD_BASE =
  "rounded-xl border bg-slate-800/60 p-3 shadow-sm transition-all hover:border-slate-600";

const THEMES: Record<
  ThemeName,
  {
    border: string;
    text: string;
    soft: string;
    icon: string;
    bar: string;
    badge: string;
  }
> = {
  green: {
    border: "border-green-900/50",
    text: "text-green-400",
    soft: "bg-green-500/10",
    icon: "bg-green-500/10 text-green-400",
    bar: "bg-green-500",
    badge: "border-green-500/20 bg-green-500/10 text-green-300",
  },
  blue: {
    border: "border-blue-900/50",
    text: "text-blue-400",
    soft: "bg-blue-500/10",
    icon: "bg-blue-500/10 text-blue-400",
    bar: "bg-blue-500",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  earth: {
    border: "border-amber-900/50",
    text: "text-amber-400",
    soft: "bg-amber-500/10",
    icon: "bg-amber-500/10 text-amber-400",
    bar: "bg-amber-500",
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  orange: {
    border: "border-orange-900/50",
    text: "text-orange-400",
    soft: "bg-orange-500/10",
    icon: "bg-orange-500/10 text-orange-400",
    bar: "bg-orange-500",
    badge: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },
  purple: {
    border: "border-purple-900/50",
    text: "text-purple-400",
    soft: "bg-purple-500/10",
    icon: "bg-purple-500/10 text-purple-400",
    bar: "bg-purple-500",
    badge: "border-purple-500/20 bg-purple-500/10 text-purple-300",
  },
  teal: {
    border: "border-teal-900/50",
    text: "text-teal-400",
    soft: "bg-teal-500/10",
    icon: "bg-teal-500/10 text-teal-400",
    bar: "bg-teal-500",
    badge: "border-teal-500/20 bg-teal-500/10 text-teal-300",
  },
  red: {
    border: "border-red-900/50",
    text: "text-red-400",
    soft: "bg-red-500/10",
    icon: "bg-red-500/10 text-red-400",
    bar: "bg-red-500",
    badge: "border-red-500/20 bg-red-500/10 text-red-300",
  },
};

function asRecord(value: unknown): OutputRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as OutputRecord;
}

function getRenderableRecord(value: unknown): OutputRecord | null {
  const record = asRecord(value);
  if (!record || record.skipped === true) return null;
  return record;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getFirst(record: OutputRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function getString(
  record: OutputRecord,
  keys: string[],
  fallback = "Not provided"
): string {
  const value = getFirst(record, keys);
  if (value === undefined || value === null || value === "") return fallback;
  return formatLabel(String(value));
}

function getNumber(record: OutputRecord, keys: string[]): number | null {
  return toNumber(getFirst(record, keys));
}

function getList(record: OutputRecord, keys: string[]): unknown[] {
  const value = getFirst(record, keys);
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function formatLabel(value: string): string {
  return value.replace(/[_-]/g, " ").trim();
}

function formatNumber(value: number | null, suffix = ""): string {
  if (value === null) return "N/A";
  const formatted =
    Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted}${suffix}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

function normalizePercent(value: number | null): number {
  if (value === null) return 0;
  return clampPercent(value <= 1 ? value * 100 : value);
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function itemLabel(item: OutputRecord, fallback: string): string {
  return getString(
    item,
    [
      "label",
      "name",
      "crop",
      "crop_name",
      "pest",
      "pest_name",
      "predicted_pest",
      "class_name",
      "prediction",
    ],
    fallback
  );
}

function itemConfidence(item: OutputRecord): number | null {
  return getNumber(item, ["confidence", "probability", "score", "percent"]);
}

function rankedFromUnknown(value: unknown): RankedItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        const record = asRecord(item);
        if (record) {
          return {
            label: itemLabel(record, `Option ${index + 1}`),
            confidence: itemConfidence(record),
          };
        }
        return {
          label: formatLabel(String(item)),
          confidence: null,
        };
      })
      .filter((item) => item.label.length > 0);
  }

  const record = asRecord(value);
  if (!record) return [];

  return Object.entries(record)
    .map(([label, score]) => {
      const nested = asRecord(score);
      if (nested) {
        return {
          label: itemLabel(nested, formatLabel(label)),
          confidence: itemConfidence(nested),
        };
      }
      return {
        label: formatLabel(label),
        confidence: toNumber(score),
      };
    })
    .sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1));
}

function getRankedItems(
  record: OutputRecord,
  listKeys: string[],
  probabilityKeys: string[]
): RankedItem[] {
  const listValue = getFirst(record, listKeys);
  const listItems = rankedFromUnknown(listValue);
  if (listItems.length > 0) return listItems;

  const probabilityValue = getFirst(record, probabilityKeys);
  return rankedFromUnknown(probabilityValue);
}

function getAdviceItems(record: OutputRecord): AdviceItem[] {
  const rawItems = getList(record, [
    "advice_items",
    "advice",
    "recommendations",
    "items",
  ]);

  const adviceItems = rawItems
    .map((item) => {
      const itemRecord = asRecord(item);
      if (!itemRecord) {
        return {
          nutrient: formatLabel(String(item)),
          dose: "Dose not provided",
          timing: "Timing not provided",
        };
      }

      return {
        nutrient: getString(itemRecord, [
          "nutrient_name",
          "nutrient",
          "name",
          "fertilizer",
        ]),
        dose: getString(itemRecord, ["dose", "dosage", "amount"]),
        timing: getString(itemRecord, ["timing", "schedule", "when"]),
      };
    })
    .filter((item) => item.nutrient !== "Not provided");

  if (adviceItems.length > 0) return adviceItems;

  const recommended = getString(
    record,
    ["recommended_fertilizer", "fertilizer"],
    ""
  );
  if (!recommended) return [];

  return [
    {
      nutrient: recommended,
      dose: "Dose not provided",
      timing: "Timing not provided",
    },
  ];
}

function getBadgeClass(value: string): string {
  const normalized = value.toLowerCase();

  if (normalized === "excellent" || normalized === "mild") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (normalized === "good") {
    return "border-teal-500/20 bg-teal-500/10 text-teal-300";
  }

  if (normalized === "moderate") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  if (normalized === "poor" || normalized === "severe") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-slate-600 bg-slate-700/60 text-slate-300";
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

function CouncilCard({
  title,
  icon,
  theme,
  index,
  children,
}: {
  title: string;
  icon: ReactNode;
  theme: ThemeName;
  index: number;
  children: ReactNode;
}) {
  const palette = THEMES[theme];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.15, ease: "easeOut" }}
      className={cn(CARD_BASE, palette.border)}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            palette.icon
          )}
        >
          {icon}
        </div>
        <h3 className={cn("text-xs font-bold uppercase", palette.text)}>
          {title}
        </h3>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.15, ease: "easeOut" }}
      className={cn(CARD_BASE, "border-slate-700")}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-700" />
        <div className="h-3 w-28 animate-pulse rounded bg-slate-700" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-700" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-700" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-700" />
      </div>
    </motion.section>
  );
}

function RankedList({ items, theme }: { items: RankedItem[]; theme: ThemeName }) {
  const palette = THEMES[theme];

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No ranked items returned.</p>;
  }

  return (
    <ol className="space-y-2">
      {items.slice(0, 3).map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("text-xs font-bold", palette.text)}>
              {index + 1}
            </span>
            <span className="truncate text-sm font-medium text-slate-200">
              {item.label}
            </span>
          </div>
          <Badge className={palette.badge}>{formatPercent(item.confidence)}</Badge>
        </li>
      ))}
    </ol>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-slate-900/50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-100">{value}</p>
    </div>
  );
}

function CropRecommenderCard({
  data,
  index,
}: {
  data: OutputRecord;
  index: number;
}) {
  const topCrop = getString(data, ["top_crop", "recommended_crop", "crop"]);
  const recommendations = getRankedItems(
    data,
    ["recommendations", "top3", "top_3", "top_recommendations"],
    ["probabilities", "classes"]
  );
  const fallbackConfidence = getNumber(data, ["confidence", "probability"]);
  const topThree =
    recommendations.length > 0
      ? recommendations
      : [{ label: topCrop, confidence: fallbackConfidence }];

  return (
    <CouncilCard
      title="Crop Recommender"
      icon={<Leaf size={16} />}
      theme="green"
      index={index}
    >
      <div>
        <p className="text-[11px] font-medium uppercase text-slate-500">
          Top Crop
        </p>
        <p className="mt-1 text-2xl font-bold capitalize text-slate-50">
          {topCrop}
        </p>
      </div>
      <RankedList items={topThree} theme="green" />
    </CouncilCard>
  );
}

function FertilizerCard({
  data,
  index,
}: {
  data: OutputRecord;
  index: number;
}) {
  const adviceItems = getAdviceItems(data);
  const cost = getNumber(data, ["estimated_cost_inr"]);
  const deficiencies = getList(data, ["deficiencies", "nutrient_deficiencies"]);

  return (
    <CouncilCard
      title="Fertilizer Advisor"
      icon={<FlaskConical size={16} />}
      theme="blue"
      index={index}
    >
      <div className="space-y-2">
        {adviceItems.length > 0 ? (
          adviceItems.map((item, itemIndex) => (
            <div
              key={`${item.nutrient}-${itemIndex}`}
              className="rounded-lg bg-slate-900/50 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-100">{item.nutrient}</p>
                <p className="max-w-32 break-words text-right text-xs font-bold text-blue-300">
                  {item.dose}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-400">{item.timing}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No advice items returned.</p>
        )}
      </div>

      {cost !== null && (
        <Metric label="Estimated Cost" value={`INR ${formatNumber(cost)}`} />
      )}

      {deficiencies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {deficiencies.map((deficiency, deficiencyIndex) => (
            <Badge
              key={`${String(deficiency)}-${deficiencyIndex}`}
              className="border-amber-500/20 bg-amber-500/10 text-amber-300"
            >
              {formatLabel(String(deficiency))}
            </Badge>
          ))}
        </div>
      )}
    </CouncilCard>
  );
}

function SoilHealthCard({
  data,
  index,
}: {
  data: OutputRecord;
  index: number;
}) {
  const score = getNumber(data, ["score", "soil_score"]);
  const grade = getString(data, ["grade", "rating"]);
  const issues = getList(data, ["issues", "problems"]);

  return (
    <CouncilCard
      title="Soil Health"
      icon={<Activity size={16} />}
      theme="earth"
      index={index}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase text-slate-500">
            Score
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-50">
            {score !== null ? Math.round(score) : "N/A"}
            <span className="text-base font-semibold text-slate-500">/100</span>
          </p>
        </div>
        <Badge className={getBadgeClass(grade)}>{grade}</Badge>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
        {issues.length > 0 ? (
          issues.map((issue, issueIndex) => (
            <li key={`${String(issue)}-${issueIndex}`}>
              {formatLabel(String(issue))}
            </li>
          ))
        ) : (
          <li>No major issues flagged.</li>
        )}
      </ul>
    </CouncilCard>
  );
}

function YieldPredictorCard({
  data,
  index,
}: {
  data: OutputRecord;
  index: number;
}) {
  const estimated = getNumber(data, ["estimated_yield_ton_per_ha"]);
  const potential = getNumber(data, ["potential_yield_ton_per_ha"]);
  const gap = getNumber(data, ["gap_percent", "yield_gap_percent"]);
  const limiting = getFirst(data, ["limiting_factor", "limiting_factors"]);
  const limitingFactor = Array.isArray(limiting)
    ? limiting.map((item) => formatLabel(String(item))).join(", ")
    : limiting
      ? formatLabel(String(limiting))
      : "None";
  const maxYield = Math.max(estimated ?? 0, potential ?? 0, 1);

  return (
    <CouncilCard
      title="Yield Predictor"
      icon={<TrendingUp size={16} />}
      theme="orange"
      index={index}
    >
      <div className="space-y-3">
        <YieldBar
          label="Estimated"
          value={estimated}
          max={maxYield}
          theme="orange"
        />
        <YieldBar
          label="Potential"
          value={potential}
          max={maxYield}
          theme="green"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Gap" value={formatPercent(gap)} />
        <Metric label="Limiting Factor" value={limitingFactor} />
      </div>
    </CouncilCard>
  );
}

function YieldBar({
  label,
  value,
  max,
  theme,
}: {
  label: string;
  value: number | null;
  max: number;
  theme: ThemeName;
}) {
  const width = value === null ? 0 : clampPercent((value / max) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-400">{label}</span>
        <span className="font-bold text-slate-100">
          {formatNumber(value, " T/ha")}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className={cn("h-full rounded-full", THEMES[theme].bar)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function IrrigationCard({
  data,
  index,
}: {
  data: OutputRecord;
  index: number;
}) {
  const nextAction = getString(data, ["next_action"]);
  const deficit = getNumber(data, ["irrigation_deficit_mm"]);
  const irrigations = getNumber(data, ["irrigations_per_season"]);

  return (
    <CouncilCard
      title="Irrigation Scheduler"
      icon={<Droplets size={16} />}
      theme="purple"
      index={index}
    >
      <div className={cn("rounded-lg p-3", THEMES.purple.soft)}>
        <p className="text-[11px] font-medium uppercase text-purple-300">
          Next Action
        </p>
        <p className="mt-1 text-lg font-bold text-slate-50">{nextAction}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Deficit" value={formatNumber(deficit, " mm")} />
        <Metric
          label="Irrigations"
          value={irrigations !== null ? Math.round(irrigations) : "N/A"}
        />
      </div>
    </CouncilCard>
  );
}

function GrowthStageCard({
  data,
  index,
}: {
  data: OutputRecord;
  index: number;
}) {
  const stage = getString(
    data,
    ["stage", "stage_name", "predicted_stage", "class_name"],
    "unknown"
  );
  const confidence = getNumber(data, ["confidence"]);
  const stageNumber = getNumber(data, ["stage_number", "stageNumber"]);
  const percentComplete = getNumber(data, ["pct_complete", "percent_complete"]);
  const criticalActions = getList(data, [
    "critical_actions",
    "actions",
    "recommended_actions",
  ]);
  const isUnknown = stage.toLowerCase() === "unknown";
  const progress = normalizePercent(percentComplete);
  const confidenceFraction =
    confidence !== null && confidence > 1 ? confidence / 100 : confidence;

  return (
    <CouncilCard
      title="Growth Stage"
      icon={<Sprout size={16} />}
      theme="teal"
      index={index}
    >
      {isUnknown ? (
        <div className={cn("rounded-lg p-4 text-center", THEMES.teal.soft)}>
          <p className="text-lg font-bold text-slate-50">
            Awaiting field photo
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold capitalize text-slate-50">
                {stage}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Stage {stageNumber !== null ? Math.round(stageNumber) : "?"}/6
              </p>
            </div>
            <Badge className={THEMES.teal.badge}>
              {formatPercent(confidence)}
            </Badge>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>Complete</span>
              <span className="font-bold text-slate-200">
                {formatPercent(progress)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className={cn("h-full rounded-full", THEMES.teal.bar)}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {criticalActions.length > 0 && (
            <ul className="space-y-2">
              {criticalActions.map((action, actionIndex) => (
                <li
                  key={`${String(action)}-${actionIndex}`}
                  className="flex items-start gap-2 rounded-lg bg-slate-900/50 px-3 py-2 text-sm text-slate-300"
                >
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-amber-400"
                  />
                  <span>{formatLabel(String(action))}</span>
                </li>
              ))}
            </ul>
          )}

          {confidenceFraction !== null && confidenceFraction < 0.6 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
              Low confidence
            </div>
          )}
        </>
      )}
    </CouncilCard>
  );
}

function PestIdentifierCard({
  data,
  index,
}: {
  data: OutputRecord;
  index: number;
}) {
  if (data.detected !== true) return null;

  const pestName = getString(data, ["pest", "pest_name", "predicted_pest"]);
  const severity = getString(data, ["severity"], "Moderate");
  const topThree = getRankedItems(
    data,
    ["top3", "top_3", "detections", "recommendations"],
    ["probabilities", "all_classes", "classes"]
  );

  return (
    <CouncilCard
      title="Pest Identifier"
      icon={<Bug size={16} />}
      theme="red"
      index={index}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase text-slate-500">
            Pest
          </p>
          <p className="mt-1 truncate text-2xl font-bold capitalize text-slate-50">
            {pestName}
          </p>
        </div>
        <Badge className={getBadgeClass(severity)}>{severity}</Badge>
      </div>

      <RankedList
        items={
          topThree.length > 0
            ? topThree
            : [{ label: pestName, confidence: getNumber(data, ["confidence"]) }]
        }
        theme="red"
      />
    </CouncilCard>
  );
}

export function CouncilResponseCards() {
  const {
    state: { councilOutputs, isLoading },
  } = useCouncil();

  if (isLoading) {
    return (
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CARD_ORDER.map((key, index) => (
          <SkeletonCard key={key} index={index} />
        ))}
      </div>
    );
  }

  const cropRecommender = getRenderableRecord(councilOutputs.crop_recommender);
  const fertilizer = getRenderableRecord(councilOutputs.fertilizer);
  const soilHealth = getRenderableRecord(councilOutputs.soil_health);
  const yieldPredictor = getRenderableRecord(councilOutputs.yield_predictor);
  const irrigation = getRenderableRecord(councilOutputs.irrigation);
  const growthStage = getRenderableRecord(councilOutputs.growth_stage);
  const pestIdentifier = getRenderableRecord(councilOutputs.pest_identifier);

  const cards = [
    cropRecommender
      ? (index: number) => (
          <CropRecommenderCard
            key="crop_recommender"
            data={cropRecommender}
            index={index}
          />
        )
      : null,
    fertilizer
      ? (index: number) => (
          <FertilizerCard
            key="fertilizer"
            data={fertilizer}
            index={index}
          />
        )
      : null,
    soilHealth
      ? (index: number) => (
          <SoilHealthCard
            key="soil_health"
            data={soilHealth}
            index={index}
          />
        )
      : null,
    yieldPredictor
      ? (index: number) => (
          <YieldPredictorCard
            key="yield_predictor"
            data={yieldPredictor}
            index={index}
          />
        )
      : null,
    irrigation
      ? (index: number) => (
          <IrrigationCard
            key="irrigation"
            data={irrigation}
            index={index}
          />
        )
      : null,
    growthStage
      ? (index: number) => (
          <GrowthStageCard
            key="growth_stage"
            data={growthStage}
            index={index}
          />
        )
      : (index: number) => (
          <CouncilCard
            key="growth_stage"
            title="Growth Stage"
            icon={<Sprout size={16} />}
            theme="teal"
            index={index}
          >
            <div className={cn("rounded-lg p-4 text-center", THEMES.teal.soft)}>
              <p className="text-sm font-semibold text-slate-300">
                Not available in this version
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Planned for v2 with real field imagery data
              </p>
            </div>
          </CouncilCard>
        ),
    pestIdentifier?.detected === true
      ? (index: number) => (
          <PestIdentifierCard
            key="pest_identifier"
            data={pestIdentifier}
            index={index}
          />
        )
      : null,
  ].filter(Boolean) as Array<(index: number) => ReactNode>;

  if (cards.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((renderCard, index) => renderCard(index))}
    </div>
  );
}
