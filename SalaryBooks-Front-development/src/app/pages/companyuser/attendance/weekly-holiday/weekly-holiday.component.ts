import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-app-attendance-weekly-holiday',
  templateUrl: './weekly-holiday.component.html',
  styleUrls: ['./weekly-holiday.component.css']
})
export class CMPAttendanceWeeklyHolidayComponent implements OnInit {
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
      effective_from: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';
  }

  ngOnInit(): void {
    this.titleService.setTitle("Weekly Holiday | Attendance Management - " + Global.AppName);

    this.fetch();
  }

  addHoliday() {
    $('#holiday-form').show();

    Global.resetForm(this.holidayForm)
    this.resetAllHolidayWeekCheckbox();
    this.editActionId = '';
  }

  cancelEntry() {
    $('#holiday-form').hide();

    Global.resetForm(this.holidayForm);
    this.resetAllHolidayWeekCheckbox();
    this.editActionId = '';
  }

  add(event: any) {
    this.holidayForm.markAllAsTouched();

    if (this.holidayForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.addAttendanceWeeklyHoliday({
        'effective_from': this.holidayForm.value.effective_from,
        'weekday_no': new Date(this.holidayForm.value.effective_from).getDay(),
        'weeks': JSON.stringify(this.getSelectedHolidayWeekChecked())
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

      this.companyuserService.updateAttendanceWeeklyHoliday({
        'weekly_holiday_id': this.editActionId,
        'effective_from': this.holidayForm.value.effective_from,
        'weekday_no': new Date(this.holidayForm.value.effective_from).getDay(),
        'weeks': JSON.stringify(this.getSelectedHolidayWeekChecked())
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
    this.selectHolidayCheckboxForEdit(item.weeks)

    this.holidayForm.patchValue({
      'effective_from': item.effective_from ? datePipe.transform(item.effective_from, 'yyyy-MM-dd') : "",
    })

    $('#holiday-form').show();
  }

  fetch() {
    const _this = this;
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService.fetchAttendanceWeeklyHolidays({
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
            return full.weekday ?? "-";
          },
          orderable: true,
          name: 'weekday'
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
            let first_half = _this.checkWeekHolidayForTable(full.weeks, 'first_half', 1) == true ? 'checked' : '';
            let second_half = _this.checkWeekHolidayForTable(full.weeks, 'second_half', 1) == true ? 'checked' : '';

            return `<label class="ckbox full-opacity">
                      <input disabled type="checkbox" `+ first_half + `>
                      <span>First Half</span>
                    </label>
                    <label class="ckbox full-opacity mb-0">
                      <input disabled type="checkbox" `+ second_half + `>
                      <span>Second Half</span>
                    </label>`
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let first_half = _this.checkWeekHolidayForTable(full.weeks, 'first_half', 2) == true ? 'checked' : '';
            let second_half = _this.checkWeekHolidayForTable(full.weeks, 'second_half', 2) == true ? 'checked' : '';

            return `<label class="ckbox full-opacity">
                      <input disabled type="checkbox" `+ first_half + `>
                      <span>First Half</span>
                    </label>
                    <label class="ckbox full-opacity mb-0">
                      <input disabled type="checkbox" `+ second_half + `>
                      <span>Second Half</span>
                    </label>`
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let first_half = _this.checkWeekHolidayForTable(full.weeks, 'first_half', 3) == true ? 'checked' : '';
            let second_half = _this.checkWeekHolidayForTable(full.weeks, 'second_half', 3) == true ? 'checked' : '';

            return `<label class="ckbox full-opacity">
                      <input disabled type="checkbox" `+ first_half + `>
                      <span>First Half</span>
                    </label>
                    <label class="ckbox full-opacity mb-0">
                      <input disabled type="checkbox" `+ second_half + `>
                      <span>Second Half</span>
                    </label>`
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let first_half = _this.checkWeekHolidayForTable(full.weeks, 'first_half', 4) == true ? 'checked' : '';
            let second_half = _this.checkWeekHolidayForTable(full.weeks, 'second_half', 4) == true ? 'checked' : '';

            return `<label class="ckbox full-opacity">
                      <input disabled type="checkbox" `+ first_half + `>
                      <span>First Half</span>
                    </label>
                    <label class="ckbox full-opacity mb-0">
                      <input disabled type="checkbox" `+ second_half + `>
                      <span>Second Half</span>
                    </label>`
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let first_half = _this.checkWeekHolidayForTable(full.weeks, 'first_half', 5) == true ? 'checked' : '';
            let second_half = _this.checkWeekHolidayForTable(full.weeks, 'second_half', 5) == true ? 'checked' : '';

            return `<label class="ckbox full-opacity">
                      <input disabled type="checkbox" `+ first_half + `>
                      <span>First Half</span>
                    </label>
                    <label class="ckbox full-opacity mb-0">
                      <input disabled type="checkbox" `+ second_half + `>
                      <span>Second Half</span>
                    </label>`
          },
          orderable: false,
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

  checkWeekHolidayForTable(res: any, type: any, weeknumber: any) {
    let flag: boolean = false;
    for (const key in res) {
      if (Object.prototype.hasOwnProperty.call(res, key)) {
        const element = res[key];

        if (weeknumber == key) {
          if (element[type] == 'yes') {
            flag = true
          } else {
            flag = false
          }
        }
      }
    }

    return flag;
  }

  getSelectedHolidayWeekChecked() {
    let obj: any = {};

    for (let index = 1; index <= 5; index++) {
      let first_half = "no";
      let second_half = "no";

      $('input[name="weekday' + index + '"]').each(function () {
        if ($(this).prop('checked') == true) {
          if ($(this).val() == 'first_half') {
            first_half = "yes";
          }

          if ($(this).val() == 'second_half') {
            second_half = "yes";
          }
        }
      })

      obj[index] = {
        'first_half': first_half,
        'second_half': second_half,
      };
    }


    return obj;
  }

  resetAllHolidayWeekCheckbox() {
    $('.week-checkbox:checked').each(function () {
      $(this).prop('checked', false)
    });
  }

  selectHolidayCheckboxForEdit(weeks: any) {
    this.resetAllHolidayWeekCheckbox();

    for (const key in weeks) {
      if (Object.prototype.hasOwnProperty.call(weeks, key)) {
        const element = weeks[key];

        for (const type in element) {
          if (Object.prototype.hasOwnProperty.call(element, type)) {
            const flag = element[type];

            if (flag == 'yes') {
              $('input[name="weekday' + key + '"][value="' + type + '"]').prop('checked', true);
            }
          }
        }
      }
    }
  }
}
