import React from "react";

export default function CareersPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32, lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Careers at parodypipeline.com</h1>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Join our team and help shape the future of parody content management and AI-driven solutions!</p>
      <section style={{ marginBottom: 32 }}>
        <h2>Open Positions</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li>
            <strong>Frontend Engineer</strong> <span style={{ color: '#888' }}>– Remote / Full-time</span>
            <p style={{ margin: '4px 0 16px 0' }}>Work with React, Next.js, and TypeScript to build beautiful, performant user experiences.</p>
          </li>
          <li>
            <strong>Backend Engineer</strong> <span style={{ color: '#888' }}>– Remote / Full-time</span>
            <p style={{ margin: '4px 0 16px 0' }}>Design and implement scalable APIs and services using Node.js and cloud technologies.</p>
          </li>
          <li>
            <strong>Product Designer</strong> <span style={{ color: '#888' }}>– Remote / Contract</span>
            <p style={{ margin: '4px 0 16px 0' }}>Create intuitive, delightful interfaces and collaborate closely with engineering and product teams.</p>
          </li>
        </ul>
      </section>
      <section>
        <h2>General Applications</h2>
        <p>If you don't see a role that fits but are passionate about our mission, we'd still love to hear from you! Send your resume and a brief introduction to <a href="mailto:careers@parodypipeline.com">careers@parodypipeline.com</a>.</p>
      </section>
    </main>
  );
} 