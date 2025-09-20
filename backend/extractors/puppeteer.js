import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs-extra";
import path from "path";
import { URL } from "url";
import chalk from "chalk";
import * as cheerio from "cheerio";

puppeteer.use(StealthPlugin());

export default class ContentExtractor {
  /**
   * Extracts and enhances frontend content of a website
   * @param {string} url - Website URL
   * @param {string} outputDir - Local folder to save files
   * @param {(msg: string) => void} sendLog - Optional logger function
   */
  static async extractFrontendContent(url, outputDir, sendLog ) {
    let browser = null;
    sendLog("🚀 Launching headless browser for site cloning...");
    console.log(chalk.blue("🚀 Launching headless browser for site cloning..."));

    try {
      await fs.ensureDir(outputDir);

      // ✅ Launch Puppeteer (local use only)
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        defaultViewport: { width: 1920, height: 1080 },
      });

      const page = await browser.newPage();

      // Set user-agent & headers to bypass bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
      );
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

      sendLog("🌍 Navigating to the website...");
      
      // Capture responses for assets
      const assetResponses = new Map();
      page.on("response", async (res) => {
        const reqUrl = res.url();
        if (res.status() >= 200 && res.status() < 400) {
          try {
            const buffer = await res.buffer();
            if (buffer.length > 0) assetResponses.set(reqUrl, { buffer });
          } catch {
            // Ignore transient errors
          }
        }
      });

      // Navigate and auto-scroll for lazy-loaded content
      await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
      await this.autoScroll(page, sendLog);

      let html = await page.content();
      const baseUrl = new URL(url);

      sendLog("💾 Saving assets locally...");
      
      // Save all assets locally
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
        } catch (e) {
          console.warn(
            chalk.yellow(`⚠️ Could not save asset: ${assetUrl.substring(0, 80)}...`)
          );
        }
      }

      sendLog("📝 Extracting HTML...");
      const $ = cheerio.load(html);

      // Remove dynamic scripts
      $('script[id="__NEXT_DATA__"]').remove();
      $('script[src*="_next/static/"]').remove();

      sendLog("🎨 Extracting CSS & JS...");
      // Extract inline CSS
      let cssContent = "";
      $("style").each((_, el) => {
        cssContent += $(el).html() + "\n";
        $(el).remove();
      });

      // Extract inline JS
      let jsContent = "";
      $("script").each((_, el) => {
        jsContent += $(el).html() + "\n";
        $(el).remove();
      });

      // Save raw extracted files
      await fs.writeFile(path.join(outputDir, "index.html"), $.html(), "utf-8");
      await fs.writeFile(path.join(outputDir, "style.css"), cssContent, "utf-8");
      await fs.writeFile(path.join(outputDir, "script.js"), jsContent, "utf-8");

      sendLog("✅ Site cloned successfully.");
      console.log(chalk.green("✅ Site cloned successfully."));
      return { outputDir };
    } catch (error) {
      console.error(chalk.red(`❌ Error during extraction: ${error.message}`));
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  static getRelativePath(assetUrl, baseUrl) {
    try {
      const fullAssetUrl = new URL(assetUrl, baseUrl.href);
      if (fullAssetUrl.hostname !== baseUrl.hostname) return assetUrl;
      return fullAssetUrl.pathname.startsWith("/")
        ? fullAssetUrl.pathname.substring(1)
        : fullAssetUrl.pathname;
    } catch {
      return assetUrl;
    }
  }

  static async autoScroll(page, sendLog ) {
    sendLog("📜 Auto-scrolling to load lazy content...");
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            setTimeout(resolve, 1000); // wait 1s for lazy loads
          }
        }, 100);
      });
    });
  }
}
