import { fetchPage } from "../lib/fetcher.js";
import type { ScrapedPodcast } from "../lib/types.js";

export async function scrapePodcasts(): Promise<ScrapedPodcast[]> {
  console.log("\n=== Scraping Podcasts ===");
  const $ = await fetchPage("/podcasts/IAmTheLaw");
  const podcasts: ScrapedPodcast[] = [];
  const seenTitles = new Set<string>();

  $('h3.text-lg, h3[class*="text-lg"]').each((_, el) => {
    const title = $(el).find("span").text().trim() || $(el).text().trim();
    if (!title || title === "Episodes" || seenTitles.has(title)) return;
    seenTitles.add(title);

    const descDiv = $(el).next("div");
    const description = descDiv.find("p").text().trim() || descDiv.text().trim();

    const parent = $(el).closest("li, div");
    const parentText = parent.text();
    const durationMatch = parentText.match(
      /(\d+)\s*minutes?\s*(\d+)\s*seconds?/
    );
    let duration: string | null = null;
    if (durationMatch) {
      duration = `${durationMatch[1]}m ${durationMatch[2]}s`;
    }

    podcasts.push({ title, description, duration });
  });

  console.log(
    `Podcasts scraped from initial page: ${podcasts.length} (full catalog of 148 requires JS-based "Load more")`
  );

  return podcasts;
}
