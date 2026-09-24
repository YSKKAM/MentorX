"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { User } from "../types";
import { useToast } from "../components/ui/Toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string, role?: 'teacher' | 'student') => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToast } = useToast();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.get("/auth/me");
      if (data && data.id) {
        // Backend returns user object directly with snake_case fields
        setUser({
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          role: data.role,
          avatarUrl: data.avatar_url,
          googleId: data.google_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      if ((error as any)?.status !== 401 && (error as any)?.message !== "Invalid token") {
        console.error("Failed to fetch user", error);
      }
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await api.post("/auth/login", { email, password });
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        const mappedUser = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.display_name,
          role: data.user.role,
          avatarUrl: data.user.avatar_url,
          googleId: data.user.google_id,
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at,
        };
        setUser(mappedUser);
        addToast("Successfully logged in", "success");
        
        if (mappedUser.role === "teacher") {
          router.push("/dashboard/teacher");
        } else {
          router.push("/dashboard/student");
        }
      }
    } catch (error: any) {
      addToast(error.message || "Failed to login", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, role?: 'teacher' | 'student') => {
    try {
      setLoading(true);
      const data = await api.post("/auth/google", { credential, role });
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        const mappedUser = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.display_name,
          role: data.user.role,
          avatarUrl: data.user.avatar_url,
          googleId: data.user.google_id,
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at,
        };
        setUser(mappedUser);
        addToast(`Welcome to MentorX, ${mappedUser.displayName}!`, "success");
        
        if (mappedUser.role === "teacher") {
          router.push("/dashboard/teacher");
        } else {
          router.push("/dashboard/student");
        }
      }
    } catch (error: any) {
      addToast(error.message || "Failed to sign in with Google", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const data = await api.post("/auth/register", userData);
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        const mappedUser = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.display_name,
          role: data.user.role,
          avatarUrl: data.user.avatar_url,
          googleId: data.user.google_id,
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at,
        };
        setUser(mappedUser);
        addToast("Account created successfully", "success");
        
        if (mappedUser.role === "teacher") {
          router.push("/dashboard/teacher");
        } else {
          router.push("/dashboard/student");
        }
      }
    } catch (error: any) {
      addToast(error.message || "Failed to register", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
    addToast("Logged out successfully", "info");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
