-- Seed Data for Functional Pages (Become Seller, Smart Search, Buy with Crypto, Secure Transaction)

INSERT INTO copy_website (page, section, key, label, content, content_type, locale)
VALUES
  -- BECOME SELLER PAGE
  ('/become-seller', 'header', 'title', 'Page Title', 'Diventa un Venditore', 'title', 'it'),
  ('/become-seller', 'header', 'subtitle', 'Page Subtitle', 'Unisciti al marketplace di nuova generazione. Nessuna censura, zero KYC, pagamenti in crypto.', 'textarea', 'it'),
  ('/become-seller', 'steps', 'step1_title', 'Step 1 Title', 'Requisiti Base', 'title', 'it'),
  ('/become-seller', 'steps', 'step1_subtitle', 'Step 1 Subtitle', 'Cosa serve per iniziare', 'plain', 'it'),
  ('/become-seller', 'steps', 'step2_title', 'Step 2 Title', 'Dettagli Applicazione', 'title', 'it'),
  ('/become-seller', 'steps', 'step2_subtitle', 'Step 2 Subtitle', 'Parlaci della tua attività', 'plain', 'it'),
  ('/become-seller', 'steps', 'step3_title', 'Step 3 Title', 'Verifica', 'title', 'it'),
  ('/become-seller', 'steps', 'step3_subtitle', 'Step 3 Subtitle', 'Invia la richiesta', 'plain', 'it'),
  ('/become-seller', 'requirements', 'fee_title', 'Fee Title', 'Entry Fee: $20', 'title', 'it'),
  ('/become-seller', 'requirements', 'fee_desc', 'Fee Desc', 'Una tantum per filtrare lo spam e garantire serietà.', 'textarea', 'it'),
  ('/become-seller', 'requirements', 'bond_title', 'Bond Title', 'Vendor Bond (Opzionale)', 'title', 'it'),
  ('/become-seller', 'requirements', 'bond_desc', 'Bond Desc', 'Deposito di garanzia per accedere a livelli superiori e badge "Verified".', 'textarea', 'it'),
  ('/become-seller', 'requirements', 'rules_title', 'Rules Title', 'Rispetto delle Regole', 'title', 'it'),
  ('/become-seller', 'requirements', 'rules_desc', 'Rules Desc', 'Nessuna truffa, prodotti legali, rispetto della privacy degli utenti.', 'textarea', 'it'),
  ('/become-seller', 'form', 'name_label', 'Name Label', 'Nome Venditore / Shop', 'plain', 'it'),
  ('/become-seller', 'form', 'category_label', 'Category Label', 'Categoria Principale', 'plain', 'it'),
  ('/become-seller', 'form', 'reviews_label', 'Reviews Label', 'Canale Recensioni (Telegram/Forum)', 'plain', 'it'),
  ('/become-seller', 'form', 'escrow_label', 'Escrow Label', 'Hai già usato Escrow?', 'plain', 'it'),
  ('/become-seller', 'form', 'notes_label', 'Notes Label', 'Note Aggiuntive', 'plain', 'it'),
  ('/become-seller', 'actions', 'next', 'Next Button', 'Continua', 'button', 'it'),
  ('/become-seller', 'actions', 'back', 'Back Button', 'Indietro', 'button', 'it'),
  ('/become-seller', 'actions', 'send_telegram', 'Send Telegram Button', 'Invia Richiesta su Telegram', 'button', 'it'),
  ('/become-seller', 'actions', 'copy_text', 'Copy Text Button', 'Copia Testo', 'button', 'it'),

  -- SMART SEARCH PAGE
  ('/smart-search', 'header', 'title', 'Page Title', 'Smart Search', 'title', 'it'),
  ('/smart-search', 'header', 'subtitle', 'Page Subtitle', 'Buy Anywhere with Crypto. Acquista da qualsiasi sito web usando le tue criptovalute, in totale privacy.', 'textarea', 'it'),
  ('/smart-search', 'header', 'back_button', 'Back Button', 'Indietro', 'button', 'it'),
  ('/smart-search', 'header', 'new_feature', 'New Feature Label', 'New Feature', 'plain', 'it'),
  ('/smart-search', 'intro', 'title', 'Intro Title', 'Trovi qualcosa fuori dal marketplace?', 'title', 'it'),
  ('/smart-search', 'intro', 'subtitle', 'Intro Subtitle', 'Incolla il link e noi lo acquistiamo per te.', 'title', 'it'),
  ('/smart-search', 'intro', 'text', 'Intro Text', 'Smart Search è il nostro servizio di Proxy Buying avanzato. Ti permette di acquistare prodotti da Amazon, eBay, o qualsiasi altro e-commerce globale pagando in criptovalute. Noi gestiamo l''acquisto e la logistica, proteggendo la tua identità dal venditore originale.', 'textarea', 'it'),

  -- BUY WITH CRYPTO PAGE (Proxy Flow)
  ('/buy-with-crypto', 'input', 'placeholder', 'Input Placeholder', 'Incolla qui il link del prodotto (Amazon, eBay, etc)...', 'plain', 'it'),
  ('/buy-with-crypto', 'input', 'button', 'Analyze Button', 'Analizza Prodotto', 'button', 'it'),
  ('/buy-with-crypto', 'details', 'title', 'Details Title', 'Conferma Dettagli', 'title', 'it'),
  ('/buy-with-crypto', 'payment', 'title', 'Payment Title', 'Pagamento Sicuro', 'title', 'it'),
  ('/buy-with-crypto', 'confirmed', 'title', 'Confirmed Title', 'Ordine Creato!', 'title', 'it'),
  ('/buy-with-crypto', 'confirmed', 'subtitle', 'Confirmed Subtitle', 'Il tuo ordine proxy è stato avviato. Segui lo stato con il tracking ID.', 'textarea', 'it'),
  ('/buy-with-crypto', 'actions', 'track_order', 'Track Order Button', 'Traccia Ordine', 'button', 'it'),
  ('/buy-with-crypto', 'actions', 'back_home', 'Back Home Button', 'Torna alla Home', 'button', 'it'),

  -- SECURE TRANSACTION PAGE (Escrow Info)
  ('/secure-transaction', 'header', 'title', 'Page Title', 'Escrow Sicuro', 'title', 'it'),
  ('/secure-transaction', 'header', 'subtitle', 'Page Subtitle', 'I tuoi fondi sono protetti fino al completamento della transazione.', 'textarea', 'it'),
  ('/secure-transaction', 'header', 'back_button', 'Back Button', 'Indietro', 'button', 'it'),
  ('/secure-transaction', 'intro', 'title', 'Intro Title', 'Protezione Totale', 'title', 'it'),
  ('/secure-transaction', 'intro', 'text', 'Intro Text', 'Su SwaprMarket ogni transazione è protetta tramite un sistema di escrow sicuro progettato per proteggere sia gli acquirenti che i venditori. Quando viene avviato un accordo, i fondi vengono temporaneamente bloccati in escrow e rilasciati solo quando entrambe le parti hanno completato i termini della transazione.', 'textarea', 'it'),
  ('/secure-transaction', 'how_it_works', 'title', 'How It Works Title', 'Come funziona l’Escrow', 'title', 'it'),
  ('/secure-transaction', 'how_it_works', 'step1_title', 'Step 1 Title', 'Deposito', 'title', 'it'),
  ('/secure-transaction', 'how_it_works', 'step1_desc', 'Step 1 Desc', 'L''acquirente invia i fondi al contratto smart di escrow. I fondi sono al sicuro.', 'textarea', 'it'),
  ('/secure-transaction', 'how_it_works', 'step2_title', 'Step 2 Title', 'Verifica', 'title', 'it'),
  ('/secure-transaction', 'how_it_works', 'step2_desc', 'Step 2 Desc', 'Il venditore vede che i fondi sono garantiti e procede con la consegna del servizio.', 'textarea', 'it'),
  ('/secure-transaction', 'how_it_works', 'step3_title', 'Step 3 Title', 'Rilascio', 'title', 'it'),
  ('/secure-transaction', 'how_it_works', 'step3_desc', 'Step 3 Desc', 'Una volta confermata la ricezione, i fondi vengono sbloccati al venditore.', 'textarea', 'it'),
  ('/secure-transaction', 'how_it_works', 'step4_title', 'Step 4 Title', 'Disputa', 'title', 'it'),
  ('/secure-transaction', 'how_it_works', 'step4_desc', 'Step 4 Desc', 'In caso di problemi, un moderatore interviene per risolvere la controversia.', 'textarea', 'it')

ON CONFLICT (page, section, key, locale) 
DO UPDATE SET 
  content = EXCLUDED.content,
  label = EXCLUDED.label,
  content_type = EXCLUDED.content_type;
