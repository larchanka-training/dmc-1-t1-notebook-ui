import { Link } from "react-router-dom";

export function HelpPage() {
  return (
    <div className="flex h-screen items-center justify-center text-stone-500">
      <div className="text-center">
        <p className="text-sm">Help & documentation coming soon.</p>
        <Link to="/" className="mt-3 inline-block text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← Back to notebooks
        </Link>
      </div>
    </div>
  );
}
