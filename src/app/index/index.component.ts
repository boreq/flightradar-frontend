import { Component, OnInit } from '@angular/core';

import { Plane } from '../plane';
import { PlaneService } from '../plane.service';
import { SidebarComponent } from './sidebar/sidebar.component';

const position = {
  latitude: 50.08179,
  longitude:  19.97605
};
const textStrokeColor = '#888';
const textFillColor = '#fff';
const textStrokeWidth = 2;
const updateEvery = 5;

declare var ol: any;

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {

  skippedPlanes: number = 0;
  renderedPlanes: number = 0;

  selectedPlane: Plane;

  constructor(private planeService: PlaneService) { }

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

    // Clicking on coords.
    //$(document).on('click', '.coords', (e) ->
    //    focusMap(map,
    //             parseFloat($(e.target).attr('lat')),
    //             parseFloat($(e.target).attr('lon'))
    //    )
    //)

    // Selecting planes.
    let interaction = new ol.interaction.Select({
      condition: ol.events.condition.singleClick,
      layers: [planeLayer],
      multi: false,
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
              //displayPlane(d, dataSource)
              this.selectPlane(d);
            }
        }

        map.render()
      }
    );
    map.addInteraction(interaction)

    //# Buttons
    //toggle = (e, layer, onShow, onHide) ->
    //    visible = layer.getVisible()
    //    layer.setVisible(!visible)
    //    if visible
    //        $(e.delegateTarget).addClass('hidden')
    //        if onHide
    //            onHide()
    //    else
    //        $(e.delegateTarget).removeClass('hidden')
    //        if onShow
    //            onShow()

    //$('#layer-button-world').on('click', (e) ->
    //    toggle(e, worldLayer)
    //)

    //$('#layer-button-aircraft').on('click', (e) ->
    //    toggle(e, planeLayer)
    //)

    //$('#layer-button-polar').on('click', (e) ->
    //    toggle(e, rangeLayer, () ->
    //        updateRange(rangeSource)
    //        $('.range-hidden').removeClass('hidden')
    //    , () -> 
    //        $('.range-hidden').addClass('hidden')
    //    )
    //)
    //$('#layer-button-polar').addClass('hidden')
    //$('.range-hidden').addClass('hidden')

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

    //rangeTo = new Date()
    //rangeFrom = new Date()
    //rangeFrom.setDate(rangeFrom.getDate() - 1)

    this.update(planesSource, dataSource)
  }

  private selectPlane(plane: Plane) {
    this.selectedPlane =  plane;
  }

  private clearPlaneSelection() {
    this.selectedPlane = null;
  }

  private update(planesSource, dataSource) {
    this.planeService.getPlanes()
      .subscribe(planes => this.handlePlanes(planesSource, planes));

    setTimeout(() => this.update(planesSource, dataSource), 1000 * updateEvery);
  }

  private handlePlanes(planesSource, planes: Plane[]) {
    // Render the planes on the map.
    this.renderPlanes(planesSource, planes);

    // Update the current data shown in the sidebar if needed.
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
}
