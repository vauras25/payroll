var fs = require("fs");
const bcrypt = require("bcrypt");
const { Validator } = require("node-input-validator");
const niv = require("node-input-validator");
const mongoose = require("mongoose");
var multer = require("multer");
var Site_helper = require("../../Helpers/Site_helper");
const EmployeeDetails = require("../../Model/Company/employee_details");
const EmployeeModel = require("../../Model/Company/employee");
const EmployeeAdvance = require("../../Model/Company/EmployeeAdvance");
const Employee = require("../../Model/Company/employee");
var EmployeeMonthlyReport = require("../../Model/Company/EmployeeMonthlyReport");


module.exports = {
  employee_advance: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        recovery_from:
          "required|in:incentive,bonus,gross_earning,annual_earning,reimbursement",
        advance_amount: "required|string",
        advance_outstanding: "required|string",
        remarks: "required|string",
        no_of_instalments: "required|numeric",
        recovery_frequency: "required|string",
        payment_start_month: "required|string",
        payment_start_year: "required|string",
        payment_booking_date: "nullable",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var employeeData = await EmployeeModel.findOne({ _id: req.authId });
        if (!employeeData) {
          return resp
            .status(200)
            .json({ status: "error", message: "Employee not found." });
        }
        var instalment_history = [];
        var booking_date = null;
        if (req.body.instalment_history) {
          instalment_history = JSON.parse(
            JSON.stringify(req.body.instalment_history)
          );
        }
        if (req.body.payment_booking_date) {
          booking_date = req.body.payment_booking_date;
        } else {
          booking_date = new Date().toISOString().split("T")[0];
        }
        var document = {
          corporate_id: employeeData.corporate_id,
          emp_id: employeeData.emp_id,
          recovery_from: req.body.recovery_from,
          advance_amount: req.body.advance_amount,
          advance_outstanding: req.body.advance_outstanding,
          remarks: req.body.remarks,
          no_of_instalments: req.body.no_of_instalments,
          recovery_frequency: req.body.recovery_frequency,
          payment_start_month: req.body.payment_start_month,
          payment_start_year: req.body.payment_start_year,
          payment_booking_date: booking_date,
          instalment_history: instalment_history,
          status: "pending",
          created_by: "employee",
          created_at: Date.now(),
          repaid_amount: "0.00",
          remaining_amount: req.body.advance_amount,
        };

        EmployeeAdvance.create(document, function (err, advance_data) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp.status(200).send({
            status: "success",
            message: "Advance created successfully",
            advance_data: advance_data,
          });
        });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_advance_data: async function (req, resp, next) {
    const v = new Validator(req.body, {
      recovery_from:
        "required|in:incentive,bonus,gross_earning,annual_earning,reimbursement",
      no_of_instalments: "required",
      recovery_frequency: "required",
      emp_advance_id: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      var ObjectId = mongoose.Types.ObjectId;
      if (req.body.emp_advance_id) {
        if (!ObjectId.isValid(req.body.emp_advance_id)) {
          return resp
            .status(200)
            .send({ status: "error", message: "Not a valid id" });
        }
      }
      var instalment_history = [];
      if (req.body.instalment_history) {
        instalment_history = JSON.parse(
          JSON.stringify(req.body.instalment_history)
        );
      }
      var document = {
        recovery_from: req.body.recovery_from,
        no_of_instalments: req.body.no_of_instalments,
        recovery_frequency: req.body.recovery_frequency,
        remarks: req.body.remarks,
        advance_outstanding: req.body.advance_outstanding,
        instalment_history: instalment_history,
        updated_at: Date.now(),
      };
      EmployeeAdvance.updateOne(
        { _id: req.body.emp_advance_id },
        document,
        function (err, advance_data) {
          if (err) {
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          } else {
            return resp.status(200).send({
              status: "success",
              message: "Advance has been updated successfully",
              advance_data: advance_data,
            });
          }
        }
      );
    }
  },
  get_advance_data: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : 10,
        sort: sortoption,
      };

      var filter_option = {
        corporate_id: req.authData.corporate_id,
        emp_id: req.authData.userid,
      };
      if (req.body.searchkey) {
        filter_option = {
          $and: [
            {
              corporate_id: req.authData.corporate_id,
              emp_id: req.authData.userid,
            },
            {
              $or: [{ status: { $regex: req.body.searchkey , $options:"i" } }],
            },
          ],
        };
      }

      EmployeeAdvance.paginate(
        filter_option,
        options,
        function (err, advance_data) {
          if (err) return resp.json({ status: "error", message: err.message });
          return resp
            .status(200)
            .json({ status: "success", advance_data: advance_data });
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  run_advance_report: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
        bank_temp_id: "required",
        payment_for: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var filter_option = { _id: req.body.bank_temp_id };
        var payment_sheet = await PaymentSheet.findOne(filter_option);

        var variable_earning = []; 
        var wage_month = req.body.wage_month;
        var wage_year = req.body.wage_year;
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
          var query_data = await Site_helper.getEmpFilterData(
            req,
            search_option,
            search_option_details
          );
          search_option_details = query_data.search_option_details;
          search_option = query_data.search_option;
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
        search_option_details.$match["employee_monthly_reports.wage_month"] =
          parseInt(wage_month);
        search_option_details.$match["employee_monthly_reports.wage_year"] =
          parseInt(wage_year);
        if (req.body.payment_for == "earning") {
          search_option_details.$match["employee_monthly_reports.total_data"] =
            { $exists: true, $ne: null };
          search_option_details.$match[
            "employee_monthly_reports.total_data.bank_ins_referance_id"
          ] = "";
          search_option_details.$match[
            "employee_monthly_reports.ins_generate"
          ] = "no";
        } else {
          if (req.body.payment_for == "salary") {
            search_option_details.$match[
              "employee_monthly_reports.salary_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.salary_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "supplement_salary") {
            search_option_details.$match[
              "employee_monthly_reports.supplement_salary_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.supplement_salary_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "incentive") {
            search_option_details.$match[
              "employee_monthly_reports.incentive_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.incentive_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "bonus") {
            search_option_details.$match[
              "employee_monthly_reports.bonus_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.bonus_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "ot") {
            search_option_details.$match["employee_monthly_reports.ot_report"] =
              { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.ot_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "reimbursment") {
            search_option_details.$match[
              "employee_monthly_reports.reimbursment_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.reimbursment_report.bank_ins_referance_id"
            ] = "";
          }
          if (req.body.payment_for == "shift_allawance") {
            search_option_details.$match[
              "employee_monthly_reports.shift_allawance_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.shift_allawance_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "advance") {
            search_option_details.$match[
              "employee_monthly_reports.advance_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.advance_report.bank_ins_referance_id"
            ] = "";
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
          {
            $lookup: {
              from: "employee_monthly_reports",
              let: { emp_db_idVar: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
                      { wage_month: parseInt(wage_month) },
                      { wage_year: parseInt(wage_year) },
                    ],
                  },
                },
              ],
              as: "employee_monthly_reports",
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
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              alternate_mob_no: 1,
              email_id: 1,
              employee_monthly_reports: 1,
            },
          },
          {
            $addFields: {
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
              },
            },
          },
        ]).then(async (reportdata) => {
          //return resp.status(200).json({ status: "success", message: reportdata });
          if (reportdata.length > 0) {
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");
            var file_id = Math.random().toString(36).slice(2);
            var instructionsheet_xlsx =
              "storage/company/instruction_report/instruction-report-" +
              file_id +
              ".xlsx";
            ws.cell(1, 1).string("SL. NO.");
            var master_data = reportdata;
            var row_counter = 1;
            var sl_no = 0;
            var bank_field = payment_sheet.column_list;
            await Promise.all(
              master_data.map(async (report_data_exp) => {
                //if (report_data_exp.employee_monthly_reports.salary_report) {

                row_counter = row_counter + 1;
                sl_no = sl_no + 1;
                var master_report = report_data_exp.employee_monthly_reports;
                //console.log(master_report)
                var column_counter = 1;
                ws.cell(row_counter, column_counter).number(sl_no);

                await Promise.all(
                  bank_field.map(async (bank_column_data) => {
                    if (req.body.payment_for == "earning") {
                      var salary_net_take_home =
                        master_report.salary_report.bank_ins_referance_id == ""
                          ? master_report.salary_report.net_take_home
                          : 0;
                      var shift_allawance_net_take_home =
                        master_report.shift_allawance_report
                          ?.bank_ins_referance_id == ""
                          ? master_report.shift_allawance_report.net_take_home
                          : 0;
                      var supplement_salary_net_take_home =
                        master_report.supplement_salary_report
                          ?.bank_ins_referance_id == ""
                          ? master_report.supplement_salary_report.net_take_home
                          : 0;
                      var incentive_net_take_home =
                        master_report.incentive_report?.bank_ins_referance_id ==
                        ""
                          ? master_report.incentive_report.net_take_home
                          : 0;
                      var bonus_net_take_home =
                        master_report.bonus_report?.bank_ins_referance_id == ""
                          ? master_report.bonus_report.net_take_home
                          : 0;
                      var ot_net_take_home =
                        master_report.ot_report?.bank_ins_referance_id == ""
                          ? master_report.ot_report.net_take_home
                          : 0;
                      var reimbursment_net_take_home =
                        master_report.reimbursment_report
                          ?.bank_ins_referance_id == ""
                          ? master_report.reimbursment_report.net_take_home
                          : 0;
                      var net_take_home =
                        salary_net_take_home +
                        supplement_salary_net_take_home +
                        incentive_net_take_home +
                        bonus_net_take_home +
                        ot_net_take_home +
                        reimbursment_net_take_home +
                        shift_allawance_net_take_home;
                      var net_take_home = 0;
                    } else {
                      if (req.body.payment_for == "salary") {
                        var net_take_home =
                          master_report.salary_report.net_take_home;
                      } else if (req.body.payment_for == "supplement_salary") {
                        var net_take_home =
                          master_report.supplement_salary_report.net_take_home;
                      } else if (req.body.payment_for == "incentive") {
                        var net_take_home =
                          master_report.incentive_report.net_take_home;
                      } else if (req.body.payment_for == "bonus") {
                        var net_take_home =
                          master_report.bonus_report.net_take_home;
                      } else if (req.body.payment_for == "ot") {
                        var net_take_home =
                          master_report.ot_report.net_take_home;
                      } else if (req.body.payment_for == "reimbursment") {
                        var net_take_home =
                          master_report.reimbursment_report.net_take_home;
                      } else if (req.body.payment_for == "shift_allawance") {
                        var net_take_home =
                          master_report.shift_allawance_report.net_take_home;
                      } else if (req.body.payment_for == "advance") {
                        var net_take_home =
                          master_report.advance_report.net_take_home;
                      }
                    }

                    column_counter = column_counter + 1;
                    if (bank_column_data.type == "static") {
                      if (bank_column_data.column_lable == "Amount") {
                        var bank_column_value = net_take_home;
                      } else {
                        var bank_column_value = bank_column_data.column_value;
                      }
                    } else {
                      var bank_column_value =
                        master_report.emp_data[bank_column_data.column_value];
                    }
                    var bank_column_lable = bank_column_data.column_lable;
                    //column_value=type
                    ws.cell(1, column_counter).string(
                      bank_column_lable.toString()
                    );
                    if (bank_column_data.column_value == "emp_name") {
                      bank_column_value =
                        master_report.emp_data.emp_first_name +
                        " " +
                        master_report.emp_data.emp_last_name;
                    }
                    if (bank_column_data.column_value == "emp_mob") {
                      //bank_column_value = master_report.emp_data.mobile_no;
                    }
                    if (bank_column_data.column_value == "email_id") {
                      bank_column_value = master_report.emp_data.emp_email_id;
                    }
                    ws.cell(row_counter, column_counter).string(
                      bank_column_value ? bank_column_value.toString() : ""
                    );
                  })
                );
                var where_con = {
                  emp_id: master_report.emp_data.emp_id,
                  wage_month: wage_month,
                  wage_year: wage_year,
                };
                if (req.body.payment_for == "earning") {
                  var update_value = {
                    "total_data.bank_ins_referance_id": file_id,
                  };
                  var salary_gross_earning =
                    master_report.salary_report.bank_ins_referance_id != ""
                      ? master_report.salary_report.bank_ins_referance_id
                      : file_id;

                  if (master_report.salary_report) {
                    update_value["salary_report.bank_ins_referance_id"] =
                      master_report.salary_report?.bank_ins_referance_id != ""
                        ? master_report.salary_report.bank_ins_referance_id
                        : file_id;
                  }
                  if (master_report.supplement_salary_report) {
                    update_value[
                      "supplement_salary_report.bank_ins_referance_id"
                    ] =
                      master_report.supplement_salary_report
                        ?.bank_ins_referance_id != ""
                        ? master_report.supplement_salary_report
                            .bank_ins_referance_id
                        : file_id;
                  }
                  if (master_report.incentive_report) {
                    update_value["incentive_report.bank_ins_referance_id"] =
                      master_report.incentive_report?.bank_ins_referance_id !=
                      ""
                        ? master_report.incentive_report.bank_ins_referance_id
                        : file_id;
                  }
                  if (master_report.bonus_report) {
                    update_value["bonus_report.bank_ins_referance_id"] =
                      master_report.bonus_report?.bank_ins_referance_id != ""
                        ? master_report.bonus_report.bank_ins_referance_id
                        : file_id;
                  }
                  if (master_report.ot_report) {
                    update_value["ot_report.bank_ins_referance_id"] =
                      master_report.ot_report?.bank_ins_referance_id != ""
                        ? master_report.ot_report.bank_ins_referance_id
                        : file_id;
                  }
                  if (master_report.shift_allawance_report) {
                    update_value[
                      "shift_allawance_report.bank_ins_referance_id"
                    ] =
                      master_report.shift_allawance_report
                        ?.bank_ins_referance_id != ""
                        ? master_report.shift_allawance_report
                            .bank_ins_referance_id
                        : file_id;
                  }
                  if (master_report.reimbursment_report) {
                    update_value["reimbursment_report.bank_ins_referance_id"] =
                      master_report.reimbursment_report
                        ?.bank_ins_referance_id != ""
                        ? master_report.reimbursment_report
                            .bank_ins_referance_id
                        : file_id;
                  }
                  if (master_report.advance_report) {
                    update_value["advance_report.bank_ins_referance_id"] =
                      master_report.advance_report?.bank_ins_referance_id != ""
                        ? master_report.advance_report.bank_ins_referance_id
                        : file_id;
                  }

                  where_con["total_data.bank_ins_referance_id"] = "";
                } else {
                  if (req.body.payment_for == "salary") {
                    where_con["salary_report.bank_ins_referance_id"] = "";
                    var update_value = {
                      "salary_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "supplement_salary") {
                    where_con[
                      "supplement_salary_report.bank_ins_referance_id"
                    ] = "";
                    var update_value = {
                      "supplement_salary_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "incentive") {
                    where_con["incentive_report.bank_ins_referance_id"] = "";
                    var update_value = {
                      "incentive_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "bonus") {
                    where_con["bonus_report.bank_ins_referance_id"] = "";
                    var update_value = {
                      "bonus_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "ot") {
                    where_con["ot_report.bank_ins_referance_id"] = "";
                    var update_value = {
                      "ot_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "reimbursment") {
                    where_con["reimbursment_report.bank_ins_referance_id"] = "";
                    var update_value = {
                      "reimbursment_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "advance") {
                    where_con["advance_report.bank_ins_referance_id"] = "";
                    var update_value = {
                      "advance_report.bank_ins_referance_id": file_id,
                    };
                  }
                }
                update_value["ins_generate"] = "yes";
                //console.log(update_value);
                await EmployeeMonthlyReport.updateOne(where_con, update_value);
                //}
              })
            ).then(async (reportdata_com) => {
              if (sl_no < 1) {
                return resp
                  .status(200)
                  .json({ status: "success", message: "Nothing to generate" });
              } else {
                wb.write(instructionsheet_xlsx);
                if (req.body.payment_for == "earning") {
                  var pay_type = "earning";
                } else {
                  if (req.body.payment_for == "salary") {
                    var pay_type = "salary";
                  } else if (req.body.payment_for == "supplement_salary") {
                    var pay_type = "supplement_salary";
                  } else if (req.body.payment_for == "incentive") {
                    var pay_type = "incentive";
                  } else if (req.body.payment_for == "bonus") {
                    var pay_type = "bonus";
                  } else if (req.body.payment_for == "ot") {
                    var pay_type = "ot";
                  } else if (req.body.payment_for == "reimbursment") {
                    var pay_type = "reimbursment";
                  } else if (req.body.payment_for == "advance") {
                    var pay_type = "advance";
                  }
                }

                var document = {
                  corporate_id: req.authData.corporate_id,
                  file_id: file_id,
                  xlsx_file_name: instructionsheet_xlsx,
                  wage_month: wage_month,
                  wage_year: wage_year,
                  pay_type: pay_type,
                  creatror_id: mongoose.Types.ObjectId(req.authData.authId),
                  creatror_name: req.authData.first_name,
                  //challan_type: "ECR",
                  status: "active",
                  created_at: Date.now(),
                };
                BankInstruction.create(
                  document,
                  function (err, bank_instruction_data) {
                    if (err)
                      return resp
                        .status(200)
                        .send({ status: "error", message: err.message });
                    return resp.status(200).send({
                      status: "success",
                      message: "Instruction file generated successfully",
                      bank_instruction_data: bank_instruction_data,
                    });
                  }
                );
                //return resp.status(200).send({ status: 'success',message:"Instruction file generated successfully",url:baseurl+instructionsheet_xlsx});
              }
            });
          } else {
            return resp
              .status(200)
              .json({ status: "success", message: "Nothing to generate." });
          }
        });
      }
    } catch (err) {}
  },
  generate_advance_sheet: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
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
          var query_data = await Site_helper.getEmpFilterData(
            req,
            search_option,
            search_option_details
          );
          search_option_details = query_data.search_option_details;
          search_option = query_data.search_option;
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

        search_option_details.$match["employee_advances.status"] = {
          $eq: "active",
        };

        var attendance_month = req.body.wage_month;
        var attendance_year = req.body.wage_year;
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
              from: "employee_monthly_reports",
              let: { emp_db_idVar: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
                      { wage_month: parseInt(attendance_month) },
                      { wage_year: parseInt(attendance_year) },
                    ],
                  },
                },
              ],
              as: "employee_monthly_reports",
            },
          },

          {
            $lookup: {
              from: "employee_advances",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "employee_advances",
            },
          },

          search_option_details,
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
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
              employee_advances: 1,
              employee_monthly_reports: 1,
            },
          },
        ])
          .then(async (employees) => {
            // var wage_month = req.body.attendance_month;
            // var wage_year = req.body.attendance_year;
            await Promise.all(
              employees.map(async (employee) => {
                if (
                  employee.employee_advances &&
                  employee.employee_advances.length
                ) {
                  var advance_data = {
                    gross_earning: employee.employee_advances.reduce(
                      (partialSum, a) => +partialSum + +a.advance_amount,
                      0
                    ),
                    bank_ins_referance_id: "",
                  };
                  var emp_data = {
                    _id: employee._id,
                    emp_id: employee.emp_id,
                    emp_first_name: employee.emp_first_name,
                    emp_last_name: employee.emp_last_name,
                    emp_emp_dob: employee.emp_dob,
                    emp_pan_no: employee.pan_no,
                    emp_aadhar_no: employee.aadhar_no,
                    emp_email_id: employee.email_id,
                    new_pf_no: employee.employee_details.employment_details
                      ? employee.employee_details.employment_details.new_pf_no
                      : "NA",
                    esic_no: employee.employee_details.employment_details
                      ? employee.employee_details.employment_details.esic_no
                      : "NA",
                    date_of_join:
                      employee.employee_details.employment_hr_details
                        .date_of_join,
                    sex: employee.sex,
                    age: employee.age,
                    EPF: employee.employee_details.employment_hr_details
                      .pf_applicable,
                    EPS: employee.employee_details.employment_hr_details
                      .pension_applicable,
                    Restrict_PF:
                      employee.employee_details.template_data.salary_temp_data
                        .restricted_pf,
                    Reg_Type:
                      employee.employee_details.template_data
                        .attendance_temp_data.register_type,
                    emp_uan_no: employee.employee_details.pf_esic_details
                      ? employee.employee_details.pf_esic_details
                          .curr_er_epfo_details.uan_no
                      : "NA",
                    hod: employee.hod
                      ? employee.hod.first_name + " " + employee.hod.last_name
                      : "",
                    branch: employee.branch,
                    designation: employee.designation,
                    department: employee.department,
                    client: employee.client,
                  };

                  var insert_data = {
                    corporate_id: employee.corporate_id,
                    emp_db_id: mongoose.Types.ObjectId(employee._id),
                    emp_id: employee.emp_id,
                    wage_month: attendance_month,
                    wage_year: attendance_year,
                    advance_report: advance_data,
                    emp_data: emp_data,
                    status: "active",
                  };
                  var where_condition = {
                    emp_id: employee.emp_id,
                    wage_month: +attendance_month,
                    wage_year: +attendance_year,
                    corporate_id: employee.corporate_id,
                  };
                  await EmployeeMonthlyReport.findOneAndUpdate(
                    where_condition,
                    insert_data,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                  ).then((resolve) => {
                    console.log(resolve);
                  });
                }
              })
            );
            // .then((value) => {
            // return resp.status(200).send({
            //   status: "success",
            //   message: "Bonus sheet generated successfully",
            // });
            // });
          })
          .then((res) => {
            next();
          });
      }
    } catch (err) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
};
