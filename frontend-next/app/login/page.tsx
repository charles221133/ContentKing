'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../utils/supabaseClient";
import { useUser } from "../../context/UserContext";

export default function LoginPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!userLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, userLoading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error("Login failed:", error);
      setError(error.message);
      setLoading(false);
    } else {
      console.log("Login successful! Session data:", data);
      setSuccess(true);
      // Force a router refresh to ensure the new session is picked up by server components/middleware
      router.refresh(); 
    }
  }

  if (userLoading || user) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <div style={{ background: '#18181b', padding: 40, borderRadius: 12, boxShadow: '0 4px 32px #0004', minWidth: 340 }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Login</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={handleSubmit}>
          <label htmlFor="email" style={{ color: '#fff', fontWeight: 500 }}>Email</label>
          <input id="email" name="email" type="email" required style={{ padding: 10, borderRadius: 6, border: '1px solid #333', background: '#23232a', color: '#fff' }} />
          <label htmlFor="password" style={{ color: '#fff', fontWeight: 500 }}>Password</label>
          <input id="password" name="password" type="password" required style={{ padding: 10, borderRadius: 6, border: '1px solid #333', background: '#23232a', color: '#fff' }} />
          <button type="submit" style={{ marginTop: 12, padding: '12px 0', borderRadius: 6, background: '#38bdf8', color: '#111', fontWeight: 700, fontSize: 18, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p style={{ color: '#f87171', marginTop: 12, textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: '#4caf50', marginTop: 12, textAlign: 'center' }}>Login successful!</p>}
        <p style={{ color: '#bbb', marginTop: 18, textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
} 