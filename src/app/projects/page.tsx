import Link from "next/link";
import { ProjectList } from "@/components/ProjectList";

export const metadata = { title: "My projects — NextFloor" };

export default function ProjectsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My projects</h1>
        <Link href="/" className="text-sm font-medium underline">
          New picture
        </Link>
      </div>
      <ProjectList />
    </main>
  );
}
