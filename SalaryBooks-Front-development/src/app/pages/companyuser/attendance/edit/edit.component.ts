import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';
import { CompanyuserTableFilterComponent } from '../../includes/table-filter/table-filter.component';
import { saveAs } from 'file-saver';

@Component({
  selector: 'companyuser-app-attendance-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
})
export class CMPAttendanceEditComponent implements OnInit {
  @ViewChild(CompanyuserTableFilterComponent)
  filterTableComponent: CompanyuserTableFilterComponent;

  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();

  csvImportForm: UntypedFormGroup;
  filterForm: UntypedFormGroup;
  attendanceForm: UntypedFormGroup;
  timeAttendanceForm: UntypedFormGroup;

  monthMaster: any[] = [];
  yearMaster: any[] = [];
  attendanceTypeMaster: any[] = [];
  attendanceStatMaster: any[] = [];
  weekMaster: any[] = [];
  monthDaysArr: any[] = [];

  employees: any[] = [];
  editActionId: String;

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  employeeIdBucket: any[] = [];
  csvFailedIds: any[] = [];

  sheetType: any = null;

  shiftData: any = {
    shift_id: '',
    shift_name: '',
    shift_start_time: '',
    shift_end_time: '',
    shift2_start_time: '',
    shift2_end_time: '',
  };

  constructor(
    private titleService: Title,
    private toastr: ToastrService,
    protected companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    public formBuilder: UntypedFormBuilder,
    private datePipe: DatePipe
  ) {
    this.csvImportForm = formBuilder.group({
      attendance_month: [null, Validators.compose([Validators.required])],
      attendance_year: [null, Validators.compose([Validators.required])],
      attendance_type: [null, Validators.compose([Validators.required])],
      file: [null, Validators.compose([Validators.required])],
      file_source: [null, Validators.compose([Validators.required])],
    });

    this.filterForm = formBuilder.group({
      month: [null, Validators.compose([Validators.required])],
      year: [null, Validators.compose([Validators.required])],
      attendance_type: [null, Validators.compose([Validators.required])],

      designation_id: [null, Validators.compose([])],
      department_id: [null, Validators.compose([])],
      branch_id: [null, Validators.compose([])],
      hod_id: [null, Validators.compose([])],
    });

    this.attendanceForm = formBuilder.group({
      attendance_date: [null, Validators.compose([Validators.required])],
      login_time: [null, Validators.compose([Validators.required])],
      logout_time: [null, Validators.compose([Validators.required])],
      total_logged_in: [null, Validators.compose([Validators.required])],
      total_break_time: [0],
      break_time: this.formBuilder.array([]),
      attendance_stat: [null, Validators.compose([Validators.required])],
    });

    this.timeAttendanceForm = formBuilder.group({
      total_logged_in: [null],
      total_break_time: [0],
      break_time: this.formBuilder.array([]),
      attendance_stat: [null, Validators.compose([Validators.required])],

      attendance_id: [null, Validators.compose([])],
      emp_id: [null, Validators.compose([])],
      date: [null, Validators.compose([])],

      shift_timing: [null],
      break_shift: [null],
      login_time: [null],
      logout_time: [null],
      shift1_start_time: [null],
      shift1_end_time: [null],
      shift2_start_time: [null],
      shift2_end_time: [null],
    });

    this.monthMaster = Global.monthMaster;
    this.weekMaster = Global.weekMaster;
    this.attendanceTypeMaster = Global.attendanceTypeMaster;

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }

