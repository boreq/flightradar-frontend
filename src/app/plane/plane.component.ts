import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PlaneService } from '../plane.service';
import { StoredPlane } from '../plane';
import { colors } from '../colors';
import { getNumberOfSecondsBetweenDates } from '../utils';

declare var Chart: any;
declare var moment: any;

const numberOfMinutesOnTheYAxis =  10 * 24 * 60;

class Stats {
    public firstSighting: Date;
    public lastSighting: Date;
    public numberOfOverflies: number;
    public topSpeed: number;
    public topAltitude: number;

  constructor() {
    this.numberOfOverflies = 0;
  }
}

@Component({
  selector: 'app-plane',
  templateUrl: './plane.component.html',
  styleUrls: ['./plane.component.scss']
})
export class PlaneComponent implements OnInit {

  icao: string;

  stats: Stats;

  private sub: any;

  constructor(
    private planeService: PlaneService,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.icao = params['icao'];
      this.loadData(this.icao);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private loadData(icao: string) {
    this.planeService.getPlane(icao)
      .subscribe((storedData) => {
        this.processData(storedData);
      });
  }

  private processData(storedData: StoredPlane[]) {
    let total = 0;

    let speedDatasets = [];
    let alitudeDatasets = [];
    let datas = [];
    let lastData = null;
    let lastTime = null;
    let flightDatasets = [];

    let stats = new Stats();

    for (let data of storedData) {
      // Stats
      if (data.data.speed && (!stats.topSpeed || data.data.speed > stats.topSpeed)) {
        stats.topSpeed = data.data.speed;
      }
      if (data.data.altitude && (!stats.topAltitude || data.data.altitude > stats.topAltitude)) {
        stats.topAltitude = data.data.altitude;
      }
      if (!stats.firstSighting || (new Date(data.time) < stats.firstSighting)) {
        stats.firstSighting = new Date(data.time);
      }
      if (!stats.lastSighting || (new Date(data.time) > stats.lastSighting)) {
        stats.lastSighting = new Date(data.time);
      }

      // Graphs
      if (lastData !== null) {
        let t1 = Date.parse(lastData.time);
        let t2 = Date.parse(data.time);
        let duration = getNumberOfSecondsBetweenDates(t1, t2);
        if (duration > 60 * 60) {
          // Fake bars for timerange.
          flightDatasets.push(this.getFlightDataset(datas, flightDatasets));
          total += flightDatasets[flightDatasets.length - 1].data[0];
          stats.numberOfOverflies++;

          // Create empty space, move to next flight.
          speedDatasets.push(this.createMainDatasetSpeed());
          alitudeDatasets.push(this.createMainDatasetAltitude());
          datas.push([]);
          lastTime += 50000;

          flightDatasets.push(this.createFlightDataset('rgba(0, 0, 0, 0)', 50000, null));
          total += 50000;
        } else {
          if (lastTime == null) {
            lastTime = Date.parse(data.time);
          } else {
            lastTime = lastTime + (Date.parse(data.time) - Date.parse(lastData.time));
          }
        }
      } else {
        speedDatasets.push(this.createMainDatasetSpeed());
        alitudeDatasets.push(this.createMainDatasetAltitude());
        datas.push([]);
        lastTime = Date.parse(data.time);
      }

      speedDatasets[speedDatasets.length - 1].data.push({
        x: new Date(lastTime),
        y: data.data.speed,
        data: data
      });

      alitudeDatasets[alitudeDatasets.length - 1].data.push({
        x: new Date(lastTime),
        y: data.data.altitude,
        data: data
      });

      datas[datas.length - 1].push(data);

      lastData = data;
    }


    // Fake bars for timerange.
    flightDatasets.push(this.getFlightDataset(datas, flightDatasets));
    total += flightDatasets[flightDatasets.length - 1].data[0];
    stats.numberOfOverflies++;

    datas = datas.concat(datas);

    this.stats = stats;

    let min = speedDatasets[0].data[0].x;
    let lastDataset = speedDatasets[speedDatasets.length - 1];
    let max = lastDataset.data[lastDataset.data.length - 1].x;

    let chartSpeedAltitude = new Chart('chart-speed-altitude', {
      type: 'line',
      data: {
        datasets: speedDatasets.concat(alitudeDatasets)
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Speed and altitude during flights'
        },
        scales: {
          xAxes: [{
            display: false,
            type: 'time',
            time: {
              min: min,
              max: max
            }
          }],
          yAxes: [{
            display: true,
            ticks: {
              min: 0
            },
            position: 'left',
            id: 'y-axis-altitude',
          },
          {
            display: true,
            ticks: {
              min: 0
            },
            gridLines: {
              display: false
            },
            position: 'right',
            id: 'y-axis-speed',
          }]
        },
        tooltips: {
          position: 'nearest',
          mode: 'nearest',
          intersect: false,
          callbacks: {
            title: function(tooltipItem, chart) {
              let t = datas[tooltipItem[0].datasetIndex][tooltipItem[0].index].time;
              return moment(t).format('YYYY-MM-DD HH:mm:ss');
            }
          }
        },
      }
    });

    let chartFlights = new Chart('chart-flights', {
      type: 'horizontalBar',
      data: {
        datasets: flightDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Flights',
          position: 'bottom',
        },
        scales: {
          xAxes: [{
            stacked: true,
            display: false,
            ticks: {
              min: 0,
              max: total
            }
          }],
          yAxes: [{
            display: false,
            stacked: true,
          }]
        },
        tooltips: {
          position: 'nearest',
          mode: 'nearest',
          intersect: true,
          callbacks: {
            title: function(tooltipItem, chart) {
              return flightDatasets[tooltipItem[0].datasetIndex].label;
            },
            label: function(tooltipItem, chart) {
              return flightDatasets[tooltipItem.datasetIndex].label;
            }
          }
        },
        layout: {
          padding: {
            left: 55,
            right: 40,
            top: 0,
            bottom: 0
          }
        }
      }
    });
  }

  private getFlightDataset(datas: any, flightDatasets: any): any {
    // Selected colors.
    let rgbColors = [
      colors.turquoise.rgb(),
      colors.green.rgb(),
      colors.blue.rgb(),
      colors.violet.rgb(),
      colors.yellow.rgb(),
      colors.orange.rgb(),
      colors.red.rgb(),
    ];

    let d = datas[datas.length - 1];
    let dStart = d[0].time;
    let dEnd = d[d.length - 1].time;
    let color = rgbColors[flightDatasets.length % rgbColors.length];
    let value = Date.parse(dEnd) - Date.parse(dStart);
    let flightNumbers = [];
    for (let data of d) {
      if (data.data.flight_number && flightNumbers.indexOf(data.data.flight_number) < 0) {
        flightNumbers.push(data.data.flight_number);
      }
    }
    let label = flightNumbers.join(', ');
    return this.createFlightDataset(color, value, label);
  }

  private createFlightDataset(borderColor: string, value: number, label: string): any {
    return {
      borderColor: borderColor,
      backgroundColor: borderColor,
      fill: true,
      data: [value],
      label: label,
    };
  }

  private createMainDatasetAltitude(): any {
    return this.createMainDataset('Altitude', colors.red.rgb(), 'y-axis-altitude');
  }

  private createMainDatasetSpeed(): any {
    return this.createMainDataset('Speed', colors.violet.rgb(), 'y-axis-speed');
  }

  private createMainDataset(label: string, borderColor: string, yAxisID: string): any {
    return {
      label: label,
      borderColor: borderColor,
      backgroundColor: borderColor,
      fill: false,
      data: [],
      yAxisID: yAxisID,
    };
  }

}
