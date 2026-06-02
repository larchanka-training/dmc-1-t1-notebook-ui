import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "./apiClient";

type FetchCall = [url: string, init: { method?: string; headers?: Record<string, string>; body?: string }];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, { status });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiClient", () => {
  describe("successful requests", () => {
    it("GET returns parsed JSON", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ ok: true }))));
      const result = await apiClient.get("/test");
      expect(result).toEqual({ ok: true });
    });

    it("204 response returns undefined without calling response.json()", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))));
      const result = await apiClient.get<undefined>("/test");
      expect(result).toBeUndefined();
    });

    it("POST sends JSON body with correct headers", async () => {
      const spy = vi.fn(() => Promise.resolve(jsonResponse({ created: true })));
      vi.stubGlobal("fetch", spy);
      await apiClient.post("/items", { name: "foo" });
      const [url, opts] = spy.mock.calls[0] as unknown as FetchCall;
      expect(url).toContain("/items");
      expect(opts.method).toBe("POST");
      expect(opts.headers).toMatchObject({ "Content-Type": "application/json" });
      expect(JSON.parse(opts.body as string)).toEqual({ name: "foo" });
    });

    it("DELETE request uses DELETE method", async () => {
      const spy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
      vi.stubGlobal("fetch", spy);
      await apiClient.delete("/items/1");
      expect((spy.mock.calls[0] as unknown as FetchCall)[1].method).toBe("DELETE");
    });
  });

  describe("401 handling", () => {
    it("retries non-auth paths after successful refresh", async () => {
      const spy = vi.fn()
        .mockResolvedValueOnce(new Response(null, { status: 401 }))  // first request → 401
        .mockResolvedValueOnce(new Response(null, { status: 204 }))  // refresh → ok
        .mockResolvedValueOnce(jsonResponse({ retried: true }));       // retry → ok
      vi.stubGlobal("fetch", spy);
      const result = await apiClient.get("/data");
      expect(result).toEqual({ retried: true });
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it("retries /auth/me after successful refresh", async () => {
      const spy = vi.fn()
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(jsonResponse({ id: "u1" }));
      vi.stubGlobal("fetch", spy);
      await apiClient.get("/auth/me");
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it("does NOT retry /auth/login on 401", async () => {
      const spy = vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 }));
      vi.stubGlobal("fetch", spy);
      await expect(apiClient.post("/auth/login", {})).rejects.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("does NOT retry /auth/register on 401", async () => {
      const spy = vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 }));
      vi.stubGlobal("fetch", spy);
      await expect(apiClient.post("/auth/register", {})).rejects.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("dispatches auth:session-expired when refresh fails and throws", async () => {
      const spy = vi.fn()
        .mockResolvedValueOnce(new Response(null, { status: 401 }))  // original request
        .mockResolvedValueOnce(new Response(null, { status: 401 })); // refresh fails
      vi.stubGlobal("fetch", spy);
      const events: Event[] = [];
      window.addEventListener("auth:session-expired", (e) => events.push(e));
      await expect(apiClient.get("/protected")).rejects.toThrow("Session expired");
      expect(events).toHaveLength(1);
      window.removeEventListener("auth:session-expired", () => {});
    });

    it("only issues one refresh request for concurrent 401s", async () => {
      let callCount = 0;
      const spy = vi.fn(() => {
        callCount++;
        if (callCount <= 2) return Promise.resolve(new Response(null, { status: 401 }));
        return Promise.resolve(jsonResponse({ ok: true }));
      });
      vi.stubGlobal("fetch", spy);
      // Two concurrent requests that both 401
      await Promise.allSettled([apiClient.get("/a"), apiClient.get("/b")]);
      const refreshCalls = (spy.mock.calls as unknown as [string][]).filter(([url]) =>
        url.includes("/auth/refresh")
      );
      expect(refreshCalls.length).toBeLessThanOrEqual(1);
    });
  });

  describe("error response parsing", () => {
    it("throws with detail string from JSON error body", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(jsonResponse({ detail: "Not found" }, 404)))
      );
      await expect(apiClient.get("/missing")).rejects.toThrow("Not found");
    });

    it("throws with joined messages from detail array", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse(
              {
                detail: [
                  { msg: "Value error, field is required" },
                  { msg: "must be a positive integer" },
                ],
              },
              422
            )
          )
        )
      );
      await expect(apiClient.post("/items", {})).rejects.toThrow(
        "field is required; must be a positive integer"
      );
    });

    it("falls back to status code message when body is not JSON", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(textResponse("", 500)))
      );
      await expect(apiClient.get("/boom")).rejects.toThrow("Request failed with status 500");
    });

    it("throws the plain text body when available and not JSON", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(textResponse("Internal Server Error", 500)))
      );
      await expect(apiClient.get("/boom")).rejects.toThrow("Internal Server Error");
    });
  });
});
