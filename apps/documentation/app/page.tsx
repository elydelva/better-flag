import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-2xl font-bold">better-flags</h1>
      <p className="mb-6 text-neutral-600">
        Headless TypeScript feature flags engine — docs, guides, API reference.
      </p>
      <Link
        href="/docs"
        className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
      >
        Go to Documentation
      </Link>
    </main>
  );
}
