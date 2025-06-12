const { Validator } = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var Employee = require("../../Model/Company/employee");
var Revision = require("../../Model/Company/Revision");
var RevisionLog = require("../../Model/Company/RevisionLog");
var RevisionReport = require("../../Model/Company/RevisionReport");
var SalaryTemp = require("../../Model/Admin/SalaryTemp");
var EmployeePackage = require("../../Model/Company/EmployeePackage");
var Attendancerule = require("../../Model/Admin/Attendance");
var BonusTemp = require("../../Model/Admin/BonusTemp");
var IncentiveTemp = require("../../Model/Admin/IncentiveTemp");
var OvertimeTemp = require("../../Model/Admin/OvertimeTemp");
var Ptaxrule = require("../../Model/Admin/Ptaxrule");
var Tdsrule = require("../../Model/Admin/Tdsrule");
var LeaveRule = require("../../Model/Admin/LeaveRule");
var LwfRule = require("../../Model/Admin/LwfRule");
var BankInstruction = require('../../Model/Company/BankInstruction');
var EmployeeMonthlyReport=require('../../Model/Company/EmployeeMonthlyReport');
var PaymentSheet=require('../../Model/Company/PaymentSheet');
var ScheduleJob = require('../../Model/Company/ScheduleJob');
var Site_helper = require("../../Helpers/Site_helper");
const mongoose = require("mongoose");
var xl = require('excel4node');
var fs = require("fs");
const employeeDetails = require("../../Model/Company/employee_details");
const PayslipTemp = require("../../Model/Admin/PayslipTemp");
var ArrearSlipTemp = require("../../Model/Admin/ArrearSlipTemp");
var BonusSlipTemp = require("../../Model/Admin/BonusSlipTemp");

