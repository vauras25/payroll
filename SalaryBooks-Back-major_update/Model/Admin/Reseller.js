var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var resellerSchema = Schema({
    corporate_id    : {type: String, required: true},
    reseller_name    : {type: String, required: true},
    reseller_of    : {type: Schema.Types.Mixed},
    branch_id    : {type: Schema.Types.ObjectId, required: true},
    address    : {type: String, required: true},
    state    : {type: String, required: true},
    city    : {type: String, required: true},
    bank_details    : {type: String},
    bank_name    : {type: String},
    bank_beneficiary    : {type: String},
    bank_ifsc    : {type: String},
    bank_acc_no    : {type: String},
    bank_acc_type    : {type: String},
    pan_no    : {type: String, required: true},
    gst_no    : {type: String, },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  resellerSchema.plugin(aggregatePaginate);
var Reseller = db.model('resellers',resellerSchema);
module.exports = Reseller;