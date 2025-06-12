var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var employee_sleet_tempSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    template_fields    : {type : Schema.Types.Mixed},
    temp_module_for:{
      type: String, 
      enum: ['arrear_sheet','salary_sheet','bonus_sheet','incentive_sheet','advance_sheet','employee_sheet','overtime_sheet']
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  employee_sleet_tempSchema.plugin(mongoosePaginate);
var employee_sleet_tempModel = db.model('employee_sheet_template',employee_sleet_tempSchema);
module.exports = employee_sleet_tempModel;