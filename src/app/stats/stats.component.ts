import { Component, OnInit } from '@angular/core';

import { PlaneService } from '../plane.service';
import { Stats } from '../plane';

declare var Chart: any;

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {

  constructor(private planeService: PlaneService) { }

  ngOnInit() {
    this.planeService.getStats()
      .subscribe((stats) => this.drawCharts(stats));
  }

  private drawCharts(stats: Stats[]) {
    let labels = [];

    let dataPointsDataset = {
      label: "Number of data points",
      borderColor: 'rgb(231, 76, 60)',
      backgroundColor: 'rgba(231, 76, 60, 0.5)',
      fill: false,
      data: [],
    };

    let planesDataset = {
      label: "Number of unique planes",
      borderColor: 'rgb(52, 152, 219)',
      backgroundColor: 'rgba(52, 152, 219, 0.5)',
      fill: false,
      data: [],
    };

    let flightsDataset = {
      label: "Number of unique flights",
      borderColor: 'rgb(155, 89, 182)',
      backgroundColor: 'rgba(155, 89, 182, 0.5)',
      fill: false,
      data: [],
    };

    for (let s of stats) {
      labels.push(s.date);
      dataPointsDataset.data.push(s.data.data_points_number);
      planesDataset.data.push(s.data.planes_number);
      flightsDataset.data.push(s.data.flights_number);
    }

    let chartDataPoints = new Chart('chart-data-points', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [dataPointsDataset]
      },
      options: this.getChartOptions('Unique data points')
    });

    let chartPlanes = new Chart('chart-planes', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [planesDataset]
      },
      options: this.getChartOptions('Unique planes')
    });

    let chartFlights = new Chart('chart-flights', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [flightsDataset]
      },
      options: this.getChartOptions('Unique flights')
    });
  }

  private getChartOptions(title: string): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: title
      },
      scales: {
        xAxes: [{
          display: false
        }],
        yAxes: [{
          display: true
        }]
      }
    };
  }

}
