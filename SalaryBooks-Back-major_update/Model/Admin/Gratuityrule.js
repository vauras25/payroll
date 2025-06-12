var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var gratuityruleSchema = Schema({
    corporate_id    : {type: String, required: true},
    employee_no    : {type: Number, required: true},
    employee_no_applicable:{type: String, enum: ['yes', 'no'],required: true},
    employee_no_rule    : {type: String, enum: ['greater', 'less', 'greaterthanequal','lessthanequal','equal','none'],required: true},
    service_year_no    : {type: Number, required: true},
    service_year_no_applicable:{type: String, enum: ['yes', 'no'],required: true},
    service_year_no_rule    : {type: String, enum: ['greater', 'less', 'greaterthanequal','lessthanequal','equal','none'],required: true},
    fifth_year_atrendance    : {type: Number, required: true},
    fifth_year_atrendance_applicable:{type: String, enum: ['yes', 'no'],required: true},
    fifth_year_atrendance_rule    : {type: String, enum: ['greater', 'less', 'greaterthanequal','lessthanequal','equal','none'],required: true},
    max_gratuity_anual    : {type: Number, required: true},
    max_gratuity_anual_applicable:{type: String, enum: ['yes', 'no'],required: true},
    max_gratuity_anual_rule    : {type: String, enum: ['greater', 'less', 'greaterthanequal','lessthanequal','equal','none'],required: true},
    income_tax_applicable:{type: String, enum: ['yes', 'no'],required: true},
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
  gratuityruleSchema.plugin(mongoosePaginate);
var GratuityRule = db.model('gratuity_rules',gratuityruleSchema);
module.exports = GratuityRule;