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
  const [downloadData, setDownloadData] = useState(null); // Store ZIP data and filename

  // const BACKEND_URL = "http://localhost:8080";
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
    "geeksforgeeks.org"
  ];

  const handleScrape = async () => {
    if (!keyword.trim()) return setError("Please enter a keyword or URL!");
    
    setLoading(true);
    setError("");
    setSuccess("");
    setDownloadData(null); // Clear previous download data

    try {
      const timeoutDuration = 120000; // 2 minutes for large sites
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      const apiUrl = `${BACKEND_URL}/clone?url=${encodeURIComponent(keyword.trim())}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get the blob data (ZIP file)
      const blob = await response.blob();
      
      // Generate filename from keyword or use default
      const sanitizedKeyword = keyword.trim().replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${sanitizedKeyword}_clone.zip`;
      
      // Store the download data
      setDownloadData({
        blob,
        filename,
        size: (blob.size / 1024 / 1024).toFixed(2) // Size in MB
      });
      
      setSuccess(`✅ Website cloned successfully! ZIP file is ready for download (${(blob.size / 1024 / 1024).toFixed(2)} MB).`);

    } catch (err) {
      if (err.name === "AbortError") {
        setError(`⏱️ Request timed out. The website might be too large or complex to clone.`);
      } else {
        setError(`❌ ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadData) return;

    // Create download link
    const downloadUrl = window.URL.createObjectURL(downloadData.blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadData.filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleScrape();
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      const notification = document.createElement("div");
      notification.textContent = `✅ Copied: ${text}`;
      notification.className = "copy-notification";
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
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
              { num: 1, title: "Enter URL", desc: "Type website name or URL" },
              { num: 2, title: "Auto-process", desc: "FrontGrab clones the website" },
              { num: 3, title: "Download ZIP", desc: "Click download button to get ZIP file" }
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
            <strong>📝 Note:</strong> Website cloning works best with static websites. Some sites with heavy JavaScript or restricted access may not clone perfectly. The tool captures the complete website structure and assets.
          </p>
        </div>

        <section className="input-section">
          <div className="input-group">
            <div className="input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Enter website URL (e.g., google.com or https://example.com)"
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
                  <Globe size={20} /> Clone Website
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
                🚀 Cloning website and preparing ZIP file... Please wait, this may take a while for large sites...
              </p>
            </div>
          )}

          {error && <div className="message error-message"><AlertCircle size={16}/> {error}</div>}
          {success && <div className="message success-message"><CheckCircle size={16}/> {success}</div>}

          {/* Download Button Section */}
          {downloadData && (
            <div className="download-section">
              <div className="download-card">
                <div className="download-info">
                  <h4>📦 Ready to Download</h4>
                  <p><strong>File:</strong> {downloadData.filename}</p>
                  <p><strong>Size:</strong> {downloadData.size} MB</p>
                </div>
                <button 
                  onClick={handleDownload}
                  className="download-btn"
                >
                  <Download size={20} />
                  Download ZIP
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="examples-section">
          <h3 className="examples-title">🌟 Try these popular websites</h3>
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
                  title={`Copy ${site}`}
                >
                  <Copy size={14}/>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .download-section {
          margin-top: 20px;
        }

        .download-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .download-info h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .download-info p {
          margin: 4px 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .download-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .download-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .download-card {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}