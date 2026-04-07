export interface Download {
  id: string;
  name: string;
  status: 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'FAILED' | 'PROCESS'; // Added 'PROCESS'
  created_at: string;
  updated_at: string;
  file_url: string | null;
  error_message: string | null;
  total_items: number;
  processed_items: number;
  progress_percentage: number;
}

export interface DownloadResponse {
  code: number;
  status: string;
  meta: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  data: Download[];
}

export interface RetryDownloadResponse {
  code: number;
  status: string;
  message?: string;
  data: {
    id: string;
    status: string;
  };
}

export interface DeleteDownloadResponse {
  code: number;
  status: string;
  message?: string;
}