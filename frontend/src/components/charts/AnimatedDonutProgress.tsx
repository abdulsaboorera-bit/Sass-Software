"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
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

export default function AnimatedDonutProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = "#3b82f6",
  trackColor = "rgba(255,255,255,0.06)",
  label,
  sublabel,
  animationDuration = 1400,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
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

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const target = (value / max) * 100;
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / animationDuration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setProgress(ease * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, value, max, animationDuration]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={visible ? offset : circumference}
          style={{
            transition: `stroke-dashoffset ${animationDuration}ms cubic-bezier(0.16,1,0.3,1)`,
          }}
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
