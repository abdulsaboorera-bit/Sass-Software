"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  value2?: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
  color?: string;
  color2?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  animationDuration?: number;
  gradient?: boolean;
  strokeWidth?: number;
  name2?: string;
}

export default function AnimatedLineChart({
  data,
  height = 240,
  color = "#15757b",
  color2 = "#8b5cf6",
  showGrid = true,
  showAxis = true,
  animationDuration = 1200,
  gradient = true,
  strokeWidth = 2.5,
  name2,
}: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const gradientId = useId().replace(/:/g, "");

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

  const gradientId1 = `areaGrad1-${gradientId}`;
  const gradientId2 = `areaGrad2-${gradientId}`;

  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {visible && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            {gradient && (
              <defs>
                <linearGradient id={gradientId1} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={gradientId2} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color2} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color2} stopOpacity={0} />
                </linearGradient>
              </defs>
            )}
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
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={strokeWidth}
              fill={gradient ? `url(#${gradientId1})` : "none"}
              animationBegin={0}
              animationDuration={animationDuration}
              animationEasing="ease-out"
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            {name2 && (
              <Area
                type="monotone"
                dataKey="value2"
                stroke={color2}
                strokeWidth={strokeWidth}
                fill={gradient ? `url(#${gradientId2})` : "none"}
                animationBegin={200}
                animationDuration={animationDuration}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: color2,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
