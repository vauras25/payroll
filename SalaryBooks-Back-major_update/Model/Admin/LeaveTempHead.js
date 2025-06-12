var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var leave_temp_headSchema = Schema({
    corporate_id    : {type: String, required: true},
    full_name  : {type: String, required: true},
    abbreviation  : {type: String},
    head_type: {type: String},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
  }, {strict: false});
  leave_temp_headSchema.plugin(mongoosePaginate);
var LeaveTempHead = db.model('leave_temp_head',leave_temp_headSchema);
module.exports = LeaveTempHead;