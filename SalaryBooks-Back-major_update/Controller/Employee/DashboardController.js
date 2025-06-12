const Attendance_summaries = require("../../Model/Company/AttendanceSummary");
const employee_advances = require("../../Model/Company/EmployeeAdvance");
const Employee_attendance = require("../../Model/Company/EmployeeAttendance");
const EmployeeLeave = require("../../Model/Company/EmployeeLeave");
const extra_earning = require("../../Model/Company/ExtraEarning");
const reimbursements = require("../../Model/Company/Reimbursement");
const EmployeeModel = require("../../Model/Company/employee");
const employeeDetails = require("../../Model/Company/employee_details");

module.exports = {
  get_employee_dashboard_leave_data: async function (req, resp) {
    try {
      EmployeeModel.findById(req.authId, "-password -user_type")
        .populate({
          path: "emp_hod",
          model: "staff",
        })
        .exec(async function (err, employee_data) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });

          let employee_details = await employeeDetails.findOne({
            employee_id: employee_data._id,
          });

          // let employee_attendance = await Employee_attendance.find({"emp_id":employee_data.emp_id});

          let ret_obj = {
            pending_requests: {
              leave_request: {
                type: "leave",
                items: [],
              },
              advance_request: {
                type: "advance",
                items: [],
              },
              reimbursement_request: {
                type: "reimbursement",
                items: [],
              },
              extra_earning_request: {
                type: "extra earning",
                items: [],
              },
              emp_hod: employee_data.emp_hod,
            },
            // leave_balance_summmary: {
            // available_balance: 0,
            // consumed_balance: 0,
            leave_types: [],
            // },
          };

          // getting pending leaves
          ret_obj.pending_requests.leave_request.items =
            await EmployeeLeave.find({
              employee_id: employee_data._id,
              leave_approval_status: "pending",
            });

          // getting pending advance
          ret_obj.pending_requests.advance_request.items =
            await employee_advances.find({
              emp_id: employee_data.emp_id,
              corporate_id: employee_data.corporate_id,
              status: "pending",
            });

          // reimbursement
          ret_obj.pending_requests.reimbursement_request.items =
            await reimbursements.find({
              emp_id: employee_data.emp_id,
              corporate_id: employee_data.corporate_id,
              status: "pending",
            });

          // extra earnings
          ret_obj.pending_requests.extra_earning_request.items =
            await extra_earning.find({
              emp_id: employee_data.emp_id,
              corporate_id: employee_data.corporate_id,
              status: "pending",
            });

          ret_obj.leave_types = employee_details.leave_balance_counter || [];

          // for (const leave of employee_details.leave_balance_counter || []) {
          //   ret_obj.leave_balance_summmary["available_balance"] +=
          //     +leave.available || 0;
          //   ret_obj.leave_balance_summmary["consumed_balance"] +=
          //     +leave.consumed || 0;
          //   ret_obj.leave_balance_summmary["leave_types"].push({
          //     leave_type: leave.leave_type_name,
          //     leave_abbreviation: leave.abbreviation,
          //     total_balance: leave.total_balance,
          //     consumed_balance: leave.consumed,
          //     available_balance: leave.available,
          //   });
          // }

          return resp.status(200).json({
            status: "success",
            data: ret_obj,
          });
        });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_dashboard_attendance_data: async function (req, resp) {
    try {
      EmployeeModel.findById(
        req.authId,
        "-password -user_type",
        async function (err, employee_data) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });

          let ret_obj = null;

          let attendance_summary = await Attendance_summaries.findOne({
            emp_id: employee_data.emp_id,
            corporate_id: employee_data.corporate_id,
          }).sort({ created_at: -1 });

          if (attendance_summary) {
            let last_date = new Date(
              +attendance_summary.attendance_year,
              +attendance_summary.attendance_month + 1,
              1
            );
            last_date.setDate(0);
            ret_obj = {
              attendance_date: {
                year: last_date.getFullYear(),
                month: last_date.toLocaleString("default", { month: "long" }),
              },
              month_days: last_date.getDate(),
              pay_days: attendance_summary.paydays,
              total_lop: attendance_summary.total_lop,
              paid_leaves:
                (attendance_summary.total_ANL || 0) +
                (attendance_summary.total_AWP || 0) +
                (attendance_summary.total_CSL || 0) +
                (attendance_summary.total_ERL || 0) +
                (attendance_summary.total_LE1 || 0) +
                (attendance_summary.total_LE2 || 0) +
                (attendance_summary.total_LP1 || 0) +
                (attendance_summary.total_LP2 || 0) +
                (attendance_summary.total_LP3 || 0) +
                (attendance_summary.total_MDL || 0) +
                (attendance_summary.total_MTL || 0) +
                (attendance_summary.total_PDL || 0) +
                (attendance_summary.total_PTL || 0) +
                (attendance_summary.total_PVL || 0) +
                (attendance_summary.total_SKL || 0) +
                (attendance_summary.total_UWP || 0) -
                (attendance_summary.total_lop || 0),
              total_overtime: attendance_summary.total_overtime,
            };
            if (ret_obj.paid_leaves < 0) ret_obj.paid_leaves = 0;
          }

          return resp.status(200).json({
            status: "success",
            data: ret_obj,
          });
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_attendance_data: async function (req, resp) {
    try {
      EmployeeModel.findById(
        req.authId,
        "-password -user_type",
        async function (err, employee_data) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          let curr_date = new Date("2023-08-30");
          let employee_details = await employeeDetails.findOne({
            employee_id: employee_data._id,
          });
          let employee_attendance = await Employee_attendance.find({
            emp_id: employee_data.emp_id,
            attendance_month: curr_date.getMonth().toString(),
            attendance_year: curr_date.getFullYear().toString(),
          });

          let ret_obj = {
            attendance_statistics: {
              daily_time: 0,
              weekly_time: 0,
              monthly_time: 0,
              overtime: 0,
              today_activity: [],
            },
          };

          for (const attendance of employee_attendance) {
            const attendanceDate = new Date(attendance.attendance_date);
            if (attendanceDate.getDate() == curr_date.getDate()) {
              ret_obj.attendance_statistics.daily_time =
                (+attendance.total_logged_in || 0) -
                (+attendance.total_break_time || 0);
              ret_obj.attendance_statistics.today_activity =
                attendance.break_time;
            }
            if (
              curr_date.getDate() - 7 <= attendanceDate.getDate() &&
              curr_date.getDate() > attendanceDate.getDate() &&
              attendanceDate.getDay() > 0 &&
              attendanceDate.getDay() < curr_date.getDay()
            ) {
              ret_obj.attendance_statistics.weekly_time +=
                (+attendance.total_logged_in || 0) -
                (+attendance.total_break_time || 0);
            }
            ret_obj.attendance_statistics.monthly_time +=
              (+attendance.total_logged_in || 0) -
              (+attendance.total_break_time || 0);
          }

          // ret_obj.attendance_statistics.weekly_time =
          //   ret_obj.attendance_statistics.weekly_time /
          //   (ret_obj.attendance_statistics.weekly_time / 8);
          // ret_obj.attendance_statistics.monthly_time =
          //   ret_obj.attendance_statistics.monthly_time /
          //   (ret_obj.attendance_statistics.monthly_time / 8);

          return resp.status(200).json({
            status: "success",
            data: ret_obj,
          });
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
};
