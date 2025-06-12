const http = require("http");
var express = require('express')
const mongoose = require('mongoose');
var User = require('./Model/Admin/User');
var Staff = require('./Model/Company/Staff');
const Razorpay = require('razorpay');
var multer = require('multer');
require('dotenv').config();



//const hostname = process.env.HOSTNAME;
const port = process.env.PORT;
const basepath = process.env.BASEPATH;

var storage =   multer.diskStorage({
  destination: function (req, file, cb) {

    if(file.fieldname==="profile_pic")
    {
      cb(null, './storage/admin/profile/')
    }
    else if(file.fieldname==="company_logo")
    {
      cb(null, './storage/admin/company_logo/')
    }
    else if(file.fieldname==="company_reg_certificate")
    {
      cb(null, './storage/company/company_reg_certificate/')
    }
    else if(file.fieldname==="pf_certificate")
    {
      cb(null, './storage/company/pf_certificate/')
    }
    else if(file.fieldname==="esic_certificate")
    {
      cb(null, './storage/company/esic_certificate/')
    }
    else if(file.fieldname==="registration_no_enrolment_certificate")
    {
      cb(null, './storage/company/registration_no_enrolment_certificate/')
    }
    else if(file.fieldname==="registration_no_rgistration_certificate")
    {
      cb(null, './storage/company/registration_no_rgistration_certificate/')
    }
    else if(file.fieldname==="gst_doc")
    {
      cb(null, './storage/company/gst_doc/')
    }
    else if(file.fieldname==="trade_Licence_doc")
    {
      cb(null, './storage/company/trade_Licence_doc/')
    }
    else if(file.fieldname==="pan_numberc_doc")
    {
      cb(null, './storage/company/pan_numberc_doc/')
    }
    else if(file.fieldname==="tan_number_doc")
    {
      cb(null, './storage/company/tan_number_doc/')
    }
    else if(file.fieldname==="branch_EPFO_number_doc")
    {
      cb(null, './storage/company/branch_EPFO_number_doc/')
    }
    else if(file.fieldname==="branch_ESIC_number_doc")
    {
      cb(null, './storage/company/branch_ESIC_number_doc/')
    }
    else if(file.fieldname==="branch_P_Tax_number_doc")
    {
      cb(null, './storage/company/branch_P_Tax_number_doc/')
    }
    else if(file.fieldname==="ptax_enrolment_certificate")
    {
      cb(null, './storage/company/ptax_enrolment_certificate/')
    }
    else if(file.fieldname==="ptax_rgistration_certificate")
    {
      cb(null, './storage/company/ptax_rgistration_certificate/')
    }
    else if(file.fieldname==="partners_aadhaar_no")
    {
      cb(null, './storage/company/partners_aadhaar_no/')
    }
    else if(file.fieldname==="partners_pan_doc")
    {
      cb(null, './storage/company/partners_pan_doc/')
    }
    else if(file.fieldname==="emp_pan_image")
    {
      cb(null, './storage/company/employee/emp_pan_image/')
    }

    else if(file.fieldname==="emp_aadhaar_image")
    {
      cb(null, './storage/company/employee/emp_aadhaar_image/')
    }
    else if(file.fieldname==="additional_id_image")
    {
      cb(null, './storage/company/employee/additional_id_image/')
    }
    else if(file.fieldname==="emp_aadhaar_enrolment_image")
    {
      cb(null, './storage/company/employee/emp_aadhaar_enrolment_image/')
    }
    else if(file.fieldname==="emp_address_proof")
    {
      cb(null, './storage/company/employee/emp_address_proof/')
    }
    else if(file.fieldname==="passbook_image")
    {
      cb(null, './storage/company/employee/passbook_image/')
    }
    else if(file.fieldname==="cancel_cheque")
    {
      cb(null, './storage/company/employee/cancel_cheque/')
    }
    else if(file.fieldname==="family_mem_aadhar_image")
    {
      cb(null, './storage/company/employee/family_mem_aadhar_image/')
    }
    else if(file.fieldname==="training_file_image")
    {
      cb(null, './storage/company/employee/training_file_image/')
    }
    else if(file.fieldname==="disciplinary_file_image")
    {
      cb(null, './storage/company/employee/disciplinary_file_image/')
    }
    else if(file.fieldname==="contract_file_image")
    {
      cb(null, './storage/company/employee/contract_file_image/')
    }
    else if(file.fieldname==="accident_file_image")
    {
      cb(null, './storage/company/employee/accident_file_image/')
    }
    else if(file.fieldname==="emp_other_det_file_image")
    {
      cb(null, './storage/company/employee/emp_other_det_file_image/')
    }
    else if(file.fieldname==="education_file_image")
    {
      cb(null, './storage/company/employee/education_file_image/')
    }
    else if(file.fieldname==="bonus_temp_company_logo")
    {
      cb(null, './storage/company/bonus_temp_company_logo/')
    }
    else if(file.fieldname==="arrear_slip_temp_company_logo")
    {
      cb(null, './storage/company/arrear_slip_temp_company_logo/')
    }
    else if(file.fieldname==="payslip_temp_company_logo")
    {
      cb(null, './storage/company/payslip_temp_company_logo/')
    }
    else if(file.fieldname==="com_logo")
    {
      cb(null, './storage/company/com_logo/')
    }
    else if(file.fieldname==="expense_docu")
    {
      cb(null, './storage/company/expense_docu/')
    }
    else if(file.fieldname==="credit_inv_logo")
    {
      cb(null, './storage/company/credit_inv_logo/')
    }
    else if(file.fieldname==="challan_details_file")
    {
      cb(null, './storage/company/challan_details_file/')
    }
    else if(file.fieldname==="ecr_details_file")
    {
      cb(null, './storage/company/ecr_details_file/')
    }
    else if(file.fieldname==="payment_confirm_file")
    {
      cb(null, './storage/company/payment_confirm_file/')
    }
    else if(file.fieldname==="esic_challan_details_file")
    {
      cb(null, './storage/company/esic_challan_details_file/')
    }
    else if(file.fieldname==="page_img" || file.fieldname==="post_img")
    {
      cb(null, './storage/company/landing_page')
    }
    else if(file.fieldname.includes("eighty_c_investments_documents"))
    {
      cb(null, './storage/company/employee/declaration/eighty_c_investments_documents');
    }
    else if(file.fieldname.includes("eighty_d_investments_documents"))
    {
      cb(null, './storage/company/employee/declaration/eighty_d_investments_documents');
    }
    else if(file.fieldname.includes("other_investments_documents"))
    {
      cb(null, './storage/company/employee/declaration/other_investments_documents');
    }
    else if(file.fieldname.includes("rantal_house_documents"))
    {
      cb(null, './storage/company/employee/declaration/rantal_house_documents');
    }
    else if(file.fieldname.includes("extra_earnings_document"))
    {
      cb(null, './storage/company/employee/extra_earnings_file_image');
    }
    else if(file.fieldname.includes("investments_document"))
    {
      cb(null, './storage/company/employee/declaration');
    }
    else if(file.fieldname==="employee_profile_pic")
    {
      cb(null, './storage/company/employee/profile/')
    }
    else if(file.fieldname==="profile_image")
    {
      cb(null, './storage/company/employee/profile/')
    }
    else if(file.fieldname.includes("declaration_document"))
    {
      cb(null, './storage/company/employee/declaration/');
    }
    else if(file.fieldname.includes("declaration_sub_document"))
    {
      cb(null, './storage/company/employee/declaration/');
    }
    else if(file.fieldname.includes("other_income_document"))
    {
      cb(null, './storage/company/employee/declaration/other_income_document');
    }
    else
    {
      cb(null, './storage/admin/others/')
    }
  },
  filename: function (req, file, callback) {
    //console.log(req.body);
    if(file.fieldname === 'attendance_date')
    {
      callback(null, file.originalname);
    }
    callback(null, file.fieldname + '-' + Date.now()+'.png');
  }
});



