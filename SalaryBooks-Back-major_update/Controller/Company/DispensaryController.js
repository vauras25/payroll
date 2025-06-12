var Dispensary = require('../../Model/Company/Dispensary');
const { Validator } = require('node-input-validator');
module.exports = {
    get_dispensary_list: async function (req, resp, next) {
        try{
            var sortoption = {created_at: -1};
            const options = {
                select:   'dispensary_name _id',
                sort:    sortoption,
            };
            var filter_option={"corporate_id":req.authData.corporate_id};
            Dispensary.paginate(filter_option,options,  function (err, dispensary) {
                if (err) resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', dispensary: dispensary });
            });
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    add_dispensary_data: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                dispensary_name: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    dispensary_name:req.body.dispensary_name, 
                    status:'active', 
                    created_at: Date.now()
                };
                Dispensary.create(document,  function (err, dispensary) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Dispensary created successfully", dispensary: dispensary });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    
}
