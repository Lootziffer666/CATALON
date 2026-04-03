import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="container py-10">
      <h1 className="text-2xl font-bold">CATALON Docs</h1>
      <p className="mt-2 text-muted-foreground">
        See repository files for the current deterministic scope:
      </p>
      <ul className="mt-4 list-disc pl-6 text-sm">
        <li>
          <code>README.md</code> (project overview)
        </li>
        <li>
          <code>BUILD_STATUS.md</code> (honest build report)
        </li>
        <li>
          <code>docs/api-gateway-evaluation.md</code> (gateway/tool fit)
        </li>
      </ul>
      <Link href="/atelier" className="mt-4 inline-block underline">
        Open Atelier
      </Link>
    </main>
  );
}
