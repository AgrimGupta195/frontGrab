import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import OpenAI from "openai";
import axios from "axios";
import { frontendWorker } from "../agents/aiworker.js";

puppeteer.use(StealthPlugin());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === AI Filter Agent ===
async function filterAIWorker(chunk, userQuery, siteUrl, sendLog) {
  sendLog(`🤖 AI filtering ${siteUrl} | Chunk size: ${chunk.length}`);
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
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let text = response.choices[0].message.content;
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      sendLog(`✅ AI parsed JSON successfully for ${siteUrl}`);
      return parsed;
    } catch {
      sendLog(`⚠️ AI response parse failed for ${siteUrl} | Raw: ${text.slice(0, 200)}...`);
      return { found: false, html: "", css: "", js: "" };
    }
  } catch (err) {
    sendLog(`❌ AI Filter failed for ${siteUrl} | Error: ${err.message}`);
    return { found: false, html: "", css: "", js: "" };
  }
}

// === Asset downloader ===
async function downloadFile(fileUrl, siteDir, baseUrl, sendLog) {
  try {
    const u = new URL(fileUrl, baseUrl);
    if (!u.href.startsWith(baseUrl)) {
      sendLog(`⏩ Skipped external asset: ${u.href}`);
      return null;
    }

    const folder = "assets";
    const fileName = path.basename(u.pathname.split("?")[0]);
    const outPath = path.join(siteDir, folder, fileName);

    await fs.ensureDir(path.dirname(outPath));
    const response = await axios.get(u.href, { responseType: "arraybuffer" });
    await fs.writeFile(outPath, response.data);

    sendLog(`📥 Saved asset: ${u.href} → ${outPath}`);
    return `./${folder}/${fileName}`;
  } catch (err) {
    sendLog(`❌ Failed to download ${fileUrl} | ${err.message}`);
    return null;
  }
}

// === Auto scroll ===
async function autoScroll(page, sendLog) {
  sendLog("🔄 Auto-scrolling page for lazy-loaded content...");
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
  sendLog("✅ Auto-scroll completed");
}

// === Main Class ===
export default class MultiSiteExtractor {
  constructor(urls, userSite, userQuery, OUTPUT_DIR, sendLog) {
    this.urls = urls;
    this.userSite = userSite;
    this.userQuery = userQuery;
    this.OUTPUT_DIR = path.resolve(process.cwd(), OUTPUT_DIR);
    this.sendLog = sendLog;
  }

  async scrapeSite(url) {
    this.sendLog(`🌐 Starting scrape: ${url}`);
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      this.sendLog(`✅ Loaded page: ${url}`);

      const html = await page.evaluate(() => document.body.outerHTML);
      const css = await page.evaluate(() => {
        let styles = "";
        for (const sheet of document.styleSheets) {
          try {
            if (sheet.cssRules) {
              for (const rule of sheet.cssRules) styles += rule.cssText;
            }
          } catch {}
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

      this.sendLog(`✅ Scraped ${url} | HTML: ${html.length}, CSS: ${css.length}, JS: ${js.length}`);
      return { html, css, js };
    } catch (err) {
      this.sendLog(`❌ Scrape failed for ${url} | ${err.message}`);
      return { html: "", css: "", js: "" };
    } finally {
      await browser.close();
    }
  }

  async scrapeAndSaveAssets(url) {
    this.sendLog(`🌐 Scraping user site (React/Next.js aware): ${url}`);
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
      this.sendLog("✅ User site loaded");

      await autoScroll(page, this.sendLog);
      let html = await page.evaluate(() => document.documentElement.outerHTML);
      const siteOrigin = new URL(url).origin;

      const assets = await page.evaluate(() => {
        const out = { images: [], css: [], js: [] };
        document.querySelectorAll("img[src]").forEach((img) => out.images.push(img.src));
        document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => out.css.push(link.href));
        document.querySelectorAll("script[src]").forEach((js) => out.js.push(js.src));
        return out;
      });
      this.sendLog(`📦 Assets found | Images: ${assets.images.length}, CSS: ${assets.css.length}, JS: ${assets.js.length}`);

      await browser.close();

      const siteDir = this.OUTPUT_DIR;
      await fs.ensureDir(path.join(siteDir, "assets"));

      for (const imgUrl of assets.images) {
        const newPath = await downloadFile(imgUrl, siteDir, siteOrigin, this.sendLog);
        if (newPath) html = html.replace(new RegExp(imgUrl, "g"), newPath);
      }
      for (const cssUrl of assets.css) {
        const newPath = await downloadFile(cssUrl, siteDir, siteOrigin, this.sendLog);
        if (newPath) html = html.replace(new RegExp(cssUrl, "g"), newPath);
      }
      for (const jsUrl of assets.js) {
        const newPath = await downloadFile(jsUrl, siteDir, siteOrigin, this.sendLog);
        if (newPath) html = html.replace(new RegExp(jsUrl, "g"), newPath);
      }

      this.sendLog("✅ Assets replaced in HTML");
      return { html, css: "", js: "" };
    } catch (err) {
      this.sendLog(`❌ User site scrape failed | ${err.message}`);
      return { html: "", css: "", js: "" };
    }
  }

