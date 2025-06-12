var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var sal_temp_headSchema = Schema({
    corporate_id    : {type: String, required: true},
    full_name  : {type: String, required: true},
    abbreviation  : {type: String},
    head_type  : {
        type: String, 
        enum: ['earning', 'deduction'],
        required: true
    },
    pre_def_head:{
      type: String, 
      enum: ['yes', 'no'],
      default:'no'
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
  }, {strict: false});
  sal_temp_headSchema.plugin(mongoosePaginate);
var SalTempHead = db.model('salery_temp_head',sal_temp_headSchema);
module.exports = SalTempHead;