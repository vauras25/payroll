var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var leaveruleSchema = Schema({
  corporate_id    : {type: String, required: true},
  template_name  : {type: String, required: true},
  template_data    : [
      {
        leave_type:{type: String, required: true},
        restriction_on_availment:{type: String,enum: ['yes', 'no'], required: true},
        no_of_working_days:{type: String},
        no_of_day:{type: String, required: true},
        restriction_tenure:{type: String,enum: ['Annualy', 'Quaterly','Monthly',''], 
        required: function () {
          return this.restriction_on_availment === 'yes';
        }},
        leave_tenure:{type: String,enum: ['Annualy', 'Quaterly','Monthly'], required: true},
        restriction_days:{type: String,  required: function () {
          return this.restriction_on_availment === 'yes';
        }},
        carry_forward:{type: String, required: true},
        cashable:{type: String, required: true},
        carry_forward_years:{type: String},
        effective_form:{type: String, required: true}
      }
  ],
  total_leave_data :Schema.Types.Mixed,
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    publish_status:{
      type: String, 
      enum: ['published', 'privet'],
    },
    n_a_applicable :{
      type: String, 
      enum: ['yes', 'no'],
      default: 'no'
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  leaveruleSchema.plugin(mongoosePaginate);
var Leaverule = db.model('leaverules',leaveruleSchema);
module.exports = Leaverule;