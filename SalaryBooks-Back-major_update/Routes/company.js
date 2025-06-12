let express = require('express');
var middleware = require('../Middleware/middleware');
let router = express.Router();
var CompanyInfoController = require('../Controller/Company/Company_infoController');
var epfoController = require('../Controller/Admin/GovRules/EpfoController');
var esicController = require('../Controller/Admin/GovRules/EsicController');
var bonusController = require('../Controller/Admin/GovRules/BonusController');
var gratuityController = require('../Controller/Admin/GovRules/GratuityController');
var TaxslabController = require('../Controller/Admin/GovRules/TaxslabController');
var TDSruleController = require('../Controller/Admin/ComRules/TDSruleController');
var Ptax_ruleController = require('../Controller/Admin/ComRules/Ptax_ruleController');
var BonusPolicyController = require('../Controller/Admin/ComRules/BonusPolicyController');
var OvertimePolicyController = require('../Controller/Admin/ComRules/OvertimePolicyController');
var AttendanceController = require('../Controller/Admin/ComRules/AttendanceController');
var IncentivePolicyController = require('../Controller/Admin/ComRules/IncentivePolicyController');
var EmployeeController = require('../Controller/Company/EmployeeController');
var designationController = require('../Controller/Admin/DesignationController');
var departmentController = require('../Controller/Admin/DepartmentController');
var DispensaryController = require('../Controller/Company/DispensaryController');
var RoleController = require('../Controller/Company/RoleController');
var StaffController = require('../Controller/Company/StaffController');
var EmployeePackage = require('../Controller/Company/Employee_package');
var PayslipTempController = require('../Controller/Admin/ComRules/PayslipTempController');
var BonusslipTempController = require('../Controller/Admin/ComRules/BonusslipTempController');
var ArrearslipTempController = require('../Controller/Admin/ComRules/ArrearslipTempController');
var SalaryTemplateController = require('../Controller/Admin/ComRules/SalaryTemplateController');
var StaffAccountController = require('../Controller/Staff/AccountController');
var ComAttendanceController = require('../Controller/Company/ComAttendanceController');
var LeaveRuleController = require('../Controller/Admin/ComRules/LeaveRuleController');
var LwfruleController = require('../Controller/Admin/ComRules/LwfruleController');
const SalaryCalculator = require('../Controller/Company/SalaryCalculator');
var ClientController = require('../Controller/Company/ClientController');
var ShiftController = require('../Controller/Company/ShiftController');
var PaymentController = require('../Controller/Company/PaymentController');
var LetterWritingController = require('../Controller/Company/LetterWritingController');
var ExpenseController = require('../Controller/Company/ExpenseController');
var SalaryReportController = require('../Controller/Company/SalaryReportController');
var BonusReportController = require('../Controller/Company/BonusReportController');
var IncentiveReportController = require('../Controller/Company/IncentiveReportController');
var ExtraEarningController = require('../Controller/Company/ExtraEarningController'); 
var AdvanceManagementController = require('../Controller/Company/AdvanceManagementController'); 
var RevisionController = require('../Controller/Company/RevisionController');
var AttendanceImportController = require('../Controller/Company/AttendanceImportController');
var PaymentComplianceController = require('../Controller/Company/PaymentComplianceController');
var OvertimeReportController = require('../Controller/Company/OvertimeReportController');
var EmployeePayslipController = require('../Controller/Company/EmployeePayslipController');
var SmtpsetupController = require('../Controller/Admin/SmtpsetupController');
var DeclarationController = require('../Controller/Company/DeclarationController');
var TDSTemplateController = require('../Controller/Company/TDSTemplateController');
const LayoffController = require('../Controller/Company/LayoffController');
var EmployeeLeaveController = require('../Controller/Company/EmployeeLeaveController');
var AttendanceReportController = require('../Controller/Company/AttendanceReportController');
var EmployeeReportController = require('../Controller/Company/EmployeeReportController');
var BulkJoinController = require('../Controller/Company/BulkJoinController');
var VoucherController = require('../Controller/Company/VoucherController');
const AppraisalController = require('../Controller/Company/AppraisalController');
var RegisterLeaveController = require('../Controller/Company/RegisterLeaveController');
const AdvanceController = require('../Controller/Employee/AdvanceController');
const EmployeeLeaveExportController = require('../Controller/Company/EmployeeLeaveExportController');
const ShiftReportController = require('../Controller/Company/ShiftReportController');
const ArrearReportController = require('../Controller/Company/ArrearReportController');
const TdsTempHeadController = require('../Controller/Company/TdsTempHeadController');
const DocumentController = require('../Controller/Company/DocumentController');
const AuditController = require('../Controller/Company/AuditController');
const DashboardController = require('../Controller/Company/DashboardController');
const controllerget = require('../Controller/Company/DashboardController');
const CompanyLocationController = require('../Controller/Company/CompanyLocationController');
const CompanyController = require('../Controller/Admin/CompanyController');
const EmailHelper = require('../Helpers/EmailHelper');


//aman



router.post('/edit_dashboard_content',  DashboardController.edit_dashboard_content);
router.post('/get_dashboard_content', controllerget.get_dashboard_content);

//aman

router.post('/get-account', middleware.checkCompanySuspension('account_suspended'),  StaffAccountController.get_account_details);
router.post('/get-company-data', middleware.checkCompanySuspension('account_suspended'), CompanyInfoController.get_company_data);
router.post('/update-company-logo', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['edit']}}]), CompanyInfoController.update_company_logo);
router.post('/get-company-branch', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.master.branch" :{ $in :['view']}}]), CompanyInfoController.get_company_branch);
router.post('/update-company-details', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['edit']}}]), CompanyInfoController.update_company_details);
router.post('/update-company-establishment', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['add','edit']}}]), CompanyInfoController.update_company_establishment_details);
router.post('/update-company-reg-ofc-address', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['edit']}}]), CompanyInfoController.update_company_reg_office_address);
router.post('/update-company-comm-ofc-address', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['edit']}}]), CompanyInfoController.update_company_communication_office_address);
router.post('/update-company-epf', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['edit']}}]), CompanyInfoController.update_company_epf);
router.post('/update-company-esic', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['edit']}}]), CompanyInfoController.update_company_esic);
router.post('/update-company-p-tax', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['edit']}}]), CompanyInfoController.update_company_professional_tax);
router.post('/update-company-branch', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.master.branch" :{ $in :['add','edit']}}]), CompanyInfoController.update_company_branch_details);
router.post('/update-company-partner', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['add','edit']}}]), CompanyInfoController.update_company_partners_details);
router.post('/update-company-preference-settings', middleware.checkCompanySuspension('account_suspended'), middleware.checkStaffPermission([{"modules.company_profile.company_profile" :{ $in :['add']}}]), CompanyInfoController.update_company_preference_settings);

router.post('/get_permission_module', middleware.checkCompanySuspension('account_suspended'), RoleController.get_permission_module_list);

router.post('/role-list', middleware.checkCompanySuspension('account_suspended'), RoleController.get_role_list);
router.post('/create_role', middleware.checkCompanySuspension('input_suspended', 'account_suspended'), RoleController.add_role);
router.post('/view_role', middleware.checkCompanySuspension('account_suspended'), RoleController.role_details);
router.post('/update_role', middleware.checkCompanySuspension('account_suspended'), RoleController.update_role_data);
router.post('/update_role_status', middleware.checkCompanySuspension('account_suspended'), RoleController.update_role_status);
router.post('/update_role_approval', middleware.checkCompanySuspension('account_suspended'), RoleController.update_role_approval);

router.post('/create_staff', middleware.checkCompanySuspension('input_suspended', 'account_suspended'), StaffController.add_staff_data);
router.post('/get_staff', middleware.checkCompanySuspension('account_suspended'), StaffController.get_staff_list);
router.post('/update_staff', middleware.checkCompanySuspension('account_suspended'), StaffController.update_staff_data);
router.post('/update_staff_password', middleware.checkCompanySuspension('account_suspended'), StaffController.update_staff_password);
router.post('/delete_staff', middleware.checkCompanySuspension('account_suspended'), StaffController.delete_staff_data);

