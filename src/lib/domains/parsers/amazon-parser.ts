import { parse } from "node-html-parser";
import { BaseParser } from "./base-parser";
import { ProductData } from "./types";

export class AmazonParser extends BaseParser {
  canParse(url: string): boolean {
    return url.includes("amazon.") || url.includes("amzn.");
  }

  async parse(url: string, html: string): Promise<ProductData> {
    const root = parse(html);

    // Amazon specific selectors
    const title =
      root.querySelector("#productTitle")?.text?.trim() ||
      root.querySelector("#title")?.text?.trim() ||
      "";

    const image =
      root.querySelector("#landingImage")?.getAttribute("src") ||
      root.querySelector("#imgBlkFront")?.getAttribute("src") ||
      root.querySelector("#ebooksImgBlkFront")?.getAttribute("src") ||
      root.querySelector(".a-dynamic-image")?.getAttribute("src") ||
      null;

    const priceText =
      root.querySelector(".a-price .a-offscreen")?.text?.trim() ||
      root.querySelector("#priceblock_ourprice")?.text?.trim() ||
      root.querySelector("#priceblock_dealprice")?.text?.trim() ||
      "";

    const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : null;

    // Currency detection from symbol
    let currency = "USD";
    if (priceText.includes("€")) currency = "EUR";
    if (priceText.includes("£")) currency = "GBP";

    const bullets = root.querySelector("#feature-bullets")?.text?.trim().replace(/\s+/g, " ").slice(0, 200);
    const description = bullets ? `${bullets}...` : "";

    // Fallback to base logic if Amazon specific fails
    const meta = this.extractMetaTags(root);

    return {
      url,
      title: title || meta.title,
      image: image || meta.image,
      description: description || meta.description,
      price: price || this.extractPriceFallback(html).price,
      currency: currency,
      siteName: "Amazon",
    };
  }
}
