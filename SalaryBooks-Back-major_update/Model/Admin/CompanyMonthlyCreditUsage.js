var db = require('../../db');
var mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var companyMonthlyCreditSchema = Schema({
    corporate_id : {type: String, required: true},
    wage_month : {type: Number},
    wage_year  : {type: Number},
    company_id : {type: Schema.Types.ObjectId},
    plan_id : {type: Schema.Types.ObjectId},
    total_monthly_rental_cost : {type:Number,required: false},
    total_employee_cost : {type:Number,required: false},
    total_free_employee : {type:Number,required: false},
    total_additional_employee : {type:Number,required: false},
    total_staff_cost : {type:Number,required: false},
    total_free_staff : {type:Number,required: false},
    total_additional_staff : {type:Number,required: false},
    total_salary_temp_cost : {type:Number,required: false},
    total_additional_salary_temp : {type:Number,required: false},
    total_salary_head_cost : {type:Number,required: false},
    total_additional_salary_head : {type:Number,required: false},
    total_cost : {type:Number,required: false},
    plan: { type: Schema.Types.Mixed },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    credit_balance:{type:Number,required: true},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  companyMonthlyCreditSchema.plugin(aggregatePaginate);
var CompanyCreditUsage = db.model('company_monthly_credit_usage',companyMonthlyCreditSchema);
module.exports = CompanyCreditUsage;