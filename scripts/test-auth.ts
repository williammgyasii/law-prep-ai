import "dotenv/config";

const USERNAME = process.env.LAWHUB_USERNAME || process.env.LAWHUB_EMAIL!;
const PASSWORD = process.env.LAWHUB_PASSWORD!;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const allCookies: Record<string, string> = {};
function parseCookies(headers: Headers) {
  for (const sc of headers.getSetCookie?.() || []) {
    const m = sc.match(/^([^=]+)=([^;]*)/);
    if (m) allCookies[m[1]] = m[2];
  }
}
function cookieStr(): string {
  return Object.entries(allCookies).map(([k, v]) => `${k}=${v}`).join("; ");
}

async function f(url: string, opts: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...opts,
    headers: { "User-Agent": UA, Cookie: cookieStr(), ...(opts.headers as Record<string, string> || {}) },
    redirect: "manual",
  });
  parseCookies(res.headers);
  return res;
}

async function follow(url: string): Promise<{ res: Response; url: string }> {
  let u = url;
  for (let i = 0; i < 15; i++) {
    const r = await f(u);
    const loc = r.headers.get("location");
    if (!loc || (r.status < 301 || r.status > 307)) return { res: r, url: u };
    u = loc.startsWith("http") ? loc : new URL(loc, u).href;
    console.log(`  [${r.status}] -> ${u.substring(0, 120)}`);
  }
  throw new Error("Too many redirects");
}

async function main() {
  console.log("Using username:", USERNAME ? USERNAME.substring(0, 3) + "***" : "NOT SET");

  console.log("\n=== Step 1: Get login page ===");
  const { res: loginPage, url: loginUrl } = await follow(
    "https://lawhublearning.lsac.org/courses/take/Finding-the-Right-Summer-Job/multimedia/72770893-introduction"
  );
  const html = await loginPage.text();

  const csrf = html.match(/"csrf"\s*:\s*"([^"]+)"/)?.[1]!;
  const transId = html.match(/"transId"\s*:\s*"([^"]+)"/)?.[1]!;
  const urlObj = new URL(loginUrl);
  const tenant = urlObj.pathname.split("/")[1];

  console.log("Got CSRF and transId");

  // Step 2: POST credentials
  console.log("\n=== Step 2: Login ===");
  const selfAssertedUrl = `${urlObj.origin}/${tenant}/b2c_1a_login/SelfAsserted?tx=${encodeURIComponent(transId)}&p=b2c_1a_login`;

  const body = new URLSearchParams({
    request_type: "RESPONSE",
    logonIdentifier: USERNAME,
    password: PASSWORD,
  });

  const loginRes = await f(selfAssertedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-CSRF-TOKEN": csrf,
      "X-Requested-With": "XMLHttpRequest",
      Referer: loginUrl,
      Origin: urlObj.origin,
    },
    body: body.toString(),
  });

  const loginBody = await loginRes.text();
  console.log("Login response:", loginBody.substring(0, 200));

  if (!loginBody.includes('"status":"200"')) {
    console.log("Login failed. Trying alternate field names...");
    // Try signInName
    for (const field of ["signInName", "Username", "userid"]) {
      const body2 = new URLSearchParams({
        request_type: "RESPONSE",
        [field]: USERNAME,
        password: PASSWORD,
      });
      const res2 = await f(selfAssertedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-CSRF-TOKEN": csrf,
          "X-Requested-With": "XMLHttpRequest",
          Referer: loginUrl,
          Origin: urlObj.origin,
        },
        body: body2.toString(),
      });
      const body2Text = await res2.text();
      console.log(`  [${field}]: ${body2Text.substring(0, 150)}`);
      if (body2Text.includes('"status":"200"')) {
        console.log("*** SUCCESS with field:", field, "***");
        break;
      }
    }
    return;
  }

  console.log("*** LOGIN SUCCESS ***");

  // Step 3: Confirm
  console.log("\n=== Step 3: Confirm login ===");
  const confirmedUrl = `${urlObj.origin}/${tenant}/b2c_1a_login/api/CombinedSigninAndSignup/confirmed?rememberMe=false&csrf_token=${encodeURIComponent(csrf)}&tx=${encodeURIComponent(transId)}&p=b2c_1a_login`;

  const confirmedRes = await f(confirmedUrl, { headers: { Referer: loginUrl } });
  console.log("Confirmed:", confirmedRes.status);
  const loc = confirmedRes.headers.get("location");

  if (!loc) {
    console.log("No redirect:", (await confirmedRes.text()).substring(0, 300));
    return;
  }

  console.log("Redirect:", loc.substring(0, 120));

  // Step 4: Follow redirects
  console.log("\n=== Step 4: Follow post-auth redirects ===");
  const { res: finalRes, url: finalUrl } = await follow(loc);
  console.log("Final:", finalRes.status, finalUrl.substring(0, 120));

  // Step 5: Fetch lesson
  console.log("\n=== Step 5: Fetch lesson ===");
  const { res: lessonRes } = await follow(
    "https://lawhublearning.lsac.org/courses/take/Finding-the-Right-Summer-Job/multimedia/72770893-introduction"
  );
  const lessonHtml = await lessonRes.text();
  console.log("Lesson status:", lessonRes.status, "length:", lessonHtml.length);
  console.log("Title:", lessonHtml.match(/<title>([^<]+)/)?.[1]);

  for (const m of ["wistia", "vimeo", "video", "iframe", "transcript", "fr-view", "text-block", "rich-text"]) {
    const c = (lessonHtml.match(new RegExp(m, "gi")) || []).length;
    if (c) console.log(`  "${m}": ${c}`);
  }

  const wistia = lessonHtml.match(/wistia_async_([a-z0-9]+)/);
  if (wistia) console.log("Wistia video ID:", wistia[1]);

  const textBlock = lessonHtml.match(/class="[^"]*fr-view[^"]*"[^>]*>([\s\S]{0,500})/);
  if (textBlock) console.log("Text content:", textBlock[1].replace(/<[^>]+>/g, "").substring(0, 200));
}

main().catch(console.error);
