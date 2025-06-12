var db = require("../../db");
var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
Schema = mongoose.Schema;
var biometricSystemSchema = Schema(
  {
    biometric_id:{type:String, required:true},
    biometric_name:String,
    corporate_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "confirm"],
      required: true,
    },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now() },
  },
  { strict: false }
);
biometricSystemSchema.plugin(mongoosePaginate);

var biometric_system = db.model("biometric_systems", biometricSystemSchema);
module.exports = biometric_system;
