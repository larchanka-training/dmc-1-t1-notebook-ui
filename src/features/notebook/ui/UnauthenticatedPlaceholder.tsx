interface UnauthenticatedPlaceholderProps {
  onOpenAuthModal: () => void;
}

export function UnauthenticatedPlaceholder({ onOpenAuthModal }: UnauthenticatedPlaceholderProps) {
  return (
    <main className="flex flex-1 h-screen items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-5 text-center px-6">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-stone-300"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-stone-700">Sign in to use the notebook app</h2>
          <p className="text-sm text-stone-400">Your notebooks will appear here after signing in.</p>
        </div>
        <button
          onClick={onOpenAuthModal}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors cursor-pointer"
        >
          Sign in / Sign up
        </button>
      </div>
    </main>
  );
}
