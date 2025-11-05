'use client';

import { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import RequireAuth from "@/components/RequireAuth";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <RequireAuth>
            <div className="flex flex-1">
                <Sidebar onToggle={setIsSidebarCollapsed} />
                <div className={`flex-1 p-6 transition-all duration-300 ${isSidebarCollapsed ? 'ml-0' : ''}`}>
                    {children}
                </div>
            </div>
        </RequireAuth>
    );
} 