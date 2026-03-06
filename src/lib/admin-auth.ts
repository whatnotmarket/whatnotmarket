import "server-only";

import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function assertAdminRequest(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "admin") {
    throw new Error("Forbidden");
  }
}

