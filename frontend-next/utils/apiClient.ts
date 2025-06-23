import axios from 'axios';
import { createSupabaseBrowserClient } from './supabaseClient';

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
        console.log('YouTube token invalid. Flagging error for UI handling.');
        // Add a flag to the error object so the UI can identify it
        error.isYouTubeAuthError = true;
        // Reject the promise so the calling component can catch it and handle the UI
        return Promise.reject(error);
      } else {
        console.log('Caught a general 401 Unauthorized error. Signing out...');
        // If it's a general 401, the session is invalid.
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    // For any other errors, just pass them along.
    return Promise.reject(error);
  }
);

export default apiClient;