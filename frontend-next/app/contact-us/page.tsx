'use client';
import React, { useState } from "react";

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLInputElement).value;

    // Google Form endpoint and entry IDs
    const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdfiQ-xBiI5lyfmyGmdNzYRZcPauFSg_38vhaY9sWnrNJKH8Q/formResponse";
    const ENTRY_NAME = "entry.1982161368";
    const ENTRY_EMAIL = "entry.1152863791";
    const ENTRY_MESSAGE = "entry.773125156";

    const data = {
      [ENTRY_NAME]: name,
      [ENTRY_EMAIL]: email,
      [ENTRY_MESSAGE]: message,
    };

    console.log('Submitting to Google Form:', data);
    fetch(FORM_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    });
    setSubmitted(true);
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 32, lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Contact Us</h1>
      <p style={{ color: '#aaa', marginBottom: 24 }}>We'd love to hear from you! Reach out using the form below or via our contact details.</p>
      <section style={{ marginBottom: 32 }}>
        <h2>Contact Information</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><strong>Email:</strong> <a href="mailto:support@parodypipeline.com">support@parodypipeline.com</a></li>
          <li><strong>Address:</strong> 123 Main Street, City, Country</li>
        </ul>
      </section>
      <section>
        <h2>Send Us a Message</h2>
        {submitted ? (
          <p style={{ color: '#4caf50', fontWeight: 600 }}>Thank you for contacting us! We've received your message.</p>
        ) : (
          <form style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }} onSubmit={handleSubmit} aria-label="Contact form">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <button type="submit" style={{ padding: '10px 20px', borderRadius: 4, background: '#0070f3', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Send</button>
          </form>
        )}
      </section>
    </main>
  );
} 