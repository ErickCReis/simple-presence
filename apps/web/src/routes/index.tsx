import { createFileRoute } from "@tanstack/react-router";
import { HeroDemo } from "@/components/landing/hero-demo";
import { QuickGuide } from "@/components/landing/quick-guide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
	component: LandingPage,
	head: () => ({
		title: "Simple Presence - Real-time User Presence for Any JavaScript App",
		meta: [
			{
				name: "description",
				content:
					"Add real-time user presence to any JavaScript application with just a few lines of code. See who's online, track user activity, and boost engagement instantly.",
			},
			{
				name: "keywords",
				content:
					"real-time presence, user activity, JavaScript, TypeScript, React, Vue, Angular, online users, live tracking",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{
				name: "robots",
				content: "index, follow",
			},
			{
				name: "canonical",
				content: "https://simplepresence.com",
			},
			// Open Graph
			{
				property: "og:title",
				content:
					"Simple Presence - Real-time User Presence for Any JavaScript App",
			},
			{
				property: "og:description",
				content:
					"Add real-time user presence to any JavaScript application with just a few lines of code. See who's online, track user activity, and boost engagement instantly.",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:url",
				content: "https://simplepresence.com",
			},
			{
				property: "og:image",
				content: "https://simplepresence.com/og-image.png",
			},
			// Twitter Card
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content:
					"Simple Presence - Real-time User Presence for Any JavaScript App",
			},
			{
				name: "twitter:description",
				content:
					"Add real-time user presence to any JavaScript application with just a few lines of code.",
			},
			{
				name: "twitter:image",
				content: "https://simplepresence.com/twitter-image.png",
			},
		],
	}),
});

function LandingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
			{/* Hero Section */}
			<section className="relative flex h-svh items-center justify-center">
				<div className="text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground md:text-6xl">
						Simple Presence
					</h1>
					<p className="mx-auto mb-8 max-w-2xl text-muted-foreground text-xl md:text-2xl">
						Add real-time user presence to any JavaScript application with just
						a few lines of code
					</p>

					<HeroDemo />

					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<Button size="lg" className="text-lg">
							Start Free
						</Button>
						<Button variant="outline" size="lg" className="text-lg">
							View Documentation
						</Button>
					</div>
				</div>
			</section>

			{/* Value Proposition Section */}
			<section className="px-4 py-20">
				<div className="mx-auto max-w-6xl">
					<h2 className="mb-12 text-center font-bold text-3xl text-foreground md:text-4xl">
						Why Simple Presence?
					</h2>
					<div className="grid gap-8 md:grid-cols-3">
						<Card className="text-center">
							<CardContent className="pt-6">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<svg
										className="h-8 w-8 text-blue-600 dark:text-blue-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<title>Lightning Fast Icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
								</div>
								<h3 className="mb-2 font-semibold text-foreground text-xl">
									Lightning Fast
								</h3>
								<p className="text-muted-foreground">
									Real-time updates in milliseconds, not seconds
								</p>
							</CardContent>
						</Card>
						<Card className="text-center">
							<CardContent className="pt-6">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<svg
										className="h-8 w-8 text-green-600 dark:text-green-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<title>Simple Setup Icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<h3 className="mb-2 font-semibold text-foreground text-xl">
									Simple Setup
								</h3>
								<p className="text-muted-foreground">
									Just a few lines of code to get started
								</p>
							</CardContent>
						</Card>
						<Card className="text-center">
							<CardContent className="pt-6">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<svg
										className="h-8 w-8 text-purple-600 dark:text-purple-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<title>Framework Agnostic Icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
										/>
									</svg>
								</div>
								<h3 className="mb-2 font-semibold text-foreground text-xl">
									Framework Agnostic
								</h3>
								<p className="text-muted-foreground">
									Works with React, Vue, Angular, or vanilla JS
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Quick Guide Section */}
			<section className="px-4 py-20">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-12 text-center font-bold text-3xl text-foreground md:text-4xl">
						Get Started in Minutes
					</h2>

					<QuickGuide />
				</div>
			</section>

			{/* Pricing Section */}
			<section className="px-4 py-20">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="mb-12 font-bold text-3xl text-foreground md:text-4xl">
						Start Free, Scale Later
					</h2>
					<Card className="mx-auto max-w-md">
						<CardHeader>
							<CardTitle className="text-2xl">Free Plan</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="mb-6 font-bold text-4xl text-primary">$0</div>
							<ul className="mb-8 space-y-3 text-left">
								<li className="flex items-center">
									<svg
										className="mr-3 h-5 w-5 text-green-500"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
									2 Applications
								</li>
								<li className="flex items-center">
									<svg
										className="mr-3 h-5 w-5 text-green-500"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
									100 Users Simultaneous
								</li>
								<li className="flex items-center">
									<svg
										className="mr-3 h-5 w-5 text-green-500"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
									Real-time Updates
								</li>
								<li className="flex items-center">
									<svg
										className="mr-3 h-5 w-5 text-green-500"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
									Basic Analytics
								</li>
							</ul>
							<Button size="lg" className="w-full text-lg">
								Start Free
							</Button>
							<p className="mt-4 text-muted-foreground text-sm">
								Paid plans coming soon with advanced features
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Footer */}
			<footer className="px-4 py-12">
				<div className="mx-auto max-w-6xl text-center">
					<div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground text-sm md:flex-row md:space-x-8 md:space-y-0">
						<a href="/docs" className="transition-colors hover:text-primary">
							Documentation
						</a>
						<a href="/contact" className="transition-colors hover:text-primary">
							Contact
						</a>
						<a href="/terms" className="transition-colors hover:text-primary">
							Terms of Use
						</a>
						<a href="/privacy" className="transition-colors hover:text-primary">
							Privacy
						</a>
					</div>
					<p className="mt-4 text-muted-foreground text-sm">
						© 2025 Simple Presence. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
