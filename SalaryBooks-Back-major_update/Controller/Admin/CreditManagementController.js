var AdminSettings = require('../../Model/Admin/AdminSettings');
const { Validator } = require('node-input-validator');
module.exports = {
    
    get_settings_value: async function (req, resp, next) {
        try{
            AdminSettings.findOne({corporate_id:req.authData.corporate_id},'credit_value credit_amount gst_amount',  function (err, settings) {
                if (err) return resp.json({ status: 'error', message: 'no data found' });
               return resp.status(200).json({ status: 'success', settings_value: settings });
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    update_credit_value: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                credit_value: 'required',
                credit_amount: 'required',
                gst_amount: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                //console.log(req.authData);
                var document = {
                    corporate_id:req.authData.corporate_id,
                    credit_value:req.body.credit_value, 
                    credit_amount:req.body.credit_amount,
                    gst_amount:req.body.gst_amount,
                    status:"active",
                    created_at: Date.now(),
                    updated_at: Date.now()
                };
                await AdminSettings.findOneAndUpdate({'corporate_id':req.authData.corporate_id},document,{upsert: true, new: true, setDefaultsOnInsert: true},  function (err, settings_value) {
                    if (err) resp.status(200).send({ status: 'error', message: err.message });
                    //console.log(holidays)
                   return  resp.status(200).send({ status: 'success',message:"Settings updated successfully", settings_value: settings_value });
                })
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    
    
    
}
