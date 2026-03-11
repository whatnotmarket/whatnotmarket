-- Seed Data for Remaining Global Components & Features (Navbar, Footer, Onboarding, Chat)

INSERT INTO copy_website (page, section, key, label, content, content_type, locale)
VALUES
  -- NAVBAR
  ('/layout', 'navbar', 'for_business', 'For Business Link', 'For Business', 'plain', 'it'),
  ('/layout', 'navbar', 'create_request', 'Buyer CTA', 'Create request', 'button', 'it'),
  ('/layout', 'navbar', 'sell_something', 'Seller CTA', 'Sell something', 'button', 'it'),
  ('/layout', 'navbar', 'admin_panel', 'Admin CTA', 'Admin Panel', 'button', 'it'),

  -- ANNOUNCEMENT BAR
  ('/layout', 'announcement', 'text', 'Announcement Text', 'SIP & VoIP Solutions for Businesses.', 'plain', 'it'),
  ('/layout', 'announcement', 'subtext', 'Announcement Subtext', 'Start making calls in minutes with premium routes.', 'plain', 'it'),
  ('/layout', 'announcement', 'button', 'Announcement Button', 'Explore VoIP Deals', 'button', 'it'),

  -- FOOTER
  ('/layout', 'footer', 'about_title', 'About Title', 'About OpenlyMarket', 'title', 'it'),
  ('/layout', 'footer', 'about_link1', 'About Link 1', 'What is OpenlyMarket?', 'plain', 'it'),
  ('/layout', 'footer', 'about_link2', 'About Link 2', 'Download App', 'plain', 'it'),
  ('/layout', 'footer', 'about_link3', 'About Link 3', 'Loyalty Program', 'plain', 'it'),
  ('/layout', 'footer', 'about_link4', 'About Link 4', 'Newsroom', 'plain', 'it'),
  ('/layout', 'footer', 'about_link5', 'About Link 5', 'Reviews', 'plain', 'it'),
  ('/layout', 'footer', 'about_link6', 'About Link 6', 'Contact Us', 'plain', 'it'),
  ('/layout', 'footer', 'categories_title', 'Categories Title', 'Popular Categories', 'title', 'it'),
  ('/layout', 'footer', 'cat_link1', 'Cat Link 1', 'Accounts', 'plain', 'it'),
  ('/layout', 'footer', 'cat_link2', 'Cat Link 2', 'Gaming Items', 'plain', 'it'),
  ('/layout', 'footer', 'cat_link3', 'Cat Link 3', 'VoIP Numbers', 'plain', 'it'),
  ('/layout', 'footer', 'cat_link4', 'Cat Link 4', 'Software Keys', 'plain', 'it'),
  ('/layout', 'footer', 'cat_link5', 'Cat Link 5', 'Social Media', 'plain', 'it'),
  ('/layout', 'footer', 'cat_link6', 'Cat Link 6', 'Crypto Exchange', 'plain', 'it'),

  -- ONBOARDING
  ('/onboarding', 'steps', 'role', 'Step Role', 'Role', 'plain', 'it'),
  ('/onboarding', 'steps', 'payout', 'Step Payout', 'Payout', 'plain', 'it'),
  ('/onboarding', 'steps', 'verification', 'Step Verification', 'Verification', 'plain', 'it'),
  ('/onboarding', 'steps', 'complete', 'Step Complete', 'Complete', 'plain', 'it'),
  ('/onboarding', 'role', 'title', 'Role Title', 'Choose your role', 'title', 'it'),
  ('/onboarding', 'role', 'subtitle', 'Role Subtitle', 'How do you plan to use OpenlyMarket?', 'plain', 'it'),
  ('/onboarding', 'role', 'buyer_title', 'Buyer Title', 'I want to buy', 'plain', 'it'),
  ('/onboarding', 'role', 'buyer_desc', 'Buyer Desc', 'Browse listings and make requests.', 'plain', 'it'),
  ('/onboarding', 'role', 'seller_title', 'Seller Title', 'I want to sell', 'plain', 'it'),
  ('/onboarding', 'role', 'seller_desc', 'Seller Desc', 'List products and fulfill requests.', 'plain', 'it'),
  ('/onboarding', 'payout', 'title', 'Payout Title', 'Payout Details', 'title', 'it'),
  ('/onboarding', 'payout', 'subtitle', 'Payout Subtitle', 'Where should we send your earnings?', 'plain', 'it'),
  ('/onboarding', 'verification', 'title', 'Verification Title', 'Verify Identity', 'title', 'it'),
  ('/onboarding', 'verification', 'subtitle', 'Verification Subtitle', 'Link your Telegram account to verify.', 'plain', 'it'),
  ('/onboarding', 'complete', 'title', 'Complete Title', 'All Set!', 'title', 'it'),
  ('/onboarding', 'complete', 'subtitle', 'Complete Subtitle', 'You are ready to start trading.', 'plain', 'it'),
  ('/onboarding', 'complete', 'button', 'Complete Button', 'Go to Market', 'button', 'it'),

  -- CHAT / INBOX
  ('/inbox', 'sidebar', 'title', 'Sidebar Title', 'Messages', 'title', 'it'),
  ('/inbox', 'sidebar', 'search_placeholder', 'Search Placeholder', 'Search messages...', 'plain', 'it'),
  ('/inbox', 'sidebar', 'empty', 'Empty State', 'No conversations yet.', 'plain', 'it'),
  ('/inbox', 'chat', 'placeholder_title', 'Placeholder Title', 'Select a conversation', 'title', 'it'),
  ('/inbox', 'chat', 'placeholder_desc', 'Placeholder Desc', 'Choose a chat from the sidebar to start messaging.', 'plain', 'it'),
  ('/inbox', 'chat', 'input_placeholder', 'Input Placeholder', 'Type a message...', 'plain', 'it'),
  ('/inbox', 'chat', 'send_button', 'Send Button', 'Send', 'button', 'it')

ON CONFLICT (page, section, key, locale) 
DO UPDATE SET 
  content = EXCLUDED.content,
  label = EXCLUDED.label,
  content_type = EXCLUDED.content_type;

