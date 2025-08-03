import { useState, useEffect } from 'react';
import type { PromptScript } from '@/types';

export interface InstagramPublishSettings {
  caption: string;
}

interface InstagramPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (settings: InstagramPublishSettings) => void;
  script: PromptScript | null;
}

export default function InstagramPublishModal({ isOpen, onClose, onPublish, script }: InstagramPublishModalProps) {
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (script) {
      setCaption(script.description || '');
    }
  }, [script]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPublish({ caption });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#2d3748', color: 'white', padding: 32,
        borderRadius: 8, width: '100%', maxWidth: 500
      }}>
        <h2>Instagram Reels Publish Settings</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="caption" style={{ display: 'block', marginBottom: 8 }}>Caption</label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#1a202c', color: 'white', border: '1px solid #4a5568' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', background: 'transparent', color: '#cbd5e0',
              border: '1px solid #cbd5e0', borderRadius: 6, cursor: 'pointer', marginRight: 16
            }}>
              Cancel
            </button>
            <button type="submit" style={{
              padding: '10px 20px', background: '#2563eb', color: 'white',
              border: 'none', borderRadius: 6, cursor: 'pointer'
            }}>
              Publish to Instagram
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 