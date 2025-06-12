const employee = require('../../Model/Company/employee');
const employee_map = require('../../Model/Company/employee_map');
const Attendance = require('../../Model/Admin/Attendance');
const EmployeeAttendance = require('../../Model/Company/EmployeeAttendance');
var SiteHelper = require('../../Helpers/Site_helper');


const { Validator } = require('node-input-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var fs = require('fs');
var path = require("path");
const { parse } = require("csv-parse");
var moment = require('moment');
var _ = require('lodash');
const biometric_system = require('../../Model/Company/BiometricSystem');

module.exports = {
  importCsv: async function (req, resp) {
    try {
      //console.log("Working Successfully");
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
},
// uploadCsv:async function(req, resp){
//     try{
//         let categoryData;
//         let sheet_data_lists=[];

//         fs.readFile(req.files[0].path, async function (err, data) {

//             var imageName = req.files[0].originalname
    
//             /// If there's an error
//             if(!imageName){
    
//                 console.log("There was an error")
//                 res.redirect("/");
//                 res.end();
    
//             } else {
//               var newPath =file_path+"/storage/company/" + imageName;
//                 let i=1;
//               /// write file to uploads/fullsize folder
//               await fs.writeFile(newPath, data, async function (err) {
//                 /// let's see it
//                 fs.createReadStream(newPath)
//                 .pipe(parse({ delimiter: ",", from_line: 2 }))
//                 .on("data", async function (row) {
//                     if(sheet_data_lists.findIndex(p => p.key == row[0])===-1)
//                     {
//                         sheet_data_lists.push({key:row[0],value:row[0]+' - '+row[1]});
//                         i++;
//                     }
                   
//                 }).on("end", async function () {
//                    let employees=[];
//                     await employee.find({corporate_id: req.authData.corporate_id},'_id emp_id emp_first_name emp_last_name',  function (err, empdata) {
//                         if (err) return resp.json({ status: 'error', message: err.message });
//                         console.log(empdata);
//                         employees=empdata;
//                     })
//                     let data={sheet_data:sheet_data_lists,employees:employees};
//                     return resp.status(200).json({ status: 'success', data: data });
//                 })
//                   .on("error", function (error) {
//                    return resp.json({ status: 'error', message: error.message });

//                   });


//               });
//           });
//         //}
//       //});
//     } catch (e) {
//       return resp.status(200).json({
//         status: "error",
//         message: e ? e.message : "Something went wrong",
//       });
//     }
//   },
  mapEmployee: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        machine_id: "required",
        emp_data: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }
      let emp_data = [];
      //req.authData.corporate_id="ivn123";
      await req.body.emp_data.forEach(async (element) => {
        element["machine_id"] = req.body.machine_id;
        element["corporate_id"] = "ivn123";
        if (element.sheet_id) {
          emp_data.push(element);
        }
      });
      //console.log(emp_data);
      const query = { machine_id: { $regex: req.body.machine_id } };
      const result = await employee_map.deleteMany(query);
      //console.log("Deleted " + result.deletedCount + " documents");
      await employee_map.create(emp_data, function (err, product) {
        if (err) return resp.json({ status: "error", message: err.message });
        return resp
          .status(200)
          .json({ status: "success", message: "Data Mapped Successfully" });
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  uploadAttendanceData: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        attendance_year: "required",
        attendance_month: "required",
        biometric_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }
      const { biometric_id } = req.body;
      if (biometric_id === "WS-089") {
        await upload_attendance_WS_089(req, resp).then((res) => {
          return resp
            .status(200)
            .json({
              status: "success",
              message: "Attendance sheet Uploaded!",
              data: res,
            });
        });
        return;
      }

      if (biometric_id === "VAS-222") {
        await uplod_attendance_VAS_222(req, resp).then((res) => {
          return resp
            .status(200)
            .json({
              status: "success",
              message: res.message || "Attendance sheet Uploaded!",
              data: res.data,
            });
        });
        return;
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  getBiometricSystems: async (req, resp) => {
    try {
      let filters = {};
      let options = {};

      var sortbyfield = req.body.sortbyfield;
      if (sortbyfield) {
        var sortoption = {};
        sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
      } else {
        var sortoption = { created_at: -1 };
      }

      options.page = parseInt(req.body.pageno || 1);
      options.limit = req.body.perpage ? parseInt(req.body.perpage) : perpage;
      options.sort = sortoption;

      if (req.authData.corporate_id)
        filters.corporate_id = req.authData.corporate_id;

      await biometric_system
        .find(filters, (err, docs) => {
          if (err) {
            return resp.status(200).json({
              status: "error",
              message: err,
            });
          }
          return resp.status(200).send({
            status: "success",
            docs,
          });
        })
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort);
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
};

const upload_attendance_WS_089 = async (req, resp) => {
	return new Promise(async (resolve, reject) => {
	  try {
		  const v = new Validator(req.body, {
			  attendance_year: 'required',
			  attendance_month: 'required'
  
		  });
		  const matched = await v.check();
		  if (!matched) {
			  return resp.status(200).send({
				  status: 'val_err',
				  message: "Validation error",
				  val_msg: v.errors
			  });
		  }
		  let categoryData;
		  let sheet_data_lists = [];
  
		  fs.readFile(req.files[0].path, async function (err, data) {
  
			  var imageName = req.files[0].originalname
  
			  /// If there's an error
			  if (!imageName) {
  
				  return resp.status(200).send({
					  status: 'val_err',
					  message: "File is missing"
				  });
  
  
			  } else {
  
  
				  var newPath = file_path + "/storage/company/attendance_funnel/" + imageName;
				  let i = 1;
				  col=1;
				  let log_data = [];
				  let random_array=[];
				  await fs.writeFile(newPath, data, async function (err) {
					  /// let's see it
  
					  await fs.createReadStream(newPath)
						  .pipe(parse({
							  delimiter: ",",
							  from_line: 1
						  }))
						  .on("data", async function (row) {
							  if(col==1)
							  {
								  if(row[0]!='Person ID' || row[1]!='Name' || row[2]!='Department' || row[3]!='Time' || row[4]!='Attendance Status'
								   || row[5]!='Attendance Check Point' || row[6]!='Custom Name' || row[7]!='Data Source' || row[8]!='Handling Type' || row[9]!='Temperature' || row[10]!='Abnormal'
								  
								  )
								  {
									  return resp.json({
										  status: 'error',
										  message: "Sorry Invalid File"
									  });
								  }
							  }
							  else
							  {
							  log_date = moment(row[3], ["MM/DD/YYYY HH:mm:ss", "YYYY-MM-DD"]).format("YYYY-MM-DD");
							  log_time = moment(row[3], ["MM/DD/YYYY HH:mm:ss", "HH:mm:ss"]).format("HH:mm:ss");
							  log_date_time = moment(row[3], ['MM/DD/YYYY HH:mm:ss', 'YYYY-MM-DD HH:mm:ss']).format('YYYY-MM-DD HH:mm:ss');
							  let name_arr = row[1].split("-");
							  let emp_id;
							  if (name_arr.length == 2) {
								  emp_id = name_arr[1] ? name_arr[1] : '';
							  }
  
  
							  if (name_arr.length > 2) {
								  name_arr.splice(0, 1);
								  emp_id = name_arr.join("-");
  
							  }
							  if(emp_id)
							  {
								  log_data.push({
									  emp_id: emp_id,
									  log_date_time: log_date_time
								  });
								  random_array.push({emp_id: emp_id,
									  log_date_time: moment(row[3],["MM/DD/YYYY HH:mm:ss", "YYYY-MM-DD HH:mm:ss"]).format('YYYY-MM-DD HH:mm:ss')});
							  }
							  random_array.sort(function(a, b) {
								  var keyA =(a.log_date_time),
								  keyB = (b.log_date_time);
								  // Compare the 2 dates
								  if (keyA < keyB) return -1;
								  if (keyA > keyB) return 1;
								  return 0;
								});
								
						  }
						  col++
  
						  }).on("end", async function () {
							  let holiday_lists;
							  let year_holiday_lists;
							  let output = [];
							  let final_data = [];
							  let corporate_id = "ivn123";
							  await SiteHelper.weeklyHolidays({
								  year: req.body.attendance_year,
								  month: req.body.attendance_month
							  }).then(resp => {
								  holiday_lists = (resp);
  
							  });
							  let week_off_days = [];
							  await holiday_lists.reduce(async (c, holidayData) => {
								  week_off_days.push(moment(holidayData).format('YYYY-MM-DD'));
							  }, Promise.resolve());
							  await SiteHelper.yearlyHolidays({
								  year: req.body.attendance_year,
								  month: req.body.attendance_month
							  }).then(resp => {
								  year_holiday_lists = resp;
  
							  })
							  let existing;
							  await log_data.reduce(async (f, item) => {
								  emp_index = output.findIndex(p => p.emp_id == item.emp_id);
								  if (emp_index != -1) {
  
									  output[emp_index]['log_date_time'].push(item.log_date_time);
								  } else {
  
									  output.push({
										  emp_id: item.emp_id,
										  log_date_time: [item.log_date_time]
									  });
								  }
  
  
							  }, Promise.resolve());
							  
							  await output.reduce(async (d, item) => {
								  let temp_elem = [];
								  await item.log_date_time.reduce(async (e, sub_item) => {
									  log_date = (moment(sub_item).format('YYYY-MM-DD'));
									  log_time = (moment(sub_item).format('HH:mm:ss'));
  
  
									  if (item.emp_id) {
										  // console.log(log_date+'=>'+item.emp_id);
										  let log_times_arr = [];
										  date_index = temp_elem.findIndex(p => p.attendance_date == log_date);
  
										  if (date_index == -1) {
  
											  temp_elem.push({
												  'attendance_date': log_date,
												  'logs': [log_time],
												  'log_dateTime': [moment(sub_item)]
  
											  });
  
										  } else {
											  temp_elem[date_index]['logs'].push(log_time);
											  temp_elem[date_index]['log_dateTime'].push(moment(sub_item));
  
  
										  }
									  }
								  }, Promise.resolve());
  
								  final_data.push({
									  emp_id: item.emp_id,
									  details: temp_elem
								  });
  
							  }, Promise.resolve())
  
  
							  let submitted_data = [];
							  await final_data.reduce(async (a, item) => {
								  item.details.sort(function(a, b) {
									  var keyA =(a.attendance_date),
									  keyB = (b.attendance_date);
									  // Compare the 2 dates
									  if (keyA < keyB) return -1;
									  if (keyA > keyB) return 1;
									  return 0;
									});
								  // Wait for the previous item to finish processing
								  await a;
								  // Process this item
								  let rule_data = {};
								  let totalWorkingHour = 0;
								  let startTime = null;
								  let endTime = null;
								  let startTime_2 = null;
								  let endTime_2 = null;
								  let shift_details = null;
								  let shift = null
								  let reporting_time = null
								  let grace_period_rule = null;
  
								  await SiteHelper.attendanceRule(item.emp_id, corporate_id).then(async (res) => {
									  rule_data = res;
									  if (rule_data) {
										  startTime = rule_data.reporting_time;
										  endTime = rule_data.closing_time;
										  reporting_time = rule_data.reporting_time;
										  grace_period_rule = rule_data.grace_period;
										  startTime_arr=rule_data.reporting_time.split(":");
										  endTime_arr=rule_data.closing_time.split(":");
										  reporting_time_arr=rule_data.reporting_time.split(":");
									  }
  
								  },
									  (err) => {
  
									  });
  
								  await SiteHelper.shiftDetail(item.emp_id).then(async (res) => {
  
									  if (res) {
										  shift_details = res.shift_details[0];
										  shift = res;
									  }
  
								  },
									  (err) => {
  
									  });
									  sl=1;
								  for (kk=0;kk<item.details.length;kk++)
								  {
									  
									  subItem=item.details[kk];
									  if(subItem.log_dateTime.length>0)
									  {
									  //console.log(shift_details);		
									  let is_shift_data = false;
									  let total_logged_in = 0;
									  let total_break_time = 0;
									  log_array_1 = [];
									  log_array_2 = [];
									  let next_day_shifts=[];
									  subItem.logs = [...new Set(subItem.logs)];
									  subItem.log_dateTime = [...new Set(subItem.log_dateTime)];
									  subItem.log_dateTime.sort();
									  subItem.logs.sort();
									  second_shift_index = null;
									  totalWorkingHour = 0;
									  reporting_time;
									  
									  log_array_1 = random_array.filter(obj => 
										  (obj.emp_id== item.emp_id && moment(obj.log_date_time).format('YYYY-MM-DD')==moment(subItem.attendance_date).format("YYYY-MM-DD") )
									  
									  );
									  
									  cal_attendance_date=subItem.attendance_date;
									  
  
									  if (startTime && endTime) {
										  startTime=moment({
											  year: moment(cal_attendance_date).format('YYYY'),
											  month: moment(cal_attendance_date).format('MM')-1,
											  day: moment(cal_attendance_date).format('DD'),
											  Hour: reporting_time_arr[0],
											  Minute: reporting_time_arr[1],
											  Second:  reporting_time_arr[2]	
										  });
										  endTime=moment({
											  year: moment(cal_attendance_date).format('YYYY'),
											  month: moment(cal_attendance_date).format('MM')-1,
											  day: moment(cal_attendance_date).format('DD'),
											  Hour: endTime_arr[0],
											  Minute: endTime_arr[1],
											  Second:  endTime_arr[2]	
										  });
										  hours = parseInt(endTime.diff(startTime, 'hours'));
										  minutes = parseInt(moment(endTime).diff(moment(startTime), 'minutes') % 60)
										  totalWorkingHour = (hours + (minutes / 100));
									  }
									  if (shift_details) {
										  shift1_start_arr = shift_details.shift1_start_time.split(":");
										  shift1_end_arr = shift_details.shift1_end_time.split(":");
  
										  let first_half_start=moment({
											  year: moment(cal_attendance_date).format('YYYY'),
											  month: (moment(cal_attendance_date).format('MM')-1),
											  day: moment(cal_attendance_date).format('DD'),
											  Hour: shift1_start_arr[0],
											  Minute: shift1_start_arr[1],
											  Second: shift1_start_arr[2]	
										  });
										  
										  let first_half_end=moment({
											  year: moment(cal_attendance_date).format('YYYY'),
											  month: moment(cal_attendance_date).format('MM')-1,
											  day: moment(cal_attendance_date).format('DD'),
											  Hour: shift1_end_arr[0],
											  Minute: shift1_end_arr[1],
											  Second: shift1_end_arr[2]	
										  });
  
										  shift1_start = (+shift1_start_arr[0]) * 60 + (+shift1_start_arr[1]);
  
										  shift1_end = (+shift1_end_arr[0]) * 60 + (+shift1_end_arr[1]);
  
										  
										  shift2_start = 0;
  
										  shift2_end = 0;
  
										  second_half_start=null
										  second_half_end=null
										  if (shift_details.shift2_end_time && shift_details.shift2_start_time) {
											  shift2_start_arr = shift_details.shift2_start_time.split(":");
  
											  shift2_end_arr = shift_details.shift2_end_time.split(":");
  
											  shift2_start = (+shift2_start_arr[0]) * 60 + (+shift2_start_arr[1]);
  
											  shift2_end = (+shift2_end_arr[0]) * 60 + (+shift2_end_arr[1]);
											  
											  second_half_start=moment({
												  year: moment(cal_attendance_date).format('YYYY'),
												  month: moment(cal_attendance_date).format('MM')-1,
												  day: moment(cal_attendance_date).format('DD'),
												  Hour: shift2_start_arr[0],
												  Minute: shift2_start_arr[1],
												  Second: shift2_start_arr[2]	
											  });
											  second_half_end=moment({
												  year: moment(cal_attendance_date).format('YYYYY'),
												  month: moment(cal_attendance_date).format('MM')-1,
												  day: moment(cal_attendance_date).format('DD'),
												  Hour: shift2_end_arr[0],
												  Minute: shift2_end_arr[1],
												  Second: shift2_end_arr[2]	
											  });
											  prev_startDate=second_half_end;
										  }
										  let filter_fhalf_items=null;
										  let end_linit;
										  date_ampm=moment(subItem.log_dateTime[0]).format('A');
										  let day_end_time=null;
										  let x = new Date(shift.shift_end_date);
										  let x_1 = new Date(shift.shift_start_date);
										  y = new Date(cal_attendance_date);
										  
										  diffDays=0;
										  diffTime = ( y - x);
										  if(diffTime>0)
										  {
											  diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
										  }
  
										  if((diffDays==1 || x>y) && (shift1_start>shift1_end || shift2_start>shift2_end))
										  {
										  
										  if(shift1_start>shift1_end){
										  if(second_half_start)
										  {
											  if(moment(subItem.log_dateTime[0])>=moment(first_half_start).subtract(1,"days") && moment(subItem.log_dateTime[0])<=moment(second_half_end))
											  {
												  cal_attendance_date=moment(subItem.attendance_date).subtract(1,"days");
  
											  }
										  }
										  else{
											  if(moment(subItem.log_dateTime[0])>=moment(first_half_start).subtract(1,"days") && moment(subItem.log_dateTime[0])<=moment(first_half_end))
											  {
												  cal_attendance_date=moment(subItem.attendance_date).subtract(1,"days");
  
											  }
										  }
										  }
										  
										  else if(shift2_start>shift2_end){
										  if(moment(subItem.log_dateTime[0])>=moment(second_half_start).subtract(1,'days') && moment(subItem.log_dateTime[0])<=moment(second_half_end))
										  {
											  cal_attendance_date=moment(subItem.attendance_date).subtract(1,"days");
  
										  }	
										  }
										  }
										   y = new Date(cal_attendance_date);
  
										  if(y >= x_1 && y <= x)
										  {	
  
										  is_shift_data=true;
										  if(second_half_start)
										  {
											  limit_end_date=null;;
											  if(shift1_start>shift1_end)
											  {
												  if(date_ampm=='AM')
												  {
													  
													  prev_startDate=moment(first_half_start).subtract(1,"days");
													  l_end_date=moment(second_half_start);
													  end_linit=moment(first_half_start)
													  limit_end_date=moment(second_half_start);
													  cal_attendance_date=moment(subItem.attendance_date).subtract(1,"days");
												  }
												  else{
													  end_linit=moment(first_half_start).add(1,"days");
													  prev_startDate=moment(first_half_start);
													  l_end_date=moment(second_half_start).add(1,"days");
													  
												  }	
											  }
											  else{
												  
												  prev_startDate=moment(first_half_start);									
												  l_end_date=moment(second_half_start);
												  
												  if(shift1_start<shift2_start && shift2_start<shift2_end)
												  {
													  end_linit=moment(first_half_start).add(1,"days");
												  }
												  else{
													  end_linit=moment(second_half_start).add(1,"days");
												  }
												  
											  }
											  
											  filter_fhalf_items = random_array.filter(obj => 
												  (obj.emp_id== item.emp_id && moment(obj.log_date_time) >= moment(prev_startDate).subtract(2,'hours') && moment(obj.log_date_time) < moment(l_end_date).subtract(2,'hours'))
											  );
											  
										  }
										  else{
											  
											  if(shift1_start>shift1_end)
											  {
												  if(subItem.log_dateTime[0]<first_half_end){
													  date_ampm=moment(subItem.log_dateTime[0]).format('A');
													  if(date_ampm=='AM')
													  {
														  
														  cal_attendance_date=moment(subItem.attendance_date).subtract(1,"days");
														  prev_startDate=moment(first_half_start).subtract(1,"days");
														  l_end_date=moment(first_half_start)
													  }
													  else{
														  prev_startDate=moment(first_half_end);
														  l_end_date=moment(first_half_end).add(1,"days");
													  }
													  
													  filter_fhalf_items = random_array.filter(obj => 
														  (obj.emp_id== item.emp_id &&  (moment(obj.log_date_time)>=moment(prev_startDate).subtract(2,'hours') && moment(obj.log_date_time) <= moment(l_end_date).subtract(2,'hours')))
													  );		
  
  
  
												  }
												  
											  }
											  else{
												  
												  
												  filter_fhalf_items=random_array.filter(obj => 
													  (obj.emp_id== item.emp_id && moment(obj.log_date_time).format('YYYY-MM-DD')==cal_attendance_date )
												  
												  );
												  
											  }
											  
										  }
										  filter_shalf_items=null;
										  
										  if(second_half_start && second_half_end)
										  {
											  let date_ampm;
											  let second_shit_index
											  if(filter_fhalf_items && filter_fhalf_items.length>0)
											  {
												  last_item=filter_fhalf_items[filter_fhalf_items.length-1];
												  second_shit_index = random_array.findIndex(p => p.emp_id==item.emp_id && moment(p.log_date_time) > moment(last_item.log_date_time));
												  if(second_shit_index!=-1 && second_shit_index!=undefined)
												  {
													  
													  date_ampm=moment(random_array[second_shit_index].log_date_time).format('A');
												  }
											  }
											  else{
												  date_ampm=moment(subItem.log_dateTime[0]).format('A');
											  }
												  
												  if(shift2_start>shift2_end)
												  {
													  if(filter_fhalf_items && filter_fhalf_items.length>0)
													  {
														  prev_startDate=moment(second_half_start);
														  end_linit=moment(first_half_start).add(1,"days");
													  }
													  else{
  
														  if(date_ampm=='AM')
														  {
															  
															  cal_attendance_date=moment(subItem.attendance_date).subtract(1,"days");
															  prev_startDate=moment(second_half_start).subtract(1,"days");
														  }
														  else{
															  prev_startDate=moment(first_half_end);
														  }
														  if(moment(end_linit).format('YYYY-MM-DD')>moment(x).format("YYYY-MM-DD"))
														  {
															  
															  end_linit=moment(end_linit).subtract(1,"days");
  
														  }
														  
													  }
												  }	
												  else{
													  
													  if(shift1_start>shift1_end)
													  {
														  if(filter_fhalf_items && filter_fhalf_items.length>0)
														  {
															  prev_startDate=moment(second_half_start).add(1,"days");
  
														  }
														  else{
															  prev_startDate=moment(second_half_start).subtract(1,"days");
  
														  }
														  
														  
  
													  }
													  else{
														  
														  prev_startDate=moment(second_half_start);
													  }
													  
												  }
												  filter_shalf_items=random_array.filter(obj => 
													  (obj.emp_id== item.emp_id &&  (moment(obj.log_date_time)>=moment(prev_startDate).subtract(2,"hours") && moment(obj.log_date_time) <= moment(end_linit).subtract(2,"hours")))
  
												  );
												  
										  //}
										  }
									  
											  grace_period_rule = null;
											  grace_period_rule_2 = null;
											  log_array_1=filter_fhalf_items;
											  log_array_2=filter_shalf_items;
											  last_delete_date=null;
											  if(filter_fhalf_items && filter_fhalf_items.length>0)
											  {
											  for(citem=0;citem<filter_fhalf_items.length;citem++){
												  var logdata_index = random_array.findIndex(function(p) {
													  return (p.emp_id==item.emp_id && moment(p.log_date_time).format('YYYY-MM-DD HH:mm:ss')==filter_fhalf_items[citem].log_date_time)
												   });
												   last_delete_date=(random_array[logdata_index].log_date_time);
												   random_array.splice(logdata_index, 1);		
											  }
											 }
											 if(filter_shalf_items)
											 {
												   for(citem=0;citem<filter_shalf_items.length;citem++){
													  
													  var logdata_index = random_array.findIndex(function(p) {
														  return (p.emp_id==item.emp_id && moment(p.log_date_time).format('YYYY-MM-DD HH:mm:ss')==filter_shalf_items[citem].log_date_time)
													   });
													   last_delete_date=(random_array[logdata_index].log_date_time);
  
													   random_array.splice(logdata_index, 1);
												  }
											 }
											 if(last_delete_date)
											 {
											 var delete_date_index = item.details.findIndex(function(p) {
														  return (p.attendance_date==moment(last_delete_date).format("YYYY-MM-DD"))
													   });
											 if(delete_date_index && delete_date_index!=-1)
											 {
											  last_del_item=item.details[delete_date_index].log_dateTime.findIndex(e=>moment(e).format('YYYY-MM-DD HH:mm:ss')==last_delete_date);
											  if(last_del_item && last_del_item!=-1)
											  {
												  for(ccnt=0;ccnt<=last_del_item;ccnt++)
												  {
													  delete item.details[delete_date_index].log_dateTime[ccnt];
												  }
												  //item.details[delete_date_index].log_dateTime.length=0;
												  
											  }
  
											 }			 
															  
													  
											 }
											 let range_1
											 let range_2
											 if(shift1_start>shift2_start && shift2_start)
											 {
											  range_1=moment(second_half_end).subtract(1,"days");
											  range_2=moment(first_half_start).add(1,"days");
											  next_day_shifts=random_array.filter(obj => 
												  (obj.emp_id== item.emp_id &&  moment(obj.log_date_time)>=moment(range_1).subtract(2,'hours') && moment(obj.log_date_time)<=moment(range_2).subtract(2,'hours'))
												 );
											 }
											 else if(shift2_start && shift2_start>shift1_start)
											 {
											  range_1=moment(first_half_end).subtract(1,"days");
											  range_2=moment(first_half_start).add(1,"days");
											  next_day_shifts=random_array.filter(obj => 
												  (obj.emp_id== item.emp_id &&  moment(obj.log_date_time)>=moment(range_1).subtract(2,'hours') && moment(obj.log_date_time)<=moment(range_2).subtract(2,'hours'))
												 );
											 }
											 details={};
											  let start_1=first_half_start;
											  let end_1=first_half_end;
											  if(shift1_start>shift2_end)
											  {
												  end_1=moment(end_1).add(1,"days");
											  }
											  reporting_time =start_1;
											  total_break_time = 0;
											  totalWorkingHour=0;
											  hours = parseInt(Math.abs(end_1.diff(start_1, 'hours')));
											  minutes = parseInt(Math.abs(moment(end_1).diff(moment(start_1), 'minutes')) % 60)
											  totalWorkingHour = (hours + (minutes / 100));
											  if(second_half_start && second_half_end)
											  {
												  start_1=second_half_start;
												  end_1=second_half_end;
												  if(shift2_start>shift2_end)
												  {
													  end_1=moment(end_1).add(1,"days");
												  }
												  hours = parseInt(Math.abs(end_1.diff(start_1, 'hours')));
												  minutes = parseInt(Math.abs(moment(end_1).diff(moment(start_1), 'minutes')) % 60)
												  totalWorkingHour+= (hours + (minutes / 100));
												  reporting_time_2 = moment(second_half_start);
											  }
											  if(log_array_1)
											  {
											  log_array_1.reduce(async (c, newItem, index) => {
												  if (index % 2 != 0) {
													  let break_duration = 0;
													  next_log_in_time = log_array_1[index + 1];
													  if (next_log_in_time) {
														  startTime_new_1 = moment(newItem.log_date_time);
														  endTime_new_1 = moment(next_log_in_time.log_date_time);
														  hours_new_1 = parseInt(Math.abs(endTime_new_1.diff(startTime_new_1, 'hours')));
														  minutes_new_1 = parseInt(Math.abs(moment(endTime_new_1).diff(moment(startTime_new_1), 'minutes')) % 60);
														  break_duration = hours_new_1 + (minutes_new_1 / 100);
													  } else {
														  let break_duration = 0;
													  }
													  total_break_time += break_duration;
												  }
											  }, Promise.resolve());
											  }
											  
											  if(log_array_2)
											  {
												  log_array_2.reduce(async (c, newItem, index) => {
													  if (index % 2 != 0) {
  
														  let break_duration = 0;
														  next_log_in_time = log_array_2[index + 1];
														  if (next_log_in_time) {
															  startTime_new_1 = moment(newItem.log_date_time);
															  endTime_new_1 = moment(next_log_in_time.log_date_time);
															  hours_new_1 = parseInt(Math.abs(endTime_new_1.diff(startTime_new_1, 'hours')));
															  minutes_new_1 = parseInt(Math.abs(moment(endTime_new_1).diff(moment(startTime_new_1), 'minutes')) % 60)
															  break_duration = hours_new_1 + (minutes_new_1 / 100);
  
  
														  } else {
															  let break_duration = 0;
														  }
														  total_break_time += break_duration;
													  }
												  }, Promise.resolve());
											  }
  
  
										  }	
										  else{
											  is_shift_data=false;
											  
										  }
  
									  }
									  if (startTime && endTime && ((log_array_1 && log_array_1.length>0) || (log_array_2 && log_array_2.length>0))) {
										  totalHour_2 = 0;
										  totalHour=0;
										  if(!is_shift_data)
										  {
											  
											  if(log_array_1)
											  {
											  log_array_1.reduce(async (c, newItem, index) => {
												  if (index % 2 != 0) {
													  let break_duration = 0;
													  next_log_in_time = log_array_1[index + 1];
													  if (next_log_in_time) {
														  startTime_new_1 = moment(newItem.log_date_time);
														  endTime_new_1 = moment(next_log_in_time.log_date_time);
														  hours_new_1 = parseInt(Math.abs(endTime_new_1.diff(startTime_new_1, 'hours')));
														  minutes_new_1 = parseInt(Math.abs(moment(endTime_new_1).diff(moment(startTime_new_1), 'minutes')) % 60);
														  break_duration = hours_new_1 + (minutes_new_1 / 100);
													  } else {
														  let break_duration = 0;
													  }
													  total_break_time += break_duration;
												  }
											  }, Promise.resolve());
											  }
										  }
										  if(log_array_1 && log_array_1.length>0)
										  {
										  var startTime_1 = moment(log_array_1[0].log_date_time);
  
										  var endTime_1 =moment(log_array_1[log_array_1.length - 1].log_date_time);
										  
										  hours = parseInt(endTime_1.diff(startTime_1, 'hours'));
  
										  minutes = parseInt(moment(endTime_1).diff(moment(startTime_1), 'minutes') % 60)
  
										  totalHour = hours + (minutes / 100);
  
										  }	
										  if (log_array_2 && log_array_2.length>0) {
											  var startTime_1_2 = moment(log_array_2[0].log_date_time);
  
											  var endTime_1_2 =moment(log_array_2[log_array_2.length - 1].log_date_time);
  
											  hours_2 = parseInt(endTime_1_2.diff(startTime_1_2, 'hours'));
  
											  minutes_2 = parseInt(moment(endTime_1_2).diff(moment(startTime_1_2), 'minutes') % 60)
  
											  totalHour_2 = hours_2 + (minutes_2 / 100);
										  }
										  totalHour = totalHour + totalHour_2;
										  total_logged_in = (totalHour - total_break_time);
  
										  if (total_logged_in > 0) {
											  
											  var dateValue;
											  if (reporting_time) {
												  let reporting_h;
												  let reporting_m;
												  let reporting_s;
												  if(is_shift_data)
												  {
													  reporting_h=reporting_time.format("HH");
													  reporting_m=reporting_time.format("mm");
													  reporting_s=reporting_time.format("ss");
  
  
												  }
												  else{
													  reporting_h=reporting_time_arr[0];
													  reporting_m=reporting_time_arr[1];
													  reporting_s=reporting_time_arr[2];
  
  
												  }
												  dateValue = moment({
													  year: moment(cal_attendance_date).format('YYYY'),
													  month: moment(cal_attendance_date).format('MM')-1,
													  day: moment(cal_attendance_date).format('DD'),
													  Hour: reporting_h,
													  Minute: reporting_m,
													  Second:  reporting_s
												  });
												  let grace_period;
  
												  grace_period = grace_period_rule != null ? grace_period_rule : 0;
  
												  office_time = moment(dateValue).add(grace_period, 'minutes');
  
												  let attendance_stat;
  
												  let yy = parseInt(moment(cal_attendance_date).format('YYYY'));
  
												  let MM = parseInt(moment(cal_attendance_date).format('MM'));
  
												  let dd = parseInt(moment(cal_attendance_date).format('DD'));
  
												  let arrival_time=null;
  
  
												  if(log_array_1 && log_array_1.length>0)
												  {
													  arrival_time = moment({
														  year: yy,
														  month: (MM - 1),
														  date: dd,
														  hour: parseInt(moment(log_array_1[0].log_date_time).format('HH')),
														  minute: parseInt(moment(log_array_1[0].log_date_time).format('mm')),
														  second: parseInt(moment(log_array_1[0].log_date_time).format('ss'))
													  })	
												  }
	  
												  if (total_logged_in > 0) {
  
													  attendance_stat = "P";
													  if (week_off_days.includes(moment(cal_attendance_date).format('YYYY-MM-DD'))) {
														  attendance_stat = "WO"
													  }
													  if (arrival_time !=null && (arrival_time > office_time)) {
														  attendance_stat = "L";
													  }
												  }
  
												  let day_name = moment(arrival_time).format("dddd");
												  let shift1_start_time = "";
												  let shift1_end_time = "";
												  let shift2_start_time = "";
												  let shift2_end_time = "";
												  if (is_shift_data) {
													  if(log_array_1 && log_array_1.length>0)
													  {
														  shift1_start_time = moment(log_array_1[0].log_date_time).format('HH:mm:ss');
														  shift1_end_time = moment(log_array_1[log_array_1.length - 1].log_date_time).format('HH:mm:ss');
													  }
													  if (log_array_2 && log_array_2.length>0) {
  
														  shift2_start_time = moment(log_array_2[0].log_date_time).format('HH:mm:ss');
														  shift2_end_time = moment(log_array_2[log_array_2.length - 1].log_date_time).format('HH:mm:ss');
													  }
												  
  
												  }
  
												  let tmp_obj = {
													  emp_id: item.emp_id,
													  attendance_month: (moment(cal_attendance_date).format('MM') - 1),
													  attendance_year: moment(subItem.cal_attendance_date).format('YYYY'),
													  corporate_id: corporate_id,
													  login_by: 'csv',
													  login_time: !is_shift_data?moment(subItem.log_dateTime[0]).format('HH:mm:ss'):'',
													  logout_time: !is_shift_data?moment(subItem.log_dateTime[subItem.logs.length - 1]).format("HH:mm:ss"):'',
													  attendance_date: moment(cal_attendance_date).format('YYYY-MM-DD'),
													  total_logged_in: total_logged_in.toFixed(2),
													  total_break_time: total_break_time.toFixed(2),
													  attendance_stat: attendance_stat,
													  created_at: new Date(),
													  status: 'active',
													  shift1_start_time: shift1_start_time,
													  shift1_end_time: shift1_end_time,
													  shift2_start_time: shift2_start_time,
													  shift2_end_time: shift2_end_time,
													  shift_id:is_shift_data?shift_details._id:null,
													  logs:subItem.logs
												  }
  
												  //  let tmp_obj={
												  //     attendance_date:item.attendance_date,emp_id:item.emp_id,attendance_month:moment(item.attendance_date).format('MM'),
												  //     attendance_year:moment(item.attendance_date).format('YYYY'),corporate_id:'ivn123',login_by:'csv',
												  //     login_time:subItem.logs[0],logout_time:subItem.logs[subItem.logs.length-1],
												  //     attendance_date:moment(subItem.attendance_date).format('YYYY-MM-DD'),
												  //     logs:subItem.logs,total_logged_in:total_logged_in.toFixed(2),total_break_time:total_break_time.toFixed(2),totalHour:totalHour,
												  //     attendance_stat:attendance_stat,arrival_time:moment(arrival_time).format('YYYY-MM-DD HH:mm:ss'),office_time:moment(office_time).format('YYYY-MM-DD HH:mm:ss')   
												  //  } 
												  submitted_data.push(tmp_obj);
											 if(next_day_shifts && next_day_shifts.length>0)
											 {
											   details['attendance_date']=subItem.attendance_date;
											   new_logs=[];
											   new_log_dateTime=[];
											   await next_day_shifts.reduce(async (next_i,nextItem) =>{
											   new_logs.push(moment(nextItem.log_date_time).format("HH:mm:ss"))
											   new_log_dateTime.push(moment(nextItem.log_date_time))	
											  //  random_array.push({emp_id: item.emp_id,
											  // 	log_date_time: moment(nextItem.log_date_time)});	
											   },Promise.resolve())
											   details['logs']=new_logs;
											   details['log_dateTime']=new_log_dateTime;
											   item.details.push(details);   
											  
											   
											  
											 }
											}
											}
										  }
									  }
  
								  }
								 
  
								  await holiday_lists.reduce(async (c, holidayData) => {
									  submitted_data.push({
										  attendance_date: holidayData.format('YYYY-MM-DD'),
										  emp_id: item.emp_id,
										  attendance_month: (moment(holidayData).format('MM') - 1),
										  attendance_year: moment(holidayData).format('YYYY'),
										  corporate_id: corporate_id,
										  attendance_stat: 'WO',
										  created_at: new Date(),
										  login_by: 'csv',
										  status: 'active'
  
  
									  })
								  }, Promise.resolve());
								  await year_holiday_lists.reduce(async (c, holidayData) => {
									  date_format = new Date(holidayData);
									  dd = parseInt(date_format.getDate());
									  mm = parseInt(date_format.getMonth());
									  yy = parseInt(date_format.getFullYear());
									  formatMoment = moment().set({
										  'year': yy,
										  'month': mm,
										  date: dd
									  });
									  submitted_data.push({
										  attendance_date: formatMoment.format('YYYY-MM-DD'),
										  emp_id: item.emp_id,
										  attendance_month: (formatMoment.format('MM') - 1),
										  attendance_year: formatMoment.format('YYYY'),
										  corporate_id: corporate_id,
										  attendance_stat: 'H',
										  created_at: new Date(),
										  login_by: 'csv',
										  status: 'active'
  
  
									  })
								  }, Promise.resolve());
  
							  }, Promise.resolve());
  
							  let bulkUpdate = submitted_data.map(data => ({
								  updateOne: {
									  filter: {
										  emp_id: data.emp_id,
										  attendance_date: data.attendance_date
									  },
									  update: {
										  $set: data
									  },
									  upsert: true
								  }
							  }));
							  await EmployeeAttendance.bulkWrite(bulkUpdate, async function (err, product) {
								  if (err) return resp.json({
									  status: 'error',
									  message: err.message
								  });
								  return resp.json({
									  status: 'success',
									  data: submitted_data
								  });
							  })
  
  
						  })
						  .on("error", function (error) {
							  return resp.json({
								  status: 'error',
								  message: error.message
							  });
  
						  });
  
  
				  });
			  }
		  });
	  } catch (e) {
		  return resp.status(200).json({
			  status: 'error',
			  message: e ? e.message : 'Something went wrong'
		  });
	  }	
	
  
  
	});
  };
  const uplod_attendance_VAS_222 = async (req, resp) => {
	return new Promise(async (resolve, reject) => {
		try {
			  const v = new Validator(req.body, {
				  attendance_year: 'required',
				  attendance_month: 'required'
  
			  });
			  const matched = await v.check();
			  if (!matched) {
				  return resp.status(200).send({
					  status: 'val_err',
					  message: "Validation error",
					  val_msg: v.errors
				  });
			  }
			  let categoryData;
			  let sheet_data_lists = [];
  
			  fs.readFile(req.files[0].path, async function (err, data) {
  
				  var imageName = req.files[0].originalname
  
				  /// If there's an error
				  if (!imageName) {
  
					  return resp.status(200).send({
						  status: 'val_err',
						  message: "File is missing"
					  });
  
  
				  } else {
  
  
					  var newPath = file_path + "/storage/company/attendance_funnel/" + imageName;
					  let i = 1;
					  let log_data = [];
					  let col=1;
					  await fs.writeFile(newPath, data, async function (err) {
						  /// let's see it
  
						  await fs.createReadStream(newPath)
							  .pipe(parse({
								  delimiter: ",",
								  from_line: 1
							  }))
							  .on("data", async function (row) {
								  
								  if(col==1)
								  {
									  
									  if(row[0]!='Employee Code' || row[8]!='InTime' || row[10]!=' OutTime' || row[12]!='Status' || row[14]!='Duration')
									  {
										  return resp.json({
											  status: 'error',
											  message: "Sorry Invalid File"
										  });
									  }
								  }
								  else{
									  log_date = moment(row[2], ["MM/DD/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD");
									  log_in_time = moment(row[8], ["HH:mm:ss", "HH:mm:ss"]).format("HH:mm:ss");
									  log_out_time = moment(row[10], ['HH:mm:ss', 'HH:mm:ss']).format('HH:mm:ss');
									  let emp_id = row[0];
  
									  log_data.push({
										  emp_id: emp_id,
										  login_time: log_in_time,
										  logout_time: log_out_time,
										  attendance_date: log_date,
										  total_logged_in: row[14],
										  status: row[12].trim()
									  });
								  }
								  col=col+1;
								  
  
  
							  }).on("end", async function () {
								  final_data = [];
								  submitted_data = [];
								  holiday_lists = [];
								  year_holiday_lists = [];
  
								  let corporate_id = "ivn123";
								  await SiteHelper.weeklyHolidays({
									  year: req.body.attendance_year,
									  month: req.body.attendance_month
								  }).then(resp => {
									  holiday_lists = (resp);
  
								  });
								  let week_off_days = [];
								  await holiday_lists.reduce(async (c, holidayData) => {
									  week_off_days.push(moment(holidayData).format('YYYY-MM-DD'));
								  }, Promise.resolve());
								  await SiteHelper.yearlyHolidays({
									  year: req.body.attendance_year,
									  month: req.body.attendance_month
								  }).then(resp => {
									  year_holiday_lists = resp;
  
								  })
								  await log_data.reduce(async (f, item) => {
  
									  emp_index = final_data.findIndex(p => p.emp_id === item.emp_id);
									  obj = { login_time: item.login_time, logout_time: item.logout_time, attendance_date: item.attendance_date, total_logged_in: item.total_logged_in, status: item.status };
  
									  if (emp_index == -1) {
										  final_data.push({ emp_id: item.emp_id, logs: [obj] });
									  }
									  else {
  
  
										  final_data[emp_index]['logs'].push(obj);
  
									  }
								  }, Promise.resolve());
								  
								  await final_data.reduce(async (fg, item) => {
									  reporting_time = null;
  
									  await SiteHelper.attendanceRule(item.emp_id, corporate_id).then(async (res) => {
										  rule_data = res;
										  if (rule_data) {
											  startTime = moment(rule_data.reporting_time, "HH:mm:ss");
											  endTime = moment(rule_data.closing_time, "HH:mm:ss");
											  reporting_time = rule_data.reporting_time;
											  grace_period_rule = rule_data.grace_period;
										  }
  
									  },
										  (err) => {
  
										  });
									  await item.logs.reduce(async (gh, subItem) => {
										  startTime = moment(subItem.login_time, "HH:mm:ss");;
										  endTime = moment(subItem.logout_time, "HH:mm:ss");;
										  grace_period_rule = null;
										  totalWorkingHour = 0;
										  if (startTime && endTime) {
											  minutes = parseInt(moment(endTime).diff(moment(startTime), 'minutes'))
										  }
										  if (reporting_time) {
											  total_break_time = minutes - subItem.total_logged_in;
											  reporting_time_split = reporting_time.split(':');
											  attendance_date_arr = subItem.attendance_date.split("-");
											  arrival_time_arr = subItem.login_time.split(":");
											  dateValue = moment({
												  year: attendance_date_arr[0],
  
												  month: attendance_date_arr[1],
  
												  day: attendance_date_arr[2],
  
												  Hour: reporting_time_split[0],
  
												  Minute: reporting_time_split[1],
  
												  Second: reporting_time_split[2]
											  });
  
											  // let grace_period;
											  grace_period = grace_period_rule != null ? grace_period_rule : 0;
											  enter_time = moment(dateValue).add(grace_period, 'minutes').format('HH:mm:ss');
											  enter_time_array = enter_time.split(":");
											  let office_time = moment({
												  'year': attendance_date_arr[0],
												  'month': (attendance_date_arr[1]),
												  date: attendance_date_arr[2],
												  hour: parseInt(enter_time_array[0]),
												  minute: parseInt(enter_time_array[1]),
												  second: parseInt(enter_time_array[2])
											  });
											  let arrival_time = moment({
												  'year': attendance_date_arr[0],
												  'month': (attendance_date_arr[1]),
												  date: attendance_date_arr[2],
												  hour: parseInt(arrival_time_arr[0]),
												  minute: parseInt(arrival_time_arr[1]),
												  second: parseInt(arrival_time_arr[2])
											  });
											  stat = subItem.status;
											  attendance_stat = "P";
  
  
											  if ((arrival_time > office_time)) {
												  attendance_stat = "L";
											  }
											  if (week_off_days.includes(subItem.attendance_date)) {
												  attendance_stat = "WO"
											  }
											  total_logged_in = (minutes / 60);
  
											  break_time = (total_break_time / 60)
  
											  if (total_logged_in > 0) {
												  let tmp_obj = {
													  emp_id: item.emp_id,
													  attendance_month: (attendance_date_arr[1] - 1),
													  attendance_year: attendance_date_arr[0],
													  corporate_id: corporate_id,
													  login_by: 'csv',
													  login_time: subItem.login_time,
													  logout_time: subItem.logout_time,
													  attendance_date: subItem.attendance_date,
													  total_logged_in: total_logged_in.toFixed(2),
													  total_break_time: break_time.toFixed(2),
													  attendance_stat: attendance_stat,
													  created_at: new Date(),
													  status: 'active',
  
												  }
												  submitted_data.push(tmp_obj);
  
											  }
  
										  }
									  }, Promise.resolve());
  
									  await holiday_lists.reduce(async (c, holidayData) => {
										  submitted_data.push({
											  attendance_date: holidayData.format('YYYY-MM-DD'),
											  emp_id: item.emp_id,
											  attendance_month: (moment(holidayData).format('MM') - 1),
											  attendance_year: moment(holidayData).format('YYYY'),
											  corporate_id: corporate_id,
											  attendance_stat: 'WO',
											  created_at: new Date(),
											  login_by: 'csv',
											  status: 'active'
  
  
										  })
									  }, Promise.resolve());
									  await year_holiday_lists.reduce(async (c, holidayData) => {
										  date_format = new Date(holidayData);
										  dd = parseInt(date_format.getDate());
										  mm = parseInt(date_format.getMonth());
										  yy = parseInt(date_format.getFullYear());
										  formatMoment = moment().set({
											  'year': yy,
											  'month': mm,
											  date: dd
										  });
										  submitted_data.push({
											  attendance_date: formatMoment.format('YYYY-MM-DD'),
											  emp_id: item.emp_id,
											  attendance_month: (formatMoment.format('MM') - 1),
											  attendance_year: formatMoment.format('YYYY'),
											  corporate_id: corporate_id,
											  attendance_stat: 'H',
											  created_at: new Date(),
											  login_by: 'csv',
											  status: 'active'
  
  
										  })
									  }, Promise.resolve());
  
								  }, Promise.resolve());
  
								  let bulkUpdate = submitted_data.map(data => ({
									  updateOne: {
										  filter: {
											  emp_id: data.emp_id,
											  attendance_date: data.attendance_date
										  },
										  update: {
											  $set: data
										  },
										  upsert: true
									  }
								  }));
  
								  EmployeeAttendance.bulkWrite(bulkUpdate, async function (err, product) {
									  if (err) return resp.json({
										  status: 'error',
										  message: err.message
									  });
									  return resp.json({
										  status: 'success',
										  data: submitted_data
									  });
								  })
  
  
							  })
							  .on("error", function (error) {
								  return resp.json({
									  status: 'error',
									  message: error.message
								  });
  
							  });
  
  
					  });
				  }
			  });
		  } catch (e) {
			  return resp.status(200).json({
				  status: 'error',
				  message: e ? e.message : 'Something went wrong'
			  });
		  }
	});
  
	// try {
	//   let categoryData;
	//   let sheet_data_lists = [];
  
	// } catch (e) {
	//   return resp.status(200).json({
	//     status: "error",
	//     message: e ? e.message : "Something went wrong",
	//   });
	// }
  };