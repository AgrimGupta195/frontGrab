import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import { URL } from "url";
import chalk from "chalk";
import * as cheerio from "cheerio";

export default class ContentExtractor {
  /**
   * Extracts and saves the frontend content of a given site
   * @param {string} url - Website URL to scrape
   * @param {string} outputDir - Local directory where content will be saved
   */
  static async extractFrontendContent(url, outputDir) {
    let browser = null;
    console.log(chalk.blue("🚀 Launching headless browser for site cloning..."));

    try {
      await fs.ensureDir(outputDir);

      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Capture responses for assets (css, js, images, etc.)
      const assetResponses = new Map();
      page.on("response", async (res) => {
        const reqUrl = res.url();
        if (res.status() >= 200 && res.status() < 400) {
          try {
            const buffer = await res.buffer();
            if (buffer.length > 0) {
              assetResponses.set(reqUrl, { buffer });
            }
          } catch {
            // ignore failed asset fetch
          }
        }
      });

      // Navigate to page and auto-scroll for lazy-loaded content
      await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
      await this.autoScroll(page);

      let html = await page.content();
      const baseUrl = new URL(url);

      // Save all captured assets
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

      // Load into Cheerio for rewriting paths
      const $ = cheerio.load(html);

      const selectors = [
        { selector: "link[href]", attr: "href" },
        { selector: "script[src]", attr: "src" },
        { selector: "img[src]", attr: "src" },
        { selector: "img[srcset]", attr: "srcset" },
        { selector: "source[src]", attr: "src" },
        { selector: "source[srcset]", attr: "srcset" },
        { selector: "video[src]", attr: "src" },
        { selector: "video[poster]", attr: "poster" },
      ];

      selectors.forEach(({ selector, attr }) => {
        $(selector).each((_, el) => {
          const element = $(el);
          const originalValue = element.attr(attr);
          if (!originalValue) return;

          if (attr === "srcset") {
            const newSrcset = originalValue
              .split(",")
              .map((part) => {
                const [url, descriptor] = part.trim().split(/\s+/);
                const newUrl = this.getRelativePath(url, baseUrl);
                return `${newUrl} ${descriptor || ""}`.trim();
              })
              .join(", ");
            element.attr(attr, newSrcset);
          } else {
            const newUrl = this.getRelativePath(originalValue, baseUrl);
            element.attr(attr, newUrl);
          }
        });
      });

      // Remove Next.js hydration data (if exists)
      $('script[id="__NEXT_DATA__"]').remove();
      $('script[src*="_next/static/"]').remove();

      // Save final HTML
      const finalHtml = $.html();
      const htmlPath = path.join(outputDir, "index.html");
      await fs.writeFile(htmlPath, finalHtml, "utf-8");

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

  static async autoScroll(page) {
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
            setTimeout(resolve, 1000); // wait an extra sec
          }
        }, 100);
      });
    });
  }
}
