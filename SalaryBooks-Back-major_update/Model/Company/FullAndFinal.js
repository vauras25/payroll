var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var fullAndFinalSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    emp_id         : {type: String},
    payfor_payment_data: {type: Schema.Types.Mixed, default: null},
    salary_breakup_data: {type: Schema.Types.Mixed, default: null},
    leave_encashment_data: {type: Schema.Types.Mixed, default: null},
    bonus_data  : {type: Schema.Types.Mixed, default: null},
    incentive_data    : {type: Schema.Types.Mixed, default: null},
    advance_data    : {type: Schema.Types.Mixed, default: null},
    salary_report    : {type: Schema.Types.Mixed, default: null},
    incentive_amount:Number,
    bonus_amount:Number,
    advance_amount:Number,
    tds_amount:Number,
    gratuity_amount:Number,
    is_notice_pay:Boolean,
    leave_encashment_amount:Number,
    other_payable_amounts:Number,
    total_payable:Number,
    total_income:Number,
    other_deduction:Number,
    other_contribution:Number,
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  fullAndFinalSchema.plugin(mongoosePaginate);
var Full_and_final = db.model('full_and_finals',fullAndFinalSchema);
module.exports = Full_and_final;