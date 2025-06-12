var db = require("../../db");
var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;

var EmployeePayslipSchema = Schema(
  {
    corporate_id: { type: String, required: true },
    emp_id: { type: String },
    wage_month: { type: Number },
    wage_year: { type: Number },
    total_update: { type: Number, default: 1 },
    emp_data: { type: Schema.Types.Mixed, default: null },
    earnings: {
      salary_report_heads: { type: Schema.Types.Mixed, default: null },
      incentive_total_amount: Number,
      bonus_total_amount: Number,
      ex_gratia_total_amount: Number,
      arrear_total_amount: Number,
      reimbursement_total_amount: Number,
      ot_total_amount: Number,
      shift_allowance_total_amount: Number,
    },
    deductions: {
      epf_amount: Number,
      vpf_amount: Number,
      esic_amount: Number,
      p_tax_amount: Number,
      lwf_amount: Number,
      tds_amount: Number,
    },
    contribution:{
      epf_amount:Number,
      eps_amount:Number,
      admin_edli_amount:Number,
      esic_amount:Number,
      lwf_amount:Number
    },
    gross_earning:Number,
    net_pay:Number,
    ctc:Number,
    pdf_link:{ type: String},
    pdf_file_name:{type:String},
    status: {
      type: String,
      enum: ["active", "inactive"],
      default:"active",
      required: true
    },
    created_at: { type: Date, required: true, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { strict: false }
);
EmployeePayslipSchema.plugin(aggregatePaginate);
var employee_payslip = db.model("employee_payslip", EmployeePayslipSchema);
module.exports = employee_payslip;
