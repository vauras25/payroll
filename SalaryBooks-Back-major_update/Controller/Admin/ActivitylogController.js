const { Validator } = require('node-input-validator');
var Activity_log = require('../../Model/Admin/activity_log');
module.exports = {
    log_history:async function (module_type,pageno) {
        const options = {
            page: pageno,
            limit: perpage,
            sort:     { created_at: -1 },
          };
        var myAggregate = await Activity_log.aggregate([
            { $match:{ status:'active',module_type:module_type }},
            {$lookup:{
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }},
            { 
              "$project": { 
              "_id":1,
              "user_id":1,
              "corporate_id":1,
              "message":1,
              "user.first_name":1,
              "user.last_name":1,
            }
          },
        ]);
        var logdata= await Activity_log.aggregatePaginate(myAggregate,options)
        return logdata;
        
    },
    
    log_entry:async function (log_data) {
        try{
            const v = new Validator(log_data, {
                corporate_id        : 'required',
                user_id        : 'required',
                message        : 'required',
                module_type        : 'required',
                status          :'required',
            });
            const matched = await v.check();
            if (!matched) {
                return { status: 'val_err', message:"Validation error", val_msg: v.errors };
            }
            else{
                var asdas= await Activity_log.create(log_data)
                return asdas;
            }
        }
        catch (e) {
        return { status: 'error', message: e ? e.message:'Something went wrong' };
        }
    }
}
