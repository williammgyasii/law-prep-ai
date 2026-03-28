import { fetchPage, resolveUrl } from "../lib/fetcher.js";
import type { ScrapedWebinar } from "../lib/types.js";

async function scrapeWebinarPage(
  path: string,
  type: "on_demand" | "upcoming"
): Promise<ScrapedWebinar[]> {
  const $ = await fetchPage(path);
  const webinars: ScrapedWebinar[] = [];
  const seenUrls = new Set<string>();

  $('a[href^="/webinars/"]').each((_, el) => {
    const href = $(el).attr("href")!;
    if (seenUrls.has(href)) return;
    seenUrls.add(href);

    const title = $(el).find("span").first().text().trim();
    if (!title) return;

    const card = $(el).parent();
    const imageUrl =
      card.find('img[data-testid="webinar-card-image"]').attr("src") ||
      card.find("img").first().attr("src") ||
      null;

    const description =
      card.find("p").first().text().trim() || "";

    const cardText = card.text();
    const dateMatch = cardText.match(/(\d{1,2})\s*([A-Z][a-z]{2})/);
    const date = dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : null;

    webinars.push({
      title,
      description,
      url: resolveUrl(href),
      imageUrl,
      date,
      type,
    });
  });

  return webinars;
}

export async function scrapeWebinars(): Promise<ScrapedWebinar[]> {
  console.log("\n=== Scraping Webinars ===");

  const onDemand = await scrapeWebinarPage(
    "/learningLibrary/webinars/past",
    "on_demand"
  );
  console.log(`  On-demand webinars: ${onDemand.length}`);

  const upcoming = await scrapeWebinarPage(
    "/learningLibrary/webinars/future",
    "upcoming"
  );
  console.log(`  Upcoming webinars: ${upcoming.length}`);

  const all = [...onDemand, ...upcoming];
  console.log(`Total webinars scraped: ${all.length}`);
  return all;
}
