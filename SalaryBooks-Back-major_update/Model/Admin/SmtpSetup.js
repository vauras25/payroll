var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var smtpsetupSchema = Schema({
    corporate_id    : {type: String, required: true},
    smtp_name    : {type: String, required: true},
    host_address    : {type: String, required: true},
    username : {type: String, required: true},
    from_email_address : {type: String},
    password : {type: String, required: true},
    port : {type: Number, required: true},
    method : {type: String,
        enum: ['SSL', 'TLS'],
        required: true
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  smtpsetupSchema.plugin(mongoosePaginate);
var SmtpSetups = db.model('smtp_setups',smtpsetupSchema);
module.exports = SmtpSetups;