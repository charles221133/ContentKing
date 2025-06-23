'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '../context/UserContext';
import { createSupabaseBrowserClient } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user } = useUser();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 40px',
      background: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #333',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <Link href="/" style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', textDecoration: 'none' }}>
        parodypipeline.com
      </Link>
      <nav>
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
            >
              {user.email}
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 8,
                background: '#23232a',
                borderRadius: 8,
                padding: '8px 0',
                minWidth: 160,
                boxShadow: '0 4px 12px #0008',
              }}>
                <Link href="/settings" style={{ display: 'block', padding: '8px 16px', color: '#fff', textDecoration: 'none' }}>
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    color: '#fff',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
            <Link href="/signup" style={{ color: '#111', background: '#38bdf8', padding: '8px 16px', borderRadius: 6, textDecoration: 'none' }}>Sign Up</Link>
          </div>
        )}
      </nav>
    </header>
  );
} 