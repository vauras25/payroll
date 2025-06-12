var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var couponSchema = Schema({
    use_user_list:{type : Schema.Types.Mixed},
    corporate_id    : {type: String, required: true},
    coupon_code    : {type: String, required: true},
    min_purchase    : {type: String},
    coupon_type:{
        type: String, 
        enum: ['percentage', 'fixed'],
        required: true
    },
    coupon_amount    : {type: Number, required: true},
    coupon_expire:{ type: Date ,required: true },
    multiuse:{
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  couponSchema.plugin(mongoosePaginate);
var Coupon = db.model('coupons',couponSchema);
module.exports = Coupon;