var upload = multer({ storage: storage});
//var bodyFormData = multer();
var cors = require('cors')
const bodyParser = require('body-parser');

var db = require('./db');
var cron_helper = require('./Helpers/Cron_helper');
var AuthController = require('./Controller/AuthController');
var EmployeeLeaveController = require('./Controller/Company/EmployeeLeaveController');
var DeclarationController = require('./Controller/Employee/DeclarationController');
var CompanyController = require('./Controller/Admin/CompanyController');
var middleware = require('./Middleware/middleware');
const { monthly_credit_usage_cron_job } = require("./Controller/Company/Company_infoController");

var app = express()
//app.use(bodyParser);
app.use(cors());
app.use(upload.any());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
// app.use(express.urlencoded({extended: true})); 
// app.use(express.json());
//app.use(bodyFormData.any()); 
app.use(express.static('public'));
app.use(basepath+'/storage', express.static(__dirname + '/storage'));



global.instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
global.file_path=__dirname;
global.perpage=20;

global.baseurl=process.env.BACKEND_BASE_URL;
global.baseUrlFrontend=process.env.FRONTEND_BASE_URL;
global.global_tax_cgst = 50;
global.global_tax_sgst = 50;

app.post(basepath+'/admin_signin', AuthController.admin_signin);
app.post(basepath+'/sub_admin_signin', AuthController.sub_admin_signin);
app.post(basepath+'/company_signin', AuthController.company_signin);
app.post(basepath+'/staff_signin', AuthController.staff_signin);
app.post(basepath+'/employee_signin', AuthController.employee_signin);
app.post(basepath+'/findCompanyByCorporateId', AuthController.findCompanyByCorporateId);
app.post(basepath+'/get-tds-act', DeclarationController.get_tds_act_data);

