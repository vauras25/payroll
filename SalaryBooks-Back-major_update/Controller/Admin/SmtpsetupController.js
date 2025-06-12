var SmtpSetup = require('../../Model/Admin/SmtpSetup');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
niv.extend('unique_smtp_username', async ({ value, args }) => {
    // default field is email in this example
    const filed = args[1] || 'username';
    let condition = {};
    condition[filed] = value;
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
    
    get_smtp_list: async function (req, resp, next) {
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
                    limit:req.body.perpage?req.body.perpage:perpage,
                    coupon_expire:{ type: Date ,required: true },
                    select:   '_id smtp_name host_address username status from_email_address password port method',
                    sort:    sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                {
                    filter_option={
                            $and:[
                                {"corporate_id":req.authData.corporate_id},
                                {
                                    $or:[
                                        {"status":req.body.searchkey},
                                        {"smtp_name":{$regex: req.body.searchkey , $options:"i"}},
                                        {"username":{$regex: req.body.searchkey , $options:"i"}},
                                        {"from_email_address":{$regex: req.body.searchkey , $options:"i"}},
                                        {"coupon_code":{$regex: req.body.searchkey , $options:"i"}},
                                    ]
                                }
                            ]
                        };
                }
                SmtpSetup.paginate(filter_option,options,  function (err, smtp_list) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                   return resp.status(200).json({ status: 'success', smtp_list: smtp_list });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_smtp_access: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                smtp_name: 'required',
                host_address: 'required',
                username: 'required',
                from_email_address: 'required',
                password: 'required',
                method: 'required|in:SSL,TLS',
                port:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    smtp_name:req.body.smtp_name, 
                    host_address:req.body.host_address,
                    username:req.body.username,
                    from_email_address:req.body.from_email_address?req.body.from_email_address:'NULL',
                    password:req.body.password, 
                    method:req.body.method,
                    port:req.body.port,
                    status:"inactive",
                    created_at: Date.now()
                };
                SmtpSetup.create(document,  function (err, smtp_access) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"SMTP access created successfully", smtp_access: smtp_access });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_smtp_setup_data: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                smtp_name: 'required',
                host_address: 'required',
                from_email_address: 'required',
                password: 'required',
                method: 'required|in:SSL,TLS',
                port:'required',
                smtp_id:'required'
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    smtp_name:req.body.smtp_name, 
                    host_address:req.body.host_address,
                    from_email_address:req.body.from_email_address?req.body.from_email_address:'NULL',
                    password:req.body.password, 
                    method:req.body.method,
                    port:req.body.port,
                    status:"inactive",
                    updated_at: Date.now()
                };
                SmtpSetup.updateOne({'_id':req.body.smtp_id},document,  function (err, smtp_access) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"SMTP access updated successfully", smtp_access: smtp_access });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_smtp_setup_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required|in:active,inactive',
            smtp_id: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            SmtpSetup.updateOne({'_id':req.body.smtp_id},document,  function (err, smtp_access) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", smtp_access: smtp_access });
                }
            })
        }
    },
    delete_smtp_setup:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                smtp_id: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                SmtpSetup.findByIdAndRemove({'_id':req.body.smtp_id},  function (err, smtp_access) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                       return resp.status(200).send({ status: 'success',message:"SMTP access deleted successfully", smtp_access: smtp_access });
                    }
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
