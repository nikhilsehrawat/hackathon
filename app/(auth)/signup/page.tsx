import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

/**
 * Renders the CreatorIQ account creation page.
 */
export default function SignupPage() {
  return (
    <section className="glass animate-fade-in rounded-2xl p-8 shadow-2xl shadow-purple-950/30">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
          C
        </span>
        <span className="text-xl font-semibold text-white">CreatorIQ</span>
      </Link>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-bold text-white">Join CreatorIQ</h1>
        <p className="mt-2 text-sm text-gray-400">
          Connect with the people shaping the future of AI content.
        </p>
      </div>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-purple-300 hover:text-purple-200">
          Sign in
        </Link>
      </p>
    </section>
  );
}
