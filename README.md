# frontGrab 🚀

**frontGrab** is a Node.js-based tool that allows you to **clone a website’s frontend**, extract its HTML, CSS, JS, and assets, and download it as a **ZIP file**. The cloned code is automatically **enhanced using Generative AI (GenAI)** to make it clean, structured, and maintainable.

---

## Features

- Extracts **HTML, CSS, JS**, images, videos, and other assets.  
- Automatically rewrites paths to make the site **self-contained**.  
- Handles **lazy-loaded content** with auto-scrolling.  
- Enhances the cloned code using **GenAI** for cleaner, optimized frontend files.  
- Returns a **ZIP file** ready for download.  
- Simple **API endpoint** for integration with a frontend.  

---

## Tech Stack

- **Node.js & Express** – Backend server.  
- **Puppeteer** – Headless browser for scraping dynamic websites.  
- **Cheerio** – DOM parsing & rewriting asset paths.  
- **Archiver** – Generate ZIP files of cloned websites.  
- **Chalk** – Colored console logs.  
- **Generative AI (GenAI)** – Enhances and cleans HTML, CSS, and JS files.  
cd webcloner
npm install
