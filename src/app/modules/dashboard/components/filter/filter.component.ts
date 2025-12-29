import { Component } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../core/store';
import { FormsModule } from '@angular/forms';
import { FilterState, initialState } from '../../../../core/store/filter/filter.reducer';
import { Observable } from 'rxjs';
import { selectFilterState } from '../../../../core/store/filter/filter.selectors';
import { setFilter } from '../../../../core/store/filter/filter.actions';
import moment from 'moment';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { PreferenceService } from '../../../../core/services/preference.service';
import { DividerModule } from 'primeng/divider';

interface Option {
  name: string;
  value?: string | number | null;
}

const DEFAULT_CATEGORY: Option = {
  name: 'All Category',
  value: initialState.category_set,
};
const DEFAULT_SUB_CATEGORY: Option = {
  name: 'All Sub Category',
  value: initialState.category_id,
};
const DEFAULT_MEDIA: Option = {
  name: 'All Media',
  value: initialState.user_media_type_id,
};

const DEFAULT_TIER: Option = {
  name: 'All Tiers',
  value: initialState.media_tier,
};

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [DropdownModule, ButtonModule, FloatLabelModule, FormsModule, CommonModule, CalendarModule, DividerModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
})
export class FilterComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
  isCustom: boolean = false;
  selectedPeriodic: string = initialState.date_type;
  selectedCategory: number = initialState.category_set;
  selectedSubCategory: string = initialState.category_id;
  selectedMedia: number = initialState.user_media_type_id;
  startDate: Date = moment(initialState.start_date).toDate();
  startTime: Date = moment(`${initialState.start_date} ${initialState.start_time}`).toDate();
  endDate: Date = moment(initialState.end_date).toDate();
  endTime: Date = moment(`${initialState.end_date} ${initialState.end_time}`).toDate();
  selectedTier?: number | null | string = initialState.media_tier;

  periodicOptions: Option[] = [
    { name: 'Yesterday', value: 'yesterday' },
    { name: 'Today', value: 'today' },
    { name: 'Last Week', value: 'week' },
    { name: 'Last Month', value: 'month' },
    { name: 'Last Year', value: 'year' },
  ];

  tierOptions: Option[] = [
    { name: 'All Tiers', value: 'all' },
    { name: 'Tier 1', value: 1 },
    { name: 'Tier 2', value: 2 },
    { name: 'Tier 3', value: 3 },
  ];

  categoryOptions: Option[] = [DEFAULT_CATEGORY];
  subCategoryOptions: Option[] = [DEFAULT_SUB_CATEGORY];
  mediaOptions: Option[] = [DEFAULT_MEDIA];
  mediaTierOptions: Option[] = [DEFAULT_TIER];

  isLoadingCategoryOptions: boolean = true;
  isLoadingSubCategoryOptions: boolean = true;
  isLoadingMediaOptions: boolean = true;

  constructor(
    private store: Store<AppState>,
    private preferenceService: PreferenceService
  ) {
    this.getCategoriesOptions();
    this.getSubCategoriesOptions();
    this.getMediaOptions();
  }

  getCategoriesOptions = () => {
    this.preferenceService.getCategories().subscribe(
      (response) => {
        const categoryOptions = response.results.map((category) => ({
          name: category.descriptionz,
          value: category.category_set,
        }));
        this.categoryOptions = [...this.categoryOptions, ...categoryOptions];
      },
      () => {
        // on Error
      },
      () => {
        this.isLoadingCategoryOptions = false;
      }
    );
  };

  getSubCategoriesOptions = (category = this.selectedCategory) => {
    this.selectedSubCategory = initialState.category_id;
    this.preferenceService.getSubCategories(category).subscribe(
      (response) => {
        const subCategoryOptions = response.results.map((category) => ({
          name: category.category_id,
          value: category.category_id,
        }));
        this.subCategoryOptions = [DEFAULT_SUB_CATEGORY, ...subCategoryOptions];
      },
      () => {
        // on Error
      },
      () => {
        this.isLoadingSubCategoryOptions = false;
      }
    );
  };

  getMediaOptions = () => {
    this.preferenceService.getMedias().subscribe(
      (response) => {
        const mediaOptions = response.results.map((category) => ({
          name: category.user_media_type_name_def,
          value: category.user_media_type_id,
        }));
        this.mediaOptions = [...this.mediaOptions, ...mediaOptions];
      },
      () => {
        // on Error
      },
      () => {
        this.isLoadingMediaOptions = false;
      }
    );
  };

  onChangeCategory = (data: any) => {
    this.getSubCategoriesOptions(data);
  };

  onSetFilter() {
    const today = moment().format('YYYY-MM-DD');
    const dateRange: any = {
      yesterday: [moment().subtract(1, 'days').format('YYYY-MM-DD'), moment().subtract(1, 'days').format('YYYY-MM-DD')],
      today: [today, today],
      week: [moment().subtract(1, 'weeks').format('YYYY-MM-DD'), today],
      month: [moment().subtract(1, 'months').format('YYYY-MM-DD'), today],
      year: [moment().subtract(1, 'years').format('YYYY-MM-DD'), today],
    };
    const defaultStartDate = dateRange[this.selectedPeriodic][0];
    const defaultEndDate = dateRange[this.selectedPeriodic][1];

    const startDate = this.isCustom
      ? moment(this.startDate).startOf('day').format('YYYY-MM-DD')
      : moment(defaultStartDate).startOf('day').format('YYYY-MM-DD');

    const endDate = this.isCustom
      ? moment(this.endDate).endOf('day').format('YYYY-MM-DD')
      : moment(defaultEndDate).endOf('day').format('YYYY-MM-DD');

    const filter: FilterState = {
      category_set: this.selectedCategory,
      category_id: this.selectedSubCategory,
      date_type: this.isCustom ? 'Custom' : this.selectedPeriodic,
      user_media_type_id: this.selectedMedia,
      start_date: startDate,
      end_date: endDate,
      start_time: this.isCustom ? moment(this.startTime).format("HH:mm:ss") : '00:00:00',
      end_time: this.isCustom ? moment(this.endTime).format("HH:mm:ss") : '23:59:59',
      media_tier: this.selectedTier,
    };
    this.store.dispatch(setFilter({ filter }));
  }

  onClickCustom = () => {
    this.isCustom = !this.isCustom;
  };
}
