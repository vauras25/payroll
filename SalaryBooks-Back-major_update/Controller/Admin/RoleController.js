var Role = require('../../Model/Admin/Role');
var PermissionModule = require('../../Model/Admin/PermissionModule');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
niv.extend('unique', async ({ value, args }) => {
    const filed = args[1] || 'role_id_name';
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
    get_permission_module_list: async function (req, resp, next) {
        try {
            var filter_option={module_type:'user'};
            if(req.body.searchkey)
            {
                filter_option={$or:[{"module_name":{$regex: req.body.searchkey , $options:"i"}}]};
            }
            PermissionModule.find(filter_option,  function (err, module_list) {
                if (err) resp.json({ status:'error', message: 'no data found' });
                return resp.status(200).json({ status:'success', module_list: module_list });
            })
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    get_role_list: async function (req, resp, next) {
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
                    sort:sortoption,
                };
                //options[sortby]=req.body.ascdesc = 'asc'?1:-1
                //console.log(options)
                var filter_option={};
                if(req.body.searchkey)
                {
                    filter_option={$or:[{"role_name":{$regex: req.body.searchkey , $options:"i"}},{"role_id_name":{$regex: req.body.searchkey , $options:"i"}}]};
                }
                Role.paginate(filter_option,options,  function (err, role_list) {
                    if (err) resp.json({  status:'error', message: 'no data found' });
                    return resp.status(200).json({ status:'success', role_list: role_list });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    add_role: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                role_name: 'required',
                role_id_name:'required|unique:roles,role_id_name',
                status:'required',
                approve:'required|in:yes,no',
                modules:'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {role_name:req.body.role_name,role_id_name:req.body.role_id_name,role_activity:req.body.role_activity?req.body.role_activity:"NULL", status:req.body.status,approve:req.body.approve, modules:JSON.parse(req.body.modules), created_at: Date.now()};
                
                Role.create(document,  function (err, role) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Role created successfully", role: role });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    role_details:function (req, resp) {
        try {
            Role.findById(req.body.role_id,  function (err, role) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success', role: role });
                }
               
            })
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    update_role_data: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                role_name: 'required',
                modules: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {role_name:req.body.role_name,role_activity:req.body.role_activity?req.body.role_activity:"NULL", status:req.body.status,modules:JSON.parse(req.body.modules),updated_at: Date.now()};
                Role.updateOne({'_id':req.body.role_id},document,  function (err, role) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Role updated successfully", role: role });
                    }
                
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    update_role_status: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                status: 'required',
                role_id:'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {status:req.body.status};
                Role.updateOne({'_id':req.body.role_id},document,  function (err, role) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Status updated successfully", role: role });
                    }
                
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    update_role_approval: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                role_id:'required',
                approve: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {approve:req.body.approve};
                Role.updateOne({'_id':req.body.role_id},document,  function (err, role) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Approval updated successfully", role: role });
                    }
                
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
}
