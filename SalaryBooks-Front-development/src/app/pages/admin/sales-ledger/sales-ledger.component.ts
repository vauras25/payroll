import { DatePipe,DecimalPipe  } from '@angular/common';
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
  selector: 'app-sales-ledger',
  templateUrl: './sales-ledger.component.html',
  styleUrls: ['./sales-ledger.component.css']
})
export class SalesLedgerComponent implements OnInit {
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
    private decimalPipe: DecimalPipe,    
  ) { 
    this.subscriptionUserSearchForm = formBuilder.group({
      'corporate_id': [null],
      'wage_from_date': [null],
      'reseller_id': [null],
      'wage_to_date': [null],
      'orderby': [null],
    });



  }

  ngOnInit(): void {
    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.subscriptionUserSearchForm.patchValue({
      wage_from_date: this.formatDate(firstDay),
      wage_to_date:this.formatDate(lastDay)
    })
  this.fetchMaster();    
  this.fetch();  
  }
  fetch() {
    const self = this;
    
   
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
       
        this.adminService.fetchSalesLedgerLists({
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
            let checked = (full.checked == true) ? 'checked' : '';
            return `<input type="checkbox" ` + checked + ` id="checkrow-` + meta.row + `" data-checkbox-id="` + full._id + `">`
          },
          orderable: false,
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          orderable: false,
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.resellers?.reseller_name ?? 'N/A';
           
          },
          orderable: false,
          name: 'resellers',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.sub_seller?.reseller_name ?? 'N/A';
           
          },
          orderable: false,
          name: 'sub_seller',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.company_details?.company_branch.length>0?full?.company_details?.company_branch[0]?.branch_name : 'N/A';
           
          },
          orderable: false,
          name: 'company_branch',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.corporate_id ?? 'N/A';
           
          },
          orderable: false,
          name: 'corporate_id',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.establishment_name ?? 'N/A';
           
          },
          orderable: false,
          name: 'establishment_name',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
            let formatted_address=(full?.company_details?.reg_office_address?.street_name ?? '')+' '+
            (full?.company_details?.reg_office_address?.locality ??'')+' '+(full?.company_details?.reg_office_address?.district_name ?? 'N/A')+' '+
            (full?.company_details?.reg_office_address?.pin_code ?? '')+' '+(full?.company_details?.reg_office_address?.state ?? '')
            return formatted_address ?? 'N/A';
            
           
          },
          orderable: false,
          name: 'company_details',
        },

        {
          render: function (data, type, full, meta: any) {
          
            return full?.company_details?.company_branch.length>0?full?.company_details?.company_branch[0]?.branch_contact_person : 'N/A';
           
          },
          orderable: false,
          name: 'company_branch',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return full?.company_details?.company_branch.length>0?full?.company_details?.company_branch[0]?.contact_person_number : 'N/A';
           
          },
          orderable: false,
          name: 'company_branch',
        },

        {
          render: function (data, type, full, meta: any) {
            return full?.email_id ?? 'N/A';
           
          },
          orderable: false,
          name: 'company_branch',
        },
        {
          render: function (data, type, full, meta: any) {
          
            return   full?.company_details?.reg_office_address?.state ?? 'N/A';
           
          },
          orderable: false,
          name: 'company_details',
        },
      
        {
          render: function (data, type, full, meta: any) {
          
            return full?.company_details?.establishment?.gst_no ?? 'N/A';
           
          },
          orderable: false,
          name: 'gst_no',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return  full?.company_details?.establishment?.pan_numberc ?? 'N/A';
          },
          orderable: true,
          name: 'pan_numberc',
          className: 'text-center',
        },

        {
          render: function (data, type, full, meta) {
            return full?.qty ?? 'N/A';
          },
          orderable: false,
          name: 'qty',
          className: 'text-center',
        },
       
       
        {
          render: function (data, type, full, meta) {
            return full?.taxable_value ?? 'N/A';
          },
          orderable: false,
          name: 'taxable_value',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return self.decimalPipe.transform(full?.igst,'1.2-2') ?? 'N/A';
          },
          orderable: false,
          name: 'igst',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return self.decimalPipe.transform(full?.cgst,'1.2-2') ?? 'N/A';
          },
          orderable: false,
          name: 'cgst',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return self.decimalPipe.transform(full?.sgst,'1.2-2') ?? 'N/A';
          },
          orderable: false,
          name: 'sgst',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return self.decimalPipe.transform(full?.total_gst,'1.2-2') ?? 'N/A';
          },
          orderable: false,
          name: 'total_gst',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return self.decimalPipe.transform(full?.tds, '1.2-2') ?? 'N/A';
          },
          orderable: false,
          name: 'tds',
          className: 'text-center',
        },
        
        {
          render: function (data, type, full, meta) {
            return self.decimalPipe.transform(full?.inv_value, '1.2-2');
           
          },
          orderable: false,
          name: 'inv_value',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
              var btn_action="";
              if(full?.credit_purchases)
              {
                btn_action=`<a target="_blank" href='`+Global.BACKEND_URL + '/' + full?.credit_purchases[0]?.file_path+`'>
                <button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" id="downloadButton-` + meta.row + `" data-placement="top" title="Download" >
                <div style="width:25px; height:25px;"><i class="fa fa-download"></i></div>
                </button></a>`;
              }
              else{
                btn_action=`<a  href='javascript:void(0)'>
                <button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" id="downloadButton-` + meta.row + `" data-placement="top" title="Download" >
                <div style="width:25px; height:25px;"><i class="fa fa-download"></i></div>
                </button></a>`;
              }
              return btn_action;
             
            
            
          },
          className: 'text-center',
          orderable: false,
        }, 
       
      ],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        $("table").on('click', '#checkrow-' + index, function (event  ) {
          self.rowCheckBoxChecked(event, data);
        });
        $("table").on('click', '#downloadButton-' + index, function (event) {
          event.stopPropagation()
          event.preventDefault()
        // console.log(index);
          
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
  resetFilter()
  {
    this.bulkAction=false;
    this.checkedRowIds=[];
    this.rowCheckedAll=false;
    this.uncheckedRowIds=[];
    
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
  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  viewData(id:any)
  {
  // console.log("helo");
    
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
  exportData(export_type:any)
  {
    this.adminService.downloadFile('get-company-sales-ledgers-list' ,'company-sales-leadgers-list',{
      'pageno':  1, 
      'wage_date_from': this.subscriptionUserSearchForm.value.wage_from_date ?? null,
      'wage_date_to': this.subscriptionUserSearchForm.value.wage_to_date ?? null,
      'corporate_id': this.subscriptionUserSearchForm.value.corporate_id ?? null,
      'reseller_id': this.reseller_ids.length>0?this.reseller_ids : [],
      'unchecked_row_ids': this.uncheckedRowIds,
      'row_checked_all': this.rowCheckedAll.toString(),
      'checked_row_ids': this.checkedRowIds,
      'generate':export_type
      
    })
    // .subscribe(res => {
    //   if (res.status == 'success') {
    //   location.href=res?.url;  
    //   } else {
    //     this.toastr.error(res.message);
    //   }
    // }, (err) => {
    //   this.toastr.error("Internal server error occured. Please try again later.");
    // });
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
