var EmployeeAttendance = require("../../Model/Company/EmployeeAttendance");
var AttendanceRegister = require("../../Model/Company/AttendanceRegister");
var CompanyDetails = require("../../Model/Admin/Company_details");
var LeaveTempHead = require("../../Model/Admin/LeaveTempHead");
var AttendanceSummary = require("../../Model/Company/AttendanceSummary");
var AfterCutoffAttendanceSummary = require("../../Model/Company/AfterCutoffAttendanceSummary");
var Employee = require("../../Model/Company/employee");
var weeklyHolidays = require("../../Model/Company/WeeklyHolidays");
var yearlyHolidays = require("../../Model/Company/YearlyHolidays");
var Attendancerule = require("../../Model/Admin/Attendance");
const { Validator } = require("node-input-validator");
const niv = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var moment = require("moment");
const csv = require("csv-parser");
const fs = require("fs");
var xl = require("excel4node");
const bcrypt = require("bcrypt");
const results = [];
const mongoose = require("mongoose");
niv.extend("unique", async ({ value, args }) => {
  const filed = args[1] || "role_id_name";
  let condition = {};

  condition[filed] = value;

  if (args[2]) {
    condition["_id"] = { $ne: mongoose.Types.ObjectId(args[2]) };
  }

  let emailExist = await mongoose
    .model(args[0])
    .findOne(condition)
    .select(filed);

  if (emailExist) {
    return false;
  }

  return true;
});
module.exports = {
  get_report_attendance_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        pageno: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
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
        var filter_option = {};

        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { parent_hods: { $in: [req.authId] } },
              { approval_status: "approved" },
            ],
          },
        };
        var search_option_details = {
          $match: {
            "attendance.attendance_month": req.body.wage_month_from,
            "attendance.attendance_year": req.body.wage_year_from,
          },
        };
        if (req.body.searchkey) {
          console.log('sderf',req.body.searchkey);
          
          search_option.$match.$and.push({$text: { $search: req.body.searchkey }})
        }
        else{
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

        // if(!req.body.report_type){
        search_option_details.$match[
          "employee_details.template_data.attendance_temp_data.register_type"
        ] = req.body.attendance_type;
        // }
        if (req.body.row_checked_all === "true") {
          if (typeof req.body.unchecked_row_ids == "string") {
            var ids = JSON.parse(req.body.unchecked_row_ids);
          } else {
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
          } else {
            var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
          }
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option.$match._id = { $in: ids };
          }
        }
        if (!req.body.report_type) {
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
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "attendance_summaries",
                // localField: "emp_id",
                // foreignField: "emp_id",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
              },
            },
            search_option_details,
            {
              $addFields: {
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
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
                profile_pic: 1,
                shift: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                // shift_data:1,
                "employee_details.template_data.attendance_temp_data.register_type": 1,
                attendance_summ: 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            },
          ]);
        } else if (
          req.body.report_type == "form_d" ||
          req.body.report_type == "monthly_late_report"
        ) {
          if (req.body.report_type == "monthly_late_report") {
            var loopUpdata = {
              $lookup: {
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                      attendance_stat: "L",
                    },
                  },
                ],
                as: "attendance",
              },
            };
          } else {
            var loopUpdata = {
              $lookup: {
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            };
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
            loopUpdata,
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                // localField: "emp_id",
                // foreignField: "emp_id",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                // shift_data:1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]);
        } else if (req.body.report_type == "attendance_register") {
          if (req.body.attendance_type == "time") {
            var project = {
              $project: {
                _id: 1,
                corporate_id: 1,
                userid: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                profile_pic: 1,
                shift: 1,
                shift_data: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                // 'employee_details':1,
                // attendance:1,
                "attendance.attendance_date": 1,
                "attendance.emp_id": 1,
                "attendance.attendance_month": 1,
                "attendance.attendance_stat": 1,
                "attendance.attendance_year": 1,
                "attendance.corporate_id": 1,
                "attendance.break_time": 1,
                "attendance.login_time": 1,
                "attendance.logout_time": 1,
                "attendance.register_type": 1,
                "attendance.total_break_time": 1,
                "attendance.total_logged_in": 1,
                attendance_summ: 1,
                // "client._id": 1,
                // "client.client_code": 1,
                // "branch._id": 1,
                // "branch.branch_name": 1,
                // "department._id": 1,
                // "department.department_name": 1,
                // "designation._id": 1,
                // "designation.designation_name": 1,
                // "attendance.login_time":1,
                // "attendance.logout_time":1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            };
          } else {
            var project = {
              $project: {
                _id: 1,
                corporate_id: 1,
                userid: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                profile_pic: 1,
                shift: 1,
                shift_data: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                // 'employee_details':1,
                attendance: 1,
                // "attendance.break_time": 1,
                // "attendance.login_time": 1,
                // "attendance.logout_time": 1,
                // "attendance.register_type": 1,
                // "attendance.total_break_time": 1,
                // "attendance.total_logged_in": 1,
                attendance_summ: 1,
                // "client._id": 1,
                // "client.client_code": 1,
                // "branch._id": 1,
                // "branch.branch_name": 1,
                // "department._id": 1,
                // "department.department_name": 1,
                // "designation._id": 1,
                // "designation.designation_name": 1,
                // "attendance.login_time":1,
                // "attendance.logout_time":1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            };
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
                from: "employees_attendances",
                // localField: "emp_id",
                // foreignField: "emp_id",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                      // $and: [
                      // { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                      // {
                      // 	$or:[
                      // 	{
                      // 		'attendance_year': {$gt: start_year }
                      // 	},
                      // 	{
                      // 		$and:
                      // 		[
                      // 		{'attendance_year': {$gte: start_year }},
                      // 		{'attendance_month': {$gte: start_month }}
                      // 		]
                      // 	}
                      // 	]
                      // },
                      // {
                      // 	$or:
                      // 	[
                      // 	{
                      // 		'attendance_year': {$lt: end_year }
                      // 	},
                      // 	{
                      // 		$and:[
                      // 		{'attendance_year': {$lte: end_year }},
                      // 		{'attendance_month': {$lte: end_month }}
                      // 		]
                      // 	}
                      // 	]
                      // }
                      // ],
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                // localField: "emp_id",
                // foreignField: "emp_id",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
              },
            },
            project,
          ]);
        } else if (req.body.report_type == "late_summary_report") {
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],

                      register_type: req.body.attendance_type.toString(),
                      attendance_stat: "L",
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                // shift_data:1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]);
        } else if (
          req.body.report_type == "month_wise_summary" ||
          req.body.report_type == "summary"
        ) {
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],

                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                // localField: "emp_id",
                // foreignField: "emp_id",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]);
        }
        Employee.aggregatePaginate(
          myAggregate,
          options,
          async function (err, employees) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            return resp
              .status(200)
              .json({ status: "success", employees: employees });
          }
        );
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  export_attendance_report_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        pageno: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(403).send({
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
        var filter_option = {};

        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { parent_hods: { $in: [req.authId] } },
              { approval_status: "approved" },
            ],
          },
        };
        var search_option_details = {
          $match: {
            "attendance.attendance_month": req.body.wage_month_from,
            "attendance.attendance_year": req.body.wage_year_from,
          },
        };

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
        // if(!req.body.report_type){
        search_option_details.$match[
          "employee_details.template_data.attendance_temp_data.register_type"
        ] = req.body.attendance_type;
        // }
        if (req.body.row_checked_all === "true") {
          if (typeof req.body.unchecked_row_ids == "string") {
            var ids = JSON.parse(req.body.unchecked_row_ids);
          } else {
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
          } else {
            var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
          }
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option.$match._id = { $in: ids };
          }
        }

        if (!req.body.report_type) {
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
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "attendance_summaries",
                // localField: "emp_id",
                // foreignField: "emp_id",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
              },
            },
            search_option_details,
            {
              $addFields: {
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
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
                profile_pic: 1,
                shift: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.template_data.attendance_temp_data.register_type": 1,
                attendance_summ: 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            },
          ]);
        } else if (
          req.body.report_type == "form_d" ||
          req.body.report_type == "monthly_late_report"
        ) {
          if (req.body.report_type == "monthly_late_report") {
            var loopUpdata = {
              $lookup: {
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                      attendance_stat: "L",
                    },
                  },
                ],
                as: "attendance",
              },
            };
          } else {
            var loopUpdata = {
              $lookup: {
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            };
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
            loopUpdata,
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,

                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]).then(async (employees) => {
            const daysCount = moment(
              start_year + "-" + (start_month + 1),
              "YYYY-MM"
            ).daysInMonth();
            if (req.body.report_type == "form_d") {
              var field_list_array = [
                "client_id",
                "emp_code",
                "name",
                "designation",
                "place_of_work",
                "date_of_joining",
              ];
              for (var i = 1; i <= daysCount; i++) {
                field_list_array.push(i.toString());
              }
              field_list_array.push("no_of_days");
              field_list_array.push("signature_of_register_keeper");
              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
              if (field_list_array.includes("client_id")) {
                ws.cell(1, clmn_id++).string("Clinet ID");
              }
              if (field_list_array.includes("emp_code")) {
                ws.cell(1, clmn_id++).string("Employee Code");
              }
              if (field_list_array.includes("name")) {
                ws.cell(1, clmn_id++).string("Name");
              }
              if (field_list_array.includes("designation")) {
                ws.cell(1, clmn_id++).string("RELAY # OR SET WORK/Designation");
              }
              if (field_list_array.includes("place_of_work")) {
                ws.cell(1, clmn_id++).string("Place of work*");
              }
              if (field_list_array.includes("date_of_joining")) {
                ws.cell(1, clmn_id++).string("Date of Joining");
              }
              for (var i = 1; i <= daysCount; i++) {
                ws.cell(1, clmn_id++).string(i.toString());
              }
              if (field_list_array.includes("no_of_days")) {
                ws.cell(1, clmn_id++).string("Summary No. Of Days");
              }
              if (field_list_array.includes("signature_of_register_keeper")) {
                ws.cell(1, clmn_id++).string("Signature of Register Keeper");
              }
              var new_start_month = parseInt(start_month) + 1;
              if (new_start_month < 10) {
                new_start_month = "0" + new_start_month;
              }
              await Promise.all(
                employees.map(async (employee, index) => {
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id = 1;
                  ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                  if (field_list_array.includes("client_id")) {
                    if (employee.client.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.client
                          ? String(employee.client[0].client_code)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("emp_code")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                    );
                  }
                  if (field_list_array.includes("name")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_first_name
                        ? String(
                            employee.emp_first_name +
                              " " +
                              employee.emp_last_name
                          )
                        : ""
                    );
                  }
                  if (field_list_array.includes("designation")) {
                    if (employee.designation.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.designation
                          ? String(employee.designation[0].designation_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("place_of_work")) {
                    ws.cell(index_val, clmn_emp_id++).string("");
                  }
                  if (field_list_array.includes("date_of_joining")) {
                    if (employee.employee_details.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.employee_details[0].employment_hr_details
                          ? String(
                              employee.employee_details[0].employment_hr_details
                                .date_of_join
                            )
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  for (var i = 1; i <= daysCount; i++) {
                    if (field_list_array.includes(i.toString())) {
                      if (i < 10) {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-0" +
                          i.toString();
                      } else {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-" +
                          i.toString();
                      }
                      searchKey = date_one;

                      var attendance =
                        employee.attendance[
                          employee.attendance
                            .map(function (item) {
                              return item.attendance_date;
                            })
                            .indexOf(searchKey)
                        ];
                      if (attendance) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance.attendance_stat
                            ? String(attendance.attendance_stat)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("N/A");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("N/A");
                    }
                  }
                  if (employee.attendance_summ) {
                    if (employee.attendance_summ.length > 0) {
                      if (field_list_array.includes("no_of_days")) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(
                                employee.attendance_summ[0].total_attendance
                              )
                            : ""
                        );
                      }
                    }
                  }
                  if (
                    field_list_array.includes("signature_of_register_keeper")
                  ) {
                    ws.cell(index_val, clmn_emp_id++).string("");
                  }
                })
              ).then(async (value) => {
                // wb.write(req.body.report_type+"-attendance.xlsx");
                let file = Site_helper.createFiles(
                  wb,
                  req.body.report_type + "-attendance.xlsx",
                  req.authData.corporate_id,
                  'temp_files/attendance-module'
                );

                // file_name = req.body.report_type + "-attendance.xlsx";
                // file_path =
                //   "/storage/company/temp_files/" + req.authData.corporate_id;
                await Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	message: "Xlsx created successfully",
                // 	url: baseurl + file_location,
                // });
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	employees: employees,
                // 	masters: masters,
                // });
              });
            } else if (req.body.report_type == "monthly_late_report") {
              var field_list_array = [
                "emp_code",
                "name",
                "department",
                "designation",
                "branch",
                "client_id",
                "hod",
              ];
              for (var i = 1; i <= daysCount; i++) {
                field_list_array.push(i.toString());
              }
              var new_start_month = parseInt(start_month) + 1;
              if (new_start_month < 10) {
                new_start_month = "0" + new_start_month;
              }
              field_list_array.push("no_of_instances");
              field_list_array.push("total_late_hours");
              field_list_array.push("lop_deducted");
              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
              if (field_list_array.includes("emp_code")) {
                ws.cell(1, clmn_id++).string("Employee Id");
              }
              if (field_list_array.includes("name")) {
                ws.cell(1, clmn_id++).string("Name");
              }
              if (field_list_array.includes("department")) {
                ws.cell(1, clmn_id++).string("Department");
              }
              if (field_list_array.includes("designation")) {
                ws.cell(1, clmn_id++).string("Designation");
              }
              if (field_list_array.includes("branch")) {
                ws.cell(1, clmn_id++).string("Branch");
              }
              if (field_list_array.includes("client_id")) {
                ws.cell(1, clmn_id++).string("Clinet ID");
              }
              if (field_list_array.includes("hod")) {
                ws.cell(1, clmn_id++).string("HOD");
              }
              for (var i = 1; i <= daysCount; i++) {
                if (i < 10) {
                  var i = "0" + i;
                }
                ws.cell(1, clmn_id++).string(
                  i.toString() + "-" + new_start_month + "-" + start_year
                );
              }
              if (field_list_array.includes("no_of_instances")) {
                ws.cell(1, clmn_id++).string("No Of Instances");
              }
              if (field_list_array.includes("total_late_hours")) {
                ws.cell(1, clmn_id++).string("Total Late Hours");
              }
              if (field_list_array.includes("lop_deducted")) {
                ws.cell(1, clmn_id++).string("LOP Deducted");
              }

              await Promise.all(
                employees.map(async (employee, index) => {
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id = 1;
                  ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                  if (field_list_array.includes("emp_code")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                    );
                  }
                  if (field_list_array.includes("name")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_first_name
                        ? String(
                            employee.emp_first_name +
                              " " +
                              employee.emp_last_name
                          )
                        : ""
                    );
                  }
                  if (field_list_array.includes("department")) {
                    if (employee.department.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.department
                          ? String(employee.department[0].department_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("designation")) {
                    if (employee.designation.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.designation
                          ? String(employee.designation[0].designation_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("branch")) {
                    if (employee.branch.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.branch
                          ? String(employee.branch[0].branch_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("client_id")) {
                    if (employee.client.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.client
                          ? String(employee.client[0].client_code)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("hod")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.hod
                        ? String(
                            employee.hod.first_name +
                              " " +
                              employee.hod.last_name
                          )
                        : ""
                    );
                  }
                  for (var i = 1; i <= daysCount; i++) {
                    if (field_list_array.includes(i.toString())) {
                      if (i < 10) {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-0" +
                          i.toString();
                      } else {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-" +
                          i.toString();
                      }
                      searchKey = date_one;

                      var attendance =
                        employee.attendance[
                          employee.attendance
                            .map(function (item) {
                              return item.attendance_date;
                            })
                            .indexOf(searchKey)
                        ];
                      if (attendance) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance.attendance_stat
                            ? String(attendance.attendance_stat)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("N/A");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("N/A");
                    }
                  }
                  if (field_list_array.includes("no_of_instances")) {
                    ws.cell(index_val, clmn_emp_id++).string("");
                  }
                  if (field_list_array.includes("total_late_hours")) {
                    if (employee.attendance_summ.length > 0) {
                      if (employee.attendance_summ[0].total_late_hour) {
                        var totalhour =
                          employee.attendance_summ[0].total_late_hour / 60;
                        ws.cell(index_val, clmn_emp_id++).string(
                          totalhour.toString()
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("lop_deducted")) {
                    if (employee.attendance_summ.length > 0) {
                      if (employee.attendance_summ[0].total_lop) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0].total_lop.toString()
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                })
              ).then(async (value) => {
                // wb.write(req.body.report_type+"-attendance.xlsx");
                // let file_location = Site_helper.createFiles(
                //   wb,
                //   req.body.report_type + "-attendance",
                //   "xlsx",
                //   req.authData.corporate_id
                // );
                let file_name = req.body.report_type + "-attendance.xlsx";
                var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/attendance-module');


                // file_path =
                //   "/storage/company/temp_files/" + req.authData.corporate_id;
                await Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
                // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
                // return resp.status(200).json({status: "success",employees: employees,masters: masters});
              });
            }
          });
        } else if (req.body.report_type == "attendance_register") {
          if (req.body.attendance_type == "time") {
            var project = {
              $project: {
                _id: 1,
                corporate_id: 1,
                userid: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                profile_pic: 1,
                shift: 1,
                shift_data: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,

                "attendance.attendance_date": 1,
                "attendance.emp_id": 1,
                "attendance.attendance_month": 1,
                "attendance.attendance_stat": 1,
                "attendance.attendance_year": 1,
                "attendance.corporate_id": 1,
                "attendance.break_time": 1,
                "attendance.login_time": 1,
                "attendance.logout_time": 1,
                "attendance.register_type": 1,
                "attendance.total_break_time": 1,
                "attendance.total_logged_in": 1,
                attendance_summ: 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            };
          } else {
            var project = {
              $project: {
                _id: 1,
                corporate_id: 1,
                userid: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                profile_pic: 1,
                shift: 1,
                shift_data: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                attendance: 1,
                attendance_summ: 1,

                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            };
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
              },
            },
            project,
          ]).then(async (employees) => {
            const daysCount = moment(
              start_year + "-" + (start_month + 1),
              "YYYY-MM"
            ).daysInMonth();
            if (
              req.body.attendance_type == "time" ||
              req.body.attendance_type == "monthly"
            ) {
              var field_list_array = [
                "emp_id",
                "name",
                "shift",
                "in_time",
                "out_time",
              ];
              for (var i = 1; i <= daysCount; i++) {
                field_list_array.push("actual_in_time_" + i.toString());
                field_list_array.push("actual_out_time_" + i.toString());
              }
              field_list_array.push("total_working_hours");
              field_list_array.push("extra_working_hours");
              field_list_array.push("total_present");
              field_list_array.push("total_absent");
              field_list_array.push("total_wo_ho");

              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
              if (field_list_array.includes("emp_id")) {
                ws.cell(1, clmn_id++).string("Employee ID");
              }
              if (field_list_array.includes("name")) {
                ws.cell(1, clmn_id++).string("Name");
              }
              if (field_list_array.includes("shift")) {
                ws.cell(1, clmn_id++).string("Shift");
              }
              if (field_list_array.includes("in_time")) {
                ws.cell(1, clmn_id++).string("In Time");
              }
              if (field_list_array.includes("out_time")) {
                ws.cell(1, clmn_id++).string("Out Time");
              }
              for (var i = 1; i <= daysCount; i++) {
                if (i < 10) {
                  i = "0" + i;
                }
                var start_month_new = parseInt(start_month) + 1;
                if (start_month_new < 10) {
                  start_month_new = "0" + start_month_new;
                }
                ws.cell(1, clmn_id++).string(
                  "Actual In Time (" +
                    i.toString() +
                    "/" +
                    start_month_new +
                    ")"
                );
                ws.cell(1, clmn_id++).string(
                  "Actual Out Time (" +
                    i.toString() +
                    "/" +
                    start_month_new +
                    ")"
                );
              }
              if (field_list_array.includes("total_working_hours")) {
                ws.cell(1, clmn_id++).string("Total Working Hours");
              }
              if (field_list_array.includes("extra_working_hours")) {
                ws.cell(1, clmn_id++).string("Extra Working Hours");
              }
              if (field_list_array.includes("total_present")) {
                ws.cell(1, clmn_id++).string("Total Present");
              }
              if (field_list_array.includes("total_absent")) {
                ws.cell(1, clmn_id++).string("Total Absent");
              }
              if (field_list_array.includes("total_wo_ho")) {
                ws.cell(1, clmn_id++).string("Total WO/HO");
              }
              var new_start_month = parseInt(start_month) + 1;
              if (new_start_month < 10) {
                new_start_month = "0" + new_start_month;
              }
              await Promise.all(
                employees.map(async (employee, index) => {
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id = 1;
                  var total_working_hours = 0;
                  ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                  if (field_list_array.includes("emp_id")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                    );
                  }
                  if (field_list_array.includes("name")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_first_name
                        ? String(
                            employee.emp_first_name +
                              " " +
                              employee.emp_last_name
                          )
                        : ""
                    );
                  }

                  if (field_list_array.includes("shift")) {
                    if (employee.shift_data) {
                      if (employee.shift_data.shift_name) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.shift_data.shift_name
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("in_time")) {
                    if (employee.shift_data) {
                      if (employee.shift_data.shift1_start_time) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.shift_data.shift1_start_time
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("out_time")) {
                    if (employee.shift_data) {
                      if (employee.shift_data.shift2_end_time) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.shift_data.shift2_end_time
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  for (var i = 1; i <= daysCount; i++) {
                    if (
                      field_list_array.includes(
                        "actual_in_time_" + i.toString()
                      )
                    ) {
                      if (i < 10) {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-0" +
                          i.toString();
                      } else {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-" +
                          i.toString();
                      }
                      searchKey = date_one;

                      var attendance =
                        employee.attendance[
                          employee.attendance
                            .map(function (item) {
                              return item.attendance_date;
                            })
                            .indexOf(searchKey)
                        ];
                      if (attendance) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance.login_time
                            ? String(attendance.login_time)
                            : ""
                        );
                        total_working_hours += parseFloat(
                          attendance.total_logged_in
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("N/A");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("N/A");
                    }
                    if (
                      field_list_array.includes(
                        "actual_out_time_" + i.toString()
                      )
                    ) {
                      if (i < 10) {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-0" +
                          i.toString();
                      } else {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-" +
                          i.toString();
                      }
                      searchKey = date_one;

                      var attendance =
                        employee.attendance[
                          employee.attendance
                            .map(function (item) {
                              return item.attendance_date;
                            })
                            .indexOf(searchKey)
                        ];
                      if (attendance) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance.logout_time
                            ? String(attendance.logout_time)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("N/A");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("N/A");
                    }
                  }
                  if (field_list_array.includes("total_working_hours")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      total_working_hours.toString()
                    );
                  }
                  if (field_list_array.includes("extra_working_hours")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_overtime)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("total_present")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_present)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("total_absent")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_absent)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("total_wo_ho")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_wo)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                })
              ).then(async (value) => {
                // wb.write(req.body.report_type+"_"+req.body.attendance_type+".xlsx");
                // let file_location = Site_helper.createFiles(
                //   wb,
                //   req.body.report_type + "_" + req.body.attendance_type,
                //   "xlsx",
                //   req.authData.corporate_id
                // );
                let file_name = req.body.report_type + "_" + req.body.attendance_type + ".xlsx";
                var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/attendance-module');
                // file_path = "/storage/company/temp_files/" + req.authData.corporate_id;
                await Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
                // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
                // return resp.status(200).json({status: "success",employees: employees,masters: masters,});
              });
            }
            if (
              req.body.attendance_type == "halfday" ||
              req.body.attendance_type == "wholeday"
            ) {
              var field_list_array = ["emp_id", "name"];
              for (var i = 1; i <= daysCount; i++) {
                field_list_array.push(i.toString());
              }
              field_list_array.push("present");
              field_list_array.push("w_off_h_off");
              field_list_array.push("pl");
              field_list_array.push("absent_lwp");
              field_list_array.push("total");
              field_list_array.push("total_payable_days");
              field_list_array.push("l_e");
              field_list_array.push("late");
              field_list_array.push("remarks_ded_for_jun_23");

              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
              if (field_list_array.includes("emp_id")) {
                ws.cell(1, clmn_id++).string("Employee ID");
              }
              if (field_list_array.includes("name")) {
                ws.cell(1, clmn_id++).string("Name");
              }
              for (var i = 1; i <= daysCount; i++) {
                ws.cell(1, clmn_id++).string(i.toString());
              }
              if (field_list_array.includes("present")) {
                ws.cell(1, clmn_id++).string("Present");
              }
              if (field_list_array.includes("w_off_h_off")) {
                ws.cell(1, clmn_id++).string("W/Off & H/Off");
              }
              if (field_list_array.includes("p_l")) {
                ws.cell(1, clmn_id++).string("PL");
              }
              if (field_list_array.includes("absent_lwp")) {
                ws.cell(1, clmn_id++).string("Absent/LWP");
              }
              if (field_list_array.includes("total")) {
                ws.cell(1, clmn_id++).string("Total");
              }
              if (field_list_array.includes("total_payable_days")) {
                ws.cell(1, clmn_id++).string("Total Payable Days");
              }
              if (field_list_array.includes("l_e")) {
                ws.cell(1, clmn_id++).string("L E");
              }
              if (field_list_array.includes("late")) {
                ws.cell(1, clmn_id++).string("LATE");
              }
              if (field_list_array.includes("remarks_ded_for_jun_23")) {
                ws.cell(1, clmn_id++).string("Remarks Ded. for Jun 23");
              }
              var new_start_month = parseInt(start_month) + 1;
              if (new_start_month < 10) {
                new_start_month = "0" + new_start_month;
              }
              await Promise.all(
                employees.map(async (employee, index) => {
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id = 1;
                  var total_working_hours = 0;
                  ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                  if (field_list_array.includes("emp_id")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                    );
                  }
                  if (field_list_array.includes("name")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_first_name
                        ? String(
                            employee.emp_first_name +
                              " " +
                              employee.emp_last_name
                          )
                        : ""
                    );
                  }
                  for (var i = 1; i <= daysCount; i++) {
                    if (field_list_array.includes(i.toString())) {
                      if (i < 10) {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-0" +
                          i.toString();
                      } else {
                        var date_one =
                          start_year +
                          "-" +
                          new_start_month +
                          "-" +
                          i.toString();
                      }
                      searchKey = date_one;

                      var attendance =
                        employee.attendance[
                          employee.attendance
                            .map(function (item) {
                              return item.attendance_date;
                            })
                            .indexOf(searchKey)
                        ];
                      if (attendance) {
                        var valdata =
                          attendance.first_half +
                          " - " +
                          attendance.second_half;
                        ws.cell(index_val, clmn_emp_id++).string(valdata);
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("N/A - N/A");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("N/A - N/A");
                    }
                  }

                  if (field_list_array.includes("present")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_present)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("w_off_h_off")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        var w_off_h_off =
                          parseFloat(employee.attendance_summ[0].holiday) +
                          parseFloat(employee.attendance_summ[0].total_wo);
                        ws.cell(index_val, clmn_emp_id++).string(
                          w_off_h_off.toString()
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("p_l")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_absent)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("absent_lwp")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_absent)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      daysCount.toString()
                    );
                  }
                  if (field_list_array.includes("total_payable_days")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].paydays)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("l_e")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        var totalLe =
                          parseFloat(employee.attendance_summ[0].total_LE1) +
                          parseFloat(employee.attendance_summ[0].total_LE2);
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(totalLe.toString())
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("late")) {
                    if (employee.attendance_summ) {
                      if (employee.attendance_summ.length > 0) {
                        ws.cell(index_val, clmn_emp_id++).string(
                          employee.attendance_summ[0]
                            ? String(employee.attendance_summ[0].total_late)
                            : ""
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                  }
                  if (field_list_array.includes("remarks_ded_for_jun_23")) {
                    ws.cell(index_val, clmn_emp_id++).string("");
                  }
                })
              ).then(async (value) => {
                // wb.write(req.body.report_type+"_"+req.body.attendance_type+".xlsx");
                // let file_location = Site_helper.createFiles(
                //   wb,
                //   req.body.report_type + "_" + req.body.attendance_type,
                //   "xlsx",
                //   req.authData.corporate_id
                // );
                let file_name =
                  req.body.report_type +
                  "_" +
                  req.body.attendance_type +
                  ".xlsx";
                  var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/attendance-module');
                // file_path =
                //   "/storage/company/temp_files/" + req.authData.corporate_id;
                await Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	message: "Xlsx created successfully",
                // 	url: baseurl + file_location
                // });
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	employees: employees,
                // 	masters: masters,
                // });
              });
            }
          });
        } else if (req.body.report_type == "late_summary_report") {
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],

                      register_type: req.body.attendance_type.toString(),
                      attendance_stat: "L",
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]).then(async (employees) =>{
              const monthDiff = moment(`${end_year}-${end_month+1}`).diff(moment(`${start_year}-${start_month+1}`), 'months') + 1;
              // const daysCount = moment(start_year + "-" + (start_month + 1),"YYYY-MM" ).daysInMonth();
            
              var field_list_array = [
                "emp_code",
                "name",
                "department",
                "designation",
                "branch",
                "client_id",
                "hod",
              ];
              
              for (var i = 1; i <= monthDiff; i++) {
                field_list_array.push(i.toString());
              }
              var new_start_month = parseInt(start_month) + 1;
              if (new_start_month < 10) {
                new_start_month = "0" + new_start_month;
              }
              field_list_array.push("total");

              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;

              let thStyle = {
                  alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                  }
              }

              ws.cell(1, clmn_id, 2, clmn_id, true).string("Sl. No.");
              if (field_list_array.includes("emp_code")) {
                ws.cell(1, ++clmn_id, 2, clmn_id, true).string("Employee Id").style(thStyle);
              }
              if (field_list_array.includes("name")) {
                ws.cell(1, ++clmn_id, 2, clmn_id, true).string("Name").style(thStyle);
              }
              if (field_list_array.includes("department")) {
                ws.cell(1, ++clmn_id, 2, clmn_id, true).string("Department").style(thStyle);
              }
              if (field_list_array.includes("designation")) {
                ws.cell(1, ++clmn_id, 2, clmn_id, true).string("Designation").style(thStyle);
              }
              if (field_list_array.includes("branch")) {
                ws.cell(1, ++clmn_id, 2, clmn_id, true).string("Branch").style(thStyle);
              }
              if (field_list_array.includes("client_id")) {
                ws.cell(1, ++clmn_id, 2, clmn_id, true).string("Clinet ID").style(thStyle);
              }
              if (field_list_array.includes("hod")) {
                ws.cell(1, ++clmn_id, 2, clmn_id, true).string("HOD").style(thStyle);
              }
              for (var i = 1; i <= monthDiff; i++) {
                if (i < 10) {var i = "0" + i;}
                ws.cell(1, ++clmn_id, 1,++clmn_id, true).string(i + "-" + start_year).style(thStyle);
                ws.cell(2, clmn_id-1,).string("INSTANCES").style(thStyle);
                ws.cell(2, clmn_id,).string("HOURS").style(thStyle);
              }
              if (field_list_array.includes("total")) {
                ws.cell(1, ++clmn_id, 1,  ++clmn_id, true).string("Total").style(thStyle);
                ws.cell(2, clmn_id-1,).string("INSTANCES").style(thStyle);
                ws.cell(2, clmn_id,).string("HOURS").style(thStyle);
              }

              await Promise.all(
                employees.map(async (employee, index) => {
                  var index_val = 3;
                  index_val = index_val + index;
                  var clmn_emp_id = 1;
                  ws.cell(index_val, clmn_emp_id).number(index+1 ?? 'NaN');
                  if (field_list_array.includes("emp_code")) {
                    ws.cell(index_val, ++clmn_emp_id).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                    );
                  }
                  if (field_list_array.includes("name")) {
                    ws.cell(index_val, ++clmn_emp_id).string(
                      employee.emp_first_name
                        ? String(
                            employee.emp_first_name +
                              " " +
                              employee.emp_last_name
                          )
                        : ""
                    );
                  }
                  if (field_list_array.includes("department")) {
                    if (employee.department.length > 0) {
                      ws.cell(index_val, ++clmn_emp_id).string(
                        employee.department
                          ? String(employee.department[0].department_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, ++clmn_emp_id).string("");
                    }
                  }
                  if (field_list_array.includes("designation")) {
                    if (employee.designation.length > 0) {
                      ws.cell(index_val, ++clmn_emp_id).string(
                        employee.designation
                          ? String(employee.designation[0].designation_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, ++clmn_emp_id).string("");
                    }
                  }
                  if (field_list_array.includes("branch")) {
                    if (employee.branch.length > 0) {
                      ws.cell(index_val, ++clmn_emp_id).string(
                        employee.branch
                          ? String(employee.branch[0].branch_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, ++clmn_emp_id).string("");
                    }
                  }
                  if (field_list_array.includes("client_id")) {
                    if (employee.client.length > 0) {
                      ws.cell(index_val, ++clmn_emp_id).string(
                        employee.client
                          ? String(employee.client[0].client_code)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, ++clmn_emp_id).string("");
                    }
                  }
                  if (field_list_array.includes("hod")) {
                    ws.cell(index_val, ++clmn_emp_id).string(
                      employee.hod
                        ? String(
                            employee.hod.first_name +
                              " " +
                              employee.hod.last_name
                          )
                        : ""
                    );
                  }
                  let rowTotal =  0
                  for (let i = 0; i < monthDiff; i++) {
                    let item = employee.attendance_summ?.find((newItem)=>(
                      newItem.attendance_month==i.toString() && 
                      (newItem.attendance_year >= start_year.toString() && newItem.attendance_year <= end_year.toString())
                      ));
                    
                   if (item == undefined) {
                     ws.cell(index_val, ++clmn_emp_id).string("N/A");
                     ws.cell(index_val, ++clmn_emp_id).string("N/A");
                     //  employee.attendance_summ.push({total_late_hour:'N/A',total_instances:'N/A'});
                   } else {
                     ws.cell(index_val, ++clmn_emp_id).string(
                       item.total_instances
                         ? String(item.total_instances)
                         : "N/A"
                     );
                     ws.cell(index_val, ++clmn_emp_id).string(
                       item.total_late_hour && item.total_late_hour !== "N/A"
                         ? String((item.total_late_hour / 60).toFixed(2))
                         : "00.00"
                     );
                     rowTotal += (item.total_late_hour/60) ?? 0;
                   }     
                  }

             
                  if (field_list_array.includes("total")) {
                    ws.cell(index_val,  ++clmn_emp_id).string('00.00');
                    ws.cell(index_val, ++clmn_emp_id).string(rowTotal.toFixed(2).toString());
                  }
                })
              ).then(async (value) => {
                // wb.write(req.body.report_type+"-attendance.xlsx");
                // let file_location = Site_helper.createFiles(
                //   wb,
                //   req.body.report_type + "-attendance",
                //   "xlsx",
                //   req.authData.corporate_id
                // );
               let file_name = req.body.report_type + "-attendance.xlsx";
               var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/attendance-module');
                // file_path =
                //   "/storage/company/temp_files/" + req.authData.corporate_id;
                await Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
                // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
                // return resp.status(200).json({status: "success",employees: employees,masters: masters});
              });
            // }
          });
        } else if (
          req.body.report_type == "month_wise_summary" ||
          req.body.report_type == "summary"
        ) {
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],

                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                // localField: "emp_id",
                // foreignField: "emp_id",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                // shift_data:1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]).then(async (employees) => {
            if (req.body.report_type == "month_wise_summary") {
              const daysCount = moment(
                end_year + "-" + (end_month + 1),
                "YYYY-MM"
              ).daysInMonth();
              var total_range_month = moment([
                end_year,
                end_month,
                daysCount,
              ]).diff(moment([start_year, start_month, 1]), "months", true);

              var field_list_array = [
                "emp_code",
                "name",
                "department",
                "designation",
                "branch",
                "client_id",
                "hod",
              ];
              for (var i = 0; i <= parseInt(total_range_month); i++) {
                field_list_array.push("month_days_" + i.toString());
                field_list_array.push("persent_days_" + i.toString());
                field_list_array.push("pay_days_" + i.toString());
                field_list_array.push("wo_" + i.toString());
                field_list_array.push("h_" + i.toString());
                field_list_array.push("sl_" + i.toString());
                field_list_array.push("pl_" + i.toString());
                field_list_array.push("el_" + i.toString());
                field_list_array.push("ot_" + i.toString());
                field_list_array.push("lop_etc_" + i.toString());
              }
              var new_start_month = parseInt(start_month) + 1;
              if (new_start_month < 10) {
                new_start_month = "0" + new_start_month;
              }
              field_list_array.push("month_days_total");
              field_list_array.push("persent_days_total");
              field_list_array.push("pay_days_total");
              field_list_array.push("wo_total");
              field_list_array.push("h_total");
              field_list_array.push("sl_total");
              field_list_array.push("pl_total");
              field_list_array.push("el_total");
              field_list_array.push("ot_total");
              field_list_array.push("lop_etc_total");

              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
              if (field_list_array.includes("emp_code")) {
                ws.cell(1, clmn_id++).string("Employee Id");
              }
              if (field_list_array.includes("name")) {
                ws.cell(1, clmn_id++).string("Name");
              }
              if (field_list_array.includes("department")) {
                ws.cell(1, clmn_id++).string("Department");
              }
              if (field_list_array.includes("designation")) {
                ws.cell(1, clmn_id++).string("Designation");
              }
              if (field_list_array.includes("branch")) {
                ws.cell(1, clmn_id++).string("Branch");
              }
              if (field_list_array.includes("client_id")) {
                ws.cell(1, clmn_id++).string("Clinet ID");
              }
              if (field_list_array.includes("hod")) {
                ws.cell(1, clmn_id++).string("HOD");
              }
              for (var i = 0; i <= parseInt(total_range_month); i++) {
                if (field_list_array.includes("month_days_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "Month Days (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("persent_days_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "Persent Days (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("pay_days_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "Pay days (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("wo_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "WO (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("h_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "H (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("sl_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "SL (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("pl_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "PL (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("el_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "EL (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("ot_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "OT (Wage Month " + (i + 1).toString() + ")"
                  );
                }
                if (field_list_array.includes("lop_etc_" + i.toString())) {
                  ws.cell(1, clmn_id++).string(
                    "LOP etc (Wage Month " + (i + 1).toString() + ")"
                  );
                }
              }
              if (field_list_array.includes("month_days_total")) {
                ws.cell(1, clmn_id++).string("Month Days (Total)");
              }
              if (field_list_array.includes("persent_days_total")) {
                ws.cell(1, clmn_id++).string("Persent Days (Total)");
              }
              if (field_list_array.includes("pay_days_total")) {
                ws.cell(1, clmn_id++).string("Pay days (Total)");
              }
              if (field_list_array.includes("wo_total")) {
                ws.cell(1, clmn_id++).string("WO (Total)");
              }
              if (field_list_array.includes("h_total")) {
                ws.cell(1, clmn_id++).string("H (Total)");
              }
              if (field_list_array.includes("sl_total")) {
                ws.cell(1, clmn_id++).string("SL (Total)");
              }
              if (field_list_array.includes("pl_total")) {
                ws.cell(1, clmn_id++).string("PL (Total)");
              }
              if (field_list_array.includes("el_total")) {
                ws.cell(1, clmn_id++).string("EL (Total)");
              }
              if (field_list_array.includes("ot_total")) {
                ws.cell(1, clmn_id++).string("OT (Total)");
              }
              if (field_list_array.includes("lop_etc_total")) {
                ws.cell(1, clmn_id++).string("LOP etc (Total)");
              }

              await Promise.all(
                employees.map(async (employee, index) => {
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id = 1;
                  ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                  if (field_list_array.includes("emp_code")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                    );
                  }
                  if (field_list_array.includes("name")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_first_name
                        ? String(
                            employee.emp_first_name +
                              " " +
                              employee.emp_last_name
                          )
                        : ""
                    );
                  }
                  if (field_list_array.includes("department")) {
                    if (employee.department.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.department
                          ? String(employee.department[0].department_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("designation")) {
                    if (employee.designation.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.designation
                          ? String(employee.designation[0].designation_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("branch")) {
                    if (employee.branch.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.branch
                          ? String(employee.branch[0].branch_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("client_id")) {
                    if (employee.client.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.client
                          ? String(employee.client[0].client_code)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("hod")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.hod
                        ? String(
                            employee.hod.first_name +
                              " " +
                              employee.hod.last_name
                          )
                        : ""
                    );
                  }
                  var month_days_total = 0;
                  var persent_days_total = 0;
                  var pay_days_total = 0;
                  var wo_total = 0;
                  var h_total = 0;
                  var sl_total = 0;
                  var pl_total = 0;
                  var el_total = 0;
                  var ot_total = 0;
                  var lop_etc_total = 0;
                  for (var i = 0; i <= parseInt(total_range_month); i++) {
                    var date = new Date(
                      start_year + "-" + new_start_month + "-01"
                    );
                    var newDate = new Date(date.setMonth(date.getMonth() + i));
                    var daysCountCurrentMonth = moment(
                      newDate.getFullYear() + "-" + (newDate.getMonth() + 1),
                      "YYYY-MM"
                    ).daysInMonth();

                    if (
                      field_list_array.includes("month_days_" + i.toString())
                    ) {
                      month_days_total += parseFloat(daysCountCurrentMonth);
                      ws.cell(index_val, clmn_emp_id++).string(
                        daysCountCurrentMonth.toString()
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("0");
                    }
                    var attendance = employee.attendance_summ
                      .map((item) => {
                        if (
                          item.attendance_month ==
                            newDate.getMonth().toString() &&
                          item.attendance_year ==
                            newDate.getFullYear().toString()
                        ) {
                          return item;
                        } else {
                          return null;
                        }
                      })
                      .filter(Boolean);
                    if (
                      field_list_array.includes("persent_days_" + i.toString())
                    ) {
                      if (attendance.length > 0) {
                        persent_days_total += parseFloat(
                          attendance[0].total_present
                        );
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].total_present
                            ? String(attendance[0].total_present.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("pay_days_" + i.toString())) {
                      if (attendance.length > 0) {
                        pay_days_total += parseFloat(attendance[0].paydays);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].paydays
                            ? String(attendance[0].paydays.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("wo_" + i.toString())) {
                      if (attendance.length > 0) {
                        wo_total += parseFloat(attendance[0].total_wo);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].total_wo
                            ? String(attendance[0].total_wo.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("h_" + i.toString())) {
                      if (attendance.length > 0) {
                        h_total += parseFloat(attendance[0].holiday);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].holiday
                            ? String(attendance[0].holiday.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("sl_" + i.toString())) {
                      if (attendance.length > 0) {
                        sl_total += parseFloat(attendance[0].total_SKL);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].total_SKL
                            ? String(attendance[0].total_SKL.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("pl_" + i.toString())) {
                      if (attendance.length > 0) {
                        pl_total += parseFloat(attendance[0].total_PVL);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].total_PVL
                            ? String(attendance[0].total_PVL.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("el_" + i.toString())) {
                      if (attendance.length > 0) {
                        el_total += parseFloat(attendance[0].total_ERL);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].total_ERL
                            ? String(attendance[0].total_ERL.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("ot_" + i.toString())) {
                      if (attendance.length > 0) {
                        ot_total += parseFloat(attendance[0].total_overtime);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].total_overtime
                            ? String(attendance[0].total_overtime.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                    if (field_list_array.includes("lop_etc_" + i.toString())) {
                      if (attendance.length > 0) {
                        lop_etc_total += parseFloat(attendance[0].total_lop);
                        ws.cell(index_val, clmn_emp_id++).string(
                          attendance[0].total_lop
                            ? String(attendance[0].total_lop.toString())
                            : "0"
                        );
                      } else {
                        ws.cell(index_val, clmn_emp_id++).string("0");
                      }
                    }
                  }
                  if (field_list_array.includes("month_days_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      month_days_total.toString()
                    );
                  }
                  if (field_list_array.includes("persent_days_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      persent_days_total.toString()
                    );
                  }
                  if (field_list_array.includes("pay_days_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      pay_days_total.toString()
                    );
                  }
                  if (field_list_array.includes("wo_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      wo_total.toString()
                    );
                  }
                  if (field_list_array.includes("h_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      h_total.toString()
                    );
                  }
                  if (field_list_array.includes("sl_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      sl_total.toString()
                    );
                  }
                  if (field_list_array.includes("pl_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      pl_total.toString()
                    );
                  }
                  if (field_list_array.includes("el_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      el_total.toString()
                    );
                  }
                  if (field_list_array.includes("ot_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      ot_total.toString()
                    );
                  }
                  if (field_list_array.includes("lop_etc_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      lop_etc_total.toString()
                    );
                  }
                })
              ).then(async (value) => {
                // wb.write(req.body.report_type+"-attendance.xlsx");
                // let file_location = Site_helper.createFiles(
                //   wb,
                //   req.body.report_type + "-attendance",
                //   "xlsx",
                //   req.authData.corporate_id
                // );
                let file_name = req.body.report_type + "-attendance.xlsx";
                var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/attendance-module');
                // file_path =
                //   "/storage/company/temp_files/" + req.authData.corporate_id;
                await Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	message: "Xlsx created successfully",
                // 	url: baseurl + file_location,
                // });
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	employees: employees,
                // 	masters: masters,
                // });
              });
            } else if (req.body.report_type == "summary") {
              const daysCount = moment(
                end_year + "-" + (end_month + 1),
                "YYYY-MM"
              ).daysInMonth();
              var total_range_month = moment([
                end_year,
                end_month,
                daysCount,
              ]).diff(moment([start_year, start_month, 1]), "months", true);
              var field_list_array = [
                "emp_code",
                "name",
                "department",
                "designation",
                "branch",
                "client_id",
                "hod",
              ];
              var new_start_month = parseInt(start_month) + 1;
              if (new_start_month < 10) {
                new_start_month = "0" + new_start_month;
              }
              field_list_array.push("month_days_total");
              field_list_array.push("persent_days_total");
              field_list_array.push("pay_days_total");
              field_list_array.push("wo_total");
              field_list_array.push("h_total");
              field_list_array.push("sl_total");
              field_list_array.push("pl_total");
              field_list_array.push("el_total");
              field_list_array.push("ot_total");
              field_list_array.push("lop_etc_total");

              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, clmn_id).string("Sl. No. in Emp. Register");
              if (field_list_array.includes("emp_code")) {
                ws.cell(1, clmn_id++).string("Employee Id");
              }
              if (field_list_array.includes("name")) {
                ws.cell(1, clmn_id++).string("Name");
              }
              if (field_list_array.includes("department")) {
                ws.cell(1, clmn_id++).string("Department");
              }
              if (field_list_array.includes("designation")) {
                ws.cell(1, clmn_id++).string("Designation");
              }
              if (field_list_array.includes("branch")) {
                ws.cell(1, clmn_id++).string("Branch");
              }
              if (field_list_array.includes("client_id")) {
                ws.cell(1, clmn_id++).string("Clinet ID");
              }
              if (field_list_array.includes("hod")) {
                ws.cell(1, clmn_id++).string("HOD");
              }
              if (field_list_array.includes("month_days_total")) {
                ws.cell(1, clmn_id++).string("Month Days (Total)");
              }
              if (field_list_array.includes("persent_days_total")) {
                ws.cell(1, clmn_id++).string("Persent Days (Total)");
              }
              if (field_list_array.includes("pay_days_total")) {
                ws.cell(1, clmn_id++).string("Pay days (Total)");
              }
              if (field_list_array.includes("wo_total")) {
                ws.cell(1, clmn_id++).string("WO (Total)");
              }
              if (field_list_array.includes("h_total")) {
                ws.cell(1, clmn_id++).string("H (Total)");
              }
              if (field_list_array.includes("sl_total")) {
                ws.cell(1, clmn_id++).string("SL (Total)");
              }
              if (field_list_array.includes("pl_total")) {
                ws.cell(1, clmn_id++).string("PL (Total)");
              }
              if (field_list_array.includes("el_total")) {
                ws.cell(1, clmn_id++).string("EL (Total)");
              }
              if (field_list_array.includes("ot_total")) {
                ws.cell(1, clmn_id++).string("OT (Total)");
              }
              if (field_list_array.includes("lop_etc_total")) {
                ws.cell(1, clmn_id++).string("LOP etc (Total)");
              }

              await Promise.all(
                employees.map(async (employee, index) => {
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id = 1;
                  ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                  if (field_list_array.includes("emp_code")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                    );
                  }
                  if (field_list_array.includes("name")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_first_name
                        ? String(
                            employee.emp_first_name +
                              " " +
                              employee.emp_last_name
                          )
                        : ""
                    );
                  }
                  if (field_list_array.includes("department")) {
                    if (employee.department.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.department
                          ? String(employee.department[0].department_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("designation")) {
                    if (employee.designation.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.designation
                          ? String(employee.designation[0].designation_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("branch")) {
                    if (employee.branch.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.branch
                          ? String(employee.branch[0].branch_name)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("client_id")) {
                    if (employee.client.length > 0) {
                      ws.cell(index_val, clmn_emp_id++).string(
                        employee.client
                          ? String(employee.client[0].client_code)
                          : ""
                      );
                    } else {
                      ws.cell(index_val, clmn_emp_id++).string("");
                    }
                  }
                  if (field_list_array.includes("hod")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      employee.hod
                        ? String(
                            employee.hod.first_name +
                              " " +
                              employee.hod.last_name
                          )
                        : ""
                    );
                  }
                  var month_days_total = 0;
                  var persent_days_total = 0;
                  var pay_days_total = 0;
                  var wo_total = 0;
                  var h_total = 0;
                  var sl_total = 0;
                  var pl_total = 0;
                  var el_total = 0;
                  var ot_total = 0;
                  var lop_etc_total = 0;

                  for (var i = 0; i <= parseInt(total_range_month); i++) {
                    var date = new Date(
                      start_year + "-" + new_start_month + "-01"
                    );
                    var newDate = new Date(date.setMonth(date.getMonth() + i));
                    var daysCountCurrentMonth = moment(
                      newDate.getFullYear() + "-" + (newDate.getMonth() + 1),
                      "YYYY-MM"
                    ).daysInMonth();

                    month_days_total += parseFloat(daysCountCurrentMonth);

                    var attendance = employee.attendance_summ
                      .map((item) => {
                        if (
                          item.attendance_month ==
                            newDate.getMonth().toString() &&
                          item.attendance_year ==
                            newDate.getFullYear().toString()
                        ) {
                          return item;
                        } else {
                          return null;
                        }
                      })
                      .filter(Boolean);
                    if (attendance.length > 0) {
                      persent_days_total += parseFloat(
                        attendance[0].total_present
                      );
                      pay_days_total += parseFloat(attendance[0].paydays);
                      wo_total += parseFloat(attendance[0].total_wo);
                      h_total += parseFloat(attendance[0].holiday);
                      sl_total += parseFloat(attendance[0].total_SKL);
                      pl_total += parseFloat(attendance[0].total_PVL);
                      el_total += parseFloat(attendance[0].total_ERL);
                      ot_total += parseFloat(attendance[0].total_overtime);
                      lop_etc_total += parseFloat(attendance[0].total_lop);
                    }
                  }
                  if (field_list_array.includes("month_days_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      month_days_total.toString()
                    );
                  }
                  if (field_list_array.includes("persent_days_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      persent_days_total.toString()
                    );
                  }
                  if (field_list_array.includes("pay_days_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      pay_days_total.toString()
                    );
                  }
                  if (field_list_array.includes("wo_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      wo_total.toString()
                    );
                  }
                  if (field_list_array.includes("h_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      h_total.toString()
                    );
                  }
                  if (field_list_array.includes("sl_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      sl_total.toString()
                    );
                  }
                  if (field_list_array.includes("pl_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      pl_total.toString()
                    );
                  }
                  if (field_list_array.includes("el_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      el_total.toString()
                    );
                  }
                  if (field_list_array.includes("ot_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      ot_total.toString()
                    );
                  }
                  if (field_list_array.includes("lop_etc_total")) {
                    ws.cell(index_val, clmn_emp_id++).string(
                      lop_etc_total.toString()
                    );
                  }
                })
              ).then(async (value) => {
                // wb.write(req.body.report_type+"-attendance.xlsx");
                // let file_location = Site_helper.createFiles(
                //   wb,
                //   req.body.report_type + "-attendance",
                //   "xlsx",
                //   req.authData.corporate_id
                // );
                let file_name = req.body.report_type + "-attendance.xlsx";
                var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/attendance-module');
                // file_path =
                //   "/storage/company/temp_files/" + req.authData.corporate_id;
                await Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	message: "Xlsx created successfully",
                // 	url: baseurl + file_location,
                // });
                // return resp
                // .status(200)
                // .json({
                // 	status: "success",
                // 	employees: employees,
                // 	masters: masters,
                // });
              });
            }
          });
        }
      }
    } catch (e) {
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_attendance_data_report: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        pageno: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
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
        var filter_option = {};

        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { parent_hods: { $in: [req.authId] } },
              { approval_status: "approved" },
            ],
          },
        };
        var search_option_details = {
          $match: {
            "attendance.attendance_month": req.body.wage_month_from,
            "attendance.attendance_year": req.body.wage_year_from,
          },
        };

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

        search_option_details.$match[
          "employee_details.template_data.attendance_temp_data.register_type"
        ] = req.body.attendance_type;

        if (req.body.row_checked_all === "true") {
          if (typeof req.body.unchecked_row_ids == "string") {
            var ids = JSON.parse(req.body.unchecked_row_ids);
          } else {
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
          } else {
            var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
          }
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option.$match._id = { $in: ids };
          }
        }
        if (!req.body.report_type) {
          var myAggregate = await Employee.aggregate([
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
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
              },
            },
            search_option_details,
            {
              $addFields: {
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
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
                profile_pic: 1,
                shift: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.template_data.attendance_temp_data.register_type": 1,
                attendance_summ: 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            },
          ]);
        } else if (
          req.body.report_type == "form_d" ||
          req.body.report_type == "monthly_late_report"
        ) {
          if (req.body.report_type == "monthly_late_report") {
            var loopUpdata = {
              $lookup: {
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                      attendance_stat: "L",
                    },
                  },
                ],
                as: "attendance",
              },
            };
          } else {
            var loopUpdata = {
              $lookup: {
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            };
          }
          var myAggregate = await Employee.aggregate([
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
            loopUpdata,
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]);
        } else if (req.body.report_type == "attendance_register") {
          if (req.body.attendance_type == "time") {
            var project = {
              $project: {
                _id: 1,
                corporate_id: 1,
                userid: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                profile_pic: 1,
                shift: 1,
                shift_data: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "attendance.attendance_date": 1,
                "attendance.emp_id": 1,
                "attendance.attendance_month": 1,
                "attendance.attendance_stat": 1,
                "attendance.attendance_year": 1,
                "attendance.corporate_id": 1,
                "attendance.break_time": 1,
                "attendance.login_time": 1,
                "attendance.logout_time": 1,
                "attendance.register_type": 1,
                "attendance.total_break_time": 1,
                "attendance.total_logged_in": 1,
                attendance_summ: 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            };
          } else {
            var project = {
              $project: {
                _id: 1,
                corporate_id: 1,
                userid: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                profile_pic: 1,
                shift: 1,
                shift_data: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                attendance: 1,
                attendance_summ: 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "hod.userid": 1,
                "hod._id": 1,
              },
            };
          }
          var myAggregate = await Employee.aggregate([
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$emp_id", "$$emp_id_var"] },
                      attendance_month: start_month.toString(),
                      attendance_year: start_year.toString(),
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
              },
            },
            project,
          ]);
        } else if (req.body.report_type == "late_summary_report") {
          var myAggregate = await Employee.aggregate([
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],

                      register_type: req.body.attendance_type.toString(),
                      attendance_stat: "L",
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                // shift_data:1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]);
        } else if (
          req.body.report_type == "month_wise_summary" ||
          req.body.report_type == "summary"
        ) {
          var myAggregate = await Employee.aggregate([
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
                from: "employees_attendances",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],

                      register_type: req.body.attendance_type.toString(),
                    },
                  },
                ],
                as: "attendance",
              },
            },
            {
              $lookup: {
                from: "shifts",
                localField: "shift.shift_id",
                foreignField: "_id",
                as: "shifts",
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
                from: "attendance_summaries",
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {
                          $or: [
                            { attendance_year: { $gt: start_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $gte: start_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $gte: start_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          $or: [
                            { attendance_year: { $lt: end_year.toString() } },
                            {
                              $and: [
                                {
                                  attendance_year: {
                                    $lte: end_year.toString(),
                                  },
                                },
                                {
                                  attendance_month: {
                                    $lte: end_month.toString(),
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
                as: "attendance_summ",
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
                localField:
                  "employee_details.employment_hr_details.designation",
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
                shift_data: {
                  $arrayElemAt: ["$shifts", 0],
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
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
                profile_pic: 1,
                shift: 1,
                client_code: 1,
                "client._id": 1,
                "client.client_code": 1,
                "employee_details.employment_hr_details": 1,
                attendance: 1,
                attendance_summ: 1,
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
              },
            },
          ]);
        }
        return resp
          .status(200)
          .json({ status: "success", employees: myAggregate });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
};
