import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdminRequest } from "@/lib/admin-auth";

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
};

function displayHandle(profile: ProfileRow | undefined) {
  if (!profile) return "unknown";
  const handle = String(profile.username || "")
    .trim()
    .replace(/^@+/, "");
  if (handle) return `@${handle}`;
  return profile.full_name || profile.id.slice(0, 8);
}

async function countTable(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  filters: Record<string, string> = {}
) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  Object.entries(filters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });
  const { count } = await query;
  return count || 0;
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [
    totalUsers,
    sellerPending,
    sellerVerified,
    requestsOpen,
    offersPending,
    dealsVerification,
    listingPaymentsAwaitingRelease,
    paymentIntentsDisputed,
    usersRes,
    requestsRes,
    offersRes,
    dealsRes,
    listingPaymentsRes,
    auditLogsRes,
  ] = await Promise.all([
    countTable(admin, "profiles"),
    countTable(admin, "profiles", { seller_status: "pending_telegram" }),
    countTable(admin, "profiles", { seller_status: "verified" }),
    countTable(admin, "requests", { status: "open" }),
    countTable(admin, "offers", { status: "pending" }),
    countTable(admin, "deals", { status: "verification" }),
    countTable(admin, "listing_payments", { status: "awaiting_release" }),
    countTable(admin, "payment_intents", { status: "disputed" }),
    admin
      .from("profiles")
      .select("id,username,full_name,email,role_preference,seller_status,is_admin,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("requests")
      .select("id,title,status,created_by,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("offers")
      .select("id,request_id,price,status,created_by,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("deals")
      .select("id,status,buyer_id,seller_id,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("listing_payments")
      .select("id,listing_id,status,amount,currency,chain,payer_user_id,payee_user_id,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("audit_logs")
      .select("id,action,target_type,target_id,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const identityIds = new Set<string>();
  (requestsRes.data || []).forEach((row) => identityIds.add(String(row.created_by)));
  (offersRes.data || []).forEach((row) => identityIds.add(String(row.created_by)));
  (dealsRes.data || []).forEach((row) => {
    identityIds.add(String(row.buyer_id));
    identityIds.add(String(row.seller_id));
  });
  (listingPaymentsRes.data || []).forEach((row) => {
    identityIds.add(String(row.payer_user_id));
    if (row.payee_user_id) identityIds.add(String(row.payee_user_id));
  });

  const identityMap = new Map<string, ProfileRow>();
  if (identityIds.size > 0) {
    const { data: identityProfiles } = await admin
      .from("profiles")
      .select("id,username,full_name")
      .in("id", Array.from(identityIds));

    (identityProfiles || []).forEach((row) => {
      identityMap.set(row.id, row as ProfileRow);
    });
  }

  return NextResponse.json({
    metrics: {
      totalUsers,
      sellerPending,
      sellerVerified,
      requestsOpen,
      offersPending,
      dealsVerification,
      listingPaymentsAwaitingRelease,
      paymentIntentsDisputed,
    },
    users: usersRes.data || [],
    requests: (requestsRes.data || []).map((row) => ({
      ...row,
      creator_handle: displayHandle(identityMap.get(String(row.created_by))),
    })),
    offers: (offersRes.data || []).map((row) => ({
      ...row,
      creator_handle: displayHandle(identityMap.get(String(row.created_by))),
    })),
    deals: (dealsRes.data || []).map((row) => ({
      ...row,
      buyer_handle: displayHandle(identityMap.get(String(row.buyer_id))),
      seller_handle: displayHandle(identityMap.get(String(row.seller_id))),
    })),
    listingPayments: (listingPaymentsRes.data || []).map((row) => ({
      ...row,
      payer_handle: displayHandle(identityMap.get(String(row.payer_user_id))),
      payee_handle: displayHandle(identityMap.get(String(row.payee_user_id))),
    })),
    auditLogs: auditLogsRes.data || [],
  });
}
