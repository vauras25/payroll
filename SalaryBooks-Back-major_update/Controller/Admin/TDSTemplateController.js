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
const { Validator } = require('node-input-validator');
var Site_helper = require("../../Helpers/Site_helper");
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
const moment = require('moment');
module.exports = {
    get_tds: async function (req, resp, next) {
        try{
            if(req.body.tds_template_id){
                var existData = await TdsTemplate.findOne({"_id":mongoose.Types.ObjectId(req.body.tds_template_id),"status":"publish"});
            }
            else{
                var existData = await TdsTemplate.findOne({company_id:req.authId, "status":"publish"});
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
           

            var data = {
                corporate_id: req.authData.corporate_id,
                company_id: req.authId,
                salary_head_to_earning_head: req.body.salary_head_to_earning_head ?JSON.parse(JSON.stringify(req.body.salary_head_to_earning_head)):'',
                define_deductions_rebate: req.body.define_deductions_rebate ? req.body.define_deductions_rebate : 'no',
                define_deductions_rebate_financial_year: req.body.define_deductions_rebate_financial_year ? req.body.define_deductions_rebate_financial_year : new Date().getFullYear(),
                define_deductions_rebate_status: req.body.define_deductions_rebate_status,
                status:"publish"
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

            if(req.body.template_id){
                TdsTemplate.updateOne({'_id':mongoose.Types.ObjectId(req.body.template_id)},data,  function (err, tds_template) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success', message:"TDS updated successfully", data: tds_template });

                })
            }
            else{
                var exist = await TdsTemplate.findOne({company_id:req.authId,'define_deductions_rebate_financial_year':req.body.define_deductions_rebate_financial_year});

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
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_tds_list: async function (req, resp, next) {
        try{
            
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
                    "company_id": mongoose.Types.ObjectId(req.authId),
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
};