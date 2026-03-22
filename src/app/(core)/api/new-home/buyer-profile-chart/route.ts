import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/infra/supabase/supabase-admin";

type DealRow = {
  created_at: string | null;
  status: string | null;
};

type TimedRow = {
  created_at: string | null;
};

type TimedRatingRow = {
  created_at: string | null;
  rating: number | null;
};

type TimedMessageRow = {
  created_at: string | null;
  is_deleted: boolean | null;
  message: string | null;
};

const querySchema = z.object({
  userId: z.string().uuid(),
});

function normalizeTimestamps(values: Array<string | null | undefined>) {
  const unixToIso = new Map<number, string>();

  for (const value of values) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (!Number.isFinite(ms)) continue;
    unixToIso.set(ms, new Date(ms).toISOString());
  }

  return Array.from(unixToIso.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([, iso]) => iso);
}

function normalizeRatingsHistory(rows: TimedRatingRow[]) {
  const byTime = new Map<number, number>();

  for (const row of rows) {
    if (!row.created_at || typeof row.rating !== "number" || !Number.isFinite(row.rating)) continue;
    const ms = new Date(row.created_at).getTime();
    if (!Number.isFinite(ms)) continue;
    byTime.set(ms, Number(row.rating.toFixed(2)));
  }

  return Array.from(byTime.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([ms, rating]) => ({
      time: new Date(ms).toISOString(),
      rating,
    }));
}

function isCiaoMessage(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (!text) return false;
  return /\bciao\b/i.test(text);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    userId: url.searchParams.get("userId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid userId" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { userId } = parsed.data;

    const [dealsResult, followsResult, reviewsResult, messagesResult] = await Promise.all([
      admin
        .from("deals")
        .select("created_at,status")
        .eq("buyer_id", userId)
        .in("status", ["completed", "dispute"]),
      admin.from("follows").select("created_at").eq("following_id", userId),
      admin.from("user_reviews").select("created_at,rating").eq("reviewee_id", userId),
      admin.from("global_chat_messages").select("created_at,is_deleted,message").eq("user_id", userId),
    ]);

    if (dealsResult.error || followsResult.error || messagesResult.error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            dealsResult.error?.message ||
            followsResult.error?.message ||
            messagesResult.error?.message ||
            "Unable to load buyer chart metrics",
        },
        { status: 500 }
      );
    }

    const deals = (dealsResult.data || []) as DealRow[];
    const follows = (followsResult.data || []) as TimedRow[];
    const messages = (messagesResult.data || []) as TimedMessageRow[];
    const reviews = reviewsResult.error ? [] : ((reviewsResult.data || []) as TimedRatingRow[]);

    const purchases = normalizeTimestamps(
      deals.filter((row) => row.status === "completed").map((row) => row.created_at)
    );
    const disputes = normalizeTimestamps(deals.filter((row) => row.status === "dispute").map((row) => row.created_at));
    const followers = normalizeTimestamps(follows.map((row) => row.created_at));
    const reviewTimestamps = normalizeTimestamps(reviews.map((row) => row.created_at));
    const ratingsHistory = normalizeRatingsHistory(reviews);
    const visibleMessages = messages.filter((row) => row.is_deleted !== true);
    const messageUpTimestamps = normalizeTimestamps(
      visibleMessages
        .filter((row) => !!String(row.message || "").trim() && !isCiaoMessage(row.message))
        .map((row) => row.created_at)
    );
    const messageDownTimestamps = normalizeTimestamps(
      visibleMessages.filter((row) => isCiaoMessage(row.message)).map((row) => row.created_at)
    );

    return NextResponse.json(
      {
        ok: true,
        events: {
          purchases,
          disputes,
          followers,
          reviews: reviewTimestamps,
          messagesUp: messageUpTimestamps,
          messagesDown: messageDownTimestamps,
          ratingsHistory,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load buyer chart metrics" }, { status: 500 });
  }
}

