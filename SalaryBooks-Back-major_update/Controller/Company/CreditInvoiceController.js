var CreditInvoice = require('../../Model/Company/CreditInvoice');
const { Validator } = require('node-input-validator');
var crypto = require("crypto");
var Site_helper = require('../../Helpers/Site_helper');
module.exports = {
    create_update_credit_inv_template: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                template_name: 'required',
                com_address: 'required',
                com_state_name: 'required',
                com_state_code: 'required',
                invoice_prefix: 'required',
                mode_of_pay: 'required',
                terms_of_delivery: 'required',
                entity_name: 'required',
                entity_description: 'required',
                hsn_sac: 'required',
                com_pan: 'required',
                declaration: 'required',
                com_bank_details: 'required',
                footer_text: 'required',
                status: 'required|in:active,inactive',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
    
                var document = {
                    template_name:req.body.template_name,
                    com_address:req.body.com_address,
                    com_state_name:req.body.com_state_name,
                    com_state_code:req.body.com_state_code,
                    invoice_prefix:req.body.invoice_prefix,
                    mode_of_pay:req.body.mode_of_pay,
                    terms_of_delivery:req.body.terms_of_delivery,
                    entity_name:req.body.entity_name,
                    entity_description:req.body.entity_description,
                    hsn_sac:req.body.hsn_sac,
                    com_pan:req.body.com_pan,
                    declaration:req.body.declaration,
                    com_bank_details:req.body.com_bank_details,
                    footer_text:req.body.footer_text,
                    status:req.body.status,
                    updated_at: Date.now()
                };
                var obj = req.files;
                if(obj)
                {
                    await Promise.all(obj.map(async (file) => {
                        if(file.fieldname === 'credit_inv_logo')
                        {
                            document['credit_inv_logo']=file.path;
                        }
                    }));
                }
                
                CreditInvoice.findOneAndUpdate({'corporate_id':req.authData.corporate_id},document,{upsert: true, new: true, setDefaultsOnInsert: true},  function (err, CreditInvoice) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    //console.log(holidays)
                    return  resp.status(200).send({ status: 'success',message:"Credit Invoice data updated successfully", CreditInvoice: CreditInvoice });
                })
            }
        }
        catch (e) {
          return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
        }
    },
    get_credit_inv_template: async function (req, resp, next) {
        try {
            var filter_option={"corporate_id":req.authData.corporate_id};
            CreditInvoice.findOne(filter_option,  function (err, template_list) {
                if (err) return resp.json({ status: 'error', message: 'no data found' });
            return resp.status(200).json({ status: 'success', template_list: template_list });
            })
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
        }
        },
