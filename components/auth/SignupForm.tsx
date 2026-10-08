"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

/**
 * Creates an auth account, provisions its profile, and starts the app session.
 */
export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("brand");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const client = createBrowserClient();
      const { data, error: signUpError } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { role },
        },
      });

      if (signUpError) {
        const message = signUpError.message.toLowerCase();
        setError(
          message.includes("already") || message.includes("registered")
            ? "An account with this email already exists. Sign in instead."
            : message.includes("password")
              ? "Choose a stronger password with at least 6 characters."
              : signUpError.message,
        );
        return;
      }

      if (!data.user) {
        setError("Supabase did not return a new account. Please try again.");
        return;
      }

      if (!data.session) {
        setNotice("Check your email to confirm your account. We’ll finish setup when you follow the confirmation link.");
        return;
      }

      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email: normalizedEmail, role }),
      });

      if (!response.ok) {
        const result: { error?: string } = await response.json();
        throw new Error(result.error || "Your account was created, but profile setup failed.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      console.error("[auth/signup] Account creation failed:", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to create your account right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500/50"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500/50"
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <label htmlFor="signup-confirm" className="mb-2 block text-sm font-medium text-gray-300">
          Confirm password
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500/50"
          placeholder="Re-enter your password"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-300">I’m joining as a</legend>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["brand", "Brand", "Discover AI creators"],
            ["creator", "Creator", "Showcase my work"],
          ] as const).map(([value, label, description]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-3 transition ${
                role === value
                  ? "border-purple-400/60 bg-purple-500/10"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-white">{label}</span>
              <span className="mt-1 block text-xs text-gray-400">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-sm text-purple-200">
          {notice}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="glow-hover flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {loading ? "Creating your account..." : "Create account"}
      </button>
    </form>
  );
}
