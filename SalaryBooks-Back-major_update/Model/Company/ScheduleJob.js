var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var ScheduleJobSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    emp_id         : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  ScheduleJobSchema.plugin(mongoosePaginate);
var ScheduleJob = db.model('schedule_jobs',ScheduleJobSchema);
module.exports = ScheduleJob;