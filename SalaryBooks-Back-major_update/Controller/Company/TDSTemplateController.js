var TdsTemplate = require('../../Model/Company/TdsTemplate');
var EmployeeMonthlyReport = require('../../Model/Company/EmployeeMonthlyReport');
var Company = require('../../Model/Admin/Company');
var Company_details = require('../../Model/Admin/Company_details');
var EarningTempHead = require('../../Model/Admin/EarningTempHead');
var Declaration = require('../../Model/Company/Declaration');
var Employee = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
var EmployeeTdsCalculation = require("../../Model/Company/EmployeeTdsCalculation");
var Incometaxcategory = require("../../Model/Admin/Incometaxcategory");
var Incometaxrule = require("../../Model/Admin/Incometaxrule");
var TdsAct = require("../../Model/Company/TdsAct");
const { Validator } = require('node-input-validator');
var Site_helper = require("../../Helpers/Site_helper");
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
var xl = require("excel4node");
const moment = require('moment');
const archiver = require('archiver');
const {resolve} = require('path');
const absolutePath = resolve('');
var fs = require("fs");
module.exports = {
    get_tds: async function (req, resp, next) {
        try{
            var companyData = await Company.findOne({'corporate_id':req.authData.corporate_id});
            if(!companyData){
                return resp.status(200).json({ 'status': "error", 'message': 'Company not found.'});
            }
            if(req.body.tds_template_id){
                var existData = await TdsTemplate.findOne({"_id":mongoose.Types.ObjectId(req.body.tds_template_id)});
            }
            else{
                var existData = await TdsTemplate.findOne({company_id:companyData._id});
            }
            if(existData){
                return resp.status(200).send({ status: 'success',message:"fetched successfully", data: existData });
            }
            else{
                return resp.status(200).send({ status: 'success',message:"fetched successfully", data:{} });
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    add_data: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
                define_deductions_rebate_status: 'in:old_regime,new_regime',
                define_standard_deduction: 'required',
                template_name: 'required',
                // standard_deduction_for_the_fy: 'required',
                standard_deduction_amount: 'required',
                define_rebate: 'required',
                eligibility_for_rebate_is_taxable_value: 'required',
                eligibility_for_rebate_is_taxable_amount: 'required',
                define_hra_deduction_limits: 'required',
                actual_hra_earned_metro: 'required',
                actual_hra_earned_non_metro:'required',
                actual_rent_declared: 'required',
                // define_p_tax_chapter_vi_deduction_limits: 'required',
                deduction_items: 'required',
                // define_standard_deduction_new_regime: 'required',
                // standard_deduction_for_the_fy_new_regime: 'required',
                standard_deduction_amount_new_regime: 'required',
                define_rebate_new_regime: 'required',
                eligibility_for_rebate_is_taxable_value_new_regime: 'required',
                eligibility_for_rebate_is_taxable_amount_new_regime: 'required',
                define_deductions_rebate_financial_year:'required|numeric'
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            var companyData = await Company.findOne({'_id':req.authId});
            if(!companyData){
                return resp.status(200).json({ 'status': "error", 'message': 'Company not found.'});
            }

            var data = {
                corporate_id: companyData.corporate_id,
                company_id: companyData._id,
                template_name: req.body.template_name,
                salary_head_to_earning_head: req.body.salary_head_to_earning_head ?JSON.parse(JSON.stringify(req.body.salary_head_to_earning_head)):'',
                define_deductions_rebate: req.body.define_deductions_rebate ? req.body.define_deductions_rebate : 'no',
                define_deductions_rebate_financial_year: req.body.define_deductions_rebate_financial_year ? req.body.define_deductions_rebate_financial_year : new Date().getFullYear(),
                define_deductions_rebate_status: req.body.define_deductions_rebate_status,
            };
            // if(req.body.define_deductions_rebate_status === 'old_regime'){
                var old_regime = {
                    old_regime: {
                        define_standard_deduction : req.body.define_standard_deduction ? req.body.define_standard_deduction : 'no' ,
                        standard_deduction_for_the_fy : req.body.define_deductions_rebate_financial_year ? req.body.define_deductions_rebate_financial_year : new Date().getFullYear(),
                        standard_deduction_amount : req.body.standard_deduction_amount,
                        define_rebate : req.body.define_rebate?req.body.define_rebate:'no',
                        eligibility_for_rebate_is_taxable_value : req.body.eligibility_for_rebate_is_taxable_value?req.body.eligibility_for_rebate_is_taxable_value:'lower',
                        eligibility_for_rebate_is_taxable_amount : req.body.eligibility_for_rebate_is_taxable_amount,
                        define_hra_deduction_limits : req.body.define_hra_deduction_limits?req.body.define_hra_deduction_limits:'lower',
                        actual_hra_earned_metro : req.body.actual_hra_earned_metro?JSON.parse(JSON.stringify(req.body.actual_hra_earned_metro)):'',
                        actual_hra_earned_non_metro : req.body.actual_hra_earned_non_metro?JSON.parse(JSON.stringify(req.body.actual_hra_earned_non_metro)):'',
                        actual_rent_declared:req.body.actual_rent_declared?JSON.parse(JSON.stringify(req.body.actual_rent_declared)):'',
                        define_p_tax_chapter_vi_deduction_limits: req.body.define_p_tax_chapter_vi_deduction_limits ? req.body.define_p_tax_chapter_vi_deduction_limits : 'no',
                        deduction_items : req.body.deduction_items ?JSON.parse(JSON.stringify(req.body.deduction_items)):'',
                    }
                };
                var data = Object.assign(data, old_regime);
            // }
            // else if(req.body.define_deductions_rebate_status === 'new_regime'){
                var new_regime = {
                    new_regime: {
                        define_standard_deduction_new_regime : req.body.define_standard_deduction_new_regime ? req.body.define_standard_deduction_new_regime : 'no' ,
                        standard_deduction_for_the_fy_new_regime : req.body.define_deductions_rebate_financial_year ? req.body.define_deductions_rebate_financial_year : new Date().getFullYear(),
                        standard_deduction_amount_new_regime : req.body.standard_deduction_amount_new_regime,
                        define_rebate_new_regime : req.body.define_rebate_new_regime?req.body.define_rebate_new_regime:'no',
                        eligibility_for_rebate_is_taxable_value_new_regime : req.body.eligibility_for_rebate_is_taxable_value_new_regime?req.body.eligibility_for_rebate_is_taxable_value_new_regime:'lower',
                        eligibility_for_rebate_is_taxable_amount_new_regime : req.body.eligibility_for_rebate_is_taxable_amount_new_regime,
                    }
                };
                var data = Object.assign(data, new_regime);
            // }

            var exist = await TdsTemplate.findOne({company_id:companyData._id,'define_deductions_rebate_financial_year':req.body.define_deductions_rebate_financial_year});

            if(exist)
            {
                TdsTemplate.updateOne({'_id':exist._id},data,  function (err, tds_template) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success', message:"TDS updated successfully", data: tds_template });

                })
            }
            else{
                TdsTemplate.create(data,  function (err, tds_template) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"TDS created successfully", data: tds_template });
                })
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_tds_list: async function (req, resp, next) {
        try{
            var companyData = await Company.findOne({'corporate_id':req.authData.corporate_id});
            if(!companyData){
                return resp.status(200).json({ 'status': "error", 'message': 'Company not found.'});
            }
            if (req.body.sortbyfield) {
                var sortoption = {};
                sortoption[req.body.sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }

            const options = {
                page: req.body.pageno ? req.body.pageno : 1,
                limit: req.body.perpage ? req.body.perpage : 10,
                sort: sortoption,
            };
            
            var myAggregate = TdsTemplate.aggregate([
            {
                $match: {
                    "company_id": mongoose.Types.ObjectId(companyData._id),
                    "status":"active",
                }
            },
            {
                $project: {
                    _id: 1,
                    old_regime:1,
                    define_deductions_rebate:1,
                    corporate_id:1,
                    company_id:1,
                    salary_head_to_earning_head:1,
                    define_deductions_rebate_financial_year:1,
                    define_deductions_rebate_status:1,
                    new_regime:1,
                    created_at:1,
                    updated_at:1,
                    template_name:1,
                    status:1,
                },
            },
            ]);

            if(req.body.pagination){      
                TdsTemplate.aggregatePaginate(myAggregate,options, async function (err, existData) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    return resp.status(200).json({ status: 'success',message:"fetched successfully", data: existData  });
                })
            }else{
                myAggregate.then((res) =>{
                    return resp.status(200).json({ status: 'success', data: res});
                }).catch((err)=> {
                    if (err) return resp.json({ status: 'error', message: err.message || err || 'Something went wrong' });
                })
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_tds_library_list: async function (req, resp, next) {
        try{
            var companyData = await Company.findOne({'corporate_id':req.authData.corporate_id});
            if(!companyData){
                return resp.status(200).json({ 'status': "error", 'message': 'Company not found.'});
            }
            if (req.body.sortbyfield) {
                var sortoption = {};
                sortoption[req.body.sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            const options = {
                page: req.body.pageno ? req.body.pageno : 1,
                limit: req.body.perpage ? req.body.perpage : 10,
                sort: sortoption,
            };
            
            var myAggregate = TdsTemplate.aggregate([
            {
                $match: {
                    "status":"publish",
                }
            },
            {
                $project: {
                    _id: 1,
                    old_regime:1,
                    define_deductions_rebate:1,
                    corporate_id:1,
                    company_id:1,
                    salary_head_to_earning_head:1,
                    define_deductions_rebate_financial_year:1,
                    define_deductions_rebate_status:1,
                    new_regime:1,
                    created_at:1,
                    updated_at:1,
                    status:1,
                },
            },
            ]);
            TdsTemplate.aggregatePaginate(myAggregate,options, async function (err, existData) {
                if (err) return resp.json({ status: "error", message: err.message });
            
                return resp.status(200).json({ status: 'success',message:"fetched successfully", data: existData  });
            })
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    earning_head_list: async function (req, resp, next){
        try{
            var companyData = await Company.findOne({'corporate_id':req.authData.corporate_id});
            if(!companyData){
                return resp.status(200).json({ 'status': "error", 'message': 'Company not found.'});
            }
            // await EarningTempHead.find({  status:'active' ,"corporate_id":companyData.corporate_id },  function (err, temp_head) {
            await EarningTempHead.find({  status:'active' },  function (err, temp_head) {
                if (!err) 
                {
                    return resp.status(200).send({ status: 'success', message:"", temp_head: temp_head});
                }
            })
            
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    tdsCalculation: async function(req, resp, next){
        try{
            var search_option = {
                $match: { 
                    corporate_id: req.authData.corporate_id,
                    approval_status: {$in:['active','approved']}
                },
            };
            var companyDetailsData = await Company_details.findOne({"company_id":req.authId}, 'preference_settings.financial_year_end');
            var start_month = parseInt(moment(new Date()).format('M'));
            var start_year = parseInt(moment(new Date()).format('YYYY'));
            if(companyDetailsData){
                if(companyDetailsData.preference_settings){
                    if(companyDetailsData.preference_settings.financial_year_end){
                        var start_month = parseInt(moment(companyDetailsData.preference_settings.financial_year_end).format('M'));
                        var start_year = parseInt(moment(companyDetailsData.preference_settings.financial_year_end).format('YYYY'));
                    }
                }
            }
            
            var end_month = parseInt(moment(new Date()).format('M'));
            var end_year = parseInt(moment(new Date()).format('YYYY'));

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
            if(req.body.is_final_process && req.body.employee_id){
                search_option.$match._id = mongoose.Types.ObjectId(req.body.employee_id)
            }else{
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
            var income_search_option = {
                $match: { corporate_id: req.authData.corporate_id },
            };
            var incometaxrule = await Incometaxrule.aggregate([income_search_option,
            {
                $lookup: {
                    from: "income_tax_categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "income_tax_categories",
                },
            },
            {
                $addFields: {
                    income_tax_categories: {
                        $arrayElemAt: ["$income_tax_categories", 0],
                    },
                },
            },
            ]);
            // return false;
            var empolyeeData = Employee.aggregate([search_option,
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
                    from: "companies",
                    localField: "corporate_id",
                    foreignField: "corporate_id",
                    as: "companies",
                },
            },
            {
                $lookup: {
                    from: "company_details",
                    localField: "companies._id",
                    foreignField: "company_id",
                    as: "company_details",
                },
            },
            {
                $lookup: {
                    from: "tds_templates",
                    "let": { "emp_id_var": "$corporate_id"},
                    pipeline: [
                    {
                        $match: {
                            $and: [
                               { $expr: { $eq: ["$corporate_id", "$$emp_id_var"] } },
                               {'define_deductions_rebate_financial_year': {$eq: new Date().getFullYear().toString() }}
                            ],
                        },
                    },
                    ],
                    as: "tds_templates",
                },
            },
            {
                $lookup: {
                    from: "declarations",
                    "let": { "emp_id_var": "$_id"},
                    pipeline: [
                    {
                        $match: {
                            "$expr": { "$eq": ["$employee_id", "$$emp_id_var"] },
                            $and: [
                                {"status":{$eq:"active"}},
                                {"rental_financial_year":{$eq:new Date().getFullYear().toString()}}
                            ],
                        },
                    },
                    ],
                    as: "declarations",
                },
            },
            {
                $lookup: {
                    from: "employee_monthly_reports",
                    "let": { "emp_id_var": "$_id"},
                    pipeline: [
                    {
                        $match: {
                            "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                            $and: [
                            {"salary_report" :{ $exists: true, $ne: null }},
                            {$or:[ 
                                {'wage_year': {$gt: start_year }}, 
                                { $and:[
                                    {'wage_year': {$gte: start_year }},
                                    {'wage_month': {$gte: start_month }}
                                    ]
                                } 
                                ]
                            },
                            { $or:[ 
                                {'wage_year': {$lt: end_year }}, 
                                { $and:[
                                    {'wage_year': {$lte: end_year }},
                                    {'wage_month': {$lte: end_month }}
                                    ]
                                } 
                                ]
                            }
                            ],
                        },
                    },
                    ],
                    as: "employee_monthly_reports",
                },
            },
            {
                $addFields: {
                    employee_details: {
                        $arrayElemAt: ["$employee_details", 0],
                    },
                    declarations: {
                        $arrayElemAt: ["$declarations", 0],
                    },
                    companies: {
                        $arrayElemAt: ["$companies", 0],
                    },
                    company_details: {
                        $arrayElemAt: ["$company_details", 0],
                    },
                    tds_templates: {
                        $arrayElemAt: ["$tds_templates", 0],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    corporate_id: 1,
                    // "companies.corporate_id": 1,
                    userid: 1,
                    emp_id: 1,
                    sex:1,
                    emp_dob: 1,
                    emp_first_name: 1,
                    emp_last_name: 1,
                    emp_father_name: 1,
                    emp_dob: 1,
                    client:1,
                    hod:1,
                    company_details:1,
                    companies:1,
                    declarations:1,
                    employee_details:1,
                    employee_monthly_reports:1,
                    tds_templates:1,
                },
            }
            ]).then(async (employees) => {
                await Promise.all(employees.map(async (empdata) => {
                    console.log("empdata==>", empdata)
                    // for declarations part
                    var declarations = empdata.declarations;
                    var tds_templates = empdata.tds_templates;
                    var totalHeadAmount = 0;
                    var totalTdsWagesAmount = 0;
                    var any_other_allowance = 0;
                    var totalPTAmount = 0;
                    var totalCalculatedHeadData = [];
                    var totalMonthlyReportHeadData = [];
                    var totalMonthlyReportHeadDataUnique = [];
                    var tdsTemplateTaxHeadDataUnique = [];
                    var ageDifMs = Date.now() - empdata.emp_dob.getTime();
                    var ageDate = new Date(ageDifMs);
                    var employeeEge = Math.abs(ageDate.getUTCFullYear() - 1970);
                    var standard_deduction_amount = 0;
                    // for earning hade part monthly reports
                    // console.log(empdata.employee_monthly_reports);
                    if(empdata.employee_monthly_reports){
                        if(empdata.employee_monthly_reports.length > 0){
                            empdata.employee_monthly_reports.map(function(monthly_report){
                                if(monthly_report.salary_report){
                                    monthly_report.salary_report.heads.map(function(monthly_report_heads){
                                        if(empdata.employee_details.template_data){
                                            if(empdata.employee_details.template_data.salary_temp_data){
                                                if(empdata.employee_details.template_data.salary_temp_data.earnings){
                                                    var ex_head = empdata.employee_details.template_data.salary_temp_data.earnings.find(head_text => mongoose.Types.ObjectId(head_text.head_id).equals(mongoose.Types.ObjectId(monthly_report_heads.head_id)));
                                                    if(ex_head){
                                                        if(ex_head.head_include_in.includes("TDS")){
                                                            totalMonthlyReportHeadData.push(monthly_report_heads);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    })
                                }
                                // if(monthly_report.total_data){
                                //     totalTdsWagesAmount += monthly_report.total_data.total_tds_wages;
                                //     totalPTAmount += monthly_report.total_data.total_pt_amount;
                                // }
                                if(monthly_report?.salary_report?.total_tds_wages){
                                    totalTdsWagesAmount += monthly_report?.salary_report?.total_tds_wages;
                                    totalPTAmount += monthly_report?.salary_report?.pt_amount;
                                }
                            });
                        }
                    }
                    var holder_d = {};
                    totalMonthlyReportHeadData.forEach(function(d) {
                        if (holder_d.hasOwnProperty(d.head_id)) {
                            holder_d[d.head_id] = holder_d[d.head_id] + d.amount;
                        } else {
                            holder_d[d.head_id] = d.amount;
                        }
                    });
                    for (var prop in holder_d) {    
                        totalMonthlyReportHeadDataUnique.push({ head_id: prop, amount: holder_d[prop]});
                    }

                    // for earning hade part tds templates

                    if(totalMonthlyReportHeadDataUnique.length > 0){
                        if(tds_templates){
                            if(tds_templates.salary_head_to_earning_head){
                                var calculatedHead = tds_templates.salary_head_to_earning_head.map(function(templates_heads){
                                   var tempHead =  totalMonthlyReportHeadDataUnique.find(head_text => mongoose.Types.ObjectId(head_text.head_id).equals(mongoose.Types.ObjectId(templates_heads.salary_head)));
                                    if(tempHead){
                                        var templates_heads = Object.assign(templates_heads, {
                                            'amount':tempHead.amount
                                        });
                                        totalHeadAmount += parseFloat(tempHead.amount);
                                    }
                                    else{
                                        var templates_heads = Object.assign(templates_heads, {
                                            'amount':0
                                        });
                                    }
                                    totalCalculatedHeadData.push(templates_heads);
                                });
                            }
                        }
                    }
                    var holder_d = {};
                    // console.log(totalCalculatedHeadData, "totalCalculationHeadData")
                    totalCalculatedHeadData.forEach(function(d) {
                        let head_id = d.tax_earning_head ?? d._id.toString()
                        if (holder_d.hasOwnProperty(head_id)) {
                            holder_d[head_id] = holder_d[head_id] + d.amount;
                        } else {
                            holder_d[head_id] = d.amount;
                        }
                    });
                    for (var prop in holder_d) {
                        var earningTempHeadDetails = await EarningTempHead.findOne({_id:mongoose.Types.ObjectId(prop)});
                        
                        tdsTemplateTaxHeadDataUnique.push({ head_id: prop,full_name:earningTempHeadDetails?.full_name, abbreviation:earningTempHeadDetails?.abbreviation,head_type:earningTempHeadDetails?.head_type, amount: holder_d[prop]});
                    }
                    var tempHead =  tdsTemplateTaxHeadDataUnique.find((value) => value.abbreviation === 'basic' ||  value.abbreviation === 'Basic');
                    var tempHraHead =  tdsTemplateTaxHeadDataUnique.find((value) => value.abbreviation === 'HRA' ||  value.abbreviation === 'hra'); 
                    if(tempHead && tempHraHead){
                        any_other_allowance = totalTdsWagesAmount - (tempHead.amount + tempHraHead.amount);
                    }
                    else if(tempHead && !tempHraHead){
                        any_other_allowance = totalTdsWagesAmount - tempHead.amount;
                    }
                    else if(!tempHead && tempHraHead){
                        any_other_allowance = totalTdsWagesAmount - tempHraHead.amount;
                    }
                    else{
                        any_other_allowance = totalTdsWagesAmount;
                    }
                    var declaration_rental_amount = 0;
                    var metroNonmetroBasicAmount = 0;
                    var actualMotroNonmetroAmount = 0;
                    var declaration_hra_rental_amount_deduct = 0;
                    if(declarations){
                        if(declarations.rental_amount){
                            declaration_rental_amount = declarations.rental_amount;
                        }
                        if(declarations.applicable_for == 'old_regime'){
                            if(tds_templates && tempHead){
                                if(declarations.urbanizaion_type == 'metro'){
                                    if(tds_templates.old_regime.actual_hra_earned_metro){
                                        if(tds_templates.old_regime.actual_hra_earned_metro.percentage){
                                            metroNonmetroBasicAmount = tempHead.amount * parseFloat(tds_templates.old_regime.actual_hra_earned_metro.percentage) / 100;
                                            if(tds_templates.old_regime.actual_hra_earned_metro.actual_declared_hra_whichever == 'higher'){
                                                if(metroNonmetroBasicAmount > declaration_rental_amount){
                                                    actualMotroNonmetroAmount = metroNonmetroBasicAmount;
                                                }
                                                else{
                                                    actualMotroNonmetroAmount = declaration_rental_amount;
                                                }
                                            }
                                            else{
                                                if(metroNonmetroBasicAmount < declaration_rental_amount){
                                                    actualMotroNonmetroAmount = metroNonmetroBasicAmount;
                                                }
                                                else{
                                                    actualMotroNonmetroAmount = declaration_rental_amount;
                                                }
                                            }
                                        }
                                    }
                                }
                                else{
                                    if(tds_templates.old_regime.actual_hra_earned_non_metro){
                                        if(tds_templates.old_regime.actual_hra_earned_non_metro.percentage){
                                            metroNonmetroBasicAmount = tempHead.amount * parseFloat(tds_templates.old_regime.actual_hra_earned_non_metro.percentage) / 100;
                                            if(tds_templates.old_regime.actual_hra_earned_non_metro.actual_declared_hra_whichever == 'higher'){
                                                if(metroNonmetroBasicAmount > declaration_rental_amount){
                                                    actualMotroNonmetroAmount = metroNonmetroBasicAmount;
                                                }
                                                else{
                                                    actualMotroNonmetroAmount = declaration_rental_amount;
                                                }
                                            }
                                            else{
                                                if(metroNonmetroBasicAmount < declaration_rental_amount){
                                                    actualMotroNonmetroAmount = metroNonmetroBasicAmount;
                                                }
                                                else{
                                                    actualMotroNonmetroAmount = declaration_rental_amount;
                                                }
                                            }
                                        }
                                    }
                                }
                                if(tds_templates.old_regime.actual_rent_declared){
                                    if(tds_templates.old_regime.actual_rent_declared.percentage){
                                        var actual_rent_declared_amount = tempHead.amount * parseFloat(tds_templates.old_regime.actual_rent_declared.percentage) / 100;
                                        actualMotroNonmetroAmount  = parseFloat(actualMotroNonmetroAmount) - actual_rent_declared_amount;
                                    }
                                }
                                if(tds_templates.old_regime.define_hra_deduction_limits){
                                    
                                    if(tempHraHead){
                                        if(tds_templates.old_regime.define_hra_deduction_limits == 'higher'){
                                            if(tempHraHead.amount > actualMotroNonmetroAmount){
                                                declaration_hra_rental_amount_deduct = tempHraHead.amount;
                                            }
                                            else{
                                                declaration_hra_rental_amount_deduct = actualMotroNonmetroAmount;
                                            }
                                        }
                                        else{
                                            if(tempHraHead.amount < actualMotroNonmetroAmount){
                                                declaration_hra_rental_amount_deduct = tempHraHead.amount;
                                            }
                                            else{
                                                declaration_hra_rental_amount_deduct = actualMotroNonmetroAmount;
                                            }
                                        }
                                    }
                                    else{
                                        declaration_hra_rental_amount_deduct = actualMotroNonmetroAmount;
                                    }
                                }
                            }
                        }
                    }
                    
                    empdata.tds_template_wise_monthly_report_head_amount_sum = totalCalculatedHeadData;
                    empdata.tds_template_wise_income_tax_head_amount = tdsTemplateTaxHeadDataUnique;
                    empdata.tds_cal_amount = totalHeadAmount;
                    empdata.total_tds_wages = totalTdsWagesAmount;
                    empdata.total_p_tax_amount = totalPTAmount;
                    var tax_slabable_amount = (totalTdsWagesAmount - totalHeadAmount);
                    
                    var gross_taxable_income = (totalTdsWagesAmount - totalHeadAmount - totalPTAmount);
                    
                    console.log(totalTdsWagesAmount, "total tds wages amount")
                    console.log(totalHeadAmount, "total head amount")
                    console.log(totalPTAmount, "totsl pt amount")
                    console.log(gross_taxable_income, "gross taxable income")
                    // console.log(declarations.deduction_items);
                    var totalDeclarationsAmount = 0;
                    var declarations_deduction_items = [];
                    var emp_declaration_array = [];
                    var used_p_head_total_amount = [];
                    if(declarations){
                        if(declarations.deduction_items){
                            if(declarations.deduction_items.length > 0){
                                await Promise.all(declarations.deduction_items.map(async (e, i) => {
                                    var template_data_dec = tds_templates?.old_regime?.deduction_items ?? [];
                                    // if(){

                                    // }
                                    if(Array.isArray(template_data_dec)){
                                        let temp = template_data_dec?.find((element) => element.head === e.p_head);
                                        if (temp) {
                                            var temp_sub_head = temp.sub_heads;
                                            var max_amount_p_head = parseFloat(temp.amount);
                                            var maxadjustPHeadAmount = 0;
                                            var max_p_head_update_adjust_amount = 0;
                                            await Promise.all(temp_sub_head.map(async (s_head, ii) => {
                                                if (s_head.head == e.head) {
                                                    // console.log('ddddd', s_head, e.child);
                                                    var maxAmount = parseFloat(s_head.amount);
                                                    var maxadjustAmount = 0;
                                                    var updateadjustAmount = 0;
                                                    var check_array = [];
                                                    var final_check_array = [];
                                                    var dec_heads = e.child;
                                                    await Promise.all(dec_heads.map(async (dec_head, iii) => {
                                                        if(s_head.type == 'limit'){
                                                            maxadjustAmount += parseFloat(dec_head.amount);
                                                            if(maxadjustAmount <= maxAmount){
                                                                check_array.push({
                                                                   'label' : dec_head.label,
                                                                   'amount' : parseFloat(dec_head.amount),
                                                                   'declaration_amount': parseFloat(dec_head.amount),
                                                                });
                                                                updateadjustAmount += parseFloat(dec_head.amount);
                                                            }
                                                            else{
                                                                var nextUpamount = 0;
                                                                if(updateadjustAmount <=  maxAmount){
                                                                    nextUpamount = parseFloat(maxAmount) - updateadjustAmount;
                                                                }
                                                                check_array.push({
                                                                    'label' : dec_head.label,
                                                                    'amount': parseFloat(nextUpamount),
                                                                    'declaration_amount': parseFloat(dec_head.amount),
                                                                });
                                                                updateadjustAmount += parseFloat(nextUpamount);
                                                            }
                                                        }
                                                        else if(s_head.type == 'no_limit'){
                                                            check_array.push({
                                                                'label' : dec_head.label,
                                                                'amount': parseFloat(dec_head.amount),
                                                                'declaration_amount': (dec_head.amount),
                                                            });
                                                        }
                                                    }));
                                                    // console.log(check_array);
                                                    if(check_array.length > 0){
                                                        await Promise.all(check_array.map(async (check_heads, iiii) => {
                                                            if(temp.type == 'limit'){
                                                                var holder_d = {};
                                                                used_p_head_total_amount.forEach(function(d) {
                                                                    if (holder_d.hasOwnProperty(d.p_head)) {
                                                                        holder_d[d.p_head] = holder_d[d.p_head] + d.amount;
                                                                    } else {
                                                                        holder_d[d.p_head] = d.amount;
                                                                    }
                                                                });
                                                                var minusData = 0;
                                                                for (var prop in holder_d) {
                                                                    if(temp.head === prop){
                                                                        minusData = parseFloat(holder_d[prop]);
                                                                    }
                                                                }
                                                                if(maxadjustPHeadAmount == 0){
                                                                    maxadjustPHeadAmount += minusData;
                                                                }
                                                                maxadjustPHeadAmount += parseFloat(check_heads.amount);
                                                                
                                                                if(maxadjustPHeadAmount <= max_amount_p_head){
                                                                    final_check_array.push({
                                                                       'label' : check_heads.label,
                                                                       'amount' : parseFloat(check_heads.amount),
                                                                       'declaration_amount': parseFloat(check_heads.declaration_amount),
                                                                    });
                                                                    max_p_head_update_adjust_amount += parseFloat(check_heads.amount);
                                                                    used_p_head_total_amount.push({
                                                                        'p_head' : temp.head,
                                                                        'amount' : parseFloat(check_heads.amount)
                                                                    });
                                                                }
                                                                else{
                                                                    var nextUpamount = 0;
                                                                    if(minusData <=  max_amount_p_head){
                                                                        nextUpamount = parseFloat(max_amount_p_head) - minusData;
                                                                        if(nextUpamount >= parseFloat(check_heads.amount)){
                                                                            nextUpamount = parseFloat(check_heads.amount);
                                                                        }
                                                                    }
                                                                    final_check_array.push({
                                                                        'label' : check_heads.label,
                                                                        'amount': parseFloat(nextUpamount),
                                                                        'declaration_amount': parseFloat(check_heads.declaration_amount),
                                                                    });
                                                                    max_p_head_update_adjust_amount += parseFloat(nextUpamount);
                                                                    used_p_head_total_amount.push({
                                                                        'p_head' : temp.head,
                                                                        'amount' : parseFloat(nextUpamount)
                                                                    });
                                                                }
                                                            }
                                                            else if(temp.type == 'no_limit'){
                                                                final_check_array.push({
                                                                    'label' : check_heads.label,
                                                                    'amount': parseFloat(check_heads.amount),
                                                                    'declaration_amount': (check_heads.declaration_amount),
                                                                });
                                                                max_p_head_update_adjust_amount += parseFloat(nextUpamount);
                                                            }
                                                        }));
                                                    }
                                                }
                                                // s_head.child = check_array;
                                                s_head.total_amount = max_p_head_update_adjust_amount;
                                                s_head.child = final_check_array;
                                                totalDeclarationsAmount += max_p_head_update_adjust_amount;
                                            }));
                                            declarations_deduction_items = template_data_dec;
                                            // empdata.template_data_dec = template_data_dec;
                                        }
                                    }
                                }));
                            }
                        }
                    }
                   
                   
                    if(tds_templates){
                        if(declarations){
                            if(declarations.applicable_for == 'old_regime'){
                                if(tds_templates.old_regime.define_standard_deduction == 'yes'){
                                    gross_taxable_income = gross_taxable_income - parseFloat(tds_templates.old_regime.standard_deduction_amount);
                                    standard_deduction_amount = parseFloat(tds_templates.old_regime.standard_deduction_amount);
                                }
                                gross_taxable_income = (gross_taxable_income - totalDeclarationsAmount);
                                console.log(gross_taxable_income, "gross taxable income")
                                console.log(totalDeclarationsAmount, "total declartion amount")
                                console.log(standard_deduction_amount, "standard deduction amount")
                            }
                            else{
                                if(tds_templates.new_regime.define_standard_deduction_new_regime == 'yes'){
                                    gross_taxable_income = gross_taxable_income - parseFloat(tds_templates.new_regime.standard_deduction_amount_new_regime);
                                    standard_deduction_amount = parseFloat(tds_templates.new_regime.standard_deduction_amount_new_regime);
                                }
                            }
                        }
                    }
                    empdata.standard_deduction_amount = standard_deduction_amount;
                    empdata.total_declaration_amont = totalDeclarationsAmount;
                    
                    
                    // empdata.tax_slabable_amount = tax_slabable_amount;
                    var tax_slab_amount = 0;
                    var tax_slab = '';
                    var tax_amount = 0;
                    var rebate_amount = 0;
                    // empdata.incometaxrule = incometaxrule;
                    empdata.employeeEge = employeeEge;
                    if(incometaxrule.length > 0){
                        incometaxrule.map(function (income_tax){
                            if(income_tax.income_tax_categories && income_tax.financial_year_from == new Date().getFullYear() -1 && income_tax.financial_year_to == new Date().getFullYear()){
                                if(income_tax.income_tax_categories.age_upper_limit >= employeeEge.toString() &&  income_tax.income_tax_categories.age_lower_limit <= employeeEge.toString()  && income_tax.income_tax_categories.gender == empdata.sex){
                                    if(income_tax.income_tax_slab){
                                        income_tax.income_tax_slab.map(function (income_tax_slab){
                                            if(gross_taxable_income >= income_tax_slab.income_slab_from && gross_taxable_income <= income_tax_slab.income_slab_to ){
                                                tax_slab_amount = tax_amount = gross_taxable_income * income_tax_slab.tax_rate / 100;
                                                tax_slab_amount = tax_slab_amount + income_tax_slab.additional_charge + income_tax_slab.additional_cess;
                                                tax_slab = income_tax_slab;
                                                rebate_amount = tax_slab_amount;
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                    empdata.tax_slab_amount = tax_slab_amount;
                    empdata.tax_slab = tax_slab;
                    var rebate_status = 'no';
                    var income_from_other_sources_amount = 0;
                    if(declarations){
                        if(tds_templates){
                            if(declarations.applicable_for == 'old_regime'){
                                if(tds_templates.old_regime.define_rebate == 'yes'){
                                    if(tds_templates.old_regime.eligibility_for_rebate_is_taxable_value == 'higher'){
                                        if(tax_slab_amount >= parseFloat(tds_templates.old_regime.eligibility_for_rebate_is_taxable_amount)){
                                            rebate_status = 'yes';
                                        }
                                        else{
                                            rebate_status = 'no';
                                        }
                                    }
                                    else{
                                        if(tax_slab_amount <= parseFloat(tds_templates.old_regime.eligibility_for_rebate_is_taxable_amount)){
                                            rebate_status = 'no';
                                        }
                                        else{
                                            rebate_status = 'yes';
                                        }
                                    }
                                }
                                if(declarations.other_income_u_s_two_b){
                                    income_from_other_sources_amount = declarations.other_income_u_s_two_b.amount ? declarations.other_income_u_s_two_b.amount : 0;
                                }
                                gross_taxable_income = gross_taxable_income - income_from_other_sources_amount;
                            }
                            else{
                                if(tds_templates.new_regime.define_rebate_new_regime == 'yes'){
                                    if(tds_templates.new_regime.eligibility_for_rebate_is_taxable_value_new_regime == 'higher'){
                                        if(tax_slab_amount >= parseFloat(tds_templates.new_regime.eligibility_for_rebate_is_taxable_amount_new_regime)){
                                            rebate_status = 'yes';
                                        }
                                        else{
                                            rebate_status = 'no';
                                        }
                                    }
                                    else{
                                        if(tax_slab_amount <= parseFloat(tds_templates.new_regime.eligibility_for_rebate_is_taxable_amount_new_regime)){
                                            rebate_status = 'no';
                                        }
                                        else{
                                            rebate_status = 'yes';
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    if(rebate_status == 'no'){
                        gross_taxable_income = (gross_taxable_income + tax_slab_amount);
                    }
                    var financial_date = new Date(); 
                    if(empdata.employee_details){
                        if(empdata.employee_details.employment_hr_details){
                            if(empdata.employee_details.employment_hr_details){
                                var financial_date = new Date(empdata.employee_details.employment_hr_details.date_of_join);
                                if(empdata.company_details.preference_settings.financial_year_end){
                                    var financial_date = new Date(empdata.company_details.preference_settings.financial_year_end);  
                                }
                            }
                        }
                    }
                    empdata.gross_taxable_income = gross_taxable_income;
                    var runStep =0;
                    var previousTaxAmount = 0;
                    var is_tds = 0;
                    var currentmonthyear = moment(new Date()).format('M-YYYY');
                    if(empdata.employee_details){
                        if(empdata.employee_details.template_data){
                            if(empdata.employee_details.template_data.tds_temp_data){
                                if(empdata.employee_details.template_data.tds_temp_data.frequency == 'yearly'){
                                    var quaterYearly = empdata?.company_details?.preference_settings?.quater?.yearly;
                                    if(quaterYearly){
                                        if(quaterYearly.length > 0){
                                            if(quaterYearly[0].to_date || quaterYearly[1].to_date  == currentmonthyear){
                                                runStep= 1
                                            }
                                            
                                        }
                                    }
                                }
                                else if(empdata.employee_details.template_data.tds_temp_data.frequency == 'quaterly'){
                                    var quaterYearly = empdata?.company_details?.preference_settings?.quater?.quaterly;
                                    if(quaterYearly){
                                        const findMonthDataToCompany = quaterYearly.find((element) => element.to_date == currentmonthyear);
                                        if(findMonthDataToCompany){
                                            var previousQuater = (findMonthDataToCompany.quater - 1);
                                            const prefindMonthDataToCompany = quaterYearly.find((element) => element.quater == previousQuater);
                                            if(prefindMonthDataToCompany){
                                                if(prefindMonthDataToCompany.to_date){
                                                    const search = '-'; 
                                                    const replacer = new RegExp(search, 'g');
                                                    var prefindMonth = prefindMonthDataToCompany.to_date.replace(replacer, ',');
                                                    var prefindMontharray = JSON.parse("[" + prefindMonth + "]");
                                                    if(prefindMontharray){
                                                        if(prefindMontharray.length > 1){
                                                            var preEmployeeTdsCalculation = await EmployeeTdsCalculation.findOne({'employee_id':empdata._id,frequency:'quaterly',wage_month:prefindMontharray[0],wage_year: prefindMontharray[1]} , 'taxable_amount');
                                                            
                                                            if(preEmployeeTdsCalculation){
                                                                previousTaxAmount = preEmployeeTdsCalculation.taxable_amount;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            runStep = 1;
                                        }
                                    }
                                }
                                else if(empdata.employee_details.template_data.tds_temp_data.frequency == 'half_yearly'){
                                    var quaterYearly = empdata?.company_details?.preference_settings?.quater?.half_yearly;
                                    if(quaterYearly){
                                        const findMonthDataToCompany = quaterYearly.find((element) => element.to_date == currentmonthyear);
                                        if(findMonthDataToCompany){
                                            var previousQuater = (findMonthDataToCompany.quater - 1);
                                            const prefindMonthDataToCompany = quaterYearly.find((element) => element.quater == previousQuater);
                                            if(prefindMonthDataToCompany){
                                                if(prefindMonthDataToCompany.to_date){
                                                    const search = '-'; 
                                                    const replacer = new RegExp(search, 'g');
                                                    var prefindMonth = prefindMonthDataToCompany.to_date.replace(replacer, ',');
                                                    var prefindMontharray = JSON.parse("[" + prefindMonth + "]");
                                                    if(prefindMontharray){
                                                        if(prefindMontharray.length > 1){
                                                            var preEmployeeTdsCalculation = await EmployeeTdsCalculation.findOne({'employee_id':empdata._id,frequency:'half_yearly',wage_month:prefindMontharray[0],wage_year: prefindMontharray[1]} , 'taxable_amount');
                                                            if(preEmployeeTdsCalculation){
                                                                previousTaxAmount = preEmployeeTdsCalculation.taxable_amount;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            runStep = 1;
                                        }
                                    }
                                }
                                else if(empdata.employee_details.template_data.tds_temp_data.frequency == 'monthly'){
                                    var preEmployeeTdsCalculation = await EmployeeTdsCalculation.findOne({'employee_id':empdata._id,frequency:'monthly',wage_month:(moment(new Date()).format('M') - 1),wage_year: moment(new Date()).format('YYYY')} , 'taxable_amount');
                                    if(preEmployeeTdsCalculation){
                                        previousTaxAmount = preEmployeeTdsCalculation.taxable_amount;
                                    }
                                    runStep = 1;
                                }
                                if(empdata.employee_details.template_data.tds_temp_data.application_methode == 'NA'){
                                   runStep = 0;
                                }
                                is_tds = 1;
                            }
                        }
                    }
                    var inupdocument = {
                        corporate_id: req.authData.corporate_id,
                        employee_id : mongoose.Types.ObjectId(empdata._id),
                        head_details: [],
                        any_other_allowance :0,
                        house_rent_allowance :0,
                        income_from_other_sources_amount : 0,
                        tax_slab_details : null,
                        tax_rate : 0,
                        tax_amount : 0,
                        rebate_status : 'no',
                        additional_charge : 0,
                        additional_cess  : 0,
                        declaration_details: declarations_deduction_items,
                        temp_allowance_amount : 0,
                        total_tds_wages : 0,
                        total_p_tax_amount : 0,
                        standard_deduction_amount : 0,
                        total_declaration_amount : 0,
                        tax_slab_amount : 0,
                        rebate_amount :0,
                        payable_tax_amount : 0,
                        taxable_amount : 0,
                        pre_taxable_amount : 0,
                        wage_month: moment(new Date()).format('M'),
                        wage_year: moment(new Date()).format('YYYY'),
                        frequency: empdata?.employee_details?.template_data?.tds_temp_data?.frequency,
                        updated_at: new Date()
                    };
                    console.log(runStep , "runstep")
                    if(runStep == 1){
                        gross_taxable_income = (gross_taxable_income - previousTaxAmount);
                        console.log(gross_taxable_income, "gross taxable income final")
                        if(gross_taxable_income < 0){
                            gross_taxable_income = 0;
                        }
                        inupdocument = {
                            corporate_id: req.authData.corporate_id,
                            employee_id : mongoose.Types.ObjectId(empdata._id),
                            head_details: tdsTemplateTaxHeadDataUnique,
                            any_other_allowance :any_other_allowance,
                            house_rent_allowance :declaration_hra_rental_amount_deduct,
                            income_from_other_sources_amount : income_from_other_sources_amount,
                            tax_slab_details : tax_slab,
                            tax_rate : tax_slab ? tax_slab.tax_rate : 0,
                            tax_amount : tax_amount,
                            rebate_status : rebate_status,
                            additional_charge : tax_slab ? tax_slab.additional_charge : 0,
                            additional_cess  : tax_slab ? tax_slab.additional_cess : 0,
                            declaration_details: declarations_deduction_items,
                            temp_allowance_amount : totalHeadAmount ? totalHeadAmount : 0,
                            total_tds_wages : totalTdsWagesAmount ? totalTdsWagesAmount : 0,
                            total_p_tax_amount : totalPTAmount ? totalPTAmount : 0,
                            standard_deduction_amount : standard_deduction_amount ? standard_deduction_amount : 0,
                            total_declaration_amount : totalDeclarationsAmount ? totalDeclarationsAmount :0,
                            tax_slab_amount : tax_slab_amount ? tax_slab_amount : 0,
                            rebate_amount :rebate_amount ? rebate_amount : 0,
                            payable_tax_amount : rebate_status == 'no' ? rebate_amount ? rebate_amount : 0  : 0,
                            taxable_amount : gross_taxable_income ? gross_taxable_income : 0,
                            pre_taxable_amount : previousTaxAmount ? previousTaxAmount : 0,
                            wage_month: moment(new Date()).format('M'),
                            wage_year: moment(new Date()).format('YYYY'),
                            frequency: empdata?.employee_details?.template_data?.tds_temp_data?.frequency,
                            updated_at:new Date()
                        };
                    }
                    if(is_tds == 1){
                        var existTdsCalData = await EmployeeTdsCalculation.findOne({'employee_id':empdata._id ,'frequency':empdata.employee_details.template_data.tds_temp_data.frequency, 'wage_month': moment(new Date()).format('M'),'wage_year': moment(new Date()).format('YYYY')});
                        if(existTdsCalData){
                            await EmployeeTdsCalculation.updateOne({'_id':existTdsCalData._id},{ $set: inupdocument });
                        }
                        else{
                            await EmployeeTdsCalculation.create(inupdocument);
                        }
                    }

                })).then((value) => {
                    if(req.body.is_final_process){
                        next()
                    }else{
                        return resp.status(200).json({ status: "success", message: 'Sheet generated successfully.' });
                    }
                    // return resp.status(200).json({ status: "success", employees: employees });
                });
            }); 
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    tds_custom_report: async function(req, resp, next){
        try{
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
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);

            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authData.user_id] } },
                    { approval_status: { $in: ['active','approved'] } },
                    ],
                },
            };

            var filter_option = {};
            
            var search_option_details = { $match: {} };
            if (req.body.searchkey) {
                search_option = {
                    $match: {
                        $text: { $search: req.body.searchkey },
                        corporate_id: req.authData.corporate_id,
                    },
                };
            }
            else{
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
                if (req.body.emp_id) {
                    search_option.$match.emp_id = {
                        $regex: req.body.emp_id,
                        $options: "i",
                    };
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
            var tds_act = await TdsAct.findOne();
            
            search_option_details.$match['employee_tds_calculations']=  {$exists: true , $ne: []} ;
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
                    $lookup:{
                        from: 'employee_tds_calculations',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": {
                                $and :[
                                    {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
                                    {$or:[ 
                                            {'wage_year': {$gt: start_year }}, 
                                            { $and:[
                                                {'wage_year': {$gte: start_year }},
                                                {'wage_month': {$gte: start_month }}
                                                ]
                                            } 
                                        ]
                                    },
                                    { $or:[ 
                                            {'wage_year': {$lt: end_year }}, 
                                            { $and:[
                                                {'wage_year': {$lte: end_year }},
                                                {'wage_month': {$lte: end_month }}
                                                ]
                                            } 
                                        ]
                                    }
                                ] 
                            } 
                        }],
                        as: 'employee_tds_calculations',
                    }
                },
                {
                    $lookup: {
                        from: "employee_monthly_reports",
                        "let": { "emp_id_var": "$_id"},
                        pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                $and: [
                                {"salary_report" :{ $exists: true, $ne: null }},
                                {$or:[ 
                                    {'wage_year': {$gt: start_year }}, 
                                    { $and:[
                                        {'wage_year': {$gte: start_year }},
                                        {'wage_month': {$gte: start_month }}
                                        ]
                                    } 
                                    ]
                                },
                                { $or:[ 
                                    {'wage_year': {$lt: end_year }}, 
                                    { $and:[
                                        {'wage_year': {$lte: end_year }},
                                        {'wage_month': {$lte: end_month }}
                                        ]
                                    } 
                                    ]
                                }
                                ],
                            },
                        },
                        ],
                        as: "employee_monthly_reports",
                    },
                },
                // {
                //     $lookup: {
                //         from: "declarations",
                //         "let": { "emp_id_var": "$_id"},
                //         pipeline: [
                //         {
                //             $match: {
                //                 "$expr": { "$eq": ["$employee_id", "$$emp_id_var"] },
                //                 $and: [
                //                     {"status":{$eq:"active"}},
                //                     {"rental_financial_year":{$eq:new Date().getFullYear().toString()}}
                //                 ],
                //             },
                //         },
                //         ],
                //         as: "declarations",
                //     },
                // },
                search_option_details,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        // declarations: {
                        //     $arrayElemAt: ["$declarations", 0],
                        // },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        userid: 1,
                        emp_id: 1,
                        pan_no: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        client_code: 1,
                        created_at: 1,
                        is_hod: 1,
                        status: 1,
                        approval_status: 1,
                        // declarations:1,
                        employee_tds_calculations:1,
                    },
                },
            ]).then(async (employees)=>{
                if(req.body.generate == 'excel'){
                    var field_list_array=["emp_id","name","pan_no","basic_pay","house_rent_allowance","any_other_allowance_amount","value_of_perquisites","profits_in_lieu_of_salary","income_loss_from_house_property","income_from_other_sources",
                    "income_from_capital_gain","gress_total_income",'standered_deduction_u_s_16_i',"entertainment_allowance_u_s_16_ii","prof_tax_u_s_16_iii","gress_taxable_income"];
                    if(tds_act){
                        tds_act.tds.map(function(tds_act){
                            if(tds_act.child){
                                if(tds_act.child.length > 0){
                                    tds_act.child.map(function(child){
                                        field_list_array.push(child.value);
                                    });
                                }
                            }
                        });
                    }
                    field_list_array.push('total_taxable_income');
                    field_list_array.push('tax_on_total_income');
                    field_list_array.push('rebate_u_s_87a');
                    field_list_array.push('net_tax');
                    field_list_array.push('surcharge_wherever_applicable');
                    field_list_array.push('health_education_cess');
                    field_list_array.push('less_relief_u_s_89');
                    field_list_array.push('tax_payable');
                    field_list_array.push('tds_made');
                    field_list_array.push('balance_tax_payable_refundable');
                    field_list_array.push('is_opted_for_115bac');
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
                        ws.cell(1, clmn_id++).string("Emp Name");
                    }
                    if(field_list_array.includes('pan_no'))
                    {
                        ws.cell(1, clmn_id++).string("PAN NO");
                    }
                    if(field_list_array.includes('basic_pay'))
                    {
                        ws.cell(1, clmn_id++).string("Basic Pay & Dearness Allowance");
                    }
                    if(field_list_array.includes('house_rent_allowance'))
                    {
                        ws.cell(1, clmn_id++).string("House Rent Allowance");
                    }
                    if(field_list_array.includes('any_other_allowance_amount'))
                    {
                        ws.cell(1, clmn_id++).string("Any Other Allowance ");
                    }
                    if(field_list_array.includes('value_of_perquisites'))
                    {
                        ws.cell(1, clmn_id++).string("Value of Perquisites U/S 17(2)");
                    }
                    if(field_list_array.includes('profits_in_lieu_of_salary'))
                    {
                        ws.cell(1, clmn_id++).string("Profits in lieu of Salary U/S 17(3)");
                    }
                    if(field_list_array.includes('income_loss_from_house_property'))
                    {
                        ws.cell(1, clmn_id++).string("Income (or Loss) from House Property");
                    }
                    if(field_list_array.includes('income_from_other_sources'))
                    {
                        ws.cell(1, clmn_id++).string("Income From other Sources");
                    }
                    if(field_list_array.includes('income_from_capital_gain'))
                    {
                        ws.cell(1, clmn_id++).string("Income from Capital Gain");
                    }
                    if(field_list_array.includes('gress_total_income'))
                    {
                        ws.cell(1, clmn_id++).string("GROSS TOTAL INCOME");
                    }
                    if(field_list_array.includes('standered_deduction_u_s_16_i'))
                    {
                        ws.cell(1, clmn_id++).string("Standered Deduction U/S 16(i)(ia)");
                    }
                    if(field_list_array.includes('entertainment_allowance_u_s_16_ii'))
                    {
                        ws.cell(1, clmn_id++).string("Entertainment Allowance U/S 16(ii)");
                    }
                    if(field_list_array.includes('prof_tax_u_s_16_iii'))
                    {
                        ws.cell(1, clmn_id++).string(" Prof. Tax U/S 16(iii)");
                    }
                    if(field_list_array.includes('gress_taxable_income'))
                    {
                        ws.cell(1, clmn_id++).string("GROSS TAXABLE INCOME");
                    }
                    if(tds_act){
                        tds_act.tds.map(function(tds_act){
                            if(tds_act.child){
                                if(tds_act.child.length > 0){
                                    tds_act.child.map(function(child){
                                        ws.cell(1, clmn_id++).string(child.value);
                                    });
                                }
                            }
                        });
                    }
                    if(field_list_array.includes('total_taxable_income'))
                    {
                        ws.cell(1, clmn_id++).string("TOTAL TAXABLE INCOME");
                    }
                    if(field_list_array.includes('tax_on_total_income'))
                    {
                        ws.cell(1, clmn_id++).string("Tax on Total Income");
                    }
                    if(field_list_array.includes('rebate_u_s_87a'))
                    {
                        ws.cell(1, clmn_id++).string("Rebate U/S 87A");
                    }
                    if(field_list_array.includes('net_tax'))
                    {
                        ws.cell(1, clmn_id++).string("NET TAX");
                    }
                    if(field_list_array.includes('surcharge_wherever_applicable'))
                    {
                        ws.cell(1, clmn_id++).string("Surcharge, Wherever applicable");
                    }
                    if(field_list_array.includes('health_education_cess'))
                    {
                        ws.cell(1, clmn_id++).string("Health & Education Cess");
                    }
                    if(field_list_array.includes('less_relief_u_s_89'))
                    {
                        ws.cell(1, clmn_id++).string("Less : Relief U/S 89 ");
                    }
                    if(field_list_array.includes('tax_payable'))
                    {
                        ws.cell(1, clmn_id++).string("TAX PAYABLE");
                    }
                    if(field_list_array.includes('tds_made'))
                    {
                        ws.cell(1, clmn_id++).string("Tds Made");
                    }
                    if(field_list_array.includes('balance_tax_payable_refundable'))
                    {
                        ws.cell(1, clmn_id++).string("BALANCE TAX PAYABLE/REFUNDABLE");
                    }
                    if(field_list_array.includes('is_opted_for_115bac'))
                    {
                        ws.cell(1, clmn_id++).string("IS OPTED FOR 115BAC");
                    }
                }
                if(employees){
                    await Promise.all(employees.map(async function(employee , index){
                        var basic_pay_amount = 0;
                        var house_rent_allowance_amount = 0;
                        var any_other_allowance_amount  = 0;
                        var income_loss_from_house_property  = 0;
                        var total_deduction_amount = 0; 
                        var standered_deduction_amount = 0;
                        var standered_p_tax_amount = 0;
                        var tax_on_total_income = 0;
                        var rebate_u_s_87a = 0;
                        var net_tax = 0;
                        var health_education_cess = 0;
                        var income_from_other_sources_amount = 0;
                        var entertainment_allowance_u_s_16_ii = 0;
                        var tax_payable = 0;
                        var tax_slab_amount = 0;
                        var deduction_u_chapter_vi_a = [];
                        var deduction_u_chapter_vi_a_unique = [];
                        if(employee.employee_tds_calculations){
                            if(employee.employee_tds_calculations.length > 0){
                                await Promise.all(employee.employee_tds_calculations.map(async function(tds_cal){
                                    if(tds_cal.head_details){
                                        if(tds_cal.head_details.length > 0){
                                            tds_cal.head_details.map(async function(tds_head_details){
                                                if(tds_head_details.abbreviation == 'basic' || tds_head_details.abbreviation == 'Basic'){
                                                    basic_pay_amount += parseFloat(tds_head_details.amount);
                                                }
                                                else if(tds_head_details.abbreviation == 'HRA' || tds_head_details.abbreviation == 'hra'){
                                                    house_rent_allowance_amount += parseFloat(tds_head_details.amount);
                                                }
                                                else if(tds_head_details.abbreviation == 'EA' || tds_head_details.abbreviation == 'ea'){
                                                    entertainment_allowance_u_s_16_ii += parseFloat(tds_head_details.amount);
                                                }
                                            });
                                        }
                                    }
                                    standered_deduction_amount += parseFloat(tds_cal.standard_deduction_amount);
                                    standered_p_tax_amount += parseFloat(tds_cal.total_p_tax_amount);
                                    tax_on_total_income += parseFloat(tds_cal.tax_amount);
                                    rebate_u_s_87a += parseFloat(tds_cal.rebate_amount);
                                    net_tax += parseFloat(tds_cal.tax_amount);
                                    tax_slab_amount += parseFloat(tds_cal.tax_slab_amount);
                                    var total_health_edu_amount = 0;
                                    if(tds_cal.additional_charge && tds_cal.additional_charge > 0){
                                        total_health_edu_amount += tds_cal.additional_charge;
                                    }
                                    if(tds_cal.additional_cess && tds_cal.additional_cess > 0){
                                        total_health_edu_amount += tds_cal.additional_cess;
                                    }
                                    health_education_cess += total_health_edu_amount;
                                    tax_payable += parseFloat(tds_cal.payable_tax_amount);
                                    any_other_allowance_amount += tds_cal.any_other_allowance ? parseFloat(tds_cal.any_other_allowance) : 0;
                                    income_from_other_sources_amount +=  tds_cal.income_from_other_sources_amount ? parseFloat(tds_cal.income_from_other_sources_amount) : 0;
                                    if(tds_cal.declaration_details){
                                        if(tds_cal.declaration_details.length > 0){
                                            await Promise.all(tds_cal.declaration_details.map(function (declaration_details){
                                                if(declaration_details.sub_heads){
                                                    if(declaration_details.sub_heads.length > 0){
                                                        declaration_details.sub_heads.map(function(sub_head){
                                                            var total_amount = 0;
                                                            if(parseFloat(sub_head.total_amount) > 0 && sub_head.total_amount != NaN)
                                                            {
                                                                total_amount = sub_head.total_amount;
                                                            }
                                                            else if(parseFloat(sub_head.amount) > 0 && sub_head.amount != NaN){
                                                                total_amount = sub_head.amount;
                                                            }
                                                            deduction_u_chapter_vi_a.push({
                                                                'head': sub_head.head ? sub_head.head : sub_head.value,
                                                                'total_amount': total_amount ? parseFloat(total_amount) : 0
                                                            });
                                                            
                                                        })
                                                    }
                                                }
                                            }));
                                        }
                                    }
                                }));
                            }
                        };
                        var holder_d = {};
                        deduction_u_chapter_vi_a.forEach(function(d) {
                            if (holder_d.hasOwnProperty(d.head)) {
                                holder_d[d.head] = holder_d[d.head] + d.total_amount;
                            } else {
                                holder_d[d.head] = d.total_amount;
                            }
                        });
                        for (var prop in holder_d) {
                            var p_head_data = '';
                            if(tds_act){
                                tds_act.tds.map(function(tds_act){
                                    if(tds_act.child){
                                        if(tds_act.child.length > 0){
                                            var tds_act_data =  tds_act.child.find((element) => element.value == prop);
                                            if(tds_act_data){
                                                p_head_data = tds_act.value;
                                            }
                                        }
                                    }
                                });
                            }
                            deduction_u_chapter_vi_a_unique.push({ head: prop, p_head: p_head_data, amount: holder_d[prop]});
                            total_deduction_amount += parseFloat(holder_d[prop]);
                        }

                        var gress_total_one = (basic_pay_amount + house_rent_allowance_amount + any_other_allowance_amount + income_loss_from_house_property + income_from_other_sources_amount)
                        var gress_total_two = (gress_total_one - standered_deduction_amount - standered_p_tax_amount);
                        if(gress_total_two < 0){
                            gress_total_two = 0;
                        }
                        employee.tds_custom_report = {
                            'basic_pay' : basic_pay_amount,
                            'house_rent_allowance': house_rent_allowance_amount,
                            'any_other_allowance_amount': any_other_allowance_amount,
                            'value_of_perquisites':0,
                            'profits_in_lieu_of_salary':0,
                            'income_loss_from_house_property':income_loss_from_house_property,
                            'income_from_other_sources':income_from_other_sources_amount,
                            'income_from_capital_gain':0,
                            'gress_total_income': gress_total_one,
                            
                            'standered_deduction_u_s_16_i': standered_deduction_amount,
                            'entertainment_allowance_u_s_16_ii': entertainment_allowance_u_s_16_ii,
                            'prof_tax_u_s_16_iii': standered_p_tax_amount,
                            'gress_taxable_income': gress_total_two,

                            'deduction_u_chapter_vi_a' : deduction_u_chapter_vi_a_unique,
                            'total_deduction_amount' : total_deduction_amount,
                            'total_taxable_income' : (gress_total_two - total_deduction_amount),
                            'tax_on_total_income' : tax_on_total_income,
                            'rebate_u_s_87a' : rebate_u_s_87a,
                            'net_tax' : net_tax,
                            'surcharge_wherever_applicable' : '',
                            'health_education_cess' : health_education_cess,
                            'tax_payable' : tax_payable,
                            'tds_made':'',
                            'balance_tax_payable_refundable': tax_payable,
                            'is_opted_for_115bac' :'no'
                        };
                        if(req.body.generate == 'excel'){
                            var index_val = 2;
                            index_val = index_val + index;
                            var clmn_emp_id=1;
                            ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                            if(field_list_array.includes('emp_id'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.emp_id ? String(employee.emp_id) : "");
                            }
                            if(field_list_array.includes('name'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.emp_first_name ? String(employee.emp_first_name+" "+employee.emp_last_name) : "");
                            }
                            if(field_list_array.includes('pan_no'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.pan_no ? String(employee.pan_no) : "");
                            }
                            if(field_list_array.includes('basic_pay'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.basic_pay) : "");
                            }
                            if(field_list_array.includes('house_rent_allowance'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.house_rent_allowance) : "");
                            }
                            if(field_list_array.includes('any_other_allowance_amount'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.any_other_allowance_amount) : "");
                            }
                            if(field_list_array.includes('value_of_perquisites'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.value_of_perquisites) : "");
                            }
                            if(field_list_array.includes('profits_in_lieu_of_salary'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.profits_in_lieu_of_salary) : "");
                            }
                            if(field_list_array.includes('income_loss_from_house_property'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.income_loss_from_house_property) : "");
                            }
                            if(field_list_array.includes('income_from_other_sources'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.income_from_other_sources) : "");
                            }
                            if(field_list_array.includes('income_from_capital_gain'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.income_from_capital_gain) : "");
                            }
                            if(field_list_array.includes('gress_total_income'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.gress_total_income) : "");
                            }
                            if(field_list_array.includes('standered_deduction_u_s_16_i'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.standered_deduction_u_s_16_i) : "");
                            }
                            if(field_list_array.includes('entertainment_allowance_u_s_16_ii'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.entertainment_allowance_u_s_16_ii) : "");
                            }
                            if(field_list_array.includes('prof_tax_u_s_16_iii'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.prof_tax_u_s_16_iii) : "");
                            }
                            if(field_list_array.includes('gress_taxable_income'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.gress_taxable_income) : "");
                            }
                            
                            if(employee.tds_custom_report.deduction_u_chapter_vi_a.length > 0){
                                employee.tds_custom_report.deduction_u_chapter_vi_a.map(function(chapter_vi){
                                    if(field_list_array.includes(chapter_vi.head))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(chapter_vi.amount ? String(chapter_vi.amount) : "0");
                                    }
                                });
                            }
                            else{
                                if(tds_act){
                                    tds_act.tds.map(function(tds_act){
                                        if(tds_act.child){
                                            if(tds_act.child.length > 0){
                                                tds_act.child.map(function(child){
                                                    ws.cell(index_val, clmn_emp_id++).string("0");
                                                });
                                            }
                                        }
                                    });
                                }
                            }
                            if(field_list_array.includes('total_taxable_income'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.total_taxable_income) : "");
                            }
                            if(field_list_array.includes('tax_on_total_income'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.tax_on_total_income) : "");
                            }
                            if(field_list_array.includes('rebate_u_s_87a'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.rebate_u_s_87a) : "");
                            }
                            if(field_list_array.includes('net_tax'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.net_tax) : "");
                            }
                            if(field_list_array.includes('surcharge_wherever_applicable'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.surcharge_wherever_applicable) : "");
                            }
                            if(field_list_array.includes('health_education_cess'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.health_education_cess) : "");
                            }
                            if(field_list_array.includes('less_relief_u_s_89'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string("");
                            }
                            if(field_list_array.includes('tax_payable'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.tax_payable) : "");
                            }
                            if(field_list_array.includes('tds_made'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.tds_made) : "");
                            }
                            if(field_list_array.includes('balance_tax_payable_refundable'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.balance_tax_payable_refundable) : "");
                            }
                            if(field_list_array.includes('is_opted_for_115bac'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(employee.tds_custom_report ? String(employee.tds_custom_report.is_opted_for_115bac) : "");
                            }
                        }
                    })).then(async (emp) => {
                        if(req.body.generate == 'excel'){
                            // wb.write("storage/company/temp_files/"+req.authData.corporate_id+"/tds-custom-report-export.xlsx");
                            // let file_location = Site_helper.createFiles(wb,"tds-custom-report-export",'xlsx', req.authData.corporate_id)
                            let file_name = "tds-custom-report-export.xlsx";
                            let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/tds-module');
                            await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                            // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                            // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                            // return resp.status(200).json({status: "success", message: 'Tds custom Report Generated successfully.', url: baseurl +"tds-custom-report-export.xlsx",});
                        }
                        else{
                            return resp.status(200).json({status: "success", message: 'Tds custom Report Generated successfully.', employees: employees});
                        }
                    });
                }

                    // return resp.status(200).json({ status: "success", data: employees });
                });
           
        }
        catch (e) {
            return resp.status(403).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    tds_form_b_no_16_report: async function(req, resp, next){
        try{
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
            

            var companyDetailsData = await Company_details.findOne({"company_id":req.authId}, 'preference_settings.financial_year_end');
            var full_start_month = parseInt(moment(new Date()).format('M'));
            var full_start_year = parseInt(moment(new Date()).format('YYYY'));
            var full_end_month = parseInt(moment(new Date()).format('M'));
            var full_end_year = parseInt(moment(new Date()).format('YYYY'));
            if(companyDetailsData){
                if(companyDetailsData.preference_settings){
                    if(companyDetailsData.preference_settings.financial_year_end){
                        full_start_month = parseInt(moment(companyDetailsData.preference_settings.financial_year_end).format('M'));
                        full_start_year = parseInt(moment(companyDetailsData.preference_settings.financial_year_end).format('YYYY'));
                        end_date = moment(companyDetailsData.preference_settings.financial_year_end).add(3640, 'd');
                        full_end_month = parseInt(moment(end_date).format('M'));
                        full_end_year = parseInt(moment(end_date).format('YYYY'));
                    }
                }
            }

            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            var from_date = "01-"+ moment(start_month,'M').format('MMM') +"-"+start_year;
            var to_date = moment(end_month, 'M').daysInMonth() +"-"+ moment(end_month, 'M').format('MMM') +"-"+end_year;

            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authData.user_id] } },
                    { approval_status: { $in: ['active','approved'] } },
                    ],
                },
            };

            var filter_option = {};
            
            var search_option_details = { $match: {} };
            if (req.body.searchkey) {
                search_option = {
                    $match: {
                        $text: { $search: req.body.searchkey },
                        corporate_id: req.authData.corporate_id,
                    },
                };
            }
            else{
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
                if (req.body.emp_id) {
                    search_option.$match.emp_id = {
                        $regex: req.body.emp_id,
                        $options: "i",
                    };
                }
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
            var tds_act = await TdsAct.findOne();
            
            search_option_details.$match['employee_tds_calculations']=  {$exists: true , $ne: []} ;
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
                    $lookup:{
                        from: 'employee_tds_calculations',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": {
                                $and :[
                                    {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
                                    {$or:[ 
                                            {'wage_year': {$gt: start_year }}, 
                                            { $and:[
                                                {'wage_year': {$gte: start_year }},
                                                {'wage_month': {$gte: start_month }}
                                                ]
                                            } 
                                        ]
                                    },
                                    { $or:[ 
                                            {'wage_year': {$lt: end_year }}, 
                                            { $and:[
                                                {'wage_year': {$lte: end_year }},
                                                {'wage_month': {$lte: end_month }}
                                                ]
                                            } 
                                        ]
                                    }
                                ] 
                            } 
                        }],
                        as: 'employee_tds_calculations',
                    }
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
                                    {$or:[ 
                                            {'wage_year': {$gt: full_start_year }}, 
                                            { $and:[
                                                {'wage_year': {$gte: full_start_year }},
                                                {'wage_month': {$gte: full_start_month }}
                                                ]
                                            } 
                                        ]
                                    },
                                    { $or:[ 
                                            {'wage_year': {$lt: full_end_year }}, 
                                            { $and:[
                                                {'wage_year': {$lte: full_end_year }},
                                                {'wage_month': {$lte: full_end_month }}
                                                ]
                                            } 
                                        ]
                                    }
                                ] 
                            } 
                        }],
                        as: 'employee_tds_calculations_full_year',
                    }
                },
                {
                    $lookup: {
                        from: "declarations",
                        "let": { "emp_id_var": "$_id"},
                        pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$employee_id", "$$emp_id_var"] },
                                $and: [
                                    {"status":{$eq:"active"}},
                                    {"rental_financial_year":{$eq:new Date().getFullYear().toString()}}
                                ],
                            },
                        },
                        ],
                        as: "declarations",
                    },
                },
                {
                    $lookup: {
                        from: "employee_monthly_reports",
                        "let": { "emp_id_var": "$_id"},
                        pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                $and: [
                                {"total_data" :{ $exists: true, $ne: null }},
                                {$or:[ 
                                    {'wage_year': {$gt: start_year }}, 
                                    { $and:[
                                        {'wage_year': {$gte: start_year }},
                                        {'wage_month': {$gte: start_month - 1  }}
                                        ]
                                    } 
                                    ]
                                },
                                { $or:[ 
                                    {'wage_year': {$lt: end_year }}, 
                                    { $and:[
                                        {'wage_year': {$lte: end_year }},
                                        {'wage_month': {$lte: end_month -1  }}
                                        ]
                                    } 
                                    ]
                                }
                                ],
                            },
                        },
                        ],
                        as: "employee_monthly_reports",
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
                        localField: "companies._id",
                        foreignField: "company_id",
                        as: "company_details",
                    },
                },
                {
                    $lookup: {
                        from: "tds_templates",
                        "let": { "emp_id_var": "$company_id"},
                        pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$companies._id", "$$emp_id_var"] },
                                $and: [
                                    {'status': {$eq: 'active' }},
                                    {'define_deductions_rebate_financial_year': {$eq: new Date().getFullYear().toString() }}
                                ],
                            },
                        },
                        ],
                        as: "tds_templates",
                    },
                },
                search_option_details,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        companies: {
                            $arrayElemAt: ["$companies", 0],
                        },
                        company_details: {
                            $arrayElemAt: ["$company_details", 0],
                        },
                        declarations: {
                            $arrayElemAt: ["$declarations", 0],
                        },
                        tds_templates: {
                            $arrayElemAt: ["$tds_templates", 0],
                        },
                        total_ctc: {
                            $sum : "$employee_monthly_reports.total_data.total_ctc"
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        userid: 1,
                        emp_id: 1,
                        pan_no: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        client_code: 1,
                        created_at: 1,
                        is_hod: 1,
                        status: 1,
                        approval_status: 1,
                        declarations:1,
                        employee_tds_calculations:1,
                        employee_tds_calculations_full_year:1,
                        employee_details:1,
                        companies:1,
                        company_details:1,
                        total_ctc:1,
                        tds_templates:1,
                    },
                },
            ]).then(async (employees)=>{
                var path_array = [];
                await Promise.all(employees.map(async function(employee, index) {
                    var wb = new xl.Workbook();
                    var ws = wb.addWorksheet("Sheet 1");
                    var border = {
                        bottom: {
                            style: 'thin',
                            color: '000000'
                        },
                        right: {
                            style: 'thin',
                            color: '000000'
                        },
                        left: {
                            style: 'thin',
                            color: '000000'
                        },
                        top: {
                          style: 'thin',
                          color: '000000'
                        }
                      };
                    var myStyle = wb.createStyle({
                        // font: {
                        //     bold: true,
                        //     underline: true,
                        // },
                        alignment: {
                            wrapText: true,
                            horizontal: 'center',
                            vertical: 'center',
                        },
                        border:  border
                    });
                    var myStyle2 = wb.createStyle({
                        // font: {
                        //     // bold: true,
                        //     // underline: true,
                        // },
                        alignment: {
                            wrapText: true,
                            horizontal: 'center',
                            vertical: 'center',
                        },
                        border:  border,
                        fill: {
                            type: 'pattern',
                            patternType: 'solid',
                            bgColor: '#808080',
                            fgColor: '#808080',
                        }
                    });
                    var myStyle3 = wb.createStyle({
                        font: {
                            bold: true,
                            // underline: true,
                        },
                        alignment: {
                            wrapText: true,
                            horizontal: 'left',
                            vertical: 'center',
                        },
                        border:  border
                    });
                    var myStyle4 = wb.createStyle({
                        font: {
                            // bold: true,
                            // underline: true,
                        },
                        alignment: {
                            wrapText: true,
                            horizontal: 'right',
                            vertical: 'center',
                        },
                        border:  border
                    });

                    var basic_pay_amount = 0;
                    var house_rent_allowance_amount = 0;
                    var any_other_allowance_amount  = 0;
                    var income_loss_from_house_property  = 0;
                    var total_deduction_amount = 0; 
                    var standered_deduction_amount = 0;
                    var standered_p_tax_amount = 0;
                    var tax_on_total_income = 0;
                    var rebate_u_s_87a = 0;
                    var net_tax = 0;
                    var health_education_cess = 0;
                    var income_from_other_sources_amount = 0;
                    var entertainment_allowance_u_s_16_ii = 0;
                    var tax_payable = 0;
                    var deduction_u_chapter_vi_a = [];
                    var deduction_u_chapter_vi_a_unique = [];
                    var deduction_u_chapter_sub_child_80_C = [];
                    var deduction_u_chapter_sub_child_80_D= [];
                    var deduction_u_chapter_sub_child_80_E = [];
                    var deduction_u_chapter_sub_child_80_G = [];
                    var deduction_u_chapter_sub_child_80_T = [];
                    var deduction_u_chapter_sub_child_80_U = [];
                    if(employee.employee_tds_calculations){
                        if(employee.employee_tds_calculations.length > 0){
                            await Promise.all(employee.employee_tds_calculations.map(async function(tds_cal){
                                if(tds_cal.head_details){
                                    if(tds_cal.head_details.length > 0){
                                        tds_cal.head_details.map(async function(tds_head_details){
                                            if(tds_head_details.abbreviation == 'basic' || tds_head_details.abbreviation == 'Basic'){
                                                basic_pay_amount += parseFloat(tds_head_details.amount);
                                            }
                                            else if(tds_head_details.abbreviation == 'HRA' || tds_head_details.abbreviation == 'hra'){
                                                house_rent_allowance_amount += parseFloat(tds_head_details.amount);
                                            }
                                            else if(tds_head_details.abbreviation == 'EA' || tds_head_details.abbreviation == 'ea'){
                                                entertainment_allowance_u_s_16_ii += parseFloat(tds_head_details.amount);
                                            }
                                        });
                                    }
                                }
                                standered_deduction_amount += parseFloat(tds_cal.standard_deduction_amount);
                                standered_p_tax_amount += parseFloat(tds_cal.total_p_tax_amount);
                                tax_on_total_income += parseFloat(tds_cal.tax_amount);
                                rebate_u_s_87a += parseFloat(tds_cal.rebate_amount);
                                net_tax += parseFloat(tds_cal.taxable_amount);
                                var total_health_edu_amount = 0;
                                if(tds_cal.additional_charge && tds_cal.additional_charge > 0){
                                    total_health_edu_amount += tds_cal.additional_charge;
                                }
                                if(tds_cal.additional_cess && tds_cal.additional_cess > 0){
                                    total_health_edu_amount += tds_cal.additional_cess;
                                }
                                health_education_cess += total_health_edu_amount;
                                tax_payable += parseFloat(tds_cal.payable_tax_amount);
                                any_other_allowance_amount += tds_cal.any_other_allowance ? parseFloat(tds_cal.any_other_allowance) : 0;
                                income_from_other_sources_amount +=  tds_cal.income_from_other_sources_amount ? parseFloat(tds_cal.income_from_other_sources_amount) : 0;
                                if(tds_cal.declaration_details){
                                    if(tds_cal.declaration_details.length > 0){
                                        await Promise.all(tds_cal.declaration_details.map(function (declaration_details){
                                            if(declaration_details.sub_heads){
                                                if(declaration_details.sub_heads.length > 0){
                                                    declaration_details.sub_heads.map(function(sub_head){
                                                        var total_amount = 0;
                                                        if(parseFloat(sub_head.total_amount) > 0 && sub_head.total_amount != NaN)
                                                        {
                                                            total_amount = sub_head.total_amount;
                                                        }
                                                        else if(parseFloat(sub_head.amount) > 0 && sub_head.amount != NaN){
                                                            total_amount = sub_head.amount;
                                                        }
                                                        deduction_u_chapter_vi_a.push({
                                                            'head': sub_head.head ? sub_head.head : sub_head.value,
                                                            'total_amount': total_amount ? parseFloat(total_amount) : 0
                                                        });
                                                        if(declaration_details.head == '80C'){
                                                            if(sub_head.child){
                                                                if(sub_head.child.length > 0){
                                                                    sub_head.child.map(function(childs){
                                                                        childs.p_head = declaration_details.head;
                                                                        childs.p_head_amount = declaration_details.amount;
                                                                        childs.sub_head = sub_head.head;
                                                                        childs.sub_head_amount = sub_head.amount;
                                                                        childs.sub_head_total_amount = sub_head.total_amount;
                                                                        deduction_u_chapter_sub_child_80_C.push(childs);
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        if(declaration_details.head == '80D'){
                                                            if(sub_head.child){
                                                                if(sub_head.child.length > 0){
                                                                    sub_head.child.map(function(childs){
                                                                        childs.p_head = declaration_details.head;
                                                                        childs.p_head_amount = declaration_details.amount;
                                                                        childs.sub_head = sub_head.head;
                                                                        childs.sub_head_amount = sub_head.amount;
                                                                        childs.sub_head_total_amount = sub_head.total_amount;
                                                                        deduction_u_chapter_sub_child_80_D.push(childs);
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        if(declaration_details.head == '80E'){
                                                            if(sub_head.child){
                                                                if(sub_head.child.length > 0){
                                                                    sub_head.child.map(function(childs){
                                                                        childs.p_head = declaration_details.head;
                                                                        childs.p_head_amount = declaration_details.amount;
                                                                        childs.sub_head = sub_head.head;
                                                                        childs.sub_head_amount = sub_head.amount;
                                                                        childs.sub_head_total_amount = sub_head.total_amount;
                                                                        deduction_u_chapter_sub_child_80_E.push(childs);
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        if(declaration_details.head == '80G'){
                                                            if(sub_head.child){
                                                                if(sub_head.child.length > 0){
                                                                    sub_head.child.map(function(childs){
                                                                        childs.p_head = declaration_details.head;
                                                                        childs.p_head_amount = declaration_details.amount;
                                                                        childs.sub_head = sub_head.head;
                                                                        childs.sub_head_amount = sub_head.amount;
                                                                        childs.sub_head_total_amount = sub_head.total_amount;
                                                                        deduction_u_chapter_sub_child_80_G.push(childs);
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        if(declaration_details.head == '80T'){
                                                            if(sub_head.child){
                                                                if(sub_head.child.length > 0){
                                                                    sub_head.child.map(function(childs){
                                                                        childs.p_head = declaration_details.head;
                                                                        childs.p_head_amount = declaration_details.amount;
                                                                        childs.sub_head = sub_head.head;
                                                                        childs.sub_head_amount = sub_head.amount;
                                                                        childs.sub_head_total_amount = sub_head.total_amount;
                                                                        deduction_u_chapter_sub_child_80_T.push(childs);
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        if(declaration_details.head == '80U'){
                                                            if(sub_head.child){
                                                                if(sub_head.child.length > 0){
                                                                    sub_head.child.map(function(childs){
                                                                        childs.p_head = declaration_details.head;
                                                                        childs.p_head_amount = declaration_details.amount;
                                                                        childs.sub_head = sub_head.head;
                                                                        childs.sub_head_amount = sub_head.amount;
                                                                        childs.sub_head_total_amount = sub_head.total_amount;
                                                                        deduction_u_chapter_sub_child_80_U.push(childs);
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        }));
                                    }
                                }
                            }));
                        }
                    };
                    var holder_d = {};
                    deduction_u_chapter_vi_a.forEach(function(d) {
                        if (holder_d.hasOwnProperty(d.head)) {
                            holder_d[d.head] = holder_d[d.head] + d.total_amount;
                        } else {
                            holder_d[d.head] = d.total_amount;
                        }
                    });
                    
                    for (var prop in holder_d) {
                        var p_head_data = '';
                        if(tds_act){
                            tds_act.tds.map(function(tds_act){
                                if(tds_act.child){
                                    if(tds_act.child.length > 0){
                                        var tds_act_data =  tds_act.child.find((element) => element.value == prop);
                                        if(tds_act_data){
                                            p_head_data = tds_act.value;
                                        }
                                    }
                                }
                            });
                        }
                        deduction_u_chapter_vi_a_unique.push({ head: prop, p_head: p_head_data, amount: holder_d[prop]});

                        total_deduction_amount += parseFloat(holder_d[prop]);
                    }
                    
                    var deduction_u_chapter_sub_child_80_C_final = [];

                    deduction_u_chapter_sub_child_80_C.forEach(function (a) {
                        if ( !this[a.label] ) {
                            this[a.label] = { 
                                p_head:a.p_head, 
                                p_head_amount : a.p_head_amount,
                                sub_head:a.sub_head,  
                                sub_head_amount:a.sub_head_amount,  
                                sub_head_total_amount:a.sub_head_total_amount,  
                                label: a.label ,
                                amount: 0,
                                declaration_amount: 0 , 
                            };
                            deduction_u_chapter_sub_child_80_C_final.push(this[a.label]);
                        } 
                        this[a.label].amount += a.amount;
                        this[a.label].declaration_amount += a.declaration_amount;
                    }, Object.create(null));
                    var  deduction_u_chapter_sub_child_80_D_final = [];

                    deduction_u_chapter_sub_child_80_D.forEach(function (a) {
                        if ( !this[a.label] ) {
                            this[a.label] = { 
                                p_head:a.p_head, 
                                p_head_amount : a.p_head_amount,
                                sub_head:a.sub_head,  
                                sub_head_amount:a.sub_head_amount,  
                                sub_head_total_amount:a.sub_head_total_amount,  
                                label: a.label ,
                                amount: 0,
                                declaration_amount: 0 , 
                            };
                            deduction_u_chapter_sub_child_80_D_final.push(this[a.label]);
                        } 
                        this[a.label].amount += a.amount;
                        this[a.label].declaration_amount += a.declaration_amount;
                    }, Object.create(null));

                    var deduction_u_chapter_sub_child_80_E_final = [];

                    deduction_u_chapter_sub_child_80_E.forEach(function (a) {
                        if ( !this[a.label] ) {
                            this[a.label] = { 
                                p_head:a.p_head, 
                                p_head_amount : a.p_head_amount,
                                sub_head:a.sub_head,  
                                sub_head_amount:a.sub_head_amount,  
                                sub_head_total_amount:a.sub_head_total_amount,  
                                label: a.label ,
                                amount: 0,
                                declaration_amount: 0 , 
                            };
                            deduction_u_chapter_sub_child_80_E_final.push(this[a.label]);
                        } 
                        this[a.label].amount += a.amount;
                        this[a.label].declaration_amount += a.declaration_amount;
                    }, Object.create(null));

                    var  deduction_u_chapter_sub_child_80_G_final = [];

                    deduction_u_chapter_sub_child_80_G.forEach(function (a) {
                        if ( !this[a.label] ) {
                            this[a.label] = { 
                                p_head:a.p_head, 
                                p_head_amount : a.p_head_amount,
                                sub_head:a.sub_head,  
                                sub_head_amount:a.sub_head_amount,  
                                sub_head_total_amount:a.sub_head_total_amount,  
                                label: a.label ,
                                amount: 0,
                                declaration_amount: 0 , 
                            };
                            deduction_u_chapter_sub_child_80_G_final.push(this[a.label]);
                        } 
                        this[a.label].amount += a.amount;
                        this[a.label].declaration_amount += a.declaration_amount;
                    }, Object.create(null));

                    var deduction_u_chapter_sub_child_80_T_final = [];

                    deduction_u_chapter_sub_child_80_T.forEach(function (a) {
                        if ( !this[a.label] ) {
                            this[a.label] = { 
                                p_head:a.p_head, 
                                p_head_amount : a.p_head_amount,
                                sub_head:a.sub_head,  
                                sub_head_amount:a.sub_head_amount,  
                                sub_head_total_amount:a.sub_head_total_amount,  
                                label: a.label ,
                                amount: 0,
                                declaration_amount: 0 , 
                            };
                            deduction_u_chapter_sub_child_80_T_final.push(this[a.label]);
                        } 
                        this[a.label].amount += a.amount;
                        this[a.label].declaration_amount += a.declaration_amount;
                    }, Object.create(null));

                    var deduction_u_chapter_sub_child_80_U_final = [];

                    deduction_u_chapter_sub_child_80_U.forEach(function (a) {
                        if ( !this[a.label] ) {
                            this[a.label] = { 
                                p_head:a.p_head, 
                                p_head_amount : a.p_head_amount,
                                sub_head:a.sub_head,  
                                sub_head_amount:a.sub_head_amount,  
                                sub_head_total_amount:a.sub_head_total_amount,  
                                label: a.label ,
                                amount: 0,
                                declaration_amount: 0 , 
                            };
                            deduction_u_chapter_sub_child_80_U_final.push(this[a.label]);
                        } 
                        this[a.label].amount += a.amount;
                        this[a.label].declaration_amount += a.declaration_amount;
                    }, Object.create(null));
                    
                    var gress_total_one = (basic_pay_amount + house_rent_allowance_amount + any_other_allowance_amount + income_loss_from_house_property + income_from_other_sources_amount)
                    var gress_total_two = (gress_total_one - standered_deduction_amount - standered_p_tax_amount);
                    if(gress_total_two < 0){
                        gress_total_two = 0;
                    }
                    var salary_section_17_1 = (basic_pay_amount + house_rent_allowance_amount + any_other_allowance_amount);
                    
                    employee.tds_custom_report = {
                        'basic_pay' : basic_pay_amount,
                        'house_rent_allowance': house_rent_allowance_amount,
                        'any_other_allowance_amount': any_other_allowance_amount,
                        'value_of_perquisites':0,
                        'profits_in_lieu_of_salary':0,
                        'income_loss_from_house_property':income_loss_from_house_property,
                        'income_from_other_sources':income_from_other_sources_amount,
                        'income_from_capital_gain':0,
                        'gress_total_income': gress_total_one,
                        
                        'standered_deduction_u_s_16_i': standered_deduction_amount,
                        'entertainment_allowance_u_s_16_ii': entertainment_allowance_u_s_16_ii,
                        'prof_tax_u_s_16_iii': standered_p_tax_amount,
                        'gress_taxable_income': gress_total_two,

                        'deduction_u_chapter_vi_a' : deduction_u_chapter_vi_a_unique,
                        'total_deduction_amount' : total_deduction_amount,
                        'total_taxable_income' : (gress_total_two - total_deduction_amount),
                        'tax_on_total_income' : tax_on_total_income,
                        'rebate_u_s_87a' : rebate_u_s_87a,
                        'net_tax' : net_tax,
                        'surcharge_wherever_applicable' : '',
                        'health_education_cess' : health_education_cess,
                        'tax_payable' : tax_payable,
                        'tds_made':'',
                        'balance_tax_payable_refundable': tax_payable,
                        'is_opted_for_115bac' :'no'
                    };

                    var total_salary_section_17 = (salary_section_17_1 + employee.tds_custom_report?.value_of_perquisites + employee.tds_custom_report?.profits_in_lieu_of_salary);
                    var employee_address = '';
                    var company_address = '';
                    if(employee.employee_details){
                        if(employee.employee_details.emp_address){
                            employee_address = employee.employee_details.emp_address.resident_no+' '+
                            employee.employee_details.emp_address.residential_name+' '+
                            employee.employee_details.emp_address.road+' '+
                            employee.employee_details.emp_address.locality+'\n '+
                            employee.employee_details.emp_address.city+' '+
                            employee.employee_details.emp_address.district+' '+
                            employee.employee_details.emp_address.state+' '+
                            employee.employee_details.emp_address.country+' '+
                            employee.employee_details.emp_address.pincode;
                        }
                    }
                    if(employee.company_details){
                        if(employee.company_details.reg_office_address){
                            company_address = employee.company_details.reg_office_address.door_no+' '+
                            employee.company_details.reg_office_address.street_name+' '+
                            employee.company_details.reg_office_address.locality+' '+
                            employee.company_details.reg_office_address.district_name+'\n '+
                            employee.company_details.reg_office_address.state+' '+
                            employee.company_details.reg_office_address.pin_code;
                        }
                    }
                    var quter_array = [];
                    if(employee.employee_details){
                        if(employee.employee_details.template_data){
                            if(employee.employee_details.template_data.tds_temp_data){
                                if(employee.employee_details.template_data.tds_temp_data.frequency){
                                    if(employee.company_details){
                                        if(employee.company_details.preference_settings){
                                            if(employee.company_details.preference_settings.quater){
                                                if(employee.employee_details.template_data.tds_temp_data.frequency == 'quaterly'){
                                                    if(employee.company_details.preference_settings.quater.quaterly){
                                                        if(employee.company_details.preference_settings.quater.quaterly.length > 0){
                                                            var quetar1 = employee.company_details.preference_settings.quater.quaterly.find((value) => value.quater === 1);
                                                            var quetar2 = employee.company_details.preference_settings.quater.quaterly.find((value) => value.quater === 2);
                                                            var quetar3 = employee.company_details.preference_settings.quater.quaterly.find((value) => value.quater === 3);
                                                            var quetar4 = employee.company_details.preference_settings.quater.quaterly.find((value) => value.quater === 4);
                                                            var quetar_1_form_month =  quetar1.form_date.split("-").map(Number)[0];
                                                            var quetar_1_form_year =  quetar1.form_date.split("-").map(Number)[1];
                                                            var quetar_1_to_month =  quetar1.to_date.split("-").map(Number)[0];
                                                            var quetar_1_to_year =  quetar1.to_date.split("-").map(Number)[1];

                                                            var quetar_2_form_month =  quetar2.form_date.split("-").map(Number)[0];
                                                            var quetar_2_form_year =  quetar2.form_date.split("-").map(Number)[1];
                                                            var quetar_2_to_month =  quetar2.to_date.split("-").map(Number)[0];
                                                            var quetar_2_to_year =  quetar2.to_date.split("-").map(Number)[1];

                                                            var quetar_3_form_month =  quetar3.form_date.split("-").map(Number)[0];
                                                            var quetar_3_form_year =  quetar3.form_date.split("-").map(Number)[1];
                                                            var quetar_3_to_month =  quetar3.to_date.split("-").map(Number)[0];
                                                            var quetar_3_to_year =  quetar3.to_date.split("-").map(Number)[1];

                                                            var quetar_4_form_month =  quetar4.form_date.split("-").map(Number)[0];
                                                            var quetar_4_form_year =  quetar4.form_date.split("-").map(Number)[1];
                                                            var quetar_4_to_month =  quetar4.to_date.split("-").map(Number)[0];
                                                            var quetar_4_to_year =  quetar4.to_date.split("-").map(Number)[1];
                                                            if(employee.employee_tds_calculations_full_year){
                                                                if(employee.employee_tds_calculations_full_year.length > 0){
                                                                    var quter1_tax_amount = 0;
                                                                    var quter2_tax_amount = 0;
                                                                    var quter3_tax_amount = 0;
                                                                    var quter4_tax_amount = 0;
                                                                    await Promise.all(employee.employee_tds_calculations_full_year.map(async function(tds_calculation, indexs) {
                                                                        
                                                                        if(tds_calculation.wage_month >= quetar_1_form_month 
                                                                            && tds_calculation.wage_year >= quetar_1_form_year 
                                                                            && tds_calculation.wage_month <= quetar_1_to_month
                                                                            && tds_calculation.wage_year <= quetar_1_to_year
                                                                        ){
                                                                            quter1_tax_amount += parseFloat(tds_calculation.taxable_amount);
                                                                            
                                                                        }
                                                                        if(tds_calculation.wage_month >= quetar_2_form_month 
                                                                            && tds_calculation.wage_year >= quetar_2_form_year 
                                                                            && tds_calculation.wage_month <= quetar_2_to_month
                                                                            && tds_calculation.wage_year <= quetar_2_to_year
                                                                        ){
                                                                            quter2_tax_amount += parseFloat(tds_calculation.taxable_amount);
                                                                            
                                                                        }
                                                                        if(tds_calculation.wage_month >= quetar_3_form_month 
                                                                            && tds_calculation.wage_year >= quetar_3_form_year 
                                                                            && tds_calculation.wage_month <= quetar_3_to_month
                                                                            && tds_calculation.wage_year <= quetar_3_to_year
                                                                        ){
                                                                            quter3_tax_amount += parseFloat(tds_calculation.taxable_amount);
                                                                            
                                                                        }
                                                                        if(tds_calculation.wage_month >= quetar_4_form_month 
                                                                            && tds_calculation.wage_year >= quetar_4_form_year 
                                                                            && tds_calculation.wage_month <= quetar_4_to_month
                                                                            && tds_calculation.wage_year <= quetar_4_to_year
                                                                        ){
                                                                            quter4_tax_amount += parseFloat(tds_calculation.taxable_amount);
                                                                            
                                                                        }

                                                                    }));
                                                                    quter_array.push({
                                                                        'quater':1,
                                                                        'amount':quter1_tax_amount,
                                                                    },
                                                                    {
                                                                        'quater':2,
                                                                        'amount':quter2_tax_amount,
                                                                    },
                                                                    {
                                                                        'quater':3,
                                                                        'amount':quter3_tax_amount,
                                                                    },
                                                                    {
                                                                        'quater':4,
                                                                        'amount':quter4_tax_amount,
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                else if(employee.employee_details.template_data.tds_temp_data.frequency == 'half_yearly'){
                                                    if(employee.company_details.preference_settings.quater.half_yearly){
                                                        if(employee.company_details.preference_settings.quater.half_yearly.length > 0){
                                                            var quetar1 = employee.company_details.preference_settings.quater.half_yearly.find((value) => value.quater === 1);
                                                            var quetar2 = employee.company_details.preference_settings.quater.half_yearly.find((value) => value.quater === 2);
                                                            var quetar_1_form_month =  quetar1.form_date.split("-").map(Number)[0];
                                                            var quetar_1_form_year =  quetar1.form_date.split("-").map(Number)[1];
                                                            var quetar_1_to_month =  quetar1.to_date.split("-").map(Number)[0];
                                                            var quetar_1_to_year =  quetar1.to_date.split("-").map(Number)[1];

                                                            var quetar_2_form_month =  quetar2.form_date.split("-").map(Number)[0];
                                                            var quetar_2_form_year =  quetar2.form_date.split("-").map(Number)[1];
                                                            var quetar_2_to_month =  quetar2.to_date.split("-").map(Number)[0];
                                                            var quetar_2_to_year =  quetar2.to_date.split("-").map(Number)[1];

                                                           
                                                            if(employee.employee_tds_calculations_full_year){
                                                                if(employee.employee_tds_calculations_full_year.length > 0){
                                                                    var quter1_tax_amount = 0;
                                                                    var quter2_tax_amount = 0;
                                                                    await Promise.all(employee.employee_tds_calculations_full_year.map(async function(tds_calculation, indexs) {
                                                                        
                                                                        if(tds_calculation.wage_month >= quetar_1_form_month 
                                                                            || tds_calculation.wage_year >= quetar_1_form_year 
                                                                            && tds_calculation.wage_month <= quetar_1_to_month
                                                                            && tds_calculation.wage_year <= quetar_1_to_year
                                                                        ){
                                                                            quter1_tax_amount += parseFloat(tds_calculation.taxable_amount);
                                                                            
                                                                        }
                                                                        if(tds_calculation.wage_month >= quetar_2_form_month 
                                                                            || tds_calculation.wage_year >= quetar_2_form_year 
                                                                            && tds_calculation.wage_month <= quetar_2_to_month
                                                                            && tds_calculation.wage_year <= quetar_2_to_year
                                                                        ){
                                                                            quter2_tax_amount += parseFloat(tds_calculation.taxable_amount);
                                                                            
                                                                        }

                                                                    }));
                                                                    quter_array.push({
                                                                        'quater':1,
                                                                        'amount':quter1_tax_amount,
                                                                    },
                                                                    {
                                                                        'quater':2,
                                                                        'amount':quter2_tax_amount,
                                                                    },
                                                                    {
                                                                        'quater':3,
                                                                        'amount':0,
                                                                    },
                                                                    {
                                                                        'quater':4,
                                                                        'amount':0,
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                else{
                                                    if(employee.company_details.preference_settings.quater.yearly){
                                                        if(employee.company_details.preference_settings.quater.yearly.length > 0){
                                                            var quetar1 = employee.company_details.preference_settings.quater.yearly.find((value) => value.quater === 1);
                                                            var quetar_1_form_month =  quetar1.form_date.split("-").map(Number)[0];
                                                            var quetar_1_form_year =  quetar1.form_date.split("-").map(Number)[1];
                                                            var quetar_1_to_month =  quetar1.to_date.split("-").map(Number)[0];
                                                            var quetar_1_to_year =  quetar1.to_date.split("-").map(Number)[1];
                                                            if(employee.employee_tds_calculations_full_year){
                                                                if(employee.employee_tds_calculations_full_year.length > 0){
                                                                    var quter1_tax_amount = 0;
                                                                    var quter2_tax_amount = 0;
                                                                    await Promise.all(employee.employee_tds_calculations_full_year.map(async function(tds_calculation, indexs) {
                                                                        
                                                                        if(tds_calculation.wage_month >= quetar_1_form_month 
                                                                            && tds_calculation.wage_year >= quetar_1_form_year 
                                                                            && tds_calculation.wage_month <= quetar_1_to_month
                                                                            && tds_calculation.wage_year <= quetar_1_to_year
                                                                        ){
                                                                            quter1_tax_amount += parseFloat(tds_calculation.taxable_amount);
                                                                            
                                                                        }
                                                                    }));
                                                                    quter_array.push({
                                                                        'quater':1,
                                                                        'amount':quter1_tax_amount,
                                                                    },
                                                                    {
                                                                        'quater':2,
                                                                        'amount':0,
                                                                    },
                                                                    {
                                                                        'quater':3,
                                                                        'amount':0,
                                                                    },
                                                                    {
                                                                        'quater':4,
                                                                        'amount':0,
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    var assessment_year = (new Date().getFullYear() - 1) +'-'+new Date().getFullYear();
                    var aggregate_total = employee?.tds_custom_report?.entertainment_allowance_u_s_16_ii + employee?.tds_custom_report?.prof_tax_u_s_16_iii;
                    var index_val = 1;
                    index_val = index_val + index;
                    var clmn_emp_id=1
                    ws.cell(1, 1, 1, 2, true).string('SELECT A CATEGORY ►').style(myStyle);
                    // var standered_p_tax_amount = 0;
                    ws.cell(2, 1, 2, 6, true).string("");
                    ws.cell(3, 1, 3, 6, true).string('FORM 16').style(myStyle);
                    ws.cell(4, 1, 4, 6, true).string('[See rule 31(1)(a)]').style(myStyle);
                    ws.cell(5, 1, 5, 6, true).string('PART A').style(myStyle);
                    ws.cell(6, 1, 6, 6, true).string('Certificate under section 203 of the Income-tax Act, 1961 for Tax deducted at source on Salary').style(myStyle);
                    ws.cell(7, 1, 7, 3, true).string('Name and address of the Employer').style(myStyle);
                    ws.cell(7, 4, 7, 6, true).string('Name and designation of the Employee').style(myStyle);
                    ws.cell(8, 1, 8, 3, true).string(employee_address).style(myStyle);
                    ws.cell(8, 4, 8, 6, true).string(company_address).style(myStyle);
                    ws.cell(9, 1, 9, 6, true).string("");
                    ws.cell(10, 1, 10, 3, true).string('PAN of the Deductor').style(myStyle);
                    ws.cell(10, 4, 10, 4, true).string('TAN of the Deductor').style(myStyle);
                    ws.cell(10, 5, 10, 6, true).string('PAN of the Employee').style(myStyle);
                    ws.cell(11, 1, 11, 3, true).string(employee.company_details?.establishment?.pan_numberc).style(myStyle);
                    ws.cell(11, 4, 11, 4, true).string(employee.company_details?.establishment?.tan_number).style(myStyle);
                    ws.cell(11, 5, 11, 6, true).string(employee?.pan_no).style(myStyle);
                    ws.cell(12, 1, 12, 3, true).string('CIT (TDS)').style(myStyle);
                    ws.cell(12, 4, 12, 4, true).string('Assessment Year').style(myStyle);
                    ws.cell(12, 5, 12, 6, true).string('Period').style(myStyle);
                    ws.cell(13, 1, 13, 3, true).string('Address: ');
                    ws.cell(13, 4, 13, 4, true).string(assessment_year).style(myStyle);
                    ws.cell(13, 5, 13, 5, true).string('From').style(myStyle);
                    ws.cell(13, 6, 13, 6, true).string('To').style(myStyle);
                    ws.cell(14, 1, 14, 3, true).string('City:                         Pincode: ').style(myStyle);
                    ws.cell(14, 4, 14, 4, true).string('').style(myStyle);
                    ws.cell(14, 5, 14, 5, true).string(from_date).style(myStyle);
                    ws.cell(14, 6, 14, 6, true).string(to_date).style(myStyle);
                    ws.cell(15, 1, 15, 6, true).string("Summary of tax deducted at source").style(myStyle);
                    ws.cell(16, 1, 16, 1, true).string('Quarter').style(myStyle);
                    ws.cell(16, 2, 16, 4, true).string("Receipt Numbers of original statements of TDS under sub-section (3) of section 200").style(myStyle);
                    ws.cell(16, 5, 16, 5, true).string("Amount of tax deducted in respect of the employee").style(myStyle);
                    ws.cell(16, 6, 16, 6, true).string("Amount of tax deposited/remitted in respect of the employee").style(myStyle);
                    
                    if(quter_array.length > 0){
                        quter_array.map(function(datas , keys){
                            ws.cell(17 + keys, 1, 17 + keys, 1, true).string('Quarter '+datas.quater).style(myStyle);
                            ws.cell(17 + keys, 2, 17 + keys, 4, true).string("").style(myStyle);
                            ws.cell(17 + keys, 5, 17 + keys, 5, true).number(datas.amount).style(myStyle4);
                            ws.cell(17 + keys, 6, 17 + keys, 6, true).string("-").style(myStyle);
                        });
                    }
                    else{
                        ws.cell(17, 1, 17, 1, true).string('Quarter 1').style(myStyle);
                        ws.cell(17, 2, 17, 4, true).string("").style(myStyle);
                        ws.cell(17, 5, 17, 5, true).number(0).style(myStyle4);
                        ws.cell(17, 6, 17, 6, true).string("").style(myStyle);

                        ws.cell(18, 1, 18, 1, true).string('Quarter 2').style(myStyle);
                        ws.cell(18, 2, 18, 4, true).string("").style(myStyle);
                        ws.cell(18, 5, 18, 5, true).number(0).style(myStyle4);
                        ws.cell(18, 6, 18, 6, true).string("").style(myStyle);

                        ws.cell(19, 1, 19, 1, true).string('Quarter 3').style(myStyle);
                        ws.cell(19, 2, 19, 4, true).string("").style(myStyle);
                        ws.cell(19, 5, 19, 5, true).number(0).style(myStyle4);
                        ws.cell(19, 6, 19, 6, true).string("").style(myStyle);

                        ws.cell(20, 1, 20, 1, true).string('Quarter 4').style(myStyle);
                        ws.cell(20, 2, 20, 4, true).string("").style(myStyle);
                        ws.cell(20, 5, 20, 5, true).number(0).style(myStyle4);
                        ws.cell(20, 6, 20, 6, true).string("").style(myStyle);

                    }
                    

                    ws.cell(21, 1, 21, 1, true).string('Total').style(myStyle);
                    ws.cell(21, 2, 21, 4, true).string("").style(myStyle2);
                    ws.cell(21, 5, 21, 5, true).string("-").style(myStyle2);
                    ws.cell(21, 6, 21, 6, true).string("-").style(myStyle2);
                    ws.cell(22, 1, 22, 6, true).string("PART B (Refer Note 1)").style(myStyle);
                    ws.cell(23, 1, 23, 6, true).string("Details of Salary Paid and any other income and tax deducted").style(myStyle3);
                    ws.cell(24, 1, 24, 3, true).string("").style(myStyle);
                    ws.cell(24, 4, 24, 4, true).string("Rs.").style(myStyle);
                    ws.cell(24, 5, 24, 5, true).string("Rs.").style(myStyle);
                    ws.cell(24, 6, 24, 6, true).string("Rs.").style(myStyle);
                    ws.cell(25, 1, 25, 3, true).string("1.  Gross Salary").style(myStyle);
                    ws.cell(25, 4, 25, 4, true).string("").style(myStyle2);
                    ws.cell(25, 5, 25, 5, true).string("").style(myStyle2);
                    ws.cell(25, 6, 25, 6, true).string("").style(myStyle2);
                    ws.cell(26, 1, 26, 3, true).string("(a) Salary as per provisions contained in sec. 17(1)").style(myStyle);
                    ws.cell(26, 4, 26, 4, true).number(salary_section_17_1).style(myStyle4);
                    ws.cell(26, 5, 26, 5, true).string("").style(myStyle2);
                    ws.cell(26, 6, 26, 6, true).string("").style(myStyle2);
                    ws.cell(27, 1, 27, 3, true).string("(b) Value of perquisites u/s 17(2) (as per Form No. 12BB, wherever applicable)").style(myStyle);
                    ws.cell(27, 4, 27, 4, true).number(employee.tds_custom_report?.value_of_perquisites).style(myStyle4);
                    ws.cell(27, 5, 27, 5, true).string("").style(myStyle2);
                    ws.cell(27, 6, 27, 6, true).string("").style(myStyle2);
                    ws.cell(28, 1, 28, 3, true).string("(c) Profits in lieu of salary under section 17(3)(as per Form No. 12BB, wherever applicable").style(myStyle);
                    ws.cell(28, 4, 28, 4, true).number(employee.tds_custom_report?.profits_in_lieu_of_salary).style(myStyle4);
                    ws.cell(28, 5, 28, 5, true).string("").style(myStyle2);
                    ws.cell(28, 6, 28, 6, true).string("").style(myStyle2);
                    ws.cell(29, 1, 29, 3, true).string("Total").style(myStyle);
                    ws.cell(29, 4, 29, 4, true).string("").style(myStyle2);
                    ws.cell(29, 5, 29, 5, true).number(total_salary_section_17).style(myStyle4);
                    ws.cell(29, 6, 29, 6, true).string("").style(myStyle2);

                    ws.cell(30, 1, 30, 3, true).string("2. Less: Allowance to the extent exempt U/s 10").style(myStyle);
                    ws.cell(30, 4, 30, 4, true).string("").style(myStyle2);
                    ws.cell(30, 5, 30, 5, true).string("").style(myStyle2);
                    ws.cell(30, 6, 30, 6, true).string("").style(myStyle2);

                    ws.cell(31, 1, 31, 1, true).string("Allowance").style(myStyle);
                    ws.cell(31, 2, 31, 2, true).string("Rs.").style(myStyle);
                    ws.cell(31, 3, 31, 3, true).string("").style(myStyle);
                    ws.cell(31, 4, 31, 4, true).string("").style(myStyle2);
                    ws.cell(31, 5, 31, 5, true).string("").style(myStyle2);
                    ws.cell(31, 6, 31, 6, true).string("").style(myStyle2);

                    ws.cell(32, 1, 32, 1, true).string("Travel Allowance U/S 10(5)").style(myStyle);
                    ws.cell(32, 2, 32, 2, true).number(0).style(myStyle4);
                    ws.cell(32, 3, 32, 3, true).string("").style(myStyle);
                    ws.cell(32, 4, 32, 4, true).string("").style(myStyle2);
                    ws.cell(32, 5, 32, 5, true).string("").style(myStyle2);
                    ws.cell(32, 6, 32, 6, true).string("").style(myStyle2);

                    ws.cell(33, 1, 33, 1, true).string("House Rent Allowance U/S 10(13A)").style(myStyle);
                    ws.cell(33, 2, 33, 2, true).number(0).style(myStyle4);
                    ws.cell(33, 3, 33, 3, true).string("").style(myStyle);
                    ws.cell(33, 4, 33, 4, true).string("").style(myStyle2);
                    ws.cell(33, 5, 33, 5, true).string("").style(myStyle2);
                    ws.cell(33, 6, 33, 6, true).string("").style(myStyle2);

                    ws.cell(34, 1, 34, 1, true).string("Leave Salary Encasement U/S 10(10AA)").style(myStyle);
                    ws.cell(34, 2, 34, 2, true).number(0).style(myStyle4);
                    ws.cell(34, 3, 34, 3, true).string("").style(myStyle);
                    ws.cell(34, 4, 34, 4, true).string("").style(myStyle2);
                    ws.cell(34, 5, 34, 5, true).string("").style(myStyle2);
                    ws.cell(34, 6, 34, 6, true).string("").style(myStyle2);

                    ws.cell(35, 1, 35, 3, true).string("").style(myStyle);
                    ws.cell(35, 4, 35, 4, true).string("").style(myStyle2);
                    ws.cell(35, 5, 35, 5, true).number(0).style(myStyle4);
                    ws.cell(35, 6, 35, 6, true).string("").style(myStyle2);

                    ws.cell(36, 1, 36, 6, true).string("").style(myStyle);

                    ws.cell(37, 1, 37, 3, true).string("3. Balance (1-2)").style(myStyle);
                    ws.cell(37, 4, 37, 4, true).string("").style(myStyle2);
                    ws.cell(37, 5, 37, 5, true).number(total_salary_section_17).style(myStyle4);
                    ws.cell(37, 6, 37, 6, true).string("").style(myStyle2);

                    ws.cell(38, 1, 38, 3, true).string("4. Deductions :").style(myStyle);
                    ws.cell(38, 4, 38, 4, true).string("").style(myStyle2);
                    ws.cell(38, 5, 38, 5, true).string("").style(myStyle2);
                    ws.cell(38, 6, 38, 6, true).string("").style(myStyle2);

                    ws.cell(39, 1, 39, 3, true).string("(a) Entertainment allowance").style(myStyle);
                    ws.cell(39, 4, 39, 4, true).number(employee?.tds_custom_report?.entertainment_allowance_u_s_16_ii).style(myStyle4);
                    ws.cell(39, 5, 39, 5, true).string("").style(myStyle2);
                    ws.cell(39, 6, 39, 6, true).string("").style(myStyle2); 

                    ws.cell(40, 1, 40, 3, true).string("(b) Tax on employment (P Tax)").style(myStyle);
                    ws.cell(40, 4, 40, 4, true).number(employee?.tds_custom_report?.prof_tax_u_s_16_iii).style(myStyle4);
                    ws.cell(40, 5, 40, 5, true).string("").style(myStyle2);
                    ws.cell(40, 6, 40, 6, true).string("").style(myStyle2); 

                    ws.cell(41, 1, 41, 3, true).string("5. Aggregate of 4(a) and (b)").style(myStyle);
                    ws.cell(41, 4, 41, 4, true).string("").style(myStyle2);
                    ws.cell(41, 5, 41, 5, true).number(aggregate_total).style(myStyle4);
                    ws.cell(41, 6, 41, 6, true).string("").style(myStyle2);
                    var salary3_5 = (total_salary_section_17 - aggregate_total);
                    ws.cell(42, 1, 42, 3, true).string("6. Income chargebale under the head 'Salaries' (3-5)").style(myStyle);
                    ws.cell(42, 4, 42, 4, true).string("").style(myStyle2);
                    ws.cell(42, 5, 42, 5, true).string("").style(myStyle2);
                    ws.cell(42, 6, 42, 6, true).number(salary3_5).style(myStyle4);

                    ws.cell(43, 1, 43, 3, true).string("").style(myStyle);
                    ws.cell(43, 4, 43, 6, true).string("").style(myStyle2); 

                    ws.cell(44, 1, 44, 3, true).string("7. Add: Any other income reported by the employee").style(myStyle);
                    ws.cell(44, 4, 44, 6, true).string("").style(myStyle2);

                    ws.cell(45, 1, 45, 2, true).string("Income").style(myStyle);
                    ws.cell(45, 3, 45, 3, true).string("Rs.").style(myStyle);
                    ws.cell(45, 4, 45, 6, true).string("").style(myStyle2);

                    var other_income_house_property_sum = (employee?.tds_custom_report?.income_from_other_sources + employee?.tds_custom_report?.income_loss_from_house_property) - employee?.tds_custom_report?.income_from_capital_gain;

                    ws.cell(46, 1, 46, 2, true).string("Income (or Loss) from House Property").style(myStyle);
                    ws.cell(46, 3, 46, 3, true).number(employee?.tds_custom_report?.income_loss_from_house_property).style(myStyle4);
                    ws.cell(46, 4, 46, 6, true).string("").style(myStyle2);

                    ws.cell(47, 1, 47, 2, true).string("Income From other Sources").style(myStyle);
                    ws.cell(47, 3, 47, 3, true).number(employee?.tds_custom_report?.income_from_other_sources).style(myStyle4);
                    ws.cell(47, 4, 47, 6, true).string("").style(myStyle2);

                    var  capital_gain_total = (other_income_house_property_sum + salary_section_17_1);

                    ws.cell(48, 1, 48, 2, true).string("Income from Capital Gain").style(myStyle);
                    ws.cell(48, 3, 48, 3, true).number(employee?.tds_custom_report?.income_from_capital_gain).style(myStyle4);
                    ws.cell(48, 4, 48, 4, true).string("").style(myStyle2);
                    ws.cell(48, 5, 48, 5, true).number(other_income_house_property_sum).style(myStyle4);
                    ws.cell(48, 6, 48, 6, true).string("").style(myStyle2);

                    ws.cell(50, 1, 50, 2, true).string("8. Gross Total income (6+7)").style(myStyle);
                    ws.cell(50, 3, 50, 3, true).string("").style(myStyle2);
                    ws.cell(50, 4, 50, 4, true).string("").style(myStyle2);
                    ws.cell(50, 5, 50, 5, true).number(capital_gain_total).style(myStyle4);
                    ws.cell(50, 6, 50, 6, true).string("").style(myStyle2);

                    ws.cell(53, 1, 53, 6, true).string(":: 2 ::").style(myStyle);
                    ws.cell(54, 1, 54, 3, true).string("9. Deductions under Chapter VI A").style(myStyle);
                    ws.cell(54, 4, 54, 6, true).string("").style(myStyle2);

                    ws.cell(55, 1, 55, 3, true).string("(A) sections 80C, 80CCC and 80CCD").style(myStyle);
                    ws.cell(55, 4, 55, 6, true).string("").style(myStyle2);

                    ws.cell(56, 1, 56, 3, true).string("").style(myStyle);
                    ws.cell(56, 4, 56, 6, true).string("").style(myStyle2);
                    ws.cell(57, 1, 57, 3, true).string("(a) Section 80 C").style(myStyle);
                    ws.cell(57, 4, 57, 4, true).string("").style(myStyle2);
                    ws.cell(57, 5, 57, 5, true).string("Gross Amount").style(myStyle);
                    ws.cell(57, 6, 57, 6, true).string("Deductible Amount").style(myStyle);
                    var eighty_ccc_amount = 0;
                    var eighty_ccd_1_amount = 0;
                    var eighty_ccd_1_b_amount = 0;
                    var eighty_ccd_2_amount = 0;
                    var total_eighty_c_amount_deduct = 0; 
                    var total_eighty_c_amount_gross = 0; 
                    var upRow = 57;
                    var eighty_dd_amount = 0;
                    var eighty_ccb_amount = 0;
                    var total_eighty_b_amount_deduct = 0; 
                    var total_eighty_b_amount_gross = 0;

                    var eighty_ee_amount = 0;
                    var eighty_eea_amount = 0;
                    var eighty_eeb_amount = 0;
                    var total_eighty_e_amount_deduct = 0; 
                    var total_eighty_e_amount_gross = 0;

                    var eighty_gg_amount = 0;
                    var eighty_gga_amount = 0;
                    var eighty_ggc_amount = 0;
                    var total_eighty_g_amount_deduct = 0; 
                    var total_eighty_g_amount_gross = 0;

                    var eighty_tta_amount = 0;
                    var eighty_ttb_amount = 0;
                    var total_eighty_t_amount_deduct = 0; 
                    var total_eighty_t_amount_gross = 0;

                    var eighty_u_amount = 0;
                    var total_eighty_u_amount_deduct = 0; 
                    var total_eighty_u_amount_gross = 0;

                    if(deduction_u_chapter_sub_child_80_C_final.length > 0) {
                        deduction_u_chapter_sub_child_80_C_final.map(function(data, index){
                            var f_index = upRow + 1 + index;
                            ws.cell(f_index, 1, f_index, 1, true).number(index+1).style(myStyle);
                            ws.cell(f_index, 2, f_index, 4, true).string(data.label).style(myStyle);
                            ws.cell(f_index, 5, f_index, 5, true).number(data.declaration_amount).style(myStyle4);
                            ws.cell(f_index, 6, f_index, 6, true).number(data.amount).style(myStyle4);
                            if(data.sub_head == '80CCC'){
                                eighty_ccc_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80CCD(1)'){
                                eighty_ccd_1_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80CCD(1B)'){
                                eighty_ccd_1_b_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80CCD(2)'){
                                eighty_ccd_2_amount += parseFloat(data.declaration_amount);
                            }
                            total_eighty_c_amount_deduct += parseFloat(data.amount);
                            total_eighty_c_amount_gross += parseFloat(data.declaration_amount);
                        });
                        
                        upRow += deduction_u_chapter_sub_child_80_C_final.length + 1;
                        
                        ws.cell(upRow, 1, upRow, 1, true).string("(b) section 80 CCC").style(myStyle);
                        ws.cell(upRow, 2, upRow, 4, true).string("Contributions to Specified Pension Funds (LIC or Any other Insurer)").style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).number(eighty_ccc_amount).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("(c) section 80 CCD (1)").style(myStyle);
                        ws.cell(upRow, 2, upRow, 4, true).string("Deduction for contribution in pension scheme (NPS or APY)").style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).number(eighty_ccd_1_amount).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 4, true).string("(d) section 80 CCD (1B)").style(myStyle);
                        // ws.cell(upRow, 2, upRow, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).number(eighty_ccd_1_b_amount).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 4, true).string("(e) section 80 CCD (2)").style(myStyle);
                        // ws.cell(upRow, 2, upRow, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).number(eighty_ccd_2_amount).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 4, true).string("").style(myStyle);
                        // ws.cell(upRow, 2, upRow, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).number(total_eighty_c_amount_gross).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).number(total_eighty_c_amount_deduct).style(myStyle4);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("Note: 1. Aggregate amount deductible under section 80 C shall not exceed one lakh fifty thousand rupees. Or").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("2. Aggregate amount deductible under the three sections, i.e. 80C,80CCC,80CCD shall not exceed one lakh fifty thousand rupees.").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);
                    }
                    if(deduction_u_chapter_sub_child_80_D_final.length > 0) {
                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("(B) other sections (e.g. 80D,80G etc.) under Chapter VI-A").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string('Gross Amount').style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).string('Qualifying Amount').style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string('Deductible Amount').style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("(d)Section 80D").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                        
                        deduction_u_chapter_sub_child_80_D_final.map(function(data, index){
                            var f_index = upRow+ 1 + index;
                            ws.cell(f_index, 1, f_index, 1, true).number(index+1).style(myStyle);
                            ws.cell(f_index, 2, f_index, 3, true).string(data.label).style(myStyle);
                            ws.cell(f_index, 4, f_index, 4, true).number(data.declaration_amount).style(myStyle4);
                            ws.cell(f_index, 5, f_index, 5, true).number(data.amount).style(myStyle4);
                            ws.cell(f_index, 6, f_index, 6, true).number(data.amount).style(myStyle4);
                            if(data.sub_head == '80DD'){
                                eighty_dd_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80DDB'){
                                eighty_ccb_amount += parseFloat(data.declaration_amount);
                            }
                            total_eighty_b_amount_deduct += parseFloat(data.amount);
                            total_eighty_b_amount_gross += parseFloat(data.declaration_amount);
                        });
                        upRow += deduction_u_chapter_sub_child_80_D_final.length +1;

                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80DD").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("Medical treatment of Disable Person (Self or dependent)").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_dd_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80DDB").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("Medical treatment of specified disease or ailment (Self or dependent)").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_ccb_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("").style(myStyle);
                        // ws.cell(upRow+5, 2, upRow+5, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(total_eighty_b_amount_gross).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).number(total_eighty_b_amount_gross).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);
                    }
                    if(deduction_u_chapter_sub_child_80_E_final.length > 0) {
                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("(B) other sections (e.g. 80E etc.) under Chapter VI-A").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string('Gross Amount').style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).string('Qualifying Amount').style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string('Deductible Amount').style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("(d)Section 80E").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                        
                        deduction_u_chapter_sub_child_80_E_final.map(function(data, index){
                            var f_index = upRow+ 1 + index;
                            ws.cell(f_index, 1, f_index, 1, true).number(index+1).style(myStyle);
                            ws.cell(f_index, 2, f_index, 3, true).string(data.label).style(myStyle);
                            ws.cell(f_index, 4, f_index, 4, true).number(data.declaration_amount).style(myStyle4);
                            ws.cell(f_index, 5, f_index, 5, true).number(data.amount).style(myStyle4);
                            ws.cell(f_index, 6, f_index, 6, true).number(data.amount).style(myStyle4);
                            if(data.sub_head == '80EE'){
                                eighty_ee_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80EEA'){
                                eighty_eea_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80EEB'){
                                eighty_eeb_amount += parseFloat(data.declaration_amount);
                            }
                            total_eighty_e_amount_deduct += parseFloat(data.amount);
                            total_eighty_e_amount_gross += parseFloat(data.declaration_amount);
                        });
                        upRow += deduction_u_chapter_sub_child_80_E_final.length +1;

                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80EE").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_ee_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80EEA").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_eea_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80EEB").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_eeb_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("").style(myStyle);
                        // ws.cell(upRow+5, 2, upRow+5, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(total_eighty_e_amount_gross).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).number(total_eighty_e_amount_gross).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);
                    }
                    if(deduction_u_chapter_sub_child_80_G_final.length > 0) {
                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("(B) other sections (e.g. 80G etc.) under Chapter VI-A").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string('Gross Amount').style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).string('Qualifying Amount').style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string('Deductible Amount').style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("(d)Section 80G").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                        
                        deduction_u_chapter_sub_child_80_G_final.map(function(data, index){
                            var f_index = upRow+ 1 + index;
                            ws.cell(f_index, 1, f_index, 1, true).number(index+1).style(myStyle);
                            ws.cell(f_index, 2, f_index, 3, true).string(data.label).style(myStyle);
                            ws.cell(f_index, 4, f_index, 4, true).number(data.declaration_amount).style(myStyle4);
                            ws.cell(f_index, 5, f_index, 5, true).number(data.amount).style(myStyle4);
                            ws.cell(f_index, 6, f_index, 6, true).number(data.amount).style(myStyle4);
                            if(data.sub_head == '80GG'){
                                eighty_gg_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80GGA'){
                                eighty_gga_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80GGC'){
                                eighty_ggc_amount += parseFloat(data.declaration_amount);
                            }
                            total_eighty_e_amount_deduct += parseFloat(data.amount);
                            total_eighty_e_amount_gross += parseFloat(data.declaration_amount);
                        });
                        upRow += deduction_u_chapter_sub_child_80_G_final.length +1;

                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80GG").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_gg_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80GGA").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_gga_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80GGC").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_ggc_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("").style(myStyle);
                        // ws.cell(upRow+5, 2, upRow+5, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(total_eighty_g_amount_gross).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).number(total_eighty_g_amount_gross).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);
                    }
                    if(deduction_u_chapter_sub_child_80_T_final.length > 0) {
                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("(B) other sections (e.g. 80T etc.) under Chapter VI-A").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string('Gross Amount').style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).string('Qualifying Amount').style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string('Deductible Amount').style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("(d)Section 80T").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                        
                        deduction_u_chapter_sub_child_80_T_final.map(function(data, index){
                            var f_index = upRow+ 1 + index;
                            ws.cell(f_index, 1, f_index, 1, true).number(index+1).style(myStyle);
                            ws.cell(f_index, 2, f_index, 3, true).string(data.label).style(myStyle);
                            ws.cell(f_index, 4, f_index, 4, true).number(data.declaration_amount).style(myStyle4);
                            ws.cell(f_index, 5, f_index, 5, true).number(data.amount).style(myStyle4);
                            ws.cell(f_index, 6, f_index, 6, true).number(data.amount).style(myStyle4);
                            if(data.sub_head == '80TTA'){
                                eighty_tta_amount += parseFloat(data.declaration_amount);
                            }
                            if(data.sub_head == '80TTB'){
                                eighty_ttb_amount += parseFloat(data.declaration_amount);
                            }
                            
                            total_eighty_t_amount_deduct += parseFloat(data.amount);
                            total_eighty_t_amount_gross += parseFloat(data.declaration_amount);
                        });
                        upRow += deduction_u_chapter_sub_child_80_T_final.length +1;

                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80TTA").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_tta_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80TTB").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_ttb_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("").style(myStyle);
                        // ws.cell(upRow+5, 2, upRow+5, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(total_eighty_t_amount_gross).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).number(total_eighty_t_amount_gross).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);
                    }
                    if(deduction_u_chapter_sub_child_80_U_final.length > 0) {
                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("(B) other sections (e.g. 80U etc.) under Chapter VI-A").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string('Gross Amount').style(myStyle);
                        ws.cell(upRow, 5, upRow, 5, true).string('Qualifying Amount').style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string('Deductible Amount').style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 1, true).string("(d)Section 80U").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                        ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                        ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                        
                        deduction_u_chapter_sub_child_80_U_final.map(function(data, index){
                            var f_index = upRow+ 1 + index;
                            ws.cell(f_index, 1, f_index, 1, true).number(index+1).style(myStyle);
                            ws.cell(f_index, 2, f_index, 3, true).string(data.label).style(myStyle);
                            ws.cell(f_index, 4, f_index, 4, true).number(data.declaration_amount).style(myStyle4);
                            ws.cell(f_index, 5, f_index, 5, true).number(data.amount).style(myStyle4);
                            ws.cell(f_index, 6, f_index, 6, true).number(data.amount).style(myStyle4);
                            if(data.sub_head == '80U'){
                                eighty_u_amount += parseFloat(data.declaration_amount);
                            }
                            total_eighty_u_amount_deduct += parseFloat(data.amount);
                            total_eighty_u_amount_gross += parseFloat(data.declaration_amount);
                        });
                        upRow += deduction_u_chapter_sub_child_80_T_final.length +1;

                        ws.cell(upRow, 1, upRow, 1, true).string("Section 80TTA").style(myStyle);
                        ws.cell(upRow, 2, upRow, 3, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(eighty_u_amount).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).string("-").style(myStyle);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);

                        upRow++;
                        ws.cell(upRow, 1, upRow, 3, true).string("").style(myStyle);
                        // ws.cell(upRow+5, 2, upRow+5, 4, true).string("").style(myStyle);
                        ws.cell(upRow, 4, upRow, 4, true).number(total_eighty_u_amount_gross).style(myStyle4);
                        ws.cell(upRow, 5, upRow, 5, true).number(total_eighty_u_amount_gross).style(myStyle4);
                        ws.cell(upRow, 6, upRow, 6, true).string("-").style(myStyle);
                    }
                    

                    var chapta_vi_10 = (total_eighty_c_amount_deduct + total_eighty_b_amount_deduct + total_eighty_e_amount_deduct + total_eighty_g_amount_deduct + total_eighty_t_amount_deduct + total_eighty_u_amount_gross);
                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("10. Aggregate of deductible amount under Chapter VI A").style(myStyle);
                    // ws.cell(upRow, 2, upRow, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).number(chapta_vi_10).style(myStyle4);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("").style(myStyle);
                    // ws.cell(upRow, 2, upRow, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).string("").style(myStyle2);

                    var chapta_vi_8_10 = (capital_gain_total - chapta_vi_10);
                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("11. Total Income (8-10)").style(myStyle);
                    // ws.cell(upRow+4, 2, upRow+4, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).number(chapta_vi_8_10).style(myStyle4);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("12. Tax on total income").style(myStyle);
                    // ws.cell(upRow+4, 2, upRow+4, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).number(net_tax).style(myStyle4);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("13. Education cess @ 4% (on tax computed at S.No. 12)").style(myStyle);
                    // ws.cell(upRow+4, 2, upRow+4, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).number(health_education_cess).style(myStyle4);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("14. Tax Payable (12+13)").style(myStyle);
                    // ws.cell(upRow+4, 2, upRow+4, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).number((net_tax + health_education_cess + tax_on_total_income)).style(myStyle4);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("15. Less: Relief under section 89 (attach details)").style(myStyle);
                    // ws.cell(upRow+4, 2, upRow+4, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).number(rebate_u_s_87a).style(myStyle4);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("16. Tax Payable (14-15)").style(myStyle);
                    // ws.cell(upRow+4, 2, upRow+4, 4, true).string("").style(myStyle);
                    ws.cell(upRow, 4, upRow, 4, true).string("").style(myStyle2);
                    ws.cell(upRow, 5, upRow, 5, true).string("").style(myStyle2);
                    ws.cell(upRow, 6, upRow, 6, true).number((net_tax + health_education_cess + tax_on_total_income) - rebate_u_s_87a).style(myStyle4);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 6, true).string("Verification").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 6, true).string("I, ------------------------, son / daughter of -------------------- working in the capacity of ---------------------- (designation) do hereby certify \n that a sum of Rs.------------ [Rs. ----------------------------------- (in Words) has been deducted and deposited to the credit of the Central \n Government. I further certify that the information given above is true, complete and correct and is based on the books of account,\n documents, TDS statements, TDS deposited and other available records.").style(myStyle);
                    
                    upRow++;
                    ws.cell(upRow, 1, upRow, 1, true).string("Place").style(myStyle);
                    ws.cell(upRow, 2, upRow, 2, true).string("KOLKATA").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 1, true).string("Date").style(myStyle);
                    ws.cell(upRow, 2, upRow, 2, true).date(new Date()).style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 1, true).string("").style(myStyle);
                    ws.cell(upRow, 2, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 1, true).string("").style(myStyle);
                    ws.cell(upRow, 2, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("Signature of person responsible for deduction of tax").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 3, true).string("Designation: ");
                    ws.cell(upRow, 4, upRow, 6, true).string("Full Name: ");

                    upRow = upRow + 3;
                    ws.cell(upRow, 1, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("Notes: (Need not be printed. Only for info.)").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("1. If an assessee is employed under more than one employer during the year, each of the employers shall issue Part A of the certificate in Form 16 pertaining to the period for which such assessee was employed with each of the employers. Part B may be issued by each of the employers or the last employer at the option of the assessee.").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("2. Government deductors to enclose Annexure -A if tax is paid without production of an income-tax challan and Annexure-B if tax is paid accompanied by an income-tax challan.").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("3. Non-Government deductors to enclose Annexure-B.").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("4. The deductor shall furnish the address of the Commissioner of Income-tax(TDS) having jurisdiction as regards TDS statements of the assessee.").style(myStyle);

                    upRow++;
                    ws.cell(upRow, 1, upRow, 2, true).string("").style(myStyle);
                    ws.cell(upRow, 3, upRow, 6, true).string("5. This Form shall be applicable only in respect of tax deducted on or after 1st day of April, 2010.").style(myStyle);
                    ws.addDataValidation({
                      type: "list",
                      allowBlank: false,
                      prompt: "Gender",
                      error: "Invalid choice was chosen",
                      showDropDown: true,
                      sqref: "C1",
                      formulas: ["Male,Female,Senior Citizen"],
                    });
                    const corporateIdFolder = `storage/company/temp_files/${req.authData.corporate_id}/tds_report/`;
                    if (!fs.existsSync(corporateIdFolder)) {
                      fs.mkdirSync(corporateIdFolder);
                    }
                    await wb.write("storage/company/temp_files/"+req.authData.corporate_id+"/tds_report/"+employee.emp_id+"-tds-16-report.xlsx");
                    await path_array.push({ 
                        // "link": 'D:/node/payrollbackend/'+file_path+file_name,
                        "link": absolutePath+"/storage/company/temp_files/"+req.authData.corporate_id+"/tds_report/"+employee.emp_id+"-tds-16-report.xlsx",
                        "file_name":employee.emp_id+"-tds-16-report.xlsx",
                    });
                })).then(async (emp) => { 
                    var path_link = null;
                    // if(path_array.length > 0){
                    //     var dir = absolutePath+"/storage/company/tds_report/";
                    //     if (!fs.existsSync(dir)){
                    //         fs.mkdirSync(dir);
                    //     }
                    //     const output = fs.createWriteStream(dir+'tds-16-report.zip');
                    //     const archive = archiver('zip', {
                    //         zlib: { level: 9 } 
                    //     });
                    //     output.on('close', () => {
                    //         console.log('Archive finished.');
                    //     });
                    //     archive.on('error', (err) => {
                    //         console.log('Error.',err);
                    //     });
                    //     archive.pipe(output);
                    //     await Promise.all(path_array.map( async function(parray) {
                    //         await archive.append(fs.createReadStream(parray.link), { name: parray.file_name });
                    //     }));
                    //     archive.finalize();
                    //     path_link = baseurl+'storage/company/tds_report/tds-16-report.zip';

                    // }
                    return resp.status(200).json({ status: "success",  message: 'TDS Report Generated successfully.', url:path_link});
                });
            });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    tds_console_listing: async function(req, resp, next){
        try{
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
            

            
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);

            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authData.user_id] } },
                    { approval_status: { $in: ['active','approved'] } },
                    ],
                },
            };

            var filter_option = {};
            
            var search_option_details = { $match: {} };
            if (req.body.searchkey) {
                search_option = {
                    $match: {
                        $text: { $search: req.body.searchkey },
                        corporate_id: req.authData.corporate_id,
                    },
                };
            }
            else{
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
                if (req.body.emp_id) {
                    search_option.$match.emp_id = {
                        $regex: req.body.emp_id,
                        $options: "i",
                    };
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
            search_option_details.$match['employee_tds_calculations']=  {$exists: true , $ne: []} ;
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
                    $lookup:{
                        from: 'employee_tds_calculations',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": {
                                $and :[
                                    {"$expr": { "$eq": ["$employee_id", "$$emp_db_idVar"] }},
                                    {$or:[ 
                                            {'wage_year': {$gt: start_year }}, 
                                            { $and:[
                                                {'wage_year': {$gte: start_year }},
                                                {'wage_month': {$gte: start_month }}
                                                ]
                                            } 
                                        ]
                                    },
                                    { $or:[ 
                                            {'wage_year': {$lt: end_year }}, 
                                            { $and:[
                                                {'wage_year': {$lte: end_year }},
                                                {'wage_month': {$lte: end_month }}
                                                ]
                                            } 
                                        ]
                                    }
                                ] 
                            } 
                        }],
                        as: 'employee_tds_calculations',
                    }
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
                        localField: "companies._id",
                        foreignField: "company_id",
                        as: "company_details",
                    },
                },
                search_option_details,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        companies: {
                            $arrayElemAt: ["$companies", 0],
                        },
                        company_details: {
                            $arrayElemAt: ["$company_details", 0],
                        },
                        declarations: {
                            $arrayElemAt: ["$declarations", 0],
                        },
                        tds_templates: {
                            $arrayElemAt: ["$tds_templates", 0],
                        },
                        taxable_earning: {
                            $sum : "$employee_tds_calculations.rebate_amount"
                        },
                        total_tax: {
                            $sum : "$employee_tds_calculations.taxable_amount"
                        },
                        total_deducted: {
                            $sum : "$employee_tds_calculations.pre_taxable_amount"
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        userid: 1,
                        emp_id: 1,
                        pan_no: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        client_code: 1,
                        created_at: 1,
                        is_hod: 1,
                        status: 1,
                        approval_status: 1,
                        // employee_tds_calculations:1,
                        "employee_details.template_data.tds_temp_data.frequency":1,
                        // companies:1,
                        // company_details:1,
                        taxable_earning:1,
                        total_tax:1,
                        total_deducted:1,
                    },
                },
            ]);
            Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
                if (err) return resp.json({ status: "error", message: err.message });
                return resp.status(200).json({ status: "success", employees: employees });
            });
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    }
};
async function getMonthsInRange(startDate, endDate) {
    var months;
    months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();
    return months <= 0 ? 0 : months;
}