app.post(basepath+'/admin_token_check', AuthController.admin_token_check);
app.use(basepath+'/admin', middleware.checkAuth,middleware.authUserType(['super_admin']), require('./Routes/admin'));
app.use(basepath+'/sub-admin', middleware.checkAuth,middleware.authUserType(['sub_admin']), require('./Routes/admin'));
//app.use(basepath+'/sub-admin', middleware.checkAuth,middleware.authUserType(['sub_admin']), require('./Routes/subadmin'));
app.use(basepath+'/company', middleware.checkAuth,middleware.authUserType(['company','staff']),require('./Routes/company'));
app.use(basepath+'/staff', middleware.checkAuth,middleware.authUserType(['staff']), require('./Routes/staff'));
app.use(basepath+'/employee', middleware.checkAuth,middleware.authUserType(['employee']), require('./Routes/empRoute'));
app.use(basepath+'/public', require('./Routes/Public'));
app.use(basepath+'/landing-page', require("./Routes/LandingPage"));

// Leave Ledgerl table data store in year ending time through cron job 
app.use(basepath+'/leave-ledgerl-data-store',  EmployeeLeaveController.cron_job_leave_ledgerl_data_store);

app.use(basepath+'/employee-earning-leave-data-store',  EmployeeLeaveController.cron_job_earning_leave_data_store);
app.use(basepath+'/company-monthly-credit-usage',  monthly_credit_usage_cron_job);

app.get(basepath+'/', function (req, res) {
    res.send(`
      <h3 style=\"text-align: center; padding: 10% 0; text-transform: uppercase;\">
          !! this is a secure connection hence cannot be accessed !!
      </h3>`)
    
})
// app.get(basepath + '/test', async function (req, res) {
//   try {
//       // Fetch all users from the User collection
//       const users = await User.find({});
      
//       // Send the users as a JSON response
//       res.status(200).json({
//           status: 'success',
//           data: users
//       });
//   } catch (error) {
//       // Handle any errors that occur during the fetch operation
//       res.status(500).json({
//           status: 'error',
//           message: 'Failed to fetch users',
//           error: error.message
//       });
//   }
// });


app.get(basepath+'*', function(req, res){
  res.status(404).send({ status: 'error', message: 'Page Not Found' });
});
app.post(basepath+'*', function(req, res){
  res.status(404).send({ status: 'error', message: 'Page Not Found' });
});
//listen for request on port 3000, and as a callback function have the port listened on logged
app.listen(port, () => {
  console.log(`Server running at ${port}`);
});