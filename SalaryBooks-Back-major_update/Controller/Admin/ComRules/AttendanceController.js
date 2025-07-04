var Attendancerule = require('../../../Model/Admin/Attendance');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    get_attendance_policy_library: async function (req, resp, next) {
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
                Attendancerule.paginate(filter_option,options,  function (err, attendance_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', attendance_rule: attendance_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_attendance_policy: async function (req, resp, next) {
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
                            {"template_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);
                Attendancerule.paginate(filter_option,options,  function (err, attendancerule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', attendancerule: attendancerule });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_attendance_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name: "required",
                last_day_of_month    : 'required|in:yes,no',
                register_type     : 'required',
                full_month_days     : 'required|in:yes,no',
                reporting_time     : 'required',
                closing_time     : 'required',
                comp_off     : 'required|in:yes,no',
                sandwich_leave     : 'required|in:yes,no',
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
                    template_name       : req.body.template_name,
                    last_day_of_month                : req.body.last_day_of_month,
                    cut_off_day_custom             : req.body.cut_off_day_custom, 
                    no_of_days       : req.body.no_of_days, 
                    absent                : req.body.absent, 
                    grace_period                   : req.body.grace_period, 
                    register_type  : req.body.register_type, 
                    full_day_max_hours              : req.body.full_day_max_hours,
                    half_day_max_hours              : req.body.half_day_max_hours,
                    full_month_days              : req.body.full_month_days,
                    custom_days              : req.body.custom_days,
                    reporting_time              : req.body.reporting_time,
                    closing_time              : req.body.closing_time,
                    comp_off              : req.body.comp_off,
                    sandwich_leave              : req.body.sandwich_leave,
                    publish_status          :  req.body.publish_status,
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
                    message:'New Attendance Policy "'+req.body.template_name+'" has been added',
                    module_type:'com_attendance',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Attendancerule.create(newdocument,  function (err, attendancerule) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Attendance rule created successfully", attendancerule: attendancerule });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_attendance_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name: "required",
                attedance_id: 'required',
                template_name: "required",
                last_day_of_month    : 'required|in:yes,no',
                register_type     : 'required',
                full_month_days     : 'required|in:yes,no',
                reporting_time     : 'required',
                closing_time     : 'required',
                comp_off     : 'required|in:yes,no',
                sandwich_leave     : 'required|in:yes,no',
                publish_status :"required|in:published,privet",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    template_name       : req.body.template_name,
                    last_day_of_month                : req.body.last_day_of_month,
                    cut_off_day_custom             : req.body.cut_off_day_custom, 
                    no_of_days       : req.body.no_of_days, 
                    absent                : req.body.absent, 
                    grace_period                   : req.body.grace_period, 
                    register_type  : req.body.register_type, 
                    full_day_max_hours              : req.body.full_day_max_hours,
                    half_day_max_hours              : req.body.half_day_max_hours,
                    full_month_days              : req.body.full_month_days,
                    custom_days              : req.body.custom_days,
                    reporting_time              : req.body.reporting_time,
                    closing_time              : req.body.closing_time,
                    comp_off              : req.body.comp_off,
                    sandwich_leave              : req.body.sandwich_leave,
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
                    module_type:'com_attendance',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Attendancerule.updateOne({'_id':req.body.attedance_id},newdocument,  function (err, attedance) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Attedance rule updated successfully", attedance: attedance });
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
            attedance_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {publish_status:req.body.status};
            Attendancerule.updateOne({'_id':req.body.attedance_id},document,  function (err, attedance) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", attedance: attedance });
                }
            
            })
        }
    },
    update_active_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            attedance_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            Attendancerule.updateOne({'_id':req.body.attedance_id},document,  function (err, attedance) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", attedance: attedance });
                }
            
            })
        }
    },
    delete_attendance_rule:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                attedance_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Attendancerule.findByIdAndRemove({'_id':req.body.attedance_id},  function (err, attedance) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Attedance rule deleted successfully", attedance: attedance });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
