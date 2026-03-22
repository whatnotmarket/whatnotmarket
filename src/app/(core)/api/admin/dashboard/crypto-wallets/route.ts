import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";
import { createClient as createServerClient } from "@/lib/infra/supabase/supabase-server";

type WalletPayload = {
  id?: string;
  label?: string;
  network?: string;
  currency?: string;
  address?: string;
  memo_tag?: string | null;
  is_active?: boolean;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  note?: string | null;
};

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isWalletTableMissing(message: string | undefined) {
  const value = String(message || "").toLowerCase();
  return value.includes("admin_crypto_wallets") && (value.includes("does not exist") || value.includes("schema cache"));
}

async function resolveActorId() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
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

  const { data, error } = await admin
    .from("admin_crypto_wallets")
    .select("id,label,network,currency,address,memo_tag,is_active,notes,metadata,updated_by,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    if (isWalletTableMissing(error.message)) {
      return NextResponse.json({
        wallets: [],
        warning: "admin_crypto_wallets table is missing. Run latest migrations to enable wallet vault.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wallets: data || [] });
}

export async function POST(request: NextRequest) {
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

  const body = (await request.json().catch(() => ({}))) as WalletPayload;
  const id = asString(body.id);
  const label = asString(body.label);
  const network = asString(body.network);
  const currency = asString(body.currency);
  const address = asString(body.address);
  const memoTag = asString(body.memo_tag);
  const notes = asString(body.notes);
  const metadata = asObject(body.metadata);
  const internalNote = asString(body.note);
  const actorId = await resolveActorId();

  if (!network || !currency || !address) {
    return NextResponse.json({ error: "network, currency and address are required" }, { status: 400 });
  }

  const payload = {
    label: label || null,
    network,
    currency,
    address,
    memo_tag: memoTag || null,
    notes: notes || null,
    is_active: body.is_active ?? true,
    metadata,
    updated_by: actorId,
  };

  let row: Record<string, unknown> | null = null;
  if (id) {
    const { data, error } = await admin
      .from("admin_crypto_wallets")
      .update(payload)
      .eq("id", id)
      .select("id,label,network,currency,address,memo_tag,is_active,notes,metadata,updated_by,created_at,updated_at")
      .maybeSingle();

    if (error) {
      if (isWalletTableMissing(error.message)) {
        return NextResponse.json(
          { error: "admin_crypto_wallets table is missing. Run latest migrations first." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    row = data;
  } else {
    const { data, error } = await admin
      .from("admin_crypto_wallets")
      .insert(payload)
      .select("id,label,network,currency,address,memo_tag,is_active,notes,metadata,updated_by,created_at,updated_at")
      .maybeSingle();

    if (error) {
      if (isWalletTableMissing(error.message)) {
        return NextResponse.json(
          { error: "admin_crypto_wallets table is missing. Run latest migrations first." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    row = data;
  }

  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: id ? "admin_crypto_wallet_update" : "admin_crypto_wallet_create",
    target_type: "admin_crypto_wallet",
    target_id: id || null,
    metadata: {
      wallet_id: row?.id || id || null,
      network,
      currency,
      address,
      note: internalNote || null,
    },
  });

  return NextResponse.json({ ok: true, wallet: row });
}

export async function DELETE(request: NextRequest) {
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

  const id = asString(request.nextUrl.searchParams.get("id"));
  const body = (await request.json().catch(() => ({}))) as WalletPayload;
  const note = asString(body.note);

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const actorId = await resolveActorId();

  const { data, error } = await admin
    .from("admin_crypto_wallets")
    .delete()
    .eq("id", id)
    .select("id,network,currency,address")
    .maybeSingle();

  if (error) {
    if (isWalletTableMissing(error.message)) {
      return NextResponse.json(
        { error: "admin_crypto_wallets table is missing. Run latest migrations first." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: "admin_crypto_wallet_delete",
    target_type: "admin_crypto_wallet",
    target_id: id,
    metadata: {
      deleted_wallet: data,
      note: note || null,
    },
  });

  return NextResponse.json({ ok: true });
}

