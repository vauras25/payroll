import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AdminService } from 'src/app/services/admin.service';
import * as Global from 'src/app/globals';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'admin-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./../../companyuser/home/home.component.css'],
})
export class ADHomeComponent implements OnInit {
  financialYearOptions: any[] = [];
  dashboardTotalData:any
  currentYearDateRange = new Date().getFullYear()
  isCreditBarChartLoading:boolean = false;
  isSalesBarChartLoading:boolean = false;
  isPlansBarChartLoading:boolean = false;
  isAcquisitionBarChartLoading:boolean = false;
  isPromoBarChartLoading:boolean = false;
  isCtcBarChartLoading:boolean = false;
  filter?: any;

  constructor(
    private adminService: AdminService,
    private titleService: Title,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,

  ) {    
    this.filter = this.activatedRoute.snapshot.queryParams['filter'];
    this.fetchTotalData();
    this.fetchCreditConsumptionData()
    this.fetchSalesData()
    this.fetchPurchasedPlanData();
    this.fetchMonthlyAcquisitionData()
    this.fetchTopTenUsers()
    this.fetchPromoRedemptionData();
    this.fetchCTCData();
  }

  graphFilterForm:FormGroup = new FormGroup({
    creditDateRange:new FormControl(this.currentYearDateRange),
    salesDateRange:new FormControl(this.currentYearDateRange),
    plansDateRange:new FormControl(this.currentYearDateRange),
    acquisitionDateRange:new FormControl(this.currentYearDateRange),
    promoDateRange:new FormControl(this.currentYearDateRange),
    ctcDateRange:new FormControl(this.currentYearDateRange),
  })

 async ngOnInit() {
    this.titleService.setTitle('Home - ' + Global.AppName);
    this.financialYearOptions = [
      new Date().getFullYear() - 2,
      new Date().getFullYear() - 1,
      new Date().getFullYear(),
    ];
  }

  pieChartType: ChartType = 'doughnut';
  barChartType: ChartType = 'bar';

  pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    aspectRatio: 2,
    plugins: {      
      legend: {
        display: false,
      },
      subtitle: {
        display: true,
      },
    },
  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };
  pieChartData: ChartData<'doughnut', number[], string | string[]> = {
    labels: ['A', 'B', 'C', 'D'],
    datasets: [
      {
        data: [35, 20, 10, 35],
        label: 'used',
        backgroundColor: [
          'rgba(255,255,255,1)',
          'rgba(0,83,146,1)',
          'rgba(0,194,236,1)',
          'rgba(56,183,179,1)',
        ],
        borderWidth: 0.1,
        borderColor: 'blue',
      },
    ],
  };
  creditBarChartData: ChartData<'bar'> = {
    labels: [
      'Jan',
      'Feb',  
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],

    datasets: [
      {
        data: [],
        label: 'Credit Consumption',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
        maxBarThickness:40,
        minBarLength:1
      },
    ],
  };
  salesBarChartData: ChartData<'bar'> = { 
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],

    datasets: [
      {
        data: [],
        label: 'Sales',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
        maxBarThickness:40,
        minBarLength:1
      },
    ],
  };
  plansBarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Purchased Plan',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
        maxBarThickness:40,
        minBarLength:1
      },
    ],
  };
  acquisitionBarChartData: ChartData<'bar'> = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],

    datasets: [
      {
        data: [],
        label: 'Monthly Acquisition',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
        maxBarThickness:40,
        minBarLength:1
      },
    ],
  };
  promoBarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Actual Processed Amount ',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
        maxBarThickness:40,
        minBarLength:1
      },
    ],
  };
  ctcBarChartData: ChartData<'bar'> = {
    labels: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
    datasets: [
      {
        data: [],
        label: 'Actual Processed Amount ',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
        maxBarThickness:40,
        minBarLength:1
      },
    ],
  };

  async fetchTotalData() {
    try {    
      let res = await this.adminService.getDashboardTotalData({}).toPromise()
      if (res.status !== 'success') throw res;
      this.dashboardTotalData = res.data
    } catch (err: any) {
      this.isPlansBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  };

  async fetchCreditConsumptionData() {
    try {
      this.isCreditBarChartLoading = true
      let payload:any =  this.getDateFilterForPayload('creditDateRange') ?? null
      if(!payload) return;    
      this.creditBarChartData.datasets[0].data = [];
      payload.filter_type =  'cradit_consumed';
      payload.date_filter = JSON.stringify({
        from:payload?.startDate,
        to:payload?.endDate
      })
      let res = await this.adminService.getDashboardGraphData(payload).toPromise();
      if (res.status !== 'success') throw res;

      let settledData:any = {
        0:0,
        1:0,
        2:0,
        3:0,
        4:0,
        5:0,
        6:0,
        7:0,
        8:0,
        9:0,
        10:0,
        11:0,
      }
      res?.data?.map((d:any) => {
        settledData[d.wage_month] = d.balance;
      });
      this.creditBarChartData.datasets[0].data = Object.values(settledData);
      this.isCreditBarChartLoading = false
    } catch (err: any) {
      this.isCreditBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else if (err.message){
        this.toastr.error(err.message);
      }else{
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    }
  };

  async fetchSalesData() {
    try {
      this.isSalesBarChartLoading = true
      let payload:any =  this.getDateFilterForPayload('salesDateRange') ?? null
      if(!payload) return;    
      this.salesBarChartData.datasets[0].data = [];
      payload.filter_type =  'cradit_sales';
      payload.date_filter = JSON.stringify({
        from:payload?.startDate,
        to:payload?.endDate
      })
      let res = await this.adminService.getDashboardGraphData(payload).toPromise()
      if (res.status !== 'success') throw res;
      let settledData:any = {
        0:0,
        1:0,
        2:0,
        3:0,
        4:0,
        5:0,
        6:0,
        7:0,
        8:0,
        9:0,
        10:0,
        11:0,
      }
      res?.data?.map((d:any) => {
        settledData[d.wage_month] = d.balance;
      });
      this.salesBarChartData.datasets[0].data = Object.values(settledData);
      this.isSalesBarChartLoading = false
    } catch (err: any) {
      this.isSalesBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else if (err.message){
        this.toastr.error(err.message);
      }else{
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    }
  };

  async fetchMonthlyAcquisitionData() {
    try {
      this.isAcquisitionBarChartLoading = true
      let payload:any =  this.getDateFilterForPayload('acquisitionDateRange') ?? null
      if(!payload) return;    
      this.acquisitionBarChartData.datasets[0].data = [];
      payload.filter_type =  'monthly_acquisition';
      payload.date_filter = JSON.stringify({
        from:payload?.startDate,
        to:payload?.endDate
      })
      let res = await this.adminService.getDashboardGraphData(payload).toPromise()
      if (res.status !== 'success') throw res;
      res?.data?.map((d:any) => {
        this.acquisitionBarChartData.datasets[0].data.push(d.total_company);
      });
      // console.log(this.acquisitionBarChartData);
      this.isAcquisitionBarChartLoading = false
      
    } catch (err: any) {
      this.isAcquisitionBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else if (err.message){
        this.toastr.error(err.message);
      }else{
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    }
  };

  async fetchPurchasedPlanData() {
    try {
      this.isPlansBarChartLoading = true
      if(!this.getDateFilterForPayload('plansDateRange')) return;      
      this.plansBarChartData.datasets[0].data = [];
      let res = await this.adminService.getDashboardPlansData(this.getDateFilterForPayload('plansDateRange')).toPromise()
      if (res.status !== 'success') throw res;
      this.plansBarChartData.labels = [];
      res?.data?.map((d:any) => {
        this.plansBarChartData?.labels?.push(d.plan_name);
        this.plansBarChartData?.datasets[0]?.data?.push(d.count);
      });
      this.isPlansBarChartLoading = false
      
    } catch (err: any) {
      this.isPlansBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  };

  async fetchPromoRedemptionData() {
    try {
      this.isPromoBarChartLoading = true
      if(!this.getDateFilterForPayload('promoDateRange')) return;      
      this.promoBarChartData.datasets[0].data = [];
      let res = await this.adminService.getDashboardPromoData(this.getDateFilterForPayload('promoDateRange')).toPromise()
      if (res.status !== 'success') throw res;
      this.promoBarChartData.labels = [];
      res?.data?.map((d:any) => {
        this.promoBarChartData?.labels?.push(d.coupon_code);
        this.promoBarChartData?.datasets[0]?.data?.push(d.count);
      });
      this.isPromoBarChartLoading = false
      
    } catch (err: any) {
      this.isPromoBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  };

  async fetchCTCData() {
    try {
      this.isCtcBarChartLoading = true
      if(!this.getDateFilterForPayload('ctcDateRange')) return;      
      this.ctcBarChartData.datasets[0].data = [];
      let res = await this.adminService.getDashboardCTCData(this.getDateFilterForPayload('ctcDateRange')).toPromise()
      if (res.status !== 'success') throw res;
      let settledData:any = {
        0:0,
        1:0,
        2:0,
        3:0,
        4:0,
        5:0,
        6:0,
        7:0,
        8:0,
        9:0,
        10:0,
        11:0,
      }
      res?.data?.total_ctc?.map((d:any) => {
        settledData[d._id] = d.total_gross_salary;
      });
      this.ctcBarChartData.datasets[0].data = Object.values(settledData);
      this.isCtcBarChartLoading = false
      
    } catch (err: any) {
      this.isCtcBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  };

  TopTenReseller:any[] = []
  TopTenCorpIds:any[] = []
  async fetchTopTenUsers() {
    try {
      this.isCtcBarChartLoading = true
      let res = await this.adminService.getDashboardTopCreditUsers({}).toPromise()
      if (res.status !== 'success') throw res;
      this.TopTenReseller = res?.data?.top_reseller || []
      this.TopTenCorpIds = res?.data?.top_corp || []
    } catch (err: any) {
      this.isCtcBarChartLoading = false
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  };

  getDateFilterForPayload(key?:any, year?:any){
    let dateRange = year ?? this.graphFilterForm.get(key)?.value
    if(!dateRange) return null;
    let startDate = new Date(+dateRange, 0, 1) ;
    let endDate = new Date(+dateRange, 11, 31);
    
    return {startDate, endDate}
  }
}
