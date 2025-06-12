var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var challanSchema = Schema({
    corporate_id    : {type: String, required: true},
    file_id    : {type: String, required: true},
    xlsx_file_name  : {type: String},
    text_file_name  : {type: String},
    wage_month  : {type: String},
    wage_year  : {type: String},
    challan_type  : {type: String},
    sheet_type  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive','confirm'],
        required: true
    },
    total_epf_emp  : {type: String},
    total_eps_emp  : {type: String},
    total_edli_emp  : {type: String},
    total_epf  : {type: Number},
    total_eps  : {type: Number},
    total_edli  : {type: Number},
    total_challan_amount:{type: Number},
    trrn:{type: String},
    ecr_id:{type: String},
    challan_details:{type: Schema.Types.Mixed},
    ecr_details:{type: Schema.Types.Mixed},
    payment_confirmation:{type: Schema.Types.Mixed},
    due_date:{type: String},
    challan_details_file:{type: String},
    ecr_details_file:{type: String},
    payment_confirm_file:{type: String},
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  challanSchema.plugin(mongoosePaginate);
var pf_challan = db.model('pf_challans',challanSchema);
module.exports = pf_challan;