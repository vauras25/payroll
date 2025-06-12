var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var TdsTempHeadSchema = Schema({
    corporate_id : {type: String, required: true},
    company_id  : {type: Schema.Types.ObjectId, required: true},
    heads : { type: Schema.Types.Mixed },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true,default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false});
TdsTempHeadSchema.plugin(mongoosePaginate);
var TdsTempHead = db.model('tds_temp_heads',TdsTempHeadSchema);
module.exports = TdsTempHead;