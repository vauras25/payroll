import { Component, OnInit } from '@angular/core';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-advance-report-view',
  templateUrl: './advance-report-view.component.html',
  styleUrls: ['./advance-report-view.component.css']
})
export class CMPAdvanceReportViewComponent implements OnInit {
  generatedReportTemplate: any;
  employees: any[] = [];
  company:any
  totalIncentiveReportCount: number = 0;
  templateName:String;

  constructor(private companyuserService: CompanyuserService) {
    this.companyuserService.exportedPrintDocs?.subscribe((d) => {
      this.templateName = d.templateName
      this.generatedReportTemplate = d.generatedReportTemplate;
      this.employees = d.employees;
      this.company = d.company;
    });
    // console.log(
    //   this.templateName
    // );
    
    this.employees.forEach((e) => {
      if (this.totalIncentiveReportCount < e?.incentive_report?.length) {
        this.totalIncentiveReportCount = e?.incentive_report?.length;
      }
    });
  }

  ngOnInit() {}

  cancelGenerateReport() {
    this.generatedReportTemplate = null;
  }

  getReportTdValue(employee: any, field: any) {
    if (field.mapping) {
      if (Array.isArray(field.mapping)) {
        let value = '';
        field.mapping.forEach((mapping: any) => {
          value += this.getMappingValue(mapping, employee) + ' ';
        });

        return value;
      } else {
        return this.getMappingValue(field.mapping, employee);
      }
    } else {
      return null;
    }
  }

  utilizeMonth(m:any){
    return Global.monthMaster.find(d => d.index == m)?.sf
  }

  getMappingValue(mappingValue: string, obj: any) {
    if(mappingValue){
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
  }

  counter(i: number) {
    return new Array(i);
  }

  isValueInclude(el:any){
    return this.generatedReportTemplate?.modules[0]?.fields?.some((value:any) => value['slug'] === el)
  }

}
