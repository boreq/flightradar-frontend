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

  private round(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)
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

    let medianRangeDataset = {
      label: "Median range",
      borderColor: 'rgb(155, 89, 182)',
      backgroundColor: 'rgba(155, 89, 182, 0.5)',
      fill: false,
      data: [],
    };

    let maxRangeDataset = {
      label: "Max range",
      borderColor: 'rgb(231, 76, 60)',
      backgroundColor: 'rgba(231, 76, 60, 0.5)',
      fill: false,
      data: [],
    };

    let averageRangeDataset = {
      label: "Average range",
      borderColor: 'rgb(46, 204, 113)',
      backgroundColor: 'rgba(46, 204, 113, 0.5)',
      fill: false,
      data: [],
    };

    for (let s of stats) {
      labels.push(s.date);
      dataPointsDataset.data.push(s.data.data_points_number);
      planesDataset.data.push(s.data.planes_number);
      flightsDataset.data.push(s.data.flights_number);
      medianRangeDataset.data.push(this.round(s.data.median_distance, 2));
      maxRangeDataset.data.push(this.round(s.data.max_distance, 2));
      averageRangeDataset.data.push(this.round(s.data.average_distance, 2));
    }

    let chartDataPoints = new Chart('chart-data-points', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [dataPointsDataset]
      },
      options: this.getChartOptions('Unique data points', false)
    });

    let chartPlanes = new Chart('chart-planes', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [planesDataset]
      },
      options: this.getChartOptions('Unique planes', false)
    });

    let chartFlights = new Chart('chart-flights', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [flightsDataset]
      },
      options: this.getChartOptions('Unique flights', false)
    });

   let chartRange = new Chart('chart-range', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [medianRangeDataset, maxRangeDataset, averageRangeDataset]
      },
      options: this.getChartOptions('Range', true)
    });

  }

  private getChartOptions(title: string, legend: boolean): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: legend
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
      },
      tooltips: {
		position: 'nearest',
        mode: 'index',
        intersect: true
	  }
    };
  }

}
