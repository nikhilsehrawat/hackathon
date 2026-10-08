"use client";

import Link from "next/link";

export default function Nav({ children }: { children?: React.ReactNode }) {
  return (
    <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="text-xl font-semibold text-white">CreatorIQ</span>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/creators"
          className="text-gray-300 hover:text-white transition text-sm px-3 py-2"
        >
          Creators
        </Link>
        <Link
          href="/dashboard"
          className="text-gray-300 hover:text-white transition text-sm px-3 py-2"
        >
          Dashboard
        </Link>
        {children || (
          <>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}