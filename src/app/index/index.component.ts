import { Component, OnInit } from '@angular/core';

import { StoredPlane, Plane } from '../plane';
import { PlaneService } from '../plane.service';
import { CoordsService } from '../coords.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { getNumberOfSecondsBetweenDates } from '../utils';

const position = {
  latitude: 50.08179,
  longitude:  19.97605
};
const textStrokeColor = '#888';
const textFillColor = '#fff';
const textStrokeWidth = 2;
const updateEvery = 5; // How often the plane positions are updated [seconds]
const featureClickTolerance = 5; // How much the clickable feature area is extended [pixels]

const altitude1 = 2000;
const altitude2 = 10000;
const altitude3 = 20000;
const altitude4 = 30000;
const altitude5 = 50000;

declare var ol: any;

class AvailableLayer {

  constructor(public title: string, public faIcon: string, public layer: any) {}

  onClick() {
    if (this.layer.getVisible()) {
      this.layer.setVisible(false);
    } else {
      this.layer.setVisible(true);
    }
  }
};

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {

  availableLayers: AvailableLayer[];

  skippedPlanes: number = 0;
  renderedPlanes: number = 0;

  selectedPlane: Plane;
  selectedPlaneHistory: StoredPlane[];

  constructor(
    private planeService: PlaneService,
    private coordsService: CoordsService) { }

  ngOnInit() {
    // World layer.
    let sourceWorld = new ol.source.OSM({
      url: 'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png'
    });
    let worldLayer = new ol.layer.Tile({
      source: sourceWorld,
      opacity: 0.5
    });

    // Planes layer.
    let planesSource = new ol.source.Vector({});
    let planeLayer = new ol.layer.Vector({
      source: planesSource
    });

    // Polar range plot layer.
    let rangeSource = new ol.source.Vector({});
    let rangeLayer = new ol.layer.Vector({
      source: rangeSource,
      visible: false
    });
    rangeLayer.on('change:visible', () => {
      if (rangeLayer.getVisible()) {
        this.updateRange(rangeSource);
      } else {
        console.log('turned off');
      }
    });

    // Selected feature data layer (flight path etc).
    let dataSource = new ol.source.Vector({});
    let dataLayer = new ol.layer.Vector({
      source: dataSource
    });

    // Map.
    let map = new ol.Map({
      target: 'map',
      layers: [worldLayer, dataLayer, rangeLayer, planeLayer],
      controls: new ol.Collection(),
      view: new ol.View({
        center: ol.proj.transform([position.longitude, position.latitude], 'EPSG:4326', 'EPSG:3857'),
        zoom: 8
      })
    });

    // Change cursor to pointer if a feature from the planeLayer is moused over.
    map.on('pointermove', (evt) => {
        map.getTargetElement().style.cursor =
          map.hasFeatureAtPixel(evt.pixel, {
            layerFilter: (layer) => layer == planeLayer,
            hitTolerance: featureClickTolerance
          }) ? 'pointer' : '';
      }
    );

    // Clicking on coords.
    this.coordsService.coords$.subscribe(
      (coords) => this.focusMap(map, coords.latitude, coords.longitude)
    );

    // Selecting planes.
    let interaction = new ol.interaction.Select({
      condition: ol.events.condition.singleClick,
      layers: [planeLayer],
      multi: false,
      hitTolerance: featureClickTolerance,
      filter: (feature) => {
        let d = feature.get('data');
        if (d.icao) {
          return true;
        }
        return false;
      }
    });
    interaction.on('select', (e) => {
        dataSource.clear();

        if (e.selected.length == 0) {
          this.clearPlaneSelection();
        }

        for (let f of e.selected) {
            let d = f.get('data')
            if (d.icao) {
              this.selectPlane(dataSource, d);
            }
        }

        map.render()
      }
    );
    map.addInteraction(interaction)

    // Layer buttons
    this.availableLayers = [
      new AvailableLayer('Toggle world map', 'fa-globe', worldLayer),
      new AvailableLayer('Toggle polar range', 'fa-circle', rangeLayer),
      new AvailableLayer('Toggle planes', 'fa-plane', planeLayer),
    ];

   //From button
    //$('#range-input-from').datetimepicker({
    //    onChangeDateTime: (dp, $input) ->
    //        rangeFrom = dp
    //})
    //$('#range-button-from').on('click', () ->
    //    $('#range-input-from').datetimepicker('show')
    //)

   //To button
    //$('#range-input-to').datetimepicker({
    //    onChangeDateTime: (dp, $input) ->
    //        rangeTo = dp
    //})
    //$('#range-button-to').on('click', () ->
    //    $('#range-input-to').datetimepicker('show')
    //)

    //# Apply button
    //$('#range-button-apply').on('click', () ->
    //    updateRange(rangeSource)
    //)

    // Trigger the first update.
    this.update(planesSource, dataSource);
  }

  private selectPlane(dataSource, plane: Plane) {
    this.selectedPlane =  plane;
    this.selectedPlaneHistory = null;

    // Draw flight history.
    dataSource.clear();
    this.planeService.getPlane(plane.icao)
      .subscribe((planeHistory) => {
        this.selectedPlaneHistory = planeHistory;
        this.drawPlaneHistory(dataSource, planeHistory);
      });
  }

  private clearPlaneSelection() {
    this.selectedPlane = null;
    this.selectedPlaneHistory = null;
  }

  private drawPlaneHistory(dataSource, planeHistory: StoredPlane[]) {
    for (let i = 0; i < planeHistory.length; i++) {
      let data = planeHistory[i];
      if (data.data.longitude && data.data.latitude) {
        if (i < planeHistory.length - 1 && getNumberOfSecondsBetweenDates(new Date(), Date.parse(data.time)) < 30 * 60) {
          let coords = [];

          let c1 = [data.data.longitude, data.data.latitude];
          let coord1 = ol.proj.fromLonLat(c1);
          coords.push(coord1);

          let c2 = [planeHistory[i + 1].data.longitude, planeHistory[i + 1].data.latitude];
          let coord2 = ol.proj.fromLonLat(c2);
          coords.push(coord2);

          // Line
          let style = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: this.pickColorForAltitude(data.data.altitude),
              width: 2
            })
          });
          let feature = new ol.Feature({
            geometry: new ol.geom.LineString(coords)
          });
          feature.setStyle(style);
          dataSource.addFeature(feature);

          // Point
          style = new ol.style.Style({
            image: new ol.style.Circle({
              fill: new ol.style.Fill({
                color: this.pickColorForAltitude(data.data.altitude)
              }),
              radius: 2
            })
          });
          feature = new ol.Feature({
            geometry: new ol.geom.Point(coord1)
          });
          feature.setStyle(style);
          dataSource.addFeature(feature);
        }
      }
    }
  }

  private update(planesSource, dataSource) {
    this.planeService.getPlanes()
      .subscribe((planes) => this.handlePlanes(planesSource, dataSource, planes));

    setTimeout(() => this.update(planesSource, dataSource), 1000 * updateEvery);
  }

  private handlePlanes(planesSource, dataSource, planes: Plane[]) {
    // Render the planes on the map.
    this.renderPlanes(planesSource, planes);

    // Update the drawn historical data and the sidebar data.
    if (this.selectedPlane != null &&
        this.selectedPlaneHistory != null &&
        this.selectedPlaneHistory.length != 0) {
      for (let plane of planes) {
        if (plane.icao == this.selectedPlane.icao) {
          // Update the point used for the sidebar.
          this.selectedPlane = plane;

          // Insert a fake historical point into the array.
          let last = this.selectedPlaneHistory[this.selectedPlaneHistory.length - 1];
          if (last.data.latitude != plane.latitude || last.data.longitude != plane.longitude) {
            let storedPlane = new StoredPlane();
            storedPlane.time = (new Date()).toISOString();
            storedPlane.data = plane;
            this.selectedPlaneHistory.push(storedPlane);
            dataSource.clear();
            this.drawPlaneHistory(dataSource, this.selectedPlaneHistory);
          }
        }
      }
    }
  }

  private renderPlanes(planesSource, planes: Plane[]) {
    // Function which looks for a feature with the right callsign
    let findFeature = (icao) => {
      for (let f of planesSource.getFeatures()) {
        if (f.get('data').icao == icao) {
            return f;
        }
      }
      return null;
    }

    let skippedPlanes = 0;
    let renderedPlanes = 0;

    for (let v of planes) {
      // Sanity check
      if (!v.longitude || !v.latitude) {
        skippedPlanes++;
        continue;
      }
      renderedPlanes++;

      // Convert coords
      let c = [v.longitude, v.latitude];
      let cord = ol.proj.fromLonLat(c);

      // Get an existing feature or create a new one if it doesn't exist yet
      let feature = findFeature(v.icao);
      if (!feature) {
        feature = new ol.Feature({});
        planesSource.addFeature(feature);
      }

      // Update custom properties
      feature.setProperties({
        data: v
      });

      // Update feature
      feature.setGeometry(new ol.geom.Point(cord));
      let spd = v.speed;
      if (spd != null && spd < 50) {
        feature.setStyle(this.getStationaryPlaneStyle(feature)); // TODO remove? (unreliable)
      } else {
        feature.setStyle(this.getPlaneStyle(feature));
      }
    }

    this.skippedPlanes = skippedPlanes;
    this.renderedPlanes = renderedPlanes;

    // Function which looks for a callsign in new data.
    let findClient = (icao) => {
      for (let c of planes) {
        if (c.icao == icao) {
          return c;
        }
      }
      return null;
    }

    // Remove missing
    for (let f of planesSource.getFeatures()) {
      if (!findClient(f.get('data').icao)) {
        planesSource.removeFeature(f);
      }
    }

  }

  private getPlaneStyle(feature) {
    let data = feature.get('data');
    let rotation = (data.heading / 360) * 2 * Math.PI;
    let planeStyle = new ol.style.Style({
      image: new ol.style.Icon({
        src: '/assets/img/plane.png',
        rotation: rotation
      })
    });
    let label: string;
    if (data.flight_number) {
      label = data.flight_number;
    } else {
      label = 'No callsign';
    }
    return this.getResolutionStyle(2000, [planeStyle], [planeStyle, this.makeTextStyle(label)]);
  }

  private getStationaryPlaneStyle(feature) {
    let data = feature.get('data');
    let rot = (data.heading / 360) * 2 * Math.PI;
    let planeStyle = new ol.style.Style({
      image: new ol.style.Icon({
        src: '/assets/img/plane.png',
        rotation: rot,
        opacity: 0.4
      }),
      zIndex: -100
    });
    return this.getResolutionStyle(100, [], [planeStyle]);
  }

  private getResolutionStyle(thresholdResolution, styleAbove, styleBelow) {
    return (resolution) => {
      if (resolution < thresholdResolution) {
        return styleBelow;
      } else {
        return styleAbove;
      }
    }
  }

  private makeTextStyle(text) {
    return new ol.style.Style({
      text: new ol.style.Text({
        text: text,
        font: '11px Verdana',
        offsetX: 10,
        textAlign: 'left',
        fill: new ol.style.Fill({
          color: textFillColor
        }),
        stroke: new ol.style.Stroke({
          color: textStrokeColor,
          width: textStrokeWidth
        })
      })
    });
  }

  // Pans the map and zooms it on the specified coordinates.
  private focusMap(map, lat: number, lon: number) {
    map.getView().animate({
	  center: ol.proj.fromLonLat([lon, lat]),
	  zoom: 9,
	  duration: 2000
	});
  }

  private pickColorForAltitude(altitude: number): string {
    if (altitude < altitude1)
        return this.formatColor(255, 255 * this.altitudeAsFraction(altitude, 0, altitude1), 0, 1);
    if (altitude < altitude2)
        return this.formatColor(255 * (1 - this.altitudeAsFraction(altitude, altitude1, altitude2)), 255, 0, 1);
    if (altitude < altitude3)
        return this.formatColor(0, 255, 255 * this.altitudeAsFraction(altitude, altitude2, altitude3), 1);
    if (altitude < altitude4)
        return this.formatColor(0, 255 * (1 - this.altitudeAsFraction(altitude, altitude3, altitude4)), 255, 1);
    if (altitude < altitude5)
        return this.formatColor(255 * this.altitudeAsFraction(altitude, altitude4, altitude5), 0, 255, 1);
    return this.formatColor(255, 0, 255, 1);
  }

  private altitudeAsFraction(current: number, min: number, max: number ): number {
    return (current - min) / (max - min);
  }

  private formatColor(r: number, g: number, b: number, a: number): string {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }

  private updateRange(rangeSource) {
    let rangeTo = new Date();
    let rangeFrom = new Date();
    rangeFrom.setDate(rangeFrom.getDate() - 1);

    this.planeService.getPolar(rangeFrom, rangeTo)
      .subscribe((planes) => this.drawRange(rangeSource, planes));
  }

  private drawRange(rangeSource, planes) {
    rangeSource.clear();

    // Draw polygon
    let data = {};

    for (let k in planes) {
      let v = planes[k];

      if (!v.data.data.latitude || !v.data.data.longitude) {
        continue;
      }

      k = Math.floor(parseFloat(k) / 5).toString();

      if (!data[k] || data[k].distance < v.distance) {
        data[k] = {
          bearing: k,
          distance: v.distance,
          v: v.data.data
        };
      }
    }

    let bearings = [];
    for (let k in data) {
      bearings.push(k);
    }
    bearings.sort((e1, e2) => e1 - e2);

    let cord = [];
    for (let k in bearings) {
      let v = data[k];
      let c = [parseFloat(v.v.longitude), parseFloat(v.v.latitude)];
      c = ol.proj.fromLonLat(c);
      cord.push(c);
    }
    cord.push(cord[0]);

    let feature = new ol.Feature({});
    feature.setGeometry(new ol.geom.Polygon([cord]));
    feature.setStyle(this.getRangePolygonStyle());
    rangeSource.addFeature(feature);

    // Draw every point position
    for (let k in data) {
      let v = data[k];
      let c = [v.v.longitude, v.v.latitude];
      let cord = ol.proj.fromLonLat(c);
      let feature = new ol.Feature({});
      feature.setGeometry(new ol.geom.Point(cord));
      feature.setStyle(this.getRangePointStyle(v));
      rangeSource.addFeature(feature);
    }

    // Draw station position
    let c = [position.longitude, position.latitude];
    cord = ol.proj.fromLonLat(c);
    feature = new ol.Feature({});
    feature.setGeometry(new ol.geom.Point(cord));
    feature.setStyle(this.getStationPositionStyle());
    rangeSource.addFeature(feature);
  }

  private getRangePointStyle(value): any {
    let style = new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'rgba(41, 128, 185, 1)'
        }),
        radius: 3
      })
    });
    let textStyle = this.makeTextStyle(Math.round(value.distance) + 'km');
    return this.getResolutionStyle(600, [style], [style, textStyle])
  }

  private getRangePolygonStyle(): any {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(41, 128, 185, 0.5)',
        width: 2
      }),
      fill: new ol.style.Fill({
        color: 'rgba(41, 128, 185, 0.3)'
      })
    });
  }

  private getStationPositionStyle(): any {
    let style = new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'rgba(214, 69, 65, 1)'
        }),
        radius: 5
      })
    });
    let textStyle = this.makeTextStyle('Station position');
    return this.getResolutionStyle(100, [style], [style, textStyle]);
  }
}
