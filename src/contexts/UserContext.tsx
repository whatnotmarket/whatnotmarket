"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define the role type
export type UserRole = "guest" | "buyer" | "seller";

// Define the context type
type UserContextType = {
  role: UserRole;
  login: (code: string) => boolean;
  logout: () => void;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("guest");

  useEffect(() => {
    // Check local storage on mount
    const storedRole = localStorage.getItem("whatnot_user_role") as UserRole;
    if (storedRole === "buyer" || storedRole === "seller") {
      setRole(storedRole);
    }
  }, []);

  const login = (code: string): boolean => {
    if (code === "BUY1") {
      setRole("buyer");
      localStorage.setItem("whatnot_user_role", "buyer");
      return true;
    }
    if (code === "SELL1") {
      setRole("seller");
      localStorage.setItem("whatnot_user_role", "seller");
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole("guest");
    localStorage.removeItem("whatnot_user_role");
  };

  return (
    <UserContext.Provider value={{ role, login, logout }}>
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
