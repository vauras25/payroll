var BonusTemp = require('../../../Model/Admin/BonusTemp');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
const BonusRule = require('../../../Model/Admin/Bonusrule');
module.exports = {
    get_bonus_rule_library: async function (req, resp, next) {
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
                BonusTemp.paginate(filter_option,options,  function (err, bonus_policy) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', bonus_policy: bonus_policy });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_bonus_policy: async function (req, resp, next) {
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
                    sort:   sortoption,
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
                BonusTemp.paginate(filter_option,options,  function (err, bonus_policy) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', bonus_policy: bonus_policy });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_archive_bonus: async function (req, resp) {
        try {
            let currDate = new Date();
            var bonus_data = await BonusRule.findOne(
                {
                  corporate_id: req.authData.corporate_id,
                  effective_date: { $lte: currDate },
                },
                "-history",
                { sort: { effective_date: -1 } }
              );
                return resp.status(200).json({ status: 'success', data:bonus_data});
        } catch (error) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_bonus_policy: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name: "required",
                min_service: 'required',
                max_bonus          : 'required',
                max_bonus_wage: 'required',
                eligible_capping          : 'required',
                auto_fill_archive    : 'required|in:yes,no',
                tds_apply     : 'required|in:yes,no',
                esic_apply     : 'required|in:yes,no',
                epfo_apply     : 'required|in:yes,no',
                pt_apply     : 'required|in:yes,no',
                disbursement_frequency     : 'required',
                disbursement_type     : 'required',
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
                    auto_fill_archive           : req.body.auto_fill_archive,
                    min_service                : req.body.min_service,
                    max_bonus                : req.body.max_bonus, 
                    max_bonus_wage    : req.body.max_bonus_wage, 
                    eligible_capping        : req.body.eligible_capping,
                    tds_apply               : req.body.tds_apply, 
                    esic_apply              : req.body.esic_apply, 
                    epfo_apply                : req.body.epfo_apply, 
                    pt_apply                : req.body.pt_apply,
                    disbursement_frequency  : req.body.disbursement_frequency,
                    disbursement_type                : req.body.disbursement_type,
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
                    message:'New Bonus Policy "'+req.body.template_name+'" has been added',
                    module_type:'com_bonus',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                BonusTemp.create(newdocument,  function (err, bonus_policy) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Bonus policy created successfully", bonus_policy: bonus_policy });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_bonus_policy: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                bonus_policy_id:"required",
                template_name: "required",
                min_service: 'required',
                max_bonus          : 'required',
                max_bonus_wage: 'required',
                eligible_capping          : 'required',
                auto_fill_archive    : 'required|in:yes,no',
                tds_apply     : 'required|in:yes,no',
                esic_apply     : 'required|in:yes,no',
                epfo_apply     : 'required|in:yes,no',
                pt_apply     : 'required|in:yes,no',
                disbursement_frequency     : 'required',
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
                    auto_fill_archive           : req.body.auto_fill_archive,
                    min_service                : req.body.min_service,
                    max_bonus                : req.body.max_bonus, 
                    max_bonus_wage    : req.body.max_bonus_wage, 
                    eligible_capping        : req.body.eligible_capping,
                    tds_apply               : req.body.tds_apply, 
                    esic_apply              : req.body.esic_apply, 
                    epfo_apply                : req.body.epfo_apply, 
                    pt_apply                : req.body.pt_apply,
                    disbursement_frequency  : req.body.disbursement_frequency,
                    disbursement_type                : req.body.disbursement_type,
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
                    module_type:'com_bonus',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                BonusTemp.updateOne({'_id':req.body.bonus_policy_id},newdocument,  function (err, bonus_policy) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Bonus policy updated successfully", bonus_policy: bonus_policy });
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
            bonus_policy_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {publish_status:req.body.status};
            BonusTemp.updateOne({'_id':req.body.bonus_policy_id},document,  function (err, bonus_policy) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", bonus_policy: bonus_policy });
                }
            
            })
        }
    },
    update_active_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            bonus_policy_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            BonusTemp.updateOne({'_id':req.body.bonus_policy_id},document,  function (err, bonus_policy) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", bonus_policy: bonus_policy });
                }
            
            })
        }
    },
    delete_bonus_policy:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                bonus_policy_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                BonusTemp.findByIdAndRemove({'_id':req.body.bonus_policy_id},  function (err, bonus_policy) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"bonus policy deleted successfully", bonus_policy: bonus_policy });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
