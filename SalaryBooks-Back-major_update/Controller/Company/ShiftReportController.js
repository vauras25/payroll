var Shift = require("../../Model/Company/Shift");
var Employee = require("../../Model/Company/employee");
var EmployeeDetails = require("../../Model/Company/employee_details");
var Department = require("../../Model/Admin/Department");
var Designation = require("../../Model/Admin/Designation");
var EmployeePackage = require("../../Model/Company/EmployeePackage");
var SalaryTemp = require("../../Model/Admin/SalaryTemp");
var Staff = require("../../Model/Company/Staff");
var Client = require("../../Model/Company/Client");
var CompanyDetails = require("../../Model/Admin/Company_details");
var Company = require("../../Model/Admin/Company");
const EmployeeMonthlyReport=require('../../Model/Company/EmployeeMonthlyReport');
var Site_helper = require("../../Helpers/Site_helper");
var fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
var xl = require("excel4node");
const { Validator } = require("node-input-validator");
const moment = require('moment');
module.exports = {
	//report no 62
	shift_duty_report: async function (req, resp, next) {
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
				var sortbyfield = req.body.sortbyfield;
				if (sortbyfield) {
					var sortoption = {};
					sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
				} else {
					var sortoption = { created_at: -1 };
				}
				const options = {
		            page: req.body.pageno ? req.body.pageno : 1,
		            limit: req.body.perpage ? req.body.perpage : perpage,
		            sort: sortoption,
		        };
		        var start_date = req.body.wage_from_date;
				var end_date = req.body.wage_to_date;
				if(start_date || end_date){
	                var search_option = {
	                    $match: {
	                        $and: [
	                        { corporate_id: req.authData.corporate_id },
	                        { parent_hods: { $in: [req.authData.user_id] } },
	                        {$or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$gte: start_date }},
	                                {'shift.shift_end_date': {$lte: end_date }}
	                                ]
	                            } 
	                            ]
	                        },
	                        { $or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$lte: end_date }},
	                                {'shift.shift_end_date': {$gte: start_date }}
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
							{ parent_hods: { $in: [req.authData.user_id] } },
							],
						},
					};
	            }
				var filter_option = {};
				
				var search_option_details = { $match: {} };
				if (req.body.searchkey) {
					search_option = {
						$match: {
							$text: { $search: req.body.searchkey },
							corporate_id: req.authData.corporate_id,
							$or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$gte: start_date }},
	                                {'shift.shift_end_date': {$lte: end_date }}
	                                ]
	                            } 
	                            ]
	                        ,
	                         $or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$lte: end_date }},
	                                {'shift.shift_end_date': {$gte: start_date }}
	                                ]
	                            } 
	                            ]
	                        
						},
					};
				} else {
					if (req.body.emp_name) {
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
					}
					if (req.body.emp_last_name) {
						search_option.$match.emp_last_name = {
							$regex: req.body.emp_last_name,
							$options: "i",
						};
					}
					if (req.body.email_id) {
						search_option.$match.email_id = {
							$regex: req.body.email_id,
							$options: "i",
						};
					}
					if (req.body.emp_id) {
						search_option.$match.emp_id = {
							$regex: req.body.emp_id,
							$options: "i",
						};
					}
					if (req.body.designation_id) {
						var designation_ids = JSON.parse(req.body.designation_id);
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
					if (req.body.client_code) {
						var client_codes = JSON.parse(req.body.client_code);
						search_option.$match.client_code = { $in: client_codes };
					}
					if (req.body.hod_id) {
						var hod_ids = JSON.parse(req.body.hod_id);
						hod_ids = hod_ids.map(function (el) {
							return mongoose.Types.ObjectId(el);
						});
						search_option.$match.emp_hod = { $in: hod_ids };
					}
				}
				// if (req.body.row_checked_all === "true") {
				// 	if(typeof req.body.unchecked_row_ids == "string"){
				// 		var ids = JSON.parse(req.body.unchecked_row_ids);
				// 	}
				// 	else{
				// 		var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
				// 	}
				// 	if (ids.length > 0) {
				// 		ids = ids.map(function (el) {
				// 			return mongoose.Types.ObjectId(el);
				// 		});
				// 		search_option.$match._id = { $nin: ids };
				// 	}
				// } else {
				// 	if(typeof req.body.checked_row_ids == "string"){
				// 		var ids = JSON.parse(req.body.checked_row_ids);
				// 	}
				// 	else{
				// 		var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
				// 	}
				// 	if (ids.length > 0) {
				// 		ids = ids.map(function (el) {
				// 			return mongoose.Types.ObjectId(el);
				// 		});
				// 		search_option.$match._id = { $in: ids };
				// 	}
				// }
				var myAggregate = Employee.aggregate([
					search_option,
					{
						$lookup: {
							from: "employee_details",
							localField: "_id",
							foreignField: "employee_id",
							as: "employee_details",
						},
					},
					search_option_details,
					{
						$lookup: {
							from: "clients",
							localField: "client_code",
							foreignField: "_id",
							as: "client",
						},
					},
					{
						$lookup: {
							from: "staffs",
							localField: "emp_hod",
							foreignField: "_id",
							as: "hod",
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
							from: "shifts",
							localField: "shift.shift_id",
							foreignField: "_id",
							as: "shift_data",
						},
					},
					{
						$addFields: {
							hod: {
								$arrayElemAt: ["$hod", 0],
							},
							employee_details: {
								$arrayElemAt: ["$employee_details", 0],
							},
							client: {
								$arrayElemAt: ["$client", 0],
							},
							"designation": {
								"$arrayElemAt": [ "$designation", 0 ]
							},
							"department": {
								"$arrayElemAt": [ "$department", 0 ]
							},
							"branch": {
								"$arrayElemAt": [ "$branch", 0 ]
							},
							"shift_data": {
								"$arrayElemAt": [ "$shift_data", 0 ]
							},
						},
					},
					{$unwind: "$shift.shift_id"},
					{
						$project: {
							_id: 1,
							corporate_id: 1,
							userid: 1,
							emp_id: 1,
							emp_first_name: 1,
							emp_last_name: 1,
							client_code: 1,
							created_at: 1,
							is_hod: 1,
							status: 1,
							// shift: 1,
							// shift_rate: 1,
							approval_status: 1,
							// "employee_details._id": 1,
							"client._id": 1,
							"client.client_code": 1,
							"hod.first_name": 1,
							"hod.last_name": 1,
							"branch._id": 1,
							"branch.branch_name": 1,
							"department._id": 1,
							"department.department_name": 1,
							"designation._id": 1,
							"designation.designation_name": 1,
							"shift_data.shift_name":1,
							"shift_data.from":"$shift.shift_start_date",
							"shift_data.to":"$shift.shift_end_date"
						},
					},
					]);
				Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
					if (err) return resp.json({ status: "error", message: err.message });

					return resp.status(200).json({ status: "success", employees: employees });
				});
			}
		}
		catch (e) {
			return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
		}
	},
	//report no 61
	shift_earning_report: async function (req, resp, next) {
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
				var sortbyfield = req.body.sortbyfield;
				if (sortbyfield) {
					var sortoption = {};
					sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
				} else {
					var sortoption = { created_at: -1 };
				}
				const options = {
		            page: req.body.pageno ? req.body.pageno : 1,
		            limit: req.body.perpage ? req.body.perpage : perpage,
		            sort: sortoption,
		        };
		        var start_date = req.body.wage_from_date;
				var end_date = req.body.wage_to_date;
				if(start_date || end_date){
	                var search_option = {
	                    $match: {
	                        $and: [
	                        { corporate_id: req.authData.corporate_id },
	                        { parent_hods: { $in: [req.authData.user_id] } },
	                        {$or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$gte: start_date }},
	                                {'shift.shift_end_date': {$lte: end_date }}
	                                ]
	                            } 
	                            ]
	                        },
	                        { $or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$lte: end_date }},
	                                {'shift.shift_end_date': {$gte: start_date }}
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
							{ parent_hods: { $in: [req.authData.user_id] } },
							],
						},
					};
	            }
				var filter_option = {};
				
				var search_option_details = { $match: {} };
				if (req.body.searchkey) {
					search_option = {
						$match: {
							$text: { $search: req.body.searchkey },
							corporate_id: req.authData.corporate_id,
							$or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$gte: start_date }},
	                                {'shift.shift_end_date': {$lte: end_date }}
	                                ]
	                            } 
	                            ],
	                         $or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$lte: end_date }},
	                                {'shift.shift_end_date': {$gte: start_date }}
	                                ]
	                            } 
	                            ]
	                        
						},
					};
				} else {
					if (req.body.emp_name) {
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
					}
					if (req.body.emp_last_name) {
						search_option.$match.emp_last_name = {
							$regex: req.body.emp_last_name,
							$options: "i",
						};
					}
					if (req.body.email_id) {
						search_option.$match.email_id = {
							$regex: req.body.email_id,
							$options: "i",
						};
					}
					if (req.body.emp_id) {
						search_option.$match.emp_id = {
							$regex: req.body.emp_id,
							$options: "i",
						};
					}
					if (req.body.designation_id) {
						var designation_ids = JSON.parse(req.body.designation_id);
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
					if (req.body.client_code) {
						var client_codes = JSON.parse(req.body.client_code);
						search_option.$match.client_code = { $in: client_codes };
					}
					if (req.body.hod_id) {
						var hod_ids = JSON.parse(req.body.hod_id);
						hod_ids = hod_ids.map(function (el) {
							return mongoose.Types.ObjectId(el);
						});
						search_option.$match.emp_hod = { $in: hod_ids };
					}
				}
				// if (req.body.row_checked_all === "true") {
				// 	if(typeof req.body.unchecked_row_ids == "string"){
				// 		var ids = JSON.parse(req.body.unchecked_row_ids);
				// 	}
				// 	else{
				// 		var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
				// 	}
				// 	if (ids.length > 0) {
				// 		ids = ids.map(function (el) {
				// 			return mongoose.Types.ObjectId(el);
				// 		});
				// 		search_option.$match._id = { $nin: ids };
				// 	}
				// } else {
				// 	if(typeof req.body.checked_row_ids == "string"){
				// 		var ids = JSON.parse(req.body.checked_row_ids);
				// 	}
				// 	else{
				// 		var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
				// 	}
				// 	if (ids.length > 0) {
				// 		ids = ids.map(function (el) {
				// 			return mongoose.Types.ObjectId(el);
				// 		});
				// 		search_option.$match._id = { $in: ids };
				// 	}
				// }
				var myAggregate = Employee.aggregate([
					search_option,
					{
						$lookup: {
							from: "employee_details",
							localField: "_id",
							foreignField: "employee_id",
							as: "employee_details",
						},
					},
					search_option_details,
					{
						$lookup: {
							from: "clients",
							localField: "client_code",
							foreignField: "_id",
							as: "client",
						},
					},
					{
						$lookup: {
							from: "staffs",
							localField: "emp_hod",
							foreignField: "_id",
							as: "hod",
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
							from: "shifts",
							localField: "shift.shift_id",
							foreignField: "_id",
							as: "shift_data",
						},
					},
					{
						$addFields: {
							hod: {
								$arrayElemAt: ["$hod", 0],
							},
							employee_details: {
								$arrayElemAt: ["$employee_details", 0],
							},
							client: {
								$arrayElemAt: ["$client", 0],
							},
							"designation": {
								"$arrayElemAt": [ "$designation", 0 ]
							},
							"department": {
								"$arrayElemAt": [ "$department", 0 ]
							},
							"branch": {
								"$arrayElemAt": [ "$branch", 0 ]
							},
						},
					},
					{
	                    $match: {
	                        'shift_rate': {$ne:null}
	                    }
	                },
					{
						$project: {
							_id: 1,
							corporate_id: 1,
							userid: 1,
							emp_id: 1,
							emp_first_name: 1,
							emp_last_name: 1,
							client_code: 1,
							created_at: 1,
							is_hod: 1,
							status: 1,
							// shift: 1,
							shift_rate: 1,
							approval_status: 1,
							// "employee_details._id": 1,
							"client._id": 1,
							"client.client_code": 1,
							"hod.first_name": 1,
							"hod.last_name": 1,
							"branch._id": 1,
							"branch.branch_name": 1,
							"department._id": 1,
							"department.department_name": 1,
							"designation._id": 1,
							"designation.designation_name": 1,
						},
					},
					]);
				var shiftData = await Shift.find({corporate_id:req.authData.corporate_id});
				Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
					if (err) return resp.json({ status: "error", message: err.message });
					if(employees.docs){
						if(employees.docs.length > 0){
							employees.docs.map(function(emp){
								var total = 0;
								if(emp.shift_rate){
									if(emp.shift_rate.length > 0){
										emp.shift_rate.map(function(rate){
											var shiftDatas = shiftData.find(element => mongoose.Types.ObjectId(rate.shift_id).equals(element['_id']));
											rate.rate = parseInt(rate.rate);
											total += rate.rate;
											rate.shift_data = {
												'shift_name': shiftDatas.shift_name,
												'shift_allowance': shiftDatas.shift_allowance,
												'overtime': shiftDatas.overtime,
											};
										});
									}
								}
								emp.shift_total = total;
							});
						}
					}
					return resp.status(200).json({ status: "success", employees: employees });
				});
			}
		}
		catch (e) {
			return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
		}
	},
	//report no 61 export
	shift_earning_report_export: async function (req, resp, next) {
		try {
			const v = new Validator(req.body, {
				// pageno: "required",
			});
			const matched = await v.check();
			if (!matched) {
				return resp
				.status(403)
				.send({
					status: "val_err",
					message: "Validation error",
					val_msg: v.errors,
				});
			} else {
				var sortbyfield = req.body.sortbyfield;
				if (sortbyfield) {
					var sortoption = {};
					sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
				} else {
					var sortoption = { created_at: -1 };
				}
				const options = {
		            page: req.body.pageno ? req.body.pageno : 1,
		            limit: req.body.perpage ? req.body.perpage : perpage,
		            sort: sortoption,
		        };
		        var start_date = req.body.wage_from_date;
				var end_date = req.body.wage_to_date;
				if(start_date || end_date){
	                var search_option = {
	                    $match: {
	                        $and: [
	                        { corporate_id: req.authData.corporate_id },
	                        { parent_hods: { $in: [req.authData.user_id] } },
	                        {$or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$gte: start_date }},
	                                {'shift.shift_end_date': {$lte: end_date }}
	                                ]
	                            } 
	                            ]
	                        },
	                        { $or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$lte: end_date }},
	                                {'shift.shift_end_date': {$gte: start_date }}
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
							{ parent_hods: { $in: [req.authData.user_id] } },
							],
						},
					};
	            }
				var filter_option = {};
				
				var search_option_details = { $match: {} };
				if (req.body.searchkey) {
					search_option = {
						$match: {
							$text: { $search: req.body.searchkey },
							corporate_id: req.authData.corporate_id,
						},
					};
				} else {
					if (req.body.emp_name) {
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
					}
					if (req.body.emp_last_name) {
						search_option.$match.emp_last_name = {
							$regex: req.body.emp_last_name,
							$options: "i",
						};
					}
					if (req.body.email_id) {
						search_option.$match.email_id = {
							$regex: req.body.email_id,
							$options: "i",
						};
					}
					if (req.body.emp_id) {
						search_option.$match.emp_id = {
							$regex: req.body.emp_id,
							$options: "i",
						};
					}
					if (req.body.designation_id) {
						var designation_ids = JSON.parse(req.body.designation_id);
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
					if (req.body.client_code) {
						var client_codes = JSON.parse(req.body.client_code);
						search_option.$match.client_code = { $in: client_codes };
					}
					if (req.body.hod_id) {
						var hod_ids = JSON.parse(req.body.hod_id);
						hod_ids = hod_ids.map(function (el) {
							return mongoose.Types.ObjectId(el);
						});
						search_option.$match.emp_hod = { $in: hod_ids };
					}
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
				var myAggregate = Employee.aggregate([
					search_option,
					{
						$lookup: {
							from: "employee_details",
							localField: "_id",
							foreignField: "employee_id",
							as: "employee_details",
						},
					},
					search_option_details,
					{
						$lookup: {
							from: "clients",
							localField: "client_code",
							foreignField: "_id",
							as: "client",
						},
					},
					{
						$lookup: {
							from: "staffs",
							localField: "emp_hod",
							foreignField: "_id",
							as: "hod",
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
							from: "shifts",
							localField: "shift.shift_id",
							foreignField: "_id",
							as: "shift_data",
						},
					},
					{
						$addFields: {
							hod: {
								$arrayElemAt: ["$hod", 0],
							},
							employee_details: {
								$arrayElemAt: ["$employee_details", 0],
							},
							client: {
								$arrayElemAt: ["$client", 0],
							},
							"designation": {
								"$arrayElemAt": [ "$designation", 0 ]
							},
							"department": {
								"$arrayElemAt": [ "$department", 0 ]
							},
							"branch": {
								"$arrayElemAt": [ "$branch", 0 ]
							},
						},
					},
					{
	                    $match: {
	                        'shift_rate': {$ne:null}
	                    }
	                },
					{
						$project: {
							_id: 1,
							corporate_id: 1,
							userid: 1,
							emp_id: 1,
							emp_first_name: 1,
							emp_last_name: 1,
							client_code: 1,
							created_at: 1,
							is_hod: 1,
							status: 1,
							// shift: 1,
							shift_rate: 1,
							approval_status: 1,
							// "employee_details._id": 1,
							"client._id": 1,
							"client.client_code": 1,
							"hod.first_name": 1,
							"hod.last_name": 1,
							"branch._id": 1,
							"branch.branch_name": 1,
							"department._id": 1,
							"department.department_name": 1,
							"designation._id": 1,
							"designation.designation_name": 1,
						},
					},
					]).then(async (employees) => {
						var shiftData = await Shift.find({corporate_id:req.authData.corporate_id});
						var field_list_array=["emp_code","name","department","designation","branch","client_id","hod","total"];
						shiftData.map(function(s_data){
							field_list_array.push(s_data._id.toString());
						});
						var wb = new xl.Workbook();
	                    var ws = wb.addWorksheet("Sheet 1");
	                    var clmn_id = 1;
	                    ws.cell(1, clmn_id++).string("SL");
	                    if(field_list_array.includes('emp_code'))
	                    {
	                        ws.cell(1, clmn_id++).string("Employee Id");
	                    }
	                    if(field_list_array.includes('name'))
	                    {
	                        ws.cell(1, clmn_id++).string("Name");
	                    }
	                    if(field_list_array.includes('department'))
	                    {
	                        ws.cell(1, clmn_id++).string("Department");
	                    }
	                    if(field_list_array.includes('designation'))
	                    {
	                        ws.cell(1, clmn_id++).string("Designation");
	                    }
	                    if(field_list_array.includes('branch'))
	                    {
	                        ws.cell(1, clmn_id++).string("Branch");
	                    }
	                    if(field_list_array.includes('client_id'))
	                    {
	                        ws.cell(1, clmn_id++).string("Clinet ID");
	                    }
	                    if(field_list_array.includes('hod'))
	                    {
	                        ws.cell(1, clmn_id++).string("HOD");
	                    }
	                    shiftData.map(function(s_data){
	                    	if(field_list_array.includes(s_data._id.toString()))
		                    {
		                        ws.cell(1, clmn_id++).string(s_data.shift_name);
		                    }
						});
	                    if(field_list_array.includes('total'))
	                    {
	                        ws.cell(1, clmn_id++).string("Total");
	                    }
						if(employees){
							if(employees.length > 0){
								await Promise.all(employees.map(async function (emp, index) {
									var total = 0;
									if(emp.shift_rate){
										if(emp.shift_rate.length > 0){
											emp.shift_rate.map(function(rate){
												var shiftDatas = shiftData.find(element => mongoose.Types.ObjectId(rate.shift_id).equals(element['_id']));
												rate.rate = parseInt(rate.rate);
												total += rate.rate;
												rate.shift_data = {
													'shift_name': shiftDatas.shift_name,
													'shift_allowance': shiftDatas.shift_allowance,
													'overtime': shiftDatas.overtime,
												};
											});
										}
									}
									emp.shift_total = total;
									var index_val = 2;
			                        index_val = index_val + index;
			                        var clmn_emp_id=1
			                        ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
			                        if(field_list_array.includes('emp_code'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.emp_id ? String(emp.emp_id) : ""
			                                );
			                        }
			                        if(field_list_array.includes('name'))
			                        {
			                            ws.cell(index_val,clmn_emp_id++).string(
			                                emp.emp_first_name ? String(emp.emp_first_name +" "+ emp.emp_last_name) : ""
			                                );
			                        }
			                        if(field_list_array.includes('department'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(emp.department ? String(emp.department.department_name) : "");
			                        }
			                        if(field_list_array.includes('designation'))
			                        {
		                                ws.cell(index_val, clmn_emp_id++).string(
		                                    emp.designation ? String(emp.designation.designation_name) : ""
		                                    );
			                           
			                        }
			                        if(field_list_array.includes('branch'))
			                        {
		                                ws.cell(index_val, clmn_emp_id++).string(
		                                    emp.branch ? String(emp.branch.branch_name) : ""
		                                    );
			                            
			                        }
			                        if(field_list_array.includes('client_id'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.client ? String(emp.client.client_code) : ""
			                                );
			                        }
			                        if(field_list_array.includes('hod'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.hod ? String(emp.hod.first_name+" "+emp.hod.last_name) : ""
			                                );
			                        }
			                        if(emp.shift_rate){
			                        	if(emp.shift_rate.length > 0){
			                        		emp.shift_rate.map(function (shi_rate_data){
			                        			if(field_list_array.includes(shi_rate_data.shift_id.toString()))
							                    {
							                        ws.cell(index_val, clmn_emp_id++).string(
						                                shi_rate_data.rate ? String(shi_rate_data.rate) : "0"
						                                );
							                    }
			                        		});
					                	}
					                }
			                        if(field_list_array.includes('total'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.shift_total ? String(emp.shift_total) : "0"
			                                );
			                        }
								})).then(async(value) => {
			                        // wb.write("shift-earning-report.xlsx");
									// let file_location = Site_helper.createFiles(wb,"shift-earning-report",'xlsx', req.authData.corporate_id)
									let file_name = "shift-earning-report.xlsx";
									let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/shift-module');
									await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
									// file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
									// await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
			                        // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
			                    });
							}
							else{
								return resp.status(200).json({ status: "success", employees: employees });
							}
						}
						else{
							return resp.status(200).json({ status: "success", employees: employees });
						}
					});
				// var shiftData = await Shift.find({corporate_id:req.authData.corporate_id});
				// Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
				// 	if (err) return resp.json({ status: "error", message: err.message });
				// 	if(employees.docs){
				// 		if(employees.docs.length > 0){
				// 			employees.docs.map(function(emp){
				// 				var total = 0;
				// 				if(emp.shift_rate){
				// 					if(emp.shift_rate.length > 0){
				// 						emp.shift_rate.map(function(rate){
				// 							var shiftDatas = shiftData.find(element => mongoose.Types.ObjectId(rate.shift_id).equals(element['_id']));
				// 							rate.rate = parseInt(rate.rate);
				// 							total += rate.rate;
				// 							rate.shift_data = {
				// 								'shift_name': shiftDatas.shift_name,
				// 								'shift_allowance': shiftDatas.shift_allowance,
				// 								'overtime': shiftDatas.overtime,
				// 							};
				// 						});
				// 					}
				// 				}
				// 				emp.shift_total = total;
				// 			});
				// 		}
				// 	}
				// 	return resp.status(200).json({ status: "success", employees: employees });
				// });
			}
		}
		catch (e) {
			return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
		}
	},

	//report no 62
	shift_duty_report_export: async function (req, resp, next) {
		try {
			const v = new Validator(req.body, {
				pageno: "required",
			});
			const matched = await v.check();
			if (!matched) {
				return resp
				.status(403)
				.send({
					status: "val_err",
					message: "Validation error",
					val_msg: v.errors,
				});
			} else {
				var sortbyfield = req.body.sortbyfield;
				if (sortbyfield) {
					var sortoption = {};
					sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
				} else {
					var sortoption = { created_at: -1 };
				}
				const options = {
		            page: req.body.pageno ? req.body.pageno : 1,
		            limit: req.body.perpage ? req.body.perpage : perpage,
		            sort: sortoption,
		        };
		        var start_date = req.body.wage_from_date;
				var end_date = req.body.wage_to_date;
				if(start_date || end_date){
	                var search_option = {
	                    $match: {
	                        $and: [
	                        { corporate_id: req.authData.corporate_id },
	                        { parent_hods: { $in: [req.authData.user_id] } },
	                        {$or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$gte: start_date }},
	                                {'shift.shift_end_date': {$lte: end_date }}
	                                ]
	                            } 
	                            ]
	                        },
	                        { $or:[
	                            { $and:[
	                                {'shift.shift_start_date': {$lte: end_date }},
	                                {'shift.shift_end_date': {$gte: start_date }}
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
							{ parent_hods: { $in: [req.authData.user_id] } },
							],
						},
					};
	            }
				var filter_option = {};
				
				var search_option_details = { $match: {} };
				if (req.body.searchkey) {
					search_option = {
						$match: {
							$text: { $search: req.body.searchkey },
							corporate_id: req.authData.corporate_id,
						},
					};
				} else {
					if (req.body.emp_name) {
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
						search_option.$match.emp_name = {
							$regex: req.body.emp_name,
							$options: "i",
						};
					}
					if (req.body.emp_last_name) {
						search_option.$match.emp_last_name = {
							$regex: req.body.emp_last_name,
							$options: "i",
						};
					}
					if (req.body.email_id) {
						search_option.$match.email_id = {
							$regex: req.body.email_id,
							$options: "i",
						};
					}
					if (req.body.emp_id) {
						search_option.$match.emp_id = {
							$regex: req.body.emp_id,
							$options: "i",
						};
					}
					if (req.body.designation_id) {
						var designation_ids = JSON.parse(req.body.designation_id);
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
					if (req.body.client_code) {
						var client_codes = JSON.parse(req.body.client_code);
						search_option.$match.client_code = { $in: client_codes };
					}
					if (req.body.hod_id) {
						var hod_ids = JSON.parse(req.body.hod_id);
						hod_ids = hod_ids.map(function (el) {
							return mongoose.Types.ObjectId(el);
						});
						search_option.$match.emp_hod = { $in: hod_ids };
					}
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
				var myAggregate = Employee.aggregate([
					search_option,
					{
						$lookup: {
							from: "employee_details",
							localField: "_id",
							foreignField: "employee_id",
							as: "employee_details",
						},
					},
					search_option_details,
					{
						$lookup: {
							from: "clients",
							localField: "client_code",
							foreignField: "_id",
							as: "client",
						},
					},
					{
						$lookup: {
							from: "staffs",
							localField: "emp_hod",
							foreignField: "_id",
							as: "hod",
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
							from: "shifts",
							localField: "shift.shift_id",
							foreignField: "_id",
							as: "shift_data",
						},
					},
					{
						$addFields: {
							hod: {
								$arrayElemAt: ["$hod", 0],
							},
							employee_details: {
								$arrayElemAt: ["$employee_details", 0],
							},
							client: {
								$arrayElemAt: ["$client", 0],
							},
							"designation": {
								"$arrayElemAt": [ "$designation", 0 ]
							},
							"department": {
								"$arrayElemAt": [ "$department", 0 ]
							},
							"branch": {
								"$arrayElemAt": [ "$branch", 0 ]
							},
							"shift_data": {
								"$arrayElemAt": [ "$shift_data", 0 ]
							},
						},
					},
					{$unwind: "$shift.shift_id"},
					{
						$project: {
							_id: 1,
							corporate_id: 1,
							userid: 1,
							emp_id: 1,
							emp_first_name: 1,
							emp_last_name: 1,
							client_code: 1,
							created_at: 1,
							is_hod: 1,
							status: 1,
							// shift: 1,
							// shift_rate: 1,
							approval_status: 1,
							// "employee_details._id": 1,
							"client._id": 1,
							"client.client_code": 1,
							"hod.first_name": 1,
							"hod.last_name": 1,
							"branch._id": 1,
							"branch.branch_name": 1,
							"department._id": 1,
							"department.department_name": 1,
							"designation._id": 1,
							"designation.designation_name": 1,
							"shift_data.shift_name":1,
							"shift_data.from":"$shift.shift_start_date",
							"shift_data.to":"$shift.shift_end_date"
						},
					},
					]).then(async (employees) => {
						var field_list_array=["emp_code","name","department","designation","branch","client_id","hod","shift_name","from","to"];
						var wb = new xl.Workbook();
	                    var ws = wb.addWorksheet("Sheet 1");
	                    var clmn_id = 1;
	                    ws.cell(1, clmn_id++).string("SL");
	                    if(field_list_array.includes('emp_code'))
	                    {
	                        ws.cell(1, clmn_id++).string("Employee Id");
	                    }
	                    if(field_list_array.includes('name'))
	                    {
	                        ws.cell(1, clmn_id++).string("Name");
	                    }
	                    if(field_list_array.includes('department'))
	                    {
	                        ws.cell(1, clmn_id++).string("Department");
	                    }
	                    if(field_list_array.includes('designation'))
	                    {
	                        ws.cell(1, clmn_id++).string("Designation");
	                    }
	                    if(field_list_array.includes('branch'))
	                    {
	                        ws.cell(1, clmn_id++).string("Branch");
	                    }
	                    if(field_list_array.includes('client_id'))
	                    {
	                        ws.cell(1, clmn_id++).string("Clinet ID");
	                    }
	                    if(field_list_array.includes('hod'))
	                    {
	                        ws.cell(1, clmn_id++).string("HOD");
	                    }
	                    if(field_list_array.includes('shift_name'))
	                    {
	                        ws.cell(1, clmn_id++).string("Shift Name");
	                    }
	                    if(field_list_array.includes('from'))
	                    {
	                        ws.cell(1, clmn_id++).string("From");
	                    }
	                    if(field_list_array.includes('to'))
	                    {
	                        ws.cell(1, clmn_id++).string("To");
	                    }
						if(employees){
							if(employees.length > 0){
								await Promise.all(employees.map(async function (emp, index) {
									var index_val = 2;
			                        index_val = index_val + index;
			                        var clmn_emp_id=1
			                        ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
			                        if(field_list_array.includes('emp_code'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.emp_id ? String(emp.emp_id) : ""
			                                );
			                        }
			                        if(field_list_array.includes('name'))
			                        {
			                            ws.cell(index_val,clmn_emp_id++).string(
			                                emp.emp_first_name ? String(emp.emp_first_name +" "+ emp.emp_last_name) : ""
			                                );
			                        }
			                        if(field_list_array.includes('department'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(emp.department ? String(emp.department.department_name) : "");
			                        }
			                        if(field_list_array.includes('designation'))
			                        {
		                                ws.cell(index_val, clmn_emp_id++).string(
		                                    emp.designation ? String(emp.designation.designation_name) : ""
		                                    );
			                           
			                        }
			                        if(field_list_array.includes('branch'))
			                        {
		                                ws.cell(index_val, clmn_emp_id++).string(
		                                    emp.branch ? String(emp.branch.branch_name) : ""
		                                    );
			                            
			                        }
			                        if(field_list_array.includes('client_id'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.client ? String(emp.client.client_code) : ""
			                                );
			                        }
			                        if(field_list_array.includes('hod'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.hod ? String(emp.hod.first_name+" "+emp.hod.last_name) : ""
			                                );
			                        }
			                        if(field_list_array.includes('shift_name'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.shift_data ? String(emp.shift_data.shift_name) : ""
			                                );
			                        }
			                        if(field_list_array.includes('from'))
			                        {
			                            ws.cell(index_val, clmn_emp_id++).string(
			                                emp.shift_data ? String(moment(emp.shift_data.from).format('DD/MM/YYYY')) : ""
			                                );
			                        }
			                        if(field_list_array.includes('to'))
			                        {
			                             ws.cell(index_val, clmn_emp_id++).string(
			                                emp.shift_data ? String(moment(emp.shift_data.to).format('DD/MM/YYYY')) : ""
			                                );
			                        }
			                      
			                        
								})).then(async (value) => {
			                        // wb.write("shift-duty-report.xlsx");
      								// let file_location = Site_helper.createFiles(wb,"shift-duty-report",'xlsx', req.authData.corporate_id)
      								let file_name = "shift-duty-report.xlsx";
									  let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/shift-module');
									  await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
									// file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
									// await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
			                        // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
			                    });
							}
							else{
								return resp.status(200).json({ status: "success", employees: employees });
							}
						}
						else{
							return resp.status(200).json({ status: "success", employees: employees });
						}
						
					});
				// Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
				// 	if (err) return resp.json({ status: "error", message: err.message });

				// 	return resp.status(200).json({ status: "success", employees: employees });
				// });
			}
		}
		catch (e) {
			return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
		}
	},
};