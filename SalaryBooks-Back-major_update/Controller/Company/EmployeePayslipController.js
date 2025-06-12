var EmployeeMonthlyReport = require("../../Model/Company/EmployeeMonthlyReport");
var EmployeePayslip = require("../../Model/Company/EmployeePayslip");
var { Validator } = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var EmailHelper = require("../../Helpers/EmailHelper");
var Employee = require("../../Model/Company/employee");
const mongoose = require("mongoose");
var fs = require("fs");
const archiver = require('archiver');
const { resolve } = require('path');
const absolutePath = resolve('');
const moment = require('moment');
const { log } = require("console");
const employeeDetails = require("../../Model/Company/employee_details");

var config = require("../../Mail/Config");
var smtp_setup = require("../../Model/Admin/SmtpSetup");
var EmailHelper = require("../../Helpers/EmailHelper")

const smtpcredintials = async (corporate_id,maildata) => {
                console.log("second");
                try {
                  const smtp = await smtp_setup.findOne({
                    corporate_id,
                  });
                  console.log("third");
                  console.log(smtp, "amansmtp1");
                  config.sendEmail(smtp, maildata)
                }
                catch (err) {
                  throw err
                }
              }

module.exports = {
  generate_employee_payslip: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {
        var wage_month = req.body.wage_month;
        var wage_year = req.body.wage_year;
        const options = {};
        var filter_option = {};
        var document = {};
        var search_option = {
          $match: {
            $and: [
              { 'corporate_id': req.authData.corporate_id },
              { 'parent_hods': { $in: [req.authData.user_id] } },
              { 'approval_status': 'approved' },
            ]
          }
        };
        var search_option_details = { $match: {} };
        if (req.body.searchkey) {
          search_option = { $match: { $text: { $search: req.body.searchkey }, 'corporate_id': req.authData.corporate_id } };
        }
        else {
          var query_data = await Site_helper.getEmpFilterData(req, search_option, search_option_details);
          search_option_details = query_data.search_option_details;
          search_option = query_data.search_option;
        }
        if (req.body.row_checked_all === "true") {
          var ids = JSON.parse(req.body.unchecked_row_ids);
          if (ids.length > 0) {
            ids = ids.map(function (el) { return mongoose.Types.ObjectId(el) })
            search_option.$match._id = { $nin: ids }
          }
        }
        else {
          var ids = JSON.parse(req.body.checked_row_ids);
          if (ids.length > 0) {
            ids = ids.map(function (el) { return mongoose.Types.ObjectId(el) })
            search_option.$match._id = { $in: ids }
          }
        }
        search_option_details.$match['employee_monthly_reports.wage_month'] = parseInt(wage_month);
        search_option_details.$match['employee_monthly_reports.wage_year'] = parseInt(wage_year);
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
              from: 'employee_details',
              localField: '_id',
              foreignField: 'employee_id',
              as: 'employee_details',
            }
          },
          {
            $lookup: {
              from: 'employee_monthly_reports',
              "let": { "emp_db_idVar": "$_id" },
              "pipeline": [
                {
                  "$match": {
                    $and: [
                      { "$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] } },
                      { "wage_month": parseInt(wage_month) },
                      { "wage_year": parseInt(wage_year) },
                    ]
                  }
                }
              ],
              as: 'employee_monthly_reports',
            }
          },
          {
            $lookup: {
              from: 'staffs',
              localField: 'emp_hod',
              foreignField: '_id',
              as: 'hod'
            }
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
              from: 'companies',
              localField: 'corporate_id',
              foreignField: 'corporate_id',
              as: 'companies'
            }
          },
          {
            $lookup: {
              from: 'company_details',
              localField: 'companies._id',
              foreignField: 'company_id',
              as: 'company_details',
            }
          },
          search_option_details,
          {
            "$addFields": {
              "employee_details": {
                "$arrayElemAt": ["$employee_details", 0]
              },
              "employee_monthly_reports": {
                "$arrayElemAt": ["$employee_monthly_reports", 0]
              },
              "hod": {
                "$arrayElemAt": ["$hod", 0]
              },
              "designation": {
                "$arrayElemAt": ["$designation", 0]
              },
              "department": {
                "$arrayElemAt": ["$department", 0]
              },
              "client": {
                "$arrayElemAt": ["$client", 0]
              }
            }
          },
          {
            $unwind: {
              path: "$company_details",
              preserveNullAndEmptyArrays: true // This ensures the company_details remain in the result even if there's no branch.
            }
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
                      "$$branch_item._id"
                    ]
                  }
                }
              }
            }
          },
          {
            $addFields: {
              branch: { $ifNull: ["$branch", []] } // If no branch is found, set it as an empty array.
            }
          },
          {
            $unwind: {
              path: "$branch",
              preserveNullAndEmptyArrays: true // This ensures that if there’s no branch, it doesn’t exclude the employee, just leaves it as an empty object or array.
            }
          },
          {
            "$project":
            {
              "_id": 1,
              "corporate_id": 1,
              "userid": 1,
              "emp_id": 1,
              "emp_first_name": 1,
              "emp_last_name": 1,
              "emp_dob": 1,
              "mobile_no": { $ifNull: ["$mobile_no", 'NA'] },
              "age": {
                $divide: [{ $subtract: [new Date(), "$emp_dob"] },
                (365 * 24 * 60 * 60 * 1000)]
              },
              "pan_no": 1,
              "aadhar_no": 1,
              "email_id": 1,
              "empid": 1,
              "sex": 1,
              "client_code": 1,
              "approval_status": 1,
              "employee_details": 1,
              "employee_advances": 1,
              "hod.first_name": 1,
              "hod.last_name": 1,
              "hod.userid": 1,
              "hod._id": 1,
              "hold_salary_emps": 1,
              "employee_monthly_reports": 1,
              "branch.branch_name": 1,
              "branch._id": 1,
              "designation.designation_name": 1,
              "designation._id": 1,
              "department.department_name": 1,
              "department._id": 1,
              "client.client_name": 1,
              "client._id": 1,
            }
          },
        ]).then(async (emps) => {
          if (!emps.length) {
            return resp.status(200).json({ status: "success", message: 'Nothing to generate.', });
          }

          await Promise.all(emps.map(async function (empdata) {
            var monthly_reports = empdata.employee_monthly_reports;
            var emp_data = empdata.employee_monthly_reports.emp_data;
            emp_data.bank_details = empdata.employee_details.bank_details;
            emp_data.pan_no = empdata.pan_no;
            emp_data.uan_no = empdata.employee_details.pf_esic_details?.curr_er_epfo_details?.uan_no;
            emp_data.esic_ip_no = empdata.employee_details.pf_esic_details?.curr_er_esic_details?.ip_dispensary;
            let model_data = {
              emp_id: empdata.emp_id,
              corporate_id: empdata.corporate_id,
              wage_month,
              wage_year,
              emp_data: emp_data,
              earnings: {},
              deductions: {
                epf_amount: monthly_reports.total_data?.pf_data?.emoloyee_contribution,
                vpf_amount: monthly_reports.salary_report?.voluntary_pf_amount,
                esic_amount: monthly_reports.total_data?.esic_data?.emoloyee_contribution,
                p_tax_amount: monthly_reports.total_data?.total_pt_amount,
                lwf_amount: monthly_reports.salary_report?.lwf_data?.employee_contribution,
                tds_amount: null,
              },
              contribution: {
                epf_amount: monthly_reports.total_data?.pf_data?.emoloyer_pf_contribution,
                eps_amount: monthly_reports.total_data?.pf_data?.emoloyer_eps_contribution,
                admin_edli_amount: (monthly_reports.total_data?.pf_data?.emoloyer_edlis_contribution || 0) + (monthly_reports.total_data?.pf_data?.emoloyer_epf_admin_contribution || 0),
                esic_amount: monthly_reports.total_data?.esic_data?.emoloyer_contribution,
                lwf_amount: monthly_reports.salary_report?.lwf_data?.employer_contribution,
              },
            };
            // if (monthly_reports.incentive_report) {
            //   model_data.earnings["incentive_total_amount"] = monthly_reports.incentive_report.gross_earning || 0;
            // }
            model_data.earnings["incentive_total_amount"] = monthly_reports.incentive_report?.gross_earning || 0;
            model_data.earnings["bonus_total_amount"] = monthly_reports.bonus_report?.gross_earning || 0;
            model_data.earnings["ex_gratia_total_amount"] = monthly_reports.bonus_report?.exgratia_amount || 0;
            model_data.earnings["arrear_total_amount"] = monthly_reports.arrear_report?.gross_earning || 0;
            model_data.earnings["ot_total_amount"] = monthly_reports.ot_report?.gross_earning || 0;
            model_data.earnings["shift_allowance_total_amount"] = monthly_reports.shift_allawance_report?.gross_earning || 0;
            model_data.earnings["reimbursement_total_amount"] = monthly_reports.reimbursement?.gross_earning || 0;
            // if (monthly_reports.bonus_report) {
            //   model_data.earnings["bonus_total_amount"] = monthly_reports.bonus_report.gross_earning || 0;
            //   model_data.earnings["ex_gratia_total_amount"] = monthly_reports.bonus_report.exgratia_amount || 0;
            // }
            // if (monthly_reports.arrear_report) {
            //   model_data.earnings["arrear_total_amount"] = monthly_reports.arrear_report.gross_earning || 0;
            // }

            // if (monthly_reports.ot_report) {
            //   model_data.earnings["ot_total_amount"] = monthly_reports.ot_report.gross_earning || 0;
            // }
            // if (monthly_reports.shift_allawance_report) {
            //   model_data.earnings["shift_allowance_total_amount"] = monthly_reports.shift_allawance_report.gross_earning || 0;
            // }
            // if (monthly_reports.reimbursement) {
            //   model_data.earnings["reimbursement_total_amount"] = monthly_reports.reimbursement.gross_earning || 0;
            // }

            model_data.earnings["sub_total"] = Object.values(model_data.earnings).reduce((a, b) => a + b, 0);
            model_data.earnings["salary_gross_earning"] = monthly_reports.total_data?.total_earning;

            // model_data.gross_earning = model_data.earnings?.sub_total + monthly_reports.total_data?.total_earning;
            // model_data.net_pay = model_data.gross_earning;
            // model_data.ctc = model_data.gross_earning + Object.values(model_data.contribution).reduce((a, b) => a + b, 0) || null;
            model_data.ctc = monthly_reports?.salary_report?.ctc
            model_data.gross_earning = monthly_reports?.salary_report?.gross_earning
            model_data.net_pay = monthly_reports?.salary_report?.net_take_home
            // model_data.gross_earning = model_data.earnings?.sub_total + monthly_reports.total_data?.total_earning;
            // model_data.net_pay = model_data.gross_earning;
            // model_data.ctc = model_data.gross_earning + Object.values(model_data.contribution).reduce((a, b) => a + b, 0) || null;
            model_data.earnings["salary_report_heads"] = monthly_reports.salary_report?.heads;
            var payslip_temp_data = empdata.employee_details?.template_data?.payslip_temp_data;
            if (payslip_temp_data) {
              var file_path = '/storage/company/payslip/';
              var file_name = 'payslip-' + empdata.corporate_id + '-' + empdata.emp_id + '-' + wage_month + '-' + wage_year + '.pdf';
              var pdf_file = await Site_helper.generate_pdf({ payslip_data: model_data }, file_name, payslip_temp_data, file_path);
              model_data.pdf_link = file_path + file_name;
              model_data.pdf_file_name = file_name;
              await EmployeePayslip.findOneAndUpdate(
                {
                  emp_id: model_data.emp_id,
                  wage_month: parseInt(wage_month),
                  wage_year: parseInt(wage_year),
                },
                model_data,
                { upsert: true, new: true },
                (err, doc) => {
                  if (err)
                    return resp
                      .status(200)
                      .send({ status: "error", message: err });
                }
              );
            }


          }))
            .then(async (emps) => {
              return resp.status(200).json({ status: "success", message: 'Pay slip generated successfully.', });
            })

        });
      }
      /*
            var myAggregate = Employee.aggregate([
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
                  "let": { "emp_db_idVar": "$_id"},
                  "pipeline": [
                    { "$match": { $and :[
                      {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                      {"wage_month": parseInt(wage_month)},
                      {"wage_year": parseInt(wage_year)},
                    ] } }
                  ],
                  as: "employee_monthly_reports",
                },
              },
              search_option_details,
              {
                $addFields: {
                  employee_monthly_report: {
                    $arrayElemAt: ["$employee_monthly_reports", 0],
                  },
                  employee_detail: {
                    $arrayElemAt: ["$employee_details", 0],
                  },
                },
              },
      
              {
                $project: {
                  _id: 1,
                  emp_id: 1,
                  emp_first_name: 1,
                  emp_last_name: 1,
                  emp_data: { $ifNull: ["$employee_monthly_report.emp_data", null] },
                  employee_details: { $ifNull: ["$employee_detail", {}] },
                  salary_report: {
                    $ifNull: ["$employee_monthly_report.salary_report", {}],
                  },
                  incentive_report: {
                    $ifNull: ["$employee_monthly_report.incentive_report", {}],
                  },
                  bonus_report: {
                    $ifNull: ["$employee_monthly_report.bonus_report", {}],
                  },
                  ex_gratia_report: {
                    $ifNull: ["$employee_monthly_report.ex_gratia_report", {}],
                  },
                  arrear_report: {
                    $ifNull: ["$employee_monthly_report.arrear_report", {}],
                  },
                  reimbursement: {
                    $ifNull: ["$employee_monthly_report.reimbursement", {}],
                  },
                  total_data: {
                    $ifNull: ["$employee_monthly_report.total_data", {}],
                  },
                  ot_report: { $ifNull: ["$employee_monthly_report.ot_report", {}] },
                },
              },
            ]);
      
            Employee.aggregatePaginate(myAggregate, {}, async function (err, data) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              }
      
              if (data && data.docs.length) {
                let entities = [];
                for (const doc of data.docs) {
                  const {
                    salary_report,
                    incentive_report,
                    bonus_report,
                    ex_gratia_report,
                    arrear_report,
                    reimbursement,
                    total_data,
                    ot_report,
                  } = doc;
      
                  let model = {
                    emp_id: doc.emp_id,
                    corporate_id: req.authData.corporate_id,
                    wage_month,
                    wage_year,
                    emp_data: {
                      _id: doc.emp_data._id,
                      emp_id: doc.emp_data.emp_id,
                      emp_first_name: doc.emp_data.emp_first_name,
                      emp_last_name: doc.emp_data.emp_last_name,
                      emp_emp_dob: doc.emp_data.emp_emp_dob,
                      emp_pan_no: doc.emp_data.emp_pan_no,
                      emp_aadhar_no: doc.emp_data.emp_aadhar_no,
                      emp_email_id: doc.emp_data.emp_email_id,
                      emp_bank_name: doc.employee_details.bank_details.bank_name,
                      emp_account_no: doc.employee_details.bank_details.account_no,
                      emp_ifsc_code: doc.employee_details.bank_details.ifsc_code,
                      emp_account_type:
                        doc.employee_details.bank_details.account_type,
                      new_pf_no: doc.employee_details.employment_details
                        ? doc.employee_details.employment_details.new_pf_no
                        : "NA",
                      esic_no: doc.employee_details.employment_details
                        ? doc.employee_details.employment_details.esic_no
                        : "NA",
                      date_of_join:
                        doc.employee_details.employment_hr_details.date_of_join,
                      sex: doc.emp_data.sex,
                      age: doc.emp_data.age,
                      EPF: doc.employee_details.employment_hr_details.pf_applicable,
                      EPS: doc.employee_details.employment_hr_details
                        .pension_applicable,
                      Restrict_PF:
                        doc.employee_details.template_data.salary_temp_data
                          .restricted_pf,
                      Reg_Type:
                        doc.employee_details.template_data.attendance_temp_data
                          .register_type,
                      emp_uan_no: doc.employee_details.pf_esic_details
                        ? doc.employee_details.pf_esic_details.curr_er_epfo_details
                            .uan_no
                        : "NA",
                      hod: doc.employee_details.employment_hr_details.hod,
                      branch: doc.employee_details.employment_hr_details.branch,
                      designation:
                        doc.employee_details.employment_hr_details.designation,
                      department:
                        doc.employee_details.employment_hr_details.department,
                      client: doc.employee_details.employment_hr_details.client,
                    },
                    earnings: {},
                    deductions: {
                      epf_amount: total_data.pf_data.emoloyee_contribution,
                      vpf_amount: null,
                      esic_amount: total_data.esic_data.emoloyee_contribution,
                      p_tax_amount: total_data.total_pt_amount,
                      lwf_amount: null,
                      tds_amount: null,
                    },
                    contribution: {
                      epf_amount: total_data.pf_data.emoloyer_pf_contribution,
                      eps_amount: total_data.pf_data.emoloyer_eps_contribution,
                      admin_edli_amount:
                        total_data.pf_data.emoloyer_edlis_admin_contribution,
                      esic_amount: total_data.esic_data.emoloyer_contribution,
                      lwf_amount: null,
                    },
                  };
      
                  if (incentive_report) {
                    model.earnings["incentive_total_amount"] =
                      incentive_report.gross_earning || 0;
                  }
      
                  if (bonus_report) {
                    model.earnings["bonus_total_amount"] =
                      bonus_report.gross_earning || 0;
                  }
      
                  if (ex_gratia_report) {
                    model.earnings["ex_gratia_total_amount"] =
                      ex_gratia_report.gross_earning || 0;
                  }
      
                  if (arrear_report) {
                    model.earnings["arrear_total_amount"] =
                      arrear_report.gross_earning || 0;
                  }
      
                  if (ot_report) {
                    model.earnings["ot_total_amount"] = ot_report.gross_earning || 0;
                  }
      
                  if (reimbursement) {
                    model.earnings["reimbursement_total_amount"] =
                      reimbursement.gross_earning || 0;
                  }
      
                  model.earnings["sub_total"] = Object.values(model.earnings).reduce(
                    (a, b) => a + b,
                    0
                  );
                  model.earnings["salary_gross_earning"] = total_data.total_earning;
      
                  model.gross_earning =
                    model.earnings.sub_total + total_data.total_earning;
                  model.net_pay = model.gross_earning;
                  model.ctc =
                    model.gross_earning +
                      Object.values(model.contribution).reduce((a, b) => a + b, 0) ||
                    null;
                  model.earnings["salary_report_heads"] = salary_report.heads;
      
                  await EmployeePayslip.findOneAndUpdate(
                    {
                      emp_id: model.emp_id,
                      wage_month: parseInt(wage_month),
                      wage_year: parseInt(wage_year),
                    },
                    model,
                    { upsert: true, new: true, setDefaultsOnInsert: true },
                    (err, doc) => {
                      if (err)
                        return resp
                          .status(200)
                          .send({ status: "error", message: err });
                      entities.push(doc);
                    }
                  );
                }
      
                if (entities.length) {
                  return resp.status(200).json({
                    status: "success",
                    message: "Payslip has been generated",
                  });
                }
              } else {
                return resp
                  .status(200)
                  .send({ status: "error", message: "No Entity Found" });
              }
            });
            */

      // await EmployeeMonthlyReport.find(
      //   {
      //     emp_db_id: { $in: emp_ids },
      //     wage_month: wage_month.toString(),
      //     wage_year: wage_year.toString(),
      //   },
      //   async (err, docs) => {
      //     if (err)
      //       return resp.status(200).send({ status: "error", message: err });
      //     if (docs.length) {
      //       let entities = [];
      //       for (const { _doc } of docs) {
      //         const {
      //           salary_report,
      //           incentive_report,
      //           bonus_report,
      //           ex_gratia_report,
      //           arrear_report,
      //           reimbursement,
      //           total_data,
      //           ot_report,
      //         } = _doc;

      //         let model = {
      //           emp_id: _doc.emp_id,
      //           corporate_id: req.authData.corporate_id,
      //           wage_month,
      //           wage_year,
      //           emp_data: _doc.emp_data || null,
      //           earnings: {},
      //           deductions: {
      //             epf_amount: total_data.pf_data.emoloyee_contribution,
      //             vpf_amount: null,
      //             esic_amount: total_data.esic_data.emoloyee_contribution,
      //             p_tax_amount: total_data.total_pt_amount,
      //             lwf_amount: null,
      //             tds_amount: null,
      //           },
      //           contribution: {
      //             epf_amount: total_data.pf_data.emoloyer_pf_contribution,
      //             eps_amount: total_data.pf_data.emoloyer_eps_contribution,
      //             admin_edli_amount:
      //               total_data.pf_data.emoloyer_edlis_admin_contribution,
      //             esic_amount: total_data.esic_data.emoloyer_contribution,
      //             lwf_amount: null,
      //           },
      //         };

      //         if (incentive_report)
      //           model.earnings["incentive_total_amount"] =
      //             incentive_report.gross_earning || 0;

      //         if (bonus_report)
      //           model.earnings["bonus_total_amount"] =
      //             bonus_report.gross_earning || 0;

      //         if (ex_gratia_report)
      //           model.earnings["ex_gratia_total_amount"] =
      //             ex_gratia_report.gross_earning || 0;

      //         if (arrear_report)
      //           model.earnings["arrear_total_amount"] =
      //             arrear_report.gross_earning || 0;

      //         if (ot_report)
      //           model.earnings["ot_total_amount"] =
      //             ot_report.gross_earning || 0;

      //         if (reimbursement)
      //           model.earnings["reimbursement_total_amount"] =
      //             reimbursement.gross_earning || 0;

      //         model.earnings["sub_total"] = Object.values(
      //           model.earnings
      //         ).reduce((a, b) => a + b, 0);
      //         model.earnings["salary_gross_earning"] = total_data.total_earning;

      //         model.gross_earning =
      //           model.earnings.sub_total + total_data.total_earning;
      //         model.net_pay = model.gross_earning;
      //         model.ctc =
      //           model.gross_earning +
      //             Object.values(model.contribution).reduce(
      //               (a, b) => a + b,
      //               0
      //             ) || null;
      //         model.earnings["salary_report_heads"] = salary_report.heads;

      //         await EmployeePayslip.findOneAndUpdate(
      //           { emp_id: model.emp_id, wage_month, wage_year },
      //           model,
      //           { upsert: true, new: true, setDefaultsOnInsert: true },
      //           (err, doc) => {
      //             if (err)
      //               return resp
      //                 .status(200)
      //                 .send({ status: "error", message: err });
      //             entities.push(doc);
      //           }
      //         );
      //       }

      //       if (entities.length) {
      //         return resp.status(200).json({
      //           status: "success",
      //           message: "Payslip has been generated",
      //         });
      //       }
      //     } else {
      //       return resp
      //         .status(200)
      //         .send({ status: "error", message: "No Entity Found" });
      //     }
      //   }
      // );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_generated_payslip_data: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
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
        search_option_details.$match["employee_payslips.wage_month"] = parseInt(wage_month);
        search_option_details.$match["employee_payslips.wage_year"] = parseInt(wage_year);
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
              from: "employee_payslips",
              "let": { "emp_db_idVar": "$emp_id" },
              "pipeline": [
                {
                  "$match": {
                    $and: [
                      { "$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] } },
                      { "wage_month": parseInt(wage_month) },
                      { "wage_year": parseInt(wage_year) },
                    ]
                  }
                }
              ],
              as: "employee_payslips",
            },
          },

          search_option_details,
          {
            $addFields: {
              employee_payslip: {
                $arrayElemAt: ["$employee_payslips", 0],
              },
              employee_detail: {
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
              client: {
                $arrayElemAt: ["$client", 0],
              },
              hod: {
                $arrayElemAt: ["$hod", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              payslip_temp_data: { $ifNull: ["$employee_detail.template_data.payslip_temp_data", null] },
              emp_data: "$employee_payslip.emp_data",
              earnings_data: "$employee_payslip.earnings",
              deductions_data: "$employee_payslip.deductions",
              contribution_data: "$employee_payslip.contribution",
              gross_earning: "$employee_payslip.gross_earning",
              net_pay: "$employee_payslip.net_pay",
              ctc: "$employee_payslip.ctc",
              pdf_file_name: "$employee_payslip.pdf_file_name",
              pdf_link: "$employee_payslip.pdf_link",
              status: "$employee_payslip.status",
              department: 1,
              designation: 1,
              client: 1,
              hod: 1,
              "deductions": 1,
              "earnings": 1,
              "contribution": 1
            },
          },
        ]);
        if (req.body.generate == 'yes') {
          var path_link = "";
          myAggregate.then(async (salary_slips) => {
            let file_name = 'salary-pay-slip-' + wage_month + '-' + wage_year + ".zip";
            let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/salary-module');
            if (salary_slips.length > 0) {
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
              await Promise.all(salary_slips.map(async function (salary_slip) {

                if (salary_slip && salary_slip.pdf_file_name) {
                  var path_link = absolutePath + salary_slip.pdf_link;

                  if (fs.existsSync(path_link)) {
                    archive.append(fs.createReadStream(path_link), { name: salary_slip.pdf_file_name });
                  }
                }
              })).then(async (emp) => {
                archive.finalize();
                // file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/salary_pay_slip/";
                await Site_helper.downloadAndDelete(file.file_name, file.location, req.authData.corporate_id, resp);
                // path_link = baseurl+'storage/company/temp_files/'+req.authData.corporate_id+'/salary_pay_slip/salary-pay-slip-'+wage_month+'-'+wage_year+'.zip';
                // return resp.status(200).json({ status: "success",  message: 'Salary pay slip archive successfully.', url:path_link});
              });
            }
            else {
              return resp.status(200).json({ status: "error", message: 'Salary pay slip archive not successfully.', url: path_link });
            }
          });
        }
        else {
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
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  download_payslip_data: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
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
        search_option_details.$match["employee_payslips.wage_month"] = parseInt(wage_month);
        search_option_details.$match["employee_payslips.wage_year"] = parseInt(wage_year);
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
              from: "employee_payslips",
              "let": { "emp_db_idVar": "$emp_id" },
              "pipeline": [
                {
                  "$match": {
                    $and: [
                      { "$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] } },
                      { "wage_month": parseInt(wage_month) },
                      { "wage_year": parseInt(wage_year) },
                    ]
                  }
                }
              ],
              as: "employee_payslips",
            },
          },

          search_option_details,
          {
            $addFields: {
              employee_payslip: {
                $arrayElemAt: ["$employee_payslips", 0],
              },
              employee_detail: {
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
              client: {
                $arrayElemAt: ["$client", 0],
              },
              hod: {
                $arrayElemAt: ["$hod", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              payslip_temp_data: { $ifNull: ["$employee_detail.template_data.payslip_temp_data", {}] },
              emp_data: "$employee_payslip.emp_data",
              earnings_data: "$employee_payslip.earnings",
              deductions_data: "$employee_payslip.deductions",
              contribution_data: "$employee_payslip.contribution",
              gross_earning: "$employee_payslip.gross_earning",
              net_pay: "$employee_payslip.net_pay",
              ctc: "$employee_payslip.ctc",
              pdf_file_name: "$employee_payslip.pdf_file_name",
              pdf_link: "$employee_payslip.pdf_link",
              status: "$employee_payslip.status",
              department: 1,
              designation: 1,
              client: 1,
              hod: 1,
              "deductions": 1,
              "earnings": 1,
              "contribution": 1
            },
          },
        ]);
        myAggregate.then(async (payslips) => {
          if (payslips.length > 0) {
            await Promise.all(payslips.map(async function (payslip, index) {
              // var month_name = moment().month(wage_month).format("MMM").toLowerCase();
              // var year = wage_year;
              file_name = payslip.pdf_file_name;
              file_path = payslip.pdf_link;
              var dir = absolutePath + file_path;
              if (fs.existsSync(dir)) {
                await Site_helper.driect_download(file_path, req.authData.corporate_id, resp);
              }
              else {
                return resp.status(200).json({
                  status: "success",
                  message: "File not exist in our server.",
                });
              }
            }));
          }
          else {
            return resp.status(200).json({ status: "success", message: "Something went wrong.", });
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
  send_payslip_by_id: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        payslip_id: "required",
        smtp_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {
        Employee.aggregate(
          [
            {
              $match: {
                _id: mongoose.Types.ObjectId(req.body.payslip_id)
              }
            },
            {
              $lookup: {
                from: "employee_payslips",
                localField: "emp_id",
                foreignField: "emp_id",
                as: "employee_payslips",
              }
            },
            {
              $addFields: {
                employee_payslip: {
                  $arrayElemAt: ["$employee_payslips", 0],
                },
              },
            },
            {
              $project: {
                email_id: 1,
                _id: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                pdf_file_name: "$employee_payslip.pdf_file_name",
                pdf_link: "$employee_payslip.pdf_link",
                wage_month: "$employee_payslip.wage_month",
                wage_year: "$employee_payslip.wage_year"
              }
            }


          ]
        ).then(async (employees) => {
          var employee = employees[0];
          //var emp_payslip=await EmployeePayslip.findById(req.body.payslip_id);
          var attachments = [
            {
              filename: employee.pdf_file_name,
              path: file_path + employee.pdf_link,
            }
          ];
          const wage_month = new Date(
            new Date().getFullYear(),
            employee.wage_month,
            1
          )
          var email_subject = 'payslip-' + wage_month.toLocaleString("default", { month: "short" }).toLowerCase() + '-' + employee.wage_year;
          var email_body = `Attached is your payslip for ${wage_month.toLocaleString("default", { month: "long" })},${employee.wage_year}.`
          if (employee.email_id) {
            // var return_data;
            await EmailHelper.send_email(req.body.smtp_id, employee.email_id, email_subject, email_body, null, attachments);
            return resp.status(200).json({ status: "success", message: "Payslip has been sent successfully.", });
          } else {
            return resp.status(200).json({ status: "success", message: "Employee email required to perform this action.", });
          }
        })

      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  send_payslip_bulk: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        wage_month: "required",
        wage_year: "required",
        smtp_id: "required",
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
            ids = ids.map(function (el) { return mongoose.Types.ObjectId(el) })
            search_option.$match._id = { $nin: ids }
          }
        }
        else {
          var ids = JSON.parse(req.body.checked_row_ids);
          if (ids.length > 0) {
            ids = ids.map(function (el) { return mongoose.Types.ObjectId(el) })
            search_option.$match._id = { $in: ids }
          }
        }

        search_option_details.$match["employee_payslips.wage_month"] = parseInt(wage_month);
        search_option_details.$match["employee_payslips.wage_year"] = parseInt(wage_year);

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
              from: "employee_payslips",
              "let": { "emp_db_idVar": "$emp_id" },
              "pipeline": [
                {
                  "$match": {
                    $and: [
                      { "$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] } },
                      { "wage_month": parseInt(wage_month) },
                      { "wage_year": parseInt(wage_year) },
                    ]
                  }
                }
              ],
              as: "employee_payslips",
            },
          },

          search_option_details,
          {
            $addFields: {
              employee_payslip: {
                $arrayElemAt: ["$employee_payslips", 0],
              },
              employee_detail: {
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
              client: {
                $arrayElemAt: ["$client", 0],
              },
              hod: {
                $arrayElemAt: ["$hod", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              email_id: 1,
              payslip_temp_data: { $ifNull: ["$employee_detail.template_data.payslip_temp_data", {}] },
              emp_data: "$employee_payslip.emp_data",
              earnings_data: "$employee_payslip.earnings",
              deductions_data: "$employee_payslip.deductions",
              contribution_data: "$employee_payslip.contribution",
              gross_earning: "$employee_payslip.gross_earning",
              net_pay: "$employee_payslip.net_pay",
              ctc: "$employee_payslip.ctc",
              pdf_file_name: "$employee_payslip.pdf_file_name",
              pdf_link: "$employee_payslip.pdf_link",
              wage_month: "$employee_payslip.wage_month",
              wage_year: "$employee_payslip.wage_year",
              department: 1,
              designation: 1,
              client: 1,
              hod: 1,
              "deductions": 1,
              "earnings": 1,
              "contribution": 1
            },
          },
        ]).then(async (emps) => {
          await Promise.all(emps.map(async function (employee) {
            var attachments = [];
              if (fs.existsSync(file_path + employee.pdf_link)) {
              attachments.push({
                filename: employee.pdf_file_name,
                path: file_path + employee.pdf_link,
              })
            }

            const wage_month = new Date(
              new Date().getFullYear(),
              employee.wage_month,
              1
            )
            var email_subject = 'payslip-' + wage_month.toLocaleString("default", { month: "short" }).toLowerCase() + '-' + employee.wage_year;
            var email_body = `Attached is your payslip for ${wage_month.toLocaleString("default", { month: "long" })},${employee.wage_year}.`
            // var email_subject='payslip-'+empdata.wage_month+'-'+empdata.wage_year;
            // var email_body = `Attached is your payslip for ${wage_month.toLocaleString("default", { month: "long" })},${employee.wage_year}.` 


            // if(employee.email_id && attachments.length){
            //   await EmailHelper.send_email(req.body.smtp_id,employee.email_id,email_subject,email_body,null,attachments);
            // }


            if (employee.email_id && attachments.length) {
              const maildata = {
                to_mail: employee.email_id,
                subject: 'payslip-' + wage_month.toLocaleString("default", { month: "short" }).toLowerCase() + '-' + employee.wage_year,
                body: `Attached is your payslip for ${wage_month.toLocaleString("default", { month: "long" })}, ${employee.wage_year}.`,
                attachments: attachments
              };

              console.log("first");
              // const smtp =  smtp_setup.findOne({
              //   corporate_id: "VBL",
              // });
              // console.log(smtp, "amansmtp");
              // // console.log(maildata, "aman11", smtp);
              // // Config.sendEmail(smtp, email)
              var corporate_id="VBL";
              smtpcredintials(corporate_id, maildata)

              
              // await config.sendEmail(smtp, maildata);


            }

            // var return_data= await EmailHelper.send_email(req.body.smtp_id,empdata.email_id,email_subject,'email content',attachments);
          })).then(async (comp_emp) => {
            return resp.status(200).json({ status: "success", message: 'Payslip has been sent successfully', });
          })
        })
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
    // try {
    //   const v = new Validator(req.body, {
    //     wage_month: "required",
    //     wage_year: "required",
    //   });
    //   const matched = await v.check();
    //   if (!matched) {
    //       return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //   }
    //   else{
    //       var emp_payslip=await EmployeePayslip.findById(req.body.payslip_id);

    //       var attachments =[ 
    //           {
    //             filename: emp_payslip.pdf_file_name,
    //             path: file_path+emp_payslip.pdf_link,
    //           }
    //       ];
    //       var email_subject='payslip-'+emp_payslip.wage_month+'-'+emp_payslip.wage_year;
    //       var return_data= await EmailHelper.send_email(req.body.smtp_id,'debasisjana77@yopmail.com',email_subject,'email content',attachments);
    //       return resp.status(200).json({status: "success",message:"Payslip has been sent successfully",});

    //   }
    // } catch (e) {
    //   return resp.status(200).json({
    //     status: "error",
    //     message: e ? e.message : "Something went wrong",
    //   });
    // }
  },

  generate_verification_code: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        corporateid: "required",
        userid: "required"
      });
      console.log("happy hack");

      const matched = await v.check();

      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }

      const { corporateid, userid } = req.body;

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      return resp.status(200).json({
        status: "success",
        message: "Code generated successfully",
        data: {
          corporateid,
          userid,
          code
        }
      });

    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong"
      });
    }
  }


};