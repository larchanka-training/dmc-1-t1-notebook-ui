/* eslint-disable */
// Web Worker — isolated JS execution engine.
// Non-strict so indirect eval binds var declarations to the worker's global scope (self).

// --- Block forbidden APIs ---
try { delete self.indexedDB; } catch (_) { self.indexedDB = undefined; }

// --- Snapshot built-in global keys (taken before any user code runs) ---
const BUILTIN_KEYS = new Set(Object.getOwnPropertyNames(self));

let executionCount = 0;
let currentCellId = null;
let pendingAsyncCount = 0;
let syncDone = false;

// --- Console intercept ---
function fmtArg(a) {
  if (typeof a === 'string') return a;
  try { return JSON.stringify(a); } catch (_) { return String(a); }
}

function sendConsole(stream, args) {
  self.postMessage({
    type: 'CONSOLE_OUTPUT',
    cellId: currentCellId,
    stream,
    text: args.map(fmtArg).join(' ') + '\n',
  });
}

self.console = {
  ...self.console,
  log: (...a) => sendConsole('stdout', a),
  warn: (...a) => sendConsole('stdout', ['[warn]', ...a]),
  error: (...a) => sendConsole('stderr', a),
  info: (...a) => sendConsole('stdout', a),
  debug: (...a) => sendConsole('stdout', a),
};

// --- Async tracking helpers ---
function asyncStart() { pendingAsyncCount++; }
function asyncEnd() {
  pendingAsyncCount--;
  checkDone();
}

function checkDone() {
  if (syncDone && pendingAsyncCount === 0) {
    executionCount++;
    self.postMessage({ type: 'CELL_EXECUTION_COMPLETE', cellId: currentCellId, executionCount });
  }
}

// --- Patch setTimeout / clearTimeout ---
const _nativeSetTimeout = self.setTimeout.bind(self);
const _nativeClearTimeout = self.clearTimeout.bind(self);
const _pendingTimeouts = new Set();

self.setTimeout = function (fn, delay, ...rest) {
  asyncStart();
  const id = _nativeSetTimeout(function () {
    _pendingTimeouts.delete(id);
    try { if (typeof fn === 'function') fn(...rest); } finally { asyncEnd(); }
  }, delay);
  _pendingTimeouts.add(id);
  return id;
};

self.clearTimeout = function (id) {
  if (_pendingTimeouts.has(id)) {
    _pendingTimeouts.delete(id);
    asyncEnd();
  }
  return _nativeClearTimeout(id);
};

// --- Patch setInterval / clearInterval ---
const _nativeSetInterval = self.setInterval.bind(self);
const _nativeClearInterval = self.clearInterval.bind(self);
const _activeIntervals = new Set();

self.setInterval = function (fn, delay, ...rest) {
  asyncStart();
  const id = _nativeSetInterval(function () {
    if (!_activeIntervals.has(id)) return;
    try { if (typeof fn === 'function') fn(...rest); } catch (_) {}
  }, delay);
  _activeIntervals.add(id);
  return id;
};

self.clearInterval = function (id) {
  if (_activeIntervals.has(id)) {
    _activeIntervals.delete(id);
    asyncEnd();
  }
  return _nativeClearInterval(id);
};

// --- Patch fetch ---
const _nativeFetch = self.fetch ? self.fetch.bind(self) : null;
if (_nativeFetch) {
  self.fetch = function (...args) {
    asyncStart();
    return _nativeFetch(...args).finally(() => asyncEnd());
  };
}

// --- Snapshot / rollback user vars ---
function snapshotUserVars() {
  const snap = {};
  for (const key of Object.getOwnPropertyNames(self)) {
    if (!BUILTIN_KEYS.has(key)) {
      snap[key] = self[key];
    }
  }
  return snap;
}

function restoreUserVars(snap) {
  // Remove vars added during this run
  for (const key of Object.getOwnPropertyNames(self)) {
    if (!BUILTIN_KEYS.has(key) && !(key in snap)) {
      try { delete self[key]; } catch (_) { self[key] = undefined; }
    }
  }
  // Restore vars that changed
  for (const [k, v] of Object.entries(snap)) {
    self[k] = v;
  }
}

// --- Message handler ---
self.onmessage = function (e) {
  const { type, cellId, code } = e.data;

  if (type === 'EXECUTE_CELL') {
    currentCellId = cellId;
    pendingAsyncCount = 0;
    syncDone = false;

    const snap = snapshotUserVars();

    try {
      // Indirect eval: executes in worker global scope.
      // var declarations attach to self (persist); let/const are block-scoped (don't persist).
      (0, eval)(code);
    } catch (err) {
      restoreUserVars(snap);
      const traceback = err.stack ? err.stack.split('\n') : [];
      self.postMessage({
        type: 'EXECUTION_ERROR',
        cellId,
        ename: err.name || 'Error',
        evalue: err.message || String(err),
        traceback,
      });
      return;
    }

    // Patch Promise to catch unhandled rejections arising from this cell
    self.onunhandledrejection = function (event) {
      restoreUserVars(snap);
      const err = event.reason;
      self.postMessage({
        type: 'EXECUTION_ERROR',
        cellId,
        ename: (err && err.name) || 'UnhandledRejection',
        evalue: (err && err.message) || String(err),
        traceback: (err && err.stack) ? err.stack.split('\n') : [],
      });
    };

    syncDone = true;
    checkDone();
  }
};
