import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";

const proxyStatuses = [
  "CREATED",
  "PLACED",
  "PROCESSING",
  "LOCKER_ASSIGNED",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "COMPLETED",
  "CANCELLED",
] as const;

type ProxyStatus = (typeof proxyStatuses)[number];

type ProxyOrderRow = {
  id: string;
  tracking_id: string;
  product_url: string;
  product_name: string | null;
  price: number;
  quantity: number;
  currency: string;
  network: string | null;
  total_paid: number;
  telegram_username: string | null;
  status: string;
  updates: unknown[] | null;
  created_at: string;
  city: string | null;
  country: string | null;
  region: string | null;
  locker_details: Record<string, unknown> | null;
};

function clampLimit(value: string | null, fallback = 200) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(20, Math.min(500, Math.floor(parsed)));
}

function isProxyStatus(value: string): value is ProxyStatus {
  return proxyStatuses.includes(value as ProxyStatus);
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase admin connection is not configured" },
      { status: 500 }
    );
  }

  const params = request.nextUrl.searchParams;
  const limit = clampLimit(params.get("limit"), 200);
  const q = String(params.get("q") || "").trim().toLowerCase();
  const statusRaw = String(params.get("status") || "").trim().toUpperCase();
  const tracking = String(params.get("tracking") || "").trim();
  const telegram = String(params.get("telegram") || "").trim();
  const product = String(params.get("product") || "").trim();

  const status = statusRaw && statusRaw !== "ALL" ? statusRaw : null;
  if (status && !isProxyStatus(status)) {
    return NextResponse.json({ error: "Invalid proxy order status" }, { status: 400 });
  }

  let query = admin
    .from("proxy_orders")
    .select(
      "id,tracking_id,product_url,product_name,price,quantity,currency,network,total_paid,telegram_username,status,updates,created_at,city,country,region,locker_details"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (tracking) query = query.ilike("tracking_id", `%${tracking}%`);
  if (telegram) query = query.ilike("telegram_username", `%${telegram}%`);
  if (product) query = query.ilike("product_url", `%${product}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let orders = (data || []) as ProxyOrderRow[];

  if (q) {
    orders = orders.filter((order) => {
      const values = [
        order.id,
        order.tracking_id,
        order.product_url,
        order.product_name,
        order.telegram_username,
        order.status,
        order.currency,
        order.network,
        order.city,
        order.country,
        order.region,
      ];
      return values.some((value) => String(value || "").toLowerCase().includes(q));
    });
  }

  const statusBreakdown = orders.reduce<Record<string, number>>((acc, order) => {
    const key = String(order.status || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    filters: {
      q,
      status: status || "ALL",
      tracking,
      telegram,
      product,
      limit,
    },
    metrics: {
      total_orders: orders.length,
      open_orders: orders.filter((order) => !["COMPLETED", "CANCELLED"].includes(String(order.status))).length,
      completed_orders: orders.filter((order) => String(order.status) === "COMPLETED").length,
      cancelled_orders: orders.filter((order) => String(order.status) === "CANCELLED").length,
    },
    status_breakdown: statusBreakdown,
    orders,
  });
}

