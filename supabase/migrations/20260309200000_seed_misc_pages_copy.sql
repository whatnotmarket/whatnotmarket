-- Seed Data for Miscellaneous Pages (Legal, Features, Core Flows)

INSERT INTO copy_website (page, section, key, label, content, content_type, locale)
VALUES
  -- DISCLAIMER PAGE
  ('/disclaimer', 'content', 'title', 'Page Title', 'Disclaimer e Limitazione di Responsabilità', 'title', 'it'),
  ('/disclaimer', 'content', 'intro', 'Intro Text', 'Benvenuto su Whatnot Market. Prima di utilizzare i nostri servizi, ti preghiamo di leggere attentamente il seguente disclaimer.', 'textarea', 'it'),
  ('/disclaimer', 'content', 'role_title', 'Role Title', 'Ruolo della Piattaforma', 'title', 'it'),
  ('/disclaimer', 'content', 'role_text', 'Role Text', 'Whatnot Market opera esclusivamente come un intermediario tecnologico. La nostra piattaforma è un mezzo che permette agli utenti di pubblicare inserzioni per la vendita di beni o servizi. Non siamo proprietari, venditori, né gestori dei prodotti o servizi offerti nelle inserzioni.', 'textarea', 'it'),
  ('/disclaimer', 'content', 'liability_title', 'Liability Title', 'Nessuna Responsabilità sui Contenuti e sulle Transazioni', 'title', 'it'),
  ('/disclaimer', 'content', 'liability_text', 'Liability Text', 'Di conseguenza, dichiariamo esplicitamente che:', 'plain', 'it'),
  ('/disclaimer', 'content', 'point1', 'Point 1', 'Non siamo responsabili per le attività svolte dagli utenti sul sito. Ogni utente è direttamente e unicamente responsabile delle proprie azioni, delle informazioni fornite e delle obbligazioni contratte.', 'textarea', 'it'),
  ('/disclaimer', 'content', 'point2', 'Point 2', 'Non siamo responsabili per ciò che gli utenti vendono. La qualità, la sicurezza, la legalità e la veridicità degli articoli o servizi offerti sono di esclusiva responsabilità dell''utente che pubblica l''inserzione. Non effettuiamo alcuna verifica preventiva sui contenuti pubblicati.', 'textarea', 'it'),
  ('/disclaimer', 'content', 'point3', 'Point 3', 'Non siamo parte della transazione. Qualsiasi accordo, transazione o contratto stipulato tra gli utenti avviene direttamente tra di loro. Whatnot Market non è parte di tale rapporto e non assume alcuna responsabilità derivante da esso.', 'textarea', 'it'),
  ('/disclaimer', 'content', 'risk_title', 'Risk Title', 'Utilizzo a Proprio Rischio', 'title', 'it'),
  ('/disclaimer', 'content', 'risk_text', 'Risk Text', 'L''utilizzo della nostra piattaforma implica l''accettazione che ogni interazione e transazione è condotta a proprio rischio. Raccomandiamo agli utenti di adottare le dovute precauzioni e di agire con buonsenso durante la compravendita.', 'textarea', 'it'),
  ('/disclaimer', 'content', 'footer', 'Footer Text', 'Utilizzando Whatnot Market, accetti i termini di questo disclaimer e sollevi la piattaforma da qualsiasi responsabilità legata alle attività degli utenti e ai contenuti delle inserzioni.', 'textarea', 'it'),

  -- REFUND PAGE
  ('/refund', 'header', 'title', 'Page Title', 'Refund Policy', 'title', 'en'),
  ('/refund', 'header', 'subtitle', 'Page Subtitle', 'Your purchases are protected. Learn about our Escrow Guarantee and how we handle disputes.', 'textarea', 'en'),
  ('/refund', 'header', 'back_button', 'Back Button', 'Back', 'button', 'en'),
  ('/refund', 'features', 'escrow_title', 'Escrow Title', 'Escrow Protection', 'plain', 'en'),
  ('/refund', 'features', 'escrow_desc', 'Escrow Desc', 'Funds held safely until verified.', 'plain', 'en'),
  ('/refund', 'features', 'money_back_title', 'Money Back Title', 'Money Back', 'plain', 'en'),
  ('/refund', 'features', 'money_back_desc', 'Money Back Desc', 'Full refund if not delivered.', 'plain', 'en'),
  -- Add more sections as needed based on content

  -- OPEN SOURCE PAGE
  ('/open-source', 'header', 'title', 'Page Title', 'Open Source', 'title', 'it'),
  ('/open-source', 'header', 'subtitle', 'Page Subtitle', 'Trasparenza totale. Codice verificabile. Costruito dalla community, per la community.', 'textarea', 'it'),
  ('/open-source', 'header', 'back_button', 'Back Button', 'Indietro', 'button', 'it'),
  ('/open-source', 'philosophy', 'title', 'Philosophy Title', 'Perché Open Source?', 'title', 'it'),
  ('/open-source', 'philosophy', 'text1', 'Philosophy Text 1', 'Crediamo che un marketplace che gestisce valore e dati sensibili debba essere completamente trasparente. Rendendo il nostro codice pubblico, permettiamo a chiunque di verificare come vengono gestiti i dati, come funzionano gli smart contract (ove presenti) e come è costruita la sicurezza della piattaforma.', 'textarea', 'it'),
  ('/open-source', 'philosophy', 'text2', 'Philosophy Text 2', 'La sicurezza attraverso l''oscurità è un mito. La vera sicurezza nasce dalla verifica costante di migliaia di occhi esperti.', 'textarea', 'it'),
  ('/open-source', 'tech_stack', 'title', 'Tech Stack Title', 'Tech Stack Moderno', 'title', 'it'),
  ('/open-source', 'tech_stack', 'frontend_title', 'Frontend Title', 'Frontend', 'plain', 'it'),

  -- OPEN DISPUTE PAGE
  ('/open-dispute', 'header', 'title', 'Page Title', 'Open a Dispute', 'title', 'en'),
  ('/open-dispute', 'header', 'subtitle', 'Page Subtitle', 'Report an issue with an order. We''ll step in to help mediate and resolve the situation fairly.', 'textarea', 'en'),
  ('/open-dispute', 'header', 'back_button', 'Back Button', 'Back', 'button', 'en'),
  ('/open-dispute', 'form', 'warning', 'Warning Text', 'Please try to resolve the issue with the seller directly before opening a dispute.', 'textarea', 'en'),
  ('/open-dispute', 'form', 'order_id_label', 'Order ID Label', 'Order ID', 'plain', 'en'),
  ('/open-dispute', 'form', 'reason_label', 'Reason Label', 'Reason for Dispute', 'plain', 'en'),

  -- REDEEM PAGE
  ('/redeem', 'content', 'title', 'Page Title', 'Redeem Code', 'title', 'en'),
  ('/redeem', 'content', 'subtitle', 'Page Subtitle', 'Enter your gift card or promo code below to add credits to your balance.', 'textarea', 'en'),
  ('/redeem', 'content', 'placeholder', 'Input Placeholder', 'Enter code (e.g. GIFT-1234)', 'plain', 'en'),
  ('/redeem', 'content', 'button', 'Button Text', 'Redeem Code', 'button', 'en'),
  ('/redeem', 'content', 'success_title', 'Success Title', 'Success!', 'title', 'en'),
  ('/redeem', 'content', 'success_message', 'Success Message', 'Your code has been redeemed successfully.', 'plain', 'en'),
  ('/redeem', 'content', 'back_button', 'Back Button', 'Back to Market', 'button', 'en'),

  -- PROMOTE LISTINGS PAGE
  ('/promote-listings', 'header', 'title', 'Page Title', 'Promote Listings', 'title', 'en'),
  ('/promote-listings', 'header', 'subtitle', 'Page Subtitle', 'Boost your sales with Sponsored Listings.', 'textarea', 'en'),
  ('/promote-listings', 'form', 'seller_name_label', 'Seller Name Label', 'Seller Name', 'plain', 'en'),
  ('/promote-listings', 'form', 'listings_label', 'Listings Label', 'Listings to Promote', 'plain', 'en'),
  ('/promote-listings', 'form', 'duration_label', 'Duration Label', 'Duration', 'plain', 'en'),
  ('/promote-listings', 'form', 'notes_label', 'Notes Label', 'Notes', 'plain', 'en'),

  -- FEE CALCULATOR PAGE
  ('/fee-calculator', 'header', 'title', 'Page Title', 'Escrow Fee Calculator', 'title', 'en'),
  ('/fee-calculator', 'header', 'subtitle', 'Page Subtitle', 'Estimate escrow pricing in seconds with transparent fee tiers.', 'textarea', 'en'),
  ('/fee-calculator', 'calculator', 'amount_label', 'Amount Label', 'Transaction Amount', 'plain', 'en'),
  ('/fee-calculator', 'calculator', 'currency_label', 'Currency Label', 'Currency', 'plain', 'en'),
  ('/fee-calculator', 'calculator', 'payment_method_label', 'Payment Method Label', 'Payment Method', 'plain', 'en'),
  ('/fee-calculator', 'calculator', 'plan_label', 'Plan Label', 'Escrow Plan', 'plain', 'en'),
  ('/fee-calculator', 'results', 'total_fees', 'Total Fees Label', 'Total Fees', 'plain', 'en'),
  ('/fee-calculator', 'results', 'you_receive', 'You Receive Label', 'You Receive', 'plain', 'en'),

  -- REQUESTS NEW PAGE
  ('/requests/new', 'header', 'title', 'Page Title', 'Create a Request', 'title', 'en'),
  ('/requests/new', 'header', 'subtitle', 'Page Subtitle', 'Tell us what you are looking for.', 'textarea', 'en'),
  ('/requests/new', 'form', 'title_label', 'Title Label', 'Title', 'plain', 'en'),
  ('/requests/new', 'form', 'category_label', 'Category Label', 'Category', 'plain', 'en'),
  ('/requests/new', 'form', 'condition_label', 'Condition Label', 'Condition', 'plain', 'en'),
  ('/requests/new', 'form', 'budget_label', 'Budget Label', 'Budget Range', 'plain', 'en'),
  ('/requests/new', 'form', 'payment_label', 'Payment Label', 'Preferred Payment', 'plain', 'en'),
  ('/requests/new', 'form', 'delivery_label', 'Delivery Label', 'Delivery Time', 'plain', 'en'),
  ('/requests/new', 'form', 'desc_label', 'Description Label', 'Description', 'plain', 'en'),
  ('/requests/new', 'form', 'submit_button', 'Submit Button', 'Post Request', 'button', 'en'),

  -- SELL PAGE
  ('/sell', 'header', 'title', 'Page Title', 'Create Listing', 'title', 'en'),
  ('/sell', 'header', 'subtitle', 'Page Subtitle', 'List your item for sale.', 'textarea', 'en'),
  ('/sell', 'form', 'title_label', 'Title Label', 'Listing Title', 'plain', 'en'),
  ('/sell', 'form', 'category_label', 'Category Label', 'Category', 'plain', 'en'),
  ('/sell', 'form', 'condition_label', 'Condition Label', 'Condition', 'plain', 'en'),
  ('/sell', 'form', 'price_label', 'Price Label', 'Price', 'plain', 'en'),
  ('/sell', 'form', 'payment_label', 'Payment Label', 'Accepted Crypto', 'plain', 'en'),
  ('/sell', 'form', 'delivery_label', 'Delivery Label', 'Delivery Time', 'plain', 'en'),
  ('/sell', 'form', 'desc_label', 'Description Label', 'Description', 'plain', 'en'),
  ('/sell', 'form', 'submit_button', 'Submit Button', 'Publish Listing', 'button', 'en'),

  -- LOGIN PAGE
  ('/login', 'content', 'title', 'Page Title', 'Welcome to Whatnot Market', 'title', 'en'),
  ('/login', 'content', 'subtitle', 'Page Subtitle', 'Connect your wallet or social account to continue.', 'textarea', 'en'),
  ('/login', 'content', 'connect_wallet', 'Connect Wallet', 'Connect Wallet', 'button', 'en'),
  ('/login', 'content', 'continue_google', 'Continue with Google', 'Continue with Google', 'button', 'en'),
  ('/login', 'content', 'continue_telegram', 'Continue with Telegram', 'Continue with Telegram', 'button', 'en')

ON CONFLICT (page, section, key, locale) 
DO UPDATE SET 
  content = EXCLUDED.content,
  label = EXCLUDED.label,
  content_type = EXCLUDED.content_type;
