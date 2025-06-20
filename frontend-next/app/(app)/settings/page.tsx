'use client';
import React from "react";
import RequireAuth from "@/components/RequireAuth";
import { useUser } from "@/context/UserContext";

export default function SettingsPage() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <div style={{ padding: 40 }}>
        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Account Settings</h1>
        <div style={{ background: '#18181b', padding: 24, borderRadius: 12 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>My Profile</h2>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>
      </div>
    </RequireAuth>
  );
} 