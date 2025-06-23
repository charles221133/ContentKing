// This page and all UI should use a dark theme by default.
"use client";
import React, { useState } from "react";
import apiClient from '@/utils/apiClient';

export default function TranscriptPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiClient.post('/extract-transcript', { url });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: "40px auto",
      padding: 24,
      background: "#18181b",
      color: "#f3f3f3",
      borderRadius: 12,
      minHeight: 500,
      boxShadow: "0 2px 16px rgba(0,0,0,0.4)"
    }}>
      <h1 style={{ color: "#fff" }}>Extract YouTube Transcript</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="url"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
          style={{
            flex: 1,
            padding: 8,
            fontSize: 16,
            background: "#23232a",
            color: "#f3f3f3",
            border: "1px solid #333",
            borderRadius: 6
          }}
        />
        <button
          type="submit"
          disabled={loading || !url}
          style={{
            padding: "8px 16px",
            fontSize: 16,
            background: loading ? "#333" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background 0.2s"
          }}
        >
          {loading ? "Extracting..." : "Extract"}
        </button>
      </form>
      {error && <div style={{ color: "#f87171", marginBottom: 16 }}>{error}</div>}
      {result && (
        <div style={{ background: "#23232a", padding: 16, borderRadius: 8, color: "#f3f3f3" }}>
          <h2 style={{ color: "#fff" }}>Transcript</h2>
          <div style={{ marginBottom: 12 }}>
            <strong>Video ID:</strong> {result.videoId}<br />
            <strong>Language:</strong> {result.metadata?.language}<br />
            <strong>Duration:</strong> {result.metadata?.duration}s<br />
            <strong>Extracted At:</strong> {result.metadata?.extractedAt}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Full Transcript:</strong>
            <div style={{ whiteSpace: "pre-wrap", marginTop: 8, color: "#e5e5e5" }}>{result.transcript}</div>
          </div>
          <div>
            <strong>Paragraphs:</strong>
            <ol>
              {result.paragraphs?.map((p: string, i: number) => (
                <li key={i} style={{ marginBottom: 4, color: "#d1d5db" }}>{p}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 