var Promotion = require('../../../Model/Admin/Promotion');
var Company = require('../../../Model/Admin/Company');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
niv.extend('unique_promocode', async ({ value, args }) => {
    // default field is email in this example
    const filed = args[1] || 'email';
    let condition = {};
    condition[filed] = value;
    if (args[3]) {
      condition['_id'] = { $ne: mongoose.Types.ObjectId(args[3]) };
    }
    let emailExist = await mongoose.model(args[0]).findOne(condition).select(filed);
  
    // email already exists
    if (emailExist) {
      return false;
    }
  
    return true;
  });
module.exports = {
    
    get_promocode_list: async function (req, resp, next) {
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
                filter_option={
                         $and:[
                            {"corporate_id":req.authData.corporate_id},
                            {
                                $or:[
                                    {"status":{$regex: req.body.searchkey , $options:"i"}},
                                    {"promo_code":{$regex: req.body.searchkey , $options:"i"}}
                                ]
                            }
                        ]
                    };
            }
            Promotion.paginate(filter_option,options,  function (err, promocode) {
                if (err) resp.json({ status: 'error', message: 'no data found' });
                return resp.status(200).json({ status: 'success', promocodes: promocode });
            })
            
        }
    },
    add_promocode: async function (req, resp) {
        const v = new Validator(req.body, {
            promo_code: 'required|unique_promocode:promotions,promo_code',
            promo_amount: 'required',
            promotype: 'required|in:fixed,percentage',
            multiuse: 'required|in:yes,no',
            expiration_date: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                corporate_id:req.authData.corporate_id,
                promo_code:req.body.promo_code, 
                promo_amount:req.body.promo_amount,
                promotype:req.body.promotype,
                expiration_date:req.body.expiration_date,
                min_purchase:req.body.min_purchase?req.body.min_purchase:'NULL',
                multiuse:req.body.multiuse,
                status:'inactive', 
                created_at: Date.now()
            };
            Promotion.create(document,  function (err, promocode) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Promo Code created successfully", promocode: promocode });
            })
        }
    },
    promocode_details:function (req, resp) {
        Promotion.findById(req.body.promocode_id,  function (err, promocode) {
            if (err) 
            {
                return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
                Company.find({ 'corporate_id': { $in: promocode.use_user_list }},  function (err, Companylist) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success', Companylist: Companylist });
                    }
                   
                })
                return resp.status(200).send({ status: 'success', branch: branch });
            }
           
        })
    },
    update_promocode_data: async function (req, resp) {
        const v = new Validator(req.body, {
            promocode_id:'required',
            promo_amount: 'required',
            promotype: 'required|in:fixed,percentage',
            multiuse: 'required|in:yes,no',
            expiration_date: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                promo_amount:req.body.promo_amount,
                promotype:req.body.promotype,
                expiration_date:req.body.expiration_date,
                min_purchase:req.body.min_purchase?req.body.min_purchase:'NULL', 
                multiuse:req.body.multiuse,
                updated_at: Date.now()
            };
            Promotion.updateOne({'_id':req.body.promocode_id},document,  function (err, promocode) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Promo code updated successfully", promocode: promocode });
                }
            
            })
        }
    },
    update_promocode_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            promocode_id: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            Promotion.updateOne({'_id':req.body.promocode_id},document,  function (err, promocode) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", promocode: promocode });
                }
            
            })
        }
    },
    delete_promocode:async function (req, resp) {
        const v = new Validator(req.body, {
            promocode_id: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            Promotion.findByIdAndRemove({'_id':req.body.promocode_id},  function (err, promocode) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Promo code deleted successfully", promocode: promocode });
                }
            
            })
        }
    }
}
