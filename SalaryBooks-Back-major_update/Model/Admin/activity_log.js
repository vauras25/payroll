var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var activitylogSchema = Schema({
    corporate_id    : {type: String, required: true},
    user_id    : {type: Schema.Types.ObjectId},
    message:{type: String, required: true},
    module_type:{
        type: String, 
        enum: [
          'subadmin',
          'roles',
          'master_department',
          'master_designation',
          'master_branch',
          'master_reseller',
          'gov_epfo',
          'gov_esic',
          'gov_bonus',
          'gov_gratuity',
          'gov_income_tax_cat',
          'gov_income_tax_slab',
          'com_attendance',
          'com_incentive',
          'com_bonus',
          'com_overtime',
          'com_tds',
          'com_ptax',
          'com_lwf',
          'client_package',
          'plan_management',
          'user_management',
          'promotion'
        ],
        required: true
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  activitylogSchema.plugin(aggregatePaginate);
var activity_log = db.model('activity_log',activitylogSchema);
module.exports = activity_log;