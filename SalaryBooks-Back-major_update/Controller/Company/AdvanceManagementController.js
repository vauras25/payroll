var EmployeeAdvance = require("../../Model/Company/EmployeeAdvance");
const EmployeeMonthlyReport = require("../../Model/Company/EmployeeMonthlyReport");
var EmployeeSheetTemplate = require("../../Model/Company/EmployeeSheetTemplate");
var Employee = require("../../Model/Company/employee");
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require("node-input-validator");
const mongoose = require("mongoose");
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const moment = require('moment');
const EmailHelper = require('../../Helpers/EmailHelper');
const Company = require("../../Model/Admin/Company");

module.exports = {
  add_advance_data: async function (req, resp) {
    const v = new Validator(req.body, {
      emp_id: "required",
      recovery_from: "required",
      advance_amount: "required",
      no_of_instalments: "required",
      recovery_frequency: "required",
      payment_start_month: "required",
      payment_start_year: "required",
      payment_booking_date: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      var document = {
        corporate_id: req.authData.corporate_id,
        emp_id: req.body.emp_id,
        recovery_from: req.body.recovery_from,
        advance_amount: req.body.advance_amount,
        advance_outstanding: req.body.advance_amount,
        no_of_instalments: req.body.no_of_instalments,
        recovery_frequency: req.body.recovery_frequency,
        payment_start_month: req.body.payment_start_month,
        payment_start_year: req.body.payment_start_year,
        payment_booking_date: req.body.payment_booking_date,
        remaining_amount: req.body.advance_amount,
        remarks: req.body.remarks,
        instalment_history: JSON.parse(req.body.instalment_history),
        status: "active",
        created_at: Date.now(),
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
  },
  update_advance_data: async function (req, resp, next) {
    const v = new Validator(req.body, {
      recovery_from: "required",
      no_of_instalments: "required",
      recovery_frequency: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      var document = {
        recovery_from: req.body.recovery_from,
        no_of_instalments: req.body.no_of_instalments,
        recovery_frequency: req.body.recovery_frequency,
        remarks: req.body.remarks,
        advance_outstanding: req.body.advance_outstanding,
        remaining_amount: req.body.advance_outstanding,
        instalment_history: JSON.parse(req.body.instalment_history),
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
        if (req.body.status) {
          filter_option = {
            $and: [
              { corporate_id: req.authData.corporate_id },
              // {$or:[
              //         {"status":{$regex: ".*" + req.body.status + ".*"}},
              //     ]}
            ],
          };
        }
        var search_option_details = { $match: {} };
        if (req.body.searchkey) {
          filter_option = {
              $or: [
                { emp_id: { $regex: req.body.searchkey, $options: "i" } },
              ],
              corporate_id: req.authData.corporate_id,
          };
        } else {
          var query_data = await Site_helper.getEmpFilterData(
            req,
            filter_option,
            search_option_details
          );
          search_option_details = query_data.search_option_details;
          filter_option = query_data.filter_option;
        }
        EmployeeAdvance.paginate(
          filter_option,
          options,
          async function (err, advance_data) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            if (advance_data.docs) {
              if (advance_data.docs.length > 0) {
                for (var i = 0; i < advance_data.docs.length; i++) {
                  var EmployeeData = await Employee.findOne({
                    emp_id: advance_data.docs[i].emp_id,
                  }).select("_id emp_first_name emp_last_name emp_id");
                  if (EmployeeData) {
                    advance_data.docs[i].emp_data = EmployeeData;
                    // advance_data.docs[i].emp_data = advance_data.docs[i].emp_id.replace(/\n/g,'').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','').replace(' ','');
                  }
                }
              }
            }
            return resp
              .status(200)
              .json({ status: "success", advance_data: advance_data });
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
  export_advance_sample_file: async function (req, resp, next) {
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet("Sheet 1");
    var ws2 = wb.addWorksheet("employee");
    ws.cell(1, 1).string("emp_id");
    ws.cell(1, 2).string("advance_amount");
    ws.cell(1, 3).string("recovery_from");
    ws.cell(1, 4).string("remarks");
    ws.cell(1, 5).string("no_of_instalment");
    ws.cell(1, 6).string("recovery_frequency");
    ws.cell(1, 7).string("payment_start_month");
    ws.cell(1, 8).string("payment_start_year");
    ws.cell(1, 9).string("booking_date");

    ws.cell(2, 2).string("200");
    ws.cell(2, 4).string("demo remarks");
    ws.cell(2, 5).string("10");
    ws.cell(2, 7).string("mm");
    ws.cell(2, 8).string("yyyy");
    ws.cell(2, 9).string("yyyy-mm-dd");
    var employees = [];
    await Employee.find(
      {
        status: "active",
        corporate_id: req.authData.corporate_id,
        approval_status: "approved",
      },
      "_id emp_first_name emp_last_name emp_id",
      function (err, employees) {
        if (!err) {
          var row_id = 1;
          employees.map(function (el) {
            var emp_name =
              el.emp_first_name + " " + el.emp_last_name + " [" + el._id + "]";
            ws2.cell(row_id++, 1).string(emp_name.toString());
          });
          ws.addDataValidation({
            type: "list",
            allowBlank: false,
            prompt: "Choose Employee",
            error: "Invalid choice was chosen",
            showDropDown: true,
            sqref: "A2:A2",
            formulas: ["=employee!$A$2:$A$" + employees.length],
          });
        }
      }
    );
    ws.addDataValidation({
      type: "list",
      allowBlank: false,
      prompt: "Choose Recovery From",
      error: "Invalid choice was chosen",
      showDropDown: true,
      sqref: "C2:C2",
      formulas: ["incentive,bonus,gross_earning,annual_earning"],
    });
    ws.addDataValidation({
      type: "list",
      allowBlank: false,
      prompt: "Choose Recovery Frequency",
      error: "Invalid choice was chosen",
      showDropDown: true,
      sqref: "F2:F2",
      formulas: ["monthly,quaterly,halfyearly,annually"],
    });

    let file = await Site_helper.createFiles(wb, 'advance-sample.xlsx', req.authData.corporate_id, 'temp_files/advance-module');
    await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);

    // wb.write("advance-sample.xlsx");
    // await Promise.all(Site_helper.createFiles(
    //   wb,
    //   "advance-sample.xlsx",
    //   req.authData.corporate_id
    // )).then(async function(f){
    //     // file_name = "advance-sample.xlsx";
    //     // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
    //     await Site_helper.downloadAndDelete(f.file_name,file_path,req.authData.corporate_id,resp);
    // });
    
    
    // return resp.status(200).json({
    //   status: "success",
    //   message: "Xlsx created successfully",
    //   // url:file_location
    // });
  },
  import_advance_data: async function (req, resp, next) {
    try {
      var results = [];
      fs.createReadStream(req.files[0].path)
        .pipe(csv())
        .on("data", async function (row) {
          var no_of_inst = row["no_of_instalment"];
          var recovery_from = row["recovery_from"];
          var advance_amount = row["advance_amount"];
          var recovery_frequency = row["recovery_frequency"];
          var payment_start_year = row["payment_start_year"];
          var payment_start_month = row["payment_start_month"];
          var s_date = new Date(
            payment_start_year + "-" + payment_start_month + "-15"
          );
          switch (recovery_frequency) {
            case "monthly":
              var frequ_month = 1;
              break;
            case "quaterly":
              var frequ_month = 3;
              break;
            case "halfyearly":
              var frequ_month = 6;
              break;
            case "annually":
              var frequ_month = 12;
              break;
          }
          var emi_amount = row["advance_amount"] / no_of_inst;
          var instalment_history = [];
          for (let index = 0; index < no_of_inst; index++) {
            instalment_history.push({
              instalment_month: s_date.getUTCMonth(),
              instalment_year: s_date.getUTCFullYear(),
              recovery_from: recovery_from,
              advance_amount: emi_amount,
              status: "pending",
            });
            s_date.setMonth(s_date.getUTCMonth() + frequ_month);
          }
          var document = {
            corporate_id: req.authData.corporate_id,
            emp_id: row["emp_id"],
            recovery_from: recovery_from,
            advance_amount: advance_amount,
            advance_outstanding: advance_amount,
            no_of_instalments: no_of_inst,
            recovery_frequency: recovery_frequency,
            payment_start_month: payment_start_month - 1,
            payment_start_year: payment_start_year,
            payment_booking_date: row["booking_date"],
            remarks: row["remarks"],
            instalment_history: instalment_history,
            status: "active",
            created_at: Date.now(),
          };
          await EmployeeAdvance.create(document);
        })
        .on("end", async function () {
          var failed_entry = [];
          return resp.status(200).send({
            status: "success",
            message: "Import successfully",
            failed_entry: results,
          });
        });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  advance_employee_list: async function (req, resp, next) {
    try {
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
        var wage_month = req.body.attendance_month;
        var wage_year = req.body.attendance_year;
        var start_wage_date = moment({year:wage_year, month:wage_month, day:1}).startOf('month').format('yyyy-MM-DD')
        var end_wage_date = moment({year:wage_year, month:wage_month, day:1}).endOf('month').format('yyyy-MM-DD')
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
        search_option_details.$match["employee_advances.status"] = {
          $eq: "active",
        };
        search_option_details.$match = {
          $and: [
            {
              "employee_advances.payment_booking_date": {
                $gte: start_wage_date
              },
            },
            {
              "employee_advances.payment_booking_date": {
                $lte: end_wage_date
              },
            },
          ],
        };
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
          {
            $lookup:{
              from: "employee_advances",
              let: { emp_idVar: "$emp_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_id", "$$emp_idVar"] } },
                      // $and: [
                        {
                          "payment_booking_date": {
                            $gte: start_wage_date
                          },
                        },
                        {
                          "payment_booking_date": {
                            $lte: end_wage_date
                          },
                        },
                      // ],
                    ],
                  },
                },
              ],
              as: "employee_advances",
            },
          },
          // {
          //   $lookup: {
          //     from: "employee_advances",
          //     localField: "emp_id",
          //     foreignField: "emp_id",
          //     as: "employee_advances",
          //   },
          // },
          search_option_details,
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
            },
          },
          {
            $addFields: {
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
              "employee_details.template_data.attendance_temp_data": 1,
              "employee_details.template_data.overtime_temp_data": 1,
              "branch.branch_name": 1,
              "branch._id": 1,
              department: 1,
              client: 1,
              employee_advances: 1,
              advance_amount: { $sum: "$employee_advances.advance_amount" },
              advance_outstanding: { $sum: "$employee_advances.advance_outstanding" },
              employee_monthly_reports: {
                bonus_report: {
                  $ifNull: [
                    "$employee_monthly_reports.bonus_report.gross_earning",
                    "BMNC",
                  ],
                },
                salary_report: {
                  $ifNull: [
                    "$employee_monthly_reports.salary_report.gross_earning",
                    "SMNC",
                  ],
                },
                incentive_report: {
                  $ifNull: [
                    "$employee_monthly_reports.incentive_report.gross_earning",
                    "IMNC",
                  ],
                },
                bank_ins_referance_id:
                  "$employee_monthly_reports.advance_report.bank_ins_referance_id",
                pf_challan_referance_id:
                  "$employee_monthly_reports.advance_report.pf_challan_referance_id",
                esic_challan_referance_id:
                  "$employee_monthly_reports.advance_report.esic_challan_referance_id",
              },
            },
          },
        ]);
        // .then(async (emps) => {
        //   return resp.status(200).json({ status: "success", employees: emps });
        // })
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
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  generate_advance_sheet: async function (req, resp, next) {
    const v = new Validator(req.body, {
      attendance_month: "required",
      attendance_year: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      var wage_month = req.body.attendance_month;
      var wage_year = req.body.attendance_year;
      var start_wage_date = moment({year:wage_year, month:wage_month, day:1}).startOf('month').format('yyyy-MM-DD')
      var end_wage_date = moment({year:wage_year, month:wage_month, day:1}).endOf('month').format('yyyy-MM-DD')
      // var start_wage_date = moment(wage_year wage_month, 1 )
      // var end_wage_date = moment(wage_year, wage_month+1, 0 )
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

      search_option_details.$match = {
        $and: [
          {
            "employee_advances.payment_booking_date": {
              $gte: start_wage_date
            },
          },
          {
            "employee_advances.payment_booking_date": {
              $lte: end_wage_date
            },
          },
        ],
      };

      // search_option_details.$match['employee_advances.payment_start_month']=  {$lte: wage_month.toString()  };
      // search_option_details.$match['employee_advances.payment_start_year']=  {$lte: wage_year.toString()  };
      // search_option_details.$match = {
      //   $or: [
      //     {
      //       "employee_advances.payment_start_year": {
      //         $lt: wage_year.toString(),
      //       },
      //     },
      //     {
      //       $and: [
      //         {
      //           "employee_advances.payment_start_year": {
      //             $lte: wage_year.toString(),
      //           },
      //         },
      //         {
      //           "employee_advances.payment_start_month": {
      //             $lte: wage_month.toString(),
      //           },
      //         },
      //       ],
      //     },
      //   ],
      // };
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
            from: "employee_details",
            localField: "_id",
            foreignField: "employee_id",
            as: "employee_details",
          },
        },
        // {
        //   $lookup: {
        //     from: "employee_monthly_reports",
        //     localField: "_id",
        //     foreignField: "emp_db_id",
        //     as: "employee_monthly_reports",
        //   },
        // },
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
        // {
        //   $lookup: {
        //     from: "employee_advances",
        //     localField: "emp_id",
        //     foreignField: "emp_id",
        //     as: "employee_advances",
        //   },
        // },
        {
          $lookup:{
            from: "employee_advances",
            let: { emp_idVar: "$emp_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$emp_id", "$$emp_idVar"] } },
                    // $and: [
                      {
                        "payment_booking_date": {
                          $gte: start_wage_date
                        },
                      },
                      {
                        "payment_booking_date": {
                          $lte: end_wage_date
                        },
                      },
                    // ],
                  ],
                },
              },
            ],
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
            incentive_modules: 1,
            age: {
              $divide: [
                { $subtract: [new Date(), "$emp_dob"] },
                365 * 24 * 60 * 60 * 1000,
              ],
            },
            "hod.first_name": 1,
            "hod.last_name": 1,
            "hod.userid": 1,
            "hod._id": 1,
            hold_salary_emps: 1,
            "employee_monthly_reports":1,
            // employee_monthly_reports: {
            //   bonus_report: {
            //     $ifNull: [
            //       "$employee_monthly_reports.bonus_report.gross_earning",
            //       0,
            //     ],
            //   },
            //   salary_report: {
            //     $ifNull: [
            //       "$employee_monthly_reports.salary_report.gross_earning",
            //       0,
            //     ],
            //   },
            //   incentive_report: {
            //     $ifNull: [
            //       "$employee_monthly_reports.incentive_report.gross_earning",
            //       0,
            //     ],
            //   },
            //   bank_ins_referance_id:
            //   "$employee_monthly_reports.advance_report.bank_ins_referance_id",
            //   // pf_challan_referance_id:
            //   //   "$employee_monthly_reports.advance_report.pf_challan_referance_id",
            //   // esic_challan_referance_id:
            //   //   "$employee_monthly_reports.advance_report.esic_challan_referance_id",
            // },
            employee_advances: 1,
            advance_amount: { $sum: "$employee_advances.advance_amount" },
          },
        },
      ]).then(async (emps) => {
        // var dateObj = new Date();
        // var epfo_temp=await Site_helper.get_gov_epfo_data(req);
        // var esic_temp=await Site_helper.get_gov_esic_data(req);
        await Promise.all(
          emps.map(async (empdata) => {
            var employee_advances = empdata.employee_advances;
            var employee_monthly_reports = empdata.employee_monthly_reports;

            //console.log(empdata)
            if (empdata.employee_details) {
              if (empdata.employee_advances.length > 0) {
                // var advance_opening_balance = 0;
                // var advance_recovered = 0;
                // var new_advance = 0;
                // var closing_advance = 0;
                // var advance_start = 0;
                
                // var available_incentive_val =
                //   empdata.employee_monthly_reports.incentive_report;

                // var available_salary_val =
                //   empdata.employee_monthly_reports.salary_report;

                // var available_bonus_val =
                //   empdata.employee_monthly_reports.bonus_report;

                // var advance_install_arr = [];
                // await Promise.all(
                //   employee_advances.map(async (advance_data, keyval) => {
                //     var instalment_history = advance_data.instalment_history;
                //     var recovered_advance_data = 0;
                //     var full_pending = 0;
                //     var partial_pending = 0;
                //     if (
                //       advance_data.payment_start_month ==
                //         wage_month.toString() &&
                //       advance_data.payment_start_year == wage_year.toString()
                //     ) {
                //       further_advance = parseFloat(advance_data.advance_amount);
                //       new_advance =
                //         parseFloat(new_advance) +
                //         parseFloat(advance_data.advance_amount);
                //     } else {
                //       advance_start =
                //         advance_start +
                //         parseFloat(advance_data.advance_outstanding);
                //     }
                //     // await Promise.all(
                //     //   instalment_history.map(async (el, keyval) => {
                //     //     //instalment_history.map(async function(el) {
                //     //     if (
                //     //       el.instalment_month == wage_month.toString() &&
                //     //       el.instalment_year == wage_year.toString()
                //     //     ) {
                //     //       recovery_status = "yes";
                //     //       if (el.recovery_from == "incentive") {
                //     //         if (available_incentive_val > 0) {
                //     //           if (
                //     //             el.advance_amount <= available_incentive_val
                //     //           ) {
                //     //             recovered_advance_data =
                //     //               parseFloat(recovered_advance_data) +
                //     //               parseFloat(el.advance_amount);
                //     //             available_incentive_val =
                //     //               available_incentive_val -
                //     //               parseFloat(el.advance_amount);
                //     //           } else {
                //     //             partial_pending =
                //     //               parseFloat(el.advance_amount) -
                //     //               parseFloat(available_incentive_val);
                //     //             recovered_advance_data =
                //     //               parseFloat(recovered_advance_data) +
                //     //               parseFloat(available_incentive_val);
                //     //             available_incentive_val = 0;
                //     //           }
                //     //         } else {
                //     //           full_pending = parseFloat(el.advance_amount);
                //     //         }
                //     //       } else if (el.recovery_from == "bonus") {
                //     //         if (available_bonus_val > 0) {
                //     //           if (el.advance_amount <= available_bonus_val) {
                //     //             recovered_advance_data =
                //     //               parseFloat(recovered_advance_data) +
                //     //               parseFloat(el.advance_amount);
                //     //             available_bonus_val =
                //     //               available_bonus_val -
                //     //               parseFloat(el.advance_amount);
                //     //           } else {
                //     //             partial_pending =
                //     //               parseFloat(el.advance_amount) -
                //     //               parseFloat(available_bonus_val);
                //     //             recovered_advance_data =
                //     //               parseFloat(recovered_advance_data) +
                //     //               parseFloat(available_bonus_val);
                //     //             available_bonus_val = 0;
                //     //           }
                //     //         } else {
                //     //           full_pending = parseFloat(el.advance_amount);
                //     //         }
                //     //       } else if (el.recovery_from == "gross_earning") {
                //     //         if (available_salary_val > 0) {
                //     //           if (el.advance_amount <= available_salary_val) {
                //     //             recovered_advance_data =
                //     //               parseFloat(recovered_advance_data) +
                //     //               parseFloat(el.advance_amount);
                //     //             available_salary_val =
                //     //               available_salary_val -
                //     //               parseFloat(el.advance_amount);
                //     //           } else {
                //     //             partial_pending =
                //     //               parseFloat(el.advance_amount) -
                //     //               parseFloat(available_salary_val);
                //     //             recovered_advance_data =
                //     //               parseFloat(recovered_advance_data) +
                //     //               parseFloat(available_salary_val);
                //     //             available_salary_val = 0;
                //     //           }
                //     //         } else {
                //     //           full_pending = parseFloat(el.advance_amount);
                //     //         }
                //     //       }
                //     //       employee_advances_ins_data = {
                //     //         advance_id: advance_data._id,
                //     //         instalment_id: el._id,
                //     //         emp_id: advance_data.emp_id,
                //     //         recovery_from: el.recovery_from,
                //     //         wage_month: el.instalment_month,
                //     //         wage_year: el.instalment_year,
                //     //         partial_pending: partial_pending,
                //     //         full_pending: full_pending,
                //     //         pending_amount:
                //     //           full_pending > 0 ? full_pending : partial_pending,
                //     //         recovered_advance_data: recovered_advance_data,
                //     //       };
                //     //       advance_install_arr.push(employee_advances_ins_data);
                //     //       advance_recovered =
                //     //         advance_recovered + recovered_advance_data;
                //     //     }
                //     //   })
                //     // );

                //     // employee_advances_data=
                //     //   {
                //     //     'advance_id':advance_adjust._id,
                //     //     'partial_pending':partial_pending,
                //     //     'full_pending':full_pending,
                //     //     'recovered_advance_data':recovered_advance_data,
                //     //     'advance_start':advance_start,
                //     //     'further_advance':further_advance,
                //     //     'closing_advance': ((parseFloat(advance_start) + parseFloat(further_advance)) - parseFloat(recovered_advance_data))
                //     //   };
                //     //console.log('aaa'+instal_data);
                //   })
                // );
                // closing_advance =
                //   parseFloat(advance_start) +
                //   parseFloat(new_advance) -
                //   parseFloat(advance_recovered);
                var advance_report_data = {
                  gross_earning:empdata.advance_amount,
                  // opening_balance: advance_start,
                  // advance_recovered: advance_recovered,
                  // new_advance: new_advance,
                  // closing_balance: closing_advance,
                  // opening_balance: advance_start,
                  // advance_recovery_log: advance_install_arr,
                  bank_ins_referance_id: "",
                  // pf_challan_referance_id: "",
                  // esic_challan_referance_id: "",
                };
                var emp_data = {
                  _id: empdata._id,
                  emp_id: empdata.emp_id,
                  emp_first_name: empdata.emp_first_name,
                  emp_last_name: empdata.emp_last_name,
                  emp_emp_dob: empdata.emp_dob,
                  emp_pan_no: empdata.pan_no,
                  emp_aadhar_no: empdata.aadhar_no,
                  emp_email_id: empdata.email_id,
                  new_pf_no: empdata.employee_details.employment_details
                    ? empdata.employee_details.employment_details.new_pf_no
                    : "NA",
                  esic_no: empdata.employee_details.employment_details
                    ? empdata.employee_details.employment_details.esic_no
                    : "NA",
                  date_of_join:
                    empdata.employee_details.employment_hr_details.date_of_join,
                  sex: empdata.sex,
                  age: empdata.age,
                  EPF: empdata.employee_details.employment_hr_details
                    .pf_applicable,
                  EPS: empdata.employee_details.employment_hr_details
                    .pension_applicable,
                  Restrict_PF:
                    empdata.employee_details.template_data.salary_temp_data
                      .restricted_pf,
                  Reg_Type:
                    empdata.employee_details.template_data.attendance_temp_data
                      .register_type,
                  emp_uan_no: empdata.employee_details.pf_esic_details
                    ? empdata.employee_details.pf_esic_details
                        .curr_er_epfo_details?.uan_no
                    : "NA",
                  hod: empdata.hod
                    ? empdata.hod.first_name + " " + empdata.hod.last_name
                    : "",
                  branch: empdata.branch,
                  designation: empdata.designation,
                  department: empdata.department,
                  client: empdata.client,
                };

                if(employee_monthly_reports && employee_monthly_reports.total_data)
                {
                  // pre_total_pt = (pre_salary_data.total_data.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);
                  if(employee_monthly_reports.advance_report)
                  {
                    // pre_module_pt = (pre_salary_data.bonus_report.pt_amount?pre_salary_data.bonus_report.pt_amount:0);
                    var total_earning_data={ 
                      'total_earning': (advance_report_data.gross_earning + (  employee_monthly_reports.total_data.total_earning - employee_monthly_reports.advance_report.gross_earning)),
                      'total_ctc': (advance_report_data.gross_earning + (  employee_monthly_reports.total_data.total_ctc - employee_monthly_reports.advance_report.gross_earning)),
                      'total_pf_bucket':employee_monthly_reports.total_data.total_pf_bucket ?? 0,
                      'total_pf_wages':employee_monthly_reports.total_data.total_pf_wages ?? 0,
                      'total_esic_bucket':employee_monthly_reports.total_data.total_esic_bucket ?? 0,
                      'total_esic_wages':employee_monthly_reports.total_data.total_esic_wages ?? 0,
                      'total_tds_wages':employee_monthly_reports.total_data.total_tds_wages ?? 0,
                      'total_pt_wages':employee_monthly_reports.total_data.total_pt_wages ?? 0,
                      'pf_challan_referance_id':employee_monthly_reports.total_data.pf_challan_referance_id == '' ? '' :  employee_monthly_reports.total_data.pf_challan_referance_id,
                      'esic_challan_referance_id':employee_monthly_reports.total_data.esic_challan_referance_id == '' ? '' :  employee_monthly_reports.total_data.esic_challan_referance_id,
                      'bank_ins_referance_id':employee_monthly_reports.total_data.bank_ins_referance_id == '' ? '' :  employee_monthly_reports.total_data.bank_ins_referance_id,
                    };
                  }
                  else
                  {
                    var total_earning_data={ 
                      'total_earning':  (advance_report_data.gross_earning + employee_monthly_reports.total_data.total_earning),
                      'total_ctc': (advance_report_data.gross_earning +   employee_monthly_reports.total_data.total_ctc),
                      'total_pf_bucket':employee_monthly_reports.total_data.total_pf_bucket ?? 0,
                      'total_pf_wages': employee_monthly_reports.total_data.total_pf_wages ?? 0,
                      'total_esic_bucket': employee_monthly_reports.total_data.total_esic_bucket ?? 0,
                      'total_esic_wages': employee_monthly_reports.total_data.total_esic_wages ?? 0,
                      'total_tds_wages': employee_monthly_reports.total_data.total_tds_wages ?? 0,
                      'total_pt_wages': employee_monthly_reports.total_data.total_pt_wages ?? 0,
                      'bank_ins_referance_id': '' ,
                    };
                  } 
                }
                else
                {
                  var total_earning_data={ 
                    'total_earning':  advance_report_data.advance_amount,
                    'total_ctc': advance_report_data.advance_amount,
                    'bank_ins_referance_id': '' ,
                  };
                }

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
                  wage_month: wage_month,empdata,
                  wage_year: wage_year,
                  advance_report: advance_report_data,
                  total_data:total_earning_data,
                  emp_data: emp_data,
                  status: "active",
                };
                
                await EmployeeMonthlyReport.findOneAndUpdate(
                  where_condition,
                  insert_data,
                  { upsert: true, new: true, setDefaultsOnInsert: true }
                );
              }
            }
          })
        ).then((value) => {
          return resp.status(200).send({
            status: "success",
            message: "Advance recovered successfully.",
          });
        });
      });
    }
  },
  get_advance_sheet_data: async function (req, resp) {
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
        search_option_details.$match["employee_monthly_reports.wage_month"] =
          wage_month.toString();
        search_option_details.$match["employee_monthly_reports.wage_year"] =
          wage_year.toString();
        search_option_details.$match[
          "employee_monthly_reports.advance_report"
        ] = { $exists: true, $ne: null };
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
              advance_report: {
                $ifNull: ["$employee_monthly_reports.advance_report", {}],
              },
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
  approve_advance_data: async function (req, resp) {
    let data = {};
    try {
      const v = new Validator(req.body, {
        // advance_id: "required",
        // emp_id: "required",
        // status: "required|in:approved,rejected"
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }
      var employeeData = await Employee.findOne({
        emp_id: { $eq: req.body.emp_id },
        corporate_id: { $eq: req.authData.corporate_id },
      });
      // var companyData = await Employee.findById(req.authData.company_id);
      if (!employeeData) {
        return resp
          .status(200)
          .json({ status: "error", message: "User not found.", data: data });
      }

      // if(req.body.status == "approved"){
      //   var status = "active";
      // }
      // else{
      //   var status = req.body.status;
      // }
      var sortbyfield = req.body.sortbyfield;
      if (sortbyfield) {
        var sortoption = {};
        sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
      } else {
        var sortoption = { created_at: -1 };
      }
      const options = {
        page: req.body.pageno ? req.body.pageno : 1,
        limit: req.body.perpage ? req.body.perpage : 200,
        sort: sortoption,
      };
      var search_option = {
        $match: { $and: [{ corporate_id: req.authData.corporate_id }] },
      };

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

      EmployeeAdvance.aggregate([
        search_option,
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
            from: "employees",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "employees",
          },
        },
        {
          $lookup: {
            from: "employee_details",
            localField: "employee_id",
            foreignField: "employee_id",
            as: "employee_details",
          },
        },
        {
          $addFields: {
            company: {
              $arrayElemAt: ["$companies", 0],
            },
            employees: {
              $arrayElemAt: ["$employees", 0],
            },
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
          },
        },
      ]).then(async (advance_data) => {
        // if (advance_data) {
        if (advance_data.length > 0) {
          var responseArray = await Promise.all(
            advance_data.map(function (advance) {
              if (advance) {
                var status = "pending";
                if (req.body.status) {
                  if (req.body.status == "approved") {
                    status = "active";
                  } else {
                    status = "rejected";
                  }
                }
                var document = {
                  company_remarks: req.body.remark,
                  status: status,
                };
                EmployeeAdvance.updateOne(
                  { _id: advance._id },
                  { $set: document },
                  async function (err, ad) {
                    if (advance.employees && advance.employees.email_id) {
                      EmailHelper.employee_request_approval(
                        null,
                        advance.employees.email_id,
                        null,
                        {
                          first_name: advance.employees.emp_first_name,
                          last_name: advance.employees.emp_last_name,
                          approved_by:
                            req.authData.first_name +
                            " " +
                            req.authData.last_name,
                          request_type: "Advance",
                          request_status: req.body.status,
                          company_name: advance.company.establishment_name,
                        }
                      );
                    }
                    return ad;
                  }
                );
              }
            })
          );
        }
        // }
      });
      return resp.status(200).json({
        status: "success",
        message: "Employee advance approved successfully",
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_advance_listing: async function (req, resp, next) {
    const v = new Validator(req.body, {
      wage_month_from: "required",
      wage_month_to: "required",
      wage_year_from: "required",
      wage_year_to: "required",
      pageno: "required",
      list_type: "required",
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
        var wage_month_from = +req.body.wage_month_from;
        var wage_month_to = +req.body.wage_month_to;
        var wage_year_from = +req.body.wage_year_from;
        var wage_year_to = +req.body.wage_year_to;
        var monthly_report_lookup;
        var start_wage_date = moment({year:wage_year_from, month:wage_month_from, day:1}).startOf('month').format('yyyy-MM-DD')
        var end_wage_date = moment({year:wage_year_to, month:wage_month_to, day:1}).endOf('month').format('yyyy-MM-DD')

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
          search_option_details.$match["employee_monthly_reports.advance_report"] = {$exists:true, $ne: null };
          // search_option_details.$match['employee_monthly_reports.wage_month']= wage_month;
          // search_option_details.$match['employee_monthly_reports.wage_year']=  wage_year;
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
          var employee_advances_lookup = {
            $lookup: {
              from: "employee_advances",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "employee_advances",
            },
          };
        } else {
          var monthly_report_lookup = {
            from: "employee_monthly_reports",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "employee_monthly_reports",
          };
          search_option_details.$match["employee_advances"] = {$exists:true, $ne: [] };
          var employee_advances_lookup = {
            $lookup:{
              from: "employee_advances",
              let: { emp_idVar: "$emp_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_id", "$$emp_idVar"] } },
                      // $and: [
                        {
                          "payment_booking_date": {
                            $gte: start_wage_date
                          },
                        },
                        {
                          "payment_booking_date": {
                            $lte: end_wage_date
                          },
                        },
                      // ],
                    ],
                  },
                },
              ],
              as: "employee_advances",
            },
          };
        }

        if (req.body.list_type == "report_view") {
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

        // var booking_date_from = new Date(
        //   `${wage_year_from}-0${wage_month_from + 1}-01`
        // );
        // var booking_date_to = new Date(
        //   `${wage_year_to}-0${wage_month_to + 1}-01`
        // );

        // search_option_details.$match["employee_advances.status"] = {
        //   $eq: "active",
        // };

        let myAggregate = Employee.aggregate([
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
          employee_advances_lookup,
          search_option_details,
          // search_option_details,
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
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
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
              employee_details: 1,
              bank_details: { $ifNull: ["$employee_details.bank_details", {}] },
              UAN_no: {
                $ifNull: [
                  "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
                  null,
                ],
              },
              "employee_advances":1,
              "employee_monthly_reports":1,
              advance_report: "$employee_monthly_reports.advance_report",
              advance_modules: { $ifNull: ["$employee_advances", []] },
            },
          },
        ]);
        Employee.aggregatePaginate(
          myAggregate,
          options,
          async function (err, employees) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            if (employees && employees.docs.length) {
              employees.docs = employees.docs.map((employee) => {
                let obj = {
                  ...employee,
                  advance_module: {
                    opening_balance: 0,
                    advance_recovered: 0,
                    new_advance: 0,
                    advance_amount: 0,

                    //   advance_outstanding: employee.advance_modules.reduce(
                    //     (partialSum, a) => +partialSum + +a.advance_outstanding,
                    //     0
                    //   ),

                    //   remaining_amount: employee.advance_modules.reduce(
                    //     (partialSum, a) => +partialSum + +a.remaining_amount,
                    //     0
                    //   ),

                    //   repaid_amount: employee.advance_modules.reduce(
                    //     (partialSum, a) => +partialSum + +a.repaid_amount,
                    //     0
                    //   ),
                  },
                };
                obj.advance_modules = employee.advance_modules.filter((d) => {
                  let isAdvanceExist = false;
                  // opening balance
                  let booking_date = new Date(d.payment_booking_date);
                  if (
                    booking_date.getFullYear() < wage_year_from ||
                    (booking_date.getFullYear() <= wage_year_from &&
                      booking_date.getMonth() <= wage_month_from)
                  ) {
                    obj.advance_module.opening_balance += +d.remaining_amount;
                    obj.advance_module.advance_amount += +d.advance_amount;
                    isAdvanceExist = true;
                  }

                  // outstanding balance
                  if (d.instalment_history && d.instalment_history.length) {
                    obj.instalment_history = d.instalment_history.filter(
                      (h) => {
                        if (
                          (+h.instalment_year > wage_year_from ||
                            (+h.instalment_year >= wage_year_from &&
                              +h.instalment_month >= wage_month_from)) &&
                          (+h.instalment_year < wage_year_to ||
                            (+h.instalment_year <= wage_year_to &&
                              +h.instalment_month <= wage_month_to))
                        ) {
                          if (h.status === "complete") {
                            obj.advance_module.advance_recovered +=
                              +h.advance_amount;
                            isAdvanceExist = true;
                          }
                        }
                      }
                    );

                  }

                  if (
                    (booking_date.getFullYear() > wage_year_from ||
                      (booking_date.getFullYear() >= wage_year_from &&
                        booking_date.getMonth() >= wage_month_from)) &&
                    (booking_date.getFullYear() < wage_year_to ||
                      (booking_date.getFullYear() <= wage_year_to &&
                        booking_date.getMonth() <= wage_month_to))
                  ) {
                    obj.advance_module.new_advance += +d.advance_amount;
                    // isAdvanceExist = true
                  }
                  if (isAdvanceExist) {
                    return d;
                  }
                });

                //total amount
                obj.advance_module.totol_amount =
                  obj.advance_module.opening_balance - obj.advance_module.advance_recovered;
                return obj;
              });

              return resp
                .status(200)
                .json({ status: "success", employees: employees });
            }
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
  export_advance_report_excel: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        template_id: "required",
        row_checked_all: "required",
        checked_row_ids: "required",
        unchecked_row_ids: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(403).send({
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
          var query_data = await Site_helper.getEmpFilterData(
            req,
            search_option,
            search_option_details
          );
          search_option_details = query_data.search_option_details;
          search_option = query_data.search_option;
        }
        var wage_month_from = +req.body.wage_month_from;
        var wage_month_to = +req.body.wage_month_to;
        var wage_year_from = +req.body.wage_year_from;
        var wage_year_to = +req.body.wage_year_to;

        var booking_date_from = new Date(
          `${wage_year_from}-0${wage_month_from + 1}-01`
        );
        var booking_date_to = new Date(
          `${wage_year_to}-0${wage_month_to + 1}-01`
        );

        search_option_details.$match["employee_advances.status"] = {
          $eq: "active",
        };

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

        var advance_template = await EmployeeSheetTemplate.findById(
          req.body.template_id
        );

        let myAggregate = Employee.aggregate([
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
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
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
              employee_details: 1,
              bank_details: { $ifNull: ["$employee_details.bank_details", {}] },
              UAN_no: {
                $ifNull: [
                  "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
                  null,
                ],
              },
              advance_report: {
                $ifNull: ["$employee_monthly_reports.advance_report", {}],
              },
              advance_modules: { $ifNull: ["$employee_advances", []] },
            },
          },
        ]).then(async (reportdata) => {
          if (reportdata.length > 0) {
            var wb = new xl.Workbook(),
              ws = wb.addWorksheet("Sheet 1");
            (row_counter = 1),
              (sl_no = 0),
              (report = reportdata),
              (excel_array = {}),
              (counter_val = 1);

            advance_template = advance_template.template_fields[0].modules[0];

            if (advance_template && advance_template.fields.length) {
              await Promise.all(
                advance_template.fields.map((field) => {
                  if (field && field !== "on")
                    excel_array[field] = counter_val++;
                })
              );
            }

            ws.cell(1, excel_array["sl_no"]).string("SL. NO.");
            ws.cell(1, excel_array["emp_id"]).string("EMP ID");
            ws.cell(1, excel_array["emp_name"]).string("EMPLOYEE NAME");
            ws.cell(1, excel_array["department"]).string("DEPARTMENT");
            ws.cell(1, excel_array["designation"]).string("DESIGNATION");
            ws.cell(1, excel_array["client"]).string("BRANCH");
            ws.cell(1, excel_array["branch"]).string("CLIENT");
            ws.cell(1, excel_array["hod"]).string("HOD");
            ws.cell(1, excel_array["advance_id"]).string("ADVANCE ID");
            ws.cell(1, excel_array["recover_form"]).string("RECOVER FROM");
            ws.cell(1, excel_array["no_of_instalments"]).string(
              "NO OF INSTALMENTS"
            );
            ws.cell(1, excel_array["intstalment_amount"]).string(
              "INSTALMENT AMOUNT"
            );
            ws.cell(1, excel_array["start_month"]).string("START MONTH");
            ws.cell(1, excel_array["end_month"]).string("END MONTH");
            ws.cell(1, excel_array["advance_given"]).string("ADVANCE GIVEN");
            ws.cell(1, excel_array["advance_recovered"]).string(
              "ADVANCE RECOVERED"
            );
            ws.cell(1, excel_array["advance_balance"]).string(
              "ADVANCE BALANCE"
            );
            ws.cell(1, excel_array["opening_balance"]).string(
              "OPENING BALANCE"
            );
            ws.cell(1, excel_array["total_advance_given"]).string(
              "TOTAL ADVANCE GIVEN"
            );
            ws.cell(1, excel_array["total_advance_recovered"]).string(
              "TOTAL ADVANCE RECOVERED"
            );
            ws.cell(1, excel_array["closing_balance"]).string(
              "CLOSING BALANCE"
            );

            await Promise.all(
              report.map(async (report_data_exp) => {
                row_counter = row_counter + 1;
                sl_no = sl_no + 1;

                var emp_data = report_data_exp.employee_details,
                  advance_data = [],
                  opening_balance = 0,
                  advance_recovered = 0,
                  advance_amount = 0;

                // await Promise.all(
                report_data_exp.advance_modules.filter(async (d) => {
                  let isAdvanceExist = false;
                  let booking_date = new Date(d.payment_booking_date);

                  if (
                    booking_date.getFullYear() < wage_year_from ||
                    (booking_date.getFullYear() <= wage_year_from &&
                      booking_date.getMonth() <= wage_month_from)
                  ) {
                    opening_balance += +d.remaining_amount;
                    advance_amount += +d.advance_amount;
                    isAdvanceExist = true;
                  }

                  if (d.instalment_history && d.instalment_history.length) {
                    d.instalment_history.map((h) => {
                      if (
                        (+h.instalment_year > wage_year_from ||
                          (+h.instalment_year >= wage_year_from &&
                            +h.instalment_month >= wage_month_from)) &&
                        (+h.instalment_year < wage_year_to ||
                          (+h.instalment_year <= wage_year_to &&
                            +h.instalment_month <= wage_month_to))
                      ) {
                        if (h.status === "complete") {
                          advance_recovered += +h.advance_amount;
                          isAdvanceExist = true;
                        }
                      }
                    });
                  }

                  if (isAdvanceExist) {
                    advance_data.push(d);
                  }
                });

                // );

                ws.cell(row_counter, 1).number(sl_no);
                ws.cell(row_counter, 2).string(report_data_exp.emp_id);
                ws.cell(row_counter, 3).string(
                  report_data_exp.emp_first_name +
                    " " +
                    report_data_exp.emp_last_name
                );
                ws.cell(row_counter, 4).string(
                  report_data_exp.department
                    ? report_data_exp.department.department_name
                    : "N/A"
                );
                ws.cell(row_counter, 5).string(
                  report_data_exp.designation
                    ? report_data_exp.designation.designation_name
                    : "N/A"
                );
                ws.cell(row_counter, 6).string(
                  report_data_exp.branch
                    ? report_data_exp.branch.branch_name
                    : "N/A"
                );
                ws.cell(row_counter, 7).string(
                  report_data_exp.client
                    ? report_data_exp.client.client_name
                    : "N/A"
                );
                ws.cell(row_counter, 8).string(
                  report_data_exp.hod &&
                    report_data_exp.hod.first_name &&
                    report_data_exp.hod.last_name
                    ? report_data_exp.hod.first_name +
                        " " +
                        report_data_exp.hod.last_name
                    : "N/A"
                );

                if (advance_data.length) {
                  // await Promise.all(
                  advance_data.map((el) => {
                    if (el) {
                      ws.cell(row_counter, 9).number(0);
                      ws.cell(row_counter, 10).string(
                        el.recovery_from ?? "N/A"
                      );
                      ws.cell(row_counter, 11).number(
                        +el.no_of_instalments ?? 0
                      );
                      ws.cell(row_counter, 12).number(
                        +el.advance_amount / +el.no_of_instalments ?? 0
                      );
                      ws.cell(row_counter, 13).string(
                        el.payment_start_month ?? "N/A"
                      );
                      ws.cell(row_counter, 14).string(
                        el.payment_start_month ?? "N/A"
                      );
                      ws.cell(row_counter, 15).number(+el.advance_amount ?? 0);
                      ws.cell(row_counter, 16).number(
                        (+el.advance_amount || 0) -
                          (+el.remaining_amount || 0) ?? 0
                      );
                      ws.cell(row_counter, 17).number(
                        +el.advance_outstanding ?? 0
                      );
                      row_counter++;
                    }
                  });
                  // );
                  row_counter--;
                } else {
                  ws.cell(row_counter, 9).number(0);
                  ws.cell(row_counter, 10).string("N/A");
                  ws.cell(row_counter, 11).number(0);
                  ws.cell(row_counter, 12).number(0);
                  ws.cell(row_counter, 13).string("N/A");
                  ws.cell(row_counter, 14).string("N/A");
                  ws.cell(row_counter, 15).number(0);
                  ws.cell(row_counter, 16).number(0);
                  ws.cell(row_counter, 17).number(0);
                  ws.cell(row_counter, 18).number(0);
                }

                ws.cell(row_counter, 18).number(+opening_balance ?? 0);
                ws.cell(row_counter, 19).number(+advance_amount ?? 0);
                ws.cell(row_counter, 20).number(+advance_recovered ?? 0);
                ws.cell(row_counter, 21).number(
                  +advance_amount - advance_recovered ?? 0
                );
              })
            );
            var mastersheet_name = "advance-sheet.xlsx";
            // wb.write(mastersheet_name);
            var file = Site_helper.createFiles(
              wb,
              mastersheet_name,
              req.authData.corprate_id,
              'temp_files/advance_module'
            )
          }
          // file_name = "advance-sheet.xlsx";
          // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;

          await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
          // return resp.status(200).json({
          //   status: "success",
          //   message: "Xlsx created successfully",
          //   url: baseurl + file_location,
          // });
        });
      }
    } catch (e) {
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  //from 22 report no 19
  export_advance_register_report: async function (req, resp, next) {
    const v = new Validator(req.body, {
      wage_month: "required",
      wage_year: "required",
      // wage_month_to: "required",
      // wage_year_to: "required",
      pageno: "required",
      // list_type: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(403).send({
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
        var company = await Company.findOne({'_id':req.authId},'establishment_name');

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
        var wage_month_from = +req.body.wage_month_from;
        var wage_month_to = +req.body.wage_month_to;
        var wage_year_from = +req.body.wage_year_from;
        var wage_year_to = +req.body.wage_year_to;
        var wage_month = +req.body.wage_month;
        var wage_year = +req.body.wage_year;
        var monthly_report_lookup;
        var start_wage_date = moment({year:wage_year, month:wage_month, day:1}).startOf('month').format('yyyy-MM-DD')
        var end_wage_date = moment({year:wage_year, month:wage_month, day:1}).endOf('month').format('yyyy-MM-DD')

        // if (req.body.list_type == "payout") {
        //   const v = new Validator(req.body, {
        //     wage_month: "required",
        //     wage_year: "required",
        //   });
        //   const matched = await v.check();
        //   if (!matched) {
        //     return resp.status(200).send({
        //       status: "val_err",
        //       message: "Validation error",
        //       val_msg: v.errors,
        //     });
        //   }
        //   var wage_month = +req.body.wage_month;
        //   var wage_year = +req.body.wage_year;
        //   // search_opti480000+336000on_details.$match['employee_monthly_reports.wage_month']= wage_month;
        //   // search_option_details.$match['employee_monthly_reports.wage_year']=  wage_year;
        //   var monthly_report_lookup = {
        //     from: "employee_monthly_reports",
        //     let: { emp_db_idVar: "$_id" },
        //     pipeline: [
        //       {
        //         $match: {
        //           $and: [
        //             { $expr: { $eq: ["$emp_db_id", "$$emp_db_idVar"] } },
        //             { wage_month: wage_month },
        //             { wage_year: wage_year },
        //           ],
        //         },
        //       },
        //     ],
        //     as: "employee_monthly_reports",
        //   };
        // } else {
          var monthly_report_lookup = {
            from: "employee_monthly_reports",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "employee_monthly_reports",
          };
        // }

        // if (req.body.generate == 'excel') {
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
        // }

        // var booking_date_from = new Date(
        //   `${wage_year_from}-0${wage_month_from + 1}-01`
        // );
        // var booking_date_to = new Date(
        //   `${wage_year_to}-0${wage_month_to + 1}-01`
        // );

        search_option_details.$match['employee_advances'] =  {$exists: true , $ne: []} ;
        // search_option_details.$match["employee_advances.status"] = {
        //   $eq: "active",
        // };
        let myAggregate = Employee.aggregate([
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
            $lookup:{
              from: "employee_advances",
              // localField: "emp_id",
              // foreignField: "emp_id",
              let: { emp_idVar: "$emp_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$emp_id", "$$emp_idVar"] } },
                      // $and: [
                        {
                          "payment_booking_date": {
                            $gte: start_wage_date
                          },
                        },
                        {
                          "payment_booking_date": {
                            $lte: end_wage_date
                          },
                        },
                      // ],
                    ],
                  },
                },
              ],
              as: "employee_advances",
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
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
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
              emp_father_name: 1,
              // branch: 1,
              // department: 1,
              designation: 1,
              // client: 1,
              // hod: 1,
              // employee_details: 1,
              // bank_details: { $ifNull: ["$employee_details.bank_details", {}] },
              // UAN_no: {
              //   $ifNull: [
              //     "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
              //     null,
              //   ],
              // },
              // advance_report: {
              //   $ifNull: ["$employee_monthly_reports.advance_report", {}],
              // },
              advance_modules: { $ifNull: ["$employee_advances", []] },
            },
          },
        ]);
        if(req.body.generate == 'excel'){
          myAggregate.then(async (emp_report_data)=>{
              var field_list_array=["name","emp_father_name","designation","wage_peroid","date_amount","purpose","no_of_instalment","date_and_amount","date_on_which","remarks"];
              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, 1, 1, 11, true).string("REGISTER OF ADVANCES").style({alignment: {vertical: 'center',horizontal: 'center'}});
              ws.cell(2, 1, 2, 11, true).string("FORM XXII,SEE RULE-78 (1) (A) (II)  ").style({alignment: {vertical: 'center',horizontal: 'center'}});
              ws.cell(3, 1, 3, 3, true).string('Name of the Establishment  : ').style({alignment: {vertical: 'center',horizontal: 'center'}});
              ws.cell(3, 4, 3, 6, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
              ws.cell(3, 7, 3, 8, true).string(' Name of Owner :').style({alignment: {vertical: 'center',horizontal: 'center'}});
              ws.cell(3, 9, 3, 11, true).string(req.authData?.first_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
              ws.cell(5, clmn_id++).string("SL");
              if(field_list_array.includes('name'))
              {
                  ws.cell(5, clmn_id++).string("Name Of the Employee");
              }
              if(field_list_array.includes('emp_father_name'))
              {
                  ws.cell(5, clmn_id++).string("Father's/ Husband's  Name");
              }
              if(field_list_array.includes('designation'))
              {
                  ws.cell(5, clmn_id++).string("Designation/Nature of Employment");
              }
              if(field_list_array.includes('wage_peroid'))
              {
                  ws.cell(5, clmn_id++).string("Wage Peroid and Wages Payable");
              }
              if(field_list_array.includes('date_amount'))
              {
                  ws.cell(5, clmn_id++).string("Date and Amount of Advance Given");
              }
              if(field_list_array.includes('purpose'))
              {
                  ws.cell(5, clmn_id++).string("Purpose(s) for Which Advance made");
              }
              if(field_list_array.includes('no_of_instalment'))
              {
                  ws.cell(5, clmn_id++).string("No of Instalments by which Advance to be Repaid");
              }
              
              if(field_list_array.includes('date_and_amount'))
              {
                  ws.cell(5, clmn_id++).string("Date and Amount of Each Instalment was Paid");
              }
              if(field_list_array.includes('date_on_which'))
              {
                  ws.cell(5, clmn_id++).string("Date on which Last Instalment Was Repaid");
              }
              if(field_list_array.includes('remarks'))
              {
                  ws.cell(5, clmn_id++).string("Remarks");
              }
              await Promise.all(emp_report_data.map(async function(employee, index){
                  let obj = {
                    advance_module : {
                      'previous' : {
                        'month': '',
                        'year' : '',
                        'amount': 0,
                      },
                      'current' : {
                        'month': '',
                        'year' : '',
                        'amount': 0,
                      },
                      'no_of_instalments' : 0,
                      'date' : '',
                      'total_amount' : 0,
                    },
                  };
                  obj.advance_modules = employee.advance_modules.filter((d) => {
                    let isAdvanceExist = false;
                    // opening balance
                    let booking_date = new Date(d.payment_booking_date);

                    // // outstanding balance
                    if (d.instalment_history && d.instalment_history.length) {
                      d.instalment_history.filter(
                        (h,keys) => {
                          if (
                            (+h.instalment_year == +wage_year && +h.instalment_month == +wage_month)
                          ) {
                            isAdvanceExist = true;
                            if(keys-1 >= 0){
                              obj.advance_module.previous.month = +d.instalment_history[keys-1].instalment_month;
                              obj.advance_module.previous.year = +d.instalment_history[keys-1].instalment_year;
                              obj.advance_module.previous.amount += parseFloat(d.instalment_history[keys-1].advance_amount);
                            }
                            obj.advance_module.current.month = +h.instalment_month;
                            obj.advance_module.current.year = +h.instalment_year;
                            obj.advance_module.current.amount += parseFloat(h.advance_amount);
                          }
                          
                        }
                      );
                    }
                    if (isAdvanceExist) {
                      obj.advance_module.no_of_instalments += parseFloat(d.no_of_instalments);
                      obj.advance_module.date = d.payment_booking_date;
                      obj.advance_module.total_amount += parseFloat(d.advance_amount);
                      return d;
                    }
                  });
                  employee.excel_data = obj;
                  var index_val = 6;
                  index_val = index_val + index;
                  var clmn_emp_id=1;
                  ws.cell(index_val, clmn_emp_id++).number(index + 1);
                  if(field_list_array.includes('name'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name +" "+ employee.emp_last_name) : "N/A");
                  }
                  if(field_list_array.includes('emp_father_name'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(employee.emp_father_name ? String(employee.emp_father_name) : "N/A");
                  }
                  if(field_list_array.includes('designation'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(employee.designation ? String(employee.designation.designation_name) : "N/A");
                  }
                  if(field_list_array.includes('wage_peroid'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string("N/A");
                  }
                  if(field_list_array.includes('date_amount'))
                  {
                    var date_amount = '';
                    if(employee.excel_data.advance_module.date){
                      date_amount += employee.excel_data.advance_module.date +"&";
                    }
                    if(employee.excel_data.advance_module.total_amount){
                      date_amount += employee.excel_data.advance_module.total_amount;
                    }
                    
                    ws.cell(index_val, clmn_emp_id++).string(date_amount ? String(date_amount) : "N/A");
                  }
                  if(field_list_array.includes('purpose'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string("N/A");
                  }
                  if(field_list_array.includes('no_of_instalment'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(employee.excel_data.advance_module.no_of_instalments ? String(employee.excel_data.advance_module.no_of_instalments) : "N/A");
                  }
                  if(field_list_array.includes('date_and_amount'))
                  {

                    var date_and_amount = '';
                    if(employee.excel_data.advance_module.current.month && employee.excel_data.advance_module.current.year){
                      date_and_amount += moment(employee.excel_data.advance_module.current.year+"-"+parseFloat(employee.excel_data.advance_module.current.month+1), "YYYY-MM").daysInMonth() +"-"+ employee.excel_data.advance_module.current.month +"-"+employee.excel_data.advance_module.current.year +" &";
                    }
                    if(employee.excel_data.advance_module.current.amount){
                      date_and_amount += employee.excel_data.advance_module.current.amount;
                    }
                    else{
                      date_and_amount += "0.00";
                    }
                    ws.cell(index_val, clmn_emp_id++).string(date_and_amount ? String(date_and_amount) : "N/A");
                  }
                  if(field_list_array.includes('date_on_which'))
                  {
                    var date_on_which = '';
                    if(employee.excel_data.advance_module.previous.month && employee.excel_data.advance_module.previous.year){
                      date_on_which += moment(employee.excel_data.advance_module.previous.year+"-"+(parseFloat(employee.excel_data.advance_module.previous.month)+1), "YYYY-MM").daysInMonth() +"-"+ employee.excel_data.advance_module.previous.month +"-"+employee.excel_data.advance_module.previous.year +" &";
                    }
                    if(employee.excel_data.advance_module.previous.amount){
                      date_on_which += employee.excel_data.advance_module.previous.amount;
                    }
                    else{
                      date_on_which += "0.00";
                    }
                    ws.cell(index_val, clmn_emp_id++).string(date_on_which ? String(date_on_which) : "N/A");
                  }
                  if(field_list_array.includes('remarks'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(employee.excel_data.advance_module.remarks ? employee.excel_data.advance_module.remarks : 'N/A');
                  }
                
              })).then(async (emp) => {
                // file_name = "advance-register-report-export.xlsx";
                // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                let file = Site_helper.createFiles(wb,"advance-register-report-export.xlsx", req.authData.corporate_id, 'temp_files/advance_module')
                await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                // return resp.status(200).json({status: "success", message: 'Register Advance Report Generated successfully.', url: baseurl + file_location});
              });
          });
        }
        else{
          Employee.aggregatePaginate(
            myAggregate,
            options,
            async function (err, employees) {
              if (err)
                return resp.json({ status: "error", message: err.message });
              if (employees && employees.docs.length) {
                employees.docs = employees.docs.map((employee) => {
                  let obj = {
                    ...employee,
                    // advance_module: {
                    //   opening_balance: 0,
                    //   advance_recovered: 0,
                    //   new_advance: 0,
                    //   advance_amount: 0,
                    // },
                    advance_module : {
                      'previous' : {
                        'month': '',
                        'year' : '',
                        'amount': 0,
                      },
                      'current' : {
                        'month': '',
                        'year' : '',
                        'amount': 0,
                      },
                      'no_of_instalments' : 0,
                      'date' : '',
                      'total_amount' : 0,
                    },
                  };
                  obj.advance_modules = employee.advance_modules.filter((d) => {
                    let isAdvanceExist = false;
                    // opening balance
                    let booking_date = new Date(d.payment_booking_date);

                    // // outstanding balance
                    if (d.instalment_history && d.instalment_history.length) {
                      d.instalment_history.filter(
                        (h,keys) => {
                          if (
                            (+h.instalment_year == +wage_year && +h.instalment_month == +wage_month)
                          ) {
                            isAdvanceExist = true;
                            if(keys-1 >= 0){
                              obj.advance_module.previous.month = +d.instalment_history[keys-1].instalment_month;
                              obj.advance_module.previous.year = +d.instalment_history[keys-1].instalment_year;
                              obj.advance_module.previous.amount += parseFloat(d.instalment_history[keys-1].advance_amount);
                            }
                            obj.advance_module.current.month = +h.instalment_month;
                            obj.advance_module.current.year = +h.instalment_year;
                            obj.advance_module.current.amount += parseFloat(h.advance_amount);
                          }
                          
                        }
                      );
                    }
                    if (isAdvanceExist) {
                      obj.advance_module.no_of_instalments += parseFloat(d.no_of_instalments);
                      obj.advance_module.date = d.payment_booking_date;
                      obj.advance_module.total_amount += parseFloat(d.advance_amount);
                      obj.advance_module.remarks += d.remarks;
                      return d;
                    }
                  });
                  return obj;
                });

                return resp
                  .status(200)
                  .json({ status: "success",company_name:company, employees: employees });
              }
              return resp
                .status(200)
                .json({ status: "success",company_name:company, employees: employees });
            }
          );
        }
      } catch (e) {
        return resp.status(403).json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
      }
    }
  },
  //from c report no 35
  export_advance_form_c_report: async function (req, resp, next) {
    const v = new Validator(req.body, {
      wage_month: "required",
      wage_year: "required",
      // wage_month_to: "required",
      // wage_year_to: "required",
      pageno: "required",
      // list_type: "required",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(403).send({
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
        var company = await Company.findOne({'_id':req.authId},'establishment_name');
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
     
        var wage_month = +req.body.wage_month;
        var wage_year = +req.body.wage_year;
        var monthly_report_lookup;

          var monthly_report_lookup = {
            from: "employee_monthly_reports",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "employee_monthly_reports",
          };
        // }

        // if (req.body.generate == 'excel') {
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
        // }


        // search_option_details.$match['employee_advances'] =  {$exists: true , $ne: []} ;
        // search_option_details.$match["employee_advances.status"] = {
        //   $eq: "active",
        // };
        let myAggregate = Employee.aggregate([
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
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              employee_monthly_reports: {
                $arrayElemAt: ["$employee_monthly_reports", 0],
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
              emp_father_name: 1,
           
              designation: 1,
            
              advance_modules: { $ifNull: ["$employee_advances", []] },
            },
          },
        ]);
        if(req.body.generate == 'excel'){
          myAggregate.then(async (emp_report_data)=>{
              // var field_list_array=["name","emp_father_name","designation","wage_peroid","date_amount","purpose","no_of_instalment","date_and_amount","date_on_which","remarks"];
              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              // var clmn_id = 1;
              ws.cell(1, 1).string("SL");
              ws.cell(1, 2).string("SR. NUMBER IN EMPLOYEE / WORKMAN / WORKER REGISTER");
              ws.cell(1, 3).string("Name");
              ws.cell(1, 4).string("Recovery type (Damage/Loss/fine/Advance/Loans/Absence)");
              ws.cell(1, 5).string("Date Of Damage/ Loss / Absence");
              ws.cell(1, 6).string("Amount");
              ws.cell(1, 7).string("Number of instalments");
              ws.cell(1, 8).string("First Month/ Year");
              ws.cell(1, 9).string("Last Month/ Year");
              ws.cell(1, 10).string("Date of Complete Recovery");
              ws.cell(1, 11).string("Remarks");
              // if(field_list_array.includes('name'))
              // {
              //     ws.cell(1, clmn_id++).string("Name Of the Employee");
              // }
              // if(field_list_array.includes('emp_father_name'))
              // {
              //     ws.cell(1, clmn_id++).string("Father's/ Husband's  Name");
              // }
              // if(field_list_array.includes('designation'))
              // {
              //     ws.cell(1, clmn_id++).string("Designation/Nature of Employment");
              // }
              // if(field_list_array.includes('wage_peroid'))
              // {
              //     ws.cell(1, clmn_id++).string("Wage Peroid and Wages Payable");
              // }
              // if(field_list_array.includes('date_amount'))
              // {
              //     ws.cell(1, clmn_id++).string("Date and Amount of Advance Given");
              // }
              // if(field_list_array.includes('purpose'))
              // {
              //     ws.cell(1, clmn_id++).string("Purpose(s) for Which Advance made");
              // }
              // if(field_list_array.includes('no_of_instalment'))
              // {
              //     ws.cell(1, clmn_id++).string("No of Instalments by which Advance to be Repaid");
              // }
              
              // if(field_list_array.includes('date_and_amount'))
              // {
              //     ws.cell(1, clmn_id++).string("Date and Amount of Each Instalment was Paid");
              // }
              // if(field_list_array.includes('date_on_which'))
              // {
              //     ws.cell(1, clmn_id++).string("Date on which Last Instalment Was Repaid");
              // }
              // if(field_list_array.includes('remarks'))
              // {
              //     ws.cell(1, clmn_id++).string("Remarks");
              // }
              await Promise.all(emp_report_data.map(async function(employee, index){
                  let obj = {
                    advance_module : {
                      // 'first_ins' : {
                      //   'month': '',
                      //   'year' : '',
                      //   'amount': 0,
                      // },
                      // 'last_inst' : {
                      //   'month': '',
                      //   'year' : '',
                      //   'amount': 0,
                      // },
                      'no_of_instalments' : 0,
                      'date' : '',
                      'payment_start_month' : '',
                      'payment_start_year' : '',
                      'payment_last_month' : '',
                      'payment_last_year' : '',
                      'total_amount' : 0,
                    },
                  };
                  obj.advance_modules = employee.advance_modules.filter((d) => {
                    let isAdvanceExist = false;
                    // opening balance
                    let booking_date = new Date(d.payment_booking_date);

                    // // outstanding balance
                    if (d.instalment_history && d.instalment_history.length) {
                      d.instalment_history.filter(
                        (h,keys) => {
                          if (
                            (+h.instalment_year == +wage_year && +h.instalment_month == +wage_month)
                          ) {
                            isAdvanceExist = true;
                            
                            // if(keys-1 >= 0){
                            //   obj.advance_module.previous.month = +d.instalment_history[keys-1].instalment_month;
                            //   obj.advance_module.previous.year = +d.instalment_history[keys-1].instalment_year;
                            //   obj.advance_module.previous.amount += parseFloat(d.instalment_history[keys-1].advance_amount);
                            // }
                            // obj.advance_module.current.month = +h.instalment_month;
                            // obj.advance_module.current.year = +h.instalment_year;
                            // obj.advance_module.current.amount += parseFloat(h.advance_amount);
                          }
                          
                        }
                      );
                    }
                    if (isAdvanceExist) {
                      obj.advance_module.no_of_instalments += parseFloat(d.no_of_instalments);
                      obj.advance_module.date = d.payment_booking_date;
                      // if(d.status == 'active'){
                        obj.advance_module.total_amount += parseFloat(d.advance_amount);
                      // }
                      // else{
                      //   obj.advance_module.total_amount += 0;
                      // }
                      obj.advance_module.payment_start_month = parseInt(d.instalment_history[0]?.instalment_month) + 1 
                      obj.advance_module.payment_start_year = parseFloat(d.instalment_history[0]?.instalment_year)
                      obj.advance_module.payment_last_month = parseInt(d.instalment_history[d.instalment_history?.length-1]?.instalment_month) + 1
                      obj.advance_module.payment_last_year = parseFloat(d.instalment_history[d.instalment_history?.length-1]?.instalment_year)
                      return d;
                    }
                  });
                  employee.excel_data = obj;
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id=1;
                  ws.cell(index_val, 1).number(index_val - 1);
                  ws.cell(index_val, 2).string(employee?.emp_id);
                  ws.cell(index_val, 3).string(employee?.emp_first_name + ' ' + employee?.emp_last_name);
                  ws.cell(index_val, 4).string("Advance");
                  ws.cell(index_val, 5).string("N/A");
                  ws.cell(index_val, 6).number(obj.advance_module.total_amount ?? 0);
                  ws.cell(index_val, 7).number(obj.advance_module.no_of_instalments ?? 0);
                  ws.cell(index_val,8).string(((obj.advance_module.payment_start_month ? obj.advance_module.payment_start_month + ', ': '' ) ?? 'N/A')  + (obj.advance_module.payment_start_year ?? 'N/A'));
                  ws.cell(index_val, 9).string(((obj.advance_module.payment_last_month ? obj.advance_module.payment_last_month + ', ': '' ) ?? 'N/A')  + (obj.advance_module.payment_last_year ?? 'N/A'));
                  ws.cell(index_val, 10).string(((obj.advance_module.payment_last_month ? obj.advance_module.payment_last_month + ', ': '' ) ?? 'N/A')  + (obj.advance_module.payment_last_year ?? 'N/A'));
                  ws.cell(index_val, 11).string("N/A");
                  // if(field_list_array.includes('name'))
                  // {
                  //   ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name +" "+ employee.emp_last_name) : "");
                  // }
                  // if(field_list_array.includes('emp_father_name'))
                  // {
                  //   ws.cell(index_val, clmn_emp_id++).string(employee.emp_father_name ? String(employee.emp_father_name) : "");
                  // }
                  // if(field_list_array.includes('designation'))
                  // {
                  //   ws.cell(index_val, clmn_emp_id++).string(employee.designation ? String(employee.designation.designation_name) : "");
                  // }
                  // if(field_list_array.includes('wage_peroid'))
                  // {
                  //   ws.cell(index_val, clmn_emp_id++).string("");
                  // }
                  // if(field_list_array.includes('date_amount'))
                  // {
                  //   var date_amount = '';
                  //   if(employee.excel_data.advance_module.date){
                  //     date_amount += employee.excel_data.advance_module.date +"&";
                  //   }
                  //   if(employee.excel_data.advance_module.total_amount){
                  //     date_amount += employee.excel_data.advance_module.total_amount;
                  //   }
                    
                  //   ws.cell(index_val, clmn_emp_id++).string(date_amount ? String(date_amount) : "");
                  // }
                  // if(field_list_array.includes('purpose'))
                  // {
                  //   ws.cell(index_val, clmn_emp_id++).string("");
                  // }
                  // if(field_list_array.includes('no_of_instalment'))
                  // {
                  //   ws.cell(index_val, clmn_emp_id++).string(employee.excel_data.advance_module.no_of_instalments ? String(employee.excel_data.advance_module.no_of_instalments) : "");
                  // }
                  // if(field_list_array.includes('date_and_amount'))
                  // {

                  //   var date_and_amount = '';
                  //   if(employee.excel_data.advance_module.current.month && employee.excel_data.advance_module.current.year){
                  //     date_and_amount += moment(employee.excel_data.advance_module.current.year+"-"+parseFloat(employee.excel_data.advance_module.current.month+1), "YYYY-MM").daysInMonth() +"-"+ employee.excel_data.advance_module.current.month +"-"+employee.excel_data.advance_module.current.year +" &";
                  //   }
                  //   if(employee.excel_data.advance_module.current.amount){
                  //     date_and_amount += employee.excel_data.advance_module.current.amount;
                  //   }
                  //   else{
                  //     date_and_amount += "0.00";
                  //   }
                  //   ws.cell(index_val, clmn_emp_id++).string(date_and_amount ? String(date_and_amount) : "");
                  // }
                  // if(field_list_array.includes('date_on_which'))
                  // {
                  //   var date_on_which = '';
                  //   if(employee.excel_data.advance_module.previous.month && employee.excel_data.advance_module.previous.year){
                  //     date_on_which += moment(employee.excel_data.advance_module.previous.year+"-"+(parseFloat(employee.excel_data.advance_module.previous.month)+1), "YYYY-MM").daysInMonth() +"-"+ employee.excel_data.advance_module.previous.month +"-"+employee.excel_data.advance_module.previous.year +" &";
                  //   }
                  //   if(employee.excel_data.advance_module.previous.amount){
                  //     date_on_which += employee.excel_data.advance_module.previous.amount;
                  //   }
                  //   else{
                  //     date_on_which += "0.00";
                  //   }
                  //   ws.cell(index_val, clmn_emp_id++).string(date_on_which ? String(date_on_which) : "");
                  // }
                  // if(field_list_array.includes('remarks'))
                  // {
                  //   ws.cell(index_val, clmn_emp_id++).string("");
                  // }
                
              })).then(async (emp) => {
                // file_name = "advance-register-report-export.xlsx";
                // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                let file = Site_helper.createFiles(wb,"advance-form-c-report-export.xlsx", req.authData.corporate_id, 'temp_files/advance_module')
                await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                // return resp.status(200).json({status: "success", message: 'Register Advance Report Generated successfully.', url: baseurl + file_location});
              });
          });
        }
        else{
          Employee.aggregatePaginate(
            myAggregate,
            options,
            async function (err, employees) {
              if (err)
                return resp.json({ status: "error", message: err.message });
              if (employees && employees.docs.length) {
                employees.docs = employees.docs.map((employee) => {
                  let obj = {
                    ...employee,
                    // advance_module: {
                    //   opening_balance: 0,
                    //   advance_recovered: 0,
                    //   new_advance: 0,
                    //   advance_amount: 0,
                    // },
                    advance_module : {
                      // 'first_ins' : {
                      //   'month': '',
                      //   'year' : '',
                      //   'amount': 0,
                      // },
                      // 'last_inst' : {
                      //   'month': '',
                      //   'year' : '',
                      //   'amount': 0,
                      // },
                      'no_of_instalments' : 0,
                      'date' : '',
                      'payment_start_month' : '',
                      'payment_start_year' : '',
                      'payment_last_month' : '',
                      'payment_last_year' : '',
                      'total_amount' : 0,
                    },
                  };
                  // let obj = {
                  //   advance_module : {
                  //     // 'first_ins' : {
                  //     //   'month': '',
                  //     //   'year' : '',
                  //     //   'amount': 0,
                  //     // },
                  //     // 'last_inst' : {
                  //     //   'month': '',
                  //     //   'year' : '',
                  //     //   'amount': 0,
                  //     // },
                  //     'no_of_instalments' : 0,
                  //     'date' : '',
                  //     'payment_start_month' : '',
                  //     'payment_start_year' : '',
                  //     'payment_last_month' : '',
                  //     'payment_last_year' : '',
                  //     'total_amount' : 0,
                  //   },
                  // };
                  obj.advance_modules = employee.advance_modules.filter((d) => {
                    let isAdvanceExist = false;
                    // opening balance
                    let booking_date = new Date(d.payment_booking_date);

                    // // outstanding balance
                    if (d.instalment_history && d.instalment_history.length) {
                      d.instalment_history.filter(
                        (h,keys) => {
                          if (
                            (+h.instalment_year == +wage_year && +h.instalment_month == +wage_month)
                          ) {
                            isAdvanceExist = true;
                            
                            // if(keys-1 >= 0){
                            //   obj.advance_module.previous.month = +d.instalment_history[keys-1].instalment_month;
                            //   obj.advance_module.previous.year = +d.instalment_history[keys-1].instalment_year;
                            //   obj.advance_module.previous.amount += parseFloat(d.instalment_history[keys-1].advance_amount);
                            // }
                            // obj.advance_module.current.month = +h.instalment_month;
                            // obj.advance_module.current.year = +h.instalment_year;
                            // obj.advance_module.current.amount += parseFloat(h.advance_amount);
                          }
                          
                        }
                      );
                    }
                    if (isAdvanceExist) {
                      obj.advance_module.no_of_instalments += parseFloat(d.no_of_instalments);
                      obj.advance_module.date = d.payment_booking_date;
                      // if(d.status == 'active'){
                        obj.advance_module.total_amount += parseFloat(d.advance_amount);
                      // }
                      // else{
                      //   obj.advance_module.total_amount += 0;
                      // }
                      
                      obj.advance_module.payment_start_month = parseInt(d.instalment_history[0]?.instalment_month) + 1
                      obj.advance_module.payment_start_year = parseFloat(d.instalment_history[0]?.instalment_year)
                      obj.advance_module.payment_last_month = parseInt(d.instalment_history[d.instalment_history?.length-1]?.instalment_month) + 1 
                      obj.advance_module.payment_last_year = parseFloat(d.instalment_history[d.instalment_history?.length-1]?.instalment_year)
                      return d;
                    }
                  });
                  // obj.advance_modules = employee.advance_modules.filter((d) => {
                  //   let isAdvanceExist = false;
                  //   // opening balance
                  //   let booking_date = new Date(d.payment_booking_date);

                  //   // // outstanding balance
                  //   if (d.instalment_history && d.instalment_history.length) {
                  //     d.instalment_history.filter(
                  //       (h,keys) => {
                  //         if (
                  //           (+h.instalment_year == +wage_year && +h.instalment_month == +wage_month)
                  //         ) {
                  //           isAdvanceExist = true;
                  //           if(keys-1 >= 0){
                  //             obj.advance_module.previous.month = +d.instalment_history[keys-1].instalment_month;
                  //             obj.advance_module.previous.year = +d.instalment_history[keys-1].instalment_year;
                  //             obj.advance_module.previous.amount += parseFloat(d.instalment_history[keys-1].advance_amount);
                  //           }
                  //           obj.advance_module.current.month = +h.instalment_month;
                  //           obj.advance_module.current.year = +h.instalment_year;
                  //           obj.advance_module.current.amount += parseFloat(h.advance_amount);
                  //         }
                          
                  //       }
                  //     );
                  //   }
                  //   if (isAdvanceExist) {
                  //     obj.advance_module.no_of_instalments += parseFloat(d.no_of_instalments);
                  //     obj.advance_module.date = d.payment_booking_date;
                  //     obj.advance_module.total_amount += parseFloat(d.advance_amount);
                  //     return d;
                  //   }
                  // });
                  return obj;
                });

                return resp
                  .status(200)
                  .json({ status: "success",company_name:company, employees: employees });
              }
              return resp
                .status(200)
                .json({ status: "success",company_name:company, employees: employees });
            }
          );
        }
      } catch (e) {
        return resp.status(403).json({
          status: "error",
          message: e ? e.message : "Something went wrong",
        });
      }
    }
  },
};
