var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var packageSchema = Schema({
    package_name: {type: String, required: true},
    gov_gratuity_rule:Schema.Types.Mixed,
    gov_pf_rule:Schema.Types.Mixed,
      gov_esic_rule:Schema.Types.Mixed,
      gov_ptax_rule:Schema.Types.Mixed,
      gov_bonus_rule:Schema.Types.Mixed,
      gov_tds_rule:Schema.Types.Mixed,
      gov_pf_rule_type:{
        type: String,
        enum: ['default', 'customizable']
      },
      gov_esic_rule_type:{
        type: String,
        enum: ['default', 'customizable']
      },
      gov_gratuity_rule_type:{
        type: String,
        enum: ['default', 'customizable']
      },
      gov_ptax_rule_type:{
        type: String,
        enum: ['default', 'customizable']
      },
      gov_bonus_rule_type:{
        type: String,
        enum: ['default', 'customizable']
      },
      gov_tds_rule_type:{
        type: String,
        enum: ['default', 'customizable']
      },
    status:{
        type: String,
        enum: ['active', 'inactive'], 
        required: true
      },
    created_at:{ type: Date,required: true },
    updated_at:{ type: Date, default: Date.now },
    module:Schema.Types.Mixed
  }, {strict: false});
  packageSchema.plugin(mongoosePaginate);
var Package = db.model('packages',packageSchema);
module.exports = Package;