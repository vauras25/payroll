var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
Schema = mongoose.Schema;
var MonthlyEmpLeaveSummary = Schema({
    corporate_id    : {type: String, required: true},
    employee_id    : {type: Schema.Types.ObjectId, required: true},
    wage_month  : {type: Number},
    wage_year  : {type: Number},
    leave_head: { type: Schema.Types.Mixed },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date , default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false});
MonthlyEmpLeaveSummary.plugin(aggregatePaginate);
var MonthlyEmpLeaveSummaries = db.model('monthly_employee_leave_summary',MonthlyEmpLeaveSummary);
// mongoose.set('debug', function (coll, method, query) {
//       console.log(query);
//      });
module.exports = MonthlyEmpLeaveSummaries;