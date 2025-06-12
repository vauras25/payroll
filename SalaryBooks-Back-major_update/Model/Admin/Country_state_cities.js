var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var countrystatecitySchema = Schema({
    name    : {type: String, required: true},
    iso3    : {type: String, required: true},
    iso2    : {type: String, required: true},
    phone_code    : {type: String, required: true},
    capital    : {type: String, required: true},
    currency    : {type: String, required: true},
    currency_symbol    : {type: String, required: true},
    timezones    : Schema.Types.Mixed,
    states    : Schema.Types.Mixed,
    latitude    : {type: String, required: true},
    longitude    : {type: String, required: true},
  }, {strict: false});
  countrystatecitySchema.plugin(mongoosePaginate);
var CouStaCity = db.model('country_state_cities',countrystatecitySchema);
module.exports = CouStaCity;