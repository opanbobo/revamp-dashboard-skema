import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AngularD3CloudModule } from 'angular-d3-cloud';
import { IconCarComponent } from '../../../../core/components/icons/car/car.component';
import { IconInfoComponent } from '../../../../core/components/icons/info/info.component';
import { OverviewState } from '../../../../core/store/overview/overview.reducer';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store';
import { selectOverviewState } from '../../../../core/store/overview/overview.selectors';
import { Location } from '../../../../core/models/all-count.model';
import {
  getAllCount,
  getWordCloud,
} from '../../../../core/store/overview/overview.actions';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-city',
  standalone: true,
  imports: [
    TableModule,
    AngularD3CloudModule,
    IconCarComponent,
    IconInfoComponent,
    CommonModule,
  ],
  templateUrl: './top-city.component.html',
  styleUrl: './top-city.component.scss',
})
export class TopCityComponent {
  overviewState: Observable<OverviewState>;
  cities: Location[] = [];
  totalArticles: number = 0;
  wordCloud: { text: string; value: number }[] = [];
  largestWordValue: number = 0;

  constructor(private store: Store<AppState>) {
    this.overviewState = this.store.select(selectOverviewState);
  }

  ngOnInit() {
    this.store.dispatch(getAllCount());
    this.store.dispatch(getWordCloud());
    this.overviewState.subscribe(({ allCount, wordCloud }) => {
      this.cities = allCount.data?.top_location.location ?? [];
      this.totalArticles =
        allCount.data?.top_location.total_top_location_article ?? 0;
      this.wordCloud = wordCloud.data.map((word) => ({
        text: word.name,
        value: word.weight,
      }));
      this.largestWordValue = wordCloud.data?.[0]?.weight ?? 0;
    });
  }

  wordCloudFontSizeMapper = (word: any) => {
    const minInput = 0;
    const maxInput = this.largestWordValue;
    const minOutput = 12;
    const maxOutput = 48;

    const clampedInput = Math.min(Math.max(word.value, minInput), maxInput);

    const scaleFactor =
      maxInput === Infinity
        ? maxOutput / (maxOutput - minOutput)
        : (maxOutput - minOutput) / (maxInput - minInput);

    const scaledOutput = Math.round(
      (clampedInput - minInput) * scaleFactor + minOutput
    );

    return Math.min(Math.max(scaledOutput, minOutput), maxOutput);
  };
}
