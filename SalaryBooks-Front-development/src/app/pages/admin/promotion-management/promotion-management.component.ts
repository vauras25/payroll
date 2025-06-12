import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { AdminService } from 'src/app/services/admin.service';

import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-promotion-management',
  templateUrl: './promotion-management.component.html',
  styleUrls: ['./promotion-management.component.css']
})
export class ADPromotionManagementComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  promotionForm: UntypedFormGroup;
  couponTypeMaster: any[];
  couponRedeemed: any[] = [];
  editActionId: String;
  g_coupon_code:any='';
  checkedRowIds:any=[];
  uncheckedRowIds:any=[];
  rowCheckedAll:any=false;
  Global:any=Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private adminService: AdminService,
    private datePipe: DatePipe,
    private spinner: NgxSpinnerService
  ) {
    this.promotionForm = formBuilder.group({
      coupon_code: [null, Validators.compose([Validators.required])],
      coupon_type: [null, Validators.compose([Validators.required])],
      coupon_amount: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      coupon_expire: [null, Validators.compose([Validators.required])],
      multiuse: [null],
      min_purchase: [null],
    });

    this.couponTypeMaster = [
      { 'value': 'fixed', 'description': 'Flat / Fixed' },
      { 'value': 'percentage', 'description': 'Percentage' },
    ];

    this.editActionId = '';

    this.promotionForm.get('coupon_type')?.valueChanges
      .subscribe(val => {
        if (val?.value == 'fixed') {
          $('.minpurchase-field').show(500);
          this.promotionForm.controls['min_purchase'].setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")]);
        } else {
          $('.minpurchase-field').hide(500);
          this.promotionForm.controls['min_purchase'].clearValidators();
        }

        this.promotionForm.controls['min_purchase'].updateValueAndValidity();
      });
  }

  ngOnInit() {
    this.titleService.setTitle("Promotion Management - " + Global.AppName);

    this.fetch();
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.adminService.fetchPromotionCoupons({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.coupons.totalDocs,
              recordsFiltered: res.coupons.totalDocs,
              data: res.coupons.docs,
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
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return `<b>` + full.coupon_code + `</b>`;
          },
          orderable: true,
          name: 'coupon_code',
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.coupon_type + `</span>`;
          },
          orderable: true,
          name: 'coupon_type',
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.min_purchase + `</span>`;
          },
          orderable: true,
          name: 'min_purchase',
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + (full?.free_extra ?full?.free_extra:"N/A") + `</span>`;
          },
          orderable: true,
          name: 'free_extra',
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.status + `</span>`;
          },
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + (full?.redemption_count ?? 'N/A') + `</span>`;
          },
          orderable: true,
          name: 'redemption_count',
        },
        
        {
          render: function (data, type, full, meta) {
            return full.coupon_amount;
          },
          orderable: true,
          name: 'coupon_amount',
        },
        {
          render: function (data, type, full, meta) {
            return full.free_credit?full.free_credit:'N/A';
          },
          orderable: true,
          name: 'free_credit',
        },
        
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.coupon_expire, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'coupon_expire',
        },
        {
          render: function (data, type, full, meta) {
            var btnstatus = "";
            if (full.status == "active") {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }

            return `<div class="br-toggle br-toggle-rounded br-toggle-primary ` + btnstatus + `" id="changeStatusButton">\
                      <div class="br-toggle-switch"></div>\
                    </div>`;
          },
          className: 'text-center',
          orderable: true,
          name: 'status'
        },
       
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
                    <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton">
                        <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>
                    <button class="btn btn-dark btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Users Redeemed" id="redeemedButton">
                        <div style="width:25px; height:25px;"><i class="fa fa-users"></i></div>
                    </button>`;
          },
          className: 'text-center',
          orderable: false,
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return 0;
        //   },
        //   orderable: false,
        // },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $('#editButton', row).bind('click', () => {
          self.getEdit(data);
        });

        $('#deleteButton', row).bind('click', () => {
          self.deleteItem(data);
        });

        $('#redeemedButton', row).bind('click', () => {
          self.fetchCouponReedemed(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
        });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      order: [],
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: false,
      scrollX: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  getEdit(item: any) {
    this.cancelEdit();

    // console.log(item);

    this.editActionId = item._id;
    this.promotionForm.patchValue({
      coupon_code: item.coupon_code,
      coupon_type: this.couponTypeMaster.find((obj: any) => {
        return obj.value == item.coupon_type
      }),
      coupon_amount: item.coupon_amount,
      coupon_expire: this.datePipe.transform(item.coupon_expire, 'MM/dd/YYYY'),
      min_purchase: item.min_purchase,
    });

    if (item.multiuse == 'yes') {
      $('#multiuse-toggle').addClass("on");
    }

    Global.scrollToQuery("#promotion-submit-section");
  }

  cancelEdit() {
    this.editActionId = '';
    Global.resetForm(this.promotionForm);
    $('#multiuse-toggle').removeClass("on");
  }

  create(event: any) {
    if (this.promotionForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.createPromotionCoupon({
        'coupon_code': this.promotionForm.value.coupon_code,
        'coupon_type': this.promotionForm.value.coupon_type.value,
        'coupon_amount': this.promotionForm.value.coupon_amount,
        'coupon_expire': this.datePipe.transform(this.promotionForm.value.coupon_expire, 'Y-MM-dd'),
        'multiuse': ($('#multiuse-toggle').hasClass('on') == true) ? 'yes' : 'no',
        'min_purchase': this.promotionForm.value.min_purchase ?? "",
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelEdit()
          // this.promotionForm.reset();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
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

  deleteItem(item: any) {
    swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        this.adminService.deletePromotionCoupon({
          'coupon_id': item._id,
        }).subscribe(res => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error("Internal server error occured. Please try again later.");
        });
      } else if (result.dismiss === swal.DismissReason.cancel) {
        swal.fire(
          'Cancelled',
          'Your data is safe :)',
          'error'
        )
      }
    })
  }

  update(event: any) {
    if (this.promotionForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.updatePromotionCoupon({
        'coupon_code': this.promotionForm.value.coupon_code,
        'coupon_type': this.promotionForm.value.coupon_type.value,
        'coupon_amount': this.promotionForm.value.coupon_amount,
        'coupon_expire': this.datePipe.transform(this.promotionForm.value.coupon_expire, 'Y-MM-dd'),
        'multiuse': ($('#multiuse-toggle').hasClass('on') == true) ? 'yes' : 'no',
        'min_purchase': this.promotionForm.value.min_purchase ?? "",
        'coupon_id': this.editActionId,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
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

  changeStatus(item: any) {
    this.spinner.show();
    this.adminService.updatePromotionCouponStatus({
      'coupon_id': item._id,
      'status': (item.status == "active") ? 'inactive' : 'active',
    }).subscribe(res => {
      if (res.status == 'success') {
        this.toastr.success(res.message);
        $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
      } else {
        this.toastr.error(res.message);
      }
      this.spinner.hide();

    }, (err) => {
      this.spinner.hide();
      this.toastr.error("Internal server error occured. Please try again later.");
    });
  }

  fetchCouponReedemed(item: any) {
   
    this.g_coupon_code=item.coupon_code;
    this.rowCheckedAll=false;
    this.uncheckedRowIds=[];
    this.checkedRowIds=[];
    this.fetchAllCoupons();

    
  }
  fetchAllCoupons(pageno:any=null) {
    this.spinner.show();
    this.adminService.fetchPromotionCouponReedeemed({
      'coupon_code': this.g_coupon_code,
      "unchecked_row_ids":[],
      "row_checked_all":"false",
      "checked_row_ids":[],
      'pageno':pageno==null?1:pageno

    }).subscribe(res => {
      
      if (res.status == 'success') {
        this.couponRedeemed = res?.purchase_history?.docs ?? [];
        this.couponRedeemed.forEach((element: any,index:any) => {
          element.checked = this.isRowChecked(element._id);
  
        });
        
        this.paginationOptions = {
          hasNextPage: res.purchase_history.hasNextPage,
          hasPrevPage: res.purchase_history.hasPrevPage,
          limit: res.purchase_history.limit,
          nextPage: res.purchase_history.nextPage,
          page: res.purchase_history.page,
          pagingCounter: res.purchase_history.pagingCounter,
          prevPage: res.purchase_history.prevPage,
          totalDocs: res.purchase_history.totalDocs,
          totalPages: res.purchase_history.totalPages,
      };
        if(pageno==null)
        {
          $('#redeemedListModalButton')?.click();

        }
      } else {
        this.toastr.error(res.message);
        this.couponRedeemed = [];
      }
      this.spinner.hide();

    }, (err) => {
      this.couponRedeemed = [];
      this.spinner.hide();
      this.toastr.error("Internal server error occured. Please try again later.");
    });  
  }

  exportPromotion()
  {
    this.spinner.show();
    this.adminService.downloadFile('coupon-details', 'coupon-details',{
      'coupon_code': this.g_coupon_code,generate:'excel',
      "unchecked_row_ids":this.checkedRowIds,
      "row_checked_all":this.rowCheckedAll.toString(),
      "checked_row_ids":this.uncheckedRowIds,
    })
    this.spinner.hide()
    
    // .subscribe(res => {

    //   if (res.status == 'success') {
    //   location.href=  res.url;
    //   } else {
    //     this.toastr.error(res.message);
    //   }
    //   this.spinner.hide();

    // }, (err) => {
    //   this.spinner.hide();
    //   this.toastr.error("Internal server error occured. Please try again later.");
    // });
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
  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }
   this.fetchAllCoupons(1);
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
}
