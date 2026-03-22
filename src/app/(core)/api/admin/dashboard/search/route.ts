import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";

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
        identities: [],
        requests: [],
        offers: [],
        deals: [],
        listing_payments: [],
        escrow_actions: [],
        payment_intents: [],
        proxy_orders: [],
        ledger_entries: [],
        payout_instructions: [],
        admin_settings: [],
        crypto_wallets: [],
        audit_logs: [],
        messages: [],
        notifications: [],
        invites: [],
        invite_code_usages: [],
        seller_verifications: [],
      },
    });
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
    identitiesRes,
    requestsRes,
    offersRes,
    dealsRes,
    listingPaymentsRes,
    escrowActionsRes,
    paymentIntentsRes,
    proxyOrdersRes,
    ledgerEntriesRes,
    payoutInstructionsRes,
    adminSettingsRes,
    cryptoWalletsRes,
    auditLogsRes,
    messagesRes,
    notificationsRes,
    invitesRes,
    inviteCodeUsagesRes,
    sellerVerificationsRes,
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
      .from("auth_bridge_identities")
      .select("auth_subject,provider,supabase_user_id,email,created_at")
      .or(
        [
          `auth_subject.ilike.${ilikeValue}`,
          `provider.ilike.${ilikeValue}`,
          `email.ilike.${ilikeValue}`,
          isUuid ? `supabase_user_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
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
      .from("escrow_actions")
      .select("id,payment_id,action_type,performed_by_user_id,notes,tx_hash,created_at")
      .or(
        [
          `action_type.ilike.${ilikeValue}`,
          `notes.ilike.${ilikeValue}`,
          `tx_hash.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `payment_id.eq.${query}` : "",
          isUuid ? `performed_by_user_id.eq.${query}` : "",
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
    admin
      .from("ledger_entries")
      .select("id,deal_id,type,currency,network,amount,tx_hash,created_at")
      .or(
        [
          `tx_hash.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `deal_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("payout_instructions")
      .select("id,user_id,payout_network,payout_currency,payout_address,payout_memo_tag,kyc_status,updated_at")
      .or(
        [
          `payout_network.ilike.${ilikeValue}`,
          `payout_currency.ilike.${ilikeValue}`,
          `payout_address.ilike.${ilikeValue}`,
          `payout_memo_tag.ilike.${ilikeValue}`,
          `kyc_status.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `user_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("admin_settings")
      .select("key,value,description,updated_at")
      .or(
        [
          `key.ilike.${ilikeValue}`,
          `description.ilike.${ilikeValue}`,
        ].join(",")
      )
      .limit(20),
    admin
      .from("admin_crypto_wallets")
      .select("id,label,network,currency,address,memo_tag,is_active,updated_at")
      .or(
        [
          `label.ilike.${ilikeValue}`,
          `network.ilike.${ilikeValue}`,
          `currency.ilike.${ilikeValue}`,
          `address.ilike.${ilikeValue}`,
          `memo_tag.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("audit_logs")
      .select("id,actor_id,action,target_type,target_id,metadata,created_at")
      .or(
        [
          `action.ilike.${ilikeValue}`,
          `target_type.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `actor_id.eq.${query}` : "",
          isUuid ? `target_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("messages")
      .select("id,deal_id,sender_id,content,created_at")
      .or(
        [
          `content.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `deal_id.eq.${query}` : "",
          isUuid ? `sender_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("notifications")
      .select("id,recipient_id,actor_id,type,title,body,link,created_at")
      .or(
        [
          `title.ilike.${ilikeValue}`,
          `body.ilike.${ilikeValue}`,
          `type.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `recipient_id.eq.${query}` : "",
          isUuid ? `actor_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("invite_codes")
      .select("code,type,status,expires_at,created_at")
      .or([`code.ilike.${ilikeValue}`, `type.ilike.${ilikeValue}`, `status.ilike.${ilikeValue}`].join(","))
      .limit(20),
    admin
      .from("invite_code_usages")
      .select("id,code,user_id,email,ip_address,source,used_at")
      .or(
        [
          `code.ilike.${ilikeValue}`,
          `email.ilike.${ilikeValue}`,
          `ip_address.ilike.${ilikeValue}`,
          `source.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `user_id.eq.${query}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(20),
    admin
      .from("seller_verifications")
      .select("id,telegram_user_id,telegram_username,status,used_by_user_id,issued_at,expires_at")
      .or(
        [
          `telegram_username.ilike.${ilikeValue}`,
          `telegram_user_id.ilike.${ilikeValue}`,
          `status.ilike.${ilikeValue}`,
          isUuid ? `id.eq.${query}` : "",
          isUuid ? `used_by_user_id.eq.${query}` : "",
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
      identities: identitiesRes.data || [],
      requests: requestsRes.data || [],
      offers: offersRes.data || [],
      deals: dealsRes.data || [],
      listing_payments: listingPaymentsRes.data || [],
      escrow_actions: escrowActionsRes.data || [],
      payment_intents: paymentIntentsRes.data || [],
      proxy_orders: proxyOrdersRes.data || [],
      ledger_entries: ledgerEntriesRes.data || [],
      payout_instructions: payoutInstructionsRes.data || [],
      admin_settings: adminSettingsRes.data || [],
      crypto_wallets: cryptoWalletsRes.data || [],
      audit_logs: auditLogsRes.data || [],
      messages: messagesRes.data || [],
      notifications: notificationsRes.data || [],
      invites: invitesRes.data || [],
      invite_code_usages: inviteCodeUsagesRes.data || [],
      seller_verifications: sellerVerificationsRes.data || [],
    },
  });
}


