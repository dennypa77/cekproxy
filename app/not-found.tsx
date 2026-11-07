import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-line">404</p>
      <h1 className="mt-3 text-lg font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted">The page you opened is not available.</p>
      <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
        Back to home
      </Link>
    </main>
  );
}
