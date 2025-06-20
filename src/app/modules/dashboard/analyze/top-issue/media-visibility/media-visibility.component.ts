import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import moment from 'moment';
import { ChartModule } from 'primeng/chart';
import { Observable } from 'rxjs';
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
  imports: [ChartCardComponent, ChartModule, SpinnerComponent, CommonModule, TabViewModule, TabMenuModule],
  templateUrl: './media-visibility.component.html',
  styleUrl: './media-visibility.component.scss',
})
export class MediaVisibilityComponent {
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

  analyzeState: Observable<AnalyzeState>;
  isLoading: boolean = false;
  isDrilldownVisibilityChart: boolean = false;

  tabItems = [
    { label: 'Pie Chart', key: 'pie' },
    { label: 'Bar Comparison', key: 'bar' }
  ];

  activeTab = this.tabItems[0]; 

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

  ngOnInit() {
    this.initChartOpts();
    this.filterService.subscribe((v) => {
      this.filter = v;
      this.getData();
    });
  }

  getData() {
    this.isLoading = true;
    this.isDrilldownVisibilityChart = false;
    this.analyzeService.getMediaVisibility(this.filter).subscribe((res) => {
      this.isLoading = false;
      this.initChartData(res.data);
    });
  }

  initChartData = (mediaVisibility: MediaVisibility[]) => {
    if (mediaVisibility.length) {
      const { lineDatasets, lineLabels, pieLabels, pieDatasets, visibilityBarDatasets, barLabels, visibilityBarComparisonData } = this.getChartData(mediaVisibility);

      this.visibilityPieData = { labels: pieLabels, datasets: pieDatasets };
      this.visibilityChartLineData = {
        labels: lineLabels,
        datasets: lineDatasets,
      };
      this.visibilityChartBarData = {
        labels: barLabels,
        datasets: visibilityBarDatasets,
      };

      this.visibilityBarComparisonData = visibilityBarComparisonData;
    }
  };

  onVisibilityPieSelect = (value: any, type: string) => {
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
    } else {
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
  };

  onVisibilityChartDayClick = (date: string, mediaName: string) => {
    if (this.isDrilldownVisibilityChart) {
      this.router.navigate(['/dashboard/articles-by-media'], {
        queryParams: { mediaName, date },
      });
      return;
    }

    this.isLoading = true;
    this.analyzeService
      .getMediaVisibility({
        ...this.filterService.filter,
        start_date: moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end_date: moment(date).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      })
      .subscribe((res) => {
        this.isDrilldownVisibilityChart = true;

        const { lineDatasets, lineLabels, visibilityBarDatasets } = this.getChartData(res.data);
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
  };

  initChartOpts = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const isDarkModeStorage = window.localStorage.getItem('useDarkMode');
    const isDarkMode = isDarkModeStorage ? JSON.parse(isDarkModeStorage) : false;

    this.visibilityPieOpts = {
      plugins: {
        legend: {
          display: false,
        },
        htmlLegend: {
          containerID: 'legend-container',
          flexDirection: 'row',
        },
      },
    };

    this.visibilityChartBarOpts = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        barOpacityPlugin: {
          opacity: 1,
        },
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
        x: {
          stacked: true,
          ticks: {
            color: documentStyle.getPropertyValue('--text-color-secondary'),
          },
          grid: {
            color: documentStyle.getPropertyValue('--surface-border'),
            drawBorder: false,
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: documentStyle.getPropertyValue('--text-color-secondary'),
          },
          grid: {
            color: documentStyle.getPropertyValue('--surface-border'),
            drawBorder: false,
          },
        },
      },
    };

    this.visibilityChartLineOpts = {
      maintainAspectRatio: false,
      aspectRatio: 0.93,
      plugins: {
        legend: {
          position: 'bottom',
          align: 'center',
          labels: {
            font: { size: 10 },
            color: isDarkMode ? 'white' : documentStyle.getPropertyValue('--text-color'),
            boxWidth: 10,
            boxHeight: 5,
            filter: function (legendItem: any, chartData: any) {
              const datasetIndex = legendItem.datasetIndex;
              const dataset = chartData.datasets[datasetIndex];
              const color = dataset.borderColor; // Get the border color of the dataset
              legendItem.fillStyle = color; // Set legend item background color
              return true;
            },
          },
        },
      },
      elements: {
        point: { radius: 0, hitRadius: 20 },
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false },
        },
        y: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false },
        },
      },
    };

    this.visibilityBarComparisonOpts = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        barOpacityPlugin: {
          opacity: 1,
        },
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
        x: {
          beginAtZero: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };
  };

  getChartData = (mediaVisibility: MediaVisibility[]) => {
    const lineDatasets: any[] = [];
    const pieDatasets: any = [{ data: [], percentages: [], mediaIds: [] }];
    const pieLabels: string[] = [];
    const totalTones = mediaVisibility.reduce((prev, chart) => {
      return prev + chart.doc_count;
    }, 0);

    mediaVisibility.forEach((media) => {
      pieLabels.push(media.key);
      const tmpData: {
        label: string;
        data: number[];
        tension: number;
        date: string[];
      } = {
        label: media.key,
        data: [],
        date: [],
        tension: 0.4,
      };
      media.category_id_per_day.buckets.forEach((bucket) => {
        tmpData.data.push(bucket.doc_count);
      });
      media.category_id_per_day.buckets.forEach((bucket) => {
        tmpData.date.push(bucket.key_as_string);
      });
      pieDatasets[0].percentages.push(((media.doc_count / totalTones) * 100).toFixed(0));
      pieDatasets[0].data.push(media.doc_count);
      pieDatasets[0].mediaIds.push(media.key);

      lineDatasets.push(tmpData);
    });

    const visibilityBarDatasets = mediaVisibility.map((visibility) => {
      const data = visibility.category_id_per_day.buckets.map((val) => val.doc_count);
      const date = visibility.category_id_per_day.buckets.map((val) => val.key_as_string);
      return {
        type: 'bar',
        data,
        date,
        label: visibility.key,
      };
    });

    const lineLabels = mediaVisibility[0].category_id_per_day.buckets.map((bucket) => {
      return bucket.key_as_string.includes('T')
        ? moment(bucket.key_as_string).utc().format('HH:mm')
        : moment(bucket.key_as_string).format('DD MMM');
    });

    const visibilityBarComparisonLabels = mediaVisibility.map(media => media.key);
    const visibilityBarComparisonData = {
      labels: visibilityBarComparisonLabels,
      datasets: [
        {
          label: 'Total Document Count',
          backgroundColor: '#42A5F5',
          data: mediaVisibility.map(media => media.doc_count),
        },
      ],
    };

    return {
      lineLabels,
      lineDatasets,
      pieLabels,
      pieDatasets,
      barLabels: lineLabels,
      visibilityBarDatasets,
      visibilityBarComparisonData
    };
  };
}
