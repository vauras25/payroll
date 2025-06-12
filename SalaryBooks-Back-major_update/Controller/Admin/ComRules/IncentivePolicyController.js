var IncentiveTemp = require('../../../Model/Admin/IncentiveTemp');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    get_incentive_library: async function (req, resp, next) {
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
                            {"state_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);
                IncentiveTemp.paginate(filter_option,options,  function (err, incentive_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', incentive_rule: incentive_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_incentive_policy: async function (req, resp, next) {
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
                if(req.body.searchkey)
                { 
                    filter_option={$and:[{"corporate_id":req.authData.corporate_id},{$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i"}},
                            {"template_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);
                IncentiveTemp.paginate(filter_option,options,  function (err, incentive_policy) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', incentive_policy: incentive_policy });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_incentive_policy: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name: "required",
                min_hold: 'required',
                max_hold          : 'required',
                settlement_frequency    : 'required|in:daily,weekly,fortnightly,monthly,quaterly,yearly,half_yearly',
                tds_apply     : 'required|in:yes,no',
                esic_apply     : 'required|in:yes,no',
                pf_apply     : 'required|in:yes,no',
                pt_apply     : 'required|in:yes,no',
                eligble_disburse     : 'required|in:yes,no',
                publish_status :"required|in:published,privet",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    corporate_id:req.authData.corporate_id,
                    template_name           : req.body.template_name,
                    min_hold                : req.body.min_hold,
                    max_hold                : req.body.max_hold, 
                    settlement_frequency    : req.body.settlement_frequency, 
                    tds_apply               : req.body.tds_apply, 
                    esic_apply              : req.body.esic_apply, 
                    pf_apply                : req.body.pf_apply, 
                    pt_apply                : req.body.pt_apply,
                    eligble_disburse        : req.body.eligble_disburse,
                    publish_status          :  req.body.publish_status,
                    status                  : 'active', 
                    created_at              : Date.now()
                };
                var newdocument=Object.assign({},document)
                //var newdocument=JSON.parse(JSON.stringify(document))
                document.user_name=req.authData.first_name+' '+req.authData.last_name;
                newdocument.history=[document]
                var data={
                    corporate_id:req.authData.corporate_id,
                    user_id:req.authData.user_id,
                    message:'New Incentive Policy "'+req.body.template_name+'" has been added',
                    module_type:'com_incentive',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                IncentiveTemp.create(newdocument,  function (err, incentive_policy) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Incentive policy created successfully", incentive_policy: incentive_policy });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_incentive_policy: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                incentive_policy_id:"required",
                template_name: "required",
                min_hold: 'required',
                max_hold          : 'required',
                settlement_frequency    : 'required|in:daily,weekly,fortnightly,monthly,quaterly,yearly,half_yearly',
                tds_apply     : 'required|in:yes,no',
                esic_apply     : 'required|in:yes,no',
                pf_apply     : 'required|in:yes,no',
                pt_apply     : 'required|in:yes,no',
                eligble_disburse     : 'required|in:yes,no',
                publish_status :"required|in:published,privet",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    template_name           : req.body.template_name,
                    min_hold                : req.body.min_hold,
                    max_hold                : req.body.max_hold, 
                    settlement_frequency    : req.body.settlement_frequency, 
                    tds_apply               : req.body.tds_apply, 
                    esic_apply              : req.body.esic_apply, 
                    pf_apply                : req.body.pf_apply, 
                    pt_apply                : req.body.pt_apply,
                    eligble_disburse        : req.body.eligble_disburse,
                    publish_status          :  req.body.publish_status,
                    updated_at                  : Date.now()
                };
                var newdocument=Object.assign({},document)
                //var newdocument=JSON.parse(JSON.stringify(document))
                document.user_name=req.authData.first_name+' '+req.authData.last_name;
                newdocument.$addToSet= { history: { $each: [document ] } }
                var data={
                    corporate_id:req.authData.corporate_id,
                    user_id:req.authData.user_id,
                    message:req.body.template_name+' has been updated',
                    module_type:'com_incentive',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                IncentiveTemp.updateOne({'_id':req.body.incentive_policy_id},newdocument,  function (err, incentive_policy) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Incentive policy updated successfully", incentive_policy: incentive_policy });
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
            incentive_policy_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {publish_status:req.body.status};
            IncentiveTemp.updateOne({'_id':req.body.incentive_policy_id},document,  function (err, incentive_policy) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", incentive_policy: incentive_policy });
                }
            
            })
        }
    },
    update_active_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            incentive_policy_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            IncentiveTemp.updateOne({'_id':req.body.incentive_policy_id},document,  function (err, incentive_policy) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", incentive_policy: incentive_policy });
                }
            
            })
        }
    },
    delete_incentive_policy:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                incentive_policy_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                IncentiveTemp.findByIdAndRemove({'_id':req.body.incentive_policy_id},  function (err, incentive_policy) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Incentive policy deleted successfully", incentive_policy: incentive_policy });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
