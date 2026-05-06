import { FREE_PLAN_LIMITS } from "@simple-presence/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Eye, KeyRound, Layers, Plus, Trash2, Wifi } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { oprc, orpcUtils } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function StatCard({
  label,
  value,
  limit,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: number;
  limit?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}) {
  return (
    <div className="group relative overflow-hidden border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest text-white/40 uppercase">{label}</p>
          <p className="mt-2 font-heading text-3xl tracking-tight text-white">
            {value}
            {limit != null && <span className="ml-1 text-base text-white/20">/ {limit}</span>}
          </p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-full ${accentClass}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");
  const appNameId = useId();
  const appDescriptionId = useId();

  const appsQuery = useQuery(orpcUtils.apps.list.queryOptions());
  const appsCount = appsQuery.data?.length ?? 0;
  const reachedAppLimit = appsCount >= FREE_PLAN_LIMITS.maxAppsPerUser;

  const createAppMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const result = await oprc.apps.create(data);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orpcUtils.apps.list.queryKey(),
      });
      setIsCreateDialogOpen(false);
      setNewAppName("");
      setNewAppDescription("");
      toast.success("App created successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to create app: ${error.message}`);
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (data: { id: string }) => {
      const result = await oprc.apps.delete(data);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orpcUtils.apps.list.queryKey(),
      });
      toast.success("App deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to delete app: ${error.message}`);
    },
  });

  const handleCreateApp = () => {
    if (!newAppName.trim()) {
      toast.error("App name is required");
      return;
    }
    createAppMutation.mutate({
      name: newAppName.trim(),
      description: newAppDescription.trim() || undefined,
    });
  };

  const handleDeleteApp = (appId: string) => {
    if (confirm("Are you sure you want to delete this app? This action cannot be undone.")) {
      deleteAppMutation.mutate({ id: appId });
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-10">
      {/* Overview Stats */}
      <section>
        <div className="grid grid-cols-1 gap-px overflow-hidden border border-white/[0.06] bg-white/[0.06] sm:grid-cols-3">
          <StatCard
            label="Applications"
            value={appsCount}
            limit={FREE_PLAN_LIMITS.maxAppsPerUser}
            icon={Layers}
            accentClass="bg-primary/15 text-primary"
          />
          <StatCard
            label="Max Connections"
            value={FREE_PLAN_LIMITS.maxConcurrentConnectionsPerApp}
            icon={Wifi}
            accentClass="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            label="Tags per App"
            value={FREE_PLAN_LIMITS.maxTagsPerApp}
            icon={KeyRound}
            accentClass="bg-sky-500/15 text-sky-400"
          />
        </div>
      </section>

      {/* Registry Header */}
      <section>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs tracking-widest text-white/40 uppercase">Registry</p>
            <h1 className="mt-1 font-heading text-2xl tracking-tight text-white">
              Your applications
            </h1>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  disabled={reachedAppLimit}
                  title={
                    reachedAppLimit
                      ? `Free plan limit reached (${FREE_PLAN_LIMITS.maxAppsPerUser} apps)`
                      : undefined
                  }
                />
              }
            >
              <Plus className="size-3.5" />
              New app
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create application</DialogTitle>
                <DialogDescription>
                  Each app gets a unique public key for presence tracking. Free plan allows{" "}
                  {FREE_PLAN_LIMITS.maxAppsPerUser} apps, {FREE_PLAN_LIMITS.maxTagsPerApp} tags, and{" "}
                  {FREE_PLAN_LIMITS.maxConcurrentConnectionsPerApp} concurrent connections per app.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor={appNameId}>Name</Label>
                  <Input
                    id={appNameId}
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="My Website"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor={appDescriptionId}>
                    Description <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id={appDescriptionId}
                    value={newAppDescription}
                    onChange={(e) => setNewAppDescription(e.target.value)}
                    placeholder="Track presence on my main website"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createAppMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateApp}
                  disabled={createAppMutation.isPending || !newAppName.trim() || reachedAppLimit}
                >
                  {createAppMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* App List */}
        <div className="mt-6">
          {appsQuery.isLoading ? (
            <div className="divide-y divide-white/[0.06] border border-white/[0.06]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-32 rounded bg-white/[0.06]" />
                    <div className="h-3 w-48 rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          ) : appsQuery.data && appsQuery.data.length > 0 ? (
            <div className="divide-y divide-white/[0.06] border border-white/[0.06]">
              {appsQuery.data.map((app) => (
                <div
                  key={app.id}
                  className="group/row flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate font-heading text-base text-white">{app.name}</h3>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-emerald-500/30 text-emerald-400"
                      >
                        <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Live
                      </Badge>
                    </div>
                    {app.description && (
                      <p className="mt-1 truncate text-sm text-white/40">{app.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <code className="truncate font-mono text-xs text-white/30">
                        {app.publicKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(app.publicKey)}
                        className="shrink-0 text-white/20 transition-colors hover:text-white/50"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover/row:opacity-100">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link to="/dashboard/$appId" params={{ appId: app.id }} />}
                      nativeButton={false}
                    >
                      <Eye className="size-3.5" />
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteApp(app.id)}
                      disabled={deleteAppMutation.isPending}
                      className="text-white/30 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-white/[0.08] py-20 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.04]">
                <Layers className="size-6 text-white/20" />
              </div>
              <p className="text-xs tracking-widest text-white/30 uppercase">No applications</p>
              <p className="mt-2 max-w-xs text-sm text-white/50">
                Create your first app to start tracking real-time presence across your sites.
              </p>
              <Button size="sm" className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="size-3.5" />
                Create first app
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
