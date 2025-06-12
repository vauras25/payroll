import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { DatePipe } from '@angular/common';
import swal from 'sweetalert2';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'companyuser-app-shifts-setup',
  templateUrl: './shifts-setup.component.html',
  styleUrls: ['./shifts-setup.component.css'],
})
export class CMPShiftsSetupComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  shiftForm: UntypedFormGroup;
  editActionId: any = '';
  Global = Global;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    protected companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public router: Router,
    private datePipe: DatePipe,
    public AppComponent: AppComponent
  ) {
    this.shiftForm = formBuilder.group({
      shift_name: [null, Validators.compose([Validators.required])],
      shift_allowance: [null, Validators.compose([Validators.required])],
      overtime: [null, Validators.compose([Validators.required])],
      company_late_allowed: [null, Validators.compose([Validators.required])],
      company_early_arrival: [null, Validators.compose([Validators.required])],
      break_shift: [null, Validators.compose([Validators.required])],
      effective_date: [null, Validators.compose([Validators.required])],
      shift1_start_time: [null, Validators.compose([Validators.required])],
      shift1_end_time: [null, Validators.compose([Validators.required])],
      shift2_start_time: [null, Validators.compose([Validators.required])],
      shift2_end_time: [null, Validators.compose([Validators.required])],
    });

    this.shiftForm.get('break_shift')?.valueChanges.subscribe((break_shift) => {
      if (break_shift === 'yes') {
        this.shiftForm
          .get('shift2_start_time')
          ?.setValidators([Validators.required]);
        this.shiftForm
          .get('shift2_end_time')
          ?.setValidators([Validators.required]);
      } else {
        this.shiftForm.get('shift2_start_time')?.clearValidators();
        this.shiftForm.get('shift2_end_time')?.clearValidators();
      }

      this.shiftForm.get('shift2_start_time')?.updateValueAndValidity();
      this.shiftForm.get('shift2_end_time')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Setup | Shift Management - ' + Global.AppName);

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'shift_management',
        company_operation: 'setup_shift',
        company_sub_module:'define_shift',
        company_sub_operation:['view'],
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    this.fetch();

    // this.shiftForm.patchValue({
    //   'shift_name': "General Shift",
    //   'start_time': "10:00",
    //   'end_time': "19:00",
    //   'shift_allowance': "10",
    //   'overtime': "10",
    //   'company_late_allowed': "no",
    //   'company_early_arrival': "yes",
    //   'break_shift': "no",
    //   'effective_date': "2015-06-12",
    // })
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchShifts({
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
            sortbyfield: Global.getTableSortingOptions(
              'sortbyfield',
              dataTablesParameters
            ),
            ascdesc: Global.getTableSortingOptions(
              'ascdesc',
              dataTablesParameters
            ),
          })
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                callback({
                  recordsTotal: res.shift.totalDocs,
                  recordsFiltered: res.shift.totalDocs,
                  data: res.shift.docs,
                });
              } else {
                this.toastr.error(res.message);

                callback({
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                });
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));

              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
              });
            }
          );
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1);
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.shift_name;
          },
          orderable: true,
          name: 'shift_name',
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;

            if(Global.checkCompanyModulePermission({
                company_module: 'shift_management',
                company_sub_module:'define_shift',
                company_sub_operation:['edit'],
                company_strict:true
              })){
                  html +=
                    `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                    meta.row +
                    `">
                              <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                          </button>`;
                          html +=
                            `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
                            meta.row +
                            `">
                                      <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                                  </button>`;
              }



            return html;
          },
          orderable: false,
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift1_start_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift1_start_time',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift1_end_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift1_end_time',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift2_start_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift2_start_time',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift2_end_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift2_end_time',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift_allowance;
          },
          orderable: true,
          name: 'shift_allowance',
        },
        {
          render: function (data, type, full, meta) {
            return full.overtime;
          },
          orderable: true,
          name: 'overtime',
        },
        {
          render: function (data, type, full, meta) {
            return (
              `<span class="text-uppercase">` +
              full.company_late_allowed +
              `</span>`
            );
          },
          orderable: true,
          name: 'company_late_allowed',
        },
        {
          render: function (data, type, full, meta) {
            return (
              `<span class="text-uppercase">` +
              full.company_early_arrival +
              `</span>`
            );
          },
          orderable: true,
          name: 'company_early_arrival',
        },
        {
          render: function (data, type, full, meta) {
            return (
              `<span class="text-uppercase">` + full.break_shift + `</span>`
            );
          },
          orderable: true,
          name: 'break_shift',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.effective_date, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'effective_date',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.created_at, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'created_at',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.updated_at, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'updated_at',
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('table').on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        // $('#changeStatusButton', row).bind('click', () => {
        //   self.changeStatus(data);
        // });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      order: [],
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  create(event: any) {
    this.shiftForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.error-element');
    }, 300);

    if (this.shiftForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .createShift({
          shift_name: this.shiftForm.value.shift_name ?? '',
          shift_allowance: this.shiftForm.value.shift_allowance ?? '',
          overtime: this.shiftForm.value.overtime ?? '',
          company_late_allowed: this.shiftForm.value.company_late_allowed ?? '',
          company_early_arrival:
            this.shiftForm.value.company_early_arrival ?? '',
          break_shift: this.shiftForm.value.break_shift ?? '',
          effective_date: this.shiftForm.value.effective_date ?? '',
          shift1_start_time: this.shiftForm.value.shift1_start_time ?? '',
          shift1_end_time: this.shiftForm.value.shift1_end_time ?? '',
          shift2_start_time: this.shiftForm.value.shift2_start_time ?? '',
          shift2_end_time: this.shiftForm.value.shift2_end_time ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEdit();
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  cancelEdit() {
    this.editActionId = '';
    Global.resetForm(this.shiftForm);
    Global.scrollToQuery('#shift-submit-section');
  }

  getEdit(item: any) {
    this.cancelEdit();

    let effective_date = null;
    if (item.effective_date) {
      var datePipe = new DatePipe('en-US');
      effective_date = datePipe.transform(item.effective_date, 'yyyy-MM-dd');
    }

    this.shiftForm.patchValue({
      shift_name: item.shift_name ?? null,
      shift_allowance: item.shift_allowance ?? null,
      overtime: item.overtime ?? null,
      company_late_allowed: item.company_late_allowed ?? null,
      company_early_arrival: item.company_early_arrival ?? null,
      break_shift: item.break_shift ?? null,
      effective_date: effective_date ?? null,
      shift1_start_time: item.shift1_start_time ?? null,
      shift1_end_time: item.shift1_end_time ?? null,
      shift2_start_time: item.shift2_start_time ?? null,
      shift2_end_time: item.shift2_end_time ?? null,
    });

    Global.scrollToQuery('#shift-submit-section');
    this.editActionId = item._id;
  }

  update(event: any) {
    this.shiftForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.error-element');
    }, 300);

    if (this.shiftForm.valid && this.dataValidation()) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateShift({
          shift_id: this.editActionId,
          shift_name: this.shiftForm.value.shift_name ?? '',
          shift_allowance: this.shiftForm.value.shift_allowance ?? '',
          overtime: this.shiftForm.value.overtime ?? '',
          company_late_allowed: this.shiftForm.value.company_late_allowed ?? '',
          company_early_arrival:
            this.shiftForm.value.company_early_arrival ?? '',
          break_shift: this.shiftForm.value.break_shift ?? '',
          effective_date: this.shiftForm.value.effective_date ?? '',
          shift1_start_time: this.shiftForm.value.shift1_start_time ?? '',
          shift1_end_time: this.shiftForm.value.shift1_end_time ?? '',
          shift2_start_time: this.shiftForm.value.shift2_start_time ?? '',
          shift2_end_time: this.shiftForm.value.shift2_end_time ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              // this.cancelEdit();
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  deleteItem(item: any) {
    swal
      .fire({
        title: 'Are you sure want to remove?',
        text: 'You will not be able to recover this data!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
      })
      .then((result) => {
        if (result.value) {
          this.spinner.show();
          this.companyuserService
            .deleteShift({
              shift_id: item._id,
            })
            .subscribe(
              (res) => {
                this.spinner.hide();

                if (res.status == 'success') {
                  this.toastr.success(res.message);
                  $('#my-datatable')
                    .dataTable()
                    .api()
                    .ajax.reload(function (json) {}, false);
                } else {
                  this.toastr.error(res.message);
                }
              },
              (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                this.spinner.hide();
              }
            );
        } else if (result.dismiss === swal.DismissReason.cancel) {
          swal.fire('Cancelled', 'Your data is safe :)', 'error');
        }
      });
  }

  dataValidation(): boolean {
    const shift1_start_time = this.shiftForm.get('shift1_start_time')?.value;
    const shift1_end_time = this.shiftForm.get('shift1_end_time')?.value;

    // console.log('shift1_start_time - shift1_end_time : ', this.diffTime(shift1_start_time, shift1_end_time))
    if (this.shiftForm.get('break_shift')?.value == 'yes') {
      const shift2_start_time = this.shiftForm.get('shift2_start_time')?.value;
      const shift2_end_time = this.shiftForm.get('shift2_end_time')?.value;

      // console.log('shift2_start_time - shift2_end_time : ', this.diffTime(shift2_start_time, shift2_end_time))
      // console.log('shift2_end_time - shift2_start_time : ', this.diffTime(shift2_end_time, shift2_start_time))
    }

    return true;
  }

  diffTime(time1: any, time2: any) {
    var hour1 = time1.split(':')[0];
    var hour2 = time2.split(':')[0];
    var min1 = time1.split(':')[1];
    var min2 = time2.split(':')[1];

    var diff_hour = hour2 - hour1;
    var diff_min = min2 - min1;
    if (diff_hour < 0) diff_hour += 24;

    if (diff_min < 0) {
      diff_min += 60;
      diff_hour--;
    } else if (diff_min >= 60) {
      diff_min -= 60;
      diff_hour++;
    }

    let total_difference_seconds = 0; // In Seconds

    total_difference_seconds += diff_hour * 60 * 60;
    total_difference_seconds += diff_min * 60;

    return total_difference_seconds / 3600;
  }
}
