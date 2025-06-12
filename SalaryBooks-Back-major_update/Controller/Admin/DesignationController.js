var Designation = require('../../Model/Admin/Designation');
const { Validator } = require('node-input-validator');
module.exports = {
    get_designation: async function (req, resp, next) {
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
                    select:   '_id designation_name status created_at',
                    sort:     sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                {
                    filter_option={$and:[
                        {"corporate_id":req.authData.corporate_id},
                        {$or:[
                            {"status":{$regex: req.body.searchkey, $options:"i" }},
                            {"designation_name":{$regex: req.body.searchkey , $options:"i"}}
                        ]}
                    ]};
                }
                Designation.paginate(filter_option,options,  function (err, designation) {
                    if (err) resp.json({ status: 'error', message: 'no data found' });
                    return resp.status(200).json({ status: 'success', designations: designation });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    add_designation: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                designation_name: 'required',
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    designation_name:req.body.designation_name, 
                    status:req.body.status, 
                    created_at: Date.now()
                };
                Designation.create(document,  function (err, designation) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Designation created successfully", designation: designation });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    designation_details:function (req, resp) {
        try {
            Designation.findById(req.body.designation_id,  function (err, designation) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success', designation: designation });
                }
               
            });
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    update_designation_data: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                designation_name: 'required',
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {designation_name:req.body.designation_name, status:req.body.status,updated_at: Date.now()};
                Designation.updateOne({'_id':req.body.designation_id},document,  function (err, designation) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Designation updated successfully", designation: designation });
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
    update_designation_status: async function (req, resp) {
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
                Designation.updateOne({'_id':req.body.designation_id},document,  function (err, designation) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Status updated successfully", designation: designation });
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
    delete_designation: function (req, resp) {
        try {
            Designation.findByIdAndRemove({'_id':req.body.designation_id},  function (err, designation) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Designation deleted successfully", designation: designation });
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
