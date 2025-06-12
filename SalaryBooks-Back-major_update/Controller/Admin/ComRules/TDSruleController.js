var Tdsrule = require('../../../Model/Admin/Tdsrule');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    
    get_tds_policy: async function (req, resp, next) {
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
                Tdsrule.paginate(filter_option,options,  function (err, tds_policy) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', tds_policy: tds_policy });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_tds_policy: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name: "required",
                application_methode    : 'required|in:progreesive_acual_investment,progreesive_assumed_investment,one_time,assumed',
                frequency     : 'required|in:monthly,quaterly,half_yearly,yearly,not_defined',
                deadline_day: "required",
                deadline_month: "required",
                income_tax_slab: "required",
                tds_rule: "required",
                regime: "required|in:old_regime,new_regime",
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
                    application_methode           : req.body.application_methode,
                    frequency           : req.body.frequency,
                    deadline_day           : req.body.deadline_day,
                    deadline_month           : req.body.deadline_month,
                    income_tax_slab           : req.body.income_tax_slab,
                    tds_rule           : req.body.tds_rule,
                    regime           : req.body.regime,
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
                    message:'New TDS Policy "'+req.body.template_name+'" has been added',
                    module_type:'com_tds',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Tdsrule.create(newdocument,  function (err, tds_policy) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"TDS policy created successfully", tds_policy: tds_policy });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_tds_policy: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                tds_policy_id:"required",
                template_name: "required",
                application_methode    : 'required|in:progreesive_acual_investment,progreesive_assumed_investment,one_time,assumed',
                frequency     : 'required|in:monthly,quaterly,half_yearly,yearly,not_defined',
                deadline_day: "required",
                deadline_month: "required",
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
                    application_methode           : req.body.application_methode,
                    frequency           : req.body.frequency,
                    deadline_day           : req.body.deadline_day,
                    deadline_month           : req.body.deadline_month,
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
                    module_type:'com_tds',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Tdsrule.updateOne({'_id':req.body.tds_policy_id},newdocument,  function (err, tds_policy) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"TDS policy updated successfully", tds_policy: tds_policy });
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
            tds_policy_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {publish_status:req.body.status};
            Tdsrule.updateOne({'_id':req.body.tds_policy_id},document,  function (err, tds_policy) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", tds_policy: tds_policy });
                }
            
            })
        }
    },
    update_active_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            tds_policy_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            Tdsrule.updateOne({'_id':req.body.tds_policy_id},document,  function (err, tds_policy) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", tds_policy: tds_policy });
                }
            
            })
        }
    },
    delete_tds_policy:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                tds_policy_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Tdsrule.findByIdAndRemove({'_id':req.body.tds_policy_id},  function (err, tds_policy) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"TDS policy deleted successfully", tds_policy: tds_policy });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    
    get_tds_policy_library: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
                pageno: 'required',
                
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                // var filepath=await Site_helper.download_image('https://www.googlezzzz.com/images/srpr/logo3w.png', 'google.png');
                // console.log(filepath);
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
                    sort:    sortoption,
                    select:'-history'
                };
                var filter_option={"corporate_id":corporate_id,publish_status:'published'};
                if(req.body.searchkey)
                { 
                    filter_option={$and:[{"corporate_id":corporate_id},{'publish_status':'published'},{$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i"}},
                            {"template_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);

                Tdsrule.paginate(filter_option,options,  function (err, tds_policy) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', tds_policy: tds_policy,corporate_id:corporate_id });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },

}
