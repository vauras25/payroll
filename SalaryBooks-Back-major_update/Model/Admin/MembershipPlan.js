var db = require("../../db");
var mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-paginate-v2");
Schema = mongoose.Schema;

var MembershipPlanSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default:"active"
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { strict: false }
);

MembershipPlanSchema.plugin(aggregatePaginate);
let MembershipPlan = db.model(
  "membership_plans",
  MembershipPlanSchema
);
module.exports = MembershipPlan;
