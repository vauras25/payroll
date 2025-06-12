var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var invoiceSchema = Schema({
    company_logo: {type: String, required: true},
    company_address: {type: String, required: true},
    bank_name: {type: String, required: true},
    bank_account: {type: String, required: true},
    bank_ifsc: {type: String, required: true},
    bank_branch: {type: String, required: true},
    hsn_sac: {type: String, required: true},
    gst_tax_rate: {type: String, required: true},
    digi_signature: {type: String, required: true},
    invoice_note: {type: String, required: true},
    company_gstin_uin: {type: String, required: true},
    pan_no: {type: String, required: true},
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
    created_at:{ type: Date,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  invoiceSchema.plugin(mongoosePaginate);
var Invoice = db.model('invoices',invoiceSchema);
module.exports = Invoice;