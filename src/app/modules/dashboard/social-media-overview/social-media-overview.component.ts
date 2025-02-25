import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import moment from 'moment';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { from, mergeMap, skip, Subscription, tap } from 'rxjs';
import { HighchartsComponent } from '../../../core/components/highcharts/highcharts.component';
import { IconInfoComponent } from '../../../core/components/icons/info/info.component';
import { IconNewspaperComponent } from '../../../core/components/icons/newspaper/newspaper.component';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { ImgFallbackDirective } from '../../../core/directive/img-fallback.directive';
import { ChartDetails, ChartType } from '../../../core/models/social-media';
import { CommonService } from '../../../core/services/common.service';
import { FilterService } from '../../../core/services/filter.service';
import { SocialMediaService } from '../../../core/services/social-media.service';
import { FilterState } from '../../../core/store/filter/filter.reducer';
import { isDarkMode } from '../../../shared/utils/CommonUtils';
import { WordCloudComponent } from '../components/word-cloud/word-cloud.component';

@Component({
  selector: 'app-social-media-overview',
  standalone: true,
  imports: [
    CommonModule,
    WordCloudComponent,
    HighchartsComponent,
    IconNewspaperComponent,
    IconInfoComponent,
    TooltipModule,
    SpinnerComponent,
    ImgFallbackDirective,
    PaginatorModule,
  ],
  templateUrl: './social-media-overview.component.html',
  styleUrl: './social-media-overview.component.scss',
})
export class SocialMediaOverviewComponent implements OnInit, OnDestroy {
  @ViewChild('paginator') paginator!: Paginator;

  subscription!: Subscription;

  isLoading: boolean = false;
  filter!: FilterState;
  pagingInfo = {
    page: 1,
    size: 10,
    rowCount: 0,
  };

  chartDetails = {} as ChartDetails;

  listCharts: {
    isLoading: boolean;
    type: ChartType;
    title: string;
    description?: string;
    data?: any;
    height?: string;
    largestValue?: number;
  }[] = [
    {
      type: 'mention-graph',
      title: 'Mention Graph',
      isLoading: true,
    },
    {
      type: 'number-of-mentions',
      title: 'Daily Mentions',
      isLoading: true,
    },
    {
      type: 'share-of-sentiment',
      title: 'Sentiments',
      isLoading: true,
    },
    {
      type: 'share-of-platform',
      title: 'Platforms',
      height: '520px',
      isLoading: true,
    },
    {
      type: 'engaging-authors',
      title: 'Top Influencer',
      height: '520px',
      isLoading: true,
    },
    { type: 'tagcloud', title: 'Tag Cloud', isLoading: true },
    { type: 'reach-by-platform', title: 'Reach By Platform', isLoading: true },
  ];

  constructor(
    private service: SocialMediaService,
    private filterService: FilterService,
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.filterService.subscribe((filter) => {
      this.filter = filter;
      this.chartDetails = {} as ChartDetails;
      this.getData(filter.start_date, filter.end_date, filter.category_id, filter.category_set);
    });

    this.subscription = this.commonService.darkMode$.pipe(skip(1)).subscribe(() => window.location.reload());
  }

  getData(startDate: string, endDate: string, category_id?: string, category_set?: number) {
    from(this.listCharts)
      .pipe(
        tap((v) => {
          v.isLoading = true;
          v.data = undefined;
        }),
        mergeMap((v, i) =>
          this.service
            .getChart({ type: v.type, startDate, endDate, category_id, category_set })
            .pipe(mergeMap((res: any) => [{ type: v.type, data: res?.data, index: i }]))
        )
      )
      .subscribe((res) => {
        const i = res.index;
        if (res.data) {
          this.listCharts[i].description = res.data.caption.text;
          res.data.title.text = this.listCharts[i].title;
          delete res.data['caption'];

          if (isDarkMode()) {
            if (res.data?.xAxis?.labels?.style?.color) {
              res.data.xAxis.labels.style.color = 'white';
            }
            if (res.data?.yAxis?.labels?.style?.color) {
              res.data.yAxis.labels.style.color = 'white';
            }
          }

          res.data.plotOptions.series = {
            ...res.data.plotOptions.series,
            point: {
              events: {
                click: ({ point }: any) => this.getChartDetails(res.type, point, 0),
              },
            },
          };
          this.listCharts[i].data = res.data;
        }
        this.listCharts[i].isLoading = false;
      });
  }

  getChartDetails(type: ChartType, data: any, page: number) {
    this.isLoading = true;
    this.pagingInfo.page = page + 1;

    this.chartDetails.type = type;
    this.chartDetails.data = data;
    this.chartDetails.title = this.listCharts.find((v) => v.type === type)?.title ?? '';

    if (this.pagingInfo.page === 1) this.pagingInfo.rowCount = 0;
    setTimeout(() => {
      const el = document.getElementById('chartDetails');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const label: string = data.options.label;
    const tone: string = data?.series?.name;
    const author: string = data?.drilldownToken?.filters?.filterAuthors?.values?.[0];
    const tag: string = data?.drilldownToken?.filters?.filterTags?.[0];
    const filters = data?.series?.options?.drilldownToken?.filters;

    let start_date = this.filter.start_date;
    let end_date = this.filter.end_date;

    switch (type) {
      case 'number-of-mentions':
        this.chartDetails.subtitle = moment(data.x).format('DD MMM, YYYY');
        start_date = moment(new Date(data.x)).format('YYYY-MM-DD');
        end_date = moment(new Date(data.x)).format('YYYY-MM-DD');
        break;
      case 'share-of-sentiment':
        this.chartDetails.subtitle = tone;
        break;
      case 'mention-graph':
        this.chartDetails.subtitle = data.id;
        break;
      case 'engaging-authors':
        this.chartDetails.subtitle = author;
        break;
      default:
        this.chartDetails.subtitle = label;
    }

    this.service
      .getChartMentions({
        start_date,
        end_date,
        page: this.pagingInfo.page,
        size: this.pagingInfo.size,
        category_id: this.filter.category_id,
        category_set: this.filter.category_set,
        ...(data.drilldownToken?.filters?.keywords[0] && { keyword: data.drilldownToken.filters.keywords[0] }),
        ...(type === 'number-of-mentions' && { keywords: filters.keywords[0], sources : filters.sources[0], start : filters.interval.start, end : filters.interval.end, periodType : filters.interval.periodType}),
        ...(['reach-by-platform', 'share-of-platform'].includes(type) && { platform: label }),
        ...(['mention-graph', 'tagcloud'].includes(type) && { tag }),
        ...(type === 'share-of-sentiment' && { tone: tone.toLowerCase() }),
        ...(type === 'engaging-authors' && { author }),
      })
      .subscribe({
        next: (res) => {
          this.chartDetails.mentionsData = res.data;
          this.pagingInfo.rowCount = res.meta.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.chartDetails.mentionsData.length = 0;
          this.isLoading = false;
        },
      });
  }

  onClickChartDetails(data: any) {
    window.open(data.url, '_blank');
  }

  get chartDetailsLabel() {
    return [this.chartDetails.title, this.chartDetails.subtitle].join(' - ');
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
