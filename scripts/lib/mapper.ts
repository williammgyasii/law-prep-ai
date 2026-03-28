import type {
  ScrapedArticle,
  ScrapedCourse,
  ScrapedWebinar,
  ScrapedPodcast,
} from "./types.js";

export interface ModuleInsert {
  title: string;
  description: string;
  order: number;
  color: string;
  icon: string;
  source: string;
  sourceUrl: string | null;
  imageUrl: string | null;
}

export interface ResourceInsert {
  title: string;
  description: string;
  url: string;
  type:
    | "video"
    | "lesson"
    | "drill"
    | "practice_test"
    | "article"
    | "webinar"
    | "podcast"
    | "course_module";
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
  moduleKey: string;
  tags: string[];
  order: number;
  source: string;
  imageUrl: string | null;
  content: string | null;
  duration: string | null;
}

// Static modules for articles, webinars, and podcasts
const ARTICLE_MODULE_DEFINITIONS: Record<
  string,
  { title: string; description: string; color: string; icon: string; sourceUrl: string | null }
> = {
  "Career in Law": {
    title: "Career in Law",
    description:
      "Explore career paths, mentorship, and professional development in the legal field.",
    color: "#06b6d4",
    icon: "Briefcase",
    sourceUrl: "https://app.lawhub.org/articles/career-in-law",
  },
  "The LSAT": {
    title: "The LSAT",
    description:
      "Everything about the LSAT: format, scoring, sections, argumentative writing, and prep strategies.",
    color: "#4f46e5",
    icon: "GraduationCap",
    sourceUrl: "https://app.lawhub.org/articles/the-lsat",
  },
  "Finding & Applying to Law School": {
    title: "Finding & Applying to Law School",
    description:
      "Application assembly, choosing a law school, transcripts, personal statements, and recommendations.",
    color: "#f59e0b",
    icon: "Search",
    sourceUrl:
      "https://app.lawhub.org/articles/finding-and-applying-to-law-school",
  },
  "Costs & Finances": {
    title: "Costs & Finances",
    description:
      "Law school cost of attendance, financing options, and budgeting for your legal education.",
    color: "#10b981",
    icon: "DollarSign",
    sourceUrl: "https://app.lawhub.org/articles/costs-and-finances",
  },
  "The Law School Experience": {
    title: "The Law School Experience",
    description:
      "What law school is actually like: essential skills, transitioning, and the 1L experience.",
    color: "#8b5cf6",
    icon: "BookOpen",
    sourceUrl: "https://app.lawhub.org/articles/the-law-school-experience",
  },
  Webinars: {
    title: "Webinars",
    description:
      "On-demand and upcoming webinars on LSAT prep, law school applications, finances, and career guidance.",
    color: "#ec4899",
    icon: "Video",
    sourceUrl: "https://app.lawhub.org/learningLibrary/webinars/past",
  },
  "I Am The Law Podcast": {
    title: "I Am The Law Podcast",
    description:
      "Real lawyers share their career stories, from criminal defense to environmental litigation to ski injury law.",
    color: "#f97316",
    icon: "Mic",
    sourceUrl: "https://app.lawhub.org/podcasts/IAmTheLaw",
  },
};

// Color palette for dynamically created course modules
const COURSE_COLORS = [
  "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#e11d48",
];

// Icon choices for course modules based on keywords in title
function pickCourseIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("lsat") || t.includes("strategy")) return "Target";
  if (t.includes("irac") || t.includes("legal analysis") || t.includes("legal reasoning")) return "Scale";
  if (t.includes("career") || t.includes("job") || t.includes("networking")) return "Briefcase";
  if (t.includes("study") || t.includes("learner") || t.includes("learning") || t.includes("memory")) return "Brain";
  if (t.includes("outline") || t.includes("notetaking") || t.includes("note")) return "FileText";
  if (t.includes("pay") || t.includes("cost") || t.includes("finance")) return "DollarSign";
  if (t.includes("apply") || t.includes("admission") || t.includes("personal statement")) return "ClipboardList";
  if (t.includes("pick") || t.includes("finding") || t.includes("school")) return "GraduationCap";
  if (t.includes("judicial") || t.includes("legal system") || t.includes("jurisdiction")) return "Landmark";
  if (t.includes("case") || t.includes("opinion") || t.includes("briefing")) return "BookOpen";
  if (t.includes("graded") || t.includes("assessment") || t.includes("feedback")) return "ClipboardCheck";
  if (t.includes("disability")) return "Heart";
  if (t.includes("justice") || t.includes("unmasked")) return "Shield";
  if (t.includes("community")) return "Users";
  if (t.includes("voices") || t.includes("storytelling")) return "MessageCircle";
  return "Play";
}

/**
 * Build static modules (articles, webinars, podcasts).
 * Course modules are built dynamically from scraped data.
 */
export function buildStaticModules(): { key: string; data: ModuleInsert }[] {
  return Object.entries(ARTICLE_MODULE_DEFINITIONS).map(([key, def], index) => ({
    key,
    data: {
      title: def.title,
      description: def.description,
      order: index + 1,
      color: def.color,
      icon: def.icon,
      source: "lawhub",
      sourceUrl: def.sourceUrl,
      imageUrl: null,
    },
  }));
}

/**
 * Build one module per course, with each syllabus lesson as a resource.
 */
