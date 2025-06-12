var fs = require('fs');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
var mumongooselter = require('multer');
var Site_helper = require("../../Helpers/Site_helper");
const  EmployeeModel = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
var Declaration = require("../../Model/Company/Declaration");
var DeclarationTemp = require("../../Model/Company/DeclarationTemp");
var DeclarationLog = require("../../Model/Company/DeclarationLog");
var TdsAct = require("../../Model/Company/TdsAct");
const saltRounds = 10;
const moment = require('moment');

module.exports = {
	employee_declaration_modify: async function (req, resp, next) {
		try {
			var employeeData = await EmployeeModel.findOne({'_id':req.authId});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
			}
			var declaration_id = req.body.declaration_id;
			var document = {
				"corporate_id": employeeData.corporate_id,
				"employee_id": mongoose.Types.ObjectId(employeeData._id),
				"rental_house" : req.body.rental_house ? req.body.rental_house : "N",
				"rental_financial_year": req.body.rental_financial_year ? req.body.rental_financial_year:null,
				"rental_amount" : req.body.rental_amount ? req.body.rental_amount:null,
				"method_of_application" : req.body.method_of_application ? req.body.method_of_application:'actual',
				"address" : req.body.address ? req.body.address:null,
				"landlord_name" : req.body.landlord_name ? req.body.landlord_name:null,
				"urbanizaion_type" : req.body.urbanizaion_type ? req.body.urbanizaion_type:'metro',
				"landlord_pan" : req.body.landlord_pan ? req.body.landlord_pan:null,
				"house_property" : req.body.house_property ? req.body.house_property:'N',
				"rental_income" : req.body.rental_income ? req.body.rental_income:'N',
				"applicable_for" : req.body.applicable_for ? req.body.applicable_for : "old_regime",
				"status" : "pending",
			};
			
			var objs = req.files;
			let updeclarationData = {};
			if (declaration_id) {
				updeclarationData = await DeclarationTemp.findOne({'_id':declaration_id});
			}
			
			var declaration_item = [];
			if(req.body.declaration_items){
				if(req.body.declaration_items.length > 0){
					for (var i = 0; i < req.body.declaration_items.length; i++) {
						var total_sub_child_sum_amount = 0;
						if(req.body.declaration_items){
							if(req.body.declaration_items[i]){
								
								var sub_label_array = [];
								if(req.body.declaration_sub_label){
									if(req.body.declaration_sub_label[i].length > 0){
										var sub_child = [];
										for (var si = 0; si < req.body.declaration_sub_label[i].length; si++) {
											// console.log(req.body.declaration_sub_label[i][si]);
											// console.log(si);
											var documentArray = [];
											if(req.body.pre_sub_declaration_document){
												if(req.body.pre_sub_declaration_document[i]){
													if(req.body.pre_sub_declaration_document[i][si]){
														if(req.body.pre_sub_declaration_document[i][si].length > 0){
															for (var k = 0; k < req.body.pre_sub_declaration_document[i][si].length; k++) {
																documentArray.push({'file':  req.body.pre_sub_declaration_document[i][si][k]});
															}
														}
													}
												}
											}
											if(objs){
												for (var j = 0; j < objs.length; j++) {
													var file = objs.find(element => element['fieldname'] === "declaration_sub_document["+i+"]["+si+"]["+j+"]");
													if(file){
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
														if (file.fieldname === "declaration_sub_document["+i+"]["+si+"]["+j+"]") {
															file_data["folder_name"] = req.body.declaration_items[i]+" Investments File";
															file_data["upload_for"] = req.body.declaration_key[i];
															documentArray.push({'file': file.path});
															var fileuploaddata = await Site_helper.upload_file_manager(file_data);
														}
													}
												}
											}
											sub_child.push({
												'label': req.body.declaration_sub_label[i][si],
												'amount': req.body.declaration_sub_amount[i][si],
												'documents' : documentArray,
											});

											total_sub_child_sum_amount += parseFloat(req.body.declaration_sub_amount[i][si]);
										}
									}
								}
								declaration_item.push({
									'head': req.body.declaration_items[i],
									'key': req.body.declaration_key[i],
									'amount': total_sub_child_sum_amount,
									'child' : sub_child,
								});
							}
						}
					};
					// console.log(declaration_item);
					document = Object.assign(document,{'deduction_items':declaration_item});
				}
			}
			
			var rantalDocuments = [];
			var otherIncomeDocument = [];
			if(objs){
				for (var j = 0; j < objs.length; j++) {
					var file = objs.find(element => element['fieldname'] === 'rantal_house_documents['+j+']');
					if(file){
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
						if (file.fieldname === "rantal_house_documents["+j+"]") {
							file_data["folder_name"] = "Rental House File";
							file_data["upload_for"] = "rantal_house_documents";
							rantalDocuments.push({'file': file.path});
							var fileuploaddata = await Site_helper.upload_file_manager(file_data);
						}
					}
					var file = objs.find(element => element['fieldname'] === 'other_income_document['+j+']');
					if(file){
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
						if (file.fieldname === "other_income_document["+j+"]") {
							file_data["folder_name"] = "Other Income Document";
							file_data["upload_for"] = "other_income_document";
							otherIncomeDocument.push({'file': file.path});
							var fileuploaddata = await Site_helper.upload_file_manager(file_data);
						}
					}
				}
				if(updeclarationData){
					if(updeclarationData.rantal_house_documents){								
						for (var k = 0; k <= updeclarationData.rantal_house_documents.length-1; k++) {
							rantalDocuments.push(updeclarationData.rantal_house_documents[k]);
						}
					}
					if(updeclarationData.other_income_u_s_two_b){
						if(updeclarationData.other_income_u_s_two_b.document){
							if(updeclarationData.other_income_u_s_two_b.document.length > 0){
								for (var oi = 0; oi < updeclarationData.other_income_u_s_two_b.document.length; oi++) {
									otherIncomeDocument.push(updeclarationData.other_income_u_s_two_b.document[oi]);
								}
							}
						}
					}
				}
				document = Object.assign(document, {'rantal_house_documents':rantalDocuments});
			}
			if(req.body.other_income_amount){
				document.other_income_u_s_two_b = {
					'amount': parseFloat(req.body.other_income_amount),
					'label': req.body.other_income_label ? req.body.other_income_label : '',
					'document': otherIncomeDocument,
				};
			}
			// var declaration_log = await DeclarationLog.findOne({employee_id: employeeData._id,rental_financial_year:req.body.rental_financial_year});
			
			// if(declaration_log){
			// 	await DeclarationLog.updateOne({"_id": declaration_log._id },{ $set: document });
			// }
			// else{
				var document_log = Object.assign(document,{'apply_for':'employee','created_by': mongoose.Types.ObjectId(employeeData._id)});
				await DeclarationLog.create(document_log);
			// }
			if (declaration_id) {
				await DeclarationTemp.updateOne(
					{ employee_id: mongoose.Types.ObjectId(employeeData._id), "_id": mongoose.Types.ObjectId(declaration_id) },
					{ $set: document },
					function (err, declaration) {
						if (err) {
							return resp
							.status(200)
							.send({ status: "error", message: err.message });
						} else {
							return resp
							.status(200)
							.send({
								status: "success",
								message: "Employee declaration has been updated successfully",
								data: declaration,
							});
						}
					}
					);
			}
			else{
				await DeclarationTemp.create(document, function (err, declaration) {
					if (err) 
					{
						return resp.status(200).send({ status: 'error', message: err.message });
					}
					else
					{
						return resp.status(200).send({ status: 'success', message:"Employee declaration created successfully.", declaration_data: declaration });
					}
				})
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
	employee_declaration_data: async function(req, resp, next){
		let data = {};
		try {
			var employeeData = await EmployeeModel.findOne({'_id':mongoose.Types.ObjectId(req.authId)});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'User not found.', data: data });
			}
			var declaration = await DeclarationTemp.findOne({'employee_id':mongoose.Types.ObjectId(req.authId)});
			if(declaration){
				return resp.status(200).json({ 'status': "success", 'message': 'Data fetched successfuly.', data: declaration });
			}
			else{
				return resp.status(200).json({ 'status': "success", 'message': 'Declaration Data not found.', data: data });
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
	get_tds_act_data: async function (req, resp, next) {
        try{
            await TdsAct.findOne(async function (err, tds_act) {
                if (!err) 
                {
                    return resp.status(200).send({ status: 'success', message:"", data: tds_act});
                }
            })
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
};
