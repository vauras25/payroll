var Department = require('../../Model/Admin/Department');
const { Validator } = require('node-input-validator');
var multer = require('multer');
module.exports = {
    get_department: async function (req, resp, next) {
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
                    select:   'department_name status created_at',
                    sort:    sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                {
                    filter_option={$and:[
                        {"corporate_id":req.authData.corporate_id},
                        {$or:[
                            {"status":{$regex: req.body.searchkey, $options:"i" }},
                            {"department_name":{$regex: req.body.searchkey, $options:"i"}}
                            // {"status":{$regex: req.body.searchkey , $options:"i"}},
                            // {"department_name":{$regex: req.body.searchkey , $options:"i"}}
                        ]}
                    ]};
                }
                Department.paginate(filter_option,options,  function (err, department) {
                    if (err) resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', departments: department });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    add_department: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                department_name: 'required',
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    department_name:req.body.department_name, 
                    status:req.body.status, 
                    created_at: Date.now()
                };
                Department.create(document,  function (err, department) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Department created successfully", departmen: department });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    department_details:function (req, resp) {
        try {
            Department.findById(req.body.department_id,  function (err, department) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success', department: department });
                }
               
            })
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    update_department_data: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                department_name: 'required',
                status: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {department_name:req.body.department_name, status:req.body.status,updated_at: Date.now()};
                Department.updateOne({'_id':req.body.department_id},document,  function (err, department) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Department updated successfully", department: department });
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
    update_department_status: async function (req, resp) {
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
                Department.updateOne({'_id':req.body.department_id},document,  function (err, department) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Status updated successfully", department: department });
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
    delete_department:function (req, resp) {
        try {
            Department.findByIdAndRemove({'_id':req.body.department_id},  function (err, department) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Department deleted successfully", departmen: department });
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
