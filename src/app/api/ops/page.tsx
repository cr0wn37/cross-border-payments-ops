"use client";

import { useEffect, useState } from "react";

export default function OpsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/ops/payments/list")
      .then(res => res.json())
      .then(setPayments);

    fetch("/api/ops/alerts/list")
      .then(res => res.json())
      .then(setAlerts);
  }, []);

  const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: 12,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "1px solid #333",
  fontWeight: 600,
};

const cell: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #222",
  whiteSpace: "nowrap",
};

const idCell: React.CSSProperties = {
  ...cell,
  fontFamily: "monospace",
  width: 120,
};


  return (
  <div style={{ padding: 24, color: "#fff" }}>
    <h1>Ops Dashboard</h1>

    <h2>Payments</h2>
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Status</th>
          <th style={thStyle}>Retries</th>
          <th style={thStyle}>Updated</th>
        </tr>
      </thead>
      <tbody>
        {payments.map(p => (
          <tr key={p.id}>
            <td style={idCell}>{p.id.slice(0, 8)}</td>
            <td style={cell}>{p.status}</td>
            <td style={cell}>{p.retry_count}</td>
            <td style={cell}>
              {new Date(p.updated_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <h2 style={{ marginTop: 40 }}>Alerts</h2>
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Type</th>
          <th style={thStyle}>Payment</th>
          <th style={thStyle}>Triggered</th>
          <th style={thStyle}>Resolved</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map(a => (
          <tr key={a.id}>
            <td style={idCell}>{a.id.slice(0, 8)}</td>
            <td style={cell}>{a.type}</td>
            <td style={idCell}>{a.payment_id.slice(0, 8)}</td>
            <td style={cell}>
              {new Date(a.triggered_at).toLocaleString()}
            </td>
            <td style={cell}>{a.resolved ? "Yes" : "No"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}
