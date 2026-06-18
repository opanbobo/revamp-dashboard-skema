import { Component, Input } from '@angular/core';
import { IconInfoComponent } from '../../../../core/components/icons/info/info.component';
import { IconNewspaperComponent } from '../../../../core/components/icons/newspaper/newspaper.component';
import { CommonModule } from '@angular/common';
import { ImgFallbackDirective } from '../../../../core/directive/img-fallback.directive';
import { Store } from '@ngrx/store';
import { Observable, pluck } from 'rxjs';
import { FilterRequestPayload } from '../../../../core/models/request.model';
import { AppState } from '../../../../core/store';
import { Article } from '../../../../core/models/article.model';
import { SpinnerComponent } from '../../../../core/components/spinner/spinner.component';
import { MediaSOVService } from '../../../../core/services/media-sov.service';
import { FilterService } from '../../../../core/services/filter.service';
import { MediaSOVState } from '../../../../core/store/media-sov/media-sov.reducer';
import { selectMediaSOVState } from '../../../../core/store/media-sov/media-sov.selectors';
import _ from 'lodash';
import { MediaSOV } from '../../../../core/models/media.model';
import { RouterLink } from '@angular/router';
import { IconSearchComponent } from '../../../../core/components/icons/search/search.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ScrollerModule } from 'primeng/scroller';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-latest-news',
  standalone: true,
  imports: [IconNewspaperComponent, IconInfoComponent, IconSearchComponent, CommonModule, ImgFallbackDirective, SpinnerComponent, RouterLink, DialogModule, ButtonModule, ScrollerModule, TooltipModule],
  templateUrl: './latest-news.component.html',
  styleUrl: './latest-news.component.scss',
})
export class LatestNewsComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  articles: Article[] = [];
  moreArticles: Article[] = [];
  isLoading: boolean = false;
  mediaSOVState: Observable<MediaSOVState>;
  prevMedia: MediaSOV | null = null;
  showMoreModal: boolean = false;
  total = 0;
  page = 1;

  @Input() media: any = null;

  constructor(
    private mediaSOVService: MediaSOVService,
    private filterService: FilterService,
    private store: Store<AppState>
  ) {
    this.mediaSOVState = this.store.select(selectMediaSOVState);
    // console.log(`MediaSOVState initialized: ${this.mediaSOVState}`);
  }

  fetchData = (filter: FilterRequestPayload) => {
    this.isLoading = true;
    this.mediaSOVService
      .getLatestArticles(filter)
      .subscribe(({ data }) => {
        this.articles = data ?? [];
      })
      .add(() => {
        this.isLoading = false;
      });
  };

  ngOnChanges(changes: any) {
    const { media } = changes;
    if (!media.firstChange && !_.isEqual(media.currentValue, media.previousValue)) {
      this.moreArticles = [];
      this.page = 1;
      console.log(`Media changed: ${media.currentValue}`);
      this.fetchData({
        ...this.filterService.filter,
        media_id: media.currentValue?.media_id,
      });
    }
  }

  ngOnInit() {
    // this.filter = this.filterService.subscribe((filter) => {
    //   this.fetchData({ ...filter, media_id: this.prevMedia?.media_id });
    // });
  }

  onLazyLoad(event: any) {
    console.log('onLazyLoad');
    const h = event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight;

    if (h === 0 && this.moreArticles.length > 0) {
      console.log('Fetching more articles');
      console.log(`Current total: ${this.total}, Current articles length: ${this.moreArticles.length}`);
      if (this.moreArticles.length >= this.total) return;
      this.fetchMoreArticles();
    }
  }

  fetchMoreArticles() {
    if (!this.showMoreModal) {
      this.showMoreModal = true;
    }
    
    this.isLoading = true;

    this.mediaSOVService
      .getLatestArticles({
        ...this.filterService.filter,
        media_id: this.media?.media_id,
        page: this.page,
        max_size: '20',
      })
      .subscribe(({ data, meta }) => {
        this.moreArticles = [...this.moreArticles, ...(data ?? [])]; // ✅ append new articles
        this.total = meta.total_data ?? 0; // ✅ update total count 
        console.log(`Total more articles: ${this.moreArticles.length}`);
        console.log(`Meta: ${meta.total_data}`);
        this.page += 1;
      })
      .add(() => {
        this.isLoading = false;
      });
  }

}
