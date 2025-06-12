var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var esicchallanSchema = Schema({
    corporate_id    : {type: String, required: true},
    file_id    : {type: String, required: true},
    xlsx_file_name  : {type: String},
    wage_month  : {type: String},
    wage_year  : {type: String},
    challan_type  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive','confirm'],
        required: true
    },
    total_challan_amount: {type: Number},
    empr_code  : {type: String},
    empr_name  : {type: String},
    challan_number  : {type: String},
    challan_created  : {type: String},
    challan_submited  : {type: String},
    tran_number  : {type: String},
    due_date:{type: String},
    esic_challan_details_file:{type: String},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  esicchallanSchema.plugin(mongoosePaginate);
var esic_challan = db.model('esic_challans',esicchallanSchema);
module.exports = esic_challan;