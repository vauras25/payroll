import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-upload-file-excel-contribution',
  templateUrl: './upload-file-excel-contribution.component.html',
  styleUrls: ['./upload-file-excel-contribution.component.css'],
})
export class UploadFileExcelContributionComponent implements OnInit {
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  Global = Global;
  employees: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  contributionPeriodType: any[] = [];
  viewAllemp:any[]=[]
  isReportView: boolean = false;
  contributionPeriodform: FormGroup = new FormGroup({
    contributionPeriod: new FormControl(''),
  });

  upload_file_heads: any[] = [
    {
      main_title: '',
      main_slug: '',
      // bg_color: "rgb(131 0 0 / 47%)",
      // text_color: 'black',
      modules: [
        {
          module_title: 'Company-esic-upload-report',
          module_slug: 'company_esic_upload_report',
          fields: [
            { slug: 'sl_no', title: 'SL. No.', abbreviation: '', mapping: '' },
            {
              slug: 'ip_number',
              title: 'IP Number',
              abbreviation: '',
              mapping: 'employee_details.ip_number.curr_er_esic_details.esic_no',
            },
            {
              slug: 'ip_name',
              title: 'IP Name',
              abbreviation: '',
              mapping: ['emp_first_name', 'emp_last_name'],
            },
            {
              slug: 'no_days_payable',
              title: 'No of Days for which wages paid/payable during the month',
              abbreviation: '',
              mapping: 'no_days_payable',
            },
            {
              slug: 'total_monthly_wages',
              title: 'Total Monthly Wages',
              abbreviation: '',
              mapping: 'total_monthly_wages',
            },
            {
              slug: 'reason_code',
              title: 'Reason Code for Zero workings days',
              abbreviation: '',
              mapping: 'reason_code',
            },
            {
              slug: 'last_working_day',
              title: 'Last Working Day',
              abbreviation: '',
              mapping: 'last_working_day',
            },
            // { slug: "emp_id", title: "Emp ID", abbreviation: "", mapping: "emp_id" },
            // { slug: "emp_name", title: "Name", abbreviation: "", mapping: ["emp_first_name", "emp_last_name"] },
            // { slug: "department", title: "Department", abbreviation: "", mapping: "department.department_name" },
            // { slug: "designation", title: "Designation", abbreviation: "", mapping: "designation.designation_name" },
            // { slug: "client", title: "Client", abbreviation: "", mapping: "client.client_code" },
          ],
        },
      ],
    },
  ];
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private authService: AuthService,
    private datePipe:DatePipe
  ) {
    const companyData = JSON.parse(
      localStorage.getItem('payroll-companyuser-user') || '{}'
    );
    if (companyData?.esic_rules) {
      const contribution_period_a_from = Global.monthMaster.find(
        (m) =>
          m.index + 1 == companyData?.esic_rules?.contribution_period_a_from
      );
      const contribution_period_b_from = Global.monthMaster.find(
        (m) =>
          m.index + 1 == companyData?.esic_rules?.contribution_period_b_from
      );
      const contribution_period_a_to = Global.monthMaster.find(
        (m) => m.index + 1 == companyData?.esic_rules?.contribution_period_a_to
      );
      const contribution_period_b_to = Global.monthMaster.find(
        (m) => m.index + 1 == companyData?.esic_rules?.contribution_period_b_to
      );

      this.contributionPeriodType = [
        {
          label: `A ${contribution_period_a_from?.sf}-${contribution_period_a_to?.sf}`,
          value: {
            wage_month_from: contribution_period_a_from?.index,
            wage_month_to: contribution_period_a_to?.index,
          },
        },
        {
          label: `B ${contribution_period_b_from?.sf}-${contribution_period_b_to?.sf}`,
          value: {
            wage_month_from: contribution_period_b_from?.index,
            wage_month_to: contribution_period_b_to?.index,
          },
        },
      ];

      this.contributionPeriodform
        .get('contributionPeriod')
        ?.setValue(this.contributionPeriodType[0]);
    }
  }

  ngOnInit() {}

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
  viewEmpDocData: any[] = [];
  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let rowObj: any = {};
  // console.log(row,'row');
    
    rowObj.id = row._id;
    rowObj.ip_number =
      row?.employee_details?.pf_esic_details?.pre_er_esic_details?.esic_no;
    rowObj.emp_first_name = row?.emp_first_name;
    rowObj.emp_last_name = row?.emp_last_name;
    rowObj.no_days_payable = row?.total_paydays;
    rowObj.total_monthly_wages = row?.total_monthly_wages;
    rowObj.reason_code = row?.reason_code;
    rowObj.last_working_day = this.datePipe.transform(row?.do_resignation, 'MM/dd/YYYY');

    this.viewEmpDocData.push(rowObj);
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
        this.viewEmpDocData = this.viewEmpDocData.filter((d) => d.id !== rowId);

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

  getPayload() {
    let payload: any = {
      pageno: this.employeePaginationOptions.page || 1,
      perpage:this.employeePaginationOptions.limit,
      searchkey:this.employeeTableFilterOptions.searchkey || '',
      client_id: this.employeeListFilter?.client_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      hod_id: this.employeeListFilter?.hod_id ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      wage_year_from: this.employeeListFilter?.year?.value ?? '',
      wage_year_to: this.employeeListFilter?.year?.value ?? '',
      form_type: null,
    };
    return payload;
  }

  async fetchEmployees() {
    try {
      let payload = this.getPayload() || {};
      payload = {
        ...payload,
        ...this.contributionPeriodform.get('contributionPeriod')?.value?.value,
      };

      let res = await this.companyuserService
        .fetchEsicUploadReport(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.employees = res.employees.docs;
          this.viewAllemp = res.employees.docs;
          this.employees.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });
          // console.log(this.layoffListing);
          return res;
        } else if (res.status == 'val_err') {
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      return this.toastr.error(err?.message || err);
    }
  }

  async exportForm() {
    try {
      let payload = this.getPayload() || {};
      payload = {
        ...payload,
        ...this.contributionPeriodform.get('contributionPeriod')?.value?.value,
      };

      payload.generate = 'excel';
      await this.companyuserService.downloadFile(
        'company-esic-upload-report',
        'company-esic-upload-report',
        payload
      );
    } catch (err: any) {
      this.toastr.error(err?.message || err);
    }
  }
  generatedReportTemplate: any[] = [];
  viewEmpDoc:any[]=[]
  viewReport() {
    this.generatedReportTemplate = this.upload_file_heads[0]?.modules;
    if (this.rowCheckedAll == true) {
      this.viewEmpDoc = this.viewAllemp
    // console.log(this.viewEmpDoc,'alll');
      
    }
    else{
      this.viewEmpDoc = this.viewEmpDocData
    // console.log(this.viewEmpDoc,'else doc');
      
    }
    this.isReportView = true;
  }
  getReportTdValue(employee: any, field: any) {

    if (field.mapping) {
      if (Array.isArray(field.mapping)) {
        let value = '';
        field.mapping.forEach((mapping: any) => {
          value += this.getMappingValue(mapping, employee) + ' ';
        });

        return value ?? 'N/A';
      } else {
        return this.getMappingValue(field.mapping, employee) ?? 'N/A';
      }
    } else {
      return 'N/A';
    }
  }
  getMappingValue(mappingValue: string, obj: any) {

    let mapping = mappingValue.split('.');
    if (mapping.length > 0) {
      let value = obj;
      mapping.forEach((key: any) => {
        if (value !== null && value !== undefined) {
          // if(value[]){

          // }
          value = value[key] ?? 'N/A';
        }
      });

      return value ?? 'N/A';
    } else {
      return 'N/A';
    }
  }
  cancelGenerateReport() {
    this.isReportView = false;
    this.generatedReportTemplate = [];
    this.viewEmpDocData = [];
    this.resetCheckedRows();
  }
  resetCheckedRows() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];

    $('.employee-table').find('#srNo').prop('checked', false);

    this.fetchEmployees();
  }
}
