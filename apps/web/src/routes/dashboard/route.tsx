import { usePresenceCount } from "@simple-presence/react";
import { createFileRoute, Link, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  usePresenceCount("dashboard", {
    appKey: import.meta.env.VITE_DEMO_APP_KEY as string,
    apiUrl: import.meta.env.VITE_SERVER_URL,
  });

  const navigate = useNavigate();
  const session = authClient.useSession();
  const user = session.data?.user;

  useEffect(() => {
    if (session.isPending) return;
    if (!session.data?.user) {
      void navigate({ to: "/sign-in" });
    }
  }, [session, navigate]);

  const matches = useMatches();
  const appMatch = matches.find((m) => m.routeId === "/dashboard/$appId") as
    | { params: { appId: string } }
    | undefined;

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-white/[0.06] border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-heading text-base tracking-widest text-white uppercase">
              Simple Presence
            </Link>

            <Separator orientation="vertical" className="!h-4 !bg-white/10" />

            <nav className="flex items-center gap-1.5 text-sm">
              <Link to="/dashboard" className="text-white/40 transition-colors hover:text-white/70">
                Dashboard
              </Link>
              {appMatch && (
                <>
                  <span className="text-white/20">/</span>
                  <span className="font-mono text-xs text-white/60">
                    {appMatch.params.appId.slice(0, 8)}
                  </span>
                </>
              )}
            </nav>
          </div>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2.5 rounded-full p-1 pr-3 transition-colors hover:bg-white/[0.04]">
                <Avatar className="size-7">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-primary/20 text-xs text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs text-white/60 sm:block">{user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          void navigate({ to: "/" }).then(() => queryClient.clear());
                        },
                      },
                    });
                  }}
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
