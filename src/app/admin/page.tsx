"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminUser = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  role_preference: "buyer" | "seller" | "both" | null;
  seller_status: "unverified" | "pending_telegram" | "verified" | "rejected" | null;
  is_admin: boolean | null;
  created_at: string;
};

type AdminRequest = {
  id: string;
  title: string;
  status: "open" | "accepted" | "closed";
  created_by: string;
  created_at: string;
  creator_handle: string;
};

type AdminOffer = {
  id: string;
  request_id: string;
  price: number;
  status: "pending" | "accepted" | "rejected";
  created_by: string;
  created_at: string;
  creator_handle: string;
};

type AdminDeal = {
  id: string;
  status: "verification" | "completed" | "cancelled";
  buyer_id: string;
  seller_id: string;
  created_at: string;
  buyer_handle: string;
  seller_handle: string;
};

type AdminListingPayment = {
  id: string;
  listing_id: string;
  status: string;
  amount: number;
  currency: string;
  chain: string;
  payer_user_id: string;
  payee_user_id: string | null;
  created_at: string;
  payer_handle: string;
  payee_handle: string;
};

type AdminAuditLog = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

type DashboardPayload = {
  metrics: {
    totalUsers: number;
    sellerPending: number;
    sellerVerified: number;
    requestsOpen: number;
    offersPending: number;
    dealsVerification: number;
    listingPaymentsAwaitingRelease: number;
    paymentIntentsDisputed: number;
  };
  users: AdminUser[];
  requests: AdminRequest[];
  offers: AdminOffer[];
  deals: AdminDeal[];
  listingPayments: AdminListingPayment[];
  auditLogs: AdminAuditLog[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function shortId(value: string) {
  return value.slice(0, 8);
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard/overview", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as unknown;
      const isObjectPayload = payload !== null && typeof payload === "object";
      const maybeError =
        isObjectPayload && "error" in payload
          ? String((payload as { error?: string }).error || "Load failed")
          : null;

      if (!res.ok || !isObjectPayload || maybeError) {
        throw new Error(maybeError || "Load failed");
      }
      setData(payload as DashboardPayload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const runAction = async (action: string, targetId: string, value?: string | boolean) => {
    const actionKey = `${action}:${targetId}:${String(value ?? "")}`;
    setBusyAction(actionKey);
    try {
      const res = await fetch("/api/admin/dashboard/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          targetId,
          value: value ?? null,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "Action failed");
      }
      toast.success("Action completed");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  const users = useMemo(() => {
    const source = data?.users || [];
    const query = userSearch.trim().toLowerCase();
    if (!query) return source;
    return source.filter((user) => {
      const username = String(user.username || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const fullName = String(user.full_name || "").toLowerCase();
      return username.includes(query) || email.includes(query) || fullName.includes(query);
    });
  }, [data?.users, userSearch]);

  const metrics = data?.metrics;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Founder Admin Dashboard</h1>
            <p className="text-sm text-zinc-400">Operational control over users, marketplace, payments and audit.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={loadDashboard} className="bg-white text-black hover:bg-zinc-200" disabled={loading}>
              Refresh
            </Button>
            <Link href="/admin/escrow">
              <Button variant="outline" className="border-zinc-700 text-zinc-200">
                Escrow Control
              </Button>
            </Link>
            <Link href="/admin/proxy-orders">
              <Button variant="outline" className="border-zinc-700 text-zinc-200">
                Proxy Orders
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle>{metrics?.totalUsers ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="pb-2">
              <CardDescription>Seller Pending</CardDescription>
              <CardTitle>{metrics?.sellerPending ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="pb-2">
              <CardDescription>Open Requests</CardDescription>
              <CardTitle>{metrics?.requestsOpen ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="pb-2">
              <CardDescription>Escrow Awaiting Release</CardDescription>
              <CardTitle>{metrics?.listingPaymentsAwaitingRelease ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-zinc-900/50">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardHeader>
                <CardTitle>User Center</CardTitle>
                <CardDescription>Roles, seller verification and admin privileges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search by handle, email, or name"
                  className="max-w-md border-zinc-700 bg-black"
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-zinc-400">
                        <th className="p-2">User</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Seller</th>
                        <th className="p-2">Admin</th>
                        <th className="p-2">Created</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const toggleAdminKey = `user.toggleAdmin:${user.id}:${String(!user.is_admin)}`;
                        const verifySellerKey = `user.setSellerStatus:${user.id}:verified`;
                        const rejectSellerKey = `user.setSellerStatus:${user.id}:rejected`;
                        const setSellerRoleKey = `user.setRole:${user.id}:seller`;
                        return (
                          <tr key={user.id} className="border-b border-zinc-900">
                            <td className="p-2">
                              <div className="font-medium text-white">
                                {user.username ? `@${String(user.username).replace(/^@+/, "")}` : user.full_name || shortId(user.id)}
                              </div>
                              <div className="text-xs text-zinc-500">{user.email || "-"}</div>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline">{user.role_preference || "buyer"}</Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline">{user.seller_status || "unverified"}</Badge>
                            </td>
                            <td className="p-2">{user.is_admin ? "yes" : "no"}</td>
                            <td className="p-2 text-zinc-400">{formatDate(user.created_at)}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-700"
                                  disabled={busyAction === verifySellerKey}
                                  onClick={() => runAction("user.setSellerStatus", user.id, "verified")}
                                >
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-700"
                                  disabled={busyAction === rejectSellerKey}
                                  onClick={() => runAction("user.setSellerStatus", user.id, "rejected")}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-700"
                                  disabled={busyAction === setSellerRoleKey}
                                  onClick={() => runAction("user.setRole", user.id, "seller")}
                                >
                                  Seller Role
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-white text-black hover:bg-zinc-200"
                                  disabled={busyAction === toggleAdminKey}
                                  onClick={() => runAction("user.toggleAdmin", user.id, !user.is_admin)}
                                >
                                  {user.is_admin ? "Remove Admin" : "Make Admin"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="border-zinc-800 bg-zinc-900/40">
                <CardHeader>
                  <CardTitle>Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.requests || []).map((request) => {
                    const closeKey = `request.setStatus:${request.id}:closed`;
                    return (
                      <div key={request.id} className="rounded-lg border border-zinc-800 p-3">
                        <div className="line-clamp-1 font-medium">{request.title}</div>
                        <div className="text-xs text-zinc-400">{request.creator_handle}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline">{request.status}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700"
                            disabled={busyAction === closeKey}
                            onClick={() =>
                              runAction("request.setStatus", request.id, request.status === "closed" ? "open" : "closed")
                            }
                          >
                            {request.status === "closed" ? "Reopen" : "Close"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900/40">
                <CardHeader>
                  <CardTitle>Offers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.offers || []).map((offer) => {
                    const rejectKey = `offer.setStatus:${offer.id}:rejected`;
                    return (
                      <div key={offer.id} className="rounded-lg border border-zinc-800 p-3">
                        <div className="font-medium">{offer.creator_handle}</div>
                        <div className="text-xs text-zinc-400">Request {shortId(offer.request_id)}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline">{offer.status}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700"
                            disabled={busyAction === rejectKey}
                            onClick={() => runAction("offer.setStatus", offer.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900/40">
                <CardHeader>
                  <CardTitle>Deals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.deals || []).map((deal) => {
                    const cancelKey = `deal.setStatus:${deal.id}:cancelled`;
                    return (
                      <div key={deal.id} className="rounded-lg border border-zinc-800 p-3">
                        <div className="font-medium">
                          {deal.buyer_handle} {"->"} {deal.seller_handle}
                        </div>
                        <div className="text-xs text-zinc-400">Deal {shortId(deal.id)}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline">{deal.status}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700"
                            disabled={busyAction === cancelKey}
                            onClick={() => runAction("deal.setStatus", deal.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardHeader>
                <CardTitle>Escrow and Payments</CardTitle>
                <CardDescription>Real data from listing payments and intent risk counters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-zinc-800 p-4">
                    <div className="text-sm text-zinc-400">Offers pending</div>
                    <div className="text-2xl font-semibold">{metrics?.offersPending ?? "-"}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 p-4">
                    <div className="text-sm text-zinc-400">Deals in verification</div>
                    <div className="text-2xl font-semibold">{metrics?.dealsVerification ?? "-"}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 p-4">
                    <div className="text-sm text-zinc-400">Payment intents disputed</div>
                    <div className="text-2xl font-semibold">{metrics?.paymentIntentsDisputed ?? "-"}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-zinc-400">
                        <th className="p-2">Payment</th>
                        <th className="p-2">Payer</th>
                        <th className="p-2">Payee</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.listingPayments || []).map((payment) => (
                        <tr key={payment.id} className="border-b border-zinc-900">
                          <td className="p-2 text-zinc-300">{shortId(payment.id)}</td>
                          <td className="p-2">{payment.payer_handle}</td>
                          <td className="p-2">{payment.payee_handle}</td>
                          <td className="p-2">
                            {payment.amount} {payment.currency} ({payment.chain})
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">{payment.status}</Badge>
                          </td>
                          <td className="p-2 text-zinc-400">{formatDate(payment.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardHeader>
                <CardTitle>Security and Access</CardTitle>
                <CardDescription>Critical controls for roles, payout risk and admin operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <div className="rounded-lg border border-zinc-800 p-4">
                  Admin routes are protected by `admin_token`, with founder-gated access to `/admin/login`.
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  Seller onboarding and status can be reviewed in the Users tab with direct write actions.
                </div>
                <div className="rounded-lg border border-zinc-800 p-4">
                  Escrow release operations are isolated in dedicated control at `/admin/escrow` with idempotency.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardHeader>
                <CardTitle>Recent Audit Logs</CardTitle>
                <CardDescription>Latest admin actions and payment transitions.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-zinc-400">
                      <th className="p-2">Action</th>
                      <th className="p-2">Target Type</th>
                      <th className="p-2">Target ID</th>
                      <th className="p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.auditLogs || []).map((log) => (
                      <tr key={log.id} className="border-b border-zinc-900">
                        <td className="p-2">{log.action}</td>
                        <td className="p-2">{log.target_type || "-"}</td>
                        <td className="p-2">{log.target_id ? shortId(log.target_id) : "-"}</td>
                        <td className="p-2 text-zinc-400">{formatDate(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
