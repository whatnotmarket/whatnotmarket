"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { hasCanonicalAdminAccess } from "@/lib/security/admin-guards";

// Define the role type
export type UserRole = "guest" | "buyer" | "seller";

// Define the context type
type UserContextType = {
  user: User | null;
  role: UserRole;
  isFounder: boolean;
  username: string | null;
  isLoading: boolean;
  logout: () => void;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("guest");
  const [isFounder, setIsFounder] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const resolveRole = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          setUser(null);
          setRole("guest");
          setIsFounder(false);
          setUsername(null);
          localStorage.removeItem("openlymarket_user_role");
          return;
        }

        setUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role_preference,username,is_admin")
          .eq("id", user.id)
          .maybeSingle();

        const nextRole: UserRole = profile?.role_preference === "seller" ? "seller" : "buyer";
        const currentUsername = profile?.username || null;
        const nextIsFounder = hasCanonicalAdminAccess(profile);
        setRole(nextRole);
        setIsFounder(nextIsFounder);
        setUsername(currentUsername);
        localStorage.setItem("openlymarket_user_role", nextRole);
      } catch (error) {
        console.error("Failed to resolve user role:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    resolveRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      resolveRole();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setRole("guest");
    setIsFounder(false);
    setUsername(null);
    localStorage.removeItem("openlymarket_user_role");
  };

  return (
    <UserContext.Provider value={{ user, role, isFounder, username, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

