import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { practiceQuestions, questionAttempts } from "../db/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");

interface NormalizedQuestion {
  passage: string;
  question: string;
  options: string[];
  correctAnswer: string;
  sectionType: "logical_reasoning" | "reading_comprehension" | "analytical_reasoning";
  source: string;
  prepTestNumber: string | null;
}

function estimateDifficulty(
  q: NormalizedQuestion,
  index: number,
  total: number
): "easy" | "medium" | "hard" {
  const optionCount = q.options.filter((o) => o.length > 0).length;
  const passageLength = q.passage.length;

  if (q.sectionType === "analytical_reasoning") return "hard";
  if (passageLength > 1500 || optionCount >= 5) return "hard";
  if (passageLength > 500 || optionCount >= 4) return "medium";
  return "easy";
}

function buildTags(q: NormalizedQuestion): string[] {
  const tags: string[] = [q.sectionType.replace(/_/g, "-")];

  if (q.prepTestNumber) tags.push(`pt-${q.prepTestNumber}`);
  tags.push(q.source.replace(/_/g, "-"));

  const lower = (q.passage + q.question).toLowerCase();
  if (lower.includes("assumption")) tags.push("assumptions");
  if (lower.includes("strengthen") || lower.includes("weaken")) tags.push("strengthen-weaken");
  if (lower.includes("flaw") || lower.includes("fallac")) tags.push("flaws");
  if (lower.includes("inference") || lower.includes("must be true")) tags.push("inference");
  if (lower.includes("main point") || lower.includes("primary purpose")) tags.push("main-point");
  if (lower.includes("parallel")) tags.push("parallel-reasoning");

  return tags;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const questionsPath = join(DATA_DIR, "lsat-questions.json");
  if (!existsSync(questionsPath)) {
    throw new Error(
      `${questionsPath} not found. Run 'npx tsx scripts/download-lsat-datasets.ts' first.`
    );
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("LSAT Questions Seeder");
  console.log("=".repeat(50));

  const rawQuestions: NormalizedQuestion[] = JSON.parse(
    readFileSync(questionsPath, "utf-8")
  );

  console.log(`Loaded ${rawQuestions.length} questions from lsat-questions.json`);

  // Filter out questions with empty/invalid data
  const validQuestions = rawQuestions.filter(
    (q) =>
      q.question.length > 10 &&
      q.options.filter((o) => o.length > 0).length >= 2
  );

  console.log(`Valid questions after filtering: ${validQuestions.length}`);

  console.log("\nClearing existing practice data...");
  await db.delete(questionAttempts);
  await db.delete(practiceQuestions);

  console.log("Inserting questions...");
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < validQuestions.length; i += BATCH_SIZE) {
    const batch = validQuestions.slice(i, i + BATCH_SIZE);
    const values = batch.map((q, idx) => ({
      sectionType: q.sectionType,
      passage: q.passage,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: estimateDifficulty(q, i + idx, validQuestions.length),
      tags: buildTags(q),
      source: q.source,
      prepTestNumber: q.prepTestNumber,
    }));

    await db.insert(practiceQuestions).values(values);
    inserted += values.length;

    if (inserted % 200 === 0 || i + BATCH_SIZE >= validQuestions.length) {
      console.log(`  Inserted ${inserted}/${validQuestions.length}...`);
    }
  }

  const bySection = {
    lr: validQuestions.filter((q) => q.sectionType === "logical_reasoning").length,
    rc: validQuestions.filter((q) => q.sectionType === "reading_comprehension").length,
    ar: validQuestions.filter((q) => q.sectionType === "analytical_reasoning").length,
  };

  console.log("\n" + "=".repeat(50));
  console.log("Seed Summary:");
  console.log(`  Total inserted: ${inserted}`);
  console.log(`  Logical Reasoning: ${bySection.lr}`);
  console.log(`  Reading Comprehension: ${bySection.rc}`);
  console.log(`  Analytical Reasoning: ${bySection.ar}`);
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
