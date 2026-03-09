-- Seed Data for Profile Page
INSERT INTO copy_website (page, section, key, label, content, content_type, locale)
VALUES
  -- Profile Stats & Labels
  ('/profile', 'stats', 'followers', 'Followers Label', 'Followers', 'plain', 'it'),
  ('/profile', 'stats', 'following', 'Following Label', 'Following', 'plain', 'it'),
  ('/profile', 'stats', 'member_since', 'Member Since Label', 'Member Since', 'plain', 'it'),
  ('/profile', 'stats', 'transactions', 'Transactions Label', 'Transactions', 'plain', 'it'),
  ('/profile', 'stats', 'delivery', 'Delivery Label', 'Delivery', 'plain', 'it'),
  ('/profile', 'stats', 'response_time', 'Response Time Label', 'Response Time', 'plain', 'it'),
  ('/profile', 'stats', 'last_30_days', 'Last 30 Days Label', 'Last 30 Days', 'plain', 'it'),
  ('/profile', 'stats', 'purchases', 'Purchases Label', 'Purchases', 'plain', 'it'),
  ('/profile', 'stats', 'ranking', 'Ranking Label', 'Ranking', 'plain', 'it'),
  ('/profile', 'stats', 'protection_level', 'Protection Level Label', 'Protection Level', 'plain', 'it'),
  ('/profile', 'stats', 'escrow_status', 'Escrow Status Title', 'Escrow Status', 'title', 'it'),
  ('/profile', 'stats', 'seller_status', 'Seller Status Title', 'Seller Status', 'title', 'it'),
  ('/profile', 'stats', 'buyer_status', 'Buyer Status Title', 'Buyer Status', 'title', 'it'),

  -- Profile Actions
  ('/profile', 'actions', 'follow', 'Follow Button', 'Follow', 'button', 'it'),
  ('/profile', 'actions', 'following', 'Following Button', 'Following', 'button', 'it'),
  ('/profile', 'actions', 'chat', 'Chat Button', 'Chat', 'button', 'it'),
  ('/profile', 'actions', 'block', 'Block Button', 'Block', 'button', 'it'),
  ('/profile', 'actions', 'unblock', 'Unblock Button', 'Unblock', 'button', 'it'),
  ('/profile', 'actions', 'report', 'Report Button', 'Report', 'button', 'it'),
  ('/profile', 'actions', 'edit_profile', 'Edit Profile Button', 'Modifica profilo', 'button', 'it'),
  ('/profile', 'actions', 'change_banner', 'Change Banner Button', 'Change Banner', 'button', 'it'),
  ('/profile', 'actions', 'drag_reposition', 'Drag Reposition Label', 'Drag to reposition', 'plain', 'it'),
  ('/profile', 'actions', 'cancel', 'Cancel Button', 'Annulla', 'button', 'it'),
  ('/profile', 'actions', 'save', 'Save Button', 'Salva', 'button', 'it'),

  -- Profile Content
  ('/profile', 'content', 'about', 'About Section Title', 'About', 'title', 'it'),
  ('/profile', 'content', 'my_offers', 'My Offers Tab', 'My Offers', 'plain', 'it'),
  ('/profile', 'content', 'what_i_buy', 'What I Buy Tab', 'What I Buy', 'plain', 'it'),
  ('/profile', 'content', 'reviews', 'Reviews Tab', 'Reviews', 'plain', 'it'),
  ('/profile', 'content', 'no_active_offers', 'No Active Offers Message', 'No active offers. Listings will appear here once they are created.', 'plain', 'it'),
  ('/profile', 'content', 'no_purchases', 'No Purchases Message', 'No purchases yet.', 'plain', 'it'),

  -- Profile Not Found / Loading
  ('/profile', 'status', 'not_found_title', 'Not Found Title', 'Profile not found', 'title', 'it'),
  ('/profile', 'status', 'not_found_desc', 'Not Found Description', 'This profile does not exist or is not available.', 'plain', 'it'),
  ('/profile', 'status', 'back_to_market', 'Back to Market Button', 'Back to Market', 'button', 'it')

ON CONFLICT (page, section, key, locale) 
DO UPDATE SET 
  content = EXCLUDED.content,
  label = EXCLUDED.label,
  content_type = EXCLUDED.content_type;
