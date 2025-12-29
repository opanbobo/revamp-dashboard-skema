import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from '../api';
import { Article } from '../models/article.model';
import { MediaSOV, MediaTone } from '../models/media.model';
import { FilterRequestPayload } from '../models/request.model';

@Injectable({
  providedIn: 'root',
})
export class MediaSOVService {
  private baseUrl = BASE_URL;

  constructor(private http: HttpClient) {}

  getMedias(filter: FilterRequestPayload) {
    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      max_size: filter.max_size ?? 20,
      page: filter.page ?? 1,
      media_id: filter.media_id ?? '',
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      search: filter.term ?? '',
      category_id: filter.category_id ?? '',
      media_tier: filter.media_tier ?? '',
    };

    return this.http.get<{
      data: MediaSOV[];
      meta: {
        total_data: number;
        page: number;
        max_size: number;
        total_page: number;
      };
    }>(`${this.baseUrl}/v3/media-sov/media-list`, { params });
  }

  getLatestArticles(filter: FilterRequestPayload): Observable<{ data: Article[], meta: any }> {
    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      max_size: filter.max_size ?? 6,
      page: filter.page ?? 1,
      media_id: filter.media_id ?? '',
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      tone: filter.tone ?? '',
      category_id: filter.category_id ?? '',
      media_tier: filter.media_tier ?? '',
    };

    console.log('params', params);
    console.log(`================================`)
    console.log(`media id : ${filter.media_id}`);

    return this.http.get<{ data: Article[], meta: any }>(`${this.baseUrl}/v3/media-sov/latest-articles`, { params });
  }

  getMediaTones(filter: FilterRequestPayload): Observable<{ data: MediaTone }> {
    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      media_id: filter.media_id ?? '',
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      category_id: filter.category_id ?? '',
      media_tier: filter.media_tier ?? '',
    };

    return this.http.get<{ data: MediaTone }>(`${this.baseUrl}/v3/media-sov/media-tones`, { params });
  }
}
