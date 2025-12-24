import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EpaperResponse } from '../models/epaper.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../api';

@Injectable({
  providedIn: 'root'
})
export class EpaperService {

  private baseUrl = BASE_URL;
  private epapersUrl = `${this.baseUrl}/v1/epapers`;

  constructor(private http: HttpClient) { }

  getEpapers(
    page: number = 1,
    limit: number = 10,
    sort: 'asc' | 'desc' = 'desc',
    sortBy: string = 'date',
    search: string = ''
  ): Observable<EpaperResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sort', sort)
      .set('sort_by', sortBy)
      .set('search', search);

    return this.http.get<EpaperResponse>(this.epapersUrl, { params });
  }
}