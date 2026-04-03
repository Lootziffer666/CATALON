"use client";

import { useState } from "react";
import Link from "next/link";
import { A2UIComposer } from "@/components/catalon/A2UIComposer";
import { OpenHandsExecutor } from "@/components/catalon/OpenHandsExecutor";
import { SelfHealing } from "@/components/catalon/SelfHealing";
import { composePromptToA2UI, type A2UIDocument } from "@/lib/a2ui-ssot";

export default function AtelierPage() {
  const [approvedDoc, setApprovedDoc] = useState<A2UIDocument | null>(
    composePromptToA2UI("Simple card with action button")
  );

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CATALON Atelier</h1>
          <p className="text-sm text-muted-foreground">
            SSOT-first pipeline: Composer -&gt; Preview -&gt; Executor -&gt; Self-Healing.
          </p>
        </div>
        <Link href="/" className="text-sm underline">
          Back to Home
        </Link>
      </header>

      <div className="grid gap-6">
        <A2UIComposer onDocumentComposed={setApprovedDoc} />
        <OpenHandsExecutor document={approvedDoc} className="rounded-lg border p-4" />
        <SelfHealing
          document={approvedDoc}
          onDocumentChange={setApprovedDoc}
          className="rounded-lg border p-4"
        />
      </div>
    </main>
  );
}
