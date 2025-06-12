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
const csv = require("csv-parser");
//const csv = require('csv')
const fs = require("fs");
var xl = require("excel4node");
const results = [];
const mongoose = require("mongoose");
niv.extend("unique", async ({ value, args }) => {
  const filed = args[1] || "role_id_name";
  let condition = {};

  condition[filed] = value;

  // add ignore condition
  if (args[2]) {
    condition["_id"] = { $ne: mongoose.Types.ObjectId(args[2]) };
  }

  let emailExist = await mongoose
    .model(args[0])
    .findOne(condition)
    .select(filed);

  // email already exists
  if (emailExist) {
    return false;
  }

  return true;
});
async function get_modue_data(module_list) {
  var module_data = [];
  await Promise.all(
    module_list.map(async (module) => {
      module_data[module.module_name] = module.access;
      //console.log(module_data)
    })
  ).then((module_data) => {
    //console.log(module_data);
    return module_data;
  });
}
module.exports = {
  get_weekly_holidays: async function (req, resp, next) {
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
        var sortbyfield = req.body.sortbyfield;
        if (sortbyfield) {
          var sortoption = {};
          sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
        } else {
          var sortoption = { created_at: -1 };
        }
        const options = {
          page: req.body.pageno,
          limit: 20,
          sort: sortoption,
        };
        //options[sortby]=req.body.ascdesc = 'asc'?1:-1
        //console.log(options)
        var filter_option = { corporate_id: req.authData.corporate_id };
        if (req.body.searchkey) {
          filter_option = {
            $and: [
              { corporate_id: req.authData.corporate_id },
              {
                $or: [
                  {
                    effective_from: {
                      $regex: req.body.searchkey , $options:"i",
                    },
                  },
                ],
              },
            ],
          };
        }
        weeklyHolidays.paginate(
          filter_option,
          options,
          function (err, holidays) {
            if (err)
              return resp.json({ status: "error", message: "no data found" });
            return resp
              .status(200)
              .json({ status: "success", holidays: holidays });
          }
        );
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  add_weekly_holidays: async function (req, resp) 
  {
    try {
      const v = new Validator(req.body, {
        effective_from: "required",
        weekday_no: "required",
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
        var dayOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        var document = {
          created_by: req.authId,
          corporate_id: req.authData.corporate_id,
          effective_from: req.body.effective_from,
          weekday: dayOfWeek[req.body.weekday_no],
          weekday_no: req.body.weekday_no,
          weeks: JSON.parse(req.body.weeks),
          status: "active",
          created_at: Date.now(),
        };

        weeklyHolidays.create(document, function (err, holidays) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Weekly holiday created successfully",
              holidays: holidays,
            });
        });
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },

  update_weekly_holidays: async function (req, resp) 
  {
    try {
      const v = new Validator(req.body, {
        weekly_holiday_id: "required",
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
        var document = {
          weeks: JSON.parse(req.body.weeks),
        };

        weeklyHolidays.updateOne(
          { _id: req.body.weekly_holiday_id },
          document,
          function (err, holidays) {
            if (err)
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            return resp
              .status(200)
              .send({
                status: "success",
                message: "Weekly holiday updated successfully",
                holidays: holidays,
              });
          }
        );
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  add_yearly_holidays: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        effective_from: "required",
        effective_to: "required",
        holiday_date: "required",
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
        var document = {
          created_by: req.authId,
          corporate_id: req.authData.corporate_id,
          effective_from: req.body.effective_from,
          effective_to: req.body.effective_to,
          holiday_date: req.body.holiday_date,
          holiday_reason: req.body.holiday_reason,
          status: "active",
          created_at: Date.now(),
        };

        yearlyHolidays.create(document, function (err, holidays) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Yearly holiday created successfully",
              holidays: holidays,
            });
        });
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  get_yearly_holidays: async function (req, resp, next) {
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
        var sortbyfield = req.body.sortbyfield;
        if (sortbyfield) {
          var sortoption = { corporate_id: req.authData.corporate_id };
          sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
        } else {
          var sortoption = { created_at: -1 };
        }
        const options = {
          page: req.body.pageno,
          limit: 20,
          sort: sortoption,
        };
        //options[sortby]=req.body.ascdesc = 'asc'?1:-1
        //console.log(options);
        var filter_option = { corporate_id: req.authData.corporate_id };
        if (req.body.searchkey) {
          filter_option = {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { $match: { effective_from: { $eq: req.query.searchkey } } },
            ],
          };
          //console.log(filter_option);
          //filter_option={$or:[{"effective_from":{"$date":  req.body.searchkey }}]};
        }
        yearlyHolidays.paginate(
          filter_option,
          options,
          function (err, holidays) {
            if (err)
              return resp.json({ status: "error", message: "no data found" });
            return resp
              .status(200)
              .json({ status: "success", holidays: holidays });
          }
        );
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  update_yearly_holidays: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        effective_from: "required",
        effective_to: "required",
        holiday_date: "required",
        yearly_holiday_id: "required",
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
        var document = {
          effective_from: req.body.effective_from,
          effective_to: req.body.effective_to,
          holiday_date: req.body.holiday_date,
          holiday_reason: req.body.holiday_reason,
        };

        yearlyHolidays.updateOne(
          { _id: req.body.yearly_holiday_id },
          document,
          function (err, holidays) {
            if (err)
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            return resp
              .status(200)
              .send({
                status: "success",
                message: "Yearly holiday updated successfully",
                holidays: holidays,
              });
          }
        );
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  get_attendance_configuration: async function (req, resp, next) {
    try {
      var sortoption = { created_at: -1 };
      const options = {
        limit: 1,
        sort: sortoption,
        select: "-history",
      };
      var filter_option = {
        corporate_id: req.authData.corporate_id,
        publish_status: "published",
      };
      Attendancerule.findOne(
        filter_option,
        "-history",
        { sort: { created_at: -1 } },
        function (err, attendancerule) {
          if (err) return resp.json({ status: "error", message: err.message });
          var attendance_data = {
            total_days: 0,
            reporting_time: 0,
            closing_time: 0,
            half_day_hours: 0,
            full_day_hours: 0,
            grace_period: 0,
            no_of_late: 0,
            absent: 0,
            comp_off: "yes",
            sandwich_leave: "yes",
          };
          if (attendancerule) {
            if (
              attendancerule.register_type == "half_day" ||
              attendancerule.register_type == "time"
            ) {
              attendance_data.half_day_hours =
                attendancerule.half_day_max_hours;
              attendance_data.full_day_hours =
                attendancerule.full_day_max_hours;
            }
            attendance_data.total_days =
              attendancerule.last_day_of_month == "yes"
                ? "last_day_of_month"
                : attendancerule.cut_off_day_custom;
            attendance_data.attendance_days =
              attendancerule.full_month_days == "yes"
                ? "full_month_days"
                : attendancerule.custom_days;
            attendance_data.reporting_time = attendancerule.reporting_time
              ? attendancerule.reporting_time
              : 0;
            attendance_data.closing_time = attendancerule.closing_time
              ? attendancerule.closing_time
              : 0;
            attendance_data.grace_period = attendancerule.grace_period
              ? attendancerule.grace_period
              : 0;
            attendance_data.no_of_late = attendancerule.no_of_days
              ? attendancerule.no_of_days
              : 0;
            attendance_data.absent = attendancerule.absent
              ? attendancerule.absent
              : 0;
          }

          return resp
            .status(200)
            .json({
              status: "success",
              attendance_config_data: attendance_data,
            });
        }
      );
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  add_attendance_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        attendance_date: "required",
        emp_id: "required",
        register_type: "required",
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
        var dateObj = new Date(req.body.attendance_date);
        var document = {
          corporate_id: req.authData.corporate_id,
          created_by: req.authId,
          emp_id: req.body.emp_id,
          attendance_date: req.body.attendance_date,
          login_time: req.body.login_time,
          logout_time: req.body.logout_time,
          total_logged_in: req.body.total_logged_in,
          total_break_time: req.body.total_break_time,
          break_time: req.body.break_time
            ? JSON.parse(req.body.break_time)
            : {},
          attendance_stat: req.body.attendance_stat,
          first_half: req.body.first_half,
          second_half: req.body.second_half,
          register_type: req.body.register_type,
          attendance_month: dateObj.getUTCMonth(),
          attendance_year: dateObj.getUTCFullYear(),
          login_by: "web",
          status: "active",
          created_at: Date.now(),
        };
        //console.log(document);

        EmployeeAttendance.create(document, function (err, attendance) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Attendance created successfully",
              attendance: attendance,
            });
        });
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  export_sample_attendance_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        register_type: "required",
        attendance_month: "required",
        attendance_year: "required",
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
        var month_names_short = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        var wb = new xl.Workbook();
        var ws = wb.addWorksheet("Attendance Data");
        var ws2 = wb.addWorksheet("Head Full Form");
        ws2.cell(1, 1).string("Head Abbreviations");
        ws2.cell(2, 1).string("PDL");
        ws2.cell(3, 1).string("A");
        ws2.cell(4, 1).string("P");
        ws2.cell(5, 1).string("L");
        ws2.cell(6, 1).string("H");
        ws2.cell(7, 1).string("OT");
        ws2.cell(8, 1).string("CSL");
        ws2.cell(9, 1).string("PVL");
        ws2.cell(10, 1).string("ERL");
        ws2.cell(11, 1).string("SKL");
        ws2.cell(12, 1).string("MDL");
        ws2.cell(13, 1).string("MTL");
        ws2.cell(14, 1).string("PTL");
        ws2.cell(15, 1).string("ANL");
        ws2.cell(16, 1).string("AWP");
        ws2.cell(17, 1).string("UWP");
        ws2.cell(18, 1).string("LE1");
        ws2.cell(19, 1).string("LE2");
        ws2.cell(20, 1).string("LP1");
        ws2.cell(21, 1).string("LP2");
        ws2.cell(22, 1).string("WO");

        ws2.cell(1, 2).string("Head Full Form");
        ws2.cell(2, 2).string("Paid");
        ws2.cell(3, 2).string("Absent");
        ws2.cell(4, 2).string("Present");
        ws2.cell(5, 2).string("Late");
        ws2.cell(6, 2).string("Holiday");
        ws2.cell(7, 2).string("Over Time");
        ws2.cell(8, 2).string("Casul Leave");
        ws2.cell(9, 2).string("PL");
        ws2.cell(10, 2).string("Earned Leave");
        ws2.cell(11, 2).string("Sick Leave");
        ws2.cell(12, 2).string("Medical Leave");
        ws2.cell(13, 2).string("Maternity Leave");
        ws2.cell(14, 2).string("Paternity Leave");
        ws2.cell(15, 2).string("Annual Leave");
        ws2.cell(16, 2).string("Approved Without Pay");
        ws2.cell(17, 2).string("unapproved Without Pay");
        ws2.cell(18, 2).string("Leave Earned");
        ws2.cell(19, 2).string("Leave Earned");
        ws2.cell(20, 2).string("Leave Paid");
        ws2.cell(21, 2).string("Leave Paid");
        ws2.cell(22, 2).string("Weekly Off");

        if (req.body.register_type == "wholeday") {
          var csv_name =
            "attendance_wholeday-" +
            req.body.attendance_year +
            "-" +
            month_names_short[req.body.attendance_month] +
            ".xlsx";

          var csv_count = 1;
          var csv_row_count = 1;
          var wage_month = parseFloat(req.body.attendance_month) + 1;
          var wage_year = req.body.attendance_year;
          var monthInDay = new Date(wage_year, wage_month, 0).getDate();
          ws.cell(csv_row_count, csv_count).string("emp_id");

          var search_option = {
            $match: {
              $and: [
                { corporate_id: req.authData.corporate_id },
                { parent_hods: { $in: [req.authData.user_id] } },
                { approval_status: "approved" },
              ],
            },
          };
          var search_option_details = {
            $match: {
              "employee_details.template_data.attendance_temp_data.register_type":
                req.body.register_type,
            },
          };

          var myAggregate = Employee.aggregate([
            search_option,
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
              $project: {
                _id: 1,
                userid: 1,
                approval_status: 1,
                corporate_id: 1,
                parent_hods: 1,
                emp_id: 1,
                employee_details: 1,
              },
            },
          ]).then(async (emps) => {
            //console.log(emps,myAggregate)
            var clmn_arr = {
              2: "B",
              3: "C",
              4: "D",
              5: "E",
              6: "F",
              7: "G",
              8: "H",
              9: "I",
              10: "J",
              11: "K",
              12: "L",
              13: "M",
              14: "N",
              15: "O",
              16: "P",
              17: "Q",
              18: "R",
              19: "S",
              20: "T",
              21: "U",
              22: "V",
              23: "W",
              24: "X",
              25: "Y",
              26: "Z",
              27: "AA",
              28: "AB",
              29: "AC",
              30: "AD",
              31: "AE",
              32: "AF",
            };
            await Promise.all(
              emps.map(async function (emp) {
                csv_row_count = csv_row_count + 1;
                //console.log(csv_row_count)
                ws.cell(csv_row_count, 1).string(emp.emp_id);
                for (var count = 1; monthInDay >= count; count++) {
                  ws.cell(1, csv_count + count).string(count.toString());
                  ws.addDataValidation({
                    type: "list",
                    allowBlank: false,
                    prompt: "Choose Attendance Status",
                    error: "Invalid choice was chosen",
                    showDropDown: true,
                    sqref:
                      clmn_arr[csv_count + count] +
                      csv_row_count.toString() +
                      ":" +
                      clmn_arr[csv_count + count] +
                      csv_row_count.toString(),
                    formulas: [
                      "PDL,A,P,L,H,OT,CSL,PVL,ERL,SKL,MDL,MTL,PTL,ANL,AWP,UWP,LE1,LE2,LP1,LP2,WO",
                    ],
                  });
                }
              })
            );

            wb.write(csv_name);
          });
          return resp
            .status(200)
            .json({
              status: "success",
              message: "Xlsx created successfully",
              url: baseurl + csv_name,
            });
        } else if (req.body.register_type == "halfday") {
          var csv_name =
            "attendance_halfday-" +
            req.body.attendance_year +
            "-" +
            month_names_short[req.body.attendance_month] +
            ".xlsx";

          var csv_count = 1;
          var csv_S_count = 2;
          var csv_row_count = 1;
          var wage_month = parseFloat(req.body.attendance_month) + 1;
          var wage_year = req.body.attendance_year;
          var monthInDay = new Date(wage_year, wage_month, 0).getDate();
          ws.cell(csv_row_count, csv_count).string("emp_id");

          var search_option = {
            $match: {
              $and: [
                { corporate_id: req.authData.corporate_id },
                { parent_hods: { $in: [req.authData.user_id] } },
                { approval_status: "approved" },
              ],
            },
          };
          var search_option_details = {
            $match: {
              "employee_details.template_data.attendance_temp_data.register_type":
              req.body.register_type,
            },
          };

          var myAggregate = Employee.aggregate([
            search_option,
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
              $project: {
                _id: 1,
                userid: 1,
                approval_status: 1,
                corporate_id: 1,
                parent_hods: 1,
                emp_id: 1,
                employee_details: 1,
              },
            },
          ]).then(async (emps) => {
            console.log(emps);
            var clmn_arr = {
              "2fh": "B",
              "2sh": "C",
              "3fh": "D",
              "3sh": "E",
              "4fh": "F",
              "4sh": "G",
              "5fh": "H",
              "5sh": "I",
              "6fh": "J",
              "6sh": "K",
              "7fh": "L",
              "7sh": "M",
              "8fh": "N",
              "8sh": "O",
              "9fh": "P",
              "9sh": "Q",
              "10fh": "R",
              "10sh": "S",
              "11fh": "T",
              "11sh": "U",
              "12fh": "V",
              "12sh": "W",
              "13fh": "X",
              "13sh": "Y",
              "14fh": "Z",
              "14sh": "AA",
              "15fh": "AB",
              "15sh": "AC",
              "16fh": "AD",
              "16sh": "AE",
              "17fh": "AF",
              "17sh": "AG",
              "18fh": "AH",
              "18sh": "AI",
              "19fh": "AJ",
              "19sh": "AK",
              "20fh": "AL",
              "20sh": "AM",
              "21fh": "AN",
              "21sh": "AO",
              "22fh": "AP",
              "22sh": "AQ",
              "23fh": "AR",
              "23sh": "AS",
              "24fh": "AT",
              "24sh": "AU",
              "25fh": "AV",
              "25sh": "AW",
              "26fh": "AX",
              "26sh": "AY",
              "27fh": "AZ",
              "27sh": "BA",
              "28fh": "BB",
              "28sh": "BC",
              "29fh": "BD",
              "29sh": "BE",
              "30fh": "BF",
              "30sh": "BG",
              "31fh": "BH",
              "31sh": "BI",
              "32fh": "BJ",
              "32sh": "BK",
            };
            await Promise.all(
              emps.map(async function (emp) {
                csv_row_count = csv_row_count + 1;
                ws.cell(csv_row_count, 1).string(emp.emp_id);
                var clmn_count = 1;
                for (var count = 1; monthInDay >= count; count++) {
                  ws.cell(1, csv_count + clmn_count++).string(
                    count.toString() + "FH"
                  );
                  ws.cell(1, csv_count + clmn_count++).string(
                    count.toString() + "SH"
                  );
                  ws.addDataValidation({
                    type: "list",
                    allowBlank: false,
                    prompt: "Choose Attendance Status",
                    error: "Invalid choice was chosen",
                    showDropDown: true,
                    sqref:
                      clmn_arr[csv_count + count + "fh"] +
                      csv_row_count.toString() +
                      ":" +
                      clmn_arr[csv_count + count + "fh"] +
                      csv_row_count.toString(),
                    formulas: [
                      "PDL,A,P,L,H,OT,CSL,PVL,ERL,SKL,MDL,MTL,PTL,ANL,AWP,UWP,LE1,LE2,LP1,LP2,WO",
                    ],
                  });
                  ws.addDataValidation({
                    type: "list",
                    allowBlank: false,
                    prompt: "Choose Attendance Status",
                    error: "Invalid choice was chosen",
                    showDropDown: true,
                    sqref:
                      clmn_arr[csv_count + count + "sh"] +
                      csv_row_count.toString() +
                      ":" +
                      clmn_arr[csv_count + count + "sh"] +
                      csv_row_count.toString(),
                    formulas: [
                      "PDL,A,P,L,H,OT,CSL,PVL,ERL,SKL,MDL,MTL,PTL,ANL,AWP,UWP,LE1,LE2,LP1,LP2,WO",
                    ],
                  });
                }
              })
            );

            wb.write(csv_name);
          });
          return resp
            .status(200)
            .json({
              status: "success",
              message: "Xlsx created successfully",
              url: baseurl + csv_name,
            });
        } else if (req.body.register_type == "time") {
          var csv_name =
            "attendance_time-" +
            req.body.attendance_year +
            "-" +
            month_names_short[req.body.attendance_month] +
            ".xlsx";

          var csv_count = 1;
          var csv_S_count = 2;
          var csv_row_count = 1;
          var wage_month = parseFloat(req.body.attendance_month) + 1;
          var wage_year = req.body.attendance_year;
          var monthInDay = new Date(wage_year, wage_month, 0).getDate();
          ws.cell(csv_row_count, csv_count).string("emp_id");

          var search_option = {
            $match: {
              $and: [
                { corporate_id: req.authData.corporate_id },
                { parent_hods: { $in: [req.authData.user_id] } },
                { approval_status: "approved" },
              ],
            },
          };
          var search_option_details = {
            $match: {
              "employee_details.template_data.attendance_temp_data.register_type":
                req.body.register_type,
            },
          };

          var myAggregate = Employee.aggregate([
            search_option,
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
              $project: {
                _id: 1,
                userid: 1,
                approval_status: 1,
                corporate_id: 1,
                parent_hods: 1,
                emp_id: 1,
                employee_details: 1,
              },
            },
          ]).then(async (emps) => {
            var clmn_arr = {
              "2LI": "B",
              "2LU": "C",
              "2STAT": "D",
              "2TB": "E",
              "3LI": "F",
              "3LU": "G",
              "3STAT": "H",
              "3TB": "I",
              "4LI": "J",
              "4LU": "K",
              "4STAT": "L",
              "4TB": "M",
              "5LI": "N",
              "5LU": "O",
              "5STAT": "P",
              "5TB": "Q",
              "6LI": "R",
              "6LU": "S",
              "6STAT": "T",
              "6TB": "U",
              "7LI": "V",
              "7LU": "W",
              "7STAT": "X",
              "7TB": "Y",
              "8LI": "Z",
              "8LU": "AA",
              "8STAT": "AB",
              "8TB": "AC",
              "9LI": "AD",
              "9LU": "AE",
              "9STAT": "AF",
              "9TB": "AG",
              "10LI": "AH",
              "10LU": "AI",
              "10STAT": "AJ",
              "10TB": "AK",
              "11LI": "AL",
              "11LU": "AM",
              "11STAT": "AN",
              "11TB": "AO",
              "12LI": "AP",
              "12LU": "AQ",
              "12STAT": "AR",
              "12TB": "AS",
              "13LI": "AT",
              "13LU": "AU",
              "13STAT": "AV",
              "13TB": "AW",
              "14LI": "AX",
              "14LU": "AY",
              "14STAT": "AZ",
              "14TB": "BA",
              "15LI": "BB",
              "15LU": "BC",
              "15STAT": "BD",
              "15TB": "BE",
              "16LI": "BF",
              "16LU": "BG",
              "16STAT": "BH",
              "16TB": "BI",
              "17LI": "BJ",
              "17LU": "BK",
              "17STAT": "BL",
              "17TB": "BM",
              "18LI": "BN",
              "18LU": "BO",
              "18STAT": "BP",
              "18TB": "BQ",
              "19LI": "BR",
              "19LU": "BS",
              "19STAT": "BT",
              "19TB": "BU",
              "20LI": "BV",
              "20LU": "BW",
              "20STAT": "BX",
              "20TB": "BY",
              "21LI": "BZ",
              "21LU": "CA",
              "21STAT": "CB",
              "21TB": "CC",
              "22LI": "CD",
              "22LU": "CE",
              "22STAT": "CF",
              "22TB": "CG",
              "23LI": "CH",
              "23LU": "CI",
              "23STAT": "CJ",
              "23TB": "CK",
              "24LI": "CL",
              "24LU": "CM",
              "24STAT": "CN",
              "24TB": "CO",
              "25LI": "CP",
              "25LU": "CQ",
              "25STAT": "CR",
              "25TB": "CS",
              "26LI": "CT",
              "26LU": "CU",
              "26STAT": "CV",
              "26TB": "CW",
              "27LI": "CX",
              "27LU": "CY",
              "27STAT": "CZ",
              "27TB": "DA",
              "28LI": "DB",
              "28LU": "DC",
              "28STAT": "DD",
              "28TB": "DE",
              "29LI": "DF",
              "29LU": "DG",
              "29STAT": "DH",
              "29TB": "DI",
              "30LI": "DJ",
              "30LU": "DK",
              "30STAT": "DL",
              "30TB": "DM",
              "31LI": "DN",
              "31LU": "DO",
              "31STAT": "DP",
              "31TB": "DQ",
              "32LI": "DR",
              "32LU": "DS",
              "32STAT": "DT",
              "32TB": "DU",
              
            };
            await Promise.all(
              emps.map(async function (emp) {
                csv_row_count = csv_row_count + 1;
                ws.cell(csv_row_count, 1).string(emp.emp_id);
                var clmn_count = 1;
                for (var count = 1; monthInDay >= count; count++) {
                  ws.cell(1, csv_count + clmn_count++).string(
                    count.toString() + "LI"
                  );
                  ws.cell(1, csv_count + clmn_count++).string(
                    count.toString() + "LU"
                  );
                  ws.cell(1, csv_count + clmn_count++).string(
                    count.toString() + "STAT"
                    );
                  ws.cell(1, csv_count + clmn_count++).string(
                    count.toString() + "TB"
                  );
                    ws.addDataValidation({
                      type: "list",
                      allowBlank: false,
                      prompt: "Choose Attendance Status",
                      error: "Invalid choice was chosen",
                      showDropDown: true,
                      sqref:
                        clmn_arr[csv_count + count + "STAT"] +
                        csv_row_count.toString() +
                        ":" +
                        clmn_arr[csv_count + count + "STAT"] +
                        csv_row_count.toString(),
                      formulas: [
                        "PDL,A,P,L,H,OT,CSL,PVL,ERL,SKL,MDL,MTL,PTL,ANL,AWP,UWP,LE1,LE2,LP1,LP2,WO",
                      ],
                    });
                  }
                  
              })
            );

            wb.write(csv_name);
          });
          //console.log('asdasdasd');
          wb.write(csv_name);
          return resp
            .status(200)
            .json({
              status: "success",
              message: "Xlsx created successfully",
              url: baseurl + csv_name,
            });
        } else {
          var csv_name =
            "attendance_monthly-" +
            req.body.attendance_year +
            "-" +
            month_names_short[req.body.attendance_month] +
            ".xlsx";

          var csv_row_count = 1;
          ws.cell(1, 1).string("emp_id");
          ws.cell(1, 2).string("total_attendance");
          ws.cell(1, 3).string("total_absent");
          ws.cell(1, 4).string("total_overtime");
          ws.cell(1, 5).string("total_lop");
          ws.cell(1, 6).string("total_PVL");
          ws.cell(1, 7).string("total_ERL");
          ws.cell(1, 8).string("total_PDL");
          ws.cell(1, 9).string("total_SKL");
          ws.cell(1, 10).string("total_CSL");
          ws.cell(1, 11).string("total_MDL");
          ws.cell(1, 12).string("total_MTL");
          ws.cell(1, 13).string("total_PTL");
          ws.cell(1, 14).string("total_ANL");
          ws.cell(1, 15).string("total_AWP");
          ws.cell(1, 16).string("total_UWP");
          ws.cell(1, 17).string("total_LE1");
          ws.cell(1, 18).string("total_LE2");
          ws.cell(1, 19).string("total_LP1");
          ws.cell(1, 20).string("total_LP2");
          ws.cell(1, 21).string("total_wo");
          ws.cell(1, 22).string("paydays");
          ws.cell(1, 23).string("total_late");
          ws.cell(1, 24).string("adjust_day");
          ws.cell(1, 25).string("assumed_pre_day");
          ws.cell(1, 26).string("total_present");
          ws.cell(1, 27).string("holiday");
          var search_option = {
            $match: {
              $and: [
                { corporate_id: req.authData.corporate_id },
                { parent_hods: { $in: [req.authData.user_id] } },
                { approval_status: "approved" },
              ],
            },
          };
          var search_option_details = {
            $match: {
              "employee_details.template_data.attendance_temp_data.register_type":
                req.body.register_type,
            },
          };

          var myAggregate = Employee.aggregate([
            search_option,
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
              $project: {
                _id: 1,
                userid: 1,
                approval_status: 1,
                corporate_id: 1,
                parent_hods: 1,
                emp_id: 1,
                employee_details: 1,
              },
            },
          ]).then(async (emps) => {
            //console.log(emps, myAggregate);
            var clmn_arr = {
              2: "B",
              3: "C",
              4: "D",
              5: "E",
              6: "F",
              7: "G",
              8: "H",
              9: "I",
              10: "J",
              11: "K",
              12: "L",
              13: "M",
              14: "N",
              15: "O",
              16: "P",
              17: "Q",
              18: "R",
              19: "S",
              20: "T",
              21: "U",
              22: "V",
              23: "W",
              24: "X",
              25: "Y",
              26: "Z",
              27: "AA",
              28: "AB",
              29: "AC",
              30: "AD",
              31: "AE",
              32: "AF",
            };
            await Promise.all(
              emps.map(async function (emp) {
                csv_row_count = csv_row_count + 1;
                ws.cell(csv_row_count, 1).string(emp.emp_id);
                ws.cell(csv_row_count, 2).string("0");
                ws.cell(csv_row_count, 3).string("0");
                ws.cell(csv_row_count, 4).string("0");
                ws.cell(csv_row_count, 5).string("0");
                ws.cell(csv_row_count, 6).string("0");
                ws.cell(csv_row_count, 7).string("0");
                ws.cell(csv_row_count, 8).string("0");
                ws.cell(csv_row_count, 9).string("0");
                ws.cell(csv_row_count, 10).string("0");
                ws.cell(csv_row_count, 11).string("0");
                ws.cell(csv_row_count, 12).string("0");
                ws.cell(csv_row_count, 13).string("0");
                ws.cell(csv_row_count, 14).string("0");
                ws.cell(csv_row_count, 15).string("0");
                ws.cell(csv_row_count, 16).string("0");
                ws.cell(csv_row_count, 17).string("0");
                ws.cell(csv_row_count, 18).string("0");
                ws.cell(csv_row_count, 19).string("0");
                ws.cell(csv_row_count, 20).string("0");
                ws.cell(csv_row_count, 21).string("0");
                ws.cell(csv_row_count, 22).string("0");
                ws.cell(csv_row_count, 23).string("0");
                ws.cell(csv_row_count, 24).string("0");
                ws.cell(csv_row_count, 25).string("0");
                ws.cell(csv_row_count, 26).string("0");
                ws.cell(csv_row_count, 27).string("0");
              })
            );

            wb.write(csv_name);
          });
          return resp
            .status(200)
            .json({
              status: "success",
              message: "Xlsx created successfully",
              url: baseurl + csv_name,
            });
        }
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  import_attendance_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        register_type: "required",
        attendance_month: "required",
        attendance_year: "required",
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
        // var weekly_att = await weeklyHolidays.find({"corporate_id":req.authData.corporate_id});
        // var new_week_arr=[];
        // var attendance_date= new Date("December 06, 2022 01:15:00");
        // let day_no = attendance_date.getDay();
        // var date = attendance_date.getDate();
        // var weekOfMonth = Math.ceil((date + 6 - day_no)/7).toString();
        // const filterObj = weekly_att.filter((week_val) => week_val.weekday_no == day_no);
        // await Promise.all(weekly_att.map(async (weekdata_exp,keyval) => {
        //     //console.log(weekdata_exp.weekday_no,weekdata_exp.weeks)
        //     new_week_arr[weekdata_exp.weekday_no.toString()]=weekdata_exp.weeks;
        // })).then(()=>{
        //     console.log(day_no,filterObj[0].weeks.weekOfMonth);

        //     return resp.status(200).send({ status: 'success',message:"Import successfully",new_week_arr:filterObj[0].weeks.weekOfMonth, weekly_att: weekly_att });
        // })
        //return resp.status(200).send({ status: 'success',message:"Import successfullya", weekly_att: filterObj[0].weeks[weekOfMonth] });
        if (req.body.register_type == "monthly") {
          var results = [];
          fs.createReadStream(req.files[0].path)
            .pipe(csv())
            .on("data", async function (row) {
              var new_arr = {
                register_type: "monthly",
                emp_id: row["emp_id"],
                monthly_attendance: {
                  total_attendance: row["total_attendance"],
                  total_overtime: row["total_overtime"],
                  total_lop: row["total_lop"],
                  total_PVL: row["total_PVL"],
                  total_ERL: row["total_ERL"],
                  total_PDL: row["total_PDL"],
                  total_SKL: row["total_SKL"],
                  total_CSL: row["total_CSL"],
                  total_MDL: row["total_MDL"],
                  total_MTL: row["total_MTL"],
                  total_PTL: row["total_PTL"],
                  total_ANL: row["total_ANL"],
                  total_AWP: row["total_AWP"],
                  total_UWP: row["total_UWP"],
                  total_LE1: row["total_LE1"],
                  total_LE2: row["total_LE2"],
                  total_LP1: row["total_LP1"],
                  total_LP2: row["total_LP2"],
                  total_wo: row["total_wo"],
                  paydays: row["paydays"],
                  total_late: row["total_late"],
                  adjust_day: row["adjust_day"],
                  total_present: row["total_present"],
                  holiday: row["holiday"],
                  assumed_pre_day: row["assumed_pre_day"],
                },
                created_by: req.authId,
                corporate_id: req.authData.corporate_id,
                login_by: "csv",
                status: "active",
                attendance_month: req.body.attendance_month,
                attendance_year: req.body.attendance_year,
                created_at: Date.now(),
              };
              results.push(new_arr);
            })
            .on("end", async function () {
              var failed_entry = [];
              var return_report_data = await Promise.all(
                results.map(async (new_arr, keyval) => {
                  await Employee.findOne(
                    { emp_id: new_arr.emp_id },
                    async function (err, employee_data) {
                      if (!err) {
                        if (employee_data) {
                          //console.log(new_arr);
                          await EmployeeAttendance.findOneAndUpdate(
                            {
                              emp_id: new_arr.emp_id,
                              attendance_month: new_arr.attendance_month,
                              attendance_year: new_arr.attendance_year,
                            },
                            new_arr,
                            {
                              upsert: true,
                              new: true,
                              setDefaultsOnInsert: true,
                            }
                          );
                        } else {
                          failed_entry.push(new_arr.emp_id);
                        }
                      }
                    }
                  );
                })
              );
              return resp
                .status(200)
                .send({
                  status: "success",
                  message: "Import successfully",
                  failed_entry: failed_entry,
                });
            });
        } else if (req.body.register_type == "wholeday") {
          var wage_month = req.body.attendance_month;
          var wage_year = req.body.attendance_year;
          var results = [];
          fs.createReadStream(req.files[0].path)
            .pipe(csv())
            .on("data", async function (row) {
              var monthInDay = new Date(
                wage_year,
                parseFloat(req.body.attendance_month) + 1,
                0
              ).getDate();
              for (var count = 1; monthInDay >= count; count++) {
                var attendance_date =
                  wage_year +
                  "-" +
                  (parseFloat(req.body.attendance_month) + 1) +
                  "-" +
                  count;
                // console.log(count+'-'+wage_month+'-'+wage_year);
                //var dateObj = new Date(row["attendance_date"]);

                if (row[count]) {
                  var new_arr = {
                    attendance_date: attendance_date,
                    attendance_stat: row[count],
                    register_type: "wholeday",
                    emp_id: row["emp_id"],
                    created_by: req.authId,
                    corporate_id: req.authData.corporate_id,
                    login_by: "csv",
                    status: "active",
                    attendance_month: wage_month,
                    attendance_year: wage_year,
                    created_at: Date.now(),
                  };
                  results.push(new_arr);
                }
              }

              // var dateObj = new Date(row["attendance_date"]);
              // var new_arr={
              //     attendance_date:row["attendance_date"],
              //     attendance_stat:row["attendance_stat"],
              //     register_type:'wholeday',
              //     emp_id:row["emp_id"],
              //     created_by:req.authId,
              //     corporate_id:req.authData.corporate_id,
              //     login_by:'csv',
              //     status:'active',
              //     attendance_month:dateObj.getMonth(),
              //     attendance_year:dateObj.getFullYear(),
              //     created_at:Date.now(),
              // }
              //results.push(new_arr)
            })
            .on("end", async function () {
              //console.log(results);
              var failed_entry = [];
              var return_report_data = await Promise.all(
                results.map(async (new_arr, keyval) => {
                  // await Employee.findOne({'emp_id':new_arr.emp_id}, async function (err, employee_data) {
                  //     if (!err)
                  //     {
                  //         if(employee_data)
                  //         {
                  //             await EmployeeAttendance.findOneAndUpdate({'emp_id':new_arr.emp_id,'attendance_date':new_arr.attendance_date},new_arr,{upsert: true, new: true, setDefaultsOnInsert: true})
                  //         }
                  //         else{
                  //             failed_entry.push(new_arr.emp_id);
                  //         }
                  //     }
                  // })
                })
              );
              return resp
                .status(200)
                .send({
                  status: "success",
                  message: "Import successfully",
                  failed_entry: failed_entry,
                });
            });
        } else if (req.body.register_type == "halfday") {
          var wage_month = req.body.attendance_month;
          var wage_year = req.body.attendance_year;
          var results = [];
          fs.createReadStream(req.files[0].path)
            .pipe(csv())
            .on("data", async function (row) {
              //var dateObj = new Date(row["attendance_date"]);

              var monthInDay = new Date(
                wage_year,
                parseFloat(req.body.attendance_month) + 1,
                0
              ).getDate();
              for (var count = 1; monthInDay >= count; count++) {
                var attendance_date =
                  wage_year +
                  "-" +
                  (parseFloat(req.body.attendance_month) + 1) +
                  "-" +
                  count;
                var formatated_date = DjformatDate(attendance_date);
                //console.log(formatated_date)
                if (row[count + "FH"] || row[count + "SH"]) {
                  var new_arr = {
                    attendance_date: formatated_date,
                    first_half: row[count + "FH"],
                    second_half: row[count + "SH"],
                    register_type: "halfday",
                    emp_id: row["emp_id"],
                    created_by: req.authId,
                    corporate_id: req.authData.corporate_id,
                    login_by: "csv",
                    status: "active",
                    attendance_month: wage_month,
                    attendance_year: wage_year,
                    created_at: Date.now(),
                  };
                  results.push(new_arr);
                }
              }
              // var new_arr={
              //     attendance_date:row["attendance_date"],
              //     first_half:row["first_half"],
              //     second_half:row["second_half"],
              //     register_type:'halfday',
              //     emp_id:row["emp_id"],
              //     created_by:req.authId,
              //     corporate_id:req.authData.corporate_id,
              //     login_by:'csv',
              //     status:'active',
              //     attendance_month:dateObj.getMonth(),
              //     attendance_year:dateObj.getFullYear(),
              //     created_at:Date.now(),
              // }
              // results.push(new_arr)
            })
            .on("end", async function () {
              var failed_entry = [];
              var return_report_data = await Promise.all(
                results.map(async (new_arr, keyval) => {
                  await Employee.findOne(
                    { emp_id: new_arr.emp_id },
                    async function (err, employee_data) {
                      if (!err) {
                        if (employee_data) {
                          await EmployeeAttendance.findOneAndUpdate(
                            {
                              emp_id: new_arr.emp_id,
                              attendance_date: new_arr.attendance_date,
                            },
                            new_arr,
                            {
                              upsert: true,
                              new: true,
                              setDefaultsOnInsert: true,
                            }
                          );
                        } else {
                          failed_entry.push(new_arr.emp_id);
                        }
                      }
                    }
                  );
                })
              );
              return resp
                .status(200)
                .send({
                  status: "success",
                  message: "Import successfully",
                  failed_entry: failed_entry,
                  results: results,
                });
            });
        } else if (req.body.register_type == "time") {
          var wage_month = req.body.attendance_month;
          var wage_year = req.body.attendance_year;
          var results = [];
          fs.createReadStream(req.files[0].path)
            .pipe(csv())
            .on("data", async function (row) {
              var monthInDay = new Date(wage_year,parseFloat(req.body.attendance_month) + 1,0).getDate();
              for (var count = 1; monthInDay >= count; count++) {
                if (row[count + "LI"] || row[count + "LU"]) {
                  var login_time = row[count + "LI"];
                  var logout_time = row[count + "LU"];
                  var total_break_time = row[count + "TB"];
                  var att_status = row[count + "STAT"];
                  var attendance_date =wage_year +"-" +(parseFloat(req.body.attendance_month) + 1) +"-" +count;
                  var formatated_date = DjformatDate(attendance_date);
                  var total_logged_in_time = calculateTimeDiff(
                    login_time,
                    logout_time
                  );
                  var new_arr = {
                    login_time: login_time,
                    logout_time: logout_time,
                    total_logged_in: total_logged_in_time,
                    total_break_time: total_break_time,
                    attendance_date: formatated_date,
                    attendance_stat: att_status,
                    register_type: "time",
                    emp_id: row["emp_id"],
                    created_by: req.authId,
                    corporate_id: req.authData.corporate_id,
                    login_by: "csv",
                    status: "active",
                    attendance_month: wage_month,
                    attendance_year: wage_year,
                    created_at: Date.now(),
                  };
                  results.push(new_arr);
                }
              }
            })
            .on("end", async function () {
              var failed_entry = [];
              var return_report_data = await Promise.all(
                results.map(async (new_arr, keyval) => {
                  await Employee.findOne(
                    { emp_id: new_arr.emp_id },
                    async function (err, employee_data) {
                      if (!err) {
                        if (employee_data) {
                          await EmployeeAttendance.findOneAndUpdate(
                            {
                              emp_id: new_arr.emp_id,
                              attendance_date: new_arr.attendance_date,
                            },
                            new_arr,
                            {
                              upsert: true,
                              new: true,
                              setDefaultsOnInsert: true,
                            }
                          );
                        } else {
                          failed_entry.push(new_arr.emp_id);
                        }
                      }
                    }
                  );
                })
              );
              return resp
                .status(200)
                .send({
                  status: "success",
                  message: "Import successfully",
                  failed_entry: failed_entry,
                });
            });
        }
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  get_attendance_data: async function (req, resp, next) {
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
        //console.log(req.body.search_month)
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
            "attendance.attendance_month": req.body.search_month,
            "attendance.attendance_year": req.body.search_year,
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
          //search_option_details.$match['employee_details.employment_hr_details.designation']=mongoose.Types.ObjectId(req.body.designation_id);
        }
        if (req.body.department_id) {
          var department_ids = JSON.parse(req.body.department_id);
          department_ids = department_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.department"
          ] = { $in: department_ids };
          //search_option_details.$match['employee_details.employment_hr_details.department']=mongoose.Types.ObjectId(req.body.department_id);
        }
        if (req.body.branch_id) {
          var branch_ids = JSON.parse(req.body.branch_id);
          branch_ids = branch_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.branch"
          ] = { $in: branch_ids };
          //search_option_details.$match['employee_details.employment_hr_details.branch']=mongoose.Types.ObjectId(req.body.branch_id);
        }
        if (req.body.hod_id) {
          var hod_ids = JSON.parse(req.body.hod_id);
          hod_ids = hod_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.emp_hod = { $in: hod_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
        search_option_details.$match[
          "employee_details.template_data.attendance_temp_data.register_type"
        ] = req.body.attendance_type;
        var myAggregate = Employee.aggregate([
          search_option,
          {
            $lookup: {
              from: "employees_attendances",
              localField: "emp_id",
              foreignField: "emp_id",
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
              localField: "emp_id",
              foreignField: "emp_id",
              as: "attendance_summ",
            },
          },

          search_option_details,
          {
            $addFields: {
              shift_data:{
                $arrayElemAt: ["$shifts", 0],
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
              profile_pic: 1,
              shift:1,
              shift_data:1,
              attendance: {
                $filter: {
                  input: "$attendance",
                  as: "attendance",
                  cond: {
                    $and: [
                      {
                        $eq: [
                          "$$attendance.attendance_month",
                          req.body.search_month,
                        ],
                      },
                      {
                        $eq: [
                          "$$attendance.attendance_year",
                          req.body.search_year,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        ]);
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
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  bulk_update_attendance_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        attendance_date: "required",
        register_type: "required",
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
        const options = {};
        var filter_option = {};
        var document = {};
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
        if (req.body.searchkey) {
          search_option = {
            $match: {
              $text: { $search: req.body.searchkey },
              corporate_id: req.authData.corporate_id,
            },
          };
        } else {
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
            search_option.$match.emp_id = {
              $regex: req.body.emp_id,
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
              from: "employees_attendances",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "attendance",
            },
          },
          {
            $lookup: {
              from: "attendance_summaries",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "attendance_summ",
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
              userid: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              emp_dob: 1,
              pan_no: 1,
              aadhar_no: 1,
              email_id: 1,
              empid: 1,
              client_code: 1,
              approval_status: 1,
              employee_details: 1,
              attendance_summ: 1,
              attendance_summ: {
                $filter: {
                  input: "$attendance_summ",
                  as: "attendance_summ",
                  cond: {
                    $and: [
                      {
                        $eq: [
                          "$$attendance_summ.attendance_month",
                          req.body.attendance_month,
                        ],
                      },
                      {
                        $eq: [
                          "$$attendance_summ.attendance_year",
                          req.body.attendance_year,
                        ],
                      },
                    ],
                  },
                },
              },
              attendance: {
                $filter: {
                  input: "$attendance",
                  as: "attendance",
                  cond: {
                    $and: [
                      {
                        $eq: [
                          "$$attendance.attendance_month",
                          req.body.attendance_month,
                        ],
                      },
                      {
                        $eq: [
                          "$$attendance.attendance_year",
                          req.body.attendance_year,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        ]).then(async (emps) => {
          //var emp_data=JSON.parse(req.body.emp_data);
          var dateObj = new Date(req.body.attendance_date);
          var document = {
            login_time: req.body.login_time,
            logout_time: req.body.logout_time,
            total_logged_in: req.body.total_logged_in,
            total_break_time: req.body.total_break_time,
            break_time: {},
            attendance_stat: req.body.attendance_stat,
            first_half: req.body.first_half,
            second_half: req.body.second_half,
            register_type: req.body.register_type,
            created_by: req.authId,
            corporate_id: req.authData.corporate_id,
            attendance_month: dateObj.getUTCMonth(),
            attendance_year: dateObj.getUTCFullYear(),
            status: "active",
            updated_at: Date.now(),
          };
          await Promise.all(
            emps.map(async (empdata) => {
              await EmployeeAttendance.findOneAndUpdate(
                {
                  emp_id: empdata.emp_id,
                  attendance_date: req.body.attendance_date,
                },
                document,
                { upsert: true, new: true, setDefaultsOnInsert: true },
                function (err, holidays) {
                  if (err)
                    return resp
                      .status(200)
                      .send({ status: "error", message: err.message });
                }
              );
            })
          ).then((value) => {
            return resp
              .status(200)
              .send({
                status: "success",
                message: "Attendance updated successfully",
              });
          });
        });
        var doc_data = [];
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  update_attendance_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        register_type: "required",
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
        if (req.body.register_type == "monthly") {
          const v = new Validator(req.body, {
            emp_id: "required",
            attendance_year: "required",
            attendance_month: "required",
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
            var monthly_attendance_json = JSON.parse(
              req.body.monthly_attendance
            );
            var total_attendance_summ = {
              corporate_id: req.authData.corporate_id,
              attendance_month: req.body.attendance_month,
              attendance_year: req.body.attendance_year,
              emp_id: req.body.emp_id,
              monthly_attendance: {
                total_absent: monthly_attendance_json.total_absent,
                total_attendance: monthly_attendance_json.total_attendance,
                total_overtime: monthly_attendance_json.total_overtime,
                total_lop: monthly_attendance_json.total_lop,
                total_cl: monthly_attendance_json.total_cl,
                total_pl: monthly_attendance_json.total_pl,
                total_gl: monthly_attendance_json.total_gl,
                total_ml: monthly_attendance_json.total_ml,
                total_kb: monthly_attendance_json.total_kb,
                total_hl: monthly_attendance_json.total_hl,
                total_wo: monthly_attendance_json.total_wo,
                paydays: monthly_attendance_json.paydays,
                total_late: monthly_attendance_json.total_late,
                adjust_day: monthly_attendance_json.adjust_day,
              },
            };
            await EmployeeAttendance.findOneAndUpdate(
              {
                emp_id: req.body.emp_id,
                attendance_year: req.body.attendance_year,
                attendance_month: req.body.attendance_month,
              },
              total_attendance_summ,
              { upsert: true, new: true, setDefaultsOnInsert: true },
              function (err, attendanceSummary) {
                if (err)
                  return resp.json({ status: "error", message: err.message });
                return resp
                  .status(200)
                  .json({
                    status: "success",
                    message: "Attendance updated successfully",
                    attendanceSummary: attendanceSummary,
                  });
              }
            );
          }
        } else {
          const v = new Validator(req.body, {
            emp_id: "required",
            attendance_date: "required",
            attendance_stat: "required",
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

            if (req.body.register_type === "time") {
              if(req.body.shift_timing === "yes")
              {
                var document = {
                  shift1_start_time: req.body.shift1_start_time,
                  shift1_end_time: req.body.shift1_end_time,
                  shift2_start_time: req.body.shift2_start_time,
                  shift2_end_time: req.body.shift2_end_time,
                  login_time: req.body.login_time,
                  logout_time: req.body.logout_time,
                  total_logged_in: req.body.total_logged_in,
                  total_break_time: req.body.total_break_time,
                  attendance_stat: req.body.attendance_stat,
                  register_type: req.body.register_type,
                  shift_id: mongoose.Types.ObjectId(req.body.shift_id),
                  updated_at: Date.now(),
                };
              }
              else
              {
                var document = {
                  login_time: req.body.login_time,
                  logout_time: req.body.logout_time,
                  total_logged_in: req.body.total_logged_in,
                  total_break_time: req.body.total_break_time,
                  attendance_stat: req.body.attendance_stat,
                  register_type: req.body.register_type,
                  updated_at: Date.now(),
                };
              }
            } else if (req.body.register_type === "halfday") {
              var document = {
                attendance_stat: req.body.attendance_stat,
                first_half: req.body.first_half,
                second_half: req.body.second_half,
                register_type: req.body.register_type,
                updated_at: Date.now(),
              };
            } else {
              var document = {
                attendance_stat: req.body.attendance_stat,
                register_type: req.body.register_type,
                updated_at: Date.now(),
              };
            }
            //Site_helper.check_leave_availability(req);

            if (req.body.attendance_id) {

              await EmployeeAttendance.findOneAndUpdate(
                { _id: req.body.attendance_id },
                document,
                { upsert: true, new: true, setDefaultsOnInsert: true },
                function (err, attendancedata) {
                  if (err)
                    return resp
                      .status(200)
                      .send({ status: "error", message: err.message });
                  return resp
                    .status(200)
                    .send({
                      status: "success",
                      message: "Attendance updated successfully",
                      attendancedata: attendancedata,
                    });
                }
              );
            } else {
              var attendance_date = new Date(req.body.attendance_date);
              //console.log(attendance_date);
              document["attendance_date"] = req.body.attendance_date;
              document["emp_id"] = req.body.emp_id;
              document["attendance_month"] = attendance_date.getUTCMonth();
              document["attendance_year"] = attendance_date.getUTCFullYear();
              document["login_by"] = "web";
              document["corporate_id"] = req.authData.corporate_id;
              document["status"] = "active";
              await EmployeeAttendance.findOneAndUpdate(
                {
                  emp_id: req.body.emp_id,
                  attendance_date: req.body.attendance_date,
                },
                document,
                { upsert: true, new: true, setDefaultsOnInsert: true },
                function (err, attendancedata) {
                  if (err)
                    return resp
                      .status(200)
                      .send({ status: "error", message: err.message });
                  return resp
                    .status(200)
                    .send({
                      status: "success",
                      message: "Attendance added successfully",
                      attendancedata: attendancedata,
                    });
                }
              );
            }
          }
        }
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  approve_monthly_attendance_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        attendance_month: "required",
        attendance_year: "required",
      });
      const pre_m_date = new Date(
        req.body.attendance_year +
          "-" +
          (parseFloat(req.body.attendance_month) + 1) +
          "-03"
      );
      pre_m_date.setMonth(pre_m_date.getUTCMonth() - 1);
      var pre_month = pre_m_date.getUTCMonth();
      var pre_year = pre_m_date.getUTCFullYear();
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
      if (req.body.searchkey) {
        search_option = {
          $match: {
            $text: { $search: req.body.searchkey },
            corporate_id: req.authData.corporate_id,
          },
        };
      } else {
        var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
            search_option_details=query_data.search_option_details;
            search_option=query_data.search_option;
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
      search_option_details.$match["employee_details.template_data.attendance_temp_data.register_type"] = req.body.register_type;
      search_option_details.$match["attendance.attendance_month"] = req.body.attendance_month.toString();
      search_option_details.$match["attendance.attendance_year"] = req.body.attendance_year.toString();
      var myAggregate = Employee.aggregate([
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
          $lookup: {
            from: "employees_attendances",
            "let": { "emp_id_var": "$emp_id" },            
            "pipeline": [
              { "$match": { "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }}},
              { "$lookup": {
                "from": "shifts",
                "let": { "shiftIdVar": "$shift_id" },
                "pipeline": [
                  { "$match": { "$expr": { "$eq": ["$_id", "$$shiftIdVar"] }}}
                ],
                "as": "shift_data"
              }},
              {
                $addFields: {
                  shift_data:{
                    $arrayElemAt: ["$shift_data", 0],
                  },
                }
              }
              ,
            ],
             as: "attendance",
          },
        },
        {
          $lookup: {
            from: "attendance_summaries",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "pre_att_summaries",
          },
        },
        {
          $lookup: {
            from: "after_cutoff_attendance_summaries",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "acas",
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
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
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
            emp_dob: 1,
            pan_no: 1,
            aadhar_no: 1,
            email_id: 1,
            empid: 1,
            client_code: 1,
            approval_status: 1,
            employee_details: {
              attendance_temp_data:"$employee_details.template_data.attendance_temp_data",
              leave_temp_data:"$employee_details.template_data.leave_temp_data",
              overtime_temp_data:"$employee_details.template_data.overtime_temp_data",
            },
            shift:1,
            attendance: {
              $filter: {
                input: "$attendance",
                as: "attendance",
                cond: {
                  $and: [
                    {
                      $eq: [
                        "$$attendance.attendance_month",
                        req.body.attendance_month.toString(),
                      ],
                    },
                    {
                      $eq: [
                        "$$attendance.attendance_year",
                        req.body.attendance_year.toString(),
                      ],
                    },
                  ],
                },
              },
            },
            acas: {
              $filter: {
                input: "$acas",
                as: "acas",
                cond: {
                  $and: [
                    { $eq: ["$$acas.attendance_month", pre_month.toString()] },
                    { $eq: ["$$acas.attendance_year", pre_year.toString()] },
                  ],
                },
              },
            },
            pre_att_summaries: {
              $filter: {
                input: "$pre_att_summaries",
                as: "pre_att_summaries",
                cond: {
                  $and: [
                    {
                      $eq: [
                        "$$pre_att_summaries.attendance_month",
                        pre_month.toString(),
                      ],
                    },
                    {
                      $eq: [
                        "$$pre_att_summaries.attendance_year",
                        pre_year.toString(),
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ]).then(async (emps) => {
        // console.log('====',emps,'====')
        // return resp
        //   .status(200)
        //   .json({
        //     status: "success",
        //     message: emps,
        //   });
        var leavehead = await LeaveTempHead.find(
          { status: "active", corporate_id: req.authData.corporate_id },
          "_id full_name abbreviation head_type"
        );
        var monthdays = daysInMonth(req.body.attendance_month,req.body.attendance_year);
        var responseArray = await Promise.all(
          emps.map(async function (attendancedata) {            
            if (attendancedata.employee_details) {
              if (attendancedata.employee_details.attendance_temp_data) {
                var emp_attendance_temp =attendancedata.employee_details.attendance_temp_data;
                var overtime_temp_data = attendancedata.employee_details.overtime_temp_data;
                var emp_attendance_data = attendancedata.attendance;
                var total_attendance_summ = {
                  corporate_id: req.authData.corporate_id,
                  attendance_month: req.body.attendance_month.toString(),
                  attendance_year: req.body.attendance_year.toString(),
                  emp_id: attendancedata.emp_id,
                  total_absent: 0,
                  total_attendance: 0,
                  total_overtime: 0,
                  total_lop: 0,
                  total_PVL: 0,
                  total_ERL: 0,
                  total_PDL: 0,
                  total_SKL: 0,
                  total_CSL: 0,
                  total_MDL: 0,
                  total_MTL: 0,
                  total_PTL: 0,
                  total_ANL: 0,
                  total_AWP: 0,
                  total_UWP: 0,
                  total_LE1: 0,
                  total_LE2: 0,
                  total_LP1: 0,
                  total_LP2: 0,
                  total_LP3: 0,
                  total_wo: 0,
                  paydays: 0,
                  total_late: 0,
                  total_present: 0,
                  holiday: 0,
                  adjust_day: 0,
                  supplement_adjust_day:0,
                  assumed_pre_day: 0,
                  shift_allowance:{},
                  monthdays:monthdays,
                };
                var total_attendance_summ_AC_data = {
                  corporate_id: req.authData.corporate_id,
                  attendance_month: req.body.attendance_month.toString(),
                  attendance_year: req.body.attendance_year.toString(),
                  emp_id: attendancedata.emp_id,
                  total_absent: 0,
                  total_attendance: 0,
                  total_overtime: 0,
                  total_lop: 0,
                  total_PVL: 0,
                  total_ERL: 0,
                  total_PDL: 0,
                  total_SKL: 0,
                  total_CSL: 0,
                  total_MDL: 0,
                  total_MTL: 0,
                  total_PTL: 0,
                  total_ANL: 0,
                  total_AWP: 0,
                  total_UWP: 0,
                  total_LE1: 0,
                  total_LE2: 0,
                  total_LP1: 0,
                  total_LP2: 0,
                  total_LP3: 0,
                  total_wo: 0,
                  paydays: 0,
                  total_late: 0,
                  total_present: 0,
                  holiday: 0,
                  adjust_day: 0,
                  shift_allowance:{},
                  monthdays:monthdays,
                };
                await Promise.all(
                  emp_attendance_data.map(async (attendance_data) => {
                    //console.log(attendance_data);
                    var attendancedate = new Date(
                      attendance_data.attendance_date
                    );
                    var attendance_day = attendancedate.getDate();
                    
                     
                    //var atte_adata = await Site_helper.calculate_attendance_data(attendance_data,total_attendance_summ, leavehead,emp_attendance_temp,overtime_temp_data);
                    // console.log('total_attendance_summ',total_attendance_summ);
                    
                    if (emp_attendance_temp.register_type == "monthly") {
                      total_attendance_summ.total_attendance = attendance_data.monthly_attendance.total_attendance;
                      total_attendance_summ.paydays = attendance_data.monthly_attendance.paydays;
                      total_attendance_summ.total_lop = attendance_data.monthly_attendance.total_lop;
                      total_attendance_summ.total_overtime = attendance_data.monthly_attendance.total_overtime;
                      total_attendance_summ.total_PVL = attendance_data.monthly_attendance.total_PVL;
                      total_attendance_summ.total_ERL = attendance_data.monthly_attendance.total_ERL;
                      total_attendance_summ.total_PDL = attendance_data.monthly_attendance.total_PDL;
                      total_attendance_summ.total_SKL = attendance_data.monthly_attendance.total_SKL;
                      total_attendance_summ.total_CSL = attendance_data.monthly_attendance.total_CSL;
                      total_attendance_summ.total_MDL = attendance_data.monthly_attendance.total_MDL;
                      total_attendance_summ.total_MTL = attendance_data.monthly_attendance.total_MTL;
                      total_attendance_summ.total_PTL = attendance_data.monthly_attendance.total_PTL;
                      total_attendance_summ.total_ANL = attendance_data.monthly_attendance.total_ANL;
                      total_attendance_summ.total_AWP = attendance_data.monthly_attendance.total_AWP;
                      total_attendance_summ.total_UWP = attendance_data.monthly_attendance.total_UWP;
                      total_attendance_summ.total_LE1 = attendance_data.monthly_attendance.total_LE1;
                      total_attendance_summ.total_LE2 = attendance_data.monthly_attendance.total_LE2;
                      total_attendance_summ.total_LP1 = attendance_data.monthly_attendance.total_LP1;
                      total_attendance_summ.total_LP2 = attendance_data.monthly_attendance.total_LP2;
                      total_attendance_summ.total_LP3 = attendance_data.monthly_attendance.total_LP3;
                      total_attendance_summ.total_wo = attendance_data.monthly_attendance.total_wo;
                      total_attendance_summ.total_late = attendance_data.monthly_attendance.total_late;
                      total_attendance_summ.adjust_day = attendance_data.monthly_attendance.adjust_day;
                      
                    } 
                    else
                    {
                      if (emp_attendance_temp.last_day_of_month === "yes") 
                      {
                        if(emp_attendance_temp.register_type == "time")
                        {
                          var timeCalculatedAttVal = await Site_helper.calculate_attendance_time(attendance_data, emp_attendance_temp, overtime_temp_data);
                          total_attendance_summ = await calculate_attendance_status(total_attendance_summ,timeCalculatedAttVal);
                          
                        }
                        else if (emp_attendance_temp.register_type === "halfday") 
                        {
                            var first_halfAttVal={
                              attendance_stat : attendance_data.first_half,
                              second_half_status: attendance_data.second_half,
                              attendance_val : 0.5,
                              total_late : 0,
                              total_late_hour : 0,
                              total_overtime : 0,
                              total_lop : 0,
                            }
                            var second_halfAttVal={
                              attendance_stat : attendance_data.second_half,
                              attendance_val : 0.5,
                              total_late : 0,
                              total_late_hour : 0,
                              total_overtime : 0,
                              total_lop : 0,
                            }
                            total_attendance_summ = await calculate_attendance_status(total_attendance_summ,first_halfAttVal);
                            total_attendance_summ = await calculate_attendance_status(total_attendance_summ,second_halfAttVal);

                        }
                        else
                        {
                          var timeCalculatedAttVal={
                            attendance_stat : attendance_data.attendance_stat,
                            attendance_val : 1,
                            total_late : 0,
                            total_late_hour : 0,
                            total_overtime : 0,
                            total_lop : 0,
                          }
                          total_attendance_summ_AC_date = await calculate_attendance_status(total_attendance_summ_AC_date,timeCalculatedAttVal);

                        }
                      }
                      else
                      {
                        if (attendance_day <=  emp_attendance_temp.cut_off_day_custom) 
                        {
                          if(emp_attendance_temp.register_type == "time")
                          {
                            var timeCalculatedAttVal = await Site_helper.calculate_attendance_time(attendance_data, emp_attendance_temp, overtime_temp_data);
                            total_attendance_summ = await calculate_attendance_status(total_attendance_summ,timeCalculatedAttVal);
                          }
                          else if (emp_attendance_temp.register_type === "halfday") 
                          {
                              var first_halfAttVal={
                                attendance_stat : attendance_data.first_half,
                                second_half_status: attendance_data.second_half,
                                attendance_val : 0.5,
                                total_late : 0,
                                total_late_hour : 0,
                                total_overtime : 0,
                                total_lop : 0,
                              }
                              var second_halfAttVal={
                                attendance_stat : attendance_data.second_half,
                                attendance_val : 0.5,
                                total_late : 0,
                                total_late_hour : 0,
                                total_overtime : 0,
                                total_lop : 0,
                              }
                              total_attendance_summ = await calculate_attendance_status(total_attendance_summ,first_halfAttVal);
                              total_attendance_summ = await calculate_attendance_status(total_attendance_summ,second_halfAttVal);

                          }
                          else
                          {
                            var timeCalculatedAttVal={
                              attendance_stat : attendance_data.attendance_stat,
                              attendance_val : 1,
                              total_late : 0,
                              total_late_hour : 0,
                              total_overtime : 0,
                              total_lop : 0,
                            }
                            total_attendance_summ = await calculate_attendance_status(total_attendance_summ,timeCalculatedAttVal);

                          }
                        }
                        else
                        {
                          if(emp_attendance_temp.register_type == "time")
                          {
                            var timeCalculatedAttVal = await Site_helper.calculate_attendance_time(attendance_data, emp_attendance_temp, overtime_temp_data);
                            total_attendance_summ_AC_data = await calculate_attendance_cut_off_status(total_attendance_summ_AC_data,timeCalculatedAttVal);
                          }
                          else if (emp_attendance_temp.register_type === "halfday") 
                          {
                              var first_halfAttVal={
                                attendance_stat : attendance_data.first_half,
                                second_half_status: attendance_data.second_half,
                                attendance_val : 0.5,
                                total_late : 0,
                                total_late_hour : 0,
                                total_overtime : 0,
                                total_lop : 0,
                              }
                              var second_halfAttVal={
                                attendance_stat : attendance_data.second_half,
                                attendance_val : 0.5,
                                total_late : 0,
                                total_late_hour : 0,
                                total_overtime : 0,
                                total_lop : 0,
                              }
                              total_attendance_summ_AC_data = await calculate_attendance_cut_off_status(total_attendance_summ_AC_data,first_halfAttVal);
                              total_attendance_summ_AC_date = await calculate_attendance_cut_off_status(total_attendance_summ_AC_data,second_halfAttVal);

                          }
                          else
                          {
                            var timeCalculatedAttVal={
                              attendance_stat : attendance_data.attendance_stat,
                              attendance_val : 1,
                              total_late : 0,
                              total_late_hour : 0,
                              total_overtime : 0,
                              total_lop : 0,
                            }
                            total_attendance_summ_AC_data = await calculate_attendance_cut_off_status(total_attendance_summ_AC_data,timeCalculatedAttVal);

                          }
                        }
                      }
                    }
                    
                  })
                ).then(async (value) => {
                  total_attendance_summ.next_month_data = total_attendance_summ_AC_data;
                  // If Cut OFF apply
                  if(emp_attendance_temp.last_day_of_month == 'no')
                  {
                    var assumed_pre_day = (parseInt(monthdays) - parseInt(emp_attendance_temp.cut_off_day_custom));
                    total_attendance_summ.paydays = parseFloat(total_attendance_summ.paydays) + parseFloat(assumed_pre_day);

                    // Apply last monthe after cutoff day attendance
                    var pre_att_summaries = attendancedata.pre_att_summaries;
                    if (pre_att_summaries.length > 0) {
                      var pre_month_data= pre_att_summaries[0].next_month_data;
                      var pre_mon_lop = parseFloat( pre_month_data.total_lop );
                      total_attendance_summ.adjust_day = pre_mon_lop;
                      total_attendance_summ.total_lop = total_attendance_summ.total_lop + pre_mon_lop;
                      total_attendance_summ.paydays = total_attendance_summ.paydays - pre_mon_lop;
                      total_attendance_summ.total_late = (total_attendance_summ.total_late +  parseFloat( pre_month_data.total_late ));
                      total_attendance_summ.total_overtime = (total_attendance_summ.total_overtime + parseFloat( pre_month_data.total_overtime));
                    }

                    // check no of late allowed in template
                    if ( total_attendance_summ.total_late > emp_attendance_temp.no_of_days ) {
                      total_attendance_summ.total_lop = Math.floor( total_attendance_summ.total_late /  emp_attendance_temp.no_of_days );
                    }
                  }
                  // console.log(total_attendance_summ);
                  await AttendanceSummary.findOneAndUpdate(
                    {
                      emp_id: total_attendance_summ.emp_id,
                      attendance_year:
                        total_attendance_summ.attendance_year.toString(),
                      attendance_month:
                        total_attendance_summ.attendance_month.toString(),
                    },
                    total_attendance_summ,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                  );
                  //console.log(total_attendance_summ);
                });
              }
            }
          })
        ).then(async ()=>{
          return resp
          .status(200)
          .json({
            status: "success",
            message: "Attendance approved successfuly.",
          });
        });
        
      });
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  approve_attendance_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        attendance_month: "required",
        attendance_year: "required",
      });
      const pre_m_date = new Date(
        req.body.attendance_year +
          "-" +
          (parseFloat(req.body.attendance_month) + 1) +
          "-03"
      );
      pre_m_date.setMonth(pre_m_date.getUTCMonth() - 1);
      var pre_month = pre_m_date.getUTCMonth();
      var pre_year = pre_m_date.getUTCFullYear();
      //console.log(pre_m_date,pre_month.toString())
      const options = {};
      var filter_option = {};
      var document = {};
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
      //var letter_temp = await LetterWriting.findOne({ "corporate_id": req.authData.corporate_id}, 'msg_box', { sort: { created_at: -1 } });
      //console.log(letter_temp+'sadasd')
      if (req.body.searchkey) {
        search_option = {
          $match: {
            $text: { $search: req.body.searchkey },
            corporate_id: req.authData.corporate_id,
          },
        };
      } else {
        var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
            search_option_details=query_data.search_option_details;
            search_option=query_data.search_option;
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
      search_option_details.$match["employee_details.template_data.attendance_temp_data.register_type"] = req.body.register_type;
      search_option_details.$match["attendance.attendance_month"] = req.body.attendance_month.toString();
      search_option_details.$match["attendance.attendance_year"] = req.body.attendance_year.toString();
      //console.log(req.body.attendance_year,req.body.attendance_month);
      var myAggregate = Employee.aggregate([
        search_option,

        {
          $lookup: {
            from: "employee_details",
            localField: "_id",
            foreignField: "employee_id",
            as: "employee_details",
          },
        },
        // {
        //   $lookup: {
        //     from: "employees_attendances",
        //     localField: "emp_id",
        //     foreignField: "emp_id",
        //     as: "attendance",
        //   },
        // },
        {
          $lookup: {
            from: "employees_attendances",
            "let": { "emp_id_var": "$emp_id" },            
            "pipeline": [
              { "$match": { "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }}},
              { "$lookup": {
                "from": "shifts",
                "let": { "shiftIdVar": "$shift_id" },
                "pipeline": [
                  { "$match": { "$expr": { "$eq": ["$_id", "$$shiftIdVar"] }}}
                ],
                "as": "shift_data"
              }},
              {
                $addFields: {
                  shift_data:{
                    $arrayElemAt: ["$shift_data", 0],
                  },
                }
              }
              ,
            ],
            // localField: "shift_id",
            // foreignField: "_id",
             as: "attendance",
          },
        },
        {
          $lookup: {
            from: "attendance_summaries",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "pre_att_summaries",
          },
        },
        {
          $lookup: {
            from: "after_cutoff_attendance_summaries",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "acas",
          },
        },
        
        
        // {
        //   $lookup: {
        //     from: "shifts",
        //     localField: "shift.shift_id",
        //     foreignField: "_id",
        //     as: "shifts",
        //   },
        // },
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
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            // shift_data:{
            //   $arrayElemAt: ["$shifts", 0],
            // },
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
            emp_dob: 1,
            pan_no: 1,
            aadhar_no: 1,
            email_id: 1,
            empid: 1,
            client_code: 1,
            approval_status: 1,
            employee_details: 1,
            shift:1,
            //shift_data:1,
            //shift_att_data:1,
            //emp_atten:1,
            attendance: {
              $filter: {
                input: "$attendance",
                as: "attendance",
                cond: {
                  $and: [
                    {
                      $eq: [
                        "$$attendance.attendance_month",
                        req.body.attendance_month.toString(),
                      ],
                    },
                    {
                      $eq: [
                        "$$attendance.attendance_year",
                        req.body.attendance_year.toString(),
                      ],
                    },
                  ],
                },
              },
            },
            acas: {
              $filter: {
                input: "$acas",
                as: "acas",
                cond: {
                  $and: [
                    { $eq: ["$$acas.attendance_month", pre_month.toString()] },
                    { $eq: ["$$acas.attendance_year", pre_year.toString()] },
                  ],
                },
              },
            },
            pre_att_summaries: {
              $filter: {
                input: "$pre_att_summaries",
                as: "pre_att_summaries",
                cond: {
                  $and: [
                    {
                      $eq: [
                        "$$pre_att_summaries.attendance_month",
                        pre_month.toString(),
                      ],
                    },
                    {
                      $eq: [
                        "$$pre_att_summaries.attendance_year",
                        pre_year.toString(),
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ]).then(async (emps) => {
        // console.log('====',emps,'====')
        // return resp
        //   .status(200)
        //   .json({
        //     status: "success",
        //     message: emps, 
        //   });
        var leavehead = LeaveTempHead.find(
          { status: "active", corporate_id: req.authData.corporate_id },
          "_id full_name abbreviation head_type"
        );
        var responseArray = await Promise.all(
          emps.map(async function (attendancedata) {            
            if (attendancedata.employee_details) {
              if (attendancedata.employee_details.template_data) {
                var emp_attendance_temp =attendancedata.employee_details.template_data.attendance_temp_data;
                var emp_attendance_data = attendancedata.attendance;
                //console.log(attendancedata,'------',emp_attendance_data,'======');
                var total_attendance_summ = {
                  corporate_id: req.authData.corporate_id,
                  attendance_month: req.body.attendance_month.toString(),
                  attendance_year: req.body.attendance_year.toString(),
                  emp_id: attendancedata.emp_id,
                  total_absent: 0,
                  total_attendance: 0,
                  total_overtime: 0,
                  total_lop: 0,
                  total_PVL: 0,
                  total_ERL: 0,
                  total_PDL: 0,
                  total_SKL: 0,
                  total_CSL: 0,
                  total_MDL: 0,
                  total_MTL: 0,
                  total_PTL: 0,
                  total_ANL: 0,
                  total_AWP: 0,
                  total_UWP: 0,
                  total_LE1: 0,
                  total_LE2: 0,
                  total_LP1: 0,
                  total_LP2: 0,
                  total_LP3: 0,
                  total_wo: 0,
                  paydays: 0,
                  total_late: 0,
                  total_present: 0,
                  holiday: 0,
                  adjust_day: 0,
                  supplement_adjust_day:0,
                  assumed_pre_day: 0,
                  shift_allowance:{},
                  // monthdays:daysInMonth(attendance_month,attendance_year),
                };
                var total_attendance_summ_AC_date = {
                  corporate_id: req.authData.corporate_id,
                  attendance_month: req.body.attendance_month.toString(),
                  attendance_year: req.body.attendance_year.toString(),
                  emp_id: attendancedata.emp_id,
                  total_absent: 0,
                  total_attendance: 0,
                  total_overtime: 0,
                  total_lop: 0,
                  total_PVL: 0,
                  total_ERL: 0,
                  total_PDL: 0,
                  total_SKL: 0,
                  total_CSL: 0,
                  total_MDL: 0,
                  total_MTL: 0,
                  total_PTL: 0,
                  total_ANL: 0,
                  total_AWP: 0,
                  total_UWP: 0,
                  total_LE1: 0,
                  total_LE2: 0,
                  total_LP1: 0,
                  total_LP2: 0,
                  total_LP3: 0,
                  total_wo: 0,
                  paydays: 0,
                  total_late: 0,
                  total_present: 0,
                  holiday: 0,
                  adjust_day: 0,
                  shift_allowance:[],
                };
                //var shift_data= attendancedata.shift_data;
                //var shift=attendancedata.shift;
                await Promise.all(
                  emp_attendance_data.map(async (attendance_data) => {
                    //console.log(attendance_data);
                    var attendancedate = new Date(
                      attendance_data.attendance_date
                    );
                    var attendance_day = attendancedate.getDate();
                    if (emp_attendance_temp.register_type == "monthly") {
                      total_attendance_summ.total_attendance =
                        attendance_data.monthly_attendance.total_attendance;
                      total_attendance_summ.paydays =
                        attendance_data.monthly_attendance.paydays;
                      total_attendance_summ.total_lop =
                        attendance_data.monthly_attendance.total_lop;
                      total_attendance_summ.total_overtime =
                        attendance_data.monthly_attendance.total_overtime;
                      total_attendance_summ.total_PVL =
                        attendance_data.monthly_attendance.total_PVL;
                      total_attendance_summ.total_ERL =
                        attendance_data.monthly_attendance.total_ERL;
                      total_attendance_summ.total_PDL =
                        attendance_data.monthly_attendance.total_PDL;
                      total_attendance_summ.total_SKL =
                        attendance_data.monthly_attendance.total_SKL;
                      total_attendance_summ.total_CSL =
                        attendance_data.monthly_attendance.total_CSL;
                      total_attendance_summ.total_MDL =
                        attendance_data.monthly_attendance.total_MDL;
                      total_attendance_summ.total_MTL =
                        attendance_data.monthly_attendance.total_MTL;
                      total_attendance_summ.total_PTL =
                        attendance_data.monthly_attendance.total_PTL;
                      total_attendance_summ.total_ANL =
                        attendance_data.monthly_attendance.total_ANL;
                      total_attendance_summ.total_AWP =
                        attendance_data.monthly_attendance.total_AWP;
                      total_attendance_summ.total_UWP =
                        attendance_data.monthly_attendance.total_UWP;
                      total_attendance_summ.total_LE1 =
                        attendance_data.monthly_attendance.total_LE1;
                      total_attendance_summ.total_LE2 =
                        attendance_data.monthly_attendance.total_LE2;
                      total_attendance_summ.total_LP1 =
                        attendance_data.monthly_attendance.total_LP1;
                      total_attendance_summ.total_LP2 =
                        attendance_data.monthly_attendance.total_LP2;
                      total_attendance_summ.total_LP3 =
                        attendance_data.monthly_attendance.total_LP3;
                      total_attendance_summ.total_wo =
                        attendance_data.monthly_attendance.total_wo;
                      total_attendance_summ.paydays =
                        attendance_data.monthly_attendance.paydays;
                      total_attendance_summ.total_late =
                        attendance_data.monthly_attendance.total_late;
                      total_attendance_summ.adjust_day =
                        attendance_data.monthly_attendance.adjust_day;
                      
                    } else {
                      if (emp_attendance_temp.last_day_of_month === "yes") {
                        total_attendance_summ = await calculate_attendance(
                          attendance_data,
                          total_attendance_summ,
                          await leavehead,
                          emp_attendance_temp
                        );
                      } else {
                          total_attendance_summ = await calculate_attendance(
                            attendance_data,
                            total_attendance_summ,
                            await leavehead,
                            emp_attendance_temp,
                          );
                      }
                    }
                  })
                ).then(async (value) => {
                  var monthdays = getdaysInMonth(
                    total_attendance_summ.attendance_month,
                    total_attendance_summ.attendance_year
                  );
                  if (
                    total_attendance_summ.total_late >
                    emp_attendance_temp.no_of_days
                  ) {
                    total_attendance_summ.total_lop = Math.floor(
                      total_attendance_summ.total_late /
                        emp_attendance_temp.no_of_days
                    );
                  }
                  total_attendance_summ.paydays =
                    parseFloat(total_attendance_summ.paydays) +
                    parseFloat(total_attendance_summ.assumed_pre_day);
                  var pre_att_summaries = attendancedata.pre_att_summaries;
                  if (pre_att_summaries.length > 0) {
                    var pre_mon_lop = parseFloat(
                      pre_att_summaries[0].next_month_data.total_lop
                    );
                    total_attendance_summ.adjust_day = pre_mon_lop;
                    total_attendance_summ.total_lop =
                      total_attendance_summ.total_lop + pre_mon_lop;
                    total_attendance_summ.paydays =
                      total_attendance_summ.paydays - pre_mon_lop;
                  }
                  total_attendance_summ.next_month_data =
                    total_attendance_summ_AC_date;
                  await AttendanceSummary.findOneAndUpdate(
                    {
                      emp_id: total_attendance_summ.emp_id,
                      attendance_year:
                        total_attendance_summ.attendance_year.toString(),
                      attendance_month:
                        total_attendance_summ.attendance_month.toString(),
                    },
                    total_attendance_summ,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                  );
                  //console.log(total_attendance_summ);
                });
              }
            }
          })
        );
        return resp
          .status(200)
          .json({
            status: "success",
            message: "Attendance approved successfuly..",
          });
      });
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },

  get_attendance_summary: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        attendance_month: "required",
        attendance_year: "required",
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
        var attendence_month = req.body.attendance_month;
        var attendence_year = req.body.attendance_year;
        var sortbyfield = req.body.sortbyfield;
        if (sortbyfield) {
          var sortoption = {};
          sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
        } else {
          var sortoption = { created_at: -1 };
        }
        const options = {
          page: req.body.pageno ? req.body.pageno : 1,
          limit: perpage,
          sort: sortoption,
        };
        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { parent_hods: { $in: [req.authId] } },
              { approval_status: "approved" },
            ],
          },
        };
        var search_option_details = { $match: {} };
        if (req.body.searchkey) {
          search_option = {
            $match: {
              $text: { $search: req.body.searchkey },
              corporate_id: req.authData.corporate_id,
              approval_status: "approved",
              parent_hods: { $in: [req.authId] },
            },
          };
        } else {
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
            search_option.$match.emp_id = {
              $regex: req.body.emp_id,
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
        }
        search_option_details.$match["attendance_summ.attendance_month"] =
          attendence_month.toString();
        search_option_details.$match["attendance_summ.attendance_year"] =
          attendence_year.toString();
        if (req.body.register_type) {
          search_option_details.$match["employee_details.template_data.attendance_temp_data.register_type"] = {$regex: req.body.register_type,$options: "i",};
        }
        var myAggregate = Employee.aggregate([
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
            $lookup: {
              from: "attendance_summaries",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "attendance_summ",
            },
          },
          search_option_details,
          {
            $project: {
              _id: 1,
              corporate_id: 1,
              userid: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              profile_pic: 1,
              attendance_summ: {
                $filter: {
                  input: "$attendance_summ",
                  as: "attendance_summ",
                  cond: {
                    $and: [
                      {
                        $eq: [
                          "$$attendance_summ.attendance_month",
                          attendence_month.toString(),
                        ],
                      },
                      {
                        $eq: [
                          "$$attendance_summ.attendance_year",
                          attendence_year.toString(),
                        ],
                      },
                    ],
                  },
                },
              },
              register_type: { $ifNull: [ "$employee_details.template_data.attendance_temp_data.register_type", null ] },
              monthdays: { $ifNull: [ daysInMonth(attendence_month.toString(),attendence_year.toString()), null ] }, 
            },
          },
        ]);
        Employee.aggregatePaginate(
          myAggregate,
          options,
          async function (err, attendancedata) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            return resp
              .status(200)
              .json({ status: "success", attendance_summ: attendancedata });
          }
        );
        // var filter_option={corporate_id:req.authData.corporate_id,attendance_month:req.body.attendance_month,attendance_year:req.body.attendance_year};
        // AttendanceSummary.findOne(filter_option, function (err, attendance_summary) {
        //     if (err) return resp.status(200).send({ status: 'error', message: err.message });
        //     return resp.status(200).send({ status: 'success', attendance_summary: attendance_summary });
        // })
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  get_attendance_register: async function (req, resp, next) {
    try {
      var sortoption = { created_at: -1 };
      const options = {
        sort: sortoption,
      };
      var filter_option = { corporate_id: req.authData.corporate_id };
      AttendanceRegister.findOne(filter_option, function (err, register) {
        if (err)
          return resp
            .status(200)
            .send({ status: "error", message: err.message });
        return resp.status(200).send({ status: "success", register: register });
      });
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  update_attendance_register: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        register_type: "required",
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
        var document = {
          register_type: req.body.register_type,
          daily_type: req.body.daily_type,
          corporate_id: req.authData.corporate_id,
          status: "active",
          created_at: Date.now(),
        };

        AttendanceRegister.findOneAndUpdate(
          { corporate_id: req.authData.corporate_id },
          document,
          { upsert: true, new: true, setDefaultsOnInsert: true },
          function (err, register) {
            if (err)
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            return resp
              .status(200)
              .send({
                status: "success",
                message: "Register updated successfully",
                register: register,
              });
          }
        );
      }
    } catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
};
function calculateTimeDiff(startTime, endTime) {
  //create date format
  var timeStart = new Date("2022-10-04 " + startTime).getHours();
  var timeEnd = new Date("2022-10-04 " + endTime).getHours();

  var hourDiff = timeEnd - timeStart;
  return hourDiff;
}
function process_csv_data(new_arr, emp_id) {
  var retvar = "aa";
  Employee.findOne(
    { emp_id: new_arr.emp_id },
    "_id",
    async function (err, employee_data) {
      if (err) {
        // results.push(new_arr);
        // console.log('failed')
      } else {
        if (employee_data) {
          await EmployeeAttendance.create(new_arr);
          retvar = "success";
          return retvar;
        } else {
          //results.push(new_arr);
          //console.log("failed", new_arr.emp_id);
          retvar = "failed";
          return retvar;
        }
      }
    }
  );
  return retvar;
}
function calculate_attendance_status (total_attendance_summ,calculatedAttVal)
{
  //console.log(calculatedAttVal,total_attendance_summ);
  var attendance_stat = calculatedAttVal.attendance_stat;
  var attendance_val = calculatedAttVal.attendance_val;
  var total_late = calculatedAttVal.total_late | 0 ;
  var total_late_hour = calculatedAttVal.total_late_hour;
  var total_overtime = calculatedAttVal.total_overtime;
  switch (attendance_stat) {
    case "PDL":
      total_attendance_summ.total_attendance = total_attendance_summ.total_attendance + attendance_val;
      total_attendance_summ.paydays = total_attendance_summ.paydays + attendance_val;
      break;
    case "P":
      if(total_late == 1)
      {
        var total_late_ = total_attendance_summ.total_late + 1;
        total_attendance_summ.total_late=total_late_; 

        if(total_attendance_summ.total_late_hour){
          total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
        }
        else{
          total_attendance_summ.total_late_hour = total_late_hour;
        }
      }
      total_attendance_summ.total_present = total_attendance_summ.total_present + attendance_val;
      total_attendance_summ.paydays = total_attendance_summ.paydays + attendance_val;
      if(total_overtime)
      {
        total_attendance_summ.total_overtime = (total_attendance_summ.total_overtime + total_overtime);  
      }
      break;
    case "H":
      total_attendance_summ.holiday = total_attendance_summ.holiday + attendance_val;
      total_attendance_summ.paydays = total_attendance_summ.paydays + attendance_val;
      break;
    case "L":
        total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
        if(total_late_hour > 0)
        {
          if(total_attendance_summ.total_late_hour){
            total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
          }
          else{
            total_attendance_summ.total_late_hour = total_late_hour;
          }
        }
        total_attendance_summ.total_attendance = total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays = total_attendance_summ.paydays + attendance_val;
      break;
    case "A":
      total_attendance_summ.total_absent = total_attendance_summ.total_absent + attendance_val;
      if(total_lop == 0)
      {
        total_attendance_summ.total_lop = total_attendance_summ.total_lop + attendance_val;
      }
      break;
    case "OT":
      if(total_overtime)
      {
        total_attendance_summ.total_overtime = (total_attendance_summ.total_overtime + (total_logged_in + total_overtime));
      }
      else
      {
        total_attendance_summ.total_overtime =  total_attendance_summ.total_overtime + attendance_val;
      }
      break;
    case "CSL":
      total_attendance_summ.total_CSL =  total_attendance_summ.total_CSL + attendance_val;
      total_attendance_summ.paydays =  total_attendance_summ.paydays + attendance_val;
      break;
    case "PVL":
      total_attendance_summ.total_PVL =  total_attendance_summ.total_PVL + attendance_val;
      total_attendance_summ.paydays =  total_attendance_summ.paydays + attendance_val;
      break;
    case "ERL":
      total_attendance_summ.total_ERL =  total_attendance_summ.total_ERL + attendance_val;
      total_attendance_summ.paydays =  total_attendance_summ.paydays + attendance_val;
      break;
    case "SKL":
      total_attendance_summ.total_SKL =   total_attendance_summ.total_SKL + attendance_val;
      total_attendance_summ.paydays =  total_attendance_summ.paydays + attendance_val;
      break;
    case "MDL":
      total_attendance_summ.total_MDL =  total_attendance_summ.total_MDL + attendance_val;
      total_attendance_summ.paydays =  total_attendance_summ.paydays + attendance_val;
      break;
    case "MTL":
      total_attendance_summ.total_MTL =  total_attendance_summ.total_MTL + attendance_val;
      total_attendance_summ.paydays =  total_attendance_summ.paydays + attendance_val;
      break;
    case "PTL":
      total_attendance_summ.total_PTL =   total_attendance_summ.total_PTL + attendance_val;
      total_attendance_summ.paydays =   total_attendance_summ.paydays + attendance_val;
      break;
    case "ANL":
      total_attendance_summ.total_ANL =  total_attendance_summ.total_ANL + attendance_val;
      total_attendance_summ.paydays =  total_attendance_summ.paydays + attendance_val;
      break;
    case "AWP":
      total_attendance_summ.total_AWP =  total_attendance_summ.total_AWP + attendance_val;
      total_attendance_summ.total_lop =  total_attendance_summ.total_lop + attendance_val;
      break;
    case "UWP":
      total_attendance_summ.total_UWP =  total_attendance_summ.total_UWP + attendance_val;
      total_attendance_summ.total_lop =  total_attendance_summ.total_lop + attendance_val;
      break;
    case "LE1":
      total_attendance_summ.total_LE1 =   total_attendance_summ.total_LE1 + attendance_val;
      total_attendance_summ.paydays =   total_attendance_summ.paydays + attendance_val;
      break;
    case "LE2":
      total_attendance_summ.total_LE2 =   total_attendance_summ.total_LE2 + attendance_val;
      total_attendance_summ.paydays =   total_attendance_summ.paydays + attendance_val;
      break;
    case "LP1":
      total_attendance_summ.total_LP1 =   total_attendance_summ.total_LP1 + attendance_val;
      total_attendance_summ.paydays =   total_attendance_summ.paydays + attendance_val;
      break;
    case "LP2":
      total_attendance_summ.total_LP2 =   total_attendance_summ.total_LP2 + attendance_val;
      total_attendance_summ.paydays =   total_attendance_summ.paydays + attendance_val;
      break;
    case "WO":
      total_attendance_summ.total_wo =   total_attendance_summ.total_wo + attendance_val;
      total_attendance_summ.paydays =   total_attendance_summ.paydays + attendance_val;
      break;
  }
  return total_attendance_summ;
}
function calculate_attendance_cut_off_status (total_attendance_summ_AC_data,calculatedAttVal)
{
  //console.log(calculatedAttVal,total_attendance_summ);
  var attendance_stat = calculatedAttVal.attendance_stat;
  var attendance_val = calculatedAttVal.attendance_val;
  var total_late = calculatedAttVal.total_late | 0 ;
  var total_late_hour = calculatedAttVal.total_late_hour;
  var total_overtime = calculatedAttVal.total_overtime;
  switch (attendance_stat) {
    case "PDL":
      total_attendance_summ_AC_data.total_attendance = total_attendance_summ_AC_data.total_attendance + attendance_val;
      total_attendance_summ_AC_data.paydays = total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "P":
      if(total_late == 1)
      {
        var total_late_ = total_attendance_summ_AC_data.total_late + 1;
        total_attendance_summ_AC_data.total_late=total_late_; 

        if(total_attendance_summ_AC_data.total_late_hour){
          total_attendance_summ_AC_data.total_late_hour = parseFloat(total_attendance_summ_AC_data.total_late_hour) + total_late_hour;
        }
        else{
          total_attendance_summ_AC_data.total_late_hour = total_late_hour;
        }
      }
      total_attendance_summ_AC_data.total_present = total_attendance_summ_AC_data.total_present + attendance_val;
      total_attendance_summ_AC_data.paydays = total_attendance_summ_AC_data.paydays + attendance_val;
      if(total_overtime)
      {
        total_attendance_summ_AC_data.total_overtime = (total_attendance_summ_AC_data.total_overtime + total_overtime);  
      }
      break;
    case "H":
      total_attendance_summ_AC_data.holiday = total_attendance_summ_AC_data.holiday + attendance_val;
      total_attendance_summ_AC_data.paydays = total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "L":
        total_attendance_summ_AC_data.total_late = total_attendance_summ_AC_data.total_late + 1;
        if(total_late_hour > 0)
        {
          if(total_attendance_summ_AC_data.total_late_hour){
            total_attendance_summ_AC_data.total_late_hour = parseFloat(total_attendance_summ_AC_data.total_late_hour) + total_late_hour;
          }
          else{
            total_attendance_summ_AC_data.total_late_hour = total_late_hour;
          }
        }
        total_attendance_summ_AC_data.total_attendance = total_attendance_summ_AC_data.total_attendance + attendance_val;
        total_attendance_summ_AC_data.paydays = total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "A":
      total_attendance_summ_AC_data.total_absent = total_attendance_summ_AC_data.total_absent + attendance_val;
      if(total_lop == 0)
      {
        total_attendance_summ_AC_data.total_lop = total_attendance_summ_AC_data.total_lop + attendance_val;
      }
      break;
    case "OT":
      if(total_overtime)
      {
        total_attendance_summ_AC_data.total_overtime = (total_attendance_summ_AC_data.total_overtime + (total_logged_in + total_overtime));
      }
      else
      {
        total_attendance_summ_AC_data.total_overtime =  total_attendance_summ_AC_data.total_overtime + attendance_val;
      }
      break;
    case "CSL":
      total_attendance_summ_AC_data.total_CSL =  total_attendance_summ_AC_data.total_CSL + attendance_val;
      total_attendance_summ_AC_data.paydays =  total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "PVL":
      total_attendance_summ_AC_data.total_PVL =  total_attendance_summ_AC_data.total_PVL + attendance_val;
      total_attendance_summ_AC_data.paydays =  total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "ERL":
      total_attendance_summ_AC_data.total_ERL =  total_attendance_summ_AC_data.total_ERL + attendance_val;
      total_attendance_summ_AC_data.paydays =  total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "SKL":
      total_attendance_summ_AC_data.total_SKL =   total_attendance_summ_AC_data.total_SKL + attendance_val;
      total_attendance_summ_AC_data.paydays =  total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "MDL":
      total_attendance_summ_AC_data.total_MDL =  total_attendance_summ_AC_data.total_MDL + attendance_val;
      total_attendance_summ_AC_data.paydays =  total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "MTL":
      total_attendance_summ_AC_data.total_MTL =  total_attendance_summ_AC_data.total_MTL + attendance_val;
      total_attendance_summ_AC_data.paydays =  total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "PTL":
      total_attendance_summ_AC_data.total_PTL =   total_attendance_summ_AC_data.total_PTL + attendance_val;
      total_attendance_summ_AC_data.paydays =   total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "ANL":
      total_attendance_summ_AC_data.total_ANL =  total_attendance_summ_AC_data.total_ANL + attendance_val;
      total_attendance_summ_AC_data.paydays =  total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "AWP":
      total_attendance_summ_AC_data.total_AWP =  total_attendance_summ_AC_data.total_AWP + attendance_val;
      total_attendance_summ_AC_data.total_lop =  total_attendance_summ_AC_data.total_lop + attendance_val;
      break;
    case "UWP":
      total_attendance_summ_AC_data.total_UWP =  total_attendance_summ_AC_data.total_UWP + attendance_val;
      total_attendance_summ_AC_data.total_lop =  total_attendance_summ_AC_data.total_lop + attendance_val;
      break;
    case "LE1":
      total_attendance_summ_AC_data.total_LE1 =   total_attendance_summ_AC_data.total_LE1 + attendance_val;
      total_attendance_summ_AC_data.paydays =   total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "LE2":
      total_attendance_summ_AC_data.total_LE2 =   total_attendance_summ_AC_data.total_LE2 + attendance_val;
      total_attendance_summ_AC_data.paydays =   total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "LP1":
      total_attendance_summ_AC_data.total_LP1 =   total_attendance_summ_AC_data.total_LP1 + attendance_val;
      total_attendance_summ_AC_data.paydays =   total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "LP2":
      total_attendance_summ_AC_data.total_LP2 =   total_attendance_summ_AC_data.total_LP2 + attendance_val;
      total_attendance_summ_AC_data.paydays =   total_attendance_summ_AC_data.paydays + attendance_val;
      break;
    case "WO":
      total_attendance_summ_AC_data.total_wo =   total_attendance_summ_AC_data.total_wo + attendance_val;
      total_attendance_summ_AC_data.paydays =   total_attendance_summ_AC_data.paydays + attendance_val;
      break;
  }
  return total_attendance_summ_AC_data;
}
function calculate_attendance(
  attendance_data,
  total_attendance_summ,
  leavehead,
  emp_attendance_temp,
  shift_data,
  shift
) {
  //data_replace
  //console.log('shift_data',shift_data);

  if (emp_attendance_temp.register_type === "time") {
    var attendance_date=new Date(attendance_data.attendance_date);
    //console.log('time',shift.shift_start_date,attendance_date,shift.shift_end_date);
    var attendance_val = 1;
    var absent_day = 0;
    var total_late =0;
    var total_late_hour =0;
    var total_lop= 0;
    var cal_attendance_val=0;
    var total_overtime=0;
    var full_day_max_hours = parseFloat(emp_attendance_temp.full_day_max_hours);
    var half_day_max_hours = parseFloat(emp_attendance_temp.half_day_max_hours);
    var grace_period = emp_attendance_temp.grace_period;
    //console.log(shift.shift_start_date , attendance_date , attendance_date , shift.shift_end_date)
    var shift_data = attendance_data.shift_data;
    //console.log('shift_data',shift_data);
    if(shift_data)
    {
      //console.log('shift_data',shift_data._id);
      if(total_attendance_summ.shift_allowance[shift_data._id])
      {
        total_attendance_summ.shift_allowance[shift_data._id] =total_attendance_summ.shift_allowance[shift_data._id]+1
      }
      else
      {
        total_attendance_summ.shift_allowance[shift_data._id]=1;
      }
      //console.log('aaa',total_attendance_summ.shift_allowance);
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
      var attendence_time_start=Site_helper.get_time_to_current_time(attendence_start);
      var attendence_time_end=Site_helper.get_time_to_current_time(attendence_end);
      var reporting_time_start=Site_helper.get_time_to_current_time(reporting_time);
      var reporting_time_end=Site_helper.get_time_to_current_time(closing_time);
      reporting_time_start = reporting_time_start + parseFloat(grace_period);
      var total_logged_in = ((( attendence_time_end - attendence_time_start) / 60) - total_break_time) ;

      if (attendence_time_start > reporting_time_start) {
        total_late = 1;
        // console.log(attendence_time_start);
        total_late_hour = attendence_time_start - reporting_time_start;
      }
    }
    //console.log(attendance_date,attendence_time_end,attendence_time_start,total_break_time,'total_logged_in',total_logged_in,'aaa',total_attendance_summ.shift_allowance,shift_data);
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
        total_attendance_summ.total_lop = total_attendance_summ.total_lop + 1;
      }
    switch (attendance_data.attendance_stat) {
      case "PDL":
        total_attendance_summ.total_attendance =
          total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "P":
        if(total_late == 1)
        {
          total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
            if(total_attendance_summ.total_late_hour){
		        total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
		    }
		    else{
		    	total_attendance_summ.total_late_hour = total_late_hour;
		    }
        }
        
        total_attendance_summ.total_present = total_attendance_summ.total_present + cal_attendance_val;
        total_attendance_summ.paydays = total_attendance_summ.paydays + cal_attendance_val;
        total_attendance_summ.total_overtime = (total_attendance_summ.total_overtime + total_overtime);  
        break;
      case "H":
        total_attendance_summ.holiday =
          total_attendance_summ.holiday + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "L":
          total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
           if(total_attendance_summ.total_late_hour){
		        total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
		    }
		    else{
		    	total_attendance_summ.total_late_hour = total_late_hour;
		    }
          total_attendance_summ.total_attendance = total_attendance_summ.total_attendance + attendance_val;
          total_attendance_summ.paydays = total_attendance_summ.paydays + attendance_val;
        break;
      case "A":
        total_attendance_summ.total_absent = total_attendance_summ.total_absent + attendance_val;
        if(total_lop == 0)
        {
          total_attendance_summ.total_lop = total_attendance_summ.total_lop + attendance_val;
        }
        break;
      case "OT":
        total_attendance_summ.total_overtime = (total_attendance_summ.total_overtime + (total_logged_in + total_overtime));
        break;
      case "CSL":
        total_attendance_summ.total_CSL =
          total_attendance_summ.total_CSL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PVL":
        total_attendance_summ.total_PVL =
          total_attendance_summ.total_PVL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ERL":
        total_attendance_summ.total_ERL =
          total_attendance_summ.total_ERL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "SKL":
        total_attendance_summ.total_SKL =
          total_attendance_summ.total_SKL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MDL":
        total_attendance_summ.total_MDL =
          total_attendance_summ.total_MDL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MTL":
        total_attendance_summ.total_MTL =
          total_attendance_summ.total_MTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PTL":
        total_attendance_summ.total_PTL =
          total_attendance_summ.total_PTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ANL":
        total_attendance_summ.total_ANL =
          total_attendance_summ.total_ANL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "AWP":
        total_attendance_summ.total_AWP =
          total_attendance_summ.total_AWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "UWP":
        total_attendance_summ.total_UWP =
          total_attendance_summ.total_UWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "LE1":
        total_attendance_summ.total_LE1 =
          total_attendance_summ.total_LE1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LE2":
        total_attendance_summ.total_LE2 =
          total_attendance_summ.total_LE2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP1":
        total_attendance_summ.total_LP1 =
          total_attendance_summ.total_LP1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP2":
        total_attendance_summ.total_LP2 =
          total_attendance_summ.total_LP2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "WO":
        total_attendance_summ.total_wo =
          total_attendance_summ.total_wo + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
    }
  } 
  else if (emp_attendance_temp.register_type === "halfday") {
    var attendance_val = 0.5;
    switch (attendance_data.first_half) {
      case "PDL":
        total_attendance_summ.total_attendance =
          total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "P":
        total_attendance_summ.total_present =
          total_attendance_summ.total_present + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "H":
        total_attendance_summ.holiday =
          total_attendance_summ.holiday + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "L":
        total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
        if(total_attendance_summ.total_late_hour){
	        total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
	    }
	    else{
	    	total_attendance_summ.total_late_hour = total_late_hour;
	    }
        total_attendance_summ.total_attendance =
          total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "A":
        total_attendance_summ.total_absent =
          total_attendance_summ.total_absent + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "OT":
        total_attendance_summ.total_overtime =
          total_attendance_summ.total_overtime + attendance_val;
        break;
      case "CSL":
        total_attendance_summ.total_CSL =
          total_attendance_summ.total_CSL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PVL":
        total_attendance_summ.total_PVL =
          total_attendance_summ.total_PVL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ERL":
        total_attendance_summ.total_ERL =
          total_attendance_summ.total_ERL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "SKL":
        total_attendance_summ.total_SKL =
          total_attendance_summ.total_SKL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MDL":
        total_attendance_summ.total_MDL =
          total_attendance_summ.total_MDL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MTL":
        total_attendance_summ.total_MTL =
          total_attendance_summ.total_MTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PTL":
        total_attendance_summ.total_PTL =
          total_attendance_summ.total_PTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ANL":
        total_attendance_summ.total_ANL =
          total_attendance_summ.total_ANL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "AWP":
        total_attendance_summ.total_AWP =
          total_attendance_summ.total_AWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "UWP":
        total_attendance_summ.total_UWP =
          total_attendance_summ.total_UWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "LE1":
        total_attendance_summ.total_LE1 =
          total_attendance_summ.total_LE1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LE2":
        total_attendance_summ.total_LE2 =
          total_attendance_summ.total_LE2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP1":
        total_attendance_summ.total_LP1 =
          total_attendance_summ.total_LP1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP2":
        total_attendance_summ.total_LP2 =
          total_attendance_summ.total_LP2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "WO":
        total_attendance_summ.total_wo =
          total_attendance_summ.total_wo + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
    }
    switch (attendance_data.second_half) {
      case "PDL":
        total_attendance_summ.total_attendance =
          total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "P":
        total_attendance_summ.total_present =
          total_attendance_summ.total_present + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "H":
        total_attendance_summ.holiday =
          total_attendance_summ.holiday + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "L":
        total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
        if(total_attendance_summ.total_late_hour){
	        total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
	    }
	    else{
	    	total_attendance_summ.total_late_hour = total_late_hour;
	    }
        total_attendance_summ.total_attendance =
          total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "A":
        total_attendance_summ.total_absent =
          total_attendance_summ.total_absent + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "OT":
        total_attendance_summ.total_overtime =
          total_attendance_summ.total_overtime + attendance_val;
        break;
      case "CSL":
        total_attendance_summ.total_CSL =
          total_attendance_summ.total_CSL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PVL":
        total_attendance_summ.total_PVL =
          total_attendance_summ.total_PVL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ERL":
        total_attendance_summ.total_ERL =
          total_attendance_summ.total_ERL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "SKL":
        total_attendance_summ.total_SKL =
          total_attendance_summ.total_SKL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MDL":
        total_attendance_summ.total_MDL =
          total_attendance_summ.total_MDL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MTL":
        total_attendance_summ.total_MTL =
          total_attendance_summ.total_MTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PTL":
        total_attendance_summ.total_PTL =
          total_attendance_summ.total_PTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ANL":
        total_attendance_summ.total_ANL =
          total_attendance_summ.total_ANL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "AWP":
        total_attendance_summ.total_AWP =
          total_attendance_summ.total_AWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "UWP":
        total_attendance_summ.total_UWP =
          total_attendance_summ.total_UWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "LE1":
        total_attendance_summ.total_LE1 =
          total_attendance_summ.total_LE1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LE2":
        total_attendance_summ.total_LE2 =
          total_attendance_summ.total_LE2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP1":
        total_attendance_summ.total_LP1 =
          total_attendance_summ.total_LP1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP2":
        total_attendance_summ.total_LP2 =
          total_attendance_summ.total_LP2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "WO":
        total_attendance_summ.total_wo =
          total_attendance_summ.total_wo + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
    }
  } else {
    var attendance_val = 1;
    switch (attendance_data.attendance_stat) {
      case "PDL":
        total_attendance_summ.total_attendance =
          total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "P":
        total_attendance_summ.total_present =
          total_attendance_summ.total_present + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "H":
        total_attendance_summ.holiday =
          total_attendance_summ.holiday + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "L":
        total_attendance_summ.total_late = total_attendance_summ.total_late + 1;
        if(total_attendance_summ.total_late_hour){
	        total_attendance_summ.total_late_hour = parseFloat(total_attendance_summ.total_late_hour) + total_late_hour;
	    }
	    else{
	    	total_attendance_summ.total_late_hour = total_late_hour;
	    }
        total_attendance_summ.total_attendance =
          total_attendance_summ.total_attendance + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "A":
        total_attendance_summ.total_absent =
          total_attendance_summ.total_absent + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "OT":
        total_attendance_summ.total_overtime =
          total_attendance_summ.total_overtime + attendance_val;
        break;
      case "CSL":
        total_attendance_summ.total_CSL =
          total_attendance_summ.total_CSL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PVL":
        total_attendance_summ.total_PVL =
          total_attendance_summ.total_PVL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ERL":
        total_attendance_summ.total_ERL =
          total_attendance_summ.total_ERL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "SKL":
        total_attendance_summ.total_SKL =
          total_attendance_summ.total_SKL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MDL":
        total_attendance_summ.total_MDL =
          total_attendance_summ.total_MDL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "MTL":
        total_attendance_summ.total_MTL =
          total_attendance_summ.total_MTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "PTL":
        total_attendance_summ.total_PTL =
          total_attendance_summ.total_PTL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "ANL":
        total_attendance_summ.total_ANL =
          total_attendance_summ.total_ANL + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "AWP":
        total_attendance_summ.total_AWP =
          total_attendance_summ.total_AWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "UWP":
        total_attendance_summ.total_UWP =
          total_attendance_summ.total_UWP + attendance_val;
        total_attendance_summ.total_lop =
          total_attendance_summ.total_lop + attendance_val;
        break;
      case "LE1":
        total_attendance_summ.total_LE1 =
          total_attendance_summ.total_LE1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LE2":
        total_attendance_summ.total_LE2 =
          total_attendance_summ.total_LE2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP1":
        total_attendance_summ.total_LP1 =
          total_attendance_summ.total_LP1 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "LP2":
        total_attendance_summ.total_LP2 =
          total_attendance_summ.total_LP2 + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
      case "WO":
        total_attendance_summ.total_wo =
          total_attendance_summ.total_wo + attendance_val;
        total_attendance_summ.paydays =
          total_attendance_summ.paydays + attendance_val;
        break;
    }
  }

  return total_attendance_summ;
}

function get_calculative_day(register_type,attendance_stat)
{
   
}

function getdaysInMonth(month, year) {
  return new Date(year, month++, 0).getDate();
}
function DjformatDate(date) {
  var d = new Date(date),
    month = "" + (d.getUTCMonth() + 1),
    day = "" + d.getDate(),
    year = d.getUTCFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}
function daysInMonth (month, year) {
  return new Date(year, month++, 0).getDate();
}
