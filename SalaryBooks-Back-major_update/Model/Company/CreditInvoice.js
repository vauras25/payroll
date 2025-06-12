var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var creditinvoiceSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    template_logo  : {type: String},
    com_address  : {type: String},
    com_state_name  : {type: String},
    com_state_code  : {type: String},
    invoice_prefix  : {type: String},
    mode_of_pay  : {type: String},
    terms_of_delivery  : {type: String},
    entity_name  : {type: String},
    entity_description  : {type: String},
    hsn_sac  : {type: String},
    com_pan  : {type: String},
    declaration  : {type: String},
    com_bank_details  : {type: String},
    footer_text  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  creditinvoiceSchema.plugin(mongoosePaginate);
var credit_invoice = db.model('credit_invoice',creditinvoiceSchema);
module.exports = credit_invoice;