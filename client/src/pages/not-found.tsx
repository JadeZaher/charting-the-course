import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

function NotFoundContent({ authenticated }: { authenticated: boolean }) {
  const destination = authenticated ? "/dashboard" : "/";

  return (
    <div className="grid min-h-[calc(100vh-7rem)] border border-foreground lg:grid-cols-12">
        <div className="flex flex-col justify-between border-b border-foreground p-6 sm:p-8 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em]">Routing notice / 404</p>
          <h1 id="not-found-title" className="my-16 text-[clamp(5rem,18vw,15rem)] font-black leading-[0.72] tracking-[-0.08em]">404</h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            This address does not match a page in the NEOS system. The resource may have moved or the link may be incomplete.
          </p>
        </div>

        <aside className="flex flex-col justify-between bg-foreground p-6 text-background sm:p-8 lg:col-span-4 lg:p-12">
          <AlertCircle className="h-10 w-10" aria-hidden="true" />
          <div className="my-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">Recommended action</p>
            <p className="mt-5 text-3xl font-black uppercase leading-tight">Return to the system index.</p>
          </div>
          <Button asChild variant="secondary" size="lg" className="w-full justify-between">
            <Link href={destination}>
              <ArrowLeft className="h-4 w-4" />
              {authenticated ? "Back to dashboard" : "Back to home"}
            </Link>
          </Button>
        </aside>
    </div>
  );
}

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <section aria-labelledby="not-found-title">
        <NotFoundContent authenticated />
      </section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex min-h-14 items-center justify-between border-b border-foreground px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.18em]">NEOS</Link>
        <ThemeToggle />
      </header>
      <main className="flex-1" aria-labelledby="not-found-title">
        <NotFoundContent authenticated={false} />
      </main>
    </div>
  );
}
