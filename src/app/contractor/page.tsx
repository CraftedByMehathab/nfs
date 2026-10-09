import Link from "next/link";
import { ContractorSettings } from "@/components/ContractorSettings";
import { TEXT_LINK } from "@/components/buttonStyles";

export const metadata = { title: "My business page — NextFloor" };

export default function ContractorPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My business page</h1>
        <Link href="/" className={TEXT_LINK}>
          Home
        </Link>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400">
        For flooring contractors: put the visualizer under your own name and send customers the link.
      </p>
      <ContractorSettings />
    </main>
  );
}
