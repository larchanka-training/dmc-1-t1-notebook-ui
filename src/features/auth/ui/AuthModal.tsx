import { type FormEvent, useState } from "react";

import { useAuth } from "../model/authContext";

type Tab = "signin" | "signup";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth();

  const [tab, setTab] = useState<Tab>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await register(email, password, displayName.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => switchTab("signin")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors rounded-tl-xl ${
              tab === "signin"
                ? "text-stone-900 border-b-2 border-stone-800 -mb-px"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => switchTab("signup")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors rounded-tr-xl ${
              tab === "signup"
                ? "text-stone-900 border-b-2 border-stone-800 -mb-px"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            Sign up
          </button>
        </div>

        <div className="px-6 py-5">
          {tab === "signin" ? (
            <form className="flex flex-col gap-4" onSubmit={(e) => void handleSignIn(e)}>
              <Field
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                disabled={isLoading}
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <SubmitButton loading={isLoading} label="Sign in" />
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={(e) => void handleSignUp(e)}>
              <Field
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                disabled={isLoading}
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Field
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={setConfirmPassword}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Field
                label="Display name"
                type="text"
                placeholder="Your name"
                hint="Optional"
                value={displayName}
                onChange={setDisplayName}
                disabled={isLoading}
                autoComplete="name"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <SubmitButton loading={isLoading} label="Create account" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  hint,
  value,
  onChange,
  disabled,
  autoComplete,
}: {
  label: string;
  type: string;
  placeholder: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <label className="text-xs font-medium text-stone-700">{label}</label>
        {hint && <span className="text-xs text-stone-400">{hint}</span>}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        required={!hint}
        className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-colors disabled:opacity-50"
      />
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-400 border-t-white" />
      )}
      {loading ? "Please wait…" : label}
    </button>
  );
}
