var CompanyDetails = require("../../Model/Admin/Company_details");
var Employee = require("../../Model/Company/employee");
var Staff = require("../../Model/Company/Staff");
var Site_helper = require("../../Helpers/Site_helper");
const mongoose = require("mongoose");
var moment = require('moment');
const csv = require("csv-parser");
const fs = require("fs");
var xl = require("excel4node");
const bcrypt = require("bcrypt");

module.exports = {
    get_employee_list: async function (req, resp, next) {
        try {
            var bulkData = {};
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
                var ids = JSON.parse(req.body.unchecked_row_ids);
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                var ids = JSON.parse(req.body.checked_row_ids);
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
                        "employee_details.pf_esic_details.curr_er_epfo_details.uan_no": 1,
                        "employee_details.employment_hr_details.date_of_join": 1,
                        "employee_details.pf_esic_details.esic_family_details": 1,
                        sex: 1,
                        mobile_no: 1,
                        email_id: 1,
                        nationality: 1,
                        marital_status: 1,
                        country: 1,
                        pan_no: 1,
                        aadhar_no: 1,
                        passport_no: 1,
                        passport_val_form: 1,
                        passport_val_to: 1,
                        physical_disability: 1,
                        "employee_details.bank_details": 1,
                    },
                },
                ]); 
            Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                if (err) return resp.json({ status: "error", message: err.message });
                return resp.status(200).json({status: "success",employees: employees,});
            });
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    get_employee_exit_bulk: async function (req, resp, next) {
        try {
            var bulkData = {};
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
                var ids = JSON.parse(req.body.unchecked_row_ids);
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                var ids = JSON.parse(req.body.checked_row_ids);
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
                        emp_id: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        emp_father_name: 1,
                        emp_dob: 1,
                        "employee_details.pf_esic_details.curr_er_epfo_details": 1,
                        "employee_details.full_and_final": 1,
                    },
                },
                ]); 
            Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                if (err) return resp.json({ status: "error", message: err.message });
                return resp.status(200).json({status: "success",employees: employees,});
            });
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    export_bulk_employee_list: async function (req, resp, next) {
        try {
            var bulkData = {};
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
                var ids = JSON.parse(req.body.unchecked_row_ids);
                if (ids.length > 0) {
                    ids = ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match._id = { $nin: ids };
                }
            } else {
                var ids = JSON.parse(req.body.checked_row_ids);
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
                    "employee_details.pf_esic_details.curr_er_epfo_details.uan_no": 1,
                    "employee_details.employment_hr_details.date_of_join": 1,
                    "employee_details.pf_esic_details.esic_family_details": 1,
                    sex: 1,
                    mobile_no: 1,
                    email_id: 1,
                    nationality: 1,
                    marital_status: 1,
                    country: 1,
                    pan_no: 1,
                    aadhar_no: 1,
                    passport_no: 1,
                    passport_val_form: 1,
                    passport_val_to: 1,
                    physical_disability: 1,
                    "employee_details.bank_details": 1,
                },
            },
            ]).then(async (employees) => {
                var field_list_array=["uan_number","prv_memberid","member_name","dob","doj","sex","father_name","relationship","mobilenumber","email_id","nationality","epf_wages","qualification","marital_status","is_international_worker","country_of_origin","passport_number","passport_valid_from","passport_valid_till","is_physical_handicap","locomotive","hearing","visual","bank_account_number","ifsc_code","name_as_per_bank","pan","name_as_per_pan","aadhaar_number","name_as_on_aadhaar"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id=1
                ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
                if(field_list_array.includes('uan_number'))
                {
                    ws.cell(1, clmn_id++).string("UAN Number");
                }
                if(field_list_array.includes('prv_memberid'))
                {
                    ws.cell(1, clmn_id++).string("Prv MemberId");
                }
                if(field_list_array.includes('member_name'))
                {
                    ws.cell(1, clmn_id++).string("Member Name");
                }
                if(field_list_array.includes('dob'))
                {
                    ws.cell(1, clmn_id++).string("D.O.B as per Aadhaar (dd/mm/yyyy)");
                }
                if(field_list_array.includes('doj'))
                {
                    ws.cell(1, clmn_id++).string("D.O.J. (dd/mm/yyyy)");
                }
                if(field_list_array.includes('sex'))
                {
                    ws.cell(1, clmn_id++).string("Gender");
                }
                if(field_list_array.includes('father_name'))
                {
                    ws.cell(1, clmn_id++).string("Father's/ Husband Name");
                }
                if(field_list_array.includes('relationship'))
                {
                    ws.cell(1, clmn_id++).string("Relationship");
                }
                if(field_list_array.includes('mobilenumber'))
                {
                    ws.cell(1, clmn_id++).string("Mobile Number");
                }
                if(field_list_array.includes('email_id'))
                {
                    ws.cell(1, clmn_id++).string("Email Id");
                }
                if(field_list_array.includes('nationality'))
                {
                    ws.cell(1, clmn_id++).string("Nationality");
                }
                if(field_list_array.includes('epf_wages'))
                {
                    ws.cell(1, clmn_id++).string("EPF Wages");
                }
                if(field_list_array.includes('qualification'))
                {
                    ws.cell(1, clmn_id++).string("Qualification");
                }
                if(field_list_array.includes('marital_status'))
                {
                    ws.cell(1, clmn_id++).string("Marital  Status");
                }
                if(field_list_array.includes('is_international_worker'))
                {
                    ws.cell(1, clmn_id++).string("Is International Worker");
                }
                if(field_list_array.includes('country_of_origin'))
                {
                    ws.cell(1, clmn_id++).string("Country Of Origin");
                }
                if(field_list_array.includes('passport_number'))
                {
                    ws.cell(1, clmn_id++).string("Passport Number");
                }
                if(field_list_array.includes('passport_valid_from'))
                {
                    ws.cell(1, clmn_id++).string("Passport Valid From ");
                }
                if(field_list_array.includes('passport_valid_till'))
                {
                    ws.cell(1, clmn_id++).string("passport Valid Till");
                }
                if(field_list_array.includes('is_physical_handicap'))
                {
                    ws.cell(1, clmn_id++).string("Is Physical Handicap");
                }
                if(field_list_array.includes('locomotive'))
                {
                    ws.cell(1, clmn_id++).string("Locomotive");
                }
                if(field_list_array.includes('hearing'))
                {
                    ws.cell(1, clmn_id++).string("Hearing");
                }
                if(field_list_array.includes('visual'))
                {
                    ws.cell(1, clmn_id++).string("Visual");
                }
                if(field_list_array.includes('bank_account_number'))
                {
                    ws.cell(1, clmn_id++).string("Bank Account Number");
                }
                if(field_list_array.includes('ifsc_code'))
                {
                    ws.cell(1, clmn_id++).string("IFSC Code");
                }
                if(field_list_array.includes('name_as_per_bank'))
                {
                    ws.cell(1, clmn_id++).string("Name As Per Bank");
                }
                if(field_list_array.includes('pan'))
                {
                    ws.cell(1, clmn_id++).string("PAN");
                }
                if(field_list_array.includes('name_as_per_pan'))
                {
                    ws.cell(1, clmn_id++).string("Name As Per PAN");
                }
                if(field_list_array.includes('aadhaar_number'))
                {
                    ws.cell(1, clmn_id++).string("Aadhaar Number");
                }
                if(field_list_array.includes('name_as_on_aadhaar'))
                {
                    ws.cell(1, clmn_id++).string("Name as on Aadhaar");
                }

                await Promise.all(employees.map(async (employee, index) => {
                    var index_val = 2;
                    index_val = index_val + index;
                    var clmn_emp_id=1
                    ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                    if(field_list_array.includes('uan_number'))
                    {
                        if(employee.employee_details){
                            if(employee.employee_details.pf_esic_details){
                                if(employee.employee_details.pf_esic_details.curr_er_epfo_details){
                                    ws.cell(index_val, clmn_emp_id++).string(
                                        employee.employee_details.pf_esic_details.curr_er_epfo_details.uan_no ? String(employee.employee_details.pf_esic_details.curr_er_epfo_details.uan_no) : ""
                                        );
                                }
                                else{
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                }
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        else{
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                    }
                    if(field_list_array.includes('prv_memberid'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("");
                    }
                    if(field_list_array.includes('member_name'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(
                            employee.emp_first_name ? String(employee.emp_first_name + " " + employee.emp_first_name) : ""
                            );
                    }
                    if(field_list_array.includes('dob'))
                    {
                        ws.cell(index_val,clmn_emp_id++).string(
                            employee.emp_dob ? String(moment(employee.emp_dob).format('DD/MM/YYYY')) : ""
                            );
                    }
                    if(field_list_array.includes('doj'))
                    {
                        if(employee.employee_details){
                            if(employee.employee_details.employment_hr_details){
                                ws.cell(index_val,clmn_emp_id++).string(
                                    employee.employee_details.employment_hr_details.date_of_join ? String(moment(employee.employee_details.employment_hr_details.date_of_join).format('DD/MM/YYYY')) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        else{
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                    }
                    if(field_list_array.includes('sex'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.sex ? String(employee.sex) : "");
                    }
                    if(field_list_array.includes('father_name'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.emp_father_name ? String(employee.emp_father_name) : "");
                    }
                    if(field_list_array.includes('relationship'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("");
                    }
                    if(field_list_array.includes('mobilenumber'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.mobile_no ? String(employee.mobile_no) : "");
                    }
                    if(field_list_array.includes('email_id'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.email_id ? String(employee.email_id) : "");
                    }
                    if(field_list_array.includes('nationality'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.nationality ? String(employee.nationality) : "");
                    }
                    if(field_list_array.includes('epf_wages'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("");
                    }
                    if(field_list_array.includes('qualification'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("");
                    }
                    if(field_list_array.includes('marital_status'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.marital_status ? String(employee.marital_status) : "");
                    }
                    if(field_list_array.includes('is_international_worker'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("N");
                    }
                    if(field_list_array.includes('country_of_origin'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.country ? String(employee.country) : "");
                    }
                    if(field_list_array.includes('passport_number'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.passport_no ? String(employee.passport_no) : "");
                    }
                    if(field_list_array.includes('passport_valid_from'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.passport_val_form ? String(employee.passport_val_form) : "");
                    }
                    if(field_list_array.includes('passport_valid_till'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.passport_val_to ? String(employee.passport_val_to) : "");
                    }
                    if(field_list_array.includes('is_physical_handicap'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.physical_disability ? String(employee.physical_disability) : "");
                    }
                    if(field_list_array.includes('locomotive'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("");
                    }
                    if(field_list_array.includes('hearing'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("");
                    }
                    if(field_list_array.includes('visual'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string("");
                    }
                    if(field_list_array.includes('bank_account_number'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.employee_details.bank_details.account_no ? String(employee.employee_details.bank_details.account_no) : "");
                    }
                    if(field_list_array.includes('ifsc_code'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.employee_details.bank_details.ifsc_code ? String(employee.employee_details.bank_details.ifsc_code) : "");
                    }
                    if(field_list_array.includes('name_as_per_bank'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name + " " + employee.emp_first_name) : "");
                    }
                    if(field_list_array.includes('pan'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.pan_no ? String(employee.pan_no) : "");
                    }
                    if(field_list_array.includes('name_as_per_pan'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name + " " + employee.emp_first_name) : "");
                    }
                    if(field_list_array.includes('aadhaar_number'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.aadhar_no ? String(employee.aadhar_no) : "");
                    }
                    if(field_list_array.includes('name_as_on_aadhaar'))
                    {
                        ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name + " " + employee.emp_first_name) : "");
                    }
                }) ).then(async (value) => {  
    // wb.write("bulk-employee-report.xlsx"); 
    // let file_location = Site_helper.createFiles(wb,"bulk-employee-report",'xlsx', req.authData.corporate_id);
    let file_name = "bulk-employee-report.xlsx";
    // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
    let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/employee-module');
    await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
    // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
    // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location}); 
    // return resp.status(200).json({status: "success",employees: employees}); 
}); 
            });
} 
catch (e) {
    return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
}
},
export_bulk_exit_employee_list: async function (req, resp, next) {
    try {
        var bulkData = {};
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
            var ids = JSON.parse(req.body.unchecked_row_ids);
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            var ids = JSON.parse(req.body.checked_row_ids);
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
                    emp_id: 1,
                    emp_first_name: 1,
                    emp_last_name: 1,
                    emp_father_name: 1,
                    emp_dob: 1,
                    "employee_details.pf_esic_details.curr_er_epfo_details": 1,
                    "employee_details.full_and_final": 1,
                },
            },
            ]).then(async (employees) => {
                var field_list_array=["uan_number","exit_date","exit_reason_code"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id=1
                ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
                if(field_list_array.includes('uan_number'))
                {
                    ws.cell(1, clmn_id++).string("UAN Number");
                }
                if(field_list_array.includes('exit_date'))
                {
                    ws.cell(1, clmn_id++).string("Exit Date");
                }
                if(field_list_array.includes('exit_reason_code'))
                {
                    ws.cell(1, clmn_id++).string("Exit Reason Code");
                }
                

                await Promise.all(employees.map(async (employee, index) => {
                    var index_val = 2;
                    index_val = index_val + index;
                    var clmn_emp_id=1
                    ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                    if(field_list_array.includes('uan_number'))
                    {
                        if(employee.employee_details){
                            if(employee.employee_details.pf_esic_details){
                                if(employee.employee_details.pf_esic_details.curr_er_epfo_details){
                                    ws.cell(index_val, clmn_emp_id++).string(
                                        employee.employee_details.pf_esic_details.curr_er_epfo_details.uan_no ? String(employee.employee_details.pf_esic_details.curr_er_epfo_details.uan_no) : ""
                                        );
                                }
                                else{
                                    ws.cell(index_val, clmn_emp_id++).string("");
                                }
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        else{
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                    }
                    if(field_list_array.includes('exit_date'))
                    {
                        if(employee.employee_details){
                            if(employee.employee_details.full_and_final){
                                ws.cell(index_val, clmn_emp_id++).string(
                                    employee.employee_details.full_and_final.last_working_date ? String(moment(employee.employee_details.full_and_final.last_working_date).format('DD/MM/YYYY')) : ""
                                    );
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        else{
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                    }
                    if(field_list_array.includes('exit_reason_code'))
                    {
                        if(employee.employee_details){
                            if(employee.employee_details.full_and_final){
                                ws.cell(index_val, clmn_emp_id++).string(employee.employee_details.full_and_final.reason ? String(employee.employee_details.full_and_final.reason) : "");
                            }
                            else{
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                        }
                        else{
                            ws.cell(index_val, clmn_emp_id++).string("");
                        }
                    }
                }) ).then(async (value) => {  
                    // wb.write("exit-bulk-employee-report.xlsx"); 
                    // let file_location = Site_helper.createFiles(wb,"exit-bulk-employee-report",'xlsx', req.authData.corporate_id);
                    let file_name = "exit-bulk-employee-report.xlsx";
                    let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/employee-module');
                    await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                    // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                    // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location}); 
                    // return resp.status(200).json({status: "success",employees: employees}); 
                }); 
            });
} 
catch (e) {
    return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
}
},
};
