var Company = require('../../Model/Admin/Company');
var Company_details = require('../../Model/Admin/Company_details');
var Employee = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
var Staff = require("../../Model/Company/Staff");
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
const moment = require('moment');
const archiver = require('archiver');
const fs = require('fs');
const {resolve} = require('path');
const absolutePath = resolve('');
const csv = require("csv-parser");
var xl = require("excel4node");
const bcrypt = require("bcrypt");
module.exports = {
    get_register_leave_data: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                // wage_month: "required",
                // wage_year: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
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
            var path_array = [];
            // var wage_month=req.body.wage_month;
            // var wage_year=req.body.wage_year;
            var start_date = new Date(req.body.wage_date_from);
            var end_date = new Date(req.body.wage_date_to);
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
            if (req.body.advance_filter == "yes") {
                if (req.body.age_to && req.body.age_from) {
                    const to_d = new Date();
                    const from_d = new Date();
                    var age_to_date = to_d.toDateString(
                        to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
                        );
                    var age_from_date = from_d.toDateString(
                        from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
                        );
                    search_option.$match.emp_dob = {
                        $gte: new Date(age_to_date),
                        $lt: new Date(age_from_date),
                    };
                }
                if (req.body.gender) {
                    search_option.$match.sex = { $regex: req.body.gender, $options: "i" };
                }
                if (req.body.religion) {
                    search_option.$match.religion = {
                        $regex: req.body.religion,
                        $options: "i",
                    };
                }
                if (req.body.doj_from && req.body.doj_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_join"
                    ] ==
                    {
                        $gte: new Date(req.body.doj_from),
                        $lte: new Date(req.body.doj_to),
                    };
                }
                if (req.body.doe_from && req.body.doe_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_exit"
                    ] ==
                    {
                        $gte: new Date(req.body.doe_from),
                        $lte: new Date(req.body.doe_to),
                    };
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
                if(typeof req.body.unchecked_row_ids == "string"){
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                if(typeof req.body.checked_row_ids == "string"){
                    var ids = JSON.parse(req.body.checked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $in: ids };
                }
            }
            var search_leaves_option = {
                $match: {
                    $and: [
                    { "employee_leaves.corporate_id": req.authData.corporate_id, "leave_approval_status": "approved" }
                    ],
                },
            };
            
            // if(start_date && end_date){
                search_leaves_option = {
                    $match: {
                        $and: [
                        { "employee_leaves.corporate_id": req.authData.corporate_id,  "employee_leaves.leave_approval_status": "approved" },

                    //     {$or:[ 
                    //         {'employee_leaves.created_at': {$gt: start_date}}, 
                    //         { $and:[
                    //             {'employee_leaves.created_at': {$gte: start_date }},
                    //         // {'employee_leaves.created_at': {$gte: start_date }}
                    //         ]
                    //     } 
                    //     ]
                    // },
                    // { $or:[ 
                    //     {'employee_leaves.created_at': {$lt: end_date}}, 
                    //     { $and:[
                    //         {'employee_leaves.created_at': {$lte: end_date }},
                    //             // {'employee_leaves.created_at': {$lte: end_date }}
                    //             ]
                    //         } 
                    //         ]
                    //     }
                        ],
                    },
                };
            // }
            var myAggregate = Employee.aggregate([
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
                        as: "employee_details",
                    },
                },
                {
                    $lookup:{
                        from: 'companies',
                        localField: 'corporate_id',
                        foreignField: 'corporate_id',
                        as: 'companies'
                    }
                },
                {
                    $lookup:{
                        from: 'company_details',
                        localField: 'companies._id',
                        foreignField: 'company_id',
                        as: 'company_details'
                    }
                },
                {
                    $lookup:{
                        from: 'employee_leaves',
                        localField: '_id',
                        foreignField: 'employee_id',
                        as: 'employee_leaves',
                    }
                },
                search_option_details,
                search_leaves_option,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        "companies": {
                            "$arrayElemAt": [ "$companies", 0 ]
                        },
                        "employee_leave": {
                            "$arrayElemAt": [ "$employee_leaves", 0 ]
                        },
                        "company_details": {
                            "$arrayElemAt": [ "$company_details", 0 ]
                        },
                    },
                },
                {
                    $unwind: "$employee_leave"
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
                        "employee_details.employment_hr_details.date_of_join": 1,
                        "companies.establishment_name":1,
                        "companies.com_logo":1,
                        "company_details.reg_office_address":1,
                        "employee_leaves":1,
                    },
                }]).then(async (emp) => {
                    await Promise.all(emp.map(async function (employee, index) {
                        if(employee){
                            var privilege_leave = [];
                            var maternity_leave = [];
                            var special_leave = [];
                            if(employee.employee_leaves){
                                if(employee.employee_leaves.length > 0){
                                    employee.employee_leaves.map(function (lev){
                                        if(lev.leave_temp_head == 'PVL'){
                                            privilege_leave.push({
                                                'date_of_application': lev.created_at,
                                                'from_date': lev.leave_from_date,
                                                'to_date': lev.leave_to_date,
                                                'balance_due': lev.current_balance,
                                            });
                                        }
                                        else if(lev.leave_temp_head == 'MTL'){
                                            maternity_leave.push({
                                                'date_of_application': lev.created_at,
                                                'from_date': lev.leave_from_date,
                                                'to_date': lev.leave_to_date,
                                                'balance_due': lev.current_balance,
                                            });
                                        }
                                        else{
                                            special_leave.push({
                                                'date_of_application': lev.created_at,
                                                'from_date': lev.leave_from_date,
                                                'to_date': lev.leave_to_date,
                                                'balance_due': lev.current_balance,
                                            });
                                        }
                                    });
                                }
                            }
                            employee.privilege_leave = privilege_leave;
                            employee.maternity_leave = maternity_leave;
                            employee.special_leave = special_leave;
                        }
                    })).then((employee) => {
                        return resp.status(200).json({status: "success", message: 'Fetch successfully.', data: emp});
                    });
                });
            
            // Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
            //     if (err) return resp.json({ status: "error", message: err.message });
            //     if(employees.docs){
            //         if(employees.docs.length > 0){
            //             employees.docs.map(function(emp , index){
            //                 var privilege_leave = [];
            //                 var maternity_leave = [];
            //                 var special_leave = [];
            //                 if(emp.employee_leaves){
            //                     if(emp.employee_leaves.length > 0){
            //                         emp.employee_leaves.map(function (lev){
            //                             if(lev.leave_temp_head == 'PVL'){
            //                                privilege_leave.push({
            //                                 'date_of_application': lev.created_at,
            //                                 'from_date': lev.leave_from_date,
            //                                 'to_date': lev.leave_to_date,
            //                                 'balance_due': lev.current_balance,
            //                             });
            //                            }
            //                            else if(lev.leave_temp_head == 'MTL'){
            //                             maternity_leave.push({
            //                                 'date_of_application': lev.created_at,
            //                                 'from_date': lev.leave_from_date,
            //                                 'to_date': lev.leave_to_date,
            //                                 'balance_due': lev.current_balance,
            //                             });
            //                         }
            //                         else{
            //                             special_leave.push({
            //                                 'date_of_application': lev.created_at,
            //                                 'from_date': lev.leave_from_date,
            //                                 'to_date': lev.leave_to_date,
            //                                 'balance_due': lev.current_balance,
            //                             });
            //                         }
            //                     });
            //                     }
            //                 }
            //                 employees.docs[index].privilege_leave = privilege_leave;
            //                 employees.docs[index].maternity_leave = maternity_leave;
            //                 employees.docs[index].special_leave = special_leave;
            //             });
            //         }
            //     }
            //     return resp.status(200).json({status: "success", message: 'Fetch successfully.', data: employees});
            // });
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    get_register_overtime_data: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                wage_month: "required",
                wage_year: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
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
            var path_array = [];
            var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            
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
            if (req.body.advance_filter == "yes") {
                if (req.body.age_to && req.body.age_from) {
                    const to_d = new Date();
                    const from_d = new Date();
                    var age_to_date = to_d.toDateString(
                        to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
                        );
                    var age_from_date = from_d.toDateString(
                        from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
                        );
                    search_option.$match.emp_dob = {
                        $gte: new Date(age_to_date),
                        $lt: new Date(age_from_date),
                    };
                }
                if (req.body.gender) {
                    search_option.$match.sex = { $regex: req.body.gender, $options: "i" };
                }
                if (req.body.religion) {
                    search_option.$match.religion = {
                        $regex: req.body.religion,
                        $options: "i",
                    };
                }
                if (req.body.doj_from && req.body.doj_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_join"
                    ] ==
                    {
                        $gte: new Date(req.body.doj_from),
                        $lte: new Date(req.body.doj_to),
                    };
                }
                if (req.body.doe_from && req.body.doe_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_exit"
                    ] ==
                    {
                        $gte: new Date(req.body.doe_from),
                        $lte: new Date(req.body.doe_to),
                    };
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
                if(typeof req.body.unchecked_row_ids == "string"){
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                if(typeof req.body.checked_row_ids == "string"){
                    var ids = JSON.parse(req.body.checked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $in: ids };
                }
            }


            search_option_details.$match['employee_monthly_reports.ot_report']=  {$exists: true , $ne: null} ;
            var myAggregate = Employee.aggregate([
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
                        as: "employee_details",
                    },
                },
                {
                    $lookup:{
                        from: 'companies',
                        localField: 'corporate_id',
                        foreignField: 'corporate_id',
                        as: 'companies'
                    }
                },
                {
                    $lookup:{
                        from: 'company_details',
                        localField: 'companies._id',
                        foreignField: 'company_id',
                        as: 'company_details'
                    }
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
                    $lookup:
                    {
                        from: 'employee_monthly_reports',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": { 
                                $and :[
                                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                {"wage_month": parseInt(wage_month)},
                                {"wage_year": parseInt(wage_year)},
                                ] 
                            } 
                        }],
                        as: 'employee_monthly_reports',
                    }
                },
                search_option_details,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        "companies": {
                            "$arrayElemAt": [ "$companies", 0 ]
                        },
                        "company_details": {
                            "$arrayElemAt": [ "$company_details", 0 ]
                        },
                        "employee_monthly_reports": {
                            "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                        },
                        designation: {
                            $arrayElemAt: ["$designation", 0],
                        },
                        department: {
                            $arrayElemAt: ["$department", 0],
                        }, 
                    },
                },
                // {
                //     $unwind: "$employee_monthly_reports.ot_report"
                // },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        userid: 1,
                        emp_id: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        emp_father_name: 1,
                        sex: 1,
                        "department._id":1,
                        "department.department_name":1,
                        "designation._id": 1,
                        "designation.designation_name": 1,
                        "companies.establishment_name":1,
                        "company_details.reg_office_address":1,
                        "designation._id": 1,
                        "designation.designation_name": 1,
                        "employee_monthly_reports.attendance_summaries.total_overtime":1,
                        "employee_details.template_data.overtime_temp_data.overtime_rate":1,
                        "employee_monthly_reports.ot_report.overtime_wages":1,
                        "employee_monthly_reports.ot_report.gross_earning":1,
                    },
                }]); 
                myAggregate.then(async (emps) => {
                  if (req.body.generate == "excel") {
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    // var clmn_id = 1;
                    ws.cell(1, 1, 1, 11, true).string("REGISTER OF OVERTIME").style({alignment: {vertical: 'center',horizontal: 'center'}});
                    ws.cell(2, 1, 2, 11, true).string("FORM XXIII, SEE RULE 78 (1) (A) (III)").style({alignment: {vertical: 'center',horizontal: 'center'}});
                    ws.cell(3, 1, 3, 3, true).string('Name of the Establishment  : ').style({alignment: {vertical: 'center',horizontal: 'center'}});
                    ws.cell(3, 4, 3, 6, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                    ws.cell(3, 7, 3, 8, true).string(' Name of Owner :').style({alignment: {vertical: 'center',horizontal: 'center'}});
                    ws.cell(3, 9, 3, 11, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                    ws.cell(5, 1).string("SL.No");
                    ws.cell(5, 2).string("Name Of the Employee");
                    ws.cell(5, 3).string("Father's/ Husband's  Name");
                    ws.cell(5, 4).string("Designation/Nature of Employment");
                    ws.cell(5, 5).string("Dates on which Overtime Worked");
                    ws.cell(5, 6).string("Total Overtime Worked or Production in Case of Piece--Rates");
                    ws.cell(5, 7).string("Normal Rate of Wages");
                    ws.cell(5, 8).string("Overtime Rate of Wages");
                    ws.cell(5, 9).string("Overtime Earnings");
                    ws.cell(5, 10).string("Date on which Overtime Wages Paid");
                    ws.cell(5, 11).string("Remarks");
                    
                    let row = 6
                    await Promise.all(
                        emps.map(async function (employee) {
                        ws.cell(row, 1).number(row - 1);
                        ws.cell(row, 2).string(employee?.emp_first_name + ' ' + employee?.emp_last_name);
                        ws.cell(row, 3).string(employee?.emp_father_name);
                        ws.cell(row, 4).string(employee?.designation?.designation_name + ' & ' + employee?.department?.department_name);
                        ws.cell(row, 5).string("N/A");
                        ws.cell(row, 6).string(employee?.employee_monthly_reports ? employee?.employee_monthly_reports?.attendance_summaries?.total_overtime?.toFixed(2) : "N/A");
                        ws.cell(row, 7).string(employee?.employee_details?.template_data?.overtime_temp_data?.overtime_rate?.toFixed(2));
                        ws.cell(row, 8).string(employee?.employee_monthly_reports?(employee?.employee_monthly_reports?.ot_report?.overtime_wages?.toFixed(2) ):"N/A");
                        ws.cell(row, 9).string(employee?.employee_monthly_reports?(employee?.employee_monthly_reports?.ot_report?.gross_earning?.toFixed(2)  ):"N/A");
                        ws.cell(row, 10).string("N/A");
                        ws.cell(row, 11).string("N/A");

                        row++
                      })
                    ).then(async (emp) => {
                      let file = Site_helper.createFiles(
                        wb,
                        "overtime-register-report-export.xlsx",
                        req.authData.corporate_id,
                        "temp_files/overtime_module"
                      );
                      await Site_helper.downloadAndDelete(
                        file.file_name,
                        file.location,
                        req.authData.corporate_id,
                        resp
                      );
                      // return resp.status(200).json({status: "success", message: 'Register Advance Report Generated successfully.', url: baseurl + file_location});
                    });
                  } else {
                    return resp
                      .status(200)
                      .send({
                        status: "success",
                        message: "Fetch successfully.",
                        data: { docs: emps },
                      });
                  }
                });
                // Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
                //     if (err) return resp.json({ status: "error", message: err.message });

                //     return resp.status(200).json({status: "success", message: 'Fetch successfully.', data: employees});
                // });
            } 
            catch (e) {
                return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
            }
        },
        get_kyc_bluk_data: async function (req, resp, next) {
            try {
                const v = new Validator(req.body, {
                // wage_month: "required",
                // wage_year: "required",
            });
                const matched = await v.check();
                if (!matched) {
                    return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
                }
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
            // var path_array = [];
            // var wage_month=req.body.wage_month;
            // var wage_year=req.body.wage_year;
            
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
            if (req.body.advance_filter == "yes") {
                if (req.body.age_to && req.body.age_from) {
                    const to_d = new Date();
                    const from_d = new Date();
                    var age_to_date = to_d.toDateString(
                        to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
                        );
                    var age_from_date = from_d.toDateString(
                        from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
                        );
                    search_option.$match.emp_dob = {
                        $gte: new Date(age_to_date),
                        $lt: new Date(age_from_date),
                    };
                }
                if (req.body.gender) {
                    search_option.$match.sex = { $regex: req.body.gender, $options: "i" };
                }
                if (req.body.religion) {
                    search_option.$match.religion = {
                        $regex: req.body.religion,
                        $options: "i",
                    };
                }
                if (req.body.doj_from && req.body.doj_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_join"
                    ] ==
                    {
                        $gte: new Date(req.body.doj_from),
                        $lte: new Date(req.body.doj_to),
                    };
                }
                if (req.body.doe_from && req.body.doe_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_exit"
                    ] ==
                    {
                        $gte: new Date(req.body.doe_from),
                        $lte: new Date(req.body.doe_to),
                    };
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
                if(typeof req.body.unchecked_row_ids == "string"){
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                if(typeof req.body.checked_row_ids == "string"){
                    var ids = JSON.parse(req.body.checked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $in: ids };
                }
            }


            
            var myAggregate = Employee.aggregate([
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
                        as: "employee_details",
                    },
                },
                search_option_details,
                {
                    $addFields: {
                        "employee_details": {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                    },
                },
                {
                    $unwind: "$employee_details.pf_esic_details.pre_er_epfo_details.uan_no"
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        emp_id: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        pan_no:1,
                        aadhar_no:1,
                        "employee_details.pf_esic_details.pre_er_epfo_details.uan_no":1,
                        "employee_details.bank_details.account_no":1,
                        "employee_details.bank_details.ifsc_code":1,
                    },
                }]); Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    var type = '';
                    if(employees.docs){
                        if(employees.docs.length > 0){
                            employees.docs.map(function(emp , index){
                                var kyc_bluk = {};
                                if(emp.pan_no){
                                    kyc_bluk = {
                                        'uan' : emp.employee_details.pf_esic_details.pre_er_epfo_details.uan_no,
                                        'type' : "P",
                                        'doc_number' : emp.pan_no,
                                        'member_name_as_per_doc' : emp.emp_first_name+" "+emp.emp_last_name,
                                        'ifsc' : "",
                                        'expiry_date' : "",
                                    };
                                }
                                else if(emp.aadhar_no){
                                    kyc_bluk = {
                                        'uan' : emp.employee_details.pf_esic_details.pre_er_epfo_details.uan_no,
                                        'type' : "A",
                                        'doc_number' : emp.aadhar_no,
                                        'member_name_as_per_doc' : emp.emp_first_name+" "+emp.emp_last_name,
                                        'ifsc' : "",
                                        'expiry_date' : "",
                                    };
                                }
                                else if(emp.employee_details.bank_details.account_no){
                                    kyc_bluk = {
                                        'uan' : emp.employee_details.pf_esic_details.pre_er_epfo_details.uan_no,
                                        'type' : "B",
                                        'doc_number' : emp.employee_details.bank_details.account_no,
                                        'member_name_as_per_doc' : emp.emp_first_name+" "+emp.emp_last_name,
                                        'ifsc' : emp.employee_details.bank_details.ifsc_code,
                                        'expiry_date' : "",
                                    };
                                }
                                employees.docs[index].kyc_bluk = kyc_bluk;
                            });
                        }
                    }
                    return resp.status(200).json({status: "success", message: 'Fetch successfully.', data: employees});
                });
            } 
            catch (e) {
                return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
            }
        },
        get_lwf_data: async function (req, resp, next) {
            try {
                const v = new Validator(req.body, {
                    wage_month: "required",
                    wage_year: "required",
                });
                const matched = await v.check();
                if (!matched) {
                    return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
                }
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
                var path_array = [];
                var wage_month=req.body.wage_month;
                var wage_year=req.body.wage_year;

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
                if (req.body.advance_filter == "yes") {
                    if (req.body.age_to && req.body.age_from) {
                        const to_d = new Date();
                        const from_d = new Date();
                        var age_to_date = to_d.toDateString(
                            to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
                            );
                        var age_from_date = from_d.toDateString(
                            from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
                            );
                        search_option.$match.emp_dob = {
                            $gte: new Date(age_to_date),
                            $lt: new Date(age_from_date),
                        };
                    }
                    if (req.body.gender) {
                        search_option.$match.sex = { $regex: req.body.gender, $options: "i" };
                    }
                    if (req.body.religion) {
                        search_option.$match.religion = {
                            $regex: req.body.religion,
                            $options: "i",
                        };
                    }
                    if (req.body.doj_from && req.body.doj_to) {
                        search_option_details.$match[
                        "employee_details.employment_hr_details.date_of_join"
                        ] ==
                        {
                            $gte: new Date(req.body.doj_from),
                            $lte: new Date(req.body.doj_to),
                        };
                    }
                    if (req.body.doe_from && req.body.doe_to) {
                        search_option_details.$match[
                        "employee_details.employment_hr_details.date_of_exit"
                        ] ==
                        {
                            $gte: new Date(req.body.doe_from),
                            $lte: new Date(req.body.doe_to),
                        };
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
                if(req.body.generate == 'excel'){
                    if (req.body.row_checked_all === "true") {
                        if(typeof req.body.unchecked_row_ids == "string"){
                            var ids = JSON.parse(req.body.unchecked_row_ids);
                        }
                        else{
                            var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                        }
                        if (ids.length > 0) {
                            ids = ids.map(function (el) {
                                return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match._id = { $nin: ids };
                        }
                    } else {
                        if(typeof req.body.checked_row_ids == "string"){
                            var ids = JSON.parse(req.body.checked_row_ids);
                        }
                        else{
                            var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                        }
                        if (ids.length > 0) {
                            ids = ids.map(function (el) {
                                return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match._id = { $in: ids };
                        }
                    }
                }



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
                        as: "employee_details",
                    },
                },
                {
                    $lookup:{
                        from: 'companies',
                        localField: 'corporate_id',
                        foreignField: 'corporate_id',
                        as: 'companies'
                    }
                },
                {
                    $lookup:{
                        from: 'company_details',
                        localField: 'companies._id',
                        foreignField: 'company_id',
                        as: 'company_details'
                    }
                },
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
                    $lookup:
                    {
                        from: 'employee_monthly_reports',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": { 
                                $and :[
                                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                {"wage_month": parseInt(wage_month)},
                                {"wage_year": parseInt(wage_year)},
                                ] 
                            } 
                        }],
                        as: 'employee_monthly_reports',
                    }
                },
                search_option_details,
                {
                    $addFields: {
                        client: {
                            $arrayElemAt: ["$client", 0],
                        }, 
                        branch: {
                            $arrayElemAt: ["$branch", 0],
                        }, 
                        designation: {
                            $arrayElemAt: ["$designation", 0],
                        },
                        department: {
                            $arrayElemAt: ["$department", 0],
                        }, 
                        hod: {
                            $arrayElemAt: ["$hod", 0],
                        }, 
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        "companies": {
                            "$arrayElemAt": [ "$companies", 0 ]
                        },
                        "company_details": {
                            "$arrayElemAt": [ "$company_details", 0 ]
                        },
                        "employee_monthly_reports": {
                            "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                        },
                    },
                },
                {
                    // $unwind: "$employee_monthly_reports.salary_report.lwf_data"
                    $unwind: "$employee_monthly_reports"
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        emp_id: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        sex:1,
                        // "companies.establishment_name":1,
                        // "company_details.reg_office_address":1,
                        "branch.branch_name":1,
                        "branch._id":1,
                        "department":1,
                        "client":1,
                        "designation._id": 1,
                        "designation.designation_name": 1,
                        "hod.first_name":1,
                        "hod.last_name":1,
                        "hod.userid":1,
                        "hod._id":1,
                        "employee_details.employment_hr_details.date_of_join":1,
                        "employee_monthly_reports.salary_report.lwf_data":{ $ifNull: [ "$employee_monthly_reports.salary_report.lwf_data", "" ] },
                    },
                },
                ]); 
                if(req.body.generate == 'excel'){
                    const wb = new xl.Workbook();
                    const ws = wb.addWorksheet("Sheet 1");

                    myAggregate.then(async (employees) => {
                        ws.cell(1, 1).string("Sl No.");
                        ws.cell(1, 2).string("Emp ID");
                        ws.cell(1, 3).string("Name");
                        ws.cell(1, 4).string("Department");
                        ws.cell(1, 5).string("Designation");
                        ws.cell(1, 6).string("Branch");
                        ws.cell(1, 7).string("Client");
                        ws.cell(1, 8).string("HOD");
                        ws.cell(1, 9).string("Month /Year");
                        ws.cell(1, 10).string("Gender");
                        ws.cell(1, 11).string("Date Of Joining");
                        ws.cell(1, 12).string("EE");
                        ws.cell(1, 13).string("ER");
                        ws.cell(1, 14).string("Total");
    
                        var row = 2;
                
                        await Promise.all(employees.map(async function (employee, index) {
                            const total = (employee?.employee_monthly_reports?.salary_report?.lwf_data?.employee_contribution ?? 0) + (employee?.employee_monthly_reports?.salary_report?.lwf_data?.employer_contribution ?? 0) ?? 0
                              ws.cell(row, 1).number(row - 1);
                              ws.cell(row, 2).string(employee.emp_id ? String(employee.emp_id) : '' )
                              ws.cell(row, 3).string(employee.emp_first_name ? String(employee?.emp_first_name + ' ' + employee?.emp_last_name) : '' )
                              ws.cell(row, 4).string(employee.department ? String(employee.department?.department_name) : '' )
                              ws.cell(row, 5).string(employee.designation ? String(employee.designation?.designation_name) : '' )
                              ws.cell(row, 6).string(employee.branch ? String(employee.branch?.branch_name) : '' )
                              ws.cell(row, 7).string(employee.client ? String(employee.client?.client_name) : '' )
                              ws.cell(row, 8).string(employee.hod ? String(employee.hod?.first_name + employee.hod?.last_name) : '' )
                              ws.cell(row, 9).string(`${wage_month + 1}/${wage_year}`)
                              ws.cell(row, 10).string(employee.sex ? employee?.sex == 'm' ? 'Male' : 'Female' : '' )
                              ws.cell(row, 11).string(employee.employee_details?.employment_hr_details?.date_of_join ? String(employee.employee_details?.employment_hr_details?.date_of_join) : '' )
                              ws.cell(row, 12).number(employee.employee_monthly_reports?.salary_report?.lwf_data?.employee_contribution ? Number(employee.employee_monthly_reports?.salary_report?.lwf_data?.employee_contribution ?? 0) : 0 )
                              ws.cell(row, 13).number(employee.employee_monthly_reports?.salary_report?.lwf_data?.employer_contribution ? Number(employee.employee_monthly_reports?.salary_report?.lwf_data?.employer_contribution ?? 0) : 0 )
                              ws.cell(row, 14).number(total)
            
                              row++;
                        })).then(async(value) => {
                          let file_name = req.body.reportListType+"-lwf-report.xlsx";
                          let file =  Site_helper.createFiles(wb,file_name, req.authData.corporate_id, 'temp_files/lwf-reports');
                          await Site_helper.downloadAndDelete(file.file_name,file.location, req.authData.corporate_id,resp);
                        });
                    });
                    
                }else{
                    Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                        if (err) return resp.json({ status: "error", message: err.message });
                        
                        return resp.status(200).json({status: "success",data: employees,});
                    });
                }
                // myAggregate.then(async (employees) => {
                    // if (employees) {
                    //     if (employees.length > 0) {
                    //         employees.map(function (emp) {
                    //             // if(emp.employee_monthly_reports){
                    //             //     if(emp.employee_monthly_reports.salary_report){
                    //             //         if(emp.employee_monthly_reports.salary_report.lwf_data){
                    //             //             if(emp.employee_monthly_reports.salary_report.lwf_data.employee_contribution && emp.employee_monthly_reports.salary_report.lwf_data.employer_contribution){
                    //             //                 emp.employee_monthly_reports.salary_report.lwf_data.total = (parseFloat(emp.employee_monthly_reports.salary_report.lwf_data.employee_contribution) + parseFloat(emp.employee_monthly_reports.salary_report.lwf_data.employer_contribution));
                    //             //             }
                    //             //         }
                    //             //     }
                    //             // }
                    //             emp.employee_monthly_reports.salary_report.lwf_data.total = (parseFloat(emp.employee_monthly_reports.salary_report.lwf_data.employee_contribution) + parseFloat(emp.employee_monthly_reports.salary_report.lwf_data.employer_contribution));
                    //         });
                    //     }
                    // }
                //     return resp.status(200).json({ status: "success", message: 'Fetch successfully.', data: employees });
                // });
                // Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
                //     if (err) return resp.json({ status: "error", message: err.message });
                //     if(employees.docs){
                //         if(employees.docs.length > 0){
                //             employees.docs.map(function(emp , index){
                //                 employees.docs[index].employee_monthly_reports.salary_report.lwf_data.total = (parseFloat(employees.docs[index].employee_monthly_reports.salary_report.lwf_data.employee_contribution) + parseFloat(employees.docs[index].employee_monthly_reports.salary_report.lwf_data.employer_contribution));
                //             });
                //         }
                //     }
                //     return resp.status(200).json({status: "success", message: 'Fetch successfully.', data: employees});
                // });
            } 
            catch (e) {
                return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
            }
        },
        get_register_overtime_report_two_data: async function (req, resp, next) {
            try {
                const v = new Validator(req.body, {
                    wage_month: "required",
                    wage_year: "required",
                });
                const matched = await v.check();
                if (!matched) {
                    return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
                }
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
                var path_array = [];
                var wage_month=req.body.wage_month;
                var wage_year=req.body.wage_year;

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
                if (req.body.advance_filter == "yes") {
                    if (req.body.age_to && req.body.age_from) {
                        const to_d = new Date();
                        const from_d = new Date();
                        var age_to_date = to_d.toDateString(
                            to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
                            );
                        var age_from_date = from_d.toDateString(
                            from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
                            );
                        search_option.$match.emp_dob = {
                            $gte: new Date(age_to_date),
                            $lt: new Date(age_from_date),
                        };
                    }
                    if (req.body.gender) {
                        search_option.$match.sex = { $regex: req.body.gender, $options: "i" };
                    }
                    if (req.body.religion) {
                        search_option.$match.religion = {
                            $regex: req.body.religion,
                            $options: "i",
                        };
                    }
                    if (req.body.doj_from && req.body.doj_to) {
                        search_option_details.$match[
                        "employee_details.employment_hr_details.date_of_join"
                        ] ==
                        {
                            $gte: new Date(req.body.doj_from),
                            $lte: new Date(req.body.doj_to),
                        };
                    }
                    if (req.body.doe_from && req.body.doe_to) {
                        search_option_details.$match[
                        "employee_details.employment_hr_details.date_of_exit"
                        ] ==
                        {
                            $gte: new Date(req.body.doe_from),
                            $lte: new Date(req.body.doe_to),
                        };
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
                    if(typeof req.body.unchecked_row_ids == "string"){
                        var ids = JSON.parse(req.body.unchecked_row_ids);
                    }
                    else{
                        var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    }
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                } else {
                    if(typeof req.body.checked_row_ids == "string"){
                        var ids = JSON.parse(req.body.checked_row_ids);
                    }
                    else{
                        var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                    }
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $in: ids };
                    }
                }



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
                        as: "employee_details",
                    },
                },
                {
                    $lookup:{
                        from: 'companies',
                        localField: 'corporate_id',
                        foreignField: 'corporate_id',
                        as: 'companies'
                    }
                },
                {
                    $lookup:{
                        from: 'company_details',
                        localField: 'companies._id',
                        foreignField: 'company_id',
                        as: 'company_details'
                    }
                },
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
                    $lookup:
                    {
                        from: 'employee_monthly_reports',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": { 
                                $and :[
                                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                {"wage_month": parseInt(wage_month)},
                                {"wage_year": parseInt(wage_year)},
                                ] 
                            } 
                        }],
                        as: 'employee_monthly_reports',
                    }
                },
                search_option_details,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        "companies": {
                            "$arrayElemAt": [ "$companies", 0 ]
                        },
                        "company_details": {
                            "$arrayElemAt": [ "$company_details", 0 ]
                        },
                        "employee_monthly_reports": {
                            "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                        },
                        client: {
                            $arrayElemAt: ["$client", 0],
                        }, 
                        branch: {
                            $arrayElemAt: ["$branch", 0],
                        }, 
                        designation: {
                            $arrayElemAt: ["$designation", 0],
                        },
                        department: {
                            $arrayElemAt: ["$department", 0],
                        }, 
                        hod: {
                            $arrayElemAt: ["$hod", 0],
                        },
                    },
                },
                {
                    $unwind: "$employee_monthly_reports.ot_report"
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
                        sex: 1,
                        "companies.establishment_name":1,
                        "client._id":1,
                        "client.client_name":1,
                        "client.client_code":1,
                        "branch._id":1,
                        "branch.branch_name":1,
                        "department._id":1,
                        "department.department_name":1,
                        "designation._id": 1,
                        "designation.designation_name": 1,
                        "hod.first_name":1,
                        "hod.last_name":1,
                        "hod.userid":1,
                        "hod._id":1,
                        "employee_details.template_data.overtime_temp_data.overtime_type":1,
                        "employee_details.template_data.overtime_temp_data.overtime_rate":1,
                        "employee_details.template_data.overtime_temp_data.publish_status":1,
                        "employee_monthly_reports.attendance_summaries.total_overtime":1,
                        "employee_monthly_reports.ot_report.overtime_wages":1,
                        "employee_monthly_reports.advance_report.opening_balance":1,
                        "employee_monthly_reports.ot_report.advance_recovered":1,
                        "employee_monthly_reports.advance_report.closing_balance":1,
                        "employee_monthly_reports.ot_report.pf_data.emoloyee_contribution":1,
                        "employee_monthly_reports.ot_report.pf_data.total_employer_contribution":1,
                        "employee_monthly_reports.ot_report.esic_data":1,
                        "employee_monthly_reports.ot_report.gross_earning":1,
                        "employee_details.bank_details.bank_name":1,
                        "employee_details.bank_details.account_no":1,
                        "employee_details.bank_details.ifsc_code":1,
                    },
                }
                ]); Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    if(employees.docs){
                        if(employees.docs.length > 0){
                            employees.docs.map(async function(emp,index){
                                var ot_report_data = {
                                    "ot_hours":null,
                                    "ot_days":null,
                                    "ot_wage":null,
                                    "ot_hour_amt":null,
                                    "ot_days_amt":null,
                                    "openin_adv":null,
                                    "adv_recovered":null,
                                    "closing_adv":null,
                                    "ee_pf":null,
                                    "er_pf":null,
                                    "ee_esi":null,
                                    "er_esi":null,
                                    "amt_payable":null,
                                    "amt_remitted":null,
                                    "tds":null,
                                    "bank_name":null,
                                    "acc_no":null,
                                    "ifsc":null,
                                    "payment_mode":null,
                                    "signature":null,
                                };
                                if(emp.employee_details){
                                    if(emp.employee_details.template_data){
                                        if(emp.employee_details.template_data.overtime_temp_data){
                                            if(emp.employee_details.template_data.overtime_temp_data.overtime_type == 'hourly_fix' || emp.employee_details.template_data.overtime_temp_data.overtime_type == 'hourly_per'){
                                                ot_report_data.ot_hours = emp.employee_monthly_reports.attendance_summaries? emp.employee_monthly_reports.attendance_summaries.total_overtime : null ;
                                                ot_report_data.ot_hour_amt = emp.employee_details.template_data.overtime_temp_data? emp.employee_details.template_data.overtime_temp_data.overtime_rate : null ;
                                            }
                                            else if(emp.employee_details.template_data.overtime_temp_data.overtime_type == 'daily_fix' || emp.employee_details.template_data.overtime_temp_data.overtime_type == 'daily_per'){
                                                ot_report_data.ot_days = emp.employee_monthly_reports.attendance_summaries? emp.employee_monthly_reports.attendance_summaries.total_overtime : null ;
                                                ot_report_data.ot_days_amt = emp.employee_details.template_data.overtime_temp_data? emp.employee_details.template_data.overtime_temp_data.overtime_rate : null ;
                                            }
                                        }
                                    }
                                }

                                ot_report_data.ot_wage = emp.employee_monthly_reports.ot_report? emp.employee_monthly_reports.ot_report.overtime_wages : null ;
                                // ot_report_data.openin_adv = emp.employee_monthly_reports.advance_report? emp.employee_monthly_reports.advance_report.opening_balance : null ;
                                ot_report_data.adv_recovered = emp.employee_monthly_reports.ot_report? emp.employee_monthly_reports.ot_report.advance_recovered : null ;
                                // ot_report_data.closing_adv = emp.employee_monthly_reports.advance_report? emp.employee_monthly_reports.advance_report.closing_balance : null ;
                                ot_report_data.ee_pf = emp.employee_monthly_reports.ot_report.pf_data? emp.employee_monthly_reports.ot_report.pf_data.emoloyee_contribution : null ;
                                ot_report_data.er_pf = emp.employee_monthly_reports.ot_report.pf_data? emp.employee_monthly_reports.ot_report.pf_data.total_employer_contribution : null ;
                                ot_report_data.ee_esi = emp.employee_monthly_reports.ot_report.esic_data? emp.employee_monthly_reports.ot_report.esic_data.emoloyee_contribution : null ;
                                ot_report_data.er_esi = emp.employee_monthly_reports.ot_report.esic_data? emp.employee_monthly_reports.ot_report.esic_data.emoloyer_contribution : null ;
                                ot_report_data.amt_payable = emp.employee_monthly_reports.ot_report? emp.employee_monthly_reports.ot_report.gross_earning : null ;
                                ot_report_data.bank_name = emp.employee_details.bank_details? emp.employee_details.bank_details.bank_name : null ;
                                ot_report_data.acc_no = emp.employee_details.bank_details? emp.employee_details.bank_details.account_no : null ;
                                ot_report_data.ifsc = emp.employee_details.bank_details? emp.employee_details.bank_details.ifsc_code : null ;
                                emp.ot_report_data = ot_report_data;
                            })
                        } 
                    }  
                    return resp.status(200).json({status: "success", message: 'Fetch successfully.', data: employees});  
                }) 
            } 
            catch (e) {
                return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
            }
        },

    get_register_leave_data_export: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                // wage_month: "required",
                // wage_year: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(403).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
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
            var path_array = [];
            var start_date = new Date(req.body.wage_date_from);
            var end_date = new Date(req.body.wage_date_to);
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
            if (req.body.advance_filter == "yes") {
                if (req.body.age_to && req.body.age_from) {
                    const to_d = new Date();
                    const from_d = new Date();
                    var age_to_date = to_d.toDateString(
                        to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
                        );
                    var age_from_date = from_d.toDateString(
                        from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
                        );
                    search_option.$match.emp_dob = {
                        $gte: new Date(age_to_date),
                        $lt: new Date(age_from_date),
                    };
                }
                if (req.body.gender) {
                    search_option.$match.sex = { $regex: req.body.gender, $options: "i" };
                }
                if (req.body.religion) {
                    search_option.$match.religion = {
                        $regex: req.body.religion,
                        $options: "i",
                    };
                }
                if (req.body.doj_from && req.body.doj_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_join"
                    ] ==
                    {
                        $gte: new Date(req.body.doj_from),
                        $lte: new Date(req.body.doj_to),
                    };
                }
                if (req.body.doe_from && req.body.doe_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_exit"
                    ] ==
                    {
                        $gte: new Date(req.body.doe_from),
                        $lte: new Date(req.body.doe_to),
                    };
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
                if(typeof req.body.unchecked_row_ids == "string"){
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                if(typeof req.body.checked_row_ids == "string"){
                    var ids = JSON.parse(req.body.checked_row_ids);
                }
                else{
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $in: ids };
                }
            }
            var search_leaves_option = {
                $match: {
                    $and: [
                    { "employee_leaves.corporate_id": req.authData.corporate_id, "leave_approval_status": "approved" }
                    ],
                },
            };
            search_leaves_option = {
                $match: {
                    $and: [
                    { "employee_leaves.corporate_id": req.authData.corporate_id,  "employee_leaves.leave_approval_status": "approved" },
                    ],
                },
            };
            var myAggregate = Employee.aggregate([
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
                        as: "employee_details",
                    },
                },
                {
                    $lookup:{
                        from: 'companies',
                        localField: 'corporate_id',
                        foreignField: 'corporate_id',
                        as: 'companies'
                    }
                },
                {
                    $lookup:{
                        from: 'company_details',
                        localField: 'companies._id',
                        foreignField: 'company_id',
                        as: 'company_details'
                    }
                },
                {
                    $lookup:{
                        from: 'employee_leaves',
                        localField: '_id',
                        foreignField: 'employee_id',
                        as: 'employee_leaves',
                    }
                },
                search_option_details,
                search_leaves_option,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        "companies": {
                            "$arrayElemAt": [ "$companies", 0 ]
                        },
                        "employee_leave": {
                            "$arrayElemAt": [ "$employee_leaves", 0 ]
                        },
                        "company_details": {
                            "$arrayElemAt": [ "$company_details", 0 ]
                        },
                    },
                },
                {
                    $unwind: "$employee_leave"
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
                        "employee_details.employment_hr_details.date_of_join": 1,
                        "companies.establishment_name":1,
                        "companies.com_logo":1,
                        "company_details.reg_office_address":1,
                        "employee_leaves":1,
                    },
                }]).then(async (emp) => {
                    var field_list_array=["company_name","emp_id", "name","father_name","doj",
                    "doa_privilege_leave","applied_from_date_privilege_leave","applied_to_date_privilege_leave", "granted_from_date_privilege_leave","granted_to_date_privilege_leave","balance_due_privilege_leave",
                    "doa_maternity_leave","applied_from_date_maternity_leave","applied_to_date_maternity_leave", "granted_from_date_maternity_leave","granted_to_date_maternity_leave","balance_due_maternity_leave",
                    "doa_special_leave","applied_from_date_special_leave","applied_to_date_special_leave", "granted_from_date_special_leave","granted_to_date_special_leave","balance_due_special_leave",
                    ];
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    var clmn_id = 1;
                    ws.cell(1, clmn_id++).string("SL");
                    ws.cell(1, clmn_id++).string("Establishment");
                    ws.cell(1, clmn_id++).string("Employee Id");
                    ws.cell(1, clmn_id++).string("Name");
                    ws.cell(1, clmn_id++).string("Father’s Name");
                    ws.cell(1, clmn_id++).string("Date of appointment");
                    if(field_list_array.includes('doa_privilege_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Date of application (Privilege Leave)");
                    }
                    if(field_list_array.includes('applied_from_date_privilege_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Applied From Date (Privilege Leave)");
                    }
                    if(field_list_array.includes('applied_to_date_privilege_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Applied To Date (Privilege Leave)");
                    }
                    if(field_list_array.includes('granted_from_date_privilege_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Granted From Date (Privilege Leave)");
                    }
                    if(field_list_array.includes('granted_to_date_privilege_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Granted To Date (Privilege Leave)");
                    }
                    if(field_list_array.includes('balance_due_privilege_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Balance Due (Privilege Leave)");
                    }

                    if(field_list_array.includes('doa_maternity_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Date of application (Maternity Leave)");
                    }
                    if(field_list_array.includes('applied_from_date_maternity_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Applied From Date (Maternity Leave)");
                    }
                    if(field_list_array.includes('applied_to_date_maternity_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Applied To Date (Maternity Leave)");
                    }
                    if(field_list_array.includes('granted_from_date_maternity_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Granted From Date (Maternity Leave)");
                    }
                    if(field_list_array.includes('granted_to_date_maternity_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Granted To Date (maternity Leave)");
                    }
                    if(field_list_array.includes('balance_due_maternity_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Balance Due (Maternity Leave)");
                    }

                    if(field_list_array.includes('doa_special_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Date of application (Special Leave)");
                    }
                    if(field_list_array.includes('applied_from_date_special_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Applied From Date (Special Leave)");
                    }
                    if(field_list_array.includes('applied_to_date_special_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Applied To Date (Special Leave)");
                    }
                    if(field_list_array.includes('granted_from_date_special_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Granted From Date (Special Leave)");
                    }
                    if(field_list_array.includes('granted_to_date_special_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Granted To Date (Special Leave)");
                    }
                    if(field_list_array.includes('balance_due_special_leave'))
                    {
                        ws.cell(1, clmn_id++).string("Balance Due (Special Leave)");
                    }
                    var total_count = 0;
                    await Promise.all(emp.map(async function (employee, index) {
                        if(employee){
                            var privilege_leave = [];
                            var maternity_leave = [];
                            var special_leave = [];
                            if(employee.employee_leaves){
                                if(employee.employee_leaves.length > 0){
                                    employee.employee_leaves.map(function (lev){
                                        if(lev.leave_temp_head == 'PVL'){
                                            privilege_leave.push({
                                                'date_of_application': lev.created_at,
                                                'from_date': lev.leave_from_date,
                                                'to_date': lev.leave_to_date,
                                                'balance_due': lev.current_balance,
                                            });
                                        }
                                        else if(lev.leave_temp_head == 'MTL'){
                                            maternity_leave.push({
                                                'date_of_application': lev.created_at,
                                                'from_date': lev.leave_from_date,
                                                'to_date': lev.leave_to_date,
                                                'balance_due': lev.current_balance,
                                            });
                                        }
                                        else{
                                            special_leave.push({
                                                'date_of_application': lev.created_at,
                                                'from_date': lev.leave_from_date,
                                                'to_date': lev.leave_to_date,
                                                'balance_due': lev.current_balance,
                                            });
                                        }
                                    });
                                }
                            }
                            // employee.privilege_leave = privilege_leave;
                            // employee.maternity_leave = maternity_leave;
                            // employee.special_leave = special_leave;
                            var row = 0;
                            if(privilege_leave.length > 0){
                                privilege_leave.map(function (p_leave, ind) {
                                    if(total_count == 0){
                                        var index_val = 2;
                                    }
                                    else{
                                        var index_val = 2 + total_count;
                                    }
                                    index_val = index_val + ind;
                                    var clmn_emp_id=1
                                    ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                                    if(field_list_array.includes('company_name'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(
                                            employee.companies ? String(employee.companies.establishment_name) : ""
                                            );
                                    }
                                    if(field_list_array.includes('emp_id'))
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
                                    if(field_list_array.includes('father_name'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        employee.emp_father_name ? String(employee.emp_father_name) : ""
                                        );
                                    }
                                    if(field_list_array.includes('doj'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        employee.employee_details ? String(moment(employee.employee_details.employment_hr_details.date_of_join).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('doa_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        p_leave.date_of_application ? String(moment(p_leave.date_of_application).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('applied_from_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        p_leave.from_date ? String(moment(p_leave.from_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('applied_to_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        p_leave.to_date ? String(moment(p_leave.to_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('granted_from_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        p_leave.from_date ? String(moment(p_leave.from_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('granted_to_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        p_leave.to_date ? String(moment(p_leave.to_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('balance_due_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        p_leave.balance_due ? String(p_leave.balance_due) : ""
                                        );
                                    }
                                });
                            }
                            if(maternity_leave.length > 0){
                                maternity_leave.map(function (m_leave, mnd) {
                                    if(total_count == 0){
                                        var index_val = 2;
                                    }
                                    else{
                                        var index_val = 3 + total_count;
                                    }
                                    index_val = index_val + mnd;
                                    var clmn_emp_id=1
                                    ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                                    if(field_list_array.includes('company_name'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(
                                            employee.companies ? String(employee.companies.establishment_name) : ""
                                            );
                                    }
                                    if(field_list_array.includes('emp_id'))
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
                                    if(field_list_array.includes('father_name'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        employee.emp_father_name ? String(employee.emp_father_name) : ""
                                        );
                                    }
                                    if(field_list_array.includes('doj'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        employee.employee_details ? String(moment(employee.employee_details.employment_hr_details.date_of_join).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('doa_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('applied_from_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('applied_to_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('granted_from_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('granted_to_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('balance_due_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('doa_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        m_leave.date_of_application ? String(moment(m_leave.date_of_application).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('applied_from_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        m_leave.from_date ? String(moment(m_leave.from_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('applied_to_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        m_leave.to_date ? String(moment(m_leave.to_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('granted_from_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        m_leave.from_date ? String(moment(m_leave.from_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('granted_to_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        m_leave.to_date ? String(moment(m_leave.to_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('balance_due_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        m_leave.balance_due ? String(m_leave.balance_due) : ""
                                        );
                                    }
                                });
                            }
                            if(special_leave.length > 0){
                                special_leave.map(function (s_leave , snd) {
                                    if(total_count == 0){
                                        var index_val = 2;
                                    }
                                    else{
                                        var index_val = 4 + total_count;
                                    }
                                    // var index_val = 2;
                                    index_val = index_val + snd;
                                    console.log(index_val);
                                    var clmn_emp_id=1
                                    ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                                    if(field_list_array.includes('company_name'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(
                                            employee.companies ? String(employee.companies.establishment_name) : ""
                                            );
                                    }
                                    if(field_list_array.includes('emp_id'))
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
                                    if(field_list_array.includes('father_name'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        employee.emp_father_name ? String(employee.emp_father_name) : ""
                                        );
                                    }
                                    if(field_list_array.includes('doj'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        employee.employee_details ? String(moment(employee.employee_details.employment_hr_details.date_of_join).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('doa_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('applied_from_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('applied_to_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('granted_from_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('granted_to_date_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('balance_due_privilege_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('doa_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('applied_from_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('applied_to_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('granted_from_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('granted_to_date_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('balance_due_maternity_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string("");
                                    }
                                    if(field_list_array.includes('doa_special_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        s_leave.date_of_application ? String(moment(s_leave.date_of_application).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('applied_from_date_special_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        s_leave.from_date ? String(moment(s_leave.from_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('applied_to_date_special_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        s_leave.to_date ? String(moment(s_leave.to_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('granted_from_date_special_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        s_leave.from_date ? String(moment(s_leave.from_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('granted_to_date_special_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        s_leave.to_date ? String(moment(s_leave.to_date).format('DD/MM/YYYY')) : ""
                                        );
                                    }
                                    if(field_list_array.includes('balance_due_special_leave'))
                                    {
                                        ws.cell(index_val,clmn_emp_id++).string(
                                        s_leave.balance_due ? String(s_leave.balance_due) : ""
                                        );
                                    }
                                });
                            }
                            total_count += privilege_leave.length + maternity_leave.length + special_leave.length;
                        }

                    })).then(async (employee) => {
                        // wb.write("form-j-register-leave-export.xlsx");

						// let file_location = Site_helper.createFiles(wb,"form-j-register-leave-export",'xlsx', req.authData.corporate_id)
                        let file_name = "form-j-register-leave-export.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/leave-module');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                        // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                        // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
                    });
                });
        } 
        catch (e) {
            return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
};
