var ComRole = require('../../Model/Company/Role');
var Staff = require('../../Model/Company/Staff');
var ComPermissionModule = require('../../Model/Company/PermissionModule');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
niv.extend('uniqueroleid', async ({ value, args }) => {
    const filed = args[1] || 'role_id_name';
    let condition = {};
  
    condition[filed] = value;
    condition['corporate_id'] = { $eq: args[2] };
    //condition['corporate_id'] =args[2];
    // add ignore condition
    if (args[3]) {
      condition['_id'] = { $ne: mongoose.Types.ObjectId(args[3]) };
    }
  
    let emailExist = await mongoose.model(args[0]).findOne(condition).select(filed);
  
    // email already exists
    if (emailExist) {
      return false;
    }
  
    return true;
  });
  async function get_modue_data(module_list){
    var module_data=[];
    await Promise.all(module_list.map(async (module) => {
         module_data[module.module_name]=module.access
        //console.log(module_data)
    })).then(module_data => {
        //console.log(module_data)
        return  module_data;
      });
    
  }
module.exports = {
    get_permission_module_list: async function (req, resp, next) {
        try {
            if(req.authData.user_type == 'company')
            {
                ComPermissionModule.find({}, async function (err, module_list) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                    return resp.status(200).json({ status: 'success',module_list: module_list });
                })
            }
            else{
                Staff.findById(req.authId,'-password -user_type').then((user_data)=>
                    ComRole.find({ _id: { $in: user_data.roles },status:'active'}, 'role_name modules').then((roledata)=>
                    {
                        var netkey=roledata.map(function(moduleval) {
                            return Object.keys(moduleval.modules)
                        })
                        // const all_module_key = netkey[0].concat(netkey[1]).unique();
                        // console.log(netkey,array3)
                        var modulelist=netkey[0].concat(netkey[1]);
                        var filter_option={module_id_name: { $in: modulelist }};
                        if(req.body.searchkey)
                        {
                            filter_option={$or:[{"module_name":{$regex: req.body.searchkey , $options:"i"}}]};
                        }
                        ComPermissionModule.find(filter_option, async function (err, module_list) {
                            if (err) return resp.json({ status: 'error', message: 'no data found' });
                            return resp.status(200).json({ status: 'success',module_list: module_list });
                        })
                    })
                );
            }
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
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                {
                    filter_option={$and:[
                                {
                                    "corporate_id":req.authData.corporate_id
                                },
                                {$or:[{"role_name":{$regex: req.body.searchkey , $options:"i"}},{"role_id_name":{$regex: req.body.searchkey , $options:"i"}}
                            ]}
                        ]};
                }
                ComRole.paginate(filter_option,options,  function (err, role_list) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                    return resp.status(200).json({ status: 'success', role_list: role_list });
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
        //console.log(req.authData.corporate_id)
        try {
            const v = new Validator(req.body, {
                role_name: 'required',
                role_id_name:'required|uniqueroleid:com_roles,role_id_name,'+req.authData.corporate_id,
                status:'required',
                approve:'required|in:yes,no',
                modules:'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    role_name:req.body.role_name,
                    role_id_name:req.body.role_id_name,
                    role_activity:req.body.role_activity?req.body.role_activity:"NULL", 
                    status:req.body.status,
                    approve:req.body.approve, 
                    modules:JSON.parse(req.body.modules), 
                    created_at: Date.now()
                };
                
                ComRole.create(document,  function (err, role) {
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
            ComRole.findById(req.body.role_id,  function (err, role) {
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
                ComRole.updateOne({'_id':req.body.role_id},document,  function (err, role) {
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
                ComRole.updateOne({'_id':req.body.role_id},document,  function (err, role) {
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
                ComRole.updateOne({'_id':req.body.role_id},document,  function (err, role) {
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
