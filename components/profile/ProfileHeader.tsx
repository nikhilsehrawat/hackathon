import Link from "next/link";

/**
 * Shared profile hero for creator and brand profile pages.
 */
export default function ProfileHeader({
  avatar_url,
  name,
  tagline,
  role,
  verified = false,
  editable = false,
}: {
  avatar_url: string | null;
  name: string;
  tagline: string | null;
  role: "brand" | "creator";
  verified?: boolean;
  editable?: boolean;
}) {
  const initials = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <header className="glass mb-6 flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:p-8">
      <div className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-4xl font-bold text-white ${role === "brand" ? "rounded-xl" : ""}`}>
        {avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar_url} alt={`${name} avatar`} className="h-full w-full object-cover" />
        ) : initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold text-white">{name}</h1>
          <span className={`rounded-full px-3 py-1 text-xs capitalize ${role === "creator" ? "bg-purple-500/20 text-purple-300" : "bg-pink-500/20 text-pink-300"}`}>
            {role}
          </span>
          {verified && <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">✓ Verified {role === "brand" ? "Brand" : "Creator"}</span>}
        </div>
        <p className="text-gray-300">{tagline || (editable ? "Add a tagline" : "")}</p>
      </div>
      {editable && (
        <Link href="#edit-profile" className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-center text-sm font-medium text-white">
          Edit Profile
        </Link>
      )}
    </header>
  );
}
