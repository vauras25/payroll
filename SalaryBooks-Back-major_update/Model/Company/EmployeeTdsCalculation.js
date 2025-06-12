var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var EmployeeTdsCalSchema = Schema({
    corporate_id    : {type: String, required: true},
    employee_id    : {type: Schema.Types.ObjectId, required: true},
    head_details: { type: Schema.Types.Mixed },
    any_other_allowance : {type: String, required: true},
    house_rent_allowance : {type: String, required: true},
    income_from_other_sources_amount : {type: String, required: true},
    tax_slab_details: { type: Schema.Types.Mixed },
    declaration_details: { type: Schema.Types.Mixed },
    temp_allowance_amount: {type: Number, required: true},
    total_tds_wages: {type: Number, required: true},
    total_p_tax_amount: {type: Number, required: true},
    standard_deduction_amount: {type: Number, required: true},
    total_declaration_amount: {type: Number, required: true},
    taxable_amount: {type: Number, required: true},
    pre_taxable_amount : {type: Number, required: true},
    tax_rate:{type: Number, required: true},
    tax_amount:{type: Number, required: true},
    rebate_status: {type: String, required: true},
    additional_charge : {type: Number, required: true},
    additional_cess  : {type: Number, required: true},
    tax_slab_amount: {type: Number, required: true},
    rebate_amount: {type: Number, required: true},
    payable_tax_amount : {type: Number, required: true},
    wage_month:{type: Number, required: true},
    wage_year:{type: Number, required: true},
    frequency:{type: String, required: false},
    created_at:{ type: Date , default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false});
EmployeeTdsCalSchema.plugin(mongoosePaginate);
var LeaveLog = db.model('employee_tds_calculation',EmployeeTdsCalSchema);
// mongoose.set('debug', function (coll, method, query) {
//       console.log(query);
//      });
module.exports = LeaveLog;