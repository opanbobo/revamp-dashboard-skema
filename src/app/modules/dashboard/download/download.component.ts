import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

import { IconNewspaperComponent } from '../../../core/components/icons/newspaper/newspaper.component';
import { IconInfoComponent } from '../../../core/components/icons/info/info.component';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';

import { DownloadService } from '../../../core/services/download.service';
import { FilterService } from '../../../core/services/filter.service';
import { Download } from '../../../core/models/download.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconNewspaperComponent,
    IconInfoComponent,
    ToastModule,
    DividerModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    TableModule,
    PaginatorModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    CalendarModule,
    DatePipe,
    DialogModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnInit, OnDestroy {
  isLoading = false;
  downloads: Download[] = [];
  page = 0;
  first = 0;
  rows = 10;
  totalRecords = 0;
  filter: any;

  // Search form
  searchForm = {
    name: ''
  };

  // Status filter
  selectedStatus: string | null = null;

  // Status options for filter
  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Failed', value: 'FAILED' }
  ];

  // Date range
  startDate: Date | null = null;
  endDate: Date | null = null;

  retryDialogOpen = false;
  deleteDialogOpen = false;

  selectedDownload: Download | null = null;

  isRetrying = false;
  isDeleting = false;

  constructor(
    private downloadService: DownloadService,
    private messageService: MessageService,
    private filterService: FilterService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    // this.filter = this.filterService.subscribe(() => {
    //   console.log('On init, reloading downloads');
    //   this.page = 0;
    //   this.first = 0;
    //   this.loadData();
    // });
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.filter) {
      this.filter.unsubscribe();
    }
  }

  loadData(): void {
    console.log('load data called');
    this.isLoading = true;

    const keyword = (this.searchForm?.name || '').trim();

    const now = new Date();

    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);

    const formattedStartDate = this.formatDate(start, '00:00:00');
    const formattedEndDate = this.formatDate(now, '23:59:59');

    this.downloadService.getDownloads({
      term: keyword,
      ...(this.selectedStatus && { status: this.selectedStatus }),
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      page: this.page + 1,
      limit: this.rows
    }).subscribe({
      next: (res) => this.handleResponse(res),
      error: (err) => this.handleError(err)
    });
  }


  handleResponse(res: any): void {
    console.log('Download data response:', res);
    if (res.code === 200) {
      this.downloads = res.data;
      this.totalRecords = res.meta.total_records;
      this.first = (res.meta.page - 1) * this.rows;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: res.status || 'Failed to load downloads'
      });
    }
    this.isLoading = false;
  }

  handleError(error: any): void {
    console.error('Error loading downloads:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load data. Please try again.'
    });
    this.isLoading = false;
  }

  openRetryDialog(download: Download): void {
    this.selectedDownload = download;
    this.retryDialogOpen = true;
  }

  closeRetryDialog(): void {
    this.retryDialogOpen = false;
    this.selectedDownload = null;
  }

  confirmRetryDownload(): void {
    if (!this.selectedDownload) return;

    this.isRetrying = true;

    this.downloadService.retryDownload(this.selectedDownload.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Job has been queued for retry.'
        });
        this.closeRetryDialog();
        this.loadData();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Retry failed.'
        });
        this.closeRetryDialog()
      },
      complete: () => (this.isRetrying = false)
    });
  }

  openDeleteDialog(download: Download): void {
    this.selectedDownload = download;
    this.deleteDialogOpen = true;
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen = false;
    this.selectedDownload = null;
  }

  confirmDeleteDownload(): void {
    if (!this.selectedDownload) return;

    this.isDeleting = true;

    this.downloadService.deleteDownload(this.selectedDownload.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Delete data success'
        });
        this.closeDeleteDialog();
        this.loadData();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Delete failed.'
        });
        this.closeDeleteDialog()
      },
      complete: () => (this.isDeleting = false)
    });
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

  onFilterChange(): void {
    this.page = 0;
    this.first = 0;
    this.loadData();
  }

  clearFilters(): void {
    this.searchForm.name = '';
    this.selectedStatus = null;
    this.startDate = null;
    this.endDate = null;
    this.onFilterChange();
  }

  formatDate(date: Date, time: string): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${time}`;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'PROCESSING': return 'info';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'danger';
      default: return 'secondary';
    }
  }

  downloadFile(download: any): void {
    if (!download.file_url) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Not Ready',
        detail: 'File is not available yet.',
      });
      return;
    }
    window.open(download.file_url, '_blank')?.focus();
  }


  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}