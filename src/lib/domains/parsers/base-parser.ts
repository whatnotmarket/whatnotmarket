import { parse,type HTMLElement } from "node-html-parser";
import { ProductData,ProductParser } from "./types";

export class BaseParser implements ProductParser {
  canParse(_url: string): boolean {
    return true; // Fallback parser handles everything
  }

  async parse(url: string, html: string): Promise<ProductData> {
    const root = parse(html);
    const jsonLd = this.extractJsonLd(root);
    const meta = this.extractMetaTags(root);
    const fallbackPrice = this.extractPriceFallback(html);

    return {
      url,
      title: jsonLd.title || meta.title,
      image: this.absolutize(url, jsonLd.image || meta.image),
      description: jsonLd.description || meta.description,
      price: jsonLd.price || fallbackPrice.price,
      currency: jsonLd.currency || fallbackPrice.currency,
      siteName: meta.siteName || new URL(url).hostname,
    };
  }

  protected extractMetaTags(root: HTMLElement) {
    const get = (selectors: string[]) => {
      for (const sel of selectors) {
        const el = root.querySelector(sel);
        const val = el?.getAttribute("content") || el?.getAttribute("href");
        if (val && val.trim()) return val.trim();
      }
      return null;
    };

    const titleEl = root.querySelector("title");

    return {
      title: get(['meta[property="og:title"]', 'meta[name="twitter:title"]']) || titleEl?.text?.trim() || null,
      image: get(['meta[property="og:image"]', 'meta[name="twitter:image"]']),
      description: get(['meta[property="og:description"]', 'meta[name="twitter:description"]', 'meta[name="description"]']),
      siteName: get(['meta[property="og:site_name"]']),
    };
  }

  protected extractJsonLd(root: HTMLElement): Partial<ProductData> {
    const scripts = root.querySelectorAll('script[type="application/ld+json"]');
    const texts = scripts.map((el) => el.text);

    for (const raw of texts) {
      try {
        const parsed = JSON.parse(raw);
        const nodes = Array.isArray(parsed) ? parsed : [parsed];

        // Handle @graph structure
        const candidates = nodes.flatMap((n) => n?.["@graph"] || n);

        for (const node of candidates) {
          if (node?.["@type"] === "Product") {
            const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
            const price = offers?.price || offers?.lowPrice;
            const currency = offers?.priceCurrency;

            return {
              title: node.name,
              description: node.description,
              image: Array.isArray(node.image) ? node.image[0] : node.image,
              price: price ? Number(String(price).replace(/[^0-9.]/g, "")) : null,
              currency: currency || "USD",
            };
          }
        }
      } catch {
        continue;
      }
    }
    return {};
  }

  protected extractPriceFallback(htmlText: string) {
    // Matches like $123.45, €99, 99.99 USD
    const symbolMatch = htmlText.match(/([$€£])\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/);
    if (symbolMatch) {
      const symbol = symbolMatch[1];
      const amount = parseFloat(symbolMatch[2].replace(/,/g, ""));
      return {
        price: isNaN(amount) ? null : amount,
        currency: symbol === "$" ? "USD" : symbol === "€" ? "EUR" : "GBP",
      };
    }

    const codeMatch = htmlText.match(/\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s?(USD|USDT|USDC|EUR|GBP)\b/i);
    if (codeMatch) {
      const amount = parseFloat(codeMatch[1].replace(/,/g, ""));
      return {
        price: isNaN(amount) ? null : amount,
        currency: codeMatch[2].toUpperCase(),
      };
    }

    return { price: null, currency: null };
  }

  protected absolutize(baseUrl: string, relativePath: string | null) {
    if (!relativePath) return null;
    try {
      return new URL(relativePath, baseUrl).toString();
    } catch {
      return null;
    }
  }
}
