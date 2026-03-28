import * as cheerio from "cheerio";

const BASE_URL = "https://app.lawhub.org";
const DELAY_MS = 1200;
const MAX_RETRIES = 3;

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function fetchPage(path: string): Promise<cheerio.CheerioAPI> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await rateLimit();
    try {
      console.log(`  [fetch] ${url} (attempt ${attempt})`);
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }

      const html = await res.text();
      return cheerio.load(html);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  [fetch] attempt ${attempt} failed: ${message}`);
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${message}`);
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 * attempt)
      );
    }
  }

  throw new Error("Unreachable");
}

export function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}
