"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ChefHat, Clock, Receipt, Printer } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface OrderItem {
  id: string;
  menuItemName?: string;
  quantity: number;
  notes?: string;
}
interface Order {
  id: string;
  orderNumber: number;
  type: string;
  status: string;
  table?: { number?: number } | null;
  orderItems?: OrderItem[];
  createdAt?: string;
  notes?: string;
}
type Board = Record<string, Order[]>;

interface ZReport {
  period: { from: string; to: string };
  orders: { count: number; paid: number; unpaid: number };
  sales: { gross: number; subtotal: number; tax: number; discount: number; serviceCharge: number; deliveryFee: number };
  collected: number;
  outstanding: number;
  byMethod: Record<string, number>;
  topItems: { name: string; quantity: number; revenue: number }[];
}

const COLUMNS: { key: string; label: string; next?: string; nextLabel?: string }[] = [
  { key: "OPEN", label: "New", next: "PREPARING", nextLabel: "Start" },
  { key: "PREPARING", label: "Preparing", next: "SERVED", nextLabel: "Mark Ready" },
  { key: "SERVED", label: "Ready / Served", next: "COMPLETED", nextLabel: "Complete" },
];

export default function KitchenPage() {
  const [tab, setTab] = useState<"kds" | "z">("kds");
  const [board, setBoard] = useState<Board>({ OPEN: [], PREPARING: [], SERVED: [] });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [report, setReport] = useState<ZReport | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const loadBoard = useCallback(async () => {
    try {
      const response = await fetch("/api/restaurant/kitchen/orders", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load kitchen board");
      setBoard(data.board || { OPEN: [], PREPARING: [], SERVED: [] });
      setNow(Date.now());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load kitchen board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBoard(); }, [loadBoard]);

  const advance = async (order: Order, status: string) => {
    if (!can("orders.edit")) {
      setError("You don't have permission to update orders");
      return;
    }
    const response = await fetch(`/api/restaurant/orders/${order.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to update order");
      return;
    }
    await loadBoard();
  };

  const loadReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurant/reports/z-report?date=${reportDate}`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load Z-report");
      setReport(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load Z-report");
    }
  }, [reportDate]);

  useEffect(() => { if (tab === "z") void loadReport(); }, [tab, loadReport]);

  const minutesAgo = (iso?: string) => (iso && now ? Math.floor((now - new Date(iso).getTime()) / 60000) : 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Kitchen</h2>
          <p className="text-slate-500 text-sm">Live order tickets and end-of-day sales summary.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("kds")} className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${tab === "kds" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>Display</button>
          <button onClick={() => setTab("z")} className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${tab === "z" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>Z-Report</button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {tab === "kds" ? (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => void loadBoard()} className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl cursor-pointer">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <div key={col.key} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 min-h-[200px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-bold text-slate-700 text-sm">{col.label}</h3>
                    <span className="text-xs font-semibold text-slate-500">{board[col.key]?.length || 0}</span>
                  </div>
                  <div className="space-y-3">
                    {(board[col.key] || []).map((order) => (
                      <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">#{order.orderNumber}</span>
                          <span className="text-[11px] text-slate-400 inline-flex items-center gap-1"><Clock size={11} /> {minutesAgo(order.createdAt)}m</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{order.type?.replace("_", " ")}{order.table?.number ? ` · Table ${order.table.number}` : ""}</p>
                        <ul className="mt-2 space-y-1">
                          {(order.orderItems || []).map((it) => (
                            <li key={it.id} className="text-sm text-slate-700 flex gap-2">
                              <span className="font-semibold">{it.quantity}×</span>
                              <span>{it.menuItemName || "Item"}{it.notes ? <em className="text-slate-400"> — {it.notes}</em> : null}</span>
                            </li>
                          ))}
                        </ul>
                        {col.next && can("orders.edit") && (
                          <button onClick={() => advance(order, col.next!)} className="mt-3 w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer border-none">
                            {col.nextLabel}
                          </button>
                        )}
                      </div>
                    ))}
                    {(board[col.key] || []).length === 0 && <p className="text-center text-slate-400 text-xs py-6">No orders</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-slate-400" />
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl cursor-pointer"><Printer size={14} /> Print</button>
          </div>
          {!report ? (
            <p className="text-center text-slate-400 text-sm py-10">No report loaded.</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Orders", value: report.orders.count },
                  { label: "Paid", value: report.orders.paid },
                  { label: "Unpaid", value: report.orders.unpaid },
                  { label: "Outstanding", value: `PKR ${report.outstanding.toLocaleString()}` },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] uppercase text-slate-500">{s.label}</p>
                    <p className="font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-2 inline-flex items-center gap-1"><Receipt size={15} /> Sales</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {[
                    ["Subtotal", report.sales.subtotal], ["Tax", report.sales.tax], ["Discount", report.sales.discount],
                    ["Service charge", report.sales.serviceCharge], ["Delivery", report.sales.deliveryFee], ["Gross", report.sales.gross],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-800">PKR {Number(value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-2">Collected by method</h3>
                {Object.keys(report.byMethod).length === 0 ? <p className="text-slate-400 text-sm">No payments recorded.</p> : (
                  <div className="space-y-1 text-sm">
                    {Object.entries(report.byMethod).map(([method, amount]) => (
                      <div key={method} className="flex justify-between border-b border-slate-100 py-1">
                        <span className="text-slate-500">{method.replace("_", " ")}</span>
                        <span className="font-semibold text-slate-800">PKR {Number(amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1">
                      <span className="font-semibold text-slate-700">Total collected</span>
                      <span className="font-bold text-slate-900">PKR {report.collected.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
              {report.topItems.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">Top items</h3>
                  <div className="space-y-1 text-sm">
                    {report.topItems.map((it) => (
                      <div key={it.name} className="flex justify-between border-b border-slate-100 py-1">
                        <span className="text-slate-600">{it.name} <span className="text-slate-400">×{it.quantity}</span></span>
                        <span className="font-semibold text-slate-800">PKR {Number(it.revenue).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
