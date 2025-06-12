// TODO: Integrate with backend API to generate humorous variants based on selected paragraph and comedian.
// Next steps: Wire up the experiment button to call the API, display loading state, and show generated variants.
// See utils/prompts.ts and /api/personalize-script for backend logic.
// Humor Experimentation Interface main page
// All UI uses a dark theme by default.
"use client";
import React, { useState, useEffect } from "react";

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
    setSavedScriptsLoading(true);
    fetch("/api/list-saved-scripts")
      .then(res => res.json())
      .then(data => {
        setSavedScripts(data.scripts || []);
        setSavedScriptsLoading(false);
        // Try to load last selected script from localStorage
        const lastId = typeof window !== 'undefined' ? localStorage.getItem('lastSelectedScriptId') : null;
        if (lastId && data.scripts) {
          const found = data.scripts.find((s: any) => s.id === lastId);
          if (found) {
            setSelectedScript(found);
          }
        }
      })
      .catch(err => {
        setSavedScriptsError("Failed to load saved scripts");
        setSavedScriptsLoading(false);
      });
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

  // Refactor handleExperiment to support multiple variants per paragraph
  const handleExperiment = async (idx: number) => {
    setLoadingIdx(idx);
    setErrorIdx(e => ({ ...e, [idx]: null }));
    try {
      const comedian = selectedComedian[idx] || "Fireship";
      // Request 4 variants in a single backend call
      const res = await fetch("/api/personalize-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: paragraphs[idx],
          userStyle: comedian,
          force: true
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate variant");
      }
      const data = await res.json();
      // Split the response into variants by ---
      const variantsArr = (data.rewritten || "").split(/\n\s*-{3,}\s*\n/).map((s: string) => s.trim()).filter(Boolean);
      setVariants(v => ({ ...v, [idx]: variantsArr.length ? variantsArr : [data.rewritten || "No variant returned"] }));
    } catch (err: any) {
      setErrorIdx(e => ({ ...e, [idx]: err.message || "Unknown error" }));
    } finally {
      setLoadingIdx(null);
    }
  };

  // Save a variant as the new paragraph, persist, and clear experiments
  const handleSaveVariant = async (idx: number, variant: string) => {
    // Replace paragraph in script
    const arr = paragraphsOverride || scriptText.split("\n").filter((p: string) => p.trim().length > 0);
    const newParagraphs = arr.map((p: string, i: number) => (i === idx ? variant : p));
    const newScript = newParagraphs.join("\n");
    setParagraphsOverride(newParagraphs);
    setVariants(v => ({ ...v, [idx]: [] }));
    // Persist to backend if a script is selected
    if (selectedScript?.id) {
      const saveRes = await fetch("/api/save-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedScript.id,
          createdAt: selectedScript.createdAt,
          name: selectedScript.name,
          url: selectedScript.url,
          original: newScript,
          userStyle: selectedScript.userStyle,
          rewritten: selectedScript.rewritten,
          promptVersion: selectedScript.promptVersion
        })
      });
      const savedScript = await saveRes.json();
      // Refresh saved scripts and update selectedScript
      setSavedScriptsLoading(true);
      fetch("/api/list-saved-scripts")
        .then(res => res.json())
        .then(data => {
          setSavedScripts(data.scripts || []);
          setSavedScriptsLoading(false);
          const found = (data.scripts || []).find((s: any) => s.id === savedScript.id);
          setSelectedScript(found || savedScript);
        })
        .catch(err => {
          setSavedScriptsError("Failed to load saved scripts");
          setSavedScriptsLoading(false);
        });
    }
  };

  // Add a handler to deselect paragraph
  const handleDeselect = () => setSelectedParagraphIdx(null);

  // Handler for importing from YouTube
  const handleImportFromYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    setYoutubeImportLoading(true);
    setYoutubeImportError(null);
    try {
      console.log('Importing YouTube URL:', youtubeUrl);
      const res = await fetch("/api/extract-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl })
      });
      const data = await res.json();
      console.log('API response:', data);
      if (!res.ok) {
        setYoutubeImportError(data.message || "Failed to extract transcript.");
        console.error('API error:', data.message || data);
      } else {
        // Save the new script to the backend
        const saveRes = await fetch("/api/save-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original: data.transcript,
            userStyle: "",
            rewritten: "",
            promptVersion: "youtube-import"
          })
        });
        const savedScript = await saveRes.json();
        if (!saveRes.ok) {
          setYoutubeImportError(savedScript.message || "Failed to save script.");
          console.error('Save script error:', savedScript.message || savedScript);
        } else {
          // Refresh saved scripts and select the new one
          setSavedScriptsLoading(true);
          fetch("/api/list-saved-scripts")
            .then(res => res.json())
            .then(data => {
              setSavedScripts(data.scripts || []);
              setSavedScriptsLoading(false);
              const found = (data.scripts || []).find((s: any) => s.id === savedScript.id);
              setSelectedScript(found || savedScript);
            })
            .catch(err => {
              setSavedScriptsError("Failed to load saved scripts");
              setSavedScriptsLoading(false);
            });
          setSelectedParagraphIdx(null);
          setVariants({});
          setErrorIdx({});
          setYoutubeUrl("");
          console.log('Loaded and saved new script:', savedScript);
        }
      }
    } catch (err: any) {
      setYoutubeImportError(err.message || "Unknown error");
      console.error('Fetch error:', err);
    } finally {
      setYoutubeImportLoading(false);
    }
  };

  // State for deleting a script
  const handleDeleteScript = async () => {
    if (!selectedScript?.id) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/delete-script?id=${encodeURIComponent(selectedScript.id)}`, { method: 'DELETE' });
      // Refresh saved scripts
      setSavedScriptsLoading(true);
      fetch("/api/list-saved-scripts")
        .then(res => res.json())
        .then(data => {
          setSavedScripts(data.scripts || []);
          setSavedScriptsLoading(false);
          // If the deleted script was selected, clear selection
          if (selectedScript && (!data.scripts || !data.scripts.find((s: any) => s.id === selectedScript.id))) {
            setSelectedScript(null);
            setSelectedParagraphIdx(null);
            setVariants({});
            setErrorIdx({});
          }
        })
        .catch(err => {
          setSavedScriptsError("Failed to load saved scripts");
          setSavedScriptsLoading(false);
        });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // State for OpenAI conversion
  const handleConvertScript = () => {
    if (!selectedScript?.id || selectedScript.rewritten) return;
    // Set up modal defaults
    const wordCount = selectedScript.original.split(/\s+/).filter(Boolean).length;
    setRewriteLength(wordCount);
    setRewriteStyle('Fireship');
    setRewriteError(null);
    setShowRewriteModal(true);
  };

  const handleRewriteSubmit = async () => {
    if (!selectedScript?.id || selectedScript.rewritten) return;
    setRewriteLoading(true);
    setRewriteError(null);
    try {
      // Call OpenAI API to rewrite the script with style and length
      const res = await fetch('/api/personalize-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: selectedScript.original, userStyle: rewriteStyle, length: rewriteLength })
      });
      const data = await res.json();
      if (!res.ok || !data.rewritten) {
        setRewriteError(data.message || data.error || 'Failed to convert script.');
        return;
      }
      // Save the rewritten script, overwriting the old one
      const saveRes = await fetch('/api/save-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedScript.id,
          createdAt: selectedScript.createdAt,
          name: selectedScript.name,
          url: selectedScript.url,
          original: selectedScript.original,
          userStyle: rewriteStyle,
          rewritten: data.rewritten,
          promptVersion: data.promptVersion || 'openai-convert'
        })
      });
      const savedScript = await saveRes.json();
      if (!saveRes.ok) {
        setRewriteError(savedScript.message || 'Failed to save converted script.');
        return;
      }
      // Refresh saved scripts and select the updated one
      setSavedScriptsLoading(true);
      fetch('/api/list-saved-scripts')
        .then(res => res.json())
        .then(data => {
          setSavedScripts(data.scripts || []);
          setSavedScriptsLoading(false);
          const found = (data.scripts || []).find((s: any) => s.id === savedScript.id);
          setSelectedScript(found || savedScript);
        })
        .catch(err => {
          setSavedScriptsError('Failed to load saved scripts');
          setSavedScriptsLoading(false);
        });
      setShowRewriteModal(false);
    } catch (err: any) {
      setRewriteError(err.message || 'Unknown error');
    } finally {
      setRewriteLoading(false);
    }
  };

  // Handler for saving pasted transcript
  const handlePasteTranscriptSave = async () => {
    if (!pasteName.trim()) {
      setPasteError("Name cannot be empty.");
      return;
    }
    if (!pastedTranscript.trim()) {
      setPasteError("Transcript cannot be empty.");
      return;
    }
    setPasteLoading(true);
    setPasteError(null);
    try {
      // Clean transcript: remove leading timestamps from each line
      const cleanedTranscript = pastedTranscript
        .split('\n')
        .map(line => line.replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s*/, '').trim())
        .filter(line => line.length > 0)
        .join('\n');

      const saveRes = await fetch("/api/save-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pasteName,
          url: pasteUrl,
          original: cleanedTranscript,
          userStyle: "",
          rewritten: "",
          promptVersion: "manual-paste"
        })
      });
      const savedScript = await saveRes.json();
      if (!saveRes.ok) {
        setPasteError(savedScript.message || "Failed to save script.");
      } else {
        // Refresh saved scripts and select the new one
        setSavedScriptsLoading(true);
        fetch("/api/list-saved-scripts")
          .then(res => res.json())
          .then(data => {
            setSavedScripts(data.scripts || []);
            setSavedScriptsLoading(false);
            const found = (data.scripts || []).find((s: any) => s.id === savedScript.id);
            setSelectedScript(found || savedScript);
          })
          .catch(err => {
            setSavedScriptsError("Failed to load saved scripts");
            setSavedScriptsLoading(false);
          });
        setSelectedParagraphIdx(null);
        setVariants({});
        setErrorIdx({});
        setShowPasteModal(false);
        setPastedTranscript("");
        setPasteName("");
        setPasteUrl("");
        setParagraphsOverride(null);
      }
    } catch (err: any) {
      setPasteError(err.message || "Unknown error");
    } finally {
      setPasteLoading(false);
    }
  };

  // Remove paragraph and persist to backend
  const handleRemoveParagraph = async (idx: number) => {
    const arr = paragraphsOverride || scriptText.split("\n").filter((p: string) => p.trim().length > 0);
    const newParagraphs = arr.filter((_: unknown, i: number) => i !== idx);
    const newScript = newParagraphs.join("\n");
    setParagraphsOverride(newParagraphs);
    // Persist to backend if a script is selected
    if (selectedScript?.id) {
      const saveRes = await fetch("/api/save-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedScript.id,
          createdAt: selectedScript.createdAt,
          name: selectedScript.name,
          url: selectedScript.url,
          original: newScript,
          userStyle: selectedScript.userStyle,
          rewritten: selectedScript.rewritten,
          promptVersion: selectedScript.promptVersion
        })
      });
      const savedScript = await saveRes.json();
      // Refresh saved scripts and update selectedScript
      setSavedScriptsLoading(true);
      fetch("/api/list-saved-scripts")
        .then(res => res.json())
        .then(data => {
          setSavedScripts(data.scripts || []);
          setSavedScriptsLoading(false);
          const found = (data.scripts || []).find((s: any) => s.id === savedScript.id);
          setSelectedScript(found || savedScript);
        })
        .catch(err => {
          setSavedScriptsError("Failed to load saved scripts");
          setSavedScriptsLoading(false);
        });
      // Deselect paragraph if it was removed
      if (selectedParagraphIdx === idx) setSelectedParagraphIdx(null);
    }
  };

  return (
    <>
      {/* Paste Transcript Button and Modal */}
      <div style={{ maxWidth: 800, margin: "40px auto 8px auto", padding: 0, background: "none" }}>
        <button
          onClick={() => setShowPasteModal(true)}
          style={{
            padding: "8px 16px",
            fontSize: 16,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 8
          }}
          title="Paste a new transcript manually to create a new script."
        >
          Paste Transcript
        </button>
      </div>
      {showPasteModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#23232a",
            padding: 32,
            borderRadius: 12,
            maxWidth: 500,
            width: "90%",
            boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
            color: "#f3f3f3"
          }}>
            <h2 style={{ color: "#fff", marginBottom: 16 }}>Paste Transcript</h2>
            <input
              type="text"
              value={pasteName}
              onChange={e => setPasteName(e.target.value)}
              placeholder="Enter script name..."
              style={{
                width: "100%",
                padding: 10,
                fontSize: 16,
                background: "#18181b",
                color: "#f3f3f3",
                border: "1px solid #333",
                borderRadius: 6,
                marginBottom: 12
              }}
              disabled={pasteLoading}
            />
            <input
              type="text"
              value={pasteUrl}
              onChange={e => setPasteUrl(e.target.value)}
              placeholder="Enter source URL (optional)"
              style={{
                width: "100%",
                padding: 10,
                fontSize: 16,
                background: "#18181b",
                color: "#f3f3f3",
                border: "1px solid #333",
                borderRadius: 6,
                marginBottom: 12
              }}
              disabled={pasteLoading}
            />
            <textarea
              value={pastedTranscript}
              onChange={e => setPastedTranscript(e.target.value)}
              rows={10}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                background: "#18181b",
                color: "#f3f3f3",
                border: "1px solid #333",
                borderRadius: 6,
                marginBottom: 16
              }}
              placeholder="Paste your transcript here..."
              disabled={pasteLoading}
            />
            {pasteError && <div style={{ color: "#f87171", marginBottom: 8 }}>{pasteError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPastedTranscript("");
                  setPasteError(null);
                  setPasteName("");
                  setPasteUrl("");
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: 16,
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
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
                style={{
                  padding: "8px 16px",
                  fontSize: 16,
                  background: pasteLoading ? "#333" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
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
      <div style={{ maxWidth: 800, margin: "0 auto 16px auto", padding: 0, background: "none", display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ color: "#fff", fontWeight: 500, marginRight: 12 }}>Load Saved Script:</label>
        {savedScriptsLoading ? (
          <span style={{ color: "#888" }}>Loading...</span>
        ) : savedScriptsError ? (
          <span style={{ color: "#f87171" }}>{savedScriptsError}</span>
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
            style={{
              background: "#23232a",
              color: "#f3f3f3",
              border: "1px solid #333",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 16,
              minWidth: 300
            }}
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
          style={{
            background: deleteLoading ? "#333" : "#23232a",
            color: deleteLoading ? "#888" : "#f87171",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 20,
            cursor: !selectedScript || deleteLoading ? "not-allowed" : "pointer",
            opacity: !selectedScript || deleteLoading ? 0.5 : 1,
            marginLeft: 4
          }}
        >
          🗑️
        </button>
        {/* Convert with OpenAI button */}
        <button
          onClick={handleConvertScript}
          disabled={!selectedScript || !!selectedScript.rewritten}
          title="Rewrite the selected script using OpenAI in a chosen style."
          style={{
            background: "#23232a",
            color: "#22d3ee",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 18,
            cursor: !selectedScript || !!selectedScript.rewritten ? "not-allowed" : "pointer",
            opacity: !selectedScript || !!selectedScript.rewritten ? 0.5 : 1,
            marginLeft: 4
          }}
        >
          ⚡
        </button>
        {/* Rewrite Modal */}
        {showRewriteModal && selectedScript && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200
          }}>
            <div style={{
              background: "#23232a",
              padding: 32,
              borderRadius: 12,
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
              color: "#f3f3f3"
            }}>
              <h2 style={{ color: "#fff", marginBottom: 16 }}>Rewrite Script</h2>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                  Length of new script (Current script is {selectedScript.original.split(/\s+/).filter(Boolean).length} words):
                </label>
                <input
                  type="number"
                  min={1}
                  value={rewriteLength}
                  onChange={e => setRewriteLength(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 16,
                    background: '#18181b',
                    color: '#f3f3f3',
                    border: '1px solid #333',
                    borderRadius: 6
                  }}
                  title="Set the desired length (in words) for the rewritten script."
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                  Rewrite style:
                </label>
                <select
                  value={rewriteStyle}
                  onChange={e => setRewriteStyle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 16,
                    background: '#18181b',
                    color: '#f3f3f3',
                    border: '1px solid #333',
                    borderRadius: 6
                  }}
                  title="Choose the style (comedian) for the rewritten script."
                >
                  {COMEDIAN_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {rewriteError && <div style={{ color: '#f87171', marginBottom: 12 }}>{rewriteError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => setShowRewriteModal(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: 16,
                    background: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
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
                  style={{
                    padding: '8px 16px',
                    fontSize: 16,
                    background: rewriteLoading ? '#333' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: rewriteLoading ? 'not-allowed' : 'pointer',
                    opacity: rewriteLoading ? 0.7 : 1
                  }}
                  disabled={rewriteLoading}
                  title="Rewrite the script with the selected options."
                >
                  {rewriteLoading ? 'Rewriting...' : 'Rewrite'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100
        }}>
          <div style={{
            background: "#23232a",
            padding: 32,
            borderRadius: 12,
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
            color: "#f3f3f3",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#fff", marginBottom: 16 }}>Delete Script?</h2>
            <p style={{ marginBottom: 24 }}>Are you sure you want to delete this script? This action cannot be undone.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "8px 24px",
                  fontSize: 16,
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
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
                style={{
                  padding: "8px 24px",
                  fontSize: 16,
                  background: deleteLoading ? "#333" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
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
      <div style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: 32,
        background: "#18181b",
        color: "#f3f3f3",
        borderRadius: 16,
        minHeight: 600,
        boxShadow: "0 2px 16px rgba(0,0,0,0.4)"
      }}>
        <h1 style={{ color: "#fff", marginBottom: 24 }}>Humor Experimentation</h1>
        {selectedScript?.url && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: '#a3e635', fontWeight: 500 }}>Source URL: </span>
            <a href={selectedScript.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{selectedScript.url}</a>
          </div>
        )}
        {/* Paragraph Display and Selection */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", fontSize: 20 }}>Script Paragraphs</h2>
          <ol style={{ paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {paragraphs.map((p: string, idx: number) => (
              <React.Fragment key={idx}>
                <li style={{ listStyle: "decimal", color: "#d1d5db", marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    onClick={() => setSelectedParagraphIdx(idx)}
                    style={{
                      background: selectedParagraphIdx === idx ? "#2563eb" : "#23232a",
                      color: selectedParagraphIdx === idx ? "#fff" : "#f3f3f3",
                      padding: 10,
                      borderRadius: 8,
                      cursor: "pointer",
                      border: selectedParagraphIdx === idx ? "2px solid #2563eb" : "2px solid transparent",
                      transition: "background 0.2s, border 0.2s",
                      fontWeight: selectedParagraphIdx === idx ? 600 : 400,
                      boxShadow: selectedParagraphIdx === idx ? "0 2px 8px rgba(37,99,235,0.15)" : undefined,
                      marginBottom: 0,
                      flex: 1
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: highlightJokeTags(p) }} />
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveParagraph(idx);
                    }}
                    title="Remove this paragraph from the script. This change is saved."
                    style={{
                      marginLeft: 12,
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 16,
                      cursor: 'pointer',
                      opacity: 0.85
                    }}
                  >
                    ✕
                  </button>
                </li>
                {selectedParagraphIdx === idx && (
                  <div style={{ margin: "8px 0 8px 24px", display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Comedian Dropdown */}
                    <select
                      value={selectedComedian[idx] || selectedComedian.default || ""}
                      onChange={e => {
                        setSelectedComedian(c => ({ ...c, [idx]: e.target.value }));
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('lastSelectedComedian', e.target.value);
                        }
                      }}
                      style={{
                        background: "#23232a",
                        color: "#f3f3f3",
                        border: "1px solid #333",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 15,
                        minWidth: 160
                      }}
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
                      style={{
                        background: loadingIdx === idx ? "#333" : "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 36,
                        height: 36,
                        fontSize: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: !(selectedComedian[idx] || selectedComedian.default) || loadingIdx === idx ? "not-allowed" : "pointer",
                        opacity: !(selectedComedian[idx] || selectedComedian.default) || loadingIdx === idx ? 0.6 : 1
                      }}
                    >
                      <span role="img" aria-label="magic">🪄</span>
                    </button>
                    {/* Deselect Button */}
                    <button
                      onClick={handleDeselect}
                      style={{
                        background: "#333",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 14,
                        cursor: "pointer"
                      }}
                      title="Deselect this paragraph."
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* Variants List */}
                {variants[idx] && variants[idx].length > 0 && (
                  <ul style={{ margin: "4px 0 12px 36px", padding: 0, listStyle: "disc", color: "#a3e635", fontSize: 15 }}>
                    {variants[idx].map((v, vIdx) => (
                      <li key={vIdx} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: highlightJokeTags(v) }} />
                        <button
                          onClick={() => handleSaveVariant(idx, v)}
                          style={{
                            background: '#38bdf8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 16,
                            cursor: 'pointer',
                            opacity: 0.95
                          }}
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
                  <div style={{ color: "#f87171", marginLeft: 36, fontSize: 14 }}>{errorIdx[idx]}</div>
                )}
                {loadingIdx === idx && (
                  <div style={{ color: "#888", marginLeft: 36, fontSize: 14 }}>Generating...</div>
                )}
              </React.Fragment>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
} 