var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var AfterCutoffAttendanceSummary = Schema({
  corporate_id    : {type: String, required: true},
  emp_id: {type: String,  required: true},
  attendance_month:{type: String, required: true},
  attendance_year:{type: String, required: true},
  total_attendance:{type: String, required: true},
  total_absent:{type: String, required: true},
  total_overtime:{type: String, required: true},
  total_lop:{type: String, required: true},
  total_cl:{type: String, required: true},
  total_pl:{type: String, required: true},
  total_gl:{type: String, required: true},
  total_hl:{type: String, required: true},
  total_wo:{type: String, required: true},
  paydays:{type: String, required: true},
  total_late:{type: String, required: true},
  status    : {
        type: String, 
    enum: ['active', 'inactive'],
    required: true
  },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
AfterCutoffAttendanceSummary.plugin(aggregatePaginate);
let ACAttendanceSummary = db.model('after_cutoff_attendance_summaries', AfterCutoffAttendanceSummary);
module.exports = ACAttendanceSummary;
