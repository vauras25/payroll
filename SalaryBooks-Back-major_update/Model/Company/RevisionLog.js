var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var revisionlogSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    revision_log_unique_id:{type:String,required:true},
    run_revision_status:{type:String,enum: ['pending', 'calculated','generated']},
    revision_id:{type: Schema.Types.ObjectId, required: true},
    emp_id: {type: String, required: true},
    template_data:Schema.Types.Mixed,
    prev_template_data:Schema.Types.Mixed,
    salary_temp_id:{type: Schema.Types.ObjectId, required: true},
    prev_salary_temp_id:{type: Schema.Types.ObjectId, required: true},
    policy_pack_id:{type: Schema.Types.ObjectId, required: true},
    prev_policy_pack_id:{type: Schema.Types.ObjectId, required: true},
    revision_log:{type : Schema.Types.Mixed},
    prev_gross_salary:{type: String},
    gross_salary:{type: String},
    effect_from:{ type: Date,required: true },
    revision_month:{ type: Number,required: true },
    revision_year:{ type: Number,required: true },
    created_at:{ type: Date,default: Date.now },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  revisionlogSchema.plugin(mongoosePaginate);
var RevisionLog = db.model('revision_logs',revisionlogSchema);
module.exports = RevisionLog;