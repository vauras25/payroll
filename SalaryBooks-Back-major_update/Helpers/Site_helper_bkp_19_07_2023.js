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
var LeaveTempHead = require("../Model/Admin/LeaveTempHead");
var Epforule = require("../Model/Admin/Epforule");
var Esicrule = require("../Model/Admin/Esicrule");
var User = require("../Model/Admin/User");
var LwfRule = require('../Model/Admin/LwfRule');
var Ptaxrule = require("../Model/Admin/Ptaxrule");
const mongoose = require("mongoose");
var pdf = require("pdf-creator-node");
var PdfPrinter = require('pdfmake');
var fs = require("fs");

var db = require("../db");
var mo = require("moment");
const e = require("express");
//var fs = require('fs'),
///request = require('request');
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
      var myAggregate = await User.aggregate([
        { $match: { status: "active", user_type: "super_admin" } },
        {
          $project: {
            _id: 1,
            user_id: 1,
            corporate_id: 1,
          },
        },
        ]);
      var admin_data = await User.aggregatePaginate(myAggregate, options);
      return admin_data.docs[0].corporate_id;
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
  calculate_attendance_time: async function(attendance_data,emp_attendance_temp)
  {
    var total_late =0;
    var total_late_hour =0;
    var total_lop= 0;
    var cal_attendance_val=0;
    var total_overtime=0;
    var full_day_max_hours = parseFloat(emp_attendance_temp.full_day_max_hours);
    var half_day_max_hours = parseFloat(emp_attendance_temp.half_day_max_hours);
    var grace_period = emp_attendance_temp.grace_period;
    var shift_data = attendance_data.shift_data;
    if(shift_data)
    {
      if(total_attendance_summ.shift_allowance[shift_data._id])
      {
        total_attendance_summ.shift_allowance[shift_data._id] =total_attendance_summ.shift_allowance[shift_data._id]+1
      }
      else
      {
        total_attendance_summ.shift_allowance[shift_data._id]=1;
      }
      if(shift_data.break_shift == 'yes')
      {
        var reporting_time = shift_data.shift1_start_time;
        var closing_time = shift_data.shift1_end_time;
        var reporting_time2 = shift_data.shift2_start_time;
        var closing_time2 = shift_data.shift2_end_time;
        var attendence_start = attendance_data.login_time;
        var attendence_end = attendance_data.logout_time;
        var attendence_start = attendance_data.shift1_start_time;
        var attendence_end = attendance_data.shift1_end_time;

        var attendence_start2 = attendance_data.shift2_start_time;
        var attendence_end2 = attendance_data.shift2_end_time;
        var total_break_time = attendance_data.total_break_time;
        var reporting_start_time=  Site_helper.get_time_to_current_time(reporting_time);
        var reporting_closing_time= Site_helper.get_time_to_current_time(closing_time);
        var reporting_start_time2=  Site_helper.get_time_to_current_time(reporting_time2);
        var reporting_closing_time2= Site_helper.get_time_to_current_time(closing_time2);
        var attendence_start_time=Site_helper.get_time_to_current_time(attendence_start);
        var attendence_end_time=Site_helper.get_time_to_current_time(attendence_end);
        var attendence_start_time2=Site_helper.get_time_to_current_time(attendence_start2);
        var attendence_end_time2=Site_helper.get_time_to_current_time(attendence_end2);


        if(shift_data.company_early_arrival == 'no')
        {
          attendence_start_time= reporting_start_time;
          attendence_start_time2= reporting_start_time2;
        }
        if(shift_data.company_late_allowed == 'no')
        {
          if(attendence_end_time > reporting_closing_time)
          {
            var total_overtime= (attendence_end_time - reporting_closing_time);
            attendence_end_time= reporting_closing_time;
          }      
          var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;    
        }
        else
        {
          var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;
          if(total_logged_in > full_day_max_hours)
          {
            var total_overtime= (total_logged_in - full_day_max_hours);
            total_logged_in = (total_logged_in - total_overtime);
          }  
        }


        if(shift_data.company_late_allowed == 'no')
        {
          if(attendence_end_time > reporting_closing_time)
          {
            total_overtime= ( total_overtime + (attendence_end_time - reporting_closing_time));
            attendence_end_time= reporting_closing_time;
          } 
          if(attendence_end_time2 > reporting_closing_time2)
          {
            total_overtime= ( total_overtime + (attendence_end_time2 - reporting_closing_time2));
            attendence_end_time2= reporting_closing_time2;
          }  
          var total_logged_in = ((( (attendence_end_time - attendence_start_time) + ( attendence_end_time2 - attendence_start_time2)) / 60) - total_break_time);       
        }
        else
        {
          var total_logged_in =  ((( (attendence_end_time - attendence_start_time) + ( attendence_end_time2 - attendence_start_time2)) / 60) - total_break_time);   
          if(total_logged_in > full_day_max_hours)
          {
            total_overtime= (total_logged_in - full_day_max_hours);
            total_logged_in = (total_logged_in - total_overtime);
          }  
        }
        if(shift_data.company_late_allowed == 'no' && shift_data.company_early_arrival == 'no')
        {
          if (attendence_start_time2 > reporting_start_time2 || attendence_start_time > reporting_start_time) {
            total_late = 1;
            total_late_hour = attendence_start_time - reporting_start_time;
          }
        }
      }
      else
      {
        var reporting_time = shift_data.shift1_start_time;
        var closing_time = shift_data.shift1_end_time;
        var attendence_start = attendance_data.shift1_start_time;
        var attendence_end = attendance_data.shift1_end_time;
        var total_break_time = attendance_data.total_break_time;
        var reporting_start_time=Site_helper.get_time_to_current_time(reporting_time);
        var reporting_closing_time=Site_helper.get_time_to_current_time(closing_time);

        var attendence_start_time=Site_helper.get_time_to_current_time(attendence_start);
        var attendence_end_time=Site_helper.get_time_to_current_time(attendence_end);


        if(shift_data.company_early_arrival == 'no')
        {
          attendence_start_time= reporting_start_time;
        }

        
        if(shift_data.company_late_allowed == 'no')
        {
          if(attendence_end_time > reporting_closing_time)
          {
            var total_overtime= (attendence_end_time - reporting_closing_time);
            attendence_end_time= reporting_closing_time;
          }      
          var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;    
        }
        else
        {
          var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;
          if(total_logged_in > full_day_max_hours)
          {
            var total_overtime= (total_logged_in - full_day_max_hours);
            total_logged_in = (total_logged_in - total_overtime);
          }  
        }
        if(shift_data.company_late_allowed == 'no' && shift_data.company_early_arrival == 'no')
        {
          if (attendence_start_time > reporting_start_time) {
            total_late = 1;
            total_late_hour = attendence_start_time - reporting_start_time;
          }
        }
      }
    }
    else
    {
      var full_day_max_hours = emp_attendance_temp.full_day_max_hours;
      var half_day_max_hours = emp_attendance_temp.half_day_max_hours;
      var grace_period = emp_attendance_temp.grace_period;
      var reporting_time = emp_attendance_temp.reporting_time;
      var closing_time = emp_attendance_temp.closing_time;

      var attendence_start = attendance_data.login_time;
      var attendence_end = attendance_data.logout_time;
      var total_break_time = attendance_data.total_break_time ? parseFloat(attendance_data.total_break_time):0;
      var attendence_time_start= this.get_time_to_current_time(attendence_start);
      var attendence_time_end=this.get_time_to_current_time(attendence_end);
      var reporting_time_start=this.get_time_to_current_time(reporting_time);
      var reporting_time_end=this.get_time_to_current_time(closing_time);
      reporting_time_start = reporting_time_start + parseFloat(grace_period);
      var total_logged_in = ((( attendence_time_end - attendence_time_start) / 60) - total_break_time) ;

      if (attendence_time_start > reporting_time_start) {
        total_late = 1;
        total_late_hour = attendence_time_start - reporting_time_start;
      }
    }
    if (total_logged_in >= half_day_max_hours) {
      if (total_logged_in >= full_day_max_hours) {
        cal_attendance_val = 1;
        total_overtime = (total_logged_in - full_day_max_hours);
      } else {
        cal_attendance_val = 0.5;
      }
      //total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
    } else {
      total_lop=1;
      //total_attendance_summ.total_lop = total_attendance_summ.total_lop + 1;
    }
    var calculated_data={
      attendance_stat : attendance_data.attendance_stat,
      attendance_val : cal_attendance_val,
      total_late : total_late,
      total_late_hour : total_late_hour,
      total_overtime : total_overtime,
      total_lop : total_lop,
    }
    return calculated_data
  },
  // calculate_attendance_day: async function( attendance_data, emp_attendance_temp ) {
  //     if (emp_attendance_temp.register_type === "halfday") {
  //       var attendance_val = 0.5;
  //       var calculated_data={
  //         attendance_stat : attendance_data.attendance_stat,
  //         attendance_val : cal_attendance_val,
  //         total_late : total_late,
  //         total_late_hour : total_late_hour,
  //         total_overtime : total_overtime,
  //         total_lop : total_lop,
  //       }
  //       //return calculated_data
  //       switch (attendance_data.first_half) {
  //         case "PDL":
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "P":
  //           total_attendance_summ.total_present =
  //             total_attendance_summ.total_present + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "H":
  //           total_attendance_summ.holiday =
  //             total_attendance_summ.holiday + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "L":
  //           total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //           if(total_attendance_summ.total_late_hour){
  //               total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //           }
  //         else{
  //           total_attendance_summ.total_late_hour = total_late_hour;
  //         }
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "A":
  //           total_attendance_summ.total_absent =
  //             total_attendance_summ.total_absent + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "OT":
  //           total_attendance_summ.total_overtime =
  //             total_attendance_summ.total_overtime + attendance_val;
  //           break;
  //         case "CSL":
  //           total_attendance_summ.total_CSL =
  //             total_attendance_summ.total_CSL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PVL":
  //           total_attendance_summ.total_PVL =
  //             total_attendance_summ.total_PVL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ERL":
  //           total_attendance_summ.total_ERL =
  //             total_attendance_summ.total_ERL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "SKL":
  //           total_attendance_summ.total_SKL =
  //             total_attendance_summ.total_SKL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MDL":
  //           total_attendance_summ.total_MDL =
  //             total_attendance_summ.total_MDL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MTL":
  //           total_attendance_summ.total_MTL =
  //             total_attendance_summ.total_MTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PTL":
  //           total_attendance_summ.total_PTL =
  //             total_attendance_summ.total_PTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ANL":
  //           total_attendance_summ.total_ANL =
  //             total_attendance_summ.total_ANL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "AWP":
  //           total_attendance_summ.total_AWP =
  //             total_attendance_summ.total_AWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "UWP":
  //           total_attendance_summ.total_UWP =
  //             total_attendance_summ.total_UWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "LE1":
  //           total_attendance_summ.total_LE1 =
  //             total_attendance_summ.total_LE1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LE2":
  //           total_attendance_summ.total_LE2 =
  //             total_attendance_summ.total_LE2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP1":
  //           total_attendance_summ.total_LP1 =
  //             total_attendance_summ.total_LP1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP2":
  //           total_attendance_summ.total_LP2 =
  //             total_attendance_summ.total_LP2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "WO":
  //           total_attendance_summ.total_wo =
  //             total_attendance_summ.total_wo + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //       }
  //       switch (attendance_data.second_half) {
  //         case "PDL":
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "P":
  //           total_attendance_summ.total_present =
  //             total_attendance_summ.total_present + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "H":
  //           total_attendance_summ.holiday =
  //             total_attendance_summ.holiday + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "L":
  //           total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //           if(total_attendance_summ.total_late_hour){
  //             total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //         }
  //         else{
  //           total_attendance_summ.total_late_hour = total_late_hour;
  //         }
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "A":
  //           total_attendance_summ.total_absent =
  //             total_attendance_summ.total_absent + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "OT":
  //           total_attendance_summ.total_overtime =
  //             total_attendance_summ.total_overtime + attendance_val;
  //           break;
  //         case "CSL":
  //           total_attendance_summ.total_CSL =
  //             total_attendance_summ.total_CSL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PVL":
  //           total_attendance_summ.total_PVL =
  //             total_attendance_summ.total_PVL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ERL":
  //           total_attendance_summ.total_ERL =
  //             total_attendance_summ.total_ERL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "SKL":
  //           total_attendance_summ.total_SKL =
  //             total_attendance_summ.total_SKL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MDL":
  //           total_attendance_summ.total_MDL =
  //             total_attendance_summ.total_MDL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MTL":
  //           total_attendance_summ.total_MTL =
  //             total_attendance_summ.total_MTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PTL":
  //           total_attendance_summ.total_PTL =
  //             total_attendance_summ.total_PTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ANL":
  //           total_attendance_summ.total_ANL =
  //             total_attendance_summ.total_ANL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "AWP":
  //           total_attendance_summ.total_AWP =
  //             total_attendance_summ.total_AWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "UWP":
  //           total_attendance_summ.total_UWP =
  //             total_attendance_summ.total_UWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "LE1":
  //           total_attendance_summ.total_LE1 =
  //             total_attendance_summ.total_LE1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LE2":
  //           total_attendance_summ.total_LE2 =
  //             total_attendance_summ.total_LE2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP1":
  //           total_attendance_summ.total_LP1 =
  //             total_attendance_summ.total_LP1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP2":
  //           total_attendance_summ.total_LP2 =
  //             total_attendance_summ.total_LP2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "WO":
  //           total_attendance_summ.total_wo =
  //             total_attendance_summ.total_wo + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //       }
  //     } else {
  //       var attendance_val = 1;
  //       switch (attendance_data.attendance_stat) {
  //         case "PDL":
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "P":
  //           total_attendance_summ.total_present =
  //             total_attendance_summ.total_present + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "H":
  //           total_attendance_summ.holiday =
  //             total_attendance_summ.holiday + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "L":
  //           total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //           if(total_attendance_summ.total_late_hour){
  //             total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //         }
  //         else{
  //           total_attendance_summ.total_late_hour = total_late_hour;
  //         }
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "A":
  //           total_attendance_summ.total_absent =
  //             total_attendance_summ.total_absent + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "OT":
  //           total_attendance_summ.total_overtime =
  //             total_attendance_summ.total_overtime + attendance_val;
  //           break;
  //         case "CSL":
  //           total_attendance_summ.total_CSL =
  //             total_attendance_summ.total_CSL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PVL":
  //           total_attendance_summ.total_PVL =
  //             total_attendance_summ.total_PVL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ERL":
  //           total_attendance_summ.total_ERL =
  //             total_attendance_summ.total_ERL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "SKL":
  //           total_attendance_summ.total_SKL =
  //             total_attendance_summ.total_SKL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MDL":
  //           total_attendance_summ.total_MDL =
  //             total_attendance_summ.total_MDL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MTL":
  //           total_attendance_summ.total_MTL =
  //             total_attendance_summ.total_MTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PTL":
  //           total_attendance_summ.total_PTL =
  //             total_attendance_summ.total_PTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ANL":
  //           total_attendance_summ.total_ANL =
  //             total_attendance_summ.total_ANL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "AWP":
  //           total_attendance_summ.total_AWP =
  //             total_attendance_summ.total_AWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "UWP":
  //           total_attendance_summ.total_UWP =
  //             total_attendance_summ.total_UWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "LE1":
  //           total_attendance_summ.total_LE1 =
  //             total_attendance_summ.total_LE1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LE2":
  //           total_attendance_summ.total_LE2 =
  //             total_attendance_summ.total_LE2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP1":
  //           total_attendance_summ.total_LP1 =
  //             total_attendance_summ.total_LP1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP2":
  //           total_attendance_summ.total_LP2 =
  //             total_attendance_summ.total_LP2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "WO":
  //           total_attendance_summ.total_wo =
  //             total_attendance_summ.total_wo + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //       }
  //     }
  //   return total_attendance_summ;
  // },
  // calculate_attendance_data:async function(
  //   attendance_data,
  //   total_attendance_summ,
  //   leavehead,
  //   emp_attendance_temp,
  //   shift = null,
  //   shift_data = null
  // ) {
  //   // return (attendance_data,
  //   //   total_attendance_summ,
  //   //   leavehead,
  //   //   emp_attendance_temp);
  //     if (emp_attendance_temp.register_type === "time") {
  //       var attendance_date=new Date(attendance_data.attendance_date);
  //       //console.log('time',shift.shift_start_date,attendance_date,shift.shift_end_date);
  //       var attendance_val = 1;
  //       var absent_day = 0;
  //       var total_late =0;
  //       var total_late_hour =0;
  //       var total_lop= 0;
  //       var cal_attendance_val=0;
  //       var total_overtime=0;
  //       var full_day_max_hours = parseFloat(emp_attendance_temp.full_day_max_hours);
  //       var half_day_max_hours = parseFloat(emp_attendance_temp.half_day_max_hours);
  //       var grace_period = emp_attendance_temp.grace_period;
  //       //console.log(shift.shift_start_date , attendance_date , attendance_date , shift.shift_end_date)
  //       var shift_data = attendance_data.shift_data;
  //       //console.log('shift_data',shift_data);
  //       if(shift_data)
  //       {
  //         //console.log('shift_data',shift_data._id);
  //         if(total_attendance_summ.shift_allowance[shift_data._id])
  //         {
  //           total_attendance_summ.shift_allowance[shift_data._id] =total_attendance_summ.shift_allowance[shift_data._id]+1
  //         }
  //         else
  //         {
  //           total_attendance_summ.shift_allowance[shift_data._id]=1;
  //         }
  //         //console.log('aaa',total_attendance_summ.shift_allowance);
  //         if(shift_data.break_shift == 'yes')
  //         {
  //           var reporting_time = shift_data.shift1_start_time;
  //               var closing_time = shift_data.shift1_end_time;
  //               var reporting_time2 = shift_data.shift2_start_time;
  //               var closing_time2 = shift_data.shift2_end_time;
  //               var attendence_start = attendance_data.login_time;
  //               var attendence_end = attendance_data.logout_time;
  //               var attendence_start = attendance_data.shift1_start_time;
  //               var attendence_end = attendance_data.shift1_end_time;

  //               var attendence_start2 = attendance_data.shift2_start_time;
  //               var attendence_end2 = attendance_data.shift2_end_time;
  //               var total_break_time = attendance_data.total_break_time;
  //               var reporting_start_time=  Site_helper.get_time_to_current_time(reporting_time);
  //               var reporting_closing_time= Site_helper.get_time_to_current_time(closing_time);
  //               var reporting_start_time2=  Site_helper.get_time_to_current_time(reporting_time2);
  //               var reporting_closing_time2= Site_helper.get_time_to_current_time(closing_time2);
  //               var attendence_start_time=Site_helper.get_time_to_current_time(attendence_start);
  //               var attendence_end_time=Site_helper.get_time_to_current_time(attendence_end);
  //               var attendence_start_time2=Site_helper.get_time_to_current_time(attendence_start2);
  //               var attendence_end_time2=Site_helper.get_time_to_current_time(attendence_end2);


  //             if(shift_data.company_early_arrival == 'no')
  //             {
  //               attendence_start_time= reporting_start_time;
  //               attendence_start_time2= reporting_start_time2;
  //             }
  //             if(shift_data.company_late_allowed == 'no')
  //             {
  //               if(attendence_end_time > reporting_closing_time)
  //               {
  //                 var total_overtime= (attendence_end_time - reporting_closing_time);
  //                 attendence_end_time= reporting_closing_time;
  //               }      
  //               var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;    
  //             }
  //             else
  //             {
  //               var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;
  //               if(total_logged_in > full_day_max_hours)
  //               {
  //                 var total_overtime= (total_logged_in - full_day_max_hours);
  //                 total_logged_in = (total_logged_in - total_overtime);
  //               }  
  //             }


  //             if(shift_data.company_late_allowed == 'no')
  //             {
  //               if(attendence_end_time > reporting_closing_time)
  //               {
  //                  total_overtime= ( total_overtime + (attendence_end_time - reporting_closing_time));
  //                 attendence_end_time= reporting_closing_time;
  //               } 
  //               if(attendence_end_time2 > reporting_closing_time2)
  //               {
  //                 total_overtime= ( total_overtime + (attendence_end_time2 - reporting_closing_time2));
  //                 attendence_end_time2= reporting_closing_time2;
  //               }  
  //               var total_logged_in = ((( (attendence_end_time - attendence_start_time) + ( attendence_end_time2 - attendence_start_time2)) / 60) - total_break_time);       
  //             }
  //             else
  //             {
  //               var total_logged_in =  ((( (attendence_end_time - attendence_start_time) + ( attendence_end_time2 - attendence_start_time2)) / 60) - total_break_time);   
  //               if(total_logged_in > full_day_max_hours)
  //               {
  //                 total_overtime= (total_logged_in - full_day_max_hours);
  //                 total_logged_in = (total_logged_in - total_overtime);
  //               }  
  //             }
  //             if(shift_data.company_late_allowed == 'no' && shift_data.company_early_arrival == 'no')
  //             {
  //               if (attendence_start_time2 > reporting_start_time2 || attendence_start_time > reporting_start_time) {
  //                 total_late = 1;
  //                 total_late_hour = attendence_start_time - reporting_start_time;
  //               }
  //             }
  //         }
  //         else
  //         {
  //           var reporting_time = shift_data.shift1_start_time;
  //           var closing_time = shift_data.shift1_end_time;
  //           var attendence_start = attendance_data.shift1_start_time;
  //           var attendence_end = attendance_data.shift1_end_time;
  //           var total_break_time = attendance_data.total_break_time;
  //           var reporting_start_time=Site_helper.get_time_to_current_time(reporting_time);
  //           var reporting_closing_time=Site_helper.get_time_to_current_time(closing_time);

  //           var attendence_start_time=Site_helper.get_time_to_current_time(attendence_start);
  //           var attendence_end_time=Site_helper.get_time_to_current_time(attendence_end);


  //           if(shift_data.company_early_arrival == 'no')
  //           {
  //             attendence_start_time= reporting_start_time;
  //           }


  //           if(shift_data.company_late_allowed == 'no')
  //           {
  //             if(attendence_end_time > reporting_closing_time)
  //             {
  //               var total_overtime= (attendence_end_time - reporting_closing_time);
  //               attendence_end_time= reporting_closing_time;
  //             }      
  //             var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;    
  //           }
  //           else
  //           {
  //             var total_logged_in = ((( attendence_end_time - attendence_start_time) / 60) - total_break_time) ;
  //             if(total_logged_in > full_day_max_hours)
  //             {
  //               var total_overtime= (total_logged_in - full_day_max_hours);
  //               total_logged_in = (total_logged_in - total_overtime);
  //             }  
  //           }
  //           if(shift_data.company_late_allowed == 'no' && shift_data.company_early_arrival == 'no')
  //           {
  //             if (attendence_start_time > reporting_start_time) {
  //               total_late = 1;
  //               total_late_hour = attendence_start_time - reporting_start_time;
  //             }
  //           }
  //         }
  //       }
  //       else
  //       {
  //         var full_day_max_hours = emp_attendance_temp.full_day_max_hours;
  //         var half_day_max_hours = emp_attendance_temp.half_day_max_hours;
  //         var grace_period = emp_attendance_temp.grace_period;
  //         var reporting_time = emp_attendance_temp.reporting_time;
  //         var closing_time = emp_attendance_temp.closing_time;

  //         var attendence_start = attendance_data.login_time;
  //         var attendence_end = attendance_data.logout_time;
  //         var total_break_time = attendance_data.total_break_time ? parseFloat(attendance_data.total_break_time):0;
  //         var attendence_time_start=Site_helper.get_time_to_current_time(attendence_start);
  //         var attendence_time_end=Site_helper.get_time_to_current_time(attendence_end);
  //         var reporting_time_start=Site_helper.get_time_to_current_time(reporting_time);
  //         var reporting_time_end=Site_helper.get_time_to_current_time(closing_time);
  //         reporting_time_start = reporting_time_start + parseFloat(grace_period);
  //         var total_logged_in = ((( attendence_time_end - attendence_time_start) / 60) - total_break_time) ;

  //         if (attendence_time_start > reporting_time_start) {
  //           total_late = 1;
  //           // console.log(attendence_time_start);
  //           total_late_hour = attendence_time_start - reporting_time_start;
  //         }
  //       }
  //       //console.log(attendance_date,attendence_time_end,attendence_time_start,total_break_time,'total_logged_in',total_logged_in,'aaa',total_attendance_summ.shift_allowance,shift_data);
  //         if (total_logged_in >= half_day_max_hours) {
  //           if (total_logged_in >= full_day_max_hours) {
  //             cal_attendance_val = 1;
  //             total_overtime = (total_logged_in - full_day_max_hours);
  //           } else {
  //             cal_attendance_val = 0.5;
  //           }
  //           //total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //         } else {
  //           total_lop=1;
  //           total_attendance_summ.total_lop = total_attendance_summ.total_lop + 1;
  //         }
  //       switch (attendance_data.attendance_stat) {
  //         case "PDL":
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "P":
  //           if(total_late == 1)
  //           {
  //             total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //               if(total_attendance_summ.total_late_hour){
  //               total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //           }
  //           else{
  //             total_attendance_summ.total_late_hour = total_late_hour;
  //           }
  //           }

  //           total_attendance_summ.total_present = total_attendance_summ.total_present + cal_attendance_val;
  //           total_attendance_summ.paydays = total_attendance_summ.paydays + cal_attendance_val;
  //           total_attendance_summ.total_overtime = (total_attendance_summ.total_overtime + total_overtime);  
  //           break;
  //         case "H":
  //           total_attendance_summ.holiday =
  //             total_attendance_summ.holiday + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "L":
  //             total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //              if(total_attendance_summ.total_late_hour){
  //               total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //           }
  //           else{
  //             total_attendance_summ.total_late_hour = total_late_hour;
  //           }
  //             total_attendance_summ.total_attendance = total_attendance_summ.total_attendance + attendance_val;
  //             total_attendance_summ.paydays = total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "A":
  //           total_attendance_summ.total_absent = total_attendance_summ.total_absent + attendance_val;
  //           if(total_lop == 0)
  //           {
  //             total_attendance_summ.total_lop = total_attendance_summ.total_lop + attendance_val;
  //           }
  //           break;
  //         case "OT":
  //           total_attendance_summ.total_overtime = (total_attendance_summ.total_overtime + (total_logged_in + total_overtime));
  //           break;
  //         case "CSL":
  //           total_attendance_summ.total_CSL =
  //             total_attendance_summ.total_CSL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PVL":
  //           total_attendance_summ.total_PVL =
  //             total_attendance_summ.total_PVL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ERL":
  //           total_attendance_summ.total_ERL =
  //             total_attendance_summ.total_ERL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "SKL":
  //           total_attendance_summ.total_SKL =
  //             total_attendance_summ.total_SKL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MDL":
  //           total_attendance_summ.total_MDL =
  //             total_attendance_summ.total_MDL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MTL":
  //           total_attendance_summ.total_MTL =
  //             total_attendance_summ.total_MTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PTL":
  //           total_attendance_summ.total_PTL =
  //             total_attendance_summ.total_PTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ANL":
  //           total_attendance_summ.total_ANL =
  //             total_attendance_summ.total_ANL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "AWP":
  //           total_attendance_summ.total_AWP =
  //             total_attendance_summ.total_AWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "UWP":
  //           total_attendance_summ.total_UWP =
  //             total_attendance_summ.total_UWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "LE1":
  //           total_attendance_summ.total_LE1 =
  //             total_attendance_summ.total_LE1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LE2":
  //           total_attendance_summ.total_LE2 =
  //             total_attendance_summ.total_LE2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP1":
  //           total_attendance_summ.total_LP1 =
  //             total_attendance_summ.total_LP1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP2":
  //           total_attendance_summ.total_LP2 =
  //             total_attendance_summ.total_LP2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "WO":
  //           total_attendance_summ.total_wo =
  //             total_attendance_summ.total_wo + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //       }
  //     } 
  //     else if (emp_attendance_temp.register_type === "halfday") {
  //       var attendance_val = 0.5;
  //       switch (attendance_data.first_half) {
  //         case "PDL":
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "P":
  //           total_attendance_summ.total_present =
  //             total_attendance_summ.total_present + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "H":
  //           total_attendance_summ.holiday =
  //             total_attendance_summ.holiday + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "L":
  //           total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //           if(total_attendance_summ.total_late_hour){
  //             total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //         }
  //         else{
  //           total_attendance_summ.total_late_hour = total_late_hour;
  //         }
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "A":
  //           total_attendance_summ.total_absent =
  //             total_attendance_summ.total_absent + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "OT":
  //           total_attendance_summ.total_overtime =
  //             total_attendance_summ.total_overtime + attendance_val;
  //           break;
  //         case "CSL":
  //           total_attendance_summ.total_CSL =
  //             total_attendance_summ.total_CSL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PVL":
  //           total_attendance_summ.total_PVL =
  //             total_attendance_summ.total_PVL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ERL":
  //           total_attendance_summ.total_ERL =
  //             total_attendance_summ.total_ERL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "SKL":
  //           total_attendance_summ.total_SKL =
  //             total_attendance_summ.total_SKL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MDL":
  //           total_attendance_summ.total_MDL =
  //             total_attendance_summ.total_MDL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MTL":
  //           total_attendance_summ.total_MTL =
  //             total_attendance_summ.total_MTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PTL":
  //           total_attendance_summ.total_PTL =
  //             total_attendance_summ.total_PTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ANL":
  //           total_attendance_summ.total_ANL =
  //             total_attendance_summ.total_ANL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "AWP":
  //           total_attendance_summ.total_AWP =
  //             total_attendance_summ.total_AWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "UWP":
  //           total_attendance_summ.total_UWP =
  //             total_attendance_summ.total_UWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "LE1":
  //           total_attendance_summ.total_LE1 =
  //             total_attendance_summ.total_LE1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LE2":
  //           total_attendance_summ.total_LE2 =
  //             total_attendance_summ.total_LE2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP1":
  //           total_attendance_summ.total_LP1 =
  //             total_attendance_summ.total_LP1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP2":
  //           total_attendance_summ.total_LP2 =
  //             total_attendance_summ.total_LP2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "WO":
  //           total_attendance_summ.total_wo =
  //             total_attendance_summ.total_wo + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //       }
  //       switch (attendance_data.second_half) {
  //         case "PDL":
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "P":
  //           total_attendance_summ.total_present =
  //             total_attendance_summ.total_present + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "H":
  //           total_attendance_summ.holiday =
  //             total_attendance_summ.holiday + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "L":
  //           total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //           if(total_attendance_summ.total_late_hour){
  //             total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //         }
  //         else{
  //           total_attendance_summ.total_late_hour = total_late_hour;
  //         }
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "A":
  //           total_attendance_summ.total_absent =
  //             total_attendance_summ.total_absent + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "OT":
  //           total_attendance_summ.total_overtime =
  //             total_attendance_summ.total_overtime + attendance_val;
  //           break;
  //         case "CSL":
  //           total_attendance_summ.total_CSL =
  //             total_attendance_summ.total_CSL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PVL":
  //           total_attendance_summ.total_PVL =
  //             total_attendance_summ.total_PVL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ERL":
  //           total_attendance_summ.total_ERL =
  //             total_attendance_summ.total_ERL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "SKL":
  //           total_attendance_summ.total_SKL =
  //             total_attendance_summ.total_SKL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MDL":
  //           total_attendance_summ.total_MDL =
  //             total_attendance_summ.total_MDL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MTL":
  //           total_attendance_summ.total_MTL =
  //             total_attendance_summ.total_MTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PTL":
  //           total_attendance_summ.total_PTL =
  //             total_attendance_summ.total_PTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ANL":
  //           total_attendance_summ.total_ANL =
  //             total_attendance_summ.total_ANL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "AWP":
  //           total_attendance_summ.total_AWP =
  //             total_attendance_summ.total_AWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "UWP":
  //           total_attendance_summ.total_UWP =
  //             total_attendance_summ.total_UWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "LE1":
  //           total_attendance_summ.total_LE1 =
  //             total_attendance_summ.total_LE1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LE2":
  //           total_attendance_summ.total_LE2 =
  //             total_attendance_summ.total_LE2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP1":
  //           total_attendance_summ.total_LP1 =
  //             total_attendance_summ.total_LP1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP2":
  //           total_attendance_summ.total_LP2 =
  //             total_attendance_summ.total_LP2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "WO":
  //           total_attendance_summ.total_wo =
  //             total_attendance_summ.total_wo + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //       }
  //     } else {
  //       var attendance_val = 1;
  //       switch (attendance_data.attendance_stat) {
  //         case "PDL":
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "P":
  //           total_attendance_summ.total_present =
  //             total_attendance_summ.total_present + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "H":
  //           total_attendance_summ.holiday =
  //             total_attendance_summ.holiday + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "L":
  //           total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
  //           if(total_attendance_summ.total_late_hour){
  //             total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
  //         }
  //         else{
  //           total_attendance_summ.total_late_hour = total_late_hour;
  //         }
  //           total_attendance_summ.total_attendance =
  //             total_attendance_summ.total_attendance + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "A":
  //           total_attendance_summ.total_absent =
  //             total_attendance_summ.total_absent + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "OT":
  //           total_attendance_summ.total_overtime =
  //             total_attendance_summ.total_overtime + attendance_val;
  //           break;
  //         case "CSL":
  //           total_attendance_summ.total_CSL =
  //             total_attendance_summ.total_CSL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PVL":
  //           total_attendance_summ.total_PVL =
  //             total_attendance_summ.total_PVL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ERL":
  //           total_attendance_summ.total_ERL =
  //             total_attendance_summ.total_ERL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "SKL":
  //           total_attendance_summ.total_SKL =
  //             total_attendance_summ.total_SKL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MDL":
  //           total_attendance_summ.total_MDL =
  //             total_attendance_summ.total_MDL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "MTL":
  //           total_attendance_summ.total_MTL =
  //             total_attendance_summ.total_MTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "PTL":
  //           total_attendance_summ.total_PTL =
  //             total_attendance_summ.total_PTL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "ANL":
  //           total_attendance_summ.total_ANL =
  //             total_attendance_summ.total_ANL + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "AWP":
  //           total_attendance_summ.total_AWP =
  //             total_attendance_summ.total_AWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "UWP":
  //           total_attendance_summ.total_UWP =
  //             total_attendance_summ.total_UWP + attendance_val;
  //           total_attendance_summ.total_lop =
  //             total_attendance_summ.total_lop + attendance_val;
  //           break;
  //         case "LE1":
  //           total_attendance_summ.total_LE1 =
  //             total_attendance_summ.total_LE1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LE2":
  //           total_attendance_summ.total_LE2 =
  //             total_attendance_summ.total_LE2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP1":
  //           total_attendance_summ.total_LP1 =
  //             total_attendance_summ.total_LP1 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "LP2":
  //           total_attendance_summ.total_LP2 =
  //             total_attendance_summ.total_LP2 + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //         case "WO":
  //           total_attendance_summ.total_wo =
  //             total_attendance_summ.total_wo + attendance_val;
  //           total_attendance_summ.paydays =
  //             total_attendance_summ.paydays + attendance_val;
  //           break;
  //       }
  //     }
  //   return total_attendance_summ;
  // },
  
  calculate_esic: async function (esic_temp, baseamount, gross_salary) {
    //console.log(esic_temp)
    if (parseFloat(esic_temp.wage_ceiling) > gross_salary) {
      var emoloyee_contribution =
      (baseamount * parseFloat(esic_temp.employee_contribution)) / 100;
      var emoloyer_contribution =
      (baseamount * parseFloat(esic_temp.employer_contribution)) / 100;
      var retdata = {
        emoloyee_contribution: emoloyee_contribution,
        emoloyer_contribution: emoloyer_contribution,
      };
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
    hr_details
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
    var emoloyer_pf_contribution =
    ((salary_template.restricted_pf === "yes"
      ? baseamount < parseFloat(epfo_temp.wage_ceiling)
      ? baseamount
      : parseFloat(epfo_temp.wage_ceiling)
      : baseamount) *
    parseFloat(epfo_temp.pf_employer_contribution)) /
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
      emoloyee_contribution: emoloyee_contribution,
      total_employer_contribution: total_employer_contribution,
      emoloyer_pf_contribution: emoloyer_pf_contribution,
      emoloyer_eps_contribution: emoloyer_eps_contribution,
      emoloyer_edlis_contribution: emoloyer_edlis_contribution,
      emoloyer_epf_admin_contribution: emoloyer_epf_admin_contribution,
      emoloyer_edlis_admin_contribution: emoloyer_edlis_admin_contribution,
    };
    var restricted_pf_wages =
    salary_template.restricted_pf === "yes"
    ? baseamount < parseFloat(epfo_temp.wage_ceiling)
    ? baseamount
    : parseFloat(epfo_temp.wage_ceiling)
    : baseamount;
    retdata.eps_wages =
    salary_template.restricted_pf === "yes"
    ? baseamount < parseFloat(epfo_temp.wage_ceiling)
    ? baseamount
    : parseFloat(epfo_temp.wage_ceiling)
    : epfo_temp.pension_employer_contribution_restrict === "yes"
    ? baseamount < parseFloat(epfo_temp.wage_ceiling)
    ? baseamount
    : parseFloat(epfo_temp.wage_ceiling)
    : baseamount;
    retdata.edlis_wages =
    salary_template.restricted_pf === "yes"
    ? baseamount < parseFloat(epfo_temp.wage_ceiling)
    ? baseamount
    : parseFloat(epfo_temp.wage_ceiling)
    : epfo_temp.edli_employer_contribution_restrict === "yes"
    ? baseamount < parseFloat(epfo_temp.wage_ceiling)
    ? baseamount
    : parseFloat(epfo_temp.wage_ceiling)
    : baseamount;
    var total_pf_wages = baseamount;
    retdata.total_pf_wages = total_pf_wages;
    retdata.restricted_pf_wages = restricted_pf_wages;
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
  calculate_pt: async function (req, currdate, emp_state, total_pt_wages = 0) {
    //console.log( currdate, emp_state,total_pt_wages);
    var pt_temp_rate = Ptaxrule.findOne(
    {
      corporate_id: req.authData.corporate_id,
      effective_from: { $lte: currdate },
      state_name: emp_state,
      status: "active",
      "tax_range_amount.amount_from": { $lte: parseFloat(total_pt_wages) },
      "tax_range_amount.amount_to": { $gte: parseFloat(total_pt_wages) },
    },
    "-history",
    { sort: { effective_from: -1 } }
    );
    pt_temp_rate = await pt_temp_rate;

    var p_tax_amount = 0;
    if (pt_temp_rate) {
      var ptax_arr_rate = pt_temp_rate.tax_range_amount;
      var tax_amount = await Promise.all(
        ptax_arr_rate.map(async (ptax_arr_exp_rate) => {
          if (
            ptax_arr_exp_rate.amount_from <= total_pt_wages &&
            ptax_arr_exp_rate.amount_to >= total_pt_wages
            ) {
            p_tax_amount = ptax_arr_exp_rate.tax_amount;
        }
      })
        );
    }
    return p_tax_amount;
  },
  roundoff_func_helper: async function (round_rule, org_value, aaaaaa) {
    //console.log('function',round_rule, org_value,aaaaaa)
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
    calculate_advance='',
    emp_id = '',
    corporate_id='',
    advance_amount=0
    ) {
    var currdate = new Date();
    var emp_state = employee_details.emp_address
    ? employee_details.emp_address.state
    : "";
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
    var advance_recovered =0;
    if(advance_amount > 0)
    {
      var advance_recovered = advance_amount;
      var earned_salary = (earned_salary - advance_amount );
      earned_salary = (earned_salary > 0 ? earned_salary : 0);
    }
    if(calculate_advance)
    {
      var wage_month = req.body.attendance_month;
      var wage_year = req.body.attendance_year;  
      var advance_recovery_data=await this.get_advance_recovery_data(emp_id,corporate_id,wage_month,wage_year,earned_salary,'gross_earning');
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
    /* --------- Calculate Head Data --------- */

    await Promise.all(
      earnings.map(async (earning, keyval) => {
        var earning2 = 0;
        if (salary_template.advance === "yes") {
          var percentage_amount =
          (earned_salary * salary_template.minimum_wage_percentage) / 100;

          //console.log('advance'+percentage_amount)
          if (salary_template.wage_applicable === "higher") {
            earned_salary = parseFloat(
              percentage_amount > minimum_wage_amount
              ? percentage_amount
              : minimum_wage_amount
              );
            var rate_type =
            percentage_amount > minimum_wage_amount ? "percent" : "amount";

            earned_salary_rate = parseFloat(
              percentage_amount > minimum_wage_amount
              ? percentage_amount
              : minimum_wage_amount
              );
            var rate_type_rate =
            percentage_amount > minimum_wage_amount
            ? "percent"
            : "amount";
          } else {
            earned_salary = parseFloat(
              percentage_amount < minimum_wage_amount
              ? percentage_amount
              : minimum_wage_amount
              );
            var rate_type =
            percentage_amount < minimum_wage_amount ? "percent" : "amount";

            earned_salary_rate = parseFloat(
              percentage_amount < minimum_wage_amount
              ? percentage_amount
              : minimum_wage_amount
              );
            var rate_type_rate =
            percentage_amount < minimum_wage_amount
            ? "percent"
            : "amount";
          }
          var rate =
          rate_type === "percent"
          ? salary_template.minimum_wage_percentage
          : minimum_wage_amount;
          var rate_rate =
          rate_type_rate === "percent"
          ? salary_template.minimum_wage_percentage
          : minimum_wage_amount;
        }
        //console.log('non-advance'+earned_salary)
        /* --------   checking the earning type  --------------*/
        if (earning.dependent_head) {
          var filterObj = earnings.filter(function (filter_earning) {
            return filter_earning.head_id == earning.dependent_head;
          });
          var dependant_headvalue = retddata.filter(function (retddata_val) {
            return retddata_val.head_id == earning.dependent_head;
          });

          head_earning = parseFloat(
            (dependant_headvalue[0].amount * earning.percentage_amount) / 100
            );

          var rate_type = "percent";
          var rate = earning.percentage_amount;
          //console.log('dependent_head')
        } else {
          /* --------   checking the earning type  --------------*/
          if (earning.earning_type === "percent") {
            head_earning = parseFloat(
              (earned_salary * earning.earning_value) / 100
              );
          } else {
            head_earning = parseFloat(earning.earning_value);
          }

          var rate_type = earning.earning_type;
          var rate = earning.earning_value;
        }
        /* --------   checking max allowance amount  --------------*/
        if (earning.earning_type === "amount") {
          //console.log('amount')
          head_earning =
          head_earning > earning.earning_value
          ? earning.earning_value
          : head_earning;
        } else if (earning.earning_type === "percent") {
          //console.log('percent')
          var head_max_amount = (earned_salary * earning.earning_value) / 100;
          head_earning =
          head_earning > head_max_amount ? head_max_amount : head_earning;
        }

        /* --------   check allowance id exceeding the total salary or not  --------------*/
        var curr_gross_earning = gross_earning + parseFloat(head_earning);
        if (curr_gross_earning > earned_salary) {
          head_earning = earned_salary - gross_earning;
        }
        gross_earning = gross_earning + parseFloat(head_earning);
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
          var head_earning_amount = await this.roundoff_func_helper(
            epfo_temp.round_off,
            head_earning,
            earning.head_full_name
            );
          retddata.push({
            head_id: earning.head_id,
            head_title: earning.head_full_name,
            head_type: earning.type,
            head_abbreviation: earning.head_abbreviation,
            head_rate_type: rate_type,
            head_rate: rate,
            amount: head_earning_amount,
          });
        }
      })
);
/* --------- End Calculate Head Data --------- */

var pf_return_val = await this.calculate_pf(
  await epfo_temp,
  total_pf_wages,
  salary_template,
  hr_details
  );
var esic_return_val = await this.calculate_esic(
  await esic_temp,
  total_esi_wages,
  gross_salary
  );
var total_employeer_pf_contribution =
pf_return_val.emoloyer_pf_contribution +
pf_return_val.emoloyer_eps_contribution +
pf_return_val.emoloyer_edlis_contribution +
pf_return_val.emoloyer_epf_admin_contribution +
pf_return_val.emoloyer_edlis_admin_contribution;
var total_employee_pf_contribution = pf_return_val.emoloyee_contribution;
var total_employeer_esic_contribution = esic_return_val.emoloyer_contribution;
var total_employee_esic_contribution = esic_return_val.emoloyee_contribution;
var gross_deduct = (total_employee_pf_contribution + total_employee_esic_contribution)
var net_take_home = gross_earning - gross_deduct;

/* ----- Calculate Voluntry PF Data ------- */
var voluntary_pf = parseFloat(salary_template.voluntary_pf);
if (voluntary_pf > 0) {
  voluntary_pf_amount = ((net_take_home * voluntary_pf) / 100);
  gross_deduct = (gross_deduct + voluntary_pf_amount);
  net_take_home = (net_take_home - voluntary_pf_amount);
}

var ctc =  gross_earning + total_employeer_pf_contribution + total_employeer_esic_contribution;
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
        emoloyer_pf_contribution: await this.roundoff_func_helper(
          epfo_temp.round_off,
          pf_return_val.emoloyer_pf_contribution
          ),
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
      //p_tax_amount: await this.roundoff_func_helper( epfo_temp.round_off, p_tax_amount),
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
    return breakupdata;
  },
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
    wage_month
    ) {
    var bonus_value = parseFloat(bonus_module.bonus_value);
    var exgratia_status = parseFloat(bonus_module.exgratia);
    var gov_calculate_bonus =
    (bonus_temp_data.max_bonus_wage * bonus_temp_data.max_bonus) / 100;
    var bonus_amount = 0;
    var exgratia_amount = 0;
    var month_diff = await this.getMonthDifference(
      new Date(date_of_join),
      new Date()
      );
    var year_ending = com_data.financial_year_end;
    console.log(year_ending)
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
          var wage_month_start = curr_month - 3;
          var wage_month_end = curr_month;
        }
      } else if (bonus_temp_data.disbursement_frequency == "half_yearly") {
        var frequency_month = await this.frequency_monthf(
          new Date(year_ending),
          6
          );
        var frequency_month_val = frequency_month.month_val;
        var template_bonus_wage = temp_max_bonus_wage * 6;
        if (frequency_month_val.includes(curr_month)) {
          var wage_month_start = curr_month - 6;
          var wage_month_end = curr_month;
        }
      } else {
        var wage_month_start = curr_month - 1;
        var wage_month_end = curr_month;
        var frequency_month_val = [curr_month];
        var template_bonus_wage = temp_max_bonus_wage;
      }

      console.log(frequency_month_val,curr_month)
      if (frequency_month_val.includes(curr_month)) {
        /* check DISBURSEMENT TYPE */
        if (bonus_temp_data.disbursement_type == "fixed") {
          bonus_amount = bonus_value;
          console.log(bonus_amount)
        } else {
          var calculated_bonus_wages = await this.get_bonus_wages(
            bonus_module.bonus_from_month,
            bonus_module.bonus_from_year,
            bonus_module.bonus_to_month,
            bonus_module.bonus_to_year,
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
    emp_id,
    incentive_temp_data,
    gross_salary,
    incentive_modules,
    com_data,
    wage_month,
    wage_year
    ) {
    var current_date = new Date();
    var curr_month = wage_month;
    var year_ending = com_data.financial_year_end;
    if (incentive_temp_data.settlement_frequency == "yearly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        12
        );
      var frequency_month_val = frequency_month.month_val;
      var frequency_month_date = frequency_month.month_date_val;
      if (frequency_month_val.includes(curr_month)) {
        var curr_quater_key = Object.keys(frequency_month_val).find(
          (key) => frequency_month_val[key] === 1
          );
        var start_month_date = frequency_month_date[curr_quater_key - 1];
        var end_month_date = frequency_month_date[curr_quater_key];
        var start_month = start_month_date.getUTCMonth();
        var start_year = start_month_date.getUTCFullYear();
        var end_month = end_month_date.getUTCMonth();
        var end_year = end_month_date.getUTCFullYear();
      }
    } else if (incentive_temp_data.settlement_frequency == "half_yearly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        6
        );
      var frequency_month_val = frequency_month.month_val;
      var frequency_month_date = frequency_month.month_date_val;
      if (frequency_month_val.includes(curr_month)) {
        var curr_quater_key = Object.keys(frequency_month_val).find(
          (key) => frequency_month_val[key] === 2
          );
        var start_month_date = frequency_month_date[curr_quater_key - 1];
        var end_month_date = frequency_month_date[curr_quater_key];
        var start_month = start_month_date.getUTCMonth();
        var start_year = start_month_date.getUTCFullYear();
        var end_month = end_month_date.getUTCMonth();
        var end_year = end_month_date.getUTCFullYear();
      }
    } else if (incentive_temp_data.settlement_frequency == "quaterly") {
      var frequency_month = await this.frequency_monthf(
        new Date(year_ending),
        3
        );
      //var frequency_month= await this.frequency_monthf(new Date('2022-04-10'),3);
      var frequency_month_val = frequency_month.month_val;
      var frequency_month_date = frequency_month.month_date_val;
      if (frequency_month_val.includes(curr_month)) {
        var curr_quater_key = Object.keys(frequency_month_val).find(
          (key) => frequency_month_val[key] === 3
          );
        var start_month_date = frequency_month_date[curr_quater_key - 1];
        var end_month_date = frequency_month_date[curr_quater_key];
        var start_month = start_month_date.getUTCMonth();
        var start_year = start_month_date.getUTCFullYear();
        var end_month = end_month_date.getUTCMonth();
        var end_year = end_month_date.getUTCFullYear();
      }
    } else if (incentive_temp_data.settlement_frequency == "monthly") {
      var start_month = wage_month;
      var start_year = wage_year;
      var end_month = wage_month;
      var end_year = wage_year;
      //console.log('monthly',start_month,start_year,end_month,end_year);
    }
    if (start_month) {
      var inc_data = await this.get_incentive_module_data(
        emp_id,
        com_data.corporate_id,
        start_month,
        start_year,
        end_month,
        end_year
        );
      return inc_data[0];
    } else {
      return null;
    }
  },
  calculate_incentive_advance: async function (
    emp_id,
    incentive_temp_data,
    com_data,
    wage_month,
    wage_year,
    incentive_advance
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
    return incentive_advance;
  },
  get_incentive_module_data: async function (
    emp_id,
    corporate_id,
    start_month,
    start_year,
    end_month,
    end_year
    ) {
    myAggregate = await IncentiveModule.aggregate([
    {
      $match: {
        $and: [
        { corporate_id: corporate_id },
        { emp_id: mongoose.Types.ObjectId(emp_id) },
        {
          $or: [
          { incentive_g_year: { $gt: start_year.toString() } },
          {
            $and: [
            { incentive_g_year: { $gte: start_year.toString() } },
            { incentive_g_month: { $gte: start_month.toString() } },
            ],
          },
          ],
        },
        {
          $or: [
          { incentive_g_year: { $lt: end_year.toString() } },
          {
            $and: [
            { incentive_g_year: { $lte: end_year.toString() } },
            { incentive_g_month: { $lte: end_month.toString() } },
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
        {
          $project: {
            _id: 1,
            corporate_id: 1,
            genarete_advance_value: 1,
            advance_value: 1,
            incentive_value: 1,
            emp_id: 1,
          },
        },
        {
          $group: {
            _id: null,
            calculated_advance_value: {
              $sum: "$genarete_advance_value",
            },
            calculated_incentive_value: {
              $sum: "$advance_value",
            },
            total_incentive_value: {
              $sum: "$incentive_value",
            },
          },
        },
        ]);
    //console.log('myAggregate',myAggregate)
    return myAggregate;
  },
  frequency_monthf: async function (date = new Date(), freq) {
    var monthspan = "";
    var ret_arr = [];
    var ret_date_arr = [];
    if (freq == 6) {
      var counter = 2;
    } else {
      var counter = 4;
    }
    for ($i = 0; $i < counter; $i++) {
      monthspan = new Date(date.setMonth(date.getUTCMonth() + freq));
      //monthspan_date=new Date(date.setMonth(date.getUTCMonth()+freq));
      ret_date_arr.push(monthspan);
      ret_arr.push(monthspan.getUTCMonth());
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
        { emp_db_id: { $eq: mongoose.Types.ObjectId(emp_id) } },
        {
          $or: [
          { wage_year: { $gt: wage_y_s.toString() } },
          {
            $and: [
            { wage_year: { $gte: wage_y_s.toString() } },
            { wage_month: { $gte: wage_m_s.toString() } },
            ],
          },
          ],
        },
        {
          $or: [
          { wage_year: { $lt: wage_y_e.toString() } },
          {
            $and: [
            { wage_year: { $lte: wage_y_e.toString() } },
            { wage_month: { $lte: wage_m_e.toString() } },
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
      var bank_account = req.body.bank_account;
      search_option_details.$match["employee_details.bank_details.bank_name"] =
      { $eq: bank_account };
    }
    if (req.body.client_code) {
      var client_codes = JSON.parse(req.body.client_code);
      search_option.$match.client_code = { $in: client_codes };
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
  generate_export_file: async function (module, module_data, template_data) {},
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
        { payment_start_year: { $lt: wage_year.toString() } },
        {
          $and: [
          { payment_start_year: { $lte: wage_year.toString() } },
          { payment_start_month: { $lte: wage_month.toString() } },
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
          new_advance =
          parseFloat(new_advance) + parseFloat(advance_data.advance_amount);
        } else {
          advance_start =
          advance_start + parseFloat(advance_data.advance_outstanding);
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
  calculate_shift_allowance:async function(attendance_summaries,shift_rate){
    var total_amount = 0
    await Promise.all(
      shift_rate.map(async (shift_rate_val, keyval) => {
        if(shift_rate_val.shift_id in attendance_summaries)
        {
          var shift_rate=shift_rate_val.rate;
          var no_of_days=attendance_summaries[shift_rate_val.shift_id];
          total_amount=(total_amount + (parseInt(shift_rate) * parseInt(no_of_days)));
        }
      }))
    return total_amount;
  },
  generate_pdf:async function(data,pdf_title,payslip_temp_data,pdf_path){
    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };
    var printer = new PdfPrinter(fonts);
    var emp_field=payslip_temp_data?.employee_details;
    var payroll_section_field=payslip_temp_data?.payroll_details;
    var deduction_field=['epf_amount','vpf_amount','esic_amount','p_tax_amount','lwf_amount','tds_amount'];
    var contribution_field=['epf_amount','eps_amount','admin_edli_amount','esic_amount','lwf_amount'];
    var gross_payment_field=['gross','ctc','net_pay'];

    var payslip_data=data.payslip_data;
    var salary_heads=payslip_data.earnings.salary_report_heads;
      //console.log('emp_data',payslip_temp_data)
      var emp_data={
        company_info:{label:"Company info",label_value:payslip_temp_data?.company_info},
        emp_code:{label:"Emp code",label_value:payslip_data.emp_id},
        client:{label:"Client",label_value:payslip_data.emp_data.client.client_name},
        department:{label:'Department',label_value:payslip_data.emp_data.department.department_name},
        gender:{label:'Gender',label_value:payslip_data.emp_data.sex},
        doj:{label:'DOJ',label_value:payslip_data.emp_data.date_of_join},
        phone:{label:'Phone No',label_value:payslip_data.emp_data.emp_mob},
        account_no:{label:'Account No',label_value:payslip_data.emp_data.bank_details.account_no},
        account_type:{label:'Account Type',label_value:payslip_data.emp_data.bank_details.account_type},
        pan_no:{label:'Pan No',label_value:payslip_data.emp_data.pan_no},
        pf_no:{label:'PF No',label_value:payslip_data.emp_data.new_pf_no},
        month_days:{label:'Month day',label_value:payslip_data.emp_data.attendance_summaries?.monthdays},
        pay_days:{label:'Pay days',label_value:payslip_data.emp_data.attendance_summaries.paydays},
        holidays:{label:'Holidays',label_value:payslip_data.emp_data.attendance_summaries.holiday},
        lop_days:{label:'LOP days',label_value:payslip_data.emp_data.attendance_summaries.total_lop},
        payslip_period:{label:'Payslip Period',label_value:(payslip_data.emp_data.attendance_summaries.attendance_month+1) + ' - ' + payslip_data.emp_data.attendance_summaries.attendance_year},
        emp_name:{label:'Emp name',label_value:payslip_data.emp_data.emp_first_name + ' ' + payslip_data.emp_data.emp_last_name},
        branch:{label:'Branch',label_value:payslip_data.emp_data.branch?.branch_name},
        hod:{label:'HOD',label_value:payslip_data.emp_data.hod},
        dob:{label:'DOB',label_value:payslip_data.emp_data.emp_emp_dob},
        email_id:{label:'Email-id',label_value:payslip_data.emp_data.emp_email_id},
        bank_name:{label:'Bank name',label_value:payslip_data.emp_data.bank_details.bank_name},
        ifsc_code:{label:'IFSC code',label_value:payslip_data.emp_data.bank_details.ifsc_code},
        aadhar_no:{label:'Aadhar No',label_value:payslip_data.emp_data.emp_aadhar_no},
        uan_no:{label:'UAN no',label_value:payslip_data.emp_data.uan_no},
        esic_ip_no:{label:'ESIC IP No',label_value:payslip_data.emp_data.corporate_id},
        week_off:{label:'Week off',label_value:payslip_data.emp_data.attendance_summaries?.total_wo},
        paid_leave:{label:'Paid leave',label_value:payslip_data.emp_data.attendance_summaries?.total_PDL},
        present_days:{label:'Present days',label_value:payslip_data.emp_data.attendance_summaries?.total_present},
        arrear_leave:{label:'Arrear leave',label_value:''},
      };
      var payroll_section_data={
        salary_heads:{label:"salary_heads",label_value:payslip_data.earnings.bonus_total_amount},
        bonus:{label:"Bonus",label_value:(payslip_data.earnings.bonus_total_amount || 0).toFixed(2)},
        ot:{label:"OT",label_value:(payslip_data.earnings.ot_total_amount || 0).toFixed(2)},
        ex_gratia:{label:"Ex-gratia",label_value:(payslip_data.earnings.ex_gratia_total_amount || 0).toFixed(2)},
        incentive:{label:"Incentive",label_value:(payslip_data.earnings.incentive_total_amount || 0).toFixed(2)},
        leave_encash:{label:"Leave Encash",label_value:(payslip_data.earnings.leave_encash_amount || 0).toFixed(2)},
        deduction:{label:"Deduction",label_value:''},
        gross:{label:"Gross",label_value:(payslip_data.gross_earning || 0).toFixed(2)},
        ctc:{label:"CTC",label_value:(payslip_data.ctc || 0).toFixed(2)},
        arrear:{label:"Arrear",label_value:(payslip_data.earnings.arrear_amount || 0).toFixed(2)},
        extra_earnings:{label:"Extra Earnings",label_value:(payslip_data.earnings.extra_earnings_amount || 0).toFixed(2)},
        er_contri:{label:"er_contri",label_value:''},
        net_pay:{label:"Net Pay",label_value:(payslip_data.net_pay || 0).toFixed(2)},
        shift_allowance:{label:"Shift Allowance",label_value:(payslip_data.earnings.shift_allowance_total_amount || 0).toFixed(2)},
      };
      var deduction_data = {
        epf_amount:{label:"EPF",label_value:(payslip_data.deductions.epf_amount || 0).toFixed(2)},
        vpf_amount:{label:"VPF",label_value:(payslip_data.deductions.vpf_amount || 0).toFixed(2)},
        esic_amount:{label:"ESIC",label_value:(payslip_data.deductions.esic_amount || 0).toFixed(2)},
        p_tax_amount:{label:"P TAX",label_value:(payslip_data.deductions.p_tax_amount || 0).toFixed(2)},
        lwf_amount:{label:"LWF",label_value:(payslip_data.deductions.lwf_amount || 0).toFixed(2)},
        tds_amount:{label:"TDS",label_value:(payslip_data.deductions.tds_amount || 0).toFixed(2)},
      };
      var contribution_data = {
        epf_amount:{label:"EPF",label_value:(payslip_data.contribution.epf_amount || 0).toFixed(2)},
        eps_amount:{label:"EPS",label_value:(payslip_data.contribution.eps_amount || 0).toFixed(2)},
        admin_edli_amount:{label:"Admin & EDLI",label_value:(payslip_data.contribution.admin_edli_amount || 0).toFixed(2)},
        esic_amount:{label:"ESIC",label_value:(payslip_data.contribution.esic_amount || 0).toFixed(2)},
        lwf_amount:{label:"LWF",label_value:(payslip_data.contribution.lwf_amount || 0).toFixed(2)},
      };
      var gross_payment_data = {
        gross:{label:"Gross",label_value:(payslip_data.gross_earning || 0).toFixed(2)},
        ctc:{label:"CTC",label_value:(payslip_data.ctc || 0).toFixed(2)},
        net_pay:{label:"Net Pay",label_value:(payslip_data.net_pay || 0).toFixed(2)},
      };
      var emp_details_tb= [];
      var payroll_section_tb=[];
      var deduction_tb=[];
      var contribution_tb=[];
      var gross_payment_tb=[];
      var  row_arr = [];
      payroll_section_field.forEach(async (ps_det,index_val) => { 
        if(ps_det == 'salary_heads')
        {
          salary_heads.forEach(async (salaty_head) => { 
            payroll_section_tb.push([salaty_head.head_abbreviation,salaty_head.amount]);
          })
        }
        else if(ps_det == 'deduction')
        {
          deduction_field.forEach(async (deduc_field) => { 
            deduction_tb.push([deduction_data[deduc_field].label||'',deduction_data[deduc_field].label_value||'']);
          })
        }
        else if(ps_det == 'er_contri')
        {
          contribution_field.forEach(async (contri_field) => { 
            contribution_tb.push([contribution_data[contri_field].label||'',contribution_data[contri_field].label_value||'']);
          })
        }
        else if(ps_det == 'ctc')
        {
          gross_payment_tb.push(gross_payment_data[ps_det].label||'',gross_payment_data[ps_det].label_value||'');
        }
        else if(ps_det == 'net_pay'  )
        {
          gross_payment_tb.push(gross_payment_data[ps_det].label||'',gross_payment_data[ps_det].label_value||'');
        }
        else if( ps_det == 'gross'  )
        {
          gross_payment_tb.push(gross_payment_data[ps_det].label||'',gross_payment_data[ps_det].label_value||'');
        }
        else
        {
          payroll_section_tb.push([payroll_section_data[ps_det].label||'',payroll_section_data[ps_det].label_value||'']); 
        }
      })
      //console.log(gross_payment_tb);
      emp_field.forEach(async (emp_det,index_val) => {        
        var arrlength = index_val%2;
        if(arrlength < 1)
        {
          row_arr[0]=emp_data[emp_det].label||'';
          row_arr[1]=emp_data[emp_det].label_value||'';
        }else if(arrlength < 2)
        {
          row_arr[2]=emp_data[emp_det].label||'';
          row_arr[3]=emp_data[emp_det].label_value||'';
        }
        if(arrlength == 1)
        {
          emp_details_tb.push(row_arr);
          row_arr = [];
        }
      })
      
      ///console.log('aa',payroll_section_tb);
      if (fs.existsSync(file_path+'/'+payslip_temp_data.company_logo)) {
        var imagelogo= {image: payslip_temp_data.company_logo, width: 75,  style: 'tableHeader',  alignment: 'left', border: [true, true, false, false],};
      }
      else
      {
        var imagelogo='';
      }
      
      var docDefinition = {
        content: [
        {
          style: 'tableExample',
          color: '#444',

          table: {
            widths: ['25%','75%'],
            headerRows: 2,
              // keepWithHeaderRows: 1,
              body: [
              [
              imagelogo,
              {text: 'payslip_temp_data.company_info', style: 'tableHeader',   alignment: 'center', border: [false, true, true, false,],}
              ],

              ]
            }
          },
          {
            table: {
              widths: ['25%','25%','25%','25%'],
              headerRows: 1,
              dontBreakRows: true,
              keepWithHeaderRows: 1,
              body: emp_details_tb,
            }
          },
          {
            style:'tableExample',
            table:{
              widths:['33.3%','33.3%','33.3%'],
              body:[
              [
              {text: 'Earnings', style: 'tableHeader',  alignment: 'center'},
              {text: 'Deductions', style: 'tableHeader',  alignment: 'center'},
              {text: 'Employer Contr', style: 'tableHeader',  alignment: 'center'},
              ]
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#444',
            table: {
              widths: ['16.66%','16.66%','16.66%','16.66%','16.66%','16.66%'],
              headerRows: 1,
              // keepWithHeaderRows: 1,
              body: [

              [
              {
                colSpan: 2,
                margin: [-5, -3, -5, -3],
                table: {
                  widths: ['50%','50%'],
                  body: payroll_section_tb
                },
              },

                  //{text:"Earnings",  style: 'tableHeader',  alignment: 'center'},
                  {},
                  {
                    colSpan: 2,
                    margin: [-5, -3, -5, -3],
                    table: {
                      widths: ['50%','50%'],
                      body: deduction_tb
                    },
                  },
                  {},
                  {
                    colSpan: 2,
                    margin: [-5, -3, -5, -3],
                    table: {
                      widths: ['50%','50%'],
                      body: contribution_tb
                    },
                  },
                  {}
                  ]
                  ]
                }
              },
              {
                style:"TableExample",
                table:{
                  widths: ['16.66%','16.66%','16.66%','16.66%','16.66%','16.66%'],
                  body:[gross_payment_tb]
                }
              },
              {
                style:'TableExample',
                table:{
                  widths:['100%'],
                  body:[[payslip_temp_data.signature_message]]
                }
              }
              ],
            };

            var options = {
            }

            var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
            pdfDoc.pipe(fs.createWriteStream('.'+pdf_path+pdf_title));
            pdfDoc.end();

            console.log('called');
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
    },
    calculate_lwf:async function(gross_earning,wage_month,wage_year,comp_data,lwf_rule){

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
    if(lwf_rule.effective_form <= new Date() && (lwf_rule.period_one.to_month == wage_month || lwf_rule.period_two.to_month == wage_month ))
    {
      if(lwf_rule)
      {
        if(lwf_rule.period_one.to_month == wage_month)
        {
          var taxslabs= lwf_rule.period_one.lwf_slab;
        }
        else
        {
          var taxslabs= lwf_rule.period_two.lwf_slab; 
        }
        let emp_sel_slab = taxslabs.find(tslab_ext => tslab_ext.wage_from <= gross_earning && gross_earning <= tslab_ext.wage_to);
        if(emp_sel_slab)
        {
          var ret_lwf_data={
            employee_contribution:emp_sel_slab.employee_contribution,
            employer_contribution:emp_sel_slab.employer_contribution,
          };
        }
        else
        {
          var ret_lwf_data={
            employee_contribution:0,
            employer_contribution:0,
          };
        }
      }
      else
      {
        var ret_lwf_data={
          employee_contribution:0,
          employer_contribution:0,
        };
      }
    }
    else
    {
      var ret_lwf_data={
        employee_contribution:0,
        employer_contribution:0,
      };
    }
    console.log(ret_lwf_data);
    return ret_lwf_data;
  },
  get_arrear_data:async function(pre_salary_data,curr_salary_breakup){
    var pre_sal_head=pre_salary_data.heads;
    var curr_sal_head=curr_salary_breakup.heads;
    var head_data=await this.get_arrear_head(pre_sal_head,curr_sal_head);
    var ctc = (parseFloat(curr_salary_breakup.ctc) - parseFloat(pre_salary_data.ctc));
    var total_pf_bucket = (parseFloat(curr_salary_breakup.total_pf_wages) - parseFloat(pre_salary_data.total_pf_bucket));
    var total_pf_wages = (parseFloat(curr_salary_breakup.total_pf_wages) - parseFloat(pre_salary_data.total_pf_wages));
    var total_esic_bucket = (parseFloat(curr_salary_breakup.total_esi_wages) - parseFloat(pre_salary_data.total_esic_bucket));
    var total_esic_wages = (parseFloat(curr_salary_breakup.restrict_esic_wages) - parseFloat(pre_salary_data.total_esic_wages));
    var total_pt_wages = (parseFloat(curr_salary_breakup.total_pt_wages) - parseFloat(pre_salary_data.total_pt_wages));
    var total_tds_wages = (parseFloat(curr_salary_breakup.total_tds_wages) - parseFloat(pre_salary_data.total_tds_wages));
    var total_ot_wages = (parseFloat(curr_salary_breakup.total_ot_wages) - parseFloat(pre_salary_data.total_ot_wages));
    var total_gratuity_wages = (parseFloat(curr_salary_breakup.total_gratuity_wages) - parseFloat(pre_salary_data.total_gratuity_wages));
    var net_take_home = (parseFloat(curr_salary_breakup.net_take_home) - parseFloat(pre_salary_data.net_take_home));
    var voluntary_pf_amount = (parseFloat(curr_salary_breakup.voluntary_pf_amount) - parseFloat(pre_salary_data.voluntary_pf_amount));
    var gross_earning = (parseFloat(curr_salary_breakup.gross_earning) - parseFloat(pre_salary_data.gross_earning));
    var gross_deduct = (parseFloat(curr_salary_breakup.gross_deduct) - parseFloat(pre_salary_data.gross_deduct));
    var total_bonus_wages = (parseFloat(curr_salary_breakup.total_bonus_wages) - parseFloat(pre_salary_data.total_bonus_wages));
    var advance_recovered = (parseFloat(curr_salary_breakup.advance_recovered) - parseFloat(pre_salary_data.advance_recovered));
    var arrear_data={
      heads:head_data,
      ctc:ctc,
      total_pf_bucket:total_pf_bucket,
      total_pf_wages:total_pf_wages,
      total_esic_bucket:total_esic_bucket,
      total_esic_wages:total_esic_wages,
      total_pt_wages:total_pt_wages,
      total_tds_wages:total_tds_wages,
      total_ot_wages:total_ot_wages,
      total_gratuity_wages:total_gratuity_wages,
      net_take_home:net_take_home,
      voluntary_pf_amount:voluntary_pf_amount,
      gross_earning:gross_earning,
      gross_deduct:gross_deduct,
      total_bonus_wages:total_bonus_wages,
      advance_recovered:advance_recovered,
    };
    return arrear_data;
  },
  get_arrear_head:async function(pre_sal_head,curr_sal_head){
    const final_arr = new Map();
    for (const obj of curr_sal_head) {
      const head_id=obj.head_id;
      final_arr.set(head_id.toString(), obj);
    }
    for (const obj of pre_sal_head) {
      const id = obj.head_id;
      const existingObj = final_arr.get(id.toString());
      if (existingObj) {
        existingObj.amount -= obj.amount;
      }
      else
      {
        obj.amount=0-obj.amount;
        const head_id2=obj.head_id;
        final_arr.set(head_id2.toString(), obj)
      }
    }
    var new_array=[];
    final_arr.forEach(element => new_array.push(element));
    return new_array;
  },
  employeeDetailsLeaveCounterAssign: async function (employeeId,leave_temp_data) {
    try{
      var employee_details = await EmployeeDetails.findOne({'employee_id':employeeId});
      var documents = [];
      if(employee_details){
        if(leave_temp_data.template_data.length > 0){
          for (var i = 0; i <= leave_temp_data.template_data.length -1; i++) {
            var leaveTempHeadData = await LeaveTempHead.findOne({'_id':mongoose.Types.ObjectId(leave_temp_data.template_data[i].leave_type)});
            if(leaveTempHeadData){
              var existEmpdata = await EmployeeDetails.findOne({'employee_id':employeeId,'leave_balance_counter.abbreviation':leaveTempHeadData.abbreviation,'leave_balance_counter.tenure':leave_temp_data.template_data[i].leave_tenure});
              
              if(existEmpdata){
                if(existEmpdata.leave_balance_counter.length > 0){
                  for (var k = 0; k <= existEmpdata.leave_balance_counter.length -1; k++) {
                    if(leaveTempHeadData.abbreviation === existEmpdata.leave_balance_counter[k].abbreviation && leave_temp_data.template_data[i].leave_tenure === existEmpdata.leave_balance_counter[k].tenure){
                      documents.push({
                        '_id':existEmpdata.leave_balance_counter[k]._id,
                        'leave_temp_head_id':existEmpdata.leave_balance_counter[k].leave_temp_head_id,
                        'leave_type_name':existEmpdata.leave_balance_counter[k].leave_type_name,
                        'abbreviation':existEmpdata.leave_balance_counter[k].abbreviation,
                        // 'available': parseFloat(existEmpdata.leave_balance_counter[k].available) + parseFloat(leave_temp_data.template_data[i].no_of_day),
                        'available': parseFloat(existEmpdata.leave_balance_counter[k].available),
                        'consumed': existEmpdata.leave_balance_counter[k].consumed,
                        // 'total_balance': parseFloat(existEmpdata.leave_balance_counter[k].total_balance) + parseFloat(leave_temp_data.template_data[i].no_of_day),
                        'total_balance': parseFloat(existEmpdata.leave_balance_counter[k].total_balance),
                        'tenure': existEmpdata.leave_balance_counter[k].tenure,
                        'carryover': existEmpdata.leave_balance_counter[k].carryover,
                        'quota': leave_temp_data.template_data[i].restriction_days,
                        'encash':"0",
                        'extinguish':"0"
                      });
                    }
                  }
                }
                
              }
              else{
                documents.push({
                  'leave_temp_head_id':leaveTempHeadData._id,
                  'leave_type_name':leaveTempHeadData.full_name,
                  'abbreviation':leaveTempHeadData.abbreviation,
                  'available': parseFloat(leave_temp_data.template_data[i].restriction_days),
                  // 'available': "0",
                  'consumed': "0",
                  'total_balance': parseFloat(leave_temp_data.template_data[i].restriction_days),
                  // 'total_balance': "0",
                  'tenure': leave_temp_data.template_data[i].leave_tenure,
                  'carryover': "0",
                  'quota': leave_temp_data.template_data[i].restriction_days,
                  'encash':"0",
                  'extinguish':"0"
                });
              }
            }
          }
          var up_document = {};
          up_document["leave_balance_counter"] = documents;
          await EmployeeDetails.updateOne({'employee_id':employeeId},{ $set: up_document });
        }
      }

    } catch (e) {
      return {
        status: "error",
        message: e ? e.message : "Something went wrong",
      };
    }
  },
  calculate_consolidated_arrear:async function (consolidated_report,arrear_data ){
    if (consolidated_report == '')
    {
      consolidated_report = arrear_data;
      consolidated_report.pf_challan_referance_id='';
      consolidated_report.esic_challan_referance_id='';
    }
    else
    {
      var con_pre_sal_head=consolidated_report.heads;
      var con_curr_sal_head=arrear_data.heads;
      var con_head_data=await this.sum_arrear_head(con_pre_sal_head,con_curr_sal_head);
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
      var pf_data ={
        emoloyee_contribution:(consolidated_report.pf_data.emoloyee_contribution + arrear_data.pf_data.emoloyee_contribution),
        total_employer_contribution:(consolidated_report.pf_data.total_employer_contribution + arrear_data.pf_data.total_employer_contribution),
        emoloyer_pf_contribution:(consolidated_report.pf_data.emoloyer_pf_contribution + arrear_data.pf_data.emoloyer_pf_contribution),
        emoloyer_eps_contribution:(consolidated_report.pf_data.emoloyer_eps_contribution + arrear_data.pf_data.emoloyer_eps_contribution),
        emoloyer_edlis_contribution:(consolidated_report.pf_data.emoloyer_edlis_contribution + arrear_data.pf_data.emoloyer_edlis_contribution),
        emoloyer_epf_admin_contribution:(consolidated_report.pf_data.emoloyer_epf_admin_contribution + arrear_data.pf_data.emoloyer_epf_admin_contribution),
        emoloyer_edlis_admin_contribution:(consolidated_report.pf_data.emoloyer_edlis_admin_contribution + arrear_data.pf_data.emoloyer_edlis_admin_contribution),
        eps_wages:(consolidated_report.pf_data.eps_wages + arrear_data.pf_data.eps_wages),
        edlis_wages:(consolidated_report.pf_data.edlis_wages + arrear_data.pf_data.edlis_wages),
        total_pf_wages:(consolidated_report.esic_data.total_pf_wages + arrear_data.esic_data.total_pf_wages),
        restricted_pf_wages:(consolidated_report.esic_data.restricted_pf_wages + arrear_data.esic_data.restricted_pf_wages),
      }
      var esic_data ={
        emoloyee_contribution:(consolidated_report.esic_data.emoloyee_contribution + arrear_data.esic_data.emoloyee_contribution),
        emoloyer_contribution:(consolidated_report.esic_data.emoloyer_contribution + arrear_data.esic_data.emoloyer_contribution),
      }
      var consolidated_report={
        heads:con_head_data,
        ctc:ctc,
        total_pf_bucket:total_pf_bucket,
        total_pf_wages:total_pf_wages,
        total_esic_bucket:total_esic_bucket,
        total_esic_wages:total_esic_wages,
        total_pt_wages:total_pt_wages,
        total_tds_wages:total_tds_wages,
        total_ot_wages:total_ot_wages,
        total_gratuity_wages:total_gratuity_wages,
        net_take_home:net_take_home,
        voluntary_pf_amount:voluntary_pf_amount,
        gross_earning:gross_earning,
        gross_deduct:gross_deduct,
        total_bonus_wages:total_bonus_wages,
        advance_recovered:advance_recovered,
        pt_amount:pt_amount,
        pf_challan_referance_id:'',
        esic_challan_referance_id:'',
        pf_generate: 'no',
        esic_generate: 'no',
        pf_data:pf_data,
        esic_data:esic_data,
        total_lop:arrear_data.total_lop
      };
    }
    return consolidated_report;
  },
  sum_arrear_head:async function(con_pre_sal_head,con_curr_sal_head){

    const con_final_arr = new Map();
    for (const con_obj of con_curr_sal_head) {
      const con_head_id=con_obj.head_id;
      con_final_arr.set(con_head_id.toString(), con_obj);
    }
    for (const con_obj of con_pre_sal_head) {
      const con_id = con_obj.head_id;
      const con_existingObj = con_final_arr.get(con_id.toString());
      if (con_existingObj) {
        con_existingObj.amount = con_existingObj.amount + con_obj.amount;
      }
      else
      {
        con_obj.amount=con_obj.amount;
        //con_obj.amount=0+con_obj.amount;
        const con_head_id2=con_obj.head_id;
        con_final_arr.set(con_head_id2.toString(), con_obj)
      }
    }
    var con_new_array=[];
    con_final_arr.forEach(element => con_new_array.push(element));
    return con_new_array;
  },
  generate_salary_voucher_pdf:async function(data,pdf_title,pdf_path){
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
      var textData = "Received by Cash/Cheque Rupees "+ await inWords(parseInt(salary_data.employee_monthly_reports.total_data.total_earning)) +" From " + salary_data.companies.establishment_name;
      
      const date = new Date(salary_data.employee_monthly_reports.wage_year, salary_data.employee_monthly_reports.wage_month, 1);  // 2009-11-10
      const month = date.toLocaleString('default', { month: 'short' });
      var textData2 = "Towards Salary for the month of "+month+'/'+salary_data.employee_monthly_reports.wage_year;
      var textData3 = "Receiver: "+salary_data.emp_first_name+" "+salary_data.emp_last_name;
      var textData4 = "Print Date: "+mo(Date.now()).format('DD/MMMM/YYYY');
      var textData5 = "Rs: "+new Intl.NumberFormat().format(parseInt(salary_data.employee_monthly_reports.total_data.total_earning))+'.00';
      var docDefinition = {
        content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['38%','38%','38%'],
            headerRows: 2,
              // keepWithHeaderRows: 1,
              // margin: [30, 15],
              body: [
              [
              {text: 'Voucher No. _ _ _ _ _ _', style: 'tableHeader',  alignment: 'center', border: [false, false, false, false,], margin: [00, 10]},
              {text: 'A/c No. _ _ _ _ _ _', style: 'tableHeader',  alignment: 'center', border: [false, false, false, false,], margin: [00, 10]},
              {text: 'Work _ _ _ _ _ _', style: 'tableHeader',  alignment: 'center', border: [false, false, false, false,], margin: [00, 10]},
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
              {text:textData,  style: 'tableHeader',  alignment: 'left', margin: [40, 10, -5, -3], border: [false, false, false, false,]},
              ]
              ]
            }
          },
          {
            style:"tableExample",
            color: '#000',
            table:{
              widths: ['100%'],
              headerRows: 1,
              body:[
              [
              {text:textData2,  style: 'tableHeader',  alignment: 'left', margin: [40, 10, -5, -3], border: [false, false, false, false,]},
              ]
              ]
            }
          },
          {
            style:'tableExample',
            color: '#000',
            table:{
              widths:['50%'],
              headerRows: 1,
              body:[
              [
              {text:textData3,  style: 'tableHeader',  alignment: 'left', margin: [40, 10, -5, -3], border: [false, false, false, false,]},
              ]
              ]
            }
          },
          {
            style:'tableExample',
            color: '#000',
            thickness:50,
            table:{
              widths:['50%'],
              headerRows: 1,
              body:[
              [
              {text:textData4,  style: 'tableHeader',  alignment: 'left', margin: [40, 10, -5, -3], border: [false, false, false, false,]},
              ]
              ]
            }
          },
          {
            style:'tableExample',
            color: '#000',
            thickness:5,
            table:{
              widths:['50%','50%'],
              headerRows: 1,
              body:[
              [
              {text:textData5,  style: 'tableHeader',  alignment: 'left', margin: [40, 10, -5, -3], border: [false, false, false, false,]},
              {text:"Signature of the Receiver",  style: 'tableHeader', margin: [00, 10, -5, -3], alignment: 'right', border: [false, false, false, false,]},
              ]
              ]
            }
          }
          ],
        };

        var options = {
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
        pdfDoc.pipe(fs.createWriteStream('.'+pdf_path+pdf_title));
        pdfDoc.end();

      // console.log('called');
      return 'success';
    },
    generate_earning_certificate_pdf:async function(data,pdf_title,pdf_path){
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
      if (fs.existsSync(file_path+'/'+certificate_data.companies.com_logo)) {
        var imagelogo= {image: certificate_data.companies.com_logo, width: 50,  style: 'tableHeader',  alignment: 'left', border: [false, false, false, false], margin: [10, 0, 0, 0]};
      }
      else
      {
        var imagelogo='';
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
      if(certificate_data){
        if(certificate_data.employee_details){
          if(certificate_data.employee_details.bank_details){
            if(certificate_data.employee_details.bank_details.account_no){
              bankAccountNo = certificate_data.employee_details.bank_details.account_no;
            }
          }
          if(certificate_data.employee_details.pf_esic_details){
            if(certificate_data.employee_details.pf_esic_details.curr_er_epfo_details){
              uan_no = certificate_data.employee_details.pf_esic_details.curr_er_epfo_details.uan_no;
            }
            if(certificate_data.employee_details.pf_esic_details.curr_er_esic_details){
              esic_no = certificate_data.employee_details.pf_esic_details.curr_er_esic_details.esic_no;
            }
            
          }
          
          if(certificate_data.employee_details.employment_hr_details){
            date_of_join = certificate_data.employee_details.employment_hr_details.date_of_join;
          }
        }
        if(certificate_data.company_details){
          if(certificate_data.company_details.details){
            if(certificate_data.company_details.details.establishment_name){
              establishment_name = certificate_data.company_details.details.establishment_name;
            }
          }
        }
        if(certificate_data.company_details){
          if(certificate_data.company_details.reg_office_address){
            company_address = certificate_data.company_details.reg_office_address.door_no+" "+
                certificate_data.company_details.reg_office_address.street_name+" "+
                certificate_data.company_details.reg_office_address.locality+" "+
                certificate_data.company_details.reg_office_address.district_name+" "+
                certificate_data.company_details.reg_office_address.state+" "+
                certificate_data.company_details.reg_office_address.pin_code;
          }
        }
        if(certificate_data.designation){
          designation_name = certificate_data.designation.designation_name;
        }
        if(certificate_data.department){
          department_name = certificate_data.department.department_name;
        }
        if(certificate_data.client){
          client_code = certificate_data.client.client_code;
        }
      }
      

      var docDefinition = {
        content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['90%','25%'],
            headerRows: 2,
              // keepWithHeaderRows: 1,
              body: [
              [
              {text: establishment_name, style: 'tableHeader',   alignment: 'center', border: [false, false, false, false,], margin: [120, 10, 0, 0]},
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
            fontSize : 10,
            table: {
              widths: ['58%','58%'],
              headerRows: 5,
              body: [
              [
              {text: 'EMP ID :- '+ certificate_data.emp_id, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [40, 0]},
              {text: 'Employee Name :- '+ certificate_data.emp_first_name +" "+ certificate_data.emp_last_name, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            table: {
              widths: ['58%','58%'],
              headerRows: 6,
              body: [
              [
              {text: 'PF. No :- '+ uan_no, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [40, 0]},
              {text: 'ESI No :- '+ esic_no, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            table: {
              widths: ['58%','58%'],
              headerRows: 7,
              body: [
              [
              {text: 'Pay Days :- '+ certificate_data.paydays, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [40, 0]},
              {text: 'DOJ :- '+ date_of_join, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            table: {
              widths: ['58%','58%'],
              headerRows: 8,
              body: [
              [
              {text: 'Designation :- '+ designation_name, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [40, 0]},
              {text: 'Department :- '+ department_name, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            table: {
              widths: ['58%','58%'],
              headerRows: 9,
              body: [
              [
              {text: 'Client :- '+ client_code, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [40, 0]},
              {text: 'Bank A/c :- '+ bankAccountNo, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            table: {
              widths: ['58%','58%'],
              headerRows: 10,
              body: [
              [
              {text: 'UAN :- '+ uan_no, style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [40, 0]},
              {text: 'Remarks :- ', style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            setFontType:"bold",
            fontSize : 12,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 11,
              body: [
              [
              {text: 'Earnings', style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
              {text: 'Amount', style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
              {text: 'Deductions', style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
              {text: 'Amount', style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 12,
              body: [
              [
              {text: 'BASIC', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.basic_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: 'PF', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.pf_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 13,
              body: [
              [
              {text: 'HRA', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.hra_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: 'PT', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.pt_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 14,
              body: [
              [
              {text: 'Other allo', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.other_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: 'SUP.PF', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '0.00', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 15,
              body: [
              [
              {text: 'Lev Enc.(8)', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '0.00', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 16,
              body: [
              [
              {text: 'Bonus.Exgr', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.bonus_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 17,
              body: [
              [
              {text: 'Arr.Earn', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.arr_earn.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 18,
              body: [
              [
              {text: 'Reim.Medi', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: certificate_data.reimbursment_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 19,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 20,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 21,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 12,
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%','28.75%','28.75%'],
              headerRows: 22,
              body: [
              [
              {text: 'Total', style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
              {text: certificate_data.earning_total_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, true, true, true,], margin: [0, 0]},
              {text: 'Total', style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
              {text: certificate_data.deductions_total_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, true, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 12,
            margin: [40, 0],
            table: {
              widths: ['114.05%'],
              headerRows: 23,
              body: [
              [
              {text: 'Net Pay - '+certificate_data.net_payment.toFixed(2), style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 12,
            margin: [40, 0],
            table: {
              widths: ['114.05%'],
              headerRows: 24,
              body: [
              [
              {text: 'In Words - '+certificate_data.net_payment_in_words, style: 'tableHeader',  alignment: 'left', border: [true, false, true, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 12,
            margin: [40, 0],
            table: {
              widths: ['114.05%'],
              headerRows: 25,
              body: [
              [
              {text: 'Signature', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 12,
            margin: [40, 0],
            table: {
              widths: ['115%'],
              headerRows: 26,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'right', border: [false, false, false, false,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            margin: [40, 0],
            table: {
              widths: ['70%','43.7%'],
              headerRows: 25,
              body: [
              [
              {text: 'TDS Details', style: 'tableHeader',  alignment: 'center', border: [true, true, false, true,], margin: [0, 0]},
              {text: 'PAN : '+certificate_data.pan_no, style: 'tableHeader',  alignment: 'right', border: [false, true, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '44.65%'],
              headerRows: 25,
              body: [
              [
              {text: 'Description', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Gross', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Exempt', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Taxable', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Income Tax Deduction', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'Basic Salary', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_basic_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_basic_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Gross Salary', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.earning_total_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'DA', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Profession Tax', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_profession_tax.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'HRA', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_hra_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_hra_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Other Ded. & Standard Ded.', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_other_ded_standard_ded.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'Conveyance', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'House Property', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '-'+certificate_data.tds_house_property.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'Any Other Allowance', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_other_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_other_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Income from Other Source', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'Perquisites', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Total VI-A deduction', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_total_vi_a_deduction.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'Other Components', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Taxable Income', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_total_tax_slab_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['17.5%','17.5%','17.5%','17.5%', '22.5%', '22.5%'],
              headerRows: 25,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Surcharge + Education Cess', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tax_slab_charge_total_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['60%', '35%', '19%'],
              headerRows: 25,
              body: [
              [
              {text: 'Deduction Under Chapter VI-A', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Tax Deducted(Prev.Emplr+Other)', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['30%', '30%', '30%', '24.3%'],
              headerRows: 25,
              body: [
              [
              {text: 'Expenditure on Children Education', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_eighty_e_investments_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Tax Deducted Till date', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['30%', '30%', '30%', '24.3%'],
              headerRows: 25,
              body: [
              [
              {text: 'Housing Loan Repayment', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_eighty_ee_and_eea_investments_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Tax to be Deducted', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: (certificate_data.tds_total_tax_slab_amount - certificate_data.tax_slab_charge_total_amount).toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['30%', '30%', '30%', '24.3%'],
              headerRows: 25,
              body: [
              [
              {text: 'Life Insurance Premium', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_eighty_ccc_investments_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Monthly Projected Tax', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['29.4%', '29.3%', '55.3%'],
              headerRows: 25,
              body: [
              [
              {text: 'Public Provident Fund', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_eighty_c_investments_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'Tax Paid Details', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['33%', '33%', '8.25%', '8.25%', '8.25%' , '8.25%', '8.25%', '8.5%'],
              headerRows: 25,
              body: [
              [
              {text: 'Statutory Provident Fund', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_eighty_g_investments_amount.toFixed(2), style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'APR', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'MAY', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'JUN', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'JUL', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'AUG', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'SEP', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['33%', '33%', '8.25%', '8.25%', '8.25%' , '8.25%', '8.25%', '8.5%'],
              headerRows: 25,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_apr_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_may_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_jun_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_jul_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_aug_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_sep_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['33%', '33%', '8.25%', '8.25%', '8.25%' , '8.25%', '8.25%', '8.5%'],
              headerRows: 25,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'OCT', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'NOV', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'DEC', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'JAN', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'FEB', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: 'MAR', style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 9,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['33%', '33%', '8.25%', '8.25%', '8.25%' , '8.25%', '8.25%', '8.5%'],
              headerRows: 25,
              body: [
              [
              {text: '', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text: '', style: 'tableHeader',  alignment: 'right', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_oct_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_nov_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_dec_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_jan_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_feb_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              {text: certificate_data.tds_mar_amount.toFixed(2), style: 'tableHeader',  alignment: 'center', border: [true, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          ],
        };

        var options = {
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
        
        
        pdfDoc.pipe(fs.createWriteStream('.'+pdf_path+pdf_title));
        pdfDoc.end();

      // console.log('called');
      return 'success';
    },
    get_tds_calculate_salary_heads:async function(monthlySalaryHead, tempEarningHead){
      var headArray = [];
      monthlySalaryHead.map(function (m_heads){
        if(tempEarningHead.find(head_text => head_text.head_id.equals(m_heads.head_id))){
          headArray.push(m_heads);
        }
      })
      return headArray;
    },
    generate_bonus_slip_pdf:async function(data,pdf_title,pdf_path){
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
      if(employee_data.company_address){
        company_address = employee_data.company_address.door_no+" "+
            employee_data.company_address.street_name+" "+
            employee_data.company_address.locality+" "+
            employee_data.company_address.district_name+" "+
            employee_data.company_address.state+" "+
            employee_data.company_address.pin_code;
      }
      if(employee_data.emp_id){
        employee_code = employee_data.emp_id;
      }
      if(employee_data.emp_first_name){
        employee_name = employee_data.emp_first_name + " " +employee_data.emp_last_name;
      }
      if(employee_data.client){
        if(employee_data.client.client_code){
          employee_client = employee_data.client.client_code;
        }
      }
      if(employee_data.branch){
        if(employee_data.branch.branch_name){
          employee_branch = employee_data.branch.branch_name;
        }
      }
      if(employee_data.department){
        if(employee_data.department.department_name){
          employee_department = employee_data.department.department_name;
        }
      }
      if(employee_data.designation){
        if(employee_data.designation.designation_name){
          employee_designation = employee_data.designation.designation_name;
        }
      }
      if(employee_data.hod){
        if(employee_data.hod.first_name){
          employee_hod = employee_data.hod.first_name + " "+ employee_data.hod.last_name;
        }
      }
      if(employee_data.sex){
        if(employee_data.sex == 'm'){
          employee_gender = "Male";
        }
        else if(employee_data.sex == 'f'){
          employee_gender = "Female";
        }
        else if(employee_data.sex == 'o'){
          employee_gender = "Other";
        }
        else if(employee_data.sex == 't'){
          employee_gender = "Third Gender";
        }
      }
      if(employee_data.emp_dob){
        employee_dob = mo(employee_data.emp_dob).format('DD/MM/YYYY');
      }
      if(employee_data.date_of_join){
        employee_doj = mo(employee_data.date_of_join).format('DD/MM/YYYY');
      }
      if(employee_data.email_id){
        employee_email = employee_data.email_id;
      }
      if(employee_data.mobile_no){
        employee_phone = employee_data.mobile_no;
      }
      if(employee_data.bank){
        employee_bank = employee_data.bank;
      }
      if(employee_data.account_number){
        employee_account = employee_data.account_number;
      }
      if(employee_data.ifsc){
        employee_ifsc = employee_data.ifsc;
      }
      if(employee_data.account_type){
        employee_account_type = employee_data.account_type;
      }
      if(employee_data.aadhar_no){
        employee_aadhar = employee_data.aadhar_no;
      }
      if(employee_data.pan_no){
        employee_pan = employee_data.pan_no;
      }
      if(employee_data.uan_no){
        employee_uan = employee_data.uan_no;
      }
      if(employee_data.pf_no){
        employee_pf = employee_data.pf_no;
      }
      if(employee_data.esic_ip_no){
        employee_esic_ip_no = employee_data.esic_ip_no;
      }
        

      // console.log(file_path+'/'+employee_data.com_logo);
      if (fs.existsSync(file_path+'/'+employee_data.com_logo)) {
        var imagelogo= {image: employee_data.com_logo, width: 50,  style: 'tableHeader',  alignment: 'left', border: [false, false, false, false], margin: [40, 20, 0, 0]};
      }
      else
      {
        var imagelogo= {text: '',  style: 'tableHeader',  alignment: 'left', valign: "center", border: [false, false, false, false], margin: [40, 20, 0, 0]};
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
          fontSize : 9,
          setFontType:"bold",
          margin: [40, 0],
          table: {
            widths: ['14.375%','14.375%','14.375%','14.375%','14.375%','14.375%','14.375%','17%'],
            headerRows: 25,
            body: [
            [
            {text: "Bonus type ", style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
            {text:  "Bonus Wage", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
            {text: "Bonus Rate", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
            {text: "Bonus Amt", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
            {text: "Advance Recovered", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
            {text: "TDS", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
            {text: "Statutory Deduction", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
            {text: "Amount Remitted", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
            ],
            ]
          }
        };
        advance_details_data = {
          style: 'tableExample',
          color: '#000',
          fontSize : 9,
          setFontType:"bold",
          margin: [40, 0],
          table: {
            widths: ['14.375%','14.375%','14.375%','14.375%','14.375%','14.375%','14.375%','17%'],
            headerRows: 25,
            body: [
            [
            {text: employee_data.advance_details.bonus_type, style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
            {text:  employee_data.advance_details.bonus_wage, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
            {text: employee_data.advance_details.bonus_rate, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
            {text: employee_data.advance_details.bonus_amt, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
            {text: employee_data.advance_details.advance_recovered, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
            {text: employee_data.advance_details.tds, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
            {text: employee_data.advance_details.statutory_deduction, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
            {text: employee_data.advance_details.amount_remitted, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
            ],
            ]
          }
        };
      // }
        if(employee_data.employee_monthly_reports){
          if(employee_data.employee_monthly_reports.length > 0){
            monthly_wise_repport_header = {
              style: 'tableExample',
              color: '#000',
              fontSize : 13,
              setFontType:"bold",
              margin: [40, 0],
              table: {
                widths: ['115%'],
                headerRows: 25,
                body: [
                [
                {text: "Month wise details", style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 5]},
                ],
                ]
              }
            };
            monthly_wise_repport_data_header = {
              style: 'tableExample',
              color: '#000',
              fontSize : 12,
              setFontType:"bold",
              margin: [40, 0],
              table: {
                widths: ['28.75%','28.75%', '28.75%', '29.75%'],
                headerRows: 25,
                body: [
                [
                {text: "Wage Month", style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
                {text: "Bonus wage", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
                {text: "Bonus Rate", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
                {text: "Bonus", style: 'tableHeader',  alignment: 'left', border: [false, true, true, true,], margin: [0, 0]},
                ],
                ]
              }
            };
            var total_month_bonus_wage = 0;
            var total_month_bonus_rate = 0;
            var total_month_bonus = 0;
            employee_data.employee_monthly_reports.map(function (month_data){
              var month_full_date = mo().month(month_data.wage_month).format("MMM");
              var month_bonus_wage = "0";
              var month_bonus = "0";
              if(month_data.bonus_report){
                if(month_data.bonus_report.bonus_wages){
                  month_bonus_wage = month_data.bonus_report.bonus_wages;
                  total_month_bonus_wage += parseFloat(month_data.bonus_report.bonus_wages);
                }
              }
              if(month_data.bonus_report){
                if(month_data.bonus_report.module_data){
                  if(month_data.bonus_report.module_data.bonus_value){
                    month_bonus = month_data.bonus_report.module_data.bonus_value;
                    total_month_bonus += parseFloat(month_data.bonus_report.module_data.bonus_value);
                  }
                }
              }
              total_month_bonus_rate += parseFloat(employee_data.advance_details.bonus_rate);
              
              monthly_bonus_data.push({
                  style: 'tableExample',
                  color: '#000',
                  fontSize : 9,
                  setFontType:"bold",
                  margin: [40, 0],
                  table: {
                    widths: ['28.75%','28.75%', '28.75%', '29.75%'],
                    headerRows: 25,
                    body: [
                    [
                    {text: month_full_date +" "+month_data.wage_year , style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
                    {text: month_bonus_wage, style: 'tableHeader',  alignment: 'right', border: [false, false, true, true,], margin: [0, 0]},
                    {text: employee_data.advance_details.bonus_rate, style: 'tableHeader',  alignment: 'right', border: [false, false, true, true,], margin: [0, 0]},
                    {text: month_bonus, style: 'tableHeader',  alignment: 'right', border: [false, false, true, true,], margin: [0, 0]},
                    ],
                    ]
                  }
              });
          });
          finalMonthlyWegeData = Object.assign(monthly_bonus_data);
          monthly_wise_report_total_sum_data = {
              style: 'tableExample',
              color: '#000',
              fontSize : 12,
              setFontType:"bold",
              margin: [40, 0],
              table: {
                widths: ['28.75%','28.75%', '28.75%', '29.75%'],
                headerRows: 25,
                body: [
                [
                {text: 'Total', style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
                {text: total_month_bonus_wage, style: 'tableHeader',  alignment: 'right', border: [false, false, true, true,], margin: [0, 0]},
                {text: total_month_bonus_rate, style: 'tableHeader',  alignment: 'right', border: [false, false, true, true,], margin: [0, 0]},
                {text: total_month_bonus, style: 'tableHeader',  alignment: 'right', border: [false, false, true, true,], margin: [0, 0]},
                ],
                ]
              }
            };
        }
      }
      // console.log(finalMonthlyWegeData);
    
      var docDefinition = {
        content: [
        {
          style: 'tableExample',
          color: '#000',

          table: {
            widths: ['20%','80%'],
            headerRows: 2,
              // keepWithHeaderRows: 1,
              body: [
              [
              imagelogo,
              {text: employee_data.company_name, style: 'tableHeader',   alignment: 'center', valign: "center", border: [false, false, false, false,], margin: [0, 20, 0, 0]},
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
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['115%'],
              headerRows: 25,
              body: [
              [
              {text: "Bonus Slip for the Period :"+employee_data.from_time_period +" to " +employee_data.to_time_period, style: 'tableHeader',  alignment: 'left', border: [true, true, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "Employee Code ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_code, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "Employee Name ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_name, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "Client ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_client, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "Branch ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_branch, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "Department ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_department, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "Designation ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_designation, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "HOD ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_hod, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "Gender ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_gender, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "DOB ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_dob, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "DOJ ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_doj, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "Email Id ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_email, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "Phone ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_phone, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "Bank Name ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_bank, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "Account Number ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_account, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "IFSC Code ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_ifsc, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "Account Type ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_account_type, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "Aadhar No ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_aadhar, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "PAN No ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_pan, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "UAN No ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_uan, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "PF No ", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: employee_pf, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "ESIC/IP No ", style: 'tableHeader',  alignment: 'left', border: [true, false, true, true,], margin: [0, 0]},
              {text:  employee_esic_ip_no, style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              {text: "", style: 'tableHeader',  alignment: 'left', border: [false, false, true, true,], margin: [0, 0]},
              ],
              ]
            }
          },
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['28.75%','28.75%', '28.75%', '29.75%'],
              headerRows: 25,
              body: [
              [
              {text: "", style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 5]},
              {text: "", style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 5]},
              {text: "", style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 5]},
              {text: "", style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 5]},
              ],
              ]
            }
          },
          advance_details_header,
          advance_details_data,
          {
            style: 'tableExample',
            color: '#000',
            fontSize : 10,
            setFontType:"bold",
            margin: [40, 0],
            table: {
              widths: ['115%'],
              headerRows: 25,
              body: [
              [
              {text: "", style: 'tableHeader',  alignment: 'left', border: [false, false, false, false,], margin: [0, 5]},
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
        
        
        pdfDoc.pipe(fs.createWriteStream('.'+pdf_path+pdf_title));
        pdfDoc.end();

      // console.log('called');
      return 'success';
    },
    update_leave_summary:async function(data){

    },
  };
  async function getWeekday(month, year) {
    dateStr = parseInt(year) + "-" + parseInt(month);
    var daysInMonth = mo(dateStr, "YYYY-MM").daysInMonth();
    var arrDays = [];
    mo().set({ year: year, month: month - 1 });
    while (daysInMonth) {
      var current = mo().set({
        year: year,
        month: month - 1,
        date: parseInt(daysInMonth),
      });

      if (arrDays[current.format("dddd")]) {
        arrDays[current.format("dddd")].push(current);
      } else {
        arrDays[current.format("dddd")] = [current];
      }
      daysInMonth--;
    }

    return await arrDays;
  }

  async function inWords (num) {
    var a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
    var b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return 'zero' ; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? ' ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : '';
    return str;
  }
