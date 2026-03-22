import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RecentPayload = {
  query?: string;
  selectedItemId?: string | null;
};

const RECENT_COOKIE_NAME = "wm_search_recent";
const MAX_RECENT_QUERIES = 7;
const MAX_QUERY_LENGTH = 120;

function normalizeRecentQuery(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function parseRecentCookie(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeRecentQuery(entry))
      .filter((entry) => entry.length >= 2 && entry.length <= MAX_QUERY_LENGTH)
      .slice(0, MAX_RECENT_QUERIES);
  } catch {
    return [];
  }
}

function serializeRecentCookie(recent: string[]): string {
  return encodeURIComponent(JSON.stringify(recent.slice(0, MAX_RECENT_QUERIES)));
}

function applyRecentCookie(response: NextResponse, recent: string[]) {
  response.cookies.set(RECENT_COOKIE_NAME, serializeRecentCookie(recent), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
}

export async function GET(request: NextRequest) {
  const recent = parseRecentCookie(request.cookies.get(RECENT_COOKIE_NAME)?.value);
  return NextResponse.json({ ok: true, recentSearches: recent }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RecentPayload;
    const query = normalizeRecentQuery(payload.query);
    if (query.length < 2 || query.length > MAX_QUERY_LENGTH) {
      const recent = parseRecentCookie(request.cookies.get(RECENT_COOKIE_NAME)?.value);
      return NextResponse.json({ ok: true, recentSearches: recent }, { status: 200 });
    }

    const current = parseRecentCookie(request.cookies.get(RECENT_COOKIE_NAME)?.value);
    const next = [query, ...current.filter((entry) => entry.toLowerCase() !== query.toLowerCase())].slice(
      0,
      MAX_RECENT_QUERIES
    );

    const response = NextResponse.json({ ok: true, recentSearches: next }, { status: 200 });
    applyRecentCookie(response, next);
    return response;
  } catch {
    const current = parseRecentCookie(request.cookies.get(RECENT_COOKIE_NAME)?.value);
    return NextResponse.json({ ok: true, recentSearches: current }, { status: 200 });
  }
}

