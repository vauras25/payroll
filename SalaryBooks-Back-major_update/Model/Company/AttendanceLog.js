var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var AttendanceLogSchema = Schema({
  corporate_id : {type: String, required: false},
  emp_id : {type: String, required: false},
  employee_attendance_id    : {type: Schema.Types.ObjectId, required: false, ref: "employees_attendances"},
  wage_month  : {type: Number},
  wage_year  : {type: Number}, 
  attendance_date    : {type: String, required: false},
  entries: [{
    entry_time: {type: String},
    entry_type: {type: String}
  }],                                                                        
  status    : {
    type: String, 
    enum: ['active', 'inactive','pending'],
    required: true
  },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
AttendanceLogSchema.plugin(aggregatePaginate);
let AttendanceLog = db.model('attendance_logs', AttendanceLogSchema);
module.exports = AttendanceLog;
