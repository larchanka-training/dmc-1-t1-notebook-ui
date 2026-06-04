// @vitest-environment node
// Tests for jsExecutor.worker.js using vm.runInNewContext so the worker code
// runs in an isolated context where `self` is our mock sandbox and
// `(0, eval)(userCode)` evaluates in that same sandbox — matching browser behavior.
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { runInNewContext } from "vm";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKER_CODE = readFileSync(resolve(__dirname, "./jsExecutor.worker.js"), "utf-8");

// A fresh MockResponse class per env so prototype patches don't bleed between tests.
function createMockResponseClass() {
  return class MockResponse {
    constructor(body) {
      this._body = typeof body === "string" ? body : JSON.stringify(body);
    }
    json() {
      return Promise.resolve(JSON.parse(this._body));
    }
    text() {
      return Promise.resolve(this._body);
    }
    blob() {
      return Promise.resolve(new Uint8Array(0));
    }
    arrayBuffer() {
      return Promise.resolve(new Uint8Array(0).buffer);
    }
    formData() {
      return Promise.reject(new Error("not supported"));
    }
  };
}

/**
 * Boots the worker code in a fresh vm context.
 * @param {Function|null} fetchFactory  Called as fetchFactory(MockResponse, ...args);
 *                                       should return a Promise<MockResponse>.
 */
function createEnv(fetchFactory = null) {
  const posted = [];
  const MockResponse = createMockResponseClass();

  const resolvedFetch = fetchFactory
    ? (...args) => fetchFactory(MockResponse, ...args)
    : null;

  const ctx = {
    postMessage: (msg) => posted.push(msg),
    onmessage: null,
    onunhandledrejection: null,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    fetch: resolvedFetch,
    Response: MockResponse,
    indexedDB: {},
    Promise: globalThis.Promise,
  };
  ctx.self = ctx;

  runInNewContext(WORKER_CODE, ctx);

  return { ctx, posted };
}

/**
 * Sends EXECUTE_CELL and returns a promise that resolves with all posted messages
 * once CELL_EXECUTION_COMPLETE or EXECUTION_ERROR arrives (or rejects on timeout).
 */
function runCell(ctx, posted, code, cellId = "test-cell") {
  return new Promise((resolve, reject) => {
    const startIdx = posted.length;

    const originalPM = ctx.postMessage;
    ctx.postMessage = (msg) => {
      originalPM(msg);
      if (msg.type === "CELL_EXECUTION_COMPLETE" || msg.type === "EXECUTION_ERROR") {
        ctx.postMessage = originalPM;
        resolve(posted.slice(startIdx));
      }
    };

    ctx.onmessage({ data: { type: "EXECUTE_CELL", cellId, code } });

    const timer = globalThis.setTimeout(() => {
      ctx.postMessage = originalPM;
      reject(new Error(`Timeout waiting for completion.\nMessages so far: ${JSON.stringify(posted.slice(startIdx), null, 2)}`));
    }, 8000);
    // If we resolve early, clean up the timeout (avoids Vitest warning).
    resolve = ((orig) => (msgs) => { globalThis.clearTimeout(timer); orig(msgs); })(resolve);
  });
}

// ---------- Helpers ----------

const consoleMessages = (msgs) =>
  msgs.filter((m) => m.type === "CONSOLE_OUTPUT").map((m) => m.text);

const completeMessages = (msgs) =>
  msgs.filter((m) => m.type === "CELL_EXECUTION_COMPLETE");

const errorMessages = (msgs) =>
  msgs.filter((m) => m.type === "EXECUTION_ERROR");

// ---------- Tests ----------

