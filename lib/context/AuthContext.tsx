"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  userName: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => AuthResponse;
  register: (name: string, email: string, pass: string) => AuthResponse;
  logout: () => void;
  isMounted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const activeSessionStr = localStorage.getItem("krishimitra_active_session");
      if (activeSessionStr) {
        const session = JSON.parse(activeSessionStr);
        setUserName(session.name);
        setUserEmail(session.email);
        setIsAuthenticated(true);
      }
    } catch(e) {}
    setIsMounted(true);
  }, []);

  const getUsers = () => {
    try {
      const usersStr = localStorage.getItem("krishimitra_users_db");
      return usersStr ? JSON.parse(usersStr) : [];
    } catch(e) {
      return [];
    }
  };

  const register = (name: string, email: string, pass: string): AuthResponse => {
    const users = getUsers();
    const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return { success: false, error: "Email already exists. Please sign in." };
    }

    const newUser = { name: name.trim(), email: email.trim(), pass };
    users.push(newUser);
    localStorage.setItem("krishimitra_users_db", JSON.stringify(users));

    // Sign them in
    setUserName(newUser.name);
    setUserEmail(newUser.email);
    setIsAuthenticated(true);
    localStorage.setItem("krishimitra_active_session", JSON.stringify({ name: newUser.name, email: newUser.email }));
    
    return { success: true };
  };

  const login = (email: string, pass: string): AuthResponse => {
    const users = getUsers();
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: "Account not found. Please create an account." };
    }
    
    if (user.pass !== pass) {
      return { success: false, error: "Incorrect password." };
    }

    // Success
    setUserName(user.name);
    setUserEmail(user.email);
    setIsAuthenticated(true);
    localStorage.setItem("krishimitra_active_session", JSON.stringify({ name: user.name, email: user.email }));

    return { success: true };
  };

  const logout = () => {
    setUserName(null);
    setUserEmail(null);
    setIsAuthenticated(false);
    localStorage.removeItem("krishimitra_active_session");
  };

  return (
    <AuthContext.Provider value={{ userName, userEmail, isAuthenticated, login, register, logout, isMounted }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
