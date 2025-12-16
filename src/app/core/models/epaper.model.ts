export interface EpaperResponse {
  success: boolean;
  meta: {
    current_page: number;
    limit: number;
    total_data: number;
    total_pages: number;
  };
  data: Epaper[];
}

export interface Epaper {
  id: string;
  title: string;
  thumbnail_url: string;
  file_url: string;
  media_name: string;
  date: string;

  status: 'available' | 'unavailable';
  statusText?: string;
  readCount?: number;
}
