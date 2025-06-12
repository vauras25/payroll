const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeLogSchema = new Schema({
  emp_db_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employee_data:Schema.Types.Mixed,
  action: {
    type: String,
    enum: ['created', 'updated', 'approved', 'deleted', 'inactive'], // Add any additional actions here
    required: true
  },
  action_by: {
    type: Schema.Types.ObjectId,  // Refers to the user/admin who performed the action
    required: true
  },
  description: {
    type: String,
    default: ''
  },
},{
    timestamps:true
});

const EmployeeLog = mongoose.model('employee_logs', employeeLogSchema);

module.exports = EmployeeLog;
