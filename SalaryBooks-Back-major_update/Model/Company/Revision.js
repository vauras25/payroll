var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var revisionSchema = Schema({
    corporate_id    : {type: String, required: true},
    emp_db_id    : {type: Schema.Types.ObjectId, required: true},
    revision_unique_id:{type:String,required:true},
    emp_id: {type: String, required: true},
    salary_temp_id:{type: Schema.Types.ObjectId, required: true},
    policy_pack_id:{type: Schema.Types.ObjectId, required: true},
    revision_log:{type : Schema.Types.Mixed},
    template_data:{type : Schema.Types.Mixed},
    gross_salary:{type: String},
    revision_status:{
      type: String,
      enum: ['pending', 'applied', 'run', 'completed', 'cancelled'], 
      default:"pending",
      required: true
    },
    status:{
      type: String,
      enum: ['active', 'inactive'], 
      required: true
    },
    effect_from:{ type: Date,required: true },
    effect_from_month:{ type: Number,required: true },
    effect_from_year:{ type: Number,required: true },    
    revision_month:{ type: Number,required: true },
    revision_year:{ type: Number,required: true },
    
    created_at:{ type: Date,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  revisionSchema.plugin(mongoosePaginate);
var Revision = db.model('revisions',revisionSchema);
// mongoose.set('debug', function (coll, method, query) {
//   console.log(query);
//  });
module.exports = Revision;