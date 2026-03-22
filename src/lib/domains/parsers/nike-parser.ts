import { parse } from "node-html-parser";
import { BaseParser } from "./base-parser";
import { ProductData } from "./types";

export class NikeParser extends BaseParser {
  canParse(url: string): boolean {
    return url.includes("nike.com");
  }

  async parse(url: string, html: string): Promise<ProductData> {
    const root = parse(html);
    const jsonLd = this.extractJsonLd(root);
    const meta = this.extractMetaTags(root);

    // Nike specific fallback: sometimes price is in a specific data attribute or class
    const priceElement = root.querySelector('[data-test="product-price"]')?.text?.trim() || "";
    const price = priceElement ? parseFloat(priceElement.replace(/[^0-9.]/g, "")) : null;

    return {
      url,
      title: jsonLd.title || meta.title || root.querySelector("h1")?.text?.trim() || null,
      image: this.absolutize(url, jsonLd.image || meta.image),
      description: jsonLd.description || meta.description,
      price: jsonLd.price || price || this.extractPriceFallback(html).price,
      currency: jsonLd.currency || "USD",
      siteName: "Nike",
    };
  }
}
