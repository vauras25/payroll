const  EmployeeModel = require('../../Model/Company/employee');
const EmployeePayslip = require("../../Model/Company/EmployeePayslip");
var fs = require('fs');
const bcrypt = require('bcrypt');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
var multer = require('multer');
var Site_helper = require("../../Helpers/Site_helper");
var EmployeeDetails = require("../../Model/Company/employee_details");
var CompanyLocation = require('../../Model/Company/CompanyLocation');
var AttendanceLog = require('../../Model/Company/AttendanceLog');
var EmployeeAttendance = require('../../Model/Company/EmployeeAttendance');
const saltRounds = 10;
const moment = require('moment');
const {resolve} = require('path');
const absolutePath = resolve('');
var fs = require("fs");
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, '../../storage/employee/profile');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});

niv.extend('unique', async ({ value, args }) => {
    // default field is email in this example
    const filed = args[1] || 'email';
    let condition = {};

    condition[filed] = value;

    // add ignore condition
    if (args[2]) {
        condition['_id'] = { $ne: mongoose.Types.ObjectId(args[2]) };
    }

    let emailExist = await mongoose.model(args[0]).findOne(condition).select(filed);

    // email already exists
    if (emailExist) {
        return false;
    }

    return true;
});
module.exports = {
    get_account_details: async function(req, resp){
        try{
            var employeeDetails = await EmployeeModel.aggregate(
                [
                {
                    '$match' : { 
                        '_id':mongoose.Types.ObjectId(req.authId)
                    }
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
                        from: "employee_details",
                        localField: "_id",
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
                        from: "salery_templates",
                        localField: "employee_details.employment_hr_details.salary_temp",
                        foreignField: "_id",
                        as: "salary_temp",
                    },
                },
                {
                    $lookup: {
                        from: "employee_packages",
                        localField: "employee_details.employment_hr_details.package_id",
                        foreignField: "_id",
                        as: "package_details",
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
                        from: 'plans',
                        localField: 'companies.plan_id',
                        foreignField: '_id',
                        as: 'plans'
                    }
                },
                {
                    $lookup:{
                        from: 'packages',
                        localField: 'plans.package_id',
                        foreignField: '_id',
                        as: 'package'
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
                    $lookup: {
                        from: "file_managers",
                        localField: "_id",
                        foreignField: "emp_db_id",
                        as: "file_managers",
                    },
                },
                {
                    $lookup: {
                        from: "company_locations",
                        localField: "employee_details.employment_hr_details.location_id",
                        foreignField: "_id",
                        as: "company_location",
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
                        company_details: {
                            $arrayElemAt: ["$company_details", 0],
                        },
                        total_file_size:{
                          "$sum": "$file_managers.file_size",
                        },
                        package: {
                            $arrayElemAt: ["$package", 0],
                        },
                        company_location: {
                            $arrayElemAt: ["$company_location", 0],
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
                        emp_spouse_name: 1,
                        emp_dob: 1,
                        pan_no: 1,
                        aadhar_no: 1,
                        nationality: 1,
                        email_id: 1,
                        country: 1,
                        aadhar_enrolment: 1,
                        marriage_date: 1,
                        client_code: 1,
                        created_at: 1,
                        phone_no: 1,
                        "hod.first_name": 1,
                        "hod.last_name": 1,
                        nominee: 1,
                        nominee_dob: 1,
                        relation_with_nominee: 1,
                        physical_disability:1,
                        passport_no:1,
                        passport_val_form:1,
                        passport_val_to:1,
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
                        emp_leave_histry:1,
                        total_file_size:1,
                        blood_group:1,
                        domicile:1,
                        emergency_contact_name:1,
                        emergency_contact_no:1,
                        emp_aadhaar_image:1,
                        emp_passport_image:1,
                        height:1,
                        marital_status:1,
                        mobile_no:1,
                        religion:1,
                        emp_pan_image:1,
                        additional_id_image:1,
                        //  "hod":1,
                        "client._id": 1,
                        "client.client_code": 1,
                        "employee_details": 1,
                        // "employee_details.contract": 1,
                        // "employee_details.employment_hr_details": 1,
                        "branch._id": 1,
                        "branch.branch_name": 1,
                        "department._id": 1,
                        "department.department_name": 1,
                        "designation._id": 1,
                        "designation.designation_name": 1,
                        "salary_temp":1,
                        "package_details._id":1,
                        "package_details.package_name":1,
                        "company_financial_year":"$company_details.preference_settings.financial_year_end",
                        "package.employee_vault":1,
                        "company_location":1
                    },
                }]
                );
resp.status(200).send({ status: 'success', employee_data: employeeDetails});
}
catch (e) {
    return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
}
},
update_personal_details: async function(req, resp){
    try{
        const v = new Validator(req.body, {
            first_name: 'required|alpha',
            last_name: 'required|alpha',
            father_name: 'nullable',
            email_id: 'nullable',
            mobile_no: 'required|phoneNumber',
            alternate_mob_no: 'nullable',
            dob: 'required|date',
            sex: 'required|in:m,f,o,t',
            // aadhar_no: 'nullable',
            // pan_no: 'nullable',
            // passport_no: 'nullable',
            // nationality: 'nullable|alpha',
            // blood_group: 'nullable|in:A−,A+,B-,B+,AB-,AB+,O-,O+',
            // emergency_contact_no: 'nullable',
            // emergency_contact_name: 'nullable|alpha',
            // domicile: 'nullable',
            // height: 'nullable',
            // religion: 'nullable',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var obj = req.files;
            var document = {
                emp_first_name: req.body.first_name,
                emp_last_name: req.body.last_name,
                emp_father_name: req.body.father_name,
                email_id: req.body.email_id,
                mobile_no: req.body.mobile_no,
                alternate_mob_no: req.body.alternate_mob_no,
                emp_dob: req.body.dob,
                sex: req.body.sex,
                aadhar_no: req.body.aadhar_no,
                pan_no: req.body.pan_no,
                passport_no: req.body.passport_no,
                passport_val_form: req.body.passport_val_form,
                passport_val_to: req.body.passport_val_to,
                physical_disability: req.body.physical_disability,
                nationality: req.body.nationality,
                blood_group: req.body.blood_group,
                emergency_contact_no: req.body.emergency_contact_no,
                emergency_contact_name: req.body.emergency_contact_name,
                domicile: req.body.domicile,
                height: req.body.height,
                religion: req.body.religion,
                marital_status: req.body.marital_status,
                marriage_date: req.body.marriage_date,
            };
            await Promise.all(
                obj.map(async (file) => {
                    var file_data = {
                        corporate_id: req.authData.corporate_id,
                        emp_db_id: req.authData.user_id,
                        file_name: file.originalname,
                        file_type: file.mimetype,
                        file_size: file.size,
                        file_path: file.path ? file.path : "NA",
                        status: "active",
                        created_at: Date.now(),
                    };
                    if (file.fieldname === "emp_pan_image") {
                        file_data["folder_name"] = "Pan Image";
                        file_data["upload_for"] = "pan_image";
                        document["emp_pan_image"] = file.path;
                    }
                    if (file.fieldname === "emp_aadhaar_image") {
                        file_data["folder_name"] = "Aadhaar Image";
                        file_data["upload_for"] = "aadhaar_image";
                        document["emp_aadhaar_image"] = file.path;
                    }
                    if (file.fieldname === "emp_passport_image") {
                        file_data["folder_name"] = "Passport Image";
                        file_data["upload_for"] = "passport_image";
                        document["emp_passport_image"] = file.path;
                    }
                    if (file.fieldname === "additional_id_image") {
                        file_data["folder_name"] = "Aadhaar Enrolment Image";
                        file_data["upload_for"] = "aadhaar_enrolment_image";
                        document["additional_id_image"] = file.path;
                    }

                    var fileuploaddata = await Site_helper.upload_file_manager(file_data);
                })
                );
            EmployeeModel.updateOne({'_id':req.authId},document,  function (err, employee_data) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else
                {
                    resp.status(200).send({ status: 'success', message:"Account has been updated successfully", employee_data: employee_data });
                }
            })
        }
    }
    catch (e) {
        return resp.status(200).json({ status: false, message: e ? e.message:'Something went wrong' });
    }
},
update_employee_address: async function (req, resp, next) {
    try {
        var document = {
            "emp_address.resident_no": req.body.resident_no,
            "emp_address.residential_name": req.body.residential_name,
            "emp_address.address_proof": req.body.address_proof,
            "emp_address.road": req.body.road,
            "emp_address.locality": req.body.locality,
            "emp_address.city": req.body.city,
            "emp_address.district": req.body.district,
            "emp_address.state": req.body.state,
            "emp_address.pincode": req.body.pincode,
            "emp_address.country": req.body.country,
            "emp_address.diff_current_add": req.body.diff_current_add,
        };
        var obj = req.files;
        if(obj){
            await Promise.all(
                obj.map(async (file) => {
                    var file_data = {
                        corporate_id: req.authData.corporate_id,
                        emp_db_id: req.body.employee_id,
                        file_name: file.originalname,
                        file_type: file.mimetype,
                        file_size: file.size,
                        file_path: file.path ? file.path : "NA",
                        status: "active",
                        created_at: Date.now(),
                    };
                    if (file.fieldname === "emp_address_proof") {
                        file_data["folder_name"] = "Address Proof";
                        file_data["upload_for"] = "address_proof";
                        document["emp_address.emp_address_proof"] = file.path;
                    }
                    var fileuploaddata = await Site_helper.upload_file_manager(file_data);
                })
                );
        }
        var document2 = {
            "emp_curr_address.resident_no": req.body.diff_current_add == "yes" ? req.body.curr_resident_no : req.body.resident_no,
            "emp_curr_address.residential_name": req.body.diff_current_add == "yes" ? req.body.curr_residential_name : req.body.residential_name,
            "emp_curr_address.road": req.body.diff_current_add == "yes" ? req.body.curr_road : req.body.road,
            "emp_curr_address.locality": req.body.diff_current_add == "yes" ? req.body.curr_locality : req.body.locality,
            "emp_curr_address.city": req.body.diff_current_add == "yes" ? req.body.curr_city : req.body.city,
            "emp_curr_address.district": req.body.diff_current_add == "yes" ? req.body.curr_district : req.body.district,
            "emp_curr_address.state": req.body.diff_current_add == "yes" ? req.body.curr_state : req.body.state,
            "emp_curr_address.pincode": req.body.diff_current_add == "yes" ? req.body.curr_pincode : req.body.pincode,
            "emp_curr_address.country": req.body.diff_current_add == "yes" ? req.body.curr_country : req.body.country,
        };
        EmployeeDetails.updateOne({ employee_id: req.authId }, document, function (err, emp_det) {
            if (err) { 
                return resp.status(200).send({ status: "error", message: err.message });
            } else {
                EmployeeDetails.updateOne({ employee_id: req.authId },document2,function (err, emp_det) {
                    if (err) {
                        return resp.status(200).send({ status: "error", message: err.message });
                    } else {
                        return resp.status(200).send({ status: "success", message: "Employee address has been updated successfully", emp_det: emp_det,});
                    }
                });
            }
        });
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
update_employee_bank_details: async function (req, resp, next) {
    try {
        var document = {
            "bank_details.bank_name": req.body.bank_name,
            "bank_details.branch_name": req.body.branch_name,
            "bank_details.branch_address": req.body.branch_address,
            "bank_details.branch_pin": req.body.branch_pin,
            "bank_details.account_no": req.body.account_no,
            "bank_details.account_type": req.body.account_type,
            "bank_details.ifsc_code": req.body.ifsc_code,
            "bank_details.micr_no": req.body.micr_no,
            "bank_details.state": req.body.state,
        };

        var obj = req.files;
        if(obj){
            await Promise.all(
                obj.map(async (file) => {
                    var file_data = {
                        corporate_id: req.authData.corporate_id,
                        emp_db_id: req.body.employee_id,
                        file_name: file.originalname,
                        file_type: file.mimetype,
                        file_size: file.size,
                        file_path: file.path ? file.path : "NA",
                        status: "active",
                        created_at: Date.now(),
                    };

                    if (file.fieldname === "cancel_cheque") {
                        file_data["folder_name"] = "Cancel Cheque";
                        file_data["upload_for"] = "cancel_cheque";
                        document["bank_details.cancel_cheque"] = file.path;
                    }
                    var fileuploaddata = await Site_helper.upload_file_manager(file_data);
                })
                );
        }
        EmployeeDetails.updateOne({ employee_id: req.authId }, document, function (err, emp_det) {
            if (err) { 
                return resp.status(200).send({ status: "error", message: err.message });
            } else {
                return resp.status(200).send({status: "success",message: "Bank details has been updated successfully",emp_det: emp_det,});
            }
        });

    } catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message : "Something went wrong",});
    }
},
update_employee_pf_esic_details: async function (req, resp, next) {
    try {

        var document = {
            "pf_esic_details.pre_er_pf": req.body.pre_er_pf,
            "pf_esic_details.pre_er_details": JSON.parse(JSON.stringify(req.body.pre_er_details)),
            "pf_esic_details.pre_er_epfo_details": JSON.parse(JSON.stringify(req.body.pre_er_epfo_details)),
            "pf_esic_details.pre_er_esic_details": JSON.parse(JSON.stringify(req.body.pre_er_esic_details)),
            "pf_esic_details.curr_er_epfo_details": JSON.parse(JSON.stringify(req.body.curr_er_epfo_details)),
            "pf_esic_details.curr_er_esic_details": JSON.parse(JSON.stringify(req.body.curr_er_esic_details)),
            "pf_esic_details.esic_family_details": JSON.parse(JSON.stringify(req.body.esic_family_details)),
            "pf_esic_details.pf_nominee_details": JSON.parse(JSON.stringify(req.body.pf_nominee_details)),
        };

        EmployeeDetails.updateOne({ employee_id: req.authId }, document, function (err, emp_det) {
            if (err) {
                return resp.status(200).send({ status: "error", message: err.message });
            } else {
                return resp.status(200).send({status: "success", message: "PF & ESIC details has been updated successfully",emp_det: emp_det,});
            }
        });
    } catch (e) {
        return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
},
update_education_employee: async function (req, resp, next) {
    try {
        var education_id = req.body.education_id;
        if (education_id) {
            var document = {
                "education.$.institute": req.body.institute,
                "education.$.university": req.body.university,
                "education.$.stream": req.body.stream,
                "education.$.level": req.body.level,
                "education.$.specialisation": req.body.specialisation,
                "education.$.completion": req.body.completion,
            };
            var obj = req.files;
            if(obj){
                await Promise.all(
                    obj.map(async (file) => {
                        var file_data = {
                            corporate_id: req.authData.corporate_id,
                            emp_db_id: req.body.employee_id,
                            file_name: file.originalname,
                            file_type: file.mimetype,
                            file_size: file.size,
                            file_path: file.path ? file.path : "NA",
                            status: "active",
                            created_at: Date.now(),
                        };
                        if (file.fieldname === "education_file_image") {
                            file_data["folder_name"] = "Education File Image";
                            file_data["upload_for"] = "education_file_image";
                            document["education.$.education_file_image"] = file.path;
                        }
                        var fileuploaddata = await Site_helper.upload_file_manager(file_data);
                    })
                    );
            }
            EmployeeDetails.updateOne({employee_id: req.authId,"education._id": education_id,},{ $set: document },function (err, emp_det) {
                if (err) {
                    return resp.status(200).send({ status: "error", message: err.message });
                } 
                else {
                    return resp.status(200).send({status: "success",message: "Education details has been updated successfully",emp_det: emp_det,});
                }
            });
        } else {
            var document2 = {
                institute: req.body.institute,
                university: req.body.university,
                stream: req.body.stream,
                level: req.body.level,
                specialisation: req.body.specialisation,
                completion: req.body.completion,
            };
            var obj = req.files;
            await Promise.all(
                obj.map(async (file) => {
                    var file_data = {
                        corporate_id: req.authData.corporate_id,
                        emp_db_id: req.body.employee_id,
                        file_name: file.originalname,
                        file_type: file.mimetype,
                        file_size: file.size,
                        file_path: file.path ? file.path : "NA",
                        status: "active",
                        created_at: Date.now(),
                    };
                    if (file.fieldname === "education_file_image") {
                        file_data["folder_name"] = "Education File Image";
                        file_data["upload_for"] = "education_file_image";
                        document2["education_file_image"] = file.path;
                    }
                    var fileuploaddata = await Site_helper.upload_file_manager(file_data);
                })
                );
            EmployeeDetails.updateOne({ employee_id: req.authId },{ $addToSet: { education: document2 } },function (err, emp_det) {
                if (err){
                    return resp.status(200).send({ status: "error", message: err.message });
                }
                return resp.status(200).send({status: "success",message: "Education added successfully",emp_det: emp_det,});
            });
        }
    } catch (e) {
        return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
    }
},
    // update_account_data: async function (req, resp) {
    //     try{
    //         const v = new Validator(req.body, {
    //             first_name: 'required|alpha',
    //             last_name: 'required|alpha',
    //             phone_no: 'required|phoneNumber',
    //         });
    //         const matched = await v.check();
    //         if (!matched) {
    //             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //         }
    //         else{
    //             var document = {
    //                 first_name:req.body.first_name, 
    //                 last_name:req.body.last_name, 
    //                 phone_no:req.body.phone_no,
    //                 updated_at: Date.now()
    //             };
    //             var upload = multer({ storage: storage }).single("profile_pic");
    //             upload(req, resp, (err) => {
    //                 if(!err) {

    //                 //console.log(file_path)
    //                 if (req.files.length > 0) {
    //                     document.profile_pic=req.files[0].path;

    //                     User.findById(req.authId,'profile_pic',  function (err, user_data) {
    //                         if (err) 
    //                         {
    //                             resp.status(200).send({ status: 'error', message: err.message });
    //                         }
    //                         else{

    //                             var filePath = file_path+'/'+user_data.profile_pic; 
    //                             //resp.status(200).send({ status: 'success', message:"Account has been updated successfullyc" });
    //                             if (fs.existsSync(filePath)) {
    //                                 fs.unlinkSync(filePath);
    //                             }

    //                             User.updateOne({'_id':req.authId},document,  function (err, user_data) {
    //                                 if (err) 
    //                                 {
    //                                     return resp.status(200).send({ status: 'error', message: err.message });
    //                                 }
    //                                 else
    //                                 {
    //                                     resp.status(200).send({ status: 'success', message:"Account has been updated successfully", user_data: user_data });
    //                                 }
    //                             })
    //                         }
    //                     })
    //                 }
    //                 else
    //                 {
    //                     User.updateOne({'_id':req.authId},document,  function (err, user_data) {
    //                         if (err) 
    //                         {
    //                             return resp.status(200).send({ status: 'error', message: err.message });
    //                         }
    //                         else
    //                         {
    //                             resp.status(200).send({ status: 'success', message:"Account has been updated successfully", user_data: user_data });
    //                         }
    //                     })
    //                 }
    //             }
    //             else{
    //               return resp.status(200).send({ status: 'error', message: 'error upload' });
    //           }
    //       });
    //         }
    //     }
    //     catch (e) {
    //         return resp.status(200).json({ status: false, message: e ? e.message:'Something went wrong' });
    //     }
    // },
    update_employee_account_password: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                password:'required|length:20,8',
                old_password:'required|length:20,8',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                EmployeeModel.findById(req.authId,'password',  function (err, employee_data) {
                    if (err) 
                    {
                        resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{

                        var chkval=bcrypt.compareSync(req.body.old_password, employee_data.password);
                        if(chkval)
                        {
                            const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
                            var document = {
                                password:hash_pass, 
                            };
                            EmployeeModel.updateOne({'_id':req.authId},document,  function (err, employee_data) {
                                if (err) 
                                {
                                    return resp.status(200).send({ status: 'error', message: err.message });
                                }
                                else
                                {
                                    resp.status(200).send({ status: 'success', message:"Password has been updated successfully", employee_data: employee_data });
                                }
                            })
                        }
                        else
                        {
                            resp.status(200).json({ status: 'error', message: 'Wrong old password' });
                        }
                    }
                })
            }
        }
        catch (e) {
            return resp.status(200).json({ status: false, message: e ? e.message:'Something went wrong' });
        }
    },
    update_profile_pic: async function (req, resp) {
        try {
            if(!req.files){
                return resp.status(200).send({ status: 'val_err', message: "Profile pics field are required." });
            };
            var upload = multer({ storage: storage }).single("employee_profile_pic");
            upload(req, resp, (err) => {
                EmployeeModel.findById(req.authId,'profile_pic',  function (err, user_data) {
                    if (err) 
                    {
                        resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{
                        var document = {
                            "profile_pic":req.files[0].path
                        };
                        var filePath = file_path+'/'+user_data.profile_pic;
                        //resp.status(200).send({ status: 'success', message:"Account has been updated successfullyc" });
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }

                        EmployeeModel.updateOne({'_id':req.authId},document,  function (err, user_data) {
                            if (err) 
                            {
                                return resp.status(200).send({ status: 'error', message: err.message });
                            }
                            else
                            {
                                resp.status(200).send({ status: 'success', message:"Profile photo has been updated successfully", employee_data: user_data });
                            }
                        })
                    }
                })
            });
        }
        catch (e) {
            return resp.status(200).json({
                status: "error",
                message: e ? e.message : "Something went wrong",
            });
        }
    },
    // get_masters_data:async function(req,resp){
    //     try{
    //         var masters={branch:[],designation:[],department:[],hod:[],roles:[]};
    //         await Designation.find({  status:'active' },'_id designation_name',  function (err, designation) {
    //             if (!err) 
    //             {
    //                 masters.designation=designation;
    //             }
    //         })
    //         await Branch.find({  status:'active' },'_id branch_name',  function (err, branch) {
    //             if (!err) 
    //             {
    //                 masters.branch=branch;
    //             }
    //         })
    //         await Role.find({  status:'active' }, '_id role_name role_id_name', function (err, roles) {
    //             if (!err) 
    //             {
    //                 masters.roles=roles;
    //             }
    //         })
    //         await Department.find({  status:'active' },'_id department_name',  function (err, department) {
    //             if (!err) 
    //             {
    //                 masters.department=department;
    //             }
    //         })
    //         await User.find({  status:'active',is_hod:'yes',user_type:'sub_admin' },'_id first_name last_name',  function (err, hod) {
    //             if (!err) 
    //             {
    //                 masters.hod=hod;
    //                 return resp.status(200).send({ status: 'success', message:"", masters: masters});
    //             }
    //         })
    //         //return resp.status(200).send({ status: 'val_err', message:"", masters: masters});
    //     }
    //     catch (e) {
    //         return resp.status(200).json({ status: false, message: e ? e.message:'Something went wrong' });
    //     }
    // },

    // get_client_data: async function (req, resp) {
    //     try{
    //         const v = new Validator(req.body, {
    //             pageno:'required',
    //         });
    //         const matched = await v.check();
    //         if (!matched) {
    //             return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
    //         }
    //         else{
    //             // if (err) 
    //             //   {
    //             //     return resp.status(200).send({ status: 'error', message: err.message });
    //             //   }
    //             //   else
    //             //   {
    //                 resp.status(200).send({ status: 'success', message:"User password has been updated successfully",req:req.permission });
    //             //}
    //         }
    //     }
    //     catch (e) {
    //         return resp.status(200).json({ status: false, message: e ? e.message:'Something went wrong' });
    //     }
    // },

    update_employee_training_details: async function (req, resp, next) {
        try {
          const v = new Validator(req.body, {
            training_type: "required",
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
            var employeeData = await EmployeeModel.findOne({'_id':req.authId});
            if(!employeeData){
                return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
            }
            var training_id = req.body.training_id;
            if (training_id) {
                var document = {
                    "training.$.training_type": req.body.training_type,
                    "training.$.description": req.body.description,
                    "training.$.comments": req.body.comments,
                };
                var obj = req.files;
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
                    if (file.fieldname === "training_file_image") {
                        file_data["folder_name"] = "Training File Image";
                        file_data["upload_for"] = "training_file_image";
                        document["training.$.training_file_image"] = file.path;
                    }
                    var fileuploaddata = await Site_helper.upload_file_manager(
                        file_data
                        );
                })
                    );
                EmployeeDetails.updateOne(
                    { employee_id: employeeData._id, "training._id": training_id },
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
                            message: "Training details has been updated successfully",
                            emp_det: emp_det,
                        });
                    }
                }
                );
            } else {
              var document2 = {
                training_type: req.body.training_type,
                description: req.body.description,
                comments: req.body.comments,
            };
            var obj = req.files;
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
                if (file.fieldname === "training_file_image") {
                    file_data["folder_name"] = "Training File Image";
                    file_data["upload_for"] = "training_file_image";
                    document2["training_file_image"] = file.path;
                }
                var fileuploaddata = await Site_helper.upload_file_manager(
                    file_data
                    );
            })
                );
            EmployeeDetails.updateOne(
                { employee_id: employeeData._id },
                { $addToSet: { training: document2 } },
                function (err, emp_det) {
                  if (err)
                    return resp
                .status(200)
                .send({ status: "error", message: err.message });
                return resp
                .status(200)
                .send({
                  status: "success",
                  message: "Training added successfully",
                  emp_det: emp_det,
              });
            }
            );
        }
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
update_employee_extra_curricular: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        extra_curricular_type: "required",
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
        var employeeData = await EmployeeModel.findOne({'_id':req.authId});
        if(!employeeData){
            return resp.status(200).json({ 'status': "error", 'message': 'Employee not found.'});
        }
        var extra_curri_id = req.body.extra_curri_id;
        if (extra_curri_id) {
          var document = {
            "extra_curricular.$.extra_curricular_type":
            req.body.extra_curricular_type,
            "extra_curricular.$.description": req.body.description,
            "extra_curricular.$.comments": req.body.comments,
            "extra_curricular.$.date": req.body.date,
        };
        var obj = req.files;
        await Promise.all(
            obj.map(async (file) => {
              if (file.fieldname === "accident_file_image") {
                document["extra_curricular.$.extra_curricular_file_image"] =
                file.path;
            }
        })
            );
        EmployeeDetails.updateOne(
        {
          employee_id: employeeData._id,
          "extra_curricular._id": extra_curri_id,
      },
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
                message:
                "Extra Curricular details has been updated successfully",
                emp_det: emp_det,
            });
        }
    }
    );
    } else {
      var document2 = {
        extra_curricular_type: req.body.extra_curricular_type,
        description: req.body.description,
        comments: req.body.comments,
        date: req.body.date,
    };
    var obj = req.files;
    await Promise.all(
        obj.map(async (file) => {
          if (file.fieldname === "accident_file_image") {
            document2["extra_curricular_file_image"] = file.path;
        }
    })
        );
    EmployeeDetails.updateOne(
        { employee_id: employeeData._id },
        { $addToSet: { extra_curricular: document2 } },
        function (err, emp_det) {
          if (err)
            return resp
        .status(200)
        .send({ status: "error", message: err.message });
        return resp
        .status(200)
        .send({
          status: "success",
          message: "Extra Curricular added successfully",
          emp_det: emp_det,
      });
    }
    );
}
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

