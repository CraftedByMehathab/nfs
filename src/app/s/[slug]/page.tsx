import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createAnonymousClient, sharedPictureUrl } from "@/lib/supabase/client";

export const metadata = { title: "A floor finish preview — NextFloor" };

async function SharedPicture({ params }: { params: PageProps<"/s/[slug]">["params"] }) {
  const { slug } = await params;
  const supabase = createAnonymousClient();
  const { data } = supabase ? await supabase.rpc("get_shared_render", { slug }) : { data: null };
  const render = data?.[0];

  if (!render) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        This picture is not shared any more, or the link is wrong.
      </p>
    );
  }

  return (
    <figure className="flex w-full flex-col items-center gap-3">
      <Image
        src={sharedPictureUrl(slug)}
        alt={`A floor with a ${render.template_name} epoxy finish`}
        width={render.width}
        height={render.height}
        unoptimized
        priority
        className="h-auto max-h-[75vh] w-auto max-w-full rounded-lg"
      />
      <figcaption className="text-sm text-zinc-600 dark:text-zinc-400">
        Finish: {render.template_name}
      </figcaption>
    </figure>
  );
}

export default function SharedPage({ params }: PageProps<"/s/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">NextFloor</h1>
      <Suspense fallback={<p className="text-zinc-600 dark:text-zinc-400">Loading the picture…</p>}>
        <SharedPicture params={params} />
      </Suspense>
      <Link href="/" className="text-sm font-medium underline">
        Try a finish on your own floor
      </Link>
    </main>
  );
}
