var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
Schema = mongoose.Schema;
var LeaveLogSchema = Schema({
    corporate_id    : {type: String, required: true},
    employee_id    : {type: Schema.Types.ObjectId, required: true},
    employee_details_leave_id    : {type: Schema.Types.ObjectId, required: true},
    encash:{type: Number, required: true},
    extinguish:{type: Number, required: true},
    month:{type: String, required: true},
    year:{type: String, required: true},
    status:{
        type: String, 
        enum: ['pending', 'generated'],
        required: true
    },
    created_at:{ type: Date , default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: false});
LeaveLogSchema.plugin(aggregatePaginate);
var LeaveLog = db.model('leave_log',LeaveLogSchema);
// mongoose.set('debug', function (coll, method, query) {
//       console.log(query);
//      });
module.exports = LeaveLog;