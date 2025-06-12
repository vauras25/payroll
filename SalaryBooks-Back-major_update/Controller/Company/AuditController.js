var Challans = require("../../Model/Company/Challans");
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require("node-input-validator");
const mongoose = require("mongoose");
const monthly_reports = require("../../Model/Company/EmployeeMonthlyReport");
const Employee = require("../../Model/Company/employee");
var xl = require("excel4node");
const moment = require("moment");
var fs = require("fs");
const archiver = require("archiver");
const { json } = require("body-parser");
var EmployeeSheetTemplate = require('../../Model/Company/EmployeeSheetTemplate');
const SalaryReportController = require("./SalaryReportController");


const monthMaster = [
  {
    index: 0,
    value: 1,
    monthLabel: "01",
    description: "January",
    days: 31,
    sf: "Jan",
  },
  {
    index: 1,
    value: 2,
    monthLabel: "02",
    description: "February",
    days: 28,
    sf: "Feb",
  },
  {
    index: 2,
    value: 3,
    monthLabel: "03",
    description: "March",
    days: 31,
    sf: "Mar",
  },
  {
    index: 3,
    value: 4,
    monthLabel: "04",
    description: "April",
    days: 30,
    sf: "Apr",
  },
  {
    index: 4,
    value: 5,
    monthLabel: "05",
    description: "May",
    days: 31,
    sf: "May",
  },
  {
    index: 5,
    value: 6,
    monthLabel: "06",
    description: "June",
    days: 30,
    sf: "Jun",
  },
  {
    index: 6,
    value: 7,
    monthLabel: "07",
    description: "July",
    days: 31,
    sf: "Jul",
  },
  {
    index: 7,
    value: 8,
    monthLabel: "08",
    description: "August",
    days: 31,
    sf: "Aug",
  },
  {
    index: 8,
    value: 9,
    monthLabel: "09",
    description: "September",
    days: 30,
    sf: "Sep",
  },
  {
    index: 9,
    value: 10,
    monthLabel: "10",
    description: "October",
    days: 31,
    sf: "Oct",
  },
  {
    index: 10,
    value: 11,
    monthLabel: "11",
    description: "November",
    days: 30,
    sf: "Nov",
  },
  {
    index: 11,
    value: 12,
    monthLabel: "12",
    description: "December",
    days: 31,
    sf: "Dec",
  },
];

