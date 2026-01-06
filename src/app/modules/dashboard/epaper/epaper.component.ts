import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconNewspaperComponent } from '../../../core/components/icons/newspaper/newspaper.component';
import { DividerModule } from 'primeng/divider';
import { IconInfoComponent } from '../../../core/components/icons/info/info.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Epaper } from '../../../core/models/epaper.model';
import { EpaperService } from '../../../core/services/epaper.service';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { FilterService } from '../../../core/services/filter.service';
import { FilterRequestPayload } from '../../../core/models/request.model';

@Component({
  selector: 'app-epaper',
  standalone: true,
  imports: [
    IconNewspaperComponent,
    DividerModule,
    IconInfoComponent,
    ToastModule,
    PaginatorModule,
    SpinnerComponent,
    CommonModule,
    RouterModule,
    FormsModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    DatePipe
  ],
  providers: [MessageService],
  templateUrl: './epaper.component.html',
  styleUrl: './epaper.component.scss'
})
export class EpaperComponent implements OnInit {
  isLoading = false;
  epapers: Epaper[] = [];
  page = 0;
  first = 0;
  rows = 20;
  totalRecords = 0;
  currentPage = 1;
  filter: any;

  searchForm = {
    judul: ''
  };

  constructor(
    private epaperService: EpaperService,
    private messageService: MessageService,
    private filterService: FilterService
  ) { }

  ngOnInit(): void {
    this.filter = this.filterService.subscribe(() => {
      this.page = 0;
      this.first = 0;
      this.loadData();
    });
  }


  ngOnDestroy(): void {
    this.filter?.unsubscribe();
  }

  loadData(): void {
    this.isLoading = true;

    const keyword = (this.searchForm?.judul || '').trim();

    this.epaperService
      .getEpapers(
        this.page + 1,
        this.rows,
        'desc',
        'date',
        keyword,
        this.filterService.filter
      )
      .subscribe({
        next: (res) => this.handleResponse(res),
        error: (err) => this.handleError(err)
      });
  }

  handleResponse(res: any) {
    if (res.success) {
      this.epapers = res.data;
      this.totalRecords = res.meta.total_data;
      this.first = (res.meta.current_page - 1) * this.rows;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load data'
      });
    }
    this.isLoading = false;
  }

  handleError(error: any) {
    console.error('Error loading epapers:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load data. Please try again.'
    });
    this.isLoading = false;
  }

  openPdf(epaper: Epaper): void {
    if (!epaper.file_url) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Tidak tersedia',
        detail: 'File PDF tidak tersedia.'
      });
      return;
    }

    window.open(epaper.file_url, '_blank', 'noopener');
  }


  onPageChange(event: any): void {
    this.page = event.page;
    this.rows = event.rows;
    this.first = event.first;

    this.loadData();
  }

  onSearch(): void {
    this.page = 0;
    this.first = 0;
    this.loadData();
  }
}