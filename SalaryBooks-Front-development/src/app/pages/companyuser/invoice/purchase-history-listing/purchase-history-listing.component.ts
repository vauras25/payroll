import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from 'chart.js';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from 'src/app/services/admin.service';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';

@Component({
  selector: 'app-purchase-history-listing',
  templateUrl: './purchase-history-listing.component.html',
  styleUrls: ['./purchase-history-listing.component.css'],
})
export class PurchaseHistoryListingComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  subscriptionUserSearchForm: UntypedFormGroup;
  subscriptionCompanyForm: UntypedFormGroup;
  customerCreditForm: UntypedFormGroup;
  customerHoldCreditForm: UntypedFormGroup;

  packageMaster: any[];
  planMaster: any[];
  statusMaster: any[];
  sortingMaster: any[];
  holdTypeMaster: any[];

  editActionId: String;

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  branchMaster: any[] = [];
  resellerMaster: any[] = [];
  reseller_ids: any = [];
  filterOptions: any = {};
  bulkAction: boolean = false;
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();

  constructor(
    public formBuilder: UntypedFormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe
  ) {
    this.subscriptionUserSearchForm = formBuilder.group({
      corporate_id: [],
      wage_from_date: [null],
      wage_to_date: [null],
      orderby: [null],
    });
  }

  ngOnInit(): void {
    // console.log( Global.getCurrentUser()?.corporate_id);

    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.subscriptionUserSearchForm.patchValue({
      wage_from_date: this.formatDate(firstDay),
      wage_to_date: this.formatDate(lastDay),
      corporate_id: Global.getCurrentUser()?.corporate_id,
    });
    this.fetchLedgerList();
  }

  purchaseHistoryListing: any[] = [];

  async fetchLedgerList({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
    reportGeneration = <boolean>false,
  } = {}) {
    try {
      if (page) this.employeePaginationOptions.page = page;
      this.subscriptionUserSearchForm.markAllAsTouched();
      if (this.subscriptionUserSearchForm.invalid) return;
      let payload = {
        pageno: this.employeePaginationOptions.page,
        perpage: this.employeePaginationOptions.limit,
        searchkey: this.employeeTableFilterOptions.searchkey || '',
        start_date: this.subscriptionUserSearchForm.value.wage_from_date ?? null,
        end_date: this.subscriptionUserSearchForm.value.wage_to_date ?? null,
        corporate_id: this.subscriptionUserSearchForm.value.corporate_id ?? null,
      };

      let res = await this.companyuserService
        .fetchPurchaseHistory(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.purchaseHistoryListing = res?.credit?.docs ?? [];
      this.purchaseHistoryListing?.forEach((doc: any) => {
        doc.checked = this.isRowChecked(doc._id);
      });
      this.employeePaginationOptions = {
        hasNextPage: res?.credit.hasNextPage,
        hasPrevPage: res?.credit.hasPrevPage,
        limit: res?.credit.limit,
        nextPage: res?.credit.nextPage,
        page: res?.credit.page,
        pagingCounter: res?.credit.pagingCounter,
        prevPage: res?.credit.prevPage,
        totalDocs: res?.credit.totalDocs,
        totalPages: res?.credit.totalPages,
      };
    } catch (err: any) {
      this.toastr.error(err);
    }
  }

  // fetch() {
  //   const self = this;

  //   this.dtOptions = {
  //     ajax: (dataTablesParameters: any, callback) => {

  //       this.adminService.fetchSalesLedgerLists({
  //         'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
  //         'wage_date_from': this.subscriptionUserSearchForm.value.wage_from_date ?? null,
  //         'wage_date_to': this.subscriptionUserSearchForm.value.wage_to_date ?? null,
  //         'corporate_id': this.subscriptionUserSearchForm.value.corporate_id ?? null,
  //         'unchecked_row_ids': [],
  //         'row_checked_all': "false",
  //         'checked_row_ids': [],

  //       }).subscribe(res => {
  //         if (res.status == 'success') {
  //           var docs: any[] = res.company.docs;

  //           docs.forEach((doc: any) => {
  //             doc.checked = this.isRowChecked(doc._id);
  //           });
  //           callback({
  //             recordsTotal: res.company.totalDocs,
  //             recordsFiltered: res.company.totalDocs,
  //             data: res.company.docs,
  //           });
  //         } else {
  //           this.toastr.error(res.message);
  //         }
  //       }, (err) => {
  //         this.toastr.error("Internal server error occured. Please try again later.");
  //       });
  //     },
  //     columns: [
  //       {
  //         render: function (data, type, full, meta) {
  //           let checked = (full.checked == true) ? 'checked' : '';
  //           return `<input type="checkbox" ` + checked + ` id="checkrow-` + meta.row + `" data-checkbox-id="` + full._id + `">`
  //         },
  //         orderable: false,
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           return meta.settings._iDisplayStart + (meta.row + 1)
  //         },
  //         orderable: false,
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.resellers?.reseller_name ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'resellers',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.sub_seller?.reseller_name ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'sub_seller',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.company_details?.company_branch.length>0?full?.company_details?.company_branch[0]?.branch_name : 'N/A';

  //         },
  //         orderable: false,
  //         name: 'company_branch',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.corporate_id ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'corporate_id',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.establishment_name ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'establishment_name',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           let formatted_address=(full?.company_details?.reg_office_address?.street_name ?? '')+' '+
  //           (full?.company_details?.reg_office_address?.locality ??'')+' '+(full?.company_details?.reg_office_address?.district_name ?? 'N/A')+' '+
  //           (full?.company_details?.reg_office_address?.pin_code ?? '')+' '+(full?.company_details?.reg_office_address?.state ?? '')
  //           return formatted_address ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'company_details',
  //       },

  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.company_details?.company_branch.length>0?full?.company_details?.company_branch[0]?.branch_contact_person : 'N/A';

  //         },
  //         orderable: false,
  //         name: 'company_branch',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.company_details?.company_branch.length>0?full?.company_details?.company_branch[0]?.contact_person_number : 'N/A';

  //         },
  //         orderable: false,
  //         name: 'company_branch',
  //       },

  //       {
  //         render: function (data, type, full, meta: any) {
  //           return full?.email_id ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'company_branch',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {

  //           return   full?.company_details?.reg_office_address?.state ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'company_details',
  //       },

  //       {
  //         render: function (data, type, full, meta: any) {

  //           return full?.company_details?.establishment?.gst_no ?? 'N/A';

  //         },
  //         orderable: false,
  //         name: 'gst_no',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return  full?.company_details?.establishment?.pan_numberc ?? 'N/A';
  //         },
  //         orderable: true,
  //         name: 'pan_numberc',
  //         className: 'text-center',
  //       },

  //       {
  //         render: function (data, type, full, meta) {
  //           return full?.qty ?? 'N/A';
  //         },
  //         orderable: false,
  //         name: 'qty',
  //         className: 'text-center',
  //       },

  //       {
  //         render: function (data, type, full, meta) {
  //           return full?.taxable_value ?? 'N/A';
  //         },
  //         orderable: false,
  //         name: 'taxable_value',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return self.decimalPipe.transform(full?.igst,'1.2-2') ?? 'N/A';
  //         },
  //         orderable: false,
  //         name: 'igst',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return self.decimalPipe.transform(full?.cgst,'1.2-2') ?? 'N/A';
  //         },
  //         orderable: false,
  //         name: 'cgst',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return self.decimalPipe.transform(full?.sgst,'1.2-2') ?? 'N/A';
  //         },
  //         orderable: false,
  //         name: 'sgst',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return self.decimalPipe.transform(full?.total_gst,'1.2-2') ?? 'N/A';
  //         },
  //         orderable: false,
  //         name: 'total_gst',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return self.decimalPipe.transform(full?.tds, '1.2-2') ?? 'N/A';
  //         },
  //         orderable: false,
  //         name: 'tds',
  //         className: 'text-center',
  //       },

  //       {
  //         render: function (data, type, full, meta) {
  //           return self.decimalPipe.transform(full?.inv_value, '1.2-2');

  //         },
  //         orderable: false,
  //         name: 'inv_value',
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //             var btn_action="";
  //             if(full?.credit_purchases)
  //             {
  //               btn_action=`<a target="_blank" href='`+Global.BACKEND_URL + '/' + full?.credit_purchases[0]?.file_path+`'>
  //               <button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" id="downloadButton-` + meta.row + `" data-placement="top" title="Download" >
  //               <div style="width:25px; height:25px;"><i class="fa fa-download"></i></div>
  //               </button></a>`;
  //             }
  //             else{
  //               btn_action=`<a  href='javascript:void(0)'>
  //               <button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" id="downloadButton-` + meta.row + `" data-placement="top" title="Download" >
  //               <div style="width:25px; height:25px;"><i class="fa fa-download"></i></div>
  //               </button></a>`;
  //             }
  //             return btn_action;

  //         },
  //         className: 'text-center',
  //         orderable: false,
  //       },

  //     ],
  //     rowCallback: (row: Node, data: any | Object, index: number) => {
  //       $("table").on('click', '#checkrow-' + index, function () {
  //         self.rowCheckBoxChecked(event, data);
  //       });
  //       $("table").on('click', '#downloadButton-' + index, function () {
  //         // self.viewData(data?._id);
  //       });

  //       return row;
  //     },
  //     pagingType: 'full_numbers',
  //     serverSide: true,
  //     processing: true,
  //     ordering: true,
  //     order: [],
  //     searching: false,
  //     pageLength: Global.DataTableLength,
  //     lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
  //     scrollX:true,
  //     responsive:false,
  //     language: {
  //       searchPlaceholder: 'Search...',
  //       search: ""
  //     }
  //   };
  // }

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
    this.fetchLedgerList();
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

 async exportData(export_type: any) {
 try {
  this.subscriptionUserSearchForm.markAllAsTouched();
  if (this.subscriptionUserSearchForm.invalid) return;

  await this.companyuserService.downloadFile('get-purchase-history','Purchase History',{
      pageno: this.employeePaginationOptions.page,
      perpage: this.employeeTableFilterOptions.length,
      start_date: this.subscriptionUserSearchForm.value.wage_from_date ?? null,
      end_date: this.subscriptionUserSearchForm.value.wage_to_date ?? null,
      corporate_id: this.subscriptionUserSearchForm.value.corporate_id ?? null,
      unchecked_row_ids: this.uncheckedRowIds,
      row_checked_all: this.rowCheckedAll.toString(),
      checked_row_ids: this.checkedRowIds,
      generate: export_type,
    })
 } catch (err:any) {
  this.toastr.error(err)
 }
      // .subscribe(
      //   (res) => {
      //     if (res.status == 'success') {
      //       location.href = res?.url;
      //     } else {
      //       this.toastr.error(res.message);
      //     }
      //   },
      //   (err) => {
      //     this.toastr.error(
      //       'Internal server error occured. Please try again later.'
      //     );
      //   }
      // );
  }

  formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  downloadFile(pdfLink:string){
    window.open(Global.BACKEND_URL+'/' + pdfLink)
  }
}
