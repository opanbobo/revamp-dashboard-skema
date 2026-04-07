import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { IconGlobeComponent } from '../../../../core/components/icons/globe/globe.component';
import { IconInfoComponent } from '../../../../core/components/icons/info/info.component';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { MediaChartComponent } from '../../components/media-chart/media-chart.component';
import { OverviewState } from '../../../../core/store/overview/overview.reducer';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store';
import { selectOverviewState } from '../../../../core/store/overview/overview.selectors';
import { getToneByMedia } from '../../../../core/store/overview/overview.actions';
import { Tone, ToneByMedia } from '../../../../core/models/tone-by-media.model';
import { CommonModule } from '@angular/common';
import { FilterState, initialState } from '../../../../core/store/filter/filter.reducer';
import { selectFilterState } from '../../../../core/store/filter/filter.selectors';
import { FilterRequestPayload } from '../../../../core/models/request.model';
import { SpinnerComponent } from '../../../../core/components/spinner/spinner.component';
import { NEGATIVE_TONE, NEUTRAL_TONE, POSITIVE_TONE } from '../../../../shared/utils/Constants';
import { Router } from '@angular/router';
import { FilterService } from '../../../../core/services/filter.service';
import { OverviewService } from '../../../../core/services/overview.service';
import { ToneService } from '../../../../core/services/tone.service';

@Component({
  selector: 'app-top-media',
  standalone: true,
  imports: [
    ChartModule,
    CardModule,
    ButtonModule,
    IconGlobeComponent,
    IconInfoComponent,
    MediaChartComponent,
    CommonModule,
    SpinnerComponent,
  ],
  templateUrl: './top-media.component.html',
  styleUrl: './top-media.component.scss',
})
export class TopMediaComponent implements OnInit {
  plugins = [ChartDataLabels];

  overviewState: Observable<OverviewState>;
  chartsData: any[] = [];
  isLoading: boolean = false;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private filterService: FilterService,
    private toneService: ToneService
  ) {
    this.overviewState = this.store.select(selectOverviewState);
  }
  filter: any;

  ngOnDestroy() {
    this.filter.unsubscribe();
  }

  ngOnInit() {
    this.filter = this.filterService.subscribe((filter) => {
      this.isLoading = true;
      this.toneService
        .getToneByMedia({...filter, maxSize: 10})
        .subscribe((data) => {
          this.chartsData = this.parseToChartData(data.data);
        })
        .add(() => {
          this.isLoading = false;
        });
    });
    // this.store.dispatch(
    //   getToneByMedia({ filter: initialState as FilterRequestPayload })
    // );
    // this.overviewState.subscribe(({ toneByMedia }) => {});
    // this.filterState.subscribe(this.onFilterChange);
  }

  // onFilterChange = (filterState: FilterState) => {
  //   const filter = { ...filterState } as FilterRequestPayload;
  //   this.store.dispatch(getToneByMedia({ filter }));
  // };

  parseToChartData = (toneByMedia: ToneByMedia[]) => {
    const documentStyle = getComputedStyle(document.documentElement);
    const positiveColor = documentStyle.getPropertyValue('--positive-color');
    const negativeColor = documentStyle.getPropertyValue('--negative-color');
    const neutralColor = documentStyle.getPropertyValue('--neutral-color');

    return toneByMedia.map((t) => {
      const simplifiedTones: any[] = [];
      const combinedTones: any = {};
      const totalTones = t.tones.reduce((prev, tone) => {
        if (Object.keys(tone)[0] === 'media favorability index') return prev;
        return prev + Object.values(tone)[0];
      }, 0);

      t.tones.forEach((tone) => {
        const key = Object.keys(tone)[0];
        if (key === 'media favorability index') return;
        const toneVal = Object.values(tone)[0];
        const percentageVal = (toneVal / totalTones) * 100;
        simplifiedTones.push(percentageVal.toFixed(0));
        combinedTones[key] = toneVal;
      });
      return {
        ...t,
        totalTones,
        combinedTones,
        toneValues: [POSITIVE_TONE, NEGATIVE_TONE, NEUTRAL_TONE],
        datasets: [
          {
            data: simplifiedTones,
            datalabels: { anchor: 'end' },
            backgroundColor: [positiveColor, negativeColor, 'gray'],
          },
        ],
      };
    });
  };

  onSelectTone = (mediaId: number, mediaName: string, tone: number) => {
    this.router.navigateByUrl(`/dashboard/articles-by-tone?mediaId=${mediaId}&tone=${tone}&mediaName=${mediaName}`);
  };
}
