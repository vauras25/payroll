var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var bonusModuleSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_id    : String,
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    bonus_value  : {type: Number},
    genarete_bonus_value  : {type: Number},
    generate_exgratia  : {type: Number},
    bonus_from_month  : {type: Number},
    bonus_from_year  : {type: Number},
    bonus_to_month  : {type: Number},
    bonus_to_year  : {type: Number},
    bonus_wage_month: {type: Number},
    bonus_g_month  : {type: Number},
    bonus_g_year  : {type: Number},
    exgratia:{
        type: String, 
        enum: ['on', 'off'],
        default:'on',
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  bonusModuleSchema.plugin(mongoosePaginate);
var BonusModule = db.model('bonus_modules',bonusModuleSchema);
module.exports = BonusModule;