-- Seed reference payment data and demo invite.

insert into public.networks (id, name, type, chain_id, explorer_url, requires_memo_tag)
values
  ('ethereum-mainnet', 'Ethereum', 'EVM', '1', 'https://etherscan.io', false),
  ('polygon-mainnet', 'Polygon', 'EVM', '137', 'https://polygonscan.com', false),
  ('base-mainnet', 'Base', 'EVM', '8453', 'https://basescan.org', false),
  ('bitcoin-mainnet', 'Bitcoin', 'UTXO', 'btc', 'https://mempool.space', false)
on conflict (id) do update
set
  name = excluded.name,
  type = excluded.type,
  chain_id = excluded.chain_id,
  explorer_url = excluded.explorer_url,
  requires_memo_tag = excluded.requires_memo_tag;

insert into public.currencies (id, symbol, decimals, contract_address, network_id, is_stablecoin)
values
  ('USDC-ETH', 'USDC', 6, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'ethereum-mainnet', true),
  ('USDT-ETH', 'USDT', 6, '0xdac17f958d2ee523a2206206994597c13d831ec7', 'ethereum-mainnet', true),
  ('ETH-ETH', 'ETH', 18, null, 'ethereum-mainnet', false),
  ('USDC-POLY', 'USDC', 6, '0x3c499c542cbb5e34904b1d7520e97bb3532217f9', 'polygon-mainnet', true),
  ('BTC-BTC', 'BTC', 8, null, 'bitcoin-mainnet', false)
on conflict (id) do update
set
  symbol = excluded.symbol,
  decimals = excluded.decimals,
  contract_address = excluded.contract_address,
  network_id = excluded.network_id,
  is_stablecoin = excluded.is_stablecoin;

insert into public.support_matrix (network_id, currency_id, adapter_type)
values
  ('ethereum-mainnet', 'USDC-ETH', 'mock'),
  ('ethereum-mainnet', 'USDT-ETH', 'mock'),
  ('ethereum-mainnet', 'ETH-ETH', 'mock'),
  ('polygon-mainnet', 'USDC-POLY', 'mock'),
  ('bitcoin-mainnet', 'BTC-BTC', 'mock')
on conflict (network_id, currency_id, adapter_type) do nothing;

insert into public.invite_codes (code, status, expires_at)
values ('VIP2026', 'active'::public.invite_status, null)
on conflict (code) do update
set
  status = excluded.status,
  expires_at = excluded.expires_at;
