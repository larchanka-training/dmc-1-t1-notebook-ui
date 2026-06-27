import { describe, it, expect, vi, beforeEach } from "vitest";

import { analyticsService } from "./analyticsService";
import { apiClient } from "../../../shared/api/apiClient";

vi.mock("../../../shared/api/apiClient", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockPost = vi.mocked(apiClient.post);
const mockGet = vi.mocked(apiClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("analyticsService.trackEvent", () => {
  it("sends POST to /analytics/events with event_type and metadata", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    await analyticsService.trackEvent("notebook_created", { notebook_id: "abc" });

    expect(mockPost).toHaveBeenCalledWith("/analytics/events", {
      event_type: "notebook_created",
      metadata: { notebook_id: "abc" },
    });
  });

  it("defaults metadata to empty object when not provided", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    await analyticsService.trackEvent("cell_executed");

    expect(mockPost).toHaveBeenCalledWith("/analytics/events", {
      event_type: "cell_executed",
      metadata: {},
    });
  });
});

describe("analyticsService.getDashboard", () => {
  it("sends GET to /analytics/dashboard and returns the response", async () => {
    const dashboardData = {
      total_events: 10,
      events_by_type: [
        { event_type: "notebook_created", count: 3 },
        { event_type: "cell_executed", count: 7 },
      ],
      recent_events: [],
    };
    mockGet.mockResolvedValueOnce(dashboardData);

    const result = await analyticsService.getDashboard();

    expect(mockGet).toHaveBeenCalledWith("/analytics/dashboard");
    expect(result).toEqual(dashboardData);
  });
});
