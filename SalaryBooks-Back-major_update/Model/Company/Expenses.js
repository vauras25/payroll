var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var expenseSchema = Schema({
    corporate_id    : {type: String, required: true},
    amount    : {type: String, required: true},
    hod  : {type: String},
    exp_date:{ type: Date ,required: true },
    description  : {type: String},
    expense_docu: {type: String},
    settlement_status:{
      type: String, 
      enum: ['pending', 'approve', 'rejected', 'hold'],
      required: true
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  expenseSchema.plugin(mongoosePaginate);
var expense = db.model('expenses',expenseSchema);
module.exports = expense;