import { Component, Input } from '@angular/core';
import { IconInfoComponent } from '../../../../core/components/icons/info/info.component';
import { Store, select } from '@ngrx/store';
import { Observable, map, pluck } from 'rxjs';
import { FilterRequestPayload } from '../../../../core/models/request.model';
import { AppState } from '../../../../core/store';
import { FilterState, initialState } from '../../../../core/store/filter/filter.reducer';
import { ScrollerModule } from 'primeng/scroller';
import { CommonModule } from '@angular/common';
import { ImgFallbackDirective } from '../../../../core/directive/img-fallback.directive';
import { SpinnerComponent } from '../../../../core/components/spinner/spinner.component';
import { IconDialogueComponent } from '../../../../core/components/icons/dialogue/dialogue.component';
import { MediaSOVService } from '../../../../core/services/media-sov.service';
import { FilterService } from '../../../../core/services/filter.service';
import { Article } from '../../../../core/models/article.model';
import { TONE_MAP } from '../../../../shared/utils/Constants';
import { MediaSOVState } from '../../../../core/store/media-sov/media-sov.reducer';
import { selectMediaSOVState } from '../../../../core/store/media-sov/media-sov.selectors';
import { RouterLink } from '@angular/router';
import { Media } from '../../../../core/models/media.model';
import _ from 'lodash';

@Component({
  selector: 'app-statements',
  standalone: true,
  imports: [IconDialogueComponent, IconInfoComponent, ScrollerModule, CommonModule, ImgFallbackDirective, SpinnerComponent, RouterLink],
  templateUrl: './statements.component.html',
  styleUrl: './statements.component.scss',
})
export class StatementsComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
    this.prevMedia = null;
  }
  articles: Article[] = [];
  isLoading: boolean = false;
  mediaSOVState: Observable<MediaSOVState>;
  prevMedia: any | null = null;
  prevTone: any | null = null;

  selectedMedia: any = null;
  selectedTone: any = null;

  @Input() media: any;
  @Input() tone: any;

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
      .getLatestArticles({ ...filter, max_size: '20' })
      .subscribe(({ data }) => {
        this.articles = data.map((article) => {
          return { ...article, toneLabel: TONE_MAP[article?.tone ?? ''] };
        });
      })
      .add(() => {
        this.isLoading = false;
      });
  };

  ngOnInit() {

    // this.filter = this.filterService.subscribe((filter) => {
    //   this.fetchData({ ...filter } as FilterRequestPayload);
    // });
    // this.mediaSOVState
    //   .pipe(map(({ media, tone }) => ({ media, tone })))
    //   .subscribe(({ media, tone }) => {
    //     if (
    //       (media && !_.isEqual(media, this.prevMedia)) ||
    //       (tone && !_.isEqual(tone, this.prevTone))
    //     ) {
    //       this.prevMedia = media;
    //       this.prevTone = tone;
    //       this.fetchData({
    //         ...this.filterService.filter,
    //         media_id: media?.media_id,
    //         tone,
    //       });
    //     }
    //   });
    // this.mediaSOVState.subscribe((data) => {
    //   // this.fetchData({
    //   //   ...this.filterService.filter,
    //   //   tone: data.tone,
    //   //   media_id: data.media?.media_id,
    //   // } as FilterRequestPayload);
    // });
  }

  ngOnChanges(changes: any) {

    const { media, tone } = changes;
    if (media && !media.firstChange && !_.isEqual(media.currentValue, media.previousValue)) {
      this.selectedMedia = media;
      this.fetchData({
        ...this.filterService.filter,
        tone: this.selectedTone?.currentValue,
        media_id: media.currentValue?.media_id,
      });
    }

    if (tone && !tone.firstChange && !_.isEqual(tone.currentValue, tone.previousValue)) {
      this.selectedTone = tone;
      this.fetchData({
        ...this.filterService.filter,
        tone: tone.currentValue,
        media_id: this.selectedMedia?.currentValue?.media_id,
      });
    }
  }
}
