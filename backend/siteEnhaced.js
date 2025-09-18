import MultiSiteExtractor from "./extractors/secondPuppeteer.js";
import path from "path";
import os from "os";
import chalk from "chalk";
import fs from "fs-extra";

function getProjectName(url) {
  return url
    .replace(/https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

export default async function processEnhancedWebsite(urls, siteUrl, query, options = {}) {
  if (!siteUrl) throw new Error("siteUrl is undefined");

  try {
    const projectName = getProjectName(siteUrl);
    const baseOutput = options.output || path.join(os.tmpdir(), "website-clones");
    await fs.ensureDir(baseOutput);

    const outputDir = path.join(baseOutput, `${projectName}-${Date.now()}`);
    await fs.ensureDir(outputDir);

    console.log(chalk.blue("📁 Output directory created at:"), outputDir);

    const extractor = new MultiSiteExtractor(urls, siteUrl, query, outputDir);
    const result = await extractor.combineSitesThenEnhance();

    if (!result || !result.outputDir) {
      throw new Error("No content retrieved from the website.");
    }

    console.log(chalk.green(`✅ Clone finished at: ${result.outputDir}`));
    return { success: true, outputDir: result.outputDir, projectName };
  } catch (error) {
    console.error(chalk.red("❌ Website cloning failed:", error.message));
    return { success: false, error: error.message };
  }
}
