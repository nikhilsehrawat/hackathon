"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import Toast from "@/components/ui/toast";

/**
 * Provides password, creator role-change, and account deletion settings.
 */
export default function SettingsPanel({
  email,
  role,
}: {
  email: string;
  role: "brand" | "creator";
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword) {
      setToast({ message: "Enter your current password to continue.", type: "error" });
      return;
    }
    if (password.length < 6) {
      setToast({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ message: "New passwords do not match.", type: "error" });
      return;
    }
    setSavingPassword(true);
    try {
      const client = createBrowserClient();
      const { error: verifyError } = await client.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) throw new Error("Current password is incorrect.");
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setToast({ message: "Password updated.", type: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to update password.", type: "error" });
    } finally {
      setSavingPassword(false);
    }
  }

  async function changeRole() {
    const confirmed = window.confirm("Switch this creator account to a brand account? Creator editing features will no longer be available under the current role.");
    if (!confirmed) return;
    setChangingRole(true);
    try {
      const response = await fetch("/api/profile/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "brand" }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to change account role.");
      router.replace("/profile");
      router.refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to change role.", type: "error" });
    } finally {
      setChangingRole(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm("This permanently deletes your PromptFolio account and profile. Continue?");
    if (!confirmed) return;
    const typed = window.prompt('Type DELETE to confirm permanent account deletion.');
    if (typed !== "DELETE") return;

    setDeleting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: typed }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to delete account.");
      await createBrowserClient().auth.signOut();
      router.replace("/");
      router.refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to delete account.", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <label className="mt-4 block text-sm text-gray-400">
          Email address
          <input readOnly value={email} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
        </label>
      </section>
      <form onSubmit={changePassword} className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <label className="mt-4 block text-sm text-gray-400">
          Current password
          <input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500/50" />
        </label>
        <label className="mt-4 block text-sm text-gray-400">
          New password
          <input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500/50" />
        </label>
        <label className="mt-4 block text-sm text-gray-400">
          Confirm new password
          <input type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500/50" />
        </label>
        <button disabled={savingPassword} className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{savingPassword ? "Updating..." : "Update password"}</button>
      </form>
      {role === "creator" && (
        <section className="glass rounded-2xl border border-amber-400/20 p-6">
          <h2 className="text-lg font-semibold text-white">Change account role</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">Switching to a brand account will change your marketplace access. Your creator profile data will be retained, but will no longer be editable while you are a brand.</p>
          <button type="button" disabled={changingRole} onClick={() => void changeRole()} className="mt-4 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white disabled:opacity-60">{changingRole ? "Switching..." : "Switch to Brand"}</button>
        </section>
      )}
      <section className="glass rounded-2xl border border-red-400/20 p-6">
        <h2 className="text-lg font-semibold text-red-200">Delete account</h2>
        <p className="mt-2 text-sm text-gray-400">Permanently remove your sign-in and PromptFolio profile data.</p>
        <button type="button" disabled={deleting} onClick={() => void deleteAccount()} className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm text-red-200 disabled:opacity-60">{deleting ? "Deleting..." : "Delete account"}</button>
      </section>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
