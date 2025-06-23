'use client';

import { useEffect, useState } from 'react';
import type { PromptScript, YouTubePublishSettings } from '@/types';
import apiClient from '@/utils/apiClient';
import YouTubePublishModal from '@/components/YouTubePublishModal';
import { FiUploadCloud } from 'react-icons/fi';
import ReplaceVideoModal from '../../../components/ReplaceVideoModal';

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  // { key: 'tiktok', label: 'TikTok' },
  // { key: 'linkedin', label: 'LinkedIn' },
];

export default function PublishPage() {
  const [scripts, setScripts] = useState<PromptScript[]>([]);
  const [selectedScript, setSelectedScript] = useState<PromptScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ [platform: string]: string }>({});
  const [publishing, setPublishing] = useState<{ [platform: string]: boolean }>({});
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  useEffect(() => {
    async function loadScripts() {
      try {
        const res = await apiClient.get('/list-saved-scripts');
        // Axios wraps the response in a `data` object
        const data = res.data;
        setScripts(data.scripts || []);
        
        if (data.scripts && data.scripts.length > 0) {
          // Re-implement the localStorage logic to get the last selected script
          const lastScriptId = localStorage.getItem('lastPublishScriptId');
          const lastScript = data.scripts.find((s: PromptScript) => s.id === lastScriptId);
          
          if (lastScript) {
            setSelectedScript(lastScript);
            setStatus(lastScript.status || {});
          } else {
            // Default to the first script if none was saved
            setSelectedScript(data.scripts[0]);
            setStatus(data.scripts[0].status || {});
          }
        }
      } catch (e: any) {
        // The interceptor will handle 401s. We only need to catch other errors.
        if (e.response?.status !== 401) {
          console.error("Error fetching scripts for Publish page:", e);
          setError("Failed to load scripts. See console for details.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadScripts();
  }, []);

  const handleScriptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scriptId = e.target.value;
    const script = scripts.find(s => s.id === scriptId);
    if (script) {
      setSelectedScript(script);
      setStatus(script.status || {});
      setYoutubeVideoId(null); // Reset video ID when changing scripts
      // Save the selected script ID to localStorage
      if (script.id) {
        localStorage.setItem('lastPublishScriptId', script.id);
      }
    }
  };

  const handleYouTubePublish = async (settings: YouTubePublishSettings) => {
    if (!selectedScript) return;
    const platform = 'youtube';

    setPublishing((prev) => ({ ...prev, [platform]: true }));
    setIsModalOpen(false);

    try {
      const res = await apiClient.post('/youtube/upload', {
        videoUrl: selectedScript.video_url,
        ...settings
      });
      const data = res.data;
      setStatus((prev) => ({ ...prev, [platform]: 'Published' }));
      setYoutubeVideoId(data.videoId);
    } catch (err: any) {
      if (err.isYouTubeAuthError) {
        console.log('Handling YouTube auth error in UI. Opening popup.');
        const popup = window.open('/api/youtube/auth', 'youtube-auth', 'width=600,height=700');
        
        // Listen for message from popup
        const handleAuthMessage = (event: MessageEvent) => {
          if (event.source === popup && event.data.youtubeAuth) {
            console.log('YouTube auth successful, re-trying publish.');
            // Re-call this function to try publishing again
            handleYouTubePublish(settings);
            window.removeEventListener('message', handleAuthMessage);
            popup?.close();
          }
        };
        window.addEventListener('message', handleAuthMessage, false);

        setStatus((prev) => ({ ...prev, [platform]: 'Authentication required' }));
      } else if (err.response?.status !== 401) {
        setStatus((prev) => ({ ...prev, [platform]: 'Failed' }));
      }
    } finally {
      setPublishing((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handlePublish = async (platform: string) => {
    if (!selectedScript) return;

    if (platform === 'youtube') {
      setIsModalOpen(true);
      return;
    }
    // Simulate for other platforms
    setPublishing((prev) => ({ ...prev, [platform]: true }));
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, [platform]: 'Published' }));
      setPublishing((prev) => ({ ...prev, [platform]: false }));
    }, 1500);
  };

  const handleReset = () => {
    setStatus({});
    setYoutubeVideoId(null);
  };

  if (loading) return <div style={{ padding: 32 }}>Loading scripts...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ marginRight: 12 }}>Publish a Script</h1>
        <button
          onClick={() => setShowReplaceModal(true)}
          title="Upload a replacement video"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            color: '#38bdf8',
            fontSize: 24
          }}
        >
          <FiUploadCloud />
        </button>
      </div>

      {scripts.length === 0 ? (
        <div>You have no scripts to publish yet. Go create one!</div>
      ) : (
        <>
          <div style={{ marginBottom: 32 }}>
            <label htmlFor="script-select" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Choose a script to publish:
            </label>
            <select
              id="script-select"
              onChange={handleScriptChange}
              value={selectedScript?.id || ''}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#2d3748', color: 'white', border: '1px solid #4a5568' }}
            >
              {scripts.map(s => (
                <option key={s.id} value={s.id!}>{s.name}</option>
              ))}
            </select>
          </div>

          {selectedScript && (
            <>
              <h2>Publish: {selectedScript.name}</h2>
              {selectedScript.video_url ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: 600, marginBottom: 32 }}>
                  <video src={selectedScript.video_url} controls style={{ width: '100%', borderRadius: 8 }} />
                </div>
              ) : (
                <div style={{ marginBottom: 32, padding: 16, background: '#4a5568', borderRadius: 8, color: '#fbbf24' }}>
                  This script does not have a video generated yet.
                </div>
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
                        <a
                          href={`https://youtube.com/watch?v=${youtubeVideoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#38bdf8', marginLeft: 12, textDecoration: 'underline', fontWeight: 500 }}
                        >
                          View on YouTube
                        </a>
                      )}
                    </span>
                    <button
                      onClick={() => handlePublish(platform.key)}
                      disabled={publishing[platform.key] || !selectedScript.video_url}
                      style={{
                        padding: '10px 20px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        opacity: publishing[platform.key] || !selectedScript.video_url ? 0.5 : 1,
                        marginLeft: 'auto'
                      }}
                    >
                      {publishing[platform.key] ? 'Publishing...' : 'Publish'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <YouTubePublishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPublish={handleYouTubePublish}
        script={selectedScript}
      />
      {showReplaceModal && (
        <ReplaceVideoModal
          isOpen={showReplaceModal}
          onClose={() => setShowReplaceModal(false)}
          script={selectedScript}
          onVideoReplaced={newUrl => {
            // Update the selected script's video_url in state
            if (selectedScript) {
              setSelectedScript({ ...selectedScript, video_url: newUrl });
            }
            setShowReplaceModal(false);
          }}
        />
      )}
    </div>
  );
} 