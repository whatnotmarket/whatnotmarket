import { BaseParser } from "./base-parser";
import * as cheerio from "cheerio";
import { ProductData } from "./types";

export class ShopifyParser extends BaseParser {
  canParse(url: string): boolean {
    return url.includes("myshopify.com") || url.includes("/products/");
  }

  async parse(url: string, html: string): Promise<ProductData> {
    const $ = cheerio.load(html);
    const jsonLd = this.extractJsonLd($);
    const meta = this.extractMetaTags($);

    // Shopify specific: <meta property="og:price:amount">
    const ogPrice = $('meta[property="og:price:amount"]').attr("content");
    const ogCurrency = $('meta[property="og:price:currency"]').attr("content");

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
