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
const saltRounds = 10;
const moment = require('moment');

module.exports = {
	employee_declaration_modify: async function (req, resp, next) {
		try {
			var employeeData = await EmployeeModel.findOne({'_id':req.body.employee_id});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
			}
			var declaration_id = '';
			if(req.body.declaration_id && req.body.declaration_id !== null && req.body.declaration_id !== 'null'){
				declaration_id = req.body.declaration_id;
			}
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
				"status" : "active",
			};
			
			var objs = req.files;
			let updeclarationData = '';
			if (declaration_id) {
				updeclarationData = await Declaration.findOne({'_id':declaration_id});
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
									'p_head' : req.body.declaration_p_head[i],
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
				var document_log = Object.assign(document,{'apply_for':req.authData.user_type,'created_by': mongoose.Types.ObjectId(employeeData._id)});
				await DeclarationLog.create(document);
			// }
			if (declaration_id) {
				await Declaration.updateOne(
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
				await Declaration.create(document, function (err, declaration) {
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
			var employeeData = await EmployeeModel.findOne({'_id':mongoose.Types.ObjectId(req.body.employee_id)});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'User not found.', data: data });
			}
			if(req.body.type == "temp"){
				var declaration = await DeclarationTemp.findOne({'employee_id':mongoose.Types.ObjectId(req.body.employee_id)});
			}
			else{
				var declaration = await Declaration.findOne({'employee_id':mongoose.Types.ObjectId(req.body.employee_id)});
			}
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
	list_pending_declaration_data: async function(req, resp, next){
		try {
			const v = new Validator(req.body, {
				pageno: "required",
			});
			const matched = await v.check();
			if (!matched) {
				return resp
				.status(200)
				.send({
					status: "val_err",
					message: "Validation error",
					val_msg: v.errors,
				});
			} else {
				var start_date = req.body.wage_date_from;
				var end_date = req.body.wage_date_to;
				var sortbyfield = req.body.sortbyfield;
				if (sortbyfield) {
					var sortoption = {};
					sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
				} else {
					var sortoption = { created_at: -1 };
				}
				const options = {
					page: req.body.pageno,
					limit: req.body.perpage ? req.body.perpage : perpage,
					sort: sortoption,
				};
                // var filter_option = {};
                if(start_date || end_date){
                	var search_option = {
                		$match: {
                			$and: [
                			{ corporate_id: req.authData.corporate_id },
	                        // { parent_hods: { $in: [req.authId] } },
	                        // { approval_status: "approved" },
	                        { status: "pending" },
	                        {$or:[ 
	                        	{'created_at': {$gt: new Date(start_date) }}, 
	                        	{ $and:[
	                        		{'created_at': {$gte: new Date(start_date) }}
	                        		]
	                        	} 
	                        	]
	                        },
	                        { $or:[ 
	                        	{'created_at': {$lt: new Date(end_date) }}, 
	                        	{ $and:[
	                        		{'created_at': {$lte: new Date(start_date) }}
	                        		]
	                        	} 
	                        	]
	                        }
	                        ],
	                    },
	                };
	            }
	            else{
	            	var search_option = {
	            		$match: {
	            			$and: [
	            			{ corporate_id: req.authData.corporate_id },
	            			{ status: "pending" },
	            			]
	            		}
	            	}
	            }
	            var employee_search_option = {
	            	$match: {
	            		"employee.approval_status": "approved",
	            	},
	            };
	            var search_option_details = {
	            	$match: {
	            		"employee.approval_status": "approved",
	            	},

	            };
	            var employee_hod_search_option = {
	            	$match: {
	            		"employee.approval_status": "approved",
	            	},

	            };
				if (req.body.searchkey) {
					search_option = {
					  $match: {
						$or: [
                              { emp_first_name: { $regex: req.body.searchkey, $options: "i" } },
                              { emp_last_name: { $regex: req.body.searchkey, $options: "i" } },
                              { emp_id: { $regex: req.body.searchkey, $options: "i" } }
                                   // Add other fields to search here
                            ],
						    corporate_id: req.authData.corporate_id,
					  },
					};
				  }
			 else{

	            if (req.body.designation_id) {
	            	var designation_ids = JSON.parse(JSON.stringify(req.body.designation_id));
	            	designation_ids = designation_ids.map(function (el) {
	            		return mongoose.Types.ObjectId(el);
	            	});
	            	search_option_details.$match[
	            	"employee_details.employment_hr_details.designation"
	            	] = { $in: designation_ids };
	            }
	            if (req.body.department_id) {
	            	var department_ids = JSON.parse(req.body.department_id);
	            	department_ids = department_ids.map(function (el) {
	            		return mongoose.Types.ObjectId(el);
	            	});
	            	search_option_details.$match[
	            	"employee_details.employment_hr_details.department"
	            	] = { $in: department_ids };
	            }
	            if (req.body.branch_id) {
	            	var branch_ids = JSON.parse(req.body.branch_id);
	            	branch_ids = branch_ids.map(function (el) {
	            		return mongoose.Types.ObjectId(el);
	            	});
	            	search_option_details.$match[
	            	"employee_details.employment_hr_details.branch"
	            	] = { $in: branch_ids };
	            }
	            if (req.body.client_id) {
	            	var client_ids = JSON.parse(JSON.stringify(req.body.client_id));

	            	client_ids = client_ids.map(function (el) {
	            		return mongoose.Types.ObjectId(el);
	            	});
                    // search_option.$match.employee.client_id = { $in: client_ids };

                    var employee_search_option = {
                    	$match: {
                    		"employee.client_code":{ $in: client_ids },
                    	},
                    }
                }
                if (req.body.hod_id) {
                	var hod_ids = JSON.parse(JSON.stringify(req.body.hod_id));
                	hod_ids = hod_ids.map(function (el) {
                		return mongoose.Types.ObjectId(el);
                	});
                    // search_option.$match.emp_hod = { $in: hod_ids };
                    var employee_hod_search_option = {
                    	$match: {
                    		"employee.emp_hod":{ $in: hod_ids },
                    	},
                    }
                }
			 }
                
                var myAggregate = DeclarationTemp.aggregate([
                	search_option,
                	{
                		$lookup: {
                			from: "employees",
                			localField: "employee_id",
                			foreignField: "_id",
                			as: "employee",
                		},
                	},
                	employee_search_option,
                	{
                		$lookup: {
                			from: "clients",
                			localField: "employee.client_code",
                			foreignField: "_id",
                			as: "client",
                		},
                	},
                	{
                		$lookup: {
                			from: "staffs",
                			localField: "employee.emp_hod",
                			foreignField: "_id",
                			as: "hod",
                		},
                	},
                	{
                		$lookup: {
                			from: "employee_details",
                			localField: "employee_id",
                			foreignField: "employee_id",
                			as: "employee_details",
                		},
                	},
                	{
                		$lookup: {
                			from: "branches",
                			localField: "employee_details.employment_hr_details.branch",
                			foreignField: "_id",
                			as: "branch",
                		},
                	},
                	{
                		$lookup: {
                			from: "designations",
                			localField: "employee_details.employment_hr_details.designation",
                			foreignField: "_id",
                			as: "designation",
                		},
                	},
                	{
                		$lookup: {
                			from: "departments",
                			localField: "employee_details.employment_hr_details.department",
                			foreignField: "_id",
                			as: "department",
                		},
                	},
                	{
                		$lookup: {
                			from: "employee_tds_calculations",
                			localField: "employee_id",
                			foreignField: "employee_id",
                			as: "employee_tds_calculations",
                		},
                	},
                	search_option_details,
                	{
                		$project: {
                			_id: 1,
                			corporate_id:1,
                			employee_id:1,
                			rental_house:1,
                			method_of_application:1,
                			status:1,
                			"employee.emp_id":1,
                			"employee.emp_first_name":1,
                			"employee.emp_last_name":1,
                			"employee.pan_no":1,
                			created_at:1,
                			updated_at:1,
                			"employee_tds_calculations":1,
                		},
                	},
                	]); 
                DeclarationTemp.aggregatePaginate(myAggregate,options,async function (err, declaration) {
                	if (err) return resp.json({ status: "error", message: err.message });
                	return resp.status(200).json({ status: "success", data: declaration });
                });

            }
        }
        catch (e) {
        	return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong"});
        }
    },
    approve_declaration_data: async function(req, resp, next){
    	try {
    		const v = new Validator(req.body, {
    			declaration_id: "required",
    		});
    		const matched = await v.check();
    		if (!matched) {
    			return resp
    			.status(200)
    			.send({
    				status: "val_err",
    				message: "Validation error",
    				val_msg: v.errors,
    			});
    		} else {

    			let updatedDlec = await DeclarationTemp.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(req.body.declaration_id) },{ $set: {'status':"active"} },{new: true},async function (declaration) {
					return declaration;
				});
    			if(updatedDlec){
	    			var document_data = {
						"corporate_id": updatedDlec.corporate_id,
						"employee_id": updatedDlec.employee_id,
						"rental_house" : updatedDlec.rental_house,
						"rental_financial_year": updatedDlec.rental_financial_year,
						"rental_amount" : updatedDlec.rental_amount,
						"method_of_application" : updatedDlec.method_of_application,
						"address" : updatedDlec.address,
						"landlord_name" : updatedDlec.landlord_name,
						"urbanizaion_type" :  updatedDlec.urbanizaion_type,
						"landlord_pan" : updatedDlec.landlord_pan,
						"house_property" : updatedDlec.house_property,
						"rental_income" : updatedDlec.rental_income,
						"applicable_for" : updatedDlec.applicable_for,
						"deduction_items" : updatedDlec.deduction_items,
						"rantal_house_documents" : updatedDlec.rantal_house_documents,
						"other_income_u_s_two_b" : updatedDlec.other_income_u_s_two_b,
						"status" : "active",
					};
					
					var checkDeclaration = await Declaration.findOne({ "employee_id": mongoose.Types.ObjectId(updatedDlec.employee_id)});
					if(checkDeclaration){
						await Declaration.findOneAndUpdate({ "employee_id": mongoose.Types.ObjectId(updatedDlec.employee_id) },{ $set: document_data });
					}
					else{
						await Declaration.create(document_data);
					}
					var document_log = document_data;
					document_log['apply_for'] = req.authData.user_type;
					document_log['created_by'] = mongoose.Types.ObjectId(req.authId);
					await DeclarationLog.create(document_log);
				}
				return resp.status(200).json({ status: "success", message: "Employee declaration approved successfully",});
    		}
    	}
    	catch (e) {
    		return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong"});
    	}
    },
};
