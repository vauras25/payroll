var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var staffSchema = Schema({
  corporate_id    : {type: String, required: true},
  created_by: {type: String, required: true},
  user_type:  {type: String},
  userid      : {type: String, required: true},
  first_name    : {type: String, required: true},
  last_name    : {type: String, required: true},
  email_id    : {type: String, required: true},
  password    : {type: String, required: true},
  phone_no    : {
    type: String, 
    minLength: [10, 'Must be at least 10, got {VALUE}'],
    maxLength: [15, 'Must be less than 15, got {VALUE}'],
    // required: true
    default:null
  },
  designation_id    : {type: Schema.Types.ObjectId,default:null},
  department_id    : {type: Schema.Types.ObjectId,default:null},
  branch_id    : {type: Schema.Types.ObjectId,default:null},
  hod_id    : {type: Schema.Types.Mixed,default:null},
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
  company_id    : {type: Schema.Types.ObjectId, required: true},
  created_at:{ type: Date,required: true },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
staffSchema.plugin(aggregatePaginate);
var Staff = db.model('staff', staffSchema);
module.exports = Staff;