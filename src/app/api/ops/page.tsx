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

  return (
    <div style={{ padding: 24 }}>
      <h1>Ops Dashboard</h1>

      <h2>Payments</h2>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Retries</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td>{p.id.slice(0, 8)}</td>
              <td>{p.status}</td>
              <td>{p.retry_count}</td>
              <td>{new Date(p.updated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 40 }}>Alerts</h2>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Payment</th>
            <th>Triggered</th>
            <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map(a => (
            <tr key={a.id}>
              <td>{a.id.slice(0, 8)}</td>
              <td>{a.type}</td>
              <td>{a.payment_id.slice(0, 8)}</td>
              <td>{new Date(a.triggered_at).toLocaleString()}</td>
              <td>{a.resolved ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
