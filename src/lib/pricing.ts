/**
 * Utility for consistent pricing logic across the application.
 */

export const FEES = {
  SERVICE_FEE_RATE: 0.10, // 10%
  SHIPPING_FLAT_RATE: 15.00,
  NETWORK_FEE_FLAT: 5.00
};

export interface OrderCost {
  subtotal: number;
  serviceFee: number;
  shippingFee: number;
  networkFee: number;
  total: number;
}

export function calculateOrderCost(price: number, quantity: number): OrderCost {
  const subtotal = price * quantity;
  const serviceFee = subtotal * FEES.SERVICE_FEE_RATE;
  const shippingFee = FEES.SHIPPING_FLAT_RATE;
  const networkFee = FEES.NETWORK_FEE_FLAT;
  
  const total = subtotal + serviceFee + shippingFee + networkFee;

  return {
    subtotal,
    serviceFee,
    shippingFee,
    networkFee,
    total
  };
}
