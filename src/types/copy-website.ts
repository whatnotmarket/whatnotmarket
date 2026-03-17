export type CopyContentType = 'plain' | 'textarea' | 'title' | 'button' | 'meta_title' | 'meta_description';

export interface CopyWebsite {
  id: string;
  page: string;
  section: string;
  key: string;
  label: string;
  content: string | null;
  content_type: CopyContentType;
  locale: string;
  updated_at: string;
}

export interface CopyWebsiteInsert {
  page: string;
  section: string;
  key: string;
  label: string;
  content: string | null;
  content_type: CopyContentType;
  locale?: string;
}

export interface CopyWebsiteUpdate {
  content?: string | null;
  label?: string;
  content_type?: CopyContentType;
  updated_at?: string;
}
