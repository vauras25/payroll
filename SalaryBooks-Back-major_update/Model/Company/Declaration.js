var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var DeclarationSchema = Schema({
    corporate_id : {type: String, required: true},
    employee_id  : {type: Schema.Types.ObjectId, required: true},
    rental_house : {
        type: String, 
        enum: ['Y', 'N'],
        required: false
    },
    // rental_from_date  : {type: Date, required: false},
    // rental_to_date  : {type: Date, required: false},
    rental_financial_year : {type: String, required: false},
    rental_amount  : {type: String, required: false},
    method_of_application  : {type: String, required: false},
    address  : {type: String, required: false},
    landlord_name  : {type: String, required: false},
    urbanizaion_type : {
        type: String, 
        enum: ['metro', 'non-metro'],
        required: false
    },
    landlord_pan  : {type: String, required: false},
    rantal_house_documents : [{
        file:{type:String},
    }],
    house_property : {
        type: String, 
        enum: ['Y', 'N'],
        required: false
    },
    rental_income : {
        type: String, 
        enum: ['Y', 'N'],
        required: false
    },
    deduction_items : { type: Schema.Types.Mixed },
    other_income_u_s_two_b : { type: Schema.Types.Mixed },

    applicable_for: {
        type: String, 
        enum: ['old_regime', 'new_regime'],
        default: "old_regime"
    },
    status:{
        type: String, 
        enum: ['active', 'inactive', 'pending'],
        required: true
    },
    created_at:{ type: Date ,required: true,default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false});
DeclarationSchema.plugin(mongoosePaginate);
var declaration = db.model('declarations',DeclarationSchema);
module.exports = declaration;