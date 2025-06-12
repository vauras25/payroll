let express = require("express");
var middleware = require("../Middleware/middleware");
const EmployeeController = require("../Controller/Company/EmployeeController");
const Ptax_ruleController = require("../Controller/Admin/ComRules/Ptax_ruleController");
let router = express.Router();

router.post("/check_invitation_link", EmployeeController.employee_invitation_link_validation);
router.post("/create-employee", EmployeeController.add_employee_data);
router.post("/update-employee", EmployeeController.update_employee_details);
router.post('/update-employee-address', EmployeeController.update_employee_address);
router.post('/update-employee-pf-esic', EmployeeController.update_pf_esic_details);
router.post('/update-employee-bank', EmployeeController.update_bank_details);
router.post('/update-employee-education', EmployeeController.update_employee_education);
router.post('/update-employee-accident-details', EmployeeController.update_employee_accident_details);
router.post('/update-employee-training', EmployeeController.update_employee_training_details);
router.post('/update-employee-extra-curricular', EmployeeController.update_employee_extra_curricular);

router.post('/get_state_list', Ptax_ruleController.get_states);
router.post('/get-employee-details', EmployeeController.get_employee_details);


module.exports = router;
