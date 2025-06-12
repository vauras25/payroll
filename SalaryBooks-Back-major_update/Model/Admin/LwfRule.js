var db = require('../../db');
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
Schema = mongoose.Schema;
var lwfruleSchema = Schema({
    state : {type: String, required: true},
    corporate_id    : {type: String, required: true},
    // wage_band:{type: String,enum: ['yes', 'no'], default: 'no'},
    gross_type:{type: String,enum: ['rate', 'earned','na']},
    effective_form:{type: Date, required: true},
    period_one    : {
          wage_band:{type: String,enum: ['yes', 'no'], default: 'no'},
          from_month:{type: Number, required: true},
          to_month:{type: Number, required: true},
          lwf_slab:[
            {
              wage_from:{type: Number},
              wage_to:{type: Number},
              employee_contribution:{type: Number},
              employer_contribution:{type: Number},
              last_slab : {
                type: String, 
                enum: ["yes", "no"],
                default:"no",
                required: true
            }
            }
          ]
          
    },
    period_two    : {
        wage_band:{type: String,enum: ['yes', 'no'], default: 'no'},
        from_month:{type: Number, required: true},
        to_month:{type: Number, required: true},
        lwf_slab:[
          {
            wage_from:{type: Number},
            wage_to:{type: Number},
            employee_contribution:{type: Number},
            employer_contribution:{type: Number},
            last_slab : {
              type: String, 
              enum: ["yes", "no"],
              default:"no",
              required: true
          }
          }
        ]
        
      },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    n_a_applicable :{
      type: String, 
      enum: ['yes', 'no'],
      default: 'no'
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now },
  }, {strict: false});
  lwfruleSchema.plugin(mongoosePaginate);
var Lwfrule = db.model('lwfrules',lwfruleSchema);
module.exports = Lwfrule;