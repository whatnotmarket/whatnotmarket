import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdminRequest } from "@/lib/admin-auth";

type ProfileRow = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  role_preference?: "buyer" | "seller" | "both" | null;
  seller_status?: "unverified" | "pending_telegram" | "verified" | "rejected" | null;
  onboarding_status?: "started" | "completed" | null;
  is_admin?: boolean | null;
  telegram_user_id?: string | null;
  telegram_username?: string | null;
  created_at?: string;
  updated_at?: string;
  account_status?: "active" | "suspended" | "banned" | null;
  session_force_logout_at?: string | null;
};

type WalletRow = {
  id: string;
  user_id: string;
  address: string;
  chain: string;
  provider: string;
  verified_at: string | null;
  created_at: string;
};

type IdentityRow = {
  auth_subject: string;
  provider: string;
  supabase_user_id: string;
  email: string | null;
  created_at: string;
};

type RequestRow = {
  id: string;
  title: string;
  status: "open" | "accepted" | "closed";
  created_by: string;
  created_at: string;
};

type OfferRow = {
  id: string;
  request_id: string;
  price: number;
  status: "pending" | "accepted" | "rejected";
  created_by: string;
  created_at: string;
};

type DealRow = {
  id: string;
  request_id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  status: "verification" | "completed" | "cancelled";
  created_at: string;
};

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
  status: string;
  escrow_reference: string;
  tx_hash_in: string | null;
  tx_hash_out: string | null;
  created_at: string;
};

type PaymentIntentRow = {
  id: string;
  deal_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  expected_amount: number;
  pay_chain_id: string;
  pay_token_id: string;
  detected_tx_hash: string | null;
  deposit_address: string;
  created_at: string;
  updated_at: string;
};

type LedgerRow = {
  id: string;
  deal_id: string | null;
  type: "deposit" | "fee" | "payout" | "refund" | "adjustment";
  currency: string;
  network: string;
  amount: number;
  tx_hash: string | null;
  created_at: string;
};

type SellerVerificationRow = {
  id: string;
  telegram_user_id: string | null;
  telegram_username: string | null;
  status: "issued" | "used" | "expired";
  issued_at: string;
  expires_at: string;
  used_at: string | null;
  used_by_user_id: string | null;
};

type InviteCodeRow = {
  code: string;
  type: "buyer" | "seller" | "founder" | null;
  status: "active" | "used" | "revoked" | "expired" | "exhausted" | null;
  single_use: boolean | null;
  usage_limit: number | null;
  usage_count: number | null;
  created_by: string | null;
  last_used_by: string | null;
  last_used_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  expires_at: string | null;
  created_at: string;
};

type InviteUsageRow = {
  id: string;
  code: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  source: string | null;
  used_at: string;
  metadata: Record<string, unknown> | null;
};

type SellerInviteClaimRow = {
  code: string;
  user_id: string;
  email: string;
  claimed_at: string;
};

type NetworkRow = {
  id: string;
  name: string;
  type: string;
  chain_id: string | null;
  explorer_url: string | null;
  requires_memo_tag: boolean | null;
};

type CurrencyRow = {
  id: string;
  symbol: string;
  decimals: number;
  contract_address: string | null;
  network_id: string | null;
  is_stablecoin: boolean | null;
};

type SupportMatrixRow = {
  id: string;
  network_id: string | null;
  currency_id: string | null;
  adapter_type: string;
};

