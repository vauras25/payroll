var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var incentiveSchema = Schema({
    template_name    : {type: String, required: true},
    min_hold    : {type: Number, required: true},
    max_hold:{ type: Number ,required: true },
    settlement_frequency:{
        type: String, 
        enum: ['monthly', 'quaterly','half_yearly','yearly'],
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
    pf_apply:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    pt_apply:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    eligble_disburse:{
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
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    history:Schema.Types.Mixed,
  }, {strict: false});
  incentiveSchema.plugin(mongoosePaginate);
var IncentiveTemp = db.model('incentive_templates',incentiveSchema);
module.exports = IncentiveTemp;