import { notFound, redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { createClient } from "@/lib/supabase-server";

type BuyerProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export default async function BuyerProfilePage({ params }: BuyerProfilePageProps) {
  const { handle } = await params;
  const normalizedHandle = handle.trim().toLowerCase().replace(/^@+/, "");
  if (!normalizedHandle) {
    notFound();
  }

  const supabase = await createClient();

  const findBy = async (value: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id,username,role_preference")
      .eq("username", value)
      .maybeSingle();
    return data;
  };

  const profile =
    (await findBy(normalizedHandle)) ||
    (await findBy(`@${normalizedHandle}`)) ||
    (await (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,role_preference")
        .ilike("username", normalizedHandle)
        .maybeSingle();
      return data;
    })());

  if (!profile) {
    notFound();
  }

  const canonicalHandle = String(profile.username || normalizedHandle).replace(/^@+/, "").toLowerCase();

  if (profile.role_preference === "seller") {
    redirect(`/seller/@${encodeURIComponent(canonicalHandle)}`);
  }

  return <ProfileClient targetProfileId={profile.id} targetHandle={canonicalHandle} routeRole="buyer" />;
}
