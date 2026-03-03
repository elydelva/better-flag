import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { getGithubLastEdit } from "fumadocs-core/content/github";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

const GITHUB_OWNER = "elydelva";
const GITHUB_REPO = "better-flags";
const DOCS_PATH_PREFIX = "apps/documentation/content/docs";

async function getLastEdit(filePath: string): Promise<Date | null> {
  if (process.env.NODE_ENV === "development" && !process.env.GIT_TOKEN) {
    return null;
  }
  try {
    return await getGithubLastEdit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: `${DOCS_PATH_PREFIX}/${filePath}`,
      token: process.env.GIT_TOKEN ? `Bearer ${process.env.GIT_TOKEN}` : undefined,
    });
  } catch {
    return null;
  }
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const filePath = page.slugs.length === 0 ? "index.mdx" : `${page.slugs.join("/")}.mdx`;
  const lastEdit = await getLastEdit(filePath);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} lastUpdate={lastEdit ?? undefined}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
