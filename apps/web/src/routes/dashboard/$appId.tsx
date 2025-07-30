import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { oprc } from "@/lib/orpc";
import type { AsyncIteratorData } from "@/lib/types";
import type { AppRouterOutputs } from "../../../../server/src/routers";

export const Route = createFileRoute("/dashboard/$appId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { appId } = Route.useParams();

	const [data, setData] =
		useState<AsyncIteratorData<AppRouterOutputs["apps"]["watch"]>>();

	useEffect(() => {
		oprc.apps.watch({ id: appId }).then(async (iterator) => {
			for await (const data of iterator) {
				setData(data);
			}
		});
	}, [appId]);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="mb-4 font-bold text-2xl">Tags</h1>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Tag Name</TableHead>
							<TableHead>Sessions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.tags.map((tag) => (
							<TableRow key={tag.name}>
								<TableCell className="font-medium">{tag.name}</TableCell>
								<TableCell>{tag.sessions}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div>
				<h1 className="mb-4 font-bold text-2xl">Events</h1>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Timestamp</TableHead>
							<TableHead>Tag</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.events.map((event) => (
							<TableRow key={event.id}>
								<TableCell className="font-mono text-sm">{event.id}</TableCell>
								<TableCell>{event.type}</TableCell>
								<TableCell>{event.timestamp.toLocaleString()}</TableCell>
								<TableCell>{event.tag}</TableCell>
								<TableCell>{event.status}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
