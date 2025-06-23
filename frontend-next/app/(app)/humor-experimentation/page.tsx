// TODO: Integrate with backend API to generate humorous variants based on selected paragraph and comedian.
// Next steps: Wire up the experiment button to call the API, display loading state, and show generated variants.
// See utils/prompts.ts and /api/personalize-script for backend logic.
// Humor Experimentation Interface main page
// All UI uses a dark theme by default.
"use client";
import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import styles from './HumorExperimentation.module.css';
import { stripTimestamps } from "@/utils/textUtils";
import { createVideoRequestBody } from "@/utils/videoGenerator";

const DUMMY_SCRIPT = `This is the first paragraph of the script.
Here is the second paragraph, which is a bit longer and more interesting.
Finally, the third paragraph wraps things up with a punchline.`;

const DUMMY_COMEDIANS = [
  "Jerry Seinfeld",
  "Dave Chappelle",
  "John Mulaney",
  "Ali Wong",
  "Tina Fey"
];

// Add a longer list of comedians
const COMEDIAN_LIST = [
  "Jerry Seinfeld", "Dave Chappelle", "John Mulaney", "Ali Wong", "Tina Fey",
  "Bo Burnham", "Bill Burr", "Hannah Gadsby", "Kevin Hart", "Ricky Gervais",
  "Ellen DeGeneres", "Chris Rock", "Amy Schumer", "Hasan Minhaj", "Trevor Noah",
  "Jim Gaffigan", "Sarah Silverman", "Patton Oswalt", "Robin Williams", "Louis C.K.",
  "Joan Rivers", "George Carlin", "Richard Pryor", "Mindy Kaling", "Chelsea Handler",
  "Fireship", "Norm Macdonald", "Tig Notaro", "Demetri Martin", "Ronny Chieng", "Daniel Tosh",
];


// Utility to highlight <joke>...</joke> tags in text
function highlightJokeTags(text: string) {
  return text.replace(/<joke>([\s\S]*?)<\/joke>/gi, '<span class="joke-highlight">$1</span>');
}

