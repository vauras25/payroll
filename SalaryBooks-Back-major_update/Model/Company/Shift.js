var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var shiftSchema = Schema({
    corporate_id    : {type: String, required: true},
    shift_name    : {type: String, required: true},
    shift1_start_time    : {type: String},
    shift1_end_time    : {type: String},
    shift2_start_time    : {type: String},
    shift2_end_time    : {type: String},
    shift_allowance    : {type: String},
    overtime    : {type: String},
    company_late_allowed    : {type: String},
    company_early_arrival    : {type: String},
    break_shift    : {type: String},
    effective_date    : {type: Date, required: true},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: true});
  shiftSchema.plugin(mongoosePaginate);
var Shift = db.model('shifts',shiftSchema);
module.exports = Shift;