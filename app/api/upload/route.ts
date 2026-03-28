import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { getUserTier, getLimit } from "@/lib/subscription";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromURL(url: string): Promise<{ text: string; title: string }> {
  const cheerio = await import("cheerio");
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LawPrepAI/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || "Untitled";
  const text = $("article, main, .content, .post-content, body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();

  return { text, title };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const tier = await getUserTier(userId);
  const docLimit = getLimit(tier, "documentsTotal");

  if (docLimit !== -1) {
    const [result] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.userId, userId));
    if ((result?.count ?? 0) >= docLimit) {
      return NextResponse.json(
        { error: "Document limit reached. Upgrade your plan for more uploads.", tier },
        { status: 403 }
      );
    }
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    const url = body.url as string;
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      const { text, title } = await extractTextFromURL(url);
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      const [doc] = await db
        .insert(documents)
        .values({
          userId,
          title,
          fileType: "url",
          fileUrl: url,
          extractedText: text,
          wordCount,
        })
        .returning();

      return NextResponse.json({ document: doc });
    } catch {
      return NextResponse.json({ error: "Failed to fetch and parse URL" }, { status: 400 });
    }
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase();
  let extractedText = "";
  let fileType: "pdf" | "docx" | "text" = "text";

  try {
    if (ext === ".pdf") {
      fileType = "pdf";
      extractedText = await extractTextFromPDF(buffer);
    } else if (ext === ".docx") {
      fileType = "docx";
      extractedText = await extractTextFromDOCX(buffer);
    } else if ([".txt", ".md", ".markdown"].includes(ext)) {
      fileType = "text";
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload PDF, DOCX, TXT, or MD files." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Failed to extract text from file" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", userId);
  await mkdir(uploadsDir, { recursive: true });

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadsDir, safeName);
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/${userId}/${safeName}`;
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  const [doc] = await db
    .insert(documents)
    .values({
      userId,
      title,
      fileType,
      fileUrl,
      extractedText,
      wordCount,
    })
    .returning();

  return NextResponse.json({ document: doc });
}
