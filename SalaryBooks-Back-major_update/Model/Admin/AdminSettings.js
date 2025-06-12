var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var adminsettingsSchema = Schema({
    corporate_id    : {type: String, required: true},
    credit_value : {type: String, required: true},
    credit_amount : {type: String, required: true},
    gst_amount : {type: String, required: true},
    created_at:{ type: Date  },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: true});
  adminsettingsSchema.plugin(mongoosePaginate);
var AdminSettings = db.model('admin_settings',adminsettingsSchema);
module.exports = AdminSettings;