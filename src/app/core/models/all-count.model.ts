export interface Location {
  key: string;
  value: number;
  percentage?: number;
  sentiment?: SentimentCount;
}

export interface TopLocation {
  location: Location[];
  total_article: 351;
  total_top_location_article: 213;
}

export interface AllCount {
  top_location: TopLocation;
  data: Location[];
}

export interface ArticleCategory {
  category_id: string;
  count: number;
}

export interface SentimentCount {
  positive: number;
  negative: number;
  neutral: number;
}

export interface ProvinceData {
  key: string;
  value: number;
  categories: ArticleCategory[];
  sentiment?: SentimentCount;
}

export interface ProvinceCount {
  code: number;
  message: string;
  data: ProvinceData[];
}
