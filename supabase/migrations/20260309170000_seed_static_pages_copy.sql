-- Seed Data for Static Pages (About, Terms, Privacy, FAQ, Contact)

INSERT INTO copy_website (page, section, key, label, content, content_type, locale)
VALUES
  -- ABOUT PAGE
  ('/about', 'header', 'title', 'Page Title', 'La Piattaforma', 'title', 'it'),
  ('/about', 'header', 'subtitle', 'Page Subtitle', 'Il marketplace digitale di nuova generazione. Sicuro, privato, efficiente.', 'textarea', 'it'),
  ('/about', 'header', 'back_button', 'Back Button', 'Indietro', 'button', 'it'),
  ('/about', 'who_we_are', 'title', 'Section Title', 'Chi Siamo', 'title', 'it'),
  ('/about', 'who_we_are', 'p1', 'Paragraph 1', 'SwaprMarket è una piattaforma globale dedicata allo scambio di beni e servizi digitali. Siamo nati con una missione chiara: creare un ambiente di trading sicuro dove la privacy è al primo posto e la fiducia è garantita dalla tecnologia, non dalla burocrazia.', 'textarea', 'it'),
  ('/about', 'who_we_are', 'p2', 'Paragraph 2', 'A differenza dei marketplace tradizionali, non richiediamo procedure KYC invasive. Ci basiamo sulla reputazione, sui depositi di sicurezza (Vendor Bond) e su un rigoroso sistema di Escrow per proteggere ogni singola transazione.', 'textarea', 'it'),
  ('/about', 'what_we_do', 'title', 'Section Title', 'Cosa Facciamo', 'title', 'it'),
  -- Note: Ideally 'What We Do' cards should be dynamic, but for now mapping them as static copy fields
  ('/about', 'what_we_do', 'card1_title', 'Card 1 Title', 'Escrow Sicuro', 'plain', 'it'),
  ('/about', 'what_we_do', 'card1_desc', 'Card 1 Desc', 'Ogni pagamento viene bloccato in un conto di garanzia fino al completamento dell''ordine.', 'textarea', 'it'),
  ('/about', 'what_we_do', 'card2_title', 'Card 2 Title', 'Pagamenti Crypto', 'plain', 'it'),
  ('/about', 'what_we_do', 'card2_desc', 'Card 2 Desc', 'Supportiamo BTC, ETH, LTC, XMR e USDT per transazioni veloci e senza confini.', 'textarea', 'it'),
  ('/about', 'what_we_do', 'card3_title', 'Card 3 Title', 'Vendor Bond', 'plain', 'it'),
  ('/about', 'what_we_do', 'card3_desc', 'Card 3 Desc', 'I venditori depositano una garanzia per dimostrare la loro serietà e solvibilità.', 'textarea', 'it'),
  ('/about', 'what_we_do', 'card4_title', 'Card 4 Title', 'Privacy Totale', 'plain', 'it'),
  ('/about', 'what_we_do', 'card4_desc', 'Card 4 Desc', 'Nessun tracciamento, nessun dato venduto a terzi. I tuoi affari sono solo tuoi.', 'textarea', 'it'),

  -- TERMS PAGE
  ('/terms', 'header', 'title', 'Page Title', 'Terms of Service', 'title', 'en'),
  ('/terms', 'header', 'subtitle', 'Page Subtitle', 'Please read these terms carefully before using our platform. They govern your relationship with SwaprMarket.', 'textarea', 'en'),
  ('/terms', 'header', 'last_updated', 'Last Updated', 'Last updated: March 6, 2026', 'plain', 'en'),
  ('/terms', 'header', 'back_button', 'Back Button', 'Back', 'button', 'en'),
  ('/terms', 'content', 'section1_title', 'Section 1 Title', '1. Introduction', 'title', 'en'),
  ('/terms', 'content', 'section1_text', 'Section 1 Text', 'Welcome to SwaprMarket ("we," "our," or "us"). By accessing or using our website, services, or applications (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our Services.', 'textarea', 'en'),
  ('/terms', 'content', 'section2_title', 'Section 2 Title', '2. User Accounts', 'title', 'en'),
  ('/terms', 'content', 'section2_text', 'Section 2 Text', 'To access certain features of the Services, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating an account.', 'textarea', 'en'),
  ('/terms', 'content', 'section3_title', 'Section 3 Title', '3. Marketplace & Transactions', 'title', 'en'),
  ('/terms', 'content', 'section3_text', 'Section 3 Text', 'SwaprMarket acts as a venue to allow users who comply with our policies to offer, sell, and buy certain goods and services. We are not a party to the actual transaction between buyers and sellers.', 'textarea', 'en'),
  ('/terms', 'content', 'escrow_title', 'Escrow Box Title', 'Escrow Service', 'title', 'en'),
  ('/terms', 'content', 'escrow_text', 'Escrow Box Text', 'All payments are held in escrow until the buyer confirms receipt of the goods or services, or until a specified time period has elapsed. This ensures the safety of both parties.', 'textarea', 'en'),

  -- PRIVACY PAGE
  ('/privacy', 'header', 'title', 'Page Title', 'Privacy Policy', 'title', 'it'),
  ('/privacy', 'header', 'subtitle', 'Page Subtitle', 'La tua privacy non è un''opzione, è la nostra priorità. Scopri come proteggiamo i tuoi dati.', 'textarea', 'it'),
  ('/privacy', 'header', 'back_button', 'Back Button', 'Indietro', 'button', 'it'),
  ('/privacy', 'philosophy', 'title', 'Section Title', 'Filosofia Privacy-First', 'title', 'it'),
  ('/privacy', 'philosophy', 'text', 'Section Text', 'SwaprMarket è costruito sul principio della minimizzazione dei dati. Non raccogliamo informazioni che non sono strettamente necessarie per il funzionamento del servizio. Crediamo che l''anonimato sia un diritto fondamentale, specialmente nel mondo delle transazioni digitali.', 'textarea', 'it'),
  ('/privacy', 'data', 'title', 'Section Title', 'Dati che Raccogliamo', 'title', 'it'),
  ('/privacy', 'data', 'card1_title', 'Card 1 Title', 'Nessun KYC', 'plain', 'it'),
  ('/privacy', 'data', 'card1_desc', 'Card 1 Desc', 'Non richiediamo documenti d''identità, passaporti o selfie. La tua identità reale rimane tua.', 'textarea', 'it'),
  -- Adding placeholders for other potential cards if needed, based on typical privacy page structure

  -- FAQ PAGE
  ('/faq', 'header', 'title', 'Page Title', 'Domande Frequenti', 'title', 'it'),
  ('/faq', 'header', 'subtitle', 'Page Subtitle', 'Tutto quello che devi sapere per usare SwaprMarket al meglio.', 'textarea', 'it'),
  ('/faq', 'header', 'back_button', 'Back Button', 'Indietro', 'button', 'it'),
  ('/faq', 'tabs', 'buyer', 'Buyer Tab', 'Acquirenti', 'plain', 'it'),
  ('/faq', 'tabs', 'seller', 'Seller Tab', 'Venditori', 'plain', 'it'),
  -- Buyer FAQs
  ('/faq', 'buyer_q1', 'question', 'Question', 'Come funziona SwaprMarket?', 'plain', 'it'),
  ('/faq', 'buyer_q1', 'answer', 'Answer', 'SwaprMarket è un marketplace ''Request-First''. Invece di sfogliare infinite liste di prodotti, pubblichi una richiesta specifica (''Cerco un account Netflix'', ''Cerco uno script Python'') e i venditori qualificati ti inviano offerte su misura.', 'textarea', 'it'),
  ('/faq', 'buyer_q2', 'question', 'Question', 'I miei fondi sono al sicuro?', 'plain', 'it'),
  ('/faq', 'buyer_q2', 'answer', 'Answer', 'Assolutamente sì. Utilizziamo un sistema di Escrow rigoroso. Quando paghi, i fondi vengono bloccati in un conto sicuro e vengono rilasciati al venditore solo dopo che hai confermato la ricezione del prodotto o servizio.', 'textarea', 'it'),
  -- Seller FAQs
  ('/faq', 'seller_q1', 'question', 'Question', 'Come divento un venditore?', 'plain', 'it'),
  ('/faq', 'seller_q1', 'answer', 'Answer', 'Per diventare venditore devi superare una procedura di verifica. È richiesta una fee d''ingresso una tantum di $20 e, per i livelli superiori, un deposito di sicurezza (Vendor Bond) per garantire la tua affidabilità.', 'textarea', 'it'),

  -- CONTACT PAGE
  ('/contact', 'header', 'title', 'Page Title', 'Contattaci', 'title', 'it'),
  ('/contact', 'header', 'subtitle', 'Page Subtitle', 'Siamo qui per aiutarti. Scegli il canale che preferisci per metterti in contatto con il nostro team.', 'textarea', 'it'),
  ('/contact', 'header', 'back_button', 'Back Button', 'Indietro', 'button', 'it'),
  ('/contact', 'telegram', 'button', 'Button Text', 'Supporto Telegram', 'button', 'it'),
  ('/contact', 'telegram', 'desc', 'Description', 'Il canale più veloce. Risposta media in 5 minuti.', 'plain', 'it'),
  ('/contact', 'email', 'button', 'Button Text', 'Inviaci una Email', 'button', 'it'),
  ('/contact', 'email', 'desc', 'Description', 'Per questioni amministrative o partnership.', 'plain', 'it'),
  ('/contact', 'info', 'hours', 'Support Hours', 'Supporto attivo Lun-Ven, 9:00 - 18:00', 'plain', 'it'),
  ('/contact', 'info', 'location', 'Location', 'Decentralized HQ', 'plain', 'it')

ON CONFLICT (page, section, key, locale) 
DO UPDATE SET 
  content = EXCLUDED.content,
  label = EXCLUDED.label,
  content_type = EXCLUDED.content_type;
