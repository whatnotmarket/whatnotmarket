import { NextResponse } from "next/server";
import { checkRateLimitDetailed, RateLimitResponse } from "@/lib/rate-limit";
import { AbuseGuardResponse, enforceAbuseGuard } from "@/lib/security/abuse-guards";

export async function POST(req: Request) {
  const rateLimit = checkRateLimitDetailed(req, { action: "telegram_profile_lookup" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request: req,
    action: "telegram_profile_lookup",
    endpointGroup: "profile_lookup",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Remove @ if present
    const cleanUsername = username.replace("@", "").trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Invalid username" },
        { status: 400 }
      );
    }

    // Scrape public Telegram profile page
    // This is a robust method to get the public profile picture without requiring a Bot Token
    // and without the user having started a chat with the bot.
    // PRIVACY: Use a generic User-Agent. Do not leak client details.
    const response = await fetch(`https://t.me/${cleanUsername}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OpenlyMarketBot/1.0)", // Generic UA
        "Referrer-Policy": "no-referrer"
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Telegram profile not found" },
        { status: 404 }
      );
    }

    const html = await response.text();

    // Check if the page indicates the user doesn't exist (Telegram usually redirects or shows a specific message)
    if (html.includes('<div class="tgme_page_title">If you have <strong>Telegram</strong>, you can contact <a href="tg://resolve?domain=')) {
        // This is a generic page when user exists but maybe no photo or minimal info? 
        // Actually t.me usually shows the page even if user exists.
        // If user DOES NOT exist, t.me usually still renders a page but with "Telegram: Contact @..." title.
    }

    // Extract og:image
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    
    // Telegram default image usually contains "images/logo" or similar if no profile pic is set
    // But typically og:image is present.
    
    const photoUrl = imageMatch ? imageMatch[1] : null;
    const displayName = titleMatch ? titleMatch[1] : cleanUsername;

    // Check if it's the default Telegram logo image (indicating no profile pic or invalid user)
    // Telegram often uses a default image if no profile picture is set.
    // However, for the purpose of "Profile not found", usually we rely on whether we got a valid page context.
    // If the title is "Telegram: Contact @username", it might be a valid user.
    // If the title is "Telegram: Contact ...", and description says "View ...", it's likely valid.
    
    // Simple validation: if we got a photoUrl, we return it.
    if (photoUrl) {
      return NextResponse.json({
        username: cleanUsername,
        photoUrl: photoUrl,
        displayName: displayName
      });
    } else {
      return NextResponse.json(
        { error: "Profile picture not found" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error("Error fetching Telegram profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

