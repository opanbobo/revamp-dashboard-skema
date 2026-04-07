import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FilterRequestPayload } from '../models/request.model';
import { InfluencerCountResponse, InfluencerQuotes, InfluencerResponse, MediaShare } from '../models/influencer.model';
import { BASE_URL, INFLUENCER_BASE_URL } from '../api';
import { Article } from '../models/article.model';

@Injectable({
  providedIn: 'root',
})
export class InfluencerService {
  private baseUrl = INFLUENCER_BASE_URL;
  private baseUrl2 = BASE_URL;
  constructor(private http: HttpClient) {}

  getSpokepersons(filter: FilterRequestPayload): Observable<InfluencerCountResponse> {
    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      max_size: filter.max_size ?? 20,
      page: filter.page ?? 1,
      media_id: filter.media_id ?? 0,
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      category_id: filter.category_id ?? 'all',
      search: filter.term ?? '',
      media_tier: filter.media_tier ?? '',
    };

    return this.http.get<InfluencerCountResponse>(`${this.baseUrl}/v1/spokesperson/quotes/count`, {
      params,
    });
  }

  getSpokepersonMediaShares(filter: FilterRequestPayload & { spokeperson_name?: string }): Observable<{
    data: { media_shares: MediaShare[]; total_doc_count: number };
  }> {
    const params = {
      start_date: filter.start_date ? filter.start_date + ' 00:00:00' : '',
      end_date: filter.end_date ? filter.end_date + ' 23:59:59' : '',
      max_size: filter.max_size ?? 10,
      page: 1,
      media_id: filter.media_id ?? 0,
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      category_id: filter.category_id ?? 'all',
      spokesperson_name: filter.spokeperson_name ?? '',
      media_tier: filter.media_tier ?? '',
    };

    return this.http.get<{
      data: { media_shares: MediaShare[]; total_doc_count: number };
    }>(`${this.baseUrl}/v1/spokesperson/quotes/media-shares`, {
      params,
    });
  }

  getSpokepersonQuotes(
    filter: FilterRequestPayload & {
      media_id?: number;
      spokeperson_name?: string;
    }
  ): Observable<{ data: InfluencerQuotes[] }> {
    const params = {
      start_date: filter.start_date ? filter.start_date + ' 00:00:00' : '',
      end_date: filter.end_date ? filter.end_date + ' 23:59:59' : '',
      max_size: filter.max_size ?? 20,
      page: 1,
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      category_id: filter.category_id ?? 'all',
      media_id: filter.media_id ?? 0,
      spokesperson_name: filter.spokeperson_name ?? '',
      media_tier: filter.media_tier ?? '',
    };

    return this.http.get<{ data: InfluencerQuotes[] }>(`${this.baseUrl}/v1/spokesperson/quotes`, {
      params,
    });
  }

  getSpokepersonArticles(
    filter: FilterRequestPayload & {
      spokeperson_name?: string;
    }
  ): Observable<{ data: Article[] }> {
    const params = {
      start_date: filter.start_date ? filter.start_date + ' 00:00:00' : '',
      end_date: filter.end_date ? filter.end_date + ' 23:59:59' : '',
      max_size: filter.max_size ?? 6,
      page: 1,
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      category_id: filter.category_id ?? 'all',
      media_id: filter.media_id ?? 0,
      spokesperson_name: filter.spokeperson_name ?? '',
      media_tier: filter.media_tier ?? '',
    };

    return this.http.get<{ data: Article[] }>(`${this.baseUrl2}/v3/spokesperson/quotes/articles`, {
      params,
    });
  }
}
