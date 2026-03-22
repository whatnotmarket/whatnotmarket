import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/infra/supabase/supabase-server";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { evaluateFollowToggle } from "@/lib/domains/security/follow-guards";

const toggleFollowSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(["follow", "unfollow"]).default("follow"),
});

export async function POST(request: Request) {
  const preAuthLimit = checkRateLimitDetailed(request, { action: "follow_toggle" });
  if (!preAuthLimit.allowed) {
    return RateLimitResponse(preAuthLimit);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimitDetailed(request, {
    action: "follow_toggle",
    identifier: user.id,
  });
  if (!userLimit.allowed) {
    return RateLimitResponse(userLimit);
  }

  const parsed = toggleFollowSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid follow payload" }, { status: 400 });
  }

  const guard = evaluateFollowToggle({
    actorUserId: user.id,
    targetUserId: parsed.data.targetUserId,
    action: parsed.data.action,
  });
  if (!guard.allowed) {
    return NextResponse.json({ ok: false, error: guard.reason }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", parsed.data.targetUserId)
    .maybeSingle<{ id: string }>();

  if (!targetProfile?.id) {
    return NextResponse.json({ ok: false, error: "Target profile not found" }, { status: 404 });
  }

  if (parsed.data.action === "follow") {
    const { error } = await admin.from("follows").insert({
      follower_id: user.id,
      following_id: parsed.data.targetUserId,
    });

    if (error && error.code !== "23505") {
      if (error.code === "23514") {
        return NextResponse.json({ ok: false, error: "Invalid follow target" }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: "Unable to follow user" }, { status: 500 });
    }
  } else {
    const { error } = await admin
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", parsed.data.targetUserId);

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to unfollow user" }, { status: 500 });
    }
  }

  const { count } = await admin
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", parsed.data.targetUserId);

  return NextResponse.json({
    ok: true,
    following: parsed.data.action === "follow",
    followersCount: count ?? 0,
  });
}

