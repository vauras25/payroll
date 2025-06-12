var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var letterWritingSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    msg_box  : {type: String},
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  letterWritingSchema.plugin(mongoosePaginate);
var letterwriting = db.model('letter_writings',letterWritingSchema);
module.exports = letterwriting;