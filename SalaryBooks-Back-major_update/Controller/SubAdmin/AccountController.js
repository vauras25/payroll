var User = require('../../Model/Admin/User');
var Department = require('../../Model/Admin/Department');
var Branch = require('../../Model/Admin/Branch');
var Designation = require('../../Model/Admin/Designation');
var Role = require('../../Model/Admin/Role');
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
                    Role.find({ _id: { $in: user_data.roles },status:'active'}, 'role_name modules', function (err, permissiondata) {
                        if (err) res.status(200).send({ status: 'error', message: 'no data found' });
                        return resp.status(200).send({ status: 'success', user_data: user_data,permission:permissiondata });
                    })
                }
            })
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
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
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
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
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
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
        var masters={branch:[],designation:[],department:[],hod:[],roles:[]};
        await Designation.find({  status:'active' },'_id designation_name',  function (err, designation) {
            if (!err) 
            {
              masters.designation=designation;
            }
        })
        await Branch.find({  status:'active' },'_id branch_name',  function (err, branch) {
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
        await Department.find({  status:'active' },'_id department_name',  function (err, department) {
            if (!err) 
            {
              masters.department=department;
            }
        })
        await User.find({  status:'active',is_hod:'yes',user_type:'sub_admin' },'_id first_name last_name',  function (err, hod) {
            if (!err) 
            {
              masters.hod=hod;
              return resp.status(200).send({ status: 'success', message:"", masters: masters});
            }
        })
        //return resp.status(200).send({ status: 'val_err', message:"", masters: masters});
      }
      catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    
    get_client_data: async function (req, resp) {
    try{
      const v = new Validator(req.body, {
          pageno:'required',
        });
        const matched = await v.check();
          if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            // if (err) 
            //   {
            //     return resp.status(200).send({ status: 'error', message: err.message });
            //   }
            //   else
            //   {
                resp.status(200).send({ status: 'success', message:"User password has been updated successfully",req:req.permission });
              //}
          }
    }
    catch (e) {
      return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
    }
  },


 

}
