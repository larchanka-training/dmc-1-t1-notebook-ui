import { useCallback } from "react";

import {
  type AnalyticsEventType,
  analyticsService,
} from "../api/analyticsService";

export function useAnalytics() {
  const track = useCallback(
    (eventType: AnalyticsEventType, metadata?: Record<string, unknown>) => {
      analyticsService.trackEvent(eventType, metadata).catch(() => {
        // Silently ignore analytics errors — don't disrupt user workflow
      });
    },
    [],
  );

  return { track };
}
