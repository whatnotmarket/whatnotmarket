import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdminRequest } from "@/lib/admin-auth";
import { canTransitionStatus, type ListingPaymentStatus } from "@/lib/payments/listing-escrow";

const paymentStatuses: ListingPaymentStatus[] = [
  "pending",
  "funded_to_escrow",
  "awaiting_release",
  "released",
  "failed",
  "cancelled",
];

type ListingPaymentRow = {
  id: string;
  listing_id: string;
  payer_user_id: string;
  payee_user_id: string | null;
  payer_wallet_address: string;
  target_wallet_address: string;
  amount: number;
  currency: string;
  chain: string;
  status: ListingPaymentStatus;
  escrow_reference: string;
  tx_hash_in: string | null;
  tx_hash_out: string | null;
  created_at: string;
  updated_at?: string;
};

type EscrowActionRow = {
  id: string;
  payment_id: string;
  action_type: string;
  performed_by_user_id: string | null;
  notes: string | null;
  tx_hash: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
};

function clampLimit(value: string | null, fallback = 200) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(20, Math.min(500, Math.floor(parsed)));
}

function maybeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeHandle(profile?: ProfileRow) {
  if (!profile) return "unknown";
  const username = String(profile.username || "").trim().replace(/^@+/, "");
  if (username) return `@${username}`;
  return String(profile.full_name || profile.id.slice(0, 8));
}

