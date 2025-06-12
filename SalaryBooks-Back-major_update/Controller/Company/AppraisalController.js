const { Validator } = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var Employee = require("../../Model/Company/employee");
const Appraisal = require("../../Model/Company/Appraisal");
const mongoose = require("mongoose");
var xl = require("excel4node");
var fs = require("fs");

module.exports = {
  add_employee_appraisal: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
        rating_year: "required",
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
          emp_db_id: req.body.employee_id,
          emp_id: req.body.emp_id,
          rating_year: req.body.rating_year,
          total_rating: 0,
          calculated_rating: 0,
        };

        document.heads_data = req.body.kpi_rating_data.map((d) => {
          document.total_rating += d.assign_value;
          return {
            head_name: d.head_name,
            head_value: d.head_value,
            assign_value: d.assign_value,
          };
        });

        let contributor = req.body.contributors.find(
          (d) =>
            d.assignee_id == (req.authData.userdb_id || req.authData.user_id)
        );  

        if (contributor) {
          document.rate_contributor = {
            contributor_id: contributor.assignee_id,
            assign_value: contributor.assign_value,
          };

          document.calculated_rating =
            (document.total_rating / 100) *
            document.rate_contributor.assign_value;
        }

        Appraisal.updateOne(
          { "rate_contributor.contributor_id": req.authData.userdb_id || req.authData.user_id },
          document,
          { upsert: true, new: true, setDefaultsOnInsert: true },
          function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            }
            return resp.status(200).send({
              status: "success",
              message: "kpi detail added successfully",
              emp_det: emp_det,
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
  get_employee_appraisal: async function (req, resp, next) {
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

      if (req.body.employee_id) {
        search_option = {
          $match: {
            _id: mongoose.Types.ObjectId(req.body.employee_id),
          },
        };
        // search_option_details.$match["appraisals.rate_contributor"] = mongoose.Types.ObjectId(req.authData.userdb_id || req.authData.user_id);
      } else {
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
      }
      search_option_details.$match["employee_details.kpi_and_appraisal"] = {
        $exists: true,
        $ne: null,
      };
      search_option_details.$match[
        "employee_details.kpi_and_appraisal.status"
      ] = { $eq: "active" };

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
            from: "appraisals",
            let: { employee_id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$emp_db_id", "$$employee_id"] },
                  ["rate_contributor.contributor_id"]: mongoose.Types.ObjectId(
                    req.authData.userdb_id || req.authData.user_id
                  ),
                },
              },
            ],
            as: "appraisals",
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
            appraisal: {
              $arrayElemAt: ["$appraisals", 0],
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
            employee_detail: 1,
            appraisal: 1,
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
  },
  employee_appraisal_report: async function (req, resp, next) {
    const v = new Validator(req.body, {
      rating_year: "required",
      listType: "required",
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
        limit: req.body.perpage,
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
        search_option_details = query_data.search_option_details;
        search_option = query_data.search_option;
      }

      search_option_details.$match["employee_details.kpi_and_appraisal"] = {
        $exists: true,
        $ne: null,
      };
      search_option_details.$match["appraisals.heads_data"] = {
        $exists: true,
        $ne: null,
      };
      search_option_details.$match["appraisals.rating_year"] = {
        $eq: req.body.rating_year
      };
      search_option_details.$match[
        "employee_details.kpi_and_appraisal.status"
      ] = { $eq: "active" };

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
            from: "appraisals",
            localField: "_id",
            foreignField: "emp_db_id",
            as: "appraisals",
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
            // appraisal: {
            //   $arrayElemAt: ["$appraisals", 0],
            // },
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
            employee_detail: 1,
            appraisals: 1,
          },
        },
      ]);
      if (req.body.listType === "report") {
        Employee.aggregatePaginate(
          myAggregate,
          options,
          async function (err, res) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            return resp.status(200).json({ status: "success", docs: res });
          }
        );
      } else {
        myAggregate.then((res) => {
          return resp.status(200).json({ status: "success", docs: res });
        });
      }
    }
  },
  export_appraisal_report_excel: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        rating_year: "required",
        list_type: "required",
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
          page: req.body.pageno,
          limit: req.body.perpage,
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
          search_option_details = query_data.search_option_details;
          search_option = query_data.search_option;
        }

        search_option_details.$match["employee_details.kpi_and_appraisal"] = {
          $exists: true,
          $ne: null,
        };
        search_option_details.$match["appraisals.heads_data"] = {
          $exists: true,
          $ne: null,
        };
        search_option_details.$match[
          "employee_details.kpi_and_appraisal.status"
        ] = { $eq: "active" };

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
              from: "appraisals",
              localField: "_id",
              foreignField: "emp_db_id",
              as: "appraisals",
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
              // appraisal: {
              //   $arrayElemAt: ["$appraisals", 0],
              // },
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
              appraisals: 1,
            },
          },
        ]).then(async (reportdata) => {
          if (reportdata.length > 0) {
            list_type = req.body.list_type
            var wb = new xl.Workbook();

            var ws = wb.addWorksheet("Sheet 1");

            ws.cell(1, 1).string("SL. NO.");
            ws.cell(1, 2).string("EMP ID");
            ws.cell(1, 3).string("EMPLOYEE NAME");
            ws.cell(1, 4).string("DEPARTMENT");
            ws.cell(1, 5).string("DESIGNATION");
            ws.cell(1, 6).string("BRANCH");
            ws.cell(1, 7).string("CLIENT");
            ws.cell(1, 8).string("HOD");
            ws.cell(1, list_type == "summary" ? 9 : 11).string(
              "SELF ASSIGN RATE"
            );
            ws.cell(1, list_type == "summary" ? 10 : 12).string(
              "LEVEL 1 ASSIGN RATE"
            );
            ws.cell(1, list_type == "summary" ? 11 : 13).string(
              "LEVEL 2 ASSIGN RATE"
            );
            ws.cell(1, list_type == "summary" ? 12 : 14).string(
              "OVERALL RATING"
            );

            var row_counter = 1;

            if (list_type == "detailed") {
              ws.cell(1, 9, 1, 10, true).string("HEADS");
              ws.cell(2, 1, 2, 8, true).string("");
              ws.cell(2, 9).string("HEAD NAME");
              ws.cell(2, 10).string("ASSIGN VALUE");
              ws.cell(2, 11, 2, 14, true).string("");
              var row_counter = 2;
            }

            var sl_no = 0;
            var report = reportdata;
            await Promise.all(
              report.map(async (report_data_exp) => {
                row_counter = row_counter + 1;
                sl_no = sl_no + 1;
                var emp_data = report_data_exp.employee_details;
                var appraisals = report_data_exp.appraisals;
                var rating_heads = [];
                report_data_exp.appraisals.forEach((ap) => {
                  rating_heads.push(
                    ...ap.heads_data.map((h) => {
                      if (
                        !rating_heads.find((el) => el.head_name === h.head_name)
                      ) {
                        return h;
                      }
                    })
                  );
                });
                rating_heads = [...new Set(rating_heads)];
                self_assign_data = appraisals.find(
                  (ap) =>
                    String(ap.rate_contributor.contributor_id) ==
                    String(
                      emp_data.kpi_and_appraisal["self_assignee"].assignee_id
                    )
                );
                lvl_1_assign_data = appraisals.find(
                  (ap) =>
                    String(ap.rate_contributor.contributor_id) ==
                    String(
                      emp_data.kpi_and_appraisal["lvl_1_assignee"].assignee_id
                    )
                );
                lvl_2_assign_data = appraisals.find(
                  (ap) =>
                    String(ap.rate_contributor.contributor_id) ==
                    String(
                      emp_data.kpi_and_appraisal["lvl_2_assignee"].assignee_id
                    )
                );

                const overallRating = (self_assign_data?.calculated_rating ?? 0) + (lvl_1_assign_data?.calculated_rating ?? 0) + (lvl_2_assign_data?.calculated_rating ?? 0 ) 

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

                if (list_type == "summary") {
                  ws.cell(row_counter, 9).number(
                    self_assign_data ? self_assign_data.total_rating : 0
                  );
                  ws.cell(row_counter, 10).number(
                    lvl_1_assign_data ? lvl_1_assign_data.total_rating : 0
                  );
                  ws.cell(row_counter, 11).number(
                    lvl_2_assign_data ? lvl_2_assign_data.total_rating : 0
                  );
                  ws.cell(row_counter, 12).number(overallRating ?? 0);
                } else if (list_type == "detailed") {
                  ws.cell(row_counter, 14).number(overallRating?? 0);
                  Promise.all(
                    rating_heads.map(async (head) => {
                      if (head) {
                        ws.cell(row_counter, 9).string(head.head_name);
                        ws.cell(row_counter, 10).number(head.head_value);
                      }
                      row_counter++;
                    })
                  );

                  row_counter -= rating_heads.length;

                  Promise.all(
                    self_assign_data.heads_data.map(async (head) => {
                      ws.cell(row_counter, 11).number(head.assign_value);
                      row_counter++;
                    })
                  );
                  row_counter -= self_assign_data.heads_data.length;
                  if(lvl_1_assign_data){
                    if(lvl_1_assign_data.heads_data){
                      if(lvl_1_assign_data.heads_data.length > 0){
                        Promise.all(
                          lvl_1_assign_data.heads_data.map(async (head) => {
                            ws.cell(row_counter, 12).number(head.assign_value);
                            row_counter++;
                          })
                        );
                      }
                      row_counter -= lvl_1_assign_data.heads_data.length;
                    }
                  }
                  if(lvl_2_assign_data){
                    if(lvl_2_assign_data.heads_data){
                      if(lvl_2_assign_data.heads_data.length > 0){
                        Promise.all(
                          lvl_2_assign_data.heads_data.map(async (head) => {
                            ws.cell(row_counter, 13).number(head.assign_value);
                            row_counter++;
                          })
                        );
                      }
                      row_counter -= 1;
                    }
                  }
                }

                // var report_heads_rate=master_report.heads;
                // Promise.all(report_heads_rate.map(async (report_heads_rate_exp) => {
                //   ws.cell( row_counter,excel_array[report_heads_rate_exp.head_abbreviation+'_rate']).number(report_heads_rate_exp.amount);
                // }));
              })
            );
            const file_name = req.body.rating_year + "-appraisal-sheet.xlsx";
            // wb.write(mastersheet_name);
            var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/appraisal-module');

          }
          // file_name = req.body.rating_year + "-appraisal-sheet.xlsx";
          // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
          // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
          
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
};
