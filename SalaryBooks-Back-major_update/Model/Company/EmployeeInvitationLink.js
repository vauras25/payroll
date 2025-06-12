var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var EmployeeInvitationLinkSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    hod_id    : {type: Schema.Types.ObjectId, required: true},
    invitation_link: String,
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true,
        default:'active'
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  EmployeeInvitationLinkSchema.plugin(mongoosePaginate);
var EmployeeInvitation = db.model('employee_invitation_links',EmployeeInvitationLinkSchema);
module.exports = EmployeeInvitation;