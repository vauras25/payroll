import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-export-appraisal-report',
  templateUrl: './export-appraisal-report.component.html',
  styleUrls: ['./export-appraisal-report.component.css'],
})
export class CMPExportAppraisalReportComponent implements OnInit {
  @Input() employeesListing: any[] = [];
  @Input() reportListType: any;

  constructor() {
  }

  ngOnInit() {}

  getAppraisalheads(item: any = []): Array<any> {
    let heads: any = [];

    item.map((d: any) => {
      heads.push(...d.heads_data.map((h: any) => {
        if(!heads.find((el:any) => el.name === h.head_name )){
          return{
            name:h.head_name,
            value:h.head_value,
            assign_value:h.assign_value
          }
        }
        return null
      }));
    });
    return [...new Set(heads)];
  }

  getAppraisalheadsAssignValue(report:any, appraisals:any, rating_of:any): Array<any> {
    let heads: any = [];

    heads = appraisals.find((ap:any) => ap.rate_contributor.contributor_id === report.employee_detail.kpi_and_appraisal[rating_of].assignee_id)?.heads_data;
    return heads
  }

  getAppraisalheadsTotalValue(
    report: any,
    appraisals: any,
    rating_of: any
  ) {
    let sum = 0
    sum = appraisals.find((ap: any) => ap.rate_contributor.contributor_id === report.employee_detail.kpi_and_appraisal[rating_of].assignee_id)?.total_rating;

    return sum;
  }
}
