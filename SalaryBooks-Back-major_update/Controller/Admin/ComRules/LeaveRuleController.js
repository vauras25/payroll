var LeaveRule = require('../../../Model/Admin/LeaveRule');
var LeaveTempHead = require('../../../Model/Admin/LeaveTempHead');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
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

// const calculate_leave_balance = async (req, resp) => {
//     try {
//         const v = new Validator(req.body, {
//             template_id: 'required',
//         });
//         if(!await v.check()) 
//         return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });

//         let leave_template = await LeaveRule.findById(req.body.template_id);
//         let leave_template_heads = await LeaveRule.findById(req.body.template_id);
//         leave_template.calculated_leaves_data =  leave_template.template_data.map(data => {
//             let head = leave_template_heads.find(head => head._id == data.leave_type);
//             let obj = {
//                     leave_type:head.full_name,
//                     total_leave:data.no_of_day,
//             }
//             if(data.leave_tenure.toLowerCase() === 'monthly'){
//                 obj.leave_per_month = data.no_of_day;
//                 obj.leave_per_quaterly = data.no_of_day * 4;
//                 obj.total_leave = parseInt(data.no_of_day) * 12;
//             }else if(data.leave_tenure.toLowerCase() === 'quaterly'){
//                 obj.leave_per_quaterly = data.no_of_day;
//                 obj.leave_per_month = data.no_of_day / 4;
//                 obj.total_leave = parseInt(data.no_of_day) * 4;
//             }
//         }) 
//         return leave_template
//     } catch (e) {
//         return resp.status(200).json({status:'error', message:e.message || e || 'Something went wrong' })
//     }
// }
module.exports = {
    get_salary_template_library: async function (req, resp, next) {
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
                LeaveRule.paginate(filter_option,options,  function (err, sleavetemp_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', sleavetemp_rule: sleavetemp_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_salary_template_head_library: async function (req, resp, next) {
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
                    limit: perpage,
                    sort:     sortoption,
                    select:'corporate_id status created_at full_name abbreviation head_type'
                };
                var filter_option={};
                if(req.body.searchkey)
                { 
                    filter_option={$and:[{$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i"}},
                            {"full_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);
                LeaveTempHead.paginate(filter_option,options,  function (err, leavetemphead_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', leavetemphead_rule: leavetemphead_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_template_head: async function (req, resp) {
        const v = new Validator(req.body, {
            full_name: 'required',
            abbreviation: 'required',
            head_type: 'required|in:earned,com_defined',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                corporate_id:req.authData.corporate_id,
                
                full_name:req.body.full_name,
                abbreviation:req.body.abbreviation,
                head_type:req.body.head_type,
                status:'active', 
                created_at: Date.now()
            };
            LeaveTempHead.create(document,  function (err, leavetemphead) {
                if (err) resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Leave Template head created successfully", leavetemphead: leavetemphead });
            })
        }
    },
    get_template_head: async function (req, resp, next) {
        try{
            await LeaveTempHead.find({  status:'active'  },'_id full_name abbreviation head_type',  function (err, temp_head) {
                if (!err) 
                {
                    return resp.status(200).send({ status: 'success', message:"", temp_head: temp_head});
                }
            })
        }
        catch(e){
        return resp.status(200).json({status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_leave_rule_policy: async function (req, resp, next) {
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
                    sort:    sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                
                LeaveRule.paginate(filter_option,options,  function (err, leave_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', leave_rule: leave_rule });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_leave_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name:"required",
            });
            // template_name:"required|unique:leaverules,template_name,corporate_id",
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var total_leave_data=[];
                var template_data= JSON.parse(req.body.template_data);
                await Promise.all(template_data.map(async (leave_data, keyval) => {

                    if(leave_data.leave_tenure == 'Annualy')
                    {
                        var annualy_leave=parseFloat(leave_data.no_of_day);
                    }
                    else if(leave_data.leave_tenure == 'Quaterly')
                    {
                        var annualy_leave=(parseFloat(leave_data.no_of_day) * 4);
                    }
                    else
                    {
                        var annualy_leave=(parseFloat(leave_data.no_of_day) * 2);
                    }
                    total_leave_data.push({'leave_head':leave_data.leave_type,'annualy':annualy_leave,'leave_tenure':leave_data.leave_tenure,'leave_tenure_amount':leave_data.no_of_day,'avalme_restriction':leave_data.restriction_on_availment,'restriction_tenure':leave_data.restriction_tenure,'restriction_days':leave_data.restriction_days})
                }))
                var document = {
                  corporate_id: req.authData.corporate_id,
                  template_name: req.body.template_name,
                  template_data: template_data,
                  total_leave_data: total_leave_data,
                  status: "active",
                  publish_status: "published",
                  created_at: Date.now(),
                };
                
                LeaveRule.create(document,  function (err, leaverule) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Leave rule created successfully", leaverule: leaverule });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_leave_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name:"required|unique:leaverules,template_name,"+req.body.template_id,
                template_id: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var total_leave_data=[];
                var template_data= JSON.parse(req.body.template_data);
                await Promise.all(template_data.map(async (leave_data, keyval) => {

                    if(leave_data.leave_tenure == 'Annualy')
                    {
                        var annualy_leave=parseFloat(leave_data.no_of_day);
                    }
                    else if(leave_data.leave_tenure == 'Quaterly')
                    {
                        var annualy_leave=(parseFloat(leave_data.no_of_day) * 4);
                    }
                    else
                    {
                        var annualy_leave=(parseFloat(leave_data.no_of_day) * 2);
                    }
                    total_leave_data.push({'leave_head':leave_data.leave_type,'annualy':annualy_leave,'leave_tenure':leave_data.leave_tenure,'leave_tenure_amount':leave_data.no_of_day,'avalme_restriction':leave_data.restriction_on_availment,'restriction_tenure':leave_data.restriction_tenure,'restriction_days':leave_data.restriction_days})
                }))
                var document = {
                    template_name:req.body.template_name,
                    template_data       : template_data, 
                    total_leave_data    : total_leave_data,
                    updated_at                  : Date.now()
                };
                LeaveRule.updateOne({'_id':req.body.template_id},document,  function (err, leaverule) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Leave rule updated successfully", leaverule: leaverule });
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
            LeaveRule.updateOne({'_id':req.body.template_id},document,  function (err, template_rule) {
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
    delete_leave_rule:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                LeaveRule.findByIdAndRemove({'_id':req.body.template_id},  function (err, leaverule) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Leave rule deleted successfully", leaverule: leaverule });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    
}
