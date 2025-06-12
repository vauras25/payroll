var User = require("../Model/Admin/User");
const { Validator } = require("node-input-validator");
var Company = require("../Model/Admin/Company");
var Staff = require("../Model/Company/Staff");
var Activity_log = require("../Model/Admin/activity_log");
var FileManager = require("../Model/Company/FileManager");
var EmployeeMonthlyReport = require("../Model/Company/EmployeeMonthlyReport");
var EmployeeAdvance = require("../Model/Company/EmployeeAdvance");
var AttendanceSummary = require("../Model/Company/AttendanceSummary");
var IncentiveModule = require("../Model/Company/IncentiveModule");
const Yearly_holiday = require("../Model/Company/YearlyHolidays");
const Weekly_holiday = require("../Model/Company/WeeklyHolidays");
var Employee = require("../Model/Company/employee");
var EmployeeDetails = require("../Model/Company/employee_details");
var MonthlyEmpLeaveSummary = require("../Model/Company/MonthlyEmpLeaveSummary");
var EmployeeLeaveSummaryLog = require("../Model/Company/EmployeeLeaveSummaryLog");
var LeaveTempHead = require("../Model/Admin/LeaveTempHead");
var Epforule = require("../Model/Admin/Epforule");
var Esicrule = require("../Model/Admin/Esicrule");
var User = require("../Model/Admin/User");
var LwfRule = require('../Model/Admin/LwfRule');
var Ptaxrule = require("../Model/Admin/Ptaxrule");
var LeaveLog = require("../Model/Company/LeaveLog");
var LeaveLedgerl = require("../Model/Company/LeaveLedgerl");
const mongoose = require("mongoose");
var pdf = require("pdf-creator-node");
var PdfPrinter = require('pdfmake');
const cheerio = require('cheerio');
var fs = require("fs");
const { resolve } = require('path');
const absolutePath = resolve('');
let path = require('path');

var db = require("../db");
var mo = require("moment");
const e = require("express");
//var fs = require('fs'),
///request = require('request');
const docx = require("docx");

