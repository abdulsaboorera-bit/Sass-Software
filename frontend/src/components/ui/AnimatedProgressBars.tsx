"use client";

import { useEffect, useRef, useState } from "react";

const bars = [
  { label: "Client Satisfaction", value: 98, color: "#15757b" },
  { label: "System Uptime", value: 99.9, color: "#10b981" },
  { label: "Support Resolution", value: 94, color: "#8b5cf6" },
  { label: "Feature Adoption", value: 87, color: "#f97316" },
  { label: "On-time Delivery", value: 96, color: "#4a9ea2" },
];

export default function AnimatedProgressBars() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: "1.5rem" }}>
      {bars.map((item, i) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>{item.label}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: item.color }}>{item.value}%</span>
          </div>
          <div className="progress-bar-light">
            <div
              className="progress-fill"
              style={{
                "--progress-color": item.color,
                width: visible ? `${item.value}%` : "0%",
                transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${i * 150}ms`,
              } as React.CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