function mapSummarydataForExcel(ws,row_counter =  2,sl_no=1,  month, data, report_type) {
 
  
  if (report_type == "pf") {
    let available_files = []
    ws.cell(1, 1).string("SL NO.");
    ws.cell(1, 2).string("WAGE MONTH");
    ws.cell(1, 3).string("ESTABLISHMENT CODE");
    ws.cell(1, 4).string("TOTAL NO. OF EMPLOYEES");
    ws.cell(1, 5).string("TOTAL INCLUDED EMPLOYEES IN PF");
    ws.cell(1, 6).string("TOTAL EPF WAGES OF INCLUDED EMPLOYEES");
    ws.cell(1, 7).string("TOTAL NO. OF EMPLOYEES IN EPS");
    ws.cell(1, 8).string("TOTAL EPS WAGES OF INCLUDED EMPLOYEES");
    ws.cell(1, 9).string("TOTAL EDLI WAGES, UP TO 15000 ONLY");
    ws.cell(1, 10).string("TOTAL EXCLUDED EMPLOYEES IN PF");
    ws.cell(1, 11).string("TOTAL GROSS WAGES OF EXCLUDED EMPLOYEES");
    ws.cell(1, 12).string("TOTAL GROSS WAGES");
    ws.cell(1, 13).string("SALARY BOOKS REF. NO.");
    ws.cell(1, 14).string("A/C.01");
    ws.cell(1, 15).string("A/C.02");
    ws.cell(1, 16).string("A/C.10");
    ws.cell(1, 17).string("A/C.21");
    ws.cell(1, 18).string("A/C.22");
    ws.cell(1, 19).string("TOTAL PF AMOUNT DUE TO PAY");
    ws.cell(1, 20).string("PAYMENT MADE AS PER CHALLAN");
    ws.cell(1, 21).string("GOVERNMENT SUBSIDY");
    ws.cell(1, 22).string("DIFFERENCE");
    ws.cell(1, 23).string("CHALLAN NO");
    ws.cell(1, 24).string("DUE DATE");
    ws.cell(1, 25).string("DATE OF PAYMENT");
    ws.cell(1, 26).string("NO OF DELAY DAY");

    let challan_data = {
      wage_month:month.sf,
      file_id: data[0].file_id,
      total_emp: 0,
      total_epf_emp: 0,
      total_epf: 0,
      total_eps_emp: 0,
      total_eps: 0,
      total_edli: 0,
      total_excluded_emp: 0,
      ac_01: 0,
      ac_02: 0,
      ac_10: 0,
      ac_21: 0,
      ac_22: 0,
      total_challan_amount: data.reduce(
        (a, b) => a + (+b.total_challan_amount || 0),
        0
      ),
      pending_challan_amount: 0,
      challans: [],
    };
    data.map(({ _doc }) => {
      challan_data["total_emp"] += +_doc.total_emp || 0;
      challan_data["total_epf_emp"] += +_doc.total_epf_emp || 0;
      challan_data["total_epf"] += +_doc.total_epf || 0;
      challan_data["total_eps_emp"] += +_doc.total_eps_emp || 0;
      challan_data["total_eps"] += +_doc.total_eps || 0;
      challan_data["total_edli"] += +_doc.total_edli || 0;
      challan_data["total_excluded_emp"] += +_doc.total_excluded_emp || 0;
      challan_data["ac_01"] += +_doc.ac_01 || 0;
      challan_data["ac_02"] += +_doc.ac_02 || 0;
      challan_data["ac_10"] += +_doc.ac_10 || 0;
      challan_data["ac_21"] += +_doc.ac_21 || 0;
      challan_data["ac_22"] += +_doc.ac_22 || 0;
      // challan_data["total_challan_amount"] += +_doc.total_challan_amount || 0;
      if (_doc.status !== "active") {
        let obj = {
          total_pending_amount: challan_data.pending_challan_amount,
          total_payment_amount: _doc?.payment_confirmation?.total_amount | 0,
          total_gov_schemes: _doc?.challan_details?.total_gov_schemes | 0,
          trrn: _doc?.trrn || "N/A",
          due_date: _doc?.due_date || "N/A",
          date_of_credit: _doc?.payment_confirmation?.date_of_credit || "N/A",
        };
        if (challan_data.pending_challan_amount == 0) {
          challan_data.pending_challan_amount =
            challan_data.total_challan_amount;
          obj.total_pending_amount = challan_data.total_challan_amount;
        }
        challan_data.pending_challan_amount =
          (+challan_data.pending_challan_amount || 0) -
            (+_doc?.payment_confirmation?.total_amount || 0) || 0;
        obj["delay_no"] =
          moment(obj.date_of_credit).diff(moment(obj.due_date), "days") < 0
            ? 0
            : moment(obj.date_of_credit).diff(moment(obj.due_date), "days");
        challan_data["challans"].push(obj);
        if(_doc.challan_details_file) available_files.push(_doc.challan_details_file)
        if(_doc.ecr_details_file) available_files.push(_doc.ecr_details_file)
        if(_doc.payment_confirm_file) available_files.push(_doc.payment_confirm_file)
        
      }
    });

    ws.cell(row_counter, 1).number(sl_no);
    ws.cell(row_counter, 2).string(challan_data.wage_month);
    ws.cell(row_counter, 3).string("N/A");
    ws.cell(row_counter, 4).number(challan_data.total_emp);
    ws.cell(row_counter, 5).number(challan_data.total_epf_emp);
    ws.cell(row_counter, 6).number(challan_data.total_epf);
    ws.cell(row_counter, 7).number(challan_data.total_eps_emp);
    ws.cell(row_counter, 8).number(challan_data.total_eps);
    ws.cell(row_counter, 9).number(challan_data.total_edli);
    ws.cell(row_counter, 10).number(challan_data.total_excluded_emp);
    ws.cell(row_counter, 11).string("N/A");
    ws.cell(row_counter, 12).number(challan_data.total_epf);
    ws.cell(row_counter, 13).string(challan_data.file_id);
    ws.cell(row_counter, 14).number(challan_data.ac_01);
    ws.cell(row_counter, 15).number(challan_data.ac_02);
    ws.cell(row_counter, 16).number(challan_data.ac_10);
    ws.cell(row_counter, 17).number(challan_data.ac_21);
    ws.cell(row_counter, 18).number(challan_data.ac_22);
    ws.cell(row_counter, 19).number(challan_data.total_challan_amount);
    row_counter++;
    // sl_no++;
    challan_data.challans.forEach((challan) => {
      ws.cell(row_counter, 19).number(challan.total_pending_amount);
      ws.cell(row_counter, 20).number(challan.total_payment_amount);
      ws.cell(row_counter, 21).number(challan.total_gov_schemes);
      ws.cell(row_counter, 22).number(
        challan.total_pending_amount - challan.total_payment_amount
      );
      ws.cell(row_counter, 23).string(challan.trrn);
      ws.cell(row_counter, 24).string(challan.due_date);
      ws.cell(row_counter, 25).string(challan.date_of_credit);
      ws.cell(row_counter, 26).number(challan.delay_no);
      row_counter++;
      ws["availableFiles"]= available_files

    });
  } else if (report_type == "esic") {
    let available_files = []

    ws.cell(1, 1).string("SL NO.");
    ws.cell(1, 2).string("WAGE MONTH");
    ws.cell(1, 3).string("ESTT. CODE");
    ws.cell(1, 4).string("TOTAL NUMBER OF EMPLOYEES");
    ws.cell(1, 5).string("NO.OF ESIC COVERED EMPLOYEES");
    ws.cell(1, 6).string(
      "GROSS ESIC WAGES OF E.S.I.C. COVERED EMPLOYEES"
    );
    ws.cell(1, 7).string("NO.OF OUT OF COVERAGE EMPLOYEES");
    ws.cell(1, 8).string("GROSS WAGES OF OUT OF COVERAGE EMPLOYEES");
    ws.cell(1, 9).string("BONUS");
    ws.cell(1, 10).string("OVER TIME");
    ws.cell(1, 11).string("QUARTERLY INCENTIVE");
    ws.cell(1, 12).string("PLI");
    ws.cell(1, 13).string("TOTAL EARNED GROSS WAGES (RS.)");
    ws.cell(1, 14).string("SALARY BOOKS REF. NO.");
    ws.cell(1, 15).string("EMPLOYEES CONTRIBUTION");
    ws.cell(1, 16).string("EMPLOYERS CONTRIBUTION");
    ws.cell(1, 17).string("TOTAL CONTRIBUTION");
    ws.cell(1, 18).string("CONTRIBUTION PAID AS PER CHALLAN");
    ws.cell(1, 19).string("DIFFERENCE");
    ws.cell(1, 20).string("DUE DATE");
    ws.cell(1, 21).string("DATE OF PAYMENT");
    ws.cell(1, 22).string("CHALLAN NO");
    ws.cell(1, 23).string("DELAY DAYS");
    let challan_data = {
      wage_month: month.sf,
      file_id: data[0].file_id,
      total_emp: 0,
      total_esic_emp: 0,
      total_esic: 0,
      total_excluded_emp: 0,
      not_coverd_wage: 0,
      total_bonus_esic: 0,
      total_overtime_esic: 0,
      total_incentive_esic: 0,
      total_employee_contribution: 0,
      total_employer_contribution: 0,
      total_contribution: data.reduce(
        (a, { _doc }) =>
          a +
          ((+_doc.total_employee_contribution || 0) +
            (+_doc.total_employer_contribution || 0)),
        0
      ),
      pending_challan_amount: 0,
      challans: [],
    };

    data.map(({ _doc }) => {
      challan_data["total_emp"] += +_doc.total_emp || 0;
      challan_data["total_esic_emp"] += +_doc.total_esic_emp || 0;
      challan_data["total_esic"] += +_doc.total_esic || 0;
      challan_data["total_excluded_emp"] += +_doc.total_excluded_emp || 0;
      challan_data["not_coverd_wage"] += +_doc.not_coverd_wage || 0;
      challan_data["total_bonus_esic"] += +_doc.total_bonus_esic || 0;
      challan_data["total_overtime_esic"] += +_doc.total_overtime_esic || 0;
      challan_data["total_incentive_esic"] += +_doc.total_incentive_esic || 0;
      challan_data["total_employee_contribution"] +=
        +_doc.total_employee_contribution || 0;
      challan_data["total_employer_contribution"] +=
        +_doc.total_employer_contribution || 0;
      if (_doc.status !== "active") {
        let obj = {
          total_pending_amount: challan_data.pending_challan_amount || 0,
          total_payment_amount: _doc?.total_challan_amount | 0,
          due_date: _doc?.due_date || "N/A",
          challan_submited: _doc?.challan_submited || "N/A",
          challan_number: _doc?.challan_number || "N/A",
        };
        if (challan_data.pending_challan_amount == 0) {
          challan_data.pending_challan_amount =
            challan_data.total_contribution || 0;
          obj.total_pending_amount = challan_data.total_contribution || 0;
        }
        challan_data.pending_challan_amount =
          (+challan_data.pending_challan_amount || 0) -
            (+_doc?.total_challan_amount || 0) || 0;

        obj["delay_no"] =
          moment(obj.challan_submited).diff(moment(obj.due_date), "days") < 0
            ? 0
            : moment(obj.challan_submited).diff(moment(obj.due_date), "days");
        challan_data["challans"].push(obj);
        if(_doc.esic_challan_details_file) available_files.push(_doc.esic_challan_details_file)
      }
    });

    ws.cell(row_counter, 1).number(sl_no);
    ws.cell(row_counter, 2).string(challan_data.wage_month);
    ws.cell(row_counter, 3).string("N/A");
    ws.cell(row_counter, 4).number(challan_data.total_emp);
    ws.cell(row_counter, 5).number(challan_data.total_esic_emp);
    ws.cell(row_counter, 6).number(challan_data.total_esic);
    ws.cell(row_counter, 7).number(challan_data.total_excluded_emp);
    ws.cell(row_counter, 8).number(challan_data.not_coverd_wage);
    ws.cell(row_counter, 9).number(challan_data.total_bonus_esic);
    ws.cell(row_counter, 10).number(challan_data.total_overtime_esic);
    ws.cell(row_counter, 11).number(challan_data.total_incentive_esic);
    ws.cell(row_counter, 12).string("N/A");
    ws.cell(row_counter, 13).number(challan_data.total_esic);
    ws.cell(row_counter, 14).string(challan_data.file_id);
    ws.cell(row_counter, 15).number(challan_data.total_employee_contribution);
    ws.cell(row_counter, 16).number(challan_data.total_employer_contribution);
    ws.cell(row_counter, 17).number(challan_data.total_contribution);
    row_counter++;
    // sl_no++;
    challan_data.challans.forEach((challan) => {
      ws.cell(row_counter, 17).number(challan.total_pending_amount);
      ws.cell(row_counter, 18).number(challan.total_payment_amount);
      ws.cell(row_counter, 19).number(
        challan_data.total_esic - challan.total_payment_amount
      );
      ws.cell(row_counter, 20).string(challan.due_date);
      ws.cell(row_counter, 21).string(challan.challan_submited);
      ws.cell(row_counter, 22).string(challan.challan_number);
      ws.cell(row_counter, 23).number(challan.delay_no);
      row_counter++;
      ws["availableFiles"]= available_files
    });
  }else if(report_type == 'earning') {
    
  }
  return {
    ws,
    row_counter,
    sl_no
  };
}

