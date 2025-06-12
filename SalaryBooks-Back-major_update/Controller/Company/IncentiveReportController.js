var IncentiveTemp = require("../../Model/Admin/IncentiveTemp");
const { Validator } = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var Employee = require("../../Model/Company/employee");
var IncentiveModule = require("../../Model/Company/IncentiveModule");
var EmployeeDetails = require("../../Model/Company/employee_details");
const EmployeeMonthlyReport = require("../../Model/Company/EmployeeMonthlyReport");
const mongoose = require("mongoose");
var fs = require("fs");
const csv = require("csv-parser");
const employee_advances = require("../../Model/Company/EmployeeAdvance");
const moment = require("moment");

module.exports = {
  get_incentive_form: async function (req, resp, next) {
    const v = new Validator(req.body, {
      incentive_month: "required",
      incentive_year: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
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
        var incentive_month = req.body.incentive_month;
        var incentive_year = req.body.incentive_year;
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
              from: "incentive_modules",
              let: { emp_db_idVar: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_id", "$$emp_db_idVar"] } },
                      { incentive_g_month: incentive_month },
                      { incentive_g_year: incentive_year },
                    ],
                  },
                },
                {
                  $lookup: {
                    from: "incentive_modules",
                    let: { incentive_idVar: "$disbursement_month_id" },
                    pipeline: [
                      {
                        $match: {
                          $and: [
                            { $expr: { $eq: ["$_id", "$$incentive_idVar"] } },
                          ],
                        },
                      },
                      {
                        $lookup: {
                          from: "employee_monthly_reports",
                          let: {
                            emp_db_idVar: "$emp_id",
                            wage_month: "$incentive_g_month",
                            wage_year: "$incentive_g_year",
                          },
                          pipeline: [
                            {
                              $match: {
                                $and: [
                                  {
                                    $expr: {
                                      $eq: ["$emp_db_id", "$$emp_db_idVar"],
                                    },
                                  },
                                  {
                                    incentive_report: {
                                      $exists: true,
                                      $ne: null,
                                    },
                                  },
                                  { $expr: { wage_month: "$$wage_month" } },
                                  { $expr: { wage_year: "$$wage_year" } },
                                ],
                              },
                            },
                            {
                              $project: {
                                incentive_report: 1,
                                bank_ins_referance_id:
                                  "$incentive_report.bank_ins_referance_id",
                              },
                            },
                          ],
                          as: "employee_monthly_reports",
                        },
                      },
                      {
                        $lookup: {
                          from: "bank_instructions",
                          localField:
                            "employee_monthly_reports.incentive_report.bank_ins_referance_id",
                          foreignField: "file_id",
                          as: "bank_instructions",
                        },
                      },
                      {
                        $addFields: {
                          employee_monthly_report: {
                            $arrayElemAt: ["$employee_monthly_reports", 0],
                          },
                          bank_instruction: {
                            $arrayElemAt: ["$bank_instructions", 0],
                          },
                        },
                      },
                      {
                        $project: {
                          employee_monthly_report: 1,
                          bank_instruction: 1,
                        },
                      },
                    ],
                    as: "disburusment_incentive_modules",
                  },
                },
                {
                  $lookup: {
                    from: "employee_monthly_reports",
                    let: { emp_db_idVar: "$emp_id" },
                    pipeline: [
                      {
                        $match: {
                          $and: [
                            {
                              $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] },
                            },
                            { incentive_report: { $exists: true, $ne: null } },
                            { wage_month: incentive_month },
                            { wage_year: incentive_year },
                          ],
                        },
                      },
                    ],
                    as: "employee_monthly_reports",
                  },
                },
                {
                  $lookup: {
                    from: "bank_instructions",
                    localField:
                      "employee_monthly_reports.incentive_report.bank_ins_referance_id",
                    foreignField: "file_id",
                    as: "bank_instructions",
                  },
                },
                {
                  $addFields: {
                    employee_monthly_report: {
                      $arrayElemAt: ["$employee_monthly_reports", 0],
                    },
                    bank_instruction: {
                      $arrayElemAt: ["$bank_instructions", 0],
                    },
                    disburusment_incentive_module: {
                      $arrayElemAt: ["$disburusment_incentive_modules", 0],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    advance_value: 1,
                    incentive_value: 1,
                    status: 1,
                    incentive_g_month: 1,
                    incentive_g_year: 1,
                    auto_disburse: 1,
                    employee_monthly_report: 1,
                    bank_instruction: 1,
                    disburusment_incentive_module: 1,
                  },
                },
              ],
              as: "incentive_modules",
            },
          },
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              incentive_module: {
                $arrayElemAt: ["$incentive_modules", 0],
              },
            },
          },

          // {
          //   from: "employee_monthly_reports",
          //   let: { emp_idVar: "$emp_id" },
          //   pipeline: [
          //     {
          //       $match: {
          //         $and: [
          //           { $expr: { $eq: ["$emp_id", "$$emp_idVar"] } },
          //           { incentive_report: {$exists:true, $ne:null} },
          //           { wage_month: "disburusment_incentive_module.incentive_g_month" },
          //           { wage_year: "disburusment_incentive_module.incentive_g_year" },
          //         ],
          //       },
          //     },
          //   ],
          //   as: "employee_monthly_reports",
          // },

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
              bank_ins_id: {
                $ifNull: [
                  "$incentive_module.disburusment_incentive_module.employee_monthly_report.bank_ins_referance_id",
                  {
                    $ifNull: [
                      "$incentive_module.employee_monthly_report.incentive_report.bank_ins_referance_id",
                      null,
                    ],
                  },
                ],
              },
              bank_instruction_status: {
                $ifNull: [
                  "$incentive_module.disburusment_incentive_module.bank_instruction.status",
                  {
                    $ifNull: [
                      "$incentive_module.bank_instruction.status",
                      null,
                    ],
                  },
                ],
              },
              incentive_module: { $ifNull: ["$incentive_module", {}] },
              // disburusment_incentive_module: {
              //   $ifNull: ["$disburusment_incentive_module", {}],
              // },
              "employee_details.employment_hr_details": 1,
              "employee_details.template_data.incentive_temp_data": 1,
              // incentive_modules: {
              //   $filter: {
              //     input: "$incentive_module",
              //     as: "incentive_module",
              //     cond: {
              //       $and: [
              //         {
              //           $eq: [
              //             "$$incentive_module.incentive_g_month",
              //             incentive_month,
              //           ],
              //         },
              //         {
              //           $eq: [
              //             "$$incentive_module.incentive_g_year",
              //             incentive_year,
              //           ],
              //         },
              //       ],
              //     },
              //   },
              // },
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
      } catch (e) {
        return resp.status(200).json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
      }
    }
  },
  update_incentive_module: async function (req, resp, next) {
    const v = new Validator(req.body, {
      action: "required",
      incentive_month: "required",
      incentive_year: "required",
      // emp_id: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      let v;
      if(req.body.action == 'apply'){
        v = new Validator(req.body, {
          incentive_value: "required",
          auto_disburse: "required",
        });
      }else if(req.body.action == 'update'){
        v = new Validator(req.body, {
          incentive_items: "required",
        });
      }

      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }
  
      let search_option = { $match :{}};

      if (req.body.row_checked_all === "true") {
        let ids = JSON.parse(req.body.unchecked_row_ids);
        if (ids.length > 0) {
          ids = ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match._id = { $nin: ids };
        }
      } else {
        let ids = JSON.parse(req.body.checked_row_ids);
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
            from: "employees_attendances",
            localField: "_id",
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
        //console.log('search_option',emps,JSON.parse(req.body.emp_id))
        var dateObj = new Date();
        var incentive_month = req.body.incentive_month;
        var incentive_year = req.body.incentive_year;
        var incentive_data = [];
        await Promise.all(
          emps.map(async (empdata) => {
            //console.log(empdata)
            if (empdata.employee_details)
              if (empdata.employee_details.template_data)
                var incentive_temp_data = empdata.employee_details.template_data
                  .incentive_temp_data
                  ? empdata.employee_details.template_data.incentive_temp_data
                  : null;

            const incenitve_items = JSON.parse(req.body.incentive_items || JSON.stringify({}))
            var incentive_value = parseFloat(req.body.incentive_value || incenitve_items[empdata._id]);
            var incentive_wages = incentive_value;
            var advance_amount = 0;
            var min_hold = parseFloat(incentive_temp_data.min_hold);
            var max_hold = parseFloat(incentive_temp_data.max_hold);
            // var min_hold=25;
            // var max_hold=50;

            if (incentive_temp_data.settlement_frequency == "monthly") {
              advance_amount = 0;
            } else {
              if (min_hold >= incentive_wages) {
                advance_amount = incentive_wages;
              } else {
                incentive_wages = incentive_wages - min_hold;
                var min_h = ((incentive_wages - min_hold) % min_hold) || 0;
                var max_h = ((incentive_wages - max_hold) % max_hold) || 0;
                var hold_incentive_amount =
                  max_hold > incentive_wages ? min_h : max_h;
                advance_amount = incentive_wages - hold_incentive_amount;

                // genarete_advance_amount = await Site_helper.calculate_incentive_advance(empdata._id,incentive_temp_data,req.companyData,+incentive_month ,incentive_year,advance_amount);
                // incentive_amount= (genarete_advance_amount == 0 ? (incentive_amount + advance_amount) : incentive_amount)
              }
            }
            var document = {
              corporate_id: req.authData.corporate_id,
              emp_id: mongoose.Types.ObjectId(empdata._id),
              auto_disburse: req.body.auto_disburse,
              incentive_value: incentive_value,
              hold_value: incentive_value - advance_amount,
              advance_value: advance_amount,
              incentive_g_month: parseInt(incentive_month),
              incentive_g_year: parseInt(incentive_year),
              status: "pending",
              created_at: Date.now(),
              updated_at: Date.now(),
            };

            try {
              const entity = await IncentiveModule.findOne({emp_id: mongoose.Types.ObjectId(empdata._id), incentive_g_month: parseInt(incentive_month), incentive_g_year: parseInt(incentive_year)});
              if(!entity){
                await IncentiveModule.create(document);
              }else{
                entity.auto_disburse =  document.auto_disburse;
                entity.incentive_value =  document.incentive_value;
                entity.hold_value =  document.hold_value;
                entity.advance_value =  document.advance_value;
                entity.incentive_g_month =  document.incentive_g_month;
                entity.incentive_g_year =  document.incentive_g_year;
                entity.status =  document.status;
                entity.updated_at =  document.updated_at;
                if(!entity.created_at){
                  entity.created_at = document.created_at;
                }
                await entity.save()
              }
            } catch (err) {
              return resp.status(200).send({ status: "error", message: err.message });
            }

            
            // await IncentiveModule.findOneAndUpdate(
            //   {
            //     emp_id: mongoose.Types.ObjectId(empdata._id),
            //     incentive_g_month: +incentive_month,
            //     incentive_g_year: +incentive_year,
            //   },
            //   { $set:document },
            //   { upsert: true, new:true },
            //   function (err, incentivemodule) {
            //     console.log(incentivemodule);
                
            //     if (err)
            //       return resp
            //         .status(200)
            //         .send({ status: "error", message: err.message });


            //   }
            // );
          })
        ).then((value) => {
          return resp.status(200).send({
            status: "success",
            message: "incentive generated successfully",
            incentive_data: incentive_data,
            emps: emps,
          });
        });
      });
    }
  },
  generate_incentive_sheet: async function (req, resp, next) {
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
    //search_option_details.$match['employee_monthly_reports.salary_report']= { $exists: true};
    // var wage_month = req.body.attendance_month;
    // var wage_year = req.body.attendance_year;
    var wage_month = req.body.attendance_month;
    var wage_year = req.body.attendance_year;
    var myAggregate = Employee.aggregate([
      search_option,
      // {
      //   $lookup: {
      //     from: "clients",
      //     localField: "client_code",
      //     foreignField: "_id",
      //     as: "client",
      //   },
      // },
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
      // {
      //   $lookup: {
      //     from: "staffs",
      //     localField: "emp_hod",
      //     foreignField: "_id",
      //     as: "hod",
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
      //     from: "companies",
      //     localField: "corporate_id",
      //     foreignField: "corporate_id",
      //     as: "companies",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "company_details",
      //     localField: "companies._id",
      //     foreignField: "company_id",
      //     as: "company_details",
      //   },
      // },
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
        $lookup: {
          from: "incentive_modules",
          let: { emp_id_var: "$_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                  { incentive_g_month: parseInt(wage_month) },
                  { incentive_g_year: parseInt(wage_year) },
                ],
              },
            },
          ],
          as: "incentive_modules",
        },
      },
      // {
      //     "$unwind": "$incentive_modules"
      // },
      {
        $addFields: {
          employee_details: {
            $arrayElemAt: ["$employee_details", 0],
          },
          employee_monthly_reports: {
            $arrayElemAt: ["$employee_monthly_reports", 0],
          },
          // hod: {
          //   $arrayElemAt: ["$hod", 0],
          // },
          // designation: {
          //   $arrayElemAt: ["$designation", 0],
          // },
          // department: {
          //   $arrayElemAt: ["$department", 0],
          // },
          // client: {
          //   $arrayElemAt: ["$client", 0],
          // },
          incentive_module: {
            $arrayElemAt: ["$incentive_modules", 0],
          },
        },
      },
      // {
      //   $unwind: "$company_details",
      // },
      // {
      //   $addFields: {
      //     branch: {
      //       $filter: {
      //         input: "$company_details.company_branch",
      //         as: "branch_item",
      //         cond: {
      //           $eq: [
      //             "$employee_details.employment_hr_details.branch",
      //             "$$branch_item._id",
      //           ],
      //         },
      //       },
      //     },
      //   },
      // },
      // {
      //   $unwind: "$branch",
      // },
      {
        $project: {
          _id: 1,
          corporate_id: 1,
          userid: 1,
          emp_id: 1,
          emp_first_name: 1,
          emp_last_name: 1,
          employee_details: 1,
          incentive_module: 1,
          employee_monthly_reports: 1,
          employee_advances: 1
          // emp_dob: 1,
          // pan_no: 1,
          // aadhar_no: 1,
          // email_id: 1,
          // empid: 1,
          // client_code: 1,
          // approval_status: 1,
          // age: {
          //   $divide: [
          //     { $subtract: [new Date(), "$emp_dob"] },
          //     365 * 24 * 60 * 60 * 1000,
          //   ],
          // },
          // "hod.first_name": 1,
          // "hod.last_name": 1,
          // "hod.userid": 1,
          // "hod._id": 1,
          // hold_salary_emps: 1,
          // employee_monthly_reports: 1,
          // "branch.branch_name": 1,
          // "branch._id": 1,
          // "designation.designation_name": 1,
          // "designation._id": 1,
          // "department.department_name": 1,
          // "department._id": 1,
          // "client.client_name": 1,
          // "client._id": 1,
        },
      },
    ]).then(async (emps) => {     
      var currdate = new Date();
      var epfo_temp = await Site_helper.get_gov_epfo_data(req);
      var esic_temp = await Site_helper.get_gov_esic_data(req);

      async function createAdvance(incentive_advance, disbursement_month, empdata) {
        let disbursement_year = +wage_year;
        if (+wage_month > disbursement_month) disbursement_year += 1;
        var document = {
          corporate_id: req.authData.corporate_id,
          emp_id: empdata.emp_id,
          recovery_from: "incentive",
          advance_amount: incentive_advance,
          advance_outstanding: incentive_advance,
          no_of_instalments: 1,
          recovery_frequency: "monthly",
          payment_start_month: disbursement_month,
          payment_start_year: disbursement_year,
          payment_booking_date: moment().format("MM-DD-YYYY"),
          remaining_amount: incentive_advance,
          remarks: "Advance amount of booked incentive.",
          instalment_history: {
            instalment_month: disbursement_month,
            instalment_year: disbursement_year,
            recovery_from: "incentive",
            advance_amount: incentive_advance,
            status: "pending",
          },
          status: "active",
          created_at: Date.now(),
        };
        try {        
          if (
            empdata.incentive_module.advance_id &&
            mongoose.isValidObjectId(empdata.incentive_module.advance_id)
          ) {
            delete document.created_at;
            await employee_advances.updateOne(
              { _id: empdata.incentive_module.advance_id },
              document
            );
            await IncentiveModule.updateOne(
              { _id: empdata.incentive_module._id },
              { status: "run" }
            );
          } else {
            const advance = await employee_advances.create(document);            
            await IncentiveModule.updateOne(
              { _id: empdata.incentive_module._id },
              { advance_id: advance._id, status: "run" }
            );
          }
          if (empdata.incentive_module.disbursement_month_id) {
            const incentive_module = await IncentiveModule.findById(
              empdata.incentive_module.disbursement_month_id
            );
            wage_month = incentive_module.incentive_g_month;
            wage_year = incentive_module.incentive_g_year;
            empdata.incentive_module = incentive_module;
            await createMonthlyReport(empdata);
          }
          // var advance_report_data = {
          //   gross_earning:incentive_advance,
          //   bank_ins_referance_id: "",
          // };
          // var insert_data={
          //   corporate_id:empdata.corporate_id,
          //   emp_db_id:mongoose.Types.ObjectId(empdata._id),
          //   emp_id: empdata.emp_id,
          //   wage_month:attendance_month,
          //   wage_year:attendance_year,
          //   advance_report:advance_report_data,
          //   total_data:total_earning_data,
          //   status:'active',
          // }
          // var where_condition={'emp_id':empdata.emp_id,wage_month:wage_month,wage_year:wage_year,corporate_id:empdata.corporate_id};
          // await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});
        } catch (err) {
          return resp
            .status(200)
            .send({ status: "error", message: err.message ?? err });
        }
      }

      async function createMonthlyReport(empdata) {
        var pre_total_pt = 0;
        var pre_module_pt = 0;
        // var emp_state = empdata.employee_details.emp_address.state;
        var emp_state = (empdata?.employee_details?.template_data?.ptax_temp_data?.state_name || empdata?.employee_details?.emp_address?.state);
        var gross_salary = parseFloat( empdata.employee_details.employment_hr_details.gross_salary);
        var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;
        // var pre_earning_data = empdata.employee_monthly_reports;
        var incentive_temp_data = empdata.employee_details.template_data.incentive_temp_data
        ? empdata.employee_details.template_data.incentive_temp_data
        : null;

        var {
          incentive_module_date,
          start_month,
          end_month,
          start_year,
          end_year,
        } = await Site_helper.calculate_incentive(
          empdata._id,
          incentive_temp_data,
          gross_salary,
          empdata.incentive_module,
          req.companyData,
          +wage_month,
          +wage_year,
          empdata.emp_id
        );
        if (incentive_module_date) {
          const incentive_id = empdata.incentive_module._id;
          var incentive_value =
            incentive_module_date.total_incentive_value ?? 0;

          try {
            if (incentive_temp_data.settlement_frequency !== "monthly") {
              await IncentiveModule.updateMany(
                {
                  $and: [
                    { corporate_id: req.authData.corporate_id },
                    { emp_id: mongoose.Types.ObjectId(empdata._id) },
                    {
                      $or: [
                        { incentive_g_year: { $gt: start_year } },
                        {
                          $and: [
                            { incentive_g_year: { $gte: start_year } },
                            { incentive_g_month: { $gte: start_month } },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { incentive_g_year: { $lt: end_year } },
                        {
                          $and: [
                            { incentive_g_year: { $lte: end_year } },
                            { incentive_g_month: { $lte: end_month } },
                          ],
                        },
                      ],
                    },
                  ],
                },
                { disbursement_month_id: incentive_id }
              );
            }
            await IncentiveModule.updateOne(
              { _id: incentive_id },
              { advance_value: 0, status: "run" }
            )
          } catch (err) {
            return resp
              .status(200)
              .send({ status: "error", message: err.message ?? err });
          }

          try {
            const advances = await employee_advances.find({
              corporate_id: req.authData.corporate_id,
              emp_id: empdata.emp_id,
              recovery_from: "incentive",
              payment_start_month: +wage_month,
              payment_start_year: +wage_year,
              status: "active",
            });

            for (const advance of advances) {
              if (incentive_value - advance.advance_amount > 0) {
                incentive_value -= advance.advance_amount;
              }
            }

            //  await Promise.all(advances.map(advance => {
            //    if((incentive_value - advance.advance_amount ) > 0){
            //       incentive_value -=  advance.advance_amount
            //       if(advance.no_of_instalments == 1){
            //        advance.instalment_history[0].status = 'complete'
            //        advance.status = 'complete';
            //       }else{
            //         advance.instalment_history.map(instalment => {
            //          if(instalment.instalment_month == +attendance_month && instalment.instalment_year == +wage_year){
            //            instalment.status = 'complete'
            //          }
            //         })
            //       }
            //       advance.save()
            //    }
            //    return advance
            //  }));
          } catch (err) {
            return resp
              .status(200)
              .send({ status: "error", message: err.message ?? err });
          }

          var pre_salary_data = empdata.employee_monthly_reports;
          var pre_monthly_wage_amount = 0;
          if (pre_salary_data) {
            if (pre_salary_data.incentive_report) {
              pre_monthly_wage_amount =
                pre_salary_data.total_data.total_pf_wages -
                pre_salary_data.incentive_report.total_pf_wages;
            } else {
              pre_monthly_wage_amount =
                pre_salary_data.total_data.total_pf_wages;
            }
          }
          if (salary_temp_data.restricted_pf === "yes") {
            var template_wage_ceiling = parseFloat(
              epfo_temp.wage_ceiling
            );
            var avaiable_wage_amount =
              template_wage_ceiling - pre_monthly_wage_amount;
            var module_wage_amount =
              incentive_value < parseFloat(avaiable_wage_amount)
                ? incentive_value
                : parseFloat(avaiable_wage_amount);
          } else {
            var module_wage_amount = incentive_value;
          }
          var restrict_esic_wages =
            parseFloat(esic_temp.wage_ceiling) > gross_salary
              ? incentive_value
              : 0;
          var total_tds_wages = 0;
          if (incentive_temp_data.tds_apply == "yes") {
            total_tds_wages = incentive_value;
          }
          var incentive_data = {
            total_pf_bucket: incentive_value,
            ctc: incentive_value,
            total_pf_wages: module_wage_amount,
            total_esic_bucket: incentive_value,
            total_esic_wages: restrict_esic_wages,
            total_tds_wages: total_tds_wages,
            total_pt_wages: incentive_value,
            overtime_wages: incentive_value,
            gross_earning: incentive_value,
            bank_ins_referance_id: "",
            pf_challan_referance_id: "",
            esic_challan_referance_id: "",
            pf_generate: 'no',
            esic_generate: 'no',
          };
          if (pre_salary_data) {
            pre_total_pt = pre_salary_data.total_data.total_pt_amount
              ? pre_salary_data.total_data.total_pt_amount
              : 0;
            if (pre_salary_data.incentive_report) {
              pre_module_pt = pre_salary_data.incentive_report.pt_amount
                ? pre_salary_data.incentive_report.pt_amount
                : 0;
              var total_earning_data = {
                total_earning:
                  incentive_data.gross_earning +
                  (pre_salary_data.total_data.total_earning -
                    pre_salary_data.incentive_report.gross_earning),
                total_ctc:
                  incentive_data.ctc +
                  (pre_salary_data.total_data.total_ctc -
                    pre_salary_data.incentive_report.ctc),
                total_pf_bucket:
                  incentive_data.total_pf_bucket +
                  (pre_salary_data.total_data.total_pf_bucket -
                    pre_salary_data.incentive_report.total_pf_bucket),
                total_pf_wages:
                  incentive_data.total_pf_wages +
                  (pre_salary_data.total_data.total_pf_wages -
                    pre_salary_data.incentive_report.total_pf_wages),
                total_esic_bucket:
                  incentive_data.total_esic_bucket +
                  (pre_salary_data.total_data.total_esic_bucket -
                    pre_salary_data.incentive_report.total_esic_bucket),
                total_esic_wages:
                  incentive_data.total_esic_wages +
                  (pre_salary_data.total_data.total_esic_wages -
                    pre_salary_data.incentive_report.total_esic_wages),
                total_tds_wages:
                  incentive_data.total_tds_wages +
                  (pre_salary_data.total_data.total_tds_wages -
                    pre_salary_data.incentive_report.total_tds_wages),
                total_pt_wages:
                  incentive_data.total_pt_wages +
                  (pre_salary_data.total_data.total_pt_wages -
                    pre_salary_data.incentive_report.total_pt_wages),
                bank_ins_referance_id:
                  pre_salary_data.total_data.bank_ins_referance_id == ""
                    ? ""
                    : pre_salary_data.total_data.bank_ins_referance_id,
                pf_challan_referance_id:
                  pre_salary_data.total_data.pf_challan_referance_id == ""
                    ? ""
                    : pre_salary_data.total_data.pf_challan_referance_id,
                esic_challan_referance_id:
                  pre_salary_data.total_data.esic_challan_referance_id ==
                  ""
                    ? ""
                    : pre_salary_data.total_data
                        .esic_challan_referance_id,
              };
            } else {
              var total_earning_data = {
                total_earning:
                  incentive_data.gross_earning +
                  pre_salary_data.total_data.total_earning,
                total_ctc:
                  incentive_data.ctc +
                  pre_salary_data.total_data.total_ctc,
                total_pf_bucket:
                  incentive_data.total_pf_bucket +
                  pre_salary_data.total_data.total_pf_bucket,
                total_pf_wages:
                  incentive_data.total_pf_wages +
                  pre_salary_data.total_data.total_pf_wages,
                total_esic_bucket:
                  incentive_data.total_esic_bucket +
                  pre_salary_data.total_data.total_esic_bucket,
                total_esic_wages:
                  incentive_data.total_esic_wages +
                  pre_salary_data.total_data.total_esic_wages,
                total_tds_wages:
                  incentive_data.total_tds_wages +
                  pre_salary_data.total_data.total_tds_wages,
                total_pt_wages:
                  incentive_data.total_pt_wages +
                  pre_salary_data.total_data.total_pt_wages,
                bank_ins_referance_id: "",
                pf_challan_referance_id: "",
                esic_challan_referance_id: "",
                pf_generate: 'no',
                esic_generate: 'no',
              };
            }
          } else {
            var total_earning_data = {
              total_earning: incentive_data.gross_earning,
              total_ctc: incentive_data.ctc,
              total_pf_bucket: incentive_data.total_pf_bucket,
              total_pf_wages: incentive_data.total_pf_wages,
              total_esic_bucket: incentive_data.total_esic_bucket,
              total_esic_wages: incentive_data.total_esic_wages,
              total_tds_wages: incentive_data.total_tds_wages,
              total_pt_wages: incentive_data.total_pt_wages,
              bank_ins_referance_id: "",
              pf_challan_referance_id: "",
              esic_challan_referance_id: "",
              pf_generate: 'no',
              esic_generate: 'no',
            };
          }
          incentive_data.esic_data = await Site_helper.calculate_esic(
            esic_temp,
            incentive_data.total_esic_wages,
            gross_salary
          );
          incentive_data.pf_data = await Site_helper.calculate_pf(
            epfo_temp,
            incentive_data.total_pf_wages,
            salary_temp_data,
            empdata.employee_details.employment_hr_details
          );

          total_earning_data.esic_data = await Site_helper.calculate_esic(
            esic_temp,
            total_earning_data.total_esic_wages,
            gross_salary
          );
          total_earning_data.pf_data = await Site_helper.calculate_pf(
            epfo_temp,
            total_earning_data.total_pf_wages,
            salary_temp_data,
            empdata.employee_details.employment_hr_details
          );

          var p_tax_amount = await Site_helper.calculate_pt(
            req,
            currdate,
            emp_state,
            total_earning_data.total_pt_wages
              ? total_earning_data.total_pt_wages
              : 0
          );
          var module_pt_amount =
            p_tax_amount - (pre_total_pt - pre_module_pt);
          incentive_data.pt_amount = module_pt_amount;
          total_earning_data.total_pt_amount = p_tax_amount;
          var insert_data = {
            corporate_id: empdata.corporate_id,
            emp_db_id: mongoose.Types.ObjectId(empdata._id),
            emp_id: empdata.emp_id,
            wage_month: wage_month,
            wage_year: wage_year,
            incentive_report: incentive_data,
            total_data: total_earning_data,
            status: "active",
          };
          var where_condition = {
            emp_id: empdata.emp_id,
            wage_month: wage_month,
            wage_year: wage_year,
            corporate_id: empdata.corporate_id,
          };
          await EmployeeMonthlyReport.findOneAndUpdate(
            where_condition,
            insert_data,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          /*
                console.log('asdasd')
                    var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? incentive_module_date.calculated_incentive_value : 0 );
                    var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;

                    if(salary_temp_data.restricted_pf === "yes")
                    {
                        var pre_monthly_wage_amount=(pre_earning_data?pre_earning_data.total_data.total_pf_wages:0);
                        var template_wage_ceiling = parseFloat(epfo_temp.wage_ceiling);
                        var avaiable_wage_amount= (template_wage_ceiling-pre_monthly_wage_amount);
                        var module_wage_amount=(incentive_module_date.calculated_incentive_value < parseFloat(avaiable_wage_amount) ? incentive_module_date.calculated_incentive_value  : parseFloat(avaiable_wage_amount) );
                    }
                    else
                    {    
                        var module_wage_amount=incentive_module_date.calculated_incentive_value;
                    }
                    var total_earning = incentive_module_date.calculated_incentive_value;
                    var advance_recovery_data=await Site_helper.get_advance_recovery_data(empdata.emp_id,empdata.corporate_id,wage_month,wage_year,total_earning,'incentive');
                    //var gross_earning = advance_recovery_data.available_module_amount;
                    var gross_earning = total_earning;
                    //console.log(advance_recovery_data,gross_earning)
                    var advance_recovered = advance_recovery_data.advance_recovered;
                    //var advance_recovered =0;
                    var incentive_earning_data={
                        total_pf_bucket:incentive_module_date.calculated_incentive_value,
                        total_pf_wages:module_wage_amount,
                        total_esic_bucket:incentive_module_date.calculated_incentive_value,
                        total_esic_wages:restrict_esic_wages,
                        total_pt_wages:incentive_module_date.calculated_incentive_value,
                        incentive_wages:incentive_module_date.calculated_incentive_value,
                        gross_earning:gross_earning,
                        advance_recovered:advance_recovered,
                        accumulated:incentive_module_date.total_incentive_value,
                        setteled:incentive_module_date.calculated_advance_value,
                        balance:incentive_module_date.calculated_incentive_value,
                        bank_ins_referance_id:'',
                        pf_challan_referance_id:'',
                        esic_challan_referance_id:'',
                      };
                      //console.log(incentive_earning_data);
                    if(pre_earning_data)
                    {
                        pre_total_pt = pre_earning_data.total_data.total_pt_amount;
                        pre_monthly_pt_wage_amount =pre_earning_data.total_data.total_pt_wages;
                        if(pre_earning_data.incentive_report)
                        {
                            pre_module_pt = pre_earning_data.incentive_report.pt_amount;
                          var total_earning_data={ 
                            'total_data.total_earning': (pre_earning_data.incentive_report ? (  incentive_earning_data.gross_earning - pre_earning_data.incentive_report.gross_earning) : incentive_earning_data.gross_earning),
                            'total_data.total_pf_bucket':(pre_earning_data.incentive_report ? (incentive_earning_data.total_pf_wages -  pre_earning_data.incentive_report.total_pf_bucket) : incentive_earning_data.total_pf_wages),
                            'total_data.total_pf_wages':(pre_earning_data.incentive_report ? ( module_wage_amount -  pre_earning_data.incentive_report.total_pf_wages) : module_wage_amount),
                            'total_data.total_esic_bucket':(pre_earning_data.incentive_report ? ( incentive_earning_data.total_esic_bucket - pre_earning_data.incentive_report.total_esic_bucket) : incentive_earning_data.total_esic_bucket),
                            'total_data.total_esic_wages':(pre_earning_data.incentive_report ? (incentive_earning_data.total_esic_wages - pre_earning_data.incentive_report.total_esic_wages) : incentive_earning_data.total_esic_wages),
                            'total_data.total_pt_wages':(pre_earning_data.incentive_report ? (incentive_earning_data.total_pt_wages - pre_earning_data.incentive_report.total_pt_wages)  : incentive_earning_data.total_pt_wages),
                          };
                        }
                        else
                        {
                          var total_earning_data={ 
                            'total_data.total_earning':  incentive_earning_data.gross_earning,
                            'total_data.total_pf_bucket':incentive_earning_data.total_pf_wages,
                            'total_data.total_pf_wages': module_wage_amount,
                            'total_data.total_esic_bucket': incentive_earning_data.total_esic_bucket,
                            'total_data.total_esic_wages': incentive_earning_data.total_esic_wages,
                            'total_data.total_pt_wages': incentive_earning_data.total_pt_wages,
                          };
                        } 
                    }
                    else
                    {
                        var total_earning_data={ 
                        'total_data.total_earning':  incentive_earning_data.gross_earning,
                        'total_data.total_pf_bucket':incentive_earning_data.total_pf_wages,
                        'total_data.total_pf_wages': module_wage_amount,
                        'total_data.total_esic_bucket': incentive_earning_data.total_esic_bucket,
                        'total_data.total_esic_wages': incentive_earning_data.total_esic_wages,
                        'total_data.total_pt_wages': incentive_earning_data.total_pt_wages,
                        };
                    } 
                    incentive_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, incentive_earning_data.total_esic_wages,gross_salary);
                    incentive_earning_data.pf_data = await Site_helper.calculate_pf(await epfo_temp, incentive_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);
                    var p_tax_amount = await Site_helper.calculate_pt(req, currdate, emp_state,incentive_earning_data.total_pt_wages ? incentive_earning_data.total_pt_wages : 0);
                    var module_pt_amount = p_tax_amount - (pre_total_pt - pre_module_pt);
                    incentive_earning_data.pt_amount = module_pt_amount;
                    total_earning_data['total_data.total_pt_amount'] = (p_tax_amount - pre_total_pt);
                    var total_earning_data_esic_data = await Site_helper.calculate_esic(esic_temp,incentive_earning_data.total_esic_wages,gross_salary);
                    var total_earning_data_pf_data = await Site_helper.calculate_pf(await epfo_temp,incentive_earning_data.total_pf_wages,salary_temp_data,empdata.employee_details.employment_hr_details );
                    var emp_data={
                        _id:empdata._id,
                        emp_id:empdata.emp_id,
                        emp_first_name:empdata.emp_first_name,
                        emp_last_name:empdata.emp_last_name,
                        emp_emp_dob:empdata.emp_dob,
                        emp_pan_no:empdata.pan_no,
                        emp_aadhar_no:empdata.aadhar_no,
                        emp_email_id:empdata.email_id,
                        new_pf_no:(empdata.employee_details.employment_details?empdata.employee_details.employment_details.new_pf_no:'NA'),
                        esic_no:(empdata.employee_details.employment_details?empdata.employee_details.employment_details.esic_no:'NA'),
                        date_of_join:empdata.employee_details.employment_hr_details.date_of_join,
                        sex:empdata.sex,
                        age:empdata.age,
                        EPF:empdata.employee_details.employment_hr_details.pf_applicable,
                        EPS:empdata.employee_details.employment_hr_details.pension_applicable,
                        Restrict_PF:empdata.employee_details.template_data.salary_temp_data.restricted_pf,
                        Reg_Type:empdata.employee_details.template_data.attendance_temp_data.register_type,
                        emp_uan_no:(empdata.employee_details.pf_esic_details?empdata.employee_details.pf_esic_details.curr_er_epfo_details.uan_no:'NA'),
                        hod:empdata.hod ? empdata.hod.first_name+" "+empdata.hod.last_name:'',
                        branch:empdata.branch,
                        designation:empdata.designation,
                        department:empdata.department,
                        client:empdata.client,
                    };                             
                    //console.log(pf_return_val,esic_amount);
                        var where_condition={'emp_id':empdata.emp_id,wage_month:wage_month,wage_year:wage_year,corporate_id:empdata.corporate_id};

                        var insert_data={
                        corporate_id:empdata.corporate_id,
                        emp_db_id:mongoose.Types.ObjectId(empdata._id),
                        emp_id: empdata.emp_id,
                        wage_month:wage_month,
                        wage_year:wage_year,
                        incentive_report:incentive_earning_data,
                        emp_data:emp_data,
                        "total_data.total_esic_data": total_earning_data_esic_data,
                        "total_data.pf_data": total_earning_data_pf_data,
                        status:'active',
                        
                        }
                        await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});
                        //await EmployeeMonthlyReport.updateOne(where_condition, {$inc:total_earning_data});
                        await EmployeeMonthlyReport.updateOne(where_condition, {$inc:total_earning_data});
                        */
        }
      }

      await Promise.all(
        emps.map(async (empdata) => {
          //console.log(empdata)
          if (
            empdata.employee_details &&
            empdata.employee_details.template_data &&
            empdata.incentive_module
          ) {
         
            var incentive_temp_data = empdata.employee_details.template_data.incentive_temp_data
                ? empdata.employee_details.template_data.incentive_temp_data
                : null;
            var incentive_amount = empdata.incentive_module.advance_value;

            var { incentive_advance, disbursement_month } =
              await Site_helper.calculate_incentive_advance(
                empdata._id,
                incentive_temp_data,
                req.companyData,
                +wage_month,
                wage_year,
                incentive_amount,
                true
              );       
            if (incentive_advance) {
              await createAdvance(incentive_advance, disbursement_month, empdata);
            } else {
              await createMonthlyReport(empdata);
            }
          }
        })
      ).then((value) => {
        next();
        // return resp.status(200).send({ status: 'success',message:"Incentive generated successfully" });
      });
    });
  },
  get_incentive_report_listing_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        wage_month_from: "required",
        wage_year_from: "required",
        wage_month_to: "required",
        wage_year_to: "required",
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
          // search_option_details=query_data.search_option_details;
          search_option = query_data.search_option;
        }

        if (req.body.list_type == "payout") {
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
          }

          var wage_month = +req.body.wage_month;
          var wage_year = +req.body.wage_year;

          search_option_details.$match[
            "employee_monthly_reports.incentive_report"
          ] = { $exists: true, $ne: null };

          var monthly_report_lookup = {
            from: "employee_monthly_reports",
            let: { emp_idVar: "$emp_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$emp_id", "$$emp_idVar"] } },
                    { wage_month: wage_month },
                    { wage_year: wage_year },
                  ],
                },
              },
            ],
            as: "employee_monthly_reports",
          };
          var incentive_modules_lookup = {
            from: "incentive_modules",
            let: { emp_idVar: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$emp_id", "$$emp_idVar"] } },
                    { incentive_g_month: wage_month },
                    { incentive_g_year: wage_year },
                  ],
                },
              },
              {
                $group: {
                  _id: null,

                  // status: {
                  //   $first: "$status",
                  // },
                  calculated_advance_value: {
                    $sum: {
                      $cond: {
                        if: { $ne: ["$status", "pending"] },
                        then: "$advance_value",
                        else: 0,
                      },
                    },
                  },
                  // calculated_advance_value: {
                  //   $sum: "$advance_value",
                  // },
                  total_incentive_value: {
                    $sum: "$incentive_value",
                  },
                },
              },
            ],
            as: "incentive_modules_data",
          };
        } else {
          var start_month = parseInt(req.body.wage_month_from);
          var start_year = parseInt(req.body.wage_year_from);
          var end_month = parseInt(req.body.wage_month_to);
          var end_year = parseInt(req.body.wage_year_to);

          var monthly_report_lookup = {
            from: "employee_monthly_reports",
            let: { emp_db_idVar: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    {"incentive_report":{$exists:true, $ne:null}},
                    { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
                    {
                      $or: [
                        { wage_year: { $gt: start_year } },
                        {
                          $and: [
                            { wage_year: { $gte: start_year } },
                            { wage_month: { $gte: start_month } },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: end_year } },
                        {
                          $and: [
                            { wage_year: { $lte: end_year } },
                            { wage_month: { $lte: end_month } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            as: "employee_monthly_reports",
          };
          var incentive_modules_lookup = {
            from: "incentive_modules",
            let: { emp_id_var: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                    { status: {$ne:"pending"}},
                    {
                      $or: [
                        { incentive_g_year: { $gt: start_year } },
                        {
                          $and: [
                            { incentive_g_year: { $gte: start_year } },
                            { incentive_g_month: { $gte: start_month } },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { incentive_g_year: { $lt: end_year } },
                        {
                          $and: [
                            { incentive_g_year: { $lte: end_year } },
                            { incentive_g_month: { $lte: end_month } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },

              {
                $group: {
                  _id: null,

                  // calculated_advance_value: {
                  //   $sum: "$genarete_advance_value",
                  // },
                  // employee_advance:{$first:"$employee_advance"},
                  // calculated_advance_value: {
                  //   $sum: "$advance_value",
                  // },
                  calculated_advance_value: {
                    $sum: {
                      $cond: {
                        if: { $ne: ["$status", "pending"] },
                        then: "$advance_value",
                        else: 0,
                      },
                    },
                  },
                  // calculated_advance_value: {
                  //   $sum: "$genarete_advance_value",
                  // },
                  // employee_advance:{$first:"$employee_advance"},
                  // calculated_advance_value: {
                  //   $sum:{
                  //     $cond:{
                  //       if:{$ne:["$status","run"]},
                  //       then:"$employee_advance",
                  //       else:0
                  //     }
                  //   }
                  //   // $sum: "$advance_value",
                  // },
                  total_incentive_value: {
                    $sum: "$incentive_value",
                  },
                },
              },
            ],
            // localField: '_id',
            // foreignField: 'emp_id',
            as: "incentive_modules_data",
          };
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
            $lookup: monthly_report_lookup,
          },

          {
            $lookup: incentive_modules_lookup,
            // $lookup: {
            //   from: 'incentive_modules',
            //   let: { emp_id_var: "$_id" },
            //   pipeline: [
            //     {
            //       $match: {
            //         $and: [
            //           { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
            //           {
            //             $or: [
            //               { 'incentive_g_year': { $gt: start_year } },
            //               {
            //                 $and: [
            //                   { 'incentive_g_year': { $gte: start_year } },
            //                   { 'incentive_g_month': { $gte: start_month } }
            //                 ]
            //               }
            //             ]
            //           },
            //           {
            //             $or: [
            //               { 'incentive_g_year': { $lt: end_year } },
            //               {
            //                 $and: [
            //                   { 'incentive_g_year': { $lte: end_year } },
            //                   { 'incentive_g_month': { $lte: end_month } }
            //                 ]
            //               }
            //             ]
            //           }
            //           //{ "instalment_history": { $elemMatch: { instalment_year: { $eq: attendence_year.toString() } } }},
            //           //{ "instalment_history": { $elemMatch: { instalment_month: { $eq: attendence_month.toString() } } }},

            //         ],
            //       },
            //     },

            //     {
            //       $group: {
            //         _id: null,

            //         // calculated_advance_value: {
            //         //   $sum: "$genarete_advance_value",
            //         // },
            //         calculated_advance_value: {
            //           $sum: "$advance_value",
            //         },
            //         total_incentive_value: {
            //           $sum: "$incentive_value",
            //         },
            //       },
            //     },
            //   ],
            //   // localField: '_id',
            //   // foreignField: 'emp_id',
            //   as: 'incentive_modules_data',
            // }
          },
          {
            $match: {
             incentive_modules_data: { $ne: [] }, // Match only if there are results in the lookupResults array
            //  'incentive_modules_data': { $exists: true, $ne: null } // Match only if there are results in the lookupResults array
            },
          },
          search_option_details,

          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              employee_monthly_report: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
              },
              incentive_modules_data: {
                $arrayElemAt: ["$incentive_modules_data", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              emp_id: 1,
              corporate_id: 1,
              "employee_details.template_data.incentive_temp_data": 1,
              emp_data: "$employee_monthly_report.emp_data",
              bank_details: { $ifNull: ["$employee_details.bank_details", {}] },
              UAN_no: {
                $ifNull: [
                  "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
                  null,
                ],
              },
              //"incentive_modules":{ $ifNull: ["$incentive_modules_data", null ] },
              incentive_report: {
                $ifNull: ["$employee_monthly_report.incentive_report", {}],
              },
              incentive_modules_data: 1,
              incentive_module: {
                // 'calculated_incentive_value': "$incentive_modules_data.calculated_incentive_value",
                // 'total_incentive_value': "$incentive_modules_data.total_incentive_value",
                accumulated_value:
                  "$incentive_modules_data.total_incentive_value",
                setteled_value: {
                  $add: [
                    "$incentive_modules_data.calculated_advance_value",
                    {
                      $cond: {
                        if: {
                          $and: [
                            {
                              $ne: [
                                {
                                  $ifNull: ["$employee_monthly_report", null],
                                },
                                null,
                              ],
                            },
                            {
                              $ne: [
                                {
                                  $ifNull: [
                                    "$employee_monthly_report.incentive_report",
                                    null,
                                  ],
                                },
                                null,
                              ],
                            },
                            {
                              $ne: [
                                "$employee_monthly_report.incentive_report.bank_ins_referance_id",
                                "",
                              ],
                            },
                          ],
                        },
                        then: "$employee_monthly_report.incentive_report.gross_earning",
                        else: 0,
                      },
                    },
                  ],
                },
                // 'setteled_value': { '$add': ["$incentive_modules_data.calculated_advance_value", "$incentive_modules_data.calculated_incentive_value"] },
                // 'balance_value': { '$subtract': ["$incentive_modules_data.total_incentive_value", { '$add': ["$incentive_modules_data.calculated_advance_value", "$incentive_modules_data.calculated_incentive_value"] }] },
              },
            },
          },
        ]);

        if (req.body.row_checked_all) {
          if (req.body.export_csv == "true") {
            //Site_helper.generate_export_file('incentive',);
          } else {
            myAggregate.then(async (emps) => {
              return resp.status(200).send({
                status: "success",
                message: "",
                master_data: { docs: emps },
              });
            });
          }
        } else {
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
  get_incentive_sheet_data: async function (req, resp) {
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
        //console.log(query_data);
        search_option_details.$match["employee_monthly_reports.wage_month"] =
          wage_month;
        search_option_details.$match["employee_monthly_reports.wage_year"] =
          wage_year;
        search_option_details.$match[
          "employee_monthly_reports.incentive_report"
        ] = { $exists: true, $ne: null };
        if (req.body.row_checked_all) {
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
              from: "employee_monthly_reports",
              localField: "_id",
              foreignField: "emp_db_id",
              as: "employee_monthly_reports",
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
              emp_first_name: 1,
              emp_last_name: 1,
              emp_id: 1,
              "employee_details.template_data.incentive_temp_data": 1,
              emp_data: "$employee_monthly_reports.emp_data",
              UAN_no: {
                $ifNull: [
                  "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
                  null,
                ],
              },
              incentive_report: {
                $ifNull: ["$employee_monthly_reports.incentive_report", {}],
              },
              corporate_id: 1,
              bank_details: { $ifNull: ["$employee_details.bank_details", {}] },
            },
          },
        ]);
        if (req.body.row_checked_all) {
          if (req.body.export_csv == "true") {
            //Site_helper.generate_export_file('incentive',);
          } else {
            myAggregate.then(async (emps) => {
              return resp.status(200).send({
                status: "success",
                message: "",
                master_data: { docs: emps },
              });
            });
          }
        } else {
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
  import_incentive_data: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        incentive_month: "required",
        incentive_year: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var incentive_month = req.body.incentive_month;
        var incentive_year = req.body.incentive_year;
        var results = [];
        var incentive_data = [];
        fs.createReadStream(req.files[0].path)
          .pipe(csv())
          .on("data", async function (row) {
            var emp_id = row["emp_id"];
            await EmployeeDetails.findOne(
              { employee_id: employee._id },
              "template_data.incentive_temp_data",
              async function (err, empdata) {
                if (empdata.template_data.incentive_temp_data)
                  var incentive_temp_data = empdata.template_data
                    .incentive_temp_data
                    ? empdata.template_data.incentive_temp_data
                    : null;

                var incentive_value = parseFloat(row["incentive_value"]);
                var incentive_wages = incentive_value;
                var incentive_amount = 0;
                var min_hold = parseFloat(incentive_temp_data.min_hold);
                var max_hold = parseFloat(incentive_temp_data.max_hold);
                // var min_hold=25;
                // var max_hold=50;
                var advance_amount = 0;
                var genarete_advance_amount = 0;
                if (incentive_temp_data.settlement_frequency == "monthly") {
                  var incentive_amount = incentive_wages;
                } else {
                  if (min_hold > incentive_wages) {
                    incentive_amount = incentive_wages;
                  } else {
                    incentive_wages = incentive_wages - min_hold;
                    var min_h = (incentive_wages - min_hold) % min_hold;
                    var max_h = (incentive_wages - max_hold) % max_hold;
                    var hold_incentive_amount =
                      max_hold > incentive_wages ? min_h : max_h;
                    var advance_amount =
                      incentive_wages - hold_incentive_amount;
                    incentive_amount = hold_incentive_amount;
                    genarete_advance_amount =
                      await Site_helper.calculate_incentive_advance(
                        emp_id.trim(),
                        incentive_temp_data,
                        req.companyData,
                        incentive_month,
                        incentive_year,
                        advance_amount
                      );
                    incentive_amount =
                      genarete_advance_amount == 0
                        ? incentive_amount + advance_amount
                        : incentive_amount;
                  }
                }
                var document = {
                  corporate_id: req.authData.corporate_id,
                  emp_id: mongoose.Types.ObjectId(employee._id),
                  incentive_value: incentive_value,
                  auto_disburse: row["auto_disburse"],
                  status: "active",
                  advance_value: incentive_amount,
                  genarete_advance_value: genarete_advance_amount,
                  incentive_g_month: incentive_month,
                  incentive_g_year: incentive_year,
                  updated_at: Date.now(),
                };
                //console.log(document);
                incentive_data.push(document);               
                await IncentiveModule.findOneAndUpdate(
                  {
                    emp_id: employee._id,
                    incentive_g_month: +incentive_month,
                    incentive_g_year: +incentive_year,
                  },
                  document,
                  { upsert: true, new: true, setDefaultsOnInsert: true },
                  function (err, incentivemodule) {
                    if (err)
                      return resp
                        .status(200)
                        .send({ status: "error", message: err.message });
                  }
                );
              }
            );
          })
          .on("end", async function () {
            //console.log('asd')
            var failed_entry = [];
            return resp.status(200).send({
              status: "success",
              message: "Import successfully",
              failed_entry: incentive_data,
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
};
function getMonthDifference(startDate, endDate) {
  return (
    endDate.getUTCMonth() -
    startDate.getUTCMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
  );
}
