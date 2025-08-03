'use client';
import React from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <head>
        <title>Site Unavailable</title>
        <style>{`
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
          html, body { max-width: 100vw; overflow-x: hidden; }
          body { color: var(--foreground); background: var(--background); font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 10vh auto; background: var(--background); border-radius: 12px; box-shadow: 0 2px 16px #0001; padding: 2.5rem 2rem; text-align: center; border: 1px solid var(--foreground); }
          h1 { color: #e11d48; margin-bottom: 1rem; }
          p { margin-bottom: 1.5rem; }
          button { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 0.75rem 1.5rem; font-size: 1rem; cursor: pointer; }
          button:hover { background: #1d4ed8; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>We're Down Right Now</h1>
          <p>
            Sorry, the site is currently unavailable due to a technical issue.<br />
            Please try again in a few minutes.
          </p>
          <button onClick={() => reset()}>Try Again</button>
        </div>
      </body>
    </html>
  );
} 