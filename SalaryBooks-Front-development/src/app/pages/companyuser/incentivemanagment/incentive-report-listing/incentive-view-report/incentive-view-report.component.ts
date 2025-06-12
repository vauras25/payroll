import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';


@Component({
  selector: 'app-incentive-view-report',
  templateUrl: './incentive-view-report.component.html',
  styleUrls: ['./incentive-view-report.component.css'],
})
export class CMPIncentiveViewReportComponent implements OnInit {
  generatedReportTemplate: any[] = [];
  employees: any[] = [];
  totalIncentiveReportCount: number = 0;
  employeeFilter: any = null;
  row_checked_all: Boolean;
  checked_row_ids: any[];
  unchecked_row_ids: any[];
  tableHeadings: any[] = [];
  personal_details: any[] = [];
  other_details: any[] = [];
  other_details_series: any[] = [];
  wages_series: any[] = [];
  constructor(private companyuserService: CompanyuserService) {
    this.companyuserService.exportedPrintDocs.subscribe((d) => {
      this.generatedReportTemplate = d.generatedReportTemplate;
      this.employees = d.employees;
      this.employeeFilter = d.employeeFilter;
      this.row_checked_all = d.row_checked_all;
      this.checked_row_ids = d.checked_row_ids;
      this.unchecked_row_ids = d.unchecked_row_ids;
    });
    // console.log(this.employeeFilter);

    // {wage_month_from: 0, wage_year_from: 2024, wage_month_to: 1, wage_month_towage_month_to: 2024,

    // this.personal_details = this.generatedReportTemplate[0]?.fields?.filter((field:any) => field.field_type == "personal_detail")
    // this.other_details = this.generatedReportTemplate[0]?.fields?.filter((field:any) => field.field_type == "other_detail")
    // this.other_details_series = new Array(this.wages_series?.length).fill(this.other_details)

    // console.log(this.other_details_series)

    // this.generatedReportTemplate = this.generatedReportTemplate.map(
    //   (d: any) => {
    //     let data = new Array(this.totalIncentiveReportCount).fill({
    //       personal_details: d?.fields?.filter(
    //         (f: any) => f.field_type == 'personal_detail'
    //       ),
    //       other_details: {
    //         sub_slug: 'wage',
    //         fields: d?.fields?.filter(
    //           (f: any) => f.field_type == 'other_detail'
    //         ),
    //       },
    //     })

    //     let obj = {
    //       module_slug: d.module_slug,
    //       module_title: d.module_title,
    //       fields: data
    //   }
    //   return obj

    // })
  }

  startMonth:any;
  endMonth:any;
  // diffDateArr:number[]=[]
  ngOnInit() {
    this.startMonth = moment({
      month: this.employeeFilter.wage_month_from,
      year: this.employeeFilter.wage_year_from,
    });
    this.endMonth = moment({
      month: this.employeeFilter.wage_month_to,
      year: this.employeeFilter.wage_year_to,
    });
    // console.log(this.startMonth.month(), this.endMonth.month());
    
    // for (let index = 0; index < this.endMonth.diff(this.startMonth, 'months'); index++) {
    //       this.diffDateArr.push(index)
    // }
    this.wages_series = new Array(this.endMonth.diff(this.startMonth, 'months') + 1).fill(
      'Wage Month'
    );

    this.generatedReportTemplate[0]?.fields?.forEach((field: any) => {
      if (field.field_type === 'personal_detail')
        this.personal_details.push(field);
      if (field.field_type === 'other_detail') this.other_details.push(field);
    });

    this.other_details_series = new Array(this.wages_series?.length).fill(
      this.other_details
    );
    
    // this.employees.forEach(employee => {
    //   const i = this.startMonth;
    //   employee.incentive_modules.find((incentive:any) => incentive._id == i)
    // })

    // for (let i = 0; this.wages_series.length ; i++) {
        // this.employees = this.employees.map((employee) => {
          
        // })
    // }

    // this.employees = this.employees?.map((employee) => {
    //   // employee.combined_data = employee.combined_data.map((data:any) => data._id)
    //   employee.combined_data = employee?.combined_data
    //     ?.reduce((acc: any, obj: any) => {
    //       const id = obj._id;
    //       if (!acc[id]) {
    //         acc[id] = obj;
    //       } else {
    //         // Merge objects with the same _id
    //         acc[id] = { ...acc[id], ...obj };
    //       }
    //       return acc;
    //       // acc[id] = acc[id] || [];
    //       // acc[id].push(obj);
    //       // return acc;
    //     }, [])
    //     // ?.filter((d: any) => d != null).reverse();
    //   return employee;
    // });
    // console.log(this.employees);

    // this.employees.forEach((e) => {
    //   if (this.totalIncentiveReportCount < e?.incentive_report?.length) {
    //     this.totalIncentiveReportCount = e?.incentive_report?.length;
    //   }
    // });
  }

  // isIncentiveMonth(month:number, year:number){
  //   const diff = this.endMonth.diff(this.startMonth, 'months') + 1;
  //   const date = moment({month: month,year: year});
    
    // if(date.isSameOrAfter(this.startMonth) && date.isSameOrBefore(this.endMonth)) return true;
    // return false
  // }

  hasSlug(data:any, slug: string): boolean {
    return data.some((item:any) => item.slug === slug);
  }
  cancelGenerateReport() {
    // this.reportGenerated = false;
    this.generatedReportTemplate = [];
    // this.resetCheckedRows();
  }

  getReportTdValue(employee: any, field: any) {
    if (field.mapping) {
      if (Array.isArray(field.mapping)) {
        let value = '';
        field.mapping.forEach((mapping: any) => {
          let val = this.getMappingValue(mapping, employee);
          if (val) {
            value += val + ' ';
          } else {
            value ? (value += '') : (value = '');
          }
          // value += this.getMappingValue(mapping, employee) + ' ';
        });

        return value;
      } else {
        return this.getMappingValue(field.mapping, employee);
      }
    } else {
      return null;
    }
  }

  getMappingValue(mappingValue: string, obj: any) {
    let mapping = mappingValue.split('.');
    if (mapping.length > 0) {
      let value = obj;
      mapping.forEach((key: any) => {
        if (value !== null && value !== undefined) {
          value = value[key] ?? null;
        }
      });

      return value ?? null;
    } else {
      return null;
    }
  }

  counter(i: number) {
    return new Array(i);
  }

  async generateReport() {
    let res = await this.companyuserService
      .incentiveReportListing({
        pageno: 1,
        pageper: 20,
        wage_month_from: this.employeeFilter?.wage_month_from ?? '',
        wage_month_to: this.employeeFilter?.wage_month_to ?? '',
        wage_year_from: this.employeeFilter?.wage_year_from ?? '',
        wage_year_to: this.employeeFilter?.wage_year_to ?? '',
        hod_id: this.employeeFilter?.hod_id ?? null,
        department_id: this.employeeFilter?.department_id ?? null,
        designation_id: this.employeeFilter?.designation_id ?? null,
        branch_id: this.employeeFilter?.branch_id ?? null,
        client_id: this.employeeFilter?.client_id ?? null,
        bank_account: this.employeeFilter?.bank_id ?? null,
        row_checked_all: this.row_checked_all,
        checked_row_ids: JSON.stringify(this.checked_row_ids),
        unchecked_row_ids: JSON.stringify(this.unchecked_row_ids),
        generate: 'excel',
      })
      .toPromise();
  }

  getMonthDetails(index:number){
    return Global.monthMaster.find(month => month.index == index)?.sf
  }
}
