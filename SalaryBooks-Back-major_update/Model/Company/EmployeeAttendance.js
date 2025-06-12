var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var employeesAttendanceSchema = Schema({
  corporate_id    : {type: String, required: true},
  emp_id: {type: String, default:null},
  employee_id      : {type: String},
  register_type    : {
    type: String,
      enum: ["half_day", "time", "wholeday", "monthly"],
      required: true,
  },
  attendance_date    : {type: String, required: true},
  attendance_month:{type: String, required: true},
  attendance_year:{type: String, required: true},
  monthly_attendance:{type:Schema.Types.Mixed},
  first_half    : {type: String},
  second_half    : {type: String},
  login_time    : {type: String},
  logout_time    : {type: String},
  shift1_start_time    : {type: String},
  shift1_end_time    : {type: String},
  shift2_start_time    : {type: String},
  shift2_end_time    : {type: String},
  total_logged_in    : {type: String},
  shift_id:{type:Schema.Types.ObjectId},
  break_time    : [
    {
      break_stime    : {type: String},
      break_etime    : {type: String},
      total_break_time    : {type: String},
    }
  ],
  total_break_time    : {type: String},
  login_by    : {type: String,enum: ['biometric', 'hr_entry','web','csv'], required: true},
  attendance_stat:{type: String},
  status    : {
        type: String, 
    enum: ['active', 'inactive','pending'],
    required: true
  },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
employeesAttendanceSchema.plugin(aggregatePaginate);
let Employee_attendance = db.model('employees_attendances', employeesAttendanceSchema);
module.exports = Employee_attendance;
