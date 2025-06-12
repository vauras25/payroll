var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var leave_ledgerl = Schema({
    corporate_id    : {type: String, required: true},
    company_id    : {type: Schema.Types.ObjectId, required: true},
    employee_id : {type: Schema.Types.ObjectId, required: true},
    //for lapsed
    lapsed:[{
        head_id : {type: Schema.Types.ObjectId, required: true},
        leave_type_name : {type: String, required: true},
        abbreviation: {type: String, required: true},
        balance: {type: Number, default: 0},
    }],
    //for Carry Forward 
    carry_forward:[{
        head_id : {type: Schema.Types.ObjectId, required: true},
        leave_type_name : {type: String, required: true},
        abbreviation: {type: String, required: true},
        balance: {type: Number, default: 0},
    }],
    month:{type: Number, required: true},
    year:{type: Number, required: true},
    created_at:{ type: Date ,required: true, default: Date.now },
    updated_at:{ type: Date, default: Date.now },
}, {strict: false});
leave_ledgerl.plugin(mongoosePaginate);
var Dispensary = db.model('leave_ledgerl',leave_ledgerl);
module.exports = Dispensary;