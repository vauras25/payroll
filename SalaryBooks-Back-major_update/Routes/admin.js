let express = require('express');
var middleware = require('../Middleware/middleware');
let router = express.Router();
var userController = require('../Controller/Admin/UserController');
var departmentController = require('../Controller/Admin/DepartmentController');
var branchController = require('../Controller/Admin/BranchController');
var designationController = require('../Controller/Admin/DesignationController');
var roleController = require('../Controller/Admin/RoleController');
var resellerController = require('../Controller/Admin/ResellerController');
var epfoController = require('../Controller/Admin/GovRules/EpfoController');
var esicController = require('../Controller/Admin/GovRules/EsicController');
var bonusController = require('../Controller/Admin/GovRules/BonusController');
var gratuityController = require('../Controller/Admin/GovRules/GratuityController');
var TaxslabController = require('../Controller/Admin/GovRules/TaxslabController');
var CompanyController = require('../Controller/Admin/CompanyController');
var PackageController = require('../Controller/Admin/PackageController');
var PlanController = require('../Controller/Admin/PlanController');
var AttendanceController = require('../Controller/Admin/ComRules/AttendanceController');
var IncentivePolicyController = require('../Controller/Admin/ComRules/IncentivePolicyController');
var BonusPolicyController = require('../Controller/Admin/ComRules/BonusPolicyController');
var OvertimePolicyController = require('../Controller/Admin/ComRules/OvertimePolicyController');
var TDSruleController = require('../Controller/Admin/ComRules/TDSruleController');
var Ptax_ruleController = require('../Controller/Admin/ComRules/Ptax_ruleController');
var LwfruleController = require('../Controller/Admin/ComRules/LwfruleController');
var PromotionController = require('../Controller/Admin/Promotions/PromotionController');
var PayslipTempController = require('../Controller/Admin/ComRules/PayslipTempController');
var BonusslipTempController = require('../Controller/Admin/ComRules/BonusslipTempController');
var ArrearslipTempController = require('../Controller/Admin/ComRules/ArrearslipTempController');
var SalaryTemplateController = require('../Controller/Admin/ComRules/SalaryTemplateController');
var CouponController = require('../Controller/Admin/CouponController');
var TDSTemplateController = require('../Controller/Admin/TDSTemplateController');
//var ActivitylogController = require('../Controller/Admin/ActivitylogController');

var CreditManagementController = require('../Controller/Admin/CreditManagementController');
var CreditInvoiceController = require('../Controller/Company/CreditInvoiceController');
var LeaveRuleController = require('../Controller/Admin/ComRules/LeaveRuleController');
var SmtpsetupController = require('../Controller/Admin/SmtpsetupController');
var DashboardController = require('../Controller/Admin/DashboardController');

router.post('/get-account', userController.get_account_details);
router.post('/update-account', userController.update_account_data);
router.post('/update-account-password', userController.update_account_password);
router.post('/get-masters-data', userController.get_masters_data);

router.post('/department-list', departmentController.get_department);
router.post('/create_department', departmentController.add_department);
router.post('/view_department', departmentController.department_details);
router.post('/update_department', departmentController.update_department_data);
router.post('/update_department_status', departmentController.update_department_status);
router.post('/delete_department', departmentController.delete_department);

router.post('/branceh-list', branchController.get_branch);
router.post('/create_branch', branchController.add_branch);
router.post('/view_branch', branchController.branch_details);
router.post('/update_branch', branchController.update_branch_data);
router.post('/update_branch_status', branchController.update_branch_status);
router.post('/delete_branch', branchController.delete_branch);

router.post('/designation-list', designationController.get_designation);
router.post('/create_designation', designationController.add_designation);
router.post('/view_designation', designationController.designation_details);
router.post('/update_designation', designationController.update_designation_data);
router.post('/update_designation_status', designationController.update_designation_status);
router.post('/delete_designation', designationController.delete_designation);

//router.get('/userlist', userController.getuserdata);
router.post('/get_permission_module', roleController.get_permission_module_list);

