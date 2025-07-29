import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { oprc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/$appId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { appId } = Route.useParams();

	const [tags, setTags] = useState<{ name: string; sessions: number }[]>([]);

	useEffect(() => {
		oprc.apps.watch({ id: appId }).then(async (tagsIterator) => {
			for await (const tags of tagsIterator) {
				setTags(tags);
			}
		});
	}, [appId]);

	return (
		<div>
			<div>
				{tags.map((tag) => (
					<div key={tag.name}>
						{tag.name} - {tag.sessions}
					</div>
				))}
			</div>
		</div>
	);
}
