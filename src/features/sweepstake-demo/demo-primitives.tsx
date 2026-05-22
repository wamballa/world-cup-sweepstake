import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold">{value}</p>
    </div>
  );
}

export function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success text-success-foreground"
      : tone === "warning"
        ? "bg-warning text-warning-foreground"
        : "bg-info text-info-foreground";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-surface-muted p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`rounded-md px-2 py-1 text-xs font-medium ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-surface-muted p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function InfoTile({
  icon,
  label,
  value,
  body,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border bg-surface-muted p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-xs font-medium uppercase tracking-normal">
          {label}
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "qualified" || status === "winner") {
    return <Badge>{formatStatus(status)}</Badge>;
  }

  if (status === "eliminated") {
    return <Badge variant="outline">{formatStatus(status)}</Badge>;
  }

  return <Badge variant="secondary">{formatStatus(status)}</Badge>;
}

export function formatStatus(status: string) {
  return status
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
