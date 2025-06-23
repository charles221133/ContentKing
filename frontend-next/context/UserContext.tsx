'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../utils/supabaseClient';

export const UserContext = createContext<{ user: any, loading: boolean }>({ user: null, loading: true });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // onAuthStateChange fires immediately with the current session
    // so we can use it to get the initial state and listen for changes.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      // Cleanup the listener when the component unmounts
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
} 