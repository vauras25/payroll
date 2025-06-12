import { Component, OnInit } from '@angular/core';
import { DragToggleService } from 'src/app/services/drag-toggle.service';
import { Title } from '@angular/platform-browser';
import * as Global from 'src/app/globals';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartEvent,
  ChartType,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import {  moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'companyuser-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
 
})
export class CMPHomeComponent implements OnInit {
  curruntYear = moment().year();
  curruntMonth = moment().month() + 1;
  curruntDate = moment().date();
  tab: 'Financial Year' | 'Date Range' = 'Financial Year';
  // dashboardBlocks = [
  //   { type: 'employees', label: 'Active Employees' },
  //   { type: 'staff', label: 'Active Staff' }
  // ];
  

  dashboardSections = [
    { index:0, sectionName:"", visible:true, childern:[{
      index:0,
      sectionName:"",
      visible:true
    }]},
    { index:1, sectionName:"", visible:true, childern:[{
      index:1,
      sectionName:"",
      visible:true
    }]},
    { index:2, sectionName:"", visible:true, childern:[{
      index:2,
      sectionName:"",
      visible:true
    }]},
    { index:3, sectionName:"", visible:true, childern:[{
      index:3,
      sectionName:"",
      visible:true
    }]},
    { index:4, sectionName:"", visible:true, childern:[{
      index:4,
      sectionName:"",
      visible:true
    }]},
    { index:5, sectionName:"", visible:true, childern:[{
      index:5,
      sectionName:"",
      visible:true
    }]},
    { index:6, sectionName:"", visible:true, childern:[{
      index:6,
      sectionName:"",
      visible:true
    }]},
    { index:7, sectionName:"", visible:true, childern:[{
      index:7,
      sectionName:"",
      visible:true
    }]},
    { index:8, sectionName:"", visible:true, childern:[{
      index:8,
      sectionName:"",
      visible:true
    }]},
  ];


    
 
  // Called when sections are reordered
  dropSection(event: CdkDragDrop<any[]>) {
    console.log(event);
    console.log(this.dashboardSections, 'dashboardSections on init');
    moveItemInArray(this.dashboardSections, event.previousIndex, event.currentIndex);
    this.saveDashboardContent();
  }

  saveDashboardContent() {
    const body = {
      content_visible: this.isDragDropEnabled,
      content_credit: this.isDragDropEnabled2,
      datarange: this.isDragDropEnabled3,
      dashboard_sections: this.dashboardSections,
      corporate_id: 'VBL'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
    });
  
    this.http.post('http://127.0.0.1:8080/company/edit_dashboard_content', body, { headers })
      .subscribe({
        next: (response) => console.log('API success:', response),
        error: (error) => console.error('API error:', error)
      });
  }

//     dropSection(event: CdkDragDrop<any[]>): void {
//   if (event.previousIndex !== event.currentIndex) {
//     moveItemInArray(this.dashboardSections, event.previousIndex, event.currentIndex);

//     // Update indexes after move
//     this.dashboardSections.forEach((section, idx) => {
//       section.index = idx;
//       if (section.childern && section.childern.length) {
//         section.childern[0].index = idx;
//       }
//     });

