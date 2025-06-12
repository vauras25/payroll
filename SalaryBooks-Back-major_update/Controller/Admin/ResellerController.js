var Reseller = require('../../Model/Admin/Reseller');
var Branch = require('../../Model/Admin/Branch');
var CouStaCity = require('../../Model/Admin/Country_state_cities');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
module.exports = {
   get_state_city_list: function(req, resp, next){
    CouStaCity.find({  iso2:req.body.countrycode },'_id id name iso2 states',  function (err, state_list) {
      if (err) {
        return resp.json({ status: 'error', message: err.message });
      }
      else{
        return resp.status(200).json({ status: 'success', state_list: state_list });
      }
    })
   },
    get_reseller_list: async function (req, resp, next) {
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
            var filter_option={};
            var search_option= {$match: {}} ;
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            }
            
            //console.log(search_option);
            var myAggregate = Reseller.aggregate([
              search_option,
              {$lookup:{
                from: 'branches',
                localField: 'branch_id',
                foreignField: '_id',
                as: 'branches'
              }},
              {$lookup:{
                from: 'resellers',
                localField: 'reseller_of',
                foreignField: '_id',
                as: 'reseller'
              }},
              
              { "$project": { 
                "_id":1,
                "corporate_id":1,
                "branch_id":1,
                "reseller_of":1,
                "reseller_name":1,
                "address":1,
                "state":1,
                "city":1,
                "created_at":1,
                "pan_no":1,
                "gst_no":1,
                "branches":1,
                "reseller.reseller_name":1,
                "reseller._id":1
              }
            },
            ]);
            Reseller.aggregatePaginate(myAggregate,options, async function (err, resellers) {
                if (err) return resp.json({ status: 'error', message: err.message });
                var masters={branch:[],reseller_of:[]};
                await Branch.find({  status:'active' },'_id branch_name',  function (err, branch) {
                    if (!err) 
                    {
                      masters.branch=branch;
                    }
                })
                await Reseller.find({  status:'active'},'_id reseller_name',  function (err, reseller_of) {
                    if (!err) 
                    {
                      masters.reseller_of=reseller_of;
                    }
                })
                return resp.status(200).json({ status: 'success', resellers: resellers,masters:masters });
            })
          }
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_reseller: async function (req, resp) {
        const v = new Validator(req.body, {
            reseller_name: 'required',
            branch_id: 'required',
            address: 'required',
            state: 'required',
            city: 'required',
            // bank_details: 'required',
            // bank_name: 'required',
            // bank_beneficiary: 'required',
            // bank_ifsc: 'required',
            // bank_acc_no: 'required',
            // bank_acc_type: 'required',
            pan_no: 'required',
            status: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                    reseller_name:req.body.reseller_name,
                    corporate_id:req.authData.corporate_id,
                    reseller_of:req.body.reseller_of ? mongoose.Types.ObjectId(req.body.reseller_of):'NULL',
                    branch_id:req.body.branch_id, 
                    address:req.body.address,
                    state:req.body.state,
                    city:req.body.city,
                    bank_details:req.body.bank_details,
                    bank_name:req.body.bank_name,
                    bank_beneficiary:req.body.bank_beneficiary,
                    bank_ifsc:req.body.bank_ifsc,
                    bank_acc_no:req.body.bank_acc_no,
                    bank_acc_type:req.body.bank_acc_type,
                    pan_no:req.body.pan_no,
                    gst_no:req.body.gst_no,
                    status:req.body.status, 
                    created_at: Date.now()};
            Reseller.create(document,  function (err, reseller) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Reseller created successfully", reseller: reseller });
            })
        }
    },
    reseller_details:async function (req, resp) {
        Reseller.aggregate([
            { $match: { _id:  mongoose.Types.ObjectId(req.body.reseller_id)}},
            {$lookup:{
              from: 'branches',
              localField: 'branch_id',
              foreignField: '_id',
              as: 'branches'
            }},
            {$lookup:{
              from: 'resellers',
              localField: 'reseller_of',
              foreignField: '_id',
              as: 'reseller'
            }},
            
            { "$project": { 
              "_id":1,
              "corporate_id":1,
              "branch_id":1,
              "reseller_of":1,
              "reseller_name":1,
              "address":1,
              "state":1,
              "city":1,
              "bank_details":1,
              "bank_name":1,
              "bank_beneficiary":1,
              "bank_acc_no":1,
              "bank_acc_type":1,
              "pan_no":1,
              "gst_no":1,
              "status":1,
              "bank_ifsc":1,
              "created_at":1,
              "pan_no":1,
              "gst_no":1,
              "branches":1,
              "reseller.reseller_name":1,
              "reseller._id":1
            }
          },
          ])
            .then((data) => {
              return resp.status(200).send({ status: 'success', reseller: data[0]?data[0]:'NULL' });
            })
            .catch((err) => resp.status(200).send({ status: 'error', message: err.message }));
    },
    update_reseller_data: async function (req, resp) {
        const v = new Validator(req.body, {
            reseller_id:'required',
            reseller_name: 'required',
            branch_id: 'required',
            address: 'required',
            state: 'required',
            city: 'required',
            bank_details: 'required',
            bank_name: 'required',
            bank_beneficiary: 'required',
            bank_ifsc: 'required',
            bank_acc_no: 'required',
            bank_acc_type: 'required',
            pan_no: 'required',
            gst_no: 'required',
            status: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                reseller_name:req.body.reseller_name,
                reseller_of:req.body.reseller_of ? mongoose.Types.ObjectId(req.body.reseller_of):'NULL',
                branch_id:req.body.branch_id, 
                address:req.body.address,
                state:req.body.state,
                city:req.body.city,
                bank_details:req.body.bank_details,
                bank_name:req.body.bank_name,
                bank_beneficiary:req.body.bank_beneficiary,
                bank_ifsc:req.body.bank_ifsc,
                bank_acc_no:req.body.bank_acc_no,
                bank_acc_type:req.body.bank_acc_type,
                pan_no:req.body.pan_no,
                gst_no:req.body.gst_no,
                status:req.body.status, 
                updated_at: Date.now()};
            Reseller.updateOne({'_id':req.body.reseller_id},document,  function (err, reseller) {
                if (err) 
                {
                  return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                  return resp.status(200).send({ status: 'success',message:"Reseller updated successfully", reseller: reseller });
                }
            
            })
        }
    },
    delete_reseller:function (req, resp) {
        Reseller.findByIdAndRemove({'_id':req.body.reseller_id},  function (err, reseller) {
            if (err) 
            {
              return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
              return resp.status(200).send({ status: 'success',message:"Reseller deleted successfully", reseller: reseller });
            }
           
        })
    }
}
