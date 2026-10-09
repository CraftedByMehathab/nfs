import { cache, Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Visualizer } from "@/components/Visualizer";
import { TEXT_LINK } from "@/components/buttonStyles";
import { textColourOn } from "@/lib/contractors/accent";
import { createAnonymousClient } from "@/lib/supabase/client";

const NOTE = "text-zinc-600 dark:text-zinc-400";

// Shared by the page and its title, so one visit makes one lookup.
const getContractor = cache(async (slug: string) => {
  const supabase = createAnonymousClient();
  const { data } = supabase ? await supabase.rpc("get_contractor", { slug }) : { data: null };
  return data?.[0] ?? null;
});

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const contractor = await getContractor(slug);
  return { title: contractor ? `${contractor.name} — floor visualizer` : "NextFloor" };
}

async function BrandedVisualizer({ params }: { params: PageProps<"/c/[slug]">["params"] }) {
  const { slug } = await params;
  const contractor = await getContractor(slug);

  if (!contractor) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <p className={NOTE}>There is no business page at this address.</p>
        <Link href="/" className={TEXT_LINK}>
          Try a finish on your own floor
        </Link>
      </main>
    );
  }

  return (
    <>
      <header
        className="flex flex-col items-center gap-1 px-4 py-5 text-center"
        style={{ backgroundColor: contractor.accent, color: textColourOn(contractor.accent) }}
      >
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{contractor.name}</h1>
        {(contractor.phone || contractor.email) && (
          <p className="flex flex-wrap justify-center gap-x-4 text-sm">
            {contractor.phone && (
              <a href={`tel:${contractor.phone}`} className="inline-flex min-h-11 items-center underline">
                {contractor.phone}
              </a>
            )}
            {contractor.email && (
              <a href={`mailto:${contractor.email}`} className="inline-flex min-h-11 items-center underline">
                {contractor.email}
              </a>
            )}
          </p>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-4 sm:gap-8 sm:py-10">
        <p className={`text-center ${NOTE}`}>
          Take or upload a photo of your floor to preview an epoxy finish.
        </p>
        <Visualizer />
      </main>
      <footer className={`px-4 pb-4 text-center text-sm ${NOTE}`}>
        Powered by{" "}
        <Link href="/" className="underline">
          NextFloor
        </Link>
      </footer>
    </>
  );
}

export default function ContractorVisualizerPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<p className={`m-auto ${NOTE}`}>Loading…</p>}>
      <BrandedVisualizer params={params} />
    </Suspense>
  );
}
