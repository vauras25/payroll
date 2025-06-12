var db = require("../../db");
var mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-paginate-v2");
Schema = mongoose.Schema;

var PublicPostsSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    post_img: String,
    content: String,
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

PublicPostsSchema.plugin(aggregatePaginate);
let PublicPost = db.model(
  "public_posts",
  PublicPostsSchema
);
module.exports = PublicPost;
