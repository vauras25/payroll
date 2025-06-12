var ITcategory = require('../../../Model/Admin/Incometaxcategory');
var IncometaxRule = require('../../../Model/Admin/Incometaxrule');
//var Activity_log = require('../../../Model/Admin/activity_log');
var Site_helper = require('../../../Helpers/Site_helper');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
niv.extend('check_between', async ({ value, args }) => {
    // default field is email in this example
    //console.log(value,args)
    const filed = args[1] || 'financial_year_from';
    const filed2 = args[2] || 'financial_year_to';
    const corporate_id = args[3] ;
    let condition = {};
  
    condition = {
        $and: [
            { 'corporate_id': {'$eq': corporate_id } },
            { 'financial_year_from': {'$lte': value } },
            { 'financial_year_to': {'$gte': value } },
            { '_id':{$ne: mongoose.Types.ObjectId(args[4])} }
        ]
    };
    
    let dataExist = await mongoose.model(args[0]).find(condition).select(filed);
    //let dataExist = await mongoose.model(args[0]).find(condition).select(filed);
    //console.log(dataExist,'-----------------')
    //return false;
    if (dataExist.length>0) {
      return false;
    }
  
    return true;
  });
module.exports = {

    validate_financial_year:async function (req, resp) {
        try{

            const fromdate = req.body.fromdate;
            const todate = req.body.todate;
            const tax_slab_id = req.body.tax_slab_id;
            if(fromdate == '' || fromdate == null)
            {
                return resp.status(200).send({ status: 'error',message:"Please enter financial year from "});
            }
            if(todate == '' || todate == null)
            {
                return resp.status(200).send({ status: 'error',message:"Please enter a financial year to"});
            }
            IncometaxRule.find({
                $and: [
                    { 'corporate_id': {'$eq': req.authData.corporate_id } },
                    {
                        $or:[
                            {
                                $and: [
                                    { 'financial_year_from': {'$lte': fromdate } },
                                    { 'financial_year_to': {'$gte': fromdate } },
                                    { '_id':{$ne: mongoose.Types.ObjectId(tax_slab_id)} }
                                ]
                            },
                            {
                                $and: [
                                    { 'financial_year_from': {'$lte': todate } },
                                    { 'financial_year_to': {'$gte': todate } },
                                    { '_id':{$ne: mongoose.Types.ObjectId(tax_slab_id)} }
                                ]
                            },
                            {
                                $and: [
                                    { 'financial_year_from': {'$gte': fromdate } },
                                    { 'financial_year_from': {'$lte': todate } },
                                    { '_id':{$ne: mongoose.Types.ObjectId(tax_slab_id)} }
                                ]
                            },
                            {
                                $and: [
                                    { 'financial_year_to': {'$lte': fromdate } },
                                    { 'financial_year_to': {'$gte': todate } },
                                    { '_id':{$ne: mongoose.Types.ObjectId(tax_slab_id)} }
                                ]
                            },
                        ]
                    }
                ]
                

                },  function (err, incometax) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    if(incometax.length>0)
                    {
                        return resp.status(200).send({ status: 'error',message:"Please enter a different financial year"});
                    }
                    else
                    {
                        return resp.status(200).send({ status: 'success',message:"" });
                    }
                }
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_tax_category: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                category_name        : 'required',
                age_upper_limit        : 'required',
                age_lower_limit        : 'required',
                gender        : 'required|in:m,f,o,t',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                        corporate_id                : req.authData.corporate_id,
                        category_name               : req.body.category_name,
                        age_upper_limit             : req.body.age_upper_limit,
                        age_lower_limit             : req.body.age_lower_limit,
                        gender                      : req.body.gender, 
                        status                      : 'active', 
                        created_at                  : Date.now()
                    };
                ITcategory.create(document,  function (err, category) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Category created successfully", category: category });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_taxslab_categories: async function (req, resp, next) {
        try{
            ITcategory.find({  status:'active',corporate_id : req.authData.corporate_id }, '_id category_name age_upper_limit age_lower_limit gender', function (err, categories) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', categories: categories });
            })
        }
        catch (e) {
        return resp.status(200).json({status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_tax_category: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                tax_category_id   :'required',
                category_name        : 'required',
                age_upper_limit        : 'required',
                age_lower_limit        : 'required',
                gender        : 'required|in:m,f,o,t',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    category_name               : req.body.category_name,
                    age_upper_limit             : req.body.age_upper_limit,
                    age_lower_limit             : req.body.age_lower_limit,
                    gender                      : req.body.gender, 
                    updated_at                  : Date.now()
                };
               
                ITcategory.updateOne({'_id':req.body.tax_category_id},document,  function (err, taxCategory) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Income Tax Category updated successfully", taxCategory: taxCategory });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_tax_category:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                tax_category_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                ITcategory.findByIdAndRemove({'_id':req.body.tax_category_id},  function (err, taxCategory) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Income Tax Category deleted successfully", taxCategory: taxCategory });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_taxslab_list: async function (req, resp, next) {
        try{

            if(req.body.pagination) {
                const v = new Validator(req.body, {
                pageno: 'required',
                });
                const matched = await v.check();
                if (!matched) {
                    return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
                }
            } 
        //  else{
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
            var search_option= {$match: {}};
            if(req.body.searchkey)
            {
              search_option={ $match: { 
                $or:[
                    {"template_name":{$regex: req.body.searchkey , $options:"i", $options:"i"}},
                    {"category":{$regex: req.body.searchkey , $options:"i", $options:"i"}},
                    {"financial_year_from":+req.body.searchkey || null},
                    {"financial_year_to":+req.body.searchkey || null},
                ]
               }};    
            }

            if(req.body.status) {
                search_option={ $match: { status:req.body.status }}
            }
            //console.log(req.authData)
            //console.log('------------------------')
            //console.log(search_option);
            search_option.$match['corporate_id']=req.authData.corporate_id;
            var myAggregate = IncometaxRule.aggregate([
              search_option,
              {$lookup:{
                from: 'income_tax_categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categorydata'
              }},
              { 
                "$project": { 
                "_id":1,
                "corporate_id":1,
                "template_name":1,
                "category":1,
                "financial_year_from":1,
                "financial_year_to":1,
                "income_tax_slab":1,
                "effective_date":1,
                "categorydata.category_name":1,
                "history":1
              }
            },
            ]);

            if(req.body.pagination) {
                IncometaxRule.aggregatePaginate(myAggregate,options, async function (err, incometax) {
                    if (err) return resp.json({ status: 'error', message: err.message });
                    return resp.status(200).json({ status: 'success', incometax: incometax});
                })
            }else{
                myAggregate.then((res) =>{
                    return resp.status(200).json({ status: 'success', incometax: res});
                }).catch((err)=> {
                    if (err) return resp.json({ status: 'error', message: err.message || err || 'Something went wrong' });
                })
            }
          }
        // }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_taxslab_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                template_name        : 'required',
                category        : 'required',
                financial_year_from        : 'required|check_between:incometax_rules,financial_year_from,financial_year_to,'+req.authData.corporate_id,
                financial_year_to        : 'required|check_between:incometax_rules,financial_year_from,financial_year_to,'+req.authData.corporate_id,
                income_tax_slab : 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                
                var document = {
                        corporate_id                : req.authData.corporate_id,
                        template_name                     : req.body.template_name, 
                        category                    : req.body.category,
                        category_name                    : req.body.category_name,
                        financial_year_from         : req.body.financial_year_from, 
                        financial_year_to           : req.body.financial_year_to, 
                        income_tax_slab             : JSON.parse(req.body.income_tax_slab), 
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
                    message:'New Tax Slab "'+req.body.template_name+'" has been added',
                    module_type:'gov_income_tax_slab',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                if(plandata.status == 'val_err' || plandata.status == 'error')
                {
                    return resp.status(200).json({ status: 'error', message: plandata.message });
                }
                IncometaxRule.create(newdocument,  function (err, incometax) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Income Tax slab created successfully", incometax: incometax });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_taxslab_rule: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                taxslab_id                  :'required',
                template_name        : 'required',
                category        : 'required',
                financial_year_from        : 'required|check_between:incometax_rules,financial_year_from,financial_year_to,'+req.authData.corporate_id+','+req.body.taxslab_id,
                financial_year_to        : 'required|check_between:incometax_rules,financial_year_from,financial_year_to,'+req.authData.corporate_id+','+req.body.taxslab_id,
               income_tax_slab : 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.body)
                var document = {
                    template_name                     : req.body.template_name, 
                    category                    : req.body.category,
                    category_name                    : req.body.category_name,
                    financial_year_from         : req.body.financial_year_from, 
                    financial_year_to           : req.body.financial_year_to, 
                    income_tax_slab             : JSON.parse(req.body.income_tax_slab), 
                    updated_at: Date.now()
                    };
                var newdocument=Object.assign({},document)
                //var newdocument=JSON.parse(JSON.stringify(document))
                document.user_name=req.authData.first_name+' '+req.authData.last_name;
                newdocument.$addToSet= { history: { $each: [document ] } }
                var data={
                    corporate_id:req.authData.corporate_id,
                    user_id:req.authData.user_id,
                    message:req.body.template_name+' has been updated',
                    module_type:'gov_income_tax_slab',
                    status:'active'
                }
                var plandata=await Site_helper.log_entry(data);
                IncometaxRule.updateOne({'_id':req.body.taxslab_id},newdocument,  function (err, incometax) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Income Tax slab updated successfully", incometax: incometax });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    delete_taxslab_data:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                taxslab_id:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                IncometaxRule.findByIdAndRemove({'_id':req.body.taxslab_id},  function (err, incometax) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Income Tax slab deleted successfully", incometax: incometax });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_active_incometax_rule: async function (req, resp, next) {
        try{
            
            const options = {
                limit: 1,
                sort:   {effective_date: -1},
                select: '-history'
            };
            var corporate_id=await Site_helper.get_admin_data();
            var filter_option={"corporate_id":corporate_id,effective_date:{$lte:new Date()}};
           
            IncometaxRule.paginate(filter_option,options,  function (err, incometaxrule) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', incometaxrule: incometaxrule.docs[0] ?incometaxrule.docs[0] : {} });
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_taxslab_categories_library: async function (req, resp, next) {
        try{

            // const v = new Validator(req.body, {
            //     pageno: 'required',
            //   });
            //   const matched = await v.check();
            //   if (!matched) {
            //       return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            //   }
            //   else{
            //     var sortbyfield = req.body.sortbyfield
            //     if(sortbyfield)
            //     {
            //         var sortoption = {};
            //         sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
            //     }
            //     else{
            //         var sortoption = {created_at: -1};
            //     }
            //     const options = {
            //       page: req.body.pageno,
            //       limit: req.body.perpage?req.body.perpage:perpage,
            //       sort:    sortoption,
            //     };
            //     let filters = {};
            //     // var filter_option={};
            //     // var search_option= {$match: {}};
            //     if(req.body.searchkey){
            //         filters["$text"] = {$search:req.body.searchkey} 
            //     }
                
            //     // {
            //     //   search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            //     // }
            //     //console.log(req.authData)
            //     //console.log('------------------------')
            //     //console.log(search_option);
            //     filters['corporate_id'] = await Site_helper.get_admin_data();

            //     ITcategory.find(filters, (err, docs) => {
            //         if (err)
            //           return resp.status(200).json({
            //             status: "error",
            //             message: err,
            //           });
            //         return resp.status(200).send({
            //           status: "success",
            //           categories:docs,
            //         })
            //       }).limit(options.limit)
            //       .skip((options.page - 1) * options.limit)
            //       .sort(options.sort);
              
           
            //   }
            ITcategory.find({  status:'active',corporate_id : await Site_helper.get_admin_data() }, '_id category_name age_upper_limit age_lower_limit gender', function (err, categories) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', categories: categories });
            })
        }
        catch (e) {
        return resp.status(200).json({status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_taxslab_list_library: async function (req, resp, next) {
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
              var search_option= {$match: {}};
              if(req.body.searchkey)
              {
                search_option={ $match: { $text: { $search: req.body.searchkey } }};    
              }
              //console.log(req.authData)
              //console.log('------------------------')
              //console.log(search_option);
              search_option.$match['corporate_id']= await Site_helper.get_admin_data();
              var myAggregate = IncometaxRule.aggregate([
                search_option,
                {$lookup:{
                  from: 'income_tax_categories',
                  localField: 'category',
                  foreignField: '_id',
                  as: 'categorydata'
                }},
                { 
                  "$project": { 
                  "_id":1,
                  "corporate_id":1,
                  "template_name":1,
                  "category":1,
                  "financial_year_from":1,
                  "financial_year_to":1,
                  "income_tax_slab":1,
                  "effective_date":1,
                  "categorydata.category_name":1,
                  "history":1
                }
              },
              ]);
              IncometaxRule.aggregatePaginate(myAggregate,options, async function (err, incometax) {
                  if (err) return resp.json({ status: 'error', message: err.message });
                  return resp.status(200).json({ status: 'success', incometax: incometax});
              })
            }
          }
          catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
          }
        
    },
}
