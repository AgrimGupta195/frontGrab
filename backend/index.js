import express from "express";
import archiver from "archiver";
import fs from "fs-extra";
import path from "path";
import os from "os";
import processWebsiteClone from "./cloneFrontend.js"; // your script
import { correctUrl } from "./agents/urlCorrector.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors({ origin: "*" }));

// Helper → zip and stream a folder
async function zipAndSend(res, folderPath, zipName) {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename=${zipName}.zip`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(folderPath, false);

  await archive.finalize();
}

app.get("/clone", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "❌ Please provide a valid ?url=" });
  }

  let fixUrl;
  try {
    fixUrl = await correctUrl(url);
  } catch (err) {
    console.error("❌ URL correction failed:", err.message);
    return res.status(400).json({ error: "❌ Invalid URL provided." });
  }

  console.log("✅ Corrected URL:", fixUrl);

  // Create unique temp directory
  const tempDir = path.join(os.tmpdir(), `clone-${Date.now()}`);

  try {
    console.log("▶️ Cloning site:", fixUrl);
    const result = await processWebsiteClone(fixUrl, { output: tempDir });

    if (!result.success) {
      throw new Error(result.error || "Unknown cloning error.");
    }

    const projectName = path.basename(result.outputDir);
    console.log("📦 Zipping:", result.outputDir);

    // Cleanup after sending response
    res.on("finish", async () => {
      try {
        await fs.remove(result.outputDir);
        console.log("🧹 Cleaned up:", result.outputDir);
      } catch (cleanupErr) {
        console.error("⚠️ Cleanup failed:", cleanupErr.message);
      }
    });

    return await zipAndSend(res, result.outputDir, projectName);
  } catch (err) {
    console.error("❌ Clone failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
