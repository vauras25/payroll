import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormControl, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake');

@Component({
  selector: 'app-leave',
  templateUrl: './leave.component.html',
  styleUrls: ['./leave.component.css']
})
export class LeaveComponent implements OnInit {
  Global = Global;
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
  Global.resetTableFilterOptions();
  employeeFilter: any = null;
  commomTableFilterData: any = {};
  employees: any[] = [];
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  salary_type_filter: string = 'salary';
  salaryHeads: any[];
  smtpList: any = [];
  payslip_id: any;
  smtpSendTo = 'individual';
  approveForm: UntypedFormGroup;


  payslipSendForm: FormGroup = new FormGroup({
    smtp_id: new FormControl(''),
  });

  constructor(
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private adminService: AdminService,
    public formBuilder: UntypedFormBuilder,
  ) {
    this.approveForm = this.formBuilder.group({
      
      status:["", Validators.compose([Validators.required])],
      note:[null, Validators.compose([])],

      


   });


  }

  async ngOnInit() {
    // this.templateDetails = await this.getPayslipTemplateData();
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  }

  rowSelecion(e: any): void {
    document.getElementsByName(e.target?.name)?.forEach((checkbox: any) => {
      checkbox.checked = e.target.checked;
    });
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

  fetchEmployees({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
  } = {}) {
    return new Promise(async (resolve, reject) => {
      if (page != null) this.employeePaginationOptions.page = page;
      if (filter != null) this.employeeFilter = filter;

      if (!this.employeeFilter) {
        resolve(false);
        return;
      }

      this.commomTableFilterData = filter;
  

      let payload = await this.getReportPayload();
      // payload.row_checked_all = true;
      payload.checked_row_ids = "[]";
      payload.unchecked_row_ids = "[]";

      if (loading == true) this.spinner.show();
      this.companyuserService.getpendingleaveList(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            var docs: any[] = res?.leave_list?.docs ?? [];

            docs.forEach((doc: any) => {
              doc.checked = this.isRowChecked(doc._id);
            });

            this.employees = docs;
            this.employeePaginationOptions = {
              hasNextPage: res.leave_list.hasNextPage,
              hasPrevPage: res.leave_list.hasPrevPage,
              limit: res.leave_list.limit,
              nextPage: res.leave_list.nextPage,
              page: res.leave_list.page,
              pagingCounter: res.leave_list.pagingCounter,
              prevPage: res.leave_list.prevPage,
              totalDocs: res.leave_list.totalDocs,
              totalPages: res.leave_list.totalPages,
            };

            resolve(true);
          } else {
            if (res.status == 'val_err')
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            else this.toastr.error(res.message);

            this.employees = [];
            this.employeePaginationOptions = Global.resetPaginationOption();

            this.rowCheckedAll = false;
            this.checkedRowIds = [];
            this.uncheckedRowIds = [];

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
          this.rowCheckedAll = false;
          this.checkedRowIds = [];
          this.uncheckedRowIds = [];
          if (loading == true) this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
          resolve(false);
        }
      );
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

    this.fetchEmployees();
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }


  getReportPayload() {
    let payload: any = {
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      client_id: this.employeeFilter?.client_id ?? '',
      hod_id: this.employeeFilter?.hod_id ?? '',
      searchkey: this.employeeFilter?.searchkey ?? '',
      department_id: this.employeeFilter?.department_id ?? '',
      designation_id: this.employeeFilter?.designation_id ?? '',
      branch_id: this.employeeFilter?.branch_id ?? '',
      pageno: this.employeePaginationOptions.page,
      perpage: this.employeePaginationOptions.limit,
      wage_month: this.employeeFilter?.month?.index ?? '',
      wage_year: this.employeeFilter?.year?.value ?? '',

    };
    return payload;
  }
  bulkApprove(ev:any)
  {

    return new Promise((resolve, reject) => {
      this.spinner.show();
      let payload={row_checked_all:this.rowCheckedAll.toString(),checked_row_ids:this.checkedRowIds,
        unchecked_row_ids:this.uncheckedRowIds,status:this.approveForm.value.status,note:this.approveForm.value.note};
      this.companyuserService.approvLeave(payload)
        .subscribe((res: any) => {
          this.spinner.hide();
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.fetchEmployees();
            resolve(true);
            $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();

          } else {
            this.toastr.error(res.message);
            resolve(false);
          }

        }, (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(false);
        });
    })

  }
  clearFormData()
  {
    this.approveForm.patchValue({status:'',note:''});
  }
  bulkAction()
  {
    $("#TemplateModalOpen").click();
  }

}
