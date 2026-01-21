import { Component } from '@angular/core';
import { IconInfoComponent } from '../../../../core/components/icons/info/info.component';
import { IconNewspaperComponent } from '../../../../core/components/icons/newspaper/newspaper.component';
import { ScrollerModule } from 'primeng/scroller';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { FilterRequestPayload } from '../../../../core/models/request.model';
import { AppState } from '../../../../core/store';
import { getArticlesByTone } from '../../../../core/store/analyze/analyze.actions';
import { AnalyzeState } from '../../../../core/store/analyze/analyze.reducer';
import { selectAnalyzeState } from '../../../../core/store/analyze/analyze.selectors';
import { Article } from '../../../../core/models/article.model';
import { SpinnerComponent } from '../../../../core/components/spinner/spinner.component';
import { initialState } from '../../../../core/store/filter/filter.reducer';
import { ImgFallbackDirective } from '../../../../core/directive/img-fallback.directive';
import { RouterLink } from '@angular/router';
import { FilterService } from '../../../../core/services/filter.service';

@Component({
  selector: 'app-featured-news',
  standalone: true,
  imports: [
    IconInfoComponent,
    IconNewspaperComponent,
    ScrollerModule,
    CommonModule,
    SpinnerComponent,
    ImgFallbackDirective,
    RouterLink,
  ],
  templateUrl: './featured-news.component.html',
  styleUrl: './featured-news.component.scss',
})
export class FeaturedNewsComponent {
  filter: any;
  analyzeState: Observable<AnalyzeState>;
  isLoading = false;
  articles: Article[] = [];

  constructor(
    private store: Store<AppState>,
    private filterService: FilterService
  ) {
    this.analyzeState = this.store.select(selectAnalyzeState);
  }

  ngOnInit() {
    this.store.dispatch(
      getArticlesByTone({
        filter: { ...initialState, tone: 0 } as FilterRequestPayload,
      })
    );

    this.analyzeState.subscribe(({ articlesByTone }) => {
      this.articles = articlesByTone.data;
      this.isLoading = articlesByTone.isLoading;
    });

    this.filter = this.filterService.subscribe((filter) => {
      this.store.dispatch(
        getArticlesByTone({
          filter: {
            ...initialState,
            ...filter,
          } as FilterRequestPayload,
        })
      );
    });
  }

  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
}
