var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var monthly_reportsReportSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    emp_id         : {type: String},
    referance_id   :{type: String},
    wage_month  : {type: Number},
    wage_year  : {type: Number},
    total_update  : {type: Number , default:1},
    emp_data:   {type: Schema.Types.Mixed, default: null},
    salary_report: {type: Schema.Types.Mixed, default: null},
    extra_earning_report: {type: Schema.Types.Mixed, default: null},
    supplement_salary_report    : {type: Schema.Types.Mixed, default: null},
    bonus_report    : {type: Schema.Types.Mixed, default: null},
    incentive_report    : {type: Schema.Types.Mixed, default: null},
    ot_report    : {type: Schema.Types.Mixed, default: null},
    advance_report    : {type: Schema.Types.Mixed, default: null},
    reimbursment_report    : {type: Schema.Types.Mixed, default: null},
    final_report  : {type: Schema.Types.Mixed},
    shift_allawance_report:{type: Schema.Types.Mixed, default: null},
    arrear_report:{type: Schema.Types.Mixed, default: null},
    encash_payment_report:{type: Schema.Types.Mixed, default: null},
    total_data:{type: Schema.Types.Mixed, default: null},
    ins_generate:{
      type: String, 
      enum: ['no', 'yes'],
      default:'no'
    },
    pf_generate:{
      type: String, 
      enum: ['no', 'yes'],
      default:'no'
    },
    esic_generate:{
      type: String, 
      enum: ['no', 'yes'],
      default:'no'
    },
    instruction_type :{
      type: String, 
      enum: ['bank','voucher'],
      required: false
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  monthly_reportsReportSchema.plugin(mongoosePaginate);
var monthly_reports = db.model('employee_monthly_reports',monthly_reportsReportSchema);
module.exports = monthly_reports;