import { useState, useRef, useEffect } from "react";
import { 
  Download, Globe, Search, Loader2, AlertCircle, CheckCircle, Copy, 
  Sparkles, Code2, Zap, Info, Terminal, Monitor, ArrowLeft, Plus, Trash2,
  Wand2, MousePointer, ArrowRight, X
} from "lucide-react";
import "./App.css";

// ##########################################################################
// ## Component Definitions (Moved Outside of App)
// ##########################################################################

// ## Home Page Component ##
const HomePage = ({ navigateTo, defaultWebsites, setKeyword, copyToClipboard }) => (
  <>
    <header className="header skinify-header">
      <div className="logo-section">
        <div className="logo-icon">
          <Code2 size={28} color="#fff" />
        </div>
        <h1 className="title">FrontGrab</h1>
      </div>
      <p className="subtitle">Transform your web development workflow</p>
    </header>

    {/* Feature Selection */}
    <section className="feature-selection">
      <h2 className="feature-title">Choose Your Development Mode</h2>
      <div className="feature-grid">
        <div 
          className="feature-card enhance-card"
          onClick={() => navigateTo('enhance')}
        >
          <div className="feature-icon">
            <Wand2 size={32} />
          </div>
          <div className="feature-content">
            <h3>Enhance Your Site</h3>
            <p>Upload your existing website and get AI-powered enhancements based on inspiration sites</p>
            <div className="feature-highlights">
              <span>• AI-Powered Analysis</span>
              <span>• Design Improvements</span>
              <span>• Feature Integration</span>
            </div>
          </div>
          <div className="feature-arrow">
            <ArrowRight size={20} />
          </div>
        </div>

        <div 
          className="feature-card clone-card"
          onClick={() => navigateTo('clone')}
        >
          <div className="feature-icon">
            <Globe size={32} />
          </div>
          <div className="feature-content">
            <h3>Clone Any Site</h3>
            <p>Instantly clone any website's frontend code with all assets and styling preserved</p>
            <div className="feature-highlights">
              <span>• Complete Asset Download</span>
              <span>• Structure Preservation</span>
              <span>• Ready-to-Use Code</span>
            </div>
          </div>
          <div className="feature-arrow">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="how-it-works">
      <div className="how-it-works-header">
        <Sparkles size={18} />
        <span>How It Works</span>
      </div>
      <div className="steps-grid">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <div className="step-title">Choose Your Mode</div>
            <div className="step-description">Select between cloning existing sites or enhancing your current website with AI-powered improvements</div>
          </div>
        </div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <div className="step-title">Enter Details</div>
            <div className="step-description">Provide the website URL or enhancement requirements. Our system will analyze and process your request</div>
          </div>
        </div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <div className="step-title">Download Results</div>
            <div className="step-description">Get your cloned website or enhanced version as a ready-to-use ZIP file with all assets included</div>
          </div>
        </div>
      </div>
    </section>

    {/* Popular Sites */}
    <section className="examples-section">
      <h3 className="examples-title">Try These Popular Sites</h3>
      <div className="examples-grid">
        {defaultWebsites.map((site) => (
          <div key={site} className="example-card" onClick={() => {
            setKeyword(site);
            navigateTo('clone');
          }}>
            <span className="site-name">{site}</span>
            <button 
              className="copy-btn"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(site);
              }}
            >
              <Copy size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>

    <div className="note">
      <Info size={16} />
      <span>Works best with static websites. Some dynamic sites may have limitations.</span>
    </div>
  </>
);

// ## Clone Page Component ##
const ClonePage = ({ 
  navigateTo, keywordInputRef, keyword, setKeyword, handleKeyPress, loading, 
  handleScrape, error, success, downloadData, handleDownload, defaultWebsites, 
  copyToClipboard ,showLogWindow
}) => (
  <>
    <div className="page-header">
      <button className="back-btn" onClick={() => navigateTo('home')}>
        <ArrowLeft size={16} />
        Back to Home
      </button>
      <div className="page-title-section">
        <Globe size={24} />
        <h2>Clone Website</h2>
      </div>
    </div>

    <div className="input-section">
      <div className="input-group">
        <div className="input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            ref={keywordInputRef}
            type="text"
            className="keyword-input"
            placeholder="Enter website URL (e.g., google.com or https://example.com)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <button
          className={`scrape-btn ${loading ? "loading" : ""}`}
          onClick={handleScrape}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="spin" />
              Cloning...
            </>
          ) : (
            <>
              <Globe size={20} />
              Clone Website
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
            Cloning website and preparing ZIP file... Please wait...
          </p>
        </div>
      )}

      {error && <div className="message error-message"><AlertCircle size={16}/> {error}</div>}
      {success && <div className="message success-message"><CheckCircle size={16}/> {success}</div>}

      {downloadData && (
        <div className="download-section">
          <div className="download-card">
            <div className="download-info">
              <h4>Ready to Download</h4>
              <p><strong>File:</strong> {downloadData.filename}</p>
              <p><strong>Size:</strong> {downloadData.size} KB</p>
            </div>
            <button 
              onClick={() => handleDownload(downloadData)}
              className="download-btn"
            >
              <Download size={20} />
              Download ZIP
            </button>
          </div>
        </div>
      )}
    </div>
    {showLogWindow && (
      <div className="log-overlay">
        <div className="log-window">
          <div className="log-header">
            <div className="log-title">
              <Terminal size={18} />
              <span>Live Server Logs</span>
            </div>
            <button className="log-close" onClick={closeLogWindow}>
              <X size={16} />
            </button>
          </div>
          <div className="log-content">
            {serverLogs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <span className="log-timestamp">
                  {log.timestamp.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <section className="examples-section">
      <h3 className="examples-title">Popular Examples</h3>
      <div className="examples-grid">
        {defaultWebsites.map((site) => (
          <div key={site} className="example-card" onClick={() => setKeyword(site)}>
            <span className="site-name">{site}</span>
            <button 
              className="copy-btn"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(site);
              }}
            >
              <Copy size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  </>
);

// ## Enhance Page Component ##
const EnhancePage = ({
  navigateTo, userSiteInputRef, userSite, setUserSite, inspirationSites,
  updateInspirationSite, removeInspirationSite, addInspirationSite,
  enhancementQueryRef, enhancementQuery, setEnhancementQuery,
  handleEnhancedSite, enhancedLoading, enhancedError, enhancedSuccess,
  enhancedDownloadData, handleDownload, showLogWindow, closeLogWindow, serverLogs
}) => (
  <>
    <div className="page-header">
      <button className="back-btn" onClick={() => navigateTo('home')}>
        <ArrowLeft size={16} />
        Back to Home
      </button>
      <div className="page-title-section">
        <Wand2 size={24} />
        <h2>Enhance Your Website</h2>
      </div>
    </div>

    <div className="enhancement-form">
      <div className="form-group">
        <label>Your Website URL</label>
        <input
          ref={userSiteInputRef}
          type="text"
          placeholder="https://yourwebsite.com"
          value={userSite}
          onChange={(e) => setUserSite(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Inspiration Websites</label>
        <div className="inspiration-sites">
          {inspirationSites.map((site, index) => (
            <div key={index} className="inspiration-input-group">
              <input
                type="text"
                placeholder={`https://inspiration${index + 1}.com`}
                value={site}
                onChange={(e) => updateInspirationSite(index, e.target.value)}
                className="form-input"
              />
              {inspirationSites.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInspirationSite(index)}
                  className="remove-btn"
                  disabled={enhancedLoading}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addInspirationSite}
            className="add-btn"
            disabled={enhancedLoading}
          >
            <Plus size={16} />
            Add Another Site
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Enhancement Query</label>
        <textarea
          ref={enhancementQueryRef}
          placeholder="Describe what you want to enhance or improve in your website. For example: 'Make it more modern with better animations and improved mobile responsiveness' or 'Add dark mode toggle and improve the navigation menu'"
          value={enhancementQuery}
          onChange={(e) => setEnhancementQuery(e.target.value)}
          className="form-textarea"
          rows="4"
        />
      </div>

      <button
        onClick={handleEnhancedSite}
        className={`enhance-btn ${enhancedLoading ? "loading" : ""}`}
        disabled={enhancedLoading}
      >
        {enhancedLoading ? (
          <>
            <Loader2 size={20} className="spin" />
            Enhancing...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Enhance Website
          </>
        )}
      </button>

      {enhancedError && <div className="message error-message"><AlertCircle size={16}/> {enhancedError}</div>}
      {enhancedSuccess && <div className="message success-message"><CheckCircle size={16}/> {enhancedSuccess}</div>}

      {enhancedDownloadData && (
        <div className="download-section">
          <div className="download-card enhanced-download">
            <div className="download-info">
              <h4>Enhancement Complete!</h4>
              <p><strong>File:</strong> {enhancedDownloadData.filename}</p>
              <p><strong>Size:</strong> {enhancedDownloadData.size} KB</p>
            </div>
            <button 
              onClick={() => handleDownload(enhancedDownloadData)}
              className="download-btn enhanced-download-btn"
            >
              <Download size={20} />
              Download Enhanced Site
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Live Log Window */}
    {showLogWindow && (
      <div className="log-overlay">
        <div className="log-window">
          <div className="log-header">
            <div className="log-title">
              <Terminal size={18} />
              <span>Live Server Logs</span>
            </div>
            <button className="log-close" onClick={closeLogWindow}>
              <X size={16} />
            </button>
          </div>
          <div className="log-content">
            {serverLogs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <span className="log-timestamp">
                  {log.timestamp.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </>
);

// ##########################################################################
// ## Main App Component
// ##########################################################################
export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'clone', 'enhance'
  
  // Clone page states
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [downloadData, setDownloadData] = useState(null);
  
  // Enhanced page states
  const [userSite, setUserSite] = useState("");
  const [inspirationSites, setInspirationSites] = useState([""]);
  const [enhancementQuery, setEnhancementQuery] = useState("");
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState("");
  const [enhancedSuccess, setEnhancedSuccess] = useState("");
  const [enhancedDownloadData, setEnhancedDownloadData] = useState(null);
  
  // Live server log states
  const [showLogWindow, setShowLogWindow] = useState(false);
  const [serverLogs, setServerLogs] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);

  // Refs for input elements to maintain focus
  const keywordInputRef = useRef(null);
  const userSiteInputRef = useRef(null);
  const enhancementQueryRef = useRef(null);

  const BACKEND_URL = "https://frontgrab.onrender.com"; // Updated to match your backend port
  const WS_URL = "wss://frontgrab.onrender.com";

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
   useEffect(() => {
    if (showLogWindow && logContentRef.current) {
      const element = logContentRef.current;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [serverLogs, showLogWindow]);

  // WebSocket connection setup
  useEffect(() => {
    if (showLogWindow && !wsConnection) {
      try {
        const ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnection(ws);
        };
        
        ws.onmessage = (event) => {
          setServerLogs(prev => [...prev, { 
            timestamp: new Date(), 
            message: event.data, 
            type: "log" 
          }]);
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnection(null);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setServerLogs(prev => [...prev, { 
            timestamp: new Date(), 
            message: "Connection error occurred", 
            type: "error" 
          }]);
        };
        
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    }
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [showLogWindow, wsConnection, WS_URL]); // Added dependencies for correctness

  // Clone functionality - Updated to use real backend
  const handleScrape = async () => {
    if (!keyword.trim()) return setError("Please enter a keyword or URL!");

    setLoading(true);
    setError("");
    setSuccess("");
    setDownloadData(null);

    try {
      const timeoutDuration = 360000; // 6 minutes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      const apiUrl = `${BACKEND_URL}/clone?url=${encodeURIComponent(keyword.trim())}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/zip',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const sanitizedKeyword = keyword.trim().replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${sanitizedKeyword}_clone.zip`;

      setDownloadData({
        blob,
        filename,
        size: (blob.size / 1024).toFixed(2),
      });

      setSuccess(`Website cloned successfully! ZIP file is ready for download (${(blob.size / 1024).toFixed(2)} KB).`);

    } catch (err) {
      if (err.name === "AbortError") {
        setError(`Request timed out. The website might be too large or complex to clone.`);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced functionality - Updated to use real backend
  const handleEnhancedSite = async () => {
    if (!userSite.trim()) return setEnhancedError("Please enter your website URL!");
    if (!enhancementQuery.trim()) return setEnhancedError("Please describe what you want to enhance!");

    const validInspirationSites = inspirationSites.filter(site => site.trim());
    if (validInspirationSites.length === 0) return setEnhancedError("Please add at least one inspiration website!");

    setEnhancedLoading(true);
    setEnhancedError("");
    setEnhancedSuccess("");
    setEnhancedDownloadData(null);
    setServerLogs([]);
    setShowLogWindow(true);

    try {
      const requestBody = {
        urls: validInspirationSites,
        query: enhancementQuery.trim(),
        userSite: userSite.trim()
      };

      const response = await fetch(`${BACKEND_URL}/siteEnchanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/zip',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const sanitizedQuery = enhancementQuery
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const filename = `${sanitizedQuery}_enhanced.zip`;

      setEnhancedDownloadData({
        blob,
        filename,
        size: (blob.size / 1024).toFixed(2),
      });

      setEnhancedSuccess(`Website enhanced successfully! Enhanced version is ready for download (${(blob.size / 1024).toFixed(2)} KB).`);
      setServerLogs(prev => [...prev, { 
        timestamp: new Date(), 
        message: "✅ Enhancement completed successfully!", 
        type: "success" 
      }]);

    } catch (err) {
      setEnhancedError(`Error: ${err.message}`);
      setServerLogs(prev => [...prev, { 
        timestamp: new Date(), 
        message: `❌ Error: ${err.message}`, 
        type: "error" 
      }]);
    } finally {
      setEnhancedLoading(false);
    }
  };

  const closeLogWindow = () => {
    setShowLogWindow(false);
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
  };

  const handleDownload = (downloadDataObj) => {
    if (!downloadDataObj) return;

    const downloadUrl = window.URL.createObjectURL(downloadDataObj.blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadDataObj.filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      const notification = document.createElement("div");
      notification.textContent = `Copied: ${text}`;
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

  // Enhanced page helper functions
  const addInspirationSite = () => {
    setInspirationSites([...inspirationSites, ""]);
  };

  const updateInspirationSite = (index, value) => {
    const newSites = [...inspirationSites];
    newSites[index] = value;
    setInspirationSites(newSites);
  };

  const removeInspirationSite = (index) => {
    if (inspirationSites.length > 1) {
      const newSites = inspirationSites.filter((_, i) => i !== index);
      setInspirationSites(newSites);
    }
  };

  const resetCloneForm = () => {
    setKeyword("");
    setError("");
    setSuccess("");
    setDownloadData(null);
  };

  const resetEnhancedForm = () => {
    setUserSite("");
    setInspirationSites([""]);
    setEnhancementQuery("");
    setEnhancedError("");
    setEnhancedSuccess("");
    setEnhancedDownloadData(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleScrape();
    }
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    if (page === 'home') {
      resetCloneForm();
      resetEnhancedForm();
    }
  };

  return (
    <div className="app">
      <div className="bg-element bg-element-1"></div>
      <div className="bg-element bg-element-2"></div>
      <div className="bg-element bg-element-3"></div>

      <div className="container">
        {currentPage === 'home' && (
          <HomePage 
            navigateTo={navigateTo}
            defaultWebsites={defaultWebsites}
            setKeyword={setKeyword}
            copyToClipboard={copyToClipboard}
          />
        )}
        {currentPage === 'clone' && (
          <ClonePage 
            navigateTo={navigateTo}
            keywordInputRef={keywordInputRef}
            keyword={keyword}
            setKeyword={setKeyword}
            handleKeyPress={handleKeyPress}
            loading={loading}
            handleScrape={handleScrape}
            error={error}
            success={success}
            downloadData={downloadData}
            handleDownload={handleDownload}
            defaultWebsites={defaultWebsites}
            copyToClipboard={copyToClipboard}
          />
        )}
        {currentPage === 'enhance' && (
          <EnhancePage
            navigateTo={navigateTo}
            userSiteInputRef={userSiteInputRef}
            userSite={userSite}
            setUserSite={setUserSite}
            inspirationSites={inspirationSites}
            updateInspirationSite={updateInspirationSite}
            removeInspirationSite={removeInspirationSite}
            addInspirationSite={addInspirationSite}
            enhancementQueryRef={enhancementQueryRef}
            enhancementQuery={enhancementQuery}
            setEnhancementQuery={setEnhancementQuery}
            handleEnhancedSite={handleEnhancedSite}
            enhancedLoading={enhancedLoading}
            enhancedError={enhancedError}
            enhancedSuccess={enhancedSuccess}
            enhancedDownloadData={enhancedDownloadData}
            handleDownload={handleDownload}
            showLogWindow={showLogWindow}
            closeLogWindow={closeLogWindow}
            serverLogs={serverLogs}
          />
        )}
      </div>
    </div>
  );
}