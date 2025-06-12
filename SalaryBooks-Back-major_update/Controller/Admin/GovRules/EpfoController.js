var Epforule = require('../../../Model/Admin/Epforule');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    
    get_epfo_rule: async function (req, resp, next) {
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
                    filter_option={
                    $and:[
                    {"corporate_id":req.authData.corporate_id},
                    {$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i", $options:"i"}},
                            {"circular_no":{$regex: req.body.searchkey , $options:"i", $options:"i"}},
                            {"pf_employer_contribution": +req.body.searchkey || null },
                            {"total_employer_contribution":+req.body.searchke || null},
                            {"pf_employee_contribution": +req.body.searchkey || null},
                            {"total_employee_contribution": +req.body.searchke || null},
                            {"pension_employer_contribution": +req.body.searchkey || null},
                            {"retirement_age": +req.body.searchkey || null},
                            //{"effective_date":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                Epforule.paginate(filter_option,options,  function (err, epfo) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                    return resp.status(200).json({ status: 'success', epfo: epfo });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_epfo_rule: async function (req, resp) {
        try{
            
                //console.log('asdas')
            const v = new Validator(req.body, {
                circular_no: 'required',
                pf_employer_contribution    : 'required',
                total_employer_contribution    : 'required',
                pf_employee_contribution    : 'required',
                total_employee_contribution    : 'required',
                pension_employer_contribution    : 'required',
                pension_employer_contribution_restrict    : 'required',
                retirement_age    : 'required',
                edli_employer_contribution    : 'required',
                edli_employer_contribution_restrict    : 'required',
                wage_ceiling    : 'required',
                admin_charges    : 'required',
                admin_charges_restrict    : 'required',
                minimum_admin_charges    : 'required',
                edli_admin_charges    :'required',
                edli_admin_charges_restrict    :'required',
                round_off    : 'required',
                effective_date:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error sa", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                        circular_no:req.body.circular_no, 
                        corporate_id:req.authData.corporate_id,
                        pf_employer_contribution:req.body.pf_employer_contribution, 
                        total_employer_contribution:req.body.total_employer_contribution, 
                        pf_employee_contribution:req.body.pf_employee_contribution, 
                        total_employee_contribution:req.body.total_employee_contribution, 
                        pension_employer_contribution:req.body.pension_employer_contribution, 
                        pension_employer_contribution_restrict:req.body.pension_employer_contribution_restrict, 
                        retirement_age:req.body.retirement_age, 
                        edli_employer_contribution:req.body.edli_employer_contribution, 
                        edli_employer_contribution_restrict:req.body.edli_employer_contribution_restrict,
                        wage_ceiling:req.body.wage_ceiling,
                        admin_charges:req.body.admin_charges,
                        admin_charges_restrict:req.body.admin_charges_restrict,
                        minimum_admin_charges:req.body.minimum_admin_charges,
                        edli_admin_charges:req.body.edli_admin_charges,
                        edli_admin_charges_restrict:req.body.edli_admin_charges_restrict,
                        round_off:req.body.round_off,
                        effective_date:req.body.effective_date,
                        status:'active', 
                        created_at: Date.now()
                    };
                var newdocument=Object.assign({},document)
                //var newdocument=JSON.parse(JSON.stringify(document))
                document.user_name=req.authData.first_name+' '+req.authData.last_name;
                newdocument.history=[document]
                //console.log(document)
                var data={
                    corporate_id:req.authData.corporate_id,
                    user_id:req.authData.user_id,
                    message:'New EPFO Rule "'+req.body.circular_no+'" has been added',
                    module_type:'gov_epfo',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                
                Epforule.create(newdocument,  function (err, epfo) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message,asasd:'asdasd' });
                    return resp.status(200).send({ status: 'success',message:"EPFO created successfully", epfo: epfo });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_epfo_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                epfo_id:'required',
                circular_no: 'required',
                pf_employer_contribution    : 'required',
                total_employer_contribution    : 'required',
                pf_employee_contribution    : 'required',
                total_employee_contribution    : 'required',
                pension_employer_contribution    : 'required',
                pension_employer_contribution_restrict    : 'required',
                retirement_age    : 'required',
                edli_employer_contribution    : 'required',
                edli_employer_contribution_restrict    : 'required',
                wage_ceiling    : 'required',
                admin_charges    : 'required',
                admin_charges_restrict    : 'required',
                minimum_admin_charges    : 'required',
                edli_admin_charges    :'required',
                edli_admin_charges_restrict    :'required',
                round_off    : 'required',
                effective_date:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                        circular_no:req.body.circular_no, 
                        pf_employer_contribution:req.body.pf_employer_contribution, 
                        total_employer_contribution:req.body.total_employer_contribution, 
                        pf_employee_contribution:req.body.pf_employee_contribution, 
                        total_employee_contribution:req.body.total_employee_contribution, 
                        pension_employer_contribution:req.body.pension_employer_contribution, 
                        pension_employer_contribution_restrict:req.body.pension_employer_contribution_restrict, 
                        retirement_age:req.body.retirement_age, 
                        edli_employer_contribution:req.body.edli_employer_contribution, 
                        edli_employer_contribution_restrict:req.body.edli_employer_contribution_restrict,
                        wage_ceiling:req.body.wage_ceiling,
                        admin_charges:req.body.admin_charges,
                        admin_charges_restrict:req.body.admin_charges_restrict,
                        minimum_admin_charges:req.body.minimum_admin_charges,
                        edli_admin_charges:req.body.edli_admin_charges,
                        edli_admin_charges_restrict:req.body.edli_admin_charges_restrict,
                        round_off:req.body.round_off,
                        effective_date:req.body.effective_date,
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
                    module_type:'gov_epfo',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Epforule.findOneAndUpdate({'_id':req.body.epfo_id},newdocument,{ returnOriginal: false },   function (err, epfo) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"EPFO updated successfully", epfo: epfo });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_epfo_data:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                epfo_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Epforule.findByIdAndRemove({'_id':req.body.epfo_id},  function (err, epfo) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"EPFO deleted successfully", epfo: epfo });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_active_epfo_rule: async function (req, resp, next) {
        try{
            
            const options = {
                limit: 1,
                sort:   {effective_date: -1},
                select: '-history'
            };
            var corporate_id=await Site_helper.get_admin_data();
            var filter_option={"corporate_id":corporate_id,effective_date:{$lte:new Date()}};
           
            Epforule.paginate(filter_option,options,  function (err, epfo) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', epfo: epfo.docs[0] ?epfo.docs[0] : {} });
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
}
