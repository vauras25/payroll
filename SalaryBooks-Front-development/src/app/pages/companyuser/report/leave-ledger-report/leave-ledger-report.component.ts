import { DatePipe } from '@angular/common';
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
@Component({
  selector: 'app-leave-ledger-report',
  templateUrl: './leave-ledger-report.component.html',
  styleUrls: ['./leave-ledger-report.component.css']
})
export class LeaveLedgerReportComponent implements OnInit {
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

  this.monthMaster = [
      { index: 0, value: 1, description: "January", days: 31 },
      { index: 1, value: 2, description: "February", days: 28 },
      { index: 2, value: 3, description: "March", days: 31 },
      { index: 3, value: 4, description: "April", days: 30 },
      { index: 4, value: 5, description: "May", days: 31 },
      { index: 5, value: 6, description: "June", days: 30 },
      { index: 6, value: 7, description: "July", days: 31 },
      { index: 7, value: 8, description: "August", days: 31 },
      { index: 8, value: 9, description: "September", days: 30 },
      { index: 9, value: 10, description: "October", days: 31 },
      { index: 10, value: 11, description: "November", days: 30 },
      { index: 11, value: 12, description: "December", days: 31 },
  ];

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
            this.tableFilterOptions = options;
            this.newreport_type=options.report_type;
            this.attendance_type=options.attendance_type?.value;
            
        }
    })
}

}
