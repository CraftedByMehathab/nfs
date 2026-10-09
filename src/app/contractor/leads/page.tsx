import Link from "next/link";
import { LeadList } from "@/components/LeadList";
import { TEXT_LINK } from "@/components/buttonStyles";

export const metadata = { title: "Quote requests — NextFloor" };

export default function LeadsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Quote requests</h1>
        <Link href="/contractor" className={TEXT_LINK}>
          My business page
        </Link>
      </div>
      <LeadList />
    </main>
  );
}
