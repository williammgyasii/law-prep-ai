import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  users,
  modules,
  resources,
  progress,
  notes,
  weakAreas,
  studyPlans,
} from "../db/schema";
import {
  buildStaticModules,
  buildCourseModules,
  mapArticles,
  mapCourses,
  mapWebinars,
  mapPodcasts,
} from "./lib/mapper.js";
import type {
  ScrapedArticle,
  ScrapedCourse,
  ScrapedWebinar,
  ScrapedPodcast,
} from "./lib/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");

function loadJson<T>(filename: string): T {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) {
    console.warn(`  Warning: ${filename} not found, using empty array`);
    return [] as unknown as T;
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("LawHub Seed from Scraped Data");
  console.log("=".repeat(50));

  console.log("\nLoading scraped data...");
  const articles = loadJson<ScrapedArticle[]>("articles.json");
  const courses = loadJson<ScrapedCourse[]>("courses.json");
  const webinars = loadJson<ScrapedWebinar[]>("webinars.json");
  const podcasts = loadJson<ScrapedPodcast[]>("podcasts.json");

  console.log(`  Articles: ${articles.length}`);
  console.log(`  Courses:  ${courses.length} (will create ${courses.length} modules)`);
  console.log(`  Webinars: ${webinars.length}`);
  console.log(`  Podcasts: ${podcasts.length}`);

  const totalLessons = courses.reduce((sum, c) => sum + c.syllabus.length, 0);
  console.log(`  Total course lessons: ${totalLessons}`);

  console.log("\nCleaning existing data...");
  await db.delete(notes);
  await db.delete(progress);
  await db.delete(weakAreas);
  await db.delete(studyPlans);
  await db.delete(resources);
  await db.delete(modules);
  await db.delete(users);

  console.log("Creating default user...");
  const [user] = await db
    .insert(users)
    .values({ id: "user_default", name: "Sarah", email: "sarah@example.com" })
    .returning();

  // Build static modules (articles, webinars, podcasts)
  console.log("\nCreating static modules...");
  const staticModules = buildStaticModules();
  const moduleIdMap: Record<string, string> = {};

  for (const mod of staticModules) {
    const [inserted] = await db
      .insert(modules)
      .values(mod.data)
      .returning();
    moduleIdMap[mod.key] = inserted.id;
    console.log(`  Module: ${mod.data.title} (${inserted.id})`);
  }

  // Build one module per course
  console.log("\nCreating course modules...");
  const courseModules = buildCourseModules(courses, staticModules.length + 1);

  for (const mod of courseModules) {
    const [inserted] = await db
      .insert(modules)
      .values(mod.data)
      .returning();
    moduleIdMap[mod.key] = inserted.id;
    console.log(`  Course Module: ${mod.data.title} (${inserted.id})`);
  }

  console.log(`\n  Total modules: ${staticModules.length + courseModules.length}`);

  console.log("\nCreating resources...");
  let totalResources = 0;

  const allResources = [
    ...mapArticles(articles),
    ...mapCourses(courses),
    ...mapWebinars(webinars),
    ...mapPodcasts(podcasts),
  ];

  const BATCH_SIZE = 20;
  let skipped = 0;
  for (let i = 0; i < allResources.length; i += BATCH_SIZE) {
    const batch = allResources.slice(i, i + BATCH_SIZE);
    const values = batch
      .map((r) => {
        const moduleId = moduleIdMap[r.moduleKey];
        if (!moduleId) {
          skipped++;
          if (skipped <= 5) {
            console.warn(`  Skipping "${r.title}" - no module for key "${r.moduleKey}"`);
          }
          return null;
        }
        return {
          title: r.title,
          description: r.description,
          url: r.url,
          type: r.type,
          difficulty: r.difficulty,
          estimatedMinutes: r.estimatedMinutes,
          moduleId,
          tags: r.tags,
          order: r.order,
          source: r.source,
          imageUrl: r.imageUrl,
          content: r.content,
          duration: r.duration,
        };
      })
      .filter(Boolean) as (typeof resources.$inferInsert)[];

    if (values.length > 0) {
      await db.insert(resources).values(values);
      totalResources += values.length;
    }

    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= allResources.length) {
      console.log(
        `  Inserted ${Math.min(i + BATCH_SIZE, allResources.length)}/${allResources.length} resources...`
      );
    }
  }

  if (skipped > 5) {
    console.warn(`  ... and ${skipped - 5} more skipped`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("Seed Summary:");
  console.log(`  User:      ${user.name} (${user.email})`);
  console.log(`  Modules:   ${staticModules.length} static + ${courseModules.length} courses = ${staticModules.length + courseModules.length}`);
  console.log(`  Resources: ${totalResources} (${skipped} skipped)`);
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
