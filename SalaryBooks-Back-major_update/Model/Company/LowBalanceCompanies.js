// low_balance_companies
const mongoose = require("mongoose");
const db = require('../../db');

const lowBalanceCompaniesSchema = mongoose.Schema({
    corporate_id:String,
    input_suspended_on:String,
    acc_suspended_on:String,
    status:{type:String, enum:['active', 'input_suspended', 'account_suspended'], default:'active'},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false})

const lowBalanceCompany = db.model('low_balance_companies', lowBalanceCompaniesSchema);

module.exports = lowBalanceCompany