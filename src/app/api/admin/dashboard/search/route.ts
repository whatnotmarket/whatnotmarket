import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdminRequest } from "@/lib/admin-auth";

function normalizeQuery(value: string | null) {
  return String(value || "").trim();
}

function maybeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = normalizeQuery(request.nextUrl.searchParams.get("q"));
  if (query.length < 2) {
    return NextResponse.json({
      query,
      results: {
        users: [],
        wallets: [],
        requests: [],
        offers: [],
        deals: [],
        listing_payments: [],
        payment_intents: [],
        proxy_orders: [],
      },
    });
  }

  const admin = createAdminClient();
  const ilikeValue = `%${query}%`;
  const isUuid = maybeUuid(query);

  const dealsPromise = isUuid
    ? admin
        .from("deals")
        .select("id,request_id,buyer_id,seller_id,status,created_at")
        .or(
          [
            `id.eq.${query}`,
            `request_id.eq.${query}`,
            `buyer_id.eq.${query}`,
            `seller_id.eq.${query}`,
          ].join(",")
        )
        .limit(20)
    : Promise.resolve({ data: [], error: null });

  const [
    usersRes,
    walletsRes,
    requestsRes,
    offersRes,
    dealsRes,
    listingPaymentsRes,
    paymentIntentsRes,
    proxyOrdersRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,username,full_name,email,telegram_username")
      .or(
        [
          `username.ilike.${ilikeValue}`,
          `full_name.ilike.${ilikeValue}`,
          `email.ilike.${ilikeValue}`,
          `telegram_username.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("wallets")
      .select("id,user_id,address,chain,provider")
      .or([`address.ilike.${ilikeValue}`, isUuid ? `id.eq.${query}` : ""].filter(Boolean).join(","))
      .limit(20),
    admin
      .from("requests")
      .select("id,title,status,created_by,created_at")
      .or([`title.ilike.${ilikeValue}`, isUuid ? `id.eq.${query}` : ""].filter(Boolean).join(","))
      .limit(20),
    admin
      .from("offers")
      .select("id,request_id,status,created_by,created_at")
      .or(
        [
          `request_id.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `request_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    dealsPromise,
    admin
      .from("listing_payments")
      .select("id,listing_id,status,escrow_reference,tx_hash_in,tx_hash_out,payer_user_id,payee_user_id,created_at")
      .or(
        [
          `listing_id.ilike.${ilikeValue}`,
          `escrow_reference.ilike.${ilikeValue}`,
          `tx_hash_in.ilike.${ilikeValue}`,
          `tx_hash_out.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("payment_intents")
      .select("id,deal_id,status,detected_tx_hash,deposit_address,created_at")
      .or(
        [
          `detected_tx_hash.ilike.${ilikeValue}`,
          `deposit_address.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `deal_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("proxy_orders")
      .select("id,tracking_id,telegram_username,product_url,status,created_at")
      .or(
        [
          `tracking_id.ilike.${ilikeValue}`,
          `telegram_username.ilike.${ilikeValue}`,
          `product_url.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
  ]);

  return NextResponse.json({
    query,
    results: {
      users: usersRes.data || [],
      wallets: walletsRes.data || [],
      requests: requestsRes.data || [],
      offers: offersRes.data || [],
      deals: dealsRes.data || [],
      listing_payments: listingPaymentsRes.data || [],
      payment_intents: paymentIntentsRes.data || [],
      proxy_orders: proxyOrdersRes.data || [],
    },
  });
}
