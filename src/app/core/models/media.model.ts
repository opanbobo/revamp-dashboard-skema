export interface Media {
  client_id: string;
  input_data_date: string;
  pc_name: string;
  user_media_type_id: number;
  user_media_type_name_def: string;
  usere: string;
}

export interface MediaResponse {
  count: number;
  next: string;
  previous: string;
  results: Media[];
}
