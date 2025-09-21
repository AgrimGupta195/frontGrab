# 🕸️ Website Cloner & Enhancer  

This project lets you **clone websites**, **extract frontend content**, and even **enhance multi-site content using AI**.  
It has two parts:  
1. **Backend** – Node.js + Puppeteer + OpenAI + Express  
2. **Frontend** – React + Tailwind + WebSocket logging  

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

⚡ Do you also want me to add **badges (like Node.js, React, Puppeteer)** at the top of the README to make it look more professional on GitHub?







Ask ChatGPT