  chunkHTML(html, chunkSize = 5000) {
    this.sendLog(`✂️ Splitting HTML into chunks of ${chunkSize} chars`);
    const chunks = [];
    for (let i = 0; i < html.length; i += chunkSize) {
      chunks.push(html.slice(i, i + chunkSize));
    }
    this.sendLog(`✅ Total chunks created: ${chunks.length}`);
    return chunks;
  }

  async filterSite(url) {
    this.sendLog(`🔎 Starting filter for inspiration site: ${url}`);
    const { html } = await this.scrapeSite(url);
    const chunks = this.chunkHTML(html);

    let siteHtml = "";
    let siteCss = "";
    let siteJs = "";

    for (const [i, chunk] of chunks.entries()) {
      this.sendLog(`📝 Processing chunk ${i + 1}/${chunks.length} for ${url}`);
      const filtered = await filterAIWorker(chunk, this.userQuery, url, this.sendLog);
      if (filtered) {
        siteHtml += filtered.html || "";
        siteCss += filtered.css || "";
        siteJs += filtered.js || "";

        if (filtered.found) {
          this.sendLog(`✅ Relevant content found early in ${url}`);
          break;
        }
      }
    }

    if (!siteHtml) {
      this.sendLog(`⚠️ No relevant content found in ${url}`);
      return null;
    }

    return { html: siteHtml, css: siteCss, js: siteJs };
  }

  async combineSitesThenEnhance() {
    this.sendLog("🚀 Starting site combination + AI enhancement");
    await fs.ensureDir(this.OUTPUT_DIR);
    this.sendLog("📁 Output directory ready");

    const combinedInspiration = { html: "", css: "", js: "" };

    for (const url of this.urls) {
      this.sendLog(`➡️ Filtering inspiration site: ${url}`);
      const filtered = await this.filterSite(url);
      if (filtered) {
        combinedInspiration.html += filtered.html;
        combinedInspiration.css += filtered.css;
        combinedInspiration.js += filtered.js;
        this.sendLog(`✅ Added inspiration from ${url}`);
      }
    }

    let userSiteContent = { html: "", css: "", js: "" };
    try {
      userSiteContent = await this.scrapeAndSaveAssets(this.userSite);
      this.sendLog("✅ User site scraped successfully");
    } catch (err) {
      this.sendLog("❌ User site scrape failed: " + err.message);
    }

    this.sendLog("🤖 Enhancing final result with AI worker...");
    const finalResult = await frontendWorker(
      this.userQuery,
      userSiteContent,
      combinedInspiration.html,
      combinedInspiration.css,
      combinedInspiration.js,
      this.sendLog
    );

    await fs.writeFile(path.join(this.OUTPUT_DIR, "index.html"), finalResult.html, "utf-8");
    await fs.writeFile(path.join(this.OUTPUT_DIR, "styles.css"), finalResult.css, "utf-8");
    await fs.writeFile(path.join(this.OUTPUT_DIR, "script.js"), finalResult.js, "utf-8");

    this.sendLog(`✅ All files saved in ${this.OUTPUT_DIR}`);
    return { outputDir: this.OUTPUT_DIR };
  }
}
