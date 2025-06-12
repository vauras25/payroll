var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var dispensarySchema = Schema({
  corporate_id    : {type: String, required: true},
  dispensary_name    : {type: String, required: true},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  dispensarySchema.plugin(mongoosePaginate);
var Dispensary = db.model('dispensarys',dispensarySchema);
module.exports = Dispensary;