router.post('/role-list', roleController.get_role_list);
router.post('/create_role', roleController.add_role);
router.post('/view_role', roleController.role_details);
router.post('/update_role', roleController.update_role_data);
router.post('/update_role_status', roleController.update_role_status);
router.post('/update_role_approval', roleController.update_role_approval);

router.post('/get_state_city_list', resellerController.get_state_city_list);
router.post('/get_reseller_list', resellerController.get_reseller_list);
router.post('/add_reseller', resellerController.add_reseller);
router.post('/get_reseller_details', resellerController.reseller_details);
router.post('/update_reseller', resellerController.update_reseller_data);
router.post('/delete_reseller', resellerController.delete_reseller);

router.post('/create_subadmin', userController.add_subadmin_data);
router.post('/get_subadmin', userController.get_subadmin_list);
router.post('/update_subadmin', userController.update_subadmin_data);
router.post('/update_subadmin_password', userController.update_subadmin_password);
router.post('/delete_subadmin', userController.delete_user_data);

router.post('/create_epfo', epfoController.add_epfo_rule);
router.post('/get_epfo_rule', epfoController.get_epfo_rule);
router.post('/update_epfo_rule', epfoController.update_epfo_rule);
router.post('/delete_epfo_rule', epfoController.delete_epfo_data);

router.post('/create_esic', esicController.add_esic_rule);
router.post('/get_esic_rule', esicController.get_esic_rule);
router.post('/update_esic_rule', esicController.update_esic_rule);
router.post('/delete_esic_rule', esicController.delete_esic_data);

router.post('/create_bonus', bonusController.add_bonus_rule);
router.post('/get_bonus_rule', bonusController.get_bonus_rule);
router.post('/update_bonus_rule', bonusController.update_bonus_rule);
router.post('/delete_bonus_rule', bonusController.delete_bonus_data);

router.post('/create_gratuity', gratuityController.add_gratuity_rule);
router.post('/get_gratuity_rule', gratuityController.get_gratuity_rule);
router.post('/update_gratuity_rule', gratuityController.update_gratuity_rule);
router.post('/delete_gratuity_rule', gratuityController.delete_gratuity_data);

router.post('/create_tax_category', TaxslabController.add_tax_category);
router.post('/get_tax_categories', TaxslabController.get_taxslab_categories);
router.post('/update_tax_category', TaxslabController.update_tax_category);
router.post('/delete_tax_category', TaxslabController.delete_tax_category);

router.post('/validate_financial_year', TaxslabController.validate_financial_year);
router.post('/create_taxslab', TaxslabController.add_taxslab_rule);
router.post('/get_taxslabs', TaxslabController.get_taxslab_list);
router.post('/update_taxslab_rule', TaxslabController.update_taxslab_rule);
router.post('/delete_taxslab_data', TaxslabController.delete_taxslab_data);


//router.post('/update_permission_list', PackageController.update_permission_list);
router.post('/get_permission_list', PackageController.get_permission_list);
router.post('/add_packege', PackageController.add_packege);
router.post('/get_package_list', PackageController.get_package_list);
router.post('/update_package_data', PackageController.update_package_data);
router.post('/delete_package_data', PackageController.delete_package_data);

router.post('/add_plan', PlanController.add_plan);
router.post('/get_plan_list', PlanController.get_plan_list);
router.post('/update_plan_status', PlanController.update_plan_status);
router.post('/update_plan_data', PlanController.update_plan_data);
router.post('/delete_plan_data', PlanController.delete_plan_data);

router.post('/get_package_plans', CompanyController.get_package_plans);
router.post('/add_company_data', CompanyController.add_company_data);
router.post('/get_company_list', CompanyController.get_company_list);
router.post('/get_company_details', CompanyController.get_company_details);
router.post('/update_company_credit', CompanyController.update_credit_value);
router.post('/update_suspend_status', CompanyController.update_suspend_status);
router.post('/update_company_status', CompanyController.update_company_status);
router.post('/update_company_hold_credit', CompanyController.update_company_hold_credit);

