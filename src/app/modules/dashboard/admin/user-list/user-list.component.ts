import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IconPencilComponent } from '../../../../core/components/icons/pencil/pencil.component';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FilterRequestPayload } from '../../../../core/models/request.model';
import { AdminService } from '../../../../core/services/admin.service';
import { UserLevel, Users } from '../../../../core/models/all-user.model';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Company } from '../../../../core/models/company.model';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    IconPencilComponent,
    ButtonModule,
    PaginatorModule,
    CommonModule,
    TableModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    MultiSelectModule,
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
    ConfirmPopupModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
  filter: any;

  isLoading: boolean = false;
  isAdding: boolean = false;
  showDeleteModal: boolean = false;
  showAddModal: boolean = false;
  showUpdateModal: boolean = false;

  page: number = 0;
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;

  users: Users[] = [];
  companies: Company[] = [];
  accessMenus: string[] = [];
  userLevels: UserLevel[] = [];

  addValues = this.fb.group({
    company: [null as number | null],
    email: [''],
    full_name: [''],
    username: [''],
    level_menu: [null as number | null],
    password: [''],
    menu: [[] as string[]],
  });

  showPassword: boolean = false;
  tempId: number = 0;

  searchForm = this.fb.group({
    query: ''
  });

  customLevelId: number | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }

  ngOnInit() {
    this.fetchData({ page: this.page, size: this.rows }, this.searchForm.get('query')?.value ?? '');
    this.fetchCompanyList();
    this.fetchUserLevels();
    this.fetchUserAcceeMenu();

    this.searchForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe((v) => {
      console.log(`search ${v.query}`)
      this.refreshPage(v.query ?? '');
    });
  }

  fetchData = (filter?: Partial<FilterRequestPayload>, search = '') => {
    this.isLoading = true;
    this.adminService.fetchUserList({ ...filter }, search).subscribe((res) => {
      this.users = res.data;
      this.totalRecords = res.total_user;
      this.isLoading = false;
    });
  }

  fetchCompanyList = () => {
    this.adminService.fetchCompanyList({ page: 0, size: 1000 }).subscribe((res) => {
      this.companies = res.data;
    });
  }

  fetchUserAcceeMenu = () => {
    this.adminService.fetchUserAccessMenu().subscribe((res) => {
      this.accessMenus = res;
    });
  }

  fetchUserLevels = () => {
  this.adminService.fetchUserLevels().subscribe((res) => {
    this.userLevels = res;

    const customLevel = this.userLevels.find(
      (lvl: any) => lvl.level_name === 'Custom'
    );

    this.customLevelId = customLevel?.id ?? null;

    console.log('Custom Level ID:', this.customLevelId);
  });
};

  onPageChange = (e: PaginatorState) => {
    console.log(e.page, e.rows, e.first);
    if (e.page !== undefined && e.page !== null) this.page = e.page;
    if (e.rows !== undefined && e.rows !== null) this.rows = e.rows;
    if (e.first !== undefined && e.first !== null) this.first = e.first;
    this.fetchData({ page: this.page, size: this.rows }, this.searchForm.get('query')?.value ?? '');
  };

  openAddModal = () => {
    this.isAdding = true;
    this.addValues.reset();
    this.showAddModal = true;
  }

  saveUser = () => {
    const payload = this.addValues.value as unknown as {
      company: number;
      email: string;
      full_name: string;
      username: string;
      level_menu: number;
      password: string;
      menu: string[];
    };

    this.adminService.saveUser(payload)
      .subscribe((res) => {
        this.addValues.reset();
        this.showAddModal = false;
      })
      .add(() => {
        this.refreshPage();
      });
  }

  updateUser = () => {
    const payload = {
      ...this.addValues.value,
      id: this.tempId,
    } as {
      id: number;
      company: number;
      email: string;
      full_name: string;
      username: string;
      level_menu: number;
      password: string;
      menu: string[];
    };

    this.adminService.updateUser(payload)
      .subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated successfully!',
          });
          this.addValues.reset();
          this.showAddModal = false;
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update the user.',
          });
          console.error(err);
        },
      }).add(() => {
        this.refreshPage();
      });

  }

  openEditModal = (user: Users) => {
    this.isAdding = false;
    this.tempId = user.id;
    this.adminService.detailUserOrCompany(user.id, 'user').subscribe((res) => {
      this.addValues.patchValue({
        company: res.company_id,
        email: res.email,
        full_name: res.full_name,
        username: res.username,
        level_menu: res.level,
        password: '',
        menu: res.list_menu ?? [],
      });
    });

    this.showAddModal = true;
  }

  deleteUser = (event: Event, user: Users) => {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure to delete user ${user.name} ?`,
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      accept: () => { this.confirmDeleteUser(user) },
    });
  }

  confirmDeleteUser = (user: Users) => {
    this.adminService.deleteUser(user).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User deleted successfully!',
        });
        console.log(res);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete the user.',
        });
        console.error(err);
      },
    }).add(() => {
      this.refreshPage();
    });
  };


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  refreshPage = (search = '') => {
    this.page = 0;
    this.first = 0;
    this.rows = 10;
    this.fetchData({ page: this.page, size: this.rows }, search);
  }

}
