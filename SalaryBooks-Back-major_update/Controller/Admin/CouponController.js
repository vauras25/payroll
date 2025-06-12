var Coupon = require('../../Model/Admin/Coupon');
var Reseller = require('../../Model/Admin/Reseller');
var CreditPurchase = require('../../Model/Company/CreditPurchase');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const {resolve} = require('path');
const absolutePath = resolve('');
const moment = require('moment');
var Site_helper = require("../../Helpers/Site_helper");
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
    
    get_coupons: async function (req, resp, next) {
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
                    limit:req.body.perpage?req.body.perpage:perpage,
                    coupon_expire:{ type: Date ,required: true },
                    select:   '_id coupon_code coupon_type coupon_amount status coupon_expire created_at min_purchase multiuse',
                    sort:    sortoption,
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
                                        {"coupon_code":{$regex: req.body.searchkey , $options:"i"}}
                                    ]
                                }
                            ]
                        };
                }
                Coupon.paginate(filter_option,options,  function (err, coupons) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                   return resp.status(200).json({ status: 'success', coupons: coupons });
                })
                
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_coupon_details: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
                coupon_code: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(403).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var search_option= {$match: {'coupon_code':req.body.coupon_code}} ;
                const options = {};
                if(req.body.generate == 'excel'){
                    if (req.body.row_checked_all === "true") {
                        if(typeof req.body.unchecked_row_ids == "string"){
                            var ids = JSON.parse(req.body.unchecked_row_ids);
                        }
                        else{
                            var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                        }
                        if (ids.length > 0) {
                            ids = ids.map(function (el) {
                                return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match._id = { $nin: ids };
                        }
                    } else {
                        if(typeof req.body.checked_row_ids == "string"){
                            var ids = JSON.parse(req.body.checked_row_ids);
                        }
                        else{
                            var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                        }
                        if (ids.length > 0) {
                            ids = ids.map(function (el) {
                                return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match._id = { $in: ids };
                        }
                    }
                }
                var myAggregate = CreditPurchase.aggregate([
                search_option,
                {$lookup:{
                    from: 'companies',
                    localField: 'corporate_id',
                    foreignField: 'corporate_id',
                    as: 'company'
                }},
                { "$project": { 
                    "_id":1,
                    "credit_qty":1,
                    "credit_amount":1,
                    "razorpay_order_id":1,
                    "company.establishment_name":1,
                    "company._id":1,
                    "date":"$created_at",
                    "history":1,
                }
                },
                { "$addFields": {
                    "company": {
                        "$arrayElemAt": [ "$company", 0 ]
                    }
                    }
                },
                ]);
                if(req.body.generate == 'excel'){
                    myAggregate.then(async (createPurchase) => {
                        var field_list_array=["date","company","credit_amount","credit_quantity","payment_order_id"];
                        var wb = new xl.Workbook();
                        var ws = wb.addWorksheet("Sheet 1");
                        var clmn_id = 1;
                        ws.cell(1, clmn_id++).string("SL");
                        if(field_list_array.includes('date'))
                        {
                            ws.cell(1, clmn_id++).string("Date");
                        }
                        if(field_list_array.includes('company'))
                        {
                            ws.cell(1, clmn_id++).string("Company");
                        }
                        if(field_list_array.includes('credit_amount'))
                        {
                            ws.cell(1, clmn_id++).string("Credit Amount");
                        }
                        if(field_list_array.includes('credit_quantity'))
                        {
                            ws.cell(1, clmn_id++).string("Credit Quantity");
                        }
                        if(field_list_array.includes('payment_order_id'))
                        {
                            ws.cell(1, clmn_id++).string("Payment Order ID");
                        }
                        await Promise.all(createPurchase.map(async function(purchase, index){
                            var index_val = 2;
                            index_val = index_val + index;
                            var clmn_emp_id=1
                            ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                            if(field_list_array.includes('date'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    purchase.date ? String(moment(purchase.date).format('DD/MM/YYYY')) : ""
                                );
                            } 
                            if(field_list_array.includes('company'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    purchase.company ? String(purchase.company.establishment_name) : ""
                                );
                            } 
                            if(field_list_array.includes('credit_amount'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    purchase.credit_amount ? String(purchase.credit_amount) : "0"
                                );
                            }
                            if(field_list_array.includes('credit_quantity'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    purchase.credit_qty ? String(purchase.credit_qty) : "0"
                                );
                            }
                            if(field_list_array.includes('payment_order_id'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    purchase.razorpay_order_id ? String(purchase.razorpay_order_id) : ""
                                );
                            }
                        })).then(async (purchase) => {
                            const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                            if (!fs.existsSync(corporateIdFolder)) {
                                fs.mkdirSync(corporateIdFolder);
                            }
                            await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/coupon-credit-purchase-export.xlsx");
                            file_name = "coupon-credit-purchase-export.xlsx";
                            file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                            await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                            // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"coupon-credit-purchase-export.xlsx",});
                        });
                        // return resp.status(200).json({ status: "success", purchase_history: createPurchase });
                    })
                }
                else{
                    CreditPurchase.aggregatePaginate(myAggregate,options, async function (err, purchase_history) {
                        if (err) return resp.json({ status: 'error', message: err.message });
                        return resp.status(200).json({ status: 'success', purchase_history: purchase_history });
                    })
                }
            }
        }
        catch (e) {
        return resp.status(403).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_coupon: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                coupon_code: 'required|unique_promocode:coupons,coupon_code',
                coupon_type: 'required|in:fixed,percentage',
                multiuse: 'required|in:yes,no',
                coupon_amount: 'required',
                coupon_expire: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.authData);
                var document = {
                    corporate_id:req.authData.corporate_id,
                    coupon_code:req.body.coupon_code, 
                    coupon_type:req.body.coupon_type,
                    coupon_amount:req.body.coupon_amount,
                    min_purchase:req.body.min_purchase?req.body.min_purchase:'NULL',
                    coupon_expire:req.body.coupon_expire, 
                    multiuse:req.body.multiuse,
                    status:"inactive",
                    created_at: Date.now()
                };
                Coupon.create(document,  function (err, coupon) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Coupon created successfully", coupon: coupon });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_code_data: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                coupon_id: 'required',
                coupon_type: 'required|in:fixed,percentage',
                coupon_amount: 'required',
                coupon_expire: 'required',
                multiuse: 'required|in:yes,no',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    coupon_type:req.body.coupon_type,
                    coupon_amount:req.body.coupon_amount,
                    coupon_expire:req.body.coupon_expire,
                    min_purchase:req.body.min_purchase?req.body.min_purchase:'NULL', 
                    multiuse:req.body.multiuse,
                    updated_at: Date.now()
                };
                Coupon.updateOne({'_id':req.body.coupon_id},document,  function (err, coupon) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        return resp.status(200).send({ status: 'success',message:"Coupon updated successfully", coupon: coupon });
                    }
                
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_coupon_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
            coupon_id: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            Coupon.updateOne({'_id':req.body.coupon_id},document,  function (err, coupon) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Status updated successfully", coupon: coupon });
                }
            
            })
        }
    },
    delete_coupon:async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                coupon_id: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                Coupon.findByIdAndRemove({'_id':req.body.coupon_id},  function (err, coupon) {
                    if (err) 
                    {
                        return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                       return resp.status(200).send({ status: 'success',message:"Coupon deleted successfully", coupon: coupon });
                    }
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_payment_history: async function (req, resp, next) {
        try{
            const v = new Validator(req.body, {
              pageno: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(403).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var start_date = req.body.wage_from_date;
                var end_date = req.body.wage_to_date;
                var search_option= {$match:{}} ;
                var search_option_reseller= {$match:{}} ;
                if(start_date && end_date && req.body.corporate_id){
                    search_option = {
                        $match: {
                            $and: [
                            {'corporate_id':req.body.corporate_id},
                            {$or:[ 
                                {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                                { $and:[
                                    {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                                    ]
                                } 
                                ]
                            },
                            { $or:[ 
                                {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                                { $and:[
                                    {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                                    ]
                                } 
                                ]
                            }
                            ],
                        },
                    };
                }
                else if(start_date && end_date){
                    search_option = {
                        $match: {
                            $and: [
                            {$or:[ 
                                {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                                { $and:[
                                    {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                                    ]
                                } 
                                ]
                            },
                            { $or:[ 
                                {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                                { $and:[
                                    {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                                    ]
                                } 
                                ]
                            }
                            ],
                        },
                    };
                }
                else if(req.body.corporate_id){
                   search_option = {
                        $match: {
                            $and: [{'corporate_id':req.body.corporate_id}],
                        },
                    }; 
                }
                if(req.body.reseller_id) {
                    if(req.body.reseller_id.length > 0){
                        if(typeof req.body.reseller_id == "string"){
                            var reseller_ids = JSON.parse(req.body.reseller_id);
                        }
                        else{
                            var reseller_ids = JSON.parse(JSON.stringify(req.body.reseller_id));
                        }
                        if (reseller_ids.length > 0) {
                            reseller_ids = reseller_ids.map(function (el) {
                                return mongoose.Types.ObjectId(el);
                            });
                            search_option_reseller = {
                                $match: {
                                    "company.reseller_id" : { $in: reseller_ids }
                                }
                            };
                        }
                    }
                }
                orderby=  { created_at: 1} 
                if(req.body.orderby == 'desc')
                {
                  orderby=  { created_at: -1 } 
                }
                const options = {
                  page: req.body.pageno,
                  limit: req.body.perpage?req.body.perpage:perpage,
                  sort:     orderby,
                };
                if(req.body.generate == 'excel'){
                    if (req.body.row_checked_all === "true") {
                        if(typeof req.body.unchecked_row_ids == "string"){
                            var ids = JSON.parse(req.body.unchecked_row_ids);
                        }
                        else{
                            var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
                        }
                        if (ids.length > 0) {
                            ids = ids.map(function (el) {
                                return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match._id = { $nin: ids };
                        }
                    } else {
                        if(typeof req.body.checked_row_ids == "string"){
                            var ids = JSON.parse(req.body.checked_row_ids);
                        }
                        else{
                            var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
                        }
                        if (ids.length > 0) {
                            ids = ids.map(function (el) {
                                return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match._id = { $in: ids };
                        }
                    }
                }
                var myAggregate = CreditPurchase.aggregate([
                search_option,
                {$lookup:{
                    from: 'companies',
                    localField: 'corporate_id',
                    foreignField: 'corporate_id',
                    as: 'company'
                }},
                search_option_reseller,
                { "$project": { 
                    "_id":1,
                    "credit_qty":1,
                    "credit_amount":1,
                    "free_credit":1,
                    "coupon_code":1,
                    "razorpay_order_id":1,
                    "inv_id":1,
                    "razorpay_payment_id":1,
                    "gateway":1,
                    "method":1,
                    "payment_details":1,
                    "company.establishment_name":1,
                    "company._id":1,
                    "company.reseller_id":1,
                    "history":1,
                    "status":1,
                    "created_at":1,
                }
                },
                { "$addFields": {
                    "company": {
                        "$arrayElemAt": [ "$company", 0 ]
                    }
                    }
                },
                ]);
                if(req.body.generate == 'excel'){
                    myAggregate.then(async (credit_purchase) => {
                        var field_list_array=["date","invoice_no","transaction_no","gateway","gateway_id","inv_value","payment_value","mode","status"];
                    
                        var wb = new xl.Workbook();
                        var ws = wb.addWorksheet("Sheet 1");
                        var clmn_id = 1;
                        ws.cell(1, clmn_id++).string("SL");
                        if(field_list_array.includes('date'))
                        {
                            ws.cell(1, clmn_id++).string("Date");
                        }
                        if(field_list_array.includes('invoice_no'))
                        {
                            ws.cell(1, clmn_id++).string("Invoice No");
                        }
                        if(field_list_array.includes('transaction_no'))
                        {
                            ws.cell(1, clmn_id++).string("Transaction No");
                        }
                        if(field_list_array.includes('gateway'))
                        {
                            ws.cell(1, clmn_id++).string("Gateway");
                        }
                        if(field_list_array.includes('gateway_id'))
                        {
                            ws.cell(1, clmn_id++).string("Gateway Id");
                        }
                        if(field_list_array.includes('inv_value'))
                        {
                            ws.cell(1, clmn_id++).string("Invoice Value");
                        }
                        if(field_list_array.includes('payment_value'))
                        {
                            ws.cell(1, clmn_id++).string("Payment Value");
                        }
                        if(field_list_array.includes('mode'))
                        {
                            ws.cell(1, clmn_id++).string("Mode");
                        }
                        if(field_list_array.includes('status'))
                        {
                            ws.cell(1, clmn_id++).string("Status");
                        }
                        await Promise.all(credit_purchase.map(async function (credit_data, index) {
                            var index_val = 2;
                            index_val = index_val + index;
                            var clmn_emp_id=1
                            ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                            if(field_list_array.includes('date'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.created_at ? String(moment(credit_data.created_at).format('DD/MM/YYYY')) : ""
                                    );
                            }
                            if(field_list_array.includes('invoice_no'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.inv_id ? String(credit_data.inv_id) : ""
                                    );
                            }
                            if(field_list_array.includes('transaction_no'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.razorpay_payment_id ? String(credit_data.razorpay_payment_id) : ""
                                    );
                            }
                            if(field_list_array.includes('gateway'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.gateway ? String(credit_data.gateway) : ""
                                    );
                            }
                            if(field_list_array.includes('gateway_id'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.razorpay_order_id ? String(credit_data.razorpay_order_id) : ""
                                    );
                            }
                            if(field_list_array.includes('inv_value'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.credit_qty ? String(credit_data.credit_qty) : ""
                                    );
                            }
                            if(field_list_array.includes('payment_value'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.credit_amount ? String(credit_data.credit_amount) : ""
                                    );
                            }
                            if(field_list_array.includes('mode'))
                            {
                                ws.cell(index_val, clmn_emp_id++).string(
                                    credit_data.method ? String(credit_data.method) : ""
                                    );
                            }
                            if(field_list_array.includes('status'))
                            {
                                if(credit_data.status == 'active'){
                                    ws.cell(index_val, clmn_emp_id++).string("Success");
                                }
                                else{
                                    ws.cell(index_val, clmn_emp_id++).string("Fail");
                                }
                            }
                        })).then(async (value) => {
                            // wb.write("");
                            const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                            if (!fs.existsSync(corporateIdFolder)) {
                                fs.mkdirSync(corporateIdFolder);
                            }
                            await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/admin-credit-purchase-history-export.xlsx");
                            file_name = "admin-credit-purchase-history-export.xlsx";
                            file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                            await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                            // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-credit-purchase-history-export.xlsx",});
                        });
                    });
                }
                else{
                    CreditPurchase.aggregatePaginate(myAggregate,options, async function (err, payment_history) {
                        if (err) return resp.json({ status: 'error', message: err.message });
                        return resp.status(200).json({ status: 'success', payment_history: payment_history });
                    })
                }
            }
        }
        catch (e) {
        return resp.status(403).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
}
