import axios from 'axios';
import { createSupabaseBrowserClient } from './supabaseClient';
import { QuickVidRequest, QuickVidResponse, VideoHistoryResponse, Project } from '../types';

const supabase = createSupabaseBrowserClient();

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
apiClient.interceptors.response.use(
  // Any status code that lie within the range of 2xx cause this function to trigger
  (response) => response,
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const errorData = error.response.data;

      // Check for specific YouTube token error
      if (errorData.error === 'youtube_token_invalid') {
        // Add a flag to the error object so the UI can identify it
        error.isYouTubeAuthError = true;
        // Reject the promise so the calling component can catch it and handle the UI
        return Promise.reject(error);
      } else {
        // If it's a general 401, the session is invalid.
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    // For any other errors, just pass them along.
    return Promise.reject(error);
  }
);

// Quick Vid API functions
export const quickVidApi = {
  generateVideo: async (request: QuickVidRequest): Promise<QuickVidResponse> => {
    const response = await apiClient.post<QuickVidResponse>('/quick-vid', request);
    return response.data;
  },
  getVideoHistory: async (limit = 10, offset = 0): Promise<VideoHistoryResponse> => {
    const response = await apiClient.get<VideoHistoryResponse>(`/video-history?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  deleteVideo: async (videoId: string): Promise<{ success: boolean; error?: string }> => {
    const response = await apiClient.delete<{ success: boolean; error?: string }>(`/video-history/${videoId}`);
    return response.data;
  },
};

// Projects API functions
export const projectsApi = {
  getProjects: async (): Promise<{ success: boolean; data: Project[]; error?: string }> => {
    const response = await apiClient.get<{ success: boolean; data: Project[]; error?: string }>('/projects');
    return response.data;
  },
  createProject: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data: Project; error?: string }> => {
    const response = await apiClient.post<{ success: boolean; data: Project; error?: string }>('/projects', project);
    return response.data;
  },
  updateProject: async (id: string, project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data: Project; error?: string }> => {
    const response = await apiClient.put<{ success: boolean; data: Project; error?: string }>(`/projects/${id}`, project);
    return response.data;
  },
  deleteProject: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const response = await apiClient.delete<{ success: boolean; error?: string }>(`/projects/${id}`);
    return response.data;
  },
};

export default apiClient;