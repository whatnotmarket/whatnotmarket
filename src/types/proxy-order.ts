export type CryptoCurrency = "USDT" | "BTC" | "XMR" | "USDC";

export type OrderStatus = 
  | "PENDING_PURCHASE" 
  | "ORDER_PLACED" 
  | "PROCESSING" 
  | "SHIPPED" 
  | "COMPLETED" 
  | "CANCELLED";

export interface ProxyOrder {
  id: string;
  userId: string;
  productUrl: string;
  productName?: string;
  quantity: number;
  options?: string; // Size, color, variant as JSON string or text
  shippingAddress?: string;
  notes?: string;
  
  // Financials
  productPrice: number;
  serviceFee: number;
  totalPrice: number;
  currency: CryptoCurrency;
  
  // Status
  status: OrderStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Timeline events
  timeline: {
    status: OrderStatus;
    timestamp: Date;
    description?: string;
  }[];
}
