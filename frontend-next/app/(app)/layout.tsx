import Sidebar from "@/components/Sidebar";
import RequireAuth from "@/components/RequireAuth";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RequireAuth>
            <div className="flex flex-1">
                <Sidebar />
                <div className="flex-1 p-6">
                    {children}
                </div>
            </div>
        </RequireAuth>
    );
} 