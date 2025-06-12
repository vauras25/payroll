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
var AttendanceSummary = require('../../Model/Company/AttendanceSummary');
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const niv = require('node-input-validator');
const moment = require('moment');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const bcrypt = require("bcrypt");
const archiver = require('archiver');
const { resolve } = require('path');
const EmailHelper = require('../../Helpers/EmailHelper');
const absolutePath = resolve('');
module.exports = {
    get_employee_list: async function (req, resp, next) {
        try {
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            var start_date = req.body.wage_date_from;
            var end_date = req.body.wage_date_to;
            const options = {
                page: req.body.pageno ? req.body.pageno : 1,
                limit: req.body.perpage ? req.body.perpage : perpage,
                sort: sortoption,
            };
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            var filter_option = {};
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
            var search_option_emp = { $match: {} };
            if (req.body.emp_status) {
                if (req.body.emp_status != 'all') {
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
                search_option_emp = {
                    $match: {
                        $or: [
                            { "emp_id": { $regex: req.body.searchkey, $options: "i" } }, // Match emp_id
                            { "emp_first_name": { $regex: req.body.searchkey, $options: "i" } }, // Match emp_first_name
                            { "emp_last_name": { $regex: req.body.searchkey, $options: "i" } }, // Match emp_first_name
                        ],
                        corporate_id: req.authData.corporate_id
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
            
            var myAggregate = Employee.aggregate([
               search_option_emp,
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
                        as: "employee_details",
                    },
                },
                {
                    $match: {
                        'employee_details.leave_balance_counter': { $ne: null }
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
                        created_at: 1,
                        phone_no: 1,
                        "hod.first_name": 1,
                        "hod.last_name": 1,
                        nominee: 1,
                        nominee_dob: 1,
                        relation_with_nominee: 1,
                        is_hod: 1,
                        status: 1,
                        approval_status: 1,
                        emp_hod: 1,
                        sex: 1,
                        emp_age: {
                            $divide: [
                                { $subtract: [new Date(), "$emp_dob"] },
                                365 * 24 * 60 * 60 * 1000,
                            ],
                        },
                        created_at: 1,
                        // "client._id": 1,
                        // "client.client_code": 1,
                        "employee_details._id": 1,
                        "employee_details.leave_balance_counter": 1,
                        "employee_details.bank_details": 1,
                        // "branch._id": 1,
                        // "branch.branch_name": 1,
                        // "department._id": 1,
                        // "department.department_name": 1,
                        // "designation._id": 1,
                        // "designation.designation_name": 1,
                    },
                }
            ]);
            
            Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
                if (err) return resp.json({ status: "error", message: err.message,search_option:search_option,search_option_details:search_option_details,options:options });
                var masters = { hod_list: [] };
                await Staff.find({ status: "active", is_hod: "yes" }, "_id first_name last_name", function (err, staff) {
                    if (!err) {
                        masters.hod_list = staff;
                    }
                });
                if (employees.docs) {
                    for (var i = 0; i < employees.docs.length; i++) {
                        if (employees.docs[i].employee_details) {
                            var totalBalance = 0;
                            var totalEncashBalance = 0;
                            if (employees.docs[i].employee_details.leave_balance_counter) {
                                for (var j = 0; j < employees.docs[i].employee_details.leave_balance_counter.length; j++) {
                                    totalBalance += parseFloat(employees.docs[i].employee_details.leave_balance_counter[j].total_balance);
                                    totalEncashBalance += parseFloat(employees.docs[i].employee_details.leave_balance_counter[j].encash);
                                }
                            }
                        }
                        employees.docs[i].employee_details.total_available_balance = totalBalance;
                        employees.docs[i].employee_details.total_encash_balance = totalEncashBalance;
                    }
                }
                return resp.status(200).json({ status: "success", employees: employees, masters: masters,search_option:search_option,search_option_details:search_option_details,options:options });
            }
            );
        }
        catch (e) {
            console.log('here ------');
            
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong",search_option:search_option,search_option_details:search_option_details });
        }
    },
    get_employee_leave_list_without_paginate: async function (req, resp, next) {
        try {
            // var search_option = {
            //     $match: {
            //         $and: [
            //         { corporate_id: req.authData.corporate_id },
            //         { status: {$in: ["active","approved"] }},
            //         { parent_hods: { $in: [req.authId] } },
            //         ],
            //     },
            // };
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);

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

            if (req.body.row_checked_all === "true") {
                if (typeof req.body.unchecked_row_ids == "string") {
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                }
                else {
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                if (typeof req.body.checked_row_ids == "string") {
                    var ids = JSON.parse(req.body.checked_row_ids);
                }
                else {
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
                        as: "employee_details",
                    },
                },
                {
                    $match: {
                        'employee_details.leave_balance_counter': { $ne: null }
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
                        created_at: 1,
                        phone_no: 1,
                        "hod.first_name": 1,
                        "hod.last_name": 1,
                        nominee: 1,
                        nominee_dob: 1,
                        relation_with_nominee: 1,
                        is_hod: 1,
                        status: 1,
                        approval_status: 1,
                        emp_hod: 1,
                        sex: 1,
                        emp_age: {
                            $divide: [
                                { $subtract: [new Date(), "$emp_dob"] },
                                365 * 24 * 60 * 60 * 1000,
                            ],
                        },
                        created_at: 1,
                        "employee_details._id": 1,
                        "employee_details.leave_balance_counter": 1,
                        "employee_details.bank_details": 1,
                    },
                }
            ]).then(async (employee) => {
                // var masters = { hod_list: [] };
                // await Staff.find({ status: "active", is_hod: "yes" },"_id first_name last_name",function (err, staff) {
                //     if (!err) {
                //         masters.hod_list = staff;
                //     }
                // });
                await Promise.all(employee.map(async function (empdata) {
                    if (empdata.employee_details) {
                        var totalBalance = 0;
                        var totalEncashBalance = 0;
                        if (empdata.employee_details.leave_balance_counter) {
                            for (var j = 0; j < empdata.employee_details.leave_balance_counter.length; j++) {
                                totalBalance += parseFloat(empdata.employee_details.leave_balance_counter[j].total_balance);
                                totalEncashBalance += parseFloat(empdata.employee_details.leave_balance_counter[j].encash);
                            }
                        }
                    }
                    empdata.employee_details.total_available_balance = totalBalance;
                    empdata.employee_details.total_encash_balance = totalEncashBalance;
                }));

                return resp.status(200).json({ status: "success", employees: employee });
            });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    edit_leave_data: async function (req, resp, next) {
        try {
            var corporate_id = req.authData.corporate_id;
            const v = new Validator(req.body, {
                employee_id: "required|array",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: "val_err", message: "Validation error", val_msg: v.errors, });
            }
            else {
                let leaveArray = {};
                if (req.body.employee_id.length > 0) {
                    for (var i = 0; i < req.body.employee_id.length; i++) {
                        var employeeData = await Employee.findOne({ _id: req.body.employee_id[i] });
                        if (employeeData) {
                            var employeeDetails = await EmployeeDetails.findOne({ employee_id: req.body.employee_id[i] });
                            if (employeeDetails) {
                                var document2 = {
                                    employee_id: employeeData._id,
                                    emp_id: employeeData.emp_id,
                                    emp_first_name: employeeData.emp_first_name,
                                    emp_last_name: employeeData.emp_last_name,
                                    leave_balance_counter: employeeDetails.leave_balance_counter,
                                };
                                leaveArray[employeeData.emp_id] = document2;
                            }
                        }
                    }
                    return resp.status(200).json({ status: "success", data: leaveArray });
                }
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    update_leave_data: async function (req, resp, next) {
        try {
            if (req.body.leave_balance.length > 0) {
                var employeeIdArray = [];
                for (var i = 0; i < req.body.leave_balance.length; i++) {
                    employeeIdArray.push(req.body.leave_balance[i].employee_id);
                    var actu_attendence_month = parseFloat(new Date().getMonth()) + 1;
                    if (req.body.leave_balance[i]._id) {
                        var existData = await LeaveLog.findOne({
                            "employee_id": req.body.leave_balance[i].employee_id,
                            "employee_details_leave_id": req.body.leave_balance[i]._id,
                            "month": actu_attendence_month.toString(),
                            "year": new Date().getFullYear().toString(),
                            "status": "pending"
                        });
                        if (existData) {
                            var document2 = {
                                "corporate_id": req.authData.corporate_id,
                                "employee_id": req.body.leave_balance[i].employee_id,
                                "employee_details_leave_id": req.body.leave_balance[i]._id,
                                "encash": parseFloat(req.body.leave_balance[i].encash) + existData.encash,
                                "extinguish": parseFloat(req.body.leave_balance[i].extinguish) + existData.extinguish,
                                "month": actu_attendence_month,
                                "year": new Date().getFullYear(),
                                "status": "pending",
                            };
                            await LeaveLog.updateOne({ "employee_id": req.body.leave_balance[i].employee_id, "employee_details_leave_id": req.body.leave_balance[i]._id, "status": "pending" }, { $set: document2 });
                            var paydays = parseFloat(req.body.leave_balance[i].encash) + existData.encash;
                        }
                        else {
                            var document2 = {
                                "corporate_id": req.authData.corporate_id,
                                "employee_id": req.body.leave_balance[i].employee_id,
                                "employee_details_leave_id": req.body.leave_balance[i]._id,
                                "encash": req.body.leave_balance[i].encash,
                                "extinguish": req.body.leave_balance[i].extinguish,
                                "month": actu_attendence_month,
                                "year": new Date().getFullYear(),
                                "status": "pending",
                            };
                            await LeaveLog.create(document2);
                            var paydays = req.body.leave_balance[i].encash;
                        }
                        var document = {
                            "leave_balance_counter.$.leave_temp_head_id": req.body.leave_balance[i].leave_temp_head_id,
                            "leave_balance_counter.$._id": req.body.leave_balance[i]._id,
                            // "leave_balance_counter.$.leave_type_name": req.body.leave_balance[i].leave_type_name,
                            // "leave_balance_counter.$.abbreviation": req.body.leave_balance[i].abbreviation,
                            "leave_balance_counter.$.available": parseFloat(req.body.leave_balance[i].available) - parseFloat(req.body.leave_balance[i].encash),
                            // "leave_balance_counter.$.consumed": req.body.leave_balance[i].consumed,
                            "leave_balance_counter.$.total_balance": parseFloat(req.body.leave_balance[i].total_balance) - parseFloat(req.body.leave_balance[i].encash),
                            // "leave_balance_counter.$.tenure": req.body.leave_balance[i].tenure,
                            // "leave_balance_counter.$.quota": req.body.leave_balance[i].quota,
                            // "leave_balance_counter.$.carryover": req.body.leave_balance[i].carryover,
                            "leave_balance_counter.$.encash": paydays,
                            "leave_balance_counter.$.extinguish": req.body.leave_balance[i].extinguish,
                        };
                        EmployeeDetails.updateOne({ employee_id: req.body.leave_balance[i].employee_id, "leave_balance_counter._id": req.body.leave_balance[i]._id, }, { $set: document }, function (err, emp_det) {
                            if (err) {
                                return resp.status(200).send({ status: "error", message: err.message });
                            }
                        });
                    }
                }
                var currdate = new Date();

                var epfo_temp = await Site_helper.get_gov_epfo_data(req);
                var esic_temp = await Site_helper.get_gov_esic_data(req);
                var comp_data = await req.companyData;
                if (employeeIdArray.length > 0) {
                    var unqueEmpArray = employeeIdArray.filter((value, index, array) => array.indexOf(value) === index);
                    unqueEmpArray.map(async function (empId) {
                        var emp_data = await Employee.findOne({ '_id': mongoose.Types.ObjectId(empId) });
                        var emp = emp_data;
                        var calculate_advance = 'true';
                        var emp_id = emp_data.emp_id;
                        var corporate_id = emp_data.corporate_id;
                        var empData = await Employee.findOne({ _id: mongoose.Types.ObjectId(empId) });
                        var actu_attendence_month = parseFloat(new Date().getMonth()) + 1;
                        if (empData) {
                            var data = {
                                "empId": empData.emp_id,
                                "empObjId": empData._id,
                                "year": new Date().getFullYear().toString(),
                                "month": actu_attendence_month,
                                "action_type": "update_time_leave_summary",
                                "corporateId": empData.corporate_id
                            }
                            await Site_helper.update_leave_summary(data);
                        }

                        var existData = await LeaveLog.find({
                            "employee_id": mongoose.Types.ObjectId(empId),
                            "month": actu_attendence_month.toString(),
                            "year": new Date().getFullYear().toString(),
                            "status": "pending"
                        });
                        var totalEncashBalance = 0;
                        existData.map(function (encash) {
                            totalEncashBalance += parseFloat(encash.encash);
                        });
                        var emp_details = await EmployeeDetails.findOne({ 'employee_id': mongoose.Types.ObjectId(empId) });
                        var emp_data = emp_details;
                        var gross_salary = parseFloat(emp_data.employment_hr_details.gross_salary);
                        var salary_temp_data = emp_data.template_data.salary_temp_data;
                        var pre_total_pt = 0;
                        var pre_salary_pt = 0;
                        var emp_state = emp_details.emp_address.state;
                        var master_gross_salary = gross_salary;
                        var salary_temp_data = emp_data.template_data.salary_temp_data;
                        var lwf_temp_data = emp_data.template_data.lwf_temp_data;

                        var monthdays = new Date(new Date().getFullYear(), actu_attendence_month, 0).getDate();


                        var salary_breakup = await Site_helper.get_salary_breakup(req, salary_temp_data, gross_salary, emp_data, totalEncashBalance, monthdays);

                        if (salary_breakup) {
                            var where_condition = { 'emp_id': emp_data.emp_id, wage_month: actu_attendence_month, wage_year: new Date().getFullYear(), corporate_id: emp_data.corporate_id };
                            var employeeMonthlyReportData = await EmployeeMonthlyReport.findOne(where_condition);
                            var pre_salary_data = employeeMonthlyReportData;
                            var pre_monthly_wage_amount = 0;
                            var pre_master_data = '';
                            if (pre_salary_data) {
                                if (pre_salary_data.salary_report) {
                                    pre_master_data = pre_salary_data.master_report;
                                    pre_monthly_wage_amount = (pre_salary_data.total_data.total_pf_wages - pre_salary_data.salary_report.total_pf_wages);
                                }
                                else {
                                    pre_monthly_wage_amount = pre_salary_data.total_data.total_pf_wages;
                                }
                            }
                            if (salary_breakup.restricted_pf === "yes") {
                                //var pre_monthly_wage_amount=(pre_salary_data?pre_salary_data.total_data.total_pf_wages:0);
                                var template_wage_ceiling = salary_breakup.template_wage_ceiling;
                                var avaiable_wage_amount = (template_wage_ceiling - pre_monthly_wage_amount);
                                var module_wage_amount = (salary_breakup.total_pf_wages < parseFloat(avaiable_wage_amount) ? salary_breakup.total_pf_wages : parseFloat(avaiable_wage_amount));
                            }
                            else {
                                var module_wage_amount = salary_breakup.total_pf_wages;
                            }
                            var salary_earning_data = {
                                heads: salary_breakup.heads,
                                ctc: salary_breakup.ctc,
                                total_pf_bucket: salary_breakup.total_pf_wages,
                                //total_pf_wages:salary_breakup.restrict_pf_wages,
                                total_pf_wages: module_wage_amount,
                                total_esic_bucket: salary_breakup.total_esi_wages,
                                total_esic_wages: salary_breakup.restrict_esic_wages,
                                total_pt_wages: salary_breakup.total_pt_wages,
                                total_tds_wages: salary_breakup.total_tds_wages,
                                total_ot_wages: salary_breakup.total_ot_wages,
                                total_gratuity_wages: salary_breakup.total_gratuity_wages,
                                net_take_home: salary_breakup.net_take_home,
                                voluntary_pf_amount: salary_breakup.voluntary_pf_amount,
                                gross_earning: salary_breakup.gross_earning,
                                gross_deduct: salary_breakup.gross_deduct,
                                total_bonus_wages: salary_breakup.total_bonus_wages,
                                advance_recovered: salary_breakup.advance_recovered,
                                bank_ins_referance_id: '',
                                pf_challan_referance_id: '',
                                esic_challan_referance_id: ''
                            };

                            if (pre_salary_data) {
                                pre_total_pt = (pre_salary_data.total_data.total_pt_amount ? pre_salary_data.total_data.total_pt_amount : 0);
                                if (pre_salary_data.salary_report) {
                                    pre_salary_pt = (pre_salary_data.salary_report.pt_amount ? pre_salary_data.salary_report.pt_amount : 0);
                                    var total_earning_data = {
                                        'total_earning': (salary_earning_data.gross_earning + (pre_salary_data.total_data.total_earning - pre_salary_data.salary_report.gross_earning)),
                                        'total_pf_bucket': (salary_earning_data.total_pf_bucket + (pre_salary_data.total_data.total_pf_bucket - pre_salary_data.salary_report.total_pf_bucket)),
                                        'total_pf_wages': (salary_earning_data.total_pf_wages + (pre_salary_data.total_data.total_pf_wages - pre_salary_data.salary_report.total_pf_wages)),
                                        'total_esic_bucket': (salary_earning_data.total_esic_bucket + (pre_salary_data.total_data.total_esic_bucket - pre_salary_data.salary_report.total_esic_bucket)),
                                        'total_esic_wages': (salary_earning_data.total_esic_wages + (pre_salary_data.total_data.total_esic_wages - pre_salary_data.salary_report.total_esic_wages)),
                                        'total_pt_wages': (salary_earning_data.total_pt_wages + (pre_salary_data.total_data.total_pt_wages - pre_salary_data.salary_report.total_pt_wages)),
                                        'bank_ins_referance_id': pre_salary_data.total_data.bank_ins_referance_id == '' ? '' : pre_salary_data.total_data.bank_ins_referance_id,
                                        'pf_challan_referance_id': pre_salary_data.total_data.pf_challan_referance_id == '' ? '' : pre_salary_data.total_data.pf_challan_referance_id,
                                        'esic_challan_referance_id': pre_salary_data.total_data.esic_challan_referance_id == '' ? '' : pre_salary_data.total_data.esic_challan_referance_id,
                                    };
                                }
                                else {
                                    var total_earning_data = {
                                        'total_earning': salary_breakup.gross_earning,
                                        'total_pf_bucket': salary_breakup.total_pf_wages,
                                        'total_pf_wages': module_wage_amount,
                                        'total_esic_bucket': salary_breakup.total_esi_wages,
                                        'total_esic_wages': salary_breakup.restrict_esic_wages,
                                        'total_pt_wages': salary_breakup.total_pt_wages,
                                        'bank_ins_referance_id': '',
                                        'pf_challan_referance_id': '',
                                        'esic_challan_referance_id': '',
                                    };
                                }
                            }
                            else {
                                var total_earning_data = {
                                    'total_earning': salary_breakup.gross_earning,
                                    'total_pf_bucket': salary_breakup.total_pf_wages,
                                    'total_pf_wages': module_wage_amount,
                                    'total_esic_bucket': salary_breakup.total_esi_wages,
                                    'total_esic_wages': salary_breakup.restrict_esic_wages,
                                    'total_pt_wages': salary_breakup.total_pt_wages,
                                    'bank_ins_referance_id': '',
                                    'pf_challan_referance_id': '',
                                    'esic_challan_referance_id': '',
                                };
                            }
                            var att_summ = await AttendanceSummary.findOne({ 'emp_id': emp.emp_id, 'attendance_month': actu_attendence_month.toString(), 'attendance_year': new Date().getFullYear().toString() });


                            salary_earning_data.lwf_data = await Site_helper.calculate_lwf(salary_breakup.gross_earning, actu_attendence_month, new Date().getFullYear(), comp_data, lwf_temp_data);
                            //console.log('asdasdasd',salary_earning_data.lwf_data);

                            salary_earning_data.esic_data = await Site_helper.calculate_esic(esic_temp, salary_earning_data.total_esic_wages, gross_salary);
                            salary_earning_data.pf_data = await Site_helper.calculate_pf(epfo_temp, salary_earning_data.total_pf_wages, salary_temp_data, emp_data.employment_hr_details);

                            total_earning_data.esic_data = await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages, gross_salary);
                            total_earning_data.pf_data = await Site_helper.calculate_pf(epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, emp_data.employment_hr_details);

                            var p_tax_amount = await Site_helper.calculate_pt(req, currdate, emp_state, total_earning_data.total_pt_wages ? total_earning_data.total_pt_wages : 0);
                            var staffData = await Staff.findOne({ _id: emp.emp_hod });
                            //console.log(p_tax_amount);
                            var module_pt_amount = (p_tax_amount - (pre_total_pt - pre_salary_pt));
                            salary_earning_data.pt_amount = module_pt_amount;
                            salary_earning_data.paydays = totalEncashBalance;

                            total_earning_data.total_pt_amount = p_tax_amount;
                            var emp_data = {
                                _id: emp._id,
                                emp_id: emp.emp_id,
                                emp_first_name: emp.emp_first_name,
                                emp_last_name: emp.emp_last_name,
                                emp_emp_dob: emp.emp_dob,
                                emp_pan_no: emp.pan_no,
                                emp_aadhar_no: emp.aadhar_no,
                                emp_mob: emp.mobile_no,
                                emp_email_id: emp.email_id,
                                new_pf_no: (emp_details.employment_details ? emp_details.employment_details.new_pf_no : 'NA'),
                                esic_no: (emp_details.employment_details ? emp_details.employment_details.esic_no : 'NA'),
                                date_of_join: emp_details.employment_hr_details.date_of_join,
                                sex: emp.sex,
                                age: emp.age,
                                EPF: emp_details.employment_hr_details.pf_applicable,
                                EPS: emp_details.employment_hr_details.pension_applicable,
                                Restrict_PF: emp_details.template_data.salary_temp_data.restricted_pf,
                                ESIC: (gross_salary > esic_temp.wage_ceiling ? 'NO' : 'YES'),
                                Reg_Type: emp_details.template_data.attendance_temp_data.register_type,
                                emp_uan_no: (emp_details.pf_esic_details ? emp_details.pf_esic_details.curr_er_epfo_details.uan_no : 'NA'),
                                attendance_summaries: att_summ,
                                hod: staffData ? staffData.first_name + " " + staffData.last_name : ' ',
                                branch: emp.branch,
                                designation: emp.designation,
                                department: emp.department,
                                client: emp.client,
                            };
                            var insert_data = {
                                corporate_id: emp.corporate_id,
                                emp_db_id: mongoose.Types.ObjectId(emp._id),
                                emp_id: emp.emp_id,
                                wage_month: actu_attendence_month,
                                wage_year: new Date().getFullYear(),
                                encash_payment_report: salary_earning_data,
                                total_data: total_earning_data,
                                emp_data: emp_data,
                                attendance_summaries: att_summ,
                                ins_generate: 'no',
                                pf_generate: 'no',
                                esic_generate: 'no',
                                status: 'active',
                            }
                            if (pre_master_data == '') {
                                //insert_data.attendance_summaries= emp.attendance_summaries[0];
                                var master_salary_breakup = emp_data.salary_breakups.find((breakup) =>{
                                    const effective_from = new Date(breakup.effective_from) 
                                    if((effective_from.getMonth() == +actu_attendence_month) && (effective_from.getFullYear() ==  new Date().getFullYear())){
                                        return breakup;
                                    }
                                });
                                if(!master_salary_breakup){
                                    master_salary_breakup = await Site_helper.get_salary_breakup(req, salary_temp_data, master_gross_salary, emp_data, monthdays, monthdays);
                                }
                                insert_data.master_report = master_salary_breakup;
                            }
                            var where_condition = { 'emp_id': emp.emp_id, emp_db_id: mongoose.Types.ObjectId(emp._id), wage_month: actu_attendence_month, wage_year: new Date().getFullYear(), corporate_id: emp.corporate_id };
                            await EmployeeMonthlyReport.findOneAndUpdate(where_condition, insert_data, { upsert: true, new: true, setDefaultsOnInsert: true });

                        }
                    });
                }
                return resp.status(200).send({ status: "success", message: "Leave details has been updated successfully", emp_det: '' });
            }
            else {
                return resp.status(200).json({ status: "success", emp_det: '' });
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    process_payout_leave_data: async function (req, resp, next) {
        try {
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            var search_option_details = { $match: {} };
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            const options = {
                page: req.body.pageno ? req.body.pageno : 1,
                limit: req.body.perpage ? req.body.perpage : perpage,
                sort: sortoption,
            };
            var filter_option = {};
            if (req.body.bank_name) {
                // var branch_ids = JSON.parse(req.body.branch_id);
                // branch_ids = branch_ids.map(function (el) {
                //     return mongoose.Types.ObjectId(el);
                // });
                // search_option_details.$match[
                // "employee_details.bank_details.bank_name"
                // ] = $regex: req.body.pan_no;
                search_option_details = {
                    $match: {
                        "employee_details.bank_details.bank_name": { $regex: req.body.bank_name },
                    }
                };
            }
            // if(start_month && start_year || end_month && end_year){
            if (start_month && start_year) {
                // var search_option = {
                //     $match: {
                //         $and: [
                //         { corporate_id: req.authData.corporate_id },
                //         {$or:[ 
                //             {'year': {$gt: start_year.toString() }}, 
                //             { $and:[
                //                 {'year': {$gte: start_year.toString() }},
                //                 {'month': {$gte: start_month.toString() }}
                //                 ]
                //             } 
                //             ]
                //         },
                //         { $or:[ 
                //             {'year': {$lt: end_year.toString() }}, 
                //             { $and:[
                //                 {'year': {$lte: end_year.toString() }},
                //                 {'month': {$lte: end_month.toString() }}
                //                 ]
                //             } 
                //             ]
                //         }
                //         ],
                //     },
                // };
                var search_option = {
                    $match: {
                        $and: [
                            { corporate_id: req.authData.corporate_id },
                            { month: start_month.toString() },
                            { year: start_year.toString() },
                        ],
                    }
                }
                // search_option_details.$match['month']=  parseInt(start_month);
                // search_option_details.$match['year']= parseInt(start_year);
            }
            else {
                var search_option = {
                    $match: {
                        $and: [
                            { corporate_id: req.authData.corporate_id },
                            // { approval_status: "approved" },
                        ],
                    },
                };
            }
            if (req.body.row_checked_all === "true") {
                if (typeof req.body.unchecked_row_ids == "string") {
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                }
                else {
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match.employee_id = { $nin: ids };
                }
            } else {
                if (typeof req.body.checked_row_ids == "string") {
                    var ids = JSON.parse(req.body.checked_row_ids);
                }
                else {
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match.employee_id = { $in: ids };
                }
            }
            var myAggregate = LeaveLog.aggregate([
                search_option,
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "employee_id",
                        foreignField: "employee_id",
                        as: "employee_details",
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee_id",
                        foreignField: "_id",
                        as: "employee",
                    },
                },
                search_option_details,
                {
                    $group: {
                        _id: "$employee_id",
                        leave_id: { $first: "$_id" },
                        // employee_id: "$employee_id",
                        corporate_id: { $first: "$corporate_id" },
                        employee_id: { $first: "$employee_id" },
                        employee_details_leave_id: { $first: "$employee_details_leave_id" },
                        encash: { $first: "$encash" },
                        extinguish: { $first: "$extinguish" },
                        month: { $first: "$month" },
                        year: { $first: "$year" },
                        status: { $first: "$status" },
                        total_encash_value: { $sum: "$encash" },
                        employee_details: { $first: "$employee_details" },
                        employee: { $first: "$employee" },

                    }
                },
                {
                    $project: {
                        _id: 1,
                        leave_id: 1,
                        corporate_id: 1,
                        employee_id: 1,
                        employee_details_leave_id: 1,
                        encash: 1,
                        extinguish: 1,
                        month: 1,
                        year: 1,
                        status: 1,
                        total_encash_value: 1,
                        "employee.emp_id": 1,
                        "employee.emp_first_name": 1,
                        "employee.emp_last_name": 1,
                        "employee_details._id": 1,
                        "employee_details.leave_balance_counter": 1,
                        "employee_details.bank_details": 1,
                    },
                },
            ]);
            LeaveLog.aggregatePaginate(myAggregate, options, async function (err, leaveLog) {
                if (err) return resp.json({ status: "error", message: err.message });
                return resp.status(200).json({ status: "success", data: leaveLog });
            });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    encash_leave_payment: async function (req, resp, next) {
        try {
            var search_option = {
                $match: {
                    $and: [
                        { corporate_id: req.authData.corporate_id },
                    ],
                },
            };
            if (req.body.row_checked_all === "true") {
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match.employee_id = { $nin: ids };
                }
            } else {
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match.employee_id = { $in: ids };
                }
            }
            var data = await LeaveLog.aggregate([search_option]);
            // LeaveLog.aggregatePaginate(myAggregate,options,async function (err, leaveLog) {
            //     if (err) return resp.json({ status: "error", message: err.message });
            //     return resp.status(200).json({ status: "success", data: leaveLog });
            // });
            return resp.status(200).json({ status: "success", data: data });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    leave_encashment_report: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                    .status(200)
                    .send({
                        status: "val_err",
                        message: "Validation error",
                        val_msg: v.errors,
                    });
            } else {
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
                var sortbyfield = req.body.sortbyfield;
                if (sortbyfield) {
                    var sortoption = {};
                    sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
                } else {
                    var sortoption = { created_at: -1 };
                }
                const options = {
                    page: req.body.pageno,
                    limit: req.body.perpage ? req.body.perpage : perpage,
                    sort: sortoption,
                };
                var search_option = {
                    $match: {
                        $and: [
                            { corporate_id: req.authData.corporate_id },
                            { parent_hods: { $in: [req.authData.user_id] } },
                            { approval_status: "approved" },
                        ],
                    },
                };
                var search_option_details = { $match: {} };

                if (req.body.designation_id) {
                    var designation_ids = JSON.parse(JSON.stringify(req.body.designation_id));
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
                    var client_ids = JSON.parse(JSON.stringify(req.body.client_id));

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
                            from: 'employee_monthly_reports',
                            "let": { "emp_db_idVar": "$_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] } },
                                            {
                                                $or: [
                                                    { 'wage_year': { $gt: start_year } },
                                                    {
                                                        $and: [
                                                            { 'wage_year': { $gte: start_year } },
                                                            { 'wage_month': { $gte: start_month } }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { 'wage_year': { $lt: end_year } },
                                                    {
                                                        $and: [
                                                            { 'wage_year': { $lte: end_year } },
                                                            { 'wage_month': { $lte: end_month } }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            ],
                            as: 'employee_monthly_reports',
                        }
                    },
                    {
                        $lookup: {
                            from: "leave_logs",
                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$employee_id", "$$emp_id_var"] },
                                        $and: [
                                            {
                                                $or: [
                                                    { 'year': { $gt: start_year.toString() } },
                                                    {
                                                        $and: [
                                                            { 'year': { $gte: start_year.toString() } },
                                                            { 'month': { $gte: start_month.toString() } }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { 'year': { $lt: end_year.toString() } },
                                                    {
                                                        $and: [
                                                            { 'year': { $lte: end_year.toString() } },
                                                            { 'month': { $lte: end_month.toString() } }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ],
                                    },
                                },
                            ],
                            as: "encashed",
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
                            employee_monthly_reports: {
                                $arrayElemAt: ["$employee_monthly_reports", 0],
                            },
                        },
                    },
                    {
                        $unwind: "$employee_monthly_reports.encash_payment_report",
                    },
                    {
                        $project: {
                            _id: 1,
                            corporate_id: 1,
                            userid: 1,
                            emp_id: 1,
                            emp_first_name: 1,
                            emp_last_name: 1,
                            "employee_details.bank_details": 1,
                            // "employee_details.leave_balance_counter": 1,
                            // "employee_monthly_reports.ins_generate": "$employee_monthly_reports.ins_generate",
                            "employee_monthly_reports.encash_payment_report.bank_ins_referance_id": "$employee_monthly_reports.encash_payment_report.bank_ins_referance_id",
                            "employee_monthly_reports.encash_payment_report.paydays": "$employee_monthly_reports.encash_payment_report.paydays",
                            // "employee_monthly_reports.esic_generate": "$employee_monthly_reports.esic_generate",
                            // "employee_monthly_reports.pf_generate": "$employee_monthly_reports.pf_generate",
                            // "employee_monthly_reports.encash_payment_report.heads": "$employee_monthly_reports.encash_payment_report.heads",
                            "employee_monthly_reports.encash_payment_report.gross_deduct": "$employee_monthly_reports.encash_payment_report.gross_deduct",
                            "employee_monthly_reports.encash_payment_report.net_take_home": "$employee_monthly_reports.encash_payment_report.net_take_home",
                            // "employee_monthly_reports.encash_payment_report.encashed_head":"$encashed",
                        },
                    },
                ]);
                Employee.aggregatePaginate(myAggregate, options, async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    if (employees.docs.length > 0) {
                        employees.docs.map(function (employee) {
                            if (employee.employee_details) {
                                if (employee.employee_details.leave_balance_counter) {
                                    if (employee.employee_details.leave_balance_counter.length > 0) {
                                        if (employee.employee_monthly_reports.encash_payment_report.encashed_head) {
                                            if (employee.employee_monthly_reports.encash_payment_report.encashed_head.length > 0) {
                                                employee.employee_monthly_reports.encash_payment_report.encashed_head.map(function (en_head) {
                                                    var headDataExist = employee.employee_details.leave_balance_counter.find(element => en_head.employee_details_leave_id.equals(element['_id']));
                                                    if (headDataExist) {
                                                        en_head.head_data = {
                                                            '_id': headDataExist._id,
                                                            'head_id': headDataExist.leave_temp_head_id,
                                                            'leave_type_name': headDataExist.leave_type_name,
                                                            'abbreviation': headDataExist.abbreviation,
                                                        };
                                                    }
                                                });
                                            }
                                        }

                                    }
                                }
                            }
                        });
                    }
                    return resp.status(200).json({ status: "success", employees: employees, });
                });
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    leave_ledgerl_report: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                // pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                    .status(200)
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
                //             { corporate_id: req.authData.corporate_id },
                //             { status: { $in: ["active", "approved"] } },
                //             { parent_hods: { $in: [req.authId] } },
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
                    if (req.body.emp_status != 'all') {
                        search_option.$match.status = { $eq: req.body.emp_status };
                    }
                }
                if (req.body.searchkey) {
                    search_option = {
                        $match: {
                            $text: { $search: req.body.searchkey },
                            corporate_id: req.authData.corporate_id,
                            parent_hods: { $in: [req.authId] },
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
                var companyDetails = await Company.findOne({ _id: req.authId });
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
                            'employee_details.leave_balance_counter': { $ne: null }
                        }
                    },
                    {
                        $lookup: {
                            from: "revisions",

                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                        $and: [
                                            {
                                                $or: [
                                                    { 'revision_year': { $gt: start_year } },
                                                    {
                                                        $and: [
                                                            { 'revision_year': { $gte: start_year } },
                                                            { 'revision_month': { $gte: start_month } }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { 'revision_year': { $lt: end_year } },
                                                    {
                                                        $and: [
                                                            { 'revision_year': { $lte: end_year } },
                                                            { 'revision_month': { $lte: end_month } }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ],
                                    },
                                },
                            ],
                            as: "opening_balance",
                        },
                    },
                    {
                        $lookup: {
                            from: "leave_ledgerls",

                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$employee_id", "$$emp_id_var"] },
                                        $and: [
                                            {
                                                $or: [
                                                    { 'year': { $gt: start_year } },
                                                    {
                                                        $and: [
                                                            { 'year': { $gte: start_year } },
                                                            { 'month': { $gte: start_month } }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { 'year': { $lt: end_year } },
                                                    {
                                                        $and: [
                                                            { 'year': { $lte: end_year } },
                                                            { 'month': { $lte: end_month } }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ],
                                    },
                                },
                            ],
                            as: "lapsed",
                        },
                    },
                    {
                        $lookup: {
                            from: "leave_logs",
                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$employee_id", "$$emp_id_var"] },
                                        $and: [
                                            {
                                                $or: [
                                                    { 'year': { $gt: start_year.toString() } },
                                                    {
                                                        $and: [
                                                            { 'year': { $gte: start_year.toString() } },
                                                            { 'month': { $gte: start_month.toString() } }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { 'year': { $lt: end_year.toString() } },
                                                    {
                                                        $and: [
                                                            { 'year': { $lte: end_year.toString() } },
                                                            { 'month': { $lte: end_month.toString() } }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ],
                                    },
                                },
                            ],
                            as: "encashed",
                        },
                    },
                    {
                        $lookup: {
                            from: 'employee_monthly_reports',
                            "let": { "emp_db_idVar": "$_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] } },
                                            {
                                                $or: [
                                                    { 'wage_year': { $gt: parseInt(start_year) } },
                                                    {
                                                        $and: [
                                                            { 'wage_year': { $gte: parseInt(start_year) } },
                                                            { 'wage_month': { $gte: parseInt(start_month) } }
                                                        ]
                                                    }]
                                            },
                                            {
                                                $or: [
                                                    { 'wage_year': { $lt: parseInt(end_year) } },
                                                    {
                                                        $and: [
                                                            { 'wage_year': { $lte: parseInt(end_year) } },
                                                            { 'wage_month': { $lte: parseInt(end_month) } }
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
                    {
                        $lookup: {
                            from: 'employee_leave_summary_logs',
                            "let": { "emp_db_idVar": "$_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] } },
                                            {
                                                $or: [
                                                    { 'wage_year': { $gt: parseInt(start_year) } },
                                                    {
                                                        $and: [
                                                            { 'wage_year': { $gte: parseInt(start_year) } },
                                                            { 'wage_month': { $gte: parseInt(start_month) } }
                                                        ]
                                                    }]
                                            },
                                            {
                                                $or: [
                                                    { 'wage_year': { $lt: parseInt(end_year) } },
                                                    {
                                                        $and: [
                                                            { 'wage_year': { $lte: parseInt(end_year) } },
                                                            { 'wage_month': { $lte: parseInt(end_month) } }
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
                            // "leave_added.template_data.leave_temp_data.template_data": 1,
                            // "availed.leave_balance_counter": 1,
                            // "opening_balance.template_data.leave_temp_data": 1,
                            // "lapsed": 1,
                            // "encashed": 1,
                            // "employee_leaves": 1,
                            "paydays": { $sum: "$employee_monthly_reports.attendance_summaries.paydays" },
                            "employee_leave_summary_logs": 1,
                        },
                    }
                ]).then(async (employeeies) => {
                    var companyLeaveHead = await LeaveTempHead.find({ corporate_id: req.authData.corporate_id });
                    await Promise.all(employeeies.map(async function (employee, index) {
                        var leave_added = [];
                        var leave_availed = [];
                        var leave_lapsed = [];
                        var leave_encashed = [];
                        var leave_carry_forward = [];
                        if (employee.employee_leave_summary_logs) {
                            if (employee.employee_leave_summary_logs.length > 0) {
                                employee.employee_leave_summary_logs.map(function (summary_leave) {
                                    if (summary_leave.type === 'opening') {
                                        employee.opening_balance = summary_leave.history;
                                    }
                                    if (summary_leave.type === 'closing') {
                                        employee.closing_balance = summary_leave.history;
                                        employee.availed = summary_leave.history;
                                    }
                                    if (summary_leave.type === 'earning') {
                                        summary_leave.history.map(function (earning) {
                                            leave_added.push(earning);
                                        });
                                    }
                                    // if(summary_leave.type === 'availed'){
                                    //     summary_leave.history.map(function(earning){
                                    //         leave_availed.push(earning);
                                    //     });
                                    // }
                                    if (summary_leave.type === 'lapsed') {
                                        summary_leave.history.map(function (earning) {
                                            leave_lapsed.push(earning);
                                        });
                                    }
                                    if (summary_leave.type === 'encashed') {
                                        summary_leave.history.map(function (earning) {
                                            leave_encashed.push(earning);
                                        });
                                    }
                                    if (summary_leave.type === 'carry_forward') {
                                        summary_leave.history.map(function (earning) {
                                            leave_carry_forward.push(earning);
                                        });
                                    }
                                });
                            }
                        }
                        var holder = {};
                        leave_added.forEach(function (d) {
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

                        // var holder_a = {};
                        // leave_availed.forEach(function(d) {
                        //     if (holder_a.hasOwnProperty(d.abbreviation)) {
                        //         holder_a[d.abbreviation] = holder_a[d.abbreviation] + d.balance;
                        //     } else {
                        //         holder_a[d.abbreviation] = d.balance;
                        //     }
                        // });

                        // var leave_availed = [];

                        // for (var prop in holder_a) {
                        //     leave_availed.push({ abbreviation: prop, balance: holder_a[prop], head_id: holder_a[prop] });
                        // }
                        // employee.availed = leave_availed;

                        var holder_b = {};
                        leave_lapsed.forEach(function (d) {
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
                        leave_encashed.forEach(function (d) {
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
                        leave_carry_forward.forEach(function (d) {
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

                        if (!employee.opening_balance) {
                            var openingBalance = [];
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                openingBalance.push({
                                    "head_id": companyLeavetempHeads._id,
                                    "abbreviation": companyLeavetempHeads.abbreviation,
                                    "balance": 0
                                });
                            })
                            employee.opening_balance = openingBalance;
                        }
                        if (!employee.closing_balance) {
                            var closingBalance = [];
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                closingBalance.push({
                                    "head_id": companyLeavetempHeads._id,
                                    "abbreviation": companyLeavetempHeads.abbreviation,
                                    "balance": 0
                                });
                            })
                            employee.closing_balance = closingBalance;
                        }
                        if (employee.leave_added.length == 0) {
                            var leaveAdded = [];
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                leaveAdded.push({
                                    "head_id": companyLeavetempHeads._id,
                                    "abbreviation": companyLeavetempHeads.abbreviation,
                                    "balance": 0
                                });
                            });
                            employee.leave_added = leaveAdded;
                        }
                        if (!employee.availed) {
                            var leaveAvailed = [];
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                leaveAvailed.push({
                                    "head_id": companyLeavetempHeads._id,
                                    "abbreviation": companyLeavetempHeads.abbreviation,
                                    "balance": 0
                                });
                            });
                            employee.availed = leaveAvailed;
                        }
                        if (employee.lapsed.length == 0) {
                            var leaveLapsed = [];
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                leaveLapsed.push({
                                    "head_id": companyLeavetempHeads._id,
                                    "abbreviation": companyLeavetempHeads.abbreviation,
                                    "balance": 0
                                });
                            });
                            employee.lapsed = leaveLapsed;
                        }
                        if (employee.encashed.length == 0) {
                            var leaveEncashed = [];
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                leaveEncashed.push({
                                    "head_id": companyLeavetempHeads._id,
                                    "abbreviation": companyLeavetempHeads.abbreviation,
                                    "balance": 0
                                });
                            });
                            employee.encashed = leaveEncashed;
                        }
                        if (employee.carry_forward.length == 0) {
                            var leaveCarryForward = [];
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                leaveCarryForward.push({
                                    "head_id": companyLeavetempHeads._id,
                                    "abbreviation": companyLeavetempHeads.abbreviation,
                                    "balance": 0
                                });
                            });
                            employee.carry_forward = leaveCarryForward;
                        }

                    })).then((value) => {
                        return resp.status(200).json({ status: "success", employees: employeeies, company_details: companyDetails, leaveHeads: companyLeaveHead });
                    });
                });
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    cron_job_leave_ledgerl_data_store: async function (req, resp, next) {
        try {
            var insertData = {};
            var search_option = {
                $match: { status: { $in: ["active", "approved"] }, approval_status: "approved" },
            };
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
            var empolyeeData = await Employee.aggregate([search_option,
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "employee_details",
                    },
                }
            ]);
            // console.log(empolyeeData.length);
            // return false;
            if (empolyeeData.length > 0) {
                for (var e = 0; e < empolyeeData.length; e++) {
                    var leaveArray = [];
                    if (empolyeeData[e].employee_details[0]) {
                        if (empolyeeData[e].employee_details[0].leave_balance_counter) {
                            for (var i = 0; i < empolyeeData[e].employee_details[0].leave_balance_counter.length; i++) {
                                if (empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data) {
                                    for (var j = 0; j < empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data.length; j++) {
                                        if (empolyeeData[e].employee_details[0].leave_balance_counter[i].leave_temp_head_id.equals(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[j].leave_type)) {
                                            leaveArray.push({
                                                'leave_temp_head_id': empolyeeData[e].employee_details[0].leave_balance_counter[i].leave_temp_head_id,
                                                'carry_forward': empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[j].carry_forward,
                                                'balance': empolyeeData[e].employee_details[0].leave_balance_counter[i].total_balance,
                                                'leave_type_name': empolyeeData[e].employee_details[0].leave_balance_counter[i].leave_type_name,
                                                'abbreviation': empolyeeData[e].employee_details[0].leave_balance_counter[i].abbreviation,
                                            });
                                        }
                                        else {
                                            leaveArray.push({
                                                'leave_temp_head_id': empolyeeData[e].employee_details[0].leave_balance_counter[i].leave_temp_head_id,
                                                'carry_forward': 'no',
                                                'balance': empolyeeData[e].employee_details[0].leave_balance_counter[i].total_balance,
                                                'leave_type_name': empolyeeData[e].employee_details[0].leave_balance_counter[i].leave_type_name,
                                                'abbreviation': empolyeeData[e].employee_details[0].leave_balance_counter[i].abbreviation,
                                            });
                                        }
                                    }

                                }
                            }
                        }
                        if (leaveArray.length > 0) {
                            var checkData = await LeaveLedgerl.findOne({ employee_id: empolyeeData[e]._id, month: new Date().getMonth(), year: new Date().getFullYear() });
                            var document = {
                                corporate_id: req.authData.corporate_id,
                                company_id: req.authId,
                                employee_id: empolyeeData[e]._id,
                                month: new Date().getMonth(),
                                year: new Date().getFullYear(),
                            };
                            var carryoverArray = [];
                            var lapsedArray = [];
                            for (var k = 0; k < leaveArray.length; k++) {
                                if (leaveArray[k].balance > 0) {
                                    if (leaveArray[k].carry_forward == 'yes') {
                                        var document2 = {
                                            // "leave_balance_counter.$.available": "0" ,
                                            // "leave_balance_counter.$.total_balance": "0" ,
                                            "leave_balance_counter.$.carryover": leaveArray[k].balance,
                                        };
                                        carryoverArray.push({
                                            "head_id": leaveArray[k].leave_temp_head_id,
                                            "balance": leaveArray[k].balance,
                                            "leave_type_name": leaveArray[k].leave_type_name,
                                            "abbreviation": leaveArray[k].abbreviation,
                                        });
                                    }
                                    else {
                                        var document2 = {
                                            "leave_balance_counter.$.available": "0",
                                            "leave_balance_counter.$.total_balance": "0",
                                        };

                                        lapsedArray.push({
                                            "head_id": leaveArray[k].leave_temp_head_id,
                                            "balance": leaveArray[k].balance,
                                            "leave_type_name": leaveArray[k].leave_type_name,
                                            "abbreviation": leaveArray[k].abbreviation,
                                        });
                                    }
                                    await EmployeeDetails.updateOne({ employee_id: empolyeeData[e]._id, "leave_balance_counter.leave_temp_head_id": leaveArray[k].leave_temp_head_id }, { $set: document2 });
                                }
                            }
                            document.lapsed = lapsedArray;
                            document.carry_forward = carryoverArray;
                            if (checkData) {
                                // console.log(empolyeeData[e]._id);
                                var insertData = await LeaveLedgerl.updateOne({ employee_id: mongoose.Types.ObjectId(empolyeeData[e]._id), month: new Date().getMonth(), year: new Date().getFullYear() }, { $set: document });
                            }
                            else {
                                var insertData = await LeaveLedgerl.create(document);
                            }
                            var data = {
                                "empId": empolyeeData[e].emp_id,
                                "empObjId": empolyeeData[e]._id,
                                "year": new Date().getMonth().toString(),
                                "month": new Date().getFullYear().toString(),
                                "action_type": "lapsed_and_carry_forward_leave_summary",
                                "corporateId": empolyeeData[e].corporate_id
                            }
                            await Site_helper.update_leave_summary(data);
                        }
                    }
                }
            }
            return resp.status(200).json({ status: "success", data: insertData });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    leave_encashment_report_with_amount: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                    .status(200)
                    .send({
                        status: "val_err",
                        message: "Validation error",
                        val_msg: v.errors,
                    });
            } else {
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
                var sortbyfield = req.body.sortbyfield;
                if (sortbyfield) {
                    var sortoption = {};
                    sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
                } else {
                    var sortoption = { created_at: -1 };
                }
                const options = {
                    page: req.body.pageno,
                    limit: req.body.perpage ? req.body.perpage : perpage,
                    sort: sortoption,
                };
                if (start_month && start_year || end_month && end_year) {
                    var search_option = {
                        $match: {
                            $and: [
                                { corporate_id: req.authData.corporate_id },
                                {
                                    $or: [
                                        { 'year': { $gt: start_year.toString() } },
                                        {
                                            $and: [
                                                { 'year': { $gte: start_year.toString() } },
                                                { 'month': { $gte: start_month.toString() } }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    $or: [
                                        { 'year': { $lt: end_year.toString() } },
                                        {
                                            $and: [
                                                { 'year': { $lte: end_year.toString() } },
                                                { 'month': { $lte: end_month.toString() } }
                                            ]
                                        }
                                    ]
                                }
                            ],
                        },
                    };
                }
                else {
                    var search_option = {
                        $match: {
                            $and: [
                                { corporate_id: req.authData.corporate_id },
                            ]
                        }
                    }
                }
                var employee_search_option = {
                    $match: {
                        "employee.status": "approved",
                    },
                };
                var search_option_details = {
                    $match: {
                        "employee.status": "approved",
                    },

                };

                if (req.body.designation_id) {
                    var designation_ids = JSON.parse(JSON.stringify(req.body.designation_id));
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
                    var client_ids = JSON.parse(JSON.stringify(req.body.client_id));

                    client_ids = client_ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    var employee_search_option = {
                        $match: {
                            "employee.client_code": { $in: client_ids },
                        },
                    }
                }
                if (req.body.row_checked_all === "true") {
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                            "employee._id"
                        ] = { $nin: ids };
                    }
                } else {
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option_details.$match[
                            "employee._id"
                        ] = { $in: ids };

                    }
                }
                var myAggregate = LeaveLog.aggregate([
                    search_option,
                    {
                        $lookup: {
                            from: "employees",
                            localField: "employee_id",
                            foreignField: "_id",
                            as: "employee",
                        },
                    },
                    employee_search_option,
                    {
                        $lookup: {
                            from: "clients",
                            localField: "employee.client_code",
                            foreignField: "_id",
                            as: "client",
                        },
                    },
                    {
                        $lookup: {
                            from: "staffs",
                            localField: "employee.emp_hod",
                            foreignField: "_id",
                            as: "hod",
                        },
                    },
                    {
                        $lookup: {
                            from: "employee_details",
                            localField: "employee_id",
                            foreignField: "employee_id",
                            as: "employee_details",
                        },
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
                    search_option_details,
                    {
                        $project: {
                            _id: 1,
                            corporate_id: 1,
                            employee_id: 1,
                            "employee._id": 1,
                            "employee.emp_id": 1,
                            "employee.emp_first_name": 1,
                            "employee.emp_last_name": 1,
                            employee_details_leave_id: 1,
                            encash: 1,
                            extinguish: 1,
                            month: 1,
                            year: 1,
                            created_at: 1,
                            updated_at: 1,
                            "client._id": 1,
                            "client.client_code": 1,
                            "branch._id": 1,
                            "branch.branch_name": 1,
                            "department._id": 1,
                            "department.department_name": 1,
                            "designation._id": 1,
                            "designation.designation_name": 1,
                            "hod.first_name": 1,
                            "hod.last_name": 1,
                            "hod.userid": 1,
                            "hod._id": 1,
                            "employee_details.leave_balance_counter": 1
                        },
                    },
                ]);
                LeaveLog.aggregatePaginate(myAggregate, options, async function (err, leaveLog) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    if (leaveLog.docs) {
                        for (var j = 0; j < leaveLog.docs.length; j++) {
                            if (leaveLog.docs[j].employee_details && leaveLog.docs[j].employee_details[0]) {
                                if (leaveLog.docs[j].employee_details[0].leave_balance_counter) {
                                    for (var i = 0; i < leaveLog.docs[j].employee_details[0].leave_balance_counter.length; i++) {
                                        if (leaveLog.docs[j].employee_details[0].leave_balance_counter[i]._id.equals(leaveLog.docs[j].employee_details_leave_id)) {
                                            leaveLog.docs[j].leave_head = leaveLog.docs[j].employee_details[0].leave_balance_counter[i];
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return resp.status(200).json({ status: "success", data: leaveLog });
                });

            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    cron_job_earning_leave_data_store: async function (req, resp, next) {
        try {
            var search_option = {
                $match: { status: { $in: ["active", "approved"] }, approval_status: "approved" },
            };
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
            var empolyeeData = await Employee.aggregate([search_option,
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "_id",
                        foreignField: "employee_id",
                        as: "employee_details",
                    },
                }
            ]);
            if (empolyeeData.length > 0) {
                for (var e = 0; e < empolyeeData.length; e++) {
                    var leaveArray = [];

                    if (empolyeeData[e].employee_details[0]) {
                        if (empolyeeData[e].employee_details[0].template_data) {
                            if (empolyeeData[e].employee_details[0].template_data.leave_temp_data) {
                                if (empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data) {
                                    for (var d = 0; d < empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data.length; d++) {
                                        var earningleaveawait = await EarningLeaveLog.findOne({ employee_id: empolyeeData[e]._id, temp_head_id: empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].leave_type }).sort({ _id: -1 });
                                        var employeeAtten = await EmployeeAttendance.findOne({ emp_id: empolyeeData[e].emp_id }).sort({ attendance_date: 1 });
                                        if (earningleaveawait) {
                                            var date = earningleaveawait.date;
                                        }
                                        else {
                                            var date = employeeAtten.attendance_date;
                                        }
                                        // var countStartDate = moment(date).format('YYYY-MM-DD');
                                        var countStartDate = date;
                                        var atten_search_option = {
                                            $match: {
                                                $and: [
                                                    { emp_id: empolyeeData[e].emp_id },
                                                    {
                                                        $or: [
                                                            { 'attendance_date': { $gt: countStartDate.toString() } },
                                                            {
                                                                $and: [
                                                                    { 'attendance_date': { $gte: countStartDate.toString() } },
                                                                    // {'month': {$gte: start_month.toString() }}
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ],
                                            },
                                        };

                                        var employee_attendance = await EmployeeAttendance.aggregate([atten_search_option]);
                                        // console.log(employee_attendance.length);

                                        if (empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].no_of_day <= employee_attendance.length) {
                                            var flag = 0;
                                            var is_earned = 0;
                                            if (empolyeeData[e].employee_details[0].leave_balance_counter) {
                                                for (var ei = 0; ei < empolyeeData[e].employee_details[0].leave_balance_counter.length; ei++) {
                                                    if (empolyeeData[e].employee_details[0].leave_balance_counter[ei].leave_temp_head_id.equals(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].leave_type)) {
                                                        var leave_temp_head = await LeaveTempHead.findOne({ _id: mongoose.Types.ObjectId(empolyeeData[e].employee_details[0].leave_balance_counter[ei].leave_temp_head_id) });
                                                        if (leave_temp_head && leave_temp_head.head_type === "earned") {
                                                            var document = {
                                                                "leave_balance_counter.$.available": parseFloat(empolyeeData[e].employee_details[0].leave_balance_counter[ei].available) + parseFloat(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].restriction_days),
                                                                "leave_balance_counter.$.total_balance": parseFloat(empolyeeData[e].employee_details[0].leave_balance_counter[ei].total_balance) + parseFloat(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].restriction_days),
                                                            };
                                                            EmployeeDetails.updateOne({ employee_id: empolyeeData[e]._id, "leave_balance_counter._id": empolyeeData[e].employee_details[0].leave_balance_counter[ei]._id, }, { $set: document }, function (err, emp_det) {
                                                                if (err) {
                                                                    return resp.status(200).send({ status: "error", message: err.message });
                                                                }
                                                            });
                                                            is_earned = 1;
                                                        }
                                                    }
                                                }
                                            } else {
                                                var leave_temp_head = await LeaveTempHead.findOne({ _id: mongoose.Types.ObjectId(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].leave_type) });
                                                if (leave_temp_head && leave_temp_head.head_type === "earned") {
                                                    leaveArray.push({
                                                        'leave_temp_head_id': leave_temp_head._id,
                                                        'leave_type_name': leave_temp_head.full_name,
                                                        'abbreviation': leave_temp_head.abbreviation,
                                                        'available': parseFloat(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].restriction_days),
                                                        'consumed': "0",
                                                        'total_balance': parseFloat(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].restriction_days),
                                                        'tenure': empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].leave_tenure,
                                                        'carryover': "0",
                                                        'quota': parseFloat(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].restriction_days),
                                                        'encash': "0",
                                                        'extinguish': "0"
                                                    });
                                                    flag = 1;
                                                    is_earned = 1;
                                                }
                                            }
                                            if (is_earned == 1) {
                                                var datas = await EarningLeaveLog.create({
                                                    "corporate_id": empolyeeData[e].corporate_id,
                                                    "employee_id": empolyeeData[e]._id,
                                                    "temp_head_id": empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].leave_type,
                                                    "total_leave": empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].restriction_days,
                                                    "date": moment(countStartDate, "YYYY-MM-DD").add(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].no_of_day, 'days').format("YYYY-MM-DD"),
                                                    "status": "active",
                                                });
                                                var data = {
                                                    "empId": empolyeeData[e].emp_id,
                                                    "empObjId": empolyeeData[e]._id,
                                                    "year": moment(countStartDate, "YYYY-MM-DD").add(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].no_of_day, 'days').format("YYYY").toString(),
                                                    "month": moment(countStartDate, "YYYY-MM-DD").add(empolyeeData[e].employee_details[0].template_data.leave_temp_data.template_data[d].no_of_day, 'days').format("MM").toString(),
                                                    "action_type": "earning_leave_summary",
                                                    "corporateId": empolyeeData[e].corporate_id
                                                }
                                                await Site_helper.update_leave_summary(data);
                                            }
                                        }
                                    }
                                    if (flag == 1) {
                                        EmployeeDetails.updateOne({ employee_id: empolyeeData[e]._id }, { $set: { 'leave_balance_counter': leaveArray } }, function (err, emp_det) {
                                            if (err) {
                                                return resp.status(200).send({ status: "error", message: err.message });
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return resp.status(200).json({ status: "success", message: "Leave earning successfully." });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    get_employee_leave_list: async function (req, resp, next) {
        try {
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            // var start_date = req.body.wage_date_from;
            // var end_date = req.body.wage_date_to;
            const start_date = new Date(req.body.wage_year, (req.body.wage_month ), 1);
            const end_date = new Date(req.body.wage_year, (req.body.wage_month + 1 ), 0);
            const options = {
                page: req.body.pageno ? req.body.pageno : 1,
                limit: req.body.perpage ? req.body.perpage : perpage,
                sort: sortoption,
            };
            var filter_option = {};
            if (start_date || end_date) {
                var search_option = {
                    $match: {
                        $and: [
                            { corporate_id: req.authData.corporate_id },
                            {
                                $or: [
                                    { 'leave_from_date': { $gt: start_date } },
                                    {
                                        $and: [
                                            { 'leave_from_date': { $gte: start_date } }
                                        ]
                                    }
                                    // { 'created_at': { $gt: new Date(start_date) } },
                                    // {
                                    //     $and: [
                                    //         { 'created_at': { $gte: new Date(start_date) } }
                                    //     ]
                                    // }
                                ]
                            },
                            {
                                $or: [
                                    { 'leave_to_date': { $lt: end_date } },
                                    {
                                        $and: [
                                            { 'leave_to_date': { $lte: start_date } }
                                        ]
                                    }
                                    // { 'created_at': { $lt: new Date(end_date) } },
                                    // {
                                    //     $and: [
                                    //         { 'created_at': { $lte: new Date(start_date) } }
                                    //     ]
                                    // }
                                ]
                            }
                        ],
                    },
                };
            }
            else {
                var search_option = {
                    $match: {
                        $and: [
                            { corporate_id: req.authData.corporate_id },
                        ],
                    },
                };
            }
            if (req.body.leave_type) {
                search_option.$match.leave_temp_head = {
                    $regex: req.body.leave_type + '.*',
                    $options: "i",
                };
            }
            // if(req.body.approval_status){
            //     search_option.$match.leave_approval_status = {
            //         $regex: req.body.approval_status,
            //         $options: "i",
            //     };  
            // }

            var myAggregate = EmployeeLeave.aggregate([search_option,
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee_id",
                        foreignField: "_id",
                        as: "employees",
                    },
                },
                {
                    $lookup: {
                        from: "leave_temp_heads",
                        localField: "leave_temp_head",
                        foreignField: "abbreviation",
                        as: "leave_temp_heads",
                    },
                },
                {
                    $addFields: {
                        employees: {
                            $arrayElemAt: ["$employees", 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        employee_id: 1,
                        emp_id: 1,
                        leave_id: 1,
                        leave_temp_head: 1,
                        leave_from_date: 1,
                        leave_to_date: 1,
                        note: 1,
                        status: 1,
                        leave_total_days: 1,
                        leave_count_days: 1,
                        current_balance: 1,
                        leave_approval_status: 1,
                        approve_by: 1,
                        approve_date: 1,
                        created_at: 1,
                        updated_at: 1,
                        "employees._id": 1,
                        "employees.corporate_id": 1,
                        "employees.emp_first_name": 1,
                        "employees.emp_last_name": 1,
                        leave_temp_heads: 1,
                    },
                }
            ]);
            EmployeeLeave.aggregatePaginate(myAggregate, options, async function (err, leave_list) {
                if (err) return resp.json({ status: 'error', message: err.message });
                // datas = leave_list;
                // docs = datas.docs.map(async (item) => {
                //     data = await LeaveTempHead.findOne({'abbreviation':item.leave_temp_head});
                //     if(data){
                //         item.leave_temp_head = data;
                //         item.leave_temp_head = item.leave_temp_head;
                //     }
                //     else{
                //         item.leave_temp_head = {};
                //     }
                //     item.employee_details = item.employee_details;
                //     return item;
                // });
                // leave_list.docs = await Promise.all(docs);
                // console.log(leave_list);
                return resp.status(200).json({ status: 'success', 'message': 'Leave fetched successfully', leave_list: leave_list });
            });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    employee_leave_status_change: async function (req, resp) {
        let data = {};
        try {
            const v = new Validator(req.body, {
                // employee_id: "required",
                // employee_leave_id: "required",
                // status:"required|in:approved,rejected"
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                    .status(200)
                    .send({
                        status: "val_err",
                        message: "Validation error",
                        val_msg: v.errors,
                    });
            }
            // var leave_data = JSON.parse(req.body.leave_data);
            // await Promise.all(leave_data.map(function(leave_data) {
            //     EmployeeLeave.updateOne({employee_id:leave_data.employee_id,_id:mongoose.Types.ObjectId(leave_data.employee_leave_id)},{ $set: {'leave_approval_status':status} }, async function (err, employee_leave) {
            //         return employee_leave;
            //     });
            // }));
            var sortbyfield = req.body.sortbyfield
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc' ? 1 : -1;
            }
            else {
                var sortoption = { created_at: -1 };
            }
            const options = {
                page: req.body.pageno ? req.body.pageno : 1,
                limit: req.body.perpage ? req.body.perpage : perpage,
                sort: sortoption,
            };
            var search_option = { $match: { $and: [{ 'corporate_id': req.authData.corporate_id }] } };
            if (req.body.row_checked_all === "true") {
                if (typeof req.body.unchecked_row_ids == "string") {
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                }
                else {
                    var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                if (typeof req.body.checked_row_ids == "string") {
                    var ids = JSON.parse(req.body.checked_row_ids);
                }
                else {
                    var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                }
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $in: ids };
                }
            }
            var myAggregate = EmployeeLeave.aggregate([
                search_option,
                {
                    $lookup: {
                        from: "companies",
                        localField: "corporate_id",
                        foreignField: "corporate_id",
                        as: "companies",
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee_id",
                        foreignField: "_id",
                        as: "employees",
                    },
                },
                {
                    $lookup: {
                        from: "employee_details",
                        localField: "employee_id",
                        foreignField: "employee_id",
                        as: "employee_details",
                    },
                },
                {
                    $match: {
                        "leave_approval_status": "pending"
                    }
                },
                {
                    $addFields: {
                        company: {
                            $arrayElemAt: ["$companies", 0],
                        },
                        employees: {
                            $arrayElemAt: ["$employees", 0],
                        },
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                    },
                },
            ]).then(async (employee_leave) => {
                var responseArray = await Promise.all(employee_leave.map(function (leave) {

                    if (leave) {
                        var status = "pending";
                        if (req.body.status) {
                            if (req.body.status == 'approved') {
                                status = "approved";
                            }
                            else if (req.body.status == 'rejected') {
                                status = "rejected";
                            }
                        }
                        var document = {
                            "company_note": req.body.note,
                            'leave_approval_status': status,
                            "approve_by": req.authData.company_id,
                            "approve_date": Date.now()
                        };
                        EmployeeLeave.findOneAndUpdate({ _id: leave._id }, { $set: document }, async function (err, emp_leave) {
                            if(leave.employees && leave.employees.email_id){
                                EmailHelper.employee_request_approval(null,leave.employees.email_id,null,{
                                    first_name:leave.employees.emp_first_name,
                                    last_name:leave.employees.emp_last_name,
                                    approved_by:req.authData.first_name + ' ' + req.authData.last_name,
                                    request_type:"Leave",
                                    request_status:status,
                                    company_name:leave?.company?.establishment_name
                                })
                            }
                            return emp_leave;
                        });


                        var shift_id = "";
                        var register_type = "";
                        var reporting_time = "";
                        var closing_time = "";
                        if (leave.employees) {
                            if (leave.employees.shift) {
                                shift_id = leave.employees.shift.shift_id
                            }
                        }
                        if (leave.employee_details) {
                            if (leave.employee_details.template_data) {
                                if (leave.employee_details.template_data.attendance_temp_data) {
                                    register_type = leave.employee_details.template_data.attendance_temp_data.register_type;
                                    reporting_time = leave.employee_details.template_data.attendance_temp_data.reporting_time;
                                    closing_time = leave.employee_details.template_data.attendance_temp_data.closing_time;
                                }
                            }
                        }
                        var alldates = getDatesInRange(leave.leave_from_date, leave.leave_to_date);
                        if (status == 'approved') {
                            if (alldates) {
                                if (alldates.length > 0) {
                                    alldates.map(async function (date) {
                                        if (register_type === "time") {
                                            var document = {
                                                emp_id: leave.emp_id,
                                                attendance_date: moment(date).format("YYYY-MM-DD"),
                                                attendance_month: date.getUTCMonth(),
                                                attendance_year: date.getUTCFullYear(),
                                                login_by: "web",
                                                corporate_id: req.authData.corporate_id,
                                                login_time: reporting_time,
                                                logout_time: closing_time,
                                                total_logged_in: "9",
                                                total_break_time: "0",
                                                attendance_stat: leave.leave_temp_head,
                                                register_type: register_type,
                                                created_by: req.authId,
                                                created_at: Date.now(),
                                                updated_at: Date.now(),
                                                status: "active"
                                            };
                                        }
                                        else if (register_type === "halfday") {
                                            var document = {
                                                emp_id: leave.emp_id,
                                                attendance_date: moment(date).format("YYYY-MM-DD"),
                                                attendance_month: date.getUTCMonth(),
                                                attendance_year: date.getUTCFullYear(),
                                                login_by: "web",
                                                corporate_id: req.authData.corporate_id,
                                                attendance_stat: leave.leave_temp_head,
                                                first_half: leave.leave_temp_head,
                                                second_half: leave.leave_temp_head,
                                                register_type: req.body.register_type,
                                                created_by: req.authId,
                                                created_at: Date.now(),
                                                updated_at: Date.now(),
                                                status: "active"
                                            };
                                        }
                                        else if (register_type === "wholeday") {
                                            var document = {
                                                emp_id: leave.emp_id,
                                                attendance_date: moment(date).format("YYYY-MM-DD"),
                                                attendance_month: date.getUTCMonth(),
                                                attendance_year: date.getUTCFullYear(),
                                                login_by: "web",
                                                corporate_id: req.authData.corporate_id,
                                                attendance_stat: leave.leave_temp_head,
                                                register_type: req.body.register_type,
                                                created_by: req.authId,
                                                created_at: Date.now(),
                                                updated_at: Date.now(),
                                                status: "active"
                                            };
                                        }
                                        await EmployeeAttendance.findOneAndUpdate({ emp_id: leave.emp_id, attendance_date: moment(date).format("YYYY-MM-DD"), }, document, { upsert: true, new: true, setDefaultsOnInsert: true });
                                    });
                                }
                            }
                        }
                    }
                })
                );
            });
            return resp.status(200).json({ status: 'success', 'message': 'Employee Leave status update successfully' });
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
        }
    },
    register_as_per_calender_year_report: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                // pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                    .status(200)
                    .send({
                        status: "val_err",
                        message: "Validation error",
                        val_msg: v.errors,
                    });
            }
            else {
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
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
                var filter_option = {};
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
                                { parent_hods: { $in: [req.authId] } },
                            ],
                        },
                    };
                }
                // var filter_option = {};

                // var search_option = {
                //     $match: {
                //         $and: [
                //         { corporate_id: req.authData.corporate_id },
                //         { parent_hods: { $in: [req.authId] } },
                //         ],
                //     },
                // };

                var search_option_details = { $match: {} };
                if (req.body.emp_status) {
                    if (req.body.emp_status != 'all') {
                        search_option.$match.status = { $eq: req.body.emp_status };
                    }
                }
                if (req.body.searchkey) {
                    search_option = {
                        $match: {
                            $text: { $search: req.body.searchkey },
                            corporate_id: req.authData.corporate_id,
                            parent_hods: { $in: [req.authId] },
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
                    if (typeof req.body.unchecked_row_ids == "string") {
                        var ids = JSON.parse(req.body.unchecked_row_ids);
                    }
                    else {
                        var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    }
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                } else {
                    if (typeof req.body.checked_row_ids == "string") {
                        var ids = JSON.parse(req.body.checked_row_ids);
                    }
                    else {
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
                            as: "employee_details",
                        },
                    },
                    {
                        $lookup: {
                            from: "revisions",

                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                    },
                                },
                            ],
                            as: "revisions",
                        },
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
                        $match: {
                            'employee_details.leave_balance_counter': { $ne: null }
                        }
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
                            department: {
                                $arrayElemAt: ["$department", 0],
                            },
                            designation: {
                                $arrayElemAt: ["$designation", 0],
                            },
                            branch: {
                                $arrayElemAt: ["$branch", 0],
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
                            created_at: 1,
                            "branch._id": 1,
                            "branch.branch_name": 1,
                            "department._id": 1,
                            "department.department_name": 1,
                            "designation._id": 1,
                            "designation.designation_name": 1,
                            "date_of_join": "$employee_details.employment_hr_details.date_of_join",
                            "full_and_final": "$employee_details.full_and_final",
                            "revisions": 1,
                        },
                    }
                ])
                    .then(async (employees) => {
                        await Promise.all(employees.map(async function (employee) {
                            var yearData = [];
                            if (employee.revisions) {
                                if (employee.revisions.length > 0) {
                                    employee.revisions.map(function (rev) {
                                        var total_earn_value = 0;
                                        if (rev.template_data) {
                                            if (rev.template_data.leave_temp_data) {
                                                if (rev.template_data.leave_temp_data.template_data) {
                                                    if (rev.template_data.leave_temp_data.template_data.length > 0) {
                                                        rev.template_data.leave_temp_data.template_data.map(function (datas) {
                                                            total_earn_value += parseFloat(datas.no_of_day);
                                                        })
                                                    }
                                                }
                                            }
                                        }
                                        if (rev.revision_year) {
                                            yearData.push({
                                                'year': rev.revision_year,
                                                'total_earn_leave': total_earn_value
                                            });
                                        }
                                    })
                                }
                            }
                            if (yearData) {
                                if (yearData.length > 0) {
                                    for (var i = 0; i < yearData.sort(compare).length; i++) {
                                        var carry_forward = await LeaveLedgerl.find({ 'employee_id': employee._id, year: yearData[i].year });
                                        var total_carry_forward = 0;
                                        var total_pay_days = 0;
                                        if (carry_forward) {
                                            if (carry_forward.length > 0) {
                                                carry_forward.map(function (cf) {
                                                    if (cf.carry_forward) {
                                                        if (cf.carry_forward.length > 0) {
                                                            cf.carry_forward.map(function (cff) {
                                                                total_carry_forward += parseFloat(cff.balance);
                                                            })
                                                        }
                                                    }
                                                })
                                            }
                                        }
                                        var totalPayDays = await EmployeeMonthlyReport.find({ 'emp_db_id': employee._id, 'emp_id': employee.emp_id, wage_year: yearData[i].year });
                                        if (totalPayDays) {
                                            if (totalPayDays.length > 0) {
                                                totalPayDays.map(function (pdays) {
                                                    if (pdays.attendance_summaries) {
                                                        if (pdays.attendance_summaries.paydays) {
                                                            total_pay_days += parseFloat(pdays.attendance_summaries.paydays);
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                        yearData[i].total_carry_forward = total_carry_forward;
                                        yearData[i].total_days = total_pay_days;
                                    }
                                }
                            }
                            employee.year_data = yearData;
                        }));
                        return resp.status(200).json({ status: "success", employee: employees });
                        // return resp.status(200).json({status: "success",employee:employees ,data: yearData}); 
                    });
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    form_e_rest_leave_calender_year_report: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                // pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                    .status(200)
                    .send({
                        status: "val_err",
                        message: "Validation error",
                        val_msg: v.errors,
                    });
            }
            else {
                var sortbyfield = req.body.sortbyfield;
                // var start_date = new Date().getFullYear() + '-01-01';
                // var end_date = new Date().getFullYear() + '-12-31';
                var leave_start = new Date(new Date().getFullYear(), '00', 2, -18, -30, 0);
                var leave_end = new Date(new Date().getFullYear(), '11', 31, 5, 29, 59);
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
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
                //             { corporate_id: req.authData.corporate_id },
                //             { parent_hods: { $in: [req.authId] } },
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
                if (req.body.row_checked_all === "true") {
                    if (typeof req.body.unchecked_row_ids == "string") {
                        var ids = JSON.parse(req.body.unchecked_row_ids);
                    }
                    else {
                        var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    }
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                } else {
                    if (typeof req.body.checked_row_ids == "string") {
                        var ids = JSON.parse(req.body.checked_row_ids);
                    }
                    else {
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
                            as: "employee_details",
                        },
                    },
                    {
                        $lookup: {
                            from: "revisions",

                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                    },
                                },
                            ],
                            as: "revisions",
                        },
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
                        $lookup: {
                            from: 'employee_monthly_reports',
                            "let": { "emp_db_idVar": "$_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] } },
                                            { 'wage_year': new Date().getFullYear() },
                                        ]
                                    }
                                }
                            ],
                            as: 'employee_monthly_reports',
                        }
                    },
                    {
                        $lookup: {
                            from: 'employee_leave_summary_logs',
                            "let": { "emp_db_idVar": "$_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] } },
                                            { 'wage_year': new Date().getFullYear() },
                                        ]
                                    }
                                }
                            ],
                            as: 'employee_leave_summary_logs',
                        }
                    },
                    {
                        $match: {
                            'employee_details.leave_balance_counter': { $ne: null }
                        }
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
                            department: {
                                $arrayElemAt: ["$department", 0],
                            },
                            designation: {
                                $arrayElemAt: ["$designation", 0],
                            },
                            branch: {
                                $arrayElemAt: ["$branch", 0],
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
                            created_at: 1,
                            "paydays": { $sum: "$employee_monthly_reports.attendance_summaries.paydays" },
                            "employee_leave_summary_logs": 1
                        },
                    }
                ]).then(async (employees) => {
                    var companyLeaveHead = await LeaveTempHead.find({ corporate_id: req.authData.corporate_id });
                    var array = [];
                    await Promise.all(employees.map(async function (employee) {
                        var earnedLeaveOpeninfBalance = 0;
                        var medicalLeaveOpeninfBalance = 0;
                        var otherLeaveOpeninfBalance = 0;

                        var earnedLeaveAvailBalance = 0;
                        var medicalLeaveAvailBalance = 0;
                        var otherLeaveAvailBalance = 0;

                        var earnedAddedBalance = 0;
                        var medicalAddedBalance = 0;
                        var otherAddedBalance = 0;

                        var earnedCloseBalance = 0;
                        var medicalCloseBalance = 0;
                        var otherCloseBalance = 0;

                        var leave_added = [];
                        var opening_balance = [];
                        var closing_balance = [];
                        if (employee.employee_leave_summary_logs) {
                            if (employee.employee_leave_summary_logs.length > 0) {
                                employee.employee_leave_summary_logs.map(function (summary_leave) {
                                    if (summary_leave.type === 'opening') {
                                        opening_balance = summary_leave.history;
                                    }
                                    if (summary_leave.type === 'closing') {
                                        closing_balance = summary_leave.history;
                                        // employee.availed = summary_leave.history;
                                    }
                                    if (summary_leave.type === 'earning') {
                                        summary_leave.history.map(function (earning) {
                                            // leave_added.push(earning);
                                        });
                                    }

                                });
                            }
                        }
                        var holder = {};
                        leave_added.forEach(function (d) {
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
                        if (opening_balance.length > 0) {
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                var headDataExist = opening_balance.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if (headDataExist) {
                                    if (companyLeavetempHeads.head_type == 'earned') {
                                        earnedLeaveOpeninfBalance += parseFloat(headDataExist.balance);
                                    }
                                    else if (companyLeavetempHeads.head_type == 'com_defined' && companyLeavetempHeads.abbreviation.includes('MDL')) {
                                        medicalLeaveOpeninfBalance += parseFloat(headDataExist.balance);
                                    }
                                    else {
                                        otherLeaveOpeninfBalance += parseFloat(headDataExist.balance);
                                    }
                                }
                            });
                        }
                        if (closing_balance.length > 0) {
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                var headDataExist = closing_balance.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if (headDataExist) {
                                    if (companyLeavetempHeads.head_type == 'earned') {
                                        earnedCloseBalance += parseFloat(headDataExist.balance);
                                        earnedLeaveAvailBalance += parseFloat(headDataExist.balance);
                                    }
                                    else if (companyLeavetempHeads.head_type == 'com_defined' && companyLeavetempHeads.abbreviation.includes('MDL')) {
                                        medicalCloseBalance += parseFloat(headDataExist.balance);
                                        medicalLeaveAvailBalance += parseFloat(headDataExist.balance);
                                    }
                                    else {
                                        otherCloseBalance += parseFloat(headDataExist.balance);
                                        otherLeaveAvailBalance += parseFloat(headDataExist.balance);
                                    }
                                }
                            });
                        }
                        if (leave_added.length > 0) {
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                var headDataExist = leave_added.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if (headDataExist) {
                                    if (companyLeavetempHeads.head_type == 'earned') {
                                        earnedAddedBalance += parseFloat(headDataExist.balance);
                                    }
                                    else if (companyLeavetempHeads.head_type == 'com_defined' && companyLeavetempHeads.abbreviation.includes('MDL')) {
                                        medicalAddedBalance += parseFloat(headDataExist.balance);
                                    }
                                    else {
                                        otherAddedBalance += parseFloat(headDataExist.balance);
                                    }
                                }
                            });
                        }
                        array.push({
                            "emp_id": employee.emp_id,
                            "emp_first_name": employee.emp_first_name,
                            "emp_last_name": employee.emp_last_name,
                            "corporate_id": employee.corporate_id,
                            "paydays": employee.paydays,
                            "earned_leave_details": {
                                'opening_balance': earnedLeaveOpeninfBalance,
                                'added_balance': earnedAddedBalance,
                                'leave_avalable_balance': earnedLeaveAvailBalance,
                                'closeing_balance': earnedCloseBalance,
                            },
                            "medical_leave_details": {
                                'opening_balance': medicalLeaveOpeninfBalance,
                                'added_balance': medicalAddedBalance,
                                'leave_avalable_balance': medicalLeaveAvailBalance,
                                'closeing_balance': medicalCloseBalance,
                            },
                            "other_leave_details": {
                                'opening_balance': otherLeaveOpeninfBalance,
                                'added_balance': otherAddedBalance,
                                'leave_avalable_balance': otherLeaveAvailBalance,
                                'closeing_balance': otherCloseBalance,
                            }
                        });
                    }));
                    return resp.status(200).json({ status: "success", data: array });
                });
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    leave_encashment_report_export: async function (req, resp, next) {
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
            } else {
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
                var sortbyfield = req.body.sortbyfield;
                if (sortbyfield) {
                    var sortoption = {};
                    sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
                } else {
                    var sortoption = { created_at: -1 };
                }
                const options = {
                    page: req.body.pageno,
                    limit: req.body.perpage ? req.body.perpage : perpage,
                    sort: sortoption,
                };
                // var filter_option = {};
                if (start_month && start_year || end_month && end_year) {
                    var search_option = {
                        $match: {
                            $and: [
                                { corporate_id: req.authData.corporate_id },
                                // { parent_hods: { $in: [req.authId] } },
                                // { approval_status: "approved" },
                                {
                                    $or: [
                                        { 'year': { $gt: start_year.toString() } },
                                        {
                                            $and: [
                                                { 'year': { $gte: start_year.toString() } },
                                                { 'month': { $gte: start_month.toString() } }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    $or: [
                                        { 'year': { $lt: end_year.toString() } },
                                        {
                                            $and: [
                                                { 'year': { $lte: end_year.toString() } },
                                                { 'month': { $lte: end_month.toString() } }
                                            ]
                                        }
                                    ]
                                }
                            ],
                        },
                    };
                }
                else {
                    var search_option = {
                        $match: {
                            $and: [
                                { corporate_id: req.authData.corporate_id },
                            ]
                        }
                    }
                }
                var employee_search_option = {
                    $match: {
                        "employee.status": "approved",
                    },
                };
                var search_option_details = {
                    $match: {
                        "employee.status": "approved",
                    },

                };

                if (req.body.designation_id) {
                    var designation_ids = JSON.parse(JSON.stringify(req.body.designation_id));
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
                    var client_ids = JSON.parse(JSON.stringify(req.body.client_id));

                    client_ids = client_ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    // search_option.$match.employee.client_id = { $in: client_ids };

                    var employee_search_option = {
                        $match: {
                            "employee.client_code": { $in: client_ids },
                        },
                    }
                }
                // if (req.body.hod_id) {
                //     var hod_ids = JSON.parse(req.body.hod_id);
                //     hod_ids = hod_ids.map(function (el) {
                //         return mongoose.Types.ObjectId(el);
                //     });
                //     search_option.$match.emp_hod = { $in: hod_ids };
                // }

                // if (req.body.row_checked_all === "true") {
                //     if(typeof req.body.unchecked_row_ids == "string"){
                //         var ids = JSON.parse(req.body.unchecked_row_ids);
                //     }
                //     else{
                //         var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                //     }
                //     if (ids.length > 0) {
                //         ids = ids.map(function (el) {
                //             return mongoose.Types.ObjectId(el);
                //         });
                //         search_option.$match._id = { $nin: ids };
                //     }
                // } else {
                //     if(typeof req.body.checked_row_ids == "string"){
                //         var ids = JSON.parse(req.body.checked_row_ids);
                //     }
                //     else{
                //         var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                //     }
                //     if (ids.length > 0) {
                //         ids = ids.map(function (el) {
                //             return mongoose.Types.ObjectId(el);
                //         });
                //         search_option.$match._id = { $in: ids };
                //     }
                // }
                var myAggregate = LeaveLog.aggregate([
                    search_option,
                    {
                        $lookup: {
                            from: "employees",
                            localField: "employee_id",
                            foreignField: "_id",
                            as: "employee",
                        },
                    },
                    employee_search_option,
                    {
                        $lookup: {
                            from: "clients",
                            localField: "employee.client_code",
                            foreignField: "_id",
                            as: "client",
                        },
                    },
                    {
                        $lookup: {
                            from: "staffs",
                            localField: "employee.emp_hod",
                            foreignField: "_id",
                            as: "hod",
                        },
                    },
                    {
                        $lookup: {
                            from: "employee_details",
                            localField: "employee_id",
                            foreignField: "employee_id",
                            as: "employee_details",
                        },
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
                    search_option_details,
                    {
                        $addFields: {
                            hod: {
                                $arrayElemAt: ["$hod", 0],
                            },
                            employee_details: {
                                $arrayElemAt: ["$employee_details", 0],
                            },
                            employee: {
                                $arrayElemAt: ["$employee", 0],
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
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            corporate_id: 1,
                            employee_id: 1,
                            "employee.emp_id": 1,
                            "employee.emp_first_name": 1,
                            "employee.emp_last_name": 1,
                            employee_details_leave_id: 1,
                            encash: 1,
                            extinguish: 1,
                            month: 1,
                            year: 1,
                            created_at: 1,
                            updated_at: 1,
                            "client._id": 1,
                            "client.client_code": 1,
                            "branch._id": 1,
                            "branch.branch_name": 1,
                            "department._id": 1,
                            "department.department_name": 1,
                            "designation._id": 1,
                            "designation.designation_name": 1,
                            "hod.first_name": 1,
                            "hod.last_name": 1,
                            "hod.userid": 1,
                            "hod._id": 1,
                            "employee_details.leave_balance_counter": 1
                        },
                    },
                ]).then(async (leaveLogs) => {
                    // var companyLeaveHead = await LeaveTempHead.find({corporate_id:req.authData.corporate_id});
                    var field_list_array = ["emp_code", "name", "department", "designation", "branch", "client_id", "hod", "leave_head", "encashed", "amount", "date"];
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    var clmn_id = 1;
                    ws.cell(1, clmn_id++).string("SL");
                    ws.cell(1, clmn_id++).string("Emp ID");
                    ws.cell(1, clmn_id++).string("Name");
                    ws.cell(1, clmn_id++).string("Department");
                    ws.cell(1, clmn_id++).string("Designation");
                    ws.cell(1, clmn_id++).string("Branch");
                    ws.cell(1, clmn_id++).string("Client");
                    ws.cell(1, clmn_id++).string("HOD");
                    ws.cell(1, clmn_id++).string("Leave head");
                    ws.cell(1, clmn_id++).string("Encashed");
                    ws.cell(1, clmn_id++).string("Encah Amount");
                    ws.cell(1, clmn_id++).string("Date");
                    await Promise.all(leaveLogs.map(async function (leaveLog, index) {
                        if (leaveLog) {
                            var index_val = 2;
                            index_val = index_val + index;
                            var clmn_emp_id = 1
                            ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                            if (field_list_array.includes('emp_code')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.employee ? String(leaveLog.employee.emp_id) : ""
                                );
                            }
                            if (field_list_array.includes('name')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.employee.emp_first_name ? String(leaveLog.employee.emp_first_name + " " + leaveLog.employee.emp_last_name) : ""
                                );
                            }
                            if (field_list_array.includes('department')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.department ? String(leaveLog.department.department_name) : ""
                                );

                            }
                            if (field_list_array.includes('designation')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.designation ? String(leaveLog.designation.designation_name) : ""
                                );
                            }
                            if (field_list_array.includes('branch')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.branch ? String(leaveLog.branch.branch_name) : ""
                                );
                            }
                            if (field_list_array.includes('client_id')) {
                                ws.cell(index_val, clmn_emp_id++).string(leaveLog.client ? String(leaveLog.client.client_code) : "");
                            }
                            if (field_list_array.includes('hod')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.hod ? String(leaveLog.hod.first_name + " " + leaveLog.hod.last_name) : ""
                                );
                            }

                            if (leaveLog.employee_details) {
                                if (leaveLog.employee_details.leave_balance_counter) {
                                    for (var i = 0; i < leaveLog.employee_details.leave_balance_counter.length; i++) {
                                        if (leaveLog.employee_details.leave_balance_counter[i]._id.equals(leaveLog.employee_details_leave_id)) {
                                            leaveLog.leave_head = leaveLog.employee_details.leave_balance_counter[i];
                                            if (field_list_array.includes('leave_head')) {
                                                ws.cell(index_val, clmn_emp_id++).string(
                                                    leaveLog.employee_details.leave_balance_counter[i] ? String(leaveLog.employee_details.leave_balance_counter[i].leave_type_name) : ""
                                                );
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (field_list_array.includes('leave_head')) {
                                        ws.cell(index_val, clmn_emp_id++).string("");
                                    }
                                }
                            }
                            else {
                                if (field_list_array.includes('leave_head')) {
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                }
                            }
                            if (field_list_array.includes('encashed')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.encash ? String(leaveLog.encash) : "0"
                                );
                            }
                            if (field_list_array.includes('amount')) {
                                ws.cell(index_val, clmn_emp_id++).string("0");
                            }
                            if (field_list_array.includes('date')) {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    leaveLog.created_at ? String(moment(leaveLog.created_at).format('MM-YYYY')) : ""
                                );
                            }
                        }

                    })).then(async (value) => {
                        // wb.write("leave-encashment-report.xlsx");
                        // let file_location = Site_helper.createFiles(wb, "leave-encashment-report", 'xlsx', req.authData.corporate_id);
                        let file_name = "leave-encashment-report.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/leave-module');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                        // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                        // return resp.status(200).json({ status: "success", data: leaveLogs });
                        // return resp.status(200).json({ status: "success", message: "Xlsx created successfully", url: baseurl + file_location });
                    });

                });
                // LeaveLog.aggregatePaginate(myAggregate,options,async function (err, leaveLog) {
                //     if (err) return resp.json({ status: "error", message: err.message });
                //     if(leaveLog.docs){
                //         for (var j = 0; j < leaveLog.docs.length; j++) {
                //             if(leaveLog.docs[j].employee_details && leaveLog.docs[j].employee_details[0]){
                //                 if(leaveLog.docs[j].employee_details[0].leave_balance_counter){
                //                     for (var i = 0; i < leaveLog.docs[j].employee_details[0].leave_balance_counter.length; i++) {
                //                         if(leaveLog.docs[j].employee_details[0].leave_balance_counter[i]._id.equals(leaveLog.docs[j].employee_details_leave_id)){
                //                             leaveLog.docs[j].leave_head = leaveLog.docs[j].employee_details[0].leave_balance_counter[i];
                //                         }
                //                     }
                //                 }
                //             }
                //         }
                //     }

                //     return resp.status(200).json({ status: "success", data: leaveLog });
                // });

            }
        }
        catch (e) {
            return resp.status(403).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    register_as_per_calender_year_report_export: async function (req, resp, next) {
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
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
                var filter_option = {};
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
                                { parent_hods: { $in: [req.authId] } },
                            ],
                        },
                    };
                }
                var search_option_details = { $match: {} };
                if (req.body.emp_status) {
                    if (req.body.emp_status != 'all') {
                        search_option.$match.status = { $eq: req.body.emp_status };
                    }
                }
                if (req.body.searchkey) {
                    search_option = {
                        $match: {
                            $text: { $search: req.body.searchkey },
                            corporate_id: req.authData.corporate_id,
                            parent_hods: { $in: [req.authId] },
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
                    if (typeof req.body.unchecked_row_ids == "string") {
                        var ids = JSON.parse(req.body.unchecked_row_ids);
                    }
                    else {
                        var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    }
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                } else {
                    if (typeof req.body.checked_row_ids == "string") {
                        var ids = JSON.parse(req.body.checked_row_ids);
                    }
                    else {
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
                            as: "employee_details",
                        },
                    },
                    {
                        $lookup: {
                            from: "revisions",

                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                    },
                                },
                            ],
                            as: "revisions",
                        },
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
                        $match: {
                            'employee_details.leave_balance_counter': { $ne: null }
                        }
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
                            department: {
                                $arrayElemAt: ["$department", 0],
                            },
                            designation: {
                                $arrayElemAt: ["$designation", 0],
                            },
                            branch: {
                                $arrayElemAt: ["$branch", 0],
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
                            created_at: 1,
                            "branch._id": 1,
                            "branch.branch_name": 1,
                            "department._id": 1,
                            "department.department_name": 1,
                            "designation._id": 1,
                            "designation.designation_name": 1,
                            "date_of_join": "$employee_details.employment_hr_details.date_of_join",
                            "full_and_final": "$employee_details.full_and_final",
                            "revisions": 1,
                        },
                    }
                ])
                    .then(async (employees) => {
                        var companyLeaveHead = await LeaveTempHead.find({ corporate_id: req.authData.corporate_id });
                        var field_list_array = ["emp_code", "name", "department", "designation", "branch", "doj", "last_working_date", "year", "total_earn_leave", "total_carry_forward", "total_days"];
                        var wb = new xl.Workbook();
                        var ws = wb.addWorksheet("Sheet 1");
                        var clmn_id = 1;
                        ws.cell(1, clmn_id++).string("SL");
                        if (field_list_array.includes('emp_code')) {
                            ws.cell(1, clmn_id++).string("Employee Id");
                        }
                        if (field_list_array.includes('name')) {
                            ws.cell(1, clmn_id++).string("Name");
                        }
                        if (field_list_array.includes('department')) {
                            ws.cell(1, clmn_id++).string("Department");
                        }
                        if (field_list_array.includes('designation')) {
                            ws.cell(1, clmn_id++).string("Designation");
                        }
                        if (field_list_array.includes('branch')) {
                            ws.cell(1, clmn_id++).string("Branch");
                        }
                        if (field_list_array.includes('doj')) {
                            ws.cell(1, clmn_id++).string("Date Of Joining");
                        }
                        if (field_list_array.includes('last_working_date')) {
                            ws.cell(1, clmn_id++).string("Date of Discharge or dismissal");
                        }
                        if (field_list_array.includes('year')) {
                            ws.cell(1, clmn_id++).string("Calendar year");
                        }
                        if (field_list_array.includes('total_earn_leave')) {
                            ws.cell(1, clmn_id++).string("No. of days leave earned in the immediately preceding calendar year");
                        }
                        if (field_list_array.includes('total_carry_forward')) {
                            ws.cell(1, clmn_id++).string("No. of days leave brought forward (from previous year or years)");
                        }
                        if (field_list_array.includes('total_days')) {
                            ws.cell(1, clmn_id++).string("Actual No. of days worked during the calendar year");
                        }
                        var total_count = 0;
                        await Promise.all(employees.map(async function (employee) {
                            var yearData = [];
                            if (employee.revisions) {
                                if (employee.revisions.length > 0) {
                                    employee.revisions.map(function (rev) {
                                        var total_earn_value = 0;
                                        if (rev.template_data) {
                                            if (rev.template_data.leave_temp_data) {
                                                if (rev.template_data.leave_temp_data.template_data) {
                                                    if (rev.template_data.leave_temp_data.template_data.length > 0) {
                                                        rev.template_data.leave_temp_data.template_data.map(function (datas) {
                                                            total_earn_value += parseFloat(datas.no_of_day);
                                                        })
                                                    }
                                                }
                                            }
                                        }
                                        if (rev.revision_year) {
                                            yearData.push({
                                                'year': rev.revision_year,
                                                'total_earn_leave': total_earn_value
                                            });
                                        }
                                    })
                                }
                            }
                            if (yearData) {
                                if (yearData.length > 0) {
                                    for (var i = 0; i < yearData.sort(compare).length; i++) {
                                        var carry_forward = await LeaveLedgerl.find({ 'employee_id': employee._id, year: yearData[i].year });
                                        var total_carry_forward = 0;
                                        var total_pay_days = 0;
                                        if (carry_forward) {
                                            if (carry_forward.length > 0) {
                                                carry_forward.map(function (cf) {
                                                    if (cf.carry_forward) {
                                                        if (cf.carry_forward.length > 0) {
                                                            cf.carry_forward.map(function (cff) {
                                                                total_carry_forward += parseFloat(cff.balance);
                                                            })
                                                        }
                                                    }
                                                })
                                            }
                                        }
                                        var totalPayDays = await EmployeeMonthlyReport.find({ 'emp_db_id': employee._id, 'emp_id': employee.emp_id, wage_year: yearData[i].year });
                                        if (totalPayDays) {
                                            if (totalPayDays.length > 0) {
                                                totalPayDays.map(function (pdays) {
                                                    if (pdays.attendance_summaries) {
                                                        if (pdays.attendance_summaries.paydays) {
                                                            total_pay_days += parseFloat(pdays.attendance_summaries.paydays);
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                        yearData[i].total_carry_forward = total_carry_forward;
                                        yearData[i].total_days = total_pay_days;
                                        var index_val = 2 + total_count;
                                        index_val = index_val + i;
                                        var clmn_emp_id = 1
                                        ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                                        if (field_list_array.includes('emp_code')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                employee.emp_id ? String(employee.emp_id) : ""
                                            );
                                        }
                                        if (field_list_array.includes('name')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                employee.emp_first_name ? String(employee.emp_first_name + " " + employee.emp_last_name) : ""
                                            );
                                        }
                                        if (field_list_array.includes('department')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                employee.department ? String(employee.department.department_name) : ""
                                            );
                                        }
                                        if (field_list_array.includes('designation')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                employee.designation ? String(employee.designation.designation_name) : ""
                                            );
                                        }
                                        if (field_list_array.includes('branch')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                employee.branch ? String(employee.branch.branch_name) : ""
                                            );
                                        }
                                        if (field_list_array.includes('doj')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                employee.date_of_join ? String(moment(employee.date_of_join).format('DD/MM/YYYY')) : ""
                                            );
                                        }
                                        if (field_list_array.includes('last_working_date')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                employee.full_and_final ? String(moment(employee.full_and_final.last_working_date).format('DD/MM/YYYY')) : ""
                                            );
                                        }
                                        if (field_list_array.includes('year')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                yearData[i].year ? String(yearData[i].year) : ""
                                            );
                                        }
                                        if (field_list_array.includes('total_earn_leave')) {
                                            if (yearData[i].total_earn_leave) {
                                                ws.cell(index_val, clmn_emp_id++).string(
                                                    yearData[i].total_earn_leave ? String(yearData[i].total_earn_leave) : "0"
                                                );
                                            }
                                            else {
                                                ws.cell(index_val, clmn_emp_id++).string("0");
                                            }
                                        }
                                        if (field_list_array.includes('total_carry_forward')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                total_carry_forward ? String(total_carry_forward) : "0"
                                            );
                                        }
                                        if (field_list_array.includes('total_days')) {
                                            ws.cell(index_val, clmn_emp_id++).string(
                                                total_pay_days ? String(total_pay_days) : "0"
                                            );
                                        }

                                    }
                                }
                            }
                            total_count += yearData.length;
                        })).then(async (value) => {
                            // wb.write("register-form-15-year-leave-report.xlsx");
                            // let file_location = Site_helper.createFiles(wb, "register-form-15-year-leave-report", 'xlsx', req.authData.corporate_id);
                            let file_name = "register-form-15-year-leave-report.xlsx";
                            let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/leave-module');
                            await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                            // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                            // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                            // return resp.status(200).json({ status: "success", message: "Xlsx created successfully", url: baseurl + file_location });
                        });
                        // return resp.status(200).json({status: "success",employee:employees}); 
                        // return resp.status(200).json({status: "success",employee:employees ,data: yearData}); 
                    });
            }
        }
        catch (e) {
            return resp.status(403).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
    form_e_rest_leave_calender_year_report_pdf_export: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                // pageno: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp
                    .status(200)
                    .send({
                        status: "val_err",
                        message: "Validation error",
                        val_msg: v.errors,
                    });
            }
            else {
                var sortbyfield = req.body.sortbyfield;
                var start_date = new Date().getFullYear() + '-01-01';
                var end_date = new Date().getFullYear() + '-12-31';
                var leave_start = new Date(new Date().getFullYear(), '00', 2, -18, -30, 0);
                var leave_end = new Date(new Date().getFullYear(), '11', 31, 5, 29, 59);
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
                if (req.body.row_checked_all === "true") {
                    if (typeof req.body.unchecked_row_ids == "string") {
                        var ids = JSON.parse(req.body.unchecked_row_ids);
                    }
                    else {
                        var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                    }
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                } else {
                    if (typeof req.body.checked_row_ids == "string") {
                        var ids = JSON.parse(req.body.checked_row_ids);
                    }
                    else {
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
                            from: "employee_details",
                            localField: "_id",
                            foreignField: "employee_id",
                            as: "employee_details",
                        },
                    },
                    {
                        $lookup: {
                            from: "revisions",

                            "let": { "emp_id_var": "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                    },
                                },
                            ],
                            as: "revisions",
                        },
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
                        $lookup: {
                            from: 'employee_monthly_reports',
                            "let": { "emp_db_idVar": "$_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] } },
                                            { 'wage_year': new Date().getFullYear() },
                                        ]
                                    }
                                }
                            ],
                            as: 'employee_monthly_reports',
                        }
                    },
                    {
                        $lookup: {
                            from: 'employee_leave_summary_logs',
                            "let": { "emp_db_idVar": "$_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] } },
                                            { 'wage_year': new Date().getFullYear() },
                                        ]
                                    }
                                }
                            ],
                            as: 'employee_leave_summary_logs',
                        }
                    },
                    {
                        $match: {
                            'employee_details.leave_balance_counter': { $ne: null }
                        }
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
                            department: {
                                $arrayElemAt: ["$department", 0],
                            },
                            designation: {
                                $arrayElemAt: ["$designation", 0],
                            },
                            branch: {
                                $arrayElemAt: ["$branch", 0],
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
                            created_at: 1,
                            "paydays": { $sum: "$employee_monthly_reports.attendance_summaries.paydays" },
                            "employee_leave_summary_logs": 1
                        },
                    }
                ]).then(async (employees) => {
                    var companyLeaveHead = await LeaveTempHead.find({ corporate_id: req.authData.corporate_id });
                    var array = [];
                    var path_array = [];
                    await Promise.all(employees.map(async function (employee) {

                        var earnedLeaveOpeninfBalance = 0;
                        var medicalLeaveOpeninfBalance = 0;
                        var otherLeaveOpeninfBalance = 0;

                        var earnedLeaveAvailBalance = 0;
                        var medicalLeaveAvailBalance = 0;
                        var otherLeaveAvailBalance = 0;

                        var earnedAddedBalance = 0;
                        var medicalAddedBalance = 0;
                        var otherAddedBalance = 0;

                        var earnedCloseBalance = 0;
                        var medicalCloseBalance = 0;
                        var otherCloseBalance = 0;

                        var leave_added = [];
                        var opening_balance = [];
                        var closing_balance = [];
                        if (employee.employee_leave_summary_logs) {
                            if (employee.employee_leave_summary_logs.length > 0) {
                                employee.employee_leave_summary_logs.map(function (summary_leave) {
                                    if (summary_leave.type === 'opening') {
                                        opening_balance = summary_leave.history;
                                    }
                                    if (summary_leave.type === 'closing') {
                                        closing_balance = summary_leave.history;
                                        // employee.availed = summary_leave.history;
                                    }
                                    if (summary_leave.type === 'earning') {
                                        summary_leave.history.map(function (earning) {
                                            // leave_added.push(earning);
                                        });
                                    }

                                });
                            }
                        }
                        var holder = {};
                        leave_added.forEach(function (d) {
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
                        if (opening_balance.length > 0) {
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                var headDataExist = opening_balance.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if (headDataExist) {
                                    if (companyLeavetempHeads.head_type == 'earned') {
                                        earnedLeaveOpeninfBalance += parseFloat(headDataExist.balance);
                                    }
                                    else if (companyLeavetempHeads.head_type == 'com_defined' && companyLeavetempHeads.abbreviation.includes('MDL')) {
                                        medicalLeaveOpeninfBalance += parseFloat(headDataExist.balance);
                                    }
                                    else {
                                        otherLeaveOpeninfBalance += parseFloat(headDataExist.balance);
                                    }
                                }
                            });
                        }
                        if (closing_balance.length > 0) {
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                var headDataExist = closing_balance.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if (headDataExist) {
                                    if (companyLeavetempHeads.head_type == 'earned') {
                                        earnedCloseBalance += parseFloat(headDataExist.balance);
                                        earnedLeaveAvailBalance += parseFloat(headDataExist.balance);
                                    }
                                    else if (companyLeavetempHeads.head_type == 'com_defined' && companyLeavetempHeads.abbreviation.includes('MDL')) {
                                        medicalCloseBalance += parseFloat(headDataExist.balance);
                                        medicalLeaveAvailBalance += parseFloat(headDataExist.balance);
                                    }
                                    else {
                                        otherCloseBalance += parseFloat(headDataExist.balance);
                                        otherLeaveAvailBalance += parseFloat(headDataExist.balance);
                                    }
                                }
                            });
                        }
                        if (leave_added.length > 0) {
                            companyLeaveHead.map(function (companyLeavetempHeads) {
                                var headDataExist = leave_added.find(element => companyLeavetempHeads._id.equals(element['head_id']));
                                if (headDataExist) {
                                    if (companyLeavetempHeads.head_type == 'earned') {
                                        earnedAddedBalance += parseFloat(headDataExist.balance);
                                    }
                                    else if (companyLeavetempHeads.head_type == 'com_defined' && companyLeavetempHeads.abbreviation.includes('MDL')) {
                                        medicalAddedBalance += parseFloat(headDataExist.balance);
                                    }
                                    else {
                                        otherAddedBalance += parseFloat(headDataExist.balance);
                                    }
                                }
                            });
                        }
                        employee.final_data = {
                            "paydays": employee.paydays,
                            "earned_leave_details": {
                                'opening_balance': earnedLeaveOpeninfBalance,
                                'added_balance': earnedAddedBalance,
                                'leave_avalable_balance': earnedLeaveAvailBalance,
                                'closeing_balance': earnedCloseBalance,
                            },
                            "medical_leave_details": {
                                'opening_balance': medicalLeaveOpeninfBalance,
                                'added_balance': medicalAddedBalance,
                                'leave_avalable_balance': medicalLeaveAvailBalance,
                                'closeing_balance': medicalCloseBalance,
                            },
                            "other_leave_details": {
                                'opening_balance': otherLeaveOpeninfBalance,
                                'added_balance': otherAddedBalance,
                                'leave_avalable_balance': otherLeaveAvailBalance,
                                'closeing_balance': otherCloseBalance,
                            }
                        };
                        // console.log();
                        // var file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/leave_report/";
                        var file_name = 'leave-form-e-rest-report-' + employee.corporate_id + '-' + employee.emp_id + '-' + new Date().getMonth() + '-' + new Date().getFullYear() + '.pdf';
                        let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/leave-module');
                        
                        path_array.push({
                            "link": absolutePath + file.location + file.file_name,
                            "file_path": file.location,
                            "file_name": file.file_name
                        });
                        var pdf_file = await Site_helper.generate_form_e_report_pdf({ employee_data: employee }, file.file_name, file.location);
                    })).then(async (emp) => {
                        var path_link = null;
                        let file_name = "form-e-rest-"+new Date().getMonth()+"-"+new Date().getFullYear()+".zip";
                        let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/leave-module');
                        if (path_array.length > 0) {
                            var dir = absolutePath + file.location;
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir);
                            }
                            const output = fs.createWriteStream(dir + file.file_name);
                            const archive = archiver('zip', {
                                zlib: { level: 9 }
                            });
                            output.on('close', () => {
                                // console.log('Archive finished.');
                            });
                            archive.on('error', (err) => {
                                // console.log('Error.',err);
                            });
                            archive.pipe(output);
                            path_array.map(async function (parray) {
                                archive.append(fs.createReadStream(parray.link), { name: parray.file_name });
                            });
                            archive.finalize();
                            path_link = baseurl + file.location + file_name;
                        }
                        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/leave_report/";
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                        // await Site_helper.downloadAndDelete(file_name,file_path,req.authData.corporate_id,resp);
                        // return resp.status(200).json({ status: "success", message: 'Leave Report Generated successfully.', url: path_link, data: employees });
                    });
                    // return resp.status(200).json({status: "success", data:employees}); 
                });
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong" });
        }
    },
};
function compare(a, b) {
    if (a.year < b.year) {
        return -1;
    }
    if (a.year > b.year) {
        return 1;
    }
    return 0;
}
function getDatesInRange(startDate, endDate) {
    const date = new Date(startDate.getTime());

    const dates = [];

    while (date <= endDate) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }

    return dates;
}



