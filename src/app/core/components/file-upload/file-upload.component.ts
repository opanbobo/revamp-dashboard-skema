import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImgFallbackDirective } from '../../directive/img-fallback.directive';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'file-upload',
  standalone: true,
  imports: [ReactiveFormsModule, ImgFallbackDirective, CommonModule, ButtonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  @Input() form!: FormGroup;
  @Input() maxFileSizeBytes = 1024 * 1024;
  @Output() fileRejected = new EventEmitter<string>();

  uploadedImageURL: SafeUrl | null = null;
  uploadedImageURLs: SafeUrl[] = [];
  file: File | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  onDragOver(event: any): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: any): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    this.onFileSelected(files);
  }

  onFileSelected(files: FileList): void {
    const file = files?.[0];
    if (file) {
      this.addImage(file);
    }
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      this.addImage(file);
      (event.target as HTMLInputElement).value = '';
    }
  }

  private addImage(file: File) {
    if (file.size > this.maxFileSizeBytes) {
      this.fileRejected.emit('The selected file is too large. Maximum file size is 1 MB.');
      return;
    }

    const objectURL = URL.createObjectURL(file);
    const safeURL = this.sanitizer.bypassSecurityTrustUrl(objectURL);
    const currentImages = this.form.value.image || [];

    this.file = file;
    this.uploadedImageURL = safeURL;
    this.form.patchValue({ image: [...currentImages, file] });
    this.uploadedImageURLs.push(safeURL);
  }

  removeImage(index: number) {
    const currentImages = [...this.form.value.image];
    const currentURLs = [...this.uploadedImageURLs];
  
    currentImages.splice(index, 1);
    currentURLs.splice(index, 1);
  
    this.form.patchValue({ image: currentImages });
    this.uploadedImageURLs = currentURLs;
  }
}
