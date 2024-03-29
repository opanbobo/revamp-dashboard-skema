export interface Category {
  category_set: number;
  client_id: string;
  descriptionz: string;
  input_data_date: string;
  pc_name: string;
  usere: string;
}

export interface CategoryResponse {
  count: number;
  next: string;
  previous: string;
  results: Category[];
}
