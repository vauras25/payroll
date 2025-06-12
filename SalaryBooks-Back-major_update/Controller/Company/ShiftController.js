var Shift = require("../../Model/Company/Shift");
var Employee = require("../../Model/Company/employee");
var EmployeeDetails = require("../../Model/Company/employee_details");
var Department = require("../../Model/Admin/Department");
var Designation = require("../../Model/Admin/Designation");
var EmployeePackage = require("../../Model/Company/EmployeePackage");
var SalaryTemp = require("../../Model/Admin/SalaryTemp");
var Staff = require("../../Model/Company/Staff");
var Client = require("../../Model/Company/Client");
var CompanyDetails = require("../../Model/Admin/Company_details");
var Company = require("../../Model/Admin/Company");
const EmployeeMonthlyReport=require('../../Model/Company/EmployeeMonthlyReport');
var Site_helper = require("../../Helpers/Site_helper");
var fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
var xl = require("excel4node");
const { Validator } = require("node-input-validator");
const moment = require('moment');
module.exports = {
  get_shift: async function (req, resp, next) {
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
        var filter_option = { corporate_id: req.authData.corporate_id };
        if (req.body.searchkey) {
          filter_option = {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { $or: [
                { shift_name: { $regex: req.body.searchkey, $options:"i"}},
                // { start_time: { $regex: req.body.searchkey, $options:"i"}},
                // { end_time: { $regex: req.body.searchkey, $options:"i"}},
                { status: { $regex: req.body.searchkey, $options:"i"}},
              ]},
            ],
          };
        }
        Shift.paginate(filter_option, options, function (err, shift) {
          if (err) return resp.json({ status: "error", message: err.message });
          return resp.status(200).json({ status: "success", shift: shift });
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
  add_shift: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        shift_name: "required",
        shift1_start_time: "required",
        shift1_end_time: "required",
        shift_allowance: "required",
        overtime: "required",
        company_late_allowed: "required|in:yes,no",
        company_early_arrival: "required|in:yes,no",
        break_shift: "required",
        effective_date: "required",
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
        //console.log(req.body)
        var document = {
          corporate_id: req.authData.corporate_id,
          shift_name: req.body.shift_name,
          shift1_start_time: req.body.shift1_start_time,
          shift1_end_time: req.body.shift1_end_time,
          shift2_start_time: req.body.shift2_start_time,
          shift2_end_time: req.body.shift2_end_time,
          shift_allowance: req.body.shift_allowance,
          overtime: req.body.overtime,
          company_late_allowed: req.body.company_late_allowed,
          company_early_arrival: req.body.company_early_arrival,
          break_shift: req.body.break_shift,
          effective_date: req.body.effective_date,
          status: "active",
          created_at: Date.now(),
        };

        Shift.create(document, function (err, shift) {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Shift created successfully",
              shift: shift,
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
  update_shift: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        shift_id: "required",
        shift_name: "required",
        shift1_start_time: "required",
        shift1_end_time: "required",
        shift_allowance: "required",
        overtime: "required",
        company_late_allowed: "required",
        company_early_arrival: "required",
        break_shift: "required",
        effective_date: "required",
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
        //console.log(req.body)
        var document = {
          shift_name: req.body.shift_name,
          shift1_start_time: req.body.shift1_start_time,
          shift1_end_time: req.body.shift1_end_time,
          shift2_start_time: req.body.shift2_start_time,
          shift2_end_time: req.body.shift2_end_time,
          shift_allowance: req.body.shift_allowance,
          overtime: req.body.overtime,
          company_late_allowed: req.body.company_late_allowed,
          company_early_arrival: req.body.company_early_arrival,
          break_shift: req.body.break_shift,
          effective_date: req.body.effective_date,
          updated_at: Date.now(),
        };
        Shift.updateOne(
          { _id: req.body.shift_id },
          document,
          function (err, shift) {
            if (err)
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            return resp
              .status(200)
              .send({
                status: "success",
                message: "Shift updated successfully",
                shift: shift,
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
  delete_shift: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        shift_id: "required",
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
        Shift.findByIdAndRemove(
          { _id: req.body.shift_id },
          function (err, shift) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              return resp
                .status(200)
                .send({
                  status: "success",
                  message: "Shift deleted successfully",
                  shift: shift,
                });
            }
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
  get_active_shift: async function (req, resp, next) {
    try {
      const options = {
        sort: { effective_date: -1 },
        select: "-history",
      };
      var filter_option = {
        corporate_id: req.authData.corporate_id,
        effective_date: { $lte: new Date() },
      };

      Shift.find(filter_option, function (err, shift) {
        if (err) return resp.json({ status: "error", message: err.message });
        return resp.status(200).json({ status: "success", shift: shift });
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
  get_employee_list: async function (req, resp, next) {
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
          limit: perpage,
          sort: sortoption,
        };
        var filter_option = {};
        //console.log(req.authId, "asdasd");
        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { approval_status: {"$in": ["active","approved"]} },
              { status: {"$in": ["active","approved"]} },
              { parent_hods: { $in: [req.authData.user_id] } },
            ],
          },
        };
        //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
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
          if (req.body.client_code) {
            var client_codes = JSON.parse(req.body.client_code);
            //client_codes = client_codes.map(function(el) { return mongoose.Types.ObjectId(el) })
            search_option.$match.client_code = { $in: client_codes };
            //search_option.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
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
            $project: {
              _id: 1,
              corporate_id: 1,
              userid: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              client_code: 1,
              created_at: 1,
              is_hod: 1,
              status: 1,
              shift: 1,
              shift_rate: 1,
              approval_status: 1,
              "employee_details._id": 1,
              "branch._id": 1,
              "branch.branch_name": 1,
              "department._id": 1,
              "department.department_name": 1,
              "designation._id": 1,
              "designation.designation_name": 1,
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
  update_employee_shift: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        shift_id: "required",
        shift_start_date: "required",
        shift_end_date: "required",
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
        var document = {};
        document["shift.shift_id"] = mongoose.Types.ObjectId(req.body.shift_id);
        document["shift.shift_start_date"] = req.body.shift_start_date;
        document["shift.shift_end_date"] = req.body.shift_end_date;
        const options = {
          sort: sortoption,
        };
        var filter_option = {};
        //console.log(req.authId, "asdasd");
        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { parent_hods: { $in: [req.authData.user_id] } },
            ],
          },
        };
        //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
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
        if(req.body.row_checked_all === "true")
        {
            var ids=JSON.parse(req.body.unchecked_row_ids);
            if(ids.length > 0)
            {
              ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match._id= { $nin: ids }
            }
        }
        else{
            var ids=JSON.parse(req.body.checked_row_ids);
            if(ids.length > 0)
            {
              ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match._id= { $in: ids }
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
            $project: {
              _id: 1,
              corporate_id: 1,
              userid: 1,
              emp_id: 1,
            },
          },
        ]).then(async (emps) => {
          var responseArray = await Promise.all(
            emps.map(function (emp) {
              Employee.updateOne(
                { _id: emp._id },
                { $set: document },
                function (err, emp_det) {
                  return emp_det;
                }
              );
            })
          );
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Employee data has been updated successfully",
            });
        });
        // Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
        //     if (err) return resp.json({ status: "error", message: err.message });

        //     return resp.status(200).json({ status: "success", employees: employees });
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
  shift_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        shift_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp
          .status(403)
          .send({
            status: "val_err",
            message: "Validation error",
            val_msg: v.errors,
          });
      } else {
        const options = {
          page: req.body.pageno,
          limit: perpage,
          sort: { created_at: -1 },
        };
        //var filter_option={"corporate_id":req.authData.corporate_id,"shift.shift_id":req.body.shift_id};
        var search_option = {
          $match: {
            corporate_id: req.authData.corporate_id,
            "shift.shift_id": mongoose.Types.ObjectId(req.body.shift_id),
          },
        };
        if(req.body.generate == 'excel'){
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
            $project: {
              _id: 1,
              corporate_id: 1,
              shift: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
            },
          },
        ]);
        if(req.body.generate == 'excel'){
          var field_list_array=["name","emp_id","shift_start","shift_end"];
          var wb = new xl.Workbook();
          var ws = wb.addWorksheet("Sheet 1");
          var clmn_id = 1;
          ws.cell(1, clmn_id++).string("SL");
          if(field_list_array.includes('name'))
          {
            ws.cell(1, clmn_id++).string("Employee Name");
          }
          if(field_list_array.includes('emp_id'))
          {
            ws.cell(1, clmn_id++).string("Employee Id");
          }
          if(field_list_array.includes('shift_start'))
          {
            ws.cell(1, clmn_id++).string("Shift Start");
          }
          if(field_list_array.includes('shift_end'))
          {
            ws.cell(1, clmn_id++).string("Shift End");
          }
          myAggregate.then(async (employeeies) => {
            await Promise.all(employeeies.map(async function (employee, index) {
              var index_val = 2;
              index_val = index_val + index;
              var clmn_emp_id=1
              ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
              if(field_list_array.includes('name'))
              {
                  ws.cell(index_val,clmn_emp_id++).string(
                      employee.emp_first_name ? String(employee.emp_first_name +" "+ employee.emp_last_name) : ""
                      );
              }
              if(field_list_array.includes('emp_id'))
              {
                  ws.cell(index_val, clmn_emp_id++).string(
                      employee.emp_id ? String(employee.emp_id) : ""
                      );
              }
              if(field_list_array.includes('shift_start'))
              {
                  ws.cell(index_val, clmn_emp_id++).string(
                      employee.shift ? String(moment(employee.shift.shift_start_date).format("MMM DD, YYYY")) : ""
                      );
              }
              if(field_list_array.includes('shift_end'))
              {
                  ws.cell(index_val, clmn_emp_id++).string(
                      employee.shift ? String(moment(employee.shift.shift_end_date).format("MMM DD, YYYY")) : ""
                      );
              }
            })).then(async (value) => {
              // wb.write("employee-shift-details-report.xlsx");
							// let file_location = Site_helper.createFiles(wb,"employee-shift-details-report",'xlsx', req.authData.corporate_id)
              let file_name = "employee-shift-details-report.xlsx";
              let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/shift-module');
              await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
              // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
              // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
              // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
            });
          });
        }
        else{
          Employee.aggregatePaginate(
            myAggregate,
            options,
            function (err, employeelist) {
              if (err)
                return resp.json({ status: "error", message: err.message });
              return resp
                .status(200)
                .json({ status: "success", employeelist: employeelist });
            }
          );
        }
      }
    } catch (e) {
      return resp
        .status(403)
        .json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
    }
  },
  emp_update_shift_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        shift_id: "required",
        emp_id: "required",
        shift_start_date: "required",
        shift_end_date: "required",
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
        var document = {};
        document["shift.shift_id"] = mongoose.Types.ObjectId(req.body.shift_id);
        document["shift.shift_start_date"] = req.body.shift_start_date;
        document["shift.shift_end_date"] = req.body.shift_end_date;
        Employee.updateOne(
          { _id: req.body.emp_id },
          { $set: document },
          function (err, emp_det) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            return resp
              .status(200)
              .send({
                status: "success",
                message: "Employee data has been updated successfully",
                emp_det: emp_det,
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
  update_employee_shift_rate: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        shift_rate: "required",
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
        //var document={"shift_rate":JSON.parse(req.body.shift_rate)};
        var document = {};
        document["shift_rate"] = JSON.parse(req.body.shift_rate);
        //return resp.status(200).send({ status: 'success', message:"Shift Rate has been updated successfully",document:document });
        const options = {
          sort: sortoption,
        };
        var filter_option = {};
        //console.log(req.authId, "asdasd");
        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              { parent_hods: { $in: [req.authData.user_id] } },
            ],
          },
        };
        //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
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
          if (req.body.client_code) {
            var client_codes = JSON.parse(req.body.client_code);
            //client_codes = client_codes.map(function(el) { return mongoose.Types.ObjectId(el) })
            search_option.$match.client_code = { $in: client_codes };
            //search_option.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
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
        }
        if(req.body.row_checked_all === "true")
        {
            var ids=JSON.parse(req.body.unchecked_row_ids);
            if(ids.length > 0)
            {
              ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match._id= { $nin: ids }
            }
        }
        else{
            var ids=JSON.parse(req.body.checked_row_ids);
            if(ids.length > 0)
            {
              ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match._id= { $in: ids }
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
            $project: {
              _id: 1,
              corporate_id: 1,
              userid: 1,
              emp_id: 1,
            },
          },
        ]).then(async (emps) => {
          var responseArray = await Promise.all(
            emps.map(function (emp) {
              //console.log(emp._id,document)

              Employee.updateOne(
                { _id: emp._id },
                { $set: document },
                function (err, emp_det) {
                  return emp_det;
                  //return resp.status(200).send({ status: 'success', message:"Employee data has been updated successfully", emp_det: emp_det });
                }
              );
            })
          );
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Shift Rate has been updated successfully",
            });
        });
        // Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
        //     if (err) return resp.json({ status: "error", message: err.message });

        //     return resp.status(200).json({ status: "success", employees: employees });
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
  emp_update_shift_rate: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        emp_id: "required",
        shift_rate: "required",
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
        var document = { shift_rate: JSON.parse(req.body.shift_rate) };
        Employee.updateOne(
          { _id: req.body.emp_id },
          { $set: document },
          function (err, emp_det) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            return resp
              .status(200)
              .send({
                status: "success",
                message: "Shift Rate has been updated successfully",
                shift_rate: emp_det,
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

  import_employee_data: async function (req, resp, next) {
    try {
      var results = [];
      fs.createReadStream(req.files[0].path)
        .pipe(csv())
        .on("data", async function (row) {
          var parent_hods = [];
          //console.log(row)
          await Staff.findOne(
            { _id: row["emp_hod"] },
            "parent_hods",
            async function (err, parent_hod) {
              if (!err) {
                if (parent_hod) {
                  parent_hods = parent_hod.parent_hods;
                }

                parent_hods.push(row["emp_hod"]);
                //console.log(parent_hod)
                var password = bcrypt.hashSync(row["password"], saltRounds);
                var dateObj = new Date(row["attendance_date"]);
                //console.log(req.authData);
                var new_arr = {
                  corporate_id: req.authData.corporate_id,
                  created_by: req.authData.user_id,
                  userid: row["user_id"],
                  emp_first_name: row["first_name"],
                  emp_last_name: row["last_name"],
                  emp_father_name: row["father_name"],
                  emp_spouse_name: row["spouse_name"],
                  emp_dob: row["dob"],
                  pan_no: row["pan_no"],
                  aadhar_no: row["aadhar_no"],
                  alternate_mob_no: row["alternate_mob_no"],
                  nationality: row["nationality"],
                  email_id: row["email_id"],
                  country: row["country"],
                  aadhar_enrolment: row["aadhar_enrolment"],
                  marriage_date: row["marriage_date"],
                  nominee: row["nominee"],
                  nominee_dob: row["nominee_dob"],
                  relation_with_nominee: row["relation_with_nominee"],
                  physical_disability: row["physical_disability"],
                  passport_no: row["passport_no"],
                  passport_val_form: row["passport_val_form"],
                  passport_val_to: row["passport_val_to"],
                  client_code: row["client_code"],
                  emp_hod: row["emp_hod"],
                  parent_hods: parent_hods,
                  password: password,
                  status: "active",
                  approval_status: "pending",
                  created_at: Date.now(),
                };

                //results.push(new_arr)
                await Employee.create(new_arr, function (err, user_data) {
                  if (err) {
                    return resp
                      .status(200)
                      .send({ status: "error", message: err.message });
                  } else {
                    var emp_document = {
                      employee_id: user_data._id,
                      emp_address: {
                        resident_no: "",
                        residential_name: row["residential_name"],
                        address_proof: row["address_proof"],
                        city: row["city"],
                        district: row["district"],
                        town_village: row["town_village"],
                        state: row["state"],
                        locality: row["locality"],
                        pincode: row["pincode"],
                        diff_current_add: "no",
                      },
                      emp_curr_address: {
                        resident_no: "",
                        residential_name: "",
                        city: "",
                        district: "",
                        town_village: "",
                        state: "",
                        locality: "",
                        pincode: "",
                      },
                      employment_details: {
                        new_pf_no: row["new_pf_no"],
                        uan_no: row["uan_no"],
                        esic_no: row["esic_no"],
                        esic_dispensary: row["esic_dispensary"],
                        pf_no_per_dep_file: row["pf_no_per_dep_file"],
                        pf_membership_date: row["pf_membership_date"],
                        esic_membership_date: row["esic_membership_date"],
                      },
                      bank_details: {
                        name_on_passbook: row["name_on_passbook"],
                        bank_name: row["bank_name"],
                        branch_name: row["branch_name"],
                        branch_address: row["branch_address"],
                        account_no: row["account_no"],
                        account_type: row["account_type"],
                        ifsc_code: row["ifsc_code"],
                        city: row["city"],
                        state: row["state"],
                      },
                      employment_hr_details: {
                        package_id: row["package_id"],
                        date_of_join: row["date_of_join"],
                        branch: mongoose.Types.ObjectId(row["branch"]),
                        designation: mongoose.Types.ObjectId(
                          row["designation"]
                        ),
                        gross_salary: row["gross_salary"],
                        department: mongoose.Types.ObjectId(row["department"]),
                        wage_type: row["wage_type"],
                        annual_benefit: row["annual_benefit"],
                        pf_applicable: row["pf_applicable"],
                      },
                    };
                    EmployeeDetails.create(
                      emp_document,
                      function (emp_err, employeedet) {
                        if (emp_err)
                          return resp
                            .status(200)
                            .send({
                              status: "error",
                              message: emp_err.message,
                              user_data: user_data,
                            });
                        //return resp.status(200).send({ status: 'success',message:"Company created successfully", user_data: user_data });
                      }
                    );
                  }
                });
                //console.log(results)
              }
            }
          );
        })
        .on("end", async function () {
          //console.log(results);
          var failed_entry = [];
          //  var return_report_data = await Promise.all(results.map(async (new_arr,keyval) => {
          //   await Employee.create(new_arr,  function (err, user_data) {
          //     if (err)
          //     {
          //         return resp.status(200).send({ status: 'error', message: err.message });
          //     }
          //     else
          //     {
          //         var emp_document={
          //           employee_id:user_data._id,
          //           emp_address:{
          //             resident_no    : '',
          //             residential_name    : '',
          //             address_proof    : 'aadhaar',
          //             city    : '',
          //             district    : '',
          //             town_village    : '',
          //             state    : '',
          //             locality    : '',
          //             pincode    : '',
          //             diff_current_add:'no',
          //           },
          //           emp_curr_address:{
          //             resident_no    : '',
          //             residential_name    : '',
          //             city    : '',
          //             district    : '',
          //             town_village    : '',
          //             state    : '',
          //             locality    : '',
          //             pincode    : '',
          //           }
          //         };
          //         EmployeeDetails.create(emp_document,  function (emp_err, employeedet) {
          //           if (emp_err) return resp.status(200).send({ status: 'error', message: emp_err.message,user_data:user_data });
          //             //return resp.status(200).send({ status: 'success',message:"Company created successfully", user_data: user_data });
          //         })
          //       }
          //   })
          //     // await Employee.findOne({'emp_id':new_arr.emp_id}, async function (err, employee_data) {
          //     //     if (!err)
          //     //     {
          //     //         if(employee_data)
          //     //         {
          //     //             await EmployeeAttendance.findOneAndUpdate({'emp_id':new_arr.emp_id,'attendance_date':new_arr.attendance_date},new_arr,{upsert: true, new: true, setDefaultsOnInsert: true})
          //     //         }
          //     //         else{
          //     //             failed_entry.push(new_arr.emp_id);
          //     //         }
          //     //     }
          //     // })
          // }));
          return resp
            .status(200)
            .send({
              status: "success",
              message: "Import successfully",
              failed_entry: failed_entry,
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
  generate_shift_allowance: async function (req, resp, next) {  
    const v = new Validator(req.body, {
        attendance_month: 'required',
        attendance_year: 'required',
    });
    const matched = await v.check();
    if (!matched) {
        return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    }
    else{
        var attendence_month=req.body.attendance_month;
        var attendence_year=req.body.attendance_year;      
        const options = {};
        var filter_option={};
        var document={};
        var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
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
        if(req.body.row_checked_all === "true")
        {
            var ids=JSON.parse(req.body.unchecked_row_ids);
            if(ids.length > 0)
            {
            ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match._id= { $nin: ids }
            }
        }
        else{
            var ids=JSON.parse(req.body.checked_row_ids);
            if(ids.length > 0)
            {
            ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match._id= { $in: ids }
            }
        }
        //search_option_details.$match['employee_monthly_reports.salary_report']= { $exists: true};
        search_option_details.$match['attendance_summaries.attendance_month']= attendence_month.toString();
        search_option_details.$match['attendance_summaries.attendance_year']=  attendence_year.toString();
        search_option_details.$match['attendance_summaries.shift_allowance']=  {$exists: true  };
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
            {$lookup:{
            from: 'employee_details',
            localField: '_id',
            foreignField: 'employee_id',
            as: 'employee_details',
            }},
            {$lookup:{
                from: 'attendance_summaries',
                "let": { "emp_db_idVar": "$emp_id"},
                "pipeline": [
                  { "$match": { $and :[
                    {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                    {"attendance_month": attendence_month.toString()},
                    {"attendance_year": attendence_year.toString()},
                  ] } }
                ],
                as: 'attendance_summaries'
              }},
            { "$lookup": {
              "from": "employee_monthly_reports",
              "let": { "emp_db_idVar": "$_id"},
              "pipeline": [
                { "$match": { $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                  {"wage_month": parseInt(attendence_month)},
                  {"wage_year": parseInt(attendence_year)},
                ] } }
              ],
              "as": "employee_monthly_reports"
            }},
            search_option_details,
            
            { "$addFields": {
            "employee_details": {
                "$arrayElemAt": [ "$employee_details", 0 ]
            },
            "employee_monthly_reports": {
                "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
            },           
            }
            },                
            { "$project": { 
            "_id":1,
            "corporate_id":1,
            "userid":1,
            "emp_id":1,
            "emp_first_name":1,
            "emp_last_name":1,
            "emp_dob":1,
            "pan_no":1,
            "aadhar_no":1,
            "email_id":1,
            "empid":1,
            "client_code":1,
            "approval_status":1,
            "employee_details.employment_hr_details":1,
            "employee_details.emp_address":1,
            "employee_details.template_data.salary_temp_data":1,
            "incentive_modules":1,
            "shift_rate":1,
            "age": {
                $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
                (365 * 24*60*60*1000)]
                },
            "hod.first_name":1,
            "hod.last_name":1,
            "hod.userid":1,
            "hod._id":1,
            "hold_salary_emps":1,
            "employee_monthly_reports":1,
            attendance_summaries: {
                $filter: {
                  input: "$attendance_summaries",
                  as: "attendance_summaries",
                  cond: {
                    $and: [
                      {$eq: ["$$attendance_summaries.attendance_month", attendence_month.toString()]},
                      {$eq: ["$$attendance_summaries.attendance_year", attendence_year.toString()]}
                    ]
                  }
                }
            },
            "employee_details.template_data.ptax_temp_data":1,
            }
            },            
        ]).then(async (emps) => {
          //return resp.status(200).json({status: "success",message: emps,});
            var currdate = new Date();
            var epfo_temp=await Site_helper.get_gov_epfo_data(req);
            var esic_temp=await Site_helper.get_gov_esic_data(req);
            var wage_month=req.body.attendance_month;
            var wage_year=req.body.attendance_year;
            //console.log(emps)
            await Promise.all(emps.map(async (empdata) => {
              
                //console.log(empdata)
                if(empdata.employee_details)  
                {                  
                    if(empdata.employee_details.template_data)
                    {                                                   
                      var attendance_summaries = empdata.attendance_summaries[0].shift_allowance;
                      if(attendance_summaries)
                      {
                        var pre_total_pt = 0;
                        var pre_module_pt = 0;
                        var emp_state = empdata.employee_details.emp_address.state;
                        var gross_salary =parseFloat(empdata.employee_details.employment_hr_details.gross_salary);  
                        var shift_rate = empdata.shift_rate;
                        var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;
                        // var shift_allowance = await Site_helper.calculate_shift_allowance(attendance_summaries,shift_rate);
                        //console.log('shift_allowance',shift_allowance)
                        if(shift_rate){
                          var shift_allowance = await Site_helper.calculate_shift_allowance(attendance_summaries,shift_rate);
                        }else{
                          var shift_allowance = 0
                        }
                        var pre_salary_data=empdata.employee_monthly_reports;
                        var pre_monthly_wage_amount=0;
                        var ptax_temp = empdata?.employee_details?.template_data?.ptax_temp_data;
                        if(pre_salary_data)
                        {
                          if(pre_salary_data.shift_allawance_report)
                          {
                            pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.shift_allawance_report.total_pf_wages);                     
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
                          var module_wage_amount=(shift_allowance < parseFloat(avaiable_wage_amount) ? shift_allowance  : parseFloat(avaiable_wage_amount) );
                          
                        }
                        else
                        {
                          var module_wage_amount= shift_allowance;
                        }
                        var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? shift_allowance : 0 );
                        var shift_allawance_earning_data={
                          total_pf_bucket:shift_allowance,
                          total_pf_wages:module_wage_amount,
                          total_esic_bucket:shift_allowance,
                          total_esic_wages:restrict_esic_wages,
                          total_pt_wages:shift_allowance,
                          overtime_wages:shift_allowance,
                          gross_earning:shift_allowance,
                          bank_ins_referance_id:'',
                          pf_challan_referance_id:'',
                          esic_challan_referance_id:'',
                          pf_generate: 'no',
                          esic_generate: 'no',
                        };
                        if(pre_salary_data)
                        {
                          pre_total_pt = (pre_salary_data.total_data.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);
                          if(pre_salary_data.shift_allawance_report)
                          {
                            pre_module_pt = (pre_salary_data.shift_allawance_report.pt_amount?pre_salary_data.shift_allawance_report.pt_amount:0);
                            var total_earning_data={ 
                              'total_earning': (shift_allawance_earning_data.gross_earning + (  pre_salary_data.total_data.total_earning - pre_salary_data.shift_allawance_report.gross_earning)),
                              'total_pf_bucket':(shift_allawance_earning_data.total_pf_bucket + (pre_salary_data.total_data.total_pf_bucket -  pre_salary_data.shift_allawance_report.total_pf_bucket)),
                              'total_pf_wages':(shift_allawance_earning_data.total_pf_wages + ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.shift_allawance_report.total_pf_wages)),
                              'total_esic_bucket':(shift_allawance_earning_data.total_esic_bucket + (pre_salary_data.total_data.total_esic_bucket - pre_salary_data.shift_allawance_report.total_esic_bucket)),
                              'total_esic_wages':(shift_allawance_earning_data.total_esic_wages +  (pre_salary_data.total_data.total_esic_wages - pre_salary_data.shift_allawance_report.total_esic_wages)),
                              'total_pt_wages':(shift_allawance_earning_data.total_pt_wages + (pre_salary_data.total_data.total_pt_wages - pre_salary_data.shift_allawance_report.total_pt_wages)),
                              'bank_ins_referance_id':pre_salary_data.total_data.bank_ins_referance_id == '' ? '' :  pre_salary_data.total_data.bank_ins_referance_id,
                              'pf_challan_referance_id':pre_salary_data.total_data.pf_challan_referance_id == '' ? '' :  pre_salary_data.total_data.pf_challan_referance_id,
                              'esic_challan_referance_id':pre_salary_data.total_data.esic_challan_referance_id == '' ? '' :  pre_salary_data.total_data.esic_challan_referance_id,
                            };
                          }
                          else
                          {
                            var total_earning_data={ 
                              'total_earning':  (shift_allawance_earning_data.gross_earning +   pre_salary_data.total_data.total_earning),
                              'total_pf_bucket':(shift_allawance_earning_data.total_pf_bucket + pre_salary_data.total_data.total_pf_bucket),
                              'total_pf_wages': (shift_allawance_earning_data.total_pf_wages +  pre_salary_data.total_data.total_pf_wages),
                              'total_esic_bucket': (shift_allawance_earning_data.total_esic_bucket + pre_salary_data.total_data.total_esic_bucket),
                              'total_esic_wages': (shift_allawance_earning_data.total_esic_wages +  pre_salary_data.total_data.total_esic_wages),
                              'total_pt_wages': (shift_allawance_earning_data.total_pt_wages + pre_salary_data.total_data.total_pt_wages),
                              'bank_ins_referance_id': '' ,
                              'pf_challan_referance_id': '' ,
                              'esic_challan_referance_id': '' ,
                            };
                          } 
                        }
                        else
                        {
                          var total_earning_data={ 
                            'total_earning':  shift_allawance_earning_data.gross_earning,
                            'total_pf_bucket':shift_allawance_earning_data.total_pf_bucket,
                            'total_pf_wages': shift_allawance_earning_data.total_pf_wages,
                            'total_esic_bucket': shift_allawance_earning_data.total_esic_bucket,
                            'total_esic_wages': shift_allawance_earning_data.total_esic_wages,
                            'total_pt_wages': shift_allawance_earning_data.total_pt_wages,
                            'bank_ins_referance_id': '' ,
                            'pf_challan_referance_id': '' ,
                            'esic_challan_referance_id': '' ,
                          };
                        }
                        shift_allawance_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, shift_allawance_earning_data.total_esic_wages,gross_salary);
                        shift_allawance_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, shift_allawance_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);
                        
                        total_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages,gross_salary, true);
                        total_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details, true);                
                                
                      
                        var p_tax_amount = await Site_helper.calculate_pt(req,currdate,emp_state,total_earning_data.total_pt_wages?total_earning_data.total_pt_wages:0, ptax_temp);                
                        var module_pt_amount= (p_tax_amount - (pre_total_pt - pre_module_pt));
                        shift_allawance_earning_data.pt_amount= module_pt_amount;
                        total_earning_data.total_pt_amount= p_tax_amount;
                        // console.log(p_tax_amount, "shift ptax amount");
                        // console.log(total_earning_data.total_pt_amount, " shift pt amount");
                        
                        var insert_data={
                          corporate_id:empdata.corporate_id,
                          emp_db_id:mongoose.Types.ObjectId(empdata._id),
                          emp_id: empdata.emp_id,
                          wage_month:attendence_month,
                          wage_year:attendence_year,
                          shift_allawance_report:shift_allawance_earning_data,
                          total_data:total_earning_data,
                          status:'active',
                        }
                        var where_condition={'emp_id':empdata.emp_id,wage_month:wage_month,wage_year:wage_year,corporate_id:empdata.corporate_id};
                        await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});    
                      
                      }
                      



                    /*
                      var pre_earning_data=empdata.employee_monthly_reports;
                        console.log(shift_allowance);
                        //console.log(overtime_temp_data.overtime_rate,overtime_temp_data.overtime_type, attendance_summaries[0].total_overtime,overtime_return_val);
                        
                        var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? shift_allowance : 0 );
                        var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;

                        if(salary_temp_data.restricted_pf === "yes")
                        {
                            var pre_monthly_wage_amount=(pre_earning_data?pre_earning_data.total_data.total_pf_wages:0);
                            var template_wage_ceiling = parseFloat(epfo_temp.wage_ceiling);
                            var avaiable_wage_amount= (template_wage_ceiling-pre_monthly_wage_amount);
                            var module_wage_amount=(shift_allowance < parseFloat(avaiable_wage_amount) ? shift_allowance  : parseFloat(avaiable_wage_amount) );
                        }
                        else
                        {    
                            var module_wage_amount=shift_allowance;
                        }
                        var shift_allawance_earning_data={
                            total_pf_bucket:shift_allowance,
                            total_pf_wages:module_wage_amount,
                            total_esic_bucket:shift_allowance,
                            total_esic_wages:restrict_esic_wages,
                            total_pt_wages:shift_allowance,
                            overtime_wages:shift_allowance,
                            gross_earning:shift_allowance,
                            bank_ins_referance_id:'',
                            pf_challan_referance_id:'',
                            esic_challan_referance_id:'',
                        };
                        //console.log(shift_allawance_earning_data);
                        if(pre_earning_data)
                        {
                            pre_total_pt = pre_earning_data.total_data.total_pt_amount;
                            pre_monthly_pt_wage_amount =pre_earning_data.total_data.total_pt_wages;
                            if(pre_earning_data.shift_allawance_report)
                            {
                              pre_module_pt = pre_earning_data.shift_allawance_report.pt_amount;
                              var total_earning_data={ 
                                  'total_data.total_earning': (pre_earning_data.shift_allawance_report ? (  shift_allawance_earning_data.gross_earning - pre_earning_data.shift_allawance_report.gross_earning) : shift_allawance_earning_data.gross_earning),
                                  'total_data.total_pf_bucket':(pre_earning_data.shift_allawance_report ? (shift_allawance_earning_data.total_pf_wages -  pre_earning_data.shift_allawance_report.total_pf_bucket) : shift_allawance_earning_data.total_pf_wages),
                                  'total_data.total_pf_wages':(pre_earning_data.shift_allawance_report ? ( module_wage_amount -  pre_earning_data.shift_allawance_report.total_pf_wages) : module_wage_amount),
                                  'total_data.total_esic_bucket':(pre_earning_data.shift_allawance_report ? ( shift_allawance_earning_data.total_esic_bucket - pre_earning_data.shift_allawance_report.total_esic_bucket) : shift_allawance_earning_data.total_esic_bucket),
                                  'total_data.total_esic_wages':(pre_earning_data.shift_allawance_report ? (shift_allawance_earning_data.total_esic_wages - pre_earning_data.shift_allawance_report.total_esic_wages) : shift_allawance_earning_data.total_esic_wages),
                                  'total_data.total_pt_wages':(pre_earning_data.shift_allawance_report ? (shift_allawance_earning_data.total_pt_wages - pre_earning_data.shift_allawance_report.total_pt_wages)  : shift_allawance_earning_data.total_pt_wages),
                              };
                            }
                            else
                            {
                              //console.log('c');
                            var total_earning_data={ 
                                'total_data.total_earning':  shift_allawance_earning_data.gross_earning,
                                'total_data.total_pf_bucket':shift_allawance_earning_data.total_pf_wages,
                                'total_data.total_pf_wages': module_wage_amount,
                                'total_data.total_esic_bucket': shift_allawance_earning_data.total_esic_bucket,
                                'total_data.total_esic_wages': shift_allawance_earning_data.total_esic_wages,
                                'total_data.total_pt_wages': shift_allawance_earning_data.total_pt_wages,
                            };
                            } 
                        }
                        else
                        {
                          //console.log('d');
                            var total_earning_data={ 
                            'total_data.total_earning':  shift_allawance_earning_data.gross_earning,
                            'total_data.total_pf_bucket':shift_allawance_earning_data.total_pf_wages,
                            'total_data.total_pf_wages': module_wage_amount,
                            'total_data.total_esic_bucket': shift_allawance_earning_data.total_esic_bucket,
                            'total_data.total_esic_wages': shift_allawance_earning_data.total_esic_wages,
                            'total_data.total_pt_wages': shift_allawance_earning_data.total_pt_wages,
                            };
                        } 
                        shift_allawance_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, shift_allawance_earning_data.total_esic_wages,gross_salary);
                        shift_allawance_earning_data.pf_data = await Site_helper.calculate_pf(await epfo_temp, shift_allawance_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);
                        var p_tax_amount = await Site_helper.calculate_pt(req, currdate, emp_state,shift_allawance_earning_data.total_pt_wages ? shift_allawance_earning_data.total_pt_wages : 0);
                        
                        var module_pt_amount = p_tax_amount - (pre_total_pt - pre_module_pt);
                        shift_allawance_earning_data.pt_amount = module_pt_amount;
                        total_earning_data['total_data.total_pt_amount'] = (p_tax_amount - pre_total_pt);

                        var pre_monthly_pf_wage_amount = pre_earning_data ? pre_earning_data.total_data.total_pf_wages : 0;
                        var pre_monthly_esic_wage_amount = pre_earning_data ? pre_earning_data.total_data.total_esic_wages : 0;

                        var total_esic_wages = pre_monthly_esic_wage_amount + total_earning_data["total_data.total_esic_wages"];
                        var total_pf_wages = pre_monthly_pf_wage_amount +  total_earning_data["total_data.total_pf_wages"];

                        var total_earning_data_esic_data = await Site_helper.calculate_esic(esic_temp,total_esic_wages,gross_salary);
                        var total_earning_data_pf_data = await Site_helper.calculate_pf(await epfo_temp,total_pf_wages,salary_temp_data,empdata.employee_details.employment_hr_details );                             
                        
                        //console.log(total_earning_data.total_pf_wages);
                        var where_condition={'emp_id':empdata.emp_id,wage_month:wage_month,wage_year:wage_year,corporate_id:empdata.corporate_id};

                        var insert_data={
                        corporate_id:empdata.corporate_id,
                        emp_db_id:mongoose.Types.ObjectId(empdata._id),
                        emp_id: empdata.emp_id,
                        wage_month:wage_month,
                        wage_year:wage_year,
                        shift_allawance_report:shift_allawance_earning_data,
                        "total_data.total_esic_data": total_earning_data_esic_data,
                        "total_data.pf_data": total_earning_data_pf_data,
                        status:'active',
                        
                        }
                        await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});
                        
                        await EmployeeMonthlyReport.updateOne(where_condition, {$inc:total_earning_data}); */
                    }
                }
            })).then(value =>{
                next();
                // return resp.status(200).json({ status: "success", message: 'Salary sheet generated successfully.' });
                //return resp.status(200).send({ status: 'success',message:"Shift allowance generated successfully." });
            });
        }); 
    }       
  },
};
