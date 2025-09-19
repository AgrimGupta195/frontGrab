import express from "express";
import archiver from "archiver";
import fs from "fs-extra";
import path from "path";
import os from "os";
import processWebsiteClone from "./cloneFrontend.js"; // your script
import { correctUrl } from "./agents/urlCorrector.js";
import dotenv from "dotenv";
import cors from "cors";
import processEnhancedWebsite from "./siteEnhaced.js";

import { WebSocketServer } from "ws";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors({ origin: "*" }));
const server=app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
server.setTimeout(480000);
// After you create your server
const wss = new WebSocketServer({ server });
let clients = [];

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
  });
});

// Helper function to send logs to all clients
export function sendLogToClients(message) {
  clients.forEach(ws => ws.send(message));
}




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
  sendLogToClients("✅ Corrected URL: " + fixUrl);
  console.log("✅ Corrected URL:", fixUrl);

  // Create unique temp directory
  const tempDir = path.join(os.tmpdir(), `clone-${Date.now()}`);

  try {
    sendLogToClients("▶️ Cloning site: " + fixUrl);
    console.log("▶️ Cloning site:", fixUrl);
    const result = await processWebsiteClone(fixUrl, { output: tempDir },sendLogToClients);

    if (!result.success) {
      throw new Error(result.error || "Unknown cloning error.");
    }

    const projectName = path.basename(result.outputDir);
    sendLogToClients("✅ Clone finished at: " + result.outputDir);
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
app.post("/siteEnchanced", async (req, res) => {
  const { urls, query, userSite } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: "❌ Please provide a valid urls array" });
  }
  if (!query) {
    return res.status(400).json({ error: "❌ Please provide a valid query" });
  }
  if (!userSite) {
    return res.status(400).json({ error: "❌ Please provide a valid userSite URL" });
  }

  const fixedUrls = [];
  for (let i = 0; i < urls.length; i++) {
    const a = await correctUrl(urls[i]);
    fixedUrls.push(a);
  }

  const fixUserSite = await correctUrl(userSite);
  sendLogToClients("✅ Corrected URL: " + fixUserSite);
  console.log("✅ Corrected URL:", fixUserSite);
  

  const tempDir = path.join(os.tmpdir(), `clone-${Date.now()}`);
  try {
    const result = await processEnhancedWebsite(fixedUrls, fixUserSite, query, { output: tempDir },sendLogToClients);

    if (!result.success) {
      throw new Error(result.error || "Unknown cloning error.");
    }

    const projectName = path.basename(result.outputDir);
    console.log("📦 Zipping:", result.outputDir);

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



