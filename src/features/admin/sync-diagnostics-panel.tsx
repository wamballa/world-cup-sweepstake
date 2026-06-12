import { Activity, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SyncDiagnostics } from "./sync-diagnostics-types";

export function SyncDiagnosticsPanel({
  diagnostics,
}: {
  diagnostics: SyncDiagnostics | null;
}) {
  if (!diagnostics) {
    return null;
  }

  const healthy = diagnostics.health === "healthy";

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle
          aria-level={2}
          className="flex items-center gap-2 text-base"
          role="heading"
        >
          {healthy ? (
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
          )}
          Football data diagnostics
        </CardTitle>
        <CardDescription>
          Admin-only sync evidence. Scores use football-data.org&apos;s delayed
          free plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <DiagnosticMetric label="Health" value={diagnostics.health} />
          <DiagnosticMetric label="Schedule" value={diagnostics.schedule} />
          <DiagnosticMetric
            label="Last match check"
            value={formatDiagnosticTime(diagnostics.lastSuccessfulMatchSyncAt)}
          />
          <DiagnosticMetric
            label="Last full check"
            value={formatDiagnosticTime(diagnostics.lastSuccessfulFullSyncAt)}
          />
        </div>
        {diagnostics.latestError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-semibold text-destructive">Latest sync error</p>
            <p className="mt-1 text-muted-foreground">
              {diagnostics.latestError}
            </p>
          </div>
        ) : null}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" aria-hidden="true" />
            <p className="text-sm font-semibold">Recent runs</p>
          </div>
          {diagnostics.recentRuns.length > 0 ? (
            <div className="grid gap-2">
              {diagnostics.recentRuns.map((run) => (
                <div
                  className="grid gap-2 rounded-lg border bg-surface-muted p-3 text-sm sm:grid-cols-[1.2fr_0.7fr_0.7fr_1fr_0.7fr]"
                  key={run.id}
                >
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <Clock3 className="size-3" aria-hidden="true" />
                    {formatDiagnosticTime(run.startedAt)}
                  </span>
                  <Badge variant={run.status === "failed" ? "destructive" : "secondary"}>
                    {run.status}
                  </Badge>
                  <span className="capitalize">{run.syncMode}</span>
                  <span className="capitalize">
                    {run.trigger}, {run.apiRequestCount ?? "?"} API call
                    {run.apiRequestCount === 1 ? "" : "s"}
                  </span>
                  <span>{run.transitionCount} changes</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sync runs recorded.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DiagnosticMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface-muted p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}

function formatDiagnosticTime(value: string | null) {
  if (!value) {
    return "Awaiting";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/London",
    timeZoneName: "short",
  }).format(new Date(value));
}
