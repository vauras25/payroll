import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

import jsPDF from 'jspdf';
import { CompanyuserTableFilterComponent } from '../../includes/table-filter/table-filter.component';
import { DatePipe } from '@angular/common';
import { CMPEmployeeFullfinalFormComponent } from '../form/employee-fullfinal/employee-fullfinal.component';
import { saveAs } from 'file-saver';
import PaginationOptions from 'src/app/models/PaginationOptions';
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake');
// const htmlToDocxmake = require('html-to-docx')

@Component({
  selector: 'companyuser-app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class CMPEmployeeListComponent implements OnInit {
  @ViewChild(CompanyuserTableFilterComponent)
  filterTableComponent: CompanyuserTableFilterComponent;
  @ViewChild(CMPEmployeeFullfinalFormComponent)
  employeeExitComponent: CMPEmployeeFullfinalFormComponent;

  Global = Global;
  dtOptions: DataTables.Settings = {};

  csvImportForm: UntypedFormGroup;
  changeStatusForm: UntypedFormGroup;
  salaryAssignForm: UntypedFormGroup;
  packageForm: UntypedFormGroup;
  approveEmployeeForm: UntypedFormGroup;
  multipleApproveEmployeeForm: UntypedFormGroup;
  employeeLetterWritingForm: UntypedFormGroup;
  employeeExportForm: UntypedFormGroup;
  invitationLink: any;
  invitationForm: FormGroup = new FormGroup({
    hod_id: new FormControl(null, Validators.required),
  });
  // employeeExtraExportForm: FormGroup;

  statusMaster: any[];
  salaryTempMaster: any[];
  packageMaster: any[];
  letterMaster: any[];
  employeeIdBucket: any[];
  csvFailedIds: any[];
  letterWritingEmployees: any[];
  employeeSheetTemplate: any[] = [];
  hodMaster: any = [];
  pdfExportTypes: any[] = [
    {
      section: 'employeeassets',
      value: 'assets',
      description: 'Employee Asset',
      isShow: Global.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'employee_assest',
      }),
    },
    {
      section: 'contractdetails',
      value: 'contract',
      description: 'Contract Details',
      isShow: Global.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'contract_details',
      }),
    },
    {
      section: 'annualcomponent',
      value: 'annual_earnings',
      description: 'Annual Component',
      isShow: Global.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'annual_component',
      }),
    },
    { section: 'trainings', value: 'training', description: 'Training' },
    {
      section: 'disciplinary',
      value: 'employment_disciplinary_details',
      description: 'Disciplinary Actions',
      isShow: true,
    },
    {
      section: 'accidentdetails',
      value: 'accident',
      description: 'Accidents Details',
      isShow: true,
    },
    {
      section: 'extracurriculum',
      value: 'extra_curricular',
      description: 'Extra Curricular',
      isShow: true,
    },
    {
      section: 'education',
      value: 'education',
      description: 'Educational Details',
      isShow: true,
    },
    // { 'value': "custom", "description": "Custom" },
  ];

  navigationPageOpt: any[] = [
    {
      label: 'Export Employees',
      value: null,
    },
    {
      label: 'Salary report',
      value: '/company/reports/master-sheet',
    },
  ];

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  last_emp_id: any = null;
  templateForm: UntypedFormGroup;
  template_fields: any[] = [];
  filter?: any;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  // reportTableFilterOptions: TableFilterOptions =
  //   Global.resetTableFilterOptions();
  employees:any[] = []
  // sheetTemplate: any[] = employeeExportCustomFields;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent,
    private datePipe: DatePipe
  ) {
    this.changeStatusForm = formBuilder.group({
      status: [null, Validators.compose([Validators.required])],
      employee_id: [null, Validators.compose([Validators.required])],
    });

    this.salaryAssignForm = formBuilder.group({
      salary_temp: [null, Validators.compose([Validators.required])],
    });

    this.packageForm = formBuilder.group({
      package: [null, Validators.compose([Validators.required])],
    });

    this.approveEmployeeForm = formBuilder.group({
      package: [null, Validators.compose([Validators.required])],
      salary_temp: [null, Validators.compose([Validators.required])],
      gross_salary: [null, Validators.compose([Validators.required])],
      date_of_join: [null, Validators.compose([Validators.required])],
      employee_id: [null, Validators.compose([Validators.required])],
      emp_id: [null, Validators.compose([Validators.required])],
      last_emp_id: [null],
    });

    this.employeeLetterWritingForm = formBuilder.group({
      template: [null, Validators.compose([Validators.required])],
    });

    this.csvImportForm = formBuilder.group({
      file: [null, Validators.compose([Validators.required])],
      file_source: [null, Validators.compose([Validators.required])],
    });

    this.multipleApproveEmployeeForm = formBuilder.group({
      employees: this.formBuilder.array([this.initTemplateRows('employees')]),
    });

    this.employeeExportForm = formBuilder.group({
      download_data_type: [null, Validators.compose([Validators.required])],
      field_set: this.formBuilder.array([]),
    });

    this.templateForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
    });

    // console.log(this.pdfExportTypes);

    // this.employeeExtraExportForm = formBuilder.group({
    //   'download_data_type': [null, Validators.compose([Validators.required])],
    //   'field_set': this.formBuilder.array([]),
    // })

    this.salaryTempMaster = [];
    this.packageMaster = [];
    this.letterMaster = [];
    this.employeeIdBucket = [];
    this.csvFailedIds = [];
    this.letterWritingEmployees = [];

    this.statusMaster = [
      { value: 'active', description: 'Active' },
      { value: 'inactive', description: 'Inactive' },
      { value: 'pending', description: 'Pending' },
    ];

    this.employeeExportForm
      .get('download_data_type')
      ?.valueChanges.subscribe((val) => {
        if (val?.template_fields) {
          const control = <UntypedFormArray>(
            this.employeeExportForm.get('field_set')
          );
          val?.template_fields.forEach((element: any) => {
            control.push(new UntypedFormControl(element));
          });
        }
        // if (val?.value == 'custom') {
        // const control = <UntypedFormArray>(
        //   this.employeeExportForm.get('field_set')
        // );
        // this.employeeExportCustomFields.forEach((element) => {
        //   control.push(new UntypedFormControl(true));
        // });
        // } else {
        // // console.log(val);

        //   Global.resetFormGroupArrRow(this.employeeExportForm, 'field_set');
        // }
      });

    this.filter = this.activatedRoute.snapshot.queryParams['filter'];
  }

 ngOnInit() {
    this.titleService.setTitle('Employees - ' + Global.AppName);

    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'listing_add_approve',
        company_sub_module: 'employee_master_data',
        company_sub_operation: ['view'],
        // staff_module: 'employee_details',
        // staff_operation: ['add', 'edit', 'delete', 'view'],
        company_strict: true,
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    console.log("fetching start");
    
     this.fetchEmployeeList()
     this.getEmployeeMaster();
     this.fetchSettingsTemplate();
     this.fetchLetterWritingTemplates();

    this.pdfExportTypes = this.pdfExportTypes.filter((tp) => tp.isShow);
  }

  initTemplateRows(type: any, data: any = {}) {
    switch (type) {
      case 'employees':
        return this.formBuilder.group({
          employee_id: [
            data?.employee_id ?? null,
            Validators.compose([Validators.required]),
          ],
          employee_details: [
            data?.employee_details ?? null,
            Validators.compose([]),
          ],
          userid: [
            data?.userid ?? null,
            Validators.compose([Validators.required]),
          ],
          package: [null, Validators.compose([Validators.required])],
          salary_temp: [null, Validators.compose([Validators.required])],
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
  }

  resetAllTemplateRows(formGroup: UntypedFormGroup, isEditing: any = false) {
    let arr = ['employees'];
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

  getReportPayload() {
    let payload: any = {
      // wage_month: this.employeeListFilter.month?.index ?? '',
      // wage_year: this.employeeListFilter.year?.value ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      client_id: this.employeeListFilter?.client_id ?? '',
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
    };
    return payload;
  }

  employeeListFilter: any = {};

  async filterDataTable(payload: any) {
    this.employeeListFilter = payload;
    this.fetchEmployeeList();
    // $('#my-datatable_filter').find('[type="search"]').val('');
    // $('#my-datatable').DataTable().search('').draw();
  }

  resetDataTableFilter() {
    this.filterTableComponent.reset();
  }

  async fetchEmployeeList(){
    try {
      if(!this.AppComponent.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'listing_add_approve',
        company_sub_module: 'employee_master_data',
        company_sub_operation: ['view'],
        company_strict: true,
      })){
        return;
      }
      let fetchPayload = this.employeeListFilter;
      if (
        this.employeeListFilter &&
        !this.employeeListFilter?.emp_status &&
        this.filter
      ) {
        if (this.filter == 'approved') {
          fetchPayload.emp_status = 'approved';
          this.filterTableComponent.filterForm
            .get('emp_status')
            ?.setValue({ value: 'approved', description: 'Active' });
        }else if(this.filter == 'pending'){
          fetchPayload.emp_status = 'pending';
          this.filterTableComponent.filterForm
            .get('emp_status')
            ?.setValue({ value: 'pending', description: 'Pending' });
        }  else {
          fetchPayload.emp_status = 'inactive';
          this.filterTableComponent.filterForm
            .get('emp_status')
            ?.setValue({ value: 'inactive', description: 'Exited' });
        }
      } 
      // console.log(fetchPayload);
      fetchPayload.pageno = this.paginationOptions.page;
      fetchPayload.perpage = this.paginationOptions.limit;
      fetchPayload.row_checked_all = this.rowCheckedAll;
      fetchPayload.checked_row_ids = JSON.stringify(this.checkedRowIds);
      fetchPayload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);

      // this.spinner.show()
      const res = await this.companyuserService.fetchEmployees(fetchPayload).toPromise();
      if(res.status !== 'success') throw res;
      
      this.employees = res.employees.docs;
      this.employees.forEach((doc: any) => {
        doc.checked = this.isRowChecked(doc._id);
      });
      this.paginationOptions = {
        hasNextPage: res?.employees?.hasNextPage,
        hasPrevPage: res?.employees?.hasPrevPage,
        limit: res?.employees?.limit,
        nextPage: res?.employees?.nextPage,
        page: res?.employees?.page,
        pagingCounter: res?.employees?.pagingCounter,
        prevPage: res?.employees?.prevPage,
        totalDocs: res?.employees?.totalDocs,
        totalPages: res?.employees?.totalPages,
      };
      this.spinner.hide();
      
    } catch (err:any) {
      this.spinner.hide()
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(err.message || err ||  "Something Went Wrong!");
      }
    }
  }

  getContractDetails(employee:any){
              let contract_details = employee?.employee_details?.contract ?? [];
            let blink: boolean = false;
            let value = null;

            if (
              Array.isArray(contract_details) &&
              contract_details.length > 0
            ) {
              value =
                contract_details[contract_details.length - 1]?.end_date ?? null;
              if (value) {
                let diff: any = Global.getTimeDifference(
                  Date.parse(value),
                  Date.now(),
                  false
                );

                if (
                  diff?.daysDifference < 10 &&
                  employee?.approval_status == 'approved'
                ) {
                  blink = true;
                }

                value = new DatePipe('en-US').transform(value, 'dd/MM/yyyy');
              }
            }

            return value ? `<span class="${blink == true ? 'blink text-danger' : ''}">${value}</span>`: `<span>N/A</span>`;
  }

  async getEmployeeMaster() {
    return new Promise((resolve, reject) => {
      // this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.hodMaster = [];
            if (res.masters.hod && Array.isArray(res.masters.hod)) {
              res.masters.hod.forEach((element: any) => {
                this.hodMaster.push({
                  id: element._id,
                  description: `${element.first_name} ${element.last_name}`,
                });
              });
            }
          } else {
            this.spinner.hide();
            this.toastr.error(res.message);
          }

        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
    });
  }

  async fetchSettingsTemplate() {
    return new Promise((resolve, reject) => {
      this.employeeSheetTemplate = [];
      this.employeeExportForm.get('download_data_type')?.setValue('')
      // this.spinner.show();
      this.companyuserService
        .fetchEmployeeSheetTemplates({
          pageno: 1,
          temp_module_for: 'employee_sheet',
        })
        .subscribe(
          (res) => {
            // this.spinner.hide();
            if (res.status == 'success') {
              this.employeeSheetTemplate = res?.earning_sheet_temp?.docs ?? [];
              this.employeeSheetTemplate.push(
                { template_name: 'Form A', type: 'form_a', default:true},
                { template_name: 'Salary Certificate', type: 'salary_certificate', default:true},
                // { template_name: 'Form B', type: 'form_b' },
                { template_name: 'PF Bulk Join', type: 'join', default:true},
                { template_name: 'PF Bulk Exit', type: 'exit', default:true }
              );
              resolve(true);
            } else if (res.status == 'val_err') {
              this.spinner.hide();
              this.toastr.error(Global.showValidationMessage(res.val_msg));
              reject(Global.showValidationMessage(res.val_msg));
            } else {
              this.spinner.hide();
              this.toastr.error(res.message);
              reject(res.message);
            }
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            reject(Global.showServerErrorMessage(err));
          }
        );
    });
  }

  async fetchLetterWritingTemplates() {
    return new Promise((resolve, reject) => {
      // this.spinner.show();
      this.letterMaster = [];
      this.companyuserService
        .fetchLetterWritingTemplates({
          pageno: 1,
        })
        .subscribe(
          (res: any) => {
            if (res.status == 'success') {
              (res?.template_list?.docs ?? []).forEach((element: any) => {
                this.letterMaster.push({
                  id: element._id,
                  description: element.template_name,
                });
              });
            } else {
              this.toastr.error(res.message);
            }

            // this.spinner.hide();
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

  // async fetch() {
  //   this.dtOptions = {
  //     ajax: (dataTablesParameters: any, callback) => {
  //       if (dataTablesParameters.search.value != '') {
  //         this.filterTableComponent.reset({ refresh: false });
  //         // this.employeeListFilter = {};
  //       }

  //       // console.log('dataTablesParameters: ', dataTablesParameters)

  //       let fetchPayload = this.employeeListFilter;
  //       if (
  //         this.employeeListFilter &&
  //         !this.employeeListFilter?.emp_status &&
  //         this.filter
  //       ) {
  //         if (this.filter == 'approved') {
  //           fetchPayload.emp_status = 'approved';
  //           this.filterTableComponent.filterForm
  //             .get('emp_status')
  //             ?.setValue({ value: 'approved', description: 'Active' });
  //         }else if(this.filter == 'pending'){
  //           fetchPayload.emp_status = 'pending';
  //           this.filterTableComponent.filterForm
  //             .get('emp_status')
  //             ?.setValue({ value: 'pending', description: 'Pending' });
  //         }  else {
  //           fetchPayload.emp_status = 'inactive';
  //           this.filterTableComponent.filterForm
  //             .get('emp_status')
  //             ?.setValue({ value: 'inactive', description: 'Exited' });
  //         }
  //       }
  //       // console.log(fetchPayload);
  //       (fetchPayload.row_checked_all = this.rowCheckedAll),
  //         (fetchPayload.checked_row_ids = JSON.stringify(this.checkedRowIds)),
  //         (fetchPayload.unchecked_row_ids = JSON.stringify(
  //           this.uncheckedRowIds
  //         )),
  //         (fetchPayload.pageno =
  //           dataTablesParameters.start / Global.DataTableLength + 1);
  //       fetchPayload.perpage = dataTablesParameters.length;
  //       // fetchPayload.searchkey = dataTablesParameters.search.value;
  //       fetchPayload.sortbyfield =
  //         Global.getTableSortingOptions('sortbyfield', dataTablesParameters) ??
  //         '';
  //       fetchPayload.ascdesc =
  //         Global.getTableSortingOptions('ascdesc', dataTablesParameters) ?? '';

  //       this.companyuserService.fetchEmployees(fetchPayload).subscribe(
  //         (res) => {
  //           if (res.status == 'success') {
  //             var docs: any[] = res.employees.docs;

  //             docs.forEach((doc: any) => {
  //               doc.checked = this.isRowChecked(doc._id);
  //             });

  //             callback({
  //               recordsTotal: res.employees.totalDocs,
  //               recordsFiltered: res.employees.totalDocs,
  //               data: res.employees.docs,
  //             });
  //           } else {
  //             this.toastr.error(res.message);

  //             callback({
  //               recordsTotal: 0,
  //               recordsFiltered: 0,
  //               data: [],
  //             });
  //           }
  //         },
  //         (err) => {
  //           this.toastr.error(Global.showServerErrorMessage(err));

  //           callback({
  //             recordsTotal: 0,
  //             recordsFiltered: 0,
  //             data: [],
  //           });
  //         }
  //       );
  //     },
  //     columns: [
  //       {
  //         render: function (data, type, full, meta: any) {
  //           let html = '';

  //           // if (
  //           //   Global.checkCompanyModulePermission({
  //           //     staff_module: 'employee_bulk_action',
  //           //     staff_operation: ['add', 'edit', 'view', 'delete'],
  //           //     company_strict: true,
  //           //   })
  //           // ) {
             
  //           // }

  //           let checked = full.checked == true ? 'checked' : '';
  //           html +=
  //             `<input type="checkbox" ` +
  //             checked +
  //             ` id="checkrow-` +
  //             meta.row +
  //             `" data-checkbox-id="` +
  //             full._id +
  //             `">`;

  //           html += meta.settings._iDisplayStart + (meta.row + 1);

  //           return html;
  //         },
  //         orderable: false,
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           let html = ``;

  //           html +=
  //             `<a href="javascript:;" id="viewButton-` +
  //             meta.row +
  //             `" class="btn btn-info btn-icon mg-r-5" data-toggle="tooltip" data-placement="top" title="View"><div style="width:25px;height:25px;"><i class="fa fa-eye"></i></div></a>`;

  //           if (
  //             Global.checkCompanyModulePermission({
  //               company_module: 'employee',
  //               company_operation: 'listing_add_approve',
  //               company_sub_module: 'employee_master_data',
  //               company_sub_operation: ['edit'],
  //               company_strict: true,
  //             })
  //           ) {
  //             html +=
  //               `<a href="javascript:;" id="editButton-` +meta.row + `" class="btn btn-primary btn-icon mg-r-5" data-toggle="tooltip" data-placement="top" title="Edit"><div style="width:25px;height:25px;"><i class="fa fa-pen"></i></div></a>`;
  //           }

  //           if (
  //             Global.checkCompanyModulePermission({
  //               company_module: 'employee',
  //               company_operation: 'listing_add_approve',
  //               company_sub_module: 'employee_master_data',
  //               company_sub_operation: ['edit'],
  //               // staff_module: 'employee_details',
  //               // staff_operation: ['delete'],
  //               company_strict: true,
  //             })
  //           ) {
  //             html += `<a href="javascript:;" id="deleteButton-` +meta.row + `" class="btn btn-danger btn-icon mg-r-5" data-toggle="tooltip" data-placement="top" title="Delete"><div style="width:25px;height:25px;"><i class="fa fa-trash"></i></div></a>`;
  //           }

  //           let button = ``;
  //           if (
  //             Global.checkCompanyModulePermission({
  //               company_module: 'employee',
  //               company_operation: 'listing_add_approve',
  //               company_sub_module: 'employee_master_data',
  //               company_sub_operation: ['view', 'edit'],
  //               company_strict: true,
  //             })
  //           ) {
  //           }
  //           // if (full?.status !== 'inactive' ) {
  //           //   button += `<button class="dropdown-item" id="initEmployeeExit" type="button">Exit</button>`;
  //           // }
  //           if (full?.status !== 'pending') {
  //             if(  Global.checkCompanyModulePermission({
  //               company_module: 'employee',
  //               company_operation: 'listing_add_approve',
  //               company_sub_module: 'employee_master_data',
  //               company_sub_operation: ['view'],
  //               company_strict: true,
  //             })){
  //               button += `<button class="dropdown-item" id="packageLink" type="button">Package</button>`;
  //               button += `<button class="dropdown-item" id="salaryTempLink" type="button">Salary</button>`;
  //             }
  //             if(  Global.checkCompanyModulePermission({
  //               company_module: 'employee',
  //               company_operation: 'listing_add_approve',
  //               company_sub_module: 'employee_master_data',
  //               company_sub_operation: [ 'edit'],
  //               company_strict: true,
  //             }) && full?.status !== 'inactive'){
  //               button += `<button class="dropdown-item" id="initEmployeeExit" type="button">Exit</button>`;
  //             }
  //           }

  //           // if (Global.checkCompanyModulePermission({ 'staff_module': 'employee_details', 'staff_operation': ['edit'], 'company_strict': true })) {
  //           //     button += `<button class="dropdown-item" id="statusLink-` + meta.row + `" type="button">Change Status</button>`;
  //           // }

  //           if (
  //             Global.checkCompanyModulePermission({
  //               company_module: 'employee',
  //               company_operation: 'letter_writer',
  //               company_sub_module: 'letter_writer',
  //               company_sub_operation: ['view'],
  //             })
  //           ) {
  //             button += `<button class="dropdown-item" id="letterWriting" type="button">Letter Writing</button>`;
  //           }

  //           html +=
  //             `<a class="dropdown">
  //                           <button class="btn btn-info btn-icon btn-drp dropdown-toggle mt-0" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
  //                               Action
  //                           </button>
  //                           <div class="dropdown-menu" aria-labelledby="dropdownMenu2">
  //                               ` +
  //             button +
  //             `
  //                           </div>
  //                       </a>`;

  //           return html;
  //         },
  //         orderable: false,
  //         className: 'text-center',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           let html = '';
  //           if (full.approval_status !== 'pending') {
  //             html += full.emp_id ?? 'N/A';
  //           } else {
  //             if (
  //               Global.checkCompanyModulePermission({
  //                 company_module: 'employee',
  //                 company_operation: 'listing_add_approve',
  //                 company_sub_module: 'employee_master_data',
  //                 company_sub_operation: [ 'approve'],
  //                 company_strict: true,
  //               })
  //             ) {
  //               html += `<button id="approveButton" class="btn btn-sm btn-primary">Approve</button>`;
  //             } else {
  //               html += `<span class="badge badge-warning">Pending</span>`;
  //             }
  //           }

  //           return html;
  //         },
  //         orderable: true,
  //         data: 'emp_id',
  //         name: 'emp_id',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           return full.emp_first_name;
  //         },
  //         orderable: true,
  //         data: 'emp_first_name',
  //         name: 'emp_first_name',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           return full.emp_last_name;
  //         },
  //         orderable: true,
  //         data: 'emp_last_name',
  //         name: 'emp_last_name',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           return full?.emp_age?.toFixed(0) ?? 'N/A';
  //         },
  //         orderable: true,
  //         data: 'age',
  //         name: 'age',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           let contract_details = full?.employee_details?.contract ?? [];
  //           let blink: boolean = false;
  //           let value = null;

  //           if (
  //             Array.isArray(contract_details) &&
  //             contract_details.length > 0
  //           ) {
  //             value =
  //               contract_details[contract_details.length - 1]?.end_date ?? null;
  //             if (value) {
  //               let diff: any = Global.getTimeDifference(
  //                 Date.parse(value),
  //                 Date.now(),
  //                 false
  //               );

  //               if (
  //                 diff?.daysDifference < 10 &&
  //                 full?.approval_status == 'approved'
  //               ) {
  //                 blink = true;
  //               }

  //               value = new DatePipe('en-US').transform(value, 'dd/MM/yyyy');
  //             }
  //           }

  //           return value
  //             ? `<span class="${
  //                 blink == true ? 'blink text-danger' : ''
  //               }">${value}</span>`
  //             : 'N/A';
  //         },
  //         orderable: true,
  //         data: 'contract',
  //         name: 'contract',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           if (full?.hod) {
  //             return `${full?.hod?.first_name} ${full?.hod?.last_name}`;
  //           } else {
  //             return 'N/A';
  //           }
  //         },
  //         orderable: true,
  //         data: 'emp_hod',
  //         name: 'emp_hod',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           return full?.client?.client_code ?? 'N/A';
  //         },
  //         orderable: true,
  //         data: 'client_code',
  //         name: 'client_code',
  //       },
  //       {
  //         render: function (data, type, full, meta: any) {
  //           if (full?.approval_status == 'approved') {
  //             return (
  //               `<span class="badge badge-success text-capitalize" data-toggle="tooltip" data-placement="top" title="Approved by HOD"><i class="fa fa-check"></i> ` +
  //               full.approval_status +
  //               `</span>`
  //             );
  //           } else if (full?.approval_status == 'inactive') {
  //             return `<span class="badge badge-danger text-capitalize"><i class="fa fa-times"></i> Exited</span>`;
  //           } else {
  //             return (
  //               `<span class="badge badge-warning text-capitalize"><i class="fa fa-times"></i> ` +
  //               full.approval_status +
  //               `</span>`
  //             );
  //           }
  //         },
  //         orderable: true,
  //         data: 'approval_status',
  //         name: 'approval_status',
  //       },
  //     ],
  //     rowCallback: (row: Node, data: any | Object, index: number) => {
  //       const self = this;

  //       $('table').on('click', '#viewButton-' + index, function () {
  //         self.router.navigate([
  //           '/company/employees/' + data._id + '/view/details',
  //         ]);
  //       });

  //       $('table').on('click', '#editButton-' + index, function () {
  //         self.router.navigate([
  //           '/company/employees/' + data._id + '/edit/details',
  //         ]);
  //       });

  //       $('table').on('click', '#checkrow-' + index, function () {
  //         self.rowCheckBoxChecked(event, data);
  //       });

  //       $('table').on('click', '#statusLink-' + index, function () {
  //         self.openStatusModal(data);
  //       });

  //       $('#salaryTempLink', row).bind('click', () => {
  //         self.openSalaryTemplateDetailsModal(data);
  //         // self.openSalaryTemplateModal('single', data._id);
  //       });

  //       $('#packageLink', row).bind('click', () => {
  //         self.openPackageDetailsModal(data._id);
  //         // self.openPackageModal('single', data._id);
  //       });

  //       $('#approveButton', row).bind('click', () => {
  //         self.openApproveEmployeeModal(data._id);
  //       });

  //       $('#letterWriting', row).bind('click', () => {
  //         self.openLetterWritingModal('single', data._id);
  //       });

  //       $('#initEmployeeExit', row).bind('click', () => {
  //         self.initEmployeeExit(data);
  //       });

  //       $('#inittds', row).bind('click', () => {
  //         self.router.navigateByUrl('company/employees/' + data._id + '/tds');
  //       });

  //       $("table").on('click', '#deleteButton-' + index, function () {
  //         console.log("delete");
          
  //         self.deleteEmployee(data?._id);
  //       });
        

  //       // $("table").on('click', '#changePassword-' + index, function () {
  //       //   self.getChangePassword(data);
  //       // });

  //       return row;
  //     },
  //     drawCallback: function (settings) {
  //       Global.loadCustomScripts('customJsScript');
  //     },
  //     // "createdRow": function (row, data: any, dataIndex) {
  //     //     let contract_details = data?.employee_details?.contract ?? []
  //     //     if (Array.isArray(contract_details) && contract_details.length > 0) {
  //     //         let value = contract_details[contract_details.length - 1]?.end_date ?? null
  //     //         if (value) {
  //     //             let diff: any = Global.getTimeDifference(Date.parse(value), Date.now(), false);
  //     //             if (diff?.daysDifference < 10) {
  //     //                 $(row).addClass('bg-danger-animated');

  //     //               // console.log('data?.emp_id: ', data?.emp_id);
  //     //             }
  //     //         }
  //     //     }

  //     //     // console.log('data: ', data);
  //     // },
  //     pagingType: 'full_numbers',
  //     serverSide: true,
  //     processing: true,
  //     ordering: true,
  //     searching: false,
  //     pageLength: Global.DataTableLength,
  //     lengthChange: true,
  //     lengthMenu: Global.DataTableLengthChangeMenu,
  //     responsive: true,
  //     order: [],
  //     language: {
  //       searchPlaceholder: 'Search...',
  //       search: '',
  //     },
  //   };
  // }

  fetchMasters() {
    this.companyuserService.getEmployeeMaster().subscribe(
      (res: any) => {
        if (res.status == 'success') {
          if (res.masters.salarytemp && Array.isArray(res.masters.salarytemp)) {
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

          this.approveEmployeeForm.patchValue({
            last_emp_id: res?.masters?.emp_id ?? null,
            // gross_salary: res?.masters?.gross_salary ?? null,
          });

          this.last_emp_id = res?.masters?.emp_id ?? null;
        } else {
          this.toastr.error(res.message);
        }

      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
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

  this.fetchEmployeeList()

    $('#my-datatable')
      .dataTable()
      .api()
      .ajax.reload(function (json) {}, false);
  }

  openStatusModal(item: any) {
    this.changeStatusForm.patchValue({
      status: this.statusMaster.find((obj: any) => {
        return obj.value === item.status;
      }),

      employee_id: item._id,
    });

    $('#changeStatusModalButton').click();
  }

  updateEmployeeStatus(event: any) {
    if (this.changeStatusForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .changeEmployeeStatus({
          status: this.changeStatusForm.value.status?.value ?? '',
          employee_id: this.changeStatusForm.value.employee_id ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              $('#changeStatusModal').find('[data-dismiss="modal"]').click();
              this.fetchEmployeeList()
              // $('#my-datatable')
              //   .dataTable()
              //   .api()
              //   .ajax.reload(function (json) {}, false);
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

  async openSalaryTemplateModal(type: any, employee_id: any = null) {
    Global.resetForm(this.salaryAssignForm);
    this.employeeIdBucket = [];

    if (type == 'single') {
      let employee_details: any = await this.fetchEmployeeDetails(employee_id);
      if (employee_details === false) {
        return;
      }

      this.salaryAssignForm.patchValue({
        salary_temp:
          this.salaryTempMaster.find((obj: any) => {
            return (
              obj.id ===
              employee_details?.emp_det?.employment_hr_details?.salary_temp
            );
          }) ?? null,
      });

      this.employeeIdBucket.push(employee_id);

      if (this.employeeIdBucket.length < 0) {
        this.toastr.warning('No Employee IDs available for the Operation');
      }
    }

    $('#changeSalaryPackageModalButton').click();
  }

  employeeDetails: any = null;
  salaryTempateDetails: any = null;
  openSalaryTemplateDetailsModal(employee: any) {
    let empSalaryTempDetailsModal: any = $('#empSalaryTempDetailsModal');

    this.spinner.show();
    this.companyuserService
      .getEmployeeSalaryDetails({
        emp_db_id: employee?._id,
      })
      .subscribe(
        (res) => {
          if (res.status == 'success') {
            let item = res?.data ?? null;
            (item?.earnings ?? []).forEach((element: any) => {
              element.attendance_relation = element.attendance_relation.replace(
                /_/gi,
                ' '
              );
            });

            this.employeeDetails = employee;
            this.salaryTempateDetails = item;
            empSalaryTempDetailsModal?.modal('show');
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

  packageDetails: any = null;
  openPackageDetailsModal(employee_id: any) {
    let empPackageDetailsModal: any = $('#empPackageDetailsModal');

    this.spinner.show();
    this.companyuserService
      .getEmployeePackageDetails({
        emp_db_id: employee_id,
      })
      .subscribe(
        (res) => {
          if (res.status == 'success') {
            this.packageDetails = res.data?.package_details ?? null;
            this.packageDetails.package_info = res.data?.package_info ?? null;

            empPackageDetailsModal?.modal('show');
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

  updateEmployeeSalaryTemplate(event: any) {
    if (this.salaryAssignForm.valid) {
      event.target.classList.add('btn-loading');

      let payload = this.getBulkUploadPayload();
      payload.salary_temp = this.salaryAssignForm.value.salary_temp?.id ?? '';

      this.companyuserService.changeEmployeeSalaryTemplate(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.employeeIdBucket = [];

            Global.resetForm(this.salaryAssignForm);

            $('#changeSalaryPackageModal')
              .find('[data-dismiss="modal"]')
              .click();
            // $('#my-datatable')
            //   .dataTable()
            //   .api()
            //   .ajax.reload(function (json) {}, false);
            this.fetchEmployeeList()
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

  async openPackageModal(type: any, employee_id: any = null) {
    Global.resetForm(this.packageForm);
    this.employeeIdBucket = [];

    if (type == 'single') {
      let employee_details: any = await this.fetchEmployeeDetails(employee_id);
      if (employee_details === false) {
        return;
      }

      this.packageForm.patchValue({
        package:
          this.packageMaster.find((obj: any) => {
            return (
              obj.id ===
              employee_details?.emp_det?.employment_hr_details?.package_id
            );
          }) ?? null,
      });

      this.employeeIdBucket.push(employee_id);

      if (this.employeeIdBucket.length < 0) {
        this.toastr.warning('No Employee IDs available for the Operation');
      }
    }

    $('#changePackageModalButton').click();
  }

  updateEmployeePackage(event: any) {
    if (this.packageForm.valid) {
      event.target.classList.add('btn-loading');

      let payload = this.getBulkUploadPayload();
      payload.package = this.packageForm.value.package?.id ?? '';

      this.companyuserService.changeEmployeePackage(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.employeeIdBucket = [];

            Global.resetForm(this.packageForm);

            $('#changePackageModal').find('[data-dismiss="modal"]').click();
            // $('#my-datatable')
            //   .dataTable()
            //   .api()
            //   .ajax.reload(function (json) {}, false);
            this.fetchEmployeeList()
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

  async openApproveEmployeeModal(employee_id: any) {
    this.spinner.show()
    this.fetchMasters();

    let employee_details: any = await this.fetchEmployeeDetails(employee_id);
    if (employee_details === false) {
      return;
    }
    let gross_salary =
      employee_details?.emp_det?.employment_hr_details?.gross_salary;
    let date_of_join = employee_details?.emp_det?.employment_hr_details?.date_of_join;
  // console.log(gross_salary);

    await this.approveEmployeeForm.patchValue({
      employee_id: employee_id,
      gross_salary: gross_salary,
      date_of_join: date_of_join,
      package:
        this.packageMaster.find((obj: any) => {
          return (
            obj.id ===
            employee_details?.emp_det?.employment_hr_details?.package_id
          );
        }) ?? null,
      salary_temp:
        this.salaryTempMaster.find((obj: any) => {
          return (
            obj.id ===
            employee_details?.emp_det?.employment_hr_details?.salary_temp
          );
        }) ?? null,
    });
  // console.log(this.approveEmployeeForm.value);
  this.spinner.hide()

    $('#changeApproveEmployeeModalButton').click();
  }

  approveEmployee(event: any) {
    if (this.approveEmployeeForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .approveEmployee({
          package: this.approveEmployeeForm.value.package?.id ?? '',
          salary_temp: this.approveEmployeeForm.value.salary_temp?.id ?? '',
          gross_salary: this.approveEmployeeForm.value.gross_salary ?? '',
          date_of_join: this.approveEmployeeForm.value.date_of_join ?? '',
          employee_id: this.approveEmployeeForm.value.employee_id ?? '',
          emp_id: this.approveEmployeeForm.value.emp_id ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);

              Global.resetForm(this.approveEmployeeForm);

              $('#changeApproveEmployeeModal')
                .find('[data-dismiss="modal"]')
                .click();
              // $('#my-datatable')
              //   .dataTable()
              //   .api()
              //   .ajax.reload(function (json) {}, false);
              this.fetchEmployeeList()
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

  getBulkUploadPayload() {
    let payload: any = {};

    if (this.employeeIdBucket.length > 0) {
      payload = this.employeeListFilter;
      payload.searchkey = this.employeeListFilter.searchkey;
      payload.checked_row_ids = JSON.stringify(this.employeeIdBucket);
      payload.row_checked_all = false;
      payload.unchecked_row_ids = JSON.stringify([]);
    } else {
      payload = this.employeeListFilter;
      payload.searchkey = this.employeeListFilter.searchkey
      payload.row_checked_all = this.rowCheckedAll;
      payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
      payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
    }

    return payload;
  }

  fetchEmployeeDetails(employee_id: any) {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService
        .getEmployeeDetails({ employee_id: employee_id })
        .subscribe(
          (res: any) => {
            this.spinner.hide();
            if (res.status == 'success') {
              resolve(res.employee_det);
            } else {
              this.toastr.error(res.message);
              resolve(false);
            }
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(false);
          }
        );
    });
  }

  openImportModal() {
    $('#csvImportModalButton').click();
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

  importCsv(event: any) {
    if (this.csvImportForm.valid) {
      event.target.classList.add('btn-loading');
      this.csvFailedIds = [];
      this.companyuserService
        .importEmployeeData({
          emp_data_file: this.csvImportForm.value.file
            ? this.csvImportForm.value.file_source
            : '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              Global.resetForm(this.csvImportForm);
              $('#csvImportModal').find('[data-dismiss="modal"]').click();
              this.toastr.success(res.message);

              this.csvFailedIds = res.failed_entry ?? [];
              if (this.csvFailedIds.length > 0) {
                this.toastr.warning(
                  'Please check the CSV few of the Employee ID is incorrect'
                );
                $('#csvFailedIdModalButton')?.click();
              }

              // $('#my-datatable')
              //   .dataTable()
              //   .api()
              //   .ajax.reload(function (json) {}, false);
              this.fetchEmployeeList()
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

  // getCsvSample(event: any) {
  //   event.target.classList.add('btn-loading');
  //   this.companyuserService
  //     .exportSampleEmployeeFile({
  //       //payload
  //     })
  //     .subscribe(
  //       (res) => {
  //         event.target.classList.remove('btn-loading');
  //         if (res.status == 'success') {
  //         } else if (res.status == 'val_err') {
  //           this.toastr.error(Global.showValidationMessage(res.val_msg));
  //         } else {
  //           this.toastr.error(res.message);
  //         }
  //       },
  //       (err) => {
  //         event.target.classList.remove('btn-loading');
  //         this.toastr.error(Global.showServerErrorMessage(err));
  //       }
  //     );
  // }

  async getCsvSample(event: any) {
    try {
      event.target.classList.add('btn-loading');
      await this.companyuserService.downloadFile(
        'export-sample-employee-file',
        'Employee-Sample'
      );
      // saveAs(file,'Employee-Sample');
      event.target.classList.remove('btn-loading');
    } catch (err: any) {
      event.target.classList.remove('btn-loading');
      this.toastr.error(err.message);
    }
  }

  /**
   * START OF EMPLOYEE EXPORT FUNCTIONS
   * ----------------------------------
   */

  employeeExportCustomFields: any[] = [
    {
      section: 'Personal Details',
      values: [
        { label: 'Employee ID', value: 'emp_id' },
        { label: 'Employee First Name', value: 'emp_first_name' },
        { label: 'Employee Last Name', value: 'emp_last_name' },
        { label: "Employee Father's Name", value: 'emp_father_name' },
        { label: 'Employee Email', value: 'email_id' },
        { label: 'Mobile Number', value: 'mobile_no' },
        { label: 'Alternative Mobile Number', value: 'alternate_mob_no' },
        { label: 'Date of Birth', value: 'emp_dob' },
        { label: 'Gender', value: 'sex' },
        { label: 'Aadhaar Number', value: 'aadhar_no' },
        { label: 'PAN Number', value: 'pan_no' },
        { label: 'Passport Number', value: 'passport_no' },
        { label: 'Passport Valid From', value: 'passport_val_form' },
        { label: 'Passport Valid To', value: 'passport_val_to' },
        { label: 'Nationality', value: 'nationality' },
        { label: 'Blood Group', value: 'blood_group' },
        { label: 'Physical Disability', value: 'physical_disability' },
        { label: 'Marital Status', value: 'marital_status' },
        { label: 'Marriage Date', value: 'marriage_date' },
        { label: 'Emergency Contact Number', value: 'emergency_contact_no' },
        { label: 'Emergency Contact Person', value: 'emergency_contact_name' },
        { label: 'Domicile', value: 'domicile' },
        { label: 'Height', value: 'height' },
        { label: 'Religion', value: 'religion' },
      ],
    },
    {
      section: 'Permanent Address',
      values: [
        { label: 'Resident No', value: 'resident_no' },
        { label: 'Residential Name', value: 'residential_name' },
        { label: 'Road', value: 'road' },
        { label: 'Locality', value: 'locality' },
        { label: 'City', value: 'city' },
        { label: 'District', value: 'district' },
        { label: 'State', value: 'state' },
        { label: 'Pincode', value: 'pincode' },
        { label: 'Country', value: 'country' },
      ],
    },
    {
      section: 'Current Address',
      values: [
        { label: 'Resident Current No', value: 'curr_resident_no' },
        { label: 'Residential Current Name', value: 'curr_residential_name' },
        { label: 'Current Road', value: 'curr_road' },
        { label: 'Current Locality', value: 'curr_locality' },
        { label: 'Current City', value: 'curr_city' },
        { label: 'Current District', value: 'curr_district' },
        { label: 'Current State', value: 'curr_state' },
        { label: 'Current Pincode', value: 'curr_pincode' },
        { label: 'Country', value: 'country' },
      ],
    },
    {
      section: 'Bank Details',
      values: [
        { label: 'Bank A/C Name', value: 'bank_name' },
        { label: 'Bank Branch Name', value: 'branch_name' },
        { label: 'Bank Branch Address', value: 'branch_address' },
        { label: 'Bank Branch Pin', value: 'branch_pin' },
        { label: 'Bank A/C No', value: 'account_no' },
        { label: 'Bank A/C Type', value: 'account_type' },
        { label: 'Bank IFSC Code', value: 'ifsc_code' },
        { label: 'Bank MICR No', value: 'micr_no' },
      ],
    },
    {
      section: 'Previous ER PF & ESI',
      values: [
        { label: 'Prev ER Name', value: 'pre_er_pf' },
        { label: 'Exit Dt', value: 'pre_exit_date' },
        { label: 'Last Drawn Gross', value: 'pre_last_drawn_gross' },
        { label: 'Last Designetion', value: 'pre_last_designation' },
        { label: 'Reporting to', value: 'pre_reporting_to' },
        { label: 'Contact No', value: 'pre_contact_no' },
        { label: 'UAN no', value: 'pre_uan_no' },
        { label: 'ESI no', value: 'pre_esic_no' },
        { label: 'Last PF Member ID', value: 'pre_last_member_id' },
        { label: 'IP Dispensary', value: 'pre_ip_dispensary' },
        { label: 'Last RO', value: 'pre_last_ro' },
        { label: 'Family Dispensary', value: 'pre_family_dispensary' },
      ],
    },
    {
      section: 'Current ER PF & ESI',
      values: [
        { label: 'UAN No', value: 'curr_uan_no' },
        { label: 'Current Member ID', value: 'curr_last_member_id' },
        { label: 'Current RO', value: 'curr_last_ro' },
        { label: 'PF DT Of Membership', value: 'curr_epfo_membership_date' },
        { label: 'ESIC No', value: 'curr_esic_no' },
        { label: 'IP Dispensary', value: 'curr_ip_dispensary' },
        { label: 'Family Dispensary', value: 'curr_family_dispensary' },
        { label: 'ESI DT Of Membership', value: 'curr_esic_membership_date' },
      ],
    },
    {
      section: 'HR Details',
      values: [
        { label: 'Department', value: 'department_name' },
        { label: 'Designation', value: 'designation_name' },
        { label: 'Branch', value: 'branch' },
        { label: 'DOJ', value: 'date_of_join' },
        { label: 'HOD', value: 'hod_name' },
        { label: 'Client', value: 'client_code' },
        { label: 'Employment Type', value: 'emp_type' },
        { label: 'Pension Applicability', value: 'pension_applicable' },
        { label: 'Gross Salary', value: 'gross_sallery' },
        { label: 'Employee Role Set', value: 'emp_role' },
        // { label: 'User ID', value: 'emp_id' },
        { label: 'Self Service Status', value: 'emp_self_service' },
        { label: 'Salary Template ', value: 'salary_temp' },
        { label: 'Policy Package', value: 'package_name' },
      ],
    },

    // { 'label': "Employee ID", 'value': "emp_id" },
    // { 'label': "Employee First Name", 'value': "emp_first_name" },
    // { 'label': "Employee Last Name", 'value': "emp_last_name" },
    // { 'label': "Employee Father\'s Name", 'value': "emp_father_name" },
    // { 'label': "Employee ID", 'value': "email_id" },
    // { 'label': "Mobile Number", 'value': "mobile_no" },
    // { 'label': "Alternative Mobile Number", 'value': "alternate_mob_no" },
    // { 'label': "Date of Birth", 'value': "emp_dob" },
    // { 'label': "Gender", 'value': "sex" },
    // { 'label': "Aadhaar Number", 'value': "aadhar_no" },
    // { 'label': "PAN Number", 'value': "pan_no" },
    // { 'label': "Passport Number", 'value': "passport_no" },
    // { 'label': "Passport Valid From", 'value': "passport_val_form" },
    // { 'label': "Passport Valid To", 'value': "passport_val_to" },
    // { 'label': "Nationality", 'value': "nationality" },
    // { 'label': "Blood Group", 'value': "blood_group" },
    // { 'label': "Physical Disability", 'value': "physical_disability" },
    // { 'label': "Marital Status", 'value': "marital_status" },
    // { 'label': "Marriage Date", 'value': "marriage_date" },
    // { 'label': "Emergency Contact Number", 'value': "emergency_contact_no" },
    // { 'label': "Emergency Contact Person", 'value': "emergency_contact_name" },
    // { 'label': "Domicile", 'value': "domicile" },
    // { 'label': "Height", 'value': "height" },
    // { 'label': "Religion", 'value': "religion" },
    // { 'label': "Resident No", 'value': "resident_no" },
    // { 'label': "Residential Name", 'value': "residential_name" },
    // { 'label': "Road", 'value': "road" },
    // { 'label': "Locality", 'value': "locality" },
    // { 'label': "City", 'value': "city" },
    // { 'label': "District", 'value': "district" },
    // { 'label': "State", 'value': "state" },
    // { 'label': "Pincode", 'value': "pincode" },
    // { 'label': "Resident Current No", 'value': "curr_resident_no" },
    // { 'label': "Residential Current Name", 'value': "curr_residential_name" },
    // { 'label': "Current Road", 'value': "curr_road" },
    // { 'label': "Current Locality", 'value': "curr_locality" },
    // { 'label': "Current City", 'value': "curr_city" },
    // { 'label': "Current District", 'value': "curr_district" },
    // { 'label': "Current State", 'value': "curr_state" },
    // { 'label': "Current Pincode", 'value': "curr_pincode" },
    // { 'label': "pre_er_pf", 'value': "pre_er_pf" },
    // { 'label': "pre_er_name", 'value': "pre_er_name" },
    // { 'label': "pre_exit_date", 'value': "pre_exit_date" },
    // { 'label': "pre_last_drawn_gross", 'value': "pre_last_drawn_gross" },
    // { 'label': "pre_last_designation", 'value': "pre_last_designation" },
    // { 'label': "pre_reporting_to", 'value': "pre_reporting_to" },
    // { 'label': "pre_contact_no", 'value': "pre_contact_no" },
    // { 'label': "pre_uan_no", 'value': "pre_uan_no" },
    // { 'label': "pre_last_member_id", 'value': "pre_last_member_id" },
    // { 'label': "pre_last_ro", 'value': "pre_last_ro" },
    // { 'label': "pre_esic_no", 'value': "pre_esic_no" },
    // { 'label': "pre_ip_dispensary", 'value': "pre_ip_dispensary" },
    // { 'label': "pre_family_dispensary", 'value': "pre_family_dispensary" },
    // { 'label': "curr_uan_no", 'value': "curr_uan_no" },
    // { 'label': "curr_last_member_id", 'value': "curr_last_member_id" },
    // { 'label': "curr_last_ro", 'value': "curr_last_ro" },
    // { 'label': "curr_epfo_membership_date", 'value': "curr_epfo_membership_date" },
    // { 'label': "curr_esic_no", 'value': "curr_esic_no" },
    // { 'label': "curr_ip_dispensary", 'value': "curr_ip_dispensary" },
    // { 'label': "curr_family_dispensary", 'value': "curr_family_dispensary" },
    // { 'label': "curr_esic_membership_date", 'value': "curr_esic_membership_date" },
    // { 'label': "Bank A/C Name", 'value': "bank_name" },
    // { 'label': "Bank Branch Name", 'value': "branch_name" },
    // { 'label': "Bank Branch Address", 'value': "branch_address" },
    // { 'label': "Bank Branch Pin", 'value': "branch_pin" },
    // { 'label': "Bank A/C No", 'value': "account_no" },
    // { 'label': "Bank A/C Type", 'value': "account_type" },
    // { 'label': "Bank IFSC Code", 'value': "ifsc_code" },
    // { 'label': "Bank MICR No", 'value': "micr_no" },
    // { 'label': "Department", 'value': "department_name" },
    // { 'label': "Designation", 'value': "designation_name" },
    // { 'label': "Branch", 'value': "branch_name" },
    // { 'label': "Date of Join", 'value': "date_of_join" },
    // { 'label': "HOD", 'value': "hod_name" },
    // { 'label': "Client Code", 'value': "client_code" },
    // { 'label': "Employment Type", 'value': "emp_type" },
    // { 'label': "Pension Applicable", 'value': "pension_applicable" },
    // { 'label': "Gross Salary", 'value': "gross_sallery" },
    // { 'label': "Employee Role", 'value': "emp_role" },
    // { 'label': "Employee ID", 'value': "emp_id" },
    // { 'label': "Employee Self Service", 'value': "emp_self_service" },
    // { 'label': "Salary Template", 'value': "salary_temp" },
    // { 'label': "Package Name", 'value': "package_name" },
  ];

  rowSelecion(e: any, name: string) {
    let checkboxes: any = document.getElementsByName(`fields[${name}]`);
    for (const checkbox of checkboxes) {
      checkbox.checked = e.target.checked;
    }
  }

  initEmployeeExport() {
    // if (this.rowCheckedAll == false && (this.checkedRowIds.length == 0 && this.uncheckedRowIds.length == 0)) {
    //     return;
    // }

    this.cancelEmployeeExport();
    $('#employeeExportModalButton')?.click();
  }

  cancelEmployeeExport() {
    Global.resetForm(this.employeeExportForm);
    $('#employeeExportModal')?.find('[data-dismiss="modal"]')?.click();
  }

  // exportEmployees(event: any) {
  //   this.employeeExportForm.markAllAsTouched();
  //   setTimeout(function () {
  //     Global.scrollToQuery('p.error-element');
  //   }, 100);

  //   if (this.employeeExportForm.valid) {
  //     let download_data_type = this.employeeExportForm.value?.download_data_type;
  //     if (download_data_type && download_data_type?.type) {
  //       this.previewPfBulkTemplate(download_data_type?.type);
  //       return;
  //     }

  //     let payload: any = this.getBulkUploadPayload();
  //     // payload.download_data_type =
  //     //   this.employeeExportForm?.value?.download_data_type?.value;
  //     payload.download_data_type = 'custom';
  //     const FIELD_SET = this.employeeExportForm.get('field_set')?.value;

  //     //       const FIELD_SET =
  //     //         (this.employeeExportForm.get('field_set')?.value ?? [])
  //     //           .map((v: any, i: any) =>
  //     //             v ? this.employeeExportCustomFields[i].values : null
  //     //           )
  //     //           .filter((v: any) => v !== null) ?? [];

  //     if (payload.download_data_type == 'custom' && FIELD_SET?.length < 1) {
  //       this.toastr.error('Please select atleast one field');
  //       return;
  //     } else {
  //       payload.field_set = JSON.stringify(FIELD_SET);
  //     }

  //     event.target.classList.add('btn-loading');
  //     this.companyuserService.downloadFile('export-employee-list','Exported-Employees', payload)
  //     // .subscribe(
  //       // (res) => {
  //       //   if (res.status == 'success') {
  //       //     this.cancelEmployeeExport();
  //       //   } else if (res.status == 'val_err') {
  //       //     this.toastr.error(Global.showValidationMessage(res.val_msg));
  //       //   } else {
  //       //     this.toastr.error(res.message);
  //       //   }

  //       //   event.target.classList.remove('btn-loading');
  //       // },
  //       // (err) => {
  //       //   event.target.classList.remove('btn-loading');
  //       //   this.toastr.error(Global.showServerErrorMessage(err));
  //       // }
  //     // );
  //   }
  // }

  async exportEmployees(event: HTMLElement) {

    this.employeeExportForm.markAllAsTouched();
    setTimeout(function () {
      Global.scrollToQuery('p.error-element');
    }, 100);

    if (this.employeeExportForm.valid) {
      event.classList.add('btn-loading');
      let download_data_type =
        this.employeeExportForm.value?.download_data_type;
      if (download_data_type && (download_data_type?.type == 'join' || download_data_type?.type == 'exit')) {
        this.previewPfBulkTemplate(download_data_type?.type);
      event.classList.remove('btn-loading');

        return;
      }
      if (download_data_type && (download_data_type?.type == 'form_a')) {
        this.previewFormA(download_data_type?.type);
      event.classList.remove('btn-loading');

        return;
      }
      if (download_data_type && (download_data_type?.type == 'salary_certificate')) {
        this.previewSalaryCerti(download_data_type?.type);
        event.classList.remove('btn-loading');
        return;
      }

      let payload: any = this.getBulkUploadPayload();
      let template_name = download_data_type.template_name;
      payload.download_data_type = 'custom';
      const FIELD_SET = this.employeeExportForm.get('field_set')?.value;

      if (payload.download_data_type == 'custom' && FIELD_SET?.length < 1) {
        this.toastr.error('Please select atleast one field');
       event.classList.remove('btn-loading');
        return;
      } else {
        payload.field_set = JSON.stringify(FIELD_SET);
      }

      // event.classList.add('btn-loading');
      await this.companyuserService.downloadFile(
        'export-employee-list',
        `employee-list(${template_name})`,
        payload
      ).catch(err=>{
      event.classList.remove('btn-loading');
      });
      event.classList.remove('btn-loading');
      
      // this.companyuserService.exportEmployeeData(payload).subscribe(
      //   (res) => {
      //     if (res.status == 'success') {
      //       this.cancelEmployeeExport();
      //     } else if (res.status == 'val_err') {
      //       this.toastr.error(Global.showValidationMessage(res.val_msg));
      //     } else {
      //       this.toastr.error(res.message);
      //     }

      //     event.target.classList.remove('btn-loading');
      //   },
      //   (err) => {
      //     event.target.classList.remove('btn-loading');
      //     this.toastr.error(Global.showServerErrorMessage(err));
      //   }
      // );
    }
  }

  // dssfdsdf
  async previewPfBulkTemplate(templateType: string) {
    try {
      let payload = this.getBulkUploadPayload();
      let res: any;

      if (templateType == 'join') {
        res = await this.companyuserService
          .employeeBlukJoinReport(payload)
          .toPromise();
      } else {
        res = await this.companyuserService
          .employeeBlukExitReport(payload)
          .toPromise();
      }
      if (res.status !== 'success') throw res;
      this.companyuserService.setPrintDoc({
        docs: res?.employees?.docs,
        template_type: templateType,
        payload,
      });
      this.router.navigate([`/company/employees/pf-bulk/${templateType}`]);
      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }

  async previewFormA(templateType: string) {
    try {
      let payload = this.getReportPayload();
      payload.pageno = 1;
      payload.perpage = 20
      // payload.generate = 'excel';
      
      const res = await this.companyuserService
      .fetchEmployeeFormAListing(payload)
      .toPromise();

      if (res.status !== 'success') throw res;

      this.companyuserService.setPrintDoc({
        docs: res?.employees,
        companyDetails: res?.company,
        payload,
      });
      
      this.router.navigate([`/company/employees/form-a`]);
      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
  async previewSalaryCerti(templateType: string) {
    try {
      // let payload = this.getReportPayload();
      const request = this.getReportPayload()
      let payload:any = {
        row_checked_all:request?.row_checked_all,
        checked_row_ids:request?.checked_row_ids,
        unchecked_row_ids:request?.unchecked_row_ids,
        "is_view":"1"
      }

      payload.pageno = 1;
      payload.perpage = 20
      // payload.generate = 'excel';
      
      const res = await this.companyuserService
      .fetchEmployeeSalaryCerti(payload)
      .toPromise();

      if (res.status !== 'success') throw res;
     
       
      this.companyuserService.setSalaryCerti({
        docs: res?.employee,
        // companyDetails: res?.company,
        payload,
      });
      
      this.router.navigate([`/company/employees/salary-certificate`]);
      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }

  async downloadSalaryCertificates() {
    try {
      const request = this.getReportPayload()
      let payload = {
          row_checked_all:request?.row_checked_all,
          checked_row_ids:request?.checked_row_ids,
          unchecked_row_ids:request?.unchecked_row_ids,
          "is_view":"1"
        }
      
      
      
      const res = await this.companyuserService.downloadFile('earning-certificate-export-pdf' ,'salary-certificates', payload);

      // if (res.status !== 'success') throw res;

      // this.companyuserService.setPrintDoc({
      //   docs: res?.employees,
      //   companyDetails: res?.company,
      //   payload,
      // });
      
      // this.router.navigate([`/company/employees/form-a`]);
      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
  
 

  exportEmployeesExtraData(fieldSet: any, sec: any, e: any) {
    // this.employeeExportForm.markAllAsTouched();
    setTimeout(function () {
      Global.scrollToQuery('p.error-element');
    }, 100);

    if (fieldSet) {
      let payload: any = this.getBulkUploadPayload();
      payload.field_set = fieldSet;

      e.target.classList.add('btn-loading');

      this.companyuserService.exportEmployeeExtraData(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.companyuserService.setDocs(res.employees);
            this.router.navigate([`/company/employees/${null}/print`], {
              queryParams: { section: sec },
            });
          } else if (res.status == 'val_err') {
            this.toastr.error(Global.showValidationMessage(res.val_msg));
          } else {
            this.toastr.error(res.message);
          }

          e.target.classList.remove('btn-loading');
        },
        (err) => {
          e.target.classList.remove('btn-loading');
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
    }
  }

  async submitTemplate(event: any) {
    this.templateForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.text-danger');
    }, 300);

    if (!this.template_fields.length) {
      this.toastr.error('Please select atleast one field');
      return;
    }

    if (this.templateForm.valid && this.template_fields.length) {
      let document = {
        template_name: this.templateForm.value.template_name,
        template_fields: JSON.stringify(this.template_fields),
        temp_module_for: 'employee_sheet',
      };
      // console.log(document);
      event.target.classList.add('btn-loading');
      this.companyuserService.createEmployeeSheetTemplate(document).subscribe(
        (res) => {
          if (res.status == 'success') {
            // console.log(res);
            this.fetchSettingsTemplate()
            this.toastr.success(res.message);
            this.template_fields = [];
            this.cancelTemplateCreate();
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

  async updateTemplate(event: any) {
    this.templateForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.text-danger');
    }, 300);

    if (!this.template_fields.length) {
      this.toastr.error('Please select atleast one field');
      return;
    }

    if (this.templateForm.valid && this.template_fields.length) {
      
      let document = {
        template_id: this.employeeExportForm.get('download_data_type')?.value?._id,
        template_name: this.templateForm.value.template_name,
        template_fields: JSON.stringify(this.template_fields),
        temp_module_for: 'employee_sheet',
      };
      // console.log(document);
      event.target.classList.add('btn-loading');
      this.companyuserService.updateEmployeeSheetTemplate(document).subscribe(
        (res) => {
          if (res.status == 'success') {
            // console.log(res);
            this.fetchSettingsTemplate()
            this.toastr.success(res.message);
            this.template_fields = [];
            this.cancelTemplateCreate();
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

  adjustTemplateFields(field: any[], e: any) {
    let arr = field.map((d) => {
      return d.value;
    });
    if (e.target.checked) {
      this.template_fields.push(...arr);
    } else {
      arr.forEach((element) => {
        let i = this.template_fields.indexOf(element);
        if (i > -1) {
          this.template_fields.splice(i, 1);
        }
      });
    }
  }

  /**
   * END OF EMPLOYEE EXPORT FUNCTIONS
   * --------------------------------
   */

  openBulkApproveEmployeeModal() {
    this.spinner.show();
    this.companyuserService
      .getUnapprovedEmployees(this.getBulkUploadPayload())
      .subscribe(
        (res) => {
          this.spinner.hide();
          if (res.status == 'success') {
            if (!res.emp_list || res.emp_list.length == 0) {
              this.toastr.error('No employees found for approval');
              return;
            }

            this.resetAllTemplateRows(this.multipleApproveEmployeeForm, true);
            res.emp_list.forEach((element: any) => {
              let data: any = {
                employee_id: element._id,
                employee_details: element,
                userid: element?.userid,
                package: null,
                salary_temp: null,
                gross_salary: 0,
                date_of_join: null,
              };

              this.addTemplateRows(
                this.multipleApproveEmployeeForm,
                'employees',
                data
              );
            });

            $('#multipleEmpApproveModalButton')?.click();
          } else if (res.status == 'val_err') {
            this.toastr.error(Global.showValidationMessage(res.val_msg));
          } else {
            this.toastr.error(res.message);
          }
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
  }

  submitMultipleApproveEmployee(event: any) {
    if (this.multipleApproveEmployeeForm.valid) {
      let employeedata: any[] = [];
      this.multipleApproveEmployeeForm.value.employees.forEach(
        (element: any) => {
          employeedata.push({
            employee_id: element?.employee_id ?? '',
            emp_id: element?.userid ?? '',
            gross_salary: element?.gross_salary ?? '',
            date_of_join: element?.date_of_join ?? '',
            salary_temp: element?.salary_temp?.id ?? '',
            package: element?.package?.id ?? '',
          });
        }
      );

      if (employeedata.length < 1) {
        this.toastr.error('There must be atleast one employee to continue');
        return;
      }

      event.target.classList.add('btn-loading');
      this.companyuserService
        .submitEmployeeBulkApprove({
          employeedata: JSON.stringify(employeedata),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              // $('#my-datatable')
              //   .dataTable()
              //   .api()
              //   .ajax.reload(function (json) {}, false);
              this.fetchEmployeeList();
              $('#multipleEmpApproveModal')
                .find('[data-dismiss="modal"]')
                .click();
              this.resetAllTemplateRows(this.multipleApproveEmployeeForm);
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

  async openLetterWritingModal(type: any, employee_id: any = null) {
    Global.resetForm(this.employeeLetterWritingForm);
    this.employeeIdBucket = [];

    if (type == 'single') {
      // let employee_details: any = await this.fetchEmployeeDetails(employee_id);
      // if (employee_details === false) {
      //   return;
      // }

      // this.employeeLetterWritingForm.patchValue({
      //   'template': null
      // })

      this.employeeIdBucket.push(employee_id);

      if (this.employeeIdBucket.length < 0) {
        this.toastr.warning('No Employee IDs available for the Operation');
      }
    }

    $('#generateLetterWritingModalButton').click();
  }

  

  generateLetterWritingTemplate(event: any) {
    if (this.employeeLetterWritingForm.valid) {
      event.target.classList.add('btn-loading');

      let payload = this.getBulkUploadPayload();
      payload.template_id =
        this.employeeLetterWritingForm.value.template?.id ?? '';

      this.companyuserService
        .generateEmployeeLetterWrtingTemplate(payload)
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.letterWritingEmployees = res?.emps ?? [];
              this.employeeIdBucket = [];
              this.toastr.success('Letter generated successfully');
              Global.resetForm(this.employeeLetterWritingForm);
              $('#generateLetterWritingModal')
                .find('[data-dismiss="modal"]')
                .click();

              setTimeout(function () {
                $('#letterWritingEmpModalButton')?.click();
              }, 500);
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

  generatePdf(htmlContent: any) {
    // console.log(htmlContent);
    const doc = new jsPDF();

    var html = htmlToPdfmake(htmlContent);

    const documentDefinition = { content: html };
    pdfMake.createPdf(documentDefinition).open();
  }

  generateDoc(htmlContent: any) {
    // console.log(htmlContent);
  }

  /**
   * Start of Employee Exit Functions
   * --------------------------------
   */
  exitEmployeeDetails: any = null;
  initEmployeeExit(employee: any) {
    this.camcelEmployeeExit();

    this.exitEmployeeDetails = employee;
    this.employeeExitComponent?.ngOnInit();
    $('#employeeExitModalButton')?.click();
  }

  camcelEmployeeExit() {
    this.exitEmployeeDetails = null;
    this.employeeExitComponent?.ngOnDestroy();
    $('#employeeExitModal')?.find('[data-dismiss="modal"]')?.click();
  }

  isSheetTemplateEdit:boolean = false

  initTemplateCreate() {
    
    let selectedTempate = this.employeeExportForm.get("download_data_type")?.value;
    if(Array.isArray(selectedTempate)) selectedTempate.length ? null : (selectedTempate = null);
    
    if(selectedTempate){
      this.cancelTemplateCreate();
      this.templateForm.get("template_name")?.setValue(selectedTempate?.template_name)
      this.isSheetTemplateEdit = true
      const control = <UntypedFormArray>(
        this.employeeExportForm.get('field_set')
      );
      selectedTempate.template_fields.forEach((field:any) => {
        this.template_fields.push(field)
        control.push(new UntypedFormControl(field));
        const el:HTMLInputElement = document.getElementById('field_'+field) as HTMLInputElement;
        if(el){
          el.checked = true
        }
      })
    }else{
      this.isSheetTemplateEdit = false
    }

    $('#settingsTemplateModalOpen')?.click();
  }

  resetSelectedModules() {
    this.employeeExportCustomFields.forEach((row: any) => {
      $('input[name="fields[' + row.section + ']"]:checked').each(function () {
        $(this).prop('checked', false);
      });
    });
  }

  cancelTemplateCreate() {
    $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
    Global.resetForm(this.templateForm);
    this.resetSelectedModules();
  }

  async generateInviteLink(e: any) {
    try {
      let res = await this.companyuserService
        .generateEmployeeInviteLink({
          hod_id: this.invitationForm.value?.hod_id?.id,
        })
        .toPromise();

      if (res.status !== 'success') throw res;
      this.invitationLink = res.url;
      this.toastr.success(res.message);
    } catch (err: any) {
      e.target.classList.remove('btn-loading');
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  async openInviteEmployee(e: any) {
    try {
      $('#inviteEmployeeModalOpen').click();
    } catch (err: any) {
      e.target.classList.remove('btn-loading');
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.invitationLink);
    this.toastr.success('Link Copied!');
  }

  async deleteEmployee(employee:any){
    try {
      if(!employee?._id) return;
      if(!(!employee?.emp_id || ((employee?.status != 'deleted' || employee?.status != 'inactive') && employee?.attendance_count <= 0 && employee?.monthly_reports_count <= 0))){
        return
      }
      this.spinner.show();
      const res = await this.companyuserService.deleteEmployee({employee_id:employee?._id}).toPromise();
      if(res.status != 'success') throw res;
      // $('#my-datatable_filter').find('[type="search"]').val('');
      // $('#my-datatable').DataTable().search('').draw();
      this.fetchEmployeeList()
      this.spinner.hide();
      this.toastr.success(res.message);
    } catch (err:any) {
      this.spinner.hide();

      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(err.message || err ||  "Something Went Wrong!");
      }
    }
  }

  /**
   * End of Employee Exit Functions
   * ------------------------------
   */
}
