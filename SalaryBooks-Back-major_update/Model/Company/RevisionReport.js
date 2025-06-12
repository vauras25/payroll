var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var revisionreportSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    revision_unique_id:{type:String,required:true},
    run_revision_status:{type:String,enum: ['pending', 'calculated','generated']},
    bank_ins_referance_id:{type: String},
    // pf_challan_referance_id:{type: String},
    // esic_challan_referance_id:{type: String},
    revision_id:{type: Schema.Types.ObjectId, required: true},
    emp_id: {type: String, required: true},
    template_data:Schema.Types.Mixed,
    salary_temp_id:{type: Schema.Types.ObjectId, required: true},
    policy_pack_id:{type: Schema.Types.ObjectId, required: true},
    revision_log:{type : Schema.Types.Mixed},
    gross_salary:{type: String},
    effect_from:{ type: Date,required: true },
    revision_month:{ type: Number,required: true },
    revision_year:{ type: Number,required: true },
    consolidated_arrear_report:{type:Schema.Types.Mixed},
    created_at:{ type: Date,default: Date.now },
    updated_at:{ type: Date, default: Date.now },
    
  }, {strict: false});
  revisionreportSchema.plugin(mongoosePaginate);
var RevisionReport = db.model('revision_reports',revisionreportSchema);
module.exports = RevisionReport;