import { Bucket } from './tone.model';

export interface MediaVisibility {
  key: string;
  doc_count: number;

  category_id_per_day: {
    buckets: Bucket[];
  };

  sentiments: Sentiment[];
}

export interface Sentiment {
  name: string;
  tone: number;
  value: number;
}

export interface MediaVisibilityResponse {
  code: number;
  message: string;
  data: MediaVisibility[];
}
