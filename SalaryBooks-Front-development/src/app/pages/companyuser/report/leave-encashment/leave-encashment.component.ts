import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import swal from 'sweetalert2';

import jsPDF from 'jspdf';
const pdfMake = require('pdfmake/build/pdfmake')
const pdfFonts = require('pdfmake/build/vfs_fonts')
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake')

import { _arrearReportTempMaster } from '../_arrearReportTempMaster';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-leave-encashment',
  templateUrl: './leave-encashment.component.html',
  styleUrls: ['./leave-encashment.component.css']
})
export class LeaveEncashmentComponent implements OnInit {
  @ViewChild('salarysheetreporttable', { static: false }) el!: ElementRef;

  filterForm: UntypedFormGroup;
  templateForm: UntypedFormGroup;
  generateReportForm: UntypedFormGroup;

  monthMaster: any[] = [];
  yearMaster: any[] = [];
  sheetTemplate: any[] = _arrearReportTempMaster;
  _tempSheetTemplate: any[] = this.sheetTemplate;
  sheetTemplateMaster: any[] = [];
  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  hodMaster: any[] = [];
  range_start:any='';
  range_end:any='';

  empReportData: any[] = [];
  empReportGenerated: Boolean = false;
  empReportTempData: any = {
      'master_head_includes': [],
      'head_includes': [],
      'extra_earning_data': [],
  };

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  holdedSalarypaginationOptions: PaginationOptions = Global.resetPaginationOption();

  reportType: String = "";
  newreport_type: any="";
  attendance_type:any="";
  constructor(
    private titleService: Title,
    private toastr: ToastrService,
    protected companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    public formBuilder: UntypedFormBuilder,
    private datePipe: DatePipe

  ) { 
    this.filterForm = formBuilder.group({
      report_type: [null, Validators.compose([Validators.required])],

      month: [null, Validators.compose([Validators.required])],
      year: [null, Validators.compose([Validators.required])],

      department: [null],
      designation: [null],
      branch: [null],
      hod: [null],

      department_id: [null],
      designation_id: [null],
      branch_id: [null],
      hod_id: [null],
  });

  let currentYear = new Date().getFullYear();
  this.yearMaster = [];
  for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
  }
  }
  async ngOnInit() {
    this.titleService.setTitle("Arrear Report - " + Global.AppName);

    this.reportType = 'monthlywages';
    this.filterForm.patchValue({
        'report_type': 'monthlywages',

        'month': this.monthMaster.find((obj: any) => {
            return obj.index == 0
            return obj.index == new Date().getMonth()
        }) ?? null,

        'year': this.yearMaster.find((obj: any) => {
            // return obj.value == 2022
            return obj.value == new Date().getFullYear()
        }) ?? null,
    }) 
}
employeeListFilter: any = {};
generateMasterSheet({
    page = <any>null,
    options = <any>{}
} = {}) {
    this.employeeListFilter =  options
   
    return new Promise((resolve, reject) => {
        if (this.employeeListFilter) {
            if (page != null) {
                this.paginationOptions.page = page;
            }
            let wage_month_from=options.wage_month_from;
            let wage_year_from=options.wage_year_from;

            let wage_month_to=options.wage_month_to;
            let wage_year_to=options.wage_year_to;
            let last_boj=Global.monthMaster.find(x=>x.index==wage_month_to);
            this.range_start=new Date(wage_year_from,wage_month_from,1);
            this.range_end=new Date(wage_year_to,wage_month_to,last_boj?.days);
            this.tableFilterOptions = options;
            this.newreport_type=options.report_type;
            this.attendance_type=options.attendance_type?.value;
            
        }
    })
}

}
