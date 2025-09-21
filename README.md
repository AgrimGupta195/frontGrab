# 🕸️ Website Cloner & Enhancer  

This project lets you **clone websites**, **extract frontend content**, and even **enhance multi-site content using AI**.  
It has two parts:  
1. **Backend** – Node.js + Puppeteer + OpenAI + Express  
2. **Frontend** – React + Tailwind + WebSocket logging  

---
📦 Packages Used
🔹 Backend

puppeteer-extra
 → Browser automation for scraping.

puppeteer-extra-plugin-stealth
 → Avoids bot detection while scraping.

@sparticuz/chromium
 → Chromium binary for serverless environments.

cheerio
 → jQuery-like HTML parser to manipulate DOM.

fs-extra
 → File system utilities (copy, remove, ensureDir).

path
 → Handle filesystem paths.

url
 → Parse and resolve URLs.

chalk
 → Colored console logs.

archiver
 → Zip project folders before download.

express
 → REST API backend server.

cors
 → Enable CORS for frontend ↔ backend communication.

dotenv
 → Manage environment variables (.env).

ws
 → WebSocket server for live logs.

os
 → Manage temp directories and OS info.

🔹 Frontend

react
 → UI framework.

react-dom
 → React rendering for DOM.

vite
 → Fast frontend build tool.
---
🚀 API Endpoints
1️⃣ Clone a Website
POST /clone

json
Copy code
{
  "url": "https://example.com"
}
👉 Returns a .zip with cloned assets.

2️⃣ Enhanced Multi-Site Clone
POST /siteEnchanced

json
Copy code
{
  "urls": ["https://site1.com", "https://site2.com"]
}
👉 Returns .zip with combined + AI-enhanced frontend.

📡 WebSocket Logs
Connect to:

arduino
Copy code
ws://localhost:3000
You’ll receive real-time scraping progress logs.

🛠️ Tech Stack
Backend: Node.js, Express, Puppeteer, Chromium, OpenAI, Cheerio, Archiver

Frontend: React, TailwindCSS, WebSockets

Other Tools: fs-extra, chalk, path

📌 Features
✅ Clone entire websites (HTML, CSS, JS, assets)
✅ Enhanced multi-site extraction with AI
✅ Real-time progress logs via WebSocket
✅ Auto-zipped results for download
✅ Serverless-friendly (temp dirs, cleanup after request)

---
