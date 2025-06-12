var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var roleSchema = Schema({
    role_id_name    : {type: String, required: true},
    role_name    : {type: String, required: true},
    role_activity:{type: String},
    role_desc :{type: String},
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
    approve:{
      type: String,
      enum: ['yes', 'no'], 
      required: true
    },
    
    created_at:{ type: Date,required: true },
    updated_at:{ type: Date, default: Date.now },
    modules:Schema.Types.Mixed
  }, {strict: false});
  roleSchema.plugin(mongoosePaginate);
var Role = db.model('roles',roleSchema);
// mongoose.set('debug', function (coll, method, query) {
//   console.log(query);
//  });
module.exports = Role;