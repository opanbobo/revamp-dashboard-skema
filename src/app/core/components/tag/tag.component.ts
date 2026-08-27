import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'tag',
  standalone: true,
  imports: [],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
})
export class TagComponent implements OnInit, OnChanges {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  @Input() content!: string;
  @Input() type!: 'positive' | 'negative' | 'neutral' | string | number;

  bgColor: string = 'white';
  color: string = 'black';

  ngOnInit() {
    this.setToneColors();
  }

  ngOnChanges() {
    this.setToneColors();
  }

  private setToneColors() {
    const documentStyle = getComputedStyle(document.documentElement);
    const positiveColor = documentStyle.getPropertyValue('--positive-color').trim() || '#1b81e2';
    const negativeColor = documentStyle.getPropertyValue('--negative-color').trim() || '#fb3b52';
    const normalizedType = `${this.type ?? ''}`.trim().toLowerCase();

    const colorMap: { [x: string]: string } = {
      'positive': positiveColor,
      '1': positiveColor,
      'neutral': 'gray',
      '0': 'gray',
      'negative': negativeColor,
      '-1': negativeColor,
    };

    const bgColorMap: { [x: string]: string } = {
      'positive': '#e8f2fc',
      '1': '#e8f2fc',
      'neutral': '#80808021',
      '0': '#80808021',
      'negative': '#ffebee',
      '-1': '#ffebee',
    };

    this.bgColor = bgColorMap[normalizedType] ?? '#80808021';
    this.color = colorMap[normalizedType] ?? 'gray';
  }
}