router.post('/create_attendance_rule', AttendanceController.add_attendance_rule);
router.post('/get_attendance_rule', AttendanceController.get_attendance_policy);
router.post('/update_attendance_rule', AttendanceController.update_attendance_rule);
router.post('/delete_attendance_rule', AttendanceController.delete_attendance_rule);
router.post('/update_attendance_publish_status', AttendanceController.update_publish_status);

router.post('/create_incentive_policy', IncentivePolicyController.add_incentive_policy);
router.post('/get_incentive_policy', IncentivePolicyController.get_incentive_policy);
router.post('/update_incentive_policy', IncentivePolicyController.update_incentive_policy);
router.post('/delete_incentive_policy', IncentivePolicyController.delete_incentive_policy);
router.post('/update_incentive_policy_publish_status', IncentivePolicyController.update_publish_status);


router.post('/create_bonus_policy', BonusPolicyController.add_bonus_policy);
router.post('/get_bonus_policy', BonusPolicyController.get_bonus_policy);
router.post('/update_bonus_policy', BonusPolicyController.update_bonus_policy);
router.post('/delete_bonus_policy', BonusPolicyController.delete_bonus_policy);
router.post('/update_bonus_policy_publish_status', BonusPolicyController.update_publish_status);

router.post('/create_overtime_policy', OvertimePolicyController.add_overtime_policy);
router.post('/get_overtime_policy', OvertimePolicyController.get_overtime_policy);
router.post('/update_overtime_policy', OvertimePolicyController.update_overtime_policy);
router.post('/delete_overtime_policy', OvertimePolicyController.delete_overtime_policy);
router.post('/update_overtime_publish_status', OvertimePolicyController.update_publish_status);

router.post('/create_tds_policy', TDSruleController.add_tds_policy);
router.post('/get_tds_policy', TDSruleController.get_tds_policy);
router.post('/update_tds_policy', TDSruleController.update_tds_policy);
router.post('/delete_tds_policy', TDSruleController.delete_tds_policy);
router.post('/update_tds_publish_status', TDSruleController.update_publish_status);

router.post('/get_state_list', Ptax_ruleController.get_states);
router.post('/get_ptax_rule', Ptax_ruleController.get_ptax_rule);
router.post('/create_ptax_rule', Ptax_ruleController.add_ptax_rule);
router.post('/update_ptax_rule', Ptax_ruleController.update_ptax_rule);
router.post('/delete_ptax_rule', Ptax_ruleController.delete_ptax_rule);
router.post('/update_ptax_publish_status', Ptax_ruleController.update_publish_status);

router.post('/get_arrear_slip_master_data', ArrearslipTempController.get_master_data);
router.post('/create_arrears_slip_temp', ArrearslipTempController.add_arrear_slip_temp);
router.post('/get_arrears_slip_temp', ArrearslipTempController.get_arrear_slip_temp);
router.post('/update_arrears_slip_temp', ArrearslipTempController.update_arrear_slip_temp);
router.post('/delete_arrears_slip_temp', ArrearslipTempController.delete_arrear_slip_temp);
router.post('/update-arrears-slip-publish-status', ArrearslipTempController.update_publish_status);

router.post('/add-salary-template', SalaryTemplateController.add_salary_template_data);
router.post('/get-salary-template', SalaryTemplateController.get_salary_template_list);
router.post('/update-salary-template', SalaryTemplateController.update_salary_template_data);
router.post('/get-salary-template-head', SalaryTemplateController.get_template_head);
router.post('/add-salary-template-head', SalaryTemplateController.add_salary_template_head);
router.post('/update-publish-status', SalaryTemplateController.update_publish_status);

router.post('/add-leave-template-head', LeaveRuleController.add_template_head);
router.post('/get-leave-template-head', LeaveRuleController.get_template_head);
router.post('/get-leave-rule', LeaveRuleController.get_leave_rule_policy);
router.post('/add-leave-rule', LeaveRuleController.add_leave_rule);
router.post('/update-leave-rule', LeaveRuleController.update_leave_rule);
router.post('/delete-leave-rule', LeaveRuleController.delete_leave_rule);
router.post('/update-leave-publish-status', LeaveRuleController.update_publish_status);

