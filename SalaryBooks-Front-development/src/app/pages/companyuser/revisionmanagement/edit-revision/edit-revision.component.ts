import * as Global from 'src/app/globals';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'companyuser-app-edit-revision',
  templateUrl: './edit-revision.component.html',
  styleUrls: ['./edit-revision.component.css'],
})
export class CMPEditRevisionComponent implements OnInit {
  Global = Global;
  filterForm: UntypedFormGroup;
  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  hodMaster: any[] = [];
  packageMaster: any[] = [];
  salaryTempMaster: any[] = [];
  monthMaster: any[] = [];
  employees: any[] = [];
  employeesEditing: any[] = [];
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  empRevisionForm: UntypedFormGroup;
  multipleEmpRevisionForm: UntypedFormGroup;
  currentDate: Date = new Date();
  attendanceTypeMaster: any[] = [];
  sheetType: any = null;
  employeeListFilter: any = {};
  rivision_filter: any = {};
  report_type: 'apply_rivision' | 'rivision_history_rp' = 'apply_rivision';
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  MomentObj = moment;
  curruntDate: Date = new Date();

  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private router: Router
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'revision_management',
        company_sub_module: 'apply_revision',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    this.filterForm = formBuilder.group({
      attendance_type: [null, Validators.compose([Validators.required])],
      report_type: [
        'apply_rivision',
        Validators.compose([Validators.required]),
      ],
      month: [null, Validators.compose([Validators.required])],
      year: [null, Validators.compose([Validators.required])],
      department: [null],
      designation: [null],
      branch: [null],
      hod: [null],
    });

    this.empRevisionForm = formBuilder.group({
      gross_salary: [null, Validators.compose([Validators.required])],
      effect_from: [null, Validators.compose([Validators.required])],
      policy_pack_id: [null, Validators.compose([Validators.required])],
      salary_temp_id: [null, Validators.compose([Validators.required])],
      // 'revision_date': [null, Validators.compose([Validators.required])],
      revision_month: [null, Validators.compose([Validators.required])],
      revision_year: [null, Validators.compose([Validators.required])],
    });

    this.multipleEmpRevisionForm = formBuilder.group({
      emp_revision_data: this.formBuilder.array([
        this.initFormRows('emp_revision_data'),
      ]),
    });

    this.attendanceTypeMaster = [
      { value: 'time', description: 'Time' },
      { value: 'wholeday', description: 'Whole Day' },
      { value: 'halfday', description: 'Half Day' },
      { value: 'monthly', description: 'Monthly' },
    ];

