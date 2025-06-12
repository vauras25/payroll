import { Injectable } from '@angular/core';
import { WebService } from './web.service';
import * as saveAs from 'file-saver';
import { HttpResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService, Spinner } from 'ngx-spinner';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    private webService: WebService,
    private toastr:ToastrService,
    private spinner:NgxSpinnerService
    ) {}

  createDepartment(payload: any) {
    return this.webService.post('admin/create_department', payload);
  }

  fetchDepartments(payload: any) {
    return this.webService.post('admin/department-list', payload);
  }

  deleteDepartment(payload: any) {
    return this.webService.post('admin/delete_department', payload);
  }

  updateDepartment(payload: any) {
    return this.webService.post('admin/update_department', payload);
  }

  createBranch(payload: any) {
    return this.webService.post('admin/create_branch', payload);
  }

  fetchBranches(payload: any) {
    return this.webService.post('admin/branceh-list', payload);
  }

  deleteBranch(payload: any) {
    return this.webService.post('admin/delete_branch', payload);
  }

  updateBranch(payload: any) {
    return this.webService.post('admin/update_branch', payload);
  }

  createDesignation(payload: any) {
    return this.webService.post('admin/create_designation', payload);
  }

  fetchDesignations(payload: any) {
    return this.webService.post('admin/designation-list', payload);
  }

  deleteDesignation(payload: any) {
    return this.webService.post('admin/delete_designation', payload);
  }

  updateDesignation(payload: any) {
    return this.webService.post('admin/update_designation', payload);
  }

  fetchPermissions(payload: any) {
    return this.webService.post('admin/get_permission_module', payload);
  }

  fetchRoles(payload: any) {
    return this.webService.post('admin/role-list', payload);
  }

  changeRoleStatus(payload: any) {
    return this.webService.post('admin/update_role_status', payload);
  }

  createRole(payload: any) {
    return this.webService.post('admin/create_role', payload);
  }

  updateRole(payload: any) {
    return this.webService.post('admin/update_role', payload);
  }

  fetchtdsRules(payload: any) {
    return this.webService.post('admin/get-tds-list', payload);
  }
  salarytplHead(payload: any) {
    return this.webService.post('admin/get-salary-template-head', payload);
  }
  getTDSAct(payload: any = '') {
    return this.webService.post('get-tds-act', payload);
  }
  gettdsTemplate(payload: any = '') {
    return this.webService.post('admin/get-tds-data', payload);
  }

  fetchSubAdminPageMasters() {
    return this.webService.postFormData('admin/get-masters-data', {});
  }

  createSubAdmin(payload: any) {
    return this.webService.postFormData('admin/create_subadmin', payload);
  }

  updateSubAdmin(payload: any) {
    return this.webService.postFormData('admin/update_subadmin', payload);
  }

  fetchSubAdmins(payload: any) {
    return this.webService.post('admin/get_subadmin', payload);
  }

  deleteSubAdmin(payload: any) {
    return this.webService.post('admin/delete_subadmin', payload);
  }

  changeSubAdminStatus(payload: any) {
    return this.webService.post('admin/update_role_status', payload);
  }

  updateSubAdminPassword(payload: any) {
    return this.webService.post('admin/update_subadmin_password', payload);
  }

  updateAccountData(payload: any) {
    return this.webService.postFormData('admin/update-account', payload);
  }

  updateAccountPassword(payload: any) {
    return this.webService.post('admin/update-account-password', payload);
  }

  fetchStateCityMaster() {
    return this.webService.post('admin/get_state_city_list', {
      countrycode: 'IN',
    });
  }

  createReseller(payload: any) {
    return this.webService.post('admin/add_reseller', payload);
  }

  fetchRellers(payload: any) {
    return this.webService.post('admin/get_reseller_list', payload);
  }

  deleteReseller(payload: any) {
    return this.webService.post('admin/delete_reseller', payload);
  }

  getResellerDetails(payload: any) {
    return this.webService.post('admin/get_reseller_details', payload);
  }

  updateReseller(payload: any) {
    return this.webService.post('admin/update_reseller', payload);
  }

  approveReseller(payload: any) {
    return this.webService.post('admin/update_role_approval', payload);
  }

  createEpfoRule(payload: any) {
    return this.webService.post('admin/create_epfo', payload);
  }

  fetchEpfoRules(payload: any) {
    return this.webService.post('admin/get_epfo_rule', payload);
  }

  deleteEpfoRule(payload: any) {
    return this.webService.post('admin/delete_epfo_rule', payload);
  }

  updateEpfoRule(payload: any) {
    return this.webService.post('admin/update_epfo_rule', payload);
  }

  createEsicRule(payload: any) {
    return this.webService.post('admin/create_esic', payload);
  }

  fetchEsicRules(payload: any) {
    return this.webService.post('admin/get_esic_rule', payload);
  }

  deleteEsicRule(payload: any) {
    return this.webService.post('admin/delete_esic_rule', payload);
  }

  updateEsicRule(payload: any) {
    return this.webService.post('admin/update_esic_rule', payload);
  }

  createBonusRule(payload: any) {
    return this.webService.post('admin/create_bonus', payload);
  }

  fetchBonusRules(payload: any) {
    return this.webService.post('admin/get_bonus_rule', payload);
  }

  deleteBonusRule(payload: any) {
    return this.webService.post('admin/delete_bonus_rule', payload);
  }

  updateBonusRule(payload: any) {
    return this.webService.post('admin/update_bonus_rule', payload);
  }

  createGratuityRule(payload: any) {
    return this.webService.post('admin/create_gratuity', payload);
  }

  fetchGratuityRules(payload: any) {
    return this.webService.post('admin/get_gratuity_rule', payload);
  }

  deleteGratuityRule(payload: any) {
    return this.webService.post('admin/delete_gratuity_rule', payload);
  }

  updateGratuityRule(payload: any) {
    return this.webService.post('admin/update_gratuity_rule', payload);
  }

  fetchITaxCategories() {
    return this.webService.post('admin/get_tax_categories', {});
  }

  createITaxCategory(payload: any) {
    return this.webService.post('admin/create_tax_category', payload);
  }

  updateITaxCategory(payload: any) {
    return this.webService.post('admin/update_tax_category', payload);
  }

  deleteITaxCategory(payload: any) {
    return this.webService.post('admin/delete_tax_category', payload);
  }

  fetchITaxTemplates(payload: any) {
    return this.webService.post('admin/get_taxslabs', payload);
  }

  deleteITaxTemplate(payload: any) {
    return this.webService.post('admin/delete_taxslab_data', payload);
  }

  createITaxTemplate(payload: any) {
    return this.webService.post('admin/create_taxslab', payload);
  }

  validateITaxTemplateFinancialYear(payload: any) {
    return this.webService.post('admin/validate_financial_year', payload);
  }

  updateITaxTemplate(payload: any) {
    return this.webService.post('admin/update_taxslab_rule', payload);
  }

  fetchClientPackages(payload: any) {
    return this.webService.post('admin/get_package_list', payload);
  }

  deleteClientPackage(payload: any) {
    return this.webService.post('admin/delete_package_data', payload);
  }

  fetchPackagePermissionList() {
    return this.webService.post('admin/get_permission_list', {});
  }

  createClientPackage(payload: any) {
    return this.webService.post('admin/add_packege', payload);
  }

  updateClientPackage(payload: any) {
    return this.webService.post('admin/update_package_data', payload);
  }

  fetchPackagePlanMaster() {
    return this.webService.post('admin/get_package_plans', {});
  }

  fetchSubscriptionPlans(payload: any) {
    return this.webService.post('admin/get_plan_list', payload);
  }

  deleteSubscriptionPlan(payload: any) {
    return this.webService.post('admin/delete_plan_data', payload);
  }

  createSubscriptionPlan(payload: any) {
    return this.webService.post('admin/add_plan', payload);
  }

  updateSubscriptionPlan(payload: any) {
    return this.webService.post('admin/update_plan_data', payload);
  }

  changeSubscriptionPlanStatus(payload: any) {
    return this.webService.post('admin/update_plan_status', payload);
  }

  fetchSubscriptionUsers(payload: any) {
    return this.webService.post('admin/get_company_list', payload);
  }
  fetchInvoiceLists(payload: any) {
    return this.webService.post('admin/get-payment-history', payload);
  }
  fetchLedgerLists(payload: any) {
    return this.webService.post('admin/get-company-ledgers-list', payload);
  }
  fetchSalesLedgerLists(payload: any) {
    return this.webService.post(
      'admin/get-company-sales-ledgers-list',
      payload
    );
  }
  fetchCreditUsage(payload: any) {
    return this.webService.post('admin/get-company-credit-usage-list', payload);
  }
  fetchCreditUsageView(payload: any) {
    return this.webService.post(
      'admin/get-company-credit-usage-details-list',
      payload
    );
  }
  createSubscriptionUser(payload: any) {
    return this.webService.post('admin/add_company_data', payload);
  }
  ledgerDetail(payload: any) {
    return this.webService.post(
      'admin/get-company-ledgers-details-list',
      payload
    );
  }

  fetchCompanyUserDetails(payload: any) {
    return this.webService.post('admin/get_company_details', payload);
  }

  updateCompanyUserCredit(payload: any) {
    return this.webService.post('admin/update_company_credit', payload);
  }

  updateCompanyUserHoldCredit(payload: any) {
    return this.webService.post('admin/update_company_hold_credit', payload);
  }

  updateCompanySuspensionStatus(payload: any) {
    return this.webService.post('admin/update_suspend_status', payload);
  }
  updateCompanyStatus(payload: any) {
    return this.webService.post('admin/update_company_status', payload);
  }

  fetchSubscriptionCreditValue() {
    return this.webService.post('admin/get_credit_value', {});
  }

  updateSubscriptionCreditValue(payload: any) {
    return this.webService.post('admin/update_credit_value', payload);
  }

  createAttendancePolicy(payload: any) {
    return this.webService.postFormData(
      'admin/create_attendance_rule',
      payload
    );
  }

  fetchAttendancePolicies(payload: any) {
    return this.webService.post('admin/get_attendance_rule', payload);
  }

  updateAttendancePolicy(payload: any) {
    return this.webService.postFormData(
      'admin/update_attendance_rule',
      payload
    );
  }

  deleteAttendancePolicy(payload: any) {
    return this.webService.post('admin/delete_attendance_rule', payload);
  }

  updateAttendancePublishStatus(payload: any) {
    return this.webService.post(
      'admin/update_attendance_publish_status',
      payload
    );
  }

  fetchIncentiveTemplates(payload: any) {
    return this.webService.post('admin/get_incentive_policy', payload);
  }

  deleteIncentiveTemplate(payload: any) {
    return this.webService.post('admin/delete_incentive_policy', payload);
  }

  createIncentiveTemplate(payload: any) {
    return this.webService.post('admin/create_incentive_policy', payload);
  }

  updateIncentiveTemplate(payload: any) {
    return this.webService.post('admin/update_incentive_policy', payload);
  }

  updateIncentiveTemplatePublishStatus(payload: any) {
    return this.webService.post(
      'admin/update_incentive_policy_publish_status',
      payload
    );
  }

  fetchBonusPolicies(payload: any) {
    return this.webService.post('admin/get_bonus_policy', payload);
  }

  deleteBonusPolicy(payload: any) {
    return this.webService.post('admin/delete_bonus_policy', payload);
  }

  createBonusPolicy(payload: any) {
    return this.webService.postFormData('admin/create_bonus_policy', payload);
  }

  updateBonusPolicy(payload: any) {
    return this.webService.postFormData('admin/update_bonus_policy', payload);
  }

  updateBonusPolicyPublishStatus(payload: any) {
    return this.webService.postFormData(
      'admin/update_bonus_policy_publish_status',
      payload
    );
  }

  fetchOvertimePolicies(payload: any) {
    return this.webService.post('admin/get_overtime_policy', payload);
  }

  deleteOvertimePolicy(payload: any) {
    return this.webService.post('admin/delete_overtime_policy', payload);
  }

  createOvertimePolicy(payload: any) {
    return this.webService.post('admin/create_overtime_policy', payload);
  }

  updateOvertimePolicy(payload: any) {
    return this.webService.post('admin/update_overtime_policy', payload);
  }

  updateOvertimePublishStatus(payload: any) {
    return this.webService.postFormData(
      'admin/update_overtime_publish_status',
      payload
    );
  }

  createPaySlipTemplate(payload: any) {
    return this.webService.postFormData('admin/create_payslip_temp', payload);
  }

  fetchPaySlipTemplates(payload: any) {
    return this.webService.post('admin/get_payslip_temp', payload);
  }

  updatePaySlipTemplate(payload: any) {
    return this.webService.postFormData('admin/update_payslip_temp', payload);
  }

  deletePaySlipTemplate(payload: any) {
    return this.webService.postFormData('admin/delete_payslip_temp', payload);
  }

  changePaySipTemplatePublishStatus(payload: any) {
    return this.webService.post('admin/update-payslip-publish-status', payload);
  }

  createBonusSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'admin/create_bonus_slip_temp',
      payload
    );
  }

  fetchBonusSlipTemplates(payload: any) {
    return this.webService.post('admin/get_bonus_slip_temp', payload);
  }

  updateBonusSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'admin/update_bonus_slip_temp',
      payload
    );
  }

  deleteBonusSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'admin/delete_bonus_slip_temp',
      payload
    );
  }

  changeBonusSlipTemplatePublishStatus(payload: any) {
    return this.webService.postFormData(
      'admin/update-bonus-slip-publish-status',
      payload
    );
  }

  createArrearSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'admin/create_arrears_slip_temp',
      payload
    );
  }

  fetchArrearSlipTemplates(payload: any) {
    return this.webService.post('admin/get_arrears_slip_temp', payload);
  }

  updateArrearSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'admin/update_arrears_slip_temp',
      payload
    );
  }

  deleteArrearSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'admin/delete_arrears_slip_temp',
      payload
    );
  }

  fetchArrearSlipTemplateMaster() {
    return this.webService.postFormData(
      'admin/get_arrear_slip_master_data',
      {}
    );
  }

  changeArrearSlipTemplatePublishStatus(payload: any) {
    return this.webService.postFormData(
      'admin/update-arrears-slip-publish-status',
      payload
    );
  }

  fetchTDSTemplates(payload: any) {
    return this.webService.post('admin/get_tds_policy', payload);
  }

  deleteTDSTemplate(payload: any) {
    return this.webService.post('admin/delete_tds_policy', payload);
  }

  createTDSTemplate(payload: any) {
    return this.webService.post('admin/create_tds_policy', payload);
  }

  updateTDSTemplate(payload: any) {
    return this.webService.post('admin/update_tds_policy', payload);
  }

  updateTdsPublishStatus(payload: any) {
    return this.webService.post('admin/update_tds_publish_status', payload);
  }

  fetchStates() {
    return this.webService.post('admin/get_state_list', { countrycode: 'IN' });
  }

  createPTaxRule(payload: any) {
    return this.webService.postFormData('admin/create_ptax_rule', payload);
  }

  updatePTaxRule(payload: any) {
    return this.webService.postFormData('admin/update_ptax_rule', payload);
  }

  fetchPTaxRules(payload: any) {
    return this.webService.post('admin/get_ptax_rule', payload);
  }

  deletePTaxRule(payload: any) {
    return this.webService.post('admin/delete_ptax_rule', payload);
  }

  updatePTaxPublishStatus(payload: any) {
    return this.webService.post('admin/update_ptax_publish_status', payload);
  }

  createPromotionCoupon(payload: any) {
    return this.webService.post('admin/create_coupon_code', payload);
  }

  updatePromotionCoupon(payload: any) {
    return this.webService.post('admin/update_coupon_code', payload);
  }

  fetchPromotionCoupons(payload: any) {
    return this.webService.post('admin/get_coupon_code', payload);
  }

  deletePromotionCoupon(payload: any) {
    return this.webService.post('admin/delete_coupon_code', payload);
  }

  updatePromotionCouponStatus(payload: any) {
    return this.webService.post('admin/update-coupon-status', payload);
  }

  fetchPromotionCouponReedeemed(payload: any) {
    return this.webService.post('admin/coupon-details', payload);
  }

  fetchLwfRules(payload: any) {
    return this.webService.post('admin/get-lwf-rule', payload);
  }

  createLwfRule(payload: any) {
    return this.webService.postFormData('admin/add-lwf-rule', payload);
  }

  updateLwfRule(payload: any) {
    return this.webService.postFormData('admin/update-lwf-rule', payload);
  }

  deleteLwfRule(payload: any) {
    return this.webService.postFormData('admin/delete-lwf-rule', payload);
  }

  updateLwfRulePublishStatus(payload: any) {
    return this.webService.postFormData(
      'admin/update-lwf-publish-status',
      payload
    );
  }

  submitCreditInvoiceTemplate(payload: any) {
    return this.webService.postFormData('admin/create-credit-invoice', payload);
  }

  fetchCreditInvoiceTemplate(payload: any) {
    return this.webService.post('admin/get-credit-invoice', payload);
  }

  addSalaryHead(payload: any) {
    return this.webService.post('admin/add-salary-template-head', payload);
  }

  fetchSalaryHeads() {
    return this.webService.post('admin/get-salary-template-head', {});
  }

  addSalaryTemplate(payload: any) {
    return this.webService.postFormData('admin/add-salary-template', payload);
  }

  updateSalaryTemplate(payload: any) {
    return this.webService.postFormData(
      'admin/update-salary-template',
      payload
    );
  }

  fetchSalaryTemplates(payload: any) {
    return this.webService.post('admin/get-salary-template', payload);
  }

  updateSalaryTemplatePublishStatus(payload: any) {
    return this.webService.postFormData('admin/update-publish-status', payload);
  }

  createLeaveTemplateHead(payload: any) {
    return this.webService.post('admin/add-leave-template-head', payload);
  }

  fetchLeaveTemplateHeads(payload: any) {
    return this.webService.post('admin/get-leave-template-head', payload);
  }

  fetchLeaveTemplateRules(payload: any) {
    return this.webService.post('admin/get-leave-rule', payload);
  }

  createLeaveTemplateRule(payload: any) {
    return this.webService.postFormData('admin/add-leave-rule', payload);
  }

  updateLeaveTemplateRule(payload: any) {
    return this.webService.postFormData('admin/update-leave-rule', payload);
  }

  deleteLeaveTemplateRule(payload: any) {
    return this.webService.postFormData('admin/delete-leave-rule', payload);
  }

  updateLeaveTemplateRulePublishStatus(payload: any) {
    return this.webService.postFormData(
      'admin/update-leave-publish-status',
      payload
    );
  }

  createSmtp(payload: any) {
    return this.webService.post('admin/creat-smtp-access', payload);
  }
  fetchSmtp(payload: any) {
    return this.webService.post('admin/get-smtp-list', payload);
  }
  updateSmtp(payload: any) {
    return this.webService.postFormData('admin/update-smtp-access', payload);
  }
  createcompanySmtp(payload: any) {
    return this.webService.post('company/creat-smtp-access', payload);
  }
  fetchcompanySmtp(payload: any) {
    return this.webService.post('company/get-smtp-list', payload);
  }
  updatecompanySmtp(payload: any) {
    return this.webService.postFormData('company/update-smtp-access', payload);
  }
  deletecompanySmtp(payload: any) {
    return this.webService.post('company/delete-smtp-access', payload);
  }

  updatecompanysmtpStatus(payload: any) {
    return this.webService.post('company/update-smtp-status', payload);
  }
  deleteSmtp(payload: any) {
    return this.webService.post('admin/delete-smtp-access', payload);
  }

  updatesmtpStatus(payload: any) {
    return this.webService.post('admin/update-smtp-status', payload);
  }
  changeCompanyPlan(payload: any) {
    return this.webService.post('admin/change-company-plan', payload);
  }
  savetdsTemplate(payload: any) {
    return this.webService.post('admin/add-tds-template-data', payload);
  }

  // admin dashboard apis
  getDashboardTotalData(payload: any) {
    return this.webService.post('admin/admin-dashboard-total-data', payload);
  }
  getDashboardGraphData(payload: any) {
    return this.webService.post('admin/admin-dashboard-graph-data', payload);
  }
  getDashboardPromoData(payload: any) {
    return this.webService.post('admin/admin-dashboard-promo-data', payload);
  }
  getDashboardCTCData(payload: any) {
    return this.webService.post('admin/admin-dashboard-ctc-data', payload);
  }
  getDashboardTopCreditUsers(payload: any) {
    return this.webService.post('admin/admin-dashboard-top-credit-users', payload);
  }
  getDashboardPlansData(payload: any) {
    return this.webService.post('admin/admin-dashboard-plans-data', payload);
  }

  async downloadFile(url:string,fileName:string, payload?:Object) {
    try {
      this.spinner.show()
      await this.webService.simpleGet('admin/' + url, payload).toPromise().then((response:HttpResponse<any>)=>{
        
        if(response.status !== 200 || response.body.type == 'application/json'){
          throw {message:'Internal server error occured. Please try again later'};
        }
        saveAs(response.body, fileName);
        this.spinner.hide()
      },(err) =>{
        throw err
      });
    } catch (err:any) {
      this.spinner.hide()
      this.toastr.error(err.message ?? err)
    }
  }
}
