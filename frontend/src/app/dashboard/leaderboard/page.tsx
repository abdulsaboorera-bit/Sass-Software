"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, CalendarCheck } from "lucide-react";

interface Entry { rank: number; memberId: string; name: string; memberNo: string; value: number }

export default function LeaderboardPage() {
  const [by, setBy] = useState<"streak" | "checkins">("streak");
  const [data, setData] = useState<{ unit: string; entries: Entry[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gym/insights/leaderboard?by=${by}&limit=15`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [by]);

  const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="text-amber-500" size={22} /> Leaderboard
        </h2>
        <p className="text-slate-500 text-sm">Most consistent members.</p>
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 mb-5">
        <button onClick={() => setBy("streak")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold border-none cursor-pointer ${by === "streak" ? "bg-blue-600 text-white" : "bg-transparent text-slate-600 dark:text-slate-300"}`}>
          <Flame size={15} /> Streak
        </button>
        <button onClick={() => setBy("checkins")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold border-none cursor-pointer ${by === "checkins" ? "bg-blue-600 text-white" : "bg-transparent text-slate-600 dark:text-slate-300"}`}>
          <CalendarCheck size={15} /> Check-ins (this month)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
        ) : !data?.entries.length ? (
          <div className="p-8 text-center text-slate-400 text-sm">No data yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.entries.map((e) => (
              <div key={e.memberId} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 text-center text-lg font-bold text-slate-700 dark:text-slate-200">{medal(e.rank)}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.memberNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-blue-600">{e.value}</p>
                  <p className="text-[11px] text-slate-400">{data.unit}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
