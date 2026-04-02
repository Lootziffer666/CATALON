import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            AI-Driven Design System
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            CATALON combines A2UI protocol with OpenHands execution for autonomous
            UI generation. Powered by Claude 3.5 Sonnet and Ollama.
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
      </main>
    </div>
  );
}