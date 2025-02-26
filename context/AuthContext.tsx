"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../utils/supabaseClient";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | string>;
  signup: (email: string, password: string) => Promise<User | string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.user) {
        console.error("Error fetching session:", error?.message);
        return;
      }
      setUser(data.session.user);
      localStorage.setItem("session", JSON.stringify(data.session));
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem("session", JSON.stringify(session));
      } else {
        setUser(null);
        localStorage.removeItem("session");
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | string> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.user) {
      console.error("Login failed:", error?.message);
      return "Wrong Credentials";
    }
    setUser(data.user);
    localStorage.setItem("session", JSON.stringify(data));
    return data.user;
  };

  const signup = async (email: string, password: string): Promise<User | string> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data?.user) {
      console.error("Signup failed:", error?.message);
      return "Signup Error";
    }
    setUser(data.user);
    localStorage.setItem("session", JSON.stringify(data));
    return data.user;
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("session");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};