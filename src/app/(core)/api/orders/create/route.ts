import { calculateOrderCost } from "@/lib/domains/payments/pricing";
import { AbuseGuardResponse,enforceAbuseGuard } from "@/lib/domains/security/abuse-guards";
import {
buildTrackingPath,
generateOrderId,
generateTrackingAccessToken,
generateTrackingId,
} from "@/lib/domains/security/order-tracking-guards";
import { ProxyOrder,saveOrder } from "@/lib/infra/db/orders-db";
import { checkRateLimitDetailed,RateLimitResponse } from "@/lib/infra/security/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const orderSchema = z.object({
  productUrl: z.string().url(),
  price: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  currency: z.enum(["USDC", "USDT", "ETH", "TRX"]).default("USDC"),
  network: z.string().default("ERC20"),
  telegramUsername: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
});

export async function POST(req: Request) {
  const rateLimit = checkRateLimitDetailed(req, { action: "order_create" });
  if (!rateLimit.allowed) {
    return RateLimitResponse(rateLimit);
  }

  const abuseGuard = await enforceAbuseGuard({
    request: req,
    action: "order_create",
    endpointGroup: "payment",
  });
  if (!abuseGuard.allowed) {
    return AbuseGuardResponse(abuseGuard);
  }

  try {
    const body = await req.json();
    
    // Zod Validation
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { 
      productUrl, 
      price, 
      quantity, 
      currency, 
      network, 
      telegramUsername,
      city,
      country,
      region
    } = validation.data;

    // Use consistent pricing logic
    const { total } = calculateOrderCost(price, quantity);

    const orderId = generateOrderId();

    const cleanUsername = telegramUsername ? telegramUsername.replace(/[^a-zA-Z0-9_]/g, "").trim() : "GUEST";
    const trackingId = generateTrackingId();
    const trackingAccessToken = generateTrackingAccessToken();

    const newOrder: ProxyOrder = {
      id: orderId,
      trackingId,
      trackingAccessToken,
      productUrl, // Already validated as URL
      price,
      quantity,
      currency,
      network,
      totalPaid: total,
      telegramUsername: cleanUsername,
      city,
      country,
      region,
      status: "CREATED",
      updates: [
        {
          status: "CREATED",
          message: "Order created. Waiting for admin confirmation.",
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    await saveOrder(newOrder);

    return NextResponse.json({
      ok: true,
      trackingId,
      trackingAccessToken,
      trackingPath: buildTrackingPath(trackingId, trackingAccessToken),
      orderId
    });

  } catch {
    console.error("Failed to create order"); // Removed error details from log to prevent leak
    return NextResponse.json(
      { ok: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}