router.post('/create_epfo', middleware.checkCompanySuspension('input_suspended','account_suspended'), middleware.checkComPermission({"gov_pf_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.pf_rules" :{ $in :['add']}}]), epfoController.add_epfo_rule);
router.post('/get_epfo_rule', middleware.checkCompanySuspension('account_suspended'),  middleware.checkComPermission({"gov_pf_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.pf_rules" :{ $in :['view']}}]), epfoController.get_epfo_rule);
router.post('/update_epfo_rule', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_pf_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.pf_rules" :{ $in :['edit']}}]), epfoController.update_epfo_rule);
router.post('/delete_epfo_rule', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_pf_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.pf_rules" :{ $in :['delete']}}]), epfoController.delete_epfo_data);
router.post('/get_active_epfo_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_pf_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.government_rules.pf_rules" :{ $in :['view']}}]), epfoController.get_active_epfo_rule);

router.post('/create_esic', middleware.checkCompanySuspension('input_suspended','account_suspended'),middleware.checkComPermission({"gov_esic_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.esi_rules" :{ $in :['add']}}]), esicController.add_esic_rule);
router.post('/get_esic_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_esic_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.esi_rules" :{ $in :['view']}}]), esicController.get_esic_rule);
router.post('/update_esic_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_esic_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.esi_rules" :{ $in :['edit']}}]), esicController.update_esic_rule);
router.post('/delete_esic_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_esic_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.esi_rules" :{ $in :['delete']}}]), esicController.delete_esic_data);
router.post('/get_active_esic_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_esic_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.government_rules.esi_rules" :{ $in :['view']}}]), esicController.get_active_esic_rule);

router.post('/create_bonus', middleware.checkCompanySuspension('input_suspended','account_suspended'), middleware.checkComPermission({"gov_bonus_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.bonus_rules" :{ $in :['add']}}]), bonusController.add_bonus_rule);
router.post('/get_bonus_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_bonus_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.bonus_rules" :{ $in :['view']}}]), bonusController.get_bonus_rule);
router.post('/update_bonus_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_bonus_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.bonus_rules" :{ $in :['edit']}}]), bonusController.update_bonus_rule);
router.post('/delete_bonus_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_bonus_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.bonus_rules" :{ $in :['delete']}}]), bonusController.delete_bonus_data);
router.post('/get_active_bonus_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_bonus_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.government_rules.bonus_rules" :{ $in :['view']}}]), bonusController.get_active_bonus_rule);

router.post('/create_gratuity', middleware.checkCompanySuspension('input_suspended','account_suspended'), middleware.checkComPermission({"gov_gratuity_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"government_rules.gratuity" :{ $in :['add']}}]), gratuityController.add_gratuity_rule);
router.post('/get_gratuity_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_gratuity_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.gratuity" :{ $in :['view']}}]), gratuityController.get_gratuity_rule);
router.post('/update_gratuity_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_gratuity_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.gratuity" :{ $in :['edit']}}]), gratuityController.update_gratuity_rule);
router.post('/delete_gratuity_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_gratuity_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.gratuity" :{ $in :['delete']}}]), gratuityController.delete_gratuity_data);
router.post('/get_active_gratuity_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_gratuity_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.government_rules.gratuity" :{ $in :['view']}}]), gratuityController.get_active_gratuity_rule);

router.post('/create_tax_category', middleware.checkCompanySuspension('input_suspended','account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['add']}}]), TaxslabController.add_tax_category);
router.post('/get_tax_categories', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['view']}}]), TaxslabController.get_taxslab_categories);
router.post('/update_tax_category', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['edit']}}]), TaxslabController.update_tax_category);
router.post('/delete_tax_category', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['delete']}}]), TaxslabController.delete_tax_category);
router.post('/get_tax_category_library', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['view']}}]), TaxslabController.get_taxslab_categories_library);

router.post('/validate_financial_year', middleware.checkCompanySuspension('account_suspended'),  middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['view']}}]), TaxslabController.validate_financial_year);
router.post('/create_taxslab', middleware.checkCompanySuspension('input_suspended','account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['add']}}]), TaxslabController.add_taxslab_rule);
router.post('/get_taxslabs', middleware.checkCompanySuspension('account_suspended'),  middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['view']}}]), TaxslabController.get_taxslab_list);
router.post('/update_taxslab_rule', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['delete']}}]), TaxslabController.update_taxslab_rule);
router.post('/delete_taxslab_data', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['delete']}}]), TaxslabController.delete_taxslab_data);
router.post('/get_taxslabs_library', middleware.checkCompanySuspension('account_suspended'), middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.government_rules.income_tax_slabs" :{ $in :['view']}}]), TaxslabController.get_taxslab_list_library);


router.post('/create_attendance_rule', middleware.checkCompanySuspension('input_suspended','account_suspended'), AttendanceController.add_attendance_rule);
router.post('/get_attendance_rule', middleware.checkCompanySuspension('account_suspended'), AttendanceController.get_attendance_policy);
router.post('/update_attendance_rule', middleware.checkCompanySuspension('account_suspended'), AttendanceController.update_attendance_rule);
router.post('/delete_attendance_rule', middleware.checkCompanySuspension('account_suspended'), AttendanceController.delete_attendance_rule);
router.post('/get_attendance_library', middleware.checkCompanySuspension('account_suspended'), AttendanceController.get_attendance_policy_library);
router.post('/update_attendance_rule_active_status', middleware.checkCompanySuspension('account_suspended'), AttendanceController.update_active_status);

router.post('/create_incentive_policy', middleware.checkCompanySuspension('input_suspended','account_suspended'), IncentivePolicyController.add_incentive_policy);
router.post('/get_incentive_policy', middleware.checkCompanySuspension('account_suspended'), IncentivePolicyController.get_incentive_policy);
router.post('/update_incentive_policy', middleware.checkCompanySuspension('account_suspended'), IncentivePolicyController.update_incentive_policy);
router.post('/delete_incentive_policy', middleware.checkCompanySuspension('account_suspended'), IncentivePolicyController.delete_incentive_policy);
router.post('/get_incentive_library', middleware.checkCompanySuspension('account_suspended'), IncentivePolicyController.get_incentive_library);
router.post('/update_incentive_policy_active_status', middleware.checkCompanySuspension('account_suspended'), IncentivePolicyController.update_active_status);

router.post('/create_bonus_policy', middleware.checkCompanySuspension('input_suspended','account_suspended'), BonusPolicyController.add_bonus_policy);
router.post('/get_bonus_policy', middleware.checkCompanySuspension('account_suspended'), BonusPolicyController.get_bonus_policy);
router.post('/get-archive-bonus', middleware.checkCompanySuspension('account_suspended'), BonusPolicyController.get_archive_bonus);
router.post('/update_bonus_policy', middleware.checkCompanySuspension('account_suspended'), BonusPolicyController.update_bonus_policy);
router.post('/delete_bonus_policy', middleware.checkCompanySuspension('account_suspended'), BonusPolicyController.delete_bonus_policy);
router.post('/get_bonus_rule_library', middleware.checkCompanySuspension('account_suspended'), BonusPolicyController.get_bonus_rule_library);
router.post('/update_bonus_policy_active_status', middleware.checkCompanySuspension('account_suspended'), BonusPolicyController.update_active_status);

router.post('/get_clients', middleware.checkCompanySuspension('account_suspended'), ClientController.get_clients);
router.post('/add_client', middleware.checkCompanySuspension('input_suspended','account_suspended'), ClientController.add_client);
router.post('/update_client_data', middleware.checkCompanySuspension('account_suspended'), ClientController.update_client_data);
router.post('/update_client_status', middleware.checkCompanySuspension('account_suspended'), ClientController.update_client_status);
router.post('/delete_client', middleware.checkCompanySuspension('account_suspended'), ClientController.delete_client);

router.post('/create_overtime_policy', middleware.checkCompanySuspension('input_suspended','account_suspended'), OvertimePolicyController.add_overtime_policy);
router.post('/get_overtime_policy', middleware.checkCompanySuspension('account_suspended'), OvertimePolicyController.get_overtime_policy);
router.post('/update_overtime_policy', middleware.checkCompanySuspension('account_suspended'), OvertimePolicyController.update_overtime_policy);
router.post('/delete_overtime_policy', middleware.checkCompanySuspension('account_suspended'), OvertimePolicyController.delete_overtime_policy);
router.post('/get_overtime_library', middleware.checkCompanySuspension('account_suspended'), OvertimePolicyController.get_overtime_library);
router.post('/update_overtime_policy_active_status', middleware.checkCompanySuspension('account_suspended'), OvertimePolicyController.update_active_status);

router.post('/get_payslip_temp_library', middleware.checkCompanySuspension('account_suspended'), PayslipTempController.get_payslip_temp_library);
router.post('/create_payslip_temp', middleware.checkCompanySuspension('input_suspended','account_suspended'), PayslipTempController.add_payslip_temp);
router.post('/get_payslip_temp', middleware.checkCompanySuspension('account_suspended'), PayslipTempController.get_payslip_temp);
router.post('/update_payslip_temp', middleware.checkCompanySuspension('account_suspended'), PayslipTempController.update_payslip_temp);
router.post('/delete_payslip_temp', middleware.checkCompanySuspension('account_suspended'), PayslipTempController.delete_payslip_temp);

router.post('/get_bonus_slip_library', middleware.checkCompanySuspension('account_suspended'), BonusslipTempController.get_bonus_slip_library);
router.post('/create_bonus_slip_temp', middleware.checkCompanySuspension('input_suspended','account_suspended'), BonusslipTempController.add_bonus_slip_temp);
router.post('/get_bonus_slip_temp', middleware.checkCompanySuspension('account_suspended'), BonusslipTempController.get_bonus_slip_temp);
router.post('/update_bonus_slip_temp', middleware.checkCompanySuspension('account_suspended'), BonusslipTempController.update_bonus_slip_temp);
router.post('/delete_bonus_slip_temp', middleware.checkCompanySuspension('account_suspended'), BonusslipTempController.delete_bonus_slip_temp);

router.post('/get_arrear_slip_library', middleware.checkCompanySuspension('account_suspended'), ArrearslipTempController.get_arrear_slip_library);
router.post('/get_arrear_slip_master_data', middleware.checkCompanySuspension('account_suspended'), ArrearslipTempController.get_master_data);
router.post('/create_arrears_slip_temp', middleware.checkCompanySuspension('input_suspended','account_suspended'), ArrearslipTempController.add_arrear_slip_temp);
router.post('/get_arrears_slip_temp', middleware.checkCompanySuspension('account_suspended'), ArrearslipTempController.get_arrear_slip_temp);
router.post('/update_arrears_slip_temp', middleware.checkCompanySuspension('account_suspended'), ArrearslipTempController.update_arrear_slip_temp);
router.post('/delete_arrears_slip_temp', middleware.checkCompanySuspension('account_suspended'), ArrearslipTempController.delete_arrear_slip_temp);

router.post('/create_tds_policy', middleware.checkCompanySuspension('input_suspended','account_suspended'), middleware.checkComPermission({"gov_tds_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.gov_tds_rule" :{ $in :['add']}}]), TDSruleController.add_tds_policy);
router.post('/get_tds_policy', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_tds_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.tds_template" :{ $in :['view']}}]), TDSruleController.get_tds_policy);
router.post('/update_tds_policy', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_tds_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.tds_template" :{ $in :['edit']}}]), TDSruleController.update_tds_policy);
router.post('/delete_tds_policy', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_tds_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.tds_template" :{ $in :['delete']}}]), TDSruleController.delete_tds_policy);
router.post('/get_tds_policy_library', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_tds_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.company_rules_2.tds_template" :{ $in :['view']}}]), TDSruleController.get_tds_policy_library);
router.post('/update_tds_policy_active_status', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_tds_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.company_rules_2.tds_template" :{ $in :['view']}}]), TDSruleController.update_active_status);

router.post('/get_state_list', middleware.checkCompanySuspension('account_suspended'), Ptax_ruleController.get_states);
router.post('/get_ptax_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.p_tax_rules" :{ $in :['view']}}]), Ptax_ruleController.get_ptax_rule);
router.post('/create_ptax_rule', middleware.checkCompanySuspension('input_suspended','account_suspended'),middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.p_tax_rules" :{ $in :['add']}}]), Ptax_ruleController.add_ptax_rule);
router.post('/update_ptax_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.p_tax_rules" :{ $in :['edit']}}]), Ptax_ruleController.update_ptax_rule);
router.post('/delete_ptax_rule', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.company_rules_2.p_tax_rules" :{ $in :['delete']}}]), Ptax_ruleController.delete_ptax_rule);
router.post('/get_ptax_rule_library', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_ptax_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.company_rules_2.p_tax_rules" :{ $in :['view']}}]), Ptax_ruleController.get_ptax_rule_library);
router.post('/update_ptax_rule_active_status', middleware.checkCompanySuspension('account_suspended'),middleware.checkComPermission({"gov_ptax_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.company_rules_2.p_tax_rules" :{ $in :['view']}}]), Ptax_ruleController.update_active_status);

router.post('/department-list', middleware.checkCompanySuspension('account_suspended'), departmentController.get_department);
router.post('/create_department', middleware.checkCompanySuspension('input_suspended','account_suspended'), departmentController.add_department);
router.post('/view_department', middleware.checkCompanySuspension('account_suspended'), departmentController.department_details);
router.post('/update_department', middleware.checkCompanySuspension('account_suspended'), departmentController.update_department_data);
router.post('/update_department_status', middleware.checkCompanySuspension('account_suspended'), departmentController.update_department_status);
router.post('/delete_department', middleware.checkCompanySuspension('account_suspended'), departmentController.delete_department);

router.post('/designation-list', middleware.checkCompanySuspension('account_suspended'), designationController.get_designation);
router.post('/create_designation', middleware.checkCompanySuspension('input_suspended','account_suspended'), designationController.add_designation);
router.post('/view_designation', middleware.checkCompanySuspension('account_suspended'), designationController.designation_details);
router.post('/update_designation', middleware.checkCompanySuspension('account_suspended'), designationController.update_designation_data);
router.post('/update_designation_status', middleware.checkCompanySuspension('account_suspended'), designationController.update_designation_status);
router.post('/delete_designation', middleware.checkCompanySuspension('account_suspended'), designationController.delete_designation);

router.post('/add-dispensary', middleware.checkCompanySuspension('input_suspended','account_suspended'), DispensaryController.add_dispensary_data);
router.post('/get-dispensary', middleware.checkCompanySuspension('account_suspended'), DispensaryController.get_dispensary_list);

router.post('/employee-package-master', middleware.checkCompanySuspension('account_suspended'), EmployeePackage.get_package_master);
router.post('/employee-package', middleware.checkCompanySuspension('account_suspended'), EmployeePackage.get_package_list);
router.post('/add-employee-package', middleware.checkCompanySuspension('input_suspended','account_suspended'), EmployeePackage.add_package_data);
router.post('/update-employee-package', middleware.checkCompanySuspension('account_suspended'), EmployeePackage.update_package_data);

router.post('/add-salary-template', middleware.checkCompanySuspension('input_suspended','account_suspended'), SalaryTemplateController.add_salary_template_data);
router.post('/get-salary-template', middleware.checkCompanySuspension('account_suspended'), SalaryTemplateController.get_salary_template_list);
router.post('/update-salary-template', middleware.checkCompanySuspension('account_suspended'), SalaryTemplateController.update_salary_template_data);
router.post('/get-salary-template-head', middleware.checkCompanySuspension('account_suspended'), SalaryTemplateController.get_template_head);
router.post('/add-salary-template-head', middleware.checkCompanySuspension('account_suspended'), SalaryTemplateController.add_salary_template_head);
router.post('/get-salary-template-library', middleware.checkCompanySuspension('account_suspended'), SalaryTemplateController.get_salary_template_library);
router.post('/get-salary-template-head-library', middleware.checkCompanySuspension('account_suspended'), SalaryTemplateController.get_salary_template_head_library);


router.post('/add-employee', middleware.checkCompanySuspension('input_suspended','account_suspended'), EmployeeController.add_employee_data);
router.post('/employee_bulk_update', middleware.checkCompanySuspension('account_suspended'), EmployeeController.employee_bulk_update);
router.post('/activate-new-employee', middleware.checkCompanySuspension('account_suspended'), EmployeeController.active_new_employee);
router.post('/get-employee', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_employee_list);
router.post('/update-employee-status', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_status);
router.post('/update-employee-details', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_details);
router.post('/update-employee-address', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_address);
router.post('/update-employee-employment', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employment_details);
router.post('/update-employee-pf-esic', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_pf_esic_details);
router.post('/update-employee-hr-details', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_hr_details);
router.post('/get-employee-master', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_master_data);
router.post('/update-employee-bank', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_bank_details);
router.post('/update-employee-assets', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_assets_details);
router.post('/update-employee-fam-member', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_family_details);
router.post('/update-employee-training', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_training_details);
router.post('/update-employee-other-details', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_other_details);
router.post('/update-employee-disciplinary-details', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_disciplinary_details);
router.post('/update-employee-contract', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_contract_details);
router.post('/update-employee-accident-details', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_accident_details);
router.post('/update-employee-extra-curricular', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_extra_curricular);
router.post('/update-employee-education', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_education);
router.post('/update-employee-full-and-final-details', middleware.checkCompanySuspension('account_suspended'),middleware.getCompanyData,TDSTemplateController.tdsCalculation, EmployeeController.update_employee_full_and_final_details);
router.post('/get-employee-details', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_employee_details);
router.post('/create-employee-sheet-template', middleware.checkCompanySuspension('account_suspended'), EmployeeController.create_employee_sheet_template);
router.post('/update-employee-sheet-template', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_sheet_template);
router.post('/get-employee-sheet-template', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_employee_sheet_template_list);
router.post('/export-employee-list', middleware.checkCompanySuspension('account_suspended'), EmployeeController.export_employee_list);
router.post('/export-sample-employee-file', middleware.checkCompanySuspension('account_suspended'), EmployeeController.export_sample_xlsx_file);
router.post('/export-employee-extra-data', middleware.checkCompanySuspension('account_suspended'), EmployeeController.export_employee_extra_data);
router.post('/employee-master-data-list', middleware.checkCompanySuspension('account_suspended'), EmployeeController.employee_master_data_list); // Swarup 13-06-2023
router.post('/update-employee-kpi-details', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_kpi_and_appraisal_details); 
router.post('/employee-full-and-final-report', middleware.checkCompanySuspension('account_suspended'), EmployeeController.employee_full_and_final_report); 


router.post('/import-employee-data', middleware.checkCompanySuspension('input_suspended','account_suspended'), EmployeeController.import_employee_data);
router.post('/get-unapproved-employees', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_Unapproved_employee);
router.post('/employee-bulk-approve', middleware.checkCompanySuspension('account_suspended'), EmployeeController.employee_bulk_approve);
router.post('/update-earning-amount', middleware.checkCompanySuspension('account_suspended'), EmployeeController.update_employee_annual_earning_details);
router.post('/get-employee-folders', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_employee_folders);
router.post('/get-employee-files', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_employee_files);
router.post('/get-employee-salary-temp', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_employee_salary_template);
router.post('/get-employee-package-data', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_employee_package_data);




router.post('/get-attendance-configuration', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.get_attendance_configuration);
router.post('/add-weekly-holidays', middleware.checkCompanySuspension('input_suspended','account_suspended'), ComAttendanceController.add_weekly_holidays);
router.post('/get-weekly-holidays', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.get_weekly_holidays);
router.post('/update-weekly-holidays', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.update_weekly_holidays);
router.post('/add-yearly-holidays', middleware.checkCompanySuspension('input_suspended','account_suspended'), ComAttendanceController.add_yearly_holidays);
router.post('/get-yearly-holidays', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.get_yearly_holidays);
router.post('/update-yearly-holidays', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.update_yearly_holidays);
router.post('/add-attendance-data', middleware.checkCompanySuspension('input_suspended','account_suspended'), ComAttendanceController.add_attendance_data);
router.post('/import-attendance-data', middleware.checkCompanySuspension('input_suspended','account_suspended'), ComAttendanceController.import_attendance_data);
router.post('/get-attendance-data', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.get_attendance_data);
router.post('/get-attendance-register', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.get_attendance_register);
router.post('/update-attendance-register', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.update_attendance_register);
router.post('/bulk-update-attendance-data', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.bulk_update_attendance_data);
router.post('/update-attendance-data', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.update_attendance_data);
//router.post('/approve-attendance-data', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.approve_attendance_data);
router.post('/approve-attendance-data', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.approve_monthly_attendance_data);
//router.post('/after-cutoff-approve-attendance-data', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.approve_attendance_ac_data);
router.post('/get-attendance-summary', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.get_attendance_summary);
router.post('/export-sample-attendance-file', middleware.checkCompanySuspension('account_suspended'), ComAttendanceController.export_sample_attendance_data);

router.post('/add-template-head', middleware.checkCompanySuspension('input_suspended','account_suspended'), LeaveRuleController.add_template_head);
router.post('/get-template-head', middleware.checkCompanySuspension('account_suspended'), LeaveRuleController.get_template_head);
router.post('/get-leave-rule', middleware.checkCompanySuspension('account_suspended'), LeaveRuleController.get_leave_rule_policy);
router.post('/add-leave-rule', middleware.checkCompanySuspension('account_suspended'), LeaveRuleController.add_leave_rule);
router.post('/update-leave-rule', middleware.checkCompanySuspension('account_suspended'), LeaveRuleController.update_leave_rule);
router.post('/delete-leave-rule', middleware.checkCompanySuspension('account_suspended'), LeaveRuleController.delete_leave_rule);
router.post('/get-leave-template-library', middleware.checkCompanySuspension('account_suspended'), LeaveRuleController.get_salary_template_library);
router.post('/get-leave-template-head-library', middleware.checkCompanySuspension('account_suspended'), LeaveRuleController.get_salary_template_head_library);

router.post('/get-lwf-rule', middleware.checkCompanySuspension('account_suspended'), LwfruleController.get_lwf_rule_policy);
router.post('/add-lwf-rule', middleware.checkCompanySuspension('input_suspended','account_suspended'), LwfruleController.add_lwf_rule);
router.post('/update-lwf-rule', middleware.checkCompanySuspension('account_suspended'), LwfruleController.update_lwf_rule);
router.post('/delete-lwf-rule', middleware.checkCompanySuspension('account_suspended'), LwfruleController.delete_lwf_rule);
router.post('/get-lwf-rule-library', middleware.checkCompanySuspension('account_suspended'), LwfruleController.get_lwf_rule_library);

router.post('/salary-calculator-master', middleware.checkCompanySuspension('account_suspended'), SalaryCalculator.get_master_data);
router.post('/calculate-salary', middleware.checkCompanySuspension('account_suspended'), SalaryCalculator.calculate_salary);
router.post('/calculate-salary-range', middleware.checkCompanySuspension('account_suspended'), SalaryCalculator.calculate_salary_range);


router.post('/get-shift', middleware.checkCompanySuspension('account_suspended'), ShiftController.get_shift);
router.post('/add-shift', middleware.checkCompanySuspension('input_suspended','account_suspended'), ShiftController.add_shift);
router.post('/update-shift', middleware.checkCompanySuspension('account_suspended'), ShiftController.update_shift);
router.post('/delete-shift', middleware.checkCompanySuspension('account_suspended'), ShiftController.delete_shift);
router.post('/get-active-shift', middleware.checkCompanySuspension('account_suspended'), ShiftController.get_active_shift);
router.post('/get-shift-employee', middleware.checkCompanySuspension('account_suspended'), ShiftController.get_employee_list);
router.post('/update-employee-shift', middleware.checkCompanySuspension('account_suspended'), ShiftController.update_employee_shift);
router.post('/shift-details', middleware.checkCompanySuspension('account_suspended'), ShiftController.shift_details);
router.post('/emp-update-shift-details', middleware.checkCompanySuspension('account_suspended'), ShiftController.emp_update_shift_details);
router.post('/emp-update-shift-rate', middleware.checkCompanySuspension('account_suspended'), ShiftController.emp_update_shift_rate);
router.post('/update-employee-shift-rate', middleware.checkCompanySuspension('account_suspended'), ShiftController.update_employee_shift_rate);
// router.post('/generate-shift-allowance', middleware.checkCompanySuspension('account_suspended'),middleware.getCompanyData, ShiftController.generate_shift_allowance);


router.post('/get-order-id', PaymentController.get_order_id);
router.post('/verify-order-id', PaymentController.verify_order_id);
router.post('/get-credit-setting-value', PaymentController.get_credit_setting_value);
router.post('/check-coupon-code', PaymentController.check_coupon_code);
router.post('/get-payment-history', PaymentController.get_payment_history);

router.post('/get-letter-template', middleware.checkCompanySuspension('account_suspended'), LetterWritingController.get_LW_template);
router.post('/create-letter-template', middleware.checkCompanySuspension('account_suspended'), LetterWritingController.create_LW_template);
router.post('/update-letter-template', middleware.checkCompanySuspension('account_suspended'), LetterWritingController.update_LW_template);
router.post('/update-letter-template-status', middleware.checkCompanySuspension('account_suspended'), LetterWritingController.update_LW_template_status);
router.post('/delete-letter-template', middleware.checkCompanySuspension('account_suspended'), LetterWritingController.delete_LW_template);
router.post('/letter-writting-report', middleware.checkCompanySuspension('account_suspended'), LetterWritingController.letter_writting_report);

router.post('/get-bank-sheet-list', middleware.checkCompanySuspension('account_suspended'), PaymentController.get_sheet_template_list);
router.post('/add-bank-sheet', middleware.checkCompanySuspension('input_suspended','account_suspended'), PaymentController.add_sheet_template);
router.post('/update-bank-sheet', middleware.checkCompanySuspension('account_suspended'), PaymentController.update_sheet_template_data);
router.post('/delete-bank-sheet', middleware.checkCompanySuspension('account_suspended'), PaymentController.delete_sheet_template_data);

router.post('/get-expenses', middleware.checkCompanySuspension('account_suspended'), ExpenseController.get_expenses);
router.post('/add-expense', middleware.checkCompanySuspension('input_suspended','account_suspended'), ExpenseController.add_expenses);


router.post('/hold-employee-salary', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.hold_employee_salary);
router.post('/get-hold-salary-employee', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.generate_hold_salary_employee_list);
router.post('/remove-from-hold-salary-list', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.remove_from_hold_salary_list);

router.post('/run-salary-sheet', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, SalaryReportController.generate_salary_sheet,OvertimeReportController.generate_overtime_sheet, ShiftController.generate_shift_allowance, TDSTemplateController.tdsCalculation);
router.post('/run-supplement-salary-sheet', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, SalaryReportController.generate_supplement_salary_sheet);
//router.post('/generate-earning-sheet', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, SalaryReportController.generate_earning_sheet);
//router.post('/get-master-sheet-data', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.get_master_sheet_data);
router.post('/get-salary-sheet-data', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.get_salary_sheet_data);
router.post('/get-salary-sheet-data-details', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.get_salary_sheet_data_details);
router.post('/export-master-sheet-data', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.export_master_sheet);
//router.post('/generate-payment-slip', middleware.checkCompanySuspension('account_suspended'),SalaryReportController.generate_payment_slip);
//router.post('/generate-instruction-report', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.generate_instruction_report);

router.post('/generate-pf-report', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.generate_pf_report);
//router.post('/get-challan-data', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.get_challan_data);
// router.post('/confirm-challan-payment', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.confirm_challan_payment);
// router.post('/delete-challan-ref-file', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.delete_challan_ref_file);
// router.post('/get-challan-form-data', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.challan_form_data);

router.post('/generate-esic-report', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.generate_esic_report);
router.post('/get-esic-challan-data', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.get_esic_challan_data);
router.post('/get-esic-challan-form-data', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.esic_challan_form_data);
//router.post('/confirm-esic-challan-payment', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.confirm_esic_challan_payment);
//router.post('/delete-esic-challan-ref-file', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.delete_esic_challan_ref_file);


router.post('/update-bonus-data', middleware.checkCompanySuspension('account_suspended'), BonusReportController.update_bonus_data);
router.post('/get-bonus-form', middleware.checkCompanySuspension('account_suspended'), BonusReportController.get_bonus_form);
router.post('/get-bonus-monthly-wise', middleware.checkCompanySuspension('account_suspended'), BonusReportController.get_bonus_monthly_wise);
router.post('/import-bonus', middleware.checkCompanySuspension('input_suspended','account_suspended'), BonusReportController.import_bonus_data);
router.post('/export-bonus-sample-file', middleware.checkCompanySuspension('account_suspended'), BonusReportController.export_bonus_sample_file);
router.post('/run-bonus-sheet', middleware.checkCompanySuspension('account_suspended'),middleware.getCompanyData, BonusReportController.generate_bonus_sheet, TDSTemplateController.tdsCalculation);
router.post('/get-bonus-sheet', middleware.checkCompanySuspension('account_suspended'), BonusReportController.get_bonus_sheet_data);
router.post('/export-excel-sample-file', middleware.checkCompanySuspension('account_suspended'), BonusReportController.export_import_excel_sample_file);

router.post('/update-incentive-data', middleware.checkCompanySuspension('account_suspended'),middleware.getCompanyData, IncentiveReportController.update_incentive_module);
router.post('/get-incentive-form', middleware.checkCompanySuspension('account_suspended'), IncentiveReportController.get_incentive_form);
router.post('/run-incentive-sheet', middleware.checkCompanySuspension('account_suspended'),middleware.getCompanyData, IncentiveReportController.generate_incentive_sheet, TDSTemplateController.tdsCalculation);
router.post('/get-incentive-sheet', middleware.checkCompanySuspension('account_suspended'), IncentiveReportController.get_incentive_sheet_data);
router.post('/get-incentive-report-listing', middleware.checkCompanySuspension('account_suspended'), IncentiveReportController.get_incentive_report_listing_data);
router.post('/import-incentive', middleware.checkCompanySuspension('input_suspended','account_suspended'),middleware.getCompanyData, IncentiveReportController.import_incentive_data);

router.post('/create-earning-sheet-template', middleware.checkCompanySuspension('input_suspended','account_suspended'), SalaryReportController.create_earning_sheet_template);
router.post('/get-earning-sheet-template', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.get_earning_sheet_template_list);
router.post('/generate-earning-sheet-employee-list', middleware.checkCompanySuspension('account_suspended'), SalaryReportController.generate_employee_list_earning_sheet);

router.post('/get-extra-earning', middleware.checkCompanySuspension('account_suspended'),  ExtraEarningController.get_extra_earning_emp);
router.post('/add-extra-earning-data', middleware.checkCompanySuspension('input_suspended','account_suspended'), ExtraEarningController.add_extra_earning);
router.post('/update-extra-earning-data', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.update_extra_earning_data);
router.post('/add-extra-earning-head', middleware.checkCompanySuspension('input_suspended','account_suspended'), ExtraEarningController.add_extra_earning_head);
router.post('/get-extra-earning-head', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.get_extra_earning_head);
router.post('/approve-extra-earning', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.approve_extra_earning);

router.post('/add-advance-data', middleware.checkCompanySuspension('input_suspended','account_suspended'), AdvanceManagementController.add_advance_data);
router.post('/update-advance-data', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.update_advance_data);
router.post('/get-advance-data', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.get_advance_data);
router.post('/import-advance-data', middleware.checkCompanySuspension('input_suspended','account_suspended'),  AdvanceManagementController.import_advance_data);
router.post('/export-advance-data', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.export_advance_sample_file);
router.post('/get-advance-emp-list', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.advance_employee_list);
router.post('/run-advance-sheet', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.generate_advance_sheet);
router.post('/get-advance-sheet', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.get_advance_sheet_data);
router.post('/get-advance-listing', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.get_advance_listing);
router.post('/advance-form-c', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.export_advance_form_c_report);
router.post('/advance_report_excel_export', middleware.checkCompanySuspension('account_suspended'), AdvanceManagementController.export_advance_report_excel);

/* Revision API List */
router.post('/get-revision-emp-list', middleware.checkCompanySuspension('account_suspended'), RevisionController.get_employee_revision_list);
router.post('/update-revision-emp-data', middleware.checkCompanySuspension('account_suspended'), RevisionController.update_employee_revision_data);
router.post('/update-checked-revision-emp-data', middleware.checkCompanySuspension('account_suspended'), RevisionController.update_checked_employee_revision_data);
router.post('/get-revision-log', middleware.checkCompanySuspension('account_suspended'), RevisionController.get_employee_revision_history_data);
router.post('/get-filtered-revision-emp-list', middleware.checkCompanySuspension('account_suspended'), RevisionController.get_filter_revision_employee_list);
router.post('/create-revision-schedule', middleware.checkCompanySuspension('input_suspended','account_suspended'),RevisionController.create_revision_schedule_job);
router.post('/generate-revision-schedule', middleware.checkCompanySuspension('account_suspended'),RevisionController.generate_rivision_data);
router.post('/get-revision-master-report', middleware.checkCompanySuspension('account_suspended'),  RevisionController.get_revision_report);
router.post('/get-calculated-revision-list', middleware.checkCompanySuspension('account_suspended'),  RevisionController.get_calculated_revision_list);
router.post('/revision-genertate-bank-instruction', middleware.checkCompanySuspension('account_suspended'),  RevisionController.generate_instruction_report);

router.post('/update_emp_revision_temp_data', middleware.checkCompanySuspension('account_suspended'),  RevisionController.update_emp_revision_temp_data);




//router.post('/get-total-revision-master-report', middleware.checkCompanySuspension('account_suspended'),RevisionController.calculate_total_revision);
//router.post('/run-revision-payroll', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, RevisionController.run_revision_payroll);
//router.post('/calculate-attendance-data', middleware.checkCompanySuspension('account_suspended'),RevisionController.calculate_attendance_data);




//router.post('/attendance-funnel/upload-map-file', middleware.checkCompanySuspension('account_suspended'),AttendanceImportController.uploadCsv);
router.post('/attendance-funnel/map-employee', middleware.checkCompanySuspension('account_suspended'),AttendanceImportController.mapEmployee);
router.post('/attendance-funnel/upload-attendance', middleware.checkCompanySuspension('input_suspended','account_suspended'),AttendanceImportController.uploadAttendanceData);
router.post('/attendance-funnel/biometric-systems', middleware.checkCompanySuspension('account_suspended'),AttendanceImportController.getBiometricSystems);


router.post('/generate-bank-instruction', middleware.checkCompanySuspension('account_suspended'),PaymentComplianceController.generate_instruction_report);
router.post('/get-bank-payment-data', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.get_bank_payment_data);
router.post('/download-bank-payment-data', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.download_payment_data);
router.post('/confirm-bank-payment', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.confirm_bank_payment);
router.post('/delete-bank-payment-ref-file', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.delete_bank_payment_ref_file);

router.post('/get-challan-emp-list', middleware.checkCompanySuspension('account_suspended'),PaymentComplianceController.get_challan_emp_list);
router.post('/generate-challan-data', middleware.checkCompanySuspension('account_suspended'),PaymentComplianceController.generate_challan_report);
router.post('/get-challan-data', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.get_challan_data);
router.post('/download-challan-data', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.download_challan_data);
//router.post('/confirm-challan-payment', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.confirm_challan_payment);
router.post('/delete-challan-ref-file', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.delete_challan_ref_file);
router.post('/delete-esic-challan-ref-file', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.delete_challan_ref_file);
router.post('/get-challan-form-data', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.challan_form_data);
router.post('/confirm-pf-challan-payment', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.confirm_pf_challan_payment);
router.post('/confirm-esic-challan-payment', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.confirm_esic_challan_payment);
router.post('/get-compliance-report-emp-list', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.get_compliance_report_emp_list);
// router.post('/get-compliance-report-export-file', middleware.checkCompanySuspension('account_suspended'), PaymentComplianceController.get_compliance_report_export_file);




router.post('/overtime-employee-list', middleware.checkCompanySuspension('account_suspended'), OvertimeReportController.overtime_employee_list);
// router.post('/run-overtime-data', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, OvertimeReportController.generate_overtime_sheet);
router.post('/get-overtime-sheet-data', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, OvertimeReportController.get_overtime_sheet_data);
router.post('/get-overtime-report-listing', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, OvertimeReportController.get_overtime_report_listing_data);
router.post('/get-overtime-report-temp-wise-listing', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, OvertimeReportController.get_overtime_report_listing_temp_wise_data);
router.post('/get-overtime-report-temp-wise-export-listing', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, OvertimeReportController.get_overtime_report_listing_temp_wise_export_data);

router.post('/generate-payslip', middleware.checkCompanySuspension('account_suspended'), EmployeePayslipController.generate_employee_payslip);
router.post('/get-generated-payslip-data', middleware.checkCompanySuspension('account_suspended'), EmployeePayslipController.get_generated_payslip_data);
router.post('/download-payslip-data', middleware.checkCompanySuspension('account_suspended'), EmployeePayslipController.download_payslip_data);
router.post('/send-payslip-data', middleware.checkCompanySuspension('account_suspended'), EmployeePayslipController.send_payslip_by_id);
// router.post('/send-payslip-bulk', middleware.checkCompanySuspension('account_suspended'), EmployeePayslipController.send_payslip_bulk );
router.post('/send-payslip-bulk', middleware.checkCompanySuspension('account_suspended'), EmailHelper.send_payslip_bulk );

//aman
router.post('/generate-verification-code',EmployeePayslipController.generate_verification_code );
//aman
// SMTP SETUP
router.post('/get-smtp-list', middleware.checkCompanySuspension('account_suspended'), SmtpsetupController.get_smtp_list);
router.post('/creat-smtp-access', middleware.checkCompanySuspension('input_suspended','account_suspended'), SmtpsetupController.add_smtp_access);
router.post('/update-smtp-access', middleware.checkCompanySuspension('account_suspended'), SmtpsetupController.update_smtp_setup_data);
router.post('/update-smtp-status', middleware.checkCompanySuspension('account_suspended'), SmtpsetupController.update_smtp_setup_status);
router.post('/delete-smtp-access', middleware.checkCompanySuspension('account_suspended'), SmtpsetupController.delete_smtp_setup);

// Swarup Work Part
// --employee declaration
router.post('/employee-declaration-modify', middleware.checkCompanySuspension('account_suspended'),  DeclarationController.employee_declaration_modify);
router.post('/employee-declaration', middleware.checkCompanySuspension('account_suspended'),  DeclarationController.employee_declaration_data);
//get pending declaration 
router.post('/pending-declaration-list', middleware.checkCompanySuspension('account_suspended'), DeclarationController.list_pending_declaration_data)
router.post('/approved-declaration', middleware.checkCompanySuspension('account_suspended'), DeclarationController.approve_declaration_data)

// tds template part
router.post('/get-tds-data', middleware.checkCompanySuspension('account_suspended'),  TDSTemplateController.get_tds);
router.post('/add-tds-template-data', middleware.checkCompanySuspension('input_suspended','account_suspended'), TDSTemplateController.add_data);
router.post('/get-earning-temp-head', middleware.checkCompanySuspension('account_suspended'),  TDSTemplateController.earning_head_list);
//tds caluction cron job
router.post('/calculation-tds-declaration', middleware.checkCompanySuspension('account_suspended'),  TDSTemplateController.tdsCalculation);

router.post('/get-apply-layoff', middleware.checkCompanySuspension('account_suspended'), LayoffController.get_apply_layoff);
router.post('/get-layoff-report', middleware.checkCompanySuspension('account_suspended'), LayoffController.get_layoff_report_data);
router.post('/update-layoff-data', middleware.checkCompanySuspension('account_suspended'), LayoffController.update_layoff_data);

//leave section
router.post('/leave/get-employee', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.get_employee_list);
router.post('/leave/get-checked-employee', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.get_employee_leave_list_without_paginate);
router.post('/leave/edit-leave-balance', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.edit_leave_data);
router.post('/leave/update-leave-balance', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.update_leave_data);

router.post('/leave/process-payout-data', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.process_payout_leave_data);
router.post('/leave/process-encash-payment', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.encash_leave_payment);

//attendance report 
router.post('/get-report-attendance-data', middleware.checkCompanySuspension('account_suspended'),  AttendanceReportController.get_report_attendance_data);
//attendance exle report 
router.post('/export-attendance-report-data', middleware.checkCompanySuspension('account_suspended'),  AttendanceReportController.export_attendance_report_data);
// leave encashment report
router.post('/get-report-leave-encashment-data', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.leave_encashment_report);

// leave encashment report with payment
router.post('/get-report-leave-encashment-data-with-payment', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.leave_encashment_report_with_amount);

//employee form a report
router.post('/get-employee-form-a-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.employee_form_a_report);

// Leave Ledgerl Report 
router.post('/get-leave-ledgerl-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.leave_ledgerl_report);

//batch report
router.post('/get-employee-batch-list', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.employee_batch_list);

//bluk report
router.post('/employee-bluk-joining-report', middleware.checkCompanySuspension('account_suspended'),  BulkJoinController.get_employee_list);
//export exel
router.post('/export-employee-bluk-joining-report', middleware.checkCompanySuspension('account_suspended'),  BulkJoinController.export_bulk_employee_list);

router.post('/employee-exit-bulk-report', middleware.checkCompanySuspension('account_suspended'),  BulkJoinController.get_employee_exit_bulk);
//export exel
router.post('/export-exit-bluk-employee-joining-report', middleware.checkCompanySuspension('account_suspended'),  BulkJoinController.export_bulk_exit_employee_list);

//employee  incentive report
router.post('/employee-incentive-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.employee_incentive_report_list);

//company employee leave list
router.post('/get-employee-leave-list', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.get_employee_leave_list);
router.post('/employee-leave-status-change', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.employee_leave_status_change);
// company employee advance 
router.post('/employee-advance-status-change', middleware.checkCompanySuspension('account_suspended'),  AdvanceManagementController.approve_advance_data);

// extra earning sample data export
router.post('/export-sample-extra-earning-file', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.export_earning_sample_xlsx_file);
router.post('/import-extra-earning-data', middleware.checkCompanySuspension('input_suspended','account_suspended'), ExtraEarningController.import_extra_earning_data);
//pending earning list
router.post('/get-extra-earning-pending-data', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.get_extra_earning_emp_pending);
//voucher part
router.post('/get-salary-voucher-data', middleware.checkCompanySuspension('account_suspended'), VoucherController.get_salary_voucher_data);
//register leave
router.post('/get-register-leave-data', middleware.checkCompanySuspension('account_suspended'), RegisterLeaveController.get_register_leave_data);
router.post('/get-register-overtime-data', middleware.checkCompanySuspension('account_suspended'), RegisterLeaveController.get_register_overtime_data);
router.post('/get-kyc-bluk-data', middleware.checkCompanySuspension('account_suspended'), RegisterLeaveController.get_kyc_bluk_data);
router.post('/get-lwf-data', middleware.checkCompanySuspension('account_suspended'), RegisterLeaveController.get_lwf_data);
//ot report 2
router.post('/get-register-ot-report-data', middleware.checkCompanySuspension('account_suspended'), RegisterLeaveController.get_register_overtime_report_two_data);

//Appraisal Routes
router.post('/get_employee_appraisal', middleware.checkCompanySuspension('account_suspended'), AppraisalController.get_employee_appraisal);
router.post('/add_employee_appraisal', middleware.checkCompanySuspension('input_suspended','account_suspended'), AppraisalController.add_employee_appraisal);
router.post('/employee_appraisal_report', middleware.checkCompanySuspension('account_suspended'), AppraisalController.employee_appraisal_report);
router.post('/appraisal_report_excel_export', middleware.checkCompanySuspension('account_suspended'), AppraisalController.export_appraisal_report_excel);

router.post('/generate_employee_invite_link', middleware.checkCompanySuspension('input_suspended','account_suspended'), EmployeeController.generate_employee_invite_link);

//attendance report employee
router.post('/get-employee-attendance-data-report', middleware.checkCompanySuspension('account_suspended'),  AttendanceReportController.get_employee_attendance_data_report);

//Earning Certificate Export Pdf
router.post('/earning-certificate-export-pdf', middleware.checkCompanySuspension('account_suspended'),  ExtraEarningController.earning_certificate_export_pdf);

// router.post('/generate-advance-bank-instruction', middleware.checkCompanySuspension('account_suspended'),middleware.getCompanyData, AdvanceController.generate_advance_sheet, PaymentComplianceController.generate_instruction_report );
router.post('/generate-advance-bank-instruction', middleware.checkCompanySuspension('account_suspended'),middleware.getCompanyData, PaymentComplianceController.generate_instruction_report );

//Form 15 REGISTER OF LEAVE AS PER CALENDAR YEAR
router.post('/register-per-calender-year-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.register_as_per_calender_year_report);

router.post('/form-e-rest-leave-calender-year-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.form_e_rest_leave_calender_year_report);

//bonus report by swarup
router.post('/employee-bonus-report', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.employee_bonus_report);
router.post('/employee-form-c-bonus-report', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.employee_15_form_c_bonus_report);
router.post('/employee-bonus-slip-report', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.employee_bonus_slip_report);
router.post('/employee-form-d-bonus-report', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.employee_18_form_d_bonus_report);
router.post('/employee-generated-bonus-slip', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.generated_bonus_slip_list);

// leave report export
router.post('/leave-ledgerl-report-export', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveExportController.leave_ledgerl_report_export);

// bonus report excel export
router.post('/employee-bonus-report-form-vii-export', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.employee_bonus_report_form_vii_export);
router.post('/employee-form-c-bonus-report-export', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.employee_15_form_c_bonus_report_export);
router.post('/employee-form-d-bonus-report-export', middleware.checkCompanySuspension('account_suspended'),  BonusReportController.employee_18_form_d_bonus_report_expport);

// report 52 no
router.post('/employee-earned-leave-report-export', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveExportController.earned_leave_report_export);

// leave encashment report form no 50
router.post('/leave-encashment-report-export', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.leave_encashment_report_export);

//register leave export
router.post('/get-register-leave-data-export', middleware.checkCompanySuspension('account_suspended'), RegisterLeaveController.get_register_leave_data_export);

//Form 15 REGISTER OF LEAVE AS PER CALENDAR YEAR EXPORT
router.post('/register-per-calender-year-report-export', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.register_as_per_calender_year_report_export);

//Shift report report no 62
router.post('/shift-duty-report', middleware.checkCompanySuspension('account_suspended'),  ShiftReportController.shift_duty_report);
router.post('/shift-duty-report-export', middleware.checkCompanySuspension('account_suspended'),  ShiftReportController.shift_duty_report_export);

//Shift report report no 61
router.post('/shift-earning-report', middleware.checkCompanySuspension('account_suspended'),  ShiftReportController.shift_earning_report);
router.post('/shift-earning-report-export', middleware.checkCompanySuspension('account_suspended'),  ShiftReportController.shift_earning_report_export);

//Leave FORM E report no 33
router.post('/form-e-rest-leave-calender-year-report-pdf-export', middleware.checkCompanySuspension('account_suspended'),  EmployeeLeaveController.form_e_rest_leave_calender_year_report_pdf_export);
//
router.post('/employee-arrear-slip-report', middleware.checkCompanySuspension('account_suspended'),  ArrearReportController.employee_arrear_slip_report_export);
router.post('/get-arrear-payslip-data', middleware.checkCompanySuspension('account_suspended'), ArrearReportController.get_arrear_generated_payslip_data);
router.post('/employee-revision-arrear-history-report', middleware.checkCompanySuspension('account_suspended'),  ArrearReportController.get_revision_history_report_pdf_export);
router.post('/employee-revision-arrear-history-log-report', middleware.checkCompanySuspension('account_suspended'),  ArrearReportController.get_revision_history_log_report_pdf_export);

/* Revision API List pre revison */
router.post('/get-pre-revision-emp-list', middleware.checkCompanySuspension('account_suspended'), RevisionController.get_employee_revision_list_with_pre_revision);

// tds temp head section
router.post('/add-tds-temp-head', middleware.checkCompanySuspension('input_suspended','account_suspended'), TdsTempHeadController.add_tds_head_data);
router.post('/get-tds-temp-head', middleware.checkCompanySuspension('account_suspended'), TdsTempHeadController.get_tds_temp_head);

//document Part 
router.post('/employee-file-document-list', middleware.checkCompanySuspension('account_suspended'),  DocumentController.document_list);
router.post('/employee-file-document-list-details', middleware.checkCompanySuspension('account_suspended'),  DocumentController.document_details_list);

//audit
router.post('/get-summary-report', middleware.checkCompanySuspension('account_suspended'),  AuditController.get_summary_report_data);
router.post('/get-variance-report', middleware.checkCompanySuspension('account_suspended'),  AuditController.get_variance_report_data);
router.post('/export-summary-report', middleware.checkCompanySuspension('account_suspended'),  AuditController.export_summary_report);
router.post('/export-summary-briefcase', middleware.checkCompanySuspension('account_suspended'),  AuditController.export_summary_briefcase);

//extra reimbursements
router.post('/get-reimbursement', middleware.checkCompanySuspension('account_suspended'),  ExtraEarningController.get_reimbursement_emp);
router.post('/get-apply-reimbursement', middleware.checkCompanySuspension('account_suspended'),  ExtraEarningController.get_apply_reimbursement);
router.post('/get-reimbursement-pending-data', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.get_reimbursement_emp_pending);
router.post('/add-reimbursement', middleware.checkCompanySuspension('input_suspended','account_suspended'), ExtraEarningController.add_reimbursement);
router.post('/update-reimbursement', middleware.checkCompanySuspension('input_suspended','account_suspended'), ExtraEarningController.update_reimbursement);

//extra earning calculated monthly report
router.post('/run-extra-earning-sheet', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, ExtraEarningController.generate_extra_earning,TDSTemplateController.tdsCalculation);
router.post('/run-reimbursement-sheet', middleware.checkCompanySuspension('account_suspended'), middleware.getCompanyData, ExtraEarningController.generate_reimbursement,TDSTemplateController.tdsCalculation);
router.post('/get-earning-reimbursement-bank-instruction-data', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.get_earning_and_reimbursement_data);

router.post('/extra-earning-report', middleware.checkCompanySuspension('account_suspended'), ExtraEarningController.extra_earning_report);
router.post('/get-tds-list', middleware.checkCompanySuspension('account_suspended'), TDSTemplateController.get_tds_list);
router.post('/get-tds-library-list', middleware.checkCompanySuspension('account_suspended'), TDSTemplateController.get_tds_library_list);

// tds console listing
router.post('/tds-console-list', middleware.checkCompanySuspension('account_suspended'),TDSTemplateController.tds_console_listing);
// tds custom report
router.post('/tds-custom-report', middleware.checkCompanySuspension('account_suspended'),TDSTemplateController.tds_custom_report);
// tds custom report 22
router.post('/tds-custom-report-form-b-16', middleware.checkCompanySuspension('account_suspended'),TDSTemplateController.tds_form_b_no_16_report);

//dashboard data
router.post('/company-dashboard-total-data', middleware.checkCompanySuspension('account_suspended'), DashboardController.get_company_dashboard_total_data);
router.post('/company-dashboard-chart-data', middleware.checkCompanySuspension('account_suspended'), DashboardController.get_company_dashboard_chart_data);
router.post('/company-dashboard-financial-data', middleware.checkCompanySuspension('account_suspended'), DashboardController.get_company_dashboard_financial_data);
router.post('/company-dashboard-ctc-data', middleware.checkCompanySuspension('account_suspended'), DashboardController.get_company_dashboard_ctc_data);
// router.post('/change_type', middleware.checkCompanySuspension('account_suspended'), DashboardController.changeType);

router.post('/advance-register-report', middleware.checkCompanySuspension('account_suspended'),AdvanceManagementController.export_advance_register_report);

// company location
router.post('/create-company-location', middleware.checkCompanySuspension('input_suspended','account_suspended'),CompanyLocationController.create);
router.post('/list-company-location', middleware.checkCompanySuspension('account_suspended'),CompanyLocationController.listing);
router.post('/company-status-change', middleware.checkCompanySuspension('account_suspended'),CompanyLocationController.status_change);
router.post('/company-delete', middleware.checkCompanySuspension('account_suspended'),CompanyLocationController.delete);

router.post('/get-company-credit-usage-details-list', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_consumption_history);
router.post('/get-purchase-history', middleware.checkCompanySuspension('account_suspended'), EmployeeController.get_purchase_history);
router.post('/download-purchase-history', middleware.checkCompanySuspension('account_suspended'), EmployeeController.download_purchase_history_data);

router.post('/full_and_final_history', middleware.checkCompanySuspension('account_suspended'), EmployeeController.full_and_final_history);

// router.get('/is-payment-required', CompanyInfoController.companyPaymentRequired);

// swarup das 01/04/2024
//employee form a report no 8
router.post('/get-employee-master-roll-form-a-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.employee_master_roll_form_a_report);
// Form B WAGE REGISTER REPORT NO - 13
router.post('/get-employee-form-b-register-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.employee_form_b_wage_register_report);
// 14ESIC  FORM37 _ 7A
router.post('/get-esic-form-export', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.company_esic_form_report);
 // PT Return Report No -- 47 
router.post('/get-pt-return-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.employee_pt_return_report);
// 25 Gratuity Form L
router.post('/get-gratuity-form-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.company_gratuity_form_l_report);
// KYC BULK Report No 30
router.post('/employee-bulk-upload', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.employee_bulk_upload);
// 34 ESIC UPLOAD
router.post('/company-esic-upload-report', middleware.checkCompanySuspension('account_suspended'),  EmployeeReportController.company_esic_upload_report);
router.post('/delete-employee', middleware.checkCompanySuspension('account_suspended'), EmployeeController.delete_employee); 

// end
module.exports = router;