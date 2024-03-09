import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { IconGlobeComponent } from '../../../../core/components/icons/globe/globe.component';
import { IconInfoComponent } from '../../../../core/components/icons/info/info.component';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { MediaChartComponent } from '../../components/media-chart/media-chart.component';

@Component({
  selector: 'app-top-media',
  standalone: true,
  imports: [
    ChartModule,
    CardModule,
    ButtonModule,
    IconGlobeComponent,
    IconInfoComponent,
    MediaChartComponent
  ],
  templateUrl: './top-media.component.html',
  styleUrl: './top-media.component.scss',
})
export class TopMediaComponent implements OnInit {
  data: any;
  options: any;
  plugins = [ChartDataLabels];

  ngOnInit() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    this.data = {
      datasets: [
        {
          data: [50, 20, 10],
          datalabels: {
            anchor: 'end',
          },
          backgroundColor: ['#fb3b52', '#05B9BF', '#1B81E2'],
        },
      ],
    };

    this.options = {
      cutout: '75%',
      plugins: {
        tooltip: { enabled: false },
        datalabels: {
          font: { size: '14px', color: textColor },
          borderColor: '#E0E0E0',
          borderRadius: 100,
          borderWidth: 1,
          color: textColor,
          backgroundColor: 'white',
          formatter: (value: number) => value + '%',
          padding: 8,
        },
      },
      layout: {
        padding: {
          top: 0,
          bottom: 0,
          left: 24,
          right: 24,
        },
      },
    };
  }
}
