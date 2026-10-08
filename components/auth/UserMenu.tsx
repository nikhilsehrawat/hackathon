"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { isMissingAuthSession } from "@/lib/supabase/auth-errors";

interface MenuProfile {
  email: string;
  role: "brand" | "creator";
  id: string;
  display_name: string;
  avatar_url: string | null;
}

/**
 * Shows the authenticated user's profile shortcut and account actions.
 */
export default function UserMenu() {
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<MenuProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let active = true;
    const client = createBrowserClient();

    async function loadProfile() {
      try {
        const { data, error } = await client.auth.getUser();
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          if (
            msg.includes("sub claim") ||
            msg.includes("does not exist") ||
            isMissingAuthSession(error)
          ) {
            await client.auth.signOut({ scope: "local" });
            if (active) setProfile(null);
            return;
          }
          console.warn("[auth/menu]", error.message);
        }
        if (!data.user) {
          if (active) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        try {
          const response = await fetch("/api/profile/me", { cache: "no-store" });
          if (!response.ok) {
            const result = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(result?.error ?? `Unable to load profile (${response.status}).`);
          }
          const result = (await response.json()) as { profile: MenuProfile };
          if (
            !result.profile ||
            (result.profile.role !== "brand" && result.profile.role !== "creator") ||
            typeof result.profile.display_name !== "string"
          ) {
            throw new Error("Profile response is missing a valid role or display name.");
          }
          if (active) setProfile(result.profile);
        } catch (error) {
          console.error("[auth/menu] Unable to load profile:", error);
          if (active) {
            setProfile({
              email: data.user.email ?? "",
              role: data.user.user_metadata.role === "creator" ? "creator" : "brand",
              id: data.user.id,
              display_name: data.user.email?.split("@")[0] ?? "Member",
              avatar_url: null,
            });
          }
        }
      } catch (error) {
        console.error("[auth/menu] Unable to check session:", error);
        if (active) {
          setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      void loadProfile();
    });
    const refreshProfile = () => void loadProfile();
    window.addEventListener("creatoriq:profile-updated", refreshProfile);
    return () => {
      active = false;
      window.removeEventListener("creatoriq:profile-updated", refreshProfile);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleSignOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningOut(true);
    setSignOutError("");
    try {
      const { error } = await createBrowserClient().auth.signOut();
      if (error) throw error;
      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("[auth/menu] Sign-out failed:", error);
      setSignOutError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <div aria-label="Loading account" className="h-10 w-24 animate-pulse rounded-xl bg-white/5" />;
  }
  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white">Sign in</Link>
        <Link href="/signup" className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white">Get Started</Link>
      </div>
    );
  }

  const displayName = profile.display_name || profile.email || "U";
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setSignOutError("");
          setOpen((value) => !value);
        }}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 text-sm text-gray-200 transition hover:border-purple-400/40 hover:bg-white/10"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-semibold text-white">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : initial}
        </span>
        <span className="hidden max-w-36 truncate sm:block">{displayName}</span>
        <span aria-hidden="true" className="text-gray-500">{open ? "⌃" : "⌄"}</span>
      </button>
      {open && (
        <div role="menu" className="glass absolute right-0 z-50 mt-2 w-64 rounded-xl p-2 shadow-xl shadow-black/40">
          <div className="border-b border-white/10 px-3 py-3">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-gray-400">{profile.email}</p>
            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${profile.role === "creator" ? "bg-purple-500/20 text-purple-300" : "bg-pink-500/20 text-pink-300"}`}>
              {profile.role}
            </span>
          </div>
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
            My Profile
          </Link>
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
            Settings
          </Link>
          <Link role="menuitem" href="/dashboard" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
            Dashboard
          </Link>
          <form action="/auth/signout" method="post" onSubmit={handleSignOut}>
            {signOutError && <p role="alert" className="px-3 py-2 text-xs text-red-300">{signOutError}</p>}
            <button role="menuitem" type="submit" disabled={signingOut} className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-60">
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
