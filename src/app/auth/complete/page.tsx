import { SignInComplete } from "@/components/SignInComplete";

export const metadata = { title: "Signing in — NextFloor" };

export default function AuthCompletePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <SignInComplete />
    </main>
  );
}
