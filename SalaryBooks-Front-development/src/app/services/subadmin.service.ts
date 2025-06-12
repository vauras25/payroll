import { Injectable } from '@angular/core';
import { WebService } from './web.service';

@Injectable({
  providedIn: 'root'
})
export class SubadminService {

  constructor(private webService: WebService) { }

  updateAccountData(payload: any) {
    return this.webService.postFormData('sub-admin/update-account', payload);
  }

  updateAccountPassword(payload: any) {
    return this.webService.post('sub-admin/update-account-password', payload);
  }

  fetchPermissions(payload: any) {
    return this.webService.post('sub-admin/get_permission_module', payload);
  }

  fetchRoles(payload: any) {
    return this.webService.post('sub-admin/role-list', payload);
  }

  changeRoleStatus(payload: any) {
    return this.webService.post('sub-admin/update_role_status', payload);
  }

  createRole(payload: any) {
    return this.webService.post('sub-admin/create_role', payload);
  }

  updateRole(payload: any) {
    return this.webService.post('sub-admin/update_role', payload);
  }

  fetchSubAdminPageMasters() {
    return this.webService.postFormData('sub-admin/get-masters-data', {});
  }

  createSubAdmin(payload: any) {
    return this.webService.postFormData('sub-admin/create_subadmin', payload);
  }

  updateSubAdmin(payload: any) {
    return this.webService.postFormData('sub-admin/update_subadmin', payload);
  }

  fetchSubAdmins(payload: any) {
    return this.webService.post('sub-admin/get_subadmin', payload);
  }

  deleteSubAdmin(payload: any) {
    return this.webService.post('sub-admin/delete_subadmin', payload);
  }

  changeSubAdminStatus(payload: any) {
    return this.webService.post('sub-admin/update_role_status', payload);
  }

  updateSubAdminPassword(payload: any) {
    return this.webService.post('sub-admin/update_subadmin_password', payload);
  }

  fetchPackagePermissionList() {
    return this.webService.post('sub-admin/get_permission_list', {});
  }

  fetchClientPackages(payload: any) {
    return this.webService.post('sub-admin/get_package_list', payload);
  }

  createClientPackage(payload: any) {
    return this.webService.post('sub-admin/add_packege', payload);
  }

  deleteClientPackage(payload: any) {
    return this.webService.post('sub-admin/delete_package_data', payload);
  }

  updateClientPackage(payload: any) {
    return this.webService.post('sub-admin/update_package_data', payload);
  }

  fetchPackagePlanMaster() {
    return this.webService.post('sub-admin/get_package_plans', {});
  }

  fetchSubscriptionPlans(payload: any) {
    return this.webService.post('sub-admin/get_plan_list', payload);
  }

  deleteSubscriptionPlan(payload: any) {
    return this.webService.post('sub-admin/delete_plan_data', payload);
  }

  createSubscriptionPlan(payload: any) {
    return this.webService.post('sub-admin/add_plan', payload);
  }

  updateSubscriptionPlan(payload: any) {
    return this.webService.post('sub-admin/update_plan_data', payload);
  }
  
  fetchSubscriptionUsers(payload: any) {
    return this.webService.post('sub-admin/get_company_list', payload);
  }

  createSubscriptionUser(payload: any) {
    return this.webService.post('sub-admin/add_company_data', payload);
  }
}
