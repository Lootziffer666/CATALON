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
            A living development environment combining A2UI Composer, OpenHands Execution Core, 
            and Self-Healing Logic for autonomous UI generation.
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
                The bridge between human and AI. Creates temporary previews (sandboxes) for 
                concept refinement using shadcn/ui as atomic building blocks.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">OpenHands Executor</h3>
              <p className="text-muted-foreground">
                The brain. Once a design is approved, OpenHands writes actual code to the 
                filesystem, enabling self-mutation of the tool itself.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Self-Healing</h3>
              <p className="text-muted-foreground">
                The immune system. Monitors UI integrity, detects and autonomously corrects 
                CSS conflicts and layout issues.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
