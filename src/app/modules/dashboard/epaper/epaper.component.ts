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
    FormsModule, // Keep for disabled form
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
  rows = 10;
  totalRecords = 0;
  currentPage = 1;

  // Add these back for the template (even though they're not functional)
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

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    const page = event.first / event.rows + 1;
    this.loadData(page);
  }

  // These methods are just placeholders for the UI (non-functional)
  onSearch() {
    // Empty method - search is disabled
  }

  onResetSearch() {
    // Empty method - search is disabled
  }
}