var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var AttendanceSummarySchema = Schema({
  corporate_id    : {type: String, required: true},
  emp_id: {type: String,  required: true},
  attendance_month:{type: String, required: true},
  attendance_year:{type: String, required: true},
  total_attendance:{type: Number, required: true},
  total_absent:{type: Number, required: true},
  total_overtime:{type: Number, required: true},
  total_lop:{type: Number, required: true},
  total_cl:{type: Number, required: true},
  total_pl:{type: Number, required: true},
  total_gl:{type: Number, required: true},
  total_hl:{type: Number, required: true},
  total_wo:{type: Number, required: true},
  paydays:{type: Number, required: true},
  total_late:{type: Number, required: true},
  total_late_hour:{type: Number, required: true},
  adjust_day:{type: Number, required: true},
  supplement_adjust_day:{type: Number, required: true},
  assumed_pre_day:{type: Number, required: true},
  total_present:{type: Number, required: true},
  holiday:{type: Number, required: true},
  next_month_data:Schema.Types.Mixed,
  shift_allowance:Schema.Types.Mixed,
  total_ANL:{type: Number, required: true},
  total_AWP:{type: Number, required: true},
  total_CSL:{type: Number, required: true},
  total_ERL:{type: Number, required: true},
  total_LE1:{type: Number, required: true},
  total_LE2:{type: Number, required: true},
  total_LP1:{type: Number, required: true},
  total_LP2:{type: Number, required: true},
  total_LP3:{type: Number, required: true},
  total_MDL:{type: Number, required: true},
  total_MTL:{type: Number, required: true},
  total_PDL:{type: Number, required: true},
  total_PTL:{type: Number, required: true},
  total_PVL:{type: Number, required: true},
  total_SKL:{type: Number, required: true},
  total_UWP:{type: Number, required: true},
  status    : {
    type: String, 
    enum: ['active', 'inactive'],
    required: true
  },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
AttendanceSummarySchema.plugin(aggregatePaginate);
let Attendance_summaries = db.model('attendance_summaries', AttendanceSummarySchema);
module.exports = Attendance_summaries;