    this.attendanceStatMaster = [
      // { value: 'P', description: "Present (P)", abbreviation: "P" },
      // { value: 'A', description: "Absent (A)", abbreviation: "A" },
      // { value: 'ot', description: "Overtime (OT)", abbreviation: "OT" },
      // { value: 'cl', description: "Casual Leave (CL)", abbreviation: "CL" },
      // { value: 'pl', description: "Paid Leave (PL)", abbreviation: "PL" },
      // { value: 'hl', description: "Holiday (HL)", abbreviation: "HL" },
      // { value: 'wo', description: "Weekly Off (WO)", abbreviation: "WO" },

      // { value: 'PDL', description: "PDL", abbreviation: "PDL" },
      // { value: 'A', description: "A", abbreviation: "A" },
      // { value: 'ot', description: "ot", abbreviation: "ot" },
      // { value: 'CSL', description: "CSL", abbreviation: "CSL" },
      // { value: 'PVL', description: "PVL", abbreviation: "PVL" },
      // { value: 'ERL', description: "ERL", abbreviation: "ERL" },
      // { value: 'SKL', description: "SKL", abbreviation: "SKL" },
      // { value: 'MDL', description: "MDL", abbreviation: "MDL" },
      // { value: 'MTL', description: "MTL", abbreviation: "MTL" },
      // { value: 'PTL', description: "PTL", abbreviation: "PTL" },
      // { value: 'ANL', description: "ANL", abbreviation: "ANL" },
      // { value: 'AWP', description: "AWP", abbreviation: "AWP" },
      // { value: 'UWP', description: "UWP", abbreviation: "UWP" },
      // { value: 'LE1', description: "LE1", abbreviation: "LE1" },
      // { value: 'LE2', description: "LE2", abbreviation: "LE2" },
      // { value: 'LP1', description: "LP1", abbreviation: "LP1" },
      // { value: 'LP2', description: "LP2", abbreviation: "LP2" },
      // { value: 'wo', description: "wo", abbreviation: "wo" },

      { value: 'PDL', description: 'PDL', abbreviation: 'PDL' },
      { value: 'A', description: 'A', abbreviation: 'A' },
      { value: 'P', description: 'P', abbreviation: 'P' },
      { value: 'L', description: 'L', abbreviation: 'L' },
      { value: 'H', description: 'H', abbreviation: 'H' },
      { value: 'OT', description: 'OT', abbreviation: 'OT' },
      { value: 'CSL', description: 'CSL', abbreviation: 'CSL' },
      { value: 'PVL', description: 'PVL', abbreviation: 'PVL' },
      { value: 'ERL', description: 'ERL', abbreviation: 'ERL' },
      { value: 'SKL', description: 'SKL', abbreviation: 'SKL' },
      { value: 'MDL', description: 'MDL', abbreviation: 'MDL' },
      { value: 'MTL', description: 'MTL', abbreviation: 'MTL' },
      { value: 'PTL', description: 'PTL', abbreviation: 'PTL' },
      { value: 'ANL', description: 'ANL', abbreviation: 'ANL' },
      { value: 'AWP', description: 'AWP', abbreviation: 'AWP' },
      { value: 'UWP', description: 'UWP', abbreviation: 'UWP' },
      { value: 'LE1', description: 'LE1', abbreviation: 'LE1' },
      { value: 'LE2', description: 'LE2', abbreviation: 'LE2' },
      { value: 'LP1', description: 'LP1', abbreviation: 'LP1' },
      { value: 'LP2', description: 'LP2', abbreviation: 'LP2' },
      { value: 'WO', description: 'WO', abbreviation: 'WO' },
    ];

    this.editActionId = '';

    this.timeAttendanceForm.get('login_time')?.valueChanges.subscribe((val) => {
      setTimeout(() => {
        this.caluclateAttendanceLogginTime(this.timeAttendanceForm);
      }, 100);
    });
    this.timeAttendanceForm
      .get('logout_time')
      ?.valueChanges.subscribe((val) => {
        setTimeout(() => {
          this.caluclateAttendanceLogginTime(this.timeAttendanceForm);
        }, 100);
      });
    this.timeAttendanceForm
      .get('shift1_start_time')
      ?.valueChanges.subscribe((val) => {
        setTimeout(() => {
          this.caluclateAttendanceLogginTime(this.timeAttendanceForm);
        }, 100);
      });
    this.timeAttendanceForm
      .get('shift1_end_time')
      ?.valueChanges.subscribe((val) => {
        setTimeout(() => {
          this.caluclateAttendanceLogginTime(this.timeAttendanceForm);
        }, 100);
      });
    this.timeAttendanceForm
      .get('shift2_start_time')
      ?.valueChanges.subscribe((val) => {
        setTimeout(() => {
          this.caluclateAttendanceLogginTime(this.timeAttendanceForm);
        }, 100);
      });
    this.timeAttendanceForm
      .get('shift2_end_time')
      ?.valueChanges.subscribe((val) => {
        setTimeout(() => {
          this.caluclateAttendanceLogginTime(this.timeAttendanceForm);
        }, 100);
      });
    this.timeAttendanceForm
      .get('total_break_time')
      ?.valueChanges.subscribe((val) => {
        setTimeout(() => {
          this.caluclateAttendanceLogginTime(this.timeAttendanceForm);
        }, 100);
      });

    this.timeAttendanceForm
      .get('shift_timing')
      ?.valueChanges.subscribe((val) => {
        if (val == 'yes') {
          this.timeAttendanceForm.get('login_time')?.clearValidators();
          this.timeAttendanceForm.get('logout_time')?.clearValidators();

          //   this.timeAttendanceForm
          //     .get('shift1_start_time')
          //     ?.setValidators([Validators.required]);
          //   this.timeAttendanceForm
          //     .get('shift1_end_time')
          //     ?.setValidators([Validators.required]);
          // } else {
          //   this.timeAttendanceForm
          //     .get('login_time')
          //     ?.setValidators([Validators.required]);
          //   this.timeAttendanceForm
          //     .get('logout_time')
          //     ?.setValidators([Validators.required]);

          // this.timeAttendanceForm.get('shift1_start_time')?.clearValidators();
          // this.timeAttendanceForm.get('shift1_end_time')?.clearValidators();

          // this.timeAttendanceForm.get('shift2_start_time')?.clearValidators();
          // this.timeAttendanceForm.get('shift2_end_time')?.clearValidators();
          // this.timeAttendanceForm
          //   .get('shift2_start_time')
          //   ?.updateValueAndValidity();
          // this.timeAttendanceForm
          //   .get('shift2_end_time')
          //   ?.updateValueAndValidity();
        }

        // this.timeAttendanceForm.get('login_time')?.updateValueAndValidity();
        // this.timeAttendanceForm.get('logout_time')?.updateValueAndValidity();
        // this.timeAttendanceForm
        //   .get('shift1_start_time')
        //   ?.updateValueAndValidity();
        // this.timeAttendanceForm
        //   .get('shift1_end_time')
        //   ?.updateValueAndValidity();
      });

