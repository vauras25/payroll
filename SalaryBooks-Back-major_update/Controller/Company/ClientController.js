var Client = require('../../Model/Company/Client');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
niv.extend('unique_clientid', async ({ value, args }) => {
    // default field is email in this example
    const filed = args[1] || 'email';
    let condition = {};
  //console.log('asd'+args)
  //return args;
    condition[filed] = value;
    condition['corporate_id'] = { $eq: args[2] };
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
module.exports = {
    
    get_clients: async function (req, resp, next) {
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
                    select:   '_id client_name client_code status created_at',
                    sort:     sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                {
                    filter_option={
                             $and:[
                                {"corporate_id":req.authData.corporate_id},
                                {
                                    $or:[
                                        {"status":{$regex: req.body.searchkey , $options:"i"}},
                                        {"client_name":{$regex: req.body.searchkey , $options:"i"}}
                                    ]
                                }
                            ]
                        };
                }
                Client.paginate(filter_option,options,  function (err, client) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                    return resp.status(200).json({ status: 'success', clientes: client });
                })
                
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }    
    },
    add_client: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                client_name: 'required',
                client_code: 'required|unique_clientid:clients,client_code,'+req.authData.corporate_id,
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {corporate_id:req.authData.corporate_id,client_name:req.body.client_name,client_code:req.body.client_code, status:req.body.status, created_at: Date.now()};
                Client.create(document,  function (err, client) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Client created successfully", client: client });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        } 
    },
    update_client_data: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                client_name: 'required',
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {client_name:req.body.client_name, status:req.body.status,updated_at: Date.now()};
                Client.updateOne({'_id':req.body.client_id},document,  function (err, client) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Client updated successfully", client: client });
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
    update_client_status: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {status:req.body.status};
                Client.updateOne({'_id':req.body.client_id},document,  function (err, client) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Status updated successfully", client: client });
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
    delete_client:function (req, resp) {
        try {
            Client.findByIdAndRemove({'_id':req.body.client_id},  function (err, client) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Client deleted successfully", client: client });
                }
               
            })
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    }
}
