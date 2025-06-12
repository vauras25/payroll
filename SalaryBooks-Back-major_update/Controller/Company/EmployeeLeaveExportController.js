var Company = require('../../Model/Admin/Company');
var Employee = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
var LeaveLog = require("../../Model/Company/LeaveLog");
var Staff = require("../../Model/Company/Staff");
var LeaveLedgerl = require("../../Model/Company/LeaveLedgerl");
var EarningLeaveLog = require("../../Model/Company/EarningLeaveLog");
var EmployeeAttendance = require("../../Model/Company/EmployeeAttendance");
var EmployeeLeave = require("../../Model/Company/EmployeeLeave");
var EmployeeModel = require("../../Model/Company/employee");
var LeaveTempHead = require('../../Model/Admin/LeaveTempHead');
var EmployeeMonthlyReport = require('../../Model/Company/EmployeeMonthlyReport');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
const moment = require('moment');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const bcrypt = require("bcrypt");
const Site_helper = require('../../Helpers/Site_helper');
module.exports = {
    leave_ledgerl_report_export: async function(req, resp, next){
        try {
            const v = new Validator(req.body, {
                pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                .status(403)
                .send({
                    status: "val_err",
                    message: "Validation error",
                    val_msg: v.errors,
                });
            } 
            else {
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
                var sortbyfield = req.body.sortbyfield;
                
                var sortbyfield = req.body.sortbyfield;
                if (sortbyfield) {
                    var sortoption = {};
                    sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
                } else {
                    var sortoption = { created_at: -1 };
                }
                const options = {
                    page: req.body.pageno ? req.body.pageno : 1,
                    limit: req.body.perpage ? req.body.perpage : perpage,
                    sort: sortoption,
                };
                var filter_option = {};

                var search_option = {
                    $match: {
                        $and: [
                        { corporate_id: req.authData.corporate_id },
                        { parent_hods: { $in: [req.authId] } },
                        ],
                    },
                };

                var search_option_details = { $match: {} };
                if (req.body.emp_status) {
                    if(req.body.emp_status != 'all')
                    {
                        search_option.$match.status = { $eq: req.body.emp_status };
                    }        
                }
                if (req.body.searchkey) {
                    search_option = {
                        $match: {
                            $text: { $search: req.body.searchkey },
                            corporate_id: req.authData.corporate_id,
                            parent_hods: { $in: [req.authId] } ,
                        },
                    };
                } else {
                    if (req.body.emp_first_name) {
                        search_option.$match.emp_first_name = {
                            $regex: req.body.emp_first_name,
                            $options: "i",
                        };
                    }
                    if (req.body.emp_last_name) {
                        search_option.$match.emp_last_name = {
                            $regex: req.body.emp_last_name,
                            $options: "i",
                        };
                    }
                    if (req.body.email_id) {
                        search_option.$match.email_id = {
                            $regex: req.body.email_id,
                            $options: "i",
                        };
                    }
                    if (req.body.pan_no) {
                        search_option.$match.pan_no = {
                            $regex: req.body.pan_no,
                            $options: "i",
                        };
                    }
                    if (req.body.designation_id) {
                        var designation_ids = JSON.parse(req.body.designation_id);
                        designation_ids = designation_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                        "employee_details.employment_hr_details.designation"
                        ] = { $in: designation_ids };
                    }
                    if (req.body.department_id) {
                        var department_ids = JSON.parse(req.body.department_id);
                        department_ids = department_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                        "employee_details.employment_hr_details.department"
                        ] = { $in: department_ids };
                    }
                    if (req.body.branch_id) {
                        var branch_ids = JSON.parse(req.body.branch_id);
                        branch_ids = branch_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                        "employee_details.employment_hr_details.branch"
                        ] = { $in: branch_ids };
                    }
                    if (req.body.client_id) {
                        var client_ids = JSON.parse(req.body.client_id);
                        client_ids = client_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match.client_id = { $in: client_ids };
                    }
                    if (req.body.hod_id) {
                        var hod_ids = JSON.parse(req.body.hod_id);
                        hod_ids = hod_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match.emp_hod = { $in: hod_ids };
                    }
                }
                if (req.body.row_checked_all === "true") {
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                } else {
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $in: ids };
                    }
                }
                var companyDetails = await Company.findOne({_id:req.authId});
                var myAggregate = Employee.aggregate([search_option,
                {
                    $lookup: {
                        from: "clients",
                        localField: "client_code",
                        foreignField: "_id",
                        as: "client",
                    },
                },
                {
                    $lookup: {
                        from: "staffs",
                        localField: "emp_hod",
                        foreignField: "_id",
                        as: "hod",
                    },
                },
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "leave_added",
                    },
                },
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "availed",
                    },
                },
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "employee_details",
                    },
                },
                {
                    $match: {
                        'employee_details.leave_balance_counter': {$ne:null}
                    }
                },
                {
                    $lookup:{
                        from: 'employee_leave_summary_logs',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": { 
                                $and :[
                                {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
                                {
                                    $or:[ 
                                    {'wage_year': {$gt: parseInt(start_year) }}, 
                                    { 
                                        $and:[
                                        {'wage_year': {$gte: parseInt(start_year) }},
                                        {'wage_month': {$gte: parseInt(start_month) }}
                                        ]
                                    }]
                                },
                                { 
                                    $or:[ 
                                    {'wage_year': {$lt: parseInt(end_year) }}, 
                                    { 
                                        $and:[
                                        {'wage_year': {$lte: parseInt(end_year) }},
                                        {'wage_month': {$lte: parseInt(end_month) }}
                                        ]
                                    }]
                                }
                                ] 
                            } 
                        }
                        ],
                        as: 'employee_leave_summary_logs',
                    }
                },
                search_option_details,
                {
                    $lookup: {
                        from: "branches",
                        localField: "employee_details.employment_hr_details.branch",
                        foreignField: "_id",
                        as: "branch",
                    },
                },
                {
                    $lookup: {
                        from: "designations",
                        localField: "employee_details.employment_hr_details.designation",
                        foreignField: "_id",
                        as: "designation",
                    },
                },
                {
                    $lookup: {
                        from: "departments",
                        localField: "employee_details.employment_hr_details.department",
                        foreignField: "_id",
                        as: "department",
                    },
                },
                {
                    $lookup: {
                        from: "employee_leaves",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "employee_leaves",
                    },
                },
                {
                    $addFields: {
                        hod: {
                            $arrayElemAt: ["$hod", 0],
                        },
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        client: {
                            $arrayElemAt: ["$client", 0],
                        },
                    },
                },
                {
                    $addFields: {
                        leave_added: {
                            $arrayElemAt: ["$leave_added", 0],
                        },
                    }
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        userid: 1,
                        emp_id: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        emp_father_name: 1,
                        emp_dob: 1,
                        pan_no: 1,
                        aadhar_no: 1,
                        email_id: 1,
                        client_code: 1,
                        "client._id": 1,
                        "client.client_code": 1,
                        created_at: 1,
                        phone_no: 1,
                        "hod.first_name": 1,
                        "hod.last_name": 1,
                        "branch._id": 1,
                        "branch.branch_name": 1,
                        "department._id": 1,
                        "department.department_name": 1,
                        "designation._id": 1,
                        "designation.designation_name": 1,
                        "employee_leave_summary_logs":"$employee_leave_summary_logs",
                    },
                }
                ]).then(async (employeeies) => {
                    var companyLeaveHead = await LeaveTempHead.find({corporate_id:req.authData.corporate_id});
                    var field_list_array=["emp_code","name","department","designation","branch","client_id","hod"];
                    if(companyLeaveHead){
                        if(companyLeaveHead.length > 0){
                            companyLeaveHead.map(function (companyLeavetempHead){
                                field_list_array.push(companyLeavetempHead.abbreviation+"_opening_balance");
                                field_list_array.push(companyLeavetempHead.abbreviation+"_leave_added");
                                field_list_array.push(companyLeavetempHead.abbreviation+"_availed");
                                field_list_array.push(companyLeavetempHead.abbreviation+"_lapsed");
                                field_list_array.push(companyLeavetempHead.abbreviation+"_encashed");
                                field_list_array.push(companyLeavetempHead.abbreviation+"_closing_balance");
                                field_list_array.push(companyLeavetempHead.abbreviation+"_carry_forward");
                            })
                        }
                    }
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    var clmn_id = 1;
                    ws.cell(1, clmn_id).string("SL");
                    if(field_list_array.includes('emp_code'))
                    {
                        ws.cell(1, clmn_id++).string("Employee Id");
                    }
                    if(field_list_array.includes('name'))
                    {
                        ws.cell(1, clmn_id++).string("Name");
                    }
                    if(field_list_array.includes('department'))
                    {
                        ws.cell(1, clmn_id++).string("Department");
                    }
                    if(field_list_array.includes('designation'))
                    {
                        ws.cell(1, clmn_id++).string("Designation");
                    }
                    if(field_list_array.includes('branch'))
                    {
                        ws.cell(1, clmn_id++).string("Branch");
                    }
                    if(field_list_array.includes('client_id'))
                    {
                        ws.cell(1, clmn_id++).string("Clinet ID");
                    }
                    if(field_list_array.includes('hod'))
                    {
                        ws.cell(1, clmn_id++).string("HOD");
                    }

                    if(companyLeaveHead){
                        if(companyLeaveHead.length > 0){
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_opening_balance"))
                                {
                                    ws.cell(1, clmn_id++).string(companyLeavetempHeads.abbreviation+" (Opening Balance)");
                                }
                            })
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_leave_added"))
                                {
                                    ws.cell(1, clmn_id++).string(companyLeavetempHeads.abbreviation+" (Leave Added)");
                                }
                            })
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_availed"))
                                {
                                    ws.cell(1, clmn_id++).string(companyLeavetempHeads.abbreviation+" (Availed)");
                                }
                            })
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_lapsed"))
                                {
                                    ws.cell(1, clmn_id++).string(companyLeavetempHeads.abbreviation+" (Lapsed)");
                                }
                            })
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_encashed"))
                                {
                                    ws.cell(1, clmn_id++).string(companyLeavetempHeads.abbreviation+" (Encashed)");
                                }
                            })
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_closing_balance"))
                                {
                                    ws.cell(1, clmn_id++).string(companyLeavetempHeads.abbreviation+" (Closing Balance)");
                                }
                            })
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_carry_forward"))
                                {
                                    ws.cell(1, clmn_id++).string(companyLeavetempHeads.abbreviation+" (Carry Forward)");
                                }
                            })
                        }
                    }

                    await Promise.all(employeeies.map(async function (employee, index) {
                        var index_val = 2;
                        index_val = index_val + index;
                        var clmn_emp_id=1
                        ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                        if(field_list_array.includes('emp_code'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(
                                employee.emp_id ? String(employee.emp_id) : ""
                                );
                        }
                        if(field_list_array.includes('name'))
                        {
                            ws.cell(index_val,clmn_emp_id++).string(
                                employee.emp_first_name ? String(employee.emp_first_name +" "+ employee.emp_last_name) : ""
                                );
                        }
                        if(field_list_array.includes('department'))
                        {
                            if(employee.department.length > 0){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.department ? String(employee.department[0].department_name) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('designation'))
                        {
                            if(employee.designation.length > 0){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.designation ? String(employee.designation[0].designation_name) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('branch'))
                        {
                            if(employee.branch.length > 0){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.branch ? String(employee.branch[0].branch_name) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('client_id'))
                        {
                            if(employee.client.length > 0){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.client ? String(employee.client[0].client_code) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('hod'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(
                                employee.hod ? String(employee.hod.first_name+" "+employee.hod.last_name) : ""
                                );
                        }
                        if(employee.employee_leave_summary_logs){
                            if(employee.employee_leave_summary_logs.length > 0){
                                var leave_added = [];
                                var leave_availed = [];
                                var leave_lapsed = [];
                                var leave_encashed = [];
                                var leave_carry_forward = [];

                                employee.employee_leave_summary_logs.map(function (summary_leave) {
                                    if(summary_leave.type === 'opening'){
                                        employee.opening_balance = summary_leave.history;
                                    }
                                    if(summary_leave.type === 'closing'){
                                        employee.closing_balance = summary_leave.history;
                                        employee.availed = summary_leave.history;
                                    }
                                    if(summary_leave.type === 'earning'){
                                        summary_leave.history.map(function(earning){
                                            leave_added.push(earning);
                                        });
                                    }
                                    // if(summary_leave.type === 'availed'){
                                    //     summary_leave.history.map(function(earning){
                                    //         leave_availed.push(earning);
                                    //     });
                                    // }
                                    if(summary_leave.type === 'lapsed'){
                                        summary_leave.history.map(function(earning){
                                            leave_lapsed.push(earning);
                                        });
                                    }
                                    if(summary_leave.type === 'encashed'){
                                        summary_leave.history.map(function(earning){
                                            leave_encashed.push(earning);
                                        });
                                    }
                                    if(summary_leave.type === 'carry_forward'){
                                        summary_leave.history.map(function(earning){
                                            leave_carry_forward.push(earning);
                                        });
                                    }
                                });

                                var holder = {};
                                leave_added.forEach(function(d) {
                                    if (holder.hasOwnProperty(d.abbreviation)) {
                                        holder[d.abbreviation] = holder[d.abbreviation] + d.balance;
                                    } else {
                                        holder[d.abbreviation] = d.balance;
                                    }
                                });

                                var leave_added = [];

                                for (var prop in holder) {
                                    leave_added.push({ abbreviation: prop, balance: holder[prop], head_id: holder[prop] });
                                }
                                employee.leave_added = leave_added;

                                var holder_b = {};
                                leave_lapsed.forEach(function(d) {
                                    if (holder_b.hasOwnProperty(d.abbreviation)) {
                                        holder_b[d.abbreviation] = holder_b[d.abbreviation] + d.balance;
                                    } else {
                                        holder_b[d.abbreviation] = d.balance;
                                    }
                                });

                                var leave_lapsed = [];

                                for (var prop in holder_b) {
                                    leave_lapsed.push({ abbreviation: prop, balance: holder_b[prop], head_id: holder_b[prop] });
                                }
                                employee.lapsed = leave_lapsed;

                                var holder_c = {};
                                leave_encashed.forEach(function(d) {
                                    if (holder_c.hasOwnProperty(d.abbreviation)) {
                                        holder_c[d.abbreviation] = holder_c[d.abbreviation] + d.balance;
                                    } else {
                                        holder_c[d.abbreviation] = d.balance;
                                    }
                                });

                                var leave_encashed = [];

                                for (var prop in holder_c) {
                                    leave_encashed.push({ abbreviation: prop, balance: holder_c[prop], head_id: holder_c[prop] });
                                }
                                employee.encashed = leave_encashed;

                                var holder_d = {};
                                leave_carry_forward.forEach(function(d) {
                                    if (holder_d.hasOwnProperty(d.abbreviation)) {
                                        holder_d[d.abbreviation] = holder_d[d.abbreviation] + d.balance;
                                    } else {
                                        holder_d[d.abbreviation] = d.balance;
                                    }
                                });

                                var leave_carry_forward = [];

                                for (var prop in holder_d) {
                                    leave_carry_forward.push({ abbreviation: prop, balance: holder_d[prop], head_id: holder_d[prop] });
                                }
                                employee.carry_forward = leave_carry_forward;
                            }
                        }
                        if(employee.opening_balance){
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                var headDataExist = employee.opening_balance.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_opening_balance"))
                                {
                                    if(headDataExist){
                                        ws.cell(index_val, clmn_emp_id++).string(String(headDataExist.balance));
                                    }
                                    else{
                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                    }
                                }
                            })
                        }
                        else{
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_opening_balance"))
                                {
                                    ws.cell(index_val, clmn_emp_id++).string(String("0"));
                                }
                            });
                        }
                        if(employee.leave_added){
                            companyLeaveHead.map(function (companyLeavetempHeads){

                                var headDataExist = employee.leave_added.find(element => companyLeavetempHeads.abbreviation == element['abbreviation']);
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_leave_added"))
                                {
                                    if(headDataExist){
                                        ws.cell(index_val, clmn_emp_id++).string(String(headDataExist.balance));
                                    }
                                    else{
                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                    }
                                }
                            })
                        }
                        else{
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_leave_added"))
                                {
                                    ws.cell(index_val, clmn_emp_id++).string("0");
                                }
                            })
                        }
                        if(employee.availed){
                            companyLeaveHead.map(function (companyLeavetempHeads){

                                var headDataExist = employee.availed.find(element => companyLeavetempHeads.abbreviation == element['abbreviation']);
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_availed"))
                                {
                                    if(headDataExist){
                                        ws.cell(index_val, clmn_emp_id++).string(String(headDataExist.balance));
                                    }
                                    else{
                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                    }
                                }
                            })
                        }
                        else{
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_availed"))
                                {
                                    ws.cell(index_val, clmn_emp_id++).string("0");
                                }
                            })
                        }
                        if(employee.lapsed){
                            companyLeaveHead.map(function (companyLeavetempHeads){

                                var headDataExist = employee.leave_added.find(element => companyLeavetempHeads.abbreviation == element['abbreviation']);
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_lapsed"))
                                {
                                    if(headDataExist){
                                        ws.cell(index_val, clmn_emp_id++).string(String(headDataExist.balance));
                                    }
                                    else{
                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                    }
                                }
                            })
                        }
                        else{
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_lapsed"))
                                {
                                    ws.cell(index_val, clmn_emp_id++).string("0");
                                }
                            })
                        }
                        if(employee.encashed){
                            companyLeaveHead.map(function (companyLeavetempHeads){

                                var headDataExist = employee.leave_added.find(element => companyLeavetempHeads.abbreviation == element['abbreviation']);
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_encashed"))
                                {
                                    if(headDataExist){
                                        ws.cell(index_val, clmn_emp_id++).string(String(headDataExist.balance));
                                    }
                                    else{
                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                    }
                                }
                            })
                        }
                        else{
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_encashed"))
                                {
                                    ws.cell(index_val, clmn_emp_id++).string("0");
                                }
                            })
                        }
                        if(employee.closing_balance){
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                var headDataExist = employee.closing_balance.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_closing_balance"))
                                {
                                    if(headDataExist){
                                        ws.cell(index_val, clmn_emp_id++).string(String(headDataExist.balance));
                                    }
                                    else{
                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                    }
                                }
                            })
                        }
                        else{
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_closing_balance"))
                                {
                                    ws.cell(index_val, clmn_emp_id++).string("0");
                                }
                            })
                        }
                        if(employee.carry_forward){
                            companyLeaveHead.map(function (companyLeavetempHeads){

                                var headDataExist = employee.leave_added.find(element => companyLeavetempHeads.abbreviation == element['abbreviation']);
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_carry_forward"))
                                {
                                    if(headDataExist){
                                        ws.cell(index_val, clmn_emp_id++).string(String(headDataExist.balance));
                                    }
                                    else{
                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                    }
                                }
                            })
                        }
                        else{
                            companyLeaveHead.map(function (companyLeavetempHeads){
                                if(field_list_array.includes(companyLeavetempHeads.abbreviation+"_carry_forward"))
                                {
                                    ws.cell(index_val, clmn_emp_id++).string("0");
                                }
                            })
                        }
                    })).then(async (value) => {
                        // wb.write("ledgerl-leave-report.xlsx");
                        // let file_location = Site_helper.createFiles(wb,"ledgerl-leave-report",'xlsx', req.authData.corporate_id);

                        let file_name = "ledgerl-leave-report.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/leave-module');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                        // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                        // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
                    }); 
                }); 
            }
        }
        catch (e) {
            return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong"});
        }
    },
    //report no 52
    earned_leave_report_export: async function(req, resp, next){
        try {
            const v = new Validator(req.body, {
                // pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                .status(403)
                .send({
                    status: "val_err",
                    message: "Validation error",
                    val_msg: v.errors,
                });
            } 
            else {
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
                var sortbyfield = req.body.sortbyfield;
                
                var sortbyfield = req.body.sortbyfield;
                if (sortbyfield) {
                    var sortoption = {};
                    sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
                } else {
                    var sortoption = { created_at: -1 };
                }
                const options = {
                    page: req.body.pageno ? req.body.pageno : 1,
                    limit: req.body.perpage ? req.body.perpage : perpage,
                    sort: sortoption,
                };
                var filter_option = {};

                // var search_option = {
                //     $match: {
                //         $and: [
                //         { corporate_id: req.authData.corporate_id },
                //         { parent_hods: { $in: [req.authId] } },
                //         ],
                //     },
                // };
                var start_date = null;
                var end_date = null;
                if (start_month || start_year) {
                    start_date = new Date(start_year, start_month, 2, -18, -30, 0);
                }
                if (end_month || end_year) {
                    end_date = new Date(end_year, end_month, new Date(end_year, end_month + 1, 0).getDate() + 1, 5, 29, 59);
                }
                if (start_date && end_date) {
                    var search_option = {
                        $match: {
                            $and: [
                                { corporate_id: req.authData.corporate_id },
                                { status: { $in: ["active", "approved"] } },
                                { parent_hods: { $in: [req.authId] } },
                                {
                                    $or: [
                                        { 'leave_logs.year': { $gt: start_year.toString() } },
                                        {
                                            $and: [
                                                { 'leave_logs.year': { $gte: start_year.toString() } },
                                                { 'leave_logs.month': { $gte: start_month.toString() } }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    $or: [
                                        { 'leave_logs.year': { $lt: end_year.toString() } },
                                        {
                                            $and: [
                                                { 'leave_logs.year': { $lte: end_year.toString() } },
                                                { 'leave_logs.month': { $lte: end_month.toString() } }
                                            ]
                                        }
                                    ]
                                }
                                // {$or:[ 
                                //     {'created_at': {$gt: new Date(start_date) }}, 
                                //     { $and:[
                                //         {'created_at': {$gte: new Date(start_date) }}
                                //         ]
                                //     } 
                                //     ]
                                // },
                                // { $or:[ 
                                //     {'created_at': {$lt: new Date(end_date) }}, 
                                //     { $and:[
                                //         {'created_at': {$lte: new Date(start_date) }}
                                //         ]
                                //     } 
                                //     ]
                                // }
                            ],
                        },
                    };
                }
                else if (start_date) {
                    end_date = new Date(start_year, start_month, new Date(start_year, start_month + 1, 0).getDate() + 1, 5, 29, 59);
                    var search_option = {
                        $match: {
                            $and: [
                                { corporate_id: req.authData.corporate_id },
                                { status: { $in: ["active", "approved"] } },
                                { parent_hods: { $in: [req.authId] } },
                                { "leave_logs.month": start_month.toString() },
                                { "leave_logs.year": start_year.toString() },
                            ],
                        },
                    };
                }
                else {
                    var search_option = {
                        $match: {
                            $and: [
                                { corporate_id: req.authData.corporate_id },
                                { status: { $in: ["active", "approved"] } },
                                { parent_hods: { $in: [req.authId] } },
                            ],
                        },
                    };
                }

                var search_option_details = { $match: {} };
                if (req.body.emp_status) {
                    if(req.body.emp_status != 'all')
                    {
                        search_option.$match.status = { $eq: req.body.emp_status };
                    }        
                }
                if (req.body.searchkey) {
                    search_option = {
                        $match: {
                            $text: { $search: req.body.searchkey },
                            corporate_id: req.authData.corporate_id,
                            parent_hods: { $in: [req.authId] } ,
                        },
                    };
                } else {
                    if (req.body.emp_first_name) {
                        search_option.$match.emp_first_name = {
                            $regex: req.body.emp_first_name,
                            $options: "i",
                        }; 
                    }
                    if (req.body.emp_last_name) {
                        search_option.$match.emp_last_name = {
                            $regex: req.body.emp_last_name,
                            $options: "i",
                        };
                    }
                    if (req.body.email_id) {
                        search_option.$match.email_id = {
                            $regex: req.body.email_id,
                            $options: "i",
                        };
                    }
                    if (req.body.pan_no) {
                        search_option.$match.pan_no = {
                            $regex: req.body.pan_no,
                            $options: "i",
                        };
                    }
                    if (req.body.designation_id) {
                        var designation_ids = JSON.parse(req.body.designation_id);
                        designation_ids = designation_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                        "employee_details.employment_hr_details.designation"
                        ] = { $in: designation_ids };
                    }
                    if (req.body.department_id) {
                        var department_ids = JSON.parse(req.body.department_id);
                        department_ids = department_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                        "employee_details.employment_hr_details.department"
                        ] = { $in: department_ids };
                    }
                    if (req.body.branch_id) {
                        var branch_ids = JSON.parse(req.body.branch_id);
                        branch_ids = branch_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                        "employee_details.employment_hr_details.branch"
                        ] = { $in: branch_ids };
                    }
                    if (req.body.client_id) {
                        var client_ids = JSON.parse(req.body.client_id);
                        client_ids = client_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match.client_id = { $in: client_ids };
                    }
                    if (req.body.hod_id) {
                        var hod_ids = JSON.parse(req.body.hod_id);
                        hod_ids = hod_ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match.emp_hod = { $in: hod_ids };
                    }
                }
                if (req.body.row_checked_all === "true") {
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                } else {
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $in: ids };
                    }
                }
                var companyDetails = await Company.findOne({_id:req.authId});
                var myAggregate = Employee.aggregate([
                {
                    $lookup:
                    {
                        from: 'leave_logs',
                        localField: "_id",
                        foreignField: "employee_id",
                        as: 'leave_logs',
                    }
                },
                search_option,
                {
                    $lookup: {
                        from: "clients",
                        localField: "client_code",
                        foreignField: "_id",
                        as: "client",
                    },
                },
                {
                    $lookup: {
                        from: "staffs",
                        localField: "emp_hod",
                        foreignField: "_id",
                        as: "hod",
                    },
                },
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "leave_added",
                    },
                },
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "availed",
                    },
                },
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "employee_details",
                    },
                },
                {
                    $match: {
                        'employee_details.leave_balance_counter': {$ne:null}
                    }
                },
                {
                    $lookup:{
                        from: 'employee_leave_summary_logs',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": { 
                                $and :[
                                {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
                                {
                                    $or:[ 
                                    {'wage_year': {$gt: parseInt(start_year) }}, 
                                    { 
                                        $and:[
                                        {'wage_year': {$gte: parseInt(start_year) }},
                                        {'wage_month': {$gte: parseInt(start_month) }}
                                        ]
                                    }]
                                },
                                { 
                                    $or:[ 
                                    {'wage_year': {$lt: parseInt(end_year) }}, 
                                    { 
                                        $and:[
                                        {'wage_year': {$lte: parseInt(end_year) }},
                                        {'wage_month': {$lte: parseInt(end_month) }}
                                        ]
                                    }]
                                }
                                ] 
                            } 
                        }
                        ],
                        as: 'employee_leave_summary_logs',
                    }
                },
                {
                    $lookup:{
                        from: 'employee_monthly_reports',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": { 
                                $and :[
                                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                {
                                    $or:[ 
                                    {'wage_year': {$gt: parseInt(start_year) }}, 
                                    { 
                                        $and:[
                                        {'wage_year': {$gte: parseInt(start_year) }},
                                        {'wage_month': {$gte: parseInt(start_month) }}
                                        ]
                                    }]
                                },
                                { 
                                    $or:[ 
                                    {'wage_year': {$lt: parseInt(end_year) }}, 
                                    { 
                                        $and:[
                                        {'wage_year': {$lte: parseInt(end_year) }},
                                        {'wage_month': {$lte: parseInt(end_month) }}
                                        ]
                                    }]
                                }
                                ] 
                            } 
                        }
                        ],
                        as: 'employee_monthly_reports',
                    }
                },
                search_option_details,
                {
                    $lookup: {
                        from: "branches",
                        localField: "employee_details.employment_hr_details.branch",
                        foreignField: "_id",
                        as: "branch",
                    },
                },
                {
                    $lookup: {
                        from: "designations",
                        localField: "employee_details.employment_hr_details.designation",
                        foreignField: "_id",
                        as: "designation",
                    },
                },
                {
                    $lookup: {
                        from: "departments",
                        localField: "employee_details.employment_hr_details.department",
                        foreignField: "_id",
                        as: "department",
                    },
                },
                {
                    $lookup: {
                        from: "employee_leaves",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "employee_leaves",
                    },
                },
                {
                    $addFields: {
                        hod: {
                            $arrayElemAt: ["$hod", 0],
                        },
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        client: {
                            $arrayElemAt: ["$client", 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        userid: 1,
                        emp_id: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        emp_father_name: 1,
                        emp_dob: 1,
                        pan_no: 1,
                        aadhar_no: 1,
                        email_id: 1,
                        client_code: 1,
                        "client._id": 1,
                        "client.client_code": 1,
                        created_at: 1,
                        phone_no: 1,
                        "hod.first_name": 1,
                        "hod.last_name": 1,
                        "branch._id": 1,
                        "branch.branch_name": 1,
                        "department._id": 1,
                        "department.department_name": 1,
                        "designation._id": 1,
                        "designation.designation_name": 1,
                        "paydays": {$sum:"$employee_monthly_reports.attendance_summaries.paydays"},
                        "employee_leave_summary_logs":"$employee_leave_summary_logs",
                        "leave_balance_counter":"$employee_details.leave_balance_counter",
                    },
                }
                ]).then(async (employeeies) => {
                    var companyLeaveHead = await LeaveTempHead.find({corporate_id:req.authData.corporate_id});
                    var field_list_array=["emp_code","name","department","designation","branch","client_id","hod",'opening_balance',
                    'pay_days','leave_earned','leave_head','availed','encashed','lapsed','closing_balance','carry_forward'];
                    // if(companyLeaveHead){
                    //     if(companyLeaveHead.length > 0){
                    //         companyLeaveHead.map(function (companyLeavetempHead){
                    //             field_list_array.push(companyLeavetempHead.abbreviation+"_opening_balance");
                    //             field_list_array.push(companyLeavetempHead.abbreviation+"_leave_added");
                    //             field_list_array.push(companyLeavetempHead.abbreviation+"_availed");
                    //             field_list_array.push(companyLeavetempHead.abbreviation+"_lapsed");
                    //             field_list_array.push(companyLeavetempHead.abbreviation+"_encashed");
                    //             field_list_array.push(companyLeavetempHead.abbreviation+"_closing_balance");
                    //             field_list_array.push(companyLeavetempHead.abbreviation+"_carry_forward");
                    //         })
                    //     }
                    // }
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    var clmn_id = 1;
                    ws.cell(1, clmn_id++).string("SL");
                    if(field_list_array.includes('emp_code'))
                    {
                        ws.cell(1, clmn_id++).string("Employee Id");
                    }
                    if(field_list_array.includes('name'))
                    {
                        ws.cell(1, clmn_id++).string("Name");
                    }
                    if(field_list_array.includes('department'))
                    {
                        ws.cell(1, clmn_id++).string("Department");
                    }
                    if(field_list_array.includes('designation'))
                    {
                        ws.cell(1, clmn_id++).string("Designation");
                    }
                    if(field_list_array.includes('branch'))
                    {
                        ws.cell(1, clmn_id++).string("Branch");
                    }
                    if(field_list_array.includes('client_id'))
                    {
                        ws.cell(1, clmn_id++).string("Clinet ID");
                    }
                    if(field_list_array.includes('hod'))
                    {
                        ws.cell(1, clmn_id++).string("HOD");
                    }
                    if(field_list_array.includes('opening_balance'))
                    {
                        ws.cell(1, clmn_id++).string("Opening Balance");
                    }
                    if(field_list_array.includes('pay_days'))
                    {
                        ws.cell(1, clmn_id++).string("Pay Days");
                    }
                    if(field_list_array.includes('leave_earned'))
                    {
                        ws.cell(1, clmn_id++).string("Leave Earned");
                    }
                    if(field_list_array.includes('leave_head'))
                    {
                        ws.cell(1, clmn_id++).string("Leave Head");
                    }
                    if(field_list_array.includes('availed'))
                    {
                        ws.cell(1, clmn_id++).string("Availed");
                    }
                    if(field_list_array.includes('encashed'))
                    {
                        ws.cell(1, clmn_id++).string("Encashed");
                    }
                    if(field_list_array.includes('lapsed'))
                    {
                        ws.cell(1, clmn_id++).string("Lapsed");
                    }
                    if(field_list_array.includes('closing_balance'))
                    {
                        ws.cell(1, clmn_id++).string("Closing Balance");
                    }
                    if(field_list_array.includes('carry_forward'))
                    {
                        ws.cell(1, clmn_id++).string("Carry Forward");
                    }
                    await Promise.all(employeeies.map(async function (employee, index) {
                        var index_val = 2;
                        index_val = index_val + index;
                        var clmn_emp_id=1
                        ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                        if(field_list_array.includes('emp_code'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(
                                employee.emp_id ? String(employee.emp_id) : ""
                                );
                        }
                        if(field_list_array.includes('name'))
                        {
                            ws.cell(index_val,clmn_emp_id++).string(
                                employee.emp_first_name ? String(employee.emp_first_name +" "+ employee.emp_last_name) : ""
                                );
                        }
                        if(field_list_array.includes('department'))
                        {
                            if(employee.department.length > 0){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.department ? String(employee.department[0].department_name) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('designation'))
                        {
                            if(employee.designation.length > 0){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.designation ? String(employee.designation[0].designation_name) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('branch'))
                        {
                            if(employee.branch.length > 0){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.branch ? String(employee.branch[0].branch_name) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('client_id'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(
                                employee.client ? String(employee.client.client_code) : ""
                                );
                        }
                        if(field_list_array.includes('hod'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(
                                employee.hod ? String(employee.hod.first_name+" "+employee.hod.last_name) : ""
                                );
                        }
                        
                        var leave_heads = [];
                        var leave_added = [];
                        var leave_availed = [];
                        var leave_lapsed = [];
                        var leave_encashed = [];
                        var leave_carry_forward = [];
                        if(employee.employee_leave_summary_logs){
                            if(employee.employee_leave_summary_logs.length > 0){
                                employee.employee_leave_summary_logs.map(function (summary_leave) {
                                    if(summary_leave.type === 'opening'){
                                        employee.opening_balance = summary_leave.history;
                                    }
                                    if(summary_leave.type === 'closing'){
                                        employee.closing_balance = summary_leave.history;
                                        employee.availed = summary_leave.history;
                                    }
                                    if(summary_leave.type === 'earning'){
                                        summary_leave.history.map(function(earning){
                                            leave_added.push(earning);
                                        });
                                    }
                                    // if(summary_leave.type === 'availed'){
                                    //     summary_leave.history.map(function(earning){
                                    //         leave_availed.push(earning);
                                    //     });
                                    // }
                                    if(summary_leave.type === 'lapsed'){
                                        summary_leave.history.map(function(earning){
                                            leave_lapsed.push(earning);
                                        });
                                    }
                                    if(summary_leave.type === 'encashed'){
                                        summary_leave.history.map(function(earning){
                                            leave_encashed.push(earning);
                                        });
                                    }
                                    if(summary_leave.type === 'carry_forward'){
                                        summary_leave.history.map(function(earning){
                                            leave_carry_forward.push(earning);
                                        });
                                    }
                                });
                            }
                        }
                        var holder = {};
                        leave_added.forEach(function(d) {
                            if (holder.hasOwnProperty(d.abbreviation)) {
                                holder[d.abbreviation] = holder[d.abbreviation] + d.balance;
                            } else {
                                holder[d.abbreviation] = d.balance;
                            }
                        });
                        
                        var leave_added = [];

                        for (var prop in holder) {
                            leave_added.push({ abbreviation: prop, balance: holder[prop], head_id: holder[prop] });
                        }
                        employee.leave_added = leave_added;

                        var holder_b = {};
                        leave_lapsed.forEach(function(d) {
                            if (holder_b.hasOwnProperty(d.abbreviation)) {
                                holder_b[d.abbreviation] = holder_b[d.abbreviation] + d.balance;
                            } else {
                                holder_b[d.abbreviation] = d.balance;
                            }
                        });

                        var leave_lapsed = [];

                        for (var prop in holder_b) {
                            leave_lapsed.push({ abbreviation: prop, balance: holder_b[prop], head_id: holder_b[prop] });
                        }
                        employee.lapsed = leave_lapsed;

                        var holder_c = {};
                        leave_encashed.forEach(function(d) {
                            if (holder_c.hasOwnProperty(d.abbreviation)) {
                                holder_c[d.abbreviation] = holder_c[d.abbreviation] + d.balance;
                            } else {
                                holder_c[d.abbreviation] = d.balance;
                            }
                        });

                        var leave_encashed = [];

                        for (var prop in holder_c) {
                            leave_encashed.push({ abbreviation: prop, balance: holder_c[prop], head_id: holder_c[prop] });
                        }
                        employee.encashed = leave_encashed;

                        var holder_d = {};
                        leave_carry_forward.forEach(function(d) {
                            if (holder_d.hasOwnProperty(d.abbreviation)) {
                                holder_d[d.abbreviation] = holder_d[d.abbreviation] + d.balance;
                            } else {
                                holder_d[d.abbreviation] = d.balance;
                            }
                        });

                        var leave_carry_forward = [];

                        for (var prop in holder_d) {
                            leave_carry_forward.push({ abbreviation: prop, balance: holder_d[prop], head_id: holder_d[prop] });
                        }
                        employee.carry_forward = leave_carry_forward;

                        if(employee.leave_balance_counter){
                            employee.leave_balance_counter.map(function(leave_bal) {
                                leave_heads.push(leave_bal.abbreviation); 
                            });
                        }
                        var sum_opining_balance_total_head = 0;
                        var sum_closing_balance_total_head = 0;
                        var sum_earning_balance_total_head = 0;
                        var sum_availed_balance_total_head = 0;
                        var sum_encashed_balance_total_head = 0;
                        var sum_lapsed_balance_total_head = 0;
                        var sum_carry_forward_balance_total_head = 0;
                        if(employee.opening_balance){
                            employee.opening_balance.map(function(op_leave) {
                                sum_opining_balance_total_head += op_leave.balance;
                            });
                        }
                        if(employee.closing_balance){
                            employee.closing_balance.map(function(clo_leave) {
                                sum_closing_balance_total_head += clo_leave.balance;
                            });
                        }
                        if(employee.availed){
                            employee.availed.map(function(ava_leave) {
                                sum_availed_balance_total_head += ava_leave.balance;
                            });
                        }
                        if(employee.leave_added){
                            employee.leave_added.map(function(ear_leave) {
                                sum_earning_balance_total_head += ear_leave.balance;
                            });
                        }
                        if(employee.lapsed){
                            employee.lapsed.map(function(lap_leave) {
                                sum_lapsed_balance_total_head += lap_leave.balance;
                            });
                        }
                        if(employee.encashed){
                            employee.encashed.map(function(enc_leave) {
                                sum_encashed_balance_total_head += enc_leave.balance;
                            });
                        }
                        if(employee.carry_forward){
                            employee.carry_forward.map(function(car_leave) {
                                sum_carry_forward_balance_total_head += car_leave.balance;
                            });
                        }
                        if(field_list_array.includes('opening_balance'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(sum_opining_balance_total_head ? String(sum_opining_balance_total_head) : "0"
                                );
                        }
                        if(field_list_array.includes('pay_days'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(employee.paydays ? String(employee.paydays) : "0"
                                );
                        }
                        if(field_list_array.includes('leave_earned'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(sum_earning_balance_total_head ? String(sum_earning_balance_total_head) : "0"
                                );
                        }
                        if(field_list_array.includes('leave_head'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(leave_heads ? String(leave_heads.join()) : ""
                                );
                        }
                        if(field_list_array.includes('availed'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(sum_availed_balance_total_head ? String(sum_availed_balance_total_head) : "0"
                                );
                        }
                        if(field_list_array.includes('encashed'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(sum_encashed_balance_total_head ? String(sum_encashed_balance_total_head) : "0"
                                );
                        }
                        if(field_list_array.includes('lapsed'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(sum_lapsed_balance_total_head ? String(sum_lapsed_balance_total_head) : "0"
                                );
                        }
                        if(field_list_array.includes('closing_balance'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(sum_closing_balance_total_head ? String(sum_closing_balance_total_head) : "0"
                                );
                        }
                        if(field_list_array.includes('carry_forward'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(sum_carry_forward_balance_total_head ? String(sum_carry_forward_balance_total_head) : "0"
                                );
                        }
                    })).then(async (value) => {
                        // wb.write("ledgerl-earned-leave-report.xlsx");
                        // let file_location = Site_helper.createFiles(wb,"ledgerl-earned-leave-report",'xlsx', req.authData.corporate_id)
                        let file_name = "ledgerl-earned-leave-report.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/leave-module');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                        // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                        // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +file_location});
                    }); 
                }); 
            }
        }
        catch (e) {
            return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong"});
        }
    },
};


