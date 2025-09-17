import { useState } from "react";
import { 
  Download, Globe, Search, Loader2, AlertCircle, CheckCircle, Copy, 
  Sparkles, Code2, Zap, Info, Terminal, Monitor
} from "lucide-react";
import "./App.css";

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [resolvedURL, setResolvedURL] = useState("");
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // const BACKEND_URL = "http://localhost:3001";
  const BACKEND_URL = "https://skinify-backend-ui4w.onrender.com";

  const defaultWebsites = [
    "hitesh.ai",
    "piyushgarg.dev", 
    "code.visualstudio.com",
    "tailwindcss.com",
    "nextjs.org",
    "en.wikipedia.org",
    "getbootstrap.com",
    "w3schools.com",
    "geeksforgeeks"
  ];

  const handleScrape = async () => {
    if (!keyword.trim()) return setError("Please enter a keyword or URL!");
    setLoading(true);
    setError(""); setSuccess(""); setResolvedURL(""); setFolderName("");

    try {
      const timeoutDuration = 100000; 
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      const apiUrl = `${BACKEND_URL}/api/resolve/1`;
      const requestBody = { keyword: keyword.trim(), isRecursive: false };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      if (!data.url) {
        setError("Could not resolve URL. Try another keyword or paste the URL.");
      } else {
        setResolvedURL(data.url);
        setFolderName(data.folder);
        setSuccess(`Website scraped successfully using website-scraper (Landing page only)`);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError(`Request timed out. Try again or check your connection.`);
      } else if (err.message.includes("HTTP error")) {
        setError("Server error occurred during scraping. The backend memory might be full. Please try again after 2 minutes.");
      } else {
        setError("Cannot connect to server. Please check if the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleScrape();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      const notification = document.createElement("div");
      notification.textContent = `Copied: ${text}`;
      notification.className = "copy-notification";
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="app">
      <div className="bg-element bg-element-1"></div>
      <div className="bg-element bg-element-2"></div>
      <div className="bg-element bg-element-3"></div>

      <div className="container">
        <header className="header skinify-header">
          <div className="logo-section">
            <div className="logo-icon">
              <Code2 size={28} color="#fff" />
            </div>
            <h1 className="title">FrontGrab</h1>
          </div>
          <p className="subtitle">Clone any frontend in seconds ✨</p>
        </header>

         <section className="how-it-works">
          <div className="how-it-works-header">
            <Sparkles size={20} />
            <span>How it works</span>
          </div>
          <div className="steps-grid">
            {[
              { num: 1, title: "Enter keyword", desc: "Type website name or URL" },
              { num: 2, title: "Auto-resolve", desc: "Skinify finds the correct URL" },
              { num: 3, title: "Download & Extract", desc: "Get ZIP and extract files" }
            ].map((step) => (
              <div key={step.num} className="step">
                <div className="step-number">{step.num}</div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="note">
          <p>
            <strong>Note:</strong> Website Scraper works best with light JS websites. May not work for some sites with dynamic content or network access blocked sites. Scrapes landing page only for optimal performance.
          </p>
        </div>

        <section className="input-section">
          <div className="input-group">
            <div className="input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Enter keyword or URL (e.g., google.com)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="keyword-input"
              />
            </div>
            <button
              onClick={handleScrape}
              className={`scrape-btn ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Zap size={20} /> Scrape Website
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="loading-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p className="loading-text">
                Downloading time depends on the file size and website complexity...
              </p>
            </div>
          )}

          {error && <div className="message error-message"><AlertCircle size={16}/> {error}</div>}
          {success && <div className="message success-message"><CheckCircle size={16}/> {success}</div>}

          {resolvedURL && folderName && (
            <div className="result-section">
              <div className="resolved-url">
                <Globe size={16} color="#8b5cf6" />
                <span className="url-label">Resolved URL:</span>
                <a href={resolvedURL} className="url-link" target="_blank" rel="noopener noreferrer">{resolvedURL}</a>
              </div>
              <button className="download-btn" onClick={() => window.open(`${BACKEND_URL}/download/${folderName}`, "_blank")}>
                <Download size={16}/> Download ZIP
              </button>
              
              <div className="instructions-section">
                <h4 className="instructions-title">🚀 How to Go Live:</h4>
                <div className="instructions-grid">
                  <div className="instruction-method">
                    <h5>Method 1: VS Code Live Server</h5>
                    <ol>
                      <li>Extract the ZIP file to a folder</li>
                      <li>Open VS Code → File → Open Folder</li>
                      <li>Select the extracted folder</li>
                      <li>Open <code>index.html</code>→Right Click</li>
                      <li>Select <strong>"Open with Live Server"</strong></li>
                    </ol>
                  </div>
                  <div className="instruction-method">
                    <h5>Method 2: Script Files</h5>
                    <ol>
                      <li>Extract the ZIP file to a folder</li>
                      <li>Open the extracted folder</li>
                      <li><strong>Windows:</strong> Double-click <code>open.bat</code></li>
                      <li><strong>Mac/Linux:</strong> Open terminal in folder</li>
                      <li><strong>Mac/Linux:</strong> Run <code>bash open.sh</code></li>
                    </ol>
                  </div>
                </div>
                <div className="instructions-note">
                  <p><strong>💡 Pro Tip:</strong> Both methods will automatically open your browser and serve the website locally with live reload capabilities!</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="examples-section">
          <h3 className="examples-title">Try these popular websites</h3>
          <div className="examples-grid">
            {defaultWebsites.map((site) => (
              <div 
                key={site} 
                className="example-card" 
                onClick={() => setKeyword(`https://${site}`)}
              >
                <span className="site-name">{site}</span>
                <button 
                  className="copy-btn" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    copyToClipboard(`https://${site}`); 
                  }}
                >
                  <Copy size={14}/>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}