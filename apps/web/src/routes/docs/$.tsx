import { createFileRoute } from "@tanstack/react-router";
import { DocsRouteContent, loadDocsRoute, normalizeDocsSlugs } from "@/routes/docs/-docs-page";

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    return await loadDocsRoute(normalizeDocsSlugs(params._splat));
  },
});

function Page() {
  return <DocsRouteContent data={Route.useLoaderData()} />;
}
