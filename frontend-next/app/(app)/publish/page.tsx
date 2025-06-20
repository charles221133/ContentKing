'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Simulate fetching scripts from the JSON file
async function fetchScriptByName(name: string) {
  const res = await fetch('/data/prompt-scripts.json');
  const scripts = await res.json();
  return scripts.find((s: any) => s.name === name);
}

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'linkedin', label: 'LinkedIn' },
];

export default function PublishPage() {
  const searchParams = useSearchParams();
  const scriptName = searchParams.get('scriptName');
  const [scriptNameState, setScriptNameState] = useState<string | null>(null);
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ [platform: string]: string }>({});
  const [publishing, setPublishing] = useState<{ [platform: string]: boolean }>({});
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  useEffect(() => {
    let effectiveScriptName = scriptName;
    if (!scriptName) {
      // Try to load from localStorage
      if (typeof window !== 'undefined') {
        const last = localStorage.getItem('lastPublishScriptName');
        if (last) {
          effectiveScriptName = last;
        }
      }
    }
    setScriptNameState(effectiveScriptName);
  }, [scriptName]);

  useEffect(() => {
    if (scriptNameState) {
      fetchScriptByName(scriptNameState).then((data) => {
        setScript(data);
        setStatus(data?.status || {});
        setLoading(false);
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastPublishScriptName', scriptNameState);
        }
      });
    }
  }, [scriptNameState]);

  const handlePublish = async (platform: string) => {
    if (platform === 'youtube') {
      setPublishing((prev) => ({ ...prev, [platform]: true }));
      // Try to upload, if not authenticated, start OAuth
      const upload = async () => {
        const res = await fetch('/api/youtube/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: script.videoUrl,
            title: script.name || 'Untitled Video',
            description: ''
          })
        });
        if (res.status === 401) {
          // Not authenticated, start OAuth
          const popup = window.open('/api/youtube/auth', 'ytAuth', 'width=500,height=700');
          return new Promise<void>((resolve) => {
            const listener = (event: any) => {
              if (event.data && event.data.youtubeAuth) {
                window.removeEventListener('message', listener);
                popup?.close();
                upload().then(resolve);
              }
            };
            window.addEventListener('message', listener);
          });
        } else if (res.ok) {
          const data = await res.json();
          setStatus((prev) => ({ ...prev, [platform]: 'Published' }));
          setYoutubeVideoId(data.videoId);
        } else {
          setStatus((prev) => ({ ...prev, [platform]: 'Failed' }));
        }
        setPublishing((prev) => ({ ...prev, [platform]: false }));
      };
      await upload();
      setPublishing((prev) => ({ ...prev, [platform]: false }));
      return;
    }
    // Simulate for other platforms
    setPublishing((prev) => ({ ...prev, [platform]: true }));
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, [platform]: 'Published' }));
      setPublishing((prev) => ({ ...prev, [platform]: false }));
    }, 1500);
  };

  // Add a reset function for testing
  const handleReset = () => {
    setStatus({});
    setYoutubeVideoId(null);
  };

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!script) return <div style={{ padding: 32 }}>Script not found.</div>;

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <h1>Publish: {script.name}</h1>
      {script.videoUrl ? (
        <div style={{ position: 'relative', width: '100%', maxWidth: 600, marginBottom: 32 }}>
          {/* Reset Button Overlay with Tooltip */}
          <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#fff',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  opacity: 0.95,
                  transition: 'background 0.2s, color 0.2s',
                  padding: 0
                }}
                onClick={handleReset}
                title="Reset publish status for all platforms (for testing)"
                onMouseEnter={e => {
                  const tooltip = e.currentTarget.nextSibling as HTMLElement;
                  if (tooltip) tooltip.style.opacity = '1';
                }}
                onMouseLeave={e => {
                  const tooltip = e.currentTarget.nextSibling as HTMLElement;
                  if (tooltip) tooltip.style.opacity = '0';
                }}
              >
                {/* Refresh SVG icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0 0 20.49 15"/></svg>
              </button>
              <span
                style={{
                  position: 'absolute',
                  left: '110%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#23232a',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.2s',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
                }}
              >
                Reset publish status for all platforms (for testing)
              </span>
            </div>
          </div>
          <video src={script.videoUrl} controls style={{ width: '100%', borderRadius: 8 }} />
        </div>
      ) : (
        <div style={{ marginBottom: 32, color: '#f87171' }}>No video available for this script.</div>
      )}
      <div style={{ marginTop: 16 }}>
        {PLATFORMS.map((platform) => (
          <div key={platform.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 20, background: '#23232a', borderRadius: 8, padding: 16 }}>
            <span style={{ width: 180, fontWeight: 600, color: '#fff' }}>
              {platform.label}
            </span>
            <span style={{ marginRight: 16, color: status[platform.key] === 'Published' ? '#22c55e' : '#fbbf24', minWidth: 100 }}>
              {status[platform.key] || 'Not published'}
              {platform.key === 'youtube' && status[platform.key] === 'Published' && youtubeVideoId && (
                <>
                  {' '}
                  <a
                    href={`https://youtube.com/watch?v=${youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', marginLeft: 12, textDecoration: 'underline', fontWeight: 500 }}
                  >
                    View on YouTube
                  </a>
                </>
              )}
            </span>
            <div style={{ flex: 1 }} />
            <button
              disabled={publishing[platform.key] || status[platform.key] === 'Published'}
              onClick={() => handlePublish(platform.key)}
              style={{
                background: status[platform.key] === 'Published' ? '#22c55e' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: 16,
                cursor: publishing[platform.key] || status[platform.key] === 'Published' ? 'not-allowed' : 'pointer',
                opacity: publishing[platform.key] || status[platform.key] === 'Published' ? 0.7 : 1,
                minWidth: 100,
                marginLeft: 'auto',
                alignSelf: 'flex-end',
              }}
            >
              {publishing[platform.key]
                ? 'Publishing...'
                : status[platform.key] === 'Published'
                ? 'Published'
                : `Publish`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 