export default function HumorExperimentationPage() {
  const [selectedParagraphIdx, setSelectedParagraphIdx] = useState<number | null>(null);
  const [selectedComedian, setSelectedComedian] = useState<{ [idx: number]: string; default: string }>({ default: "" });
  const [variants, setVariants] = useState<{ [idx: number]: string[] }>({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [errorIdx, setErrorIdx] = useState<{ [idx: number]: string | null }>({});
  const [savedScripts, setSavedScripts] = useState<any[]>([]);
  const [savedScriptsLoading, setSavedScriptsLoading] = useState(false);
  const [savedScriptsError, setSavedScriptsError] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<any | null>(null);
  // State for YouTube URL import
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeImportLoading, setYoutubeImportLoading] = useState(false);
  const [youtubeImportError, setYoutubeImportError] = useState<string | null>(null);
  // State for deleting a script
  const [deleteLoading, setDeleteLoading] = useState(false);
  // State for OpenAI conversion
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState('Fireship');
  const [rewriteLength, setRewriteLength] = useState(0);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  // State for Paste Transcript modal
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedTranscript, setPastedTranscript] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteName, setPasteName] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [paragraphsOverride, setParagraphsOverride] = useState<string[] | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // State for Latest News
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  type NewsItem = string | { headline: string; summary: string };
  const [newsHeadlines, setNewsHeadlines] = useState<NewsItem[]>([]);
  const [newsCached, setNewsCached] = useState(false);
  // Add state for checked news stories (indices)
  const [checkedNewsIndices, setCheckedNewsIndices] = useState<number[]>([0, 1, 2]);
  // Add state for video generation
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [videoGif, setVideoGif] = useState<string | null>(null);
  // State for each script's video generation status
  const [videoState, setVideoState] = useState<{ [key: string]: { generating: boolean; error: string | null; videoId: string | null; status: string; thumbnailUrl: string | null; videoUrl: string | null } }>({});
  // Add state and handler for Output Avatars button
  const [avatarsLoading, setAvatarsLoading] = useState(false);
  const [avatarsError, setAvatarsError] = useState<string | null>(null);
  const [voicesError, setVoicesError] = useState<string | null>(null);

  // Add style for joke highlighting
  // (This can be moved to a CSS file if desired)
  if (typeof window !== 'undefined') {
    const styleId = 'joke-highlight-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `.joke-highlight { background: #facc15; color: #23232a; font-weight: bold; border-radius: 4px; padding: 0 2px; }`;
      document.head.appendChild(style);
    }
  }

  // Fetch saved scripts on mount
  useEffect(() => {
    async function fetchScripts() {
      setSavedScriptsLoading(true);
      try {
        const response = await apiClient.get('/list-saved-scripts');
        const data = response.data;
        setSavedScripts(data.scripts || []);
        // Try to load last selected script from localStorage
        const lastId = typeof window !== 'undefined' ? localStorage.getItem('lastSelectedScriptId') : null;
        if (lastId && data.scripts) {
          const found = data.scripts.find((s: any) => s.id === lastId);
          if (found) {
            setSelectedScript(found);
          }
        }
      } catch (err: any) {
        // The interceptor will handle 401s. We only log other errors here.
        console.error("Error fetching scripts:", err); // Log the full error
        if (err.response?.status !== 401) {
          setSavedScriptsError("Failed to load saved scripts. See console for details.");
        }
      } finally {
        setSavedScriptsLoading(false);
      }
    }
    fetchScripts();
  }, []);

  // Save selected script id to localStorage whenever it changes
  useEffect(() => {
    if (selectedScript?.id && typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedScriptId', selectedScript.id);
    }
  }, [selectedScript?.id]);

  // Load last selected comedian from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastComedian = localStorage.getItem('lastSelectedComedian');
      if (lastComedian) {
        setSelectedComedian(c => ({ ...c, default: lastComedian }));
      }
    }
  }, []);

  // Use selectedScript for paragraphs if set, otherwise fallback to DUMMY_SCRIPT
  const scriptText = selectedScript?.rewritten || selectedScript?.original || DUMMY_SCRIPT;
  const paragraphs = paragraphsOverride || scriptText.split("\n").filter((p: string) => p.trim().length > 0);

  // When newsHeadlines changes, reset checked indices to top 3
  useEffect(() => {
    setCheckedNewsIndices([0, 1, 2]);
  }, [newsHeadlines]);

  // Handler for checking/unchecking news stories
  const handleNewsCheckbox = (idx: number) => {
    setCheckedNewsIndices((prev) => {
      if (prev.includes(idx)) {
        // Uncheck
        return prev.filter(i => i !== idx);
      } else if (prev.length < 3) {
        // Add new checked
        return [...prev, idx];
      } else {
        // Replace the oldest checked
        return [...prev.slice(1), idx];
      }
    });
  };

  // Helper to get checked news headlines (for prompt)
  const checkedNewsHeadlines = checkedNewsIndices
    .map(i => newsHeadlines[i])
    .filter(item => item && typeof item === 'object' && 'headline' in item && 'summary' in item)
    .map(item => `${(item as { headline: string; summary: string }).headline}: ${(item as { headline: string; summary: string }).summary}`);

  // Refactor handleExperiment to support multiple variants per paragraph
  const handleExperiment = async (idx: number) => {
    setLoadingIdx(idx);
    setErrorIdx(e => ({ ...e, [idx]: null }));
    try {
      const comedian = selectedComedian[idx] || "Fireship";
      // Request 4 variants in a single backend call
      const res = await apiClient.post("/generate-variants", {
        paragraph: paragraphs[idx],
        userStyle: comedian,
        newsNuggets: checkedNewsHeadlines
      });
      const data = res.data;
      // Split the response into variants by ---
      const variantsArr = (data.rewritten || "").split(/\n\s*-{3,}\s*\n/).map((s: string) => s.trim()).filter(Boolean);
      setVariants(v => ({ ...v, [idx]: variantsArr.length ? variantsArr : [data.rewritten || "No variant returned"] }));
    } catch (err: any) {
      if ((err as any).response?.status !== 401) {
        setErrorIdx(e => ({ ...e, [idx]: err.message || "Unknown error" }));
      }
    } finally {
      setLoadingIdx(null);
    }
  };

  // Save a variant as the new paragraph, persist, and clear experiments
  const handleSaveVariant = async (idx: number, variant: string) => {
    const newParagraphs = [...paragraphs];
    newParagraphs[idx] = variant;
    setParagraphsOverride(newParagraphs);
    setSelectedParagraphIdx(null);

    // Clear the variants for this paragraph from the UI
    setVariants(v => {
      const newV = { ...v };
      delete newV[idx];
      return newV;
    });

    // Save the full updated script
    if (selectedScript) {
      const updatedScript = {
        ...selectedScript,
        rewritten: newParagraphs.join('\n\n'),
      };
      try {
        await apiClient.post('/save-script', { script: updatedScript });
        setSelectedScript(updatedScript); // Update local state
      } catch (err) {
        console.error("Failed to save script after updating variant", err);
      }
    }
  };

  // Add a handler to deselect paragraph
  const handleDeselect = () => setSelectedParagraphIdx(null);

  // Handler for importing from YouTube
  const handleImportFromYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    setYoutubeImportLoading(true);
    setYoutubeImportError(null);
    setParagraphsOverride(null);
    try {
      const res = await apiClient.post('/extract-transcript', { youtubeUrl });
      const data = res.data;
      const newScript = {
        id: data.id,
        name: data.title || 'New YouTube Transcript',
        original: data.transcript,
        rewritten: '',
        url: youtubeUrl,
      };
      // Add to the top of the list and select it
      setSavedScripts(prev => [newScript, ...prev]);
      setSelectedScript(newScript);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setYoutubeImportError(err.response?.data?.error || "Failed to import transcript.");
      }
    } finally {
      setYoutubeImportLoading(false);
    }
  };

  // State for deleting a script
  const handleDeleteScript = async () => {
    if (!selectedScript?.id) return;
    setDeleteLoading(true);
    try {
      await apiClient.post('/delete-script', { id: selectedScript.id });
      setSavedScripts(prev => prev.filter(s => s.id !== selectedScript.id));
      setSelectedScript(null);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error("Failed to delete script", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // State for OpenAI conversion
  const handleConvertScript = () => {
    if (selectedScript) {
      const scriptText = selectedScript.rewritten || selectedScript.original || '';
      // Calculate word count by splitting on whitespace
      const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
      setRewriteLength(wordCount);
    }
    setShowRewriteModal(true);
  };

  const handleRewriteSubmit = async () => {
    if (!selectedScript) return;
    setRewriteLoading(true);
    setRewriteError(null);
    try {
      const res = await apiClient.post('/personalize-script', {
        script: selectedScript.original,
        userStyle: rewriteStyle,
        force: true,
        newsNuggets: [],
      });
      const data = res.data;
      const updatedScript = {
        ...selectedScript,
        rewritten: data.script,
        user_style: rewriteStyle,
      };
      // Update script in main list
      setSavedScripts(prev => prev.map(s => s.id === data.savedScriptId ? updatedScript : s));
      // Update selected script
      setSelectedScript(updatedScript);
      setShowRewriteModal(false);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setRewriteError(err.response?.data?.error || "Failed to rewrite script.");
      }
    } finally {
      setRewriteLoading(false);
    }
  };

  // Handler for saving pasted transcript
  const handlePasteTranscriptSave = async () => {
    if (!pastedTranscript.trim()) {
      setPasteError("Transcript cannot be empty.");
      return;
    }
    if (!pasteName.trim()) {
      setPasteError("Name cannot be empty.");
      return;
    }
    setPasteLoading(true);
    setPasteError(null);

    // Regex to remove timestamps like 0:00 or 0:00:00 from the start of lines
    const cleanedTranscript = pastedTranscript.replace(/^\s*(\d{1,2}:)?\d{1,2}:\d{2}\.?\d*\s*/gm, '');

    const newScript = {
      id: `pasted-${Date.now()}`,
      name: pasteName || 'Pasted Transcript',
      original: cleanedTranscript,
      rewritten: '',
      url: pasteUrl || '',
    };
    try {
      const res = await apiClient.post('/save-script', { script: newScript });
      const savedScript = res.data.script;
      setSavedScripts(prev => [savedScript, ...prev]);
      setSelectedScript(savedScript);
      setShowPasteModal(false);
      setPastedTranscript("");
      setPasteName("");
      setPasteUrl("");
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setPasteError(err.response?.data?.error || "Failed to save transcript.");
      }
    } finally {
      setPasteLoading(false);
    }
  };

  // Remove paragraph and persist to backend
  const handleRemoveParagraph = async (idx: number) => {
    const newParagraphs = paragraphs.filter((_: string, i: number) => i !== idx);
    setParagraphsOverride(newParagraphs);
    setVariants(v => {
      const newV = { ...v };
      delete newV[idx];
      return newV;
    });

    if (selectedScript) {
      const updatedScript = {
        ...selectedScript,
        rewritten: newParagraphs.join('\n\n')
      };
      try {
        await apiClient.post('/save-script', { script: updatedScript });
        setSelectedScript(updatedScript);
      } catch (err) {
        console.error("Failed to save script after removing paragraph", err);
      }
    }
  };

  // Replace the news fetching useEffect and logic with the following:
  useEffect(() => {
    // On mount, check localStorage for cached news
    const cacheKey = 'latestNewsCache';
    const cache = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    let parsed: { news: NewsItem[]; timestamp: number } | null = null;
    if (cache) {
      try {
        parsed = JSON.parse(cache);
      } catch {}
    }
    const now = Date.now();
    // Use cache only if it's valid, not expired, AND contains stories
    if (parsed && Array.isArray(parsed.news) && parsed.news.length > 0 && parsed.timestamp && now - parsed.timestamp < 8 * 60 * 60 * 1000) {
      setNewsHeadlines(parsed.news);
      setNewsCached(true);
      setNewsLoading(false);
    } else {
      // Otherwise, fetch fresh news
      setNewsLoading(true);
      setNewsError(null);
      apiClient.get('/latest-news')
        .then(res => {
          const news = Array.isArray(res.data.headlines) ? res.data.headlines : [];
          setNewsHeadlines(news);
          setNewsCached(false);
          setNewsLoading(false);
          // Only cache the news if we actually got some stories
          if (typeof window !== 'undefined' && news.length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify({ news, timestamp: Date.now() }));
          } else if (typeof window !== 'undefined') {
            // If we got no stories, clear any old stale cache
            localStorage.removeItem(cacheKey);
          }
        })
        .catch(err => {
          setNewsError('Failed to load news stories.');
          setNewsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a handler to clear the localStorage cache and refetch
  const handleClearNewsCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('latestNewsCache');
      setNewsHeadlines([]);
      setNewsCached(false);
      setNewsLoading(true);
      setNewsError(null);
      apiClient.get('/latest-news')
        .then(res => {
          const news = Array.isArray(res.data.headlines) ? res.data.headlines : [];
          setNewsHeadlines(news);
          setNewsCached(false);
          setNewsLoading(false);
          // Only cache the news if we actually got some stories
          if (typeof window !== 'undefined' && news.length > 0) {
            localStorage.setItem('latestNewsCache', JSON.stringify({ news, timestamp: Date.now() }));
          }
        })
        .catch(err => {
          setNewsError('Failed to load news stories.');
          setNewsLoading(false);
        });
    }
  };

  // Handler for generating video from rewritten script
  const handleGenerateVideo = async (scriptId: string) => {
    const script = savedScripts.find(s => s.id === scriptId);
    if (!script || !script.rewritten) {
      alert("Script not found or no rewritten version available!");
      return;
    }

    setVideoState(prev => ({ ...prev, [scriptId]: { generating: true, error: null, videoId: null, status: 'processing', thumbnailUrl: null, videoUrl: null } }));

    try {
      const requestBody = createVideoRequestBody(script.rewritten);
      const response = await apiClient.post<{ videoId: string }>('/heygen-generate-video', requestBody);
      
      const videoId = response.data.videoId;
      setVideoState(prev => ({
        ...prev,
        [scriptId]: {
          ...prev[scriptId],
          videoId: videoId,
          status: 'processing', // still processing
        }
      }));
      // Start polling for video status
      pollVideoStatus(scriptId, videoId);
    } catch (error: any) {
      console.error('Error generating video:', error);
      const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred during video generation.";
      setVideoState(prev => ({
        ...prev,
        [scriptId]: {
          ...prev[scriptId],
          generating: false,
          error: errorMessage,
          status: 'failed',
        }
      }));
    }
  };

  const pollVideoStatus = async (scriptId: string, videoId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await apiClient.post(`/heygen-video-status`, { videoId });
        const statusData = statusRes.data;
        if (statusData.status === 'completed') {
          console.log("Video generation complete. Received data:", statusData);
          clearInterval(pollInterval);
          // Persist the final video URL to the database
          const updatedScript = { ...savedScripts.find(s => s.id === scriptId), video_url: statusData.video_url };
          await apiClient.post('/save-script', { script: updatedScript });

          // Update local state
          setVideoState(prev => ({
            ...prev,
            [scriptId]: {
              ...prev[scriptId],
              generating: false,
              status: 'completed',
              thumbnailUrl: statusData.thumbnail_url,
              videoUrl: statusData.video_url,
            }
          }));
          // Update the main script list
          setSavedScripts(prev => prev.map(s => s.id === scriptId ? updatedScript : s));
          setSelectedScript(updatedScript); // also update the selected one

        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          setVideoState(prev => ({
            ...prev,
            [scriptId]: {
              ...prev[scriptId],
              generating: false,
              status: 'failed',
              error: 'Video generation failed on the server.',
            }
          }));
        }
        // if still processing, do nothing and let it poll again
      } catch (pollErr) {
        console.error("Error polling video status:", pollErr);
        // Don't stop polling on error, maybe the server is just temporarily down
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleDeleteVideo = async (scriptId: string) => {
    if (!selectedScript) return;

    // Optimistically update UI
    const originalScript = { ...selectedScript };
    const updatedScript = { ...selectedScript, video_url: null };
    
    setSavedScripts(prev => prev.map(s => s.id === scriptId ? updatedScript : s));
    setSelectedScript(updatedScript);
    setVideoState(prev => {
        const newState = { ...prev };
        delete newState[scriptId];
        return newState;
    });

    try {
      // Call the existing save endpoint with the cleared video_url
      await apiClient.post('/save-script', { script: updatedScript });
    } catch (error) {
      console.error('Failed to delete video on server:', error);
      // Revert UI on error
      setSavedScripts(prev => prev.map(s => s.id === scriptId ? originalScript : s));
      setSelectedScript(originalScript);
      // You might want to add back the video state here if needed
      alert('Failed to delete the video. Please try again.');
    }
  };

  const handleOutputAssets = async () => {
    setAvatarsLoading(true);
    setAvatarsError(null);
    setVoicesError(null);
    try {
      const [avatarsRes, voicesRes] = await Promise.all([
        apiClient.get('/heygen-list-avatars'),
        apiClient.get('/heygen-list-voices')
      ]);
      
      console.log("Available Avatars:", avatarsRes.data.avatars);
      console.log('Available Voices:', voicesRes.data.voices);

    } catch (err: any) {
      console.error("Failed to fetch assets:", err);
      if ((err as any).response?.status !== 401) {
        setAvatarsError("Failed to fetch avatars or voices.");
      }
    } finally {
      setAvatarsLoading(false);
    }
  };

  return (
    <>
      {/* Paste Transcript Button and Modal */}
      <div className={styles.controlsContainer}>
        <button
          onClick={() => setShowPasteModal(true)}
          className={`${styles.actionButton} ${styles.pasteButton}`}
          title="Paste a new transcript manually to create a new script."
        >
          Paste Transcript
        </button>
        <button
          onClick={() => handleGenerateVideo(selectedScript?.id || "")}
          disabled={
            !selectedScript ||
            !selectedScript.rewritten ||
            videoState[selectedScript?.id]?.generating ||
            !!videoState[selectedScript?.id]?.videoUrl ||
            !!selectedScript.video_url
          }
          className={`${styles.actionButton} ${styles.generateVideoButton}`}
          style={{
            cursor: !selectedScript || !selectedScript.rewritten || videoState[selectedScript?.id]?.generating || !!videoState[selectedScript?.id]?.videoUrl || !!selectedScript.video_url ? "not-allowed" : "pointer",
            opacity: !selectedScript || !selectedScript.rewritten || videoState[selectedScript?.id]?.generating || !!videoState[selectedScript?.id]?.videoUrl || !!selectedScript.video_url ? 0.7 : 1,
          }}
          title="Generate a video from the selected script."
        >
          {videoState[selectedScript?.id]?.generating ? 'Generating...' : 'Generate Video'}
        </button>
        {/* Output Avatars Button */}
        <button
          onClick={handleOutputAssets}
          disabled={avatarsLoading}
          className={`${styles.actionButton} ${styles.outputAvatarsButton}`}
          style={{
            background: avatarsLoading ? "#333" : "#2563eb",
            cursor: avatarsLoading ? "not-allowed" : "pointer",
            opacity: avatarsLoading ? 0.7 : 1,
          }}
          title="Fetch and output Heygen avatars and voices to the console."
        >
          {avatarsLoading ? "Loading Assets..." : "Output Avatars & Voices"}
        </button>
        {avatarsError && (
          <span className={styles.errorSpan}>{avatarsError}</span>
        )}
      </div>
      {showPasteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Paste Transcript</h2>
            <input
              type="text"
              value={pasteName}
              onChange={e => setPasteName(e.target.value)}
              placeholder="Enter script name..."
              className={styles.modalInput}
              disabled={pasteLoading}
            />
            <input
              type="text"
              value={pasteUrl}
              onChange={e => setPasteUrl(e.target.value)}
              placeholder="Enter source URL (optional)"
              className={styles.modalInput}
              disabled={pasteLoading}
            />
            <textarea
              value={pastedTranscript}
              onChange={e => setPastedTranscript(e.target.value)}
              rows={10}
              className={styles.modalTextarea}
              placeholder="Paste your transcript here..."
              disabled={pasteLoading}
            />
            {pasteError && <div className={styles.modalError}>{pasteError}</div>}
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPastedTranscript("");
                  setPasteError(null);
                  setPasteName("");
                  setPasteUrl("");
                }}
                className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                style={{
                  cursor: pasteLoading ? "not-allowed" : "pointer",
                  opacity: pasteLoading ? 0.7 : 1
                }}
                disabled={pasteLoading}
                title="Cancel and close the paste transcript modal."
              >
                Cancel
              </button>
              <button
                onClick={handlePasteTranscriptSave}
                className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
                style={{
                  background: pasteLoading ? "#333" : "#2563eb",
                  cursor: pasteLoading ? "not-allowed" : "pointer",
                  opacity: pasteLoading ? 0.7 : 1
                }}
                disabled={pasteLoading}
                title="Save the pasted transcript as a new script."
              >
                {pasteLoading ? "Saving..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Saved Script Loader UI (above main container) */}
      <div className={styles.scriptLoaderContainer}>
        <label className={styles.scriptLoaderLabel}>Load Saved Script:</label>
        {savedScriptsLoading ? (
          <span className={styles.scriptLoaderStatus}>Loading...</span>
        ) : savedScriptsError ? (
          <span className={styles.errorSpan}>{savedScriptsError}</span>
        ) : (
          <select
            value={selectedScript?.id || ""}
            onChange={e => {
              const found = savedScripts.find(s => s.id === e.target.value);
              setSelectedScript(found || null);
              setSelectedParagraphIdx(null);
              setVariants({});
              setErrorIdx({});
              // Save to localStorage
              if (found && typeof window !== 'undefined') {
                localStorage.setItem('lastSelectedScriptId', found.id);
              }
            }}
            className={styles.scriptLoaderSelect}
          >
            <option value="">-- Select a saved script --</option>
            {savedScripts.map(s => (
              <option key={s.id} value={s.id}>
                {s.name ? s.name : (s.original.length > 60 ? s.original.slice(0, 60) + "..." : s.original)}
              </option>
            ))}
          </select>
        )}
        {/* Delete button (garbage can icon) */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={!selectedScript || deleteLoading}
          title="Delete selected script"
          className={`${styles.iconButton} ${styles.deleteButton}`}
          style={{
            background: deleteLoading ? "#333" : "#23232a",
            color: deleteLoading ? "#888" : "#f87171",
            cursor: !selectedScript || deleteLoading ? "not-allowed" : "pointer",
            opacity: !selectedScript || deleteLoading ? 0.5 : 1,
          }}
        >
          🗑️
        </button>
        {/* Convert with OpenAI button */}
        <button
          onClick={handleConvertScript}
          disabled={!selectedScript || !!selectedScript.rewritten}
          title="Rewrite the selected script using OpenAI in a chosen style."
          className={`${styles.iconButton} ${styles.convertButton}`}
          style={{
            cursor: !selectedScript || !!selectedScript.rewritten ? "not-allowed" : "pointer",
            opacity: !selectedScript || !!selectedScript.rewritten ? 0.5 : 1,
          }}
        >
          ⚡
        </button>
        {/* Mad Scientist Debug Button */}
        <button
          onClick={() => console.log(selectedScript)}
          disabled={!selectedScript}
          title="Log the current script object to the console for inspection."
          className={`${styles.iconButton} ${styles.debugButton}`}
          style={{
            cursor: !selectedScript ? "not-allowed" : "pointer",
            opacity: !selectedScript ? 0.5 : 1,
          }}
        >
          🧑‍🔬
        </button>
        {/* Rewrite Modal */}
        {showRewriteModal && selectedScript && (
          <div className={styles.modalOverlay} style={{ zIndex: 1200 }}>
            <div className={`${styles.modalContent} ${styles.rewriteModalContent}`}>
              <h2 className={styles.modalTitle}>Rewrite Script</h2>
              <div className={styles.rewriteModalInputContainer}>
                <label className={styles.rewriteModalLabel}>
                  Length of new script (Current script is {selectedScript.original.split(/\s+/).filter(Boolean).length} words):
                </label>
                <input
                  type="number"
                  min={1}
                  value={rewriteLength}
                  onChange={e => setRewriteLength(Number(e.target.value))}
                  className={styles.modalInput}
                  title="Set the desired length (in words) for the rewritten script."
                />
              </div>
              <div className={styles.rewriteModalInputContainer}>
                <label className={styles.rewriteModalLabel}>
                  Rewrite style:
                </label>
                <select
                  value={rewriteStyle}
                  onChange={e => setRewriteStyle(e.target.value)}
                  className={styles.modalInput}
                  title="Choose the style (comedian) for the rewritten script."
                >
                  {COMEDIAN_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {rewriteError && <div className={styles.modalError}>{rewriteError}</div>}
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowRewriteModal(false)}
                  className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                  style={{
                    cursor: rewriteLoading ? 'not-allowed' : 'pointer',
                    opacity: rewriteLoading ? 0.7 : 1
                  }}
                  disabled={rewriteLoading}
                  title="Cancel and close the rewrite modal."
                >
                  Cancel
                </button>
                <button
                  onClick={handleRewriteSubmit}
                  className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
                  style={{
                    background: rewriteLoading ? '#333' : '#2563eb',
                    cursor: rewriteLoading ? 'not-allowed' : 'pointer',
                    opacity: rewriteLoading ? 0.7 : 1
                  }}
                  disabled={rewriteLoading}
                  title="Rewrite the script with the selected options."
                >
                  {rewriteLoading ? 'Rewriting...' : 'Rewrite'}
                </button>
                <button
                  onClick={() => console.log(selectedScript)}
                  className={`${styles.iconButton} ${styles.debugButton}`}
                  style={{
                    cursor: rewriteLoading ? 'not-allowed' : 'pointer',
                    opacity: rewriteLoading ? 0.7 : 1,
                  }}
                  disabled={rewriteLoading}
                  title="Log the current script object to the console for inspection."
                >
                  🧑‍🔬
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Latest News Expandable Section */}
      <div className={styles.newsContainer}>
        <div className={styles.newsWrapper}>
          <div className={styles.newsHeader}>
            <button
              onClick={() => setNewsExpanded((v: boolean) => !v)}
              className={styles.newsToggleButton}
              aria-expanded={newsExpanded}
              aria-controls="latest-news-panel"
              title="Show or hide the latest news stories for joke inspiration."
            >
              <span>{newsExpanded ? '▼' : '►'}</span>
              Latest News (for Joke Inspiration)
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearNewsCache();
              }}
              className={styles.newsClearButton}
            >
              🗑️
            </button>
          </div>
          {newsExpanded && (
            <div id="latest-news-panel" className={styles.newsPanel}>
              {newsLoading ? (
                <div className={styles.newsLoading}>Loading news...</div>
              ) : newsError ? (
                <div className={styles.newsError}>{newsError}</div>
              ) : newsHeadlines.length > 0 ? (
                <ul className={styles.newsList}>
                  {newsHeadlines.map((item: NewsItem, idx: number) => {
                    if (typeof item === 'string') {
                      // Old format: just a headline string
                      return <li key={idx} style={{ marginBottom: 18 }}><strong>{item}</strong></li>;
                    } else if (item && typeof item === 'object' && 'headline' in item && 'summary' in item) {
                      // New format: object with headline and summary
                      return (
                        <li key={idx} className={styles.newsListItem}>
                          <input type="checkbox" checked={checkedNewsIndices.includes(idx)} disabled={!checkedNewsIndices.includes(idx) && checkedNewsIndices.length >= 3} onChange={() => handleNewsCheckbox(idx)} className={styles.newsCheckbox} />
                          <div>
                            <div className={styles.newsHeadline}>{item.headline}</div>
                            <div className={styles.newsSummary}>{item.summary}</div>
                          </div>
                        </li>
                      );
                    } else {
                      return null;
                    }
                  })}
                </ul>
              ) : (
                <div className={styles.newsEmpty}>No news stories found.</div>
              )}
              {newsCached && !newsLoading && (
                <div className={styles.newsCachedStatus}>(cached for 8h)</div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={`${styles.modalContent} ${styles.deleteConfirmContent}`}>
            <h2 className={styles.modalTitle}>Delete Script?</h2>
            <p className={styles.deleteConfirmText}>Are you sure you want to delete this script? This action cannot be undone.</p>
            <div className={styles.deleteConfirmActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`${styles.deleteConfirmButton} ${styles.deleteConfirmButtonNo}`}
                style={{
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.7 : 1
                }}
                disabled={deleteLoading}
                title="Cancel and do not delete the script."
              >
                No
              </button>
              <button
                onClick={handleDeleteScript}
                className={`${styles.deleteConfirmButton} ${styles.deleteConfirmButtonYes}`}
                style={{
                  background: deleteLoading ? "#333" : "#ef4444",
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.7 : 1
                }}
                disabled={deleteLoading}
                title="Yes, permanently delete this script."
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Main Humor Experimentation UI */}
      <div className={styles.mainContainer}>
        <h1 className={styles.mainTitle}>Humor Experimentation</h1>
        {selectedScript?.url && (
          <div className={styles.sourceUrlContainer}>
            <span className={styles.sourceUrlLabel}>Source URL: </span>
            <a href={selectedScript.url} target="_blank" rel="noopener noreferrer" className={styles.sourceUrlLink}>{selectedScript.url}</a>
          </div>
        )}

        {/* Show video or loading state */}
        {(videoState[selectedScript?.id] || selectedScript?.video_url) && (
          <div className={styles.videoContainer}>
            {videoState[selectedScript?.id]?.generating ? (
              <div className={styles.videoLoadingContainer}>
                <div className={styles.spinner} />
                <div className={styles.videoStatusText}>
                  {videoState[selectedScript?.id]?.status === 'processing' ? 'Generating video...' : 'Loading...'}
                </div>
                {videoState[selectedScript?.id]?.thumbnailUrl && (
                  <img 
                    src={videoState[selectedScript.id].thumbnailUrl!} 
                    alt="Video thumbnail" 
                    className={styles.videoThumbnail}
                  />
                )}
                {/* Use the final videoUrl from script object if available */}
                {(videoState[selectedScript?.id]?.videoUrl || selectedScript?.video_url) && (
                  <img 
                    src={(videoState[selectedScript?.id]?.videoUrl || selectedScript?.video_url)!} 
                    alt="Video preview" 
                    className={styles.videoThumbnail}
                  />
                )}
              </div>
            ) : (videoState[selectedScript?.id]?.videoUrl || selectedScript?.video_url) ? (
              <div className={styles.videoPlayerContainer}>
                {/* Publish Button Overlay */}
                <button
                  className={`${styles.iconButton} ${styles.publishIconButton}`}
                  onClick={() => {
                    if (selectedScript?.name) {
                      window.location.href = `/publish?scriptName=${encodeURIComponent(selectedScript.name)}`;
                    }
                  }}
                  title="Publish"
                >
                  ✈️
                </button>
                <video 
                  src={videoState[selectedScript.id]?.videoUrl || selectedScript.video_url} 
                  controls 
                  className={styles.videoPlayer}
                />
                <button
                  className={`${styles.iconButton} ${styles.deleteVideoButton}`}
                  onClick={() => handleDeleteVideo(selectedScript.id)}
                  title="Delete Video"
                >
                  🗑️
                </button>
              </div>
            ) : null}
            {videoState[selectedScript?.id]?.error && (
              <div className={styles.videoError}>
                {videoState[selectedScript.id].error}
              </div>
            )}
          </div>
        )}

        {/* Paragraph Display and Selection */}
        <div className={styles.paragraphsContainer}>
          <h2 className={styles.paragraphsTitle}>Script Paragraphs</h2>
          <ol className={styles.paragraphsList}>
            {paragraphs.map((p: string, idx: number) => (
              <React.Fragment key={idx}>
                <li className={styles.paragraphListItem}>
                  <div
                    onClick={() => setSelectedParagraphIdx(idx)}
                    className={`${styles.paragraph} ${selectedParagraphIdx === idx ? styles.paragraphSelected : styles.paragraphUnselected}`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: highlightJokeTags(p) }} />
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveParagraph(idx);
                    }}
                    title="Remove this paragraph from the script. This change is saved."
                    className={styles.removeParagraphButton}
                  >
                    ✕
                  </button>
                </li>
                {selectedParagraphIdx === idx && (
                  <div className={styles.paragraphActions}>
                    {/* Comedian Dropdown */}
                    <select
                      value={selectedComedian[idx] || selectedComedian.default || ""}
                      onChange={e => {
                        setSelectedComedian(c => ({ ...c, [idx]: e.target.value }));
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('lastSelectedComedian', e.target.value);
                        }
                      }}
                      className={styles.comedianSelect}
                      title="Choose a comedian's style to rewrite this paragraph."
                    >
                      <option value="">Select comedian style...</option>
                      {COMEDIAN_LIST.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {/* Generate Icon Button */}
                    <button
                      disabled={!(selectedComedian[idx] || selectedComedian.default) || loadingIdx === idx}
                      onClick={() => handleExperiment(idx)}
                      title="Generate a humorous variant of this paragraph in the selected comedian's style."
                      className={`${styles.generateVariantButton} ${loadingIdx === idx ? styles.generateVariantButtonLoading : styles.generateVariantButtonActive}`}
                      style={{
                        cursor: !(selectedComedian[idx] || selectedComedian.default) || loadingIdx === idx ? "not-allowed" : "pointer",
                        opacity: !(selectedComedian[idx] || selectedComedian.default) || loadingIdx === idx ? 0.6 : 1
                      }}
                    >
                      <span role="img" aria-label="magic">🪄</span>
                    </button>
                    {/* Deselect Button */}
                    <button
                      onClick={handleDeselect}
                      className={styles.deselectButton}
                      title="Deselect this paragraph."
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* Variants List */}
                {variants[idx] && variants[idx].length > 0 && (
                  <ul className={styles.variantsList}>
                    {variants[idx].map((v, vIdx) => (
                      <li key={vIdx} className={styles.variantListItem}>
                        <span className={styles.variantText} dangerouslySetInnerHTML={{ __html: highlightJokeTags(v) }} />
                        <button
                          onClick={() => handleSaveVariant(idx, v)}
                          className={styles.saveVariantButton}
                          title="Replace the original paragraph with this variant and save."
                        >
                          💾
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Error/Loading */}
                {errorIdx[idx] && (
                  <div className={`${styles.statusMessage} ${styles.errorMessage}`}>{errorIdx[idx]}</div>
                )}
                {loadingIdx === idx && (
                  <div className={`${styles.statusMessage} ${styles.loadingMessage}`}>Generating...</div>
                )}
              </React.Fragment>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

{/* Add the spinning animation */}
<style jsx global>{`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}</style> 