function isListingPaymentStatus(value: string): value is ListingPaymentStatus {
  return paymentStatuses.includes(value as ListingPaymentStatus);
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

  const searchParams = request.nextUrl.searchParams;
  const limit = clampLimit(searchParams.get("limit"), 200);
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const statusRaw = String(searchParams.get("status") || "").trim().toLowerCase();
  const chain = String(searchParams.get("chain") || "").trim();
  const currency = String(searchParams.get("currency") || "").trim();
  const userFilter = String(searchParams.get("user") || "").trim();
  const listingFilter = String(searchParams.get("listing") || "").trim();
  const dealFilter = String(searchParams.get("deal") || "").trim();

  const statusFilter = statusRaw && statusRaw !== "all" ? statusRaw : null;
  if (statusFilter && !isListingPaymentStatus(statusFilter)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  let paymentsQuery = admin
    .from("listing_payments")
    .select(
      "id,listing_id,payer_user_id,payee_user_id,payer_wallet_address,target_wallet_address,amount,currency,chain,status,escrow_reference,tx_hash_in,tx_hash_out,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter) {
    paymentsQuery = paymentsQuery.eq("status", statusFilter);
  }
  if (chain) {
    paymentsQuery = paymentsQuery.ilike("chain", `%${chain}%`);
  }
  if (currency) {
    paymentsQuery = paymentsQuery.ilike("currency", `%${currency}%`);
  }
  if (userFilter && maybeUuid(userFilter)) {
    paymentsQuery = paymentsQuery.or(`payer_user_id.eq.${userFilter},payee_user_id.eq.${userFilter}`);
  }
  if (listingFilter) {
    paymentsQuery = paymentsQuery.ilike("listing_id", `%${listingFilter}%`);
  }

  const { data: paymentRows, error: paymentError } = await paymentsQuery;
  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  let payments = (paymentRows || []) as ListingPaymentRow[];

  if (dealFilter) {
    const dealNeedle = dealFilter.toLowerCase();
    const relatedUsers = new Set<string>();

    if (maybeUuid(dealFilter)) {
      const { data: relatedIntents } = await admin
        .from("payment_intents")
        .select("buyer_id,seller_id")
        .eq("deal_id", dealFilter)
        .limit(200);

      (relatedIntents || []).forEach((row) => {
        if (row.buyer_id) relatedUsers.add(String(row.buyer_id));
        if (row.seller_id) relatedUsers.add(String(row.seller_id));
      });
    }

    payments = payments.filter((payment) => {
      const listingMatch = String(payment.listing_id || "").toLowerCase().includes(dealNeedle);
      const escrowMatch = String(payment.escrow_reference || "").toLowerCase().includes(dealNeedle);
      const payerMatch = relatedUsers.has(String(payment.payer_user_id || ""));
      const payeeMatch = payment.payee_user_id ? relatedUsers.has(String(payment.payee_user_id)) : false;
      return listingMatch || escrowMatch || payerMatch || payeeMatch;
    });
  }

  if (q) {
    payments = payments.filter((payment) => {
      const values = [
        payment.id,
        payment.listing_id,
        payment.escrow_reference,
        payment.status,
        payment.currency,
        payment.chain,
        payment.tx_hash_in,
        payment.tx_hash_out,
        payment.payer_user_id,
        payment.payee_user_id,
        payment.payer_wallet_address,
        payment.target_wallet_address,
      ];
      return values.some((value) => String(value || "").toLowerCase().includes(q));
    });
  }

  const paymentIds = payments.map((payment) => payment.id);

  const { data: actionRows } = paymentIds.length
    ? await admin
        .from("escrow_actions")
        .select("id,payment_id,action_type,performed_by_user_id,notes,tx_hash,created_at")
        .in("payment_id", paymentIds)
        .order("created_at", { ascending: false })
    : { data: [] as EscrowActionRow[] };

  const actions = (actionRows || []) as EscrowActionRow[];

  const userIds = new Set<string>();
  payments.forEach((payment) => {
    userIds.add(payment.payer_user_id);
    if (payment.payee_user_id) userIds.add(payment.payee_user_id);
  });
  actions.forEach((action) => {
    if (action.performed_by_user_id) userIds.add(action.performed_by_user_id);
  });

  const { data: profileRows } = userIds.size
    ? await admin
        .from("profiles")
        .select("id,username,full_name")
        .in("id", Array.from(userIds))
    : { data: [] as ProfileRow[] };

  const profileById = new Map<string, ProfileRow>();
  (profileRows || []).forEach((profile) => profileById.set(profile.id, profile));

  const actionsByPayment = new Map<string, EscrowActionRow[]>();
  actions.forEach((action) => {
    const rows = actionsByPayment.get(action.payment_id) || [];
    rows.push(action);
    actionsByPayment.set(action.payment_id, rows);
  });

  let illegalTransitions = 0;
  actionsByPayment.forEach((rows) => {
    const chronological = [...rows]
      .filter((row) => isListingPaymentStatus(String(row.action_type || "")))
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

    for (let index = 1; index < chronological.length; index += 1) {
      const previous = chronological[index - 1].action_type as ListingPaymentStatus;
      const next = chronological[index].action_type as ListingPaymentStatus;
      if (previous !== next && !canTransitionStatus(previous, next)) {
        illegalTransitions += 1;
      }
    }
  });

  const statusBreakdown = payments.reduce<Record<string, number>>((acc, payment) => {
    const key = String(payment.status || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const queueStatuses = new Set<ListingPaymentStatus>([
    "pending",
    "funded_to_escrow",
    "awaiting_release",
  ]);

  const responsePayments = payments.map((payment) => {
    const paymentActions = actionsByPayment.get(payment.id) || [];
    return {
      ...payment,
      payer_handle: normalizeHandle(profileById.get(payment.payer_user_id)),
      payee_handle: normalizeHandle(profileById.get(payment.payee_user_id || "")),
      actions: paymentActions.map((action) => ({
        ...action,
        actor_handle: normalizeHandle(profileById.get(action.performed_by_user_id || "")),
      })),
    };
  });

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    filters: {
      q,
      status: statusFilter || "all",
      chain,
      currency,
      user: userFilter,
      listing: listingFilter,
      deal: dealFilter,
      limit,
    },
    metrics: {
      total_payments: payments.length,
      escrow_queue: payments.filter((payment) => queueStatuses.has(payment.status)).length,
      awaiting_release: payments.filter((payment) => payment.status === "awaiting_release").length,
      released: payments.filter((payment) => payment.status === "released").length,
      failed: payments.filter((payment) => payment.status === "failed").length,
      cancelled: payments.filter((payment) => payment.status === "cancelled").length,
      illegal_transitions: illegalTransitions,
    },
    status_breakdown: statusBreakdown,
    payments: responsePayments,
  });
}
