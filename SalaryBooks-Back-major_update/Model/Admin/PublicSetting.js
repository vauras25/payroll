var db = require("../../db");
var mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-paginate-v2");
Schema = mongoose.Schema;

var PublicSettingsSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    social_links: [{
        title:String,
        slug_name:String
    }],

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { strict: false }
);

PublicSettingsSchema.plugin(aggregatePaginate);
let PublicSetting = db.model(
  "public_settings",
  PublicSettingsSchema
);
module.exports = PublicSetting;
