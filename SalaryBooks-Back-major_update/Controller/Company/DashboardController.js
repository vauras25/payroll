var Challans = require("../../Model/Company/Challans");
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require("node-input-validator");
const mongoose = require("mongoose");
const monthly_reports = require("../../Model/Company/EmployeeMonthlyReport");
const Employee = require("../../Model/Company/employee");
const Company = require("../../Model/Admin/Company");
const employeeDetails = require("../../Model/Company/employee_details");
const employee_advances = require("../../Model/Company/EmployeeAdvance");

const DashboardContent = require('../../Model/Admin/DashboardContent'); 

module.exports = {
  get_company_dashboard_total_data: async function (req, resp) {
    try {
      var sortoption = { created_at: -1 };
      const options = {
        page: req.body.pageno,
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var search_option = { $match: {} };

      search_option.$match.corporate_id = { $eq: req.authData.corporate_id };

      var myAggregate = Company.aggregate([
        search_option,
        {
          $lookup: {
            from: "plans",
            localField: "plan_id",
            foreignField: "_id",
            as: "plans",
          },
        },
        {
          $lookup: {
            from: "employees",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { parent_hods: { $in: [req.authData.user_id] } },
                  ],
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
                $addFields: {
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
                  status: 1,
                  date_of_join:
                    "$employee_detail.employment_hr_details.date_of_join",
                  date_of_exit:
                    "$employee_detail.full_and_final.last_working_date",
                },
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 }, // Count of employees with this

                  active_employees: {
                    $push: {
                      $cond: [{ $eq: ["$status", "active"] }, "$$ROOT", null],
                    },
                  }, // Push the entire employee object

                  inactive_employees: {
                    $push: {
                      $cond: [{ $eq: ["$status", "inactive"] }, "$$ROOT", null],
                    },
                  }, // Push the entire employee object

                  employees_ids: { $push: "$_id" }, // Push the employee _id
                  active_emp_count: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                  },
                  pending_emp_count: {
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                  },
                  approved_emp_count: {
                    $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
                  },
                  inactive_emp_count: {
                    $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
                  },
                  aadhar_pending: {
                    $sum: { $cond: [{ $eq: ["$aadhar_no", null] }, 1, 0] },
                  },
                  pan_pending: {
                    $sum: { $cond: [{ $eq: ["$pan_no", null] }, 1, 0] },
                  },
                },
              },
            ],
            as: "employees",
          },
        },
        {
          $addFields: {
            employee_container: {
              $arrayElemAt: ["$employees", 0],
            },
          },
        },
        {
          $lookup: {
            from: "employee_details",
            let: { emp: "$employee_container" },
            pipeline: [
              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $in: [
                          "$employee_id",
                          { $ifNull: ["$$emp.employees_ids", []] },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                $group: {
                  _id: null, // Grouping by status
                  uan_pending: {
                    $sum: {
                      $cond: [
                        {
                          $or: [
                            { $not: ["$pf_esic_details"] }, // Check if some_field exists
                            { $not: ["$pf_esic_details.curr_er_epfo_details"] }, // Check if some_field exists
                            {
                              $not: [
                                "$pf_esic_details.curr_er_epfo_details.uan_no",
                              ],
                            }, // Check if some_field exists
                            {
                              $eq: [
                                "$pf_esic_details.curr_er_epfo_details.uan_no",
                                null,
                              ],
                            }, // Check equality
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  ip_pending: {
                    $sum: {
                      $cond: [
                        {
                          $or: [
                            { $not: ["$pf_esic_details"] }, // Check if some_field exists
                            { $not: ["$pf_esic_details.curr_er_esic_details"] }, // Check if some_field exists
                            {
                              $not: [
                                "$pf_esic_details.curr_er_esic_details.esic_no",
                              ],
                            }, // Check if some_field exists
                            {
                              $eq: [
                                "$pf_esic_details.curr_er_esic_details.esic_no",
                                null,
                              ],
                            }, // Check equality
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  bank_details_pending: {
                    $sum: {
                      $cond: [
                        {
                          $or: [
                            { $not: ["$bank_details"] }, // Check if some_field exists
                            { $eq: ["$bank_details", null] }, // Check equality
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "employee_details",
          },
        },

        {
          $lookup: {
            from: "staffs",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { status: { $eq: "active" } },
                  ],
                },
              },
            ],
            // localField: "corporate_id",
            // foreignField: "corporate_id",
            as: "staffs",
          },
        },

        {
          $lookup: {
            from: "employee_advances",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { status: { $eq: "pending" } },
                  ],
                },
              },
            ],
            // localField: "corporate_id",
            // foreignField: "corporate_id",
            as: "employee_advances",
          },
        },
        {
          $lookup: {
            from: "employee_leaves",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { status: { $eq: "pending" } },
                  ],
                },
              },
            ],
            as: "employee_leaves",
          },
        },
        {
          $lookup: {
            from: "bank_instructions",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { status: { $eq: "pending" } },
                  ],
                },
              },
            ],
            as: "bank_instructions",
          },
        },

        {
          $lookup: {
            from: "challans",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                  ],
                },
              },
              {
                $group: {
                  _id: null, // Grouping by status
                  total_challans_count: { $sum: 1 }, // Count of employees with this status
                  challans: { $push: "$$ROOT" }, // Push the entire employee object
                  //   pending_challan: {
                  //     $push: {
                  //       $cond: [{ $eq: ["$status", "pending"] }, "$$ROOT", null]
                  //     }
                  //   },
                  // on_time_payments: {
                  //   $sum: {
                  //     $cond: [
                  //       {
                  //         $or: [
                  //           {
                  //             $and: [
                  //               { $eq: ["$challan_for", "pf"] },
                  //               {
                  //                 $lt: [
                  //                   "$payment_confirmation.date_of_credit",
                  //                   "$due_date",
                  //                 ],
                  //               },
                  //             ],
                  //           },
                  //           {
                  //             $and: [
                  //               { $eq: ["$challan_for", "esic"] },
                  //               { $lt: ["$challan_submited", "$due_date"] },
                  //             ],
                  //           },
                  //         ],
                  //       },
                  //       1,
                  //       0,
                  //     ],
                  //   },
                  // },
                  pending_pf_challan_count: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$challan_for", "pf"] },
                            { $eq: ["$status", "active"] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  pending_esic_challan_count: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$challan_for", "esic"] },
                            { $eq: ["$status", "active"] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            // localField: "corporate_id",
            // foreignField: "corporate_id",
            as: "challans",
          },
        },

        {
          $addFields: {
            plan: {
              $arrayElemAt: ["$plans", 0],
            },
            employee_container: {
              $arrayElemAt: ["$employees", 0],
            },
            employee_detail: {
              $arrayElemAt: ["$employee_details", 0],
            },
            challan: {
              $arrayElemAt: ["$challans", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            credit_stat: 1,
            plan_name: { $ifNull: ["$plan.plan_name", null] },
            //employees total data
            active_employees: {
              $filter: {
                input: "$employee_container.active_employees",
                as: "employee",
                cond: {
                  $ne: ["$$employee", null],
                },
              },
            },
            inactive_employees: {
              $filter: {
                input: "$employee_container.inactive_employees",
                as: "employee",
                cond: {
                  $ne: ["$$employee", null],
                },
              },
            },
            active_emp_count: {
              $ifNull: ["$employee_container.active_emp_count", 0],
            },
            approved_emp_count: {
              $ifNull: ["$employee_container.approved_emp_count", 0],
            },
            inactive_emp_count: {
              $ifNull: ["$employee_container.inactive_emp_count", 0],
            },
            aadhar_pending: {
              $ifNull: ["$employee_container.aadhar_pending", 0],
            },
            pending_emp_count: {
              $ifNull: ["$employee_container.pending_emp_count", 0],
            },
            pan_pending: { $ifNull: ["$employee_container.pan_pending", 0] },

            //employee details total data
            uan_pending: { $ifNull: ["$employee_detail.uan_pending", 0] },
            ip_pending: { $ifNull: ["$employee_detail.ip_pending", 0] },
            bank_details_pending: {
              $ifNull: ["$employee_detail.bank_details_pending", 0],
            },

            //challans total data
            total_challans_count: {
              $ifNull: ["$challan.total_challans_count", 0],
            },
            pending_pf_challan_count: {
              $ifNull: ["$challan.pending_pf_challan_count", 0],
            },
            pending_esic_challan_count: {
              $ifNull: ["$challan.pending_esic_challan_count", 0],
            },
            staffs: 1,
            employee_advances: 1,
            employee_leaves: 1,
            bank_instructions: 1,
          },
        },
      ]);
      Company.aggregatePaginate(
        myAggregate,
        null,
        async (err, dashboard_data) => {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp.status(200).send({
            status: "success",
            message: "",
            dashboard_data: dashboard_data.docs[0],
          });
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_company_dashboard_chart_data: async function (req, resp) {
    try {
      var sortoption = { created_at: -1 };
      const options = {
        page: req.body.pageno,
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var search_option = { $match: {} };

      let financial_year_end_month = new Date(
        req.body.financial_year_end
      ).getMonth();
      let financial_year_end_date = new Date(
        req.body.financial_year_end
      ).getDate();

      let challan_date_filter = JSON.parse(req.body.challan_date_filter);
      let emp_date_filter = JSON.parse(req.body.emp_date_filter);

      if (req.body.challan_filter_type == "financial_year") {
        var challan_from = new Date(
          challan_date_filter.from,
          financial_year_end_month,
          financial_year_end_date
        );

        var challan_to = new Date(
          challan_date_filter.to,
          financial_year_end_month,
          financial_year_end_date
        );
      } else {
        var challan_from = new Date(challan_date_filter.from);
        var challan_to = new Date(challan_date_filter.to);
      }

      let emp_created_from = new Date(
        emp_date_filter.from,
        financial_year_end_month,
        financial_year_end_date
      );

      let emp_created_to = new Date(
        emp_date_filter.to,
        financial_year_end_month,
        financial_year_end_date
      );

      search_option.$match.corporate_id = { $eq: req.authData.corporate_id };

      var myAggregate = Company.aggregate([
        search_option,
        {
          $lookup: {
            from: "companies_monthly_data_logs",
            let: { id_var: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$company_id", "$$id_var"] } },
                    {
                      $or: [
                        { wage_year: { $gt: emp_created_from.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: emp_created_from.getFullYear(),
                              },
                            },
                            {
                              wage_month: { $gte: emp_created_from.getMonth() },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: emp_created_to.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: { $eq: emp_created_to.getFullYear() },
                            },
                            { wage_month: { $lt: emp_created_to.getMonth() } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            as: "companies_monthly_data_logs",
          },
        },
        {
          $lookup: {
            from: "challans",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    {
                      $or: [
                        { wage_year: { $gt: challan_from.getFullYear() } },
                        {
                          $and: [
                            { wage_year: { $eq: challan_from.getFullYear() } },
                            { wage_month: { $gte: challan_from.getMonth() } },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: challan_to.getFullYear() } },
                        {
                          $and: [
                            { wage_year: { $eq: challan_to.getFullYear() } },
                            { wage_month: { $lt: challan_to.getMonth() } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                $group: {
                  _id: null, // Grouping by status
                  total_challans_count: { $sum: 1 }, // Count of employees with this status
                  pf_on_time_payments: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$challan_for", "pf"] },
                            {
                              $lt: [
                                "$payment_confirmation.date_of_credit",
                                "$due_date",
                              ],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  esic_on_time_payments: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$challan_for", "esic"] },
                            { $lt: ["$challan_submited", "$due_date"] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "challans",
          },
        },
        {
          $addFields: {
            challan: {
              $arrayElemAt: ["$challans", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            employees: { $ifNull: ["$companies_monthly_data_logs", []] },
            total_challans_count: "$challan.total_challans_count",
            pf_on_time_payments: "$challan.pf_on_time_payments",
            esic_on_time_payments: "$challan.esic_on_time_payments",
          },
        },
      ]);
      Company.aggregatePaginate(
        myAggregate,
        null,
        async (err, dashboard_data) => {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp.status(200).send({
            status: "success",
            message: "",
            dashboard_data: dashboard_data.docs[0],
          });
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_company_dashboard_financial_data: async function (req, resp) {
    try {
      var sortoption = { created_at: -1 };
      const options = {
        page: req.body.pageno,
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var search_option = { $match: {} };
      let financial_date_filter = JSON.parse(req.body.financial_date_filter);

      var financial_year_from = new Date(
        financial_date_filter.from,
        new Date(req.body.financial_year_end).getMonth(),
        new Date(req.body.financial_year_end).getDate()
      );
      var financial_year_to = new Date(
        financial_date_filter.to,
        new Date(req.body.financial_year_end).getMonth(),
        new Date(req.body.financial_year_end).getDate()
      );

      search_option.$match.corporate_id = { $eq: req.authData.corporate_id };

      var myAggregate = Company.aggregate([
        search_option,
        {
          $lookup: {
            from: "challans",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { status: { $eq: "active" } },
                    {
                      $or: [
                        {
                          wage_year: { $gt: financial_year_from.getFullYear() },
                        },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: financial_year_from.getFullYear(),
                              },
                            },
                            {
                              wage_month: {
                                $gte: financial_year_from.getMonth(),
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: financial_year_to.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: financial_year_to.getFullYear(),
                              },
                            },
                            {
                              wage_month: {
                                $lt: financial_year_to.getMonth(),
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                $group: {
                  _id: "$wage_month",

                  total_pf_pending: {
                    $sum: { $cond: [{ $eq: ["$challan_for", "pf"] }, 1, 0] },
                  },
                  total_pf_amount: {
                    $sum: {
                      $cond: [
                        { $eq: ["$challan_for", "pf"] },
                        "$total_challan_amount",
                        0,
                      ],
                    },
                  },

                  total_esic_pending: {
                    $sum: { $cond: [{ $eq: ["$challan_for", "esic"] }, 1, 0] },
                  },
                  total_esic_amount: {
                    $sum: {
                      $cond: [
                        { $eq: ["$challan_for", "esic"] },
                        "$total_challan_amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "challans",
          },
        },

        {
          $lookup: {
            from: "hold_salary_emps",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { status: { $eq: "active" } },
                    {
                      $or: [
                        {
                          wage_year: {
                            $gt: String(financial_year_from.getFullYear()),
                          },
                        },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: String(financial_year_from.getFullYear()),
                              },
                            },
                            {
                              wage_month: {
                                $gte: String(financial_year_from.getMonth()),
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        {
                          wage_year: {
                            $lt: String(financial_year_to.getFullYear()),
                          },
                        },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: String(financial_year_to.getFullYear()),
                              },
                            },
                            {
                              wage_month: {
                                $lt: String(financial_year_to.getMonth()),
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: "employee_details",
                  localField: "emp_db_id",
                  foreignField: "employee_id",
                  as: "employee_details",
                },
              },
              {
                $addFields: {
                  employee_detail: {
                    $arrayElemAt: ["$employee_details", 0],
                  },
                },
              },
              {
                $group: {
                  _id: "$wage_month",
                  hold_salary: { $sum: 1 },
                  total_gross_salary: {
                    $sum:"$employee_detail.employment_hr_details.gross_salary"
                    // $sum: {
                      // $toDouble:
                      //   "$employee_detail.employment_hr_details.gross_salary",
                    // },
                  },
                },
              },
            ],
            as: "hold_salary_emps",
          },
        },

        {
          $lookup: {
            from: "bank_instructions",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { status: { $eq: "active" } },
                    { pay_type: { $eq: "salary" } },
                    {
                      $or: [
                        {
                          wage_year: { $gt: financial_year_from.getFullYear() },
                        },

                        // Match documents where wage_year is equal to start_year
                        // and wage_month is greater than or equal to start_month
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: financial_year_from.getFullYear(),
                              },
                            },
                            {
                              wage_month: {
                                $gte: financial_year_from.getMonth(),
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: financial_year_to.getFullYear() } },

                        // Match documents where wage_year is equal to end_year
                        // and wage_month is less than or equal to end_month
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: financial_year_to.getFullYear(),
                              },
                            },
                            {
                              wage_month: {
                                $lt: financial_year_to.getMonth(),
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: "employee_monthly_reports",
                  localField: "file_id",
                  foreignField: "salary_report.bank_ins_referance_id",
                  as: "employee_monthly_reports",
                },
              },
              {
                $addFields: {
                  employee_monthly_report: {
                    $arrayElemAt: ["$employee_monthly_reports", 0],
                  },
                },
              },
              {
                $group: {
                  _id: "$wage_month",
                  unpaid_salary: { $sum: 1 },
                  total_gross_earning: {
                    $sum: "$employee_monthly_report.salary_report.gross_earning",
                  },
                },
              },
            ],
            as: "bank_instructions",
          },
        },

        {
          $project: {
            _id: 1,
            challans: 1,
            hold_salary_emps: 1,
            bank_instructions: 1,
          },
        },
      ]);
      Company.aggregatePaginate(
        myAggregate,
        null,
        async (err, dashboard_data) => {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp.status(200).send({
            status: "success",
            message: "",
            dashboard_data: dashboard_data.docs[0],
          });
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_company_dashboard_ctc_data: async function (req, resp) {
    try {
      var sortoption = { created_at: -1 };
      const options = {
        page: req.body.pageno,
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var search_option = { $match: {} };

      // let ctc_date_filter = req.body.ctc_date_filter;
      let ctc_date_filter = JSON.parse(req.body.ctc_date_filter);

      var ctc_from = new Date(
        ctc_date_filter.from,
        new Date(req.body.financial_year_end).getMonth(),
        new Date(req.body.financial_year_end).getDate()
      );
      var ctc_to = new Date(
        ctc_date_filter.to,
        new Date(req.body.financial_year_end).getMonth(),
        new Date(req.body.financial_year_end).getDate()
      );

      search_option.$match.corporate_id = { $eq: req.authData.corporate_id };

      var myAggregate = Company.aggregate([
        search_option,
        {
          $lookup: {
            from: "companies_monthly_data_logs",
            let: { id_var: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$company_id", "$$id_var"] } },
                    {
                      $or: [
                        { wage_year: { $gt: ctc_from.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: ctc_from.getFullYear(),
                              },
                            },
                            {
                              wage_month: { $gte: ctc_from.getMonth() },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: ctc_to.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: { $eq: ctc_to.getFullYear() },
                            },
                            { wage_month: { $lt: ctc_to.getMonth() } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                $group: {
                  _id: "$wage_month",
                  total_report: { $sum: 1 },
                  total_budget: { $first:"$company_budget" },
                },
              },
            ],
            as: "companies_monthly_data_logs",
          },
        },
        {
          $lookup: {
            from: "employee_monthly_reports",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    {
                      $or: [
                        { wage_year: { $gt: ctc_from.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: ctc_from.getFullYear(),
                              },
                            },
                            {
                              wage_month: { $gte: ctc_from.getMonth() },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: ctc_to.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: { $eq: ctc_to.getFullYear() },
                            },
                            { wage_month: { $lt: ctc_to.getMonth() } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                $group: {
                  _id: "$wage_month",
                  total_report: { $sum: 1 },
                  total_gross_salary: {$sum: {$ifNull:["$total_data.total_ctc",0]}}
                },
              },
            ],
            as: "employee_monthly_reports",
          },
        },

        {
          $project: {
            _id: 1,
            companies_monthly_data_logs:1,
            employee_monthly_reports:1,
          },
        },
      ]);
      Company.aggregatePaginate(
        myAggregate,
        null,
        async (err, dashboard_data) => {
          if (err)
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          return resp.status(200).send({
            status: "success",
            message: "",
            dashboard_data: dashboard_data.docs[0],
          });
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },


  edit_dashboard_content: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        // content_visible: 'required|boolean',
        // content_credit: 'required|boolean',
        content_visible: 'boolean',
        content_credit: 'boolean',
        datarange: 'boolean',
        corporate_id: 'required'  
      });

      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: 'val_err',
          message: "Validation error",
          val_msg: v.errors
        });
      }

     
      const contentData = {
        content_visible: req.body.content_visible,  
        content_credit: req.body.content_credit,  
        datarange: req.body.datarange,  
        dashboard_sections: req.body.dashboard_sections,
        updated_at: Date.now(),  
      };

      // Assuming you have a model for dashboard content (replace 'DashboardContent' with your actual model)
       // Adjust according to your file structure

      // Save or update the content in the database
      const result = await DashboardContent.findOneAndUpdate(
        { corporate_id: req.body.corporate_id }, 
        contentData,
        { new: true, upsert: true }  // Create if doesn't exist
      );

      // Return success response
      return resp.status(200).send({
        status: 'success',
        message: 'Dashboard content visibility updated successfully',
        content_data: result,
      });

    } catch (e) {
      return resp.status(500).json({
        status: 'error',
        message: e ? e.message : 'Something went wrong',
      });
    }
  },

  get_dashboard_content: async function (req, res) {
    try {
      const corporateId = req.query.corporate_id || "VBL"; // default to "VBL"
  
      const result = await DashboardContent.findOne({ corporate_id: corporateId });
  
      if (!result) {
        return res.status(404).json({
          status: 'not_found',
          message: 'Dashboard content not found for the provided corporate_id'
        });
      }
  
      return res.status(200).json({
        status: 'success',
        content_visible: result.content_visible,
        content_credit: result.content_credit,
        datarange: result.datarange,
        dashboard_sections: result.dashboard_sections || []
      });
  
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Something went wrong'
      });
    }
  },
  




  changeType : async(req, res) => {
    const field = req.body.field_name
    employee_advances.find({ [field]: { $type: "string" } }).then((docs) => {
      // Iterate through the found documents
      docs.forEach(async (doc) => {
        // Convert the "gross_salary" field to a double and update the document
        const updatedSalary = doc[field];
        
        // Update the document with the new double value
        await employee_advances.updateOne(
          { _id: doc._id },
          { $set: { [field]: updatedSalary } }
        );
      });
    });
  }

};
