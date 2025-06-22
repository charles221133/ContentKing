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
    if (error.response && error.response.status === 401) {
      console.log('Caught a 401 Unauthorized error. Signing out...');
      // If we get a 401, the session is invalid.
      // Sign the user out and redirect to the login page.
      await supabase.auth.signOut();
      // Use window.location to force a full page reload, clearing any component state.
      window.location.href = '/login';
    }
    // For any other errors, just pass them along.
    return Promise.reject(error);
  }
);

export default apiClient;