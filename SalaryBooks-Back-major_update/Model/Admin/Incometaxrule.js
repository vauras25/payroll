var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var incometaxruleSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    category    : {type: Schema.Types.ObjectId, required: true},
    financial_year_from    : {type: Number, required: true},
    financial_year_to    : {type: Number, required: true},
    income_tax_slab:[
        {
            income_slab_from    : {type: Number, required: true},
            income_slab_to    : {type: Number, required: true},
            tax_rate    : {type: Number, required: true},
            additional_charge    : {type: Number, required: true},
            additional_cess    : {type: Number, required: true},
            last_slab : {
                type: String, 
                enum: ["yes", "no"],
                default:"no",
                required: true,
                set: function(value) {
                    return value === true ? "yes" : "no";
                }   
            }
        }
    ],
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
    history:Schema.Types.Mixed,
}, {strict: true});

incometaxruleSchema.pre('save', function(next) {
    // Loop through tax_range_amount array and check the value of last_slab
    this.income_tax_slab.forEach(range => {
        if (range.last_slab === "yes") {
            range.amount_to = 0; // Set amount_to to 0 if last_slab is "yes"
        }
    });
    next(); // Continue saving the document
});

  incometaxruleSchema.plugin(aggregatePaginate);
var IncometaxRule = db.model('incometax_rules',incometaxruleSchema);
module.exports = IncometaxRule;
//[{income_slab_from : 200000,income_slab_to    :300000,tax_rate    : 4,additional_charge    :2,additional_cess    : 1,},{income_slab_from : 200000,income_slab_to    :300000,tax_rate    : 4,additional_charge    :2,additional_cess    : 1,}]