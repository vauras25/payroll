var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var extraearningheadSchema = Schema({
    corporate_id    : {type: String, required: true},
    head_name    : {type: String, required: true},
    abbreviation  : {type: String},
    earning_status:{
      type: String, 
      enum: ['earning', 'deduction','provision','reimbursement'],
      required: true
    },
    head_include_in:{type : Schema.Types.Mixed},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },

    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  extraearningheadSchema.plugin(mongoosePaginate);
var extra_earning_heads = db.model('extra_earning_heads',extraearningheadSchema);
module.exports = extra_earning_heads;