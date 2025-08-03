'use client';

export default function SiteDownPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      color: 'var(--foreground)',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <style jsx global>{`
        :root {
          --background: #ffffff;
          --foreground: #171717;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --background: #0a0a0a;
            --foreground: #ededed;
          }
        }
      `}</style>
      <div style={{
        background: 'var(--background)',
        borderRadius: 12,
        boxShadow: '0 2px 16px #0001',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        maxWidth: 480,
        border: '1px solid var(--foreground)'
      }}>
        <h1 style={{ color: '#e11d48', marginBottom: 16 }}>We're Down Right Now</h1>
        <p style={{ marginBottom: 24 }}>
          Sorry, the site is currently unavailable due to a technical issue.<br />
          Please try again in a few minutes.
        </p>
      </div>
    </div>
  );
} 