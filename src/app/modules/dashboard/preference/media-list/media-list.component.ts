import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { TreeSelectModule } from 'primeng/treeselect';
import { forkJoin } from 'rxjs';
import { IconAlertComponent } from '../../../../core/components/icons/alert/alert.component';
import { IconPencilComponent } from '../../../../core/components/icons/pencil/pencil.component';
import { Media } from '../../../../core/models/media.model';
import { PreferenceService } from '../../../../core/services/preference.service';
import { TONE_MAP } from '../../../../shared/utils/Constants';

@Component({
  selector: 'app-media-list',
  standalone: true,
  imports: [
    IconPencilComponent,
    ButtonModule,
    TableModule,
    InputTextModule,
    TieredMenuModule,
    PaginatorModule,
    CommonModule,
    ConfirmPopupModule,
    DialogModule,
    ReactiveFormsModule,
    InputTextareaModule,
    MultiSelectModule,
    TabMenuModule,
    TabViewModule,
    ToastModule,
    IconAlertComponent,
    TreeSelectModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './media-list.component.html',
  styleUrl: './media-list.component.scss',
})
export class MediaListComponent {
  isLoading: boolean = false;
  showDeleteModal: boolean = false;
  showAddModal: boolean = false;
  showUpdateModal: boolean = false;

  page: number = 0;
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;

  medias: Media[] = [];
  selectedMedia!: Media;

  listMediaGroup: TreeNode[] = [];
  listSelected: TreeNode[] = [];

  form!: FormGroup;
  isTier: boolean = false;
  type: string = 'detail';

  constructor(
    private preferenceService: PreferenceService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.resetForm();
    this.fetchData();
  }

  getTitle(type: string): string {
    switch (type) {
      case 'detail':
        return 'Detail Media';
      case 'prioritas':
        return 'Media Prioritas';
      case 'pers':
        return 'Dewan Pers';
      default:
        return '';
    }
  }

  fetchData = () => {
    this.isLoading = true;
    this.showAddModal = this.showUpdateModal = this.showDeleteModal = false;
    this.listMediaGroup.length = this.listSelected.length = 0;

    this.preferenceService.getMedias().subscribe((res) => {
      this.isLoading = false;
      this.medias = res.results.map((result, i) => ({
        ...result,
        i: i + 1,
      }));
      this.totalRecords = res.count;
    });
  };

  onPageChange = (e: PaginatorState) => {
    if (e.page) this.page = e.page;
    if (e.rows) this.rows = e.rows;
    if (e.first) this.first = e.first;
  };

  deleteMedia = (media: Media) => {
    this.selectedMedia = media;
    this.showDeleteModal = true;
  };

  confirmDeleteMedia = () => {
    this.isLoading = true;

    this.preferenceService.deleteMedia(this.selectedMedia.user_media_type_id).subscribe(() => {
      this.fetchData();
      this.messageService.add({
        severity: 'success',
        summary: 'Delete success',
        detail: `${this.selectedMedia.user_media_type_name_def} has been deleted.`,
      });
    });
  };

  createMedia = () => {
    this.isLoading = true;

    this.preferenceService.createMedia(this.form.get('user_media_type_name_def')?.value).subscribe(() => {
      this.fetchData();
      this.messageService.add({
        severity: 'success',
        summary: 'Create success',
        detail: 'Media has been created.',
      });
    });
  };

  updateMedia = async () => {
    if (this.isLoading) return;

    this.isLoading = true;
    const selectedIds = this.listSelected.map((v) => (!v.children?.length ? v.data : null)).filter((v) => !!v);
    const media_list = [];
    for (const v of this.listMediaGroup[0].children!) {
      if (v.children) {
        for (const media of v.children) {
          media_list.push({
            media_id: media.data as string,
            chosen: selectedIds.includes(media.data),
          });
        }
      }
    }

    forkJoin([
      this.preferenceService.updateMedia(this.selectedMedia.user_media_type_id, this.selectedMedia.user_media_type_name_def),
      this.preferenceService.updateSelectedMediaGroups(this.selectedMedia.user_media_type_id, media_list),
    ]).subscribe({
      next: () => {
        this.fetchData();
        this.messageService.add({
          severity: 'success',
          summary: 'Update success',
          detail: 'Media has been updated.',
        });
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update media.',
        });
      },
    });
  };

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  getToneLabel(tone: number) {
    return TONE_MAP[tone] ?? '';
  }

  preSelectNode(node: TreeNode) {
    const { isAllChildSelected, isSomeChildSelected } = this.getNodeState(node);
    if (isAllChildSelected) {
      this.listSelected.push(node);
    } else if (isSomeChildSelected) {
      node.partialSelected = true;
    }
    node.expanded = node.data === 'all';
  }

  getNodeState(node: TreeNode) {
    let isAllChildSelected = false;
    let isSomeChildSelected = false;

    if (node.children && node.children.length) {
      isAllChildSelected = node.children.every((child) => this.listSelected.includes(child));
      isSomeChildSelected = node.children.some((child) => this.listSelected.includes(child));
    }

    return {
      isAllChildSelected,
      isSomeChildSelected,
    };
  }

  openEditModal(media: Media, type: string) {
    this.type = type;
    this.listSelected = [];
    this.selectedMedia = media;

    this.resetForm();
    this.form.patchValue(media);

    this.preferenceService.getMediaGroups(media.user_media_type_id).subscribe((res) => {
      const node: TreeNode = {
        label: 'Select All',
        data: 'all',
        children: res.data.map((v) => {
          const node: TreeNode = {
            label: v.media_type,
            data: v.media_type,
            children: v.media_list.map((v) => {
              const child = {
                label: v.media_name,
                data: v.media_id,
              };
              if (
                (type == 'prioritas' && v.tier === 1) || 
                (type == 'detail' && v.chosen) || 
                (type == 'pers' && v.is_dewan_pers) || 
                (type == 'international' && v.is_international) || 
                (type == 'national' && v.is_national) ||
                (type == 'language' && v.language === 'IND')
              ) {
                this.listSelected.push(child);
              }
              return child;
            }),
          };

          setTimeout(() => this.preSelectNode(node));
          return node;
        }),
      };

      this.listMediaGroup = [node];
      this.showUpdateModal = true;
      setTimeout(() => this.preSelectNode(node));
    });
  }

  resetForm() {
    this.form = this.fb.group({
      user_media_type_id: '',
      user_media_type_name_def: ['', Validators.required],
    });
  }

  onNodeSelect(event: any) {
    console.log('Node selected:', event.node);
    this.listSelected.push(event.node);
  }
  
  onNodeUnselect(event: any) {
    console.log('Node unselected:', event.node);
  }
}
