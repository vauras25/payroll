var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var AttendanceRegisterSchema = Schema({
  corporate_id    : {type: String, required: true},
  register_type    : {
        type: String, 
        enum: ['daily', 'monthly','hourly'],
        required: true
    },
    daily_type    : {
        type: String, 
        enum: ['wholeday', 'halfday','timebasis'],
    },                                                                             
    status    : {
            type: String, 
        enum: ['active', 'inactive','pending'],
        required: true
    },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
AttendanceRegisterSchema.plugin(aggregatePaginate);
let AttendanceRegister = db.model('attendance_registers', AttendanceRegisterSchema);
module.exports = AttendanceRegister;