module.exports = {
  get_employee_revision_list: async function (req, resp, next) {
    const v = new Validator(req.body, {
      pageno: "required",
      attendance_type: "required",
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
            approval_status: "approved",
            parent_hods: { $in: [req.authId] },
          },
        };
      } else {
          var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
          search_option_details=query_data.search_option_details;
          search_option=query_data.search_option;
      }
      search_option_details.$match[
        "employee_details.template_data.attendance_temp_data.register_type"
      ] = req.body.attendance_type;

      if(req.body.checked_row_ids || req.body.unchecked_row_ids || req.body.row_checked_all){
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
        search_option_details,
        {
          $lookup: {
            from: "revisions",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision",
          },
        },
        {
          $lookup: {
            from: "revision_logs",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision_log",
          },
        },
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            revision: {
              $arrayElemAt: ["$revision", 0],
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
            "employee_details.template_data": 1,
            "revision.emp_db_id": 1,
            "revision.salary_temp_id": 1,
            "revision.policy_pack_id": 1,
            "revision.gross_salary": 1,
            "revision.effect_from": 1,
            "revision.revision_year": 1,
            "revision.revision_month": 1,
            logcount: { $size: "$revision_log" },
          },
        },
      ]);

      // const findMethod = req.body.multiEdit == 'true' ? "find" : "aggregatePaginate";
      if(req.body.multiEdit == 'true'){
        myAggregate.then(employees => {
          return resp
              .status(200)
              .json({ status: "success", employees: employees });
        }).catch(err => {
          return resp.json({ status: "error", message: err.message });
        })
        // Employee.aggregate(
        //   myAggregate,
        //   options,
        //   async function (err, employees) {
        //     if (err) 
            
        //   }
        // );
      }else{
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
      }
    }
  },
  update_employee_revision_data: async function (req, resp, next) {
    const v = new Validator(req.body, {
      // gross_salary: "required",
      effect_from: "required",
      revision_month: "required",
      revision_year: "required",
      // policy_pack_id: "required",
      // salary_temp_id: "required",
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
            from: "revisions",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision",
          },
        },
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            revision: {
              $arrayElemAt: ["$revision", 0],
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
            "revision.emp_db_id": 1,
            "revision.salary_temp_id": 1,
            "revision.policy_pack_id": 1,
            "revision.gross_salary": 1,
            "revision.effect_from": 1,
            "revision.revision_year": 1,
            "revision.revision_month": 1,
          },
        },
      ]).then(async (revision_emp) => {
        await Promise.all(
          revision_emp.map(async (empdata) => {
            var temp_document = {};
            var temp_data = {};
            var prev_temp_data = {};
            var revision_unique_id=empdata.emp_id+'_'+Date.now();
            var effect_from =  new Date(req.body.effect_from);

            const prev_salary_temp_id = empdata.employee_details.employment_hr_details.salary_temp
            const prev_policy_pack_id = empdata.employee_details.employment_hr_details.package_id
            
            if(!req.body.salary_temp_id){
              req.body.salary_temp_id = prev_salary_temp_id
            }
            if(!req.body.policy_pack_id){
              req.body.policy_pack_id = prev_policy_pack_id
            }
            if(!req.body.gross_salary){
              req.body.gross_salary = empdata.employee_details.employment_hr_details.gross_salary
            }


            if (req.body.salary_temp_id) {
              /* check and assign Salary template */
              var salltempdata = SalaryTemp.findOneAndUpdate(
                { _id: req.body.salary_temp_id },
                { $set: { edit_status: "inactive" } },
                { returnOriginal: false }
              );
              temp_data["salary_temp_data"] = await salltempdata;
              //temp_document['template_data.salary_temp_data']=await salltempdata;
            }
            if (req.body.policy_pack_id) {
              /* check and assign Salary template */
              var packagedata = EmployeePackage.findOne({
                _id: req.body.policy_pack_id,
              });
              
              packagedata = await packagedata;
              temp_data["attendance_temp_data"] = await Attendancerule.findOne(
                { status: "active", _id: packagedata.attendance_temp },
                "-history"
              );
              temp_data["bonus_temp_data"] = await BonusTemp.findOne(
                { _id: packagedata.bonus_temp },
                "-history"
              );
              temp_data["incentive_temp_data"] = await IncentiveTemp.findOne(
                { _id: packagedata.incentive_temp },
                "-history"
              );
              temp_data["overtime_temp_data"] = await OvertimeTemp.findOne(
                { _id: packagedata.overtime_temp },
                "-history"
              );
              temp_data["ptax_temp_data"] = await Ptaxrule.findOne(
                { _id: packagedata.ptax_temp },
                "-history"
              );
              temp_data["leave_temp_data"] = await LeaveRule.findOne(
                { _id: packagedata.leave_temp },
                "-history"
              );
              temp_data["lwf_temp_data"] = await LwfRule.findOne(
                { _id: packagedata.lwf_temp },
                "-history"
              );
              temp_data["tds_temp_data"] = await Tdsrule.findOne(
                { _id: packagedata.tds_temp },
                "-history"
              );
              temp_data["payslip_temp_data"] = await PayslipTemp.findOne(
                { _id: packagedata.payslip_temp },
                "-history"
              );
              temp_data["bonus_slip_temp_data"] = await BonusSlipTemp.findOne(
                  { _id: packagedata.bonus_slip_temp },
                  "-history"
              );
              temp_data["arrear_slip_temp_data"] = await ArrearSlipTemp.findOne(
                  { _id: packagedata.arrear_slip_temp },
                  "-history"
              );
            }
            if (prev_salary_temp_id) {
              /* check and assign Salary template */
              var salltempdata = SalaryTemp.findOneAndUpdate(
                { _id: prev_salary_temp_id },
                { $set: { edit_status: "inactive" } },
                { returnOriginal: false }
              );
              prev_temp_data["salary_temp_data"] = await salltempdata;
              //temp_document['template_data.salary_temp_data']=await salltempdata;
            }
            if (prev_policy_pack_id) {
              /* check and assign Salary template */
              var packagedata = EmployeePackage.findOne({
                _id: prev_policy_pack_id,
              });
              
              packagedata = await packagedata;
              prev_temp_data["attendance_temp_data"] = await Attendancerule.findOne(
                { status: "active", _id: packagedata.attendance_temp },
                "-history"
              );
              prev_temp_data["bonus_temp_data"] = await BonusTemp.findOne(
                { _id: packagedata.bonus_temp },
                "-history"
              );
              prev_temp_data["incentive_temp_data"] = await IncentiveTemp.findOne(
                { _id: packagedata.incentive_temp },
                "-history"
              );
              prev_temp_data["overtime_temp_data"] = await OvertimeTemp.findOne(
                { _id: packagedata.overtime_temp },
                "-history"
              );
              prev_temp_data["ptax_temp_data"] = await Ptaxrule.findOne(
                { _id: packagedata.ptax_temp },
                "-history"
              );
              prev_temp_data["leave_temp_data"] = await LeaveRule.findOne(
                { _id: packagedata.leave_temp },
                "-history"
              );
              prev_temp_data["lwf_temp_data"] = await LwfRule.findOne(
                { _id: packagedata.lwf_temp },
                "-history"
              );
              prev_temp_data["tds_temp_data"] = await Tdsrule.findOne(
                { _id: packagedata.tds_temp },
                "-history"
              );
              prev_temp_data["payslip_temp_data"] = await PayslipTemp.findOne(
                { _id: packagedata.payslip_temp },
                "-history"
              );
              prev_temp_data["bonus_slip_temp_data"] = await BonusSlipTemp.findOne(
                  { _id: packagedata.bonus_slip_temp },
                  "-history"
              );
              prev_temp_data["arrear_slip_temp_data"] = await ArrearSlipTemp.findOne(
                  { _id: packagedata.arrear_slip_temp },
                  "-history"
              );
            }
            
            temp_document["template_data"] = temp_data;
            temp_document["prev_template_data"] = prev_temp_data;
            temp_document["gross_salary"] = req.body.gross_salary;
            temp_document["prev_gross_salary"] = empdata.employee_details.employment_hr_details.gross_salary;
            temp_document["effect_from"] = req.body.effect_from;
            temp_document["effect_from_month"] = effect_from.getUTCMonth();
            temp_document["effect_from_year"] = effect_from.getUTCFullYear();
            temp_document["revision_month"] = req.body.revision_month;
            temp_document["revision_year"] = req.body.revision_year;
            temp_document["policy_pack_id"] = req.body.policy_pack_id;
            temp_document["prev_policy_pack_id"] = prev_policy_pack_id;
            temp_document["salary_temp_id"] = req.body.salary_temp_id;
            temp_document["prev_salary_temp_id"] = prev_salary_temp_id;
            temp_document["emp_id"] = empdata.emp_id;
            temp_document["revision_log_unique_id"] =revision_unique_id;
            temp_document["run_revision_status"] ='pending';            
            (temp_document["corporate_id"] = req.authData.corporate_id),
              (temp_document["emp_db_id"] = mongoose.Types.ObjectId(
                empdata._id
              ));
              
            var document = {
              corporate_id: req.authData.corporate_id,
              emp_db_id: mongoose.Types.ObjectId(empdata._id),
              emp_id: empdata.emp_id,
              status: "active",
              gross_salary: req.body.gross_salary,
              effect_from: req.body.effect_from,
              effect_from_month:effect_from.getUTCMonth(),
              effect_from_year:effect_from.getUTCFullYear(),
              revision_month: req.body.revision_month,
              revision_year: req.body.revision_year,
              policy_pack_id: req.body.policy_pack_id,
              salary_temp_id: req.body.salary_temp_id,
              template_data: temp_data,
              revision_unique_id:revision_unique_id,
              revision_status:"pending",
              created_at: Date.now(),
            };
            var esic_temp = await Site_helper.get_gov_esic_data(req);
            if (parseFloat(esic_temp.wage_ceiling) > parseFloat(req.body.gross_salary))
            {
              temp_document['esic_covered']= 'yes';                       
              document['esic_covered']= 'yes';                       
            }
            else
            {
              temp_document['esic_covered']= 'yes';                       
              document['esic_covered']= 'no';
            }
            await Revision.findOneAndUpdate(
              { emp_id: empdata.emp_id },
              document,
              { upsert: true, new: true, setDefaultsOnInsert: true },
              async function (err, revisionData) {
                if (err)
                  return resp
                    .status(200)
                    .send({ status: "error", message: err.message });
                temp_document["revision_id"] = revisionData._id;
                await RevisionLog.create(temp_document);
              }
            );
          })
        ).then((value) => {
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Revision data updated successfully",
            });
        });
      });
    }
  },
  update_checked_employee_revision_data: async function (req, resp, next) {
    const v = new Validator(req.body, {
      emp_revision_data: "required",
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

      var emp_revision_data = JSON.parse(req.body.emp_revision_data);


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
            from: "revisions",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision",
          },
        },
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            revision: {
              $arrayElemAt: ["$revision", 0],
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
            "revision.emp_db_id": 1,
            "revision.salary_temp_id": 1,
            "revision.policy_pack_id": 1,
            "revision.gross_salary": 1,
            "revision.effect_from": 1,
            "revision.revision_year": 1,
            "revision.revision_month": 1,
          },
        },
      ]).then(async (revision_emp) => {
      // await Promise.all(
      for (const empdata of revision_emp) {
        // revision_emp.map(async (empdata) => {
          emp_rev_data = emp_revision_data.find(emp => emp._id == empdata._id)
          if(emp_rev_data){
            const temp_document = {};
            const temp_data = {};
            const prev_temp_data = {};
            const revision_unique_id=empdata.emp_id+'_'+Date.now();
            const effect_from =  new Date(emp_rev_data.effect_from);
  
            const prev_salary_temp_id = empdata.employee_details.employment_hr_details.salary_temp
            const prev_policy_pack_id = empdata.employee_details.employment_hr_details.package_id
  
            if (emp_rev_data.salary_temp_id) {
              /* check and assign Salary template */
              const salltempdata = SalaryTemp.findOneAndUpdate(
                { _id: emp_rev_data.salary_temp_id },
                { $set: { edit_status: "inactive" } },
                { returnOriginal: false }
              );
              temp_data["salary_temp_data"] = await salltempdata;
              //temp_document['template_data.salary_temp_data']=await salltempdata;
            }
            if (emp_rev_data.policy_pack_id) {
              /* check and assign Salary template */
              const packagedata = await EmployeePackage.findOne({
                _id: emp_rev_data.policy_pack_id,
              });
              
              // packagedata =  packagedata;
              temp_data["attendance_temp_data"] = await Attendancerule.findOne(
                { status: "active", _id: packagedata.attendance_temp },
                "-history"
              );
              temp_data["bonus_temp_data"] = await BonusTemp.findOne(
                { _id: packagedata.bonus_temp },
                "-history"
              );
              temp_data["incentive_temp_data"] = await IncentiveTemp.findOne(
                { _id: packagedata.incentive_temp },
                "-history"
              );
              temp_data["overtime_temp_data"] = await OvertimeTemp.findOne(
                { _id: packagedata.overtime_temp },
                "-history"
              );
              temp_data["ptax_temp_data"] = await Ptaxrule.findOne(
                { _id: packagedata.ptax_temp },
                "-history"
              );
              temp_data["leave_temp_data"] = await LeaveRule.findOne(
                { _id: packagedata.leave_temp },
                "-history"
              );
              temp_data["lwf_temp_data"] = await LwfRule.findOne(
                { _id: packagedata.lwf_temp },
                "-history"
              );
              temp_data["tds_temp_data"] = await Tdsrule.findOne(
                { _id: packagedata.tds_temp },
                "-history"
              );
              temp_data["payslip_temp_data"] = await PayslipTemp.findOne(
                { _id: packagedata.payslip_temp },
                "-history"
              );
              temp_data["bonus_slip_temp_data"] = await BonusSlipTemp.findOne(
                  { _id: packagedata.bonus_slip_temp },
                  "-history"
              );
              temp_data["arrear_slip_temp_data"] = await ArrearSlipTemp.findOne(
                  { _id: packagedata.arrear_slip_temp },
                  "-history"
              );
            }
            if (prev_salary_temp_id) {
              /* check and assign Salary template */
              const salltempdata = SalaryTemp.findOneAndUpdate(
                { _id: prev_salary_temp_id },
                { $set: { edit_status: "inactive" } },
                { returnOriginal: false }
              );
              prev_temp_data["salary_temp_data"] = await salltempdata;
              //temp_document['template_data.salary_temp_data']=await salltempdata;
            }
            if (prev_policy_pack_id) {
              /* check and assign Salary template */
              const packagedata = await EmployeePackage.findOne({
                _id: prev_policy_pack_id,
              });

              // packagedata = await packagedata;
              prev_temp_data["attendance_temp_data"] = await Attendancerule.findOne(
                { status: "active", _id: packagedata.attendance_temp },
                "-history"
              );
              prev_temp_data["bonus_temp_data"] = await BonusTemp.findOne(
                { _id: packagedata.bonus_temp },
                "-history"
              );
              prev_temp_data["incentive_temp_data"] = await IncentiveTemp.findOne(
                { _id: packagedata.incentive_temp },
                "-history"
              );
              prev_temp_data["overtime_temp_data"] = await OvertimeTemp.findOne(
                { _id: packagedata.overtime_temp },
                "-history"
              );
              prev_temp_data["ptax_temp_data"] = await Ptaxrule.findOne(
                { _id: packagedata.ptax_temp },
                "-history"
              );
              prev_temp_data["leave_temp_data"] = await LeaveRule.findOne(
                { _id: packagedata.leave_temp },
                "-history"
              );
              prev_temp_data["lwf_temp_data"] = await LwfRule.findOne(
                { _id: packagedata.lwf_temp },
                "-history"
              );
              prev_temp_data["tds_temp_data"] = await Tdsrule.findOne(
                { _id: packagedata.tds_temp },
                "-history"
              );
              prev_temp_data["payslip_temp_data"] = await PayslipTemp.findOne(
                { _id: packagedata.payslip_temp },
                "-history"
              );
              prev_temp_data["bonus_slip_temp_data"] = await BonusSlipTemp.findOne(
                  { _id: packagedata.bonus_slip_temp },
                  "-history"
              );
              prev_temp_data["arrear_slip_temp_data"] = await ArrearSlipTemp.findOne(
                  { _id: packagedata.arrear_slip_temp },
                  "-history"
              );
            }
            
            temp_document["template_data"] = temp_data;
            temp_document["prev_template_data"] = prev_temp_data;
            temp_document["gross_salary"] = emp_rev_data.gross_salary;
            temp_document["prev_gross_salary"] = empdata.employee_details.employment_hr_details.gross_salary;
            temp_document["effect_from"] = emp_rev_data.effect_from;
            temp_document["effect_from_month"] = effect_from.getUTCMonth();
            temp_document["effect_from_year"] = effect_from.getUTCFullYear();
            temp_document["revision_month"] = emp_rev_data.revision_month;
            temp_document["revision_year"] = emp_rev_data.revision_year;
            temp_document["policy_pack_id"] = emp_rev_data.policy_pack_id;
            temp_document["prev_policy_pack_id"] = prev_policy_pack_id;
            temp_document["salary_temp_id"] = emp_rev_data.salary_temp_id;
            temp_document["prev_salary_temp_id"] = prev_salary_temp_id;
            temp_document["emp_id"] = empdata.emp_id;
            temp_document["revision_log_unique_id"] =revision_unique_id;
            temp_document["run_revision_status"] ='pending';            
            (temp_document["corporate_id"] = req.authData.corporate_id),
              (temp_document["emp_db_id"] = mongoose.Types.ObjectId(
                empdata._id
              ));
              
            const document = {
              corporate_id: req.authData.corporate_id,
              emp_db_id: mongoose.Types.ObjectId(empdata._id),
              emp_id: empdata.emp_id,
              status: "active",
              gross_salary: emp_rev_data.gross_salary,
              effect_from: emp_rev_data.effect_from,
              effect_from_month:effect_from.getUTCMonth(),
              effect_from_year:effect_from.getUTCFullYear(),
              revision_month: emp_rev_data.revision_month,
              revision_year: emp_rev_data.revision_year,
              policy_pack_id: emp_rev_data.policy_pack_id,
              salary_temp_id: emp_rev_data.salary_temp_id,
              template_data: temp_data,
              revision_unique_id:revision_unique_id,
              created_at: Date.now(),
            };
            const esic_temp = await Site_helper.get_gov_esic_data(req);
            if (parseFloat(esic_temp.wage_ceiling) > parseFloat(emp_rev_data.gross_salary))
            {
              temp_document['esic_covered']= 'yes';                       
              document['esic_covered']= 'yes';                       
            }
            else
            {
              temp_document['esic_covered']= 'yes';                       
              document['esic_covered']= 'no';
            }
            delete document["_id"]
            await Revision.findOneAndUpdate(
              { emp_id: empdata.emp_id },
              document,
              { upsert: true, new: true, setDefaultsOnInsert: true },
              async function (err, revisionData) {
                if (err){
                  return resp
                .status(200)
                .send({ status: "error", message: err.message });
                }
                return revisionData
              }
            ).then((data) => {
              delete temp_document["_id"]
              temp_document["revision_id"] = data._id;
              RevisionLog.create(temp_document, (err) => {
                // console.log(err);
              });
            });
          }
        // })
      }
      // ).then((value) => {
        return resp
          .status(200)
          .send({
            status: "success",
            message: "Revision data updated successfully",
          });
      // });
    })
    }
  },
  get_employee_revision_history_data: async function (req, resp) {
    const v = new Validator(req.body, {
      revision_id: "required",
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
      RevisionLog.find(
        { revision_id: req.body.revision_id },
        function (err, revisions) {
          if (err) return resp.json({ status: "error", message: err.message });
          return resp
            .status(200)
            .json({ status: "success", revisions: revisions });
        }
      );
    }
  },
  get_filter_revision_employee_list: async function (req, resp, next) {
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
          var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
          search_option_details=query_data.search_option_details;
          search_option=query_data.search_option;
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
            from: "revisions",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision",
          },
        },
        { $match: { revision: { $exists: true, $ne: [] } } },
        {
          $lookup: {
            from: "revision_reports",
            localField: "revision.revision_unique_id",
            foreignField: "revision_unique_id",
            as: "revision_cal_stat",
          },
        },
        {
          $lookup: {
            from: "revision_logs",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision_log",
          },
        },
        
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            revision: {
              $arrayElemAt: ["$revision", 0],
            },
            revision_cal_stat: {
              $arrayElemAt: ["$revision_cal_stat", 0],
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
            "revision.emp_db_id": 1,
            "revision.salary_temp_id": 1,
            "revision.policy_pack_id": 1,
            "revision.gross_salary": 1,
            "revision.effect_from": 1,
            "revision.revision_year": 1,
            "revision.revision_month": 1,
            "revision.revision_unique_id": 1,
            "revision_cal_stat":1,
            "revision_run_status":{ $ifNull: [ "$revision_cal_stat.run_revision_status", '' ] },
            logcount: { $size: "$revision_log" },
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
    }
  },
  get_revision_report: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        report_type:'required|in:monthly,consolidated',
        wage_month:'requiredIf:report_type,monthly',
        wage_year:'requiredIf:report_type,monthly',
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

        var report_type = req.body.report_type;
        if(report_type == "monthly")
        {
          var wage_month = req.body.wage_month;
          var wage_year = req.body.wage_year;
          var lockup_val={
            $lookup: {
              from: "employee_monthly_reports",
              let:{"emp_id":"$emp_id"},
              pipeline:
              [
                {
                  $match:{
                    $and:[
                      {"$expr": { "$eq": ["$emp_id", "$$emp_id"] }},
                      {"wage_month": parseInt(wage_month)},
                      {"wage_year": parseInt(wage_year)},
                    ]
                  },
                  
                }
              ],
              as: "employee_monthly_reports",
            },
          };
          var match_element={ $match: { "employee_monthly_reports.arrear_report": { $exists: true, $ne: [] } } };
          var get_single_elem= {
            $addFields: {
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
              },
            }
          };
          var select_val={ $ifNull: [ "$employee_monthly_reports.arrear_report", 'aasd' ] };
        }
        else
        {
          var lockup_val={
            $lookup: {
              from: "revision_reports",
              localField: "revision.revision_unique_id",
              foreignField: "revision_unique_id",
              as: "revision_report",
            },
          }
          var match_element={ $match: { revision_report: { $exists: true, $ne: [] } } };
          var get_single_elem= {
            $addFields: {
              revision_report: {
                $arrayElemAt: ["$revision_report", 0],
              },
            }
          };
          var select_val={ $ifNull: [ "$revision_report.consolidated_arrear_report", null ] };
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
              localField: "_id",
              foreignField: "emp_db_id",
              as: "revision",
            },
          },
          { $match: { revision: { $exists: true, $ne: [] } } },
          lockup_val,
          match_element,
          search_option_details,
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              revision: {
                $arrayElemAt: ["$revision", 0],
              },
            },
          },
          get_single_elem,
          {
            $project: {
              _id: 1,
              corporate_id: 1,
              userid: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              emp_dob: 1,
              "mobile_no":{ $ifNull: [ "$mobile_no", 'NA' ] },
              "age": {
                $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
                  (365 * 24*60*60*1000)]
                },
              pan_no: 1,
              aadhar_no: 1,
              email_id: 1,
              empid: 1,
              "sex":1,
              client_code: 1,
              approval_status: 1,
              "employee_details.employment_hr_details": 1,
              "revision.emp_db_id": 1,
              "revision.salary_temp_id": 1,
              "revision.policy_pack_id": 1,
              "revision.gross_salary": 1,
              "revision.effect_from": 1,
              "revision.revision_year": 1,
              "revision.revision_month": 1,
              "revision.revision_unique_id": 1,
              "revision_report":select_val,
            },
          },
        ]).then(async (emp_report_data)=>{
          return resp
          .status(200)
          .json({
            status: "success",
            data: emp_report_data,
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
  create_revision_schedule_job:async function(req,resp){
    try { 
      var search_option= {$match: {
          $and:[ 
            {'corporate_id':req.authData.corporate_id},
            {'parent_hods':{$in: [req.authData.user_id] }},
            {'approval_status':'approved'},
          ]
        }};
      var search_option_details= {$match: {}};
      if(req.body.searchkey)
      {
        search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
      }
      else
      {
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
        search_option_details.$match['revision.0']=  { "$exists": true };  
      var myAggregate = Employee.aggregate([
          search_option,
          {
            $lookup:{
            from: 'employee_details',
            localField: '_id',
            foreignField: 'employee_id',
            as: 'employee_details',
            }
          }, 
          {
            $lookup: {
              from: "revisions",
              localField: "_id",
              foreignField: "emp_db_id",
              as: "revision",
            },
          },                      
          search_option_details,
          { 
            "$addFields": {
              "employee_details": {
                "$arrayElemAt": [ "$employee_details", 0 ]
              },
              "revision": {
                "$arrayElemAt": [ "$revision", 0 ]
              },
            }
          },
          { 
            "$project": { 
              "_id":0,
            "emp_db_id":"$_id" ,
            "emp_id":"$revision.emp_id",
            "corporate_id":"$revision.corporate_id",
            "effect_from_month":"$revision.effect_from_month",
            "effect_from_year":"$revision.effect_from_year",
            "effect_from":"$revision.effect_from",
            "gross_salary":"$revision.gross_salary",
            "revision_id":"$revision._id",
            "revision_month":"$revision.revision_month",
            "revision_year":"$revision.revision_year",
            "revision_unique_id":"$revision.revision_unique_id",
            "status":'active',
            "schedule_job_type":'revision',
            //"created_at": Date.now(),
            }
          },
        ]).then(async (emps) => {
          await Promise.all(emps.map(async (empdata) => {
            empdata.run_revision_status='calculated';
            await RevisionReport.findOneAndUpdate({'emp_id':empdata.emp_id,'revision_unique_id':empdata.revision_unique_id},empdata,{upsert: true, new: true, setDefaultsOnInsert: true});
            await RevisionLog.findOneAndUpdate({'revision_log_unique_id':empdata.revision_unique_id},{'run_revision_status':'calculated'},{upsert: true, new: true, setDefaultsOnInsert: true});
            await ScheduleJob.findOneAndUpdate({'emp_id':empdata.emp_id,'schedule_job_type':'revision'},empdata,{upsert: true, new: true, setDefaultsOnInsert: true});
          })).then(val =>{
            return resp.status(200).json({ status: "success", message: "Revision has been schedule Successfully." });
          })
      });
    }catch (e) {
      return resp
          .status(200)
          .json({
            status: "error",
            message: e ? e.message : "Something went wrong",
          });
    }
  },
  generate_rivision_data:async function(req, resp){
    // console.log('generate revision data function called')
    var search_option= {$match: {
      $and:[ 
        {'schedule_job_type':'revision'}
      ]
    }};
    var schedule_job_agg = ScheduleJob.aggregate([
      search_option,
      {"$limit": 100 },
      {
        $lookup: {
          from: "revisions",
          localField: "emp_id",
          foreignField: "emp_id",
          as: "revision",
        },
      },
      {$lookup:{
        from: 'employee_details',
        let:{'emp_db_id':'$emp_db_id'},
        "pipeline": [
          { "$match": { $and :[
            {"$expr": { "$eq": ["$employee_id", '$$emp_db_id'] }},
          ] } }
        ],
        as: 'employee_details',
      }},
      { 
        "$addFields": {
          "revision": {
            "$arrayElemAt": [ "$revision", 0 ]
          },
          "employee_details": {
            "$arrayElemAt": [ "$employee_details", 0 ]
          },
        }
      },
      { 
        "$project": { 
          "_id":1,
        'employee_details':
          {
            'emp_address':'$employee_details.emp_address',
            'employment_hr_details':'$employee_details.employment_hr_details'
          },
        "emp_id":"$revision.emp_id",
        "corporate_id":"$revision.corporate_id",
        "effect_from_month":"$revision.effect_from_month",
        "effect_from_year":"$revision.effect_from_year",
        "effect_from":"$revision.effect_from",
        "gross_salary":"$revision.gross_salary",
        "revision_id":"$revision._id",
        "revision_month":"$revision.revision_month",
        "revision_year":"$revision.revision_year",
        "template_data":'$revision.template_data',
        "revision_unique_id":1
        }
      }
    ]).then(async (schedule_job)=>{
      if(schedule_job.length > 0)
      {
        var currdate=new Date();
        var epfo_temp=await Site_helper.get_gov_epfo_data({authData:schedule_job[0].corporate_id});
        var esic_temp=await Site_helper.get_gov_esic_data({authData:schedule_job[0].corporate_id});
        await Promise.all(schedule_job.map( async function(revision_data) {
          
          await EmployeeMonthlyReport.find({
              $and: [
                { $expr: { $eq: ["$emp_id", revision_data.emp_id] } },
                {$or:[ 
                  {"$expr": {$gt: ['$wage_year', revision_data.effect_from_year ]}}, 
                  { $and:[
                    {"$expr": {$gte : ['$wage_year', revision_data.effect_from_year ]}},
                    {"$expr": {$gte: ['$wage_month' ,revision_data.effect_from_month ]}}
                  ]} 
                ]},
                { $or:[ 
                  {"$expr":{$lt:['$wage_year',revision_data.revision_year] }}, 
                  { $and:[
                    {"$expr": {$lte: ['$wage_year', revision_data.revision_year ]}},
                    {"$expr": {$lte: ['$wage_month', revision_data.revision_month ]}}
                  ]} 
                ]}
              ],
            },'salary_report emp_data attendance_summaries', async function(err, month_reports)
            //.then(async (month_reports) => {
            {
              
                var consolidated_report=''
                var month_report_emp_data = '';
                await Promise.all(month_reports.map( async function(month_report) {
                  //console.log('month_reports',month_reports)
                  if(month_report.emp_data)
                  {
                    var wage_month=month_report?.emp_data?.attendance_summaries?.attendance_month;
                    var wage_year=month_report?.emp_data?.attendance_summaries?.attendance_year;
                    var paydays=parseFloat(month_report?.emp_data?.attendance_summaries?.paydays || 0);
                    if( wage_month && wage_year){
                      var monthdays = daysInMonth(wage_month,wage_year) || 0;
                    }
                    
                    
                    var salary_temp_data=revision_data.template_data.salary_temp_data;
  
                    var gross_salary = parseFloat(revision_data.gross_salary);
                    var emp_data = revision_data.employee_details;
                    var emp_state = emp_data.emp_address.state;
                    var calculate_advance = '';
                    var emp_id = revision_data.emp_id;
                    var corporate_id = revision_data.corporate_id;
                    var req={
                      body:{
                        attendance_month:wage_month,
                        attendance_year:wage_year
                      },
                      authData:corporate_id
                    }
                    var pre_salary_data=month_report.salary_report;
                    var curr_salary_breakup= await Site_helper.get_salary_breakup(req,salary_temp_data,gross_salary,emp_data,paydays,monthdays,calculate_advance,emp_id,corporate_id,advance_amount);
                    if(pre_salary_data){
                      var advance_amount =  (pre_salary_data?.advance_recovered ? pre_salary_data?.advance_recovered : 0);
                      var arrear_data = await Site_helper.get_arrear_data(pre_salary_data,curr_salary_breakup);
                      arrear_data.esic_data =await Site_helper.calculate_esic(esic_temp, arrear_data.total_esic_wages,gross_salary);
                      arrear_data.pf_data = await Site_helper.calculate_pf( epfo_temp, arrear_data.total_pf_wages, salary_temp_data, emp_data.employment_hr_details);
                      arrear_data.pt_amount = await Site_helper.calculate_pt(req,currdate,emp_state,arrear_data.total_pt_wages?arrear_data.total_pt_wages:0);                
                      arrear_data.total_lop = arrear_data.total_lop? (arrear_data.total_lop + month_report.attendance_summaries.total_lop):0;    
                      arrear_data.pf_challan_referance_id = ''
                      arrear_data.esic_challan_referance_id = ''            
                    }
                  
                   var insert_data={
                     arrear_report:arrear_data,
                    }
                    var where_condition={'emp_id':revision_data.emp_id,wage_month:parseInt(wage_month),wage_year:parseInt(revision_data.revision_year),corporate_id:corporate_id};
                    // const res = await EmployeeMonthlyReport.findOneAndUpdate(where_condition,{ $set: insert_data },{upsert: true, new: true, useFindAndModify:false});
                    // res
                    month_report.arrear_report = arrear_data;
                    await month_report.save()
                    // const ret = await EmployeeMonthlyReport.findOneAndUpdate(where_condition,{ $set: insert_data },{upsert: true, useFindAndModify:false});
                    consolidated_report = await Site_helper.calculate_consolidated_arrear(consolidated_report,arrear_data);
                    month_report_emp_data = month_report.emp_data;
                  }
                })).then(async ()=>{
                  var where_condition={'emp_id':revision_data.emp_id,corporate_id:revision_data.corporate_id,revision_unique_id:revision_data.revision_unique_id};
                  arrear_insert_data={
                    emp_data:month_report_emp_data,
                    consolidated_arrear_report : consolidated_report,
                  };
                  await RevisionReport.findOneAndUpdate(where_condition,arrear_insert_data,{upsert: true, new: true});
                })
            })
          await  ScheduleJob.findByIdAndRemove({'_id':revision_data._id});
        })).then(async (asd) => {
          return true;
          //return resp.status(200).json({ status: "error", schedule_job:schedule_job });
        })
      }
      else
      {
        return true;
        return resp.status(200).json({ status: "success", message:'Nothing to generate' });
      }
      
    })
   
  },
  get_calculated_revision_list: async function (req, resp, next) {
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
          var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
          search_option_details=query_data.search_option_details;
          search_option=query_data.search_option;
      }
      //search_option_details.$match['revision_log_stat.run_revision_status']= { $eq: 'calculated'  };
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
            as: "revision",
          },
        },
        { $match: { revision: { $exists: true, $ne: [] } } },
        {
          $lookup: {
            from: "revision_reports",
            localField: "revision.revision_unique_id",
            foreignField: "revision_unique_id",
            as: "revision_report_stat",
          },
        },
        {
          $lookup: {
            from: "bank_instructions",
            localField: "revision_report_stat.bank_ins_referance_id",
            foreignField: "file_id",
            as: "bank_instructions",
          },
        },
        { $match: { revision_report_stat: { $exists: true, $ne: [] } } },
        search_option_details,
        
        
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            revision: {
              $arrayElemAt: ["$revision", 0],
            },
            revision_report_stat: {
              $arrayElemAt: ["$revision_report_stat", 0],
            },
            bank_instructions: {
              $arrayElemAt: ["$bank_instructions", 0],
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
            emp_uan_no:{ $ifNull: ["$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", '' ] },
            "employee_details.employment_hr_details": 1,
            "employee_details.bank_details": 1,
            "revision.emp_db_id": 1,
            "revision.salary_temp_id": 1,
            "revision.policy_pack_id": 1,
            "revision.gross_salary": 1,
            "revision.effect_from": 1,
            "revision.revision_year": 1,
            "revision.revision_month": 1,
            "revision.revision_unique_id": 1,
            "bank_ins_referance_id":{ $ifNull: ["$revision_report_stat.bank_ins_referance_id", '' ] },
            "bank_ins_status":{ $ifNull: [ "$bank_instructions.status", '' ] },
            "revision_run_status":{ $ifNull: [ "$revision_report_stat.run_revision_status", '' ] },
            "revision_report":{
              gross_earning : "$revision_report_stat.consolidated_arrear_report.gross_earning",
              total_pf_wages : "$revision_report_stat.consolidated_arrear_report.total_pf_wages",
              total_esic_wages : "$revision_report_stat.consolidated_arrear_report.total_esic_wages",
              pt_amount : "$revision_report_stat.consolidated_arrear_report.pt_amount",
              }
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
    }
  },
  generate_instruction_report: async function (req, resp) { 
    try {
      const v = new Validator(req.body, {
        bank_temp_id: "required",
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
        var filter_option = { _id: req.body.bank_temp_id };
        var payment_sheet = await PaymentSheet.findOne(filter_option);
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
        //search_option_details.$match['revision_log_stat.run_revision_status']= { $eq: 'calculated'  };
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
              as: "revision",
            },
          },
          { $match: { revision: { $exists: true, $ne: [] } } },
          {
            $lookup: {
              from: "revision_reports",
              localField: "revision.revision_unique_id",
              foreignField: "revision_unique_id",
              as: "revision_report",
            },
          },
          { $match: { revision_report: { $exists: true, $ne: [] }, "revision_report.run_revision_status":'calculated' } },
          search_option_details,
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              revision: {
                $arrayElemAt: ["$revision", 0],
              },
              revision_report: {
                $arrayElemAt: ["$revision_report", 0],
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
              "mobile_no":{ $ifNull: [ "$mobile_no", 'NA' ] },
              "age": {
                $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
                  (365 * 24*60*60*1000)]
                },
              pan_no: 1,
              aadhar_no: 1,
              email_id: 1,
              empid: 1,
              "sex":1,
              client_code: 1,
              approval_status: 1,
              "employee_details.employment_hr_details": 1,
              "revision.emp_db_id": 1,
              "revision.salary_temp_id": 1,
              "revision.policy_pack_id": 1,
              "revision.gross_salary": 1,
              "revision.effect_from": 1,
              "revision.revision_year": 1,
              "revision.revision_month": 1,
              "revision.revision_unique_id": 1,
              "revision_report":1,
            },
          },
        ]).then(async (revision_data)=>{
          
          if (revision_data.length > 0) {
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");
            var file_id = Math.random().toString(36).slice(2);
            var instructionsheet_xlsx =
              "storage/company/temp_files/"+req.authData.corporate_id+"/instruction_report/instruction-report-" +
              file_id +
              ".xlsx";
            ws.cell(1, 1).string("SL. NO.");
            var row_counter = 1;
            var sl_no = 0;
            var bank_field = payment_sheet.column_list;
            //console.log(bank_field)
            await Promise.all(revision_data.map( async function(revision_data_exp) {
            
              var effect_from_month=revision_data_exp.revision_report.effect_from_month;
              var effect_from_year=revision_data_exp.revision_report.effect_from_year;
              var revision_month=revision_data_exp.revision_report.revision_month;
              var revision_year=revision_data_exp.revision_report.revision_year;
              await EmployeeMonthlyReport.aggregate([
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_id", revision_data_exp.emp_id] } },
                      {$or:[ 
                        {'wage_year': {$gt: effect_from_year }}, 
                        { $and:[
                          {'wage_year': {$gte: effect_from_year }},
                          {'wage_month': {$gte: effect_from_month }}
                        ]} 
                      ]},
                      { $or:[ 
                        {'wage_year': {$lt: revision_year }}, 
                        { $and:[
                          {'wage_year': {$lte: revision_year }},
                          {'wage_month': {$lte: revision_month }}
                        ]} 
                      ]}
                    ],
                  },
                },
                {
                  $group: {
                    _id: null,
                    net_take_home: {
                      $sum: "$arrear_report.net_take_home",
                    },
                  },
                },
                { 
                  $project: { 
                  "net_take_home":1,
                }
              }
              ]).then(async (gross_amount_data)=>{
                //console.log(gross_amount_data)
                  row_counter = row_counter + 1;
                  sl_no = sl_no + 1;
                  var column_counter = 1;
                  ws.cell(row_counter, column_counter).number(sl_no);
                  await Promise.all(
                    bank_field.map(async (bank_column_data) => {
                      
                      var gross_earning= gross_amount_data[0]? gross_amount_data[0].net_take_home : 0;
                      column_counter = column_counter + 1;
                      if (bank_column_data.type == "static") {
                        if (bank_column_data.column_lable == "Amount") {
                          var bank_column_value = gross_earning;
                        } else {
                          var bank_column_value = bank_column_data.column_value;
                        }
                      } else {
                        var bank_column_value =
                        revision_data_exp[bank_column_data.column_value];
                      }
                      var bank_column_lable = bank_column_data.column_lable;
                      //column_value=type
                      ws.cell(1, column_counter).string(
                        bank_column_lable.toString()
                      );
                      if (bank_column_data.column_value == "emp_name") {
                        bank_column_value =
                          revision_data_exp.emp_first_name +
                          " " +
                          revision_data_exp.emp_last_name;
                      }
                      if (bank_column_data.column_value == "emp_mob") {
                        bank_column_value = revision_data_exp.mobile_no;
                      }
                      if (bank_column_data.column_value == "email_id") {
                        bank_column_value = revision_data_exp.emp_email_id;
                      }
                      ws.cell(row_counter, column_counter).string(
                        bank_column_value ? bank_column_value.toString() : ""
                      );
                    })
                  );
                  var where_con={
                      revision_unique_id: revision_data_exp.revision_report.revision_unique_id,
                    }
                    var update_value= { 
                      "bank_ins_referance_id": file_id, 
                      "run_revision_status":'generated'
                    };
                    
                  await RevisionReport.updateOne(
                    where_con,
                    update_value                    
                  );
              })
            
            }))
            .then(async (reportdata_com) => {
              //console.log(ws)
              wb.write(instructionsheet_xlsx);
              var pay_type='arrear';
              var curr_date = new Date();
              var wage_month = curr_date.getUTCMonth();
              var wage_year = curr_date.getUTCFullYear();
              var document = {
                corporate_id: req.authData.corporate_id,
                file_id: file_id,
                xlsx_file_name: instructionsheet_xlsx,
                wage_month: wage_month,
                wage_year: wage_year,
                pay_type:pay_type,
                creatror_id:mongoose.Types.ObjectId(req.authData.authId),
                creatror_name:req.authData.first_name,
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
                  return resp
                    .status(200)
                    .send({
                      status: "success",
                      message: "Instruction file generated successfully",
                      bank_instruction_data: bank_instruction_data,
                    });
                }
              );
            })

          } else {
            return resp
              .status(200)
              .json({ status: "success", message: "Nothing to generate.." });
          }
          
          
          
        })
      }
    }
    catch (e) {
      return resp
        .status(200)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  update_emp_revision_temp_data:async function(req,resp){
    // console.log('update employee revision template data function called')

    let curr_date = new Date();
    let wage_month = curr_date.getUTCMonth();
    let wage_year = curr_date.getUTCFullYear();
    //console.log(wage_month,wage_year);
    Revision.find({'revision_month':wage_month,revision_year:wage_year, revision_status:'pending'}, async  function(err,revision_data){
      //console.log(revision_data);
      await Promise.all(revision_data.map(async (revision_data_exp)=>{
        var req_data = {'authData':{'corporate_id':revision_data_exp.corporate_id}};
        let esic_temp_data = await Site_helper.get_gov_esic_data(req_data);
        let documet_data={
          'employment_hr_details.gross_salary':parseFloat(revision_data_exp.gross_salary),
        }
        if(parseFloat(esic_temp_data.wage_ceiling) <  parseFloat(revision_data_exp.gross_salary) )
        {
          if((parseInt(esic_temp_data.contribution_period_a_from) < wage_month &&  wage_month < parseInt(esic_temp_data.contribution_period_a_to)) || (parseInt(esic_temp_data.contribution_period_b_from) < wage_month &&  wage_month < parseInt(esic_temp_data.contribution_period_b_to)))
          {
            documet_data['employment_hr_details.esic_covered'] = 'yes';
          }
          else
          {
            documet_data['employment_hr_details.esic_covered'] = 'no';
          }
        }
        else
        {
          documet_data['employment_hr_details.esic_covered'] = 'yes';
        }
        documet_data['employment_hr_details.salary_temp'] = mongoose.Types.ObjectId(revision_data_exp.salary_temp_id);
        documet_data['employment_hr_details.package_id'] = mongoose.Types.ObjectId(revision_data_exp.policy_pack_id);
        documet_data['template_data'] = revision_data_exp.template_data;

        const entity = await employeeDetails.findOneAndUpdate({employee_id:mongoose.Types.ObjectId(revision_data_exp.emp_db_id)},documet_data);

        await EmployeePackage.updateOne(
          { _id: documet_data["employment_hr_details.package_id"]}, // condition to search by
          { $set: { assigned_status: 'assigned' } } // only update the 'status' field
        );
        
        const salaryTempData = entity.template_data.salary_temp_data;
         if(!entity.salary_breakups || !entity.salary_breakups.length){
            entity.salary_breakups = []
          }

         entity.salary_breakups.push({...await Site_helper.get_salary_breakup(req_data,salaryTempData,revision_data_exp.gross_salary,entity), effective_from:new Date().toISOString()})
         await entity.save();

         revision_data_exp.revision_status = 'applied';
         await revision_data_exp.save()
      }))
    })
  },
  get_employee_revision_list_with_pre_revision: async function (req, resp, next) {
    const v = new Validator(req.body, {
      pageno: "required",
      attendance_type: "required",
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
          var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
          search_option_details=query_data.search_option_details;
          search_option=query_data.search_option;
      }
      search_option_details.$match[
        "employee_details.template_data.attendance_temp_data.register_type"
      ] = req.body.attendance_type;
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
            from: "revisions",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision",
          },
        },
        {
          $lookup: {
            from: "revision_logs",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "revision_log",
          },
        },
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            revision: {
              $arrayElemAt: ["$revision", 0],
            },
            pre_revision: {
              $arrayElemAt: ["$revision", 1],
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
            "employee_details.template_data": 1,

            "revision._id": 1,
            "revision.emp_db_id": 1,
            "revision.salary_temp_id": 1,
            "revision.policy_pack_id": 1,
            "revision.gross_salary": 1,
            "revision.effect_from": 1,
            "revision.revision_year": 1,
            "revision.revision_month": 1,
            "revision.revision_date": 1,
            
            "pre_revision._id": 1,
            "pre_revision.emp_db_id": 1,
            "pre_revision.salary_temp_id": 1,
            "pre_revision.policy_pack_id": 1,
            "pre_revision.gross_salary": 1,
            "pre_revision.effect_from": 1,
            "pre_revision.revision_year": 1,
            "pre_revision.revision_month": 1,
            "pre_revision.revision_date": 1,

            logcount: { $size: "$revision_log" },
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
    }
  },
}
function daysInMonth(month, year) {
  return new Date(year, month++, 0).getDate();
}
function getMonthDifference(startDate, endDate) {
  return (
    endDate.getUTCMonth() -
    startDate.getUTCMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
  );
}
