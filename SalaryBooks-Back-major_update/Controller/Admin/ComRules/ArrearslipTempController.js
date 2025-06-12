var ArrearSlipTemp = require('../../../Model/Admin/ArrearSlipTemp');
var SalaryTempHead = require('../../../Model/Admin/SalaryTempHead');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
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
    get_arrear_slip_library: async function (req, resp, next) {
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
                // console.log(corporate_id, "corporate id");
                
                
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
                ArrearSlipTemp.paginate(filter_option,options,  function (err, salarytemp_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', salarytemp_rule: salarytemp_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_master_data: async function (req, resp, next) {
        try{
            var masters={
                temp_head:[],
                emp_det:[
                    "emp_first_name",
                    "emp_last_name",
                    "email_id",
                    "emp_id",
                    "aadhar_no",
                    "pan_no"
                ]
            };
            await SalaryTempHead.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id full_name',  function (err, temp_head) {
                if (!err) 
                {
                    masters.temp_head=temp_head;
                    return resp.status(200).send({ status: 'success', message:"", masters: masters});
                }
            })  
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_arrear_slip_temp: async function (req, resp, next) {
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
                    sort:     sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                { 
                    filter_option={$and:[{"corporate_id":req.authData.corporate_id},{$or:[
                        { "status": { $regex: ".*" + req.body.searchkey + ".*" } },
                        { "company_info": { $regex: ".*" + req.body.searchkey + ".*", "$options": "i" } },
                        { "signature_message": { $regex: ".*" + req.body.searchkey + ".*" } },
                        { "template_name": { $regex: ".*" + req.body.searchkey + ".*", "$options": "i" } }
                        ]}
                    ]};
                }
                //console.log(filter_option);
                ArrearSlipTemp.paginate(filter_option,options,  function (err, arrear_slip_temp) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', arrear_slip_temp: arrear_slip_temp });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_arrear_slip_temp: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                company_info: "required",
                employee_details: "required",
                earning_head: "required",
                statutory_deduction: "required",
                statutory_contribution: "required",
                other_payment: "required",
                other_deduction: "required",
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
                    earning_head           : JSON.parse(req.body.earning_head),
                    statutory_deduction           : JSON.parse(req.body.statutory_deduction),
                    statutory_contribution           : JSON.parse(req.body.statutory_contribution),
                    other_payment           : JSON.parse(req.body.other_payment),
                    other_deduction           : JSON.parse(req.body.other_deduction),
                    signature_message           : req.body.signature_message,
                    status                  : 'active', 
                    publish_status:'published',
                    created_at              : Date.now()
                };
                if(req.body.logo_status == 'changed')
                {
                    var obj = req.files;
                    await Promise.all(obj.map(async (file) => {
                    if(file.fieldname === 'arrear_slip_temp_company_logo')
                    {
                        document['company_logo']=file.path;
                    }
                    }));
                }
                else
                {
                    
                    var inStr = fs.createReadStream(req.body.logo_path);
                    var outStr = fs.createWriteStream('storage/company/arrear_slip_temp_company_logo/arrear_slip_temp_company_logo-' + Date.now()+'.png');
                    inStr.pipe(outStr);
                    document['company_logo']=outStr.path;
                }
                ArrearSlipTemp.create(document,  function (err, arrear_slip_temp) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Arrear slip template created successfully", arrear_slip_temp: arrear_slip_temp });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_arrear_slip_temp: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                arrear_slip_temp_id:"required",
                company_info: "required",
                employee_details: "required",
                earning_head: "required",
                statutory_deduction: "required",
                statutory_contribution: "required",
                other_payment: "required",
                other_deduction: "required",
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
                    earning_head           : JSON.parse(req.body.earning_head),
                    statutory_deduction           : JSON.parse(req.body.statutory_deduction),
                    statutory_contribution           : JSON.parse(req.body.statutory_contribution),
                    other_payment           : JSON.parse(req.body.other_payment),
                    other_deduction           : JSON.parse(req.body.other_deduction),
                    signature_message           : req.body.signature_message,
                    updated_at                  : Date.now()
                };
                var obj = req.files;
                await Promise.all(obj.map(async (file) => {
                  if(file.fieldname === 'arrear_slip_temp_company_logo')
                  {
                    document['company_logo']=file.path;
                  }
                }));
                var arrear_slip_temp_id=req.body.arrear_slip_temp_id;
                ArrearSlipTemp.updateOne({'_id':arrear_slip_temp_id},document,  function (err, arrear_slip_temp) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Arrear slip template updated successfully.", arrear_slip_temp: arrear_slip_temp });
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
            ArrearSlipTemp.updateOne({'_id':req.body.template_id},document,  function (err, template_rule) {
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
    delete_arrear_slip_temp:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                arrear_slip_temp_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                ArrearSlipTemp.findByIdAndRemove({'_id':req.body.arrear_slip_temp_id},  function (err, arrear_slip_temp) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        var filePath = file_path+'/'+arrear_slip_temp.company_logo;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        } 
                        return resp.status(200).send({ status: 'success',message:"Arrear slip template deleted successfully", arrear_slip_temp: arrear_slip_temp });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
