var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var earning_sleet_tempSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    template_fields    : {type : Schema.Types.Mixed},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  earning_sleet_tempSchema.plugin(mongoosePaginate);
var earning_sleet_temp = db.model('earning_sheet_template',earning_sleet_tempSchema);
module.exports = earning_sleet_temp;