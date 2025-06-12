var Branch = require('../../Model/Admin/Branch');
const { Validator } = require('node-input-validator');
module.exports = {
    
    get_branch: async function (req, resp, next) {
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
                    select:   '_id branch_name status created_at',
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
                                        {"branch_name":{$regex: req.body.searchkey , $options:"i"}}
                                    ]
                                }
                            ]
                        };
                }
                Branch.paginate(filter_option,options,  function (err, branch) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                    return resp.status(200).json({ status: 'success', branches: branch });
                })
                
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    add_branch: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                branch_name: 'required',
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {corporate_id:req.authData.corporate_id,branch_name:req.body.branch_name, status:req.body.status, created_at: Date.now()};
                Branch.create(document,  function (err, branch) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Branch created successfully", branch: branch });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    branch_details:function (req, resp) {
        try {
            Branch.findById(req.body.branch_id,  function (err, branch) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success', branch: branch });
                }
               
            });
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    update_branch_data: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                branch_name: 'required',
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {branch_name:req.body.branch_name, status:req.body.status,updated_at: Date.now()};
                Branch.updateOne({'_id':req.body.branch_id},document,  function (err, branch) {
                    if (err) 
                    {
                        resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        resp.status(200).send({ status: 'success',message:"Branch updated successfully", branch: branch });
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
    update_branch_status: async function (req, resp) {
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
                Branch.updateOne({'_id':req.body.branch_id},document,  function (err, Branch) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Status updated successfully", branch: Branch });
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
    delete_branch:function (req, resp) {
        try {
            Branch.findByIdAndRemove({'_id':req.body.branch_id},  function (err, branch) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Branch deleted successfully", branch: branch });
                }
               
            });
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    }
}
