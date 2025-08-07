import { usePresenceCount } from "@simple-presence/react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HeroDemo() {
	const count = usePresenceCount("landing", {
		appKey: import.meta.env.VITE_DEMO_APP_KEY ?? "",
		apiUrl: import.meta.env.VITE_SERVER_URL,
	});

	return (
		<div className="mx-auto w-full max-w-4xl p-6">
			<Card className="gap-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950">
				<CardHeader className="text-center">
					<CardTitle className="font-bold text-2xl text-blue-600 dark:text-blue-400">
						Live Demo
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center">
					<div className="mb-4">
						<div className="font-bold text-4xl text-blue-600 dark:text-blue-400">
							<AnimatedCounter value={count} duration={800} showCommas={true} />
						</div>
						<div className="text-lg text-muted-foreground">
							users online right now
						</div>
					</div>

					<div className="flex items-center justify-center gap-2">
						<div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
						<span className="text-muted-foreground text-sm">Live data</span>
					</div>

					<div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-blue-700 text-sm dark:bg-blue-900 dark:text-blue-300">
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<title>Demo indicator</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Using real Simple Presence API
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
