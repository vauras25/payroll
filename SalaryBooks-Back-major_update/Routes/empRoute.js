let express = require('express');
var middleware = require('../Middleware/middleware');
let router = express.Router();
var AccountController = require('../Controller/Employee/AccountController');
var AttendanceController = require('../Controller/Employee/AttendanceController');
var AdvanceController = require('../Controller/Employee/AdvanceController');
var AccidentController = require('../Controller/Employee/AccidentController');
var DeclarationController = require('../Controller/Employee/DeclarationController');
var Ptax_ruleController = require('../Controller/Admin/ComRules/Ptax_ruleController');
var DocumentController = require('../Controller/Employee/DocumentController');
var ExtraEarningController = require('../Controller/Employee/ExtraEarningController');
const AppraisalController = require('../Controller/Company/AppraisalController');
const DashboardController = require('../Controller/Employee/DashboardController');

router.post('/get-account',  AccountController.get_account_details);
router.post('/update-personal-details',  AccountController.update_personal_details);
router.post('/update-employee-address',  AccountController.update_employee_address);
router.post('/update-employee-bank-details',  AccountController.update_employee_bank_details);
router.post('/update-employee-pf-esic-details',  AccountController.update_employee_pf_esic_details);
router.post('/update-employee-password',  AccountController.update_employee_account_password);
router.post('/employee-update-education',  AccountController.update_education_employee);
//Employee training part
router.post('/update-employee-training', AccountController.update_employee_training_details);
//Employee extra curricular
router.post('/update-employee-extra-curricular', AccountController.update_employee_extra_curricular);

// attendance part
router.post('/employee-get-attendance',  AttendanceController.get_attendance);
router.post('/employee-attendance-details',  AttendanceController.attendance_details);
router.post('/employee-leave-type-list',  AttendanceController.employee_leave_type);
router.post('/employee-apply-leave',  AttendanceController.employee_apply_leave);
router.post('/employee-leave-list',  AttendanceController.employee_leave_list);


//employee advance part 
router.post('/employee-advance-request',  AdvanceController.employee_advance);
router.post('/employee-advance-request-update',  AdvanceController.update_advance_data);
router.post('/employee-get-advance-list',  AdvanceController.get_advance_data);

// employee accident details
router.post('/update-employee-accident-details',  AccidentController.update_employee_accident_details);

// employee declaration
router.post('/employee-declaration-modify',  DeclarationController.employee_declaration_modify);
router.post('/employee-declaration',  DeclarationController.employee_declaration_data);

// view area leave part
router.post('/employee-view-leave-status-list',  AttendanceController.employee_view_leave_status_list);
router.post('/employee-view-leave-status-list-details',  AttendanceController.employee_view_leave_status_list_details);

//document Part 
router.post('/employee-file-document-list',  DocumentController.document_list);
router.post('/employee-file-document-list-details',  DocumentController.document_details_list);

//extra earning empployee part
router.post('/get-extra-earning',  ExtraEarningController.get_extra_earning_emp);
router.post('/add-extra-earning-data', ExtraEarningController.add_extra_earning);
// router.post('/update-extra-earning-data', ExtraEarningController.update_extra_earning_data);
router.post('/get-extra-earning-head', ExtraEarningController.get_extra_earning_head);


router.post('/get_state_list', Ptax_ruleController.get_states);
// router.post('/get_ptax_rule',middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.gov_ptax_rule" :{ $in :['view']}}]), Ptax_ruleController.get_ptax_rule);
// router.post('/create_ptax_rule',middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.gov_ptax_rule" :{ $in :['add']}}]), Ptax_ruleController.add_ptax_rule);
// router.post('/update_ptax_rule',middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.gov_ptax_rule" :{ $in :['edit']}}]), Ptax_ruleController.update_ptax_rule);
// router.post('/delete_ptax_rule',middleware.checkComPermission({"gov_ptax_rule.rule_type" :'customizable'}),middleware.checkStaffPermission([{"modules.gov_ptax_rule" :{ $in :['delete']}}]), Ptax_ruleController.delete_ptax_rule);
// router.post('/get_ptax_rule_library',middleware.checkComPermission({"gov_ptax_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.gov_ptax_rule" :{ $in :['view']}}]), Ptax_ruleController.get_ptax_rule_library);
// router.post('/update_ptax_rule_active_status',middleware.checkComPermission({"gov_ptax_rule.rule_apply" :'yes'}),middleware.checkStaffPermission([{"modules.gov_ptax_rule" :{ $in :['view']}}]), Ptax_ruleController.update_active_status);

//Appraisal Routes
router.post('/get_employee_appraisal', AppraisalController.get_employee_appraisal);
router.post('/add_employee_appraisal', AppraisalController.add_employee_appraisal);

//upload profile pics 
router.post('/update-profile-pic', AccountController.update_profile_pic);

//dashboard data
router.post('/employee-dashboard-leave-data', DashboardController.get_employee_dashboard_leave_data);
router.post('/employee-dashboard-attendance-data', DashboardController.get_employee_dashboard_attendance_data);
router.post('/employee-attendance-data', DashboardController.get_employee_attendance_data);

//get payslip data
router.post('/get-generated-payslip-data', AccountController.get_generated_payslip_data);
router.post('/download-payslip-data', AccountController.download_payslip_data);

router.post('/check-in-check-out', AccountController.checkInCheckOut);
router.post('/employee-attendance-log-status', AccountController.attendance_log_details);

module.exports = router;
