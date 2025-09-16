import express from "express";
import archiver from "archiver";
import fs from "fs-extra";
import processWebsiteClone from "./cloneFrontend.js"; // your script

const app = express();
const PORT = 4000;

// Utility → zip a folder and stream back as response
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
  try {
    console.log("▶️ Cloning site:", url);
    const result = await processWebsiteClone(url, { output: "./output" });

    if (!result.success) {
      throw new Error(result.error || "Unknown cloning error.");
    }

    const projectName = result.outputDir.split("/").pop(); // last folder name
    console.log("📦 Zipping:", result.outputDir);

    await zipAndSend(res, result.outputDir, projectName);
  } catch (err) {
    console.error("❌ Clone failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
