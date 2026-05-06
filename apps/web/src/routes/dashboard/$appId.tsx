import { FREE_PLAN_LIMITS } from "@simple-presence/config";
import type { WatchAppPayload } from "@simple-presence/contracts";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, Eye, EyeOff, Hash, Radio, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { oprc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/$appId")({
  component: RouteComponent,
});

function MetricTile({
  label,
  value,
  limit,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: number | string;
  limit?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${accentClass}`}
        >
          <Icon className="size-3.5" />
        </div>
        <p className="text-xs tracking-widest text-white/40 uppercase">{label}</p>
      </div>
      <p className="mt-3 font-heading text-2xl tracking-tight text-white">
        {value}
        {limit != null && <span className="ml-1 text-sm text-white/20">/ {limit}</span>}
      </p>
    </div>
  );
}

function StatusDot({ status }: { status: string | null }) {
  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-400">
        <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
        online
      </span>
    );
  }
  if (status === "away") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-400">
        <span className="inline-block size-1.5 rounded-full bg-amber-400" />
        away
      </span>
    );
  }
  return <span className="text-white/30">{status ?? "—"}</span>;
}

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    connect: "border-emerald-500/30 text-emerald-400",
    disconnect: "border-red-500/30 text-red-400",
    status_change: "border-sky-500/30 text-sky-400",
  };

  return (
    <Badge variant="outline" className={styles[type] ?? "border-white/10 text-white/50"}>
      {type.replace("_", " ")}
    </Badge>
  );
}

function RouteComponent() {
  const { appId } = Route.useParams();
  const [data, setData] = useState<WatchAppPayload>();

  useEffect(() => {
    let cancelled = false;
    void oprc.apps.watch({ id: appId }).then(async (iterator) => {
      for await (const payload of iterator) {
        if (cancelled) break;
        setData(payload);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appId]);

  const totalConnections = (data?.tags ?? []).reduce((sum, t) => sum + t.sessions, 0);
  const totalOnline = (data?.tags ?? []).reduce((sum, t) => sum + t.online, 0);
  const totalAway = (data?.tags ?? []).reduce((sum, t) => sum + t.away, 0);
  const totalTags = data?.tags.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/dashboard" />}
          nativeButton={false}
          className="gap-1.5 text-white/40 hover:text-white/70"
        >
          <ArrowLeft className="size-3.5" />
          All apps
        </Button>

        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Live stream
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/[0.06] bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-5">
        <MetricTile
          label="Connections"
          value={totalConnections}
          limit={FREE_PLAN_LIMITS.maxConcurrentConnectionsPerApp}
          icon={Users}
          accentClass="bg-primary/15 text-primary"
        />
        <MetricTile
          label="Online"
          value={totalOnline}
          icon={Eye}
          accentClass="bg-emerald-500/15 text-emerald-400"
        />
        <MetricTile
          label="Away"
          value={totalAway}
          icon={EyeOff}
          accentClass="bg-amber-500/15 text-amber-400"
        />
        <MetricTile
          label="Tags"
          value={totalTags}
          limit={FREE_PLAN_LIMITS.maxTagsPerApp}
          icon={Hash}
          accentClass="bg-sky-500/15 text-sky-400"
        />
        <MetricTile
          label="Plan"
          value="Free"
          icon={Zap}
          accentClass="bg-violet-500/15 text-violet-400"
        />
      </div>

      {/* Tags Table */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <Radio className="size-4 text-white/30" />
          <h2 className="font-heading text-lg tracking-tight text-white">Tags</h2>
          {totalTags > 0 && <span className="text-xs text-white/30">({totalTags})</span>}
        </div>

        <div className="overflow-hidden border border-white/[0.06]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-xs tracking-widest text-white/40 uppercase">
                  Tag
                </TableHead>
                <TableHead className="text-right text-xs tracking-widest text-white/40 uppercase">
                  Sessions
                </TableHead>
                <TableHead className="text-right text-xs tracking-widest text-white/40 uppercase">
                  Online
                </TableHead>
                <TableHead className="text-right text-xs tracking-widest text-white/40 uppercase">
                  Away
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.tags.length ? (
                data.tags.map((tag) => (
                  <TableRow
                    key={tag.name}
                    className="border-white/[0.06] transition-colors hover:bg-white/[0.02]"
                  >
                    <TableCell className="font-mono text-sm text-white/80">{tag.name}</TableCell>
                    <TableCell className="text-right font-heading text-sm text-white">
                      {tag.sessions}
                    </TableCell>
                    <TableCell className="text-right font-heading text-sm text-emerald-400">
                      {tag.online}
                    </TableCell>
                    <TableCell className="text-right font-heading text-sm text-amber-400">
                      {tag.away}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-white/[0.06]">
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-white/20">
                    No active tags
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Events Table */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <Activity className="size-4 text-white/30" />
          <h2 className="font-heading text-lg tracking-tight text-white">Events</h2>
          {(data?.events.length ?? 0) > 0 && (
            <span className="text-xs text-white/30">({data?.events.length})</span>
          )}
        </div>

        <div className="overflow-hidden border border-white/[0.06]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-xs tracking-widest text-white/40 uppercase">
                  ID
                </TableHead>
                <TableHead className="text-xs tracking-widest text-white/40 uppercase">
                  Type
                </TableHead>
                <TableHead className="text-xs tracking-widest text-white/40 uppercase">
                  Tag
                </TableHead>
                <TableHead className="text-xs tracking-widest text-white/40 uppercase">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs tracking-widest text-white/40 uppercase">
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.events.length ? (
                data.events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="border-white/[0.06] transition-colors hover:bg-white/[0.02]"
                  >
                    <TableCell className="font-mono text-xs text-white/30">{event.id}</TableCell>
                    <TableCell>
                      <EventTypeBadge type={event.type} />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-white/60">
                      {event.tag ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <StatusDot status={event.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-white/30">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-white/[0.06]">
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-white/20">
                    Waiting for events...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
