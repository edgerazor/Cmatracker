import { useEffect, useState } from "react";

/** Animated semicircle gauge for probability of selling */
export default function ProbabilityGauge({ pct, label = "Probability of Selling" }: { pct: number; label?: string }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);

  const color = pct >= 70 ? "#16a34a" : pct >= 45 ? "#d97706" : "#dc2626";
  const r = 80;
  const circumference = Math.PI * r; // semicircle
  const offset = circumference * (1 - animated / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[110px]">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1), stroke .4s" }}
          />
          {/* Glow dot at arc end */}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="text-4xl font-extrabold tabular-nums" style={{ color }}>
            {Math.round(animated)}%
          </div>
        </div>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
    </div>
  );
}
