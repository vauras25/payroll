import { Location } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-employee-print',
  templateUrl: './employee-print.component.html',
  styleUrls: ['./employee-print.component.css'],
})
export class CMPEmployeePrintComponent implements OnInit {
  Global = Global;
  items: any[] = [];
  @Input() employeeDetails: any = null;
  employee_id: any;
  employee_details: any[] = [];
  specificPrint: any = null;
  docs: any[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private titleService: Title,
    private location: Location
  ) {}

  async ngOnInit() {
    this.titleService.setTitle('Employee Details - ' + Global.AppName);
    this.activatedRoute.snapshot.queryParams['extraData'];
    this.activatedRoute.params.subscribe(
      (params) => (this.employee_id = params['employee_id'] ?? undefined)
    );
    this.activatedRoute.queryParams.subscribe((params) => {
      this.specificPrint = params?.section ?? null;
    });

    if (this.employee_id !== 'null') {
      await this.fetchEmployeeDetails();
      await this.fetchEmployeeMaster();
      await this.fetchEarningHeads();
    } else {
      this.companyuserService.employeeExportedDocs.subscribe((res) => {
        this.items = res;
      });
    }
    // setTimeout(() => {
    //     window.print();
    //     setTimeout(() => {
    //       if(this.employee_id !== "null"){
    //         window.close()
    //       }else{
    //         this.location.back()
    //       }
    //     }, 100);
    // }, 200);
  }

  fetchEmployeeDetails() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService
        .getEmployeeDetails({
          employee_id: this.employee_id,
        })
        .subscribe(
          (res: any) => {
            if (res.status == 'success') {
              // console.log(res);

              this.items.push(res?.employee_det);
              resolve(true);
            } else {
              this.toastr.error(res.message);
              resolve(false);
            }

            this.spinner.hide();
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(false);
          }
        );
    });
  }

  employeePackageMaster: any[] = [];
  salaryTemplateMaster: any[] = [];
  clientMaster: any[] = [];
  branchMaster: any[] = [];
  designationMaster: any[] = [];
  departmentMaster: any[] = [];
  hodMaster: any[] = [];
  backAccountTypeMaster: any[] = [
    { value: 'saving', description: 'Savings Account' },
    { value: 'current', description: 'Current Account' },
  ];

  fetchEmployeeMaster() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res) => {
          if (res.status == 'success') {
            this.hodMaster = [];
            (res?.masters?.hod ?? []).forEach((element: any) => {
              this.hodMaster.push({
                _id: element?._id,
                description: element?.first_name + ' ' + element?.last_name,
              });
            });

            this.departmentMaster = [];
            (res?.masters?.department ?? []).forEach((element: any) => {
              this.departmentMaster.push({
                _id: element?._id,
                description: element?.department_name,
              });
            });

            this.designationMaster = [];
            (res?.masters?.designation ?? []).forEach((element: any) => {
              this.designationMaster.push({
                _id: element?._id,
                description: element?.designation_name,
              });
            });

            this.branchMaster = [];
            (res?.masters?.branch?.company_branch ?? []).forEach(
              (element: any) => {
                this.branchMaster.push({
                  _id: element?._id,
                  description: element?.branch_name,
                });
              }
            );

            this.clientMaster = [];
            (res?.masters?.clients ?? []).forEach((element: any) => {
              this.clientMaster.push({
                _id: element?._id,
                description: `${element?.client_name} (#${element?.client_code})`,
              });
            });

            this.employeePackageMaster = [];
            (res?.masters?.packages ?? []).forEach((element: any) => {
              this.employeePackageMaster.push({
                _id: element?._id,
                description: element?.package_name,
              });
            });

            this.salaryTemplateMaster = [];
            (res?.masters?.salarytemp ?? []).forEach((element: any) => {
              this.salaryTemplateMaster.push({
                _id: element?._id,
                description: element?.template_name,
              });
            });

            resolve(true);
          } else {
            this.toastr.error(res?.message);
            resolve(false);
          }

          this.spinner.hide();
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(false);
        }
      );
    });
  }

  getMasterValue(master: any[], value: any, key: any, label: any) {
    return (
      master.find((obj: any) => {
        return obj[key] == value;
      })?.[label] ?? null
    );
  }

  earningHeadsMaster: any[] = [];
  fetchEarningHeads() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getExtraEarningHeads({}).subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.earningHeadsMaster = [];
            res?.temp_head.forEach((element: any) => {
              if (
                ['earning', 'provision', 'reimbursement'].includes(
                  element.earning_status
                )
              ) {
                this.earningHeadsMaster.push({
                  _id: element._id,
                  head_name: element.head_name,
                  status: element.earning_status,
                });
              }
            });
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

  getEarningHeadDetails(head_id: any) {
    return (
      this.earningHeadsMaster.find((obj: any) => {
        return obj._id == head_id;
      }) ?? null
    );
  }

  printDoc(elements:any) {
    // console.log(elements.target);

    window.print();
    if (this.employee_id !== 'null') {
      window.close();
    } else {
      this.location.back();
    }
  }

  closeWindow() {
    if (this.employee_id !== 'null') {
      window.close();
    } else {
      this.location.back();
    }
  }
}
