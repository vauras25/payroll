var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var epforuleSchema = Schema({
    corporate_id    : {type: String, required: true},
    circular_no    : {type: String, required: true},
    pf_employer_contribution    : {type: Number, required: true},
    total_employer_contribution    : {type: Number, required: true},
    pf_employee_contribution    : {type: Number, required: true},
    total_employee_contribution    : {type: Number, required: true},
    pension_employer_contribution    : {type: Number, required: true},
    pension_employer_contribution_restrict    : {type: String, enum: ['yes', 'no'],required: true},
    retirement_age    : {type: Number, required: true},
    edli_employer_contribution    : {type: Number, required: true},
    edli_employer_contribution_restrict    : {type: String, enum: ['yes', 'no'],required: true},
    wage_ceiling    : {type: Number, required: true},
    admin_charges    : {type: Number, required: true},
    admin_charges_restrict    : {type: String, enum: ['yes', 'no'],required: true},
    minimum_admin_charges    : {type: Number, required: true},
    edli_admin_charges    : {type: Number, required: true},
    edli_admin_charges_restrict    : {type: String, enum: ['yes', 'no'],required: true},
    round_off    : {type: String, enum: ['up', 'off', 'down'],required: true},
    effective_date:{ type: Date ,required: true },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    history:Schema.Types.Mixed,
  }, {strict: true});
  epforuleSchema.plugin(mongoosePaginate);
var EpfoRule = db.model('epfo_rules',epforuleSchema);
module.exports = EpfoRule;