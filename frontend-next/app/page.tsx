import React from "react";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src="/assets/images/landingPageBackground.png"
        alt="Landing Page Background"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: "60px 0 0 60px",
        }}
      >
        <h1 style={{ color: "#fff", fontSize: 56, fontWeight: 800, textShadow: "0 4px 32px #000", marginBottom: 24 }}>
          Welcome to Parody Pipeline
        </h1>
        <p style={{ color: "#fff", fontSize: 24, margin: "0 0 40px 0", maxWidth: 600, textAlign: "left", textShadow: "0 2px 16px #000" }}>
          Instantly turn YouTube videos into hilarious, personalized parody scripts and videos. AI-powered. Social-ready. Always original.
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <a
            href="/login"
            style={{
              background: "#fff",
              color: "#111",
              fontWeight: 700,
              fontSize: 16,
              padding: "10px 24px",
              borderRadius: 8,
              textDecoration: "none",
              boxShadow: "0 2px 8px #0002",
              border: "2px solid #38bdf8",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Login
          </a>
          <a
            href="/signup"
            style={{
              background: "#38bdf8",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              padding: "10px 24px",
              borderRadius: 8,
              textDecoration: "none",
              boxShadow: "0 2px 8px #0002",
              border: "2px solid #38bdf8",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
