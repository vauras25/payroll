var PayslipTemp = require('../../../Model/Admin/PayslipTemp');
var Site_helper = require('../../../Helpers/Site_helper');
const { Validator } = require('node-input-validator');
var fs = require('fs');
var multer = require('multer');
var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, '../../storage/admin/profile');
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + Date.now());
    }
  });
module.exports = {
    get_payslip_temp_library: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
                pageno: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var corporate_id=await Site_helper.get_admin_data();
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
                    sort:     sortoption,
                    select:'-history'
                };
                var filter_option={"corporate_id":corporate_id,'publish_status':'published'};
                if(req.body.searchkey)
                { 
                    filter_option={$and:[{"corporate_id":corporate_id},{'publish_status':'published'},{$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i"}},
                            {"template_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);
                PayslipTemp.paginate(filter_option,options,  function (err, spaysliptemp_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', spaysliptemp_rule: spaysliptemp_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_payslip_temp: async function (req, resp, next) {
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
                    limit: perpage,
                    sort:  sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                { 
                    filter_option={$and:[{"corporate_id":req.authData.corporate_id},{'publish_status':'published'},{$or:[
                        { "status": { $regex: ".*" + req.body.searchkey + ".*" } },
                        { "company_info": { $regex: ".*" + req.body.searchkey + ".*" } },
                        { "leave_status": { $regex: ".*" + req.body.searchkey + ".*" } },
                        { "tds_status": { $regex: ".*" + req.body.searchkey + ".*" } },
                        { "signature_message": { $regex: ".*" + req.body.searchkey + ".*" } },
                        { "template_name": { $regex: ".*" + req.body.searchkey + ".*", "$options": "i" } }
                            ]}
                        ]};
                }
                //console.log(filter_option);
                PayslipTemp.paginate(filter_option,options,  function (err, payslip_temp) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', payslip_temp: payslip_temp });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_payslip_temp: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                company_info: "required",
                employee_details: "required",
                payroll_details: "required",
                other_details: "required",
                signature_message: "required",
                template_name:"required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    corporate_id:req.authData.corporate_id,
                    template_name:req.body.template_name,
                    company_info           : req.body.company_info,
                    employee_details           : JSON.parse(req.body.employee_details),
                    payroll_details           : JSON.parse(req.body.payroll_details),
                    other_details           : JSON.parse(req.body.other_details),
                    signature_message           : req.body.signature_message,
                    status                  : 'active', 
                    publish_status:'published',
                    created_at              : Date.now()
                };
                if(req.body.logo_status == 'changed')
                {
                    var obj = req.files;
                    await Promise.all(obj.map(async (file) => {
                    if(file.fieldname === 'payslip_temp_company_logo')
                    {
                        document['company_logo']=file.path;
                    }
                    }));
                }
                else
                {

                    var inStr = fs.createReadStream(req.body.logo_path);
                    var outStr = fs.createWriteStream('storage/company/payslip_temp_company_logo/com_logo-' + Date.now()+'.png');
                    inStr.pipe(outStr);
                    document['company_logo']=outStr.path;
                }
                PayslipTemp.create(document,  function (err, payslip_temp) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Pay slip template created successfully", payslip_temp: payslip_temp });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_payslip_temp: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                payslip_temp_id:"required",
                company_info: "required",
                employee_details: "required",
                payroll_details: "required",
                other_details: "required",
                signature_message: "required",
                template_name:"required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    company_info           : req.body.company_info,
                    template_name:req.body.template_name,
                    employee_details           : JSON.parse(req.body.employee_details),
                    payroll_details           : JSON.parse(req.body.payroll_details),
                    other_details           : JSON.parse(req.body.other_details),
                    signature_message           : req.body.signature_message,
                    updated_at                  : Date.now()
                };
                var obj = req.files;
                await Promise.all(obj.map(async (file) => {
                  if(file.fieldname === 'payslip_temp_company_logo')
                  {
                    document['company_logo']=file.path;
                  }
                }));
                var payslip_temp_id=req.body.payslip_temp_id;
                PayslipTemp.updateOne({'_id':payslip_temp_id},document,  function (err, payslip_temp) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Pay slip template updated successfully.", payslip_temp: payslip_temp });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_publish_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            template_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {publish_status:req.body.status};
            PayslipTemp.updateOne({'_id':req.body.template_id},document,  function (err, template_rule) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", template_rule: template_rule });
                }
            
            })
        }
    },
    delete_payslip_temp:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                payslip_temp_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                PayslipTemp.findByIdAndRemove({'_id':req.body.payslip_temp_id},  function (err, payslip_temp) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        var filePath = file_path+'/'+payslip_temp.company_logo;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        } 
                        return resp.status(200).send({ status: 'success',message:"Pay slip template deleted successfully", payslip_temp: payslip_temp });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
