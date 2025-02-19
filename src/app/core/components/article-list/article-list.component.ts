import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ImgFallbackDirective } from '../../directive/img-fallback.directive';
import { Article } from '../../models/article.model';

@Component({
  selector: 'article-list',
  standalone: true,
  imports: [RouterModule, AvatarModule, CommonModule, ImgFallbackDirective, PaginatorModule, DividerModule],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss',
})
export class ArticleListComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  @Input() articles!: Article[];
  @Input() first!: number;
  @Input() rows!: number;
  @Input() totalRecords!: number;
  @Input() search?: boolean;
  @Input() page!: number;
  @Input() onPageChange!: (e: PaginatorState) => void;
}
