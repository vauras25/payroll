var Package = require('../../Model/Admin/Package');
var Plan = require('../../Model/Admin/Plan');
var Site_helper = require('../../Helpers/Site_helper');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
module.exports = {
    add_plan: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
                plan_name: 'required',
                monthly_rental_date:'required',
                free_emp_no:'required',
                additional_emp_cost:'required',
                free_staff_no:'required',
                additional_staff_cost:'required',
                free_sallary_temp_no:'required',
                additional_sallary_temp_cost:'required',
                free_sallary_head_no:'required',
                additional_sallary_head_cost:'required',
                trigger_suspend_no:'required',
                max_suspend_period:'required',
                package_id:'required',
                valid_from:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    plan_name:req.body.plan_name,
                    monthly_rental_date:req.body.monthly_rental_date,
                    free_emp_no:req.body.free_emp_no, 
                    additional_emp_cost:req.body.additional_emp_cost, 
                    free_staff_no:req.body.free_staff_no,
                    free_staff_no:req.body.free_staff_no, 
                    additional_staff_cost:req.body.additional_staff_cost, 
                    free_sallary_temp_no:req.body.free_sallary_temp_no, 
                    additional_sallary_temp_cost:req.body.additional_sallary_temp_cost, 
                    free_sallary_head_no:req.body.free_sallary_head_no, 
                    additional_sallary_head_cost:req.body.additional_sallary_head_cost,
                    trigger_suspend_no:req.body.trigger_suspend_no, 
                    max_suspend_period:req.body.max_suspend_period, 
                    package_id:mongoose.Types.ObjectId(req.body.package_id), 
                    package_data:{'package_name':req.body.package_name,'id':req.body.package_id},
                    valid_from:req.body.valid_from, 
                    status:"active",
                    created_at: Date.now()
                };
                var newdocument=Object.assign({},document)
                document.user_name=req.authData.first_name+' '+req.authData.last_name;
                //var newdocument=JSON.parse(JSON.stringify(document))
                newdocument.history=[document]
                var data={
                    corporate_id:req.authData.corporate_id,
                    user_id:req.authData.user_id,
                    message:'New plan "'+req.body.plan_name+'" has been added',
                    module_type:'plan_management',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Plan.create(newdocument,  function (err, plan) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Plan created successfully", plan: plan });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_plan_list: async function (req, resp, next) {
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
            var search_option= {$match: {}} ;
            if(req.body.searchkey)
            {
                search_option={
                    $match:{
                        $or:[
                            {"plan_name":{$regex: req.body.searchkey , $options:"i"}}
                        ]
                    }
                };
            }
            else
          {
              if(req.body.plan_name)
              {
                search_option.$match.plan_name={"$regex": req.body.plan_name, "$options": "i"};
              }
              if(req.body.package_id)
              {
                search_option.$match.package_id=mongoose.Types.ObjectId(req.body.package_id);
              }
              if(req.body.monthly_rental_date)
              {
                search_option.$match.monthly_rental_date=parseInt(req.body.monthly_rental_date);
              }
              if(req.body.free_emp_no)
              {
                search_option.$match.free_emp_no=parseInt(req.body.free_emp_no);
              }
              if(req.body.free_staff_no)
              {
                search_option.$match.free_staff_no=parseInt(req.body.free_staff_no);
              }
              if(req.body.free_sallary_temp_no)
              {
                search_option.$match.free_sallary_temp_no=parseInt(req.body.free_sallary_temp_no);
              }
              if(req.body.free_sallary_head_no)
              {
                search_option.$match.free_sallary_head_no=parseInt(req.body.free_sallary_head_no);
              }
              if(req.body.status)
              {
                search_option.$match.status=req.body.status;
              }
              
          }
            //console.log(search_option);
            var myAggregate = Plan.aggregate([
              search_option,
              {$lookup:{
                from: 'packages',
                localField: 'package_id',
                foreignField: '_id',
                as: 'package'
              }},
              { "$project": { 
                "_id":1,
                "plan_name":1,
                "monthly_rental_date":1,
                "free_emp_no":1,
                "additional_emp_cost":1,
                "free_staff_no":1,
                "additional_staff_cost":1,
                "free_sallary_temp_no":1,
                "additional_sallary_temp_cost":1,
                "free_sallary_head_no":1,
                "additional_sallary_head_cost":1,
                "trigger_suspend_no":1,
                "max_suspend_period":1,
                "valid_from":1,
                "status":1,
                "package_id":1,
                "package.package_name":1,
                "package._id":1,
                "history":1,
              }
            },
            ]);
            Plan.aggregatePaginate(myAggregate,options, async function (err, plans) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', plans: plans });
            })
          }
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    // get_plan_list: async function (req, resp, next) {
    //     try{
    //         const v = new Validator(req.body, {
    //             pageno: 'required',
    //         });
    //         const matched = await v.check();
    //         if (!matched) {
    //             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //         }
    //         else{
    //             const options = {
    //                 page: req.body.pageno,
    //                 limit: perpage,
    //                 sort:     { created_at: -1 },
    //             };
    //             var filter_option={};
    //             if(req.body.searchkey)
    //             {
    //                 filter_option={$or:[{"plan_name":{$regex: req.body.searchkey , $options:"i"}}]};
    //             }
    //             Plan.paginate(filter_option,options,  function (err, package_list) {
    //                 if (err) return resp.json({ status: 'error', message: err.message });
    //                 return resp.status(200).json({ status: 'success', package_list: package_list });
    //             })
    //         }
    //     }
    //     catch (e) {
    //     return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
    //     }
    // },
    update_plan_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            plan_id:'required'
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            Plan.updateOne({'_id':req.body.plan_id},document,  function (err, plan) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", plan: plan });
                }
            
            })
        }
    },
    update_plan_data: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                plan_name: 'required',
                monthly_rental_date:'required',
                free_emp_no:'required',
                additional_emp_cost:'required',
                free_staff_no:'required',
                additional_staff_cost:'required',
                free_sallary_temp_no:'required',
                additional_sallary_temp_cost:'required',
                free_sallary_head_no:'required',
                additional_sallary_head_cost:'required',
                trigger_suspend_no:'required',
                max_suspend_period:'required',
                package_id:'required',
                valid_from:'required',
                plan_id:'required'
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    plan_name:req.body.plan_name,
                    monthly_rental_date:req.body.monthly_rental_date,
                    free_emp_no:req.body.free_emp_no, 
                    additional_emp_cost:req.body.additional_emp_cost, 
                    free_staff_no:req.body.free_staff_no,
                    free_staff_no:req.body.free_staff_no, 
                    additional_staff_cost:req.body.additional_staff_cost, 
                    free_sallary_temp_no:req.body.free_sallary_temp_no, 
                    additional_sallary_temp_cost:req.body.additional_sallary_temp_cost, 
                    free_sallary_head_no:req.body.free_sallary_head_no, 
                    additional_sallary_head_cost:req.body.additional_sallary_head_cost,
                    trigger_suspend_no:req.body.trigger_suspend_no, 
                    max_suspend_period:req.body.max_suspend_period, 
                    package_id:mongoose.Types.ObjectId(req.body.package_id), 
                    package_data:{'package_name':req.body.package_name,'id':req.body.package_id},
                    valid_from:req.body.valid_from, 
                    updated_at: Date.now(),
                };
                var newdocument=Object.assign({},document)
                document.user_name=req.authData.first_name+' '+req.authData.last_name;
                //var newdocument=JSON.parse(JSON.stringify(document))
                newdocument.$addToSet= { history: { $each: [document ] } } 
                var data={
                    corporate_id:req.authData.corporate_id,
                    user_id:req.authData.user_id,
                    message:req.body.plan_name+' has been updated',
                    module_type:'plan_management',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Plan.updateOne({'_id':req.body.plan_id},newdocument,  function (err, plan) {
                    if (err) 
                    {
                        resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        resp.status(200).send({ status: 'success',message:"Plan updated successfully", plan: plan });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_plan_data:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                plan_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Plan.findByIdAndRemove({'_id':req.body.plan_id},  function (err, plan) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Plan deleted successfully", plan: plan });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
