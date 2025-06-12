var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var planSchema = Schema({
    plan_name: {type: String, required: true},
    monthly_rental_date: {type: Number, required: true},
    free_emp_no: {type: Number, required: true},
    additional_emp_cost: {type: Number, required: true},
    free_staff_no: {type: Number, required: true},
    additional_staff_cost: {type: Number, required: true},
    free_sallary_temp_no: {type: Number, required: true},
    additional_sallary_temp_cost: {type: Number, required: true},
    free_sallary_head_no: {type: Number, required: true},
    additional_sallary_head_cost: {type: Number, required: true},
    trigger_suspend_no: {type: Number, required: true},
    max_suspend_period: {type: Number, required: true},
    package_id: {type:Schema.Types.ObjectId, required: true},
    valid_from: {type: Date, required: true},
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
    created_at:{ type: Date,required: true },
    updated_at:{ type: Date, default: Date.now },
    history:Schema.Types.Mixed,
  }, {strict: true});
  planSchema.plugin(aggregatePaginate);
var Plan = db.model('plans',planSchema);
module.exports = Plan;