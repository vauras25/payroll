var db = require('../../db');
var mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var companySchema = Schema({
    corporate_id    : {type: String, required: true},
    establishment_name    : {type: String, required: true},
    userid    : {type: String, required: true},
    email_id    : {type: String, required: true},
    phone_no    : {type: String, required: true},
    package_id    : {type: Schema.Types.ObjectId},
    reseller_id    : {type: Schema.Types.ObjectId},
    plan_id    : {type: Schema.Types.ObjectId, required: true},
    password    : {type: String, required: true},
    parent_hods:{type : Schema.Types.Mixed},
    status:{
        type: String, 
        enum: ['active', 'inactive', 'deactivated'],
        required: true
    },
    suspension:{
        type: String, 
        enum: ['active','input_suspended', 'account_suspended'],
        default:'active'
    },
    credit_stat:{type:Number,required: true},
    hold_credit:{type:Number,required: true},
    com_logo:{type: String},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    user_type:String
  }, {strict: false});
  companySchema.plugin(aggregatePaginate);
var Company = db.model('companies',companySchema);
module.exports = Company;