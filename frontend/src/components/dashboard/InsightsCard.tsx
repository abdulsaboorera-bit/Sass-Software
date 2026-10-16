"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, TrendingUp, TrendingDown, Minus, TriangleAlert, Zap } from "lucide-react";

interface InsightMetric {
  key: string;
  label: string;
  kind: "amount" | "count";
  current: number;
  previous: number;
  changePct: number;
  direction: "up" | "down" | "flat";
  severity: "positive" | "warning" | "critical" | "neutral";
  sentence: string;
}

interface InsightAnomaly {
  metric: string;
  date: string;
  value: number;
  zScore: number;
  kind: "spike" | "drop";
}

interface InsightForecast {
  metric: string;
  horizonDays: number;
  projectedTotal: number;
  dailyAverage: number;
  slopePerDay: number;
  direction: "up" | "down" | "flat";
  method: string;
}

interface InsightsPayload {
  industry: string;
  windowDays: number;
  generatedAt: string;
  metrics: InsightMetric[];
  highlights: { severity: string; text: string }[];
  anomalies: InsightAnomaly[];
  forecast: InsightForecast | null;
}

const severityStyle: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-slate-50 text-slate-600 border-slate-200",
};

const formatValue = (metric: InsightMetric) =>
  metric.kind === "amount" ? `PKR ${metric.current.toLocaleString()}` : metric.current.toLocaleString();

function DirectionIcon({ direction }: { direction: InsightMetric["direction"] }) {
  if (direction === "up") return <TrendingUp size={14} />;
  if (direction === "down") return <TrendingDown size={14} />;
  return <Minus size={14} />;
}

export default function InsightsCard({ days = 30 }: { days?: number }) {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/insights?days=${days}`, { credentials: "include" });
      setData(res.ok ? await res.json() : null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  // Nothing to show (no data sources for this industry, or the call failed).
  if (!loading && (!data || data.metrics.length === 0)) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles size={16} />
          </span>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">Insights</h3>
            <p className="text-slate-400 text-[11px]">
              Auto-generated from your last {data?.windowDays ?? days} days &middot; free
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
          title="Refresh"
          aria-label="Refresh insights"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !data ? (
        <p className="text-slate-400 text-sm py-4">Analyzing your data...</p>
      ) : data ? (
        <>
          {/* Highlights */}
          {data.highlights.length > 0 && (
            <ul className="space-y-2 mb-5">
              {data.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${severityStyle[h.severity] || severityStyle.neutral}`}>
                    {h.severity === "critical" || h.severity === "warning" ? <TriangleAlert size={11} /> : <TrendingUp size={11} />}
                  </span>
                  <span className={h.severity === "critical" || h.severity === "warning" ? "text-slate-700 font-medium" : ""}>{h.text}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-5">
            {data.metrics.map((m) => (
              <div key={m.key} className="border border-slate-100 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">{m.label}</p>
                <p className="text-xl font-black text-slate-900">{formatValue(m)}</p>
                <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${severityStyle[m.severity] || severityStyle.neutral}`}>
                  <DirectionIcon direction={m.direction} />
                  {m.direction === "flat" ? "steady" : `${Math.abs(m.changePct)}%`}
                </span>
              </div>
            ))}
          </div>

          {/* Anomalies */}
          {data.anomalies.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-slate-400 text-xs font-semibold inline-flex items-center gap-1">
                <Zap size={12} /> Anomalies
              </span>
              {data.anomalies.map((a, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${a.kind === "spike" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                  title={`z-score ${a.zScore}`}
                >
                  {a.kind === "spike" ? "Spike" : "Drop"} on {a.date}: {a.value.toLocaleString()}
                </span>
              ))}
            </div>
          )}

          {/* Forecast */}
          {data.forecast && (
            <p className="text-slate-500 text-xs border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-700">Forecast:</span> next {data.forecast.horizonDays} days of {data.forecast.metric.toLowerCase()} projected at{" "}
              <span className="font-semibold text-slate-900">
                {data.metrics[0]?.kind === "amount" ? "PKR " : ""}
                {data.forecast.projectedTotal.toLocaleString()}
              </span>{" "}
              (~{data.forecast.dailyAverage.toLocaleString()}/day, trending {data.forecast.direction}). <span className="text-slate-400">{data.forecast.method}</span>
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
