import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { WebService } from './web.service';
import { CompanyuserService } from './companyuser.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private webService: WebService,
    private companyService:CompanyuserService,
    private router: Router
  ) { }

  /**
   * ====================================================
   * SuperAdmin Authentication Methods
   *
   * Token Name - payroll-admin-token
   * User Details - payroll-admin-user
   * ====================================================
   * */

  adminLogin(payload: any) {
    return this.webService.post('admin_signin', payload);
  }

  adminLogout() {
    localStorage.removeItem('payroll-admin-token');
    localStorage.removeItem('payroll-admin-user');
    this.router.navigate(['/login'])
  }

  adminLoggedIn() {
    return !!localStorage.getItem('payroll-admin-token')
  }
  empLoggedIn() {
    return !!localStorage.getItem('payroll-companyemp-token')
  }

  getAdminToken() {
    return localStorage.getItem('payroll-admin-token')
  }

  getAdminAccountDetails() {
    return this.webService.post('admin/get-account', {});
  }

  /**
   * =====================================================
   * End of SuperAdmin Authentication Methods
   * =====================================================
   * */


  /**
   * ====================================================
   * SubAdmin Authentication Methods
   *
   * Token Name - payroll-subadmin-token
   * User Details - payroll-subadmin-user
   * Permission Storage - payroll-subadmin-permission
   * ====================================================
   * */

  subAdminLogin(payload: any) {
    
    return this.webService.post('sub_admin_signin', payload);
  }

  subAdminLogout() {
    localStorage.removeItem('payroll-subadmin-token');
    localStorage.removeItem('payroll-subadmin-user');
    localStorage.removeItem('payroll-subadmin-permission');
    this.router.navigate(['/sub-admin/login'])
  }
  empLogout() {
    localStorage.removeItem('payroll-companyemp-token');
    localStorage.removeItem('payroll-companyemp-user');
    this.router.navigate(['/login'])
  }

  subAdminLoggedIn() {
    return !!localStorage.getItem('payroll-subadmin-token')
  }

  getSubAdminToken() {
    return localStorage.getItem('payroll-subadmin-token')
  }

  getSubAdminAccountDetails() {
    return this.webService.post('sub-admin/get-account', {});
  }

  /**
   * =====================================================
   * End of SubAdmin Authentication Methods
   * =====================================================
   * */

  /**
   * ====================================================
   * CompanyUser Authentication Methods
   *
   * Token Name - payroll-companyuser-token
   * User Details - payroll-companyuser-user
   * Permission Storage - payroll-companyuser-permission
   * ====================================================
   * */

  companyUserLogin(payload: any) {
    return this.webService.post('company_signin', payload);
  }

  companyUserLogout() {
    localStorage.removeItem('payroll-companyuser-token');
    localStorage.removeItem('payroll-companyuser-user');
    localStorage.removeItem('payroll-companyuser-details');
    localStorage.removeItem('payroll-companyuser-permission');
    this.router.navigate(['/login'])
  }

  companyUserLoggedIn() {
    return !!localStorage.getItem('payroll-companyuser-token')
  }

  getCompanyUserToken() {
    return localStorage.getItem('payroll-companyuser-token')
  }

  getCompanyUserAccountDetails() {
    return this.webService.post('company/get-company-data', {});
  }

  getCompanyStaffAccountDetails() {
    return this.webService.post('company/get-account', {});
  }
  getEmployeeUserToken() {
    return localStorage.getItem('payroll-companyemp-token')
  }

  /**
   * =====================================================
   * End of CompanyUser Authentication Methods
   * =====================================================
   * */
  getempPermission() {
    let empDetl:any=localStorage.getItem('payroll-companyemp-user');
    empDetl=JSON.parse(empDetl);
   return empDetl.emp_role_data;
  }
  getToken() {
    if (this.getAdminToken()) {
      return localStorage.getItem('payroll-admin-token')
    } else if (this.getSubAdminToken()) {
      return localStorage.getItem('payroll-subadmin-token')
    } else if (this.getCompanyUserToken()) {
      return localStorage.getItem('payroll-companyuser-token')
    } 
    else if (this.getEmployeeUserToken()) {
      return localStorage.getItem('payroll-companyemp-token')
    } 
    else {
      return null;
    }
  }

  async isPaymentRequired(){
    try {
      let res= await this.webService.get('/company/is-payment-required').toPromise();
      if(res.status == 'success'){
        return res.paymentRequired;
      }else{
        throw res
      }
    } catch (err:any) {
      console.error(err.message ??  err )
    }
  }
}
