var db = require('../../db');
var mongoose = require('mongoose');
// const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var userSchema = Schema({
  user_type    : {type: String, required: true},
  corporate_id    : {type: String, required: true},
  userid      : {type: String, required: true},
  first_name    : {type: String, required: true},
  last_name    : {type: String, required: true},
  email_id    : {type: String, required: true},
  password    : {type: String, required: true},
  phone_no    : {
    type: String, 
    minLength: [10, 'Must be at least 10, got {VALUE}'],
    maxLength: [15, 'Must be less than 15, got {VALUE}'],
    required: true
  },
  designation_id    : {type: Schema.Types.ObjectId},
  department_id    : {type: Schema.Types.ObjectId},
  branch_id    : {type: Schema.Types.ObjectId},
  hod_id    : {type: Schema.Types.Mixed},
  is_hod:{
      type: String, 
      enum: ['yes', 'no']
  },
  roles:[{
    type: String
  }],
  status    : {
    type: String, 
    enum: ['active', 'inactive'],
    required: true
  },
  profile_pic:{type: String},
  parent_hods:{type : Schema.Types.Mixed},
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
userSchema.plugin(aggregatePaginate);
var User = db.model('users', userSchema);
module.exports = User;