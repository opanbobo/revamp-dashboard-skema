import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { from, mergeMap, skip, Subscription } from 'rxjs';
import { HighchartsComponent } from '../../../core/components/highcharts/highcharts.component';
import { ChartType } from '../../../core/models/social-media';
import { SocialMediaService } from '../../../core/services/social-media.service';
import { WordCloudComponent } from '../components/word-cloud/word-cloud.component';
import { FilterService } from '../../../core/services/filter.service';
import { IconNewspaperComponent } from '../../../core/components/icons/newspaper/newspaper.component';
import { IconInfoComponent } from '../../../core/components/icons/info/info.component';
import { FilterState } from '../../../core/store/filter/filter.reducer';
import { CommonService } from '../../../core/services/common.service';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-social-media-index',
  standalone: true,
  imports: [
    CommonModule,
    WordCloudComponent,
    HighchartsComponent,
    IconNewspaperComponent,
    IconInfoComponent,
    SvgIconComponent,
  ],
  templateUrl: './social-media-index.component.html',
  styleUrl: './social-media-index.component.scss',
})
export class SocialMediaIndexComponent {
  subscription!: Subscription;

  listCharts: {
    isLoading: boolean;
    type: ChartType;
    title: string;
    data?: any;
    height?: string;
    largestValue?: number;
  }[] = [
    {
      type: 'emotion-map',
      title: 'Emotions',
      isLoading: true,
    },
    {
      type: 'social-network-analysis',
      title: 'SNA',
      height: '600px',
      isLoading: true,
    },
    {
      type: 'authors',
      title: 'Top Accounts',
      height: '520px',
      isLoading: true,
    },
    {
      type: 'key-hashtags',
      title: 'Top Hashtags',
      height: '520px',
      isLoading: true,
    },
  ];

  constructor(
    private service: SocialMediaService,
    private filterService: FilterService,
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.filterService.subscribe(({ start_date, end_date }: FilterState) => {
      this.getData(start_date, end_date);
    });

    this.subscription = this.commonService.darkMode$
      .pipe(skip(1))
      .subscribe(() => window.location.reload());
  }

  getData(startDate: string, endDate: string) {
    this.listCharts.forEach((v) => {
      v.data = undefined;
      v.isLoading = true;
    });

    from(this.listCharts)
      .pipe(
        mergeMap((chart) =>
          this.service
            .getChart({ type: chart.type, startDate, endDate })
            .pipe(
              mergeMap((res: any) => [{ type: chart.type, data: res?.data }])
            )
        )
      )
      .subscribe((res) => {
        const i = this.listCharts.findIndex((v) => v.type === res.type);

        if (i > -1 && res.data) {
          if (res.type === 'emotion-map') {
            const pointFormat = res.data.tooltip.pointFormat;
            res.data.tooltip.pointFormat = pointFormat.replace(
              '<td style="color: #222">',
              '<td>'
            );
          }
          this.listCharts[i].data = res.data;
        }
        this.listCharts[i].isLoading = false;
      });
  }
}
