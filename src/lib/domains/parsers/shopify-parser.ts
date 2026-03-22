import { parse } from "node-html-parser";
import { BaseParser } from "./base-parser";
import { ProductData } from "./types";

export class ShopifyParser extends BaseParser {
  canParse(url: string): boolean {
    return url.includes("myshopify.com") || url.includes("/products/");
  }

  async parse(url: string, html: string): Promise<ProductData> {
    const root = parse(html);
    const jsonLd = this.extractJsonLd(root);
    const meta = this.extractMetaTags(root);

    // Shopify specific: <meta property="og:price:amount">
    const ogPrice = root.querySelector('meta[property="og:price:amount"]')?.getAttribute("content");
    const ogCurrency = root.querySelector('meta[property="og:price:currency"]')?.getAttribute("content");

    return {
      url,
      title: jsonLd.title || meta.title,
      image: this.absolutize(url, jsonLd.image || meta.image),
      description: jsonLd.description || meta.description,
      price: jsonLd.price || (ogPrice ? parseFloat(ogPrice) : null) || this.extractPriceFallback(html).price,
      currency: jsonLd.currency || ogCurrency || "USD",
      siteName: meta.siteName || "Shopify Store",
    };
  }
}
