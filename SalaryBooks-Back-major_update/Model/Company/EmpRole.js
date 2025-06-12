var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var empRoleSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name  : {type: String},
    template_id  : {type: String},
    rights: {type : Schema.Types.Mixed},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  empRoleSchema.plugin(mongoosePaginate);
var emp_role = db.model('employee_roles',empRoleSchema);
module.exports = emp_role;