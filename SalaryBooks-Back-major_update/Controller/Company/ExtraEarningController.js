var EaxtraEarning = require('../../Model/Company/ExtraEarning');
var ExtraEarningTemp = require('../../Model/Company/ExtraEarningTemp');
var Reimbursement = require('../../Model/Company/Reimbursement');
var ReimbursementTemp = require('../../Model/Company/ReimbursementTemp');
var EaxtraEarningHead = require('../../Model/Company/ExtraEarningHeads');
var EmployeeMonthlyReport=require('../../Model/Company/EmployeeMonthlyReport');
var Employee = require('../../Model/Company/employee');
const { Validator } = require('node-input-validator');
var crypto = require("crypto");
const mongoose = require('mongoose');
var Site_helper = require('../../Helpers/Site_helper');
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const bcrypt = require("bcrypt");
const archiver = require('archiver');
const {resolve} = require('path');
const EmailHelper = require('../../Helpers/EmailHelper');
const absolutePath = resolve('');
module.exports = {
    import_earning_data:async function(req, resp, next){
        try{
            var results=[];
            fs.createReadStream(req.files[0].path)
            .pipe(csv())
            .on('data', async function (row) {
              var parent_hods=[];
              await Staff.findOne({"_id":row["emp_hod"]},'parent_hods', async function (err, parent_hod) {
                if (!err) 
                {
                    if(parent_hod)
                    {
                      parent_hods=parent_hod.parent_hods;
                  }
                  parent_hods.push(row["emp_hod"]);
                  var dateObj = new Date(row["attendance_date"]);
                  //console.log(req.authData)
                  var new_arr={
                    corporate_id:req.authData.corporate_id,
                    created_by:req.authData.user_id,
                    emp_id:row["user_id"],
                    status:'active',
                    created_at: Date.now(),
                }
                await Employee.create(new_arr,  function (err, user_data) {
                    if (!err) 
                    {
                      //console.log(user_data,'aaaaaaa')
                      var emp_document={
                          employee_id:user_data._id,
                      };
                      EmployeeDetails.create(emp_document,  function (emp_err, employeedet) {
                          if (emp_err)
                          {
                            //console.log(emp_err)
                            return resp.status(200).send({ status: 'error', message: emp_err.message,user_data:user_data });
                            //return resp.status(200).send({ status: 'success',message:"Company created successfully", user_data: user_data });
                        }
                    })
                  }
              })
                  //console.log(results)
              }
              else{
                  //console.log(err,parent_hod,'asdasdasda')
              }
          });
          })
            .on('end', async function () {
                var failed_entry=[];
                return resp.status(200).send({ status: 'success',message:"Import successfully", failed_entry: results });
            });
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_extra_earning_emp: async function (req, resp, next) {
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
            page: req.body.pageno?req.body.pageno:1,
            limit: req.body.perpage?req.body.perpage:perpage,
            sort:    sortoption,
        };
        var filter_option={};
        var document={};
        var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
        var search_option_details= {$match: {}};
        if(req.body.searchkey)
        {
            search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
        }
        else
        {
            if(req.body.emp_name)
            {
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
            }
            if(req.body.emp_last_name)
            {
                search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
            }
            if(req.body.email_id)
            {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
            }
            if(req.body.emp_id)
            {
                search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
            }
            if(req.body.designation_id)
            {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
            }
            if(req.body.department_id)
            {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
            }
            if(req.body.branch_id)
            {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
            }
            if(req.body.client_code)
            {
                var client_codes=JSON.parse(req.body.client_code);
                search_option.$match.client_code={$in: client_codes};
            }
            if(req.body.hod_id)
            {
                var hod_ids=JSON.parse(req.body.hod_id);
                hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match.emp_hod={$in: hod_ids};
            }
        }
        var wage_month=req.body.wage_month?req.body.wage_month:"0";
        var wage_year=req.body.wage_year;
        var status = ['pending','active'];
        if(req.body.approval_status){
            if(req.body.approval_status == 'approved' || req.body.approval_status == 'active'){
                status = ['active'];
                // search_option_details.$match['extra_earnings._id'] = { $exists: true, $ne: null };
            }
            else{
                status = ['pending'];
            }                
        }
     
        if(req.body.monthly_reports_generate == 'yes'){
            search_option_details.$match['employee_monthly_reports._id'] =  { "$exists": true }; 
        }
        search_option_details.$match['extra_earnings._id'] = { $exists: true, $ne: null };
        var myAggregate = Employee.aggregate([
            search_option,

            {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
            }},
            
            {
                $lookup: {
                    from: "employee_monthly_reports",
                    "let": { "emp_id_var": "$_id"},
                    pipeline: [
                    {
                        $match: {
                            "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                            $and: [
                            {"extra_earning_report" :{ $exists: true, $ne: null }},
                            {'wage_month': {$eq: parseInt(wage_month) }},
                            {'wage_year': {$eq: parseInt(wage_year) }}
                            ],
                        },
                    },
                    ],
                    as: "employee_monthly_reports",
                },
            },
            {$lookup:{
              from: 'bank_instructions',
              localField: 'employee_monthly_reports.extra_earning_report.bank_ins_referance_id',
              foreignField: 'file_id',
              as: 'bank_instruction'
            }},
            {
                $lookup: {
                    from: "extra_earnings",
                    "let": { "emp_id_var": "$emp_id"},
                    pipeline: [
                    {
                        $match: {
                            "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] },
                            $and: [
                                {'status':{$in:status}},
                                {'wage_month': {$eq: wage_month.toString() }},
                                {'wage_year': {$eq: wage_year.toString() }},
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: "extra_earning_heads",
                            "let": { "head_id_var": "$head_id"},
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": { "$eq": ["$_id", "$$head_id_var"] },
                                        $and: [
                                            {'earning_status':{$eq:"earning"}},
                                        ],
                                    },
                                }
                            ],
                            as: "extra_earning_heads",
                        },
                    },
                    { $unwind : "$extra_earning_heads" }
                    ],
                    as: "extra_earnings",
                },
            },
            search_option_details,
            { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                },
                employee_monthly_reports: {
                    $arrayElemAt: ["$employee_monthly_reports", 0],
                },
                bank_instruction: {
                    $arrayElemAt: ["$bank_instruction", 0],
                }
            }
        },
        { 
            "$project": { 
                "_id":1,
                "corporate_id":1,
                "userid":1,
                "emp_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_dob":1,
                "pan_no":1,
                "aadhar_no":1,
                "email_id":1,
                "empid":1,
                "client_code":1,
                "approval_status":1,
                "employee_details.employment_hr_details":1,
                "employee_details.annual_earnings":1,
                "extra_earnings":1,
                "employee_monthly_reports.extra_earning_report":1,
                "bank_instruction":1,
                "wage_month":wage_month ? wage_month :  new Date().getMonth(),
                "wage_year":wage_year ? wage_year : new Date().getFullYear(),
            }
        },
        ]);
        Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
            if (err) return resp.json({ status: "error", message: err.message });
            if(employees.docs){
                if(employees.docs.length > 0){
                    await Promise.all(employees.docs.map(async function(value,key) {
                        var total = 0;
                        if(value.extra_earnings.length > 0){
                            await Promise.all(value.extra_earnings.map(async function(extra_earning){
                                var existEarningHead = await EaxtraEarningHead.findOne({'_id':mongoose.Types.ObjectId(extra_earning.head_id), 'earning_status':{$eq: "earning"}});
                                if(extra_earning.status == 'active' && existEarningHead){
                                    total += parseFloat(extra_earning.amount);
                                }
                            }));
                        }
                        value.total_amount = total;
                    }));
                }
            }
            return resp.status(200).json({ status: "success", employees: employees });
        });
    },
    add_extra_earning: async function (req, resp) {
        const v = new Validator(req.body, {
            emp_id: 'required',
            head_id:'required',
            amount:'required',
            wage_month:'required',
            wage_year:'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document =
            {
                corporate_id:req.authData.corporate_id,
                emp_id:req.body.emp_id,
                head_id:mongoose.Types.ObjectId(req.body.head_id),
                amount:req.body.amount,
                wage_month:req.body.wage_month,
                wage_year:req.body.wage_year,
                company_remark: req.body.remark,
                status:'active',
                created_at: Date.now()
            }
            var obj = req.files;
            if(obj){
                await Promise.all(
                    obj.map(async (file) => {
                        var file_data = {
                            corporate_id: employeeData.corporate_id,
                            emp_db_id: employeeData._id,
                            file_name: file.originalname,
                            file_type: file.mimetype,
                            file_size: file.size,
                            file_path: file.path ? file.path : "NA",
                            status: "active",
                            created_at: Date.now(),
                        };
                        if (file.fieldname === "extra_earnings_document") {
                            file_data["folder_name"] = "Extra Earning File Image";
                            file_data["upload_for"] = "extra_earnings_file_image";
                            document["document"] = file.path;
                        }
                        var fileuploaddata = await Site_helper.upload_file_manager(file_data);
                    })
                    );
            }
            EaxtraEarning.create(document,  function (err, extra_earning) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Extra Earning  created successfully", extra_earning: extra_earning});
            })
        }
    },
    update_extra_earning_data: async function (req, resp, next) {
        const v = new Validator(req.body, {
            earning_id: 'required',
            // head_id:'required',
            // amount:'required',
            // wage_month:'required',
            // wage_year:'required',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            // var earning_data = JSON.parse(req.body.earning_data);
            //console.log(earning_data)
            if(req.body.earning_id){
                if(req.body.earning_id.length > 0){
                    await Promise.all(req.body.earning_id.map(async function(earningdata, index) {
                        var extraEarning = await EaxtraEarning.findOne({"_id":mongoose.Types.ObjectId(req.body.earning_id[index])});
                        if(extraEarning){
                            var employeeData = await Employee.findOne({"emp_id":extraEarning.emp_id});
                            var document =
                            {
                                head_id:mongoose.Types.ObjectId(req.body.head_id[index]),
                                amount:req.body.amount[index],
                                wage_month:req.body.wage_month[index],
                                wage_year:req.body.wage_year[index],
                                updated_at: Date.now()
                            }

                            var file = req.files[index];
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
                                if (file.fieldname === "extra_earnings_document[]") {
                                    file_data["folder_name"] = "Extra Earning File Image";
                                    file_data["upload_for"] = "extra_earnings_file_image";
                                    document["document"] = file.path;
                                }
                                var fileuploaddata = await Site_helper.upload_file_manager(file_data);   
                            }
                            EaxtraEarning.updateOne({'_id': extraEarning._id},{$set: document},   function (err, earning_det) {
                                return earning_det;
                            });
                        }
                    }));
                }
            }
            return resp.status(200).send({ status: 'success', message:"Extra earning has been updated successfully" });
            // var document =
            // {
            //     head_id:req.body.head_id,
            //     amount:req.body.amount,
            //     wage_month:req.body.wage_month,
            //     wage_year:req.body.wage_year,
            //     updated_at: Date.now()
            // }
            // EaxtraEarning.updateOne({'_id':req.body.earning_id},document,  function (err, extra_earning) {
            //     if (err) 
            //     {
            //         return resp.status(200).send({ status: 'error', message: err.message });
            //     }
            //     else
            //     {
            //         resp.status(200).send({ status: 'success', message:"extra earning has been updated successfully", extra_earning: extra_earning });
            //     }
            // });
        }
    },
    add_extra_earning_head: async function (req, resp) {
        const v = new Validator(req.body, {
            head_name: 'required',
            abbreviation: 'required',
            earning_status: 'required|in:earning,deduction,provision,reimbursement',
            // head_include_in: 'required'
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {
                corporate_id:req.authData.corporate_id,
                head_name:req.body.head_name,
                abbreviation:req.body.abbreviation,
                earning_status:req.body.earning_status,
                head_include_in:req.body.head_include_in,
                status:'active', 
                created_at: Date.now()
            };
            EaxtraEarningHead.create(document,  function (err, extra_earning_head) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Extra Earning head created successfully", extra_earning_head: extra_earning_head });
            })
        }
    },
    get_extra_earning_head: async function (req, resp, next) {
        try{
            await EaxtraEarningHead.find({  status:'active' ,"corporate_id":req.authData.corporate_id, "earning_status":{$in:['earning','deduction','reimbursement']} },'_id head_name abbreviation earning_status',  function (err, temp_head) {
                if (!err) 
                {
                    return resp.status(200).send({ status: 'success', message:"", temp_head: temp_head});
                }
            })
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    approve_extra_earning: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                // earning_id:'required',
                // status:'required|in:approved,rejected',
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
                    page: req.body.pageno?req.body.pageno:1,
                    limit: req.body.perpage?req.body.perpage:perpage,
                    sort:    sortoption,
                };
                var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id} , {"status":"pending"}]}};
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
                var wage_month=req.body.wage_month;
                var wage_year=req.body.wage_year;
                if(wage_month){
                    wage_month = wage_month.toString();
                }
                else{
                    wage_month = "0";
                }
                if(wage_year){
                    wage_year = wage_year.toString();
                }
                var filter_option={};
                var document={};
                if(wage_month && wage_year){
                    search_option.$match.$and =[
                            {'corporate_id':req.authData.corporate_id},
                            {"wage_month": {$eq:wage_month}},
                            {"wage_year": {$eq:wage_year}},
                            {"status": {$eq:"pending"}},
                            ];
                }
                var search_option_details= {$match: {}};
                if (req.body.searchkey) {
                    search_option_details = {
                        $match:{
                            "employees.emp_id" : { $eq: req.body.searchkey },
                            "employees.corporate_id": req.authData.corporate_id,
                            "employees.parent_hods": { $in: [req.authId] },
                        }
                    };
                } else {
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
                    if (req.body.client_id) {
                      var client_ids = JSON.parse(req.body.client_id);
                      client_ids = client_ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                      });
                      search_option_details.$match[
                        "client._id"
                      ] = { $in: client_ids };
                    }
                    if (req.body.hod_id) {
                      var hod_ids = JSON.parse(req.body.hod_id);
                      hod_ids = hod_ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                      });
                       search_option_details.$match[
                        "employees.emp_hod"
                      ] = { $in: hod_ids };
                    }
                }
                if(req.body.type == "reimbursement"){
                    var myAggregate = ReimbursementTemp.aggregate([search_option,
                        {
                            $lookup: {
                                from: "companies",
                                localField: "corporate_id",
                                foreignField: "corporate_id",
                                as: "companies",
                            },
                        },
                        {
                            $lookup: {
                                from: "employees",
                                localField: "emp_id",
                                foreignField: "emp_id",
                                as: "employees",
                            },
                        },
                        {
                            $lookup: {
                                from: "employee_details",
                                localField: "employees._id",
                                foreignField: "employee_id",
                                as: "employee_details",
                            },
                        },
                        {
                          $lookup: {
                            from: "clients",
                            localField: "employees.client_code",
                            foreignField: "_id",
                            as: "client",
                          },
                        },
                        {
                          $lookup: {
                            from: "staffs",
                            localField: "employees.emp_hod",
                            foreignField: "_id",
                            as: "hod",
                          },
                        },
                        search_option_details,
                        {
                          $addFields: {
                            company: {
                              $arrayElemAt: ["$companies", 0],
                            },
                            employee: {
                              $arrayElemAt: ["$employees", 0],
                            },
                            hod: {
                              $arrayElemAt: ["$hod", 0],
                            },
                            employee_details: {
                              $arrayElemAt: ["$employee_details", 0],
                            },
                            client: {
                              $arrayElemAt: ["$client", 0],
                            },
                          },
                        },
                        {
                            "$project": 
                            { 
                                _id:1,
                                corporate_id:1,
                                emp_id:1,
                                head_id:1,
                                amount:1,
                                wage_month:1,
                                wage_year:1,
                                document:1,
                                status:1,
                                created_at:1,
                                employee_remark:1,
                                company_remark:1,
                                employee:1,
                                company:1,
                                "employees._id":1,
                                "employees.corporate_id":1,
                                "employees.userid":1,
                                "employees.emp_id":1,
                                "employees.emp_first_name":1,
                                "employees.emp_last_name":1,
                                "employees.emp_dob":1,
                                "employees.pan_no":1,
                                "employees.aadhar_no":1,
                                "employees.email_id":1,
                                "employees.empid":1,
                                "employees.client_code":1,
                                "employees.client_id":1,
                                "employees.is_hod":1,
                                "employees.emp_hod":1,
                                "employees.approval_status":1,
                                // extra_earning_head:1
                                "hod.first_name": 1,
                                "hod.last_name": 1,
                                "client._id": 1,
                                "client.client_code": 1,
                                "employee_details._id": 1,
                                "employee_details.contract": 1,
                                "employee_details.employment_hr_details": 1,
                                "branch._id": 1,
                                "branch.branch_name": 1,
                                "department._id": 1,
                                "department.department_name": 1,
                                "designation._id": 1,
                                "designation.designation_name": 1,
                            }
                        },
                    ]).then(async (extraearning) => {
                        var responseArray = await Promise.all(
                            extraearning.map(async function (earning) {
                                if(earning){
                                    var status = "active";
                                    if(req.body.status)
                                    {
                                        if(req.body.status == 'approved'){
                                            status = "active";
                                        }
                                        else{
                                            status = "rejected";
                                        }
                                    }
                                    var document = {
                                        "company_remark":req.body.remark,
                                        'status': status
                                    };
                                    let extraEaringTemp = await ReimbursementTemp.findByIdAndUpdate({_id:earning._id},{ $set: document } ,{new: true}, async function (err, extra_earning) {
                                        if(earning.employee && earning.employee.email_id){
                                            EmailHelper.employee_request_approval(null,earning.employee.email_id,null,{
                                                first_name:earning.employee.emp_first_name,
                                                last_name:earning.employee.emp_last_name,
                                                approved_by:req.authData.first_name + ' ' + req.authData.last_name,
                                                request_type:"Reimbursement",
                                                request_status:status == 'active' ? 'Approved': status,
                                                company_name:earning?.company?.establishment_name
                                            })
                                        }
                                        return extra_earning;
                                    });
                                    if(extraEaringTemp && status == 'active'){
                                        var apDocument = {
                                            'corporate_id' : extraEaringTemp.corporate_id,
                                            'wage_month' : extraEaringTemp.wage_month,
                                            'wage_year' : extraEaringTemp.wage_year,
                                            'emp_id' : extraEaringTemp.emp_id,
                                            'head_id' : extraEaringTemp.head_id,
                                            'amount' : extraEaringTemp.amount,
                                            'employee_remark' : extraEaringTemp.employee_remark,
                                            'status' : extraEaringTemp.status,
                                            'company_remark' : extraEaringTemp.company_remark, 
                                            'created_at' : new Date,
                                            'updated_at' : new Date
                                        };
                                        await Reimbursement.create(apDocument);
                                    }
                                }
                            })
                            );
                    });
                    return resp.status(200).send({ status: 'success', message:"Reimbursement status has been updated successfully" });
                }
                else{
                    var myAggregate = ExtraEarningTemp.aggregate([search_option,
                        {
                            $lookup: {
                                from: "companies",
                                localField: "corporate_id",
                                foreignField: "corporate_id",
                                as: "companies",
                            },
                        },
                        {
                            $lookup: {
                                from: "employees",
                                localField: "emp_id",
                                foreignField: "emp_id",
                                as: "employees",
                            },
                        },
                        {
                            $lookup: {
                                from: "employee_details",
                                localField: "employees._id",
                                foreignField: "employee_id",
                                as: "employee_details",
                            },
                        },
                        {
                          $lookup: {
                            from: "clients",
                            localField: "employees.client_code",
                            foreignField: "_id",
                            as: "client",
                          },
                        },
                        {
                          $lookup: {
                            from: "staffs",
                            localField: "employees.emp_hod",
                            foreignField: "_id",
                            as: "hod",
                          },
                        },
                        search_option_details,
                        {
                          $addFields: {
                            employee: {
                                $arrayElemAt: ["$employees", 0],
                              },
                            company: {
                                $arrayElemAt: ["$companies", 0],
                              },
                            hod: {
                              $arrayElemAt: ["$hod", 0],
                            },
                            employee_details: {
                              $arrayElemAt: ["$employee_details", 0],
                            },
                            client: {
                              $arrayElemAt: ["$client", 0],
                            },
                          },
                        },
                        {
                            "$project": 
                            { 
                                _id:1,
                                corporate_id:1,
                                emp_id:1,
                                head_id:1,
                                amount:1,
                                wage_month:1,
                                wage_year:1,
                                document:1,
                                status:1,
                                created_at:1,
                                employee_remark:1,
                                company_remark:1,
                                company:1,
                                employee:1,
                                "employees._id":1,
                                "employees.corporate_id":1,
                                "employees.userid":1,
                                "employees.emp_id":1,
                                "employees.emp_first_name":1,
                                "employees.emp_last_name":1,
                                "employees.emp_dob":1,
                                "employees.pan_no":1,
                                "employees.aadhar_no":1,
                                "employees.email_id":1,
                                "employees.empid":1,
                                "employees.client_code":1,
                                "employees.client_id":1,
                                "employees.is_hod":1,
                                "employees.emp_hod":1,
                                "employees.approval_status":1,
                                extra_earning_head:1,
                                // "employee_details":1,
                                "hod.first_name": 1,
                                "hod.last_name": 1,
                                "client._id": 1,
                                "client.client_code": 1,
                                "employee_details._id": 1,
                                "employee_details.contract": 1,
                                "employee_details.employment_hr_details": 1,
                                "branch._id": 1,
                                "branch.branch_name": 1,
                                "department._id": 1,
                                "department.department_name": 1,
                                "designation._id": 1,
                                "designation.designation_name": 1,
                            }
                        },
                    ]).then(async (extraearning) => {
                        var responseArray = await Promise.all(
                            extraearning.map(async function (earning) {
                                if(earning){
                                    var status = "active";
                                    if(req.body.status)
                                    {
                                        if(req.body.status == 'approved'){
                                            status = "active";
                                        }
                                        else{
                                            status = "rejected";
                                        }
                                    }
                                    var document = {
                                        "company_remark":req.body.remark,
                                        'status': status
                                    };
                                    let extraEaringTemp = await ExtraEarningTemp.findByIdAndUpdate({_id:earning._id},{ $set: document } ,{new: true}, async function (err, extra_earning) {
                                        if(earning.employee && earning.employee.email_id){
                                            EmailHelper.employee_request_approval(null,earning.employee.email_id,null,{
                                                first_name:earning.employee.emp_first_name,
                                                last_name:earning.employee.emp_last_name,
                                                approved_by:req.authData.first_name + ' ' + req.authData.last_name,
                                                request_type:"Extra Earning",
                                                request_status:status == 'active' ? 'Approved': status,
                                                company_name:earning?.company?.establishment_name
                                            })
                                        }
                                        return extra_earning;
                                    });
                                    if(extraEaringTemp && status == 'active'){
                                        var apDocument = {
                                            'corporate_id' : extraEaringTemp.corporate_id,
                                            'wage_month' : extraEaringTemp.wage_month,
                                            'wage_year' : extraEaringTemp.wage_year,
                                            'emp_id' : extraEaringTemp.emp_id,
                                            'head_id' : extraEaringTemp.head_id,
                                            'amount' : extraEaringTemp.amount,
                                            'employee_remark' : extraEaringTemp.employee_remark,
                                            'status' : extraEaringTemp.status,
                                            'company_remark' : extraEaringTemp.company_remark, 
                                            'created_at' : new Date,
                                            'updated_at' : new Date
                                        };
                                        await EaxtraEarning.create(apDocument);
                                    }
                                }
                            })
                            );
                    });
                    return resp.status(200).send({ status: 'success', message:"Extra earning status has been updated successfully" });
                }
            }
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    export_earning_sample_xlsx_file: async function (req, resp, next) {
        var wb = new xl.Workbook();
        var ws = wb.addWorksheet("Sheet 1");
        var ws2 = wb.addWorksheet("employee");
        ws.cell(1, 1).string("emp_id");
        ws.cell(1, 2).string("head_id");
        ws.cell(1, 3).string("amount");

        var masters = {
            exrning_temp_head: []
        };


        await Employee.find({  status:'active',"corporate_id":req.authData.corporate_id,'approval_status':'approved' },'_id emp_first_name emp_last_name emp_id',  function (err, employees) {
            if (!err) 
            {
                var row_id=1
                employees.map(function(el) {
                    var emp_name= el.emp_first_name +" " + el.emp_last_name + " [" + el._id + "]"
                    ws2.cell(row_id++, 1).string(emp_name.toString());
                })
                ws.addDataValidation({
                    type: "list",
                    allowBlank: false,
                    prompt: "Choose Employee",
                    error: "Invalid choice was chosen",
                    showDropDown: true,
                    sqref: "A2:A2",
                    formulas: ['=employee!$A$2:$A$'+employees.length],
                });
            }
        })

        await EaxtraEarningHead.find({ 
            status: "active", corporate_id: req.authData.corporate_id },
            "_id head_name",
            function (err, exrning_temp_head) {
                if (!err) {
                    masters.exrning_temp_head = exrning_temp_head;
                }
            });
        var exrning_temp_head = masters.exrning_temp_head;
        exrning_temp_head = exrning_temp_head.map(function (el) {
            return el.head_name + "  [" + el._id + "]";
        });
        exrning_temp_head = [exrning_temp_head.toString()];
        ws.addDataValidation({
            type: "list",
            allowBlank: false,
            prompt: "Choose Extra Earning Head",
            error: "Invalid choice was chosen",
            showDropDown: true,
            sqref: "B2:B2",
            formulas: exrning_temp_head,
        });
        // wb.write("extra-earning-sample.xlsx");
        // let file_location = Site_helper.createFiles(wb,"extra-earning-sample",'xlsx', req.authData.corporate_id)
        
        let file_name = "extra-earning-sample.xlsx";
        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
        let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/exta-earning-module');
        await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
        // await Site_helper.downloadAndDelete(file_name,file_path,req.authData.corporate_id,resp);
        
        // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
    },

    import_extra_earning_data:async function  (req,resp,next){
        try{
            if(req.body.wage_month){
                var wage_month = req.body.wage_month;
            }
            else{
                var wage_month = new Date().getMonth();
            }
            if(req.body.wage_year){
                var wage_year = req.body.wage_year;
            }
            else{
                var wage_year = new Date().getFullYear();
            }
            var results=[];
            fs.createReadStream(req.files[0].path)
            .pipe(csv())
            .on('data', async function (row) {
                var document = {
                    corporate_id:req.authData.corporate_id,
                    emp_id:mongoose.Types.ObjectId(row["emp_id"]),
                    head_id:mongoose.Types.ObjectId(row["head_id"]),
                    amount:row["amount"],
                    wage_month:wage_month,
                    wage_year:wage_year,
                    status:"active",
                    created_at: Date.now()
                };
                await EaxtraEarning.create(document);
            })
            .on('end', async function () {
                var failed_entry=[];
                return resp.status(200).send({ status: 'success',message:"Import successfully",});
            });
        }
        catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_extra_earning_emp_pending: async function (req, resp, next) {
        try{
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
                page: req.body.pageno?req.body.pageno:1,
                limit: req.body.perpage?req.body.perpage:perpage,
                sort:    sortoption,
            };
            var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            if(wage_month){
                wage_month = wage_month.toString();
            }
            else{
                wage_month = "0";
            }
            if(wage_year){
                wage_year = wage_year.toString();
            }
            var filter_option={};
            var document={};
            if(wage_month && wage_year){
                var search_option= {
                    $match:{
                        $and:[
                        {'corporate_id':req.authData.corporate_id},
                        {"wage_month": {$eq:wage_month}},
                        {"wage_year": {$eq:wage_year}},
                        // {"status": {$eq:"pending"}},
                        ]
                    }
                };
            }
            else{
                var search_option= {
                    $match:{
                        $and:[
                        {'corporate_id':req.authData.corporate_id},
                        // {"status": {$eq:"pending"}},
                        ]
                    }
                };
            }
            if(req.body.status){
                search_option.$match.status = { $eq: req.body.status };
            }
            var search_option_details= {$match: {}};
            var search_employee= {$match: {}};
            if (req.body.searchkey) {
                // search_employee.$match['employees.emp_id'] = {
                //     $text: { $search: req.body.searchkey },
                //     corporate_id: req.authData.corporate_id,
                //     parent_hods: { $in: [req.authId] },
                // };
                search_employee.$match['employees.emp_id'] = {
                    $eq : req.body.searchkey
                };
              } else {
                if (req.body.emp_first_name) {
                  search_option.$match.emp_first_name = {
                    $regex: req.body.emp_first_name,
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
                if (req.body.pan_no) {
                  search_option.$match.pan_no = {
                    $regex: req.body.pan_no,
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
                if (req.body.client_id) {
                  var client_ids = JSON.parse(req.body.client_id);
                  client_ids = client_ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                  });
                  search_option_details.$match[
                    "client._id"
                  ] = { $in: client_ids };
                }
                if (req.body.hod_id) {
                  var hod_ids = JSON.parse(req.body.hod_id);
                  hod_ids = hod_ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                  });
                   search_option_details.$match[
                    "employees.emp_hod"
                  ] = { $in: hod_ids };
                }
            }
            var myAggregate = ExtraEarningTemp.aggregate([search_option,
            {
                $lookup: {
                    from: "employees",
                    localField: "emp_id",
                    foreignField: "emp_id",
                    as: "employees",
                },
            },
            search_employee,
            {
                $lookup: {
                    from: "employee_details",
                    localField: "employees._id",
                    foreignField: "employee_id",
                    as: "employee_details",
                },
            },
            {
              $lookup: {
                from: "clients",
                localField: "employees.client_code",
                foreignField: "_id",
                as: "client",
              },
            },
            {
              $lookup: {
                from: "staffs",
                localField: "employees.emp_hod",
                foreignField: "_id",
                as: "hod",
              },
            },
            search_option_details,
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
              },
            },
            {
                "$project": 
                { 
                    _id:1,
                    corporate_id:1,
                    emp_id:1,
                    head_id:1,
                    amount:1,
                    wage_month:1,
                    wage_year:1,
                    document:1,
                    status:1,
                    created_at:1,
                    employee_remark:1,
                    company_remark:1,
                    "employees._id":1,
                    "employees.corporate_id":1,
                    "employees.userid":1,
                    "employees.emp_id":1,
                    "employees.emp_first_name":1,
                    "employees.emp_last_name":1,
                    "employees.emp_dob":1,
                    "employees.pan_no":1,
                    "employees.aadhar_no":1,
                    "employees.email_id":1,
                    "employees.empid":1,
                    "employees.client_code":1,
                    "employees.client_id":1,
                    "employees.is_hod":1,
                    "employees.emp_hod":1,
                    "employees.approval_status":1,
                    extra_earning_head:1,
                    // "employee_details":1,
                    "hod.first_name": 1,
                    "hod.last_name": 1,
                    "client._id": 1,
                    "client.client_code": 1,
                    "employee_details._id": 1,
                    "employee_details.contract": 1,
                    "employee_details.employment_hr_details": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                }
            },
            ]);
            ExtraEarningTemp.aggregatePaginate(myAggregate,options, async function (err, earning) {
                if (err) return resp.json({ status: "error", message: err.message });
                if(earning.docs){
                    if(earning.docs.length > 0){
                        await Promise.all(earning.docs.map(async function(value,key) {
                            var headdata = await EaxtraEarningHead.findOne({_id:value.head_id});
                            earning.docs[key].extra_earning_head = headdata;
                        }));
                    }
                }
                return resp.status(200).json({ status: "success", data: earning });
            });
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    earning_certificate_export_pdf: async function (req, resp, next){
        try{
            var path_array = [];
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
            var filter_option = {};
            var search_option = {
                $match: {
                    $and: [
                    { corporate_id: req.authData.corporate_id },
                    { parent_hods: { $in: [req.authId] } },
                    ],
                },
            };
            var search_option_details = { $match: {} };
            if (req.body.emp_status) {
                if (req.body.emp_status != "all") {
                    search_option.$match.status = { $eq: req.body.emp_status };
                }
            }
            if (req.body.advance_filter == "yes") {
                if (req.body.age_to && req.body.age_from) {
                    const to_d = new Date();
                    const from_d = new Date();
                    var age_to_date = to_d.toDateString(
                        to_d.setFullYear(to_d.getFullYear() - req.body.age_to)
                        );
                    var age_from_date = from_d.toDateString(
                        from_d.setFullYear(from_d.getFullYear() - req.body.age_from)
                        );
                    search_option.$match.emp_dob = {
                        $gte: new Date(age_to_date),
                        $lt: new Date(age_from_date),
                    };
                }
                if (req.body.gender) {
                    search_option.$match.sex = { $regex: req.body.gender, $options: "i" };
                }
                if (req.body.religion) {
                    search_option.$match.religion = {
                        $regex: req.body.religion,
                        $options: "i",
                    };
                }
                if (req.body.doj_from && req.body.doj_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_join"
                    ] ==
                    {
                        $gte: new Date(req.body.doj_from),
                        $lte: new Date(req.body.doj_to),
                    };
                }
                if (req.body.doe_from && req.body.doe_to) {
                    search_option_details.$match[
                    "employee_details.employment_hr_details.date_of_exit"
                    ] ==
                    {
                        $gte: new Date(req.body.doe_from),
                        $lte: new Date(req.body.doe_to),
                    };
                }
            }
            if (req.body.searchkey) {
                search_option = {
                    $match: {
                        $text: { $search: req.body.searchkey },
                        corporate_id: req.authData.corporate_id,
                        parent_hods: { $in: [req.authId] },
                    },
                };
            } else {
                if (req.body.emp_first_name) {
                    search_option.$match.emp_first_name = {
                        $regex: req.body.emp_first_name,
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
                if (req.body.pan_no) {
                    search_option.$match.pan_no = {
                        $regex: req.body.pan_no,
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
                if (req.body.client_id) {
                    var client_ids = JSON.parse(req.body.client_id);
                    client_ids = client_ids.map(function (el) {
                        return mongoose.Types.ObjectId(el);
                    });
                    search_option.$match.client_id = { $in: client_ids };
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
            var myAggregate = Employee.aggregate([search_option,
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
                    from: "employee_details",
                    localField: "_id",
                    foreignField: "employee_id",
                    as: "employee_details",
                },
            },
            search_option_details,
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
                $lookup:{
                    from: 'companies',
                    localField: 'corporate_id',
                    foreignField: 'corporate_id',
                    as: 'companies'
                }
            },
            {
                $lookup:{
                    from: 'company_details',
                    localField: 'companies._id',
                    foreignField: 'company_id',
                    as: 'company_details',
                }
            },
            {
                $lookup:{
                    from: 'declarations',
                    localField: '_id',
                    foreignField: 'employee_id',
                    as: 'declarations',
                }
            },
            {
                $lookup:
                {
                    from: 'employee_monthly_reports',
                    "let": { "emp_db_idVar": "$_id"},
                    "pipeline": [
                    { 
                        "$match": { 
                            $and :[
                            {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                            {"wage_year": new Date().getFullYear()},
                            ] 
                        } 
                    }],
                    as: 'employee_monthly_reports',
                }
            },
            {
                $lookup:{
                    from: 'employee_tds_calculations',
                    localField: '_id',
                    foreignField: 'employee_id',
                    as: 'employee_tds_calculations',
                }
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
                    "companies": {
                        "$arrayElemAt": [ "$companies", 0 ]
                    },
                    "company_details": {
                        "$arrayElemAt": [ "$company_details", 0 ]
                    },
                    "declarations": {
                        "$arrayElemAt": [ "$declarations", 0 ]
                    },
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    corporate_id: 1,
                    userid: 1,
                    emp_id: 1,
                    emp_first_name: 1,
                    emp_last_name: 1,
                    emp_father_name: 1,
                    emp_dob: 1,
                    pan_no: 1,
                    aadhar_no: 1,
                    email_id: 1,
                    client_code: 1,
                    created_at: 1,
                    phone_no: 1,
                    "hod.first_name": 1,
                    "hod.last_name": 1,
                    nominee: 1,
                    nominee_dob: 1,
                    relation_with_nominee: 1,
                    is_hod: 1,
                    status: 1,
                    approval_status: 1,
                    emp_hod: 1,
                    sex: 1,
                    emp_age: {
                        $divide: [
                        { $subtract: [new Date(), "$emp_dob"] },
                        365 * 24 * 60 * 60 * 1000,
                        ],
                    },
                    "client._id": 1,
                    "client.client_code": 1,
                    "employee_details._id": 1,
                    "employee_details.employment_hr_details.date_of_join": 1,
                    "employee_details.bank_details.account_no": 1,
                    "employee_details.pf_esic_details.curr_er_epfo_details.uan_no": 1,
                    "employee_details.pf_esic_details.curr_er_esic_details.esic_no": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                    "companies.com_logo":1,
                    "company_details.details":1,
                    "company_details.reg_office_address":1,
                    "employee_monthly_reports":1,
                    "paydays": { $sum: "$employee_monthly_reports.attendance_summaries.paydays" },
                    "arr_earn": { $sum: "$employee_monthly_reports.salary_report.gross_earning" },
                    "declarations":1,
                    "employee_tds_calculations":1,
                    "tds_profession_tax": { $sum: "$employee_tds_calculations.profession_tax" },
                    'tds_other_ded_standard_ded' : { $sum: "$employee_tds_calculations.standard_deduction_amount" },
                    'tds_house_property' : { $sum: "$employee_tds_calculations.house_property_amount" },
                    'tds_eighty_c_declaration_amount' : { $sum : '$employee_tds_calculations.eighty_c_declaration_amount' },
                    'tds_eighty_d_declaration_amount' : { $sum : '$employee_tds_calculations.eighty_d_declaration_amount' },
                    'tds_eighty_handicap_declaration_amount' : { $sum : '$employee_tds_calculations.eighty_handicap_declaration_amount'},
                    "tds_taxable_income": { $sum: "$employee_tds_calculations.tax_amount" },
                    "tax_slab_additional_cess_amount": { $sum: "$employee_tds_calculations.tax_slab_additional_cess_amount" },
                    "tax_slab_additional_surcharge_amount": { $sum: "$employee_tds_calculations.tax_slab_additional_surcharge_amount" },
                    "tax_slab_charge_total_amount": { $sum: "$employee_tds_calculations.tax_slab_charge_total_amount" },
                    "tds_total_tax_slab_amount": { $sum: "$employee_tds_calculations.tax_slab_amount" },
                },
            },
            ]).then(async (emps) => {
                await Promise.all(emps.map(async function(empdata) {
                    if(empdata.employee_monthly_reports){
                        var hra_amount = 0;
                        var basic_amount = 0;
                        var other_amount = 0;
                        var bonus_amount = 0;
                        var reimbursment_amount = 0;
                        var pf_amount = 0;
                        var pt_amount = 0;
                        var arr_earn_amount = 0;
                        var tds_hra_amount = 0;
                        var tds_basic_amount = 0;
                        var tds_other_amount = 0;
                        var tds_eighty_e_investments_amount = 0;
                        var tds_eighty_ee_investments_amount = 0;
                        var tds_eighty_eea_investments_amount = 0;
                        var tds_eighty_ccc_investments_amount = 0;
                        var tds_eighty_c_investments_amount = 0;
                        var tds_eighty_g_investments_amount = 0;
                        var tds_apr_amount = 0;
                        var tds_may_amount = 0;
                        var tds_jun_amount = 0;
                        var tds_jul_amount = 0;
                        var tds_aug_amount = 0;
                        var tds_sep_amount = 0;
                        var tds_oct_amount = 0;
                        var tds_nov_amount = 0;
                        var tds_dec_amount = 0;
                        var tds_jan_amount = 0;
                        var tds_feb_amount = 0;
                        var tds_mar_amount = 0;
                        if(empdata.employee_monthly_reports.length > 0){
                            empdata.employee_monthly_reports.map(function(monthlyemp){
                                if(monthlyemp.salary_report){
                                    if(monthlyemp.salary_report.heads){
                                        if(monthlyemp.salary_report.heads.length > 0){
                                            monthlyemp.salary_report.heads.map(function(head){
                                                if(head.head_title.includes('House') || head.head_title.includes('house') && head.head_abbreviation.includes('hra') || head.head_abbreviation.includes('HRA')){
                                                    hra_amount+= parseFloat(head.amount);
                                                }
                                                else if(head.head_title.includes('basic') || head.head_title.includes('Basic')){
                                                    basic_amount += parseFloat(head.amount);
                                                }
                                                else{
                                                    other_amount += parseFloat(head.amount);
                                                }
                                            })
                                            monthlyemp.master_report.heads.map(function(head){
                                                if(head.head_title.includes('House') || head.head_title.includes('house') && head.head_abbreviation.includes('hra') || head.head_abbreviation.includes('HRA')){
                                                    tds_hra_amount+= parseFloat(head.amount);
                                                }
                                                else if(head.head_title.includes('basic') || head.head_title.includes('Basic')){
                                                    tds_basic_amount += parseFloat(head.amount);
                                                }
                                                else{
                                                    tds_other_amount += parseFloat(head.amount);
                                                }
                                            })
                                        }
                                    }
                                    arr_earn_amount += parseFloat(monthlyemp.salary_report.gross_earning);
                                }
                                if(monthlyemp.bonus_report){
                                    if(monthlyemp.bonus_report.gross_earning){
                                        bonus_amount += parseFloat(monthlyemp.bonus_report.gross_earning);
                                    }
                                }
                                if(monthlyemp.reimbursment_report){
                                    if(monthlyemp.reimbursment_report.gross_earning){
                                        reimbursment_amount += parseFloat(monthlyemp.reimbursment_report.gross_earning);
                                    }
                                }
                                if(monthlyemp.total_data){
                                    if(monthlyemp.total_data.pf_data){
                                        pf_amount += (parseFloat(monthlyemp.total_data.pf_data.emoloyee_contribution) + parseFloat(monthlyemp.total_data.pf_data.total_employer_contribution));
                                    }
                                    pt_amount += parseFloat(monthlyemp.total_data.total_pt_amount);
                                }  
                            });
                        }
                        if(empdata.declarations){
                            if(empdata.declarations.eighty_e_investments){
                                if(empdata.declarations.eighty_e_investments.length > 0){
                                    empdata.declarations.eighty_e_investments.map(function(eighty_e_investment){
                                        tds_eighty_e_investments_amount += parseFloat(eighty_e_investment.amount);
                                    });
                                }
                            }
                            if(empdata.declarations.eighty_ee_investments){
                                if(empdata.declarations.eighty_ee_investments.length > 0){
                                    empdata.declarations.eighty_ee_investments.map(function(eighty_ee_investment){
                                        tds_eighty_ee_investments_amount += parseFloat(eighty_ee_investment.amount);
                                    });
                                }
                            }
                            if(empdata.declarations.eighty_eea_investments){
                                if(empdata.declarations.eighty_eea_investments.length > 0){
                                    empdata.declarations.eighty_eea_investments.map(function(eighty_eea_investment){
                                        tds_eighty_eea_investments_amount += parseFloat(eighty_eea_investment.amount);
                                    });
                                }
                            }
                            if(empdata.declarations.eighty_ccc_investments){
                                if(empdata.declarations.eighty_ccc_investments.length > 0){
                                    empdata.declarations.eighty_ccc_investments.map(function(eighty_ccc_investment){
                                        tds_eighty_ccc_investments_amount += parseFloat(eighty_ccc_investment.amount);
                                    });
                                }
                            }
                            if(empdata.declarations.eighty_c_investments){
                                if(empdata.declarations.eighty_c_investments.length > 0){
                                    empdata.declarations.eighty_c_investments.map(function(eighty_c_investment){
                                        tds_eighty_c_investments_amount += parseFloat(eighty_c_investment.amount);
                                    });
                                }
                            }
                            if(empdata.declarations.eighty_g_investments){
                                if(empdata.declarations.eighty_g_investments.length > 0){
                                    empdata.declarations.eighty_g_investments.map(function(eighty_g_investment){
                                        tds_eighty_g_investments_amount += parseFloat(eighty_g_investment.amount);
                                    });
                                }
                            }
                        }
                        if(empdata.employee_tds_calculations){
                            if(empdata.employee_tds_calculations.length > 0){
                                empdata.employee_tds_calculations.map(function (tds_calculation) {
                                    if(tds_calculation.wage_month == 0 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_jan_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 1 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_feb_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 2 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_mar_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 3 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_apr_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 4 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_may_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 5 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_jun_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 6 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_jul_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 7 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_aug_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 8 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_sep_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 9 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_oct_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 10 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_nov_amount = tds_calculation.tax_amount;
                                    }
                                    else if(tds_calculation.wage_month == 11 && tds_calculation.wage_year == new Date().getFullYear()){
                                        tds_dec_amount = tds_calculation.tax_amount;
                                    }
                                });
                            }
                        }
                        empdata.hra_amount = hra_amount;
                        empdata.tds_hra_amount = tds_hra_amount;
                        empdata.basic_amount = basic_amount;
                        empdata.tds_basic_amount = tds_basic_amount;
                        empdata.other_amount = other_amount;
                        empdata.tds_other_amount = tds_other_amount;
                        empdata.bonus_amount = bonus_amount;
                        empdata.reimbursment_amount = reimbursment_amount;
                        empdata.earning_total_amount = (parseFloat(hra_amount) + parseFloat(basic_amount) + parseFloat(other_amount) + parseFloat(bonus_amount) + parseFloat(reimbursment_amount) + parseFloat(arr_earn_amount));
                        empdata.pf_amount = pf_amount;
                        empdata.pt_amount = pt_amount;
                        empdata.deductions_total_amount = (parseFloat(pf_amount) + parseFloat(pt_amount));
                        empdata.net_payment = empdata.earning_total_amount - empdata.deductions_total_amount;
                        empdata.net_payment_in_words = await inWords(parseInt(empdata.net_payment));
                        empdata.tds_eighty_e_investments_amount = tds_eighty_e_investments_amount;
                        empdata.tds_eighty_ee_and_eea_investments_amount = (tds_eighty_ee_investments_amount + tds_eighty_eea_investments_amount);
                        empdata.tds_eighty_ccc_investments_amount = tds_eighty_ccc_investments_amount;
                        empdata.tds_eighty_c_investments_amount = tds_eighty_c_investments_amount;
                        empdata.tds_eighty_g_investments_amount = tds_eighty_g_investments_amount;
                        empdata.tds_total_vi_a_deduction = (empdata.tds_eighty_c_declaration_amount+empdata.tds_eighty_d_declaration_amount+empdata.tds_eighty_handicap_declaration_amount);
                        
                        empdata.tds_jan_amount = tds_jan_amount;
                        empdata.tds_feb_amount = tds_feb_amount;
                        empdata.tds_mar_amount = tds_mar_amount;
                        empdata.tds_apr_amount = tds_apr_amount;
                        empdata.tds_may_amount = tds_may_amount;
                        empdata.tds_jun_amount = tds_jun_amount;
                        empdata.tds_jul_amount = tds_jul_amount;
                        empdata.tds_aug_amount = tds_aug_amount;
                        empdata.tds_sep_amount = tds_sep_amount;
                        empdata.tds_oct_amount = tds_oct_amount;
                        empdata.tds_nov_amount = tds_nov_amount;
                        empdata.tds_dec_amount = tds_dec_amount;
                        if(!req.body.is_view){
                            // var file_path='/storage/company/temp_files/'+req.authData.corporate_id+"/earning_certificate/";
                            var file_name='earning-certificate-'+empdata.corporate_id+'-'+empdata.emp_id+'-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.pdf';
                            let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/exta-earning-module');
                            path_array.push({
                                "link": absolutePath+file.location+file.file_name,
                                "file_path":file.location,
                                "file_name":file.file_name
                            });
                            var pdf_file= await Site_helper.generate_earning_certificate_pdf({certificate_data: empdata},file.file_name,file.location);
                        }
                    }
                })).then(async (emp) => { 
                    if(!req.body.is_view){
                        var path_link = null; 
                        file_name = 'earning-certificate-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip';
                        let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/exta-earning-module');
                        if(path_array.length > 0){
                            var dir = absolutePath+file.location;
                            if (!fs.existsSync(dir)){
                                fs.mkdirSync(dir);
                            }
                            const output = fs.createWriteStream(dir+file.file_name);
                            const archive = archiver('zip', {
                                zlib: { level: 9 } 
                            });
                            output.on('close', () => {
                                // console.log('Archive finished.');
                            });
                            archive.on('error', (err) => {
                                // console.log('Error.',err);
                            });
                            archive.pipe(output);
                            path_array.map( async function(parray) {
                                if(fs.existsSync(parray.link)){
                                    archive.append(fs.createReadStream(parray.link), { name: parray.file_name });
                                }
                            });
                            archive.finalize();
                            // file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/earning_certificate/";

                            await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                            // await Site_helper.downloadAndDelete(file_name,file_path,req.authData.corporate_id,resp);
                            // path_link = baseurl+'storage/company/earning_certificate/earning-certificate-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip';
                        }
                        // return resp.status(200).json({status: "success", message: 'Earning Certificate Generated successfully.', url: path_link});
                    }
                    else{
                        return resp.status(200).json({status: "success", message: 'Earning Certificate Fetch successfully.',employee:emps});
                    }
                    // return resp.status(200).json({status: "success", message: 'Earning Certificate Generated successfully.', url: path_link, employee:emps});
                    
                });
                // return resp.status(200).json({status: "success", message: 'Earning Certificate Generated successfully.', url: '', employee:em});
            });
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    generate_extra_earning : async function (req, resp, next){
        try{
            const v = new Validator(req.body, {
                attendance_month: 'required',
                  attendance_year: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var attendence_month=req.body.attendance_month;
                var attendence_year=req.body.attendance_year;
                var wage_month=parseInt(attendence_month);
                var wage_year=parseInt(attendence_year);
                const options = {};
                var filter_option={};
                var document={};
                var search_option= {$match: {
                    $and:[ 
                        {'corporate_id':req.authData.corporate_id},
                        {'parent_hods':{$in: [req.authData.user_id] }},
                        {'approval_status': { $in: ['approved','active']}},
                    ]
                }};
                var search_option_details= {$match: {}};
            }
            if(req.body.searchkey)
            {
                search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
            }
            else
            {
                var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
                search_option_details=query_data.search_option_details;
                search_option=query_data.search_option;
            }
            if(req.body.row_checked_all === "true")
            {
                var ids=JSON.parse(req.body.unchecked_row_ids);
                if(ids.length > 0)
                {
                    ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                    search_option.$match._id= { $nin: ids }
                }
            }
            else{
                var ids=JSON.parse(req.body.checked_row_ids);
                if(ids.length > 0)
                {
                    ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                    search_option.$match._id= { $in: ids }
                }
            }
            // search_option_details.$match['extra_earnings.wage_month']= attendence_month.toString();
            // search_option_details.$match['extra_earnings.wage_year']=  attendence_year.toString();
            // // search_option_details.$match['extra_earnings.0']=  { "$exists": true }; 
            // search_option_details.$match['reimbursements.wage_month']= attendence_month.toString();
            // search_option_details.$match['reimbursements.wage_year']=  attendence_year.toString();
            // // search_option_details.$match['reimbursements.0']=  { "$exists": true }; 
            search_option_details.$match['extra_earnings._id']=  { "$exists": true }; 
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
            {
                $lookup:{
                    from: 'extra_earnings',
                    "let": { "emp_db_idVar": "$emp_id" },
                    "pipeline": [
                        { "$match": { 
                                $and :[
                                    {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                                    {"wage_month": attendence_month.toString()},
                                    {"wage_year": attendence_year.toString()},
                                    {status:"active"},
                                ] 
                            } 
                        }
                    ],
                    as: 'extra_earnings',
                }
            },
            {
                $lookup:{
                    from: 'reimbursements',
                    "let": { "emp_db_idVar": "$emp_id" },
                    "pipeline": [
                        { "$match": { 
                                $and :[
                                    {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                                    {"wage_month": attendence_month.toString()},
                                    {"wage_year": attendence_year.toString()},
                                    {status:"active"},
                                ] 
                            } 
                        }
                    ],
                    as: 'reimbursements',
                }
            },
            {
                $lookup:{
                    from: 'employee_monthly_reports',
                    "let": { "emp_db_idVar": "$_id" },
                    "pipeline": [
                        { "$match": { 
                                $and :[
                                    {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                    {"wage_month": parseInt(attendence_month)},
                                    {"wage_year": parseInt(attendence_year)},
                                ] 
                            } 
                        }
                    ],
                    as: 'employee_monthly_reports',
                }
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
            {$lookup:{
              from: 'staffs',
              localField: 'emp_hod',
              foreignField: '_id',
              as: 'hod'
            }},
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
            {$lookup:{
              from: 'attendance_summaries',
              "let": { "emp_db_idVar": "$emp_id"},
                "pipeline": [
                  { "$match": { $and :[
                    {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                    {"attendance_month": attendence_month.toString()},
                    {"attendance_year": attendence_year.toString()},
                  ] } }
                ],
              as: 'attendance_summaries'
            }},
            { 
                "$addFields": {
                    "employee_monthly_reports": {
                        "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                    },
                    employee_details: {
                      $arrayElemAt: ["$employee_details", 0],
                    },
                    "hod": {
                        "$arrayElemAt": [ "$hod", 0 ]
                    },
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "client": {
                        "$arrayElemAt": [ "$client", 0 ]
                    },
                }
            },
            { 
                "$project": 
                { 
                    "_id":1,
                    "corporate_id":1,
                    "userid":1,
                    "emp_id":1,
                    "emp_first_name":1,
                    "emp_last_name":1,
                    "emp_dob":1,
                    "mobile_no":{ $ifNull: [ "$mobile_no", 'NA' ] },
                    "age": {
                          $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
                            (365 * 24*60*60*1000)]
                          },
                    "pan_no":1,
                    "aadhar_no":1,
                    "email_id":1,
                    "empid":1,
                    "sex":1,
                    "client_code":1,
                    "approval_status":1,
                    "employee_details":1,
                    "employee_advances":1,
                    "hod.first_name":1,
                    "hod.last_name":1,
                    "hod.userid":1,
                    "hod._id":1,
                    "hold_salary_emps":1,
                    "employee_monthly_reports":1,
                    "branch.branch_name":1,
                    "branch._id":1,
                    "designation.designation_name":1,
                    "designation._id":1,
                    "department.department_name":1,
                    "department._id":1,
                    "client.client_name":1,
                    "client._id":1,
                    "layoff_modules":1,
                    "extra_earnings":1, 
                    "reimbursements":1,                
                    "employee_monthly_reports":1,  
                    employee_details: 1,  
                    attendance_summaries: {
                      $filter: {
                        input: "$attendance_summaries",
                        as: "attendance_summaries",
                        cond: {
                          $and: [
                            {$eq: ["$$attendance_summaries.attendance_month", attendence_month.toString()]},
                            {$eq: ["$$attendance_summaries.attendance_year", attendence_year.toString()]}
                          ]
                        }
                      }
                    },              
                }
            },
            ]).then(async (emps) => {
                var bonus_data = [];
                var currdate = new Date();
                var epfo_temp = await Site_helper.get_gov_epfo_data(req);
                var esic_temp = await Site_helper.get_gov_esic_data(req);
                var wage_month = req.body.attendance_month;
                var wage_year = req.body.attendance_year;

                await Promise.all(emps.map( async function(emp) {
                    var empdata = emp;
                    if (empdata.employee_details){
                        if (empdata.employee_details.template_data){
                            var pre_total_pt = 0;
                            var pre_bonus_pt = 0;
                            var total_pay_days = 0;
                            var pre_monthly_pt_wage_amount = 0;
                            var pre_module_pt=0;
                            var emp_state = empdata.employee_details.emp_address.state;
                            var date_of_join =  empdata.employee_details.employment_hr_details.date_of_join;
                            var gross_salary = parseFloat( empdata.employee_details.employment_hr_details.gross_salary );
                            var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;
                            var pre_salary_data=empdata.employee_monthly_reports;
                            var pre_monthly_wage_amount=0;
                            if(pre_salary_data)
                            {
                                if(pre_salary_data.extra_earning_report)
                                {
                                  pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.extra_earning_report.total_pf_wages);                     
                                }
                                else
                                {
                                  pre_monthly_wage_amount= pre_salary_data.total_data.total_pf_wages;
                                }
                            }
                            

                            
                            document = {
                                "heads":[],
                                "ctc":0,
                                "total_pf_bucket":0,
                                "total_pf_wages":0,
                                "total_esic_bucket":0,
                                "total_esic_wages":0,
                                "total_pt_wages":0,
                                "total_tds_wages":0,
                                "total_gratuity_wages":0,
                                "net_take_home":0,
                                "voluntary_pf_amount":0,
                                "gross_earning":0,
                                "gross_deduct":0,
                                "total_bonus_wages":0,
                                "advance_recovered":0,
                                "bank_ins_referance_id":"",
                                "pf_challan_referance_id":"",
                                "esic_challan_referance_id":"",
                                "pt_amount":0,
                            };
                            var exrning_heads = [];
                            var pf_amount = 0;
                            var esic_amount = 0;
                            var pt_amount = 0;
                            var tds_amount = 0;
                            var total_earn_amount = 0;
                            var total_duct_amount = 0;
                            if(emp.extra_earnings){
                                if(emp.extra_earnings.length > 0){
                                    for (var i = 0; i < emp.extra_earnings.length; i++) {
                                        if(emp.extra_earnings[i].head_id){
                                            var existEarningHead = await EaxtraEarningHead.findOne({'_id':mongoose.Types.ObjectId(emp.extra_earnings[i].head_id) , 'earning_status':{$ne: "reimbursement"}});
                                            if(existEarningHead){
                                                exrning_heads.push({
                                                    'head_id':existEarningHead._id,
                                                    'head_title':existEarningHead.head_name,
                                                    'head_type':existEarningHead.earning_status,
                                                    'head_abbreviation':existEarningHead.abbreviation,
                                                    'head_include_in':existEarningHead.head_include_in,
                                                    'amount': parseFloat(emp.extra_earnings[i].amount),
                                                });
                                                if(existEarningHead.head_include_in){
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('PF')){
                                                        pf_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('ESI')){
                                                        esic_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('PT')){
                                                        pt_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('TDS')){
                                                        tds_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                }
                                                if(existEarningHead.earning_status == 'deduction'){
                                                    total_duct_amount += parseFloat(emp.extra_earnings[i].amount);
                                                }
                                                else{
                                                    total_earn_amount += parseFloat(emp.extra_earnings[i].amount);
                                                }
                                            }
                                        }

                                    };

                                }
                            }

                            if(salary_temp_data.restricted_pf === "yes")
                            {
                                var template_wage_ceiling = parseFloat(epfo_temp.wage_ceiling);
                                var avaiable_wage_amount= (template_wage_ceiling - pre_monthly_wage_amount);
                                var module_wage_amount=(pf_amount < parseFloat(avaiable_wage_amount) ? pf_amount  : parseFloat(avaiable_wage_amount) );
                                
                            }
                            else
                            {
                                var module_wage_amount= pf_amount;
                            }
                            var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? esic_amount : 0 );


                            var total = total_earn_amount + total_duct_amount;
                            document.heads = exrning_heads;
                            document.ctc = total;
                            document.total_pf_bucket = pf_amount;
                            document.total_pf_wages = module_wage_amount;
                            document.total_esic_bucket = esic_amount;
                            document.total_esic_wages = restrict_esic_wages;
                            document.total_pt_wages = pt_amount;
                            document.total_tds_wages = tds_amount;
                            document.net_take_home = total_earn_amount;
                            document.gross_earning = total_earn_amount;
                            document.gross_deduct = total_duct_amount;
                            document.pt_amount = pt_amount;
                            
                            if(pre_salary_data)
                            {
                                pre_total_pt = (pre_salary_data.total_data.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);
                                if(pre_salary_data.extra_earning_report)
                                {
                                    pre_module_pt = (pre_salary_data.extra_earning_report.pt_amount?pre_salary_data.extra_earning_report.pt_amount:0);
                                    var total_earning_data={ 
                                        'total_earning': (total_earn_amount + (  pre_salary_data.total_data.total_earning - pre_salary_data.extra_earning_report.gross_earning)),
                                        'total_ctc': (total_earn_amount + (  pre_salary_data.total_data.total_ctc - pre_salary_data.extra_earning_report.ctc)),
                                        'total_pf_bucket':(pf_amount + (pre_salary_data.total_data.total_pf_bucket -  pre_salary_data.extra_earning_report.total_pf_bucket)),
                                        'total_pf_wages':(module_wage_amount + ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.extra_earning_report.total_pf_wages)),
                                        'total_esic_bucket':(esic_amount + (pre_salary_data.total_data.total_esic_bucket - pre_salary_data.extra_earning_report.total_esic_bucket)),
                                        'total_esic_wages':(restrict_esic_wages +  (pre_salary_data.total_data.total_esic_wages - pre_salary_data.extra_earning_report.total_esic_wages)),
                                        'total_tds_wages':(tds_amount +  (pre_salary_data.total_data.total_tds_wages - pre_salary_data.extra_earning_report.total_tds_wages)),
                                        'total_pt_wages':(pt_amount + (pre_salary_data.total_data.total_pt_wages - pre_salary_data.extra_earning_report.total_pt_wages)),
                                        'bank_ins_referance_id':pre_salary_data.total_data.bank_ins_referance_id == '' ? '' :  pre_salary_data.total_data.bank_ins_referance_id,
                                        'pf_challan_referance_id':pre_salary_data.total_data.pf_challan_referance_id == '' ? '' :  pre_salary_data.total_data.pf_challan_referance_id,
                                        'esic_challan_referance_id':pre_salary_data.total_data.esic_challan_referance_id == '' ? '' :  pre_salary_data.total_data.esic_challan_referance_id,
                                    };
                                }
                                else
                                {
                                    var total_earning_data={ 
                                        'total_earning':  (total_earn_amount +   pre_salary_data.total_data.total_earning),
                                        'total_ctc': (total_earn_amount + pre_salary_data.total_data.total_ctc),
                                        'total_pf_bucket':(pf_amount + pre_salary_data.total_data.total_pf_bucket),
                                        'total_pf_wages': (module_wage_amount +  pre_salary_data.total_data.total_pf_wages),
                                        'total_esic_bucket': (esic_amount + pre_salary_data.total_data.total_esic_bucket),
                                        'total_esic_wages': (restrict_esic_wages +  pre_salary_data.total_data.total_esic_wages),
                                        'total_tds_wages': (tds_amount + pre_salary_data.total_data.total_tds_wages),
                                        'total_pt_wages': (pt_amount + pre_salary_data.total_data.total_pt_wages),
                                        'bank_ins_referance_id': '' ,
                                        'pf_challan_referance_id': '' ,
                                        'esic_challan_referance_id': '' ,
                                    };
                                } 
                            }
                            else
                            {
                                var total_earning_data={ 
                                    'total_earning':  total_earn_amount,
                                    'total_ctc':  total_earn_amount,
                                    'total_pf_bucket':pf_amount,
                                    'total_pf_wages': module_wage_amount,
                                    'total_esic_bucket': esic_amount,
                                    'total_esic_wages': restrict_esic_wages,
                                    'total_tds_wages': tds_amount,
                                    'total_pt_wages': pt_amount,
                                    'bank_ins_referance_id': '' ,
                                    'pf_challan_referance_id': '' ,
                                    'esic_challan_referance_id': '' ,
                                };
                            }
                            document.esic_data =await Site_helper.calculate_esic(esic_temp, restrict_esic_wages,gross_salary);
                            document.pf_data = await Site_helper.calculate_pf( epfo_temp, module_wage_amount, salary_temp_data, empdata.employee_details.employment_hr_details);

                            total_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages,gross_salary);
                            total_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);                

                            var p_tax_amount = await Site_helper.calculate_pt(req,currdate,emp_state,total_earning_data.total_pt_wages?total_earning_data.total_pt_wages:0);                
                            var module_pt_amount= (p_tax_amount - (pre_total_pt - pre_module_pt));
                            document.pt_amount= module_pt_amount;
                            total_earning_data.total_pt_amount= p_tax_amount;
                            
                            var pre_extra_earning_data=emp.employee_monthly_reports;
                            if(pre_extra_earning_data)
                            {
                                if(pre_extra_earning_data.extra_earning_report)
                                {
                                    document.bank_ins_referance_id = pre_extra_earning_data.extra_earning_report.bank_ins_referance_id == '' ? '' :  pre_extra_earning_data.extra_earning_report.bank_ins_referance_id;
                                    document.pf_challan_referance_id = pre_extra_earning_data.extra_earning_report.pf_challan_referance_id == '' ? '' :  pre_extra_earning_data.extra_earning_report.pf_challan_referance_id;
                                    document.esic_challan_referance_id = pre_extra_earning_data.extra_earning_report.esic_challan_referance_id == '' ? '' :  pre_extra_earning_data.extra_earning_report.esic_challan_referance_id;
                                }
                            }
                            var emp_data={
                                _id:emp._id,
                                emp_id:emp.emp_id,
                                emp_first_name:emp.emp_first_name,
                                emp_last_name:emp.emp_last_name,
                                emp_emp_dob:emp.emp_dob,
                                emp_pan_no:emp.pan_no,
                                emp_aadhar_no:emp.aadhar_no,
                                emp_mob:emp.mobile_no,
                                emp_email_id:emp.email_id,
                                new_pf_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.new_pf_no:'NA'),
                                esic_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.esic_no:'NA'),
                                date_of_join:emp.employee_details.employment_hr_details.date_of_join,
                                sex:emp.sex,
                                age:emp.age,
                                EPF:emp.employee_details.employment_hr_details.pf_applicable,
                                EPS:emp.employee_details.employment_hr_details.pension_applicable,
                                Restrict_PF:emp.employee_details.template_data.salary_temp_data.restricted_pf,
                                ESIC:(gross_salary >  esic_temp.wage_ceiling ? 'NO' : 'YES'),
                                Reg_Type:emp.employee_details.template_data.attendance_temp_data.register_type,
                                emp_uan_no:(emp.employee_details.pf_esic_details ? emp.employee_details.pf_esic_details.curr_er_epfo_details ? emp.employee_details.pf_esic_details.curr_er_epfo_details.uan_no :'NA' :'NA'),
                                attendance_summaries:emp.attendance_summaries[0],
                                hod: emp.hod ? emp.hod.first_name+" "+emp.hod.last_name : "",
                                branch:emp.branch,
                                designation:emp.designation,
                                department:emp.department,
                                client:emp.client,
                            };
                            var insert_data = {
                                corporate_id:empdata.corporate_id,
                                emp_db_id:mongoose.Types.ObjectId(empdata._id),
                                emp_id: empdata.emp_id,
                                wage_month:attendence_month,
                                wage_year:attendence_year,
                                total_data:total_earning_data,
                                emp_data:emp_data,
                                extra_earning_report:document,
                                status:'active',
                            };
                            var where_condition={'emp_id':emp.emp_id,wage_month:attendence_month,wage_year:attendence_year,corporate_id:emp.corporate_id};
                            await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});
                        }
                    }
                })).then(async (emps) => {
                    next();
                    // return resp.status(200).json({ status: "success", message: 'Extra earning sheet generated successfully.' });
                });
            });
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },

    get_reimbursement_heads: async function (req, resp, next) {
        try{
            await EaxtraEarningHead.find({  status:'active' ,"corporate_id":req.authData.corporate_id, "earning_status":{$in:['earning','deduction','reimbursement']} },'_id head_name abbreviation earning_status',  function (err, temp_head) {
                if (!err) 
                {
                    return resp.status(200).send({ status: 'success', message:"", temp_head: temp_head});
                }
            })
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    generate_reimbursement : async function (req, resp, next){
        try{
            const v = new Validator(req.body, {
                attendance_month: 'required',
                  attendance_year: 'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var attendence_month=req.body.attendance_month?req.body.attendance_month:"0";
                var attendence_year=req.body.attendance_year;
                var wage_month=parseInt(attendence_month);
                var wage_year=parseInt(attendence_year);
                const options = {};
                var filter_option={};
                var document={};
                var search_option= {$match: {
                    $and:[ 
                        {'corporate_id':req.authData.corporate_id},
                        {'parent_hods':{$in: [req.authData.user_id] }},
                        {'approval_status': { $in: ['approved','active']}},
                    ]
                }};
                var search_option_details= {$match: {}};
            }
            if(req.body.searchkey)
            {
                search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
            }
            else
            {
                var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
                search_option_details=query_data.search_option_details;
                search_option=query_data.search_option;
            }
            if(req.body.row_checked_all === "true")
            {
                var ids=JSON.parse(req.body.unchecked_row_ids);
                if(ids.length > 0)
                {
                    ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                    search_option.$match._id= { $nin: ids }
                }
            }
            else{
                var ids=JSON.parse(req.body.checked_row_ids);
                if(ids.length > 0)
                {
                    ids = ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                    search_option.$match._id= { $in: ids }
                }
            }
            // search_option_details.$match['extra_earnings.wage_month']= attendence_month.toString();
            // search_option_details.$match['extra_earnings.wage_year']=  attendence_year.toString();
            // // search_option_details.$match['extra_earnings.0']=  { "$exists": true }; 
            // search_option_details.$match['reimbursements.wage_month']= attendence_month.toString();
            // search_option_details.$match['reimbursements.wage_year']=  attendence_year.toString();
            var check_search_option_details = {
                $match: {
                    $or: [
                        { "reimbursements._id" : { $exists: true, $ne: null }  },
                        { "extra_earnings._id" : { $exists: true, $ne: null } },
                    ]
                }
            };

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
            {
                $lookup:{
                    from: 'extra_earnings',
                    "let": { "emp_db_idVar": "$emp_id" },
                    "pipeline": [
                        { "$match": { 
                                $and :[
                                    {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                                    {"wage_month": attendence_month.toString()},
                                    {"wage_year": attendence_year.toString()},
                                    {status:"active"},
                                ] 
                            } 
                        }
                    ],
                    as: 'extra_earnings',
                }
            },
            {
                $lookup:{
                    from: 'reimbursements',
                    "let": { "emp_db_idVar": "$emp_id" },
                    "pipeline": [
                        { "$match": { 
                                $and :[
                                    {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                                    {"wage_month": attendence_month.toString()},
                                    {"wage_year": attendence_year.toString()},
                                    {status:"active"},
                                ] 
                            } 
                        }
                    ],
                    as: 'reimbursements',
                }
            },
            {
                $lookup:{
                    from: 'employee_monthly_reports',
                    "let": { "emp_db_idVar": "$_id" },
                    "pipeline": [
                        { "$match": { 
                                $and :[
                                    {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                    {"wage_month": parseInt(attendence_month)},
                                    {"wage_year": parseInt(attendence_year)},
                                ] 
                            } 
                        }
                    ],
                    as: 'employee_monthly_reports',
                }
            },
            search_option_details,
            check_search_option_details,
            {
              $lookup: {
                from: "clients",
                localField: "client_code",
                foreignField: "_id",
                as: "client",
              },
            },
            {$lookup:{
              from: 'staffs',
              localField: 'emp_hod',
              foreignField: '_id',
              as: 'hod'
            }},
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
            {$lookup:{
              from: 'attendance_summaries',
              "let": { "emp_db_idVar": "$emp_id"},
                "pipeline": [
                  { "$match": { $and :[
                    {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                    {"attendance_month": attendence_month.toString()},
                    {"attendance_year": attendence_year.toString()},
                  ] } }
                ],
              as: 'attendance_summaries'
            }},
            { 
                "$addFields": {
                    "employee_monthly_reports": {
                        "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                    },
                    employee_details: {
                      $arrayElemAt: ["$employee_details", 0],
                    },
                    "hod": {
                        "$arrayElemAt": [ "$hod", 0 ]
                    },
                    "designation": {
                        "$arrayElemAt": [ "$designation", 0 ]
                    },
                    "department": {
                        "$arrayElemAt": [ "$department", 0 ]
                    },
                    "client": {
                        "$arrayElemAt": [ "$client", 0 ]
                    },
                }
            },
            { 
                "$project": 
                { 
                    "_id":1,
                    "corporate_id":1,
                    "userid":1,
                    "emp_id":1,
                    "emp_first_name":1,
                    "emp_last_name":1,
                    "emp_dob":1,
                    "mobile_no":{ $ifNull: [ "$mobile_no", 'NA' ] },
                    "age": {
                          $divide: [{$subtract: [ new Date(), "$emp_dob" ] },
                            (365 * 24*60*60*1000)]
                          },
                    "pan_no":1,
                    "aadhar_no":1,
                    "email_id":1,
                    "empid":1,
                    "sex":1,
                    "client_code":1,
                    "approval_status":1,
                    "employee_details":1,
                    "employee_advances":1,
                    "hod.first_name":1,
                    "hod.last_name":1,
                    "hod.userid":1,
                    "hod._id":1,
                    "hold_salary_emps":1,
                    "employee_monthly_reports":1,
                    "branch.branch_name":1,
                    "branch._id":1,
                    "designation.designation_name":1,
                    "designation._id":1,
                    "department.department_name":1,
                    "department._id":1,
                    "client.client_name":1,
                    "client._id":1,
                    "layoff_modules":1,
                    "extra_earnings":1, 
                    "reimbursements":1,                
                    "employee_monthly_reports":1,  
                    employee_details: 1,  
                    attendance_summaries: {
                      $filter: {
                        input: "$attendance_summaries",
                        as: "attendance_summaries",
                        cond: {
                          $and: [
                            {$eq: ["$$attendance_summaries.attendance_month", attendence_month.toString()]},
                            {$eq: ["$$attendance_summaries.attendance_year", attendence_year.toString()]}
                          ]
                        }
                      }
                    },              
                }
            },
            ]).then(async (emps) => {
                var bonus_data = [];
                var currdate = new Date();
                var epfo_temp = await Site_helper.get_gov_epfo_data(req);
                var esic_temp = await Site_helper.get_gov_esic_data(req);
                var wage_month = req.body.attendance_month;
                var wage_year = req.body.attendance_year;

                await Promise.all(emps.map( async function(emp) {
                    var empdata = emp;
                    if (empdata.employee_details){
                        if (empdata.employee_details.template_data){
                            var pre_total_pt = 0;
                            var pre_bonus_pt = 0;
                            var total_pay_days = 0;
                            var pre_monthly_pt_wage_amount = 0;
                            var pre_module_pt=0;
                            var emp_state = empdata.employee_details.emp_address.state;
                            var date_of_join =  empdata.employee_details.employment_hr_details.date_of_join;
                            var gross_salary = parseFloat( empdata.employee_details.employment_hr_details.gross_salary );
                            var salary_temp_data = empdata.employee_details.template_data.salary_temp_data;
                            var pre_salary_data=empdata.employee_monthly_reports;
                            var pre_monthly_wage_amount=0;
                            if(pre_salary_data)
                            {
                                if(pre_salary_data.reimbursment_report)
                                {
                                  pre_monthly_wage_amount = ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.reimbursment_report.total_pf_wages);                     
                                }
                                else
                                {
                                  pre_monthly_wage_amount= pre_salary_data.total_data.total_pf_wages;
                                }
                            }
                            

                            
                            document = {
                                "heads":[],
                                "ctc":0,
                                "total_pf_bucket":0,
                                "total_pf_wages":0,
                                "total_esic_bucket":0,
                                "total_esic_wages":0,
                                "total_pt_wages":0,
                                "total_tds_wages":0,
                                "total_gratuity_wages":0,
                                "net_take_home":0,
                                "voluntary_pf_amount":0,
                                "gross_earning":0,
                                "gross_deduct":0,
                                "total_bonus_wages":0,
                                "advance_recovered":0,
                                "bank_ins_referance_id":"",
                                "pf_challan_referance_id":"",
                                "esic_challan_referance_id":"",
                                "pt_amount":0,
                            };
                            var exrning_heads = [];
                            var pf_amount = 0;
                            var esic_amount = 0;
                            var pt_amount = 0;
                            var tds_amount = 0;
                            var total_earn_amount = 0;
                            var total_duct_amount = 0;
                            if(emp.extra_earnings){
                                if(emp.extra_earnings.length > 0){
                                    for (var i = 0; i < emp.extra_earnings.length; i++) {
                                        if(emp.extra_earnings[i].head_id){
                                            var existEarningHead = await EaxtraEarningHead.findOne({'_id':mongoose.Types.ObjectId(emp.extra_earnings[i].head_id), 'earning_status':{$eq: "reimbursement"}});
                                            if(existEarningHead){
                                                exrning_heads.push({
                                                    'head_id':existEarningHead._id,
                                                    'head_title':existEarningHead.head_name,
                                                    'head_type':existEarningHead.earning_status,
                                                    'head_abbreviation':existEarningHead.abbreviation,
                                                    'head_include_in':existEarningHead.head_include_in,
                                                    'amount': parseFloat(emp.extra_earnings[i].amount),
                                                });
                                                if(existEarningHead.head_include_in){
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('PF')){
                                                        pf_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('ESI')){
                                                        esic_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('PT')){
                                                        pt_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                    if(JSON.parse(existEarningHead.head_include_in).includes('TDS')){
                                                        tds_amount += parseFloat(emp.extra_earnings[i].amount);
                                                    }
                                                }
                                                total_earn_amount += parseFloat(emp.extra_earnings[i].amount);
                                                
                                            }
                                        }

                                    };

                                }
                            }
                            if(emp.reimbursements){
                                if(emp.reimbursements.length > 0){
                                    for (var r = 0; r < emp.reimbursements.length; r++)
                                    {
                                        exrning_heads.push({
                                            'head_id':emp.reimbursements[r]._id,
                                            'head_title':emp.reimbursements[r].head_id,
                                            'head_type': "reimbursement",
                                            'head_abbreviation':"RH1",
                                            'head_include_in':"[]",
                                            'amount': parseFloat(emp.reimbursements[r].amount),
                                        });
                                        total_earn_amount += parseFloat(emp.reimbursements[r].amount);
                                    }
                                }
                            }

                            if(salary_temp_data.restricted_pf === "yes")
                            {
                                var template_wage_ceiling = parseFloat(epfo_temp.wage_ceiling);
                                var avaiable_wage_amount= (template_wage_ceiling - pre_monthly_wage_amount);
                                var module_wage_amount=(pf_amount < parseFloat(avaiable_wage_amount) ? pf_amount  : parseFloat(avaiable_wage_amount) );
                                
                            }
                            else
                            {
                                var module_wage_amount= pf_amount;
                            }
                            var restrict_esic_wages= (parseFloat(esic_temp.wage_ceiling) > gross_salary ? esic_amount : 0 );


                            var total = total_earn_amount + total_duct_amount;
                            document.heads = exrning_heads;
                            document.ctc = total;
                            document.total_pf_bucket = pf_amount;
                            document.total_pf_wages = module_wage_amount;
                            document.total_esic_bucket = esic_amount;
                            document.total_esic_wages = restrict_esic_wages;
                            document.total_pt_wages = pt_amount;
                            document.total_tds_wages = tds_amount;
                            document.net_take_home = total_earn_amount;
                            document.gross_earning = total_earn_amount;
                            document.gross_deduct = total_duct_amount;
                            document.pt_amount = pt_amount;
                            
                            if(pre_salary_data)
                            {
                                pre_total_pt = (pre_salary_data.total_data.total_pt_amount?pre_salary_data.total_data.total_pt_amount:0);
                                if(pre_salary_data.reimbursment_report)
                                {
                                    pre_module_pt = (pre_salary_data.reimbursment_report.pt_amount?pre_salary_data.reimbursment_report.pt_amount:0);
                                    var total_earning_data={ 
                                        'total_earning': (total_earn_amount + (  pre_salary_data.total_data.total_earning - pre_salary_data.reimbursment_report.gross_earning)),
                                        'total_ctc': (total_earn_amount + (  pre_salary_data.total_data.total_ctc - pre_salary_data.reimbursment_report.ctc)),
                                        'total_pf_bucket':(pf_amount + (pre_salary_data.total_data.total_pf_bucket -  pre_salary_data.reimbursment_report.total_pf_bucket)),
                                        'total_pf_wages':(module_wage_amount + ( pre_salary_data.total_data.total_pf_wages -  pre_salary_data.reimbursment_report.total_pf_wages)),
                                        'total_esic_bucket':(esic_amount + (pre_salary_data.total_data.total_esic_bucket - pre_salary_data.reimbursment_report.total_esic_bucket)),
                                        'total_esic_wages':(restrict_esic_wages +  (pre_salary_data.total_data.total_esic_wages - pre_salary_data.reimbursment_report.total_esic_wages)),
                                        'total_tds_wages':(tds_amount +  (pre_salary_data.total_data.total_tds_wages - pre_salary_data.reimbursment_report.total_tds_wages)),
                                        'total_pt_wages':(pt_amount + (pre_salary_data.total_data.total_pt_wages - pre_salary_data.reimbursment_report.total_pt_wages)),
                                        'bank_ins_referance_id':pre_salary_data.total_data.bank_ins_referance_id == '' ? '' :  pre_salary_data.total_data.bank_ins_referance_id,
                                        'pf_challan_referance_id':pre_salary_data.total_data.pf_challan_referance_id == '' ? '' :  pre_salary_data.total_data.pf_challan_referance_id,
                                        'esic_challan_referance_id':pre_salary_data.total_data.esic_challan_referance_id == '' ? '' :  pre_salary_data.total_data.esic_challan_referance_id,
                                    };
                                }
                                else
                                {
                                    var total_earning_data={ 
                                        'total_earning':  (total_earn_amount +   pre_salary_data.total_data.total_earning),
                                        'total_ctc': (total_earn_amount + pre_salary_data.total_data.total_ctc),
                                        'total_pf_bucket':(pf_amount + pre_salary_data.total_data.total_pf_bucket),
                                        'total_pf_wages': (module_wage_amount +  pre_salary_data.total_data.total_pf_wages),
                                        'total_esic_bucket': (esic_amount + pre_salary_data.total_data.total_esic_bucket),
                                        'total_esic_wages': (restrict_esic_wages +  pre_salary_data.total_data.total_esic_wages),
                                        'total_tds_wages': (tds_amount + pre_salary_data.total_data.total_tds_wages),
                                        'total_pt_wages': (pt_amount + pre_salary_data.total_data.total_pt_wages),
                                        'bank_ins_referance_id': '' ,
                                        'pf_challan_referance_id': '' ,
                                        'esic_challan_referance_id': '' ,
                                    };
                                } 
                            }
                            else
                            {
                                var total_earning_data={ 
                                    'total_earning':  total_earn_amount,
                                    'total_ctc':  total_earn_amount,
                                    'total_pf_bucket':pf_amount,
                                    'total_pf_wages': module_wage_amount,
                                    'total_esic_bucket': esic_amount,
                                    'total_esic_wages': restrict_esic_wages,
                                    'total_tds_wages': tds_amount,
                                    'total_pt_wages': pt_amount,
                                    'bank_ins_referance_id': '' ,
                                    'pf_challan_referance_id': '' ,
                                    'esic_challan_referance_id': '' ,
                                };
                            }
                            document.esic_data =await Site_helper.calculate_esic(esic_temp, restrict_esic_wages,gross_salary);
                            document.pf_data = await Site_helper.calculate_pf( epfo_temp, module_wage_amount, salary_temp_data, empdata.employee_details.employment_hr_details);

                            total_earning_data.esic_data =await Site_helper.calculate_esic(esic_temp, total_earning_data.total_esic_wages,gross_salary);
                            total_earning_data.pf_data = await Site_helper.calculate_pf( epfo_temp, total_earning_data.total_pf_wages, salary_temp_data, empdata.employee_details.employment_hr_details);                

                            var p_tax_amount = await Site_helper.calculate_pt(req,currdate,emp_state,total_earning_data.total_pt_wages?total_earning_data.total_pt_wages:0);                
                            var module_pt_amount= (p_tax_amount - (pre_total_pt - pre_module_pt));
                            document.pt_amount= module_pt_amount;
                            total_earning_data.total_pt_amount= p_tax_amount;
                            
                            var pre_extra_earning_data=emp.employee_monthly_reports;
                            if(pre_extra_earning_data)
                            {
                                if(pre_extra_earning_data.reimbursment_report)
                                {
                                    document.bank_ins_referance_id = pre_extra_earning_data.reimbursment_report.bank_ins_referance_id == '' ? '' :  pre_extra_earning_data.reimbursment_report.bank_ins_referance_id;
                                    document.pf_challan_referance_id = pre_extra_earning_data.reimbursment_report.pf_challan_referance_id == '' ? '' :  pre_extra_earning_data.reimbursment_report.pf_challan_referance_id;
                                    document.esic_challan_referance_id = pre_extra_earning_data.reimbursment_report.esic_challan_referance_id == '' ? '' :  pre_extra_earning_data.reimbursment_report.esic_challan_referance_id;
                                }
                            }
                            var emp_data={
                                _id:emp._id,
                                emp_id:emp.emp_id,
                                emp_first_name:emp.emp_first_name,
                                emp_last_name:emp.emp_last_name,
                                emp_emp_dob:emp.emp_dob,
                                emp_pan_no:emp.pan_no,
                                emp_aadhar_no:emp.aadhar_no,
                                emp_mob:emp.mobile_no,
                                emp_email_id:emp.email_id,
                                new_pf_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.new_pf_no:'NA'),
                                esic_no:(emp.employee_details.employment_details?emp.employee_details.employment_details.esic_no:'NA'),
                                date_of_join:emp.employee_details.employment_hr_details.date_of_join,
                                sex:emp.sex,
                                age:emp.age,
                                EPF:emp.employee_details.employment_hr_details.pf_applicable,
                                EPS:emp.employee_details.employment_hr_details.pension_applicable,
                                Restrict_PF:emp.employee_details.template_data.salary_temp_data.restricted_pf,
                                ESIC:(gross_salary >  esic_temp.wage_ceiling ? 'NO' : 'YES'),
                                Reg_Type:emp.employee_details.template_data.attendance_temp_data.register_type,
                                emp_uan_no:(emp.employee_details.pf_esic_details ? emp.employee_details.pf_esic_details.curr_er_epfo_details ? emp.employee_details.pf_esic_details.curr_er_epfo_details.uan_no :'NA' :'NA'),
                                attendance_summaries:emp.attendance_summaries[0],
                                hod: emp.hod ? emp.hod.first_name+" "+emp.hod.last_name : "",
                                branch:emp.branch,
                                designation:emp.designation,
                                department:emp.department,
                                client:emp.client,
                            };
                            var insert_data = {
                                corporate_id:empdata.corporate_id,
                                emp_db_id:mongoose.Types.ObjectId(empdata._id),
                                emp_id: empdata.emp_id,
                                wage_month:attendence_month,
                                wage_year:attendence_year,
                                total_data:total_earning_data,
                                emp_data:emp_data,
                                reimbursment_report:document,
                                status:'active',
                            };
                            var where_condition={'emp_id':emp.emp_id,wage_month:attendence_month,wage_year:attendence_year,corporate_id:emp.corporate_id};
                            await EmployeeMonthlyReport.findOneAndUpdate(where_condition,insert_data,{upsert: true, new: true, setDefaultsOnInsert: true});
                        }
                    }
                })).then(async (emps) => {
                    next();
                    // return resp.status(200).json({ status: "success", message: 'Extra earning sheet generated successfully.' });
                });
            });
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_reimbursement_emp_pending: async function (req, resp, next) {
        try{
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
                page: req.body.pageno?req.body.pageno:1,
                limit: req.body.perpage?req.body.perpage:perpage,
                sort:    sortoption,
            };
            var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            if(wage_month){
                wage_month = wage_month.toString();
            }
            else{
                wage_month = "0";
            }
            if(wage_year){
                wage_year = wage_year.toString();
            }
            var filter_option={};
            var document={};
            if(wage_month && wage_year){
                var search_option= {
                    $match:{
                        $and:[
                        {'corporate_id':req.authData.corporate_id},
                        {"wage_month": {$eq:wage_month}},
                        {"wage_year": {$eq:wage_year}},
                        // {"status": {$eq:"pending"}},
                        ]
                    }
                };
            }
            else{
                var search_option= {
                    $match:{
                        $and:[
                        {'corporate_id':req.authData.corporate_id},
                        // {"status": {$eq:"pending"}},
                        ]
                    }
                };
            }
            if(req.body.status){
                search_option.$match.status = { $eq: req.body.status };
            }
            var search_option_details= {$match: {}};
            if (req.body.searchkey) {
                search_option_details= {
                    $match:{
                        "employees.emp_id" : { $eq: req.body.searchkey },
                        "employees.corporate_id": req.authData.corporate_id,
                        "employees.parent_hods": { $in: [req.authId] },
                    }
                  };
            } else {
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
                if (req.body.client_id) {
                  var client_ids = JSON.parse(req.body.client_id);
                  client_ids = client_ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                  });
                  search_option_details.$match[
                    "client._id"
                  ] = { $in: client_ids };
                }
                if (req.body.hod_id) {
                  var hod_ids = JSON.parse(req.body.hod_id);
                  hod_ids = hod_ids.map(function (el) {
                    return mongoose.Types.ObjectId(el);
                  });
                   search_option_details.$match[
                    "employees.emp_hod"
                  ] = { $in: hod_ids };
                }
            }

            var myAggregate = ReimbursementTemp.aggregate([search_option,
            {
                $lookup: {
                    from: "employees",
                    localField: "emp_id",
                    foreignField: "emp_id",
                    as: "employees",
                },
            },
            {
                $lookup: {
                    from: "employee_details",
                    localField: "employees._id",
                    foreignField: "employee_id",
                    as: "employee_details",
                },
            },
            {
              $lookup: {
                from: "clients",
                localField: "employees.client_code",
                foreignField: "_id",
                as: "client",
              },
            },
            {
              $lookup: {
                from: "staffs",
                localField: "employees.emp_hod",
                foreignField: "_id",
                as: "hod",
              },
            },
            search_option_details,
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
              },
            },
            {
                "$project": 
                { 
                    _id:1,
                    corporate_id:1,
                    emp_id:1,
                    head_id:1,
                    amount:1,
                    wage_month:1,
                    wage_year:1,
                    document:1,
                    status:1,
                    created_at:1,
                    employee_remark:1,
                    company_remark:1,
                    "employees._id":1,
                    "employees.corporate_id":1,
                    "employees.userid":1,
                    "employees.emp_id":1,
                    "employees.emp_first_name":1,
                    "employees.emp_last_name":1,
                    "employees.emp_dob":1,
                    "employees.pan_no":1,
                    "employees.aadhar_no":1,
                    "employees.email_id":1,
                    "employees.empid":1,
                    "employees.client_code":1,
                    "employees.client_id":1,
                    "employees.is_hod":1,
                    "employees.emp_hod":1,
                    "employees.approval_status":1,
                    // extra_earning_head:1
                    "hod.first_name": 1,
                    "hod.last_name": 1,
                    "client._id": 1,
                    "client.client_code": 1,
                    "employee_details._id": 1,
                    "employee_details.contract": 1,
                    "employee_details.employment_hr_details": 1,
                    "branch._id": 1,
                    "branch.branch_name": 1,
                    "department._id": 1,
                    "department.department_name": 1,
                    "designation._id": 1,
                    "designation.designation_name": 1,
                }
            },
            ]);
            ReimbursementTemp.aggregatePaginate(myAggregate,options, async function (err, reimbursement) {
                if (err) return resp.json({ status: "error", message: err.message });
                return resp.status(200).json({ status: "success", data: reimbursement });
            });
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_reimbursement_emp: async function (req, resp, next) {
        try{
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
            page: req.body.pageno?req.body.pageno:1,
            limit: req.body.perpage?req.body.perpage:perpage,
            sort:    sortoption,
        };
        var filter_option={};
        var document={};
        var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
        var search_option_details= {$match: {}};
        if(req.body.searchkey)
        {
            search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
        }
        else
        {
            if(req.body.emp_name)
            {
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
                search_option.$match.emp_name={"$regex": req.body.emp_name, "$options": "i"};
            }
            if(req.body.emp_last_name)
            {
                search_option.$match.emp_last_name={"$regex": req.body.emp_last_name, "$options": "i"};
            }
            if(req.body.email_id)
            {
                search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
            }
            if(req.body.emp_id)
            {
                search_option.$match.emp_id={"$regex": req.body.emp_id, "$options": "i"};
            }
            if(req.body.designation_id)
            {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
            }
            if(req.body.department_id)
            {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
            }
            if(req.body.branch_id)
            {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
            }
            if(req.body.client_code)
            {
                var client_codes=JSON.parse(req.body.client_code);
                search_option.$match.client_code={$in: client_codes};
            }
            if(req.body.hod_id)
            {
                var hod_ids=JSON.parse(req.body.hod_id);
                hod_ids = hod_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option.$match.emp_hod={$in: hod_ids};
            }
        }
            
            var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
            if(wage_month){
                wage_month = wage_month.toString();
            }
            else{
                wage_month = "0";
            }
            if(wage_year){
                wage_year = wage_year.toString();
            }
            var filter_option={};
            var document={};
            // var search_option= {
            //     $match:{
            //         $and:[
            //         // {'emp_id':employeeData.emp_id}, 
            //         {'corporate_id':req.authData.corporate_id}
            //         ]
            //     }
            // };
            
            var status = ['pending','active'];
            if(req.body.approval_status){
                if(req.body.approval_status == 'approved' || req.body.approval_status == 'active'){
                    status = ['active'];
                    // search_option_details.$match['reimbursements._id'] = { $exists: true, $ne: null };
                }
                else{
                    status = ['pending'];
                }                
            }
            if(req.body.monthly_reports_generate == 'yes'){
                search_option_details.$match['employee_monthly_reports._id']=  { "$exists": true }; 
            }
            
            
            // search_option_details.$match['reimbursements._id'] = { $exists: true, $ne: null };
            var check_search_option_details = {
                $match: {
                    $or: [
                        { "reimbursements._id" : { $exists: true, $ne: null }  },
                        { "extra_earnings._id" : { $exists: true, $ne: null } },
                    ]
                }
            };
            var myAggregate = Employee.aggregate([
                search_option,
                {
                    $lookup: {
                        from: "employee_monthly_reports",
                        "let": { "emp_id_var": "$_id"},
                        pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                                $and: [
                                {"reimbursment_report" :{ $exists: true, $ne: null }},
                                {'wage_month': {$eq: parseInt(wage_month) }},
                                {'wage_year': {$eq: parseInt(wage_year) }}
                                ],
                            },
                        },
                        ],
                        as: "employee_monthly_reports",
                    },
                },
                {$lookup:{
                  from: 'bank_instructions',
                  localField: 'employee_monthly_reports.reimbursment_report.bank_ins_referance_id',
                  foreignField: 'file_id',
                  as: 'bank_instructions'
                }},
                {
                    $lookup: {
                        from: "reimbursements",
                        "let": { "emp_id_var": "$emp_id"},
                        pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] },
                                $and: [
                                {'status':{$in:status}},
                                {'wage_month': {$eq: wage_month.toString() }},
                                {'wage_year': {$eq: wage_year.toString() }}
                                ],
                            },
                        },
                        ],
                        as: "reimbursements",
                    },
                },
                {
                    $lookup:{
                        from: 'extra_earnings',
                        "let": { "emp_db_idVar": "$emp_id" },
                        "pipeline": [
                            { "$match": { 
                                    $and :[
                                        {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                                        {"wage_month": wage_month.toString()},
                                        {"wage_year": wage_year.toString()},
                                        {status:"active"},
                                    ] 
                                } 
                            }
                        ],
                        as: 'extra_earnings',
                    }
                },

                search_option_details,
                check_search_option_details,
                {
                    $addFields: {
                        employee_monthly_reports: {
                            $arrayElemAt: ["$employee_monthly_reports", 0],
                        },
                        bank_instructions: {
                            $arrayElemAt: ["$bank_instructions", 0],
                        },
                    },
                },
                {
                    "$project": 
                    { 
                        "_id":1,
                        "corporate_id":1,
                        "userid":1,
                        "emp_id":1,
                        "emp_first_name":1,
                        "emp_last_name":1,
                        "emp_dob":1,
                        "pan_no":1,
                        "aadhar_no":1,
                        "email_id":1,
                        "empid":1,
                        "client_code":1,
                        "approval_status":1,
                        "reimbursements":1,
                        "extra_earnings":1,
                        "employee_monthly_reports.reimbursment_report":1,
                        "bank_instructions":1,
                        "wage_month":wage_month ? wage_month :  new Date().getMonth(),
                        "wage_year":wage_year ? wage_year : new Date().getFullYear(),
                    }
                },
                ]);
            Employee.aggregatePaginate(myAggregate,options, async function (err, earning) {
                if (err) return resp.json({ status: "error", message: err.message });
                if(earning.docs){
                    if(earning.docs.length > 0){
                        await Promise.all(earning.docs.map(async function(value,key) {
                            var total = 0;
                            if(value.reimbursements.length > 0){
                                value.reimbursements.map(function(reimbursement){
                                    if(reimbursement.status == 'active'){
                                        total += parseFloat(reimbursement.amount);
                                    }
                                });
                            }
                            if(value.extra_earnings){
                                if(value.extra_earnings.length > 0){
                                    for (var i = 0; i < value.extra_earnings.length; i++) {
                                        if(value.extra_earnings[i].head_id){
                                            var existEarningHead = await EaxtraEarningHead.findOne({'_id':mongoose.Types.ObjectId(value.extra_earnings[i].head_id), 'earning_status':{$eq: "reimbursement"}});
                                            if(existEarningHead){
                                                total += parseFloat(value.extra_earnings[i].amount);
                                            }
                                        }

                                    };

                                }
                            }
                            value.total_amount = total;
                        }));
                    }
                }
                return resp.status(200).json({ status: "success", data: earning });
            });
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_apply_reimbursement: async function (req, resp, next) {
        try{
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
            page: req.body.pageno?req.body.pageno:1,
            limit: req.body.perpage?req.body.perpage:perpage,
            sort:    sortoption,
        };
        var filter_option={};
        var document={};
        var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
        var search_option_details= {$match: {}};
        if(req.body.searchkey)
        {
            search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
        }
        else
        {
            if(req.body.designation_id)
            {
                var designation_ids=JSON.parse(req.body.designation_id);
                designation_ids = designation_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.designation']=  {$in: designation_ids};
            }
            if(req.body.department_id)
            {
                var department_ids=JSON.parse(req.body.department_id);
                department_ids = department_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.department']=  {$in: department_ids};
            }
            if(req.body.branch_id)
            {
                var branch_ids=JSON.parse(req.body.branch_id);
                branch_ids = branch_ids.map(function(el) { return mongoose.Types.ObjectId(el) })
                search_option_details.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
            }
        }
            
            var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;

            // var check_search_option_details = {
            //     $match: {
            //         $or: [
            //             { "reimbursements._id" : { $exists: true, $ne: null }  },
            //             { "extra_earnings._id" : { $exists: true, $ne: null } },
            //         ]
            //     }
            // };

            var myAggregate = Employee.aggregate([
                search_option,
                // {
                //     $lookup: {
                //         from: "employee_monthly_reports",
                //         "let": { "emp_id_var": "$_id"},
                //         pipeline: [
                //         {
                //             $match: {
                //                 "$expr": { "$eq": ["$emp_db_id", "$$emp_id_var"] },
                //                 $and: [
                //                 {"reimbursment_report" :{ $exists: true, $ne: null }},
                //                 {'wage_month': {$eq: parseInt(wage_month) }},
                //                 {'wage_year': {$eq: parseInt(wage_year) }}
                //                 ],
                //             },
                //         },
                //         ],
                //         as: "employee_monthly_reports",
                //     },
                // },
                {$lookup:{
                  from: 'bank_instructions',
                  localField: 'employee_monthly_reports.reimbursment_report.bank_ins_referance_id',
                  foreignField: 'file_id',
                  as: 'bank_instructions'
                }},
                {
                    $lookup: {
                        from: "reimbursements",
                        "let": { "emp_id_var": "$emp_id"},
                        pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$emp_id", "$$emp_id_var"] },
                                $and: [
                                {'status':{$eq:"active"}},
                                {'wage_month': {$eq: wage_month.toString() }},
                                {'wage_year': {$eq: wage_year.toString() }}
                                ],
                            },
                        },
                        ],
                        as: "reimbursements",
                    },
                },
                {
                    $lookup:{
                        from: 'extra_earnings',
                        "let": { "emp_db_idVar": "$emp_id" },
                        "pipeline": [
                            { "$match": { 
                                    $and :[
                                        {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
                                        {"wage_month": wage_month.toString()},
                                        {"wage_year": wage_year.toString()},
                                        {status:"active"},
                                    ] 
                                } 
                            }
                        ],
                        as: 'extra_earnings',
                    }
                },

                search_option_details,
                // check_search_option_details,
                {
                    $addFields: {
                        // employee_monthly_reports: {
                        //     $arrayElemAt: ["$employee_monthly_reports", 0],
                        // },
                        bank_instructions: {
                            $arrayElemAt: ["$bank_instructions", 0],
                        },
                    },
                },
                {
                    "$project": 
                    { 
                        "_id":1,
                        "corporate_id":1,
                        "userid":1,
                        "emp_id":1,
                        "emp_first_name":1,
                        "emp_last_name":1,
                        "emp_dob":1,
                        "pan_no":1,
                        "aadhar_no":1,
                        "email_id":1,
                        "empid":1,
                        "client_code":1,
                        "approval_status":1,
                        "reimbursements":1,
                        "extra_earnings":1,
                        // "employee_monthly_reports.reimbursment_report":1,
                        "bank_instructions":1,
                        "wage_month":wage_month ? wage_month :  new Date().getMonth(),
                        "wage_year":wage_year ? wage_year : new Date().getFullYear(),
                    }
                },
                ]);
            Employee.aggregatePaginate(myAggregate,options, async function (err, earning) {
                if (err) return resp.json({ status: "error", message: err.message });
                // if(earning.docs){
                //     if(earning.docs.length > 0){
                //         await Promise.all(earning.docs.map(async function(value,key) {
                //             var total = 0;
                //             if(value.reimbursements.length > 0){
                //                 value.reimbursements.map(function(reimbursement){
                //                     if(reimbursement.status == 'active'){
                //                         total += parseFloat(reimbursement.amount);
                //                     }
                //                 });
                //             }
                //             if(value.extra_earnings){
                //                 if(value.extra_earnings.length > 0){
                //                     for (var i = 0; i < value.extra_earnings.length; i++) {
                //                         if(value.extra_earnings[i].head_id){
                //                             var existEarningHead = await EaxtraEarningHead.findOne({'_id':mongoose.Types.ObjectId(value.extra_earnings[i].head_id), 'earning_status':{$eq: "reimbursement"}});
                //                             if(existEarningHead){
                //                                 total += parseFloat(value.extra_earnings[i].amount);
                //                             }
                //                         }

                //                     };

                //                 }
                //             }
                //             value.total_amount = total;
                //         }));
                //     }
                // }
                return resp.status(200).json({ status: "success", employees: earning });
            });
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    add_reimbursement: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                emp_id: 'required',
                head_id:'required',
                amount:'required',
                wage_month:'required',
                wage_year:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var employeeData = await Employee.findOne({'emp_id':req.body.emp_id});
                if(!employeeData){
                    return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
                }
                var document =
                {
                    corporate_id:employeeData.corporate_id,
                    emp_id:employeeData.emp_id,
                    head_id:req.body.head_id,
                    amount:req.body.amount,
                    wage_month:req.body.wage_month,
                    wage_year:req.body.wage_year,
                    employee_remark: req.body.remark,
                    status:'active',
                    created_at: Date.now()
                }
                var obj = req.files;
                if(obj){
                    await Promise.all(
                        obj.map(async (file) => {
                            var file_data = {
                                corporate_id: employeeData.corporate_id,
                                emp_db_id: employeeData._id,
                                file_name: file.originalname,
                                file_type: file.mimetype,
                                file_size: file.size,
                                file_path: file.path ? file.path : "NA",
                                status: "active",
                                created_at: Date.now(),
                            };
                            if (file.fieldname === "extra_earnings_document") {
                                file_data["folder_name"] = "Extra Earning File Image";
                                file_data["upload_for"] = "extra_earnings_file_image";
                                document["document"] = file.path;
                            }
                            var fileuploaddata = await Site_helper.upload_file_manager(file_data);
                        })
                        );
                }
                Reimbursement.create(document,  function (err, extra_earning) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Reimbursement created successfully", extra_earning: extra_earning});
                })
            }
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    update_reimbursement: async function (req, resp) {
        try{
            const items = JSON.parse(req.body.earning_data) ;
            for (const item of items) {
               var reimbursement = await Reimbursement.findOne({"_id":mongoose.Types.ObjectId(item?.reimbursement_id)});

                reimbursement.head_id = item.head_id,
                reimbursement.amount = item.amount,
                reimbursement.wage_month = item.wage_month,
                reimbursement.wage_year = item.wage_year,
                reimbursement.updated_at =  Date.now()

                await reimbursement.save();
            }

            return resp.status(200).send({ status: 'success',message:"Reimbursement Updated successfully"});

            // if(items.length){
                // await Promise.all(items.map(async function(item, index) {
                //     var reimbursement = await Reimbursement.findOne({"_id":mongoose.Types.ObjectId(item?.reimbursement_id)});
                //     if(reimbursement){
                //         // var employeeData = await Employee.findOne({"emp_id":reimbursement.emp_id});
                //         reimbursement.head_id = mongoose.Types.ObjectId(req.body.head_id[index]),
                //         reimbursement.amount = req.body.amount[index],
                //         reimbursement.wage_month = req.body.wage_month[index],
                //         reimbursement.wage_year = req.body.wage_year[index],
                //         reimbursement.updated_at =  Date.now()

                //         await reimbursement.save();
                //         return reimbursement;
                //     }
                // }));
            // }
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_earning_and_reimbursement_data:async function(req, resp){
      try {
        const v = new Validator(req.body, {
          wage_month: 'required',
          wage_year: 'required',
          pageno: 'required',
          type: 'required|in:extra_earning,reimbursement',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
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
              sort:    sortoption,
            };
            var filter_option={};
            var document={};
            var search_option= {$match: {$and:[ {'corporate_id':req.authData.corporate_id},{'parent_hods':{$in: [req.authData.user_id] }},{'approval_status':'approved'}]}};
            var search_option_details= {$match: {}};
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey },'corporate_id':req.authData.corporate_id }};    
            }
            else
            {
              var query_data= await Site_helper.getEmpFilterData(req,search_option,search_option_details);
              search_option_details=query_data.search_option_details;
              search_option=query_data.search_option;
            }
            // console.log(wage_month);
            // search_option_details.$match['employee_monthly_reports.wage_month']= parseInt(wage_month);
            // search_option_details.$match['employee_monthly_reports.wage_year']=  parseInt(wage_year);
            if(req.body.type == 'extra_earning')
            {
              search_option_details.$match['employee_monthly_reports.extra_earning_report']=  {$exists: true , $ne: null} ;
            }
            else
            {
              search_option_details.$match['employee_monthly_reports.reimbursment_report']=  {$exists: true , $ne: null} ;
            }
            var myAggregate = Employee.aggregate([
              search_option,
              {$lookup:{
                from: 'employee_details',
                localField: '_id',
                foreignField: 'employee_id',
                as: 'employee_details',
              }},
              // {$lookup:{
              //   from: 'employee_monthly_reports',
              //   localField: '_id',
              //   foreignField: 'emp_db_id',
              //   as: 'employee_monthly_reports',
              // }},
              {
                $lookup:{
                    from: 'employee_monthly_reports',
                    "let": { "emp_db_idVar": "$_id" },
                    "pipeline": [
                        { "$match": { 
                                $and :[
                                    {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                    {"wage_month": parseInt(wage_month)},
                                    {"wage_year": parseInt(wage_year)},
                                ],
                            } 
                        }
                    ],
                    as: 'employee_monthly_reports',
                }
            },
              
              search_option_details,              
              { "$addFields": {
                "employee_details": {
                    "$arrayElemAt": [ "$employee_details", 0 ]
                },
                "employee_monthly_reports": {
                    "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                }
                }
              },
              
              { "$project": { 
                "_id":1,
                "emp_first_name":1,
                "emp_last_name":1,
                "emp_id":1,
                "emp_data":{$ifNull: [ "$employee_monthly_reports.emp_data", null]},
                "UAN_no":{ $ifNull: [ "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no", null ] },
                "employee_details":1,
                report:{
                  $cond: { 
                    if: { $eq: [ "extra_earning", req.body.type ] }, 
                        then: { $ifNull: [ "$employee_monthly_reports.extra_earning_report", {} ] },
                        else: { $ifNull: [ "$employee_monthly_reports.reimbursment_report", {} ]}
                    }
                },
                total_report:{ $ifNull: [ "$employee_monthly_reports.total_data", {} ] },
                //master_report:{ $ifNull: [ "$employee_monthly_reports.master_report", {} ] },
                // "employee_monthly_reports":1,
                "corporate_id":1,
                bank_details:{ $ifNull: [ "$employee_details.bank_details", {} ] } ,
                }
              },
              ]);
              Employee.aggregatePaginate(myAggregate,options, async function (err, master_data) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"", master_data: master_data });
              });            
        }
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
      }
    },

    // report extra earning
    extra_earning_report: async function (req, resp, next) {
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
                var start_month = parseInt(req.body.wage_month_from);
                var start_year = parseInt(req.body.wage_year_from);
                var end_month = parseInt(req.body.wage_month_to);
                var end_year = parseInt(req.body.wage_year_to);
               
                var search_option = {
                    $match: {
                        $and: [
                        { corporate_id: req.authData.corporate_id },
                        { parent_hods: { $in: [req.authData.user_id] } },
                        { approval_status: { $in: ['active','approved'] } },
                        ],
                    },
                };
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
                if(req.body.generate == 'excel'){
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
                }
                search_option_details.$match['employee_monthly_reports']=  {$exists: true , $ne: []} ;
                // console.log(search_option_details);
                var extraEarningHeads = await EaxtraEarningHead.find({  status:'active' ,"corporate_id":req.authData.corporate_id, "earning_status":{$in:['earning','deduction']} },'_id head_name abbreviation earning_status');
                if(req.body.type == 'extra_earning'){
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
                            $lookup:{
                                from: 'employee_monthly_reports',
                                "let": { "emp_db_idVar": "$_id"},
                                "pipeline": [
                                { 
                                    "$match": {
                                        $and :[
                                            {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                            {'extra_earning_report' : {$exists: true , $ne: null}},
                                            // {'extra_earning_report.bank_ins_referance_id' : { $ne: '' }},
                                            {$or:[ 
                                                    {'wage_year': {$gt: start_year }}, 
                                                    { $and:[
                                                        {'wage_year': {$gte: start_year }},
                                                        {'wage_month': {$gte: start_month }}
                                                        ]
                                                    } 
                                                ]
                                            },
                                            { $or:[ 
                                                    {'wage_year': {$lt: end_year }}, 
                                                    { $and:[
                                                        {'wage_year': {$lte: end_year }},
                                                        {'wage_month': {$lte: end_month }}
                                                        ]
                                                    } 
                                                ]
                                            }
                                        ] 
                                    } 
                                }],
                                as: 'employee_monthly_reports',
                            }
                        },
                        search_option_details,
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
                                approval_status: 1,
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
                                "employee_monthly_reports.wage_month":1,
                                "employee_monthly_reports.wage_year":1,
                                "employee_monthly_reports.extra_earning_report":1,
                            },
                        },
                    ]);
                }
                else{
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
                            $lookup:{
                                from: 'employee_monthly_reports',
                                "let": { "emp_db_idVar": "$_id"},
                                "pipeline": [
                                { 
                                    "$match": {
                                        $and :[
                                            {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                            {'reimbursment_report' : {$exists: true , $ne: null}},
                                            // {'reimbursment_report.bank_ins_referance_id' : { $ne: '' }},
                                            {$or:[ 
                                                    {'wage_year': {$gt: start_year }}, 
                                                    { $and:[
                                                        {'wage_year': {$gte: start_year }},
                                                        {'wage_month': {$gte: start_month }}
                                                        ]
                                                    } 
                                                ]
                                            },
                                            { $or:[ 
                                                    {'wage_year': {$lt: end_year }}, 
                                                    { $and:[
                                                        {'wage_year': {$lte: end_year }},
                                                        {'wage_month': {$lte: end_month }}
                                                        ]
                                                    } 
                                                ]
                                            }
                                        ] 
                                    } 
                                }],
                                as: 'employee_monthly_reports',
                            }
                        },
                        search_option_details,
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
                                approval_status: 1,
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
                                "employee_monthly_reports.wage_month":1,
                                "employee_monthly_reports.wage_year":1,
                                "employee_monthly_reports.reimbursment_report":1,
                            },
                        },
                    ]);
                }

                if(req.body.generate == 'excel'){
                    var allExtraEarningData = [];
                    myAggregate.then(async (emp_report_data)=>{
                        var field_list_array=["emp_id","name","wage_month","department","designation","branch","client","pf_ee","pf_er","esi_ee","esi_er","total_amount"];
                        var wb = new xl.Workbook();
                        var ws = wb.addWorksheet("Sheet 1");
                        var clmn_id = 1;
                        ws.cell(1, clmn_id++).string("SL");
                        if(field_list_array.includes('emp_id'))
                        {
                            ws.cell(1, clmn_id++).string("Emp Id");
                        }
                        if(field_list_array.includes('name'))
                        {
                            ws.cell(1, clmn_id++).string("Name");
                        }
                        if(field_list_array.includes('wage_month'))
                        {
                            ws.cell(1, clmn_id++).string("Wage Month");
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
                        if(field_list_array.includes('client'))
                        {
                            ws.cell(1, clmn_id++).string("Client");
                        }
                        if(req.body.type == 'extra_earning'){
                            if(extraEarningHeads){
                                if(extraEarningHeads.length > 0){
                                    extraEarningHeads.map(function(heads){
                                        ws.cell(1, clmn_id++).string(heads.head_name);
                                    });
                                }
                            }
                        }
                        else{
                            ws.cell(1, clmn_id++).string("reimbursement");
                        }
                        if(field_list_array.includes('pf_ee'))
                        {
                            ws.cell(1, clmn_id++).string("PF EE");
                        }
                        if(field_list_array.includes('pf_er'))
                        {
                            ws.cell(1, clmn_id++).string("PF ER");
                        }
                        if(field_list_array.includes('esi_ee'))
                        {
                            ws.cell(1, clmn_id++).string("ESI EE");
                        }
                        if(field_list_array.includes('esi_er'))
                        {
                            ws.cell(1, clmn_id++).string("ESI ER");
                        }
                        if(field_list_array.includes('total_amount'))
                        {
                            ws.cell(1, clmn_id++).string("Total Amount");
                        }
                        await Promise.all(emp_report_data.map(async function(employees, index){
                            if(employees.employee_monthly_reports){
                                await Promise.all(employees.employee_monthly_reports.map(async function(monthly_report,index_log){
                                    var index_val = 2;
                                    index_val = index_val + index + index_log;
                                    var clmn_emp_id=1;
                                    ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                                    if(field_list_array.includes('emp_id'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(employees.emp_id ? String(employees.emp_id) : "");
                                    }
                                    if(field_list_array.includes('name'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(employees.emp_first_name ? String(employees.emp_first_name+" "+employees.emp_last_name) : "");
                                    }
                                    if(field_list_array.includes('wage_month'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(monthly_report.wage_month ? String(monthly_report.wage_month) : "");
                                    }
                                    if(field_list_array.includes('department'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(employees.department ? String(employees.department.department_name) : "");
                                    }
                                    if(field_list_array.includes('designation'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(employees.designation ? String(employees.designation.designation_name) : "");
                                    }
                                    if(field_list_array.includes('branch'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(employees.branch ? String(employees.branch.branch_name) : "");
                                    }
                                    if(field_list_array.includes('client'))
                                    {
                                        ws.cell(index_val, clmn_emp_id++).string(employees.client ? String(employees.client.client_code) : "");
                                    }
                                    if(req.body.type == 'extra_earning'){
                                        if(monthly_report.extra_earning_report){
                                            if(extraEarningHeads){
                                                if(extraEarningHeads.length > 0){
                                                    await Promise.all(extraEarningHeads.map(async function(heads){
                                                        if(monthly_report.extra_earning_report.heads){
                                                            var m_head_amount = 0;
                                                            await Promise.all(monthly_report.extra_earning_report.heads.map(async function(m_head){
                                                                if(mongoose.Types.ObjectId(heads._id).equals(mongoose.Types.ObjectId(m_head.head_id))){
                                                                    m_head_amount += parseFloat(m_head.amount);
                                                                }
                                                                else{
                                                                    m_head_amount += parseFloat(m_head.amount);
                                                                }
                                                            }));
                                                            var heads_data = monthly_report.extra_earning_report.heads.find(element => mongoose.Types.ObjectId(heads._id).equals(mongoose.Types.ObjectId(element['head_id'])));
                                                            if(heads_data){
                                                                ws.cell(index_val, clmn_emp_id++).string(m_head_amount ? String(m_head_amount) : "");
                                                            }
                                                            else{
                                                                ws.cell(index_val, clmn_emp_id++).string("0");
                                                            }
                                                        }
                                                    }));

                                                }
                                            }
                                        }
                                        else{
                                            if(extraEarningHeads){
                                                if(extraEarningHeads.length > 0){
                                                    extraEarningHeads.map(function(heads){
                                                        ws.cell(index_val, clmn_emp_id++).string("0");
                                                    });
                                                }
                                            }
                                        }

                                        if(field_list_array.includes('pf_ee'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.extra_earning_report ? String(monthly_report.extra_earning_report.pf_data.emoloyee_contribution) : "0");
                                        }
                                        if(field_list_array.includes('pf_er'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.extra_earning_report ? String(monthly_report.extra_earning_report.pf_data.emoloyer_pf_contribution) : "0");
                                        }
                                        if(field_list_array.includes('esi_ee'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.extra_earning_report ? String(monthly_report.extra_earning_report.esic_data.emoloyee_contribution) : "0");
                                        }
                                        if(field_list_array.includes('esi_er'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.extra_earning_report ? String(monthly_report.extra_earning_report.esic_data.emoloyer_contribution) : "0");
                                        }
                                        if(field_list_array.includes('total_amount'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.extra_earning_report ? String(monthly_report.extra_earning_report.net_take_home) : "0");
                                        }
                                    }
                                    else{
                                        if(monthly_report.reimbursment_report){
                                            if(monthly_report.reimbursment_report.heads){
                                                var totalHeadAmt = 0;
                                                monthly_report.reimbursment_report.heads.map(function(hd){
                                                    totalHeadAmt += parseFloat(hd.amount);
                                                });
                                                ws.cell(index_val, clmn_emp_id++).string(totalHeadAmt ? String(totalHeadAmt) : "0");
                                            }
                                        }
                                        else{
                                            ws.cell(index_val, clmn_emp_id++).string("0");
                                        }

                                        if(field_list_array.includes('pf_ee'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.reimbursment_report ? String(monthly_report.reimbursment_report.pf_data.emoloyee_contribution) : "0");
                                        }
                                        if(field_list_array.includes('pf_er'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.reimbursment_report ? String(monthly_report.reimbursment_report.pf_data.emoloyer_pf_contribution) : "0");
                                        }
                                        if(field_list_array.includes('esi_ee'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.reimbursment_report ? String(monthly_report.reimbursment_report.esic_data.emoloyee_contribution) : "0");
                                        }
                                        if(field_list_array.includes('esi_er'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.reimbursment_report ? String(monthly_report.reimbursment_report.esic_data.emoloyer_contribution) : "0");
                                        }
                                        if(field_list_array.includes('total_amount'))
                                        {
                                            ws.cell(index_val, clmn_emp_id++).string(monthly_report.reimbursment_report ? String(monthly_report.reimbursment_report.net_take_home) : "0");
                                        }
                                    }
                                }))
                            }
                        })).then(async (emp) => {
                            if(req.body.type == 'extra_earning'){
                                // wb.write("extra-earning-report-export.xlsx");
                                // let file_location = Site_helper.createFiles(wb,"extra-earning-report-export",'xlsx', req.authData.corporate_id)
                                file_name = "extra-earning-report-export.xlsx";
                                let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/extra-earning-module');
                                await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                                // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                                // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                                // return resp.status(200).json({status: "success", message: 'Extra Earning Report Generated successfully.', url: baseurl + file_location});
                            }
                            else{
                                // wb.write("reimbursment-report-export.xlsx");
                                // let file_location = Site_helper.createFiles(wb,"reimbursment-report-export",'xlsx', req.authData.corporate_id)
                                file_name = "reimbursment-report-export.xlsx";
                                let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/reimbursment-module');
                                await Site_helper.downloadAndDelete(file.file_name,file.location,req.authData.corporate_id,resp);
                                // file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
                                // await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                                // return resp.status(200).json({status: "success", message: 'Reimbursment Report Generated successfully.', url: baseurl + file_location});
                            }
                        });
                    });
                }
                else{
                    Employee.aggregatePaginate(myAggregate,options,async function (err, employees) {
                        if (err) return resp.json({ status: "error", message: err.message });
                        
                        if(employees.docs){
                            if(employees.docs.length > 0){
                                await Promise.all(employees.docs.map(async function(employee,key) {
                                    
                                    var heads = [];
                                    var heads_unique = [];
                                    var total_pf_ee = 0;
                                    var total_pf_er = 0;
                                    var total_esi_ee = 0;
                                    var total_esi_er = 0;
                                    var total_amount = 0;
                                    var report = null;
                                    if(employee.employee_monthly_reports){
                                        if(employee.employee_monthly_reports.length > 0){
                                            await Promise.all(employee.employee_monthly_reports.map(async function(monthly_report,key) {
                                                if(req.body.type == 'extra_earning'){
                                                    report = monthly_report.extra_earning_report;
                                                }
                                                else{
                                                    report = monthly_report.reimbursment_report;
                                                }
                                                if(report){
                                                    total_pf_ee += parseFloat(report.pf_data.emoloyee_contribution);
                                                    total_pf_er += parseFloat(report.pf_data.emoloyer_pf_contribution);
                                                    total_esi_ee += parseFloat(report.esic_data.emoloyee_contribution);
                                                    total_esi_er += parseFloat(report.esic_data.emoloyer_contribution);
                                                    total_amount += parseFloat(report.net_take_home);
                                                    if(report.heads){
                                                        if(report.heads.length > 0){
                                                            await Promise.all(report.heads.map(async function(head,key) {
                                                                heads.push(head);
                                                            }))
                                                        }
                                                    }
                                                }
                                            }));
                                        }
                                    }

                                    var holder_d = {};
                                    heads.forEach(function(d) {
                                        if (holder_d.hasOwnProperty(d.head_id)) {
                                            holder_d[d.head_id] = holder_d[d.head_id] + parseFloat(d.amount);
                                        } else {
                                            holder_d[d.head_id] = parseFloat(d.amount);
                                        }
                                    });
                                    for (var prop in holder_d) {
                                        heads_unique.push({ head: prop, amount: holder_d[prop]});
                                    }

                                    employee.total_data = {
                                        'heads': heads_unique,
                                        'pf_ee' : total_pf_ee,
                                        'pf_er' : total_pf_er,
                                        'esi_ee' : total_esi_ee,
                                        'esi_er' : total_esi_er,
                                        'total_amount' : total_amount,
                                    }
                                }));
                            }
                        }
                        

                        return resp.status(200).json({ status: "success", employees: employees, heads:extraEarningHeads });
                    });
                }
            }
        }
        catch (e) {
            return resp.status(403).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
}
function inWords (num) {
  var a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  var b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return 'zero' ; var str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? ' ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : '';
  return str;
}