export function buildCourseModules(
  courses: ScrapedCourse[],
  startOrder: number
): { key: string; data: ModuleInsert }[] {
  return courses.map((course, index) => {
    const key = `course:${course.title}`;
    return {
      key,
      data: {
        title: course.title,
        description: course.description.slice(0, 500),
        order: startOrder + index,
        color: COURSE_COLORS[index % COURSE_COLORS.length],
        icon: pickCourseIcon(course.title),
        source: "lawhub_course",
        sourceUrl: course.url,
        imageUrl: fixImageUrl(course.imageUrl),
      },
    };
  });
}

// Keep the old function name for backwards compat in case anything imports it
export function buildModules(): { key: string; data: ModuleInsert }[] {
  return buildStaticModules();
}

function estimateReadingMinutes(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(5, Math.ceil(words / 200));
}

function fixImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `https://app.lawhub.org${url}`;
  return url;
}

function isBoilerplateDescription(desc: string): boolean {
  return (
    !desc ||
    desc.includes("All content ©") ||
    desc.includes("Law School Admission Council") ||
    desc.trim().length < 10
  );
}

function estimateLessonDifficulty(
  lessonIndex: number,
  totalLessons: number
): "easy" | "medium" | "hard" {
  const position = lessonIndex / totalLessons;
  if (position < 0.3) return "easy";
  if (position < 0.7) return "medium";
  return "hard";
}

export function mapArticles(articles: ScrapedArticle[]): ResourceInsert[] {
  const filtered = articles.filter(
    (a) => a.title !== "Explore" && a.url !== "https://app.lawhub.org/article/explore"
  );
  return filtered.map((article, index) => ({
    title: article.title,
    description: article.description.slice(0, 500),
    url: article.url,
    type: "article" as const,
    difficulty: "medium" as const,
    estimatedMinutes: article.content
      ? estimateReadingMinutes(article.content)
      : 15,
    moduleKey: article.category,
    tags: [
      article.category.toLowerCase().replace(/\s+/g, "-"),
      article.subcategory?.toLowerCase().replace(/\s+/g, "-"),
      "lawhub",
    ].filter(Boolean) as string[],
    order: index + 1,
    source: "lawhub_article",
    imageUrl: fixImageUrl(article.imageUrl),
    content: article.content || null,
    duration: null,
  }));
}

/**
 * Map content type from scraper to resource type.
 */
function contentTypeToResourceType(
  contentType: string
): ResourceInsert["type"] {
  switch (contentType) {
    case "multimedia":
      return "video";
    case "text":
      return "article";
    case "quiz":
    case "survey":
      return "drill";
    default:
      return "lesson";
  }
}

/**
 * Each course's syllabus lessons become individual resources,
 * keyed to their course's module via `course:<title>`.
 */
export function mapCourses(courses: ScrapedCourse[]): ResourceInsert[] {
  const allResources: ResourceInsert[] = [];

  for (const course of courses) {
    const moduleKey = `course:${course.title}`;
    const courseSlug = course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    for (let i = 0; i < course.syllabus.length; i++) {
      const lesson = course.syllabus[i];
      const lessonUrl =
        lesson.lessonUrl ||
        `${course.url}#module-${lesson.moduleNumber}`;

      const desc = lesson.description || `Lesson ${lesson.moduleNumber} of ${course.title}`;
      const resourceType = contentTypeToResourceType(lesson.contentType || "unknown");

      // Estimate time based on content type
      let estimatedMinutes = 20;
      if (resourceType === "video") estimatedMinutes = 15;
      else if (resourceType === "article") estimatedMinutes = 10;
      else if (resourceType === "drill") estimatedMinutes = 10;

      const tags = ["course", "lawhub", courseSlug];
      if (lesson.contentType && lesson.contentType !== "unknown") {
        tags.push(lesson.contentType);
      }

      allResources.push({
        title: lesson.title,
        description: desc.slice(0, 500),
        url: lessonUrl,
        type: resourceType,
        difficulty: estimateLessonDifficulty(i, course.syllabus.length),
        estimatedMinutes,
        moduleKey,
        tags,
        order: i + 1,
        source: "lawhub_course",
        imageUrl: fixImageUrl(course.imageUrl),
        content: lesson.description || null,
        duration: null,
      });
    }
  }

  return allResources;
}

export function mapWebinars(webinars: ScrapedWebinar[]): ResourceInsert[] {
  return webinars.map((webinar, index) => ({
    title: webinar.title,
    description: webinar.description.slice(0, 500),
    url: webinar.url,
    type: "webinar" as const,
    difficulty: "easy" as const,
    estimatedMinutes: 60,
    moduleKey: "Webinars",
    tags: [
      "webinar",
      "lawhub",
      webinar.type === "upcoming" ? "upcoming" : "on-demand",
    ],
    order: index + 1,
    source: "lawhub_webinar",
    imageUrl: fixImageUrl(webinar.imageUrl),
    content: null,
    duration: null,
  }));
}

export function mapPodcasts(podcasts: ScrapedPodcast[]): ResourceInsert[] {
  return podcasts.map((podcast, index) => ({
    title: podcast.title,
    description: podcast.description.slice(0, 500),
    url: "https://app.lawhub.org/podcasts/IAmTheLaw",
    type: "podcast" as const,
    difficulty: "easy" as const,
    estimatedMinutes: podcast.duration
      ? parseInt(podcast.duration.match(/(\d+)m/)?.[1] || "30")
      : 30,
    moduleKey: "I Am The Law Podcast",
    tags: ["podcast", "lawhub", "career", "i-am-the-law"],
    order: index + 1,
    source: "lawhub_podcast",
    imageUrl: null,
    content: null,
    duration: podcast.duration,
  }));
}
