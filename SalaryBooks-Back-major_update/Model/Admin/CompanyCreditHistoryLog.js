var db = require('../../db');
var mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var companyCreditHistoryLogSchema = Schema({
    corporate_id : {type: String, required: true},
    wage_month : {type: Number},
    wage_year  : {type: Number},
    company_id : {type: Schema.Types.ObjectId},
    type:{
        type: String, 
        enum: ['award', 'deduct', 'hold', 'release', 'credit' , 'consumed', 'credit_coupon'],
        required: true
    },
    details: { type: Schema.Types.Mixed },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    balance:{type:Number,required: true},
    credit_balance:{type:Number,required: true},
    created_at:{ type: Date , default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  companyCreditHistoryLogSchema.plugin(aggregatePaginate);
var CompanyCreditHistoryLogs = db.model('company_credit_history_logs',companyCreditHistoryLogSchema);
module.exports = CompanyCreditHistoryLogs;