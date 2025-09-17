import { useState } from "react";
import { 
  Download, Globe, Search, Loader2, AlertCircle, CheckCircle, Copy, 
  Sparkles, Code2, Zap, Info, Terminal, Monitor
} from "lucide-react";
import "./App.css";

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // const BACKEND_URL = "http://localhost:4000";
  const BACKEND_URL = "https://frontgrab.onrender.com";

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
    setError("");
    setSuccess("");

    try {
      const timeoutDuration = 100000; // 100 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      const apiUrl = `${BACKEND_URL}/clone?url=${encodeURIComponent(keyword.trim())}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text(); // or response.json() depending on your API response
      setSuccess(`Website cloned successfully! The cloning process has been completed.`);

    } catch (err) {
      if (err.name === "AbortError") {
        setError(`Request timed out. The website might be too large or complex to clone.`);
      } else if (err.message.includes("HTTP error")) {
        setError("Server error occurred during cloning. The backend memory might be full. Please try again after 2 minutes.");
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
              { num: 2, title: "Auto-resolve", desc: "FrontGrab finds the correct URL" },
              { num: 3, title: "Clone & Process", desc: "Website gets cloned successfully" }
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
            <strong>Note:</strong> Website cloning works best with light JS websites. May not work for some sites with dynamic content or network access blocked sites. Clones the complete website structure for optimal results.
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
                  Cloning...
                </>
              ) : (
                <>
                  <Zap size={20} /> Clone Website
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
                Cloning in progress... This may take a while depending on website size and complexity...
              </p>
            </div>
          )}

          {error && <div className="message error-message"><AlertCircle size={16}/> {error}</div>}
          {success && <div className="message success-message"><CheckCircle size={16}/> {success}</div>}
        </section>

        <section className="examples-section">
          <h3 className="examples-title">Try these popular websites</h3>
          <div className="examples-grid">
            {defaultWebsites.map((site) => (
              <div 
                key={site} 
                className="example-card" 
                onClick={() => setKeyword(site)}
              >
                <span className="site-name">{site}</span>
                <button 
                  className="copy-btn" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    copyToClipboard(site); 
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