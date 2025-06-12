import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _incentiveReportTempMasterNew } from '../../report/_incentiveReportTempMaster';
import { _overtimeReportTempMasterNew } from '../_overtimeReportTempMaster';
import * as moment from 'moment';
@Component({
  selector: 'app-lwf',
  templateUrl: './lwf.component.html',
  styleUrls: ['./lwf.component.css'],
})
export class LwfComponent implements OnInit {
  isProcessPayout: boolean = false;
  Global = Global;
  tableOperationForm: FormGroup;
  bankMaster: any[] = [];
  sheetTemplateMaster: any[] = [];
  reprtTemplateMaster: any = [
    { value: 'form-twentythree', description: 'OT Register (CLRA) Form 23' },
    { value: 'form-four', description: 'Form IV - OT Register For Workers' },
    { value: 'ot-individual', description: 'OT Individual Report' },
  ];
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  employeeFilter: any = null;
  reportFilter: any = {};
  employees: any[] = [];
  monthMaster: any[] = Global.monthMaster;
  yearMaster: any[] = [];
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  filterForm: FormGroup = new FormGroup({
    wage_month: new FormControl(),
    wage_year: new FormControl(),
  });

  constructor(
    private titleService: Title,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService
  ) {
    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }

    this.tableOperationForm = formBuilder.group({
      payout_process: [null],
      payout_bankid: [null],
      report_template: [null],
    });
  }

  ngOnInit() {
    this.titleService.setTitle('LWF Report - ' + Global.AppName);

    setTimeout(() => {
      let current = new Date();
      this.filterForm.patchValue({
        wage_month: this.monthMaster.find((obj: any) => {
          return obj.index == current.getMonth();
        }),
        wage_year: this.yearMaster.find((obj: any) => {
          return obj.value == current.getFullYear();
        }),
      });
    });
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchLwf();
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll(
      '[data-checkbox-id="' + rowId + '"]'
    );

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
          }
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          if (!this.uncheckedRowIds.includes(rowId)) {
            this.uncheckedRowIds.push(rowId);
          }
        }
      }
    }
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  }

  fetchLwf({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
    reportGeneration = <boolean>false,
    options = <any>null
  } = {}) {
    return new Promise((resolve, reject) => {
      if (page != null) this.employeePaginationOptions.page = page;
      if (filter != null) this.employeeFilter = filter;

      if (!this.employeeFilter) {
        resolve(false);
        return;
      }
      let payload: any = {
        unchecked_row_ids: this.uncheckedRowIds,
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: this.checkedRowIds,
        wage_month: this.employeeFilter.month?.index,
        wage_year: this.employeeFilter.year?.value,
        hod_id: this.employeeFilter?.hod_id ?? null,
        searchkey: options?.searchkey ?? null,
        department_id: this.employeeFilter?.department_id ?? null,
        designation_id: this.employeeFilter?.designation_id ?? null,
        branch_id: this.employeeFilter?.branch_id ?? null,
        generate:reportGeneration ? 'excel' : null,
        pageno: this.employeePaginationOptions.page,
        perpage: this.employeePaginationOptions.limit,
      };

      this.spinner.show();

      if(reportGeneration){
        this.companyuserService.downloadFile('get-lwf-data', 'lwf-report', payload).catch((err => {
          this.toastr.error(
            Global.showValidationMessage(Global.showServerErrorMessage(err))
          );
        }))
      }else{
        this.companyuserService.getLWFeport(payload).subscribe(
          (res) => {
            if (res.status == 'success') {
              this.employees = res?.data?.docs ?? [];
              this.employees.forEach((doc: any) => {
                doc.checked = this.isRowChecked(doc._id);
              });
              this.employeePaginationOptions = {
                hasNextPage: res?.data?.hasNextPage,
                hasPrevPage: res?.data?.hasPrevPage,
                limit: res?.data?.limit,
                nextPage: res?.data?.nextPage,
                page: res?.data?.page,
                pagingCounter: res?.data?.pagingCounter,
                prevPage: res?.data?.prevPage,
                totalDocs: res?.data?.totalDocs,
                totalPages: res?.data?.totalPages,
              };
              resolve(true);
            } else {
              if (res.status == 'val_err')
                this.toastr.error(Global.showValidationMessage(res.val_msg));
              else this.toastr.error(res.message);
  
              this.employees = [];
              resolve(false);
            }
  
            if (loading == true) this.spinner.hide();
            Global.loadCustomScripts('customJsScript');
          },
          (err) => {
            this.toastr.error(
              Global.showValidationMessage(Global.showServerErrorMessage(err))
            );
            this.employees = [];
            this.employeePaginationOptions = Global.resetPaginationOption();
  
            if (loading == true) this.spinner.hide();
            Global.loadCustomScripts('customJsScript');
            resolve(false);
          }
        );
      }
    });
  }
}
