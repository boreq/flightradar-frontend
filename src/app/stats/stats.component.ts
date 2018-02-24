import { Component, OnInit } from '@angular/core';

import { PlaneService } from '../plane.service';
import { Stats } from '../plane';
import { colors } from '../colors';

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
      label: 'Number of collected data points',
      borderColor: colors.red.rgb(),
      backgroundColor: colors.red.rgb(),
      fill: false,
      data: [],
    };

    let planesDataset = {
      label: 'Number of unique planes',
      borderColor: colors.blue.rgb(),
      backgroundColor: colors.blue.rgb(),
      fill: false,
      data: [],
    };

    let flightsDataset = {
      label: 'Number of unique flights',
      borderColor: colors.violet.rgb(),
      backgroundColor: colors.violet.rgb(),
      fill: false,
      data: [],
    };

    let medianRangeDataset = {
      label: 'Median range',
      borderColor: colors.violet.rgb(),
      backgroundColor: colors.violet.rgb(),
      fill: false,
      data: [],
    };

    let maxRangeDataset = {
      label: 'Max range',
      borderColor: colors.red.rgb(),
      backgroundColor: colors.red.rgb(),
      fill: false,
      data: [],
    };

    let averageRangeDataset = {
      label: 'Average range',
      borderColor: colors.green.rgb(),
      backgroundColor: colors.green.rgb(),
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

    let colorsArray = [
      colors.turquoise.rgb(),
      colors.blue.rgb(),
      colors.green.rgb(),
      colors.violet.rgb(),
      colors.asphalt.rgb(),
      colors.yellow.rgb(),
      colors.orange.rgb(),
      colors.red.rgb(),
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
        borderColor: colorsArray[i % colorsArray.length],
        backgroundColor: colorsArray[i % colorsArray.length],
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
    chartAltitudeCrossSectionOptions.scales.xAxes[0].stacked = true;
    chartAltitudeCrossSectionOptions.scales.yAxes[0].stacked = true;
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
