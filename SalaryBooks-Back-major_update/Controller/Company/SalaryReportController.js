var SalaryTemp = require('../../Model/Admin/SalaryTemp');
var EmployeeSheetTemplate = require('../../Model/Company/EmployeeSheetTemplate')
var SalaryTempHead = require('../../Model/Admin/SalaryTempHead');
var Employee = require('../../Model/Company/employee');
var Esicrule = require('../../Model/Admin/Esicrule');
var Epforule = require('../../Model/Admin/Epforule');
var Ptaxrule = require('../../Model/Admin/Ptaxrule');
var CompanyDetails = require('../../Model/Admin/Company_details');
var MasterReport = require('../../Model/Company/MasterReport');
var HoldSalaryEmp = require('../../Model/Company/HoldSalaryEmp');
var LeaveTempHead = require('../../Model/Admin/LeaveTempHead');
var PF_challan =require('../../Model/Company/PF_challan');
var ESIC_challan =require('../../Model/Company/ESIC_challan');
var BankInstruction = require('../../Model/Company/BankInstruction');
var PaymentSheet=require('../../Model/Company/PaymentSheet');
var AttendanceSummary=require('../../Model/Company/AttendanceSummary');
var EmployeeMonthlyReport=require('../../Model/Company/EmployeeMonthlyReport');
var EarningSheetTemplate = require('../../Model/Company/EarningSheetTemplate');
var Site_helper = require('../../Helpers/Site_helper');
var CompanyInfoController = require('./Company_infoController');
var Company = require('../../Model/Admin/Company');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
var xl = require('excel4node');
var fs = require('fs');
module.exports = {
    generate_employee_list_earning_sheet: async function (req, resp, next) {
    try {
        const v = new Validator(req.body, {
          attendance_month: 'required',
          attendance_year: 'required',
          pageno:'required',

        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var attendence_month=req.body.attendance_month;
          var attendence_year=req.body.attendance_year;
          var sortbyfield = req.body.sortbyfield;
          if(sortbyfield)
          {
              var sortoption = {};
              sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
          }
          else{
              var sortoption = {created_at: -1};
          }

          const options = {
            page: req.body.pageno,
            limit: req.body.perpage?req.body.perpage:perpage,
            sort:    sortoption,
          };
          var filter_option={};
          var document={};
          var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
          var search_option_details= {$match: {}};
          if(req.body.searchkey)
          {
            search_option={ 
              $match: { 
                // $text: { $search: req.body.searchkey },
                $or: [
                  { emp_first_name: { $regex: req.body.searchkey, $options: "i" } },
                  { emp_last_name: { $regex: req.body.searchkey, $options: "i" } },
                  { emp_id: { $regex: req.body.searchkey, $options: "i" } }
                  // Add other fields to search here
                ],
                'corporate_id':req.authData.corporate_id 
              }
            };    
          }
          else
          {
            if(req.body.emp_name)
            {
              search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
              search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
            }
            if(req.body.emp_last_name)
            {
              search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
            }
            if(req.body.email_id)
            {
              search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
            }
            if(req.body.emp_id)
            {
              search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
            }
            if(req.body.designation_id)
            {
              var designation_ids=JSON.parse(req.body.designation_id);
              designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
              search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
            }
            if(req.body.department_id)
            {
              var department_ids=JSON.parse(req.body.department_id);
              department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
              search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
            }
            if(req.body.branch_id)
            {
              var branch_ids=JSON.parse(req.body.branch_id);
              branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
              search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
            }
            if(req.body.client_code)
            {
              var client_codes=JSON.parse(req.body.client_code);
              search_option.$match.client_code={$in: client_codes};
            }
            if(req.body.hod_id)
            {
              var hod_ids=JSON.parse(req.body.hod_id);
              hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
              search_option.$match.emp_hod={$in: hod_ids};
            }
          }
          search_option_details.$match['attendance_summaries.attendance_month']= attendence_month.toString();
          search_option_details.$match['attendance_summaries.attendance_year']=  attendence_year.toString();
          var myAggregate = Employee.aggregate([
            search_option,
        
            {$lookup:{
              from: 'employee_details',
              localField: '_id',
              foreignField: 'employee_id',
              as: 'employee_details',
            }},
            {$lookup:{
              from: 'employee_monthly_reports',
              "let": { "emp_db_idVar": "$_id"},
              "pipeline": [
                { "$match": { $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                  {"wage_month": parseInt(attendence_month)},
                  {"wage_year": parseInt(attendence_year)},
                ] } }
              ],
              as: 'employee_monthly_reports',
            }},
            {$lookup:{
              from: 'bank_instructions',
              localField: 'employee_monthly_reports.salary_report.bank_ins_referance_id',
              foreignField: 'file_id',
              as: 'bank_instruction'
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
            {$lookup:{
              from: 'companies',
              localField: 'corporate_id',
              foreignField: 'corporate_id',
              as: 'companies'
            }},
            {$lookup:{
              from: 'company_details',
              localField: 'companies._id',
              foreignField: 'company_id',
              as: 'company_details',
            }},
            
            {$lookup:{
                from: 'hold_salary_emps',
                "let": { "emp_id_var": "$emp_id" },
                "pipeline": [
                  { 
                    "$match":{ $and:[
                      { "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }},
                      {'wage_month':{$eq : attendence_month.toString()} },
                      {'wage_year':{$eq : attendence_year.toString()} },
                    ]},
                  },
                ],
                as: 'hold_salary_emps',
            }},
            search_option_details,
            {$lookup:{
              from: 'branches',
              localField: 'employee_details.employment_hr_details.branch',
              foreignField: '_id',
              as: 'branch'
            }},
            {$lookup:{
              from: 'departments',
              localField: 'employee_details.employment_hr_details.department',
              foreignField: '_id',
              as: 'department'
            }},
            {$lookup: {
                from: "clients",
                localField: "client_code",
                foreignField: "_id",
                as: "client",
                
              },
            },
            { "$addFields": {
              "employee_details": {
                  "$arrayElemAt": [ "$employee_details", 0 ]
              }
              }
            },
            { "$addFields": {
              "hold_salary_emps": {
                  "$arrayElemAt": [ "$hold_salary_emps", 0 ]
              },
              "employee_monthly_reports": {
                "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
            },
              "department": {
                  "$arrayElemAt": [ "$department", 0 ]
              },
              "client": {
                  "$arrayElemAt": [ "$client", 0 ]
              },
              "bank_instruction": {
                  "$arrayElemAt": [ "$bank_instruction", 0 ]
              }
              
              }
            },
            {
              $unwind: "$company_details"
            },
            {
              $addFields: {
                branch: {
                  $filter: {
                    input: "$company_details.company_branch",
                    as: "branch_item",
                    cond: {
                      $eq: [
                        "$employee_details.employment_hr_details.branch",
                        "$$branch_item._id"
                      ]
                    }
                  }
                }
              }
            },
            // {
            //   $unwind: "$branch"
            // },
            { 
              "$project": 
              { 
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
                "employee_details":1,
                "hold_salary_emps":1,
                "branch.branch_name":1,
                "branch._id":1,
                "department":1,
                "client":1,
                "employee_monthly_reports":{
                  "bank_ins_referance_id":"$employee_monthly_reports.salary_report.bank_ins_referance_id",
                  "pf_challan_referance_id":"$employee_monthly_reports.salary_report.pf_challan_referance_id",
                  "esic_challan_referance_id":"$employee_monthly_reports.salary_report.esic_challan_referance_id",
                  "bank_instruction_status":{$ifNull:["$bank_instruction.status",null]}
                },
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
                bonus_module: {
                  $filter: {
                    input: "$bonus_module",
                    as: "bonus_module",
                    cond: {
                      $and: [
                        {$eq: ["$$bonus_module.bonus_g_month", attendence_month.toString()]},
                        {$eq: ["$$bonus_module.bonus_g_year", attendence_year.toString()]}
                      ]
                    }
                  }
                }
              }
            },
            ]);
            // .then(async (emps) => {
            //   return resp.status(200).json({ status: "success", employees: emps });
            // })
            Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
                if (err) return resp.json({ status: "error", message: err.message });
            
                return resp.status(200).json({ status: "success", employees: employees });
            })
          }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    hold_employee_salary:async function(req, resp)
    {
      try {
        const v = new Validator(req.body, {
            wage_month: 'required',
            wage_year: 'required',
            emp_db_id:'required',
            emp_id:'required',
            hold_type:'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var holdEmoData={
              corporate_id:req.authData.corporate_id,
              wage_month:req.body.wage_month,
              wage_year:req.body.wage_year,
              emp_db_id:mongoose.Types.ObjectId(req.body.emp_db_id),
              emp_id:req.body.emp_id,
              hold_type:req.body.hold_type,
              status:'active',
              created_at:new Date(),
            }
            HoldSalaryEmp.findOneAndUpdate({'emp_id':req.body.emp_id,wage_month:req.body.wage_month,wage_year:req.body.wage_year},holdEmoData,{upsert: true, new: true, setDefaultsOnInsert: true},  function (err, holdSalary) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Employee successfully added to hold salary list.", holdSalary: holdSalary });
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },  
    generate_hold_salary_employee_list: async function (req, resp, next) {
      try {
            var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
            var filter_option={};
            var document={};
            var search_option={$match: {}};
            var search_option= {$match: {$and:[ 
              {'corporate_id':req.authData.corporate_id},
              {'employees.parent_hods':{$in: [req.authData.user_id] }},
              {'employees.approval_status':'approved'}
            ]}};
            var search_option_details= {$match: {}};
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey },'employees.corporate_id':req.authData.corporate_id }};    
            }
            else
            {
              if(req.body.emp_name)
              {
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
              }
              if(req.body.emp_last_name)
              {
                search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
              }
              if(req.body.email_id)
              {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
              }
              if(req.body.emp_id)
              {
                search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
              }
              if(req.body.designation_id)
              {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
              }
              if(req.body.department_id)
              {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
              }
              if(req.body.branch_id)
              {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
              }
              if(req.body.client_code)
              {
                var client_codes=JSON.parse(req.body.client_code);
                search_option.$match.client_code={$in: client_codes};
              }
              if(req.body.hod_id)
              {
                var hod_ids=JSON.parse(req.body.hod_id);
                hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match.emp_hod={$in: hod_ids};
              }
            }
            var myAggregate = HoldSalaryEmp.aggregate([
              {$lookup:{
                from: 'employees',
                localField: 'emp_db_id',
                foreignField: '_id',
                as: 'employees',
            }},
            search_option,
              {$lookup:{
                from: 'employee_details',
                localField: 'emp_db_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              search_option_details,
              {$lookup:{
                from: 'branches',
                localField: 'employee_details.employment_hr_details.branch',
                foreignField: '_id',
                as: 'branch'
              }},
              {$lookup:{
                from: 'designations',
                localField: 'employee_details.employment_hr_details.designation',
                foreignField: '_id',
                as: 'designation'
              }},
              {$lookup:{
                from: 'departments',
                localField: 'employee_details.employment_hr_details.department',
                foreignField: '_id',
                as: 'department'
              }},
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                }
                }
              },
              { "$addFields": {
                "employees": {
                    "$arrayElemAt": [ "$employees", 0 ]
                }
                }
              },
              { "$project": { 
                "employees._id":1,
                "employees.corporate_id":1,
                "employees.userid":1,
                "employees.emp_id":1,
                "employees.emp_first_name":1,
                "employees.emp_last_name":1,
                "emp_dob":1,
                "pan_no":1,
                "aadhar_no":1,
                "email_id":1,
                "empid":1,
                "client_code":1,
                "approval_status":1,
                "employee_details":1,
                "hold_salary_emp":1,
                "hold_type":1,
                "wage_month":1,
                "wage_year":1,
                "hold_type":1,
                "status":1
                }
              },
              ]);
              HoldSalaryEmp.aggregatePaginate(myAggregate,options, async function (err, employees) {
                  if (err) return resp.json({ status: "error", message: err.message });
              
                  return resp.status(200).json({ status: "success", employees: employees });
              })
           // }
        }
        catch (e) {
          return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
        }
    },  
    remove_from_hold_salary_list:async function(req, resp)
    {
      try {
        const v = new Validator(req.body, {
            hold_sal_emp_list:'required'
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var hold_sal_emp_list=JSON.parse(req.body.hold_sal_emp_list);
          await Promise.all(hold_sal_emp_list.map(async (emp_list_id) => {
            await HoldSalaryEmp.findByIdAndRemove({'_id':emp_list_id})
          })).then(value =>{
            return resp.status(200).send({ status: 'success',message:"Remove from list successfully" });
          });
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    generate_salary_sheet: async function(req, resp, next)
    {
      try {
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
          var wage_month=parseInt(attendence_month)
          var wage_year=parseInt(attendence_year)
          const options = {};
          var filter_option={};
          var document={};
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
          search_option_details.$match['attendance_summaries.attendance_month']= attendence_month.toString();
          search_option_details.$match['attendance_summaries.attendance_year']=  attendence_year.toString();
          search_option_details.$match['hold_salary_emps.0']=  { "$exists": false };          
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
              from: 'employee_monthly_reports',
              "let": { "emp_db_idVar": "$_id"},
              "pipeline": [
                { "$match": { $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                  {"wage_month": parseInt(attendence_month)},
                  {"wage_year": parseInt(attendence_year)},
                ] } }
              ],
              as: 'employee_monthly_reports',
            }},
            {$lookup:{
              from: 'staffs',
              localField: 'emp_hod',
              foreignField: '_id',
              as: 'hod'
            }},
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
                from: "layoff_modules",
                let:{"emp_id_var":"$emp_id"},
                "pipeline":[
                  {
                    "$match": { 
                      $and :[
                        {"$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }},
                        {$or:[ 
                          {'wage_year_from': {$lt: wage_year }}, 
                          { $and:[
                            {'wage_year_from': {$lte: wage_year }},
                            {'wage_month_from': {$lte: wage_month }}
                          ]}
                        ]},
                        {$or:[ 
                          {'wage_year_to': {$gt: wage_year }}, 
                          { $and:[
                            {'wage_year_to': {$gte: wage_year }},
                            {'wage_month_to': {$gte: wage_month }}
                          ]}
                        ]}
                      ]
                    } 
                  }
                ],
                as: "layoff_modules",
              },
            },
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
            {$lookup:{
              from: 'companies',
              localField: 'corporate_id',
              foreignField: 'corporate_id',
              as: 'companies'
            }},
            {$lookup:{
              from: 'company_details',
              localField: 'companies._id',
              foreignField: 'company_id',
              as: 'company_details',
            }},
            {$lookup:{
              from: 'hold_salary_emps',
              "let": { "emp_id_var": "$emp_id" },
              "pipeline": [
                { 
                  "$match":{ $and:[
                    { "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }},
                    {'wage_month':{$eq : attendence_month.toString()} },
                    {'wage_year':{$eq : attendence_year.toString()} },
                    {'hold_type':{$eq : 'salaryWithCom'} },
                  ]},
                },
              ],
              as: 'hold_salary_emps',
          }},
            search_option_details,
            { "$addFields": {
              "employee_details": {
                  "$arrayElemAt": [ "$employee_details", 0 ]
              },
              "employee_monthly_reports": {
                  "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
              },
              "hod": {
                  "$arrayElemAt": [ "$hod", 0 ]
              },
              "designation": {
                  "$arrayElemAt": [ "$designation", 0 ]
              },
              "department": {
                  "$arrayElemAt": [ "$department", 0 ]
              },
              "client": {
                  "$arrayElemAt": [ "$client", 0 ]
              },
              "layoff_modules": {
                "$arrayElemAt": [ "$layoff_modules", 0 ]
              }
              }
            },
            {
              $unwind: "$company_details"
            },
            {
              $addFields: {
                branch: {
                  $filter: {
                    input: "$company_details.company_branch",
                    as: "branch_item",
                    cond: {
                      $eq: [
                        "$employee_details.employment_hr_details.branch",
                        "$$branch_item._id"
                      ]
                    }
                  }
                }
              }
            },
            // {
            //   $unwind: "$branch"
            // },
            { 
              "$project": 
              { 
                "_id":1,
                "corporate_id":1,
                "userid":1,
                "emp_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_dob":1,
                "mobile_no":{ $ifNull: [ "$mobile_no", 'NA' ] },
                "age": {
                      $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
                        (365 * 24*60*60*1000)]
                      },
                "pan_no":1,
                "aadhar_no":1,
                "email_id":1,
                "empid":1,
                "sex":1,
                "client_code":1,
                "approval_status":1,
                "employee_details":1,
                "employee_advances":1,
                "hod.first_name":1,
                "hod.last_name":1,
                "hod.userid":1,
                "hod._id":1,
                "hold_salary_emps":1,
                "employee_monthly_reports":1,
                "branch.branch_name":1,
                "branch._id":1,
                "designation.designation_name":1,
                "designation._id":1,
                "department.department_name":1,
                "department._id":1,
                "client.client_name":1,
                "client._id":1,
                "layoff_modules":1,
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
              }
            },
          ]).then(async (emps) => {
            //return resp.status(200).json({status: "success",message: emps,});
            var salary_arr=[];
            var currdate = new Date();
            
            var epfo_temp=await Site_helper.get_gov_epfo_data(req);
            var esic_temp=await Site_helper.get_gov_esic_data(req);
            var comp_data = await req.companyData;
            
            // console.log(epfo_temp , "epfo temp");
            await Promise.all(emps.map( async function(emp) {
              
              var pre_total_pt=0;
              var pre_salary_pt=0;
              var emp_data = emp.employee_details;
              var emp_state = emp.employee_details.template_data.ptax_temp_data.state_name || emp.employee_details.emp_address.state;
              var ptax_temp_data = emp.employee_details.template_data.ptax_temp_data;
              var gross_salary =parseFloat(emp_data.employment_hr_details.gross_salary);
              var master_gross_salary = gross_salary;
              var salary_temp_data = emp_data.template_data.salary_temp_data;
              var lwf_temp_data =  emp_data.template_data.lwf_temp_data;
              var actu_attendence_month =parseFloat(attendence_month)+1;
              var monthdays=daysInMonth(actu_attendence_month,attendence_year);
              if(emp.attendance_summaries)
              {
                var paydays=parseFloat(emp.attendance_summaries[0].paydays);
                
              }
              else
              {
                var paydays=0;
              }
              if(emp.layoff_modules)
              {
                var layoff_modules = emp.layoff_modules;
                var wage_value_per = parseFloat(layoff_modules.wage_value);
                gross_salary = ((gross_salary * wage_value_per) / 100);
              }
              var calculate_advance = 'true';
              var emp_id = emp.emp_id;
              var corporate_id = emp.corporate_id;
              var salary_breakup = await Site_helper.get_salary_breakup(req,salary_temp_data,gross_salary,emp_data,paydays,monthdays,calculate_advance,emp_id,corporate_id);
              //console.log('salary_breakup',salary_breakup.heads);
              var pre_salary_data=emp.employee_monthly_reports;
              var pre_monthly_wage_amount=0;
              var pre_master_data='';
              var ptax_temp_data = emp_data?.template_data?.ptax_temp_data ?? {};
              let total_earning_data = {}

              //if(pre_salary_data) {
                // if(pre_salary_data?.salary_report)
                // {
                //   pre_master_data =pre_salary_data?.master_report ?? '';
                //   pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.salary_report.total_pf_wages);                     
                // }
                // else
                // {
                //   pre_monthly_wage_amount= pre_salary_data.total_data.total_pf_wages;
                // }
            //  }

              if(salary_breakup.restricted_pf === "yes")
              {
                //var pre_monthly_wage_amount=(pre_salary_data?pre_salary_data.total_data.total_pf_wages:0);
                var template_wage_ceiling = salary_breakup.template_wage_ceiling;
                var avaiable_wage_amount= (template_wage_ceiling-pre_monthly_wage_amount);
                var module_wage_amount=(salary_breakup.total_pf_wages < parseFloat(avaiable_wage_amount) ? salary_breakup.total_pf_wages  : parseFloat(avaiable_wage_amount) );
              }
              else
              {
                var module_wage_amount= salary_breakup.total_pf_wages;
              }

              const salary_earning_data={
                heads:salary_breakup.heads,
                ctc: salary_breakup.ctc ? parseFloat(salary_breakup.ctc.toFixed(2)) : 0,
                total_pf_bucket: salary_breakup.total_pf_wages ? parseFloat(salary_breakup.total_pf_wages.toFixed(2)) : 0,
                //total_pf_wages:salary_breakup.restrict_pf_wages,
                total_pf_wages: module_wage_amount ? parseFloat(module_wage_amount.toFixed(2)) : 0,
                eps_wages: salary_breakup.eps_wages ? parseFloat(salary_breakup.eps_wages.toFixed(2)) : 0,
                edlis_wages: salary_breakup.edlis_wages ? parseFloat(salary_breakup.edlis_wages.toFixed(2)) : 0,
                total_esic_bucket:salary_breakup.total_esi_wages ? parseFloat(salary_breakup.total_esi_wages.toFixed(2)) : 0,
                total_esic_wages: salary_breakup.restrict_esic_wages ? parseFloat(salary_breakup.restrict_esic_wages.toFixed(2)) : 0,
                total_pt_wages: salary_breakup.total_pt_wages ? parseFloat(salary_breakup.total_pt_wages.toFixed(2)) : 0,
                total_tds_wages: salary_breakup.total_tds_wages ? parseFloat(salary_breakup.total_tds_wages.toFixed(2)) : 0,
                total_ot_wages: salary_breakup.total_ot_wages ? parseFloat(salary_breakup.total_ot_wages.toFixed(2)) : 0,
                total_gratuity_wages: salary_breakup.total_gratuity_wages ? parseFloat(salary_breakup.total_gratuity_wages.toFixed(2)) : 0,
                net_take_home: salary_breakup.net_take_home ? parseFloat(salary_breakup.net_take_home.toFixed(2)) : 0,
                voluntary_pf_amount: salary_breakup.voluntary_pf_amount ? parseFloat(salary_breakup.voluntary_pf_amount.toFixed(2)) : 0,
                gross_earning: salary_breakup.gross_earning ? parseFloat(salary_breakup.gross_earning.toFixed(2)) : 0,
                gross_deduct: salary_breakup.gross_deduct ? parseFloat(salary_breakup.gross_deduct.toFixed(2)) : 0,
                total_bonus_wages: salary_breakup.total_bonus_wages ? parseFloat(salary_breakup.total_bonus_wages.toFixed(2)) : 0,
                advance_recovered: salary_breakup.advance_recovered ? parseFloat(salary_breakup.advance_recovered.toFixed(2)) : 0,
                bank_ins_referance_id:'',
                pf_challan_referance_id:'',
                esic_challan_referance_id:'',
                pf_generate: 'no',
                esic_generate: 'no',
              };

              // total earning data
              if(pre_salary_data) {
                pre_total_pt = (pre_salary_data?.total_data?.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);

                if(pre_salary_data?.salary_report){
                  pre_salary_pt = (pre_salary_data.salary_report.pt_amount?pre_salary_data.salary_report.pt_amount:0);
                  pre_master_data =pre_salary_data?.master_report ?? '';
                  pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.salary_report.total_pf_wages);                     

                  total_earning_data = { 
                    'total_earning': (salary_earning_data.gross_earning + (  (pre_salary_data.total_data.total_earning || 0) - (pre_salary_data.salary_report.gross_earning || 0))),
                    'total_ctc': (salary_earning_data.ctc + (  (pre_salary_data.total_data.total_ctc || 0) - (pre_salary_data.salary_report.ctc || 0))),
                    'total_pf_bucket':(salary_earning_data.total_pf_bucket + ((pre_salary_data.total_data.total_pf_bucket || 0) - ( pre_salary_data.salary_report.total_pf_bucket || 0))),
                    'total_pf_wages':(salary_earning_data.total_pf_wages + ( (pre_salary_data.total_data.total_pf_wages || 0) - ( pre_salary_data.salary_report.total_pf_wages || 0))),
                    'total_esic_bucket':(salary_earning_data.total_esic_bucket + ((pre_salary_data.total_data.total_esic_bucket || 0) - (pre_salary_data.salary_report.total_esic_bucket || 0))),
                    'total_esic_wages':(salary_earning_data.total_esic_wages +  ((pre_salary_data.total_data.total_esic_wages || 0) - (pre_salary_data.salary_report.total_esic_wages || 0))),
                    'total_tds_wages':(salary_earning_data.total_tds_wages +  ((pre_salary_data.total_data.total_tds_wages || 0) - (pre_salary_data.salary_report.total_tds_wages || 0))),
                    'total_pt_wages':(salary_earning_data.total_pt_wages + ((pre_salary_data.total_data.total_pt_wages || 0) - (pre_salary_data.salary_report.total_pt_wages || 0))),
                    'bank_ins_referance_id':pre_salary_data.total_data.bank_ins_referance_id == '' ? '' :  pre_salary_data.total_data.bank_ins_referance_id,
                    'pf_challan_referance_id':pre_salary_data.total_data.pf_challan_referance_id == '' ? '' :  pre_salary_data.total_data.pf_challan_referance_id,
                    'esic_challan_referance_id':pre_salary_data.total_data.esic_challan_referance_id == '' ? '' :  pre_salary_data.total_data.esic_challan_referance_id,
                  };
                }
                else
                {
                  pre_monthly_wage_amount= pre_salary_data?.total_data?.total_pf_wages;

                  total_earning_data = { 
                    'total_earning':  salary_breakup.gross_earning,
                    'total_ctc': salary_breakup.ctc,
                    'total_pf_bucket':salary_breakup.total_pf_wages,
                    'total_pf_wages': module_wage_amount,
                    'total_esic_bucket': salary_breakup.total_esi_wages,
                    'total_esic_wages': salary_breakup.restrict_esic_wages,
                    'total_tds_wages': salary_breakup.total_tds_wages,
                    'total_pt_wages': salary_breakup.total_pt_wages,
                    'bank_ins_referance_id': '' ,
                    'pf_challan_referance_id': '' ,
                    'esic_challan_referance_id': '' ,
                  };
                } 
              }
              else
              {
                total_earning_data={ 
                  'total_earning':  salary_breakup.gross_earning,
                  'total_ctc': salary_breakup.ctc,
                  'total_pf_bucket':salary_breakup.total_pf_wages,
                  'total_pf_wages': module_wage_amount,
                  'total_esic_bucket': salary_breakup.total_esi_wages,
                  'total_esic_wages': salary_breakup.restrict_esic_wages,
                  'total_tds_wages': salary_breakup.total_tds_wages,
                  'total_pt_wages': salary_breakup.total_pt_wages,
                  'bank_ins_referance_id': '' ,
                  'pf_challan_referance_id': '' ,
                  'esic_challan_referance_id': '' ,
                };
              } 
              
              //Salary Report Data
              const salaryCalculatedPfData = await Site_helper.calculate_pf( epfo_temp, salary_earning_data.total_pf_wages, salary_temp_data, emp_data.employment_hr_details);
              const salaryCalculatedEsicData = await Site_helper.calculate_esic(esic_temp, salary_earning_data.total_esic_wages,gross_salary);
              const totalEarningCalculatedPfData = await Site_helper.calculate_pf( epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, emp_data.employment_hr_details);      
              const totalEarningCalculatedEsicData = await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages,gross_salary);
              //console.log('asdasdasd',salary_earning_data.lwf_data);
              
              salary_earning_data.lwf_data = await Site_helper.calculate_lwf(salary_breakup.gross_earning,attendence_month,attendence_year,comp_data,lwf_temp_data);
              //salary Report Pf Data
              salary_earning_data.pf_data = {
                emoloyee_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  salaryCalculatedPfData?.emoloyee_contribution
                ),
                total_employer_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  salaryCalculatedPfData?.total_employer_contribution
                ),
                // emoloyer_pf_contribution:  Site_helper.roundoff_func_helper(
                //   epfo_temp.round_off,
                //   salaryCalculatedPfData?.emoloyer_pf_contribution
                // ),
                emoloyer_pf_contribution: 0,
                emoloyer_eps_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  salaryCalculatedPfData?.emoloyer_eps_contribution
                ),
                emoloyer_edlis_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  salaryCalculatedPfData?.emoloyer_edlis_contribution
                ),
                emoloyer_epf_admin_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  salaryCalculatedPfData?.emoloyer_epf_admin_contribution
                ),
                emoloyer_edlis_admin_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  salaryCalculatedPfData?.emoloyer_edlis_admin_contribution
                ),
              };
              salary_earning_data.pf_data.emoloyer_pf_contribution = (salary_earning_data.pf_data.total_employer_contribution || 0) - (salary_earning_data.pf_data.emoloyer_eps_contribution || 0)

              //salary Report Esic Data
              salary_earning_data.esic_data = {
                emoloyee_contribution: await Site_helper.roundoff_func_helper(
                  esic_temp.round_off,
                  salaryCalculatedEsicData?.emoloyee_contribution
                ),
                emoloyer_contribution: await Site_helper.roundoff_func_helper(
                  esic_temp.round_off,
                  salaryCalculatedEsicData?.emoloyer_contribution
                ),
              };
              
              //Total Earning Data
              
              total_earning_data.pf_data = {
                emoloyee_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  totalEarningCalculatedPfData?.emoloyee_contribution
                ),
                total_employer_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  totalEarningCalculatedPfData?.total_employer_contribution
                ),
                // emoloyer_pf_contribution:  Site_helper.roundoff_func_helper(
                //   epfo_temp.round_off,
                //   totalEarningCalculatedPfData?.emoloyer_pf_contribution
                // ),
                emoloyer_pf_contribution: 0,
                emoloyer_eps_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  totalEarningCalculatedPfData?.emoloyer_eps_contribution
                ),
                emoloyer_edlis_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  totalEarningCalculatedPfData?.emoloyer_edlis_contribution
                ),
                emoloyer_epf_admin_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  totalEarningCalculatedPfData?.emoloyer_epf_admin_contribution
                ),
                emoloyer_edlis_admin_contribution:  Site_helper.roundoff_func_helper(
                  epfo_temp.round_off,
                  totalEarningCalculatedPfData?.emoloyer_edlis_admin_contribution
                ),
              };

              total_earning_data.pf_data.emoloyer_pf_contribution = total_earning_data.pf_data.total_employer_contribution - total_earning_data.pf_data.emoloyer_eps_contribution

              total_earning_data.esic_data = {
                emoloyee_contribution: await Site_helper.roundoff_func_helper(
                  esic_temp.round_off,
                  totalEarningCalculatedEsicData?.emoloyee_contribution
                ),
                emoloyer_contribution: await Site_helper.roundoff_func_helper(
                  esic_temp.round_off,
                  totalEarningCalculatedEsicData?.emoloyer_contribution
                ),
              };
              
              //P-tax  Calculation
              var p_tax_amount = await Site_helper.calculate_pt(req,currdate, ptax_temp_data?.state_name, total_earning_data.total_pt_wages?total_earning_data.total_pt_wages:0, );   
              p_tax_amount = await Site_helper.roundoff_func_helper(epfo_temp.round_off, p_tax_amount);
              
              var module_pt_amount= (p_tax_amount - (pre_total_pt - pre_salary_pt));
              salary_earning_data["pt_amount"]= module_pt_amount;
              total_earning_data["total_pt_amount"]= p_tax_amount;

              console.log(p_tax_amount, "ptax amount");
              console.log(total_earning_data.total_pt_amount, "total ptax amount");
              
              var emp_data={
                          _id:emp._id,
                          emp_id:emp.emp_id,
                          emp_first_name:emp.emp_first_name,
                          emp_last_name:emp.emp_last_name,
                          emp_emp_dob:emp.emp_dob,
                          emp_pan_no:emp.pan_no,
                          emp_aadhar_no:emp.aadhar_no,
                          emp_mob:emp.mobile_no,
                          emp_email_id:emp.email_id,
                          new_pf_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.new_pf_no:'NA'),
                          // esic_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.esic_no:'NA'),
                          esic_no:emp?.employee_details?.pf_esic_details?.curr_er_esic_details?.esic_no || "NA",
                          date_of_join:emp.employee_details.employment_hr_details.date_of_join,
                          sex:emp.sex,
                          age:emp.age,
                          EPF:emp.employee_details.employment_hr_details.pf_applicable,
                          EPS:emp.employee_details.employment_hr_details.pension_applicable,
                          Restrict_PF:emp.employee_details.template_data.salary_temp_data.restricted_pf,
                          ESIC:(gross_salary >  esic_temp.wage_ceiling ? 'no' : 'yes'),
                          Reg_Type:emp.employee_details.template_data.attendance_temp_data.register_type,
                          emp_uan_no:(emp.employee_details.pf_esic_details ? emp.employee_details.pf_esic_details.curr_er_epfo_details ? emp.employee_details.pf_esic_details.curr_er_epfo_details.uan_no :'NA' :'NA'),
                          attendance_summaries:emp.attendance_summaries[0],
                          hod: emp.hod ? emp.hod.first_name+" "+emp.hod.last_name : "",
                          branch:emp.branch,
                          designation:emp.designation,
                          department:emp.department,
                          client:emp.client,
              };

              if (emp_data.EPS == 'no') {
                salary_earning_data.pf_data["emoloyer_eps_contribution"] = 0
                total_earning_data.pf_data["emoloyer_eps_contribution"] = 0
              }

              var master_salary_breakup = emp?.employee_details?.salary_breakups?.find((breakup) =>{
                const effective_from = new Date(breakup.effective_from) 
                if((effective_from.getMonth() == +wage_month) && (effective_from.getFullYear() ==  +wage_year)){
                  return breakup;
                }
              });
              if(!master_salary_breakup){
                master_salary_breakup = await Site_helper.get_salary_breakup(req,salary_temp_data,master_gross_salary,emp.employee_details,monthdays,monthdays);
              }

              emp_data.EPF = master_salary_breakup.total_pf_wages ? 'yes' : 'no';

              var insert_data = {
                corporate_id: emp.corporate_id,
                emp_db_id: mongoose.Types.ObjectId(emp._id),
                emp_id: emp.emp_id,
                wage_month: parseInt(attendence_month),
                wage_year: parseInt(attendence_year),
                salary_report: salary_earning_data,
                total_data: total_earning_data,
                emp_data: emp_data,
                attendance_summaries: emp.attendance_summaries[0],
                master_report:master_salary_breakup,
                ins_generate: 'no',
                pf_generate: 'no',
                esic_generate: 'no',
                status: 'active',
              }


              // insert_data.total_data= total_earning_data;
              // if(pre_master_data == '')
              // {
                //insert_data.attendance_summaries= emp.attendance_summaries[0];
                // insert_data.master_report=master_salary_breakup;
              // }
              // console.log(insert_data.master_report, "master salary break up");
              
              

              const where_condition={'emp_id':emp.emp_id,wage_month:parseInt(attendence_month),wage_year:parseInt(attendence_year),corporate_id:emp.corporate_id};

              // const existedMonhtlyReport = await EmployeeMonthlyReport.findOne(where_condition);
              // if(existedMonhtlyReport){
              //   if(!existedMonhtlyReport.created_at){
              //     existedMonhtlyReport.created_at = Date.now()
              //   }
              //   existedMonhtlyReport.salary_report;
              //   existedMonhtlyReport.total_data;
              //   await existedMonhtlyReport.save();
              // }
              // console.log(insert_data, "update object");
              const ret_value = await EmployeeMonthlyReport.findOneAndUpdate(where_condition,{ $set: insert_data },{upsert: true, useFindAndModify:false});
              if(ret_value && !ret_value.created_at){
                ret_value.created_at = Date.now();
                ret_value.save()
              }
              
              salary_arr.push(insert_data);
            })).then(async (emps) => {
              next();
              //return resp.status(200).json({ status: "success", message: 'Salary sheet generated successfully.' });

            })

          });
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    generate_supplement_salary_sheet: async function(req, resp, next)
    {
      try {
        const v = new Validator(req.body, {
          attendance_month: 'required',
          attendance_year: 'required',
          supplement_adjust_day:'required',
          emp_id:'required'
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var attendence_month=req.body.attendance_month;
          var attendence_year=req.body.attendance_year;

          var att_summ= await AttendanceSummary.findOne({'emp_id':req.body.emp_id,'attendance_month':req.body.attendance_month,'attendance_year':req.body.attendance_year},'_id total_lop paydays');
          if(att_summ)
          {
            if(req.body.supplement_adjust_day > att_summ.total_lop)
            {
              return resp.status(200).send({ status: 'val_err', message:"Supplement days cannot be more than LOP dys" });
            }
          }
          const options = {};
          var filter_option={};
          var document={};
          var search_option= {$match: {
              $and:[ 
                {'corporate_id':req.authData.corporate_id},
                {'parent_hods':{$in: [req.authData.user_id] }},
                {'approval_status':'approved'},
                {'emp_id':req.body.emp_id}
              ]
            }};
          var search_option_details= {$match: {}};
          search_option_details.$match['attendance_summaries.attendance_month']= attendence_month.toString();
          search_option_details.$match['attendance_summaries.attendance_year']=  attendence_year.toString();
          //search_option_details.$match['hold_salary_emps.0']=  { "$exists": false };          
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
              from: 'employee_monthly_reports',
              "let": { "emp_db_idVar": "$_id"},
              "pipeline": [
                { "$match": { $and :[
                  {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                  {"wage_month": parseInt(attendence_month)},
                  {"wage_year": parseInt(attendence_year)},
                ] } }
              ],
              as: 'employee_monthly_reports',
            }},
            {$lookup:{
              from: 'staffs',
              localField: 'emp_hod',
              foreignField: '_id',
              as: 'hod'
            }},
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
            {$lookup:{
              from: 'companies',
              localField: 'corporate_id',
              foreignField: 'corporate_id',
              as: 'companies'
            }},
            {$lookup:{
              from: 'company_details',
              localField: 'companies._id',
              foreignField: 'company_id',
              as: 'company_details',
            }},
            search_option_details,
            { "$addFields": {
              "employee_details": {
                  "$arrayElemAt": [ "$employee_details", 0 ]
              },
              "employee_monthly_reports": {
                  "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
              },
              "hod": {
                  "$arrayElemAt": [ "$hod", 0 ]
              },
              "designation": {
                  "$arrayElemAt": [ "$designation", 0 ]
              },
              "department": {
                  "$arrayElemAt": [ "$department", 0 ]
              },
              "client": {
                  "$arrayElemAt": [ "$client", 0 ]
              }
              }
            },
            {
              $unwind: "$company_details"
            },
            {
              $addFields: {
                branch: {
                  $filter: {
                    input: "$company_details.company_branch",
                    as: "branch_item",
                    cond: {
                      $eq: [
                        "$employee_details.employment_hr_details.branch",
                        "$$branch_item._id"
                      ]
                    }
                  }
                }
              }
            },
            {
              $unwind: "$branch"
            },
            { 
              "$project": 
              { 
                "_id":1,
                "corporate_id":1,
                "userid":1,
                "emp_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_dob":1,
                "mobile_no":{ $ifNull: [ "$mobile_no", 'NA' ] },
                "age": {
                      $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
                        (365 * 24*60*60*1000)]
                      },
                "pan_no":1,
                "aadhar_no":1,
                "email_id":1,
                "empid":1,
                "sex":1,
                "client_code":1,
                "approval_status":1,
                "employee_details":1,
                "employee_advances":1,
                "hod.first_name":1,
                "hod.last_name":1,
                "hod.userid":1,
                "hod._id":1,
                "hold_salary_emps":1,
                "employee_monthly_reports":1,
                "branch.branch_name":1,
                "branch._id":1,
                "designation.designation_name":1,
                "designation._id":1,
                "department.department_name":1,
                "department._id":1,
                "client.client_name":1,
                "client._id":1,
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
              }
            },
          ]).then(async (emps) => {
            var salary_arr=[];
            var currdate = new Date();
            
            var epfo_temp=await Site_helper.get_gov_epfo_data(req);
            var esic_temp=await Site_helper.get_gov_esic_data(req);
            //console.log(emps);
            await Promise.all(emps.map( async function(emp) {
              var pre_total_pt=0;
              var pre_salary_pt=0;
              var emp_data = emp.employee_details;
              var emp_state = emp.employee_details.emp_address.state;
              var gross_salary =parseFloat(emp_data.employment_hr_details.gross_salary);
              var salary_temp_data = emp_data.template_data.salary_temp_data;

              var actu_attendence_month =parseFloat(attendence_month)+1;
              var monthdays=daysInMonth(actu_attendence_month,attendence_year);
              var paydays=req.body.supplement_adjust_day;
              
              var salary_breakup= await Site_helper.get_salary_breakup(req,salary_temp_data,gross_salary,emp_data,paydays,monthdays);
              //console.log('salary_breakup',salary_breakup);
              var pre_salary_data=emp.employee_monthly_reports;
              var pre_monthly_wage_amount=0;
              if(pre_salary_data)
              {
                if(pre_salary_data.supplement_salary_report)
                {
                  pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.supplement_salary_report.total_pf_wages);                     
                }
                else
                {
                  pre_monthly_wage_amount= pre_salary_data.total_data.total_pf_wages;
                }
              }
              if(salary_breakup.restricted_pf === "yes")
              {
                //var pre_monthly_wage_amount=(pre_salary_data?pre_salary_data.total_data.total_pf_wages:0);
                var template_wage_ceiling = salary_breakup.template_wage_ceiling;
                var avaiable_wage_amount= (template_wage_ceiling-pre_monthly_wage_amount);
                var module_wage_amount=(salary_breakup.total_pf_wages < parseFloat(avaiable_wage_amount) ? salary_breakup.total_pf_wages  : parseFloat(avaiable_wage_amount) );
                
              }
              else
              {
                var module_wage_amount= salary_breakup.total_pf_wages;
              }
              
              var salary_earning_data={

                heads:salary_breakup.heads,
                ctc:salary_breakup.ctc,
                total_pf_bucket:salary_breakup.total_pf_wages,
                total_pf_wages: module_wage_amount,
                total_esic_bucket:salary_breakup.total_esi_wages,
                total_esic_wages:salary_breakup.restrict_esic_wages,
                total_pt_wages:salary_breakup.total_pt_wages,
                total_tds_wages:salary_breakup.total_tds_wages,
                total_ot_wages:salary_breakup.total_ot_wages,
                total_gratuity_wages:salary_breakup.total_gratuity_wages,
                net_take_home:salary_breakup.net_take_home,
                gross_earning:salary_breakup.gross_earning,
                total_bonus_wages:salary_breakup.total_bonus_wages,
                bank_ins_referance_id:'',
                pf_challan_referance_id:'',
                esic_challan_referance_id:'',
                pf_generate: 'no',
                esic_generate: 'no',
              };

              if(pre_salary_data)
              {
                pre_total_pt = (pre_salary_data.total_data.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);
                if(pre_salary_data.supplement_salary_report)
                {
                  pre_salary_pt = (pre_salary_data.supplement_salary_report.pt_amount?pre_salary_data.supplement_salary_report.pt_amount:0);
                  var total_earning_data={ 
                    'total_earning': (salary_earning_data.gross_earning + (  pre_salary_data.total_data.total_earning - pre_salary_data.supplement_salary_report.gross_earning)),
                    'total_ctc': (salary_earning_data.ctc + (  pre_salary_data.total_data.total_ctc - pre_salary_data.supplement_salary_report.ctc)),
                    'total_pf_bucket':(salary_earning_data.total_pf_bucket + (pre_salary_data.total_data.total_pf_bucket -  pre_salary_data.supplement_salary_report.total_pf_bucket)),
                    'total_pf_wages':(salary_earning_data.total_pf_wages + ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.supplement_salary_report.total_pf_wages)),
                    'total_esic_bucket':(salary_earning_data.total_esic_bucket + (pre_salary_data.total_data.total_esic_bucket - pre_salary_data.supplement_salary_report.total_esic_bucket)),
                    'total_esic_wages':(salary_earning_data.total_esic_wages +  (pre_salary_data.total_data.total_esic_wages - pre_salary_data.supplement_salary_report.total_esic_wages)),
                    'total_tds_wages':(salary_earning_data.total_tds_wages +  (pre_salary_data.total_data.total_tds_wages - pre_salary_data.supplement_salary_report.total_tds_wages)),
                    'total_pt_wages':(salary_earning_data.total_pt_wages + (pre_salary_data.total_data.total_pt_wages - pre_salary_data.supplement_salary_report.total_pt_wages)),
                  };
                }
                else
                {
                  var total_earning_data={ 
                    'total_earning':  (salary_earning_data.gross_earning +   pre_salary_data.total_data.total_earning),
                    'total_ctc': (salary_earning_data.ctc + pre_salary_data.total_data.total_ctc),
                    'total_pf_bucket':(salary_earning_data.total_pf_bucket + pre_salary_data.total_data.total_pf_bucket),
                    'total_pf_wages': (salary_earning_data.total_pf_wages +  pre_salary_data.total_data.total_pf_wages),
                    'total_esic_bucket': (salary_earning_data.total_esic_bucket + pre_salary_data.total_data.total_esic_bucket),
                    'total_esic_wages': (salary_earning_data.total_esic_wages +  pre_salary_data.total_data.total_esic_wages),
                    'total_tds_wages':(salary_earning_data.total_tds_wages +  pre_salary_data.total_data.total_tds_wages),
                    'total_pt_wages': (salary_earning_data.total_pt_wages + pre_salary_data.total_data.total_pt_wages),
                  };
                } 
              }
              else
              {
                var total_earning_data={ 
                  'total_earning':  salary_breakup.gross_earning,
                  'total_ctc':  salary_breakup.ctc,
                  'total_pf_bucket':salary_breakup.total_pf_wages,
                  'total_pf_wages': module_wage_amount,
                  'total_esic_bucket': salary_breakup.total_esi_wages,
                  'total_esic_wages': salary_breakup.restrict_esic_wages,
                  'total_tds_wages': salary_breakup.total_tds_wages,
                  'total_pt_wages': salary_breakup.total_pt_wages,
                };
              } 
              
              var where_condition={'emp_id':emp.emp_id,wage_month:attendence_month,wage_year:attendence_year,corporate_id:emp.corporate_id};
              
              
              salary_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, salary_earning_data.total_esic_wages,gross_salary);
              salary_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, salary_earning_data.total_pf_wages, salary_temp_data, emp_data.employment_hr_details);
              
              total_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages,gross_salary);
              total_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, emp_data.employment_hr_details);                
                             
              var p_tax_amount = await Site_helper.calculate_pt(req,currdate,emp_state,total_earning_data.total_pt_wages?total_earning_data.total_pt_wages:0);                
              //console.log(p_tax_amount);
              var module_pt_amount= (p_tax_amount - (pre_total_pt - pre_salary_pt));
              salary_earning_data.pt_amount= module_pt_amount;
              total_earning_data.total_pt_amount= p_tax_amount;
              var insert_data={
                corporate_id:emp.corporate_id,
                emp_db_id:mongoose.Types.ObjectId(emp._id),
                emp_id: emp.emp_id,
                wage_month:attendence_month,
                wage_year:attendence_year,
                supplement_salary_report:salary_earning_data,
                total_data:total_earning_data,
                status:'active',
              }
              await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});
              var total_lop = (att_summ.total_lop - paydays);
              var supplement_adjust_day = paydays;
              await AttendanceSummary.findOneAndUpdate({'emp_id':req.body.emp_id,'attendance_month':req.body.attendance_month,'attendance_year':req.body.attendance_year},{'supplement_adjust_day':supplement_adjust_day,'total_lop':total_lop},{upsert: true, new: true, setDefaultsOnInsert: true});

            })).then(async (emps) => {
              return resp.status(200).json({ status: "success", message: 'Supplement salary sheet generated successfully.' });

            })

          });
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    get_salary_sheet_data:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
          pageno: 'required',
          salary_type: 'required|in:salary,supplement,earning',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
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
            search_option_details.$match['employee_monthly_reports.wage_month']= parseInt(wage_month);
            search_option_details.$match['employee_monthly_reports.wage_year']=  parseInt(wage_year);
            if(req.body.salary_type == 'supplement')
            {
              search_option_details.$match['employee_monthly_reports.supplement_salary_report']=  {$exists: true , $ne: null} ;
            }
            else
            {
              search_option_details.$match['employee_monthly_reports.salary_report']=  {$exists: true , $ne: null} ;
            }
            var myAggregate = Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              {$lookup:{
                from: 'employee_monthly_reports',
                // localField: '_id',
                // foreignField: 'emp_db_id',
                "let": { "emp_idVar": "$_id"},
                "pipeline": [
                  { "$match": { $and :[
                    {"$expr": { "$eq": ["$emp_db_id", "$$emp_idVar"] }},
                    {"_id" :{ $exists: true, $ne: null }},
                    {"wage_month": parseInt(wage_month)},
                    {"wage_year": parseInt(wage_year)},
                  ] } }
                ],
                as: 'employee_monthly_reports',
              }},
              
              search_option_details,              
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                },
                "employee_monthly_reports": {
                    "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                }
                }
              },
              
              { "$project": { 
                "_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_id":1,
                "emp_data":{$ifNull: [ "$employee_monthly_reports.emp_data", null]},
                "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                "employee_details":1,
                salary_report:{
                  $cond: { 
                    if: { $eq: [ "salary", req.body.salary_type ] }, 
                        then: { $ifNull: [ "$employee_monthly_reports.salary_report", {} ] },
                        else: { $ifNull: [ "$employee_monthly_reports.supplement_salary_report", {} ]} 
                        // else: { 
                        //   if: { $eq: [ "earning", req.body.salary_type ] },
                        //   then: { $ifNull: [ "$employee_monthly_reports.total_data", {} ] }, 
                        //   else: { $ifNull: [ "$employee_monthly_reports.supplement_salary_report", {} ]}
                          
                        // } 
                    }
                },
                total_report:{ $ifNull: [ "$employee_monthly_reports.total_data", {} ] },
                //master_report:{ $ifNull: [ "$employee_monthly_reports.master_report", {} ] },
                "corporate_id":1,
                bank_details:{ $ifNull: [ "$employee_details.bank_details", {} ] } ,
                }
              },
              ]);
              Employee.aggregatePaginate(myAggregate,options, async function (err, master_data) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"", master_data: master_data });
              });            
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },

    get_salary_sheet_data_details:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
          pageno: 'required',
          salary_type: 'required|in:salary,supplement,earning',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              // page: req.body.pageno,
              // limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
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

            search_option_details.$match['employee_monthly_reports.wage_month']= parseInt(wage_month);
            search_option_details.$match['employee_monthly_reports.wage_year']=  parseInt(wage_year);
            if(req.body.salary_type == 'supplement')
            {
              search_option_details.$match['employee_monthly_reports.supplement_salary_report']=  {$exists: true , $ne: null} ;
            }
            else
            {
              search_option_details.$match['employee_monthly_reports.salary_report']=  {$exists: true , $ne: null} ;
            }
            var myAggregate = Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              {$lookup:{
                from: 'employee_monthly_reports',
                // localField: '_id',
                // foreignField: 'emp_db_id',
                "let": { "emp_idVar": "$_id"},
                "pipeline": [
                  { "$match": { $and :[
                    {"$expr": { "$eq": ["$emp_db_id", "$$emp_idVar"] }},
                    {"_id" :{ $exists: true, $ne: null }},
                    {"wage_month": parseInt(wage_month)},
                    {"wage_year": parseInt(wage_year)},
                  ] } }
                ],
                as: 'employee_monthly_reports',
              }},
              
              search_option_details,   
              
             
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                },
                "employee_monthly_reports": {
                    "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                }
                }
              },
              
              { "$project": { 
                "_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_id":1,
                "emp_data":{$ifNull: [ "$employee_monthly_reports.emp_data", null]},
                "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                // "employee_details":1,
                salary_report:{
                  $cond: { 
                    if: { $eq: [ "salary", req.body.salary_type ] }, 
                        then: { $ifNull: [ "$employee_monthly_reports.salary_report", {} ] },
                        // else: { $ifNull: [ "$employee_monthly_reports.supplement_salary_report", {} ]} 
                        else: { 
                          $cond: {
                            if: { $eq: [ "earning", req.body.salary_type ] },
                            then: { $ifNull: [ "$employee_monthly_reports.total_data", {} ] }, 
                            else: { $ifNull: [ "$employee_monthly_reports.supplement_salary_report", {} ]}
                            
                          }

                        } 
                    }
                },
                master_report:{ $ifNull: [ "$employee_monthly_reports.master_report", {} ] },
                total_report:{ $ifNull: [ "$employee_monthly_reports.total_data", {} ] },
                ot_report:{ $ifNull: [ "$employee_monthly_reports.ot_report", {} ] },
                bonus_report:{ $ifNull: [ "$employee_monthly_reports.bonus_report", {} ] },
                advance_report:{ $ifNull: [ "$employee_monthly_reports.advance_report", {} ] },
                reimbursment_report:{ $ifNull: [ "$employee_monthly_reports.reimbursment_report", {} ] },
                incentive_report:{ $ifNull: [ "$employee_monthly_reports.incentive_report", {} ] },
                //master_report:{ $ifNull: [ "$employee_monthly_reports.master_report", {} ] },
                "corporate_id":1,
                bank_details:{ $ifNull: [ "$employee_details.bank_details", {} ] } ,
                attendance_heads:{$ifNull: [ "$employee_details.leave_balance_counter", [] ]}
                }
              },
              ]).then(master_data => {
                  return resp.status(200).send({ status: 'success',message:"", master_data: master_data });
              })
              // myAggregate.then()
              // Employee.find(myAggregate, async function (err, master_data) {
              //   if (err) return resp.status(200).send({ status: 'error', message: err.message });
              // });            
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },

    // generate_earning_sheet: async function (req, resp, next) {
    //     try {
    //         const v = new Validator(req.body, {
    //           attendance_month: 'required',
    //           attendance_year: 'required',
    //         });
    //         const matched = await v.check();
    //         if (!matched) {
    //             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //         }
    //         else{
    //           var attendence_month=req.body.attendance_month;
    //           var attendence_year=req.body.attendance_year;
    //           //console.log(attendence_month,attendence_year,'---')
    //           const options = {};
    //           var filter_option={};
    //           var document={};
    //           var search_option= {$match: {
    //               $and:[ 
    //                 {'corporate_id':req.authData.corporate_id},
    //                 {'parent_hods':{$in: [req.authData.user_id] }},
    //                 {'approval_status':'approved'},
    //               ]
    //             }};
    //           var search_option_details= {$match: {}};
    //           if(req.body.searchkey)
    //           {
    //             search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
    //           }
    //           else
    //           {
    //             if(req.body.emp_name)
    //             {
    //               search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
    //               search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
    //             }
    //             if(req.body.emp_last_name)
    //             {
    //               search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
    //             }
    //             if(req.body.email_id)
    //             {
    //               search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
    //             }
    //             if(req.body.emp_id)
    //             {
    //               search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
    //             }
    //             if(req.body.designation_id)
    //             {
    //               var designation_ids=JSON.parse(req.body.designation_id);
    //               designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //               search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
    //             }
    //             if(req.body.department_id)
    //             {
    //               var department_ids=JSON.parse(req.body.department_id);
    //               department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //               search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
    //             }
    //             if(req.body.branch_id)
    //             {
    //               var branch_ids=JSON.parse(req.body.branch_id);
    //               branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //               search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
    //             }
    //             if(req.body.client_code)
    //             {
    //               var client_codes=JSON.parse(req.body.client_code);
    //               search_option.$match.client_code={$in: client_codes};
    //             }
    //             if(req.body.hod_id)
    //             {
    //               var hod_ids=JSON.parse(req.body.hod_id);
    //               hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //               search_option.$match.emp_hod={$in: hod_ids};
    //             }
    //           }
    //           if(req.body.row_checked_all === "true")
    //           {
    //             var ids=JSON.parse(req.body.unchecked_row_ids);
    //             if(ids.length > 0)
    //             {
    //               ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //                 search_option.$match._id= { $nin: ids }
    //             }
    //           }
    //           else{
    //             var ids=JSON.parse(req.body.checked_row_ids);
    //             if(ids.length > 0)
    //             {
    //               ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //                 search_option.$match._id= { $in: ids }
    //             }
    //           }
    //           search_option_details.$match['attendance_summaries.attendance_month']= attendence_month.toString();
    //           search_option_details.$match['attendance_summaries.attendance_year']=  attendence_year.toString();
    //           search_option_details.$match['hold_salary_emps.0']=  { "$exists": false };
              
    //           var myAggregate = Employee.aggregate([
    //             search_option,
            
    //             {$lookup:{
    //               from: 'employee_details',
    //               localField: '_id',
    //               foreignField: 'employee_id',
    //               as: 'employee_details',
    //             }},
    //             {$lookup:{
    //               from: 'staffs',
    //               localField: 'emp_hod',
    //               foreignField: '_id',
    //               as: 'hod'
    //           }},
    //             {$lookup:{
    //               from: 'attendance_summaries',
    //               "let": { "emp_db_idVar": "$emp_id"},
    //                 "pipeline": [
    //                   { "$match": { $and :[
    //                     {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
    //                     {"attendance_month": attendence_month.toString()},
    //                     {"attendance_year": attendence_year.toString()},
    //                   ] } }
    //                 ],
    //               as: 'attendance_summaries'
    //             }},
    //             {$lookup:{
    //               from: 'hold_salary_emps',
    //               "let": { "emp_id_var": "$emp_id" },
    //               "pipeline": [
    //                 { 
    //                   "$match":{ $and:[
    //                     { "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }},
    //                     {'wage_month':{$eq : attendence_month.toString()} },
    //                     {'wage_year':{$eq : attendence_year.toString()} },
    //                     {'hold_type':{$eq : 'salaryWithCom'} },
    //                   ]},
    //                 },
    //               ],
    //               as: 'hold_salary_emps',
    //           }},
    //             search_option_details,
    //             {$lookup:{
    //               from: 'branches',
    //               localField: 'employee_details.employment_hr_details.branch',
    //               foreignField: '_id',
    //               as: 'branch'
    //             }},
    //             {$lookup:{
    //               from: 'designations',
    //               localField: 'employee_details.employment_hr_details.designation',
    //               foreignField: '_id',
    //               as: 'designation'
    //             }},
    //             {$lookup:{
    //               from: 'departments',
    //               localField: 'employee_details.employment_hr_details.department',
    //               foreignField: '_id',
    //               as: 'department'
    //             }},
    //             {$lookup:{
    //                 from: 'bonus_modules',
    //                 localField: '_id',
    //                 foreignField: 'emp_id',
    //                 as: 'bonus_module',
    //             }},
    //             {$lookup:{
    //               from: 'incentive_modules',
    //               localField: '_id',
    //               foreignField: 'emp_id',
    //               as: 'incentive_module',
    //           }},
    //           {$lookup:{
    //               from: 'employee_advances',
    //               "let": { "emp_id_var": "$emp_id","instalment_month_var":[attendence_month.toString()] },
    //               "pipeline": [
    //                 { 
    //                   "$match":{ $and:[
    //                     { "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] }},
    //                     { "instalment_history": { $elemMatch: { instalment_year: { $eq: attendence_year.toString() } } }},
    //                     { "instalment_history": { $elemMatch: { instalment_month: { $eq: attendence_month.toString() } } }},
    //                     { "instalment_history": { $elemMatch: { status: { $eq: 'pending' } } }}
    //                   ]},
    //                 },
    //               ],
    //               as: 'employee_advances',
    //           }},
    //             {$lookup:{
    //               from: 'extra_earnings',
    //               "let": { "emp_id": "$emp_id" },
    //               "pipeline": [
    //                 { "$match": { "$expr": { "$eq": ["$emp_id", "$$emp_id"] }}},
    //                 { "$lookup": {
    //                   "from": "extra_earning_heads",
    //                   "let": { "head_id": "$head_id" },
    //                   "pipeline": [
    //                     { "$match": { "$expr": { "$eq": ["$_id", "$$head_id"] }}}
    //                   ],
    //                   "as": "earning_head",
                      
    //                 }}
    //               ],
    //               as: 'extra_earning',
    //           }},
    //             { "$addFields": {
    //               "employee_details": {
    //                   "$arrayElemAt": [ "$employee_details", 0 ]
    //               }
    //               }
    //             },
    //             { "$project": { 
    //               "_id":1,
    //               "corporate_id":1,
    //               "userid":1,
    //               "emp_id":1,
    //               "emp_first_name":1,
    //               "emp_last_name":1,
    //               "emp_dob":1,
    //               "age": {
    //                     $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
    //                        (365 * 24*60*60*1000)]
    //                      },
    //               "pan_no":1,
    //               "aadhar_no":1,
    //               "email_id":1,
    //               "empid":1,
    //               "sex":1,
    //               "client_code":1,
    //               "approval_status":1,
    //               "employee_details":1,
    //               "employee_advances":1,
    //               "hod.first_name":1,
    //               "hod.last_name":1,
    //               "hod.userid":1,
    //               "hod._id":1,
    //               "bonus_module":1,
    //               "hold_salary_emps":1,
    //               attendance_summaries: {
    //                 $filter: {
    //                   input: "$attendance_summaries",
    //                   as: "attendance_summaries",
    //                   cond: {
    //                     $and: [
    //                       {$eq: ["$$attendance_summaries.attendance_month", attendence_month.toString()]},
    //                       {$eq: ["$$attendance_summaries.attendance_year", attendence_year.toString()]}
    //                     ]
    //                   }
    //                 }
    //               },
    //               incentive_module: {
    //                 $filter: {
    //                   input: "$incentive_module",
    //                   as: "incentive_module",
    //                   cond: {
    //                     $and: [
    //                       {$eq: ["$$incentive_module.incentive_g_month", attendence_month.toString()]},
    //                       {$eq: ["$$incentive_module.incentive_g_year", attendence_year.toString()]}
    //                     ]
    //                   }
    //                 }
    //               },
    //               // bonus_module: {
    //               //   $filter: {
    //               //     input: "$bonus_module",
    //               //     as: "bonus_module",
    //               //     cond: {
    //               //       $and: [
    //               //         {$eq: ["$$bonus_module.bonus_g_month", attendence_month.toString()]},
    //               //         {$eq: ["$$bonus_module.bonus_g_year", attendence_year.toString()]}
    //               //       ]
    //               //     }
    //               //   }
    //               // },
    //               extra_earning: {
    //                 $filter: {
    //                   input: "$extra_earning",
    //                   as: "extra_earning",
    //                   cond: {
    //                     $and: [
    //                       {$eq: ["$$extra_earning.wage_month", attendence_month.toString()]},
    //                       {$eq: ["$$extra_earning.wage_year", attendence_year.toString()]}
    //                     ]
    //                   }
    //                 }
    //               }, 
    //               }
    //             },
    //             ]).then(async (emps) => {
    //               //console.log({ "$expr": { "$in": ["$instalment_history.instalment_month","$$instalment_month_var" ] }})
    //               //console.log(emps,'aaaaaa')
    //               //var emp_new_data=[];
    //               var emp_earning_breakup=[];
    //               //var letter_content=''
                  
                  
    //               //var company_data =  getCompanyinfo(req.authData.corporate_id);
    //               //console.log('asdadasd',company_data)
    //               //return resp.status(200).send({ status: 'success', message:"",emp_sal_breakup:  'company_data' });

    //               var currdate = new Date();
    //               var epfo_temp=await Site_helper.get_gov_epfo_data(req);
    //               var esic_temp=await Site_helper.get_gov_esic_data(req);
    //               //var epfo_temp = Epforule.findOne({ "corporate_id": req.authData.corporate_id, effective_date: { $lte: currdate } }, '-history', { sort: { effective_date: -1 } });
    //               //var esic_temp = Esicrule.findOne({ "corporate_id": req.authData.corporate_id, effective_date: { $lte: currdate } }, '-history', { sort: { effective_date: -1 } });
    //               //epfo_temp= await epfo_temp;
    //               //esic_temp= await esic_temp;
    //               //console.log('epfo_temp',epfo_temp);
    //               //return resp.status(200).send({ status: 'val_err', message:esic_temp});
    //               await Promise.all(emps.map( async function(emp) {

                    
    //                 //console.log(emp,'---------------------------')
    //                 //console.log(emp._id,'~~~~~~~~~~~')
    //                 if(emp.employee_details)
    //                 {
    //                   if(emp.employee_details.template_data)
    //                   {
    //                     var emp_state = emp.employee_details.emp_address.state;
    //                     var attendance_temp_data =  emp.employee_details.template_data.attendance_temp_data?emp.employee_details.template_data.attendance_temp_data:null;
    //                     var bonus_temp_data =       emp.employee_details.template_data.bonus_temp_data?emp.employee_details.template_data.bonus_temp_data:null;
    //                     var incentive_temp_data =   emp.employee_details.template_data.incentive_temp_data?emp.employee_details.template_data.incentive_temp_data:null;
    //                     var leave_temp_data =  emp.employee_details.template_data.leave_temp_data?emp.employee_details.template_data.leave_temp_data:null;
    //                     var lwf_temp_data =  emp.employee_details.template_data.lwf_temp_data?emp.employee_details.template_data.lwf_temp_data:null;
    //                     var overtime_temp_data =  emp.employee_details.template_data.overtime_temp_data?emp.employee_details.template_data.overtime_temp_data:null;
    //                     var ptax_temp_data =  emp.employee_details.template_data.ptax_temp_data?emp.employee_details.template_data.ptax_temp_data:null;
    //                     var tds_temp_data =  emp.employee_details.template_data.tds_temp_data?emp.employee_details.template_data.tds_temp_data:null;
    //                     var salary_temp_data =  emp.employee_details.template_data.salary_temp_data?emp.employee_details.template_data.salary_temp_data:null;
    //                     var earnings=salary_temp_data.earnings;
    //                     var date_of_join=emp.employee_details.employment_hr_details.date_of_join;
    //                     var branch=emp.employee_details.employment_hr_details.branch;
    //                     var bonus_module='';
    //                     if(emp.bonus_module.length > 0)
    //                     {
    //                       bonus_module=emp.bonus_module[0];
    //                     }
                        
    //                     earnings.sort((a, b) => {
    //                       if (a.priority < b.priority) return -1
    //                       return a.priority > b.priority ? 1 : 0
    //                     })
    //                     var salary_template = salary_temp_data;
    //                     //console.log(emp.attendance_summaries)
    //                     if(emp.attendance_summaries)
    //                     {
    //                       var paydays=parseFloat(emp.attendance_summaries[0].paydays);
    //                        attendence_month =parseFloat(attendence_month)+1;
    //                       var monthdays=daysInMonth(attendence_month,attendence_year);
    //                     }
    //                     else
    //                     {
    //                       var paydays=0;
    //                       var monthdays=0;
    //                     }
    //                     var gross_salary=parseFloat(emp.employee_details.employment_hr_details.gross_salary);
    //                     var perday_salary=(gross_salary/monthdays);
    //                     var earned_salary=(perday_salary*paydays);
    //                     //console.log(monthdays,attendence_month)
    //                     var earned_salary_rate=gross_salary;

    //                     //console.log(gross_salary,perday_salary,earned_salary,paydays);
    //                     var minimum_wage_amount = salary_temp_data.minimum_wage_amount;
    //                     var retddata = [];
    //                     var head_earning = 0;
    //                     var basic = 0;
    //                     var gross_earning = 0;
    //                     var gross_deduct = 0;
    //                     var net_take_home = 0;
    //                     var voluntary_pf_amount = 0;
    //                     var total_pf_wages = 0;
    //                     var restrict_pf_wages = 0;
    //                     var total_esi_wages = 0;
    //                     var total_pt_wages = 0;
    //                     var total_tds_wages = 0;
    //                     var total_ot_wages = 0;
    //                     var total_bonus_wages = 0;
    //                     var total_gratuity_wages = 0;

    //                     var bonus_return_val='BMNC';

    //                     /* -----------------------   Rate calculation --------------*/
    //                     var retddata_rate = [];
    //                     var head_earning_rate = 0;
    //                     var gross_earning_rate = 0;
    //                     var gross_deduct_rate = 0;
    //                     var net_take_home_rate = 0;
    //                     var voluntary_pf_amount_rate = 0;
    //                     var total_pf_wages_rate = 0;
    //                     var total_esi_wages_rate = 0;
    //                     var total_pt_wages_rate = 0;
    //                     var total_tds_wages_rate = 0;
    //                     var total_ot_wages_rate = 0;
    //                     var total_bonus_wages_rate = 0;
    //                     var total_gratuity_wages_rate = 0;

    //                     //console.log('@', '@',paydays,'@');
    //                     /* --------- Calculate Head Data --------- */
    //                     await Promise.all(earnings.map(async (earning, keyval) => {
    //                       var earning2 = 0;
    //                       if (salary_template.advance === "yes") {
                            
    //                         var percentage_amount = ((earned_salary * salary_template.minimum_wage_percentage) / 100);
    //                         var percentage_amount_rate = ((earned_salary_rate * salary_template.minimum_wage_percentage) / 100);
    //                         //console.log('advance'+percentage_amount)
    //                         if (salary_template.wage_applicable === "higher") {
    //                           earned_salary = parseFloat((percentage_amount > minimum_wage_amount ? percentage_amount : minimum_wage_amount));
    //                           var rate_type = (percentage_amount > minimum_wage_amount ? 'percent' : 'amount');

    //                           earned_salary_rate = parseFloat((percentage_amount_rate > minimum_wage_amount ? percentage_amount_rate : minimum_wage_amount));
    //                           var rate_type_rate = (percentage_amount_rate > minimum_wage_amount ? 'percent' : 'amount');
    //                         }
    //                         else {
    //                           earned_salary = parseFloat((percentage_amount < minimum_wage_amount ? percentage_amount : minimum_wage_amount));
    //                           var rate_type = (percentage_amount < minimum_wage_amount ? 'percent' : 'amount');

    //                           earned_salary_rate = parseFloat((percentage_amount_rate < minimum_wage_amount ? percentage_amount_rate : minimum_wage_amount));
    //                           var rate_type_rate = (percentage_amount_rate < minimum_wage_amount ? 'percent' : 'amount');
    //                         }
    //                         var rate = (rate_type === 'percent' ? salary_template.minimum_wage_percentage : minimum_wage_amount);
    //                         var rate_rate = (rate_type_rate === 'percent' ? salary_template.minimum_wage_percentage : minimum_wage_amount);
    //                       }
    //                       //console.log('non-advance'+earned_salary)
    //                       /* --------   checking the earning type  --------------*/
    //                       if (earning.dependent_head) {
    //                         var filterObj = earnings.filter(function (filter_earning) {
    //                           return filter_earning.head_id == earning.dependent_head;
    //                         });
    //                         var dependant_headvalue = retddata.filter(function (retddata_val) {
    //                           return retddata_val.head_id == earning.dependent_head;
    //                         });

    //                         var dependant_headvalue_rate = retddata_rate.filter(function (retddata_val_rate) {
    //                           return retddata_val_rate.head_id == earning.dependent_head;
    //                         });
    //                         head_earning = parseFloat(((dependant_headvalue[0].amount * earning.percentage_amount) / 100));

    //                         head_earning_rate = parseFloat(((dependant_headvalue_rate[0].amount * earning.percentage_amount) / 100));
    //                         var rate_type = 'percent';
    //                         var rate_type_rate = 'percent';
    //                         var rate = earning.percentage_amount;
    //                         var rate_rate = earning.percentage_amount;
    //                         //console.log('dependent_head')
                            
    //                       }
    //                       else {
    //                         /* --------   checking the earning type  --------------*/
    //                         if (earning.earning_type === "percent") {
    //                           head_earning = parseFloat(((earned_salary * earning.earning_value) / 100))

    //                           head_earning_rate = parseFloat(((earned_salary_rate * earning.earning_value) / 100))
    //                         }
    //                         else {
    //                           head_earning = parseFloat(earning.earning_value)
    //                           head_earning_rate = parseFloat(earning.earning_value)
    //                         }
                            
    //                         var rate_type = earning.earning_type;
    //                         var rate = earning.earning_value;

    //                         var rate_type_rate = earning.earning_type;
    //                         var rate_rate = earning.earning_value;
    //                         //console.log('zxc dependent_head'+earning.earning_type)
    //                       }
    //                       //console.log(earning.earning_value+'amount'+head_earning+earned_salary)
    //                       //console.log('@', parseFloat(head_earning),'@');
    //                       /* --------   checking max allowance amount  --------------*/
    //                       if (earning.earning_type === "amount") {
    //                        //console.log('amount')
    //                         head_earning = (head_earning > earning.earning_value ? earning.earning_value : head_earning)
    //                         head_earning_rate = (head_earning_rate > earning.earning_value ? earning.earning_value : head_earning_rate)
    //                       }
    //                       else if (earning.earning_type === "percent") {
    //                         //console.log('percent')
    //                         var head_max_amount = ((earned_salary * earning.earning_value) / 100);
    //                         head_earning = (head_earning > head_max_amount ? head_max_amount : head_earning)

    //                         var head_max_amount_rate = ((earned_salary_rate * earning.earning_value) / 100);
    //                         head_earning_rate = (head_earning_rate > head_max_amount_rate ? head_max_amount_rate : head_earning_rate)
    //                       }
                          
    //                       /* --------   check allowance id exceeding the total salary or not  --------------*/
    //                       var curr_gross_earning = gross_earning + parseFloat(head_earning);
    //                       var curr_gross_earning_rate = gross_earning_rate + parseFloat(head_earning_rate);
    //                       if (curr_gross_earning > earned_salary) {
    //                         head_earning = (earned_salary - gross_earning);
    //                       }

    //                       if (curr_gross_earning_rate > earned_salary_rate) {
    //                         head_earning_rate = (earned_salary_rate - gross_earning_rate);
    //                       }

    //                       gross_earning = gross_earning + parseFloat(head_earning);

    //                       gross_earning_rate = gross_earning_rate + parseFloat(head_earning_rate);
    //                       /* --------  check the heads and calculate the earning wage  --------------*/
    //                       var head_inc = earning.head_include_in;
    //                       if (head_inc.indexOf("PF") !== -1) {
    //                         total_pf_wages = total_pf_wages + parseFloat(head_earning);
    //                       }
    //                       if (head_inc.indexOf("ESI") !== -1) {
                            
    //                         total_esi_wages = total_esi_wages + parseFloat(head_earning);
    //                       }
    //                       if (head_inc.indexOf("PT") !== -1) {
    //                         //console.log('~', parseFloat(head_earning),'~');
    //                         total_pt_wages = total_pt_wages + parseFloat(head_earning);
    //                       }
    //                       if (head_inc.indexOf("TDS") !== -1) {
    //                         total_tds_wages = total_tds_wages + parseFloat(head_earning);
    //                       }
    //                       if (head_inc.indexOf("OT") !== -1) {
    //                         total_ot_wages = total_ot_wages + parseFloat(head_earning);
    //                       }
    //                       if (head_inc.indexOf("Bonus") !== -1) {
    //                         total_bonus_wages = total_bonus_wages + parseFloat(head_earning);
    //                       }
    //                       if (head_inc.indexOf("Gratuity") !== -1) {
    //                         total_gratuity_wages = total_gratuity_wages + parseFloat(head_earning);
    //                       }

    //                       /* --------  check the heads and calculate the earning wage  --------------*/
    //                       var head_inc_rate = earning.head_include_in;
    //                       if (head_inc_rate.indexOf("PF") !== -1) {
    //                         total_pf_wages_rate = total_pf_wages_rate + parseFloat(head_earning_rate);
    //                       }
    //                       if (head_inc_rate.indexOf("ESI") !== -1) {
    //                         total_esi_wages_rate = total_esi_wages_rate + parseFloat(head_earning_rate);
    //                       }
    //                       if (head_inc_rate.indexOf("PT") !== -1) {
    //                         //console.log('~', parseFloat(head_earning_rate),'~');
    //                         total_pt_wages_rate = total_pt_wages_rate + parseFloat(head_earning_rate);
    //                       }
    //                       if (head_inc_rate.indexOf("TDS") !== -1) {
    //                         total_tds_wages_rate = total_tds_wages_rate + parseFloat(head_earning_rate);
    //                       }
    //                       if (head_inc_rate.indexOf("OT") !== -1) {
    //                         total_ot_wages_rate = total_ot_wages_rate + parseFloat(head_earning_rate);
    //                       }
    //                       if (head_inc_rate.indexOf("Bonus") !== -1) {
    //                         total_bonus_wages_rate = total_bonus_wages_rate + parseFloat(head_earning_rate);
    //                       }
    //                       if (head_inc_rate.indexOf("Gratuity") !== -1) {
    //                         total_gratuity_wages_rate = total_gratuity_wages_rate + parseFloat(head_earning_rate);
    //                       }
    //                       /* ------   if earning is greater then 0 then add the earning head  --------------------*/
    //                       if (head_earning > 0) {
    //                         retddata.push({ head_id: earning.head_id, head_title: earning.head_full_name, head_abbreviation : earning.head_abbreviation, head_rate_type: rate_type, head_rate: rate, amount: roundoff_func(epfo_temp.round_off, head_earning) })
    //                       }

    //                       if (head_earning_rate > 0) {
    //                         retddata_rate.push({ head_id: earning.head_id, head_title: earning.head_full_name, head_abbreviation: earning.head_abbreviation, head_rate_type: rate_type_rate, head_rate: rate_rate, amount: roundoff_func(epfo_temp.round_off, head_earning_rate) })
    //                       }
    //                     }))
    //                     /* --------- End Calculate Head Data --------- */

    //                     /* ---------- Calculate Extra Earning & Deduction Head -------------*/
    //                     var extra_earning_deduction=emp.extra_earning;
    //                     var extra_earning_data=[];
    //                     var extra_deduction_data=[];
    //                     if(extra_earning_deduction.length > 0)
    //                     {
    //                       await Promise.all(extra_earning_deduction.map(async (ex_earning_deduction, keyval) => {
    //                         if(ex_earning_deduction.earning_head[0])
    //                         {
    //                           var head_include_in = ex_earning_deduction.earning_head[0].head_include_in;
    //                           head_include_in=JSON.parse(head_include_in);
    //                           if (head_include_in.indexOf("PF") !== -1) {
    //                             total_pf_wages = total_pf_wages + parseFloat(ex_earning_deduction.amount);
    //                           }
    //                           if (head_include_in.indexOf("ESI") !== -1) {
    //                             total_esi_wages = total_esi_wages + parseFloat(ex_earning_deduction.amount);
    //                           }
    //                           if (head_include_in.indexOf("PT") !== -1) {
    //                             total_pt_wages = total_pt_wages + parseFloat(ex_earning_deduction.amount);
    //                           }
    //                           if (head_include_in.indexOf("TDS") !== -1) {
    //                             total_tds_wages = total_tds_wages + parseFloat(ex_earning_deduction.amount);
    //                           }
    //                           //console.log(head_include_in);
    //                           if(ex_earning_deduction.earning_head[0].earning_status == 'earning')
    //                           {
    //                             gross_earning = (gross_earning + parseFloat(ex_earning_deduction.amount))
    //                             extra_earning_data.push(
    //                               {
    //                                 earning_title:ex_earning_deduction.earning_head[0].head_name,
    //                                 earning_abbreviation:ex_earning_deduction.earning_head[0].abbreviation,
    //                                 earning_amount:ex_earning_deduction.amount
    //                               }
    //                               )
    //                           }
    //                           else
    //                           {
    //                             gross_earning = (gross_earning - parseFloat(ex_earning_deduction.amount))
    //                             extra_deduction_data.push(
    //                               {
    //                                 deduction_title:ex_earning_deduction.earning_head[0].head_name,
    //                                 deduction_abbreviation:ex_earning_deduction.earning_head[0].abbreviation,
    //                                 deduction_amount:ex_earning_deduction.amount
    //                               }
    //                               )
    //                           }
    //                         }
                            
    //                       }))
    //                     }
    //                     /* ---------- End Calculate Extra Head -------------*/


    //                     /* --------- Calculate Bonus Data --------- */
                        
    //                     //console.log(bonus_module,'#######');
    //                     if(bonus_module)
    //                     {
                          
    //                       var bonus_return_val = calculate_bonus(bonus_temp_data,date_of_join,gross_salary,bonus_module,total_bonus_wages,req.companyData);
    //                       //console.log(bonus_return_val,'=====',req.companyData,'====');
    //                       if(bonus_temp_data.epfo_apply == 'yes')
    //                       {
    //                         total_pf_wages=(total_pf_wages+parseFloat(bonus_return_val.bonus_amount)+parseFloat(bonus_return_val.exgratia_amount));
    //                       }
    //                       if(bonus_temp_data.esic_apply == 'yes')
    //                       {
    //                         total_esi_wages=(total_esi_wages+parseFloat(bonus_return_val.bonus_amount)+parseFloat(bonus_return_val.exgratia_amount));
    //                       }
    //                       if(bonus_temp_data.pt_apply == 'yes')
    //                       {
    //                         total_pt_wages=(total_pt_wages+parseFloat(bonus_return_val.bonus_amount)+parseFloat(bonus_return_val.exgratia_amount));
    //                       }
    //                       if(bonus_temp_data.tds_apply == 'yes')
    //                       {
    //                         total_tds_wages=(total_tds_wages+parseFloat(bonus_return_val.bonus_amount)+parseFloat(bonus_return_val.exgratia_amount));
    //                       }
    //                     }
    //                     /* --------- Calculate bonus Data end ------- */
    //                     /* ----------- Calculate PF Data -------- */
    //                     var pf_return_val = calculate_pf(await epfo_temp, total_pf_wages, salary_template, emp.employee_details.employment_hr_details);

    //                     var pf_return_val_rate = calculate_pf(await epfo_temp, total_pf_wages_rate, salary_template, emp.employee_details.employment_hr_details);
    //                     /* ----------- Calculate PF Data END */
    //                     /* ---------- Calculate ESIC Data --------- */
    //                     var esic_return_val = calculate_esic(esic_temp, total_esi_wages,gross_salary);
    //                     var esic_return_val_rate = calculate_esic(esic_temp, total_esi_wages_rate,gross_salary);
    //                     /* ----------- Calculate ESIC Data END --------- */
    //                     /* --------- Calculate P Tax Data ---------- */
    //                     var p_tax_amount = 0;
    //                     var p_tax_amount_rate = 0;
    //                     //console.log('----',total_pt_wages,'----')
    //                     //console.log(total_pt_wages);
    //                     var pt_temp = Ptaxrule.findOne({ "corporate_id": req.authData.corporate_id, effective_from: { $lte: currdate }, state_name: emp_state, 'tax_range_amount.amount_from': { $lte: parseFloat(total_pt_wages) }, 'tax_range_amount.amount_to': { $gte: parseFloat(total_pt_wages) } }, '-history', { sort: { effective_from: -1 } });
    //                     pt_temp = await pt_temp;
    //                     if (pt_temp) {
    //                       var ptax_arr = pt_temp.tax_range_amount;
    //                       var tax_amount = await Promise.all(ptax_arr.map(async (ptax_arr_exp) => {
    //                         if (ptax_arr_exp.amount_from <= total_pt_wages && ptax_arr_exp.amount_to >= total_pt_wages) {
    //                           p_tax_amount = ptax_arr_exp.tax_amount;
    //                         }
    //                       }))
    //                     }
                        
    //                     var pt_temp_rate = Ptaxrule.findOne({ "corporate_id": req.authData.corporate_id, effective_from: { $lte: currdate }, state_name: emp_state, 'tax_range_amount.amount_from': { $lte: parseFloat(total_pt_wages_rate) }, 'tax_range_amount.amount_to': { $gte: parseFloat(total_pt_wages_rate) } }, '-history', { sort: { effective_from: -1 } });
    //                     pt_temp_rate = await pt_temp_rate;
    //                     if (pt_temp_rate) {
    //                       var ptax_arr_rate = pt_temp_rate.tax_range_amount;
    //                       var tax_amount = await Promise.all(ptax_arr_rate.map(async (ptax_arr_exp_rate) => {
    //                         if (ptax_arr_exp_rate.amount_from <= total_pt_wages_rate && ptax_arr_exp_rate.amount_to >= total_pt_wages_rate) {
    //                           p_tax_amount_rate = ptax_arr_exp_rate.tax_amount;
    //                         }
    //                       }))
    //                     }
    //                     /* --------- Calculate P Tax Data END --------- */
    //                     /* --------- Calcualate Over Time Data -------- */
    //                       var total_ot_amount=0;
    //                     /* -------- Calculate Over Time Data END ------- */
    //                     /* ------   Calculate Incentive Data --------- */
    //                     var incentive_module=emp.incentive_module;
    //                     var incentive_advance_val=0;
    //                     var incentive_val=0;
    //                     if(incentive_module.length > 0)
    //                     {
    //                       incentive_module=emp.incentive_module[0];
    //                       var incentive_val=incentive_module.advance_value;
    //                       var incentive_advance_val=incentive_module.genarete_advance_value;
    //                     }
    //                     else
    //                     {
    //                       var incentive_val='IMNC';
    //                     }
    //                     /* ------   Calculate Incentive Data END */


    //                     /* ---------- Calculate Advance Adjustment -------------*/
    //                     var employee_advances_deduction=emp.employee_advances;
    //                     var employee_advances_data={
    //                       'advance_id':0,
    //                       'partial_pending':0,
    //                       'full_pending':0,
    //                       'recovered_advance_data':0,
    //                       'advance_start':0,
    //                       'further_advance':0,
    //                       'closing_advance': 0
    //                     };
    //                     var recovered_advance_data=0;
    //                     var advance_start=0;
    //                     var further_advance=0;
    //                     var recovery_status='no';
    //                     if(employee_advances_deduction.length > 0)
    //                     {
    //                       await Promise.all(employee_advances_deduction.map(async (advance_adjust, keyval) => {
                            
    //                        var instalment_history=advance_adjust.instalment_history;
    //                        var partial_pending=0;
    //                        var full_pending=0;
                           
    //                        //console.log(advance_adjust.payment_start_month, attendence_month.toString())
    //                         if(advance_adjust.payment_start_month == attendence_month.toString() && advance_adjust.payment_start_year == attendence_year.toString())
    //                         { 
    //                           further_advance=parseFloat(advance_adjust.advance_amount);
    //                         }
    //                         else
    //                         {
    //                           advance_start= parseFloat(advance_adjust.advance_outstanding);
    //                         }
    //                         instalment_history.map(async function(el) { 

    //                           if(el.instalment_month == attendence_month.toString() && el.instalment_year == attendence_year.toString())
    //                           { 
    //                             recovery_status='yes';
    //                             if(el.recovery_from == 'incentive')
    //                             {
    //                               if(incentive_val != 'IMNC')
    //                               {
    //                                 if(el.advance_amount <= incentive_val )  
    //                                 {
    //                                   recovered_advance_data= parseFloat(recovered_advance_data) + parseFloat(el.advance_amount);
    //                                 }
    //                                 else
    //                                 {
    //                                   partial_pending = (parseFloat(el.advance_amount) - parseFloat(incentive_val));
    //                                   recovered_advance_data= (parseFloat(recovered_advance_data) +  parseFloat(incentive_val));  
    //                                 }
    //                               }
    //                               else
    //                               {
    //                                 full_pending = parseFloat(el.advance_amount);
    //                               }
    //                             }
    //                             else if(el.recovery_from == 'bonus')
    //                             {
    //                               if(bonus_return_val != 'BMNC')
    //                               {
    //                                 if(el.advance_amount <= bonus_return_val.bonus_amount )  
    //                                 {
    //                                   recovered_advance_data= parseFloat(recovered_advance_data) + parseFloat(el.advance_amount);
    //                                 }
    //                                 else
    //                                 {
    //                                   partial_pending = (parseFloat(el.advance_amount) - parseFloat(bonus_return_val.bonus_amount));
    //                                   recovered_advance_data= (parseFloat(recovered_advance_data) + parseFloat(bonus_return_val.bonus_amount));  
    //                                 }
    //                               }
    //                               else
    //                               {
    //                                 full_pending = parseFloat(el.advance_amount);
    //                               }
    //                             }                                
    //                           }  
    //                         })
    //                         employee_advances_data=
    //                           {
    //                             'advance_id':advance_adjust._id,
    //                             'partial_pending':partial_pending,
    //                             'full_pending':full_pending,
    //                             'recovered_advance_data':recovered_advance_data,
    //                             'advance_start':advance_start,
    //                             'further_advance':further_advance,
    //                             'closing_advance': ((parseFloat(advance_start) + parseFloat(further_advance)) - parseFloat(recovered_advance_data))
    //                           };
    //                         //console.log('aaa'+instal_data);
                           
    //                       }))
    //                     }
                        
    //                     /* ---------- End Calculate Advance Adjustment -------------*/

    //                     /* ----- Calculate Gross Earning ------- */
    //                     gross_earning = (gross_earning + parseFloat(incentive_advance_val))

    //                     /* ----- Calculate Gross Earning END ------- */
    //                     /* ----- Calculate Gross Deduct ------- */
    //                     gross_deduct = gross_deduct + parseFloat(esic_return_val.emoloyee_contribution);
    //                     gross_deduct = gross_deduct + parseFloat(pf_return_val.emoloyee_contribution);
    //                     gross_deduct = gross_deduct + parseFloat(p_tax_amount);

    //                     gross_deduct_rate = gross_deduct_rate + parseFloat(esic_return_val_rate.emoloyee_contribution);
    //                     gross_deduct_rate = gross_deduct_rate + parseFloat(pf_return_val_rate.emoloyee_contribution);
    //                     gross_deduct_rate = gross_deduct_rate + parseFloat(p_tax_amount_rate);
    //                     /* ----- Calculate Gross Earning END ------- */
    //                     net_take_home = (gross_earning - gross_deduct);

    //                     net_take_home_rate = (gross_earning_rate - gross_deduct_rate);
    //                     /* ----- Calculate Voluntry PF Data ------- */
    //                     var voluntary_pf = salary_template.voluntary_pf;
    //                     if (voluntary_pf > 0) {
    //                       voluntary_pf_amount = ((net_take_home * voluntary_pf) / 100);
    //                       gross_deduct = (gross_deduct + voluntary_pf_amount);
    //                       net_take_home = (net_take_home - voluntary_pf_amount);
    //                     }

    //                     var voluntary_pf_rate = salary_template.voluntary_pf;
    //                     if (voluntary_pf_rate > 0) {
    //                       voluntary_pf_amount_rate = ((net_take_home_rate * voluntary_pf_rate) / 100);
    //                       gross_deduct_rate = (gross_deduct_rate + voluntary_pf_amount_rate);
    //                       net_take_home_rate = (net_take_home_rate - voluntary_pf_amount_rate);
    //                     }
    //                     /* ----- Calculate Voluntry PF Data END ------- */
    //                     /* ----- Calculate PF Contribution Data ------- */
    //                     var total_employeer_pf_contribution = (pf_return_val.emoloyer_pf_contribution + pf_return_val.emoloyer_eps_contribution + pf_return_val.emoloyer_edlis_contribution + pf_return_val.emoloyer_epf_admin_contribution + pf_return_val.emoloyer_edlis_admin_contribution);
    //                     var total_employeer_esic_contribution = esic_return_val.emoloyer_contribution;

    //                     var total_employeer_pf_contribution_rate = (pf_return_val_rate.emoloyer_pf_contribution + pf_return_val_rate.emoloyer_eps_contribution + pf_return_val_rate.emoloyer_edlis_contribution + pf_return_val_rate.emoloyer_epf_admin_contribution + pf_return_val_rate.emoloyer_edlis_admin_contribution);
    //                     var total_employeer_esic_contribution_rate = esic_return_val_rate.emoloyer_contribution;
    //                     /* ----- Calculate PF Contribution Data END ------- */
    //                     /* ----- Calculate CTC Data ------- */
    //                     var ctc_amount = (gross_earning + total_employeer_pf_contribution + total_employeer_esic_contribution);

    //                     var ctc_amount_rate = (gross_earning_rate + total_employeer_pf_contribution_rate + total_employeer_esic_contribution_rate);
    //                     /* ----- Calculate CTC Data END ------- */

    //                     if(emp.hod[0])
    //                     {
    //                       var hod_name=emp.hod[0].first_name + ' ' + emp.hod[0].last_name;
    //                     }
    //                     else
    //                     {
    //                       var hod_name='NA';
    //                     }
    //                     //console.log(breakupdata);
    //                     var breakupdata = {
    //                       corporate_id:emp.corporate_id,
    //                       wage_month:req.body.attendance_month,
    //                       wage_year:attendence_year,
    //                       emp_db_id:mongoose.Types.ObjectId(emp._id),
    //                       emp_id:emp.emp_id,
    //                       emp_data:
    //                       {
    //                         _id:emp._id,
    //                         emp_id:emp.emp_id,
    //                         emp_first_name:emp.emp_first_name,
    //                         emp_last_name:emp.emp_last_name,
    //                         emp_emp_dob:emp.emp_dob,
    //                         emp_pan_no:emp.pan_no,
    //                         emp_aadhar_no:emp.aadhar_no,
    //                         emp_email_id:emp.email_id,
    //                         new_pf_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.new_pf_no:'NA'),
    //                         esic_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.esic_no:'NA'),
    //                         date_of_join:emp.employee_details.employment_hr_details.date_of_join,
    //                         sex:emp.sex,
    //                         age:emp.age,
    //                         EPF:emp.employee_details.employment_hr_details.pf_applicable,
    //                         EPS:emp.employee_details.employment_hr_details.pension_applicable,
    //                         Restrict_PF:emp.employee_details.template_data.salary_temp_data.restricted_pf,
    //                         ESIC:(gross_earning_rate >  esic_temp.wage_ceiling ? 'NO' : 'YES'),
    //                         Reg_Type:emp.employee_details.template_data.attendance_temp_data.register_type,
    //                         emp_uan_no:(emp.employee_details.pf_esic_details?emp.employee_details.pf_esic_details.curr_er_epfo_details.uan_no:'NA'),
    //                         attendance_summaries:emp.attendance_summaries[0],
    //                         hod:hod_name,
    //                         bank_data:emp.employee_details.bank_details,
    //                         branch:branch
    //                       },
    //                       heads: retddata,
    //                       heads_rate: retddata_rate,
    //                       epf_data: {
    //                         emoloyee_contribution: roundoff_func(epfo_temp.round_off, pf_return_val.emoloyee_contribution),
    //                         total_employer_contribution: roundoff_func(epfo_temp.round_off, pf_return_val.total_employer_contribution),
    //                         emoloyer_pf_contribution: roundoff_func(epfo_temp.round_off, pf_return_val.emoloyer_pf_contribution),
    //                         emoloyer_eps_contribution: roundoff_func(epfo_temp.round_off, pf_return_val.emoloyer_eps_contribution),
    //                         emoloyer_edlis_contribution: roundoff_func(epfo_temp.round_off, pf_return_val.emoloyer_edlis_contribution),
    //                         emoloyer_epf_admin_contribution: roundoff_func(epfo_temp.round_off, pf_return_val.emoloyer_epf_admin_contribution),
    //                         emoloyer_edlis_admin_contribution: roundoff_func(epfo_temp.round_off, pf_return_val.emoloyer_edlis_admin_contribution)
    //                       },
    //                       epf_data_rate: {
    //                         emoloyee_contribution_rate: roundoff_func(epfo_temp.round_off, pf_return_val_rate.emoloyee_contribution),
    //                         total_employer_contribution_rate: roundoff_func(epfo_temp.round_off, pf_return_val_rate.total_employer_contribution),
    //                         emoloyer_pf_contribution_rate: roundoff_func(epfo_temp.round_off, pf_return_val_rate.emoloyer_pf_contribution),
    //                         emoloyer_eps_contribution_rate: roundoff_func(epfo_temp.round_off, pf_return_val_rate.emoloyer_eps_contribution),
    //                         emoloyer_edlis_contribution_rate: roundoff_func(epfo_temp.round_off, pf_return_val_rate.emoloyer_edlis_contribution),
    //                         emoloyer_epf_admin_contribution_rate: roundoff_func(epfo_temp.round_off, pf_return_val_rate.emoloyer_epf_admin_contribution),
    //                         emoloyer_edlis_admin_contribution_rate: roundoff_func(epfo_temp.round_off, pf_return_val_rate.emoloyer_edlis_admin_contribution)
    //                       },
    //                       p_tax_amount: roundoff_func(epfo_temp.round_off, p_tax_amount),
    //                       p_tax_amount_rate: roundoff_func(epfo_temp.round_off, p_tax_amount_rate),
    //                       esic_data: {
    //                         emoloyee_contribution: roundoff_func(epfo_temp.round_off, esic_return_val.emoloyee_contribution),
    //                         emoloyer_contribution: roundoff_func(epfo_temp.round_off, esic_return_val.emoloyer_contribution)
    //                       },
    //                       esic_data_rate: {
    //                         emoloyee_contribution_rate: roundoff_func(epfo_temp.round_off, esic_return_val_rate.emoloyee_contribution),
    //                         emoloyer_contribution_rate: roundoff_func(epfo_temp.round_off, esic_return_val_rate.emoloyer_contribution)
    //                       },
    //                       restrict_pf_wages:epfo_temp.restrict_pf_wages,
    //                       restricted_pf_wages:roundoff_func(epfo_temp.round_off,pf_return_val.restricted_pf_wages),
    //                       total_pf_wages:roundoff_func(epfo_temp.round_off,pf_return_val.total_pf_wages),
    //                       edlis_wages:roundoff_func(epfo_temp.round_off,pf_return_val.edlis_wages),
    //                       eps_wages:roundoff_func(epfo_temp.round_off,pf_return_val.eps_wages),
    //                       total_esi_wages_bucket:roundoff_func(esic_temp.round_off,total_esi_wages),
    //                       total_esi_wages: roundoff_func(esic_temp.round_off,(gross_earning_rate >  esic_temp.wage_ceiling ? 0 : total_esi_wages)),
    //                       total_pt_wages:roundoff_func(epfo_temp.round_off,total_pt_wages),
    //                       total_tds_wages:roundoff_func(epfo_temp.round_off,total_tds_wages),
    //                       total_ot_wages:roundoff_func(epfo_temp.round_off,total_ot_wages),
    //                       total_bonus_wages:roundoff_func(epfo_temp.round_off,total_bonus_wages),
    //                       total_gratuity_wages:roundoff_func(epfo_temp.round_off,total_gratuity_wages),
    //                       bonus_amount:roundoff_func(epfo_temp.round_off,bonus_return_val.bonus_amount),
                          

                          
    //                       restricted_pf_wages_rate:roundoff_func(epfo_temp.round_off,pf_return_val_rate.restricted_pf_wages),
    //                       total_pf_wages_rate:roundoff_func(epfo_temp.round_off,pf_return_val_rate.total_pf_wages),
    //                       edlis_wages_rate:roundoff_func(epfo_temp.round_off,pf_return_val_rate.edlis_wages),
    //                       eps_wages_rate:roundoff_func(epfo_temp.round_off,pf_return_val_rate.eps_wages),
    //                       total_esi_wages_bucket_rate:roundoff_func(esic_temp.round_off,total_esi_wages_rate),
    //                       total_esi_wages_rate: roundoff_func(esic_temp.round_off,(gross_earning_rate >  esic_temp.wage_ceiling ? 0 : total_esi_wages_rate)),
    //                       total_pt_wages_rate:roundoff_func(epfo_temp.round_off,total_pt_wages_rate),
    //                       total_tds_wages_rate:roundoff_func(epfo_temp.round_off,total_tds_wages_rate),
    //                       total_ot_wages_rate:roundoff_func(epfo_temp.round_off,total_ot_wages_rate),
    //                       total_bonus_wages_rate:roundoff_func(epfo_temp.round_off,total_bonus_wages_rate),
    //                       total_gratuity_wages_rate:roundoff_func(epfo_temp.round_off,total_gratuity_wages_rate),


    //                       gratuity_amount:0,
    //                       total_tds_amount:0,
    //                       extra_earning_data:extra_earning_data,
    //                       extra_deduction_data:extra_deduction_data,
    //                       advance_recovered:recovered_advance_data,
    //                       employee_advances_data:employee_advances_data,
    //                       total_ot_amount:total_ot_amount,
    //                       incentive_val:incentive_val,
    //                       incentive_advance_val:incentive_advance_val,
    //                       gross_earning: roundoff_func(epfo_temp.round_off, gross_earning),
    //                       gross_deduct: roundoff_func(epfo_temp.round_off, gross_deduct),
    //                       net_take_home: roundoff_func(epfo_temp.round_off, net_take_home),
    //                       voluntary_pf_amount: roundoff_func(epfo_temp.round_off, voluntary_pf_amount),
    //                       total_employeer_pf_contribution: roundoff_func(epfo_temp.round_off, total_employeer_pf_contribution),
    //                       total_employeer_esic_contribution: roundoff_func(epfo_temp.round_off, total_employeer_esic_contribution),
    //                       ctc_amount: roundoff_func(epfo_temp.round_off, ctc_amount),

    //                       gross_earning_rate: roundoff_func(epfo_temp.round_off, gross_earning_rate),
    //                       gross_deduct_rate: roundoff_func(epfo_temp.round_off, gross_deduct_rate),
    //                       net_take_home_rate: roundoff_func(epfo_temp.round_off, net_take_home_rate),
    //                       voluntary_pf_amount_rate: roundoff_func(epfo_temp.round_off, voluntary_pf_amount_rate),
    //                       total_employeer_pf_contribution_rate: roundoff_func(epfo_temp.round_off, total_employeer_pf_contribution_rate),
    //                       total_employeer_esic_contribution_rate: roundoff_func(epfo_temp.round_off, total_employeer_esic_contribution_rate),
    //                       ctc_amount_rate: roundoff_func(epfo_temp.round_off, ctc_amount_rate),
    //                       status:'active',
    //                       created_at:new Date(),
    //                       referance_id:'',
    //                       pf_challan_referance_id:'',
    //                       esic_challan_referance_id:''
    //                     }

    //                     emp_earning_breakup.push(breakupdata);
    //                     await MasterReport.findOneAndUpdate({'emp_id':breakupdata.emp_id,wage_month:breakupdata.wage_month,wage_year:breakupdata.wage_year,corporate_id:breakupdata.corporate_id},breakupdata,{upsert: true, new: true, setDefaultsOnInsert: true})
                        

    //                     //console.log(emp_new_data)
    //                   }
    //                 }
    //               }));
    //               return resp.status(200).send({ status: 'success', message:"",emp_sal_breakup:emp_earning_breakup,emps:emps });
    //             });
    //         }
    //         //return resp.status(200).json({ status: "success", message: e ? e.message : 'Something went wrong' });
    //       }
    //       catch (e) {
    //         return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    //       }
    // },
    // get_master_sheet_data:async function(req, resp){
    //   try {
    //     const v = new Validator(req.body, {
    //       wage_month: 'required',
    //       wage_year: 'required',
    //       pageno: 'required',
    //     });
    //     const matched = await v.check();
    //     if (!matched) {
    //         return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //     }
    //     else{
    //       var wage_month=req.body.wage_month;
    //         var wage_year=req.body.wage_year;
    //         var sortbyfield = req.body.sortbyfield
    //         if(sortbyfield)
    //         {
    //             var sortoption = {};
    //             sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
    //         }
    //         else{
    //             var sortoption = {created_at: -1};
    //         }
    //         const options = {
    //           page: req.body.pageno,
    //           limit: req.body.perpage?req.body.perpage:perpage,
    //           sort:    sortoption,
    //         };
    //         var filter_option={};
    //         var document={};
    //         var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
    //         var search_option_details= {$match: {}};
    //         if(req.body.searchkey)
    //         {
    //           search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
    //         }
    //         else
    //         {
    //           if(req.body.emp_name)
    //           {
    //             search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
    //             search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
    //           }
    //           if(req.body.emp_last_name)
    //           {
    //             search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
    //           }
    //           if(req.body.email_id)
    //           {
    //             search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
    //           }
    //           if(req.body.emp_id)
    //           {
    //             search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
    //           }
    //           if(req.body.designation_id)
    //           {
    //             var designation_ids=JSON.parse(req.body.designation_id);
    //             designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //             search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
    //           }
    //           if(req.body.department_id)
    //           {
    //             var department_ids=JSON.parse(req.body.department_id);
    //             department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //             search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
    //           }
    //           if(req.body.branch_id)
    //           {
    //             var branch_ids=JSON.parse(req.body.branch_id);
    //             branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //             search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
    //           }
    //           if(req.body.client_code)
    //           {
    //             var client_codes=JSON.parse(req.body.client_code);
    //             search_option.$match.client_code={$in: client_codes};
    //           }
    //           if(req.body.hod_id)
    //           {
    //             var hod_ids=JSON.parse(req.body.hod_id);
    //             hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
    //             search_option.$match.emp_hod={$in: hod_ids};
    //           }
    //         }
    //         search_option_details.$match['master_report.wage_month']= wage_month.toString();
    //         search_option_details.$match['master_report.wage_year']=  wage_year.toString();
    //         var myAggregate = Employee.aggregate([
    //           search_option,
    //           {$lookup:{
    //             from: 'employee_details',
    //             localField: '_id',
    //             foreignField: 'employee_id',
    //             as: 'employee_details',
    //           }},
    //           {$lookup:{
    //             from: 'master_reports',
    //             localField: 'emp_id',
    //             foreignField: 'emp_id',
    //             as: 'master_report'
    //           }},
              
    //           search_option_details,
    //           {$lookup:{
    //             from: 'branches',
    //             localField: 'employee_details.employment_hr_details.branch',
    //             foreignField: '_id',
    //             as: 'branch'
    //           }},
    //           {$lookup:{
    //             from: 'designations',
    //             localField: 'employee_details.employment_hr_details.designation',
    //             foreignField: '_id',
    //             as: 'designation'
    //           }},
    //           {$lookup:{
    //             from: 'departments',
    //             localField: 'employee_details.employment_hr_details.department',
    //             foreignField: '_id',
    //             as: 'department'
    //           }},
    //           { "$addFields": {
    //             "employee_details": {
    //                 "$arrayElemAt": [ "$employee_details", 0 ]
    //             }
    //             }
    //           },
              
    //           { "$project": { 
    //             "_id":1,
    //             "master_report":1,
    //             master_report: {
    //               $filter: {
    //                 input: "$master_report",
    //                 as: "master_report",
    //                 cond: {
    //                   $and: [
    //                     {$eq: ["$$master_report.wage_month", wage_month.toString()]},
    //                     {$eq: ["$$master_report.wage_year", wage_year.toString()]}
    //                   ]
    //                 }
    //               }
    //             },
    //             }
    //           },
    //           { "$addFields": {
    //             "master_report": {
    //                 "$arrayElemAt": [ "$master_report", 0 ]
    //             }
    //             }
    //           },
    //           ]);
    //           Employee.aggregatePaginate(myAggregate,options, async function (err, master_data) {
    //             if (err) return resp.status(200).send({ status: 'error', message: err.message });
    //             return resp.status(200).send({ status: 'success',message:"", master_data: master_data });
    //           });
            
    //     }
    //   }
    //   catch (e) {
    //     return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    //   }
    // },
    
         
    // var leave_head = await LeaveTempHead.find(filter_option);
    // var heads = await SalaryTempHead.find(filter_option);


    export_master_sheet:async function(req,resp,next, client_req = true){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(403).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            // var filter_option={"corporate_id":req.authData.corporate_id};
            // var leave_head = await LeaveTempHead.find(filter_option);
            // var heads = await SalaryTempHead.find(filter_option);
            var masterTemplate = await EmployeeSheetTemplate.findById(req.body.template_id);
            var company = await Company.findOne({'_id':req.authId},'establishment_name');
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
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
           if(client_req){
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

            search_option_details.$match['employee_monthly_reports.wage_month']= parseInt(wage_month);
            search_option_details.$match['employee_monthly_reports.wage_year']=  parseInt(wage_year);
            if(req.body.salary_type == 'supplement')
            {
              search_option_details.$match['employee_monthly_reports.supplement_salary_report']=  {$exists: true , $ne: null} ;
            }
            else
            {
              search_option_details.$match['employee_monthly_reports.salary_report']=  {$exists: true , $ne: null} ;
            }
                var reportdata = await Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              {$lookup:{
                from: 'employee_monthly_reports',
                "let": { "emp_db_idVar": "$_id"},
                "pipeline": [
                  { "$match": { $and :[
                    {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                    {"salary_report":{$exists: true , $ne: null}},
                    {"wage_month": parseInt(wage_month)},
                    {"wage_year": parseInt(wage_year)},
                  ] } }
                ],
                as: 'employee_monthly_reports',
              }},
              
              search_option_details,   
              
             
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                },
                "employee_monthly_reports": {
                    "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                }
                }
              },
              
              { "$project": { 
                "_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_id":1,
                "emp_data":{$ifNull: [ "$employee_monthly_reports.emp_data", null]},
                "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                // "employee_details":1,
                salary_report:{
                  $cond: { 
                    if: { $eq: [ "salary", req.body.salary_type || 'salary' ] }, 
                        then: { $ifNull: [ "$employee_monthly_reports.salary_report", {} ] },
                        else: { $ifNull: [ "$employee_monthly_reports.supplement_salary_report", {} ]} 
                        // else: { 
                        //   if: { $eq: [ "earning", req.body.salary_type ] },
                        //   then: { $ifNull: [ "$employee_monthly_reports.total_data", {} ] }, 
                        //   else: { $ifNull: [ "$employee_monthly_reports.supplement_salary_report", {} ]}
                          
                        // } 
                    }
                },
                master_report:{ $ifNull: [ "$employee_monthly_reports.master_report", {} ] },
                total_report:{ $ifNull: [ "$employee_monthly_reports.total_data", {} ] },
                ot_report:{ $ifNull: [ "$employee_monthly_reports.ot_report", {} ] },
                bonus_report:{ $ifNull: [ "$employee_monthly_reports.bonus_report", {} ] },
                advance_report:{ $ifNull: [ "$employee_monthly_reports.advance_report", {} ] },
                reimbursment_report:{ $ifNull: [ "$employee_monthly_reports.reimbursment_report", {} ] },
                incentive_report:{ $ifNull: [ "$employee_monthly_reports.incentive_report", {} ] },
                //master_report:{ $ifNull: [ "$employee_monthly_reports.master_report", {} ] },
                "corporate_id":1,
                bank_details:{ $ifNull: [ "$employee_details.bank_details", {} ] } ,
                attendance_heads:{$ifNull: [ "$employee_details.leave_balance_counter", [] ]}
                }
              },
               ])
              
                if(reportdata.length>0)
                {
                  var user_details_temp;
                  var master_details_temp;
                  var attendance_temp;
                  var earnings_temp;
                  var disbursment_temp;
                  var master_heads = [];
                  var earning_heads = [];
                  var attendance_heads = [];

                  masterTemplate.template_fields.forEach(field => {
                    if(field.main_slug == 'userdetails') user_details_temp = field
                    if(field.main_slug == 'master') master_details_temp = field
                    if(field.main_slug == 'attendance') attendance_temp = field
                    if(field.main_slug == 'earnings') earnings_temp = field
                    if(field.main_slug == 'disbursment') disbursment_temp = field
                  })

                  reportdata.forEach(d => {
                    if(master_details_temp && master_details_temp.modules.length){
                      d.master_report.heads.forEach(head =>{
                       if(!master_heads.find(obj => String(obj.head_id )== String(head.head_id))){
                         master_heads.push(head)
                       }
                     })
                    }
                    if(attendance_temp && attendance_temp.modules.length){
                      d.attendance_heads.forEach(head =>{
                       if(!attendance_heads.find(obj => String(obj._id) == String(head._id))){
                         attendance_heads.push(head)
                       }
                     })
                    }
                    if(earnings_temp &&  earnings_temp.modules.length){
                      d.salary_report.heads.forEach(head =>{
                       if(!earning_heads.find(obj => String(obj.head_id) == String(head.head_id))){
                         earning_heads.push(head)
                       }
                     })
                    }
                  })
                  

                  var counter_val=1;
                  var personal_detailsCount = 0
                  var other_detailsCount = 0;
                  var master_total_wageCount = 0;
                  var master_contributionsCount = 0;
                  var master_deductionCount = 0;
                  var master_earningCount = 0;
                  var attendanceCount = 0;
                  var earning_total_wageCount = 0;
                  var variable_earningCount = 0;
                  var earning_contributionsCount = 0;
                  var earning_deductionCount = 0;
                  var advanceCount = 0;
                  var earningCount = 0;
                  var disbursmentCount = 0;
                  var excel_array={};

                  if(user_details_temp && user_details_temp.modules.length){
                    await Promise.all(user_details_temp.modules.map((d => {
                      if(d.module_slug == 'personal_details' && d.fields.length){
                        personal_detailsCount = d.fields.length
                      } 
                      if(d.module_slug == 'other_details' && d.fields.length){
                        other_detailsCount = d.fields.length
                      } 
                      d.fields.forEach(f =>{
                        if(f && f !== 'on')
                        excel_array[f]=counter_val++;
                      })
                    })))
                  }else{
                    user_details_temp = {
                      modules:[]
                    }
                  }

                  if(master_details_temp && master_details_temp.modules.length && master_heads.length)
                  await Promise.all(master_heads.map((head_exp) => {
                    var head_abbreviation = head_exp.head_abbreviation
                      excel_array[head_abbreviation+'_rate']=counter_val++;
                  }));
                  if(master_details_temp && master_details_temp.modules.length){
                    await Promise.all(master_details_temp.modules.map((d => {
                      if(d.module_slug == 'master_wagesbucket' && d.fields.length){
                        master_total_wageCount = d.fields.length
                      } 
                      if(d.module_slug == 'master_contribution' && d.fields.length){
                        master_contributionsCount = d.fields.length
                      } 
                      if(d.module_slug == 'master_deductions' && d.fields.length){
                        master_deductionCount = d.fields.length 
                      } 
                      if(d.module_slug == 'master_payment' && d.fields.length){
                        master_earningCount = d.fields.length 
                      } 
                      d.fields.forEach(f =>{
                        if(f && f !== 'on' && f !== 'master-dynamic-heads'){
                          excel_array[f+'_rate']=counter_val++;
                        }
                      })
                    })))
                  }else{
                    master_details_temp ={
                      modules:[]
                    }
                  }

                  if(attendance_temp && attendance_temp.modules.length){
                    await Promise.all(attendance_temp.modules.map((d => {
                      if(d.module_slug == 'attendance' && d.fields.length){
                        attendanceCount = d.fields.length 
                      } 
                      d.fields.forEach(f =>{
                        if(f && f !== 'on' && f !== 'attendance-dynamic-heads'){
                          excel_array[f]=counter_val++;
                        }
                      })
                    })))
                  }else{
                    attendance_temp = {
                      modules:[]
                    }
                  }
                  if(attendance_temp && attendance_temp.modules.length && attendance_heads.length){
                    await Promise.all(attendance_heads.map(async (leave_head_exp) => {
                      var head_abbreviation = leave_head_exp.abbreviation;
                      excel_array[head_abbreviation]=counter_val++;
                    }));
                  }

                  if(earnings_temp && earnings_temp.modules.length && earning_heads.length){
                    await Promise.all(earning_heads.map(async (head_exp) => {
                      var head_abbreviation = head_exp.head_abbreviation;
                      excel_array[head_abbreviation]=counter_val++;
                    }));
                  }
                  if(earnings_temp && earnings_temp.modules.length){
                    await Promise.all(earnings_temp.modules.map((d => {
                      if(d.module_slug == 'wagesbucket' && d.fields.length){
                        earning_total_wageCount = d.fields.length
                      } 
                      if(d.module_slug == 'variableearnings' && d.fields.length){
                        variable_earningCount = d.fields.length
                      } 
                      if(d.module_slug == 'contribution' && d.fields.length){
                        earning_contributionsCount = d.fields.length
                      } 
                      if(d.module_slug == 'deductions' && d.fields.length){
                        earning_deductionCount = d.fields.length
                      } 
                      if(d.module_slug == 'advance' && d.fields.length){
                        advanceCount = d.fields.length
                      } 
                      if(d.module_slug == 'earnings' && d.fields.length){
                        earningCount = d.fields.length
                      } 
                      d.fields.forEach(f =>{
                        if(f && f !== 'on' && f !== 'dynamic-heads'){
                          excel_array[f]=counter_val++;
                        }
                      })
                    })))
                  }else{
                    earnings_temp = {
                      modules:[]
                    }
                  }

                  if(disbursment_temp && disbursment_temp.modules.length){
                    await Promise.all(disbursment_temp.modules.map((d => {
                      if(d.module_slug == 'disbursment' && d.fields.length){
                        disbursmentCount = d.fields.length
                      } 
                      d.fields.forEach(f =>{
                        if(f && f !== 'on'){
                          excel_array[f]=counter_val++;
                        }
                      })
                    })))
                  }else{
                    disbursment_temp = {
                      modules:[]
                    }
                  }
                  // excel_array['total_pf_wages_rate']=counter_val++;
                  // excel_array['edlis_wages_rate']=counter_val++;
                  // excel_array['eps_wages_rate']=counter_val++;
                  // excel_array['total_esic_bucket_rate']=counter_val++;
                  // excel_array['total_esic_wages_rate']=counter_val++;
                  // excel_array['total_pt_wages_rate']=counter_val++;
                  // excel_array['total_tds_wages_rate']=counter_val++;
                  // excel_array['total_ot_wages_rate']=counter_val++;
                  // excel_array['total_bonus_wages_rate']=counter_val++;
                  // excel_array['total_gratuity_wages_rate']=counter_val++;

                  // excel_array['emoloyer_pf_contribution_rate']=counter_val++;
                  // excel_array['emoloyer_contribution_rate']=counter_val++;
                  // excel_array['total_employer_contribution_rate']=counter_val++;
                  // excel_array['emoloyee_pf_contribution_rate']=counter_val++;
                  // excel_array['emoloyee_esic_contribution_rate']=counter_val++;
                  // excel_array['esic_data_rate']=counter_val++;
                  // excel_array['total_employee_contribution_rate']=counter_val++;

                  // excel_array['emoloyee_contribution_rate']=counter_val++;
                  // excel_array['emoloyee_esic_contribution_rate']=counter_val++;
                  // excel_array['p_tax_amount_rate']=counter_val++;
                  // excel_array['gross_deduct_rate']=counter_val++;

                  // excel_array['ctc_rate']=counter_val++;
                  // excel_array['gross_earning_rate']=counter_val++;
                  // excel_array['net_take_home_rate']=counter_val++;

                  // excel_array['month_days']=counter_val++;
                  // excel_array['week_offs']=counter_val++;
                  // excel_array['holidays']=counter_val++;
                  // excel_array['paydays']=counter_val++;
                  // excel_array['total_attendance']=counter_val++;
                  // excel_array['assumed_present']=counter_val++;
                  // excel_array['total_late_lop']=counter_val++;
                  // excel_array['total_lop']=counter_val++;
                  // excel_array['roll_over_attendance']=counter_val++;


                  // excel_array['total_pf_bucket']=counter_val++;
                  // excel_array['total_pf_wages']=counter_val++;
                  // excel_array['edlis_wages']=counter_val++;
                  // excel_array['eps_wages']=counter_val++;
                  // excel_array['total_esic_bucket']=counter_val++;
                  // excel_array['total_esic_wages']=counter_val++;
                  // excel_array['total_pt_wages']=counter_val++;
                  // excel_array['total_tds_wages']=counter_val++;
                  // excel_array['total_ot_wages']=counter_val++;
                  // excel_array['total_bonus_wages']=counter_val++;
                  // excel_array['total_gratuity_wages']=counter_val++;

                  
                  // excel_array['incentive_val']=counter_val++;
                  // excel_array['bonus_amount']=counter_val++;
                  // excel_array['total_ot_amount']=counter_val++;
                  // excel_array['gross_earning']=counter_val++;

                  // excel_array['emoloyer_pf_contribution']=counter_val++;
                  // excel_array['emoloyer_contribution']=counter_val++;
                  // excel_array['total_employer_contribution']=counter_val++;
                  // excel_array['emoloyee_pf_contribution']=counter_val++;
                  // excel_array['emoloyee_contribution']=counter_val++;
                  // excel_array['esic_data']=counter_val++;
                  // excel_array['total_er_contribution']=counter_val++;

                  // excel_array['emoloyee_contribution']=counter_val++;
                  // excel_array['emoloyee_esic_contribution']=counter_val++;
                  // excel_array['p_tax_amount']=counter_val++;
                  // excel_array['gross_deduct']=counter_val++;

                  // excel_array['advance_start']=counter_val++;
                  // excel_array['recovered_advance_data']=counter_val++;
                  // excel_array['further_advance']=counter_val++;
                  // excel_array['closing_advance']=counter_val++;

                  // excel_array['ctc']=counter_val++;
                  // excel_array['gross_earning']=counter_val++;
                  // excel_array['net_take_home']=counter_val++;

                  // excel_array['payment_mode']=counter_val++;
                  // excel_array['bank']=counter_val++;
                  // excel_array['account_no']=counter_val++;
                  // excel_array['ifsc_code']=counter_val++;
                  // var personal_details= user_details_temp.modules.find(d => d.module_slug == 'personal_details').fields.length - 1;
                  // var other_details= user_details_temp.modules.find(d => d.module_slug == 'other_details').fields.length - 1;
                  var personal_details= personal_detailsCount;
                  var other_details= other_detailsCount;

                  var user_details=(personal_details+other_details);
                  
                  var dynamic_head=master_heads.length;
                  var dynamic_head_start= user_details;
                  if(dynamic_head) dynamic_head_start++ 
                  var dynamic_head_end= (user_details + dynamic_head);

                  var master_total_wage= master_total_wageCount
                  var master_total_wage_start= dynamic_head_end;
                  if(master_total_wage) master_total_wage_start++;
                  var master_total_wage_end= (dynamic_head_end + master_total_wage);

                  var master_contributions= master_contributionsCount;
                  var master_contributions_start= master_total_wage_end;
                  if(master_contributions) master_contributions_start++;
                  var master_contributions_end= (master_total_wage_end + master_contributions);

                  var master_deduction=  master_deductionCount;
                  var master_deduction_start= master_contributions_end;
                  if(master_deduction) master_deduction_start++;
                  var master_deduction_end= (master_contributions_end + master_deduction);

                  var master_earning= master_earningCount;
                  var master_earning_start= master_deduction_end;
                  if(master_earning) master_earning_start++;
                  var master_earning_end= (master_deduction_end + master_earning);

                  var master_start=(user_details+1);
                  var master_end=(master_earning_end);

                  var attendance= attendanceCount;
                  var attendance_start= master_end ;
                  if(attendance) attendance_start++
                  var attendance_end= (master_end + attendance);

                  var leave_head_dy=attendance_heads.length;
                  var leave_head_dy_start= attendance_end;
                  if(leave_head_dy)leave_head_dy_start++
                  var leave_head_dy_end= (attendance_end + leave_head_dy);
                  
                  var total_attendance_start=(attendance_start+1);
                  var total_attendance_end=(leave_head_dy_end);

                  var dynamic_head=earning_heads.length;
                  var dynamic_head_earning_start= total_attendance_end;
                  if(dynamic_head) dynamic_head_earning_start++;
                  var dynamic_head_earning_end= (total_attendance_end + dynamic_head);

                  var earning_total_wage= earning_total_wageCount
                  var earning_total_wage_start= dynamic_head_earning_end;
                  if(earning_total_wage) earning_total_wage_start++
                  var earning_total_wage_end= (dynamic_head_earning_end + earning_total_wage);

                  var variable_earning= variable_earningCount
                  var variable_earning_start= earning_total_wage_end;
                  if(variable_earning) variable_earning_start++
                  var variable_earning_end= (earning_total_wage_end + variable_earning);

                  var earning_contributions= earning_contributionsCount
                  var earning_contributions_start= variable_earning_end;
                  if(earning_contributions) earning_contributions_start++
                  var earning_contributions_end= (variable_earning_end + earning_contributions);

                  var earning_deduction= earning_deductionCount
                  var earning_deduction_start= earning_contributions_end;
                  if(earning_deduction) earning_deduction_start++
                  var earning_deduction_end= (earning_contributions_end + earning_deduction);

                  var advance=advanceCount
                  var advance_start= earning_deduction_end;
                  if(advance) advance_start++
                  var advance_end= (earning_deduction_end + advance);

                  var  earning= earningCount
                  var  earning_start= advance_end;
                  if( earning) earning_start++
                  var  earning_end= (advance_end + earning);

                  var  earning_total_start= (total_attendance_end + 1);
                  var  earning_total_end= (earning_end);

                  var  disbursment= disbursmentCount;
                  var  disbursment_start= earning_total_end;
                  if(disbursment)disbursment_start++
                  var  disbursment_end= (earning_total_end + disbursment);

                  // var attendance =0;

                  // var attendance=0;
                  // var earning=0;
                  // var advance=0;
                  // var earning=0;

                  // var disbursment=0;


                  var wb = new xl.Workbook();
                  
                  var ws = wb.addWorksheet('Sheet 1');
                  ws.cell(1, 1, 1, 4, true).string(company?.establishment_name).style({alignment: {vertical: 'center',horizontal: 'center'}});
                  if(personal_detailsCount || other_detailsCount){
                    ws.cell(2, 1, 2, user_details, true).string('USER DETAILS').style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(
                    master_total_wageCount|| 
                    master_contributionsCount || 
                    master_deductionCount|| 
                    master_earningCount
                  ){
                    ws.cell(2, master_start, 2, master_end, true).string('MASTER').style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(attendanceCount){
                    ws.cell(2, attendance_start, 2, total_attendance_end, true).string('ATTENDANCE').style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(
                    earning_total_wageCount||
                    variable_earningCount||
                    earning_contributionsCount||
                    earning_deductionCount||
                    advanceCount||
                    earningCount
                  ){
                    ws.cell(2, earning_total_start, 2, earning_total_end, true).string('EARNINGS').style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(disbursmentCount){
                    ws.cell(2, disbursment_start, 2, disbursment_end, true).string('DISBURSMENT').style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(personal_detailsCount){
                    ws.cell(3, 1, 3, personal_details, true).string("PERSONAL DETAILS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(other_detailsCount){
                    ws.cell(3, (personal_details+1), 3, (personal_details + other_details), true).string("OTHER DETAILS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(master_heads.length){
                    ws.cell(3, dynamic_head_start, 3, dynamic_head_end, true).string("DYNAMIC SALARY HEADS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(master_total_wageCount){
                    ws.cell(3, master_total_wage_start, 3, master_total_wage_end, true).string("MASTER TOTAL WAGES").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(master_contributionsCount){ 
                     ws.cell(3, master_contributions_start, 3, master_contributions_end, true).string("CONTRIBUTION").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(master_deductionCount){ 
                     ws.cell(3, master_deduction_start, 3, master_deduction_end, true).string("DEDUCTIONS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(master_earningCount){ 
                     ws.cell(3, master_earning_start, 3, master_earning_end, true).string("EARNINGS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }


                  // ws.cell(2, master_contributions_start, 2, master_contributions_end, true).string("CONTRIBUTION").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  // ws.cell(2, master_deduction_start, 2, master_deduction_end, true).string("DEDUCTIONS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  // ws.cell(2, master_earning_start, 2, master_earning_end, true).string("EARNINGS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  
                  if(attendanceCount){
                    ws.cell(3, attendance_start, 3, attendance_end, true).string("ATTENDANCE").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(attendance_heads.length){
                    ws.cell(3, leave_head_dy_start, 3, leave_head_dy_end, true).string("PAID LEAVES").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(earning_heads.length){
                    ws.cell(3, dynamic_head_earning_start, 3, dynamic_head_earning_end, true).string("DYNAMIC SALARY HEADS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }

                  if(earning_total_wageCount){
                     ws.cell(3, earning_total_wage_start, 3, earning_total_wage_end, true).string("EARNED WAGES").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(variable_earningCount){
                  ws.cell(3, variable_earning_start, 3, variable_earning_end, true).string("VARIABLE EARNINGS").style({alignment: {vertical: 'center',horizontal: 'center'}});

                  }
                  if(earning_contributionsCount){
                  ws.cell(3, earning_contributions_start, 3, earning_contributions_end, true).string("CONTRIBUTION").style({alignment: {vertical: 'center',horizontal: 'center'}});

                  }
                  if(earning_deductionCount){
                  ws.cell(3, earning_deduction_start, 3, earning_deduction_end, true).string("DEDUCTIONS").style({alignment: {vertical: 'center',horizontal: 'center'}});

                  }
                  if(advanceCount){
                  ws.cell(3, advance_start, 3, advance_end, true).string("ADVANCE").style({alignment: {vertical: 'center',horizontal: 'center'}});

                  }
                  if(earningCount){
                  ws.cell(3, earning_start, 3, earning_end, true).string("EARNINGS").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }
                  if(disbursmentCount){
                  ws.cell(3, disbursment_start, 3, disbursment_end, true).string("DISBURSMENT").style({alignment: {vertical: 'center',horizontal: 'center'}});
                  }


                  ws.cell( 4,excel_array['sl_no']).string('SL. NO.');
                  ws.cell( 4,excel_array['emp_first_name']).string('FIRST NAME');
                  ws.cell( 4,excel_array['emp_last_name']).string('LAST NAME');
                  ws.cell( 4,excel_array['emp_id']).string('EMP ID');
                  ws.cell( 4,excel_array['uan_no']).string('UAN NO');
                  ws.cell( 4,excel_array['pf_no']).string('PF NO');
                  ws.cell( 4,excel_array['esic_no']).string('ESIC NO');
                  ws.cell( 4,excel_array['doj']).string('DOJ');
                  ws.cell( 4,excel_array['sex']).string('SEX');
                  ws.cell( 4,excel_array['age']).string('AGE');
                  ws.cell( 4,excel_array['branch']).string('BRANCH');
                  ws.cell( 4,excel_array['department']).string('DEPARTMENT');
                  ws.cell( 4,excel_array['hod']).string('HOD');
                  ws.cell( 4,excel_array['designation']).string('DESIGNATION');
                  ws.cell( 4,excel_array['client']).string('CLIENT');
                  ws.cell( 4,excel_array['restricted_pf']).string('RESTRICT PF');
                  ws.cell( 4,excel_array['reg_type']).string('REG TYPE');
                  ws.cell( 4,excel_array['epf']).string('EPF');
                  ws.cell( 4,excel_array['eps']).string('EPS');
                  ws.cell( 4,excel_array['esic']).string('ESIC');

                  await Promise.all(master_heads.map(async (report_heads_exp) => {
                    ws.cell( 4,excel_array[report_heads_exp.head_abbreviation+'_rate']).string(report_heads_exp.head_abbreviation);
                  }));

                  ws.cell( 4,excel_array['total_pf_bucket_rate']).string('PF BUCKET');
                  ws.cell( 4,excel_array['total_pf_wages_rate']).string('PF WAGES');
                  ws.cell( 4,excel_array['edlis_wages_rate']).string('EDLI WAGES');
                  ws.cell( 4,excel_array['eps_wages_rate']).string('EPS WAGES');
                  ws.cell( 4,excel_array['total_esic_bucket_rate']).string('ESI BUCKET');
                  ws.cell( 4,excel_array['total_esic_wages_rate']).string('ESI WAGES');
                  ws.cell( 4,excel_array['total_pt_wages_rate']).string('PT WAGES');
                  ws.cell( 4,excel_array['total_tds_wages_rate']).string('TDS WAGES');
                  ws.cell( 4,excel_array['total_ot_wages_rate']).string('OT WAGES');
                  ws.cell( 4,excel_array['total_bonus_wages_rate']).string('BONUS WAGES');
                  ws.cell( 4,excel_array['total_gratuity_wages_rate']).string('GRATUITY WAGES');
                  
                  ws.cell( 4,excel_array['emoloyer_pf_contribution_rate']).string('ER EPF');
                  ws.cell( 4,excel_array['emoloyer_eps_contribution_rate']).string('ER EPS');
                  ws.cell( 4,excel_array['emoloyer_epf_admin_contribution_rate']).string('ADMIN');
                  ws.cell( 4,excel_array['emoloyer_edlis_contribution_rate']).string('EDLI');
                  ws.cell( 4,excel_array['emoloyer_esic_contribution_rate']).string('ER ESIC');
                  ws.cell( 4,excel_array['total_employer_contribution_rate']).string('TOTAL ER CONTRIBUTION');
                  
                  ws.cell( 4,excel_array['emoloyee_pf_contribution_rate']).string('EE PF');
                  ws.cell( 4,excel_array['emoloyee_esic_contribution_rate']).string('EE ESIC');
                  ws.cell( 4,excel_array['p_tax_amount_rate']).string('P.TAX');
                  ws.cell( 4,excel_array['voluntary_pf_amount_rate']).string('VPF');
                  ws.cell( 4,excel_array['total_employee_contribution_rate']).string('TOTAL EE DEDUCTION');
                  // ws.cell( 4,excel_array['gross_deduct_rate']).string('TOTAL DEDUCTION');

                  ws.cell( 4,excel_array['ctc_rate']).string('CTC');
                  ws.cell( 4,excel_array['gross_earning_rate']).string('GROSS');
                  ws.cell( 4,excel_array['net_take_home_rate']).string('NET PAY');

                  ws.cell( 4,excel_array['month_days']).string('MONTH DAYS');
                  ws.cell( 4,excel_array['week_offs']).string('WEEK OFFS');
                  ws.cell( 4,excel_array['holidays']).string('HOLIDAYS');
                  ws.cell( 4,excel_array['paydays']).string('PAY DAYS');
                  ws.cell( 4,excel_array['total_attendance']).string('PRESENT DAYS');
                  ws.cell( 4,excel_array['assumed_present']).string('ASSUMED PRESENT');
                  ws.cell( 4,excel_array['total_late_lop']).string('LATE LOSS OF PAY');
                  ws.cell( 4,excel_array['total_lop']).string('LOSS OF PAY');
                  ws.cell( 4,excel_array['roll_over_attendance']).string('ROLL OVER ATTENDANCE');

                  await Promise.all(attendance_heads.map(async (leave_head_exp) => {
                    var head_abbreviation = leave_head_exp.abbreviation;
                    ws.cell( 4,excel_array[head_abbreviation]).string(leave_head_exp.leave_type_name);
                  }));

                  await Promise.all(earning_heads.map(async (report_heads_exp) => {
                    ws.cell( 4,excel_array[report_heads_exp.head_abbreviation]).string(report_heads_exp.head_abbreviation);
                  }));
                  // ws.cell( 4,56).string('HRA');
                  // ws.cell( 4,57).string('DF SFSFS');

                  ws.cell( 4,excel_array['total_pf_bucket']).string('PF BUCKET');
                  ws.cell( 4,excel_array['total_pf_wages']).string('PF WAGES');
                  ws.cell( 4,excel_array['edlis_wages']).string('EDLI WAGES');
                  ws.cell( 4,excel_array['eps_wages']).string('EPS WAGES');
                  ws.cell( 4,excel_array['total_esic_bucket']).string('ESI BUCKET');
                  ws.cell( 4,excel_array['total_esic_wages']).string('ESI WAGES');
                  ws.cell( 4,excel_array['total_pt_wages']).string('PT WAGES');
                  ws.cell( 4,excel_array['total_tds_wages']).string('TDS WAGES');
                  ws.cell( 4,excel_array['total_ot_wages']).string('OT WAGES');
                  ws.cell( 4,excel_array['total_bonus_wages']).string('BONUS WAGES');
                  ws.cell( 4,excel_array['total_gratuity_wages']).string('GRATUITY WAGES');

                  ws.cell( 4,excel_array['incentive_val']).string('INCENTIVE');
                  ws.cell( 4,excel_array['bonus_amount']).string('BONUS');
                  ws.cell( 4,excel_array['bonus_ex_gratia']).string('BONUS EX-GRATIA');
                  ws.cell( 4,excel_array['total_ot_amount']).string('OVER TIME');
                  ws.cell( 4,excel_array['reimbursement_gross_earning']).string('REIMBURSMENT');    

                  ws.cell( 4,excel_array['emoloyer_pf_contribution']).string('ER EPF');
                  ws.cell( 4,excel_array['emoloyer_eps_contribution']).string('ER EPS');
                  ws.cell( 4,excel_array['emoloyer_epf_admin_contribution']).string('ADMIN');
                  ws.cell( 4,excel_array['emoloyer_edlis_contribution']).string('EDLI');
                  ws.cell( 4,excel_array['emoloyer_esic_contribution']).string('ER ESIC');
                  ws.cell( 4,excel_array['total_employer_contribution']).string('TOTAL ER CONTRIBUTION');

                  ws.cell( 4,excel_array['emoloyee_pf_contribution']).string('EE PF');
                  ws.cell( 4,excel_array['emoloyee_esic_contribution']).string('EE ESIC');
                  ws.cell( 4,excel_array['pt_amount']).string('P.Tax');
                  ws.cell( 4,excel_array['voluntary_pf_amount']).string('VPF');
                  ws.cell( 4,excel_array['total_ee_contribution']).string('TOTAL EE DEDUCTION');

                  ws.cell( 4,excel_array['advance_start']).string('OPENING BALANCE');
                  ws.cell( 4,excel_array['recovered_advance_data']).string('RECOVERED FOR THE MONTH');
                  ws.cell( 4,excel_array['further_advance']).string('FURTHER ADVANCE');
                  ws.cell( 4,excel_array['closing_advance']).string('CLOSING BALANCE');

                  ws.cell( 4,excel_array['ctc']).string('CTC');
                  ws.cell( 4,excel_array['gross_earning']).string('GROSS');
                  ws.cell( 4,excel_array['net_take_home']).string('NET PAY');
                  ws.cell( 4,excel_array['payment_mode']).string('PAYMENT MODE');

                  ws.cell( 4,excel_array['bank']).string('BANK');
                  ws.cell( 4,excel_array['account_no']).string('ACCOUNT NO');
                  ws.cell( 4,excel_array['ifsc_code']).string('IFSC CODE');

                  var row_counter=4;
                  var sl_no=0;
                  var report = reportdata;
                  await Promise.all(report.map(async (report_data_exp) => {
                    row_counter=row_counter+1;
                    sl_no=sl_no+1;
                    var emp_data = report_data_exp.emp_data;
                    var master_report = report_data_exp.master_report;
                    var salary_report = report_data_exp.salary_report;
                    var ot_report = report_data_exp.ot_report;
                    var bonus_report = report_data_exp.bonus_report;
                    var incentive_report = report_data_exp.incentive_report;
                    var advance_report = report_data_exp.advance_report;
                    var reimbursment_report = report_data_exp.reimbursment_report;
                    var bank_details = report_data_exp.bank_details;
                    //var datatata=get_exls_data(master_report,{emp_data:{emp_first_name}});
                    //console.log(master_report['emp_data']['emp_first_name']);
                    ws.cell( row_counter,excel_array['sl_no']).number(sl_no);
                    ws.cell( row_counter,excel_array['emp_first_name']).string(emp_data.emp_first_name);
                    ws.cell( row_counter,excel_array['emp_last_name']).string(emp_data.emp_last_name);
                    ws.cell( row_counter,excel_array['emp_id']).string(emp_data.emp_id);
                    ws.cell( row_counter,excel_array['uan_no']).string(emp_data.emp_uan_no);
                    ws.cell( row_counter,excel_array['pf_no']).string(emp_data.new_pf_no);
                    ws.cell( row_counter,excel_array['esic_no']).string(emp_data.esic_no);
                    ws.cell( row_counter,excel_array['doj']).string(emp_data.date_of_join);
                    ws.cell( row_counter,excel_array['sex']).string(emp_data.sex);
                    ws.cell( row_counter,excel_array['age']).string(Math.round((emp_data.age||0),1)?.toString());
                    ws.cell( row_counter,excel_array['branch']).string(emp_data.branch ? emp_data.branch.branch_name : 'N/A');
                    ws.cell( row_counter,excel_array['department']).string(emp_data.department ? emp_data.department.department_name :'N/A');
                    ws.cell( row_counter,excel_array['hod']).string(emp_data.hod);
                    ws.cell( row_counter,excel_array['designation']).string(emp_data.designation ? emp_data.designation.designation_name :'N/A');
                    ws.cell( row_counter,excel_array['client']).string(emp_data.client ? emp_data.client.client_name :'N/A');
                    ws.cell( row_counter,excel_array['restricted_pf']).string(emp_data.Restrict_PF);
                    ws.cell( row_counter,excel_array['reg_type']).string(emp_data.Reg_Type);
                    ws.cell( row_counter,excel_array['epf']).string(emp_data.EPF ? emp_data.EPF : '');
                    ws.cell( row_counter,excel_array['eps']).string(emp_data.EPS ? emp_data.EPS : '');
                    ws.cell( row_counter,excel_array['esic']).string(emp_data.ESIC ? emp_data.ESIC : '');
                    var report_heads_rate=master_report.heads;
                    Promise.all(report_heads_rate.map(async (report_heads_rate_exp) => {
                      ws.cell( row_counter,excel_array[report_heads_rate_exp.head_abbreviation+'_rate']).number(report_heads_rate_exp.amount);
                    }));
                    ws.cell( row_counter,excel_array['total_pf_bucket_rate']).string(master_report?.total_pf_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_pf_wages_rate']).string(master_report?.restrict_pf_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['edlis_wages_rate']).string(master_report?.restrict_pf_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['eps_wages_rate']).string(master_report?.restrict_pf_wages.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_esic_bucket_rate']).string(master_report?.total_esi_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_esic_wages_rate']).string(master_report?.restrict_esic_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_pt_wages_rate']).string(master_report?.total_pt_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_tds_wages_rate']).string(master_report?.total_tds_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_ot_wages_rate']).string(master_report?.total_ot_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_bonus_wages_rate']).string(master_report?.total_bonus_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_gratuity_wages_rate']).string(master_report?.total_gratuity_wages?.toFixed(2)?.toString() || 'N/A');

                    // ws.cell( 4,excel_array['emoloyer_pf_contribution_rate']).string('ER EPF');
                    // ws.cell( 4,excel_array['emoloyer_contribution_rate']).string('ER EPS');
                    // ws.cell( 4,excel_array['total_employer_contribution_rate']).string('TOTAL ER PF');
                    // ws.cell( 4,excel_array['emoloyee_pf_contribution_rate']).string('EDLI');
                    // ws.cell( 4,excel_array['emoloyee_esic_contribution_rate']).string('ADMIN');
                    // ws.cell( 4,excel_array['esic_data_rate']).string('ER ESIC');
                    // ws.cell( 4,excel_array['total_employee_contribution_rate']).string('TOTAL ER CONTRIBUTION');

                    // ws.cell( row_counter,excel_array['emoloyer_pf_contribution_rate']).string(master_report.epf_data.emoloyer_pf_contribution.toString());
                    const total_employer_contribution_rate = (
                        master_report.epf_data.emoloyer_pf_contribution +
                        master_report.epf_data.emoloyer_eps_contribution +
                        master_report.epf_data.emoloyer_epf_admin_contribution +
                        master_report.epf_data.emoloyer_edlis_contribution +
                        master_report.esic_data.emoloyer_contribution
                    ) 
                    ws.cell( row_counter,excel_array['emoloyer_pf_contribution_rate']).string(master_report?.epf_data?.emoloyer_pf_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyer_eps_contribution_rate']).string(master_report?.epf_data?.emoloyer_eps_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyer_epf_admin_contribution_rate']).string(master_report?.epf_data?.emoloyer_epf_admin_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyer_edlis_contribution_rate']).string(master_report?.epf_data?.emoloyer_edlis_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyer_esic_contribution_rate']).string(master_report?.esic_data?.emoloyer_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_employer_contribution_rate']).string(total_employer_contribution_rate?.toFixed(2)?.toString() || 'N/A');

                    const total_employee_contribution_rate = (
                      master_report.epf_data.emoloyee_contribution +
                      master_report.esic_data.emoloyee_contribution +
                      master_report.voluntary_pf_amount+
                      master_report.p_tax_amount
                    )
                    ws.cell( row_counter,excel_array['emoloyee_pf_contribution_rate']).string(master_report?.epf_data?.emoloyee_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyee_esic_contribution_rate']).string(master_report?.esic_data?.emoloyee_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['p_tax_amount_rate']).string(master_report?.p_tax_amount?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['voluntary_pf_amount_rate']).string(master_report?.voluntary_pf_amount?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_employee_contribution_rate']).string(total_employee_contribution_rate?.toFixed(2)?.toString() || 'N/A');
                    // ws.cell( row_counter,excel_array['gross_deduct_rate']).string(master_report.gross_deduct_rate.toString());
                    //ws.cell( row_counter,excel_array['epf_data_rate.emoloyee_contribution_rate']).string(master_report.emp_data.Reg_Type);
                    
                    ws.cell( row_counter,excel_array['ctc_rate']).string(master_report?.ctc?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['gross_earning_rate']).string(master_report?.gross_earning?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['net_take_home_rate']).string(master_report?.net_take_home?.toFixed(2)?.toString() || 'N/A');

                    ws.cell( row_counter,excel_array['month_days']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.total_attendance ? parseFloat(emp_data?.attendance_summaries?.total_attendance)?.toString() : 0);
                    ws.cell( row_counter,excel_array['week_offs']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.total_wo?emp_data?.attendance_summaries?.total_wo?.toString():'0');
                    ws.cell( row_counter,excel_array['holidays']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.holiday?emp_data?.attendance_summaries.holiday?.toString():'0');
                    ws.cell( row_counter,excel_array['paydays']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.paydays?emp_data?.attendance_summaries.paydays?.toString():'0');
                    ws.cell( row_counter,excel_array['total_attendance']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.total_attendance?emp_data.attendance_summaries.total_attendance?.toString():'0');
                    ws.cell( row_counter,excel_array['assumed_present']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.assumed_pre_day?emp_data?.attendance_summaries?.assumed_pre_day?.toString():'0');
                    ws.cell( row_counter,excel_array['total_late_lop']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.total_late?emp_data?.attendance_summaries?.total_late?.toString():'0');
                    ws.cell( row_counter,excel_array['total_lop']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.total_lop?emp_data.attendance_summaries?.total_lop?.toString():'0');
                    ws.cell( row_counter,excel_array['roll_over_attendance']).string(emp_data.attendance_summaries && emp_data.attendance_summaries.adjust_day?emp_data?.attendance_summaries?.adjust_day?.toString():'0');

                    var leave_heads = report_data_exp.attendance_heads ?? [];
                    Promise.all(leave_heads.map(async (report_heads_exp) => {
                      ws.cell( row_counter,excel_array[report_heads_exp.abbreviation]).number(Number(+report_heads_exp?.available || 0) || 0);
                    }));
                    var report_heads=salary_report.heads ?? [];
                    Promise.all(report_heads.map(async (report_heads_exp) => {
                      ws.cell( row_counter,excel_array[report_heads_exp.head_abbreviation]).number(Number(report_heads_exp?.amount || 0) || 0);
                    }));

                    ws.cell( row_counter,excel_array['total_pf_bucket']).string(salary_report?.total_pf_bucket?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_pf_wages']).string(salary_report?.total_pf_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['edlis_wages']).string(salary_report?.edlis_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['eps_wages']).string(salary_report?.eps_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_esic_bucket']).string(salary_report?.total_esic_bucket?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_esic_wages']).string(salary_report?.total_esic_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_pt_wages']).string(salary_report?.total_pt_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_tds_wages']).string(salary_report?.total_tds_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_ot_wages']).string(salary_report?.total_ot_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_bonus_wages']).string(salary_report?.total_bonus_wages?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_gratuity_wages']).string(salary_report?.total_gratuity_wages?.toFixed(2)?.toString() || 'N/A');

                    ws.cell( row_counter,excel_array['incentive_val']).string(incentive_report.gross_earning ? incentive_report?.gross_earning?.toFixed(2)?.toString():'N/A');
                    ws.cell( row_counter,excel_array['bonus_amount']).string(bonus_report.gross_earning ? bonus_report?.gross_earning?.toFixed(2)?.toString():'N/A');
                    ws.cell( row_counter,excel_array['bonus_ex_gratia']).string(bonus_report.exgratia_amount ? bonus_report?.exgratia_amount?.toFixed(2)?.toString():'N/A');
                    ws.cell( row_counter,excel_array['total_ot_amount']).string(ot_report.gross_earning ? ot_report?.gross_earning?.toFixed(2)?.toString():'N/A');
                    ws.cell( row_counter,excel_array['reimbursement_gross_earning']).string(reimbursment_report.gross_earning ? reimbursment_report?.gross_earning?.toFixed(2)?.toString():'N/A');

                    // ws.cell( 4,excel_array['emoloyer_pf_contribution']).string('ER EPF');
                    // ws.cell( 4,excel_array['emoloyer_contribution']).string('ER EPS');
                    // ws.cell( 4,excel_array['total_employer_contribution']).string('TOTAL ER PF');
                    // ws.cell( 4,excel_array['emoloyee_pf_contribution']).string('EDLI');
                    // ws.cell( 4,excel_array['emoloyee_contribution']).string('ADMIN');
                    // ws.cell( 4,excel_array['esic_data']).string('ER ESIC');
                    // ws.cell( 4,excel_array['total_er_contribution']).string('TOTAL ER CONTRIBUTION');

                    // ws.cell( row_counter,excel_array['emoloyer_pf_contribution']).string(salary_report.pf_data.emoloyer_pf_contribution.toString());
                    const total_employer_contribution = (
                      salary_report.pf_data.emoloyer_pf_contribution +
                      salary_report.pf_data.emoloyer_eps_contribution +
                      salary_report.pf_data.emoloyer_epf_admin_contribution +
                      salary_report.pf_data.emoloyer_edlis_contribution +
                      salary_report.esic_data.emoloyer_contribution
                    )
                    ws.cell( row_counter,excel_array['emoloyer_pf_contribution']).string(salary_report?.pf_data?.emoloyer_pf_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyer_eps_contribution']).string(salary_report?.pf_data?.emoloyer_eps_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyer_epf_admin_contribution']).string(salary_report?.pf_data?.emoloyer_epf_admin_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyer_edlis_contribution']).string(salary_report?.pf_data?.emoloyer_edlis_contribution ? salary_report?.pf_data?.emoloyer_edlis_contribution?.toFixed(2)?.toString():'');
                    ws.cell( row_counter,excel_array['emoloyer_esic_contribution']).string(salary_report?.esic_data?.emoloyer_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_employer_contribution']).string(total_employer_contribution?.toFixed(2)?.toString() || 'N/A');

                    const total_ee_contribution = (
                      salary_report.pf_data.emoloyee_contribution +
                      salary_report.esic_data.emoloyee_contribution +
                      salary_report.voluntary_pf_amount +
                      salary_report.pt_amount
                    )
                    ws.cell( row_counter,excel_array['emoloyee_pf_contribution']).string(salary_report?.pf_data?.emoloyee_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['emoloyee_esic_contribution']).string(salary_report?.esic_data?.emoloyee_contribution?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['pt_amount']).string(salary_report?.pt_amount?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['voluntary_pf_amount']).string(salary_report?.voluntary_pf_amount?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['total_ee_contribution']).string(total_ee_contribution?.toFixed(2)?.toString() || 'N/A');

                    ws.cell( row_counter,excel_array['advance_start']).string(advance_report.opening_balance?advance_report?.opening_balance?.toFixed(2)?.toString():'');
                    ws.cell( row_counter,excel_array['recovered_advance_data']).string(advance_report.advance_recovered?advance_report?.advance_recovered?.toFixed(2)?.toString():'');
                    ws.cell( row_counter,excel_array['further_advance']).string(advance_report.new_advance?advance_report?.new_advance?.toFixed(2)?.toString():'');
                    ws.cell( row_counter,excel_array['closing_advance']).string(advance_report.closing_balance?advance_report.closing_balance?.toFixed(2)?.toString():'');

                    ws.cell( row_counter,excel_array['ctc']).string(salary_report?.ctc?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['gross_earning']).string(salary_report?.gross_earning?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['net_take_home']).string(salary_report?.net_take_home?.toFixed(2)?.toString() || 'N/A');
                    ws.cell( row_counter,excel_array['payment_mode']).string('Bank');

                    ws.cell( row_counter,excel_array['bank']).string(bank_details.bank_name?bank_details?.bank_name:'NA');
                    ws.cell( row_counter,excel_array['account_no']).string(bank_details.account_no?bank_details.account_no?.toString():'NA');
                    ws.cell( row_counter,excel_array['ifsc_code']).string(bank_details.ifsc_code?bank_details.ifsc_code:'NA');
                    
                  }));
                  // var mastersheet_name=+'-';
                  if(client_req){
                    // var file_location = Site_helper.createFiles(wb,"master-sheet",'xlsx', req.authData.corporate_id, wage_month, wage_year)
                    let file_name = "master-sheet.xlsx";
                    let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/salary-module');
                    await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                    // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                  }
                }
                if(client_req){
                  // return resp.status(200).json({ status: "success", message: 'Xlsx created successfully',url:baseurl+file_location });
                }else{
                  return wb
                }

        }
      }
      catch (e) {
        if(client_req){
          return resp.status(403).json({ status: "error", message: e ? e.message : 'Something went wrong' });
        }else{
          throw e
        }
      }
      
      

      

        
        
      //return resp.status(200).json({ status: "success", message: 'Xlsx created successfully',url:'master-sheet.xlsx' });
    },
    generate_payment_slip:async function(req,resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
          bank_temp_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    /*generate_instruction_report:async function(req,resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
          bank_temp_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var filter_option={"_id":req.body.bank_temp_id};
          var payment_sheet = await PaymentSheet.findOne(filter_option);
          
          var variable_earning=[];
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
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
              if(req.body.emp_name)
              {
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
              }
              if(req.body.emp_last_name)
              {
                search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
              }
              if(req.body.email_id)
              {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
              }
              if(req.body.emp_id)
              {
                search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
              }
              if(req.body.designation_id)
              {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
              }
              if(req.body.department_id)
              {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
              }
              if(req.body.branch_id)
              {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
              }
              if(req.body.client_code)
              {
                var client_codes=JSON.parse(req.body.client_code);
                search_option.$match.client_code={$in: client_codes};
              }
              if(req.body.hod_id)
              {
                var hod_ids=JSON.parse(req.body.hod_id);
                hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match.emp_hod={$in: hod_ids};
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
            search_option_details.$match['master_report.wage_month']= wage_month.toString();
            search_option_details.$match['master_report.wage_year']=  wage_year.toString();
            search_option_details.$match['master_report.referance_id']='' ;
            //search_option_details.$match['employee_details.employment_details.uan_no']=  null;
            var myAggregate = Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              {$lookup:{
                from: 'master_reports',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'master_report'
              }},
              
              search_option_details,
              {$lookup:{
                from: 'branches',
                localField: 'employee_details.employment_hr_details.branch',
                foreignField: '_id',
                as: 'branch'
              }},
              {$lookup:{
                from: 'designations',
                localField: 'employee_details.employment_hr_details.designation',
                foreignField: '_id',
                as: 'designation'
              }},
              {$lookup:{
                from: 'departments',
                localField: 'employee_details.employment_hr_details.department',
                foreignField: '_id',
                as: 'department'
              }},
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                }
                }
              },
              
              { "$project": { 
                "_id":1,
                "alternate_mob_no":1,
                "email_id":1,
                //"master_report":1,
                master_report: {
                  $filter: {
                    input: "$master_report",
                    as: "master_report",
                    cond: {
                      $and: [
                        {$eq: ["$$master_report.wage_month", wage_month.toString()]},
                        {$eq: ["$$master_report.wage_year", wage_year.toString()]},
                        {$eq: ["$$master_report.referance_id", '']}
                      ]
                    }
                  }
                },
                }
              },
              { "$addFields": {
                "master_report": {
                    "$arrayElemAt": [ "$master_report", 0 ]
                }
                }
              },
              ]).then(async (reportdata) => {
                //return resp.status(200).json({ status: "success", message: reportdata});
                if(reportdata.length>0)
                {
                  var wb = new xl.Workbook();
                  var ws = wb.addWorksheet('Sheet 1');
                  var file_id=Math.random().toString(36).slice(2);
                  var instructionsheet_xlsx='storage/company/temp_files/'+req.authData.corporate_id+'/instruction_report/instruction-report-'+file_id+'.xlsx';
                  ws.cell( 1,1).string('SL. NO.');
                  var master_data=reportdata;
                  var row_counter=1;
                  var sl_no=0;
                  var bank_field =payment_sheet.column_list;
                  await Promise.all(master_data.map(async (report_data_exp) => {
                    if(report_data_exp.master_report)
                    {
                      row_counter=row_counter+1;
                      sl_no=sl_no+1;
                      var master_report=report_data_exp.master_report;
                      var column_counter=1;
                      ws.cell( row_counter,column_counter).number(sl_no);
                      
                      await Promise.all(bank_field.map(async (bank_column_data) => {
                        column_counter=column_counter+1;
                        if(bank_column_data.type == 'static')
                        {
                          if(bank_column_data.column_lable == 'Amount')
                          {
                            var bank_column_value=master_report.gross_earning;
                          }
                          else
                          {
                            var bank_column_value=bank_column_data.column_value;
                          }
                        }
                        else
                        {
                          var bank_column_value=master_report.emp_data[bank_column_data.column_value];
                        }
                        var bank_column_lable=bank_column_data.column_lable;
                        //column_value=type
                        ws.cell( 1,column_counter).string(bank_column_lable.toString());
                        if(bank_column_data.column_value == 'emp_name')
                        {
                          bank_column_value=master_report.emp_data.emp_first_name+' '+master_report.emp_data.emp_last_name;
                        }
                        if(bank_column_data.column_value == 'emp_mob')
                        {
                          bank_column_value=report_data_exp.alternate_mob_no;
                        }
                        if(bank_column_data.column_value == 'email_id')
                        {
                          bank_column_value=report_data_exp.email_id;
                        }
                        ws.cell( row_counter,column_counter).string(bank_column_value?bank_column_value.toString():'');
                      }))

                      await MasterReport.updateOne({emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year,referance_id:''},{referance_id:file_id});
                    }
                  })).then(async (reportdata_com) => {
                    if(sl_no < 1)
                    {
                      return resp.status(200).json({ status: "success", message: 'Nothing to generate'});
                    }
                    else
                    {
                      wb.write(instructionsheet_xlsx);
                      var document = {
                          corporate_id:req.authData.corporate_id,
                          file_id:file_id,
                          xlsx_file_name:instructionsheet_xlsx,
                          wage_month:wage_month, 
                          wage_year:wage_year, 
                          challan_type:'ECR',
                          status:'active',
                          created_at: Date.now()
                      };                  
                      BankInstruction.create(document,  function (err, bank_instruction_data) {
                          if (err) return resp.status(200).send({ status: 'error', message: err.message });
                          return resp.status(200).send({ status: 'success',message:"Instruction file generated successfully", bank_instruction_data: bank_instruction_data });
                      })
                        //return resp.status(200).send({ status: 'success',message:"Instruction file generated successfully",url:baseurl+instructionsheet_xlsx});
                    }
                  });  

                }
                else
                {
                  return resp.status(200).json({ status: "success", message: 'Nothing to generate.'});
                }
                
              });
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    */
    
    generate_pf_report:async function(req,resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var filter_option={"corporate_id":req.authData.corporate_id};
          var leave_head = await LeaveTempHead.find(filter_option);
          var heads = await SalaryTempHead.find(filter_option);
          
          var variable_earning=[];
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
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
              if(req.body.emp_name)
              {
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
              }
              if(req.body.emp_last_name)
              {
                search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
              }
              if(req.body.email_id)
              {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
              }
              if(req.body.emp_id)
              {
                search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
              }
              if(req.body.designation_id)
              {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
              }
              if(req.body.department_id)
              {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
              }
              if(req.body.branch_id)
              {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
                //search_option_details.$match['company_details.company_branch._id']= {$in: branch_ids};
              }
              if(req.body.client_code)
              {
                var client_codes=JSON.parse(req.body.client_code);
                search_option.$match.client_code={$in: client_codes};
              }
              if(req.body.hod_id)
              {
                var hod_ids=JSON.parse(req.body.hod_id);
                hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match.emp_hod={$in: hod_ids};
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
            search_option_details.$match['master_report.wage_month']= wage_month.toString();
            search_option_details.$match['master_report.wage_year']=  wage_year.toString();
            search_option_details.$match['master_report.pf_challan_referance_id']=  '';
            //var branch_id= mongoose.Types.ObjectId(req.body.branch_id);
            var myAggregate = Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              {$lookup:{
                from: 'master_reports',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'master_report'
              }},
              {$lookup:{
                from: 'company_details',
                localField: 'corporate_id',
                foreignField: 'details.corporate_id',
                as: 'company_details',
              }},
              search_option_details,
              {$lookup:{
                from: 'branches',
                localField: 'employee_details.employment_hr_details.branch',
                foreignField: '_id',
                as: 'branch'
              }},
              {$lookup:{
                from: 'designations',
                localField: 'employee_details.employment_hr_details.designation',
                foreignField: '_id',
                as: 'designation'
              }},
              {$lookup:{
                from: 'departments',
                localField: 'employee_details.employment_hr_details.department',
                foreignField: '_id',
                as: 'department'
              }},
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                }
                }
              },
              { "$project": { 
                "_id":1,
                "alternate_mob_no":1,
                "email_id":1,
                "employee_details.employment_hr_details.branch":1,
                "company_details.company_branch":1,
                //"master_report":1,
                master_report: {
                  $filter: {
                    input: "$master_report",
                    as: "master_report",
                    cond: {
                      $and: [
                        {$eq: ["$$master_report.wage_month", wage_month.toString()]},
                        {$eq: ["$$master_report.wage_year", wage_year.toString()]},
                        {$eq: ["$$master_report.pf_challan_referance_id", '']}
                      ]
                    }
                  }
                },
                }
              },
              { "$addFields": {
                "master_report": {
                    "$arrayElemAt": [ "$master_report", 0 ]
                }
                }
              },
              { "$addFields": {
                "company_details": {
                    "$arrayElemAt": [ "$company_details", 0 ]
                }
                }
              },
              ]).then(async (reportdata) => {
                var emp_branch_details={};
                var branch_count=0;
                //return resp.status(200).json({ status: "error", message: reportdata });
                await Promise.all(reportdata.map(async function(empobj) { 
                  var company_branch=empobj.company_details.company_branch;
                  var emp_branch=empobj.employee_details.employment_hr_details.branch;
                 
                  await company_branch.map(function(comobj) { 
                    
                    if(comobj._id == emp_branch)
                    {
                      //console.log(emp_branch,comobj._id,emp_branch_details)
                      branch_count= branch_count + 1;
                      emp_branch_details[comobj.esic_registration_no] = emp_branch;
                    }
                  })
                })).then(async (com_data)=>{
                  if(Object.keys(emp_branch_details).length > 0)
                  {
                    return resp.status(200).json({ status: "error", message: "Multiple branch code found in selected employee" });
                  }
                  else
                  {
                    //console.log('reportdata',reportdata)
                    if(reportdata.length>0)
                    {
                      var counter_val=1;
                      var excel_array={
                        'sl_no':counter_val++,
                        'UAN':counter_val++,
                        'Name':counter_val++,
                        'Gross':counter_val++,
                        'EPF':counter_val++,
                        'EPS':counter_val++,
                        'EDLI':counter_val++,
                        'EE':counter_val++,
                        'EPS':counter_val++,
                        'ER':counter_val++,
                        'NCP':counter_val++,
                      };
                      var wb = new xl.Workbook();
                      
                      var ws = wb.addWorksheet('Sheet 1');
                      var file_id=Math.random().toString(36).slice(2);
                      // var instructionsheet_xlsx='storage/company/referance_file/referance-file-'+file_id+'.xlsx';
                      // var instructionsheet_text='storage/company/referance_file/referance-file-'+file_id+".txt";
    
                      
                      var text_file_content='';
    
                      ws.cell( 1,1).string('SL. NO.');
                      ws.cell( 1,2).string('UAN');
                      ws.cell( 1,3).string('Name');
                      ws.cell( 1,4).string('Gross');
                      ws.cell( 1,5).string('EPF');
                      ws.cell( 1,6).string('EPS');
                      ws.cell( 1,7).string('EDLI');
                      ws.cell( 1,8).string('EE');
                      ws.cell( 1,9).string('EPS');
                      ws.cell( 1,10).string('ER');
                      ws.cell( 1,11).string('NCP');
                      var master_data=reportdata;
                      var row_counter=1;
                      var sl_no=0;
                      var total_epf_emp=0;
                      var total_eps_emp=0;
                      var total_edli_emp=0;
                      var total_epf=0;
                      var total_eps=0;
                      var total_edli=0;
                      var total_challan_amount=0;
    
                      await Promise.all(master_data.map(async (report_data_exp) => {
                        if(report_data_exp.master_report)
                        {
    
                          row_counter=row_counter+1;
                          sl_no=sl_no+1;
    
                          
                          var master_report=report_data_exp.master_report;
    
                          var gross_earning=master_report.gross_earning;
                          var epf_wages=master_report.restricted_pf_wages?master_report.restricted_pf_wages:0;
                          var eps_wages=master_report.eps_wages?master_report.eps_wages:0;
                          var edlis_wages=master_report.edlis_wages?master_report.edlis_wages:0;
                          
                          var employer_contribution=master_report.epf_data.total_employer_contribution?master_report.epf_data.total_employer_contribution:0;
                          var eps_contribution=master_report.epf_data.emoloyer_eps_contribution;
                          var pf_contribution=master_report.epf_data.emoloyer_pf_contribution;
                          var total_lop=master_report.emp_data.attendance_summaries.total_lop;
    
                          if(master_report.emp_data.EPF == 'yes')
                          {
                            total_epf_emp=total_epf_emp+1;
                            total_epf=total_epf+epf_wages;
                          }
                          if(master_report.emp_data.EPS == 'yes')
                          {
                            total_eps_emp=total_eps_emp+1;
                            total_eps=total_eps+eps_wages;
                          }
                          if(edlis_wages > 0)
                          {
                            total_edli_emp=total_edli_emp+1;
                            total_edli=total_edli+edlis_wages;
                          }
                          total_challan_amount=(total_epf + total_eps + total_edli);
                          
                          
                          
                          //var datatata=get_exls_data(master_report,{emp_data:{emp_first_name}});
                          //console.log(master_report['emp_data']['emp_first_name']);
                          ws.cell( row_counter,1).number(sl_no);
                          ws.cell( row_counter,2).string(master_report.emp_data.emp_uan_no.toString());
                          ws.cell( row_counter,3).string(master_report.emp_data.emp_first_name+' '+master_report.emp_data.emp_last_name);
                          ws.cell( row_counter,4).string(gross_earning.toString());
                          ws.cell( row_counter,5).string(epf_wages.toString());
                          ws.cell( row_counter,6).string(eps_wages.toString());
                          ws.cell( row_counter,7).string(edlis_wages.toString());
                          ws.cell( row_counter,8).string(employer_contribution.toString());
                          ws.cell( row_counter,9).string(eps_contribution.toString());
                          ws.cell( row_counter,10).string(pf_contribution.toString());
                          ws.cell( row_counter,11).string(total_lop.toString());
                          ws.cell( row_counter,12).string('0');
                          //console.log({emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year},{referance_id:file_id});
                          text_file_content+=master_report.emp_data.emp_uan_no+"#~#";
                          text_file_content+=master_report.emp_data.emp_first_name+' '+master_report.emp_data.emp_last_name+"#~#";
                          text_file_content+=(gross_earning.toString())+"#~#";
                          text_file_content+=(epf_wages.toString())+"#~#";
                          text_file_content+=(eps_wages.toString())+"#~#";
                          text_file_content+=(edlis_wages.toString())+"#~#";
                          text_file_content+=(employer_contribution.toString())+"#~#";
                          text_file_content+=eps_contribution+"#~#";
                          text_file_content+=pf_contribution+"#~#";
                          text_file_content+=(total_lop.toString())+"#~#";
                          text_file_content+="0 \n";
                          await MasterReport.updateOne({emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year,pf_challan_referance_id:''},{pf_challan_referance_id:file_id});
                          
                        }
                      })).then(async (reportdata_com) => {
                        if(sl_no < 1)
                        {
                          return resp.status(200).json({ status: "success", message: 'Nothing to generate'});
                        }
                        else
                        {
                          // wb.write(instructionsheet_xlsx);
                          let xlsxFile = Site_helper.createFiles(wb,'referance-file-'+file_id+'.xlsx', req.authData.corporate_id, `cold_storage/referance-file/${wage_year}/${wage_month}`)
                          let txtFile = Site_helper.createFiles(null,'referance-file-'+file_id+'.txt', req.authData.corporate_id, `cold_storage/referance-file/${wage_year}/${wage_month}`)
                          
                          var fs = require('fs');
                          var stream = fs.createWriteStream(txtFile.location);
                          stream.once('open', function(fd) {
                            stream.write(text_file_content);
                            stream.end();
                          });
                          var document = {
                              corporate_id:req.authData.corporate_id,
                              file_id:file_id,
                              xlsx_file_name:xlsxFile.location,
                              text_file_name:txtFile.location,
                              wage_month:wage_month, 
                              wage_year:wage_year, 
                              challan_type:'ECR',
                              status:'active',
                              total_epf_emp:total_epf_emp,
                              total_eps_emp:total_eps_emp,
                              total_edli_emp:total_edli_emp,
                              total_epf:total_epf,
                              total_eps:total_eps,
                              total_edli:total_edli,
                              total_challan_amount:total_challan_amount,
                              created_at: Date.now()
                          };                  
                          PF_challan.create(document,  function (err, challan_data) {
                              if (err) return resp.status(200).send({ status: 'error', message: err.message });
                              return resp.status(200).send({ status: 'success',message:"Reference file generated successfully", challan_data: challan_data });
                          })
                        }
                        
                      });                  
                    }
                    else
                    {
                      return resp.status(200).json({ status: "success", message: 'Nothing to generate'});
                    }
                  }
                })
                //return resp.status(200).json({ status: "error", message: reportdata });
                
                
              });
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    
    get_challan_data:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          pageno: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var sortoption = {created_at: -1};
          const options = {
            page: req.body.pageno,
            limit: req.body.perpage?req.body.perpage:perpage,
            sort:     sortoption,
          };
          var filter_option={"corporate_id":req.authData.corporate_id};
          PF_challan.paginate(filter_option,options,  function (err, challan) {
              if (err) return resp.json({ status: 'error', message: 'no data found' });
              return resp.status(200).json({ status: 'success', challan_data: challan });
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    challan_form_data:async function(req,resp){
      try {
        const v = new Validator(req.body, {
          file_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          PF_challan.findOne({'file_id':req.body.file_id,corporate_id:req.authData.corporate_id}, async function(err,file_data){
            if (err) return resp.status(200).send({ status: 'error', message: err.message });
             var company_data= await CompanyDetails.findOne({'company_id':req.authData.company_id},'details establishment reg_office_address');
             return resp.status(200).json({ status: "success", file_data:file_data,company_data:company_data });
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    confirm_challan_payment:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          trrn: 'required',
          ecr_id: 'required',
          referance_file_id: 'required',
          challan_details:'required',
          total_amount:'required',
          ecr_details:'required',
          payment_confirmation:'required',
          due_date:'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          PF_challan.findOne({'_id':req.body.referance_file_id}, async function(err,file_data){
            if (err) return resp.json({ status: 'error', message: 'no data found' });
            //console.log(JSON.parse(req.body.challan_details))
            //return resp.json({ status: 'error', message: 'Challan Data not matched',asdasdasd:req.body.challan_details });
            if(file_data.total_challan_amount != req.body.total_amount)
            {
              return resp.json({ status: 'error', message: 'Challan Data not matched' });
            }
            else
            {
              
              var document={
                trrn:req.body.trrn,
                ecr_id:req.body.ecr_id,
                challan_details:JSON.parse(req.body.challan_details),
                ecr_details:JSON.parse(req.body.ecr_details),
                payment_confirmation:JSON.parse(req.body.payment_confirmation),
                due_date:req.body.due_date,
                status:'confirm'
              };
              var obj = req.files;
              await Promise.all(obj.map(async (file) => {
                if(file.fieldname === 'challan_details_file')
                {
                  document['challan_details_file']=file.path;
                }
                if(file.fieldname === 'ecr_details_file')
                {
                  document['ecr_details_file']=file.path;
                }
                if(file.fieldname === 'payment_confirm_file')
                {
                  document['payment_confirm_file']=file.path;
                }
              }));
              PF_challan.updateOne({"_id":req.body.referance_file_id},document,  function (err, challan) {
                  if (err) return resp.json({ status: 'error', message:  err ? err.message :'no data found.' });
                  return resp.status(200).json({ status: 'success',message: 'Challan Data confirm Successfully', challan_data: challan });
              })
            }
          })
          
          
        }
      } 
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    /*delete_challan_ref_file:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          referance_file_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          PF_challan.findByIdAndRemove({'_id':req.body.referance_file_id}, async function (err, challan) {
              if (err) 
              {
                  return resp.status(200).send({ status: 'error', message: err.message });
              }
              else{
                var filePath = file_path+'/'+challan.xlsx_file_name;
                  if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                  } 
                var filePath2 = file_path+'/'+challan.text_file_name;
                if (fs.existsSync(filePath2)) {
                    fs.unlinkSync(filePath2);
                } 
                await MasterReport.updateMany({pf_challan_referance_id:challan.file_id},{pf_challan_referance_id:''});
                return resp.status(200).send({ status: 'success',message:"Referance file deleted successfully", challan: challan });
              }
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },*/

    generate_esic_report:async function(req,resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var filter_option={"corporate_id":req.authData.corporate_id};
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
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
              if(req.body.emp_name)
              {
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
              }
              if(req.body.emp_last_name)
              {
                search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
              }
              if(req.body.email_id)
              {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
              }
              if(req.body.emp_id)
              {
                search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
              }
              if(req.body.designation_id)
              {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
              }
              if(req.body.department_id)
              {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
              }
              if(req.body.branch_id)
              {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
              }
              if(req.body.client_code)
              {
                var client_codes=JSON.parse(req.body.client_code);
                search_option.$match.client_code={$in: client_codes};
              }
              if(req.body.hod_id)
              {
                var hod_ids=JSON.parse(req.body.hod_id);
                hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match.emp_hod={$in: hod_ids};
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
            search_option_details.$match['master_report.wage_month']= wage_month.toString();
            search_option_details.$match['master_report.wage_year']=  wage_year.toString();
            search_option_details.$match['master_report.esic_challan_referance_id']=  '';
            var myAggregate = Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              {$lookup:{
                from: 'company_details',
                localField: 'corporate_id',
                foreignField: 'details.corporate_id',
                as: 'company_details',
              }},
              {$lookup:{
                from: 'master_reports',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'master_report'
              }},
              
              search_option_details,
              {$lookup:{
                from: 'branches',
                localField: 'employee_details.employment_hr_details.branch',
                foreignField: '_id',
                as: 'branch'
              }},
              {$lookup:{
                from: 'designations',
                localField: 'employee_details.employment_hr_details.designation',
                foreignField: '_id',
                as: 'designation'
              }},
              {$lookup:{
                from: 'departments',
                localField: 'employee_details.employment_hr_details.department',
                foreignField: '_id',
                as: 'department'
              }},
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                }
                }
              },
              { "$addFields": {
                "company_details": {
                    "$arrayElemAt": [ "$company_details", 0 ]
                }
                }
              },
              { "$project": { 
                "_id":1,
                "alternate_mob_no":1,
                "email_id":1,
                "employee_details.employment_hr_details.branch":1,
                "company_details.company_branch":1,
                master_report: {
                  $filter: {
                    input: "$master_report",
                    as: "master_report",
                    cond: {
                      $and: [
                        {$eq: ["$$master_report.wage_month", wage_month.toString()]},
                        {$eq: ["$$master_report.wage_year", wage_year.toString()]},
                        {$eq: ["$$master_report.esic_challan_referance_id", '']}
                      ]
                    }
                  }
                },
                }
              },
              { "$addFields": {
                "master_report": {
                    "$arrayElemAt": [ "$master_report", 0 ]
                }
                }
              },
              ]).then(async (reportdata) => {
                //return resp.status(200).json({ status: "success", message: reportdata});
                //console.log(reportdata)
                if(reportdata.length>0)
                {
                  var counter_val=1;
                  var excel_array={
                    'sl_no':counter_val++,
                    'UAN':counter_val++,
                    'Name':counter_val++,
                    'Gross':counter_val++,
                    'EPF':counter_val++,
                    'EPS':counter_val++,
                    'EDLI':counter_val++,
                    'EE':counter_val++,
                    'EPS':counter_val++,
                    'ER':counter_val++,
                    'NCP':counter_val++,
                  };
                  var wb = new xl.Workbook();
                  
                  var ws = wb.addWorksheet('Sheet 1');
                  var file_id=Math.random().toString(36).slice(2);
                  
                  // var esicsheet_xlsx='storage/company/temp_files/'+req.authData.corporate_id+'/esic_referance_file/referance-file-'+file_id+'.xlsx';

                  var master_data=reportdata;
                  var row_counter=0;
                  var sl_no=0;
                  var total_challan_amount=0;
                  var emp_branch_details={};
                  var branch_count=0;
                  await Promise.all(master_data.map(async function(empobj) { 
                    var company_branch=empobj.company_details.company_branch;
                    var emp_branch=empobj.employee_details.employment_hr_details.branch;
                    await company_branch.map(function(comobj) { 
                      if(comobj._id==emp_branch)
                      {
                        branch_count= branch_count + 1;
                        emp_branch_details[emp_branch] =comobj.esic_registration_no;
                      }
                    })
                  }))
                  var esic_temp=await Site_helper.get_gov_esic_data(req);
                  await Promise.all(master_data.map(async (report_data_exp) => {

                    if(report_data_exp.master_report)
                    {
                      
                      row_counter=parseFloat(row_counter) + 1;
                      //console.log(row_counter)
                      sl_no=sl_no+1;

                      
                      var master_report=report_data_exp.master_report;
                      var paydays=master_report.emp_data.attendance_summaries.paydays;
                      var total_attendance=master_report.emp_data.attendance_summaries.total_attendance;

                      var total_esi_wages=master_report.total_esi_wages;
                      var reason_code='';
                      
                      if(total_esi_wages == 0)
                      {
                        if(total_attendance == 0)
                        {
                          reason_code='1';
                        }
                        // else if(gross_earning_rate > esic_temp.wage_ceiling)
                        // {
                        //   reason_code='4';
                        // }
                        else
                        {
                          reason_code='0';
                        }
                      }
                      total_challan_amount= (total_challan_amount + (parseFloat(master_report.esic_data.emoloyee_contribution) + parseFloat(master_report.esic_data.emoloyer_contribution)));
                      var emp_branch=report_data_exp.employee_details.employment_hr_details.branch;
                      //console.log(master_report.emp_data.emp_first_name+' '+master_report.emp_data.emp_last_name,row_counter,sl_no);
                      ws.cell( row_counter,1).string(master_report.emp_data.emp_first_name+' '+master_report.emp_data.emp_last_name);
                      ws.cell( row_counter,2).string(master_report.emp_data.emp_uan_no.toString());
                      ws.cell( row_counter,3).string(paydays.toString());
                      ws.cell( row_counter,4).string(total_esi_wages.toString());
                      ws.cell( row_counter,5).string(reason_code);
                      ws.cell( row_counter,6).string('');
                      if(Object.keys(emp_branch_details).length > 0)
                      {
                        ws.cell( row_counter,7).string(emp_branch_details[emp_branch]);
                      }
                      await MasterReport.updateOne({emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year,esic_challan_referance_id:''},{esic_challan_referance_id:file_id});
                      
                    }
                  })).then(async (reportdata_com) => {
                    if(sl_no < 1)
                    {
                      return resp.status(200).json({ status: "success", message: 'Nothing to generate'});
                    }
                    else
                    {
                      // wb.write(esicsheet_xlsx);

                      let file = Site_helper.createFiles(wb,'referance-file-'+file_id+'.xlsx', req.authData.corporate_id, `cold_storage/esic_referance_file/${wage_year}/${wage_month}`)


                      var fs = require('fs');
                      
                      var document = {
                          corporate_id:req.authData.corporate_id,
                          file_id:file_id,
                          xlsx_file_name:file.location,
                          wage_month:wage_month, 
                          wage_year:wage_year, 
                          challan_type:'ECR',
                          status:'active',
                          total_challan_amount:total_challan_amount,
                          created_at: Date.now()
                      };                  


                  
                      ESIC_challan.create(document,  function (err, challan_data) {
                          if (err) return resp.status(200).send({ status: 'error', message: err.message });
                          return resp.status(200).send({ status: 'success',message:"Reference file generated successfully", challan_data: challan_data});
                      })
                    }
                    
                  });                  
                }
                else
                {
                  return resp.status(200).json({ status: "success", message: 'Nothing to generate'});
                }
                
              });
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    get_esic_challan_data:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          pageno: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var sortoption = {created_at: -1};
          const options = {
            page: req.body.pageno,
            limit: req.body.perpage?req.body.perpage:perpage,
            sort:     sortoption,
          };
          var filter_option={"corporate_id":req.authData.corporate_id};
          ESIC_challan.paginate(filter_option,options,  function (err, challan) {
              if (err) return resp.json({ status: 'error', message: 'no data found' });
              return resp.status(200).json({ status: 'success', challan_data: challan });
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    esic_challan_form_data:async function(req,resp){
      try {
        const v = new Validator(req.body, {
          file_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          ESIC_challan.findOne({'file_id':req.body.file_id,corporate_id:req.authData.corporate_id}, async function(err,file_data){
            if (err) return resp.status(200).send({ status: 'error', message: err.message });
             var company_data= await CompanyDetails.findOne({'company_id':req.authData.company_id},'details establishment reg_office_address');
             return resp.status(200).json({ status: "success", file_data:file_data,company_data:company_data });
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    confirm_esic_challan_payment:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          empr_code: 'required',
          empr_name: 'required',
          challan_number:'required',
          total_amount:'required',
          challan_created:'required',
          challan_submited:'required',
          tran_number:'required',
          due_date:'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          ESIC_challan.findOne({'_id':req.body.referance_file_id}, async function(err,file_data){
            if (err) return resp.json({ status: 'error', message: 'no data found' });
            //console.log(JSON.parse(req.body.challan_details))
            //return resp.json({ status: 'error', message: 'Challan Data not matched',asdasdasd:req.body.challan_details });
            if(file_data.total_challan_amount != req.body.total_amount)
            {
              return resp.json({ status: 'error', message: 'Challan Data not matched' });
            }
            else
            {
              
              var document={
                empr_code:req.body.empr_code,
                empr_name:req.body.empr_name,
                challan_number:req.body.challan_number,
                challan_created:req.body.challan_created,
                challan_submited:req.body.challan_submited,
                tran_number:req.body.tran_number,
                due_date:req.body.due_date,
                status:'confirm'
              };
              var obj = req.files;
              await Promise.all(obj.map(async (file) => {
                if(file.fieldname === 'esic_challan_details_file')
                {
                  document['esic_challan_details_file']=file.path;
                }
              }));
              ESIC_challan.updateOne({"_id":req.body.referance_file_id},document,  function (err, challan) {
                  if (err) return resp.json({ status: 'error', message:  err ? err.message :'no data found.' });
                  return resp.status(200).json({ status: 'success',message: 'Challan Data confirm Successfully', challan_data: challan });
              })
            }
          })
          
          
        }
      } 
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    delete_esic_challan_ref_file:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          referance_file_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          ESIC_challan.findByIdAndRemove({'_id':req.body.referance_file_id}, async function (err, challan) {
              if (err) 
              {
                  return resp.status(200).send({ status: 'error', message: err.message });
              }
              else{
                var filePath = file_path+'/'+challan.xlsx_file_name;
                  if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                  }
                await MasterReport.updateMany({esic_challan_referance_id:challan.file_id},{esic_challan_referance_id:''});
                return resp.status(200).send({ status: 'success',message:"Referance file deleted successfully", challan: challan });
              }
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },

    create_earning_sheet_template:async function(req, resp)
    {
      const v = new Validator(req.body, {
        template_name: 'required',
        template_fields: 'required',
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        //console.log(req.body.template_fields);
          var document={
            corporate_id:req.authData.corporate_id,
            template_name:req.body.template_name,
            template_fields:JSON.parse(req.body.template_fields),
            status:'active',
            created_at: Date.now()
          }
          EarningSheetTemplate.create(document,  function (err, ESTemplate) {
            if (err) return resp.status(200).send({ status: 'error', message: err.message });
             return resp.status(200).send({ status: 'success',message:"Template created successfully", estemplate: ESTemplate });
          })
      }
    },
    get_earning_sheet_template_list: async function (req, resp, next) {
      const v = new Validator(req.body, {
        pageno: 'required',
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        var sortoption = {created_at: -1};
        const options = {
          page: req.body.pageno,
          limit: req.body.perpage?req.body.perpage:perpage,
          sort:     sortoption,
        };
        var filter_option={"corporate_id":req.authData.corporate_id};
        EarningSheetTemplate.paginate(filter_option,options,  function (err, earning_sheet_temp) {
            if (err) return resp.json({ status: 'error', message: err.message });
            return resp.status(200).json({ status: 'success', earning_sheet_temp: earning_sheet_temp });
        })
      }
    },
    save_lock_earning_sheet:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          attendance_month:'required',
          attendance_year:'required',
          emp_data: 'required',
          heads: 'required',
          heads_rate:'required',
          epf_data:'required',
          epf_data_rate:'required',
          p_tax_amount:'required',
          p_tax_amount_rate:'required',
          esic_data:'required',
          esic_data_rate:'required',
          total_esi_wages_bucket:'required',
          total_esi_wages_bucket_rate:'required',
          total_esi_wages:'required',
          total_esi_wages_rate:'required',
          total_pt_wages:'required',
          total_pt_wages_rate:'required',
          total_bonus_wages:'required',
          total_bonus_wages_rate:'required',
          total_gratuity_wages:'required',
          total_gratuity_wages_rate:'required',
          bonus_amount:'required',
          restricted_pf_wages:'required',
          restricted_pf_wages_rate:'required',
          total_pf_wages:'required',
          total_pf_wages_rate:'required',
          edlis_wages:'required',
          edlis_wages_rate:'required',
          eps_wages:'required',
          eps_wages_rate:'required',
          gratuity_amount:'required',
          total_tds_amount:'required',
          total_ot_amount:'required',
          incentive_val:'required',
          incentive_advance_val:'required',
          gross_earning:'required',
          gross_earning_rate:'required',
          gross_deduct:'required',
          gross_deduct_rate:'required',
          net_take_home:'required',
          net_take_home_rate:'required',
          voluntary_pf_amount:'required',
          voluntary_pf_amount_rate:'required',
          total_employeer_pf_contribution:'required',
          total_employeer_pf_contribution_rate:'required',
          total_employeer_esic_contribution:'required',
          total_employeer_esic_contribution_rate:'required',
          ctc_amount:'required',
          ctc_amount_rate:'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var earning_report_data={
            attendance_month:req.body.attendance_month,
            attendance_year:req.body.attendance_year,
            emp_db_id:req.body.emp_data._id,
            emp_id:req.body.emp_data.emp_id,
            emp_data:req.body.emp_data,
            attendance_summaries:req.body.emp_data.attendance_summaries,
            bank_data:req.body.emp_data.bank_data,
            heads:req.body.heads,
            heads_rate:req.body.heads_rate,
            epf_data:req.body.epf_data,
            epf_data_rate:req.body.epf_data_rate,
            esic_data:req.body.esic_data,
            esic_data_rate:req.body.esic_data_rate,
            p_tax_amount:req.body.p_tax_amount,
            p_tax_amount_rate:req.body.p_tax_amount_rate,
            restricted_pf_wages:req.body.restricted_pf_wages,
            total_pf_wages:req.body.total_pf_wages,
            edlis_wages:req.body.edlis_wages,
            eps_wages:req.body.eps_wages,
            total_esi_wages_bucket:req.body.total_esi_wages_bucket,
            total_esi_wages:req.body.total_esi_wages,
            total_pt_wages:req.body.total_pt_wages,
            total_tds_wages:req.body.total_tds_wages,
            total_ot_wages:req.body.total_ot_wages,
            total_bonus_wages:req.body.total_bonus_wages,
            total_gratuity_wages:req.body.total_gratuity_wages,
            bonus_amount:req.body.bonus_amount,
            restricted_pf_wages_rate:req.body.restricted_pf_wages_rate,
            total_pf_wages_rate:req.body.total_pf_wages_rate,
            edlis_wages_rate:req.body.edlis_wages_rate,
            eps_wages_rate:req.body.eps_wages_rate,
            total_esi_wages_bucket_rate:req.body.total_esi_wages_bucket_rate,
            total_esi_wages_rate:req.body.total_esi_wages_rate,
            total_pt_wages_rate:req.body.total_pt_wages_rate,
            total_tds_wages_rate:req.body.total_tds_wages_rate,
            total_ot_wages_rate:req.body.total_ot_wages_rate,
            total_bonus_wages_rate:req.body.total_bonus_wages_rate,
            total_gratuity_wages_rate:req.body.total_gratuity_wages_rate,
            gratuity_amount:req.body.gratuity_amount,
            total_tds_amount:req.body.total_tds_amount,
            extra_earning_data:req.body.extra_earning_data,
            extra_deduction_data:req.body.extra_deduction_data,
            advance_recovered:req.body.advance_recovered,
            employee_advances_data:req.body.employee_advances_data,
            total_ot_amount:req.body.total_ot_amount,
            incentive_val:req.body.incentive_val,
            incentive_advance_val:req.body.incentive_advance_val,
            gross_earning:req.body.gross_earning,
            gross_deduct:req.body.gross_deduct,
            net_take_home:req.body.net_take_home,
            voluntary_pf_amount:req.body.voluntary_pf_amount,
            total_employeer_pf_contribution:req.body.total_employeer_pf_contribution,
            total_employeer_esic_contribution:req.body.total_employeer_esic_contribution,
            ctc_amount:req.body.ctc_amount,
            gross_earning_rate:req.body.gross_earning_rate,
            gross_deduct_rate:req.body.gross_deduct_rate,
            net_take_home_rate:req.body.net_take_home_rate,
            voluntary_pf_amount_rate:req.body.voluntary_pf_amount_rate,
            total_employeer_pf_contribution_rate:req.body.total_employeer_pf_contribution_rate,
            total_employeer_esic_contribution_rate:req.body.total_employeer_esic_contribution_rate,
            ctc_amount_rate:req.body.ctc_amount_rate,

          }
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
    generate_arrear_report:async function(req,resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var filter_option={"corporate_id":req.authData.corporate_id};
          var leave_head = await LeaveTempHead.find(filter_option);
          var heads = await SalaryTempHead.find(filter_option);
          
          var variable_earning=[];
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:    sortoption,
            };
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
              if(req.body.emp_name)
              {
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
              }
              if(req.body.emp_last_name)
              {
                search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
              }
              if(req.body.email_id)
              {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
              }
              if(req.body.emp_id)
              {
                search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
              }
              if(req.body.designation_id)
              {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
              }
              if(req.body.department_id)
              {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
              }
              if(req.body.branch_id)
              {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
              }
              if(req.body.client_code)
              {
                var client_codes=JSON.parse(req.body.client_code);
                search_option.$match.client_code={$in: client_codes};
              }
              if(req.body.hod_id)
              {
                var hod_ids=JSON.parse(req.body.hod_id);
                hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match.emp_hod={$in: hod_ids};
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
            search_option_details.$match['master_report.wage_month']= wage_month.toString();
            search_option_details.$match['master_report.wage_year']=  wage_year.toString();
            search_option_details.$match['master_report.pf_challan_referance_id']=  '';
            var myAggregate = Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              {$lookup:{
                from: 'master_reports',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'master_report'
              }},
              
              search_option_details,
              {$lookup:{
                from: 'branches',
                localField: 'employee_details.employment_hr_details.branch',
                foreignField: '_id',
                as: 'branch'
              }},
              {$lookup:{
                from: 'designations',
                localField: 'employee_details.employment_hr_details.designation',
                foreignField: '_id',
                as: 'designation'
              }},
              {$lookup:{
                from: 'departments',
                localField: 'employee_details.employment_hr_details.department',
                foreignField: '_id',
                as: 'department'
              }},
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                }
                }
              },
              // { "$addFields": {
              //   "master_report": {
              //       "$arrayElemAt": [ "$master_report", 0 ]
              //   }
              //   }
              // },
              { "$project": { 
                "_id":1,
                "alternate_mob_no":1,
                "email_id":1,
                //"master_report":1,
                master_report: {
                  $filter: {
                    input: "$master_report",
                    as: "master_report",
                    cond: {
                      $and: [
                        {$eq: ["$$master_report.wage_month", wage_month.toString()]},
                        {$eq: ["$$master_report.wage_year", wage_year.toString()]},
                        {$eq: ["$$master_report.pf_challan_referance_id", '']}
                      ]
                    }
                  }
                },
                }
              },
              { "$addFields": {
                "master_report": {
                    "$arrayElemAt": [ "$master_report", 0 ]
                }
                }
              },
              ]).then(async (reportdata) => {
                //console.log(reportdata)
                if(reportdata.length>0)
                {
                  var counter_val=1;
                  var excel_array={
                    'sl_no':counter_val++,
                    'UAN':counter_val++,
                    'Name':counter_val++,
                    'Gross':counter_val++,
                    'EPF':counter_val++,
                    'EPS':counter_val++,
                    'EDLI':counter_val++,
                    'EE':counter_val++,
                    'EPS':counter_val++,
                    'ER':counter_val++,
                    'NCP':counter_val++,
                  };
                  var wb = new xl.Workbook();
                  
                  var ws = wb.addWorksheet('Sheet 1');
                  var file_id=Math.random().toString(36).slice(2);
                  var instructionsheet_xlsx='storage/company/referance_file/referance-file-'+file_id+'.xlsx';
                  var instructionsheet_text='storage/company/referance_file/referance-file-'+file_id+".txt";

                  
                  var text_file_content='';

                  ws.cell( 1,1).string('SL. NO.');
                  ws.cell( 1,2).string('UAN');
                  ws.cell( 1,3).string('Name');
                  ws.cell( 1,4).string('Gross');
                  ws.cell( 1,5).string('EPF');
                  ws.cell( 1,6).string('EPS');
                  ws.cell( 1,7).string('EDLI');
                  ws.cell( 1,8).string('EE');
                  ws.cell( 1,9).string('EPS');
                  ws.cell( 1,10).string('ER');
                  ws.cell( 1,11).string('NCP');
                  var master_data=reportdata;
                  var row_counter=1;
                  var sl_no=0;
                  var total_epf_emp=0;
                  var total_eps_emp=0;
                  var total_edli_emp=0;
                  var total_epf=0;
                  var total_eps=0;
                  var total_edli=0;
                  var total_challan_amount=0;

                  await Promise.all(master_data.map(async (report_data_exp) => {
                    if(report_data_exp.master_report)
                    {

                      row_counter=row_counter+1;
                      sl_no=sl_no+1;

                      
                      var master_report=report_data_exp.master_report;

                      var gross_earning=master_report.gross_earning;
                      var epf_wages=master_report.restricted_pf_wages?master_report.restricted_pf_wages:0;
                      var eps_wages=master_report.eps_wages?master_report.eps_wages:0;
                      var edlis_wages=master_report.edlis_wages?master_report.edlis_wages:0;
                      
                      var employer_contribution=master_report.epf_data.total_employer_contribution?master_report.epf_data.total_employer_contribution:0;
                      var eps_contribution=master_report.epf_data.emoloyer_eps_contribution;
                      var pf_contribution=master_report.epf_data.emoloyer_pf_contribution;
                      var total_lop=master_report.emp_data.attendance_summaries.total_lop;

                      if(master_report.emp_data.EPF == 'yes')
                      {
                        total_epf_emp=total_epf_emp+1;
                        total_epf=total_epf+epf_wages;
                      }
                      if(master_report.emp_data.EPS == 'yes')
                      {
                        total_eps_emp=total_eps_emp+1;
                        total_eps=total_eps+eps_wages;
                      }
                      if(edlis_wages > 0)
                      {
                        total_edli_emp=total_edli_emp+1;
                        total_edli=total_edli+edlis_wages;
                      }
                      total_challan_amount=(total_epf + total_eps + total_edli);
                      
                      
                      
                      //var datatata=get_exls_data(master_report,{emp_data:{emp_first_name}});
                      //console.log(master_report['emp_data']['emp_first_name']);
                      ws.cell( row_counter,1).number(sl_no);
                      ws.cell( row_counter,2).string(master_report.emp_data.emp_uan_no.toString());
                      ws.cell( row_counter,3).string(master_report.emp_data.emp_first_name+' '+master_report.emp_data.emp_last_name);
                      ws.cell( row_counter,4).string(gross_earning.toString());
                      ws.cell( row_counter,5).string(epf_wages.toString());
                      ws.cell( row_counter,6).string(eps_wages.toString());
                      ws.cell( row_counter,7).string(edlis_wages.toString());
                      ws.cell( row_counter,8).string(employer_contribution.toString());
                      ws.cell( row_counter,9).string(eps_contribution.toString());
                      ws.cell( row_counter,10).string(pf_contribution.toString());
                      ws.cell( row_counter,11).string(total_lop.toString());
                      ws.cell( row_counter,12).string('0');
                      //console.log({emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year},{referance_id:file_id});
                      text_file_content+=master_report.emp_data.emp_uan_no+"#~#";
                      text_file_content+=master_report.emp_data.emp_first_name+' '+master_report.emp_data.emp_last_name+"#~#";
                      text_file_content+=(gross_earning.toString())+"#~#";
                      text_file_content+=(epf_wages.toString())+"#~#";
                      text_file_content+=(eps_wages.toString())+"#~#";
                      text_file_content+=(edlis_wages.toString())+"#~#";
                      text_file_content+=(employer_contribution.toString())+"#~#";
                      text_file_content+=eps_contribution+"#~#";
                      text_file_content+=pf_contribution+"#~#";
                      text_file_content+=(total_lop.toString())+"#~#";
                      text_file_content+="0 \n";
                      await MasterReport.updateOne({emp_id:master_report.emp_data.emp_id,wage_month:wage_month,wage_year:wage_year,pf_challan_referance_id:''},{pf_challan_referance_id:file_id});
                      
                    }
                  })).then(async (reportdata_com) => {
                    if(sl_no < 1)
                    {
                      return resp.status(200).json({ status: "success", message: 'Nothing to generate'});
                    }
                    else
                    {
                      
                      // wb.write(instructionsheet_xlsx);

                      let xlsxFile = Site_helper.createFiles(wb,'referance-file-'+file_id+'.xlsx', req.authData.corporate_id, `cold_storage/referance-file/${wage_year}/${wage_month}`)
                      let txtFile = Site_helper.createFiles(null,'referance-file-'+file_id+'.txt', req.authData.corporate_id, `cold_storage/referance-file/${wage_year}/${wage_month}`)

                      var fs = require('fs');
                      var stream = fs.createWriteStream(txtFile.location);
                      stream.once('open', function(fd) {
                        stream.write(text_file_content);
                        stream.end();
                      });
                      var document = {
                          corporate_id:req.authData.corporate_id,
                          file_id:file_id,
                          xlsx_file_name:xlsxFile.location,
                          text_file_name:txtFile.location,
                          wage_month:wage_month, 
                          wage_year:wage_year, 
                          challan_type:'ECR',
                          status:'active',
                          total_epf_emp:total_epf_emp,
                          total_eps_emp:total_eps_emp,
                          total_edli_emp:total_edli_emp,
                          total_epf:total_epf,
                          total_eps:total_eps,
                          total_edli:total_edli,
                          total_challan_amount:total_challan_amount,
                          created_at: Date.now()
                      };                  
                      PF_challan.create(document,  function (err, challan_data) {
                          if (err) return resp.status(200).send({ status: 'error', message: err.message });
                          return resp.status(200).send({ status: 'success',message:"Reference file generated successfully", challan_data: challan_data });
                      })
                    }
                    
                  });                  
                }
                else
                {
                  return resp.status(200).json({ status: "success", message: 'Nothing to generate'});
                }
                
              });
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },
}
var getNumbers = function(data_val,filter_data) {
  return [data_val.company_branch,filter_data]
  data_val.map(function(e_data) { 
    if(e_data._id == filter_data)
    {
      return e_data
    }
  })
  // data.map(filter_data)
  //  return data 
  };
function calculate_pf(epfo_temp, baseamount, salary_template, hr_details) {
  
    var emoloyee_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount) * parseFloat(epfo_temp.pf_employee_contribution)) / 100);
    var total_employer_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount) * parseFloat(epfo_temp.total_employer_contribution)) / 100);
    var emoloyer_pf_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount) * parseFloat(epfo_temp.pf_employer_contribution)) / 100);
    var emoloyer_eps_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.pension_employer_contribution_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.pension_employer_contribution)) / 100);
    var emoloyer_edlis_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.edli_employer_contribution_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.edli_employer_contribution)) / 100);
    var emoloyer_epf_admin_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.admin_charges_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.admin_charges)) / 100);
    var emoloyer_edlis_admin_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.edli_admin_charges_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.edli_admin_charges)) / 100);
    var retdata = {
      emoloyee_contribution: emoloyee_contribution,
      total_employer_contribution: total_employer_contribution,
      emoloyer_pf_contribution: emoloyer_pf_contribution,
      emoloyer_eps_contribution: emoloyer_eps_contribution,
      emoloyer_edlis_contribution: emoloyer_edlis_contribution,
      emoloyer_epf_admin_contribution: emoloyer_epf_admin_contribution,
      emoloyer_edlis_admin_contribution: emoloyer_edlis_admin_contribution
    }
    var restricted_pf_wages  = (salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount);
    retdata.eps_wages = ((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.pension_employer_contribution_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)));
    retdata.edlis_wages = ((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.edli_employer_contribution_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)));
    var total_pf_wages= baseamount
    retdata.total_pf_wages=total_pf_wages;
    retdata.restricted_pf_wages=restricted_pf_wages;
  if(hr_details.pf_applicable === "no")
  {
    retdata.emoloyee_contribution=0;
    retdata.restricted_pf_wages=restricted_pf_wages;
    retdata.total_pf_wages=total_pf_wages;
    retdata.total_employer_contribution=0;
    retdata.emoloyer_pf_contribution=0;
    retdata.emoloyer_eps_contribution=0;
    retdata.emoloyer_edlis_contribution=0;
    retdata.emoloyer_epf_admin_contribution=0;
    retdata.emoloyer_edlis_admin_contribution=0;
  }
  if(hr_details.pension_applicable === "no")
  {
    retdata.emoloyer_pf_contribution= (retdata.emoloyer_pf_contribution + retdata.emoloyer_eps_contribution);
    retdata.emoloyer_eps_contribution=0;
  }

  
  return retdata;
}
function get_exls_data(sheet_data,key_val){
   var retval =sheet_data[key_val];
   //console.log(sheet_data,key_val,retval)
   return retval;
}
function calculate_esic(esic_temp, baseamount,gross_salary) {
  if (parseFloat(esic_temp.wage_ceiling) > gross_salary) {
    var emoloyee_contribution = ((baseamount * parseFloat(esic_temp.employee_contribution)) / 100);
    var emoloyer_contribution = ((baseamount * parseFloat(esic_temp.employer_contribution)) / 100);
    var retdata = {
      emoloyee_contribution: emoloyee_contribution,
      emoloyer_contribution: emoloyer_contribution
    }
  }
  else
  {
    var retdata = {
      emoloyee_contribution: 0,
      emoloyer_contribution: 0
    }
  }
  return retdata;
}
function calculate_bonus(bonus_temp_data,date_of_join,gross_salary,bonus_module,total_bonus_wages,com_data)
{
  var bonus_value=parseFloat(bonus_module.bonus_value);
  var exgratia_status=parseFloat(bonus_module.exgratia);
  var bonus_wages=total_bonus_wages;
  var gov_calculate_bonus=((bonus_temp_data.max_bonus_wage*bonus_temp_data.max_bonus)/100);
  var bonus_amount=0;
  var exgratia_amount= 0;
  var month_diff=getMonthDifference(new Date(date_of_join),new Date());
  var year_ending = com_data.financial_year_end;
       /* check if employee service period is eligible or not */
      if(month_diff >= bonus_temp_data.min_service)
      {
        var current_date=new Date();
        var curr_month=current_date.getUTCMonth();
        /* check DISBURSEMENT FREQUENCY */
        if(bonus_temp_data.disbursement_frequency == 'yearly'){
          var bonus_wage_month=new Date(bonus_module.bonus_wage_month)
          bonus_wage_month=bonus_wage_month.getUTCMonth();
          if(bonus_wage_month != curr_month)
          {
            var bonusdata={
              bonus_amount:0,
              exgratia_amount:0
            } 
            return bonusdata;
          }
        }
        else if(bonus_temp_data.disbursement_frequency == 'quaterly')
        {
          var frequency_month= frequency_month(new Date(year_ending),3);
          if(!frequency_month.includes(curr_month))
          {
            var bonusdata={
              bonus_amount:0,
              exgratia_amount:0
            } 
            return bonusdata;
          }
        }
        else if(bonus_temp_data.disbursement_frequency == 'half_yearly')
        {
          var frequency_month= frequency_month(new Date(year_ending),6)
          if(!frequency_month.includes(curr_month))
          {
            var bonusdata={
              bonus_amount:0,
              exgratia_amount:0
            } 
            return bonusdata;
          }
        }
          /* check DISBURSEMENT TYPE */
          if(bonus_temp_data.disbursement_type == "fixed")
          {
              /* calculate the bonus amount and exgratia */
              if(gov_calculate_bonus > bonus_value)
              {
                  bonus_amount= bonus_value;
                  exgratia_amount= 0;
              }
              else
              {
                  exgratia_amount= (bonus_value-gov_calculate_bonus);
                  bonus_amount= gov_calculate_bonus;
              }
              
          }
          else
          {
              /* calculate the bonus amount and exgratia */
              var com_calculate_bonus=((bonus_wages*bonus_value)/100);
              if(gov_calculate_bonus > com_calculate_bonus)
              {
                  bonus_amount= com_calculate_bonus;
                  exgratia_amount= 0;
              }
              else
              {
                  exgratia_amount= (com_calculate_bonus-gov_calculate_bonus);
                  bonus_amount= gov_calculate_bonus;
              }
              //console.log(com_calculate_bonus,'-',bonus_amount)
          } 
          if(exgratia_status === "off")
          {
              
              if(gross_salary > bonus_temp_data.eligible_capping)
              { 
                  /* if employee not eligible for bonus then set the bonus value  */
                  bonus_amount=0;
              }
              /* if exgratia is off then set the ex-gratia value  */
              exgratia_amount=0;
          }
      }
      var bonusdata={
          bonus_amount:bonus_amount,
          exgratia_amount:exgratia_amount
      }
      return bonusdata;
}
function roundoff_func(round_rule, org_value) {
  switch (round_rule) {
    case 'up':
      org_value = Math.ceil(org_value);
      break
    case 'off':
      org_value = Math.round(org_value);
      break
    case 'down':
      org_value = Math.floor(org_value);
  }
  return org_value;
}
function daysInMonth (month, year) {
  return new Date(year, month++, 0).getDate();
}
function getMonthDifference(startDate, endDate) {
  return (
    endDate.getUTCMonth() -
    startDate.getUTCMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
  );
}
function frequency_month(date = new Date(),freq) {
  var monthspan='';
  var ret_arr=[]
  if(freq == 6)
  {
    var counter=2;
  }
  else{
    var counter=4;
  }
  for($i=0;$i<counter;$i++)
  {
    monthspan=new Date(date.setMonth(date.getUTCMonth()+freq));
    ret_arr.push(monthspan.getUTCMonth());
  }
  return ret_arr;
}