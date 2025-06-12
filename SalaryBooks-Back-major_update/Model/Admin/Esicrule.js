var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var esicruleSchema = Schema({
    corporate_id    : {type: String, required: true},
    circular_no    : {type: String, required: true},
    employer_contribution    : {type: Number, required: true},
    employee_contribution    : {type: Number, required: true},
    wage_ceiling    : {type: Number, required: true},
    round_off    : {type: String, enum: ['up', 'off', 'down'],required: true},
    contribution_period_a_from    : {type: String, required: true},
    contribution_period_a_to    : {type: String, required: true},
    contribution_period_b_from    : {type: String, required: true},
    contribution_period_b_to    : {type: String, required: true},
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

  esicruleSchema.plugin(mongoosePaginate);
var EsicRule = db.model('esic_rules',esicruleSchema);
module.exports = EsicRule;