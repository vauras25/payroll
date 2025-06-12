var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var clientSchema = Schema({
    corporate_id    : {type: String, required: true},
    client_name    : {type: String, required: true},
    client_code  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  clientSchema.plugin(mongoosePaginate);
var client = db.model('clients',clientSchema);
module.exports = client;