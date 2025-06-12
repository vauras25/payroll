var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var ptaxruleSchema = Schema({
    template_name    : {type: String, required: false},
    corporate_id    : {type: String, required: true},
    state_id    : {type: String},
    state_name    : {type: String, required: true},
    effective_from:{ type: Date ,required: true },
    tax_range_amount    :[
        {
            amount_from    : {type: Number, required: true},
            amount_to    : {type: Number, required: true},
            tax_amount    : {type: Number, required: true},
            last_slab : {
                type: String, 
                enum: ["yes", "no"],
                default:"no",
                required: true,
            }
        }
    ],
    periods: { type: Array, default: [] },
    settlement_frequency:{
        type: String, 
        enum: ['monthly', 'quaterly','half_yearly','yearly'],
        required: true
    },
    salary_type:{
        type: String, 
        enum: ['fixed', 'earned'],
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
}, {strict: true});
  ptaxruleSchema.plugin(mongoosePaginate);
  
var Ptaxrule = db.model('ptax_rules',ptaxruleSchema);
module.exports = Ptaxrule;