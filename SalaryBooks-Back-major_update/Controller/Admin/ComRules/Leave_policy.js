var Attendancerule = require('../../../Model/Admin/Attendance');
const { Validator } = require('node-input-validator');
module.exports = {
    
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
                    sort:    sortoption,
                };
                var filter_option={};
                if(req.body.searchkey)
                { 
                    filter_option={$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i"}},
                            {"template_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]};
                }
                //console.log(filter_option);
                Attendancerule.paginate(filter_option,options,  function (err, bonus) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', bonus: bonus });
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
                cut_off_day_custom: 'required',
                no_of_days          : 'required',
                absent     : 'required',
                grace_period   : 'required',
                register_type     : 'required',
                full_day_max_hours     : 'required',
                half_day_max_hours     : 'required',
                full_month_days     : 'required|in:yes,no',
                custom_days     : 'required',
                reporting_time     : 'required',
                closing_time     : 'required',
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
                    register_type  : JSON.parse(req.body.register_type), 
                    full_day_max_hours              : req.body.full_day_max_hours,
                    half_day_max_hours              : req.body.half_day_max_hours,
                    full_month_days              : req.body.full_month_days,
                    custom_days              : req.body.custom_days,
                    reporting_time              : req.body.reporting_time,
                    closing_time              : req.body.closing_time,
                    status                      : 'active', 
                    created_at                  : Date.now()
                };
                Attendancerule.create(document,  function (err, attendancerule) {
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
                last_day_of_month    : 'required|in:yes,no',
                cut_off_day_custom: 'required',
                no_of_days          : 'required',
                absent     : 'required',
                grace_period   : 'required',
                register_type     : 'required',
                full_day_max_hours     : 'required',
                half_day_max_hours     : 'required',
                full_month_days     : 'required|in:yes,no',
                custom_days     : 'required',
                reporting_time     : 'required',
                closing_time     : 'required',
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
                    updated_at                  : Date.now()
                };
                Attendancerule.updateOne({'_id':req.body.attedance_id},document,  function (err, attedance) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Attedance rule updated successfully", attedance: attedance });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
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
