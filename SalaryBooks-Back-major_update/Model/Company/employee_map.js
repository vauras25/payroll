var db = require('../../db');
var mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var employeeMap = Schema({

  //userid      : {type: String, required: true},
  emp_id: {type: String,required: true},
  sheet_id: {type: String,required: true},
  machine_id: {type: String,required: true},
  created_at:{ type: Date,required: true,Date, default: Date.now },
  updated_at:{ type: Date, default: Date.now },
}, {strict: false});
employeeMap.plugin(aggregatePaginate);
let Employee = db.model('employee_map', employeeMap);
// mongoose.set('debug', function (coll, method, query) {
//   console.log(query);
//  });
module.exports = Employee;