    this.timeAttendanceForm
      .get('break_shift')
      ?.valueChanges.subscribe((val) => {
        // if (val == 'yes') {
        //   this.timeAttendanceForm
        //     .get('shift2_start_time')
        //     ?.setValidators([Validators.required]);
        //   this.timeAttendanceForm
        //     .get('shift2_end_time')
        //     ?.setValidators([Validators.required]);
        // } else {
        //   this.timeAttendanceForm.get('shift2_start_time')?.clearValidators();
        //   this.timeAttendanceForm.get('shift2_end_time')?.clearValidators();
        // }
        // this.timeAttendanceForm
        //   .get('shift2_start_time')
        //   ?.updateValueAndValidity();
        // this.timeAttendanceForm
        //   .get('shift2_end_time')
        //   ?.updateValueAndValidity();
      });

    this.attendanceForm.get('login_time')?.valueChanges.subscribe((val) => {
      setTimeout(() => {
        this.caluclateAttendanceLogginTime(this.attendanceForm);
      }, 100);
    });
    this.attendanceForm.get('logout_time')?.valueChanges.subscribe((val) => {
      setTimeout(() => {
        this.caluclateAttendanceLogginTime(this.attendanceForm);
      }, 100);
    });
    this.attendanceForm
      .get('total_break_time')
      ?.valueChanges.subscribe((val) => {
        setTimeout(() => {
          this.caluclateAttendanceLogginTime(this.attendanceForm);
        }, 100);
      });
  }

  caluclateAttendanceLogginTime(formGroup: UntypedFormGroup) {
    if (
      formGroup.get('login_time')?.valid &&
      formGroup.get('logout_time')?.valid
      //  && formGroup.get('total_break_time')?.valid
    ) {
      let login_time: any = new Date(
        `1999-07-13 ${formGroup.get('login_time')?.value}`
      ).getHours();
      let logout_time: any = new Date(
        `1999-07-13 ${formGroup.get('logout_time')?.value}`
      ).getHours();

      let diffInHours = logout_time - login_time;
      if (diffInHours < 0) {
        diffInHours = 24 + diffInHours;
      }

      if (formGroup == this.timeAttendanceForm) {
        if (formGroup?.get('shift_timing')?.value == 'yes') {
          let shift1_start_time = 0;
          let shift1_end_time = 0;
          let shift2_start_time = 0;
          let shift2_end_time = 0;

          shift1_start_time = new Date(
            `1999-07-13 ${formGroup.get('shift1_start_time')?.value}`
          ).getHours();
          shift1_end_time = new Date(
            `1999-07-13 ${formGroup.get('shift1_end_time')?.value}`
          ).getHours();

          diffInHours = shift1_end_time - shift1_start_time;
          if (diffInHours < 0) {
            diffInHours = 24 + diffInHours;
          }

          if (formGroup?.get('break_shift')?.value == 'yes') {
            shift2_start_time = new Date(
              `1999-07-13 ${formGroup.get('shift2_start_time')?.value}`
            ).getHours();
            shift2_end_time = new Date(
              `1999-07-13 ${formGroup.get('shift2_end_time')?.value}`
            ).getHours();

            let shift2diffInHours = shift2_end_time - shift2_start_time;
            if (shift2diffInHours < 0) {
              shift2diffInHours = 24 + shift2diffInHours;
            }

            diffInHours += shift2diffInHours;
          }
        }
      }

      diffInHours = diffInHours ? diffInHours : 0;

      const total_break_time = formGroup.get('total_break_time')?.value ?? 0;

      formGroup
        .get('total_logged_in')
        ?.setValue(diffInHours);
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle(
      'Edit | Attendance Management - ' + Global.AppName
    );

    setTimeout(() => {
      this.filterPayload = {
        month:
          this.filterTableComponent.monthMaster?.find((obj: any) => {
            return obj.index == new Date().getMonth();
          }) ?? null,

        year:
          this.filterTableComponent.yearMaster?.find((obj: any) => {
            return obj.value == new Date().getFullYear();
          }) ?? null,

        attendance_type:
          this.filterTableComponent.attendanceTypeMaster.find((obj: any) => {
            return obj.value == 'monthly';
          }) ?? null,
      };

      this.filterTableComponent.setFormControlValue({
        refresh: false,
        payload: this.filterPayload,
      });

      this.fetch();
      this.sheetType = 'monthly';
    });
  }

  initTemplateRows(type: any, data: any = {}) {
    switch (type) {
      case 'break_time':
        return this.formBuilder.group({
          break_stime: [
            data.break_stime ?? null,
            Validators.compose([Validators.required]),
          ],
          break_etime: [
            data.break_etime ?? null,
            Validators.compose([Validators.required]),
          ],
          total_break_time: [
            data.total_break_time ?? null,
            Validators.compose([Validators.required]),
          ],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  getTemplateRows(formGroup: UntypedFormGroup, type: any) {
    return (formGroup.get(type) as UntypedFormArray).controls;
  }

  removeTemplateRow(formGroup: UntypedFormGroup, type: any, i: number) {
    const control = <UntypedFormArray>formGroup.get(type);
    control.removeAt(i);
  }

  addTemplateRows(formGroup: UntypedFormGroup, type: any, data: any = {}) {
    const control = <UntypedFormArray>formGroup.get(type);
    control.push(this.initTemplateRows(type, data));

    Global.loadCustomScripts('customJsScript');
  }

  resetAllTemplateRows(formGroup: UntypedFormGroup, isEditing: any = false) {
    let arr = ['break_time'];
    arr.forEach((element) => {
      const control = <UntypedFormArray>formGroup.get(element);
      control.clear();
    });

    if (isEditing == false) {
      arr.forEach((element) => {
        this.addTemplateRows(formGroup, element);
      });
    }
  }

  openCsvImportModal() {
    if (!Global.isCreditAvailable('company_user')) {
      this.toastr.error(
        "You don't have sufficient credit value to import attendance"
      );
      return;
    }

    Global.resetForm(this.csvImportForm);
    $('#csvImportModalButton').click();
  }

  async getSampleCsv(event: any) {
    try {
      if (
        !this.csvImportForm.get('attendance_month')?.valid &&
        !this.csvImportForm.get('attendance_year')?.valid &&
        !this.csvImportForm.get('attendance_type')?.valid
      ) {
        return;
      }

      event.target.classList.add('btn-loading');
      let payload = {
        attendance_month: this.csvImportForm.value.attendance_month?.index ?? '',
        attendance_year:this.csvImportForm.value.attendance_year?.value ?? '',
        register_type: this.csvImportForm.value.attendance_type?.value ?? '',
      }

     let sf = Global.monthMaster.find(m => m.index == payload.attendance_month)?.sf

      await this.companyuserService.downloadFile('export-sample-attendance-file', `attendance_${payload.register_type}-${payload.attendance_year}-${sf}.xlsx`, payload);
      
      // saveAs(file, 'Attendance-Sample');
      event.target.classList.remove('btn-loading');
      
    } catch (err: any) {
      event.target.classList.remove('btn-loading');
      this.toastr.error(err.message);
    }
  }

  // getSampleCsv(event: any) {
  //   if (
  //     this.csvImportForm.get('attendance_month')?.valid &&
  //     this.csvImportForm.get('attendance_year')?.valid &&
  //     this.csvImportForm.get('attendance_type')?.valid
  //   ) {
  //     event.target.classList.add('btn-loading');
  //     this.companyuserService
  //       .getAttendanceDataImportSample({
  //         attendance_month:
  //           this.csvImportForm.value.attendance_month?.index ?? '',
  //         attendance_year:
  //           this.csvImportForm.value.attendance_year?.value ?? '',
  //         register_type: this.csvImportForm.value.attendance_type?.value ?? '',
  //       })
  //       .subscribe(
  //         (res) => {
  //           event.target.classList.remove('btn-loading');
  //           if (res.status == 'success') {
  //           } else {
  //             this.toastr.error(res.message);
  //           }
  //         },
  //         (err) => {
  //           event.target.classList.remove('btn-loading');
  //           this.toastr.error(Global.showServerErrorMessage(err));
  //         }
  //       );
  //   }
  // }

  importCsv(event: any) {
    if (!Global.isCreditAvailable('company_user')) {
      this.toastr.error(
        "You don't have sufficient credit value to import attendance"
      );
      return;
    }

    if (this.csvImportForm.valid) {
      event.target.classList.add('btn-loading');
      this.csvFailedIds = [];
      this.companyuserService
        .importAttendanceData({
          attendance_month:
            this.csvImportForm.value.attendance_month?.index ?? '',
          attendance_year:
            this.csvImportForm.value.attendance_year?.value ?? '',
          register_type: this.csvImportForm.value.attendance_type?.value ?? '',
          attendance_date: this.csvImportForm.value.file
            ? this.csvImportForm.value.file_source
            : '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              Global.resetForm(this.csvImportForm);
              this.toastr.success(res.message);
              $('#csvImportModal').find('[data-dismiss="modal"]').click();
              this.fetch();

              this.csvFailedIds = res.failed_entry ?? [];
              if (this.csvFailedIds.length > 0) {
                this.toastr.warning(
                  'Please check the CSV few of the Employee ID is incorrect'
                );
                $('#csvFailedIdModalButton')?.click();
              }
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

  onFileChanged(
    event: any,
    formGroup: UntypedFormGroup,
    file: any,
    target: any
  ) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      formGroup.patchValue({
        [target]: file,
      });
    }
  }

  filterPayload: any = {};
  filterTable(payload: any) {
    this.filterPayload = payload;
    this.fetch({ page: 1 });
  }

  fetch({
    page = <any>null,
    options = <TableFiilterOptions>this.tableFilterOptions,
  } = {}) {
    console.log(options);
    
    if (page != null) {
      this.paginationOptions.page = page;
    }

    this.tableFilterOptions = options;

    this.spinner.show();

    this.companyuserService
      .fetchAttendanceData({
        pageno: this.paginationOptions.page,
        perpage: this.tableFilterOptions.length,
        search_month: this.filterPayload.month?.index ?? '',
        search_year: this.filterPayload.year?.value ?? '',
        attendance_type: this.filterPayload?.attendance_type?.value ?? '',
        branch_id: this.filterPayload?.branch_id ?? '',
        designation_id: this.filterPayload?.designation_id ?? '',
        department_id: this.filterPayload?.department_id ?? '',
        hod_id: this.filterPayload?.hod_id ?? '',
        client_id: this.filterPayload?.client_id ?? '',
        searchkey:options.searchkey
      })
      .subscribe(
        (res) => {
          if (res.status == 'success') {
            var docs: any[] = res?.employees?.docs;

            docs.forEach((doc: any) => {
              doc.checked = this.isRowChecked(doc._id);
            });

            /**
             * ==================
             * Checking Leap Year
             * ==================
             * ==================
             */

            let year = this.filterPayload.year?.value;
            let febMonth = this.monthMaster.find((obj: any) => {
              return obj.index == 1;
            });

            if (febMonth) {
              let index = this.monthMaster.indexOf(febMonth);

              febMonth.days = 28;
              if (year % 4 == 0) {
                febMonth.days = 29;
              }

              this.monthMaster[index] = febMonth;
            }

            this.shuffleMonthDaysArr();

            this.employees = docs;
            this.paginationOptions = {
              hasNextPage: res.employees.hasNextPage,
              hasPrevPage: res.employees.hasPrevPage,
              limit: res.employees.limit,
              nextPage: res.employees.nextPage,
              page: res.employees.page,
              pagingCounter: res.employees.pagingCounter,
              prevPage: res.employees.prevPage,
              totalDocs: res.employees.totalDocs,
              totalPages: res.employees.totalPages,
            };
          } else if (res.status == 'val_err') {
            this.toastr.error(Global.showValidationMessage(res.val_msg));
            this.employees = [];
            this.paginationOptions = Global.resetPaginationOption();

            this.rowCheckedAll = false;
            this.checkedRowIds = [];
            this.uncheckedRowIds = [];
          } else {
            this.toastr.error(res.message);
            this.employees = [];
            this.paginationOptions = Global.resetPaginationOption();

            this.rowCheckedAll = false;
            this.checkedRowIds = [];
            this.uncheckedRowIds = [];
          }

          this.sheetType = this.filterPayload?.attendance_type?.value ?? '';
          this.spinner.hide();
        },
        (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.spinner.hide();
          this.employees = [];
          this.paginationOptions = Global.resetPaginationOption();

          this.rowCheckedAll = false;
          this.checkedRowIds = [];
          this.uncheckedRowIds = [];

          this.sheetType = this.filterPayload?.attendance_type?.value ?? '';
        }
      );
  }

  shuffleMonthDaysArr() {
    this.monthDaysArr = [];
    let selectedmonth: any = this.filterPayload.month;
    let selectedyear: any = this.filterPayload.year;

    if (selectedmonth && selectedyear) {
      for (let i = 1; i <= selectedmonth.days; i++) {
        const d = new Date(
          selectedmonth.description + ' ' + i + ', ' + selectedyear.description
        );

        this.monthDaysArr.push({
          date_obj: d,
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          weekday:
            this.weekMaster.find((obj: any) => {
              return obj.value == d.getDay();
            })?.prefix ?? null,
        });
      }
    }
  }

  checkAttendance(
    attendance: any[],
    date: any,
    attstat_key: any = 'attendance_stat'
  ) {
    attendance.forEach((element) => {
      element.attendance_day = new Date(element.attendance_date).getDate();
    });

    let tempAttendance: any = '-';

    /** CHECK IS THE ATTENDANCE EXIST */
    let obj = attendance.find((obj: any) => {
      return obj.attendance_day == date.day;
    });

    switch (attstat_key) {
      case 'total_logged_in':
        if (obj && obj.hasOwnProperty(attstat_key)) {
          return obj[attstat_key] ?? '-';
        }
        break;
    }

    tempAttendance =
      this.attendanceStatMaster.find((asmItem: any) => {
        if (obj && obj.hasOwnProperty(attstat_key)) {
          return asmItem.value == (obj[attstat_key] ?? null);
        } else {
          return null;
        }
      })?.abbreviation ?? '-';

    if ([null, 'null'].includes(tempAttendance)) {
      tempAttendance = '-';
    }

    return tempAttendance;
  }

  getEdit(item: any) {
    this.editActionId = item._id;
  }

  cancelEdit() {
    this.editActionId = '';
  }

  cancelEditAndReset() {}

  isEditing(item: any) {
    if (this.editActionId == item._id) {
      return true;
    } else {
      return false;
    }
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

    this.fetch();
  }

  async openEditAttendanceModal(type: any, employee_id: any = null) {
    if (this.getSelectedEmployees().length > 0) {
      Global.resetForm(this.attendanceForm);
      this.resetAllTemplateRows(this.attendanceForm, true);
      this.employeeIdBucket = [];

      if (type == 'single') {
        this.employeeIdBucket.push(employee_id);

        if (this.employeeIdBucket.length < 0) {
          this.toastr.warning('No Employee IDs available for the Operation');
        }
      }

      $('#editAttendanceModalButton').click();
    }
  }

  getSelectedEmployees(key: any = '_id', reurntype: any = 'rawarray') {
    let employee_ids: any[] = [];
    if (this.rowCheckedAll) {
      this.employees.forEach((element: any) => {
        if (!this.uncheckedRowIds.includes(element._id)) {
          employee_ids.push(element._id);
        }
      });
    } else {
      employee_ids = this.checkedRowIds;
    }

    if (employee_ids.length > 0) {
      let res: any = [];

      employee_ids.forEach((employee_id) => {
        let emp =
          this.employees.find((obj: any) => {
            return obj._id == employee_id;
          }) ?? null;

        if (emp) {
          if (reurntype == 'rawarray') {
            res.push(emp[key]);
          } else if (reurntype == 'keyvalue') {
            res.push({
              [key]: emp[key],
            });
          }
        }
      });

      // console.log(res);
      return res;
    } else {
      // console.log(employee_ids);
      return employee_ids;
    }
  }

  submitEmployeeAttendance(event: any) {
    // console.log(this.datePipe.transform(this.attendanceForm.value.attendance_date, 'yyyy-MM-dd'));

    // console.log('this.attendanceForm.value.attendance_date: ', this.datePipe.transform(this.attendanceForm.value.attendance_date, 'yyyy-MM-ddY'))
    // return;

    if (this.attendanceForm.valid) {
      // let emp_data = this.getSelectedEmployees('emp_id', 'keyvalue');
      // if (!emp_data || emp_data.length == 0) {
      //     this.toastr.error("Please select atleast one Employee to continue");
      //     return;
      // }

      event.target.classList.add('btn-loading');

      this.companyuserService
        .submitEmployeeBulkAttendance({
          register_type: this.sheetType,
          // 'emp_data': JSON.stringify(emp_data),
          row_checked_all: this.rowCheckedAll,
          checked_row_ids: JSON.stringify(this.checkedRowIds),
          unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
          attendance_date: this.attendanceForm.value.attendance_date ?? '',
          // 'attendance_date': this.attendanceForm.value.attendance_date ? this.datePipe.transform(this.attendanceForm.value.attendance_date, 'yyyy-MM-dd') : "",
          login_time: this.attendanceForm.value.login_time ?? '',
          logout_time: this.attendanceForm.value.logout_time ?? '',
          total_logged_in: this.attendanceForm.value.total_logged_in ?? '',
          total_break_time: this.attendanceForm.value.total_break_time ?? '',
          break_time: JSON.stringify(this.attendanceForm.value.break_time),
          attendance_stat:
            this.attendanceForm.value.attendance_stat?.value ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.resetTemplate();
              this.toastr.success(res.message);
              $('#editAttendanceModal').find('[data-dismiss="modal"]').click();
              this.fetch();
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

  approveAttendance() {
    if (
      this.rowCheckedAll == false &&
      this.checkedRowIds.length == 0 &&
      this.uncheckedRowIds.length == 0
    ) {
      return;
    }
    let payload: any = {
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      attendance_year: this.filterPayload.year?.value,
      attendance_month: this.filterPayload.month?.index,
      register_type: this.sheetType,
    };

    if (
      payload.attendance_year !== undefined &&
      payload.attendance_month !== undefined
    ) {
      swal
        .fire({
          title: 'Are you sure want to approve?',
          text:
            'On proceeding you will approve the attendance of selected employees for ' +
            this.filterPayload.month?.description +
            ' ' +
            this.filterPayload.year?.description +
            '. You will not be able to reverse this action!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, approve it!',
          cancelButtonText: 'No, cancel it',
        })
        .then((result) => {
          if (result.value) {
            this.spinner.show();
            this.companyuserService.submitEmployeeApproval(payload).subscribe(
              (res) => {
                if (res.status == 'success') {
                  this.toastr.success(res.message);
                  this.fetch();
                } else {
                  this.toastr.error(res.message);
                }

                this.spinner.hide();
              },
              (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                this.spinner.hide();
              }
            );
          } else if (result.dismiss === swal.DismissReason.cancel) {
            swal.fire('Cancelled', 'Approval action cancelled :)', 'error');
          }
        });
    } else {
      this.toastr.error('Re-Filter the data');
    }

    // unchecked_row_ids:[]
    // checked_row_ids:[]
    // row_checked_all:true
    // attendance_year:2021
    // attendance_month:11
  }

  singleAttendanceEdit(
    attendance: any[],
    date: any,
    event: any,
    data: any = null
  ) {
    let document: any = {};
    let emp = data.full ?? null;

    if (!['monthly'].includes(this.sheetType)) {
      attendance.forEach((element) => {
        element.attendance_day = new Date(element.attendance_date).getDate();
      });

      /** CHECK IS THE ATTENDANCE EXIST */
      let attData: any = attendance.find((obj: any) => {
        return obj.attendance_day == date.day;
      });

      document = {
        attendance_id: attData?._id ?? '',
        date: date,
        register_type: this.sheetType,
        emp_id: emp?.emp_id ?? '',
        attendance_date: this.datePipe.transform(date.date_obj, 'yyyy-MM-dd'),
      };
    } else {
      document = {
        attendance_year: this.filterPayload.year?.value ?? '',
        attendance_month: this.filterPayload.month?.index ?? '',
        emp_id: emp?.emp_id ?? '',
        register_type: this.sheetType,
      };
    }

    switch (this.sheetType) {
      case 'halfday':
        if (!data.key || !['first_half', 'second_half'].includes(data.key)) {
          this.toastr.error('First Half or Second Half data is required');
          return;
        }

        document.first_half = data.first_half == '-' ? 'P' : data.first_half;
        document.second_half = data.second_half == '-' ? 'P' : data.second_half;
        document.attendance_stat = 'P';

        document[data.key] = event.target.value;
        break;

      case 'monthly':
        let monthly_attendance: any = {};

        const ele = $('#emp-row-' + document.emp_id);

        const availFields = [
          'paydays',
          'total_absent',
          'total_attendance',
          'total_cl',
          'total_gl',
          'total_hl',
          'total_kb',
          'total_lop',
          'total_ml',
          'total_overtime',
          'total_pl',
          'adjust_day',
          'total_late',
          'total_wo',
        ];
        availFields.forEach((f: any) => {
          monthly_attendance[f] = $(ele).find(`[name="${f}"]`)?.val() ?? 0;
        });

        document.monthly_attendance = JSON.stringify(monthly_attendance);
        break;

      // case 'time':
      //   document = {
      //     attendance_id : attData?.id ?? "",
      //     register_type: this.sheetType,
      //     date: date,
      //     attendance_stat: 'P'
      //   }
      //   break;

      default:
        document.attendance_stat = event.target.value;
        break;
    }
    // console.log(data);

    this.spinner.show();
    this.companyuserService.updateSingleEmployeeAttendance(document).subscribe(
      (res) => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.fetch();
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.spinner.hide();
      }
    );
  }

  initAttedanceEdit(
    item: any,
    date: any,
    emp_id: any,
    emp_details: any = null
  ) {
    switch (this.sheetType) {
      case 'time':
        item.forEach((element: any) => {
          element.attendance_day = new Date(element.attendance_date).getDate();
        });
        this.shiftData.shift_id = emp_details?.shift_data?._id;

        /** CHECK IS THE ATTENDANCE EXIST */
        let attendance = item.find((obj: any) => {
          return obj.attendance_day == date.day;
        });

        Global.resetForm(this.timeAttendanceForm);
        this.resetAllTemplateRows(this.timeAttendanceForm, true);

        this.timeAttendanceForm.patchValue({
          login_time: attendance?.login_time.padStart(5,"0") ?? null,
          logout_time: attendance?.logout_time.padStart(5,"0") ?? null,
          shift1_start_time: attendance?.shift1_start_time ?? null,
          shift1_end_time: attendance?.shift1_end_time ?? null,
          shift2_start_time: attendance?.shift2_start_time ?? null,
          shift2_end_time: attendance?.shift2_end_time ?? null,
          total_logged_in: attendance?.total_logged_in ?? null,
          total_break_time: attendance?.total_break_time ?? null,
          attendance_stat:
            this.attendanceStatMaster.find((obj: any) => {
              return obj.value == attendance?.attendance_stat;
            }) ?? null,

          attendance_id: attendance?._id ?? null,
          emp_id: emp_id,
          date: this.datePipe.transform(
            Date.parse(date.date_obj),
            'yyyy-MM-dd'
          ),
        });

        if (
          emp_details?.shift &&
          new Date(Date.parse(date.date_obj)).getTime() <=
            new Date(emp_details?.shift?.shift_end_date).getTime() &&
          new Date(Date.parse(date.date_obj)).getTime() >=
            new Date(emp_details?.shift?.shift_start_date).getTime()
        ) {
          this.timeAttendanceForm.get('shift_timing')?.setValue('yes');

          this.timeAttendanceForm
            .get('shift1_start_time')
            ?.setValidators([Validators.required]);
          this.timeAttendanceForm
            .get('shift1_end_time')
            ?.setValidators([Validators.required]);

          // this.shiftData = {
          this.shiftData['shift_name'] = emp_details?.shift_data?.shift_name;
          this.shiftData['shift_start_time'] =
            emp_details?.shift_data?.shift1_start_time;
          this.shiftData['shift_end_time'] =
            emp_details?.shift_data?.shift1_end_time;
          // };

          // console.log(this.shiftData);

          if (emp_details?.shift_data?.break_shift == 'yes') {
            this.timeAttendanceForm.get('break_shift')?.setValue('yes');
            this.timeAttendanceForm
              .get('shift2_start_time')
              ?.setValidators([Validators.required]);
            this.timeAttendanceForm
              .get('shift2_end_time')
              ?.setValidators([Validators.required]);
            this.shiftData['shift2_start_time'] =
              emp_details.shift_data.shift2_start_time;
            this.shiftData['shift2_end_time'] =
              emp_details.shift_data.shift2_end_time;
          } else {
            this.timeAttendanceForm.get('break_shift')?.setValue('no');
            this.timeAttendanceForm.get('shift2_start_time')?.clearValidators();
            this.timeAttendanceForm.get('shift2_end_time')?.clearValidators();
          }
        } else {
          this.timeAttendanceForm.get('shift_timing')?.setValue('no');
          this.timeAttendanceForm.get('break_shift')?.setValue('no');

          this.timeAttendanceForm.get('shift1_start_time')?.clearValidators();
          this.timeAttendanceForm.get('shift1_end_time')?.clearValidators();
          this.timeAttendanceForm.get('shift2_start_time')?.clearValidators();
          this.timeAttendanceForm.get('shift2_end_time')?.clearValidators();
        }

        this.timeAttendanceForm
          .get('shift1_start_time')
          ?.updateValueAndValidity();
        this.timeAttendanceForm
          .get('shift1_end_time')
          ?.updateValueAndValidity();
        this.timeAttendanceForm
          .get('shift2_start_time')
          ?.updateValueAndValidity();
        this.timeAttendanceForm
          .get('shift2_end_time')
          ?.updateValueAndValidity();

        (attendance?.break_time ?? []).forEach((element: any) => {
          this.addTemplateRows(this.timeAttendanceForm, 'break_time', {
            break_stime: element?.break_stime,
            break_etime: element?.break_etime,
            total_break_time: element?.total_break_time,
          });
        });

        $('#editTimeAttendanceModalButton')?.click();
        break;

      default:
        this.toastr.error('Editing not supported');
        return;
    }
  }

  singleTimeAttendanceEdit(event: any) {
    if (this.timeAttendanceForm.valid) {
      let document: any = {
        register_type: this.sheetType,
        total_logged_in: this.timeAttendanceForm.value.total_logged_in,
        total_break_time: this.timeAttendanceForm.value.total_break_time,
        break_time: JSON.stringify(this.timeAttendanceForm.value.break_time),
        attendance_stat: this.timeAttendanceForm.value.attendance_stat?.value,

        attendance_id: this.timeAttendanceForm.value.attendance_id ?? '',
        emp_id: this.timeAttendanceForm.value.emp_id ?? '',
        attendance_date: this.timeAttendanceForm.value.date ?? '',

        shift_timing: this.timeAttendanceForm.value.shift_timing ?? '',
        break_shift: this.timeAttendanceForm.value.break_shift ?? '',
        login_time: this.timeAttendanceForm.value.login_time ?? '',
        logout_time: this.timeAttendanceForm.value.logout_time ?? '',
        shift1_start_time:
          this.timeAttendanceForm.value.shift1_start_time ?? '',
        shift1_end_time: this.timeAttendanceForm.value.shift1_end_time ?? '',
        shift2_start_time:
          this.timeAttendanceForm.value.shift2_start_time ?? '',
        shift2_end_time: this.timeAttendanceForm.value.shift2_end_time ?? '',
        shift_id: this?.shiftData?.shift_id ?? '',
      };

      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateSingleEmployeeAttendance(document)
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.fetch();
              this.toastr.success(res.message);
              $('#editTimeAttendanceModal')
                ?.find('[data-dismiss="modal"]')
                ?.click();
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            this.toastr.error(Global.showServerErrorMessage(err));
            event.target.classList.remove('btn-loading');
          }
        );
    }
  }

  resetTemplate() {
    this.shiftData = {
      shift_id: '',
      shift_name: '',
      shift_start_time: '',
      shift_end_time: '',
      shift2_start_time: '',
      shift2_end_time: '',
    };
    Global.resetForm(this.attendanceForm);
    this.resetAllTemplateRows(this.attendanceForm, true);
  }
}
