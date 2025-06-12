let express = require('express');
var middleware = require('../Middleware/middleware');
let router = express.Router();
var AccountController = require('../Controller/SubAdmin/AccountController');
var roleController = require('../Controller/Admin/RoleController');
var userController = require('../Controller/Admin/UserController');
var PackageController = require('../Controller/Admin/PackageController');
var PlanController = require('../Controller/Admin/PlanController');
var CompanyController = require('../Controller/Admin/CompanyController');
var CreditManagementController = require('../Controller/Admin/CreditManagementController');


 router.post('/get-account',  AccountController.get_account_details);
router.post('/update-account', userController.update_account_data);
router.post('/update-account-password', userController.update_account_password);
// //router.post('/get-client', middleware.checkPermission(['client'],'view'), AccountController.get_client_data);

router.post('/get_permission_module',middleware.checkPermission([{"modules.role" :{ $in :['view']}}]), roleController.get_permission_module_list);
router.post('/role-list', middleware.checkPermission([{"modules.role" :{ $in :['view']}}]), roleController.get_role_list);
router.post('/create_role', middleware.checkPermission([{"modules.role" :{ $in :['add']}}]), roleController.add_role);
router.post('/view_role', middleware.checkPermission([{"modules.role" :{ $in :['view']}}]), roleController.role_details);
router.post('/update_role', middleware.checkPermission([{"modules.role" :{ $in :['edit']}}]), roleController.update_role_data);
router.post('/update_role_status', middleware.checkPermission([{"modules.role" :{ $in :['edit']}}]), roleController.update_role_status);

router.post('/get-masters-data', middleware.checkPermission([{"modules.sub_admin" :{ $in :['view']}}]), userController.get_masters_data);
router.post('/create_subadmin', middleware.checkPermission([{"modules.sub_admin" :{ $in :['add']}}]), userController.add_subadmin_data);
router.post('/get_subadmin', middleware.checkPermission([{"modules.sub_admin" :{ $in :['view']}}]), userController.get_subadmin_list);
router.post('/update_subadmin', middleware.checkPermission([{"modules.sub_admin" :{ $in :['edit']}}]), userController.update_subadmin_data);
router.post('/update_subadmin_password', middleware.checkPermission([{"modules.sub_admin" :{ $in :['edit']}}]), userController.update_subadmin_password);
router.post('/delete_subadmin', middleware.checkPermission([{"modules.sub_admin" :{ $in :['delete']}}]), userController.delete_user_data);

 router.post('/get_permission_list', middleware.checkPermission([{"modules.client_package_master" :{ $in :['view']}}]), PackageController.get_permission_list);
 router.post('/add_packege', middleware.checkPermission([{"modules.client_package_master" :{ $in :['add']}}]), PackageController.add_packege);
 router.post('/get_package_list', middleware.checkPermission([{"modules.client_package_master" :{ $in :['view']}}]), PackageController.get_package_list);
 router.post('/update_package_data', middleware.checkPermission([{"modules.client_package_master" :{ $in :['edit']}}]), PackageController.update_package_data);
 router.post('/delete_package_data', middleware.checkPermission([{"modules.client_package_master" :{ $in :['delete']}}]), PackageController.delete_package_data);

router.post('/add_plan', middleware.checkPermission([{"modules.plan_manager" :{ $in :['add']}}]), PlanController.add_plan);
router.post('/get_plan_list', middleware.checkPermission([{"modules.plan_manager" :{ $in :['view']}}]), PlanController.get_plan_list);
router.post('/update_plan_data', middleware.checkPermission([{"modules.plan_manager" :{ $in :['edit']}}]), PlanController.update_plan_data);
router.post('/delete_plan_data', middleware.checkPermission([{"modules.plan_manager" :{ $in :['delete']}}]), PlanController.delete_plan_data);

router.post('/get_package_plans', middleware.checkPermission([{"modules.user_manager" :{ $in :['view']}},{"modules.plan_manager" :{ $in :['view']}}]), CompanyController.get_package_plans);
router.post('/add_company_data', middleware.checkPermission([{"modules.user_manager" :{ $in :['add']}}]), CompanyController.add_company_data);
router.post('/get_company_list', middleware.checkPermission([{"modules.user_manager" :{ $in :['view']}}]), CompanyController.get_company_list);
router.post('/get_company_details', middleware.checkPermission([{"modules.user_manager" :{ $in :['view']}}]), CompanyController.get_company_details);
router.post('/update_company_credit',middleware.checkPermission([{"modules.user_credit_manager" :{ $in :['edit']}}]), CompanyController.update_credit_value);
router.post('/update_suspend_status',middleware.checkPermission([{"modules.user_suspend_manager" :{ $in :['edit']}}]), CompanyController.update_suspend_status);
router.post('/update_company_hold_credit',middleware.checkPermission([{"modules.user_credit_manager" :{ $in :['edit']}}]), CompanyController.update_company_hold_credit);

router.post('/update_credit_value',middleware.checkPermission([{"modules.credits_manager" :{ $in :['view']}}]), CreditManagementController.update_credit_value);
router.post('/get_credit_value', middleware.checkPermission([{"modules.credits_manager" :{ $in :['add']}}]), CreditManagementController.get_settings_value);
module.exports = router;