import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import * as moment from 'moment';


@Component({
  selector: 'app-full-and-final-history',
  templateUrl: './full-and-final-history.component.html',
  styleUrls: ['./full-and-final-history.component.css']
})
export class FullAndFinalHistoryComponent implements OnInit {
  Global = Global;

  filterForm: UntypedFormGroup;

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  bulkAction: boolean = false;
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();

  constructor(
    public formBuilder: UntypedFormBuilder,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
  ) {
    this.filterForm = formBuilder.group({
      corporate_id: [],
      wage_from_date: [moment().format('yyyy-MM-DD')],
      wage_to_date: [moment().format('yyyy-MM-DD')],
      orderby: [null],
    });
  }

  ngOnInit(): void {
    this.FetchORExportFNFHistory();
  }

  FullAndFinalHistoryListing: any[] = [];
headerHeads:any[] =[]

  async FetchORExportFNFHistory(isExport:boolean = false) {
    try {
      // if (page) this.employeePaginationOptions.page = page;
      this.filterForm.markAllAsTouched();
      if (this.filterForm.invalid) return;
      let payload:any = {
        pageno: this.employeePaginationOptions.page,
        perpage: this.employeePaginationOptions.limit,
        searchkey: this.employeeTableFilterOptions.searchkey || '',
        start_date: this.filterForm.value.wage_from_date ?? null,
        end_date: this.filterForm.value.wage_to_date ?? null,
      };
      if(isExport){
        payload.generate = 'excel'
        payload['row_checked_all'] = this.rowCheckedAll.toString()
        payload['unchecked_row_ids'] = this.uncheckedRowIds
        payload['checked_row_ids'] = this.checkedRowIds
        await this.companyuserService.downloadFile('full_and_final_history', 'Full And Final History', payload)
        this.resetFilter()
        return;
      }
      
      this.headerHeads =[]
      let res = await this.companyuserService.fetchFullAndFinalHistory(payload).toPromise();

      if (res.status !== 'success') throw res;
      this.FullAndFinalHistoryListing = res?.employee?.docs ?? [];

      this.FullAndFinalHistoryListing?.forEach((doc: any) => {
        doc.checked = this.isRowChecked(doc._id);
        doc?.full_and_final?.payfor_payment_data?.heads.forEach((head:any) => {
          if(!this.headerHeads.find(h => h.head_id === head.head_id )){
            this.headerHeads.push(head)
          }
        })
      });
    // console.log(this.headerHeads);
      
      this.employeePaginationOptions = {
        hasNextPage: res?.employee.hasNextPage,
        hasPrevPage: res?.employee.hasPrevPage,
        limit: res?.employee.limit,
        nextPage: res?.employee.nextPage,
        page: res?.employee.page,
        pagingCounter: res?.employee.pagingCounter,
        prevPage: res?.employee.prevPage,
        totalDocs: res?.employee.totalDocs,
        totalPages: res?.employee.totalPages,
      };
      // this.resetFilter()
    } catch (err: any) {
      this.toastr.error(err);
    }
  }

  resetFilter() {
    this.bulkAction = false;
    this.checkedRowIds = [];
    this.rowCheckedAll = false;
    this.uncheckedRowIds = [];
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    } else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }
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
          this.checkedRowIds.push(rowId);
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          this.uncheckedRowIds.push(rowId);
        }
      }
    }
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }
    this.FetchORExportFNFHistory();
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }



}
