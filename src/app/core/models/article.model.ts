import { SafeHtml } from "@angular/platform-browser";

export interface Article {
  date_time: any;
  toneLabel?: string;
  article_id: string;
  title: string;
  media_id: number;
  datee: string;
  content: string;
  mmcol: string;
  circulation: string;
  page: string;
  file_pdf: string;
  columne: string;
  size_jpeg: string;
  journalist: string;
  rate_bw: string;
  rate_fc: string;
  is_chart: string;
  is_table: string;
  is_colour: string;
  categories: string[];
  media_name: string;
  image_url?: string;
  preview_link?: string;
  media_type?: string;
  media_tier?: string;
  location?: string;
  advalue_bw?: number;
  advalue_fc?: number;
  tone?: number;
  category_id?: string;
  summary?: string;
  issue?: string;
  keywords?: string[];
  sanitizedContent?: SafeHtml;
}

export interface ArticleResponse {
  data: Article[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
  result: string;
}
