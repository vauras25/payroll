import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-dispensary',
  templateUrl: './dispensary.component.html',
  styleUrls: ['./dispensary.component.css']
})
export class CMPDispensaryComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dispensaryForm: UntypedFormGroup;
  dispensaries: any[];
  editActionId: String;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
  ) {
    this.dispensaryForm = formBuilder.group({
      dispensary_name: [null, Validators.compose([Validators.required])],
    });

    this.dispensaries = [];
    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle("Dispensary - " + Global.AppName);

    this.fetch();
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService.fetchDispensaries({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.dispensary.totalDocs,
              recordsFiltered: res.dispensary.totalDocs,
              data: res.dispensary.docs,
            });
          } else {
            this.toastr.error(res.message);

            callback({
              recordsTotal: [],
              recordsFiltered: [],
              data: [],
            });
          }
        }, (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));

          callback({
            recordsTotal: [],
            recordsFiltered: [],
            data: [],
          });
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          orderable: false,
        },
        // {
        //   render: function (data, type, full, meta) {
        //     var btnstatus = "";
        //     if (full.status == "active") {
        //       btnstatus = 'on';
        //     } else {
        //       btnstatus = 'off';
        //     }

        //     return `<div class="br-toggle br-toggle-rounded br-toggle-primary ` + btnstatus + `" id="changeStatusButton">\
        //               <div class="br-toggle-switch"></div>\
        //             </div>`;
        //   },
        //   className: 'text-center',
        //   orderable: true,
        //   name: 'status'
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     let html = "";

        //     html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
        //         <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
        //     </button>`

        //     html += `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
        //         <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
        //     </button>`

        //     return html;
        //   },
        //   className: 'text-center',
        //   orderable: false,
        // },
        {
          render: function (data, type, full, meta) {
            return full.dispensary_name;
          },
          orderable: true,
          name: 'dispensary_name'
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $("table").on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
        });
        return row;
      },
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      order: [],
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  getEdit(item: any) {
    this.editActionId = item._id;
    this.dispensaryForm.setValue({
      dispensary_name: item.dispensary_name,
    });

    $('html, body').animate({
      'scrollTop': $("#dispensary-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.dispensaryForm.reset();
  }

  create(event: any) {
    if (this.dispensaryForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.createDispensary({
        'dispensary_name': this.dispensaryForm.value.dispensary_name,
        'status': 'active',
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.dispensaryForm.reset();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error(Global.showServerErrorMessage(err));
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
        this.companyuserService.deleteDispensary({
          'dispensary_id': item._id,
        }).subscribe(res => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
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
    if (this.dispensaryForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.updateDispensary({
        'dispensary_name': this.dispensaryForm.value.dispensary_name,
        'dispensary_id': this.editActionId,
        'status': 'active',
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
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  changeStatus(item: any) {
    this.companyuserService.updateDispensary({
      'dispensary_name': item.dispensary_name,
      'dispensary_id': item._id,
      'status': (item.status == "active") ? 'inactive' : 'active',
    }).subscribe(res => {
      if (res.status == 'success') {
        this.toastr.success(res.message);
        $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
      } else {
        this.toastr.error(res.message);
      }

    }, (err) => {
      this.toastr.error(Global.showServerErrorMessage(err));
    });
  }
}
