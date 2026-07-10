"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CouncilProvider } from "@/lib/councilStore";
import LoginPopup from "@/components/auth/LoginPopup";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CouncilProvider>
        <LoginPopup />
        {children}
      </CouncilProvider>
    </AuthProvider>
  );
}

