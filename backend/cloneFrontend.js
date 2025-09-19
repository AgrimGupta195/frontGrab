// processWebsiteClone.js
import ContentExtractor from "./agents/puppeteer.js";
import path from "path";
import chalk from "chalk";

function getProjectName(url) {
  return url
    .replace(/https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

export default async function processWebsiteClone(url, options = {},sendLog) {
  try {
    const projectName = getProjectName(url);
    const outputDir = path.join(options.output || "./output", projectName);
    sendLog("▶️ Starting direct download cloning process...");

    console.log(chalk.blue("▶️ Starting direct download cloning process..."));
    // ✅ call static method on class
    const result = await ContentExtractor.extractFrontendContent(url, outputDir,sendLog);

    if (!result || !result.outputDir) {
      throw new Error("No content retrieved from the website.");
    }
    sendLog("✅ Clone finished at: " + result.outputDir);

    console.log(chalk.green(`✅ Clone finished at: ${result.outputDir}`));

    return {
      success: true,
      outputDir: result.outputDir,
      projectName,
    };
  } catch (error) {
    console.error(chalk.red("❌ Website cloning failed:", error.message));
    return { success: false, error: error.message };
  }
}
