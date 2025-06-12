var LwfRule = require('../../../Model/Admin/LwfRule');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    get_lwf_rule_policy: async function (req, resp, next) {
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
                
                LwfRule.paginate(filter_option,options,  function (err, lwf_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', lwf_rule: lwf_rule });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
     add_lwf_rule: async function (req, resp) {
        try{

               const period_one  = JSON.parse(req.body.period_one);
               const period_two = JSON.parse(req.body.period_two);

               period_one.lwf_slab = period_one?.lwf_slab?.map(one => {
                if(one.last_slab) {
                    one.wage_to = 0;
                    one.last_slab = 'yes';
                } else {
                    one.last_slab = 'no';
                }
                return one
               })

               period_two.lwf_slab = period_two?.lwf_slab?.map(one => {
                if(one.last_slab) {
                    one.wage_to = 0;
                    one.last_slab = 'yes';
                } else {
                    one.last_slab = 'no';
                }
                return one  
               })
                //console.log(req.body)
                var document = {
                    corporate_id:req.authData.corporate_id,
                    state:req.body.state,
                    publish_status          :  req.body.publish_status,
                    gross_type          :  req.body.gross_type,
                    effective_form          :  req.body.effective_form,
                    period_one  : period_one, 
                    period_two  : period_two, 
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
                    message:'New LWF Rule has been added',
                    module_type:'com_lwf',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                LwfRule.create(newdocument,  function (err, lwfrule) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"LWF rule created successfully", lwfrule: lwfrule });
                })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_lwf_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_id: "required",
                publish_status :"required|in:published,privet",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                
                const period_one  = JSON.parse(req.body.period_one);
                const period_two = JSON.parse(req.body.period_two);

                period_one.lwf_slab = period_one?.lwf_slab?.map(one => {
                    if(one.last_slab) {
                        one.wage_to = 0;
                        one.last_slab = 'yes';
                    } else {
                        one.last_slab = 'no';
                    }
                    return one
                   })
                   period_two.lwf_slab = period_two.lwf_slab?.map(one => {
                    if(one.last_slab) {
                        one.wage_to = 0;
                        one.last_slab = 'yes';
                    } else {
                        one.last_slab = 'no';
                    }
                    return one
                   })
                //console.log(req.body)
                var document = {
                    state:req.body.state,
                    gross_type          :  req.body.gross_type,
                    effective_form          :  req.body.effective_form,
                    wage_band   :   req.body.wage_band,
                    // period_one  : JSON.parse(req.body.period_one), 
                    // period_two  : JSON.parse(req.body.period_two), 
                    period_one  : period_one, 
                    period_two  : period_two,  
                    publish_status          :  req.body.publish_status,
                    updated_at                  : Date.now()
                };
                LwfRule.updateOne({'_id':req.body.template_id},document,  function (err, lwfrule) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"LWF rule updated successfully", lwfrule: lwfrule });
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
            lwf_rule_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {publish_status:req.body.status};
            LwfRule.updateOne({'_id':req.body.lwf_rule_id},document,  function (err, lwf_rule) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", lwf_rule: lwf_rule });
                }
            
            })
        }
    },
    delete_lwf_rule:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                LwfRule.findByIdAndRemove({'_id':req.body.template_id},  function (err, lwfrule) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"LWF rule deleted successfully", lwfrule: lwfrule });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_lwf_rule_library: async function (req, resp, next) {
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
                LwfRule.paginate(filter_option,options,  function (err, ptax_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', ptax_rule: ptax_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
}
