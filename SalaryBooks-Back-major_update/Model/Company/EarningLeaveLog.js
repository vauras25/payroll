var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
Schema = mongoose.Schema;
var EarningLeaveLogSchema = Schema({
    corporate_id    : {type: String, required: true},
    employee_id    : {type: Schema.Types.ObjectId, required: true},
    temp_head_id    : {type: Schema.Types.ObjectId, required: true},
    total_leave : {type: Number, required: true},
    date:{type: String, required: true},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date , default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false});
EarningLeaveLogSchema.plugin(aggregatePaginate);
var EarningLeaveLog = db.model('earning_leave_log',EarningLeaveLogSchema);
// mongoose.set('debug', function (coll, method, query) {
//       console.log(query);
//      });
module.exports = EarningLeaveLog;