get_generated_payslip_data: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        // wage_month: "required",
        wage_year: "required",
        pageno: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var wage_month = req.body.wage_month ? req.body.wage_month : "0";
        var wage_year = req.body.wage_year;
        var sortbyfield = req.body.sortbyfield;
        if (sortbyfield) {
          var sortoption = {};
          sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
        } else {
          var sortoption = { wage_month: -1 };
        }
        const options = {
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : perpage,
          sort: sortoption,
        };
        var filter_option = {};
        var document = {};
        var search_option = {
          $match: {
            $and: [
              { "employees._id": mongoose.Types.ObjectId(req.authId) },
              { "employees.corporate_id": req.authData.corporate_id },
              // { parent_hods: { $in: [req.authData.user_id] } },
              { "employees.approval_status": "approved" },
            ],
          },
        };
        var search_option_details = { $match: {} };
        // if (req.body.searchkey) {
        //   search_option = {
        //     $match: {
        //       $text: { $search: req.body.searchkey },
        //       corporate_id: req.authData.corporate_id,
        //     },
        //   };
        // } else {
        //   var query_data = await Site_helper.getEmpFilterData(
        //     req,
        //     search_option,
        //     search_option_details
        //   );
        //   search_option_details = query_data.search_option_details;
        //   search_option = query_data.search_option;
        // }
        if(req.body.wage_month){
            search_option_details.$match["wage_month"] = parseInt(wage_month);
        }
        search_option_details.$match["wage_year"] = parseInt(wage_year);
        if (req.body.row_checked_all === "true") {
          var ids = JSON.parse(req.body.unchecked_row_ids);
          if (ids.length > 0) {
              ids = ids.map(function (el) {
                return mongoose.Types.ObjectId(el);
              });
              search_option.$match._id = { $nin: ids };
          }
        } else {
          var ids = JSON.parse(req.body.checked_row_ids);
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option.$match._id = { $in: ids };
          }
        }
        var myAggregate = EmployeePayslip.aggregate([
          {
            $lookup: {
              from: "employees",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "employees",
            },
          },
          search_option,
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
          // {
          //   $lookup: {
          //     from: "employee_payslips",
          //     "let": { "emp_db_idVar": "$emp_id"},
          //     "pipeline": [
          //       { "$match": { $and :[
          //         {"$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] }},
          //         {"wage_month": parseInt(wage_month)},
          //         {"wage_year": parseInt(wage_year)},
          //       ] } }
          //     ],
          //     as: "employee_payslips",
          //   },
          // },

          search_option_details,
          {
            $addFields: {
              employee_payslip: {
                $arrayElemAt: ["$employees", 0],
              },
              employee_detail: {
                $arrayElemAt: ["$employee_details", 0],
              },
              branch: {
                $arrayElemAt: ["$branch", 0],
              },
              designation: {
                $arrayElemAt: ["$designation", 0],
              },
              department: {
                $arrayElemAt: ["$department", 0],
              },
              client: {
                $arrayElemAt: ["$client", 0],
              },
              hod: {
                $arrayElemAt: ["$hod", 0],
              },
            },
          },

          {
            $project: {
              _id: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              payslip_temp_data:{ $ifNull: [ "$employee_detail.template_data.payslip_temp_data", {} ] },
              emp_data:"$emp_data" ,
              earnings_data: "$earnings",
              deductions_data: "$deductions",
              contribution_data: "$contribution",
              gross_earning: "$gross_earning",
              net_pay: "$net_pay",
              ctc: "$ctc",
              department:1,
              designation:1,
              client:1,
              hod:1,
              "deductions":1,
              "earnings":1,
              "contribution":1,
              emp_id:1,
              wage_month:1,
              wage_year:1,
              created_at:1,
              updated_at:1
            },
          },
        ]);
        EmployeePayslip.aggregatePaginate(
          myAggregate,
          options,
          async function (err, master_data) {
            if (err)
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            return resp.status(200).send({
              status: "success",
              message: "",
              master_data: master_data,
            });
          }
        );
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  download_payslip_data: async (req, resp) => {
      try {
      const v = new Validator(req.body, {
        type: "required|in:view,download",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(403).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var search_option = {
          $match: {
            $and: [
              { "employees._id": mongoose.Types.ObjectId(req.authId) },
              { "employees.corporate_id": req.authData.corporate_id },
              // { parent_hods: { $in: [req.authData.user_id] } },
              { "employees.approval_status": "approved" },
            ],
          },
        };
        var search_option_details = { $match: {} };
        if (req.body.row_checked_all === "true") {
          var ids = JSON.parse(req.body.unchecked_row_ids);
          if (ids.length > 0) {
              ids = ids.map(function (el) {
                return mongoose.Types.ObjectId(el);
              });
              search_option.$match._id = { $nin: ids };
          }
        } else {
          var ids = JSON.parse(req.body.checked_row_ids);
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option.$match._id = { $in: ids };
          }
        }
        var myAggregate = EmployeePayslip.aggregate([
          {
            $lookup: {
              from: "employees",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "employees",
            },
          },
          search_option,
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
          search_option_details,
          {
            $addFields: {
              employee_payslip: {
                $arrayElemAt: ["$employees", 0],
              },
              employee_detail: {
                $arrayElemAt: ["$employee_details", 0],
              },
              branch: {
                $arrayElemAt: ["$branch", 0],
              },
              designation: {
                $arrayElemAt: ["$designation", 0],
              },
              department: {
                $arrayElemAt: ["$department", 0],
              },
              client: {
                $arrayElemAt: ["$client", 0],
              },
              hod: {
                $arrayElemAt: ["$hod", 0],
              },
            },
          },
          {
            $project: {
              _id: 1,
              wage_month:1,
              wage_year:1,
              pdf_file_name:1,
              pdf_link:1,
              created_at:1,
              updated_at:1,
            },
          },
        ]);
        myAggregate.then(async (payslips)=>{
            if(payslips.length > 0) {
                await Promise.all(payslips.map(async function(payslip, index){
                    // var month_name = moment().month(payslip.wage_month).format("MMM").toLowerCase();
                    // var year = payslip.wage_year;
                    // file_name = payslip.pdf_file_name;
                    file_path = payslip.pdf_link;
                    var dir = absolutePath+file_path;
                    if (fs.existsSync(dir)){
                        await Site_helper.driect_download(file_path,req.authData.corporate_id,resp);
                    }
                    else{
                        return resp.status(200).json({
                            status: "success",
                            message: "File not exist in our server.",
                         });
                    }
                }));
            }
            else{
                return resp.status(200).json({
                    status: "success",
                    message: "Something went wrong",
                });
            }
        });
      }
    } catch (e) {
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
    checkInCheckOut: async (req, resp) => {
        try {
            const v = new Validator(req.body, {
                latitude: "required",
                longitude: "required",
                attendance_date : "required|date",
                login_time: "required"
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({
                    status: "val_err",
                    message: "Validation error",
                    val_msg: v.errors,
                });
            } else {
                var flag = 0;
                var employee_details = await EmployeeDetails.findOne({"employee_id":req.authId});
                if(employee_details){
                    if(employee_details.employment_hr_details){
                        if(employee_details.employment_hr_details.location_id){
                            var locationData = await CompanyLocation.findOne({"_id":employee_details.employment_hr_details.location_id});
                            if(locationData){
                                var lat1 = parseFloat(locationData.latitude);
                                var lon1 = parseFloat(locationData.longitude);
                                var lat2 = parseFloat(req.body.latitude);
                                var lon2 = parseFloat(req.body.longitude);
                                // console.log(lat1);
                               
                                var radlat1 = Math.PI * lat1/180;
                                var radlat2 = Math.PI * lat2/180;
                                var theta = lon1-lon2;
                                var radtheta = Math.PI * theta/180;
                                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                                
                                if (dist > 1) {
                                    dist = 1;
                                }
                                dist = Math.acos(dist);
                                dist = dist * 180/Math.PI;
                                dist = dist * 60 * 1.1515;
                                // if (unit=="K") { dist = dist * 1.609344 }
                                // if (unit=="N") { dist = dist * 0.8684 }
                                dist = dist * 1.609344;
                                var meters = dist *  1000;
                                if(locationData.radius >= meters){
                                    flag = 1;
                                }
                            }
                        }
                    }
                }
                if(flag == 1){
                    var attendance_date = moment(req.body.attendance_date).format('YYYY-MM-DD');
                    var document = {
                      attendance_stat: req.body.attendance_stat ? req.body.attendance_stat : "",
                      updated_at: Date.now(),
                      created_at: Date.now(),
                    };
                    document["corporate_id"] = req.authData.corporate_id;
                    document["emp_id"] = req.authData.userid;
                    document["attendance_date"] = attendance_date;
                    document["attendance_month"] = moment(attendance_date).format('MM');
                    document["attendance_year"] = moment(attendance_date).format('YYYY');
                    document["login_by"] = "web";
                    document["register_type"] = employee_details?.template_data?.attendance_temp_data?.register_type;
                    document["status"] = "active";
                    var EmployeeAttendanceDetails = await EmployeeAttendance.findOne({emp_id: req.authData.userid,attendance_date: attendance_date,});
                    var employeeAttendanceData= "";
                    if(EmployeeAttendanceDetails){
                        employeeAttendanceData = EmployeeAttendanceDetails;
                    }
                    else{
                        employeeAttendanceData = await EmployeeAttendance.findOneAndUpdate({emp_id: req.authData.userid,attendance_date: attendance_date,},
                            document, { upsert: true, new: true, setDefaultsOnInsert: true });
                    }
                    if(employeeAttendanceData){
                        var checkAttLogData = await AttendanceLog.findOne({employee_attendance_id: mongoose.Types.ObjectId(employeeAttendanceData._id)});
                        if(checkAttLogData){
                            var last_entries_data =  checkAttLogData.entries[checkAttLogData.entries.length - 1];
                            var update_data = {};
                            var update_emp_att_data = {};
                            var total_break_time = employeeAttendanceData.total_break_time ? employeeAttendanceData.total_break_time : 0;
                            var total_logged_in = employeeAttendanceData.total_logged_in ? employeeAttendanceData.total_logged_in : 0;
                            
                            var startTime = await moment(req.body.login_time, 'HH:mm:ss a');
                            var endTime = await moment(last_entries_data.entry_time, 'HH:mm:ss a');
                            var totalMinutes = Math.abs(endTime.diff(startTime, 'minutes'));
                            // var minutes =  totalMinutes % 60;
                            // var hours  = Math.floor(totalMinutes / 60);
                            // var total_logged = hours.toString().padStart(2, '0')+"."+minutes.toString().padStart(2, '0');
                            total_logged = munitestohour(totalMinutes);
                            if(last_entries_data.entry_type == 'in'){
                                // logout_time:19
                                // total_logged_in:9
                                // total_break_time:1
                                // logout_time:1
                                checkAttLogData.entries.push({
                                    "entry_time": req.body.login_time,
                                    "entry_type": "out"
                                });
                                update_data = {
                                    entries:checkAttLogData.entries,
                                };
                                var uptimeminutes = convertH2M((parseFloat(total_logged_in) + parseFloat(total_logged)).toFixed(2));
                                var upTime  = munitestohour(uptimeminutes);
                                
                                update_emp_att_data = {
                                    "total_logged_in" : upTime,
                                    "logout_time" : req.body.login_time,
                                }; 

                            }
                            else if(last_entries_data.entry_type == 'out'){
                                checkAttLogData.entries.push({
                                    "entry_time": req.body.login_time,
                                    "entry_type": "in"
                                });
                                update_data = {
                                    entries:checkAttLogData.entries,
                                };
                                var uptimeminutes = convertH2M((parseFloat(total_break_time) + parseFloat(total_logged)).toFixed(2));
                                var upTime  = munitestohour(uptimeminutes);
                                employeeAttendanceData.break_time.push({
                                    "break_stime": last_entries_data.entry_time,
                                    "break_etime": req.body.login_time,
                                    "total_break_time": parseFloat(total_logged).toFixed(2),
                                });
                                update_emp_att_data = {
                                    "total_break_time" : upTime,
                                    "logout_time" : "",
                                    "break_time" : employeeAttendanceData.break_time,
                                };
                            }
                            await AttendanceLog.findOneAndUpdate({employee_attendance_id: mongoose.Types.ObjectId(employeeAttendanceData._id)},
                                update_data, { upsert: true, new: true, setDefaultsOnInsert: true });
                            await EmployeeAttendance.findOneAndUpdate({_id: mongoose.Types.ObjectId(employeeAttendanceData._id)},
                            update_emp_att_data);
                        }
                        else{
                            var insert_data = {
                                "corporate_id": employeeAttendanceData.corporate_id,
                                "emp_id": employeeAttendanceData.emp_id,
                                "employee_attendance_id": mongoose.Types.ObjectId(employeeAttendanceData._id),
                                "wage_month":employeeAttendanceData.attendance_month,
                                "wage_year":employeeAttendanceData.attendance_year,
                                "attendance_date":employeeAttendanceData.attendance_date,
                                "entries":[{
                                    "entry_time": req.body.login_time,
                                    "entry_type": "in"
                                }],
                                "status":"active",
                            }
                            var attendance_log = await AttendanceLog.findOneAndUpdate({employee_attendance_id: mongoose.Types.ObjectId(employeeAttendanceData._id)},
                            insert_data, { upsert: true, new: true, setDefaultsOnInsert: true });
                            var up_data_at = {
                                login_time: req.body.login_time ? req.body.login_time: "00:00",
                                login_out: "",
                            }
                            await EmployeeAttendance.findOneAndUpdate({_id: mongoose.Types.ObjectId(employeeAttendanceData._id)},
                            up_data_at, { upsert: false, new: true, setDefaultsOnInsert: true });
                        }
                    }
                    return resp.status(200).send({status: "success",message: "Activities were changed successfully.", data:attendance_log});
                }
                else{
                    return resp.status(200).send({status: "error",message: "You not eligible at this time to check in and check out.",});
                }
            
            }
        } catch (e) {
            return resp.status(200).json({
                status: "error",
                message: e ? e.message : "Something went wrong",
            });
        }
    },
    attendance_log_details: async (req, resp) => {
        try {
            const v = new Validator(req.body, {
                attendance_date : "required|date"
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({
                    status: "val_err",
                    message: "Validation error",
                    val_msg: v.errors,
                });
            } else {
                var attendance_log = await AttendanceLog.findOne({emp_id:req.authData.userid,attendance_date:req.body.attendance_date});
                return resp.status(200).send({status: "success",message: "Fetch successfully.", data:attendance_log});
            }
        } catch (e) {
            return resp.status(200).json({
                status: "error",
                message: e ? e.message : "Something went wrong",
            });
        }
    },
}
function munitestohour(totalMinutes){
    var minutes =  totalMinutes % 60;
    var hours  = Math.floor(totalMinutes / 60);
    var total_logged = hours.toString().padStart(2, '0')+"."+minutes.toString().padStart(2, '0');
    return parseFloat(total_logged).toFixed(2);
}
function convertH2M(timeInHour){
  var timeParts = timeInHour.toString().split(".");
  return Number(timeParts[0]) * 60 + Number(timeParts[1]);
}
