var Challans = require("../../Model/Company/Challans");
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require("node-input-validator");
const mongoose = require("mongoose");
const monthly_reports = require("../../Model/Company/EmployeeMonthlyReport");
const Employee = require("../../Model/Company/employee");
const Company = require("../../Model/Admin/Company");
const employeeDetails = require("../../Model/Company/employee_details");
const CompanyCreditHistoryLog = require("../../Model/Admin/CompanyCreditHistoryLog");
const Plan = require("../../Model/Admin/Plan");
const credit = require("../../Model/Company/CreditPurchase");
const CompanyCreditUsage = require("../../Model/Admin/CompanyMonthlyCreditUsage");
const Reseller = require("../../Model/Admin/Reseller");
const Coupon = require("../../Model/Admin/Coupon");

module.exports = {
  get_admin_dashboard_total_data: async function (req, resp) {
    try {
      var sortoption = { created_at: -1 };
      const options = {
        page: req.body.pageno,
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var search_option = { $match: {} };

      var active_company = await Company.find({
        status: "active",
        suspension: "active",
      }).count();
      var deactived_company = await Company.find({
        status: "inactive",
      }).count();
      var suspended_company = await Company.find({
        suspension: "suspended",
      }).count();
      var active_employee = await Employee.find({ status: "active" }).count();
      
      var low_balance_company = await Company.find({
          status: "active",
          credit_stat:{$lte:0}
          // $where: function () {
          //   return this.;
          // },
      }).count();

      var high_balance_company = await Company.aggregate([
        { $match: { status: "active", credit_stat: { $gt: 0 } } },
        { $group: { _id: null, balance: { $sum: "$credit_stat" } } },
      ]);

      var dashboard_data = {
        active_company: active_company,
        deactived_company: deactived_company,
        suspended_company: suspended_company,
        active_employee: active_employee,
        low_balance_company,
        company_un_utilised: high_balance_company[0]
          ? high_balance_company[0].balance
          : 0,
      };
      return resp.status(200).send({
        status: "success",
        message: "",
        data: dashboard_data,
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_admin_dashboard_graph_data: async function (req, resp) {
    try {
      var search_option = { $match: {} };
      var search_option_details = { $match: {} };
      if (req.body.filter_type == "cradit_consumed") {
        search_option.$match = { type: "consumed" };
      } else if (req.body.filter_type == "cradit_sales") {
        search_option.$match = { type: "credit" };
      } else if (req.body.filter_type == "plan_wise") {
        search_option.$match = { status: "active" };
      } else if (req.body.filter_type == "monthly_acquisition") {
        search_option.$match = { status: "active" };
      }

      let date_filter = req.body.date_filter
        ? JSON.parse(req.body.date_filter)
        : "";
        let startDate = new Date(date_filter.from)
        let endDate = new Date(date_filter.to)
      if (
        req.body.filter_type == "cradit_consumed" ||
        req.body.filter_type == "cradit_sales"
      ) {
        var myAggregate = CompanyCreditHistoryLog.aggregate([
          search_option,
          {
            $match: {
              $and: [
                {
                  $or: [
                    { wage_year: { $gt: startDate.getFullYear() } },
                    {
                      $and: [
                        {
                          wage_year: {
                            $eq: startDate.getFullYear(),
                          },
                        },
                        {
                          wage_month: { $gte: startDate.getMonth() },
                        },
                      ],
                    },
                  ],
                },
                {
                  $or: [
                    { wage_year: { $lt: endDate.getFullYear() } },
                    {
                      $and: [
                        {
                          wage_year: { $eq: endDate.getFullYear() },
                        },
                        { wage_month: { $lt: endDate.getMonth() } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          // {
          //   $addFields: {
          //     challan: {
          //       $arrayElemAt: ["$challans", 0],
          //     },
          //   },
          // },
          {
            $project: {
              _id: 1,
              corporate_id: 1,
              wage_month: 1,
              wage_year: 1,
              company_id: 1,
              type: 1,
              status: 1,
              balance: 1,
              created_at: 1,
              updated_at: 1,
            },
          },
        ])
        myAggregate.then(async (logs) => {
          var final_array = [];
          await Promise.all(
            logs.map(function (log) {
              if (!this[log.wage_month]) {
                this[log.wage_month] = {
                  wage_month: log.wage_month,
                  balance: 0,
                };
                final_array.push(this[log.wage_month]);
              }
              this[log.wage_month].balance += log.balance;
            }, Object.create(null))
          ).then((e) => {
            return resp.status(200).send({
              status: "success",
              message: "",
              data: final_array
                .slice()
                .sort((a, b) => a.wage_month - b.wage_month),
            });
          });
        });
      } else if (req.body.filter_type == "plan_wise") {
        var myAggregate = Plan.aggregate([
          search_option,
          {
            $lookup: {
              from: "companies",
              let: { id_var: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$plan_id", "$$id_var"] } },
                      { status: { $eq: "active" } },
                    ],
                  },
                },
              ],
              as: "companies",
            },
          },
          {
            $addFields: {
              total_company: {
                $size: "$companies",
              },
            },
          },
          {
            $project: {
              _id: 1,
              plan_name: 1,
              status: 1,
              total_company: 1,
              created_at: 1,
              updated_at: 1,
            },
          },
        ]).then(async (plan) => {
          return resp.status(200).send({
            status: "success",
            message: "",
            data: plan,
          });
        });
      } else if (req.body.filter_type == "monthly_acquisition") {
        var myAggregate = Company.aggregate([
          search_option,
          {
            $project: {
              _id: 1,
              plan_name: 1,
              status: 1,
              total_company: 1,
              created_at: 1,
              updated_at: 1,
            },
          },
        ]).then(async (companies) => {
          var month_year_array = [
            { month_year: "1-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "2-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "3-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "4-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "5-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "6-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "7-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "8-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "9-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "10-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "11-" + startDate.getFullYear(), total_company: 0 },
            { month_year: "12-" + startDate.getFullYear(), total_company: 0 },
          ];

          await Promise.all(
            companies.map(async function (company) {
              let createdAt = new Date(company.created_at)
              // var createdAt = company.created_at
              //   .toLocaleDateString()
              //   .split(/[/]/);
              company.month_year = (createdAt.getMonth() + 1) + "-" + createdAt.getFullYear();
              await Promise.all(
                month_year_array.map(async function (month_year_arr) {
                  if (month_year_arr.month_year === company.month_year) {
                    month_year_arr.total_company += 1;
                  }
                })
              );
            }, Object.create(null))
          ).then((e) => {
            return resp.status(200).send({
              status: "success",
              message: "",
              data: month_year_array,
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
  purchased_plans_graph_data: async function (req, resp) {
    try {
      let v = new Validator(req.body, {
        startDate: "required",
        endDate: "required",
      });
      if (!(await v.check())) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }

      await Plan
        .aggregate([
          {
            $match: {}
          },
          {
              $lookup: {
                from: "companies",
                let: { id_var: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$plan_id", "$$id_var"] } },
                       { created_at: {
                          $gte: new Date(req.body.startDate),
                          $lte: new Date(req.body.endDate),
                        }},
                      ],
                    },
                  },
                  {
                    $group: {
                      _id: "$plan_id", 
                      count: { $sum: 1 }, 
                    },
                  },
                ],
                as: "companies",
            },
          },
          {
            $addFields: {
              company: {
                $arrayElemAt: ["$companies", 0],
              },
             
            },
          },
          {
            $project: {
              _id: 1, 
              plan_name:1,
              count:{$ifNull:["$company.count", 0]}
            },
          },
        ])
        .exec((err, docs) => {
          if (err) throw err;
          return resp.status(200).send({
            status: "success",
            data: docs,
          });
        });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message || e : "Something went wrong",
      });
    }
    },
  promo_redemption_graph_data: async function (req, resp) {
    try {
      let v = new Validator(req.body, {
        startDate: "required",
        endDate: "required",
      });
      if (!(await v.check())) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }

      await Coupon
        .aggregate([
          {
            $match: {}
          },
          {
            $lookup: {
              from: "credit_purchases",
              let: { coupon_code_var: "$coupon_code" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$coupon_code", "$$coupon_code_var"] } },
                      { created_at: {
                        $gte: new Date(req.body.startDate),
                        $lte: new Date(req.body.endDate),
                      }},
                    ],
                  },
                },
                {
                  $group: {
                    _id: "$coupon_code", 
                    count: { $sum: 1 }, 
                  },
                },
              ],
              as: "credit_purchases",
          },
        },
        {
          $addFields: {
            credit_purchase: {
              $arrayElemAt: ["$credit_purchases", 0],
            },
           
          },
        },
          {
            $project: {
              _id: 1, // field group by
              coupon_code:1,
              count:{$ifNull:["$credit_purchase.count", 0]}
            },
          },
        ])
        .exec((err, docs) => {
          if (err) throw err;
          return resp.status(200).send({
            status: "success",
            data: docs,
          });
        });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message || e : "Something went wrong",
      });
    }
  },
  admin_dashboard_ctc_data: async function (req, resp) {
    try {
      let v = new Validator(req.body, {
        startDate: "required",
        endDate: "required",
      });
      if (!(await v.check())) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        }); 
      }

      var search_option = { $match: {} };

      let startDate = new Date(req.body.startDate);
      let endDate = new Date(req.body.endDate);

      search_option.$match = { status: "active" };

      let total_budget = await Company.aggregate([
        search_option,
        {
          $lookup: {
            from: "companies_monthly_data_logs",
            let: { corporate_id_var: "$corporate_id" },
            // let: { id_var: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    // { $expr: { $eq: ["$company_id", "$$id_var"] } },
                    { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
                    { wage_month: { $ne: null } },
                    {
                      $or: [
                        { wage_year: { $gt: startDate.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: startDate.getFullYear(),
                              },
                            },
                            {
                              wage_month: { $gte: startDate.getMonth() },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: endDate.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: { $eq: endDate.getFullYear() },
                            },
                            { wage_month: { $lt: endDate.getMonth() } },
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
                  total_budget: { $first: "$company_budget" },
                },
              },
            ],
            as: "companies_monthly_data_logs",
          },
        },

        {
          $unwind: "$companies_monthly_data_logs", // Deconstruct the array for grouping
        },
        {
          $group: {
            _id: "$companies_monthly_data_logs._id",
            total_budget: { $sum: "$companies_monthly_data_logs.total_budget" },
          },
        },
      ]);

      let filter = [
        { $expr: { $eq: ["$corporate_id", "$$corporate_id_var"] } },
        {
          $or: [
            { wage_year: { $gt: startDate.getFullYear() } },
            {
              $and: [
                {
                  wage_year: {
                    $eq: startDate.getFullYear(),
                  },
                },
                {
                  wage_month: { $gte: startDate.getMonth() },
                },
              ],
            },
          ],
        },
        {
          $or: [
            { wage_year: { $lt: endDate.getFullYear() } },
            {
              $and: [
                {
                  wage_year: { $eq: endDate.getFullYear() },
                },
                { wage_month: { $lte: endDate.getMonth() } },
              ],
            },
          ],
        },
      ]
      let total_ctc = await Company.aggregate([
        search_option,
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
                        { wage_year: { $gt: startDate.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: {
                                $eq: startDate.getFullYear(),
                              },
                            },
                            {
                              wage_month: { $gte: startDate.getMonth() },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $or: [
                        { wage_year: { $lt: endDate.getFullYear() } },
                        {
                          $and: [
                            {
                              wage_year: { $eq: endDate.getFullYear() },
                            },
                            { wage_month: { $lt: endDate.getMonth() } },
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
                  total_gross_salary: {
                    $sum: { $ifNull: ["$total_data.total_ctc", 0] },
                  },
                },
              },
            ],
            as: "employee_monthly_reports",
          },
        },

        // Group employee_monthly_reports by wage_month
        {
          $unwind: "$employee_monthly_reports", // Deconstruct the array for grouping
        },
        {
          $group: {
            _id: "$employee_monthly_reports._id",
            total_gross_salary: {
              $sum: "$employee_monthly_reports.total_gross_salary",
            },
          },
        },
      ]);

      return resp.status(200).send({
        status: "success",
        data: {
          total_ctc,
          total_budget,
        },
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  top_credit_usage_users: async function (req, resp) {
    try {
      let search_option = {$match:{status:"active"}};
       
      let top_corp = await Company.aggregate([
        search_option,
        {
          $lookup: {
            from: "company_monthly_credit_usages",
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
                  _id: "$corporate_id",
                  total_credit_usage: {
                    $sum: { $ifNull: ["$total_cost", 0] },
                  },
                },
              },
            ],
            as: "company_monthly_credit_usages",
          },
        },
        {
          $addFields: {
            company_monthly_credit_usage: {
              $arrayElemAt: ["$company_monthly_credit_usages", 0],
            },
          },
        },
        {
          $sort: {
            "company_monthly_credit_usage.total_credit_usage": -1 
          }
        },
        {
          $project:{
            _id:1,
            establishment_name:1,
            userid:1,
            corporate_id:1,
            credit_stat:1,
            credit_used:1,
            company_monthly_credit_usage:1,
          }
        }
      ]).limit(10);
      let top_reseller = await Reseller.aggregate([
        search_option,
        {
          $lookup: {
            from: "companies",
            let: { id: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$reseller_id", "$$id"] } },
                  ],
                },
              },
              {
                $lookup: {
                  from: "company_monthly_credit_usages",
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
                        _id: "$corporate_id",
                        total_credit_usage: {
                          $sum: { $ifNull: ["$total_cost", 0] },
                        },
                      },
                    },
                  ],
                  as: "company_monthly_credit_usages",
                },
              },
              {
                $addFields: {
                  company_monthly_credit_usage: {
                    $arrayElemAt: ["$company_monthly_credit_usages", 0],
                  },
                },
              },
              {
                $group:{
                  _id:'null',
                  company_monthly_credit_usage: {$sum: { $ifNull: ["$company_monthly_credit_usage.total_credit_usage", 0] }},
                }
              }
            ],
            as: "companies",
          },
        },
        {
          $addFields: {
           company: {
              $arrayElemAt: ["$companies", 0],
            },
          },
        },
        {
          $sort: {
            "company.company_monthly_credit_usage": -1 
          }
        },
        {
          $project:{
            _id:1,
            reseller_name:1,
            corporate_id:1,
            credit_used:{$ifNull:["$company.company_monthly_credit_usage", 0]},
          }
        }
      ]).limit(10);

      return resp.status(200).send({
        status: "success",  
        data: {
          top_corp,
          top_reseller,
        },
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
};
