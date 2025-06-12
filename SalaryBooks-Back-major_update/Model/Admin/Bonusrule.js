var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var bonusruleSchema = Schema({
    corporate_id    : {type: String, required: true},
    gov_document_no    : {type: String, required: true},
    effective_date:{ type: Date ,required: true },
    min_service_qualify    : {type: Number, required: true},
    max_bonus    : {type: Number, required: true},
    max_bonus_wage    : {type: Number, required: true},
    eligible_capping    : {type: String, required: true},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    history:Schema.Types.Mixed,
  }, {strict: true});
  bonusruleSchema.plugin(mongoosePaginate);
var BonusRule = db.model('bonus_rules',bonusruleSchema);
module.exports = BonusRule;