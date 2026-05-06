import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { useFumadocsLoader, type SerializedPageTree } from "fumadocs-core/source/client";
import browserCollections from "collections/browser";
import { Suspense } from "react";
import { useMDXComponents } from "@/components/mdx";
import { baseOptions } from "@/lib/docs-layout";
import { source } from "@/lib/source";

export interface DocsRouteData {
  path: string;
  pageTree: SerializedPageTree;
}

export function normalizeDocsSlugs(splat: string | undefined) {
  return splat?.split("/").filter(Boolean) ?? [];
}

export async function loadDocsRoute(slugs: string[]): Promise<DocsRouteData> {
  const data = await serverLoader({ data: slugs });

  await clientLoader.preload(data.path);

  return data;
}

const serverLoader = createServerFn({
  method: "GET",
})
  .inputValidator((slugs: string[]) => slugs)
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }, _props: undefined) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

export function DocsRouteContent({ data }: { data: DocsRouteData }) {
  const { pageTree, path } = useFumadocsLoader(data);

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense>{clientLoader.useContent(path)}</Suspense>
    </DocsLayout>
  );
}
