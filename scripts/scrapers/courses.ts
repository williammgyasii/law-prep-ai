import { fetchPage, resolveUrl } from "../lib/fetcher.js";
import type { ScrapedCourse, CourseSyllabusItem } from "../lib/types.js";

async function scrapeCourseList(): Promise<
  { title: string; url: string; imageUrl: string | null; description: string }[]
> {
  const $ = await fetchPage("/learningLibrary/courses");
  const courses: {
    title: string;
    url: string;
    imageUrl: string | null;
    description: string;
  }[] = [];
  const seenUrls = new Set<string>();

  $('a[href^="/programs/"]').each((_, el) => {
    const href = $(el).attr("href")!;
    if (seenUrls.has(href)) return;
    seenUrls.add(href);

    const title = $(el).find("span").first().text().trim();
    if (!title) return;

    const card = $(el).parent();
    const imageUrl =
      card.find('img[data-testid="course-card-image"]').attr("src") ||
      card.find("img").first().attr("src") ||
      null;
    const description =
      card
        .find('p[data-testid="course-card-description"]')
        .text()
        .trim() ||
      card
        .find('h3[data-testid="course-card-title"]')
        .next("p")
        .text()
        .trim() ||
      "";

    courses.push({ title, url: href, imageUrl, description });
  });

  return courses;
}

/**
 * Detect lesson content type from the lawhublearning URL path segment.
 * Examples:
 *   .../multimedia/73045874-introduction      → multimedia (video)
 *   .../texts/12345-some-reading              → text
 *   .../quizzes/12345-quiz                    → quiz
 *   .../surveys/12345-pre-survey              → survey
 */
function detectContentType(
  url: string
): CourseSyllabusItem["contentType"] {
  if (url.includes("/multimedia/")) return "multimedia";
  if (url.includes("/texts/")) return "text";
  if (url.includes("/quizzes/")) return "quiz";
  if (url.includes("/surveys/")) return "survey";
  return "unknown";
}

/**
 * Extract lesson data from the raw HTML using a chunk-based approach.
 * We find each lessonCode marker in the RSC payload, grab a chunk of
 * surrounding text, and extract fields individually from each chunk.
 * This is robust against varying escape levels in the RSC payload.
 */
