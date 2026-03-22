import { AmazonParser } from "./amazon-parser";
import { BaseParser } from "./base-parser";
import { NikeParser } from "./nike-parser";
import { ShopifyParser } from "./shopify-parser";
import { ProductData,ProductParser } from "./types";

export class ProductParserService {
  private parsers: ProductParser[];
  private fallbackParser: ProductParser;

  constructor() {
    this.parsers = [
      new NikeParser(),
      new AmazonParser(),
      new ShopifyParser(),
    ];
    this.fallbackParser = new BaseParser();
  }

  async parseProduct(url: string): Promise<ProductData> {
    const html = await this.fetchHtml(url);
    
    // Try specialized parsers first
    for (const parser of this.parsers) {
      if (parser.canParse(url)) {
        try {
          console.log(`Using ${parser.constructor.name} for ${url}`);
          const data = await parser.parse(url, html);
          if (this.isValid(data)) return data;
        } catch (error) {
          console.warn(`Parser ${parser.constructor.name} failed, falling back to generic`, error);
        }
      }
    }

    // Fallback to generic parser
    console.log(`Using BaseParser for ${url}`);
    return this.fallbackParser.parse(url, html);
  }

  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      
      // 1. Protocol check
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol. Only HTTP/HTTPS are allowed.');
      }

      // 2. Hostname check for local/private IPs
      const hostname = parsedUrl.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
        throw new Error('Access to local resources is forbidden.');
      }

      // Private IP ranges (basic check)
      // 10.0.0.0 - 10.255.255.255
      // 172.16.0.0 - 172.31.255.255
      // 192.168.0.0 - 192.168.255.255
      if (
        hostname.startsWith('10.') || 
        hostname.startsWith('192.168.') || 
        (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31)
      ) {
        throw new Error('Access to private network resources is forbidden.');
      }

    } catch (e) {
      throw new Error(`Invalid URL: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    this.validateUrl(url);

    // PRIVACY: We use a generic, rotating or static non-identifying User-Agent.
    // We do NOT forward the client's User-Agent or IP.
    // This request is made from the server, so the target site only sees the server's IP.
    // To further protect server anonymity, one should use a proxy service (not implemented here but recommended).
    
    const res = await fetch(url, {
      headers: {
        // Generic Bot UA to avoid tracking specific user devices
        "User-Agent": "Mozilla/5.0 (compatible; OpenlyMarketBot/1.0; +https://openlymarket.market)", 
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://openlymarket.market", // Explicitly set referer to our site or empty
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${res.statusText}`);
    }

    return res.text();
  }

  private isValid(data: ProductData): boolean {
    // Basic validation: must have at least a title or price to be useful
    return !!(data.title || data.price);
  }
}

