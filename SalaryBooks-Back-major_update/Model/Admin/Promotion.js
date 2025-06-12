var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var promotionSchema = Schema({
    use_user_list:{type : Schema.Types.Mixed},
    promo_code    : {type: String, required: true},
    corporate_id    : {type: String, required: true},
    promo_amount    : {type: String, required: true},
    min_purchase    : {type: String},
    promotype:{
        type: String, 
        enum: ['fixed', 'percentage'],
        required: true
    },
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
    expiration_date:{ type: Date ,required: true },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: true});
promotionSchema.plugin(mongoosePaginate);
var Promotion = db.model('promotions',promotionSchema);
module.exports = Promotion;