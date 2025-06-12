var EaxtraEarning = require('../../Model/Company/ExtraEarning');
var ExtraEarningTemp = require('../../Model/Company/ExtraEarningTemp');
var Reimbursement = require('../../Model/Company/Reimbursement');
var ReimbursementTemp = require('../../Model/Company/ReimbursementTemp');
var EaxtraEarningHead = require('../../Model/Company/ExtraEarningHeads');
var Employee = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
const { Validator } = require('node-input-validator');
var crypto = require("crypto");
const mongoose = require('mongoose');
var Site_helper = require('../../Helpers/Site_helper');
module.exports = {
    // import_earning_data:async function(req, resp, next){
    //     try{
    //         var results=[];
    //         fs.createReadStream(req.files[0].path)
    //         .pipe(csv())
    //         .on('data', async function (row) {
    //           var parent_hods=[];
    //           await Staff.findOne({"_id":row["emp_hod"]},'parent_hods', async function (err, parent_hod) {
    //             if (!err) 
    //             {
    //                 if(parent_hod)
    //                 {
    //                   parent_hods=parent_hod.parent_hods;
    //                 }
    //                 parent_hods.push(row["emp_hod"]);
    //               var dateObj = new Date(row["attendance_date"]);
    //               //console.log(req.authData)
    //               var new_arr={
    //                 corporate_id:req.authData.corporate_id,
    //                 created_by:req.authData.user_id,
    //                 emp_id:row["user_id"],
    //                 status:'active',
    //                 created_at: Date.now(),
    //               }
    //               await Employee.create(new_arr,  function (err, user_data) {
    //                 if (!err) 
    //                 {
    //                   //console.log(user_data,'aaaaaaa')
    //                     var emp_document={
    //                       employee_id:user_data._id,
    //                     };
    //                     EmployeeDetails.create(emp_document,  function (emp_err, employeedet) {
    //                       if (emp_err)
    //                       {
    //                         //console.log(emp_err)
    //                         return resp.status(200).send({ status: 'error', message: emp_err.message,user_data:user_data });
    //                         //return resp.status(200).send({ status: 'success',message:"Company created successfully", user_data: user_data });
    //                       }
    //                     })
    //                   }
    //               })
    //               //console.log(results)
    //             }
    //             else{
    //               //console.log(err,parent_hod,'asdasdasda')
    //             }
    //           });
    //         })
    //         .on('end', async function () {
    //             var failed_entry=[];
    //             return resp.status(200).send({ status: 'success',message:"Import successfully", failed_entry: results });
    //         });
    //     }
    //     catch (e) {
    //         return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
    //     }
    // },
    get_extra_earning_emp: async function (req, resp, next) {
        try{
            var employeeData = await Employee.findOne({'_id':req.authId});
            if(!employeeData){
                return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
            }
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
            if(wage_year){
                wage_year = wage_year.toString();
            }
            var filter_option={};
            var document={};
            if(wage_month && wage_year){
                var search_option= {
                    $match:{
                        $and:[
                        {'emp_id':employeeData.emp_id}, 
                        {'corporate_id':employeeData.corporate_id},
                        {"wage_month": {$eq:wage_month}},
                        {"wage_year": {$eq:wage_year}}
                        ]
                    }
                };
            }
            else{
                var search_option= {
                    $match:{
                        $and:[
                        {'emp_id':employeeData.emp_id}, 
                        {'corporate_id':employeeData.corporate_id}
                        ]
                    }
                };
            }
            var search_option_details= {$match: {}};

            if(req.body.type == 'reimbursement'){
                var myAggregate = ReimbursementTemp.aggregate([
                    search_option,
                    search_option_details,
                    {
                        $lookup: {
                            from: "employees",
                            localField: "emp_id",
                            foreignField: "emp_id",
                            as: "employees",
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
                            company_remark:1,
                            employee_remark:1,
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
                            "employees.approval_status":1,
                            extra_earning_head:1
                        }
                    },
                    ]);
                ReimbursementTemp.aggregatePaginate(myAggregate,options, async function (err, earning) {
                    if (err) return resp.json({ status: "error", message: err.message });
                    // if(earning.docs){
                    //     if(earning.docs.length > 0){
                    //         await Promise.all(earning.docs.map(async function(value,key) {
                                
                    //             var headdata = await EaxtraEarningHead.findOne({_id:value.head_id});
                    //             if(headdata)
                    //             {
                    //                 earning.docs[key].extra_earning_head = headdata;
                    //             }
                    //         }));
                    //     }
                    // }
                    return resp.status(200).json({ status: "success", data: earning });
                });
            }
            else{
                var myAggregate = ExtraEarningTemp.aggregate([
                    search_option,
                    search_option_details,
                    {
                        $lookup: {
                            from: "employees",
                            localField: "emp_id",
                            foreignField: "emp_id",
                            as: "employees",
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
                            company_remark:1,
                            employee_remark:1,
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
                            "employees.approval_status":1,
                            extra_earning_head:1
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
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    add_extra_earning: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                // emp_id: 'required',
                head_id:'required',
                amount:'required',
                // wage_month:'required',
                // wage_year:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var employeeData = await Employee.findOne({'_id':req.authId});
                if(!employeeData){
                    return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
                }
                if(req.body.type == "reimbursement"){
                   var head_id =  req.body.head_id;
                }
                else{
                    var head_id = mongoose.Types.ObjectId(req.body.head_id);
                }
                var document =
                {
                    corporate_id:employeeData.corporate_id,
                    emp_id:employeeData.emp_id,
                    head_id:head_id,
                    amount:req.body.amount,
                    wage_month:req.body.wage_month,
                    wage_year:req.body.wage_year,
                    employee_remark: req.body.remark,
                    status:'pending',
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
                if(req.body.type == "reimbursement"){
                    ReimbursementTemp.create(document,  function (err, extra_earning) {
                        if (err) return resp.status(200).send({ status: 'error', message: err.message });
                        return resp.status(200).send({ status: 'success',message:"Reimbursement created successfully", extra_earning: extra_earning});
                    });
                }
                else{
                    ExtraEarningTemp.create(document,  function (err, extra_earning) {
                        if (err) return resp.status(200).send({ status: 'error', message: err.message });
                        return resp.status(200).send({ status: 'success',message:"Eaxtra Earning created successfully", extra_earning: extra_earning});
                    });
                }
            }
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    // update_extra_earning_data: async function (req, resp, next) {
    //     try{
    //         const v = new Validator(req.body, {
    //             // earning_id: 'required',
    //             // head_id:'required',
    //             // amount:'required',
    //             // wage_month:'required',
    //             // wage_year:'required',
    //         });
    //         const matched = await v.check();
    //         if (!matched) {
    //             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //         }
    //         else{
    //             if(typeof req.body.earning_data == "string"){
    //                 var ids = JSON.parse(req.body.earning_data);
    //             }
    //             else{
    //                 var earning_data = JSON.parse(JSON.stringify(req.body.earning_data));
    //             }
    //             console.log(JSON.parse(JSON.stringify(req.body.earning_data)));
    //             await Promise.all(earning_data.map(function(earningdata) {
    //                 var document =
    //                 {
    //                     head_id:mongoose.Types.ObjectId(earningdata.head_id),
    //                     amount:earningdata.amount,
    //                     wage_month:earningdata.wage_month,
    //                     wage_year:earningdata.wage_year,
    //                     updated_at: Date.now()
    //                 }
    //                 ExtraEarningTemp.updateOne({'_id': earningdata.earning_id},{$set: document},   function (err, earning_det) {
    //                     return earning_det;
    //                 });
    //             }));
    //             return resp.status(200).send({ status: 'success', message:"Extra earning has been updated successfully" });

    //         }
    //     }
    //     catch(e){
    //         return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
    //     }
    // },
    get_extra_earning_head: async function (req, resp, next) {
        try{
            var employeeData = await Employee.findOne({'_id':req.authId});
            if(!employeeData){
                return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
            }
            await EmployeeDetails.findOne({"employee_id":mongoose.Types.ObjectId(employeeData._id) }, async function (err, employeeDetails) {
                if (!err) 
                {
                    if(employeeDetails.annual_earnings){
                        if(employeeDetails.annual_earnings.length > 0){
                            for (var i = 0; i < employeeDetails.annual_earnings.length; i++) {
                                var earHead = await EaxtraEarningHead.findOne({_id:mongoose.Types.ObjectId(employeeDetails.annual_earnings[i].earning_head_id)});
                                if(earHead){
                                    employeeDetails.annual_earnings[i].earning_category = earHead.head_name;
                                }
                            }
                        }
                    }
                    return resp.status(200).send({ status: 'success', message:"", temp_head: employeeDetails.annual_earnings});
                }
            })
        }
        catch(e){
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
}