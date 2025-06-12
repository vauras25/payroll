var AdminSettings = require('../../Model/Admin/AdminSettings');
var Coupon = require('../../Model/Admin/Coupon');
var CreditPurchase = require('../../Model/Company/CreditPurchase');
var Company = require('../../Model/Admin/Company');
var CompanyDetails = require('../../Model/Admin/Company_details');
var PaymentSheet = require('../../Model/Company/PaymentSheet');
var CreditInvoice = require('../../Model/Company/CreditInvoice');
var CompanyCreditHistoryLog = require('../../Model/Admin/CompanyCreditHistoryLog');
const { Validator } = require('node-input-validator');
var crypto = require("crypto");
var Site_helper = require('../../Helpers/Site_helper');
const mongoose = require('mongoose');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const {resolve} = require('path');
const absolutePath = resolve('');
const moment = require('moment');
module.exports = {
  get_credit_setting_value: async function (req, resp, next) {
    try {
      var corporate_id=await Site_helper.get_admin_data();
      AdminSettings.findOne({corporate_id:corporate_id},'credit_value credit_amount gst_amount',  function (err, settings) {
        if (err) return resp.json({ status: 'error', message: 'no data found' });
       return resp.status(200).json({ status: 'success', settings_value: settings });
    })
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  check_coupon_code: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        coupon_code: 'required',
        purchase_amount: 'required',
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {
          Coupon.findOne({coupon_code:req.body.coupon_code},'_id coupon_code coupon_type coupon_amount status coupon_expire created_at min_purchase multiuse',  function (err, coupon_data) {
              if (err) return resp.json({ status: 'error', message: 'no data found' });
            if(coupon_data)
            {
              if(coupon_data.status  == 'active' )
              {
                var specific_date = coupon_data.coupon_expire;
                var current_date = new Date();
                if(current_date.getTime() < specific_date.getTime())
                {
                  if(coupon_data.coupon_type  == 'fixed' )
                  {
                    if(parseFloat(coupon_data.min_purchase) <= parseFloat(req.body.purchase_amount) )
                    {
                      if(coupon_data.multiuse == 'no' )
                      {
                        CreditPurchase.findOne({coupon_code:req.body.coupon_code,user_id:req.authData.userdb_id},  function (err, coupon_purchase_data) {
                          if (err) return resp.json({ status: 'error', message: 'no data found' });
                          if(coupon_purchase_data)
                          {
                            return resp.status(200).json({ status: 'error', message:'Invalide Coupon Code' });
                          }
                          else
                          {
                            return resp.status(200).json({ status: 'success', coupon_data: coupon_data });
                          }
                        })
                      }
                      else
                      {
                        return resp.status(200).json({ status: 'success', coupon_data: coupon_data });
                      }
                    }
                    else
                    {
                      return resp.status(200).json({ status: 'error', message:'Invalide Coupon Code.' });
                    }
                  }
                  else
                  {
                    return resp.status(200).json({ status: 'success', coupon_data: coupon_data });
                  }
                }
                else
                {
                  return resp.status(200).json({ status: 'error', message:'Invalide Coupon Code' });
                }
              }
              else
              {
                return resp.status(200).json({ status: 'error', message:'Invalide Coupon Code' });
              }
            }
            else
            {
              return resp.status(200).json({ status: 'error', message:'Invalide Coupon Code' });
            }
        })
      }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  get_order_id: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        coupon_amount: 'required',
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {
        instance.orders.create({
            "amount": parseFloat(req.body.coupon_amount)*100,
            "currency": "INR",
            "receipt": "djreceipt#1",
          }).then((response) => {
            return resp.status(200).send({ status: 'success', message: response });
          }).catch((error) => {
            return resp.status(200).send({ status: 'error', message: 'Page Not Found' });
        })
      }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  verify_order_id: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        razorpay_order_id: 'required',
        razorpay_payment_id: 'required',
        razorpay_signature: 'required',
        credit_amount: 'required',
        credit_qty: 'required',
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {
        let generated_signature = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id ;
        var expectedSignature =crypto.createHmac('sha256', 'D1mSV2IU06FaTyoAD3QtJJfe')
                                .update(generated_signature.toString())
                                .digest('hex');
        if (expectedSignature == req.body.razorpay_signature) {
          //console.log(req.authData)
          var rand_no = Math.floor(1000 + Math.random() * 9000);
          var today = new Date();
          var fiscalyear = 0;
          var free_credit = 0;
          var gst_amount = 0;
          var tax_igst = 0;
          var tax_cgst = 0;
          var tax_sgst = 0;
          var round_off = 0;
          var invoice_prefix = 'PAY';
          var action_type = "credit";
          if ((today.getUTCMonth() + 1) <= 3) {
            fiscalyear = ((today.getYear() - 1)-100) + "-" + (today.getYear()-100)
          } else {
            fiscalyear = (today.getYear() -100) + "-" + ((today.getYear() + 1) -100)
          }
          var adminData = await AdminSettings.findOne();
          var companyData = await CompanyDetails.findOne({'company_id':req.authId});
          var credit_invoice = await CreditInvoice.findOne({'status':'active',"corporate_id":"ivadmin123"});
          if(req.body.coupon_code){
            if(adminData){
              var total_amount_credit =  ((adminData.credit_value / adminData.credit_amount) * parseFloat(req.body.credit_amount));
              free_credit = req.body.credit_qty - total_amount_credit;
            }
            action_type = "credit_coupon";
          }
          if(adminData.gst_amount){
            gst_amount = parseFloat(req.body.credit_amount) *  parseFloat(adminData.gst_amount) / 100;
            tax_igst = gst_amount;
            round_off = (tax_igst - parseInt(tax_igst));
            if(companyData){
              if(companyData.reg_office_address){
                if(companyData.reg_office_address){
                  if(companyData.reg_office_address.state_code && credit_invoice){
                    invoice_prefix = credit_invoice.invoice_prefix;
                    if(parseInt(companyData.reg_office_address.state_code) == parseInt(credit_invoice.com_state_code)){
                      tax_cgst = parseFloat(gst_amount) * global_tax_cgst / 100;
                      tax_sgst = parseFloat(gst_amount) * global_tax_sgst / 100;
                      round_off = (tax_cgst - parseInt(tax_cgst)) + (tax_sgst - parseInt(tax_sgst));
                      tax_igst = 0;
                    }
                  }
                }
              }
            }
          }
          var document={
            corporate_id:req.authData.corporate_id,
            coupon_code:req.body.coupon_code?req.body.coupon_code:'NULL',
            user_id:req.authData.userdb_id,
            credit_qty:req.body.credit_qty,
            credit_amount:req.body.credit_amount,
            igst:tax_igst,
            cgst:tax_cgst,
            sgst:tax_sgst,
            gst_amount:gst_amount,
            round_off:round_off,
            free_credit:free_credit,
            razorpay_order_id:req.body.razorpay_order_id,
            inv_id: invoice_prefix+'/'+rand_no+'/'+fiscalyear,
            razorpay_payment_id:req.body.razorpay_payment_id,
            razorpay_signature:req.body.razorpay_signature,
            status:'active',
            created_at: Date.now()
          };
          var file_path='/storage/company/credit_purchase_invoice/';
          var file_name=invoice_prefix+'-'+rand_no+'-'+fiscalyear+'.pdf';
          instance.payments.fetch(req.body.razorpay_payment_id).then((response) => {
            if(response){
              var up_data = {
                "method": response.method,
                "payment_details": response,
                "gateway": 'razorpay',
                "file_path": file_path+file_name,
              };
              Object.assign(document, up_data);
              CreditPurchase.create(document, async function (err, creditpurchase) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });

                await Site_helper.generate_credit_purchase_invoice_pdf({purchase_data: creditpurchase,company_details:companyData,template:credit_invoice,admin_setting:adminData},file_name,file_path);
                
                Company.findOne({'corporate_id':req.authData.corporate_id},   function (err, pre_comp_det) {
                  if (err) return resp.status(200).send({ status: 'error', message: err.message });
                  var credit_stat=pre_comp_det.credit_stat;
                  credit_stat=(parseFloat(req.body.credit_qty) + parseFloat(pre_comp_det.credit_stat));
                  
                  var document = {
                    'credit_stat':credit_stat,
                  }
                  if(credit_stat > 0){
                    document['suspension'] = 'active'
                  }
                  Company.updateOne({'corporate_id':req.authData.corporate_id},document, async  function (err, comp_det) {
                      if (err) return resp.status(200).send({ status: 'error', message: err.message });
                      var creDetails = await CreditPurchase.findOne({'_id':creditpurchase._id});
                      var coupon_credit_stat=pre_comp_det.credit_stat;
                      if(action_type == "credit_coupon"){
                        if(creDetails){
                          coupon_credit_stat = (parseFloat(coupon_credit_stat)+parseFloat(free_credit));
                          var cr_document = {
                            'corporate_id': creDetails.corporate_id,
                            'wage_month': (new Date().getMonth()+1),
                            'wage_year': new Date().getFullYear(),
                            'company_id': mongoose.Types.ObjectId(pre_comp_det._id),
                            'type': action_type,
                            'details': creDetails,
                            'status': 'active',
                            'balance': free_credit,
                            'credit_balance': coupon_credit_stat,
                          }
                          await CompanyCreditHistoryLog.create(cr_document);
                        }
                      }
                      var cr_document2 = {
                        'corporate_id': creDetails.corporate_id,
                        'wage_month': (new Date().getMonth()+1),
                        'wage_year': new Date().getFullYear(),
                        'company_id': mongoose.Types.ObjectId(pre_comp_det._id),
                        'type': "credit",
                        'details': creDetails,
                        'status': 'active',
                        'balance': req.body.credit_amount,
                        'credit_balance': (parseFloat(coupon_credit_stat)+ parseFloat(req.body.credit_amount)),
                      }
                      await CompanyCreditHistoryLog.create(cr_document2);

                      CreditInvoice.findOne({'status':'active'},  function (err, template_list) {
                        if (err) return resp.json({ status: 'error', message: 'no data found' });
                        return resp.status(200).json({ status: 'success',inv_data:template_list,payment_data:document, message: "payment is successful"});
                      })
                      // return resp.status(200).send({ status: 'success', message: "payment is successful" });
                  })
                })
              })
            }
            else{
              return resp.status(200).send({ status: 'error', message: "Transction Failed" });
            }
          });
          //return resp.status(200).send({ status: 'success', message: "payment is successful" });
        }
        else
        {
          return resp.status(200).send({ status: 'error', message: "Transction Failed" });
        }
      }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
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
            var search_option= {$match: {'corporate_id':req.authData.corporate_id}} ;
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
            if (req.body.searchkey) {
              search_option = {
                $match: {
                  $or: [
                    { razorpay_payment_id: { $regex: req.body.searchkey, $options: "i" } },
                    { inv_id: { $regex: req.body.searchkey, $options: "i" } },
                    { razorpay_order_id: { $regex: req.body.searchkey, $options: "i" } }
                  ],
                  'corporate_id': req.authData.corporate_id
                }

              };
            }
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
                    // wb.write("company-credit-purchase-history-export.xlsx");
						        // let file_location = Site_helper.createFiles(wb,"company-credit-purchase-history-export",'xlsx', req.authData.corporate_id)
                    let file_name = "company-credit-purchase-history-export.xlsx";
                    let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/payment-module');
                    await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                    // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                    // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                    // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +file_location,});
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
  get_sheet_template_list: async function (req, resp, next) {
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
            limit: 20,
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
                                {"template_name":{$regex: req.body.searchkey , $options:"i"}}
                            ]
                        }
                    ]
                };
        }
        PaymentSheet.paginate(filter_option,options,  function (err, template) {
            if (err) return resp.json({ status: 'error', message: 'no data found' });
            return resp.status(200).json({ status: 'success', templates: template });
        })
        
    }
  },
  add_sheet_template: async function (req, resp) {
    const v = new Validator(req.body, {
        template_name: 'required',
        column_list: 'required',
        dropdown_value:'required',
      });
      const matched = await v.check();
    if (!matched) {
        return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    }
    else{
        var document = {
            corporate_id:req.authData.corporate_id,
            template_name:req.body.template_name,
            column_list:JSON.parse(req.body.column_list), 
            dropdown_value:JSON.parse(req.body.dropdown_value), 
            status:'active',
            created_at: Date.now()
          };
        PaymentSheet.create(document,  function (err, template) {
            if (err) return resp.status(200).send({ status: 'error', message: err.message });
            return resp.status(200).send({ status: 'success',message:"Template created successfully", template: template });
        })
    }
  },
  update_sheet_template_data: async function (req, resp) {
    const v = new Validator(req.body, {
        template_id: 'required',
        template_name: 'required',
        column_list: 'required',
        dropdown_value:'required',
      });
      const matched = await v.check();
    if (!matched) {
        return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    }
    else{
      var document = {
          template_id:req.authData.template_id,
          template_name:req.body.template_name,
          column_list:JSON.parse(req.body.column_list),
          dropdown_value:JSON.parse(req.body.dropdown_value),  
          updated_at: Date.now()
        };
        PaymentSheet.updateOne({'_id':req.body.template_id},document,  function (err, template) {
            if (err) 
            {
              return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
              return resp.status(200).send({ status: 'success',message:"Template updated successfully", template: template });
            }
        
        })
    }
  },
  delete_sheet_template_data: async function (req, resp) {
    const v = new Validator(req.body, {
        template_id: 'required',
      });
      const matched = await v.check();
    if (!matched) {
        return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    }
    else{
      PaymentSheet.findByIdAndRemove({'_id':req.body.template_id},  function (err, template) {
        if (err) 
        {
          return resp.status(200).send({ status: 'error', message: err.message });
        }
        else{
          return resp.status(200).send({ status: 'success',message:"Template deleted successfully", template: template });
        }
      })
    }
  },
}