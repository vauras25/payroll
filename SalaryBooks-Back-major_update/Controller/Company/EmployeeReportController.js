var Company = require('../../Model/Admin/Company');
var Ptaxrule = require('../../Model/Admin/Ptaxrule');
var Esicrule = require('../../Model/Admin/Esicrule');
var Employee = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
var LeaveLog = require("../../Model/Company/LeaveLog");
var Staff = require("../../Model/Company/Staff");
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
const moment = require('moment');
var EmployeeSheetTemplate = require("../../Model/Company/EmployeeSheetTemplate");
var EarningTempHead = require("../../Model/Admin/EarningTempHead");
var xl = require("excel4node");
const Site_helper = require('../../Helpers/Site_helper');
const archiver = require('archiver');
const {resolve} = require('path');
const absolutePath = resolve('');
var fs = require("fs");
const csv = require("csv-parser");
module.exports = {
    employee_form_a_report: async function (req, resp, next) {
        try {
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
                    { status: {$eq : 'active'}}
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
                    "client._id": 1,
                    "client.client_code": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                    "employee_details.emp_address": 1,
                    "employee_details.pf_esic_details": 1,
                    "employee_details.full_and_final": 1,
                    "employee_details.full_and_final": 1,
                    "employee_details.emp_curr_address": 1,
                    "employee_details.bank_details": 1,
                    "employee_details.employment_hr_details": 1,
                },
            },
            ]);
            Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                if (err) return resp.json({ status: "error", message: err.message });
                var masters = { hod_list: [] };
                await Staff.find(
                    { status: "active", is_hod: "yes" },
                    "_id first_name last_name",
                    function (err, staff) {
                        if (!err) {
                            masters.hod_list = staff;
                        }
                    }
                    );
                return resp
                .status(200)
                .json({
                    status: "success",
                    employees: employees,
                    masters: masters,
                });
            });
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    employee_batch_list: async function (req, resp, next) {
        try {
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
                    { status: {$eq : 'active'}}
                    ],
                },
            };

            var search_option_details = { $match: {} };
            if (req.body.searchkey) {
                search_option = {
                    $match: {
                        $text: { $search: req.body.searchkey },
                        corporate_id: req.authData.corporate_id,
                    },
                };
            } 
            else {
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
            if (req.body.row_checked_all === "true" && !req.body.row_checked_all) {
                if(req.body.unchecked_row_ids){
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                }
            } else {
                if(req.body.checked_row_ids){
                    var ids = JSON.parse(req.body.checked_row_ids);
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
                $lookup: {
                    from: "company_details",
                    localField: "corporate_id",
                    foreignField: "details.corporate_id",
                    as: "company_details",
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
                    from: "employee_packages",
                    localField: "employee_details.employment_hr_details.package_id",
                    foreignField: "_id",
                    as: "employee_package",
                },
            },
            {
                $addFields: {
                    client:{
                        $arrayElemAt: ["$client", 0],
                    },
                    hod: {
                        $arrayElemAt: ["$hod", 0],
                    },
                    company_details: {
                        $arrayElemAt: ["$company_details", 0],
                    },
                    employee_details: {
                        $arrayElemAt: ["$employee_details", 0],
                    },
                    designation: {
                        $arrayElemAt: ["$designation", 0],
                    },
                    department: {
                        $arrayElemAt: ["$department", 0],
                    },
                    employee_package: {
                        $arrayElemAt: ["$employee_package", 0],
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
                    client:1,
                    hod:1,
                    company_details:1,
                    designation:1,
                    department:1,
                    employee_package:1,
                    "employee_details.assets":1,
                    "employee_details.contract":1,
                    "employee_details.annual_earnings":1,
                    "employee_details.training":1,
                    "employee_details.employment_disciplinary_details":1,
                    "employee_details.accident":1,
                    "employee_details.extra_curricular":1,
                    "employee_details.education":1,
                },
            }
            ]);
            // .then(async (employees) => {
            //     return resp.status(200).json({ status: "success", employees: employees });
            // });
            Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                if (err) return resp.json({ status: "error", message: err.message });
                
                return resp.status(200).json({status: "success",employees: employees,});
            });
        } catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    employee_incentive_report_list: async function (req, resp, next) {
        try {
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

            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authId] } },
                    { approval_status: {$eq : 'approved'}}
                    ],
                },
            };

            var search_option_details = { $match: {} };
            var search_option_monthly_report = { $match: {} };

            if (req.body.searchkey) {
                search_option = {
                    $match: {
                        $text: { $search: req.body.searchkey },
                        corporate_id: req.authData.corporate_id,
                    },
                };
            } 
            else {
                var query_data = await Site_helper.getEmpFilterData(
                    req,
                    search_option,
                    search_option_details
                  );
                  search_option_details = query_data.search_option_details;
                  search_option = query_data.search_option;
                // if (req.body.emp_first_name) {
                //     search_option.$match.emp_first_name = {
                //         $regex: req.body.emp_first_name,
                //         $options: "i",
                //     };
                // }
                // if (req.body.emp_last_name) {
                //     search_option.$match.emp_last_name = {
                //         $regex: req.body.emp_last_name,
                //         $options: "i",
                //     };
                // }
                // if (req.body.email_id) {
                //     search_option.$match.email_id = {
                //         $regex: req.body.email_id,
                //         $options: "i",
                //     };
                // }
                // if (req.body.pan_no) {
                //     search_option.$match.pan_no = {
                //         $regex: req.body.pan_no,
                //         $options: "i",
                //     };
                // }
                // if (req.body.designation_id) {
                //     var designation_ids = JSON.parse(req.body.designation_id);
                //     designation_ids = designation_ids.map(function (el) {
                //         return mongoose.Types.ObjectId(el);
                //     });
                //     search_option_details.$match[
                //     "employee_details.employment_hr_details.designation"
                //     ] = { $in: designation_ids };
                // }
                // if (req.body.department_id) {
                //     var department_ids = JSON.parse(req.body.department_id);
                //     department_ids = department_ids.map(function (el) {
                //         return mongoose.Types.ObjectId(el);
                //     });
                //     search_option_details.$match[
                //     "employee_details.employment_hr_details.department"
                //     ] = { $in: department_ids };
                // }
                // if (req.body.branch_id) {
                //     var branch_ids = JSON.parse(req.body.branch_id);
                //     branch_ids = branch_ids.map(function (el) {
                //         return mongoose.Types.ObjectId(el);
                //     });
                //     search_option_details.$match[
                //     "employee_details.employment_hr_details.branch"
                //     ] = { $in: branch_ids };
                // }
                // if (req.body.client_id) {
                //     var client_ids = JSON.parse(req.body.client_id);
                //     client_ids = client_ids.map(function (el) {
                //         return mongoose.Types.ObjectId(el);
                //     });
                //     search_option.$match.client_id = { $in: client_ids };

                // }
                // if (req.body.hod_id) {
                //     var hod_ids = JSON.parse(req.body.hod_id);
                //     hod_ids = hod_ids.map(function (el) {
                //         return mongoose.Types.ObjectId(el);
                //     });
                //     search_option.$match.emp_hod = { $in: hod_ids };
                // }
            }
            if (req.body.row_checked_all === "true" && !req.body.row_checked_all) {
                if(req.body.unchecked_row_ids){
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $nin: ids };
                    }
                }
            } else {
                if(req.body.checked_row_ids){
                    var ids = JSON.parse(req.body.checked_row_ids);
                    if (ids.length > 0) {
                        ids = ids.map(function (el) {
                            return mongoose.Types.ObjectId(el);
                        });
                        search_option.$match._id = { $in: ids };
                    }
                }
            }
      
            // if(start_month || start_year || end_month || end_year){
            //     search_option_monthly_report = {
            //         $lookup: {
            //             from: "employee_monthly_reports",
            //             "let": { "emp_id_var": "$_id"},
            //             pipeline: [
            //             {
            //                 $match: {
            //                     "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
            //                     $and: [
            //                     {$or:[ 
            //                         {'wage_year': {$gt: start_year }}, 
            //                         { $and:[
            //                             {'wage_year': {$gte: start_year }},
            //                             {'wage_month': {$gte: start_month }}
            //                             ]
            //                         } 
            //                         ]
            //                     },
            //                     { $or:[ 
            //                         {'wage_year': {$lt: end_year }}, 
            //                         { $and:[
            //                             {'wage_year': {$lte: end_year }},
            //                             {'wage_month': {$lte: end_month }}
            //                             ]
            //                         } 
            //                         ]
            //                     }
            //                     ],
            //                 },
            //             },
            //             ],
            //             as: "employee_monthly_reports",
            //         },
            //     };
            // }
            // else {
            //     search_option_monthly_report = {
            //         $lookup: {
            //             from: "employee_monthly_reports",
            //             "let": { "emp_id_var": "$_id"},
            //             pipeline: [
            //             {
            //                 $match: {
            //                     "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
            //                     $and: [
            //                     {$or:[ 
            //                         {'wage_year': {$eq: new Date().getFullYear() }}, 
            //                         // { $and:[
            //                             //     {'wage_year': {$gte: start_year }},
            //                             //     ]
            //                             // } 
            //                         ]
            //                     },
            //                     ],
            //                 },
            //             },
            //             ],
            //             as: "employee_monthly_reports",
            //         },
            //     };
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
              // {
              //     $lookup: {
              //         from: "company_details",
              //         localField: "corporate_id",
              //         foreignField: "details.corporate_id",
              //         as: "company_details",
              //     },
              // },
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
                  localField:
                    "employee_details.employment_hr_details.designation",
                  foreignField: "_id",
                  as: "designation",
                },
              },
              {
                $lookup: {
                  from: "departments",
                  localField:
                    "employee_details.employment_hr_details.department",
                  foreignField: "_id",
                  as: "department",
                },
              },
              {
                $lookup: {
                  from: "employee_packages",
                  localField:
                    "employee_details.employment_hr_details.package_id",
                  foreignField: "_id",
                  as: "employee_package",
                },
              },
              {
                $lookup: {
                  from: "incentive_modules",
                  let: { emp_db_idVar: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_db_idVar"] } },
                          {
                            $or: [
                              { incentive_g_year: { $gt: start_year } },
                              {
                                $and: [
                                  { incentive_g_year: { $gte: start_year } },
                                  { incentive_g_month: { $gte: start_month } },
                                ],
                              },
                            ],
                          },
                          {
                            $or: [
                              { incentive_g_year: { $lt: end_year } },
                              {
                                $and: [
                                  { incentive_g_year: { $lte: end_year } },
                                  { incentive_g_month: { $lte: end_month } },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                    
                        {
                            $lookup: {
                              from: "employee_advances",
                              localField:"advance_id",
                              foreignField: "_id",
                              as: "employee_advances",
                            },
                          },
                
                    {
                        $lookup: {
                          from: "employee_monthly_reports",
                          let: {
                            emp_idVar: "$emp_id",
                            wage_month: "$incentive_g_month",
                            wage_year: "$incentive_g_year",
                          },
                          pipeline: [
                            {
                              $match: {
                                $and: [
                                  {
                                    $expr: {
                                      $eq: ["$emp_db_id", "$$emp_idVar"],
                                    },
                                  },
                                  {
                                    incentive_report: {
                                      $exists: true,
                                      $ne: null,
                                    },
                                  },
                                  { $expr: {$eq:[ "$wage_month", "$$wage_month"]}},
                                  { $expr: {$eq:[ "$wage_year", "$$wage_year"]}},
                                //   { $expr: { wage_year: "$$wage_year" } },
                                ],
                              },
                            },
                          ],
                          as: "employee_monthly_reports",
                        },
                      },
              
                    {
                        $sort:{"incentive_g_year":-1, "incentive_g_month":-1,}
                    },
                    {
                        $addFields:{
                            employee_monthly_report: {
                                $arrayElemAt: ["$employee_monthly_reports", 0],
                              },
                              employee_advance: {
                                $arrayElemAt: ["$employee_advances", 0],
                              },
                        }
                    },
                    {
                       $group:{
                        _id:"$incentive_g_month",
                        incentive_g_year:{"$first":"$incentive_g_year"},
                        advance_value:{"$first":"$advance_value"},  
                        incentive_value:{"$first":"$incentive_value"},
                        advance_module:{"$first":"$employee_advance"},
                        incentive_report:{"$first":"$employee_monthly_report.incentive_report"},
                       }
                    },
                    // {
                    //     $project:{
                    //         _id:1,
                    //         incentive_g_month:1,
                    //         incentive_g_year:1,
                    //         advance_value:1,
                    //         incentive_value:1,
                    //         employee_monthly_report:1,
                    //     }                        
                    // }
                  ],
                  as: "incentive_modules",
                },
              },
             
              {
                $match: {
                    incentive_modules: { $ne: [] },
                },
              },
              // search_option_monthly_report,
              {
                $addFields: {
                  client: {
                    $arrayElemAt: ["$client", 0],
                  },
                  hod: {
                    $arrayElemAt: ["$hod", 0],
                  },
                  branch: {
                    $arrayElemAt: ["$branch", 0],
                  },
                  // company_details: {
                  //     $arrayElemAt: ["$company_details", 0],
                  // },
                  employee_details: {
                    $arrayElemAt: ["$employee_details", 0],
                  },
                  designation: {
                    $arrayElemAt: ["$designation", 0],
                  },
                  department: {
                    $arrayElemAt: ["$department", 0],
                  },
                  employee_package: {
                    $arrayElemAt: ["$employee_package", 0],
                  },
                  employee_package: {
                    $arrayElemAt: ["$employee_package", 0],
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
                  "incentive_modules":1,
                //   "employee_monthly_reports":1,
                //   combined_data: {
                //     $concatArrays: ["$incentive_modules", "$employee_monthly_reports"]
                //   }

                //   incentive_report:
                //     "$employee_monthly_reports.incentive_report",
                },
              },
            ]);
            if(req.body.generate == 'excel'){
                const {template_fields} = await EmployeeSheetTemplate.findById(req.body.templateId).select();
                myAggregate.then((employees) => {
                    let fields = template_fields[0].modules[0].fields;
                    const startMonth = moment({
                        month: start_month,
                        year: start_year,
                      });
                      const endMonth = moment({
                        month: end_month,
                        year: end_year,
                      });
                  
                     const month_series = new Array(endMonth.diff(startMonth, 'months') + 1).fill(
                        'Wage Month'
                      );
                    const personal_fields_enum = [
                        "sl_no",
                        "emp_id",
                        "emp_name",
                        "department",
                        "designation",
                        "client",
                        "branch",
                        "hod",
                    ]
                    const other_fields_enum = [
                        "incentive_Accumulated",
                        "incentive_Setteled",
                        "advance_Paid",
                        "advance_Recovered",
                        "tds",
                        "er_pf",
                        "ee_pf",
                        "er_esic",
                        "ee_esic",
                        "net_pay",
                    ]
                    const personal_fields = fields.map(field =>  personal_fields_enum.includes(field) ? field.split("_").join(" ").toUpperCase() : null).filter(field => field !==null)
                    const other_fields = fields.map(field =>  other_fields_enum.includes(field) ? field.split("_").join(" ").toUpperCase() : null).filter(field => field !==null)
                    const wb = new xl.Workbook();
                    const ws = wb.addWorksheet("Sheet 1");
                    let row = 1;
                    let col = 1;

                    ws.cell(row, 1, row++, personal_fields_enum.length, true).string('');
                    personal_fields.forEach(field => {
                        ws.cell(row, col++).string(field);
                    })
                    
                    if(employees.length == 1){
                        ws.cell(row, col++).string("Wage Month");
                        other_fields.forEach(field => {
                            ws.cell(row, col++).string(field);
                        });
                        
                    }else{   
                        month_series.forEach((month, index) => {
                            ws.cell(--row, col, row++, (col+other_fields_enum.length - 1), true).string(month +'-'+(index+1)).style({text:{align:"center"}});
                            other_fields.forEach(field => {
                                ws.cell(row, col++).string(field);
                            })
                        })
                    }

                    row = 3;
                    col = 1;
                    
                    employees.forEach((employee, index) => {
                        if(fields.includes('sl_no')) ws.cell(row,col++).number(index + 1);
                        if(fields.includes('emp_id')) ws.cell(row,col++).string(employee.emp_id)
                        if(fields.includes('emp_name')) ws.cell(row,col++).string(employee.emp_first_name  + employee.emp_last_name)
                        if(fields.includes('department')) ws.cell(row,col++).string(employee.department ? employee.department.department_name : 'N/A')
                        if(fields.includes('designation')) ws.cell(row,col++).string(employee.designation ? employee.designation.designation_name : 'N/A')
                        if(fields.includes('client')) ws.cell(row,col++).string(employee.client ? employee.client.client_code : 'N/A')
                        if(fields.includes('branch')) ws.cell(row,col++).string(employee.branch ? employee.branch.branch_name : 'N/A')
                        if(fields.includes('hod')) ws.cell(row,col++).string(employee.hod ? employee.hod.first_name + employee.hod.last_name : "N/A");

                        employee.incentive_modules.forEach((incentive) => {
                            if(employees.length == 1) {
                                const wage_month = moment.monthsShort(incentive._id)
                                ws.cell(row,col++).string(wage_month + '-' + incentive.incentive_g_year);
                            }
                            if(fields.includes('incentive_Accumulated')) ws.cell(row,col++).number(incentive?.incentive_value ?? 0)
                            if(incentive?.advance_module){
                                if(fields.includes('incentive_Setteled')) ws.cell(row,col++).number(incentive?.advance_module?.advance_amount ?? 0)
                            }else if(incentive?.incentive_report?.bank_ins_referance_id){
                                if(fields.includes('incentive_Setteled')) ws.cell(row,col++).number(incentive?.incentive_report?.gross_earning ?? 0)
                            }else{
                                if(fields.includes('incentive_Setteled')) ws.cell(row,col++).number(0)
                            }
                            if(fields.includes('advance_Paid')) ws.cell(row,col++).number(incentive?.advance_module?.advance_amount ?? 0)
                            if(fields.includes('advance_Recovered')) ws.cell(row,col++).number((incentive?.advance_module?.advance_amount ?? 0) - (incentive?.advance_module?.remaining_amount ?? 0) ?? 0)
                            if(fields.includes('tds')) ws.cell(row,col++).number(incentive?.incentive_report?.total_tds_wages ?? 0)
                            if(fields.includes('er_pf')) ws.cell(row,col++).number(incentive?.incentive_report?.pf_data?.emoloyer_pf_contribution ?? 0)
                            if(fields.includes('ee_pf')) ws.cell(row,col++).number(incentive?.incentive_report?.pf_data?.emoloyee_contribution ?? 0)
                            if(fields.includes('er_esic')) ws.cell(row,col++).number(incentive?.incentive_report?.esic_data?.emoloyer_contribution ?? 0)
                            if(fields.includes('ee_esic')) ws.cell(row,col++).number(incentive?.incentive_report?.esic_data?.emoloyee_contribution ?? 0)
                            if(fields.includes('net_pay')) ws.cell(row,col++).number(incentive?.incentive_report?.ctc ?? 0)
                            if(employees.length == 1) {
                                row++
                                col = personal_fields.length + 1
                            }
                        })
                        row++
                        col = 1
                    })
                    
                    // for (let field of fields) {
                    //     if(field !== 'on'){
                    //         // if(personal_fields_enum.includes(field)){
                    //         //     field = field.split("_").join(" ").toUpperCase()
                    //         //     ws.cell(1, ++col).string(field);
                    //         // }else if(other_fields_enum.includes(field)){

                    //         // }
                    //         field = field.split("_").join(" ").toUpperCase()
                    //         ws.cell(1, ++col).string(field);
                    //     }
                    // }


                    // for (const employee of employees) {
                    //     let incentiveReport = employee.incentive_report;
                    //     let accumulated = 0;
                    //     let setteled = 0;
                    //     let advance_paid = 0;
                    //     let advance_recovery = 0;
                    //     let tds = 0;
                    //     let emoloyer_pf_contribution = 0;
                    //     let emoloyer_contribution = 0;
                    //     let pf_emoloyee_contribution = 0;
                    //     let esic_emoloyee_contribution = 0;
                    //     let gross_earning = 0;

                    //     // for (const report of incentiveReport) {
                    //     //     accumulated += report.accumulated || 0
                    //     //     setteled += report.setteled || 0
                    //     //     advance_paid += report.advance_paid || 0
                    //     //     advance_recovery += report.advance_recovery || 0
                    //     //     tds += 0
                    //     //     emoloyer_pf_contribution += report.pf_data.emoloyer_pf_contribution || 0
                    //     //     emoloyer_contribution += report.esic_data.emoloyer_contribution || 0
                    //     //     pf_emoloyee_contribution += report.pf_data.emoloyee_contribution || 0
                    //     //     esic_emoloyee_contribution += report.esic_data.emoloyee_contribution || 0
                    //     //     gross_earning += report.gross_earning || 0
                    //     // }
                    //     let col = 1;
                    //     if(fields.includes('sl_no')) ws.cell(row,col++).number(row - 1);
                    //     if(fields.includes('emp_id')) ws.cell(row,col++).string(employee.emp_id)
                    //     if(fields.includes('emp_name')) ws.cell(row,col++).string(employee.emp_first_name  + employee.emp_last_name)
                    //     if(fields.includes('department')) ws.cell(row,col++).string(employee.department ? employee.department.department_name : 'N/A')
                    //     if(fields.includes('designation')) ws.cell(row,col++).string(employee.designation ? employee.designation.designation_name : 'N/A')
                    //     if(fields.includes('client')) ws.cell(row,col++).string(employee.client ? employee.client.client_code : 'N/A')
                    //     if(fields.includes('branch')) ws.cell(row,col++).string(employee.branch ? employee.branch.branch_name : 'N/A')
                    //     if(fields.includes('hod')) ws.cell(row,col++).string(employee.hod ? employee.hod.first_name + employee.hod.last_name : "N/A")
                    //     if(fields.includes('incentive_Accumulated')) ws.cell(row,col++).number(accumulated)
                    //     if(fields.includes('incentive_Setteled')) ws.cell(row,col++).number(setteled)
                    //     if(fields.includes('advance_Paid')) ws.cell(row,col++).number(advance_paid)
                    //     if(fields.includes('advance_Recovered')) ws.cell(row,col++).number(advance_recovery)
                    //     if(fields.includes('tds')) ws.cell(row,col++).number(tds)
                    //     if(fields.includes('er_pf')) ws.cell(row,col++).number(emoloyer_pf_contribution)
                    //     if(fields.includes('ee_pf')) ws.cell(row,col++).number(pf_emoloyee_contribution)
                    //     if(fields.includes('er_esic')) ws.cell(row,col++).number(emoloyer_contribution)
                    //     if(fields.includes('ee_esic')) ws.cell(row,col++).number(esic_emoloyee_contribution)
                    //     if(fields.includes('net_pay')) ws.cell(row,col++).number(gross_earning)
                        
                    //     row++
                    // }
                    const file_name = 'incentive-report.xlsx'
                    let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/incentive-module');
                    Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                }, (err) => {
                    return resp.json({ status: "error", message: err.message });
                })
            }else{
                Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    
                    return resp.status(200).json({status: "success",employees: employees,});
                });
            }
        } catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    // FORM A - REPORT 8 EMPLOYEE LIST -- (Master Roll Form A) 
    employee_master_roll_form_a_report: async function (req, resp, next) {
        try {
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
                    { status: {$eq : 'active'}}
                    ],
                },
            };
            var company = await Company.findOne({'_id':req.authId},'establishment_name');
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
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "branch": {
                        "$arrayElemAt": [ "$branch", 0 ]
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
                    mobile_no: 1,
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
                    nationality:1,
                    emp_age: {
                        $divide: [
                        { $subtract: [new Date(), "$emp_dob"] },
                        365 * 24 * 60 * 60 * 1000,
                        ],
                    },
                    "client._id": 1,
                    "client.client_code": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                    "employee_details.emp_address": 1,
                    "employee_details.pf_esic_details": 1,
                    "employee_details.full_and_final": 1,
                    "employee_details.full_and_final": 1,
                    "employee_details.emp_curr_address": 1,
                    "employee_details.bank_details": 1,
                    "employee_details.employment_hr_details": 1,
                },
            },
            ]);
            if(req.body.generate == 'excel'){
                var field_list_array = [
                    "emp_id",
                    "name",
                    "surname",
                    "gender",
                    "emp_father_name",
                    "emp_dob",
                    "nationality",
                    "education_level",
                    "date_of_joining",
                    "designation",
                    "category_address",
                    "type_of_employment",
                    "mobile",
                    "uan_no",
                    "pan_no",
                    "esic_ip",
                    "lwf",
                    "aadhar_no",
                    "bank_account",
                    "bank_name",
                    "bank_branch",
                    "present_address",
                    "permanent_address",
                ];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, 1, 1, 31, true).string('SCHEDULE').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(2, 1, 2, 31, true).string('(See rule 2 (1) )').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(3, 1, 3, 31, true).string('FORM  A').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(4, 1, 4, 31, true).string('FORMAT OF EMPLOYEE REGISTER').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(5, 1, 5, 31, true).string('[Part-A: For all Establishments]').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(6, 1, 6, 8, true).string('Name of the Establishment  : ').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(6, 9, 6, 10, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(6, 11, 6, 16, true).string(' Name of Owner :').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(6, 17, 6, 18, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(6, 19, 6, 31, true).string("LIN :").style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(7, clmn_id++).string("SL");
                if (field_list_array.includes("emp_id")) {
                  ws.cell(7, clmn_id++).string("Employee Code");
                }
                if (field_list_array.includes("name")) {
                  ws.cell(7, clmn_id++).string("Name");
                }
                if (field_list_array.includes("surname")) {
                  ws.cell(7, clmn_id++).string("Surname");
                }
                if (field_list_array.includes("gender")) {
                  ws.cell(7, clmn_id++).string("Gender");
                }
                if (field_list_array.includes("emp_father_name")) {
                  ws.cell(7, clmn_id++).string("Father’s/Spouse Name");
                }
                if (field_list_array.includes("emp_dob")) {
                  ws.cell(7, clmn_id++).string("Date of Birth");
                }
                if (field_list_array.includes("nationality")) {
                  ws.cell(7, clmn_id++).string("Nationality");
                }
                if (field_list_array.includes("education_level")) {
                  ws.cell(7, clmn_id++).string("Education Level");
                }
                if (field_list_array.includes("date_of_joining")) {
                  ws.cell(7, clmn_id++).string("Date of Joining");
                }
                if (field_list_array.includes("designation")) {
                  ws.cell(7, clmn_id++).string("Designation");
                }
                if (field_list_array.includes("category_address")) {
                  ws.cell(7, clmn_id++).string("Category Address *(HS/S/SS/US)");
                }
                if (field_list_array.includes("type_of_employment")) {
                  ws.cell(7, clmn_id++).string("Type of Employment");
                }
                if (field_list_array.includes("mobile")) {
                  ws.cell(7, clmn_id++).string("Mobile");
                }
                if (field_list_array.includes("uan_no")) {
                  ws.cell(7, clmn_id++).string("UAN");
                }
                if (field_list_array.includes("pan_no")) {
                  ws.cell(7, clmn_id++).string("PAN");
                }
                if (field_list_array.includes("esic_ip")) {
                  ws.cell(7, clmn_id++).string("ESIC IP");
                }
                if (field_list_array.includes("lwf")) {
                  ws.cell(7, clmn_id++).string("LWF");
                }
                if (field_list_array.includes("aadhar_no")) {
                  ws.cell(7, clmn_id++).string("AADHAAR");
                }
                if (field_list_array.includes("bank_account")) {
                  ws.cell(7, clmn_id++).string("Bank A/c Number");
                }
                if (field_list_array.includes("bank_name")) {
                  ws.cell(7, clmn_id++).string("Bank Name");
                }
                if (field_list_array.includes("bank_branch")) {
                  ws.cell(7, clmn_id++).string("Branch (IFSC)");
                }
                if (field_list_array.includes("present_address")) {
                  ws.cell(7, clmn_id++).string("Present Address");
                }
                if (field_list_array.includes("permanent_address")) {
                  ws.cell(7, clmn_id++).string("Permanent Address");
                }
                ws.cell(7, clmn_id++).string("Servie Book No.");
                ws.cell(7, clmn_id++).string("Date of Exit");
                ws.cell(7, clmn_id++).string("Reason for Exit");
                ws.cell(7, clmn_id++).string("Mark of Identification");
                ws.cell(7, clmn_id++).string("Photo");
                ws.cell(7, clmn_id++).string("Specimen Signature/Thumb Impression");
                ws.cell(7, clmn_id++).string("Remarks");
                myAggregate.then(async (employees) => {
                    await Promise.all(
                      employees.map(async (emp, index) => {
                        var index_val_count = 2;
                        var index_val = 8;
                        index_val = index_val + index;
                        var clmn_emp_id = 1;
                        ws.cell(index_val, clmn_emp_id++).number((index_val_count + index) - 1);
                        if(field_list_array.includes('emp_id'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(
                                emp.emp_id ? String(emp.emp_id) : ""
                                );
                        }
                        if(field_list_array.includes('name'))
                        {
                            ws.cell(index_val,clmn_emp_id++).string(
                                emp.emp_first_name ? String(emp.emp_first_name +" "+ emp.emp_last_name) : ""
                                );
                        }
                        if (field_list_array.includes("surname")) {
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                        if(field_list_array.includes('gender'))
                        {
                            ws.cell(index_val,clmn_emp_id++).string(
                                emp.sex ? emp.sex : ""
                                );
                        }
                        if(field_list_array.includes('emp_father_name'))
                        {
                            ws.cell(index_val,clmn_emp_id++).string(
                                emp.emp_father_name ? emp.emp_father_name : ""
                                );
                        }
                        if (field_list_array.includes("emp_dob")) {
                            ws.cell(index_val, clmn_emp_id++).string(
                                emp.emp_dob ? String(emp.emp_dob) : ""
                            );
                        }
                        if (field_list_array.includes("nationality")) {
                            if(emp?.nationality){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    emp.nationality ? String(emp?.nationality) : ""
                                );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if (field_list_array.includes("education_level")) {
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                        if (field_list_array.includes("date_of_joining")) {
                            if(emp?.employee_details?.employment_hr_details?.date_of_join){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    emp.employee_details?.employment_hr_details ? String(emp?.employee_details?.employment_hr_details?.date_of_join) : ""
                                );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if(field_list_array.includes('designation'))
                        {
                            ws.cell(index_val, clmn_emp_id++).string(
                                emp.designation ? String(emp.designation.designation_name) : ""
                                );
                           
                        }
                        if (field_list_array.includes("category_address")) {
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                        if (field_list_array.includes("type_of_employment")) {
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                        if (field_list_array.includes("mobile")) {
                            ws.cell(index_val, clmn_emp_id++).string(
                                emp.mobile_no ? String(emp.mobile_no) : ""
                            );
                        }
                        if (field_list_array.includes("uan_no")) {
                            if(emp?.employee_details?.pf_esic_details?.curr_er_epfo_details?.uan_no){
                                ws.cell(index_val, clmn_emp_id++).string(emp?.employee_details?.pf_esic_details?.curr_er_epfo_details?.uan_no);
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        
                        if (field_list_array.includes("pan_no")) {
                            ws.cell(index_val, clmn_emp_id++).string(
                               emp.pan_no ? String(emp.pan_no) : ""
                            );
                        }
                        if (field_list_array.includes("esic_ip")) {
                            if(emp?.employee_details?.pf_esic_details?.curr_er_esic_details?.esic_no){
                                  ws.cell(index_val, clmn_emp_id++).string(
                                      emp?.employee_details?.pf_esic_details?.curr_er_esic_details?.esic_no
                                  );
                              }
                              else{
                                  ws.cell(index_val, clmn_emp_id++).string(
                                      ""
                                  );
                              }
                        }
                        if (field_list_array.includes("lwf")) {
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                        if (field_list_array.includes("aadhar_no")) {
                            ws.cell(index_val, clmn_emp_id++).string(
                                emp.aadhar_no ? String(emp.aadhar_no) : ""
                            );
                        }
                        if (field_list_array.includes("bank_account")) {
                            if(emp?.employee_details?.bank_details?.account_no){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    emp?.employee_details?.bank_details?.account_no
                                );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if (field_list_array.includes("bank_name")) {
                            if(emp?.employee_details?.bank_details?.bank_name){
                              ws.cell(index_val, clmn_emp_id++).string(
                                emp?.employee_details?.bank_details?.bank_name
                              );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        if (field_list_array.includes("bank_branch")) {
                            if(emp?.employee_details?.bank_details?.ifsc_code){
                              ws.cell(index_val, clmn_emp_id++).string(
                                emp?.employee_details?.bank_details?.ifsc_code
                              );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        var present_address = '';
                        if(emp.employee_details){
                            if(emp.employee_details.emp_address){
                                if(emp?.employee_details?.emp_address?.resident_no){
                                    present_address += emp?.employee_details?.emp_address?.resident_no +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.residential_name){
                                    present_address += emp?.employee_details?.emp_address?.residential_name +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.city){
                                    present_address += emp?.employee_details?.emp_address?.city +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.district){
                                    present_address += emp?.employee_details?.emp_address?.district +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.town_village){
                                    present_address += emp?.employee_details?.emp_address?.town_village +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.road){
                                    present_address += emp?.employee_details?.emp_address?.road +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.state){
                                    present_address += emp?.employee_details?.emp_address?.state +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.locality){
                                    present_address += emp?.employee_details?.emp_address?.locality +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.pincode){
                                    present_address += emp?.employee_details?.emp_address?.pincode +' ,';
                                }
                                if(emp?.employee_details?.emp_address?.country){
                                    present_address += emp?.employee_details?.emp_address?.country +' ,';
                                }
                            }
                        }
                        if (field_list_array.includes("present_address")) {
                          ws.cell(index_val, clmn_emp_id++).string(
                            present_address ? String(present_address) : ""
                          );
                        }
                        var permanent_address = '';
                        if(emp.employee_details){
                            if(emp.employee_details.emp_curr_address){
                                if(emp?.employee_details?.emp_curr_address?.resident_no){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.resident_no +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.residential_name){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.residential_name +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.city){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.city +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.district){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.district +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.town_village){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.town_village +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.road){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.road +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.state){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.state +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.locality){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.locality +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.pincode){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.pincode +' ,';
                                }
                                if(emp?.employee_details?.emp_curr_address?.country){
                                    permanent_address += emp?.employee_details?.emp_curr_address?.country +' ,';
                                }
                            }
                        }
                        if (field_list_array.includes("permanent_address")) {
                          ws.cell(index_val, clmn_emp_id++).string(
                            permanent_address ? String(permanent_address) : ""
                          );
                        }
                        ws.cell(index_val, clmn_emp_id++).string("");
                        ws.cell(index_val, clmn_emp_id++).string("");
                        ws.cell(index_val, clmn_emp_id++).string("");
                        ws.cell(index_val, clmn_emp_id++).string("");
                        ws.cell(index_val, clmn_emp_id++).string("");
                        ws.cell(index_val, clmn_emp_id++).string("");
                        ws.cell(index_val, clmn_emp_id++).string("");

                    })).then(async(value) => {
                        let file_name = "master-roll-form-a-report.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    });
                });

            }
            else{
                // Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                //     if (err) return resp.json({ status: "error", message: err.message });
                //     var masters = { hod_list: [] };
                //     await Staff.find(
                //         { status: "active", is_hod: "yes" },
                //         "_id first_name last_name",
                //         function (err, staff) {
                //             if (!err) {
                //                 masters.hod_list = staff;
                //             }
                //         }
                //         );
                //     return resp
                //     .status(200)
                //     .json({
                //         status: "success",
                //         employees: employees,
                //         masters: masters,
                //     });
                // });
                return resp
                    .status(200)
                    .json({
                        status: "success",
                        employees: await myAggregate,
                        company: company,
                    });
            }
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    // Form B WAGE REGISTER REPORT NO - 13
    employee_form_b_wage_register_report: async function (req, resp, next) {
        try {
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
            var company = await Company.findOne({'_id':req.authId},'establishment_name');
            var filter_option = {};

            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authId] } },
                    { status: {$eq : 'active'}}
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
            search_option_details.$match['employee_monthly_reports'] =  {$exists: true , $ne: []} ;
            var myAggregate = Employee.aggregate([search_option,
            // {
            //     $lookup: {
            //         from: "clients",
            //         localField: "client_code",
            //         foreignField: "_id",
            //         as: "client",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "staffs",
            //         localField: "emp_hod",
            //         foreignField: "_id",
            //         as: "hod",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "employee_details",
            //         localField: "_id",
            //         foreignField: "employee_id",
            //         as: "employee_details",
            //     },
            // },
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
                    from: "tds_templates",
                    "let": { "emp_id_var": "$company_id"},
                    pipeline: [
                    {
                        $match: {
                            "$expr": { "$eq": ["$companies._id", "$$emp_id_var"] },
                            $and: [
                                {'define_deductions_rebate_financial_year': {$eq: new Date().getFullYear().toString() }}
                            ],
                        },
                    },
                    ],
                    as: "tds_templates",
                },
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
                                {'salary_report' : {$exists: true , $ne: null}},
                                // {'extra_earning_report.bank_ins_referance_id' : { $ne: '' }},
                                {$or:[ 
                                        {'wage_year': {$gt: start_year }}, 
                                        { $and:[
                                            {'wage_year': {$gte: start_year }},
                                            {'wage_month': {$gte: start_month }}
                                            ]
                                        } 
                                    ]
                                },
                                { $or:[ 
                                        {'wage_year': {$lt: end_year }}, 
                                        { $and:[
                                            {'wage_year': {$lte: end_year }},
                                            {'wage_month': {$lte: end_month }}
                                            ]
                                        } 
                                    ]
                                }
                            ] 
                        } 
                    }],
                    as: 'employee_monthly_reports',
                }
            },
            search_option_details,
            // {
            //     $lookup: {
            //         from: "branches",
            //         localField: "employee_details.employment_hr_details.branch",
            //         foreignField: "_id",
            //         as: "branch",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "designations",
            //         localField: "employee_details.employment_hr_details.designation",
            //         foreignField: "_id",
            //         as: "designation",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "departments",
            //         localField: "employee_details.employment_hr_details.department",
            //         foreignField: "_id",
            //         as: "department",
            //     },
            // },
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
                    companies: {
                        $arrayElemAt: ["$companies", 0],
                    },
                    tds_templates: {
                        $arrayElemAt: ["$tds_templates", 0],
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
                    "employee_monthly_reports.wage_month":1,
                    "employee_monthly_reports.wage_year":1,
                    "employee_monthly_reports.salary_report":1,
                    "employee_monthly_reports.master_report.gross_earning":1,
                    "employee_monthly_reports.master_report.ot_report.gross_earning":1,
                    "employee_monthly_reports.attendance_summaries.paydays":1,
                    "employee_monthly_reports.attendance_summaries.total_overtime":1,
                    "tds_templates.salary_head_to_earning_head":1,
                },
            },
            ]);
            if(req.body.generate == 'excel'){
                var field_list_array = [
                    "name",
                    "rate_of_wage",
                    "no_of_days_worked",
                    "overtime_hours_worked",
                    "basic",
                    "hra",
                    "leave_sal",
                    "overtime",
                    "gross_wages_payable",
                    "pf",
                    "pt",
                    "esi",
                    "advance",
                    "total_deduction",
                    "net_payment",
                    "employer_share_pf_welfare_found"
                ];
                var total_days = moment(start_year+"-"+(start_month+1), "YYYY-MM").daysInMonth();
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, 1, 1, 10, true).string('FORM B').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(2, 1, 2, 10, true).string('FORMAT FOR WAGE REGISTER').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(4, 1, 4, 8, true).string('Name of the Establishment  : ').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(4, 9, 4, 10, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(4, 11, 4, 16, true).string(' Name of Owner :').style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(4, 17, 4, 18, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(4, 19, 4, 31, true).string("LIN :").style({alignment: {vertical: 'center',horizontal: 'center'}});
               
                ws.cell(5, 1, 5, 10, true).string("Wage period From : "+"01/"+(start_month+1)+"/"+start_year + " To " + total_days +"/"+(end_month+1)+"/"+end_year).style({alignment: {vertical: 'center',horizontal: 'center'}});
                
                ws.cell(6, 6, 6, 9, true).string("Earned Wages ").style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(6, 11, 6, 14, true).string("Deductions ").style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(7, clmn_id++).string("Sl. No. in Employee register");
                ws.cell(7, clmn_id++).string("Name");
                ws.cell(7, clmn_id++).string("Rate of Wage");
                ws.cell(7, clmn_id++).string("No. of Days worked");
                ws.cell(7, clmn_id++).string("Overtime hours worked");
                ws.cell(7, clmn_id++).string("BASIC");
                ws.cell(7, clmn_id++).string("HRA");
                ws.cell(7, clmn_id++).string("Others");
                ws.cell(7, clmn_id++).string("Overtime");
                ws.cell(7, clmn_id++).string("Gross wages Payable");
                ws.cell(7, clmn_id++).string("PF");
                ws.cell(7, clmn_id++).string("PT");
                ws.cell(7, clmn_id++).string("ESI");
                ws.cell(7, clmn_id++).string("Advance");
                ws.cell(7, clmn_id++).string("Total Deduction");
                ws.cell(7, clmn_id++).string("Net Payment");
                ws.cell(7, clmn_id++).string("Employer Share PF Welfare Found");
                ws.cell(7, clmn_id++).string("Receipt by Employee/Bank Transaction ID");
                ws.cell(7, clmn_id++).string("Date of Payment");
                ws.cell(7, clmn_id++).string("Remarks");
                myAggregate.then(async (employees)=> {
                    await Promise.all(employees.map(async function(employee, index){
                        var index_val_count = 2;
                        var index_val = 8;
                        index_val = index_val + index;
                        var clmn_emp_id = 1;
                        ws.cell(index_val, clmn_emp_id++).number((index_val_count + index) - 1);
                        if(field_list_array.includes('name'))
                        {
                            ws.cell(index_val,clmn_emp_id++).string(
                                    employee.emp_first_name ? String(employee.emp_first_name +" "+ employee.emp_last_name) : ""
                                    );
                        }
                        if(field_list_array.includes('rate_of_wage'))
                        {
                            if(employee?.employee_monthly_reports?.master_report){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.master_report?.gross_earning);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0.00);
                            }
                        }
                        if(field_list_array.includes('no_of_days_worked'))
                        {
                            var paydays = 0;
                            if(employee?.employee_monthly_reports?.attendance_summaries){
                                paydays = employee?.employee_monthly_reports?.attendance_summaries?.paydays;
                            }
                            ws.cell(index_val,clmn_emp_id++).number(paydays);
                        }
                        if(field_list_array.includes('overtime_hours_worked'))
                        {
                            if(employee?.employee_monthly_reports?.attendance_summaries?.total_overtime){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.attendance_summaries?.total_overtime);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        var basicHeadAmount = 0.00;
                        var hraHeadAmount = 0.00;
                        var overtimeHeadAmount = 0.00;
                        var LeaveHeadAmount = 0.00;
                        var OtherHeadAmount = 0.00;
                        var OtherHeadAmount2 = 0.00;
                        var sumAmount = 0.00;
                        if(employee?.employee_monthly_reports){
                            if(employee?.employee_monthly_reports?.salary_report){
                                if(employee?.employee_monthly_reports?.salary_report?.heads.length > 0){
                                    if(employee?.tds_templates?.salary_head_to_earning_head){
                                        await Promise.all(employee?.tds_templates?.salary_head_to_earning_head.map(async function (er_heads) {
                                            var earning_temp_head  = await EarningTempHead.findOne({'_id':er_heads.tax_earning_head});
                                            if(earning_temp_head){
                                                if (earning_temp_head.abbreviation.includes('basic') || earning_temp_head.abbreviation.includes('Basic') || earning_temp_head.abbreviation.includes('BASIC')) {
                                                    if(employee?.employee_monthly_reports?.salary_report?.heads){
                                                        employee.employee_monthly_reports.salary_report.heads.map(function (heads) {
                                                            if(mongoose.Types.ObjectId(er_heads.salary_head).equals(mongoose.Types.ObjectId(heads.head_id))){
                                                                basicHeadAmount += parseFloat(heads.amount);
                                                            }
                                                        })
                                                    }
                                                }
                                                if (earning_temp_head.abbreviation.includes('HRA') || earning_temp_head.abbreviation.includes('hra') || earning_temp_head.abbreviation.includes('Hra')) {
                                                    if(employee?.employee_monthly_reports?.salary_report?.heads){
                                                        employee.employee_monthly_reports.salary_report.heads.map(function (heads) {
                                                            if(mongoose.Types.ObjectId(er_heads.salary_head).equals(mongoose.Types.ObjectId(heads.head_id))){
                                                                hraHeadAmount += parseFloat(heads.amount);
                                                            }
                                                        })
                                                    }
                                                }
                                                if(employee?.employee_monthly_reports?.salary_report?.heads){
                                                    employee.employee_monthly_reports.salary_report.heads.map(function (heads) {
                                                        if(mongoose.Types.ObjectId(er_heads.salary_head).valueOf() !== mongoose.Types.ObjectId(heads.head_id).valueOf()){
                                                            OtherHeadAmount += parseFloat(heads.amount);
                                                        }
                                                    })
                                                }
                                                if(basicHeadAmount > hraHeadAmount){
                                                    sumAmount = basicHeadAmount - hraHeadAmount;
                                                }
                                                else if(hraHeadAmount > basicHeadAmount){
                                                    sumAmount = hraHeadAmount - basicHeadAmount;
                                                }
                                                OtherHeadAmount2 = (OtherHeadAmount / 2)  - sumAmount;
                                            }
                                        }));
                                    }
                                }
                            }
                        }
                        // console.log(OtherHeadAmount);
                        if(field_list_array.includes('basic'))
                        {
                            ws.cell(index_val,clmn_emp_id++).number(basicHeadAmount);
                        }
                        if(field_list_array.includes('hra'))
                        {
                            ws.cell(index_val,clmn_emp_id++).number(hraHeadAmount);
                        }
                        if(field_list_array.includes('leave_sal'))
                        {
                            ws.cell(index_val,clmn_emp_id++).number(OtherHeadAmount2);
                        }
                        if(field_list_array.includes('overtime'))
                        {
                            if(employee?.employee_monthly_reports?.master_report?.ot_report){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.master_report?.ot_report?.gross_earning);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0.00);
                            }
                        }
                        if(field_list_array.includes('gross_wages_payable'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.gross_earning){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.gross_earning);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        if(field_list_array.includes('pf'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.pf_data?.emoloyee_contribution){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.pf_data?.emoloyee_contribution);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        if(field_list_array.includes('pt'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.pt_amount){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.pt_amount);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        if(field_list_array.includes('esi'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.esic_data?.emoloyee_contribution){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.esic_data?.emoloyee_contribution);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        if(field_list_array.includes('advance'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.advance_recovered){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.advance_recovered);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        if(field_list_array.includes('total_deduction'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.gross_deduct){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.gross_deduct);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        if(field_list_array.includes('net_payment'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.net_take_home){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.net_take_home);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }
                        if(field_list_array.includes('employer_share_pf_welfare_found'))
                        {
                            if(employee?.employee_monthly_reports?.salary_report?.pf_data?.total_employer_contribution){
                                ws.cell(index_val,clmn_emp_id++).number(employee?.employee_monthly_reports?.salary_report?.pf_data?.total_employer_contribution);
                            }
                            else{
                                ws.cell(index_val,clmn_emp_id++).number(0);
                            }
                        }

                    })).then(async(value) => {
                        let file_name = "form-b-wage-register-report.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    });
                });

            }
            else{

                // Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                    // if (err) return resp.json({ status: "error", message: err.message });
                    // var masters = { hod_list: [] };
                    // await Staff.find(
                    //     { status: "active", is_hod: "yes" },
                    //     "_id first_name last_name",
                    //     function (err, staff) {
                    //         if (!err) {
                    //             masters.hod_list = staff;
                    //         }
                    //     }
                    //     );

                    // if(employees.employee_monthly_reports.length > 0){

                    // }
                    myAggregate.then(async (employees)=> {
                        await Promise.all(employees.map(async function(employee, index){
                            var basicHeadAmount = 0.00;
                            var hraHeadAmount = 0.00;
                            var overtimeHeadAmount = 0.00;
                            var LeaveHeadAmount = 0.00;
                            var OtherHeadAmount = 0.00;
                            var sumAmount = 0.00;
                            var earn_heads_amounts = {};
                            if(employee?.employee_monthly_reports){
                                if(employee?.employee_monthly_reports?.salary_report){
                                    if(employee?.employee_monthly_reports?.salary_report?.heads.length > 0){
                                        if(employee?.tds_templates?.salary_head_to_earning_head){
                                            await Promise.all(employee?.tds_templates?.salary_head_to_earning_head.map(async function (er_heads) {
                                                var earning_temp_head  = await EarningTempHead.findOne({'_id':er_heads.tax_earning_head});
                                                if(earning_temp_head){
                                                    if (earning_temp_head.abbreviation.includes('basic') || earning_temp_head.abbreviation.includes('Basic') || earning_temp_head.abbreviation.includes('BASIC')) {
                                                        if(employee?.employee_monthly_reports?.salary_report?.heads){
                                                            employee.employee_monthly_reports.salary_report.heads.map(function (heads) {
                                                                if(mongoose.Types.ObjectId(er_heads.salary_head).equals(mongoose.Types.ObjectId(heads.head_id))){
                                                                    basicHeadAmount += parseFloat(heads.amount);
                                                                }
                                                            })
                                                        }
                                                        Object.assign(earn_heads_amounts, {
                                                            'head_1' : {
                                                                'abbreviation' : 'Basic',
                                                                'amount' : basicHeadAmount
                                                            }
                                                        });
                                                    }
                                                    if (earning_temp_head.abbreviation.includes('HRA') || earning_temp_head.abbreviation.includes('hra') || earning_temp_head.abbreviation.includes('Hra')) {
                                                        if(employee?.employee_monthly_reports?.salary_report?.heads){
                                                            employee.employee_monthly_reports.salary_report.heads.map(function (heads) {
                                                                if(mongoose.Types.ObjectId(er_heads.salary_head).equals(mongoose.Types.ObjectId(heads.head_id))){
                                                                    hraHeadAmount += parseFloat(heads.amount);
                                                                }
                                                            })
                                                        }
                                                        Object.assign(earn_heads_amounts, {'head_2':{
                                                            'abbreviation' : 'Hra',
                                                            'amount' : hraHeadAmount
                                                        }});
                                                    }
                                                    
                                                    if(employee?.employee_monthly_reports?.salary_report?.heads){
                                                        employee.employee_monthly_reports.salary_report.heads.map(function (heads) {
                                                            if(mongoose.Types.ObjectId(er_heads.salary_head).valueOf() !== mongoose.Types.ObjectId(heads.head_id).valueOf()){
                                                                OtherHeadAmount += parseFloat(heads.amount);
                                                            }
                                                        })
                                                    } 
                                                }
                                            }));
                                            if(basicHeadAmount > hraHeadAmount){
                                                sumAmount = basicHeadAmount - hraHeadAmount;
                                            }
                                            else if(hraHeadAmount > basicHeadAmount){
                                                sumAmount = hraHeadAmount - basicHeadAmount;
                                            }
                                            Object.assign(earn_heads_amounts, {'head_3':{
                                                'abbreviation' : 'Others',
                                                'amount' : (OtherHeadAmount / 2)  - sumAmount
                                            }});
                                        }
                                    }
                                }
                            }
                            employee.earn_heads_amounts = earn_heads_amounts;
                        })).then(async(values) => {
                            return resp
                            .status(200)
                            .json({
                                status: "success",
                                employees: employees,
                                company: company,
                            });         
                        });
                    });
                    // return resp
                    // .status(200)
                    // .json({
                    //     status: "success",
                    //     employees: await myAggregate,
                    //     company: company,
                    // });
                // });
            }
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    // 14ESIC  FORM37 _ 7A
    company_esic_form_report: async function (req, resp, next) {
        try {
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
            // var start_month = parseInt(req.body.wage_month_from);
            // var start_year = parseInt(req.body.wage_year_from);
            // var end_month = parseInt(req.body.wage_month_to);
            // var end_year = parseInt(req.body.wage_year_to);
            var filter_option = {};

            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authId] } },
                    { status: {$eq : 'active'}}
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
            // search_option_details.$match['employee_monthly_reports'] =  {$exists: true , $ne: []} ;
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
                    from: "companies",
                    localField: "corporate_id",
                    foreignField: "corporate_id",
                    as: "companies",
                },
            },
            {
                $lookup: {
                    from: "company_details",
                    localField: "company_id",
                    foreignField: "companies._id",
                    as: "company_details",
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
            // {
            //     $lookup:{
            //         from: 'employee_monthly_reports',
            //         "let": { "emp_db_idVar": "$_id"},
            //         "pipeline": [
            //         { 
            //             "$match": {
            //                 $and :[
            //                     {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
            //                     {'salary_report' : {$exists: true , $ne: null}},
            //                     // {'extra_earning_report.bank_ins_referance_id' : { $ne: '' }},
            //                     {$or:[ 
            //                             {'wage_year': {$gt: start_year }}, 
            //                             { $and:[
            //                                 {'wage_year': {$gte: start_year }},
            //                                 {'wage_month': {$gte: start_month }}
            //                                 ]
            //                             } 
            //                         ]
            //                     },
            //                     { $or:[ 
            //                             {'wage_year': {$lt: end_year }}, 
            //                             { $and:[
            //                                 {'wage_year': {$lte: end_year }},
            //                                 {'wage_month': {$lte: end_month }}
            //                                 ]
            //                             } 
            //                         ]
            //                     }
            //                 ] 
            //             } 
            //         }],
            //         as: 'employee_monthly_reports',
            //     }
            // },
            // search_option_details,
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
                    employee_monthly_reports: {
                        $arrayElemAt: ["$employee_monthly_reports", 0],
                    },
                    company_details: {
                        $arrayElemAt: ["$company_details", 0],
                    },
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "branch": {
                        "$arrayElemAt": [ "$branch", 0 ]
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
                    "hod.first_name": 1,
                    "hod.last_name": 1,
                    "client._id": 1,
                    "client.client_code": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                    'employee_details.emp_address':1,
                    'employee_details.employment_hr_details.branch':1,
                    'employee_details.employment_hr_details.date_of_join':1,
                    'company_details.details':1,
                    'company_details.company_branch':1,
                    'company_details.reg_office_address':1,
                },
            },
            ]);
            
            myAggregate.then(async (emps) => { 
                var path_array = [];
                if(req.body.generate == 'listing'){
                    return resp
                    .status(200)
                    .json({
                        status: "success",
                        employees: emps,
                        // company: company,
                    }); 
                }
                else if(req.body.form_type == '7A' && !req.body.generate){
                    for (var i = 0; i < emps.length; i++) {
                        var empdata = emps[i];
                        let file_name='esic-'+empdata.corporate_id+'-'+empdata.emp_id+'.docx';
                        let file = await Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/esic-module');
                        
                        path_array.push({
                            "link": absolutePath+file.location+file.file_name,
                            "file_path":file.location,
                            "file_name":file.file_name,

                        });
                        var pdf_file= await Site_helper.generate_esic_7a_export_docx({certificate_data: empdata},file.file_name,file.location);
                        
                    }
                    let file_name = "esic-"+new Date().getMonth()+"-"+new Date().getFullYear()+".zip";
                    let file = await Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/esic-module');
                    if (path_array.length > 0) {
                        var dir = absolutePath + file.location;
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }
                        const output = fs.createWriteStream(dir + file.file_name);

                        const archive = archiver('zip', {
                            zlib: { level: 9 }
                        });
                        
                        archive.pipe(output);

                        async function appendFileToArchive(filePath,fileName) {
                            if(fs.existsSync(filePath)){
                                await archive.file(filePath, { name: fileName });
                            }
                          // console.log(`Appended file: ${filePath}`);
                        }
                        async function processFiles(path_array) {
                          for (const parray of path_array) {
                            await appendFileToArchive(parray.link,parray.file_name);
                          }
                        }
                        processFiles(path_array)
                        .then(() => {
                            // Finalize the archive once all files are added
                            archive.finalize();
                        })
                        .catch(err => {
                            console.error('Error processing files:', err);
                        });                 
                        // await Promise.all(path_array.map(async function (parray) {
                            
                        // }));
                        // archive.finalize();
                        output.on('close', () => {
                            // console.log('Archive finished.');
                        });
                        archive.on('error', (err) => {
                            // console.log('Error.',err);
                        });
                    }
                    await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                }
                else if(req.body.form_type == '37A' && !req.body.generate){
                    var esicRule = await Esicrule.findOne({'corporate_id':{$eq: req.authData.corporate_id},'effective_date': {$lt: new Date() }}).sort({effective_date:-1});
                    var esic_form_date = '';
                    var esic_to_date = '';
                    if(esicRule){
                        if(req.body.contribution == 'A'){
                            var countstodays = moment(req.body.wage_year_to+"-"+esicRule.contribution_period_a_to, "YYYY-MM").daysInMonth();
                            let from_month = '';
                            let to_month = '';
                            if(esicRule.contribution_period_a_from > '9'){
                                from_month = esicRule.contribution_period_a_from;
                            }
                            else{
                                from_month = '0'+esicRule.contribution_period_a_from;
                            }
                            if(esicRule.contribution_period_a_to > '9'){
                                to_month = esicRule.contribution_period_a_to;
                            }
                            else{
                                to_month = '0'+esicRule.contribution_period_a_to;
                            }
                            esic_form_date = await moment(req.body.wage_year_to+"-"+from_month+"-01").format('DD/MM/YYYY');
                            esic_to_date = await moment(req.body.wage_year_to+"-"+to_month+"-"+countstodays).format('DD/MM/YYYY');
                        }
                        else{
                            var countstodays = moment(req.body.wage_year_to+"-"+esicRule.contribution_period_b_to, "YYYY-MM").daysInMonth();
                            let from_month = '';
                            let to_month = '';
                            if(esicRule.contribution_period_b_from > '9'){
                                from_month = esicRule.contribution_period_b_from;
                            }
                            else{
                                from_month = '0'+esicRule.contribution_period_b_from;
                            }
                            if(esicRule.contribution_period_b_to > '9'){
                                to_month = esicRule.contribution_period_b_to;
                            }
                            else{
                                to_month = '0'+esicRule.contribution_period_b_to;
                            }
                            esic_form_date = await moment(req.body.wage_year_to+"-"+from_month+"-01").format('DD/MM/YYYY');
                            esic_to_date = await moment(req.body.wage_year_to+"-"+to_month+"-"+countstodays).format('DD/MM/YYYY');
                        }
                    }
                    await Promise.all(emps.map(async function(empdata) {
                        var file_name='esic-'+empdata.corporate_id+'-'+empdata.emp_id+'.docx';
                        let file = await Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/esic-module/37A');
                        path_array.push({
                            "link": absolutePath+file.location+file.file_name,
                            "file_path":file.location,
                            "file_name":file.file_name
                        });
                        empdata.esic_form_date = esic_form_date;
                        empdata.esic_to_date = esic_to_date;
                        var pdf_file= await Site_helper.generate_esic_37_export_docx({certificate_data: empdata},file.file_name,file.location);
                       
                    })).then(async (emp) => { 
                        let file_name = "esic-"+new Date().getMonth()+"-"+new Date().getFullYear()+".zip";
                        let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/esic-module/37A');
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
                            await Promise.all(path_array.map(async function (parray) {
                                if(fs.existsSync(parray.link)){
                                    archive.append(fs.createReadStream(parray.link), { name: parray.file_name });
                                }
                            }));
                            archive.finalize();
                        }
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    });
                }
            });
            if(req.body.form_type == '' && !req.body.generate)
            {
                Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    return resp
                    .status(200)
                    .json({
                        status: "success",
                        employees: employees,
                    });
                });
            }
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },

    // PT Return Report No -- 47 
    employee_pt_return_report: async function (req, resp, next) {
        try {
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
            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authId] } },
                    { status: {$eq : 'active'}}
                    ],
                },
            };
            var company = await Company.findOne({'_id':req.authId},'establishment_name');
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
            // search_option_details.$match['employee_monthly_reports.salary_report']=  {$exists: true , $ne: []} ;
            var pTaxRule = await Ptaxrule.findOne({'corporate_id':{$eq:req.authData.corporate_id} , 'state_name':{$eq: req.body.state_name}}, 'tax_range_amount').sort({_id:-1});
            var myAggregate = await Employee.aggregate([search_option,
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
                    from: 'employee_monthly_reports',
                    "let": { "emp_db_idVar": "$_id"},
                    "pipeline": [
                    { 
                        "$match": {
                            $and :[
                                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                {'salary_report' : {$exists: true , $ne: null}},
                                // {'extra_earning_report.bank_ins_referance_id' : { $ne: '' }},
                                {$or:[ 
                                        {'wage_year': {$gt: start_year }}, 
                                        { $and:[
                                            {'wage_year': {$gte: start_year }},
                                            {'wage_month': {$gte: start_month }}
                                            ]
                                        } 
                                    ]
                                },
                                { $or:[ 
                                        {'wage_year': {$lt: end_year }}, 
                                        { $and:[
                                            {'wage_year': {$lte: end_year }},
                                            {'wage_month': {$lte: end_month }}
                                            ]
                                        } 
                                    ]
                                }
                            ] 
                        } 
                    }],
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
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "branch": {
                        "$arrayElemAt": [ "$branch", 0 ]
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

                    "employee_monthly_reports.wage_month":1,
                    "employee_monthly_reports.wage_year":1,
                    "employee_monthly_reports.salary_report.gross_earning":1,
                    "employee_monthly_reports.salary_report.pt_amount":1
                },
            },
            ]);
            var slab_data = [];
            if(req.body.generate == 'excel'){
                const dateFrom = new Date(req.body.wage_year_from, req.body.wage_month_from, 1);
                const dateto = new Date(req.body.wage_year_to, req.body.wage_month_to, 1);
                const yearDiff = dateto.getFullYear() - dateFrom.getFullYear();
                const monthDiff = dateto.getMonth() - dateFrom.getMonth();
                let totalMonths = yearDiff * 12 + monthDiff;

                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, 1, 1, 4, true).string(company?.establishment_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                ws.cell(3, clmn_id++).string("Sl No");
                ws.cell(3, clmn_id++).string("Salary Slab"); 
                var wage_month_from = req.body.wage_month_from;
                for (var ii = 0; ii <= totalMonths; ii++) {
                    var validMonth = moment().month(wage_month_from).format("M")-1;
                    var validYear = req.body.wage_year_from;
                    if(wage_month_from > 11)
                    {
                        var validYear = req.body.wage_year_to;
                    }
                    var monthYear = moment().month(wage_month_from).format("M")+"-"+validYear;
                    var rowID = clmn_id+ii;
                    var marge_clmn_id = clmn_id+ii+1;
                    clmn_id++
                    ws.cell(3, rowID , 3 ,marge_clmn_id,true).string(monthYear).style({alignment: {vertical: 'center',horizontal: 'center'}});
                    ws.cell(4, rowID).string("No of Emp");
                    ws.cell(4, marge_clmn_id).string("Amount");
                    if(totalMonths == ii){
                        ws.cell(4, marge_clmn_id+1).string("Total Amount");
                    }
                    wage_month_from++;
                }
                if(pTaxRule){
                    if(pTaxRule?.tax_range_amount){

                        await Promise.all(pTaxRule.tax_range_amount.map(async function(tax_slab, indexs){
                            var index_val_count = 2;
                            var index_val = 5;
                            index_val = index_val + indexs;
                            var clmn_emp_id = 1;
                            ws.cell(index_val, clmn_emp_id++).number((index_val_count + indexs) - 1);
                            var tax_slab_amount_to = tax_slab.amount_to;
                            if(indexs == (pTaxRule.tax_range_amount.length - 1)){
                                tax_slab_amount_to = '∞';
                            }
                            ws.cell(index_val,clmn_emp_id++).string(tax_slab.amount_from+" to "+tax_slab_amount_to);
                            var monthly_array = [];
                            var total_amount_p_tax = 0;
                            var wage_month_from = req.body.wage_month_from;
                            for (var i = 0; i <= totalMonths; i++) {
                                var rowIDs = clmn_emp_id+i;
                                var marge_clmn_ids = clmn_emp_id+i+1;
                                clmn_emp_id++
                                var count_emp_slab = 0;
                                var count_emp_slab_amount = 0;
                                var validMonth = moment().month(wage_month_from).format("M")-1;
                                var validYear = req.body.wage_year_from;
                                if(wage_month_from > 11)
                                {
                                    var validYear = req.body.wage_year_to;
                                }

                                await Promise.all(myAggregate.map(async function(employee, index){
                                    if(employee?.employee_monthly_reports){
                                        if(employee.employee_monthly_reports.length > 0){
                                           employee.employee_monthly_reports.filter(function(month_emp) {
                                                if(month_emp.wage_month == validMonth && month_emp.wage_year == validYear){
                                                    count_emp_slab += 1;
                                                    count_emp_slab_amount += parseFloat(month_emp.salary_report.pt_amount);
                                                }
                                           });
                                        }
                                    }
                                }));
                                if(tax_slab.amount_from <= count_emp_slab_amount && tax_slab.amount_to >= count_emp_slab_amount){
                                    total_amount_p_tax += parseFloat(count_emp_slab_amount);
                                }
                                else if(tax_slab.last_slab == 'yes' && tax_slab.amount_from <= count_emp_slab_amount){
                                    total_amount_p_tax += parseFloat(count_emp_slab_amount);
                                }
                                else{
                                    count_emp_slab = 0;
                                    count_emp_slab_amount = 0;
                                }
                                ws.cell(index_val,rowIDs).number(count_emp_slab ? count_emp_slab : 0);
                                ws.cell(index_val,marge_clmn_ids).number(count_emp_slab_amount ? count_emp_slab_amount : 0);
                                if(totalMonths == i){
                                    ws.cell(index_val, marge_clmn_ids+1).number(total_amount_p_tax ? total_amount_p_tax : 0);
                                }
                                wage_month_from++;
                            }
                        }));
                    }
                }
                let file_name = "p-tax-return-report.xlsx";
                let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files');
                await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
            }
            else{
                if(pTaxRule){
                    if(pTaxRule?.tax_range_amount){
                        const dateFrom = new Date(req.body.wage_year_from, req.body.wage_month_from, 1);
                        const dateto = new Date(req.body.wage_year_to, req.body.wage_month_to, 1);
                        const yearDiff = dateto.getFullYear() - dateFrom.getFullYear();
                        const monthDiff = dateto.getMonth() - dateFrom.getMonth();
                        let totalMonths = yearDiff * 12 + monthDiff;
                        await Promise.all(pTaxRule.tax_range_amount.map(async function(tax_slab, indexs){
                            var monthly_array = [];
                            var total_amount_p_tax = 0;
                            var wage_month_from = req.body.wage_month_from;
                            for (var i = 0; i <= totalMonths; i++) {
                                var count_emp_slab = 0;
                                var count_emp_slab_amount = 0;
                                var validMonth = moment().month(wage_month_from).format("M")-1;
                                var validYear = req.body.wage_year_from;
                                if(wage_month_from > 11)
                                {
                                   var validYear = req.body.wage_year_to;
                                }
                                await Promise.all(myAggregate.map(async function(employee, index){
                                    if(employee?.employee_monthly_reports){
                                        if(employee.employee_monthly_reports.length > 0){
                                           employee.employee_monthly_reports.filter(function(month_emp) {
                                                if(month_emp.wage_month == validMonth && month_emp.wage_year == validYear){
                                                    count_emp_slab += 1;
                                                    count_emp_slab_amount += parseFloat(month_emp.salary_report.pt_amount);
                                                }
                                           });
                                        }
                                    }
                                })); 
                                var monthYear = validMonth+"-"+validYear;
                                var showingMonthYear = moment().month(wage_month_from).format("M")+"-"+validYear;
                                wage_month_from++;
                                if(tax_slab.amount_from <= count_emp_slab_amount && tax_slab.amount_to >= count_emp_slab_amount){
                                    monthly_array.push({
                                        // [monthYear] : {
                                            'no_of_employee' : count_emp_slab,
                                            'amount' : count_emp_slab_amount,
                                            'month_year': showingMonthYear
                                        // }
                                    });
                                    total_amount_p_tax += parseFloat(count_emp_slab_amount);
                                }
                                else if(tax_slab.last_slab == 'yes' && tax_slab.amount_from <= count_emp_slab_amount){
                                    monthly_array.push({
                                        // [monthYear] : {
                                            'no_of_employee' : count_emp_slab,
                                            'amount' : count_emp_slab_amount,
                                            'month_year': showingMonthYear
                                        // }
                                    });
                                    total_amount_p_tax += parseFloat(count_emp_slab_amount);
                                }
                                else{
                                    monthly_array.push({
                                        // [monthYear] : {
                                            'no_of_employee' : 0,
                                            'amount' : 0,
                                            'month_year': showingMonthYear
                                        // }
                                    });
                                }
                            }

                            slab_data.push({tax_slab,monthly_array,total_amount_p_tax});
                        }));
                    }
                }
                return resp
                .status(200)
                .json({
                    status: "success",
                    employees: await slab_data ,
                    company: company,
                });
                
            }
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    // 25 Gratuity Form_Form L
    company_gratuity_form_l_report: async function (req, resp, next) {
        try {
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
            // var start_month = parseInt(req.body.wage_month_from);
            // var start_year = parseInt(req.body.wage_year_from);
            // var end_month = parseInt(req.body.wage_month_to);
            // var end_year = parseInt(req.body.wage_year_to);
            var filter_option = {};

            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authId] } },
                    { status: {$eq : 'active'}}
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
            // search_option_details.$match['employee_monthly_reports'] =  {$exists: true , $ne: []} ;
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
                    from: "companies",
                    localField: "corporate_id",
                    foreignField: "corporate_id",
                    as: "companies",
                },
            },
            {
                $lookup: {
                    from: "company_details",
                    localField: "company_id",
                    foreignField: "companies._id",
                    as: "company_details",
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
                    employee_monthly_reports: {
                        $arrayElemAt: ["$employee_monthly_reports", 0],
                    },
                    company_details: {
                        $arrayElemAt: ["$company_details", 0],
                    },
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "branch": {
                        "$arrayElemAt": [ "$branch", 0 ]
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
                    "hod.first_name": 1,
                    "hod.last_name": 1,
                    "client._id": 1,
                    "client.client_code": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                    'employee_details.emp_address':1,
                    'employee_details.employment_hr_details.branch':1,
                    'employee_details.employment_hr_details.date_of_join':1,
                    'company_details.details':1,
                    'company_details.company_branch':1,
                    'company_details.reg_office_address':1,
                },
            },
            ]);
            myAggregate.then(async (emps) => { 
                var path_array = [];
                if(req.body.generate == 'excel'){
                   new Promise(async resolve => { 
                        for (var i = 0; i < emps.length; i++) {
                            var empdata = emps[i];
                            let file_name='gratuity-'+empdata.corporate_id+'-'+empdata.emp_id+'.docx';
                            let file = await Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/gratuity-module');
                            
                            path_array.push({
                                "link": absolutePath+file.location+file.file_name,
                                "file_path":file.location,
                                "file_name":file.file_name,

                            });
                            var pdf_file= await Site_helper.gratuity_l_export_docx(file.file_name,file.location);
                        }
                    
                        // await generateComponents(path_array);
                        setTimeout(async () => {
                            let file_name = "gratuity-"+new Date().getMonth()+"-"+new Date().getFullYear()+".zip";
                            let file = await Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/esic-module');
                            if (path_array.length > 0) {

                                var dir = absolutePath + file.location;
                                if (!fs.existsSync(dir)) {
                                    fs.mkdirSync(dir);
                                }
                                const output = fs.createWriteStream(dir + file.file_name);

                                const archive = archiver('zip', {
                                    zlib: { level: 9 }
                                });
                                
                                archive.pipe(output);

                                async function appendFileToArchive(filePath,fileName) {
                                    if(fs.existsSync(filePath)){
                                        await archive.file(filePath, { name: fileName });
                                    }
                                  // console.log(`Appended file: ${filePath}`);
                                }
                                async function processFiles(path_array) {
                                  for (const parray of path_array) {
                                    await appendFileToArchive(parray.link,parray.file_name);
                                  }
                                }
                                processFiles(path_array)
                                .then(() => {
                                    // Finalize the archive once all files are added
                                    archive.finalize();
                                })
                                .catch(err => {
                                    console.error('Error processing files:', err);
                                });                 
                                // await Promise.all(path_array.map(async function (parray) {
                                    
                                // }));
                                // archive.finalize();
                                output.on('close', () => {
                                    // console.log('Archive finished.');
                                });
                                archive.on('error', (err) => {
                                    // console.log('Error.',err);
                                });
                            }
                            await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                        }, 2000);
                    });
                }
                else if(req.body.generate == 'listing'){
                    return resp
                    .status(200)
                    .json({
                        status: "success",
                        employees: emps,
                        // company: company,
                    }); 
                }
            });
            if(!req.body.generate){
                Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    return resp
                    .status(200)
                    .json({
                        status: "success",
                        employees: employees,
                    });
                });
            }
            
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    // KYC BULK Report No 30
    employee_bulk_upload: async function (req, resp, next) {
        try {
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
                    { status: {$eq: "active"}}
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
                    from: "companies",
                    localField: "corporate_id",
                    foreignField: "corporate_id",
                    as: "companies",
                },
            },
            {
                $lookup: {
                    from: "company_details",
                    localField: "company_id",
                    foreignField: "companies._id",
                    as: "company_details",
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
                    
                    company_details: {
                        $arrayElemAt: ["$company_details", 0],
                    },
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "branch": {
                        "$arrayElemAt": [ "$branch", 0 ]
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
                    "hod.first_name": 1,
                    "hod.last_name": 1,
                    "client._id": 1,
                    "client.client_code": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                    passport_no:1,
                    passport_val_form:1,
                    passport_val_to:1,
                    pan_no:1,
                    aadhar_no:1,
                    'employee_details.bank_details':1,
                    "uan_no": { $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", '' ] }
                },
            },
            ]);
            var path_array = [];
            if(req.body.generate == 'excel'){
                myAggregate.then(async (emps) => { 
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    var clmn_id = 1;
                    ws.cell(1, clmn_id++).string("UAN");
                    ws.cell(1, clmn_id++).string("TypeID");
                    ws.cell(1, clmn_id++).string("DocNumber");
                    ws.cell(1, clmn_id++).string("MemberNameAsPerDoc");
                    ws.cell(1, clmn_id++).string("IFSC");
                    ws.cell(1, clmn_id++).string("ExpiryDate");
                    var documentData = JSON.parse(req.body.document);
                    var indexing = 0;
                    await Promise.all(emps.map(async function(employee, index){
                        var documentMatchIds = documentData.find(docsdata => mongoose.Types.ObjectId(docsdata._id).equals(mongoose.Types.ObjectId(employee._id)));
                        if(documentMatchIds){
                            for (var i = 0; i < documentMatchIds.documents.length; i++) {
                                var index_val = 2;
                                index_val = index_val + indexing;
                                var clmn_emp_id = 1;
                                ws.cell(index_val, clmn_emp_id++).string(employee?.uan_no ? String(employee?.uan_no) : "");
                                
                                if(documentMatchIds.documents[i] == 'P'){
                                    ws.cell(index_val, clmn_emp_id++).string('P');
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.pan_no ? String(employee?.pan_no) : "");
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.emp_first_name ? String(employee?.emp_first_name + " " +employee?.emp_last_name) : "");
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                }

                                if(documentMatchIds.documents[i] == 'B'){
                                    ws.cell(index_val, clmn_emp_id++).string('B');
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.employee_details?.bank_details ? String(employee?.employee_details?.bank_details?.account_no) : "");
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.emp_first_name ? String(employee?.emp_first_name + " " +employee?.emp_last_name) : "");
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.employee_details?.bank_details ? String(employee?.employee_details?.bank_details?.ifsc_code) : "");
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                }
                                
                                if(documentMatchIds.documents[i] == 'A'){
                                    ws.cell(index_val, clmn_emp_id++).string('A');
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.aadhar_no ? String(employee?.aadhar_no) : "");
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.emp_first_name ? String(employee?.emp_first_name + " " +employee?.emp_last_name) : "");
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                }
                                if(documentMatchIds.documents[i] == 'T'){
                                    ws.cell(index_val, clmn_emp_id++).string('T');
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.passport_no ? String(employee?.passport_no) : "");
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.emp_first_name ? String(employee?.emp_first_name + " " +employee?.emp_last_name) : "");
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                    ws.cell(index_val, clmn_emp_id++).string(employee?.passport_val_to ? String(moment(employee?.passport_val_to).format('DD/MM/YYYY')) : "");
                                }
                                indexing++;
                            }
                        }
                    })).then(async(value) => {
                        let file_name = req.authData.corporate_id+"-kyc-bulk.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    });
                    
                });
            }
            else{
                Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    return resp
                    .status(200)
                    .json({
                        status: "success",
                        employees: employees,
                    });
                });
            }
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    // 34 ESIC UPLOAD
    company_esic_upload_report: async function (req, resp, next) {
        try {
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

            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authId] } },
                    { status: {$eq : 'active'}}
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
            // search_option_details.$match['employee_monthly_reports'] =  {$exists: true , $ne: []} ;
            search_option_details.$match["employee_details.pf_esic_details.curr_er_esic_details.esic_no"] =  {$exists: true , $ne: null} ;
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
                    from: "companies",
                    localField: "corporate_id",
                    foreignField: "corporate_id",
                    as: "companies",
                },
            },
            {
                $lookup: {
                    from: "company_details",
                    localField: "company_id",
                    foreignField: "companies._id",
                    as: "company_details",
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
                    from: 'employee_monthly_reports',
                    "let": { "emp_db_idVar": "$_id"},
                    "pipeline": [
                    { 
                        "$match": {
                            $and :[
                                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                {'attendance_summaries' : {$exists: true , $ne: null}},
                                // {'extra_earning_report.bank_ins_referance_id' : { $ne: '' }},
                                {$or:[ 
                                        {'wage_year': {$gt: start_year }}, 
                                        { $and:[
                                            {'wage_year': {$gte: start_year }},
                                            {'wage_month': {$gte: start_month }}
                                            ]
                                        } 
                                    ]
                                },
                                { $or:[ 
                                        {'wage_year': {$lt: end_year }}, 
                                        { $and:[
                                            {'wage_year': {$lte: end_year }},
                                            {'wage_month': {$lte: end_month }}
                                            ]
                                        } 
                                    ]
                                }
                            ] 
                        } 
                    }],
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
                    // employee_monthly_reports: {
                    //     $arrayElemAt: ["$employee_monthly_reports", 0],
                    // },
                    company_details: {
                        $arrayElemAt: ["$company_details", 0],
                    },
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "branch": {
                        "$arrayElemAt": [ "$branch", 0 ]
                    },
                    total_paydays: {
                      $sum: "$employee_monthly_reports.attendance_summaries.paydays",
                    },
                    total_monthly_wages: {
                      $sum: "$employee_monthly_reports.salary_report.gross_earning",
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
                    // emp_father_name: 1,
                    // "hod.first_name": 1,
                    // "hod.last_name": 1,
                    "client._id": 1,
                    "client.client_code": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    // "designation._id": 1,
                    // "designation.designation_name": 1,
                    // 'employee_details.emp_address':1,
                    'employee_details.employment_hr_details.esic_covered':1,
                    // 'employee_monthly_reports':1,
                    'employee_details.employment_details':1,
                    'employee_details.pf_esic_details':1,
                    'employee_details.employment_hr_details.date_of_join':1,
                    "reason_code": { $ifNull: [ '$employee_details.full_and_final.reason_code', '' ] },
                    "do_resignation": { $ifNull: [ '$employee_details.full_and_final.do_resignation', '' ] },
                    'company_details.details':1,
                    'total_paydays':1,
                    'total_monthly_wages':1,
                    // 'company_details.company_branch':1,
                    // 'company_details.reg_office_address':1,
                },
            },
            ]);
            var path_array = [];
            if(req.body.generate == 'excel'){
                myAggregate.then(async (emps) => { 
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    var clmn_id = 1;
                    ws.cell(1, clmn_id++).string("IP Number");
                    ws.cell(1, clmn_id++).string("IP Name");
                    ws.cell(1, clmn_id++).string("No of Days for which wages paid/payable during the month");
                    ws.cell(1, clmn_id++).string("Total Monthly Wages");
                    ws.cell(1, clmn_id++).string("Reason Code for Zero workings days(numeric only; provide 0 for all other reasons- Click on the link for reference)");
                    ws.cell(1, clmn_id++).string("Last Working Day");
                    await Promise.all(emps.map(async function(employee, index){
                        var index_val = 2;
                        index_val = index_val + index;
                        var clmn_emp_id = 1;
                        ws.cell(index_val, clmn_emp_id++).string(
                                    employee.employee_details.pf_esic_details?.curr_er_esic_details?.esic_no ? String(employee.employee_details.pf_esic_details?.curr_er_esic_details?.esic_no) : ""
                                    );
                        ws.cell(index_val, clmn_emp_id++).string(
                                    employee.emp_first_name ? String(employee.emp_first_name +" "+ employee.emp_last_name) : ""
                                    );
                        ws.cell(index_val,clmn_emp_id++).number(employee?.total_paydays);
                        ws.cell(index_val,clmn_emp_id++).number(employee?.total_monthly_wages);
                        var reason_code =  employee?.reason_code;
                        if(employee?.total_paydays == 0)
                        {
                            reason_code = 11;
                        }
                        else if(employee?.employment_hr_details?.esic_covered){
                            if(employee?.employment_hr_details?.esic_covered == 'yes'){
                                reason_code = 4;
                            }
                        }

                        ws.cell(index_val,clmn_emp_id++).string(String(reason_code ? reason_code : 0));
                        ws.cell(index_val,clmn_emp_id++).string(employee?.do_resignation ? String(moment(employee?.do_resignation).format('DD/MM/YYYY')) : "");
                    })).then(async(value) => {
                        var ws = wb.addWorksheet("Instructions & Reason Codes");
                        ws.cell(2, 1).string("Reason");
                        ws.cell(2, 2).string("Code");
                        ws.cell(2, 3).string("Note");
                        ws.cell(3, 1).string("Without Reason");
                        ws.cell(3, 2).string("0");
                        ws.cell(3, 3).string("Leave last working day as blank");
                        ws.cell(4, 1).string("On Leave");
                        ws.cell(4, 2).string("1");
                        ws.cell(4, 3).string("Leave last working day as blank");
                        ws.cell(5, 1).string("Left Service");
                        ws.cell(5, 2).string("2");
                        ws.cell(5, 3).string("Please provide last working day (dd/mm/yyyy). IP will not appear from next wage period");
                        ws.cell(6, 1).string("Retired");
                        ws.cell(6, 2).string("3");
                        ws.cell(6, 3).string("Please provide last working day (dd/mm/yyyy). IP will not appear from next wage period");
                        ws.cell(7, 1).string("Out of Coverage");
                        ws.cell(7, 2).string("4");
                        ws.cell(7, 3).string("Please provide last working day (dd/mm/yyyy). IP will not appear from next contribution period. This option is valid only if Wage Period is April/October. In case any other month then IP will continue to appear in the list");
                        ws.cell(8, 1).string("Expired");
                        ws.cell(8, 2).string("5");
                        ws.cell(8, 3).string("Please provide last working day (dd/mm/yyyy). IP will not appear from next wage period");
                        ws.cell(9, 1).string("Non Implemented area");
                        ws.cell(9, 2).string("6");
                        ws.cell(9, 3).string("Please provide last working day (dd/mm/yyyy).");
                        ws.cell(10, 1).string("Compliance by Immediate Employer");
                        ws.cell(10, 2).string("7");
                        ws.cell(10, 3).string("Leave last working day as blank");
                        ws.cell(11, 1).string("Suspension of work");
                        ws.cell(11, 2).string("8");
                        ws.cell(11, 3).string("Leave last working day as blank");
                        ws.cell(12, 1).string("Strike/Lockout");
                        ws.cell(12, 2).string("9");
                        ws.cell(12, 3).string("Leave last working day as blank");
                        ws.cell(13, 1).string("Retrenchment");
                        ws.cell(13, 2).string("10");
                        ws.cell(13, 3).string("Please provide last working day (dd/mm/yyyy). IP will not appear from next wage period");
                        ws.cell(14, 1).string("No Work");
                        ws.cell(14, 2).string("11");
                        ws.cell(14, 3).string("Leave last working day as blank");
                        ws.cell(15, 1).string("Doesnt Belong To This Employer");
                        ws.cell(15, 2).string("12");
                        ws.cell(15, 3).string("Leave last working day as blank");
                        ws.cell(16, 1).string("Duplicate IP");
                        ws.cell(16, 2).string("13");
                        ws.cell(16, 3).string("Leave last working day as blank");

                        let file_name = "esic-upload.xlsx";
                        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files');
                        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    });
                    
                });
            }
            else{
                Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    return resp
                    .status(200)
                    .json({
                        status: "success",
                        employees: employees,
                    });
                });
            }
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },

};

