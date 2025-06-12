import { Injectable } from '@angular/core';
import { WebService } from './web.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { error } from 'console';
import { HttpResponse } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class CompanyuserService {
  sharedDocs: any;
  private EmployeesSource = new BehaviorSubject<any>([]);
  private printDataSource = new BehaviorSubject<any>([]);
  private printSalaryCertificate = new BehaviorSubject<any>([]);
  private setCom_details = new BehaviorSubject<any>([]);
  employeeExportedDocs = this.EmployeesSource.asObservable();
  exportedPrintDocs = this.printDataSource.asObservable();
  exportedSalaryCertificate = this.printSalaryCertificate.asObservable();
  getComDetails = this.setCom_details.asObservable();

  constructor(private webService: WebService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    ) {}

  setDocs(docs: any) {
    this.EmployeesSource.next(docs);
  }

  setPrintDoc(docs: any) {
    this.printDataSource.next(docs);
  }
  setSalaryCerti(docs: any) {
    this.printSalaryCertificate.next(docs);
  }
  setComDetails(docs: any) {
    this.setCom_details.next(docs);
  }

  updateCompanyDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-company-details',
      payload
    );
  }

  updatecompanyRegOfficeAddress(payload: any) {
    return this.webService.postFormData(
      'company/update-company-reg-ofc-address',
      payload
    );
  }

  updatecompanyCommOfficeAddress(payload: any) {
    return this.webService.postFormData(
      'company/update-company-comm-ofc-address',
      payload
    );
  }

  updateCompanyEPFData(payload: any) {
    return this.webService.postFormData('company/update-company-epf', payload);
  }

  updateCompanyESICData(payload: any) {
    return this.webService.postFormData('company/update-company-esic', payload);
  }

  updateCompanyPTaxData(payload: any) {
    return this.webService.postFormData(
      'company/update-company-p-tax',
      payload
    );
  }

  submitCompanyEstablishment(payload: any) {
    return this.webService.postFormData(
      'company/update-company-establishment',
      payload
    );
  }

  submitCompanyPartner(payload: any) {
    return this.webService.postFormData(
      'company/update-company-partner',
      payload
    );
  }

  submitCompanyBranch(payload: any) {
    return this.webService.postFormData(
      'company/update-company-branch',
      payload
    );
  }

  updateCompanyPreference(payload: any) {
    return this.webService.postFormData(
      'company/update-company-preference-settings',
      payload
    );
  }

  createEpfoRule(payload: any) {
    return this.webService.post('company/create_epfo', payload);
  }

  fetchEpfoRules(payload: any) {
    return this.webService.post('company/get_epfo_rule', payload);
  }

  deleteEpfoRule(payload: any) {
    return this.webService.post('company/delete_epfo_rule', payload);
  }

  updateEpfoRule(payload: any) {
    return this.webService.post('company/update_epfo_rule', payload);
  }

  getActiveEpfoRule() {
    return this.webService.post('company/get_active_epfo_rule', {});
  }

  createEsicRule(payload: any) {
    return this.webService.post('company/create_esic', payload);
  }

  fetchEsicRules(payload: any) {
    return this.webService.post('company/get_esic_rule', payload);
  }

  deleteEsicRule(payload: any) {
    return this.webService.post('company/delete_esic_rule', payload);
  }

  updateEsicRule(payload: any) {
    return this.webService.post('company/update_esic_rule', payload);
  }

  getActiveEsicRule() {
    return this.webService.post('company/get_active_esic_rule', {});
  }

  createBonusRule(payload: any) {
    return this.webService.post('company/create_bonus', payload);
  }

  fetchBonusRules(payload: any) {
    return this.webService.post('company/get_bonus_rule', payload);
  }

  deleteBonusRule(payload: any) {
    return this.webService.post('company/delete_bonus_rule', payload);
  }

  updateBonusRule(payload: any) {
    return this.webService.post('company/update_bonus_rule', payload);
  }

  getActiveBonusRule() {
    return this.webService.post('company/get_active_bonus_rule', {});
  }

  createGratuityRule(payload: any) {
    return this.webService.post('company/create_gratuity', payload);
  }

  fetchGratuityRules(payload: any) {
    return this.webService.post('company/get_gratuity_rule', payload);
  }

  deleteGratuityRule(payload: any) {
    return this.webService.post('company/delete_gratuity_rule', payload);
  }

  updateGratuityRule(payload: any) {
    return this.webService.post('company/update_gratuity_rule', payload);
  }

  getActiveGratuityRule() {
    return this.webService.post('company/get_active_gratuity_rule', {});
  }

  fetchITaxTemplates(payload: any) {
    return this.webService.post('company/get_taxslabs', payload);
  }

  deleteITaxTemplate(payload: any) {
    return this.webService.post('company/delete_taxslab_data', payload);
  }

  createITaxTemplate(payload: any) {
    return this.webService.post('company/create_taxslab', payload);
  }

  validateITaxTemplateFinancialYear(payload: any) {
    return this.webService.post('company/validate_financial_year', payload);
  }

  updateITaxTemplate(payload: any) {
    return this.webService.post('company/update_taxslab_rule', payload);
  }

  fetchITaxTemplateLibrary(payload: any) {
    return this.webService.post('company/get_taxslabs_library', payload);
  }

  fetchITaxCategories() {
    return this.webService.post('company/get_tax_categories', {});
  }

  createITaxCategory(payload: any) {
    return this.webService.post('company/create_tax_category', payload);
  }

  updateITaxCategory(payload: any) {
    return this.webService.post('company/update_tax_category', payload);
  }

  deleteITaxCategory(payload: any) {
    return this.webService.post('company/delete_tax_category', payload);
  }

  fetchITaxCategoryTemplateLibrary(payload: any) {
    return this.webService.post('company/get_tax_category_library', payload);
  }

  fetchTDSTemplates(payload: any) {
    return this.webService.post('company/get_tds_policy', payload);
  }

  deleteTDSTemplate(payload: any) {
    return this.webService.post('company/delete_tds_policy', payload);
  }

  createTDSTemplate(payload: any) {
    return this.webService.post('company/create_tds_policy', payload);
  }

  updateTDSTemplate(payload: any) {
    return this.webService.post('company/update_tds_policy', payload);
  }

  updateTDSTemplateStatus(payload: any) {
    return this.webService.post(
      'company/update_tds_policy_active_status',
      payload
    );
  }
  tdsCustomReport(payload: any)
  {
    return this.webService.post(
      'company/tds-custom-report',
      payload
    );
  }
  fetchTDSTemplateLibrary(payload: any) {
    return this.webService.post('company/get_tds_policy_library', payload);
  }

  fetchStates() {
    return this.webService.post('company/get_state_list', {
      countrycode: 'IN',
    });
  }

  createPTaxRule(payload: any) {
    return this.webService.postFormData('company/create_ptax_rule', payload);
  }

  updatePTaxRule(payload: any) {
    return this.webService.postFormData('company/update_ptax_rule', payload);
  }

  updatePTaxRuleStatus(payload: any) {
    return this.webService.postFormData(
      'company/update_ptax_rule_active_status',
      payload
    );
  }

  fetchPTaxRules(payload: any) {
    return this.webService.post('company/get_ptax_rule', payload);
  }

  deletePTaxRule(payload: any) {
    return this.webService.post('company/delete_ptax_rule', payload);
  }

  fetchPTaxRuleLibrary(payload: any) {
    return this.webService.post('company/get_ptax_rule_library', payload);
  }

  fetchEmployees(payload: any) {
    return this.webService.postFormData('company/get-employee', payload);
  }

  getEmployeeDetails(payload: any) {
    return this.webService.post('company/get-employee-details', payload);
  }
  getCompanyDetails() {
    return this.webService.post('company/get-company-data',{});
  }
  getEmployeeDocumentDetalis(payload:any) {
    return this.webService.post('company/employee-file-document-list-details',payload);
  }
  getEmployeeDocumentList(payload:any) {
    return this.webService.post('company/employee-file-document-list',payload);
  }
  getRivisionDetails(payload: any) {
    return this.webService.post('company/employee-revision-arrear-history-report', payload);
  }
  getEmployeeDetailsPublic(payload: any) {
    return this.webService.post('public/get-employee-details', payload);
  }

  getEmployeeMaster() {
    return this.webService.post('company/get-employee-master', {});
  }

  createEmployee(payload: any) {
    return this.webService.postFormData('company/add-employee', payload);
  }

  updateEmployee(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-details',
      payload
    );
  }

  updateEmployeeAddress(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-address',
      payload
    );
  }

  updateEmployeeBankDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-bank',
      payload
    );
  }

  updateEmployeeFamilyDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-fam-member',
      payload
    );
  }

  updateEmployeeTrainingDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-training',
      payload
    );
  }
  updateEmployeeTrainingDetailsPublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee-training',
      payload
    );
  }

  updateEmployeeOtherDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-other-details',
      payload
    );
  }

  updateEmployeeDisciplinaryDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-disciplinary-details',
      payload
    );
  }

  updateEmployeeContractDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-contract',
      payload
    );
  }

  updateEmployeeAccidentDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-accident-details',
      payload
    );
  }

  updateEmployeeAccidentDetailsPublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee-accident-details',
      payload
    );
  }

  updateEmployeeExtraCurriculumDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-extra-curricular',
      payload
    );
  }
  updateEmployeeExtraCurriculumDetailsPublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee-extra-curricular',
      payload
    );
  }

  updateEmployeeEducationDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-education',
      payload
    );
  }

  updateEmployeeEducationDetailsPublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee-education',
      payload
    );
  }

  updateEmployeeEmploymentDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-pf-esic',
      payload
    );
    return this.webService.postFormData(
      'company/update-employee-employment',
      payload
    );
  }

  updateEmployeeHrDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-hr-details',
      payload
    );
  }

  updateEmployeeAnnualCompDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-earning-amount',
      payload
    );
  }

  updateEmployeeFullFinalDetails(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-full-and-final-details',
      payload
    );
  }

  changeEmployeeStatus(payload: any) {
    return this.webService.post('company/update-employee-status', payload);
  }

  approveEmployee(payload: any) {
    return this.webService.post('company/activate-new-employee', payload);
  }

  changeEmployeePackage(payload: any) {
    return this.webService.post('company/employee_bulk_update', payload);
  }

  changeEmployeeSalaryTemplate(payload: any) {
    return this.webService.postFormData(
      'company/employee_bulk_update',
      payload
    );
  }

  generateEmployeeLetterWrtingTemplate(payload: any) {
    return this.webService.postFormData(
      'company/letter-writting-report',
      payload
    );
  }

  createDesignation(payload: any) {
    return this.webService.post('company/create_designation', payload);
  }

  fetchDesignations(payload: any) {
    return this.webService.post('company/designation-list', payload);
  }

  deleteDesignation(payload: any) {
    return this.webService.post('company/delete_designation', payload);
  }

  updateDesignation(payload: any) {
    return this.webService.post('company/update_designation', payload);
  }

  createDepartment(payload: any) {
    return this.webService.post('company/create_department', payload);
  }

  fetchDepartments(payload: any) {
    return this.webService.post('company/department-list', payload);
  }

  deleteDepartment(payload: any) {
    return this.webService.post('company/delete_department', payload);
  }

  updateDepartment(payload: any) {
    return this.webService.post('company/update_department', payload);
  }

  createClient(payload: any) {
    return this.webService.post('company/add_client', payload);
  }

  fetchClients(payload: any) {
    return this.webService.post('company/get_clients', payload);
  }

  deleteClient(payload: any) {
    return this.webService.post('company/delete_client', payload);
  }

  updateClient(payload: any) {
    return this.webService.post('company/update_client_data', payload);
  }

  createDispensary(payload: any) {
    return this.webService.post('company/add-dispensary', payload);
  }

  fetchDispensaries(payload: any) {
    return this.webService.post('company/get-dispensary', payload);
  }

  deleteDispensary(payload: any) {
    return this.webService.post('company/delete_dispensary', payload);
  }

  updateDispensary(payload: any) {
    return this.webService.post('company/update_dispensary', payload);
  }

  fetchPermissions(payload: any) {
    return this.webService.post('company/get_permission_module', payload);
  }

  fetchRoles(payload: any) {
    return this.webService.post('company/role-list', payload);
  }

  changeRoleStatus(payload: any) {
    return this.webService.post('company/update_role_status', payload);
  }

  createRole(payload: any) {
    return this.webService.post('company/create_role', payload);
  }

  updateRole(payload: any) {
    return this.webService.post('company/update_role', payload);
  }

  approveRole(payload: any) {
    return this.webService.post('company/update_role_approval', payload);
  }

  fetchStaffPageMasters() {
    // return this.webService.postFormData('company/get-masters-data', {});
    return this.webService.post('company/get-employee-master', {});
  }

  createStaff(payload: any) {
    return this.webService.postFormData('company/create_staff', payload);
  }

  updateStaff(payload: any) {
    return this.webService.postFormData('company/update_staff', payload);
  }

  fetchStaffs(payload: any) {
    return this.webService.post('company/get_staff', payload);
  }

  deleteStaff(payload: any) {
    return this.webService.post('company/delete_staff', payload);
  }

  changeStaffStatus(payload: any) {
    return this.webService.post('company/update_role_status', payload);
  }

  updateStaffPassword(payload: any) {
    return this.webService.post('company/update_staff_password', payload);
  }

  createAttendancePolicy(payload: any) {
    return this.webService.postFormData(
      'company/create_attendance_rule',
      payload
    );
  }

  fetchAttendancePolicies(payload: any) {
    return this.webService.post('company/get_attendance_rule', payload);
  }

  updateAttendancePolicy(payload: any) {
    return this.webService.postFormData(
      'company/update_attendance_rule',
      payload
    );
  }

  deleteAttendancePolicy(payload: any) {
    return this.webService.post('company/delete_attendance_rule', payload);
  }

  updateAttendancePublishStatus(payload: any) {
    return this.webService.post(
      'company/update_attendance_publish_status',
      payload
    );
  }

  updateAttendanceStatus(payload: any) {
    return this.webService.post(
      'company/update_attendance_rule_active_status',
      payload
    );
  }

  fetchAttendancePolicyLibrary(payload: any) {
    return this.webService.post('company/get_attendance_library', payload);
  }

  fetchBonusPolicies(payload: any) {
    return this.webService.post('company/get_bonus_policy', payload);
  }
  fetchArchiveBonus(payload: any) {
    return this.webService.post('company/get-archive-bonus', payload);
  }

  deleteBonusPolicy(payload: any) {
    return this.webService.post('company/delete_bonus_policy', payload);
  }

  createBonusPolicy(payload: any) {
    return this.webService.postFormData('company/create_bonus_policy', payload);
  }

  updateBonusPolicy(payload: any) {
    return this.webService.postFormData('company/update_bonus_policy', payload);
  }

  updateBonusPolicyPublishStatus(payload: any) {
    return this.webService.postFormData(
      'company/update_bonus_policy_publish_status',
      payload
    );
  }

  updateBonusPolicyStatus(payload: any) {
    return this.webService.postFormData(
      'company/update_bonus_policy_active_status',
      payload
    );
  }

  fetchBonusPolicyTemplate(payload: any) {
    return this.webService.postFormData(
      'company/get_bonus_rule_library',
      payload
    );
  }

  fetchIncentiveTemplates(payload: any) {
    return this.webService.post('company/get_incentive_policy', payload);
  }

  deleteIncentiveTemplate(payload: any) {
    return this.webService.post('company/delete_incentive_policy', payload);
  }

  createIncentiveTemplate(payload: any) {
    return this.webService.post('company/create_incentive_policy', payload);
  }

  updateIncentiveTemplate(payload: any) {
    return this.webService.post('company/update_incentive_policy', payload);
  }

  updateIncentiveTemplatePublishStatus(payload: any) {
    return this.webService.post(
      'company/update_incentive_policy_publish_status',
      payload
    );
  }

  updateIncentiveTemplateStatus(payload: any) {
    return this.webService.post(
      'company/update_incentive_policy_active_status',
      payload
    );
  }

  fetchIncentivePolicyLibrary(payload: any) {
    return this.webService.post('company/get_incentive_library', payload);
  }

  fetchOvertimePolicies(payload: any) {
    return this.webService.post('company/get_overtime_policy', payload);
  }

  deleteOvertimePolicy(payload: any) {
    return this.webService.post('company/delete_overtime_policy', payload);
  }

  createOvertimePolicy(payload: any) {
    return this.webService.post('company/create_overtime_policy', payload);
  }

  updateOvertimePolicy(payload: any) {
    return this.webService.post('company/update_overtime_policy', payload);
  }

  updateOvertimePublishStatus(payload: any) {
    return this.webService.postFormData(
      'company/update_overtime_publish_status',
      payload
    );
  }

  updateOvertimeStatus(payload: any) {
    return this.webService.postFormData(
      'company/update_overtime_policy_active_status',
      payload
    );
  }

  fetchOvertimePolicyLibrary(payload: any) {
    return this.webService.post('company/get_overtime_library', payload);
  }

  fetchEmployeePackageMaster() {
    return this.webService.post('company/employee-package-master', {});
  }

  createEmployeePackage(payload: any) {
    return this.webService.post('company/add-employee-package', payload);
  }

  fetchEmployeePackages(payload: any) {
    return this.webService.post('company/employee-package', payload);
  }

  deleteEmployeePackage(payload: any) {
    return this.webService.post('company/add-employee-package', payload);
  }

  updateEmployeePackage(payload: any) {
    return this.webService.post('company/update-employee-package', payload);
  }

  addSalaryHead(payload: any) {
    return this.webService.post('company/add-salary-template-head', payload);
  }

  fetchSalaryHeads() {
    return this.webService.post('company/get-salary-template-head', {});
  }

  addSalaryTemplate(payload: any) {
    return this.webService.postFormData('company/add-salary-template', payload);
  }

  updateSalaryTemplate(payload: any) {
    return this.webService.postFormData(
      'company/update-salary-template',
      payload
    );
  }

  fetchSalaryTemplates(payload: any) {
    return this.webService.post('company/get-salary-template', payload);
  }

  updateEmployeeAssetDetails(payload: any) {
    return this.webService.post('company/update-employee-assets', payload);
  }

  createPaySlipTemplate(payload: any) {
    return this.webService.postFormData('company/create_payslip_temp', payload);
  }

  fetchPaySlipTemplates(payload: any) {
    return this.webService.post('company/get_payslip_temp', payload);
  }

  updatePaySlipTemplate(payload: any) {
    return this.webService.postFormData('company/update_payslip_temp', payload);
  }

  deletePaySlipTemplate(payload: any) {
    return this.webService.postFormData('company/delete_payslip_temp', payload);
  }

  fetchPaySlipTemplateLibrary(payload: any) {
    return this.webService.post('company/get_payslip_temp_library', payload);
  }

  createBonusSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'company/create_bonus_slip_temp',
      payload
    );
  }

  fetchBonusSlipTemplates(payload: any) {
    return this.webService.post('company/get_bonus_slip_temp', payload);
  }
  fetchSalaryTemplatesLibrary(payload: any) {
    return this.webService.post('company/get-salary-template-library', payload);
  }
  fetchLeaveTemplatesLibrary(payload: any) {
    return this.webService.post('company/get-leave-template-library', payload);
  }

  updateBonusSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'company/update_bonus_slip_temp',
      payload
    );
  }

  deleteBonusSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'company/delete_bonus_slip_temp',
      payload
    );
  }

  fetchBonusSlipTemplateLibrary(payload: any) {
    return this.webService.post('company/get_bonus_slip_library', payload);
  }

  createArrearSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'company/create_arrears_slip_temp',
      payload
    );
  }

  fetchArrearSlipTemplates(payload: any) {
    return this.webService.post('company/get_arrears_slip_temp', payload);
  }

  updateArrearSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'company/update_arrears_slip_temp',
      payload
    );
  }

  deleteArrearSlipTemplate(payload: any) {
    return this.webService.postFormData(
      'company/delete_arrears_slip_temp',
      payload
    );
  }

  fetchArrearSlipTemplateMaster() {
    return this.webService.postFormData(
      'company/get_arrear_slip_master_data',
      {}
    );
  }

  fetchArrearSlipTemplateLibrary(payload: any) {
    return this.webService.post('company/get_arrear_slip_library', payload);
  }

  addAttendanceYearlyHoliday(payload: any) {
    return this.webService.post('company/add-yearly-holidays', payload);
  }

  fetchAttendanceYearlyHolidays(payload: any) {
    return this.webService.post('company/get-yearly-holidays', payload);
  }

  updateAttendanceYearlyHoliday(payload: any) {
    return this.webService.post('company/update-yearly-holidays', payload);
  }

  addAttendanceWeeklyHoliday(payload: any) {
    return this.webService.postFormData('company/add-weekly-holidays', payload);
  }

  fetchAttendanceWeeklyHolidays(payload: any) {
    return this.webService.post('company/get-weekly-holidays', payload);
  }

  updateAttendanceWeeklyHoliday(payload: any) {
    return this.webService.post('company/update-weekly-holidays', payload);
  }

  getAttendanceConfiguration(payload: any = {}) {
    return this.webService.post(
      'company/get-attendance-configuration',
      payload
    );
  }

  importAttendanceData(payload: any) {
    return this.webService.postFormData(
      'company/import-attendance-data',
      payload
    );
  }

  getAttendanceDataImportSample(payload: any) {
    return this.webService.post(
      'company/export-sample-attendance-file',
      payload
    );
  }

  submitEmployeeBulkAttendance(payload: any) {
    return this.webService.postFormData(
      'company/bulk-update-attendance-data',
      payload
    );
  }

  submitEmployeeApproval(payload: any) {
    return this.webService.postFormData(
      'company/approve-attendance-data',
      payload
    );
  }

  fetchAttendanceData(payload: any) {
    return this.webService.postFormData('company/get-attendance-data', payload);
  }

  updateSingleEmployeeAttendance(payload: any) {
    return this.webService.postFormData(
      'company/update-attendance-data',
      payload
    );
  }

  updateAttendanceRegister(payload: any) {
    return this.webService.post('company/update-attendance-register', payload);
  }

  fetchAttendanceRegister() {
    return this.webService.post('company/get-attendance-register', {});
  }

  fetchAttendanceSummary(payload: any) {
    return this.webService.post('company/get-attendance-summary', payload);
  }

  createLeaveTemplateHead(payload: any) {
    return this.webService.post('company/add-template-head', payload);
  }

  fetchLeaveTemplateHeads(payload: any) {
    return this.webService.post('company/get-template-head', payload);
  }

  fetchLeaveTemplateRules(payload: any) {
    return this.webService.post('company/get-leave-rule', payload);
  }

  createLeaveTemplateRule(payload: any) {
    return this.webService.postFormData('company/add-leave-rule', payload);
  }

  updateLeaveTemplateRule(payload: any) {
    return this.webService.postFormData('company/update-leave-rule', payload);
  }

  deleteLeaveTemplateRule(payload: any) {
    return this.webService.postFormData('company/delete-leave-rule', payload);
  }

  fetchLwfRules(payload: any) {
    return this.webService.post('company/get-lwf-rule', payload);
  }

  createLwfRule(payload: any) {
    return this.webService.postFormData('company/add-lwf-rule', payload);
  }

  updateLwfRule(payload: any) {
    return this.webService.postFormData('company/update-lwf-rule', payload);
  }

  deleteLwfRule(payload: any) {
    return this.webService.postFormData('company/delete-lwf-rule', payload);
  }

  fetchLwfRulesLibrary(payload: any) {
    return this.webService.post('company/get-lwf-rule-library', payload);
  }

  calculateSalary(payload: any) {
    let endpoint: any = '';
    let finalpayload: any = '';

    if (payload?.calculate_type == 'ctctogross') {
      endpoint = 'company/calculate-salary-range';

      finalpayload = {
        salary_template: payload.salary_template,
        state: payload.state,
        from_amount: payload.from_amount,
        to_amount: payload.to_amount,
        amount_span: payload.amount_span,
      };
    } else {
      endpoint = 'company/calculate-salary';

      finalpayload = {
        calculate_type: 'grosstoctc',
        salary_template: payload.salary_template,
        amount: payload.amount,
        state: payload.state,
      };
    }

    return this.webService.postFormData(endpoint, finalpayload);
  }

  uploadCompanyLogo(payload: any) {
    return this.webService.postFormData('company/update-company-logo', payload);
  }

  fetchShifts(payload: any) {
    return this.webService.post('company/get-shift', payload);
  }

  createShift(payload: any) {
    return this.webService.post('company/add-shift', payload);
  }

  updateShift(payload: any) {
    return this.webService.post('company/update-shift', payload);
  }

  deleteShift(payload: any) {
    return this.webService.post('company/delete-shift', payload);
  }

  fetchShiftEmployee(payload: any) {
    return this.webService.postFormData('company/get-shift-employee', payload);
  }

  getActiveShift() {
    return this.webService.post('company/get-active-shift', {});
  }
  submitFullandFinal(payload: any) {
    return this.webService.post('company/update-employee-full-and-final-details', payload);
  }

  updateShiftEmployee(payload: any) {
    switch (payload.editOptionConfig) {
      case 'multiple':
        return this.webService.postFormData(
          'company/update-employee-shift',
          payload
        );
        break;

      default:
        return this.webService.postFormData(
          'company/emp-update-shift-details',
          payload
        );
        break;
    }
  }

  fetchShiftDetails(payload: any) {
    return this.webService.post('company/shift-details', payload);
  }
  exportShiftDetails(payload: any) {
    return this.webService.post('company/shift-details', payload);
  }

  updateShiftRate(payload: any) {
    let pload: any = {};

    switch (payload.editOptionConfig) {
      case 'multiple':
        // pload = {
        //   'shift_rate': payload.shift_rate,
        //   'row_checked_all': payload.row_checked_all,
        //   'checked_row_ids': payload.checked_row_ids,
        //   'unchecked_row_ids': payload.unchecked_row_ids,
        // }

        return this.webService.postFormData(
          'company/update-employee-shift-rate',
          payload
        );
        break;

      default:
        // pload = {
        //   'shift_rate': payload.shift_rate,
        //   'emp_id': payload.emp_id,
        // }

        return this.webService.postFormData(
          'company/emp-update-shift-rate',
          payload
        );
        break;
    }
  }

  importEmployeeData(payload: any) {
    return this.webService.postFormData(
      'company/import-employee-data',
      payload
    );
  }

  exportSampleEmployeeFile(payload: any) {
    return this.webService.post('company/export-sample-employee-file', payload);
  }

  exportEmployeeData(payload: any) {
    return this.webService.postFormData(
      'company/export-employee-list',
      payload
    );
  }

  exportEmployeeExtraData(payload: any) {
    return this.webService.postFormData(
      'company/export-employee-extra-data',
      payload
    );
  }

  getUnapprovedEmployees(payload: any) {
    return this.webService.postFormData(
      'company/get-unapproved-employees',
      payload
    );
  }

  submitEmployeeBulkApprove(payload: any) {
    return this.webService.postFormData(
      'company/employee-bulk-approve',
      payload
    );
  }

  getCreditSettingsValue() {
    return this.webService.post('company/get-credit-setting-value', {});
  }

  getCreditPurchaseOrderID(payload: any) {
    return this.webService.post('company/get-order-id', payload);
  }

  verifyCreditPurchasePayment(payload: any) {
    return this.webService.post('company/verify-order-id', payload);
  }

  verifyCreditPurchaseCoupon(payload: any) {
    return this.webService.post('company/check-coupon-code', payload);
  }

  fetchCreditPurchaseTransactionHistory(payload: any) {
    return this.webService.post('company/get-payment-history', payload);
  }

  createLetterWritingTemplate(payload: any) {
    return this.webService.post('company/create-letter-template', payload);
  }

  fetchLetterWritingTemplates(payload: any) {
    return this.webService.post('company/get-letter-template', payload);
  }

  updateLetterWritingTemplate(payload: any) {
    return this.webService.post('company/update-letter-template', payload);
  }

  changeLetterWritingTemplateStatus(payload: any) {
    return this.webService.post(
      'company/update-letter-template-status',
      payload
    );
  }

  deleteLetterWritingTemplate(payload: any) {
    return this.webService.post('company/delete-letter-template', payload);
  }

  createBankSheet(payload: any) {
    return this.webService.postFormData('company/add-bank-sheet', payload);
  }

  updateBankSheet(payload: any) {
    return this.webService.postFormData('company/update-bank-sheet', payload);
  }

  fetchBankSheets(payload: any) {
    return this.webService.post('company/get-bank-sheet-list', payload);
  }

  deleteBankSheet(payload: any) {
    return this.webService.post('company/delete-bank-sheet', payload);
  }

  getBonusFormMonthly(payload: any) {
    // return this.webService.post('company/get-bonus-form', payload);
    return this.webService.post('company/get-bonus-monthly-wise', payload);
  }
  getBonusForm(payload: any) {
    return this.webService.post('company/get-bonus-form', payload);
  }

  updateEmpBonus(payload: any) {
    return this.webService.post('company/update-bonus-data', payload);
  }

  importEmpBonusData(payload: any) {
    return this.webService.postFormData('company/import-bonus', payload);
  }
  importEmpIncentiveData(payload: any) {
    return this.webService.postFormData('company/import-incentive', payload);
  }

  getSampleEmpBonusImportCsv(payload: any) {
    return this.webService.postFormData(
      'company/export-bonus-sample-file',
      payload
    );
  }

  getSampleEmpExcelImportCsv(payload: any) {
    return this.webService.postFormData(
      'company/export-excel-sample-file',
      payload
    );
  }

  getEarningSheetEmployeeList(payload: any) {
    return this.webService.postFormData(
      'company/generate-earning-sheet-employee-list',
      payload
    );
  }

  generateEmployeeEarningSheet(payload: any) {
    return this.webService.postFormData(
      'company/generate-earning-sheet',
      payload
    );
  }

  getIncentiveForm(payload: any) {
    return this.webService.post('company/get-incentive-form', payload);
  }

  updateEmpIncentive(payload: any) {
    return this.webService.postFormData(
      'company/update-incentive-data',
      payload
    );
  }

  getEmployeeExtraEarnings(payload: any) {
    return this.webService.postFormData('company/get-extra-earning', payload);
  }
  pendingEmployeeExtraEarnings(payload: any) {
    return this.webService.post('company/get-extra-earning-pending-data', payload);
  }
  getReimbursement (payload: any) {
    return this.webService.post('company/get-reimbursement', payload);
  }
  getApplyReimbursement (payload: any) {
    return this.webService.post('company/get-apply-reimbursement', payload);
  }
  geTapprovealReimbursement (payload: any) {
    return this.webService.post('company/get-reimbursement-pending-data', payload);
  }

  getpendingTDS (payload: any) {
    return this.webService.post('company/pending-declaration-list', payload);
  }

  geTDSList (payload: any) {
    return this.webService.post('company/get-tds-list', payload);
  }
  geTDSLibrary (payload: any) {
    return this.webService.post('company/get-tds-library-list', payload);
  }

  getextraEarning (payload: any) {
    return this.webService.post('company/get-extra-earning', payload);
  }
  getReimbursementReport (payload: any) {
    return this.webService.post('company/extra-earning-report', payload);
  }
 



  pendingEmployeeAdvance(payload: any) {
    return this.webService.post('company/get-advance-data', payload);
  }

  updateEmployeeExtraEarning(payload: any, action: any) {
    let endpoint: any = '';
    switch (action) {
      case 'new':
        endpoint = 'add-extra-earning-data';
        break;

      case 'edit':
        endpoint = 'update-extra-earning-data';
        break;
    }

    return this.webService.postFormData('company/' + endpoint, payload);
  }
  addEmployeeReimbursement(payload: any) {
    return this.webService.post('company/add-reimbursement', payload);
  }

  updateEmployeeReimbursement(payload: any) {
    return this.webService.post('company/update-reimbursement', payload);
  }

  getExtraEarningHeads(payload: any) {
    return this.webService.postFormData(
      'company/get-extra-earning-head',
      payload
    );
  }

  createExtraEarningHead(payload: any) {
    return this.webService.postFormData(
      'company/add-extra-earning-head',
      payload
    );
  }

  createAdvanceData(payload: any) {
    return this.webService.postFormData('company/add-advance-data', payload);
  }

  updateAdvanceData(payload: any) {
    return this.webService.postFormData('company/update-advance-data', payload);
  }

  getAdvanceData(payload: any) {
    return this.webService.postFormData('company/get-advance-data', payload);
  }

  importAdvanceData(payload: any) {
    return this.webService.postFormData('company/import-advance-data', payload);
  }

  getSampleAdvanceImportCsv(payload: any) {
    return this.webService.postFormData('company/export-advance-data', payload);
  }

  createSalarySheetTemplate(payload: any) {
    return this.webService.postFormData(
      'company/create-earning-sheet-template',
      payload
    );
  }

  createEmployeeSheetTemplate(payload: any) {
    return this.webService.postFormData(
      'company/create-employee-sheet-template',
      payload
    );
  }
  updateEmployeeSheetTemplate(payload: any) {
    return this.webService.postFormData(
      'company/update-employee-sheet-template',
      payload
    );
  }

  fetchSalarySheetTemplates(payload: any) {
    return this.webService.postFormData(
      'company/get-earning-sheet-template',
      payload
    );
  }

  fetchEmployeeSheetTemplates(payload: any) {
    return this.webService.postFormData(
      'company/get-employee-sheet-template',
      payload
    );
  }

  employeeSalaryHold(payload: any) {
    return this.webService.post('company/hold-employee-salary', payload);
  }

  removeEmployeeSalaryHold(payload: any) {
    return this.webService.postFormData(
      'company/remove-from-hold-salary-list',
      payload
    );
  }

  fetchEmployeeSalaryHold(payload: any) {
    return this.webService.post('company/get-hold-salary-employee', payload);
  }

  getMasterSheet(payload: any) {
    return this.webService.postFormData(
      'company/get-master-sheet-data',
      payload
    );
  }

  exportMasterSheet(payload: any) {
    return this.webService.postFormData(
      'company/export-master-sheet-data',
      payload
    );
  }

  getRevisionEmpList(payload: any) {
    return this.webService.postFormData(
      'company/get-revision-emp-list',
      payload
    );
  }
  getRevisionHistory(payload: any) {
    return this.webService.post(
      'company/employee-revision-arrear-history-log-report',
      payload
    );
  }
  updateRevisionEmpData(payload: any) {
    return this.webService.postFormData(
      'company/update-revision-emp-data',
      payload
    );
  }

  updateRevisionEmpMultipleData(payload: any) {
    return this.webService.postFormData(
      'company/update-checked-revision-emp-data',
      payload
    );
  }

  getRevisionEmpLog(payload: any) {
    return this.webService.post('company/get-revision-log', payload);
  }

  getFilteredRevisionEmpList(payload: any) {
    return this.webService.post(
      'company/get-filtered-revision-emp-list',
      payload
    );
  }

  runRevisionEmpPayroll(payload: any, runType: any) {
    if (runType == 'attendance') {
      //return this.webService.postFormData('company/calculate-attendance-data', payload);
    } else {
      //return this.webService.postFormData('company/run-revision-payroll', payload);
    }
    return this.webService.postFormData(
      'company/create-revision-schedule',
      payload
    );
  }

  getRevisionMasterReport(payload: any) {
    if (payload.report_type == 'consolidated') {
      //return this.webService.postFormData('company/get-total-revision-master-report', payload);
      return this.webService.postFormData(
        'company/get-revision-master-report',
        payload
      );
    } else {
      return this.webService.postFormData(
        'company/get-revision-master-report',
        payload
      );
    }
  }

  exportInstructionReport(payload: any) {
    return this.webService.postFormData(
      'company/generate-instruction-report',
      payload
    );
  }

  getInstructionReportData(payload: any) {
    return this.webService.post('company/get-bank-payment-data', payload);
  }

  confirmInstructionReportData(payload: any) {
    return this.webService.post('company/confirm-bank-payment', payload);
  }

  deleteInstructionReportData(payload: any) {
    return this.webService.post(
      'company/delete-bank-payment-ref-file',
      payload
    );
  }

  generateBankInstruction(payload: any) {
    return this.webService.post(
      'company/generate-bank-instruction',
      payload
    );
  }
  generateRivisionInstruction(payload: any) {
    return this.webService.postFormData(
      'company/genertate-bank-instruction',
      payload
    );
  }
  generateRivisionInstructionNew(payload: any) {
    return this.webService.postFormData(
      'company/revision-genertate-bank-instruction',
      payload
    );
  }
  generateChallanReport(payload: any, challanType: string) {
    switch (challanType) {
      case 'esic':
        return this.webService.postFormData(
          'company/generate-esic-report',
          payload
        );
        break;

      default:
        return this.webService.postFormData(
          'company/generate-pf-report',
          payload
        );
        break;
    }
  }

  getChallanReportData(payload: any, challanType: string) {
    switch (challanType) {
      case 'esic':
        return this.webService.post('company/get-esic-challan-data', payload);
        break;

      default:
        return this.webService.post('company/get-challan-data', payload);
        break;
    }
  }

  confirmChallanReportData(payload: any, challanType: string) {
    switch (challanType) {
      case 'esic':
        return this.webService.post(
          'company/confirm-esic-challan-payment',
          payload
        );
        break;

      default:
        return this.webService.post('company/confirm-challan-payment', payload);
        break;
    }
  }

  deleteChallanReportData(payload: any, challanType: string) {
    switch (challanType) {
      case 'esic':
        return this.webService.post(
          'company/delete-esic-challan-ref-file',
          payload
        );
        break;

      default:
        return this.webService.post('company/delete-challan-ref-file', payload);
        break;
    }
  }

  getChallanFormData(payload: any, challanType: string) {
    switch (challanType) {
      case 'esic':
        return this.webService.post(
          'company/get-challan-form-data',
          payload
        );
        break;

      default:
        return this.webService.post('company/get-challan-form-data', payload);
        break;
    }
  }

  submitConfirmChallanPayment(payload: any, challanType: string) {
    switch (challanType) {
      case 'esic':
        return this.webService.postFormData(
          'company/confirm-esic-challan-payment',
          payload
        );
        break;

      default:
        return this.webService.postFormData(
          'company/confirm-pf-challan-payment',
          payload
        );
        break;
    }
  }

  getEmployeeSalaryDetails(payload: any) {
    return this.webService.post('company/get-employee-salary-temp', payload);
  }

  getEmployeePackageDetails(payload: any) {
    return this.webService.post('company/get-employee-package-data', payload);
  }

  runSalarySheet(payload: any) {
    return this.webService.postFormData('company/run-salary-sheet', payload);
  }

  getSalarySheet(payload: any) {
    return this.webService.postFormData(
      'company/get-salary-sheet-data',
      payload
    );
  }
  getSalarySheetDetails(payload: any) {
    return this.webService.postFormData(
      'company/get-salary-sheet-data-details',
      payload
    );
  }
  getSalaryReport(payload: any) {
    return this.webService.postFormData(
      'company/get-calculated-revision-list',
      payload
    );
  }
  getArrearReport(payload: any) {
    return this.webService.post(
      'company/employee-arrear-slip-report',
      payload
    );
  }
  runBonusSheet(payload: any) {
    return this.webService.postFormData('company/run-bonus-sheet', payload);
  }

  getBonusSheet(payload: any) {
    return this.webService.post('company/get-bonus-sheet', payload);
  }

  uploadAttendanceFunnelMapFile(payload: any) {
    return this.webService.postFormData(
      'company/attendance-funnel/upload-map-file',
      payload
    );
  }

  uploadAttendanceFunnelCsv(payload: any) {
    return this.webService.postFormData(
      'company/attendance-funnel/upload-attendance',
      payload
    );
  }

  submitAttendanceFunnelEmployeeMapping(payload: any) {
    return this.webService.post(
      'company/attendance-funnel/map-employee',
      payload
    );
  }

  runIncentiveSheet(payload: any) {
    return this.webService.postFormData('company/run-incentive-sheet', payload);
  }

  getIncentiveSheet(payload: any) {
    return this.webService.postFormData('company/get-incentive-sheet', payload);
  }

  getIncentiveSheetDateRange(payload: any) {
    return this.webService.postFormData(
      'company/get-incentive-report-listing',
      payload
    );
  }

  runSupplementSalary(payload: any) {
    return this.webService.post('company/run-supplement-salary-sheet', payload);
  }

  getOvertimeEmployeeList(payload: any) {
    return this.webService.post('company/overtime-employee-list', payload);
  }

  runOvertimeSheet(payload: any) {
    return this.webService.postFormData('company/run-overtime-data', payload);
  }

  getOvertimeSheet(payload: any) {
    return this.webService.postFormData(
      'company/get-overtime-sheet-data',
      payload
    );
  }
  getOvertimeReport(payload: any) {
    return this.webService.postFormData(
      'company/get-overtime-report-listing',
      payload
    );
  }
  gettdsConsole(payload: any) {
    return this.webService.post(
      'company/tds-console-list',
      payload
    );
  }
  getLWFeport(payload: any) {
    return this.webService.post(
      'company/get-lwf-data',
      payload
    );
  }
  getAdvanceEmployeeList(payload: any) {
    return this.webService.postFormData(
      'company/get-advance-emp-list',
      payload
    );
  }

  runAdvanceSheet(payload: any) {
    return this.webService.postFormData('company/run-advance-sheet', payload);
  }

  getAdvanceSheet(payload: any) {
    return this.webService.postFormData('company/get-advance-sheet', payload);
  }

  fetchBiometricDeviceMaster(payload: any = {}) {
    return this.webService.post(
      'company/attendance-funnel/biometric-systems',
      payload
    );
  }

  generateEmployeePayslip(payload: any = {}) {
    return this.webService.post('company/generate-payslip', payload);
  }
  getEmployeesPayslip(payload: any = {}) {
    return this.webService.post('company/get-generated-payslip-data', payload);
  }
  getpendingleaveList(payload: any = {}) {
    return this.webService.post('company/get-employee-leave-list', payload);
  }
  getEmployeesTDS(payload: any = {}) {
    return this.webService.post('company/pending-declaration-list', payload);
  }
  savetdsDetails(payload: any) {
    return this.webService.postFormDataNested(
      'company/employee-declaration-modify',
      payload
    );
  }
 
  gettdsDetails(payload: any) {
    return this.webService.postFormData(
      'company/employee-declaration',
      payload
    );
  }
  approveTDS(payload: any) {
    return this.webService.post(
      'company/approved-declaration',
      payload
    );
  }
  getsalaryHeads(payload: any = '') {
    return this.webService.post('company/get-salary-template-head', payload);
  }
  getsalarygovHeads(payload: any = '') {
    return this.webService.post('company/get-earning-temp-head', payload);
  }
  savetdsTemplate(payload: any = '') {
    return this.webService.post('company/add-tds-template-data', payload);
  }
  getTDSAct(payload: any = '') {
    return this.webService.post('get-tds-act', payload);
  }
  gettdsTemplate(payload: any = '') {
    return this.webService.post('company/get-tds-data', payload);
  }
  getLeaveEmp(payload: any) {
    return this.webService.post('company/leave/get-employee', payload);
  }
  getshiftEarning(payload: any) {
    return this.webService.post('company/shift-earning-report', payload);
  }
  getshiftDuty(payload: any) {
    return this.webService.post('company/shift-duty-report', payload);
  }
  getshiftDutyExport(payload: any) {
    return this.webService.post('company/shift-duty-report-export', payload);
  }
  getshiftEarningExport(payload: any) {
    return this.webService.post('company/shift-earning-report-export', payload);
  }
  saveEncash(payload: any) {
    return this.webService.post('company/leave/update-leave-balance', payload);
  }

  applyLayoffListing(payload: any) {
    return this.webService.post('company/get-apply-layoff', payload);
  }
  getLayoffReport(payload:any){
    return this.webService.post('company/get-layoff-report' , payload)
  }
  updateLayoffData(payload: any) {
    return this.webService.post('company/update-layoff-data', payload);
  }

  attendanceReport(payload: any) {
    return this.webService.post('company/get-report-attendance-data', payload);
  }
  formjleaveReporrt(payload: any) {
    return this.webService.post('company/get-register-leave-data', payload);
  }
  formfifteenleaveReport(payload: any) {
    return this.webService.post('company/register-per-calender-year-report', payload);
  }
  earnedleaveReporrt(payload: any) {
    return this.webService.post('company/get-leave-ledgerl-report', payload);
  }
  printattendReport(payload: any) {
    return this.webService.post('company/get-employee-attendance-data-report', payload);
  }
  leaveledgerReport(payload: any) {
    return this.webService.post('company/get-leave-ledgerl-report', payload);
  }
  getprocessPayput(payload: any) {
    return this.webService.post('company/leave/process-payout-data', payload);
  }
  leavebankInstruction(payload: any) {
    return this.webService.post('company/generate-bank-instruction', payload);
  }
  exportearnleaveReport(payload: any) {
    return this.webService.post('company/employee-earned-leave-report-export', payload);
  }
  exportformJReport(payload: any) {
    return this.webService.post('company/get-register-leave-data-export', payload);
  }
  exportform15Report(payload: any) {
    return this.webService.post('company/register-per-calender-year-report-export', payload);
  }
  getformePdf(payload: any) {
    return this.webService.post('company/earning-certificate-export-pdf', payload);
  }
  getformeReport(payload: any) {
    return this.webService.post('company/form-e-rest-leave-calender-year-report', payload);
  }
  getprocessEmployee(payload: any) {
    return this.webService.post('company/leave/get-checked-employee', payload);
  }

  sendPayslipData(payload: any) {
    return this.webService.post('company/send-payslip-data', payload);
  }
  sendPayslipDataBulk(payload: any) {
    return this.webService.post('company/send-payslip-bulk', payload);
  }

  getChallanEmployeeList(payload: any) {
    return this.webService.post('company/get-challan-emp-list', payload);
  }
  generateChallanData(payload: any){
    return this.webService.post('company/generate-challan-data', payload )
  }
  getChallanData(payload:any){
    return this.webService.post('company/get-challan-data', payload)
  }
  employeeBlukJoinReport(payload:any){
    return this.webService.post('company/employee-bluk-joining-report', payload)
  }
  employeeBlukExitReport(payload:any){
    return this.webService.post('company/employee-exit-bulk-report', payload)
  }
  employeeJoinExcelDownload(payload:any){
    return this.webService.post('company/export-employee-bluk-joining-report', payload)
  }
  employeeExitExcelDownload(payload:any){
    return this.webService.post('company/export-exit-bluk-employee-joining-report', payload)
  }
  employeeFormAReport(payload:any){
    return this.webService.post('company/export-exit-bluk-employee-joining-report', payload)
  }
  downloadAttendanceReportExcel(payload:any){
    return this.webService.post('company/attendance-report-data-excel', payload)
  }
  incentiveReportListing(payload:any){
    return this.webService.post('company/employee-incentive-report', payload)
  }

  //PT, PF, Esic Report in compliance
  employeeReportListing(payload:any){
    return this.webService.post('company/get-compliance-report-emp-list', payload)
  }
  //PT, PF, Esic Report Download in compliance
  employeeReportListingExcelDownload(payload:any){
    return this.webService.post('company/get-compliance-report-export-file', payload)
  }
  approvextraEarning(payload: any) {
    return this.webService.post('company/approve-extra-earning', payload);
  }
  runReimbursement(payload: any) {
    return this.webService.post('company/run-reimbursement-sheet', payload);
  }
  runextraEarning(payload: any) {
    return this.webService.post('company/run-extra-earning-sheet', payload);
  }
  approveAdvance(payload: any) {
    return this.webService.post('company/employee-advance-status-change', payload);
  }
  approvLeave(payload: any) {
    return this.webService.post('company/employee-leave-status-change', payload);
  }
  getSalaryTemplateHeadsLibrary(payload:any){
    return this.webService.post('company/get-salary-template-head-library', payload);
  }
  updateEmployeeKpiDetail(payload:any){
    return this.webService.post('company/update-employee-kpi-details', payload);
  }
  overtimeReportTwentythree(payload: any) {
    return this.webService.post('company/get-register-overtime-data', payload);
  }
  leaveencashBank(payload: any) {
    return this.webService.post('company/get-report-leave-encashment-data', payload);
  }
  overtimecustomReport(payload: any) {
    return this.webService.post('company/get-overtime-report-temp-wise-listing', payload);
  }
  overtimecustomReportExport(payload: any) {
    return this.webService.post('company/get-overtime-report-temp-wise-export-listing', payload);
  }

  getAppraisalListing(payload:any){
    return this.webService.post('company/get_employee_appraisal', payload);
  }
  addEmployeeAppraisal(payload:any){
    return this.webService.post('company/add_employee_appraisal', payload);
  }
  getAppraisalReportListing(payload:any){
    return this.webService.post('company/employee_appraisal_report', payload);
  }
  exportAppraisalReportExcel(payload:any){
    return this.webService.post('company/appraisal_report_excel_export', payload);
  }

  generateEmployeeInviteLink(payload:any){
    return this.webService.post('company/generate_employee_invite_link', payload)
  }
  ValidInvitationLink(payload:any){
    return this.webService.post('public/check_invitation_link', payload)
  }

  createEmployeePublic(payload: any) {
    return this.webService.postFormData('public/create-employee', payload);
  }
  updateEmployeePublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee',
      payload
    );
  }
  updateEmployeeAddressPublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee-address',
      payload
    );
  }
  updateEmployeeBankDetailsPublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee-bank',
      payload
    );
  }
  updateEmployeeEmploymentDetailsPublic(payload: any) {
    return this.webService.postFormData(
      'public/update-employee-pf-esic',
      payload
    );
  }
  fetchStatesPublic() {
    return this.webService.post('public/get_state_list', {
      countrycode: 'IN',
    });
  }
  getAdvanceListing(payload:any){
    return this.webService.postFormData(
      'company/get-advance-listing',
      payload
    );
  }
  exportAdvanceReportExcel(payload:any){
    return this.webService.post('company/advance_report_excel_export', payload);
  }
  generateAdvanceBankInstruction(payload: any) {
    return this.webService.postFormData(
      'company/generate-advance-bank-instruction',
      payload
    );
  }
  employeeFullAndFinalReport(payload:any){
    return this.webService.postFormData(
      'company/employee-full-and-final-report',
      payload
    )
  }
  getSummaryReportData(payload:any){
    return this.webService.postFormData(
      'company/get-summary-report',
      payload
    )
  }
  getVarianceReportData(payload:any){
    return this.webService.postFormData(
      'company/get-variance-report',
      payload
    )
  }

  //dashboard data 
  getDashboardTotalData(payload:any){
    return this.webService.postFormData(
      'company/company-dashboard-total-data',
      payload
    )
  }
  getDashboardChartData(payload:any){
    return this.webService.postFormData(
      'company/company-dashboard-chart-data',
      payload
    )
  }
  getDashboardFinancialData(payload:any){
    return this.webService.postFormData(
      'company/company-dashboard-financial-data',
      payload
    )
  }
  getDashboardCTCData(payload:any){
    return this.webService.postFormData(
      'company/company-dashboard-ctc-data',
      payload
    )
  }
  download_summary_report(payload:any){
    return this.webService.postFormData('company/export-summary-report', payload)
  }
  download_summary_briefcase(payload:any){
    return this.webService.postFormData('company/export-summary-briefcase', payload)
  }

  bonusFormCReport(payload:any){
    return this.webService.postFormData('company/employee-form-c-bonus-report', payload)
  }
  bonusFormDReport(payload:any){
    return this.webService.postFormData('company/employee-form-d-bonus-report', payload)
  }
  bonusFormCReportExport(payload:any){
    return this.webService.postFormData('company/employee-form-c-bonus-report-export', payload)
  }
  bonusFormDReportExport(payload:any){
    return this.webService.postFormData('company/employee-form-d-bonus-report-export', payload)
  }

  bonusReportExport(payload:any){
    return this.webService.postFormData('company/employee-bonus-report-form-vii-export', payload)
  }
  generateBonusSlip(payload:any){
    return this.webService.postFormData('company/employee-bonus-slip-report', payload)
  }
  employeeBonusReport(payload:any){
    return this.webService.postFormData('company/employee-bonus-report', payload)
  }
  getGeneratedBonusSlips(payload:any){
    return this.webService.postFormData('company/employee-generated-bonus-slip', payload)
  }
  // generatedBonusSlipsExport(payload:any){
  //   return this.webService.postFormData('company/employee-bonus-report', payload)
  // }

  createCompanyLocation(payload:any){
    return this.webService.postFormData('company/create-company-location', payload)
  };
  listCompanyLocation(payload:any){
    return this.webService.postFormData('company/list-company-location', payload)
  }
  // updateCompanyLocation(payload:any){
    // this.createCompanyLocation(payload).toPromise();
  // };
  changeLocationStatus(payload:any){
    return this.webService.postFormData('company/company-status-change', payload)
  };
  deleteCompanyLocation(payload:any){
    return this.webService.postFormData('company/company-delete', payload)
  }

  
  fetchCreditUsageView(payload: any) {
    return this.webService.post( 'company/get-company-credit-usage-details-list',
      payload
    );
  }

  async downloadFile(url:string,fileName:string, payload?:Object) {
    try {
      this.spinner.show()
      await this.webService.simpleGet('company/' + url, payload).toPromise().then(async(response:HttpResponse<any>)=>{
      // console.log(response.headers.keys())
        if(response.status !== 200 || response.body.type == 'application/json'){
          if(response.body.type == 'application/json'){
              const err = await response.body.text()
              throw JSON.parse(err)
          }else{
            throw {message:'Something went wrong. Please try again later'};
          }
        }
        saveAs(response.body, fileName);
        this.spinner.hide()
      },(err) =>{
        throw err
      });
    } catch (err:any) {
      this.spinner.hide()
      // this.toastr.error(err.message)
      throw err 
    }
  }

  fetchPurchaseHistory(payload:any) {
    return this.webService.post('company/get-purchase-history', payload);
  }
  fetchFullAndFinalHistory(payload:any) {
    return this.webService.post('company/full_and_final_history', payload);
  }
  fetchAdvanceRegisterReport(payload:any){
    return this.webService.post('company/advance-register-report', payload); 
  }
  fetchAdvanceFormCReport(payload:any){
    return this.webService.post('company/advance-form-c', payload); 
  }
  fetchEmployeeFormAListing(payload:any){
    return this.webService.post('company/get-employee-master-roll-form-a-report', payload); 
  }
  fetchEmployeeSalaryCerti(payload:any){
    return this.webService.post('company/earning-certificate-export-pdf', payload); 
  }
  fetchWagesFormB(payload:any){
    return this.webService.post('company/get-employee-form-b-register-report', payload); 
  }
  fetchForm37And7A(payload:any){
    return this.webService.post('company/get-esic-form-export', payload); 
  }
  fetchPtaxReturnData(payload:any)  {
    return this.webService.post('company/get-pt-return-report', payload); 
  }
  fetchSalaryCertificates(payload:any){
    return this.webService.post('company/earning-certificate-export-pdf', payload); 
  }
  fetchGratuityFormL(payload:any){
  // console.log('call grat');
    
    return this.webService.post('company/get-gratuity-form-report', payload); 
  }
  fetchEsicUploadReport(payload:any){
    return this.webService.post('company/company-esic-upload-report', payload); 
  }
  fetchEmployeeBulkUpload(payload:any){
    return this.webService.post('company/employee-bulk-upload', payload); 
  }
  deleteEmployee(payload:any){
    return this.webService.post('company/delete-employee', payload); 
  }
}
