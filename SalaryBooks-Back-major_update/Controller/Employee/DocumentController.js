var fs = require('fs');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
var mumongooselter = require('multer');
var Site_helper = require("../../Helpers/Site_helper");
const  EmployeeModel = require('../../Model/Company/employee');
const  FileManager = require('../../Model/Company/FileManager');

const saltRounds = 10;
const moment = require('moment');

module.exports = {
	
	document_list: async function(req, resp, next){
		let data = {};
		const condition = [];
		try {
			var employeeData = await EmployeeModel.findOne({'_id':mongoose.Types.ObjectId(req.authId)});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'User not found.', data: data });
			}
			condition.push({ 
				'$match': {
					$or: [
						{'emp_db_id':employeeData._id},
						{"emp_db_id": { $regex: ".*" + employeeData._id + ".*" }}
					]
				}
			},
			{
				$group: {
					_id: "$upload_for",
					corporate_id: { $first: "$corporate_id" },
					emp_db_id: { $first: "$emp_db_id" },
					// file_type: { $first: "$file_type" },
					// file_size: { $first: "$file_size" },
					// file_path: { $first: "$file_path" },
					status: { $first: "$status" },
					created_at: { $first: "$created_at" },
					folder_name: { $first: "$folder_name" },
					upload_for: { $first: "$upload_for" },
				}
			});
			var fileManager = await FileManager.aggregate(condition).sort({'_id': 1});
			if(fileManager){
				return resp.status(200).json({ 'status': "success", 'message': 'Data fetched successfuly.', data: fileManager });
			}
			else{
				return resp.status(200).json({ 'status': "success", 'message': 'File manager Data not found.', data: data });
			}
		}
		catch (e) {
			return resp
			.status(200)
			.json({
				status: "error",
				message: e ? e.message : "Something went wrong",
			});
		}
	},
	document_details_list: async function(req, resp, next){
		let data = {};
		const condition = [];
		try {
			const v = new Validator(req.body, {
				upload_for: 'required',
			});
			const matched = await v.check();
			if (!matched) {
				return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
			}
			var employeeData = await EmployeeModel.findOne({'_id':mongoose.Types.ObjectId(req.authId)});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'User not found.', data: data });
			}
			condition.push({ 
				'$match': {
					$or: [
						{'emp_db_id':employeeData._id},
						{"emp_db_id": { $regex: ".*" + employeeData._id + ".*" }}
					],
					upload_for:req.body.upload_for
				}
			});
			var fileManager = await FileManager.aggregate(condition).sort({'_id': 1});
			if(fileManager){
				return resp.status(200).json({ 'status': "success", 'message': 'Data fetched successfuly.', data: fileManager });
			}
			else{
				return resp.status(200).json({ 'status': "success", 'message': 'File manager Data not found.', data: data });
			}
		}
		catch (e) {
			return resp
			.status(200)
			.json({
				status: "error",
				message: e ? e.message : "Something went wrong",
			});
		}
	}
};
