import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-app-attendance-yearly-holiday',
  templateUrl: './yearly-holiday.component.html',
  styleUrls: ['./yearly-holiday.component.css']
})
export class CMPAttendanceYearlyHolidayComponent implements OnInit {
  holidayForm: UntypedFormGroup;
  dtOptions: DataTables.Settings = {};
  editActionId: String;

  constructor(
    private titleService: Title,
    public formBuilder: UntypedFormBuilder,
    protected companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private datePipe: DatePipe,
  ) {
    this.holidayForm = formBuilder.group({
      holiday_date: [null, Validators.compose([Validators.required])],
      effective_from: [null, Validators.compose([Validators.required])],
      effective_to: [null, Validators.compose([Validators.required])],
      holiday_reason: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';
  }

  ngOnInit(): void {
    this.titleService.setTitle("Yearly Holiday | Attendance Management - " + Global.AppName);

    this.fetch();
  }

  addHoliday() {
    $('#holiday-form').show();
    Global.resetForm(this.holidayForm)
    this.editActionId = '';
  }

  cancelEntry() {
    $('#holiday-form').hide();
    Global.resetForm(this.holidayForm);
    this.editActionId = '';
  }

  add(event: any) {
    this.holidayForm.markAllAsTouched();

    if (this.holidayForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.addAttendanceYearlyHoliday({
        'holiday_date': this.holidayForm.value.holiday_date,
        'effective_from': this.holidayForm.value.effective_from,
        'effective_to': this.holidayForm.value.effective_to,
        'holiday_reason': this.holidayForm.value.holiday_reason,
      })?.subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelEntry();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
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

  update(event: any) {
    this.holidayForm.markAllAsTouched();

    if (this.holidayForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.updateAttendanceYearlyHoliday({
        'yearly_holiday_id': this.editActionId,
        'holiday_date': this.holidayForm.value.holiday_date,
        'effective_from': this.holidayForm.value.effective_from,
        'effective_to': this.holidayForm.value.effective_to,
        'holiday_reason': this.holidayForm.value.holiday_reason,
      })?.subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelEntry();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
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

  getEdit(item: any) {
    var datePipe = new DatePipe("en-US");
    Global.resetForm(this.holidayForm)
    this.editActionId = item._id;

    this.holidayForm.patchValue({
      'holiday_date': item.holiday_date ? datePipe.transform(item.holiday_date, 'yyyy-MM-dd') : "",
      'effective_from': item.effective_from ? datePipe.transform(item.effective_from, 'yyyy-MM-dd') : "",
      'effective_to': item.effective_to ? datePipe.transform(item.effective_to, 'yyyy-MM-dd') : "",
      'holiday_reason': item.holiday_reason,
    })

    $('#holiday-form').show();
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService.fetchAttendanceYearlyHolidays({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        })?.subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.holidays.totalDocs,
              recordsFiltered: res.holidays.totalDocs,
              data: res.holidays.docs,
            });
          } else {
            this.toastr.error(res.message);

            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: [],
            });
          }
        }, (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));

          callback({
            recordsTotal: 0,
            recordsFiltered: 0,
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
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = true;

            html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                          <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                      </button>`;

            if (flag) return html;
            else return '-';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.holiday_date, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'holiday_date'
        },
        {
          render: function (data, type, full, meta) {
            return full.holiday_reason ?? "-";
          },
          orderable: true,
          name: 'holiday_reason'
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.effective_from, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'effective_from'
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.effective_to, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'effective_to'
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        // $("table").on('click', '#deleteButton-' + index, function () {
        //   self.deleteItem(data);
        // });

        // $('#changeStatusButton', row).bind('click', () => {
        //   self.changeStatus(data);
        // });
        return row;
      },
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: false,
      searching: false,
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
}
