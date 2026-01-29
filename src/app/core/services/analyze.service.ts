import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import moment from 'moment';
import { Observable } from 'rxjs';
import { BASE_URL } from '../api';
import { TopIssueResponse } from '../models/issue.model';
import { MediaVisibilityResponse } from '../models/media-visibility.model';
import { FilterRequestPayload } from '../models/request.model';

export interface DownloadExcelPayload {
  name: string;
  category_set: string;
  category_id: string;
  columns: string[];
  start_date: string;
  end_date: string;
  user_media_type_id: number;
}

export interface DownloadExcelResponse {
  code: number;
  status: 'success' | 'failed';
  message: string;
  data: {
    id: string;
    status: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AnalyzeService {
  private baseUrl = BASE_URL;
  constructor(private http: HttpClient) { }

  getMediaVisibility(filter: FilterRequestPayload): Observable<MediaVisibilityResponse> {
    const startDate = new Date(filter.start_date!).getDate();
    const endDate = new Date(filter.end_date!).getDate();
    if (startDate === endDate) return this.getMediaVisibilityV3(filter);

    return this.http.post<MediaVisibilityResponse>(`${this.baseUrl}/v1/dashboard/media-visibility`, {
      ...filter,
      media_id: 0,
    });
  }

  getMediaVisibilityV3(filter: FilterRequestPayload): Observable<MediaVisibilityResponse> {
    return this.http.post<MediaVisibilityResponse>(`${this.baseUrl}/v3/dashboard/media-visibility`, {
      ...filter,
      start_date: moment(filter.start_date).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      end_date: moment(filter.end_date).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
    });
  }

  getTopIssue(filter: FilterRequestPayload): Observable<TopIssueResponse> {
    return this.http.post<TopIssueResponse>(`${this.baseUrl}/v1/dashboard/top-issue`, {
      ...filter,
      limit: 10,
      media_id: 0,
    });
  }

  downloadPPT(images: string[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/v1/user/downloads/pptx`, images);
  }

  downloadExcel(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/v1/dashboard/download-excel`, payload);
  }

  // New API endpoint migration 
  downloadExcelV2(payload: DownloadExcelPayload): Observable<DownloadExcelResponse> {
    const url = `${this.baseUrl}/v1/user/downloads/excel`;
    return this.http.post<DownloadExcelResponse>(url, payload);
  }

  downloadPptV2(payload: {
    name: string;
    images: string[];
  }): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/v1/user/downloads/powerpoint`,
      payload
    );
  }

}
