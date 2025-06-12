var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var bankInsSchema = Schema({
    corporate_id    : {type: String, required: true},
    creatror_id    : {type: Schema.Types.ObjectId},
    creatror_name:{type:String},
    file_id    : {type: String, required: true},
    xlsx_file_name  : {type: String},
    wage_month  : {type: Number},
    wage_year  : {type: Number},
    pay_type  : {
      type: String, 
      enum: ['earning','salary', 'supplement_salary','incentive','bonus','ot','reimbursment','arrear', 'advance','leave','extra_earning'],
      required: true
    },
    instruction_type :{
      type: String, 
      enum: ['bank','voucher'],
      required: false
    },
    status:{
        type: String, 
        enum: ['active', 'inactive','confirm'],
        required: true
    },
    remarks:{type: String},
    confirmation_log:{type:String},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  bankInsSchema.plugin(mongoosePaginate);
var bank_instruction = db.model('bank_instructions',bankInsSchema);
module.exports = bank_instruction;