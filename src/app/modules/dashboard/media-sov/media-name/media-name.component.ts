import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { ScrollerModule } from 'primeng/scroller';
import { IconInfoComponent } from '../../../../core/components/icons/info/info.component';
import { IconMicComponent } from '../../../../core/components/icons/mic/mic.component';
import { SpinnerComponent } from '../../../../core/components/spinner/spinner.component';
import { ImgFallbackDirective } from '../../../../core/directive/img-fallback.directive';
import { MediaSOV } from '../../../../core/models/media.model';
import { FilterRequestPayload } from '../../../../core/models/request.model';
import { FilterService } from '../../../../core/services/filter.service';
import { MediaSOVService } from '../../../../core/services/media-sov.service';
import { AppState } from '../../../../core/store';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-media-name',
  standalone: true,
  imports: [IconMicComponent, IconInfoComponent, ScrollerModule, CommonModule, ImgFallbackDirective, SpinnerComponent, CommonModule, InputTextModule, InputTextareaModule, ReactiveFormsModule, FormsModule],
  templateUrl: './media-name.component.html',
  styleUrl: './media-name.component.scss',
})
export class MediaNameComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  medias: MediaSOV[] = [];
  isLoading: boolean = false;
  selectedMedia: MediaSOV | null = null;
  total = 0;
  page = 1;
  searchForm = this.fb.group({
    query: '',
    field: 'title',
  });

  @Input() setMedia: any;

  constructor(
    private mediaSOVService: MediaSOVService,
    private filterService: FilterService,
    private store: Store<AppState>,
    private fb: FormBuilder
  ) {}

  fetchData = (filter: FilterRequestPayload, isSearch: boolean) => {
    this.isLoading = true;
    this.mediaSOVService
      .getMedias({...this.filterService.filter, ...filter, term: this.searchForm.get('query')?.value ?? ''})
      .subscribe(({ data, meta }) => {
        // if the fetch data come from search form
        if(isSearch){
          this.medias = data;
        } else {
          this.medias = [...this.medias, ...data].filter((v) => v.doc_count > 0);
        }
        if (this.page === 1 && data.length > 0) {
        this.setMedia(data[0]);
        this.selectedMedia = data[0]; // <-- make sure selectedMedia is also set
      }
        this.page = this.page + 1;
        this.total = meta.total_data;
      })
      .add(() => {
        this.isLoading = false;
      });
  };

  ngOnInit() {
    this.filter = this.filterService.subscribe((filter) => {
      this.page = 1;
      this.medias = [];
      this.fetchData({ ...filter } as FilterRequestPayload, false);
    });

    this.searchForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe((v) => {
      console.log(`search ${v.query}`)
      this.page = 1;
      this.fetchData({ page: 1, term: v.query ?? ''}, true);
    });
  }

  onClick(media: MediaSOV) {
    this.selectedMedia = media;
    this.setMedia(media);
  }

  onLazyLoad(event: any) {
    const h = event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight;

    if (h === 0 && this.medias.length > 0) {
      if (this.medias.length >= this.total) return;
      this.fetchData({ ...this.filterService.filter, page: this.page }, false);
    }
  }
}
