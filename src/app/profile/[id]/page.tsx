import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { createAdminClient } from "@/lib/supabase-admin";

type ProfileBySlugPageProps = {
  params: Promise<{ id: string }>;
};

function decodeSlug(raw: string) {
  let value = raw.trim();
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }
  return value.trim();
}

function normalizeHandle(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function ProfileBySlugPage({ params }: ProfileBySlugPageProps) {
  const { id: rawSlug } = await params;
  const decodedSlug = decodeSlug(String(rawSlug || ""));

  if (!decodedSlug) {
    redirect("/profile");
  }

  if (isUuid(decodedSlug)) {
    return <ProfileClient targetProfileId={decodedSlug} />;
  }

  if (/^0x[a-fA-F0-9]{40}$/.test(decodedSlug)) {
    const walletAddress = decodedSlug.toLowerCase();
    const admin = createAdminClient();
    const { data } = await admin
      .from("auth_bridge_identities")
      .select("supabase_user_id")
      .ilike("auth_subject", `wallet:%:${walletAddress}`)
      .limit(1)
      .maybeSingle<{ supabase_user_id: string }>();

    if (data?.supabase_user_id) {
      return <ProfileClient targetProfileId={data.supabase_user_id} />;
    }

    return <ProfileClient targetHandle={walletAddress} />;
  }

  const handle = normalizeHandle(decodedSlug);
  if (!handle) {
    redirect("/profile");
  }

  return <ProfileClient targetHandle={handle} />;
}
