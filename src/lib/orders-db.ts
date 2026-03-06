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
  metadata?: any;
}

export interface ProxyOrder {
  id: string;
  trackingId: string;
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

// Map database row to ProxyOrder interface
function mapRowToOrder(row: any): ProxyOrder {
  return {
    id: row.id,
    trackingId: row.tracking_id,
    productUrl: row.product_url,
    productName: row.product_name,
    price: row.price,
    quantity: row.quantity,
    currency: row.currency,
    network: row.network,
    totalPaid: row.total_paid,
    telegramUsername: row.telegram_username,
    status: row.status as OrderStatus,
    updates: row.updates || [],
    createdAt: row.created_at,
    city: row.city,
    country: row.country,
    region: row.region,
    lockerDetails: row.locker_details,
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

  return data.map(mapRowToOrder);
}

export async function saveOrder(order: ProxyOrder): Promise<void> {
  const supabase = createAdminClient();
  
  // Prepare data for insertion/update
  const orderData = {
    id: order.id,
    tracking_id: order.trackingId,
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
