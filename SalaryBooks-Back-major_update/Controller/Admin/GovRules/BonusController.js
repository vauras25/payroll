var Bonusrule = require('../../../Model/Admin/Bonusrule');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    
    get_bonus_rule: async function (req, resp, next) {
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
                    sort:     sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                {
                    filter_option={$and:[{"corporate_id":req.authData.corporate_id},{$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i"}},
                            {"gov_document_no":{$regex: req.body.searchkey , $options:"i"}},
                            // {"min_service_qualify": req.body.searchkey },
                            // {"max_bonus":req.body.searchkey},
                            // {"eligible_capping":req.body.searchkey},
                        ]}
                    ]};
                }
                Bonusrule.paginate(filter_option,options,  function (err, bonus) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', bonus: bonus });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_bonus_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                gov_document_no    : 'required',
                min_service_qualify: 'required',
                max_bonus          : 'required',
                max_bonus_wage     : 'required',
                eligible_capping   : 'required',
                effective_date     : 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                        corporate_id                : req.authData.corporate_id,
                        gov_document_no             : req.body.gov_document_no, 
                        min_service_qualify       : req.body.min_service_qualify, 
                        max_bonus                : req.body.max_bonus, 
                        max_bonus_wage                   : req.body.max_bonus_wage, 
                        eligible_capping  : req.body.eligible_capping, 
                        effective_date              : req.body.effective_date,
                        status                      : 'active', 
                        created_at                  : Date.now()
                    };
                var newdocument=Object.assign({},document)
                //var newdocument=JSON.parse(JSON.stringify(document))
                document.user_name=req.authData.first_name+' '+req.authData.last_name;
                newdocument.history=[document]
                var data={
                    corporate_id:req.authData.corporate_id,
                    user_id:req.authData.user_id,
                    message:'New Bonus Rule "'+req.body.gov_document_no+'" has been added',
                    module_type:'gov_bonus',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Bonusrule.create(newdocument,  function (err, bonus) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Bonus created successfully", bonus: bonus });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_bonus_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                bonus_id                  :'required',
                gov_document_no    : 'required',
                min_service_qualify: 'required',
                max_bonus          : 'required',
                max_bonus_wage     : 'required',
                eligible_capping   : 'required',
                effective_date     : 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    gov_document_no             : req.body.gov_document_no, 
                    min_service_qualify       : req.body.min_service_qualify, 
                    max_bonus                : req.body.max_bonus, 
                    max_bonus_wage                   : req.body.max_bonus_wage, 
                    eligible_capping  : req.body.eligible_capping, 
                    effective_date              : req.body.effective_date,
                    updated_at: Date.now()
                    };
                    var newdocument=Object.assign({},document)
                    //var newdocument=JSON.parse(JSON.stringify(document))
                    document.user_name=req.authData.first_name+' '+req.authData.last_name;
                    //console.log(document)
                    newdocument.$addToSet= { history: { $each: [document ] } }
                    var data={
                        corporate_id:req.authData.corporate_id,
                        user_id:req.authData.user_id,
                        message: req.body.gov_document_no+' has been updated',
                        module_type:'gov_bonus',
                        status:'active'
                    }
                    var plandata=await Site_helper.log_entry(data);
                    if(plandata.status == 'val_err' || plandata.status == 'error')
                    {
                        return resp.status(200).json({ status: 'error', message: plandata.message });
                    }
                Bonusrule.updateOne({'_id':req.body.bonus_id},newdocument,  function (err, bonus) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Bonus updated successfully", bonus: bonus });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_bonus_data:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                bonus_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Bonusrule.findByIdAndRemove({'_id':req.body.bonus_id},  function (err, bonus) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Bonus deleted successfully", bonus: bonus });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_active_bonus_rule: async function (req, resp, next) {
        try{
            
            const options = {
                limit: 1,
                sort:   {effective_date: -1},
                select: '-history'
            };
            var corporate_id=await Site_helper.get_admin_data();
            var filter_option={"corporate_id":corporate_id,effective_date:{$lte:new Date()}};
           
            Bonusrule.paginate(filter_option,options,  function (err, bonus) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', bonus: bonus.docs[0] ?bonus.docs[0] : {} });
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
}
