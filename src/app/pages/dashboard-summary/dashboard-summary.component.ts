import { Component, ChangeDetectorRef, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { DashboardReport } from '../../models/dashboard-report';
import { finalize } from 'rxjs/operators';
import { NgApexchartsModule } from 'ng-apexcharts';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

export type MonthlySalesChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  stroke: ApexStroke;
  colors: string[];
};

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard-summary.component.html',
  styleUrl: './dashboard-summary.component.scss',
})
export class DashboardSummaryComponent implements OnInit {
  report: DashboardReport | null = null;
  errorMessage = '';
  readonly summaryMonths = 6;
  readonly topLimit = 5;
  stores: { _id: string; name?: string | null }[] | null = null;
  selectedStoreId = '';
  chartReady = false;
  isReportLoading = false;
  chartOptions: MonthlySalesChartOptions = {
    series: [{ name: 'Sales', data: [] }],
    chart: {
      type: 'bar',
      height: 320,
      toolbar: { show: false },
      animations: { enabled: true, speed: 400 },
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: '60%',
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 0.92,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['#1d4ed8'],
    },
    colors: ['#2563eb'],
    xaxis: {
      categories: [],
      labels: {
        rotate: -35,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => `$${Number(value ?? 0).toLocaleString('en-US')}`,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `$${Number(value ?? 0).toLocaleString('en-US')}`,
      },
    },
  };

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStores();
      this.loadReport();
    }
  }

  loadReport(): void {
    this.errorMessage = '';
    this.chartReady = false;
    this.isReportLoading = true;
    this.api
      .getDashboardReport({
        months: this.summaryMonths,
        limit: this.topLimit,
        storeId: this.selectedStoreId || undefined,
      })
      .pipe(
        finalize(() => {
          this.isReportLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (data) => {
          this.report = data;
          this.updateChart();
          this.cdr.markForCheck();
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.errorMessage = msg ? String(msg) : 'Failed to load dashboard metrics.';
          this.chartReady = false;
          this.cdr.markForCheck();
        },
      });
  }

  onStoreChange(storeId: string): void {
    this.selectedStoreId = storeId;
    this.loadReport();
  }

  private loadStores(): void {
    this.api.getStores().subscribe({
      next: (stores) => {
        setTimeout(() => {
          this.stores = stores ?? [];
          this.cdr.markForCheck();
        });
      },
    });
  }

  monthLabel(year: number, month: number): string {
    if (!year || !month) return '';
    return new Date(year, month - 1).toLocaleString('en-US', { month: 'short' });
  }

  private updateChart(): void {
    if (!this.report || !this.report.monthlySales.length) {
      this.chartReady = false;
      return;
    }

    const labels = this.report.monthlySales.map((month) => this.monthLabel(month.year, month.month));
    const totals = this.report.monthlySales.map((month) => month.totalSales);

    this.chartOptions = {
      ...this.chartOptions,
      series: [{ name: 'Sales', data: totals }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: labels,
      },
      tooltip: {
        ...this.chartOptions.tooltip,
        y: {
          formatter: (value) => `$${Number(value ?? 0).toLocaleString('en-US')}`,
        },
      },
    };
    this.chartReady = true;
  }

}
