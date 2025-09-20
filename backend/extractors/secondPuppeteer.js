// serverless-multi-site-extractor.js
import puppeteer from "puppeteer-core";
import extra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import OpenAI from "openai";
import axios from "axios";
import { frontendWorker } from "../agents/aiworker.js";

extra.use(StealthPlugin()); // puppeteer-extra works with puppeteer-core when launched correctly

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let _browser = null;
async function getBrowser(sendLog) {
  try {
    if (_browser && _browser.isConnected && _browser.isConnected()) {
      return _browser;
    }

    const execPath = await chromium.executablePath(); 
    sendLog?.(chalk.gray(`Using chromium executable: ${execPath}`));

    _browser = await extra.launch({
      executablePath: execPath,
      args: chromium.args.concat([
        // extra safe args for serverless environments
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote",
      ]),
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    });

    sendLog?.(chalk.green("✅ Chromium launched (global)"));
    return _browser;
  } catch (err) {
    sendLog?.(chalk.red(`❌ Failed to launch chromium: ${err.message}`));
    // Rethrow so callers can fallback or fail gracefully
    throw err;
  }
}

// === AI Filter Agent ===
async function filterAIWorker(chunk, userQuery, siteUrl, sendLog) {
  sendLog?.(chalk.blue(`🤖 AI filtering ${siteUrl} | Chunk size: ${chunk.length}`));
  try {
    const prompt = `
You are an expert frontend engineer. 
Check if the following HTML chunk contains content relevant to: "${userQuery}".
Respond strictly as JSON only:
{
  "found": true/false,
  "html": "<only relevant html>",
  "css": "<any inline or extracted css>",
  "js": "<any inline js if relevant>"
}
HTML Chunk:
${chunk}
`;
    // Using chat completions similar to original code
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let text = response.choices[0].message.content;
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      sendLog?.(chalk.green(`✅ AI parsed JSON successfully for ${siteUrl}`));
      return parsed;
    } catch (parseErr) {
      sendLog?.(chalk.yellow(`⚠️ AI response parse failed for ${siteUrl} | Raw preview: ${text.slice(0, 200)}...`));
      return { found: false, html: "", css: "", js: "" };
    }
  } catch (err) {
    sendLog?.(chalk.red(`❌ AI Filter failed for ${siteUrl} | Error: ${err.message}`));
    return { found: false, html: "", css: "", js: "" };
  }
}

// === Asset downloader ===
// NOTE: In serverless, prefer uploading to S3/GCS instead of long-term disk storage.
// This function writes to OUTPUT_DIR (ephemeral in serverless). To enable S3,
// add logic to upload response.data to S3 and return the remote URL.
async function downloadFile(fileUrl, siteDir, baseUrl, sendLog) {
  try {
    const u = new URL(fileUrl, baseUrl);
    if (!u.href.startsWith(new URL(baseUrl).origin) && !u.href.startsWith(baseUrl)) {
      sendLog?.(chalk.gray(`⏩ Skipped external asset: ${u.href}`));
      return null;
    }

    const folder = "assets";
    const fileName = path.basename(u.pathname.split("?")[0]) || `asset-${Date.now()}`;
    const outPath = path.join(siteDir, folder, fileName);

    await fs.ensureDir(path.dirname(outPath));
    const response = await axios.get(u.href, { responseType: "arraybuffer", timeout: 30000 });
    await fs.writeFile(outPath, response.data);

    sendLog?.(chalk.cyan(`📥 Saved asset: ${u.href} → ${outPath}`));
    // return relative path as in original
    return `./${folder}/${fileName}`;
  } catch (err) {
    sendLog?.(chalk.red(`❌ Failed to download ${fileUrl} | ${err.message}`));
    return null;
  }
}

// === Auto scroll with safety limits ===
async function autoScroll(page, sendLog, maxScrolls = 30) {
  sendLog?.(chalk.gray("🔄 Auto-scrolling page for lazy-loaded content..."));
  try {
    await page.evaluate(
      async (max, dist) => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          let iterations = 0;
          const distance = dist || 200;
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            iterations++;
            // stop if bottom reached or too many iterations
            if (totalHeight >= document.body.scrollHeight || iterations >= max) {
              clearInterval(timer);
              resolve();
            }
          }, 200);
        });
      },
      maxScrolls,
      200
    );
    sendLog?.(chalk.green("✅ Auto-scroll completed"));
  } catch (err) {
    sendLog?.(chalk.yellow(`⚠️ Auto-scroll error (continuing): ${err.message}`));
  }
}

