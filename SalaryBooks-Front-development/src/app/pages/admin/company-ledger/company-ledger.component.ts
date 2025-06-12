import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';
@Component({
  selector: 'app-company-ledger',
  templateUrl: './company-ledger.component.html',
  styleUrls: ['./company-ledger.component.css']
})
export class CompanyLedgerComponent implements  OnInit, OnDestroy {
  Global = Global;
  dtOptions: DataTables.Settings = {};

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
  reseller_ids:any=[];
  filterOptions: any = {};
  bulkAction: boolean=false;
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
  ) {
    this.subscriptionUserSearchForm = formBuilder.group({
      'corporate_id': [null],
      'wage_from_date': [null],
      'reseller_id': [null],
      'wage_to_date': [null],
      'orderby': [null],
    });



    this.editActionId = '';

    this.packageMaster = [];
    this.planMaster = [];
    this.statusMaster = [
      { 'id': 'active', 'description': 'Active' },
      { 'id': 'inactive', 'description': 'De-active' },
    ];

    this.sortingMaster = [
      { 'id': 'asc', 'description': 'Ascending' },
      { 'id': 'desc', 'description': 'Descending' },
    ];

    this.holdTypeMaster = [
      { 'value': 'hold', 'description': 'Hold' },
      { 'value': 'release', 'description': 'Release' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle("Subscription User Management - " + Global.AppName);
    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.subscriptionUserSearchForm.patchValue({
      wage_from_date: this.formatDate(firstDay),
      wage_to_date:this.formatDate(lastDay)
    })
    this.fetch();
    this.fetchMaster();

    const _this = this;
    $(document).on('click', 'button.action-btn', function () {
      if ($(this).hasClass("awardcredit")) {
        let company_id = $(this).attr('action-data');
        _this.initCreditStatusUpdate(company_id, 'credit');
      } else if ($(this).hasClass("deductcredit")) {
        let company_id = $(this).attr('action-data');
        _this.initCreditStatusUpdate(company_id, 'deduct');
      } else if ($(this).hasClass("suspenduser")) {
        let company_id = $(this).attr('action-data');
        _this.initUserSuspension(company_id);
      } else if ($(this).hasClass("holdcredit")) {
        let company_id = $(this).attr('action-data');
      }
    });
  }

  ngOnDestroy(): void {
    $(document).off('click', 'button.action-btn');
  }

  fetchMaster() {
    this.spinner.show();

    this.adminService.fetchSubAdminPageMasters()
      .subscribe(res => {
        if (res.status == "success") {

          if (
            res.masters.reseller &&
            Array.isArray(res.masters.reseller)
          ) {
            this.resellerMaster = [];
            res.masters.reseller?.forEach((element: any) => {
              this.resellerMaster.push({
                id: element._id,
                description: element.reseller_name,
              });
            });
          }
          this.planMaster = [];
          for (const key in res.masters.plans) {
            if (Object.prototype.hasOwnProperty.call(res.masters.plans, key)) {
              const element = res.masters.plans[key];
              this.planMaster.push({ "id": element._id, "description": element.plan_name });
            }
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      }, (err) => {
        this.toastr.error("Internal server error occured. Please try again later.");
        this.spinner.hide();
      });
  }

  fetch() {
    const self = this;
    
   
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
       
        this.adminService.fetchLedgerLists({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'wage_date_from': this.subscriptionUserSearchForm.value.wage_from_date ?? null,
          'wage_date_to': this.subscriptionUserSearchForm.value.wage_to_date ?? null,
          'corporate_id': this.subscriptionUserSearchForm.value.corporate_id ?? null,
          'reseller_id': this.reseller_ids.length>0?this.reseller_ids : [],
          'unchecked_row_ids': [],
          'row_checked_all': "false",
          'checked_row_ids': [],
          
        }).subscribe(res => {
          if (res.status == 'success') {
            var docs: any[] = res.company.docs;

            docs.forEach((doc: any) => {
              doc.checked = this.isRowChecked(doc._id);
            });

            callback({
              recordsTotal: res.company.totalDocs,
              recordsFiltered: res.company.totalDocs,
              data: res.company.docs,
            });
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error("Internal server error occured. Please try again later.");
        });
      },
      columns: [
       
        {
          render: function (data, type, full, meta) {
            if(full?.qty > 0){
              let checked = (full.checked == true) ? 'checked' : '';
              return `<input type="checkbox" ` + checked + ` id="checkrow-` + meta.row + `" data-checkbox-id="` + full._id + `">`
            }
            return ""
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.resellers?.reseller_name ?? 'N/A';
           
          },
          orderable: false,
          name: 'resellers',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.sub_seller?.reseller_name ?? 'N/A';
           
          },
          orderable: false,
          name: 'sub_seller',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.company_details?.company_branch.length>0?full?.company_details?.company_branch[0]?.branch_name : 'N/A';
           
          },
          orderable: false,
          name: 'company_branch',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.corporate_id ?? 'N/A';
           
          },
          orderable: false,
          name: 'corporate_id',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.establishment_name ?? 'N/A';
           
          },
          orderable: false,
          name: 'establishment_name',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.qty ?? 'N/A';
           
          },
          orderable: false,
          name: 'qty',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.taxable_value ?? 'N/A';
           
          },
          orderable: false,
          name: 'taxable_value',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.gst_amount ?? 'N/A';
           
          },
          orderable: false,
          name: 'gst_amount',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.tds ?? 'N/A';
           
          },
          orderable: false,
          name: 'tds',
        },
        {
          render: function (data, type, full, meta) {
            return full.invoice_value ?? 'N/A';
          },
          orderable: true,
          name: 'invoice_value',
        },
        
        {
          render: function (data, type, full, meta) {
            return '<span class="text-capitalize">'+full?.gateway+'</span>'; ;
          },
          orderable: false,
          name: 'getway',
        },
        
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" id="downloadButton-` + meta.row + `" data-placement="top" title="Download" >
            <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
        </button>`;
          },
          className: 'text-center',
          orderable: false,
        },
      ],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        $("table").on('click', '#checkrow-' + index, function () {
          self.rowCheckBoxChecked(event, data);
        });
        $("table").on('click', '#downloadButton-' + index, function () {
          self.viewData(data?._id);
        });  

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      order: [],
      searching: false,
      pageLength: Global.DataTableLength,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      scrollX:true,
      responsive:false,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  searchSubmit(event: any) {
    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
  }

  addCompany() {
    $('.company-desc').show();
  }

  cancelCompanyEntry() {
    $('.company-desc').hide();
  }
  resetFilter()
  {
    this.bulkAction=false;
    this.checkedRowIds=[];
    this.rowCheckedAll=false;
    this.uncheckedRowIds=[];
    
  }

  createCompany(event: any) {
    if (this.subscriptionCompanyForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.createSubscriptionUser({
        'corporate_id': this.subscriptionCompanyForm.value.corporate_id,
        'establishment_name': this.subscriptionCompanyForm.value.establishment_name,
        'userid': this.subscriptionCompanyForm.value.userid,
        'email_id': this.subscriptionCompanyForm.value.email_id,
        'phone_no': this.subscriptionCompanyForm.value.phone_no,
        // 'package_id' : this.subscriptionCompanyForm.value.package_id.id,
        'plan_id': this.subscriptionCompanyForm.value.plan_id.id,
        'password': this.subscriptionCompanyForm.value.password,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.subscriptionCompanyForm.reset();
          this.cancelCompanyEntry();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error("Internal server error occured. Please try again later.");
      });
    }
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    }
    else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          this.checkedRowIds.push(rowId);
        }
      }
      else {
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

    $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
  }

  fetchCompanyUserDetails(company_id: any) {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.adminService.fetchCompanyUserDetails({
        'company_id': company_id,
      }).subscribe(res => {
        this.spinner.hide();

        if (res.status == 'success') {
          resolve(res.company);
        } else {
          this.toastr.error(res.message);
          resolve(false);
        }
      }, (err) => {
        this.spinner.hide();
        this.toastr.error("Internal server error occured. Please try again later.");
        resolve(false);
      });
    });
  }

  async initCreditStatusUpdate(company_id: any, type: any) {
    let company_details: any = await this.fetchCompanyUserDetails(company_id);
    if (company_details) {
      Global.resetForm(this.customerCreditForm);

      this.customerCreditForm.patchValue({
        'type': type,
        'company_id': company_id,
        'credit_bal': company_details.credit_stat ?? 0,
      });

      $('#creditUpdateModalButton')?.click();
    }
  }

  async initUserSuspension(company_id: any) {
    let company_details: any = await this.fetchCompanyUserDetails(company_id);
    if (company_details) {
      let operation = 'active';
      let swalmessage = "Are you sure, you want to activate " + company_details.establishment_name + "?";
      if (company_details.suspension == 'active') {
        operation = 'suspended';
        swalmessage = "Are you sure, you want to suspend " + company_details.establishment_name + "?";
      }

      swal.fire({
        title: 'Please Confirm',
        text: swalmessage,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Proceed',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.value) {
          this.spinner.show();
          this.adminService.updateCompanySuspensionStatus({
            'company_id': company_details._id,
            'update_type': operation,
          }).subscribe(res => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
            } else {
              this.toastr.error(res.message);
            }

            this.spinner.hide();
          }, (err) => {
            this.toastr.error(Global.showServerErrorMessage(err));
            this.spinner.hide();
          });
        }
      })
    }
  }
  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  viewData(id:any)
  {
    this.bulkAction=true
    let reseller_id:any=[];
   
    this.filterOptions={
      'wage_from_date': this.subscriptionUserSearchForm.value.wage_from_date ?? null,
      'wage_to_date': this.subscriptionUserSearchForm.value.wage_to_date ?? null,
      'corporate_id': this.subscriptionUserSearchForm.value.corporate_id ?? null,
      'reseller_id': this.reseller_ids.length>0?this.reseller_ids : null,
      'unchecked_row_ids': [],
      'row_checked_all': "false",
      'checked_row_ids': [id],
      generate:'',pageno:1   
    }
   
  }
  exportData()
  {
   
    this.bulkAction=true;
    let date = new Date(), y = date.getFullYear(), m = date.getMonth();
    let firstDay = new Date(y, m, 1);
    let lastDay = new Date(y, m + 1, 0);
    this.filterOptions={
      'wage_from_date': this.subscriptionUserSearchForm.value.wage_from_date ?? (firstDay.getFullYear()+'-'+(firstDay.getMonth() + 1)+'-'+firstDay.getDate()),
      'wage_to_date': this.subscriptionUserSearchForm.value.wage_to_date ?? (lastDay.getFullYear()+'-'+(lastDay.getMonth() + 1)+'-'+lastDay.getDate()),
      'corporate_id': this.subscriptionUserSearchForm.value.corporate_id ?? null,
      'reseller_id': this.reseller_ids.length>0?this.reseller_ids : [],
      'unchecked_row_ids': this.uncheckedRowIds,
      'row_checked_all': this.rowCheckedAll.toString(),
      'checked_row_ids': this.checkedRowIds,
      generate:'',pageno:1   
    };
   
  
  }

  setReseller()
  {
    let reseller_id:any=[];
    if(this.subscriptionUserSearchForm.value.reseller_id)
    {
      this.subscriptionUserSearchForm.value.reseller_id.forEach((elem:any)=>{
        reseller_id.push(elem?.id);
      })
      this.reseller_ids=reseller_id;
    }
  }
  formatDate(date:any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }


}