function getMonthsBetween(startYear, startMonth, endYear, endMonth) {
  let months = [];
  let currentDate = new Date(startYear, startMonth);

  while (currentDate <= new Date(endYear, endMonth)) {
    let month = currentDate.getMonth();
    let year = currentDate.getFullYear();
    months.push({
      index: month,
      sf: currentDate.toLocaleString("default", { month: "short" }),
      year,
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

module.exports = {
  get_summary_report_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        pageno: "required",
        report_type: "required|in:pf,esic",
        wage_month_from: "required",
        wage_month_to: "required",
        wage_year_from: "required",
        wage_year_to: "required",
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

        var sortoption = { created_at: -1 };
        const options = {
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : perpage,
          sort: sortoption,
        };
        var filter_option = {
          $and: [
            { corporate_id: req.authData.corporate_id },
            { challan_for: req.body.report_type },
            // Match documents where the wage_year is greater than the start_year
            {
              $or: [
                { wage_year: { $gt: start_year } },

                // Match documents where wage_year is equal to start_year
                // and wage_month is greater than or equal to start_month
                {
                  $and: [
                    { wage_year: { $eq: start_year } },
                    { wage_month: { $gte: start_month } },
                  ],
                },
              ],
            },

            // Match documents where wage_year is less than the end_year
            {
              $or: [
                { wage_year: { $lt: end_year } },

                // Match documents where wage_year is equal to end_year
                // and wage_month is less than or equal to end_month
                {
                  $and: [
                    { wage_year: { $eq: end_year } },
                    { wage_month: { $lte: end_month } },
                  ],
                },
              ],
            },
          ],
        };
        
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
  get_variance_report_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        pageno: "required",
        wage_month_from: "required",
        wage_month_to: "required",
        wage_year_from: "required",
        wage_year_to: "required",
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
        if(req.body.generate == 'excel'){
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

        // search_option_details.$match['employee_monthly_reports'] = { $exists: true, $ne: [] };
        // search_option_details.$match['employee_monthly_reports.salary_report'] = { $exists: true, $ne: null };

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
              let: { emp_id: "$emp_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_id", "$$emp_id"] } },
                      {
                        salary_report: { $exists: true, $ne: null },
                      },
                      {
                        $or: [
                          {
                            $and: [
                              { wage_year: { $eq: start_year } },
                              { wage_month: { $gte: start_month } },
                            ],
                          },
                          {
                            wage_year: { $gt: start_year },
                          },
                        ],
                      },
                      {
                        $or: [
                          {
                            $and: [
                              { wage_year: { $eq: end_year } },
                              { wage_month: { $lte: end_month } },
                            ],
                          },
                          {
                            wage_year: { $lt: end_year },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              as: "employee_monthly_reports",
            },
          },
          {
            $match: {
              employee_monthly_reports: { $exists: true, $ne: [] },
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
              emp_first_name: 1,
              emp_last_name: 1,
              emp_id: 1,
              wage_month: 1,
              emp_data: "$employee_monthly_reports.emp_data",
              UAN_no: {
                $ifNull: [
                  "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
                  null,
                ],
              },
              branch: 1,
              department: 1,
              designation: 1,
              corporate_id: 1,
              employee_monthly_reports: 1,
            },
          },
        ]);
        if(req.body.generate == 'excel'){
          await myAggregate.then(async (employees) => {
            const wb = new xl.Workbook();
            const ws = wb.addWorksheet("Sheet 1");
            var row_counter = 1;
  
            ws.cell(row_counter, 1).string('SL No.')
            ws.cell(row_counter, 2).string('Name')
            ws.cell(row_counter, 3).string('Emp ID')
            ws.cell(row_counter, 4).string('Branch')
            ws.cell(row_counter, 5).string('Designation')
            ws.cell(row_counter, 6).string('Department')
            ws.cell(row_counter, 7).string('Type of Heads')
            ws.cell(row_counter, 8).string('Wage Month')
            ws.cell(row_counter, 9).string('EE')
            ws.cell(row_counter, 10).string('ER')
            ws.cell(row_counter, 11).string('Total')
  
            row_counter++
            
             await Promise.all(
             employees.map((employee, index) => {
               let obj = {
                 emp_id:employee.emp_id,
                 emp_first_name:employee.emp_first_name,
                 emp_last_name:employee.emp_last_name,
                 branch:employee?.branch?.branch_name,
                 designation:employee.designation?.designation_name ,
                 department:employee.department?.department_name 
               };
                ws.cell(row_counter, 1).number(index + 1);
                ws.cell(row_counter, 2).string(obj.emp_first_name + ' ' + obj.emp_last_name);
                ws.cell(row_counter, 3).string(obj.emp_id);
                ws.cell(row_counter, 4).string(obj.branch);
                ws.cell(row_counter, 5).string(obj.designation);
                ws.cell(row_counter, 6).string(obj.department);
                employee?.employee_monthly_reports.forEach(report => {
                  const salary_report = report.salary_report;
                  const wage_month = new Date(
                    new Date().getFullYear(),
                    report.wage_month,
                    1
                  ).toLocaleString("default", { month: "short" });
                  if (salary_report) {
                  // const heads = ['salary','epf','esic','p_tax'];
                  ws.cell(row_counter, 7).string('salary');
                  ws.cell(row_counter, 8).string(wage_month);
                  ws.cell(row_counter, 9).number(0);
                  ws.cell(row_counter, 10).number(+salary_report?.gross_earning || 0);
                  ws.cell(row_counter, 11).number(+salary_report?.gross_earning || 0);
                  row_counter++
                  ws.cell(row_counter, 7).string('EPF');
                  ws.cell(row_counter, 8).string(wage_month);
                  ws.cell(row_counter, 9).number(salary_report?.pf_data?.emoloyee_contribution || 0);
                  ws.cell(row_counter, 10).number(salary_report?.pf_data?.total_employer_contribution || 0);
                  ws.cell(row_counter, 11).number(+(salary_report?.pf_data?.emoloyee_contribution || 0) + +(salary_report?.pf_data?.total_employer_contribution || 0));
                  row_counter++
                  ws.cell(row_counter, 7).string('ESIC');
                  ws.cell(row_counter, 8).string(wage_month);
                  ws.cell(row_counter, 9).number(salary_report?.esic_data?.emoloyee_contribution || 0);
                  ws.cell(row_counter, 10).number(salary_report?.esic_data?.emoloyer_contribution || 0);
                  ws.cell(row_counter, 11).number(
                  +(salary_report?.esic_data?.emoloyee_contribution || 0) + 
                  +(salary_report?.esic_data?.emoloyer_contribution || 0)
                  );
                  row_counter++
                  ws.cell(row_counter, 7).string('P.Tax');
                  ws.cell(row_counter, 8).string(wage_month);
                  ws.cell(row_counter, 9).number(salary_report?.pt_amount || 0);
                  ws.cell(row_counter, 10).number(0);
                  ws.cell(row_counter, 11).number(salary_report?.pt_amount || 0);
                  row_counter++
                    // obj[report.wage_month] = {}
              
                    // obj[report.wage_month]['epf'] = {
                    //     ee:
                    //     er:
                    //     total:
                    //       ,
                    // };
                    // obj[report.wage_month]['esic'] = { 
                    //   ee: salary_report?.esic_data?.emoloyee_contribution || 0,
                    //   er: salary_report?.esic_data?.emoloyer_contribution || 0,
                    //   total: +(salary_report?.esic_data?.emoloyee_contribution || 0) + 
                    //          +(salary_report?.esic_data?.emoloyer_contribution || 0)
                    //          } 
                    // obj[report.wage_month]['p_tax'] = {
                    //      ee: salary_report?.pt_amount || 0, 
                    //      er: 0, 
                    //      total:salary_report?.pt_amount || 0 } 
                  }
                })
                return obj
              })
              ).then(()=> {
                let file_name = `variance-report.xlsx`;
                return  Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/audit-module');
              }).then(async(file)=>{
              await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
            })
            // for (const employee of res) {
            //   employee.employee_monthly_reports.map()
            // }
          }, (err)=>{
            return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
          })

        }else{
          Employee.aggregatePaginate(
            myAggregate,
            options,
            async function (err, variance_data) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "",
                variance_data: variance_data,
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
  export_summary_report: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        report_type: "required|in:pf,esic",
        wage_month_from: "required",
        wage_month_to: "required",
        wage_year_from: "required",
        wage_year_to: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(403).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        // var sortbyfield = req.body.sortbyfield;
        // if (sortbyfield) {
        //   var sortoption = {};
        //   sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
        // } else {
        //   var sortoption = { created_at: -1 };
        // }

        var start_month = parseInt(req.body.wage_month_from);
        var start_year = parseInt(req.body.wage_year_from);
        var end_month = parseInt(req.body.wage_month_to);
        var end_year = parseInt(req.body.wage_year_to);

        var search_option = {
          corporate_id: req.authData.corporate_id,
          challan_for: req.body.report_type,
          $and: [
            { corporate_id: req.authData.corporate_id },
            { challan_for: req.body.report_type },
            // Match documents where the wage_year is greater than the start_year
            {
              $or: [
                { wage_year: { $gt: start_year } },

                // Match documents where wage_year is equal to start_year
                // and wage_month is greater than or equal to start_month
                {
                  $and: [
                    { wage_year: { $eq: start_year } },
                    { wage_month: { $gte: start_month } },
                  ],
                },
              ],
            },

            // Match documents where wage_year is less than the end_year
            {
              $or: [
                { wage_year: { $lt: end_year } },

                // Match documents where wage_year is equal to end_year
                // and wage_month is less than or equal to end_month
                {
                  $and: [
                    { wage_year: { $eq: end_year } },
                    { wage_month: { $lte: end_month } },
                  ],
                },
              ],
            },
          ],
        };

        if (req.body.row_checked_all === "true") {
          var ids = JSON.parse(req.body.unchecked_row_ids);
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option._id = { $nin: ids };
          }
        } else {
          var ids = JSON.parse(req.body.checked_row_ids);
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option._id = { $in: ids };
          }
        }

        Challans.find(search_option, async function (err, challans) {
          if (err) throw "no data found";
          if (challans.length > 0) {
            let report_type = req.body.report_type;
            var wb = new xl.Workbook();

            var ws = wb.addWorksheet("Sheet 1");

            var row_counter = 2;
            var sl_no = 0;
            var report = challans;
            // let monthMaster = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

            let monthMaster = getMonthsBetween(start_year, start_month, end_year, end_month)

            await Promise.all(
              monthMaster.map((month) => {
                let challans = report.filter(
                  (challan) => challan.wage_month == month.index
                );
                if (challans.length) {
                  // row_counter++
                  sl_no++
                  let res = mapSummarydataForExcel(ws,row_counter,sl_no, month, challans, report_type);
                  ws = res.ws
                  row_counter = res.row_counter
                  sl_no = res.sl_no
                }
              })
            );
            start_month = new Date(
              new Date().getFullYear(),
              start_month,
              1
            ).toLocaleString("default", { month: "short" });
            end_month = new Date(
              new Date().getFullYear(),
              end_month,
              1
            ).toLocaleString("default", { month: "short" });
            let file_name = `${report_type}-summary-report-${start_month}-${start_year}-to-${end_month}-${end_year}.xlsx`;
            var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/audit-module');
            await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
            // var file_location = Site_helper.createFiles(
            //   wb,
            //   file_name,
            //   "xlsx",
            //   req.authData.corporate_id
            // );

            // filename = `${report_type}-summary-report-${start_month}-${start_year}-to-${end_month}-${end_year}`+".xlsx";
            // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
            // await Site_helper.download(filename,file_path,req.authData.corporate_id,resp);
                    }
          else{
            return resp.status(403).json({
              status: "success",
              message: "Xlsx created successfully",
            });
          }
        });
      }
    } catch (e) {
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  export_summary_briefcase: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        wage_month_from: "required",
        wage_month_to: "required",
        wage_year_from: "required",
        wage_year_to: "required",
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
        var masterTemplate = await EmployeeSheetTemplate.findById("649a7c527fcc589d0a195654");

        var search_option = {
          corporate_id: req.authData.corporate_id,
          status: "confirm",
          // $and: [
          //   // Match documents where the wage_year is greater than the start_year
          //   {
          //     $or: [
          //       { wage_year: { $gt: start_year } },

          //       // Match documents where wage_year is equal to start_year
          //       // and wage_month is greater than or equal to start_month
          //       {
          //         $and: [
          //           { wage_year: { $eq: start_year } },
          //           { wage_month: { $gte: start_month } },
          //         ],
          //       },
          //     ],
          //   },

          //   // Match documents where wage_year is less than the end_year
          //   {
          //     $or: [
          //       { wage_year: { $lt: end_year } },

          //       // Match documents where wage_year is equal to end_year
          //       // and wage_month is less than or equal to end_month
          //       {
          //         $and: [
          //           { wage_year: { $eq: end_year } },
          //           { wage_month: { $lte: end_month } },
          //         ],
          //       },
          //     ],
          //   },
          // ]
        };

        const months = getMonthsBetween(
          start_year,
          start_month,
          end_year,
          end_month
        );

       let file = Site_helper.createFiles(null, null,req.authData.corporate_id, 'temp_files/audit-module/temp' )
        // fs.mkdirSync(`temp`);
        // await Promise.all(
        for (const month of months) {
          let pf_summary = await Challans.find({...search_option,wage_month: month.index,wage_year: month.year,challan_for: "pf"});
          let esic_summary = await Challans.find({ ...search_option, wage_month: month.index, wage_year: month.year, challan_for: "esic"});
          let salary_earning_wb = await SalaryReportController.export_master_sheet({...req,body:{
              ...req.body,
              wage_month:month.index,
              wage_year:month.year,
              template_id:"649a7c527fcc589d0a195654",
            }}, resp, next, false)
          

          // let reportdata = await monthly_reports.find({corporate_id:req.authData.corporate_id, wage_month: month.index,wage_year: month.year, salary_report:{$exists: true , $ne: null}});
          let store_loc = `.${file.location}${month.sf}-${month.year}`;
          
          // Generate a folder for every month where data is present
          if (pf_summary.length || esic_summary.length || salary_earning_wb) {
            fs.mkdirSync(store_loc);
    
          }
          if (pf_summary.length || esic_summary.length) {
            fs.mkdirSync(store_loc+"/document_vault");
            fs.mkdirSync(store_loc+"/document_vault/pf_docs");
            fs.mkdirSync(store_loc+"/document_vault/esic_docs");
          }

          // Generate a file of pf summary inside a folder for month
          if (pf_summary.length) {
            let wb = new xl.Workbook();
            let ws = wb.addWorksheet("Sheet 1");
            ws = mapSummarydataForExcel(ws,2,1, month, pf_summary, "pf").ws;
            
            if(ws.availableFiles && ws.availableFiles.length){
              for (const file of ws.availableFiles) {
                if (fs.existsSync(file)) {
                let convert = file.split("/").join("\\")  
                let sp = convert.split(`\\`).find(i => i.includes("."));
                fs.copyFile(file, `${store_loc}/document_vault/pf_docs/${sp}`, (err) => {
                  if (err) throw err;
                });
              }
            }
            }
            const buffer = await wb.writeToBuffer();
            fs.writeFile(`${store_loc}/pf-summary-report.xlsx`,buffer,
              function (err) {
                if (err) {
                  throw err;
                }
              }
            );
            
          }

          // Generate a file of esic summary inside a folder for month
          if (esic_summary.length) {
            let wb = new xl.Workbook();
            let ws = wb.addWorksheet("Sheet 1");
            ws = mapSummarydataForExcel(ws,2,1, month, esic_summary, "esic").ws;
            if(ws.availableFiles && ws.availableFiles.length){
              for (const file of ws.availableFiles) {
                if (fs.existsSync(file)) {
                let convert = file.split("/").join("\\")  
                  let sp = convert.split(`\\`).find(i => i.includes("."))
                  fs.copyFile(file, `${store_loc}/document_vault/esic_docs/${sp}`, (err) => {
                    if (err) throw err;
                  });
                }
                }
                
            }
            const buffer = await wb.writeToBuffer()
            fs.writeFile(
              `${store_loc}/esic-summary-report.xlsx`,
              buffer,
              function (err) {
                if (err) {
                  throw err;
                }
              }
            );
          }

          if(salary_earning_wb){
            const buffer = await salary_earning_wb.writeToBuffer();
            fs.writeFile(`${store_loc}/earning-summary-report.xlsx`,buffer,
              function (err) {
                if (err) {
                  throw err;
                }
              }
            );
          }
        }
    
        
        //ziping folders in one
        start_month = new Date(
          new Date().getFullYear(),
          start_month,
          1
        ).toLocaleString("default", { month: "short" });
        end_month = new Date(
          new Date().getFullYear(),
          end_month,
          1
        ).toLocaleString("default", { month: "short" });

        let fileName =`briefcase-${start_month}-${start_year}-to-${end_month}-${end_year}.zip`;
        let fileLocation = `storage/company/${req.authData.corporate_id}/temp_files/audit-module/`

        const output = fs.createWriteStream(fileLocation + fileName);

        const archive = archiver("zip", {
          zlib: { level: 9 }, // Sets the compression level.
        });

        output.on("close", async function (c) {

          fs.rmdirSync("." + file.location, { recursive: true })
          await Site_helper.downloadAndDelete(fileName,fileLocation,req.authData.corporate_id,resp);
          // return resp.status(200).json({
          //   status: "success",
          //   message: "Zip Created Successfully",
          //   url:baseurl+this.path
          // });
        });

        archive.on("error", function (err) {
          throw err;
        });

        archive.directory("." +file.location, false);

        archive.pipe(output);
        archive.finalize();
        // let salary_earning = await Challans.find(search_option);
       
      }
    } catch (e) {
      fs.rmdirSync(`storage/company/${req.authData.corporate_id}/temp_files/audit-module/temp`, { recursive: true })
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
};