module.exports = {
  log_history: async function (module_type, pageno) {
    const options = {
      page: pageno,
      limit: perpage,
      sort: { created_at: -1 },
    };
    var myAggregate = await Activity_log.aggregate([
      { $match: { status: "active", module_type: module_type } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          corporate_id: 1,
          message: 1,
          "user.first_name": 1,
          "user.last_name": 1,
        },
      },
    ]);
    var logdata = await Activity_log.aggregatePaginate(myAggregate, options);
    return logdata;
  },

  log_entry: async function (log_data) {
    try {
      const v = new Validator(log_data, {
        corporate_id: "required",
        message: "required",
        module_type: "required",
        status: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return {
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        };
      } else {
        var asdas = await Activity_log.create(log_data);
        return asdas;
      }
    } catch (e) {
      return {
        status: "error",
        message: e ? e.message : "Something went wrong",
      };
    }
  },
  upload_file_manager: async function (file_data) {
    try {
      var ins_file_data = await FileManager.create(file_data);
      await Employee.updateOne(
        { _id: file_data.emp_db_id },
        { $inc: { total_file_size: file_data.file_size } }
      );
      return ins_file_data;
    } catch (e) {
      return {
        status: "error",
        message: e ? e.message : "Something went wrong",
      };
    }
  },
  get_current_user: async function (req) {
    var comp_data = await Company.findOne(
      { corporate_id: req.authData.corporate_id, userid: req.authData.userid },
      "_id email_id package_id plan_id corporate_id userid establishment_name"
    );
    if (!comp_data) {
      var staff_data = await Staff.findOne(
        {
          corporate_id: req.authData.corporate_id,
          userid: req.authData.user_id,
        },
        "_id email_id corporate_id user_type userid first_name last_name"
      );

      return (return_data = {
        _id: staff_data._id,
        corporate_id: staff_data.corporate_id,
        first_name: staff_data.first_name,
        last_name: staff_data.last_name,
      });
    } else {
      //console.log(req.authData,comp_data)
      return (return_data = {
        _id: comp_data._id,
        corporate_id: comp_data.corporate_id,
        first_name: comp_data.establishment_name,
        last_name: "",
      });
    }
  },
  get_admin_data: async function () {
    try {
      const options = {
        page: 1,
        limit: 1,
        sort: { created_at: 1 },
      };
      var myAggregate = [
        { $match: { status: "active", user_type: "super_admin" } },
        {
          $project: {
            _id: 1,
            user_id: 1,
            corporate_id: 1,
          },
        },
      ]
      var admin_data = await User.aggregate(myAggregate);

      if (admin_data && admin_data.length > 0) {
        return admin_data[0].corporate_id; // Return the corporate_id of the first admin
      } else {
        return { status: "error", message: "No super_admin found" };
      }

    } catch (e) {
      return {
        status: "error",
        message: e ? e.message : "Something went wrong",
      };
    }
  },
  download_image: async function (uri, filename) {
    try {
      request.head(uri, function (err, res, body) {
        //console.log('content-type:', res.headers['content-type']);
        //console.log('content-length:', res.headers['content-length']);
        var imagepath = request(uri).pipe(fs.createWriteStream(filename));
        //console.log('filepath:',imagepath);
        return imagepath;
        //request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
      });
    } catch (e) {
      return "error";
    }
  },
  get_gov_epfo_data: async function (req) {
    try {
      var currdate = new Date();
      var epfo_data = await Epforule.findOne(
        {
          corporate_id: req.authData.corporate_id,
          effective_date: { $lte: currdate },
        },
        "-history",
        { sort: { effective_date: -1 } }
      );
      if (epfo_data) {
        return epfo_data;
      } else {
        var admin_corporate_id = await User.findOne(
          { status: "active", user_type: "super_admin" },
          "corporate_id"
        );
        epfo_data = await Epforule.findOne(
          {
            corporate_id: admin_corporate_id.corporate_id,
            effective_date: { $lte: currdate },
          },
          "-history",
          { sort: { effective_date: -1 } }
        );
        return epfo_data;
      }
    } catch (e) {
      return {
        status: "error",
        message: e ? e.message : "Something went wrong",
      };
    }
  },
  get_gov_esic_data: async function (req) {
    try {
      var currdate = new Date();
      var esic_data = await Esicrule.findOne(
        {
          corporate_id: req.authData.corporate_id,
          effective_date: { $lte: currdate },
        },
        "-history",
        { sort: { effective_date: -1 } }
      );
      if (esic_data) {
        return esic_data;
      } else {
        var admin_corporate_id = await User.findOne(
          { status: "active", user_type: "super_admin" },
          "corporate_id"
        );
        esic_data = await Esicrule.findOne(
          {
            corporate_id: admin_corporate_id.corporate_id,
            effective_date: { $lte: currdate },
          },
          "-history",
          { sort: { effective_date: -1 } }
        );
        return esic_data;
      }
    } catch (e) {
      return {
        status: "error",
        message: e ? e.message : "Something went wrong",
      };
    }
  },
  // calculate_attendance_data:async function(
  //   attendance_data,
  //   total_attendance_summ,
  //   leavehead,
  //   emp_attendance_temp,
  //   shift,
  //   shift_data
  // ) {
  //   if (emp_attendance_temp.register_type === "time") {

  //     console.log('aaaaaa',shift,shift_data,total_attendance_summ);

  //     var full_day_max_hours = emp_attendance_temp.full_day_max_hours;
  //     var half_day_max_hours = emp_attendance_temp.half_day_max_hours;
  //     var grace_period = emp_attendance_temp.grace_period;
  //     var reporting_time = emp_attendance_temp.reporting_time;
  //     var closing_time = emp_attendance_temp.closing_time;

  //     var reporting_time_start = new Date();
  //     var reporting_time_end = new Date();
  //     var reporting_start = reporting_time + ":00";
  //     var reporting_start = reporting_start.split(":");
  //     var reporting_end = closing_time + ":00".split(":");
  //     reporting_end = reporting_end.split(":");
  //     reporting_time_start.setHours(
  //       reporting_start[0],
  //       reporting_start[1],
  //       reporting_start[2],
  //       0
  //     );
  //     reporting_time_end.setHours(
  //       reporting_end[0],
  //       reporting_end[1],
  //       reporting_end[2],
  //       0
  //     );
  //     reporting_time_start = reporting_time_start.getTime() / (1000 * 60);
  //     reporting_time_start = reporting_time_start + parseFloat(grace_period);

  //     var attendence_time_start = new Date();
  //     var attendence_time_end = new Date();
  //     var attendence_start = attendance_data.login_time;
  //     var attendence_start = attendence_start.split(":");
  //     var attendence_end = attendance_data.logout_time;
  //     var attendence_end = attendence_end.split(":");
  //     attendence_time_start.setHours(
  //       attendence_start[0],
  //       attendence_start[1],
  //       attendence_start[2],
  //       0
  //     );
  //     attendence_time_end.setHours(
  //       attendence_end[0],
  //       attendence_end[1],
  //       attendence_end[2],
  //       0
  //     );
  //     attendence_time_start = attendence_time_start.getTime();
  //     attendence_time_start = attendence_time_start / (1000 * 60);
  //     attendence_time_end = attendence_time_end.getTime();
  //     attendence_time_end = attendence_time_end / (1000 * 60);

  //     var attendance_val = 0;
  //     var absent_day = 0;
  //     if (attendence_time_start > reporting_time_start) {
  //       var total_logged_in = attendance_data.total_logged_in;
  //       if (total_logged_in >= emp_attendance_temp.half_day_max_hours) {
  //         if (total_logged_in >= emp_attendance_temp.full_day_max_hours) {
  //           attendance_val = 1;
  //         } else {
  //           attendance_val = 0.5;
  //         }
  //         total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //       } else {
  //         total_attendance_summ.total_lop = total_attendance_summ.total_lop + 1;
  //       }
  //     }
  //     switch (attendance_data.attendance_stat) {
  //       case "PDL":
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "P":
  //         total_attendance_summ.total_present =
  //           total_attendance_summ.total_present + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "H":
  //         total_attendance_summ.holiday =
  //           total_attendance_summ.holiday + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "L":
  //         total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "A":
  //         total_attendance_summ.total_absent =
  //           total_attendance_summ.total_absent + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "OT":
  //         total_attendance_summ.total_overtime =
  //           total_attendance_summ.total_overtime + attendance_val;
  //         break;
  //       case "CSL":
  //         total_attendance_summ.total_CSL =
  //           total_attendance_summ.total_CSL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PVL":
  //         total_attendance_summ.total_PVL =
  //           total_attendance_summ.total_PVL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ERL":
  //         total_attendance_summ.total_ERL =
  //           total_attendance_summ.total_ERL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "SKL":
  //         total_attendance_summ.total_SKL =
  //           total_attendance_summ.total_SKL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MDL":
  //         total_attendance_summ.total_MDL =
  //           total_attendance_summ.total_MDL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MTL":
  //         total_attendance_summ.total_MTL =
  //           total_attendance_summ.total_MTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PTL":
  //         total_attendance_summ.total_PTL =
  //           total_attendance_summ.total_PTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ANL":
  //         total_attendance_summ.total_ANL =
  //           total_attendance_summ.total_ANL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "AWP":
  //         total_attendance_summ.total_AWP =
  //           total_attendance_summ.total_AWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "UWP":
  //         total_attendance_summ.total_UWP =
  //           total_attendance_summ.total_UWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "LE1":
  //         total_attendance_summ.total_LE1 =
  //           total_attendance_summ.total_LE1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LE2":
  //         total_attendance_summ.total_LE2 =
  //           total_attendance_summ.total_LE2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP1":
  //         total_attendance_summ.total_LP1 =
  //           total_attendance_summ.total_LP1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP2":
  //         total_attendance_summ.total_LP2 =
  //           total_attendance_summ.total_LP2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "WO":
  //         total_attendance_summ.total_wo =
  //           total_attendance_summ.total_wo + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //     }
  //   } else if (emp_attendance_temp.register_type === "halfday") {
  //     var attendance_val = 0.5;
  //     switch (attendance_data.first_half) {
  //       case "PDL":
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "P":
  //         total_attendance_summ.total_present =
  //           total_attendance_summ.total_present + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "H":
  //         total_attendance_summ.holiday =
  //           total_attendance_summ.holiday + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "L":
  //         total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "A":
  //         total_attendance_summ.total_absent =
  //           total_attendance_summ.total_absent + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "OT":
  //         total_attendance_summ.total_overtime =
  //           total_attendance_summ.total_overtime + attendance_val;
  //         break;
  //       case "CSL":
  //         total_attendance_summ.total_CSL =
  //           total_attendance_summ.total_CSL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PVL":
  //         total_attendance_summ.total_PVL =
  //           total_attendance_summ.total_PVL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ERL":
  //         total_attendance_summ.total_ERL =
  //           total_attendance_summ.total_ERL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "SKL":
  //         total_attendance_summ.total_SKL =
  //           total_attendance_summ.total_SKL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MDL":
  //         total_attendance_summ.total_MDL =
  //           total_attendance_summ.total_MDL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MTL":
  //         total_attendance_summ.total_MTL =
  //           total_attendance_summ.total_MTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PTL":
  //         total_attendance_summ.total_PTL =
  //           total_attendance_summ.total_PTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ANL":
  //         total_attendance_summ.total_ANL =
  //           total_attendance_summ.total_ANL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "AWP":
  //         total_attendance_summ.total_AWP =
  //           total_attendance_summ.total_AWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "UWP":
  //         total_attendance_summ.total_UWP =
  //           total_attendance_summ.total_UWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "LE1":
  //         total_attendance_summ.total_LE1 =
  //           total_attendance_summ.total_LE1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LE2":
  //         total_attendance_summ.total_LE2 =
  //           total_attendance_summ.total_LE2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP1":
  //         total_attendance_summ.total_LP1 =
  //           total_attendance_summ.total_LP1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP2":
  //         total_attendance_summ.total_LP2 =
  //           total_attendance_summ.total_LP2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "WO":
  //         total_attendance_summ.total_wo =
  //           total_attendance_summ.total_wo + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //     }
  //     switch (attendance_data.second_half) {
  //       case "PDL":
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "P":
  //         total_attendance_summ.total_present =
  //           total_attendance_summ.total_present + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "H":
  //         total_attendance_summ.holiday =
  //           total_attendance_summ.holiday + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "L":
  //         total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "A":
  //         total_attendance_summ.total_absent =
  //           total_attendance_summ.total_absent + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "OT":
  //         total_attendance_summ.total_overtime =
  //           total_attendance_summ.total_overtime + attendance_val;
  //         break;
  //       case "CSL":
  //         total_attendance_summ.total_CSL =
  //           total_attendance_summ.total_CSL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PVL":
  //         total_attendance_summ.total_PVL =
  //           total_attendance_summ.total_PVL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ERL":
  //         total_attendance_summ.total_ERL =
  //           total_attendance_summ.total_ERL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "SKL":
  //         total_attendance_summ.total_SKL =
  //           total_attendance_summ.total_SKL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MDL":
  //         total_attendance_summ.total_MDL =
  //           total_attendance_summ.total_MDL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MTL":
  //         total_attendance_summ.total_MTL =
  //           total_attendance_summ.total_MTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PTL":
  //         total_attendance_summ.total_PTL =
  //           total_attendance_summ.total_PTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ANL":
  //         total_attendance_summ.total_ANL =
  //           total_attendance_summ.total_ANL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "AWP":
  //         total_attendance_summ.total_AWP =
  //           total_attendance_summ.total_AWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "UWP":
  //         total_attendance_summ.total_UWP =
  //           total_attendance_summ.total_UWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "LE1":
  //         total_attendance_summ.total_LE1 =
  //           total_attendance_summ.total_LE1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LE2":
  //         total_attendance_summ.total_LE2 =
  //           total_attendance_summ.total_LE2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP1":
  //         total_attendance_summ.total_LP1 =
  //           total_attendance_summ.total_LP1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP2":
  //         total_attendance_summ.total_LP2 =
  //           total_attendance_summ.total_LP2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "WO":
  //         total_attendance_summ.total_wo =
  //           total_attendance_summ.total_wo + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //     }
  //   } else {
  //     var attendance_val = 1;
  //     switch (attendance_data.attendance_stat) {
  //       case "PDL":
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "P":
  //         total_attendance_summ.total_present =
  //           total_attendance_summ.total_present + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "H":
  //         total_attendance_summ.holiday =
  //           total_attendance_summ.holiday + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "L":
  //         total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //         total_attendance_summ.total_attendance =
  //           total_attendance_summ.total_attendance + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "A":
  //         total_attendance_summ.total_absent =
  //           total_attendance_summ.total_absent + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "OT":
  //         total_attendance_summ.total_overtime =
  //           total_attendance_summ.total_overtime + attendance_val;
  //         break;
  //       case "CSL":
  //         total_attendance_summ.total_CSL =
  //           total_attendance_summ.total_CSL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PVL":
  //         total_attendance_summ.total_PVL =
  //           total_attendance_summ.total_PVL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ERL":
  //         total_attendance_summ.total_ERL =
  //           total_attendance_summ.total_ERL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "SKL":
  //         total_attendance_summ.total_SKL =
  //           total_attendance_summ.total_SKL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MDL":
  //         total_attendance_summ.total_MDL =
  //           total_attendance_summ.total_MDL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "MTL":
  //         total_attendance_summ.total_MTL =
  //           total_attendance_summ.total_MTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "PTL":
  //         total_attendance_summ.total_PTL =
  //           total_attendance_summ.total_PTL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "ANL":
  //         total_attendance_summ.total_ANL =
  //           total_attendance_summ.total_ANL + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "AWP":
  //         total_attendance_summ.total_AWP =
  //           total_attendance_summ.total_AWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "UWP":
  //         total_attendance_summ.total_UWP =
  //           total_attendance_summ.total_UWP + attendance_val;
  //         total_attendance_summ.total_lop =
  //           total_attendance_summ.total_lop + attendance_val;
  //         break;
  //       case "LE1":
  //         total_attendance_summ.total_LE1 =
  //           total_attendance_summ.total_LE1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LE2":
  //         total_attendance_summ.total_LE2 =
  //           total_attendance_summ.total_LE2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP1":
  //         total_attendance_summ.total_LP1 =
  //           total_attendance_summ.total_LP1 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "LP2":
  //         total_attendance_summ.total_LP2 =
  //           total_attendance_summ.total_LP2 + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //       case "WO":
  //         total_attendance_summ.total_wo =
  //           total_attendance_summ.total_wo + attendance_val;
  //         total_attendance_summ.paydays =
  //           total_attendance_summ.paydays + attendance_val;
  //         break;
  //     }
  //   }
  //   return total_attendance_summ;
  // },
  calculate_esic: async function (esic_temp, baseamount, gross_salary, isReturnRoundOff = false) {
    //console.log(esic_temp)
    if (parseFloat(esic_temp.wage_ceiling) > gross_salary) {
      var emoloyee_contribution =
        (baseamount * parseFloat(esic_temp.employee_contribution)) / 100;
      var emoloyer_contribution =
        (baseamount * parseFloat(esic_temp.employer_contribution)) / 100;
      var retdata = {
        emoloyee_contribution: parseFloat(emoloyee_contribution.toFixed(2)),
        emoloyer_contribution: parseFloat(emoloyer_contribution.toFixed(2)),
      };
      if (isReturnRoundOff) {
        retdata.emoloyee_contribution = this.roundoff_func_helper(esic_temp.round_off, retdata.emoloyee_contribution);
        retdata.emoloyer_contribution = this.roundoff_func_helper(esic_temp.round_off, retdata.emoloyer_contribution);
      }
    } else {
      var retdata = {
        emoloyee_contribution: 0,
        emoloyer_contribution: 0,
      };
    }
    return retdata;
  },
  calculate_pf: async function (
    epfo_temp,
    baseamount,
    salary_template,
    hr_details,
    isReturnRoundOff = false,
  ) {
    var emoloyee_contribution =
      ((salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling)
        : baseamount) *
        parseFloat(epfo_temp.pf_employee_contribution)) /
      100;
    var total_employer_contribution =
      ((salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling)
        : baseamount) *
        parseFloat(epfo_temp.total_employer_contribution)) /
      100;
    var emoloyer_eps_contribution =
      ((salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling)
        : epfo_temp.pension_employer_contribution_restrict === "yes"
          ? baseamount < parseFloat(epfo_temp.wage_ceiling)
            ? baseamount
            : parseFloat(epfo_temp.wage_ceiling)
          : baseamount) *
        parseFloat(epfo_temp.pension_employer_contribution)) /
      100;
    // var emoloyer_pf_contribution = ((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount) * parseFloat(epfo_temp.pf_employer_contribution)) / 100;
    var emoloyer_pf_contribution = (total_employer_contribution || 0) - (emoloyer_eps_contribution || 0);
    var emoloyer_edlis_contribution =
      ((salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling)
        : epfo_temp.edli_employer_contribution_restrict === "yes"
          ? baseamount < parseFloat(epfo_temp.wage_ceiling)
            ? baseamount
            : parseFloat(epfo_temp.wage_ceiling)
          : baseamount) *
        parseFloat(epfo_temp.edli_employer_contribution)) /
      100;
    var emoloyer_epf_admin_contribution =
      ((salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling)
        : epfo_temp.admin_charges_restrict === "yes"
          ? baseamount < parseFloat(epfo_temp.wage_ceiling)
            ? baseamount
            : parseFloat(epfo_temp.wage_ceiling)
          : baseamount) *
        parseFloat(epfo_temp.admin_charges)) /
      100;
    var emoloyer_edlis_admin_contribution =
      ((salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling)
        : epfo_temp.edli_admin_charges_restrict === "yes"
          ? baseamount < parseFloat(epfo_temp.wage_ceiling)
            ? baseamount
            : parseFloat(epfo_temp.wage_ceiling)
          : baseamount) *
        parseFloat(epfo_temp.edli_admin_charges)) /
      100;
    var retdata = {
      emoloyee_contribution: emoloyee_contribution ? parseFloat(emoloyee_contribution.toFixed(2)) : 0,
      total_employer_contribution: total_employer_contribution ? parseFloat(total_employer_contribution.toFixed(2)) : 0,
      emoloyer_pf_contribution: emoloyer_pf_contribution ? parseFloat(emoloyer_pf_contribution.toFixed(2)) : 0,
      emoloyer_eps_contribution: emoloyer_eps_contribution ? parseFloat(emoloyer_eps_contribution.toFixed(2)) : 0,
      emoloyer_edlis_contribution: emoloyer_edlis_contribution ? parseFloat(emoloyer_edlis_contribution.toFixed(2)) : 0,
      emoloyer_epf_admin_contribution: emoloyer_epf_admin_contribution ? parseFloat(emoloyer_epf_admin_contribution.toFixed(2)) : 0,
      emoloyer_edlis_admin_contribution: emoloyer_edlis_admin_contribution ? parseFloat(emoloyer_edlis_admin_contribution.toFixed(2)) : 0,
    };

    if (isReturnRoundOff) {
      retdata.emoloyee_contribution = this.roundoff_func_helper(epfo_temp.round_off, retdata.emoloyee_contribution);
      retdata.total_employer_contribution = this.roundoff_func_helper(epfo_temp.round_off, retdata.total_employer_contribution);
      retdata.emoloyer_eps_contribution = this.roundoff_func_helper(epfo_temp.round_off, retdata.emoloyer_eps_contribution);
      retdata.emoloyer_edlis_contribution = this.roundoff_func_helper(epfo_temp.round_off, retdata.emoloyer_edlis_contribution);
      retdata.emoloyer_epf_admin_contribution = this.roundoff_func_helper(epfo_temp.round_off, retdata.emoloyer_epf_admin_contribution);
      retdata.emoloyer_edlis_admin_contribution = this.roundoff_func_helper(epfo_temp.round_off, retdata.emoloyer_edlis_admin_contribution);

      retdata.emoloyer_pf_contribution = ((retdata.total_employer_contribution || 0) - (retdata.emoloyer_eps_contribution || 0));
    }

    //   retdata["emoloyer_pf_contribution"] =
    //  ( this.roundoff_func_helper(epfo_temp.round_off, retdata.total_employer_contribution) -
    //   this.roundoff_func_helper(epfo_temp.round_off, retdata.emoloyer_eps_contribution))
    var restricted_pf_wages = salary_template.restricted_pf === "yes" ? baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling.toFixed(2)) : baseamount;
    retdata.eps_wages =
      salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling.toFixed(2))
        : epfo_temp.pension_employer_contribution_restrict === "yes"
          ? baseamount < parseFloat(epfo_temp.wage_ceiling)
            ? baseamount
            : parseFloat(epfo_temp.wage_ceiling.toFixed(2))
          : baseamount;
    retdata.edlis_wages =
      salary_template.restricted_pf === "yes"
        ? baseamount < parseFloat(epfo_temp.wage_ceiling)
          ? baseamount
          : parseFloat(epfo_temp.wage_ceiling.toFixed(2))
        : epfo_temp.edli_employer_contribution_restrict === "yes"
          ? baseamount < parseFloat(epfo_temp.wage_ceiling)
            ? baseamount
            : parseFloat(epfo_temp.wage_ceiling.toFixed(2))
          : baseamount;
    var total_pf_wages = baseamount;
    retdata.total_pf_wages = total_pf_wages ? parseFloat(total_pf_wages.toFixed(2)) : 0;
    retdata.restricted_pf_wages = restricted_pf_wages ? parseFloat(restricted_pf_wages.toFixed(2)) : 0;
    // if(hr_details.pf_applicable === "no")
    // {
    //   retdata.emoloyee_contribution=0;
    //   retdata.restricted_pf_wages=restricted_pf_wages;
    //   retdata.total_pf_wages=total_pf_wages;
    //   retdata.total_employer_contribution=0;
    //   retdata.emoloyer_pf_contribution=0;
    //   retdata.emoloyer_eps_contribution=0;
    //   retdata.emoloyer_edlis_contribution=0;
    //   retdata.emoloyer_epf_admin_contribution=0;
    //   retdata.emoloyer_edlis_admin_contribution=0;
    // }
    // if(hr_details.pension_applicable === "no")
    // {
    //   retdata.emoloyer_pf_contribution= (retdata.emoloyer_pf_contribution + retdata.emoloyer_eps_contribution);
    //   retdata.emoloyer_eps_contribution=0;
    // }

    return retdata;
  },
  calculate_pt: async function (req, currdate, emp_state, total_pt_wages = 0, templateId) {
    // console.log( currdate, emp_state,total_pt_wages, templateId);
    if (templateId) {
      var pt_temp_rate = await Ptaxrule.find(
        {
          _id: templateId,
          corporate_id: req.authData.corporate_id,
          effective_from: { $lte: currdate },
          status: "active",
          $or: [
            {
              $and: [
                { "tax_range_amount.last_slab": "no" },
                { "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) } },
                { "tax_range_amount.amount_to": { $gte: parseFloat(total_pt_wages) } },
              ]
            },
            {
              $and: [
                { "tax_range_amount.last_slab": "yes" },
                { "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) } },
                // {"tax_range_amount.amount_to": { $gte: parseFloat(total_pt_wages) }},
              ]
            },
            // Case for `periods`
            {
              periods: {
                $elemMatch: {
                  "tax_range_amount.last_slab": "no",
                  "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) },
                  "tax_range_amount.amount_to": { $gte: parseFloat(total_pt_wages) },
                },
              },
            },
            {
              periods: {
                $elemMatch: {
                  "tax_range_amount.last_slab": "yes",
                  "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) },
                },
              },
            },
          ]
        },
        "-history",
        { sort: { effective_from: -1 } }
      );
    } else if (emp_state) {
      var pt_temp_rate = await Ptaxrule.find(
        {
          corporate_id: req.authData.corporate_id,
          effective_from: { $lte: currdate },
          state_name: emp_state,
          status: "active",
          $or: [
            {
              $and: [
                { "tax_range_amount.last_slab": "no" },
                { "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) } },
                { "tax_range_amount.amount_to": { $gte: parseFloat(total_pt_wages) } },
              ]
            },
            {
              $and: [
                { "tax_range_amount.last_slab": "yes" },
                { "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) } },
                // {"tax_range_amount.amount_to": { $gte: parseFloat(total_pt_wages) }},
              ]
            },
            // Case for `periods`
            {
              periods: {
                $elemMatch: {
                  "tax_range_amount.last_slab": "no",
                  "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) },
                  "tax_range_amount.amount_to": { $gte: parseFloat(total_pt_wages) },
                },
              },
            },
            {
              periods: {
                $elemMatch: {
                  "tax_range_amount.last_slab": "yes",
                  "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) },
                },
              },
            },
          ]
        },
        "-history",
        { sort: { effective_from: -1 } }
      );
    }
    // pt_temp_rate = await pt_temp_rate;
    // console.log(pt_temp_rate, "pt temp")

    pt_temp_rate = pt_temp_rate[0] ?? null;
    // console.log(pt_temp_rate, "pt temp rate");
    // console.log(pt_temp_rate.settlement_frequency, "settlement fre")

    var p_tax_amount = 0;
    if (pt_temp_rate) {
      if (pt_temp_rate.settlement_frequency == 'monthly') {
        const wageMonthIndex = req.body.attendance_month || new Date().getMonth();

        // Find the relevant period based on wage_month index
        const relevantPeriod = pt_temp_rate.periods.find((period) => {
          return wageMonthIndex >= parseInt(period.from_month) && wageMonthIndex <= parseInt(period.to_month);
        });
        // console.log(relevantPeriod, "relevant period")
        if (relevantPeriod) {
          // Access tax_range_amount array within the relevant period
          const ptax_arr_rate = relevantPeriod.tax_range_amount ?? [];
          ptax_arr_rate.forEach((ptax_arr_exp_rate) => {
            if (ptax_arr_exp_rate.last_slab === 'yes') {
              if (ptax_arr_exp_rate.amount_from <= total_pt_wages) {
                p_tax_amount = ptax_arr_exp_rate.tax_amount;
              }
            } else if (ptax_arr_exp_rate.last_slab === 'no') {
              if (
                ptax_arr_exp_rate.amount_from <= total_pt_wages &&
                ptax_arr_exp_rate.amount_to >= total_pt_wages
              ) {
                p_tax_amount = ptax_arr_exp_rate.tax_amount;
              }
            }
          });
        }

      } else {

        var ptax_arr_rate = pt_temp_rate.tax_range_amount ?? [];
        var tax_amount = await Promise.all(
          ptax_arr_rate.map(async (ptax_arr_exp_rate) => {
            if (ptax_arr_exp_rate.last_slab === 'yes') {
              if (
                ptax_arr_exp_rate.amount_from <= total_pt_wages
              ) {
                p_tax_amount = ptax_arr_exp_rate.tax_amount;
              }
            } else if (ptax_arr_exp_rate.last_slab === 'no') {
              if (
                ptax_arr_exp_rate.amount_from <= total_pt_wages &&
                ptax_arr_exp_rate.amount_to >= total_pt_wages
              ) {
                p_tax_amount = ptax_arr_exp_rate.tax_amount;
              }
            }
          })
        );
      }
    }
    return parseFloat(p_tax_amount.toFixed(2)) ?? 0;
  },
  roundoff_func_helper: function (round_rule, org_value, aaaaaa) {
    //console.log('function',round_rule, org_value,aaaaaa)
    var format_value;
    switch (round_rule) {
      case "up":
        format_value = Math.ceil(org_value);
        break;
      case "off":
        format_value = Math.round(org_value);
        break;
      case "down":
        format_value = Math.floor(org_value);
    }
    return format_value;
  },
  get_salary_breakup: async function (
    req,
    salary_temp_data,
    baseAmount = 0,
    employee_details,
    paydays = 30,
    monthdays = 30,
    calculate_advance = '',
    emp_id = '',
    corporate_id = '',
    advance_amount = 0
  ) {
    var currdate = new Date();
    // var emp_state = employee_details.emp_address
    //   ? employee_details.emp_address.state
    //   : "";
    var emp_state = employee_details?.template_data?.ptax_temp_data?.state_name || ''
    var hr_details = employee_details.employment_hr_details;
    var esic_temp = await this.get_gov_esic_data(req);
    var epfo_temp = await this.get_gov_epfo_data(req);
    var earnings = salary_temp_data.earnings;
    earnings.sort((a, b) => {
      if (a.priority < b.priority) return -1;
      return a.priority > b.priority ? 1 : 0;
    });
    var salary_template = salary_temp_data;
    var gross_salary = parseFloat(baseAmount);
    var perday_salary = gross_salary / monthdays;
    var earned_salary = perday_salary * paydays;
    var advance_recovered = 0;
    if (advance_amount > 0) {
      var advance_recovered = advance_amount;
      var earned_salary = (earned_salary - advance_amount);
      earned_salary = (earned_salary > 0 ? earned_salary : 0);
    }
    if (calculate_advance) {
      var wage_month = req.body.attendance_month;
      var wage_year = req.body.attendance_year;
      var advance_recovery_data = await this.get_advance_recovery_data(emp_id, corporate_id, wage_month, wage_year, earned_salary, 'gross_earning');
      earned_salary = advance_recovery_data.available_module_amount;
      advance_recovered = advance_recovery_data.advance_recovered;
    }
    var minimum_wage_amount = salary_temp_data.minimum_wage_amount;
    var retddata = [];
    var head_earning = 0;
    var p_tax_amount = 0;
    var basic = 0;
    var gross_earning = 0;
    var gross_deduct = 0;
    var consumed_salary_amount = 0;
    var net_take_home = 0;
    var voluntary_pf_amount = 0;
    var total_pf_wages = 0;
    var restrict_pf_wages = 0;
    var total_esi_wages = 0;
    var total_pt_wages = 0;
    var total_tds_wages = 0;
    var total_ot_wages = 0;
    var total_bonus_wages = 0;
    var total_gratuity_wages = 0;
    var bonus_return_val = "BMNC";
    var ptax_template = employee_details?.template_data?.ptax_temp_data;
    / --------- Calculate Head Data --------- /

    await Promise.all(
      earnings.map(async (earning, keyval) => {
        var earning2 = 0;

        if (earning.dependent_head) {
          // var filterObj = earnings.filter(function (filter_earning) {
          //   return filter_earning.head_id == earning.dependent_head;
          // });
          var dependant_headvalue = retddata.find(function (retddata_val) {
            return retddata_val.head_id == earning.dependent_head;
          });

          head_earning = parseFloat(
            (dependant_headvalue?.head_rate * earning.percentage_amount) / 100
          );

          var rate_type = "percent";
          var rate = earning.percentage_amount;
          //console.log('dependent_head')
        } else {
          /* --------   checking the earning type  --------------*/
          if (earning.pre_def_head === "yes") {
            if (salary_template.advance === "yes") {
              var percentage_amount = (gross_salary * parseFloat(salary_template.minimum_wage_percentage || 0)) / 100;
              //console.log('advance'+percentage_amount)
              if (salary_template.wage_applicable === "higher") {
                head_earning = parseFloat(
                  percentage_amount > minimum_wage_amount
                    ? percentage_amount
                    : minimum_wage_amount
                );
                var rate_type = "amount"
                var rate = head_earning;
              } else {
                head_earning = parseFloat(
                  percentage_amount < minimum_wage_amount
                    ? percentage_amount
                    : minimum_wage_amount
                );
                var rate_type = "amount"
                var rate = head_earning;
              }
            }
            else {
              if (earning.earning_type === "percent") {
                head_earning = parseFloat(
                  (gross_salary * earning.earning_value || 0) / 100
                );
              } else {
                head_earning = parseFloat(earning.earning_value || 0);
              }
              var rate_type = earning.earning_type;
              var rate = earning.earning_value || 0;
            }
          }
          else {
            if (earning.earning_type === "percent") {
              head_earning = parseFloat(
                (gross_salary * parseFloat(earning.earning_value) || 0) / 100
              );
            } else {
              head_earning = parseFloat(parseFloat(earning.earning_value) || 0);
            }
            var rate_type = earning.earning_type;
            var rate = parseFloat(earning.earning_value) || 0;
          }



        }



        /* --------   checking max allowance amount  --------------*/
        if (earning.pre_def_head === "yes") {
          if (salary_template.advance === "yes") {
            head_earning = head_earning > gross_salary ? gross_salary : head_earning;
          }
          else {
            if (earning.earning_type === "amount") {
              //console.log('amount')
              head_earning =
                head_earning > earning.earning_value
                  ? earning.earning_value
                  : head_earning;
            } else if (earning.earning_type === "percent") {
              //console.log('percent')
              var head_max_amount = (gross_salary * earning.earning_value || 0) / 100;
              head_earning =
                head_earning > head_max_amount ? head_max_amount : head_earning;
            }
          }
        }
        else {
          if (earning.earning_type === "amount") {
            //console.log('amount')
            head_earning =
              head_earning > earning.earning_value
                ? earning.earning_value
                : head_earning;
          } else if (earning.earning_type === "percent") {
            //console.log('percent')
            var head_max_amount = (gross_salary * earning.earning_value || 0) / 100;
            head_earning =
              head_earning > head_max_amount ? head_max_amount : head_earning;
          }
        }

        /* --------   checking Attendance Relation and calculating head earning  --------------*/
        if (earning.attendance_relation == 'dependent') {
          const per_day_head_salary = head_earning / monthdays;
          head_earning = per_day_head_salary * paydays;
        }

        // earned_salary -= head_earning; 

        /* --------   check allowance id exceeding the total salary or not  --------------*/
        var curr_gross_earning = consumed_salary_amount + parseFloat(head_earning);

        if (curr_gross_earning > earned_salary) {
          head_earning = earned_salary - consumed_salary_amount;
        }
        if (earning.type == 'earning') {
          gross_earning = gross_earning + parseFloat(head_earning);
        }
        if (earning.type == 'deduction') {
          gross_deduct = gross_deduct + parseFloat(head_earning);
        }

        consumed_salary_amount += head_earning

        // consumed_salary_amount += parseFloat(head_earning);
        // if (consumed_salary_amount > earned_salary) {
        //   head_earning -=  (consumed_salary_amount - earned_salary)  ;
        // }

        // if(earning.type == 'earning'){
        //   gross_earning = gross_earning + parseFloat(head_earning);
        // }
        // if(earning.type == 'deduction'){
        //   gross_deduct = gross_deduct + parseFloat(head_earning);
        // }
        //console.log(gross_earning,head_earning)
        /* --------  check the heads and calculate the earning wage  --------------*/
        var head_inc = earning.head_include_in;
        if (head_inc.indexOf("PF") !== -1) {
          total_pf_wages = total_pf_wages + parseFloat(head_earning);
        }

        if (head_inc.indexOf("ESI") !== -1) {
          total_esi_wages = total_esi_wages + parseFloat(head_earning);
        }
        if (head_inc.indexOf("PT") !== -1) {
          //console.log('~', parseFloat(head_earning),'~');
          total_pt_wages = total_pt_wages + parseFloat(head_earning);
        }
        if (head_inc.indexOf("TDS") !== -1) {
          total_tds_wages = total_tds_wages + parseFloat(head_earning);
        }
        if (head_inc.indexOf("OT") !== -1) {
          total_ot_wages = total_ot_wages + parseFloat(head_earning);
        }
        if (head_inc.indexOf("Bonus") !== -1) {
          total_bonus_wages = total_bonus_wages + parseFloat(head_earning);
        }
        if (head_inc.indexOf("Gratuity") !== -1) {
          total_gratuity_wages =
            total_gratuity_wages + parseFloat(head_earning);
        }

        /* --------  check the heads and calculate the earning wage  --------------*/

        /* ------   if earning is greater then 0 then add the earning head  --------------------*/
        //console.log('earning',earning);
        if (head_earning > 0) {
          var head_earning_amount = this.roundoff_func_helper(
            epfo_temp.round_off,
            head_earning,
            earning.head_full_name
          );
          // console.log(head_earning_amount);
          retddata.push({
            head_id: earning.head_id,
            head_title: earning.head_full_name,
            head_type: earning.type,
            head_abbreviation: earning.head_abbreviation,
            head_rate_type: rate_type,
            head_rate: rate,
            amount: head_earning_amount,
          });

          // earned_salary = earned_salary - head_earning
        }
      })
    );
    / --------- End Calculate Head Data --------- /

    var pf_return_val = await this.calculate_pf(
      await epfo_temp,
      total_pf_wages || 0,
      salary_template,
      hr_details
    );
    // console.log(pf_return_val, "pf return val");

    var esic_return_val = await this.calculate_esic(
      await esic_temp,
      total_esi_wages || 0,
      gross_salary
    );
    var pt_return_val = await this.calculate_pt(
      req,
      currdate,
      emp_state || req.body.state,
      total_pt_wages || 0,
      ptax_template?._id ?? null
    )
    var total_employeer_pf_contribution =
      pf_return_val.emoloyer_pf_contribution +
      pf_return_val.emoloyer_eps_contribution +
      pf_return_val.emoloyer_edlis_contribution +
      pf_return_val.emoloyer_epf_admin_contribution +
      pf_return_val.emoloyer_edlis_admin_contribution;
    var total_employee_pf_contribution = pf_return_val.emoloyee_contribution;
    var total_employeer_esic_contribution = esic_return_val.emoloyer_contribution;
    var total_employee_esic_contribution = esic_return_val.emoloyee_contribution;
    var p_tax_amount = pt_return_val;
    var gross_deduct = (total_employee_pf_contribution + total_employee_esic_contribution + gross_deduct + +pt_return_val)
    var net_take_home = consumed_salary_amount - gross_deduct;

    / ----- Calculate Voluntry PF Data ------- /
    var voluntary_pf = parseFloat(salary_template.voluntary_pf);
    if (voluntary_pf > 0) {
      voluntary_pf_amount = ((total_pf_wages * voluntary_pf) / 100);
      gross_deduct = (gross_deduct + voluntary_pf_amount);
      net_take_home = (net_take_home - voluntary_pf_amount);
    }

    var ctc = gross_earning + total_employeer_pf_contribution + total_employeer_esic_contribution;
    var restrict_pf_wages = salary_template.restricted_pf === "yes" ? total_pf_wages < parseFloat(epfo_temp.wage_ceiling) ? total_pf_wages : parseFloat(epfo_temp.wage_ceiling) : total_pf_wages;

    var restrict_esic_wages = parseFloat(esic_temp.wage_ceiling) > gross_salary ? total_esi_wages : 0;


    // =======================================================================================================//
    var breakupdata = {
      heads: retddata,
      epf_data: {
        emoloyee_contribution: await this.roundoff_func_helper(
          epfo_temp.round_off,
          pf_return_val.emoloyee_contribution
        ),
        total_employer_contribution: await this.roundoff_func_helper(
          epfo_temp.round_off,
          pf_return_val.total_employer_contribution
        ),
        // emoloyer_pf_contribution: await this.roundoff_func_helper(
        //   epfo_temp.round_off,
        //   pf_return_val.emoloyer_pf_contribution
        // ),
        emoloyer_pf_contribution: 0,
        emoloyer_eps_contribution: await this.roundoff_func_helper(
          epfo_temp.round_off,
          pf_return_val.emoloyer_eps_contribution
        ),
        emoloyer_edlis_contribution: await this.roundoff_func_helper(
          epfo_temp.round_off,
          pf_return_val.emoloyer_edlis_contribution
        ),
        emoloyer_epf_admin_contribution: await this.roundoff_func_helper(
          epfo_temp.round_off,
          pf_return_val.emoloyer_epf_admin_contribution
        ),
        emoloyer_edlis_admin_contribution: await this.roundoff_func_helper(
          epfo_temp.round_off,
          pf_return_val.emoloyer_edlis_admin_contribution
        ),
      },
      p_tax_amount: await this.roundoff_func_helper(epfo_temp.round_off, p_tax_amount),
      esic_data: {
        emoloyee_contribution: await this.roundoff_func_helper(
          esic_temp.round_off,
          esic_return_val.emoloyee_contribution
        ),
        emoloyer_contribution: await this.roundoff_func_helper(
          esic_temp.round_off,
          esic_return_val.emoloyer_contribution
        ),
      },
      ctc: await this.roundoff_func_helper(epfo_temp.round_off, ctc),
      total_employee_pf_contribution: await this.roundoff_func_helper(
        epfo_temp.round_off,
        total_employee_pf_contribution
      ),
      total_employeer_pf_contribution: await this.roundoff_func_helper(
        esic_temp.round_off,
        total_employeer_pf_contribution
      ),
      total_employee_esic_contribution: await this.roundoff_func_helper(
        epfo_temp.round_off,
        total_employee_esic_contribution
      ),
      total_employeer_esic_contribution: await this.roundoff_func_helper(
        esic_temp.round_off,
        total_employeer_esic_contribution
      ),
      total_pf_wages: total_pf_wages,
      eps_wages: pf_return_val.eps_wages,
      edlis_wages: pf_return_val.edlis_wages,
      restrict_pf_wages: restrict_pf_wages,
      restricted_pf: salary_template.restricted_pf,
      template_wage_ceiling: parseFloat(epfo_temp.wage_ceiling),
      total_esi_wages: total_esi_wages,
      restrict_esic_wages: restrict_esic_wages,
      total_pt_wages: total_pt_wages,
      total_tds_wages: total_tds_wages,
      total_ot_wages: total_ot_wages,
      total_gratuity_wages: total_gratuity_wages,
      total_bonus_wages: total_bonus_wages,
      net_take_home: await this.roundoff_func_helper(
        epfo_temp.round_off,
        net_take_home
      ),
      gross_earning: await this.roundoff_func_helper(
        epfo_temp.round_off,
        gross_earning
      ),
      gross_deduct: await this.roundoff_func_helper(
        epfo_temp.round_off,
        gross_deduct
      ),
      voluntary_pf_amount: await this.roundoff_func_helper(
        epfo_temp.round_off,
        voluntary_pf_amount
      ),
      advance_recovered: await this.roundoff_func_helper(
        epfo_temp.round_off,
        advance_recovered
      ),
    };

    breakupdata.epf_data.emoloyer_pf_contribution = breakupdata.epf_data.total_employer_contribution - breakupdata.epf_data.emoloyer_eps_contribution
    return breakupdata;
  },
  // get_salary_breakup: async function (
  //   req,
  //   salary_temp_data,
  //   baseAmount = 0,
  //   employee_details,
  //   paydays = 30,
  //   monthdays = 30,
  //   calculate_advance='',
  //   emp_id = '',
  //   corporate_id='',
  //   advance_amount=0
  // ) {
  //   var currdate = new Date();
  //   var emp_state = employee_details.emp_address
  //     ? employee_details.emp_address.state
  //     : "";
  //   var hr_details = employee_details.employment_hr_details;
  //   var esic_temp = await this.get_gov_esic_data(req);
  //   var epfo_temp = await this.get_gov_epfo_data(req);
  //   var earnings = salary_temp_data.earnings;
  //   earnings.sort((a, b) => {
  //     if (a.priority < b.priority) return -1;
  //     return a.priority > b.priority ? 1 : 0;
  //   });
  //   var salary_template = salary_temp_data;
  //   var gross_salary = parseFloat(baseAmount);
  //   var perday_salary = gross_salary / monthdays;
  //   var earned_salary = perday_salary * paydays;
  //   var advance_recovered =0;
  //   if(advance_amount > 0)
  //   {
  //     var advance_recovered = advance_amount;
  //     var earned_salary = (earned_salary - advance_amount );
  //     earned_salary = (earned_salary > 0 ? earned_salary : 0);
  //   }
  //   if(calculate_advance)
  //   {
  //     var wage_month = req.body.attendance_month;
  //     var wage_year = req.body.attendance_year;  
  //     var advance_recovery_data=await this.get_advance_recovery_data(emp_id,corporate_id,wage_month,wage_year,earned_salary,'gross_earning');
  //     earned_salary = advance_recovery_data.available_module_amount;
  //     advance_recovered = advance_recovery_data.advance_recovered;
  //   }   
  //   var minimum_wage_amount = salary_temp_data.minimum_wage_amount;
  //   var retddata = [];
  //   var head_earning = 0;
  //   var p_tax_amount = 0;
  //   var basic = 0;
  //   var gross_earning = 0;
  //   var gross_deduct = 0;
  //   var net_take_home = 0;
  //   var voluntary_pf_amount = 0;
  //   var total_pf_wages = 0;
  //   var restrict_pf_wages = 0;
  //   var total_esi_wages = 0;
  //   var total_pt_wages = 0;
  //   var total_tds_wages = 0;
  //   var total_ot_wages = 0;
  //   var total_bonus_wages = 0;
  //   var total_gratuity_wages = 0;
  //   var bonus_return_val = "BMNC";
  //   /* --------- Calculate Head Data --------- */

  //   await Promise.all(
  //     earnings.map(async (earning, keyval) => {
  //       var earning2 = 0;
  //       if (salary_template.advance === "yes") {
  //         var percentage_amount =
  //           (earned_salary * salary_template.minimum_wage_percentage) / 100;

  //         //console.log('advance'+percentage_amount)
  //         if (salary_template.wage_applicable === "higher") {
  //           earned_salary = parseFloat(
  //             percentage_amount > minimum_wage_amount
  //               ? percentage_amount
  //               : minimum_wage_amount
  //           );
  //           var rate_type =
  //             percentage_amount > minimum_wage_amount ? "percent" : "amount";

  //           earned_salary_rate = parseFloat(
  //             percentage_amount > minimum_wage_amount
  //               ? percentage_amount
  //               : minimum_wage_amount
  //           );
  //           var rate_type_rate =
  //             percentage_amount > minimum_wage_amount
  //               ? "percent"
  //               : "amount";
  //         } else {
  //           earned_salary = parseFloat(
  //             percentage_amount < minimum_wage_amount
  //               ? percentage_amount
  //               : minimum_wage_amount
  //           );
  //           var rate_type =
  //             percentage_amount < minimum_wage_amount ? "percent" : "amount";

  //           earned_salary_rate = parseFloat(
  //             percentage_amount < minimum_wage_amount
  //               ? percentage_amount
  //               : minimum_wage_amount
  //           );
  //           var rate_type_rate =
  //             percentage_amount < minimum_wage_amount
  //               ? "percent"
  //               : "amount";
  //         }
  //         var rate =
  //           rate_type === "percent"
  //             ? salary_template.minimum_wage_percentage
  //             : minimum_wage_amount;
  //         var rate_rate =
  //           rate_type_rate === "percent"
  //             ? salary_template.minimum_wage_percentage
  //             : minimum_wage_amount;
  //       }
  //       //console.log('non-advance'+earned_salary)
  //       /* --------   checking the earning type  --------------*/
  //       if (earning.dependent_head) {
  //         var filterObj = earnings.filter(function (filter_earning) {
  //           return filter_earning.head_id == earning.dependent_head;
  //         });
  //         var dependant_headvalue = retddata.filter(function (retddata_val) {
  //           return retddata_val.head_id == earning.dependent_head;
  //         });

  //         head_earning = parseFloat(
  //           ((dependant_headvalue[0]?.amount ?? 0) * earning.percentage_amount) / 100
  //         );

  //         var rate_type = "percent";
  //         var rate = earning.percentage_amount;
  //         //console.log('dependent_head')
  //       } else {
  //         /* --------   checking the earning type  --------------*/
  //         if (earning.earning_type === "percent") {
  //           head_earning = parseFloat(
  //             (earned_salary * earning.earning_value) / 100
  //           );
  //         } else {
  //           head_earning = parseFloat(earning.earning_value);
  //         }

  //         var rate_type = earning.earning_type;
  //         var rate = earning.earning_value;
  //       }
  //       /* --------   checking max allowance amount  --------------*/
  //       if (earning.earning_type === "amount") {
  //         //console.log('amount')
  //         head_earning =
  //           head_earning > earning.earning_value
  //             ? earning.earning_value
  //             : head_earning;
  //       } else if (earning.earning_type === "percent") {
  //         //console.log('percent')
  //         var head_max_amount = (earned_salary * earning.earning_value) / 100;
  //         head_earning =
  //           head_earning > head_max_amount ? head_max_amount : head_earning;
  //       }

  //       /* --------   check allowance id exceeding the total salary or not  --------------*/
  //       var curr_gross_earning = gross_earning + parseFloat(head_earning);
  //       if (curr_gross_earning > earned_salary) {
  //         head_earning = earned_salary - gross_earning;
  //       }
  //       gross_earning = gross_earning + parseFloat(head_earning);
  //       //console.log(gross_earning,head_earning)
  //       /* --------  check the heads and calculate the earning wage  --------------*/
  //       var head_inc = earning.head_include_in;
  //       if (head_inc.indexOf("PF") !== -1) {
  //         total_pf_wages = total_pf_wages + parseFloat(head_earning);
  //       }
  //       if (head_inc.indexOf("ESI") !== -1) {
  //         total_esi_wages = total_esi_wages + parseFloat(head_earning);
  //       }
  //       if (head_inc.indexOf("PT") !== -1) {
  //         //console.log('~', parseFloat(head_earning),'~');
  //         total_pt_wages = total_pt_wages + parseFloat(head_earning);
  //       }
  //       if (head_inc.indexOf("TDS") !== -1) {
  //         total_tds_wages = total_tds_wages + parseFloat(head_earning);
  //       }
  //       if (head_inc.indexOf("OT") !== -1) {
  //         total_ot_wages = total_ot_wages + parseFloat(head_earning);
  //       }
  //       if (head_inc.indexOf("Bonus") !== -1) {
  //         total_bonus_wages = total_bonus_wages + parseFloat(head_earning);
  //       }
  //       if (head_inc.indexOf("Gratuity") !== -1) {
  //         total_gratuity_wages =
  //           total_gratuity_wages + parseFloat(head_earning);
  //       }

  //       /* --------  check the heads and calculate the earning wage  --------------*/

  //       /* ------   if earning is greater then 0 then add the earning head  --------------------*/
  //       //console.log('earning',earning);
  //       if (head_earning > 0) {
  //         var head_earning_amount = await this.roundoff_func_helper(
  //           epfo_temp.round_off,
  //           head_earning,
  //           earning.head_full_name
  //         );
  //         retddata.push({
  //           head_id: earning.head_id,
  //           head_title: earning.head_full_name,
  //           head_type: earning.type,
  //           head_abbreviation: earning.head_abbreviation,
  //           head_rate_type: rate_type,
  //           head_rate: rate,
  //           amount: head_earning_amount,
  //         });
  //       }
  //     })
  //   );
  //   /* --------- End Calculate Head Data --------- */

  //   var pf_return_val = await this.calculate_pf(
  //     await epfo_temp,
  //     total_pf_wages,
  //     salary_template,
  //     hr_details
  //   );
  //   var esic_return_val = await this.calculate_esic(
  //     await esic_temp,
  //     total_esi_wages,
  //     gross_salary
  //   );
  //   var total_employeer_pf_contribution =
  //     pf_return_val.emoloyer_pf_contribution +
  //     pf_return_val.emoloyer_eps_contribution +
  //     pf_return_val.emoloyer_edlis_contribution +
  //     pf_return_val.emoloyer_epf_admin_contribution +
  //     pf_return_val.emoloyer_edlis_admin_contribution;
  //   var total_employee_pf_contribution = pf_return_val.emoloyee_contribution;
  //   var total_employeer_esic_contribution = esic_return_val.emoloyer_contribution;
  //   var total_employee_esic_contribution = esic_return_val.emoloyee_contribution;
  //   var gross_deduct = (total_employee_pf_contribution + total_employee_esic_contribution)
  //   var net_take_home = gross_earning - gross_deduct;

  //   /* ----- Calculate Voluntry PF Data ------- */
  //     var voluntary_pf = parseFloat(salary_template.voluntary_pf);
  //     if (voluntary_pf > 0) {
  //       voluntary_pf_amount = ((net_take_home * voluntary_pf) / 100);
  //       gross_deduct = (gross_deduct + voluntary_pf_amount);
  //       net_take_home = (net_take_home - voluntary_pf_amount);
  //     }

  //   var ctc =  gross_earning + total_employeer_pf_contribution + total_employeer_esic_contribution;
  //   var restrict_pf_wages = salary_template.restricted_pf === "yes" ? total_pf_wages < parseFloat(epfo_temp.wage_ceiling) ? total_pf_wages : parseFloat(epfo_temp.wage_ceiling) : total_pf_wages;

  //   var restrict_esic_wages = parseFloat(esic_temp.wage_ceiling) > gross_salary ? total_esi_wages : 0;


  //   // =======================================================================================================//
  //   var breakupdata = {
  //     heads: retddata,
  //     epf_data: {
  //       emoloyee_contribution: await this.roundoff_func_helper(
  //         epfo_temp.round_off,
  //         pf_return_val.emoloyee_contribution
  //       ),
  //       total_employer_contribution: await this.roundoff_func_helper(
  //         epfo_temp.round_off,
  //         pf_return_val.total_employer_contribution
  //       ),
  //       emoloyer_pf_contribution: await this.roundoff_func_helper(
  //         epfo_temp.round_off,
  //         pf_return_val.emoloyer_pf_contribution
  //       ),
  //       emoloyer_eps_contribution: await this.roundoff_func_helper(
  //         epfo_temp.round_off,
  //         pf_return_val.emoloyer_eps_contribution
  //       ),
  //       emoloyer_edlis_contribution: await this.roundoff_func_helper(
  //         epfo_temp.round_off,
  //         pf_return_val.emoloyer_edlis_contribution
  //       ),
  //       emoloyer_epf_admin_contribution: await this.roundoff_func_helper(
  //         epfo_temp.round_off,
  //         pf_return_val.emoloyer_epf_admin_contribution
  //       ),
  //       emoloyer_edlis_admin_contribution: await this.roundoff_func_helper(
  //         epfo_temp.round_off,
  //         pf_return_val.emoloyer_edlis_admin_contribution
  //       ),
  //     },
  //     //p_tax_amount: await this.roundoff_func_helper( epfo_temp.round_off, p_tax_amount),
  //     esic_data: {
  //       emoloyee_contribution: await this.roundoff_func_helper(
  //         esic_temp.round_off,
  //         esic_return_val.emoloyee_contribution
  //       ),
  //       emoloyer_contribution: await this.roundoff_func_helper(
  //         esic_temp.round_off,
  //         esic_return_val.emoloyer_contribution
  //       ),
  //     },
  //     ctc: await this.roundoff_func_helper(epfo_temp.round_off, ctc),
  //     total_employee_pf_contribution: await this.roundoff_func_helper(
  //       epfo_temp.round_off,
  //       total_employee_pf_contribution
  //     ),
  //     total_employeer_pf_contribution: await this.roundoff_func_helper(
  //       esic_temp.round_off,
  //       total_employeer_pf_contribution
  //     ),
  //     total_employee_esic_contribution: await this.roundoff_func_helper(
  //       epfo_temp.round_off,
  //       total_employee_esic_contribution
  //     ),
  //     total_employeer_esic_contribution: await this.roundoff_func_helper(
  //       esic_temp.round_off,
  //       total_employeer_esic_contribution
  //     ),
  //     total_pf_wages: total_pf_wages,
  //     restrict_pf_wages: restrict_pf_wages,
  //     restricted_pf: salary_template.restricted_pf,
  //     template_wage_ceiling: parseFloat(epfo_temp.wage_ceiling),
  //     total_esi_wages: total_esi_wages,
  //     restrict_esic_wages: restrict_esic_wages,
  //     total_pt_wages: total_pt_wages,
  //     total_tds_wages: total_tds_wages,
  //     total_ot_wages: total_ot_wages,
  //     total_gratuity_wages: total_gratuity_wages,
  //     total_bonus_wages: total_bonus_wages,
  //     net_take_home: await this.roundoff_func_helper(
  //       epfo_temp.round_off,
  //       net_take_home
  //     ),
  //     gross_earning: await this.roundoff_func_helper(
  //       epfo_temp.round_off,
  //       gross_earning
  //     ),
  //     gross_deduct: await this.roundoff_func_helper(
  //       epfo_temp.round_off,
  //       gross_deduct
  //     ),
  //     voluntary_pf_amount: await this.roundoff_func_helper(
  //       epfo_temp.round_off,
  //       voluntary_pf_amount
  //     ),
  //     advance_recovered: await this.roundoff_func_helper(
  //       epfo_temp.round_off,
  //       advance_recovered
  //     ),
  //   };
  //   return breakupdata;
  // },
  get_time_to_current_time: function (time_value = "00:00") {
    var calculate_date_time = new Date();
    var calculate_time = time_value + ":00";
    calculate_time = calculate_time.split(":");
    calculate_date_time.setHours(
      calculate_time[0],
      calculate_time[1],
      calculate_time[2],
      0
    );
    return (calculate_date_time = calculate_date_time.getTime() / (1000 * 60));
  },
  check_leave_availability: function (req) {
    if (req.body.register_type === "halfday") {
      req.body.attendance_stat;
    } else if (req.body.register_type === "time") {
      req.body.attendance_stat;
    }
    // else if (req.body.register_type === "halfday") {
    // }
  },
  calculate_bonus: async function (
    bonus_temp_data,
    date_of_join,
    gross_salary,
    bonus_module,
    com_data,
    wage_month,
    wage_year
  ) {
    let wage_date = new Date(`${wage_year}-${wage_month + 1}`);
    var bonus_value = parseFloat(bonus_module.bonus_value);
    var exgratia_status = bonus_module.exgratia;
    var gov_calculate_bonus =
      (bonus_temp_data.max_bonus_wage * bonus_temp_data.max_bonus) / 100;

    var bonus_amount = 0;
    var exgratia_amount = 0;

    var month_diff = await this.getMonthDifference(
      new Date(date_of_join),
      new Date()
    );

    var year_ending = com_data.financial_year_end;
    /* check if employee service period is eligible or not */
    if (month_diff >= bonus_temp_data.min_service) {
      var current_date = new Date();
      //var curr_month = current_date.getUTCMonth();
      var curr_month = wage_month;
      var curr_year = current_date.getUTCFullYear();
      var temp_max_bonus_wage = bonus_temp_data.max_bonus_wage;

      /* check DISBURSEMENT FREQUENCY */
      if (bonus_temp_data.disbursement_frequency == "yearly") {
        var frequency_month_val = [parseFloat(bonus_module.bonus_g_month)];
        var frequency_year = bonus_module.bonus_g_year;
        var template_bonus_wage = temp_max_bonus_wage * 12;
        wage_date.setMonth(wage_date.getMonth() - 12)
        var wage_month_start = curr_month - 12;
        var wage_month_end = curr_month;
      } else if (bonus_temp_data.disbursement_frequency == "quaterly") {
        var frequency_month = await this.frequency_monthf(
          new Date(year_ending),
          3
        );
        var frequency_month_val = frequency_month.month_val;
        // console.log(frequency_month)
        // frequency_month.month_val;
        var template_bonus_wage = temp_max_bonus_wage * 3;
        if (frequency_month_val.includes(curr_month)) {
          wage_date.setMonth(wage_date.getMonth() - 2)
          // var wage_month_start = curr_month - 3;
          // var wage_month_end = curr_month;
        }
      } else if (bonus_temp_data.disbursement_frequency == "half_yearly") {
        var frequency_month = await this.frequency_monthf(
          new Date(year_ending),
          6
        );
        var frequency_month_val = frequency_month.month_val;
        var template_bonus_wage = temp_max_bonus_wage * 6;
        if (frequency_month_val.includes(curr_month)) {
          wage_date.setMonth(wage_date.getMonth() - 6)
          var wage_month_start = curr_month - 6;
          var wage_month_end = curr_month;
        }
      } else {
        var wage_month_start = curr_month - 1;
        var wage_month_end = curr_month;
        wage_date.setMonth(wage_date.getMonth() - 1)
        var frequency_month_val = [curr_month];
        var template_bonus_wage = temp_max_bonus_wage;
      }

      if (frequency_month_val.includes(curr_month)) {
        /* check DISBURSEMENT TYPE */
        if (bonus_temp_data.disbursement_type == "fixed") {
          bonus_amount = bonus_value;
        } else {
          // var calculated_bonus_wages = await this.get_bonus_wages(
          //   bonus_module.bonus_from_month,
          //   bonus_module.bonus_from_year,
          //   bonus_module.bonus_to_month,
          //   bonus_module.bonus_to_year,
          //   bonus_module.emp_id
          // );
          var calculated_bonus_wages = await this.get_bonus_wages(
            wage_date.getMonth(),
            wage_date.getFullYear(),
            curr_month,
            new Date().getFullYear(),
            bonus_module.emp_id
          );
          var bonus_wages = calculated_bonus_wages[0]
            ? calculated_bonus_wages[0].total_bonus_wages
            : 0;
          var calculated_bonus_amount = (bonus_wages * bonus_value) / 100;
          if (exgratia_status === "on") {
            /* if bonus wages is greater than eligible capping then all amount will consider as Bonus */
            if (calculated_bonus_wages > bonus_temp_data.eligible_capping) {
              bonus_amount = calculated_bonus_amount;
            } else {
              /* as per the template if actual bonus amount is greater template bonus amount then extra amount will consider as exgratia and template bonus amount will consider as Bonus */
              var template_bonus_amount =
                (template_bonus_wage * bonus_temp_data.max_bonus) / 100;
              if (calculated_bonus_amount > template_bonus_amount) {
                bonus_amount = template_bonus_amount;
                exgratia_amount =
                  calculated_bonus_amount - template_bonus_amount;
              } else {
                bonus_amount = calculated_bonus_amount;
              }
            }
          } else {
            bonus_amount = calculated_bonus_amount;
          }
        }
      }
    }
    var bonusdata = {
      bonus_amount: bonus_amount,
      exgratia_amount: exgratia_amount,
    };
    return bonusdata;
  },

  calculate_incentive: async function (
    emp_db_id,
    incentive_temp_data,
    gross_salary,
    incentive_modules,
    com_data,
    wage_month,
    wage_year,
    emp_id,
  ) {
    let wage_date = new Date(`${wage_year}-${wage_month + 1}`);
    var current_date = new Date();
    var curr_month = wage_month;
    var year_ending = com_data.financial_year_end;

    if (incentive_temp_data.settlement_frequency == "yearly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        12
      );

      var frequency_month_val = frequency_month.month_val;
      // var frequency_month_date = frequency_month.month_date_val;

      if (frequency_month_val.includes(curr_month)) {
        wage_date.setMonth(wage_date.getMonth() - 12)
        // var curr_quater_key = Object.keys(frequency_month_val).find(
        //   (key) => frequency_month_val[key] === 1
        // );
        // var start_month_date = wage_date;
        // var end_month_date = frequency_month_date[curr_quater_key];
        var start_month = wage_date.getMonth();
        var start_year = wage_date.getFullYear();
        var end_month = wage_month;
        var end_year = wage_year;
      }
    } else if (incentive_temp_data.settlement_frequency == "half_yearly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        6
      );
      var frequency_month_val = frequency_month.month_val;
      // var frequency_month_date = frequency_month.month_date_val;
      if (frequency_month_val.includes(curr_month)) {
        wage_date.setMonth(wage_date.getMonth() - 6)

        // var curr_quater_key = Object.keys(frequency_month_val).find(
        //   (key) => frequency_month_val[key] === 2
        // );
        // var start_month_date = frequency_month_date[curr_quater_key - 1];
        // var end_month_date = frequency_month_date[curr_quater_key];
        var start_month = wage_date.getMonth();
        var start_year = wage_date.getFullYear();
        var end_month = wage_month;
        var end_year = wage_year;
      }
    } else if (incentive_temp_data.settlement_frequency == "quaterly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        3
      );
      //var frequency_month= await this.frequency_monthf(new Date('2022-04-10'),3);
      var frequency_month_val = frequency_month.month_val;
      // var frequency_month_date = frequency_month.month_date_val;
      if (frequency_month_val.includes(curr_month)) {
        wage_date.setMonth(wage_date.getMonth() - 2)

        // var curr_quater_key = Object.keys(frequency_month_val).find(
        //   (key) => frequency_month_val[key] === 3 
        // );
        // var start_month_date = frequency_month_date[curr_quater_key - 1];
        // var end_month_date = frequency_month_date[curr_quater_key];

        var start_month = wage_date.getMonth();
        var start_year = wage_date.getFullYear();
        var end_month = wage_month;
        var end_year = wage_year;

        if (start_month > end_month && start_year == end_year) start_year -= 1
      }
    } else if (incentive_temp_data.settlement_frequency == "monthly") {
      var start_month = wage_month;
      var start_year = wage_year;
      var end_month = wage_month;
      var end_year = wage_year;
      //console.log('monthly',start_month,start_year,end_month,end_year);
    }
    if (start_month >= 0) {
      var inc_data = await this.get_incentive_module_data(
        emp_db_id,
        com_data.corporate_id,
        start_month,
        start_year,
        end_month,
        end_year,
        emp_id
      );
      // console.log(start_month,start_year,end_month,end_year)
      return {
        start_month,
        start_year,
        end_month,
        end_year,
        incentive_module_date: inc_data[0]
      };
    } else {
      return {
        start_month: null,
        start_year: null,
        end_month: null,
        end_year: null,
        incentive_module_date: null
      };
    }
  },
  calculate_incentive_advance: async function (
    emp_id,
    incentive_temp_data,
    com_data,
    wage_month,
    wage_year,
    incentive_advance,
    ret_months = false
  ) {
    var curr_month = wage_month;
    var year_ending = com_data.financial_year_end;
    if (incentive_temp_data.settlement_frequency == "yearly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        12
      );
      var frequency_month_val = frequency_month.month_val;
      if (frequency_month_val.includes(curr_month)) {
        incentive_advance = 0;
      }
    } else if (incentive_temp_data.settlement_frequency == "half_yearly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        6
      );
      var frequency_month_val = frequency_month.month_val;
      if (frequency_month_val.includes(curr_month)) {
        incentive_advance = 0;
      }
    } else if (incentive_temp_data.settlement_frequency == "quaterly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        3
      );
      var frequency_month_val = frequency_month.month_val;
      if (frequency_month_val.includes(curr_month)) {
        incentive_advance = 0;
      }
    }
    if (frequency_month_val && ret_months) {
      let disbursement_month = frequency_month_val.reduce(function (prev, curr) {
        // Check if the current month is greater than or equal to the current month (curr_month)
        if (curr > curr_month) {
          return (prev === undefined || curr < prev) ? curr : prev; // Select the next closest month
        }
        return prev; // Otherwise keep the previous closest month
      }, undefined);

      // In case no valid month is found (like if all months are before the current month), loop to the first month
      if (disbursement_month === undefined) {
        disbursement_month = frequency_month_val[0];
      }
      return { incentive_advance, disbursement_month }
    }
    return incentive_advance;
  },
  get_incentive_module_data: async function (
    emp_db_id,
    corporate_id,
    start_month,
    start_year,
    end_month,
    end_year,
    emp_id
  ) {
    myAggregate = await IncentiveModule.aggregate([
      {
        $match: {
          $and: [
            { corporate_id: corporate_id },
            { emp_id: mongoose.Types.ObjectId(emp_db_id) },
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
            // {'incentive_g_month':{$gte: await start_month.toString() }},
            // {'incentive_g_year':{$gte: await start_year.toString() }},
            // {'incentive_g_month':{$lte: await end_month.toString() }},
            // {'incentive_g_year':{$lte: await end_year.toString() }},
          ],
        },
      },
      // {
      //   $lookup: {
      //     from: 'employee_advances',
      //     "let": { "emp_id_var": "$_id" },
      //     "pipeline": [
      //       {
      //         "$match": {
      //           $and: [
      //             { "$expr": { "$eq": ["$emp_id", emp_id] } },
      //             { recovery_from:"incentive" } ,
      //             {
      //               $or: [
      //                 { payment_start_year: { $gt: start_year } },
      //                 {
      //                   $and: [
      //                     { payment_start_year: { $gte: start_year } },
      //                     { payment_start_month: { $gte: start_month } },
      //                   ],
      //                 },
      //               ],
      //             },
      //             {
      //               $or: [
      //                 { payment_start_year: { $lt: end_year } },
      //                 {
      //                   $and: [
      //                     { payment_start_year: { $lte: end_year } },
      //                     { payment_start_month: { $lte: end_month } },
      //                   ],
      //                 },
      //               ],
      //             },
      //           ]
      //         },
      //       },
      //       {
      //         $group: {
      //           _id: null,
      //           advance_amount: {
      //             $sum: "$advance_amount",
      //           },
      //         },
      //       }
      //     ],
      //     as: 'employee_advances'
      //   }
      // },
      // {
      //   "$addFields": {
      //     "employee_advance": {
      //       "$arrayElemAt": ["$employee_advances", 0]
      //     },
      //   }
      // },
      {
        $project: {
          _id: 1,
          corporate_id: 1,
          // genarete_advance_value: 1,
          advance_value: 1,
          incentive_value: 1,
          // hold_value: 1,
          emp_id: 1,
          // advance_amount: "$employee_advance.advance_amount"
        },
      },
      {
        $group: {
          _id: null,
          // total_calculated_hold_value: {
          //   $sum: "$hold_value",
          // },
          total_advance_value: {
            $sum: "$advance_value",
          },
          total_incentive_value: {
            $sum: "$incentive_value",
          },
          // total_advance: { $first: "$advance_amount" },
        },
      },
    ]);
    //console.log('myAggregate',myAggregate)
    return myAggregate;
  },
  frequency_monthf: async function (date, freq) {
    var monthspan = "";
    var ret_arr = [];
    var ret_date_arr = [];
    if (freq == 6) {
      var counter = 2;
    } else {
      var counter = 4;
    }

    if (!date) {
      date = new Date();
      date.setMonth(0);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }

    for ($i = 0; $i < counter; $i++) {
      const dayNum = date.getDate();

      if (dayNum == 31) {
        date.setMonth(date.getMonth() - 1)
      }
      monthspan = new Date(date.setMonth(date.getMonth() + freq));

      //monthspan_date=new Date(date.setMonth(date.getUTCMonth()+freq));
      ret_date_arr.push(monthspan);
      ret_arr.push(monthspan.getMonth());
    }
    return { month_val: ret_arr, month_date_val: ret_date_arr };
  },
  get_bonus_wages: async function (
    wage_m_s,
    wage_y_s,
    wage_m_e,
    wage_y_e,
    emp_id
  ) {
    return (myAggregate = await EmployeeMonthlyReport.aggregate([
      {
        $match: {
          $and: [
            { emp_id: { $eq: emp_id } },
            {
              $or: [
                { wage_year: { $gt: wage_y_s } },
                {
                  $and: [
                    { wage_year: { $gte: wage_y_s } },
                    { wage_month: { $gte: wage_m_s } },
                  ],
                },
              ],
            },
            {
              $or: [
                { wage_year: { $lt: wage_y_e } },
                {
                  $and: [
                    { wage_year: { $lte: wage_y_e } },
                    { wage_month: { $lte: wage_m_e } },
                  ],
                },
              ],
            },
            // {"wage_month"  : {$gte : wage_m_s}},
            // {"wage_year"  : {$gte : wage_y_s}},
            // {"wage_month"  : {$lte : wage_m_e}},
            // {"wage_year"  : {$lte : wage_y_e}},
          ],
        },
      },
      {
        $project: {
          _id: 1,
          corporate_id: 1,
          salary_report: 1,
          emp_id: 1,
        },
      },
      {
        $group: {
          _id: null,
          total_bonus_wages: {
            $sum: "$salary_report.total_bonus_wages",
          },
        },
      },
    ]));
  },
  calculate_bonus_working_day: async function (
    wage_m_s,
    wage_y_s,
    wage_m_e,
    wage_y_e,
    emp_id
  ) {
    //console.log(wage_m_s,wage_y_s, wage_m_e, wage_y_e, emp_id)
    return (myAggregate = await AttendanceSummary.aggregate([
      {
        $match: {
          $and: [
            { emp_id: { $eq: emp_id } },
            {
              $or: [
                { attendance_year: { $gt: wage_y_s.toString() } },
                {
                  $and: [
                    { attendance_year: { $gte: wage_y_s.toString() } },
                    { attendance_month: { $gte: wage_m_s.toString() } },
                  ],
                },
              ],
            },
            {
              $or: [
                { attendance_year: { $lt: wage_y_e.toString() } },
                {
                  $and: [
                    { attendance_year: { $lte: wage_y_e.toString() } },
                    { attendance_month: { $lte: wage_m_e.toString() } },
                  ],
                },
              ],
            },
            // {"attendance_month"  : {$gte : wage_m_s}},
            // {"attendance_year"  : {$gte : wage_y_s}},
            // {"attendance_month"  : {$lte : wage_m_e}},
            // {"attendance_year"  : {$lte : wage_y_e}},
          ],
        },
      },
      {
        $project: {
          _id: 1,
          corporate_id: 1,
          paydays: 1,
          emp_id: 1,
        },
      },
      {
        $group: {
          _id: null,
          total_paydays: {
            $sum: "$paydays",
          },
        },
      },
    ]));
  },
  getMonthDifference: async function (startDate, endDate) {
    return (
      endDate.getUTCMonth() -
      startDate.getUTCMonth() +
      12 * (endDate.getFullYear() - startDate.getFullYear())
    );
  },
  getEmpFilterData: async function (req, search_option, search_option_details) {
    if (req.body.emp_name) {
      search_option.$match.emp_name = {
        $regex: req.body.emp_name,
        $options: "i",
      };
      search_option.$match.emp_name = {
        $regex: req.body.emp_name,
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
    if (req.body.emp_id) {
      search_option.$match.emp_id = { $regex: req.body.emp_id, $options: "i" };
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
    if (req.body.bank_account) {
      var bank_account = JSON.parse(req.body.bank_account);
      // bank_account = bank_account.map(function (el) {
      //   return mongoose.Types.ObjectId(el);
      // });
      search_option_details.$match["employee_details.bank_details.bank_name"] =
        { $in: bank_account };
    }
    if (req.body.client_id) {
      var client_ids = JSON.parse(req.body.client_id);
      client_ids = client_ids.map(function (el) {
        return mongoose.Types.ObjectId(el);
      });
      search_option.$match.client_code = { $in: client_ids };
    }
    if (req.body.hod_id) {
      var hod_ids = JSON.parse(req.body.hod_id);
      hod_ids = hod_ids.map(function (el) {
        return mongoose.Types.ObjectId(el);
      });
      search_option.$match.emp_hod = { $in: hod_ids };
    }
    return {
      search_option: search_option,
      search_option_details: search_option_details,
    };
  },
  calculate_overtime: async function (
    gross_salary,
    attendance_temp_data,
    overtime_temp_data,
    attendance_summaries,
    companyData,
    wage_month,
    wage_year
  ) {
    //console.log(month_days,wage_month, attendance_summaries[0].total_overtime);
    if (attendance_temp_data.register_type == "time") {
      if (overtime_temp_data.overtime_type == "hourly_fix") {
        var overtime_rate = overtime_temp_data.overtime_rate;
        var overtime_amount =
          overtime_rate * attendance_summaries[0].total_overtime;
        //console.log('hourly_fix')
      } else {
        var month_days = new Date(
          parseInt(wage_year),
          parseInt(wage_month) + 1,
          0
        ).getDate();
        var per_day_sal = gross_salary / month_days;
        var overtime_rate = overtime_temp_data.overtime_rate;
        var per_day_sal_rate = (per_day_sal * overtime_rate) / 100;
        var overtime_amount =
          per_day_sal_rate * attendance_summaries[0].total_overtime;
        //console.log('hourly_per')
      }
    } else {
      if (overtime_temp_data.overtime_type == "daily_fix") {
        var overtime_rate = overtime_temp_data.overtime_rate;
        var overtime_amount =
          overtime_rate * attendance_summaries[0].total_overtime;
      } else {
        var month_days = new Date(
          parseInt(wage_year),
          parseInt(wage_month) + 1,
          0
        ).getDate();
        var per_day_sal = gross_salary / month_days;
        var overtime_rate = overtime_temp_data.overtime_rate;
        var per_day_sal_rate = (per_day_sal * overtime_rate) / 100;
        var overtime_amount =
          per_day_sal_rate * attendance_summaries[0].total_overtime;
      }
    }
    return overtime_amount;
    // console.log(attendance_temp_data,overtime_temp_data,attendance_summaries[0].total_overtime,companyData,wage_month,wage_year);
  },
  get_emp_attendance_template: async function (corporate_id, emp_id) {
    var search_option = {
      $match: { corporate_id: corporate_id, emp_id: emp_id },
    };
    myAggregate = await Employee.aggregate([
      search_option,
      {
        $lookup: {
          from: "employee_details",
          localField: "_id",
          foreignField: "employee_id",
          as: "employee_details",
        },
      },
      {
        $addFields: {
          employee_details: {
            $arrayElemAt: ["$employee_details", 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          corporate_id: 1,
          attendance_temp_data:
            "$employee_details.template_data.attendance_temp_data",
        },
      },
    ]).then(async (emps) => {
      return emps;
      if (emps[0]) {
        //console.log(emps[0].attendance_temp_data)
        rule_data = emps[0].attendance_temp_data;
        var startTime = moment(rule_data.reporting_time, "HH:mm:ss");
        var endTime = moment(rule_data.closing_time, "HH:mm:ss");
        hours = parseInt(endTime.diff(startTime, "hours"));
        minutes = parseInt(
          moment(endTime).diff(moment(startTime), "minutes") % 60
        );
        totalWorkingHour = hours + minutes / 100;
        log_date = moment(row[3], ["MM/DD/YYYY HH:mm:ss", "YYYY-MM-DD"]).format(
          "YYYY-MM-DD"
        );
        log_time = moment(row[3], ["MM/DD/YYYY HH:mm:ss", "HH:mm:ss"]).format(
          "HH:mm:ss"
        );
        log_date_time = moment(row[3], [
          "MM/DD/YYYY HH:mm:ss",
          "YYYY-MM-DD HH:mm:ss",
        ]).format("YYYY-MM-DD HH:mm:ss");
        log_data.push({ emp_id: emp_id, log_date_time: log_date_time });
      }
      //return resp.json({ status: 'error', message: emps[0].attendance_temp_data });
    });
  },
  weeklyHolidays: async function (date_str = {}, corporate_id = "ivn123") {
    cond = {
      corporate_id: corporate_id,
    };

    let holiday_lists = [];

    return new Promise(async (resolve, reject) => {
      await Weekly_holiday.find(cond, async function (err, finalData) {
        day_lists = [];
        if (err) {
          reject(cond);
        }
        day_lists = await getWeekday(date_str.month, date_str.year);
        await finalData.reduce(async (a, item) => {
          if (item.weeks) {
            var weeks = [];
            //var weeks={"1":{"first_half":"yes","second_half":"yes"},"2":{"first_half":"no","second_half":"yes"},"3":{"first_half":"no","second_half":"yes"},"4":{"first_half":"no","second_half":"yes"},"5":{"first_half":"no","second_half":"yes"}}

            await Object.keys(item.weeks).reduce(async (c, rs) => {
              if (rs) {
                if (item.weeks[rs]) {
                  weeks.push(item.weeks[rs]);
                }
              }
            }, Promise.resolve);

            await weeks.reduce(async (b, rs, index) => {
              if (rs) {
                if (rs.first_half == "yes" || rs.second_half == "yes") {
                  if (day_lists[item.weekday][index - 1]) {
                    holiday_lists.push(day_lists[item.weekday][index - 1]);
                  }
                }
              }
            }, Promise.resolve);

            resolve(holiday_lists);
          }
        }, Promise.resolve());
      });
    });
  },
  yearlyHolidays: async function (date_str = {}, corporate_id = "ivn123") {
    let month = parseInt(date_str.month);
    let year = parseInt(date_str.year);

    cond = {
      corporate_id: corporate_id,
      $expr: {
        $and: [
          {
            $eq: [
              {
                $month: "$holiday_date",
              },
              month,
            ],
          },
          {
            $eq: [
              {
                $year: "$holiday_date",
              },
              year,
            ],
          },
        ],
      },
    };

    let holiday_lists = [];

    return new Promise(async (resolve, reject) => {
      await Yearly_holiday.find(cond, async function (err, finalData) {
        await finalData.forEach(async function (data) {
          holiday_lists.push(data.holiday_date);
        });
        resolve(holiday_lists);
      });
    });
  },
  attendanceRule: async function (emp_id, corporate_id) {
    let holiday_lists = [];

    return await new Promise(async (resolve, reject) => {
      var search_option = {
        $match: {
          corporate_id: corporate_id,
          emp_id: emp_id,
          approval_status: "approved",
        },
      };
      myAggregate = await Employee.aggregate([
        search_option,
        {
          $lookup: {
            from: "employee_details",
            localField: "_id",
            foreignField: "employee_id",
            as: "employee_details",
          },
        },
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            corporate_id: 1,
            attendance_temp_data:
              "$employee_details.template_data.attendance_temp_data",
          },
        },
      ])
        .then(async (res) => {
          let r = res[0] || null;
          if (r != null) {
            resolve(r.attendance_temp_data);
          } else {
            resolve(null);
          }
        });
    });
  },
  shiftDetail: async function (emp_id) {
    var search_option = { $match: { emp_id: emp_id } };
    return new Promise(async (resolve, reject) => {
      myAggregate = await Employee.aggregate([
        search_option,
        {
          $lookup: {
            from: "shifts",
            localField: "shift.shift_id",
            foreignField: "_id",
            as: "shift_details",
          },
        },

        {
          $project: {
            _id: 1,
            corporate_id: 1,
            emp_id: 1,
            shift_end_date: "$shift.shift_end_date",
            shift_start_date: "$shift.shift_start_date",
            shift_details: "$shift_details",
          },
        },
      ]).then(async (res) => {
        let r = res[0] || null;
        resolve(r);
      });
    });
  },
  // getWeekday:async function (month,year)
  // {
  //     dateStr=parseInt(year)+'-'+parseInt(month);
  //     var daysInMonth =  mo(dateStr, "YYYY-MM").daysInMonth();
  //     var arrDays = [];
  //     mo().set({'year': year, 'month': (month-1)});
  //     while(daysInMonth) {
  //     var current =mo().set({'year': year, 'month': (month-1),date:parseInt(daysInMonth)});

  //     if(arrDays[current.format('dddd')])
  //     {
  //         arrDays[current.format('dddd')].push(current);

  //     }
  //     else{
  //         arrDays[current.format('dddd')]=[current];

  //     }
  //     daysInMonth--;
  //   }

  //   return await arrDays;

  // },
  generate_export_file: async function (module, module_data, template_data) { },
  get_advance_recovery_data: async function (
    emp_id,
    corporate_id,
    wage_month,
    wage_year,
    gross_earning = 0,
    recovery_from = ""
  ) {
    var sortoption = {};
    const options = {
      page: 1,
      limit: perpage,
      sort: sortoption,
    };
    var filter_option = {
      $and: [
        { corporate_id: corporate_id },
        { status: "active" },
        { emp_id: emp_id },
        {
          $or: [
            { payment_start_year: { $lt: +wage_year } },
            {
              $and: [
                { payment_start_year: { $lte: +wage_year } },
                { payment_start_month: { $lte: +wage_month } },
              ],
            },
          ],
        },
      ],
    };
    var advance_opening_balance = 0;
    var advance_recovered = 0;
    var new_advance = 0;
    var closing_advance = 0;
    var advance_start = 0;
    var available_module_amount = gross_earning;
    var advance_install_arr = [];

    var advancedata = await EmployeeAdvance.find(filter_option);
    if (advancedata.length > 0) {
      await Promise.all(
        advancedata.map(async (advance_data, keyval) => {
          var instalment_history = advance_data.instalment_history;
          var recovered_advance_data = 0;
          var full_pending = 0;
          var partial_pending = 0;
          if (
            advance_data.payment_start_month == wage_month.toString() &&
            advance_data.payment_start_year == wage_year.toString()
          ) {
            further_advance = parseFloat(advance_data.advance_amount);
            new_advance = parseFloat(new_advance) + parseFloat(advance_data.advance_amount);
          } else {
            advance_start = advance_start + parseFloat(advance_data.advance_outstanding);
          }
          if (advance_data.recovery_from == recovery_from) {
            await Promise.all(
              instalment_history.map(async (el, keyval) => {
                //instalment_history.map(async function(el) {

                if (
                  el.instalment_month == wage_month.toString() &&
                  el.instalment_year == wage_year.toString()
                ) {
                  //console.log(el.instalment_month)
                  recovery_status = "yes";
                  if (available_module_amount > 0) {
                    if (el.advance_amount <= available_module_amount) {
                      //console.log('a');
                      recovered_advance_data =
                        parseFloat(recovered_advance_data) +
                        parseFloat(el.advance_amount);
                      available_module_amount =
                        available_module_amount - parseFloat(el.advance_amount);
                    } else {
                      //console.log('b');
                      partial_pending =
                        parseFloat(el.advance_amount) -
                        parseFloat(available_module_amount);
                      recovered_advance_data =
                        parseFloat(recovered_advance_data) +
                        parseFloat(available_module_amount);
                      available_module_amount = 0;
                    }
                  } else {
                    full_pending = parseFloat(el.advance_amount);
                  }
                  advance_recovered = recovered_advance_data;
                }
              })
            );
          }
        })
      );
    }
    return {
      available_module_amount: available_module_amount,
      advance_recovered: advance_recovered,
    };
  },
  calculate_shift_allowance: async function (attendance_summaries, shift_rate) {
    var total_amount = 0
    await Promise.all(
      shift_rate.map(async (shift_rate_val, keyval) => {
        if (shift_rate_val.shift_id in attendance_summaries) {
          var shift_rate = shift_rate_val.rate;
          var no_of_days = attendance_summaries[shift_rate_val.shift_id];
          total_amount = (total_amount + (parseInt(shift_rate) * parseInt(no_of_days)));
        }
      }))
    return total_amount;


    if (attendance_temp_data.register_type == "time") {
      if (overtime_temp_data.overtime_type == "hourly_fix") {
        var overtime_rate = overtime_temp_data.overtime_rate;
        var overtime_amount =
          overtime_rate * attendance_summaries[0].total_overtime;
        //console.log('hourly_fix')
      } else {
        var month_days = new Date(
          parseInt(wage_year),
          parseInt(wage_month) + 1,
          0
        ).getDate();
        var per_day_sal = gross_salary / month_days;
        var overtime_rate = overtime_temp_data.overtime_rate;
        var per_day_sal_rate = (per_day_sal * overtime_rate) / 100;
        var overtime_amount =
          per_day_sal_rate * attendance_summaries[0].total_overtime;
        //console.log('hourly_per')
      }
    } else {
      if (overtime_temp_data.overtime_type == "daily_fix") {
        var overtime_rate = overtime_temp_data.overtime_rate;
        var overtime_amount =
          overtime_rate * attendance_summaries[0].total_overtime;
      } else {
        var month_days = new Date(
          parseInt(wage_year),
          parseInt(wage_month) + 1,
          0
        ).getDate();
        var per_day_sal = gross_salary / month_days;
        var overtime_rate = overtime_temp_data.overtime_rate;
        var per_day_sal_rate = (per_day_sal * overtime_rate) / 100;
        var overtime_amount =
          per_day_sal_rate * attendance_summaries[0].total_overtime;
      }
    }
    return overtime_amount;
  },
  generate_pdf: async function (data, pdf_title, payslip_temp_data, pdf_path) {
    try {
      var fonts = {
        Roboto: {
          normal: 'fonts/Roboto-Regular.ttf',
          bold: 'fonts/Roboto-Medium.ttf',
          italics: 'fonts/Roboto-Italic.ttf',
          bolditalics: 'fonts/Roboto-MediumItalic.ttf'
        }
      };
      var printer = new PdfPrinter(fonts);
      var emp_field = payslip_temp_data?.employee_details;
      var payroll_section_field = payslip_temp_data?.payroll_details;
      var deduction_field = ['epf_amount', 'vpf_amount', 'esic_amount', 'p_tax_amount', 'lwf_amount', 'tds_amount'];
      var contribution_field = ['epf_amount', 'eps_amount', 'admin_edli_amount', 'esic_amount', 'lwf_amount'];
      var gross_payment_field = ['gross', 'ctc', 'net_pay'];

      var payslip_data = data?.payslip_data;
      var salary_heads = payslip_data?.earnings?.salary_report_heads;
      //console.log('emp_data',payslip_temp_data)
      var emp_data = {
        company_info: { label: "Company info", label_value: payslip_temp_data?.company_info ?? 'N/A' },
        emp_code: { label: "Emp code", label_value: payslip_data?.emp_id ?? 'N/A' },
        client: { label: "Client", label_value: payslip_data?.emp_data?.client?.client_name ?? 'N/A' },
        department: { label: 'Department', label_value: payslip_data?.emp_data?.department?.department_name ?? 'N/A' },
        gender: { label: 'Gender', label_value: payslip_data?.emp_data?.sex } ?? 'N/A',
        doj: { label: 'DOJ', label_value: payslip_data?.emp_data?.date_of_join ?? 'N/A' },
        phone: { label: 'Phone No', label_value: payslip_data?.emp_data?.emp_mob ?? 'N/A' },
        account_no: { label: 'Account No', label_value: payslip_data?.emp_data?.bank_details?.account_no ?? 'N/A' },
        account_type: { label: 'Account Type', label_value: payslip_data?.emp_data?.bank_details?.account_type ?? 'N/A' },
        pan_no: { label: 'Pan No', label_value: payslip_data?.emp_data?.pan_no ?? 'N/A' },
        pf_no: { label: 'PF No', label_value: payslip_data?.emp_data?.new_pf_no ?? 'N/A' },
        month_days: { label: 'Month day', label_value: payslip_data?.emp_data?.attendance_summaries?.monthdays ?? 'N/A' },
        pay_days: { label: 'Pay days', label_value: payslip_data?.emp_data?.attendance_summaries?.paydays ?? 'N/A' },
        holidays: { label: 'Holidays', label_value: payslip_data?.emp_data?.attendance_summaries?.holiday ?? 'N/A' },
        lop_days: { label: 'LOP days', label_value: payslip_data?.emp_data?.attendance_summaries?.total_lop ?? 'N/A' },
        payslip_period: { label: 'Payslip Period', label_value: (payslip_data?.emp_data?.attendance_summaries?.attendance_month + 1) + ' - ' + payslip_data?.emp_data?.attendance_summaries?.attendance_year },
        emp_name: { label: 'Emp name', label_value: payslip_data?.emp_data?.emp_first_name + ' ' + payslip_data?.emp_data?.emp_last_name },
        branch: { label: 'Branch', label_value: payslip_data?.emp_data?.branch?.branch_name ?? 'N/A' },
        hod: { label: 'HOD', label_value: payslip_data?.emp_data?.hod ?? 'N/A' },
        dob: { label: 'DOB', label_value: payslip_data?.emp_data?.emp_emp_dob ?? 'N/A' },
        email_id: { label: 'Email-id', label_value: payslip_data?.emp_data?.emp_email_id ?? 'N/A' },
        bank_name: { label: 'Bank name', label_value: payslip_data?.emp_data?.bank_details?.bank_name ?? 'N/A' },
        ifsc_code: { label: 'IFSC code', label_value: payslip_data?.emp_data?.bank_details?.ifsc_code ?? 'N/A' },
        aadhar_no: { label: 'Aadhar No', label_value: payslip_data?.emp_data?.emp_aadhar_no ?? 'N/A' },
        uan_no: { label: 'UAN no', label_value: payslip_data?.emp_data?.uan_no ?? 'N/A' },
        esic_ip_no: { label: 'ESIC IP No', label_value: payslip_data?.emp_data?.corporate_id ?? 'N/A' },
        week_off: { label: 'Week off', label_value: payslip_data?.emp_data?.attendance_summaries?.total_wo ?? 'N/A' },
        paid_leave: { label: 'Paid leave', label_value: payslip_data?.emp_data?.attendance_summaries?.total_PDL ?? 'N/A' },
        present_days: { label: 'Present days', label_value: payslip_data?.emp_data?.attendance_summaries?.total_present ?? 'N/A' },
        arrear_leave: { label: 'Arrear leave', label_value: '' ?? 'N/A' },
      };
      var payroll_section_data = {
        salary_heads: { label: "salary_heads", label_value: payslip_data?.earnings?.bonus_total_amount },
        bonus: { label: "Bonus", label_value: (payslip_data?.earnings?.bonus_total_amount || 0)?.toFixed(2) },
        ot: { label: "OT", label_value: (payslip_data?.earnings?.ot_total_amount || 0)?.toFixed(2) },
        ex_gratia: { label: "Ex-gratia", label_value: (payslip_data?.earnings?.ex_gratia_total_amount || 0)?.toFixed(2) },
        incentive: { label: "Incentive", label_value: (payslip_data?.earnings?.incentive_total_amount || 0)?.toFixed(2) },
        leave_encash: { label: "Leave Encash", label_value: (payslip_data?.earnings?.leave_encash_amount || 0)?.toFixed(2) },
        deduction: { label: "Deduction", label_value: '' },
        gross: { label: "Gross", label_value: (payslip_data?.gross_earning || 0)?.toFixed(2) },
        ctc: { label: "CTC", label_value: (payslip_data?.ctc || 0)?.toFixed(2) },
        arrear: { label: "Arrear", label_value: (payslip_data?.earnings?.arrear_amount || 0)?.toFixed(2) },
        extra_earnings: { label: "Extra Earnings", label_value: (payslip_data?.earnings?.extra_earnings_amount || 0)?.toFixed(2) },
        er_contri: { label: "er_contri", label_value: '' },
        net_pay: { label: "Net Pay", label_value: (payslip_data?.net_pay || 0)?.toFixed(2) },
        shift_allowance: { label: "Shift Allowance", label_value: (payslip_data?.earnings?.shift_allowance_total_amount || 0)?.toFixed(2) },
      };
      var deduction_data = {
        epf_amount: { label: "EPF", label_value: (payslip_data?.deductions?.epf_amount || 0)?.toFixed(2) },
        vpf_amount: { label: "VPF", label_value: (payslip_data?.deductions?.vpf_amount || 0)?.toFixed(2) },
        esic_amount: { label: "ESIC", label_value: (payslip_data?.deductions?.esic_amount || 0)?.toFixed(2) },
        p_tax_amount: { label: "P TAX", label_value: (payslip_data?.deductions?.p_tax_amount || 0)?.toFixed(2) },
        lwf_amount: { label: "LWF", label_value: (payslip_data?.deductions?.lwf_amount || 0)?.toFixed(2) },
        tds_amount: { label: "TDS", label_value: (payslip_data?.deductions?.tds_amount || 0)?.toFixed(2) },
      };
      var contribution_data = {
        epf_amount: { label: "EPF", label_value: (payslip_data?.contribution?.epf_amount || 0)?.toFixed(2) },
        eps_amount: { label: "EPS", label_value: (payslip_data?.contribution?.eps_amount || 0)?.toFixed(2) },
        admin_edli_amount: { label: "Admin & EDLI", label_value: (payslip_data?.contribution?.admin_edli_amount || 0)?.toFixed(2) },
        esic_amount: { label: "ESIC", label_value: (payslip_data?.contribution?.esic_amount || 0)?.toFixed(2) },
        lwf_amount: { label: "LWF", label_value: (payslip_data?.contribution?.lwf_amount || 0)?.toFixed(2) },
      };
      var gross_payment_data = {
        gross: { label: "Gross", label_value: (payslip_data.gross_earning || 0).toFixed(2) },
        ctc: { label: "CTC", label_value: (payslip_data.ctc || 0).toFixed(2) },
        net_pay: { label: "Net Pay", label_value: (payslip_data.net_pay || 0).toFixed(2) },
      };
      var emp_details_tb = [];
      var payroll_section_tb = [];
      var deduction_tb = [];
      var contribution_tb = [];
      var gross_payment_tb = [];
      var row_arr = [];

      if (payroll_section_field && payroll_section_field.length) {
        await Promise.all(
          payroll_section_field.map(async (ps_det, index_val) => {
            // if(ps_det == 'salary_heads')
            // {
            //   salary_heads.forEach(async (salary_head) => { 
            //     if(salary_head.head_type == 'earning'){
            //       payroll_section_tb.push([salary_head?.head_abbreviation,salary_head?.amount]);
            //     }else if(salary_head.head_type == 'deduction'){
            //       deduction_tb.push([salary_head?.head_abbreviation,salary_head?.amount]);

            //     }
            //   })
            // }
            if (ps_det == 'salary_heads') {
              salary_heads.forEach(async (salary_head) => {
                if (salary_head.head_type == 'earning') {
                  payroll_section_tb.push([salary_head?.head_abbreviation, salary_head?.amount]);
                } else if (salary_head.head_type == 'deduction') {
                  deduction_tb.push([salary_head?.head_abbreviation, salary_head?.amount]);

                }
              })
            }
            else if (ps_det == 'deduction') {
              deduction_field?.forEach(async (deduc_field) => {
                deduction_tb?.push([deduction_data[deduc_field]?.label || '', deduction_data[deduc_field]?.label_value || '']);
              })
            }
            else if (ps_det == 'er_contri') {
              contribution_field?.forEach(async (contri_field) => {
                contribution_tb?.push([contribution_data[contri_field]?.label || '', contribution_data[contri_field]?.label_value || '']);
              })
            }
            else if (ps_det == 'ctc') {
              gross_payment_tb?.push(gross_payment_data[ps_det]?.label || '', gross_payment_data[ps_det]?.label_value || '');
            }
            else if (ps_det == 'net_pay') {
              gross_payment_tb?.push(gross_payment_data[ps_det]?.label || '', gross_payment_data[ps_det]?.label_value || '');
            }
            else if (ps_det == 'gross') {
              gross_payment_tb?.push(gross_payment_data[ps_det]?.label || '', gross_payment_data[ps_det]?.label_value || '');
            }
            else {
              payroll_section_tb?.push([payroll_section_data[ps_det]?.label || '', payroll_section_data[ps_det]?.label_value || '']);
            }
            return ps_det
          })
        )
      }

      if (emp_field && emp_field.length) {
        await Promise.all(emp_field.map(async (emp_det, index_val) => {
          var arrlength = index_val % 2;
          if (arrlength < 1) {
            row_arr[0] = emp_data[emp_det]?.label || '';
            row_arr[1] = emp_data[emp_det]?.label_value || '';
          } else if (arrlength < 2) {
            row_arr[2] = emp_data[emp_det]?.label || '';
            row_arr[3] = emp_data[emp_det]?.label_value || '';
          }
          if (arrlength == 1) {
            emp_details_tb.push(row_arr);
            row_arr = [];
          }
          return emp_det
        })
        )
      }

      if (fs.existsSync(file_path + '/' + payslip_temp_data.company_logo)) {
        var imagelogo = { image: payslip_temp_data.company_logo, width: 75, style: 'tableHeader', alignment: 'left', border: [true, true, false, false], };
      }
      else {
        var imagelogo = '';
      }


      var docDefinition = {
        content: [
          {
            style: 'tableExample',
            color: '#444',
            table: {
              widths: ['25%', '75%'],
              headerRows: 1,
              // keepWithHeaderRows: 1,
              body: [
                [
                  imagelogo,
                  { text: payslip_temp_data.company_info, style: 'tableHeader', alignment: 'center', border: [false, true, true, false,], }
                ],

              ]
            }
          }
        ],
      };
      console.log("Company name and photo Header Created");
      // {
      //   style:'tableExample',
      //   table:{
      //     widths:['33.3%','33.3%','33.3%'],
      //     body:[
      //       [
      //         {text: 'Earnings', style: 'tableHeader',  alignment: 'center'},
      //         {text: 'Deductions', style: 'tableHeader',  alignment: 'center'},
      //         {text: 'Employer Contr', style: 'tableHeader',  alignment: 'center'},
      //       ]
      //     ]
      //   }
      // },
      // {
      //   style: 'tableExample',
      //   color: '#444',
      //   table: {
      //     widths: ['16.66%','16.66%','16.66%','16.66%','16.66%','16.66%'],
      //     headerRows: 1,
      //     // keepWithHeaderRows: 1,
      //     body: [

      //       [
      //         {
      //           colSpan: 2,
      //           margin: [-5, -3, -5, -3],
      //           table: {
      //             widths: ['50%','50%'],
      //             body: payroll_section_tb
      //           },
      //         },

      //         //{text:"Earnings",  style: 'tableHeader',  alignment: 'center'},
      //         {},
      //         {
      //           colSpan: 2,
      //           margin: [-5, -3, -5, -3],
      //           table: {
      //             widths: ['50%','50%'],
      //             body: deduction_tb
      //           },
      //         },
      //         {},
      //         {
      //           colSpan: 2,
      //           margin: [-5, -3, -5, -3],
      //           table: {
      //             widths: ['50%','50%'],
      //             body: contribution_tb
      //           },
      //         },
      //         {}
      //       ]
      //     ]
      //   }
      // },
      // {
      //   style:"TableExample",
      //   table:{
      //     widths: ['16.66%','16.66%','16.66%','16.66%','16.66%','16.66%'],
      //     body:[gross_payment_tb]
      //   }
      // },
      // {
      //   style:'TableExample',
      //   table:{
      //     widths:['100%'],
      //     body:[[payslip_temp_data.signature_message]]
      //   }
      // }

      if (emp_details_tb.length) {
        docDefinition.content.push({
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            headerRows: 1,
            dontBreakRows: true,
            keepWithHeaderRows: 1,
            body: emp_details_tb,
          }
        })
        console.log("Employee details Header Created");
      };


      let headerOfTable3 = []

      if (payroll_section_tb.length) {
        headerOfTable3.push(
          { text: 'Earnings', style: 'tableHeader', alignment: 'center' },
        )
      }
      if (deduction_tb.length) {
        headerOfTable3.push(
          { text: 'Deductions', style: 'tableHeader', alignment: 'center' },

        )
      }
      if (contribution_tb.length) {
        headerOfTable3.push(
          { text: 'Employer Contr', style: 'tableHeader', alignment: 'center' },
        )
      }
      if (headerOfTable3.length) {
        let commonWitdth = (100 / headerOfTable3.length).toFixed(2)
        let widths = Array(headerOfTable3.length).fill(`${commonWitdth}%`)
        let valueTablewidths = Array(headerOfTable3.length * 2).fill(`${(commonWitdth / 2).toFixed(2)}%`)

        docDefinition.content.push({
          style: 'tableExample',
          table: {
            widths: widths,
            body: [headerOfTable3]
          }
        })

        let bodyOfValueTable = []

        if (payroll_section_tb.length) {
          bodyOfValueTable.push(
            {
              colSpan: 2,
              margin: [-5, -3, -5, -3],
              table: {
                widths: ['50%', '50%'],
                body: payroll_section_tb
              },
            },
            {}
          )
        }

        if (deduction_tb.length) {
          bodyOfValueTable.push(
            {
              colSpan: 2,
              margin: [-5, -3, -5, -3],
              table: {
                widths: ['50%', '50%'],
                body: deduction_tb
              },
            },
            {}
          )
        }

        if (contribution_tb.length) {
          bodyOfValueTable.push(
            {
              colSpan: 2,
              margin: [-5, -3, -5, -3],
              table: {
                widths: ['50%', '50%'],
                body: contribution_tb
              },
            },
            {}
          )
        }

        docDefinition.content.push({
          style: 'tableExample',
          color: '#444',
          table: {
            widths: valueTablewidths,
            headerRows: 1,
            // keepWithHeaderRows: 1,
            body: [bodyOfValueTable]
          }
        });
      }
      if (gross_payment_tb.length) {
        docDefinition.content.push({
          style: "TableExample",
          table: {
            widths: ['16.66%', '16.66%', '16.66%', '16.66%', '16.66%', '16.66%'],
            body: [gross_payment_tb]
          }
        })
      }
      if (payslip_temp_data.signature_message) {
        docDefinition.content.push({
          style: 'TableExample',
          table: {
            widths: ['100%'],
            body: [[payslip_temp_data.signature_message]]
          }
        })
      }

      var options = {
      }

      var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
      pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));
      pdfDoc.end();

      return 'success';





      /*var options = {
          format: "A3",
          orientation: "portrait",
          border: "10mm",
          header: {
              height: "45mm",
              contents: '<div style="text-align: center;"></div>'
          },
          footer: {
              height: "28mm",
              contents: { // Any page number is working. 1-based index
                  default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                  //last: 'Last Page'
              }
          }
      };
      var html = fs.readFileSync(template_name, "utf8");
      
      var document = {
        html: html,
        data: data,
        path: pdf_path+pdf_title,
        type: "",
      };
      var generated_pdf_file= await pdf.create(document, options);
      return generated_pdf_file;*/
      // .then((res) => {
      //   console.log(res);
      // })
      // .catch((error) => {
      //   console.error(error);
      // });
    } catch (err) {
      throw err
    }
  },
  // generate_pdf:async function(data,pdf_title,payslip_temp_data,pdf_path){
  //   var fonts = {
  //     Roboto: {
  //       normal: 'fonts/Roboto-Regular.ttf',
  //       bold: 'fonts/Roboto-Medium.ttf',
  //       italics: 'fonts/Roboto-Italic.ttf',
  //       bolditalics: 'fonts/Roboto-MediumItalic.ttf'
  //     }
  //   };
  //     var printer = new PdfPrinter(fonts);
  //     var emp_field=payslip_temp_data?.employee_details;
  //     var payroll_section_field=payslip_temp_data?.payroll_details;
  //     var deduction_field=['epf_amount','vpf_amount','esic_amount','p_tax_amount','lwf_amount','tds_amount'];
  //     var contribution_field=['epf_amount','eps_amount','admin_edli_amount','esic_amount','lwf_amount'];
  //     var gross_payment_field=['gross','ctc','net_pay'];

  //     var payslip_data=data.payslip_data;
  //     var salary_heads=payslip_data.earnings.salary_report_heads;
  //     //console.log('emp_data',payslip_temp_data)
  //     var emp_data={
  //       company_info:{label:"Company info",label_value:payslip_temp_data?.company_info},
  //       emp_code:{label:"Emp code",label_value:payslip_data.emp_id},
  //       client:{label:"Client",label_value:payslip_data.emp_data.client.client_name},
  //       department:{label:'Department',label_value:payslip_data.emp_data.department.department_name},
  //       gender:{label:'Gender',label_value:payslip_data.emp_data.sex},
  //       doj:{label:'DOJ',label_value:payslip_data.emp_data.date_of_join},
  //       phone:{label:'Phone No',label_value:payslip_data.emp_data.emp_mob},
  //       account_no:{label:'Account No',label_value:payslip_data.emp_data.bank_details.account_no},
  //       account_type:{label:'Account Type',label_value:payslip_data.emp_data.bank_details.account_type},
  //       pan_no:{label:'Pan No',label_value:payslip_data.emp_data.pan_no},
  //       pf_no:{label:'PF No',label_value:payslip_data.emp_data.new_pf_no},
  //       month_days:{label:'Month day',label_value:payslip_data.emp_data.attendance_summaries?.monthdays},
  //       pay_days:{label:'Pay days',label_value:payslip_data.emp_data.attendance_summaries.paydays},
  //       holidays:{label:'Holidays',label_value:payslip_data.emp_data.attendance_summaries.holiday},
  //       lop_days:{label:'LOP days',label_value:payslip_data.emp_data.attendance_summaries.total_lop},
  //       payslip_period:{label:'Payslip Period',label_value:(payslip_data.emp_data.attendance_summaries.attendance_month+1) + ' - ' + payslip_data.emp_data.attendance_summaries.attendance_year},
  //       emp_name:{label:'Emp name',label_value:payslip_data.emp_data.emp_first_name + ' ' + payslip_data.emp_data.emp_last_name},
  //       branch:{label:'Branch',label_value:payslip_data.emp_data.branch?.branch_name},
  //       hod:{label:'HOD',label_value:payslip_data.emp_data.hod},
  //       dob:{label:'DOB',label_value:payslip_data.emp_data.emp_emp_dob},
  //       email_id:{label:'Email-id',label_value:payslip_data.emp_data.emp_email_id},
  //       bank_name:{label:'Bank name',label_value:payslip_data.emp_data.bank_details.bank_name},
  //       ifsc_code:{label:'IFSC code',label_value:payslip_data.emp_data.bank_details.ifsc_code},
  //       aadhar_no:{label:'Aadhar No',label_value:payslip_data.emp_data.emp_aadhar_no},
  //       uan_no:{label:'UAN no',label_value:payslip_data.emp_data.uan_no},
  //       esic_ip_no:{label:'ESIC IP No',label_value:payslip_data.emp_data.corporate_id},
  //       week_off:{label:'Week off',label_value:payslip_data.emp_data.attendance_summaries?.total_wo},
  //       paid_leave:{label:'Paid leave',label_value:payslip_data.emp_data.attendance_summaries?.total_PDL},
  //       present_days:{label:'Present days',label_value:payslip_data.emp_data.attendance_summaries?.total_present},
  //       arrear_leave:{label:'Arrear leave',label_value:''},
  //     };
  //     var payroll_section_data={
  //       salary_heads:{label:"salary_heads",label_value:payslip_data.earnings.bonus_total_amount},
  //       bonus:{label:"Bonus",label_value:(payslip_data.earnings.bonus_total_amount || 0).toFixed(2)},
  //       ot:{label:"OT",label_value:(payslip_data.earnings.ot_total_amount || 0).toFixed(2)},
  //       ex_gratia:{label:"Ex-gratia",label_value:(payslip_data.earnings.ex_gratia_total_amount || 0).toFixed(2)},
  //       incentive:{label:"Incentive",label_value:(payslip_data.earnings.incentive_total_amount || 0).toFixed(2)},
  //       leave_encash:{label:"Leave Encash",label_value:(payslip_data.earnings.leave_encash_amount || 0).toFixed(2)},
  //       deduction:{label:"Deduction",label_value:''},
  //       gross:{label:"Gross",label_value:(payslip_data.gross_earning || 0).toFixed(2)},
  //       ctc:{label:"CTC",label_value:(payslip_data.ctc || 0).toFixed(2)},
  //       arrear:{label:"Arrear",label_value:(payslip_data.earnings.arrear_amount || 0).toFixed(2)},
  //       extra_earnings:{label:"Extra Earnings",label_value:(payslip_data.earnings.extra_earnings_amount || 0).toFixed(2)},
  //       er_contri:{label:"er_contri",label_value:''},
  //       net_pay:{label:"Net Pay",label_value:(payslip_data.net_pay || 0).toFixed(2)},
  //       shift_allowance:{label:"Shift Allowance",label_value:(payslip_data.earnings.shift_allowance_total_amount || 0).toFixed(2)},
  //     };
  //     var deduction_data = {
  //       epf_amount:{label:"EPF",label_value:(payslip_data.deductions.epf_amount || 0).toFixed(2)},
  //       vpf_amount:{label:"VPF",label_value:(payslip_data.deductions.vpf_amount || 0).toFixed(2)},
  //       esic_amount:{label:"ESIC",label_value:(payslip_data.deductions.esic_amount || 0).toFixed(2)},
  //       p_tax_amount:{label:"P TAX",label_value:(payslip_data.deductions.p_tax_amount || 0).toFixed(2)},
  //       lwf_amount:{label:"LWF",label_value:(payslip_data.deductions.lwf_amount || 0).toFixed(2)},
  //       tds_amount:{label:"TDS",label_value:(payslip_data.deductions.tds_amount || 0).toFixed(2)},
  //     };
  //     var contribution_data = {
  //       epf_amount:{label:"EPF",label_value:(payslip_data.contribution.epf_amount || 0).toFixed(2)},
  //       eps_amount:{label:"EPS",label_value:(payslip_data.contribution.eps_amount || 0).toFixed(2)},
  //       admin_edli_amount:{label:"Admin & EDLI",label_value:(payslip_data.contribution.admin_edli_amount || 0).toFixed(2)},
  //       esic_amount:{label:"ESIC",label_value:(payslip_data.contribution.esic_amount || 0).toFixed(2)},
  //       lwf_amount:{label:"LWF",label_value:(payslip_data.contribution.lwf_amount || 0).toFixed(2)},
  //     };
  //     var gross_payment_data = {
  //       gross:{label:"Gross",label_value:(payslip_data.gross_earning || 0).toFixed(2)},
  //       ctc:{label:"CTC",label_value:(payslip_data.ctc || 0).toFixed(2)},
  //       net_pay:{label:"Net Pay",label_value:(payslip_data.net_pay || 0).toFixed(2)},
  //     };
  //     var emp_details_tb= [];
  //     var payroll_section_tb=[];
  //     var deduction_tb=[];
  //     var contribution_tb=[];
  //     var gross_payment_tb=[];
  //     var  row_arr = [];
  //     payroll_section_field.forEach(async (ps_det,index_val) => { 
  //       if(ps_det == 'salary_heads')
  //       {
  //         salary_heads.forEach(async (salaty_head) => { 
  //           payroll_section_tb.push([salaty_head.head_abbreviation,salaty_head.amount]);
  //         })
  //       }
  //       else if(ps_det == 'deduction')
  //       {
  //         deduction_field.forEach(async (deduc_field) => { 
  //           deduction_tb.push([deduction_data[deduc_field].label||'',deduction_data[deduc_field].label_value||'']);
  //         })
  //       }
  //       else if(ps_det == 'er_contri')
  //       {
  //         contribution_field.forEach(async (contri_field) => { 
  //           contribution_tb.push([contribution_data[contri_field].label||'',contribution_data[contri_field].label_value||'']);
  //         })
  //       }
  //       else if(ps_det == 'ctc')
  //       {
  //         gross_payment_tb.push(gross_payment_data[ps_det].label||'',gross_payment_data[ps_det].label_value||'');
  //       }
  //       else if(ps_det == 'net_pay'  )
  //       {
  //         gross_payment_tb.push(gross_payment_data[ps_det].label||'',gross_payment_data[ps_det].label_value||'');
  //       }
  //       else if( ps_det == 'gross'  )
  //       {
  //         gross_payment_tb.push(gross_payment_data[ps_det].label||'',gross_payment_data[ps_det].label_value||'');
  //       }
  //       else
  //       {
  //         payroll_section_tb.push([payroll_section_data[ps_det].label||'',payroll_section_data[ps_det].label_value||'']); 
  //       }
  //     })
  //     //console.log(gross_payment_tb);
  //     emp_field.forEach(async (emp_det,index_val) => {        
  //       var arrlength = index_val%2;
  //       if(arrlength < 1)
  //       {
  //         row_arr[0]=emp_data[emp_det].label||'';
  //         row_arr[1]=emp_data[emp_det].label_value||'';
  //       }else if(arrlength < 2)
  //       {
  //         row_arr[2]=emp_data[emp_det].label||'';
  //         row_arr[3]=emp_data[emp_det].label_value||'';
  //       }
  //       if(arrlength == 1)
  //       {
  //         emp_details_tb.push(row_arr);
  //         row_arr = [];
  //       }
  //     })

  //     ///console.log('aa',payroll_section_tb);
  //     if (fs.existsSync(file_path+'/'+payslip_temp_data.company_logo)) {
  //       var imagelogo= {image: payslip_temp_data.company_logo, width: 75,  style: 'tableHeader',  alignment: 'left', border: [true, true, false, false],};
  //     }
  //     else
  //     {
  //       var imagelogo='';
  //     }

  //     var docDefinition = {
  //       content: [
  //         {
  //           style: 'tableExample',
  //           color: '#444',

  //           table: {
  //             widths: ['25%','75%'],
  //             headerRows: 2,
  //             // keepWithHeaderRows: 1,
  //             body: [
  //               [
  //                 imagelogo,
  //                 {text: 'payslip_temp_data.company_info', style: 'tableHeader',   alignment: 'center', border: [false, true, true, false,],}
  //               ],

  //             ]
  //           }
  //         },
  //         {
  //           table: {
  //             widths: ['25%','25%','25%','25%'],
  //             headerRows: 1,
  //             dontBreakRows: true,
  //             keepWithHeaderRows: 1,
  //             body: emp_details_tb,
  //           }
  //         },
  //         {
  //           style:'tableExample',
  //           table:{
  //             widths:['33.3%','33.3%','33.3%'],
  //             body:[
  //               [
  //                 {text: 'Earnings', style: 'tableHeader',  alignment: 'center'},
  //                 {text: 'Deductions', style: 'tableHeader',  alignment: 'center'},
  //                 {text: 'Employer Contr', style: 'tableHeader',  alignment: 'center'},
  //               ]
  //             ]
  //           }
  //         },
  //         {
  //           style: 'tableExample',
  //           color: '#444',
  //           table: {
  //             widths: ['16.66%','16.66%','16.66%','16.66%','16.66%','16.66%'],
  //             headerRows: 1,
  //             // keepWithHeaderRows: 1,
  //             body: [

  //               [
  //                 {
  //                   colSpan: 2,
  //                   margin: [-5, -3, -5, -3],
  //                   table: {
  //                     widths: ['50%','50%'],
  //                     body: payroll_section_tb
  //                   },
  //                 },

  //                 //{text:"Earnings",  style: 'tableHeader',  alignment: 'center'},
  //                 {},
  //                 {
  //                   colSpan: 2,
  //                   margin: [-5, -3, -5, -3],
  //                   table: {
  //                     widths: ['50%','50%'],
  //                     body: deduction_tb
  //                   },
  //                 },
  //                 {},
  //                 {
  //                   colSpan: 2,
  //                   margin: [-5, -3, -5, -3],
  //                   table: {
  //                     widths: ['50%','50%'],
  //                     body: contribution_tb
  //                   },
  //                 },
  //                 {}
  //               ]
  //             ]
  //           }
  //         },
  //         {
  //           style:"TableExample",
  //           table:{
  //             widths: ['16.66%','16.66%','16.66%','16.66%','16.66%','16.66%'],
  //             body:[gross_payment_tb]
  //           }
  //         },
  //         {
  //           style:'TableExample',
  //           table:{
  //             widths:['100%'],
  //             body:[[payslip_temp_data.signature_message]]
  //           }
  //         }
  //       ],
  //     };

  //     var options = {
  //     }

  //     var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
  //     pdfDoc.pipe(fs.createWriteStream('.'+pdf_path+pdf_title));
  //     pdfDoc.end();

  //     console.log('called');
  //     return 'success';





  //     /*var options = {
  //         format: "A3",
  //         orientation: "portrait",
  //         border: "10mm",
  //         header: {
  //             height: "45mm",
  //             contents: '<div style="text-align: center;"></div>'
  //         },
  //         footer: {
  //             height: "28mm",
  //             contents: { // Any page number is working. 1-based index
  //                 default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
  //                 //last: 'Last Page'
  //             }
  //         }
  //     };
  //     var html = fs.readFileSync(template_name, "utf8");

  //     var document = {
  //       html: html,
  //       data: data,
  //       path: pdf_path+pdf_title,
  //       type: "",
  //     };
  //     var generated_pdf_file= await pdf.create(document, options);
  //     return generated_pdf_file;*/
  //     // .then((res) => {
  //     //   console.log(res);
  //     // })
  //     // .catch((error) => {
  //     //   console.error(error);
  //     // });
  // },

  calculate_lwf: async function (gross_earning, wage_month, wage_year, comp_data, lwf_rule) {

    // var lwf_rule = await LwfRule.findOne(
    //   {
    //     'corporate_id':comp_data.corporate_id,
    //     'state':comp_data.com_state,
    //     'effective_form': {'$lte': new Date() },
    //     $and:[
    //       {
    //         $or:[
    //           {
    //             'period_one.to_month':{$eq:wage_month}
    //           },
    //           {
    //             'period_two.to_month':{$eq:wage_month}
    //           }
    //         ]
    //       }
    //     ]

    //   },"-history");
    if (lwf_rule.effective_form <= new Date() && (lwf_rule.period_one.to_month == wage_month || lwf_rule.period_two.to_month == wage_month)) {
      if (lwf_rule) {
        if (lwf_rule.period_one.to_month == wage_month) {
          var taxslabs = lwf_rule.period_one.lwf_slab;
        }
        else {
          var taxslabs = lwf_rule.period_two.lwf_slab;
        }
        let emp_sel_slab = taxslabs.find(tslab_ext => tslab_ext.wage_from <= gross_earning && gross_earning <= tslab_ext.wage_to);
        if (emp_sel_slab) {
          var ret_lwf_data = {
            employee_contribution: emp_sel_slab.employee_contribution,
            employer_contribution: emp_sel_slab.employer_contribution,
          };
        }
        else {
          var ret_lwf_data = {
            employee_contribution: 0,
            employer_contribution: 0,
          };
        }
      }
      else {
        var ret_lwf_data = {
          employee_contribution: 0,
          employer_contribution: 0,
        };
      }
    }
    else {
      var ret_lwf_data = {
        employee_contribution: 0,
        employer_contribution: 0,
      };
    }
    console.log(ret_lwf_data);
    return ret_lwf_data;
  },
  get_arrear_data: async function (pre_salary_data, curr_salary_breakup) {
    var pre_sal_head = pre_salary_data.heads;
    var curr_sal_head = curr_salary_breakup.heads;
    var head_data = await this.get_arrear_head(pre_sal_head, curr_sal_head);
    // var ctc = (parseFloat(curr_salary_breakup.ctc) - parseFloat(pre_salary_data.ctc));
    // var total_pf_bucket = (parseFloat(curr_salary_breakup.total_pf_wages) - parseFloat(pre_salary_data.total_pf_bucket));
    // var total_pf_wages = (parseFloat(curr_salary_breakup.total_pf_wages) - parseFloat(pre_salary_data.total_pf_wages));
    // var total_esic_bucket = (parseFloat(curr_salary_breakup.total_esi_wages) - parseFloat(pre_salary_data.total_esic_bucket));
    // var total_esic_wages = (parseFloat(curr_salary_breakup.restrict_esic_wages) - parseFloat(pre_salary_data.total_esic_wages));
    // var total_pt_wages = (parseFloat(curr_salary_breakup.total_pt_wages) - parseFloat(pre_salary_data.total_pt_wages));
    // var total_tds_wages = (parseFloat(curr_salary_breakup.total_tds_wages) - parseFloat(pre_salary_data.total_tds_wages));
    // var total_ot_wages = (parseFloat(curr_salary_breakup.total_ot_wages) - parseFloat(pre_salary_data.total_ot_wages));
    // var total_gratuity_wages = (parseFloat(curr_salary_breakup.total_gratuity_wages) - parseFloat(pre_salary_data.total_gratuity_wages));
    // var net_take_home = (parseFloat(curr_salary_breakup.net_take_home) - parseFloat(pre_salary_data.net_take_home));
    // var voluntary_pf_amount = (parseFloat(curr_salary_breakup.voluntary_pf_amount) - parseFloat(pre_salary_data.voluntary_pf_amount));
    // var gross_earning = (parseFloat(curr_salary_breakup.gross_earning) - parseFloat(pre_salary_data.gross_earning));
    // var gross_deduct = (parseFloat(curr_salary_breakup.gross_deduct) - parseFloat(pre_salary_data.gross_deduct));
    // var total_bonus_wages = (parseFloat(curr_salary_breakup.total_bonus_wages) - parseFloat(pre_salary_data.total_bonus_wages));
    // var advance_recovered = (parseFloat(curr_salary_breakup.advance_recovered) - parseFloat(pre_salary_data.advance_recovered));
    var ctc = (parseFloat(pre_salary_data.ctc)); - parseFloat(curr_salary_breakup.ctc)
    var total_pf_bucket = (parseFloat(pre_salary_data.total_pf_bucket)); - parseFloat(curr_salary_breakup.total_pf_wages)
    var total_pf_wages = (parseFloat(pre_salary_data.total_pf_wages)); - parseFloat(curr_salary_breakup.total_pf_wages)
    var total_esic_bucket = (parseFloat(pre_salary_data.total_esic_bucket)); - parseFloat(curr_salary_breakup.total_esi_wages)
    var total_esic_wages = (parseFloat(pre_salary_data.total_esic_wages)); - parseFloat(curr_salary_breakup.restrict_esic_wages)
    var total_pt_wages = (parseFloat(pre_salary_data.total_pt_wages)); - parseFloat(curr_salary_breakup.total_pt_wages)
    var total_tds_wages = (parseFloat(pre_salary_data.total_tds_wages)); - parseFloat(curr_salary_breakup.total_tds_wages)
    var total_ot_wages = (parseFloat(pre_salary_data.total_ot_wages)); - parseFloat(curr_salary_breakup.total_ot_wages)
    var total_gratuity_wages = (parseFloat(pre_salary_data.total_gratuity_wages)); - parseFloat(curr_salary_breakup.total_gratuity_wages)
    var net_take_home = (parseFloat(pre_salary_data.net_take_home)); - parseFloat(curr_salary_breakup.net_take_home)
    var voluntary_pf_amount = (parseFloat(pre_salary_data.voluntary_pf_amount)); - parseFloat(curr_salary_breakup.voluntary_pf_amount)
    var gross_earning = (parseFloat(pre_salary_data.gross_earning)); - parseFloat(curr_salary_breakup.gross_earning)
    var gross_deduct = (parseFloat(pre_salary_data.gross_deduct)); - parseFloat(curr_salary_breakup.gross_deduct)
    var total_bonus_wages = (parseFloat(pre_salary_data.total_bonus_wages)); - parseFloat(curr_salary_breakup.total_bonus_wages)
    var advance_recovered = (parseFloat(pre_salary_data.advance_recovered)); - parseFloat(curr_salary_breakup.advance_recovered)
    var arrear_data = {
      heads: head_data,
      ctc: ctc,
      total_pf_bucket: total_pf_bucket,
      total_pf_wages: total_pf_wages,
      total_esic_bucket: total_esic_bucket,
      total_esic_wages: total_esic_wages,
      total_pt_wages: total_pt_wages,
      total_tds_wages: total_tds_wages,
      total_ot_wages: total_ot_wages,
      total_gratuity_wages: total_gratuity_wages,
      net_take_home: net_take_home,
      voluntary_pf_amount: voluntary_pf_amount,
      gross_earning: gross_earning,
      gross_deduct: gross_deduct,
      total_bonus_wages: total_bonus_wages,
      advance_recovered: advance_recovered,
    };
    return arrear_data;
  },
  get_arrear_head: async function (pre_sal_head, curr_sal_head) {
    const final_arr = new Map();
    for (const obj of curr_sal_head) {
      const head_id = obj.head_id;
      final_arr.set(head_id.toString(), obj);
    }
    for (const obj of pre_sal_head) {
      const id = obj.head_id;
      const existingObj = final_arr.get(id.toString());
      if (existingObj) {
        existingObj.amount -= obj.amount;
      }
      else {
        obj.amount = 0 - obj.amount;
        const head_id2 = obj.head_id;
        final_arr.set(head_id2.toString(), obj)
      }
    }
    var new_array = [];
    final_arr.forEach(element => new_array.push(element));
    return new_array;
  },
  employeeDetailsLeaveCounterAssign: async function (employeeId, leave_temp_data) {
    try {
      var employee_details = await EmployeeDetails.findOne({ 'employee_id': employeeId });
      var documents = [];
      if (employee_details) {
        if (leave_temp_data.template_data.length > 0) {
          for (var i = 0; i <= leave_temp_data.template_data.length - 1; i++) {
            var leaveTempHeadData = await LeaveTempHead.findOne({ '_id': mongoose.Types.ObjectId(leave_temp_data.template_data[i].leave_type) });
            if (leaveTempHeadData) {
              var existEmpdata = await EmployeeDetails.findOne({ 'employee_id': employeeId, 'leave_balance_counter.abbreviation': leaveTempHeadData.abbreviation, 'leave_balance_counter.tenure': leave_temp_data.template_data[i].leave_tenure });

              if (existEmpdata) {
                if (existEmpdata.leave_balance_counter.length > 0) {
                  for (var k = 0; k <= existEmpdata.leave_balance_counter.length - 1; k++) {
                    if (leaveTempHeadData.abbreviation === existEmpdata.leave_balance_counter[k].abbreviation && leave_temp_data.template_data[i].leave_tenure === existEmpdata.leave_balance_counter[k].tenure) {
                      documents.push({
                        '_id': existEmpdata.leave_balance_counter[k]._id,
                        'leave_temp_head_id': existEmpdata.leave_balance_counter[k].leave_temp_head_id,
                        'leave_type_name': existEmpdata.leave_balance_counter[k].leave_type_name,
                        'abbreviation': existEmpdata.leave_balance_counter[k].abbreviation,
                        // 'available': parseFloat(existEmpdata.leave_balance_counter[k].available) + parseFloat(leave_temp_data.template_data[i].no_of_day),
                        'available': parseFloat(existEmpdata.leave_balance_counter[k].available),
                        'consumed': existEmpdata.leave_balance_counter[k].consumed,
                        // 'total_balance': parseFloat(existEmpdata.leave_balance_counter[k].total_balance) + parseFloat(leave_temp_data.template_data[i].no_of_day),
                        'total_balance': parseFloat(existEmpdata.leave_balance_counter[k].total_balance),
                        'tenure': existEmpdata.leave_balance_counter[k].tenure,
                        'carryover': existEmpdata.leave_balance_counter[k].carryover,
                        'quota': leave_temp_data.template_data[i].restriction_days,
                        'encash': "0",
                        'extinguish': "0"
                      });
                    }
                  }
                }

              }
              else {
                documents.push({
                  'leave_temp_head_id': leaveTempHeadData._id,
                  'leave_type_name': leaveTempHeadData.full_name,
                  'abbreviation': leaveTempHeadData.abbreviation,
                  'available': parseFloat(leave_temp_data.template_data[i].restriction_days),
                  // 'available': "0",
                  'consumed': "0",
                  'total_balance': parseFloat(leave_temp_data.template_data[i].restriction_days),
                  // 'total_balance': "0",
                  'tenure': leave_temp_data.template_data[i].leave_tenure,
                  'carryover': "0",
                  'quota': leave_temp_data.template_data[i].restriction_days,
                  'encash': "0",
                  'extinguish': "0"
                });
              }
            }
          }
          var up_document = {};
          up_document["leave_balance_counter"] = documents;
          await EmployeeDetails.updateOne({ 'employee_id': employeeId }, { $set: up_document });
        }
      }

    } catch (e) {
      return {
        status: "error",
        message: e ? e.message : "Something went wrong",
      };
    }
  },
  calculate_consolidated_arrear: async function (consolidated_report, arrear_data) {
    if (consolidated_report == '') {
      consolidated_report = arrear_data;
      consolidated_report.pf_challan_referance_id = '';
      consolidated_report.esic_challan_referance_id = '';
    }
    else {
      var con_pre_sal_head = consolidated_report.heads;
      var con_curr_sal_head = arrear_data.heads;
      var con_head_data = await this.sum_arrear_head(con_pre_sal_head, con_curr_sal_head);
      //var con_head_data=''
      //console.log(pre_sal_head[0],'====',curr_sal_head[0]);
      var ctc = (parseFloat(consolidated_report.ctc) + parseFloat(arrear_data.ctc));
      var total_pf_bucket = (parseFloat(consolidated_report.total_pf_wages) + parseFloat(arrear_data.total_pf_bucket));

      var total_pf_wages = (parseFloat(consolidated_report.total_pf_wages) + parseFloat(arrear_data.total_pf_wages));
      var total_esic_bucket = (parseFloat(consolidated_report.total_esic_bucket) + parseFloat(arrear_data.total_esic_bucket));
      var total_esic_wages = (parseFloat(consolidated_report.total_esic_wages) + parseFloat(arrear_data.total_esic_wages));
      var total_pt_wages = (parseFloat(consolidated_report.total_pt_wages) + parseFloat(arrear_data.total_pt_wages));
      var total_tds_wages = (parseFloat(consolidated_report.total_tds_wages) + parseFloat(arrear_data.total_tds_wages));
      var total_ot_wages = (parseFloat(consolidated_report.total_ot_wages) + parseFloat(arrear_data.total_ot_wages));
      var total_gratuity_wages = (parseFloat(consolidated_report.total_gratuity_wages) + parseFloat(arrear_data.total_gratuity_wages));
      var net_take_home = (parseFloat(consolidated_report.net_take_home) + parseFloat(arrear_data.net_take_home));
      var voluntary_pf_amount = (parseFloat(consolidated_report.voluntary_pf_amount) + parseFloat(arrear_data.voluntary_pf_amount));
      var gross_earning = (parseFloat(consolidated_report.gross_earning) + parseFloat(arrear_data.gross_earning));
      var gross_deduct = (parseFloat(consolidated_report.gross_deduct) + parseFloat(arrear_data.gross_deduct));
      var total_bonus_wages = (parseFloat(consolidated_report.total_bonus_wages) + parseFloat(arrear_data.total_bonus_wages));
      var advance_recovered = (parseFloat(consolidated_report.advance_recovered) + parseFloat(arrear_data.advance_recovered));
      var pt_amount = (parseFloat(consolidated_report.pt_amount) + parseFloat(arrear_data.pt_amount));
      var pf_data = {
        emoloyee_contribution: (consolidated_report.pf_data.emoloyee_contribution + arrear_data.pf_data.emoloyee_contribution),
        total_employer_contribution: (consolidated_report.pf_data.total_employer_contribution + arrear_data.pf_data.total_employer_contribution),
        emoloyer_pf_contribution: (consolidated_report.pf_data.emoloyer_pf_contribution + arrear_data.pf_data.emoloyer_pf_contribution),
        emoloyer_eps_contribution: (consolidated_report.pf_data.emoloyer_eps_contribution + arrear_data.pf_data.emoloyer_eps_contribution),
        emoloyer_edlis_contribution: (consolidated_report.pf_data.emoloyer_edlis_contribution + arrear_data.pf_data.emoloyer_edlis_contribution),
        emoloyer_epf_admin_contribution: (consolidated_report.pf_data.emoloyer_epf_admin_contribution + arrear_data.pf_data.emoloyer_epf_admin_contribution),
        emoloyer_edlis_admin_contribution: (consolidated_report.pf_data.emoloyer_edlis_admin_contribution + arrear_data.pf_data.emoloyer_edlis_admin_contribution),
        eps_wages: (consolidated_report.pf_data.eps_wages + arrear_data.pf_data.eps_wages),
        edlis_wages: (consolidated_report.pf_data.edlis_wages + arrear_data.pf_data.edlis_wages),
        total_pf_wages: (consolidated_report.esic_data.total_pf_wages + arrear_data.esic_data.total_pf_wages),
        restricted_pf_wages: (consolidated_report.esic_data.restricted_pf_wages + arrear_data.esic_data.restricted_pf_wages),
      }
      var esic_data = {
        emoloyee_contribution: (consolidated_report.esic_data.emoloyee_contribution + arrear_data.esic_data.emoloyee_contribution),
        emoloyer_contribution: (consolidated_report.esic_data.emoloyer_contribution + arrear_data.esic_data.emoloyer_contribution),
      }
      var consolidated_report = {
        heads: con_head_data,
        ctc: ctc,
        total_pf_bucket: total_pf_bucket,
        total_pf_wages: total_pf_wages,
        total_esic_bucket: total_esic_bucket,
        total_esic_wages: total_esic_wages,
        total_pt_wages: total_pt_wages,
        total_tds_wages: total_tds_wages,
        total_ot_wages: total_ot_wages,
        total_gratuity_wages: total_gratuity_wages,
        net_take_home: net_take_home,
        voluntary_pf_amount: voluntary_pf_amount,
        gross_earning: gross_earning,
        gross_deduct: gross_deduct,
        total_bonus_wages: total_bonus_wages,
        advance_recovered: advance_recovered,
        pt_amount: pt_amount,
        pf_challan_referance_id: '',
        esic_challan_referance_id: '',
        pf_generate: 'no',
        esic_generate: 'no',
        pf_data: pf_data,
        esic_data: esic_data,
        total_lop: arrear_data.total_lop
      };
    }
    return consolidated_report;
  },
  sum_arrear_head: async function (con_pre_sal_head, con_curr_sal_head) {

    const con_final_arr = new Map();
    for (const con_obj of con_curr_sal_head) {
      const con_head_id = con_obj.head_id;
      con_final_arr.set(con_head_id.toString(), con_obj);
    }
    for (const con_obj of con_pre_sal_head) {
      const con_id = con_obj.head_id;
      const con_existingObj = con_final_arr.get(con_id.toString());
      if (con_existingObj) {
        con_existingObj.amount = con_existingObj.amount + con_obj.amount;
      }
      else {
        con_obj.amount = con_obj.amount;
        //con_obj.amount=0+con_obj.amount;
        const con_head_id2 = con_obj.head_id;
        con_final_arr.set(con_head_id2.toString(), con_obj)
      }
    }
    var con_new_array = [];
    con_final_arr.forEach(element => con_new_array.push(element));
    return con_new_array;
  },
  generate_salary_voucher_pdf: async function (data, pdf_title, pdf_path) {
    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var printer = new PdfPrinter(fonts);
    var salary_data = data.salary_data;


    ///console.log('aa',payroll_section_tb);
    // if (fs.existsSync(file_path+'/'+salary_data.com_logo)) {
    //   var imagelogo= {image: salary_data.com_logo, width: 75,  style: 'tableHeader',  alignment: 'left', border: [true, true, false, false],};
    // }
    // else
    // {
    //   var imagelogo='';
    // }

    if (fs.existsSync(file_path + '/' + salary_data.company_data.com_logo)) {
      var imagelogo = { image: payslip_temp_data.company_logo, width: 75, style: 'tableHeader', alignment: 'left', border: [true, true, false, false], };
    }
    else {
      var imagelogo = '';
    }

    const reg_office_address = salary_data.company_details.reg_office_address;

    const co_est_name = salary_data.company_data.establishment_name ;
    const co_door_no = reg_office_address.door_no;
    const co_street = reg_office_address.street_name;
    const co_locality = reg_office_address.locality;
    const co_district = reg_office_address.district_name;
    const co_state = reg_office_address.state;
    const co_pincode = reg_office_address.pin_code;
    const co_ph_no = salary_data.company_data.phone_no;

    const imageText = `${co_est_name} 

    ${co_door_no ? co_door_no+',' : ''} ${co_street ? co_street+',' : ''} ${co_locality ? co_locality+',' : ''} ${co_district ? co_district+',' : ''} ${co_state ? co_state+',' : ''} ${co_pincode ? co_pincode+',' : ''}

    ${co_ph_no}`

    var textData = "Received by Cash/Cheque Rupees " + await inWords(parseInt(salary_data.net_take_home)) + " From " + salary_data.establishment_name;

    const date = new Date(salary_data.wage_year, salary_data.wage_month, 1);  // 2009-11-10
    const month = date.toLocaleString('default', { month: 'short' });
    var textData2 = "Towards Salary for the month of " + month + '/' + salary_data.wage_year;
    var textData3 = "Receiver: " + salary_data.emp_first_name + " " + salary_data.emp_last_name;
    var textData4 = "Print Date: " + mo(Date.now()).format('DD/MMMM/YYYY');
    var textData5 = "Rs: " + new Intl.NumberFormat().format(parseInt(salary_data.net_take_home)) + '.00';
    var docDefinition = {
      content: [
        {
          style: 'tableExample',
          color: '#000',
          table: {
            widths: ['25%', '75%'],
            headerRows: 1,
            // keepWithHeaderRows: 1,
            body: [
              [
                imagelogo,
                { text: imageText, style: 'tableHeader', alignment: 'center', border: [true, true, true, true,] }
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['38%', '38%', '38%'],
            headerRows: 1,
            // keepWithHeaderRows: 1,
            // margin: [30, 15],
            body: [
              [
                { text: 'Voucher No. _ _ _ _ _ _', style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 10] },
                { text: 'A/c No. _ _ _ _ _ _', style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0,10] },
                { text: 'Work _ _ _ _ _ _', style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 10] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          table: {
            widths: ['100%'],
            headerRows: 1,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: textData, style: 'tableHeader', alignment: 'left', margin: [0, 10], border: [false, false, false, false,] },
              ]
            ]
          }
        },
        {
          style: "tableExample",
          color: '#000',
          table: {
            widths: ['100%'],
            headerRows: 1,
            body: [
              [
                { text: textData2, style: 'tableHeader', alignment: 'left', margin: [0, 0], border: [false, false, false, false,] },
              ]
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          table: {
            widths: ['50%'],
            headerRows: 1,
            body: [
              [
                { text: textData3, style: 'tableHeader', alignment: 'left', margin: [0,0], border: [false, false, false, false,] },
              ]
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          thickness: 50,
          table: {
            widths: ['50%'],
            headerRows: 1,
            body: [
              [
                { text: textData4, style: 'tableHeader', alignment: 'left', margin: [0,0], border: [false, false, false, false,] },
              ]
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          thickness: 5,
          table: {
            widths: ['50%', '50%'],
            headerRows: 1,
            body: [
              [
                { text: textData5, style: 'tableHeader', alignment: 'left', margin: [0, 0], border: [false, false, false, false,] },
                { text: "Signature of the Receiver", style: 'tableHeader', margin: [0, 10, -5, -3], alignment: 'right', border: [false, false, false, false,] },
              ]
            ]
          }
        }
      ],
    };

    var options = {
    }

    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
    pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));
    pdfDoc.end();

    // console.log('called');
    return 'success';
  },
  generate_earning_certificate_pdf: async function (data, pdf_title, pdf_path) {
    return new Promise(async (resolve, reject) => {
      try {
        var fonts = {
          Roboto: {
            normal: 'fonts/Roboto-Regular.ttf',
            bold: 'fonts/Roboto-Medium.ttf',
            italics: 'fonts/Roboto-Italic.ttf',
            bolditalics: 'fonts/Roboto-MediumItalic.ttf'
          }
        };

        var printer = new PdfPrinter(fonts);
        var certificate_data = data.certificate_data;


        // console.log(file_path+'/'+certificate_data.companies.com_logo);
        if (fs.existsSync(file_path + '/' + certificate_data.companies.com_logo)) {
          var imagelogo = { image: certificate_data.companies.com_logo, width: 50, style: 'tableHeader', alignment: 'left', border: [false, false, false, false], margin: [10, 0, 0, 0] };
        }
        else {
          var imagelogo = '';
        }
        // var textData = "Received by Cash/Cheque Rupees "+ await inWords(parseInt(salary_data.employee_monthly_reports.total_data.total_earning)) +" From " + salary_data.companies.establishment_name;

        // const date = new Date(salary_data.employee_monthly_reports.wage_year, salary_data.employee_monthly_reports.wage_month, 1);  // 2009-11-10
        // const month = date.toLocaleString('default', { month: 'short' });
        // var textData2 = "Towards Salary for the month of "+month+'/'+salary_data.employee_monthly_reports.wage_year;
        // var textData3 = "Receiver: "+salary_data.emp_first_name+" "+salary_data.emp_last_name;
        // var textData4 = "Print Date: "+mo(Date.now()).format('DD/MMMM/YYYY');
        // var textData5 = "Rs: "+new Intl.NumberFormat().format(parseInt(salary_data.employee_monthly_reports.total_data.total_earning))+'.00';

        var bankAccountNo = '';
        var establishment_name = '';
        var company_address = '';
        var uan_no = '';
        var date_of_join = '';
        var designation_name = '';
        var department_name = '';
        var client_code = '';
        var esic_no = '';
        if (certificate_data) {
          if (certificate_data.employee_details) {
            if (certificate_data.employee_details.bank_details) {
              if (certificate_data.employee_details.bank_details.account_no) {
                bankAccountNo = certificate_data.employee_details.bank_details.account_no;
              }
            }
            if (certificate_data.employee_details.pf_esic_details) {
              if (certificate_data.employee_details.pf_esic_details.curr_er_epfo_details) {
                uan_no = certificate_data.employee_details.pf_esic_details.curr_er_epfo_details.uan_no;
              }
              if (certificate_data.employee_details.pf_esic_details.curr_er_esic_details) {
                esic_no = certificate_data.employee_details.pf_esic_details.curr_er_esic_details.esic_no;
              }

            }

            if (certificate_data.employee_details.employment_hr_details) {
              date_of_join = certificate_data.employee_details.employment_hr_details.date_of_join;
            }
          }
          if (certificate_data.company_details) {
            if (certificate_data.company_details.details) {
              if (certificate_data.company_details.details.establishment_name) {
                establishment_name = certificate_data.company_details.details.establishment_name;
              }
            }
          }
          if (certificate_data.company_details) {
            if (certificate_data.company_details.reg_office_address) {
              company_address = certificate_data.company_details.reg_office_address.door_no + " " +
                certificate_data.company_details.reg_office_address.street_name + " " +
                certificate_data.company_details.reg_office_address.locality + " " +
                certificate_data.company_details.reg_office_address.district_name + " " +
                certificate_data.company_details.reg_office_address.state + " " +
                certificate_data.company_details.reg_office_address.pin_code;
            }
          }
          if (certificate_data.designation) {
            designation_name = certificate_data.designation.designation_name;
          }
          if (certificate_data.department) {
            department_name = certificate_data.department.department_name;
          }
          if (certificate_data.client) {
            client_code = certificate_data.client.client_code;
          }
        }


        var docDefinition = {
          content: [
            {
              style: 'tableExample',
              color: '#000',

              table: {
                widths: ['90%', '25%'],
                headerRows: 2,
                // keepWithHeaderRows: 1,
                body: [
                  [
                    { text: establishment_name, style: 'tableHeader', alignment: 'center', border: [false, false, false, false,], margin: [120, 10, 0, 0] },
                    imagelogo,
                  ],

                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',

              table: {
                widths: ['115%'],
                headerRows: 3,
                // keepWithHeaderRows: 1,
                body: [
                  [
                    {
                      text: company_address,
                      style: 'tableHeader',
                      alignment: 'center',
                      border: [false, false, false, false,],
                      margin: [0, 0, 0, 0]
                    },
                  ],

                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',

              table: {
                widths: ['115%'],
                headerRows: 4,
                // keepWithHeaderRows: 1,
                body: [
                  [
                    {
                      text: "Earning Certificate for the Period ................",
                      style: 'tableHeader',
                      alignment: 'center',
                      border: [false, false, false, false,],
                      margin: [0, 0, 0, 0]
                    },
                  ],

                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              table: {
                widths: ['58%', '58%'],
                headerRows: 5,
                body: [
                  [
                    { text: 'EMP ID :- ' + certificate_data.emp_id, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [40, 0] },
                    { text: 'Employee Name :- ' + certificate_data.emp_first_name + " " + certificate_data.emp_last_name, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              table: {
                widths: ['58%', '58%'],
                headerRows: 6,
                body: [
                  [
                    { text: 'PF. No :- ' + uan_no, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [40, 0] },
                    { text: 'ESI No :- ' + esic_no, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              table: {
                widths: ['58%', '58%'],
                headerRows: 7,
                body: [
                  [
                    { text: 'Pay Days :- ' + certificate_data.paydays, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [40, 0] },
                    { text: 'DOJ :- ' + date_of_join, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              table: {
                widths: ['58%', '58%'],
                headerRows: 8,
                body: [
                  [
                    { text: 'Designation :- ' + designation_name, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [40, 0] },
                    { text: 'Department :- ' + department_name, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              table: {
                widths: ['58%', '58%'],
                headerRows: 9,
                body: [
                  [
                    { text: 'Client :- ' + client_code, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [40, 0] },
                    { text: 'Bank A/c :- ' + bankAccountNo, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              table: {
                widths: ['58%', '58%'],
                headerRows: 10,
                body: [
                  [
                    { text: 'UAN :- ' + uan_no, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [40, 0] },
                    { text: 'Remarks :- ', style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              setFontType: "bold",
              fontSize: 12,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 11,
                body: [
                  [
                    { text: 'Earnings', style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                    { text: 'Amount', style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                    { text: 'Deductions', style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                    { text: 'Amount', style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 12,
                body: [
                  [
                    { text: 'BASIC', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.basic_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: 'PF', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.pf_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 13,
                body: [
                  [
                    { text: 'HRA', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.hra_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: 'PT', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.pt_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 14,
                body: [
                  [
                    { text: 'Other allo', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.other_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: 'SUP.PF', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '0.00', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 15,
                body: [
                  [
                    { text: 'Lev Enc.(8)', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '0.00', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 16,
                body: [
                  [
                    { text: 'Bonus.Exgr', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.bonus_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 17,
                body: [
                  [
                    { text: 'Arr.Earn', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.arr_earn.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 18,
                body: [
                  [
                    { text: 'Reim.Medi', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: certificate_data.reimbursment_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 19,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 20,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 21,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 12,
              margin: [40, 0],
              table: {
                widths: ['28.75%', '28.75%', '28.75%', '28.75%'],
                headerRows: 22,
                body: [
                  [
                    { text: 'Total', style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                    { text: certificate_data.earning_total_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, true, true, true,], margin: [0, 0] },
                    { text: 'Total', style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                    { text: certificate_data.deductions_total_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, true, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 12,
              margin: [40, 0],
              table: {
                widths: ['114.05%'],
                headerRows: 23,
                body: [
                  [
                    { text: 'Net Pay - ' + certificate_data.net_payment.toFixed(2), style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 12,
              margin: [40, 0],
              table: {
                widths: ['114.05%'],
                headerRows: 24,
                body: [
                  [
                    { text: 'In Words - ' + certificate_data.net_payment_in_words, style: 'tableHeader', alignment: 'left', border: [true, false, true, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 12,
              margin: [40, 0],
              table: {
                widths: ['114.05%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Signature', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 12,
              margin: [40, 0],
              table: {
                widths: ['115%'],
                headerRows: 26,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'right', border: [false, false, false, false,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 10,
              margin: [40, 0],
              table: {
                widths: ['70%', '43.7%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'TDS Details', style: 'tableHeader', alignment: 'center', border: [true, true, false, true,], margin: [0, 0] },
                    { text: 'PAN : ' + certificate_data.pan_no, style: 'tableHeader', alignment: 'right', border: [false, true, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '44.65%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Description', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Gross', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Exempt', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Taxable', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Income Tax Deduction', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Basic Salary', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_basic_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_basic_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Gross Salary', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.earning_total_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'DA', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Profession Tax', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_profession_tax.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'HRA', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_hra_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_hra_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Other Ded. & Standard Ded.', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_other_ded_standard_ded.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Conveyance', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'House Property', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '-' + certificate_data.tds_house_property.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Any Other Allowance', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_other_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_other_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Income from Other Source', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Perquisites', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Total VI-A deduction', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_total_vi_a_deduction.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Other Components', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Taxable Income', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_total_tax_slab_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['17.5%', '17.5%', '17.5%', '17.5%', '22.5%', '22.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Surcharge + Education Cess', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tax_slab_charge_total_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['60%', '35%', '19%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Deduction Under Chapter VI-A', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Tax Deducted(Prev.Emplr+Other)', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['30%', '30%', '30%', '24.3%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Expenditure on Children Education', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_eighty_e_investments_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Tax Deducted Till date', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['30%', '30%', '30%', '24.3%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Housing Loan Repayment', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_eighty_ee_and_eea_investments_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Tax to be Deducted', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: (certificate_data.tds_total_tax_slab_amount - certificate_data.tax_slab_charge_total_amount).toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['30%', '30%', '30%', '24.3%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Life Insurance Premium', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_eighty_ccc_investments_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Monthly Projected Tax', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['29.4%', '29.3%', '55.3%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Public Provident Fund', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_eighty_c_investments_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'Tax Paid Details', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['33%', '33%', '8.25%', '8.25%', '8.25%', '8.25%', '8.25%', '8.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: 'Statutory Provident Fund', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_eighty_g_investments_amount.toFixed(2), style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'APR', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'MAY', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'JUN', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'JUL', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'AUG', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'SEP', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['33%', '33%', '8.25%', '8.25%', '8.25%', '8.25%', '8.25%', '8.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_apr_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_may_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_jun_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_jul_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_aug_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_sep_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['33%', '33%', '8.25%', '8.25%', '8.25%', '8.25%', '8.25%', '8.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'OCT', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'NOV', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'DEC', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'JAN', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'FEB', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: 'MAR', style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
            {
              style: 'tableExample',
              color: '#000',
              fontSize: 9,
              setFontType: "bold",
              margin: [40, 0],
              table: {
                widths: ['33%', '33%', '8.25%', '8.25%', '8.25%', '8.25%', '8.25%', '8.5%'],
                headerRows: 25,
                body: [
                  [
                    { text: '', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                    { text: '', style: 'tableHeader', alignment: 'right', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_oct_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_nov_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_dec_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_jan_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_feb_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                    { text: certificate_data.tds_mar_amount.toFixed(2), style: 'tableHeader', alignment: 'center', border: [true, false, true, true,], margin: [0, 0] },
                  ],
                ]
              }
            },
          ],
        };

        var options = {
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition, options);

        var outputStream = fs.createWriteStream('.' + pdf_path + pdf_title);
        outputStream.on('finish', function () {
          buffer = fs.readFileSync(absolutePath + pdf_path + pdf_title);
          resolve(buffer);
        });
        pdfDoc.pipe(outputStream);
        pdfDoc.end();
        // console.log('called');
        // return 'success';
      } catch (err) {
        throw err
      }
    })
  },
  get_tds_calculate_salary_heads: async function (monthlySalaryHead, tempEarningHead) {
    var headArray = [];
    monthlySalaryHead.map(function (m_heads) {
      if (tempEarningHead.find(head_text => head_text.head_id.equals(m_heads.head_id))) {
        headArray.push(m_heads);
      }
    })
    return headArray;
  },
  generate_bonus_slip_pdf: async function (data, pdf_title, pdf_path) {

    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var printer = new PdfPrinter(fonts);
    var employee_data = data.employee_data;
    var company_address = '';
    var employee_code = '';
    var employee_name = '';
    var employee_client = '';
    var employee_branch = '';
    var employee_department = '';
    var employee_designation = '';
    var employee_hod = '';
    var employee_gender = '';
    var employee_dob = '';
    var employee_doj = '';
    var employee_email = '';
    var employee_phone = '';
    var employee_bank = '';
    var employee_account = '';
    var employee_ifsc = '';
    var employee_account_type = '';
    var employee_aadhar = '';
    var employee_pan = '';
    var employee_uan = '';
    var employee_pf = '';
    var employee_esic_ip_no = '';
    if (employee_data.company_address) {
      company_address = employee_data.company_address.door_no + " " +
        employee_data.company_address.street_name + " " +
        employee_data.company_address.locality + " " +
        employee_data.company_address.district_name + " " +
        employee_data.company_address.state + " " +
        employee_data.company_address.pin_code;
    }
    if (employee_data.emp_id) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('emp_id')) {
          employee_code = employee_data.emp_id || 'N/A';
        }
      }
      else {
        employee_code = employee_data.emp_id || 'N/A';
      }
    }
    if (employee_data.emp_first_name) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('emp_first_name') || employee_data.bonus_slip_temp_data.employee_details.includes('emp_last_name') || employee_data.bonus_slip_temp_data.employee_details.includes('emp_name')) {
          employee_name = employee_data.emp_first_name + " " + employee_data.emp_last_name;
        }
        else if (employee_data.bonus_slip_temp_data.employee_details.includes('emp_first_name')) {
          employee_name = employee_data.emp_first_name;
        }
        else if (employee_data.bonus_slip_temp_data.employee_details.includes('emp_last_name')) {
          employee_name = employee_data.emp_last_name;
        }
      }
      else {
        employee_name = employee_data.emp_first_name + " " + employee_data.emp_last_name;
      }
    }
    if (employee_data.client) {
      if (employee_data.client.client_code) {
        if (employee_data.bonus_slip_temp_data) {
          if (employee_data.bonus_slip_temp_data.employee_details.includes('client_id')
            || employee_data.bonus_slip_temp_data.employee_details.includes('client')
            || employee_data.bonus_slip_temp_data.employee_details.includes('client_code')
          ) {
            employee_client = employee_data.client.client_code || 'N/A';
          }
        }
        else {
          employee_client = employee_data.client.client_code || 'N/A';
        }
      }
    }
    if (employee_data.branch) {
      if (employee_data.branch.branch_name) {
        if (employee_data.bonus_slip_temp_data) {
          if (employee_data.bonus_slip_temp_data.employee_details.includes('branch_id')
            || employee_data.bonus_slip_temp_data.employee_details.includes('branch')
            || employee_data.bonus_slip_temp_data.employee_details.includes('branch_name')
          ) {
            employee_branch = employee_data.branch.branch_name || 'N/A';
          }
        }
        else {
          employee_branch = employee_data.branch.branch_name || 'N/A';
        }
      }
    }
    if (employee_data.department) {
      if (employee_data.department.department_name) {
        if (employee_data.bonus_slip_temp_data) {
          if (employee_data.bonus_slip_temp_data.employee_details.includes('department')) {
            employee_department = employee_data.department.department_name || 'N/A';
          }
        }
        else {
          employee_department = employee_data.department.department_name || 'N/A';
        }
      }
    }
    if (employee_data.designation) {
      if (employee_data.designation.designation_name) {
        if (employee_data.bonus_slip_temp_data) {
          if (employee_data.bonus_slip_temp_data.employee_details.includes('designation')) {
            employee_designation = employee_data.designation.designation_name || 'N/A';
          }
        }
        else {
          employee_designation = employee_data.designation.designation_name || 'N/A';
        }
      }
    }
    if (employee_data.hod) {
      if (employee_data.hod.first_name) {
        if (employee_data.bonus_slip_temp_data) {
          if (employee_data.bonus_slip_temp_data.employee_details.includes('hod')) {
            employee_hod = employee_data.hod.first_name + " " + employee_data.hod.last_name;
          }
        }
        else {
          employee_hod = employee_data.hod.first_name + " " + employee_data.hod.last_name;
        }
      }
    }
    if (employee_data.sex) {
      if (employee_data.sex == 'm') {
        employee_gender = "Male";
      }
      else if (employee_data.sex == 'f') {
        employee_gender = "Female";
      }
      else if (employee_data.sex == 'o') {
        employee_gender = "Other";
      }
      else if (employee_data.sex == 't') {
        employee_gender = "Third Gender";
      }
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('sex') || employee_data.bonus_slip_temp_data.employee_details.includes('gender')) {
          employee_gender = employee_gender;
        }
        else {
          employee_gender = 'N/A';
        }
      }
    }
    if (employee_data.emp_dob) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('emp_dob') || employee_data.bonus_slip_temp_data.employee_details.includes('dob')) {
          employee_dob = employee_data.emp_dob ? mo(employee_data.emp_dob).format('DD/MM/YYYY') : "N/A";
        }
      }
      else {
        employee_dob = employee_data.emp_dob ? mo(employee_data.emp_dob).format('DD/MM/YYYY') : "N/A";
      }
    }
    if (employee_data.date_of_join) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('date_of_join') || employee_data.bonus_slip_temp_data.employee_details.includes('doj')) {
          employee_doj = employee_data.date_of_join ? mo(employee_data.date_of_join).format('DD/MM/YYYY') : "N/A";
        }
      }
      else {
        employee_doj = employee_data.date_of_join ? mo(employee_data.date_of_join).format('DD/MM/YYYY') : "N/A";
      }
    }
    if (employee_data.email_id) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('email_id')) {
          employee_email = employee_data.email_id || 'N/A';
        }
      }
      else {
        employee_email = employee_data.email_id || 'N/A';
      }
    }
    if (employee_data.mobile_no) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('mobile_no') || employee_data.bonus_slip_temp_data.employee_details.includes('phone')) {
          employee_phone = employee_data.mobile_no || 'N/A';
        }
      }
      else {
        employee_phone = employee_data.mobile_no || 'N/A';
      }
    }
    if (employee_data.bank) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('bank_name')) {
          employee_bank = employee_data.bank || 'N/A';
        }
      }
      else {
        employee_bank = employee_data.bank || 'N/A';
      }
    }
    if (employee_data.account_number) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('account_no')) {
          employee_account = employee_data.account_number || 'N/A';
        }
      }
      else {
        employee_account = employee_data.account_number || 'N/A';
      }
    }
    if (employee_data.ifsc) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('ifsc_code')) {
          employee_ifsc = employee_data.ifsc || 'N/A';
        }
      }
      else {
        employee_ifsc = employee_data.ifsc || 'N/A';
      }
    }
    if (employee_data.account_type) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('account_type')) {
          employee_account_type = employee_data.account_type || 'N/A';
        }
      }
      else {
        employee_account_type = employee_data.account_type || 'N/A';
      }
    }
    if (employee_data.aadhar_no) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('aadhar_no')) {
          employee_aadhar = employee_data.aadhar_no || 'N/A';
        }
      }
      else {
        employee_aadhar = employee_data.aadhar_no || 'N/A';
      }
    }
    if (employee_data.pan_no) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('pan_no')) {
          employee_pan = employee_data.pan_no || 'N/A';
        }
      }
      else {
        employee_pan = employee_data.pan_no || 'N/A';
      }
    }
    if (employee_data.uan_no) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('uan_no')) {
          employee_uan = employee_data.uan_no || 'N/A';
        }
      }
      else {
        employee_uan = employee_data.uan_no || 'N/A';
      }
    }
    if (employee_data.pf_no) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('pf_no')) {
          employee_pf = employee_data.pf_no || 'N/A';
        }
      }
      else {
        employee_pf = employee_data.pf_no || 'N/A';
      }
    }
    if (employee_data.esic_ip_no) {
      if (employee_data.bonus_slip_temp_data) {
        if (employee_data.bonus_slip_temp_data.employee_details.includes('esic_ip_no')) {
          employee_esic_ip_no = employee_data.esic_ip_no || 'N/A';
        }
      }
      else {
        employee_esic_ip_no = employee_data.esic_ip_no || 'N/A';
      }
    }


    // console.log(file_path+'/'+employee_data.com_logo);
    if (fs.existsSync(file_path + '/' + employee_data.com_logo)) {
      var imagelogo = { image: employee_data.com_logo, width: 50, style: 'tableHeader', alignment: 'left', border: [false, false, false, false], margin: [40, 20, 0, 0] };
    }
    else {
      var imagelogo = { text: '', style: 'tableHeader', alignment: 'left', valign: "center", border: [false, false, false, false], margin: [40, 20, 0, 0] };
    }
    var advance_details_header = '';
    var advance_details_data = '';
    var monthly_bonus_header_data = "";
    var monthly_bonus_data = [];
    var finalMonthlyWegeData = "";
    var monthly_wise_repport_header = "";
    var monthly_wise_repport_data_header = "";
    var monthly_wise_report_total_sum_data = "";
    // if(){
    advance_details_header = {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '17%'],
        headerRows: 1,
        body: [
          [
            { text: "Bonus type ", style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
            { text: "Bonus Wage", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Bonus Rate", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Bonus Amt", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Advance Recovered", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "TDS", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Statutory Deduction", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Amount Remitted", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
          ],
        ]
      }
    };
    var bonus_type_section_two = '';
    var bonus_wage_section_two = '';
    var bonus_rate_section_two = '';
    var bonus_amt_section_two = '';
    var advance_recovered_section_two = '';
    var tds_section_two = '';
    var statutory_deduction_section_two = '';
    var amount_remitted_section_two = '';
    if (employee_data.bonus_slip_temp_data) {
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
        bonus_type_section_two = employee_data.advance_details.bonus_type;
      }
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')
        || employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-wage')) {
        bonus_wage_section_two = employee_data.advance_details.bonus_wage;
      }
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
        bonus_rate_section_two = employee_data.advance_details.bonus_rate;
      }
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
        bonus_amt_section_two = employee_data.advance_details.bonus_amt;
      }
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
        advance_recovered_section_two = employee_data.advance_details.advance_recovered;
      }
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
        tds_section_two = employee_data.advance_details.tds;
      }
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
        statutory_deduction_section_two = employee_data.advance_details.statutory_deduction;
      }
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
        amount_remitted_section_two = employee_data.advance_details.amount_remitted;
      }
    }
    else {
      bonus_type_section_two = employee_data.advance_details.bonus_type;
      bonus_wage_section_two = employee_data.advance_details.bonus_wage;
      bonus_rate_section_two = employee_data.advance_details.bonus_rate;
      bonus_amt_section_two = employee_data.advance_details.bonus_amt;
      advance_recovered_section_two = employee_data.advance_details.advance_recovered;
      tds_section_two = employee_data.advance_details.tds;
      statutory_deduction_section_two = employee_data.advance_details.statutory_deduction;
      amount_remitted_section_two = employee_data.advance_details.amount_remitted;
    }
    advance_details_data = {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '17%'],
        headerRows: 1,
        body: [
          [
            { text: bonus_type_section_two, style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: bonus_wage_section_two, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: bonus_rate_section_two, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: bonus_amt_section_two, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: advance_recovered_section_two, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: tds_section_two, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_deduction_section_two, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: amount_remitted_section_two, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    };
    // }
    if (employee_data.employee_monthly_reports) {
      if (employee_data.employee_monthly_reports.length > 0) {
        monthly_wise_repport_header = {
          style: 'tableExample',
          color: '#000',
          fontSize: 13,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['115%'],
            headerRows: 1,
            body: [
              [
                { text: "Month wise details", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
              ],
            ]
          }
        };
        monthly_wise_repport_data_header = {
          style: 'tableExample',
          color: '#000',
          fontSize: 12,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "Wage Month", style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                { text: "Bonus wage", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Bonus Rate", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Bonus", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        };
        var total_month_bonus_wage = 0;
        var total_month_bonus_rate = 0;
        var total_month_bonus = 0;

        employee_data.employee_monthly_reports.map(function (month_data) {
          var month_full_date = mo().month(month_data.wage_month).format("MMM");
          var month_bonus_wage = 0;
          var month_bonus_rate = 0;
          var month_bonus = 0;
          if (month_data.bonus_report) {
            if (month_data.bonus_report.bonus_wages) {
              month_bonus_wage = month_data.bonus_report.bonus_wages;
              total_month_bonus_wage += parseFloat(month_data.bonus_report.bonus_wages);
            }
            if (month_data.bonus_report.module_data.bonus_value) {
              month_bonus_rate = month_data.bonus_report.module_data.bonus_value;
              total_month_bonus_rate += parseFloat(month_data.bonus_report.module_data.bonus_value);
            }
            if (month_data.bonus_report) {
              month_bonus = month_data.bonus_report.gross_earning;
              total_month_bonus += parseFloat(month_data.bonus_report.gross_earning);
            }
          }



          monthly_bonus_data.push({
            style: 'tableExample',
            color: '#000',
            fontSize: 9,
            setFontType: "bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
              headerRows: 1,
              body: [
                [
                  { text: month_full_date + " " + month_data.wage_year, style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                  { text: month_bonus_wage, style: 'tableHeader', alignment: 'right', border: [false, false, true, true,], margin: [0, 0] },
                  { text: month_bonus_rate, style: 'tableHeader', alignment: 'right', border: [false, false, true, true,], margin: [0, 0] },
                  { text: month_bonus, style: 'tableHeader', alignment: 'right', border: [false, false, true, true,], margin: [0, 0] },
                ],
              ]
            }
          });
        });
        if (employee_data.bonus_slip_temp_data) {
          if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-details')) {
            monthly_bonus_data = monthly_bonus_data;
          }
          else {
            monthly_bonus_data = [];
          }
        }
        finalMonthlyWegeData = Object.assign(monthly_bonus_data);
        monthly_wise_report_total_sum_data = {
          style: 'tableExample',
          color: '#000',
          fontSize: 12,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: 'Total', style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: total_month_bonus_wage, style: 'tableHeader', alignment: 'right', border: [false, false, true, true,], margin: [0, 0] },
                { text: total_month_bonus_rate, style: 'tableHeader', alignment: 'right', border: [false, false, true, true,], margin: [0, 0] },
                { text: total_month_bonus, style: 'tableHeader', alignment: 'right', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        };
      }
    }
    // console.log(finalMonthlyWegeData);
    var bonus_period = '';
    if (employee_data.bonus_slip_temp_data) {
      if (employee_data.bonus_slip_temp_data.bonus_details.includes('bonus-period')) {
        bonus_period = "Bonus Slip for the Period :" + employee_data.from_time_period + " to " + employee_data.to_time_period;
      }
    }
    else {
      bonus_period = "Bonus Slip for the Period :" + employee_data.from_time_period + " to " + employee_data.to_time_period;
    }
    var docDefinition = {
      content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['20%', '80%'],
            headerRows: 1,
            // keepWithHeaderRows: 1,
            body: [
              [
                imagelogo,
                { text: employee_data.company_name, style: 'tableHeader', alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [0, 20, 0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 1,
            // keepWithHeaderRows: 1,
            body: [
              [
                {
                  text: company_address,
                  style: 'tableHeader',
                  alignment: 'center',
                  border: [false, false, false, false,],
                  margin: [100, 0, 0, 0]
                },
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 1,
            // keepWithHeaderRows: 1,
            body: [
              [
                {
                  text: employee_data.company_phone,
                  style: 'tableHeader',
                  alignment: 'center',
                  border: [false, false, false, false,],
                  margin: [100, 0, 0, 0]
                },
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['115%'],
            headerRows: 1,
            body: [
              [
                { text: bonus_period, style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "Employee Code ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_code, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Employee Name ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_name, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "Client ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_client, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Branch ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_branch, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "Department ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_department, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Designation ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_designation, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "HOD ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_hod, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Gender ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_gender, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "DOB ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_dob, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "DOJ ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_doj, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "Email Id ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_email, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Phone ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_phone, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "Bank Name ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_bank, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Account Number ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_account, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "IFSC Code ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_ifsc, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Account Type ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_account_type, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "Aadhar No ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_aadhar, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "PAN No ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_pan, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "UAN No ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_uan, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "PF No ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_pf, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "ESIC/IP No ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_esic_ip_no, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 1,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
              ],
            ]
          }
        },
        advance_details_header,
        advance_details_data,
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['115%'],
            headerRows: 1,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
              ],
            ]
          }
        },
        monthly_wise_repport_header,
        monthly_wise_repport_data_header,
        finalMonthlyWegeData,
        monthly_wise_report_total_sum_data,
      ],
    };

    var options = {
    }


    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);


    let outData = pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));
    pdfDoc.end();
    // console.log('called');
    return 'success';
  },
  generate_form_e_report_pdf: async function (data, pdf_title, pdf_path) {
    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var printer = new PdfPrinter(fonts);
    var employee_data = data.employee_data;

    var docDefinition = {
      content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 2,
            // keepWithHeaderRows: 1,
            body: [
              [
                {
                  text: "FORM E",
                  style: 'tableHeader',
                  alignment: 'center',
                  border: [false, false, false, false,],
                  margin: [100, 0, 0, 0]
                },
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 3,
            // keepWithHeaderRows: 1,
            body: [
              [
                {
                  text: "FORMAT OF REGISTER OF REST/LEAVE/LEAVE WAGES UNDER",
                  style: 'tableHeader',
                  alignment: 'center',
                  border: [false, false, false, false,],
                  margin: [100, 0, 0, 0]
                },
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 4,
            // keepWithHeaderRows: 1,
            body: [
              [
                {
                  text: "THE MINES ACT,1952, THE SALES PROMOTION EMPLOYEES (CONDITIONS OF SERVICE) ACT, 1976 AND THE WORKING JOURNALISTS (CONDITIONS OF SERVICE) AND MISCELLANEOUS PROVISIONS ACT, 1957",
                  style: 'tableHeader',
                  alignment: 'center',
                  border: [false, false, false, false,],
                  margin: [100, 0, 0, 0]
                },
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['40%', '35%', '25%'],
            headerRows: 5,
            body: [
              [
                { text: "Name of Establishments______________________________", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "Name of Owner______________________________", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "LIN______________________________", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 6,
            body: [
              [
                { text: "For the_______________ Year______________", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['12.5%', '12.5%', '12.5%', '62.5%'],
            headerRows: 7,
            body: [
              [
                { text: "Employee Id", style: 'tableHeader', alignment: 'left', border: [true, true, true, false,], margin: [0, 0] },
                { text: "Name", style: 'tableHeader', alignment: 'left', border: [true, true, true, false,], margin: [0, 0] },
                { text: "No. of days worked in the year", style: 'tableHeader', alignment: 'left', border: [true, true, true, false,], margin: [0, 0] },
                { text: "Details of Compensatory Rest", style: 'tableHeader', alignment: 'center', border: [true, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['13.27%', '13.27%', '13.27%', '12%', '12%', '12%', '12%', '12.20%'],
            headerRows: 8,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },

                { text: "Opening Balance", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Added", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Rest Not Allowed", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Rest Availed", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Closing Balance", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['13.27%', '13.27%', '13.27%', '12%', '12%', '12%', '12%', '12.20%'],
            headerRows: 9,
            body: [
              [
                { text: employee_data.emp_id ? employee_data.emp_id : "", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.emp_first_name ? employee_data.emp_first_name + " " + employee_data.emp_last_name : "", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data ? employee_data.final_data.paydays : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 10,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [5, 5] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['50%', '50%'],
            headerRows: 11,
            body: [
              [
                { text: "Details of Earned Leave", style: 'tableHeader', alignment: 'center', border: [true, true, true, true,], margin: [0, 0] },
                { text: "Details of Medical Leave", style: 'tableHeader', alignment: 'center', border: [true, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%'],
            headerRows: 12,
            body: [
              [
                { text: "Opening Balance", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Added", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Leave Availed", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Closeing Balance ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Opening Balance", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Added", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Leave Availed", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Closeing Balance ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%', '12.5%'],
            headerRows: 13,
            body: [
              [
                { text: employee_data.final_data.earned_leave_details ? employee_data.final_data.earned_leave_details.opening_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.earned_leave_details ? employee_data.final_data.earned_leave_details.added_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.earned_leave_details ? employee_data.final_data.earned_leave_details.leave_avalable_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.earned_leave_details ? employee_data.final_data.earned_leave_details.closeing_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },

                { text: employee_data.final_data.medical_leave_details ? employee_data.final_data.medical_leave_details.opening_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.medical_leave_details ? employee_data.final_data.medical_leave_details.added_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.medical_leave_details ? employee_data.final_data.medical_leave_details.leave_avalable_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.medical_leave_details ? employee_data.final_data.medical_leave_details.closeing_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 14,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [5, 5] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['80%', '20%'],
            headerRows: 15,
            body: [
              [
                { text: "Details of Others Leave", style: 'tableHeader', alignment: 'center', border: [true, true, true, true,], margin: [0, 0] },
                { text: "Remarks", style: 'tableHeader', alignment: 'center', border: [false, true, true, false,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['20%', '20%', '20%', '19.12%', '20.88%'],
            headerRows: 16,
            body: [
              [
                { text: "Opening Balance", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Added", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Leave Availed", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "Closeing Balance ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'center', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['20%', '20%', '20%', '19.12%', '20.88%'],
            headerRows: 16,
            body: [
              [
                { text: employee_data.final_data.other_leave_details ? employee_data.final_data.other_leave_details.opening_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.other_leave_details ? employee_data.final_data.other_leave_details.added_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.other_leave_details ? employee_data.final_data.other_leave_details.leave_avalable_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_data.final_data.other_leave_details ? employee_data.final_data.other_leave_details.closeing_balance : "0", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'center', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 14,
            body: [
              [
                { text: "Note: The Register for the month of january for the year will show the leave Opening Balance for the year also and for the month December will show the Closing Balance for the year.", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 14,
            body: [
              [
                { text: "[F.No. Z-20025/27/2016-LRC]", style: 'tableHeader', alignment: 'right', border: [false, false, false, false,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 14,
            body: [
              [
                { text: "R. K. GUPTA, Jt. Secy.", style: 'tableHeader', alignment: 'right', border: [false, false, false, false,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 14,
            body: [
              [
                { text: "Note:", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 14,
            body: [
              [
                { text: "(1)  The Building and Other Construction Workers (Regulation of Employment and Conditions of Service) Central Rules, 1998 were published in the Gazette of India vide G.S.R. 689(E), dated 19.11.1998 and was lastly amended by G.S.R. 47(E) dated 10.06.2015;", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [50, 0],
          table: {
            widths: ['100%'],
            headerRows: 14,
            body: [
              [
                { text: "(2) The Contract Labour (Regulation and Abolition) Central Rules, 1971 were published in the Gazette of India vide G.S.R. 191, dated 10.02.1971 and was lastly amended by G.S.R. 41(E), dated 21.01.1999;", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },

              ],
            ]
          }
        },
      ],
      pageSize: 'A4',
      pageOrientation: 'landscape',
      fontSize: 12,
    };

    var options = {

    };

    console.log(docDefinition, 'diocoo===');

    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);


    let outData = pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));
    pdfDoc.end();

    return 'success';
  },
  update_leave_summary: async function (data) {
    if (data) {
      switch (data.action_type) {
        case "attendance_leave_summary":
          var attendance_summary_data = await AttendanceSummary.findOne({ emp_id: data.empId, attendance_year: data.year, attendance_month: data.month, });
          var leaveTempHeadData = await LeaveTempHead.find({ 'corporate_id': data.corporateId });
          var monthlyempleavesummary = await MonthlyEmpLeaveSummary.findOne({ corporate_id: data.corporateId, employee_id: mongoose.Types.ObjectId(data.empObjId) }).sort({ _id: -1 });
          var employee_details = await EmployeeDetails.findOne({ employee_id: mongoose.Types.ObjectId(data.empObjId) }, 'leave_balance_counter');
          if (monthlyempleavesummary) {
            if (monthlyempleavesummary.wage_month == parseInt(data.month) && monthlyempleavesummary.wage_year == parseInt(data.year)) {
              return true;
            }
            else {
              if (monthlyempleavesummary) {
                var existSumLeaveData = await MonthlyEmpLeaveSummary.findOne({ corporate_id: data.corporateId, employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year) });
                if (existSumLeaveData) {
                  return true;
                }
                if (attendance_summary_data) {
                  var leaveData = [];
                  var leaveHistoryData = [];
                  leaveTempHeadData.map(async function (headData) {
                    var existLeaveHead = monthlyempleavesummary.leave_head.find(bl_em_head => bl_em_head.head_id.equals(headData._id));
                    if (existLeaveHead) {
                      var oj = 'total_' + existLeaveHead.abbreviation;
                      var minusLeave = attendance_summary_data[oj];
                      if (minusLeave) {
                        var updateBalace = parseFloat(existLeaveHead.balance) - parseFloat(minusLeave);
                        if (updateBalace < 0) {
                          updateBalace = 0;
                        }
                        leaveData.push({
                          'head_id': existLeaveHead.head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(updateBalace),
                        });
                        leaveHistoryData.push({
                          'head_id': existLeaveHead.head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(existLeaveHead.balance),
                        });
                        if (employee_details.leave_balance_counter) {
                          if (employee_details.leave_balance_counter.length > 0) {
                            var empDetailsexistLeaveHead = employee_details.leave_balance_counter.find(bl_em_heads => bl_em_heads.leave_temp_head_id.equals(headData._id));
                            if (empDetailsexistLeaveHead) {
                              var LeaveBalanceCounterdocument = {
                                "leave_balance_counter.$.consumed": parseFloat(empDetailsexistLeaveHead.consumed) + parseFloat(minusLeave),
                                "leave_balance_counter.$.available": updateBalace,
                                "leave_balance_counter.$.total_balance": updateBalace,
                              };
                              await EmployeeDetails.updateOne({ 'employee_id': mongoose.Types.ObjectId(data.empObjId), "leave_balance_counter._id": mongoose.Types.ObjectId(empDetailsexistLeaveHead._id) }, { $set: LeaveBalanceCounterdocument });
                            }
                          }
                        }
                      }
                      else {
                        leaveData.push({
                          'head_id': existLeaveHead.head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(existLeaveHead.balance),
                        });
                        leaveHistoryData.push({
                          'head_id': existLeaveHead.head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(existLeaveHead.balance),
                        });
                      }
                    }
                    else {
                      leaveData.push({
                        'head_id': headData._id,
                        'abbreviation': headData.abbreviation,
                        'balance': 0,
                      });
                      leaveHistoryData.push({
                        'head_id': headData._id,
                        'abbreviation': headData.abbreviation,
                        'balance': 0,
                      });
                    }
                  });
                  MonthlyEmpLeaveSummary.create({
                    'corporate_id': data.corporateId,
                    'employee_id': data.empObjId,
                    'wage_month': data.month,
                    'wage_year': data.year,
                    'leave_head': leaveData,
                    'status': 'active'
                  });
                  EmployeeLeaveSummaryLog.create({
                    'corporate_id': data.corporateId,
                    'employee_id': data.empObjId,
                    'wage_month': data.month,
                    'wage_year': data.year,
                    'history': leaveHistoryData,
                    'type': 'opening',
                    'status': 'active',
                  });
                  EmployeeLeaveSummaryLog.create({
                    'corporate_id': data.corporateId,
                    'employee_id': data.empObjId,
                    'wage_month': data.month,
                    'wage_year': data.year,
                    'history': leaveData,
                    'type': 'closing',
                    'status': 'active',
                  });
                }
              }
            }
          }
          else {
            if (employee_details.leave_balance_counter) {
              if (employee_details.leave_balance_counter.length > 0) {
                if (attendance_summary_data) {
                  var leaveData = [];
                  var leaveHistoryData = [];
                  leaveTempHeadData.map(async function (headData) {
                    var existLeaveHead = employee_details.leave_balance_counter.find(bl_em_head => bl_em_head.leave_temp_head_id.equals(headData._id));
                    if (existLeaveHead) {
                      var oj = 'total_' + existLeaveHead.abbreviation;
                      var minusLeave = attendance_summary_data[oj];
                      if (minusLeave) {
                        var updateBalace = parseFloat(existLeaveHead.total_balance) - parseFloat(minusLeave);
                        if (updateBalace < 0) {
                          updateBalace = 0;
                        }
                        leaveData.push({
                          'head_id': existLeaveHead.leave_temp_head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(updateBalace),
                        });
                        leaveHistoryData.push({
                          'head_id': existLeaveHead.leave_temp_head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(existLeaveHead.total_balance),
                        });
                        var LeaveBalanceCounterdocument = {
                          "leave_balance_counter.$.consumed": minusLeave,
                          "leave_balance_counter.$.available": updateBalace,
                          "leave_balance_counter.$.total_balance": updateBalace,
                        };
                        await EmployeeDetails.updateOne({ 'employee_id': mongoose.Types.ObjectId(data.empObjId), "leave_balance_counter._id": mongoose.Types.ObjectId(existLeaveHead._id) }, { $set: LeaveBalanceCounterdocument });
                      }
                      else {
                        leaveData.push({
                          'head_id': existLeaveHead.leave_temp_head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(existLeaveHead.total_balance),
                        });
                        leaveHistoryData.push({
                          'head_id': existLeaveHead.leave_temp_head_id,
                          'abbreviation': existLeaveHead.abbreviation,
                          'balance': parseFloat(existLeaveHead.total_balance),
                        });
                      }
                    }
                    else {
                      leaveData.push({
                        'head_id': headData._id,
                        'abbreviation': headData.abbreviation,
                        'balance': 0,
                      });
                      leaveHistoryData.push({
                        'head_id': headData._id,
                        'abbreviation': headData.abbreviation,
                        'balance': 0,
                      });
                    }
                  });
                  MonthlyEmpLeaveSummary.create({
                    'corporate_id': data.corporateId,
                    'employee_id': data.empObjId,
                    'wage_month': data.month,
                    'wage_year': data.year,
                    'leave_head': leaveData,
                    'status': 'active'
                  });
                  EmployeeLeaveSummaryLog.create({
                    'corporate_id': data.corporateId,
                    'employee_id': data.empObjId,
                    'wage_month': data.month,
                    'wage_year': data.year,
                    'history': leaveHistoryData,
                    'type': 'opening',
                    'status': 'active',
                  });
                  EmployeeLeaveSummaryLog.create({
                    'corporate_id': data.corporateId,
                    'employee_id': data.empObjId,
                    'wage_month': data.month,
                    'wage_year': data.year,
                    'history': leaveData,
                    'type': 'closing',
                    'status': 'active',
                  });
                }
              }
            }
          }

          break;
        case "earning_leave_summary":
          var employee_details = await EmployeeDetails.findOne({ employee_id: mongoose.Types.ObjectId(data.empObjId) });
          var leaveTempHeadData = await LeaveTempHead.find({ 'corporate_id': data.corporateId });
          if (employee_details.leave_balance_counter) {
            if (employee_details.leave_balance_counter.length > 0) {
              var leaveData = [];
              leaveTempHeadData.map(async function (headData) {
                var empDetailsexistLeaveHead = employee_details.leave_balance_counter.find(bl_em_heads => bl_em_heads.leave_temp_head_id.equals(headData._id));
                if (empDetailsexistLeaveHead) {
                  leaveData.push({
                    'head_id': empDetailsexistLeaveHead.leave_temp_head_id,
                    'abbreviation': empDetailsexistLeaveHead.abbreviation,
                    'balance': parseFloat(empDetailsexistLeaveHead.total_balance),
                  });
                }
                else {
                  leaveData.push({
                    'head_id': headData._id,
                    'abbreviation': headData.abbreviation,
                    'balance': 0,
                  });
                }
              });
            }
          }
          await MonthlyEmpLeaveSummary.findOneAndUpdate({ employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year) }, {
            'corporate_id': data.corporateId,
            'employee_id': data.empObjId,
            'wage_month': data.month,
            'wage_year': data.year,
            'leave_head': leaveData,
            'status': 'active'
          }, { upsert: true, new: true, setDefaultsOnInsert: true });

          if (employee_details.template_data) {
            if (employee_details.template_data.leave_temp_data) {
              if (employee_details.template_data.leave_temp_data.template_data.length > 0) {
                var leaveHistoryData = [];
                leaveTempHeadData.map(async function (headData) {
                  var empDetailsexistLeaveHead = employee_details.template_data.leave_temp_data.template_data.find(bl_em_heads => mongoose.Types.ObjectId(bl_em_heads.leave_type).equals(headData._id));
                  if (empDetailsexistLeaveHead) {
                    leaveHistoryData.push({
                      'head_id': headData._id,
                      'abbreviation': headData.abbreviation,
                      'balance': parseFloat(empDetailsexistLeaveHead.restriction_days),
                    });
                  }
                  else {
                    leaveHistoryData.push({
                      'head_id': headData._id,
                      'abbreviation': headData.abbreviation,
                      'balance': 0,
                    });
                  }
                });
              }
            }
          }
          await EmployeeLeaveSummaryLog.findOneAndUpdate({ employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year), type: "earning" }, {
            'corporate_id': data.corporateId,
            'employee_id': data.empObjId,
            'wage_month': parseInt(data.month),
            'wage_year': parseInt(data.year),
            'history': leaveHistoryData,
            'type': 'earning',
            'status': 'active'
          }, { upsert: true, new: true, setDefaultsOnInsert: true });
          break;
        case "update_time_leave_summary":
          var employee_details = await EmployeeDetails.findOne({ employee_id: mongoose.Types.ObjectId(data.empObjId) }, 'leave_balance_counter');
          var leaveTempHeadData = await LeaveTempHead.find({ 'corporate_id': data.corporateId });
          if (employee_details.leave_balance_counter) {
            if (employee_details.leave_balance_counter.length > 0) {
              var leaveData = [];
              leaveTempHeadData.map(async function (headData) {
                var empDetailsexistLeaveHead = employee_details.leave_balance_counter.find(bl_em_heads => bl_em_heads.leave_temp_head_id.equals(headData._id));
                if (empDetailsexistLeaveHead) {
                  leaveData.push({
                    'head_id': empDetailsexistLeaveHead.leave_temp_head_id,
                    'abbreviation': empDetailsexistLeaveHead.abbreviation,
                    'balance': parseFloat(empDetailsexistLeaveHead.total_balance),
                  });
                }
                else {
                  leaveData.push({
                    'head_id': headData._id,
                    'abbreviation': headData.abbreviation,
                    'balance': 0,
                  });
                }
              });
            }
          }
          await MonthlyEmpLeaveSummary.findOneAndUpdate({ employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year) }, {
            'corporate_id': data.corporateId,
            'employee_id': data.empObjId,
            'wage_month': parseInt(data.month),
            'wage_year': parseInt(data.year),
            'leave_head': leaveData,
            'status': 'active'
          }, { upsert: true, new: true, setDefaultsOnInsert: true });

          var leaveHistoryData = [];
          var existData = await LeaveLog.find({ "employee_id": mongoose.Types.ObjectId(data.empObjId), month: data.month.toString(), year: data.year.toString() });
          var leaveBalanceData = [];
          if (existData.length > 0) {
            existData.map(function (logData) {
              if (employee_details.leave_balance_counter) {
                if (employee_details.leave_balance_counter.length > 0) {
                  var empDetailsleaveBalancedata = employee_details.leave_balance_counter.find(bl_em_heads => mongoose.Types.ObjectId(bl_em_heads._id).equals(logData.employee_details_leave_id));
                  if (empDetailsleaveBalancedata) {
                    leaveBalanceData.push({
                      "leave_temp_head_id": empDetailsleaveBalancedata.leave_temp_head_id,
                      "encash": logData.encash,
                    });
                  }
                }
              }
            });
          }
          leaveTempHeadData.map(async function (headData) {
            if (leaveBalanceData.length > 0) {
              var empDetailsexistLeaveHead = leaveBalanceData.find(bl_em_heads => bl_em_heads.leave_temp_head_id.equals(headData._id));
              if (empDetailsexistLeaveHead) {
                leaveHistoryData.push({
                  'head_id': headData._id,
                  'abbreviation': headData.abbreviation,
                  'balance': parseFloat(empDetailsexistLeaveHead.encash),
                });
              }
              else {
                leaveHistoryData.push({
                  'head_id': headData._id,
                  'abbreviation': headData.abbreviation,
                  'balance': 0,
                });
              }
            }
            else {
              leaveHistoryData.push({
                'head_id': headData._id,
                'abbreviation': headData.abbreviation,
                'balance': 0,
              });
            }
          });
          await EmployeeLeaveSummaryLog.findOneAndUpdate({ employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year), type: "encash" }, {
            'corporate_id': data.corporateId,
            'employee_id': data.empObjId,
            'wage_month': parseInt(data.month),
            'wage_year': parseInt(data.year),
            'history': leaveHistoryData,
            'type': 'encash',
            'status': 'active'
          }, { upsert: true, new: true, setDefaultsOnInsert: true });

          break;

        case "lapsed_and_carry_forward_leave_summary":
          var employee_details = await EmployeeDetails.findOne({ employee_id: mongoose.Types.ObjectId(data.empObjId) }, 'leave_balance_counter');
          var leaveTempHeadData = await LeaveTempHead.find({ 'corporate_id': data.corporateId });
          if (employee_details.leave_balance_counter) {
            if (employee_details.leave_balance_counter.length > 0) {
              var leaveData = [];
              leaveTempHeadData.map(async function (headData) {
                var empDetailsexistLeaveHead = employee_details.leave_balance_counter.find(bl_em_heads => bl_em_heads.leave_temp_head_id.equals(headData._id));
                if (empDetailsexistLeaveHead) {
                  leaveData.push({
                    'head_id': empDetailsexistLeaveHead.leave_temp_head_id,
                    'abbreviation': empDetailsexistLeaveHead.abbreviation,
                    'balance': parseFloat(empDetailsexistLeaveHead.total_balance),
                  });
                }
                else {
                  leaveData.push({
                    'head_id': headData._id,
                    'abbreviation': headData.abbreviation,
                    'balance': 0,
                  });
                }
              });
            }
          }
          await MonthlyEmpLeaveSummary.findOneAndUpdate({ employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year) }, {
            'corporate_id': data.corporateId,
            'employee_id': data.empObjId,
            'wage_month': parseInt(data.month),
            'wage_year': parseInt(data.year),
            'leave_head': leaveData,
            'status': 'active'
          }, { upsert: true, new: true, setDefaultsOnInsert: true });


          var leaveHistoryData = [];
          var leaveHistoryData_1 = [];
          var existData = await LeaveLedgerl.findOne({ "employee_id": mongoose.Types.ObjectId(data.empObjId), month: parseInt(data.month), year: parseInt(data.year) });

          leaveTempHeadData.map(async function (headData) {
            if (existData) {
              var empDetailsexistLeaveHead = existData.lapsed.find(bl_em_heads => bl_em_heads.head_id.equals(headData._id));
              var empDetailsexistLeaveHeads1 = existData.carry_forward.find(bl_em_heads1 => bl_em_heads1.head_id.equals(headData._id));
              if (empDetailsexistLeaveHead) {
                leaveHistoryData.push({
                  'head_id': empDetailsexistLeaveHead.head_id,
                  'abbreviation': empDetailsexistLeaveHead.abbreviation,
                  'balance': parseFloat(empDetailsexistLeaveHead.balance),
                });
              }
              else {
                leaveHistoryData.push({
                  'head_id': headData._id,
                  'abbreviation': headData.abbreviation,
                  'balance': 0,
                });
              }
              if (empDetailsexistLeaveHeads1) {
                leaveHistoryData_1.push({
                  'head_id': empDetailsexistLeaveHeads1.head_id,
                  'abbreviation': empDetailsexistLeaveHeads1.abbreviation,
                  'balance': parseFloat(empDetailsexistLeaveHeads1.balance),
                });
              }
              else {
                leaveHistoryData_1.push({
                  'head_id': headData._id,
                  'abbreviation': headData.abbreviation,
                  'balance': 0,
                });
              }
            }
            else {
              leaveHistoryData.push({
                'head_id': headData._id,
                'abbreviation': headData.abbreviation,
                'balance': 0,
              });
              leaveHistoryData_1.push({
                'head_id': headData._id,
                'abbreviation': headData.abbreviation,
                'balance': 0,
              });
            }
          });
          await EmployeeLeaveSummaryLog.findOneAndUpdate({ employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year), type: "lapsed" }, {
            'corporate_id': data.corporateId,
            'employee_id': data.empObjId,
            'wage_month': parseInt(data.month),
            'wage_year': parseInt(data.year),
            'history': leaveHistoryData,
            'type': 'lapsed',
            'status': 'active'
          }, { upsert: true, new: true, setDefaultsOnInsert: true });

          await EmployeeLeaveSummaryLog.findOneAndUpdate({ employee_id: mongoose.Types.ObjectId(data.empObjId), wage_month: parseInt(data.month), wage_year: parseInt(data.year), type: "carry_forward" }, {
            'corporate_id': data.corporateId,
            'employee_id': data.empObjId,
            'wage_month': parseInt(data.month),
            'wage_year': parseInt(data.year),
            'history': leaveHistoryData_1,
            'type': 'carry_forward',
            'status': 'active'
          }, { upsert: true, new: true, setDefaultsOnInsert: true });
          break;
      }
    }
    return true;
  },
  get_leave_encashment_balance: async function (data) {
    try {
      for (var i = 0; i < data.docs.length; i++) {
        if (data.docs[i].employee_details) {
          var totalBalance = 0;
          var totalEncashBalance = 0;
          if (data.docs[i].employee_details.leave_balance_counter) {
            for (var j = 0; j < data.docs[i].employee_details.leave_balance_counter.length; j++) {
              totalBalance += parseFloat(data.docs[i].employee_details.leave_balance_counter[j].total_balance);
              totalEncashBalance += parseFloat(data.docs[i].employee_details.leave_balance_counter[j].encash);
            }
          }
        }
        data.docs[i].employee_details.total_available_balance = totalBalance;
        data.docs[i].employee_details.total_encash_balance = totalEncashBalance;
      }
      return data
    } catch (err) {
      throw err
    }
  },

  generate_arrear_slip_pdf: async function (data, pdf_title, pdf_path) {
    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var printer = new PdfPrinter(fonts);
    var employee_data = data.employee_data;
    var company_address = '';
    var employee_code = '';
    var employee_name = '';
    var employee_client = '';
    var employee_branch = '';
    var employee_department = '';
    var employee_designation = '';
    var employee_hod = '';
    var employee_gender = '';
    var employee_dob = '';
    var employee_doj = '';
    var employee_email = '';
    var employee_phone = '';
    var employee_bank = '';
    var employee_account = '';
    var employee_ifsc = '';
    var employee_account_type = '';
    var employee_aadhar = '';
    var employee_pan = '';
    var employee_uan = '';
    var employee_pf = '';
    var employee_esic_ip_no = '';
    if (employee_data.company_address) {
      company_address = employee_data.company_address.door_no + " " +
        employee_data.company_address.street_name + " " +
        employee_data.company_address.locality + " " +
        employee_data.company_address.district_name + " " +
        employee_data.company_address.state + " " +
        employee_data.company_address.pin_code;
    }
    if (employee_data.emp_id) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('emp_id')) {
          employee_code = employee_data.emp_id;
        }
      }
      else {
        employee_code = employee_data.emp_id;
      }
    }
    if (employee_data.emp_first_name) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('emp_first_name') || employee_data.arrear_temp_data.employee_details.includes('emp_last_name')) {
          employee_name = employee_data.emp_first_name + " " + employee_data.emp_last_name;
        }
        else if (employee_data.arrear_temp_data.employee_details.includes('emp_first_name')) {
          employee_name = employee_data.emp_first_name;
        }
        else if (employee_data.arrear_temp_data.employee_details.includes('emp_last_name')) {
          employee_name = employee_data.emp_last_name;
        }
      }
      else {
        employee_name = employee_data.emp_first_name + " " + employee_data.emp_last_name;
      }
    }
    if (employee_data.client) {
      if (employee_data.client.client_code) {
        if (employee_data.arrear_temp_data) {
          if (employee_data.arrear_temp_data.employee_details.includes('client_name') || employee_data.arrear_temp_data.employee_details.includes('client')) {
            employee_client = employee_data.client.client_code || 'N/A';
          }
        }
        else {
          employee_client = employee_data.client.client_code || 'N/A';
        }
      }
    }
    if (employee_data.branch) {
      if (employee_data.branch.branch_name) {
        if (employee_data.arrear_temp_data) {
          if (employee_data.arrear_temp_data.employee_details.includes('branch_name') || employee_data.arrear_temp_data.employee_details.includes('branch')) {
            employee_branch = employee_data.branch.branch_name || 'N/A';
          }
        }
        else {
          employee_branch = employee_data.branch.branch_name || 'N/A';
        }
      }
    }
    if (employee_data.department) {
      if (employee_data.department.department_name) {
        if (employee_data.arrear_temp_data) {
          if (employee_data.arrear_temp_data.employee_details.includes('department_name') || employee_data.arrear_temp_data.employee_details.includes('department')) {
            employee_department = employee_data.department.department_name || 'N/A';
          }
        }
        else {
          employee_department = employee_data.department.department_name || 'N/A';
        }
      }
    }
    if (employee_data.designation) {
      if (employee_data.designation.designation_name) {
        if (employee_data.arrear_temp_data) {
          if (employee_data.arrear_temp_data.employee_details.includes('designation_name') || employee_data.arrear_temp_data.employee_details.includes('designation')) {
            employee_designation = employee_data.designation.designation_name || 'N/A';
          }
        }
        else {
          employee_designation = employee_data.designation.designation_name || 'N/A';
        }
      }
    }
    if (employee_data.hod) {
      if (employee_data.hod.first_name) {
        if (employee_data.arrear_temp_data) {
          if (employee_data.arrear_temp_data.employee_details.includes('hod') || employee_data.arrear_temp_data.employee_details.includes('HOD')) {
            employee_hod = employee_data.hod.first_name + " " + employee_data.hod.last_name;
          }
        }
        else {
          employee_hod = employee_data.hod.first_name + " " + employee_data.hod.last_name;
        }
      }
    }
    if (employee_data.sex) {
      if (employee_data.sex == 'm') {
        employee_gender = "Male";
      }
      else if (employee_data.sex == 'f') {
        employee_gender = "Female";
      }
      else if (employee_data.sex == 'o') {
        employee_gender = "Other";
      }
      else if (employee_data.sex == 't') {
        employee_gender = "Third Gender";
      }
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('sex') || employee_data.arrear_temp_data.employee_details.includes('gander')) {
          employee_gender = employee_gender;
        }
        else {
          employee_gender = '';
        }
      }
    }
    if (employee_data.emp_dob) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('emp_dob')) {
          employee_dob = mo(employee_data.emp_dob).format('DD/MM/YYYY');
        }
      }
      else {
        employee_dob = mo(employee_data.emp_dob).format('DD/MM/YYYY');
      }
    }
    if (employee_data.date_of_join) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('date_of_join')) {
          employee_doj = mo(employee_data.date_of_join).format('DD/MM/YYYY');
        }
      }
      else {
        employee_doj = mo(employee_data.date_of_join).format('DD/MM/YYYY');
      }
    }
    if (employee_data.email_id) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('email_id')) {
          employee_email = employee_data.email_id || 'N/A';
        }
      }
      else {
        employee_email = employee_data.email_id || 'N/A';
      }
    }
    if (employee_data.mobile_no) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('mobile_no')) {
          employee_phone = employee_data.mobile_no || 'N/A';
        }
      }
      else {
        employee_phone = employee_data.mobile_no || 'N/A';
      }
    }
    if (employee_data.bank) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('bank_name')) {
          employee_bank = employee_data.bank || 'N/A';
        }
      }
      else {
        employee_bank = employee_data.bank || 'N/A';
      }
    }
    if (employee_data.account_number) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('account_no')) {
          employee_account = employee_data.account_number || 'N/A';
        }
      }
      else {
        employee_account = employee_data.account_number || 'N/A';
      }
    }
    if (employee_data.ifsc) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('ifsc_code')) {
          employee_ifsc = employee_data.ifsc || 'N/A';
        }
      }
      else {
        employee_ifsc = employee_data.ifsc || 'N/A';
      }
    }
    if (employee_data.account_type) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('account_type')) {
          employee_account_type = employee_data.account_type || 'N/A';
        }
      }
      else {
        employee_account_type = employee_data.account_type || 'N/A';
      }
    }
    if (employee_data.aadhar_no) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('aadhar_no')) {
          employee_aadhar = employee_data.aadhar_no || 'N/A';
        }
      }
      else {
        employee_aadhar = employee_data.aadhar_no || 'N/A';
      }
    }
    if (employee_data.pan_no) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('pan_no')) {
          employee_pan = employee_data.pan_no || 'N/A';
        }
      }
      else {
        employee_pan = employee_data.pan_no || 'N/A';
      }
    }
    if (employee_data.uan_no) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('uan_no')) {
          employee_uan = employee_data.uan_no || 'N/A';
        }
      }
      else {
        employee_uan = employee_data.uan_no || 'N/A';
      }
    }
    if (employee_data.pf_no) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('pf_no')) {
          employee_pf = employee_data.pf_no || 'N/A';
        }
      }
      else {
        employee_pf = employee_data.pf_no || 'N/A';
      }
    }
    if (employee_data.esic_ip_no) {
      if (employee_data.arrear_temp_data) {
        if (employee_data.arrear_temp_data.employee_details.includes('esic_ip_no')) {
          employee_esic_ip_no = employee_data.esic_ip_no || 'N/A';
        }
      }
      else {
        employee_esic_ip_no = employee_data.esic_ip_no || 'N/A';
      }
    }


    // console.log(file_path+'/'+employee_data.com_logo);
    if (fs.existsSync(file_path + '/' + employee_data.com_logo)) {
      var imagelogo = { image: employee_data.com_logo, width: 50, style: 'tableHeader', alignment: 'left', border: [false, false, false, false], margin: [40, 20, 0, 0] };
    }
    else {
      var imagelogo = { text: '', style: 'tableHeader', alignment: 'left', valign: "center", border: [false, false, false, false], margin: [40, 20, 0, 0] };
    }
    var arrear_details_header = '';
    var arrear_details_data = '';
    var monthly_bonus_header_data = "";
    var monthly_arrear_data = [];
    if (employee_data.month_wise_arrear) {
      if (employee_data.month_wise_arrear.length > 0) {
        employee_data.month_wise_arrear.map(function (month_wise) {
          monthly_arrear_data.push({
            style: 'tableExample',
            color: '#000',
            fontSize: 9,
            setFontType: "bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%', '28.75%', '28.75%', '30%'],
              headerRows: 25,
              body: [
                [
                  { text: month_wise.wage_month, style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                  { text: month_wise.pre_earn_gross, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: month_wise.post_earn_gross, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: month_wise.arrear, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                ],
              ]
            }
          });
        })
      }
    }

    arrear_details_header = {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '17%'],
        headerRows: 25,
        body: [
          [
            { text: "Earnings ", style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
            { text: "Previous", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Revised", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Arrear", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Deductions", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Amt", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Contribution", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Amt", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
          ],
        ]
      }
    };
    var statutory_deduction_pf = '';
    var statutory_contribution_pf = '';
    var statutory_deduction_esic = '';
    var statutory_contribution_esic = '';
    var statutory_deduction_pt = '';
    var statutory_contribution_pt = '';
    var statutory_deduction_tds = '';
    var statutory_contribution_tds = '';
    var footer_message = '';

    var basic_amount_pre = 0;
    var basic_amount_current = 0;
    var basic_amount_arrear = 0;
    var total_ot_wages_pre = 0;

    var hra_amount_pre = 0;
    var hra_amount_current = 0;
    var hra_amount_arrear = 0;
    var total_ot_wages_current = 0;

    var others_amount_pre = 0;
    var others_amount_current = 0;
    var others_amount_arrear = 0;
    var total_ot_wages_arrear = 0;

    if (employee_data.revision_reports) {
      if (employee_data.revision_reports.consolidated_arrear_report) {
        if (employee_data.arrear_temp_data) {
          if (employee_data.arrear_temp_data.statutory_deduction.includes('PF')) {
            statutory_deduction_pf = employee_data.revision_reports.consolidated_arrear_report.total_pf_bucket;
          }
          if (employee_data.arrear_temp_data.statutory_contribution.includes('PF')) {
            statutory_contribution_pf = employee_data.revision_reports.consolidated_arrear_report.total_pf_wages;
          }
          if (employee_data.arrear_temp_data.statutory_deduction.includes('ESIC')) {
            statutory_deduction_esic = employee_data.revision_reports.consolidated_arrear_report.total_esic_bucket;
          }
          if (employee_data.arrear_temp_data.statutory_contribution.includes('ESIC') || employee_data.arrear_temp_data.statutory_contribution.includes('EPS')) {
            statutory_contribution_esic = employee_data.revision_reports.consolidated_arrear_report.pf_data.emoloyer_eps_contribution;
          }
          if (employee_data.arrear_temp_data.statutory_deduction.includes('PT')) {
            statutory_deduction_pt = employee_data.revision_reports.consolidated_arrear_report.total_pt_wages;
          }
          if (employee_data.arrear_temp_data.statutory_contribution.includes('PT')) {
            statutory_contribution_pt = employee_data.revision_reports.consolidated_arrear_report.pf_data.emoloyer_epf_admin_contribution + employee_data.revision_reports.consolidated_arrear_report.pf_data.emoloyer_edlis_admin_contribution;
          }
          if (employee_data.arrear_temp_data.statutory_deduction.includes('TDS')) {
            statutory_deduction_tds = employee_data.revision_reports.consolidated_arrear_report.total_tds_wages;
          }
          if (employee_data.arrear_temp_data.statutory_contribution.includes('TDS')) {
            statutory_contribution_tds = employee_data.revision_reports.consolidated_arrear_report.total_esic_wages;
          }
        }
        else {
          statutory_deduction_pf = employee_data.revision_reports.consolidated_arrear_report.total_pf_bucket;
          statutory_contribution_pf = employee_data.revision_reports.consolidated_arrear_report.total_pf_wages;
          statutory_deduction_esic = employee_data.revision_reports.consolidated_arrear_report.total_esic_bucket;
          statutory_contribution_esic = employee_data.revision_reports.consolidated_arrear_report.pf_data.emoloyer_eps_contribution;
          statutory_deduction_pt = employee_data.revision_reports.consolidated_arrear_report.total_pt_wages;
          statutory_contribution_pt = employee_data.revision_reports.consolidated_arrear_report.pf_data.emoloyer_epf_admin_contribution + employee_data.revision_reports.consolidated_arrear_report.pf_data.emoloyer_edlis_admin_contribution;
          statutory_deduction_tds = employee_data.revision_reports.consolidated_arrear_report.total_tds_wages;
          statutory_contribution_tds = employee_data.revision_reports.consolidated_arrear_report.total_esic_wages;
        }
        var basicValueCr = employee_data.revision_reports.consolidated_arrear_report.heads.find(element => element.head_abbreviation === 'Basic' || element.head_abbreviation === 'basic');
        var hraValueCr = employee_data.revision_reports.consolidated_arrear_report.heads.find(element => element.head_abbreviation === 'hra' || element.head_abbreviation === 'HRA');
        await Promise.all(employee_data.revision_reports.consolidated_arrear_report.heads.map(function (head) {
          if (head.head_abbreviation !== 'hra' && head.head_abbreviation !== 'HRA' && head.head_abbreviation !== 'Basic' && head.head_abbreviation !== 'basic') {
            others_amount_current += parseFloat(head.amount);
          }
        }));
        if (basicValueCr) {
          basic_amount_current = parseFloat(basicValueCr.amount);
        }
        if (hraValueCr) {
          hra_amount_current = parseFloat(hraValueCr.amount);
        }
        total_ot_wages_current = employee_data.revision_reports.consolidated_arrear_report.total_ot_wages;
      }

    }
    if (employee_data.arrear_temp_data) {
      footer_message = employee_data.arrear_temp_data.signature_message;
    }
    if (employee_data.month_wise_monthly_report) {
      if (employee_data.month_wise_monthly_report.heads.length > 0) {
        var basicValue = employee_data.month_wise_monthly_report.heads.find(element => element.head_abbreviation === 'Basic' || element.head_abbreviation === 'basic');
        var hraValue = employee_data.month_wise_monthly_report.heads.find(element => element.head_abbreviation === 'hra' || element.head_abbreviation === 'HRA');
        await Promise.all(employee_data.month_wise_monthly_report.heads.map(function (head) {
          if (head.head_abbreviation !== 'hra' && head.head_abbreviation !== 'HRA' && head.head_abbreviation !== 'Basic' && head.head_abbreviation !== 'basic') {
            others_amount_pre += parseFloat(head.amount);
          }
        }));

        if (basicValue) {
          basic_amount_pre = parseFloat(basicValue.amount);
        }
        if (hraValue) {
          hra_amount_pre = parseFloat(hraValue.amount);
        }
      }
      total_ot_wages_pre = employee_data.month_wise_monthly_report.total_ot_wages;
    }
    basic_amount_arrear = (parseFloat(basic_amount_current) - parseFloat(basic_amount_pre));
    hra_amount_arrear = (parseFloat(hra_amount_current) - parseFloat(hra_amount_pre));
    others_amount_arrear = (parseFloat(others_amount_current) - parseFloat(others_amount_pre));
    total_ot_wages_arrear = (parseFloat(total_ot_wages_current) - parseFloat(total_ot_wages_pre));

    arrear_details_data = [{
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '17%'],
        headerRows: 25,
        body: [
          [
            { text: "Basic", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: basic_amount_pre, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: basic_amount_current, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: basic_amount_arrear, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "EPF", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_deduction_pf, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "EPF", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_contribution_pf, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '17%'],
        headerRows: 25,
        body: [
          [
            { text: "HRA", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: hra_amount_pre, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: hra_amount_current, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: hra_amount_arrear, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "ESIC", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_deduction_esic, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "EPS", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_contribution_esic, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '17%'],
        headerRows: 25,
        body: [
          [
            { text: "Other", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: others_amount_pre, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: others_amount_current, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: others_amount_arrear, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "PT", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_deduction_pt, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "Admin+EDLI", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_contribution_pt, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '14.375%', '17%'],
        headerRows: 25,
        body: [
          [
            { text: "Overtime", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: total_ot_wages_pre, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: total_ot_wages_current, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: total_ot_wages_arrear, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "TDS", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_deduction_tds, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "ESIC", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: statutory_contribution_tds, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['19.5%', '19.5%', '19.5%', '19.5%', '19.5%', '19.3%'],
        headerRows: 25,
        body: [
          [
            { text: "Gross Earning", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: employee_data.revision_reports ? employee_data.revision_reports.consolidated_arrear_report ? employee_data.revision_reports.consolidated_arrear_report.gross_earning : "0" : "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "Net Pay", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: employee_data.revision_reports ? employee_data.revision_reports.consolidated_arrear_report ? employee_data.revision_reports.consolidated_arrear_report.net_take_home : "0" : "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "CTC", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: employee_data.revision_reports ? employee_data.revision_reports.consolidated_arrear_report ? employee_data.revision_reports.consolidated_arrear_report.ctc : "0" : "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 12,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['100%'],
        headerRows: 25,
        body: [
          [
            { text: "Others", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['28.75%', '28.75%', '28.75%', '30%'],
        headerRows: 25,
        body: [
          [
            { text: "Payments", style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
            { text: employee_data?.advance_report?.opening_balance, style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Deductions", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: employee_data?.reimbursment_report?.gross_deduct, style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['28.75%', '28.75%', '28.75%', '30%'],
        headerRows: 25,
        body: [
          [
            { text: "Advance Given", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: employee_data?.advance_report?.closing_balance, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "Advance Recovered", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: employee_data?.advance_report?.advance_recovered, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['28.75%', '28.75%', '28.75%', '30%'],
        headerRows: 25,
        body: [
          [
            { text: "Reimbursement", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: employee_data?.reimbursment_report?.net_take_home, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "Fine", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['28.75%', '28.75%', '28.75%', '30%'],
        headerRows: 25,
        body: [
          [
            { text: "", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "Breakage", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['28.75%', '28.75%', '28.75%', '30%'],
        headerRows: 25,
        body: [
          [
            { text: "", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
            { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "Other Deduction", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
            { text: "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 12,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['100%'],
        headerRows: 25,
        body: [
          [
            { text: "Month wise details", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
          ],
        ]
      }
    },
    {
      style: 'tableExample',
      color: '#000',
      fontSize: 9,
      setFontType: "bold",
      margin: [40, 0],
      table: {
        widths: ['28.75%', '28.75%', '28.75%', '30%'],
        headerRows: 25,
        body: [
          [
            { text: "Wage Month", style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
            { text: "Pre-revision Earned Gross", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Post revision Earned Gross", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
            { text: "Arrear", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
          ],
        ]
      }
    },
      monthly_arrear_data
    ];

    var docDefinition = {
      content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['20%', '80%'],
            headerRows: 2,
            // keepWithHeaderRows: 1,
            body: [
              [
                imagelogo,
                { text: employee_data.company_name, style: 'tableHeader', alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [0, 20, 0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 3,
            // keepWithHeaderRows: 1,
            body: [
              [
                {
                  text: company_address,
                  style: 'tableHeader',
                  alignment: 'center',
                  border: [false, false, false, false,],
                  margin: [100, 0, 0, 0]
                },
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 4,
            // keepWithHeaderRows: 1,
            body: [
              [
                {
                  text: employee_data.company_phone,
                  style: 'tableHeader',
                  alignment: 'center',
                  border: [false, false, false, false,],
                  margin: [100, 0, 0, 0]
                },
              ],

            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['115%'],
            headerRows: 25,
            body: [
              [
                { text: "Bonus Slip for the Period :" + employee_data.from_time_period + " to " + employee_data.to_time_period, style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "Employee Code ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_code, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Employee Name ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_name, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "Client ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_client, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Branch ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_branch, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "Department ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_department, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Designation ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_designation, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "HOD ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_hod, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Gender ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_gender, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "DOB ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_dob, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "DOJ ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_doj, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "Email Id ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_email, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Phone ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_phone, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "Bank Name ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_bank, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Account Number ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_account, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "IFSC Code ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_ifsc, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "Account Type ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_account_type, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "Aadhar No ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_aadhar || 'N/A', style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "PAN No ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_pan || 'N/A', style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "UAN No ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_uan, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "PF No ", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: employee_pf, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "ESIC/IP No ", style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                { text: employee_esic_ip_no, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 10,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['28.75%', '28.75%', '28.75%', '29.75%'],
            headerRows: 25,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 5] },
              ],
            ]
          }
        },
        arrear_details_header,
        arrear_details_data,
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [40, 10],
          table: {
            widths: ['115%'],
            headerRows: 25,
            body: [
              [
                { text: footer_message, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
              ],
            ]
          }
        },
      ],
    };

    var options = {
    }

    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);


    pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));
    pdfDoc.end();

    // console.log('called');
    return 'success';
  },
  generate_arrear_revision_history_report_pdf: async function (data, pdf_title, pdf_path) {
    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var printer = new PdfPrinter(fonts);
    var employee_data = data.employee_data;
    var tableData = [];
    var pre_gross_salary = 0;
    var pre_sal_template = '';
    if (employee_data) {
      if (employee_data.employee_details) {
        if (employee_data.employee_details.employment_hr_details) {
          if (employee_data.employee_details.employment_hr_details.gross_salary) {
            pre_gross_salary = employee_data.employee_details.employment_hr_details.gross_salary;
          }
        }
      }
      if (employee_data.salery_templates) {
        pre_sal_template = employee_data.salery_templates.template_name;
      }
    }
    if (employee_data.revision) {
      if (employee_data.revision.length > 0) {
        var i = 1;
        employee_data.revision.map(function (revi) {
          tableData.push({
            style: 'tableExample',
            color: '#000',
            fontSize: 9,
            setFontType: "bold",
            margin: [80, 0],
            table: {
              widths: ['10%', '18%', '14%', '14%', '14%', '14%', '14%', '14%', '14%'],
              headerRows: 2,
              body: [
                [
                  { text: i, style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                  { text: revi.revision_unique_id, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: "01/" + revi.revision_month + '/' + revi.revision_year, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: mo(revi.effect_from).format('DD/MM/YYYY'), style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: pre_gross_salary, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: pre_sal_template, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: revi.gross_salary, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: revi.template_data.salary_temp_data.template_name, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                ],
              ]
            }
          });
          i++;
        });
      }
    }
    var docDefinition = {
      content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 2,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [5, 5] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 12,
          setFontType: "bold",
          margin: [80, 0],
          table: {
            widths: ['100%'],
            headerRows: 2,
            body: [
              [
                { text: "Revision History for Emp Id - " + employee_data.emp_id + " Name - " + employee_data.emp_first_name + " " + employee_data.emp_last_name, style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 12,
          setFontType: "bold",
          margin: [80, 0],
          table: {
            widths: ['100%'],
            headerRows: 2,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, false, false,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [80, 0],
          table: {
            widths: ['10%', '18%', '14%', '14%', '14%', '14%', '14%', '14%', '14%'],
            headerRows: 2,
            body: [
              [
                { text: "Sl No", style: 'tableHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                { text: "Revision No", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Date of revision", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Effective from", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Prev Gross", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Perv Sal Template", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Rev Gross", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Rev Sal Temp", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Revised By", style: 'tableHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        tableData
      ],
      // pageSize: 'A4',
      // pageOrientation: 'landscape',
      // fontSize: 12,
    };

    var options = {

    };

    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);


    pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));
    pdfDoc.end();

    // console.log('called');
    return 'success';
  },
  generate_arrear_revision_history_log_report_pdf: async function (data, pdf_title, pdf_path) {
    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var printer = new PdfPrinter(fonts);
    var employee_data = data.employee_data;
    var tableData = [];
    if (employee_data.revision_log) {
      if (employee_data.revision_log.length > 0) {
        var i = 1;
        for (var l = 0; l < employee_data.revision_log.length; l++) {
          tableData.push({
            style: 'tableExample',
            color: '#000',
            fontSize: 8,
            setFontType: "bold",
            margin: [40, 0],
            table: {
              widths: ['11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%'],
              headerRows: 4,
              body: [
                [
                  { text: (l + 1), style: 'tableHeader', alignment: 'left', border: [true, false, true, true,], margin: [0, 0] },
                  { text: employee_data.emp_id, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: employee_data.emp_first_name + " " + employee_data.emp_last_name, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: employee_data.revision_log[l].revision_data ? employee_data.revision_log[l].revision_data.revision_unique_id : "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: mo(employee_data.revision_log[l].revision_date).format('DD/MM/YYYY'), style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: employee_data.revision_log[l].revision_data ? employee_data.revision_log[l].revision_data.gross_salary : "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: employee_data.revision_log[l].revision_data ? employee_data.revision_log[l].revision_data.template_data.salary_temp_data.template_name : "0", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: employee_data.revision_log[l].gross_salary, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: employee_data.revision_log[l].template_data.salary_temp_data.template_name, style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                  { text: "", style: 'tableHeader', alignment: 'left', border: [false, false, true, true,], margin: [0, 0] },
                ],
              ]
            }
          });
          var revision_unique_id = "";
          if (employee_data.revision_log[l].revision_data.revision_unique_id) {
            revision_unique_id = employee_data.revision_log[l].revision_data.revision_unique_id;
          }
        };
      }
    }

    var docDefinition = {
      content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['100%'],
            headerRows: 2,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [5, 5] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          setFontType: "bold",
          margin: [40, 0],
          table: {
            widths: ['11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%', '11.5%'],
            headerRows: 3,
            body: [
              [
                { text: "Sl No", style: 'columnHeader', alignment: 'left', border: [true, true, true, true,], margin: [0, 0] },
                { text: "Emp Id", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Name", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Rev No", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Date", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Prev Gross", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Prev Sal Template", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Rev Gross", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Rev Sal Template", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
                { text: "Revised BY", style: 'columnHeader', alignment: 'left', border: [false, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        tableData
      ],
      pageSize: 'A4',
      // pageOrientation: 'landscape',
      fontSize: 12,
    };

    var options = {

    };

    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);


    pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));

    pdfDoc.end();

    // console.log('called');
    return 'success';
  },
  update_advance_history(entity, emp_data, recovery_from) {

  },
  generate_credit_purchase_invoice_pdf: async function (data, pdf_title, pdf_path) {
    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var printer = new PdfPrinter(fonts);
    var purchase_data = data.purchase_data;
    var company_details = data.company_details;
    var template = data.template;
    var admin_setting = data.admin_setting;
    var company_address = "";
    if (company_details) {
      if (company_details.reg_office_address) {
        company_address = company_details.reg_office_address.door_no + " " +
          company_details.reg_office_address.street_name + " " +
          company_details.reg_office_address.locality + " " +
          company_details.reg_office_address.district_name + " " +
          company_details.reg_office_address.state + " " +
          company_details.reg_office_address.pin_code;
      }
    }


    var docDefinition = {
      content: [
        {
          style: 'tableExample',
          color: '#000',
          margin: [40, 0],
          table: {
            widths: ['150%'],
            headerRows: 2,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 3,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Tax Invoice", style: 'tableHeader', alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          margin: [40, 0],
          table: {
            widths: ['150%'],
            headerRows: 4,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "", style: 'tableHeader', alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 12,
          margin: [100, 0],
          removeTagClasses: true,
          table: {
            widths: ['50%', '50%', '53.13%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, true, true, true,], margin: [0, 0] },
                { text: "Invoice No.", style: 'columnHeader', alignment: 'left', valign: "center", border: [false, true, true, true,], margin: [0, 0] },
                { text: "Dated", style: 'columnHeader', alignment: 'left', valign: "center", border: [false, true, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          removeTagClasses: true,
          table: {
            widths: ['50%', '50%', '53.13%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: template ? cheerio.load(template.com_address).text() : "", html: true, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: purchase_data.inv_id ? purchase_data.inv_id : "", style: 'columnHeader', alignment: 'left', valign: "center", border: [false, false, true, true,], margin: [0, 0] },
                { text: purchase_data.created_at ? mo(purchase_data.created_at).format('DD/MM/YYYY') : "", style: 'columnHeader', alignment: 'left', valign: "center", border: [false, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          removeTagClasses: true,
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Buyer (Bill to)", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          removeTagClasses: true,
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: company_details?.details?.establishment_name, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: company_address ? company_address : "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "GSTIN/UIN: " + company_details?.establishment?.gst_no, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "PAN/IT No: " + company_details?.establishment?.pan_numberc, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "State Name : " + company_details?.reg_office_address?.state + ", Code : " + company_details?.reg_office_address?.state_code, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Place of Supply : " + company_details?.reg_office_address?.state, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Description", style: "columnHeader", alignment: 'center', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "HSN/SAC", style: "columnHeader", alignment: 'center', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "GST", style: "columnHeader", alignment: 'center', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "Amount", style: "columnHeader", alignment: 'center', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: purchase_data?.payment_details?.description, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: template?.hsn_sac, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: admin_setting?.gst_amount + "%", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: purchase_data ? parseFloat(purchase_data.credit_amount).toFixed(2) : "0.00", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, false,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, false,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, false,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, false,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "IGST @" + admin_setting?.gst_amount + "%", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: purchase_data ? parseFloat(purchase_data.igst).toFixed(2) : "0.00", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "CGST @" + admin_setting?.gst_amount * global_tax_cgst / 100 + "%", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: purchase_data ? parseFloat(purchase_data.cgst).toFixed(2) : "0.00", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "SGST @" + admin_setting?.gst_amount * global_tax_sgst / 100 + "%", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: purchase_data ? parseFloat(purchase_data.sgst).toFixed(2) : "0.00", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Round Off", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: purchase_data ? parseFloat(purchase_data.round_off).toFixed(2) : "0.00", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['39%', '39%', '39%', '37.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Total", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: purchase_data ? (parseFloat(purchase_data.credit_amount) + parseFloat(purchase_data.gst_amount) - parseFloat(purchase_data.round_off)).toFixed(2) : "0.00", style: "columnHeader", alignment: 'right', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['76.28%', '75.24%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Amount Chargeable (in words)", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: await inWords(parseInt(purchase_data ? (parseFloat(purchase_data.credit_amount)).toFixed(2) : "0.00")), style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['76.28%', '75.24%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Tax Amount (in words)  :", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: await inWords(parseInt(purchase_data ? (parseFloat(purchase_data.gst_amount) - parseFloat(purchase_data.round_off)).toFixed(2) : "0.00")), style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['76.28%', '75.24%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Remarks:", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: "Company's Bank Details", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['76.28%', '75.24%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "BILL NO : " + purchase_data?.inv_id, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
                { text: template ? cheerio.load(template.com_bank_details).text() : "", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },

              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Buyer's VAT TIN : " + company_details?.establishment?.gst_no, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Company's PAN : " + company_details?.establishment?.pan_numberc, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Declaration:", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: template?.declaration, style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['44%', '37%', '37%', '36.85%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: "Customer's Seal and Signature", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 30, 0, 0] },
                { text: "Prepared by", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 30, 0, 0] },
                { text: "Prepared by", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 30, 0, 0] },
                { text: "Authorised Signatory", style: "columnHeader", alignment: 'left', valign: "center", border: [true, false, true, true,], margin: [0, 30, 0, 0] },
              ],
            ]
          }
        },
        {
          style: 'tableExample',
          color: '#000',
          fontSize: 9,
          margin: [100, 0],
          table: {
            widths: ['150%'],
            headerRows: 5,
            // keepWithHeaderRows: 1,
            body: [
              [
                { text: template?.footer_text, style: "columnHeader", alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [0, 5, 0, 0] },
              ],
            ]
          }
        },

      ],
    };

    var options = {

    };

    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);


    pdfDoc.pipe(fs.createWriteStream('.' + pdf_path + pdf_title));

    pdfDoc.end();

    // console.log('called');
    return 'success';
  },
  createFiles: function (file, file_name, corporate_id, nestedFolders) {
    try {

      // storage/company/ivn123/temp_files/salary-report/xyz.xlsx 
      // ||
      // storage/company/ivn123/cold_storage/payslip/2023/jan/xyz-jan-2023.pdf
      let currentPath = `storage/company/${corporate_id}/`;

      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath);
      }

      const folders = nestedFolders.split('/');

      folders.forEach((folder) => {
        currentPath = path.join(currentPath, folder);

        if (!fs.existsSync(currentPath)) {
          fs.mkdirSync(currentPath);
        }
      });

      // nestedFolders.split("/").forEach(folder =>{
      //   if (!await fs.existsSync(location)) {
      //     await fs.mkdirSync(location);
      //   }
      // })
      const location = `storage/company/${corporate_id}/${nestedFolders}/`;

      // Create the folder if it does not exist.

      // Generate the filename.
      // let filename;
      // if (wage_month && wage_year) {
      //    filename = `${file_name}-${wage_month}-${wage_year}.${file_type}`;
      // }else{
      //   filename = `${file_name}.xlsx`;
      // }

      // Save the file.
      if (file) {
        // fs.chmod(absolutePath +'/'+ location + file_name, 0o755);
        // fs.createWriteStream(location + file_name, {mode: 0o777})
        file.write(location + file_name, 0o777);
        // console.log(absolutePath +'/'+ location + file_name);
      }

      return { file_name, location: ('/' + location) };
    } catch (err) {
      throw err
    }
  },

  download: function (file_name, file_path, corporate_id, resp) {
    let absulateData = path.join(absolutePath, file_path, file_name);
    setTimeout(async function () {
      return resp.download(absulateData);
    }, 5000);
  },
  downloadAndDelete: async function (file_name, file_path, corporate_id, resp) {
    try {
      let relPath = path.join("./" + file_path, file_name);
      let absulatePath = path.join(absolutePath, file_path, file_name);
      setTimeout(async function () {
        await downloadFile(absulatePath, relPath, resp);
      }, 5000);
    } catch (err) {
      throw err
    }
  },
  driect_download: function (file_path, corporate_id, resp) {
    let absulateData = path.join(absolutePath, file_path);
    setTimeout(async function () {
      return resp.download(absulateData);
    }, 5000);
  },
  generate_esic_7a_export_docx: async function (data, pdf_title, pdf_path) {
    return new Promise(async (resolve, reject) => {
      var certificate_data = data.certificate_data;

      const doc = new docx.Document({
        sections: [
          {
            properties: {},
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                children: [
                  new docx.TextRun({
                    text: "ESIC – Med – 7A",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "Application for Acceptance for Medical Treatment",
                    bold: true,
                    underline: {
                      type: docx.UnderlineType.SINGLE,
                    },
                    fontSize: 24,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "With reference to certificate of employment on reverse I apply for",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "acceptance by Dr………………………………………………………………………………………………",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "With whom I was already registered.",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Dated ………………………                                            Signature or Thumb Impression of the insured person.",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "I accept the person whose particulars are given on reverse on my list.",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Date ………………………                                                                              Signature and Code No. of Doctor",
                    fontSize: 12,
                  }),
                ],
              }),
            ],
          },
        ],
      });
      const fsp = require("fs").promises;
      docx.Packer.toBuffer(doc).then((buffer) => {
        var outputStream = fsp.writeFile(path.join(absolutePath, pdf_path, pdf_title), buffer);
        resolve(outputStream);
      });
      // return 'success';
    });
  },
  generate_esic_37_export_docx: async function (data, pdf_title, pdf_path) {
    return new Promise(async (resolve, reject) => {
      var certificate_data = data.certificate_data;
      var company_address = '';
      var branchCodeNo = '';
      var branchSubCodeNo = '';
      var branchIncNo = '';
      var dateOfJoin = '';
      if (certificate_data) {
        if (certificate_data.company_details) {
          if (certificate_data.company_details.reg_office_address) {
            company_address = certificate_data.company_details.reg_office_address.door_no + " " +
              certificate_data.company_details.reg_office_address.street_name + " " +
              certificate_data.company_details.reg_office_address.locality + " " +
              certificate_data.company_details.reg_office_address.district_name + " " +
              certificate_data.company_details.reg_office_address.state + " " +
              certificate_data.company_details.reg_office_address.pin_code;
          }
          if (certificate_data?.company_details?.company_branch) {
            if (certificate_data?.company_details?.company_branch.length > 0) {
              var main_branch = certificate_data?.company_details?.company_branch[0]._id;
              var employee_branch = certificate_data?.employee_details?.employment_hr_details?.branch;
              branchCodeNo = certificate_data?.company_details?.company_branch[0]?.esic_registration_no;
              branchIncNo = certificate_data?.company_details?.company_branch[0]?.esic_lin_no;
              if (mongoose.Types.ObjectId(main_branch).equals(mongoose.Types.ObjectId(employee_branch)) === false) {
                var sub_branch = certificate_data?.company_details?.company_branch.find(branch_text => mongoose.Types.ObjectId(branch_text._id).equals(mongoose.Types.ObjectId(employee_branch)));
                if (sub_branch?.status == 'active') {
                  branchSubCodeNo = sub_branch?.esic_registration_no;
                  branchIncNo = sub_branch?.esic_lin_no;
                }
              }
            }
          }
        }
        if (certificate_data?.employee_details?.employment_hr_details?.date_of_join) {
          dateOfJoin = mo(certificate_data?.employee_details?.employment_hr_details?.date_of_join).format('MM/DD/YYYY');
        }
      }
      const doc = new docx.Document({
        sections: [
          {
            properties: {},
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                children: [
                  new docx.TextRun({
                    text: "ESIC MED– 37",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "Employees’ State Insurance Corporation",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "Certificate of Re-employment / continuing Employment",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "(To be issued only if condition (i) or (ii) below are satisfied.)",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Name and Address of the employer :     " + certificate_data?.company_details?.details?.establishment_name,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "                                                                " + company_address,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "                                                               Code No. " + branchCodeNo,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "                                                               Sub code. " + branchSubCodeNo,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "                                                               L.O.",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Certified that Shri " + certificate_data?.emp_first_name + " " + certificate_data?.emp_last_name,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "s/o : " + certificate_data?.emp_father_name,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "                                                               Ins. No. " + branchIncNo,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "i. Has continued to be in employment/re-entered insurable employment on " + dateOfJoin,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "and contributions have been payable/paid in respect of him/her during the",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "contribution period which began on " + certificate_data?.esic_form_date + ".",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "ii. Has paid contribution for seventy eight  days in the preceding contribution period",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "which ended on " + certificate_data?.esic_to_date + ".",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Date :                                                                                                                                Signature and Designation",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "NOTE :- This certificate is valid for 9 months from the date indicated under (i) or (ii) above.  ",
                    fontSize: 12,
                  }),
                ],
              }),
            ],
          },
        ],
      });
      docx.Packer.toBuffer(doc).then((buffer) => {
        var outputStream = fs.writeFileSync(path.join(absolutePath, pdf_path, pdf_title), buffer);
        resolve(outputStream);
      });
    });

    // return 'success';
  },
  gratuity_l_export_docx: async function (pdf_title, pdf_path) {
    return new Promise(async (resolve, reject) => {
      const doc = new docx.Document({
        sections: [
          {
            properties: {},
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "FORM 'L'",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "[See clause (i) of sub-rule (1) of rule 8]",
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "Notice for payment of gratuity",
                    bold: true,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "To ………………………………………………………………………………………………………. ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "             [Name and address of the applicant employee/nominee/1egal heir]",
                    bold: false,
                    fontSize: 12
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.BOTH,
                children: [
                  new docx.TextRun({
                    text: "You are hereby informed as required under clause (i) of sub-rule (1) of rule 8 of the Payment of Gratuity (Central) Rules, 1972 that a sum of Rs. ………..…. (Rupees………………………..………… ……………………………………………………………..) is payable to you as gratuity/as your share of gratuity in terms of nomination made by ………..…… on………….… and ……………… recorded in this ……….………as a legal heir of …………….. an employee of this ……………... establishment. ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "2. Please call at ………………………………..….. [Here specify place] on …………………. [Date] at ……………… [Time] for collecting your payment in cash/open or crossed cheque. ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "3. Amount payable shall be sent to you by Postal Money Order at the address given in your application after deducting the Postal Money Order commission, as desired by you.",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "Brief statement of calculation ",
                    bold: true,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "1. Total period of service of the employee ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "          concerned: : ……………… year ………….. months. 2. Wages last drawn. : ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "3. Proportion of the admission gratuity payable in",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "      terms of nomination/as a legal heir. : ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "4. Amount payable. : ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun({
                    text: "",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Place : Signature of the employer/ Date : Authorised Officer",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "                                                                                                                                    Name or description of",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                children: [
                  new docx.TextRun({
                    text: "establishment of rubber stamp hereof.",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Copy to: the Controlling Authority: ",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                children: [
                  new docx.TextRun({
                    text: "Note: Strike out the words not applicable.",
                    bold: false,
                    fontSize: 12,
                  }),
                ],
              }),

            ],
          },
        ],
      });
      const fsp = require("fs").promises;
      docx.Packer.toBuffer(doc).then((buffer) => {
        var outputStream = fsp.writeFile(path.join(absolutePath, pdf_path, pdf_title), buffer);
        resolve(outputStream);
      });
      // return 'success';
    });
  },


};
async function downloadFile(absulatePath, relPath, resp) {
  // console.log('path12===>', absulatePath);
  if (fs.existsSync(absulatePath)) {
    // console.log('in the downloadFile');
    return resp.download(absulatePath, async (err) => {
      if (err) {
        console.error(err);
        throw err; // Propagate the error
      }
      // File download completed successfully
      console.log('File downloaded successfully.');
      await deleteFile(absulatePath, relPath);
    });
  } else {
    console.log('File not found:', absulatePath);
    throw new Error('File not found');
  }
}

async function deleteFile(absulatePath, relPath) {
  console.log('path===>', absulatePath)
  if (fs.existsSync(absulatePath)) {
    fs.rm(relPath, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('File deleted successfully.');
      }
    });
  }
  else {
    deleteFile(absulatePath, relPath);
  }
}


async function inWords(num) {
  var a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  var b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return 'zero'; var str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? ' ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : '';
  return str;
}