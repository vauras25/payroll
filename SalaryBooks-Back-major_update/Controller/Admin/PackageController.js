var Package = require('../../Model/Admin/Package');
var PackageOption = require('../../Model/Admin/Package_options');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
module.exports = {
    get_permission_list: async function (req, resp, next) {
        try{
            var filter_option={status:"active"};
            PackageOption.find(filter_option, '_id name slug permission',  function (err, package_option) {
                if (err) return resp.json({ status: 'error', message: 'no data found' });
                return resp.status(200).json({ status: 'success', package_option: package_option });
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_packege: async function (req, resp, next) {
        try{
            // const v = new Validator(req.body, {
            //     package_name: 'required',
            //     gratuity_rule:'required|in:default,customizable,na',
            //     pf_rule:'required|in:default,customizable,na',
            //     esic_rule:'required|in:default,customizable,na',
            //     permission:'required'
            // });
            const v = new Validator(req.body, {
                package_name: 'required',
                employee_vault:'required|numeric',
                gov_pf_rule:'required|in:yes,no',
                gov_esic_rule:'required|in:yes,no',
                gov_gratuity_rule:'required|in:yes,no',
                gov_ptax_rule:'required|in:yes,no',
                gov_bonus_rule:'required|in:yes,no',
                gov_tds_rule:'required|in:yes,no',
                gov_lwf_rule:'required|in:yes,no',
                module:'required'
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    package_name:req.body.package_name,
                    employee_vault:req.body.employee_vault,
                    gov_pf_rule:{'rule_apply':req.body.gov_pf_rule,'rule_type':req.body.gov_pf_rule_type?req.body.gov_pf_rule_type:'','rule_permission':req.body.gov_pf_permission?JSON.parse(req.body.gov_pf_permission):[]}, 
                    gov_esic_rule:{'rule_apply':req.body.gov_esic_rule,'rule_type':req.body.gov_esic_rule_type?req.body.gov_esic_rule_type:'','rule_permission':req.body.gov_esic_permission?JSON.parse(req.body.gov_esic_permission):[]}, 
                    gov_gratuity_rule:{'rule_apply':req.body.gov_gratuity_rule,'rule_type':req.body.gov_gratuity_rule_type?req.body.gov_gratuity_rule_type:'','rule_permission':req.body.gov_gratuity_permission?JSON.parse(req.body.gov_gratuity_permission):[]},
                    gov_ptax_rule:{'rule_apply':req.body.gov_ptax_rule,'rule_type':req.body.gov_ptax_rule_type?req.body.gov_ptax_rule_type:'','rule_permission':req.body.gov_ptax_permission?JSON.parse(req.body.gov_ptax_permission):[]},
                    gov_bonus_rule:{'rule_apply':req.body.gov_bonus_rule,'rule_type':req.body.gov_bonus_rule_type?req.body.gov_bonus_rule_type:'','rule_permission':req.body.gov_bonus_permission?JSON.parse(req.body.gov_bonus_permission):[]},
                    gov_tds_rule:{'rule_apply':req.body.gov_tds_rule,'rule_type':req.body.gov_tds_rule_type?req.body.gov_tds_rule_type:'','rule_permission':req.body.gov_tds_permission?JSON.parse(req.body.gov_tds_permission):[]},
                    gov_lwf_rule:{'rule_apply':req.body.gov_lwf_rule,'rule_type':req.body.gov_lwf_rule_type?req.body.gov_lwf_rule_type:'','rule_permission':req.body.gov_lwf_permission?JSON.parse(req.body.gov_lwf_permission):[]},
                    module:JSON.parse(req.body.module), 
                    status:"active",
                    created_at: Date.now()
                };
                // var document = {
                //     package_name:req.body.package_name,
                //     gratuity_rule:req.body.gratuity_rule,
                //     pf_rule:req.body.pf_rule, 
                //     esic_rule:req.body.esic_rule,
                //     permission:JSON.parse(req.body.permission), 
                //     status:"active",
                //     created_at: Date.now()
                // };
                Package.create(document,  function (err, package) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Package created successfully", package: package });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_package_list: async function (req, resp, next) {
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
                var filter_option={};
                if(req.body.searchkey)
                {
                    filter_option={$or:[{"package_name":{$regex: req.body.searchkey , $options:"i"}}]};
                }
                Package.paginate(filter_option,options,  function (err, package_list) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', package_list: package_list });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_package_data: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                package_id:'required',
                package_name: 'required',
                employee_vault:'required|numeric',
                gov_pf_rule:'required|in:yes,no',
                gov_esic_rule:'required|in:yes,no',
                gov_gratuity_rule:'required|in:yes,no',
                gov_ptax_rule:'required|in:yes,no',
                gov_bonus_rule:'required|in:yes,no',
                gov_tds_rule:'required|in:yes,no',
                gov_lwf_rule:'required|in:yes,no',
                module:'required'
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = { 
                    package_name:req.body.package_name,
                    employee_vault:req.body.employee_vault,
                    gov_pf_rule:{'rule_apply':req.body.gov_pf_rule,'rule_type':req.body.gov_pf_rule_type?req.body.gov_pf_rule_type:'','rule_permission':req.body.gov_pf_permission?JSON.parse(req.body.gov_pf_permission):[]}, 
                    gov_esic_rule:{'rule_apply':req.body.gov_esic_rule,'rule_type':req.body.gov_esic_rule_type?req.body.gov_esic_rule_type:'','rule_permission':req.body.gov_esic_permission?JSON.parse(req.body.gov_esic_permission):[]}, 
                    gov_gratuity_rule:{'rule_apply':req.body.gov_gratuity_rule,'rule_type':req.body.gov_gratuity_rule_type?req.body.gov_gratuity_rule_type:'','rule_permission':req.body.gov_gratuity_permission?JSON.parse(req.body.gov_gratuity_permission):[]},
                    gov_ptax_rule:{'rule_apply':req.body.gov_ptax_rule,'rule_type':req.body.gov_ptax_rule_type?req.body.gov_ptax_rule_type:'','rule_permission':req.body.gov_ptax_permission?JSON.parse(req.body.gov_ptax_permission):[]},
                    gov_bonus_rule:{'rule_apply':req.body.gov_bonus_rule,'rule_type':req.body.gov_bonus_rule_type?req.body.gov_bonus_rule_type:'','rule_permission':req.body.gov_bonus_permission?JSON.parse(req.body.gov_bonus_permission):[]},
                    gov_tds_rule:{'rule_apply':req.body.gov_tds_rule,'rule_type':req.body.gov_tds_rule_type?req.body.gov_tds_rule_type:'','rule_permission':req.body.gov_tds_permission?JSON.parse(req.body.gov_tds_permission):[]},
                    gov_lwf_rule:{'rule_apply':req.body.gov_lwf_rule,'rule_type':req.body.gov_lwf_rule_type?req.body.gov_lwf_rule_type:'','rule_permission':req.body.gov_lwf_permission?JSON.parse(req.body.gov_lwf_permission):[]},
                    module:JSON.parse(req.body.module), 
                    created_at: Date.now()
                };
                Package.updateOne({'_id':req.body.package_id},document,  function (err, package) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Package updated successfully", package: package });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_package_data:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                package_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Package.findByIdAndRemove({'_id':req.body.package_id},  function (err, package) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Package deleted successfully", package: package });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    }
}
