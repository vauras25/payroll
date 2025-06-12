const { Validator } = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var Employee = require("../../Model/Company/employee");
var LayoffModule = require("../../Model/Company/LayoffModule");
const mongoose = require("mongoose");
const layoffModule = require("../../Model/Company/LayoffHistoryLogs");
const layoffHistoryLogs = require("../../Model/Company/LayoffHistoryLogs");
const LayoffHistoryLogs = require("../../Model/Company/LayoffHistoryLogs");
var xl = require("excel4node");
const moment = require('moment');

module.exports = {
  get_apply_layoff: async function (req, resp, next) {
    try{
      const v = new Validator(req.body, {
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
        if (req.body.sortbyfield) {
          var sortoption = {};
          sortoption[req.body.sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
        } else {
          var sortoption = { created_at: -1 };
        }
        const options = {
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : 7,
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

        lookupDB = {
          dbName: "",
        };
        addedFields = {};

        if (req.body.reportListType === "summary") {
          lookupDB.dbName = "layoff_modules";
        } else if (req.body.reportListType === "detailed") {
          lookupDB.dbName = "layoff_history_logs";
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
              from: "layoff_modules",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "layoff_modules",
            },
          },
          {
            $addFields: {
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
              branch: 1,
              department: 1,
              designation: 1,
              client: 1,
              hod: 1,
              layoff_modules: 1,
              employee_detail: 1,
            },
          },
        ]);
        myAggregate;
        Employee.aggregatePaginate(
          myAggregate,
          options,
          async function (err, res) {
            if (err) return resp.json({ status: "error", message: err.message });
            return resp.status(200).json({ status: "success", docs: res });
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
  update_layoff_data: async function (req, resp, next) {
    try{
      const v = new Validator(req.body, {
        wage_value: "required",
        wage_month_from: "required",
        wage_year_from: "required",
        wage_month_to: "required",
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
            },
          },
        ]).then(async (emps) => {
          var dateObj = new Date();
          var layoff_data = [];
          var wage_month_from = (parseInt(req.body.wage_month_from) + 1);
          var wage_month_to = (parseInt(req.body.wage_month_to) + 1);
          var start_date = new Date(req.body.wage_year_from+'-'+wage_month_from+'-10');
          var end_date = new Date(req.body.wage_year_to+'-'+wage_month_to+'-10');
          await Promise.all(
            emps.map(async (empdata) => {
              var wage_value = parseFloat(req.body.wage_value);
              var document = {
                corporate_id: req.authData.corporate_id,
                emp_db_id:empdata._id,
                emp_id:empdata.emp_id,
                wage_value: wage_value,
                wage_month_from: parseInt(req.body.wage_month_from),
                wage_year_from: parseInt(req.body.wage_year_from),
                wage_month_to: parseInt(req.body.wage_month_to),
                wage_year_to: parseInt(req.body.wage_year_to),
                start_date:start_date,
                end_date:end_date,
                status: "active",
                updated_at: Date.now(),
              };

              await LayoffModule.findOneAndUpdate(
                { emp_id: empdata.emp_id },
                document,
                { upsert: true, new: true, setDefaultsOnInsert: true },
                async function (err, layoffModule) {
                  if (err) {
                    return resp
                      .status(200)
                      .send({ status: "error", message: err.message });
                  }
                  await LayoffHistoryLogs.create({
                    ...document,
                    layoff_id: layoffModule._id,
                  });
                }
              );
            })
          ).then((value) => {
            return resp.status(200).send({
              status: "success",
              message: "Layoff generated successfully",
              bonus_data: layoff_data,
              emps: emps,
            });
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
  get_layoff_report_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        reportListType: "required",
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
        var wage_month_from = (parseInt(req.body.wage_month_from) + 1);
        var wage_month_from = wage_month_from.toString();
        var wage_year_from = req.body.wage_year_from.toString();
        var wage_month_to = (parseInt(req.body.wage_month_to) + 1);
        var wage_month_to = wage_month_to.toString();
        var wage_year_to = req.body.wage_year_to.toString();
        var start_date = new Date(wage_year_from+'-'+wage_month_from+'-10');
        var end_date = new Date(wage_year_to+'-'+wage_month_to+'-10');
        if (sortbyfield) {
          var sortoption = {};
          sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
        } else {
          var sortoption = { created_at: -1 };
        }
        const options = {
          page: req.body.pageno,
          limit: req.body.perpage?req.body.perpage:perpage,
          sort:    sortoption,
        };
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

        lookupDB = {
          dbName: "",
        };
        addedFields = {};

        if (req.body.reportListType === "summary") {
          lookupDB.dbName = "layoff_modules";
          var match_dbq={ $match: { 'layoff_modules.wage_value': { $exists: true } } };
        } else if (req.body.reportListType === "detailed") {
          lookupDB.dbName = "layoff_history_logs";
          var match_dbq={ $match: { 'layoff_history_logs.wage_value': { $exists: true } } };
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
              from: lookupDB.dbName,
              let:{"emp_id_var":"$emp_id"},
              "pipeline":[
                {
                  "$match": { 
                    $and :[
                      {"$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }},
                      {
                        $or:[
                          {start_date: { $gte : start_date, $lte: end_date}},
                          {end_date: { $gte : start_date, $lte: end_date}}
                          ]
                      },
                    ]
                  } 
                }
              ],
              as: lookupDB.dbName,
            },
          },
          match_dbq,
          {
            $addFields: {
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
              branch: 1,
              department: 1,
              designation: 1,
              client: 1,
              hod: 1,
              [lookupDB.dbName]: 1,
            },
          },
        ]);

        if(req.body.generate == 'excel'){
          myAggregate.then(async (employees) =>{
              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              
              ws.cell(1, 1).string("SL No.");
              ws.cell(1, 2).string("Employee ID");
              ws.cell(1, 3).string("Employee Name");
              ws.cell(1, 4).string("Department");
              ws.cell(1, 5).string("Designation");
              ws.cell(1, 6).string("Branch");
              ws.cell(1, 7).string("Client");
              ws.cell(1, 8).string("HOD");
              ws.cell(1, 9).string("Wage %");
              ws.cell(1, 10).string("From ");
              ws.cell(1, 11).string("To");
            
              var row = 2;
              
              await Promise.all(employees.map(async function (employee, index) {

                    ws.cell(row, 1).number(row -1);
                    ws.cell(row, 2).string(employee.emp_id ? String(employee.emp_id) : '' )
                    ws.cell(row, 3).string(employee.emp_first_name ? String(employee?.emp_first_name + ' ' + employee?.emp_last_name) : '' )
                    ws.cell(row, 4).string(employee.department ? String(employee.department?.department_name) : '' )
                    ws.cell(row, 5).string(employee.designation ? String(employee.designation?.designation_name) : '' )
                    ws.cell(row, 6).string(employee.branch ? String(employee.branch?.branch_name) : '' )
                    ws.cell(row, 7).string(employee.client ? String(employee.client?.client_name) : '' )
                    ws.cell(row, 8).string(employee.hod ? String(employee.hod?.first_name + employee.hod?.last_name) : '' )

                    if(req.body.reportListType === "summary"){
                      const date_from = employee?.layoff_modules[0]?.wage_month_from ? moment({
                        year:employee?.layoff_modules[0]?.wage_year_from, 
                        month:employee?.layoff_modules[0]?.wage_month_from}).format('MMM YYYY') : ''
                      const date_to =  employee?.layoff_modules[0]?.wage_month_to ? moment({
                        year:employee?.layoff_modules[0]?.wage_year_to, 
                        month:employee?.layoff_modules[0]?.wage_month_to}
                        ).format('MMM YYYY') : ''
                      ws.cell(row, 9).string(employee.layoff_modules && employee.layoff_modules.length ? String(employee.layoff_modules[0].wage_value ?? 0) : '' )
                      ws.cell(row, 10).string(String(date_from ?? ''))
                      ws.cell(row, 11).string(String(date_to ?? ''))
                    }
                    if(req.body.reportListType === "detailed"){
                     for (const log of employee.layoff_history_logs) {
                      const date_from = log.wage_month_from ? moment({year:log.wage_year_from, month:log.wage_month_from}).format('MMM YYYY') : ''
                      const date_to =  log.wage_month_to ? moment({year:log.wage_year_to, month:log.wage_month_to}).format('MMM YYYY') : ''
                      ws.cell(row, 9).string(String(log.wage_value ?? ''))
                      ws.cell(row, 10).string(String(date_from ?? ''))
                      ws.cell(row, 11).string(String(date_to ?? ''))
                      row++;
                     } 
                    }
                    row++;
              })).then(async(value) => {
                let file_name = req.body.reportListType+"-layoff-report.xlsx";
                let file =  Site_helper.createFiles(wb,file_name, req.authData.corporate_id, 'temp_files/layoff-module');
                await Site_helper.downloadAndDelete(file.file_name,file.location, req.authData.corporate_id,resp);
                // let file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                // await Site_helper.downloadAndDelete(file_name,file_path, req.authData.corporate_id,resp);
                
                // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
                // wb.write("admin-company-credit-usage-details-list-export.xlsx");
                // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-credit-usage-details-list-export.xlsx",});
              });
          },(err) =>{
            if (err) return resp.json({ status: 'error', message: err.message });
          })
        }else{
              Employee.aggregatePaginate(
                myAggregate,
                options,
                async function (err, res) {
                  if (err) return resp.json({ status: "error", message: err.message });
                  return resp.status(200).json({ status: "success", docs: res });
                });
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
};