describe("jsExecutor.worker — synchronous execution", () => {
  it("captures a single console.log and sends CELL_EXECUTION_COMPLETE", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, 'console.log("hello worker");');
    expect(consoleMessages(msgs)).toContain("hello worker\n");
    expect(completeMessages(msgs)).toHaveLength(1);
  });

  it("captures multiple console.log calls in order", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, `
      console.log("first");
      console.log("second");
      console.log("third");
    `);
    expect(consoleMessages(msgs)).toEqual(["first\n", "second\n", "third\n"]);
  });

  it("console.warn goes to stdout stream", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, 'console.warn("caution");');
    const warnMsg = msgs.find((m) => m.type === "CONSOLE_OUTPUT" && m.text.includes("caution"));
    expect(warnMsg?.stream).toBe("stdout");
  });

  it("console.error goes to stderr stream", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, 'console.error("boom");');
    const errMsg = msgs.find((m) => m.type === "CONSOLE_OUTPUT" && m.text.includes("boom"));
    expect(errMsg?.stream).toBe("stderr");
  });

  it("serialises objects with JSON.stringify in console.log", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, 'console.log({x: 1, y: 2});');
    expect(consoleMessages(msgs)[0]).toContain('"x":');
  });

  it("sends EXECUTION_ERROR and no CELL_EXECUTION_COMPLETE on ReferenceError", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, "notDefined;");
    expect(errorMessages(msgs)).toHaveLength(1);
    expect(completeMessages(msgs)).toHaveLength(0);
    expect(errorMessages(msgs)[0].ename).toBe("ReferenceError");
  });

  it("sends EXECUTION_ERROR with message for syntax errors", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, "if (");
    expect(errorMessages(msgs)).toHaveLength(1);
  });

  it("blocks indexedDB access (deletes or sets to undefined)", () => {
    const { ctx } = createEnv();
    // After worker init, indexedDB should be gone or undefined
    expect(ctx.indexedDB == null).toBe(true);
  });

  it("increments executionCount on each cell run", async () => {
    const { ctx, posted } = createEnv();
    const msgs1 = await runCell(ctx, posted, "1;", "c1");
    const msgs2 = await runCell(ctx, posted, "2;", "c2");
    const count1 = completeMessages(msgs1)[0].executionCount;
    const count2 = completeMessages(msgs2)[0].executionCount;
    expect(count2).toBeGreaterThan(count1);
  });
});

describe("jsExecutor.worker — var scoping across cells", () => {
  it("var declarations persist across cell executions", async () => {
    const { ctx, posted } = createEnv();
    await runCell(ctx, posted, "var myGlobal = 42;", "c1");
    const msgs = await runCell(ctx, posted, "console.log(myGlobal);", "c2");
    expect(consoleMessages(msgs)).toContain("42\n");
  });

  it("let/const declarations do NOT persist across cells", async () => {
    const { ctx, posted } = createEnv();
    await runCell(ctx, posted, "let localVar = 99;", "c1");
    const msgs = await runCell(ctx, posted, `
      try {
        console.log(localVar);
      } catch(e) {
        console.log("not defined");
      }
    `, "c2");
    expect(consoleMessages(msgs)).toContain("not defined\n");
  });

  it("rolls back var when the cell throws", async () => {
    const { ctx, posted } = createEnv();
    // Set a var, then run a cell that sets another var and throws
    await runCell(ctx, posted, "var safe = 1;", "c1");
    await runCell(ctx, posted, "var unsafe = 2; throw new Error('bad');", "c2");
    // After rollback, unsafe should not be visible
    const msgs = await runCell(ctx, posted, `
      console.log(typeof unsafe === 'undefined' ? 'gone' : 'present');
    `, "c3");
    expect(consoleMessages(msgs)).toContain("gone\n");
  });
});

describe("jsExecutor.worker — setTimeout tracking", () => {
  it("waits for setTimeout before sending CELL_EXECUTION_COMPLETE", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, `
      setTimeout(function() {
        console.log("delayed");
      }, 50);
    `);
    expect(consoleMessages(msgs)).toContain("delayed\n");
    const delayedIdx = msgs.findIndex((m) => m.type === "CONSOLE_OUTPUT" && m.text === "delayed\n");
    const completeIdx = msgs.findIndex((m) => m.type === "CELL_EXECUTION_COMPLETE");
    expect(delayedIdx).toBeLessThan(completeIdx);
  });

  it("handles nested setTimeouts", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, `
      setTimeout(function() {
        console.log("outer");
        setTimeout(function() {
          console.log("inner");
        }, 20);
      }, 20);
    `);
    expect(consoleMessages(msgs)).toEqual(["outer\n", "inner\n"]);
  });

  it("clearTimeout prevents the callback from blocking completion", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, `
      var id = setTimeout(function() {
        console.log("should not run");
      }, 5000);
      clearTimeout(id);
    `);
    expect(consoleMessages(msgs)).not.toContain("should not run\n");
    expect(completeMessages(msgs)).toHaveLength(1);
  });
});

