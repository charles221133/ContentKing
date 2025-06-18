import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32, lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#aaa', marginBottom: 32 }}>Last updated: June 2024</p>
      <nav style={{ marginBottom: 32 }}>
        <strong>Table of Contents</strong>
        <ul style={{ marginLeft: 24 }}>
          <li><a href="#introduction">1. Introduction</a></li>
          <li><a href="#information-we-collect">2. Information We Collect</a></li>
          <li><a href="#how-we-use">3. How We Use Your Information</a></li>
          <li><a href="#cookies">4. Cookies & Tracking Technologies</a></li>
          <li><a href="#sharing">5. Sharing of Information</a></li>
          <li><a href="#data-security">6. Data Security</a></li>
          <li><a href="#data-retention">7. Data Retention</a></li>
          <li><a href="#your-rights">8. Your Rights & Choices</a></li>
          <li><a href="#children">9. Children's Privacy</a></li>
          <li><a href="#changes">10. Changes to This Policy</a></li>
          <li><a href="#contact">11. Contact</a></li>
        </ul>
      </nav>
      <section id="introduction">
        <h2>1. Introduction</h2>
        <p>This Privacy Policy describes how parodypipeline.com ("we", "us", or "our") collects, uses, and protects your personal information when you use our website and services (the "Service").</p>
      </section>
      <section id="information-we-collect">
        <h2>2. Information We Collect</h2>
        <ul>
          <li><strong>Information you provide:</strong> Name, email address, account credentials, and any other information you submit via forms or communications.</li>
          <li><strong>Automatically collected data:</strong> IP address, browser type, device information, usage data, and cookies.</li>
          <li><strong>Third-party data:</strong> Information from third-party services you connect or interact with through our Service.</li>
        </ul>
      </section>
      <section id="how-we-use">
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide, operate, and maintain the Service</li>
          <li>To improve, personalize, and expand our Service</li>
          <li>To communicate with you, including for support and updates</li>
          <li>To process transactions and manage accounts</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>
      <section id="cookies">
        <h2>4. Cookies & Tracking Technologies</h2>
        <p>We use cookies and similar technologies to enhance your experience, analyze usage, and deliver relevant content. You can control cookies through your browser settings, but disabling them may affect your use of the Service.</p>
      </section>
      <section id="sharing">
        <h2>5. Sharing of Information</h2>
        <ul>
          <li>We do <strong>not</strong> sell your personal information.</li>
          <li>We may share information with service providers who help us operate the Service, subject to confidentiality agreements.</li>
          <li>We may disclose information if required by law or to protect our rights, property, or safety.</li>
        </ul>
      </section>
      <section id="data-security">
        <h2>6. Data Security</h2>
        <p>We implement reasonable technical and organizational measures to protect your information. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
      </section>
      <section id="data-retention">
        <h2>7. Data Retention</h2>
        <p>We retain your personal information only as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law.</p>
      </section>
      <section id="your-rights">
        <h2>8. Your Rights & Choices</h2>
        <ul>
          <li>You may access, update, or delete your personal information by contacting us.</li>
          <li>You may opt out of marketing communications at any time.</li>
          <li>Depending on your location, you may have additional rights under applicable law (e.g., GDPR, CCPA).</li>
        </ul>
      </section>
      <section id="children">
        <h2>9. Children's Privacy</h2>
        <p>Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us for removal.</p>
      </section>
      <section id="changes">
        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last updated" date at the top of this page. Your continued use of the Service after changes constitutes acceptance of the new policy.</p>
      </section>
      <section id="contact">
        <h2>11. Contact</h2>
        <p>If you have any questions or requests regarding this Privacy Policy, please contact us at <a href="mailto:support@parodypipeline.com">support@parodypipeline.com</a>.</p>
      </section>
    </main>
  );
} 