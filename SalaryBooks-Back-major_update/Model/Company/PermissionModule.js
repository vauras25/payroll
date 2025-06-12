var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var permissionModuleSchema = Schema({
    module_id_name: {type: String, required: true},
    module_name: {type: String, required: true},
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
    created_at:{ type: Date,required: true },
    updated_at:{ type: Date, default: Date.now },
    access:[Schema.Types.Mixed],
    module_type:{
      type: String,
      enum: ['user', 'package'], 
      required: true
    },
  }, {strict: false});
  permissionModuleSchema.plugin(mongoosePaginate);
var PermissionModule = db.model('com_modules',permissionModuleSchema);
module.exports = PermissionModule;