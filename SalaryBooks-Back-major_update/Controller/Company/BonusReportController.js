var BonusTemp = require("../../Model/Admin/BonusTemp");
const { Validator } = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var Employee = require("../../Model/Company/employee");
var BonusModule = require("../../Model/Company/BonusModule");
var Ptaxrule = require("../../Model/Admin/Ptaxrule");
const mongoose = require("mongoose");
var EmployeeMonthlyReport = require("../../Model/Company/EmployeeMonthlyReport");
var Company = require("../../Model/Admin/Company");
var CompanyDetails = require("../../Model/Admin/Company_details");
const EmployeeSheetTemplate=require('../../Model/Company/EmployeeSheetTemplate');
const BonusPayslip=require('../../Model/Company/BonusPayslip');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const moment = require('moment');
const archiver = require('archiver');
const {resolve} = require('path');
const absolutePath = resolve('');
module.exports = {
  get_bonus_form: async function (req, resp, next) {
    const v = new Validator(req.body, {
      disbursement_frequency: "required",
      disbursement_type: "required",
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
    }
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
      search_option_details.$match["employee_details.template_data.bonus_temp_data.disbursement_frequency"] = {$eq: req.body.disbursement_frequency};
      search_option_details.$match["employee_details.template_data.bonus_temp_data.disbursement_type"] = {$eq:req.body.disbursement_type};
    }
    var attendance_month = req.body.attendance_month;
    var attendance_year = req.body.attendance_year;
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
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { "$match": { $and :[
            {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
            {"wage_month": parseInt(attendance_month)},
            {"wage_year": parseInt(attendance_year)},
            ] } }
            ],
            as: "employee_monthly_reports",
          },
        },
        search_option_details,
        {
          $lookup: {
            from: "bonus_modules",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "bonus_module",
          },
        },

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
            "employee_details.employment_hr_details": 1,
            "employee_details.template_data.bonus_temp_data": 1,
            bonus_module: 1,
            employee_monthly_reports: {
              bank_ins_referance_id:
              "$employee_monthly_reports.bonus_report.bank_ins_referance_id",
              pf_challan_referance_id:
              "$employee_monthly_reports.bonus_report.pf_challan_referance_id",
              esic_challan_referance_id:
              "$employee_monthly_reports.bonus_report.esic_challan_referance_id",
            },
          },
        },
        ]);
    Employee.aggregatePaginate(
      myAggregate,
      options,
      async function (err, employees) {
        if (err) return resp.json({ status: "error", message: err.message });
        return resp
        .status(200)
        .json({ status: "success", employees: employees });
      }
      );
  },
  get_bonus_monthly_wise: async function (req, resp, next) {
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
    var wage_month = parseInt(req.body.attendance_month);
    var wage_year = parseInt(req.body.attendance_year);

    search_option_details.$match["bonus_module"] = { "$exists": true , $ne: [] };
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
      {$unwind:'$employee_details'},
      {
        $lookup: {
          from: "employee_monthly_reports",
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { "$match": { $and :[
            {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
            {"wage_month": wage_month},
            {"wage_year": wage_year},
            ] } }
            ],
            as: "employee_monthly_reports",
          },
        },
        {
          $lookup: {
            from: "bonus_modules",
            let: { emp_db_idVar: "$emp_id",disbursementFrequency: "$employee_details.template_data.bonus_temp_data.disbursement_frequency", },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$emp_id", "$$emp_db_idVar"] },
                      {
                        $or: [
                          {
                            $eq: [
                              "$$disbursementFrequency",
                              "monthly"
                            ]
                          },
                          {
                            $and: [
                              { $eq: ["$bonus_g_month", wage_month] },
                              { $eq: ["$bonus_g_year", wage_year] }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: "bonus_module"
          }
        },
        search_option_details,
        {
          $addFields: {
            // employee_details: {
            //   $arrayElemAt: ["$employee_details", 0],
            // },
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
            "employee_details.employment_hr_details": 1,
            "employee_details.template_data.bonus_temp_data": 1,
            bonus_module: 1,
            employee_monthly_reports: {
              bank_ins_referance_id:
              "$employee_monthly_reports.bonus_report.bank_ins_referance_id",
              pf_challan_referance_id:
              "$employee_monthly_reports.bonus_report.pf_challan_referance_id",
              esic_challan_referance_id:
              "$employee_monthly_reports.bonus_report.esic_challan_referance_id",
            },
          },
        },
        ]);
    Employee.aggregatePaginate(
      myAggregate,
      options,
      async function (err, employees) {
        if (err) return resp.json({ status: "error", message: err.message });
        return resp
        .status(200)
        .json({ status: "success", employees: employees });
      }
      );
  },
  update_bonus_data: async function (req, resp, next) {
    const v = new Validator(req.body, {
      bonus_value: "required",
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
        // {
        //   $lookup: {
        //     from: "branches",
        //     localField: "employee_details.employment_hr_details.branch",
        //     foreignField: "_id",
        //     as: "branch",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "designations",
        //     localField: "employee_details.employment_hr_details.designation",
        //     foreignField: "_id",
        //     as: "designation",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "departments",
        //     localField: "employee_details.employment_hr_details.department",
        //     foreignField: "_id",
        //     as: "department",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "employees_attendances",
        //     localField: "emp_id",
        //     foreignField: "emp_id",
        //     as: "attendance",
        //   },
        // },
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
            // corporate_id: 1,
            // userid: 1,
            emp_id: 1,
            // emp_first_name: 1,
            // emp_last_name: 1,
            // emp_dob: 1,
            // pan_no: 1,
            // aadhar_no: 1,
            // email_id: 1,
            // empid: 1,
            // client_code: 1,
            // approval_status: 1,
            // employee_details: 1,
          },
        },
      ]).then(async (emps) => {
        // var dateObj = new Date();
        // var bonus_month = dateObj.getUTCMonth();
        // var bonus_year = dateObj.getUTCFullYear();
        var bonus_data = [];
        await Promise.all(
          emps.map(async (empdata) => {
            //console.log(empdata)
            // if (empdata.employee_details)
            //   if (empdata.employee_details.template_data)
            //     var bonus_temp_data = empdata.employee_details.template_data
            //   .bonus_temp_data
            //   ? empdata.employee_details.template_data.bonus_temp_data
            //   : null;
            //console.log(bonus_temp_data)
            // var date_of_join =
            // empdata.employee_details.employment_hr_details.date_of_join;
            // var gross_salary = parseFloat(
            //   empdata.employee_details.employment_hr_details.gross_salary
            //   );
            // var bonus_value = parseFloat(req.body.bonus_value);
            // var exgratia_status = req.body.exgratia_status;
            // var bonus_wages = 6000;
            // var gov_calculate_bonus =
            // (bonus_temp_data.max_bonus_wage * bonus_temp_data.max_bonus) /
            // 100;
            // var bonus_amount = 0;
            // var exgratia_amount = 0;
            //var month_diff=getMonthDifference(new Date(date_of_join),new Date());
            var document = {
              corporate_id: req.authData.corporate_id,
              emp_id: empdata.emp_id,
              bonus_value: parseFloat(req.body.bonus_value),
              bonus_from_month: req.body.bonus_from_month,
              bonus_from_year: req.body.bonus_from_year,
              bonus_to_month: req.body.bonus_to_month,
              bonus_to_year: req.body.bonus_to_year,
              exgratia: req.body.exgratia_status,
              status: "active",
              genarete_bonus_value: 0,
              generate_exgratia: 0,
              bonus_g_month: req.body.bonus_g_month,
              bonus_g_year: req.body.bonus_g_year,
              updated_at: Date.now(),
            };
            await BonusModule.updateOne(
              { emp_id: empdata.emp_id },
              document,
              { upsert: true, new: true },
              function (err, BonusModule) {
                if (err)
                  return resp
                    .status(200)
                    .send({ status: "error", message: err.message });
              }
            );
          })
        ).then((value) => {
          return resp.status(200).send({
            status: "success",
            message: "Bonus generated successfully",
            bonus_data: bonus_data,
            emps: emps,
          });
        });
      });
    }
  },
    generate_bonus_sheet: async function (req, resp, next) {
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
    // search_option_details.$match["employee_monthly_reports.salary_report"] = {
    //   $exists: true,
    // };
    var attendance_month = parseInt(req.body.attendance_month);
    var attendance_year = parseInt(req.body.attendance_year);

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
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { "$match": { $and :[
            {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
            {"wage_month": attendance_month},
            {"wage_year": attendance_year},
            ] } }
            ],
            as: "employee_monthly_reports",
          },
        },

        search_option_details,

        {
          $lookup: {
            from: "bonus_modules",
            let: { emp_id_var: "$emp_id" },
            pipeline: [
            {
              $match: {
                $and: [{ $expr: { $eq: ["$emp_id", "$$emp_id_var"] } }],
              },
            },
            ],
            as: "bonus_module",
          },
        },
        {
          $unwind: "$bonus_module",
        },

        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            employee_monthly_reports: {
              $arrayElemAt: ["$employee_monthly_reports", 0],
            },
          // "bonus_module": {
          //     "$arrayElemAt": [ "$bonus_module", 0 ]
          // }
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
          bonus_module: 1,
          employee_monthly_reports: 1,
        },
      },
      ]).then(async (emps) => {
      // return resp
      //     .status(200)
      //     .send({
      //       status: "success",
      //       message: emps,
      //     });
      var bonus_data = [];
      var currdate = new Date();
      var epfo_temp = await Site_helper.get_gov_epfo_data(req);
      var esic_temp = await Site_helper.get_gov_esic_data(req);
      var wage_month = req.body.attendance_month;
      var wage_year = req.body.attendance_year;
      await Promise.all(
        emps.map(async (empdata) => {
          //console.log(empdata)
          if (empdata.employee_details)
            if (empdata.employee_details.template_data)
              var pre_total_pt = 0;
            var pre_bonus_pt = 0;
            var total_pay_days = 0;
            var pre_monthly_pt_wage_amount = 0;
            var pre_module_pt=0;
            var bonus_temp_data = empdata.employee_details.template_data.bonus_temp_data ? empdata.employee_details.template_data.bonus_temp_data : null;
            var bonus_module = "";
            var emp_state = empdata.employee_details.emp_address.state;
            var date_of_join =  empdata.employee_details.employment_hr_details.date_of_join;
            var gross_salary = parseFloat( empdata.employee_details.employment_hr_details.gross_salary );
            if (empdata.bonus_module) {
              var pre_earning_data = empdata.employee_monthly_reports;
              var bonus_return_val = await Site_helper.calculate_bonus( bonus_temp_data, date_of_join, gross_salary, empdata.bonus_module, req.companyData,parseInt(wage_month), parseInt(wage_year) );
              if (bonus_temp_data.disbursement_type == "percent") {
                var bonus_working_day_return_val =
                await Site_helper.calculate_bonus_working_day(
                  empdata.bonus_module.bonus_from_month,
                  empdata.bonus_module.bonus_from_year,
                  empdata.bonus_module.bonus_to_month,
                  empdata.bonus_module.bonus_to_year,
                  empdata.emp_id
                  );
                total_pay_days = bonus_working_day_return_val[0] ? bonus_working_day_return_val[0].total_paydays : 0;
              }
              var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;
              var total_earning = ((bonus_return_val.bonus_amount + bonus_return_val.exgratia_amount) );
              var exgratia_amount= bonus_return_val.exgratia_amount;

              var advance_recovery_data=await Site_helper.get_advance_recovery_data(empdata.emp_id,empdata.corporate_id,wage_month,wage_year,total_earning,'bonus');
              var gross_earning = advance_recovery_data.available_module_amount;
              var advance_recovered = advance_recovery_data.advance_recovered;

              var bonus_value = advance_recovery_data.available_module_amount;
              var pre_salary_data=empdata.employee_monthly_reports;
              var pre_monthly_wage_amount=0;
              if(pre_salary_data)
              {
                if(pre_salary_data.bonus_report)
                {
                  pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.bonus_report.total_pf_wages);                     
                }
                else
                {
                  pre_monthly_wage_amount= pre_salary_data.total_data.total_pf_wages;
                }
              }
              if(salary_temp_data.restricted_pf === "yes")
              {
                var template_wage_ceiling = parseFloat(epfo_temp.wage_ceiling);
                var avaiable_wage_amount= (template_wage_ceiling - pre_monthly_wage_amount);
                var module_wage_amount=(bonus_value < parseFloat(avaiable_wage_amount) ? bonus_value  : parseFloat(avaiable_wage_amount) );

              }
              else
              {
                var module_wage_amount= bonus_value;
              }
              var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? bonus_value : 0 );
              var total_tds_wages = 0;
              if(bonus_temp_data.tds_apply == 'yes'){
                total_tds_wages = bonus_value;
              }
              var bonus_data={
                ctc:bonus_value,
                total_pf_bucket:bonus_value,
                total_pf_wages:module_wage_amount,
                total_esic_bucket:bonus_value,
                total_esic_wages:restrict_esic_wages,
                total_tds_wages:total_tds_wages,
                total_pt_wages:bonus_value,
                overtime_wages:bonus_value,
                gross_earning:bonus_value,
                exgratia_amount: exgratia_amount,
                bonus_wages: total_earning,
                total_deduction: advance_recovered,
                advance_recovered:advance_recovered,
                module_data: empdata.bonus_module,
                total_pay_days: total_pay_days,
                bank_ins_referance_id:'',
                pf_challan_referance_id:'',
                esic_challan_referance_id:'',
                pf_generate: 'no',
                esic_generate: 'no',
              };
              if(pre_salary_data)
              {
                pre_total_pt = (pre_salary_data.total_data.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);
                if(pre_salary_data.bonus_report)
                {
                  pre_module_pt = (pre_salary_data.bonus_report.pt_amount?pre_salary_data.bonus_report.pt_amount:0);
                  var total_earning_data={ 
                    'total_earning': (bonus_data.gross_earning + (  pre_salary_data.total_data.total_earning - pre_salary_data.bonus_report.gross_earning)),
                    'total_ctc': (bonus_data.ctc + (  pre_salary_data.total_data.total_ctc - pre_salary_data.bonus_report.ctc)),
                    'total_pf_bucket':(bonus_data.total_pf_bucket + (pre_salary_data.total_data.total_pf_bucket -  pre_salary_data.bonus_report.total_pf_bucket)),
                    'total_pf_wages':(bonus_data.total_pf_wages + ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.bonus_report.total_pf_wages)),
                    'total_esic_bucket':(bonus_data.total_esic_bucket + (pre_salary_data.total_data.total_esic_bucket - pre_salary_data.bonus_report.total_esic_bucket)),
                    'total_esic_wages':(bonus_data.total_esic_wages +  (pre_salary_data.total_data.total_esic_wages - pre_salary_data.bonus_report.total_esic_wages)),
                    'total_tds_wages':(bonus_data.total_tds_wages +  (pre_salary_data.total_data.total_tds_wages - pre_salary_data.bonus_report.total_tds_wages)),
                    'total_pt_wages':(bonus_data.total_pt_wages + (pre_salary_data.total_data.total_pt_wages - pre_salary_data.bonus_report.total_pt_wages)),
                    'bank_ins_referance_id':pre_salary_data.total_data.bank_ins_referance_id == '' ? '' :  pre_salary_data.total_data.bank_ins_referance_id,
                    'pf_challan_referance_id':pre_salary_data.total_data.pf_challan_referance_id == '' ? '' :  pre_salary_data.total_data.pf_challan_referance_id,
                    'esic_challan_referance_id':pre_salary_data.total_data.esic_challan_referance_id == '' ? '' :  pre_salary_data.total_data.esic_challan_referance_id,
                  };
                }
                else
                {
                  var total_earning_data={ 
                    'total_earning':  (bonus_data.gross_earning +   pre_salary_data.total_data.total_earning),
                    'total_ctc': (bonus_data.ctc +   pre_salary_data.total_data.total_ctc),
                    'total_pf_bucket':(bonus_data.total_pf_bucket + pre_salary_data.total_data.total_pf_bucket),
                    'total_pf_wages': (bonus_data.total_pf_wages +  pre_salary_data.total_data.total_pf_wages),
                    'total_esic_bucket': (bonus_data.total_esic_bucket + pre_salary_data.total_data.total_esic_bucket),
                    'total_esic_wages': (bonus_data.total_esic_wages +  pre_salary_data.total_data.total_esic_wages),
                    'total_tds_wages': (bonus_data.total_tds_wages +  pre_salary_data.total_data.total_tds_wages),
                    'total_pt_wages': (bonus_data.total_pt_wages + pre_salary_data.total_data.total_pt_wages),
                    'bank_ins_referance_id': '' ,
                    'pf_challan_referance_id': '' ,
                    'esic_challan_referance_id': '' ,
                  };
                } 
              }
              else
              {
                var total_earning_data={ 
                  'total_earning':  bonus_data.gross_earning,
                  'total_ctc': bonus_data.ctc,
                  'total_pf_bucket':bonus_data.total_pf_bucket,
                  'total_pf_wages': bonus_data.total_pf_wages,
                  'total_esic_bucket': bonus_data.total_esic_bucket,
                  'total_esic_wages': bonus_data.total_esic_wages,
                  'total_tds_wages': bonus_data.total_tds_wages,
                  'total_pt_wages': bonus_data.total_pt_wages,
                  'bank_ins_referance_id': '' ,
                  'pf_challan_referance_id': '' ,
                  'esic_challan_referance_id': '' ,
                };
              }
              bonus_data.esic_data =await Site_helper.calculate_esic(esic_temp, bonus_data.total_esic_wages,gross_salary);
              bonus_data.pf_data = await Site_helper.calculate_pf( epfo_temp, bonus_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);

              total_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages,gross_salary);
              total_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);                

              var p_tax_amount = await Site_helper.calculate_pt(req,currdate,emp_state,total_earning_data.total_pt_wages?total_earning_data.total_pt_wages:0);                
              var module_pt_amount= (p_tax_amount - (pre_total_pt - pre_module_pt));
              bonus_data.pt_amount= module_pt_amount;
              total_earning_data.total_pt_amount= p_tax_amount;
              var insert_data={
                corporate_id:empdata.corporate_id,
                emp_db_id:mongoose.Types.ObjectId(empdata._id),
                emp_id: empdata.emp_id,
                wage_month:attendance_month,
                wage_year:attendance_year,
                bonus_report:bonus_data,
                total_data:total_earning_data,
                status:'active',
              }
              var where_condition={'emp_id':empdata.emp_id,wage_month:wage_month,wage_year:wage_year,corporate_id:empdata.corporate_id};
              await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});    
              







            /*
            var gross_earning = advance_recovery_data.available_module_amount;
            var advance_recovered = advance_recovery_data.advance_recovered;
            var bonus_earning_data = {
              total_pf_bucket: bonus_return_val.bonus_amount,
              total_pf_wages: module_wage_amount,
              total_esic_bucket: bonus_return_val.bonus_amount,
              total_esic_wages: restrict_esic_wages,
              total_pt_wages: bonus_return_val.bonus_amount,
              exgratia_amount: bonus_return_val.exgratia_amount,
              bonus_wages: bonus_return_val.bonus_amount + bonus_return_val.exgratia_amount,
              gross_earning: gross_earning,
              total_deduction: advance_recovered,
              advance_recovered:advance_recovered,
              bank_ins_referance_id: "",
              pf_challan_referance_id: "",
              esic_challan_referance_id: "",
              module_data: empdata.bonus_module,
              total_pay_days: total_pay_days,
            };

            if (pre_earning_data) {
              pre_total_pt = pre_earning_data.total_data.total_pt_amount;
              pre_monthly_pt_wage_amount =
                pre_earning_data.total_data.total_pt_wages;
              if (pre_earning_data.bonus_report) {
                pre_bonus_pt = pre_earning_data.bonus_report.pt_amount;
                var total_earning_data = {
                  "total_data.total_earning": pre_earning_data.bonus_report
                    ? bonus_earning_data.gross_earning -
                      pre_earning_data.bonus_report.gross_earning
                    : bonus_earning_data.gross_earning,
                  "total_data.total_pf_bucket": pre_earning_data.bonus_report
                    ? bonus_earning_data.total_pf_wages -
                      pre_earning_data.bonus_report.total_pf_bucket
                    : bonus_earning_data.total_pf_wages,
                  "total_data.total_pf_wages": pre_earning_data.bonus_report
                    ? module_wage_amount -
                      pre_earning_data.bonus_report.total_pf_wages
                    : module_wage_amount,
                  "total_data.total_esic_bucket": pre_earning_data.bonus_report
                    ? bonus_earning_data.total_esic_bucket -
                      pre_earning_data.bonus_report.total_esic_bucket
                    : bonus_earning_data.total_esic_bucket,
                  "total_data.total_esic_wages": pre_earning_data.bonus_report
                    ? bonus_earning_data.total_esic_wages -
                      pre_earning_data.bonus_report.total_esic_wages
                    : bonus_earning_data.total_esic_wages,
                  "total_data.total_pt_wages": pre_earning_data.bonus_report
                    ? bonus_earning_data.total_pt_wages -
                      pre_earning_data.bonus_report.total_pt_wages
                    : bonus_earning_data.total_pt_wages,
                };
              } else {
                var total_earning_data = {
                  "total_data.total_earning": bonus_earning_data.gross_earning,
                  "total_data.total_pf_bucket":
                    bonus_earning_data.total_pf_wages,
                  "total_data.total_pf_wages": module_wage_amount,
                  "total_data.total_esic_bucket":
                    bonus_earning_data.total_esic_bucket,
                  "total_data.total_esic_wages":
                    bonus_earning_data.total_esic_wages,
                  "total_data.total_pt_wages":
                    bonus_earning_data.total_pt_wages,
                };
              }
            } else {
              var total_earning_data = {
                "total_data.total_earning": bonus_earning_data.gross_earning,
                "total_data.total_pf_bucket": bonus_earning_data.total_pf_wages,
                "total_data.total_pf_wages": module_wage_amount,
                "total_data.total_esic_bucket":bonus_earning_data.total_esic_bucket,
                "total_data.total_esic_wages": bonus_earning_data.total_esic_wages,
                "total_data.total_pt_wages": bonus_earning_data.total_pt_wages,
              };
            }
            bonus_earning_data.esic_data = await Site_helper.calculate_esic(
              esic_temp,
              bonus_earning_data.total_esic_wages,
              gross_salary
            );
            bonus_earning_data.pf_data = await Site_helper.calculate_pf(
              await epfo_temp,
              bonus_earning_data.total_pf_wages,
              salary_temp_data,
              empdata.employee_details.employment_hr_details
            );

            var total_esic_wages = pre_monthly_wage_amount + total_earning_data["total_data.total_esic_wages"];
            var total_pf_wages = pre_monthly_wage_amount +  total_earning_data["total_data.total_pf_wages"];
            var total_pt_wages =  pre_monthly_pt_wage_amount +  total_earning_data["total_data.total_pf_wages"];

            //console.log(total_esic_wages,total_pf_wages,total_earning_data.total_data.total_esic_wages,total_earning_data.total_pf_wages)
            var total_earning_data_esic_data = await Site_helper.calculate_esic(
              esic_temp,
              total_esic_wages,
              gross_salary
            );
            var total_earning_data_pf_data = await Site_helper.calculate_pf(
              await epfo_temp,
              total_pf_wages,
              salary_temp_data,
              empdata.employee_details.employment_hr_details
            );

            var p_tax_amount = await Site_helper.calculate_pt(
              req,
              currdate,
              emp_state,
              total_pt_wages ? total_pt_wages : 0
            );

            //console.log(pre_total_pt,pre_bonus_pt,p_tax_amount);
            var module_pt_amount = p_tax_amount - (pre_total_pt - pre_bonus_pt);
            bonus_earning_data.pt_amount = module_pt_amount;
            total_earning_data['total_data.total_pt_amount'] = (p_tax_amount - pre_total_pt);
            //total_earning_data.total_data.total_pt_amount = (p_tax_amount - pre_total_pt);

            //console.log(pf_return_val,esic_amount);
            var where_condition = {
              emp_id: empdata.emp_id,
              wage_month: wage_month,
              wage_year: wage_year,
              corporate_id: empdata.corporate_id,
            };

            var insert_data = {
              corporate_id: empdata.corporate_id,
              emp_db_id: mongoose.Types.ObjectId(empdata._id),
              emp_id: empdata.emp_id,
              wage_month: wage_month,
              wage_year: wage_year,
              bonus_report: bonus_earning_data,
              "total_data.total_esic_data": total_earning_data_esic_data,
              "total_data.pf_data": total_earning_data_pf_data,
              status: "active",
            };
            await EmployeeMonthlyReport.findOneAndUpdate(
              where_condition,
              insert_data,
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            await EmployeeMonthlyReport.updateOne(where_condition, {
              $inc: total_earning_data,
            }); */
          }
        })
).then((value) => {
  next();
  // return resp
  // .status(200)
  // .send({
  //   status: "success",
  //   message: "Bonus sheet generated successfully",
  // });
});
});
},
get_bonus_sheet_data: async function (req, resp) {
  try {
    const v = new Validator(req.body, {
      // wage_month: "required",
      // wage_year: "required",
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

      // var wage_month = req.body.wage_month;
      // var wage_year = req.body.wage_year;
      // if(req.body.wage_year){
      //   var from_wage_month = +req.body.wage_month ? +req.body.wage_month : new Date().getMonth() - 1;
      //   var from_wage_year = req.body.wage_year ? req.body.wage_year : new Date().getFullYear();
      //   var to_wage_month = +req.body.wage_month ? +req.body.wage_month : new Date().getMonth() - 1;
      //   var to_wage_year = req.body.wage_year ? req.body.wage_year : new Date().getFullYear();
      // }
      // else{ 
      //   var from_wage_month = parseInt(+req.body.wage_month_from);
      //   var from_wage_year = parseInt(+req.body.wage_year_from);
      //   var to_wage_month = parseInt(+req.body.wage_month_to);
      //   var to_wage_year = parseInt(+req.body.wage_year_to);
      // }

      var wage_month = req.body.wage_month;
      var wage_year = req.body.wage_year;
      var from_wage_month = req.body.wage_month_from ;
      var from_wage_year = req.body.wage_year_from;
      var to_wage_month = req.body.wage_month_to ;
      var to_wage_year = req.body.wage_year_to ;

      if(wage_month && wage_year){
        var lookupSearchOptions = 
          [{"wage_month": parseInt(wage_month)},
          {"wage_year": parseInt(wage_year)},]
        
      }else{
        var lookupSearchOptions = [
          {$or:[ 
            {'wage_year': {$gt: parseInt(from_wage_year) }}, 
            { $and:[
                {'wage_year': {$gte: parseInt(from_wage_year) }},
                {'wage_month': {$gte: parseInt(from_wage_month) }}
                ]
            } 
            ]
          },
          { $or:[ 
              {'wage_year': {$lt: parseInt(to_wage_year) }}, 
              { $and:[
                  {'wage_year': {$lte: parseInt(to_wage_year) }},
                  {'wage_month': {$lte: parseInt(to_wage_month) }}
                  ]
              } 
              ]
          }
        ]
      }


      
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
      var document =  {};
      var search_option = {
        $match: {
          $and: [
          { corporate_id: req.authData.corporate_id },
          { parent_hods: { $in: [req.authData.user_id] } },
          { approval_status: {$in :["approved","active"] } },
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
        //console.log(query_data);
        // search_option_details.$match["employee_monthly_reports.wage_month"] =
        // wage_month.toString();
        // search_option_details.$match["employee_monthly_reports.wage_year"] =
        // wage_year.toString();
        search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
        if(req.body.checked_row_ids && req.body.unchecked_row_ids){
          
          if (req.body.row_checked_all === "true") {
              if(typeof req.body.unchecked_row_ids == "string"){
                  var ids = JSON.parse(req.body.unchecked_row_ids);
              }
              else{
                  var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
              }
              if (ids.length > 0) {
                  ids = ids.map(function (el) {
                      return mongoose.Types.ObjectId(el);
                  });
                  search_option.$match._id = { $nin: ids };
              }
          } else {
              if(typeof req.body.checked_row_ids == "string"){
                  var ids = JSON.parse(req.body.checked_row_ids);
              }
              else{
                  var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
              }
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
              from: "employee_monthly_reports",
              "let": { "emp_db_idVar": "$_id"},
              "pipeline": [
              { "$match": { $and :[
                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                // {"wage_month": parseInt(wage_month)},
                // {"wage_year": parseInt(wage_year)},
                ...lookupSearchOptions,
                ] } }
                ],
                as: "employee_monthly_reports",
              },
            },
            search_option_details,
            {
              $addFields: {
                employee_details: {
                  $arrayElemAt: ["$employee_details", 0],
                },
                // employee_monthly_reports: {
                //   $arrayElemAt: ["$employee_monthly_reports", 0],
                // },
              },
            },

            {
              $project: {
                _id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                emp_id: 1,
                "employee_details.template_data.bonus_temp_data": 1,
                UAN_no: {
                  $ifNull: [
                  "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
                  null,
                  ],
                },
                bonus_report: {
                  $ifNull: ["$employee_monthly_reports.bonus_report", {}],
                },
                total_bonus_wages: {
                  $sum: "$employee_monthly_reports.bonus_report.bonus_wages",
                },
                total_bonus_deduction: {
                  $sum: "$employee_monthly_reports.bonus_report.total_deduction",
                },
                total_bonus_net_pay: {
                  $sum: "$employee_monthly_reports.bonus_report.total_pay_days",
                },
                // total_bonus_rate: {
                //   $sum: "$employee_monthly_reports.bonus_report.module_data.bonus_value",
                // },
                corporate_id: 1,
                bank_details: { $ifNull: ["$employee_details.bank_details", {}] },
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

            await Promise.all(master_data.docs.map(async (empdata) => {
              var total_bonus_rate = 0;
                await Promise.all(empdata.bonus_report.map(async (bonus_reports) => {
                  if(bonus_reports.module_data){
                    total_bonus_rate += parseFloat(bonus_reports.module_data.bonus_value);
                  }
                }));
                empdata.total_bonus_rate = total_bonus_rate;
            }));
            return resp
            .status(200)
            .send({
              status: "success",
              message: "",
              master_data: master_data,
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
  export_bonus_sample_file: async function (req, resp, next) {
    try {

      const v = new Validator(req.body, {
        disbursement_frequency: "required",
        disbursement_type: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }

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
      search_option_details.$match["employee_details.template_data.bonus_temp_data.disbursement_frequency"] = {$eq: req.body.disbursement_frequency};
      search_option_details.$match["employee_details.template_data.bonus_temp_data.disbursement_type"] = {$eq: req.body.disbursement_type};

      Employee.aggregate([
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
            $addFields: {
              employee_details: {
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
            },
          },
          ]).then(async (employees) => {

            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");
            ws.cell(1, 1).string("emp_id");
            ws.cell(1, 2).string("employee_name");
            ws.cell(1, 3).string("bonus_value");
            ws.cell(1, 4).string("disbursement_month");
            ws.cell(1, 5).string("disbursement_year");


            for (let i = 0; i < employees.length; i++) {
              const employee = employees[i];
              ws.cell((i+2), 1).string(employee.emp_id);
              ws.cell((i+2), 2).string(employee.emp_first_name + ' ' + employee.emp_last_name);
              ws.cell((i+2), 3).number(0.00);
              ws.cell((i+2), 4).number((new Date().getMonth()+1))
              // ws.cell((i+2), 4).dataValidation(dataValidation);
              ws.cell((i+2), 5).number((new Date().getFullYear()));

            }

            ws.addDataValidation({
              type: 'whole',
              operator: 'between',
              allowBlank: false,
              sqref: `D1:D${employees?.length}`,
              formulas: [1,12],
              showErrorMessage: true,
              errorTitle: 'Invalid Input',
              error: 'Please enter a value between 1 and 12',
            });

            let file_name = "bonus-sample.xlsx";
            var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/bonus-module');
            await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
          }).catch((err) => {
            return resp
            .status(200)
            .json({
              status: "error",
              message: err ? err.message : "Something went wrong",
            });
          });
  
      // var employees_data = [];
      // await Employee.find(
      // {
      //   status: "active",
      //   corporate_id: req.authData.corporate_id,
      //   approval_status: "approved",
      //   emp_id: {$ne:null},
      // },
      // "_id emp_first_name emp_last_name emp_id",
      // async function (err, employees) {
        // if (!err) {
          // await Promise.all(
          //   employees.map(async function (emp) {
          //     employees_data.push(
          //       emp.emp_first_name +
          //       " " +
          //       emp.emp_last_name +
          //       " [" +
          //       emp._id +  
          //       "]"
          //       );
          //   })
          //   ).then(async () => {
          //     // var employeesata = [employees_data.toString()];
          //     // ws.cell( 2,2).string(employees_data.toString());
          //     ws.addDataValidation({
          //       type: "list",
          //       allowBlank: false,
          //       prompt: "Choose Employee",
          //       error: "Invalid choice was chosen",
          //       showDropDown: true,
          //       sqref: "A2:A2",
          //       formulas: [employees_data.toString()],
          //     });
          //   });
  
          //employees = employees.map(function(el) { return el.emp_first_name+' '+el.emp_last_name+' ['+el._id+']' })
        //   }
        // }
        // );
  
      // ws.addDataValidation({
      //     type: 'list',
      //     allowBlank: false,
      //     prompt: 'Choose Exgratia',
      //     error: 'Invalid choice was chosen',
      //     showDropDown: true,
      //     sqref: 'C2:C2',
      //     formulas: ['yes,no'],
      //   });
      // wb.write("bonus-sample.xlsx");
      // let file_location = Site_helper.createFiles(wb,"bonus-sample",'xlsx', req.authData.corporate_id);
      // setTimeout(async function() {
        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
        
       
      // }, 500);
      // return resp
      // .status(200)
      // .json({
      //   status: "success",
      //   message: "Xlsx created successfully",
      //   url: baseurl + file_location,
      // });
    } catch (e) {
      return resp
      .status(200)
      .json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  
  export_import_excel_sample_file: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        list_type: "required",
      });
      if (!await v.check()) {
        return resp
        .status(200)
        .send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }
      
      var wb = new xl.Workbook();
      var ws = wb.addWorksheet("Sheet 1");
      var ws2 = wb.addWorksheet("employee");
      ws.cell(1, 1).string("emp_id");

      switch (req.body.list_type) {
        case "bonus":
        ws.cell(1, 2).string("bonus_value");
        break;
        case "incentive":
        ws.cell(1, 2).string("incentive_value");
        ws.cell(1, 3).string("auto_disburse");
        ws.addDataValidation({
          type: "list",
          allowBlank: 0,
          prompt: "Choose One",
          error: "Invalid choice was chosen",
          showDropDown: true,
          sqref: "C2:C2",
          formulas: ["On, Off"],
        });
        break;
        default:
        throw {message: "invalid list Type!"};
      }
      ws.cell(2, 2).string("0");

      var employees_data = [];
      await Employee.find(
      {
        status: {$in:["active", "approved"]},
        corporate_id: req.authData.corporate_id,
        approval_status: "approved",
      },
      "_id emp_first_name emp_last_name emp_id",
      async function (err, employees) {
        if (!err) {
          employees_data=employees;
          var row_id=1
          await Promise.all(
            employees.map(async function (emp) {
            //  var emp_name= emp.emp_first_name +" " + emp.emp_last_name + " [" + emp.emp_id + "]";
            //  var emp_id = emp.emp_id 
            if(emp.emp_id){
              ws2.cell(row_id++, 1).string(emp.emp_id.toString());
            }
           })
            )
        }
      }
      );
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Employee",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "A2:A" + employees_data.length,
        formulas: ['=employee!$A$2:$A$'+employees_data.length],
      });
      // let file_location =  Site_helper.createFiles(wb,`${req.body.list_type}-sample`,'xlsx', req.authData.corporate_id)
      // wb.write(`${req.body.list_type}-sample.xlsx`);
      // setTimeout(async function() {
        let file_name = req.body.list_type+"-sample.xlsx";
        var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/bonus-module');
        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
        // await Site_helper.downloadAndDelete(file_name,file_path,req.authData.corporate_id,resp);
      // }, 500);
      // return resp
      // .status(200)
      // .json({
      //   status: "success",
      //   message: "Xlsx created successfully",
      //   url: baseurl + file_location,
      // });
    } catch (e) {
      return resp
      .status(200)
      .json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },

  import_bonus_data: async function (req, resp, next) {
    try {
      var results = [];
      fs.createReadStream(req.files[0].path)
      .pipe(csv())
      .on("data", async function (row) {
        if(
          (row["emp_id"] && row["emp_id"] !== ' ') &&
          (row["disbursement_month"] && row["disbursement_month"] !== ' ') &&
          (row["disbursement_year"] && row["disbursement_year"] !== ' ') 
        ){
          var emp_id = row["emp_id"];
          var bonus_value = row["bonus_value"];
          var disbursment_month=parseFloat(row["disbursement_month"]);
          var disbursment_year=parseFloat(row["disbursement_year"]);
            //   var exgratia_status=row["exgratia_status"];
            //   var bonus_from_month=row["bonus_from_month"];
            //   var bonus_from_year=row["bonus_from_year"];
            //   var bonus_to_month=row["bonus_to_month"];
            //   var bonus_to_year=row["bonus_to_year"];
            
            // let startIndex =  emp_id.indexOf("[") >= 0 ? emp_id.indexOf("[") : null;  
            // let lastIndex = emp_id.indexOf("]") >= 0 ? emp_id.indexOf("]") : null;
            
            if(emp_id){
              // emp_id = emp_id.slice(startIndex + 1, lastIndex);
              var document = {
                corporate_id: req.authData.corporate_id,
                emp_id: emp_id,
                bonus_value: parseFloat(bonus_value),
                // bonus_from_month:bonus_from_month,
                // bonus_from_year:bonus_from_year,
                // bonus_to_month:bonus_to_month,
                // bonus_to_year:bonus_to_year,
                // exgratia:exgratia_status,
                status: "active",
                bonus_g_month:(disbursment_month - 1),
                bonus_g_year:disbursment_year,
                genarete_bonus_value:0,
                generate_exgratia:0,
                updated_at: Date.now(),
              };
             
              await BonusModule.updateOne(
                { emp_id: emp_id },
                document,
                { upsert: true, new: true },
                function (err, BonusModule) {
                  if (err) results.push(document);
                }
                );
            }else{
              results.push(row)
            }
        }
        })
      .on("end", async function () {
        var failed_entry = [];
        return resp
        .status(200)
        .send({
          status: "success",
          message: "Import successfully",
          failed_entry: results,
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

  employee_bonus_report: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {};
      var start_month = parseInt(+req.body.wage_month_from);
      var start_year = parseInt(+req.body.wage_year_from);
      var end_month = parseInt(+req.body.wage_month_to);
      var end_year = parseInt(+req.body.wage_year_to);
      // var start_month = parseInt(req.body.wage_month);
      // var start_year = parseInt(req.body.wage_year);
      var bonus_period = null;
      // console.log(start_month);
      // console.log(start_year);
      // console.log(end_month);
      // console.log(end_year);
      bonus_period_from = moment().month(start_month).format("MMMM");
      bonus_period_to = moment().month(end_month).format("MMMM");
      
      var search_option = {
        $match: {
          $and: [
          { corporate_id: req.authData.corporate_id },
          { parent_hods: { $in: [req.authId] } },
          { approval_status: {$in :["approved","active"] } },
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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $in: ids };
            }
        }
      }
      search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
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
        $lookup:{
          from: 'employee_monthly_reports',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_monthly_reports',
        }
      },
      {
        $lookup:{
          from: 'employee_tds_calculations',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
              // {'wage_year': {"$eq": parseInt(start_year) }},
              // {'wage_month': {"$eq": parseInt(start_month) }}
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_tds_calculations',
        }
      },
      search_option_details,
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
          branch: {
            $arrayElemAt: ["$branch", 0],
          },
          department: {
            $arrayElemAt: ["$department", 0],
          },
          designation: {
            $arrayElemAt: ["$designation", 0],
          },
          // employee_monthly_reports: {
          //   $arrayElemAt: ["$employee_monthly_reports", 0],
          // },
          // employee_tds_calculations: {
          //   $arrayElemAt: ["$employee_tds_calculations", 0],
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
          emp_father_name: 1,
          "hod.first_name": 1,
          "hod.last_name": 1,
          "client._id": 1,
          "client.client_code": 1,
          "branch._id": 1,
          "branch.branch_name": 1,
          "department._id": 1,
          "department.department_name": 1,
          "designation._id": 1,
          "designation.designation_name": 1,
          "bonus_period_from":bonus_period_from,
          "bonus_period_to":bonus_period_to,
          // "no_of_days_worked_in_bonus_period": "$no_of_days_worked_in_bonus_period",
          // "bonus_wage_master": { $ifNull: [ "$employee_monthly_reports.bonus_report.bonus_wages", 0 ] },
          // "bonus_wage_earned": { $ifNull: [ "$employee_monthly_reports.bonus_report.gross_earning", 0 ] },
          // "bonus_rate": { $ifNull: [ "$employee_monthly_reports.bonus_report.module_data.generate_exgratia", 0 ] },
          // "amount": { $ifNull: [ "$employee_monthly_reports.bonus_report.module_data.bonus_value", 0 ] },
          // "bonus_amount": { $ifNull: [ "$employee_monthly_reports.bonus_report.module_data.genarete_bonus_value", 0 ] },
          // "tds": { $ifNull: [ "$employee_tds_calculations.tax_amount", 0 ] },
          // "bonus_payable": { $ifNull: [ "$employee_monthly_reports.bonus_report.total_pay_days", 0 ] },
          // "ee_pf": { $ifNull: [ "$employee_monthly_reports.bonus_report.pf_data.emoloyee_contribution", 0 ] },
          // "er_pf": { $ifNull: [ "$employee_monthly_reports.bonus_report.pf_data.total_employer_contribution", 0 ] },
          // "ee_esi": { $ifNull: [ "$employee_monthly_reports.bonus_report.esic_data.emoloyee_contribution", 0 ] },
          // "er_esi": { $ifNull: [ "$employee_monthly_reports.bonus_report.esic_data.emoloyer_contribution", 0 ] },
          // "opening_advance_vs_bonus": { $ifNull: [ "$employee_monthly_reports.advance_report.opening_balance", 0 ] },
          // "advance_recovered": { $ifNull: [ "$employee_monthly_reports.advance_report.advance_recovered", 0 ] },
          // "advance_outstanding_vs_bonus": { $ifNull: [ "$employee_monthly_reports.advance_report.new_advance", 0 ] },
          // "amount_remitted": { $ifNull: [ "$employee_monthly_reports.advance_report.closing_balance", 0 ] },
          "employee_monthly_reports.bonus_report":1,
          "employee_monthly_reports.advance_report":1,
          "employee_tds_calculations.taxable_amount":1,
          "bank": { $ifNull: [ "$employee_details.bank_details.bank_name", '' ] },
          "account_number": { $ifNull: [ "$employee_details.bank_details.account_no", '' ] },
          "ifsc": { $ifNull: [ "$employee_details.bank_details.ifsc_code", '' ] },
          "payment_mode": "",
          "signature": "",
        },
      },
      ]).then(async (employees) => {
          await Promise.all(employees.map(async function (employee, index) {
            var no_of_days_worked_in_bonus_period = 0;
            var bonus_wage_master = 0;
            var bonus_wage_earned = 0;
            var bonus_rate = 0;
            var amount = 0;
            var bonus_amount = 0;
            var tds = 0;
            var bonus_payable = 0;
            var ee_pf = 0;
            var er_pf = 0;
            var ee_esi = 0;
            var er_esi = 0;
            var opening_advance_vs_bonus = 0;
            var advance_recovered = 0;
            var advance_outstanding_vs_bonus = 0;
            var amount_remitted = 0;
            await Promise.all(employee.employee_monthly_reports.map(async function(monthly_report){
              if(monthly_report){
                no_of_days_worked_in_bonus_period += parseFloat(monthly_report.bonus_report.total_pay_days);
                bonus_wage_master += parseFloat(monthly_report.bonus_report.bonus_wages);
                bonus_wage_earned += parseFloat(monthly_report.bonus_report.gross_earning);
                bonus_rate += parseFloat(monthly_report.bonus_report.module_data.bonus_value);
                amount += parseFloat(monthly_report.bonus_report.bonus_wages);

                bonus_amount += parseFloat(monthly_report.bonus_report.module_data.genarete_bonus_value ? monthly_report.bonus_report.module_data.genarete_bonus_value:0);
                if(monthly_report.bank_ins_referance_id != ''){
                  bonus_payable += parseFloat(monthly_report.bonus_report.bonus_wages);
                }
                ee_pf += parseFloat(monthly_report.bonus_report.pf_data.emoloyee_contribution);
                er_pf += parseFloat(monthly_report.bonus_report.pf_data.total_employer_contribution);
                ee_esi += parseFloat(monthly_report.bonus_report.esic_data.emoloyee_contribution);
                er_esi += parseFloat(monthly_report.bonus_report.esic_data.emoloyer_contribution);
                if(monthly_report.advance_report){
                  opening_advance_vs_bonus += parseFloat(monthly_report.bonus_report.advance_report.opening_balance);
                  advance_recovered += parseFloat(monthly_report.bonus_report.advance_report.advance_recovered);
                  advance_outstanding_vs_bonus += parseFloat(monthly_report.bonus_report.advance_report.new_advance);
                  amount_remitted += parseFloat(monthly_report.bonus_report.advance_report.closing_balance);
                }
              }
            }));
            await Promise.all(employee.employee_tds_calculations.map(async function(tds_calculation){
                if(tds_calculation){
                  tds += parseFloat(tds_calculation.taxable_amount);
                }
            }));
            employee.no_of_days_worked_in_bonus_period = no_of_days_worked_in_bonus_period;
            employee.bonus_wage_master = bonus_wage_master;
            employee.bonus_wage_earned = bonus_wage_earned;
            employee.bonus_rate = bonus_rate;
            employee.amount = amount;
            employee.bonus_amount = bonus_amount;
            employee.tds = tds;
            employee.bonus_payable = bonus_payable;
            employee.ee_pf = ee_pf;
            employee.er_pf = er_pf;
            employee.ee_esi = ee_esi;
            employee.er_esi = er_esi;
            employee.opening_advance_vs_bonus = opening_advance_vs_bonus;
            employee.advance_recovered = advance_recovered;
            employee.advance_outstanding_vs_bonus = advance_outstanding_vs_bonus;
            employee.amount_remitted = amount_remitted;
          })).then((value) => {
            return resp.status(200).json({status: "success",employees: employees});
          });
      });; 
      // Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
      //   if (err) return resp.json({ status: "error", message: err.message });
        
      // });
    } 
    catch (e) {
      return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },
  employee_15_form_c_bonus_report: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {};
      // if(req.body.wage_year){
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(req.body.wage_year) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(req.body.wage_year);
      // }
      // else{
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(new Date().getFullYear()) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(new Date().getFullYear());
      // }
      var start_month = parseInt(+req.body.wage_month_from);
      var start_year = parseInt(+req.body.wage_year_from);
      var end_month = parseInt(+req.body.wage_month_to);
      var end_year = parseInt(+req.body.wage_year_to);

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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $in: ids };
            }
        }
      }
      var company = await Company.findOne({'_id':req.authId},'establishment_name');
      var company_details = await CompanyDetails.findOne({'company_id':req.authId},'preference_settings.financial_year_end');
      
      search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
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
        $lookup:{
          from: 'employee_monthly_reports',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_monthly_reports',
        }
      },
      // {
      //   $lookup:{
      //     from: 'employee_tds_calculations',
      //     "let": { "emp_db_idVar": "$_id"},
      //     "pipeline": [
      //     { 
      //       "$match": { 
      //         $and :[
      //         {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
      //         {'wage_year': {"$eq": parseInt(start_year) }},
      //         {'wage_month': {"$eq": parseInt(start_month) }}
      //         ] 
      //       } 
      //     }
      //     ],
      //     as: 'employee_tds_calculations',
      //   }
      // },
      search_option_details,
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
          branch: {
            $arrayElemAt: ["$branch", 0],
          },
          designation: {
            $arrayElemAt: ["$designation", 0],
          },
          "total": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.attendance_summaries.paydays"
              },
            ]
          },
          "gross_earning": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.gross_earning"
              },
            ]
          },
          "gross_earning": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.gross_earning"
              },
            ]
          },
          "total_bonus_wages": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.bonus_wages"
              },
            ]
          },
          "puja_bonus_or_other_customary_bonus": 0,
          "interim_bonus": 0,
          "ftn_1": 0,
          "deduction_on_account_of_financial_loss": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.total_deduction"
              },
            ]
          },
          "emp_age": {
            $divide: [
              { $subtract: [new Date(), "$emp_dob"] },
              365 * 24 * 60 * 60 * 1000,
            ],
          }
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
          // "hod.first_name": 1,
          // "hod.last_name": 1,
          // "client._id": 1,
          // "client.client_code": 1,
          // "branch._id": 1,
          // "branch.branch_name": 1,
          // "department._id": 1,
          // "department.department_name": 1,
          "designation._id": 1,
          "designation.designation_name": 1,
          emp_age: "$emp_age",
          "age_of_accounting_year": {
            $cond: [ { $gte: [ "$emp_age", 15 ] }, 'YES', 'NO' ]
          },
          // "employee_monthly_reports.bonus_report":1,
          "no_fo_working_days": "$total",
          "total_salary": "$gross_earning",
          "amount_of_bonus_payable" :"$total_bonus_wages",
          "puja_bonus_or_other_customary_bonus": "$puja_bonus_or_other_customary_bonus",
          "interim_bonus": "$interim_bonus",
          "ftn_1": "$ftn_1",
          "deduction_on_account_of_financial_loss": "$deduction_on_account_of_financial_loss",
          "total_sum_deducted_under": { $sum: [ "$puja_bonus_or_other_customary_bonus", "$interim_bonus", "$ftn_1", "$deduction_on_account_of_financial_loss" ] },
          "net_amount_payable": { $subtract: [ "$total_bonus_wages", { $sum: [ "$puja_bonus_or_other_customary_bonus", "$interim_bonus", "$ftn_1", "$deduction_on_account_of_financial_loss" ] }] },
          "amount_actually_paid": { $subtract: [ "$total_bonus_wages", { $sum: [ "$puja_bonus_or_other_customary_bonus", "$interim_bonus", "$ftn_1", "$deduction_on_account_of_financial_loss" ] }] },
          "date_on_which_paid": new Date(),
        },
      },
      ]); 
      // Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
      //   if (err) return resp.json({ status: "error", message: err.message });

      //   return resp
      //   .status(200)
      //   .json({
      //     status: "success",
      //     employees: employees,
      //   });
      // });
      myAggregate.then(async (emps) => {
        var company_total_paydays_array = [];
        if(emps){
          await Promise.all(emps.map(async (empdata) => {
            company_total_paydays_array.push(empdata.no_fo_working_days);
          }));
        }
        var company_total_paydays = Math.max.apply(null, company_total_paydays_array);

        return resp.status(200).send({ status: 'success',message:"Fetch successfully.", employees: emps , company_name:company, total_paydays:company_total_paydays , financial_year: company_details?.preference_settings?.financial_year_end});
      })
    } 
    catch (e) {
      return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },
  employee_bonus_slip_report: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {};
      // if(req.body.wage_year){
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(req.body.wage_year) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(req.body.wage_year);
      // }
      // else{
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(new Date().getFullYear()) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(new Date().getFullYear());
      // }
      var wage_month = +req.body.wage_month;
      var wage_year = +req.body.wage_year;
      

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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $in: ids };
            }
        }
      }
      var company = await Company.findOne({'_id':req.authId},'establishment_name');
      search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
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
          localField: "corporate_id",
          foreignField: "details.corporate_id",
          as: "company_details",
        },
      },
      {
        $lookup:{
          from: 'employee_monthly_reports',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
              {"wage_month": parseInt(wage_month)},
              {"wage_year": parseInt(wage_year)},
              // {$or:[ 
              //     {'wage_year': {$gt: start_year }}, 
              //     { $and:[
              //         {'wage_year': {$gte: start_year }},
              //         {'wage_month': {$gte: start_month }}
              //         ]
              //     } 
              //     ]
              // },
              // { $or:[ 
              //     {'wage_year': {$lt: end_year }}, 
              //     { $and:[
              //         {'wage_year': {$lte: end_year }},
              //         {'wage_month': {$lte: end_month }}
              //         ]
              //     } 
              //     ]
              // }
              ] 
            } 
          }
          ],
          as: 'employee_monthly_reports',
        }
      },
      search_option_details,
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
          branch: {
            $arrayElemAt: ["$branch", 0],
          },
          designation: {
            $arrayElemAt: ["$designation", 0],
          },
          companies: {
            $arrayElemAt: ["$companies", 0],
          },
          company_details: {
            $arrayElemAt: ["$company_details", 0],
          },
          department: {
            $arrayElemAt: ["$department", 0],
          },
          "bonus_wages": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.bonus_wages"
              },
            ]
          },
          "advance_recovered": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.advance_recovered"
              },
            ]
          },
          "tds": 0,
          "total_deduction": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.total_deduction"
              },
            ]
          },
          "exgratia_amount": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.exgratia_amount"
              },
            ]
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
          sex:1,
          email_id:1,
          mobile_no:1,
          "hod.first_name": 1,
          "hod.last_name": 1,
          "client._id": 1,
          "client.client_code": 1,
          "branch._id": 1,
          "branch.branch_name": 1,
          "department._id": 1,
          "department.department_name": 1,
          "designation._id": 1,
          "designation.designation_name": 1,
          // "companies":1,
          // "employee_monthly_reports":1,
          "company_name": { $ifNull: [ "$companies.establishment_name", "" ] },
          "com_logo": { $ifNull: [ "$companies.com_logo", "" ] },
          "company_phone": { $ifNull: [ "$companies.phone_no", "" ] },
          "company_address": { $ifNull: [ "$company_details.reg_office_address", "" ] },
          "date_of_join": { $ifNull: [ "$employee_details.employment_hr_details.date_of_join", "" ] },
          "bank": { $ifNull: [ "$employee_details.bank_details.bank_name", '' ] },
          "account_number": { $ifNull: [ "$employee_details.bank_details.account_no", '' ] },
          "ifsc": { $ifNull: [ "$employee_details.bank_details.ifsc_code", '' ] },
          "account_type": { $ifNull: [ "$employee_details.bank_details.account_type", '' ] },
          aadhar_no:1,
          pan_no:1,
          "uan_no": { $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", '' ] },
          "pf_no": { $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.last_ro", '' ] },
          "esic_ip_no": { $ifNull: [ "$employee_details.pf_esic_details.curr_er_esic_details.esic_no", '' ] },
          "bonus_slip_temp_data": { $ifNull: [ "$employee_details.template_data.bonus_slip_temp_data", '' ] },
          "advance_details.bonus_type": { $ifNull: [ "$employee_details.template_data.bonus_temp_data.disbursement_frequency", '' ] },
          "advance_details.bonus_wage": { $ifNull: [ "$bonus_wages", '0' ] },
          "advance_details.bonus_rate": { $ifNull: [ "$employee_details.template_data.bonus_temp_data.max_bonus_wage", '0' ] },
          "advance_details.advance_recovered": { $ifNull: [ "$advance_recovered", '0' ] },
          "advance_details.tds": { $ifNull: [ "$tds", '0' ] },
          "advance_details.statutory_deduction": { $ifNull: [ "$total_deduction", '0' ] },
          "advance_details.amount_remitted": { $ifNull: [ "$exgratia_amount", '0' ] },
          "employee_monthly_reports.wage_month":1,
          "employee_monthly_reports.wage_year": 1,
          "employee_monthly_reports.bonus_report": 1,
          "employee_details.template_data.bonus_temp_data":1,
        },
      },
      ]); 
      path_array = [];
      myAggregate.then(async (emps) => {
          if(emps.length > 0){
            await Promise.all(emps.map(async function(employees){
              var totalBonusAmount = 0;
              var emp_gross_earning = 0;
              var emp_net_pay = 0;
              var emp_ctc = 0;
              var total_month_bonus_wage = 0;
              var total_month_bonus_rate = 0;
              var total_month_bonus = 0;
              if(employees.employee_monthly_reports){
                if(employees.employee_monthly_reports.length > 0){
                   await Promise.all(employees.employee_monthly_reports.map(function (report){
                    if(report.bonus_report){
                      if(report.bonus_report.module_data){
                        totalBonusAmount += parseFloat(report.bonus_report.module_data.bonus_value);
                        total_month_bonus_rate += parseFloat(report.bonus_report.module_data.bonus_value);
                      }
                      if(report.bonus_report.gross_earning){
                        emp_gross_earning += parseFloat(report.bonus_report.gross_earning);
                        total_month_bonus += parseFloat(report.bonus_report.gross_earning);
                      }
                      if(report.bonus_report.bonus_wages){
                        emp_net_pay += parseFloat(report.bonus_report.bonus_wages);
                        total_month_bonus_wage += parseFloat(report.bonus_report.bonus_wages);
                      }
                      if(report.bonus_report.ctc){
                        emp_ctc += parseFloat(report.bonus_report.ctc);
                      }
                    }
                  }));
                }
              }
              employees.advance_details.bonus_amt = totalBonusAmount;
              employees.advance_details.month_wise_total = {
                'total_bonus_wage': total_month_bonus_wage,
                'total_bonus_rate': total_month_bonus_rate,
                'total_bonus': total_month_bonus,
              }
              employees.from_time_period = (wage_month+1)+"/"+ wage_year;
              employees.to_time_period = (wage_month+1)+"/"+ wage_year;
              let model_data = {
                emp_id: employees.emp_id,
                corporate_id: employees.corporate_id,
                wage_month,
                wage_year,
                emp_data:employees,
              };

              if(req.body.generate == 'pdf'){
                // var file_path='/storage/company/temp_files/'+employees.corporate_id+'/bonus_slip/';
                var file_path = 'cold_storage' + '/bonus_slip/' + wage_year + '/' + (wage_month);                
                var file_name='bonus-slip-'+employees.corporate_id+'-'+employees.emp_id+'-'+wage_month+'-'+wage_year+'.pdf';
                
                let file = await Site_helper.createFiles(null, file_name, employees.corporate_id,file_path) 
                path_array.push({
                    "link": absolutePath+file_path+file_name,
                    "file_name":file.file_name,
                    "file_path":file.location,
                });
                var pdf_file= await Site_helper.generate_bonus_slip_pdf({employee_data: employees},file.file_name,file.location);
                model_data.pdf_link=file.location + file.file_name;
                model_data.pdf_file_name=file_name;
                model_data.gross_earning = emp_gross_earning;
                model_data.net_pay = emp_net_pay;
                model_data.ctc = emp_ctc;
                
                await BonusPayslip.findOneAndUpdate(
                  {
                    emp_id: model_data.emp_id,
                    wage_month: parseInt(wage_month),
                    wage_year: parseInt(wage_year),
                  },
                  {$set:model_data},
                  { upsert: true, new: true },
                  (err, doc) => {
                    if (err)
                      return resp
                        .status(200)
                        .send({ status: "error", message: err });
                  }
                );
              }
            })).then(async (emp) => { 
              if(req.body.generate == 'pdf'){
                  var path_link = null; 
                  // if(path_array.length > 0){
                  //     var dir = absolutePath+"/storage/company/temp_files/"+req.authData.corporate_id+"/bonus_slip/";
                  //     if (!fs.existsSync(dir)){
                  //         fs.mkdirSync(dir);
                  //     }
                  //     const output = fs.createWriteStream(dir+'bonus-slip-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip');
                  //     const archive = archiver('zip', {
                  //         zlib: { level: 9 } 
                  //     });
                  //     output.on('close', () => {
                  //         // console.log('Archive finished.');
                  //     });
                  //     archive.on('error', (err) => {
                  //         // console.log('Error.',err);
                  //     });
                  //     archive.pipe(output);
                  //     path_array.map( async function(parray) {
                  //         archive.append(fs.createReadStream(parray.link), { name: parray.file_name });
                  //     });
                  //     archive.finalize();
                  //     path_link = baseurl+'storage/company/'+req.authData.corporate_id+'/bonus_slip/bonus-slip-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip';
                  // }
                  return resp.status(200).json({status: "success", message: 'Bonus Slip Generated successfully.'});
              }
              else{
                return resp.status(200).send({ status: 'success',message:"Fetch successfully.", employees: emps , company_name:company});
              }
            });
          }
          else{
            return resp.status(200).send({ status: 'success',message:"Fetch successfully.", employees: [] , company_name:company});
          }

          
      })
    } 
    catch (e) {
      return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },
  employee_18_form_d_bonus_report: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {};
      if(req.body.wage_month_from && req.body.wage_year_from){
        req.body.wage_month_from = req.body.wage_month_from;
        req.body.wage_year_from = req.body.wage_year_from;
        req.body.wage_month_to = req.body.wage_month_to;
        req.body.wage_year_to = req.body.wage_year_to;
      }
      else{
        req.body.wage_month_from = 3;
        req.body.wage_year_from = parseInt(new Date().getFullYear()) - 1;
        req.body.wage_month_to = 2;
        req.body.wage_year_to = parseInt(new Date().getFullYear());
      }
      var start_month = parseInt(req.body.wage_month_from);
      var start_year = parseInt(req.body.wage_year_from);
      var end_month = parseInt(req.body.wage_month_to);
      var end_year = parseInt(req.body.wage_year_to);
 
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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $in: ids };
            }
        }
      }
      var company_search_option = {
        $match: {
          $and: [
          { corporate_id: req.authData.corporate_id },
          { _id: mongoose.Types.ObjectId(req.authId)},
          ],
        },
      };
      var company = await Company.aggregate([company_search_option,
        {
          $lookup: {
            from: "company_details",
            localField: "corporate_id",
            foreignField: "details.corporate_id",
            as: "company_details",
          },
        },
        {
          $lookup: {
            from: "employees",
            "let": { "emp_db_idVar": "$corporate_id"},
            "pipeline": [
              { 
                "$match": { 
                $and :[
                {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                {"status": { $eq: "active"}}
                ] 
            } 
          }
          ],
            as: "employee",
          },
        },
        {
          $addFields: {
            company_details: {
              $arrayElemAt: ["$company_details", 0],
            },
            no_of_employee: {
              $size: "$employee",
            },
          },
        },
        {
          $project: {
            _id: 1,
            "company_details.details":1,
            "company_details.reg_office_address":1,
            "no_of_employee":1,
          },
        },
        ]);
      search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
      var myAggregate = Employee.aggregate([search_option,
      {
        $lookup: {
          from: "employee_details",
          localField: "_id",
          foreignField: "employee_id",
          as: "employee_details",
        },
      },
      {
        $lookup:{
          from: 'employee_monthly_reports',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_monthly_reports',
        }
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
          "employee_monthly_reports":1
        },
      },
      ]);
      myAggregate.then(async (emps) => {
        var no_of_bonus_employee = emps.length;
        var total_bonus_amount = 0;
        var total_paid_bonus_amount = 0;
        emps.map(function(employee){
          if(employee.employee_monthly_reports){
            if(employee.employee_monthly_reports.length > 0){
              employee.employee_monthly_reports.map(function(monthlyEmp){
                if(monthlyEmp.bonus_report){
                  // no_of_bonus_employee += 1;
                  if(monthlyEmp.bonus_report.module_data){
                    if(monthlyEmp.bonus_report.module_data.bonus_value){
                      if(monthlyEmp.bonus_report.bank_ins_referance_id != ''){
                        total_paid_bonus_amount += parseFloat(monthlyEmp.bonus_report.bonus_wages);
                      }
                      total_bonus_amount += parseFloat(monthlyEmp.bonus_report.module_data.bonus_value);
                    }
                  }
                }
              });
            }
          }
        });
        if(company){
          if(company.length > 0){
            company[0].no_of_bonus_employee = no_of_bonus_employee;
            company[0].total_bonus_amount = total_bonus_amount;
            company[0].total_paid_bonus_amount = total_paid_bonus_amount;
          }
        }
        return resp.status(200).send({ status: 'success',message:"Fetch successfully.",data:company});
      })
    } 
    catch (e) {
      return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },
  //excel Export
  employee_bonus_report_form_vii_export: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
          // template_id: 'required',
        });
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
      var start_month = parseInt(+req.body.wage_month_from);
      var start_year = parseInt(+req.body.wage_year_from);
      var end_month = parseInt(+req.body.wage_month_to);
      var end_year = parseInt(+req.body.wage_year_to);
      // var start_month = parseInt(req.body.wage_month);
      // var start_year = parseInt(req.body.wage_year);
      var bonus_period = null;

      bonus_period_from = moment().month(start_month).format("MMMM");
      bonus_period_to = moment().month(end_month).format("MMMM");

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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $in: ids };
            }
        }
      }
      search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
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
        $lookup:{
          from: 'employee_monthly_reports',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_monthly_reports',
        }
      },
      {
        $lookup:{
          from: 'employee_tds_calculations',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
              // {'wage_year': {"$eq": parseInt(start_year) }},
              // {'wage_month': {"$eq": parseInt(start_month) }}
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_tds_calculations',
        }
      },
      search_option_details,
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
          branch: {
            $arrayElemAt: ["$branch", 0],
          },
          department: {
            $arrayElemAt: ["$department", 0],
          },
          designation: {
            $arrayElemAt: ["$designation", 0],
          },
          // employee_monthly_reports: {
          //   $arrayElemAt: ["$employee_monthly_reports", 0],
          // },
          // employee_tds_calculations: {
          //   $arrayElemAt: ["$employee_tds_calculations", 0],
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
          emp_father_name: 1,
          "hod.first_name": 1,
          "hod.last_name": 1,
          "client._id": 1,
          "client.client_code": 1,
          "branch._id": 1,
          "branch.branch_name": 1,
          "department._id": 1,
          "department.department_name": 1,
          "designation._id": 1,
          "designation.designation_name": 1,
          "bonus_period_from":bonus_period_from,
          "bonus_period_to":bonus_period_to,
          // "no_of_days_worked_in_bonus_period": { $ifNull: [ "$employee_monthly_reports.bonus_report.total_pay_days", 0 ] },
          // "master_bonus_wage": { $ifNull: [ "$employee_monthly_reports.bonus_report.bonus_wages", 0 ] },
          // "earned_bonus_wage": { $ifNull: [ "$employee_monthly_reports.bonus_report.gross_earning", 0 ] },
          // "bonus_rate": { $ifNull: [ "$employee_monthly_reports.bonus_report.module_data.generate_exgratia", 0 ] },
          // "amount": { $ifNull: [ "$employee_monthly_reports.bonus_report.module_data.bonus_value", 0 ] },
          // "bonus_amount": { $ifNull: [ "$employee_monthly_reports.bonus_report.module_data.genarete_bonus_value", 0 ] },
          // "tds": { $ifNull: [ "$employee_tds_calculations.tax_amount", 0 ] },
          // "bonus_payable": { $ifNull: [ "$employee_monthly_reports.bonus_report.total_pay_days", 0 ] },
          // "ee_pf": { $ifNull: [ "$employee_monthly_reports.bonus_report.pf_data.emoloyee_contribution", 0 ] },
          // "er_pf": { $ifNull: [ "$employee_monthly_reports.bonus_report.pf_data.total_employer_contribution", 0 ] },
          // "ee_esi": { $ifNull: [ "$employee_monthly_reports.bonus_report.esic_data.emoloyee_contribution", 0 ] },
          // "er_esi": { $ifNull: [ "$employee_monthly_reports.bonus_report.esic_data.emoloyer_contribution", 0 ] },
          // "opening_advance_vs_bonus": { $ifNull: [ "$employee_monthly_reports.advance_report.opening_balance", 0 ] },
          // "advance_recovered": { $ifNull: [ "$employee_monthly_reports.advance_report.advance_recovered", 0 ] },
          // "advance_outstanding_vs_bonus": { $ifNull: [ "$employee_monthly_reports.advance_report.new_advance", 0 ] },
          // "amount_remitted": { $ifNull: [ "$employee_monthly_reports.advance_report.closing_balance", 0 ] },
          "employee_monthly_reports.bonus_report":1,
          "employee_monthly_reports.advance_report":1,
          "employee_tds_calculations.taxable_amount":1,
          "bank": { $ifNull: [ "$employee_details.bank_details.bank_name", '' ] },
          "account_number": { $ifNull: [ "$employee_details.bank_details.account_no", '' ] },
          "ifsc": { $ifNull: [ "$employee_details.bank_details.ifsc_code", '' ] },
          "payment_mode": "",
          "signature": "",
        },
      },
      ]).then(async (employeeies) => {
        var field_list_array = [];
        if(req.body.template_id) {
          var employeeSheetTemplate = await EmployeeSheetTemplate.findOne({'_id':mongoose.Types.ObjectId(req.body.template_id)});
          if(employeeSheetTemplate){
            if(employeeSheetTemplate.template_fields){
              if(employeeSheetTemplate.template_fields.length > 0){
                if(employeeSheetTemplate.template_fields[0].modules){
                  if(employeeSheetTemplate.template_fields[0].modules.length > 0){
                    if(employeeSheetTemplate.template_fields[0].modules[0].fields){
                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.length > 0){
                        field_list_array=employeeSheetTemplate.template_fields[0].modules[0].fields;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if(field_list_array.length == 0){
          field_list_array = ['emp_id','emp_first_name','emp_last_name','department','designation','client','branch','hod','bonus_period','no_of_days_worked_in_bonus_period','master_bonus_wage','earned_bonus_wage','bonus_rate','amount','bonus_amount','tds','bonus_payable',
          'ee_pf','er_pf','ee_esi','er_esi','opening_advance_vs_bonus','advance_recovered','advance_outstanding_vs_bonus','amount_remitted','bank_name','account_no','ifsc_code','payment_mode','signature'];
        }
        var wb = new xl.Workbook();
        var ws = wb.addWorksheet("Sheet 1");
        var clmn_id = 1;
        ws.cell(1, clmn_id).string("SL");
        if(field_list_array.includes('emp_id'))
        {
          ws.cell(1, clmn_id++).string("Employee Id");
        }
        if(field_list_array.includes('emp_first_name'))
        {
          ws.cell(1, clmn_id++).string("Employee First Name");
        }
        if(field_list_array.includes('emp_last_name'))
        {
          ws.cell(1, clmn_id++).string("Employee Last Name");
        }
        if(field_list_array.includes('department'))
        {
          ws.cell(1, clmn_id++).string("Department");
        }
        if(field_list_array.includes('designation'))
        {
          ws.cell(1, clmn_id++).string("Designation");
        }
        if(field_list_array.includes('client'))
        {
          ws.cell(1, clmn_id++).string("Client");
        }
        if(field_list_array.includes('branch'))
        {
          ws.cell(1, clmn_id++).string("Branch");
        }
        if(field_list_array.includes('hod'))
        {
          ws.cell(1, clmn_id++).string("Hod");
        }
        if(field_list_array.includes('bonus_period'))
        {
          ws.cell(1, clmn_id++).string("Bonus Period");
        }
        if(field_list_array.includes('no_of_days_worked_in_bonus_period'))
        {
          ws.cell(1, clmn_id++).string("No of days worked in bonus period");
        }
        if(field_list_array.includes('master_bonus_wage'))
        {
          ws.cell(1, clmn_id++).string("Bonus wage Master");
        }
        if(field_list_array.includes('earned_bonus_wage'))
        {
          ws.cell(1, clmn_id++).string("Bonus Wage Earned");
        }
        if(field_list_array.includes('bonus_rate'))
        {
          ws.cell(1, clmn_id++).string("Bonus Rate");
        }
        if(field_list_array.includes('amount'))
        {
          ws.cell(1, clmn_id++).string("Amount");
        }
        if(field_list_array.includes('bonus_amount'))
        {
          ws.cell(1, clmn_id++).string("Bonus Amount");
        }
        if(field_list_array.includes('tds'))
        {
          ws.cell(1, clmn_id++).string("TDS");
        }
        if(field_list_array.includes('bonus_payable'))
        {
          ws.cell(1, clmn_id++).string("Bonus Payable");
        }
        if(field_list_array.includes('ee_pf'))
        {
          ws.cell(1, clmn_id++).string("EE PF");
        }
        if(field_list_array.includes('er_pf'))
        {
          ws.cell(1, clmn_id++).string("ER PF");
        }
        if(field_list_array.includes('ee_esi'))
        {
          ws.cell(1, clmn_id++).string("EE ESI");
        }
        if(field_list_array.includes('er_esi'))
        {
          ws.cell(1, clmn_id++).string("ER ESI");
        }
        if(field_list_array.includes('opening_advance_vs_bonus'))
        {
          ws.cell(1, clmn_id++).string("Opening Advance vs Bonus");
        }
        if(field_list_array.includes('advance_recovered'))
        {
          ws.cell(1, clmn_id++).string("Advance Recovered");
        }
        if(field_list_array.includes('advance_outstanding_vs_bonus'))
        {
          ws.cell(1, clmn_id++).string("Advance outstanding vs Bonus");
        }
        if(field_list_array.includes('amount_remitted'))
        {
          ws.cell(1, clmn_id++).string("Amount Remitted");
        }
        if(field_list_array.includes('bank_name'))
        {
          ws.cell(1, clmn_id++).string("Bank");
        }
        if(field_list_array.includes('account_no'))
        {
          ws.cell(1, clmn_id++).string("Account Number");
        }
        if(field_list_array.includes('ifsc_code'))
        {
          ws.cell(1, clmn_id++).string("IFSC");
        }
        if(field_list_array.includes('payment_mode'))
        {
          ws.cell(1, clmn_id++).string("Payment Mode");
        }
        if(field_list_array.includes('signature'))
        {
          ws.cell(1, clmn_id++).string("Signature");
        }
        await Promise.all(employeeies.map(async function(employee, index){
          var no_of_days_worked_in_bonus_period = 0;
          var bonus_wage_master = 0;
          var bonus_wage_earned = 0;
          var bonus_rate = 0;
          var amount = 0;
          var bonus_amount = 0;
          var tds = 0;
          var bonus_payable = 0;
          var ee_pf = 0;
          var er_pf = 0;
          var ee_esi = 0;
          var er_esi = 0;
          var opening_advance_vs_bonus = 0;
          var advance_recovered = 0;
          var advance_outstanding_vs_bonus = 0;
          var amount_remitted = 0;
          await Promise.all(employee.employee_monthly_reports.map(async function(monthly_report){
            if(monthly_report){
              no_of_days_worked_in_bonus_period += parseFloat(monthly_report.bonus_report.total_pay_days);
              bonus_wage_master += parseFloat(monthly_report.bonus_report.bonus_wages);
              bonus_wage_earned += parseFloat(monthly_report.bonus_report.gross_earning);
              bonus_rate += parseFloat(monthly_report.bonus_report.module_data.bonus_value);
              amount += parseFloat(monthly_report.bonus_report.bonus_wages);

              bonus_amount += parseFloat(monthly_report.bonus_report.module_data.genarete_bonus_value ? monthly_report.bonus_report.module_data.genarete_bonus_value:0);
              if(monthly_report.bank_ins_referance_id != ''){
                bonus_payable += parseFloat(monthly_report.bonus_report.bonus_wages);
              }
              ee_pf += parseFloat(monthly_report.bonus_report.pf_data.emoloyee_contribution);
              er_pf += parseFloat(monthly_report.bonus_report.pf_data.total_employer_contribution);
              ee_esi += parseFloat(monthly_report.bonus_report.esic_data.emoloyee_contribution);
              er_esi += parseFloat(monthly_report.bonus_report.esic_data.emoloyer_contribution);
              if(monthly_report.advance_report){
                opening_advance_vs_bonus += parseFloat(monthly_report.bonus_report.advance_report.opening_balance);
                advance_recovered += parseFloat(monthly_report.bonus_report.advance_report.advance_recovered);
                advance_outstanding_vs_bonus += parseFloat(monthly_report.bonus_report.advance_report.new_advance);
                amount_remitted += parseFloat(monthly_report.bonus_report.advance_report.closing_balance);
              }
            }
          }));
          await Promise.all(employee.employee_tds_calculations.map(async function(tds_calculation){
            if(tds_calculation){
              tds += parseFloat(tds_calculation.taxable_amount);
            }
          }));
          employee.no_of_days_worked_in_bonus_period = no_of_days_worked_in_bonus_period;
          employee.bonus_wage_master = bonus_wage_master;
          employee.bonus_wage_earned = bonus_wage_earned;
          employee.bonus_rate = bonus_rate;
          employee.amount = amount;
          employee.bonus_amount = bonus_amount;
          employee.tds = tds;
          employee.bonus_payable = bonus_payable;
          employee.ee_pf = ee_pf;
          employee.er_pf = er_pf;
          employee.ee_esi = ee_esi;
          employee.er_esi = er_esi;
          employee.opening_advance_vs_bonus = opening_advance_vs_bonus;
          employee.advance_recovered = advance_recovered;
          employee.advance_outstanding_vs_bonus = advance_outstanding_vs_bonus;
          employee.amount_remitted = amount_remitted;

          var index_val = 2;
          index_val = index_val + index;
          var clmn_emp_id=1
          ws.cell(index_val, clmn_emp_id).number(index_val - 1);
          if(field_list_array.includes('emp_id')){
            ws.cell(index_val, clmn_emp_id++).string(employee.emp_id ? String(employee.emp_id) : "");
          }
          if(field_list_array.includes('emp_first_name')){
            ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name) : "");
          }
          if(field_list_array.includes('emp_last_name')){
            ws.cell(index_val, clmn_emp_id++).string(employee.emp_last_name ? String(employee.emp_last_name) : "");
          }
          if(field_list_array.includes('department')){
            ws.cell(index_val, clmn_emp_id++).string(employee.department ? String(employee.department.department_name) : "");
          }
          if(field_list_array.includes('designation')){
            ws.cell(index_val, clmn_emp_id++).string(employee.designation ? String(employee.designation.designation_name) : "");
          }
          if(field_list_array.includes('client')){
            ws.cell(index_val, clmn_emp_id++).string(employee.client ? String(employee.client.client_code) : "");
          }
          if(field_list_array.includes('branch')){
            ws.cell(index_val, clmn_emp_id++).string(employee.branch ? String(employee.branch.branch_name) : "");
          }
          if(field_list_array.includes('hod')){
            ws.cell(index_val, clmn_emp_id++).string(employee.hod ? String(employee.hod.first_name+" "+employee.hod.last_name) : "");
          }
          if(field_list_array.includes('bonus_period')){
            ws.cell(index_val, clmn_emp_id++).string(employee.bonus_period_from ? String(employee.bonus_period_from +" - "+ bonus_period_to) : "");
          }
          if(field_list_array.includes('no_of_days_worked_in_bonus_period')){
            ws.cell(index_val, clmn_emp_id++).string(employee.no_of_days_worked_in_bonus_period ? String(employee.no_of_days_worked_in_bonus_period) : "0");
          }
          if(field_list_array.includes('master_bonus_wage')){
            ws.cell(index_val, clmn_emp_id++).string(employee.master_bonus_wage ? String(employee?.master_bonus_wage?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('earned_bonus_wage')){
            ws.cell(index_val, clmn_emp_id++).string(employee.earned_bonus_wage ? String(employee?.earned_bonus_wage?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('bonus_rate')){
            ws.cell(index_val, clmn_emp_id++).string(employee.bonus_rate ? String(employee?.bonus_rate?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('amount')){
            ws.cell(index_val, clmn_emp_id++).string(employee.amount ? String(employee?.amount?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('bonus_amount')){
            ws.cell(index_val, clmn_emp_id++).string(employee.amount ? String(employee?.amount?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('tds')){
            ws.cell(index_val, clmn_emp_id++).string(employee.tds ? String(employee?.tds?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('bonus_payable')){
            ws.cell(index_val, clmn_emp_id++).string(employee.bonus_payable ? String(employee?.bonus_payable?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('ee_pf')){
            ws.cell(index_val, clmn_emp_id++).string(employee.ee_pf ? String(employee.ee_pf) : "0");
          }
          if(field_list_array.includes('er_pf')){
            ws.cell(index_val, clmn_emp_id++).string(employee.er_pf ? String(employee.er_pf) : "0");
          }
          if(field_list_array.includes('ee_esi')){
            ws.cell(index_val, clmn_emp_id++).string(employee.ee_esi ? String(employee.ee_esi) : "0");
          }
          if(field_list_array.includes('er_esi')){
            ws.cell(index_val, clmn_emp_id++).string(employee.er_esi ? String(employee.er_esi) : "0");
          }
          if(field_list_array.includes('opening_advance_vs_bonus')){
            ws.cell(index_val, clmn_emp_id++).string(employee.opening_advance_vs_bonus ? String(employee?.opening_advance_vs_bonus?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('advance_recovered')){
            ws.cell(index_val, clmn_emp_id++).string(employee.advance_recovered ? String(employee?.advance_recovered?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('advance_outstanding_vs_bonus')){
            ws.cell(index_val, clmn_emp_id++).string(employee.advance_outstanding_vs_bonus ? String(employee?.advance_outstanding_vs_bonus?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('amount_remitted')){
            ws.cell(index_val, clmn_emp_id++).string(employee.amount_remitted ? String(employee?.amount_remitted?.toFixed(2)) : "0");
          }
          if(field_list_array.includes('bank_name')){
            ws.cell(index_val, clmn_emp_id++).string(employee.bank ? String(employee.bank) : "");
          }
          if(field_list_array.includes('account_no')){
            ws.cell(index_val, clmn_emp_id++).string(employee.account_number ? String(employee.account_number) : "");
          }
          if(field_list_array.includes('ifsc_code')){
            ws.cell(index_val, clmn_emp_id++).string(employee.ifsc ? String(employee.ifsc) : "");
          }
          if(field_list_array.includes('payment_mode')){
            ws.cell(index_val, clmn_emp_id++).string("");
          }
          if(field_list_array.includes('signature')){
            ws.cell(index_val, clmn_emp_id++).string("");
          }
        })).then(async (value) => {
          // wb.write("bonus_report_VII_data.xlsx");
          let file_name = "bonus-report-VII-data.xlsx";
          // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
          let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/bonus-module');
          await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
          // return resp.status(200).send({ status: 'success',message:"Xlsx created successfully", url: baseurl + file_location});
        });
      });
    } 
    catch (e) {
      return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },

  employee_15_form_c_bonus_report_export: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {};
      // if(req.body.wage_year){
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(req.body.wage_year) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(req.body.wage_year);
      // }
      // else{
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(new Date().getFullYear()) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(new Date().getFullYear());
      // }
      var start_month = parseInt(+req.body.wage_month_from);
      var start_year = parseInt(+req.body.wage_year_from);
      var end_month = parseInt(+req.body.wage_month_to);
      var end_year = parseInt(+req.body.wage_year_to);

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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $in: ids };
            }
        }
      }
      var company = await Company.findOne({'_id':req.authId},'establishment_name');
      var company_details = await CompanyDetails.findOne({'company_id':req.authId},'preference_settings.financial_year_end');
      search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
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
        $lookup:{
          from: 'employee_monthly_reports',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_monthly_reports',
        }
      },
      search_option_details,
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
          branch: {
            $arrayElemAt: ["$branch", 0],
          },
          designation: {
            $arrayElemAt: ["$designation", 0],
          },
          "total": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.attendance_summaries.paydays"
              },
            ]
          },
          "gross_earning": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.gross_earning"
              },
            ]
          },
          "gross_earning": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.gross_earning"
              },
            ]
          },
          "total_bonus_wages": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.bonus_wages"
              },
            ]
          },
          "puja_bonus_or_other_customary_bonus": 0,
          "interim_bonus": 0,
          "ftn_1": 0,
          "deduction_on_account_of_financial_loss": {
            "$add": [
              {
                "$sum": "$employee_monthly_reports.bonus_report.total_deduction"
              },
            ]
          },
          "emp_age": {
            $divide: [
              { $subtract: [new Date(), "$emp_dob"] },
              365 * 24 * 60 * 60 * 1000,
            ],
          }
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
          "designation._id": 1,
          "designation.designation_name": 1,
          emp_age: "$emp_age",
          "age_of_accounting_year": {
            $cond: [ { $gte: [ "$emp_age", 15 ] }, 'YES', 'NO' ]
          },
          "no_fo_working_days": "$total",
          "total_salary": "$gross_earning",
          "amount_of_bonus_payable" :"$total_bonus_wages",
          "puja_bonus_or_other_customary_bonus": "$puja_bonus_or_other_customary_bonus",
          "interim_bonus": "$interim_bonus",
          "ftn_1": "$ftn_1",
          "deduction_on_account_of_financial_loss": "$deduction_on_account_of_financial_loss",
          "total_sum_deducted_under": { $sum: [ "$puja_bonus_or_other_customary_bonus", "$interim_bonus", "$ftn_1", "$deduction_on_account_of_financial_loss" ] },
          "net_amount_payable": { $subtract: [ "$total_bonus_wages", { $sum: [ "$puja_bonus_or_other_customary_bonus", "$interim_bonus", "$ftn_1", "$deduction_on_account_of_financial_loss" ] }] },
          "amount_actually_paid": { $subtract: [ "$total_bonus_wages", { $sum: [ "$puja_bonus_or_other_customary_bonus", "$interim_bonus", "$ftn_1", "$deduction_on_account_of_financial_loss" ] }] },
          "date_on_which_paid": new Date(),
        },
      },
      ]); 
      
      myAggregate.then(async (emps) => {
        var field_list_array = [];
        if(req.body.template_id) {
          var employeeSheetTemplate = await EmployeeSheetTemplate.findOne({'_id':mongoose.Types.ObjectId(req.body.template_id)});
          if(employeeSheetTemplate){
            if(employeeSheetTemplate.template_fields){
              if(employeeSheetTemplate.template_fields.length > 0){
                if(employeeSheetTemplate.template_fields[0].modules){
                  if(employeeSheetTemplate.template_fields[0].modules.length > 0){
                    if(employeeSheetTemplate.template_fields[0].modules[0].fields){
                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.length > 0){
                        field_list_array=employeeSheetTemplate.template_fields[0].modules[0].fields;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if(field_list_array.length == 0){
          field_list_array = ['emp_first_name','emp_last_name','emp_father_name','emp_age','designation','paydays','gross_earning','total_bonus_wages',
          'puja_bonus_or_other_customary_bonus','interim_bonus','ftn_1','deduction_on_account_of_financial_loss','total_sum_deducted_under',
          'net_amount_payable','amount_actually_paid','date_on_which_paid','signature'];
        }
        var wb = new xl.Workbook();
        var ws = wb.addWorksheet("Sheet 1");
        var clmn_id = 1;
        ws.cell(4, clmn_id++).string("SL");
        if(field_list_array.includes('emp_first_name'))
        {
          ws.cell(4, clmn_id++).string("Employee First Name");
        }
        if(field_list_array.includes('emp_last_name'))
        {
          ws.cell(4, clmn_id++).string("Employee Last Name");
        }
        if(field_list_array.includes('emp_father_name'))
        {
          ws.cell(4, clmn_id++).string("Employee Father Name");
        }
        if(field_list_array.includes('emp_age'))
        {
          ws.cell(4, clmn_id++).string("Whether he has completed 15 years of age at the beginning of the accounting year");
        }
        if(field_list_array.includes('designation'))
        {
          ws.cell(4, clmn_id++).string("Designation");
        }
        if(field_list_array.includes('paydays'))
        {
          ws.cell(4, clmn_id++).string("No. of days worked in the year");
        }
        if(field_list_array.includes('gross_earning'))
        {
          ws.cell(4, clmn_id++).string("Total salary or wage in respect of the accounting year");
        }
        if(field_list_array.includes('total_bonus_wages'))
        {
          ws.cell(4, clmn_id++).string("Amount of bonus payable");
        }
        if(field_list_array.includes('puja_bonus_or_other_customary_bonus'))
        {
          ws.cell(4, clmn_id++).string("Puja bonus or other customary bonus during the accounting year");
        }
        if(field_list_array.includes('interim_bonus'))
        {
          ws.cell(4, clmn_id++).string("Interim bonus of bonus paid advance");
        }
        if(field_list_array.includes('ftn_1'))
        {
          ws.cell(4, clmn_id++).string("_ftn1");
        }
        if(field_list_array.includes('deduction_on_account_of_financial_loss'))
        {
          ws.cell(4, clmn_id++).string("Deduction on account of financial loss, if any, caused by misconduct of employee");
        }
        if(field_list_array.includes('total_sum_deducted_under'))
        {
          ws.cell(4, clmn_id++).string("Total sum deducted");
        }
        if(field_list_array.includes('net_amount_payable'))
        {
          ws.cell(4, clmn_id++).string("Net Amount Payable");
        }
        if(field_list_array.includes('amount_actually_paid'))
        {
          ws.cell(4, clmn_id++).string("Amount actually paid");
        }
        if(field_list_array.includes('date_on_which_paid'))
        {
          ws.cell(4, clmn_id++).string("Date on which paid");
        }
        if(field_list_array.includes('signature'))
        {
          ws.cell(4, clmn_id++).string("Signature");
        }
        var company_total_paydays_array = [];
        await Promise.all(emps.map(async function(employee, index){
          company_total_paydays_array.push(employee.no_fo_working_days);
          var index_val = 5;
          index_val = index_val + index;
          var clmn_emp_id=1
          ws.cell(index_val, clmn_emp_id++).number(index_val - 4);
          // if(field_list_array.includes('emp_id')){
          //   ws.cell(index_val, clmn_emp_id++).string(employee.emp_id ? String(employee.emp_id) : "");
          // }
          if(field_list_array.includes('emp_first_name')){
            ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name) : "");
          }
          if(field_list_array.includes('emp_last_name')){
            ws.cell(index_val, clmn_emp_id++).string(employee.emp_last_name ? String(employee.emp_last_name) : "");
          }
          if(field_list_array.includes('emp_father_name')){
            ws.cell(index_val, clmn_emp_id++).string(employee.emp_father_name ? String(employee.emp_father_name) : "");
          }
          if(field_list_array.includes('emp_age')){
            ws.cell(index_val, clmn_emp_id++).string(employee.age_of_accounting_year ? String(employee.age_of_accounting_year) : "");
          }
          if(field_list_array.includes('designation')){
            ws.cell(index_val, clmn_emp_id++).string(employee.designation ? String(employee.designation.designation_name) : "");
          }
          if(field_list_array.includes('paydays')){
            ws.cell(index_val, clmn_emp_id++).string(employee.no_fo_working_days ? String(employee.no_fo_working_days) : "0");
          }
          if(field_list_array.includes('gross_earning')){
            ws.cell(index_val, clmn_emp_id++).string(employee.total_salary ? String(employee.total_salary) : "0");
          }
          if(field_list_array.includes('total_bonus_wages')){
            ws.cell(index_val, clmn_emp_id++).string(employee.amount_of_bonus_payable ? String(employee.amount_of_bonus_payable) : "0");
          }
          if(field_list_array.includes('puja_bonus_or_other_customary_bonus')){
            ws.cell(index_val, clmn_emp_id++).string(employee.puja_bonus_or_other_customary_bonus ? String(employee.puja_bonus_or_other_customary_bonus) : "0");
          }
          if(field_list_array.includes('interim_bonus')){
            ws.cell(index_val, clmn_emp_id++).string(employee.interim_bonus ? String(employee.interim_bonus) : "0");
          }
          if(field_list_array.includes('ftn_1')){
            ws.cell(index_val, clmn_emp_id++).string(employee.ftn_1 ? String(employee.ftn_1) : "0");
          }
          if(field_list_array.includes('deduction_on_account_of_financial_loss')){
            ws.cell(index_val, clmn_emp_id++).string(employee.deduction_on_account_of_financial_loss ? String(employee.deduction_on_account_of_financial_loss) : "0");
          }
          if(field_list_array.includes('total_sum_deducted_under')){
            ws.cell(index_val, clmn_emp_id++).string(employee.total_sum_deducted_under ? String(employee.total_sum_deducted_under) : "0");
          }
          if(field_list_array.includes('net_amount_payable')){
            ws.cell(index_val, clmn_emp_id++).string(employee.net_amount_payable ? String(employee.net_amount_payable) : "0");
          }
          if(field_list_array.includes('amount_actually_paid')){
            ws.cell(index_val, clmn_emp_id++).string(employee.amount_actually_paid ? String(employee.amount_actually_paid) : "0");
          }
          if(field_list_array.includes('date_on_which_paid')){
            ws.cell(index_val, clmn_emp_id++).string(employee.date_on_which_paid ? String(employee.date_on_which_paid) : "");
          }
          if(field_list_array.includes('signature')){
            ws.cell(index_val, clmn_emp_id++).string("");
          }
          
        })).then(async (value) => {
          // wb.write("bonus_report_15_form_c_data.xlsx");
          var yearEnd = "";
          if(company_details){
            if(company_details.preference_settings){
              if(company_details.preference_settings.financial_year_end){
                yearEnd = moment(company_details.preference_settings.financial_year_end).format("DD MMMM YYYY");
              }
            }
          }
          var company_total_paydays = Math.max.apply(null, company_total_paydays_array);
          ws.cell(1, 1, 1, 18, true).string("BONUS PAID TO EMPLOYEES FOR THE ACCOUNTING YEAR ENDING ON THE "+yearEnd);
          ws.cell(2, 1, 2, 4, true).string("Name of the establishment");
          ws.cell(2, 5, 2, 10, true).string(company ? company.establishment_name : "");
          ws.cell(3, 1, 3, 4, true).string("No. of working days in the year  ");
          ws.cell(3, 5, 3, 10, true).number(company_total_paydays ? company_total_paydays : 0);
          // let file_location = Site_helper.createFiles(wb,"bonus-report-15-form-c-data",'xlsx', req.authData.corporate_id);
          let file_name = "bonus-report-15-form-c-data.xlsx";
          let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/bonus-module');
          await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
          // return resp.status(200).send({ status: 'success',message:"Xlsx created successfully", url: baseurl + file_location});
        });
          // return resp.status(200).send({ status: 'success',message:"Fetch successfully.", employees: emps , company_name:company});
      });
    } 
    catch (e) {
      return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },

  employee_18_form_d_bonus_report_expport: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {};
      if(req.body.wage_month_from && req.body.wage_year_from){
        req.body.wage_month_from = req.body.wage_month_from;
        req.body.wage_year_from = req.body.wage_year_from;
        req.body.wage_month_to = req.body.wage_month_to;
        req.body.wage_year_to = req.body.wage_year_to;
      }
      else{
        req.body.wage_month_from = 3;
        req.body.wage_year_from = parseInt(new Date().getFullYear()) - 1;
        req.body.wage_month_to = 2;
        req.body.wage_year_to = parseInt(new Date().getFullYear());
      }
      var start_month = parseInt(req.body.wage_month_from);
      var start_year = parseInt(req.body.wage_year_from);
      var end_month = parseInt(req.body.wage_month_to);
      var end_year = parseInt(req.body.wage_year_to);
      
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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $in: ids };
            }
        }
      }
      var company_search_option = {
        $match: {
          $and: [
          { corporate_id: req.authData.corporate_id },
          { _id: mongoose.Types.ObjectId(req.authId)},
          ],
        },
      };
      var company = await Company.aggregate([company_search_option,
        {
          $lookup: {
            from: "company_details",
            localField: "corporate_id",
            foreignField: "details.corporate_id",
            as: "company_details",
          },
        },
        {
          $lookup: {
            from: "employees",
            "let": { "emp_db_idVar": "$corporate_id"},
            "pipeline": [
              { 
                "$match": { 
                $and :[
                {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                {"status": { $eq: "active"}}
                ] 
            } 
          }
          ],
            as: "employee",
          },
        },
        {
          $addFields: {
            company_details: {
              $arrayElemAt: ["$company_details", 0],
            },
            no_of_employee: {
              $size: "$employee",
            },
          },
        },
        {
          $project: {
            _id: 1,
            "company_details.details":1,
            "company_details.reg_office_address":1,
            "no_of_employee":1,
          },
        },
        ]);
      search_option_details.$match["employee_monthly_reports.bonus_report"] =
        { $exists: true, $ne: null };
      var myAggregate = Employee.aggregate([search_option,
      {
        $lookup: {
          from: "employee_details",
          localField: "_id",
          foreignField: "employee_id",
          as: "employee_details",
        },
      },
      {
        $lookup:{
          from: 'employee_monthly_reports',
          "let": { "emp_db_idVar": "$_id"},
          "pipeline": [
          { 
            "$match": { 
              $and :[
              {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
              {$or:[ 
                  {'wage_year': {$gt: start_year }}, 
                  { $and:[
                      {'wage_year': {$gte: start_year }},
                      {'wage_month': {$gte: start_month }}
                      ]
                  } 
                  ]
              },
              { $or:[ 
                  {'wage_year': {$lt: end_year }}, 
                  { $and:[
                      {'wage_year': {$lte: end_year }},
                      {'wage_month': {$lte: end_month }}
                      ]
                  } 
                  ]
              }
              ] 
            } 
          }
          ],
          as: 'employee_monthly_reports',
        }
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
          "employee_monthly_reports":1
        },
      },
      ]);
      myAggregate.then(async (emps) => {
        var no_of_bonus_employee = emps.length;
        var total_bonus_amount = 0;
        var total_paid_bonus_amount = 0;
        await Promise.all(emps.map(function(employee){
          if(employee.employee_monthly_reports){
            if(employee.employee_monthly_reports.length > 0){
              employee.employee_monthly_reports.map(function(monthlyEmp){
                if(monthlyEmp.bonus_report){
                  // no_of_bonus_employee += 1;
                  if(monthlyEmp.bonus_report.module_data){
                    if(monthlyEmp.bonus_report.module_data.bonus_value){
                      if(monthlyEmp.bonus_report.bank_ins_referance_id != ''){
                        total_paid_bonus_amount += parseFloat(monthlyEmp.bonus_report.bonus_wages);
                      }
                      total_bonus_amount += parseFloat(monthlyEmp.bonus_report.module_data.bonus_value);
                    }
                  }
                }
              });
            }
          }
        }));
        if(company){
          if(company.length > 0){
            company[0].no_of_bonus_employee = no_of_bonus_employee;
            company[0].total_paid_bonus_amount = total_paid_bonus_amount;
            company[0].total_bonus_amount = total_bonus_amount;
          }
        }
        var field_list_array = [];
        if(req.body.template_id) {
          var employeeSheetTemplate = await EmployeeSheetTemplate.findOne({'_id':mongoose.Types.ObjectId(req.body.template_id)});
          if(employeeSheetTemplate){
            if(employeeSheetTemplate.template_fields){
              if(employeeSheetTemplate.template_fields.length > 0){
                if(employeeSheetTemplate.template_fields[0].modules){
                  if(employeeSheetTemplate.template_fields[0].modules.length > 0){
                    if(employeeSheetTemplate.template_fields[0].modules[0].fields){
                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.length > 0){
                        field_list_array=employeeSheetTemplate.template_fields[0].modules[0].fields;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        if(field_list_array.length == 0){
          field_list_array = ['total_bonus_amount','settlement','percentage' ,'total_bonus_amount_actually_paid','date','whether','remarks'];
        }
        var wb = new xl.Workbook();
        var ws = wb.addWorksheet("Sheet 1");
        var clmn_id = 1;
        // ws.cell(1, clmn_id).string("SL");
        // ws.cell(1, clmn_id++).string("Name of the establishment and its complete postal address");
        // if(field_list_array.includes('name_of_employer'))
        // {
        //   ws.cell(1, clmn_id++).string("Name of the employer");
        // }
        // if(field_list_array.includes('no_of_employee'))
        // {
        //   ws.cell(1, clmn_id++).string("Total number of employee");
        // }
        // if(field_list_array.includes('no_of_bonus_employee'))
        // {
        //   ws.cell(1, clmn_id++).string("Number of employees benefited by bonus payments");
        // }
        if(field_list_array.includes('total_bonus_amount'))
        {
          ws.cell(7, clmn_id++).string("Tota amount payable as bonus under Section 10 or 11 of the Payment of Bonus Act, 1965, as the case may be");
        }
        if(field_list_array.includes('settlement'))
        {
          ws.cell(7, clmn_id++).string("Settlement if any, reached under Section 18(1) or 12 (3) of the Industrial Disputes Act, 1947 with date");
        }
        if(field_list_array.includes('percentage'))
        {
          ws.cell(7, clmn_id++).string("Percentage of bonus declared to be paid");
        }
        if(field_list_array.includes('total_bonus_amount_actually_paid'))
        {
          ws.cell(7, clmn_id++).string("Total amount of bonus actually paid");
        }
        if(field_list_array.includes('date'))
        {
          ws.cell(7, clmn_id++).string("Date on which payment made");
        }
        if(field_list_array.includes('whether'))
        {
          ws.cell(7, clmn_id++).string("Whether bonus has been paid to all the employees if not, reason for non-payment");
        }
        if(field_list_array.includes('remarks'))
        {
          ws.cell(7, clmn_id++).string("Remarks");
        }
        var address = "";
        var name_employeer = "";
        if(company[0]){
          if(company[0].company_details){
            if(company[0].company_details.details && company[0].company_details.reg_office_address){
              address = company[0].company_details.details.establishment_name +" "+ 
              company[0].company_details.reg_office_address.door_no +" "+ 
              company[0].company_details.reg_office_address.street_name +" "+ 
              company[0].company_details.reg_office_address.locality +" "+ 
              company[0].company_details.reg_office_address.district_name +" "+ 
              company[0].company_details.reg_office_address.state +" "+ 
              company[0].company_details.reg_office_address.pin_code;
            }
            if(company[0].company_details.details){
              name_employeer = company[0].company_details.details.establishment_name;
            }
          }
        }
        var index_val = 8;
        var clmn_emp_id=1;
        // ws.cell(index_val, clmn_emp_id).number(index_val - 1);

        // ws.cell(index_val, clmn_emp_id++).string(address ? String(address) : "");
        // if(field_list_array.includes('name_of_employer')){
        //   ws.cell(index_val, clmn_emp_id++).string(name_employeer ? String(name_employeer) : "");
        // }
        // if(field_list_array.includes('no_of_employee')){
        //   ws.cell(index_val, clmn_emp_id++).string(company[0].no_of_employee ? String(company[0].no_of_employee) : "");
        // }
        // if(field_list_array.includes('no_of_bonus_employee')){
        //   ws.cell(index_val, clmn_emp_id++).string(company[0].no_of_bonus_employee ? String(company[0].no_of_bonus_employee) : "0");
        // }
        if(field_list_array.includes('total_bonus_amount')){
          ws.cell(index_val, clmn_emp_id++).string(company[0].total_bonus_amount ? String(company[0].total_bonus_amount) : "0");
        }
        if(field_list_array.includes('settlement'))
        {
          ws.cell(index_val, clmn_emp_id++).string("");
        }
        if(field_list_array.includes('percentage'))
        {
         ws.cell(index_val, clmn_emp_id++).string("");
        }
        if(field_list_array.includes('total_bonus_amount_actually_paid')){
          ws.cell(index_val, clmn_emp_id++).string(company[0].total_paid_bonus_amount ? String(company[0].total_paid_bonus_amount) : "0");
        }
        if(field_list_array.includes('date')){
          ws.cell(index_val, clmn_emp_id++).date(new Date());
        }
        if(field_list_array.includes('whether'))
        {
           ws.cell(index_val, clmn_emp_id++).string("");
        }
        if(field_list_array.includes('remarks'))
        {
          ws.cell(index_val, clmn_emp_id++).string("");
        }
        // wb.write("bonus_report_18_form_d_data.xlsx");
        var form_date = moment().month(start_month ? start_month : 0).format("MMMM") + " - " +start_year;
        var end_date =  moment().month(end_month ? end_month : 0).format("MMMM") + " - " +end_year;

        ws.cell(1, 1, 1, 7, true).string("Annual Return - Bonus paid to employees for the accounting year ending on  "+ form_date +"  to " + end_date + " ");
        ws.cell(2, 1, 2, 3, true).string("Name of the establishment and its complete postal address:");
        ws.cell(2, 4, 2, 7, true).string(address ? address : "");
        ws.cell(3, 1, 3, 3, true).string("Nature of industry:");
        ws.cell(3, 4, 3, 7, true).string("");
        ws.cell(4, 1, 4, 3, true).string("Name of the employer:");
        ws.cell(4, 4, 4, 7, true).string(name_employeer ? name_employeer : "");
        ws.cell(5, 1, 5, 3, true).string("Total number of employee:");
        ws.cell(5, 4, 5, 7, true).number(company[0].no_of_employee ? company[0].no_of_employee : 0);
        ws.cell(6, 1, 6, 3, true).string("Number of employees benefited by bonus payments:");
        ws.cell(6, 4, 6, 7, true).number(company[0].no_of_bonus_employee ? company[0].no_of_bonus_employee : 0);
        

        // let file_location = Site_helper.createFiles(wb,"bonus-report-18-form-d-data",'xlsx', req.authData.corporate_id);
        let file_name = "bonus-report-18-form-d-data.xlsx";
        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/bonus-module');
        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
        // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
        // return resp.status(200).send({ status: 'success',message:"Xlsx created successfully", url: baseurl + file_location});
        // return resp.status(200).send({ status: 'success',message:"Fetch successfully.",data:company});
      })
    } 
    catch (e) {
      return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },

  generated_bonus_slip_list: async function (req, resp, next) {
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
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {};
      // if(req.body.wage_year){
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(req.body.wage_year) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(req.body.wage_year);
      // }
      // else{
      //   req.body.wage_month_from = 3;
      //   req.body.wage_year_from = parseInt(new Date().getFullYear()) - 1;
      //   req.body.wage_month_to = 2;
      //   req.body.wage_year_to = parseInt(new Date().getFullYear());
      // }
      var wage_month = parseInt(+req.body.wage_month);
      var wage_year = parseInt(+req.body.wage_year);
      // var end_month = parseInt(+req.body.wage_month_to);
      // var end_year = parseInt(+req.body.wage_year_to);

      var search_option = {
        $match: {
          $and: [
          { corporate_id: req.authData.corporate_id },
          // { parent_hods: { $in: [req.authId] } },
            {"wage_month": parseInt(wage_month)},
            {"wage_year": parseInt(wage_year)},
          ],
        },
      };

      var search_option_details = { $match: {} };
      
      if (req.body.advance_filter == "yes") {
        // if (req.body.age_to && req.body.age_from) {
        //   const to_d = new Date();
        //   const from_d = new Date();
        //   var age_to_date = to_d.toDateString(
        //     to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
        //     );
        //   var age_from_date = from_d.toDateString(
        //     from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
        //     );
        //   search_option.$match.emp_dob = {
        //     $gte: new Date(age_to_date),
        //     $lt: new Date(age_from_date),
        //   };
        // }
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
        search_option.$match = {
          // $text: { $search: req.body.searchkey },
          $or: [
            { emp_first_name: { $regex: req.body.searchkey, $options: "i" } },
            { emp_last_name: { $regex: req.body.searchkey, $options: "i" } },
            { emp_id: { $regex: req.body.searchkey, $options: "i" } }
          ],
          corporate_id: req.authData.corporate_id,
        };

      } else {
        if (req.body.emp_first_name) {
          search_option.$match['employees.emp_first_name'] = {
            $regex: req.body.emp_first_name,
            $options: "i",
          };
        }
        if (req.body.emp_last_name) {
          search_option.$match['employees.emp_last_name'] = {
            $regex: req.body.emp_last_name,
            $options: "i",
          };
        }
        if (req.body.email_id) {
          search_option.$match['employees.email_id'] = {
            $regex: req.body.email_id,
            $options: "i",
          };
        }
        if (req.body.pan_no) {
          search_option.$match['employees.pan_no'] = {
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
      if(req.body.checked_row_ids && req.body.unchecked_row_ids){
        if (req.body.row_checked_all === "true") {
            if(typeof req.body.unchecked_row_ids == "string"){
                var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option_details.$match["employees._id"] = { $nin: ids };
            }
        } else {
            if(typeof req.body.checked_row_ids == "string"){
                var ids = JSON.parse(req.body.checked_row_ids);
            }
            else{
                var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
            }
            if (ids.length > 0) {
                ids = ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                });
                search_option_details.$match["employees._id"] = { $in: ids };
            }
        }
      }
      var company = await Company.findOne({'_id':req.authId},'establishment_name');
      var company_details = await CompanyDetails.findOne({'company_id':req.authId},'preference_settings.financial_year_end');
      
      
      var myAggregate = BonusPayslip.aggregate([search_option,
      {
        $lookup: {
          from: "employees",
          localField: "emp_id",
          foreignField: "emp_id",
          as: "employees",
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
          from: "employee_details",
          localField: "employees._id",
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
      search_option_details,
      {
        $addFields: {
          hod: {
            $arrayElemAt: ["$hod", 0],
          },
          employees: {
            $arrayElemAt: ["$employees", 0],
          },
          employee_details: {
            $arrayElemAt: ["$employee_details", 0],
          },
          client: {
            $arrayElemAt: ["$client", 0],
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
          corporate_id: 1,
          emp_id: 1,
          wage_month: 1,
          wage_year: 1,
          ctc:1,
          gross_earning:1,
          net_pay:1,
          pdf_file_name:1,
          pdf_link:1,
          "designation.designation_name": 1,
          "department.department_name": 1,
          "branch.branch_name": 1,
          "employee_id":"$employees._id",
          "emp_data.emp_id":1,
          "emp_data.emp_first_name":1,
          "emp_data.emp_last_name":1,
          "emp_data.client":1,
          "emp_data.branch":1,
          "emp_data.department":1,
          "emp_data.designation":1,
          "emp_data.hod":1,
          "employee_details.template_data.bonus_temp_data":1,
          status:1,
          total_update:1,
          created_at:1,
          updated_at:1,
        },
      },
      ]); 
      if(req.body.generate == 'yes'){
        var path_link = "";
        myAggregate.then(async (bonus_slips) => {
          let file_name = "bonus-slip-"+wage_month+"-"+wage_year+".zip";
          var file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/bonus-module');
          if(bonus_slips.length > 0){
            // var dir = absolutePath+"/storage/company/temp_files/"+req.authData.corporate_id+"/bonus_slip/";
            var dir = absolutePath+file.location;
            
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            const output = fs.createWriteStream(dir+file.file_name);
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
            await Promise.all(bonus_slips.map(async function(bonus_slip){
              
              if(bonus_slip && bonus_slip.pdf_file_name){ 
                // var path_link = absolutePath+file.location+bonus_slip.pdf_file_name;
                var path_link = absolutePath+bonus_slip.pdf_link;
                
                if (fs.existsSync(path_link)){                  
                    archive.append(fs.createReadStream(path_link), { name: bonus_slip.pdf_file_name });
                }
              }
            })).then(async (emp) => { 
              archive.finalize();
              // file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/bonus_slip/";
              
              await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
              // await Site_helper.downloadAndDelete(file_name,file_path,req.authData.corporate_id,resp);
              // path_link = baseurl+'storage/company/temp_files/'+req.authData.corporate_id+'/bonus_slip/bonus-slip-'+wage_month+'-'+wage_year+'.zip';
              // return resp.status(200).json({ status: "success",  message: 'Bonus slip archive successfully.', url:path_link});
            });
          }
          else{
            return resp.status(403).json({ status: "error",  message: 'Bonus slip archive not successfully.', url:path_link});
          }
        });
      }
      else{
        BonusPayslip.aggregatePaginate(myAggregate,options,async function (err, employees) {
          if (err) return resp.json({ status: "error", message: err.message });

          return resp
          .status(200)
          .json({
            status: "success",
            employees: employees,
          });
        });
      }
      
    } 
    catch (e) {
      return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },
};
function frequency_monthf(date = new Date(), freq) {
  var monthspan = "";
  var ret_arr = [];
  if (freq == 6) {
    var counter = 2;
  } else {
    var counter = 4;
  }
  for ($i = 0; $i < counter; $i++) {
    monthspan = new Date(date.setMonth(date.getUTCMonth() + freq));
    ret_arr.push(monthspan.getUTCMonth());
  }
  return ret_arr;
}
function calculate_bonus(
  bonus_temp_data,
  date_of_join,
  gross_salary,
  bonus_module,
  total_bonus_wages,
  com_data
  ) {
  var bonus_value = parseFloat(bonus_module.bonus_value);
  var exgratia_status = parseFloat(bonus_module.exgratia);
  var bonus_wages = total_bonus_wages;
  var gov_calculate_bonus =
  (bonus_temp_data.max_bonus_wage * bonus_temp_data.max_bonus) / 100;
  var bonus_amount = 0;
  var exgratia_amount = 0;
  var month_diff = getMonthDifference(new Date(date_of_join), new Date());
  var year_ending = com_data.financial_year_end;
  /* check if employee service period is eligible or not */
  if (month_diff >= bonus_temp_data.min_service) {
    var current_date = new Date();
    var curr_month = current_date.getUTCMonth();
    /* check DISBURSEMENT FREQUENCY */
    if (bonus_temp_data.disbursement_frequency == "yearly") {
      var bonus_wage_month = new Date(bonus_module.bonus_wage_month);
      bonus_wage_month = bonus_wage_month.getUTCMonth();
      if (bonus_wage_month != curr_month) {
        var bonusdata = {
          bonus_amount: 0,
          exgratia_amount: 0,
        };
        return bonusdata;
      }
    } else if (bonus_temp_data.disbursement_frequency == "quaterly") {
      var frequency_month = frequency_monthf(new Date(year_ending), 3);
      if (!frequency_month.includes(curr_month)) {
        var bonusdata = {
          bonus_amount: 0,
          exgratia_amount: 0,
        };
        return bonusdata;
      }
    } else if (bonus_temp_data.disbursement_frequency == "half_yearly") {
      var frequency_month = frequency_monthf(new Date(year_ending), 6);
      if (!frequency_month.includes(curr_month)) {
        var bonusdata = {
          bonus_amount: 0,
          exgratia_amount: 0,
        };
        return bonusdata;
      }
    }
    /* check DISBURSEMENT TYPE */
    if (bonus_temp_data.disbursement_type == "fixed") {
      /* calculate the bonus amount and exgratia */
      if (gov_calculate_bonus > bonus_value) {
        bonus_amount = bonus_value;
        exgratia_amount = 0;
      } else {
        exgratia_amount = bonus_value - gov_calculate_bonus;
        bonus_amount = gov_calculate_bonus;
      }
    } else {
      /* calculate the bonus amount and exgratia */
      var com_calculate_bonus = (bonus_wages * bonus_value) / 100;
      if (gov_calculate_bonus > com_calculate_bonus) {
        bonus_amount = com_calculate_bonus;
        exgratia_amount = 0;
      } else {
        exgratia_amount = com_calculate_bonus - gov_calculate_bonus;
        bonus_amount = gov_calculate_bonus;
      }
      //console.log(com_calculate_bonus,'-',bonus_amount)
    }
    if (exgratia_status === "off") {
      if (gross_salary > bonus_temp_data.eligible_capping) {
        /* if employee not eligible for bonus then set the bonus value  */
        bonus_amount = 0;
      }
      /* if exgratia is off then set the ex-gratia value  */
      exgratia_amount = 0;
    }
  }
  var bonusdata = {
    bonus_amount: bonus_amount,
    exgratia_amount: exgratia_amount,
  };
  return bonusdata;
}
function getMonthDifference(startDate, endDate) {
  return (
    endDate.getUTCMonth() -
    startDate.getUTCMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
    );
}
