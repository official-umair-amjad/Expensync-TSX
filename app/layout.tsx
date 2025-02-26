"use client";
import "./globals.css";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";


interface RootLayoutProps {
  children: ReactNode;
}

// This component is used inside the AuthProvider to show the user email and logout button.
function LayoutContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <>
      <header className="text-white px-4 float-right m-2 gap-3">
        <div>
          Hi, <span className="text-xs">{user && user.email}</span>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
