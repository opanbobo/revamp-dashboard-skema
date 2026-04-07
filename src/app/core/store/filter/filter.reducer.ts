import { createReducer, on } from '@ngrx/store';
import * as FilterActions from './filter.actions';
import moment from 'moment';

export interface FilterState {
  date_type: string;
  category_id: string;
  category_set: number;
  user_media_type_id: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  maxSize?: number;
  media_tier?: number | null | string;
}

export const initialState: FilterState = {
  date_type: 'today',
  start_date: moment().format('YYYY-MM-DD'),
  end_date: moment().format('YYYY-MM-DD'),
  start_time: '00:00:00',
  end_time: '23:59:59',
  category_id: 'all',
  category_set: 0,
  user_media_type_id: 0,
  maxSize: 20,
  media_tier: 'all',
};

export const filterReducer = createReducer(
  initialState,
  on(FilterActions.setFilter, (state, { filter }) => {
    return { ...filter };
  })
);
