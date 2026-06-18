import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { Store } from '@ngrx/store';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import L, { DomUtil, MapOptions, control, geoJSON, latLng, tileLayer, DomEvent } from 'leaflet';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { IconNewspaperComponent } from '../../../core/components/icons/newspaper/newspaper.component';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { AllCount, Location, ProvinceCount, SentimentCount } from '../../../core/models/all-count.model';
import { Article } from '../../../core/models/article.model';
import { FilterRequestPayload } from '../../../core/models/request.model';
import { FilterService } from '../../../core/services/filter.service';
import { MapService } from '../../../core/services/map.service';
import { AppState } from '../../../core/store';
import { FilterState, initialState } from '../../../core/store/filter/filter.reducer';
import { isDarkMode } from '../../../shared/utils/CommonUtils';

// Extend Leaflet Layer type to include tooltipElement
declare module 'leaflet' {
  interface Layer {
    tooltipElement?: L.Tooltip;
    cityName?: string; // Add cityName property
  }
}

interface TooltipPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface StoredPositions {
  [key: string]: TooltipPosition;
}

interface ProvinceToneChart {
  name: string;
  layer: L.Layer;
  data: any;
  position: { left: number; top: number } | null;
  offsetY: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    LeafletModule,
    DividerModule,
    IconNewspaperComponent,
    CommonModule,
    SpinnerComponent,
    RouterModule,
    DropdownModule,
    FormsModule,
    ChartModule,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private filterSubscription: any;
  mapLocationData: Location[] = [];
  map: L.Map | null = null;
  geoJsonLayer: L.GeoJSON | null = null;
  selectedLoc: string | null = null;
  articles: Article[] = [];
  isLoadingArticles: boolean = false;
  isLoadingCities: boolean = false;
  tonePieData: any;
  tonePieOpts: any;
  tonePiePlugins = [ChartDataLabels];
  toneChartPosition: { left: number; top: number } | null = null;
  selectedToneLocation: string | null = null;
  provinceToneCharts: ProvinceToneChart[] = [];
  private selectedToneLayer: L.Layer | null = null;

  provinceLayers: Map<string, L.Layer> = new Map();
  citiesLayers: Map<string, L.Layer> = new Map();
  citiesLayersByProvince: Map<string, L.LayerGroup> = new Map();
  selectedGroupCities: L.LayerGroup | null = null;
  selectedLayerProv: L.Layer | null = null;
  private pendingProvinceLayer: string | null = null;

  selectedFilter: string = 'article';
  filterOptions = [
    { name: 'Article', value: 'article' },
    { name: 'Media', value: 'media' },
    { name: 'Sentiment', value: 'sentiment' },
  ];

  options: MapOptions = {
    layers: [
      tileLayer('', {
        maxZoom: 15,
        minZoom: 5,
      }),
    ],
    zoom: 5,
    center: latLng(-0.1, 117.816666),
    zoomControl: false,
  };

  private provinceMapping: { [key: string]: string } = {
    ACEH: "Aceh",
    SUMUT: "Sumatera Utara",
    SUMBAR: "Sumatera Barat",
    RIAU: "Riau",
    JAMBI: "Jambi",
    SUMSEL: "Sumatera Selatan",
    BENGKULU: "Bengkulu",
    LAMPUNG: "Lampung",
    BABEL: "Kepulauan Bangka Belitung",
    KEPRI: "Kepulauan Riau",
    "DKI JAKARTA": "DKI Jakarta",
    JABAR: "Jawa Barat",
    JATENG: "Jawa Tengah",
    "DI. YOGYAKARTA": "DI Yogyakarta",
    JATIM: "Jawa Timur",
    BANTEN: "Banten",
    BALI: "Bali",
    NTB: "Nusa Tenggara Barat",
    NTT: "Nusa Tenggara Timur",
    KALBAR: "Kalimantan Barat",
    KALTENG: "Kalimantan Tengah",
    KALSEL: "Kalimantan Selatan",
    KALTIM: "Kalimantan Timur",
    KALTARA: "Kalimantan Utara",
    SULUT: "Sulawesi Utara",
    SULTENG: "Sulawesi Tengah",
    SULSEL: "Sulawesi Selatan",
    SULTRA: "Sulawesi Tenggara",
    GORONTALO: "Gorontalo",
    SULBAR: "Sulawesi Barat",
    MALUKU: "Maluku",
    MALUT: "Maluku Utara",
    PAPUA: "Papua",
    "PAPUA BARAT": "Papua Barat",
    "PAPUA BARAT DAYA": "Papua Barat Daya",
    "PAPUA SELATAN": "Papua Selatan",
    "PAPUA TENGAH": "Papua Tengah",
    "PAPUA PEGUNUNGAN": "Papua Pegunungan"
  };

