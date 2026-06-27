import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  type DashboardResponse,
  analyticsService,
} from "../api/analyticsService";

const EVENT_LABELS: Record<string, string> = {
  notebook_created: "Notebooks Created",
  cell_executed: "Cells Executed",
  ai_request: "AI Requests",
  execution_error: "Execution Errors",
};

const EVENT_COLORS: Record<string, string> = {
  notebook_created: "bg-blue-500",
  cell_executed: "bg-green-500",
  ai_request: "bg-purple-500",
  execution_error: "bg-red-500",
};

export function AnalyticsDashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsService
      .getDashboard()
      .then(setDashboard)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load analytics"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Link to="/" className="text-blue-500 hover:underline">
          ← Back to notebooks
        </Link>
      </div>
    );
  }

  if (!dashboard || dashboard.total_events === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-500">No analytics events yet.</p>
        <Link to="/" className="text-blue-500 hover:underline">
          ← Back to notebooks
        </Link>
      </div>
    );
  }

  const maxCount = Math.max(
    ...dashboard.events_by_type.map((e) => e.count),
    1,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <Link
            to="/"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            ← Back to notebooks
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {dashboard.events_by_type.map((item) => (
            <div
              key={item.event_type}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${EVENT_COLORS[item.event_type] ?? "bg-gray-400"}`}
                />
                <span className="text-xs font-medium text-gray-500">
                  {EVENT_LABELS[item.event_type] ?? item.event_type}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Events by Type
          </h2>
          <div className="space-y-3">
            {dashboard.events_by_type.map((item) => (
              <div key={item.event_type} className="flex items-center gap-3">
                <span className="w-32 text-sm text-gray-600">
                  {EVENT_LABELS[item.event_type] ?? item.event_type}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${EVENT_COLORS[item.event_type] ?? "bg-gray-400"}`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-medium text-gray-700">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Events
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Event</th>
                  <th className="pb-2 pr-4 font-medium">Time</th>
                  <th className="pb-2 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_events.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${EVENT_COLORS[event.event_type] ?? "bg-gray-400"}`}
                      />
                      <span className="ml-2 text-gray-700">
                        {EVENT_LABELS[event.event_type] ?? event.event_type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 text-gray-500">
                      {Object.keys(event.metadata).length > 0
                        ? JSON.stringify(event.metadata)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
