import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormControl, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake');
@Component({
  selector: 'app-apply-approve-tds',
  templateUrl: './apply-approve-tds.component.html',
  styleUrls: ['./apply-approve-tds.component.css']
})
export class CMPApplyApproveTdsComponent implements OnInit {
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
  smtpSendTo = 'individual'
  employee_id:any='';
  declaration_id:any='';
  payslipSendForm: FormGroup = new FormGroup({
    smtp_id: new FormControl(''),
  });

  constructor(
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private adminService: AdminService
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'tds_management',
        company_operation: 'apply_approve_tds',
        company_sub_module:['apply_tds_decl', 'approve_tds_decl'],
        company_sub_operation:['view'],
        company_strict:true
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }
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
      // let payload: any = {
      //   pageno: this.employeePaginationOptions.page,
      //   perpage: this.employeeTableFilterOptions.length,
      //   wage_month: this.employeeFilter?.month?.index ?? '',
      //   wage_year: this.employeeFilter?.year?.value ?? '',
      //   hod_id: this.employeeFilter?.hod_id ?? null,
      //   department_id: this.employeeFilter?.department_id ?? null,
      //   designation_id: this.employeeFilter?.designation_id ?? null,
      //   branch_id: this.employeeFilter?.branch_id ?? null,
      //   salary_type: this.salary_type_filter,
      // };

      let payload = await this.getReportPayload();
      // payload.row_checked_all = true;
      payload.checked_row_ids = "[]";
      payload.unchecked_row_ids = "[]";

