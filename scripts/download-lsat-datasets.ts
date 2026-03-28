import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");

interface AGIEvalQuestion {
  passage: string;
  question: string;
  options: string[];
  label: string;
  answer: string | null;
  other: string | null;
}

export interface NormalizedQuestion {
  passage: string;
  question: string;
  options: string[];
  correctAnswer: string;
  sectionType: "logical_reasoning" | "reading_comprehension" | "analytical_reasoning";
  source: string;
  prepTestNumber: string | null;
}

const AGIEVAL_SOURCES = [
  {
    url: "https://raw.githubusercontent.com/ruixiangcui/AGIEval/main/data/v1/lsat-lr.jsonl",
    sectionType: "logical_reasoning" as const,
    source: "agieval_lsat_lr",
  },
  {
    url: "https://raw.githubusercontent.com/ruixiangcui/AGIEval/main/data/v1/lsat-rc.jsonl",
    sectionType: "reading_comprehension" as const,
    source: "agieval_lsat_rc",
  },
  {
    url: "https://raw.githubusercontent.com/ruixiangcui/AGIEval/main/data/v1/lsat-ar.jsonl",
    sectionType: "analytical_reasoning" as const,
    source: "agieval_lsat_ar",
  },
];

function cleanOptionText(opt: string): string {
  return opt.replace(/^\([A-E]\)\s*/, "").trim();
}

function extractOptionLetter(opt: string): string {
  const match = opt.match(/^\(([A-E])\)/);
  return match ? match[1] : "";
}

async function fetchAGIEval(): Promise<NormalizedQuestion[]> {
  const allQuestions: NormalizedQuestion[] = [];

  for (const src of AGIEVAL_SOURCES) {
    console.log(`  Fetching ${src.source}...`);
    const res = await fetch(src.url);
    if (!res.ok) {
      console.warn(`  Failed to fetch ${src.url}: ${res.status}`);
      continue;
    }

    const text = await res.text();
    const lines = text.trim().split("\n");

    for (const line of lines) {
      try {
        const q: AGIEvalQuestion = JSON.parse(line);
        const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
        const correctIdx = letterToIndex[q.label];

        allQuestions.push({
          passage: q.passage,
          question: q.question,
          options: q.options.map(cleanOptionText),
          correctAnswer: String(correctIdx ?? 0),
          sectionType: src.sectionType,
          source: src.source,
          prepTestNumber: null,
        });
      } catch {
        // skip malformed lines
      }
    }

    console.log(`    -> ${lines.length} questions parsed`);
  }

  return allQuestions;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&hellip;/g, "\u2026");
}

function parseDarthJudieSentence(sentence: string): NormalizedQuestion | null {
  if (!sentence || sentence.length < 100) return null;

  const idMatch = sentence.match(/Question ID:\s*PT(\d+)\s+S(\d+)\s+Q(\d+)/);
  const prepTestNumber = idMatch ? idMatch[1] : null;
  const sectionNum = idMatch ? parseInt(idMatch[2]) : null;

  const passageStart = sentence.indexOf("Passage:");
  const stemStart = sentence.indexOf("Stem:");
  const correctStart = sentence.indexOf("Correct Answer Choice:");

  if (passageStart === -1 || stemStart === -1 || correctStart === -1) return null;

  const passage = decodeHtmlEntities(
    sentence.substring(passageStart + "Passage:".length, stemStart).trim()
  );
  const stemToCorrect = sentence.substring(stemStart + "Stem:".length, correctStart).trim();
  const question = decodeHtmlEntities(stemToCorrect);

  const afterCorrect = sentence.substring(correctStart + "Correct Answer Choice:".length);
  const correctLetter = afterCorrect.trim().charAt(0);

  if (!"ABCDE".includes(correctLetter)) return null;

  const choicesSection = sentence.substring(correctStart);
  const choices: string[] = [];
  const choiceLetters = ["A", "B", "C", "D", "E"];

  for (let i = 0; i < choiceLetters.length; i++) {
    const letter = choiceLetters[i];
    const marker = `Choice ${letter}:`;
    const idx = choicesSection.indexOf(marker);
    if (idx === -1) continue;

    const start = idx + marker.length;
    let end = choicesSection.length;

    for (let j = i + 1; j < choiceLetters.length; j++) {
      const nextMarker = `Choice ${choiceLetters[j]}:`;
      const nextIdx = choicesSection.indexOf(nextMarker, start);
      if (nextIdx !== -1) {
        end = nextIdx;
        break;
      }
    }

    const choiceText = decodeHtmlEntities(choicesSection.substring(start, end).trim());
    if (choiceText.length > 0) {
      choices.push(choiceText);
    }
  }

  if (choices.length < 4 || question.length < 10) return null;

  const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
  const correctIdx = letterToIndex[correctLetter] ?? 0;

  let sectionType: NormalizedQuestion["sectionType"] = "logical_reasoning";
  const combined = (passage + question).toLowerCase();

  const hasGameSetup =
    combined.includes("exactly") && (combined.includes("conditions") || combined.includes("constraints")) ||
    combined.includes("the following conditions") ||
    combined.includes("must hold") ||
    combined.includes("assigned to") && combined.includes("each of") ||
    combined.includes("sequentially") && combined.includes("schedule") ||
    /each of (?:exactly )?\w+ /.test(combined) && combined.includes("following");

  if (hasGameSetup) {
    sectionType = "analytical_reasoning";
  } else if (passage.length > 400) {
    sectionType = "reading_comprehension";
  }

  if (sectionNum !== null) {
    if (sectionNum === 3 || sectionNum === 4) {
      if (passage.length > 400 && !hasGameSetup) {
        sectionType = "reading_comprehension";
      }
    }
  }

  return {
    passage,
    question,
    options: choices,
    correctAnswer: String(correctIdx),
    sectionType,
    source: "darthjudie_lsat",
    prepTestNumber,
  };
}

