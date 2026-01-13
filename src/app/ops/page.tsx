"use client";

import { useEffect, useState } from "react";
import MetricsCharts from "./components/MetricsCharts";

export default function OpsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const SLA_MINUTES = 5;

  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  const fetchData = async () => {
  setLoading(true);

  const [p, a, i] = await Promise.all([
    fetch("/api/ops/payments/list").then(r => r.json()),
    fetch("/api/ops/alerts/list").then(r => r.json()),
    fetch("/api/ops/incidents").then(r => r.json()),
  ]);

  setPayments(p);
  setAlerts(a);
  setIncidents(i);

  setLoading(false);
};

  useEffect(() => {
  fetchData();

  const interval = setInterval(() => {
    fetchData();
  }, 10000); // 10 seconds

  return () => clearInterval(interval);
}, []);

const openAuditTrail = async (paymentId: string) => {
  setSelectedPayment(paymentId);
  const res = await fetch(`/api/ops/payments/${paymentId}/events`);
  const data = await res.json();
  setEvents(data);
};

function getSlaStatus(createdAt: string) {
  const minutesOpen =
    (Date.now() - new Date(createdAt).getTime()) / 60000;

  if (minutesOpen >= SLA_MINUTES) {
    return { label: "BREACHED", color: "text-red-400", bg: "bg-red-900/40" };
  }

  if (minutesOpen >= SLA_MINUTES * 0.7) {
    return { label: "WARNING", color: "text-yellow-400", bg: "bg-yellow-900/40" };
  }

  return { label: "OK", color: "text-green-400", bg: "" };
}

  const actionPayment = async (id: string, action: string) => {
  try {
    setLoading(true);

    const res = await fetch(
      `/api/ops/payments/${id}?action=${action}`,
      { method: "POST" }
    );

    if (!res.ok) {
      console.error("OPS ACTION ERROR:", await res.text());
      return;
    }

    await fetchData();
  } finally {
    setLoading(false);
  }
};


  const resolveAlert = async (id: string) => {
    setLoading(true);
    await fetch(`/api/ops/alerts/${id}/resolve`, {
      method: "POST",
    });
    await fetchData();
    setLoading(false);
  };

  const resolveIncident = async (id: string) => {
  await fetch(`/api/ops/incidents/${id}/resolve`, {
    method: "POST",
  });

  await fetchData();
};

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <h1 className="text-3xl font-semibold mb-8">Ops Dashboard</h1>

      <MetricsCharts payments={payments} />

      {/* PAYMENTS */}
      <div className="bg-neutral-900 rounded-lg p-6 mb-10">
        <h2 className="text-xl font-medium mb-4">Payments</h2>

        <table className="w-full table-fixed text-sm">
          <thead className="text-neutral-400">
          <tr>
            <th className="w-[12%] text-left py-2">ID</th>
            <th className="w-[16%]">Status</th>
            <th className="w-[10%]">Retries</th>
            <th className="w-[32%]">Updated</th>
            <th className="w-[30%]">Actions</th>
          </tr>
        </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-t border-neutral-800">
                <td className="py-2 truncate">{p.id.slice(0, 8)}</td>
                <td className="text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      p.status === "completed"
                        ? "bg-green-600"
                        : p.status === "failed"
                        ? "bg-red-600"
                        : "bg-yellow-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="text-center">{p.retry_count}</td>
                <td className="text-center">{new Date(p.updated_at).toLocaleString()}</td>
                <td className="text-center space-x-2">
                  <button
                    disabled={loading || p.status === "completed"}
                    onClick={() => actionPayment(p.id, "retry")}
                    className={`px-3 py-1 rounded text-xs ${
                      p.status === "completed"
                        ? "bg-neutral-700 cursor-not-allowed"
                        : "bg-blue-600"
                    }`}
                  >
                    Retry
                  </button>

                  <button
                    disabled={loading || p.status === "completed"}
                    onClick={() => actionPayment(p.id, "cancel")}
                    className={`px-3 py-1 rounded text-xs ${
                      p.status === "completed"
                        ? "bg-neutral-700 cursor-not-allowed"
                        : "bg-red-600"
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => openAuditTrail(p.id)}
                    className="px-3 py-1 text-xs bg-neutral-700 rounded"
                  >
                    Timeline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ALERTS */}
      <div className="bg-neutral-900 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Alerts</h2>

        <table className="w-full table-fixed text-sm">
          <thead className="text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="w-[12%] text-left py-2">ID</th>
              <th className="w-[20%] text-center">Type</th>
              <th className="w-[18%] text-center">Payment</th>
              <th className="w-[25%] text-center">Triggered</th>
              <th className="w-[15%] text-center">Status</th>
              <th className="w-[10%] text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {alerts.map(a => (
              <tr key={a.id} className="border-t border-neutral-800">
                <td className="py-2 truncate">{a.id.slice(0, 8)}</td>

                <td className="text-center whitespace-nowrap">
                  {a.type}
                </td>

                <td className="text-center whitespace-nowrap">
                  {a.payment_id.slice(0, 8)}
                </td>

                <td className="text-center whitespace-nowrap">
                  {new Date(a.triggered_at).toLocaleString()}
                </td>

                <td className="text-center">
                  {a.resolved ? (
                    <span className="px-2 py-1 text-xs rounded bg-green-600">
                      Resolved
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded bg-yellow-600">
                      Open
                    </span>
                  )}
                </td>

                <td className="text-center">
                  {!a.resolved && (
                    <button
                      disabled={loading}
                      onClick={() => resolveAlert(a.id)}
                      className="px-3 py-1 bg-green-600 rounded text-xs"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-neutral-900 rounded-xl p-6 mt-8">
  <h2 className="text-lg font-semibold mb-4">Incidents</h2>

  <table className="w-full text-sm">
    <thead className="text-neutral-400 border-b border-neutral-700">
      <tr>
        <th className="text-left py-2">ID</th>
        <th className="text-left py-2">Level</th>
        <th className="text-left py-2">Reason</th>
        <th className="text-left py-2">Payment</th>
        <th className="text-left py-2">SLA</th>
        <th className="text-left py-2">Status</th>
        <th className="text-right py-2">Action</th>
      </tr>
    </thead>

    <tbody>
      {incidents.map(i => {
  const minutesOpen = Math.floor(
    (Date.now() - new Date(i.created_at).getTime()) / 60000
  );

  const sla = getSlaStatus(i.created_at);

  return (
    <tr
      key={i.id}
      className={`border-b border-neutral-800 ${sla.bg}`}
    >
      <td className="py-2">{i.id.slice(0, 8)}</td>

      <td className="py-2">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            i.level === "L2" ? "bg-red-600" : "bg-yellow-600"
          }`}
        >
          {i.level}
        </span>
      </td>

      <td className="py-2">{i.reason}</td>

      <td className="py-2">{i.payment_id.slice(0, 8)}</td>

      <td className={`py-2 font-medium ${sla.color}`}>
        {minutesOpen} min
      </td>

      <td className="py-2">
        <span className={`text-xs font-semibold ${sla.color}`}>
          {sla.label}
        </span>
      </td>

      <td className="py-2 text-right">
        {i.status === "open" && (
          <button
            onClick={() => resolveIncident(i.id)}
            className="px-3 py-1 text-xs bg-green-600 rounded"
          >
            Resolve
          </button>
        )}
      </td>
    </tr>
  );
})}
    </tbody>
  </table>
</div>
{selectedPayment && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-neutral-900 rounded-xl p-6 w-full max-w-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Payment Timeline
        </h2>
        <button
          onClick={() => {
            setSelectedPayment(null);
            setEvents([]);
          }}
          className="text-neutral-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {events.map((e, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              {idx !== events.length - 1 && (
                <div className="w-px flex-1 bg-neutral-700" />
              )}
            </div>

            <div className="pb-4">
              <div className="text-sm font-medium">
                {e.event_type.replaceAll("_", " ")}
              </div>
              <div className="text-xs text-neutral-400">
                {e.previous_status ?? "—"} → {e.new_status}
              </div>
              <div className="text-xs text-neutral-500">
                {new Date(e.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  );
}
