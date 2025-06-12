var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var tdsruleSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    application_methode:{
        type: String, 
        enum: ['progreesive_acual_investment', 'progreesive_assumed_investment','one_time','assumed'],
        required: true
    },
    frequency    : {
        type: String, 
        enum: ['monthly', 'quaterly','half_yearly','yearly', 'not_defined'],
        required: true
    },
    deadline_day    : {type: Number, required: true},
    deadline_month    : {type: Number, required: true},
    income_tax_slab    : {type: String, required: true},
    tds_rule    : {type: String, required: true},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    regime:{
        type: String, 
        enum: ['old_regime', 'new_regime'],
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
}, {strict: true});
  tdsruleSchema.plugin(mongoosePaginate);
var Trdrule = db.model('tds_rules',tdsruleSchema);
module.exports = Trdrule;