import React, { useRef, useState } from 'react';
import type { PromptScript } from '@/types';
import apiClient from '@/utils/apiClient';

interface ReplaceVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: PromptScript | null;
  onVideoReplaced: (newUrl: string) => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const modalStyle: React.CSSProperties = {
  background: '#23232a', color: 'white', borderRadius: 8, padding: 32, minWidth: 350, maxWidth: 400
};
const dropAreaStyle: React.CSSProperties = {
  border: '2px dashed #38bdf8', borderRadius: 8, padding: 32, textAlign: 'center', background: '#1a202c', color: '#38bdf8', cursor: 'pointer', marginBottom: 24
};

export default function ReplaceVideoModal({ isOpen, onClose, script, onVideoReplaced }: ReplaceVideoModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    await handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      // 1. Get signed S3 URL
      const res = await apiClient.post('/s3-upload', {
        fileName: file.name,
        fileType: file.type
      });
      const { signedUrl, key, publicUrl } = res.data;
      // 2. Upload file to S3
      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      // 3. Use server-provided public URL
      const s3Url = publicUrl || `https://${process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_S3_BUCKET || 'YOUR_BUCKET'}.s3.amazonaws.com/${key}`;
      // 4. Save new video_url to script
      if (script) {
        await apiClient.post('/save-script', { script: { ...script, video_url: s3Url } });
        onVideoReplaced(s3Url);
      }
    } catch (err: any) {
      setError('Failed to upload video. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleClick = () => {
    inputRef.current?.click();
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2>Replace Video</h2>
        <div
          style={{ ...dropAreaStyle, borderColor: dragActive ? '#2563eb' : '#38bdf8' }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {uploading ? 'Uploading...' : 'Drag & drop a video file here, or click to select'}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleInputChange}
            disabled={uploading}
          />
        </div>
        {error && <div style={{ color: '#f87171', marginBottom: 12 }}>{error}</div>}
        <button
          onClick={onClose}
          style={{ padding: '8px 20px', background: '#4a5568', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginTop: 8 }}
          disabled={uploading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 