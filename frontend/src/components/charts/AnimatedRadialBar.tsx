"use client";

import { useEffect, useRef, useState } from "react";

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: DataPoint[];
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
}

export default function AnimatedRadialBar({
  data,
  size = 200,
  strokeWidth = 14,
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
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / animationDuration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setProgress(ease);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, animationDuration]);

  const center = size / 2;
  const circumference = 2 * Math.PI * center;

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {data.map((item, i) => {
          const radius = center - strokeWidth * (i + 0.5);
          const circ = 2 * Math.PI * radius;
          const offset = circ - (item.value / 100) * circ * progress;

          return (
            <g key={item.label}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={visible ? offset : circ}
                style={{
                  transition: `stroke-dashoffset ${animationDuration}ms cubic-bezier(0.16,1,0.3,1)`,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
