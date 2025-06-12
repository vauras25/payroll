var User = require('../../Model/Admin/User');
var Department = require('../../Model/Admin/Department');
var Branch = require('../../Model/Admin/Branch');
var Designation = require('../../Model/Admin/Designation');
var Reseller = require('../../Model/Admin/Reseller');
var Role = require('../../Model/Admin/Role');
var EarningTempHead = require('../../Model/Admin/EarningTempHead');
//var Mail = require('../../Mail/Config');
var fs = require('fs');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
var multer = require('multer');
const saltRounds = 10;
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, '../../storage/admin/profile');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});

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
module.exports = {
  //try {
    get_account_details: function(req, resp){
      try{
        User.findById(req.authId,'-password -user_type',  function (err, user_data) {
            if (err) 
            {
              return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
              return resp.status(200).send({ status: 'success', user_data: user_data });
            }
        })
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },
    update_account_data: async function (req, resp) {
      try{
        const v = new Validator(req.body, {
          first_name: 'required|alpha',
          last_name: 'required|alpha',
          phone_no: 'required|phoneNumber',
        });
        const matched = await v.check();
          if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            var document = {
                  first_name:req.body.first_name, 
                  last_name:req.body.last_name, 
                  phone_no:req.body.phone_no,
                  updated_at: Date.now()
                };
                var upload = multer({ storage: storage }).single("profile_pic");
                upload(req, resp, (err) => {
                if(!err) {
                  
                  //console.log(file_path)
                  if (req.files.length > 0) {
                    document.profile_pic=req.files[0].path;
                    
                    User.findById(req.authId,'profile_pic',  function (err, user_data) {
                        if (err) 
                        {
                          return resp.status(200).send({ status: 'error', message: err.message });
                        }
                        else{
                          
                          var filePath = file_path+'/'+user_data.profile_pic; 
                          //resp.status(200).send({ status: 'success', message:"Account has been updated successfullyc" });
                          if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                          }
                          
                          User.updateOne({'_id':req.authId},document,  function (err, user_data) {
                              if (err) 
                              {
                                return resp.status(200).send({ status: 'error', message: err.message });
                              }
                              else
                              {
                                return resp.status(200).send({ status: 'success', message:"Account has been updated successfully", user_data: user_data });
                              }
                          })
                        }
                    })
                  }
                  else
                  {
                    User.updateOne({'_id':req.authId},document,  function (err, user_data) {
                        if (err) 
                        {
                          return resp.status(200).send({ status: 'error', message: err.message });
                        }
                        else
                        {
                          return resp.status(200).send({ status: 'success', message:"Account has been updated successfully", user_data: user_data });
                        }
                    })
                  }
                }
                else{
                  return resp.status(200).send({ status: 'error', message: 'error upload' });
                }
              });
          }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },
    update_account_password: async function (req, resp) {
      try{
        const v = new Validator(req.body, {
        password:'required|length:20,8',
        old_password:'required|length:20,8',
        });
        const matched = await v.check();
          if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            User.findById(req.authId,'password',  function (err, user_data) {
                if (err) 
                {
                  return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                  
                  var chkval=bcrypt.compareSync(req.body.old_password, user_data.password);
                  if(chkval)
                  {
                    const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
                    var document = {
                      password:hash_pass, 
                    };
                    User.updateOne({'_id':req.authId},document,  function (err, user_data) {
                        if (err) 
                        {
                          return resp.status(200).send({ status: 'error', message: err.message });
                        }
                        else
                        {
                          return resp.status(200).send({ status: 'success', message:"Password has been updated successfully", user_data: user_data });
                        }
                    })
                  }
                  else
                  {
                    return resp.status(200).json({ status: 'error', message: 'Wrong old password' });
                  }
                }
            })
          }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },
    update_profile_pic: async function (req, resp) {
      const v = new Validator(req.body, {
        profile_pic:'mime:jpg,png|size:20mb',
        });
        const matched = await v.check();
          if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
                var upload = multer({ storage: storage }).single("profile_pic");
                upload(req, resp, (err) => {
                if(!err) {
                  return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: req.files[0].path });
                  //return req.files;
                  //document.profile_pic=req.files[0].path;
                  //console.log(document)
                }
              });
          }
    },
    get_masters_data:async function(req,resp){
      try{
        var masters={branch:[],designation:[],department:[],hod:[],roles:[],reseller:[]};
        await Designation.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id designation_name',  function (err, designation) {
            if (!err) 
            {
              masters.designation=designation;
            }
        })
        await Branch.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id branch_name',  function (err, branch) {
            if (!err) 
            {
              masters.branch=branch;
            }
        })
        await Role.find({  status:'active' }, '_id role_name role_id_name', function (err, roles) {
          if (!err) 
          {
            masters.roles=roles;
          }
        })
        await Department.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id department_name',  function (err, department) {
            if (!err) 
            {
              masters.department=department;
            }
        })
        await User.find({$and:[{  status:'active'},{is_hod:'yes'},{ $or:[ {user_type:'sub_admin'},{user_type:'super_admin'}]} ]},'_id first_name last_name',  function (err, hod) {
            if (!err) 
            {
              masters.hod=hod;
              // return resp.status(200).send({ status: 'success', message:"", masters: masters});
            }
        })
        await Reseller.find({$and:[{  status:'active'}]},'_id reseller_name corporate_id',  function (err, reseller) {
            if (!err) 
            {
              masters.reseller=reseller;
              
            }
        })
        await EarningTempHead.find({  status:'active' },  function (err, temp_head) {
          if (!err) 
          {
              masters.tds_earning_temp_head=temp_head;
              return resp.status(200).send({ status: 'success', message:"", masters: masters});
          }
        })
        //return resp.status(200).send({ status: 'val_err', message:"", masters: masters});
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },
    add_subadmin_data: async function (req, resp) {
      try{
        const v = new Validator(req.body, {
            first_name: 'required',
            last_name: 'required',
            phone_no: 'required|phoneNumber',
            designation_id: 'required',
            branch_id: 'required',
            department_id: 'required',
            userid: 'required|unique:users,userid',
            email_id: 'required|email',
            is_hod: 'required',
            password:'required|length:20,8',
            roles: 'required|array',
          });
          const matched = await v.check();
            if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
              var parent_hods=[];
              const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
              //var parent_hos =get_parent_hods('staffs','parent_hods',req.body.hod_id);
              await User.findOne({"_id":req.body.hod_id},'parent_hods',  function (err, parent_hod) {
                  if (!err) 
                  {
                    if(parent_hod.parent_hods)
                    {
                      parent_hods=parent_hod.parent_hods;
                    }
                    parent_hods.push(req.body.hod_id);
                     var document = {
                          user_type:'sub_admin',
                          corporate_id:req.authData.corporate_id,
                          userid:req.body.userid,
                          first_name:req.body.first_name, 
                          last_name:req.body.last_name, 
                          email_id:req.body.email_id,
                          phone_no:req.body.phone_no,
                          designation_id:req.body.designation_id,
                          department_id:req.body.department_id,
                          branch_id:req.body.branch_id,
                          hod_id:req.body.hod_id ? mongoose.Types.ObjectId(req.body.hod_id):'NULL',
                          is_hod:req.body.is_hod,
                          parent_hods:parent_hods,
                          password:hash_pass,
                          roles:JSON.parse(req.body.roles),
                          status:'active',
                          created_at: Date.now()
                        };
                      User.create(document,  function (err, user_data) {
                          if (err) 
                          {
                            return resp.status(200).send({ status: 'error', message: err.message });
                          }
                          else
                          {
                            return resp.status(200).send({ status: 'success', message:"User has been created successfully", user_data: user_data });
                          }
                          
                      })
                  }
              })
              //console.log(await parent_hods,req.body.hod_id);
              //return resp.status(200).send({ status: 'error', message: await parent_hods.parent_hods });
              
            }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },

    get_subadmin_list: async function (req, resp, next) {
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
          var search_option= {$match: {$and:[{ user_type:'sub_admin'},{ 'parent_hods':{$in: [req.authData.user_id] }}]}};
          if(req.body.searchkey)
          {
            search_option={ $match: {$and:[{ user_type:'sub_admin'},{ 'parent_hods':{$in: [req.authData.user_id] }}, {$text: { $search: req.body.searchkey }}]}};    
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
          var myAggregate = User.aggregate([
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
              from: 'users',
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
          User.aggregatePaginate(myAggregate,options, async function (err, subadmin) {
              if (err) return resp.json({ status: 'error', message: err.message });
              var masters={designation:[],department:[]};
              await Designation.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id designation_name',  function (err, designation) {
                  if (!err) 
                  {
                    masters.designation=designation;
                  }
              })
              await Department.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id department_name',  function (err, department) {
                  if (!err) 
                  {
                    masters.department=department;
                  }
              })
              return resp.status(200).json({ status: "success", subadmin: subadmin,masters:masters });
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },
    
    update_subadmin_data: async function (req, resp) {
      try{
        const v = new Validator(req.body, {
            user_id:'required',
            first_name: 'required',
            last_name: 'required',
            phone_no: 'required|phoneNumber',
            designation_id: 'required',
            branch_id: 'required',
            department_id: 'required',
            email_id: 'required|email',
            is_hod: 'required',
            roles: 'required|array',
          });
          const matched = await v.check();
            if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
              var document = {
                    first_name:req.body.first_name, 
                    last_name:req.body.last_name, 
                    email_id:req.body.email_id,
                    phone_no:req.body.phone_no,
                    designation_id:req.body.designation_id,
                    department_id:req.body.department_id,
                    branch_id:req.body.branch_id,
                    hod_id:req.body.hod_id ? mongoose.Types.ObjectId(req.body.hod_id):'NULL',
                    is_hod:req.body.is_hod,
                    roles:JSON.parse(req.body.roles),
                    created_at: Date.now()
                  };
              User.updateOne({'_id':req.body.user_id},document,  function (err, user_data) {
                if (err) 
                {
                  return resp.status(200).send({ status: 'error', message: err.message });
                }
                else
                {
                  return resp.status(200).send({ status: 'success', message:"User has been updated successfully", user_data: user_data });
                }
                  
              })
            }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },
    delete_user_data:async function (req, resp) {
      try{
        const v = new Validator(req.body, {
          user_id:'required',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          User.findByIdAndRemove({'_id':req.body.user_id},  function (err, user_data) {
              if (err) 
              {
                return resp.status(200).send({ status: 'error', message: err.message });
              }
              else{
                return resp.status(200).send({ status: 'success',message:"User deleted successfully", user_data: user_data });
              }
          })
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
  },
  update_subadmin_password: async function (req, resp) {
    try{
      const v = new Validator(req.body, {
          user_id:'required',
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
            User.updateOne({'_id':req.body.user_id},document,  function (err, user_data) {
              if (err) 
              {
                return resp.status(200).send({ status: 'error', message: err.message });
              }
              else
              {
                return resp.status(200).send({ status: 'success', message:"User password has been updated successfully", user_data: user_data });
              }
                
            })
          }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
    }
  },
}
