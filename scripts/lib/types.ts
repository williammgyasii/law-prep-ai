export interface ScrapedArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  category: string;
  subcategory: string | null;
  content: string;
}

export interface CourseSyllabusItem {
  moduleNumber: string;
  title: string;
  description: string;
  lessonUrl: string | null;
  contentType: "multimedia" | "text" | "quiz" | "survey" | "unknown";
}

export interface ScrapedCourse {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  syllabus: CourseSyllabusItem[];
}

export interface ScrapedWebinar {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  date: string | null;
  type: "on_demand" | "upcoming";
}

export interface ScrapedPodcast {
  title: string;
  description: string;
  duration: string | null;
}

export interface ScrapeResult {
  articles: ScrapedArticle[];
  courses: ScrapedCourse[];
  webinars: ScrapedWebinar[];
  podcasts: ScrapedPodcast[];
  scrapedAt: string;
}
