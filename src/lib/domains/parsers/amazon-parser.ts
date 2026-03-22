import * as cheerio from "cheerio";
import { BaseParser } from "./base-parser";
import { ProductData } from "./types";

export class AmazonParser extends BaseParser {
  canParse(url: string): boolean {
    return url.includes("amazon.") || url.includes("amzn.");
  }

  async parse(url: string, html: string): Promise<ProductData> {
    const $ = cheerio.load(html);
    
    // Amazon specific selectors
    const title = $("#productTitle").text().trim() || 
                  $("#title").text().trim();
                  
    const image = $("#landingImage").attr("src") || 
                  $("#imgBlkFront").attr("src") ||
                  $("#ebooksImgBlkFront").attr("src") ||
                  $(".a-dynamic-image").first().attr("src");

    const priceText = $(".a-price .a-offscreen").first().text().trim() || 
                      $("#priceblock_ourprice").text().trim() || 
                      $("#priceblock_dealprice").text().trim();
                      
    const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : null;
    
    // Currency detection from symbol
    let currency = "USD";
    if (priceText.includes("€")) currency = "EUR";
    if (priceText.includes("£")) currency = "GBP";

    const description = $("#feature-bullets").text().trim().replace(/\s+/g, " ").slice(0, 200) + "...";

    // Fallback to base logic if Amazon specific fails
    const meta = this.extractMetaTags($);

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
