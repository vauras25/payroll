var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var packageoptionSchema = Schema({
    name: {type: String, required: true},
    slug: {type: String, required: true},
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
    created_at:{ type: Date,required: true },
    updated_at:{ type: Date, default: Date.now },
    permission:[Schema.Types.Mixed]
  }, {strict: false});
  packageoptionSchema.plugin(mongoosePaginate);
var PackageOption = db.model('package_options',packageoptionSchema);
module.exports = PackageOption;