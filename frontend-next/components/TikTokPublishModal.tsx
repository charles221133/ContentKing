import { useState, useEffect } from 'react';
import type { PromptScript } from '@/types';

export interface TikTokPublishSettings {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'private' | 'public' | 'unlisted';
}

interface TikTokPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (settings: TikTokPublishSettings) => void;
  script: PromptScript | null;
}

export default function TikTokPublishModal({ isOpen, onClose, onPublish, script }: TikTokPublishModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'public' | 'unlisted'>('private');

  useEffect(() => {
    if (script) {
      setTitle(script.name || '');
      setDescription(script.description || '');
    }
  }, [script]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPublish({
      title,
      description,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      privacyStatus,
    });
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
        <h2>TikTok Publish Settings</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: 8 }}>Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#1a202c', color: 'white', border: '1px solid #4a5568' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: 8 }}>Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#1a202c', color: 'white', border: '1px solid #4a5568' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="tags" style={{ display: 'block', marginBottom: 8 }}>Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#1a202c', color: 'white', border: '1px solid #4a5568' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="privacy" style={{ display: 'block', marginBottom: 8 }}>Privacy</label>
            <select
              id="privacy"
              value={privacyStatus}
              onChange={(e) => setPrivacyStatus(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#1a202c', color: 'white', border: '1px solid #4a5568' }}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
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
              Publish to TikTok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 