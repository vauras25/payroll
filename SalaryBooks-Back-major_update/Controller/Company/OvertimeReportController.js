var IncentiveTemp = require('../../Model/Admin/IncentiveTemp');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../Helpers/Site_helper');
var Employee = require('../../Model/Company/employee');
var IncentiveModule = require('../../Model/Company/IncentiveModule');
const EmployeeMonthlyReport=require('../../Model/Company/EmployeeMonthlyReport');
const EmployeeSheetTemplate=require('../../Model/Company/EmployeeSheetTemplate');
const mongoose = require('mongoose');
const moment = require('moment');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const bcrypt = require("bcrypt");
module.exports = {
    overtime_employee_list: async function (req, resp, next) {
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
                search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
              }
              else
              {
                var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
                search_option_details=query_data.search_option_details;
                search_option=query_data.search_option;
              }
              search_option_details.$match['attendance_summaries.attendance_month']= attendence_month.toString();
              search_option_details.$match['attendance_summaries.attendance_year']=  attendence_year.toString();
              search_option_details.$match['attendance_summaries.total_overtime']=  {$gte: 1  };
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
                  localField: '_id',
                  foreignField: 'emp_db_id',
                  as: 'employee_monthly_reports',
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
                  "employee_monthly_reports": {
                    "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
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
                    "pan_no":1,
                    "aadhar_no":1,
                    "email_id":1,
                    "empid":1,
                    "client_code":1,
                    "approval_status":1,
                    "employee_details.template_data.attendance_temp_data":1,
                    "employee_details.template_data.overtime_temp_data":1,
                    "branch.branch_name":1,
                    "branch._id":1,
                    "department":1,
                    "client":1,
                    "employee_monthly_reports":{
                      "bank_ins_referance_id":"$employee_monthly_reports.ot_report.bank_ins_referance_id",
                      "pf_challan_referance_id":"$employee_monthly_reports.ot_report.pf_challan_referance_id",
                      "esic_challan_referance_id":"$employee_monthly_reports.ot_report.esic_challan_referance_id",
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
    generate_overtime_sheet: async function (req, resp, next) {  
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
            search_option_details.$match['attendance_summaries.total_overtime']=  {$gte: 1  };
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
                "employee_details":1,
                "incentive_modules":1,
                "employee_monthly_reports":1,
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
                }
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
                        if(empdata.employee_details.template_data)
                          var pre_total_pt = 0;
                          var pre_module_pt = 0;
                          var emp_state = empdata.employee_details.emp_address.state;
                          var attendance_temp_data = empdata.employee_details.template_data.attendance_temp_data?empdata.employee_details.template_data.attendance_temp_data:null;
                          var overtime_temp_data = empdata.employee_details.template_data.overtime_temp_data?empdata.employee_details.template_data.overtime_temp_data:null;
                          var attendance_summaries = empdata.attendance_summaries;
                          var gross_salary =parseFloat(empdata.employee_details.employment_hr_details.gross_salary);                                                      
                          var pre_earning_data=empdata.employee_monthly_reports;
                          var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;
                          var overtime_amount = await Site_helper.calculate_overtime(gross_salary,attendance_temp_data,overtime_temp_data,attendance_summaries,req.companyData,wage_month,wage_year);
                          
                          var advance_recovery_data=await Site_helper.get_advance_recovery_data(empdata.emp_id,empdata.corporate_id,wage_month,wage_year,overtime_amount,'incentive');
                          var overtime_return_val = advance_recovery_data.available_module_amount;
                          var advance_recovered = advance_recovery_data.advance_recovered;

                          var pre_salary_data=empdata.employee_monthly_reports;
                          var pre_monthly_wage_amount=0;
                          var ptax_temp_data = empdata?.employee_details?.template_data?.ptax_temp_data ?? {};
                          if(pre_salary_data)
                          {
                            if(pre_salary_data.ot_report)
                            {
                              pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.ot_report.total_pf_wages);                     
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
                            var module_wage_amount=(overtime_return_val < parseFloat(avaiable_wage_amount) ? overtime_return_val  : parseFloat(avaiable_wage_amount) );
                            
                          }
                          else
                          {
                            var module_wage_amount= overtime_return_val;
                          }
                          var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? overtime_return_val : 0 );
                          var ot_earning_data={
                            total_pf_bucket:overtime_return_val,
                            total_pf_wages:module_wage_amount,
                            total_esic_bucket:overtime_return_val,
                            total_esic_wages:restrict_esic_wages,
                            total_pt_wages:overtime_return_val,
                            overtime_wages:overtime_return_val,
                            gross_earning:overtime_return_val,
                            total_deduction: advance_recovered,
                            advance_recovered:advance_recovered,
                            bank_ins_referance_id:'',
                            pf_challan_referance_id:'',
                            esic_challan_referance_id:'',
                            pf_generate: 'no',
                            esic_generate: 'no',
                        };
                        if(pre_salary_data)
                        {
                          //console.log('a')
                          pre_total_pt = (pre_salary_data.total_data.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);
                          if(pre_salary_data.ot_report)
                          {
                            //console.log('b')

                            pre_module_pt = (pre_salary_data.ot_report.pt_amount?pre_salary_data.ot_report.pt_amount:0);
                            var total_earning_data={ 
                              'total_earning': (ot_earning_data.gross_earning + (  pre_salary_data.total_data.total_earning - pre_salary_data.ot_report.gross_earning)),
                              // 'total_ctc': (ot_earning_data.gross_earning + (  pre_salary_data.total_data.total_ctc - pre_salary_data.ot_report.gross_earning)),
                              'total_pf_bucket':(ot_earning_data.total_pf_bucket + (pre_salary_data.total_data.total_pf_bucket -  pre_salary_data.ot_report.total_pf_bucket)),
                              'total_pf_wages':(ot_earning_data.total_pf_wages + ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.ot_report.total_pf_wages)),
                              'total_esic_bucket':(ot_earning_data.total_esic_bucket + (pre_salary_data.total_data.total_esic_bucket - pre_salary_data.ot_report.total_esic_bucket)),
                              'total_esic_wages':(ot_earning_data.total_esic_wages +  (pre_salary_data.total_data.total_esic_wages - pre_salary_data.ot_report.total_esic_wages)),
                              'total_pt_wages':(ot_earning_data.total_pt_wages + (pre_salary_data.total_data.total_pt_wages - pre_salary_data.ot_report.total_pt_wages)),
                              'bank_ins_referance_id':pre_salary_data.total_data.bank_ins_referance_id == '' ? '' :  pre_salary_data.total_data.bank_ins_referance_id,
                              'pf_challan_referance_id':pre_salary_data.total_data.pf_challan_referance_id == '' ? '' :  pre_salary_data.total_data.pf_challan_referance_id,
                              'esic_challan_referance_id':pre_salary_data.total_data.esic_challan_referance_id == '' ? '' :  pre_salary_data.total_data.esic_challan_referance_id,
                            };
                          }
                          else
                          {
                            var total_earning_data={ 
                              'total_earning':  (ot_earning_data.gross_earning +   pre_salary_data.total_data.total_earning),
                              'total_pf_bucket':(ot_earning_data.total_pf_bucket + pre_salary_data.total_data.total_pf_bucket),
                              'total_pf_wages': (ot_earning_data.total_pf_wages +  pre_salary_data.total_data.total_pf_wages),
                              'total_esic_bucket': (ot_earning_data.total_esic_bucket + pre_salary_data.total_data.total_esic_bucket),
                              'total_esic_wages': (ot_earning_data.total_esic_wages +  pre_salary_data.total_data.total_esic_wages),
                              'total_pt_wages': (ot_earning_data.total_pt_wages + pre_salary_data.total_data.total_pt_wages),
                              'bank_ins_referance_id': '' ,
                              'pf_challan_referance_id': '' ,
                              'esic_challan_referance_id': '' ,
                           };
                          } 
                        }
                        else
                        {
                          var total_earning_data={ 
                            'total_earning':  overtime_return_val,
                            'total_pf_bucket':overtime_return_val,
                            'total_pf_wages': module_wage_amount,
                            'total_esic_bucket': overtime_return_val,
                            'total_esic_wages': restrict_esic_wages,
                            'total_pt_wages': overtime_return_val,
                            'bank_ins_referance_id': '' ,
                            'pf_challan_referance_id': '' ,
                            'esic_challan_referance_id': '' ,
                          };
                        }
                        ot_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, ot_earning_data.total_esic_wages,gross_salary);
                        ot_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, ot_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);
                        
                        total_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages,gross_salary, true);
                        total_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details, true);                
                                      
                        var p_tax_amount = await Site_helper.calculate_pt(req,currdate,emp_state,total_earning_data.total_pt_wages?total_earning_data.total_pt_wages:0, ptax_temp_data);                
                        var module_pt_amount= (p_tax_amount - (pre_total_pt - pre_module_pt));      
                        ot_earning_data.pt_amount= module_pt_amount;
                        // console.log(p_tax_amount, "ot ptax amount");  
                        // console.log(ot_earning_data.pt_amount, "ot pt amount");
                        
                        total_earning_data.total_pt_amount= p_tax_amount;
                        total_earning_data.bank_ins_referance_id= '';
                        total_earning_data.pf_challan_referance_id= '';
                        total_earning_data.esic_challan_referance_id= '';
                        var insert_data={
                          corporate_id:empdata.corporate_id,
                          emp_db_id:mongoose.Types.ObjectId(empdata._id),
                          emp_id: empdata.emp_id,
                          wage_month:attendence_month,
                          wage_year:attendence_year,
                          ot_report:ot_earning_data,
                          total_data:total_earning_data,
                          status:'active',
                        }
                        var where_condition={'emp_id':empdata.emp_id,wage_month:wage_month,wage_year:wage_year,corporate_id:empdata.corporate_id};
                        await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});    

                        /*

                            var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? overtime_return_val : 0 );
                            var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;

                            if(salary_temp_data.restricted_pf === "yes")
                            {
                                var pre_monthly_wage_amount=(pre_earning_data?pre_earning_data.total_data.total_pf_wages:0);
                                var template_wage_ceiling = parseFloat(epfo_temp.wage_ceiling);
                                var avaiable_wage_amount= (template_wage_ceiling-pre_monthly_wage_amount);
                                var module_wage_amount=(overtime_return_val < parseFloat(avaiable_wage_amount) ? overtime_return_val  : parseFloat(avaiable_wage_amount) );
                            }
                            else
                            {    
                                var module_wage_amount=overtime_return_val;
                            }
                            var ot_earning_data={
                                total_pf_bucket:overtime_return_val,
                                total_pf_wages:module_wage_amount,
                                total_esic_bucket:overtime_return_val,
                                total_esic_wages:restrict_esic_wages,
                                total_pt_wages:overtime_return_val,
                                overtime_wages:overtime_return_val,
                                gross_earning:overtime_return_val,
                                bank_ins_referance_id:'',
                                pf_challan_referance_id:'',
                                esic_challan_referance_id:'',
                            };
                            //console.log(overtime_earning_data);
                            if(pre_earning_data)
                            {
                                pre_total_pt = pre_earning_data.total_data.total_pt_amount;
                                if(pre_earning_data.ot_report)
                                {
                                  pre_module_pt = pre_earning_data.ot_report.pt_amount;                              
                                var total_earning_data={ 
                                    'total_data.total_earning': (pre_earning_data.ot_report ? (  ot_earning_data.gross_earning - pre_earning_data.ot_report.gross_earning) : ot_earning_data.gross_earning),
                                    'total_data.total_pf_bucket':(pre_earning_data.ot_report ? (ot_earning_data.total_pf_wages -  pre_earning_data.ot_report.total_pf_bucket) : ot_earning_data.total_pf_wages),
                                    'total_data.total_pf_wages':(pre_earning_data.ot_report ? ( module_wage_amount -  pre_earning_data.ot_report.total_pf_wages) : module_wage_amount),
                                    'total_data.total_esic_bucket':(pre_earning_data.ot_report ? ( ot_earning_data.total_esic_bucket - pre_earning_data.ot_report.total_esic_bucket) : ot_earning_data.total_esic_bucket),
                                    'total_data.total_esic_wages':(pre_earning_data.ot_report ? (ot_earning_data.total_esic_wages - pre_earning_data.ot_report.total_esic_wages) : ot_earning_data.total_esic_wages),
                                    'total_data.total_pt_wages':(pre_earning_data.ot_report ? (ot_earning_data.total_pt_wages - pre_earning_data.ot_report.total_pt_wages)  : ot_earning_data.total_pt_wages),
                                };
                                }
                                else
                                {
                                var total_earning_data={ 
                                    'total_data.total_earning':  ot_earning_data.gross_earning,
                                    'total_data.total_pf_bucket':ot_earning_data.total_pf_wages,
                                    'total_data.total_pf_wages': module_wage_amount,
                                    'total_data.total_esic_bucket': ot_earning_data.total_esic_bucket,
                                    'total_data.total_esic_wages': ot_earning_data.total_esic_wages,
                                    'total_data.total_pt_wages': ot_earning_data.total_pt_wages,
                                };
                                } 
                            }
                            else
                            {
                                var total_earning_data={ 
                                'total_data.total_earning':  ot_earning_data.gross_earning,
                                'total_data.total_pf_bucket':ot_earning_data.total_pf_wages,
                                'total_data.total_pf_wages': module_wage_amount,
                                'total_data.total_esic_bucket': ot_earning_data.total_esic_bucket,
                                'total_data.total_esic_wages': ot_earning_data.total_esic_wages,
                                'total_data.total_pt_wages': ot_earning_data.total_pt_wages,
                                };
                            } 
                            ot_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, ot_earning_data.total_esic_wages,gross_salary);
                            ot_earning_data.pf_data = await Site_helper.calculate_pf(await epfo_temp, ot_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);
                            var p_tax_amount = await Site_helper.calculate_pt(req, currdate, emp_state,ot_earning_data.total_pt_wages ? ot_earning_data.total_pt_wages : 0);
                        
                            var module_pt_amount = p_tax_amount - (pre_total_pt - pre_module_pt);
                            ot_earning_data.pt_amount = module_pt_amount;
                            total_earning_data['total_data.total_pt_amount'] = (p_tax_amount - pre_total_pt);

                            var pre_monthly_pf_wage_amount = pre_earning_data ? pre_earning_data.total_data.total_pf_wages : 0;
                            var pre_monthly_esic_wage_amount = pre_earning_data ? pre_earning_data.total_data.total_esic_wages : 0;

                            var total_esic_wages = pre_monthly_esic_wage_amount + total_earning_data["total_data.total_esic_wages"];
                            var total_pf_wages = pre_monthly_pf_wage_amount +  total_earning_data["total_data.total_pf_wages"];

                            var total_earning_data_esic_data = await Site_helper.calculate_esic(esic_temp,total_esic_wages,gross_salary);
                            var total_earning_data_pf_data = await Site_helper.calculate_pf(await epfo_temp,total_pf_wages,salary_temp_data,empdata.employee_details.employment_hr_details );                             
                                                      
                            //console.log(pf_return_val,esic_amount);
                            var where_condition={'emp_id':empdata.emp_id,wage_month:wage_month,wage_year:wage_year,corporate_id:empdata.corporate_id};

                            var insert_data={
                            corporate_id:empdata.corporate_id,
                            emp_db_id:mongoose.Types.ObjectId(empdata._id),
                            emp_id: empdata.emp_id,
                            wage_month:wage_month,
                            wage_year:wage_year,
                            ot_report:ot_earning_data,
                            "total_data.total_esic_data": total_earning_data_esic_data,
                            "total_data.pf_data": total_earning_data_pf_data,
                            status:'active',
                            
                            }
                            await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});
                           await EmployeeMonthlyReport.updateOne(where_condition, {$inc:total_earning_data}); */
                })).then(value =>{
                    next();
                   //return resp.status(200).send({ status: 'success',message:"Overtime generated successfully." });
                });
            }); 
        }       
    },
    get_overtime_sheet_data:async function(req, resp){
        try {
          const v = new Validator(req.body, {
            wage_month: 'required',
            wage_year: 'required',
            pageno: 'required',
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
              var search_option_details= {$match: {} };
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
              search_option_details.$match['employee_monthly_reports.wage_month']= wage_month.toString();
              search_option_details.$match['employee_monthly_reports.wage_year']=  wage_year.toString();
              search_option_details.$match['employee_monthly_reports.ot_report']=  {$exists: true , $ne: null} ;
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
                  localField: '_id',
                  foreignField: 'emp_db_id',
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
                  "employee_details.template_data.overtime_temp_data":1,
                  "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                  ot_report:{ $ifNull: [ "$employee_monthly_reports.ot_report", {} ] },
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
    get_overtime_report_listing_data:async function(req, resp){
      try {
          const v = new Validator(req.body, {
            wage_month_from: 'required',
            wage_year_from: 'required',
            wage_month_to: 'required',
            wage_year_to: 'required',
            pageno: 'required',
          });
          const matched = await v.check();
          if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            //var wage_month=req.body.wage_month;
             // var wage_year=req.body.wage_year;
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
              var start_month = parseInt(req.body.wage_month_from);
              var start_year = parseInt(req.body.wage_year_from);
              var end_month = parseInt(req.body.wage_month_to);
              var end_year = parseInt(req.body.wage_year_to);
              var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
              var search_option_details= {$match: {} 
              };
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
              search_option_details.$match['employee_monthly_reports.ot_report']=  {$exists: true , $ne: null} ;
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
                  let: { emp_id_var: "$emp_id" },
                  pipeline: [
                    {
                      $match: {
                        $and: [
                          { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                          {"wage_month": parseInt(start_month)},
                          {"wage_year": parseInt(start_year)},
                        //   {$or:[ 
                        //     {'wage_month': {$gt: start_year }}, 
                        //     { $and:[
                        //       {'wage_year': {$gte: start_year }},
                        //       {'wage_month': {$gte: start_month }}
                        //     ]} 
                        //   ]},
                        // { $or:[ 
                        //   {'wage_year': {$lt: end_year }}, 
                        //   { $and:[
                        //     {'wage_year': {$lte: end_year }},
                        //     {'wage_month': {$lte: end_month }}
                        //   ]} 
                        // ]}
                        ],
                      },
                    },
                    {
                      $group: {
                        _id: null,
                        ot_report: { $first : "$ot_report" },
                        calculated_wage_value: {
                          $sum: "$ot_report.overtime_wages",
                        },
                        calculated_pf_contribution_value: {
                          $sum: "$ot_report.pf_data.emoloyee_contribution",
                        },
                        calculated_esic_contribution_value: {
                          $sum: "$ot_report.esic_data.emoloyee_contribution",
                        },
                      },
                    },
                  ],
                  // localField: '_id',
                  // foreignField: 'emp_id',
                  as: 'employee_monthly_reports',
                }},               
                search_option_details,
                { "$addFields": {
                  "employee_details": {
                      "$arrayElemAt": [ "$employee_details", 0 ]
                  },
                  "employee_monthly_reports": {
                      "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                  },
                  "incentive_modules_data": {
                    "$arrayElemAt": [ "$incentive_modules_data", 0 ]
                  },  
                  }
                },
                
                { "$project": { 
                  "_id":1,
                  "emp_first_name":1,
                  "emp_last_name":1,
                  "emp_id":1,
                  "over_time_moduless":{
                    'calculated_wage_value':{ $ifNull: ["$employee_monthly_reports.calculated_wage_value", null ] },
                    'total_deduction':{ '$add' :["$employee_monthly_reports.calculated_pf_contribution_value", "$employee_monthly_reports.calculated_esic_contribution_value"]},
                    'total_net_value':{  '$subtract' :["$employee_monthly_reports.calculated_wage_value", { '$add' :["$employee_monthly_reports.calculated_pf_contribution_value", "$employee_monthly_reports.calculated_esic_contribution_value"]}]},
                  },
                  "employee_details.template_data.overtime_temp_data":1,
                  "emp_data":"$employee_monthly_reports.emp_data",
                  "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                  "corporate_id":1,
                  bank_details:{ $ifNull: [ "$employee_details.bank_details", {} ] } ,
                  'ot_report':"$employee_monthly_reports.ot_report",
                  }
                },
                ]);
                if(req.body.row_checked_all)
                {
                    if(req.body.export_csv == 'true')
                    {
                        //Site_helper.generate_export_file('incentive',);
                    }
                    else
                    {
                        myAggregate.then(async (emps) => {
                            return resp.status(200).send({ status: 'success',message:"", master_data: {"docs":emps} });
                        })
                    }
                    
                }
                else
                {
                    Employee.aggregatePaginate(myAggregate,options, async function (err, master_data) {
                        if (err) return resp.status(200).send({ status: 'error', message: err.message });
                        return resp.status(200).send({ status: 'success',message:"", master_data: master_data });
                      });
                }
               
                              
          }
        }
        catch (e) {
          return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
        }
  },
  get_overtime_report_listing_temp_wise_data:async function(req, resp){
    try {
        const v = new Validator(req.body, {
          wage_month_from: 'required',
          wage_year_from: 'required',
          wage_month_to: 'required',
          wage_year_to: 'required',
          pageno: 'required',
          template_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          //var wage_month=req.body.wage_month;
           // var wage_year=req.body.wage_year;
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
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
            var search_option_details= {$match: {} 
            };
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
              if(req.body.checked_row_ids){
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
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
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
                $lookup:{
                  from: 'employee_tds_calculations',
                  "let": { "emp_db_idVar": "$_id"},
                  "pipeline": [
                  { 
                    "$match": { 
                      $and :[
                      {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
                      {'wage_year': {"$eq": parseInt(start_year) }},
                      {'wage_month': {"$eq": parseInt(start_month) }}
                      ] 
                    } 
                  }
                  ],
                  as: 'employee_tds_calculations',
                }
              },
              {$lookup:{
                from: 'employee_monthly_reports',
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {"wage_month": parseInt(start_month)},
                        {"wage_year": parseInt(start_year)},
                      //   {$or:[ 
                      //     {'wage_month': {$gt: start_year }}, 
                      //     { $and:[
                      //       {'wage_year': {$gte: start_year }},
                      //       {'wage_month': {$gte: start_month }}
                      //     ]} 
                      //   ]},
                      // { $or:[ 
                      //   {'wage_year': {$lt: end_year }}, 
                      //   { $and:[
                      //     {'wage_year': {$lte: end_year }},
                      //     {'wage_month': {$lte: end_month }}
                      //   ]} 
                      // ]}
                      ],
                    },
                  },
                  // {
                  //   $group: {
                  //     _id: null,
                  //     calculated_wage_value: {
                  //       $sum: "$ot_report.overtime_wages",
                  //     },
                  //     calculated_pf_contribution_value: {
                  //       $sum: "$ot_report.pf_data.emoloyee_contribution",
                  //     },
                  //     calculated_esic_contribution_value: {
                  //       $sum: "$ot_report.esic_data.emoloyee_contribution",
                  //     },
                  //     attendance_summaries:"$attendance_summaries",
                  //   },
                  // },
                ],
                // localField: '_id',
                // foreignField: 'emp_id',
                as: 'employee_monthly_reports',
              }},               
              search_option_details,
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                },
                "employee_monthly_reports": {
                    "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                },
                "incentive_modules_data": {
                  "$arrayElemAt": [ "$incentive_modules_data", 0 ]
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
                },
                client: {
                  $arrayElemAt: ["$client", 0],
                },
                branch: {
                  $arrayElemAt: ["$branch", 0],
                },
                department: {
                  $arrayElemAt: ["$department", 0],
                },
                designation: {
                  $arrayElemAt: ["$designation", 0],
                },
                employee_tds_calculations: {
                  $arrayElemAt: ["$employee_tds_calculations", 0],
                },
                }
              },
              
              { "$project": { 
                "_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_id":1,
                "client._id": 1,
                "client.client_code": 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "branch._id": 1,
                "branch.branch_name": 1,
                "department._id": 1,
                "department.department_name": 1,
                "designation._id": 1,
                "designation.designation_name": 1,
                // "employee_monthly_reports":1,
                "employee_details.template_data.overtime_temp_data":1,
                // "emp_data":"$employee_monthly_reports.emp_data",
                "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                "corporate_id":1,
                bank_details:{ $ifNull: [ "$employee_details.bank_details", {} ] } ,
                "ot_report":{ $ifNull: [ "$employee_monthly_reports.ot_report", null ] },
                "total_overtime":{ $ifNull: [ "$employee_monthly_reports.attendance_summaries.total_overtime", null ] },
                "advance_report":{ $ifNull: [ "$employee_monthly_reports.advance_report", null ] },
                "employee_tds_calculations": { $ifNull: [ "$employee_tds_calculations", null ] },
                }
              },
              ]);
              myAggregate.then(async (emps) => {
                  if(req.body.template_id){
                    var employeeSheetTemplate = await EmployeeSheetTemplate.findOne({'_id':mongoose.Types.ObjectId(req.body.template_id)});
                    if(employeeSheetTemplate){
                      if(employeeSheetTemplate.template_fields){
                        if(employeeSheetTemplate.template_fields.length > 0){
                          if(employeeSheetTemplate.template_fields[0].modules){
                            if(employeeSheetTemplate.template_fields[0].modules.length > 0){
                              if(employeeSheetTemplate.template_fields[0].modules[0].fields){
                                if(employeeSheetTemplate.template_fields[0].modules[0].fields.length > 0){
                                    emps.map(function(emp_vlaue){
                                      emp_vlaue.temp_data = {};
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('emp_id')){
                                        emp_vlaue.temp_data.emp_id = emp_vlaue.emp_id;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('emp_name')){
                                        emp_vlaue.temp_data.emp_name = emp_vlaue.emp_first_name+" "+emp_vlaue.emp_last_name;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('department')){
                                        emp_vlaue.temp_data.department = emp_vlaue.department;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('designation')){
                                        emp_vlaue.temp_data.designation = emp_vlaue.designation;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('client')){
                                        emp_vlaue.temp_data.client = emp_vlaue.client;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('branch')){
                                        emp_vlaue.temp_data.branch = emp_vlaue.branch;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('hod')){
                                        emp_vlaue.temp_data.hod = emp_vlaue.hod;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_hours')){
                                        emp_vlaue.temp_data.ot_hours = emp_vlaue.total_overtime ? emp_vlaue.total_overtime : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_days')){
                                        emp_vlaue.temp_data.ot_days = emp_vlaue.total_overtime ? emp_vlaue.total_overtime : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_wage')){
                                        emp_vlaue.temp_data.ot_wage = emp_vlaue.ot_report ? emp_vlaue.ot_report.overtime_wages : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_hour_amt')){
                                        emp_vlaue.temp_data.ot_hour_amt = emp_vlaue.employee_details ? emp_vlaue.employee_details.template_data.overtime_temp_data.overtime_rate : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_days_amt')){
                                        emp_vlaue.temp_data.ot_days_amt = emp_vlaue.employee_details ? emp_vlaue.employee_details.template_data.overtime_temp_data.overtime_rate : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('openin_advance')){
                                        emp_vlaue.temp_data.openin_advance =  emp_vlaue.advance_report ? emp_vlaue.advance_report.opening_balance : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_advance_recovered')){
                                        emp_vlaue.temp_data.ot_advance_recovered =  emp_vlaue.ot_report ? emp_vlaue.ot_report.advance_recovered : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('closin_advance_vs_ot')){
                                        emp_vlaue.temp_data.closin_advance_vs_ot = emp_vlaue.advance_report ? emp_vlaue.advance_report.closing_balance : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('tds')){
                                        emp_vlaue.temp_data.tds = emp_vlaue.employee_tds_calculations ? emp_vlaue.employee_tds_calculations.tax_amount : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ee_pf')){
                                        emp_vlaue.temp_data.ee_pf = emp_vlaue.ot_report ? emp_vlaue.ot_report.pf_data.emoloyee_contribution : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('er_pf')){
                                        emp_vlaue.temp_data.er_pf = emp_vlaue.ot_report ? emp_vlaue.ot_report.pf_data.total_employer_contribution : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ee_esi')){
                                        emp_vlaue.temp_data.ee_esi = emp_vlaue.ot_report ? emp_vlaue.ot_report.esic_data.emoloyee_contribution : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('er_esic')){
                                        emp_vlaue.temp_data.er_esic = emp_vlaue.ot_report ? emp_vlaue.ot_report.esic_data.emoloyer_contribution : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('amt_payable')){
                                        emp_vlaue.temp_data.amt_payable = emp_vlaue.ot_report ? emp_vlaue.ot_report.gross_earning : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('amt_remitted')){
                                        emp_vlaue.temp_data.amt_remitted = emp_vlaue.ot_report ? emp_vlaue.ot_report.gross_earning : 0;
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('bank_name')){
                                        emp_vlaue.temp_data.bank_name = emp_vlaue.bank_details ? emp_vlaue.bank_details.bank_name : "";
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('account_no')){
                                        emp_vlaue.temp_data.account_no = emp_vlaue.bank_details ? emp_vlaue.bank_details.account_no : "";
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ifsc')){
                                        emp_vlaue.temp_data.ifsc = emp_vlaue.bank_details ? emp_vlaue.bank_details.ifsc_code : "";
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('payment_mode')){
                                        emp_vlaue.temp_data.payment_mode = "";
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('signature')){
                                        emp_vlaue.temp_data.signature = "";
                                      }
                                    });
                                    return resp.status(200).send({ status: 'success',message:"", master_data: {"docs":emps} });
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  return resp.status(200).send({ status: 'success',message:"", master_data: {"docs":emps} });
              });              
        }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  get_overtime_report_listing_temp_wise_export_data:async function(req, resp){
    try {
        const v = new Validator(req.body, {
          wage_month_from: 'required',
          wage_year_from: 'required',
          wage_month_to: 'required',
          wage_year_to: 'required',
          template_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(403).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          //var wage_month=req.body.wage_month;
           // var wage_year=req.body.wage_year;
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
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
            var search_option_details= {$match: {} 
            };
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
              if(req.body.checked_row_ids){
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
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
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
                $lookup:{
                  from: 'employee_tds_calculations',
                  "let": { "emp_db_idVar": "$_id"},
                  "pipeline": [
                  { 
                    "$match": { 
                      $and :[
                      {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
                      {'wage_year': {"$eq": parseInt(start_year) }},
                      {'wage_month': {"$eq": parseInt(start_month) }}
                      ] 
                    } 
                  }
                  ],
                  as: 'employee_tds_calculations',
                }
              },
              {$lookup:{
                from: 'employee_monthly_reports',
                let: { emp_id_var: "$emp_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $eq: ["$emp_id", "$$emp_id_var"] } },
                        {"wage_month": parseInt(start_month)},
                        {"wage_year": parseInt(start_year)},
                      //   {$or:[ 
                      //     {'wage_month': {$gt: start_year }}, 
                      //     { $and:[
                      //       {'wage_year': {$gte: start_year }},
                      //       {'wage_month': {$gte: start_month }}
                      //     ]} 
                      //   ]},
                      // { $or:[ 
                      //   {'wage_year': {$lt: end_year }}, 
                      //   { $and:[
                      //     {'wage_year': {$lte: end_year }},
                      //     {'wage_month': {$lte: end_month }}
                      //   ]} 
                      // ]}
                      ],
                    },
                  },
                  // {
                  //   $group: {
                  //     _id: null,
                  //     calculated_wage_value: {
                  //       $sum: "$ot_report.overtime_wages",
                  //     },
                  //     calculated_pf_contribution_value: {
                  //       $sum: "$ot_report.pf_data.emoloyee_contribution",
                  //     },
                  //     calculated_esic_contribution_value: {
                  //       $sum: "$ot_report.esic_data.emoloyee_contribution",
                  //     },
                  //     attendance_summaries:"$attendance_summaries",
                  //   },
                  // },
                ],
                // localField: '_id',
                // foreignField: 'emp_id',
                as: 'employee_monthly_reports',
              }},               
              search_option_details,
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                },
                "employee_monthly_reports": {
                    "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                },
                "incentive_modules_data": {
                  "$arrayElemAt": [ "$incentive_modules_data", 0 ]
                },
                hod: {
                  $arrayElemAt: ["$hod", 0],
                },
                client: {
                  $arrayElemAt: ["$client", 0],
                },
                branch: {
                  $arrayElemAt: ["$branch", 0],
                },
                department: {
                  $arrayElemAt: ["$department", 0],
                },
                designation: {
                  $arrayElemAt: ["$designation", 0],
                },
                employee_tds_calculations: {
                  $arrayElemAt: ["$employee_tds_calculations", 0],
                },
                }
              },
              
              { "$project": { 
                "_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_id":1,
                "client._id": 1,
                "client.client_code": 1,
                "hod.first_name": 1,
                "hod.last_name": 1,
                "branch._id": 1,
                "branch.branch_name": 1,
                "department._id": 1,
                "department.department_name": 1,
                "designation._id": 1,
                "designation.designation_name": 1,
                // "employee_monthly_reports":1,
                "employee_details.template_data.overtime_temp_data":1,
                // "emp_data":"$employee_monthly_reports.emp_data",
                "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                "corporate_id":1,
                bank_details:{ $ifNull: [ "$employee_details.bank_details", {} ] } ,
                "ot_report":{ $ifNull: [ "$employee_monthly_reports.ot_report", null ] },
                "total_overtime":{ $ifNull: [ "$employee_monthly_reports.attendance_summaries.total_overtime", null ] },
                "advance_report":{ $ifNull: [ "$employee_monthly_reports.advance_report", null ] },
                "employee_tds_calculations": { $ifNull: [ "$employee_tds_calculations", null ] },
                }
              },
              ]);
              myAggregate.then(async (emps) => {
                  if(req.body.template_id){
                    var employeeSheetTemplate = await EmployeeSheetTemplate.findOne({'_id':mongoose.Types.ObjectId(req.body.template_id)});
                    if(employeeSheetTemplate){
                      if(employeeSheetTemplate.template_fields){
                        if(employeeSheetTemplate.template_fields.length > 0){
                          if(employeeSheetTemplate.template_fields[0].modules){
                            if(employeeSheetTemplate.template_fields[0].modules.length > 0){
                              if(employeeSheetTemplate.template_fields[0].modules[0].fields){
                                if(employeeSheetTemplate.template_fields[0].modules[0].fields.length > 0){
                                  var field_list_array=employeeSheetTemplate.template_fields[0].modules[0].fields;
                                    var wb = new xl.Workbook();
                                    var ws = wb.addWorksheet("Sheet 1");
                                    var clmn_id = 1;
                                    ws.cell(1, clmn_id).string("SL");
                                    if(field_list_array.includes('emp_id'))
                                    {
                                      ws.cell(1, clmn_id++).string("Employee Id");
                                    }
                                    if(field_list_array.includes('emp_name'))
                                    {
                                      ws.cell(1, clmn_id++).string("Name");
                                    }
                                    if(field_list_array.includes('department'))
                                    {
                                      ws.cell(1, clmn_id++).string("Department");
                                    }
                                    if(field_list_array.includes('designation'))
                                    {
                                      ws.cell(1, clmn_id++).string("Designation");
                                    }
                                    if(field_list_array.includes('client'))
                                    {
                                      ws.cell(1, clmn_id++).string("Client");
                                    }
                                    if(field_list_array.includes('branch'))
                                    {
                                      ws.cell(1, clmn_id++).string("Branch");
                                    }
                                    if(field_list_array.includes('hod'))
                                    {
                                      ws.cell(1, clmn_id++).string("HOD");
                                    }
                                    if(field_list_array.includes('ot_hours'))
                                    {
                                      ws.cell(1, clmn_id++).string("Ot Hours");
                                    }
                                    if(field_list_array.includes('ot_days'))
                                    {
                                      ws.cell(1, clmn_id++).string("OT Days");
                                    }
                                    if(field_list_array.includes('ot_wage'))
                                    {
                                      ws.cell(1, clmn_id++).string("OT Wage");
                                    }
                                    if(field_list_array.includes('ot_hour_amt'))
                                    {
                                      ws.cell(1, clmn_id++).string("OT Hour Amount");
                                    }
                                    if(field_list_array.includes('ot_days_amt'))
                                    {
                                      ws.cell(1, clmn_id++).string("OT Days Amount");
                                    }
                                    if(field_list_array.includes('openin_advance'))
                                    {
                                      ws.cell(1, clmn_id++).string("Openin Advance");
                                    }
                                    if(field_list_array.includes('ot_advance_recovered'))
                                    {
                                      ws.cell(1, clmn_id++).string("OT Advance Recovered");
                                    }
                                    if(field_list_array.includes('closin_advance_vs_ot'))
                                    {
                                      ws.cell(1, clmn_id++).string("Closin Advance Vs OT");
                                    }
                                    if(field_list_array.includes('tds'))
                                    {
                                      ws.cell(1, clmn_id++).string("TDS");
                                    }
                                    if(field_list_array.includes('ee_pf'))
                                    {
                                      ws.cell(1, clmn_id++).string("EE PF");
                                    }
                                    if(field_list_array.includes('er_pf'))
                                    {
                                      ws.cell(1, clmn_id++).string("ER PF");
                                    }
                                    if(field_list_array.includes('ee_esi'))
                                    {
                                      ws.cell(1, clmn_id++).string("EE ESI");
                                    }
                                    if(field_list_array.includes('er_esic'))
                                    {
                                      ws.cell(1, clmn_id++).string("ER ESI");
                                    }
                                    if(field_list_array.includes('amt_payable'))
                                    {
                                      ws.cell(1, clmn_id++).string("Amount Payable");
                                    }
                                    if(field_list_array.includes('amt_remitted'))
                                    {
                                      ws.cell(1, clmn_id++).string("Amount Remitted");
                                    }
                                    if(field_list_array.includes('bank_name'))
                                    {
                                      ws.cell(1, clmn_id++).string("Bank Name");
                                    }
                                    if(field_list_array.includes('account_no'))
                                    {
                                      ws.cell(1, clmn_id++).string("Account No");
                                    }
                                    if(field_list_array.includes('ifsc'))
                                    {
                                      ws.cell(1, clmn_id++).string("Ifsc");
                                    }
                                    if(field_list_array.includes('payment_mode'))
                                    {
                                      ws.cell(1, clmn_id++).string("Payment Mode");
                                    }
                                    if(field_list_array.includes('signature'))
                                    {
                                      ws.cell(1, clmn_id++).string("Signature");
                                    }
                                    await Promise.all(emps.map(async function(emp_vlaue, index){
                                      var index_val = 2;
                                      index_val = index_val + index;
                                      var clmn_emp_id=1
                                      ws.cell(index_val, clmn_emp_id).number(index_val - 1);
                                      emp_vlaue.temp_data = {};
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('emp_id')){
                                        // emp_vlaue.temp_data.emp_id = emp_vlaue.emp_id;
                                        ws.cell(index_val, clmn_emp_id++).string(emp_vlaue.emp_id ? String(emp_vlaue.emp_id) : "");
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('emp_name')){
                                        // emp_vlaue.temp_data.emp_name = emp_vlaue.emp_first_name+" "+emp_vlaue.emp_last_name;
                                        ws.cell(index_val, clmn_emp_id++).string(emp_vlaue.emp_first_name ? String(emp_vlaue.emp_first_name +" "+ emp_vlaue.emp_last_name) : "");
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('department')){
                                        // emp_vlaue.temp_data.department = emp_vlaue.department;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.department ? String(emp_vlaue.department.department_name) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('designation')){
                                        // emp_vlaue.temp_data.designation = emp_vlaue.designation;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.designation ? String(emp_vlaue.designation.designation_name) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('client')){
                                        // emp_vlaue.temp_data.client = emp_vlaue.client;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.client ? String(emp_vlaue.client.client_code) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('branch')){
                                        // emp_vlaue.temp_data.branch = emp_vlaue.branch;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.branch ? String(emp_vlaue.branch.branch_name) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('hod')){
                                        // emp_vlaue.temp_data.hod = emp_vlaue.hod;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.hod ? String(emp_vlaue.hod.first_name +" "+ emp_vlaue.hod.last_name) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_hours')){
                                        // emp_vlaue.temp_data.ot_hours = emp_vlaue.total_overtime ? emp_vlaue.total_overtime : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.total_overtime ? String(emp_vlaue.total_overtime) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_days')){
                                        // emp_vlaue.temp_data.ot_days = emp_vlaue.total_overtime ? emp_vlaue.total_overtime : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.total_overtime ? String(emp_vlaue.total_overtime) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_wage')){
                                        // emp_vlaue.temp_data.ot_wage = emp_vlaue.ot_report ? emp_vlaue.ot_report.overtime_wages : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.ot_report ? String(emp_vlaue.ot_report.overtime_wages) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_hour_amt')){
                                        // emp_vlaue.temp_data.ot_hour_amt = emp_vlaue.employee_details ? emp_vlaue.employee_details.template_data.overtime_temp_data.overtime_rate : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.employee_details.template_data ? String(emp_vlaue.employee_details.template_data.overtime_temp_data.overtime_rate) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_days_amt')){
                                        // emp_vlaue.temp_data.ot_days_amt = emp_vlaue.employee_details ? emp_vlaue.employee_details.template_data.overtime_temp_data.overtime_rate : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.employee_details.template_data ? String(emp_vlaue.employee_details.template_data.overtime_temp_data.overtime_rate) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('openin_advance')){
                                        // emp_vlaue.temp_data.openin_advance =  emp_vlaue.advance_report ? emp_vlaue.advance_report.opening_balance : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.advance_report ? String(emp_vlaue.advance_report.opening_balance) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ot_advance_recovered')){
                                        // emp_vlaue.temp_data.ot_advance_recovered =  emp_vlaue.ot_report ? emp_vlaue.ot_report.advance_recovered : 0;
                                        if(emp_vlaue.ot_report){
                                          if(emp_vlaue.ot_report.advance_recovered){
                                            ws.cell(index_val, clmn_emp_id++).string(
                                            emp_vlaue.ot_report ? String(emp_vlaue.ot_report.advance_recovered) : "0"
                                            );
                                          }
                                          else{
                                            ws.cell(index_val, clmn_emp_id++).string("0");
                                          }
                                        }
                                        else{
                                          ws.cell(index_val, clmn_emp_id++).string("0");
                                        }
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('closin_advance_vs_ot')){
                                        // emp_vlaue.temp_data.closin_advance_vs_ot = emp_vlaue.advance_report ? emp_vlaue.advance_report.closing_balance : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.advance_report ? String(emp_vlaue.advance_report.closing_balance) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('tds')){
                                        // emp_vlaue.temp_data.tds = emp_vlaue.employee_tds_calculations ? emp_vlaue.employee_tds_calculations.tax_amount : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.employee_tds_calculations ? String(emp_vlaue.employee_tds_calculations.tax_amount) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ee_pf')){
                                        // emp_vlaue.temp_data.ee_pf = emp_vlaue.ot_report ? emp_vlaue.ot_report.pf_data.emoloyee_contribution : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.ot_report ? String(emp_vlaue.ot_report.pf_data.emoloyee_contribution) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('er_pf')){
                                        // emp_vlaue.temp_data.er_pf = emp_vlaue.ot_report ? emp_vlaue.ot_report.pf_data.total_employer_contribution : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.ot_report ? String(emp_vlaue.ot_report.pf_data.total_employer_contribution) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ee_esi')){
                                        // emp_vlaue.temp_data.ee_esi = emp_vlaue.ot_report ? emp_vlaue.ot_report.esic_data.emoloyee_contribution : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.ot_report ? String(emp_vlaue.ot_report.esic_data.emoloyee_contribution) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('er_esic')){
                                        // emp_vlaue.temp_data.er_esic = emp_vlaue.ot_report ? emp_vlaue.ot_report.esic_data.emoloyer_contribution : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.ot_report ? String(emp_vlaue.ot_report.esic_data.emoloyer_contribution) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('amt_payable')){
                                        // emp_vlaue.temp_data.amt_payable = emp_vlaue.ot_report ? emp_vlaue.ot_report.gross_earning : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.ot_report ? String(emp_vlaue.ot_report.gross_earning) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('amt_remitted')){
                                        // emp_vlaue.temp_data.amt_remitted = emp_vlaue.ot_report ? emp_vlaue.ot_report.gross_earning : 0;
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.ot_report ? String(emp_vlaue.ot_report.gross_earning) : "0"
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('bank_name')){
                                        // emp_vlaue.temp_data.bank_name = emp_vlaue.bank_details ? emp_vlaue.bank_details.bank_name : "";
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.bank_details ? String(emp_vlaue.bank_details.bank_name) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('account_no')){
                                        // emp_vlaue.temp_data.account_no = emp_vlaue.bank_details ? emp_vlaue.bank_details.account_no : "";
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.bank_details ? String(emp_vlaue.bank_details.account_no) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('ifsc')){
                                        // emp_vlaue.temp_data.ifsc = emp_vlaue.bank_details ? emp_vlaue.bank_details.ifsc_code : "";
                                        ws.cell(index_val, clmn_emp_id++).string(
                                        emp_vlaue.bank_details ? String(emp_vlaue.bank_details.ifsc_code) : ""
                                        );
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('payment_mode')){
                                        // emp_vlaue.temp_data.payment_mode = "";
                                        ws.cell(index_val, clmn_emp_id++).string("");
                                      }
                                      if(employeeSheetTemplate.template_fields[0].modules[0].fields.includes('signature')){
                                        // emp_vlaue.temp_data.signature = "";
                                        ws.cell(index_val, clmn_emp_id++).string("");
                                      }
                                    })).then(async (value) => {
                                      // wb.write("overtime-report-list-temp-wise.xlsx");
                          						// let file_location = Site_helper.createFiles(wb,"overtime-report-list-temp-wise",'xlsx', req.authData.corporate_id)
                                      let file_name = "overtime-report-list-temp-wise.xlsx";
                                      let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/overtime-module');
                                      await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                                      // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                                      // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                                      // return resp.status(200).send({ status: 'success',message:"Xlsx created successfully", url: baseurl +file_location});
                                  });
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  // return resp.status(200).send({ status: 'success',message:"", master_data: {"docs":emps} });
              });              
        }
    }
    catch (e) {
      return resp.status(403).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
}
function getMonthDifference(startDate, endDate) {
    return (
      endDate.getUTCMonth() -
      startDate.getUTCMonth() +
      12 * (endDate.getFullYear() - startDate.getFullYear())
    );
  }