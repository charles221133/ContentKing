// Utility to submit data to the provided Google Form
export async function submitGoogleForm({ name, email, message }: { name: string; email: string; message: string }) {
  const formData = new URLSearchParams();
  formData.append('entry.1982161368', name);
  formData.append('entry.1152863791', email);
  formData.append('entry.773125156', message);

  await fetch('https://docs.google.com/forms/d/e/1FAIpQLSdfiQ-xBiI5lyfmyGmdNzYRZcPauFSg_38vhaY9sWnrNJKH8Q/formResponse', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
} 