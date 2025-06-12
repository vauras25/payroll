var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var bonusSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    min_service    : {type: Number, required: true},
    max_bonus:{ type: Number ,required: true },
    max_bonus_wage:{ type: Number ,required: true },
    eligible_capping:{ type: Number ,required: true },
    auto_fill_archive:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    tds_apply:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    esic_apply:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    pt_apply:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    epfo_apply:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
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
    disbursement_frequency:Schema.Types.Mixed,
    disbursement_type:Schema.Types.Mixed,
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    history:Schema.Types.Mixed,
  }, {strict: false});
  bonusSchema.plugin(mongoosePaginate);
var BonusTemp = db.model('bonus_templates',bonusSchema);
module.exports = BonusTemp;