//   get_credit_inv_template: async function (req, resp, next) {
//     try {
//         const v = new Validator(req.body, {
//             pageno: 'required',
//           });
//           const matched = await v.check();
//         if (!matched) {
//             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
//         }
//         else{
//             var sortbyfield = req.body.sortbyfield
//             if(sortbyfield)
//             {
//                 var sortoption = {};
//                 sortoption[sortbyfield] = req.body.ascdesc == 'asc'?1:-1;
//             }
//             else{
//                 var sortoption = {created_at: -1};
//             }
//             const options = {
//                 page: req.body.pageno,
//                 limit: 20,
//                 sort:     sortoption,
//             };
//             var filter_option={"corporate_id":req.authData.corporate_id};
//             CreditInvoice.paginate(filter_option,options,  function (err, template_list) {
//                 if (err) return resp.json({ status: 'error', message: 'no data found' });
//             return resp.status(200).json({ status: 'success', template_list: template_list });
//             })
//         }
//     }
//     catch (e) {
//       return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
//     }
//   },
//   create_credit_inv_template: async function (req, resp, next) {
//     try {
//         const v = new Validator(req.body, {
//             template_name: 'required',
//             template_logo: 'required',
//             com_address: 'required',
//             com_state_name: 'required',
//             com_state_code: 'required',
//             invoice_prefix: 'required',
//             mode_of_pay: 'required',
//             terms_of_delivery: 'required',
//             entity_name: 'required',
//             entity_description: 'required',
//             hsn_sac: 'required',
//             com_pan: 'required',
//             declaration: 'required',
//             com_bank_details: 'required',
//             footer_text: 'required',
//             status: 'required|in:active,inactive',
//           });
//           const matched = await v.check();
//         if (!matched) {
//             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
//         }
//         else{
//             var document = {
//                     corporate_id:req.authData.corporate_id,
//                     template_name:req.body.template_name,
//                     template_logo:req.body.template_logo,
//                     com_address:req.body.com_address,
//                     com_state_name:req.body.com_state_name,
//                     com_state_code:req.body.com_state_code,
//                     invoice_prefix:req.body.invoice_prefix,
//                     mode_of_pay:req.body.mode_of_pay,
//                     terms_of_delivery:req.body.terms_of_delivery,
//                     entity_name:req.body.entity_name,
//                     entity_description:req.body.entity_description,
//                     hsn_sac:req.body.hsn_sac,
//                     com_pan:req.body.com_pan,
//                     declaration:req.body.declaration,
//                     com_bank_details:req.body.com_bank_details,
//                     footer_text:req.body.footer_text,
//                     status:req.body.status,
//                     created_at: Date.now()
//                 };
//                 CreditInvoice.create(document,  function (err, CreditInvoice) {
//                 if (err) resp.status(200).send({ status: 'error', message: err.message });
//                 resp.status(200).send({ status: 'success',message:"Template created successfully", template: CreditInvoice });
//             })
//         }
//     }
//     catch (e) {
//       return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
//     }
//   },
//   update_credit_inv_template: async function (req, resp, next) {
//     try {
//         const v = new Validator(req.body, {
//             template_id:'required',
//             template_name: 'required',
//             template_logo: 'required',
//             com_address: 'required',
//             com_state_name: 'required',
//             com_state_code: 'required',
//             invoice_prefix: 'required',
//             mode_of_pay: 'required',
//             terms_of_delivery: 'required',
//             entity_name: 'required',
//             entity_description: 'required',
//             hsn_sac: 'required',
//             com_pan: 'required',
//             declaration: 'required',
//             com_bank_details: 'required',
//             footer_text: 'required',
//             status: 'required|in:active,inactive',
//           });
//           const matched = await v.check();
//         if (!matched) {
//             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
//         }
//         else{

//             var document = {
//                     template_name:req.body.template_name,
//                     template_logo:req.body.template_logo,
//                     com_address:req.body.com_address,
//                     com_state_name:req.body.com_state_name,
//                     com_state_code:req.body.com_state_code,
//                     invoice_prefix:req.body.invoice_prefix,
//                     mode_of_pay:req.body.mode_of_pay,
//                     terms_of_delivery:req.body.terms_of_delivery,
//                     entity_name:req.body.entity_name,
//                     entity_description:req.body.entity_description,
//                     hsn_sac:req.body.hsn_sac,
//                     com_pan:req.body.com_pan,
//                     declaration:req.body.declaration,
//                     com_bank_details:req.body.com_bank_details,
//                     footer_text:req.body.footer_text,
//                     status:req.body.status,
//                     updated_at: Date.now()
//                 };
//                 CreditInvoice.updateOne({'_id':req.body.template_id},document,  function (err, CreditInvoice) {
//                 if (err) resp.status(200).send({ status: 'error', message: err.message });
//                 resp.status(200).send({ status: 'success',message:"Template updated successfully", template: CreditInvoice });
//             })
//         }
//     }
//     catch (e) {
//       return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
//     }
//   },
  
    // update_credit_inv_template_status: async function (req, resp) {
    //     const v = new Validator(req.body, {
    //         status: 'required',
    //         template_id:'required',
    //     });
    //     const matched = await v.check();
    //     if (!matched) {
    //         return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //     }
    //     else{
    //         var document = {status:req.body.status};
    //         CreditInvoice.updateOne({'_id':req.body.template_id},document,  function (err, CreditInvoice) {
    //             if (err) 
    //             {
    //                 resp.status(200).send({ status: 'error', message: err.message });
    //             }
    //             else{
    //                 resp.status(200).send({ status: 'success',message:"Status updated successfully", template: CreditInvoice });
    //             }
            
    //         })
    //     }
    // },
    
    // delete_credit_inv_template:function (req, resp) {
    //     CreditInvoice.findByIdAndRemove({'_id':req.body.template_id},  function (err, CreditInvoice) {
    //         if (err) 
    //         {
    //             resp.status(200).send({ status: 'error', message: err.message });
    //         }
    //         else{
    //             resp.status(200).send({ status: 'success',message:"Temlate deleted successfully", template: CreditInvoice });
    //         }
           
    //     })
    // }
}