import { createAdminClient } from "@/lib/supabase-admin";

export type OrderStatus = 
  | "CREATED" 
  | "PLACED" 
  | "PROCESSING" 
  | "LOCKER_ASSIGNED" 
  | "READY_FOR_PICKUP" 
  | "PICKED_UP" 
  | "COMPLETED" 
  | "CANCELLED";

export interface OrderUpdate {
  status: OrderStatus;
  message: string;
  timestamp: string;
  metadata?: unknown;
}

export interface ProxyOrder {
  id: string;
  trackingId: string;
  trackingAccessToken?: string;
  productUrl: string;
  productName?: string;
  price: number;
  quantity: number;
  currency: string;
  network?: string;
  totalPaid: number;
  telegramUsername?: string;
  status: OrderStatus;
  updates: OrderUpdate[];
  createdAt: string;
  city?: string;
  country?: string;
  region?: string;
  lockerDetails?: {
    id: string;
    city: string;
    region: string;
    code?: string;
  };
}

type ProxyOrderRow = {
  id: string;
  tracking_id: string;
  tracking_access_token: string | null;
  product_url: string;
  product_name: string | null;
  price: number;
  quantity: number;
  currency: string;
  network: string | null;
  total_paid: number;
  telegram_username: string | null;
  status: string;
  updates: OrderUpdate[] | null;
  created_at: string;
  city: string | null;
  country: string | null;
  region: string | null;
  locker_details:
    | {
        id: string;
        city: string;
        region: string;
        code?: string;
      }
    | null;
};

// Map database row to ProxyOrder interface
function mapRowToOrder(row: ProxyOrderRow): ProxyOrder {
  return {
    id: row.id,
    trackingId: row.tracking_id,
    trackingAccessToken: row.tracking_access_token ?? undefined,
    productUrl: row.product_url,
    productName: row.product_name ?? undefined,
    price: row.price,
    quantity: row.quantity,
    currency: row.currency,
    network: row.network ?? undefined,
    totalPaid: row.total_paid,
    telegramUsername: row.telegram_username ?? undefined,
    status: row.status as OrderStatus,
    updates: row.updates || [],
    createdAt: row.created_at,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    region: row.region ?? undefined,
    lockerDetails: row.locker_details ?? undefined,
  };
}

export async function getOrders(): Promise<ProxyOrder[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("proxy_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (data as ProxyOrderRow[]).map(mapRowToOrder);
}

export async function saveOrder(order: ProxyOrder): Promise<void> {
  const supabase = createAdminClient();
  
  // Prepare data for insertion/update
  const orderData: Record<string, unknown> = {
    id: order.id,
    tracking_id: order.trackingId,
    tracking_access_token: order.trackingAccessToken ?? null,
    product_url: order.productUrl,
    product_name: order.productName,
    price: order.price,
    quantity: order.quantity,
    currency: order.currency,
    network: order.network,
    total_paid: order.totalPaid,
    telegram_username: order.telegramUsername,
    status: order.status,
    updates: order.updates,
    created_at: order.createdAt,
    city: order.city,
    country: order.country,
    region: order.region,
    locker_details: order.lockerDetails,
  };

  const { error } = await supabase
    .from("proxy_orders")
    .upsert(orderData, { onConflict: "id" });

  if (error) {
    console.error("Error saving order:", error);
    throw new Error("Failed to save order");
  }
}

export async function getOrderByTrackingId(trackingId: string): Promise<ProxyOrder | undefined> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("proxy_orders")
    .select("*")
    .eq("tracking_id", trackingId)
    .single();

  if (error || !data) {
    return undefined;
  }

  return mapRowToOrder(data);
}

export async function getOrderByTrackingAccess(
  trackingId: string,
  accessToken: string
): Promise<ProxyOrder | undefined> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("proxy_orders")
    .select("*")
    .eq("tracking_id", trackingId)
    .eq("tracking_access_token", accessToken)
    .single();

  if (error || !data) {
    return undefined;
  }

  return mapRowToOrder(data);
}

export async function getOrderById(id: string): Promise<ProxyOrder | undefined> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("proxy_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return mapRowToOrder(data);
}
