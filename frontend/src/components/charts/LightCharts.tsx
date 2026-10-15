import type { CSSProperties } from "react";

/* ─────────────────────────────────────────────────────────
   Lightweight, dependency-free charts.
   Pure SVG / CSS — no recharts, no rAF, no IntersectionObserver.
   Server-component safe (no hooks) and cheap to render.
───────────────────────────────────────────────────────── */

interface BarPoint {
  name: string;
  value: number;
  color?: string;
}

interface BarProps {
  data: BarPoint[];
  height?: number;
  barSize?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  animationDuration?: number;
  gradient?: boolean;
  colors?: string[];
}

interface LinePoint {
  name: string;
  value: number;
  value2?: number;
}

interface LineProps {
  data: LinePoint[];
  height?: number;
  color?: string;
  color2?: string;
  name2?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  animationDuration?: number;
  strokeWidth?: number;
}

interface PiePoint {
  name: string;
  value: number;
  color?: string;
}

interface PieProps {
  data: PiePoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  animationDuration?: number;
  colors?: string[];
}

interface DonutProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  animationDuration?: number;
}

const defaultColors = [
  "#15757b",
  "#4a9ea2",
  "#8b5cf6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#f59e0b",
  "#ef4444",
];

export function AnimatedBarChart({
  data,
  height = 240,
  barSize = 32,
  showGrid = true,
  showAxis = true,
  gradient = true,
  colors = defaultColors,
}: BarProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - (showAxis ? 22 : 0);
  const grid: CSSProperties = showGrid
    ? {
        backgroundImage:
          "repeating-linear-gradient(to top, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.18) 1px, transparent 1px, transparent 25%)",
      }
    : {};

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: chartHeight,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          gap: 6,
          paddingTop: 8,
          ...grid,
        }}
      >
        {data.map((d, i) => {
          const color = d.color || colors[i % colors.length];
          return (
            <div
              key={`${d.name}-${i}`}
              style={{
                flex: 1,
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: barSize,
                  maxWidth: "100%",
                  height: `${(d.value / max) * 100}%`,
                  borderRadius: "6px 6px 0 0",
                  background: gradient
                    ? `linear-gradient(180deg, ${color}, ${color}99)`
                    : color,
                }}
              />
            </div>
          );
        })}
      </div>
      {showAxis && (
        <div style={{ display: "flex", marginTop: 6 }}>
          {data.map((d, i) => (
            <span
              key={`${d.name}-label-${i}`}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 11,
                fontWeight: 500,
                color: "#64748b",
              }}
            >
              {d.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnimatedLineChart({
  data,
  height = 220,
  color = "#15757b",
  color2 = "#8b5cf6",
  showGrid = true,
  showAxis = true,
  strokeWidth = 2,
}: LineProps) {
  const W = 600;
  const H = 240;
  const padX = 8;
  const padTop = 16;
  const padBottom = 16;
  const n = data.length;

  const values: number[] = [];
  data.forEach((d) => {
    values.push(d.value);
    if (typeof d.value2 === "number") values.push(d.value2);
  });
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const x = (i: number) => padX + (n <= 1 ? 0 : (i / (n - 1)) * (W - padX * 2));
  const y = (v: number) =>
    padTop + (1 - (v - min) / span) * (H - padTop - padBottom);
  const pts = (key: "value" | "value2") =>
    data
      .map((d, i) => `${x(i).toFixed(1)},${y((d[key] as number) ?? 0).toFixed(1)}`)
      .join(" ");

  const hasSecond = data.some((d) => typeof d.value2 === "number");
  const area = `${padX},${H - padBottom} ${pts("value")} ${W - padX},${H - padBottom}`;

  return (
    <div style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {showGrid &&
          [0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const gy = padTop + f * (H - padTop - padBottom);
            return (
              <line
                key={i}
                x1={0}
                y1={gy}
                x2={W}
                y2={gy}
                stroke="rgba(148,163,184,0.18)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        <polygon points={area} fill={color} fillOpacity={0.08} />
        {hasSecond && (
          <polyline
            points={pts("value2")}
            fill="none"
            stroke={color2}
            strokeWidth={strokeWidth}
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline
          points={pts("value")}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {showAxis && (
        <div style={{ display: "flex", marginTop: 6 }}>
          {data.map((d, i) => (
            <span
              key={`${d.name}-${i}`}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 11,
                fontWeight: 500,
                color: "#64748b",
              }}
            >
              {d.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnimatedPieChart({
  data,
  innerRadius = 55,
  outerRadius = 85,
  colors = defaultColors,
}: PieProps) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = (innerRadius + outerRadius) / 2;
  const thickness = Math.max(outerRadius - innerRadius, 4);
  const circumference = 2 * Math.PI * r;
  const dim = outerRadius * 2 + thickness;

  let offset = 0;

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={dim}
        height={dim}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const dash = (d.value / total) * circumference;
          const el = (
            <circle
              key={`${d.name}-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color || colors[i % colors.length]}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
    </div>
  );
}

export function AnimatedDonutProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = "#15757b",
  trackColor = "rgba(255,255,255,0.06)",
  label,
  sublabel,
}: DonutProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(Math.max(value / max, 0), 1);
  const dash = ratio * circumference;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label && (
          <span
            style={{
              fontSize: size * 0.22,
              fontWeight: 800,
              color: "#f9fafb",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span
            style={{
              fontSize: size * 0.1,
              color: "#64748b",
              fontWeight: 500,
              marginTop: 2,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
