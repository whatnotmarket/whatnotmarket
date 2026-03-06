"use client";

import { useState } from "react";
import { Plus, Trash2, Shield, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

// Mock Data
const INITIAL_CODES = [
  { code: "VIP2026", status: "active", created: "2026-05-01" },
  { code: "FRIEND22", status: "used", created: "2026-04-20" },
];

export default function AdminPage() {
  const [codes, setCodes] = useState(INITIAL_CODES);
  const [newCodeCount, setNewCodeCount] = useState(1);

  const generateCodes = () => {
    const newCodes = Array.from({ length: newCodeCount }).map(() => ({
      code: `INV-${uuidv4().slice(0, 8).toUpperCase()}`,
      status: "active",
      created: new Date().toISOString().split("T")[0]
    }));
    setCodes([...newCodes, ...codes]);
    toast.success(`Generated ${newCodeCount} new invite codes`);
  };

  const revokeCode = (code: string) => {
    setCodes(codes.map(c => c.code === code ? { ...c, status: "revoked" } : c));
    toast.info(`Revoked code ${code}`);
  };

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
            {/* Invite Code Manager */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Invite Codes</h2>
                <div className="flex gap-4 items-end bg-zinc-900/20 p-4 rounded-lg border border-zinc-800">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium">Generate Amount</label>
                        <Input 
                            type="number" 
                            min={1} 
                            max={50}
                            value={newCodeCount}
                            onChange={(e) => setNewCodeCount(parseInt(e.target.value))}
                            className="bg-zinc-900 border-zinc-700"
                        />
                    </div>
                    <Button onClick={generateCodes} className="bg-white text-black hover:bg-zinc-200">
                        <Plus className="mr-2 h-4 w-4" /> Generate
                    </Button>
                </div>

                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-900/50 text-zinc-400 font-medium">
                            <tr>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
                            {codes.map((code) => (
                                <tr key={code.code} className="hover:bg-zinc-900/40 transition-colors">
                                    <td className="px-4 py-3 font-mono">{code.code}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium border",
                                            code.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            code.status === "used" ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                                            "bg-red-500/10 text-red-400 border-red-500/20"
                                        )}>
                                            {code.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-500">{code.created}</td>
                                    <td className="px-4 py-3 text-right">
                                        {code.status === "active" && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                onClick={() => revokeCode(code.code)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                <p className="text-xs text-zinc-400 italic mt-2">"Hey can you pay me via this link..."</p>
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
