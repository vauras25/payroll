var fs = require('fs');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
var multer = require('multer');
var Site_helper = require("../../Helpers/Site_helper");
const  EmployeeModel = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
const saltRounds = 10;
const moment = require('moment');

module.exports = {
	update_employee_accident_details: async function (req, resp, next) {
		try {
			var employeeData = await EmployeeModel.findOne({'_id':req.authId});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
			}
			var accident_id = req.body.accident_id;
			if (accident_id) {
				var document = {
					"accident.$.accident_type": req.body.accident_type,
					"accident.$.description": req.body.description,
					"accident.$.comments": req.body.comments,
					"accident.$.date": req.body.date,
				};
				var obj = req.files;
				if(obj){
					await Promise.all(
						obj.map(async (file) => {
							var file_data = {
								corporate_id: req.authData.corporate_id,
								emp_db_id: employeeData._id,
								file_name: file.originalname,
								file_type: file.mimetype,
								file_size: file.size,
								file_path: file.path ? file.path : "NA",
								status: "active",
								created_at: Date.now(),
							};
							if (file.fieldname === "accident_file_image") {
								file_data["folder_name"] = "Accident File Image";
								file_data["upload_for"] = "accident_file_image";
								document["accident.$.accident_file_image"] = file.path;
							}
							var fileuploaddata = await Site_helper.upload_file_manager(file_data);
						})
						);
				}
				EmployeeDetails.updateOne(
					{ employee_id: employeeData._id, "accident._id": accident_id },
					{ $set: document },
					function (err, emp_det) {
						if (err) {
							return resp
							.status(200)
							.send({ status: "error", message: err.message });
						} else {
							return resp
							.status(200)
							.send({
								status: "success",
								message: "Accident details has been updated successfully",
								emp_det: emp_det,
							});
						}
					}
					);
			} else {
				var document2 = {
					accident_type: req.body.accident_type,
					description: req.body.description,
					comments: req.body.comments,
					date: req.body.date,
				};
				var obj = req.files;
				if(obj){
					await Promise.all(
						obj.map(async (file) => {
							var file_data = {
								corporate_id: req.authData.corporate_id,
								emp_db_id: employeeData._id,
								file_name: file.originalname,
								file_type: file.mimetype,
								file_size: file.size,
								file_path: file.path ? file.path : "NA",
								status: "active",
								created_at: Date.now(),
							};
							if (file.fieldname === "accident_file_image") {
								file_data["folder_name"] = "Accident File Image";
								file_data["upload_for"] = "accident_file_image";
								document2["accident_file_image"] = file.path;
							}
							var fileuploaddata = await Site_helper.upload_file_manager(
								file_data
								);
						})
						);
				}
				EmployeeDetails.updateOne(
					{ employee_id: employeeData._id },
					{ $addToSet: { accident: document2 } },
					function (err, emp_det) {
						if (err)
							return resp
						.status(200)
						.send({ status: "error", message: err.message });
						return resp
						.status(200)
						.send({
							status: "success",
							message: "Accident added successfully",
							emp_det: emp_det,
						});
					}
					);
			}

		} catch (e) {
			return resp
			.status(200)
			.json({
				status: "error",
				message: e ? e.message : "Something went wrong",
			});
		}
	},
};
