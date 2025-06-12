var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var creditPurchaseSchema = Schema({
    corporate_id    : {type: String, required: true},
    coupon_code    : {type: String},
    user_id    : {type: String, required: true},
    credit_qty    : {type: String, required: true},
    credit_amount    : {type: String, required: true},
    igst    : {type: Number, required: true},
    cgst    : {type: Number, required: true},
    sgst    : {type: Number, required: true},
    gst_amount    : {type: Number, required: true},
    round_off    : {type: Number, required: true},
    free_credit    : {type: String, required: false},
    razorpay_order_id    : {type: String, required: true},
    inv_id    : {type: String, required: true},
    razorpay_payment_id    : {type: String, required: true},
    razorpay_signature    : {type: String, required: true},
    method    : {type: String, required: false},
    gateway    : {type: String, required: false},
    payment_details : { type: Schema.Types.Mixed },
    file_path: {type: String, required: false},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: true});
creditPurchaseSchema.plugin(mongoosePaginate);
var credit = db.model('credit_purchase',creditPurchaseSchema);
module.exports = credit;