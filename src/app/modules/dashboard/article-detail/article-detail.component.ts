import { Component } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { ImgFallbackDirective } from '../../../core/directive/img-fallback.directive';
import { TagComponent } from '../../../core/components/tag/tag.component';
import { Article } from '../../../core/models/article.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TONE_MAP } from '../../../shared/utils/Constants';
import { FormatAmountPipe } from '../../../core/pipes/format-amount.pipe';
import { ArticleService } from '../../../core/services/article.service';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { CommonModule, Location } from '@angular/common';
import { forkJoin, switchMap } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FilterService } from '../../../core/services/filter.service';
import { ButtonModule } from 'primeng/button';
import { TreeSelect, TreeSelectModule } from 'primeng/treeselect';
import { DialogModule } from 'primeng/dialog';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { PreferenceService } from '../../../core/services/preference.service';
import { RadioButtonModule } from 'primeng/radiobutton';
import moment from 'moment';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

const highlightKeywords = (content: string, keywords: string[]): string => {
  const cleanedKeywords = keywords.map((keyword) => keyword.replace(/"/g, ''));
  const regex = new RegExp(cleanedKeywords.join('|'), 'gi');
  return content.replace(regex, (match) => `<mark>${match}</mark>`);
};

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    DividerModule,
    ImgFallbackDirective,
    TagComponent,
    FormatAmountPipe,
    SpinnerComponent,
    CommonModule,
    ButtonModule,
    TreeSelectModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    RadioButtonModule,
    ToastModule,
  ],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
  providers: [MessageService],
})
export class ArticleDetailComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  article: (Article & { toneLabel: string }) | undefined;
  isLoading: boolean = false;
  sanitizedContent: SafeHtml | null = null;
  modalUpdateOpen: boolean = false;
  value1: boolean = false;
  subCategoryOptions: any;
  selectedSubCategories: any;
  ingredient: any;

  updateCategory() {
    const selectedIds = this.selectedSubCategories.reduce((subCategories: any, subCategory: any) => {
      if (subCategory.isSelectAll || subCategory.isParent) return subCategories;
      return [...subCategories, subCategory.data];
    }, []);
    const articleId = this.activatedRoute.snapshot.paramMap.get('id');
    const payload = {
      article_id: articleId,
      category_ids: selectedIds,
      datee: this.article?.datee ? this.article?.datee.split(' ')[0] : moment(new Date()).format('YYYY-MM-DD'),
      media_id: this.article?.media_id,
      tone: this.article?.tone ?? 0,
      advalue_fc: this.article?.advalue_fc,
      circulation: this.article?.circulation,
      advalue_bw: this.article?.advalue_bw,
    };
    this.articleService
      // @ts-ignore
      .updateArticleSave(payload)
      .subscribe(() => {
        this.modalUpdateOpen = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Update success',
        });
        this.fetchData();
      });
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private sanitizer: DomSanitizer,
    private location: Location,
    private filterService: FilterService,
    private messageService: MessageService,
    private route: ActivatedRoute, 
    private router: Router
  ) { }

  extractDateFromUrl = (url: string) => {
    // Get the part of the URL after the last '/'
    const isUrl = url.startsWith('http');
    if (!isUrl) return url;

    const lastPart = url.substring(url.lastIndexOf('/') + 1);

    // Use a regular expression to match the date at the beginning of the string
    const dateRegex = /^(\d{4}-\d{2}-\d{2})/;
    const match = lastPart.match(dateRegex);

    if (match) {
      return match[1]; // Return the captured date
    } else {
      console.error('Date not found in the last part of the URL');
      return null;
    }
  };

  openEditModal = async () => {
    this.ingredient = this.article?.tone ?? 0;
    // this.selectedCategory = category;
    const response = await this.articleService.getSubCategoriesDistinct().toPromise();

    const actualData =
      response?.results.map((subCateg) => {
        return {
          key: subCateg.category_id,
          data: subCateg.category_id,
          label: subCateg.category_id,
          isSelectAll: false,
        };
      }) ?? [];

    this.subCategoryOptions = [
      {
        label: 'Select all',
        data: 'all',
        children: actualData,
        isSelectAll: true,
      },
    ];

    // this.editedValues.setValue({
    //   category: category.descriptionz ?? '',
    // });
    this.modalUpdateOpen = true;
  };

  fetchData = () => {
    this.activatedRoute.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.isLoading = true;
          return forkJoin({
            articleResp: this.articleService.getArticleById(id!),
          });
        })
      )
      .subscribe(({ articleResp }) => {
        this.isLoading = false;
        const articleData = articleResp.data;
        this.filter = this.filterService.subscribe((filter) => {
          const hightligtedWords = highlightKeywords(articleData.content, articleData?.keywords ?? []);
          this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(hightligtedWords);
        });
        let file = articleData?.file_pdf;
        if (articleData?.media_type === 'media cetak') {
          const parsed = this.extractDateFromUrl(file)?.split('-');
          const fileName = file.substring(file.lastIndexOf('/') + 1);
          if (parsed) {
            file = `https://api.skema.co.id/media/pdf_images/${parsed[0]}/${parsed[1]}/${parsed[2]}/${fileName}`;
          }
        } else if (articleData?.media_type === 'media tv') {
          const parsed = this.extractDateFromUrl(file)?.split('-');
          const fileName = file.substring(file.lastIndexOf('/') + 1);
          if (parsed) {
            file = `https://api.skema.co.id/media/media_tv/${parsed[0]}/${parsed[1]}/${parsed[2]}/${fileName}`;
          }
        }
        this.article = {
          ...articleData,
          file_pdf: file,
          toneLabel: TONE_MAP[articleData?.tone ?? 0] ?? '',
        };
      });
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log(`first: ${params['first']} page: ${params['page']}`);
    });
    this.fetchData();
  }

  goBack = () => {
    // this.location.back();
    this.route.queryParams.subscribe(params => {
      this.router.navigate(['/dashboard/articles'], { queryParams: { first: params['first'], page: params['page'] } });
    });
  };
}
