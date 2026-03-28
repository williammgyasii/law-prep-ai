import { fetchPage, resolveUrl } from "../lib/fetcher.js";

export interface LSATPrepItem {
  title: string;
  url: string;
  category: "full_test" | "drill_set" | "lesson" | "additional_practice";
  sectionType: "logical_reasoning" | "reading_comprehension" | "analytical_reasoning" | "mixed" | "argumentative_writing" | null;
  prepTestNumber: string | null;
}

function parsePrepTestNumber(title: string): string | null {
  const match = title.match(/PrepTest\s+(\d+)/i);
  return match ? match[1] : null;
}

function detectSectionType(title: string): LSATPrepItem["sectionType"] {
  const lower = title.toLowerCase();
  if (lower.includes("logical reasoning")) return "logical_reasoning";
  if (lower.includes("reading comprehension")) return "reading_comprehension";
  if (lower.includes("analytical reasoning")) return "analytical_reasoning";
  if (lower.includes("argumentative writing")) return "argumentative_writing";
  if (lower.includes("preptest")) return "mixed";
  return null;
}

async function scrapeLibraryPage(
  path: string,
  category: LSATPrepItem["category"]
): Promise<LSATPrepItem[]> {
  const $ = await fetchPage(path);
  const items: LSATPrepItem[] = [];
  const seenTitles = new Set<string>();

  $("h2").each((_, el) => {
    const title = $(el).text().trim();
    if (!title || seenTitles.has(title)) return;
    if (title === "LSAT Prep" || title.includes("Loading")) return;
    seenTitles.add(title);

    const link = $(el).closest("a").attr("href") || $(el).parent().find("a").first().attr("href");

    items.push({
      title,
      url: link ? resolveUrl(link) : `https://app.lawhub.org/library`,
      category,
      sectionType: detectSectionType(title),
      prepTestNumber: parsePrepTestNumber(title),
    });
  });

  // Fallback: also check list items
  if (items.length === 0) {
    $("li").each((_, el) => {
      const h2 = $(el).find("h2");
      if (!h2.length) return;
      const title = h2.text().trim();
      if (!title || seenTitles.has(title)) return;
      if (title === "LSAT Prep" || title.includes("Loading")) return;
      seenTitles.add(title);

      const link = $(el).find("a").first().attr("href");

      items.push({
        title,
        url: link ? resolveUrl(link) : `https://app.lawhub.org/library`,
        category,
        sectionType: detectSectionType(title),
        prepTestNumber: parsePrepTestNumber(title),
      });
    });
  }

  return items;
}

export async function scrapeLSATPrep(): Promise<LSATPrepItem[]> {
  console.log("\n=== Scraping LSAT Prep Library ===");

  const fullTests = await scrapeLibraryPage("/library/fulltests", "full_test");
  console.log(`  Full Tests: ${fullTests.length}`);

  const drillSets = await scrapeLibraryPage("/library/drillsets", "drill_set");
  console.log(`  Drill Sets: ${drillSets.length}`);

  const lessons = await scrapeLibraryPage("/library/lessons", "lesson");
  console.log(`  Lessons: ${lessons.length}`);

  const additional = await scrapeLibraryPage("/library/additionalpractice", "additional_practice");
  console.log(`  Additional Practice: ${additional.length}`);

  const all = [...fullTests, ...drillSets, ...lessons, ...additional];
  console.log(`Total LSAT Prep items: ${all.length}`);
  return all;
}
