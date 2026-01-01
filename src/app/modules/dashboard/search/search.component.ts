import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorState } from 'primeng/paginator';
import { ArticleListComponent } from '../../../core/components/article-list/article-list.component';
import { IconArticleNotFoundComponent } from '../../../core/components/icons/article-notfound/article-notfound.component';
import { IconSearchComponent } from '../../../core/components/icons/search/search.component';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { Article } from '../../../core/models/article.model';
import { FilterRequestPayload } from '../../../core/models/request.model';
import { ArticleService } from '../../../core/services/article.service';
import { PreferenceService } from '../../../core/services/preference.service';
import { ButtonSecondaryComponent } from '../../../core/components/button-secondary/button-secondary.component';
import { MessageService } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';

interface Option {
  name: string;
  value: string | number;
}

const SEARCH_LOCAL_KEY = 'search_terms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    InputTextModule,
    CalendarModule,
    ButtonModule,
    IconSearchComponent,
    DropdownModule,
    FormsModule,
    CommonModule,
    SpinnerComponent,
    ArticleListComponent,
    IconArticleNotFoundComponent,
    ButtonSecondaryComponent,
    MessagesModule
  ],
  providers: [MessageService],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  isLoading: boolean = false;
  hasSearched = false;

  filter: any;

  selectedMedia: string = 'all';
  searchTerm: string = '';
  selectedContent: string = 'title';
  startDate: Date = moment().subtract(1, 'days').toDate();
  endDate: Date = new Date();

  articles: Article[] = [];
  page: number = 0;
  first: number = 0;
  rows: number = 8;
  totalRecords: number = 0;

  contentOptions: Option[] = [
    { name: 'Title', value: 'title' },
    { name: 'Content', value: 'content' },
  ];
  mediaOptions: Option[] = [];

  isLoadingMediaOptions: boolean = true;

  constructor(
    private preferenceService: PreferenceService,
    private articleService: ArticleService,
    private messageService: MessageService
  ) {
    this.getMediaOptions();
    const existingSearch = localStorage.getItem(SEARCH_LOCAL_KEY);
    if (existingSearch) {
      const searchTermsObj = JSON.parse(existingSearch);
      this.selectedMedia = searchTermsObj['media_category'] ?? 'all';
      this.searchTerm = searchTermsObj['term'] ?? '';
      this.selectedContent = searchTermsObj['search_field'] ?? 'title';

      if (searchTermsObj['start_date']) {
        this.startDate = moment(searchTermsObj['start_date']).toDate();
      }
      if (searchTermsObj['end_date']) {
        this.endDate = moment(searchTermsObj['end_date']).toDate();
      }

      this.fetchArticlesV4({
        start_date: moment(this.startDate).format('YYYY-MM-DD'),
        end_date: moment(this.endDate).format('YYYY-MM-DD'),
        search_field: this.selectedContent,
        media_category: this.selectedMedia,
        size: this.rows,
        maxSize: this.rows,
        term: this.searchTerm,
      });
    }
  }

  getMediaOptions = () => {
    this.preferenceService.getMediaCategories().subscribe(
      (response) => {
        const mediaOptions = response.results.map((category) => ({
          name: category.value,
          value: category.key,
        }));
        this.mediaOptions = [...this.mediaOptions, ...mediaOptions];
      },
      () => {
        // on Error
      },
      () => {
        this.isLoadingMediaOptions = false;
      }
    );
  };

  fetchArticles = (req: FilterRequestPayload) => {
    this.isLoading = true;
    this.articleService
      .searchArticles(req)
      .subscribe(({ results, totalItems }) => {
        this.totalRecords = totalItems;
        this.articles = results;
      })
      .add(() => {
        this.isLoading = false;
        this.hasSearched = true;
      });
  };

  fetchArticlesV4 = (req: FilterRequestPayload) => {
    this.isLoading = true;
    this.articleService
      .searchArticlesV4(req)
      .subscribe(({ results, totalItems }) => {
        console.log('FETCH V4');
        console.log(results);
        this.totalRecords = totalItems;
        this.articles = results;
      })
      .add(() => {
        this.isLoading = false;
        this.hasSearched = true;
      });
  };

  onSearch() {
    this.page = 0;
    const payload = {
      start_date: moment(this.startDate).format('YYYY-MM-DD'),
      end_date: moment(this.endDate).format('YYYY-MM-DD'),
      search_field: this.selectedContent,
      media_category: this.selectedMedia,
      page: this.page,
      term: this.searchTerm,
    };
    window.localStorage.setItem(SEARCH_LOCAL_KEY, JSON.stringify(payload));
    this.fetchArticlesV4(payload);
  }

  onDownload = () => {
    this.page = 0;
    const payload = {
      start_date: moment(this.startDate).format('YYYY-MM-DD'),
      end_date: moment(this.endDate).format('YYYY-MM-DD'),
      search_field: this.selectedContent,
      media_category: this.selectedMedia,
      page: this.page,
      term: this.searchTerm,
    };

    this.downloadExcel(payload);
  }

  downloadExcel = (req: FilterRequestPayload) => {
    this.articleService
      .downloadExcel(req)
      .subscribe(({ data }) => {
        window.open(data, '_blank')?.focus()
      },
      (e) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: e.error.data.message
        });
        console.log(e.error.data.message)
      })
  }

  onPageChange = (e?: PaginatorState) => {
    if (e) {
      this.page = e.page!;
      this.first = e.first!;
    }

    this.fetchArticlesV4({
      start_date: moment(this.startDate).format('YYYY-MM-DD'),
      end_date: moment(this.endDate).format('YYYY-MM-DD'),
      search_field: this.selectedContent,
      media_category: this.selectedMedia,
      term: this.searchTerm,
      page: this.page,
      size: this.rows,
      maxSize: this.rows,
    });
  };

  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
}
