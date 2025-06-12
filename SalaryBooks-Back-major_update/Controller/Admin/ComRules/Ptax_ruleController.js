var Ptaxrule = require('../../../Model/Admin/Ptaxrule');
var CouStaCity = require('../../../Model/Admin/Country_state_cities');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    get_states: async function (req, resp, next) {
        try {
            CouStaCity.find({ iso2: req.body.countrycode }, '_id id name iso2 states.id states.name states.state_code', function (err, state_list) {
                if (err) {
                    return resp.json({ status: 'error', message: err.message });
                }
                else {
                    return resp.status(200).json({ status: 'success', state_list: state_list });
                }
            })
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
        }
    },
    get_ptax_rule: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                pageno: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
            }
            else {
                var sortbyfield = req.body.sortbyfield
                if (sortbyfield) {
                    var sortoption = {};
                    sortoption[sortbyfield] = req.body.ascdesc == 'asc' ? 1 : -1;
                }
                else {
                    var sortoption = { created_at: -1 };
                }
                const options = {
                    page: req.body.pageno,
                    limit: req.body.perpage ? req.body.perpage : perpage,
                    sort: sortoption,
                };
                var filter_option = { "corporate_id": req.authData.corporate_id };
                if (req.body.searchkey) {
                    filter_option = {
                        $and: [{ "corporate_id": req.authData.corporate_id }, {
                            $or: [
                                { "status": { $regex: req.body.searchkey, $options: "i" } },
                                { "state_name": { $regex: req.body.searchkey, $options: "i" } },
                            ]
                        }
                        ]
                    };
                }
                //console.log(filter_option);
                Ptaxrule.paginate(filter_option, options, function (err, ptax_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', ptax_rule: ptax_rule });
                })
            }
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
        }
    },
    add_ptax_rule: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                template_name: "required",
                state_name: "required",
                effective_from: "required",
                // tax_range_amount: "required",
                publish_status: "required|in:published,privet",
                salary_type: 'required|in:fixed,earned',
                settlement_frequency: 'required|in:monthly,quaterly,half_yearly,yearly',
            });

            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
            }
            else {
                // let tax_range_amount_new = []
                let tax_range_amount = JSON.parse(req.body.tax_range_amount);

                // Validate if periods and tax_range_amount are present and not empty
                let periods = JSON.parse(req.body.periods);
                if(req.body.settlement_frequency == 'monthly') {

                    if (
                        !Array.isArray(periods) || // Ensure periods is an array
                        periods.some(
                            period => !Array.isArray(period.tax_range_amount) || period.tax_range_amount.length === 0 // Check each period
                        )
                    ) {
                        return resp.status(400).send({
                            status: 'error',
                            message: 'Validation error: Each period must have a non-empty tax_range_amount array.',
                        });
                    }
                } else {

                    // Validate if tax_range_amount is empty
                    if (!tax_range_amount.length) {
                        return resp.status(200).send({
                            status: 'val_err',
                            message: "Validation error",
                            val_msg: { tax_range_amount: "The tax range amount field is mandatory." }
                        });
                    }
                }

                var document = {
                    corporate_id: req.authData.corporate_id,
                    template_name: req.body.template_name,
                    state_id: req.body.state_id,
                    state_name: req.body.state_name,
                    effective_from: req.body.effective_from,
                    salary_type: req.body.salary_type,
                    settlement_frequency: req.body.settlement_frequency,
                    // tax_range_amount: tax_range_amount_new,
                    status: 'active',
                    publish_status: req.body.publish_status,
                    created_at: Date.now()
                };

                if (req.body.settlement_frequency === "monthly" && periods && Array.isArray(periods)) {
                    document.periods = periods.map(period => ({
                        // wage_band: period.wage_band || "no",
                        from_month: period.from_month || null,
                        to_month: period.to_month || null,
                        tax_range_amount: (period.tax_range_amount || []).map(e1 => ({
                            amount_from: e1.amount_from,
                            amount_to: e1.last_slab ? 0 : e1.amount_to,
                            tax_amount: e1.tax_amount,
                            last_slab: e1.last_slab ? "yes" : "no"
                        }))
                    }));
                } else {
                    // Default to tax_range_amount for non-monthly settlement
                    document.tax_range_amount = tax_range_amount.map(e1 => ({
                        amount_from: e1.amount_from,
                        amount_to: e1.last_slab ? 0 : e1.amount_to,
                        tax_amount: e1.tax_amount,
                        last_slab: e1.last_slab ? "yes" : "no"

                    }))
                }

                var newdocument = Object.assign({}, document)
                // console.log(newdocument, "newdocument")
                //var newdocument=JSON.parse(JSON.stringify(document))
                document.user_name = req.authData.first_name + ' ' + req.authData.last_name;
                newdocument.history = [document]

                var data = {
                    corporate_id: req.authData.corporate_id,
                    user_id: req.authData.user_id,
                    message: 'New Ptax Rule has been added',
                    module_type: 'com_ptax',
                    status: 'active'
                }
                var plandata = await Site_helper.log_entry(data);
                if (plandata.status == 'val_err' || plandata.status == 'error') {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Ptaxrule.create(newdocument, function (err, ptax_rule) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success', message: "Ptax rule created successfully", ptax_rule: ptax_rule });
                })
            }

        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
        }
    },

    // add_ptax_rule: async function (req, resp) {
    //     try{
    //         const v = new Validator(req.body, {
    //             // template_name:"required",
    //             state_name: "required",
    //             effective_from: "required",
    //             tax_range_amount: "required",
    //             publish_status :"required|in:published,privet",
    //             salary_type:'required|in:fixed,earned',
    //             settlement_frequency:'required|in:monthly,quaterly,half_yearly,yearly',
    //         });

    //         const matched = await v.check();
    //         if (!matched) {
    //             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //         }
    //         else{
    //             //console.log(req.body)
    //             var document = {
    //                 corporate_id:req.authData.corporate_id,
    //                 template_name           : req.body.template_name? req.body.template_name : "null",
    //                 state_id           : req.body.state_id,
    //                 state_name           : req.body.state_name,
    //                 effective_from           : req.body.effective_from,
    //                 salary_type           : req.body.salary_type,
    //                 settlement_frequency           : req.body.settlement_frequency,
    //                 tax_range_amount           : JSON.parse(req.body.tax_range_amount),
    //                 status                  : 'active', 
    //                 publish_status          :  req.body.publish_status,
    //                 created_at              : Date.now()
    //             };
    //             var newdocument=Object.assign({},document)
    //             //var newdocument=JSON.parse(JSON.stringify(document))
    //             document.user_name=req.authData.first_name+' '+req.authData.last_name;
    //             newdocument.history=[document]
    //             var data={
    //                 corporate_id:req.authData.corporate_id,
    //                 user_id:req.authData.user_id,
    //                 message:'New Ptax Rule has been added',
    //                 module_type:'com_ptax',
    //                 status:'active'
    //             }
    //             var plandata=await Site_helper.log_entry(data);
    //             if(plandata.status == 'val_err' || plandata.status == 'error')
    //             {
    //                 return resp.status(200).json({ status: 'error', message: plandata.message });
    //             }
    //             Ptaxrule.create(newdocument,  function (err, ptax_rule) {
    //                 if (err) return resp.status(200).send({ status: 'error', message: err.message });
    //                 return resp.status(200).send({ status: 'success',message:"Ptax rule created successfully", ptax_rule: ptax_rule });
    //             })
    //         }
    //     }
    //     catch (e) {
    //     return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
    //     }
    // },
    update_ptax_rule: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                // template_name:"required",
                ptax_rule_id: "required",
                state_name: "required",
                effective_from: "required",
                // tax_range_amount: "required",
                publish_status: "required|in:published,privet",
                salary_type: 'required|in:fixed,earned',
                settlement_frequency: 'required|in:monthly,quaterly,half_yearly,yearly',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
            }
            else {
                // var tax_range_amount = JSON.parse(req.body.tax_range_amount);
                let tax_range_amount = JSON.parse(req.body.tax_range_amount);

                // Validate if periods and tax_range_amount are present and not empty
                let periods = JSON.parse(req.body.periods);
                // Validate if periods and tax_range_amount are present and not empty
                if(req.body.settlement_frequency == 'monthly') {

                    if (
                        !Array.isArray(periods) || // Ensure periods is an array
                        periods.some(
                            period => !Array.isArray(period.tax_range_amount) || period.tax_range_amount.length === 0 // Check each period
                        )
                    ) {
                        return resp.status(400).send({
                            status: 'error',
                            message: 'Validation error: Each period must have a non-empty tax_range_amount array.',
                        });
                    }
                } else {

                    // Validate if tax_range_amount is empty
                    if (!tax_range_amount.length) {
                        return resp.status(200).send({
                            status: 'val_err',
                            message: "Validation error",
                            val_msg: { tax_range_amount: "The tax range amount field is mandatory." }
                        });
                    }
                }

                // var tax_range_amount_new = tax_range_amount.map(function (e1) {
                //     if (req.body.settlement_frequency == 'monthly') {
                //         if (e1.last_slab) {

                //             var objectvalue = {
                //                 'amount_from': e1.amount_from,
                //                 'amount_to': 0,
                //                 'tax_amount': e1.tax_amount,
                //                 'last_slab': "yes",
                //                 'wage_band': e1.wage_band,
                //                 'from_month': e1.from_month,
                //                 'to_month': e1.to_month
                //             }
                //         } else {
                //             var objectvalue = {
                //                 'amount_from': e1.amount_from,
                //                 'amount_to': e1.amount_to,
                //                 'tax_amount': e1.tax_amount,
                //                 'last_slab': "no",
                //                 'wage_band': e1.wage_band,
                //                 'from_month': e1.from_month,
                //                 'to_month': e1.to_month
                //             }
                //         }
                //     } else {
                //         if (e1.last_slab) {

                //             var objectvalue = {
                //                 'amount_from': e1.amount_from,
                //                 'amount_to': 0,
                //                 'tax_amount': e1.tax_amount,
                //                 'last_slab': "yes"
                //             }
                //         } else {
                //             var objectvalue = {
                //                 'amount_from': e1.amount_from,
                //                 'amount_to': e1.amount_to,
                //                 'tax_amount': e1.tax_amount,
                //                 'last_slab': "no"
                //             }
                //         }
                //     }
                //     return objectvalue

                // })
                //console.log(req.body)
                var document = {
                    template_name: req.body.template_name ? req.body.template_name : "null",
                    state_id: req.body.state_id,
                    state_name: req.body.state_name,
                    effective_from: req.body.effective_from,
                    salary_type: req.body.salary_type,
                    publish_status: req.body.publish_status,
                    settlement_frequency: req.body.settlement_frequency,
                    // tax_range_amount: tax_range_amount_new,
                    updated_at: Date.now()
                };

                if (req.body.settlement_frequency === "monthly" && periods && Array.isArray(periods)) {
                    document.periods = periods.map(period => ({
                        // wage_band: period.wage_band || "no",
                        from_month: period.from_month || null,
                        to_month: period.to_month || null,
                        tax_range_amount: (period.tax_range_amount || []).map(e1 => ({
                            amount_from: e1.amount_from,
                            amount_to: e1.last_slab ? 0 : e1.amount_to,
                            tax_amount: e1.tax_amount,
                            last_slab: e1.last_slab ? "yes" : "no"
                        }))
                    }));
                } else {
                    // Default to tax_range_amount for non-monthly settlement
                    document.tax_range_amount = tax_range_amount.map(e1 => ({
                        amount_from: e1.amount_from,
                        amount_to: e1.last_slab ? 0 : e1.amount_to,
                        tax_amount: e1.tax_amount,
                        last_slab: e1.last_slab ? "yes" : "no"

                    }))
                }
                
                var newdocument = Object.assign({}, document)
                //var newdocument=JSON.parse(JSON.stringify(document))
                document.user_name = req.authData.first_name + ' ' + req.authData.last_name;
                newdocument.$addToSet = { history: { $each: [document] } }
                var data = {
                    corporate_id: req.authData.corporate_id,
                    user_id: req.authData.user_id,
                    message: 'Ptax Rule has been updated',
                    module_type: 'com_ptax',
                    status: 'active'
                }
                var plandata = await Site_helper.log_entry(data);
                if (plandata.status == 'val_err' || plandata.status == 'error') {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                Ptaxrule.updateOne({ '_id': req.body.ptax_rule_id }, newdocument, function (err, ptax_rule) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success', message: "Ptax rule updated successfully", ptax_rule: ptax_rule });
                })
            }
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
        }
    },
    update_publish_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            ptax_rule_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
        }
        else {
            var document = { publish_status: req.body.status };
            Ptaxrule.updateOne({ '_id': req.body.ptax_rule_id }, document, function (err, ptax_rule) {
                if (err) {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else {
                    return resp.status(200).send({ status: 'success', message: "Status updated successfully", ptax_rule: ptax_rule });
                }

            })
        }
    },
    update_active_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            ptax_rule_id: 'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
        }
        else {
            var document = { status: req.body.status };
            Ptaxrule.updateOne({ '_id': req.body.ptax_rule_id }, document, function (err, ptax_rule) {
                if (err) {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else {
                    return resp.status(200).send({ status: 'success', message: "Status updated successfully", ptax_rule: ptax_rule });
                }

            })
        }
    },

    delete_ptax_rule: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                ptax_rule_id: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
            }
            else {
                Ptaxrule.findByIdAndRemove({ '_id': req.body.ptax_rule_id }, function (err, ptax_rule) {
                    if (err) {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else {
                        return resp.status(200).send({ status: 'success', message: "Ptax rule deleted successfully", ptax_rule: ptax_rule });
                    }

                })
            }
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
        }
    },
    get_ptax_rule_library: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                pageno: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
            }
            else {
                var corporate_id = await Site_helper.get_admin_data();
                var sortbyfield = req.body.sortbyfield
                if (sortbyfield) {
                    var sortoption = {};
                    sortoption[sortbyfield] = req.body.ascdesc == 'asc' ? 1 : -1;
                }
                else {
                    var sortoption = { created_at: -1 };
                }
                const options = {
                    page: req.body.pageno,
                    limit: perpage,
                    sort: sortoption,
                    select: '-history'
                };
                var filter_option = { "corporate_id": corporate_id, 'publish_status': 'published' };
                if (req.body.searchkey) {
                    filter_option = {
                        $and: [{ "corporate_id": corporate_id }, { 'publish_status': 'published' }, {
                            $or: [
                                { "status": { $regex: req.body.searchkey, $options: "i" } },
                                { "state_name": { $regex: req.body.searchkey, $options: "i" } },
                            ]
                        }
                        ]
                    };
                }
                //console.log(filter_option);
                Ptaxrule.paginate(filter_option, options, function (err, ptax_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', ptax_rule: ptax_rule });
                })
            }

        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
        }
    },
}
