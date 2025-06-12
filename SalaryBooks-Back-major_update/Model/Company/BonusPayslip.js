var db = require("../../db");
var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;

var BonusPayslipSchema = Schema(
  {
    corporate_id: { type: String, required: true },
    emp_id: { type: String },
    wage_month: { type: Number },
    wage_year: { type: Number },
    total_update: { type: Number, default: 1 },
    emp_data: { type: Schema.Types.Mixed, default: null },
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
BonusPayslipSchema.plugin(aggregatePaginate);
var bonus_payslip = db.model("bonus_payslip", BonusPayslipSchema);
module.exports = bonus_payslip;
