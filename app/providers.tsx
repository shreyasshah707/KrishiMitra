"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/context/AuthContext";
import LoginPopup from "@/components/auth/LoginPopup";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LoginPopup />
      {children}
    </AuthProvider>
  );
}