//     console.log(this.dashboardSections, 'Updated section order with index');
//   }
// }


  filterForm: FormGroup = new FormGroup({
    emp_date_filter: new FormControl('', Validators.required),
    challan_date_filter: new FormControl('', Validators.required),
    challan_date_from: new FormControl('', Validators.required),
    challan_date_to: new FormControl('', Validators.required),
    financial_date_filter: new FormControl('', Validators.required),
    ctc_date_filter: new FormControl('', Validators.required),
  });
  public pieChartOptions: ChartConfiguration['options'] = {
    aspectRatio: 2,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
    },
  };
  // public pieChartData: ChartConfiguration['data'] = {
  //   datasets: [
  //     {
  //       data: [ 65, 59, 80, 81, 56, 55, 40 ],
  //       label: 'Series A',
  //       backgroundColor: 'rgba(148,159,177,0.2)',
  //       borderColor: 'rgba(148,159,177,1)',
  //       pointBackgroundColor: 'rgba(148,159,177,1)',
  //       pointBorderColor: '#fff',
  //       pointHoverBackgroundColor: '#fff',
  //       pointHoverBorderColor: 'rgba(148,159,177,0.8)',
  //       fill: 'origin',
  //     },
  //     {
  //       data: [ 28, 48, 40, 19, 86, 27, 90 ],
  //       label: 'Series B',
  //       backgroundColor: 'rgba(77,83,96,0.2)',
  //       borderColor: 'rgba(77,83,96,1)',
  //       pointBackgroundColor: 'rgba(77,83,96,1)',
  //       pointBorderColor: '#fff',
  //       pointHoverBackgroundColor: '#fff',
  //       pointHoverBorderColor: 'rgba(77,83,96,1)',
  //       fill: 'origin',
  //     },
  //     {
  //       data: [ 180, 480, 770, 90, 1000, 270, 400 ],
  //       label: 'Series C',
  //       yAxisID: 'y1',
  //       backgroundColor: 'rgba(255,0,0,0.3)',
  //       borderColor: 'red',
  //       pointBackgroundColor: 'rgba(148,159,177,1)',
  //       pointBorderColor: '#fff',
  //       pointHoverBackgroundColor: '#fff',
  //       pointHoverBorderColor: 'rgba(148,159,177,0.8)',
  //       fill: 'origin',
  //     }
  //   ],
  //   labels: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July' ]
  // };

  isDragDropEnabled = false;
  isDragDropEnabled2 = false;
  isDragDropEnabled3 = false;