function extractLessonsFromHTML(html: string): {
  lessons: CourseSyllabusItem[];
  description: string;
  imageUrl: string | null;
} {
  const lessons: CourseSyllabusItem[] = [];

  // Find all lessonCode entries — handles both \" and \\" escaping
  const lessonStarts = [...html.matchAll(/lessonCode\\?":\\?"(M\d+)\\?"/g)];

  for (const ls of lessonStarts) {
    const start = ls.index!;
    // Grab a 2KB chunk — enough for the full lesson object
    const chunk = html.substring(start, start + 2000);

    const topicMatch = chunk.match(/topic\\?":\\?"([^"]+?)\\?"/);
    // Description: match up to the next \",\" or \\" pattern (escaped quote followed by comma)
    const descMatch = chunk.match(/description\\?":\\?"(.*?)\\?",\\?"postRequisiteDescription/);
    const urlMatch = chunk.match(/lessonUrl\\?":\{\\?"url\\?":\\?"([^"]+?)\\?"/);

    const title = (topicMatch?.[1] || "").replace(/\\+$/, "");
    const rawDesc = descMatch?.[1] || "";
    const lessonUrl = (urlMatch?.[1] || "").replace(/\\+$/, "") || null;

    // Clean up escaped characters in description
    const cleanDesc = rawDesc
      .replace(/\\\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\\\"/g, '"')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "")
      .trim();

    if (title) {
      lessons.push({
        moduleNumber: ls[1].replace("M", ""),
        title,
        description: cleanDesc,
        lessonUrl,
        contentType: lessonUrl ? detectContentType(lessonUrl) : "unknown",
      });
    }
  }

  // Course description: extracted from the RSC "description" field that immediately
  // precedes "shortDescription". We require it to start with "This" to avoid matching
  // unrelated UI string dictionaries that also have a "description" key.
  let description = "";
  const fullDescMatch = html.match(
    /\\?"description\\?":\\?"(This (?:[^"\\]|\\.){20,}?)\\?",\\?"shortDescription/
  );
  if (fullDescMatch) {
    description = fullDescMatch[1]
      .replace(/\\\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\\\"/g, '"')
      .replace(/\\"/g, '"')
      .replace(/\\+$/, "")
      .trim();
  }

  // Extract image URL
  let imageUrl: string | null = null;
  const imgMatch = html.match(
    /\\?"imageUrl\\?":\{\\?"url\\?":\\?"(https:[^"\\]+)\\?"/
  );
  if (imgMatch) {
    imageUrl = imgMatch[1];
  }

  return { lessons, description, imageUrl };
}

async function scrapeCourseDetail(
  coursePath: string
): Promise<{
  syllabus: CourseSyllabusItem[];
  description: string;
  imageUrl: string | null;
}> {
  const $ = await fetchPage(coursePath);
  const html = $.html();

  const { lessons, description, imageUrl } = extractLessonsFromHTML(html);

  if (lessons.length > 0) {
    return { syllabus: lessons, description, imageUrl };
  }

  // Fallback: DOM-based extraction
  console.warn(`    No lessons found in RSC payload, falling back to DOM selectors`);
  const syllabus: CourseSyllabusItem[] = [];

  $("h3").each((_, el) => {
    const text = $(el).text().trim();
    if (!text || text === "About the course" || text === "Syllabus") return;

    const parent = $(el).parent();
    const siblingText = parent.text();
    const match = siblingText.match(/M(\d+)/);

    syllabus.push({
      moduleNumber: match ? match[1] : String(syllabus.length + 1),
      title: text,
      description: "",
      lessonUrl: null,
      contentType: "unknown",
    });
  });

  let fallbackDesc = "";
  const descEl = $('[data-testid="course-description"]');
  if (descEl.length) {
    fallbackDesc = descEl.text().trim();
  }
  if (!fallbackDesc) {
    const aboutHeading = $("h2:contains('About the course')");
    if (aboutHeading.length) {
      fallbackDesc =
        aboutHeading.next("p").text().trim() ||
        aboutHeading.parent().find("p").first().text().trim() ||
        "";
    }
  }

  return { syllabus, description: description || fallbackDesc, imageUrl };
}

export async function scrapeCourses(): Promise<ScrapedCourse[]> {
  console.log("\n=== Scraping Courses ===");
  const courseList = await scrapeCourseList();
  console.log(`Found ${courseList.length} courses on listing page`);

  const courses: ScrapedCourse[] = [];

  for (const course of courseList) {
    console.log(`  Course: ${course.title}`);
    try {
      const detail = await scrapeCourseDetail(course.url);

      courses.push({
        title: course.title,
        description: detail.description || course.description,
        url: resolveUrl(course.url),
        imageUrl: detail.imageUrl || course.imageUrl,
        syllabus: detail.syllabus,
      });

      const mediaTypes = detail.syllabus
        .map((s) => s.contentType)
        .filter((t) => t !== "unknown");
      const uniqueTypes = [...new Set(mediaTypes)];
      const urlCount = detail.syllabus.filter((s) => s.lessonUrl).length;

      console.log(
        `    -> ${detail.syllabus.length} lessons, ${urlCount} with URLs, types: [${uniqueTypes.join(", ")}]`
      );
    } catch (err) {
      console.warn(
        `  Failed to scrape course detail ${course.url}: ${err instanceof Error ? err.message : err}`
      );
      courses.push({
        title: course.title,
        description: course.description,
        url: resolveUrl(course.url),
        imageUrl: course.imageUrl,
        syllabus: [],
      });
    }
  }

  console.log(`Total courses scraped: ${courses.length}`);
  return courses;
}
