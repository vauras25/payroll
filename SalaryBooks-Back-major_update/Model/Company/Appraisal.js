var db = require("../../db");
var mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-paginate-v2");
Schema = mongoose.Schema;

var AppraisalSchema = Schema(
  {
    corporate_id: { type: String, required: true },
    emp_id: { type: String },
    emp_db_id: { type: Schema.Types.ObjectId, required: true },
    heads_data: {
      head_name: String,
      head_value: Number,
      assign_value: Number,
    },
    rate_contributor: {
      contributor_id:Schema.Types.ObjectId,
      assign_value:Number
    },
    total_rating: Number,
    calculated_rating: Number,
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "completed"],
      default: "pending",
    },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
  },
  { strict: false }
);

AppraisalSchema.plugin(aggregatePaginate);
let Appraisal = db.model("appraisals", AppraisalSchema);
module.exports = Appraisal;
