import { jsonLd, pageJsonLd, type PageSeo } from "@/lib/seo";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}

/** WebPage (+ breadcrumb) structured data for a page, from the same object as its metadata. */
export function PageJsonLd({ page }: { page: PageSeo }) {
  return <JsonLd data={pageJsonLd(page)} />;
}