describe("jsExecutor.worker — fetch tracking (async completion bug fix)", () => {
  it("waits for fetch + response.json() chain before completing", async () => {
    const { ctx, posted } = createEnv(
      (MockResponse) => Promise.resolve(new MockResponse(JSON.stringify({ value: 42 })))
    );

    const msgs = await runCell(ctx, posted, `
      fetch("https://example.com/data")
        .then(function(r) { return r.json(); })
        .then(function(data) {
          console.log("got:" + data.value);
        });
    `);

    expect(consoleMessages(msgs)).toContain("got:42\n");
    const logIdx = msgs.findIndex((m) => m.type === "CONSOLE_OUTPUT");
    const completeIdx = msgs.findIndex((m) => m.type === "CELL_EXECUTION_COMPLETE");
    expect(logIdx).toBeLessThan(completeIdx);
  });

  it("captures logs inside setTimeout scheduled from a .then() callback", async () => {
    const { ctx, posted } = createEnv(
      (MockResponse) => Promise.resolve(new MockResponse("{}"))
    );

    const msgs = await runCell(ctx, posted, `
      fetch("https://example.com")
        .then(function(r) { return r.json(); })
        .then(function(data) {
          console.log("Async Step 1: fetch done");
          setTimeout(function() {
            console.log("Async Step 2: timeout done");
          }, 50);
        });
    `);

    const logs = consoleMessages(msgs);
    expect(logs).toContain("Async Step 1: fetch done\n");
    expect(logs).toContain("Async Step 2: timeout done\n");

    // Both logs must arrive BEFORE the completion signal
    const completeIdx = msgs.findIndex((m) => m.type === "CELL_EXECUTION_COMPLETE");
    msgs
      .filter((m) => m.type === "CONSOLE_OUTPUT")
      .forEach((cm) => {
        expect(msgs.indexOf(cm)).toBeLessThan(completeIdx);
      });
  });

  it("handles fetch error without hanging", async () => {
    const { ctx, posted } = createEnv(
      () => Promise.reject(new Error("network error"))
    );

    const msgs = await runCell(ctx, posted, `
      fetch("https://bad.example")
        .then(function(r) { return r.json(); })
        .catch(function(e) {
          console.log("caught:" + e.message);
        });
    `);

    expect(consoleMessages(msgs)).toContain("caught:network error\n");
    expect(completeMessages(msgs)).toHaveLength(1);
  });

  it("handles chained fetches (nested async work)", async () => {
    let callCount = 0;
    const { ctx, posted } = createEnv(
      (MockResponse) => {
        callCount++;
        return Promise.resolve(new MockResponse(JSON.stringify({ call: callCount })));
      }
    );

    const msgs = await runCell(ctx, posted, `
      fetch("https://example.com/1")
        .then(function(r) { return r.json(); })
        .then(function(d) {
          console.log("first:" + d.call);
          return fetch("https://example.com/2");
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          console.log("second:" + d.call);
        });
    `);

    const logs = consoleMessages(msgs);
    expect(logs).toContain("first:1\n");
    expect(logs).toContain("second:2\n");
    expect(completeMessages(msgs)).toHaveLength(1);
  });
});

describe("jsExecutor.worker — cellId routing", () => {
  it("tags CONSOLE_OUTPUT with the correct cellId", async () => {
    const { ctx, posted } = createEnv();
    await runCell(ctx, posted, 'console.log("x");', "my-cell-id");
    const output = posted.find((m) => m.type === "CONSOLE_OUTPUT");
    expect(output?.cellId).toBe("my-cell-id");
  });

  it("tags CELL_EXECUTION_COMPLETE with the correct cellId", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, "1;", "my-cell-id");
    expect(completeMessages(msgs)[0].cellId).toBe("my-cell-id");
  });

  it("tags EXECUTION_ERROR with the correct cellId", async () => {
    const { ctx, posted } = createEnv();
    const msgs = await runCell(ctx, posted, "throw new Error('oops');", "err-cell");
    expect(errorMessages(msgs)[0].cellId).toBe("err-cell");
  });
});
