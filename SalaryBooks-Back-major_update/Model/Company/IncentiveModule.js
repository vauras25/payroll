var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var incentiveReportSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_id    : {type: Schema.Types.ObjectId, required: true},
    incentive_value :Number,
    hold_value :Number,
    advance_value :Number,
    incentive_value  : {type: Number},
    disbursement_month_id:mongoose.Types.ObjectId,
    advance_id:mongoose.Types.ObjectId,
    // genarete_incentive_value  : {type: Number},
    // genarete_advance_value  : {type: Number},
    // hold_incentive_amount:Number,
    auto_disburse  : {
        type: String, 
        enum: ['on', 'off'],
    },
    incentive_g_month  : {type: Number},
    incentive_g_year  : {type: Number},
    status:{
        type: String, 
        enum: ['active', 'inactive', "pending","run" ],
        default:"pending",
        required: true
    },

    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  incentiveReportSchema.plugin(mongoosePaginate);
var IncentiveReport = db.model('incentive_modules',incentiveReportSchema);
// mongoose.set('debug', function (coll, method, query) {
//       console.log(query);
//      });
module.exports = IncentiveReport;