// === Main Class ===
export default class MultiSiteExtractor {
  constructor(urls, userSite, userQuery, OUTPUT_DIR = "/tmp/output", sendLog = console.log) {
    this.urls = urls || [];
    this.userSite = userSite || "";
    this.userQuery = userQuery || "";
    // Use /tmp by default for serverless environment
    this.OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || OUTPUT_DIR);
    this.sendLog = sendLog;
    // concurrency limit placeholder (not implemented as a queue here)
  }

  // scrape a site and return html/css/js — uses global browser
  async scrapeSite(url) {
    this.sendLog?.(chalk.blue(`🌐 Starting scrape: ${url}`));
    let page = null;
    try {
      const browser = await getBrowser(this.sendLog);
      page = await browser.newPage();
      // small navigation and resource timeouts
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      this.sendLog?.(chalk.green(`✅ Loaded page: ${url}`));

      const html = await page.evaluate(() => document.body ? document.body.outerHTML : document.documentElement.outerHTML || "");
      const css = await page.evaluate(() => {
        let styles = "";
        for (const sheet of document.styleSheets) {
          try {
            if (sheet && sheet.cssRules) {
              for (const rule of sheet.cssRules) styles += rule.cssText;
            }
          } catch (e) {
            // cross-origin stylesheet - ignore
          }
        }
        return styles;
      });
      const js = await page.evaluate(() => {
        let scripts = "";
        document.querySelectorAll("script").forEach((s) => {
          if (!s.src) scripts += s.innerHTML;
        });
        return scripts;
      });

      this.sendLog?.(chalk.green(`✅ Scraped ${url} | HTML: ${html.length}, CSS: ${css.length}, JS: ${js.length}`));
      await page.close();
      return { html, css, js };
    } catch (err) {
      this.sendLog?.(chalk.red(`❌ Scrape failed for ${url} | ${err.message}`));
      try { if (page) await page.close(); } catch(_) {}
      return { html: "", css: "", js: "" };
    }
  }

  // scrape the user's site, gather assets, replace references with local paths
  async scrapeAndSaveAssets(url) {
    this.sendLog?.(chalk.blue(`🌐 Scraping user site (React/Next.js aware): ${url}`));
    let page = null;
    try {
      const browser = await getBrowser(this.sendLog);
      page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
      this.sendLog?.(chalk.green("✅ User site loaded"));

      // scroll to trigger lazy-loading but bounded
      await autoScroll(page, this.sendLog, 40);

      let html = await page.evaluate(() => document.documentElement ? document.documentElement.outerHTML : document.body.outerHTML);
      const siteOrigin = new URL(url).origin;

      const assets = await page.evaluate(() => {
        const out = { images: [], css: [], js: [] };
        document.querySelectorAll("img[src]").forEach((img) => out.images.push(img.src));
        document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => out.css.push(link.href));
        document.querySelectorAll("script[src]").forEach((s) => out.js.push(s.src));
        return out;
      });

      this.sendLog?.(chalk.cyan(`📦 Assets found | Images: ${assets.images.length}, CSS: ${assets.css.length}, JS: ${assets.js.length}`));
      await page.close();

      // ensure output dir exists (serverless: /tmp)
      const siteDir = this.OUTPUT_DIR;
      await fs.ensureDir(path.join(siteDir, "assets"));

      // sequential downloads to keep memory low - can be parallelized with limits
      for (const imgUrl of assets.images) {
        const newPath = await downloadFile(imgUrl, siteDir, siteOrigin, this.sendLog);
        if (newPath) {
          // replace all occurrences of the absolute asset URL with local path
          html = html.split(imgUrl).join(newPath);
        }
      }
      for (const cssUrl of assets.css) {
        const newPath = await downloadFile(cssUrl, siteDir, siteOrigin, this.sendLog);
        if (newPath) html = html.split(cssUrl).join(newPath);
      }
      for (const jsUrl of assets.js) {
        const newPath = await downloadFile(jsUrl, siteDir, siteOrigin, this.sendLog);
        if (newPath) html = html.split(jsUrl).join(newPath);
      }

      this.sendLog?.(chalk.green("✅ Assets replaced in HTML"));
      return { html, css: "", js: "" };
    } catch (err) {
      this.sendLog?.(chalk.red(`❌ User site scrape failed | ${err.message}`));
      try { if (page) await page.close(); } catch(_) {}
      return { html: "", css: "", js: "" };
    }
  }

  chunkHTML(html, chunkSize = 5000) {
    this.sendLog?.(chalk.gray(`✂️ Splitting HTML into chunks of ${chunkSize} chars`));
    const chunks = [];
    for (let i = 0; i < html.length; i += chunkSize) {
      chunks.push(html.slice(i, i + chunkSize));
    }
    this.sendLog?.(chalk.green(`✅ Total chunks created: ${chunks.length}`));
    return chunks;
  }

  async filterSite(url) {
    this.sendLog?.(chalk.blue(`🔎 Starting filter for inspiration site: ${url}`));
    const { html } = await this.scrapeSite(url);
    if (!html) {
      this.sendLog?.(chalk.yellow(`⚠️ No HTML retrieved from ${url}`));
      return null;
    }

    const chunks = this.chunkHTML(html);

    let siteHtml = "";
    let siteCss = "";
    let siteJs = "";

    for (const [i, chunk] of chunks.entries()) {
      this.sendLog?.(chalk.gray(`📝 Processing chunk ${i + 1}/${chunks.length} for ${url}`));
      const filtered = await filterAIWorker(chunk, this.userQuery, url, this.sendLog);
      if (filtered) {
        siteHtml += filtered.html || "";
        siteCss += filtered.css || "";
        siteJs += filtered.js || "";

        if (filtered.found) {
          this.sendLog?.(chalk.green(`✅ Relevant content found early in ${url}`));
          break;
        }
      }
    }

    if (!siteHtml) {
      this.sendLog?.(chalk.yellow(`⚠️ No relevant content found in ${url}`));
      return null;
    }

    return { html: siteHtml, css: siteCss, js: siteJs };
  }

  async combineSitesThenEnhance() {
    this.sendLog?.(chalk.magenta("🚀 Starting site combination + AI enhancement"));
    await fs.ensureDir(this.OUTPUT_DIR);
    this.sendLog?.(chalk.gray("📁 Output directory ready: " + this.OUTPUT_DIR));

    const combinedInspiration = { html: "", css: "", js: "" };

    for (const url of this.urls) {
      try {
        this.sendLog?.(chalk.gray(`➡️ Filtering inspiration site: ${url}`));
        const filtered = await this.filterSite(url);
        if (filtered) {
          combinedInspiration.html += filtered.html;
          combinedInspiration.css += filtered.css;
          combinedInspiration.js += filtered.js;
          this.sendLog?.(chalk.green(`✅ Added inspiration from ${url}`));
        }
      } catch (err) {
        this.sendLog?.(chalk.yellow(`⚠️ Skipping ${url} due to error: ${err.message}`));
      }
    }

    let userSiteContent = { html: "", css: "", js: "" };
    try {
      userSiteContent = await this.scrapeAndSaveAssets(this.userSite);
      this.sendLog?.(chalk.green("✅ User site scraped successfully"));
    } catch (err) {
      this.sendLog?.(chalk.red("❌ User site scrape failed: " + err.message));
    }

    this.sendLog?.(chalk.blue("🤖 Enhancing final result with AI worker..."));
    const finalResult = await frontendWorker(
      this.userQuery,
      userSiteContent,
      combinedInspiration.html,
      combinedInspiration.css,
      combinedInspiration.js,
      this.sendLog
    );

    // Write files to OUTPUT_DIR (ephemeral on serverless). Swap to S3 if persistence is needed.
    await fs.writeFile(path.join(this.OUTPUT_DIR, "index.html"), finalResult.html, "utf-8");
    await fs.writeFile(path.join(this.OUTPUT_DIR, "styles.css"), finalResult.css, "utf-8");
    await fs.writeFile(path.join(this.OUTPUT_DIR, "script.js"), finalResult.js, "utf-8");

    this.sendLog?.(chalk.green(`✅ All files saved in ${this.OUTPUT_DIR}`));
    return { outputDir: this.OUTPUT_DIR };
  }
}
