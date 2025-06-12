var db = require("../../db");
var mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-paginate-v2");
Schema = mongoose.Schema;

var PublicPagesSchema = Schema(
  {
    page_title: {
      type: String,
      required: true,
    },
    page_slug: {
      type: String,
      required: true,
    },
    page_content: String,
    page_img: String,
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

PublicPagesSchema.plugin(aggregatePaginate);
let PublicPage = db.model(
  "public_pages",
  PublicPagesSchema
);
module.exports = PublicPage;
