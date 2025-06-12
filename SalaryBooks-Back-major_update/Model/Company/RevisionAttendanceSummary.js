var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var RevisionAttendanceSummarySchema = Schema({
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
  adjust_day:{type: Number, required: true},
  total_present:{type: Number, required: true},
  holiday:{type: Number, required: true},
  status    : {
        type: String, 
    enum: ['active', 'inactive'],
    required: true
  },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
RevisionAttendanceSummarySchema.plugin(aggregatePaginate);
let Revision_Attendance_summaries = db.model('revision_attendance_summaries', RevisionAttendanceSummarySchema);
module.exports = Revision_Attendance_summaries;
