"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import type { PieLabelRenderProps } from "recharts";



const STATUS_COLORS: Record<string, string> = {
  initiated: "#eab308",       // yellow
  processing: "#3b82f6",      // blue
  completed: "#22c55e",       // green
  failed: "#ef4444",          // red
};



export default function MetricsCharts({ payments }: { payments: any[] }) {
  // Status distribution
  const statusCount = payments.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const ORDERED_STATUSES = ["initiated", "processing", "completed", "failed"];

  const renderPercentageLabel = ({
  percent,
}: PieLabelRenderProps) => {
  if (percent === undefined) return "";
  if (!percent || percent < 0.05) return "";
  return `${(percent * 100).toFixed(0)}%`;
};

const pieData = ORDERED_STATUSES
  .filter(status => statusCount[status])
  .map(status => ({
    name: status,
    value: statusCount[status],
  }));
  // Success vs Failure
  const successFailure = [
    {
      name: "Success",
      value: payments.filter(p => p.status === "completed").length,
    },
    {
      name: "Failure",
      value: payments.filter(p => p.status === "failed").length,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {/* PIE CHART */}
      <div className="bg-neutral-900 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Payment Status Distribution</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
                <Pie data={pieData} dataKey="value" label={renderPercentageLabel}>
                {pieData.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BAR CHART */}
      <div className="bg-neutral-900 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Success vs Failure</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={successFailure}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
