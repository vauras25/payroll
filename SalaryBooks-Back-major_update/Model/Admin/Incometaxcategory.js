var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var ITcategorySchema = Schema({
    corporate_id    : {type: String, required: true},
    category_name    : {type: String, required: true},
    age_upper_limit    : {type: String, required: true},
    age_lower_limit    : {type: String, required: true},
    gender    : {
      type: String, 
      enum: ['m', 'f','t','o'],
      required: true
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  ITcategorySchema.plugin(mongoosePaginate);
var ITcategory = db.model('income_tax_categories',ITcategorySchema);
module.exports = ITcategory;