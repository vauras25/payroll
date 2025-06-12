var SalaryTemp = require('../../../Model/Admin/SalaryTemp');
var SalaryTempHead = require('../../../Model/Admin/SalaryTempHead');
const { Validator } = require('node-input-validator');
var Site_helper = require('../../../Helpers/Site_helper');
module.exports = {
    get_salary_template_library: async function (req, resp, next) {
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
                            {"template_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);
                SalaryTemp.paginate(filter_option,options,  function (err, salarytemp_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', salarytemp_rule: salarytemp_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_salary_template_head_library: async function (req, resp, next) {
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
                    limit: req.body.perpage?req.body.perpage:perpage,
                    sort:     sortoption,
                    select:'-history'
                };
                var filter_option={"corporate_id":corporate_id};
                if(req.body.searchkey)
                { 
                    filter_option={$and:[{"corporate_id":corporate_id},{$or:[
                            {"status":{$regex: req.body.searchkey , $options:"i"}},
                            {"full_name":{$regex: req.body.searchkey , $options:"i"}},
                        ]}
                    ]};
                }
                //console.log(filter_option);
                SalaryTempHead.paginate(filter_option,options,  function (err, salarytemphead_rule) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', salarytemphead_rule: salarytemphead_rule });
                })
            }
            
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    
    add_salary_template_head: async function (req, resp) {
        const v = new Validator(req.body, {
            full_name: 'required',
            head_type: 'required|in:earning,deduction',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                corporate_id:req.authData.corporate_id,
                full_name:req.body.full_name,
                abbreviation:req.body.abbreviation,
                head_type:req.body.head_type,
                status:'active', 
                created_at: Date.now()
            };
            SalaryTempHead.create(document,  function (err, salarytemphead) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Salary Template head created successfully", salarytemphead: salarytemphead });
            })
        }
    },
    get_template_head: async function (req, resp, next) {
        try{
            await SalaryTempHead.find({  status:'active' ,"corporate_id":req.authData.corporate_id },'_id full_name abbreviation head_type pre_def_head',  function (err, temp_head) {
                if (!err) 
                {
                    return resp.status(200).send({ status: 'success', message:"", temp_head: temp_head});
                }
            })
        }
        catch(e){
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    
    add_salary_template_data: async function (req, resp) {
        const v = new Validator(req.body, {
            template_name: 'required',
            restricted_pf: 'required',
            voluntary_pf: 'required',
            //no_pension: 'required',
            advance: 'required|in:yes,no',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                corporate_id:req.authData.corporate_id,
                template_name:req.body.template_name,
                restricted_pf:req.body.restricted_pf,
                voluntary_pf:req.body.voluntary_pf,
                //no_pension:req.body.no_pension,
                advance:req.body.advance,
                minimum_wage_amount:req.body.minimum_wage_amount,
                minimum_wage_percentage:req.body.minimum_wage_percentage,
                wage_applicable:req.body.wage_applicable,
                earnings:JSON.parse(req.body.earning),
                status:'active',
                edit_status:'active',
                publish_status:'published',
                created_at: Date.now()
            };
            SalaryTemp.create(document,  function (err, salarytemp) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Salary Template created successfully", salarytemp: salarytemp });
            })
        }
    },
    get_salary_template_list: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
                pageno: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var sortoption = {created_at: -1};
                const options = {
                    page: req.body.pageno,
                    limit: 20,
                    sort:    sortoption,
                };
                var filter_option={"corporate_id":req.authData.corporate_id};
                if(req.body.searchkey)
                    { 
                        filter_option={$and:[{"corporate_id":req.authData.corporate_id},{$or:[
                                {"status":{$regex: ".*" + req.body.searchkey + ".*"}},
                                {"template_name":{$regex: ".*" + req.body.searchkey + ".*", "$options":"i"}},
                            ]}
                        ]};
                }
                SalaryTemp.paginate(filter_option,options,  function (err, salary_template) {
                    if (err) resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', salary_template: salary_template });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    update_salary_template_data: async function (req, resp) {
        const v = new Validator(req.body, {
            template_id:'required',
            template_name: 'required',
            restricted_pf: 'required',
            voluntary_pf: 'required',
            //no_pension: 'required',
            advance: 'required|in:yes,no',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                template_name:req.body.template_name,
                restricted_pf:req.body.restricted_pf,
                voluntary_pf:req.body.voluntary_pf,
                //no_pension:req.body.no_pension,
                advance:req.body.advance,
                minimum_wage_amount:req.body.minimum_wage_amount,
                minimum_wage_percentage:req.body.minimum_wage_percentage,
                wage_applicable:req.body.wage_applicable,
                earnings:JSON.parse(req.body.earning),
            };
            SalaryTemp.updateOne({'_id':req.body.template_id},document,  function (err, salarytemp) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Salary Template updated successfully", salarytemp: salarytemp });
            })
        }
    },
    update_publish_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            template_id:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {publish_status:req.body.status};
            SalaryTemp.updateOne({'_id':req.body.template_id},document,  function (err, template_rule) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", template_rule: template_rule });
                }
            
            })
        }
    },
    update_package_data: async function (req, resp) {
        try{
        const v = new Validator(req.body, {
            package_id:'required',
            package_name: 'required',
            attendance_temp: 'required',
            incentive_temp: 'required',
            bonus_temp: 'required',
            overtime_temp: 'required',
            tds_temp: 'required',
            ptax_temp: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    package_name:req.body.package_name,
                    attendance_temp:req.body.attendance_temp,
                    incentive_temp:req.body.incentive_temp,
                    bonus_temp:req.body.bonus_temp,
                    overtime_temp:req.body.overtime_temp,
                    tds_temp:req.body.tds_temp,
                    ptax_temp:req.body.ptax_temp,
                    updated_at: Date.now()
                    };
                EmployeePackage.updateOne({'_id':req.body.package_id},document,  function (err, packages) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else
                {
                    return resp.status(200).send({ status: 'success', message:"Package has been updated successfully", package: packages });
                }
                    
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
}
