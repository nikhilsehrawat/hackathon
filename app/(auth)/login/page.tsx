import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const instant = false;

function LoginPanel({ initialError }: { initialError?: string }) {
  return (
    <section className="glass animate-fade-in rounded-2xl p-8 shadow-2xl shadow-purple-950/30">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
          C
        </span>
        <span className="text-xl font-semibold text-white">CreatorIQ</span>
      </Link>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to continue to your creator marketplace.
        </p>
      </div>
      <LoginForm initialError={initialError} />
      <p className="mt-6 text-center text-sm text-gray-400">
        New to CreatorIQ?{" "}
        <Link href="/signup" className="font-medium text-purple-300 hover:text-purple-200">
          Create an account
        </Link>
      </p>
    </section>
  );
}

/**
 * Renders the CreatorIQ login page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "confirmation"
      ? "That confirmation link is invalid or expired. Please sign up again or request a new link."
      : undefined;

  return <LoginPanel initialError={initialError} />;
}
