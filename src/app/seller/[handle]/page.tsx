import { notFound, redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { createClient } from "@/lib/supabase-server";

type SellerProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
  const { handle } = await params;
  const normalizedHandle = handle
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
  if (!normalizedHandle) {
    redirect("/profile");
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

  const findByILike = async (value: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id,username,role_preference")
      .ilike("username", value)
      .maybeSingle();
    return data;
  };

  const profile =
    (await findBy(normalizedHandle)) ||
    (await findBy(`@${normalizedHandle}`)) ||
    (await findByILike(normalizedHandle)) ||
    (await findByILike(`@${normalizedHandle}`));

  if (!profile) {
    notFound();
  }

  const canonicalHandle = String(profile.username || normalizedHandle).replace(/^@+/, "").toLowerCase();

  const resolvedRole =
    profile.role_preference === "seller"
      ? "seller"
      : profile.role_preference === "buyer"
        ? "buyer"
        : "seller";

  return <ProfileClient targetProfileId={profile.id} targetHandle={canonicalHandle} routeRole={resolvedRole} />;
}
