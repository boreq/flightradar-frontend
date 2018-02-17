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

  private drawCharts(stats: Stats) {
    let labels = [];

    let dataPointsDataset = {
      label: "Number of data points",
      borderColor: 'rgb(231, 76, 60)',
      backgroundColor: 'rgb(231, 76, 60)',
      fill: false,
      data: [],
    };

    let planesDataset = {
      label: "Number of unique planes",
      borderColor: 'rgb(52, 152, 219)',
      backgroundColor: 'rgb(52, 152, 219)',
      fill: false,
      data: [],
    };

    let flightsDataset = {
      label: "Number of unique flights",
      borderColor: 'rgb(155, 89, 182)',
      backgroundColor: 'rgb(155, 89, 182)',
      fill: false,
      data: [],
    };

    let medianRangeDataset = {
      label: "Median range",
      borderColor: 'rgb(155, 89, 182)',
      backgroundColor: 'rgb(155, 89, 182)',
      fill: false,
      data: [],
    };

    let maxRangeDataset = {
      label: "Max range",
      borderColor: 'rgb(231, 76, 60)',
      backgroundColor: 'rgb(231, 76, 60)',
      fill: false,
      data: [],
    };

    let averageRangeDataset = {
      label: "Average range",
      borderColor: 'rgb(46, 204, 113)',
      backgroundColor: 'rgb(46, 204, 113)',
      fill: false,
      data: [],
    };

    let altitudeCrossSectionDatasets = [];
    let maxAltitudeCrossSectionKey = 0;

    for (let s of stats.stats) {
      labels.push(s.date);

      dataPointsDataset.data.push(s.data.data_points_number);
      planesDataset.data.push(s.data.planes_number);
      flightsDataset.data.push(s.data.flights_number);
      medianRangeDataset.data.push(this.round(s.data.median_distance, 2));
      maxRangeDataset.data.push(this.round(s.data.max_distance, 2));
      averageRangeDataset.data.push(this.round(s.data.average_distance, 2));

      // Find out how many cross section datasets are needed
      for (let k in s.data.data_points_altitude_cross_section) {
        let numK = parseInt(k);
        if (numK > maxAltitudeCrossSectionKey) {
          maxAltitudeCrossSectionKey = numK;
        }
      }
    }

    let colors = [
      'rgb(26, 188, 156)',
      'rgb(52, 152, 219)',
      'rgb(46, 204, 113)',
      'rgb(155, 89, 182)',
      'rgb(52, 73, 94)',
      'rgb(241, 196, 15)',
      'rgb(230, 126, 34)',
      'rgb(231, 76, 60)',
    ];

    // Create all needed cross section datasets
    for (let i = 0; i <= maxAltitudeCrossSectionKey + 1; i++) {
      let text = 'Unknown';
      if (i != 0) {
        let min = (i - 1) * stats.altitude_cross_section_step;
        let max = min + stats.altitude_cross_section_step;
        text = min.toString() + ' - ' + max.toString();
      }
      let dataset = {
        label: text,
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length],
        fill: false,
        data: [],
      };
      altitudeCrossSectionDatasets.push(dataset);
    }

    // Fill the cross section datasets
    for (let s of stats.stats) {
      for (let k = -1; k <= maxAltitudeCrossSectionKey; k++) {
        if (s.data.data_points_altitude_cross_section[k]) {
          altitudeCrossSectionDatasets[k + 1].data.push(s.data.data_points_altitude_cross_section[k]);
        } else {
          altitudeCrossSectionDatasets[k + 1].data.push(0);
        }
      }
    }

    let chartDataPoints = new Chart('chart-data-points', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [dataPointsDataset]
      },
      options: this.getChartOptions('Number of collected data points', false)
    });

    let chartPlanes = new Chart('chart-planes', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [planesDataset, flightsDataset]
      },
      options: this.getChartOptions('Unique planes and flights', true)
    });

    let chartRange = new Chart('chart-range', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [medianRangeDataset, maxRangeDataset, averageRangeDataset]
      },
      options: this.getChartOptions('Detection range grouped by bearing from the base station', true)
    });

    let chartAltitudeCrossSectionOptions = this.getChartOptions('Number of collected data points - altitude cross-section', true);
    chartAltitudeCrossSectionOptions.scales = {
      xAxes: [{
        stacked: true,
        display: false
      }],
      yAxes: [{
        stacked: true
      }]
    };
    chartAltitudeCrossSectionOptions.tooltips = {
      position: 'nearest',
      mode: 'nearest',
      intersect: true
    };
    let chartAltitudeCrossSection = new Chart('chart-altitude-cross-section', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: altitudeCrossSectionDatasets
      },
      options: chartAltitudeCrossSectionOptions
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
