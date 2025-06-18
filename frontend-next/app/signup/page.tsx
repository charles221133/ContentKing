import React from "react";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <div style={{ background: '#18181b', padding: 40, borderRadius: 12, boxShadow: '0 4px 32px #0004', minWidth: 340 }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Sign Up</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label htmlFor="email" style={{ color: '#fff', fontWeight: 500 }}>Email</label>
          <input id="email" name="email" type="email" required style={{ padding: 10, borderRadius: 6, border: '1px solid #333', background: '#23232a', color: '#fff' }} />
          <label htmlFor="password" style={{ color: '#fff', fontWeight: 500 }}>Password</label>
          <input id="password" name="password" type="password" required style={{ padding: 10, borderRadius: 6, border: '1px solid #333', background: '#23232a', color: '#fff' }} />
          <label htmlFor="confirmPassword" style={{ color: '#fff', fontWeight: 500 }}>Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required style={{ padding: 10, borderRadius: 6, border: '1px solid #333', background: '#23232a', color: '#fff' }} />
          <button type="submit" style={{ marginTop: 12, padding: '12px 0', borderRadius: 6, background: '#38bdf8', color: '#111', fontWeight: 700, fontSize: 18, border: 'none', cursor: 'pointer' }}>Sign Up</button>
        </form>
        <p style={{ color: '#bbb', marginTop: 18, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Login</Link>
        </p>
      </div>
    </div>
  );
} 