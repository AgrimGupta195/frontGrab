import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";
import fs from "fs-extra";
import path from "path";
import { URL } from "url";
import chalk from "chalk";
import * as cheerio from "cheerio";

puppeteer.use(StealthPlugin());

export default class ContentExtractor {
  static async extractFrontendContent(url, outputDir, sendLog) {
    let browser = null;
    sendLog("🚀 Launching headless browser...");
    console.log(chalk.blue("🚀 Launching headless browser..."));

    try {
      await fs.ensureDir(outputDir);

      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        defaultViewport: { width: 1920, height: 1080 },
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
      );
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

      sendLog("✅ Headless browser launched");

      const assetResponses = new Map();
      page.on("response", async (res) => {
        const reqUrl = res.url();
        if (res.status() >= 200 && res.status() < 400) {
          try {
            const buffer = await res.buffer();
            if (buffer.length > 0) assetResponses.set(reqUrl, { buffer });
          } catch {}
        }
      });

      await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
      await this.autoScroll(page);

      let html = await page.content();
      const baseUrl = new URL(url);

      sendLog("✅ Site loaded");

      for (const [assetUrl, { buffer }] of assetResponses.entries()) {
        try {
          const urlObj = new URL(assetUrl);
          if (urlObj.hostname !== baseUrl.hostname) continue;
          if (urlObj.pathname === "/") continue;

          const assetPath = urlObj.pathname.startsWith("/")
            ? urlObj.pathname.substring(1)
            : urlObj.pathname;

          const localPath = path.join(outputDir, assetPath);
          await fs.ensureDir(path.dirname(localPath));
          await fs.writeFile(localPath, buffer);
          sendLog(`📥 Saved asset: ${assetUrl.substring(0, 80)}...`);
        } catch {
          console.warn(chalk.yellow(`⚠️ Could not save asset: ${assetUrl.substring(0, 80)}...`));
        }
      }

      sendLog("✅ Assets saved");

      const $ = cheerio.load(html);
      $('script[id="__NEXT_DATA__"]').remove();
      $('script[src*="_next/static/"]').remove();

      // =============================
      // CSS Extraction
      // =============================
      let cssContent = "";

      // Inline <style>
      $("style").each((_, el) => {
        cssContent += $(el).html() + "\n";
        $(el).remove();
      });

      // External CSS
      await Promise.all(
        $('link[rel="stylesheet"]').map(async (_, el) => {
          const href = $(el).attr("href");
          if (href) {
            try {
              const absUrl = new URL(href, baseUrl).href;
              const cssText = await (await page.goto(absUrl)).text();
              cssContent += `\n/* From ${href} */\n` + cssText + "\n";
            } catch {
              console.warn(chalk.yellow(`⚠️ Could not fetch CSS: ${href}`));
            }
          }
          $(el).remove();
        }).get()
      );

      // =============================
      // JS Extraction
      // =============================
      let jsContent = "";

      // Inline <script>
      $("script").each((_, el) => {
        if (!$(el).attr("src")) {
          jsContent += $(el).html() + "\n";
          $(el).remove();
        }
      });

      // External JS
      await Promise.all(
        $("script[src]").map(async (_, el) => {
          const src = $(el).attr("src");
          if (src) {
            try {
              const absUrl = new URL(src, baseUrl).href;
              const jsText = await (await page.goto(absUrl)).text();
              jsContent += `\n/* From ${src} */\n` + jsText + "\n";
            } catch {
              console.warn(chalk.yellow(`⚠️ Could not fetch JS: ${src}`));
            }
          }
          $(el).remove();
        }).get()
      );

      // =============================
      // Save files
      // =============================
      await fs.writeFile(path.join(outputDir, "style.css"), cssContent, "utf-8");
      await fs.writeFile(path.join(outputDir, "script.js"), jsContent, "utf-8");

      // Inject back into HTML
      $("head").append('<link rel="stylesheet" href="style.css">');
      $("body").append('<script src="script.js"></script>');

      await fs.writeFile(path.join(outputDir, "index.html"), $.html(), "utf-8");

      sendLog("✅ index.html, style.css, and script.js generated");
    } catch (err) {
      console.error(chalk.red("❌ Error during extraction:"), err);
      sendLog("❌ Error during extraction: " + err.message);
    } finally {
      if (browser) await browser.close();
    }
  }

  static async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  }
}
