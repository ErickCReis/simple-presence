import { createFileRoute } from "@tanstack/react-router";
import { DocsRouteContent, loadDocsRoute } from "@/routes/docs/-docs-page";

export const Route = createFileRoute("/docs/")({
  component: Page,
  loader: async () => {
    return await loadDocsRoute([]);
  },
});

function Page() {
  return <DocsRouteContent data={Route.useLoaderData()} />;
}
