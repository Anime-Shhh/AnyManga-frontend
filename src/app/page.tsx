import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#261347_0%,#101018_55%,#09090b_100%)] px-5 pb-12 pt-28 text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">AnyManga</h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-300">
        Find a manga and read at your own pace.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/read" className="rounded-full bg-violet-500 px-6 py-3 font-semibold hover:bg-violet-400">
          Browse manga
        </Link>
        <Link href="/download" className="rounded-full border border-violet-200/30 px-6 py-3 font-medium hover:bg-white/10">
          Download manga
        </Link>
      </div>
    </div>
  );
}
