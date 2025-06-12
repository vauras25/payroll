var Gratuityrule = require('../../../Model/Admin/Gratuityrule');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    
    get_gratuity_rule: async function (req, resp, next) {
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
                            {"corporate_id": {$regex: ".*" + req.body.searchkey + ".*", "$options": "i"}}
                            // {"employee_no": req.body.searchkey },
                            // {"service_year_no":req.body.searchkey},
                            // {"fifth_year_atrendance":req.body.searchkey},
                            // {"max_gratuity_anual":req.body.searchkey},
                        ]}
                    ]};
                }
                Gratuityrule.paginate(filter_option,options,  function (err, gratuity) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', gratuity: gratuity });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_gratuity_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                employee_no        : 'required',
                employee_no_applicable    : 'required|in:yes,no',
                employee_no_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                service_year_no        : 'required',
                service_year_no_applicable    : 'required|in:yes,no',
                service_year_no_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                fifth_year_atrendance        : 'required',
                fifth_year_atrendance_applicable    : 'required|in:yes,no',
                fifth_year_atrendance_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                max_gratuity_anual        : 'required',
                max_gratuity_anual_applicable    : 'required|in:yes,no',
                max_gratuity_anual_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                income_tax_applicable    : 'required|in:yes,no',
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
                        employee_no                     : req.body.employee_no, 
                        employee_no_applicable          : req.body.employee_no_applicable,
                        employee_no_rule                : req.body.employee_no_rule, 
                        service_year_no                 : req.body.service_year_no, 
                        service_year_no_applicable      : req.body.service_year_no_applicable, 
                        service_year_no_rule            : req.body.service_year_no_rule, 
                        fifth_year_atrendance           : req.body.fifth_year_atrendance, 
                        fifth_year_atrendance_applicable : req.body.fifth_year_atrendance_applicable, 
                        fifth_year_atrendance_rule    : req.body.fifth_year_atrendance_rule, 
                        max_gratuity_anual             : req.body.max_gratuity_anual, 
                        max_gratuity_anual_applicable : req.body.max_gratuity_anual_applicable, 
                        max_gratuity_anual_rule       : req.body.max_gratuity_anual_rule, 
                        income_tax_applicable         : req.body.income_tax_applicable, 
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
                    message:'New Gratuity Rule has been added',
                    module_type:'gov_gratuity',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Gratuityrule.create(newdocument,  function (err, gratuity) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Gratuity created successfully", gratuity: gratuity });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_gratuity_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                gratuity_id                  :'required',
                employee_no        : 'required',
                employee_no_applicable    : 'required|in:yes,no',
                employee_no_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                service_year_no        : 'required',
                service_year_no_applicable    : 'required|in:yes,no',
                service_year_no_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                fifth_year_atrendance        : 'required',
                fifth_year_atrendance_applicable    : 'required|in:yes,no',
                fifth_year_atrendance_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                max_gratuity_anual        : 'required',
                max_gratuity_anual_applicable    : 'required|in:yes,no',
                max_gratuity_anual_rule    : 'required|in:greater,less,greaterthanequal,lessthanequal,equal,none',
                income_tax_applicable    : 'required|in:yes,no',
                effective_date     : 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    employee_no                     : req.body.employee_no, 
                    employee_no_applicable          : req.body.employee_no_applicable,
                    employee_no_rule                : req.body.employee_no_rule, 
                    service_year_no                 : req.body.service_year_no, 
                    service_year_no_applicable      : req.body.service_year_no_applicable, 
                    service_year_no_rule            : req.body.service_year_no_rule, 
                    fifth_year_atrendance           : req.body.fifth_year_atrendance, 
                    fifth_year_atrendance_applicable : req.body.fifth_year_atrendance_applicable, 
                    fifth_year_atrendance_rule    : req.body.fifth_year_atrendance_rule, 
                    max_gratuity_anual             : req.body.max_gratuity_anual, 
                    max_gratuity_anual_applicable : req.body.max_gratuity_anual_applicable, 
                    max_gratuity_anual_rule       : req.body.max_gratuity_anual_rule, 
                    income_tax_applicable         : req.body.income_tax_applicable, 
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
                    message:'Gratuity Rule has been updated',
                    module_type:'gov_gratuity',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Gratuityrule.updateOne({'_id':req.body.gratuity_id},newdocument,  function (err, gratuity) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Gratuity updated successfully", gratuity: gratuity });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'success', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_gratuity_data:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                gratuity_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Gratuityrule.findByIdAndRemove({'_id':req.body.gratuity_id},  function (err, gratuity) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Gratuity deleted successfully", gratuity: gratuity });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_active_gratuity_rule: async function (req, resp, next) {
        try{
            
            const options = {
                limit: 1,
                sort:   {effective_date: -1},
                select: '-history'
            };
            var corporate_id=await Site_helper.get_admin_data();
            var filter_option={"corporate_id":corporate_id,effective_date:{$lte:new Date()}};
           
            Gratuityrule.paginate(filter_option,options,  function (err, gratuity) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', gratuity: gratuity.docs[0] ?gratuity.docs[0] : {} });
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
}
