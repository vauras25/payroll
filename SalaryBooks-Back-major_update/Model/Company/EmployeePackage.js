var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var emp_packageSchema = Schema({
    corporate_id    : {type: String, required: true},
    package_name  : {type: String, required: true},
    attendance_temp  : {type: Schema.Types.ObjectId, required: true},
    incentive_temp  : {type: Schema.Types.ObjectId, required: true},
    bonus_temp  : {type: Schema.Types.ObjectId, required: true},
    overtime_temp  : {type: Schema.Types.ObjectId, required: true},
    tds_temp  : {type: Schema.Types.ObjectId, required: true},
    ptax_temp  : {type: Schema.Types.ObjectId, required: true},
    leave_temp  : {type: Schema.Types.ObjectId, required: true},
    lwf_temp  : {type: Schema.Types.ObjectId, required: true},
    payslip_temp : {type: Schema.Types.ObjectId, required: true},
    bonus_slip_temp : {type: Schema.Types.ObjectId, required: true},
    arrear_slip_temp : {type: Schema.Types.ObjectId, required: true},
    assigned_status:{
        type: String, 
        enum: ['pending', 'assigned'],
        default:'pending',
        required: true
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  emp_packageSchema.plugin(mongoosePaginate);
var EmployeePackage = db.model('employee_package',emp_packageSchema);
module.exports = EmployeePackage;