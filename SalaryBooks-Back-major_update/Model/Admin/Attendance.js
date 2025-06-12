var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var attendanceruleSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    last_day_of_month:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    cut_off_day_custom    : {type: Number},
    no_of_days:{ type: Number  },
    absent:{ type: Number  },
    grace_period:{ type: Number },
    register_type:{
        type: String, 
        enum: ['time', 'wholeday','halfday','monthly'],
        required: true
    },
    full_day_max_hours    : {type: Number},
    half_day_max_hours    : {type: Number},
    full_month_days:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    custom_days    : {type: Number},
    reporting_time    : {type: String, required: true},
    closing_time    : {type: String, required: true},
    comp_off        : {type: String, enum: ['yes', 'no'], required: true}, 
    sandwich_leave   : {type: String, enum: ['yes', 'no'], required: true}, 
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    publish_status:{
        type: String, 
        enum: ['published', 'privet'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    history:Schema.Types.Mixed,
  }, {strict: true});
  attendanceruleSchema.plugin(mongoosePaginate);
var AttendanceRule = db.model('attendance_rules',attendanceruleSchema);
module.exports = AttendanceRule;