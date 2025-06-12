var fs = require('fs');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
var multer = require('multer');
var Site_helper = require("../../Helpers/Site_helper");
const  EmployeeModel = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
var EmployeeAttendance = require("../../Model/Company/EmployeeAttendance");
var LeaveTempHead = require("../../Model/Admin/LeaveTempHead");
var EmployeeLeave = require("../../Model/Company/EmployeeLeave");
var WeeklyHolidays = require("../../Model/Company/WeeklyHolidays");
var YearlyHolidays = require("../../Model/Company/YearlyHolidays");
const saltRounds = 10;
const moment = require('moment');

module.exports = {
	get_attendance: async function(req, resp){
		try{
			const condition = [];
			
			EmployeeModel.findById(req.authId,'-password -user_type', async function (err, employee_data) {
				if (err) 
				{
					resp.status(200).send({ status: 'error', message: err.message });
				}
				else{
					let AttendanceDetails = null;
					
					if(req.body.attendance_month || req.body.attendance_year){
						condition.push({
							'$match' : { 
								'emp_id':employee_data.emp_id,
								$or: [
								{"attendance_month": req.body.attendance_month },
								{"attendance_year": req.body.attendance_year},
								]
							}
						});
					}
					else{
						condition.push({ 
							'$match' : { 
								'emp_id':employee_data.emp_id,
							}
						});
					}
					var filter_option={'emp_id':employee_data.emp_id};
					if(req.body.attendance_month && req.body.attendance_year)
					{
						filter_option={$and:[{"emp_id":employee_data.emp_id},{$and:[
							{"attendance_month":{$regex: ".*" + req.body.attendance_month + ".*"}},
							{"attendance_year":{$regex: ".*" + req.body.attendance_year + ".*"}},
							]}
							]};
						}
						EmployeeAttendance.find(filter_option, '' ,  function (err, attendance_details) {
							if (err) return resp.json({ status: 'error', message: err.message });
							return resp.status(200).json({ status: 'success', attendance_details: attendance_details });
						})
					}
				})
		}
		catch (e) {
			return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
		}
	},
	attendance_details: async function(req, resp){
		try{
			const v = new Validator(req.body, {
				attendance_id: 'required',
			});
			const matched = await v.check();
			if (!matched) {
				return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
			}
			var ObjectId = mongoose.Types.ObjectId;
			if(req.body.attendance_id){
				if(!ObjectId.isValid(req.body.attendance_id))
				{
					return resp.status(200).send({ status: 'error', message: "Not a valid id"});
				}
			}
			EmployeeAttendance.findById(req.body.attendance_id,'', async function (err, attendance_details) {
				if (err) 
				{
					resp.status(200).send({ status: 'error', message: err.message });
				}
				
				return resp.status(200).json({ status: 'success', attendance_details: attendance_details });
				
			})
		}
		catch (e) {
			return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
		}
	},
	employee_leave_type: async function(req, resp){
		try{

			let leave_type = {};
			let LeaveHead = {};
			EmployeeDetails.findOne({'employee_id':req.authId},'', async function (err, employee_details) {
				if (err) 
				{
					resp.status(200).send({ status: 'error', message: err.message });
				}
				if(employee_details){
					if(employee_details.leave_balance_counter){
						leave_type = employee_details.leave_balance_counter;
					}
					else{
						return resp.status(200).send({ status: 'error', message: "Employee details not found..!"});
					}
				}
				else{
					return resp.status(200).send({ status: 'error', message: "Employee details not found..!"});
				}

				return resp.status(200).json({ status: 'success', leave_type: leave_type });

			})
		}
		catch (e) {
			return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
		}
	},
	employee_apply_leave: async function(req, resp){
		try{
			const v = new Validator(req.body, {
				leave_id: 'required|string',
				leave_temp_head: 'required|string',
				leave_from_date: 'required|date',
				leave_to_date: 'required|date',
				note: 'required',
				// leave_from_date_type: 'required|in:full_day,first_half,second_half',
				// leave_to_date_type: 'required|in:full_day,first_half,second_half',
				leave_balance: 'required|numeric',
			});
			const matched = await v.check();
			if (!matched) {
				return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
			}
			else{
				var ObjectId = mongoose.Types.ObjectId;
				if(req.body.leave_id){
					if(!ObjectId.isValid(req.body.leave_id))
					{
						return resp.status(200).send({ status: 'error', message: "Not a valid id"});
					}
				}
				var employeeData = await EmployeeModel.findOne({'_id':req.authId});
				if(!employeeData){
					return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
				}
				var employeeDetails = await EmployeeDetails.findOne({"employee_id":employeeData._id});
				if(employeeDetails){
					if(employeeDetails.template_data){
						if(employeeDetails.template_data.leave_temp_data){
							if(employeeDetails.template_data.leave_temp_data.template_data){
								var totalRestleaveCount = 0;
								for (var td = 0; td < employeeDetails.template_data.leave_temp_data.template_data.length; td++) {
									var leavetempheadCheckTime = await LeaveTempHead.findOne({'_id':employeeDetails.template_data.leave_temp_data.template_data[td].leave_type});
									if(leavetempheadCheckTime){
										if(leavetempheadCheckTime.abbreviation == req.body.leave_temp_head){
											if(employeeDetails.template_data.leave_temp_data.template_data[td].leave_tenure == "Annualy"){
												var start = new Date(new Date().getFullYear(),0,2,-18,-30,0);
												var end = new Date(new Date().getFullYear(),11,32,5,29,59);
											}
											else if(employeeDetails.template_data.leave_temp_data.template_data[td].leave_tenure == "Quaterly"){
												var start = new Date(new Date().getFullYear(),new Date().getMonth()-3,2,-18,-30,0);
												var end = new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()+1,5,29,59);
											}
											else{
												var start = new Date(new Date().getFullYear(),new Date().getMonth(),2,-18,-30,0);
												var end = new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()+1,5,29,59);
											}
											var search_option = {
												$match: {
													$and: [
													{employee_id:mongoose.Types.ObjectId(req.authId)},
													{leave_temp_head:leavetempheadCheckTime.abbreviation},
													{leave_approval_status:{$ne:'rejected'} },
													
													{$or:[ 
														{'leave_to_date': {$gt: start}}, 
														{ $and:[
															{'leave_from_date': {$gte: start }},
															{'leave_to_date': {$gte: start }}
															]
														} 
														]
													},
													{ $or:[ 
														{'leave_from_date': {$lt: end}}, 
														{ $and:[
															{'leave_from_date': {$lte: end }},
															{'leave_to_date': {$lte: end }}
															]
														} 
														]
													}
													],
												},
											};
											var existLeaveRequest = await EmployeeLeave.aggregate([search_option]);

											if(existLeaveRequest.length > 0){
												for (var xhr = 0; xhr < existLeaveRequest.length; xhr++) {
													totalRestleaveCount += parseFloat(existLeaveRequest[xhr].leave_count_days);
												}
											}
											if(totalRestleaveCount > parseFloat(employeeDetails.template_data.leave_temp_data.template_data[td].restriction_days)){
												return resp.status(200).send({ status: 'error', message: 'You cannot add a leave. because your leave quota are complete.'});
											}
										}
									}
								}
							}
						}
					}
				}
				var existLeaveRequest = await EmployeeLeave.find({employee_id:req.authId,leave_approval_status:{$ne:'rejected'}});
				if(existLeaveRequest){
					for (var i = 0; i < existLeaveRequest.length; i++) {
						var startDate = moment(req.body.leave_from_date).format('YYYY-MM-DD'), 
						endDate   = moment(req.body.leave_to_date).format('YYYY-MM-DD'),
						fromDate  = moment(existLeaveRequest[i].leave_from_date).format('YYYY-MM-DD'),
						toDate  = moment(existLeaveRequest[i].leave_to_date).format('YYYY-MM-DD');
						if(moment(fromDate).isBetween(startDate, endDate, null, '[]') || moment(toDate).isBetween(startDate, endDate, null, '[]')) {
							return resp.status(200).send({ status: 'error', message: 'Previous leave request is in pending / approved for the selected dates.'});
						}     
					}
				}
				// console.log(existLeaveRequest);
				// return false;
				let todate = moment(new Date());
				let leave_from_date = moment(req.body.leave_from_date);
				let leave_to_date = moment(req.body.leave_to_date);

			// if(todate.diff(leave_from_date) >= 0){
				if(todate.format('YYYY-MM-DD') > leave_from_date.format('YYYY-MM-DD')){
					return resp.status(200).send({ status: 'error', message: 'There is attendance logs present for 1 day.'});
				}

				if(leave_from_date.diff(leave_to_date) > 0){
					return resp.status(200).send({ status: 'error', message: 'Please select a date bigger than from date.'});
				}


				var date_str1 = {
					'month':moment(req.body.leave_from_date).format('MM'),
					'year':moment(req.body.leave_from_date).format('YYYY')
				};
				var date_str2 = {
					'month':moment(req.body.leave_to_date).format('MM'),
					'year':moment(req.body.leave_to_date).format('YYYY')
				};
				let from_weekly_holidays = await Site_helper.weeklyHolidays(date_str1);
				let to_weekly_holidays = await Site_helper.weeklyHolidays(date_str2);
				let from_yearly_holidays = await Site_helper.yearlyHolidays(date_str1);
				let to_yearly_holidays = await Site_helper.yearlyHolidays(date_str2);
				const all_holidays = [].concat(from_weekly_holidays, to_weekly_holidays,from_yearly_holidays,to_yearly_holidays);
				all_holidays.sort(function(a, b) {
					return a - b;
				});

				let leave_total_days =  leave_to_date.diff(leave_from_date , 'days') +1;

				let count = 0;
				for (var i = 0; i < leave_total_days; i++) {

					var checkDate =  await checkExistLeaveOnHoliday(moment(leave_from_date).add(i, 'days').format('DD/MM/YYYY'), all_holidays);
					if(!checkDate){
						count = count + 1;
					}
					else{
						var fullDayName = moment(leave_from_date).add(i, 'days').format('dddd');
						var firstFromDate = moment(leave_from_date).add(i, 'days'); 
						var day = firstFromDate.day(); 
						var nthOfMoth = Math.ceil(firstFromDate.date() / 7);
						let weeklyHolidaysDays = await WeeklyHolidays.findOne({'weekday':fullDayName});
						let yearlyHolidaysDays = await YearlyHolidays.findOne({'holiday_date':moment(leave_from_date).add(i, 'days').format('YYYY-MM-DD')+'T05:00:00.000+00:00'});
						// console.log(yearlyHolidaysDays,moment(leave_from_date).add(i, 'days').format('YYYY-MM-DD')+'T05:00:00.000+00:00');
						if(weeklyHolidaysDays && !yearlyHolidaysDays){
							if(weeklyHolidaysDays.weeks[nthOfMoth] != '{}'){
								// console.log(weeklyHolidaysDays.weeks[nthOfMoth],nthOfMoth,fullDayName,moment(leave_from_date).add(i, 'days'));
								if (weeklyHolidaysDays.weeks[nthOfMoth].first_half == "yes" || weeklyHolidaysDays.weeks[nthOfMoth].second_half == "yes") {
									count = count + .5;
								}
								else if(weeklyHolidaysDays.weeks[nthOfMoth].first_half == "no" && weeklyHolidaysDays.weeks[nthOfMoth].second_half == "no"){
									count = count + 1;
								}
							}
						}
					}                	
				}

				if(count > parseFloat(req.body.leave_balance)){
					return resp.status(200).send({ status: 'error', message: 'There is not enough leave balance for Leave.'});
				}



				var document = {
					corporate_id: employeeData.corporate_id,
					employee_id: mongoose.Types.ObjectId(employeeData._id),
					emp_id: employeeData.emp_id,
					leave_id: mongoose.Types.ObjectId(req.body.leave_id),
					leave_temp_head: req.body.leave_temp_head,
					leave_from_date: req.body.leave_from_date,
					leave_to_date: req.body.leave_to_date,
					note: req.body.note,
					// leave_from_date_type: req.body.leave_from_date_type,
					// leave_to_date_type: req.body.leave_to_date_type,
					status:'active',
					leave_total_days: leave_total_days,
					leave_count_days: count,
					current_balance : (req.body.leave_balance - count).toString(),
					leave_approval_status : 'pending',
					approve_by:null,
					approve_date:null
				};
				var employeeDetails = await EmployeeDetails.findOne({'employee_id':req.authId});
				if(!employeeDetails){
					return resp.status(200).json({ 'status': "error", 'message': 'Employee details not found.'});
				}

				var leaveTempHead = req.body.leave_temp_head.toLowerCase();
				var upLeaveCount = req.body.leave_balance - count;
				var document2 = {
					[leaveTempHead] : upLeaveCount.toString(),
				};
				var updateEmployeeLeaveBalance = Object.assign(employeeDetails.leave_balance, document2);
				// console.log(updateEmployeeLeaveBalance,employeeDetails.leave_balance);
				// return false;
				// var LeaveBalanceCounterdocument = {
				// 	"leave_balance_counter.$.consumed": count.toString(),
				// 	"leave_balance_counter.$.total_balance": upLeaveCount,
				// };
				// await EmployeeDetails.updateOne({'employee_id':req.authId,"leave_balance_counter._id": mongoose.Types.ObjectId(req.body.leave_id)},{ $set: LeaveBalanceCounterdocument });
				EmployeeLeave.create(document, function (err, leave_data) {
					if (err) 
					{
						return resp.status(200).send({ status: 'error', message: err.message });
					}
					else
					{
						EmployeeDetails.updateOne({ employee_id: req.authId },{'leave_balance':updateEmployeeLeaveBalance},function (err, emp_det) {
							if (err) {
								resp.status(200).send({ status: "error", message: err.message });
							} else {
								resp.status(200).send({ status: "success", message: "Leave apply successfully.",leave_data: leave_data });
							}
						});
						// resp.status(200).send({ status: 'success', message:"Leave apply successfully.", leave_data: leave_data });
					}
				})
			}
		}
		catch (e) {
			return resp.status(200).json({ status: false, message: e ? e.message:'Something went wrong' });
		}
	},
	employee_leave_list: async function(req, resp){
		let data = {};
		try{
			var employeeData = await EmployeeModel.findOne({'_id':mongoose.Types.ObjectId(req.authId)});
			if(!employeeData){
				return resp.status(200).json({ 'status': "error", 'message': 'User not found.', data: data });
			}

			var sortoption = {created_at: -1};
			const options = {
				page: req.body.pageno?req.body.pageno:1,
				limit: req.body.perpage?req.body.perpage:10,
				sort:     sortoption,
			};
			var filter_option = {
				$match: {
					$and: [
						{ "employee_id": mongoose.Types.ObjectId(employeeData._id) },
					],
				},
			};
            //'leave_approval_status':req.body.status
            if(req.body.status){
            	// filter_option = Object.assign(filter_option, {'leave_approval_status':req.body.status});
            	filter_option.$match.leave_approval_status = {
            		$regex: req.body.status,
            		$options: "i",
            	};	
            }
            if(req.body.leave_type){
            	// filter_option = Object.assign(filter_option, {'leave_temp_head':{'$regex': req.body.leave_type + '.*', '$options': 'i' }});
            	filter_option.$match.leave_temp_head = {
            		$regex: req.body.leave_type + '.*',
            		$options: "i",
            	};
            }
            var existLeaveRequest = EmployeeLeave.aggregate([filter_option]);
            EmployeeLeave.aggregatePaginate(existLeaveRequest,options, async  function (err, leave_list) {
            	if (err) return resp.json({ status: 'error', message: err.message });
            	datas = leave_list;
            	docs = datas.docs.map(async (item) => {
            		data = await LeaveTempHead.findOne({'abbreviation':item.leave_temp_head});
            		if(data){
            			item.leave_temp_head = data;
            			item.leave_temp_head = item.leave_temp_head;
            		}
            		else{
            			item.leave_temp_head = {};
            		}
            		// item.leave_temp_head = JSON.parse(item.leave_temp_head);
            		return item;
            	});
            	leave_list.docs = await Promise.all(docs);
            	// console.log(leave_list);
            	return resp.status(200).json({ status: 'success', 'message': 'Leave fetched successfully', leave_list: leave_list });
            })
        }
        catch (e) {
        	return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    employee_view_leave_status_list: async function(req, resp){
    	let data = {};
    	try{
    		var employeeData = await EmployeeModel.findOne({'_id':mongoose.Types.ObjectId(req.authId)});
    		if(!employeeData){
    			return resp.status(200).json({ 'status': "error", 'message': 'User not found.', data: data });
    		}
    		// console.log(employeeData);
    		EmployeeDetails.findOne({employee_id:employeeData._id}, async  function (err, leave_status_list) {
    			if (err) return resp.json({ status: 'error', message: err.message });
    			if(leave_status_list){
    				if(leave_status_list.leave_balance_counter){
    					data = leave_status_list.leave_balance_counter;	
    				}
    			}
    			return resp.status(200).json({ status: 'success', 'message': 'Leave status list fetched successfully', leave_status_list: data });
    		})
    	}
    	catch (e) {
    		return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
    	}
    },
    employee_view_leave_status_list_details: async function(req, resp){
    	let data = {};
    	try{
    		const v = new Validator(req.body, {
    			leave_abbreviation: "required",
    		});
    		const matched = await v.check();
    		if (!matched) {
    			return resp.status(200).send({
    				status: "val_err",
    				message: "Validation error",
    				val_msg: v.errors,
    			});
    		}
    		var employeeData = await EmployeeModel.findOne({'_id':mongoose.Types.ObjectId(req.authId)});
    		if(!employeeData){
    			return resp.status(200).json({ 'status': "error", 'message': 'User not found.', data: data });
    		}
    		var sortoption = {created_at: -1};
    		const options = {
    			page: req.body.pageno?req.body.pageno:1,
    			limit: req.body.perpage?req.body.perpage:10,
    			sort:     sortoption,
    		};
    		// var filter_option = {leave_temp_head:req.body.leave_abbreviation,employee_id:employeeData._id};
    		var filter_option = {
				$match: {
					employee_id: mongoose.Types.ObjectId(employeeData._id),
					leave_temp_head: req.body.leave_abbreviation,
				},
			};
    		var existLeaveRequest = EmployeeLeave.aggregate([filter_option]);
    		EmployeeLeave.aggregatePaginate(existLeaveRequest,options, async  function (err, leave_list) {
    			if (err) return resp.json({ status: 'error', message: err.message });
    			data = leave_list;
    			return resp.status(200).json({ status: 'success', 'message': 'Leave list fetched successfully', leave_list: data });
    		})
    	}
    	catch (e) {
    		return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
    	}
    },
};
async function checkExistLeaveOnHoliday(loopDate, holiday_array) {
	var length = holiday_array.length;
	for(var i = 0; i < length; i++) {
		if(moment(holiday_array[i]).format('DD/MM/YYYY') === loopDate) 
			return true;
	}
	return false;
}
