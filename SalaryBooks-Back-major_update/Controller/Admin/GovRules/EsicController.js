var Esicrule = require('../../../Model/Admin/Esicrule');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    
    get_esic_rule: async function (req, resp, next) {
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
                    filter_option={
                    $and:[
                    {"corporate_id":req.authData.corporate_id},
                    {$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i", }},
                            {"circular_no":{$regex: req.body.searchkey , $options:"i",}},
                            {"employer_contribution": +req.body.searchkey ||  null},
                            {"employee_contribution":+req.body.searchkey || null},
                            {"wage_ceiling":+req.body.searchkey || null},
                            {"round_off":{$regex: req.body.searchkey , $options:"i", $options:"i"}},
                            {"contribution_period_a_from":req.body.searchkey},
                            {"contribution_period_a_to":req.body.searchkey },
                            {"contribution_period_b_from":req.body.searchkey},
                            {"contribution_period_b_to": req.body.searchkey},
                            //{"effective_date": req.body.searchkey},

                        ]}
                    ]};
                }
                Esicrule.paginate(filter_option,options,  function (err, esic) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', esic: esic });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_esic_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                circular_no              : 'required',
                employer_contribution    : 'required',
                employee_contribution    : 'required',
                wage_ceiling             : 'required',
                round_off                : 'required|in:up,off,down',
                contribution_period_a_from : 'required',
                contribution_period_a_to   : 'required',
                contribution_period_b_from : 'required',
                contribution_period_b_to   : 'required',
                effective_date             : 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                        circular_no                 : req.body.circular_no, 
                        corporate_id                : req.authData.corporate_id,
                        employer_contribution       : req.body.employer_contribution, 
                        employee_contribution       : req.body.employee_contribution, 
                        wage_ceiling                : req.body.wage_ceiling, 
                        round_off                   : req.body.round_off, 
                        contribution_period_a_from  : req.body.contribution_period_a_from, 
                        contribution_period_a_to    : req.body.contribution_period_a_to, 
                        contribution_period_b_from  : req.body.contribution_period_b_from, 
                        contribution_period_b_to    : req.body.contribution_period_b_to, 
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
                    message:'New ESIC Rule "'+req.body.circular_no+'" has been added',
                    module_type:'gov_esic',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Esicrule.create(newdocument,  function (err, esic) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"ESIC created successfully", esic: esic });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_esic_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                esic_id                  :'required',
                circular_no              : 'required',
                employer_contribution    : 'required',
                employee_contribution    : 'required',
                wage_ceiling             : 'required',
                round_off                : 'required|in:up,off,down',
                contribution_period_a_from : 'required',
                contribution_period_a_to   : 'required',
                contribution_period_b_from : 'required',
                contribution_period_b_to   : 'required',
                effective_date             : 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    circular_no                 : req.body.circular_no, 
                    corporate_id                : req.authData.corporate_id,
                    employer_contribution       : req.body.employer_contribution, 
                    employee_contribution       : req.body.employee_contribution, 
                    wage_ceiling                : req.body.wage_ceiling, 
                    round_off                   : req.body.round_off, 
                    contribution_period_a_from  : req.body.contribution_period_a_from, 
                    contribution_period_a_to    : req.body.contribution_period_a_to, 
                    contribution_period_b_from  : req.body.contribution_period_b_from, 
                    contribution_period_b_to    : req.body.contribution_period_b_to, 
                    effective_date              : req.body.effective_date,
                    updated_at: Date.now()
                    };
                    var newdocument=Object.assign({},document)
                    //var newdocument=JSON.parse(JSON.stringify(document))
                    document.user_name=req.authData.first_name+' '+req.authData.last_name;
                    newdocument.$addToSet= { history: { $each: [document ] } } 
                    var data={
                        corporate_id:req.authData.corporate_id,
                        user_id:req.authData.user_id,
                        message:req.body.circular_no+' has been updated',
                        module_type:'gov_esic',
                        status:'active'
                    }
                    var plandata=await Site_helper.log_entry(data);
                    if(plandata.status == 'val_err' || plandata.status == 'error')
                    {
                        return resp.status(200).json({ status: 'error', message: plandata.message });
                    }
                Esicrule.updateOne({'_id':req.body.esic_id},newdocument,  function (err, esic) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"ESIC updated successfully", esic: esic });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_esic_data:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                esic_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Esicrule.findByIdAndRemove({'_id':req.body.esic_id},  function (err, esic) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"ESIC deleted successfully", esic: esic });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_active_esic_rule: async function (req, resp, next) {
        try{
            
            const options = {
                limit: 1,
                sort:   {effective_date: -1},
                select: '-history'
            };
            var corporate_id=await Site_helper.get_admin_data();
            var filter_option={"corporate_id":corporate_id,effective_date:{$lte:new Date()}};
           
            Esicrule.paginate(filter_option,options,  function (err, esic) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', esic: esic.docs[0] ?esic.docs[0] : {} });
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
}
