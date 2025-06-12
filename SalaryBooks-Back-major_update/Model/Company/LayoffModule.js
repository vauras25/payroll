var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var layoffModuleSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    emp_id    : {type: String},
    wage_value  : {type: String},
    wage_month_from : {type: Number},
    wage_year_from : {type: Number},
    wage_month_to : {type: Number},
    wage_year_to : {type: Number},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    start_date:{ type: Date ,default: Date.now() },
    end_date:{ type: Date ,default: Date.now() },
    created_at:{ type: Date ,default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  layoffModuleSchema.plugin(mongoosePaginate);
var layoffModule = db.model('layoff_modules', layoffModuleSchema);
module.exports = layoffModule;