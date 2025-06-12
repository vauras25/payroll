var LetterWriting = require('../../Model/Company/LetterWriting');
var Employee = require('../../Model/Company/employee');
const { Validator } = require('node-input-validator');
var crypto = require("crypto");
var Site_helper = require('../../Helpers/Site_helper');
const mongoose = require('mongoose');
module.exports = {
  get_LW_template: async function (req, resp, next) {
    try {
        const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var sortbyfield = req.body.sortbyfield
            if(sortbyfield)
            {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            }
            else{
                var sortoption = {created_at: -1};
            }
            const options = {
                page: req.body.pageno,
                limit: req.body.perpage?req.body.perpage:perpage,
                select:   '_id template_name msg_box status',
                sort:     sortoption,
            };
            var filter_option={"corporate_id":req.authData.corporate_id};
            if(req.body.searchkey)
            {
                filter_option={$and:[
                    {"corporate_id":req.authData.corporate_id},
                    {$or:[
                        {"status":{$regex: req.body.searchkey, $options:"i" }},
                        {"template_name":{$regex: req.body.searchkey , $options:"i"}}
                    ]}
                ]};
            }
            LetterWriting.paginate(filter_option,options,  function (err, template_list) {
                if (err) return resp.json({ status: 'error', message: 'no data found' });
            return resp.status(200).json({ status: 'success', template_list: template_list });
            })
        }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  create_LW_template: async function (req, resp, next) {
    try {
        const v = new Validator(req.body, {
            template_name: 'required',
            msg_box: 'required',
            status: 'required|in:active,inactive',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                    corporate_id:req.authData.corporate_id,
                    template_name:req.body.template_name,
                    msg_box:req.body.msg_box, 
                    status:req.body.status,
                    created_at: Date.now()
                };
                LetterWriting.create(document,  function (err, LetterWriting) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Template created successfully", template: LetterWriting });
            })
        }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  update_LW_template: async function (req, resp, next) {
    try {
        const v = new Validator(req.body, {
            template_id:'required',
            template_name: 'required',
            msg_box: 'required',
            status: 'required|in:active,inactive',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                    template_name:req.body.template_name,
                    msg_box:req.body.msg_box, 
                    status:req.body.status,
                    updated_at: Date.now()
                };
                LetterWriting.updateOne({'_id':req.body.template_id},document,  function (err, LetterWriting) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Template updated successfully", template: LetterWriting });
            })
        }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
    update_LW_template_status: async function (req, resp) {
    const v = new Validator(req.body, {
        template_id:'required',
        status: 'required',
    });
    const matched = await v.check();
    if (!matched) {
        return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    }
    else{
        var document = {status:req.body.status};
        LetterWriting.updateOne({'_id':req.body.template_id},document,  function (err, LetterWriting) {
            if (err) 
            {
                return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
                return resp.status(200).send({ status: 'success',message:"Status updated successfully", template: LetterWriting });
            }
        
        })
    }
    },
    delete_LW_template:function (req, resp) {
        LetterWriting.findByIdAndRemove({'_id':req.body.template_id},  function (err, LetterWriting) {
            if (err) 
            {
                return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
                return resp.status(200).send({ status: 'success',message:"Temlate deleted successfully", template: LetterWriting });
            }
            
        })
    },
    letter_writting_report: async function(req,resp){
        try {
            const v = new Validator(req.body, {
                template_id:'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                const options = {};
                var filter_option={};
                var document={};
                // document['shift.shift_id']=req.body.shift_id;
                // document['shift.shift_start_date']=req.body.shift_start_date;
                // document['shift.shift_end_date']=req.body.shift_end_date;
              var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }}]}};
              //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
              var search_option_details= {$match: {}};
              var letter_temp = await LetterWriting.findOne({ "corporate_id": req.authData.corporate_id,_id:req.body.template_id}, 'msg_box', { sort: { created_at: -1 } });
                //var letter_temp = LetterWriting.findOne(req.body.template_id, '-history');
                //console.log(letter_temp+'sadasd')
                //return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg:  letter_temp});
                //console.log('----------------')
              if(req.body.searchkey)
              {
                search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
              }
              else
              {
                
                if(req.body.emp_name)
                {
                  search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                  search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                }
                if(req.body.emp_last_name)
                {
                  search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                  search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.emp_id)
                {
                  search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
                }
                if(req.body.designation_id)
                {
                  var designation_ids=JSON.parse(req.body.designation_id);
                  designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                  search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
                }
                if(req.body.department_id)
                {
                  var department_ids=JSON.parse(req.body.department_id);
                  department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                  search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
                }
                if(req.body.branch_id)
                {
                  var branch_ids=JSON.parse(req.body.branch_id);
                  branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                  search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
                }
                if(req.body.client_code)
                {
                  var client_codes=JSON.parse(req.body.client_code);
                  search_option.$match.client_code={$in: client_codes};
                }
                if(req.body.hod_id)
                {
                  var hod_ids=JSON.parse(req.body.hod_id);
                  hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                  search_option.$match.emp_hod={$in: hod_ids};
                }
              }
              if(req.body.row_checked_all === 'true')
              {
                var ids=JSON.parse(req.body.unchecked_row_ids);
                if(ids.length > 0)
                {
                  ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                    search_option.$match._id= { $nin: ids }
                }
              }
              else{
                var ids=JSON.parse(req.body.checked_row_ids);
                if(ids.length > 0)
                {
                  ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                    search_option.$match._id= { $in: ids }
                }
              }
              var myAggregate = Employee.aggregate([
                search_option,
                
                {$lookup:{
                  from: 'employee_details',
                  localField: '_id',
                  foreignField: 'employee_id',
                  as: 'employee_details',
                }},
                search_option_details,
                {$lookup:{
                  from: 'branches',
                  localField: 'employee_details.employment_hr_details.branch',
                  foreignField: '_id',
                  as: 'branch'
                }},
                {$lookup:{
                  from: 'designations',
                  localField: 'employee_details.employment_hr_details.designation',
                  foreignField: '_id',
                  as: 'designation'
                }},
                {$lookup:{
                  from: 'departments',
                  localField: 'employee_details.employment_hr_details.department',
                  foreignField: '_id',
                  as: 'department'
                }},
              
                { "$project": { 
                  "_id":1,
                  "corporate_id":1,
                  "userid":1,
                  "emp_id":1,
                  "emp_first_name":1,
                  "emp_last_name":1,
                  "emp_dob":1,
                  "pan_no":1,
                  "aadhar_no":1,
                  "email_id":1,
                  "empid":1,
                  "client_code":1
                  }
                },
              
              ]).then(async (emps) => {
                //console.log(emps,'--------')
                var emp_new_data=[];
                var letter_content=''
                var responseArray =  await Promise.all(emps.map(function(emp) {
                  var dyanamic_data_arr={
                      "##EMPFIRSTNAME##":emp.emp_first_name,
                      "##EMPLASTNAME##":emp.emp_last_name,
                      "##EMPID##":emp.emp_id,
                      "##CORPORATEID##":emp.corporate_id,
                      "##PANNO##":emp.pan_no,
                      "##EMAILID##":emp.email_id,
                      "##EMPDOB##":emp.emp_dob,
                      "##AADHARNO##":emp.aadhar_no,
                      "##CLIENTCODE##":emp.client_code,
                    };
                  letter_content=letter_temp.msg_box;
                  //console.log(letter_temp + 'asasasasasas')
                  letter_content = letter_content.replace(/##EMPFIRSTNAME##|##EMPLASTNAME##|##EMPID##|##CORPORATEID##|##PANNO##|##EMAILID##|##EMPDOB##|##AADHARNO##|##CLIENTCODE##/gi, function(matched){
                      return dyanamic_data_arr[matched];
                    });
                    emp.letter_writing_data=letter_content;
                    emp_new_data.push(emp);
                }));
                return resp.status(200).send({ status: 'success', message:"Employee letter generated successfully",emps:emp_new_data });
             
              });
            }
        }
        catch (e) {
          return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
        }
    }
}