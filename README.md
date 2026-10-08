# CreatorIQ
AI Creator Marketplace Hackathon MVP

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication and profiles

CreatorIQ uses Supabase Auth sessions with `@supabase/ssr`. Set
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Add each development and production
origin's `/auth/callback` URL to Supabase Auth's allowed redirect URLs.

For Groq-powered brief generation, matching explanations, and the marketplace
chat assistant, set `OPENAI_API_KEY`, `OPENAI_BASE_URL=https://api.groq.com/openai/v1`,
and `OPENAI_MODEL=openai/gpt-oss-120b` in `.env.local`.

Apply the current SQL printed by `npm run migrate` in the Supabase SQL Editor.
The profile fields are added with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
statements for existing installations.

Create a **public** Supabase Storage bucket named `avatars`. The app validates
JPG, PNG, and WebP file signatures and enforces a 5 MB limit. Uploads are
performed by an authenticated server route using the service-role client; do
not expose the service-role key in browser code.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