async function fetchDarthJudie(): Promise<NormalizedQuestion[]> {
  console.log("  Fetching DarthJudie/LSAT_Questions from HuggingFace...");

  const questions: NormalizedQuestion[] = [];
  const batchSize = 100;
  let totalRows = 9468;
  let skipped = 0;

  try {
    for (let offset = 0; offset < totalRows; offset += batchSize) {
      const url = `https://datasets-server.huggingface.co/rows?dataset=DarthJudie%2FLSAT_Questions&config=default&split=train&offset=${offset}&length=${batchSize}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });

      if (!res.ok) {
        if (offset === 0) {
          console.warn(`  HuggingFace API returned ${res.status}, skipping DarthJudie dataset`);
          return [];
        }
        break;
      }

      const data = await res.json();
      if (offset === 0 && data.num_rows_total) {
        totalRows = data.num_rows_total;
        console.log(`    Dataset has ${totalRows} total rows`);
      }

      const rows = data.rows || [];
      for (const row of rows) {
        const sentence = row.row?.Sentence || "";
        const parsed = parseDarthJudieSentence(sentence);
        if (parsed) {
          questions.push(parsed);
        } else {
          skipped++;
        }
      }

      if (offset % 500 === 0) {
        console.log(`    -> ${questions.length} parsed, ${skipped} skipped (offset ${offset})...`);
      }

      await new Promise((r) => setTimeout(r, 150));
    }

    console.log(`    -> Total DarthJudie questions: ${questions.length} (${skipped} skipped)`);
    return questions;
  } catch (err) {
    console.warn(`  Failed to fetch DarthJudie dataset: ${err}`);
    console.log(`    -> Returning ${questions.length} questions fetched so far`);
    return questions;
  }
}

async function main() {
  console.log("LSAT Dataset Downloader");
  console.log("=".repeat(50));

  mkdirSync(DATA_DIR, { recursive: true });

  console.log("\n1. Downloading AGIEval datasets...");
  const agiQuestions = await fetchAGIEval();
  console.log(`   Total AGIEval questions: ${agiQuestions.length}`);

  console.log("\n2. Downloading DarthJudie dataset...");
  const djQuestions = await fetchDarthJudie();
  console.log(`   Total DarthJudie questions: ${djQuestions.length}`);

  const allQuestions = [...agiQuestions, ...djQuestions];

  const bySection = {
    logical_reasoning: allQuestions.filter((q) => q.sectionType === "logical_reasoning").length,
    reading_comprehension: allQuestions.filter((q) => q.sectionType === "reading_comprehension").length,
    analytical_reasoning: allQuestions.filter((q) => q.sectionType === "analytical_reasoning").length,
  };

  const outputPath = join(DATA_DIR, "lsat-questions.json");
  writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));

  console.log("\n" + "=".repeat(50));
  console.log("Download Summary:");
  console.log(`  Total questions: ${allQuestions.length}`);
  console.log(`  Logical Reasoning: ${bySection.logical_reasoning}`);
  console.log(`  Reading Comprehension: ${bySection.reading_comprehension}`);
  console.log(`  Analytical Reasoning: ${bySection.analytical_reasoning}`);
  console.log(`\nSaved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Download failed:", err);
  process.exit(1);
});
