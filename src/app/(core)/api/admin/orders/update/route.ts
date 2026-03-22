import { assertAdminRequest } from "@/lib/domains/auth/admin-auth";
import { getOrderById,OrderStatus,saveOrder } from "@/lib/infra/db/orders-db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await assertAdminRequest(req);
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, status, message, metadata } = body;

    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Update status
    order.status = status as OrderStatus;
    
    // Add to timeline
    order.updates.push({
      status: status as OrderStatus,
      message,
      timestamp: new Date().toISOString(),
      metadata
    });

    // Handle specific status logic (e.g., Locker Assignment)
    if (status === "LOCKER_ASSIGNED" && metadata?.lockerId) {
      order.lockerDetails = {
        id: metadata.lockerId,
        city: metadata.city || order.city || "Unknown City",
        region: metadata.region || order.region || "Unknown Region"
      };
    }

    if (status === "READY_FOR_PICKUP" && metadata?.pickupCode) {
      if (order.lockerDetails) {
        order.lockerDetails.code = metadata.pickupCode;
      }
    }

    await saveOrder(order);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}