type AdminSettingRow = {
  key: string;
  value: Record<string, unknown> | null;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
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

type MessageRow = {
  id: string;
  deal_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type ProxyOrderRow = {
  id: string;
  tracking_id: string;
  product_url: string;
  product_name: string | null;
  telegram_username: string | null;
  status: string;
  total_paid: number;
  currency: string;
  created_at: string;
  city: string | null;
  country: string | null;
  region: string | null;
};

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function normalizeHandle(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "");
}

function displayHandle(profile: ProfileRow | undefined) {
  if (!profile) return "unknown";
  const handle = normalizeHandle(profile.username || "");
  if (handle) return `@${handle}`;
  return profile.full_name || profile.id.slice(0, 8);
}

function isoDaysBack(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function dayKey(dateIso: string | null | undefined) {
  if (!dateIso) return "";
  const value = new Date(dateIso);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
}

function initDailyPoints(days: number) {
  const points: Record<string, { date: string; users: number; requests: number; deals: number; payments: number; gmv: number }> =
    {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    points[key] = {
      date: key,
      users: 0,
      requests: 0,
      deals: 0,
      payments: 0,
      gmv: 0,
    };
  }
  return points;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const riskKeywordGroups: Array<{ label: string; tokens: string[] }> = [
  {
    label: "external_payment",
    tokens: ["outside platform", "outside whatnot", "wire transfer", "send usdt", "send btc"],
  },
  {
    label: "off_platform_contact",
    tokens: ["telegram me", "whatsapp", "discord", "email me"],
  },
  {
    label: "phishing",
    tokens: ["phishing", "wallet seed", "recovery phrase", "private key"],
  },
  {
    label: "pressure",
    tokens: ["trust me", "urgent", "only today", "act fast"],
  },
];

function riskFlagsForMessage(content: string) {
  const normalized = content.toLowerCase();
  return riskKeywordGroups
    .filter((group) => group.tokens.some((token) => normalized.includes(token)))
    .map((group) => group.label);
}

function isRiskMessage(content: string) {
  return riskFlagsForMessage(content).length > 0;
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
  const last30Iso = isoDaysBack(30);

  const [
    profilesRes,
    walletsRes,
    identitiesRes,
    requestsRes,
    offersRes,
    dealsRes,
    listingPaymentsRes,
    escrowActionsRes,
    paymentIntentsRes,
    ledgerRes,
    verificationsRes,
    inviteCodesRes,
    inviteUsageRes,
    sellerInviteClaimsRes,
    messagesRes,
    notificationsRes,
    proxyOrdersRes,
    auditLogsRes,
    followsRes,
    networksRes,
    currenciesRes,
    supportMatrixRes,
    adminSettingsRes,
    chartProfilesRes,
    chartRequestsRes,
    chartDealsRes,
    chartPaymentsRes,
    authUsersRes,
  ] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(300),
    admin
      .from("wallets")
      .select("id,user_id,address,chain,provider,verified_at,created_at")
      .order("created_at", { ascending: false })
      .limit(600),
    admin
      .from("auth_bridge_identities")
      .select("auth_subject,provider,supabase_user_id,email,created_at")
      .order("created_at", { ascending: false })
      .limit(600),
    admin
      .from("requests")
      .select("id,title,status,created_by,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("offers")
      .select("id,request_id,price,status,created_by,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("deals")
      .select("id,request_id,offer_id,buyer_id,seller_id,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("listing_payments")
      .select(
        "id,listing_id,payer_user_id,payee_user_id,payer_wallet_address,target_wallet_address,amount,currency,chain,status,escrow_reference,tx_hash_in,tx_hash_out,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(400),
    admin
      .from("escrow_actions")
      .select("id,payment_id,action_type,performed_by_user_id,notes,tx_hash,created_at")
      .order("created_at", { ascending: false })
      .limit(600),
    admin
      .from("payment_intents")
      .select(
        "id,deal_id,buyer_id,seller_id,status,expected_amount,pay_chain_id,pay_token_id,detected_tx_hash,deposit_address,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(400),
    admin
      .from("ledger_entries")
      .select("id,deal_id,type,currency,network,amount,tx_hash,created_at")
      .order("created_at", { ascending: false })
      .limit(600),
    admin
      .from("seller_verifications")
      .select("id,telegram_user_id,telegram_username,status,issued_at,expires_at,used_at,used_by_user_id")
      .order("issued_at", { ascending: false })
      .limit(300),
    admin
      .from("invite_codes")
      .select(
        "code,type,status,single_use,usage_limit,usage_count,created_by,last_used_by,last_used_at,notes,metadata,expires_at,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("invite_code_usages")
      .select("id,code,user_id,email,ip_address,user_agent,source,used_at,metadata")
      .order("used_at", { ascending: false })
      .limit(800),
    admin
      .from("seller_invite_code_claims")
      .select("code,user_id,email,claimed_at")
      .order("claimed_at", { ascending: false })
      .limit(300),
    admin
      .from("messages")
      .select("id,deal_id,sender_id,content,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(600),
    admin
      .from("notifications")
      .select("id,recipient_id,actor_id,type,title,body,link,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(600),
    admin
      .from("proxy_orders")
      .select("id,tracking_id,product_url,product_name,telegram_username,status,total_paid,currency,created_at,city,country,region")
      .order("created_at", { ascending: false })
      .limit(400),
    admin
      .from("audit_logs")
      .select("id,actor_id,action,target_type,target_id,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(600),
    admin.from("profile_follows").select("follower_id,following_id").limit(5000),
    admin.from("networks").select("id,name,type,chain_id,explorer_url,requires_memo_tag").limit(300),
    admin.from("currencies").select("id,symbol,decimals,contract_address,network_id,is_stablecoin").limit(600),
    admin.from("support_matrix").select("id,network_id,currency_id,adapter_type").limit(1200),
    admin.from("admin_settings").select("key,value,description,updated_by,updated_at").limit(300),
    admin.from("profiles").select("created_at").gte("created_at", last30Iso).limit(5000),
    admin.from("requests").select("created_at").gte("created_at", last30Iso).limit(5000),
    admin.from("deals").select("created_at").gte("created_at", last30Iso).limit(5000),
    admin
      .from("listing_payments")
      .select("created_at,amount,status")
      .gte("created_at", last30Iso)
      .limit(5000),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });

  const profiles = (profilesRes.data || []) as ProfileRow[];
  const wallets = (walletsRes.data || []) as WalletRow[];
  const identities = (identitiesRes.data || []) as IdentityRow[];
  const requests = (requestsRes.data || []) as RequestRow[];
  const offers = (offersRes.data || []) as OfferRow[];
  const deals = (dealsRes.data || []) as DealRow[];
  const listingPayments = (listingPaymentsRes.data || []) as ListingPaymentRow[];
  const escrowActions = (escrowActionsRes.data || []) as EscrowActionRow[];
  const paymentIntents = (paymentIntentsRes.data || []) as PaymentIntentRow[];
  const ledgerEntries = (ledgerRes.data || []) as LedgerRow[];
  const sellerVerifications = (verificationsRes.data || []) as SellerVerificationRow[];
  const inviteCodes = (inviteCodesRes.data || []) as InviteCodeRow[];
  const inviteUsages = (inviteUsageRes.data || []) as InviteUsageRow[];
  const sellerInviteClaims = (sellerInviteClaimsRes.data || []) as SellerInviteClaimRow[];
  const messages = (messagesRes.data || []) as MessageRow[];
  const notifications = (notificationsRes.data || []) as NotificationRow[];
  const proxyOrders = (proxyOrdersRes.data || []) as ProxyOrderRow[];
  const auditLogs = (auditLogsRes.data || []) as AuditLogRow[];
  const follows = (followsRes.data || []) as { follower_id: string; following_id: string }[];
  const networks = (networksRes.data || []) as NetworkRow[];
  const currencies = (currenciesRes.data || []) as CurrencyRow[];
  const supportMatrix = (supportMatrixRes.data || []) as SupportMatrixRow[];
  const adminSettings = (adminSettingsRes.data || []) as AdminSettingRow[];

  const profileById = new Map<string, ProfileRow>();
  profiles.forEach((profile) => profileById.set(profile.id, profile));

  const authUsers = authUsersRes.data?.users || [];
  const authById = new Map<
    string,
    { last_sign_in_at: string | null; banned_until: string | null; email: string | null }
  >();
  authUsers.forEach((user) => {
    authById.set(user.id, {
      last_sign_in_at: user.last_sign_in_at || null,
      banned_until: user.banned_until || null,
      email: user.email || null,
    });
  });

  const walletsByUserId = new Map<string, WalletRow[]>();
  wallets.forEach((wallet) => {
    const items = walletsByUserId.get(wallet.user_id) || [];
    items.push(wallet);
    walletsByUserId.set(wallet.user_id, items);
  });

  const identitiesByUserId = new Map<string, IdentityRow[]>();
  identities.forEach((identity) => {
    const items = identitiesByUserId.get(identity.supabase_user_id) || [];
    items.push(identity);
    identitiesByUserId.set(identity.supabase_user_id, items);
  });

  const inviteClaimByUserId = new Map<string, SellerInviteClaimRow>();
  sellerInviteClaims.forEach((claim) => {
    if (!inviteClaimByUserId.has(claim.user_id)) inviteClaimByUserId.set(claim.user_id, claim);
  });

  const inviteUsagesByCode = new Map<string, InviteUsageRow[]>();
  inviteUsages.forEach((usage) => {
    const code = String(usage.code || "");
    const items = inviteUsagesByCode.get(code) || [];
    items.push(usage);
    inviteUsagesByCode.set(code, items);
  });

  const inviteByUsedUser = new Map<string, InviteUsageRow>();
  inviteUsages.forEach((usage) => {
    if (usage.user_id && !inviteByUsedUser.has(usage.user_id)) {
      inviteByUsedUser.set(usage.user_id, usage);
    }
  });

  const followersCountByUser = new Map<string, number>();
  const followingCountByUser = new Map<string, number>();
  follows.forEach((follow) => {
    followersCountByUser.set(
      follow.following_id,
      (followersCountByUser.get(follow.following_id) || 0) + 1
    );
    followingCountByUser.set(
      follow.follower_id,
      (followingCountByUser.get(follow.follower_id) || 0) + 1
    );
  });

  const escrowActionsByPayment = new Map<string, EscrowActionRow[]>();
  escrowActions.forEach((action) => {
    const items = escrowActionsByPayment.get(action.payment_id) || [];
    items.push(action);
    escrowActionsByPayment.set(action.payment_id, items);
  });
  const userAuditByTarget = new Map<string, AuditLogRow[]>();
  auditLogs.forEach((log) => {
    const directTarget = String(log.target_id || "").trim();
    const metadataTarget = String(log.metadata?.raw_target_id || "").trim();
    const target = directTarget || metadataTarget;
    if (!target) return;
    const items = userAuditByTarget.get(target) || [];
    items.push(log);
    userAuditByTarget.set(target, items);
  });

  const identitySet = new Set<string>();
  requests.forEach((row) => identitySet.add(row.created_by));
  offers.forEach((row) => identitySet.add(row.created_by));
  deals.forEach((row) => {
    identitySet.add(row.buyer_id);
    identitySet.add(row.seller_id);
  });
  listingPayments.forEach((row) => {
    identitySet.add(row.payer_user_id);
    if (row.payee_user_id) identitySet.add(row.payee_user_id);
  });
  paymentIntents.forEach((row) => {
    identitySet.add(row.buyer_id);
    identitySet.add(row.seller_id);
  });
  messages.forEach((row) => identitySet.add(row.sender_id));
  notifications.forEach((row) => {
    identitySet.add(row.recipient_id);
    if (row.actor_id) identitySet.add(row.actor_id);
  });
  auditLogs.forEach((row) => {
    if (row.actor_id) identitySet.add(row.actor_id);
  });

  const chartPoints = initDailyPoints(30);
  (chartProfilesRes.data || []).forEach((row) => {
    const key = dayKey(row.created_at);
    if (chartPoints[key]) chartPoints[key].users += 1;
  });
  (chartRequestsRes.data || []).forEach((row) => {
    const key = dayKey(row.created_at);
    if (chartPoints[key]) chartPoints[key].requests += 1;
  });
  (chartDealsRes.data || []).forEach((row) => {
    const key = dayKey(row.created_at);
    if (chartPoints[key]) chartPoints[key].deals += 1;
  });
  ((chartPaymentsRes.data || []) as { created_at: string; amount: number; status: string }[]).forEach((row) => {
    const key = dayKey(row.created_at);
    if (!chartPoints[key]) return;
    chartPoints[key].payments += 1;
    if (["funded_to_escrow", "awaiting_release", "released"].includes(row.status)) {
      chartPoints[key].gmv += toNumber(row.amount);
    }
  });

  const paymentStatusChart = Object.entries(
    listingPayments.reduce<Record<string, number>>((acc, payment) => {
      const key = String(payment.status || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, value]) => ({ status, value }));

  const dealStatusChart = Object.entries(
    deals.reduce<Record<string, number>>((acc, deal) => {
      const key = String(deal.status || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, value]) => ({ status, value }));

  const ledgerFlowChart = Object.entries(
    ledgerEntries.reduce<Record<string, number>>((acc, entry) => {
      const key = String(entry.type || "unknown");
      acc[key] = (acc[key] || 0) + toNumber(entry.amount);
      return acc;
    }, {})
  ).map(([type, value]) => ({ type, value }));

  const gmv = listingPayments
    .filter((payment) => ["funded_to_escrow", "awaiting_release", "released"].includes(payment.status))
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const fees = ledgerEntries
    .filter((entry) => entry.type === "fee")
    .reduce((sum, entry) => sum + toNumber(entry.amount), 0);

  const paymentIntentTotal = paymentIntents.length;
  const paymentIntentDisputed = paymentIntents.filter((intent) => intent.status === "disputed").length;
  const paymentIntentRefunded = paymentIntents.filter((intent) => intent.status === "refunded").length;
  const paymentIntentConverted = paymentIntents.filter((intent) =>
    ["funded", "released"].includes(intent.status)
  ).length;

  const now = Date.now();
  const dau = authUsers.filter((user) => {
    if (!user.last_sign_in_at) return false;
    return now - new Date(user.last_sign_in_at).getTime() <= 24 * 60 * 60 * 1000;
  }).length;
  const wau = authUsers.filter((user) => {
    if (!user.last_sign_in_at) return false;
    return now - new Date(user.last_sign_in_at).getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const reusedWallets = new Map<string, Set<string>>();
  wallets.forEach((wallet) => {
    const key = `${wallet.chain}:${wallet.address.toLowerCase()}`;
    const set = reusedWallets.get(key) || new Set<string>();
    set.add(wallet.user_id);
    reusedWallets.set(key, set);
  });
  const reusedWalletRisks = Array.from(reusedWallets.entries())
    .filter(([, userIds]) => userIds.size > 1)
    .map(([walletKey, userIds]) => ({
      wallet: walletKey,
      userCount: userIds.size,
      users: Array.from(userIds),
    }));

  const duplicateTelegramMap = new Map<string, Set<string>>();
  profiles.forEach((profile) => {
    const key = normalizeHandle(profile.telegram_username || profile.telegram_user_id || "");
    if (!key) return;
    const set = duplicateTelegramMap.get(key) || new Set<string>();
    set.add(profile.id);
    duplicateTelegramMap.set(key, set);
  });
  const duplicateTelegramRisks = Array.from(duplicateTelegramMap.entries())
    .filter(([, userIds]) => userIds.size > 1)
    .map(([telegram, userIds]) => ({
      telegram,
      userCount: userIds.size,
      users: Array.from(userIds),
    }));

  const duplicateEmailMap = new Map<string, Set<string>>();
  profiles.forEach((profile) => {
    const email = String(profile.email || authById.get(profile.id)?.email || "")
      .trim()
      .toLowerCase();
    if (!email) return;
    const set = duplicateEmailMap.get(email) || new Set<string>();
    set.add(profile.id);
    duplicateEmailMap.set(email, set);
  });
  const duplicateEmailRisks = Array.from(duplicateEmailMap.entries())
    .filter(([, userIds]) => userIds.size > 1)
    .map(([email, userIds]) => ({
      email,
      userCount: userIds.size,
      users: Array.from(userIds),
    }));

  const allowedIdentityProviders = new Set([
    "walletconnect",
    "metamask",
    "trustwallet",
    "wallet",
    "google",
    "apple",
    "telegram",
  ]);
  const suspiciousProviders = identities
    .filter((identity) => !allowedIdentityProviders.has(String(identity.provider || "").toLowerCase()))
    .map((identity) => ({
      auth_subject: identity.auth_subject,
      provider: identity.provider,
      user_id: identity.supabase_user_id,
      created_at: identity.created_at,
    }));

  const flaggedMessages = messages
    .filter((row) => isRiskMessage(row.content))
    .map((row) => ({
      ...row,
      sender_handle: displayHandle(profileById.get(row.sender_id)),
      risk_flags: riskFlagsForMessage(row.content),
    }));

  const staleEscrowQueue = listingPayments.filter((payment) => {
    if (!["pending", "funded_to_escrow", "awaiting_release"].includes(payment.status)) return false;
    const ageMs = now - new Date(payment.created_at).getTime();
    return ageMs > 24 * 60 * 60 * 1000;
  }).length;

  const stalePaymentIntents = paymentIntents.filter((intent) => {
    if (!["created", "awaiting_payment", "detected", "confirming"].includes(intent.status)) return false;
    const ageMs = now - new Date(intent.created_at).getTime();
    return ageMs > 24 * 60 * 60 * 1000;
  }).length;

  const usersSection = profiles.map((profile) => {
    const authMeta = authById.get(profile.id);
    const linkedWallets = walletsByUserId.get(profile.id) || [];
    const linkedIdentities = identitiesByUserId.get(profile.id) || [];
    const inviteClaim = inviteClaimByUserId.get(profile.id) || null;
    const usedInvite = inviteByUsedUser.get(profile.id) || null;
    const changeHistory = (userAuditByTarget.get(profile.id) || []).slice(0, 20);
    return {
      id: profile.id,
      handle: normalizeHandle(profile.username || ""),
      username: profile.username || null,
      full_name: profile.full_name || null,
      email: profile.email || authMeta?.email || null,
      role_preference: profile.role_preference || "buyer",
      seller_status: profile.seller_status || "unverified",
      onboarding_status: profile.onboarding_status || "started",
      is_admin: Boolean(profile.is_admin),
      account_status: profile.account_status || "active",
      telegram_user_id: profile.telegram_user_id || null,
      telegram_username: profile.telegram_username || null,
      wallets: linkedWallets,
      identities: linkedIdentities,
      invite_used: inviteClaim?.code || usedInvite?.code || null,
      follower_count: followersCountByUser.get(profile.id) || 0,
      following_count: followingCountByUser.get(profile.id) || 0,
      last_sign_in_at: authMeta?.last_sign_in_at || null,
      banned_until: authMeta?.banned_until || null,
      session_force_logout_at: profile.session_force_logout_at || null,
      created_at: profile.created_at || null,
      updated_at: profile.updated_at || null,
      change_history: changeHistory,
    };
  });

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    metrics: {
      totalUsers: profiles.length,
      dau,
      wau,
      activeSellers: profiles.filter((profile) => profile.seller_status === "verified").length,
      sellerPending: profiles.filter((profile) => profile.seller_status === "pending_telegram").length,
      sellerVerified: profiles.filter((profile) => profile.seller_status === "verified").length,
      requestsOpen: requests.filter((row) => row.status === "open").length,
      offersPending: offers.filter((row) => row.status === "pending").length,
      dealsVerification: deals.filter((row) => row.status === "verification").length,
      listingPaymentsAwaitingRelease: listingPayments.filter((row) => row.status === "awaiting_release").length,
      proxyOrdersOpen: proxyOrders.filter((row) => !["COMPLETED", "CANCELLED"].includes(row.status)).length,
      unreadNotifications: notifications.filter((row) => !row.read_at).length,
      flaggedMessages: flaggedMessages.length,
      paymentIntentsDisputed: paymentIntentDisputed,
      gmv,
      feesGenerated: fees,
      paymentConversionRate:
        paymentIntentTotal > 0 ? Number(((paymentIntentConverted / paymentIntentTotal) * 100).toFixed(2)) : 0,
      refundRate:
        paymentIntentTotal > 0 ? Number(((paymentIntentRefunded / paymentIntentTotal) * 100).toFixed(2)) : 0,
      disputeRate:
        paymentIntentTotal > 0 ? Number(((paymentIntentDisputed / paymentIntentTotal) * 100).toFixed(2)) : 0,
      dealCreationRate:
        requests.length > 0 ? Number(((deals.length / requests.length) * 100).toFixed(2)) : 0,
      staleEscrowQueue,
      stalePaymentIntents,
    },
    charts: {
      activity: Object.values(chartPoints),
      payment_status: paymentStatusChart,
      deal_status: dealStatusChart,
      ledger_flow: ledgerFlowChart,
    },
    sections: {
      users: usersSection,
      seller_verifications: sellerVerifications.map((row) => ({
        ...row,
        used_by_handle: displayHandle(profileById.get(row.used_by_user_id || "")),
      })),
      invites: inviteCodes.map((invite) => ({
        ...invite,
        created_by_handle: displayHandle(profileById.get(invite.created_by || "")),
        last_used_by_handle: displayHandle(profileById.get(invite.last_used_by || "")),
        usages: (inviteUsagesByCode.get(invite.code) || []).slice(0, 30).map((usage) => ({
          ...usage,
          user_handle: displayHandle(profileById.get(usage.user_id || "")),
        })),
      })),
      invite_usages: inviteUsages.map((usage) => ({
        ...usage,
        user_handle: displayHandle(profileById.get(usage.user_id || "")),
      })),
      seller_invite_claims: sellerInviteClaims,
      identities,
      wallets,
      requests: requests.map((row) => ({
        ...row,
        creator_handle: displayHandle(profileById.get(row.created_by)),
      })),
      offers: offers.map((row) => ({
        ...row,
        creator_handle: displayHandle(profileById.get(row.created_by)),
      })),
      deals: deals.map((row) => ({
        ...row,
        buyer_handle: displayHandle(profileById.get(row.buyer_id)),
        seller_handle: displayHandle(profileById.get(row.seller_id)),
      })),
      listing_payments: listingPayments.map((row) => ({
        ...row,
        payer_handle: displayHandle(profileById.get(row.payer_user_id)),
        payee_handle: displayHandle(profileById.get(row.payee_user_id || "")),
        actions: escrowActionsByPayment.get(row.id) || [],
      })),
      payment_intents: paymentIntents.map((row) => ({
        ...row,
        buyer_handle: displayHandle(profileById.get(row.buyer_id)),
        seller_handle: displayHandle(profileById.get(row.seller_id)),
      })),
      ledger_entries: ledgerEntries,
      disputes: paymentIntents
        .filter((row) => ["disputed", "refunded", "failed"].includes(row.status))
        .map((row) => ({
          id: row.id,
          status: row.status,
          deal_id: row.deal_id,
          buyer_id: row.buyer_id,
          seller_id: row.seller_id,
          buyer_handle: displayHandle(profileById.get(row.buyer_id)),
          seller_handle: displayHandle(profileById.get(row.seller_id)),
          amount: row.expected_amount,
          currency: row.pay_token_id,
          chain: row.pay_chain_id,
          tx_hash: row.detected_tx_hash,
          timeline: (userAuditByTarget.get(row.id) || []).slice(0, 20),
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      messages: messages.map((row) => ({
        ...row,
        sender_handle: displayHandle(profileById.get(row.sender_id)),
        risk_flag: isRiskMessage(row.content),
        risk_flags: riskFlagsForMessage(row.content),
      })),
      notifications: notifications.map((row) => ({
        ...row,
        recipient_handle: displayHandle(profileById.get(row.recipient_id)),
        actor_handle: displayHandle(profileById.get(row.actor_id || "")),
      })),
      proxy_orders: proxyOrders,
      audit_logs: auditLogs.map((row) => ({
        ...row,
        actor_handle: displayHandle(profileById.get(row.actor_id || "")),
      })),
      risk: {
        reused_wallets: reusedWalletRisks,
        duplicate_telegrams: duplicateTelegramRisks,
        duplicate_emails: duplicateEmailRisks,
        suspicious_providers: suspiciousProviders,
        high_risk_messages: flaggedMessages
          .slice(0, 100)
          .map((row) => ({
            id: row.id,
            deal_id: row.deal_id,
            sender_id: row.sender_id,
            sender_handle: displayHandle(profileById.get(row.sender_id)),
            risk_flags: riskFlagsForMessage(row.content),
            preview: row.content.slice(0, 160),
            created_at: row.created_at,
          })),
      },
      system: {
        stale_escrow_queue: staleEscrowQueue,
        stale_payment_intents: stalePaymentIntents,
        pending_verifications_old: sellerVerifications.filter((row) => {
          if (row.status !== "issued") return false;
          const ageMs = now - new Date(row.issued_at).getTime();
          return ageMs > 24 * 60 * 60 * 1000;
        }).length,
        notifications_unread: notifications.filter((row) => !row.read_at).length,
        failed_payments: listingPayments.filter((row) => row.status === "failed").length,
        failed_payment_intents: paymentIntents.filter((row) => row.status === "failed").length,
      },
      config: {
        networks,
        currencies,
        support_matrix: supportMatrix,
        admin_settings: adminSettings.map((row) => ({
          ...row,
          updated_by_handle: displayHandle(profileById.get(row.updated_by || "")),
        })),
      },
      business: {
        totals: {
          users: profiles.length,
          sellers_verified: profiles.filter((profile) => profile.seller_status === "verified").length,
          requests: requests.length,
          offers: offers.length,
          deals: deals.length,
          listing_payments: listingPayments.length,
          payment_intents: paymentIntents.length,
          proxy_orders: proxyOrders.length,
        },
        conversion: {
          deal_creation_rate: requests.length > 0 ? Number(((deals.length / requests.length) * 100).toFixed(2)) : 0,
          payment_conversion_rate:
            paymentIntentTotal > 0 ? Number(((paymentIntentConverted / paymentIntentTotal) * 100).toFixed(2)) : 0,
          refund_rate: paymentIntentTotal > 0 ? Number(((paymentIntentRefunded / paymentIntentTotal) * 100).toFixed(2)) : 0,
          dispute_rate: paymentIntentTotal > 0 ? Number(((paymentIntentDisputed / paymentIntentTotal) * 100).toFixed(2)) : 0,
        },
        gmv,
        fees,
      },
      diagnostics: {
        query_errors: {
          wallets: walletsRes.error?.message || null,
          identities: identitiesRes.error?.message || null,
          requests: requestsRes.error?.message || null,
          offers: offersRes.error?.message || null,
          deals: dealsRes.error?.message || null,
          listing_payments: listingPaymentsRes.error?.message || null,
          escrow_actions: escrowActionsRes.error?.message || null,
          payment_intents: paymentIntentsRes.error?.message || null,
          ledger_entries: ledgerRes.error?.message || null,
          seller_verifications: verificationsRes.error?.message || null,
          invite_codes: inviteCodesRes.error?.message || null,
          invite_code_usages: inviteUsageRes.error?.message || null,
          messages: messagesRes.error?.message || null,
          notifications: notificationsRes.error?.message || null,
          proxy_orders: proxyOrdersRes.error?.message || null,
          audit_logs: auditLogsRes.error?.message || null,
          networks: networksRes.error?.message || null,
          currencies: currenciesRes.error?.message || null,
          support_matrix: supportMatrixRes.error?.message || null,
          admin_settings: adminSettingsRes.error?.message || null,
          auth_users: authUsersRes.error?.message || null,
        },
      },
    },
  });
}
