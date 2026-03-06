export interface ProductData {
  title: string | null;
  image: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  siteName: string | null;
  url: string;
}

export interface ProductParser {
  canParse(url: string): boolean;
  parse(url: string, html: string): Promise<ProductData>;
}
