export type DealStatus = 
  | 'negotiating' 
  | 'offer_sent' 
  | 'buyer_offer_sent'
  | 'seller_counter_offer'
  | 'buyer_counter_offer'
  | 'offer_accepted' 
  | 'offer_rejected'
  | 'escrow_funded' 
  | 'shipped' 
  | 'completed' 
  | 'dispute' 
  | 'cancelled'
  | 'verification'; // Legacy

export interface Deal {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: DealStatus;
  price?: number;
  token_symbol?: string;
  quantity?: number;
  fee?: number;
  deal_type?: string;
  payment_type?: 'crypto' | 'fiat';
  fiat_method?: string;
  created_at: string;
  sender_id?: string; // Who initiated the CURRENT offer/counter-offer
  last_action_by?: string; // Who performed the last action
}

export interface Wallet {
  id: string;
  address: string;
  verified_at: string | null;
  chain: string;
}
