var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var emp_LeaveSchema = Schema({
    corporate_id    : {type: String, required: true},
    employee_id    : {type: Schema.Types.ObjectId, required: true, ref: "employees"},
    emp_id: {type: String},
    leave_id:{type: Schema.Types.ObjectId,required: true},
    leave_temp_head:{type: String,required: true},
    leave_from_date:{type:Date, require:true},
    leave_to_date:{type:Date, require:true},
    // leave_from_date_type:{type:String, enum:['full_day','first_half','second_half']},
    // leave_to_date_type:{type:String, enum:['full_day','first_half','second_half']},
    leave_total_days:{type: String},
    leave_count_days:{type: String},
    current_balance : {type: String},
    note:{type: String},
    company_note:{type: String},
    leave_approval_status:{type:String,enum:['pending','approved','rejected']},
    approve_by:{type: Schema.Types.ObjectId, required: false},
    approve_date:{type:Date, require:false},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date , default: Date.now },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  emp_LeaveSchema.plugin(aggregatePaginate);
var EmployeeLeave = db.model('employee_leave',emp_LeaveSchema);
module.exports = EmployeeLeave;