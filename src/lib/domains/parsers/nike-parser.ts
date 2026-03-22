import { BaseParser } from "./base-parser";
import * as cheerio from "cheerio";
import { ProductData } from "./types";

export class NikeParser extends BaseParser {
  canParse(url: string): boolean {
    return url.includes("nike.com");
  }

  async parse(url: string, html: string): Promise<ProductData> {
    const $ = cheerio.load(html);
    const jsonLd = this.extractJsonLd($);
    const meta = this.extractMetaTags($);

    // Nike specific fallback: sometimes price is in a specific data attribute or class
    const priceElement = $('[data-test="product-price"]').first().text();
    const price = priceElement ? parseFloat(priceElement.replace(/[^0-9.]/g, "")) : null;

    return {
      url,
      title: jsonLd.title || meta.title || $("h1").text().trim(),
      image: this.absolutize(url, jsonLd.image || meta.image),
      description: jsonLd.description || meta.description,
      price: jsonLd.price || price || this.extractPriceFallback(html).price,
      currency: jsonLd.currency || "USD",
      siteName: "Nike",
    };
  }
}
