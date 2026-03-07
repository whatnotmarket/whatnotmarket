
export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: Record<string, unknown>;
}

export interface Deal {
  id: string;
  status: string;
  amount: number;
  currency: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  transaction_id?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ProxyOrder {
  id: string;
  status: string;
  product_url: string;
  total_paid: number;
  currency: string;
  created_at: string;
  updated_at: string;
  tracking_id?: string;
}

export interface DashboardData {
  metrics: Record<string, number>;
  charts: {
    activity: Array<{ 
      date: string; 
      users?: number; 
      requests?: number; 
      deals?: number; 
      payments?: number 
    }>;
    payment_status?: Array<{ status: string; value: number }>;
    deal_status?: Array<{ status: string; value: number }>;
    ledger_flow?: Array<{ type: string; value: number }>;
  };
  sections: {
    users?: User[];
    deals?: Deal[];
    payments?: Payment[];
    proxy_orders?: ProxyOrder[];
    [key: string]: unknown[] | undefined;
  };
}

export interface EscrowDashboardData {
  metrics: Record<string, number>;
  status_breakdown: Record<string, number>;
  payments: Payment[];
}

export interface ProxyDashboardData {
  metrics: Record<string, number>;
  status_breakdown: Record<string, number>;
  orders: ProxyOrder[];
}

export interface CryptoWalletsPayload {
  wallets: Array<Record<string, unknown>>;
  warning?: string;
}
