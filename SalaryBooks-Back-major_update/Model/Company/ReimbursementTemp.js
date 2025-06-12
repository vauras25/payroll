var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var reimbursementSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_id  :{type:String},  
    head_id  : {type: String},
    amount  : {type: String},
    wage_month  : {type: String},
    wage_year  : {type: String},
    document  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive', 'pending','rejected'],
        required: true
    },
    employee_remark  : {type: String},
    company_remark  : {type: String},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  reimbursementSchema.plugin(aggregatePaginate);
var reimbursements = db.model('reimbursement_temp',reimbursementSchema);
module.exports = reimbursements;