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
  first = 0;
  rows = 20;
  totalRecords = 0;
  currentPage = 1;

  searchForm = {
    judul: '',
    tahun: null as number | null,
    kategori: null as string | null
  };

  tahunOptions: any[] = [];
  kategoriOptions: any[] = [];

  constructor(
    private epaperService: EpaperService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.initializeDropdownOptions();
    this.loadData();
  }

  initializeDropdownOptions() {
    // Initialize empty options for the UI
    this.tahunOptions = [];
    this.kategoriOptions = [];
  }

  loadData(page = 1) {
    this.isLoading = true;
    this.currentPage = page;

    this.epaperService.getEpapers(page, this.rows).subscribe({
      next: (res) => this.handleResponse(res),
      error: (error) => this.handleError(error)
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
    this.first = event.first;
    this.rows = event.rows;

    const page = event.page + 1;
    const keyword = (this.searchForm.judul || '').trim();

    this.isLoading = true;

    this.epaperService
      .getEpapers(
        page,
        this.rows,
        'desc',
        'date',
        keyword
      )
      .subscribe({
        next: (res) => this.handleResponse(res),
        error: (error) => this.handleError(error)
      });
  }


  onSearch(): void {
    this.first = 0;
    this.currentPage = 1;

    const keyword = (this.searchForm.judul || '').trim();

    this.isLoading = true;

    this.epaperService
      .getEpapers(
        1,
        this.rows,
        'desc',
        'date',
        keyword
      )
      .subscribe({
        next: (res) => this.handleResponse(res),
        error: (error) => this.handleError(error)
      });
  }

  onResetSearch() {

  }
}