var EmployeeMonthlyReport = require("../../Model/Company/EmployeeMonthlyReport");
var PaymentSheet = require("../../Model/Company/PaymentSheet");
var Employee = require("../../Model/Company/employee");
var BankInstruction = require("../../Model/Company/BankInstruction");
var CompanyDetails = require("../../Model/Admin/Company_details");
var RevisionReport = require("../../Model/Company/RevisionReport");
var Challans = require("../../Model/Company/Challans");
var Site_helper = require("../../Helpers/Site_helper");
var CompanyInfoController = require("./Company_infoController");
const { Validator } = require("node-input-validator");
const mongoose = require("mongoose");
var xl = require("excel4node");
var fs = require("fs");
const archiver = require("archiver");
const { resolve } = require("path");
const employee_advances = require("../../Model/Company/EmployeeAdvance");
const moment = require("moment");
const absolutePath = resolve("");
module.exports = {
  generate_instruction_report: async function (req, resp) {
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
        var path_array = [];
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
          // if(!req.body.instruction_type){
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
          }
          if (req.body.payment_for == "leave") {
            search_option_details.$match[
              "employee_monthly_reports.encash_payment_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.encash_payment_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "extra_earning") {
            search_option_details.$match[
              "employee_monthly_reports.extra_earning_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.extra_earning_report.bank_ins_referance_id"
            ] = "";
          } else if (req.body.payment_for == "advance") {
            search_option_details.$match[
              "employee_monthly_reports.advance_report"
            ] = { $exists: true, $ne: null };
            search_option_details.$match[
              "employee_monthly_reports.advance_report.bank_ins_referance_id"
            ] = "";
          }
          // }
        }
        // console.log(search_option_details);
        // return false;
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
                      // {"ins_generate": "no"},
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
              localField: "companies._id",
              foreignField: "company_id",
              as: "company_details",
            },
          },
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              companies: {
                $arrayElemAt: ["$companies", 0],
              },
              company_details: {
                $arrayElemAt: ["$company_details", 0],
              },
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              emp_id: 1,
              corporate_id: 1,
              alternate_mob_no: 1,
              email_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              employee_monthly_reports: 1,
              "companies.establishment_name": 1,
              "companies.com_logo": 1,
              employee_details: 1,
              company:"$companies",
              company_details:"$company_details",
            },
          },
          // {
          //   $addFields: {
          //       employee_monthly_reports: {
          //       $arrayElemAt: ["$employee_monthly_reports", 0],
          //     },
          //   },
          // },
          {
            $unwind: "$employee_monthly_reports",
          },
        ]).then(async (reportdata) => {
          // return resp.status(200).json({ status: "success", message: reportdata });
          if (reportdata.length > 0) {
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");
            var file_id = Math.random().toString(36).slice(2);
            var instructionsheet_xlsx =
              "storage/company/temp_files/" +
              req.authData.corporate_id +
              "/instruction_report/instruction-report-" +
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
                var emp_details = report_data_exp.employee_details;
                //console.log(master_report)
                var column_counter = 1;
                var net_take_home = 0;
                ws.cell(row_counter, column_counter).number(sl_no);
                if (!req.body.instruction_type) {
                  if (req.body.payment_for == "earning") {
                    var salary_net_take_home =
                      master_report.salary_report?.bank_ins_referance_id == ""
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
                    var extra_earning_net_take_home =
                      master_report.extra_earning_report
                        ?.bank_ins_referance_id == ""
                        ? master_report.extra_earning_report.net_take_home
                        : 0;
                    var net_take_home =
                      salary_net_take_home +
                      supplement_salary_net_take_home +
                      incentive_net_take_home +
                      bonus_net_take_home +
                      ot_net_take_home +
                      reimbursment_net_take_home +
                      shift_allawance_net_take_home +
                      extra_earning_net_take_home;
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
                      var net_take_home = master_report.ot_report.net_take_home;
                    } else if (req.body.payment_for == "reimbursment") {
                      var net_take_home =
                        master_report.reimbursment_report.net_take_home;
                    } else if (req.body.payment_for == "shift_allawance") {
                      var net_take_home =
                        master_report.shift_allawance_report.net_take_home;
                    } else if (req.body.payment_for == "leave") {
                      var net_take_home =
                        master_report.encash_payment_report.net_take_home;
                    } else if (req.body.payment_for == "extra_earning") {
                      var net_take_home =
                        master_report.extra_earning_report.net_take_home;
                    } else if (req.body.payment_for == "advance") {
                      var net_take_home =
                        master_report.advance_report.gross_earning;
                    }
                  }
                  await Promise.all(
                    bank_field.map(async (bank_column_data) => {
                      column_counter = column_counter + 1;
                      if (bank_column_data.type == "static") {
                        // if (bank_column_data.column_lable == "Amount") {
                        //   var bank_column_value = net_take_home;
                        // } else {
                        var bank_column_value = bank_column_data.column_value;
                        // }
                      } else {
                        var bank_column_value =
                          master_report.emp_data[bank_column_data.column_value];
                      }
                      var bank_column_lable = bank_column_data.column_lable;
                      //column_value=type
                      ws.cell(1, column_counter).string(
                        bank_column_lable.toString()
                      );
                      // console.log(bank_column_data);
                      // return false;
                      if (bank_column_data.column_value == "emp_id") {
                        bank_column_value =
                          master_report?.emp_data?.emp_id || "";
                      }
                      if (bank_column_data.column_value == "emp_name") {
                        bank_column_value =
                          master_report.emp_data.emp_first_name +
                          " " +
                          master_report.emp_data.emp_last_name;
                      }
                      if (bank_column_data.column_value == "emp_mob") {
                        bank_column_value =
                          master_report?.emp_data?.emp_mob || "";
                      }
                      if (bank_column_data.column_value == "email_id") {
                        bank_column_value =
                          master_report?.emp_data?.emp_email_id || "";
                      }
                      if (bank_column_data.column_value == "account_no") {
                        bank_column_value =
                          emp_details?.bank_details?.account_no || "";
                      }
                      if (bank_column_data.column_value == "ifsc_code") {
                        bank_column_value =
                          emp_details?.bank_details?.ifsc_code || "";
                      }
                      if (bank_column_data.column_value == "bank_name") {
                        bank_column_value =
                          emp_details?.bank_details?.bank_name || "";
                      }
                      if (bank_column_data.column_value == "net_take_home") {
                        bank_column_value = net_take_home;
                      }
                      ws.cell(row_counter, column_counter).string(
                        bank_column_value ? bank_column_value.toString() : ""
                      );

                      // ws.cell(1, (column_counter+1)).string(
                      //   "Employee Amount"
                      // );
                      // ws.cell(row_counter, (column_counter + 1)).string(
                      //   net_take_home ? net_take_home.toString() : ""
                      // );
                    })
                    // bank_column_value = net_take_home
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
                      update_value[
                        "reimbursment_report.bank_ins_referance_id"
                      ] =
                        master_report.reimbursment_report
                          ?.bank_ins_referance_id != ""
                          ? master_report.reimbursment_report
                              .bank_ins_referance_id
                          : file_id;
                    }
                    if (master_report.encash_payment_report) {
                      update_value[
                        "encash_payment_report.bank_ins_referance_id"
                      ] =
                        master_report.encash_payment_report
                          ?.bank_ins_referance_id != ""
                          ? master_report.encash_payment_report
                              .bank_ins_referance_id
                          : file_id;
                    }
                    if (master_report.extra_earning_report) {
                      update_value[
                        "extra_earning_report.bank_ins_referance_id"
                      ] =
                        master_report.extra_earning_report
                          ?.bank_ins_referance_id != ""
                          ? master_report.extra_earning_report
                              .bank_ins_referance_id
                          : file_id;
                    }
                    if (master_report.advance_report) {
                      update_value["advance_report.bank_ins_referance_id"] =
                        master_report.advance_report?.bank_ins_referance_id !=
                        ""
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
                        "supplement_salary_report.bank_ins_referance_id":
                          file_id,
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
                      where_con["reimbursment_report.bank_ins_referance_id"] =
                        "";
                      var update_value = {
                        "reimbursment_report.bank_ins_referance_id": file_id,
                      };
                    } else if (req.body.payment_for == "shift_allawance") {
                      where_con[
                        "shift_allawance_report.bank_ins_referance_id"
                      ] = "";
                      var update_value = {
                        "shift_allawance_report.bank_ins_referance_id": file_id,
                      };
                    } else if (req.body.payment_for == "leave") {
                      where_con["encash_payment_report.bank_ins_referance_id"] =
                        "";
                      var update_value = {
                        "encash_payment_report.bank_ins_referance_id": file_id,
                      };
                    } else if (req.body.payment_for == "extra_earning") {
                      where_con["extra_earning_report.bank_ins_referance_id"] =
                        "";
                      var update_value = {
                        "extra_earning_report.bank_ins_referance_id": file_id,
                      };
                    } else if (req.body.payment_for == "advance") {
                      where_con["advance_report.bank_ins_referance_id"] = "";
                      var update_value = {
                        "advance_report.bank_ins_referance_id": file_id,
                      };
                    }
                  }
                  update_value["ins_generate"] = "yes";
                  update_value["instruction_type"] = "bank";
                  //console.log(update_value);

                  await EmployeeMonthlyReport.updateOne(
                    where_con,
                    update_value
                  );
                }
                //}
                if (req.body.instruction_type == "voucher") {
                  if (req.body.payment_for == "salary") {
                    var net_take_home =
                      master_report.salary_report.net_take_home;
                    var update_value = {
                      "salary_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "supplement_salary") {
                    var net_take_home =
                      master_report.supplement_salary_report.net_take_home;
                    var update_value = {
                      "supplement_salary_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "incentive") {
                    var net_take_home =
                      master_report.incentive_report.net_take_home;
                    var update_value = {
                      "incentive_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "bonus") {
                    var net_take_home =
                      master_report.bonus_report.net_take_home;
                    var update_value = {
                      "bonus_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "ot") {
                    var net_take_home = master_report.ot_report.net_take_home;
                    var update_value = {
                      "ot_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "reimbursment") {
                    var net_take_home =
                      master_report.reimbursment_report.net_take_home;
                    var update_value = {
                      "reimbursment_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "shift_allawance") {
                    var net_take_home =
                      master_report.shift_allawance_report.net_take_home;
                    var update_value = {
                      "shift_allawance_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "leave") {
                    var net_take_home =
                      master_report.encash_payment_report.net_take_home;
                    var update_value = {
                      "encash_payment_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "extra_earning") {
                    var net_take_home =
                      master_report.extra_earning_report.net_take_home;
                    var update_value = {
                      "extra_earning_report.bank_ins_referance_id": file_id,
                    };
                  } else if (req.body.payment_for == "advance") {
                    var net_take_home =
                      master_report.advance_report.gross_earning;
                    var update_value = {
                      "advance_report.bank_ins_referance_id": file_id,
                    };
                  } else {
                    var net_take_home = 0;
                  }
                  var where_con = {
                    emp_id: report_data_exp.emp_id,
                    wage_month: wage_month,
                    wage_year: wage_year,
                  };
                  // var update_value = {
                  //   "ins_generate":"yes",
                  //   "instruction_type":"voucher",

                  // };
                  update_value["ins_generate"] = "yes";
                  update_value["instruction_type"] = "voucher";
                  // console.log(where_con);
                  await EmployeeMonthlyReport.updateOne(
                    where_con,
                    update_value
                  );

                  // var file_path='/storage/company/temp_files/'+req.authData.corporate_id+'/voucher/';
                  var file_name =
                    "voucher-" +
                    file_id +
                    "-" +
                    report_data_exp.corporate_id +
                    "-" +
                    report_data_exp.emp_id +
                    "-" +
                    wage_month +
                    "-" +
                    wage_year +
                    ".pdf";
                  let file = Site_helper.createFiles(
                    null,
                    file_name,
                    req.authData.corporate_id,
                    "temp_files/payment-compliance-module/voucher"
                  );
                  path_array.push({
                    // "link": 'D:/node/payrollbackend/'+file_path+file_name,
                    link: absolutePath + file.location + file_name,
                    file_path: file.location,
                    file_name: file.file_name,
                  });
                  // console.log(path.dirname(baseurl+file_path+file_name));
                  // return false;
                  var pdf_data = {
                    emp_first_name: report_data_exp.emp_first_name,
                    emp_last_name: report_data_exp.emp_last_name,
                    net_take_home: net_take_home,
                    wage_month: wage_month,
                    wage_year: wage_year,
                    establishment_name: report_data_exp.companies.establishment_name,
                    company_data:report_data_exp.company,
                    company_details:report_data_exp.company_details,
                  };
                  var pdf_file = await Site_helper.generate_salary_voucher_pdf(
                    { salary_data: pdf_data },
                    file_name,
                    file.location
                  );
                }
              })
            ).then(async (reportdata_com) => {
              if (req.body.instruction_type == "voucher") {
                let file = Site_helper.createFiles(
                  null,
                  "voucher-" +
                    file_id +
                    "-" +
                    wage_month +
                    "-" +
                    wage_year +
                    ".zip",
                  req.authData.corporate_id,
                  "temp_files/payment-compliance-module/voucher"
                );
                var path_link = null;
                if (path_array.length > 0) {
                  var dir = absolutePath + file.location;
                  if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                  }
                  const output = fs.createWriteStream(
                    file.location.substring(1, file.location.length) +
                      file.file_name
                  );
                  const archive = archiver("zip", {
                    zlib: { level: 9 },
                  });
                  output.on("close", () => {
                    console.log("Archive finished.");
                  });
                  archive.on("error", (err) => {
                    console.log("Error.", err);
                  });
                  archive.pipe(output);
                  path_array.map(async function (parray) {
                    archive.append(fs.createReadStream(parray.link), {
                      name: parray.file_name,
                    });
                  });

                  archive.finalize();
                  path_link = file.location + file.file_name;
                  var document = {
                    corporate_id: req.authData.corporate_id,
                    file_id: file_id,
                    xlsx_file_name: path_link,
                    wage_month: wage_month,
                    wage_year: wage_year,
                    pay_type: req.body.payment_for,
                    instruction_type: "voucher",
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
                }

                // return resp.status(200).json({status: "success", message: 'Salary voucher zip generated successfully.', url: path_link});
              } else {
                if (sl_no < 1) {
                  return resp.status(200).json({
                    status: "success",
                    message: "Nothing to generate",
                  });
                } else {
                  let file_name = "instruction-report-" + file_id + ".xlsx";
                  let file = Site_helper.createFiles(
                    wb,
                    file_name,
                    req.authData.corporate_id,
                    "temp_files/payment-compliance-module/instruction-report"
                  );
                  // wb.write(instructionsheet_xlsx);
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
                    } else if (req.body.payment_for == "leave") {
                      var pay_type = "leave";
                    } else if (req.body.payment_for == "extra_earning") {
                      var pay_type = "extra_earning";
                    } else if (req.body.payment_for == "advance") {
                      var pay_type = "advance";
                    }
                  }
                  var document = {
                    corporate_id: req.authData.corporate_id,
                    file_id: file_id,
                    xlsx_file_name: file.location + file.file_name,
                    wage_month: wage_month,
                    wage_year: wage_year,
                    pay_type: pay_type,
                    instruction_type: "bank",
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
              }
            });
          } else {
            return resp
              .status(200)
              .json({ status: "success", message: "Nothing to generate." });
          }
        });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_bank_payment_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        pageno: "required",
        wage_month: "required",
        wage_year: "required",
        status: "required|in:active,confirm",
        pay_type:
          "in:earning,salary,supplement_salary,incentive,bonus,ot,reimbursment,arrear,extra_earning,advance",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var sortoption = { created_at: -1 };
        const options = {
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : perpage,
          sort: sortoption,
        };
        var filter_option = {
          corporate_id: req.authData.corporate_id,
          wage_month: req.body.wage_month,
          wage_year: req.body.wage_year,
          status: req.body.status,
        };
        if (req.body.pay_type) {
          filter_option.pay_type = req.body.pay_type;
        }
        if (req.body.searchkey) {
          filter_option = {
            $or: [{ file_id: { $regex: req.body.searchkey, $options: "i" } }],
            corporate_id: req.authData.corporate_id,
          };
        }
        BankInstruction.paginate(
          filter_option,
          options,
          function (err, bank_payment) {
            if (err)
              return resp.json({ status: "error", message: "no data found" });
            return resp
              .status(200)
              .json({ status: "success", bank_payment_data: bank_payment });
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
  download_payment_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        bank_instruction_id: "required",
        type: "required|in:view,download",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(403).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var bankdata = await BankInstruction.findOne({
          _id: mongoose.Types.ObjectId(req.body.bank_instruction_id),
        });
        if (bankdata) {
          file_path = bankdata.xlsx_file_name;
          var dir = absolutePath + "/" + file_path;
          if (fs.existsSync(dir)) {
            await Site_helper.driect_download(
              file_path,
              req.authData.corporate_id,
              resp
            );
          } else {
            return resp.status(200).json({
              status: "success",
              message: "File not exist in our server.",
            });
          }
        } else {
          return resp
            .status(200)
            .json({ status: "success", message: "Something went wrong." });
        }
      }
    } catch (e) {
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  confirm_bank_payment: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        remarks: "required",
        referance_file_id: "required",
        sheet_type: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var get_current_user = await Site_helper.get_current_user(req);
        //console.log(get_current_user)
        var cong_log =
          get_current_user.first_name +
          " " +
          get_current_user.last_name +
          " " +
          new Date();
        BankInstruction.findOneAndUpdate(
          { _id: req.body.referance_file_id },
          {
            remarks: req.body.remarks,
            status: "confirm",
            confirmation_log: cong_log,
          },
          async function (err, bank_payment) {
            if (err)
              return resp.json({ status: "error", message: "no data found" });

            let recovery_from = null;
            let monthly_report_data = [];
            switch (req.body.sheet_type) {
              case "salary":
                recovery_from = "gross_earning";
                monthly_report_data = await EmployeeMonthlyReport.find({
                  wage_month: +bank_payment.wage_month,
                  wage_year: +bank_payment.wage_year,
                  "salary_report.bank_ins_referance_id": bank_payment.file_id,
                });
                break;
              case "supplement_salary":
                monthly_report_data = await EmployeeMonthlyReport.find({
                  wage_month: +bank_payment.wage_month,
                  wage_year: +bank_payment.wage_year,
                  "supplement_salary_report.bank_ins_referance_id":
                    bank_payment.file_id,
                });
                recovery_from = "gross_earning";
                break;
              case "incentive":
                monthly_report_data = await EmployeeMonthlyReport.find({
                  wage_month: +bank_payment.wage_month,
                  wage_year: +bank_payment.wage_year,
                  "incentive_report.bank_ins_referance_id":
                    bank_payment.file_id,
                });
                recovery_from = "incentive";
                break;
              case "bonus":
                monthly_report_data = await EmployeeMonthlyReport.find({
                  wage_month: +bank_payment.wage_month,
                  wage_year: +bank_payment.wage_year,
                  "bonus_report.bank_ins_referance_id": bank_payment.file_id,
                });
                recovery_from = "bonus";
                break;
              // case "ot":
              //   monthly_report_data = await EmployeeMonthlyReport.find({
              //     wage_month: +bank_payment.wage_month,
              //     wage_year: +bank_payment.wage_year,
              //     "ot_report.bank_ins_referance_id": bank_payment.file_id
              //   })
              //   recovery_from = null
              //   break;
              case "reimbursment":
                monthly_report_data = await EmployeeMonthlyReport.find({
                  wage_month: +bank_payment.wage_month,
                  wage_year: +bank_payment.wage_year,
                  "reimbursment_report.bank_ins_referance_id":
                    bank_payment.file_id,
                });
                recovery_from = "reimbursement";
                break;
              case "extra_earning":
                monthly_report_data = await EmployeeMonthlyReport.find({
                  wage_month: +bank_payment.wage_month,
                  wage_year: +bank_payment.wage_year,
                  "extra_earning_report.bank_ins_referance_id":
                    bank_payment.file_id,
                });
                recovery_from = "extra_earning";
                break;
              case "earning":
                monthly_report_data = await EmployeeMonthlyReport.find({
                  wage_month: +bank_payment.wage_month,
                  wage_year: +bank_payment.wage_year,
                  $or: [
                    {
                      "salary_report.bank_ins_referance_id":
                        bank_payment.file_id,
                    },
                    {
                      "supplement_salary_report.bank_ins_referance_id":
                        bank_payment.file_id,
                    },
                    {
                      "incentive_report.bank_ins_referance_id":
                        bank_payment.file_id,
                    },
                    {
                      "bonus_report.bank_ins_referance_id":
                        bank_payment.file_id,
                    },
                    // { "ot_report.bank_ins_referance_id": bank_payment.file_id },
                    {
                      "reimbursment_report.bank_ins_referance_id":
                        bank_payment.file_id,
                    },
                    // { "arrear_report.bank_ins_referance_id": bank_payment.file_id }
                  ],
                });
                break;
              // case "arrear":
              //   monthly_report_data = await EmployeeMonthlyReport.find({
              //     wage_month: +bank_payment.wage_month,
              //     wage_year: +bank_payment.wage_year,
              //     "arrear_report.bank_ins_referance_id": bank_payment.file_id
              //   })
              //   recovery_from = null
              //   break;

              default:
                break;
            }

            if (
              monthly_report_data.length &&
              (recovery_from || req.body.sheet_type == "earning")
            ) {
              monthly_report_data.forEach(async (data) => {
                let advanceReport = await employee_advances.find({
                  emp_id: data.emp_id,
                  "instalment_history.instalment_month": String(
                    bank_payment.wage_month
                  ),
                  "instalment_history.instalment_year": String(
                    bank_payment.wage_year
                  ),
                  "instalment_history.status": "pending",
                  recovery_from,
                });
                advanceReport.forEach(async (advance) => {
                  advance.instalment_history = advance.instalment_history.map(
                    (his) => {
                      if (
                        his.status == "pending" &&
                        +his.instalment_month == bank_payment.wage_month &&
                        +his.instalment_year == bank_payment.wage_year
                      ) {
                        his.status = "complete";
                        return his;
                      } else {
                        return his;
                      }
                    }
                  );
                  await employee_advances.updateOne(
                    { _id: advance._id },
                    { instalment_history: advance.instalment_history }
                  );
                });
              });
            }

            return resp.status(200).json({
              status: "success",
              message: "Bank payment confirm Successfully",
              bank_payment_data: bank_payment,
            });
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
  delete_bank_payment_ref_file: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        referance_file_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        BankInstruction.findByIdAndRemove(
          { _id: req.body.referance_file_id },
          async function (err, bank_payment) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              var filePath = file_path + "/" + bank_payment.xlsx_file_name;
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
              if (bank_payment.pay_type == "earning") {
                await EmployeeMonthlyReport.updateMany(
                  {
                    "salary_report.bank_ins_referance_id": bank_payment.file_id,
                  },
                  { "salary_report.bank_ins_referance_id": "" }
                );
                await EmployeeMonthlyReport.updateMany(
                  {
                    "supplement_salary_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  },
                  { "supplement_salary_report.bank_ins_referance_id": "" }
                );
                await EmployeeMonthlyReport.updateMany(
                  {
                    "incentive_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  },
                  { "incentive_report.bank_ins_referance_id": "" }
                );
                await EmployeeMonthlyReport.updateMany(
                  {
                    "bonus_report.bank_ins_referance_id": bank_payment.file_id,
                  },
                  { "bonus_report.bank_ins_referance_id": "" }
                );
                await EmployeeMonthlyReport.updateMany(
                  { "ot_report.bank_ins_referance_id": bank_payment.file_id },
                  { "ot_report.bank_ins_referance_id": "" }
                );
                await EmployeeMonthlyReport.updateMany(
                  {
                    "shift_allawance_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  },
                  { "shift_allawance_report.bank_ins_referance_id": "" }
                );
                await EmployeeMonthlyReport.updateMany(
                  {
                    "reimbursment_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  },
                  { "reimbursment_report.bank_ins_referance_id": "" }
                );
                await EmployeeMonthlyReport.updateMany(
                  { "total_data.bank_ins_referance_id": bank_payment.file_id },
                  { "total_data.bank_ins_referance_id": "" }
                );
              } else if (bank_payment.pay_type == "arrear") {
                await RevisionReport.updateMany(
                  { bank_ins_referance_id: bank_payment.file_id },
                  {
                    bank_ins_referance_id: "",
                    run_revision_status: "calculated",
                  }
                );
              } else {
                if (bank_payment.pay_type == "salary") {
                  update_value = { "salary_report.bank_ins_referance_id": "" };
                  where_con = {
                    "salary_report.bank_ins_referance_id": bank_payment.file_id,
                  };
                } else if (bank_payment.pay_type == "supplement_salary") {
                  update_value = {
                    "supplement_salary_report.bank_ins_referance_id": "",
                  };
                  where_con = {
                    "supplement_salary_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  };
                } else if (bank_payment.pay_type == "incentive") {
                  update_value = {
                    "incentive_report.bank_ins_referance_id": "",
                  };
                  where_con = {
                    "incentive_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  };
                } else if (bank_payment.pay_type == "bonus") {
                  update_value = { "bonus_report.bank_ins_referance_id": "" };
                  where_con = {
                    "bonus_report.bank_ins_referance_id": bank_payment.file_id,
                  };
                } else if (bank_payment.pay_type == "ot") {
                  update_value = { "ot_report.bank_ins_referance_id": "" };
                  where_con = {
                    "ot_report.bank_ins_referance_id": bank_payment.file_id,
                  };
                } else if (bank_payment.pay_type == "reimbursment") {
                  update_value = {
                    "reimbursment_report.bank_ins_referance_id": "",
                  };
                  where_con = {
                    "reimbursment_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  };
                } else if (bank_payment.pay_type == "shift_allawance") {
                  update_value = {
                    "shift_allawance_report.bank_ins_referance_id": "",
                  };
                  where_con = {
                    "shift_allawance_report.bank_ins_referance_id":
                      bank_payment.file_id,
                  };
                }
                await EmployeeMonthlyReport.updateMany(where_con, update_value);
              }
              return resp.status(200).send({
                status: "success",
                message: "Referance file deleted successfully",
                bank_payment: bank_payment,
              });
            }
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
  get_challan_emp_list: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
        pageno: "required",
        sheet_type:
          "requiredIf:compliance_type,ecr|in:all,salary,supplement_salary,incentive,bonus,ot,arrear",
        compliance_type: "required|in:ecr,arrear",
        compliance_status: "required|in:ready,pending,generated",
        listing_type: "required|in:pf,esic",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
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

        // if (req.body.compliance_type == "arrear") {
        //   var lookup_val = [
        //     {
        //       $lookup: {
        //         from: "revision_reports",
        //         localField: "revisions.revision_unique_id",
        //         foreignField: "revision_unique_id",
        //         as: "revision_reports",
        //       },
        //     },
        //   ];
        //   var add_field = {
        //     $addFields: {
        //       revision_reports: {
        //         $arrayElemAt: ["$revision_reports", 0],
        //       },
        //     },
        //   };
        //   var select_val = {
        //     module_report: {
        //       pf_data: "$revision_reports.consolidated_arrear_report.pf_data",
        //       pf_data: "$revision_reports.consolidated_arrear_report.pf_data",
        //       total_pf_bucket:
        //         "$revision_reports.consolidated_arrear_report.total_pf_bucket",
        //       total_pf_wages:
        //         "$revision_reports.consolidated_arrear_report.total_pf_wages",
        //       esic_data:
        //         "$revision_reports.consolidated_arrear_report.esic_data",
        //       total_esic_bucket:
        //         "$revision_reports.consolidated_arrear_report.total_esic_bucket",
        //       pf_challan_referance_id:
        //         "$revision_reports.pf_challan_referance_id",
        //       esic_challan_referance_id:
        //         "$revision_reports.esic_challan_referance_id",
        //       emp_uan_no: "$revision_reports.emp_data.emp_uan_no",
        //     },
        //   };
        //   //search_option_details.$match['revision_reports.run_revision_status']= 'generated';
        //   search_option_details.$match["revision_reports.revision_month"] =
        //     parseInt(wage_month);
        //   search_option_details.$match["revision_reports.revision_year"] =
        //     parseInt(wage_year);
        //   // if(req.body.listing_type == 'pf')
        //   // {
        //   //   search_option_details.$match['revision_reports.consolidated_arrear_report.pf_challan_referance_id']=  '';
        //   // }
        //   // else
        //   // {
        //   //   search_option_details.$match['revision_reports.consolidated_arrear_report.esic_challan_referance_id']=  '';
        //   // }
        // } else {

        search_option_details.$match["employee_monthly_reports.wage_month"] =
          parseInt(wage_month);
        search_option_details.$match["employee_monthly_reports.wage_year"] =
          parseInt(wage_year);

        if (req.body.listing_type == "pf") {
          search_option_details.$match[
            "employee_monthly_reports.emp_data.EPF"
          ] = { $in: ["yes", "YES"] };
        } else {
          search_option_details.$match[
            "employee_monthly_reports.emp_data.ESIC"
          ] = { $in: ["yes", "YES"] };
        }

        // if (req.body.sheet_type == "salary") {
        //   search_option_details.$match[
        //     "employee_monthly_reports.salary_report"
        //   ] = { $exists: true, $ne: null };
        // } else if (req.body.sheet_type == "supplement_salary") {
        //   search_option_details.$match[
        //     "employee_monthly_reports.supplement_salary_report"
        //   ] = { $exists: true, $ne: null };
        // } else if (req.body.sheet_type == "incentive") {
        //   search_option_details.$match[
        //     "employee_monthly_reports.incentive_report"
        //   ] = { $exists: true, $ne: null };
        // } else if (req.body.sheet_type == "bonus") {
        //   search_option_details.$match[
        //     "employee_monthly_reports.bonus_report"
        //   ] = { $exists: true, $ne: null };
        // } else if (req.body.sheet_type == "ot") {
        //   search_option_details.$match["employee_monthly_reports.ot_report"] = {
        //     $exists: true,
        //     $ne: null,
        //   };
        // } else if (req.body.sheet_type == "arrear") {
        //   search_option_details.$match[
        //     "employee_monthly_reports.arrear_report"
        //   ] = { $exists: true, $ne: null };
        // }

        const select_val = {
          wage_month: "$employee_monthly_reports.wage_month",
          wage_year: "$employee_monthly_reports.wage_year",
          emp_uan_no: "$employee_monthly_reports.emp_data.emp_uan_no",
          esic_no: "$employee_monthly_reports.emp_data.esic_no",
        };

        if (req.body.sheet_type == "all") {
          const reports = [
            { label: "salary", value: "salary_report" },
            { label: "ovetime", value: "ot_report" },
            { label: "incentive", value: "incentive_report" },
            { label: "supplement salary", value: "supplement_salary_report" },
            { label: "bonus", value: "bonus_report" },
          ];

          for (const { label, value } of reports) {
            const targetField = `$employee_monthly_reports.${value}`;
            select_val[value] = {
              $cond: {
                if: {
                  $and: [
                    { $ne: [{ $type: targetField }, "missing"] },
                    { $ne: [targetField, null] },
                  ],
                },
                then: {
                  sheet_type: label,
                  pf_data: targetField + `.pf_data`,
                  total_pf_bucket: targetField + `.total_pf_bucket`,
                  total_pf_wages: targetField + `.total_pf_wages`,
                  esic_data: targetField + `.esic_data`,
                  total_esic_bucket: targetField + `.total_esic_bucket`,
                  total_esic_wages: targetField + `.total_esic_wages`,
                  pf_challan_referance_id:
                    targetField + `.pf_challan_referance_id`,
                  esic_challan_referance_id:
                    targetField + `.esic_challan_referance_id`,
                },
                else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
              },
            };

            if (value == "salary_report") {
              select_val[value].$cond.then["hold_salary"] =
                "$hold_salary_emp.status";
            }
          }
        } else {
          const validaion =
            "employee_monthly_reports." + req.body.sheet_type + "_report";
          search_option_details.$match[validaion] = {
            $exists: true,
            $ne: null,
          };

          select_val[req.body.sheet_type + "_report"] = {
            sheet_type:
              req.body.sheet_type == "ot"
                ? "overtime"
                : req.body.sheet_type == "supplement_salary"
                ? "supplement salary"
                : req.body.sheet_type,
            pf_data:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.pf_data",
            total_pf_bucket:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.total_pf_bucket",
            total_pf_wages:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.total_pf_wages",
            esic_data:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.esic_data",
            total_esic_bucket:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.total_esic_bucket",
            total_esic_wages:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.total_esic_wages",
            pf_challan_referance_id:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.pf_challan_referance_id",
            esic_challan_referance_id:
              "$employee_monthly_reports." +
              req.body.sheet_type +
              "_report.esic_challan_referance_id",
          };

          if (req.body.sheet_type == "salary") {
            select_val[req.body.sheet_type + "_report"]["hold_salary"] =
              "$hold_salary_emp.status";
          }
        }

        // var select_val = {
        //   $cond: {
        //     if: { $eq: ["all", req.body.sheet_type] },
        //     then: {
        //       wage_month: "$employee_monthly_reports.wage_month",
        //       wage_year: "$employee_monthly_reports.wage_year",
        //       emp_uan_no: "$employee_monthly_reports.emp_data.emp_uan_no",
        //       esic_no: "$employee_monthly_reports.emp_data.esic_no",
        //       // pf_data:"$employee_monthly_reports.total_data.pf_data",
        //       // total_pf_bucket:"$employee_monthly_reports.total_data.total_pf_bucket",
        //       // total_pf_wages:"$employee_monthly_reports.total_data.total_pf_wages",
        //       // esic_data:"$employee_monthly_reports.total_data.esic_data",
        //       // total_esic_bucket:"$employee_monthly_reports.total_data.total_esic_bucket",
        //       // total_esic_wages:"$employee_monthly_reports.total_data.total_esic_wages",
        //       // pf_challan_referance_id:"$employee_monthly_reports.total_data.pf_challan_referance_id",
        //       // esic_challan_referance_id:"$employee_monthly_reports.total_data.esic_challan_referance_id",

        //       salary_report: {
        //         $cond: {
        //           if: {
        //             $ne: ["$employee_monthly_reports.salary_report", null],
        //           },
        //           then: {
        //             sheet_type: "salary",
        //             pf_data: "$employee_monthly_reports.salary_report.pf_data",
        //             total_pf_bucket:
        //               "$employee_monthly_reports.salary_report.total_pf_bucket",
        //             total_pf_wages:
        //               "$employee_monthly_reports.salary_report.total_pf_wages",
        //             esic_data:
        //               "$employee_monthly_reports.salary_report.esic_data",
        //             total_esic_bucket:
        //               "$employee_monthly_reports.salary_report.total_esic_bucket",
        //             total_esic_wages:
        //               "$employee_monthly_reports.salary_report.total_esic_wages",
        //             pf_challan_referance_id:
        //               "$employee_monthly_reports.salary_report.pf_challan_referance_id",
        //             esic_challan_referance_id:
        //               "$employee_monthly_reports.salary_report.esic_challan_referance_id",
        //             hold_salary: "$hold_salary_emp.status",
        //           },
        //           else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
        //         },
        //       },

        //       ot_report: {
        //         $cond: {
        //           if: { $ne: ["$employee_monthly_reports.ot_report", null] },
        //           then: {
        //             sheet_type: "overtime",
        //             pf_data: "$employee_monthly_reports.ot_report.pf_data",
        //             total_pf_bucket:
        //               "$employee_monthly_reports.ot_report.total_pf_bucket",
        //             total_pf_wages:
        //               "$employee_monthly_reports.ot_report.total_pf_wages",
        //             esic_data: "$employee_monthly_reports.ot_report.esic_data",
        //             total_esic_bucket:
        //               "$employee_monthly_reports.ot_report.total_esic_bucket",
        //             total_esic_wages:
        //               "$employee_monthly_reports.ot_report.total_esic_wages",
        //             pf_challan_referance_id:
        //               "$employee_monthly_reports.ot_report.pf_challan_referance_id",
        //             esic_challan_referance_id:
        //               "$employee_monthly_reports.ot_report.esic_challan_referance_id",
        //           },
        //           else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
        //         },
        //       },

        //       incentive_report: {
        //         $cond: {
        //           if: {
        //             $ne: ["$employee_monthly_reports.incentive_report", null],
        //           },
        //           then: {
        //             sheet_type: "incentive",
        //             pf_data:
        //               "$employee_monthly_reports.incentive_report.pf_data",
        //             total_pf_bucket:
        //               "$employee_monthly_reports.incentive_report.total_pf_bucket",
        //             total_pf_wages:
        //               "$employee_monthly_reports.incentive_report.total_pf_wages",
        //             esic_data:
        //               "$employee_monthly_reports.incentive_report.esic_data",
        //             total_esic_bucket:
        //               "$employee_monthly_reports.incentive_report.total_esic_bucket",
        //             total_esic_wages:
        //               "$employee_monthly_reports.incentive_report.total_esic_wages",
        //             pf_challan_referance_id:
        //               "$employee_monthly_reports.incentive_report.pf_challan_referance_id",
        //             esic_challan_referance_id:
        //               "$employee_monthly_reports.incentive_report.esic_challan_referance_id",
        //           },
        //           else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
        //         },
        //       },

        //       supplement_salary_report: {
        //         $cond: {
        //           if: {
        //             $ne: [
        //               "$employee_monthly_reports.supplement_salary_report",
        //               null,
        //             ],
        //           },
        //           then: {
        //             sheet_type: "supplement salary",
        //             pf_data:
        //               "$employee_monthly_reports.supplement_salary_report.pf_data",
        //             total_pf_bucket:
        //               "$employee_monthly_reports.supplement_salary_report.total_pf_bucket",
        //             total_pf_wages:
        //               "$employee_monthly_reports.supplement_salary_report.total_pf_wages",
        //             esic_data:
        //               "$employee_monthly_reports.supplement_salary_report.esic_data",
        //             total_esic_bucket:
        //               "$employee_monthly_reports.supplement_salary_report.total_esic_bucket",
        //             total_esic_wages:
        //               "$employee_monthly_reports.supplement_salary_report.total_esic_wages",
        //             pf_challan_referance_id:
        //               "$employee_monthly_reports.supplement_salary_report.pf_challan_referance_id",
        //             esic_challan_referance_id:
        //               "$employee_monthly_reports.supplement_salary_report.esic_challan_referance_id",
        //           },
        //           else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
        //         },
        //       },

        //       bonus_report: {
        //         $cond: {
        //           if: {
        //             $ne: ["$employee_monthly_reports.bonus_report", null],
        //           },
        //           then: {
        //             sheet_type: "bonus",
        //             pf_data: "$employee_monthly_reports.bonus_report.pf_data",
        //             total_pf_bucket:
        //               "$employee_monthly_reports.bonus_report.total_pf_bucket",
        //             total_pf_wages:
        //               "$employee_monthly_reports.bonus_report.total_pf_wages",
        //             esic_data:
        //               "$employee_monthly_reports.bonus_report.esic_data",
        //             total_esic_bucket:
        //               "$employee_monthly_reports.bonus_report.total_esic_bucket",
        //             total_esic_wages:
        //               "$employee_monthly_reports.bonus_report.total_esic_wages",
        //             pf_challan_referance_id:
        //               "$employee_monthly_reports.bonus_report.pf_challan_referance_id",
        //             esic_challan_referance_id:
        //               "$employee_monthly_reports.bonus_report.esic_challan_referance_id",
        //           },
        //           else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
        //         },
        //       },
        //     },
        //     else: {
        //       wage_month: "$employee_monthly_reports.wage_month",
        //       wage_year: "$employee_monthly_reports.wage_year",
        //       emp_uan_no: "$employee_monthly_reports.emp_data.emp_uan_no",
        //       esic_no: "$employee_monthly_reports.emp_data.esic_no",
        //       [req.body.sheet_type + "_report"]: {
        //         sheet_type:
        //           req.body.sheet_type == "ot"
        //             ? "overtime"
        //             : req.body.sheet_type == "supplement_salary"
        //             ? "supplement salary"
        //             : req.body.sheet_type,
        //         pf_data:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.pf_data",
        //         total_pf_bucket:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.total_pf_bucket",
        //         total_pf_wages:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.total_pf_wages",
        //         esic_data:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.esic_data",
        //         total_esic_bucket:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.total_esic_bucket",
        //         total_esic_wages:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.total_esic_wages",
        //         pf_challan_referance_id:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.pf_challan_referance_id",
        //         esic_challan_referance_id:
        //           "$employee_monthly_reports." +
        //           req.body.sheet_type +
        //           "_report.esic_challan_referance_id",
        //       },
        //     },
        //   },
        // };
        // }

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
              from: "revisions",
              localField: "_id",
              foreignField: "emp_db_id",
              as: "revisions",
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
          {
            $lookup: {
              from: "hold_salary_emps",
              let: { emp_db_idVar: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
                      { wage_month: wage_month.toString() },
                      { wage_year: wage_year.toString() },
                      { status: "active" },
                      { hold_type: "salaryWithCom" },
                    ],
                  },
                },
              ],
              as: "hold_salary_emps",
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
              hold_salary_emp: {
                $arrayElemAt: ["$hold_salary_emps", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              emp_id: 1,
              //emp_uan_no:{$ifNull: [ "$employee_monthly_reports.emp_data.emp_uan_no", null]},
              compliance_report: select_val,
              corporate_id: 1,
            },
          },
        ]);
        Employee.aggregatePaginate(
          myAggregate,
          options,
          async function (err, master_data) {
            if (err)
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            return resp.status(200).send({
              status: "success",
              message: "",
              master_data: master_data,
            });
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
  generate_challan_report: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
        sheet_type:
          "requiredIf:compliance_type,ecr|in:all,salary,supplement_salary,incentive,bonus,ot,arrear",
        earning_sheet_type_selection: "requiredIf:row_checked_all,false",
        compliance_status: "required|in:ready,pending,generated",
        compliance_type: "required|in:ecr,arrear",
        listing_type: "required|in:pf,esic",
        // branch: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
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

        // search_option_details.$match[
        //   "employee_details.employment_hr_details.branch"
        // ] = mongoose.Types.ObjectId(req.body.branch);

        if (req.body.listing_type == "pf") {
          if (req.body.sheet_type == "all") {
            // search_option_details.$match['employee_monthly_reports.total_data.pf_challan_referance_id']=  '';
            // search_option_details.$match['employee_monthly_reports.total_data.total_earning']=  {$gt: 0} ;
            // search_option_details.$match['employee_monthly_reports.pf_generate']=  'no' ;
          } else {
            search_option_details.$match[
              "employee_monthly_reports." +
                req.body.sheet_type +
                "_report.pf_challan_referance_id"
            ] = "";
            search_option_details.$match[
              "employee_monthly_reports." +
                req.body.sheet_type +
                "_report.gross_earning"
            ] = { $ne: null };
          }
        } else {
          if (req.body.sheet_type == "all") {
            // search_option_details.$match['employee_monthly_reports.total_data.esic_challan_referance_id']=  '';
            // search_option_details.$match['employee_monthly_reports.total_data.total_earning']=  {$gt: 0} ;
            // search_option_details.$match['employee_monthly_reports.esic_generate']=  'no' ;
          } else {
            search_option_details.$match[
              "employee_monthly_reports." +
                req.body.sheet_type +
                "_report.esic_challan_referance_id"
            ] = "";
            search_option_details.$match[
              "employee_monthly_reports." +
                req.body.sheet_type +
                "_report.gross_earning"
            ] = { $ne: null };
          }
        }

        search_option_details.$match["employee_monthly_reports.wage_month"] =
          parseInt(wage_month);
        search_option_details.$match["employee_monthly_reports.wage_year"] =
          parseInt(wage_year);

        if (req.body.listing_type == "pf") {
          search_option_details.$match[
            "employee_monthly_reports.emp_data.EPF"
          ] = { $in: ["yes", "YES"] };
          search_option_details.$match[
            "employee_monthly_reports.emp_data.emp_uan_no"
          ] = { $ne: "" };
        } else {
          search_option_details.$match[
            "employee_monthly_reports.emp_data.ESIC"
          ] = { $in: ["yes", "YES"] };
          search_option_details.$match[
            "employee_monthly_reports.emp_data.esic"
          ] = { $ne: "" };
        }

        search_option_details.$match["$and"] = [
          {
            $or: [
              {
                "hold_salary_emps.autohold_type_disburse": {
                  $ne: "salaryWithCompliance",
                },
              },
              {
                $and: [
                  {
                    "hold_salary_emps.autohold_type_disburse":
                      "salaryWithCompliance",
                  },
                  { "hold_salary_emps.status": "inactive" },
                ],
              },
            ],
          },
        ];

        if (req.body.sheet_type == "salary") {
          search_option_details.$match[
            "employee_monthly_reports.salary_report"
          ] = { $exists: true, $ne: null };
        } else if (req.body.sheet_type == "supplement_salary") {
          search_option_details.$match[
            "employee_monthly_reports.supplement_salary_report"
          ] = { $exists: true, $ne: null };
        } else if (req.body.sheet_type == "incentive") {
          search_option_details.$match[
            "employee_monthly_reports.incentive_report"
          ] = { $exists: true, $ne: null };
        } else if (req.body.sheet_type == "bonus") {
          search_option_details.$match[
            "employee_monthly_reports.bonus_report"
          ] = { $exists: true, $ne: null };
        } else if (req.body.sheet_type == "ot") {
          search_option_details.$match["employee_monthly_reports.ot_report"] = {
            $exists: true,
            $ne: null,
          };
        } else if (req.body.sheet_type == "arrear") {
          search_option_details.$match[
            "employee_monthly_reports.arrear_report"
          ] = { $exists: true, $ne: null };
        }

        var select_val = {
          $cond: {
            if: { $eq: ["all", req.body.sheet_type] },
            then: {
              // pf_data:"$employee_monthly_reports.total_data.pf_data",
              // total_pf_bucket:"$employee_monthly_reports.total_data.total_pf_bucket",
              // total_pf_wages:"$employee_monthly_reports.total_data.total_pf_wages",
              // esic_data:"$employee_monthly_reports.total_data.esic_data",
              // total_esic_bucket:"$employee_monthly_reports.total_data.total_esic_bucket",
              // total_esic_wages:"$employee_monthly_reports.total_data.total_esic_wages",
              // gross_earning:"$employee_monthly_reports.total_data.total_earning",
              total_lop:
                "$employee_monthly_reports.attendance_summaries.total_lop",
              paydays: "$employee_monthly_reports.attendance_summaries.paydays",
              total_attendance:
                "$employee_monthly_reports.attendance_summaries.total_attendance",
              emp_pf: "$employee_monthly_reports.emp_data.EPF",
              emp_eps: "$employee_monthly_reports.emp_data.EPS",
              emp_data: "$employee_monthly_reports.emp_data",

              salary_report: {
                $cond: {
                  if: {
                    $ne: ["$employee_monthly_reports.salary_report", null],
                  },
                  then: {
                    sheet_type: "salary",
                    gross_earning:
                      "$employee_monthly_reports.salary_report.gross_earning",
                    pf_data: "$employee_monthly_reports.salary_report.pf_data",
                    total_pf_bucket:
                      "$employee_monthly_reports.salary_report.total_pf_bucket",
                    total_pf_wages:
                      "$employee_monthly_reports.salary_report.total_pf_wages",
                    eps_wages:
                      "$employee_monthly_reports.salary_report.eps_wages",
                    edlis_wages:
                      "$employee_monthly_reports.salary_report.edlis_wages",
                    esic_data:
                      "$employee_monthly_reports.salary_report.esic_data",
                    total_esic_bucket:
                      "$employee_monthly_reports.salary_report.total_esic_bucket",
                    total_esic_wages:
                      "$employee_monthly_reports.salary_report.total_esic_wages",
                    pf_challan_referance_id:
                      "$employee_monthly_reports.salary_report.pf_challan_referance_id",
                    esic_challan_referance_id:
                      "$employee_monthly_reports.salary_report.esic_challan_referance_id",
                    hold_salary: "$hold_salary_emp.status",
                  },
                  else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
                },
              },

              ot_report: {
                $cond: {
                  if: { $ne: ["$employee_monthly_reports.ot_report", null] },
                  then: {
                    sheet_type: "overtime",
                    gross_earning:
                      "$employee_monthly_reports.ot_report.gross_earning",
                    pf_data: "$employee_monthly_reports.ot_report.pf_data",
                    total_pf_bucket:
                      "$employee_monthly_reports.ot_report.total_pf_bucket",
                    total_pf_wages:
                      "$employee_monthly_reports.ot_report.total_pf_wages",
                    eps_wages: "$employee_monthly_reports.ot_report.eps_wages",
                    edlis_wages:
                      "$employee_monthly_reports.ot_report.edlis_wages",
                    esic_data: "$employee_monthly_reports.ot_report.esic_data",
                    total_esic_bucket:
                      "$employee_monthly_reports.ot_report.total_esic_bucket",
                    total_esic_wages:
                      "$employee_monthly_reports.ot_report.total_esic_wages",
                    pf_challan_referance_id:
                      "$employee_monthly_reports.ot_report.pf_challan_referance_id",
                    esic_challan_referance_id:
                      "$employee_monthly_reports.ot_report.esic_challan_referance_id",
                  },
                  else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
                },
              },

              incentive_report: {
                $cond: {
                  if: {
                    $ne: ["$employee_monthly_reports.incentive_report", null],
                  },
                  then: {
                    sheet_type: "incentive",
                    gross_earning:
                      "$employee_monthly_reports.incentive_report.gross_earning",
                    pf_data:
                      "$employee_monthly_reports.incentive_report.pf_data",
                    total_pf_bucket:
                      "$employee_monthly_reports.incentive_report.total_pf_bucket",
                    total_pf_wages:
                      "$employee_monthly_reports.incentive_report.total_pf_wages",
                    eps_wages:
                      "$employee_monthly_reports.incentive_report.eps_wages",
                    edlis_wages:
                      "$employee_monthly_reports.incentive_report.edlis_wages",
                    esic_data:
                      "$employee_monthly_reports.incentive_report.esic_data",
                    total_esic_bucket:
                      "$employee_monthly_reports.incentive_report.total_esic_bucket",
                    total_esic_wages:
                      "$employee_monthly_reports.incentive_report.total_esic_wages",
                    pf_challan_referance_id:
                      "$employee_monthly_reports.incentive_report.pf_challan_referance_id",
                    esic_challan_referance_id:
                      "$employee_monthly_reports.incentive_report.esic_challan_referance_id",
                  },
                  else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
                },
              },

              supplement_salary_report: {
                $cond: {
                  if: {
                    $ne: [
                      "$employee_monthly_reports.supplement_salary_report",
                      null,
                    ],
                  },
                  then: {
                    sheet_type: "supplement salary",
                    gross_earning:
                      "$employee_monthly_reports.supplement_salary_report.gross_earning",
                    pf_data:
                      "$employee_monthly_reports.supplement_salary_report.pf_data",
                    total_pf_bucket:
                      "$employee_monthly_reports.supplement_salary_report.total_pf_bucket",
                    total_pf_wages:
                      "$employee_monthly_reports.supplement_salary_report.total_pf_wages",
                    eps_wages:
                      "$employee_monthly_reports.supplement_salary_report.eps_wages",
                    edlis_wages:
                      "$employee_monthly_reports.supplement_salary_report.edlis_wages",
                    esic_data:
                      "$employee_monthly_reports.supplement_salary_report.esic_data",
                    total_esic_bucket:
                      "$employee_monthly_reports.supplement_salary_report.total_esic_bucket",
                    total_esic_wages:
                      "$employee_monthly_reports.supplement_salary_report.total_esic_wages",
                    pf_challan_referance_id:
                      "$employee_monthly_reports.supplement_salary_report.pf_challan_referance_id",
                    esic_challan_referance_id:
                      "$employee_monthly_reports.supplement_salary_report.esic_challan_referance_id",
                  },
                  else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
                },
              },

              bonus_report: {
                $cond: {
                  if: {
                    $ne: ["$employee_monthly_reports.bonus_report", null],
                  },
                  then: {
                    sheet_type: "bonus",
                    gross_earning:
                      "$employee_monthly_reports.bonus_report.gross_earning",
                    pf_data: "$employee_monthly_reports.bonus_report.pf_data",
                    total_pf_bucket:
                      "$employee_monthly_reports.bonus_report.total_pf_bucket",
                    total_pf_wages:
                      "$employee_monthly_reports.bonus_report.total_pf_wages",
                    eps_wages:
                      "$employee_monthly_reports.bonus_report.eps_wages",
                    edlis_wages:
                      "$employee_monthly_reports.bonus_report.edlis_wages",
                    esic_data:
                      "$employee_monthly_reports.bonus_report.esic_data",
                    total_esic_bucket:
                      "$employee_monthly_reports.bonus_report.total_esic_bucket",
                    total_esic_wages:
                      "$employee_monthly_reports.bonus_report.total_esic_wages",
                    pf_challan_referance_id:
                      "$employee_monthly_reports.bonus_report.pf_challan_referance_id",
                    esic_challan_referance_id:
                      "$employee_monthly_reports.bonus_report.esic_challan_referance_id",
                  },
                  else: "$$REMOVE", // Use $$REMOVE to omit this field if it's null
                },
              },
            },
            else: {
              total_lop:
                "$employee_monthly_reports.attendance_summaries.total_lop",
              paydays: "$employee_monthly_reports.attendance_summaries.paydays",
              total_attendance:
                "$employee_monthly_reports.attendance_summaries.total_attendance",
              emp_data: "$employee_monthly_reports.emp_data",
              [req.body.sheet_type + "_report"]: {
                sheet_type:
                  req.body.sheet_type == "ot"
                    ? "overtime"
                    : req.body.sheet_type == "supplement_salary"
                    ? "supplement salary"
                    : req.body.sheet_type,
                gross_earning:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.gross_earning",
                pf_data:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.pf_data",
                total_pf_bucket:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.total_pf_bucket",
                total_pf_wages:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.total_pf_wages",
                eps_wages:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.eps_wages",
                edlis_wages:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.edlis_wages",
                esic_data:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.esic_data",
                total_esic_bucket:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.total_esic_bucket",
                total_esic_wages:
                  "$employee_monthly_reports." +
                  req.body.sheet_type +
                  "_report.total_esic_wages",
              },
            },
          },
        };

        if (req.body.row_checked_all === "true") {
          // var ids = JSON.parse(req.body.unchecked_row_ids);
          // if (ids.length > 0) {
          //   ids = ids.map(function (el) {
          //     return mongoose.Types.ObjectId(el);
          //   });
          //   search_option.$match._id = { $nin: ids };
          // }
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
          {
            $lookup: {
              from: "revisions",
              let: { emp_db_idVar: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
                      { revision_month: parseInt(wage_month) },
                      { revision_year: parseInt(wage_year) },
                    ],
                  },
                },
              ],
              as: "revisions",
            },
          },
          {
            $lookup: {
              from: "revision_reports",
              let: { emp_db_idVar: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
                      {
                        $or: [
                          // First condition checking revision_month and revision_year
                          {
                            $and: [
                              { revision_month: parseInt(wage_month) },
                              { revision_year: parseInt(wage_year) },
                            ],
                          },
                          // Second condition checking effect_from_month and effect_from_year
                          {
                            $and: [
                              { effect_from_month: parseInt(wage_month) },
                              { effect_from_year: parseInt(wage_year) },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              as: "revision_reports",
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
          {
            $lookup: {
              from: "hold_salary_emps",
              let: { emp_db_idVar: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
                      { wage_month: wage_month.toString() },
                      { wage_year: wage_year.toString() },
                    ],
                  },
                },
              ],
              as: "hold_salary_emps",
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
            $unwind: "$company_details",
          },
          {
            $addFields: {
              branch: {
                $arrayElemAt: ["$branch", 0],
              },
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              revision: {
                $arrayElemAt: ["$revision", 0],
              },
              revision_report: {
                $arrayElemAt: ["$revision_reports", 0],
              },
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
              },
              hold_salary_emp: {
                $arrayElemAt: ["$hold_salary_emps", 0],
              },
            },
          },
          {
            $project: {
              _id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              emp_id: 1,
              "branch.branch_name": 1,
              "branch._id": 1,
              "branch.esic_registration_no": 1,
              emp_branch: "$employee_details.employment_hr_details.branch",
              emp_uan_no: {
                $ifNull: [
                  "$employee_monthly_reports.emp_data.emp_uan_no",
                  "$revision_reports.emp_data.emp_uan_no",
                ],
              },
              esic_no: "$employee_monthly_reports.emp_data.esic_no",
              compliance_report: select_val,
              corporate_id: 1,
              exit_reason_code: "$employee_details.full_and_final.reason_code",
              esic_covered: {
                $ifNull: [
                  "$employee_details.employment_hr_details.esic_covered",
                  "no",
                ],
              },
              revision_report: 1,
              revision_unique_id: {
                $ifNull: ["$revision_report.revision_unique_id", null],
              },
              bonus_report: {
                $ifNull: ["$employee_monthly_reports.bonus_report", null],
              },
              overtime_report: {
                $ifNull: ["$employee_monthly_reports.ot_report", null],
              },
              incentive_report: {
                $ifNull: ["$employee_monthly_reports.incentive_report", null],
              },
            },
          },
        ]);

        myAggregate.then(async (reportdata) => {
          if (Object.keys(reportdata).length > 0) {
            let master_data = reportdata;

            if (
              req.body.row_checked_all == "false" &&
              req.body.sheet_type == "all"
            ) {
              master_data = master_data.filter((employee) => {
                const _id = employee._id;

                const reportTypes = req.body.earning_sheet_type_selection[_id];

                if (!reportTypes) return false;

                const allReportsEmptyChallan = reportTypes.every((type) => {
                  if (req.body.listing_type == "pf") {
                    return (
                      employee?.compliance_report[type] &&
                      employee?.compliance_report[type]
                        ?.pf_challan_referance_id === ""
                    );
                  } else {
                    return (
                      employee?.compliance_report[type] &&
                      employee?.compliance_report[type]
                        ?.esic_challan_referance_id === ""
                    );
                  }
                });

                return allReportsEmptyChallan;
              });
            }

            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");
            var file_id = Math.random().toString(36).slice(2);

            if (req.body.listing_type == "pf") {
              var txtFile = Site_helper.createFiles(
                null,
                "referance-file-" + file_id + ".txt",
                req.authData.corporate_id,
                `cold_storage/referance-file/${wage_year}/${wage_month}`
              );
              // var instructionsheet_text='storage/company/referance_file/referance-file-'+file_id+".txt";
              var text_file_content = "";
              // ws.cell(1, 1).string("SL. NO.");
              ws.cell(1, 1).string("UAN");
              ws.cell(1, 2).string("Member Name");
              ws.cell(1, 3).string("Gross Wages");
              ws.cell(1, 4).string("EPF Wages");
              ws.cell(1, 5).string("EPS Wages");
              ws.cell(1, 6).string("EDLI Wages");
              ws.cell(1, 7).string("EE EPF");
              ws.cell(1, 8).string("ER EPS");
              ws.cell(1, 9).string("ER EPF");
              // ws.cell(1, 7).string("EPF Contribution remitted");
              // ws.cell(1, 8).string("EPS Contribution remitted");
              // ws.cell(1, 9).string("EPF and EPS Diff remitted");
              ws.cell(1, 10).string("NCP");
              ws.cell(1, 11).string("Refund of Advances");

              var row_counter = 1;
              var sl_no = 0;
              var total_emp = 0;
              var total_epf_emp = 0;
              var total_eps_emp = 0;
              var total_edli_emp = 0;
              var total_epf = 0;
              var total_eps = 0;
              var total_edli = 0;
              var total_challan_amount = 0;
              var total_excluded_emp = 0;
              var ac_01 = 0;
              var ac_02 = 0;
              var ac_10 = 0;
              var ac_21 = 0;
              var ac_22 = 0;
            } else {
              // ws.cell(1, 1).string("SL. NO.");
              ws.cell(1, 1).string("IP Number");
              ws.cell(1, 2).string("IP Name");
              ws.cell(1, 3).string(
                "No of Days for which wages paid/payable during the month"
              );
              ws.cell(1, 4).string("Total Monthly Wages");
              ws.cell(1, 5).string("Reason Code for Zero workings days");
              ws.cell(1, 6).string("Last Working Day");
              var isAllEsicRegistrationAreSame =
                master_data.filter(
                  (employee) => employee.ref_no !== master_data[0].ref_no
                ).length <= 0;
              if (!isAllEsicRegistrationAreSame) {
                ws.cell(1, 7).string("Employer Code");
              }
              var row_counter = 1;
              var total_emp = 0;
              var total_esic_emp = 0;
              var total_esic = 0;
              var total_excluded_emp = 0;
              var total_bonus_esic = 0;
              var total_overtime_esic = 0;
              var total_incentive_esic = 0;
              var total_employee_contribution = 0;
              var total_employer_contribution = 0;
              var total_challan_amount = 0;
              var reason_code = "";
            }

            await Promise.all(
              master_data.map(async (report_data_exp) => {
                const master_report = report_data_exp.compliance_report;

                if (req.body.row_checked_all == "false") {
                  var sheet_types =
                    req.body.earning_sheet_type_selection[report_data_exp?._id];
                } else if (req.body.sheet_type !== "all") {
                  var sheet_types = [req.body.sheet_type];
                } else if (req.body.row_checked_all == "true") {
                  var master_sheet_types = [
                    "salary_report",
                    "ot_report",
                    "incentive_report",
                    "supplement_salary_report",
                    "bonus_report",
                    "arrear_report",
                  ];
                  var sheet_types = [];
                  master_sheet_types.forEach((mst) => {
                    if (master_report[mst]) {
                      sheet_types.push(mst);
                    }
                  });
                  var exclueded_sheet_types =
                    req.body.earning_sheet_type_selection[
                      report_data_exp?._id
                    ] || [];
                  exclueded_sheet_types.forEach((type) => {
                    if (master_report[type]) {
                      delete master_report[type];
                      let index = sheet_types.indexOf(type);
                      if (index > -1) {
                        sheet_types.splice(index, 1); // Removes the item at the found index
                      }
                    }
                  });
                }

                if (master_report && sheet_types?.length) {
                  row_counter = row_counter + 1;
                  sl_no = sl_no + 1;
                  total_emp++;
                  if (req.body.listing_type == "pf") {
                    if (sheet_types?.length) {
                      var gross_earning = 0,
                        epf_wages = 0,
                        eps_wages = 0,
                        edlis_wages = 0,
                        employer_contribution = 0,
                        emoloyer_edlis_contribution = 0,
                        pf_contribution = 0,
                        eps_contribution = 0,
                        admin_contribution = 0;
                      for (const type of sheet_types) {
                        gross_earning +=
                          master_report[type]?.gross_earning || 0;
                        epf_wages +=
                          Math.round(
                            master_report[type]?.total_pf_wages || 0
                          ) || 0;
                        eps_wages +=
                          Math.round(master_report[type]?.eps_wages || 0) || 0;
                        edlis_wages +=
                          Math.round(master_report[type]?.edlis_wages || 0) ||
                          0;
                        employer_contribution +=
                          master_report[type]?.pf_data
                            ?.total_employer_contribution || 0;
                        emoloyer_edlis_contribution +=
                          master_report[type]?.pf_data
                            ?.emoloyer_edlis_contribution || 0;
                        pf_contribution +=
                          master_report[type]?.pf_data
                            ?.emoloyer_pf_contribution | 0;
                        eps_contribution +=
                          master_report[type]?.pf_data
                            ?.emoloyer_eps_contribution | 0;
                        admin_contribution +=
                          master_report[type]?.pf_data
                            ?.emoloyer_epf_admin_contribution | 0;
                      }

                      var total_lop = master_report.total_lop | 0;

                      if (master_report.emp_pf == "yes") {
                        total_epf_emp = total_epf_emp + 1;
                        total_epf = total_epf + epf_wages;
                      } else {
                        total_excluded_emp++;
                      }

                      if (master_report.emp_eps == "yes") {
                        total_eps_emp = total_eps_emp + 1;
                        total_eps = total_eps + eps_wages;
                      }

                      if (edlis_wages > 0) {
                        total_edli_emp = total_edli_emp + 1;
                        total_edli = total_edli + edlis_wages;
                      }

                      if (pf_contribution) {
                        ac_01 += pf_contribution;
                      }

                      if (employer_contribution) {
                        ac_01 += employer_contribution;
                        ac_10 += employer_contribution;
                        ac_21 += employer_contribution;
                      }

                      if (admin_contribution) {
                        ac_02 += admin_contribution;
                        ac_22 += admin_contribution;
                      }

                      total_challan_amount = total_epf + total_eps + total_edli;
                      // ws.cell(row_counter, 1).number(sl_no);
                      ws.cell(row_counter, 1).string(
                        master_report.emp_data?.emp_uan_no?.toString()
                      );
                      ws.cell(row_counter, 2).string(
                        master_report.emp_data?.emp_first_name +
                          " " +
                          master_report.emp_data?.emp_last_name
                      );
                      ws.cell(row_counter, 3).string(gross_earning.toString());
                      ws.cell(row_counter, 4).string(epf_wages.toString());
                      ws.cell(row_counter, 5).string(eps_wages.toString());
                      ws.cell(row_counter, 6).string(edlis_wages.toString());
                      ws.cell(row_counter, 7).string(
                        employer_contribution.toString()
                      );
                      ws.cell(row_counter, 8).string(
                        eps_contribution.toString()
                      );
                      ws.cell(row_counter, 9).string(
                        pf_contribution.toString()
                      );
                      ws.cell(row_counter, 10).string(total_lop.toString());
                      ws.cell(row_counter, 11).string("0");

                      text_file_content +=
                        master_report.emp_data.emp_uan_no + "#~#";
                      text_file_content +=
                        master_report.emp_data.emp_first_name +
                        " " +
                        master_report.emp_data.emp_last_name +
                        "#~#";
                      text_file_content += gross_earning.toString() + "#~#";
                      text_file_content += epf_wages.toString() + "#~#";
                      text_file_content += eps_wages.toString() + "#~#";
                      text_file_content += edlis_wages.toString() + "#~#";
                      text_file_content +=
                        employer_contribution.toString() + "#~#";
                      text_file_content += eps_contribution + "#~#";
                      text_file_content += pf_contribution + "#~#";
                      text_file_content += total_lop.toString() + "#~#";
                      text_file_content += "0 \n";
                    }
                  } else {
                    if (sheet_types?.length) {
                      for (const type of sheet_types) {
                        var total_esic_wages =
                          master_report[type]?.total_esic_wages | 0;
                        var employer_contribution =
                          master_report[type]?.esic_data
                            ?.emoloyer_contribution | 0;
                        var employee_contribution =
                          master_report[type]?.esic_data
                            ?.emoloyee_contribution | 0;
                      }
                    }

                    let user_reason_code = master_report.exit_reason_code || "";
                    var total_attendance = master_report.total_attendance | 0;
                    var bonus_esic_amount =
                      report_data_exp?.bonus_report?.total_esic_wages | 0;
                    var ot_esic_amount =
                      report_data_exp?.overtime_report?.total_esic_wacges | 0;
                    var incentive_esic_amount =
                      report_data_exp?.incentive_report?.total_esic_wages | 0;
                    // let emp_esic = master_report.emp_data.esic;

                    if (total_esic_wages == 0) {
                      if (total_attendance == 0) {
                        reason_code = "1";
                      } else if (report_data_exp.esic_covered == "no") {
                        reason_code = "4";
                      } else if (
                        user_reason_code.toLowerCase() == "left service"
                      ) {
                        reason_code = "2";
                      } else if (user_reason_code.toLowerCase() == "retired") {
                        reason_code = "3";
                      } else if (
                        user_reason_code.toLowerCase() == "out of coverage"
                      ) {
                        reason_code = "4";
                      } else if (user_reason_code.toLowerCase() == "expired") {
                        reason_code = "5";
                      } else {
                        reason_code = "0";
                      }
                    } else {
                      total_esic_emp += 1;
                      total_esic += total_esic_wages;
                    }

                    if (bonus_esic_amount) {
                      total_bonus_esic += bonus_esic_amount;
                    }
                    if (ot_esic_amount) {
                      total_overtime_esic += ot_esic_amount;
                    }
                    if (incentive_esic_amount) {
                      total_incentive_esic += incentive_esic_amount;
                    }
                    if (employer_contribution) {
                      total_employer_contribution += employer_contribution;
                    }
                    if (employee_contribution) {
                      total_employee_contribution += employee_contribution;
                    }

                    total_challan_amount = total_esic_wages;

                    var esic_registration_no =
                      report_data_exp?.branch?.esic_registration_no;
                    var paydays = master_report.paydays || 0;
                    var emp_uan_no = report_data_exp.emp_uan_no;
                    var esic_no = report_data_exp.esic_no;

                    ws.cell(row_counter, 1).string(esic_no.toString());
                    ws.cell(row_counter, 2).string(
                      master_report.emp_data.emp_first_name +
                        " " +
                        master_report.emp_data.emp_last_name
                    );
                    ws.cell(row_counter, 3).string(paydays.toString());
                    ws.cell(row_counter, 4).string(total_esic_wages.toString());
                    ws.cell(row_counter, 5).string(reason_code);
                    ws.cell(row_counter, 6).string(" ");
                    if (!isAllEsicRegistrationAreSame && esic_registration_no) {
                      ws.cell(row_counter, 7).string(esic_registration_no);
                    }
                  }

                  let where_condition = "";
                  let update_data = {};

                  const monthly_report = await EmployeeMonthlyReport.findOne({
                    emp_id: master_report.emp_data.emp_id,
                    wage_month: wage_month,
                    wage_year: wage_year,
                  });

                  if (req.body.sheet_type == "all") {
                    if (req.body.listing_type == "pf") {
                      where_condition = {
                        // 'total_data.pf_challan_referance_id':'',
                        emp_id: master_report.emp_data.emp_id,
                        wage_month: wage_month,
                        wage_year: wage_year,
                      };
                      // update_data = {'total_data.pf_challan_referance_id':file_id,'pf_generate':'yes'};

                      for (const type of sheet_types) {
                        if (
                          monthly_report[type] &&
                          monthly_report[type].pf_challan_referance_id == ""
                        ) {
                          where_condition[`${type}.pf_challan_referance_id`] =
                            "";
                          update_data[type + ".pf_challan_referance_id"] =
                            file_id;
                          update_data[type + ".pf_generate"] = "yes";
                        }
                      }
                    } else {
                      where_condition = {
                        // 'total_data.esic_challan_referance_id':'',
                        emp_id: master_report.emp_data.emp_id,
                        wage_month: wage_month,
                        wage_year: wage_year,
                      };

                      for (const type of sheet_types) {
                        if (
                          monthly_report[type] &&
                          monthly_report[type].esic_challan_referance_id == ""
                        ) {
                          where_condition[`${type}.esic_challan_referance_id`] =
                            "";
                          update_data[type + ".esic_challan_referance_id"] =
                            file_id;
                          update_data[type + ".esic_generate"] = "yes";
                        }
                      }
                    }
                  } else {
                    if (req.body.listing_type == "pf") {
                      var report = req.body.sheet_type + "_report";
                      if (
                        monthly_report &&
                        monthly_report[report]?.pf_challan_referance_id == ""
                      ) {
                        where_condition = {
                          emp_id: master_report.emp_data.emp_id,
                          wage_month: wage_month,
                          wage_year: wage_year,
                        };
                        where_condition[`${report}.pf_challan_referance_id`] =
                          "";
                        // update_data = {
                        //   [report + ".pf_challan_referance_id"]: file_id,
                        //   [report + ".pf_generate"]: "yes",
                        // };
                        update_data[type + ".pf_challan_referance_id"] =
                          file_id;
                        update_data[type + ".pf_generate"] = "yes";
                      }
                    } else {
                      var report = req.body.sheet_type + "_report";
                      if (
                        monthly_report &&
                        monthly_report[report].esic_challan_referance_id == ""
                      ) {
                        where_condition = {
                          emp_id: master_report.emp_data.emp_id,
                          wage_month: wage_month,
                          wage_year: wage_year,
                        };
                        where_condition[`${report}.esic_challan_referance_id`] =
                          "";
                        // update_data = {
                        //   [report + ".esic_challan_referance_id"]: file_id,
                        //   [report + ".esic_generate"]: "yes",
                        // };
                        update_data[type + ".esic_challan_referance_id"] =
                          file_id;
                        update_data[type + ".esic_generate"] = "yes";
                      }
                    }
                  }

                  if (req.body.sheet_type == "arrear") {
                    let where_condition = "";
                    let update_data = "";
                    if (req.body.listing_type == "pf") {
                      where_condition = {
                        "consolidated_arrear_report.pf_challan_referance_id":
                          "",
                        revision_unique_id: master_report.revision_unique_id,
                        emp_id: master_report.emp_data.emp_id,
                        revision_month: wage_month,
                        revision_year: wage_year,
                      };
                      update_data = {
                        "consolidated_arrear_report.pf_challan_referance_id":
                          file_id,
                      };
                    } else {
                      where_condition = {
                        "consolidated_arrear_report.esic_challan_referance_id":
                          "",
                        revision_unique_id: master_report.revision_unique_id,
                        emp_id: master_report.emp_data.emp_id,
                        revision_month: wage_month,
                        revision_year: wage_year,
                      };
                      update_data = {
                        "consolidated_arrear_report.esic_challan_referance_id":
                          file_id,
                      };
                    }
                    await RevisionReport.updateOne(where_condition, {
                      $set: update_data,
                    });
                  }

                  const entity = await EmployeeMonthlyReport.findOneAndUpdate(
                    where_condition,
                    { $set: update_data },
                    { upsert: false, new: true }
                  );

                  return entity;

                  // var where_condition = "";
                  // var update_data = "";
                  // if (req.body.compliance_type == "ecr") {

                  //   if (req.body.sheet_type == "all") {
                  //     if (req.body.listing_type == "pf") {
                  //       where_condition = {
                  //         // 'total_data.pf_challan_referance_id':'',
                  //         emp_id: master_report.emp_data.emp_id,
                  //         wage_month: wage_month,
                  //         wage_year: wage_year,
                  //       };
                  //       // update_data = {'total_data.pf_challan_referance_id':file_id,'pf_generate':'yes'};
                  //       for (const type of sheet_types) {
                  //         if (
                  //           monthly_report[type] &&
                  //           monthly_report[type].pf_challan_referance_id == ""
                  //         ) {
                  //           update_data = {};
                  //           update_data[type + ".pf_challan_referance_id"] =
                  //             file_id;
                  //           where_condition[`${type}.pf_challan_referance_id`] =
                  //             "";
                  //         }
                  //       }
                  //     } else {
                  //       where_condition = {
                  //         // 'total_data.esic_challan_referance_id':'',
                  //         emp_id: master_report.emp_data.emp_id,
                  //         wage_month: wage_month,
                  //         wage_year: wage_year,
                  //       };

                  //       for (const type of sheet_types) {
                  //         if (
                  //           monthly_report[type] &&
                  //           monthly_report[type].esic_challan_referance_id == ""
                  //         ) {
                  //           update_data = {};
                  //           update_data[type]["esic_challan_referance_id"] =
                  //             file_id;
                  //           where_condition[
                  //             `${type}.esic_challan_referance_id`
                  //           ] = "";
                  //         }
                  //       }
                  //     }
                  //   } else {
                  //     if (req.body.listing_type == "pf") {
                  //       var sheet_type =
                  //         req.body.sheet_type + ".pf_challan_referance_id";
                  //       if (
                  //         monthly_report &&
                  //         monthly_report[sheet_type] == ""
                  //       ) {
                  //         monthly_report[sheet_type] = file_id;
                  //       }
                  //     } else {
                  //       var sheet_type =
                  //         req.body.sheet_type + ".esic_challan_referance_id";
                  //       // where_condition={ emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year};
                  //       // where_condition[sheet_type]='';
                  //       // update_data[sheet_type] = file_id;
                  //       // update_data['esic_generate'] = 'yes';
                  //       if (
                  //         monthly_report &&
                  //         monthly_report[sheet_type] == ""
                  //       ) {
                  //         monthly_report[sheet_type] = file_id;
                  //         // where_condition={ emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year};
                  //         // where_condition[sheet_type]='';
                  //         // update_data['pf_generate'] = 'yes';
                  //       }
                  //     }
                  //   }
                  //   const entity = await EmployeeMonthlyReport.findOneAndUpdate(
                  //     where_condition,
                  //     { $set: update_data },
                  //     { upsert: false, new: true }
                  //   );
                  // } else {

                  // }
                }
              })
            ).then(async (reportdata_com) => {
              if (sl_no < 1) {
                return resp
                  .status(200)
                  .json({ status: "success", message: "Nothing to generate" });
              } else {
                // wb.write(instructionsheet_xlsx);
                let xlsxFile = Site_helper.createFiles(
                  wb,
                  "referance-file-" + file_id + ".xlsx",
                  req.authData.corporate_id,
                  `cold_storage/referance-file/${wage_year}/${wage_month}`
                );
                if (req.body.listing_type == "pf") {
                  var fs = require("fs");
                  var stream = fs.createWriteStream(
                    "." + txtFile.location + txtFile.file_name
                  );
                  stream.once("open", function (fd) {
                    stream.write(text_file_content);
                    stream.end();
                  });
                  var document = {
                    corporate_id: req.authData.corporate_id,
                    file_id: file_id,
                    xlsx_file_name: xlsxFile.location + xlsxFile.file_name,
                    text_file_name: txtFile.location + txtFile.file_name,
                    wage_month: wage_month,
                    wage_year: wage_year,
                    sheet_type:
                      req.body.sheet_type == "all"
                        ? "earning"
                        : req.body.sheet_type,
                    challan_for: req.body.listing_type,
                    challan_type:
                      req.body.compliance_type == "ecr" ? "ECR" : "ARREAR",
                    status: "active",
                    total_epf_emp: total_epf_emp,
                    total_eps_emp: total_eps_emp,
                    total_edli_emp: total_edli_emp,
                    total_epf: total_epf,
                    total_eps: total_eps,
                    total_edli: total_edli,
                    total_excluded_emp,
                    ac_01,
                    ac_02,
                    ac_10,
                    ac_21,
                    ac_22,
                    total_emp,
                    total_challan_amount: total_challan_amount,
                    created_at: Date.now(),
                  };
                } else {
                  var document = {
                    corporate_id: req.authData.corporate_id,
                    file_id: file_id,
                    xlsx_file_name: xlsxFile.location + xlsxFile.file_name,
                    wage_month: wage_month,
                    wage_year: wage_year,
                    challan_for: req.body.listing_type,
                    sheet_type:
                      req.body.sheet_type == "all"
                        ? "earning"
                        : req.body.sheet_type,
                    challan_type:
                      req.body.compliance_type == "ecr" ? "ECR" : "ARREAR",
                    reason_code: reason_code,
                    status: "active",
                    total_emp,
                    total_esic_emp,
                    total_esic,
                    total_excluded_emp,
                    total_bonus_esic,
                    total_overtime_esic,
                    total_incentive_esic,
                    total_employee_contribution,
                    total_employer_contribution,
                    total_challan_amount: total_challan_amount,
                    created_at: Date.now(),
                  };
                }
                Challans.create(document, function (err, challan_data) {
                  if (err)
                    return resp
                      .status(200)
                      .send({ status: "error", message: err.message });
                  return resp.status(200).send({
                    status: "success",
                    message: "Reference file generated successfully",
                    challan_data: challan_data,
                  });
                });
              }
            });
          } else {
            return resp
              .status(200)
              .json({ status: "success", message: "Nothing to generate." });
          }
        });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_challan_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        pageno: "required",
        challan_for: "required|in:pf,esic",
        challan_type: "required|in:ARREAR,ECR",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var sortoption = { created_at: -1 };
        const options = {
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : perpage,
          sort: sortoption,
        };
        var filter_option = {
          corporate_id: req.authData.corporate_id,
          challan_for: req.body.challan_for,
          challan_type: req.body.challan_type,
        };
        if (req.body.searchkeyword) {
          filter_option.file_id = {
            $regex: req.body.searchkeyword,
            $options: "i",
          };
        }
        Challans.paginate(filter_option, options, function (err, challan) {
          if (err)
            return resp.json({ status: "error", message: "no data found" });
          return resp
            .status(200)
            .json({ status: "success", challan_data: challan });
        });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  download_challan_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        challan_id: "required",
        type: "required|in:view,download",
        file_type: "required|in:text,excel",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(403).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var challandata = await Challans.findOne({
          _id: mongoose.Types.ObjectId(req.body.challan_id),
        });
        if (challandata) {
          if (req.body.file_type == "excel") {
            file_path = challandata.xlsx_file_name;
          } else {
            file_path = challandata.text_file_name;
          }
          var dir = absolutePath + "/" + file_path;
          if (fs.existsSync(dir)) {
            await Site_helper.driect_download(
              file_path,
              req.authData.corporate_id,
              resp
            );
          } else {
            return resp.status(200).json({
              status: "success",
              message: "File not exist in our server.",
            });
          }
        } else {
          return resp
            .status(200)
            .json({ status: "success", message: "Something went wrong." });
        }
      }
    } catch (e) {
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  delete_challan_ref_file: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        referance_file_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        Challans.findById(
          { _id: req.body.referance_file_id },
          async function (err, challan) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              if (challan) {
                var filePath = file_path + "/" + challan.xlsx_file_name;
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
                var filePath2 = file_path + "/" + challan.text_file_name;
                if (fs.existsSync(filePath2)) {
                  fs.unlinkSync(filePath2);
                }

                let where_condition = {
                  ["$and"]: [
                    { wage_month: challan.wage_month },
                    { wage_year: challan.wage_year },
                  ],
                };
                let update_data = {};

                var monthly_report = await EmployeeMonthlyReport.find({
                  $and: [
                    { wage_month: challan.wage_month },
                    { wage_year: challan.wage_year },
                    {
                      $or: [
                        {
                          [`salary_report.${challan.challan_for}_challan_referance_id`]:
                            challan.file_id,
                        },
                        {
                          [`ot_report.${challan.challan_for}_challan_referance_id`]:
                            challan.file_id,
                        },
                        {
                          [`incentive_report.${challan.challan_for}_challan_referance_id`]:
                            challan.file_id,
                        },
                        {
                          [`supplement_salary_report.${challan.challan_for}_challan_referance_id`]:
                            challan.file_id,
                        },
                        {
                          [`bonus_report.${challan.challan_for}_challan_referance_id`]:
                            challan.file_id,
                        },
                        {
                          [`arrear_report.${challan.challan_for}_challan_referance_id`]:
                            challan.file_id,
                        },
                      ],
                    },
                  ],
                });

                if (monthly_report && monthly_report.length) {
                  const master_sheet_types = [
                    "salary_report",
                    "ot_report",
                    "incentive_report",
                    "supplement_salary_report",
                    "bonus_report",
                    "arrear_report",
                  ];
                  const sheet_types =
                    challan.sheet_type == "earning"
                      ? master_sheet_types
                      : [challan.sheet_type + "_report"];

                  for (const report of monthly_report) {
                    const update_data = {};

                    const where_condition = {
                      ["$and"]: [
                        { _id: report._id },
                        { wage_month: challan.wage_month },
                        { wage_year: challan.wage_year },
                      ],
                    };
                    for (const type of sheet_types) {
                      const sheet_type =
                        type +
                        "." +
                        challan.challan_for +
                        "_challan_referance_id";
                      const challanVar =
                        challan.challan_for + "_challan_referance_id";
                      if (
                        report[type] &&
                        report[type][challanVar] &&
                        report[type][challanVar] == challan?.file_id
                      ) {
                        where_condition["$and"].push({
                          [sheet_type]: challan?.file_id,
                        });
                        update_data[sheet_type] = "";
                        update_data[
                          type + "." + challan.challan_for + "_generate"
                        ] = "no";
                      }
                    }
                    const updated_value = await EmployeeMonthlyReport.updateOne(
                      where_condition,
                      { $set: update_data }
                    );
                  }
                }

                if (challan.challan_type == "ARREAR") {
                  // if (challan.challan_for == "pf") {

                  // } else {
                  //   where_condition = {
                  //     "consolidated_arrear_report.esic_challan_referance_id":
                  //       challan.file_id,
                  //     revision_month: challan.wage_month,
                  //     revision_year: challan.wage_year,
                  //   };
                  //   update_data = {
                  //     "consolidated_arrear_report.esic_challan_referance_id":
                  //       "",
                  //   };
                  // }

                  where_condition = {
                    [`consolidated_arrear_report.${challan.challan_for}_challan_referance_id`]:
                      challan.file_id,
                    revision_month: challan.wage_month,
                    revision_year: challan.wage_year,
                  };
                  update_data = {
                    [`consolidated_arrear_report.${challan.challan_for}_challan_referance_id`]:
                      "",
                  };

                  await RevisionReport.updateMany(
                    where_condition,
                    update_data,
                    {
                      multi: true,
                      upsert: true,
                    }
                  );
                }

                // if (challan.challan_type == "ECR") {
                // if (challan.sheet_type == "earning") {
                //   var monthly_report = await EmployeeMonthlyReport.findOne({
                //     $and:[
                //       {wage_month: challan.wage_month},
                //       {wage_year: challan.wage_year},
                //       {$or:[
                //       {"salary_report.pf_challan_referance_id": challan.file_id},
                //       {"ot_report.pf_challan_referance_id": challan.file_id},
                //       {"incentive_report.pf_challan_referance_id": challan.file_id},
                //       {"supplement_salary_report.pf_challan_referance_id": challan.file_id},
                //       {"bonus_report.pf_challan_referance_id": challan.file_id},
                //       {"arrear_report.pf_challan_referance_id": challan.file_id},
                //       ]}
                //     ]
                //   });
                //   if (challan.challan_for == "pf") {
                //     where_condition = {
                //       "total_data.pf_challan_referance_id": challan.file_id,
                //       wage_month: challan.wage_month,
                //       wage_year: challan.wage_year,
                //     };
                //     update_data = {
                //       "total_data.pf_challan_referance_id": "",
                //       pf_generate: "no",
                //     };
                //     if (monthly_report.salary_report) {
                //       update_data["salary_report.pf_challan_referance_id"] = "";
                //     }
                //     if (monthly_report.supplement_salary_report) {
                //       update_data[
                //         "supplement_salary_report.pf_challan_referance_id"
                //       ] = "";
                //     }
                //     if (monthly_report.incentive_report) {
                //       update_data["incentive_report.pf_challan_referance_id"] =
                //         "";
                //     }
                //     if (monthly_report.bonus_report) {
                //       update_data["bonus_report.pf_challan_referance_id"] = "";
                //     }
                //     if (monthly_report.ot_report) {
                //       update_data["ot_report.pf_challan_referance_id"] = "";
                //     }
                //     if (monthly_report.shift_allawance_report) {
                //       update_data[
                //         "shift_allawance_report.pf_challan_referance_id"
                //       ] = "";
                //     }
                //   } else {
                //     where_condition = {
                //       "total_data.esic_challan_referance_id": challan.file_id,
                //       wage_month: challan.wage_month,
                //       wage_year: challan.wage_year,
                //     };
                //     update_data = {
                //       "total_data.esic_challan_referance_id": "",
                //       esic_generate: "no",
                //     };
                //     if (monthly_report.salary_report) {
                //       update_data["salary_report.esic_challan_referance_id"] =
                //         "";
                //     }
                //     if (monthly_report.supplement_salary_report) {
                //       update_data[
                //         "supplement_salary_report.esic_challan_referance_id"
                //       ] = "";
                //     }
                //     if (monthly_report.incentive_report) {
                //       update_data[
                //         "incentive_report.esic_challan_referance_id"
                //       ] = "";
                //     }
                //     if (monthly_report.bonus_report) {
                //       update_data["bonus_report.esic_challan_referance_id"] =
                //         "";
                //     }
                //     if (monthly_report.ot_report) {
                //       update_data["ot_report.esic_challan_referance_id"] = "";
                //     }
                //     if (monthly_report.shift_allawance_report) {
                //       update_data[
                //         "shift_allawance_report.esic_challan_referance_id"
                //       ] = "";
                //     }
                //   }
                // }
                // else {
                // if (challan.challan_for == "pf") {
                //   var sheet_type = sheet_type + ".pf_challan_referance_id";
                //   where_condition = {
                //     wage_month: challan.wage_month,
                //     wage_year: challan.wage_year,
                //   };
                //   where_condition[sheet_type] = challan.file_id;
                //   update_data[sheet_type] = "";
                // } else {
                //   var sheet_type = sheet_type + ".esic_challan_referance_id";
                //   where_condition = {
                //     wage_month: challan.wage_month,
                //     wage_year: challan.wage_year,
                //   };
                //   where_condition[sheet_type] = challan.file_id;
                //   update_data[sheet_type] = "";
                // }
                // }
                // } else {

                // }

                challan.remove((err, challan) => {
                  if (err) {
                    return resp.status(200).json({
                      status: "error",
                      message: err ? err.message : "Something went wrong",
                    });
                  } else {
                    return resp.status(200).send({
                      status: "success",
                      message: "Referance file deleted successfully",
                      challan: challan,
                    });
                  }
                });
              }
            }
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
  challan_form_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        file_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        Challans.findOne(
          {
            file_id: req.body.file_id,
            corporate_id: req.authData.corporate_id,
          },
          async function (err, file_data) {
            if (err)
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            var company_data = await CompanyDetails.findOne(
              { company_id: req.authData.company_id },
              "details establishment reg_office_address"
            );
            return resp.status(200).json({
              status: "success",
              file_data: file_data,
              company_data: company_data,
            });
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
  confirm_pf_challan_payment: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        trrn: "required",
        ecr_id: "required",
        referance_file_id: "required",
        challan_details: "required",
        total_amount: "required",
        ecr_details: "required",
        payment_confirmation: "required",
        due_date: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        Challans.findOne(
          { _id: req.body.referance_file_id },
          async function (err, file_data) {
            if (err)
              return resp.json({ status: "error", message: "no data found" });
            //console.log(JSON.parse(req.body.challan_details))
            //return resp.json({ status: 'error', message: 'Challan Data not matched',asdasdasd:req.body.challan_details });
            if (file_data.total_challan_amount != req.body.total_amount) {
              return resp.json({
                status: "error",
                message: "Challan Data not matched",
              });
            } else {
              var document = {
                trrn: req.body.trrn,
                ecr_id: req.body.ecr_id,
                challan_details: JSON.parse(req.body.challan_details),
                ecr_details: JSON.parse(req.body.ecr_details),
                payment_confirmation: JSON.parse(req.body.payment_confirmation),
                due_date: req.body.due_date,
                status: "confirm",
                confirmation_log: "",
              };
              var obj = req.files;
              await Promise.all(
                obj.map(async (file) => {
                  if (file.fieldname === "challan_details_file") {
                    document["challan_details_file"] = file.path;
                  }
                  if (file.fieldname === "ecr_details_file") {
                    document["ecr_details_file"] = file.path;
                  }
                  if (file.fieldname === "payment_confirm_file") {
                    document["payment_confirm_file"] = file.path;
                  }
                })
              );

              Challans.updateOne(
                { _id: req.body.referance_file_id },
                document,
                async function (err, challan) {
                  if (err)
                    return resp.json({
                      status: "error",
                      message: err ? err.message : "no data found.",
                    });

                  return resp.status(200).json({
                    status: "success",
                    message: "Challan Data confirm Successfully",
                    challan_data: challan,
                  });
                }
              );
            }
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
  confirm_esic_challan_payment: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        empr_code: "required",
        empr_name: "required",
        challan_number: "required",
        total_amount: "required",
        challan_created: "required",
        challan_submited: "required",
        tran_number: "required",
        due_date: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        Challans.findOne(
          { _id: req.body.referance_file_id },
          async function (err, file_data) {
            if (err)
              return resp.json({ status: "error", message: "no data found" });
            //console.log(JSON.parse(req.body.challan_details))
            //return resp.json({ status: 'error', message: 'Challan Data not matched',asdasdasd:req.body.challan_details });
            if (file_data.total_challan_amount != req.body.total_amount) {
              return resp.json({
                status: "error",
                message: "Challan Data not matched",
              });
            } else {
              var document = {
                empr_code: req.body.empr_code,
                empr_name: req.body.empr_name,
                challan_number: req.body.challan_number,
                challan_created: req.body.challan_created,
                challan_submited: req.body.challan_submited,
                tran_number: req.body.tran_number,
                due_date: req.body.due_date,
                status: "confirm",
              };
              var obj = req.files;
              await Promise.all(
                obj.map(async (file) => {
                  if (file.fieldname === "esic_challan_details_file") {
                    document["esic_challan_details_file"] = file.path;
                  }
                })
              );
              Challans.updateOne(
                { _id: req.body.referance_file_id },
                document,
                function (err, challan) {
                  if (err)
                    return resp.json({
                      status: "error",
                      message: err ? err.message : "no data found.",
                    });
                  return resp.status(200).json({
                    status: "success",
                    message: "Challan Data confirm Successfully",
                    challan_data: challan,
                  });
                }
              );
            }
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
  get_compliance_report_emp_list: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
        pageno: "required",
        report_type: "required|in:pf,esic,pt,lwf",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
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

        const wage_month = parseInt(req.body.wage_month);
        const wage_year = parseInt(req.body.wage_year);
        const report_type = req.body.report_type;

        search_option_details.$match["$and"] = [
          { "employee_monthly_reports.wage_month": wage_month },
          { "employee_monthly_reports.wage_year": wage_year },
        ];

        search_option_details.$match["$and"].push({
          ["$or"]: [
            {
              [`employee_monthly_reports.salary_report.${report_type}_generate`]:
                { $exists: true, $eq: "yes" },
            },
            {
              [`employee_monthly_reports.ot_report.${report_type}_generate`]: {
                $exists: true,
                $eq: "yes",
              },
            },
            {
              [`employee_monthly_reports.bonus_report.${report_type}_generate`]:
                { $exists: true, $eq: "yes" },
            },
            {
              [`employee_monthly_reports.incentive_report.${report_type}_generate`]:
                { $exists: true, $eq: "yes" },
            },
            {
              [`employee_monthly_reports.supplement_salary_report.${report_type}_generate`]:
                { $exists: true, $eq: "yes" },
            },
            {
              [`employee_monthly_reports.arrear_report.${report_type}_generate`]:
                { $exists: true, $eq: "yes" },
            },
          ],
        });
        const reports = [
          "salary_report",
          "ot_report",
          "incentive_report",
          "bonus_report",
          "arrear_report",
          "supplement_salary_report",
        ];

        add_fields = {
          $addFields: {
            employee_monthly_report: {
              $arrayElemAt: ["$employee_monthly_reports", 0],
            },
            gross_earning_amount: { $sum: [] },
            epf_wages: { $sum: [] },
            eps_wages: { $sum: [] },
            edli_wages: { $sum: [] },
            ee_pf_amount: { $sum: [] },
            er_pf_amount: { $sum: [] },
            er_eps_amount: { $sum: [] },
            edli_amount: { $sum: [] },
            admin_epf_amount: { $sum: [] },
            total_ee_amount: { $sum: [] },
            total_er_amount: { $sum: [] },
            total_esic_bucket: { $sum: [] },
            esic_wages: { $sum: [] },
            ee_esic_amount: { $sum: [] },
            er_esic_amount: { $sum: [] },
          },
        };

        for (const report of reports) {
          add_fields.$addFields.gross_earning_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.gross_earning`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.epf_wages.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.total_pf_wages`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.eps_wages.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.eps_wages`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.edli_wages.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.edlis_wages`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.ee_pf_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.pf_data.emoloyee_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.er_pf_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.pf_data.emoloyer_pf_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.er_eps_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.pf_data.emoloyer_eps_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.edli_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.pf_data.emoloyer_edlis_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.admin_epf_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.pf_data.emoloyer_epf_admin_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.total_ee_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.pf_data.emoloyee_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.total_er_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.pf_data.total_employer_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.total_esic_bucket.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.total_esic_bucket`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.esic_wages.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.total_esic_wages`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.ee_esic_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.esic_data.emoloyee_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
          add_fields.$addFields.er_esic_amount.$sum.push({
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.${report_type}_generate`,
                      0,
                    ],
                  },
                  "yes",
                ],
              },
              then: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      `$employee_monthly_reports.${report}.esic_data.emoloyer_contribution`,
                      0,
                    ],
                  },
                  0,
                ],
              },
              else: 0,
            },
          });
        }

        if (req.body.generate == "excel") {
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
              from: "companies",
              localField: "corporate_id",
              foreignField: "corporate_id",
              as: "companies",
            },
          },
          {
            $lookup: {
              from: "company_details",
              localField: "companies._id",
              foreignField: "company_id",
              as: "company_details",
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
                      { wage_month: wage_month },
                      { wage_year: wage_year },
                    ],
                  },
                },
              ],
              as: "employee_monthly_reports",
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
              from: "clients",
              localField: "employee_details.employment_hr_details.client",
              foreignField: "_id",
              as: "client",
            },
          },
          search_option_details,
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              company: {
                $arrayElemAt: ["$companies", 0],
              },
              designation: {
                $arrayElemAt: ["$designation", 0],
              },
              department: {
                $arrayElemAt: ["$department", 0],
              },
              client: {
                $arrayElemAt: ["$client", 0],
              },
            },
          },
          add_fields,
          {
            $unwind: "$company_details",
          },
          {
            $addFields: {
              branch: {
                $filter: {
                  input: "$company_details.company_branch",
                  as: "branch_item",
                  cond: {
                    $eq: [
                      "$employee_details.employment_hr_details.branch",
                      "$$branch_item._id",
                    ],
                  },
                },
              },
            },
          },
          {
            $unwind: "$branch",
          },
          {
            $project: {
              _id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              emp_id: 1,
              corporate_id: 1,
              company_name: "$company.establishment_name",
              branch: 1,
              paydays: "$employee_monthly_report.attendance_summaries.paydays",
              doj: "$employee_details.employment_hr_details.date_of_join",
              emp_uan_no: "$employee_monthly_report.emp_data.emp_uan_no",
              esic_no: "$employee_monthly_report.emp_data.esic_no",
              esic_covered: {
                $ifNull: [
                  "$employee_details.employment_hr_details.esic_covered",
                  "no",
                ],
              },
              total_lop:
                "$employee_monthly_report.attendance_summaries.total_lop",
              employee_monthly_report: "$employee_monthly_report",
              gross_earning_amount: 1,
              epf_wages: 1,
              eps_wages: 1,
              edli_wages: 1,
              ee_pf_amount: 1,
              er_pf_amount: 1,
              er_eps_amount: 1,
              edli_amount: 1,
              admin_epf_amount: 1,
              total_ee_amount: 1,
              total_er_amount: 1,
              total_esic_bucket: 1,
              esic_wages: 1,
              ee_esic_amount: 1,
              er_esic_amount: 1,
              designation: "$designation.designation_name",
              department: "$department.department_name",
              client: 1,
            },
          },
        ]);
        if (req.body.generate == "excel") {
          myAggregate
            .then((employees) => {
              if (employees.length) {
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");

                if (req.body.report_type == "pf") {
                  var instructionsheet_xlsx =
                    "storage/company/temp_files/" +
                    req.authData.corporate_id +
                    "/pf_report/" +
                    req.authData.corporate_id +
                    "-pf.xlsx";
                  ws.cell(3, 1).string("SL. NO.");
                  ws.cell(3, 2).string("Emp ID");
                  ws.cell(3, 3).string("Employee Name");
                  ws.cell(3, 4).string("UAN No");
                  ws.cell(3, 5).string("Member Id");
                  ws.cell(3, 6).string("NCP Days");
                  ws.cell(3, 7).string("Gross");
                  ws.cell(3, 8).string("EPF Wage");
                  ws.cell(3, 9).string("EPS Wage");
                  ws.cell(3, 10).string("EDLI Wage");
                  ws.cell(3, 11).string("EE EPF");
                  ws.cell(3, 12).string("ER EPF");
                  ws.cell(3, 13).string("ER EPS");
                  ws.cell(3, 14).string("EDLI");
                  ws.cell(3, 15).string("Total EE");
                  ws.cell(3, 16).string("Total ER");

                  ws.cell(1, 1, 1, 16, true).string(
                    employees[0]?.company_name || ""
                  );
                  ws.cell(2, 1, 2, 16, true).string(
                    `${
                      report_type == "pf" ? "EPFO" : "ESIC"
                    } report for the Wage Month : ${wage_month}-${wage_year}`
                  );
                  var no_of_epf = 0;
                  var no_of_eps = 0;
                  var no_of_edli = 0;
                  var total_gross = 0;
                  var total_ee_con = 0;
                  var total_er_con = 0;
                  var total_edli = 0;
                  var total_admin = 0;
                  var total_ac1 = 0;
                  var total_ac2 = 0;
                  var total_ac10 = 0;
                  var total_ac21 = 0;
                  var total_ac22 = 0;
                } else if (req.body.report_type == "esic") {
                  var instructionsheet_xlsx =
                    "storage/company/temp_files/" +
                    req.authData.corporate_id +
                    "/esic_report/" +
                    req.authData.corporate_id +
                    "-esic.xlsx";
                  ws.cell(3, 1).string("SL. NO.");
                  ws.cell(3, 2).string("CLIENT");
                  ws.cell(3, 3).string("Estt. Code");
                  ws.cell(3, 4).string("Employee ID");
                  ws.cell(3, 5).string("Employee Name");
                  ws.cell(3, 6).string("ESI No.");
                  ws.cell(3, 7).string("Branch");
                  ws.cell(3, 8).string("Designation");
                  ws.cell(3, 9).string("Department");
                  ws.cell(3, 10).string("D.O.J");
                  ws.cell(3, 11).string("Status");
                  ws.cell(3, 12).string("ESIC Wages");
                  ws.cell(3, 13).string("Non ESIC Wages");
                  ws.cell(3, 14).string("ESIC Variable");
                  ws.cell(3, 15).string("Non ESIC Variable");
                  ws.cell(3, 16).string("Paid Days");
                  ws.cell(3, 17).string("Employees Contribution");
                  ws.cell(3, 18).string("Employers Contribution");
                  ws.cell(3, 19).string("Total Contribution");

                  ws.cell(1, 1, 1, 19, true).string(
                    employees[0]?.company_name || ""
                  );
                  ws.cell(2, 1, 2, 19, true).string(
                    `${
                      report_type == "pf" ? "EPFO" : "ESIC"
                    } report for the Wage Month : ${wage_month}-${wage_year}`
                  );
                }

                var row_counter = 3;
                var sl_no = 0;

                for (const employee of employees) {
                  sl_no++;
                  row_counter++;
                  if (req.body.report_type == "pf") {
                    ws.cell(row_counter, 1).string(sl_no.toString());
                    ws.cell(row_counter, 2).string(employee.emp_id.toString());
                    ws.cell(row_counter, 3).string(
                      employee.emp_first_name +
                        " " +
                        employee.emp_last_name.toString()
                    );
                    ws.cell(row_counter, 4).string(
                      employee.emp_uan_no.toString()
                    );
                    ws.cell(row_counter, 5).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.branch.epf_registration_no
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 6).string(
                      employee.emp_uan_no != "NA"
                        ? (employee?.total_lop || 0).toString()
                        : "NA"
                    );
                    ws.cell(row_counter, 7).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.gross_earning_amount.toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 8).string(
                      (employee.emp_uan_no != "NA"
                        ? Math.round(employee.epf_wages || 0).toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 9).string(
                      (employee.emp_uan_no != "NA"
                        ? Math.round(employee.eps_wages || 0).toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 10).string(
                      (employee.emp_uan_no != "NA"
                        ? Math.round(employee.edli_wages || 0).toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 11).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.ee_pf_amount.toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 12).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.er_pf_amount.toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 13).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.er_eps_amount.toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 14).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.edli_amount.toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 15).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.total_ee_amount.toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    ws.cell(row_counter, 16).string(
                      (employee.emp_uan_no != "NA"
                        ? employee.total_er_amount.toFixed(2)
                        : "NA"
                      ).toString()
                    );
                    if (employee.emp_uan_no != "NA") {
                      no_of_epf++;
                      // no_of_edli++;
                      total_gross =
                        total_gross + parseFloat(employee.gross_earning_amount);
                      total_ee_con =
                        total_ee_con + parseFloat(employee.total_ee_amount);
                      total_er_con =
                        total_er_con + parseFloat(employee.total_er_amount);
                      total_edli =
                        total_edli + parseFloat(employee.edli_amount);
                      total_admin =
                        total_admin + parseFloat(employee.admin_epf_amount);

                      if (employee.er_eps_amount) {
                        no_of_eps++;
                      }
                      if (employee.edli_amount) {
                        no_of_edli++;
                      }
                    }
                  } else if (req.body.report_type == "esic") {
                    ws.cell(row_counter, 1).string(sl_no.toString());
                    ws.cell(row_counter, 2).string(
                      employee.company_name.toString()
                    );
                    ws.cell(row_counter, 3).string(
                      employee.branch.esic_registration_no.toString()
                    );
                    ws.cell(row_counter, 4).string(employee.emp_id.toString());
                    ws.cell(row_counter, 5).string(
                      employee.emp_first_name +
                        " " +
                        employee.emp_last_name.toString()
                    );
                    ws.cell(row_counter, 6).string(employee.esic_no.toString());
                    ws.cell(row_counter, 7).string(
                      employee.branch.branch_name.toString()
                    );
                    ws.cell(row_counter, 8).string(
                      employee.designation.toString()
                    );
                    ws.cell(row_counter, 9).string(
                      employee.department.toString()
                    );
                    ws.cell(row_counter, 10).string(employee.doj.toString());
                    ws.cell(row_counter, 11).string(
                      (employee.esic_covered == "yes"
                        ? "Covered"
                        : "Out of Coverage"
                      ).toString()
                    );
                    ws.cell(row_counter, 12).string(
                      (employee.esic_covered == "yes"
                        ? employee.esic_wages.toFixed(2)
                        : 0
                      ).toString()
                    );
                    ws.cell(row_counter, 13).string(
                      (employee.esic_covered == "no"
                        ? employee.esic_wages.toFixed(2)
                        : 0
                      ).toString()
                    );
                    ws.cell(row_counter, 14).string(
                      (employee.esic_covered == "yes"
                        ? employee.esic_wages.toFixed(2)
                        : ""
                      ).toString()
                    );
                    ws.cell(row_counter, 15).string(
                      (employee.esic_covered == "yes"
                        ? (
                            parseFloat(employee.total_esic_bucket) -
                            parseFloat(employee.esic_wages)
                          ).toFixed(2)
                        : ""
                      ).toString()
                    );
                    ws.cell(row_counter, 16).string(
                      employee.paydays.toString()
                    );
                    ws.cell(row_counter, 17).string(
                      employee.ee_esic_amount.toFixed(2).toString()
                    );
                    ws.cell(row_counter, 18).string(
                      employee.er_esic_amount.toFixed(2).toString()
                    );
                    ws.cell(row_counter, 19).string(
                      (
                        parseFloat(employee.ee_esic_amount) +
                        parseFloat(employee.er_esic_amount)
                      )
                        .toFixed(2)
                        .toString()
                    );
                  }
                }

                if (req.body.report_type == "pf") {
                  ws.cell(row_counter + 2, 4).string("Number of Members EPF");
                  ws.cell(row_counter + 3, 4).string("Number of Members EPS");
                  ws.cell(row_counter + 4, 4).string("Number of Members EDLI");

                  ws.cell(row_counter + 2, 5).string(no_of_epf.toString());
                  ws.cell(row_counter + 3, 5).string(no_of_eps.toString());
                  ws.cell(row_counter + 4, 5).string(no_of_edli.toString());

                  ws.cell(row_counter + 2, 6).string("Total Gross");
                  ws.cell(row_counter + 3, 6).string("Total EE");
                  ws.cell(row_counter + 4, 6).string("Total ER");
                  ws.cell(row_counter + 5, 6).string("Total EDLI");
                  ws.cell(row_counter + 6, 6).string("Total Admin");

                  ws.cell(row_counter + 2, 7).string(total_gross.toString());
                  ws.cell(row_counter + 3, 7).string(total_ee_con.toString());
                  ws.cell(row_counter + 4, 7).string(total_er_con.toString());
                  ws.cell(row_counter + 5, 7).string(total_edli.toString());
                  ws.cell(row_counter + 6, 7).string(total_admin.toString());
                }

                let file_name =
                  req.authData.corporate_id +
                  "-" +
                  report_type +
                  "-internal-compliance-report.xlsx";
                let file = Site_helper.createFiles(
                  wb,
                  file_name,
                  req.authData.corporate_id,
                  "temp_files/payment-compliance-module"
                );
                Site_helper.downloadAndDelete(
                  file.file_name,
                  file.location,
                  req.authData.corporate_id,
                  resp
                );
              } else {
                return resp.status(200).send({
                  status: "success",
                  message: "Nothing to download",
                  employees,
                });
              }
            })
            .catch((err) => {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
            });
        } else {
          Employee.aggregatePaginate(
            myAggregate,
            options,
            async function (err, report_data) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "",
                report_data: report_data,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  // get_compliance_report_emp_list: async function (req, resp) {
  //   try {
  //     const v = new Validator(req.body, {
  //       wage_month: "required",
  //       wage_year: "required",
  //       pageno: "required",
  //       report_type: "required|in:pf,esic,pt,lwf",
  //     });
  //     const matched = await v.check();
  //     if (!matched) {
  //       return resp.status(200).send({
  //         status: "val_err",
  //         message: "Validation error",
  //         val_msg: v.errors,
  //       });
  //     } else {
  //       var wage_month = req.body.wage_month;
  //       var wage_year = req.body.wage_year;

  //       var start_month = parseInt(req.body.wage_month_from);
  //       var start_year = parseInt(req.body.wage_year_from);
  //       var end_month = parseInt(req.body.wage_month_to);
  //       var end_year = parseInt(req.body.wage_year_to);

  //       var sortbyfield = req.body.sortbyfield;
  //       if (sortbyfield) {
  //         var sortoption = {};
  //         sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
  //       } else {
  //         var sortoption = { created_at: -1 };
  //       }
  //       const options = {
  //         page: req.body.pageno,
  //         limit: req.body.perpage ? req.body.perpage : perpage,
  //         sort: sortoption,
  //       };
  //       var filter_option = {};
  //       var document = {};
  //       var search_option = {
  //         $match: {
  //           $and: [
  //             { corporate_id: req.authData.corporate_id },
  //             { parent_hods: { $in: [req.authData.user_id] } },
  //             { approval_status: "approved" },
  //           ],
  //         },
  //       };
  //       var search_option_details = { $match: {} };
  //       if (req.body.searchkey) {
  //         search_option = {
  //           $match: {
  //             $text: { $search: req.body.searchkey },
  //             corporate_id: req.authData.corporate_id,
  //           },
  //         };
  //       } else {
  //         var query_data = await Site_helper.getEmpFilterData(
  //           req,
  //           search_option,
  //           search_option_details
  //         );
  //         search_option_details = query_data.search_option_details;
  //         search_option = query_data.search_option;
  //       }
  //       if (req.body.report_type != "pt") {
  //         search_option_details.$match["$and"] = [
  //           {"employee_monthly_reports.wage_month":parseInt(wage_month)},
  //           {"employee_monthly_reports.wage_year":parseInt(wage_year)}
  //         ]
  //         // search_option_details.$match["employee_monthly_reports.wage_month"] =
  //         //   parseInt(wage_month);
  //         // search_option_details.$match["employee_monthly_reports.wage_year"] =
  //         //   parseInt(wage_year);
  //       }
  //       if (req.body.report_type == "esic") {
  //         search_option_details.$match["$and"].push({
  //           ["$or"]: [
  //             {"employee_monthly_reports.salary_report.esic_generate":{$exists:true, $eq:"yes"}},
  //             {"employee_monthly_reports.ot_report.esic_generate":{$exists:true, $eq:"yes"}},
  //             {"employee_monthly_reports.bonus_report.esic_generate":{$exists:true, $eq:"yes"}},
  //             {"employee_monthly_reports.incentive_report.esic_generate":{$exists:true, $eq:"yes"}},
  //             {"employee_monthly_reports.supplement_salary_report.esic_generate":{$exists:true, $eq:"yes"}},
  //             {"employee_monthly_reports.arrear_report.esic_generate":{$exists:true, $eq:"yes"}}
  //           ]
  //         })
  //         var select_val = {
  //           paydays: "$employee_monthly_reports.attendance_summaries.paydays",
  //           designation: "$designation.designation_name",
  //           branch: "$branch",
  //           department: "$department.department_name",
  //           doj: "$employee_details.employment_hr_details.date_of_join",
  //           esic_no:
  //             "$employee_details.pf_esic_details.curr_er_esic_details.esic_no",
  //           esic_covered: {
  //             $ifNull: [
  //               "$employee_details.employment_hr_details.esic_covered",
  //               "no",
  //             ],
  //           },
  //           employee_monthly_reports: "$employee_monthly_reports.total_data",
  //         };
  //       } else if (req.body.report_type == "pf") {
  //         search_option_details.$match["$and"].push({
  //           ["$or"]: [
  //           {"employee_monthly_reports.salary_report.pf_generate":{$exists:true, $eq:"yes"}},
  //           {"employee_monthly_reports.ot_report.pf_generate":{$exists:true, $eq:"yes"}},
  //           {"employee_monthly_reports.bonus_report.pf_generate":{$exists:true, $eq:"yes"}},
  //           {"employee_monthly_reports.incentive_report.pf_generate":{$exists:true, $eq:"yes"}},
  //           {"employee_monthly_reports.supplement_salary_report.pf_generate":{$exists:true, $eq:"yes"}},
  //           {"employee_monthly_reports.arrear_report.pf_generate":{$exists:true, $eq:"yes"}}
  //         ]
  //         })
  //         // search_option_details.$match["employee_monthly_reports.pf_generate"] =
  //         //   "yes";
  //         var select_val = {
  //           total_lop: "$employee_monthly_reports.attendance_summaries.total_lop",
  //           branch: "$branch",
  //           employee_monthly_reports: "$employee_monthly_reports",
  //         };
  //       } else if (req.body.report_type == "pt") {
  //         var select_val = {
  //           total_lop:
  //             "$employee_monthly_reports.attendance_summaries.total_lop",
  //           branch: "$branch",
  //           department: "$department.department_name",
  //           designation: "$designation.designation_name",
  //           client: "$client.client_name",
  //           hod: {
  //             $concat: ["$hod.first_name", " ", "$hod.first_name"],
  //           },
  //           total_pt_wages: {
  //             $ifNull: [
  //               {
  //                 $sum: "$employee_monthly_reports.salary_report.total_pt_wages",
  //               },
  //               0,
  //             ],
  //           },
  //           pt_amount: {
  //             $ifNull: [
  //               { $sum: "$employee_monthly_reports.salary_report.pt_amount" },
  //               0,
  //             ],
  //           },
  //         };
  //       }
  //       var monthlyAddfield = {
  //         $addFields: {
  //           hod: {
  //             $arrayElemAt: ["$hod", 0],
  //           },
  //         },
  //       };
  //       if (req.body.report_type == "pt") {
  //         var employee_monthly_reports_filter = {
  //           $lookup: {
  //             from: "employee_monthly_reports",
  //             let: { emp_db_idVar: "$_id" },
  //             pipeline: [
  //               {
  //                 $match: {
  //                   $and: [
  //                     { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
  //                     { salary_report: { $exists: true, $ne: null } },
  //                     // {'extra_earning_report.bank_ins_referance_id' : { $ne: '' }},
  //                     {
  //                       $or: [
  //                         { wage_year: { $gt: start_year } },
  //                         {
  //                           $and: [
  //                             { wage_year: { $gte: start_year } },
  //                             { wage_month: { $gte: start_month } },
  //                           ],
  //                         },
  //                       ],
  //                     },
  //                     {
  //                       $or: [
  //                         { wage_year: { $lt: end_year } },
  //                         {
  //                           $and: [
  //                             { wage_year: { $lte: end_year } },
  //                             { wage_month: { $lte: end_month } },
  //                           ],
  //                         },
  //                       ],
  //                     },
  //                   ],
  //                 },
  //               },
  //             ],
  //             as: "employee_monthly_reports",
  //           },
  //         };
  //       } else {
  //         var employee_monthly_reports_filter = {
  //           $lookup: {
  //             from: "employee_monthly_reports",
  //             localField: "_id",
  //             foreignField: "emp_db_id",
  //             as: "employee_monthly_reports",
  //           },
  //         };
  //         monthlyAddfield = {
  //           $addFields: {
  //             hod: {
  //               $arrayElemAt: ["$hod", 0],
  //             },
  //             employee_monthly_reports: {
  //               $arrayElemAt: ["$employee_monthly_reports", 0],
  //             },
  //           },
  //         };
  //       }
  //       var myAggregate = Employee.aggregate([
  //         search_option,
  //         {
  //           $lookup: {
  //             from: "employee_details",
  //             localField: "_id",
  //             foreignField: "employee_id",
  //             as: "employee_details",
  //           },
  //         },
  //         employee_monthly_reports_filter,
  //         {
  //           $lookup: {
  //             from: "companies",
  //             localField: "corporate_id",
  //             foreignField: "corporate_id",
  //             as: "companies",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "company_details",
  //             localField: "companies._id",
  //             foreignField: "company_id",
  //             as: "company_details",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "designations",
  //             localField: "employee_details.employment_hr_details.designation",
  //             foreignField: "_id",
  //             as: "designation",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "departments",
  //             localField: "employee_details.employment_hr_details.department",
  //             foreignField: "_id",
  //             as: "department",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "clients",
  //             localField: "employee_details.employment_hr_details.client",
  //             foreignField: "_id",
  //             as: "client",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "staffs",
  //             localField: "emp_hod",
  //             foreignField: "_id",
  //             as: "hod",
  //           },
  //         },
  //         search_option_details,
  //         {
  //           $addFields: {
  //             employee_details: {
  //               $arrayElemAt: ["$employee_details", 0],
  //             },
  //             company: {
  //               $arrayElemAt: ["$companies", 0],
  //             },
  //             designation: {
  //               $arrayElemAt: ["$designation", 0],
  //             },
  //             department: {
  //               $arrayElemAt: ["$department", 0],
  //             },
  //             client: {
  //               $arrayElemAt: ["$client", 0],
  //             },
  //             // "hod": {
  //             //   "$arrayElemAt": [ "$hod", 0 ]
  //             // }
  //           },
  //         },
  //         monthlyAddfield,
  //         {
  //           $unwind: "$company_details",
  //         },
  //         {
  //           $addFields: {
  //             branch: {
  //               $filter: {
  //                 input: "$company_details.company_branch",
  //                 as: "branch_item",
  //                 cond: {
  //                   $eq: [
  //                     "$employee_details.employment_hr_details.branch",
  //                     "$$branch_item._id",
  //                   ],
  //                 },
  //               },
  //             },
  //           },
  //         },
  //         {
  //           $unwind: "$branch",
  //         },
  //         {
  //           $project: {
  //             _id: 1,
  //             emp_first_name: 1,
  //             emp_last_name: 1,
  //             emp_id: 1,
  //             corporate_id: 1,
  //             company_name: "$company.establishment_name",
  //             UAN_no: {
  //               $ifNull: [
  //                 "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
  //                 null,
  //               ],
  //             },
  //             report_data: select_val,
  //           },
  //         },
  //       ]);
  //       Employee.aggregatePaginate(
  //         myAggregate,
  //         options,
  //         async function (err, report_data) {
  //           if (err)
  //             return resp
  //               .status(200)
  //               .send({ status: "error", message: err.message });
  //           return resp.status(200).send({
  //             status: "success",
  //             message: "",
  //             report_data: report_data,
  //           });
  //         }
  //       );
  //     }
  //   } catch (e) {
  //     return resp.status(200).json({
  //       status: "error",
  //       message: e ? e.message : "Something went wrong",
  //     });
  //   }
  // },
  // get_compliance_report_export_file: async function (req, resp) {
  //   try {
  //     const v = new Validator(req.body, {
  //       wage_month: "required",
  //       wage_year: "required",
  //       pageno: "required",
  //       report_type: "required|in:pf,esic,pt,lwf",
  //     });
  //     const matched = await v.check();
  //     if (!matched) {
  //       return resp.status(403).send({
  //         status: "val_err",
  //         message: "Validation error",
  //         val_msg: v.errors,
  //       });
  //     } else {
  //       var wage_month = req.body.wage_month;
  //       var wage_year = req.body.wage_year;
  //       var start_month = parseInt(req.body.wage_month_from);
  //       var start_year = parseInt(req.body.wage_year_from);
  //       var end_month = parseInt(req.body.wage_month_to);
  //       var end_year = parseInt(req.body.wage_year_to);

  //       var sortbyfield = req.body.sortbyfield;
  //       if (sortbyfield) {
  //         var sortoption = {};
  //         sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
  //       } else {
  //         var sortoption = { created_at: -1 };
  //       }
  //       const options = {
  //         page: req.body.pageno,
  //         limit: req.body.perpage ? req.body.perpage : perpage,
  //         sort: sortoption,
  //       };
  //       var filter_option = {};
  //       var document = {};
  //       var search_option = {
  //         $match: {
  //           $and: [
  //             { corporate_id: req.authData.corporate_id },
  //             { parent_hods: { $in: [req.authData.user_id] } },
  //             { approval_status: "approved" },
  //           ],
  //         },
  //       };
  //       var search_option_details = { $match: {} };
  //       if (req.body.searchkey) {
  //         search_option = {
  //           $match: {
  //             $text: { $search: req.body.searchkey },
  //             corporate_id: req.authData.corporate_id,
  //           },
  //         };
  //       } else {
  //         var query_data = await Site_helper.getEmpFilterData(
  //           req,
  //           search_option,
  //           search_option_details
  //         );
  //         search_option_details = query_data.search_option_details;
  //         search_option = query_data.search_option;
  //       }
  //       if (req.body.report_type != "pt") {
  //         search_option_details.$match["employee_monthly_reports.wage_month"] =
  //           parseInt(wage_month);
  //         search_option_details.$match["employee_monthly_reports.wage_year"] =
  //           parseInt(wage_year);
  //       }
  //       if (req.body.report_type == "esic") {
  //         search_option_details.$match[
  //           "employee_monthly_reports.esic_generate"
  //         ] = "yes";
  //         var select_val = {
  //           paydays: "$employee_monthly_reports.attendance_summaries.paydays",
  //           designation: "$designation.designation_name",
  //           branch: "$branch",
  //           department: "$department.department_name",
  //           doj: "$employee_details.employment_hr_details.date_of_join",
  //           esic_no:
  //             "$employee_details.pf_esic_details.curr_er_esic_details.esic_no",
  //           esic_covered: {
  //             $ifNull: [
  //               "$employee_details.employment_hr_details.esic_covered",
  //               "no",
  //             ],
  //           },
  //           employee_monthly_reports: "$employee_monthly_reports.total_data",
  //         };
  //       } else if (req.body.report_type == "pf") {
  //         search_option_details.$match["employee_monthly_reports.pf_generate"] =
  //           "yes";
  //         var select_val = {
  //           total_lop:
  //             "$employee_monthly_reports.attendance_summaries.total_lop",
  //           branch: "$branch",
  //           employee_monthly_reports: "$employee_monthly_reports.total_data",
  //         };
  //       } else if (req.body.report_type == "pt") {
  //         var select_val = {
  //           total_lop:
  //             "$employee_monthly_reports.attendance_summaries.total_lop",
  //           branch: "$branch",
  //           department: "$department.department_name",
  //           designation: "$designation.designation_name",
  //           client: "$client.client_name",
  //           hod: {
  //             $concat: ["$hod.first_name", " ", "$hod.first_name"],
  //           },
  //           total_pt_wages: {
  //             $ifNull: [
  //               {
  //                 $sum: "$employee_monthly_reports.salary_report.total_pt_wages",
  //               },
  //               0,
  //             ],
  //           },
  //           pt_amount: {
  //             $ifNull: [
  //               { $sum: "$employee_monthly_reports.salary_report.pt_amount" },
  //               0,
  //             ],
  //           },
  //           employee_monthly_reports: "$employee_monthly_reports",
  //         };
  //       }

  //       if (req.body.row_checked_all === "true") {
  //         var ids = JSON.parse(req.body.unchecked_row_ids);
  //         if (ids.length > 0) {
  //           ids = ids.map(function (el) {
  //             return mongoose.Types.ObjectId(el);
  //           });
  //           search_option.$match._id = { $nin: ids };
  //         }
  //       } else {
  //         var ids = JSON.parse(req.body.checked_row_ids);
  //         if (ids.length > 0) {
  //           ids = ids.map(function (el) {
  //             return mongoose.Types.ObjectId(el);
  //           });
  //           search_option.$match._id = { $in: ids };
  //         }
  //       }
  //       var monthlyAddfield = {
  //         $addFields: {
  //           hod: {
  //             $arrayElemAt: ["$hod", 0],
  //           },
  //         },
  //       };
  //       if (req.body.report_type == "pt") {
  //         var employee_monthly_reports_filter = {
  //           $lookup: {
  //             from: "employee_monthly_reports",
  //             let: { emp_db_idVar: "$_id" },
  //             pipeline: [
  //               {
  //                 $match: {
  //                   $and: [
  //                     { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
  //                     { salary_report: { $exists: true, $ne: null } },
  //                     // {'extra_earning_report.bank_ins_referance_id' : { $ne: '' }},
  //                     {
  //                       $or: [
  //                         { wage_year: { $gt: start_year } },
  //                         {
  //                           $and: [
  //                             { wage_year: { $gte: start_year } },
  //                             { wage_month: { $gte: start_month } },
  //                           ],
  //                         },
  //                       ],
  //                     },
  //                     {
  //                       $or: [
  //                         { wage_year: { $lt: end_year } },
  //                         {
  //                           $and: [
  //                             { wage_year: { $lte: end_year } },
  //                             { wage_month: { $lte: end_month } },
  //                           ],
  //                         },
  //                       ],
  //                     },
  //                   ],
  //                 },
  //               },
  //             ],
  //             as: "employee_monthly_reports",
  //           },
  //         };
  //       } else {
  //         var employee_monthly_reports_filter = {
  //           $lookup: {
  //             from: "employee_monthly_reports",
  //             localField: "_id",
  //             foreignField: "emp_db_id",
  //             as: "employee_monthly_reports",
  //           },
  //         };
  //         monthlyAddfield = {
  //           $addFields: {
  //             hod: {
  //               $arrayElemAt: ["$hod", 0],
  //             },
  //             employee_monthly_reports: {
  //               $arrayElemAt: ["$employee_monthly_reports", 0],
  //             },
  //           },
  //         };
  //       }

  //       var myAggregate = Employee.aggregate([
  //         search_option,
  //         {
  //           $lookup: {
  //             from: "employee_details",
  //             localField: "_id",
  //             foreignField: "employee_id",
  //             as: "employee_details",
  //           },
  //         },
  //         employee_monthly_reports_filter,
  //         // {$lookup:{
  //         //   from: 'employee_monthly_reports',
  //         //   localField: '_id',
  //         //   foreignField: 'emp_db_id',
  //         //   as: 'employee_monthly_reports',
  //         // }},
  //         {
  //           $lookup: {
  //             from: "companies",
  //             localField: "corporate_id",
  //             foreignField: "corporate_id",
  //             as: "companies",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "company_details",
  //             localField: "companies._id",
  //             foreignField: "company_id",
  //             as: "company_details",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "designations",
  //             localField: "employee_details.employment_hr_details.designation",
  //             foreignField: "_id",
  //             as: "designation",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "departments",
  //             localField: "employee_details.employment_hr_details.department",
  //             foreignField: "_id",
  //             as: "department",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "clients",
  //             localField: "employee_details.employment_hr_details.client",
  //             foreignField: "_id",
  //             as: "client",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "staffs",
  //             localField: "emp_hod",
  //             foreignField: "_id",
  //             as: "hod",
  //           },
  //         },
  //         search_option_details,
  //         {
  //           $addFields: {
  //             employee_details: {
  //               $arrayElemAt: ["$employee_details", 0],
  //             },
  //             // "employee_monthly_reports": {
  //             //     "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
  //             // },
  //             company: {
  //               $arrayElemAt: ["$companies", 0],
  //             },
  //             designation: {
  //               $arrayElemAt: ["$designation", 0],
  //             },
  //             department: {
  //               $arrayElemAt: ["$department", 0],
  //             },
  //             client: {
  //               $arrayElemAt: ["$client", 0],
  //             },
  //             // "hod": {
  //             //   "$arrayElemAt": [ "$hod", 0 ]
  //             // }
  //           },
  //         },
  //         monthlyAddfield,
  //         {
  //           $unwind: "$company_details",
  //         },
  //         {
  //           $addFields: {
  //             branch: {
  //               $filter: {
  //                 input: "$company_details.company_branch",
  //                 as: "branch_item",
  //                 cond: {
  //                   $eq: [
  //                     "$employee_details.employment_hr_details.branch",
  //                     "$$branch_item._id",
  //                   ],
  //                 },
  //               },
  //             },
  //           },
  //         },
  //         {
  //           $unwind: "$branch",
  //         },
  //         {
  //           $project: {
  //             _id: 1,
  //             emp_first_name: 1,
  //             emp_last_name: 1,
  //             emp_id: 1,
  //             corporate_id: 1,
  //             company_name: "$company.establishment_name",
  //             UAN_no: {
  //               $ifNull: [
  //                 "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
  //                 "NA",
  //               ],
  //             },
  //             report_data: select_val,
  //           },
  //         },
  //       ]).then(async (report_data) => {
  //         var wb = new xl.Workbook();
  //         var ws = wb.addWorksheet("Sheet 1");
  //         if (req.body.report_type == "esic") {
  //           var instructionsheet_xlsx =
  //             "storage/company/temp_files/" +
  //             req.authData.corporate_id +
  //             "/esic_report/" +
  //             req.authData.corporate_id +
  //             "-esic.xlsx";
  //           ws.cell(1, 1).string("SL. NO.");
  //           ws.cell(1, 2).string("CLIENT");
  //           ws.cell(1, 3).string("Estt. Code");
  //           ws.cell(1, 4).string("Employee ID");
  //           ws.cell(1, 5).string("Employee Name");
  //           ws.cell(1, 6).string("ESI No.");
  //           ws.cell(1, 7).string("Branch");
  //           ws.cell(1, 8).string("Designation");
  //           ws.cell(1, 9).string("Department");
  //           ws.cell(1, 10).string("D.O.J");
  //           ws.cell(1, 11).string("Status");
  //           ws.cell(1, 12).string("ESIC Wages");
  //           ws.cell(1, 13).string("Non ESIC Wages");
  //           ws.cell(1, 14).string("ESIC Variable");
  //           ws.cell(1, 15).string("Non ESIC Variable");
  //           ws.cell(1, 16).string("Paid Days");
  //           ws.cell(1, 17).string("Employees Contribution");
  //           ws.cell(1, 18).string("Employers Contribution");
  //           ws.cell(1, 19).string("Total Contribution");
  //         } else if (req.body.report_type == "pf") {
  //           var instructionsheet_xlsx =
  //             "storage/company/temp_files/" +
  //             req.authData.corporate_id +
  //             "/pf_report/" +
  //             req.authData.corporate_id +
  //             "-pf.xlsx";
  //           ws.cell(1, 1).string("SL. NO.");
  //           ws.cell(1, 2).string("Emp ID");
  //           ws.cell(1, 3).string("Employee Name");
  //           ws.cell(1, 4).string("UAN No");
  //           ws.cell(1, 5).string("Member Id");
  //           ws.cell(1, 6).string("NCP Days");
  //           ws.cell(1, 7).string("Gross");
  //           ws.cell(1, 8).string("EPF Wage");
  //           ws.cell(1, 9).string("EPS Wage");
  //           ws.cell(1, 10).string("EDLI Wage");
  //           ws.cell(1, 11).string("EE EPF");
  //           ws.cell(1, 12).string("ER EPF");
  //           ws.cell(1, 13).string("ER EPS");
  //           ws.cell(1, 14).string("EDLI");
  //           ws.cell(1, 15).string("Total EE");
  //           ws.cell(1, 16).string("Total ER");
  //           var no_of_epf = 0;
  //           var no_of_eps = 0;
  //           var no_of_edli = 0;
  //           var total_gross = 0;
  //           var total_ee_con = 0;
  //           var total_er_con = 0;
  //           var total_edli = 0;
  //           var total_admin = 0;
  //           var total_ac1 = 0;
  //           var total_ac2 = 0;
  //           var total_ac10 = 0;
  //           var total_ac21 = 0;
  //           var total_ac22 = 0;
  //         } else if (req.body.report_type == "pt") {
  //           var instructionsheet_xlsx =
  //             "storage/company/temp_files/" +
  //             req.authData.corporate_id +
  //             "/pt_report/" +
  //             req.authData.corporate_id +
  //             "-pt.xlsx";
  //           ws.cell(1, 1).string("SL. NO.");
  //           ws.cell(1, 2).string("Emp ID");
  //           ws.cell(1, 3).string("Employee Name");
  //           ws.cell(1, 4).string("Department");
  //           ws.cell(1, 5).string("Designation");
  //           ws.cell(1, 6).string("Branch");
  //           ws.cell(1, 7).string("Client");
  //           ws.cell(1, 8).string("HOD");
  //           ws.cell(1, 9).string("Earned PT Wages");
  //           ws.cell(1, 10).string("PT Deduction");
  //         }
  //         var row_counter = 1;
  //         var sl_no = 0;

  //         await Promise.all(
  //           report_data.map(async (report) => {
  //             //console.log(report);
  //             sl_no++;
  //             row_counter++;
  //             if (req.body.report_type == "esic") {
  //               ws.cell(row_counter, 1).string(sl_no.toString());
  //               ws.cell(row_counter, 2).string(report.company_name.toString());
  //               ws.cell(row_counter, 3).string(
  //                 report.report_data.branch.esic_registration_no.toString()
  //               );
  //               ws.cell(row_counter, 4).string(report.emp_id.toString());
  //               ws.cell(row_counter, 5).string(
  //                 report.emp_first_name + " " + report.emp_last_name.toString()
  //               );
  //               ws.cell(row_counter, 6).string(
  //                 report.report_data.esic_no.toString()
  //               );
  //               ws.cell(row_counter, 7).string(
  //                 report.report_data.branch.branch_name.toString()
  //               );
  //               ws.cell(row_counter, 8).string(
  //                 report.report_data.designation.toString()
  //               );
  //               ws.cell(row_counter, 9).string(
  //                 report.report_data.department.toString()
  //               );
  //               ws.cell(row_counter, 10).string(
  //                 report.report_data.doj.toString()
  //               );
  //               ws.cell(row_counter, 11).string(
  //                 (report.report_data.esic_covered == "yes"
  //                   ? "Covered"
  //                   : "Out of Coverage"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 12).string(
  //                 (report.report_data.esic_covered == "yes"
  //                   ? report.report_data.employee_monthly_reports.total_esic_wages.toFixed(
  //                       2
  //                     )
  //                   : ""
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 13).string(
  //                 (report.report_data.esic_covered == "no"
  //                   ? report.report_data.employee_monthly_reports.total_esic_wages.toFixed(
  //                       2
  //                     )
  //                   : ""
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 14).string(
  //                 (report.report_data.esic_covered == "yes"
  //                   ? report.report_data.employee_monthly_reports.total_esic_wages.toFixed(
  //                       2
  //                     )
  //                   : ""
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 15).string(
  //                 (report.report_data.esic_covered == "yes"
  //                   ? (
  //                       parseFloat(
  //                         report.report_data.employee_monthly_reports
  //                           .total_esic_bucket
  //                       ) -
  //                       parseFloat(
  //                         report.report_data.employee_monthly_reports
  //                           .total_esic_wages
  //                       )
  //                     ).toFixed(2)
  //                   : ""
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 16).string(
  //                 report.report_data.paydays.toString()
  //               );
  //               ws.cell(row_counter, 17).string(
  //                 report.report_data.employee_monthly_reports.esic_data.emoloyee_contribution
  //                   .toFixed(2)
  //                   .toString()
  //               );
  //               ws.cell(row_counter, 18).string(
  //                 report.report_data.employee_monthly_reports.esic_data.emoloyer_contribution
  //                   .toFixed(2)
  //                   .toString()
  //               );
  //               ws.cell(row_counter, 19).string(
  //                 (
  //                   parseFloat(
  //                     report.report_data.employee_monthly_reports.esic_data
  //                       .emoloyee_contribution
  //                   ) +
  //                   parseFloat(
  //                     report.report_data.employee_monthly_reports.esic_data
  //                       .emoloyer_contribution
  //                   )
  //                 )
  //                   .toFixed(2)
  //                   .toString()
  //               );
  //             } else if (req.body.report_type == "pf") {
  //               ws.cell(row_counter, 1).string(sl_no.toString());
  //               ws.cell(row_counter, 2).string(report.emp_id.toString());
  //               ws.cell(row_counter, 3).string(
  //                 report.emp_first_name + " " + report.emp_last_name.toString()
  //               );
  //               ws.cell(row_counter, 4).string(report.UAN_no.toString());
  //               ws.cell(row_counter, 5).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.branch.epf_registration_no
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 6).string(
  //                 report.UAN_no != "NA" ? report?.report_data?.total_lop : "NA"
  //               );
  //               ws.cell(row_counter, 7).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.total_earning.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 8).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.total_pf_wages.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 9).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.eps_wages.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 10).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.edlis_wages.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 11).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.emoloyee_contribution.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 12).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.emoloyer_pf_contribution.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 13).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.emoloyer_eps_contribution.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 14).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.emoloyer_edlis_contribution.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 15).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.emoloyee_contribution.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               ws.cell(row_counter, 16).string(
  //                 (report.UAN_no != "NA"
  //                   ? report.report_data.employee_monthly_reports.pf_data.total_employer_contribution.toFixed(
  //                       2
  //                     )
  //                   : "NA"
  //                 ).toString()
  //               );
  //               if (report.UAN_no != "NA") {
  //                 no_of_epf++;
  //                 no_of_edli++;
  //                 total_gross =
  //                   total_gross +
  //                   parseFloat(
  //                     report.report_data.employee_monthly_reports.total_earning
  //                   );
  //                 total_ee_con =
  //                   total_ee_con +
  //                   parseFloat(
  //                     report.report_data.employee_monthly_reports.pf_data
  //                       .emoloyee_contribution
  //                   );
  //                 total_er_con =
  //                   total_er_con +
  //                   parseFloat(
  //                     report.report_data.employee_monthly_reports.pf_data
  //                       .total_employer_contribution
  //                   );
  //                 total_edli =
  //                   total_edli +
  //                   parseFloat(
  //                     report.report_data.employee_monthly_reports.pf_data
  //                       .emoloyer_edlis_contribution
  //                   );
  //                 total_admin =
  //                   total_admin +
  //                   parseFloat(
  //                     report.report_data.employee_monthly_reports.pf_data
  //                       .emoloyer_epf_admin_contribution
  //                   );
  //                 if (
  //                   report.report_data.employee_monthly_reports.pf_data
  //                     .emoloyer_eps_contribution > 0
  //                 ) {
  //                   no_of_eps++;
  //                 }
  //               }
  //             } else if (req.body.report_type == "pt") {
  //               ws.cell(row_counter, 1).string(sl_no.toString());
  //               ws.cell(row_counter, 2).string(report.emp_id.toString() || "");
  //               ws.cell(row_counter, 3).string(
  //                 report.emp_first_name +
  //                   " " +
  //                   report.emp_last_name.toString() || ""
  //               );
  //               ws.cell(row_counter, 4).string(
  //                 report.report_data?.department?.toString() || ""
  //               );
  //               ws.cell(row_counter, 5).string(
  //                 report.report_data?.designation?.toString() || ""
  //               );
  //               ws.cell(row_counter, 6).string(
  //                 report.report_data?.branch.branch_name?.toString() || ""
  //               );
  //               ws.cell(row_counter, 7).string(
  //                 report.report_data?.client?.toString() || ""
  //               );
  //               ws.cell(row_counter, 8).string(
  //                 report.report_data?.hod?.toString() || ""
  //               );
  //               ws.cell(row_counter, 9).string(
  //                 report.report_data?.total_pt_wages?.toFixed(2)?.toString() ||
  //                   ""
  //               );
  //               ws.cell(row_counter, 10).string(
  //                 report.report_data?.pt_amount?.toFixed(2)?.toString() || ""
  //               );
  //             }
  //           })
  //         ).then(async () => {
  //           if (req.body.report_type == "pf") {
  //             ws.cell(row_counter + 2, 4).string("Number of Members EPF");
  //             ws.cell(row_counter + 3, 4).string("Number of Members EPS");
  //             ws.cell(row_counter + 4, 4).string("Number of Members EDLI");

  //             ws.cell(row_counter + 2, 5).string(no_of_epf.toString());
  //             ws.cell(row_counter + 3, 5).string(no_of_eps.toString());
  //             ws.cell(row_counter + 4, 5).string(no_of_edli.toString());

  //             ws.cell(row_counter + 2, 6).string("Total Gross");
  //             ws.cell(row_counter + 3, 6).string("Total EE");
  //             ws.cell(row_counter + 4, 6).string("Total ER");
  //             ws.cell(row_counter + 5, 6).string("Total EDLI");
  //             ws.cell(row_counter + 6, 6).string("Total Admin");

  //             ws.cell(row_counter + 2, 7).string(total_gross.toString());
  //             ws.cell(row_counter + 3, 7).string(total_ee_con.toString());
  //             ws.cell(row_counter + 4, 7).string(total_er_con.toString());
  //             ws.cell(row_counter + 5, 7).string(total_edli.toString());
  //             ws.cell(row_counter + 6, 7).string(total_admin.toString());
  //           }

  //           // wb.write(instructionsheet_xlsx);
  //           file_name = req.authData.corporate_id + "-pt.xlsx";
  //           // file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/pt_report/";
  //           let file = Site_helper.createFiles(
  //             wb,
  //             file_name,
  //             req.authData.corporate_id,
  //             "temp_files/payment-compliance-module"
  //           );
  //           await Site_helper.downloadAndDelete(
  //             file.file_name,
  //             file.location,
  //             req.authData.corporate_id,
  //             resp
  //           );
  //           // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
  //           // return resp.status(200).send({ status: 'success',message:"", download_url: baseurl + instructionsheet_xlsx });
  //           //return resp.status(200).send({ status: 'success',message:"", download_url: instructionsheet_xlsx });
  //         });
  //       });
  //     }
  //   } catch (e) {
  //     return resp.status(403).json({
  //       status: "error",
  //       message: e ? e.message : "Something went wrong",
  //     });
  //   }
  // },
};
