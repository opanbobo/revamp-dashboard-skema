import { Component } from '@angular/core';
import { TileComponent } from '../../../../core/components/tile/tile.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../core/store';
import { selectOverviewState } from '../../../../core/store/overview/overview.selectors';
import { OverviewState } from '../../../../core/store/overview/overview.reducer';
import { Observable } from 'rxjs';
import { getMediaCount } from '../../../../core/store/overview/overview.actions';
import { CommonModule } from '@angular/common';
import { FilterState, initialState } from '../../../../core/store/filter/filter.reducer';
import { selectFilterState } from '../../../../core/store/filter/filter.selectors';
import { FilterRequestPayload } from '../../../../core/models/request.model';
import { SpinnerComponent } from '../../../../core/components/spinner/spinner.component';
import { FilterService } from '../../../../core/services/filter.service';
import { OverviewService } from '../../../../core/services/overview.service';

interface MediaCountTiles {
  print: number;
  online: number;
  tv: number;
  radio: number;
  total: number;
}
@Component({
  selector: 'app-overview-tiles',
  standalone: true,
  imports: [CommonModule, TileComponent, SpinnerComponent],
  templateUrl: './overview-tiles.component.html',
  styleUrl: './overview-tiles.component.scss',
})
export class OverviewTilesComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  overviewState: Observable<OverviewState>;
  isLoading: boolean = false;
  mediaCount: MediaCountTiles = {
    online: 0,
    print: 0,
    total: 0,
    tv: 0,
    radio: 0
  };

  constructor(
    private store: Store<AppState>,
    private filterService: FilterService,
    private overviewService: OverviewService
  ) {
    this.overviewState = this.store.select(selectOverviewState);
  }

  ngOnInit() {
    this.filter = this.filterService.subscribe((filter) => {
      this.isLoading = true;
      this.overviewService
        .getMediaCount(filter)
        .subscribe((data) => {
          this.onOverviewStateChanges(data.data);
        })
        .add(() => {
          this.isLoading = false;
        });
    });
    // this.store.dispatch(
    //   getMediaCount({ filter: initialState as FilterRequestPayload })
    // );
    // this.filterState.subscribe(this.onFilterStateChanges);
    // this.overviewState.subscribe(this.onOverviewStateChanges);
  }

  // onFilterStateChanges = (filterState: FilterState) => {
  //   const filter = { ...filterState } as FilterRequestPayload;
  //   this.store.dispatch(getMediaCount({ filter }));
  // };

  onOverviewStateChanges = (data: any) => {
    const mediaCountTmp = { ...this.mediaCount };
    data.forEach((media: any) => {
      switch (media.label?.toLowerCase()) {
        case 'print':
          mediaCountTmp.print = media.total ?? 0;
          break;
        case 'online':
          mediaCountTmp.online = media.total ?? 0;
          break;
        case 'tv':
          mediaCountTmp.tv = media.total ?? 0;
          break;
        case 'radio':
          mediaCountTmp.radio = media.total ?? 0;
          break;
      }
    });
    mediaCountTmp.total = mediaCountTmp.print + mediaCountTmp.online + mediaCountTmp.tv + mediaCountTmp.radio;

    this.mediaCount = mediaCountTmp;
  };
}
