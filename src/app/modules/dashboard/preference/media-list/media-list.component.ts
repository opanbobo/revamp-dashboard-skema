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

    // Extract selected media IDs from listSelected array
    const selectedIds = this.listSelected
      .filter(node => !node.children) // Only leaf nodes
      .map(node => node.data as string);

    const media_list = [];
    for (const v of this.listMediaGroup[0].children!) {
      if (v.children) {
        for (const media of v.children) {
          media_list.push({
            media_id: media.data as string,
            chosen: selectedIds.includes(media.data as string),
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

  openEditModal(media: Media, type: string) {
    this.isLoading = true;
    this.type = type;
    this.selectedMedia = media;

    this.resetForm();
    this.form.patchValue(media);

    this.preferenceService.getMediaGroups(media.user_media_type_id).subscribe({
      next: (res) => {
        if (!res.data || res.data.length === 0) {
          this.showUpdateModal = true;
          this.isLoading = false;
          return;
        }

        const nodeMap = new Map<number | string, TreeNode>();
        const preSelectedIds: (number | string)[] = [];

        const childNodes = res.data.map((v) => {
          const label = v.media_type;

          const mediaNodes = v.media_list.map((mediaItem) => {
            const child: TreeNode = {
              label: mediaItem.media_name,
              data: mediaItem.media_id,
              key: `media-${mediaItem.media_id}`,
            };

            nodeMap.set(mediaItem.media_id, child);

            const shouldSelect =
              (type === 'prioritas' && mediaItem.tier === 1) ||
              (type === 'detail' && mediaItem.chosen) ||
              (type === 'pers' && mediaItem.is_dewan_pers) ||
              (type === 'international' && mediaItem.is_international) ||
              (type === 'national' && mediaItem.is_national) ||
              (type === 'language' && mediaItem.language === 'IND') ||
              (type === 'online-ind' && mediaItem.language === 'IND' && label === 'Berita Online');

            if (shouldSelect) {
              preSelectedIds.push(mediaItem.media_id);
            }

            return child;
          });

          return {
            key: `type-${v.media_type}`,
            label: v.media_type,
            data: v.media_type,
            children: mediaNodes,
          };
        });

        this.listMediaGroup = [{
          key: 'root-all',
          label: 'Select All',
          data: 'all',
          children: childNodes,
        }];

        // Efficient selection building using map lookup
        this.listSelected = preSelectedIds
          .map(id => nodeMap.get(id))
          .filter((node): node is TreeNode => node !== undefined);

        this.showUpdateModal = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('API Error:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load media groups.',
        });
      }
    });
  }

  resetForm() {
    this.form = this.fb.group({
      user_media_type_id: '',
      user_media_type_name_def: ['', Validators.required],
    });
  }
}
