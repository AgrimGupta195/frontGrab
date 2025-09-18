import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import OpenAI from "openai"; // Example AI API
import { frontendWorker } from "../agents/aiworker.js";

puppeteer.use(StealthPlugin());



// === Inline AI Filter Agent ===
const openai = new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL:"https://generativelanguage.googleapis.com/v1beta/openai/" });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function filterAIWorker(chunk, userQuery, siteUrl) {
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
      temperature: 0
    });

    let text = response.choices[0].message.content;

    // Clean code fences or extra text
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let result = {};
    try {
      result = JSON.parse(text);
    } catch (err) {
      console.log(chalk.yellow(`⚠️ Failed to parse AI response for ${siteUrl}: ${err.message}. Using fallback.`));
      result = { found: false, html: "", css: "", js: "" };
    }

    return result;
  } catch (err) {
    console.log(chalk.red(`❌ AI Filter call failed for ${siteUrl}:`, err.message));
    return { found: false, html: "", css: "", js: "" };
  }
}


export default class MultiSiteExtractor {
  constructor(urls, userSite, userQuery,OUTPUT_DIR) {
    this.urls = urls;
    this.userSite = userSite;
    this.userQuery = userQuery;
     this.OUTPUT_DIR = path.resolve(process.cwd(), OUTPUT_DIR);
  }
  

  async scrapeSite(url) {
    console.log(chalk.blue("🌐 Scraping site:", url));
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

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
      document.querySelectorAll("script").forEach(s => {
        if (!s.src) scripts += s.innerHTML;
      });
      return scripts;
    });

    await browser.close();
    return { html, css, js };
  }

  chunkHTML(html, chunkSize = 5000) {
    const chunks = [];
    for (let i = 0; i < html.length; i += chunkSize) {
      chunks.push(html.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async filterAgent(chunk, siteUrl) {
    return await filterAIWorker(chunk, this.userQuery, siteUrl);
  }

  async filterSite(url) {
    const { html } = await this.scrapeSite(url);
    const chunks = this.chunkHTML(html);

    let siteHtml = "";
    let siteCss = "";
    let siteJs = "";

    for (const chunk of chunks) {
      const filtered = await this.filterAgent(chunk, url);
      if (filtered) {
        siteHtml += filtered.html || "";
        siteCss += filtered.css || "";
        siteJs += filtered.js || "";

        if (filtered.found) {
          console.log(chalk.green(`✅ Found Navbar + Hero in ${url}, stopping further chunks.`));
          break;
        }
      }
    }

    if (!siteHtml) {
      console.log(chalk.yellow(`⚠️ No relevant content found in ${url}`));
      return null;
    }

    return { html: siteHtml, css: siteCss, js: siteJs };
  }

   async combineSitesThenEnhance() {
    await fs.ensureDir(this.OUTPUT_DIR);
    console.log("📁 Ensured output directory exists.");

    const combinedInspiration = { html: "", css: "", js: "" };

    for (const url of this.urls) {
      const filtered = await this.filterSite(url);
      if (filtered) {
        combinedInspiration.html += filtered.html;
        combinedInspiration.css += filtered.css;
        combinedInspiration.js += filtered.js;
      }
    }

    let userSiteContent = { html: "", css: "", js: "" };
    try {
      userSiteContent = await this.scrapeSite(this.userSite);
      console.log(chalk.green("✅ User site scraped successfully"));
    } catch (err) {
      console.log(chalk.red("❌ Failed to scrape user site:", err.message));
    }

    const finalResult = await frontendWorker(
      this.userQuery,
      userSiteContent,
      combinedInspiration.html,
      combinedInspiration.css,
      combinedInspiration.js
    );

    // Write files
    await fs.writeFile(path.join(this.OUTPUT_DIR, "index.html"), finalResult.html, "utf-8");
    await fs.writeFile(path.join(this.OUTPUT_DIR, "style.css"), finalResult.css, "utf-8");
    await fs.writeFile(path.join(this.OUTPUT_DIR, "script.js"), finalResult.js, "utf-8");

    console.log(chalk.green(`✅ AI-enhanced combined files saved in ${this.OUTPUT_DIR}`));
    return { outputDir: this.OUTPUT_DIR };
  }
}