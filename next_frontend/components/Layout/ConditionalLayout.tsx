"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Check if the current path starts with '/auth' or '/signin'
  const isAuthPage =
    pathname.startsWith("/auth") || pathname.startsWith("/signin");

  if (isAuthPage) {
    // For auth pages, just return children without layout
    return <>{children}</>;
  }

  // For other pages, return the full layout
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
