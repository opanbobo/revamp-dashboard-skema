import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../core/services/article.service';
import { FilterState } from '../../../core/store/filter/filter.reducer';
import { FilterRequestPayload } from '../../../core/models/request.model';
import { FilterService } from '../../../core/services/filter.service';
import { Article } from '../../../core/models/article.model';
import { TitleCasePipe } from '../../../core/pipes/titlecase.pipe';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { ArticleListComponent } from '../../../core/components/article-list/article-list.component';
import { TONE_MAP } from '../../../shared/utils/Constants';
import moment from 'moment';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-articles-by-tone',
  standalone: true,
  imports: [SpinnerComponent, ArticleListComponent],
  templateUrl: './articles-by-tone.component.html',
  styleUrl: './articles-by-tone.component.scss',
})
export class ArticlesByToneComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  mediaId: number | null = null;
  mediaName: string | null = null;
  tone: number | null = null;
  category_id: string | null = null;
  toneLabel: string | null = null;
  date: string | null = null;

  articles: Article[] = [];
  page: number = 0;
  first: number = 0;
  rows: number = 16;
  totalRecords: number = 0;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private filterService: FilterService
  ) {
    const mediaId = this.route.snapshot.queryParamMap.get('mediaId')!;
    const mediaName = this.route.snapshot.queryParamMap.get('mediaName')!;
    const tone = this.route.snapshot.queryParamMap.get('tone');
    const categoryName = this.route.snapshot.queryParamMap.get('categoryName');
    const date = this.route.snapshot.queryParamMap.get('date');

    if (tone) {
      this.mediaId = +mediaId;
      this.mediaName = mediaName;
      this.tone = +tone;
      // this.category_id = categoryName;
      this.date = date;
      this.toneLabel = TONE_MAP[tone];
      this.filter = this.filterService.subscribe((filter) => {
        this.fetchArticlesByTone(filter);
      });
    } else {
      this.router.navigateByUrl('/dashboard/overview');
    }
  }

  fetchArticlesByTone = (filter: FilterRequestPayload) => {
    const req = {
      ...filter,
      media_id: this?.mediaId ?? 0,
      tone: this?.tone ?? 0,
      // category_id: this.category_id ?? 'all',
      start_date: this.date ? moment(this.date).format('YYYY-MM-DD') : filter.start_date,
      end_date: this.date ? moment(this.date).format('YYYY-MM-DD') : filter.end_date,
    };
    this.isLoading = true;
    this.articleService.getArticlesByTone(req as FilterRequestPayload).subscribe((data) => {
      this.isLoading = false;
      this.articles = data.data;
      this.totalRecords = data.recordsTotal;
    });
  };

  onPageChange = (event: any) => {
    this.page = event.page;
    this.rows = event.rows;
    this.first = event.first;
    this.fetchArticlesByTone({
      ...this.filterService.filter,
      page: event.page,
      size: event.rows,
    });
  };
}
