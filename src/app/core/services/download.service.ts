import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DeleteDownloadResponse, DownloadResponse, RetryDownloadResponse } from '../models/download.model';
import { BASE_URL } from '../api';
import { FilterRequestPayload } from '../models/request.model';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private baseUrl = BASE_URL;
  private downloadsUrl = `${this.baseUrl}/v1/user/downloads`;

  constructor(private http: HttpClient) { }

  getDownloads(filter: FilterRequestPayload): Observable<DownloadResponse> {
    let params = new HttpParams();

    // Add all filter properties to params
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle date fields specially
        if (key === 'start_date' || key === 'end_date') {
          const timeKey = key === 'start_date' ? 'start_time' : 'end_time';
          const defaultTime = key === 'start_date' ? '00:00:00' : '23:59:59';
          const timeValue = filter[timeKey] || defaultTime;

          // Combine date and time
          params = params.set(key, `${String(value)} ${timeValue}`);
        } else if (key !== 'start_time' && key !== 'end_time') {
          // Skip time fields as they're combined with dates
          params = params.set(key, String(value));
        }
      }
    });

    return this.http.get<DownloadResponse>(this.downloadsUrl, { params });
  }


  getMockDownloads(filter: FilterRequestPayload): Observable<DownloadResponse> {
    console.log('Getting MOCK downloads with filter:', filter);

    // Create mock data
    const mockData: DownloadResponse = {
      code: 200,
      status: "success",
      meta: {
        page: filter.page || 1,
        limit: filter.limit || 10,
        total_records: 10,
        total_pages: Math.ceil(10 / (filter.limit || 10))
      },
      data: [
        {
          id: "ac84a3b7-65f6-4004-ad2f-d01f13827b8f",
          name: "Test Download - Processing",
          status: "PROCESSING",
          created_at: "2026-01-21T15:29:15Z",
          updated_at: "2026-01-21T15:31:14Z",
          file_url: null,
          error_message: null,
          total_items: 1282,
          processed_items: 200,
          progress_percentage: 15.6
        },
        {
          id: "98da9707-199f-4548-bcba-52989e48cabe",
          name: "Test Download - Failed",
          status: "FAILED",
          created_at: "2026-01-21T15:20:25Z",
          updated_at: "2026-01-21T15:20:53Z",
          file_url: null,
          error_message: "Failed to generate excel file: Connection timeout",
          total_items: 0,
          processed_items: 0,
          progress_percentage: 0
        },
        {
          id: "9a8aabdc-0ba4-4387-96d0-45439a2487cf",
          name: "Industry Report 01-20 January 2026",
          status: "SUCCESS",
          created_at: "2026-01-21T14:17:46Z",
          updated_at: "2026-01-21T15:13:07Z",
          file_url: "https://api.skema.co.id/media/tmp/strte_1768983182.603163.xlsx",
          error_message: null,
          total_items: 1250,
          processed_items: 1250,
          progress_percentage: 100
        },
        {
          id: "70f7c788-4461-464b-bbb4-b583656df1a2",
          name: "Corporate Report 01-20 January 2026",
          status: "SUCCESS",
          created_at: "2026-01-21T12:41:53Z",
          updated_at: "2026-01-21T12:46:31Z",
          file_url: "https://api.skema.co.id/media/tmp/strte_1768974390.933759.xlsx",
          error_message: null,
          total_items: 980,
          processed_items: 980,
          progress_percentage: 100
        },
        {
          id: "b2c45d89-1234-5678-90ab-cdef12345678",
          name: "Pending Download - Waiting",
          status: "PENDING",
          created_at: "2026-01-21T10:15:30Z",
          updated_at: "2026-01-21T10:15:30Z",
          file_url: null,
          error_message: null,
          total_items: 500,
          processed_items: 0,
          progress_percentage: 0
        },
        {
          id: "c3d56e90-2345-6789-01bc-def234567890",
          name: "Large Report with Long Name - Financial Analysis Q4 2025",
          status: "PROCESSING",
          created_at: "2026-01-21T09:45:22Z",
          updated_at: "2026-01-21T10:30:45Z",
          file_url: null,
          error_message: null,
          total_items: 5000,
          processed_items: 1250,
          progress_percentage: 25
        },
        {
          id: "d4e67f01-3456-7890-12cd-ef3456789012",
          name: "Failed with Long Error Message",
          status: "FAILED",
          created_at: "2026-01-21T08:30:15Z",
          updated_at: "2026-01-21T08:45:30Z",
          file_url: null,
          error_message: "Export failed: Database connection lost. Please check your network connection and try again. Error code: DB-502",
          total_items: 1000,
          processed_items: 750,
          progress_percentage: 75
        },
        {
          id: "e5f78012-4567-8901-23de-f45678901234",
          name: "Success - Small Report",
          status: "SUCCESS",
          created_at: "2026-01-20T16:20:10Z",
          updated_at: "2026-01-20T16:21:05Z",
          file_url: "https://api.skema.co.id/media/tmp/small_report_123.xlsx",
          error_message: null,
          total_items: 50,
          processed_items: 50,
          progress_percentage: 100
        },
        {
          id: "f6g89023-5678-9012-34ef-567890123456",
          name: "Processing - Almost Done",
          status: "PROCESSING",
          created_at: "2026-01-20T14:10:05Z",
          updated_at: "2026-01-20T15:45:20Z",
          file_url: null,
          error_message: null,
          total_items: 800,
          processed_items: 790,
          progress_percentage: 98.75
        },
        {
          id: "g7h90134-6789-0123-45fg-678901234567",
          name: "Success - No Items",
          status: "SUCCESS",
          created_at: "2026-01-20T11:05:40Z",
          updated_at: "2026-01-20T11:05:45Z",
          file_url: "https://api.skema.co.id/media/tmp/empty_report.xlsx",
          error_message: null,
          total_items: 0,
          processed_items: 0,
          progress_percentage: 0
        }
      ]
    };

    console.log('Returning mock data:', mockData);
    return of(mockData);
  }

  retryDownload(id: string) {
    return this.http.post<any>(
      `${this.baseUrl}/${id}/retry`,
      null
    );
  }


  deleteDownload(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

}