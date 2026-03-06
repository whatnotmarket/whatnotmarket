import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit, RateLimitResponse } from "@/lib/rate-limit";

type ProfileRow = {
  id: string;
  username: string | null;
  role_preference: "buyer" | "seller" | "both" | null;
};

function normalizeHandle(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function buildProfilePath(profile: ProfileRow) {
  const clean = normalizeHandle(profile.username || "");
  if (!clean) return null;
  const role = profile.role_preference === "seller" ? "seller" : "buyer";
  return `/${role}/@${encodeURIComponent(clean)}`;
}

async function findProfileByHandle(admin: ReturnType<typeof createAdminClient>, rawHandle: string) {
  const normalized = normalizeHandle(rawHandle);
  if (!normalized) return null;

  const tryEq = async (candidate: string) => {
    const { data, error } = await admin
      .from("profiles")
      .select("id,username,role_preference")
      .eq("username", candidate)
      .maybeSingle();
    if (error) return null;
    return data as ProfileRow | null;
  };

  const tryILike = async (candidate: string) => {
    const { data, error } = await admin
      .from("profiles")
      .select("id,username,role_preference")
      .ilike("username", candidate)
      .maybeSingle();
    if (error) return null;
    return data as ProfileRow | null;
  };

  return (
    (await tryEq(normalized)) ||
    (await tryEq(`@${normalized}`)) ||
    (await tryILike(normalized)) ||
    (await tryILike(`@${normalized}`))
  );
}

export async function POST(req: Request) {
  if (!checkRateLimit(req, 30)) {
    return RateLimitResponse();
  }

  try {
    const body = (await req.json()) as {
      followerHandle?: string;
      targetHandle?: string;
    };

    const followerHandle = String(body.followerHandle || "");
    const targetHandle = String(body.targetHandle || "");

    if (!followerHandle || !targetHandle) {
      return NextResponse.json(
        { ok: false, error: "followerHandle and targetHandle are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const follower = await findProfileByHandle(admin, followerHandle);
    if (!follower) {
      return NextResponse.json({ ok: false, error: "Follower profile not found" }, { status: 404 });
    }

    const target = await findProfileByHandle(admin, targetHandle);
    if (!target) {
      return NextResponse.json({ ok: false, error: "Target profile not found" }, { status: 404 });
    }

    if (follower.id === target.id) {
      return NextResponse.json({ ok: false, error: "Follower and target cannot be the same profile" }, { status: 400 });
    }

    // Ensure trigger fires every test run.
    await admin
      .from("profile_follows")
      .delete()
      .eq("follower_id", follower.id)
      .eq("following_id", target.id);

    const { error: insertError } = await admin.from("profile_follows").insert({
      follower_id: follower.id,
      following_id: target.id,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Follow test executed. Notification created for target profile.",
      follower: {
        id: follower.id,
        username: follower.username,
        path: buildProfilePath(follower),
      },
      target: {
        id: target.id,
        username: target.username,
        path: buildProfilePath(target),
      },
    });
  } catch (error) {
    console.error("Admin follow test error:", error);
    return NextResponse.json({ ok: false, error: "Failed to run follow notification test" }, { status: 500 });
  }
}

