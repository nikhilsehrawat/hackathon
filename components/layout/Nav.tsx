"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import UserMenu from "@/components/auth/UserMenu";
import { isMissingAuthSession } from "@/lib/supabase/auth-errors";

/**
 * Shared CreatorIQ navigation with signed-in account actions.
 */
export default function Nav({
  children,
}: {
  children?: ReactNode;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const client = createBrowserClient();
    let active = true;
    async function checkSession() {
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
            if (active) {
              setSignedIn(false);
              setChecked(true);
            }
            return;
          }
          console.warn("[layout/nav]", error.message);
        }
        if (active) {
          setSignedIn(Boolean(data.user));
          setChecked(true);
        }
      } catch (error: unknown) {
        console.error("[layout/nav] Session check failed:", error);
        if (active) {
          setSignedIn(false);
          setChecked(true);
        }
      }
    }
    void checkSession();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      setChecked(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">C</span>
        <span className="text-xl font-semibold text-white">CreatorIQ</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/creators" className="px-2 py-2 text-sm text-gray-300 transition hover:text-white sm:px-3">
          Creators
        </Link>
        {checked && signedIn && (
          <Link href="/dashboard" className="px-2 py-2 text-sm text-gray-300 transition hover:text-white sm:px-3">
            Dashboard
          </Link>
        )}
        {children}
        <UserMenu />
      </div>
    </nav>
  );
}
