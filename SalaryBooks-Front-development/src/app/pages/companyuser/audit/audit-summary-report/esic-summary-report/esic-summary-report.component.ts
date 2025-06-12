import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'esic-summary-report',
  templateUrl: './esic-summary-report.component.html',
  styleUrls: ['./esic-summary-report.component.css'],
})
export class CMPEsicSummaryReportComponent implements OnInit {
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  checkedRow: any = {};
  uncheckedRow: any = {};
  @Input() esicChallansListing: any[] = [];
  @Output() onChecked: EventEmitter<any> = new EventEmitter();
  @Input() reportPaginationOptions:PaginationOptions ;
  @Input() reportTableFilterOptions:TableFilterOptions ;
  @Output() downloadReport: EventEmitter<any> = new EventEmitter();
  // reportTableFilterOptions: TableFilterOptions = Global.resetTableFilterOptions();
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  getMonthFromIndex(month: any) {
    return Global.monthMaster.find((x: any) => x.index == month)?.sf;
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
    this.onChecked.emit({
      checkedRowIds: this.checkedRowIds,
      uncheckedRowIds: this.uncheckedRowIds,
      rowCheckedAll: this.rowCheckedAll,
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
        delete this.uncheckedRow[rowId];
        if (!this.rowCheckedAll) {
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
            this.checkedRow[rowId] = row.emp_ids;
          }
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        delete this.checkedRow[rowId];
        if (this.rowCheckedAll) {
          if (!this.uncheckedRowIds.includes(rowId)) {
            this.uncheckedRowIds.push(rowId);
            this.uncheckedRow[rowId] = row.emp_ids;
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

  getDaysDiffFromDates(startDate: any, endDate: any) {
    startDate = moment(startDate); // Example start date
    endDate = moment(endDate); // Example end date

    return endDate.diff(startDate, 'days') < 0
      ? 0
      : endDate.diff(startDate, 'days');
  }
  downloadExcelReport() {
    let ckr = Object.values(this.checkedRow) || [];
    let uckr = Object.values(this.uncheckedRow) || [];

    this.downloadReport.emit({
      rowCheckedAll: this.rowCheckedAll,
      checkedRowIds: ckr.flat(1) || [],
      uncheckedRowIds: uckr.flat(1) || [],
    });
  }
}
