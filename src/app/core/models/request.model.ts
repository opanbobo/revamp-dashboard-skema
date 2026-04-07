export interface FilterRequestPayload {
  start_date?: string;
  date_type?: string;
  end_date?: string;
  category_id?: string;
  category_set?: number;
  page?: number;
  size?: number;
  user_media_type_id?: number;
  limit?: number;
  maxSize?: number;
  geo_loc?: string;
  media_id?: number | null;
  tone?: number | null;
  term?: string;
  max_size?: string;
  order_by?: string;
  type_location?: string;
  media_categor?: string;
  search_field?: string;
  media_category?: string;
  sentiments?: string;
  start_time?: string;
  end_time?: string;
  media_tier?: number | null | string;
}
