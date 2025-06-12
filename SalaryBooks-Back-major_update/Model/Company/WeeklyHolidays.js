var db = require('../../db');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var weeklyHolidaysSchema = Schema({
  corporate_id    : {type: String, required: true},
  created_by    : {type: String, required: true},
  effective_from    : {type: Date, required: true},
  weekday    : {type: String, required: true},
  weekday_no    : {type: Number, required: true},
  weeks    : {
        1:{
          first_half:{type: String, enum: ['yes', 'no']},
          second_half:{type: String, enum: ['yes', 'no']}
        },
        2:{
            first_half:{type: String, enum: ['yes', 'no']},
            second_half:{type: String, enum: ['yes', 'no']}
        },
        3:{
            first_half:{type: String, enum: ['yes', 'no']},
            second_half:{type: String, enum: ['yes', 'no']}
        },
        4:{
            first_half:{type: String, enum: ['yes', 'no']},
            second_half:{type: String, enum: ['yes', 'no']}
        },
        5:{
            first_half:{type: String, enum: ['yes', 'no']},
            second_half:{type: String, enum: ['yes', 'no']}
        }
    },
    status    : {
        type: String, 
    enum: ['active', 'inactive'],
    required: true
  },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
weeklyHolidaysSchema.plugin(mongoosePaginate);
let weekly_holidays = db.model('weekly_holidays', weeklyHolidaysSchema);
module.exports = weekly_holidays;
