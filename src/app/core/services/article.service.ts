import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getUserFromLocalStorage } from '../../shared/utils/AuthUtils';
import { Article, ArticleResponse } from '../models/article.model';
import { CategoryResponse } from '../models/category.model';
import { HighlightsResponse } from '../models/highlights.model';
import { FilterRequestPayload } from '../models/request.model';
import { BASE_URL } from './../api/index';
import { generateNonce, generateTimestamp, generateSignature } from '../../shared/utils/SignatureUtils';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private baseUrl = BASE_URL;

  constructor(private http: HttpClient) {}

  getHighlights(filter: FilterRequestPayload): Observable<HighlightsResponse> {
    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      max_size: filter.max_size ?? 6,
      page: 1,
      media_id: filter.media_id ?? '',
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      tone: filter.tone ?? '',
    };

    return this.http.get<HighlightsResponse>(`${this.baseUrl}/v3/media-sov/latest-articles`, {
      params,
    });
  }

  getUserEditingPlus(filter: FilterRequestPayload): Observable<{ data: Article[]; recordsTotal: number }> {
    const isHourly = filter.start_date?.includes(' '); // space

    return this.http.post<{ data: Article[]; recordsTotal: number }>(`${this.baseUrl}/${isHourly ? 'v3' : 'v1'}/user/editingplus/`, {
      ...filter,
      media_id: 0,
      maxSize: 20,
      max_size: 20,
      page: filter.page ?? 0,
      size: filter.size ?? 10,
    });
  }

  getUserEditing(
    filter: FilterRequestPayload, 
    order: string = 'asc', 
    order_by: string = 'datee'
  ): Observable<ArticleResponse> {
    return this.http.post<ArticleResponse>(`${this.baseUrl}/v1/user/editing/`, {
      ...filter,
      media_id: 0,
      maxSize: filter.size ?? 16,
      page: filter.page ?? 0,
      order, 
      order_by, 
    });
  }

  getArticlesByTone(filter: FilterRequestPayload): Observable<ArticleResponse> {
    return this.http.post<ArticleResponse>(`${this.baseUrl}/v1/dashboard/article-by-tone`, {
      ...filter,
      media_id: filter.media_id ?? 0,
      page: filter.page ?? 0,
      maxSize: filter.maxSize ?? undefined,
      size: filter.size ?? 10,
    });
  }

  getMediaCountArticles({ article_ids, page, size }: { article_ids: number[]; page: number; size: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/v1/dashboard/media-count/articles`, {
      article_ids,
      page,
      size,
    });
  }

  getArticleById(articleId: string): Observable<{ data: Article }> {
    return this.http.get<{ data: Article }>(`${this.baseUrl}/v1/user/article/${articleId}`);
  }

  getKeywordsByArticleId(articleId: string): Observable<{ data: string[] }> {
    return this.http.post<{ data: string[] }>(`${this.baseUrl}/v1/user/keywords-by-article-id/`, { article_id: articleId });
  }

  deleteArticle(articleIds: Record<string, string>[]): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/v1/user/article/delete`, articleIds);
  }

  updateArticleTitle(payload: { article_id: string; category_id: string; title: string }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/v1/user/title/update`, payload);
  }

  updateArticleTone(payload: { article_id: string[]; category_id: string[]; tone: number }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/v1/user/tone/multiple/update`, payload);
  }

  updateArticleIssue(payload: { article_id: number[]; topic: string[]; new_topic: string }): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/v1/issue/update/`, payload);
  }

  updateArticleSave(payload: {
    advalue_bw: string;
    advalue_fc: string;
    article_id: number;
    category_ids: string[];
    circulation: string;
    datee: string;
    media_id: number;
    tone: number;
  }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/v1/user/article/save`, payload);
  }

  updateArticleSummary(payload: { article_id: number; category_id: string; summary: string }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/v1/user/summary/update`, payload);
  }

  getSubCategoriesDistinct(): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.baseUrl}/v1/user/subcategories-distinct/`);
  }

  searchArticles(filter: FilterRequestPayload): Observable<{ totalItems: number; results: Article[] }> {
    return this.http.post<{ totalItems: number; results: Article[] }>(`${this.baseUrl}/v1/search/`, {
      category_id: 'all',
      page: filter.page ?? 0,
      maxSize: filter.maxSize ?? 8,
      size: filter.size ?? 0,
      ...filter,
    });
  }

  searchArticlesV4(
    filter: FilterRequestPayload
  ): Observable<{ totalItems: number; results: Article[] }> {

    // 1. Normalize & map legacy payload → API v4 payload
    const v4Params = {
      term: filter.term ?? '',
      start_date: `${filter.start_date}T00:00:00`,
      end_date: `${filter.end_date}T23:00:00`,
      page: filter.page ?? 0,
      max_size: filter.maxSize ?? filter.size ?? 8,
      media_category: filter.media_category ?? 'all',
      search_field: filter.search_field ?? 'content'
    };

    // 2. Generate signing fields
    const nonce = generateNonce();
    const timestamp = generateTimestamp();
    const signature = generateSignature(v4Params, timestamp, nonce);

    // 3. Final request body
    const body = {
      ...v4Params,
      signature,
      timestamp,
      nonce
    };

    // 4. Send request (Authorization handled by interceptor)
    return this.http.post<{ totalItems: number; results: Article[] }>(
      `${this.baseUrl}/v4/search/`,
      body
    );
  }


  downloadDocs(articles: Article[]): Observable<{ data: string }> {
    const user = getUserFromLocalStorage();
    return this.http.post<{ data: string }>(`${this.baseUrl}/v1/user/download/docxs`, {
      articles,
      logo_name: user?.comp_icon ?? 'company/bpjs-kesehatan.png',
    });
  }

  downloadPdfs(articles: Article[]): Observable<{ data: { link: string } }> {
    const user = getUserFromLocalStorage();
    return this.http.post<{ data: { link: string } }>(`${this.baseUrl}/v1/user/download/pdfs`, {
      articles,
      doc_type: 1,
      logo_name: user?.comp_icon ?? 'company/bpjs-kesehatan.png',
    });
  }

  downloadSelectedExcel(filter: FilterRequestPayload, articles: Article[], search: string): Observable<any>{
    const article_ids = articles.map(({ article_id }) => article_id).join(',');
    const sentiments = articles
    .map(({ tone }) => {
      switch (tone) {
        case 1:
          return 'positive';
        case -1:
          return 'negative';
        case 0:
          return 'neutral';
        default:
          return null;
      }
    })
    .filter(Boolean)
    .join(','); 

    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      download_type : "excel",
      category_id: filter.category_id ?? '',
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      sentiments: sentiments,
      article_ids : article_ids,
      search: search ?? '',
    };
    return this.http.get<any>(`${this.baseUrl}/v3/user/editing/download`, { params });
  }

  downloadExcel(filter: FilterRequestPayload): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}/v1/search/download/`, {
      category_id: 'all',
      page: filter.page ?? 0,
      maxSize: filter.maxSize ?? 8,
      size: filter.size ?? 0,
      ...filter,
    });
  }

  sendMail(emails: string, articles: Article[]) {
    return this.http.post(`${this.baseUrl}/v1/user/editing/send-mail`, {
      email: emails.trim().replace(' ', ''),
      data: articles.map((v) => {
        return {
          article_id: v.article_id,
          category_id: v.category_id,
        };
      }),
    });
  }

  getArticlesHeadlines(filter: FilterRequestPayload): Observable<{ data: Article[] }> {
    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      max_size: filter.max_size ?? 6,
      page: 1,
      media_id: filter.media_id ?? '',
      category_set: filter.category_set ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      tone: filter.tone ?? '',
    };

    return this.http.get<{ data: Article[] }>(`${this.baseUrl}/v1/dashboard/article-headlines`, { params });
  }

  getTopArticles(filter: FilterRequestPayload): Observable<{ data: Article[] }> {
    const params = {
      start_date: filter.start_date ? `${filter.start_date} ${filter.start_time}` : '',
      end_date: filter.end_date ? `${filter.end_date} ${filter.end_time}` : '',
      max_size: filter.max_size ?? 20,
      page: 1,
      media_id: filter.media_id ?? '',
      category_set: filter.category_set ?? '',
      category_id: filter.category_id ?? '',
      user_media_type_id: filter.user_media_type_id ?? '',
      tone: filter.tone ?? '',
    };

    return this.http.get<{ data: Article[] }>(`${this.baseUrl}/v1/dashboard/top-articles`, { params });
  }

  deleteCategory(req: { article_id: string; category_id: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/v1/user/article/delete/category`, req);
  }
}
