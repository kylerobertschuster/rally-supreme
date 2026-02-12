import Link from "next/link";
import { EnterpriseShell } from "@/components/EnterpriseShell";

const pillars = [
  {
    title: "Catalog Ingestion",
    text: "Convert legacy diagrams, CAD exports, and service manuals into searchable, structured part records with controlled identifiers.",
  },
  {
    title: "Exploded Assembly Workspace",
    text: "Interactive part selection with mesh-level mapping, replacement routing, and linked OEM/aftermarket procurement sources.",
  },
  {
    title: "Fitment and Approval",
    text: "Apply compatibility rules and approval states so dealers and aftersales teams only ship verified components.",
  },
  {
    title: "Procurement Routing",
    text: "Direct users to approved inventory sources with traceability metadata and confidence scoring for every recommendation.",
  },
];

const metrics = [
  { label: "Pilot Timeline", value: "6-10 weeks" },
  { label: "Legacy Catalog Coverage", value: "40+ years" },
  { label: "Target Misidentification Reduction", value: "35-60%" },
  { label: "System Model", value: "B2B SaaS + Services" },
];

export default function Home() {
  return (
    <EnterpriseShell
      title="3D Aftermarket Conversion Bureau for Legacy Vehicle Programs"
      subtitle="Rally Supreme Systems digitizes fragmented parts ecosystems into enterprise-grade aftersales infrastructure for OEM, dealer, and distributor operations."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card-grid rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-strong">Core Platform</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {pillars.map((item) => (
              <article key={item.title} className="rounded-lg border border-border/80 bg-surface-muted p-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.13em] text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground/75">{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-accent-strong">Operational Impact</div>
            <div className="mt-4 space-y-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-md border border-border/80 bg-surface-muted p-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-foreground/60">{m.label}</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-accent-strong">Next Step</div>
            <p className="mt-3 text-sm leading-6 text-foreground/75">
              Start with one legacy model line. We ingest, map, and operationalize your first digital assembly workflow with measurable aftersales outcomes.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/contact-sales"
                className="rounded-md border border-accent/40 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-white hover:bg-accent-strong"
              >
                Request Pilot
              </Link>
              <Link
                href="/bike/ktm-500-exc-f"
                className="rounded-md border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-foreground/80 hover:bg-surface-muted"
              >
                View Workspace
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </EnterpriseShell>
  );
}
