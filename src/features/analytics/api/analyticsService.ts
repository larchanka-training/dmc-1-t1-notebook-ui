import { apiClient } from "../../../shared/api/apiClient";

export type AnalyticsEventType =
  | "notebook_created"
  | "cell_executed"
  | "ai_request"
  | "execution_error";

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EventCountItem {
  event_type: string;
  count: number;
}

export interface DashboardResponse {
  total_events: number;
  events_by_type: EventCountItem[];
  recent_events: AnalyticsEvent[];
}

export const analyticsService = {
  trackEvent(
    eventType: AnalyticsEventType,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    return apiClient.post<void>("/analytics/events", { event_type: eventType, metadata });
  },

  getDashboard(): Promise<DashboardResponse> {
    return apiClient.get<DashboardResponse>("/analytics/dashboard");
  },
};
