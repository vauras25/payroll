var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var revision_master_reportsReportSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    emp_id         : {type: String},
    wage_month  : {type: String},
    wage_year  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  revision_master_reportsReportSchema.plugin(mongoosePaginate);
var revision_master_reports = db.model('revision_master_reports',revision_master_reportsReportSchema);
module.exports = revision_master_reports;