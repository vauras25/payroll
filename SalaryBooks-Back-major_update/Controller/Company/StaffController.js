var Staff = require('../../Model/Company/Staff');
var Department = require('../../Model/Admin/Department');
var Designation = require('../../Model/Admin/Designation');
var Company = require('../../Model/Admin/Company');
var fs = require('fs');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
var multer = require('multer');
const saltRounds = 10;
niv.extend('unique', async ({ value, args }) => {
    // default field is email in this example
    const filed = args[1] || 'email';
    let condition = {};
  
    condition[filed] = value;
  
    // add ignore condition
    if (args[2]) {
      condition['_id'] = { $ne: mongoose.Types.ObjectId(args[2]) };
    }
  
    let emailExist = await mongoose.model(args[0]).findOne(condition).select(filed);
  
    // email already exists
    if (emailExist) {
      return false;
    }
  
    return true;
  });
  niv.extend('uniqueUserIdStaff', async ({ value, args }) => {
    // default field is email in this example
    const field = args[1] || 'userid';

    let condition = {};

    condition[field] = value;
    // add ignore condition
    if (args[2]) {
        condition['corporate_id'] = { $eq: (args[2]) };
    }

    let templateExist = await mongoose.model(args[0]).findOne(condition).select(field);

    // email already exists
    if (templateExist) {
        return false;
    }

    return true;
});
  module.exports = {
    add_staff_data: async function (req, resp) {
        try{
        const v = new Validator(req.body, {
            first_name: 'required',
            last_name: 'required',
            // phone_no: 'required|phoneNumber',
            // designation_id: 'required',
            // branch_id: 'required',
            // department_id: 'required',
            userid: 'required|uniqueUserIdStaff:staff,userid,' + req.authData.corporate_id,
            email_id: 'required|email',
            is_hod: 'required',
            password:'required|length:20,8',
            roles: 'required|array',
            },{
                'userid.uniqueUserIdStaff': 'The userid has already been taken.',
                'userid.required': 'The userid field is mandatory.',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var parent_hods=[];
                const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
                //var parent_hods=  await get_parent_hods(req.body.hod_id,req.authData.user_type);
                // console.log('aaaaaaa', parent_hods,req.authId);
                Staff.findOne({"_id":req.body.hod_id},'parent_hods', async function (err, parent_hod) {
                    if (!err) 
                    {
                      if(parent_hod)
                      {
                        parent_hods=parent_hod.parent_hods;
                        parent_hods.push(req.body.hod_id);
                      }
                      else
                      {
                        parent_hods=[req.body.hod_id];
                      }
                      
                var document = {
                            user_type:'staff',
                            corporate_id:req.authData.corporate_id,
                            created_by:req.authId,
                            userid:req.body.userid,
                            first_name:req.body.first_name || null, 
                            last_name:req.body.last_name || null, 
                            email_id:req.body.email_id || null,
                            phone_no:req.body.phone_no || null,
                            designation_id:req.body.designation_id || null,
                            department_id:req.body.department_id || null,
                            branch_id:req.body.branch_id || null,
                            hod_id:req.body.hod_id ? mongoose.Types.ObjectId(req.body.hod_id):'NULL',
                            is_hod:req.body.is_hod,
                            parent_hods:parent_hods,
                            password:hash_pass,
                            roles:JSON.parse(req.body.roles),
                            company_id:req.authData.company_id,
                            status:'active',
                            created_at: Date.now(),
                        };
                        Staff.create(document,  function (err, user_data) {
                            if (err) 
                            {
                            return resp.status(200).send({ status: 'error', message: err.message });
                            }
                            else
                            {
                                return resp.status(200).send({ status: 'success', message:"staff has been created successfully", user_data: user_data });
                            }
                            
                        })
                    }
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },

    get_staff_list: async function (req, resp, next) {
        try{
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
            sort:    sortoption,
            };
            var filter_option={};
            var search_option= {$match: { user_type:'staff',"corporate_id":req.authData.corporate_id }};
            // if(req.body.searchkey)
            // {
            // search_option={ $match: { user_type:'staff',"corporate_id":req.authData.corporate_id, $text: { $search: req.body.searchkey } }};    
            // }
            if(req.body.searchkey)
            {
                search_option ={
                    $match:{
                        $and:[
                            {user_type:'staff'},
                            {corporate_id:req.authData.corporate_id},
                            {
                               $or:[
                                {first_name:{$regex:req.body.searchkey, $options:"i"}},
                                {last_name:{$regex:req.body.searchkey, $options:"i"}},
                                {email_id:{$regex:req.body.searchkey, $options:"i"}},
                                {phone_no:{$regex:req.body.searchkey, $options:"i"}},
                                // {designation_id:{$regex:req.body.searchkey, $options:"i"}},
                                // {department_id:{$regex:req.body.searchkey, $options:"i"}},
                                // {branch_id:{$regex:req.body.searchkey, $options:"i"}},
                                // {hod_id:{$regex:req.body.searchkey, $options:"i"}},
                               ]
                            }
                       ]
                    }
                };
             }
            else
            {
                if(req.body.first_name)
                {
                search_option.$match.first_name={"$regex": req.body.first_name, "$options": "i"};
                }
                if(req.body.last_name)
                {
                search_option.$match.last_name={"$regex": req.body.last_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.phone_no)
                {
                search_option.$match.phone_no={"$regex": req.body.phone_no, "$options": "i"};
                }
                if(req.body.designation_id)
                {
                search_option.$match.designation_id=mongoose.Types.ObjectId(req.body.designation_id);
                }
                if(req.body.department_id)
                {
                search_option.$match.department_id=mongoose.Types.ObjectId(req.body.department_id);
                }
                if(req.body.branch_id)
                {
                search_option.$match.branch_id=mongoose.Types.ObjectId(req.body.branch_id);
                }
                if(req.body.hod_id)
                {
                search_option.$match.hod_id=mongoose.Types.ObjectId(req.body.hod_id);
                }
            }
            //console.log(search_option);
            var myAggregate = Staff.aggregate([
            search_option,
            {$lookup:{
                from: 'departments',
                localField: 'department_id',
                foreignField: '_id',
                as: 'departments'
            }},
            {$lookup:{
                from: 'designations',
                localField: 'designation_id',
                foreignField: '_id',
                as: 'designations'
                }},
            {$lookup:{
                from: 'branches',
                localField: 'branch_id',
                foreignField: '_id',
                as: 'branches'
            }},
            {$lookup:{
                from: 'staffs',
                localField: 'hod_id',
                foreignField: '_id',
                as: 'hod'
            }},
            
            { "$project": { 
                "_id":1,
                "corporate_id":1,
                "userid":1,
                "department_id":1,
                "designation_id":1,
                "branch_id":1,
                "hod_id":1,
                "first_name":1,
                "last_name":1,
                "user_type":1,
                "email_id":1,
                "created_at":1,
                "depId":1,
                "phone_no":1,
                "hod.first_name":1,
                "hod.last_name":1,
                "branches":1,
                "designations":1,
                "departments":1,
                "is_hod":1,
                "roles":1
            }
            },
            ]);
            Staff.aggregatePaginate(myAggregate,options, async function (err, staff) {
                if (err) return resp.json({ status: 'error', message: err.message });
                var masters={designation:[],department:[]};
                await Designation.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id designation_name',  function (err, designation) {
                    if (!err) 
                    {
                    masters.designation=designation;
                    }
                })
                await Department.find({  status:'active' ,"corporate_id":req.authData.corporate_id},'_id department_name',  function (err, department) {
                    if (!err) 
                    {
                    masters.department=department;
                    }
                })
                return resp.status(200).json({ status: "success", staff: staff,masters:masters });
            })
        }
        }
        catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    
    update_staff_data: async function (req, resp) {
        try{
        const v = new Validator(req.body, {
            staff_id:'required',
            first_name: 'required',
            last_name: 'required',
            // phone_no: 'required|phoneNumber',
            // designation_id: 'required',
            // branch_id: 'required',
            // department_id: 'required',
            email_id: 'required|email',
            is_hod: 'required',
            roles: 'required|array',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var parent_hods=[];
                Staff.findOne({"_id":req.body.hod_id},'parent_hods', async function (err, parent_hod) {
                    if (!err) 
                    {
                      if(parent_hod)
                      {
                        parent_hods=parent_hod.parent_hods;
                        parent_hods.push(req.body.hod_id);
                      }
                      else
                      {
                        parent_hods=[req.body.hod_id];
                      }
                        var document = {
                            first_name:req.body.first_name || null, 
                            last_name:req.body.last_name || null, 
                            email_id:req.body.email_id || null,
                            phone_no:req.body.phone_no || null,
                            designation_id:req.body.designation_id || null,
                            department_id:req.body.department_id || null,
                            branch_id:req.body.branch_id || null,
                            hod_id:req.body.hod_id ? mongoose.Types.ObjectId(req.body.hod_id):'NULL',
                            is_hod:req.body.is_hod || null,
                            parent_hods:parent_hods,
                            roles:JSON.parse(req.body.roles),
                            created_at: Date.now(),
                            company_id:req.authData.company_id,
                            };
                        Staff.updateOne({'_id':req.body.staff_id},document,  function (err, user_data) {
                        if (err) 
                        {
                            return resp.status(200).send({ status: 'error', message: err.message });
                        }
                        else
                        {
                            return resp.status(200).send({ status: 'success', message:"Staff has been updated successfully", user_data: user_data });
                        }
                            
                        })
                    }
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    delete_staff_data:async function (req, resp) {
        try{
        const v = new Validator(req.body, {
            staff_id:'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            Staff.findByIdAndRemove({'_id':req.body.staff_id},  function (err, user_data) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Staff deleted successfully", user_data: user_data });
                }
            })
        }
        }
        catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    
    update_staff_password: async function (req, resp) {
    try{
        const v = new Validator(req.body, {
            staff_id:'required',
            password:'required|length:20,8',
        });
        const matched = await v.check();
            if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
            const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
            var document = {
                    password:hash_pass, 
                    updated_at: Date.now()
                };
                Staff.updateOne({'_id':req.body.staff_id},document,  function (err, user_data) {
                if (err) 
                {
                return resp.status(200).send({ status: 'error', message: err.message });
                }
                else
                {
                resp.status(200).send({ status: 'success', message:"Staff password has been updated successfully", user_data: user_data });
                }
                
            })
            }
    }
    catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
    }
    },

}
async function  get_parent_hods(hod_id,usertype)
{
    var parent_hods=[];
    if(usertype === 'staff')
    {
        //console.log('staff')
        await Staff.findOne({"_id":hod_id},'parent_hods', async function (err, parent_hod) {
            if (!err) 
            {
                if(parent_hod)
                {
                    parent_hods=parent_hod.parent_hods;
                }
                //console.log(parent_hods)
                 parent_hods.push(hod_id);
            }
        })
        
    }
    else{
        //console.log('company')
        await Company.findOne({"_id":hod_id},'parent_hods', async function (err, parent_hod) {
            if (!err) 
            {
                if(parent_hod)
                {
                    parent_hods=parent_hod.parent_hods;
                }
                 parent_hods.push(hod_id);
            }
        })
    }
    return  parent_hods;
}