  private tooltipDragKeyPressed = false;
  private storedPositions: StoredPositions = {};
  private readonly STORAGE_KEY = 'leaflet_tooltip_positions';
  private tooltipDataMap: Map<HTMLElement, { layer: L.Layer, name: string, originalTransform: string }> = new Map();
  private readonly PROVINCE_TONE_CHART_Y_OFFSET = 130;
  private readonly CITY_TONE_CHART_Y_OFFSET = 110;

  constructor(
    private mapService: MapService,
    private store: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    private filterService: FilterService
  ) { }

  ngOnInit(): void {
    this.isLoadingArticles = true;
    this.initTonePieOpts();
    this.filterSubscription = this.filterService.subscribe(this.onFilterChange);
    this.loadStoredPositions();
    this.setupKeyboardListeners();
  }

  ngAfterViewInit(): void {
    // Initial setup complete
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe?.();
    this.removeKeyboardListeners();
    this.map?.off('zoom move resize', this.updateToneChartOverlays);
  }

  get isSentimentMode(): boolean {
    return this.selectedFilter === 'sentiment';
  }

  // ============================================================================
  // STORAGE MANAGEMENT
  // ============================================================================

  private loadStoredPositions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.storedPositions = JSON.parse(stored);
        console.log('Loaded stored positions:', Object.keys(this.storedPositions).length);
      }
    } catch (error) {
      console.error('Error loading stored positions:', error);
      this.storedPositions = {};
    }
  }

  private savePosition(name: string, x: number, y: number): void {
    this.storedPositions[name] = {
      x,
      y,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.storedPositions));
      console.log(`Saved position for ${name}:`, { x, y });
    } catch (error) {
      console.error('Error saving position:', error);
    }
  }

  private getStoredPosition(name: string): TooltipPosition | null {
    return this.storedPositions[name] || null;
  }

  public resetTooltipPositions(): void {
    // Clear stored positions
    this.storedPositions = {};
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing positions:', error);
    }

    // Reset all tooltips to their original Leaflet positions
    this.tooltipDataMap.forEach((data, tooltipElement) => {
      // Clear custom offset data
      tooltipElement.dataset['customX'] = '0';
      tooltipElement.dataset['customY'] = '0';

      // Remove any custom transform
      tooltipElement.style.transform = data.originalTransform || '';
    });

    // Force Leaflet to re-render
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  // ============================================================================
  // KEYBOARD EVENT HANDLERS
  // ============================================================================

  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  private removeKeyboardListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.altKey && !this.tooltipDragKeyPressed) {
      this.tooltipDragKeyPressed = true;
      document.body.style.cursor = 'move';

      if (this.map) {
        this.map.dragging.disable();
      }

      this.updateTooltipDragState(true);
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (!e.altKey && this.tooltipDragKeyPressed) {
      this.tooltipDragKeyPressed = false;
      document.body.style.cursor = '';

      if (this.map) {
        this.map.dragging.enable();
      }

      this.updateTooltipDragState(false);
    }
  }

  private updateTooltipDragState(enabled: boolean): void {
    const tooltips = document.querySelectorAll('.draggable-tooltip');

    tooltips.forEach(tooltipElement => {
      const htmlElement = tooltipElement as HTMLElement;

      if (enabled) {
        htmlElement.classList.add('drag-enabled');
      } else {
        htmlElement.classList.remove('drag-enabled');
      }
    });
  }

  // ============================================================================
  // TOOLTIP DRAGGING LOGIC
  // ============================================================================

  private setupTooltipDragging(layer: L.Layer, name: string, isCity: boolean = false): void {
    // Wait for tooltip to be rendered
    setTimeout(() => {
      try {
        const tooltip = (layer as any).getTooltip();
        if (!tooltip || !tooltip._container) {
          console.warn(`Tooltip container not found for: ${name} (${isCity ? 'city' : 'province'})`);
          return;
        }

        const tooltipElement = tooltip._container as HTMLElement;

        // Check if already setup to avoid duplicates
        if (this.tooltipDataMap.has(tooltipElement)) {
          console.log(`Tooltip already setup for: ${name}, skipping`);
          return;
        }

        console.log(`Setting up tooltip for: ${name} (${isCity ? 'city' : 'province'})`);

        // Store the ORIGINAL Leaflet transform
        const originalTransform = tooltipElement.style.transform || '';

        // Store reference for later use
        this.tooltipDataMap.set(tooltipElement, {
          layer,
          name,
          originalTransform
        });

        // Store name in dataset for easy retrieval
        tooltipElement.dataset['tooltipName'] = name;
        tooltipElement.dataset['tooltipType'] = isCity ? 'city' : 'province';

        // Apply stored position if exists
        const storedPos = this.getStoredPosition(name);
        if (storedPos) {
          console.log(`Applying stored position for ${name}:`, storedPos);
          this.applyCustomPosition(tooltipElement, storedPos.x, storedPos.y);
        } else {
          // Apply small offset to prevent initial overlap
          this.applyInitialOffset(tooltipElement, name, isCity);
        }

        // Setup drag handlers
        this.addDragHandlers(tooltipElement, name);

        // Prevent tooltip click from propagating to layer
        DomEvent.disableClickPropagation(tooltipElement);

        // Set up reposition listener for zoom/pan
        this.setupTooltipRepositionListener(layer, tooltipElement, name);

        console.log(`✓ Tooltip dragging setup complete for: ${name}`);
      } catch (error) {
        console.error(`Error setting up tooltip for ${name}:`, error);
      }
    }, isCity ? 200 : 100); // Longer delay for city tooltips
  }

  private applyInitialOffset(tooltipElement: HTMLElement, name: string, isCity: boolean = false): void {
    // Create a deterministic but varied offset based on name
    const hash = this.hashCode(name);

    // Different offsets for cities vs provinces to avoid overlap
    const baseOffset = isCity ? 30 : 20;
    const offsetX = (hash % baseOffset) - (baseOffset / 2);
    const offsetY = ((hash >> 4) % baseOffset) - (baseOffset / 2);

    tooltipElement.dataset['customX'] = offsetX.toString();
    tooltipElement.dataset['customY'] = offsetY.toString();

    this.updateTooltipTransform(tooltipElement);
  }

  private applyCustomPosition(tooltipElement: HTMLElement, x: number, y: number): void {
    tooltipElement.dataset['customX'] = x.toString();
    tooltipElement.dataset['customY'] = y.toString();

    this.updateTooltipTransform(tooltipElement);
  }

  private updateTooltipTransform(tooltipElement: HTMLElement): void {
    const customX = parseFloat(tooltipElement.dataset['customX'] || '0');
    const customY = parseFloat(tooltipElement.dataset['customY'] || '0');

    // Get the ORIGINAL Leaflet transform
    const tooltipData = this.tooltipDataMap.get(tooltipElement);
    const originalTransform = tooltipData?.originalTransform || tooltipElement.style.transform;

    if (!originalTransform) {
      // If no transform exists, create a new one
      tooltipElement.style.transform = `translate(${customX}px, ${customY}px)`;
      return;
    }

    // Parse the existing transform
    const translateMatch = originalTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);

    if (translateMatch) {
      // Apply custom offset on top of Leaflet's transform
      const baseX = parseFloat(translateMatch[1]);
      const baseY = parseFloat(translateMatch[2]);
      const z = translateMatch[3];

      tooltipElement.style.transform = `translate3d(${baseX + customX}px, ${baseY + customY}px, ${z})`;
    } else {
      // Try to match translate2d
      const translate2dMatch = originalTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (translate2dMatch) {
        const baseX = parseFloat(translate2dMatch[1]);
        const baseY = parseFloat(translate2dMatch[2]);
        tooltipElement.style.transform = `translate(${baseX + customX}px, ${baseY + customY}px)`;
      } else {
        // No existing transform, just apply custom
        tooltipElement.style.transform = `translate(${customX}px, ${customY}px)`;
      }
    }
  }

  private addDragHandlers(tooltipElement: HTMLElement, name: string): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialCustomX = 0;
    let initialCustomY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!this.tooltipDragKeyPressed) return;

      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      initialCustomX = parseFloat(tooltipElement.dataset['customX'] || '0');
      initialCustomY = parseFloat(tooltipElement.dataset['customY'] || '0');

      tooltipElement.classList.add('dragging');

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !this.tooltipDragKeyPressed) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newCustomX = initialCustomX + deltaX;
      const newCustomY = initialCustomY + deltaY;

      tooltipElement.dataset['customX'] = newCustomX.toString();
      tooltipElement.dataset['customY'] = newCustomY.toString();

      this.updateTooltipTransform(tooltipElement);
    };

    const onMouseUp = () => {
      if (!isDragging) return;

      isDragging = false;
      tooltipElement.classList.remove('dragging');

      // Save the final position
      const finalX = parseFloat(tooltipElement.dataset['customX'] || '0');
      const finalY = parseFloat(tooltipElement.dataset['customY'] || '0');
      this.savePosition(name, finalX, finalY);

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    tooltipElement.addEventListener('mousedown', onMouseDown);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // ============================================================================
  // TOOLTIP REPOSITION LISTENER (for zoom/pan updates)
  // ============================================================================

  private setupTooltipRepositionListener(layer: L.Layer, tooltipElement: HTMLElement, name: string): void {
    if (!this.map) return;

    // Store the cleanup function on the layer
    (layer as any)._tooltipCleanup = () => {
      // Cleanup will be handled when layer is removed
    };
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  navigateInsideZone(article_id: string): void {
    this.ngZone.run(() => {
      this.router.navigate([`/dashboard/articles/${article_id}`]);
    });
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  fetchProvinceCount = (filter: FilterRequestPayload | FilterState = initialState): void => {
    this.mapService.getAllCountProv(filter as FilterRequestPayload, '').subscribe((res) => {
      this.addProvGeoJSONLayer(filter, res);
    });
  }

  fetchCitiesCount = (filter: FilterRequestPayload | FilterState = initialState): void => {
    this.isLoadingCities = true;
    this.mapService.getAllCount(filter as FilterRequestPayload).subscribe((res) => {
      this.addCitiesGeoJSONLayer(filter, res);
    });
  }

  fetchArticlesByGeo = (
    filter: FilterRequestPayload | FilterState | null,
    location = this.selectedLoc,
    layer?: L.Layer
  ): void => {
    this.isLoadingArticles = true;
    this.selectedLoc = location;
    this.selectedToneLocation = location;
    this.selectedToneLayer = layer ?? this.selectedToneLayer;
    this.tonePieData = null;
    this.updateToneChartPosition();

    let req = filter ?? initialState;
    if (location) req = { ...req, geo_loc: location };

    this.mapService.getArticleByGeo(req).subscribe({
      next: (res) => {
        this.isLoadingArticles = false;
        this.articles = res.data;
        this.initTonePieData(res.data);
        this.updateToneChartPosition();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading articles by geo:', error);
        this.isLoadingArticles = false;
        this.articles = [];
        this.initTonePieData([]);
        this.cdr.detectChanges();
      },
    });
  };

  private initTonePieOpts(): void {
    this.tonePieOpts = {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
        datalabels: {
          color: '#ffffff',
          font: {
            size: 8,
            weight: 'bold',
          },
          formatter: (_value: number, context: any) => {
            const value = context.dataset.values?.[context.dataIndex] ?? 0;
            return value || '';
          },
        },
      },
    };
  }

  private initTonePieData(articles: Article[]): void {
    const toneCounts = articles.reduce(
      (counts, article) => {
        const tone = this.normalizeTone(article.tone);

        if (tone === 'positive') counts.positive += 1;
        if (tone === 'negative') counts.negative += 1;
        if (tone === 'neutral') counts.neutral += 1;

        return counts;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const total = toneCounts.positive + toneCounts.negative + toneCounts.neutral;
    if (!total) {
      this.tonePieData = null;
      return;
    }

    this.tonePieData = this.createTonePieData(toneCounts.positive, toneCounts.negative, toneCounts.neutral);
  }

  private createTonePieDataFromSentiment(sentiment?: SentimentCount): any {
    const positive = sentiment?.positive ?? 0;
    const negative = sentiment?.negative ?? 0;
    const neutral = sentiment?.neutral ?? 0;

    return this.createTonePieData(positive, negative, neutral);
  }

  private createTonePieData(positive: number, negative: number, neutral: number): any {
    const documentStyle = getComputedStyle(document.documentElement);
    const positiveColor = documentStyle.getPropertyValue('--positive-color');
    const negativeColor = documentStyle.getPropertyValue('--negative-color');
    const neutralColor = '#9CA3AF';
    const values = [positive, negative, neutral];
    const total = positive + negative + neutral;

    return {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          data: total ? values : [0, 0, 1],
          values,
          backgroundColor: [positiveColor, negativeColor, neutralColor],
          hoverBackgroundColor: [positiveColor, negativeColor, neutralColor],
        },
      ],
    };
  }

  private normalizeTone(tone: Article['tone'] | string | null | undefined): 'positive' | 'negative' | 'neutral' | null {
    const normalizedTone = `${tone ?? ''}`.trim().toLowerCase();

    if (normalizedTone === '1' || normalizedTone === 'positive') return 'positive';
    if (normalizedTone === '-1' || normalizedTone === 'negative') return 'negative';
    if (normalizedTone === '0' || normalizedTone === 'neutral') return 'neutral';

    return null;
  }

  private updateToneChartPosition = (): void => {
    if (!this.map || !this.selectedToneLayer) {
      this.toneChartPosition = null;
      return;
    }

    const layer = this.selectedToneLayer as any;
    const center = layer.getBounds?.().getCenter?.() ?? layer.getLatLng?.();

    if (!center) {
      this.toneChartPosition = null;
      return;
    }

    const point = this.map.latLngToContainerPoint(center);
    this.toneChartPosition = {
      left: point.x,
      top: point.y,
    };
  };

  private updateProvinceToneChartPositions = (): void => {
    if (!this.map || !this.isSentimentMode) {
      this.provinceToneCharts.forEach((chart) => {
        chart.position = null;
      });
      return;
    }

    this.provinceToneCharts.forEach((chart) => {
      const layer = chart.layer as any;
      const center = layer.getBounds?.().getCenter?.() ?? layer.getLatLng?.();

      if (!center) {
        chart.position = null;
        return;
      }

      const point = this.map!.latLngToContainerPoint(center);
      chart.position = {
        left: point.x,
        top: point.y - chart.offsetY,
      };
    });
  };

  private updateToneChartOverlays = (): void => {
    this.updateToneChartPosition();
    this.updateProvinceToneChartPositions();
    this.cdr.detectChanges();
  };

  // ============================================================================
  // MAP CONTROLS
  // ============================================================================

  addLegendControl = (): void => {
    if (!this.map) return;

    const legendControl = control.layers(undefined, undefined, { position: 'bottomright' });

    legendControl.onAdd = () => {
      const legendContainer = DomUtil.create('div', 'legend');
      const legendContent = `
        <div style="background: linear-gradient(to right, rgba(138, 144, 171, 0.2), rgba(138, 144, 171, 1))" class="w-12rem h-1rem"></div>
        <div class="flex justify-content-between">
          <span>0</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
        </div>
      `;
      legendContainer.innerHTML = legendContent;
      return legendContainer;
    };

    legendControl.addTo(this.map);
  };

  // ============================================================================
  // GEOJSON LAYERS
  // ============================================================================

  addProvGeoJSONLayer(filter: any, data: ProvinceCount): void {
    const getDataByLocation = (featureName: string) => {
      const provinceKey = this.provinceMapping[featureName.toUpperCase()];
      if (!provinceKey) {
        console.warn(`Province ${featureName} not found in the mapping.`);
        return null;
      }

      return data.data.find((prov) => prov.key.toUpperCase() === provinceKey.toUpperCase());
    };

    this.mapService.getGeoJsonDataProv().subscribe((geoJsonData) => {
      if (!this.map) return;

      this.provinceToneCharts = [];

      this.geoJsonLayer = geoJSON(geoJsonData, {
        onEachFeature: (feature, layer) => {
          const featureName = feature.properties.WADMPR.toUpperCase();
          const featureData = getDataByLocation(featureName);

          const tooltipContent = this.isSentimentMode
            ? featureName
            : `${featureName}: ${featureData?.value ?? 0}`;

          const tooltip = L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'draggable-tooltip province-tooltip bg-color map-tooltip-padding',
            opacity: 0.95,
            interactive: true
          }).setContent(`<div style="font-size: 7px; font-weight: bold;">${tooltipContent}</div>`);

          layer.bindTooltip(tooltip);

          // Setup dragging for this tooltip
          this.setupTooltipDragging(layer, featureName, false);

          this.provinceLayers.set(featureName, layer);

          if (this.isSentimentMode) {
            const toneData = this.createTonePieDataFromSentiment(featureData?.sentiment);

            if (toneData) {
              this.provinceToneCharts.push({
                name: featureName,
                layer,
                data: toneData,
                position: null,
                offsetY: this.PROVINCE_TONE_CHART_Y_OFFSET,
              });
            }
          }

          layer.on({
            click: (e) => {
              if (this.tooltipDragKeyPressed) {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
                return;
              }

              const clickedFeatureName = e.target.feature.properties.WADMPR.toUpperCase();

              if (this.isSentimentMode) {
                this.map?.fitBounds(e.target.getBounds());
                this.addCitiesLayer(clickedFeatureName);
                return;
              }

              this.removeProvinceLayer(clickedFeatureName);

              const hoveredLayer = e.target;
              const clickedFeatureData = getDataByLocation(clickedFeatureName);
              this.map?.fitBounds(e.target.getBounds());

              console.log(`Clicked province: ${clickedFeatureName}, value: ${clickedFeatureData?.value ?? 0}`);

              hoveredLayer.setStyle({
                fillColor: this.getMapColor(clickedFeatureData?.value ?? 0, data.data), // Use data.data from parent scope
                fillOpacity: 1,
              });

              this.addCitiesLayer(clickedFeatureName);
              this.fetchArticlesByGeo(filter, this.provinceMapping[clickedFeatureName] ?? clickedFeatureName, e.target);
            },
            mouseover: (e) => {
              e.target.setStyle({
                fillColor: isDarkMode() ? '#f1f4fa' : '#111827',
                fillOpacity: 1
              });
            },
            mouseout: (e) => {
              const hoveredLayer = e.target;
              const featureData = getDataByLocation(featureName);

              hoveredLayer.setStyle({
                fillColor: this.getMapColor(featureData?.value ?? 0, data.data), // Pass data.data
                fillOpacity: 1,
              });
            },
          });
        },
        style: (feature) => {
          const featureName = feature?.properties.WADMPR.toUpperCase();
          const featureData = getDataByLocation(featureName);

          return {
            fillColor: this.getMapColor(featureData?.value ?? 0, data.data), // Pass data.data
            fillOpacity: 1,
            color: isDarkMode() ? '#19182b' : '#f1f4fa',
            weight: 1,
          };
        },
      }).addTo(this.map);

      this.map.createPane('label');
      this.updateProvinceToneChartPositions();
      if (this.isSentimentMode) {
        this.isLoadingArticles = false;
      }
      this.cdr.detectChanges();
    });
  }

  addCitiesGeoJSONLayer(filter: any, data: AllCount): void {
    const getDataByLocation = (featureName: string) => {
      return data.data.find((location) =>
        location.key.toUpperCase() === featureName?.toUpperCase()
      );
    };

    const provinceGroups = new Map<string, L.LayerGroup>();

    this.mapService.getGeoJsonDataCities().subscribe({
      next: (geoJsonData) => {
        if (!this.map) return;

        this.geoJsonLayer = geoJSON(geoJsonData, {
          onEachFeature: (feature, layer) => {
            const provinceName = feature.properties.WADMPR.toUpperCase();
            let cityName = feature.properties.WADMKK;

            if (!cityName.startsWith('Kota')) {
              cityName = 'Kabupaten ' + cityName;
            }

            if (!provinceGroups.has(provinceName)) {
              provinceGroups.set(provinceName, L.layerGroup());
            }

            const provinceGroup = provinceGroups.get(provinceName);
            provinceGroup?.addLayer(layer);

            // Store city name on layer object for easy access
            (layer as any).cityName = cityName;
            (layer as any).provinceName = provinceName;

            const featureData = getDataByLocation(cityName);
            const tooltipContent = this.isSentimentMode
              ? cityName
              : `${cityName}: ${featureData?.value ?? 0}`;

            (layer as any).sentiment = featureData?.sentiment;

            const tooltip = L.tooltip({
              permanent: true,
              direction: 'center',
              className: 'draggable-tooltip city-tooltip bg-color map-tooltip-padding',
              opacity: 0.95,
              interactive: true
            }).setContent(`<div style="font-size: 6px; font-weight: bold;">${tooltipContent}</div>`);

            layer.bindTooltip(tooltip);

            this.citiesLayers.set(cityName, layer);

            layer.on({
              click: (e) => {
                if (this.tooltipDragKeyPressed) {
                  e.originalEvent.preventDefault();
                  e.originalEvent.stopPropagation();
                  return;
                }

                const clickedFeatureName = e.target.feature.properties.WADMKK;
                this.map?.fitBounds(e.target.getBounds());
                this.removeProvinceLayer(clickedFeatureName);

                if (this.isSentimentMode) {
                  return;
                }

                this.fetchArticlesByGeo(filter, clickedFeatureName, e.target);
              },
              mouseover: (e) => {
                if (!this.tooltipDragKeyPressed) {
                  e.target.setStyle({
                    fillColor: isDarkMode() ? '#f1f4fa' : '#111827',
                    fillOpacity: 1
                  });
                }
              },
              mouseout: (e) => {
                if (!this.tooltipDragKeyPressed) {
                  const hoveredLayer = e.target;
                  const featureData = getDataByLocation(cityName);

                  hoveredLayer.setStyle({
                    fillColor: this.getMapColor(featureData?.value ?? 0, data.data), // Pass data.data
                    fillOpacity: 1,
                  });
                }
              },
            });
          },
          style: (feature) => {
            let cityName = feature?.properties.WADMKK;
            if (!cityName.startsWith('Kota')) {
              cityName = 'Kabupaten ' + cityName;
            }
            const featureData = getDataByLocation(cityName);

            return {
              fillColor: this.getMapColor(featureData?.value ?? 0, data.data), // Pass data.data
              fillOpacity: 1,
              color: isDarkMode() ? '#19182b' : '#f1f4fa',
              weight: 1,
            };
          },
        });

        this.citiesLayersByProvince = provinceGroups;
        this.isLoadingCities = false;
        if (this.pendingProvinceLayer) {
          const pendingProvince = this.pendingProvinceLayer;
          this.pendingProvinceLayer = null;
          this.addCitiesLayer(pendingProvince);
        }
      },
      error: (error) => {
        console.error("Error loading GeoJSON data:", error);
        this.isLoadingArticles = false;
        this.isLoadingCities = false;
      },
      complete: () => {
        this.isLoadingArticles = false;
        this.isLoadingCities = false;
      },
    });
  }

  // ============================================================================
  // MAP STYLING
  // ============================================================================

  getLevel(num: number, min: number, max: number, maxLevel: number = 10): number {
    if (num === 0) return maxLevel; // zero value → lightest color
    if (max === min) return 1;

    const range = max - min;
    const levelRange = range / maxLevel;

    for (let i = 1; i <= maxLevel; i++) {
      if (num <= min + i * levelRange) return maxLevel - i + 1;
    }

    return 1; // fallback for max value
  }

  getMapColor(value: number, allData: { key: string; value: number }[]): string {
    const colorGroup: { [x: number]: string } = {
      1: '#04351d', // darkest - for highest values
      2: '#0d4f24',
      3: '#1a6433',
      4: '#2a7a44',
      5: '#3a8f57',
      6: '#4da36c',
      7: '#61b681',
      8: '#77c996',
      9: '#8fdbac',
      10: '#a8edc2', // lightest - for lowest values
    };

    // Calculate min/max from the actual data being passed
    const allValues = allData.map(d => d.value);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    const level = this.getLevel(value, min, max);

    return colorGroup[level];
  }
  // ============================================================================
  // MAP LIFECYCLE
  // ============================================================================

  onMapReady(map: L.Map): void {
    this.map = map;
    const customZoomControl = control.zoom({ position: 'bottomleft' });
    this.map.addControl(customZoomControl);
    this.addLegendControl();
    this.map.on('zoom move resize', this.updateToneChartOverlays);
  }

  onFilterTypeChange = (type_location: string): void => {
    this.clearMapLayers();
    this.selectedLoc = null;
    this.articles = [];

    const nextFilter = {
      ...this.filterService.filter,
      type_location: type_location === 'sentiment' ? 'article' : type_location,
    };

    this.fetchProvinceCount(nextFilter);
    this.fetchCitiesCount(nextFilter);
  };

  onFilterChange = (filterState: FilterState): void => {
    this.clearMapLayers();
    const nextFilter = {
      ...filterState,
      type_location: this.selectedFilter === 'sentiment' ? 'article' : this.selectedFilter,
    };

    this.fetchProvinceCount(nextFilter);
    this.fetchCitiesCount(nextFilter);
  };

  removeProvinceLayer = (province: string): void => {
    const layer = this.provinceLayers.get(province);
    if (layer) {
      this.map?.removeLayer(layer);
    }
  }

  addCitiesLayer = (province: string): void => {
    console.log(`Adding cities layer for province: ${province}`);

    if (this.selectedLayerProv) {
      this.selectedGroupCities?.removeFrom(this.map!);
      this.selectedLayerProv.addTo(this.map!);
    }

    const provinceLayer = this.provinceLayers.get(province);
    if (provinceLayer) {
      this.map?.removeLayer(provinceLayer);
    }

    const cityLayerGroup = this.citiesLayersByProvince.get(province);
    if (!cityLayerGroup) {
      this.pendingProvinceLayer = province;
      this.isLoadingCities = true;
      return;
    }

    if (cityLayerGroup) {
      cityLayerGroup.addTo(this.map!);

      if (this.isSentimentMode) {
        this.provinceToneCharts = [];

        cityLayerGroup.eachLayer((layer: any) => {
          const toneData = this.createTonePieDataFromSentiment(layer.sentiment);

          if (toneData && layer.cityName) {
            this.provinceToneCharts.push({
              name: layer.cityName,
              layer,
              data: toneData,
              position: null,
              offsetY: this.CITY_TONE_CHART_Y_OFFSET,
            });
          }
        });

        this.updateProvinceToneChartPositions();
      }

      // Set up tooltip dragging for city layers that are now visible
      setTimeout(() => {
        cityLayerGroup.eachLayer((layer: any) => {
          if (layer.cityName) {
            this.setupTooltipDragging(layer, layer.cityName, true);
          }
        });
      }, 300);
    }

    this.selectedGroupCities = cityLayerGroup!;
    this.selectedLayerProv = provinceLayer!;
  }

  clearMapLayers(): void {
    if (!this.map) return;

    this.isLoadingArticles = true;

    if (this.geoJsonLayer) {
      this.geoJsonLayer.removeFrom(this.map);
      this.geoJsonLayer = null;
    }

    // Clean up event listeners before removing layers
    this.provinceLayers.forEach(layer => {
      if ((layer as any)._tooltipCleanup) {
        (layer as any)._tooltipCleanup();
      }
      if (this.map?.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    this.provinceLayers.clear();

    this.citiesLayers.forEach(layer => {
      if ((layer as any)._tooltipCleanup) {
        (layer as any)._tooltipCleanup();
      }
      if (this.map?.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    this.citiesLayers.clear();

    this.citiesLayersByProvince.forEach(group => {
      if (this.map?.hasLayer(group)) {
        this.map.removeLayer(group);
      }
    });
    this.citiesLayersByProvince.clear();

    this.selectedGroupCities = null;
    this.selectedLayerProv = null;
    this.pendingProvinceLayer = null;
    this.selectedToneLayer = null;
    this.toneChartPosition = null;
    this.tonePieData = null;
    this.provinceToneCharts = [];

    // Clear tooltip data map
    this.tooltipDataMap.clear();
  }
}
