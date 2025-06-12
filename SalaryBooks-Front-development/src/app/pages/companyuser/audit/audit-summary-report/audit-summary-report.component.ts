import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _incentiveReportTempMasterNew } from '../../report/_incentiveReportTempMaster';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'audit-summary-report',
  templateUrl: './audit-summary-report.component.html',
  styleUrls: ['./audit-summary-report.component.css'],
})
export class CMPAuditSummaryReportComponent implements OnInit {
  Global = Global;
  layoffReportListing: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  layoffListType = 'summary';
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();

  pfChallansListing: any[] = [];
  esicChallansListing: any[] = [];
  reportType: any = null;

  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.reportType = this.activatedRoute?.snapshot?.url[2]?.path;
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchPFSummaryReportListing();
    this.fetchESICSummaryReportListing();
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

  async fetchPFSummaryReportListing(e?: any) {
    try {
      if (e) {
        this.checkedRowIds = e.checkedRowIds;
        this.uncheckedRowIds = e.uncheckedRowIds;
        this.rowCheckedAll = e.rowCheckedAll;
      }
      let payload = {
        pageno: this.reportPaginationOptions.page || 1,
        perpage: this.reportPaginationOptions.limit || 1,
        report_type: 'pf',
        wage_month_from: this.employeeListFilter.wage_month_from,
        wage_month_to: this.employeeListFilter.wage_month_to,
        wage_year_from: this.employeeListFilter.wage_year_from,
        wage_year_to: this.employeeListFilter.wage_year_to,
        client_id: this.employeeListFilter?.client_id ?? '',
        hod_id: this.employeeListFilter?.hod_id ?? '',
        department_id: this.employeeListFilter?.department_id ?? '',
        designation_id: this.employeeListFilter?.designation_id ?? '',
        branch_id: this.employeeListFilter?.branch_id ?? '',
      };
      let res = await this.companyuserService
        .getSummaryReportData(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.pfChallansListing = res.challan_data.docs;
      let items: any[] = [];
      let _id: number = 0;

      Global.monthMaster.forEach((month) => {
        // items.push({
        let curruntMonthData: any[] = res.challan_data?.docs?.filter(
          (challan: any) => +challan.wage_month == month?.index
        );

        if (curruntMonthData.length) {
          _id += 1;
          let challan_data = {
            checked: this.isRowChecked(_id),
            _id: _id,
            wage_month: month.sf,
            file_id: curruntMonthData[0].file_id,
            total_emp: 0,
            total_epf_emp: 0,
            total_epf: 0,
            total_eps_emp: 0,
            total_eps: 0,
            total_edli: 0,
            total_excluded_emp: 0,
            ac_01: 0,
            ac_02: 0,
            ac_10: 0,
            ac_21: 0,
            ac_22: 0,
            total_challan_amount: curruntMonthData.reduce(
              (a, b) => a + (+b.total_challan_amount || 0),
              0
            ),
            pending_challan_amount: 0,
            challans: [] as any,
            emp_ids: [] as any,
          };
          curruntMonthData.map((challan) => {
            challan_data.emp_ids.push(challan._id);
            challan_data['total_emp'] += +challan.total_emp || 0;
            challan_data['total_epf_emp'] += +challan.total_epf_emp || 0;
            challan_data['total_epf'] += +challan.total_epf || 0;
            challan_data['total_eps_emp'] += +challan.total_eps_emp || 0;
            challan_data['total_eps'] += +challan.total_eps || 0;
            challan_data['total_edli'] += +challan.total_edli || 0;
            challan_data['total_excluded_emp'] +=
              +challan.total_excluded_emp || 0;
            challan_data['ac_01'] += +challan.ac_01 || 0;
            challan_data['ac_02'] += +challan.ac_02 || 0;
            challan_data['ac_10'] += +challan.ac_10 || 0;
            challan_data['ac_21'] += +challan.ac_21 || 0;
            challan_data['ac_22'] += +challan.ac_22 || 0;
            // challan_data["total_challan_amount"] += +challan.total_challan_amount || 0;
            if (challan.status !== 'active') {
              let obj = {
                total_pending_amount: challan_data.pending_challan_amount,
                total_payment_amount:
                  challan?.payment_confirmation?.total_amount | 0,
                total_gov_schemes:
                  challan?.challan_details?.total_gov_schemes | 0,
                trrn: challan?.trrn || 'N/A',
                due_date: challan?.due_date || 'N/A',
                date_of_credit:
                  challan?.payment_confirmation?.date_of_credit || 'N/A',
              };
              if (challan_data.pending_challan_amount == 0) {
                challan_data.pending_challan_amount =
                  challan_data.total_challan_amount;
                obj.total_pending_amount = challan_data.total_challan_amount;
              }
              challan_data.pending_challan_amount =
                (+challan_data.pending_challan_amount || 0) -
                  (+challan?.payment_confirmation?.total_amount || 0) || 0;

              challan_data['challans'].push(obj);
            }
          });
          items.push(challan_data);
        }
      });

      this.reportPaginationOptions = {
        hasNextPage: res?.challan_data?.hasNextPage,
        hasPrevPage: res?.challan_data?.hasPrevPage,
        limit: res?.challan_data?.limit,
        nextPage: res?.challan_data?.nextPage,
        page: res?.challan_data?.page,
        pagingCounter: res?.challan_data?.pagingCounter,
        prevPage: res?.challan_data?.prevPage,
        totalDocs: res?.challan_data?.totalDocs,
        totalPages: res?.challan_data?.totalPages,
      };

      this.pfChallansListing = items;
    } catch (err: any) {
      this.toastr.error(err.message || err);
    }
  }

  async fetchESICSummaryReportListing(e?:any) {
    try {
      console.log(e,'eeeeee');
      
      if (e) {
        this.checkedRowIds = e.checkedRowIds;
        this.uncheckedRowIds = e.uncheckedRowIds;
        this.rowCheckedAll = e.rowCheckedAll;
      }
      let payload = {
        pageno: this.reportPaginationOptions.page || 1,
        perpage: this.reportPaginationOptions.limit || 1,
        searchkey: this.reportTableFilterOptions.searchkey || 1,

        report_type: 'esic',
        wage_month_from: this.employeeListFilter.wage_month_from,
        wage_month_to: this.employeeListFilter.wage_month_to,
        wage_year_from: this.employeeListFilter.wage_year_from,
        wage_year_to: this.employeeListFilter.wage_year_to,
        client_id: this.employeeListFilter?.client_id ?? '',
        hod_id: this.employeeListFilter?.hod_id ?? '',
        department_id: this.employeeListFilter?.department_id ?? '',
        designation_id: this.employeeListFilter?.designation_id ?? '',
        branch_id: this.employeeListFilter?.branch_id ?? '',
      };
      let res = await this.companyuserService
        .getSummaryReportData(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.esicChallansListing = res.challan_data.docs;

      let items: any[] = [];  let _id: number = 0;
      Global.monthMaster.forEach((month) => {
        // items.push({
        let curruntMonthData: any[] = res.challan_data?.docs?.filter(
          (challan: any) => +challan.wage_month == month?.index
        );

        if (curruntMonthData.length) {
          _id += 1;
          let challan_data = {
            checked: this.isRowChecked(_id),
            _id: _id,
            wage_month: month.sf,
            file_id: curruntMonthData[0].file_id,
            total_emp: 0,
            total_esic_emp: 0,
            total_esic: 0,
            total_excluded_emp: 0,
            not_coverd_wage: 0,
            total_bonus_esic: 0,
            total_overtime_esic: 0,
            total_incentive_esic: 0,
            total_employee_contribution: 0,
            total_employer_contribution: 0,
            total_contribution: curruntMonthData.reduce(
              (a, b) =>
                a +
                ((+b.total_employee_contribution || 0) +
                  (+b.total_employer_contribution || 0)),
              0
            ),
            pending_challan_amount: 0,
            challans: [] as any,
            emp_ids: [] as any,
          };

          curruntMonthData.map((challan) => {
            challan_data.emp_ids.push(challan._id);
            challan_data['total_emp'] += +challan.total_emp || 0;
            challan_data['total_esic_emp'] += +challan.total_esic_emp || 0;
            challan_data['total_esic'] += +challan.total_esic || 0;
            challan_data['total_excluded_emp'] +=
              +challan.total_excluded_emp || 0;
            challan_data['not_coverd_wage'] += +challan.not_coverd_wage || 0;
            challan_data['total_bonus_esic'] += +challan.total_bonus_esic || 0;
            challan_data['total_overtime_esic'] +=
              +challan.total_overtime_esic || 0;
            challan_data['total_incentive_esic'] +=
              +challan.total_incentive_esic || 0;
            challan_data['total_employee_contribution'] +=
              +challan.total_employee_contribution || 0;
            challan_data['total_employer_contribution'] +=
              +challan.total_employer_contribution || 0;
            if (challan.status !== 'active') {
              let obj: any = {
                total_pending_amount: challan_data.pending_challan_amount || 0,
                total_payment_amount: challan?.total_challan_amount | 0,
                due_date: challan?.due_date || 'N/A',
                challan_submited: challan?.challan_submited || 'N/A',
                challan_number: challan?.challan_number || 'N/A',
              };
              if (challan_data.pending_challan_amount == 0) {
                challan_data.pending_challan_amount =
                  challan_data.total_contribution || 0;
                obj.total_pending_amount = challan_data.total_contribution || 0;
              }
              challan_data.pending_challan_amount =
                (+challan_data.pending_challan_amount || 0) -
                  (+challan?.total_challan_amount || 0) || 0;

              obj['delay_no'] =
                moment(obj.challan_submited).diff(
                  moment(obj.due_date),
                  'days'
                ) < 0
                  ? 0
                  : moment(obj.challan_submited).diff(
                      moment(obj.due_date),
                      'days'
                    );
              challan_data['challans'].push(obj);
            }
          });
          items.push(challan_data);
        }
        // });
      });

      this.reportPaginationOptions = {
        hasNextPage: res?.challan_data?.hasNextPage,
        hasPrevPage: res?.challan_data?.hasPrevPage,
        limit: res?.challan_data?.limit,
        nextPage: res?.challan_data?.nextPage,
        page: res?.challan_data?.page,
        pagingCounter: res?.challan_data?.pagingCounter,
        prevPage: res?.challan_data?.prevPage,
        totalDocs: res?.challan_data?.totalDocs,
        totalPages: res?.challan_data?.totalPages,
      };

      this.esicChallansListing = items;
    } catch (err: any) {
      this.toastr.error(err.message || err);
    }
  }

  async downloadSummaryReport(e: any) {
    try {
      if(!e) return
      let payload = {
        pageno: this.reportPaginationOptions.page || 1,
        perpage: this.reportPaginationOptions.limit || 1,

        report_type: this.reportType,
        wage_month_from: this.employeeListFilter.wage_month_from,
        wage_month_to: this.employeeListFilter.wage_month_to,
        wage_year_from: this.employeeListFilter.wage_year_from,
        wage_year_to: this.employeeListFilter.wage_year_to,
        client_id: this.employeeListFilter?.client_id ?? '',
        hod_id: this.employeeListFilter?.hod_id ?? '',
        department_id: this.employeeListFilter?.department_id ?? '',
        designation_id: this.employeeListFilter?.designation_id ?? '',
        branch_id: this.employeeListFilter?.branch_id ?? '',
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: '',
        unchecked_row_ids: '',
      };
      if (e) {
        payload.checked_row_ids = JSON.stringify(e.checkedRowIds);
        payload.unchecked_row_ids = JSON.stringify(e.uncheckedRowIds);
      }
      await this.companyuserService.downloadFile('export-summary-report','audit-summary-report',payload)
      // let res = await this.companyuserService.download_summary_report(payload).toPromise();
      // if (res.status !== 'success') throw res;
   
      this.fetchPFSummaryReportListing();
      this.fetchESICSummaryReportListing();
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }
}
