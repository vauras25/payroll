var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var tdsActSchema = Schema({
    tds:{type: Schema.Types.Mixed, default: null},
    created_at:{ type: Date ,default: Date.now() },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  tdsActSchema.plugin(aggregatePaginate);
var tds_act = db.model('tds_act_datas',tdsActSchema);
module.exports = tds_act;