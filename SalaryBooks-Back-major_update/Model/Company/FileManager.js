var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var file_managersSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_id  :{type:String},  
    emp_db_id  :{type:Schema.Types.ObjectId},  
    file_name  : {type: String},
    file_type  : {type: String},
    upload_for  : {type: String},
    folder_name  : {type: String},
    file_size  : {type: Number},
    file_path  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  file_managersSchema.plugin(mongoosePaginate);
var file_managers = db.model('file_managers',file_managersSchema);
module.exports = file_managers;