import { Link } from "wouter";

interface CommunityGateCardProps {
  eyebrow: string;
  heading: string;
  body: string;
}

/** End-of-article call-to-action card guiding non-technical readers into public communities or sign-in. */
export function CommunityGateCard({ eyebrow, heading, body }: CommunityGateCardProps) {
  return (
    <section className="mt-10 rounded-lg border border-border bg-muted/30 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-2 font-sans text-xl font-bold tracking-tight">{heading}</h2>
      <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/communities"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Explore communities
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Sign in or create account
        </Link>
      </div>
    </section>
  );
}
