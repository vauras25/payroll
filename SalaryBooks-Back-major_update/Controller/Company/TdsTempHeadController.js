var Company = require('../../Model/Admin/Company');
var TdsTempHead = require('../../Model/Company/TdsTempHead');
const { Validator } = require('node-input-validator');
var Site_helper = require("../../Helpers/Site_helper");
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
const moment = require('moment');
module.exports = {
    get_tds_temp_head: async function (req, resp, next) {
        try{
            var companyData = await Company.findOne({'_id':req.authId});
            if(!companyData){
                return resp.status(200).json({ 'status': "error", 'message': 'Company not found.'});
            }
            var existData = await TdsTempHead.findOne({company_id:companyData._id});
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
    add_tds_head_data: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
                heads: 'required',
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
                heads: req.body.heads,
                status:"active"
            };
            TdsTempHead.create(data,  function (err, tds_temp_head) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"TDS head created successfully", data: tds_temp_head });
            })
            
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
 

};