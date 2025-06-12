var db = require("../../db");
var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
Schema = mongoose.Schema;

var companyMonthlyDataLogs = Schema(
  {
    wage_month:Number,
    wage_year:Number,
    status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
    },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now() },
  },
  { strict: false }
);
companyMonthlyDataLogs.plugin(mongoosePaginate);

var Company_monthly_Data_Logs = db.model("companies_monthly_data_logs", companyMonthlyDataLogs);

module.exports = Company_monthly_Data_Logs;
