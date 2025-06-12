var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var holdSalaryReportSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    emp_id         : {type: String},
    wage_month  : {type: String},
    wage_year  : {type: String},
    autohold_type_disburse  : {
        type: String, 
        enum: ['salary', 'salaryWithCom'],
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  holdSalaryReportSchema.plugin(mongoosePaginate);
var holdSalaryList = db.model('hold_salary_emps',holdSalaryReportSchema);
module.exports = holdSalaryList;