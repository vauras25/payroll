var Company = require('../../Model/Admin/Company');
var Company_details = require('../../Model/Admin/Company_details');
var Employee = require('../../Model/Company/employee');
var EmployeeDetails = require("../../Model/Company/employee_details");
var Staff = require("../../Model/Company/Staff");
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const  niv = require('node-input-validator');
const moment = require('moment');
const archiver = require('archiver');
const fs = require('fs');
const {resolve} = require('path');
const absolutePath = resolve('');
module.exports = {
    get_salary_voucher_data: async function (req, resp, next) {
        try {
            const v = new Validator(req.body, {
                wage_month: "required",
                wage_year: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
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
            var path_array = [];
            var wage_month=req.body.wage_month;
            var wage_year=req.body.wage_year;
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
                if(req.body.emp_status != 'all')
                {
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
                        parent_hods: { $in: [req.authId] } ,
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
            search_option_details.$match['employee_monthly_reports.wage_month']= parseInt(wage_month);
            search_option_details.$match['employee_monthly_reports.wage_year']=  parseInt(wage_year);
            var myAggregate = Employee.aggregate([
                search_option,
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
                    $lookup:
                    {
                        from: 'employee_monthly_reports',
                        "let": { "emp_db_idVar": "$_id"},
                        "pipeline": [
                        { 
                            "$match": { 
                                $and :[
                                {"$expr": { "$eq": ["$emp_db_id", "$$emp_db_idVar"] }},
                                {"wage_month": parseInt(wage_month)},
                                {"wage_year": parseInt(wage_year)},
                                ] 
                            } 
                        }],
                        as: 'employee_monthly_reports',
                    }
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
                search_option_details,
                {
                    $addFields: {
                        employee_details: {
                            $arrayElemAt: ["$employee_details", 0],
                        },
                        "employee_monthly_reports": {
                            "$arrayElemAt": [ "$employee_monthly_reports", 0 ]
                        },
                        "companies": {
                            "$arrayElemAt": [ "$companies", 0 ]
                        },
                    },
                },
                {
                    $unwind: "$company_details"
                },
                {
                    $project: {
                        _id: 1,
                        corporate_id: 1,
                        userid: 1,
                        emp_id: 1,
                        emp_first_name: 1,
                        emp_last_name: 1,
                        "employee_monthly_reports.total_data.total_earning":1,
                        "employee_monthly_reports.wage_month":1,
                        "employee_monthly_reports.wage_year":1,
                        "companies.establishment_name":1,
                        "companies.com_logo":1,
                    },
                }])
            .then(async (emps) => {
                await Promise.all(emps.map( async function(empdata) {
                    var file_path='/storage/company/temp_files/'+req.authData.corporate_id+'/salary_voucher/';
                    var file_name='salary-voucher-'+empdata.corporate_id+'-'+empdata.emp_id+'-'+wage_month+'-'+wage_year+'.pdf';
                    path_array.push({ 
                        // "link": 'D:/node/payrollbackend/'+file_path+file_name,
                        "link": absolutePath+file_path+file_name,
                        "file_path":file_path,
                        "file_name":file_name
                    });
                    // console.log(path.dirname(baseurl+file_path+file_name));
                    // return false;
                    var pdf_file= await Site_helper.generate_salary_voucher_pdf({salary_data: empdata},file_name,file_path);
                }))
                .then(async (emps) => {
                    var path_link = null;
                    let file_name = 'salary-voucher-'+wage_month+'-'+wage_year+'.zip';
                    let file =  Site_helper.createFiles(wb,file_name, req.authData.corporate_id, 'temp_files/voucher-module');
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
                            console.log('Archive finished.');
                        });
                        archive.on('error', (err) => {
                            console.log('Error.',err);
                        });
                        archive.pipe(output);
                        path_array.map( async function(parray) {
                            archive.append(fs.createReadStream(parray.link), { name: parray.file_name });
                        });
                        archive.finalize();
                        // file_path = '/storage/company/temp_files/'+req.authData.corporate_id+"/salary_voucher/";
                        await Site_helper.downloadAndDelete(file.file_name,file.location, req.authData.corporate_id,resp);
                        // await Site_helper.downloadAndDelete(file_name,file_path,req.authData.corporate_id,resp);
                        // path_link = baseurl+'storage/company/salary_voucher/salary-voucher-'+wage_month+'-'+wage_year+'.zip';
                    }
                    else{
                        return resp.status(200).json({status: "success", message: 'Salary voucher zip generated successfully.'});
                    }
                });
            }); 
        } 
        catch (e) {
            return resp.status(200).json({status: "error",message: e ? e.message : "Something went wrong",});
        }
    },
};
