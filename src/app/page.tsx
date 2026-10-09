import { Suspense } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { Logo } from "@/components/Logo";
import { Visualizer } from "@/components/Visualizer";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-4 sm:gap-8 sm:py-10">
      <nav className="flex min-h-6 w-full justify-end">
        <AccountMenu />
      </nav>
      <header className="text-center">
        <h1 className="flex justify-center">
          <Logo />
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Take or upload a photo of your floor to preview an epoxy finish.
        </p>
      </header>
      {/* Visualizer reads the query string, which is only known in the browser. */}
      <Suspense fallback={null}>
        <Visualizer />
      </Suspense>
    </main>
  );
}