      if (loading == true) this.spinner.show();
      this.companyuserService.getEmployeesTDS(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            var docs: any[] = res?.data?.docs ?? [];

            docs.forEach((doc: any) => {
              doc.checked = this.isRowChecked(doc._id);
            });

            this.employees = docs;
            this.employeePaginationOptions = {
              hasNextPage: res.data.hasNextPage,
              hasPrevPage: res.data.hasPrevPage,
              limit: res.data.limit,
              nextPage: res.data.nextPage,
              page: res.data.page,
              pagingCounter: res.data.pagingCounter,
              prevPage: res.data.prevPage,
              totalDocs: res.data.totalDocs,
              totalPages: res.data.totalPages,
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

  templateData: any = {};
  employeeDetailTemplateData = {};
  employeeDetailsMaster = [
    {
      value: 'emp_first_name',
      description: 'Employee First Name',
      mapping: 'emp_data.emp_first_name',
    },
    {
      value: 'emp_last_name',
      description: 'Employee Last Name',
      mapping: 'emp_data.emp_last_name',
    },
    {
      value: 'email_id',
      description: 'Email ID',
      mapping: 'emp_data.emp_email_id',
    },
    { value: 'emp_id', description: 'Employee ID', mapping: 'emp_data.emp_id' },
    {
      value: 'aadhar_no',
      description: 'Aadhar No',
      mapping: 'emp_data.emp_aadhar_no',
    },
    { value: 'pan_no', description: 'PAN No', mapping: 'emp_data.emp_pan_no' },
    {
      value: 'emp_father_name',
      description: 'Employee First Name',
      mapping: 'emp_data.emp_father_name',
    },
    {
      value: 'bank_name',
      description: 'Bank Name',
      mapping: 'bank_details.bank_name',
    },
    {
      value: 'branch_name',
      description: 'Branch Name',
      mapping: 'bank_details.branch_name',
    },
    {
      value: 'account_no',
      description: 'Account Number',
      mapping: 'bank_details.account_no',
    },
    {
      value: 'account_type',
      description: 'Account Type',
      mapping: 'bank_details.account_type',
    },
    {
      value: 'ifsc_code',
      description: 'IFSC Code',
      mapping: 'bank_details.ifsc_code',
    },
    {
      value: 'department',
      description: 'Department',
      mapping: 'emp_data.department.department_name',
    },
    {
      value: 'designation',
      description: 'Designation',
      mapping: 'emp_data.designation.designation_name',
    },
    {
      value: 'branch',
      description: 'Branch',
      mapping: 'emp_data.branch.branch_name',
    },
  ];

  salaryContributionsMaster = [
    {
      value: 'PF',
      description: 'PF',
      mapping: '[pf_data][total_employer_contribution]',
    },
    {
      value: 'ESIC',
      description: 'ESIC',
      mapping: '[esic_data][emoloyer_contribution]',
    },
    { value: 'PT', description: 'PT', mapping: '[pt_amount]' },
    { value: 'TDS', description: 'TDS', mapping: '' },
  ];

  salaryDeductionsMaster = [
    {
      value: 'PF',
      description: 'PF',
      mapping: 'pf_data.emoloyee_contribution',
    },
    {
      value: 'ESIC',
      description: 'ESIC',
      mapping: 'esic_data.emoloyee_contribution',
    },
    { value: 'PT', description: 'PT', mapping: 'pt_amount' },
    { value: 'TDS', description: 'TDS', mapping: '' },
  ];

  templateDetails: any = null;
  async employeeDetailTemplateModal(report: any, hidePopup: boolean = false) {
    this.templateData = report;
    // this.templateDetails = await this.getPayslipTemplateData(report?.payslip_temp_data);
    this.templateDetails = report?.payslip_temp_data;

    // console.log('templateDetails: ', this.templateDetails);

    if (!hidePopup) {
      setTimeout(() => {
        $('#viewTemplate')?.click();
      }, 100);
    }

    return;
  }

  // async getPayslipTemplateData({
  //   id = <any>null,
  //   loading = <boolean>true,
  // } = {}) {
  //   return new Promise((resolve, reject) => {
  //     if (loading == true) this.spinner.show();
  //     this.companyuserService
  //       .fetchPaySlipTemplates({
  //         pageno: 1,
  //       })
  //       .subscribe(
  //         (res) => {
  //           if (loading == true) this.spinner.hide();
  //           resolve(res?.payslip_temp?.docs[0] ?? null);
  //         },
  //         (err) => {
  //           if (loading == true) this.spinner.hide();
  //           resolve(null);
  //         }
  //       );
  //   });
  // }

  async showPayslipTemplate(report: any) {
    try {
      this.spinner.show();
      let data = (await this.fetchPayslipTemplate()) as Array<any>;
      this.templateData = { ...data[1] };

      this.templateData.employee_details = this.employeeDetailsMaster.map(
        (d: any) => {
          return {
            title: data[1]?.employee_details?.includes(d.value)
              ? d?.description
              : '',
            templateDataCallback: function (cb: any) {
              let keys = d?.mapping?.split('.');
              return cb(report, ...keys);
            },
          };
        }
      );

      this.templateData.statutory_deduction =
        this.templateData.statutory_deduction.map((title: string) => {
          return {
            head_title: title,
            refineValue: function (key: string) {
              if (!key) return;
              if (key.toLowerCase() == 'pf')
                return (
                  report?.earnings_data?.salary_report?.pf_data
                    ?.emoloyee_contribution ?? '00.00'
                );
              if (key.toLowerCase() == 'esic')
                return (
                  report?.earnings_data?.salary_report?.esic_data
                    ?.emoloyee_contribution ?? '00.00'
                );
              if (key.toLowerCase() == 'pt')
                return (
                  report?.earnings_data?.salary_report?.pt_amount ?? '00.00'
                );
              if (key.toLowerCase() == 'tds')
                return (
                  report?.earnings_data?.salary_report?.pt_amount ?? '00.00'
                );
            },
          };
        });

      this.templateData.statutory_contribution = [
        ...this.templateData.statutory_contribution,
        ...report?.earnings_data?.salary_report_heads?.filter(
          ({ head_type }: any) => head_type == 'earning'
        ),
      ];
      this.templateData.statutory_deduction = [
        ...this.templateData.statutory_deduction,
        ...report?.earnings_data?.salary_report_heads?.filter(
          ({ head_type }: any) => head_type == 'deduction'
        ),
      ];

      this.templateData.earning_total = report?.gross_earning;
      this.templateData.net_pay = report?.net_take;

      // this.templateData.net_pay_words = toWords(report.salary_report.net_take_home)
      this.spinner.hide();
      return true;
    } catch (err) {
      this.spinner.hide();
      return false;
    }
  }

  fetchPayslipTemplate() {
    return new Promise((resolve, reject) => {
      this.companyuserService
        .fetchPaySlipTemplates({
          pageno: 1,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              // res.payslip_temp.totalDocs,
              // res.payslip_temp.totalDocs,
              // res.payslip_temp.docs
              resolve(res.payslip_temp.docs);
              return;
            } else {
              this.toastr.error(res.message);
              reject(res.message);
              return;
            }
          },
          (err) => {
            this.toastr.error(Global.showServerErrorMessage(err));
            reject(err);
            return;
          }
        );
    });
    this.companyuserService
      .fetchPaySlipTemplates({
        pageno: 1,
      })
      .subscribe(
        (res) => {
          if (res.status == 'success') {
            // res.payslip_temp.totalDocs,
            // res.payslip_temp.totalDocs,
            // res.payslip_temp.docs
            // console.log(res);
          } else {
            this.toastr.error(res.message);
          }
        },
        (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
  }

  getValueOfTemplateField(obj: any, ...args: any) {
    return (
      args.reduce((obj: any, level: any) => obj && obj[level], obj) ?? 'N/A'
    );
  }

  async printPackageDetails(d: any) {
    this.templateData = d;
    if (d?.payslip_temp_data) {
      this.employeeDetailTemplateModal(d, true);
      setTimeout(() => {
        let modal = Global.documentPrintByElement('print-section');
      }, 1000);
    }
  }

  getReportPayload() {
    let payload: any = {
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      client_id: this.employeeFilter?.client_id ?? '',
      hod_id: this.employeeFilter?.hod_id ?? '',
      department_id: this.employeeFilter?.department_id ?? '',
      designation_id: this.employeeFilter?.designation_id ?? '',
      searchkey: this.employeeFilter?.searchkey ?? '',
      branch_id: this.employeeFilter?.branch_id ?? '',
      pageno: this.employeePaginationOptions.page,
      perpage: this.employeePaginationOptions.limit,
      wage_month: this.employeeFilter?.month?.index ?? '',
      wage_year: this.employeeFilter?.year?.value ?? '',
    };
    return payload;
  }



  viewTDS(employee_id:any,declaration_id:any){
  this.employee_id=employee_id; 
  this.declaration_id=declaration_id;
  $("#openModalBtn").click();
  }
  closeModal(ev:any)
  {
    $("#close_btn").click();
    this.fetchEmployees();
  }
}
