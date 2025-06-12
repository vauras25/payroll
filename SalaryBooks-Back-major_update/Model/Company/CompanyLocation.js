var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var companyLocations = Schema({
    corporate_id: {type: String, required: false},
    company_id: { type: Schema.Types.ObjectId, required: false },
    location: { type: String, required: false },
    address: { type: String, required: false },
    longitude : { type: Number, required: false },
    latitude : { type: Number, required: false },
    description : { type: String, required: false },
    radius : { type: Number, required: false },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date , default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
}, {strict: true});
companyLocations.plugin(mongoosePaginate);
var credit = db.model('company_locations',companyLocations);
module.exports = credit;