import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import moment from 'moment';
import { ChartModule } from 'primeng/chart';
import { Observable, Subscription } from 'rxjs';
import { ActionButtonProps, ChartCardComponent } from '../../../../../core/components/chart-card/chart-card.component';
import { SpinnerComponent } from '../../../../../core/components/spinner/spinner.component';
import { MediaVisibility } from '../../../../../core/models/media-visibility.model';
import { AnalyzeService } from '../../../../../core/services/analyze.service';
import { FilterService } from '../../../../../core/services/filter.service';
import { AppState } from '../../../../../core/store';
import { AnalyzeState } from '../../../../../core/store/analyze/analyze.reducer';
import { selectAnalyzeState } from '../../../../../core/store/analyze/analyze.selectors';
import { barOpacityPlugin, htmlLegendPlugin } from '../../../../../shared/utils/ChartUtils';
import { TabViewModule } from 'primeng/tabview';
import { TabMenuModule } from 'primeng/tabmenu';

@Component({
  selector: 'app-media-visibility',
  standalone: true,
  imports: [
    ChartCardComponent,
    ChartModule,
    SpinnerComponent,
    CommonModule,
    TabViewModule,
    TabMenuModule,
  ],
  templateUrl: './media-visibility.component.html',
  styleUrl: './media-visibility.component.scss',
})
export class MediaVisibilityComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  filter: any;

  visibilityChartLineData: any;
  visibilityChartLineOpts: any;

  visibilityChartBarData: any;
  visibilityChartBarOpts: any;
  visibilityChartBarPlugins = [barOpacityPlugin];

  visibilityChartActionButton!: ActionButtonProps;
  visibilityPieActionButton!: ActionButtonProps;

  visibilityPieData: any;
  visibilityPieOpts: any;
  visibilityPiePlugins = [htmlLegendPlugin];

  visibilityBarComparisonData: any;
  visibilityBarComparisonOpts: any;
  visibilityBarComparisonPlugins = [htmlLegendPlugin];

  sentimentBarData: any;
  sentimentBarOpts: any;

  analyzeState: Observable<AnalyzeState>;
  isLoading = false;
  isDrilldownVisibilityChart = false;

  maxLineValue = 0;
  maxBarValue = 0;

  tabItems = [
    { label: 'Pie Chart', key: 'pie' },
    { label: 'Bar Comparison', key: 'bar' },
    { label: 'Sentiment Analysis', key: 'sentiment' },
  ];

  activeTab = this.tabItems[0];
  visibilityBarChartHeight = '300px';

  onActiveItemChange(event: any) {
    this.activeTab = event;
  }

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private filterService: FilterService,
    private analyzeService: AnalyzeService
  ) {
    this.analyzeState = this.store.select(selectAnalyzeState);

    this.visibilityChartActionButton = {
      icon: 'pi-ellipsis-h',
      type: 'toggle',
      toggle: {
        value: false,
        offIcon: 'pi-ellipsis-h',
        onIcon: 'pi-ellipsis-h',
      },
    };

    this.visibilityPieActionButton = {
      icon: 'pi-ellipsis-h',
      type: 'toggle',
      toggle: {
        value: false,
        offIcon: 'pi-ellipsis-h',
        onIcon: 'pi-ellipsis-h',
      },
    };
  }

  ngOnInit(): void {
    this.initChartOpts();

    this.subscriptions.add(
      this.filterService.subscribe((v) => {
        this.filter = v;
        this.getData();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getData(): void {
    this.isLoading = true;
    this.isDrilldownVisibilityChart = false;

    const sub = this.analyzeService
      .getMediaVisibility(this.filter)
      .subscribe((res) => {
        this.isLoading = false;
        this.initChartData(res.data);
        this.calculateBarChartHeight();
      });

    this.subscriptions.add(sub);
  }

  private calculateBarChartHeight(): void {
    const barCount =
      this.visibilityBarComparisonData?.labels?.length ?? 0;

    const perBarPx = 30;
    const minHeight = 200;
    const maxHeight = 1600;

    const calculatedHeight = barCount * perBarPx;

    this.visibilityBarChartHeight =
      `${Math.min(maxHeight, Math.max(minHeight, calculatedHeight))}px`;

    console.log('Bar count:', barCount);
    console.log('Bar chart height:', this.visibilityBarChartHeight);
  }



  initChartData(mediaVisibility: MediaVisibility[]): void {
    if (!mediaVisibility.length) return;

    const {
      lineDatasets,
      lineLabels,
      pieLabels,
      pieDatasets,
      visibilityBarDatasets,
      visibilityBarComparisonData,
      sentimentBarData
    } = this.getChartData(mediaVisibility);

    this.visibilityPieData = { labels: pieLabels, datasets: pieDatasets };

    this.visibilityChartLineData = {
      labels: lineLabels,
      datasets: lineDatasets,
    };

    this.visibilityChartBarData = {
      labels: lineLabels,
      datasets: visibilityBarDatasets,
    };

    this.maxLineValue = this.getMaxValue(lineDatasets);
    this.maxBarValue = this.getMaxValue(visibilityBarDatasets);

    console.log('Max line value:', this.maxLineValue);
    console.log('Max bar value:', this.maxBarValue);

    this.visibilityBarComparisonData = visibilityBarComparisonData;
    this.sentimentBarData = sentimentBarData;
  }

  onVisibilityPieSelect(value: any, type: string): void {
    let mediaName;
    let date;

    if (type === 'line') {
      const data = this.visibilityChartLineData.datasets[value.element.datasetIndex];
      mediaName = data.label;
      date = data.date[value.element.index];

      const startDate = new Date(this.filter.start_date).getDate();
      const endDate = new Date(this.filter.end_date).getDate();

      if (startDate === endDate) {
        this.router.navigate(['/dashboard/articles-by-media'], {
          queryParams: { mediaName, date },
        });
        return;
      }

      this.onVisibilityChartDayClick(date, mediaName);
      return;
    }

    if (type === 'bar') {
      const data = this.visibilityChartBarData.datasets[value.element.datasetIndex];
      mediaName = data.label;
      date = data.date[value.element.index];
    } else if (type === 'pie') {
      const data = this.visibilityPieData.datasets[value.element.datasetIndex];
      mediaName = data.mediaIds[value.element.index];
    }

    this.router.navigate(['/dashboard/articles-by-media'], {
      queryParams: { mediaName, date },
    });
  }

  onVisibilityChartDayClick(date: string, mediaName: string): void {
    if (this.isDrilldownVisibilityChart) {
      this.router.navigate(['/dashboard/articles-by-media'], {
        queryParams: { mediaName, date },
      });
      return;
    }

    this.isLoading = true;

    const sub = this.analyzeService
      .getMediaVisibility({
        ...this.filterService.filter,
        start_date: moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end_date: moment(date).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      })
      .subscribe((res) => {
        this.isDrilldownVisibilityChart = true;

        const { lineDatasets, lineLabels, visibilityBarDatasets } =
          this.getChartData(res.data);

        this.visibilityChartLineData = {
          labels: lineLabels,
          datasets: lineDatasets,
        };

        this.visibilityChartBarData = {
          labels: lineLabels,
          datasets: visibilityBarDatasets,
        };

        this.isLoading = false;
      });

    this.subscriptions.add(sub);
  }

  initChartOpts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const isDarkMode = JSON.parse(window.localStorage.getItem('useDarkMode') ?? 'false');

    this.visibilityPieOpts = {
      plugins: {
        legend: { display: false },
        htmlLegend: { containerID: 'legend-container', flexDirection: 'row' },
      },
    };

    this.visibilityChartBarOpts = {
      maintainAspectRatio: false,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        barOpacityPlugin: { opacity: 1 },
        legend: {
          position: 'bottom',
          align: 'start',
          labels: {
            padding: 32,
            boxWidth: 14,
            boxHeight: 5,
            color: isDarkMode ? 'white' : documentStyle.getPropertyValue('--text-color'),
          },
        },
      },
      scales: {
        x: { stacked: true, ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } },
        y: { stacked: true, ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } },
      },
    };

    this.visibilityChartLineOpts = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDarkMode ? 'white' : documentStyle.getPropertyValue('--text-color'),
          },
        },
      },
      elements: { point: { radius: 0, hitRadius: 20 } },
      scales: {
        x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } },
        y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } },
      },
    };

    this.visibilityBarComparisonOpts = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      responsive: false,
      layout: {
        padding: {
          left: 20,
          right: 30,
          top: 20,
          bottom: 20
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDarkMode ? 'white' : documentStyle.getPropertyValue('--text-color'),
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            font: {
              size: 12
            },
            padding: 10
          },
          grid: {
            display: false
          },
          afterFit: (scale: any) => {
            scale.width = 280;
          }
        }
      },
      elements: {
        bar: {
          borderWidth: 0,
        }
      }
    };

    this.sentimentBarOpts = {
      indexAxis: 'y',
      responsive: true,

      plugins: {
        legend: {
          position: 'top'
        },

        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `${context.dataset.label}: ${context.raw}%`;
            }
          }
        }
      },

      scales: {
        x: {
          stacked: true,
          max: 100,
          grid: {
            display: false
          },
          ticks: {
            callback: function (value: any) {
              return value + '%';
            }
          }
        },

        y: {
          stacked: true,
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            }
          },

          afterFit: (scale: any) => {
            scale.width = 280;
          }
        }
      },

      elements: {
        bar: {
          borderRadius: 0
        }
      }
    };
  }

  getChartData(mediaVisibility: MediaVisibility[]) {
    const lineDatasets: any[] = [];
    const pieDatasets: any = [{ data: [], percentages: [], mediaIds: [] }];
    const pieLabels: string[] = [];

    const totalTones = mediaVisibility.reduce((sum, v) => sum + v.doc_count, 0);

    mediaVisibility.forEach((media) => {
      pieLabels.push(media.key);

      const tmp = {
        label: media.key,
        data: media.category_id_per_day.buckets.map(b => b.doc_count),
        date: media.category_id_per_day.buckets.map(b => b.key_as_string),
        tension: 0.4,
      };

      pieDatasets[0].data.push(media.doc_count);
      pieDatasets[0].mediaIds.push(media.key);
      pieDatasets[0].percentages.push(((media.doc_count / totalTones) * 100).toFixed(0));

      lineDatasets.push(tmp);
    });

    const labels = mediaVisibility[0].category_id_per_day.buckets.map(b =>
      b.key_as_string.includes('T')
        ? moment(b.key_as_string).utc().format('HH:mm')
        : moment(b.key_as_string).format('DD MMM')
    );

    const visibilityBarDatasets = mediaVisibility.map(v => ({
      type: 'bar',
      label: v.key,
      data: v.category_id_per_day.buckets.map(b => b.doc_count),
      date: v.category_id_per_day.buckets.map(b => b.key_as_string),
    }));

    const documentStyle = getComputedStyle(document.documentElement);

    const positiveColor = documentStyle.getPropertyValue('--positive-color');
    const negativeColor = documentStyle.getPropertyValue('--negative-color');
    const neutralColor = '#9CA3AF';

    const positiveData: number[] = [];
    const neutralData: number[] = [];
    const negativeData: number[] = [];

    mediaVisibility.forEach(media => {

      const positive = media.sentiments.find(s => s.tone === 1)?.value ?? 0;
      const neutral = media.sentiments.find(s => s.tone === 0)?.value ?? 0;
      const negative = media.sentiments.find(s => s.tone === -1)?.value ?? 0;

      const total = positive + neutral + negative;

      positiveData.push(Number(((positive / total) * 100).toFixed(2)));
      neutralData.push(Number(((neutral / total) * 100).toFixed(2)));
      negativeData.push(Number(((negative / total) * 100).toFixed(2)));
    });

    console.log('Positive data:', positiveData);
    console.log('Neutral data:', neutralData);
    console.log('Negative data:', negativeData);

    const sentimentBarData = {
      labels: mediaVisibility.map(v => v.key),
      datasets: [
        {
          label: 'Positive',
          backgroundColor: positiveColor,
          data: positiveData,
          stack: 'sentiment'
        },
        {
          label: 'Neutral',
          backgroundColor: neutralColor,
          data: neutralData,
          stack: 'sentiment'
        },
        {
          label: 'Negative',
          backgroundColor: negativeColor,
          data: negativeData,
          stack: 'sentiment'
        }
      ]
    };

    return {
      lineLabels: labels,
      lineDatasets,
      pieLabels,
      pieDatasets,
      barLabels: labels,
      visibilityBarDatasets,
      visibilityBarComparisonData: {
        labels: mediaVisibility.map(v => v.key),
        datasets: [{
          label: 'Total Document Count',
          backgroundColor: '#42A5F5',
          data: mediaVisibility.map(v => v.doc_count),
        }],
      },
      sentimentBarData
    };
  }

  private getMaxValue(datasets: any[]): number {
    return Math.max(
      ...datasets.flatMap(ds => ds.data)
    );
  }

  get lineChartHeight(): string {
    const baseHeight = 300;
    const ratio = 0.5;      // 1400 → 700
    const maxHeight = 1000;

    const computed = Math.min(
      Math.max(this.maxLineValue * ratio, baseHeight),
      maxHeight
    );

    return `${computed}px`;
  }
}