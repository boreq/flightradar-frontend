import { Component, OnInit, Input } from '@angular/core';

import { StoredPlane, Plane } from '../../plane';
import { getNumberOfSecondsBetweenDates } from '../../utils';

class PreviouslySeen {
  constructor(public daysAgo: number, public flights: string[]) {}
}

declare var Chart: any;

const numberOfMinutesOnTheYAxis = 10;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  @Input() plane: Plane;
  previouslySeen: PreviouslySeen[];

  private altitudeDataset: any;
  private speedDataset: any;
  private chart: any;

  constructor() { }

  ngOnInit() {
  }

  private initCharts() {
    if (this.chart) {
      return;
    }

    this.altitudeDataset = {
      label: "Altitude",
      borderColor: 'rgb(231, 76, 60)',
      backgroundColor: 'rgb(231, 76, 60)',
      fill: false,
      data: [],
      pointRadius: 0,
      yAxisID: 'y-axis-altitude',
    };

    this.speedDataset = {
      label: "Speed",
      borderColor: 'rgb(52, 152, 219)',
      backgroundColor: 'rgb(52, 152, 219)',
      fill: false,
      data: [],
      pointRadius: 0,
      yAxisID: 'y-axis-speed',
    };

    this.chart = new Chart('chart-speed-altitude', {
      type: 'line',
      data: {
        datasets: [this.altitudeDataset, this.speedDataset]
      },
      options: this.getChartOptions('Altitude and speed')
    });
  }

  @Input() set planeHistory(value: StoredPlane[]) {
    if (value === null) {
      this.previouslySeen == null;
      return;
    }

    this.initCharts();

    // Generate the previously seen list.
    let flights = {};
    for (let data of value) {
        if (data.data.flight_number) {
            let daysPassed = Math.floor(getNumberOfSecondsBetweenDates(new Date(), Date.parse(data.time)) / (60 * 60 * 24));
            if (daysPassed in flights) {
                if (flights[daysPassed].indexOf(data.data.flight_number) < 0) {
                  flights[daysPassed].push(data.data.flight_number);
                }
            } else {
              flights[daysPassed] = [data.data.flight_number];
            }
        }
    }

    let keys = [];
    for (let key in flights) {
      keys.push(parseInt(key));
    }
    keys = keys.sort((a, b) => a - b);

    let previouslySeen = [];
    for (let key of keys) {
      previouslySeen.push(new PreviouslySeen(parseInt(key), flights[key]));
    }

    this.previouslySeen = previouslySeen;

    // Generate data for the charts.
    this.speedDataset.data.length = 0;
    this.altitudeDataset.data.length = 0;
    this.chart.options.scales.xAxes[0].time.max = new Date();
    this.chart.options.scales.xAxes[0].time.min = new Date((new Date()).getTime() - numberOfMinutesOnTheYAxis * 60 * 1000);

    for (let data of value) {
      let t = getNumberOfSecondsBetweenDates(Date.parse(data.time), new Date());
      if (t > numberOfMinutesOnTheYAxis * 60) {
        continue;
      }

      if (data.data.altitude) {
        this.altitudeDataset.data.push({
          x: new Date(data.time),
          y: data.data.altitude
        });
      }

      if (data.data.speed) {
        this.speedDataset.data.push({
          x: new Date(data.time),
          y: data.data.speed
        });
      }
    }

    this.chart.update();
  }

  private getChartOptions(title: string): any {
    return {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: true
      },
      title: {
        display: false,
        text: title
      },
      scales: {
        xAxes: [{
          display: false,
          type: 'time',
          time: {
            max: new Date(),
            min: new Date((new Date()).getTime() - numberOfMinutesOnTheYAxis * 60 * 1000),
            tooltipFormat: 'll HH:mm:ss'
          }
        }],
        yAxes: [{
          display: true,
          ticks: {
            display: false,
            min: 0
          },
          gridLines: {
            tickMarkLength: 0
          },
          position: "left",
          id: "y-axis-altitude",
        },
        {
          display: true,
          ticks: {
            display: false,
            min: 0
          },
          gridLines: {
            display: false
          },
          position: "right",
          id: "y-axis-speed",
        }]
      },
      tooltips: {
        position: 'nearest',
        mode: 'index',
        intersect: true
      }
    };
  }

}
