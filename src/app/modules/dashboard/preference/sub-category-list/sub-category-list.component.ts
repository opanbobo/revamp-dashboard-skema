import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import moment from 'moment';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { forkJoin } from 'rxjs';
import { IconAlertComponent } from '../../../../core/components/icons/alert/alert.component';
import { IconPencilComponent } from '../../../../core/components/icons/pencil/pencil.component';
import { Category } from '../../../../core/models/category.model';
import { PreferenceService } from '../../../../core/services/preference.service';
import { TONE_MAP } from '../../../../shared/utils/Constants';

@Component({
  selector: 'app-sub-category-list',
  standalone: true,
  imports: [
    IconPencilComponent,
    ButtonModule,
    TableModule,
    InputTextModule,
    TieredMenuModule,
    PaginatorModule,
    CommonModule,
    DialogModule,
    ReactiveFormsModule,
    InputTextareaModule,
    MultiSelectModule,
    TabMenuModule,
    TabViewModule,
    ToastModule,
    CalendarModule,
    IconAlertComponent,
  ],
  providers: [MessageService],
  templateUrl: './sub-category-list.component.html',
  styleUrl: './sub-category-list.component.scss',
})
export class SubCategoryListComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  categories: Category[] = [];
  totalRecords!: number;
  loading: boolean = false;
  page: number = 0;
  first: number = 0;
  rows: number = 10;

  modalAddOpen: boolean = false;
  createValues = new FormGroup({
    category: new FormControl('', [Validators.required]),
  });
  isCreating: boolean = false;

  selectedCategory: Category | null = null;

  modalUpdateOpen: boolean = false;
  selectedSubCategories: any[] = [];
  subCategoryOptions: any[] = [];
  editedValues = new FormGroup({
    category: new FormControl('', [Validators.required]),
    keyword: new FormControl(''),
    startDate: new FormControl(''),
    expired: new FormControl(''),
  });
  existingKeywords: string[] = [];

  isDeleting: boolean = false;
  modalDeleteOpen: boolean = false;

  modalRestreamOpen: boolean = false;
  restreamValues = new FormGroup({
    category: new FormControl('', [Validators.required]),
    startDate: new FormControl('', [Validators.required]),
    endDate: new FormControl('', [Validators.required]),
  });

  constructor(
    private preferenceService: PreferenceService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData = (categoryId?: any) => {
    this.loading = true;
    this.preferenceService.getSubCategoriesCollections().subscribe((resp) => {
      this.loading = false;
      this.categories = resp.results.map((val, idx) => ({
        ...val,
        no: idx + 1,
      }));
      if (categoryId) {
        const categSel =
          resp.results.find((categ) => {
            return categ.category_id === categoryId;
          }) ?? null;
        this.selectedCategory = categSel;
      }
      this.totalRecords = resp.count;
    });
  };

  onPageChange = (event: any) => {
    this.page = event.page;
    this.rows = event.rows;
    this.first = event.first;
  };

  deleteSubCategory = (category: Category) => {
    this.selectedCategory = category;
    this.modalDeleteOpen = true;
  };

  confirmDeleteSubCategory = () => {
    const { category_id } = this.selectedCategory!;
    this.isDeleting = true;
    this.preferenceService
      .deleteSubCategory(category_id)
      .subscribe(() => {
        this.fetchData();
        this.messageService.add({
          severity: 'success',
          summary: 'Delete success',
          detail: `${category_id} has been deleted.`,
        });
      })
      .add(() => {
        this.isDeleting = false;
        this.selectedCategory = null;
        this.modalDeleteOpen = false;
      });
  };

  createSubCategory = () => {
    const { category } = this.createValues.controls;
    this.isCreating = true;
    this.preferenceService
      .createSubCategory(category.value!)
      .subscribe(() => {
        this.modalAddOpen = false;
        this.createValues.controls.category.setValue('');
        this.fetchData();
        this.messageService.add({
          severity: 'success',
          summary: 'Create success',
          detail: 'SubCategory has been created.',
        });
      })
      .add(() => {
        this.isCreating = false;
      });
  };

  deleteKeyword = (keyword: string) => {
    this.preferenceService.deleteCategoryKeyword(this.selectedCategory?.category_id!, keyword).subscribe({
      next: () => {
        this.preferenceService.getCategoryKeywords(this.selectedCategory?.category_id!).subscribe((response) => {
          this.existingKeywords = response?.data ?? [];
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Keyword has been successfully deleted.',
          });
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete keyword.',
        });
      },
    });
  };

  updateCategory = async () => {
    const { category, expired, startDate, keyword } = this.editedValues.value;
    if (!expired || !startDate || !expired) {
      return this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Keyword or Dates is required',
      });
    }

    const apis = [this.preferenceService.updateSubCategory(this.selectedCategory?.category_id!, category!)];

    if (keyword && startDate && expired) {
      apis.push(
        this.preferenceService.createCategoryKeyword({
          category_id: category!,
          keyword: keyword,
          start_date: moment(startDate).format('YYYY-MM-DD'),
          end_date: moment(expired).format('YYYY-MM-DD'),
        })
      );
    }

    forkJoin(apis).subscribe({
      next: () => {
        this.fetchData(category!);
        this.modalUpdateOpen = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Data has been updated.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update data.',
        });
      },
    });
  };

  checkRestream = () => {
    this.preferenceService.checkRestream().subscribe(({ message, status }) => {
      this.messageService.add({
        severity: status ? 'success' : 'error',
        detail: message,
      });
    });
  };

  submitRestream = () => {
    const { category, endDate, startDate } = this.restreamValues.controls;

    const start = moment(startDate.value).format('YYYY-MM-DD');
    const end = moment(endDate.value).format('YYYY-MM-DD');

    this.preferenceService.restream([category.value!], start, end).subscribe(() => {
      this.modalRestreamOpen = false;
      this.messageService.add({
        severity: 'success',
        detail: 'Restream success.',
      });
    });
  };

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  getToneLabel(tone: number) {
    return TONE_MAP[tone] ?? '';
  }

  fetchKeyword = (category: any) => {
    this.preferenceService.getCategoryKeywords(category).subscribe((response) => {
      const prevStartDate = this.editedValues.value.startDate;
      const prevExpired = this.editedValues.value.expired;

      this.editedValues.setValue({
        category: category ?? '',
        keyword: '',
        startDate: prevStartDate || '',
        expired: prevExpired || '',
      });
      this.existingKeywords = response?.data ?? [];
      this.modalUpdateOpen = true;
    });
  };

  openEditModal = async (category: Category) => {
    this.selectedCategory = category;
    this.fetchKeyword(category.category_id);
  };

  closeEditModal() {
    this.modalUpdateOpen = false;
  }
}