    this.monthMaster = [
      { index: 0, value: 1, description: 'January', days: 31 },
      { index: 1, value: 2, description: 'February', days: 28 },
      { index: 2, value: 3, description: 'March', days: 31 },
      { index: 3, value: 4, description: 'April', days: 30 },
      { index: 4, value: 5, description: 'May', days: 31 },
      { index: 5, value: 6, description: 'June', days: 30 },
      { index: 6, value: 7, description: 'July', days: 31 },
      { index: 7, value: 8, description: 'August', days: 31 },
      { index: 8, value: 9, description: 'September', days: 30 },
      { index: 9, value: 10, description: 'October', days: 31 },
      { index: 10, value: 11, description: 'November', days: 30 },
      { index: 11, value: 12, description: 'December', days: 31 },
    ];
    this.filterForm.get('report_type')?.valueChanges.subscribe((val) => {});
  }

  async ngOnInit() {
    this.titleService.setTitle('Update Revision - ' + Global.AppName);

    await this.fetchMasters();
    this.sheetType = 'monthly';
    this.filterForm.patchValue({
      attendance_type: this.attendanceTypeMaster.find((obj) => {
        return obj.value == this.sheetType;
      }),
      report_type: 'apply_rivision',
    });

    this.fetchEmployees({ page: 1 });
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchEmployees();
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

  initFormRows(type: any, data: any = null) {
    switch (type) {
      case 'emp_revision_data':
        return this.formBuilder.group({
          _id: [data?._id ?? null, Validators.compose([Validators.required])],
          emp_id: [
            data?.emp_id ?? null,
            Validators.compose([Validators.required]),
          ],
          gross_salary: [
            data?.gross_salary ?? null,
            Validators.compose([Validators.required]),
          ],
          effect_from: [
            data?.effect_from ?? null,
            Validators.compose([Validators.required]),
          ],
          // revision_date: [data?.revision_date ?? null, Validators.compose([Validators.required])],
          revision_month: [
            data?.revision_month
              ? this.monthMaster.find((obj: any) => {
                  return obj.index == data?.revision_month;
                }) ?? null
              : null,
            Validators.compose([Validators.required]),
          ],
          revision_year: [
            data?.revision_year ?? null,
            Validators.compose([Validators.required]),
          ],
          policy_pack_id: [
            data?.policy_pack_id
              ? this.packageMaster.find((obj: any) => {
                  return obj.id == data?.policy_pack_id;
                }) ?? null
              : null,
            Validators.compose([Validators.required]),
          ],
          salary_temp_id: [
            data?.salary_temp_id
              ? this.salaryTempMaster.find((obj: any) => {
                  return obj.id == data?.salary_temp_id;
                }) ?? null
              : null,
            Validators.compose([Validators.required]),
          ],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  addFormRows(formGroup: UntypedFormGroup, type: any, data: any = null) {
    const control = <UntypedFormArray>formGroup.get(type);
    switch (type) {
      case 'emp_revision_data':
        control.push(this.initFormRows('emp_revision_data', data));
        break;
    }
  }

  getPayload() {
    let payload: any = {
      attendance_type: this.employeeListFilter.attendance_type?.value ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      date_from: this.employeeListFilter?.date_from ?? '',
      date_to: this.employeeListFilter?.date_to ?? '',
    };
    return payload;
  }

  fetchEmployees({
    loading = <boolean>true,
    page = <any>null,
    options = <any>null,
    tableLengthChanged = <boolean>false,
    multiEditAction = <boolean>false,
  } = {}) {
    if (options) {
      this.employeeListFilter = options;
    }

    this.report_type = this.filterForm?.value?.report_type;

    if (this.employeeListFilter) {
      if (page == null) {
        page = this.paginationOptions.page;
      }

      if (tableLengthChanged == true) {
        this.tableFilterOptions = options;
      }

      let payload: any = this.getPayload();
      if (this.filterForm?.value?.report_type == 'rivision_history_rp') {
        let date_from_arr = payload?.date_from.split('-');
        let date_to_arr = payload?.date_to.split('-');

        this.rivision_filter.wage_from_date =
          date_from_arr[0] + '-' + date_from_arr[1] + '-01';
        this.rivision_filter.wage_to_date =
          date_to_arr[0] + '-' + date_to_arr[1] + '-01';

        this.rivision_filter = {
          wage_from_date: date_from_arr[0] + '-' + date_from_arr[1] + '-01',
          wage_to_date: date_to_arr[0] + '-' + date_to_arr[1] + '-01',
          unchecked_row_ids: [],
          checked_row_ids: [],
          row_checked_all: 'false',
          generate: '',
          search_type: this.employeeListFilter?.search_type,
        };
      }
      if (multiEditAction == true) {
        payload = this.getFetchPayload({ multiEditAction: true });
      } else {
        payload = this.getFetchPayload({ multiEditAction: false });
      }

      payload.pageno = page;
      payload.perpage = this.tableFilterOptions.length;
      payload.attendance_type =
        this.employeeListFilter.attendance_type?.value ?? 'time';
      payload.department_id = this.employeeListFilter?.department_id ?? '';
      payload.hod_id = this.employeeListFilter?.hod_id ?? '';
      payload.designation_id = this.employeeListFilter?.designation_id ?? '';
      payload.branch_id = this.employeeListFilter?.branch_id ?? '';
      payload.multiEdit = multiEditAction;
      payload.searchkey = options?.searchkey || '';

      if (loading == true) this.spinner.show();
      // console.log(payload);

      this.companyuserService.getRevisionEmpList(payload).subscribe(
        (res: any) => {
          if (res.status == 'success') {
            if (multiEditAction) {
              var docs: any[] = res?.employees;
            } else {
              var docs: any[] = res?.employees?.docs;
            }

            if (multiEditAction == true) {
              this.cancelRevisionEmpMultipleUpdate({ refreshList: false });

              var datePipe = new DatePipe('en-US');
              docs.forEach((element) => {
                /** GET CURRENT GROSS SALARY */
                let currentGrossSalary = null;
                if (element?.revision?.gross_salary !== undefined) {
                  currentGrossSalary = element?.revision?.gross_salary;
                } else if (
                  element?.employee_details?.employment_hr_details
                    ?.gross_salary !== undefined
                ) {
                  currentGrossSalary =
                    element?.employee_details?.employment_hr_details
                      ?.gross_salary;
                }

                this.empRevisionForm
                  .get('gross_salary')
                  ?.patchValue(currentGrossSalary);

                /** GET CURRENT POLICY PACKAGE */
                let currentPackageId: any = null;
                if (element?.revision?.policy_pack_id !== undefined) {
                  currentPackageId = element?.revision?.policy_pack_id;
                } else if (
                  element?.employee_details?.employment_hr_details
                    ?.package_id !== undefined
                ) {
                  currentPackageId =
                    element?.employee_details?.employment_hr_details
                      ?.package_id;
                }

                /** GET CURRENT SALARY TEMPLATE */
                let currentSalaryTempId: any = null;
                if (element?.revision?.salary_temp_id !== undefined) {
                  currentSalaryTempId = element?.revision?.salary_temp_id;
                } else if (
                  element?.employee_details?.employment_hr_details
                    ?.salary_temp !== undefined
                ) {
                  currentSalaryTempId =
                    element?.employee_details?.employment_hr_details
                      ?.salary_temp;
                }

                let document = {
                  _id: element?._id,
                  emp_id: element?.emp_id,
                  revision_month: element?.revision?.revision_month,
                  revision_year: element?.revision?.revision_year,
                  effect_from: element?.revision?.effect_from
                    ? datePipe.transform(
                        element?.revision?.effect_from,
                        'yyyy-MM-dd'
                      )
                    : null,

                  gross_salary: currentGrossSalary,
                  policy_pack_id: currentPackageId,
                  salary_temp_id: currentSalaryTempId,
                };

                this.addFormRows(
                  this.multipleEmpRevisionForm,
                  'emp_revision_data',
                  document
                );
              });

              $('#empMultiEditModalButton')?.click();
            } else {
              docs.forEach((doc: any) => {
                doc.checked = this.isRowChecked(doc._id);
              });

              this.employees = docs ?? [];
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
            }
          } else {
            this.toastr.error(res.message);
            if (multiEditAction != true) {
              this.employees = [];
              this.paginationOptions = Global.resetPaginationOption();
            }
          }

          if (loading == true) this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
        },
        (err) => {
          if (loading == true) this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          Global.loadCustomScripts('customJsScript');

          if (multiEditAction != true) {
            this.employees = [];
            this.paginationOptions = Global.resetPaginationOption();
          }
        }
      );
    }
  }

  getFetchPayload({ multiEditAction = <boolean>false } = {}) {
    if (multiEditAction == true) {
      //   let row_ids: any[] = [];
      //   let checkedRows: any = $('.dataTable').find('[type="checkbox"]:checked');
      //   for (const key in checkedRows) {
      //     if (Object.prototype.hasOwnProperty.call(checkedRows, key)) {
      //       const element = checkedRows[key];
      //       let emp_id = $(element).data('checkbox-id');
      //       if (emp_id) row_ids.push(emp_id);
      //     }
      //   }

      return {
        attendance_type: this.sheetType,
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: JSON.stringify(this.checkedRowIds),
        unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      };
    } else {
      this.sheetType = this.filterForm.value?.attendance_type?.value;

      let payload = {
        attendance_type: this.filterForm.value?.attendance_type?.value ?? '',
      };

      return payload;
    }
  }

  fetchMasters() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.branchMaster = [];
            if (
              res.masters.branch?.company_branch &&
              Array.isArray(res.masters.branch?.company_branch)
            ) {
              res.masters.branch?.company_branch.forEach((element: any) => {
                this.branchMaster.push({
                  id: element._id,
                  description: element.branch_name,
                });
              });
            }

            if (
              res.masters.designation &&
              Array.isArray(res.masters.designation)
            ) {
              this.designationMaster = [];
              res.masters.designation.forEach((element: any) => {
                this.designationMaster.push({
                  id: element._id,
                  description: element.designation_name,
                });
              });
            }

            if (
              res.masters.department &&
              Array.isArray(res.masters.department)
            ) {
              this.departmentMaster = [];
              res.masters.department.forEach((element: any) => {
                this.departmentMaster.push({
                  id: element._id,
                  description: element.department_name,
                });
              });
            }

            if (
              res.masters.salarytemp &&
              Array.isArray(res.masters.salarytemp)
            ) {
              this.salaryTempMaster = [];
              res.masters.salarytemp.forEach((element: any) => {
                this.salaryTempMaster.push({
                  id: element._id,
                  description: element.template_name,
                });
              });
            }

            if (res.masters.packages && Array.isArray(res.masters.packages)) {
              this.packageMaster = [];
              res.masters.packages.forEach((element: any) => {
                this.packageMaster.push({
                  id: element._id,
                  description: element.package_name,
                });
              });
            }
          } else {
            this.toastr.error(res.message);
          }

          this.spinner.hide();
          resolve(true);
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(true);
        }
      );
    });
  }

  getMasterValue({
    arrMaster = <any[]>[],
    searchKey = <string>'id',
    searchValue = <any>null,
    returnKey = <string>'description',
  } = {}) {
    return (
      arrMaster.find((obj: any) => {
        return obj[searchKey] == searchValue;
      })?.[returnKey] ?? null
    );
  }

  employeeIdBucket: any[] = [];

  initEdit({ type = <string>'', details = <any>null }) {
    this.employeeIdBucket = [];
    if (type == 'multiple') {
      this.empRevisionForm.get('gross_salary')?.clearValidators();
      this.empRevisionForm.get('policy_pack_id')?.clearValidators();
      this.empRevisionForm.get('salary_temp_id')?.clearValidators();
    } else {
      this.empRevisionForm
        .get('gross_salary')
        ?.addValidators(Validators.required);
      this.empRevisionForm
        .get('policy_pack_id')
        ?.addValidators(Validators.required);
      this.empRevisionForm
        .get('salary_temp_id')
        ?.addValidators(Validators.required);
    }
    Global.resetForm(this.empRevisionForm);

    if (type == 'single') {
      this.employeeIdBucket.push(details?._id);

      if (this.employeeIdBucket.length == 0) {
        this.toastr.error('No Employees Selected');
        return;
      }

      var datePipe = new DatePipe('en-US');

      /** GET CURRENT GROSS SALARY */
      let currentGrossSalary = null;
      if (details?.revision?.gross_salary !== undefined) {
        currentGrossSalary = details?.revision?.gross_salary;
      } else if (
        details?.employee_details?.employment_hr_details?.gross_salary !==
        undefined
      ) {
        currentGrossSalary =
          details?.employee_details?.employment_hr_details?.gross_salary;
      }

      this.empRevisionForm.get('gross_salary')?.patchValue(currentGrossSalary);

      /** GET CURRENT POLICY PACKAGE */
      let currentPackageId: any = null;
      if (details?.revision?.policy_pack_id !== undefined) {
        currentPackageId = details?.revision?.policy_pack_id;
      } else if (
        details?.employee_details?.employment_hr_details?.package_id !==
        undefined
      ) {
        currentPackageId =
          details?.employee_details?.employment_hr_details?.package_id;
      }

      this.empRevisionForm.get('policy_pack_id')?.patchValue(
        currentPackageId
          ? this.packageMaster.find((obj: any) => {
              return obj.id == currentPackageId;
            })
          : null
      );

      /** GET CURRENT SALARY TEMPLATE */
      let currentSalaryTempId: any = null;
      if (details?.revision?.salary_temp_id !== undefined) {
        currentSalaryTempId = details?.revision?.salary_temp_id;
      } else if (
        details?.employee_details?.employment_hr_details?.salary_temp !==
        undefined
      ) {
        currentSalaryTempId =
          details?.employee_details?.employment_hr_details?.salary_temp;
      }

      this.empRevisionForm.get('salary_temp_id')?.patchValue(
        currentSalaryTempId
          ? this.salaryTempMaster.find((obj: any) => {
              return obj.id == currentSalaryTempId;
            })
          : null
      );

      this.empRevisionForm.patchValue({
        effect_from: details?.revision?.effect_from
          ? datePipe.transform(details?.revision?.effect_from, 'yyyy-MM-dd')
          : null,
        revision_year: details?.revision?.revision_year ?? null,
        revision_month: details?.revision?.revision_month
          ? this.monthMaster.find((obj: any) => {
              return obj.index == details?.revision?.revision_month;
            })
          : null,
      });
    }

   
    console.log(type);

    $('#editEmpRevisionModalButton')?.click();
  }

  cancelRevisionEmpUpdate() {
    $('#editEmpRevisionModal')?.find('[data-dismiss="modal"]')?.click();
    Global.resetForm(this.empRevisionForm);
    this.fetchEmployees();
  }

  cancelRevisionEmpMultipleUpdate({
    refreshList = <boolean>true,
    resetCheckedRows = <boolean>false,
  } = {}) {
    $('#empMultiEditModal')?.find('[data-dismiss="modal"]')?.click();
    Global.resetForm(this.multipleEmpRevisionForm);
    Global.resetFormGroupArrRow(
      this.multipleEmpRevisionForm,
      'emp_revision_data'
    );

    if (refreshList == true) this.fetchEmployees();
    if (resetCheckedRows == true) this.resetCheckedRows();
  }

  async updateEmpRevision(event: any) {
    if (this.empRevisionForm.valid) {
      let payload: any = this.getBulkUploadPayload();

      payload.gross_salary = this.empRevisionForm.value?.gross_salary ?? '';
      payload.effect_from = this.empRevisionForm.value?.effect_from ?? '';
      payload.policy_pack_id =
        this.empRevisionForm.value?.policy_pack_id?.id ?? '';
      payload.salary_temp_id =
        this.empRevisionForm.value?.salary_temp_id?.id ?? '';
      payload.revision_month =
        this.empRevisionForm.value?.revision_month?.index ?? '';
      payload.revision_year = this.empRevisionForm.value?.revision_year ?? '';

      const v: any = await this.validRevisionPayload(payload);
      if (v.status == false) {
        this.toastr.error(v.message);
        return;
      }

      event.target.classList.add('btn-loading');
      this.companyuserService.updateRevisionEmpData(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.cancelRevisionEmpUpdate();
          } else if (res.status == 'val_err') {
            this.toastr.error(Global.showValidationMessage(res.val_msg));
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

  async updateMultipleEmpRevision(event: any) {
    if (this.multipleEmpRevisionForm.valid) {
      let emp_revision_data: any[] = [];
      for (const key in this.multipleEmpRevisionForm.value?.emp_revision_data ??
        []) {
        if (
          Object.prototype.hasOwnProperty.call(
            this.multipleEmpRevisionForm.value?.emp_revision_data ?? [],
            key
          )
        ) {
          const data = (this.multipleEmpRevisionForm.value?.emp_revision_data ??
            [])[key];

          let payload = {
            _id: data?._id,
            emp_id: data?.emp_id,
            gross_salary: data?.gross_salary,
            effect_from: data?.effect_from,
            // 'revision_date': data?.revision_date,
            policy_pack_id: data?.policy_pack_id?.id,
            salary_temp_id: data?.salary_temp_id?.id,
            revision_month: data?.revision_month?.index,
            revision_year: data?.revision_year,
          };

          const v: any = await this.validRevisionPayload(payload);
          if (v.status == false) {
            this.toastr.error(`Row ${parseInt(key) + 1} : ${v.message}`);
            return;
          }

          emp_revision_data.push(payload);
        }
      }

      let payload: any = {
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: JSON.stringify(this.checkedRowIds),
        unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
        emp_revision_data: JSON.stringify(emp_revision_data),
      };

      event.target.classList.add('btn-loading');
      this.companyuserService.updateRevisionEmpMultipleData(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.cancelRevisionEmpMultipleUpdate({ resetCheckedRows: true });
          } else if (res.status == 'val_err') {
            this.toastr.error(Global.showValidationMessage(res.val_msg));
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

  validRevisionPayload(payload: any) {
    return new Promise((resolve, reject) => {
      if (
        payload.effect_from &&
        new Date(payload.effect_from) > this.currentDate
      ) {
        return resolve({
          status: false,
          message: 'Effective from date must not be greater than today',
        });
      }

      if (payload.effect_from && this.sheetType == 'monthly') {
        let effect_from = new Date(payload.effect_from);
        if (effect_from.getDate() != 1) {
          return resolve({
            status: false,
            message:
              'For monthly attendance type the effective from date must be 1st of the month',
          });
        }
      }

      // if (payload.revision_month && payload.revision_year) {
      if (payload.revision_year > this.currentDate.getFullYear()) {
        return resolve({
          status: false,
          message: 'The revision date cannot be greater than current date',
        });
      } else if (payload.revision_month > this.currentDate.getMonth()) {
        return resolve({
          status: false,
          message: 'The revision date cannot be greater than current date',
        });
      }
      // }

      resolve({ status: true });
    });
  }

  getBulkUploadPayload() {
    let payload: any = {};

    if (this.employeeIdBucket.length > 0) {
      payload.row_checked_all = false;
      payload.checked_row_ids = JSON.stringify(this.employeeIdBucket);
      payload.unchecked_row_ids = JSON.stringify([]);
    } else {
      payload.row_checked_all = this.rowCheckedAll;
      payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
      payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
    }

    return payload;
  }

  //   private isRowChecked(rowId: any) {
  //     if (!this.rowCheckedAll) {
  //       return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
  //     } else {
  //       return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  //     }
  //   }

  //   rowCheckBoxChecked(event: any, row: any) {
  //     let rowId: any = row._id;
  //     let checkbox: any = document.querySelectorAll(
  //       '[data-checkbox-id="' + rowId + '"]'
  //     );

  //     if (checkbox.length > 0) {
  //       if (checkbox[0].checked) {
  //         this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
  //         if (!this.rowCheckedAll) {
  //           if (!this.checkedRowIds.includes(rowId)) {
  //             this.checkedRowIds.push(rowId);
  //           }
  //         }
  //       } else {
  //         this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
  //         if (this.rowCheckedAll) {
  //           if (!this.uncheckedRowIds.includes(rowId)) {
  //             this.uncheckedRowIds.push(rowId);
  //           }
  //         }
  //       }
  //     }
  //   }

  //   allRowsCheckboxChecked(event: any) {
  //     if (this.rowCheckedAll) {
  //       this.uncheckedRowIds.length = 0;
  //       this.rowCheckedAll = false;
  //     } else {
  //       this.checkedRowIds.length = 0;
  //       this.rowCheckedAll = true;
  //     }

  //     this.fetchEmployees();
  //   }

  resetCheckedRows() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];
  }
  cancellRivReport() {
    this.filterForm.patchValue({
      report_type: 'apply_rivision',
    });

    this.fetchEmployees({ page: 1 });
  }

  /** Load History Methods */
  loadHistory({ loading = <boolean>true, id = <any>null } = {}) {
    return new Promise((resolve, reject) => {
      if (!id) {
        this.toastr.error('No records available for history');
        return reject('No records available for history');
      }

      if (loading == true) this.spinner.show();

      this.companyuserService
        .getRevisionEmpLog({
          revision_id: id,
        })
        .subscribe(
          (res) => {
            if (loading == true) this.spinner.hide();
            if (res.status == 'success') {
              // console.log('res: ', res);
            } else {
              this.toastr.error(res.message);
              return reject(res.message);
            }
          },
          (err) => {
            if (loading == true) this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            return reject(err);
          }
        );
    });
  }

  getMonthValue(index: any) {
    return (
      this.monthMaster.find((obj) => {
        return obj.index == index;
      }) ?? null
    );
  }

  isRevisionBeforeCurrentDate: boolean = false;
  checkRevisionBeforeCurrentDate() {
    // Get selected month and year from the form controls
    const selectedMonth =
      this.empRevisionForm.get('revision_month')?.value?.value; // Assuming value.value is the numeric month
    const selectedYear = this.empRevisionForm.get('revision_year')?.value;

    console.log(
      'Selected Month:',
      selectedMonth,
      'Selected Year:',
      selectedYear
    );

    if (selectedMonth && selectedYear) {
      // Construct the selected date in 'YYYY-MM' format
      const selectedDate = moment(
        `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`,
        'YYYY-MM'
      );

      // Get current date (set to the start of the current month for comparison)
      const currentDate = moment().startOf('month');

      // Compare selected date with current date (month and year only)
      this.isRevisionBeforeCurrentDate = selectedDate.isBefore(
        currentDate,
        'month'
      );
    } else {
      // If the user hasn't selected a valid month/year, set it to false (no error)
      this.isRevisionBeforeCurrentDate = false;
    }
  }
}
