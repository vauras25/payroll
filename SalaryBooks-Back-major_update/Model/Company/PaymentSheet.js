var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var payment_sheetsSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name    : {type: String, required: true},
    column_list  : [Schema.Types.Mixed],
    dropdown_value: [Schema.Types.Mixed],
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  payment_sheetsSchema.plugin(mongoosePaginate);
var payment_sheets = db.model('payment_sheets',payment_sheetsSchema);
module.exports = payment_sheets;