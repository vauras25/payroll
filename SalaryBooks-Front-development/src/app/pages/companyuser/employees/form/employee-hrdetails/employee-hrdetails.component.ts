import { Component, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  UntypedFormBuilder,
  FormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import { DatePipe } from '@angular/common';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'companyuser-app-employee-form-hrdetails',
  templateUrl: './employee-hrdetails.component.html',
  styleUrls: ['./employee-hrdetails.component.css'],
})
export class CMPEmployeeHrdetailsFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  employee_details: any;
  isSelfService: boolean;
  locationModalData:any

  employeeHrDetailsForm: UntypedFormGroup;

  branchMaster: any[] = [];
  designationMaster: any[] = [];
  departmentMaster: any[] = [];
  wageTypeMaster: any[] = [];
  employeePackagesMaster: any[] = [];
  salaryTempMaster: any[] = [];
  hodMaster: any[] = [];
  clientMaster: any[] = [];
  empRoleMaster: any[] = [];
  locationMaster: any[] = [];
  employeeRoles:any[] = [];

  yesNoMaster: any[] = [
    { value: 'yes', description: 'Yes' },
    { value: 'no', description: 'No' },
  ];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    private AppComponent: AppComponent
  ) {
    this.employeeHrDetailsForm = formBuilder.group({
      department: [null, Validators.compose([])],
      designation: [null, Validators.compose([])],
      branch: [null, Validators.compose([])],
      date_of_join: [{value:null, disabled: true}],
      hod: [null, Validators.compose([])],
      client: [null, Validators.compose([])],
      emp_type: [null, Validators.compose([])],
      pension_applicable: [null, Validators.compose([])],
      gross_salary: [{ value: null, disabled: true }],
      emp_role: [null, Validators.compose([])],
      emp_self_service: [null, Validators.compose([])],
      location: [null, Validators.compose([])],
      emp_id: [{ value: null, disabled: true }],
      password: [
        null,
        Validators.compose([Validators.minLength(8), Validators.maxLength(20)]),
      ],
      salary_temp: [null],
      package_id: [null],
    });

    this.wageTypeMaster = [
      { value: 'daily', description: 'Daily' },
      { value: 'weekly', description: 'Weekly' },
      { value: 'monthly', description: 'Monthly' },
    ];
    this.employeeHrDetailsForm.get('location')?.valueChanges.subscribe(v =>{
        if(v){
            this.locationModalData = v
        }
    })
  }

  ngOnInit(): void {
    this.titleService.setTitle('Employees - ' + Global.AppName);

    this.activatedRoute.params.subscribe(
      (params) => (this.employee_id = params['employee_id'] ?? null)
    );

    this.fetchLocationMaster();
    this.getEmployeeMaster();

    if (!this.employee_id) {
      this.operation = 'add';
    } else {
      let r = this.router.url.split('/');
      if (r[4] == 'view') {
        this.operation = 'view';
        $('input').attr('disabled', 'true');
      } else if (r[4] == 'edit') {
        this.operation = 'edit';
      }
    }

    // if (
    //   !this.AppComponent.checkCompanyModulePermission({
    //     staff_module: 'employee_hr_details',
    //     staff_operation: [this.operation],
    //     company_strict: true,
    //   })
    // ) {
    //   setTimeout(() => {
    //     this.router.navigate(['company/errors/unauthorized-access'], {
    //       skipLocationChange: true,
    //     });
    //   }, 500);
    //   return;
    // }
  }

  @ViewChild('selfSevice') selfSevice:any
  updateEmployeeHrDetails(event: any) {
  // console.log(event);
    
      if (!$('.emp-selfservice').hasClass('on') || this.employee_details?.emp_det?.template_data?.attendance_temp_data?.register_type !== 'time') {
        this.employeeHrDetailsForm.get('location')?.clearValidators()
        this.employeeHrDetailsForm.get('location')?.updateValueAndValidity()
      }
    this.employeeHrDetailsForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');2
    if (this.employeeHrDetailsForm.valid) {
      event.target.classList.add('btn-loading');
      if(!this.selfSevice?.nativeElement?.classList.contains('on')) {
        this.employeeHrDetailsForm?.get('emp_role')?.setValue('')
      }
      this.companyuserService
        .updateEmployeeHrDetails({
          department: this.employeeHrDetailsForm?.value?.department?.id ?? '',
          designation: this.employeeHrDetailsForm?.value?.designation?.id ?? '',
          branch: this.employeeHrDetailsForm?.value?.branch?.id ?? '',
          date_of_join: this.employeeHrDetailsForm?.value?.date_of_join ?? '',
          hod: this.employeeHrDetailsForm?.value?.hod?.id ?? '',
          client: this.employeeHrDetailsForm?.value?.client?.id ?? '',
          emp_type: this.employeeHrDetailsForm?.value?.emp_type?.value ?? '',
          pension_applicable:
            this.employeeHrDetailsForm?.value?.pension_applicable?.value ?? '',
          gross_salary:
            this.employeeHrDetailsForm?.get('gross_salary')?.value ?? '',
          emp_role: this.employeeHrDetailsForm?.value?.emp_role?.id ?? '',
          emp_self_service:
            $('.emp-selfservice').hasClass('on') == true ? 'yes' : 'no',
          emp_id: this.employeeHrDetailsForm?.value?.emp_id ?? '',
          password: this.employeeHrDetailsForm?.value?.password ?? '',
          employee_id: this.employee_id,
          location_id: ($('.emp-selfservice').hasClass('on') && this.employee_details?.emp_det?.template_data?.attendance_temp_data?.register_type == 'time'
           && this.employeeHrDetailsForm?.value?.location?._id) ? this.employeeHrDetailsForm?.value?.location?._id
            : "",
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEntry();

              this.fetchEmployeeDetails();
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

  fetchEmployeeDetails() {
    this.spinner.show();
    this.companyuserService
      .getEmployeeDetails({ employee_id: this.employee_id })
      .subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.employee_details = res.employee_det;

            if (this.operation == 'view') {
              this.employeeHrDetailsForm.patchValue({
                department:
                  this.departmentMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.department
                    );
                  }) ?? 'N/A',
                designation:
                  this.designationMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.designation
                    );
                  }) ?? 'N/A',
                branch:
                  this.branchMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.branch
                    );
                  }) ?? 'N/A',
                date_of_join:
                  this.employee_details.emp_det?.employment_hr_details
                    ?.date_of_join ?? 'N/A',
                hod:
                  this.hodMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details?.hod
                    );
                  }) ?? 'N/A',
                client:
                  this.clientMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.client
                    );
                  }) ?? 'N/A',
                emp_type:
                  this.wageTypeMaster.find((obj: any) => {
                    return (
                      obj.value ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.emp_type
                    );
                  }) ?? 'N/A',
                pension_applicable:
                  this.yesNoMaster.find((obj: any) => {
                    return (
                      obj.value ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.pension_applicable
                    );
                  }) ?? 'N/A',
                gross_salary:
                  this.employee_details.emp_det?.employment_hr_details
                    ?.gross_salary ?? 'N/A',
                emp_role:
                  this.empRoleMaster.find((obj: any) => {
                    return (
                      obj.id ==
                      this.employee_details.emp_det?.employment_hr_details
                        ?.emp_role
                    );
                  }) ?? 'N/A',
                  location:
                  this.locationMaster.find((obj: any) => {
                    return (
                      obj._id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.location_id
                    );
                  }) ?? '',
                // 'emp_self_service': this.employee_details.emp_det?.employment_hr_details?.emp_self_service ?? "N/A",
                emp_id: this.employee_details?.emp_id ?? 'N/A',
              });
            } else {
              this.employeeHrDetailsForm.patchValue({
                department:
                  this.departmentMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.department
                    );
                  }) ?? null,
                designation:
                  this.designationMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.designation
                    );
                  }) ?? null,
                branch:
                  this.branchMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.branch
                    );
                  }) ?? null,
                date_of_join:
                  this.employee_details.emp_det?.employment_hr_details
                    ?.date_of_join ?? null,
                hod:
                  this.hodMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details?.hod
                    );
                  }) ?? null,
                client:
                  this.clientMaster.find((obj: any) => {
                    return (
                      obj.id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.client
                    );
                  }) ?? null,
                emp_type:
                  this.wageTypeMaster.find((obj: any) => {
                    return (
                      obj.value ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.emp_type
                    );
                  }) ?? null,
                pension_applicable:
                  this.yesNoMaster.find((obj: any) => {
                    return (
                      obj.value ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.pension_applicable
                    );
                  }) ?? null,
                gross_salary:
                  this.employee_details.emp_det?.employment_hr_details
                    ?.gross_salary ?? null,
                emp_role:
                  this.empRoleMaster.find((obj: any) => {
                    return (
                      obj.id ==
                      this.employee_details.emp_det?.employment_hr_details
                        ?.emp_role
                    );
                  }) ?? null,
                  location:
                  this.locationMaster.find((obj: any) => {
                    return (
                      obj._id ===
                      this.employee_details.emp_det?.employment_hr_details
                        ?.location_id
                    );
                  }) ?? '',
                emp_id: this.employee_details?.emp_id ?? null,
                emp_self_service:
                  this.employee_details.emp_det?.employment_hr_details
                    ?.emp_self_service ?? null,
              });
            }

            this.employeeHrDetailsForm.patchValue({
              salary_temp:
                this.salaryTempMaster.find((obj: any) => {
                  return (
                    obj.id ===
                    this.employee_details?.emp_det?.employment_hr_details
                      ?.salary_temp
                  );
                }) ?? null,
              package_id:
                this.employeePackagesMaster.find((obj: any) => {
                  return (
                    obj.id ===
                    this.employee_details?.emp_det?.employment_hr_details
                      ?.package_id
                  );
                }) ?? null,
              // 'emp_self_service': this.employeePackagesMaster. ?? null,
            });

            if (
              this.employee_details.emp_det?.employment_hr_details
                ?.emp_self_service == 'yes'
            ) {
              $('.emp-selfservice').addClass('on');
            } else {
              $('.emp-selfservice').removeClass('on');
            }
          } else {
            this.toastr.error(res.message);
          }

          this.spinner.hide();
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
  }

  getEmployeeMaster() {
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

          this.designationMaster = [];
          if (
            res.masters.designation &&
            Array.isArray(res.masters.designation)
          ) {
            res.masters.designation.forEach((element: any) => {
              this.designationMaster.push({
                id: element._id,
                description: element.designation_name,
              });
            });
          }

          this.departmentMaster = [];
          if (res.masters.department && Array.isArray(res.masters.department)) {
            res.masters.department.forEach((element: any) => {
              this.departmentMaster.push({
                id: element._id,
                description: element.department_name,
              });
            });
          }

          this.employeePackagesMaster = [];
          if (res.masters.packages && Array.isArray(res.masters.packages)) {
            res.masters.packages.forEach((element: any) => {
              this.employeePackagesMaster.push({
                id: element._id,
                description: element.package_name,
              });
            });
          }

          this.salaryTempMaster = [];
          if (res.masters.salarytemp && Array.isArray(res.masters.salarytemp)) {
            res.masters.salarytemp.forEach((element: any) => {
              this.salaryTempMaster.push({
                id: element._id,
                description: element.template_name,
              });
            });
          }

          this.hodMaster = [];
          if (res.masters.hod && Array.isArray(res.masters.hod)) {
            res.masters.hod.forEach((element: any) => {
              this.hodMaster.push({
                id: element._id,
                description: `${element.first_name} ${element.last_name}`,
              });
            });
          }

          this.clientMaster = [];
          if (res.masters.clients && Array.isArray(res.masters.clients)) {
            res.masters.clients.forEach((element: any) => {
              this.clientMaster.push({
                id: element._id,
                description: `${element.client_name} (${element.client_code})`,
              });
            });
          }
          if (res.masters.emp_role && Array.isArray(res.masters.emp_role)) {
          this.employeeRoles = res.masters.emp_role
            res.masters.emp_role.forEach((element: any) => {
              this.empRoleMaster.push({
                id: element._id,
                description: `${element.template_name}`,
              });
            });
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
        this.fetchEmployeeDetails();
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }
  async fetchLocationMaster() {
    try {
      let res = await this.companyuserService
        .listCompanyLocation({
          pageno: 1,
          perpage: 20,
          status: 'active',
          checked_row_ids: JSON.stringify([]),
          row_checked_all: false,
          unchecked_row_ids: JSON.stringify([]),
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      this.locationMaster = res?.data?.docs ?? [];
      // this.toastr.success(res.message);
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  viewLocation(){
    try {
      let location = this.employeeHrDetailsForm.get('location')?.value ?? null
      if(!location || !location?._id) return
      this.locationModalData = location;
    //   this.isLocationViewing = true
      $('#viewLocation').click()
    } catch (err) {
      
    }
  }

  cancelEntry() {
    Global.resetForm(this.employeeHrDetailsForm);
  }
}