// toggleDragDrop() {
//   this.isDragDropEnabled = !this.isDragDropEnabled;
// }


  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['400', '300', '150', '126'],
    datasets: [
      {
        data: [35, 37, 15, 13],
        label: 'Series A',
        backgroundColor: [
          'rgba(22,163,183,1)',
          'rgba(9,82,91,1)',
          ' rgba(34,132,128)',
          'rgba(71,214,231)',
        ],
        borderColor: 'transparent',
      },
    ],
  };
  public pieChartType: ChartType = 'pie';
  // public pieChartPlugins = [ DatalabelsPlugin ];
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [1, 14, 6, 13, 8, 32, 9, 20, 9, 14],
        label: 'Series A',
        backgroundColor: 'rgba(137,137,137,0.1)',
        borderColor: 'rgba(22,163,183,1)',
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'transparent',
        fill: true,
      },
      {
        data: [1, 17, 6, 19, 6, 6, 4, 0, 10, 0],
        label: 'Series B',
        backgroundColor: 'rgba(137,137,137,0.1)',
        borderColor: 'rgba(9,82,91,1)',
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#fff',
        fill: true,
      },
    ],
    labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.3,
      },
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        max: 50,
        grace: 10,
        grid: {
          display: true,
        },
        beginAtZero: true,
        position: 'left',
      },
    },

    plugins: {
      legend: { display: true },
    },
  };
  public lineChartType: ChartType = 'line';
  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartConfiguration['options'] = {
    maintainAspectRatio: false,
    // scales: {
    //   y: {
    //     max: 80,
    //   },
    // },
    plugins: {
      legend: {
        display: true,
      },
    },
  };
  public barChartOptions2: ChartConfiguration['options'] = {
    maintainAspectRatio: false,

    scales: {
      // y: {
      //   max: ,
      // },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
  };
  public barChartData: ChartData<'bar'> = {
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
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
        label: 'Budget',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
      },
      {
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
        label: 'Actual Processed Amount ',
        backgroundColor: '#07515A',
        order: 1,
      },
    ],
  };
  isBarChart2Loading: boolean = false;
  public barChartData2: ChartData<any> = {
    labels: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],

    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        label: 'New Employee',
        backgroundColor: 'rgba(22,163,183)',
        order: 1,
      },
      {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        label: 'Exit Employee',
        backgroundColor: '#07515A',
        order: 1,
      },
      {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        label: 'Active Employee',
        backgroundColor: '#51F1E6',
        borderColor: '#51F1E6',
        order: 0,
        type: 'line',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#51F1E6',
      },
    ],
  };

  financialYearOptions: any[] = [];
 

  constructor(
    private dragToggleService: DragToggleService,

    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router:Router,
    private http: HttpClient
  ) {
    if(!!localStorage.getItem('payment-required'))router.navigateByUrl('company/payment-required');
    this.filterForm
      .get('challan_date_from')
      ?.setValue(moment().format('YYYY-MM'));
    this.filterForm
      .get('challan_date_to')
      ?.setValue(moment().format('YYYY-MM'));
  }

  async ngOnInit() {

console.log(this.dashboardSections, 'dashboardSections on initaman');



    // this.dragToggleService.dragEnabled$.subscribe(val => {
    //   this.isDragDropEnabled = val;
    // });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // Add Authorization token if required
      // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
    });


    this.http.post<any>('http://127.0.0.1:8080/company/get_dashboard_content?corporate_id=VBL', { headers })
    .subscribe({
      next: (res) => {
        this.isDragDropEnabled = res.content_visible;
        this.isDragDropEnabled2 = res.content_credit;
        this.isDragDropEnabled3 = res.datarange;
        this.dragToggleService.setDragEnabled(this.isDragDropEnabled);
        // this.dashboardSections = res.dashboard_sections || [];
        this.dashboardSections = (res.dashboard_sections && res.dashboard_sections.length > 0)
        ? res.dashboard_sections
        : 
        [
            { index: 0, sectionName: "", visible: true, childern: [{ index: 0, sectionName: "", visible: true }] },
            { index: 1, sectionName: "", visible: true, childern: [{ index: 1, sectionName: "", visible: true }] },
            { index: 2, sectionName: "", visible: true, childern: [{ index: 2, sectionName: "", visible: true }] },
            { index: 3, sectionName: "", visible: true, childern: [{ index: 3, sectionName: "", visible: true }] },
            { index: 4, sectionName: "", visible: true, childern: [{ index: 4, sectionName: "", visible: true }] },
            { index: 5, sectionName: "", visible: true, childern: [{ index: 5, sectionName: "", visible: true }] },
            { index: 6, sectionName: "", visible: true, childern: [{ index: 6, sectionName: "", visible: true }] },
            { index: 7, sectionName: "", visible: true, childern: [{ index: 7, sectionName: "", visible: true }] },
            { index: 8, sectionName: "", visible: true, childern: [{ index: 8, sectionName: "", visible: true }] },
          ];

      },
      error: (err) => {
        console.error('Failed to fetch dashboard content:', err);
      }
    });


    this.titleService.setTitle('Home - ' + Global.AppName);
    let years = [
      new Date().getFullYear() - 2,
      new Date().getFullYear() - 1,
      new Date().getFullYear(),
      new Date().getFullYear() + 1,
    ];
    for (let i = 0; i < years.length - 1; i++) {
      let combinedYear = {label:`${years[i]}-${years[i + 1].toString().slice(-2)}`,value:`${years[i]}-${years[i + 1].toString()}`};
      this.financialYearOptions.push(combinedYear);
    }
   

    this.filterForm.patchValue({
      emp_date_filter: this.financialYearOptions[2]?.value,
      challan_date_filter: this.financialYearOptions[2]?.value,
      financial_date_filter: this.financialYearOptions[2]?.value,
      ctc_date_filter: this.financialYearOptions[2]?.value,
    });
    
    await this.getDashboardTotalData();
    await this.getDashboardChartData(true);
    await this.getDashboardFinancialData();
    await this.getDashboardCTCData();
  }

  navigateToHomeEdit() {
    this.router.navigate(['/home-edit']);  // Navigate to the "home-edit" route
  }

  // onDrop(event: CdkDragDrop<any>) {
  //   console.log('Item dropped:', event);
  //   moveItemInArray(this.dashboardBlocks, event.previousIndex, event.currentIndex);
  //   // Add logic to reorder or handle the drop
  // }

  dashboardTotalData: any;
  dashboardChartData: any;
  dashboardFinancialData: any;
  dashboardCTCData: any;

  async getDashboardTotalData() {
    try {
      let res = await this.companyuserService
        .getDashboardTotalData({})
        .toPromise();
      if (res.status !== 'success') throw res;

      res.dashboard_data.active_employees =
        res?.dashboard_data?.active_employees?.sort((a: any, b: any) =>
          a.created_at > b.created_at ? -1 : 1
        );
      res.dashboard_data.inactive_employees =
        res?.dashboard_data?.inactive_employees?.sort((a: any, b: any) =>
          a.created_at > b.created_at ? -1 : 1
        );
      this.dashboardTotalData = res.dashboard_data;
    } catch (err) {}
  }

  async getDashboardChartData(isEmployeeChart: boolean = false) {
    try {
      if (isEmployeeChart) {
        this.barChartData2.datasets[0].data = [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];
        this.barChartData2.datasets[1].data = [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];
        this.barChartData2.datasets[2].data = [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];
        this.isBarChart2Loading = true;
      }

      let emp_keys: any[] = this.filterForm.value.emp_date_filter.split('-');
      let challan_keys = this.filterForm.value.challan_date_filter.split('-');

      if (this.tab == 'Date Range') {
        challan_keys = [
          this.filterForm.value.challan_date_from,
          this.filterForm.value.challan_date_to,
        ];
      }

      let payload = {
        challan_filter_type: this.tab.split(' ').join('_').toLowerCase(),
        emp_date_filter: JSON.stringify({
          from: emp_keys[0],
          to: emp_keys[1],
        }),
        challan_date_filter: JSON.stringify({
          from: challan_keys[0],
          to: challan_keys[1],
        }),
        financial_year_end: JSON.parse(
          localStorage.getItem('payroll-companyuser-details') as any
        ).preference_settings?.financial_year_end,
      };
      let res = await this.companyuserService
        .getDashboardChartData(payload)
        .toPromise();
      if (res.status !== 'success') throw res;

      res.dashboard_data.pf_precent =
        ((res?.dashboard_data?.pf_on_time_payments || 0) /
          (res?.dashboard_data?.total_challans_count || 0)) *
          100 || 0;
      res.dashboard_data.esic_precent =
        ((res?.dashboard_data?.esic_on_time_payments || 0) /
          res?.dashboard_data?.total_challans_count || 0) * 100 || 0;
      this.dashboardChartData = res.dashboard_data;
      let employees = res.dashboard_data?.employees;
      // this.barChartData2.datasets = [
      //   {
      //     data: [0,0,0,0,0,0,0,0,0,0,0,0],
      //     label: 'New Employee',
      //     backgroundColor: 'rgba(22,163,183)',
      //     order: 1,
      //   },
      //   {
      //     data: [0,0,0,0,0,0,0,0,0,0,0,0],
      //     label: 'Exit Employee',
      //     backgroundColor: '#07515A',
      //     order: 1,
      //   },
      //   {
      //     data: [0,0,0,0,0,0,0,0,0,0,0,0],
      //     label: 'Active Employee',
      //     backgroundColor: '#51F1E6',
      //     borderColor: '#51F1E6',
      //     order: 0,
      //     type: 'line',
      //     pointBackgroundColor: '#fff',
      //     pointBorderColor: '#51F1E6',
      //   },
      // ];
      this.barChartData2.datasets[0].data = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ];
      this.barChartData2.datasets[1].data = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ];
      this.barChartData2.datasets[2].data = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ];
      if (employees?.length) {
        this.barChartData2.datasets[0].data = [];
        this.barChartData2.datasets[1].data = [];
        this.barChartData2.datasets[2].data = [];
        this.barChartData2.labels = [];

        for (let i = 0; i < employees.length; i++) {
          const employee = employees[i];
          this.barChartData2.labels.push(
            Global.monthMaster.find(
              (month) => month.index == employee.wage_month
            )?.sf
          );
          this.barChartData2?.datasets[0]?.data?.push(
            employee?.pending_employees?.length
          );
          this.barChartData2?.datasets[1]?.data?.push(
            employee?.inactive_employees?.length
          );
          this.barChartData2?.datasets[2]?.data?.push(
            employee?.active_employees?.length
          );
        }
      }
      this.isBarChart2Loading = false;

      //  this.barChartData2.datasets = [
      //   {
      //     data: [
      //       this.dashboardChartData?.employees_data?.month_1?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_2?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_3?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_4?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_5?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_6?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_7?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_8?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_9?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_10?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_11?.pending_emp,
      //       this.dashboardChartData?.employees_data?.month_12?.pending_emp,
      //     ],
      //     label: 'New Employee',
      //     backgroundColor: 'rgba(22,163,183)',
      //     order: 1,
      //   },
      //   {
      //     data: [
      //       this.dashboardChartData?.employees_data?.month_1?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_2?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_3?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_4?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_5?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_6?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_7?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_8?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_9?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_10?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_11?.inactive_emp,
      //       this.dashboardChartData?.employees_data?.month_12?.inactive_emp,
      //     ],
      //     label: 'Exit Employee',
      //     backgroundColor: '#07515A',
      //     order: 1,
      //   },
      //   {
      //     data: [
      //       this.dashboardChartData?.employees_data?.month_1?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_2?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_3?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_4?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_5?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_6?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_7?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_8?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_9?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_10?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_11?.active_emp,
      //       this.dashboardChartData?.employees_data?.month_12?.active_emp,
      //     ],
      //     label: 'Active Employee',
      //     backgroundColor: '#51F1E6',
      //     borderColor: '#51F1E6',
      //     order: 0,
      //     type: 'line',
      //     pointBackgroundColor: '#fff',
      //     pointBorderColor: '#51F1E6',
      //   },
      // ];
    } catch (err: any) {
      this.toastr.error(err.message || err);
    }
  }

  async getDashboardFinancialData() {
    try {
      let keys = this.filterForm.value.financial_date_filter.split('-');

      let payload = {
        financial_date_filter: JSON.stringify({
          from: keys[0],
          to: keys[1],
        }),

        financial_year_end: JSON.parse(
          localStorage.getItem('payroll-companyuser-details') as any
        ).preference_settings?.financial_year_end,
      };
      let res = await this.companyuserService
        .getDashboardFinancialData(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.dashboardFinancialData = res.dashboard_data;
      let months = this.getCurrFinancialYearMonths();
      this.dashboardFinancialData.items = [];
      months.forEach((month) => {
        this.dashboardFinancialData.items.push({
          month: month?.description,
          challan_data: res.dashboard_data.challans.find(
            (challan: any) => +challan._id == month?.index
          ),
          hold_salary: res.dashboard_data.hold_salary_emps.find(
            (emp: any) => +emp._id == month?.index
          ),
          unpaid_salary: res.dashboard_data.bank_instructions.find(
            (bank_instruction: any) => +bank_instruction._id == month?.index
          ),
        });
      });
      this.dashboardFinancialData.total_fy_pf_amount_1 =
        this.dashboardFinancialData.items
          .slice(0, 6)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.challan_data?.total_pf_amount || 0)
          );
      this.dashboardFinancialData.total_fy_esic_amount_1 =
        this.dashboardFinancialData.items
          .slice(0, 6)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.challan_data?.total_esic_amount || 0)
          );
      this.dashboardFinancialData.total_fy_hold_salary_1 =
        this.dashboardFinancialData.items
          .slice(0, 6)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.hold_salary?.total_gross_salary || 0)
          );
      this.dashboardFinancialData.total_fy_pending_salary_1 =
        this.dashboardFinancialData.items
          .slice(0, 6)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.unpaid_salary?.total_gross_earning || 0)
          );
      this.dashboardFinancialData.total_fy_pf_amount_2 =
        this.dashboardFinancialData.items
          .slice(6, 12)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.challan_data?.total_pf_amount || 0)
          );
      this.dashboardFinancialData.total_fy_esic_amount_2 =
        this.dashboardFinancialData.items
          .slice(6, 12)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.challan_data?.total_esic_amount || 0)
          );
      this.dashboardFinancialData.total_fy_hold_salary_2 =
        this.dashboardFinancialData.items
          .slice(6, 12)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.hold_salary?.total_gross_salary || 0)
          );
      this.dashboardFinancialData.total_fy_pending_salary_2 =
        this.dashboardFinancialData.items
          .slice(6, 12)
          .reduce(
            (t_val: number, c_val: any) =>
              (+t_val || 0) + (+c_val?.unpaid_salary?.total_gross_earning || 0)
          );
    } catch (err: any) {
      this.toastr.error(err.message || err);
    }
  }

  isCtcGraphLoading: boolean = false;
  async getDashboardCTCData() {
    try {
      this.barChartData.datasets[0].data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.barChartData.datasets[1].data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.isCtcGraphLoading = true;
      let keys = this.filterForm.value.ctc_date_filter.split('-');

      let payload = {
        ctc_date_filter: JSON.stringify({
          from: keys[0],
          to: keys[1],
        }),

        financial_year_end: JSON.parse(
          localStorage.getItem('payroll-companyuser-details') || '{}'
        )?.preference_settings?.financial_year_end,
      };
      let res = await this.companyuserService
        .getDashboardCTCData(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.dashboardCTCData = res.dashboard_data;
      let months = this.getCurrFinancialYearMonths();
      let items: any = [];
      months.forEach((month) => {
        items.push({
          month: month,
          logs: res.dashboard_data.companies_monthly_data_logs.find(
            (challan: any) => +challan._id == month?.index
          ),
          report: res.dashboard_data.employee_monthly_reports.find(
            (emp: any) => +emp._id == month?.index
          ),
        });
      });
      this.barChartData.datasets[0].data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.barChartData.datasets[1].data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      if (items?.length) {
        this.barChartData.datasets[0].data = [];
        this.barChartData.datasets[1].data = [];
        this.barChartData.labels = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          this.barChartData?.labels?.push(item?.month?.sf);
          this.barChartData?.datasets[0]?.data?.push(item?.logs?.total_budget);
          this.barChartData?.datasets[1]?.data?.push(
            item?.report?.total_gross_salary
          );
        }
      }
      this.isCtcGraphLoading = false;
    } catch (err: any) {
      this.toastr.error(err.message || err);
    }
  }

  getDateFromToMaxValidation(dateFrom: any) {
    if (dateFrom) {
      if (
        dateFrom?.split('-')[0] == new Date().getFullYear() &&
        dateFrom?.split('-')[1] == '0' + (new Date().getMonth() + 1)
      ) {
        return;
      } else if (dateFrom?.split('-')[0] == new Date().getFullYear()) {
        let year = dateFrom?.split('-')[0];
        return year + '-0' + this.curruntMonth + '-' + this.curruntDate;
      } else if (
        dateFrom?.split('-')[0] == new Date().getFullYear() - 1 &&
        dateFrom?.split('-')[1] > '0' + (new Date().getMonth() + 1)
      ) {
        let year = dateFrom?.split('-')[0];

        return +year + 1 + '-0' + this.curruntMonth + '-' + this.curruntDate;
      }
      let year = dateFrom?.split('-')[0];
      let month = dateFrom?.split('-')[1];
      let date = dateFrom?.split('-')[2];
      return +year + 1 + '-' + month + '-' + date;
    }
    return;
  }

  getCurrFinancialYearMonths() {
    let financialMonths = [];
    let financial_year_end = new Date(
      JSON.parse(
        localStorage.getItem('payroll-companyuser-details') as any
      ).preference_settings?.financial_year_end
    );

    for (let i = 0; i < 12; i++) {
      financialMonths.push(
        Global.monthMaster.find(
          (month) =>
            month.index ==
            new Date(
              financial_year_end.getFullYear(),
              financial_year_end.getMonth() + i,
              +1
            ).getMonth()
        )
      );
    }
    return financialMonths;
  }
}
