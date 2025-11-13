import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { Store } from '@ngrx/store';
import L, { DomUtil, MapOptions, control, geoJSON, latLng, tileLayer } from 'leaflet';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { IconNewspaperComponent } from '../../../core/components/icons/newspaper/newspaper.component';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { AllCount, Location, ProvinceCount } from '../../../core/models/all-count.model';
import { Article } from '../../../core/models/article.model';
import { FilterRequestPayload } from '../../../core/models/request.model';
import { FilterService } from '../../../core/services/filter.service';
import { MapService } from '../../../core/services/map.service';
import { AppState } from '../../../core/store';
import { FilterState, initialState } from '../../../core/store/filter/filter.reducer';
import { isDarkMode } from '../../../shared/utils/CommonUtils';

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
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent {
  filter: any;
  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }

  mapLocationData: Location[] = [];
  map: L.Map | null = null;
  geoJsonLayer: L.GeoJSON | null = null;
  selectedLoc: string | null = null;
  articles: Article[] = [];
  isLoadingArticles: boolean = false;

  provinceLayers: Map<string, L.Layer> = new Map();
  citiesLayers: Map<string, L.Layer> = new Map();
  citiesLayersByProvince: Map<string, L.LayerGroup> = new Map();
  selectedGroupCities: L.LayerGroup | null = null;
  selectedLayerProv: L.Layer | null = null;

  selectedFilter: string = 'article';
  filterOptions = [
    { name: 'Article', value: 'article' },
    { name: 'Media', value: 'media' },
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
    this.filter = this.filterService.subscribe(this.onFilterChange);
  }

  ngAfterViewInit(): void {
    // this.fetchCitiesCount(this.filter);
  }

  navigateInsideZone(article_id: string) {
    this.ngZone.run(() => {
      this.router.navigate([`/dashboard/articles/${article_id}`]);
    });
  }

  fetchProvinceCount = (filter: FilterRequestPayload | FilterState = initialState) => {
    this.mapService.getAllCountProv(filter as FilterRequestPayload, '').subscribe((res) => {
      this.addProvGeoJSONLayer(filter, res);
    });
  }

  fetchCitiesCount = (filter: FilterRequestPayload | FilterState = initialState) => {
    this.mapService.getAllCount(filter as FilterRequestPayload).subscribe((res) => {
      this.addCitiesGeoJSONLayer(filter, res);
    });
  }

  fetchArticlesByGeo = (filter: FilterRequestPayload | FilterState | null, location = this.selectedLoc) => {
    this.isLoadingArticles = true;
    this.selectedLoc = location;

    let req = filter ?? initialState;
    if (location) req = { ...req, geo_loc: location };

    this.mapService.getArticleByGeo(req).subscribe((res) => {
      this.isLoadingArticles = false;
      this.articles = res.data;
      this.cdr.detectChanges();
    });
  };

  addLegendControl = () => {
    if (!this.map) return;
    const legendControl = control.layers(undefined, undefined, {
      position: 'bottomright',
    });
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

  addProvGeoJSONLayer(filter: any, data: ProvinceCount): void {

    const provinceMapping: { [key: string]: string } = {
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

    const getDataByLocation = (featureName: string) => {
      const provinceKey = provinceMapping[featureName.toUpperCase()];
      if (!provinceKey) {
        console.warn(`Province ${featureName} not found in the mapping.`);
        return null;
      }

      return data.data.find((prov) => prov.key.toUpperCase() === provinceKey.toUpperCase());
    };

    this.mapService.getGeoJsonDataProv().subscribe((data) => {
      if (!this.map) return;
      this.geoJsonLayer = geoJSON(data, {
        onEachFeature: (feature, layer) => {
          const featureName = feature.properties.WADMPR.toUpperCase();
          const tooltipContent = `${featureName}: ${getDataByLocation(featureName)?.value ?? 0}`;

          layer.bindTooltip("<div style='font-size: 8px;'><b>" + `${tooltipContent}` + "</b></div>", {
            permanent: true,
            direction: "center",
            className: 'bg-color'
          });

          this.provinceLayers.set(featureName, layer);

          layer.on({
            click: (e) => {
              const clickedFeatureName = e.target.feature.properties.WADMPR.toUpperCase();
              this.removeProvinceLayer(clickedFeatureName);

              const hoveredLayer = e.target;
              const featureData = getDataByLocation(clickedFeatureName);
              this.map?.fitBounds(e.target.getBounds());
              hoveredLayer.setStyle({
                fillColor: this.getMapColor(featureData?.value ?? 0),
                fillOpacity: 1,
              });
              this.addCitiesLayer(clickedFeatureName);
            },
            mouseover: (e) => {
              const hoveredLayer = e.target;
              hoveredLayer.setStyle({ fillColor: isDarkMode() ? '#f1f4fa' : '#111827', fillOpacity: 1 });
            },
            mouseout: (e) => {
              const hoveredLayer = e.target;
              const featureData = getDataByLocation(featureName);

              hoveredLayer.setStyle({
                fillColor: this.getMapColor(featureData?.value ?? 0),
                fillOpacity: 1,
              });
            },
          });
        },
        style: (feature) => {
          const featureName = feature?.properties.WADMPR.toUpperCase();
          const featureData = getDataByLocation(featureName);

          return {
            fillColor: this.getMapColor(featureData?.value ?? 0),
            fillOpacity: 1,
            color: isDarkMode() ? '#19182b' : '#f1f4fa',
            weight: 1,
          };
        },
      }).addTo(this.map);

      this.map.createPane('label')
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

            // const type = feature.properties.TYPE_2;

            if (!provinceGroups.has(provinceName)) {
              provinceGroups.set(provinceName, L.layerGroup());
            }

            const provinceGroup = provinceGroups.get(provinceName);
            provinceGroup?.addLayer(layer);

            const tooltipContent = `${cityName}: ${getDataByLocation(cityName)?.value ?? 0}`;

            layer.bindTooltip("<div style='font-size: 8px;'><b>" + tooltipContent + "</b></div>", {
              permanent: true,
              direction: "center",
              className: 'bg-color'
            });

            this.citiesLayers.set(cityName, layer);

            layer.on({
              click: (e) => {
                const clickedFeatureName = e.target.feature.properties.WADMKK;
                this.map?.fitBounds(e.target.getBounds());
                this.removeProvinceLayer(clickedFeatureName);
                this.fetchArticlesByGeo(filter, clickedFeatureName);
              },
              mouseover: (e) => {
                const hoveredLayer = e.target;
                hoveredLayer.setStyle({ fillColor: isDarkMode() ? '#f1f4fa' : '#111827', fillOpacity: 1 });
              },
              mouseout: (e) => {
                const hoveredLayer = e.target;
                const featureData = getDataByLocation(cityName);

                hoveredLayer.setStyle({
                  fillColor: this.getMapColor(featureData?.value ?? 0),
                  fillOpacity: 1,
                });
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
              fillColor: this.getMapColor(featureData?.value ?? 0),
              fillOpacity: 1,
              color: isDarkMode() ? '#19182b' : '#f1f4fa',
              weight: 1,
            };
          },
        });

        this.citiesLayersByProvince = provinceGroups;
      },
      error: (error) => {
        console.error("Error loading GeoJSON data:", error);
        this.isLoadingArticles = false; // Handle error case
      },
      complete: () => {
        this.isLoadingArticles = false;
      },
    });
  }


  getLevel(num: number, min: number, max: number) {
    if (num === 0) return 5;

    const range = max - min;
    const levelRange = range / 4;

    if (num <= min + levelRange) return 4;
    else if (num <= min + 2 * levelRange) return 3;
    else if (num <= min + 3 * levelRange) return 2;
    return 1;
  }

  getMapColor(value: number) {
    const colorGroup: { [x: number]: string } = {
      1: '#04351d',
      2: '#074727',
      3: '#0c643a',
      4: '#2e8d58',
      5: '#6ab277',
    };

    const min = Math.min(...this.mapLocationData.map((v) => v.value));
    const max = Math.max(...this.mapLocationData.map((v) => v.value));
    const level = this.getLevel(value, min, max);
    return colorGroup[level];
  }

  onMapReady(map: L.Map) {
    this.map = map;
    const customZoomControl = control.zoom({
      position: 'bottomleft',
    });
    this.map.addControl(customZoomControl);
    this.addLegendControl();
  }

  onFilterTypeChange = (type_location: string) => {
    // if (this.geoJsonLayer) {
    //   this.geoJsonLayer.removeFrom(this.map!);
    // }
    this.clearMapLayers();
    this.fetchProvinceCount({ ...this.filterService.filter, type_location });
  };

  onFilterChange = (filterState: FilterState) => {
    // if (this.geoJsonLayer) {
    //   this.geoJsonLayer.removeFrom(this.map!);
    // }
    this.clearMapLayers();
    this.fetchProvinceCount(filterState);
    this.fetchCitiesCount(filterState);
  };

  removeProvinceLayer = (province: string): void => {
    const layer = this.provinceLayers.get(province);
    if (layer) {
      this.map?.removeLayer(layer);
    }
  }

  addCitiesLayer = (province: string) => {

    console.log(`provinsi === ${province}`);

    if (this.selectedLayerProv) {
      this.selectedGroupCities?.removeFrom(this.map!);
      this.selectedLayerProv.addTo(this.map!);
    }

    const provinceLayer = this.provinceLayers.get(province); // Assuming `provinceLayers` stores province layers
    if (provinceLayer) {
      this.map?.removeLayer(provinceLayer);
    }

    const cityLayerGroup = this.citiesLayersByProvince.get(province)
    if (cityLayerGroup) {
      cityLayerGroup.addTo(this.map!);
    }

    this.selectedGroupCities = cityLayerGroup!;
    this.selectedLayerProv = provinceLayer!;

  }

  clearMapLayers() {
    if (!this.map) return;

    this.isLoadingArticles = true;

    // Remove any existing GeoJSON layer from map
    if (this.geoJsonLayer) {
      this.geoJsonLayer.removeFrom(this.map);
      this.geoJsonLayer = null;
    }

    // Remove all individual province layers
    this.provinceLayers.forEach(layer => {
      if (this.map?.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    this.provinceLayers.clear();

    // Remove all city layers
    this.citiesLayers.forEach(layer => {
      if (this.map?.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    this.citiesLayers.clear();

    // Remove all city layer groups
    this.citiesLayersByProvince.forEach(group => {
      if (this.map?.hasLayer(group)) {
        this.map.removeLayer(group);
      }
    });
    this.citiesLayersByProvince.clear();

    // Reset selected province/city tracking
    this.selectedGroupCities = null;
    this.selectedLayerProv = null;
  }

}