router.post('/create_payslip_temp', PayslipTempController.add_payslip_temp);
router.post('/get_payslip_temp', PayslipTempController.get_payslip_temp);
router.post('/update_payslip_temp', PayslipTempController.update_payslip_temp);
router.post('/update-payslip-publish-status', PayslipTempController.update_publish_status);
router.post('/delete_payslip_temp', PayslipTempController.delete_payslip_temp);

router.post('/create_bonus_slip_temp', BonusslipTempController.add_bonus_slip_temp);
router.post('/get_bonus_slip_temp', BonusslipTempController.get_bonus_slip_temp);
router.post('/update_bonus_slip_temp', BonusslipTempController.update_bonus_slip_temp);
router.post('/update-bonus-slip-publish-status', BonusslipTempController.update_publish_status);
router.post('/delete_bonus_slip_temp', BonusslipTempController.delete_bonus_slip_temp);

router.post('/get-lwf-rule', LwfruleController.get_lwf_rule_policy);
router.post('/add-lwf-rule', LwfruleController.add_lwf_rule);
router.post('/update-lwf-rule', LwfruleController.update_lwf_rule);
router.post('/update-lwf-publish-status', LwfruleController.update_publish_status);
router.post('/delete-lwf-rule', LwfruleController.delete_lwf_rule);

router.post('/create_coupon_code', CouponController.add_coupon);
router.post('/get_coupon_code', CouponController.get_coupons);
router.post('/update_coupon_code', CouponController.update_code_data);
router.post('/delete_coupon_code', CouponController.delete_coupon);
router.post('/update-coupon-status', CouponController.update_coupon_status);
router.post('/coupon-details', CouponController.get_coupon_details);
// router.post('/log_entry', ActivitylogController.log_entry);
// router.post('/log_history', ActivitylogController.log_history);



router.post('/update_credit_value', CreditManagementController.update_credit_value);
router.post('/get_credit_value', CreditManagementController.get_settings_value);

router.post('/create-credit-invoice', CreditInvoiceController.create_update_credit_inv_template);
router.post('/get-credit-invoice', CreditInvoiceController.get_credit_inv_template);

router.post('/get-smtp-list', SmtpsetupController.get_smtp_list);
router.post('/creat-smtp-access', SmtpsetupController.add_smtp_access);
router.post('/update-smtp-access', SmtpsetupController.update_smtp_setup_data);
router.post('/update-smtp-status', SmtpsetupController.update_smtp_setup_status);
router.post('/delete-smtp-access', SmtpsetupController.delete_smtp_setup);

router.post('/get-payment-history', CouponController.get_payment_history);

router.post('/get-company-credit-usage-list', CompanyController.get_company_credit_usage_list);
router.post('/get-company-credit-usage-details-list', CompanyController.get_company_credit_usage_details_list);
router.post('/get-company-ledgers-list', CompanyController.get_company_ledgers_list);
router.post('/get-company-ledgers-details-list', CompanyController.get_company_ledgers_details_list);
router.post('/get-company-sales-ledgers-list', CompanyController.get_company_sales_ledgers_list);
router.post('/change-company-plan', CompanyController.change_company_plan);

router.post('/add-tds-template-data',  TDSTemplateController.add_data);
router.post('/get-tds-data',  TDSTemplateController.get_tds);
router.post('/get-tds-list', TDSTemplateController.get_tds_list);

//dashboard data
router.post('/admin-dashboard-total-data', DashboardController.get_admin_dashboard_total_data);
router.post('/admin-dashboard-graph-data', DashboardController.get_admin_dashboard_graph_data);
router.post('/admin-dashboard-promo-data', DashboardController.promo_redemption_graph_data);
router.post('/admin-dashboard-ctc-data', DashboardController.admin_dashboard_ctc_data);
router.post('/admin-dashboard-top-credit-users', DashboardController.top_credit_usage_users);
router.post('/admin-dashboard-plans-data', DashboardController.purchased_plans_graph_data);

module.exports = router;