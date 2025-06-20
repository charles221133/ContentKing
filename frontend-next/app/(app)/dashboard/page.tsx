'use client';
import React from "react";
import RequireAuth from "@/components/RequireAuth";
import { useUser } from "@/context/UserContext";

export default function DashboardPage() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#18181b', padding: 40, borderRadius: 12, boxShadow: '0 4px 32px #0004', minWidth: 340 }}>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Dashboard</h2>
          <p style={{ color: '#fff', fontSize: 20, textAlign: 'center' }}>
            Welcome{user?.email ? `, ${user.email}` : ''}!
          </p>
        </div>
      </div>
    </RequireAuth>
  );
} 