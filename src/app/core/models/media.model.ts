export interface Media {
  client_id: string;
  input_data_date: string;
  pc_name: string;
  user_media_type_id: number;
  user_media_type_name_def: string;
  usere: string;
}

export interface MediaResponse {
  count: number;
  next: string;
  previous: string;
  results: Media[];
}

export interface MediaGroup {
  media_type: string;
  media_list: MediaList[];
}

export interface MediaList {
  chosen: boolean;
  media_id: number;
  media_name: string;
  tier: number;
  is_dewan_pers: boolean;
  is_international: boolean;
  is_national: boolean;
}

export interface MediaListUpdate {
  media_id: string;
  chosen: boolean;
}

export interface WartawanMedia {
  media_name: string;
}

export interface MediaSOV {
  doc_count: number;
  image_url: string;
  media_id: number;
  media_name: string;
}
export interface MediaTone {
  media_id: number;
  media_name: string;
  media_favourability_index: number;
  total_articles: number;
  tone_articles: ToneArticle;
}

export interface ToneArticle {
  positive: number;
  negative: number;
  neutral: number;
}
