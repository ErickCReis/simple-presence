import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { authClient } from "@/lib/auth-client";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const { data: session, isPending } = authClient.useSession();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newAppName, setNewAppName] = useState("");
	const [newAppDescription, setNewAppDescription] = useState("");
	const appNameId = useId();
	const appDescriptionId = useId();

	// Query for apps
	const appsQuery = useQuery(orpc.apps.list.queryOptions());

	// Mutation for creating apps
	const createAppMutation = useMutation({
		mutationFn: async (data: { name: string; description?: string }) => {
			const result = await client.apps.create(data);
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.apps.list.queryKey() });
			setIsCreateDialogOpen(false);
			setNewAppName("");
			setNewAppDescription("");
			toast.success("App created successfully!");
		},
		onError: (error) => {
			toast.error(`Failed to create app: ${error.message}`);
		},
	});

	// Mutation for deleting apps
	const deleteAppMutation = useMutation({
		mutationFn: async (data: { id: string }) => {
			const result = await client.apps.delete(data);
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.apps.list.queryKey() });
			toast.success("App deleted successfully!");
		},
		onError: (error) => {
			toast.error(`Failed to delete app: ${error.message}`);
		},
	});

	useEffect(() => {
		if (!session && !isPending) {
			navigate({
				to: "/sign-in",
			});
		}
	}, [session, isPending, navigate]);

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
		if (
			confirm(
				"Are you sure you want to delete this app? This action cannot be undone.",
			)
		) {
			deleteAppMutation.mutate({ id: appId });
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Public key copied to clipboard!");
	};

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			{/* Header */}
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Dashboard</h1>
					<p className="text-muted-foreground">
						Welcome back, {session?.user.name}
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create App
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New App</DialogTitle>
							<DialogDescription>
								Create a new app to start tracking presence. Each app gets a
								unique public key for tracking.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor={appNameId}>App Name</Label>
								<Input
									id={appNameId}
									value={newAppName}
									onChange={(e) => setNewAppName(e.target.value)}
									placeholder="My Website"
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor={appDescriptionId}>Description (Optional)</Label>
								<Input
									id={appDescriptionId}
									value={newAppDescription}
									onChange={(e) => setNewAppDescription(e.target.value)}
									placeholder="Track presence on my main website"
									className="mt-1"
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
								disabled={createAppMutation.isPending || !newAppName.trim()}
							>
								{createAppMutation.isPending ? "Creating..." : "Create App"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Apps Grid */}
			{appsQuery.isLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader>
								<div className="h-4 w-3/4 rounded bg-muted" />
								<div className="h-3 w-1/2 rounded bg-muted" />
							</CardHeader>
							<CardContent>
								<div className="mb-2 h-3 w-full rounded bg-muted" />
								<div className="h-3 w-2/3 rounded bg-muted" />
							</CardContent>
						</Card>
					))}
				</div>
			) : appsQuery.data && appsQuery.data.length > 0 ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{appsQuery.data.map((app) => (
						<Card key={app.id} className="transition-shadow hover:shadow-md">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg">{app.name}</CardTitle>
										<CardDescription className="mt-1">
											{app.description || "No description"}
										</CardDescription>
									</div>
									<Badge variant="secondary" className="ml-2">
										Active
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<Label className="text-muted-foreground text-xs">
											Public Key
										</Label>
										<div className="mt-1 flex items-center gap-2">
											<code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
												{app.publicKey}
											</code>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => copyToClipboard(app.publicKey)}
												className="h-6 w-6 p-0"
											>
												<Copy className="h-3 w-3" />
											</Button>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											className="flex-1"
											onClick={() => copyToClipboard(app.publicKey)}
										>
											<Eye className="mr-1 h-3 w-3" />
											View Details
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDeleteApp(app.id)}
											disabled={deleteAppMutation.isPending}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card className="py-12 text-center">
					<CardContent>
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<Plus className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">No apps yet</h3>
						<p className="mb-4 text-muted-foreground">
							Create your first app to start tracking presence
						</p>
						<Button onClick={() => setIsCreateDialogOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create Your First App
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Stats Section */}
			{appsQuery.data && appsQuery.data.length > 0 && (
				<div className="mt-12">
					<h2 className="mb-6 font-semibold text-2xl">Overview</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Total Apps
										</p>
										<p className="font-bold text-2xl">
											{appsQuery.data.length}
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<Plus className="h-6 w-6 text-primary" />
									</div>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Active Sessions
										</p>
										<p className="font-bold text-2xl">0</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
										<Eye className="h-6 w-6 text-green-500" />
									</div>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-sm">
											Total Events
										</p>
										<p className="font-bold text-2xl">0</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
										<Copy className="h-6 w-6 text-blue-500" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}
