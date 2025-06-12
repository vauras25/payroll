var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var yearlyHolidaysSchema = Schema({
  corporate_id    : {type: String, required: true},
  created_by    : {type: String, required: true},
  effective_from    : {type: Date, required: true},
  effective_to    : {type: Date, required: true},
  holiday_date    : {type: Date, required: true},
  holiday_reason    : {type: String},
    status    : {
        type: String, 
    enum: ['active', 'inactive'],
    required: true
  },
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
yearlyHolidaysSchema.plugin(aggregatePaginate);
let yearly_holidays = db.model('yearly_holidays', yearlyHolidaysSchema);
module.exports = yearly_holidays;
