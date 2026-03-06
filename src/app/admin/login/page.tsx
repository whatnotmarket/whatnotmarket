"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/Navbar";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin/proxy-orders");
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />
      
      <main className="flex items-center justify-center min-h-[80vh] px-4">
        <Squircle radius={24} smoothing={1} innerClassName="bg-[#1C1C1E] p-8 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-zinc-400 text-sm">Enter password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="Username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="Password"
            />
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3">
              Login
            </Button>
          </form>
        </Squircle>
      </main>
    </div>
  );
}
