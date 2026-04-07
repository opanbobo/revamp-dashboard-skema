import { mapToCanActivate, Route } from '@angular/router';
import { AuthGuardService } from '../../core/guards/auth-guard.service';
import { AnalyzeComponent } from './analyze/analyze.component';
import { ArticleDetailComponent } from './article-detail/article-detail.component';
import { ArticlesByMediaComponent } from './articles-by-media/articles-by-media.component';
import { ArticlesByToneComponent } from './articles-by-tone/articles-by-tone.component';
import { ArticlesComponent } from './articles/articles.component';
import { DashboardComponent } from './dashboard.component';
import { MapArticlesComponent } from './map-articles/map-articles.component';
import { MapComponent } from './map/map.component';
import { MediaSOVComponent } from './media-sov/media-sov.component';
import { NewsindexComponent } from './newsindex/newsindex.component';
import { OverviewArticlesComponent } from './overview-articles/overview-articles.component';
import { OverviewComponent } from './overview/overview.component';
import { PreferenceComponent } from './preference/preference.component';
import { SearchComponent } from './search/search.component';
import { ShareComponent } from './share/share.component';
import { SocialMediaIndexComponent } from './social-media-index/social-media-index.component';
import { SocialMediaOverviewComponent } from './social-media-overview/social-media-overview.component';
import { SpokespersonComponent } from './spokesperson/spokesperson.component';
import { TopArticlesComponent } from './top-articles/top-articles.component';
import { AdminComponent } from './admin/admin.component';
import { EpaperComponent } from './epaper/epaper.component';
import { DownloadComponent } from './download/download.component';

interface ChildrenRoute extends Route {
  withFilter?: boolean;
}

interface DashboardRoutesProps extends Route {
  children?: ChildrenRoute[];
}

export const DashboardRoutes: DashboardRoutesProps[] = [
  {
    path: '',
    pathMatch: 'prefix',
    component: DashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        title: 'Overview',
        component: OverviewComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'analyze',
        title: 'Analyze',
        component: AnalyzeComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'spokesperson',
        title: 'Spokesperson',
        component: SpokespersonComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'media-sov',
        title: 'Media SOV',
        component: MediaSOVComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'map',
        title: 'Map',
        component: MapComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'map-articles',
        title: 'Map Articles',
        component: MapArticlesComponent,
        withFilter: true,
      },
      {
        path: 'news-index',
        title: 'News Index',
        component: NewsindexComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'preference',
        title: 'Preference',
        component: PreferenceComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'share',
        title: 'Share',
        component: ShareComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'overview-articles',
        title: 'Overview Articles',
        component: OverviewArticlesComponent,
        withFilter: true,
      },
      {
        path: 'top-articles',
        title: 'Top Articles',
        component: TopArticlesComponent,
        withFilter: true,
      },
      {
        path: 'articles',
        title: 'Articles',
        component: ArticlesComponent,
        withFilter: true,
      },
      {
        path: 'articles-by-media',
        title: 'Articles By Media',
        component: ArticlesByMediaComponent,
        withFilter: true,
      },
      {
        path: 'articles-by-tone',
        title: 'Articles By Tone',
        component: ArticlesByToneComponent,
        withFilter: true,
      },
      {
        path: 'articles/:id',
        title: 'Article Detail',
        component: ArticleDetailComponent,
        withFilter: false,
      },
      {
        path: 'search',
        title: 'Search',
        component: SearchComponent,
        withFilter: false,
      },
      {
        path: 'social-media-index',
        title: 'Social Media Index',
        component: SocialMediaIndexComponent,
        withFilter: true,
      },
      {
        path: 'epaper',
        title: 'E-Paper',
        component: EpaperComponent,
        canActivate: mapToCanActivate([AuthGuardService]),
        withFilter: true,
      },
      {
        path: 'download',
        title: 'Download',
        component: DownloadComponent,
        withFilter: true,
      },
      {
        path: 'social-media-overview',
        title: 'Social Media Overview',
        component: SocialMediaOverviewComponent,
        withFilter: true,
      },
      {
        path: 'admin',
        title: 'Admin',
        component: AdminComponent,
        withFilter: true,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
