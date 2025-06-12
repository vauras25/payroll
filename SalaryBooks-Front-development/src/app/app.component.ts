import { Component, HostBinding, Injectable, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import * as Global from 'src/app/globals';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CompanyuserService } from './services/companyuser.service';
import swal from 'sweetalert2';
import { WindowRefService } from './services/window-ref.service';
import { window } from 'rxjs/operators';

@Injectable()

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  insufficientBalance:boolean = false
  title = 'Payroll Software';
  loading:boolean = true;
  w =10
  constructor(
    private router: Router,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    public formBuilder: UntypedFormBuilder,
    private companyuserService: CompanyuserService,
    private winRef: WindowRefService

  ) {
    
    
   }

  ngOnInit() {
    // this.processing?.subscribe(d => this.w = d);
    this.router.events?.subscribe((event:any) => {
      // console.log(event);  
      
      
      if (event instanceof NavigationStart) {
        $('[data-dismiss="modal"]')?.click()
        
        let tooltip: any = $(".tooltip");
        tooltip.tooltip("hide");
      }
      
      if (event instanceof NavigationEnd) {
        $('html,body').animate({ scrollTop: 0 }, 'slow');
        this.loadCustomScripts()
        
        if (this.authService.adminLoggedIn()) {
          this.fetchAdminAuthDetails();
        } else if (this.authService.subAdminLoggedIn()) {
          this.fetchSubAdminAuthDetails();
        } else if (this.authService.companyUserLoggedIn()) {
          let user = localStorage.getItem('payroll-companyuser-user');
          if (user && JSON.parse(user).user_type == 'staff') {
            // if(event?.url !== '/company/payment-required') return;
            this.fetchCompanyStaffAuthDetails().catch(console.error);
          } else {
            // if(event?.url !== '/company/payment-required') return;
            this.fetchCompanyUserAuthDetails().catch(err => this.toastr.error(err));
          }
        }
      }
    });
  }

  loadCustomScripts() {
    return Global.loadCustomScripts();
  }

  fetchAdminAuthDetails() {
    this.authService.getAdminAccountDetails()
      ?.subscribe(res => {
        if (res.status == 'success') {
          localStorage.setItem('payroll-admin-user', JSON.stringify(res.user_data));
        }
      });
  }

  fetchSubAdminAuthDetails() {
    this.authService.getSubAdminAccountDetails()
      ?.subscribe(res => {
        if (res.status == 'success') {
          localStorage.setItem('payroll-subadmin-user', JSON.stringify(res.user_data));
          localStorage.setItem('payroll-subadmin-permission', JSON.stringify(res.permission));
        }
      });
  }

  fetchCompanyUserAuthDetails(getObj: any = false) {
    return new Promise((resolve, reject) => {
      this.authService.getCompanyUserAccountDetails()?.subscribe(
        {
          next:(res) => {
            if(res.status == 'success'){
              this.companyuserService.setComDetails(res);
              if(!!localStorage.getItem('payment-required')) localStorage.removeItem('payment-required');
              res.company_det.user_type = "company"
              localStorage.setItem('payroll-companyuser-user', JSON.stringify(res?.company_det || {} ));
              localStorage.setItem('payroll-companyuser-details', JSON.stringify(res?.company_det.com_det || {}));
              localStorage.setItem('payroll-companyuser-permission', JSON.stringify(res?.company_det?.package || {} ));
              if (getObj == true) {
                        resolve(res.company_det);
                      } else {
                        resolve(true);
                      }
            }else{
              reject(res.message)
            }
          },
          error:(err) => {
            if(err.status == 402 && err.error.suspension_type && err.error.suspension_type == 'account_suspended'){
              
              localStorage.setItem('payment-required', 'true')
              if(this.router.url !== '/company/payment-required'){
                this.router.navigateByUrl('/company/payment-required')
              }
              
            }else{
              reject(err.error.message)
            }
          },
        }
        )
      // this.authService.getCompanyUserAccountDetails()
      //   ?.subscribe(res => {
      //     if (res.status == 'success') {
      //       res.company_det.user_type = "company"

      //       localStorage.setItem('payroll-companyuser-user', JSON.stringify(res.company_det));
      //       localStorage.setItem('payroll-companyuser-details', JSON.stringify(res.company_det.com_det));
      //       localStorage.setItem('payroll-companyuser-permission', JSON.stringify(res.company_det?.package));

      //       if (getObj == true) {
      //         resolve(res.company_det);
      //       } else {
      //         resolve(true);
      //       }
      //     }else if(res.status == 'error' && res?.suspension_type == 'account_suspended'){
      //       reject(true)
      //     }
      //   });
    })
  }

  fetchCompanyStaffAuthDetails() {
    return new Promise((resolve, reject) => {
      this.authService.getCompanyStaffAccountDetails()
        ?.subscribe(async res => {
          if (res.status == 'success') {
            res.user_data.user_type = "staff"

            let companyDetails: any = await this.fetchCompanyUserAuthDetails(true).catch(err => this.toastr.error(err))
            if (companyDetails) {
              res.user_data.credit_stat = companyDetails?.credit_stat
              res.user_data.com_logo = companyDetails.com_logo ?? null;
            }

            localStorage.setItem('payroll-companyuser-user', JSON.stringify(res?.user_data ));
            localStorage.setItem('payroll-companyuser-details', JSON.stringify(res?.user_data ));
            localStorage.setItem('payroll-companyuser-permission', JSON.stringify(res?.permission ));

            resolve(true);
          }
        });
    });
  }

  checkModulePermission(role: any, module: any, operation: any) {
    return Global.checkModulePermission(role, module, operation);
  }

  checkCompanyModulePermission({
    company_module = <any>null,
    company_sub_module = <any>null,
    company_operation = <any>null,
    company_sub_operation = <any>null,
    staff_module = <any>null,
    staff_operation = <any>null,
    company_strict = <Boolean>false,
    staff_strict = <Boolean>false
  } = {}) {
    return Global.checkCompanyModulePermission({ company_module, company_operation, staff_module, staff_operation, company_strict, staff_strict, company_sub_module, company_sub_operation });
  }

  // get processing(): Observable<number> {
  //   return new Observable((subscribe) => {
  //     let percantage = 0;
  //     const intval:any = setInterval(() => {
  //       if (percantage == 95) return clearInterval(intval);
  //       percantage++;
  //       subscribe.next(percantage);
  //     }, 100)
  //     onload = () => {
  //       subscribe.next(100);
  //       subscribe.complete();
  //       setTimeout(() => {
  //         this.loading = false;
  //       }, 2000)
  //     }
  //   })
  // }
  // @HostBinding('style.overflow') overflow() {
  //   if (this.loading) {
  //     return 'hidden'
  //   } else {
  //     return 'initial'
  //   }
  // }

  // onActivate(event: any) {
  //   let scrollToTop = window.setInterval(() => {
  //     let pos = window.pageYOffset;
  //     if (pos > 0) {
  //       window.scrollTo(0, pos - 500); // how far to scroll on each step
  //     } else {
  //       window.clearInterval(scrollToTop);
  //     }
  //   }, 16);
  // }
}
