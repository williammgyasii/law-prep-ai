/**
 * Authenticated LawHub LSAT Prep scraper using Playwright.
 *
 * Requires LAWHUB_EMAIL and LAWHUB_PASSWORD in .env.
 * Uses Playwright to log in and navigate the test interface to extract
 * question content from PrepTests and drill sets.
 *
 * Usage: npx tsx scripts/scrapers/lsat-prep-auth.ts
 */

import { chromium, type Page, type Browser } from "playwright";

export interface ScrapedLSATQuestion {
  passage: string;
  question: string;
  options: string[];
  correctAnswer: string | null;
  sectionType: "logical_reasoning" | "reading_comprehension" | "analytical_reasoning";
  prepTestNumber: string | null;
  sectionNumber: string | null;
  questionNumber: string | null;
  source: "lawhub_preptest";
}

async function login(page: Page): Promise<boolean> {
  const email = process.env.LAWHUB_EMAIL || process.env.LAWHUB_USERNAME;
  const password = process.env.LAWHUB_PASSWORD;

  if (!email || !password) {
    console.error("LAWHUB_EMAIL and LAWHUB_PASSWORD must be set in .env");
    return false;
  }

  console.log("  Navigating to LawHub sign-in...");
  await page.goto("https://app.lawhub.org/auth/signin", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (!(await emailInput.isVisible({ timeout: 10000 }).catch(() => false))) {
    console.warn("  Could not find email input, checking if already logged in...");
    const isLoggedIn = await page.locator('text=Sign out, text=My Account, [data-testid="user-menu"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isLoggedIn) {
      console.log("  Already logged in!");
      return true;
    }
    console.error("  Login form not found and not logged in");
    return false;
  }

  console.log("  Entering credentials...");
  await emailInput.fill(email);
  await passwordInput.fill(password);

  const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in")').first();
  await submitBtn.click();

  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle").catch(() => {});

  const currentUrl = page.url();
  if (currentUrl.includes("signin") || currentUrl.includes("login")) {
    console.error("  Login may have failed - still on sign-in page");
    return false;
  }

  console.log("  Login successful!");
  return true;
}

async function scrapeTestContent(
  page: Page,
  testUrl: string,
  prepTestNumber: string | null
): Promise<ScrapedLSATQuestion[]> {
  const questions: ScrapedLSATQuestion[] = [];

  try {
    await page.goto(testUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Look for question containers in the test interface
    const questionElements = await page.locator('[data-testid*="question"], .question-container, [class*="question"]').all();

    if (questionElements.length === 0) {
      // Try to find the "Start" or "Begin" button to enter the test
      const startBtn = page.locator('button:has-text("Start"), button:has-text("Begin"), button:has-text("Resume")').first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Extract passage text
    const passageEl = page.locator('[data-testid*="passage"], .passage, [class*="stimulus"], [class*="passage"]').first();
    const passage = await passageEl.textContent().catch(() => "") || "";

    // Extract question stems and options
    const stems = await page.locator('[data-testid*="stem"], .question-stem, [class*="stem"]').all();

    for (let i = 0; i < stems.length; i++) {
      const stemText = await stems[i].textContent().catch(() => "") || "";
      if (!stemText) continue;

      const optionEls = await page.locator(`[data-testid*="option"], .answer-choice, [class*="choice"]`).all();
      const options: string[] = [];

      for (const optEl of optionEls) {
        const text = await optEl.textContent().catch(() => "") || "";
        if (text) options.push(text.replace(/^\s*\([A-E]\)\s*/, "").trim());
      }

      const sectionType = detectSectionFromContent(passage, stemText);

      questions.push({
        passage: passage.trim(),
        question: stemText.trim(),
        options,
        correctAnswer: null,
        sectionType,
        prepTestNumber,
        sectionNumber: null,
        questionNumber: String(i + 1),
        source: "lawhub_preptest",
      });
    }
  } catch (err) {
    console.warn(`  Error scraping ${testUrl}: ${err instanceof Error ? err.message : err}`);
  }

  return questions;
}

function detectSectionFromContent(
  passage: string,
  question: string
): ScrapedLSATQuestion["sectionType"] {
  const combined = (passage + question).toLowerCase();

  if (
    combined.includes("which one of the following") &&
    passage.length < 800 &&
    !combined.includes("passage")
  ) {
    return "logical_reasoning";
  }

  if (passage.length > 800 || combined.includes("the passage") || combined.includes("the author")) {
    return "reading_comprehension";
  }

  if (
    combined.includes("exactly") &&
    (combined.includes("assigned") || combined.includes("selected") || combined.includes("scheduled"))
  ) {
    return "analytical_reasoning";
  }

  return "logical_reasoning";
}

export async function scrapeLSATPrepAuth(): Promise<ScrapedLSATQuestion[]> {
  console.log("\n=== Authenticated LawHub LSAT Prep Scraper ===");

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    const loggedIn = await login(page);
    if (!loggedIn) {
      console.error("  Failed to log in to LawHub. Skipping authenticated scrape.");
      return [];
    }

    // Navigate to the prep library
    await page.goto("https://app.lawhub.org/library/fulltests", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // Get all test links
    const testLinks = await page.locator("a[href*='/test/'], a[href*='/preptest/']").all();
    const urls: { url: string; title: string }[] = [];

    for (const link of testLinks) {
      const href = await link.getAttribute("href").catch(() => null);
      const title = await link.textContent().catch(() => "") || "";
      if (href && title) {
        urls.push({
          url: href.startsWith("http") ? href : `https://app.lawhub.org${href}`,
          title: title.trim(),
        });
      }
    }

    console.log(`  Found ${urls.length} test links to scrape`);

    const allQuestions: ScrapedLSATQuestion[] = [];

    // Scrape first few tests as a starting point
    const toScrape = urls.slice(0, 5);
    for (const { url, title } of toScrape) {
      console.log(`  Scraping: ${title}...`);
      const ptMatch = title.match(/PrepTest\s+(\d+)/i);
      const ptNum = ptMatch ? ptMatch[1] : null;

      const questions = await scrapeTestContent(page, url, ptNum);
      allQuestions.push(...questions);
      console.log(`    -> ${questions.length} questions extracted`);

      await page.waitForTimeout(2000);
    }

    console.log(`\n  Total questions from authenticated scrape: ${allQuestions.length}`);
    return allQuestions;
  } catch (err) {
    console.error(`  Authenticated scrape failed: ${err}`);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

// Allow running directly
if (process.argv[1]?.includes("lsat-prep-auth")) {
  import("dotenv/config").then(() => {
    scrapeLSATPrepAuth()
      .then((questions) => {
        console.log(`\nDone. Scraped ${questions.length} questions.`);
        if (questions.length > 0) {
          const { writeFileSync, mkdirSync } = require("fs");
          const { join, dirname } = require("path");
          const dataDir = join(dirname(process.argv[1]!), "..", "data");
          mkdirSync(dataDir, { recursive: true });
          writeFileSync(
            join(dataDir, "lawhub-prep.json"),
            JSON.stringify(questions, null, 2)
          );
          console.log(`Saved to scripts/data/lawhub-prep.json`);
        }
      })
      .catch(console.error);
  });
}
