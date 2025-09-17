# frontGrab 🚀

**frontGrab** is a full-stack web application that allows you to **clone any website's frontend**, extract its HTML, CSS, JS, and assets, and download it as a **ZIP file**. The cloned code is automatically **enhanced using Generative AI (GenAI)** to make it clean, structured, and maintainable.

---

## 🌟 Features

### Backend Features
- Extracts **HTML, CSS, JS**, images, videos, and other assets
- Automatically rewrites paths to make the site **self-contained**
- Handles **lazy-loaded content** with auto-scrolling
- **GenAI URL Correction** - Smart URL validation and formatting
- Enhances the cloned code using **GenAI** for cleaner, optimized frontend files
- Returns a **ZIP file** ready for download
- Simple **REST API** for frontend integration
- Error handling and timeout management

### Frontend Features
- **Modern React Interface** - Clean, responsive UI with Tailwind CSS
- **Real-time Progress Tracking** - Visual feedback during cloning process
- **Two-step Download Process** - Fetch first, then download with user control
- **File Size Information** - Shows ZIP file size before download
- **Popular Website Suggestions** - Quick access to common sites
- **Copy-to-clipboard** functionality for easy URL sharing
- **Mobile-responsive design** with glassmorphism effects
- **Error handling** with user-friendly messages

---

## 🛠️ Tech Stack

### Backend
- **Node.js & Express** – Backend server
- **Puppeteer** – Headless browser for scraping dynamic websites
- **Cheerio** – DOM parsing & rewriting asset paths
- **Archiver** – Generate ZIP files of cloned websites
- **Chalk** – Colored console logs
- **Generative AI (GenAI)** – Enhances and cleans HTML, CSS, JS files + URL correction

### Frontend
- **React 18** – Modern React with hooks
- **Lucide React** – Beautiful icon library
- **Responsive Design** – Mobile-first approach
- **CSS Animations** – Smooth transitions and hover effects


## 🧠 GenAI Enhancements

### Current GenAI Features
1. **Code Optimization** - Cleans and structures HTML, CSS, JS files
2. **Path Correction** - Ensures all asset paths are properly linked
3. **Code Formatting** - Beautifies code for better readability
4. **Url Correction** - Fix the Url

## 🎯 How It Works

### User Journey
1. **Enter URL** - Type website name or URL in the frontend
2. **Auto-process** - Backend clones the website using Puppeteer
3. **GenAI Enhancement** - AI optimizes and cleans the code
4. **Download ZIP** - Frontend shows download button with file info
5. **Go Live** - In VS Code, launch with Live Server on index.html


## 🔮 Future Enhancements

- [ ] **Real-time Preview** - Preview cloned sites before download
- [ ] **Multiple Format Export** - HTML, React, Vue component exports
- [ ] **Advanced GenAI** - More intelligent code restructuring
- [ ] **User Accounts** - Save and manage cloned projects
- [ ] **Collaborative Features** - Share cloned projects with teams
- [ ] **Template Gallery** - Showcase of cloned and enhanced websites

---

**Made with ❤️ by Agrim Gupta**

*Clone any frontend, enhance with AI, and bring it to life locally!*
