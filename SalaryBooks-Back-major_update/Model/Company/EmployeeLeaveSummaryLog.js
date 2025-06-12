var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
Schema = mongoose.Schema;
var EmployeeLeaveSummaryLog = Schema({
    corporate_id    : {type: String, required: true},
    employee_id    : {type: Schema.Types.ObjectId, required: true},
    wage_month  : {type: Number},
    wage_year  : {type: Number},
    history: { type: Schema.Types.Mixed },
    type: {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date , default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false});
EmployeeLeaveSummaryLog.plugin(aggregatePaginate);
var EmployeeLeaveSummaryLogs = db.model('employee_leave_summary_log',EmployeeLeaveSummaryLog);
// mongoose.set('debug', function (coll, method, query) {
//       console.log(query);
//      });
module.exports = EmployeeLeaveSummaryLogs;