import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { scrapeArticles } from "./scrapers/articles.js";
import { scrapeCourses } from "./scrapers/courses.js";
import { scrapeWebinars } from "./scrapers/webinars.js";
import { scrapePodcasts } from "./scrapers/podcasts.js";
import type { ScrapeResult } from "./lib/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");

async function main() {
  console.log("LawHub Content Scraper");
  console.log("=".repeat(50));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  mkdirSync(DATA_DIR, { recursive: true });

  const articles = await scrapeArticles();
  writeFileSync(
    join(DATA_DIR, "articles.json"),
    JSON.stringify(articles, null, 2)
  );
  console.log(`Wrote ${articles.length} articles to scripts/data/articles.json`);

  const courses = await scrapeCourses();
  writeFileSync(
    join(DATA_DIR, "courses.json"),
    JSON.stringify(courses, null, 2)
  );
  console.log(`Wrote ${courses.length} courses to scripts/data/courses.json`);

  const webinars = await scrapeWebinars();
  writeFileSync(
    join(DATA_DIR, "webinars.json"),
    JSON.stringify(webinars, null, 2)
  );
  console.log(`Wrote ${webinars.length} webinars to scripts/data/webinars.json`);

  const podcasts = await scrapePodcasts();
  writeFileSync(
    join(DATA_DIR, "podcasts.json"),
    JSON.stringify(podcasts, null, 2)
  );
  console.log(`Wrote ${podcasts.length} podcasts to scripts/data/podcasts.json`);

  const result: ScrapeResult = {
    articles,
    courses,
    webinars,
    podcasts,
    scrapedAt: new Date().toISOString(),
  };
  writeFileSync(
    join(DATA_DIR, "all.json"),
    JSON.stringify(result, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("Scrape Summary:");
  console.log(`  Articles:  ${articles.length}`);
  console.log(`  Courses:   ${courses.length}`);
  console.log(`  Webinars:  ${webinars.length}`);
  console.log(`  Podcasts:  ${podcasts.length}`);
  console.log(`  Total:     ${articles.length + courses.length + webinars.length + podcasts.length}`);
  console.log(`\nAll data written to scripts/data/`);
  console.log(`Finished at: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
