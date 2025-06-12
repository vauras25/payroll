var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var sal_tempSchema = Schema({
    corporate_id    : {type: String, required: true},
    template_name  : {type: String, required: true},
    restricted_pf  : {type: String, 
        enum: ['yes', 'no'],
        required: true},
    voluntary_pf  : {type: String, required: true},
    // no_pension  : {
    //     type: String, 
    //     enum: ['yes', 'no'],
    //     required: true
    // },
    advance  : {
        type: String, 
        enum: ['yes', 'no'],
        required: true
    },
    minimum_wage_amount  : {type: String},
    minimum_wage_percentage  : {type: String},
    wage_applicable  : {
        type: String, 
        enum: ['higher', 'lower'],
        default : 'lower'
    },
    earnings:[
        {
            head_id: {type:Schema.Types.ObjectId, required: true},
            head_full_name: {type:String},
            head_abbreviation: {type:String},
            priority: {type:String, required: true},
            is_percentage: {
                type: String, 
                enum: ['yes', 'no']
            },
            percentage_amount: {type:String},
            dependent_head: {type:String},
            attendance_relation: {
                type: String, 
                enum: ['dependent', 'non_dependent']},
            head_include_in: {type:Schema.Types.Mixed},
            earning_type: {
                type: String, 
                enum: ['auto', 'percent','amount']
            },
            earning_value: {type:String},
            pre_def_head:{
                type: String, 
                enum: ['yes', 'no'],
                default:'no'
              },
              type  : {
                type: String, 
                enum: ['earning', 'deduction'],
                required: true
            },
        }
    ],
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
    status:{
        type: String,
        enum: ['active', 'inactive'], 
        required: true
      },
    edit_status:{
        type: String,
        enum: ['active', 'inactive'], 
        required: true
    },
    publish_status:{
        type: String, 
        enum: ['published', 'privet'],
      },
  }, {strict: false});
  sal_tempSchema.plugin(mongoosePaginate);
var SalTemp = db.model('salery_template',sal_tempSchema);
module.exports = SalTemp;