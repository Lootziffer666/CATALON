import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Terminal, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">CATALON</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/atelier" className="text-sm font-medium hover:underline">
              Atelier
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:underline">
              Docs
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-24 text-center">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            The Agentic Design System
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            A deterministic UI pipeline demo: prompt-to-A2UI JSON, reproducible preview plans, scoped execution planning, and rule-based self-healing.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/atelier">
              <Button size="lg">Open Atelier</Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg">
                Documentation
              </Button>
            </Link>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">A2UI Composer</h3>
              <p className="text-muted-foreground">
                Converts prompt text into deterministic A2UI JSON and preview instructions.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">OpenHands Executor</h3>
              <p className="text-muted-foreground">
                Validates that only approved A2UI structure can produce file mutation plans inside allowed paths.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Self-Healing</h3>
              <p className="text-muted-foreground">
                Applies known rule-based fixes for known break types instead of speculative retries.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}