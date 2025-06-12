var Expenses = require('../../Model/Company/Expenses');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
niv.extend('unique_clientid', async ({ value, args }) => {
    // default field is email in this example
    const filed = args[1] || 'email';
    let condition = {};
  //console.log('asd'+args)
  //return args;
    condition[filed] = value;
    condition['corporate_id'] = { $eq: args[2] };
    // add ignore condition
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
    
    get_expenses: async function (req, resp, next) {
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
                                        {"client_name":{$regex: req.body.searchkey , $options:"i"}}
                                    ]
                                }
                            ]
                        };
                }
                Expenses.paginate(filter_option,options,  function (err, expenses) {
                    if (err) return resp.json({ status: 'error', message: 'no data found' });
                    return resp.status(200).json({ status: 'success', expenses: expenses });
                })
                
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    add_expenses: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                amount: 'required',
                hod: 'required',
                exp_date: 'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    amount:req.body.amount,
                    hod:req.body.hod, 
                    exp_date:req.body.exp_date,
                    settlement_status:'pending',
                    status:'active',
                    description:req.body.description,  
                    created_at: Date.now()
                };
                var obj = req.files;
                await Promise.all(obj.map(async (file) => {
                    if(file.fieldname === 'expense_docu')
                    {
                        document['expense_docu']=file.path;
                    }
                }));
                Expenses.create(document,  function (err, expenses) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Expense submited successfully", expenses: expenses });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    delete_expense_record:function (req, resp) {
        try{
            Expenses.findByIdAndRemove({'_id':req.body.expense_id},  function (err, expenses) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                    return resp.status(200).send({ status: 'success',message:"Expense deleted successfully", expenses: expenses });
                }
            });
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    }
}
