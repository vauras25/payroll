var Company = require('../../Model/Admin/Company');
var Company_details = require('../../Model/Admin/Company_details');
var CompanyLocation = require('../../Model/Company/CompanyLocation');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
const moment = require('moment');
const archiver = require('archiver');
const fs = require('fs');
const {resolve} = require('path');
const absolutePath = resolve('');
module.exports = {
    create: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                location: "required|string",
                address: "required|string",
                longitude: "required",
                latitude: "required",
                radius: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }

            await CompanyLocation.findOneAndUpdate(
                {
                    _id: mongoose.Types.ObjectId(req.body.location_id),
                },
                {
                    'corporate_id' : req.authData.corporate_id,
                    'company_id' : req.authId,
                    'location':req.body.location,
                    'address':req.body.address,
                    'longitude':req.body.longitude,
                    'latitude':req.body.latitude,
                    'radius':req.body.radius,
                    'description':req.body.description,
                    'status':'active',
                },
                // setDefaultsOnInsert: true
                { upsert: true, new: true,  },
                (err, doc) => {
                    if (err)
                    return resp
                        .status(200)
                        .send({ status: "error", message: err });
                }
            );
            if(req.body.location_id){
                return resp.status(200).json({status: "success", message: 'Company location update successfully.'});
            }
            else{
                return resp.status(200).json({status: "success", message: 'Company location saved successfully.'});
            }
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    listing: async function (req, resp, next) {
        try {
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            const options = {
                page: req.body.pageno ? req.body.pageno : 1,
                limit: req.body.perpage ? req.body.perpage : 20,
                sort: sortoption,
            };
            var filter_option = {};
            var search_option = {
                $match: {
                  $and: [
                    { corporate_id: req.authData.corporate_id },
                  ],
                },
            };
            if(req.body.status){
                search_option.$match = {"status": {$eq: req.body.status}};
            }
            if (req.body.searchkey) {
                search_option = { $match: { "location": { $regex: req.body.searchkey, "$options": "i" } } };
                search_option = { $match: { "address": { $regex: req.body.searchkey, "$options": "i" } } };
            }
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
            var myAggregate = CompanyLocation.aggregate([search_option,
            {
                $project: {
                    _id: 1,
                    company_id: 1,
                    corporate_id: 1,
                    address:1,
                    location:1,
                    radius:1,
                    latitude:1,
                    longitude:1,
                    description:1,
                    status:1,
                    created_at:1,
                    updated_at:1,
                },
            },
            ]);
            CompanyLocation.aggregatePaginate(myAggregate,options,async function (err, company_location) {
                if (err) return resp.json({ status: "error", message: err.message });
                return resp
                .status(200)
                .json({
                    status: "success",
                    data: company_location
                });
            });
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    status_change: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                location_id: "required|string",
                status:"required|in:active,inactive"
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }

            await CompanyLocation.findOneAndUpdate(
                {
                    _id: mongoose.Types.ObjectId(req.body.location_id),
                },
                {
                    'status': req.body.status,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
                (err, doc) => {
                    if (err)
                    return resp
                        .status(200)
                        .send({ status: "error", message: err });
                }
            );
            return resp.status(200).json({status: "success", message: 'Company location status change successfully.'});
            
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
    delete: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                location_id: "required|string",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }

            await CompanyLocation.findOneAndDelete(
                {
                    _id: mongoose.Types.ObjectId(req.body.location_id),
                }, (err, doc) => {
                    if (err)
                    return resp.status(200).send({ status: "error", message: err });
                }
            );
            return resp.status(200).json({status: "success", message: 'Company location deleted successfully.'});
            
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
};
