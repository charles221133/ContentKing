export type PromptScript = {
  id?: string;
  name: string;
  original: string;
  user_style: string;
  rewritten: string;
  prompt_version: string;
  created_at?: string;
  user_id: string;
  description?: string;
  video_url?: string;
  status?: { [platform: string]: string };
};

export interface YouTubePublishSettings {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'private' | 'public' | 'unlisted';
  madeForKids: boolean;
}

// Quick Vid API types
export interface QuickVidRequest {
  description: string;
  projectId?: string;
  projectData?: Project;
}

export interface QuickVidResponse {
  success: boolean;
  sessionId?: string;
  status?: string;
  totalScenes?: number;
  sceneVideos?: string[];
  mergedVideo?: string;
  youTubeVideo?: string;
  message?: string;
  data?: any;
  error?: string;
}

export interface QuickVidState {
  description: string;
  isLoading: boolean;
  videoUrl: string | null;
  error: string | null;
  videoInfo: {
    model: string;
    created_at: string;
    completed_at: string;
    duration: number;
    resolution: string;
    aspect_ratio: string;
    cost_usd: number;
  } | null;
  // New fields for multi-video support
  sessionId: string | null;
  totalScenes: number | null;
  sceneVideos: string[];
  mergedVideo: string | null;
  youTubeVideo: string | null;
}

// Video History types
export interface VideoHistoryItem {
  id: string;
  user_id: string;
  description: string;
  video_url: string | null;
  video_info: {
    model: string;
    created_at: string;
    completed_at: string;
    duration: number;
    resolution: string;
    aspect_ratio: string;
    cost_usd: number;
  } | null;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  // New fields for multi-video support
  session_id: string | null;
  total_scenes: number | null;
  scene_videos: string[];
  merged_video: string | null;
  youtube_video: string | null;
  // Project fields
  project_id: string | null;
  project_data: Project | null;
}

export interface VideoHistoryResponse {
  success: boolean;
  data?: {
    videos: VideoHistoryItem[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

// Character object type
export interface CharacterData {
  name: string;
  description?: string;
  context?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  visualStyle: string;
  characters: CharacterData[]; // Changed from string[] to CharacterData[]
  description: string;
  context: string;
  created_at: string;
  updated_at: string;
}