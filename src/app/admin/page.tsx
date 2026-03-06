"use client";

import { Shield, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-zinc-400">System Healthy</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">1,248</div>
                    <p className="text-xs text-zinc-500">+12% from last month</p>
                </CardContent>
            </Card>
             <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Active Requests</CardTitle>
                    <FileText className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">342</div>
                    <p className="text-xs text-zinc-500">+48 new today</p>
                </CardContent>
            </Card>
             <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Completed Deals</CardTitle>
                    <Shield className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">89</div>
                    <p className="text-xs text-zinc-500">$45k total volume</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Access Setup */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Access & Roles</h2>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-5 space-y-4">
                    <p className="text-sm text-zinc-300">
                      Login/signup is now passwordless via email magic-link.
                    </p>
                    <p className="text-sm text-zinc-400">
                      Seller and buyer invite codes are loaded from `.env.local` (`SELLER_INVITE_CODES`, `BUYER_INVITE_CODES`).
                    </p>
                    <p className="text-sm text-zinc-400">
                      Seller codes are single-use and tracked in `seller_invite_code_claims`.
                    </p>
                    <Button
                      onClick={() => toast.success("Access rules are managed via environment variables and DB claims.")}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      Refresh Access Rules
                    </Button>
                    <Link href="/admin/escrow">
                      <Button variant="outline" className="border-zinc-700 text-zinc-300">
                        Open Escrow Control
                      </Button>
                    </Link>
                </div>
            </div>

            {/* Disputes & Moderation */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Disputes & Moderation</h2>
                
                {/* Active Disputes */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Payment Disputes</h3>
                    <div className="p-4 rounded-lg border border-red-900/30 bg-red-950/10">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-semibold text-white">Deal #D992 - iPhone 15</h4>
                                <p className="text-sm text-red-400">Issue: Buyer claims item damaged</p>
                            </div>
                            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-medium">Funds Frozen</span>
                        </div>
                        <div className="bg-black/40 p-3 rounded text-sm text-zinc-400 mb-4 font-mono">
                            Escrow Balance: 950 USDC (Polygon)
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={() => toast.success("Funds released to Seller")}>
                                Release to Seller
                            </Button>
                            <Button size="sm" className="bg-zinc-700 hover:bg-zinc-600 text-white flex-1" onClick={() => toast.success("Funds refunded to Buyer")}>
                                Refund Buyer
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Reported Content</h3>
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-start justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">Reported Message in Deal #D{i}34</h4>
                                <p className="text-xs text-zinc-500">Reason: Suspicious payment link</p>
                                <p className="text-xs text-zinc-400 italic mt-2">&quot;Hey can you pay me via this link...&quot;</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-8 border-zinc-700 text-zinc-300">Ignore</Button>
                                <Button size="sm" variant="destructive" className="h-8">Ban User</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
