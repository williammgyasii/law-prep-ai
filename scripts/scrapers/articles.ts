import { fetchPage, resolveUrl } from "../lib/fetcher.js";
import type { ScrapedArticle } from "../lib/types.js";

interface CategoryInfo {
  name: string;
  subcategories: { name: string; url: string; count: number }[];
  featuredArticles: { title: string; url: string }[];
  recommendedArticles: { title: string; url: string }[];
}

const EXPLORE_CATEGORIES = [
  { name: "Career in Law", slug: "career-in-law" },
  { name: "The LSAT", slug: "the-lsat" },
  {
    name: "Finding & Applying to Law School",
    slug: "finding-and-applying-to-law-school",
  },
  { name: "Costs & Finances", slug: "costs-and-finances" },
  { name: "The Law School Experience", slug: "the-law-school-experience" },
];

async function scrapeArticleList(
  categorySlug: string
): Promise<{ title: string; url: string }[]> {
  const $ = await fetchPage(`/articles/${categorySlug}`);
  const articles: { title: string; url: string }[] = [];

  $("a[href^='/article/']").each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).find("h2").text().trim() || $(el).text().trim();
    if (href && title && !articles.some((a) => a.url === href)) {
      articles.push({ title, url: href });
    }
  });

  return articles;
}

async function scrapeSubcategoryArticles(
  subcategoryUrl: string
): Promise<{ title: string; url: string }[]> {
  const $ = await fetchPage(subcategoryUrl);
  const articles: { title: string; url: string }[] = [];

  $("a[href^='/article/']").each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).find("h2").text().trim() || $(el).text().trim();
    if (href && title && !articles.some((a) => a.url === href)) {
      articles.push({ title, url: href });
    }
  });

  return articles;
}

async function scrapeArticleContent(
  articlePath: string
): Promise<{ content: string; imageUrl: string | null; description: string }> {
  const $ = await fetchPage(articlePath);

  const imageUrl =
    $("article img, main img, .article-content img")
      .first()
      .attr("src") ||
    $('img[src*="ctfassets"], img[src*="lawhub"]').first().attr("src") ||
    null;

  const contentParts: string[] = [];
  const mainContent = $("main").length ? $("main") : $("body");

  mainContent.find("h1, h2, h3, p, li, blockquote").each((_, el) => {
    const tag = $(el).prop("tagName")?.toLowerCase();
    const text = $(el).text().trim();
    if (!text) return;
    if (text === "Loading..." || text.includes("Sign-in")) return;
    if (text.includes("LawHub home") || text.includes("Welcome to LawHub"))
      return;

    if (tag === "h1") contentParts.push(`# ${text}`);
    else if (tag === "h2") contentParts.push(`\n## ${text}`);
    else if (tag === "h3") contentParts.push(`\n### ${text}`);
    else if (tag === "li") contentParts.push(`- ${text}`);
    else if (tag === "blockquote") contentParts.push(`> ${text}`);
    else contentParts.push(text);
  });

  const content = contentParts
    .filter((p) => p.length > 0)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const description =
    $('meta[name="description"]').attr("content") ||
    contentParts.find((p) => !p.startsWith("#") && p.length > 30) ||
    "";

  return { content, imageUrl, description };
}

export async function scrapeArticles(): Promise<ScrapedArticle[]> {
  console.log("\n=== Scraping Articles ===");
  const allArticles: ScrapedArticle[] = [];
  const seenUrls = new Set<string>();

  for (const category of EXPLORE_CATEGORIES) {
    console.log(`\nCategory: ${category.name}`);

    const $ = await fetchPage(`/articles/${category.slug}`);
    const subcategoryLinks: { name: string; url: string }[] = [];

    $(`a[href*="/articles/${category.slug}/"]`).each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && text) {
        const name = text.replace(/\(\d+\)/, "").trim();
        if (!subcategoryLinks.some((s) => s.url === href)) {
          subcategoryLinks.push({ name, url: href });
        }
      }
    });

    const directArticles = await scrapeArticleList(category.slug);

    for (const sub of subcategoryLinks) {
      console.log(`  Subcategory: ${sub.name}`);
      const subArticles = await scrapeSubcategoryArticles(sub.url);
      for (const article of subArticles) {
        if (!seenUrls.has(article.url)) {
          directArticles.push(article);
        }
      }
    }

    for (const article of directArticles) {
      if (seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);

      console.log(`  Article: ${article.title}`);
      try {
        const { content, imageUrl, description } =
          await scrapeArticleContent(article.url);

        allArticles.push({
          title: article.title,
          description,
          url: resolveUrl(article.url),
          imageUrl,
          category: category.name,
          subcategory: null,
          content,
        });
      } catch (err) {
        console.warn(
          `  Failed to scrape article ${article.url}: ${err instanceof Error ? err.message : err}`
        );
      }
    }
  }

  console.log(`\nTotal articles scraped: ${allArticles.length}`);
  return allArticles;
}
