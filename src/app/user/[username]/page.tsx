import { notFound, redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { createClient } from "@/lib/supabase-server";

type UserProfilePageProps = {
  params: Promise<{ username: string }>;
};

function normalizeHandle(handle: string) {
  return handle
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const normalizedHandle = normalizeHandle(username);

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

  const canonicalHandle = String(profile.username || normalizedHandle)
    .replace(/^@+/, "")
    .toLowerCase();

  const resolvedRole =
    profile.role_preference === "seller"
      ? "seller"
      : profile.role_preference === "buyer"
        ? "buyer"
        : "buyer";

  return (
    <ProfileClient
      key={profile.id}
      targetProfileId={profile.id}
      targetHandle={canonicalHandle}
      routeRole={resolvedRole}
    />
  );
}

