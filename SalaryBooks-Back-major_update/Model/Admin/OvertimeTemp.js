var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var overtimeSchema = Schema({
    template_name    : {type: String, required: true},
    overtime_type:{
        type: String, 
        enum: ['hourly_fix', 'daily_fix','hourly_per', 'daily_per'],
        required: true
    },
    overtime_rate    : {type: Number, required: true},
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
    n_a_applicable :{
        type: String, 
        enum: ['yes', 'no'],
        default: 'no'
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    history:Schema.Types.Mixed,
  }, {strict: false});
  overtimeSchema.plugin(mongoosePaginate);
var OvertimeTemp = db.model('overtime_templates',overtimeSchema);
module.exports = OvertimeTemp;