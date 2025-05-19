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

@Component({
  selector: 'app-latest-news',
  standalone: true,
  imports: [IconNewspaperComponent, IconInfoComponent, CommonModule, ImgFallbackDirective, SpinnerComponent, RouterLink],
  templateUrl: './latest-news.component.html',
  styleUrl: './latest-news.component.scss',
})
export class LatestNewsComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  articles: Article[] = [];
  isLoading: boolean = false;
  mediaSOVState: Observable<MediaSOVState>;
  prevMedia: MediaSOV | null = null;

  @Input() media: any = null;

  constructor(
    private mediaSOVService: MediaSOVService,
    private filterService: FilterService,
    private store: Store<AppState>
  ) {
    this.mediaSOVState = this.store.select(selectMediaSOVState);
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
}
