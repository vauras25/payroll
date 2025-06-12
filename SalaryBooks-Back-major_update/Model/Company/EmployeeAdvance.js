var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var empadvanceSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_id  :{type:String},  
    recovery_from  : {type: String,enum: ['incentive', 'bonus', 'gross_earning','annual_earning','reimbursement'],},
    advance_amount  : {type: Number},
    repaid_amount  : {type: String},
    remaining_amount  : {type: Number},
    advance_outstanding: {type: Number},
    remarks  : {type: String},
    company_remarks  : {type: String},
    no_of_instalments  : {type: Number},
    recovery_frequency  : {type: String},
    payment_start_month  : {type: Number},
    payment_start_year  : {type: Number},
    payment_booking_date  : {type: String},
    instalment_history:[
        {
            instalment_month    : {type: Number},
            instalment_year    : {type: Number},
            recovery_from  : {type: String},
            advance_amount  : {type: Number},
            status  : {
                type: String, 
                enum: ['pending', 'complete'],
            },
        }
    ],
    emp_data: {},
    created_by: {
        type: String, 
        enum: ['admin', 'employee', 'company'],
        required: true,
        default: 'admin',
    },
    status:{
        type: String, 
        enum: ['active', 'inactive', 'complete','pending','rejected'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  empadvanceSchema.plugin(mongoosePaginate);
var employee_advances = db.model('employee_advances',empadvanceSchema);
module.exports = employee_advances;