var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var arrearsliptempSchema = Schema({
    corporate_id      :{type: String, required: true},
    company_logo    : {type: String, required: true},
    company_info    : {type: String, required: true},
    template_name      :{type: String, required: true},
    employee_details:Schema.Types.Array,
    earning_head:Schema.Types.Array,
    statutory_deduction:Schema.Types.Array,
    statutory_contribution:Schema.Types.Array,
    other_payment:Schema.Types.Array,
    other_deduction:Schema.Types.Array,
    signature_message:{type: String, required: true},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    publish_status:{
      type: String, 
      enum: ['published', 'privet'],
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  arrearsliptempSchema.plugin(mongoosePaginate);
var ArrearSlipTemp = db.model('arrearslip_temps',arrearsliptempSchema);
module.exports = ArrearSlipTemp;