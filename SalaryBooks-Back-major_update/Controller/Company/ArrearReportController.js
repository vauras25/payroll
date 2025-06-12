var BonusTemp = require("../../Model/Admin/BonusTemp");
const { Validator } = require("node-input-validator");
var Site_helper = require("../../Helpers/Site_helper");
var Employee = require("../../Model/Company/employee");
var BonusModule = require("../../Model/Company/BonusModule");
var Ptaxrule = require("../../Model/Admin/Ptaxrule");
const mongoose = require("mongoose");
var EmployeeMonthlyReport = require("../../Model/Company/EmployeeMonthlyReport");
var Company = require("../../Model/Admin/Company");
var ArrearPayslip = require("../../Model/Company/ArrearPayslip");
const EmployeeSheetTemplate=require('../../Model/Company/EmployeeSheetTemplate');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const moment = require('moment');
const archiver = require('archiver');
const {resolve} = require('path');
const absolutePath = resolve('');
module.exports = {
  employee_arrear_slip_report_export: async function (req, resp, next) {
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
      // var start_month = parseInt(req.body.wage_month_from);
      // var start_year = parseInt(req.body.wage_year_from);
      // var end_month = parseInt(req.body.wage_month_to);
      // var end_year = parseInt(req.body.wage_year_to);
      var wage_month = parseInt(+req.body.wage_month);
      var wage_year = parseInt(+req.body.wage_year);

      var search_option = {
        $match: {
          $and: [
          { corporate_id: req.authData.corporate_id },
          { parent_hods: { $in: [req.authId] } },
          { approval_status: { $in: ["approved", "active"] }  },
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

      // if()
      // search_option_details.$match["employee_monthly_reports.arrear_report"] = { $exists: true, $ne: null };
      // search_option_details.$match["revision"] = { $exists: true, $ne: [] };
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
      { $match: { revision_report_stat: { $exists: true, $ne: [] } } },
      {
        "$lookup":{
            from: 'employee_monthly_reports',
            "let": {"emp_db_idVars": "$_id"},
            "pipeline": [
              { 
                "$match": { 
                  $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVars"] }},
                  {'arrear_report': {$exists: true, $ne: null }},
                  ] 
                } 
              }
            ],
            as: 'employee_monthly_reports',
        }
      },
      {
        "$lookup":{
            from: 'employee_monthly_reports',
            "let": { "emp_db_idVars": "$_id"},
            "pipeline": [
              { 
                "$match": { 
                  $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVars"] }},
                  // {"salary_report":{ $exists: true, $ne: null }},
                  {'wage_year': {"$eq": parseInt(wage_year) }},
                  {'wage_month': {"$eq": parseInt(wage_month) }}
                  ] 
                } 
              }
            ],
            as: 'employee_monthly_report_month_wise',
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
          revision: {
            $arrayElemAt: ["$revision", 0],
          },
          revision_report: {
            $arrayElemAt: ["$revision_report_stat", 0],
          },
          employee_monthly_report_month_wise: {
            $arrayElemAt: ["$employee_monthly_report_month_wise", 0],
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
          "revision":1,
          "revision_reports":{ $ifNull: [ "$revision_report", "" ] },
          "company_name": { $ifNull: [ "$companies.establishment_name", "" ] },
          "com_logo": { $ifNull: [ "$companies.com_logo", "" ] },
          "company_phone": { $ifNull: [ "$companies.phone_no", "" ] },
          "company_address": { $ifNull: [ "$company_details.reg_office_address", "" ] },
          "arrear_temp_data": { $ifNull: [ "$employee_details.template_data.arrear_temp_data", "" ] },
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
          "employee_monthly_reports" : {
            "$filter" : {
               "input" : "$employee_monthly_reports",
               "as" : "employee_monthly_reports",
               "cond" : {
                  "$and" : [
                    {
                      "$or":[ 
                        { "$gt": [ "$$employee_monthly_reports.wage_year", "$revision_report.effect_from_year" ] },
                        { $and:[
                            { "$gte": [ "$$employee_monthly_reports.wage_year", "$revision_report.effect_from_year" ] },
                            { "$gte": [ "$$employee_monthly_reports.wage_month", "$revision_report.effect_from_month" ] },
                            ]
                        } 
                      ]
                    },
                    { 
                      "$or":[ 
                        { "$lt": [ "$$employee_monthly_reports.wage_year", "$revision_report.revision_year" ] },
                        { $and:[
                            { "$lte": [ "$$employee_monthly_reports.wage_year", "$revision_report.revision_year" ] },
                            { "$lte": [ "$$employee_monthly_reports.wage_month", "$revision_report.revision_month" ] },
                          ]
                        } 
                      ]
                    }
                  ]
              }
            }
          },
          "month_wise_monthly_report": { $ifNull: [ "$employee_monthly_report_month_wise.salary_report", "" ] },
          "advance_report":{ $ifNull: [ "$employee_monthly_report_month_wise.advance_report", "" ] },
          "reimbursment_report":{ $ifNull: [ "$employee_monthly_report_month_wise.reimbursment_report", "" ] },
        },
      },
      ]); 
      path_array = [];
      myAggregate.then(async (emps) => {
          if(emps.length > 0){
            await Promise.all(emps.map(async function(employees){
              var month_wise_arrear = [];
              employees.from_time_period = (wage_month+1)+"/"+ wage_year;
              employees.to_time_period = (wage_month+1)+"/"+ wage_year;
              if(employees.employee_monthly_reports){
                if(employees.employee_monthly_reports.length > 0){
                  await Promise.all(employees.employee_monthly_reports.map(async function(monthly_report, keys){
                    var pre_gross = employees.employee_monthly_reports[keys-1] ? employees.employee_monthly_reports[keys-1].arrear_report.gross_earning : 0;
                    month_wise_arrear.push({
                      'wage_month': moment((monthly_report.wage_month+1), 'M').format('MMMM') +"-"+monthly_report.wage_year,
                      'pre_earn_gross': parseFloat(pre_gross),
                      'post_earn_gross': parseFloat(monthly_report.arrear_report.gross_earning),
                      'arrear': parseFloat(monthly_report.arrear_report.gross_earning) - parseFloat(pre_gross),
                    });
                  }));
                }
              }
              employees.month_wise_arrear = month_wise_arrear;

              var statutory_deduction_pf = '';
              var statutory_contribution_pf = '';
              var statutory_deduction_esic = '';
              var statutory_contribution_esic = '';
              var statutory_deduction_pt = '';
              var statutory_contribution_pt = '';
              var statutory_deduction_tds = '';
              var statutory_contribution_tds = '';
              var footer_message = '';

              var basic_amount_pre = 0;
              var basic_amount_current = 0;
              var basic_amount_arrear = 0;
              var total_ot_wages_pre = 0;

              var hra_amount_pre = 0;
              var hra_amount_current = 0;
              var hra_amount_arrear = 0;
              var total_ot_wages_current = 0;

              var others_amount_pre = 0;
              var others_amount_current = 0;
              var others_amount_arrear = 0;
              var total_ot_wages_arrear = 0;

              if(employees.revision_reports){
                if(employees.revision_reports.consolidated_arrear_report){
                  if(employees.arrear_temp_data){
                    if(employees.arrear_temp_data.statutory_deduction.includes('PF')){
                      statutory_deduction_pf = employees.revision_reports.consolidated_arrear_report.total_pf_bucket;
                    }
                    if(employees.arrear_temp_data.statutory_contribution.includes('PF')){
                      statutory_contribution_pf = employees.revision_reports.consolidated_arrear_report.total_pf_wages;
                    }
                    if(employees.arrear_temp_data.statutory_deduction.includes('ESIC')){
                      statutory_deduction_esic = employees.revision_reports.consolidated_arrear_report.total_esic_bucket;
                    }
                    if(employees.arrear_temp_data.statutory_contribution.includes('ESIC') || employees.arrear_temp_data.statutory_contribution.includes('EPS')){
                      statutory_contribution_esic = employees.revision_reports.consolidated_arrear_report.pf_data.emoloyer_eps_contribution;
                    }
                    if(employees.arrear_temp_data.statutory_deduction.includes('PT')){
                      statutory_deduction_pt = employees.revision_reports.consolidated_arrear_report.total_pt_wages;
                    }
                    if(employees.arrear_temp_data.statutory_contribution.includes('PT')){
                      statutory_contribution_pt = employees.revision_reports.consolidated_arrear_report.pf_data.emoloyer_epf_admin_contribution + employees.revision_reports.consolidated_arrear_report.pf_data.emoloyer_edlis_admin_contribution;
                    }
                    if(employees.arrear_temp_data.statutory_deduction.includes('TDS')){
                      statutory_deduction_tds = employees.revision_reports.consolidated_arrear_report.total_tds_wages;
                    }
                    if(employees.arrear_temp_data.statutory_contribution.includes('TDS')){
                      statutory_contribution_tds = employees.revision_reports.consolidated_arrear_report.total_esic_wages;
                    }
                  }
                  else{
                    statutory_deduction_pf = employees.revision_reports.consolidated_arrear_report.total_pf_bucket;
                    statutory_contribution_pf = employees.revision_reports.consolidated_arrear_report.total_pf_wages;
                    statutory_deduction_esic = employees.revision_reports.consolidated_arrear_report.total_esic_bucket;
                    statutory_contribution_esic = employees.revision_reports.consolidated_arrear_report.pf_data.emoloyer_eps_contribution;
                    statutory_deduction_pt = employees.revision_reports.consolidated_arrear_report.total_pt_wages;
                    statutory_contribution_pt = employees.revision_reports.consolidated_arrear_report.pf_data.emoloyer_epf_admin_contribution + employees.revision_reports.consolidated_arrear_report.pf_data.emoloyer_edlis_admin_contribution;
                    statutory_deduction_tds = employees.revision_reports.consolidated_arrear_report.total_tds_wages;
                    statutory_contribution_tds = employees.revision_reports.consolidated_arrear_report.total_esic_wages;
                  }
                  var basicValueCr = employees.revision_reports.consolidated_arrear_report.heads.find(element => element.head_abbreviation === 'Basic' || element.head_abbreviation === 'basic');
                  var hraValueCr = employees.revision_reports.consolidated_arrear_report.heads.find(element => element.head_abbreviation === 'hra' || element.head_abbreviation === 'HRA');
                  await Promise.all(employees.revision_reports.consolidated_arrear_report.heads.map(function(head){
                    if(head.head_abbreviation !== 'hra' && head.head_abbreviation !== 'HRA' && head.head_abbreviation !== 'Basic' && head.head_abbreviation !== 'basic'){
                      others_amount_current += parseFloat(head.amount);
                    }
                  }));
                  if(basicValueCr){
                    basic_amount_current = parseFloat(basicValueCr.amount);
                  }
                  if(hraValueCr){
                    hra_amount_current = parseFloat(hraValueCr.amount);
                  }
                  total_ot_wages_current = employees.revision_reports.consolidated_arrear_report.total_ot_wages;
                }

              }
              if(employees.arrear_temp_data){
                footer_message = employees.arrear_temp_data.signature_message;
              }
              if(employees.month_wise_monthly_report){
                if(employees.month_wise_monthly_report.heads.length > 0){
                  var basicValue = employees.month_wise_monthly_report.heads.find(element => element.head_abbreviation === 'Basic' || element.head_abbreviation === 'basic');
                  var hraValue = employees.month_wise_monthly_report.heads.find(element => element.head_abbreviation === 'hra' || element.head_abbreviation === 'HRA');
                  await Promise.all(employees.month_wise_monthly_report.heads.map(function(head){
                    if(head.head_abbreviation !== 'hra' && head.head_abbreviation !== 'HRA' && head.head_abbreviation !== 'Basic' && head.head_abbreviation !== 'basic'){
                      others_amount_pre += parseFloat(head.amount);
                    }
                  }));

                  if(basicValue){
                    basic_amount_pre = parseFloat(basicValue.amount);
                  }
                  if(hraValue){
                    hra_amount_pre = parseFloat(hraValue.amount);
                  }
                }
                total_ot_wages_pre = employees.month_wise_monthly_report.total_ot_wages;
              }
              basic_amount_arrear = (parseFloat(basic_amount_current) - parseFloat(basic_amount_pre));
              hra_amount_arrear = (parseFloat(hra_amount_current) - parseFloat(hra_amount_pre));
              others_amount_arrear = (parseFloat(others_amount_current) - parseFloat(others_amount_pre));
              total_ot_wages_arrear = (parseFloat(total_ot_wages_current) - parseFloat(total_ot_wages_pre));

              employees.arrear_details = {
                "basic":{
                  "previous":basic_amount_pre,
                  "revised":basic_amount_current,
                  "arrear":basic_amount_arrear,
                },
                "hra":{
                  "previous":hra_amount_pre,
                  "revised":hra_amount_current,
                  "arrear":hra_amount_arrear,
                },
                "other":{
                  "previous":others_amount_pre,
                  "revised":others_amount_current,
                  "arrear":others_amount_arrear,
                },
                "overtime":{
                  "previous":total_ot_wages_pre,
                  "revised":total_ot_wages_current,
                  "arrear":total_ot_wages_arrear,
                },
                "deductions":{
                  "epf":statutory_deduction_pf,
                  "esic":statutory_deduction_esic,
                  "pt":statutory_deduction_pt,
                  "tds":statutory_deduction_tds,
                },
                "contribution":{
                  "epf":statutory_contribution_pf,
                  "eps":statutory_contribution_esic,
                  "admin_edli":statutory_contribution_pt,
                  "esic":statutory_contribution_tds,
                },
                "gross_earning":employees.revision_reports ?  employees.revision_reports.consolidated_arrear_report ? employees.revision_reports.consolidated_arrear_report.gross_earning : 0 : 0,
                "net_pay":employees.revision_reports ?  employees.revision_reports.consolidated_arrear_report ? employees.revision_reports.consolidated_arrear_report.net_take_home : 0 : 0,
                "ctc":employees.revision_reports ?  employees.revision_reports.consolidated_arrear_report ? employees.revision_reports.consolidated_arrear_report.ctc : 0 : 0,
                "others":{
                  "payments":employees.advance_report ? employees.advance_report.opening_balance ? employees.advance_report.opening_balance : 0 : 0,
                  "deductions":employees.reimbursment_report ? employees.reimbursment_report.gross_deduct ? employees.reimbursment_report.gross_deduct : 0 : 0,
                  "advance_given":employees.advance_report ? employees.advance_report.closing_balance ? employees.advance_report.closing_balance : 0 : 0,
                  "advance_recovered":employees.advance_report ? employees.advance_report.advance_recovered ? employees.advance_report.advance_recovered : 0 : 0,
                  "reimbursement":employees.reimbursment_report ? employees.reimbursment_report.net_take_home ? employees.reimbursment_report.net_take_home : 0 : 0,
                  "fine":0,
                  "breakage":0,
                  "other_deduction":0,
                }
              };
              let model_data = {
                emp_id: employees.emp_id,
                corporate_id: employees.corporate_id,
                wage_month,
                wage_year,
                emp_data:employees,
              };
              if(req.body.generate == 'pdf'){
                // var file_path='/storage/company/temp_files/'+employees.corporate_id+'/arrear_slip/';
                var file_name='arrear-slip-'+employees.corporate_id+'-'+employees.emp_id+'-'+wage_month+'-'+wage_year+'.pdf';
                let file = Site_helper.createFiles(null, file_name, employees.corporate_id, 'cold_storage/arrear_slip/'+wage_year+'/'+wage_month)
                path_array.push({
                    "link": absolutePath+file_path+file_name,
                    "file_path":file.location,
                    "file_name":file.file_name
                });
                var pdf_file= await Site_helper.generate_arrear_slip_pdf({employee_data: employees},file.file_name,file.location);
                model_data.pdf_link=file_path+file_name;
                model_data.pdf_file_name=file_name;
                model_data.gross_earning = employees.revision_reports?.consolidated_arrear_report?.gross_earning;
                model_data.net_pay = employees.revision_reports?.consolidated_arrear_report?.net_take_home;
                model_data.ctc = employees.revision_reports?.consolidated_arrear_report?.ctc;

                await ArrearPayslip.findOneAndUpdate(
                  {
                    emp_id: model_data.emp_id,
                    wage_month: parseInt(wage_month),
                    wage_year: parseInt(wage_year),
                  },
                  model_data,
                  { upsert: true, new: true, setDefaultsOnInsert: true },
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
                  

                  // if(path_array.length > 0){
                  //     var dir = absolutePath+"/storage/company/arrear_slip/";
                  //     if (!fs.existsSync(dir)){
                  //         fs.mkdirSync(dir);
                  //     }
                  //     const output = fs.createWriteStream(dir+'arrear-slip-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip');
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
                  //     path_link = baseurl+'storage/company/arrear_slip/arrear-slip-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip';
                  // }
                  return resp.status(200).json({status: "success", message: 'Arrear Slip Generated successfully.'});
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
  get_revision_history_report_pdf_export: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        // report_type:'required|in:monthly,consolidated',
        // wage_month:'requiredIf:report_type,monthly',
        // wage_year:'requiredIf:report_type,monthly',
        // pageno: "required",
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
        // var start_month = parseInt(req.body.wage_month_from);
        // var start_year = parseInt(req.body.wage_year_from);
        // var end_month = parseInt(req.body.wage_month_to);
        // var end_year = parseInt(req.body.wage_year_to);
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

        var report_type = req.body.report_type;
        // if(report_type == "monthly")
        // {
        //   var wage_month = req.body.wage_month;
        //   var wage_year = req.body.wage_year;
        //   var lockup_val={
        //     $lookup: {
        //       from: "employee_monthly_reports",
        //       let:{"emp_id":"$emp_id"},
        //       pipeline:
        //       [
        //         {
        //           $match:{
        //             $and:[
        //               {"$expr": { "$eq": ["$emp_id", "$$emp_id"] }},
        //               {"wage_month": parseInt(wage_month)},
        //               {"wage_year": parseInt(wage_year)},
        //             ]
        //           },
                  
        //         }
        //       ],
        //       as: "employee_monthly_reports",
        //     },
        //   };
        //   var match_element={ $match: { "employee_monthly_reports.arrear_report": { $exists: true, $ne: [] } } };
        //   var get_single_elem= {
        //     $addFields: {
        //       employee_monthly_reports: {
        //         $arrayElemAt: ["$employee_monthly_reports", 0],
        //       },
        //     }
        //   };
        //   var select_val={ $ifNull: [ "$employee_monthly_reports.arrear_report", 'aasd' ] };
        // }
        // else
        // {
        //   var lockup_val={
        //     $lookup: {
        //       from: "revision_reports",
        //       localField: "revision.revision_unique_id",
        //       foreignField: "revision_unique_id",
        //       as: "revision_report",
        //     },
        //   }
        //   var match_element={ $match: { revision_report: { $exists: true, $ne: [] } } };
        //   var get_single_elem= {
        //     $addFields: {
        //       revision_report: {
        //         $arrayElemAt: ["$revision_report", 0],
        //       },
        //     }
        //   };
        //   var select_val={ $ifNull: [ "$revision_report.consolidated_arrear_report", null ] };
        // }
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
          // {
          //   $lookup: {
          //     from: "revisions",
          //     localField: "_id",
          //     foreignField: "emp_db_id",
          //     as: "revision",
          //   },
          // },
          {
            $lookup: {
              from: "revision_logs",
              localField: "_id",
              foreignField: "emp_db_id",
              as: "revision_logs",
            },
          },
          // { $unwind:"$revision_logs"},
          // {
          //   $lookup: {
          //     from: "salery_templates",
          //     localField: "revision_logs.prev_salary_temp_id",
          //     foreignField: "_id",
          //     as: "prev_salary_templates",
          //   },
          // },
          // {
          //   $lookup: {
          //     from: "salery_templates",
          //     localField: "employee_details.employment_hr_details.salary_temp",
          //     foreignField: "_id",
          //     as: "salery_templates",
          //   },
          // },
          // { $match: { revision: { $exists: true, $ne: [] } } },
          // { $sort: { 'revision._id':-1  } },
          // lockup_val,
          // match_element,
          search_option_details,
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              // salery_templates: {
              //   $arrayElemAt: ["$salery_templates", 0],
              // },
              // pre_salary_template: {
              //   $arrayElemAt: ["$prev_salary_templates", 0],
              // },
            },
          },
          // get_single_elem,
          {
            $project: {
              _id: 1,
              corporate_id: 1,
              userid: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              empid: 1,
              "employee_details.employment_hr_details": 1,
              revision_logs:1
              // "revision.emp_db_id": 1,
              // "revision.salary_temp_id": 1,
              // "revision.policy_pack_id": 1,
              // "revision.gross_salary": 1,
              // "revision.effect_from": 1,
              // "revision.revision_year": 1,
              // "revision.revision_month": 1,
              // "revision.revision_unique_id": 1,
              // "revision.template_data.salary_temp_data": 1,
              // // "revision.revision_date": 1,
              // "salery_templates":1,
              // "revision_logs.prev_gross_salary":1,
              // "pre_salary_template":1,
            },
          },
        ]).then(async (emp_report_data)=>{
        
            return resp.status(200).json({status: "success",employees: emp_report_data});
     
        });
      }
    } catch (e) {
      return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },
  get_revision_history_log_report_pdf_export: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        // report_type:'required|in:monthly,consolidated',
        // wage_month:'requiredIf:report_type,monthly',
        // wage_year:'requiredIf:report_type,monthly',
        // pageno: "required",
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
        // var start_date = req.body.wage_from_date;
        // var end_date = req.body.wage_to_date;
        var start_month = +req.body.wage_month_from;
        var start_year = +req.body.wage_year_from;
        var end_month = +req.body.wage_month_to;
        var end_year = +req.body.wage_year_to;
        if(!start_month && !start_year){
          if(req.body.wage_from_date){
            let wage_from_date_array = req.body.wage_from_date.split("-");
            if(wage_from_date_array.length >= 2){
              var start_year = wage_from_date_array[0];
              var start_month = wage_from_date_array[1];
            }
            else{
              var start_month = new Date().getMonth();
              var start_year = new Date().getFullYear();
            } 
          }
          else{
            var start_month = new Date().getMonth();
            var start_year = new Date().getFullYear();
          } 
          if(req.body.wage_to_date){
            let wage_to_date_array = req.body.wage_to_date.split("-");
            if(wage_to_date_array.length >= 2){
              var end_year = wage_to_date_array[0];
              var end_month = wage_to_date_array[1];
            }
            else{
              var end_month = new Date().getMonth();
              var end_year = new Date().getFullYear();
            }
          }
          else{
            var end_month = new Date().getMonth();
            var end_year = new Date().getFullYear();
          }
        }
        
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
        var revision_search = {};

        if(req.body.search_type == 'effective_date'){
          revision_search = {
            $lookup:{
              from: 'revisions',
              "let": { "emp_db_idVar": "$_id"},
              "pipeline": [
              { 
                "$match": { 
                  $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                  {
                    $or:[ 
                    {'effect_from_year': {$gt: parseInt(start_year) }}, 
                    { 
                        $and:[
                        {'effect_from_year': {$gte: parseInt(start_year) }},
                        {'effect_from_month': {$gte: parseInt(start_month) }}
                        ]
                    }]
                  },
                  { 
                    $or:[ 
                    {'effect_from_year': {$lt: parseInt(end_year) }}, 
                    { 
                        $and:[
                        {'effect_from_year': {$lte: parseInt(end_year) }},
                        {'effect_from_month': {$lte: parseInt(end_month) }}
                        ]
                    }]
                  }
                  ] 
                } 
              }
              ],
              as: 'revision',
            }
          };
        }
        else{
          revision_search = {
            $lookup:{
              from: 'revisions',
              "let": { "emp_db_idVar": "$_id"},
              "pipeline": [
              { 
                "$match": { 
                  $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                  {
                    $or:[ 
                    {'revision_year': {$gt: parseInt(start_year) }}, 
                    { 
                        $and:[
                        {'revision_year': {$gte: parseInt(start_year) }},
                        {'revision_month': {$gte: parseInt(start_month) }}
                        ]
                    }]
                  },
                  { 
                    $or:[ 
                    {'revision_year': {$lt: parseInt(end_year) }}, 
                    { 
                        $and:[
                        {'revision_year': {$lte: parseInt(end_year) }},
                        {'revision_month': {$lte: parseInt(end_month) }}
                        ]
                    }]
                  }
                  ] 
                } 
              }
              ],
              as: 'revision',
            }
          };
        }

        var report_type = req.body.report_type;
        
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
          revision_search,
          {
            $lookup: {
              from: "revision_logs",
              localField: "revision._id",
              foreignField: "revision_id",
              as: "revision_log",
            },
          },
          { $match: { revision: { $exists: true, $ne: [] } } },
          { $match: { revision_log: { $exists: true, $ne: [] } } },
          // lockup_val,
          // match_element,
          search_option_details,
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              salery_templates: {
                $arrayElemAt: ["$salery_templates", 0],
              },
            },
          },
          // get_single_elem,
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
              // "employee_details.employment_hr_details": 1,
              // "revision":1,
              "revision._id": 1,
              "revision.emp_db_id": 1,
              "revision.salary_temp_id": 1,
              "revision.policy_pack_id": 1,
              "revision.gross_salary": 1,
              "revision.effect_from": 1,
              "revision.effect_from_month": 1,
              "revision.effect_from_year": 1,
              "revision.revision_year": 1,
              "revision.revision_month": 1,
              "revision.revision_unique_id": 1,
              "revision.template_data.salary_temp_data": 1,
              "revision.revision_date": 1,
              "salery_templates":1,
              "revision_log._id": 1,
              "revision_log.effect_from": 1,
              "revision_log.effect_from_month": 1,
              "revision_log.effect_from_year": 1,
              "revision_log.revision_year": 1,
              "revision_log.revision_month": 1,
              "revision_log.template_data.salary_temp_data": 1,
              "revision_log.prev_template_data.salary_temp_data": 1,
              "revision_log.gross_salary": 1,
              "revision_log.prev_gross_salary": 1,
              "revision_log.revision_date": 1,
              "revision_log.revision_id": 1,
            },
          },
        ]);
        if(req.body.generate == 'excel'){
          myAggregate.then(async (emp_report_data)=>{
            var path_array = [];
            if(req.body.generate == 'excel'){
              var field_list_array=["emp_id","name","revision_no","date_of_revision","prev_gross","perv_sal_template","rev_gross","rev_sal_temp",'revised_by'];
              var path_array = [];
              var wb = new xl.Workbook();
              var ws = wb.addWorksheet("Sheet 1");
              var clmn_id = 1;
              ws.cell(1, clmn_id++).string("SL");
              if(field_list_array.includes('emp_id'))
              {
                  ws.cell(1, clmn_id++).string("Emp Id");
              }
              if(field_list_array.includes('name'))
              {
                  ws.cell(1, clmn_id++).string("Name");
              }
              if(field_list_array.includes('revision_no'))
              {
                  ws.cell(1, clmn_id++).string("Revision No");
              }
              if(field_list_array.includes('date_of_revision'))
              {
                  ws.cell(1, clmn_id++).string("Date Of Revision");
              }
              if(field_list_array.includes('prev_gross'))
              {
                  ws.cell(1, clmn_id++).string("Prev Gross");
              }
              if(field_list_array.includes('perv_sal_template'))
              {
                  ws.cell(1, clmn_id++).string("Perv Sal Template");
              }
              if(field_list_array.includes('rev_gross'))
              {
                  ws.cell(1, clmn_id++).string("Rev Gross");
              }
              if(field_list_array.includes('rev_sal_temp'))
              {
                  ws.cell(1, clmn_id++).string("Rev Sal Temp");
              }
              if(field_list_array.includes('revised_by'))
              {
                  ws.cell(1, clmn_id++).string("Revised By");
              }
            }
            var row = 0;
            await Promise.all(emp_report_data.map(async function(employees, index){
              if(employees.revision){
                if(employees.revision.length){
                  employees.revision.map(async function(revison,revi_index){
                    revison.revison_no = revi_index+1;
                  });
                }
              }
              if(employees.revision_log){
                if(employees.revision_log.length){
                  employees.revision_log.map(async function(log,index_log){
                    var revision_data = employees.revision.find(element => mongoose.Types.ObjectId(log.revision_id).equals(mongoose.Types.ObjectId(element['_id'])));
                    
                    if(revision_data){
                      log.revision_data = revision_data;
                    }
                    else{
                      log.revision_data = "";
                    }
                    if(req.body.generate == 'excel'){
                      var index_val = 2;
                      index_val = index_val + row;
                      var clmn_emp_id=1
                      ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                      if(field_list_array.includes('emp_id'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string(
                            employees.emp_id ? String(employees.emp_id) : ""
                            );
                      }
                      if(field_list_array.includes('name'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string(
                            employees.emp_first_name ? String(employees.emp_first_name+" "+employees.emp_last_name) : ""
                            );
                      }
                      if(field_list_array.includes('revision_no'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string(revision_data ? String(revision_data.revison_no) : ""
                            );
                      }
                      if(field_list_array.includes('date_of_revision'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string(
                            revision_data ? String(moment(`${log.revision_year}-${log.revision_month}`, "YYYY-MM").format('MMM-YYYY')) : ""
                            );
                      }
                      if(field_list_array.includes('prev_gross'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string(String(log?.prev_gross_salary || 0)) ;
                      }
                      if(field_list_array.includes('perv_sal_template'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string(String(log?.prev_template_data?.salary_temp_data?.template_name || 'N/A'));
                      }
                      if(field_list_array.includes('rev_gross'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string(String(log?.gross_salary || 0));
                      }
                      if(field_list_array.includes('rev_sal_temp'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string( String(log?.template_data?.salary_temp_data?.template_name || 'N/A'))
                      }
                      if(field_list_array.includes('revised_by'))
                      {
                          ws.cell(index_val, clmn_emp_id++).string("");
                      }
                    }
                    row ++;
                  });
                }
              }
            })).then(async (emp) => {
              if(req.body.generate == 'excel'){
                // wb.write("arrear-revision-history-log-report.xlsx");
                // let file_location = Site_helper.createFiles(wb,"arrear-revision-history-log-report" ,'xlsx', req.authData.corporate_id);
                let file_name = "arrear-revision-history-log-report.xlsx";
                // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);

                var file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/arrear-module');
                await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                // var path_link = null; 
                // if(path_array.length > 0){
                //     var dir = absolutePath+"/storage/company/arrear_revision_history_log/";
                //     if (!fs.existsSync(dir)){
                //         fs.mkdirSync(dir);
                //     }
                //     const output = fs.createWriteStream(dir+'arrear-revision-history-log-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip');
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
                //     path_link = baseurl+'storage/company/arrear_revision_history_log/arrear-revision-history-log-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip';
                // }
                // return resp.status(200).json({status: "success", message: 'Revision History Log Generated successfully.', url: baseurl + file_location});
              }
              else{
                return resp.status(200).send({ status: 'success',message:"Fetch successfully.", employees: emp_report_data});
              }
            });
          });
        }
        else{
          Employee.aggregatePaginate(myAggregate,options,async function (err, res) {
            if (err) return resp.json({ status: "error", message: err.message });
              if(res.docs){
                if(res.docs.length > 0){
                  await Promise.all(res.docs.map(async function(employees, index){
                    if(employees.revision){
                      if(employees.revision.length){
                        employees.revision.map(async function(revison,revi_index){
                          revison.revison_no = revi_index+1;
                        });
                      }
                    }
                    if(employees.revision_log.length){
                      employees.revision_log.map(async function(log,index_log){
                        var revision_data = employees.revision.find(element => mongoose.Types.ObjectId(log.revision_id).equals(mongoose.Types.ObjectId(element['_id'])));
                        
                        if(revision_data){
                          log.revision_data = revision_data;
                        }
                        else{
                          log.revision_data = "";
                        }
                      });
                    }
                  }));
                }
              }
            return resp.status(200).json({ status: "success", employees: res });
          });
        }
      }
    } catch (e) {
      return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
  },
  get_arrear_generated_payslip_data: async (req, resp) => {
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
              from: "arrear_payslips",
              "let": { "emp_db_idVar": "$emp_id"},
              "pipeline": [
                { "$match": { $and :[
                  {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                  {"wage_month": parseInt(wage_month)},
                  {"wage_year": parseInt(wage_year)},
                ] } }
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
              payslip_temp_data:{ $ifNull: [ "$employee_detail.template_data.payslip_temp_data", {} ] },
              emp_data:"$employee_payslip.emp_data" ,
              earnings_data: "$employee_payslip.earnings",
              deductions_data: "$employee_payslip.deductions",
              contribution_data: "$employee_payslip.contribution",
              gross_earning: "$employee_payslip.gross_earning",
              net_pay: "$employee_payslip.net_pay",
              ctc: "$employee_payslip.ctc",
              pdf_file_name: "$employee_payslip.pdf_file_name",
              pdf_link: "$employee_payslip.pdf_link",
              status: "$employee_payslip.status",
              department:1,
              designation:1,
              client:1,
              hod:1,
              "deductions":1,
              "earnings":1,
              "contribution":1
            },
          },
        ]);
        if(req.body.generate == 'yes'){
          var path_link = "";
          myAggregate.then(async (salary_slips) => {
            if(salary_slips.length > 0){
              var dir = absolutePath+"/storage/company/"+req.authData.corporate_id+"/temp_files"+"/arrear-module/";
              if (!fs.existsSync(dir)){
                  fs.mkdirSync(dir);
              }
              const output = fs.createWriteStream(dir+'arrear-pay-slip-'+wage_month+'-'+wage_year+'.zip');
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
              await Promise.all(salary_slips.map(async function(salary_slip){
                if(salary_slip && salary_slip.pdf_file_name){ 
                  var path_link = absolutePath+salary_slip.pdf_link;
                  if (fs.existsSync(path_link)){
                      archive.append(fs.createReadStream(path_link), { name: salary_slip.pdf_file_name });
                  }
                }
              })).then(async (emp) => { 
                archive.finalize();
                let file_name = "arrear-pay-slip-"+wage_month+"-"+wage_year+".zip";
                // file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/arrear_slip/";
                let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/arrear-module')
                await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                // path_link = baseurl+'storage/company/temp_files/'+req.authData.corporate_id+'/arrear_slip/arrear-pay-slip-'+wage_month+'-'+wage_year+'.zip';
                // return resp.status(200).json({ status: "success",  message: 'Arrear pay slip archive successfully.', url:path_link});
              });
            }
            else{
              return resp.status(200).json({ status: "error",  message: 'Arrear pay slip archive not successfully.', url:path_link});
            }
          });
        }
        else{
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
};
