var db = require('../../db');
var mongoose = require('mongoose');
// const mongoosePaginate = require('mongoose-paginate-v2');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var dispensarySchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    company_id    : {type: Schema.Types.ObjectId, required: true},
    salary_head_to_earning_head:
    [{
        salary_head:{type:String},
        tax_earning_head :{type:String},
    }],
    define_deductions_rebate: {
        type: String, 
        enum: ['yes','no'],
        default:'yes'
    },
    define_deductions_rebate_financial_year: {
        type: String,
    },
    define_deductions_rebate_status: {
        type: String,
        enum: ['old_regime','new_regime']
    },

    //for rebate_status old_regime 
    old_regime:{
        define_standard_deduction:{
            type: String, 
            enum: ['yes','no'],
            default:'yes'
        },
        standard_deduction_for_the_fy: {
            type: String,
        },
        standard_deduction_amount: {
            type: String,
        },

        define_rebate:{
            type: String, 
            enum: ['yes','no'],
            default:'yes'
        },
        eligibility_for_rebate_is_taxable_value:{
            type: String, 
            enum: ['higher','lower']
        },
        eligibility_for_rebate_is_taxable_amount:{
            type: String,
        },

        define_hra_deduction_limits:{
            type: String, 
            enum: ['higher','lower']
        },
        actual_hra_earned_metro:{
            percentage:{type: String},
            actual_declared_hra_whichever:{type: String,enum: ['higher','lower']},
        },
        actual_hra_earned_non_metro:{
            percentage:{type: String},
            actual_declared_hra_whichever:{type: String,enum: ['higher','lower']},
        },
        actual_rent_declared:{
            percentage:{type: String},
        },

        define_p_tax_chapter_vi_deduction_limits:{
            type: String, 
            enum: ['yes','no']
        },
        deduction_items: { type: Schema.Types.Mixed },
        // deduction_items :{
            // professional_tax:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // professional_tax_amount:{
            //     type: String, 
            // },
            // eighty_c_one:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // eighty_c_one_amount:{
            //     type: String, 
            // },
            // eighty_d_self_family:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // eighty_d_self_family_amount:{
            //     type: String, 
            // },
            // eighty_d_senior_citizen:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // eighty_d_senior_citizen_amount:{
            //     type: String, 
            // },
            // eighty_d_handicap:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // eighty_d_handicap_amount:{
            //     type: String, 
            // },
            // eighty_c_second:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // eighty_c_second_amount:{
            //     type: String, 
            // },
            // eighty_c_third:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // eighty_c_third_amount:{
            //     type: String, 
            // },
            // eighty_c_fourth:{
            //     type: String, 
            //     enum: ['NA','no_limit','limit'],
            //     default:'NA',
            // },
            // eighty_c_fourth_amount:{
            //     type: String, 
            // },
        // },
    },
    //for rebate_status new regime 
    new_regime:{
        define_standard_deduction_new_regime:{
            type: String, 
            enum: ['yes','no'],
        },
        standard_deduction_for_the_fy_new_regime: {
            type: String,
        },
        standard_deduction_amount_new_regime: {
            type: String,
        },
        define_rebate_new_regime:{
            type: String, 
            enum: ['yes','no'],
        },
        eligibility_for_rebate_is_taxable_value_new_regime:{
            type: String, 
            enum: ['higher','lower']
        },
        eligibility_for_rebate_is_taxable_amount_new_regime: {
            type: String,
        },
    },
    status: {
        type: String, 
        enum: ['active', 'inactive', 'publish'],
        default: "active"
    },
    created_at:{ type: Date ,required: true, default: Date.now },
    updated_at:{ type: Date, default: Date.now },
}, {strict: false});
dispensarySchema.plugin(mongoosePaginate);
var Dispensary = db.model('tds_template',dispensarySchema);
module.exports = Dispensary;