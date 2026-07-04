"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface Props {
  data: DataPoint[];
  height?: number;
  barSize?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  animationDuration?: number;
  gradient?: boolean;
  colors?: string[];
}

const defaultColors = [
  "#3b82f6",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#f59e0b",
  "#ef4444",
];

export default function AnimatedBarChart({
  data,
  height = 240,
  barSize = 32,
  showGrid = true,
  showAxis = true,
  animationDuration = 1000,
  gradient = true,
  colors = defaultColors,
}: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const gradientId = `barGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {visible && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barSize={barSize}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
            )}
            {showAxis && (
              <>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontSize: 12,
                color: "#f1f5f9",
                backdropFilter: "blur(8px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            {gradient && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            )}
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              animationBegin={0}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={gradient ? `url(#${gradientId})` : (entry.color || colors[index % colors.length])}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
