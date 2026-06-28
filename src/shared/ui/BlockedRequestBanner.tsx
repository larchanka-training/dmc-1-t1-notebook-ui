import { useEffect, useState } from "react";

export function BlockedRequestBanner() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const handler = () => setBlocked(true);
    window.addEventListener("api:request-blocked", handler);
    return () => window.removeEventListener("api:request-blocked", handler);
  }, []);

  if (!blocked) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm text-white shadow-lg">
      Browser extension (e.g. uBlock Origin) is blocking API requests. Disable it for this site to ensure analytics works correctly.
      <button
        className="ml-3 font-semibold underline"
        onClick={() => setBlocked(false)}
      >
        Dismiss
      </button>
    </div>
  );
}
