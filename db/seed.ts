import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  users,
  modules,
  resources,
  progress,
  notes,
  weakAreas,
} from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("🧹 Cleaning existing data...");
  await db.delete(notes);
  await db.delete(progress);
  await db.delete(weakAreas);
  await db.delete(resources);
  await db.delete(modules);
  await db.delete(users);

  console.log("👤 Creating user...");
  const [user] = await db
    .insert(users)
    .values({ id: "user_default", name: "Sarah", email: "sarah@example.com" })
    .returning();

  console.log("📚 Creating modules...");
  const [foundations] = await db
    .insert(modules)
    .values({
      title: "Foundations",
      description: "Core LSAT concepts, argument structure, and formal logic basics to build a strong foundation.",
      order: 1,
      color: "#4f46e5",
      icon: "BookOpen",
    })
    .returning();

  const [logicalReasoning] = await db
    .insert(modules)
    .values({
      title: "Logical Reasoning",
      description: "Master the most heavily tested section: identify conclusions, assumptions, flaws, and strengthen/weaken patterns.",
      order: 2,
      color: "#06b6d4",
      icon: "Brain",
    })
    .returning();

  const [readingComp] = await db
    .insert(modules)
    .values({
      title: "Reading Comprehension",
      description: "Develop strategies for dense academic passages, main point identification, and inference questions.",
      order: 3,
      color: "#f59e0b",
      icon: "FileText",
    })
    .returning();

  const [logicGames] = await db
    .insert(modules)
    .values({
      title: "Logic Games / Analytical Reasoning",
      description: "Sequencing, grouping, matching, and hybrid games with diagramming techniques.",
      order: 4,
      color: "#10b981",
      icon: "Puzzle",
    })
    .returning();

  const [practiceTests] = await db
    .insert(modules)
    .values({
      title: "Full Practice Tests",
      description: "Timed full-length practice tests to build stamina and simulate test-day conditions.",
      order: 5,
      color: "#f43f5e",
      icon: "ClipboardList",
    })
    .returning();

  const [reviewModule] = await db
    .insert(modules)
    .values({
      title: "Review / Weak Areas",
      description: "Targeted review of mistakes, weak question types, and concepts that need reinforcement.",
      order: 6,
      color: "#8b5cf6",
      icon: "Target",
    })
    .returning();

  console.log("📝 Creating resources...");
  const resourceData = [
    { title: "Introduction to LSAT Structure", description: "Overview of the LSAT format, scoring, and section breakdown.", url: "https://www.lsac.org/lsat/taking-lsat/test-format", type: "lesson" as const, difficulty: "easy" as const, estimatedMinutes: 20, moduleId: foundations.id, tags: ["intro", "overview", "format"], order: 1 },
    { title: "Argument Structure Basics", description: "Learn to identify conclusions, premises, and assumptions in arguments.", url: "https://example.com/argument-structure", type: "lesson" as const, difficulty: "easy" as const, estimatedMinutes: 30, moduleId: foundations.id, tags: ["arguments", "premises", "conclusions"], order: 2 },
    { title: "Formal Logic: Conditional Statements", description: "If-then statements, contrapositives, and sufficient vs necessary conditions.", url: "https://example.com/conditional-logic", type: "lesson" as const, difficulty: "medium" as const, estimatedMinutes: 45, moduleId: foundations.id, tags: ["formal-logic", "conditionals", "contrapositive"], order: 3 },
    { title: "Foundations Drill Set", description: "Practice identifying argument components in 15 sample arguments.", url: "https://example.com/foundations-drill", type: "drill" as const, difficulty: "easy" as const, estimatedMinutes: 25, moduleId: foundations.id, tags: ["drill", "arguments", "practice"], order: 4 },
    { title: "Assumption Questions Strategy", description: "Techniques for identifying necessary and sufficient assumptions.", url: "https://example.com/assumptions", type: "lesson" as const, difficulty: "medium" as const, estimatedMinutes: 40, moduleId: logicalReasoning.id, tags: ["assumptions", "necessary", "sufficient"], order: 1 },
    { title: "Strengthen & Weaken Questions", description: "How to evaluate answer choices that strengthen or weaken arguments.", url: "https://example.com/strengthen-weaken", type: "lesson" as const, difficulty: "medium" as const, estimatedMinutes: 45, moduleId: logicalReasoning.id, tags: ["strengthen", "weaken", "evaluation"], order: 2 },
    { title: "Flaw Questions Deep Dive", description: "Common logical fallacies tested on the LSAT and how to spot them.", url: "https://example.com/flaw-questions", type: "video" as const, difficulty: "medium" as const, estimatedMinutes: 35, moduleId: logicalReasoning.id, tags: ["flaws", "fallacies", "reasoning-errors"], order: 3 },
    { title: "Must Be True / Must Be False", description: "Inference questions requiring strict logical deduction.", url: "https://example.com/must-be-true", type: "lesson" as const, difficulty: "hard" as const, estimatedMinutes: 40, moduleId: logicalReasoning.id, tags: ["inference", "deduction", "must-be-true"], order: 4 },
    { title: "LR Timed Practice Set 1", description: "25 logical reasoning questions under timed conditions.", url: "https://example.com/lr-practice-1", type: "drill" as const, difficulty: "hard" as const, estimatedMinutes: 35, moduleId: logicalReasoning.id, tags: ["timed", "practice", "drill"], order: 5 },
    { title: "Passage Structure & Main Point", description: "How to quickly identify the main point and structure of RC passages.", url: "https://example.com/rc-main-point", type: "lesson" as const, difficulty: "medium" as const, estimatedMinutes: 35, moduleId: readingComp.id, tags: ["main-point", "structure", "strategy"], order: 1 },
    { title: "Science Passages Strategy", description: "Approach for dense scientific and technical passages.", url: "https://example.com/science-passages", type: "video" as const, difficulty: "hard" as const, estimatedMinutes: 30, moduleId: readingComp.id, tags: ["science", "technical", "passages"], order: 2 },
    { title: "Comparative Reading Technique", description: "Strategy for paired passage questions and comparative analysis.", url: "https://example.com/comparative-reading", type: "article" as const, difficulty: "medium" as const, estimatedMinutes: 25, moduleId: readingComp.id, tags: ["comparative", "paired-passages"], order: 3 },
    { title: "RC Timed Practice Set 1", description: "4 passages with 27 questions under timed conditions.", url: "https://example.com/rc-practice-1", type: "drill" as const, difficulty: "hard" as const, estimatedMinutes: 35, moduleId: readingComp.id, tags: ["timed", "practice", "drill"], order: 4 },
    { title: "Sequencing Games Fundamentals", description: "Linear ordering games: setup, rules, and deductions.", url: "https://example.com/sequencing-games", type: "lesson" as const, difficulty: "medium" as const, estimatedMinutes: 50, moduleId: logicGames.id, tags: ["sequencing", "ordering", "diagramming"], order: 1 },
    { title: "Grouping Games Strategy", description: "In/out games, assignment games, and distribution setups.", url: "https://example.com/grouping-games", type: "lesson" as const, difficulty: "medium" as const, estimatedMinutes: 45, moduleId: logicGames.id, tags: ["grouping", "assignment", "distribution"], order: 2 },
    { title: "Hybrid Games & Advanced Setups", description: "Games combining multiple game types and complex rule interactions.", url: "https://example.com/hybrid-games", type: "video" as const, difficulty: "hard" as const, estimatedMinutes: 40, moduleId: logicGames.id, tags: ["hybrid", "advanced", "complex"], order: 3 },
    { title: "Logic Games Drill Set 1", description: "4 games of increasing difficulty with full explanations.", url: "https://example.com/lg-drill-1", type: "drill" as const, difficulty: "medium" as const, estimatedMinutes: 35, moduleId: logicGames.id, tags: ["drill", "practice", "timed"], order: 4 },
    { title: "Full Practice Test 1", description: "Complete timed practice test covering all sections.", url: "https://example.com/pt-1", type: "practice_test" as const, difficulty: "hard" as const, estimatedMinutes: 175, moduleId: practiceTests.id, tags: ["full-test", "timed", "all-sections"], order: 1 },
    { title: "Full Practice Test 2", description: "Second full-length timed practice test.", url: "https://example.com/pt-2", type: "practice_test" as const, difficulty: "hard" as const, estimatedMinutes: 175, moduleId: practiceTests.id, tags: ["full-test", "timed", "all-sections"], order: 2 },
    { title: "Review: Common Mistakes in LR", description: "Analysis of the most frequent logical reasoning errors and how to avoid them.", url: "https://example.com/review-lr-mistakes", type: "article" as const, difficulty: "medium" as const, estimatedMinutes: 20, moduleId: reviewModule.id, tags: ["review", "mistakes", "logical-reasoning"], order: 1 },
    { title: "Weak Area Drill: Assumptions", description: "Targeted practice on assumption identification — a common weak spot.", url: "https://example.com/weak-assumptions", type: "drill" as const, difficulty: "medium" as const, estimatedMinutes: 25, moduleId: reviewModule.id, tags: ["review", "assumptions", "weak-area"], order: 2 },
  ];

  const insertedResources = await db.insert(resources).values(resourceData).returning();

  console.log("📊 Creating progress entries...");
  const completedResources = insertedResources.slice(0, 4);
  const inProgressResources = insertedResources.slice(4, 6);

  for (const r of completedResources) {
    await db.insert(progress).values({
      userId: user.id,
      resourceId: r.id,
      status: "completed",
      completedAt: new Date(),
      confidenceScore: Math.floor(Math.random() * 3) + 3,
      timeSpentMinutes: r.estimatedMinutes + Math.floor(Math.random() * 10),
    });
  }

  for (const r of inProgressResources) {
    await db.insert(progress).values({
      userId: user.id,
      resourceId: r.id,
      status: "in_progress",
      timeSpentMinutes: Math.floor(r.estimatedMinutes / 2),
    });
  }

  console.log("📝 Creating notes...");
  await db.insert(notes).values({
    userId: user.id,
    resourceId: insertedResources[1].id,
    content: "Key takeaway: Every argument has a conclusion (what the author is trying to prove) and premises (the evidence/reasons). The conclusion is often signaled by words like 'therefore', 'thus', 'hence'. Premises use words like 'because', 'since', 'given that'. Always find the conclusion first!",
  });

  await db.insert(notes).values({
    userId: user.id,
    resourceId: insertedResources[2].id,
    content: "Conditional logic: If A then B. Contrapositive: If not B then not A (always valid). Inverse (If not A then not B) and Converse (If B then A) are NOT necessarily valid. Remember: sufficient condition triggers the necessary condition.",
  });

  console.log("⚠️ Creating weak areas...");
  await db.insert(weakAreas).values([
    { userId: user.id, title: "Sufficient vs Necessary Assumptions", description: "Struggling to distinguish between sufficient and necessary assumption questions.", confidenceScore: 2, moduleId: logicalReasoning.id },
    { userId: user.id, title: "Science-Heavy RC Passages", description: "Losing time on dense scientific passages with technical vocabulary.", confidenceScore: 1, moduleId: readingComp.id },
    { userId: user.id, title: "Hybrid Logic Games", description: "Difficulty setting up games that combine sequencing and grouping.", confidenceScore: 2, moduleId: logicGames.id },
  ]);

  console.log("\n✅ Seed data created successfully!");
  console.log(`   User: ${user.name} (${user.email})`);
  console.log(`   Modules: 6`);
  console.log(`   Resources: ${insertedResources.length}`);
  console.log(`   Progress entries: ${completedResources.length + inProgressResources.length}`);
  console.log(`   Notes: 2`);
  console.log(`   Weak areas: 3`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
