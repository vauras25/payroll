var CompanyDetails = require("../../Model/Admin/Company_details");
var Employee = require("../../Model/Company/employee");
var User = require("../../Model/Admin/User");
var EmployeeDetails = require("../../Model/Company/employee_details");
var Department = require("../../Model/Admin/Department");
var Designation = require("../../Model/Admin/Designation");
var EmpRole = require("../../Model/Company/EmpRole");
var EmployeePackage = require("../../Model/Company/EmployeePackage");
var SalaryTemp = require("../../Model/Admin/SalaryTemp");
var Staff = require("../../Model/Company/Staff");
var ComRole = require("../../Model/Company/Role");
var Company = require("../../Model/Admin/Company");
var Client = require("../../Model/Company/Client");
var Attendancerule = require("../../Model/Admin/Attendance");
var BonusTemp = require("../../Model/Admin/BonusTemp");
var IncentiveTemp = require("../../Model/Admin/IncentiveTemp");
var OvertimeTemp = require("../../Model/Admin/OvertimeTemp");
var Ptaxrule = require("../../Model/Admin/Ptaxrule");
var Tdsrule = require("../../Model/Admin/Tdsrule");
var LeaveRule = require("../../Model/Admin/LeaveRule");
var LwfRule = require("../../Model/Admin/LwfRule");
var ArrearSlipTemp = require("../../Model/Admin/ArrearSlipTemp");
var BonusSlipTemp = require("../../Model/Admin/BonusSlipTemp");
var Dispensary = require("../../Model/Company/Dispensary");
var EmployeeSheetTemplate = require("../../Model/Company/EmployeeSheetTemplate");
var CompanyLocation = require("../../Model/Company/CompanyLocation");
var FileManager = require("../../Model/Company/FileManager");
var Site_helper = require("../../Helpers/Site_helper");
const { Validator } = require("node-input-validator");
const mongoose = require("mongoose");
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const niv = require("node-input-validator");
const PayslipTemp = require("../../Model/Admin/PayslipTemp");
const LeaveTempHead = require("../../Model/Admin/LeaveTempHead");
const EmployeeInvitation = require("../../Model/Company/EmployeeInvitationLink");
const Attendance_summaries = require("../../Model/Company/AttendanceSummary");
const Full_and_final = require("../../Model/Company/FullAndFinal");
const Company_monthly_Data_Logs = require("../../Model/Company/CompanyMonthlyDataLogs");
const credit = require("../../Model/Company/CreditPurchase");
const moment = require('moment');
const employeeDetails = require("../../Model/Company/employee_details");
const PdfPrinter = require("pdfmake");
const { resolve } = require('path');
const EmployeeLog = require("../../Model/Company/EmployeeLogs");
const absolutePath = resolve('');

niv.extend("uniqueUserId", async ({ value, args }) => {
  // default field is email in this example
  const filed = args[1] || "email";
  let condition = {};

  condition[filed] = value;

  // add ignore condition
  if (args[3]) {
    condition["_id"] = { $ne: mongoose.Types.ObjectId(args[3]) };
  }
  condition["corporate_id"] = { $eq: args[2] };
  //console.log(args);
  let emailExist = await mongoose
    .model(args[0])
    .findOne(condition)
    .select(filed);

  // email already exists
  if (emailExist) {
    return false;
  }

  return true;
});
niv.extend("unique_empid", async ({ value, args }) => {
  // default field is email in this example
  const filed = args[1] || "email";
  let condition = {};
  //console.log('asd'+args)
  //return args;
  condition[filed] = value;
  //condition['corporate_id'] = { $eq: args[2] };
  // add ignore condition
  if (args[3]) {
    condition["_id"] = { $ne: mongoose.Types.ObjectId(args[3]) };
  }

  let emailExist = await mongoose
    .model(args[0])
    .findOne(condition)
    .select(filed);

  // email already exists
  if (emailExist) {
    return false;
  }

  return true;
});
module.exports = {
  add_employee_data: async function (req, resp) {
    try {
      // var corporate_id = req.authData.corporate_id;
      const v = new Validator(req.body, {
        emp_first_name: "required",
        emp_last_name: "required",
        emp_dob: "required",
        sex: "required|in:m,f,t,o",
        mobile_no: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var document = {
          corporate_id: req.authData ? req.authData.corporate_id : null,
          created_by: req.authData ? req.authData.userdb_id : null,
          //userid:req.body.userid,
          emp_first_name: req.body.emp_first_name,
          emp_last_name: req.body.emp_last_name,
          emp_father_name: req.body.emp_father_name,
          email_id: req.body.email_id,
          mobile_no: req.body.mobile_no,
          alternate_mob_no: req.body.alternate_mob_no,
          emp_dob: req.body.emp_dob,
          sex: req.body.sex,
          aadhar_no: req.body.aadhar_no,
          pan_no: req.body.pan_no,
          passport_no: req.body.passport_no,
          passport_val_form: req.body.passport_val_form,
          passport_val_to: req.body.passport_val_to,
          nationality: req.body.nationality,
          blood_group: req.body.blood_group,
          physical_disability: req.body.physical_disability,
          emp_spouse_name: req.body.emp_spouse_name,
          country: req.body.country,
          marriage_date: req.body.marriage_date,
          emergency_contact_no: req.body.emergency_contact_no,
          emergency_contact_name: req.body.emergency_contact_name,
          domicile: req.body.domicile,
          height: req.body.height,
          marital_status: req.body.marital_status
            ? req.body.marital_status
            : "unmarried",
          religion: req.body.religion ? req.body.religion : "no_religion",
          emp_hod: mongoose.Types.ObjectId(req.body.emp_hod),
          password: "",
          status: "pending",
          approval_status: "pending",
          created_at: Date.now(),
        };
        var obj = req.files;

        if (req.body.invitation_id) {
          var entity = await EmployeeInvitation.findById(
            req.body.invitation_id
          );
          if (entity) {
            document.emp_hod = entity.hod_id;
            document.corporate_id = entity.corporate_id;
            document.created_by = entity.emp_db_id;
            document.invitation_id = entity._id;
          }
        }
        let hod_id = req.body.emp_hod ?? entity.hod_id;
        var parent_hods = [];
        const parentHod = await Staff.findOne({ _id: hod_id }, "parent_hods");
        if (parentHod) {
          parent_hods = parentHod.parent_hods;
        }
        parent_hods.push(hod_id);
        (document["parent_hods"] = parent_hods),
          await Promise.all(
            obj.map(async (file) => {
              var file_data = {
                corporate_id: req.authData
                  ? req.authData.corporate_id
                  : document.corporate_id,
                emp_db_id: req.body.employee_id,
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
              if (file.fieldname === "profile_image") {
                file_data["folder_name"] = "Employee Profile Image";
                file_data["upload_for"] = "employee_profile_image";
                document["profile_pic"] = file.path;
              }
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
        //console.log(req.authId, document);
        const user_data = await Employee.create(document);

        const emp_document = {
          emp_id: "",
          employee_id: user_data._id,
          corporate_id: document.corporate_id,
          emp_address: {
            resident_no: "",
            residential_name: "",
            address_proof: "aadhaar",
            city: "",
            district: "",
            town_village: "",
            state: "",
            locality: "",
            pincode: "",
            diff_current_add: "no",
          },
          emp_curr_address: {
            resident_no: "",
            residential_name: "",
            city: "",
            district: "",
            town_village: "",
            state: "",
            locality: "",
            pincode: "",
          },
          employment_hr_details: {
            gross_salary: req.body.gross_salary,
          },
        };

        const employeedet = await EmployeeDetails.create(emp_document);

        return resp.status(200).send({
          status: "success",
          message: "Employee created successfully",
          user_data: user_data,
        });
        //});
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_master_data: async function (req, resp, next) {
    try {
      var masters = {
        branch: [],
        designation: [],
        department: [],
        staff: [],
        role: [],
        packages: [],
        salarytemp: [],
        hod: [],
        emp_id: null,
        clients: [],
        bank_accounts: [],
        emp_role: [],
        company_location: [],
      };
      // update admin panel master data corporet id
      await Designation.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id designation_name",
        function (err, designation) {
          if (!err) {
            masters.designation = designation;
          }
        }
      );
      await EmpRole.find(
        { status: "active" },
        "_id template_name template_id rights",
        function (err, emp_role) {
          if (!err) {
            masters.emp_role = emp_role;
          }
        }
      );

      await Company.findOne(
        {
          $and: [
            { status: "active" },
            { corporate_id: req.authData.corporate_id },
          ],
        },
        "_id ",
        async function (err, companydata) {
          await CompanyDetails.findOne(
            { company_id: companydata._id },
            "company_branch._id company_branch.branch_name",
            function (err, branches) {
              if (!err) {
                masters.branch = branches;
              }
            }
          );
        }
      );

      await Employee.findOne(
        { corporate_id: req.authData.corporate_id },
        "emp_id userid",
        { sort: { approve_at: -1 } },
        function (err, empdata) {
          if (!err) {
            //console.log('aaaaaaaaa',empdata.emp_id,req.authData.corporate_id)
            if (empdata) {
              masters.emp_id = empdata.emp_id ? empdata.emp_id : "";
            }

            //masters.empid=empdata.emp_id;
          }
        }
      );

      // await User.find({"corporate_id":req.authData.corporate_id,status:'active',is_hod:'yes' },'_id first_name last_name',  function (err, hod) {
      //     if (!err)
      //     {
      //       masters.hod=hod;

      //     }
      // })
      await Client.find(
        { corporate_id: req.authData.corporate_id, status: "active" },
        "_id client_name client_code",
        function (err, clients) {
          if (!err) {
            masters.clients = clients;
          }
        }
      );
      await Department.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id department_name",
        function (err, department) {
          if (!err) {
            masters.department = department;
          }
        }
      );
      await Staff.find(
        {
          $and: [
            { status: "active" },
            { corporate_id: req.authData.corporate_id },
            { is_hod: "yes" },
          ],
        },
        "_id first_name last_name",
        async function (err, staff) {
          if (!err) {
            await Company.find(
              {
                $and: [
                  { status: "active" },
                  { corporate_id: req.authData.corporate_id },
                ],
              },
              "_id establishment_name",
              function (err, companydata) {
                //console.log(companydata)
                staff.push({
                  _id: companydata[0]._id,
                  first_name: companydata[0].establishment_name,
                  last_name: "",
                });
              }
            );
            //console.log(req.authData);

            masters.staff = staff;
            masters.hod = staff;
          }
        }
      );
      await EmployeePackage.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id package_name",
        function (err, packages) {
          if (!err) {
            masters.packages = packages;
          }
        }
      );
      await SalaryTemp.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id template_name",
        function (err, salarytemp) {
          if (!err) {
            masters.salarytemp = salarytemp;
          }
        }
      );
      var bank_accounts = EmployeeDetails.distinct("bank_details.bank_name", { corporate_id: req.authData.corporate_id });
      masters.bank_accounts = await bank_accounts;
      await CompanyLocation.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id corporate_id location address latitude longitude status",
        function (err, location) {
          if (!err) {
            masters.company_location = location;
          }
        }
      );
      await ComRole.find(
        { status: "active", corporate_id: req.authData.corporate_id, approve: "yes" },
        "_id role_name role_id_name",
        function (err, role) {
          if (!err) {
            masters.role = role;
            return resp
              .status(200)
              .send({ status: "success", message: "", masters: masters });
          }
        }
      );
      //console.log('asdasdasd',bank_accounts)
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_list: async function (req, resp, next) {
    try {
      // const v = new Validator(req.body, {
      //   pageno: 'required',
      // });
      // const matched = await v.check();
      // if (!matched) {
      //     return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      // }
      // else{
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
      //console.log(req.authId, "asdasd");
      var search_option = {
        $match: {
          $and: [
            { corporate_id: req.authData.corporate_id },
            {
              $or: [
                { parent_hods: { $in: [req.authId] } },
                { parent_hods: { $in: [mongoose.Types.ObjectId(req.authId)] } }
              ]
            },
            { status: { $ne: "deleted" } },
          ],
        },
      };
      //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
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
          ] =
          {
            $gte: new Date(req.body.doj_from),
            $lte: new Date(req.body.doj_to),
          };
        }
        if (req.body.doe_from && req.body.doe_to) {
          search_option_details.$match[
            "employee_details.employment_hr_details.date_of_exit"
          ] =
          {
            $gte: new Date(req.body.doe_from),
            $lte: new Date(req.body.doe_to),
          };
        }
      }
      if (req.body.searchkey) {
        search_option = {
          $match: {
            // $text: { $search: req.body.searchkey },
            $or: [
              { emp_first_name: { $regex: req.body.searchkey, $options: "i" } },
              { emp_last_name: { $regex: req.body.searchkey, $options: "i" } },
              { emp_id: { $regex: req.body.searchkey, $options: "i" } }
              // Add other fields to search here
            ],
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
          //search_option_details.$match['employee_details.employment_hr_details.designation']=mongoose.Types.ObjectId(req.body.designation_id);
        }
        if (req.body.department_id) {
          var department_ids = JSON.parse(req.body.department_id);
          department_ids = department_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.department"
          ] = { $in: department_ids };
          //search_option_details.$match['employee_details.employment_hr_details.department']=mongoose.Types.ObjectId(req.body.department_id);
        }
        if (req.body.branch_id) {
          var branch_ids = JSON.parse(req.body.branch_id);
          branch_ids = branch_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.branch"
          ] = { $in: branch_ids };
          //search_option_details.$match['employee_details.employment_hr_details.branch']=mongoose.Types.ObjectId(req.body.branch_id);
        }
        if (req.body.client_id) {
          var client_ids = JSON.parse(req.body.client_id);
          client_ids = client_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.client_id = { $in: client_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
        if (req.body.hod_id) {
          var hod_ids = JSON.parse(req.body.hod_id);
          hod_ids = hod_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.emp_hod = { $in: hod_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
      }
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
          $lookup: {
            from: "employees_attendances",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "employees_attendances",
          },
        },
        {
          $lookup: {
            from: "employee_monthly_reports",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "employee_monthly_reports",
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
            attendance_count: { $size: "$employees_attendances" },
            monthly_reports_count: { $size: "$employee_monthly_reports" },
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
            //  "hod":1,
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
            attendance_count: 1,
            monthly_reports_count: 1
          },
        },
      ]);

      (await myAggregate).forEach(async v => {
        await employeeDetails.updateOne(
          { employee_id: v._id },
          { $set: { corporate_id: req.authData.corporate_id } }
        )
      })
      Employee.aggregatePaginate(
        myAggregate,
        options,
        async function (err, employees) {
          if (err) return resp.json({ status: "error", message: err.message });
          var masters = { hod_list: [] };
          await Staff.find(
            { status: "active", is_hod: "yes" },
            "_id first_name last_name",
            function (err, staff) {
              if (!err) {
                masters.hod_list = staff;
              }
            }
          );
          // await Employee.find({  status:'active',is_hod:'yes' },'_id emp_first_name emp_last_name',  function (err, hod_list) {
          //     if (!err)
          //     {
          //       masters.hod_list=hod_list;
          //     }
          // })
          return resp.status(200).json({
            status: "success",
            employees: employees,
            masters: masters,
          });
        }
      );
      //}
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        const options = {
          sort: { created_at: -1 },
        };
        var search_option = {
          $match: { _id: mongoose.Types.ObjectId(req.body.employee_id) },
        };
        Employee.aggregate(
          [
            search_option,
            {
              $lookup: {
                from: "employee_details",
                localField: "_id",
                foreignField: "employee_id",
                as: "emp_det",
              },
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
              $addFields: {
                emp_det: {
                  $arrayElemAt: ["$emp_det", 0],
                },
                total_file_size: {
                  $round: [
                    { $divide: [{ $sum: "$file_managers.file_size" }, 1024] },
                    2
                  ],
                },
              },
            },
          ],
          async function (err, employee_det) {
            if (err)
              return resp.json({ status: "error", message: err.message });
            if (employee_det.length > 0) {
              return resp
                .status(200)
                .json({ status: "success", employee_det: employee_det[0] });
            } else {
              return resp
                .status(200)
                .json({ status: "error", message: "Something went wrong" });
            }
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
  update_employee_status: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
        status: "required|in:active,inactive,pending",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var document = {
          status: req.body.status,
        };
        Employee.updateOne(
          { _id: req.body.employee_id },
          document,
          function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              return resp.status(200).send({
                status: "success",
                message: "Status has been updated successfully",
                emp_det: emp_det,
              });
            }
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
  employee_bulk_update: async function (req, resp, next) {
    try {
      //   const v = new Validator(req.body, {
      //     employee_ids:'required',
      // });
      // const matched = await v.check();
      // if (!matched) {
      // return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      // }
      // else{
      var sortbyfield = req.body.sortbyfield;
      if (sortbyfield) {
        var sortoption = {};
        sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
      } else {
        var sortoption = { created_at: -1 };
      }
      const options = {
        page: req.body.pageno,
        limit: 3,
        sort: sortoption,
      };
      var search_option = {
        $match: { corporate_id: req.authData.corporate_id },
      };
      var search_option_details = { $match: {} };
      if (req.body.searchkey) {
        search_option = {
          $match: {
            $text: { $search: req.body.searchkey },
            corporate_id: req.authData.corporate_id,
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
          search_option_details.$match[
            "employee_details.employment_hr_details.designation"
          ] = mongoose.Types.ObjectId(req.body.designation_id);
        }
        if (req.body.department_id) {
          search_option_details.$match[
            "employee_details.employment_hr_details.department"
          ] = mongoose.Types.ObjectId(req.body.department_id);
        }
        if (req.body.branch_id) {
          search_option_details.$match[
            "employee_details.employment_hr_details.branch"
          ] = mongoose.Types.ObjectId(req.body.branch_id);
        }
        if (req.body.hod_id) {
          search_option.$match.emp_hod = mongoose.Types.ObjectId(
            req.body.hod_id
          );
        }
      }
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
      var document = {};
      if (req.body.salary_temp) {
        document["employment_hr_details.salary_temp"] = req.body.salary_temp;
        var salltempdata = SalaryTemp.findOne({ _id: req.body.salary_temp });
        document["template_data.salary_temp_data"] = await salltempdata;
      }
      if (req.body.package) {
        document["employment_hr_details.package_id"] = req.body.package;
        var packagedata = EmployeePackage.findOne({ _id: req.body.package });
        packagedata = await packagedata;
        document["template_data.attendance_temp_data"] =
          await Attendancerule.findOne(
            { status: "active", _id: packagedata.attendance_temp },
            "-history"
          );
        document["template_data.bonus_temp_data"] = await BonusTemp.findOne(
          { _id: packagedata.bonus_temp },
          "-history"
        );
        document["template_data.incentive_temp_data"] =
          await IncentiveTemp.findOne(
            { _id: packagedata.incentive_temp },
            "-history"
          );
        document["template_data.overtime_temp_data"] =
          await OvertimeTemp.findOne(
            { _id: packagedata.overtime_temp },
            "-history"
          );
        document["template_data.ptax_temp_data"] = await Ptaxrule.findOne(
          { _id: packagedata.ptax_temp },
          "-history"
        );
        document["template_data.leave_temp_data"] = await LeaveRule.findOne(
          { _id: packagedata.leave_temp },
          "-history"
        );
        document["template_data.lwf_temp_data"] = await LwfRule.findOne(
          { _id: packagedata.lwf_temp },
          "-history"
        );
        document["template_data.tds_temp_data"] = await Tdsrule.findOne(
          { _id: packagedata.tds_temp },
          "-history"
        );
        document["template_data.payslip_temp_data"] = await PayslipTemp.findOne(
          { _id: packagedata.payslip_temp },
          "-history"
        );
        document["template_data.bonus_slip_temp_data"] =
          await BonusSlipTemp.findOne(
            { _id: packagedata.bonus_slip_temp },
            "-history"
          );
        document["template_data.arrear_slip_temp_data"] =
          await ArrearSlipTemp.findOne(
            { _id: packagedata.arrear_slip_temp },
            "-history"
          );
      }
      Employee.aggregate([
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
          $project: {
            _id: 1,
            corporate_id: 1,
            userid: 1,
          },
        },
      ]).then(async (memes) => {
        //console.log(memes);
        var responseArray = await Promise.all(
          memes.map(function (emp) {
            //console.log(emp._id,document)
            EmployeeDetails.updateOne(
              { employee_id: emp._id },
              { $set: document },
              function (err, emp_det) {
                return emp_det;
                //return resp.status(200).send({ status: 'success', message:"Employee data has been updated successfully", emp_det: emp_det });
              }
            );
          })
        );
        return resp.status(200).send({
          status: "success",
          message: "Employee data has been updated successfully",
        });
      });
    } catch (e) {
      //}
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  active_new_employee: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
        salary_temp: "required",
        gross_salary: "required",
        date_of_join: "required",
        package: "required",
        emp_id:
          "required|unique_empid:employees,emp_id," + req.authData.corporate_id,
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {

        var document = {};
        if (req.body.salary_temp) {
          /* check and assign Salary template */
          document["employment_hr_details.salary_temp"] = req.body.salary_temp;
          var salltempdata = await SalaryTemp.findOneAndUpdate(
            { _id: req.body.salary_temp },
            { $set: { edit_status: "inactive" } },
            { returnOriginal: false }
          );
          document["template_data.salary_temp_data"] = salltempdata;
        }
        if (req.body.package) {
          /* check and assign Salary template */
          document["employment_hr_details.package_id"] = req.body.package;
          var packagedata = await EmployeePackage.findOne({ _id: req.body.package });
          // packagedata = await packagedata;
          document["template_data.attendance_temp_data"] =
            await Attendancerule.findOne(
              { status: "active", _id: packagedata.attendance_temp },
              "-history"
            );
          document["template_data.bonus_temp_data"] = await BonusTemp.findOne(
            { _id: packagedata.bonus_temp },
            "-history"
          );
          document["template_data.incentive_temp_data"] =
            await IncentiveTemp.findOne(
              { _id: packagedata.incentive_temp },
              "-history"
            );
          document["template_data.overtime_temp_data"] =
            await OvertimeTemp.findOne(
              { _id: packagedata.overtime_temp },
              "-history"
            );
          document["template_data.ptax_temp_data"] = await Ptaxrule.findOne(
            { _id: packagedata.ptax_temp },
            "-history"
          );
          document["template_data.leave_temp_data"] = await LeaveRule.findOne(
            { _id: packagedata.leave_temp },
            "-history"
          );
          document["template_data.lwf_temp_data"] = await LwfRule.findOne(
            { _id: packagedata.lwf_temp },
            "-history"
          );
          document["template_data.tds_temp_data"] = await Tdsrule.findOne(
            { _id: packagedata.tds_temp },
            "-history"
          );
          document["template_data.payslip_temp_data"] =
            await PayslipTemp.findOne(
              { _id: packagedata.payslip_temp },
              "-history"
            );
          document["template_data.bonus_slip_temp_data"] =
            await BonusSlipTemp.findOne(
              { _id: packagedata.bonus_slip_temp },
              "-history"
            );
          document["template_data.arrear_slip_temp_data"] =
            await ArrearSlipTemp.findOne(
              { _id: packagedata.arrear_slip_temp },
              "-history"
            );
        }
        await Site_helper.employeeDetailsLeaveCounterAssign(
          req.body.employee_id,
          document["template_data.leave_temp_data"]
        );
        document["employment_hr_details.gross_salary"] = +req.body.gross_salary;
        document["employment_hr_details.date_of_join"] = req.body.date_of_join;

        EmployeeDetails.findOneAndUpdate(
          { employee_id: req.body.employee_id },
          { $set: document },
          async function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: emp_err.message });
            }

            packagedata.assigned_status = 'assigned';
            await packagedata.save();
            const salaryTempData = emp_det.template_data.salary_temp_data
            const grossSalary = emp_det.employment_hr_details.gross_salary
            if (!emp_det.salary_breakups || !emp_det.salary_breakups.length) {
              emp_det.salary_breakups = []
            }
            emp_det.salary_breakups.push({ ...await Site_helper.get_salary_breakup(req, salaryTempData, grossSalary, emp_det), effective_from: new Date().toISOString() })
            await emp_det.save();
            var document2 = {
              emp_id: req.body.emp_id,
              status: "approved",
              approval_status: "approved",
              approve_at: Date.now(),
            };
            Employee.findOneAndUpdate(
              { _id: req.body.employee_id },
              { $set: document2 },
              async function (emp_err, emp_det) {
                if (emp_err) {
                  return resp
                    .status(200)
                    .send({ status: "error", message: emp_err.message });
                } else {
                  var entity = await EmployeeInvitation.findById(
                    emp_det.invitation_id
                  );
                  if (entity) {
                    entity.status = "inactive";
                    entity.save();
                  }
                  return resp.status(200).send({
                    status: "success",
                    message: "Employee has been activated successfully",
                    emp_det: emp_det,
                  });
                }
              }
            );
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
  update_employee_details: async function (req, resp) {
    try {
      // var corporate_id = req.authData.corporate_id;
      const v = new Validator(req.body, {
        employee_id: "required",
        emp_first_name: "required",
        emp_last_name: "required",
        emp_dob: "required",
        sex: "required|in:m,f,t,o",
        mobile_no: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var parent_hods = [];
        // Staff.findOne({"_id":req.body.emp_hod},'parent_hods', async function (err, parent_hod) {
        //   if (!err)
        //   {
        //     if(parent_hod)
        //     {
        //       parent_hods=parent_hod.parent_hods;
        //     }
        //     parent_hods.push(req.body.emp_hod);
        var document = {
          emp_first_name: req.body.emp_first_name,
          emp_last_name: req.body.emp_last_name,
          emp_father_name: req.body.emp_father_name,
          email_id: req.body.email_id,
          mobile_no: req.body.mobile_no,
          alternate_mob_no: req.body.alternate_mob_no,
          emp_dob: req.body.emp_dob,
          sex: req.body.sex,
          aadhar_no: req.body.aadhar_no,
          pan_no: req.body.pan_no,
          passport_no: req.body.passport_no,
          passport_val_form: req.body.passport_val_form,
          passport_val_to: req.body.passport_val_to,
          nationality: req.body.nationality,
          blood_group: req.body.blood_group,
          physical_disability: req.body.physical_disability,
          emp_spouse_name: req.body.emp_spouse_name,
          country: req.body.country,
          marriage_date: req.body.marriage_date,
          emergency_contact_no: req.body.emergency_contact_no,
          emergency_contact_name: req.body.emergency_contact_name,
          domicile: req.body.domicile,
          height: req.body.height,
          marital_status: req.body.marital_status
            ? req.body.marital_status
            : "unmarried",
          religion: req.body.religion ? req.body.religion : "no_religion",
          //emp_hod:mongoose.Types.ObjectId(req.body.emp_hod),
          //parent_hods:parent_hods,
          updated_at: Date.now(),
        };
        if (req.body.password) {
          const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
          document["password"] = hash_pass;
        }

        if (req.body.invitation_id) {
          var entity = await EmployeeInvitation.findById(
            req.body.invitation_id
          );
          if (entity) {
            var corporate_id = entity.corporate_id;
          }
        }

        var obj = req.files;
        await Promise.all(
          obj.map(async (file) => {
            var file_data = {
              corporate_id: req.authData
                ? req.authData.corporate_id
                : corporate_id,
              emp_db_id: req.body.employee_id,
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
            if (file.fieldname === "emp_aadhaar_enrolment_image") {
              file_data["folder_name"] = "Aadhaar Enrolment Image";
              file_data["upload_for"] = "aadhaar_enrolment_image";
              document["emp_aadhaar_enrolment_image"] = file.path;
            }
            if (file.fieldname === "emp_passport_image") {
              file_data["folder_name"] = "Passport Image";
              file_data["upload_for"] = "passport_image";
              document["emp_passport_image"] = file.path;
            }
            if (file.fieldname === "additional_id_image") {
              file_data["folder_name"] = "Additional Image";
              file_data["upload_for"] = "additional_image";
              document["additional_id_image"] = file.path;
            }
            if (file.fieldname === "profile_image") {
              file_data["folder_name"] = "Employee Profile Image";
              file_data["upload_for"] = "employee_profile_image";
              document["profile_pic"] = file.path;
            }
            var fileuploaddata = await Site_helper.upload_file_manager(
              file_data
            );
          })
        );
        Employee.updateOne(
          { _id: req.body.employee_id },
          { $set: document },
          function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              return resp.status(200).send({
                status: "success",
                message: "Employee details has been updated successfully",
                emp_det: emp_det,
              });
            }
          }
        );
        //   }
        // })
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_address: async function (req, resp, next) {
    try {
      // const v = new Validator(req.body, {
      //     employee_id:'required',
      //     resident_no: 'required',
      //     residential_name: 'required',
      //     address_proof: 'required|in:aadhaar,pan',
      //     city: 'required',
      //     district: 'required',
      //     town_village: 'required',
      //     state: 'required',
      //     locality: 'required',
      //     pincode:'required',
      // });
      // const matched = await v.check();
      //     if (!matched) {
      //     return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      //     }
      //     else{
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
      if (req.body.invitation_id) {
        var entity = await EmployeeInvitation.findById(req.body.invitation_id);
        if (entity) {
          var corporate_id = entity.corporate_id;
        }
      }
      var obj = req.files;

      await Promise.all(
        obj.map(async (file) => {
          var file_data = {
            corporate_id: req.authData
              ? req.authData.corporate_id
              : corporate_id,
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

      var document2 = {
        "emp_curr_address.resident_no":
          req.body.diff_current_add == "yes"
            ? req.body.curr_resident_no
            : req.body.resident_no,
        "emp_curr_address.residential_name":
          req.body.diff_current_add == "yes"
            ? req.body.curr_residential_name
            : req.body.residential_name,
        "emp_curr_address.road":
          req.body.diff_current_add == "yes"
            ? req.body.curr_road
            : req.body.road,
        "emp_curr_address.locality":
          req.body.diff_current_add == "yes"
            ? req.body.curr_locality
            : req.body.locality,
        "emp_curr_address.city":
          req.body.diff_current_add == "yes"
            ? req.body.curr_city
            : req.body.city,
        "emp_curr_address.district":
          req.body.diff_current_add == "yes"
            ? req.body.curr_district
            : req.body.district,
        "emp_curr_address.state":
          req.body.diff_current_add == "yes"
            ? req.body.curr_state
            : req.body.state,
        "emp_curr_address.pincode":
          req.body.diff_current_add == "yes"
            ? req.body.curr_pincode
            : req.body.pincode,
        "emp_curr_address.country":
          req.body.diff_current_add == "yes"
            ? req.body.curr_country
            : req.body.country,
      };

      EmployeeDetails.updateOne(
        { employee_id: req.body.employee_id },
        document,
        function (err, emp_det) {
          if (err) {
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          } else {
            EmployeeDetails.updateOne(
              { employee_id: req.body.employee_id },
              document2,
              function (err, emp_det) {
                if (err) {
                  return resp
                    .status(200)
                    .send({ status: "error", message: err.message });
                } else {
                  return resp.status(200).send({
                    status: "success",
                    message: "Employee address has been updated successfully",
                    emp_det: emp_det,
                  });
                }
              }
            );
          }
        }
      );
      //}
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employment_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
        new_pf_no: "required",
        uan_no: "required",
        esic_no: "required",
        esic_dispensary: "required",
        pf_no_per_dep_file: "required",
        pf_membership_date: "required",
        esic_membership_date: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var document = {
          new_pf_no: req.body.new_pf_no,
          uan_no: req.body.uan_no,
          esic_no: req.body.esic_no,
          esic_dispensary: req.body.esic_dispensary,
          pf_no_per_dep_file: req.body.pf_no_per_dep_file,
          pf_membership_date: req.body.pf_membership_date,
          esic_membership_date: req.body.esic_membership_date,
        };
        EmployeeDetails.updateOne(
          { employee_id: req.body.employee_id },
          { employment_details: document },
          function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              return resp.status(200).send({
                status: "success",
                message: "Employment details has been updated successfully",
                emp_det: emp_det,
              });
            }
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
  update_bank_details: async function (req, resp, next) {
    try {
      // const v = new Validator(req.body, {
      //     employee_id:'required',
      //     name_on_passbook:'required',
      //     bank_name: 'required',
      //     branch_name: 'required',
      //     branch_address: 'required',
      //     account_no: 'required',
      //     account_type: 'required|in:current,saving',
      //     ifsc_code: 'required',
      // });
      // const matched = await v.check();
      //     if (!matched) {
      //     return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      //     }
      //     else{
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

      if (req.body.invitation_id) {
        var entity = await EmployeeInvitation.findById(req.body.invitation_id);
        if (entity) {
          var corporate_id = entity.corporate_id;
        }
      }
      var obj = req.files;
      await Promise.all(
        obj.map(async (file) => {
          var file_data = {
            corporate_id: req.authData
              ? req.authData.corporate_id
              : corporate_id,
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
      EmployeeDetails.updateOne(
        { employee_id: req.body.employee_id },
        document,
        function (err, emp_det) {
          if (err) {
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          } else {
            return resp.status(200).send({
              status: "success",
              message: "Bank details has been updated successfully",
              emp_det: emp_det,
            });
          }
        }
      );
      //}
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_pf_esic_details: async function (req, resp, next) {
    try {
      var document = {
        "pf_esic_details.pre_er_pf": req.body.pre_er_pf,
        "pf_esic_details.pre_er_details": JSON.parse(req.body.pre_er_details),
        "pf_esic_details.pre_er_epfo_details": JSON.parse(
          req.body.pre_er_epfo_details
        ),
        "pf_esic_details.pre_er_esic_details": JSON.parse(
          req.body.pre_er_esic_details
        ),
        "pf_esic_details.curr_er_epfo_details": JSON.parse(
          req.body.curr_er_epfo_details
        ),
        "pf_esic_details.curr_er_esic_details": JSON.parse(
          req.body.curr_er_esic_details
        ),
        "pf_esic_details.esic_family_details": JSON.parse(
          req.body.esic_family_details
        ),
        "pf_esic_details.pf_nominee_details": JSON.parse(
          req.body.pf_nominee_details
        ),
      };
      EmployeeDetails.updateOne(
        { employee_id: req.body.employee_id },
        document,
        function (err, emp_det) {
          if (err) {
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          } else {
            return resp.status(200).send({
              status: "success",
              message: "PF & ESIC details has been updated successfully",
              emp_det: emp_det,
            });
          }
        }
      );
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_hr_details: async function (req, resp, next) {
    try {
      var document = {};
      document["employment_hr_details.department"] = req.body.department
        ? mongoose.Types.ObjectId(req.body.department)
        : "";
      document["employment_hr_details.designation"] = req.body.designation
        ? mongoose.Types.ObjectId(req.body.designation)
        : "";
      document["employment_hr_details.branch"] = req.body.branch
        ? mongoose.Types.ObjectId(req.body.branch)
        : "";
      // document["employment_hr_details.date_of_join"] = req.body.date_of_join;
      document["employment_hr_details.hod"] = req.body.hod
        ? mongoose.Types.ObjectId(req.body.hod)
        : "";
      document["employment_hr_details.client"] = req.body.client
        ? mongoose.Types.ObjectId(req.body.client)
        : "";
      document["employment_hr_details.emp_type"] = req.body.emp_type
        ? req.body.emp_type
        : "";
      document["employment_hr_details.pension_applicable"] = req.body
        .pension_applicable
        ? req.body.pension_applicable
        : "";
      // document["employment_hr_details.gross_salary"] = req.body.gross_salary;
      document["employment_hr_details.emp_id"] = req.body.emp_id
        ? req.body.emp_id
        : "";
      document["employment_hr_details.emp_role"] = req.body.emp_role
        ? req.body.emp_role
        : "";
      document["employment_hr_details.emp_self_service"] = req.body
        .emp_self_service
        ? req.body.emp_self_service
        : "";
      document["employment_hr_details.location_id"] = req.body.location_id
        ? mongoose.Types.ObjectId(req.body.location_id)
        : "";
      if (req.body.emp_role) {
        var empRolesData = await EmpRole.findOne({
          _id: mongoose.Types.ObjectId(req.body.emp_role),
        });
        // var empRolesData = await EmpRole.findOne({'_id':mongoose.Types.ObjectId('649c107c64f68c0ff1ae6826')});
        if (empRolesData) {
          document["employment_hr_details.emp_role_data"] = empRolesData;
        }
      }
      // document['employment_hr_details.package_id']=req.body.package_id;
      // document['employment_hr_details.annual_benefit']=req.body.annual_benefit;
      // document['employment_hr_details.pf_applicable']=req.body.pf_applicable;

      // EmployeePackage.aggregate([
      //   { "$match": {'_id':mongoose.Types.ObjectId(req.body.package_id)} },
      //   {$lookup:{
      //     from: 'attendance_rules',
      //     localField: 'attendance_temp',
      //     foreignField: '_id',
      //     as: 'attendance_rules',
      //   }},
      //   {$lookup:{
      //     from: 'bonus_templates',
      //     localField: 'bonus_temp',
      //     foreignField: '_id',
      //     as: 'bonus_templates'
      //   }},
      //   {$lookup:{
      //     from: 'incentive_templates',
      //     localField: 'incentive_temp',
      //     foreignField: '_id',
      //     as: 'incentive_templates'
      //   }},
      //   {$lookup:{
      //     from: 'overtime_templates',
      //     localField: 'overtime_temp',
      //     foreignField: '_id',
      //     as: 'overtime_templates'
      //   }},
      //   {$lookup:{
      //     from: 'ptax_rules',
      //     localField: 'ptax_temp',
      //     foreignField: '_id',
      //     as: 'ptax_rules'
      //   }},
      //   {$lookup:{
      //     from: 'leaverules',
      //     localField: 'leave_temp',
      //     foreignField: '_id',
      //     as: 'leaverules'
      //   }},
      //   {$lookup:{
      //     from: 'lwfrules',
      //     localField: 'lwf_temp',
      //     foreignField: '_id',
      //     as: 'lwfrules'
      //   }},
      //   {$lookup:{
      //     from: 'tds_rules',
      //     localField: 'tds_temp',
      //     foreignField: '_id',
      //     as: 'tds_rules'
      //   }},
      //   {
      //     "$project": {
      //         "_id":1,
      //         "attendance_rules":1,
      //         "bonus_templates":1,
      //         "incentive_templates":1,
      //         "overtime_templates":1,
      //         "ptax_rules":1,
      //         "leaverules":1,
      //         "lwfrules":1,
      //         "tds_rules":1,
      //     }
      //   }
      // ]).then( async (package_data)=>{
      //   var attendance_rules=package_data[0].attendance_rules;
      //   if(attendance_rules.length > 0){
      //     delete(attendance_rules[0].history);
      //     document['template_data.attendance_temp_data']=attendance_rules[0];
      //   }
      //   var bonus_templates=package_data[0].bonus_templates;
      //   if(bonus_templates.length > 0){
      //     delete(bonus_templates[0].history);
      //     document['template_data.bonus_temp_data']=bonus_templates[0];
      //   }
      //   var incentive_templates=package_data[0].incentive_templates;
      //   if(incentive_templates.length > 0){
      //     delete(incentive_templates[0].history);
      //     document['template_data.incentive_temp_data']=incentive_templates[0];
      //   }
      //   var overtime_templates=package_data[0].overtime_templates;
      //   if(overtime_templates.length > 0){
      //     delete(overtime_templates[0].history);
      //     document['template_data.overtime_temp_data']=overtime_templates[0];
      //   }
      //   var ptax_rules=package_data[0].ptax_rules;
      //   if(ptax_rules.length > 0){
      //     delete(ptax_rules[0].history);
      //     document['template_data.ptax_temp_data']=ptax_rules[0];
      //   }
      //   var leaverules=package_data[0].leaverules;
      //   if(leaverules.length > 0){
      //     delete(leaverules[0].history);
      //     var template_data=leaverules[0].template_data;
      //     await Promise.all(template_data.map(async (leave_data) => {

      //     }));
      //     document['template_data.leave_temp_data']=leaverules[0];
      //   }
      //   var lwfrules=package_data[0].lwfrules;
      //   if(lwfrules.length > 0){
      //     delete(lwfrules[0].history);
      //     document['template_data.lwf_temp_data']=lwfrules[0];
      //   }
      //   var tds_rules=package_data[0].tds_rules;
      //   if(tds_rules.length > 0){
      //     delete(tds_rules[0].history);
      //     document['template_data.tds_temp_data']=tds_rules[0];
      //   }
      EmployeeDetails.updateOne(
        { employee_id: req.body.employee_id },
        { $set: document },
        function (err, emp_det) {
          if (err) {
            return resp
              .status(200)
              .send({ status: "error", message: err.message });
          } else {
            var parent_hods = [];

            //var parent_hods=  await get_parent_hods(req.body.emp_hod,req.authData.user_type);
            if (req.body.hod) {
              Staff.findOne(
                { _id: req.body.hod },
                "parent_hods",
                async function (err, parent_hod) {
                  if (!err) {
                    if (parent_hod && parent_hod.parent_hods) {
                      parent_hods = parent_hod.parent_hods;
                    }
                    parent_hods.push(req.body.hod);
                  }
                  var emp_hod_data = {
                    parent_hods: parent_hods,
                    emp_hod: mongoose.Types.ObjectId(req.body.hod),
                    client_code: mongoose.Types.ObjectId(req.body.client),
                  };
                  if (req.body.password) {
                    const hash_pass = bcrypt.hashSync(
                      req.body.password,
                      saltRounds
                    );
                    emp_hod_data.password = hash_pass;
                  }
                  Employee.updateOne(
                    { _id: req.body.employee_id },
                    { $set: emp_hod_data },
                    function (err, emp_det) {
                      if (err) {
                        return resp
                          .status(200)
                          .send({ status: "error", message: err.message });
                      } else {
                        return resp.status(200).send({
                          status: "success",
                          message: "HR details has been updated successfully",
                          emp_det: emp_det,
                        });
                      }
                    }
                  );
                }
              );
            } else {
              return resp.status(200).send({
                status: "success",
                message: "HR details has been updated successfully",
                emp_det: emp_det,
              });
            }
          }
        }
      );
      //});
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_contract_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var contract_id = req.body.contract_id;
        if (contract_id) {
          var document = {
            "contract.$.description": req.body.description,
            "contract.$.comments": req.body.comments,
            "contract.$.start_date": req.body.start_date,
            "contract.$.end_date": req.body.end_date,
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
              if (file.fieldname === "contract_file_image") {
                file_data["folder_name"] = "Contract File Image";
                file_data["upload_for"] = "contract_file_image";
                document["contract.$.contract_file_image"] = file.path;
              }
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id, "contract._id": contract_id },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
                  status: "success",
                  message: "Contract details has been updated successfully",
                  emp_det: emp_det,
                });
              }
            }
          );
        } else {
          var document2 = {
            description: req.body.description,
            comments: req.body.comments,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
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
              if (file.fieldname === "contract_file_image") {
                file_data["folder_name"] = "Contract File Image";
                file_data["upload_for"] = "contract_file_image";
                document2["contract_file_image"] = file.path;
              }
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { contract: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Contract added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_training_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        training_type: "required",
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var training_id = req.body.training_id;
        if (req.body.invitation_id) {
          var entity = await EmployeeInvitation.findById(req.body.invitation_id);
          if (entity) {
            var corporate_id = entity.corporate_id;
          }
        }
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
                corporate_id: req.authData
                  ? req.authData.corporate_id
                  : corporate_id,
                emp_db_id: req.body.employee_id,
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
            { employee_id: req.body.employee_id, "training._id": training_id },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
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
                corporate_id: req.authData
                  ? req.authData.corporate_id
                  : corporate_id,
                emp_db_id: req.body.employee_id,
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
            { employee_id: req.body.employee_id },
            { $addToSet: { training: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Training added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_disciplinary_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var disciplinary_id = req.body.disciplinary_id;
        if (disciplinary_id) {
          var document = {
            "employment_disciplinary_details.$.disciplinary_type":
              req.body.disciplinary_type,
            "employment_disciplinary_details.$.description":
              req.body.description,
            "employment_disciplinary_details.$.comments": req.body.comments,
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
              if (file.fieldname === "disciplinary_file_image") {
                file_data["folder_name"] = "Disciplinary File Image";
                file_data["upload_for"] = "disciplinary_file_image";
                document["training.$.disciplinary_file_image"] = file.path;
              }
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            {
              employee_id: req.body.employee_id,
              "employment_disciplinary_details._id": disciplinary_id,
            },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
                  status: "success",
                  message: "Disciplinary details has been updated successfully",
                  emp_det: emp_det,
                });
              }
            }
          );
        } else {
          var document = {
            disciplinary_type: req.body.disciplinary_type,
            description: req.body.description,
            comments: req.body.comments,
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
              if (file.fieldname === "disciplinary_file_image") {
                file_data["folder_name"] = "Disciplinary File Image";
                file_data["upload_for"] = "disciplinary_file_image";
                document["disciplinary_file_image"] = file.path;
              }
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { employment_disciplinary_details: document } },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
                  status: "success",
                  message: "Disciplinary details has been added successfully",
                  emp_det: emp_det,
                });
              }
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_accident_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var accident_id = req.body.accident_id;
        if (req.body.invitation_id) {
          var entity = await EmployeeInvitation.findById(req.body.invitation_id);
          if (entity) {
            var corporate_id = entity.corporate_id;
          }
        }
        if (accident_id) {
          var document = {
            "accident.$.accident_type": req.body.accident_type,
            "accident.$.description": req.body.description,
            "accident.$.comments": req.body.comments,
            "accident.$.date": req.body.date,
          };
          var obj = req.files;
          await Promise.all(
            obj.map(async (file) => {
              var file_data = {
                corporate_id: req.authData
                  ? req.authData.corporate_id
                  : corporate_id,
                emp_db_id: req.body.employee_id,
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
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id, "accident._id": accident_id },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
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
          await Promise.all(
            obj.map(async (file) => {
              var file_data = {
                corporate_id: req.authData
                  ? req.authData.corporate_id
                  : corporate_id,
                emp_db_id: req.body.employee_id,
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
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { accident: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Accident added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },

  update_employee_extra_curricular: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
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
              if (file.fieldname === "extra_curricular_file_image") {
                document["extra_curricular.$.extra_curricular_file_image"] =
                  file.path;
              }
            })
          );
          EmployeeDetails.updateOne(
            {
              employee_id: req.body.employee_id,
              "extra_curricular._id": extra_curri_id,
            },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
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
              if (file.fieldname === "extra_curricular_file_image") {
                document2["extra_curricular_file_image"] = file.path;
              }
            })
          );
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { extra_curricular: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Extra Curricular added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_education: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        if (req.body.invitation_id) {
          var entity = await EmployeeInvitation.findById(req.body.invitation_id);
          if (entity) {
            var corporate_id = entity.corporate_id;
          }
        }
        var education_id = req.body.education_id;
        if (education_id && education_id !== "undefined") {
          var document = {
            "education.$.institute": req.body.institute,
            "education.$.university": req.body.university,
            "education.$.stream": req.body.stream,
            "education.$.level": req.body.level,
            "education.$.specialisation": req.body.specialisation,
            "education.$.completion": req.body.completion,
          };
          var obj = req.files;
          await Promise.all(
            obj.map(async (file) => {
              var file_data = {
                corporate_id: req.authData
                  ? req.authData.corporate_id
                  : corporate_id,
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
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            {
              employee_id: req.body.employee_id,
              "education._id": education_id,
            },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
                  status: "success",
                  message: "Education details has been updated successfully",
                  emp_det: emp_det,
                });
              }
            }
          );
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
                corporate_id: req.authData
                  ? req.authData.corporate_id
                  : corporate_id,
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
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { education: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Education added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_assets_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var asset_id = req.body.asset_id;
        if (asset_id) {
          var document = {
            "assets.$.asset_details": req.body.asset_details,
            "assets.$.asset_no": req.body.asset_no,
            "assets.$.asset_value": req.body.asset_value,
            "assets.$.asset_issue_date": req.body.asset_issue_date,
            "assets.$.asset_receive_date": req.body.asset_receive_date,
            "assets.$.asset_receive_by": req.body.asset_receive_by,
            "assets.$.asset_qty": req.body.asset_qty,
          };
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id, "assets._id": asset_id },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
                  status: "success",
                  message: "Assets details has been updated successfully",
                  emp_det: emp_det,
                });
              }
            }
          );
        } else {
          var document2 = {
            asset_details: req.body.asset_details,
            asset_no: req.body.asset_no,
            asset_value: req.body.asset_value,
            asset_issue_date: req.body.asset_issue_date,
            asset_qty: req.body.asset_qty,
          };
          //console.log(document2);
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { assets: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Assets added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_annual_earning_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
        earning_head_id: "required",
        earning_category: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var annual_earnings_id = req.body.annual_earnings_id;
        if (annual_earnings_id) {
          var document = {
            "annual_earnings.$.earning_head_id": req.body.earning_head_id,
            "annual_earnings.$.earning_category": req.body.earning_category,
            "annual_earnings.$.earning_amount": req.body.earning_amount,
          };
          EmployeeDetails.updateOne(
            {
              employee_id: req.body.employee_id,
              "annual_earnings._id": annual_earnings_id,
            },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
                  status: "success",
                  message:
                    "Annual Earning details has been updated successfully",
                  emp_det: emp_det,
                });
              }
            }
          );
        } else {
          var document2 = {
            earning_head_id: req.body.earning_head_id,
            earning_category: req.body.earning_category,
            earning_amount: req.body.earning_amount,
          };
          //console.log(document2)
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { annual_earnings: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Annual Earning added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_full_and_final_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
        is_final_process: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        if (req.body.is_final_process) {
          var search_option = {
            $match: { _id: mongoose.Types.ObjectId(req.body.employee_id) },
          };
          var entity = await Employee.aggregate([
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
                from: "leave_logs",
                localField: "_id",
                foreignField: "employee_id",
                as: "leave_logs",
              },
            },
            {
              $lookup: {
                from: "employee_advances",
                localField: "emp_id",
                foreignField: "emp_id",
                as: "employee_advances",
              },
            },
            {
              $lookup: {
                from: "employee_tds_calculations",
                localField: "_id",
                foreignField: "employee_id",
                as: "employee_tds_calculations",
              },
            },
            {
              $lookup: {
                from: "bonus_modules",
                localField: "emp_id",
                foreignField: "emp_id",
                as: "bonus_modules",
              },
            },
            {
              $lookup: {
                from: "incentive_modules",
                localField: "_id",
                foreignField: "emp_id",
                as: "incentive_modules",
              },
            },
            {
              $lookup: {
                from: "employee_monthly_reports",
                localField: "_id",
                foreignField: "emp_db_id",
                as: "employee_monthly_reports",
              },
            },
            {
              $lookup: {
                from: "incentive_modules",
                let: { emp_id_var: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $and: [{ $expr: { $eq: ["$emp_id", "$$emp_id_var"] } }],
                    },
                  },
                  {
                    $group: {
                      _id: null,

                      calculated_advance_value: {
                        $sum: "$advance_value",
                      },
                      calculated_incentive_value: {
                        $sum: "$advance_value",
                      },
                      total_incentive_value: {
                        $sum: "$incentive_value",
                      },
                    },
                  },
                ],
                // localField: '_id',
                // foreignField: 'emp_id',
                as: "incentive_modules_data",
              },
            },

            {
              $addFields: {
                employee_details: {
                  $arrayElemAt: ["$employee_details", 0],
                },
                incentive_modules_data: {
                  $arrayElemAt: ["$incentive_modules_data", 0],
                },
              },
            },
            {
              $project: {
                _id: 1,
                emp_id: 1,
                emp_first_name: 1,
                emp_last_name: 1,
                employee_details: 1,
                bank_details: {
                  $ifNull: ["$employee_details.bank_details", {}],
                },
                UAN_no: {
                  $ifNull: [
                    "$employee_details.pf_esic_details.curr_er_epfo_details.uan_no",
                    null,
                  ],
                },
                incentive_modules_data: 1,
                incentive_modules_calc: {
                  calculated_advance_value:
                    "$incentive_modules_data.calculated_advance_value",
                  calculated_incentive_value:
                    "$incentive_modules_data.calculated_incentive_value",
                  total_incentive_value:
                    "$incentive_modules_data.total_incentive_value",
                  accumulated_value:
                    "$incentive_modules_data.total_incentive_value",
                  setteled_value: {
                    $add: [
                      "$incentive_modules_data.calculated_advance_value",
                      "$incentive_modules_data.calculated_incentive_value",
                    ],
                  },
                  balance_value: {
                    $subtract: [
                      "$incentive_modules_data.total_incentive_value",
                      {
                        $add: [
                          "$incentive_modules_data.calculated_advance_value",
                          "$incentive_modules_data.calculated_incentive_value",
                        ],
                      },
                    ],
                  },
                },
                incentive_modules: 1,
                advance_report: {
                  $ifNull: ["$employee_monthly_reports.advance_report", {}],
                },
                advance_modules: { $ifNull: ["$employee_advances", []] },
                bonus_modules: 1,
                employee_monthly_reports: {
                  $ifNull: ["$employee_monthly_reports", []],
                },
                employee_tds_calculations: {
                  $ifNull: ["$employee_tds_calculations", []],
                },
              },
            },
          ]);
        }

        var document = {};
        document["full_and_final.do_resignation"] = req.body.do_resignation;
        document["full_and_final.emp_notice_period"] =
          req.body.emp_notice_period;
        document["full_and_final.last_working_date"] =
          req.body.last_working_date;

        document["full_and_final.payble_days"] = req.body.payble_days;
        document["full_and_final.reason_code"] = req.body.reason_code;

        if (req.body.is_final_process) {
          document["full_and_final.is_net_pay"] = req.body.net_pay;
          document["full_and_final.is_employee_pf"] = req.body.employee_pf;
          document["full_and_final.is_employer_pf"] = req.body.employer_pf;
          document["full_and_final.is_employee_esic"] = req.body.employee_esic;
          document["full_and_final.is_employer_esic"] = req.body.employer_esic;
          document["full_and_final.is_ptax"] = req.body.p_tax;
          document["full_and_final.is_leave_encashment"] =
            req.body.leave_encashment;
          document["full_and_final.is_accumulated_bonus"] =
            req.body.accumulated_bonus;
          document["full_and_final.is_outstanding_incentive"] =
            req.body.outstanding_incentive;
          document["full_and_final.is_less_tds"] = req.body.tds || false;
          document["full_and_final.is_less_outstanding_advance"] =
            req.body.outstanding_advance;
          document["full_and_final.is_gratuity"] = req.body.gratuity;
          document["full_and_final.footer_text"] = req.body.footer_text;
          document["full_and_final.is_notice_pay"] = req.body.is_notice_pay;
          document["full_and_final.is_final_settlement"] =
            req.body.is_final_process;
          document["full_and_final.exit_date"] = new Date();
          document["full_and_final.extra_fields"] = JSON.parse(
            req.body.extra_fields
          );
          // document["assets"] = req.body.assets;
          entity[0].employee_details.assets.forEach((asset) => {
            if (!asset.asset_receive_date && !asset.asset_receive_by) {
              throw { message: "Assets not Recoverd yet!" };
            }
          });
          // if (entity) {
          //   await full_and_final_process(req, resp, entity);
          // }
          // document["full_and_final.is_leave_encashment"] = req.body.leave_encashment;
          // document["full_and_final.is_accumulated_bonus"] =req.body.accumulated_bonus;
          // document["full_and_final.is_outstanding_incentive"] =req.body.outstanding_incentive;
          // document["full_and_final.is_less_tds"] = req.body.tds;
          // document["full_and_final.is_less_outstanding_advance"] =req.body.outstanding_advance;
          // document["full_and_final.is_gratuity"] = req.body.gratuity;
          // document["full_and_final.footer_text"] = req.body.footer_text;
          // document["full_and_final.extra_fields"] = JSON.parse(
          //   req.body.extra_fields
          // );
          // document["assets"] = req.body.assets;
          // let res = await full_and_final_process(req, resp, next);
        }

        EmployeeDetails.updateOne(
          { employee_id: req.body.employee_id },
          { $set: document },
          function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              if (entity) {
                full_and_final_process(req, resp, entity);
              }
              Employee.updateOne(
                { _id: req.body.employee_id },
                { status: "inactive", approval_status: "inactive" },
                function (err, emp_det) {
                  if (err) {
                    return resp
                      .status(200)
                      .send({ status: "error", message: err.message });
                  } else {
                    return resp.status(200).send({
                      status: "success",
                      message:
                        "Full and final settlement has been done successfully",
                      emp_det: emp_det,
                    });
                  }
                }
              );
            }
          }
        );

        // if(assets)
        // {
        //   var assets=JSON.parse(req.body.assets);
        //   await Promise.all(assets.map(async (asset) => {
        //     var document = {
        //         'assets.$.asset_receive_date':req.body.asset_receive_date,
        //         'assets.$.asset_receive_by':req.body.asset_receive_by,
        //         'assets.$.asset_qty':req.body.asset_qty,
        //       };
        //   }))
        //   var document = {
        //     'assets.$.asset_details':req.body.asset_details,
        //     'assets.$.asset_no':req.body.asset_no,
        //     'assets.$.asset_value':req.body.asset_value,
        //     'assets.$.asset_issue_date':req.body.asset_issue_date,
        //     'assets.$.asset_receive_date':req.body.asset_receive_date,
        //     'assets.$.asset_receive_by':req.body.asset_receive_by,
        //     'assets.$.asset_qty':req.body.asset_qty,
        //   };
        //   EmployeeDetails.updateOne({'employee_id':req.body.employee_id,"assets._id": assets_id},{$set :document},   function (err, emp_det) {
        //     if (err)
        //     {
        //         return resp.status(200).send({ status: 'error', message: err.message });
        //     }
        //     else
        //     {
        //       return resp.status(200).send({ status: 'success', message:"Assets details has been updated successfully", emp_det: emp_det });
        //     }
        //   })
        // }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_family_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
        name: "required",
        dob: "required",
        relation: "required",
        dependent: "required|in:yes,no",
        nominee: "required|in:yes,no",
        aadhaar_no: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var member_id = req.body.member_id;
        if (member_id) {
          var document = {
            "family_member.$.name": req.body.name,
            "family_member.$.dob": req.body.dob,
            "family_member.$.relation": req.body.relation,
            "family_member.$.dependent": req.body.dependent,
            "family_member.$.nominee": req.body.nominee,
            "family_member.$.aadhaar_no": req.body.aadhaar_no,
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
              if (file.fieldname === "family_mem_aadhar_image") {
                file_data["folder_name"] = "Family Member Aadhar Image";
                file_data["upload_for"] = "family_mem_aadhar_image";
                document["family_member.$.family_mem_aadhar_image"] = file.path;
              }
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            {
              employee_id: req.body.employee_id,
              "family_member._id": member_id,
            },
            { $set: document },
            function (err, emp_det) {
              if (err) {
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              } else {
                return resp.status(200).send({
                  status: "success",
                  message:
                    "Family member details has been updated successfully",
                  emp_det: emp_det,
                });
              }
            }
          );
        } else {
          var document2 = {
            name: req.body.name,
            dob: req.body.dob,
            relation: req.body.relation,
            dependent: req.body.dependent,
            nominee: req.body.nominee,
            aadhaar_no: req.body.aadhaar_no,
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
              if (file.fieldname === "family_mem_aadhar_image") {
                file_data["folder_name"] = "Family Member Aadhar Image";
                file_data["upload_for"] = "family_mem_aadhar_image";
                document2["family_mem_aadhar_image"] = file.path;
              }
              var fileuploaddata = await Site_helper.upload_file_manager(
                file_data
              );
            })
          );
          EmployeeDetails.updateOne(
            { employee_id: req.body.employee_id },
            { $addToSet: { family_member: document2 } },
            function (err, emp_det) {
              if (err)
                return resp
                  .status(200)
                  .send({ status: "error", message: err.message });
              return resp.status(200).send({
                status: "success",
                message: "Family member added successfully",
                emp_det: emp_det,
              });
            }
          );
        }
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_other_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var document = {
          description: req.body.description,
          comments: req.body.comments,
          date: req.body.date,
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
            if (file.fieldname === "emp_other_det_file_image") {
              file_data["folder_name"] = "Employee Other Details Image";
              file_data["upload_for"] = "emp_other_det_file_image";
              document["emp_other_det_file_image"] = file.path;
            }
            var fileuploaddata = await Site_helper.upload_file_manager(
              file_data
            );
          })
        );
        EmployeeDetails.updateOne(
          { employee_id: req.body.employee_id },
          { employment_other_details: document },
          function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              return resp.status(200).send({
                status: "success",
                message: "Other details has been updated successfully",
                emp_det: emp_det,
              });
            }
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
  create_employee_sheet_template: async function (req, resp, next) {
    const v = new Validator(req.body, {
      template_name: "required",
      template_fields: "required",
      temp_module_for:
        "required|in:salary_sheet,bonus_sheet,incentive_sheet,advance_sheet,employee_sheet,overtime_sheet,arrear_sheet",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      //console.log(req.body.template_fields);
      var document = {
        corporate_id: req.authData.corporate_id,
        temp_module_for: req.body.temp_module_for,
        template_name: req.body.template_name,
        template_fields: JSON.parse(req.body.template_fields),
        status: "active",
        created_at: Date.now(),
      };
      EmployeeSheetTemplate.create(document, function (err, ESTemplate) {
        if (err)
          return resp
            .status(200)
            .send({ status: "error", message: err.message });
        return resp.status(200).send({
          status: "success",
          message: "Template created successfully",
          estemplate: ESTemplate,
        });
      });
    }
  },
  update_employee_sheet_template: async function (req, resp, next) {
    const v = new Validator(req.body, {
      template_id: "required",
      template_name: "required",
      template_fields: "required",
      temp_module_for:
        "required|in:salary_sheet,bonus_sheet,incentive_sheet,advance_sheet,employee_sheet,overtime_sheet,arrear_sheet",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      //console.log(req.body.template_fields);
      var document = {
        corporate_id: req.authData.corporate_id,
        // temp_module_for: req.body.temp_module_for,
        template_name: req.body.template_name,
        template_fields: JSON.parse(req.body.template_fields),
        status: "active",
        created_at: Date.now(),
      };
      EmployeeSheetTemplate.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.template_id), temp_module_for: req.body.temp_module_for }, document, function (err, ESTemplate) {
        if (err)
          return resp
            .status(200)
            .send({ status: "error", message: err.message });
        return resp.status(200).send({
          status: "success",
          message: "Template updated successfully",
          estemplate: ESTemplate,
        });
      });
    }
  },
  get_employee_sheet_template_list: async function (req, resp, next) {
    const v = new Validator(req.body, {
      pageno: "required",
      temp_module_for:
        "required|in:salary_sheet,bonus_sheet,incentive_sheet,advance_sheet,employee_sheet,overtime_sheet,arrear_sheet",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
    } else {
      var sortoption = { created_at: -1 };
      const options = {
        page: req.body.pageno,
        limit: req.body.perpage ? req.body.perpage : perpage,
        sort: sortoption,
      };
      var filter_option = {
        corporate_id: req.authData.corporate_id,
        temp_module_for: req.body.temp_module_for,
      };
      EmployeeSheetTemplate.paginate(
        filter_option,
        options,
        function (err, earning_sheet_temp) {
          if (err) return resp.json({ status: "error", message: err.message });
          return resp.status(200).json({
            status: "success",
            earning_sheet_temp: earning_sheet_temp,
          });
        }
      );
    }
  },

  export_employee_list: async function (req, resp, next) {
    try {
      // const v = new Validator(req.body, {
      //   pageno: 'required',
      // });
      // const matched = await v.check();
      // if (!matched) {
      //     return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      // }
      // else{
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
      //console.log(req.authId, "asdasd");
      var search_option = {
        $match: {
          $and: [
            { corporate_id: req.authData.corporate_id },
            { parent_hods: { $in: [req.authId] } },
          ],
        },
      };
      //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
      var search_option_details = { $match: {} };
      if (req.body.searchkey) {
        search_option = {
          $match: {
            $text: { $search: req.body.searchkey },
            corporate_id: req.authData.corporate_id,
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
          //search_option_details.$match['employee_details.employment_hr_details.designation']=mongoose.Types.ObjectId(req.body.designation_id);
        }
        if (req.body.department_id) {
          var department_ids = JSON.parse(req.body.department_id);
          department_ids = department_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.department"
          ] = { $in: department_ids };
          //search_option_details.$match['employee_details.employment_hr_details.department']=mongoose.Types.ObjectId(req.body.department_id);
        }
        if (req.body.branch_id) {
          var branch_ids = JSON.parse(req.body.branch_id);
          branch_ids = branch_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.branch"
          ] = { $in: branch_ids };
          //search_option_details.$match['employee_details.employment_hr_details.branch']=mongoose.Types.ObjectId(req.body.branch_id);
        }
        if (req.body.client_id) {
          var client_ids = JSON.parse(req.body.client_id);
          client_ids = client_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.client_id = { $in: client_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
        if (req.body.hod_id) {
          var hod_ids = JSON.parse(req.body.hod_id);
          hod_ids = hod_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.emp_hod = { $in: hod_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
      }
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
          $lookup: {
            from: "company_details",
            localField: "corporate_id",
            foreignField: "details.corporate_id",
            as: "company_details",
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
          $lookup: {
            from: "employee_packages",
            localField: "employee_details.employment_hr_details.package_id",
            foreignField: "_id",
            as: "employee_package",
          },
        },
        {
          $addFields: {
            client: {
              $arrayElemAt: ["$client", 0],
            },
            hod: {
              $arrayElemAt: ["$hod", 0],
            },
            company_details: {
              $arrayElemAt: ["$company_details", 0],
            },
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            designation: {
              $arrayElemAt: ["$designation", 0],
            },
            department: {
              $arrayElemAt: ["$department", 0],
            },
            employee_package: {
              $arrayElemAt: ["$employee_package", 0],
            },
          },
        },
      ]).then(async (employees) => {
        //if (err) return resp.json({ status: "error", message: err.message });
        //return resp.status(200).json({ status: "success", employees: employees });

        if (req.body.download_data_type === "master") {
          var field_list_array = [
            "emp_id",
            "emp_first_name",
            "emp_last_name",
            "emp_father_name",
            "email_id",
            "mobile_no",
            "alternate_mob_no",
            "emp_dob",
            "sex",
            "aadhar_no",
            "pan_no",
            "passport_no",
            "passport_val_form",
            "passport_val_to",
            "nationality",
            "blood_group",
            "physical_disability",
            "marital_status",
            "marriage_date",
            "emergency_contact_no",
            "emergency_contact_name",
            "domicile",
            "height",
            "religion",
            "resident_no",
            "residential_name",
            "road",
            "locality",
            "city",
            "district",
            "state",
            "pincode",
            "curr_resident_no",
            "curr_residential_name",
            "curr_road",
            "curr_locality",
            "curr_city",
            "curr_district",
            "curr_state",
            "curr_pincode",
            "pre_er_pf",
            "pre_er_name",
            "pre_exit_date",
            "pre_last_drawn_gross",
            "pre_last_designation",
            "pre_reporting_to",
            "pre_contact_no",
            "pre_uan_no",
            "pre_last_member_id",
            "pre_last_ro",
            "pre_esic_no",
            "pre_ip_dispensary",
            "pre_family_dispensary",
            "curr_uan_no",
            "curr_last_member_id",
            "curr_last_ro",
            "curr_epfo_membership_date",
            "curr_esic_no",
            "curr_ip_dispensary",
            "curr_family_dispensary",
            "curr_esic_membership_date",
            "bank_name",
            "branch_name",
            "branch_address",
            "branch_pin",
            "account_no",
            "account_type",
            "ifsc_code",
            "micr_no",
            "department_name",
            "designation_name",
            "branch",
            "date_of_join",
            "hod_name",
            "client_code",
            "emp_type",
            "pension_applicable",
            "gross_sallery",
            "emp_role",
            // "emp_id",
            "emp_self_service",
            "salary_temp",
            "package_name",
          ];
        } else if (req.body.download_data_type === "form_a") {
          var field_list_array = [
            "emp_id",
            "emp_first_name",
            "emp_last_name",
            "emp_father_name",
            "emp_dob",
            "resident_no",
            "residential_name",
            "road",
            "locality",
            "city",
            "district",
            "state",
            "pincode",
            "curr_resident_no",
            "curr_residential_name",
            "curr_road",
            "curr_locality",
            "curr_city",
            "curr_district",
            "curr_state",
            "curr_pincode",
          ];
        } else if (req.body.download_data_type === "custom") {
          var field_list_array = JSON.parse(req.body.field_set);
        } else {
          var field_list_array = [];
        }

        var wb = new xl.Workbook();
        var ws = wb.addWorksheet("Sheet 1");
        var clmn_id = 1;
        ws.cell(1, clmn_id).string("SL");
        if (field_list_array.includes("emp_id")) {
          ws.cell(1, clmn_id++).string("emp_id");
        }
        if (field_list_array.includes("emp_first_name")) {
          ws.cell(1, clmn_id++).string("First name");
        }
        if (field_list_array.includes("emp_last_name")) {
          ws.cell(1, clmn_id++).string("Last name");
        }
        if (field_list_array.includes("emp_father_name")) {
          ws.cell(1, clmn_id++).string("Father name");
        }
        if (field_list_array.includes("email_id")) {
          ws.cell(1, clmn_id++).string("Email id");
        }
        if (field_list_array.includes("mobile_no")) {
          ws.cell(1, clmn_id++).string("Mobile no");
        }
        if (field_list_array.includes("alternate_mob_no")) {
          ws.cell(1, clmn_id++).string("Alternate mobile no");
        }
        if (field_list_array.includes("emp_dob")) {
          ws.cell(1, clmn_id++).string("DOB");
        }
        if (field_list_array.includes("sex")) {
          ws.cell(1, clmn_id++).string("Sex");
        }
        if (field_list_array.includes("aadhar_no")) {
          ws.cell(1, clmn_id++).string("Aadhar no");
        }
        if (field_list_array.includes("pan_no")) {
          ws.cell(1, clmn_id++).string("Pan no");
        }
        if (field_list_array.includes("passport_no")) {
          ws.cell(1, clmn_id++).string("Passport no");
        }
        if (field_list_array.includes("passport_val_form")) {
          ws.cell(1, clmn_id++).string("Passport form");
        }
        if (field_list_array.includes("passport_val_to")) {
          ws.cell(1, clmn_id++).string("Passport to");
        }
        if (field_list_array.includes("nationality")) {
          ws.cell(1, clmn_id++).string("Nationality");
        }
        if (field_list_array.includes("blood_group")) {
          ws.cell(1, clmn_id++).string("Blood group");
        }
        if (field_list_array.includes("physical_disability")) {
          ws.cell(1, clmn_id++).string("Physical disability");
        }
        if (field_list_array.includes("marital_status")) {
          ws.cell(1, clmn_id++).string("Marital status");
        }
        if (field_list_array.includes("marriage_date")) {
          ws.cell(1, clmn_id++).string("Marriage date");
        }
        if (field_list_array.includes("emergency_contact_no")) {
          ws.cell(1, clmn_id++).string("Emergency contact no");
        }
        if (field_list_array.includes("emergency_contact_name")) {
          ws.cell(1, clmn_id++).string("Emergency contact name");
        }
        if (field_list_array.includes("domicile")) {
          ws.cell(1, clmn_id++).string("Domicile");
        }
        if (field_list_array.includes("height")) {
          ws.cell(1, clmn_id++).string("Height");
        }
        if (field_list_array.includes("religion")) {
          ws.cell(1, clmn_id++).string("Religion");
        }
        if (field_list_array.includes("resident_no")) {
          //ws.cell(1, 25).string("Relation with nominee");
          ws.cell(1, clmn_id++).string("Residential no");
        }
        if (field_list_array.includes("residential_name")) {
          ws.cell(1, clmn_id++).string("Residential name");
        }
        if (field_list_array.includes("road")) {
          ws.cell(1, clmn_id++).string("Road");
        }
        if (field_list_array.includes("locality")) {
          ws.cell(1, clmn_id++).string("Locality");
        }
        if (field_list_array.includes("city")) {
          ws.cell(1, clmn_id++).string("City");
        }
        if (field_list_array.includes("district")) {
          ws.cell(1, clmn_id++).string("District");
        }
        if (field_list_array.includes("state")) {
          ws.cell(1, clmn_id++).string("State");
        }
        if (field_list_array.includes("pincode")) {
          ws.cell(1, clmn_id++).string("Pincode");
        }
        if (field_list_array.includes("curr_resident_no")) {
          ws.cell(1, clmn_id++).string("Current residential no");
        }
        if (field_list_array.includes("curr_residential_name")) {
          ws.cell(1, clmn_id++).string("Current residential name");
        }
        if (field_list_array.includes("curr_road")) {
          ws.cell(1, clmn_id++).string("Current Road");
        }
        if (field_list_array.includes("curr_locality")) {
          ws.cell(1, clmn_id++).string("Current Locality");
        }
        if (field_list_array.includes("curr_city")) {
          ws.cell(1, clmn_id++).string("Current City");
        }
        if (field_list_array.includes("curr_district")) {
          ws.cell(1, clmn_id++).string("Current District");
        }
        if (field_list_array.includes("curr_state")) {
          ws.cell(1, clmn_id++).string("Current State");
        }
        if (field_list_array.includes("curr_pincode")) {
          ws.cell(1, clmn_id++).string("Current Pincode");
        }
        if (field_list_array.includes("pre_er_pf")) {
          ws.cell(1, clmn_id++).string("Previous Employment");
        }
        if (field_list_array.includes("pre_er_name")) {
          ws.cell(1, clmn_id++).string("Name of prev Employer");
        }
        if (field_list_array.includes("pre_exit_date")) {
          ws.cell(1, clmn_id++).string("Exit Date");
        }
        if (field_list_array.includes("pre_last_drawn_gross")) {
          ws.cell(1, clmn_id++).string("Last drawn gross");
        }
        if (field_list_array.includes("pre_last_designation")) {
          ws.cell(1, clmn_id++).string("Last designation");
        }
        if (field_list_array.includes("pre_reporting_to")) {
          ws.cell(1, clmn_id++).string("Report to");
        }
        if (field_list_array.includes("pre_contact_no")) {
          ws.cell(1, clmn_id++).string("Reporter contact no");
        }
        if (field_list_array.includes("pre_uan_no")) {
          ws.cell(1, clmn_id++).string("UAN no");
        }
        if (field_list_array.includes("pre_last_member_id")) {
          ws.cell(1, clmn_id++).string("Last member ID");
        }
        if (field_list_array.includes("pre_last_ro")) {
          ws.cell(1, clmn_id++).string("Last RO");
        }
        if (field_list_array.includes("pre_esic_no")) {
          ws.cell(1, clmn_id++).string("ESIC no");
        }
        if (field_list_array.includes("pre_ip_dispensary")) {
          ws.cell(1, clmn_id++).string("IP dispensary");
        }
        if (field_list_array.includes("pre_family_dispensary")) {
          ws.cell(1, clmn_id++).string("Family dispensary");
        }
        if (field_list_array.includes("curr_uan_no")) {
          ws.cell(1, clmn_id++).string("Current UAN no");
        }
        if (field_list_array.includes("curr_last_member_id")) {
          ws.cell(1, clmn_id++).string("Current Last member ID");
        }
        if (field_list_array.includes("curr_last_ro")) {
          ws.cell(1, clmn_id++).string("Current Last RO");
        }
        if (field_list_array.includes("curr_epfo_membership_date")) {
          ws.cell(1, clmn_id++).string("Current membership date");
        }
        if (field_list_array.includes("curr_esic_no")) {
          ws.cell(1, clmn_id++).string("Current ESIC no");
        }
        if (field_list_array.includes("curr_ip_dispensary")) {
          ws.cell(1, clmn_id++).string("Current IP dispensary");
        }
        if (field_list_array.includes("curr_family_dispensary")) {
          ws.cell(1, clmn_id++).string("Current Family dispensary");
        }
        if (field_list_array.includes("curr_esic_membership_date")) {
          ws.cell(1, clmn_id++).string("Current membership date");
        }
        if (field_list_array.includes("bank_name")) {
          //ws.cell(1, 50).string("Name on passbook");
          ws.cell(1, clmn_id++).string("Bank name");
        }
        if (field_list_array.includes("branch_name")) {
          ws.cell(1, clmn_id++).string("Branch name");
        }
        if (field_list_array.includes("branch_address")) {
          ws.cell(1, clmn_id++).string("Branch address");
        }
        if (field_list_array.includes("branch_pin")) {
          ws.cell(1, clmn_id++).string("Branch pin");
        }
        if (field_list_array.includes("account_no")) {
          ws.cell(1, clmn_id++).string("Account no");
        }
        if (field_list_array.includes("account_type")) {
          ws.cell(1, clmn_id++).string("Account type");
        }
        if (field_list_array.includes("ifsc_code")) {
          ws.cell(1, clmn_id++).string("IFSC code");
        }
        if (field_list_array.includes("micr_no")) {
          ws.cell(1, clmn_id++).string("MICR no");
        }
        if (field_list_array.includes("department_name")) {
          ws.cell(1, clmn_id++).string("Department");
        }
        if (field_list_array.includes("designation_name")) {
          ws.cell(1, clmn_id++).string("Designation");
        }
        if (field_list_array.includes("branch")) {
          ws.cell(1, clmn_id++).string("Branch");
        }
        if (field_list_array.includes("date_of_join")) {
          ws.cell(1, clmn_id++).string("Date of join");
        }
        if (field_list_array.includes("hod_name")) {
          ws.cell(1, clmn_id++).string("HOD");
        }
        if (field_list_array.includes("client_code")) {
          ws.cell(1, clmn_id++).string("Client");
        }
        if (field_list_array.includes("emp_type")) {
          ws.cell(1, clmn_id++).string("Employment type");
        }
        if (field_list_array.includes("pension_applicable")) {
          ws.cell(1, clmn_id++).string("Pension applicable");
        }
        if (field_list_array.includes("gross_sallery")) {
          ws.cell(1, clmn_id++).string("Gross sallery");
        }
        if (field_list_array.includes("emp_role")) {
          ws.cell(1, clmn_id++).string("Role");
        }
        if (field_list_array.includes("emp_self_service")) {
          ws.cell(1, clmn_id++).string("Self service");
        }
        if (field_list_array.includes("salary_temp")) {
          ws.cell(1, clmn_id++).string("Salary template");
        }
        if (field_list_array.includes("package_name")) {
          ws.cell(1, clmn_id++).string("Package id");
        }

        await Promise.all(
          employees.map(async (employee, index) => {
            var index_val = 2;
            index_val = index_val + index;
            var clmn_emp_id = 1;
            ws.cell(index_val, clmn_emp_id).number(index_val - 1);
            if (field_list_array.includes("emp_id")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.emp_id ? String(employee.emp_id) : ""
              );
            }
            if (field_list_array.includes("emp_first_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.emp_first_name ? String(employee.emp_first_name) : ""
              );
            }
            if (field_list_array.includes("emp_last_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.emp_last_name ? String(employee.emp_last_name) : ""
              );
            }
            if (field_list_array.includes("emp_father_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.emp_father_name ? String(employee.emp_father_name) : ""
              );
            }
            if (field_list_array.includes("email_id")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.email_id ? String(employee.email_id) : ""
              );
            }
            if (field_list_array.includes("mobile_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.mobile_no ? String(employee.mobile_no) : ""
              );
            }
            if (field_list_array.includes("alternate_mob_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.alternate_mob_no
                  ? String(employee.alternate_mob_no)
                  : ""
              );
            }
            if (field_list_array.includes("emp_dob")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.emp_dob ? String(employee.emp_dob) : ""
              );
            }
            if (field_list_array.includes("sex")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.sex ? String(employee.sex) : ""
              );
            }
            if (field_list_array.includes("aadhar_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.aadhar_no ? String(employee.aadhar_no) : ""
              );
            }
            if (field_list_array.includes("pan_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.pan_no ? String(employee.pan_no) : ""
              );
            }
            if (field_list_array.includes("passport_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.passport_no ? String(employee.passport_no) : ""
              );
            }
            if (field_list_array.includes("passport_val_form")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.passport_val_form
                  ? String(employee.passport_val_form)
                  : ""
              );
            }
            if (field_list_array.includes("passport_val_to")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.passport_val_to ? String(employee.passport_val_to) : ""
              );
            }
            if (field_list_array.includes("nationality")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.nationality ? String(employee.nationality) : ""
              );
            }
            if (field_list_array.includes("blood_group")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.blood_group ? String(employee.blood_group) : ""
              );
            }
            if (field_list_array.includes("physical_disability")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(employee.physical_disability)
              );
            }
            if (field_list_array.includes("marital_status")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.marital_status ? String(employee.marital_status) : ""
              );
            }
            if (field_list_array.includes("marriage_date")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.marriage_date ? String(employee.marriage_date) : ""
              );
            }
            if (field_list_array.includes("emergency_contact_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.emergency_contact_no
                  ? String(employee.emergency_contact_no)
                  : ""
              );
            }
            if (field_list_array.includes("emergency_contact_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.emergency_contact_name
                  ? String(employee.emergency_contact_name)
                  : ""
              );
            }
            if (field_list_array.includes("domicile")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.domicile ? String(employee.domicile) : ""
              );
            }
            if (field_list_array.includes("height")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.height ? String(employee.height) : ""
              );
            }
            if (field_list_array.includes("religion")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.religion ? String(employee["religion"]) : ""
              );
            }
            if (field_list_array.includes("resident_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(employee.employee_details.emp_address.resident_no)
                  : ""
              );
            }
            if (field_list_array.includes("residential_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(
                    employee.employee_details.emp_address.residential_name
                  )
                  : ""
              );
            }
            if (field_list_array.includes("road")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(employee.employee_details.emp_address.road)
                  : ""
              );
            }
            if (field_list_array.includes("locality")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(employee.employee_details.emp_address.locality)
                  : ""
              );
            }
            if (field_list_array.includes("city")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(employee.employee_details.emp_address.city)
                  : ""
              );
            }
            if (field_list_array.includes("district")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(employee.employee_details.emp_address.district)
                  : ""
              );
            }
            if (field_list_array.includes("state")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(employee.employee_details.emp_address.state)
                  : ""
              );
            }
            if (field_list_array.includes("pincode")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_address
                  ? String(employee.employee_details.emp_address.pincode)
                  : ""
              );
            }
            if (field_list_array.includes("curr_resident_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(
                    employee.employee_details.emp_curr_address.resident_no
                  )
                  : ""
              );
            }
            if (field_list_array.includes("curr_residential_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(
                    employee.employee_details.emp_curr_address.residential_name
                  )
                  : ""
              );
            }
            if (field_list_array.includes("curr_road")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(employee.employee_details.emp_curr_address.road)
                  : ""
              );
            }
            if (field_list_array.includes("curr_locality")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(employee.employee_details.emp_curr_address.locality)
                  : ""
              );
            }
            if (field_list_array.includes("curr_city")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(employee.employee_details.emp_curr_address.city)
                  : ""
              );
            }
            if (field_list_array.includes("curr_district")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(employee.employee_details.emp_curr_address.district)
                  : ""
              );
            }
            if (field_list_array.includes("curr_state")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(employee.employee_details.emp_curr_address.state)
                  : ""
              );
            }
            if (field_list_array.includes("curr_pincode")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.emp_curr_address
                  ? String(employee.employee_details.emp_curr_address.pincode)
                  : ""
              );
            }
            if (field_list_array.includes("pre_er_pf")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.pf_esic_details
                  ? String(employee.employee_details.pf_esic_details.pre_er_pf)
                  : ""
              );
            }
            if (field_list_array.includes("pre_er_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.pre_er_details?.er_name
                )
              );
            }
            if (field_list_array.includes("pre_exit_date")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_details?.exit_date ?
                  String(employee?.employee_details?.pf_esic_details?.pre_er_details?.exit_date)
                  : ""
              );
            }
            if (field_list_array.includes("pre_last_drawn_gross")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_details?.last_drawn_gross ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_details?.last_drawn_gross
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_last_designation")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_details?.last_designation ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_details?.last_designation
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_reporting_to")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_details?.reporting_to ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_details?.reporting_to
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_contact_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_details?.contact_no ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_details?.contact_no
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_uan_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_epfo_details?.uan_no ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_epfo_details?.uan_no
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_last_member_id")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_epfo_details?.last_member_id ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_epfo_details?.last_member_id
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_last_ro")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_epfo_details?.last_ro ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_epfo_details?.last_ro
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_esic_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_esic_details?.esic_no ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_esic_details?.esic_no
                  ) : ""
              );
            }
            if (field_list_array.includes("pre_ip_dispensary")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_esic_details?.ip_dispensary ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_esic_details?.ip_dispensary

                  ) : ""
              );
            }
            if (field_list_array.includes("pre_family_dispensary")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.pre_er_esic_details?.family_dispensary ?
                  String(
                    employee?.employee_details?.pf_esic_details?.pre_er_esic_details?.family_dispensary

                  ) : ""
              );
            }
            if (field_list_array.includes("curr_uan_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.pf_esic_details?.curr_er_epfo_details?.uan_no ?
                  String(
                    employee?.employee_details?.pf_esic_details?.curr_er_epfo_details?.uan_no

                  ) : ""
              );
            }
            if (field_list_array.includes("curr_last_member_id")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.curr_er_epfo_details?.last_member_id

                )
              );
            }
            if (field_list_array.includes("curr_last_ro")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.curr_er_epfo_details?.last_ro

                )
              );
            }
            if (field_list_array.includes("curr_epfo_membership_date")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.curr_er_epfo_details?.membership_date

                )
              );
            }
            if (field_list_array.includes("curr_esic_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.curr_er_esic_details?.esic_no

                )
              );
            }
            if (field_list_array.includes("curr_ip_dispensary")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.curr_er_esic_details?.ip_dispensary

                )
              );
            }
            if (field_list_array.includes("curr_family_dispensary")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.curr_er_esic_details?.family_dispensary

                )
              );
            }
            if (field_list_array.includes("curr_esic_membership_date")) {
              ws.cell(index_val, clmn_emp_id++).string(
                String(
                  employee?.employee_details?.pf_esic_details?.curr_er_esic_details?.membership_date

                )
              );
            }
            if (field_list_array.includes("bank_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.bank_details
                  ? String(employee?.employee_details?.bank_details?.bank_name)
                  : ""
              );
            }
            if (field_list_array.includes("branch_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee.employee_details.bank_details
                  ? String(employee?.employee_details?.bank_details?.branch_name)
                  : ""
              );
            }
            if (field_list_array.includes("branch_address")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.bank_details
                  ? String(
                    employee?.employee_details?.bank_details?.branch_address
                  )
                  : ""
              );
            }
            if (field_list_array.includes("branch_pin")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.bank_details
                  ? String(employee?.employee_details?.bank_details?.branch_pin)
                  : ""
              );
            }
            if (field_list_array.includes("account_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.bank_details
                  ? String(employee?.employee_details?.bank_details?.account_no)
                  : ""
              );
            }
            if (field_list_array.includes("account_type")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.bank_details
                  ? String(employee?.employee_details?.bank_details?.account_type)
                  : ""
              );
            }
            if (field_list_array.includes("ifsc_code")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.bank_details
                  ? String(employee?.employee_details?.bank_details?.ifsc_code)
                  : ""
              );
            }
            if (field_list_array.includes("micr_no")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.bank_details
                  ? String(employee?.employee_details?.bank_details?.micr_no)
                  : ""
              );
            }
            if (field_list_array.includes("department_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.department
                  ? String(employee?.department?.department_name)
                  : ""
              );
            }
            if (field_list_array.includes("designation_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.designation
                  ? String(employee?.designation?.designation_name)
                  : ""
              );
            }
            if (field_list_array.includes("branch")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.company_details?.company_branch
                  ? String(
                    employee?.company_details?.company_branch[0]?.branch_name
                  )
                  : ""
              );
            }
            if (field_list_array.includes("date_of_join")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.employment_hr_details
                  ? String(
                    employee?.employee_details?.employment_hr_details
                      ?.date_of_join
                  )
                  : ""
              );
            }
            if (field_list_array.includes("hod_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.hod
                  ? String(
                    employee?.hod?.first_name + " " + employee?.hod?.last_name
                  )
                  : ""
              );
            }
            if (field_list_array.includes("client_code")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.client ? String(employee?.client?.client_code) : ""
              );
            }
            if (field_list_array.includes("emp_type")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.employment_hr_details
                  ? String(
                    employee?.employee_details?.employment_hr_details?.emp_type
                  )
                  : ""
              );
            }
            if (field_list_array.includes("pension_applicable")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.employment_hr_details
                  ? String(
                    employee?.employee_details?.employment_hr_details?.pension_applicable

                  )
                  : ""
              );
            }
            if (field_list_array.includes("gross_sallery")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.employment_hr_details
                  ? String(
                    employee?.employee_details?.employment_hr_details?.gross_sallery

                  )
                  : ""
              );
            }
            if (field_list_array.includes("emp_role")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.employment_hr_details
                  ? String(
                    employee?.employee_details?.employment_hr_details?.emp_role
                  )
                  : ""
              );
            }

            if (field_list_array.includes("emp_self_service")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.employment_hr_details
                  ? String(
                    employee?.employee_details?.employment_hr_details?.emp_self_service

                  )
                  : ""
              );
            }
            if (field_list_array.includes("salary_temp")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_details?.template_data
                  ? String(
                    employee?.employee_details?.template_data?.salary_temp_data?.template_name

                  )
                  : ""
              );
            }
            if (field_list_array.includes("package_name")) {
              ws.cell(index_val, clmn_emp_id++).string(
                employee?.employee_package
                  ? String(employee?.employee_package?.package_name)
                  : ""
              );
            }
          })
        ).then(async (value) => {
          // wb.write("employee-list.xlsx");
          // let file_location = Site_helper.createFiles(
          //   wb,
          //   "employee-list",
          //   "xlsx",
          //   req.authData.corporate_id
          // );
          let file_location = Site_helper.createFiles(
            wb,
            "employee-list.xlsx",
            req.authData.corporate_id,
            "temp_files/employee_module"
          );
          // file_name = "employee-list.xlsx";
          // file_path =
          //   "/storage/company/temp_files/" + req.authData.corporate_id;
          await Site_helper.downloadAndDelete(
            file_location.file_name,
            file_location.location,
            req.authData.corporate_id,
            resp
          );
          // return resp.status(200).json({
          //   status: "success",
          //   message: "Xlsx created successfully",
          //   url: baseurl + file_location,
          //   //employees: employees,
          // });
          // return resp.status(200).json({
          //   status: "success",
          //   employees: employees,
          //   masters: masters,
          // });
        });
      });
      //}
    } catch (e) {
      return resp.status(403).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  export_sample_xlsx_file: async function (req, resp, next) {
    try {
      var wb = new xl.Workbook();
      var ws = wb.addWorksheet("Sheet 1");
      var clmn_id = 1;
      ws.cell(1, clmn_id).string("SL");
      ws.cell(1, clmn_id++).string("emp_id").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("first_name").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("last_name").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("father_name");
      ws.cell(1, clmn_id++).string("email_id");
      ws.cell(1, clmn_id++).string("mobile_no").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("alternate_mob_no");
      ws.cell(1, clmn_id++).string("dob").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("sex").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("aadhar_no");
      ws.cell(1, clmn_id++).string("pan_no");
      ws.cell(1, clmn_id++).string("passport_no");
      ws.cell(1, clmn_id++).string("passport_val_form");
      ws.cell(1, clmn_id++).string("passport_val_to");
      ws.cell(1, clmn_id++).string("nationality");
      ws.cell(1, clmn_id++).string("blood_group");
      ws.cell(1, clmn_id++).string("physical_disability");
      ws.cell(1, clmn_id++).string("marital_status");
      ws.cell(1, clmn_id++).string("marriage_date");
      ws.cell(1, clmn_id++).string("emergency_contact_no");
      ws.cell(1, clmn_id++).string("emergency_contact_name");
      ws.cell(1, clmn_id++).string("domicile");
      ws.cell(1, clmn_id++).string("height");
      ws.cell(1, clmn_id++).string("religion");

      ws.cell(1, clmn_id++).string("residential_no");
      ws.cell(1, clmn_id++).string("residential_name");
      ws.cell(1, clmn_id++).string("road");
      ws.cell(1, clmn_id++).string("locality");
      ws.cell(1, clmn_id++).string("city");
      ws.cell(1, clmn_id++).string("district");
      ws.cell(1, clmn_id++).string("state");
      ws.cell(1, clmn_id++).string("pincode");
      ws.cell(1, clmn_id++).string("country");
      ws.cell(1, clmn_id++).string("diffrent_current_add");
      ws.cell(1, clmn_id++).string("current_residential_no");
      ws.cell(1, clmn_id++).string("current_residential_name");
      ws.cell(1, clmn_id++).string("current_road");
      ws.cell(1, clmn_id++).string("current_locality");
      ws.cell(1, clmn_id++).string("current_city");
      ws.cell(1, clmn_id++).string("current_district");
      ws.cell(1, clmn_id++).string("current_state");
      ws.cell(1, clmn_id++).string("current_pincode");
      ws.cell(1, clmn_id++).string("current_country");

      ws.cell(1, clmn_id++).string("bank_name");
      ws.cell(1, clmn_id++).string("branch_name");
      ws.cell(1, clmn_id++).string("branch_address");
      ws.cell(1, clmn_id++).string("branch_pin");
      ws.cell(1, clmn_id++).string("account_no");
      ws.cell(1, clmn_id++).string("account_type");
      ws.cell(1, clmn_id++).string("ifsc_code");
      ws.cell(1, clmn_id++).string("micr_no");

      ws.cell(1, clmn_id++).string("previous_employment");
      ws.cell(1, clmn_id++).string("name_of_prev_employer");
      ws.cell(1, clmn_id++).string("exit_date");
      ws.cell(1, clmn_id++).string("last_drawn_gross");
      ws.cell(1, clmn_id++).string("last_designation");
      ws.cell(1, clmn_id++).string("report_to");
      ws.cell(1, clmn_id++).string("reporter_contact_no");
      ws.cell(1, clmn_id++).string("UAN_no");
      ws.cell(1, clmn_id++).string("last_member_ID");
      ws.cell(1, clmn_id++).string("last_RO");
      ws.cell(1, clmn_id++).string("ESIC_no");
      ws.cell(1, clmn_id++).string("IP_dispensary");
      ws.cell(1, clmn_id++).string("family_dispensary");
      ws.cell(1, clmn_id++).string("current_UAN_no");
      ws.cell(1, clmn_id++).string("current_last_member_ID");
      ws.cell(1, clmn_id++).string("current_last_RO");
      ws.cell(1, clmn_id++).string("current_membership_date");
      ws.cell(1, clmn_id++).string("current_ESIC_no");
      ws.cell(1, clmn_id++).string("current_IP_dispensary");
      ws.cell(1, clmn_id++).string("current_family_dispensary");
      // ws.cell(1, clmn_id++).string("current_membership_date");

      ws.cell(1, clmn_id++).string("department***");
      ws.cell(1, clmn_id++).string("designation");
      ws.cell(1, clmn_id++).string("branch");
      ws.cell(1, clmn_id++).string("date_of_join").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("emp_hod").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("client_code");
      ws.cell(1, clmn_id++).string("emp_type");
      ws.cell(1, clmn_id++).string("pension_applicable");
      ws.cell(1, clmn_id++).string("gross_salary").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("emp_role");
      ws.cell(1, clmn_id++).string("emp_self_service");
      ws.cell(1, clmn_id++).string("salary_temp").style(colorCell('#ff0018'));
      ws.cell(1, clmn_id++).string("package_id").style(colorCell('#ff0018'));

      ws.cell(2, (clmn_id = 1)).string("SL");
      ws.cell(2, clmn_id++).string("emp_id");
      ws.cell(2, clmn_id++).string("First name");
      ws.cell(2, clmn_id++).string("Last name");
      ws.cell(2, clmn_id++).string("Father name");
      ws.cell(2, clmn_id++).string("Email id");
      ws.cell(2, clmn_id++).string("Mobile no");
      ws.cell(2, clmn_id++).string("Alternate mobile no");
      ws.cell(2, clmn_id++).string("yyyy-mm-dd").style(wb.createStyle({ numberFormat: 'yyyy-mm-dd' }));
      clmn_id++;
      //ws.cell(2, clmn_id++).string("Sex6");
      ws.cell(2, clmn_id++).string("Aadhar no").style(wb.createStyle({ numberFormat: '@' }));
      ws.cell(2, clmn_id++).string("Pan no").style(wb.createStyle({ numberFormat: '@' }));
      ws.cell(2, clmn_id++).string("Passport no").style(wb.createStyle({ numberFormat: '@' }));
      ws.cell(2, clmn_id++).string("Passport form");
      ws.cell(2, clmn_id++).string("Passport to");
      ws.cell(2, clmn_id++).string("Nationality");
      clmn_id++;
      clmn_id++;
      clmn_id++;
      //ws.cell(2, clmn_id++).string("Blood group");
      //ws.cell(2, clmn_id++).string("Physical disability");
      //ws.cell(2, clmn_id++).string("Marital status");
      ws.cell(2, clmn_id++).string("yyyy-mm-dd").style(wb.createStyle({ numberFormat: 'yyyy-mm-dd' }));
      ws.cell(2, clmn_id++).string("Emergency contact no");
      ws.cell(2, clmn_id++).string("Emergency contact name");
      ws.cell(2, clmn_id++).string("Domicile");
      ws.cell(2, clmn_id++).string("Height");
      clmn_id++;
      //ws.cell(2, clmn_id++).string("Religion");
      ws.cell(2, clmn_id++).string("Residential no");
      ws.cell(2, clmn_id++).string("Residential name");
      ws.cell(2, clmn_id++).string("Road");
      ws.cell(2, clmn_id++).string("Locality");
      ws.cell(2, clmn_id++).string("City");
      ws.cell(2, clmn_id++).string("District");
      ws.cell(2, clmn_id++).string("State");
      ws.cell(2, clmn_id++).string("Pincode");
      ws.cell(2, clmn_id++).string("Country");
      clmn_id++;
      //ws.cell(2, clmn_id++).string("Diffrent_current_add");
      ws.cell(2, clmn_id++).string("Current residential no");
      ws.cell(2, clmn_id++).string("Current residential name");
      ws.cell(2, clmn_id++).string("Current Road");
      ws.cell(2, clmn_id++).string("Current Locality");
      ws.cell(2, clmn_id++).string("Current City");
      ws.cell(2, clmn_id++).string("Current District");
      ws.cell(2, clmn_id++).string("Current State");
      ws.cell(2, clmn_id++).string("Current Pincode");
      ws.cell(2, clmn_id++).string("Current Country");

      ws.cell(2, clmn_id++).string("Bank name");
      ws.cell(2, clmn_id++).string("Branch name");
      ws.cell(2, clmn_id++).string("Branch address");
      ws.cell(2, clmn_id++).string("Branch pin");
      ws.cell(2, clmn_id++).string("Account no");
      clmn_id++;
      //ws.cell(2, clmn_id++).string("Account type");
      ws.cell(2, clmn_id++).string("IFSC code");
      ws.cell(2, clmn_id++).string("MICR no");
      clmn_id++;
      //ws.cell(2, clmn_id++).string("Previous Employment");
      ws.cell(2, clmn_id++).string("Name of prev Employer");
      ws.cell(2, clmn_id++).string("yyyy-mm-dd").style(wb.createStyle({ numberFormat: 'yyyy-mm-dd' }));
      ws.cell(2, clmn_id++).string("Last drawn gross");
      ws.cell(2, clmn_id++).string("Last designation");
      ws.cell(2, clmn_id++).string("Report to");
      ws.cell(2, clmn_id++).string("Reporter contact no");
      ws.cell(2, clmn_id++).string("UAN no");
      ws.cell(2, clmn_id++).string("Last member ID");
      ws.cell(2, clmn_id++).string("Last RO");
      ws.cell(2, clmn_id++).string("ESIC no");
      ws.cell(2, clmn_id++).string("IP dispensary");
      ws.cell(2, clmn_id++).string("Family dispensary");
      ws.cell(2, clmn_id++).string("Current UAN no");
      ws.cell(2, clmn_id++).string("Current Last member ID");
      ws.cell(2, clmn_id++).string("Current Last RO");
      ws.cell(2, clmn_id++).string("yyyy-mm-dd").style(wb.createStyle({ numberFormat: 'yyyy-mm-dd' }));;
      ws.cell(2, clmn_id++).string("Current ESIC no");
      ws.cell(2, clmn_id++).string("Current IP dispensary");
      ws.cell(2, clmn_id++).string("Current Family dispensary");
      // ws.cell(2, clmn_id++).string("yyyy-mm-dd").style(wb.createStyle({ numberFormat: 'yyyy-mm-dd' }));
      clmn_id++;
      clmn_id++;
      clmn_id++;
      // ws.cell(2, clmn_id++).string("Department");
      // ws.cell(2, clmn_id++).string("Designation");
      // ws.cell(2, clmn_id++).string("Branch");
      ws.cell(2, clmn_id++).string("yyyy-mm-dd").style(wb.createStyle({ numberFormat: 'yyyy-mm-dd' }));
      clmn_id++;
      clmn_id++;
      clmn_id++;
      clmn_id++;
      //ws.cell(2, clmn_id++).string("HOD");
      //ws.cell(2, clmn_id++).string("Client");
      //ws.cell(2, clmn_id++).string("Employment type");
      //ws.cell(2, clmn_id++).string("Pension applicable");
      ws.cell(2, clmn_id++).string("Gross sallery");
      clmn_id++;
      clmn_id++;
      clmn_id++;
      clmn_id++;
      //ws.cell(2, clmn_id++).string("Role");
      // ws.cell(2, clmn_id++).string("Self service");
      // ws.cell(2, clmn_id++).string("Salary template");
      // ws.cell(2, clmn_id++).string("Package id");
      var masters = {
        branch: [],
        designation: [],
        department: [],
        staff: [],
        packages: [],
        salarytemp: [],
        hod: [],
        clients: [],
        dispensary: [],
      };
      // update admin panel master data corporet id
      await Designation.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id designation_name",
        function (err, designation) {
          if (!err) {
            masters.designation = designation;
          }
        }
      );
      await Company.findOne(
        {
          $and: [
            { status: "active" },
            { corporate_id: req.authData.corporate_id },
          ],
        },
        "_id ",
        async function (err, companydata) {
          await CompanyDetails.findOne(
            { company_id: companydata._id },
            "company_branch._id company_branch.branch_name",
            function (err, branches) {
              if (!err) {
                masters.branch = branches.company_branch;
              }
            }
          );
        }
      );
      await Client.find(
        { corporate_id: req.authData.corporate_id, status: "active" },
        "_id client_name client_code",
        function (err, clients) {
          if (!err) {
            masters.clients = clients;
          }
        }
      );
      await Department.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id department_name",
        function (err, department) {
          if (!err) {
            masters.department = department;
          }
        }
      );
      await Dispensary.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id dispensary_name",
        function (err, dispensary) {
          if (!err) {
            masters.dispensary = dispensary;
          }
        }
      );

      await Staff.find(
        {
          $and: [
            { status: "active" },
            { corporate_id: req.authData.corporate_id },
            { is_hod: "yes" },
          ],
        },
        "_id first_name last_name",
        async function (err, staff) {
          if (!err) {
            await Company.find(
              {
                $and: [
                  { status: "active" },
                  { corporate_id: req.authData.corporate_id },
                ],
              },
              "_id establishment_name",
              function (err, companydata) {
                //console.log(companydata)
                staff.push({
                  _id: companydata[0]._id,
                  first_name: companydata[0].establishment_name,
                  last_name: "",
                });
              }
            );
            //console.log(req.authData);

            masters.staff = staff;
          }
        }
      );
      await EmployeePackage.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id package_name",
        function (err, packages) {
          if (!err) {
            masters.packages = packages;
          }
        }
      );
      await SalaryTemp.find(
        { status: "active", corporate_id: req.authData.corporate_id },
        "_id template_name",
        function (err, salarytemp) {
          if (!err) {
            masters.salarytemp = salarytemp;
          }
        }
      );
      var designation = masters.designation;
      designation = designation.map(function (el) {
        return el.designation_name + "  [" + el._id + "]";
      });
      designation = [designation.toString()];
      var department = masters.department;
      department = department.map(function (el) {
        return el.department_name + "  [" + el._id + "]";
      });
      department = [department.toString()];
      var hods = masters.staff;
      hods = hods.map(function (el) {
        return el.first_name + " " + el.last_name + " [" + el._id + "]";
      });
      hods = [hods.toString()];
      var packages = masters.packages;
      packages = packages.map(function (el) {
        return el.package_name + "  [" + el._id + "]";
      });
      packages = [packages.toString()];
      var salarytemp = masters.salarytemp;
      salarytemp = salarytemp.map(function (el) {
        return el.template_name + "  [" + el._id + "]";
      });
      salarytemp = [salarytemp.toString()];
      var clients = masters.clients;
      clients = clients.map(function (el) {
        return el.client_code + "  [" + el._id + "]";
      });
      clients = [clients.toString()];

      var dispensary = masters.dispensary;
      dispensary = dispensary.map(function (el) {
        return el.dispensary_name + "  [" + el._id + "]";
      });
      dispensary = [dispensary.toString()];

      var branch = masters.branch;
      branch = branch.map(function (el) {
        return el.branch_name + "  [" + el._id + "]";
      });
      branch = [branch.toString()];

      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Gender",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "I2:I2",
        formulas: ["m,f,t,o"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Blood Group",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "P2:P2",
        formulas: ["A+,A-,B+,B-,AB+,AB-,O+,O-"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Disability",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "Q2:Q2",
        formulas: ["yes,no"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Marital Status",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "R2:R2",
        formulas: ["unmarried,married,divorced,separated,widowed"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Religion",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "X2:X2",
        formulas: ["hindu,christian,buddhist,muslim,jewish,sikh,no_religion"],
      });
      // ws.addDataValidation({
      //   type: "list",
      //   allowBlank: false,
      //   prompt: "Choose Religion",
      //   error: "Invalid choice was chosen",
      //   showDropDown: true,
      //   sqref: "AO2:AO2",
      //   formulas: ["yes,no"],
      // });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Diffrent Current Address",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "AH2:AH2",
        formulas: ["yes,no"],
      });

      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Account",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "AW2:AW2",
        formulas: ["saving,current"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Previous Employment",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "AZ2:AZ2",
        formulas: ["yes,no"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Department",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "BT2:BT2",
        formulas: department,
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Designation",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "BU2:BU2",
        formulas: designation,
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Branch",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "BV2:BV2",
        formulas: branch,
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Hod",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "BX2:BX2",
        formulas: hods,
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Clients",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "BY2:BY2",
        formulas: clients,
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Employment type",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "BZ2:BZ2",
        formulas: ["Daily,Weekly,Monthly"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Pension ",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "CA2:CA2",
        formulas: ["yes,no"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Role ",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "CC2:CC2",
        formulas: ["role_1,role_2,role_3,role_4,role_5"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Self service ",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "CD2:CD2",
        formulas: ["yes,no"],
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Salary Template",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "CE2:CE2",
        formulas: salarytemp,
      });
      ws.addDataValidation({
        type: "list",
        allowBlank: false,
        prompt: "Choose Packages",
        error: "Invalid choice was chosen",
        showDropDown: true,
        sqref: "CF2:CF2",
        formulas: packages,
      });
      // wb.write("employee-sample.xlsx");

      let file_location = Site_helper.createFiles(
        wb,
        "employee-list.xlsx",
        req.authData.corporate_id,
        "temp_files/employee_module"
      );
      // setTimeout(async function() {
      // file_name = "employee-sample.xlsx";
      // file_path = "/storage/company/temp_files/" + req.authData.corporate_id;
      await Site_helper.downloadAndDelete(
        file_location.file_name,
        file_location.location,
        req.authData.corporate_id,
        resp
      );
      // console.log('url==>',baseurl +'/'+file_location)
      // }, 500);
      // return resp.status(200).json({
      //   status: "success",
      //   message: "Xlsx created successfully",
      //   url: baseurl +'/'+file_location
      //   ,
      // });
    } catch (e) {
      console.log("error=====>>>", e.message);
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  import_employee_data: async function (req, resp, next) {
    try {
      const results = [];
      // console.log("path====>", req.files[0])
      var import_error_emp_id = [];
      const fileStream = fs.createReadStream(req.files[0].path, {
        encoding: "utf8",
      });

      const csvParser = fileStream.pipe(csv());
      let rowReadsCount = 0
      for await (const row of csvParser) {
        try {
          var field_error = [];
          var parent_hods = [];
          var emp_id = row["emp_id"];
          var emp_first_name = row["first_name"];
          var emp_last_name = row["last_name"];
          var mobile = row["mobile_no"];
          var dob = row["dob"];
          var gender = row["sex"];
          var emp_hod = extractIdFromDesignation(row["emp_hod"]);
          var gross_salary = row["gross_salary"];
          var date_of_join = row["date_of_join"];
          var package_id = extractIdFromDesignation(row["package_id"]);
          var salary_temp = extractIdFromDesignation(row["salary_temp"]);

          if (!emp_id) {
            field_error.push("emp_id");
          }
          if (!emp_first_name) {
            field_error.push("first_name");
          }
          if (!emp_last_name) {
            field_error.push("last_name");
          }
          if (!mobile) {
            field_error.push("mobile");
          }
          if (!dob) {
            field_error.push("dob");
          }
          if (!gender) {
            field_error.push("gender");
          }
          if (!emp_hod) {
            field_error.push("emp_hod");
          }
          if (!gross_salary) {
            field_error.push("gross_salary");
          }
          if (!date_of_join) {
            field_error.push("date_of_join");
          }
          if (!package_id) {
            field_error.push("package_id");
          }
          if (!salary_temp) {
            field_error.push("salary_temp");
          }

          if (field_error.length > 0) {
            import_error_emp_id.push(row["emp_id"]);
          } else {
            const parent_hod = await Staff.findOne(
              { _id: emp_hod },
              "parent_hods"
            );
            // async function (err, parent_hod) {

            if (parent_hod) {
              parent_hods = parent_hod.parent_hods ?? [];
            }

            parent_hods.push(emp_hod);

            console.log(req.authData);
            // console.log(row)
            var emp_data = await Employee.findOne({
              emp_id: row["emp_id"],
              corporate_id: req.authData.corporate_id,
            });
            // console.log(emp_data);

            if (emp_data) {
              // var marraige_status = 'no'
              // var religion_status = 'no'
              // if(row["marital_status"]) marraige_status='yes'
              // if(row["religion"]) religion_status='yes'

              // console.log("religion_status==>", religion_status)
              // console.log("marital_status==>", marraige_status)
              var updatedModel = {
                // corporate_id: req.authData.corporate_id,
                // created_by: req.authData.user_id,
                // emp_id: row["emp_id"] ? row["emp_id"] : null,
                // emp_first_name: row["first_name"],
                // emp_last_name: row["last_name"],
                emp_father_name: row["father_name"],
                email_id: row["email_id"],
                // mobile_no: row["mobile_no"],
                alternate_mob_no: row["alternate_mob_no"],
                // emp_dob: row["dob"],
                // sex: row["sex"],
                pan_no: row["pan_no"],
                aadhar_no: row["aadhar_no"],
                passport_no: row["passport_no"],
                passport_val_form: row["passport_val_form"],
                passport_val_to: row["passport_val_to"],
                nationality: row["nationality"],
                blood_group: row["blood_group"],
                physical_disability: row["physical_disability"],
                marital_status: row["marital_status"]
                  ? row["marital_status"]
                  : "unmarried",
                marriage_date: row["marriage_date"],
                emergency_contact_no: row["emergency_contact_no"],
                emergency_contact_name: row["emergency_contact_name"],
                domicile: row["domicile"],
                height: row["height"],
                religion: row["religion"] ? row["religion"] : "no_religion",
                status: "active",
                approval_status: "approved",
                // emp_hod: row["emp_hod"]
                //   ? extractIdFromDesignation(row["emp_hod"])
                //   : null,
                parent_hods: parent_hods,
                client_code: row["client_code"]
                  ? extractIdFromDesignation(row["client_code"])
                  : null,

                //aadhar_enrolment: row["aadhar_enrolment"],
                //country: row["country"],
                //emp_spouse_name: row["spouse_name"],
                //nominee: row["nominee"],
                //nominee_dob: row["nominee_dob"],
                //relation_with_nominee: row["relation_with_nominee"],
                created_at: Date.now(),
                approve_at: Date.now(),
              };
              // console.log("upate--data===>", update)

              const data = await Employee.findOneAndUpdate(
                { emp_id: row["emp_id"] },
                updatedModel
              );

              var emp_document = {
                employee_id: data._id,
                corporate_id: req.authData.corporate_id,
                emp_id: row["emp_id"],
                emp_address: {
                  resident_no: row["residential_no"],
                  residential_name: row["residential_name"],
                  road: row["road"],
                  locality: row["locality"],
                  city: row["city"],
                  district: row["district"],
                  state: row["state"],
                  country: row["country"],
                  pincode: row["pincode"],
                  diff_current_add: "no",
                },
                emp_curr_address: {
                  resident_no:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_residential_no"]
                      : row["residential_no"],
                  residential_name:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_residential_name"]
                      : row["residential_name"],
                  road:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_road"]
                      : row["road"],
                  locality:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_locality"]
                      : row["locality"],
                  city:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_city"]
                      : row["city"],
                  district:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_district"]
                      : row["district"],
                  state:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_state"]
                      : row["state"],
                  country:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_country"]
                      : row["country"],
                  pincode:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_pincode"]
                      : row["pincode"],
                },

                bank_details: {
                  bank_name: row["bank_name"],
                  branch_name: row["branch_name"],
                  branch_address: row["branch_address"],
                  branch_pin: row["branch_pin"],
                  account_no: row["account_no"],
                  account_type: row["account_type"],
                  ifsc_code: row["ifsc_code"],
                  micr_no: row["micr_no"],
                },
                pf_esic_details: {
                  pre_er_pf: row["previous_employment"] || 'no',
                  pre_er_details: {
                    er_name: row["name_of_prev_employer"],
                    last_drawn_gross: row["last_drawn_gross"],
                    contact_no: row["reporter_contact_no"],
                    reporting_to: row["report_to"],
                    exit_date: row["exit_date"],
                    last_designation: row["last_designation"],
                  },
                  pre_er_epfo_details: {
                    uan_no: row["UAN_no"],
                    last_member_id: row["last_member_ID"],
                    last_ro: row["last_RO"],
                  },
                  pre_er_esic_details: {
                    esic_no: row["ESIC_no"],
                    ip_dispensary: row["IP_dispensary"],
                    family_dispensary: row["family_dispensary"],
                  },
                  curr_er_epfo_details: {
                    uan_no: row["current_UAN_no"],
                    last_member_id: row["current_last_member_ID"],
                    last_ro: row["current_last_RO"],
                    membership_date: row["current_membership_date"],
                  },
                  curr_er_esic_details: {
                    esic_no: row["current_ESIC_no"],
                    ip_dispensary: row["current_IP_dispensary"],
                    family_dispensary: row["current_family_dispensary"],
                    membership_date: row["current_membership_date"],
                  },
                },
              };
              await EmployeeDetails.updateOne(
                {
                  _id: mongoose.Types.ObjectId(emp_document.employee_id),
                },
                emp_document
              );
            } else {
              var new_arr = {
                corporate_id: req.authData.corporate_id,
                created_by: req.authData.user_id,
                emp_id: row["emp_id"],
                emp_first_name: row["first_name"],
                emp_last_name: row["last_name"],
                emp_father_name: row["father_name"],
                email_id: row["email_id"],
                mobile_no: row["mobile_no"],
                alternate_mob_no: row["alternate_mob_no"],
                emp_dob: row["dob"],
                sex: row["sex"],
                pan_no: row["pan_no"],
                aadhar_no: row["aadhar_no"],
                passport_no: row["passport_no"],
                passport_val_form: row["passport_val_form"],
                passport_val_to: row["passport_val_to"],
                nationality: row["nationality"],
                blood_group: row["blood_group"],
                physical_disability: row["physical_disability"],
                marital_status: row["marital_status"]
                  ? row["marital_status"]
                  : "unmarried",
                marriage_date: row["marriage_date"],
                emergency_contact_no: row["emergency_contact_no"],
                emergency_contact_name: row["emergency_contact_name"],
                domicile: row["domicile"],
                height: row["height"],
                religion: row["religion"] ? row["religion"] : "no_religion",
                status: "active",
                approval_status: "approved",
                emp_hod: row["emp_hod"]
                  ?
                  mongoose.Types.ObjectId(
                    extractIdFromDesignation(row["emp_hod"]).trim()
                  )
                  : null,
                parent_hods: parent_hods,
                client_code: row["client_code"]
                  ?
                  mongoose.Types.ObjectId(
                    extractIdFromDesignation(row["client_code"]).trim()
                  )
                  // extractIdFromDesignation(row["client_code"])
                  : null,

                created_at: Date.now(),
                approve_at: Date.now(),

              };
              const user_data = await Employee.create(new_arr);

              // console.log(user_data,'aaaaaaa')

              var emp_document = {
                employee_id: user_data._id,
                emp_id: row["emp_id"],
                corporate_id: new_arr.corporate_id,
                emp_address: {
                  resident_no: row["residential_no"],
                  residential_name: row["residential_name"],
                  road: row["road"],
                  locality: row["locality"],
                  city: row["city"],
                  district: row["district"],
                  state: row["state"],
                  country: row["country"],
                  pincode: row["pincode"],
                  diff_current_add: "no",
                },
                emp_curr_address: {
                  resident_no:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_residential_no"]
                      : row["residential_no"],
                  residential_name:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_residential_name"]
                      : row["residential_name"],
                  road:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_road"]
                      : row["road"],
                  locality:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_locality"]
                      : row["locality"],
                  city:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_city"]
                      : row["city"],
                  district:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_district"]
                      : row["district"],
                  state:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_state"]
                      : row["state"],
                  country:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_country"]
                      : row["country"],
                  pincode:
                    row["diffrent_current_add"] == "yes"
                      ? row["current_pincode"]
                      : row["pincode"],
                },

                bank_details: {
                  bank_name: row["bank_name"],
                  branch_name: row["branch_name"],
                  branch_address: row["branch_address"],
                  branch_pin: row["branch_pin"],
                  account_no: row["account_no"],
                  account_type: row["account_type"],
                  ifsc_code: row["ifsc_code"],
                  micr_no: row["micr_no"],
                },
                pf_esic_details: {
                  pre_er_pf: row["previous_employment"] || 'no',
                  pre_er_details: {
                    er_name: row["name_of_prev_employer"],
                    last_drawn_gross: row["last_drawn_gross"],
                    contact_no: row["reporter_contact_no"],
                    reporting_to: row["report_to"],
                    exit_date: row["exit_date"],
                    last_designation: row["last_designation"],
                  },
                  pre_er_epfo_details: {
                    uan_no: row["UAN_no"],
                    last_member_id: row["last_member_ID"],
                    last_ro: row["last_RO"],
                  },
                  pre_er_esic_details: {
                    esic_no: row["ESIC_no"],
                    ip_dispensary: row["IP_dispensary"],
                    family_dispensary: row["family_dispensary"],
                  },
                  curr_er_epfo_details: {
                    uan_no: row["current_UAN_no"],
                    last_member_id: row["current_last_member_ID"],
                    last_ro: row["current_last_RO"],
                    membership_date: row["current_membership_date"],
                  },
                  curr_er_esic_details: {
                    esic_no: row["current_ESIC_no"],
                    ip_dispensary: row["current_IP_dispensary"],
                    family_dispensary: row["current_family_dispensary"],
                    membership_date: row["current_membership_date"],
                  },
                },
                employment_hr_details: {
                  department: row["department"]
                    ? mongoose.Types.ObjectId(
                      extractIdFromDesignation(row["department"]).trim()
                    )
                    : null,
                  designation: row["designation"]
                    ? mongoose.Types.ObjectId(
                      extractIdFromDesignation(row["designation"]).trim()
                    )
                    : null,
                  branch: row["branch"]
                    ? mongoose.Types.ObjectId(
                      extractIdFromDesignation(row["branch"]).trim()
                    )
                    : null,
                  date_of_join: row["date_of_join"],
                  hod: row["emp_hod"]
                    ? mongoose.Types.ObjectId(
                      extractIdFromDesignation(row["emp_hod"]).trim()
                    )
                    : null,
                  client: row["client_code"]
                    ? mongoose.Types.ObjectId(
                      extractIdFromDesignation(row["client_code"]).trim()
                    )
                    : null,
                  emp_type: row["emp_type"],
                  pension_applicable: row["pension_applicable"],
                  gross_salary: row["gross_salary"],
                  gross_earning: row["gross_earning"],
                  emp_role: row["emp_role"],
                  emp_self_service: row["emp_self_service"],

                  package_id: row["package_id"]
                    ? mongoose.Types.ObjectId(
                      extractIdFromDesignation(row["package_id"]).trim()
                    )
                    : null,
                  salary_temp: row["salary_temp"]
                    ? mongoose.Types.ObjectId(
                      extractIdFromDesignation(row["salary_temp"]).trim()
                    )
                    : null,
                },
              };

              var salltempdata, packagedata;
              // console.log('jello')
              // console.log("salary---->",mongoose.Types.ObjectId(parseInt(row["salary_temp"])) )

              if (row["salary_temp"]) {
                const salaryTempId = extractIdFromDesignation(row["salary_temp"]).trim(); // Trim the string
                salltempdata = await SalaryTemp.findOne({
                  _id: mongoose.Types.ObjectId(salaryTempId),
                });
              }
              // console.log(salltempdata, "<<-------------------salary_temp")
              emp_document["template_data.salary_temp_data"] = salltempdata;



              if (row["package_id"]) {
                const packageId = extractIdFromDesignation(row["package_id"]).trim();
                packagedata = await EmployeePackage.findOne({
                  _id: mongoose.Types.ObjectId(packageId),
                });
              }

              //console.log(emp_document,packagedata)
              // console.log(packagedata,"<<--------------pacakageData")
              // packagedata = await packagedata;
              if (packagedata) {

                emp_document["template_data.attendance_temp_data"] =
                  await Attendancerule.findOne(
                    {
                      status: "active",
                      _id: packagedata.attendance_temp,
                    },
                    "-history"
                  );
                emp_document["template_data.bonus_temp_data"] =
                  await BonusTemp.findOne(
                    { _id: packagedata.bonus_temp },
                    "-history"
                  );
                emp_document["template_data.incentive_temp_data"] =
                  await IncentiveTemp.findOne(
                    { _id: packagedata.incentive_temp },
                    "-history"
                  );
                emp_document["template_data.overtime_temp_data"] =
                  await OvertimeTemp.findOne(
                    { _id: packagedata.overtime_temp },
                    "-history"
                  );
                emp_document["template_data.ptax_temp_data"] =
                  await Ptaxrule.findOne(
                    { _id: packagedata.ptax_temp },
                    "-history"
                  );
                emp_document["template_data.leave_temp_data"] =
                  await LeaveRule.findOne(
                    { _id: packagedata.leave_temp },
                    "-history"
                  );
                emp_document["template_data.lwf_temp_data"] =
                  await LwfRule.findOne(
                    { _id: packagedata.lwf_temp },
                    "-history"
                  );
                emp_document["template_data.tds_temp_data"] =
                  await Tdsrule.findOne(
                    { _id: packagedata.tds_temp },
                    "-history"
                  );
                emp_document["template_data.payslip_temp_data"] =
                  await PayslipTemp.findOne(
                    { _id: packagedata.payslip_temp },
                    "-history"
                  );
                emp_document["template_data.bonus_slip_temp_data"] =
                  await BonusSlipTemp.findOne(
                    { _id: packagedata.bonus_slip_temp },
                    "-history"
                  );
                emp_document["template_data.arrear_slip_temp_data"] =
                  await ArrearSlipTemp.findOne(
                    { _id: packagedata.arrear_slip_temp },
                    "-history"
                  );
              }
              var esic_temp = Site_helper.get_gov_esic_data(req);
              emp_document["employment_hr_details.esic_gross"] = parseFloat(
                row["gross_salary"]
              );
              if (
                parseFloat(esic_temp.wage_ceiling) >
                parseFloat(row["gross_salary"])
              ) {
                emp_document["employment_hr_details.esic_covered"] = "yes";
              } else {
                emp_document["employment_hr_details.esic_covered"] = "no";
              }

              await EmployeeDetails.create(emp_document).catch(console.log);
            }
          }
          rowReadsCount++
          console.log(rowReadsCount);

        } catch (e) {
          throw e
        }
      }
      console.log("rows read count ===>", rowReadsCount);
      console.log(import_error_emp_id.length);

      return resp.status(200).send({
        status: "success",
        message: "Import successfully",
        failed_entry: import_error_emp_id,
      });

    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  export_employee_extra_data: async function (req, resp, next) {
    try {
      const options = {};
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
          //search_option_details.$match['employee_details.employment_hr_details.designation']=mongoose.Types.ObjectId(req.body.designation_id);
        }
        if (req.body.department_id) {
          var department_ids = JSON.parse(req.body.department_id);
          department_ids = department_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.department"
          ] = { $in: department_ids };
          //search_option_details.$match['employee_details.employment_hr_details.department']=mongoose.Types.ObjectId(req.body.department_id);
        }
        if (req.body.branch_id) {
          var branch_ids = JSON.parse(req.body.branch_id);
          branch_ids = branch_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.branch"
          ] = { $in: branch_ids };
          //search_option_details.$match['employee_details.employment_hr_details.branch']=mongoose.Types.ObjectId(req.body.branch_id);
        }
        if (req.body.client_id) {
          var client_ids = JSON.parse(req.body.client_id);
          client_ids = client_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.client_id = { $in: client_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
        if (req.body.hod_id) {
          var hod_ids = JSON.parse(req.body.hod_id);
          hod_ids = hod_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.emp_hod = { $in: hod_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
      }
      var field_value = req.body.field_set;
      var select_fields = {
        _id: 1,
        corporate_id: 1,
        emp_id: 1,
        emp_first_name: 1,
        emp_last_name: 1,
        status: 1,
        approval_status: 1,
      };
      //select_fields['employee_details.'+field_value]=1;
      select_fields["emp_det." + field_value] = 1;
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
          $addFields: {
            emp_det: {
              $arrayElemAt: ["$employee_details", 0],
            },
          },
        },
        {
          $project: select_fields,
        },
      ]).then(async (employees) => {
        return resp.status(200).json({
          status: "success",
          employees: employees,
        });
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_Unapproved_employee: async function (req, resp, next) {
    try {
      var sortbyfield = req.body.sortbyfield;
      if (sortbyfield) {
        var sortoption = {};
        sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
      } else {
        var sortoption = { created_at: -1 };
      }
      const options = {
        sort: sortoption,
      };
      var filter_option = {};
      //console.log(req.authId, "asdasd");
      var search_option = {
        $match: {
          $and: [
            { corporate_id: req.authData.corporate_id },
            { approval_status: "pending" },
            { parent_hods: { $in: [req.authData.user_id] } },
          ],
        },
      };
      //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
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
          //search_option_details.$match['employee_details.employment_hr_details.designation']=mongoose.Types.ObjectId(req.body.designation_id);
        }
        if (req.body.department_id) {
          var department_ids = JSON.parse(req.body.department_id);
          department_ids = department_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.department"
          ] = { $in: department_ids };
          //search_option_details.$match['employee_details.employment_hr_details.department']=mongoose.Types.ObjectId(req.body.department_id);
        }
        if (req.body.branch_id) {
          var branch_ids = JSON.parse(req.body.branch_id);
          branch_ids = branch_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.branch"
          ] = { $in: branch_ids };
          //search_option_details.$match['employee_details.employment_hr_details.branch']=mongoose.Types.ObjectId(req.body.branch_id);
        }
        if (req.body.client_code) {
          var client_codes = JSON.parse(req.body.client_code);
          //client_codes = client_codes.map(function(el) { return mongoose.Types.ObjectId(el) })
          search_option.$match.client_code = { $in: client_codes };
          //search_option.$match['employee_details.employment_hr_details.branch']=  {$in: branch_ids};
          //search_option_details.$match['employee_details.employment_hr_details.branch']=mongoose.Types.ObjectId(req.body.branch_id);
        }

        if (req.body.hod_id) {
          var hod_ids = JSON.parse(req.body.hod_id);
          hod_ids = hod_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.emp_hod = { $in: hod_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
      }
      if (req.body.row_checked_all === "true") {
        var ids = JSON.parse(req.body.unchecked_row_ids);
        //console.log('checked')
        if (ids.length > 0) {
          ids = ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match._id = { $nin: ids };
        }
      } else {
        var ids = JSON.parse(req.body.checked_row_ids);
        if (ids.length > 0) {
          //console.log('unchecked')
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
          $project: {
            _id: 1,
            corporate_id: 1,
            userid: 1,
            emp_id: 1,
            emp_first_name: 1,
            emp_last_name: 1,
          },
        },
      ]).then(async (emps) => {
        //console.log(emps);
        return resp.status(200).send({
          status: "success",
          emp_list: emps,
          message: "Employee fetched successfully",
        });
      });
      // Employee.aggregatePaginate(myAggregate,options, async function (err, employees) {
      //     if (err) return resp.json({ status: "error", message: err.message });

      //     return resp.status(200).json({ status: "success", employees: employees });
      // })
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  employee_bulk_approve: async function (req, resp, next) {
    try {
      //var ids=JSON.parse(req.body.unchecked_row_ids);
      var emplist = JSON.parse(req.body.employeedata);
      await Promise.all(
        emplist.map(async (emp_det) => {
          var document = {};
          document["emp_id"] = emp_det.emp_id;
          document["employment_hr_details.salary_temp"] = emp_det.salary_temp;
          document["employment_hr_details.gross_salary"] =
            req.body.gross_salary;
          document["employment_hr_details.package_id"] = emp_det.package;
          var salltempdata = SalaryTemp.findOne({ _id: emp_det.salary_temp });
          document["template_data.salary_temp_data"] = await salltempdata;
          var packagedata = EmployeePackage.findOne({ _id: emp_det.package });
          packagedata = await packagedata;
          document["template_data.attendance_temp_data"] =
            await Attendancerule.findOne(
              { status: "active", _id: packagedata.attendance_temp },
              "-history"
            );
          document["template_data.bonus_temp_data"] = await BonusTemp.findOne(
            { _id: packagedata.bonus_temp },
            "-history"
          );
          document["template_data.incentive_temp_data"] =
            await IncentiveTemp.findOne(
              { _id: packagedata.incentive_temp },
              "-history"
            );
          document["template_data.overtime_temp_data"] =
            await OvertimeTemp.findOne(
              { _id: packagedata.overtime_temp },
              "-history"
            );
          document["template_data.ptax_temp_data"] = await Ptaxrule.findOne(
            { _id: packagedata.ptax_temp },
            "-history"
          );
          let leave_rule = await LeaveRule.findOne(
            { _id: packagedata.leave_temp },
            "-history"
          );
          document["template_data.leave_temp_data"] = leave_rule;
          document["calculated_leave_balance"] = leave_rule.total_leave_data;

          document["template_data.lwf_temp_data"] = await LwfRule.findOne(
            { _id: packagedata.lwf_temp },
            "-history"
          );
          document["template_data.tds_temp_data"] = await Tdsrule.findOne(
            { _id: packagedata.tds_temp },
            "-history"
          );
          document["template_data.payslip_temp_data"] =
            await PayslipTemp.findOne(
              { _id: packagedata.payslip_temp },
              "-history"
            );
          document["template_data.bonus_slip_temp_data"] =
            await BonusSlipTemp.findOne(
              { _id: packagedata.bonus_slip_temp },
              "-history"
            );
          document["template_data.arrear_slip_temp_data"] =
            await ArrearSlipTemp.findOne(
              { _id: packagedata.arrear_slip_temp },
              "-history"
            );
          var esic_temp = Site_helper.get_gov_esic_data(req);
          document["employment_hr_details.esic_gross"] = parseFloat(
            req.body.gross_salary
          );
          if (
            parseFloat(esic_temp.wage_ceiling) >
            parseFloat(req.body.gross_salary)
          ) {
            document["employment_hr_details.esic_covered"] = "yes";
          } else {
            document["employment_hr_details.esic_covered"] = "no";
          }
          EmployeeDetails.updateOne(
            { employee_id: emp_det.employee_id },
            { $set: document },
            function (err, employee_det) {
              var document2 = {
                emp_id: emp_det.emp_id,
                approval_status: "approved",
                approve_at: Date.now(),
              };
              Employee.updateOne(
                { _id: emp_det.employee_id },
                { $set: document2 },
                function (emp_err, employee_det) {
                  return employee_det;
                }
              );
            }
          );
          // EmployeeDetails.updateOne({'employee_id': emp_det.id},{$set: document},   function (err, emp_det) {
          //   return emp_det;
          //     //return resp.status(200).send({ status: 'success', message:"Employee data has been updated successfully", emp_det: emp_det });

          // });
        })
      );
      return resp.status(200).send({
        status: "success",
        message: "Employee has been activated successfully",
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_folders: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        emp_db_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        FileManager.aggregate([
          {
            $match: {
              corporate_id: req.authData.corporate_id,
              emp_db_id: req.body.emp_db_id,
            },
          },
          {
            $group: {
              _id: { upload_for: "$upload_for" },
              file_count: { $sum: 1 },
              folder_name: { $first: "$folder_name" },
            },
          },
          {
            $project: {
              _id: 0,
              upload_for: "$_id.upload_for",
              file_count: "$file_count",
              folder_name: "$folder_name",
            },
          },
        ])
          .then((result) => {
            return resp.status(200).json({ status: "success", data: result });
          })
          .catch((error) => {
            //console.log(error);
          });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_files: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        upload_for: "required",
        emp_db_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        FileManager.aggregate([
          {
            $match: {
              corporate_id: req.authData.corporate_id,
              upload_for: req.body.upload_for,
              emp_db_id: req.body.emp_db_id,
            },
          },

          {
            $project: {
              _id: 1,
              upload_for: 1,
              folder_name: 1,
              file_name: 1,
              file_size: 1,
              file_path: 1,
              file_type: 1,
            },
          },
        ])
          .then((result) => {
            return resp.status(200).json({ status: "success", data: result });
            //console.log(result);
          })
          .catch((error) => {
            //console.log(error);
          });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_employee_salary_template: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        emp_db_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        EmployeeDetails.findOne(
          { employee_id: mongoose.Types.ObjectId(req.body.emp_db_id) },
          async function (err, emp_data) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              if (!emp_data) {
                return resp
                  .status(200)
                  .send({ status: "error", message: "Employee details not found" });
              }
              if (emp_data?.salary_breakups?.length) {
                const salary_breakup = emp_data.salary_breakups[(emp_data?.salary_breakups?.length - 1)]
                return resp
                  .status(200)
                  .json({ status: "success", data: salary_breakup });
              }

              var currdate = new Date();
              var emp_state = emp_data.emp_address.state;
              var salary_breakup = await Site_helper.get_salary_breakup(
                req,
                emp_data.template_data.salary_temp_data,
                emp_data.employment_hr_details.gross_salary,
                emp_data
              );
              var p_tax_amount = await Site_helper.calculate_pt(
                req,
                currdate,
                emp_state,
                salary_breakup.total_pt_wages
              );

              var ptax_template = emp_data?.template_data?.ptax_temp_data;

              var p_tax_amount = await Site_helper.calculate_pt(
                req,
                currdate,
                emp_state,
                salary_breakup.total_pt_wages || 0,
                ptax_template?._id ?? null
              );

              salary_breakup.p_tax_amount = p_tax_amount;
              return resp
                .status(200)
                .json({ status: "success", data: salary_breakup });
            }
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
  get_employee_package_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        emp_db_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        //   ,
        //   function (err, package_data) {
        //     if (err) {
        //       return resp
        //         .status(200)
        //         .send({ status: "error", message: err.message });
        //     } else {
        //       //var remove_sal=emp_data.template_data;
        //       return resp
        //         .status(200)
        //         .json({ status: "success", data: package_data });
        //     }
        //   }
        // );

        EmployeeDetails.findOne(
          { employee_id: mongoose.Types.ObjectId(req.body.emp_db_id) },
          async function (err, emp_data) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            } else {
              if (!emp_data) {
                return resp
                  .status(200)
                  .send({ status: "error", message: "Employee details not found" });
              }
              var package_info = await EmployeePackage.findOne({
                _id: emp_data?.employment_hr_details?.package_id,
              });
              var package_data = {
                package_info: await package_info,
                package_details: {
                  attendance_temp_data:
                    emp_data.template_data.attendance_temp_data,
                  bonus_temp_data: emp_data.template_data.bonus_temp_data,
                  incentive_temp_data:
                    emp_data.template_data.incentive_temp_data,
                  leave_temp_data: emp_data.template_data.leave_temp_data,
                  lwf_temp_data: emp_data.template_data.lwf_temp_data,
                  overtime_temp_data: emp_data.template_data.overtime_temp_data,
                  ptax_temp_data: emp_data.template_data.ptax_temp_data,
                  tds_temp_data: emp_data.template_data.tds_temp_data,
                  payslip_temp_data: emp_data.template_data.payslip_temp_data,
                  bonus_slip_temp_data:
                    emp_data.template_data.arrear_slip_temp_data,
                  arrear_slip_temp_data:
                    emp_data.template_data.arrear_slip_temp_data,
                },
              };
              return resp
                .status(200)
                .json({ status: "success", data: package_data });
            }
          }
        ).populate({
          path: "template_data.leave_temp_data.template_data.leave_type",
          model: LeaveTempHead,
          select: "full_name abbreviation head_type",
        });
      }
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  employee_master_data_list: async function (req, resp, next) {
    try {
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
      //console.log(req.authId, "asdasd");
      var search_option = {
        $match: {
          $and: [
            { corporate_id: req.authData.corporate_id },
            { parent_hods: { $in: [req.authId] } },
          ],
        },
      };
      //var search_option= {$match: {'corporate_id':req.authData.corporate_id}};
      var search_option_details = { $match: {} };
      if (req.body.searchkey) {
        search_option = {
          $match: {
            $text: { $search: req.body.searchkey },
            corporate_id: req.authData.corporate_id,
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
          //search_option_details.$match['employee_details.employment_hr_details.designation']=mongoose.Types.ObjectId(req.body.designation_id);
        }
        if (req.body.department_id) {
          var department_ids = JSON.parse(req.body.department_id);
          department_ids = department_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.department"
          ] = { $in: department_ids };
          //search_option_details.$match['employee_details.employment_hr_details.department']=mongoose.Types.ObjectId(req.body.department_id);
        }
        if (req.body.branch_id) {
          var branch_ids = JSON.parse(req.body.branch_id);
          branch_ids = branch_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option_details.$match[
            "employee_details.employment_hr_details.branch"
          ] = { $in: branch_ids };
          //search_option_details.$match['employee_details.employment_hr_details.branch']=mongoose.Types.ObjectId(req.body.branch_id);
        }
        if (req.body.client_id) {
          var client_ids = JSON.parse(req.body.client_id);
          client_ids = client_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.client_id = { $in: client_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
        if (req.body.hod_id) {
          var hod_ids = JSON.parse(req.body.hod_id);
          hod_ids = hod_ids.map(function (el) {
            return mongoose.Types.ObjectId(el);
          });
          search_option.$match.emp_hod = { $in: hod_ids };
          //search_option.$match.emp_hod=mongoose.Types.ObjectId(req.body.hod_id);
        }
      }
      if (req.body.row_checked_all === "true" && !req.body.row_checked_all) {
        if (req.body.unchecked_row_ids) {
          var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option.$match._id = { $nin: ids };
          }
        }
      } else {
        if (req.body.checked_row_ids) {
          var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            search_option.$match._id = { $in: ids };
          }
        }
      }
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
          $lookup: {
            from: "company_details",
            localField: "corporate_id",
            foreignField: "details.corporate_id",
            as: "company_details",
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
          $lookup: {
            from: "employee_packages",
            localField: "employee_details.employment_hr_details.package_id",
            foreignField: "_id",
            as: "employee_package",
          },
        },
        {
          $addFields: {
            client: {
              $arrayElemAt: ["$client", 0],
            },
            hod: {
              $arrayElemAt: ["$hod", 0],
            },
            company_details: {
              $arrayElemAt: ["$company_details", 0],
            },
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            designation: {
              $arrayElemAt: ["$designation", 0],
            },
            department: {
              $arrayElemAt: ["$department", 0],
            },
            employee_package: {
              $arrayElemAt: ["$employee_package", 0],
            },
          },
        },
      ]).then(async (employees) => {
        // if (err) return resp.json({ status: "error", message: err.message });
        return resp
          .status(200)
          .json({ status: "success", employees: employees });
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_employee_kpi_and_appraisal_details: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var document = {};
        var self_assign =
          (await Employee.findById(req.body.employee_id)) || null;
        var lvl_1_assign = (await Staff.findById(self_assign.emp_hod)) || null;
        if (lvl_1_assign) {
          var lvl_2_assign =
            (await Staff.findById(lvl_1_assign.hod_id)) || null;
          if (!lvl_2_assign) {
            lvl_2_assign = await Company.findById(lvl_1_assign.hod_id);
          }
        } else {
          lvl_1_assign = await Company.findById(self_assign.emp_hod);
        }

        document["kpi_and_appraisal.self_assignee"] = {
          assignee_id: self_assign,
          assign_value: req.body.self_assign_rate,
        };
        document["kpi_and_appraisal.lvl_1_assignee"] = {
          assignee_id: lvl_1_assign,
          assign_value: req.body.lvl_1_assign_rate,
        };
        document["kpi_and_appraisal.lvl_2_assignee"] = {
          assignee_id: lvl_2_assign,
          assign_value: req.body.lvl_2_assign_rate,
        };
        document["kpi_and_appraisal.status"] = req.body.status;
        document["kpi_and_appraisal.rating_heads"] =
          req.body.kpi_assign_data.map((d) => {
            return {
              head_name: d.head_name,
              head_value: d.assign_rating,
            };
          });

        EmployeeDetails.updateOne(
          { employee_id: req.body.employee_id },
          { $set: document },
          function (err, emp_det) {
            if (err) {
              return resp
                .status(200)
                .send({ status: "error", message: err.message });
            }
            return resp.status(200).send({
              status: "success",
              message: "kpi detail added successfully",
              emp_det: emp_det,
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
  generate_employee_invite_link: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        hod_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }
      await EmployeeInvitation.create({
        emp_db_id: req.authData.user_id || req.authData.userdb_id,
        corporate_id: req.authData.corporate_id,
        hod_id: req.body.hod_id,
        created_at: Date.now(),
      })
        .then((response) => {
          let invitation_link =
            baseUrlFrontend + `invitation-form?id=${response._id}`;
          response.invitation_link = invitation_link;
          response.save();
          return resp.status(200).send({
            status: "success",
            message: "Link Generated!",
            url: response.invitation_link,
          });
        })
        .catch((error) => {
          return resp
            .status(200)
            .send({ status: "error", message: error || "Page Not Found" });
        });
    } catch (err) { }
  },
  employee_invitation_link_validation: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        invitation_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }
      await EmployeeInvitation.findOne({
        _id: mongoose.Types.ObjectId(req.body.invitation_id),
        status: "active",
      })
        .then(async (response) => {
          if (response) {
            response._doc["employee_details"] = await Employee.findOne({
              invitation_id: response._id,
            });
            return resp.status(200).send({
              status: "success",
              message: "entity found",
              doc: response,
            });
          } else {
            return resp.status(200).send({
              status: "success",
              message: "entity not found",
              doc: response,
            });
          }
        })
        .catch((error) => {
          return resp
            .status(200)
            .send({ status: "error", message: error || "Page Not Found" });
        });
    } catch (err) {
      return resp
        .status(200)
        .send({ status: "error", message: err || "Page Not Found" });
    }
  },
  employee_full_and_final_report: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      } else {
        var search_option = {
          $match: { _id: mongoose.Types.ObjectId(req.body.employee_id) },
        };
        var entity = await Employee.aggregate([
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
              from: "full_and_finals",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "full_and_finals",
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
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              full_and_final: {
                $arrayElemAt: ["$full_and_finals", 0],
              },
              designation: {
                $arrayElemAt: ["$designation", 0],
              },
            },
          },
          {
            $project: {
              _id: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              employee_details: 1,
              date_of_join: {
                $ifNull: [
                  "$employee_details.employment_hr_details.date_of_join",
                  null,
                ],
              },
              full_and_final_data: {
                $ifNull: ["$employee_details.full_and_final", {}],
              },
              full_and_final: 1,
              designation: 1,
            },
          },
        ])
          .then(async (data) => {
            if (req.body.generate == "excel") {
              const report_data = data[0];
              var fonts = {
                Roboto: {
                  normal: "fonts/Roboto-Regular.ttf",
                  bold: "fonts/Roboto-Medium.ttf",
                  italics: "fonts/Roboto-Italic.ttf",
                  bolditalics: "fonts/Roboto-MediumItalic.ttf",
                },
              };

              var printer = new PdfPrinter(fonts);
              let startDate = moment(report_data.date_of_join);
              let endDate = moment(report_data.full_and_final_data?.last_working_date);

              report_data.lastMonthDays = moment(
                `${new Date(
                  report_data?.full_and_final_data?.last_working_date
                ).getFullYear()}-${new Date(report_data.full_and_final_data?.last_working_date).getMonth() +
                1
                }`,
                'YYYY-M'
              ).daysInMonth();
              report_data.lastMonthDaysToPay = endDate.date();

              report_data.working_tenaure = `${endDate.diff(
                startDate,
                'years'
              )} Years ${endDate.diff(startDate, 'months') % 12} Months ${endDate.diff(startDate, 'days') % 30
                } Days`;

              let table1Data = {
                "Settlement Date":
                  moment(report_data?.full_and_final?.created_at).format('DD-MMM-YYYY') || "N/A",
                "Employee name":
                  report_data?.emp_first_name +
                  " " +
                  report_data?.emp_last_name,
                Designation:
                  report_data?.designation?.designation_name || "N/A",
                "Date Of Joining": report_data?.date_of_join || "N/A",
                "Date Of Leaving":
                  report_data?.full_and_final_data?.last_working_date || "N/A",
                "Working Tenure": report_data?.working_tenaure || "N/A",
                "Last Working Month": endDate.format('MMM-YYYY') || "N/A",
                "Month Days": report_data?.lastMonthDays || "N/A",
                "Days to pay in the last working month":
                  report_data?.lastMonthDaysToPay || "N/A",
              };

              let table1DataArray = Object.entries(table1Data);

              var docDefinition = {
                content: [
                  {
                    color: "#444",
                    border: [false, true, false, false],
                    table: {
                      widths: ["100%"],
                      headerRows: 1,
                      body: [
                        [
                          {
                            text: "Full & Final Settlement of Accounts",
                            style: "tableHeader",
                            alignment: "center",
                            border: [true, true, true, false],
                          },
                        ],
                      ],
                    },
                  },
                  {
                    table: {
                      widths: ["50%", "50%"],
                      headerRows: 2,
                      dontBreakRows: true,
                      body: table1DataArray,
                    },
                  },
                ],
              };

              let rateComponent1 = [];

              if (report_data?.full_and_final?.salary_report?.heads?.length) {
                rateComponent1.push("COMPONENTS", "RATE");
                let gross_amount = 0;
                for (const head of report_data?.full_and_final?.salary_report
                  ?.heads?.length) {
                  gross_amount += head?.amount ?? 0;
                  rateComponent1.push(
                    head?.head_title ?? "N/A",
                    head?.amount ?? 0
                  );
                }
                rateComponent1.push("Gross", gross_amount);
              }
              if (rateComponent1.length) {
                docDefinition.content.push({
                  table: {
                    widths: ["50%", "50%"],
                    headerRows: 2,
                    dontBreakRows: true,
                    body: rateComponent1,
                  },
                });
              }

              // Initialize objects for earning and deduction
              let earningTB = {};
              let deductionTB = {};

              // Populate earning object
              if (rateComponent1.length) {
                rateComponent1.forEach(([key, value]) => {
                  earningTB[key] = value;
                });
              }

              if (report_data?.full_and_final_data?.is_leave_encashment) {
                earningTB["Annual Bonus/ Leave Encashment"] =
                  report_data?.full_and_final?.leave_encashment_amount || 0;
              }

              if (report_data?.full_and_final_data?.is_gratuity) {
                earningTB["Gratuity"] =
                  report_data?.full_and_final?.gratuity_amount || 0;
              }

              if (report_data?.full_and_final?.is_notice_pay) {
                earningTB["One month Notice Pay"] =
                  report_data?.full_and_final?.salary_report?.gross_earning ||
                  0;
              }

              earningTB["Other payments"] =
                report_data?.full_and_final?.other_contribution || 0;
              earningTB["Total Income"] =
                report_data?.full_and_final?.total_income || 0;
              earningTB["Net Payable"] =
                report_data?.full_and_final?.total_payable || 0;

              // Populate deduction object
              if (report_data?.full_and_final_data?.is_employee_pf) {
                deductionTB["EPF"] =
                  report_data?.full_and_final?.salary_report
                    ?.total_employee_pf_contribution || 0;
              }

              if (report_data?.full_and_final_data?.is_employee_esic) {
                deductionTB["ESIC"] =
                  report_data?.full_and_final?.salary_report
                    ?.total_employee_esic_contribution || 0;
              }

              if (report_data?.full_and_final_data?.is_ptax) {
                deductionTB["P TAX"] =
                  report_data?.full_and_final?.salary_report?.total_pt_wages ||
                  0;
              }

              if (!report_data?.full_and_final_data?.is_outstanding_incentive) {
                deductionTB["ADVANCE"] =
                  report_data?.full_and_final?.advance_amount || 0;
              }

              if (!report_data?.full_and_final_data?.is_less_tds) {
                deductionTB["TDS"] =
                  report_data?.full_and_final?.tds_amount || 0;
              }

              deductionTB["ESIC Applicable"] =
                report_data?.full_and_final_data?.is_employee_esic ? 'Yes' : 'No';
              deductionTB["EPF Applicable"] =
                report_data?.full_and_final_data?.is_employee_pf ? "Yes" : "No";

              // Convert objects to arrays if needed
              let earningTBArray = Object.entries(earningTB);
              let deductionTBArray = Object.entries(deductionTB);

              if (earningTBArray.length || deductionTBArray.length) {
                docDefinition.content.push({
                  table: {
                    widths: ["50%", "50%"],
                    headerRows: 1,
                    dontBreakRows: true,
                    body: [["EARNINGS", "DEDUCTION"]],
                  },
                });
              }

              docDefinition.content.push({
                table: {
                  widths: ['50%', '50%'],
                  dontBreakRows: true,
                  headerRows: 1,
                  body: [
                    [
                      {
                        table: {

                          colSpan: 2,
                          widths: ["50%", "50%"],
                          margin: [-5, -3, -5, -3],
                          body: [["COMPONENTS", "AMOUNT"], ...earningTBArray],
                        },
                      },
                      {
                        table: {
                          colSpan: 2,
                          widths: ["50%", "50%"],
                          margin: [-5, -3, -5, -3],
                          body: [["COMPONENTS", "AMOUNT"], ...deductionTBArray],
                        },
                      },
                    ],
                  ],
                },
              });
              let footerText = report_data?.full_and_final_data?.footer_text ?? 'message and foot note signature'
              // if(payslip_temp_data.signature_message){
              docDefinition.content.push({
                table: {
                  widths: ['100%'],
                  margin: [0, 10, 0, 0],
                  border: [false, true, false, false],
                  body: [[footerText]]
                }
              })
              // }

              // const file_path = "/storage/company/full_and_final/";
              const file_name =
                "full-and-final-" +
                req.authData.corporate_id +
                "-" +
                report_data?.emp_id +
                ".pdf";
              let file = Site_helper.createFiles(null, file_name, req.authData.corporate_id, 'temp_files/employee-module');
              let pdfDoc = printer.createPdfKitDocument(docDefinition, {});
              pdfDoc.pipe(fs.createWriteStream("." + file.location + file.file_name));
              pdfDoc.end();

              await Site_helper.downloadAndDelete(file.file_name, file.location, req.authData.corporate_id, resp);
              // await Site_helper.downloadAndDelete(
              //   file_name,
              //   file_path,
              //   req.authData.corporate_id,
              //   resp
              // );
              // return resp.status(200).send({ status: "success", doc: data[0] });

            } else {
              return resp.status(200).send({ status: "success", doc: data[0] });
            }
          })
          .catch((err) =>
            resp.status(200).send({ status: "error", message: err.message })
          );
      }
    } catch (err) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  create_monthly_emp_logs: async () => {
    try {
      let curr_date = new Date();
      let wage_month = curr_date.getMonth();
      let wage_year = curr_date.getFullYear();

      Company.aggregate([
        {
          $lookup: {
            from: "employees",
            let: { corporate_id_var: "$corporate_id" },
            pipeline: [
              {
                $match: {
                  created_at: {
                    $lte: curr_date,
                  },
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
                $addFields: {
                  employee_detail: {
                    $arrayElemAt: ["$employee_details", 0],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  emp_id: 1,
                  emp_first_name: 1,
                  emp_last_name: 1,
                  status: 1,
                  corporate_id: 1,
                  gross_salary: {
                    $ifNull: [
                      "$employee_detail.employment_hr_details.gross_salary",
                      0,
                    ],
                  },
                  exit_date: {
                    $ifNull: [
                      "$employee_detail.full_and_final.exit_date",
                      null,
                    ],
                  },
                  created_at: 1,
                  updated_at: 1,
                },
              },
            ],
            as: "employees",
          },
        },

        {
          $project: {
            _id: 1,
            corporate_id: 1,
            status: 1,
            employees: 1,
          },
        },
      ]).exec((err, docs) => {
        if (err) {
          console.error(err);
          return;
        }
        docs.map((doc) => {
          let document = {
            wage_month,
            wage_year,
            company_id: doc._id,
            corporate_id: doc.corporate_id,
            active_employees: [],
            pending_employees: [],
            inactive_employees: [],
            company_budget: 0,
            status: "active",
            created_at: Date.now(),
          };

          doc.employees.map((employee) => {
            if (employee.status == "active" || employee.status == "approved") {
              document.active_employees.push(employee);
              document.company_budget += +employee.gross_salary || 0;
            } else if (employee.status == "pending") {
              let created_at = new Date(employee.created_at);
              if (
                created_at &&
                created_at.getMonth() === wage_month &&
                created_at.getFullYear() === wage_year
              ) {
                document.pending_employees.push(employee);
              }
            } else if (employee.status == "inactive") {
              let exit_on = new Date(employee.exit_date);
              if (
                exit_on &&
                exit_on.getMonth() === wage_month &&
                exit_on.getFullYear() === wage_year
              ) {
                document.pending_employees.push(employee);
              }
            }
          });

          Company_monthly_Data_Logs.create(document);
        });
        // return resp.status(200).send({ status: "success" });
      });
    } catch (err) {
      console.error(err);
      return;
    }
  },
  get_purchase_history: async (req, resp, next) => {
    try {
      const v = new Validator(req.body, {
        start_date: "required",
        end_date: "required"
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
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
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : perpage,
          sort: sortoption,
        };
        var filter_option = {};
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;

        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
              {
                $or: [
                  {
                    created_at: { $gt: moment(start_date).startOf("day").toDate() },
                  },
                  {
                    $and: [
                      {
                        created_at: {
                          $gte: moment(start_date).startOf("day").toDate(),
                        },
                      },
                    ],
                  },
                ]
              },
              {
                $or: [
                  { created_at: { $lt: moment(end_date).endOf("day").toDate() } },
                  {
                    $and: [
                      {
                        created_at: {
                          $lte: moment(start_date).startOf("day").toDate(),
                        },
                      },
                    ],
                  },
                ]
              }
            ],
          },
        };
        var search_option_details = { $match: {} };
        orderby = { $sort: { created_at: -1 } }
        if (req.body.searchkey) {
          search_option = {
            $match: {
              $or: [
                { razorpay_payment_id: { $regex: req.body.searchkey, $options: "i" } },
                { inv_id: { $regex: req.body.searchkey, $options: "i" } },
                { razorpay_order_id: { $regex: req.body.searchkey, $options: "i" } }
              ],
              'corporate_id': req.authData.corporate_id
            }

          };
        }
        else {
          if (req.body.generate == 'excel') {

            if (req.body.row_checked_all === "true") {
              if (typeof req.body.unchecked_row_ids == "string") {
                var ids = JSON.parse(req.body.unchecked_row_ids);
              }
              else {
                var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
              }
              if (ids.length > 0) {
                ids = ids.map(function (el) {
                  return mongoose.Types.ObjectId(el);
                });
                search_option.$match._id = { $nin: ids };
              }
            } else {
              if (typeof req.body.checked_row_ids == "string") {
                var ids = JSON.parse(req.body.checked_row_ids);
              }
              else {
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
        }

        var myAggregate = credit.aggregate([
          search_option,
          // {
          //   $project:{
          //     credit_qty:{$ifNull:["$credit_qty", '0']},
          //     credit_amount: { $ifNull: [{$toDouble: "$credit_amount"}, 0] },
          //     igst:{$ifNull:["$igst", 0]},
          //     cgst:{$ifNull:["$cgst", 0]},
          //     sgst:{$ifNull:["$sgst", 0]},
          //     gst_amount:{$ifNull:["$gst_amount", 0]},
          //     razorpay_order_id:{$ifNull:["$razorpay_order_id", '']},
          //     inv_id:{$ifNull:["$inv_id", '']},
          //     razorpay_payment_id:{$ifNull:["$razorpay_payment_id", '']},
          //     razorpay_signature:{$ifNull:["$razorpay_signature", '']},
          //     payment_details:{$ifNull:["$payment_details", {}]},
          //     inv_amount: { $add: ["$credit_amount", "$gst_amount"] },
          //     created_at:1
          //   }
          // }
          {
            $project: {
              _id: 1,
              credit_qty: { $ifNull: ["$credit_qty", 0] },
              credit_amount: { $ifNull: ["$credit_amount", 0] },
              igst: { $ifNull: ["$igst", 0] },
              cgst: { $ifNull: ["$cgst", 0] },
              sgst: { $ifNull: ["$sgst", 0] },
              gst_amount: { $ifNull: ["$gst_amount", 0] },
              razorpay_order_id: { $ifNull: ["$razorpay_order_id", ''] },
              inv_id: { $ifNull: ["$inv_id", ''] },
              razorpay_payment_id: { $ifNull: ["$razorpay_payment_id", ''] },
              razorpay_signature: { $ifNull: ["$razorpay_signature", ''] },
              payment_details: { $ifNull: ["$payment_details", {}] },
              file_path: 1,
              // inv_amount: {
              //   $add: [
              //     { $ifNull: [{$toDouble: "$credit_amount"}, 0] },
              //     { $ifNull: ["$gst_amount", 0] }
              //   ]
              // },
              created_at: 1
            }
          }
        ]);
        if (req.body.generate == 'excel') {
          myAggregate.then(async (credits) => {

            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");
            ws.cell(1, 1).string("SL");
            ws.cell(1, 2).string("Inv Date");
            ws.cell(1, 3).string("Inv No");
            ws.cell(1, 4).string("Transaction ID");
            ws.cell(1, 5).string("Qty Credits");
            ws.cell(1, 6).string("Taxable Value");
            ws.cell(1, 7).string("IGST");
            ws.cell(1, 8).string("CGST");
            ws.cell(1, 9).string("SGST");
            ws.cell(1, 10).string("Invoice Amt");


            await Promise.all(credits.map(async function (credit, index) {
              // if(company.credit_purchases){
              //   if(company.credit_purchases.length > 0){
              //     var credit_purchesed = 0;
              //     var qty = 0;
              //     var gst_amount = 0;
              //     var igst = 0;
              //     var cgst = 0;
              //     var sgst = 0;
              //     var tds = 0;
              //     var inv_value = 0;
              //     if(company.credit_purchases){
              //       if(company.credit_purchases.length > 0){
              //         company.credit_purchases.map(function(credit_purchase){
              //           credit_purchesed += parseFloat(credit_purchase.credit_amount);
              //           qty += parseFloat(credit_purchase.credit_qty);
              //           gst_amount += parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0);
              //           inv_value += parseFloat(credit_purchase.credit_amount) + parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0);
              //           igst += parseFloat(credit_purchase.igst ? credit_purchase.igst : 0);
              //           cgst += parseFloat(credit_purchase.cgst ? credit_purchase.cgst : 0);
              //           sgst += parseFloat(credit_purchase.sgst ? credit_purchase.sgst : 0);
              //         })
              //       }
              //     }
              //     company.credit_purchesed = credit_purchesed;
              //     company.qty = qty;
              //     company.taxable_value = gst_amount;                      
              //     company.igst = igst;
              //     company.cgst = cgst;
              //     company.sgst = sgst;
              //     company.total_gst = gst_amount;
              //     company.tds = tds;
              //     company.inv_value = inv_value;
              //   }
              // }
              var row_no = 2;
              row_no = row_no + index;
              var clmn_emp_id = 1
              const inv_amt = ((+credit?.credit_amount || 0) + (credit.gst_amount || 0) || 0)
              const date = moment(credit.created_at).format('DD MMM YYYY')
              console.log(date);
              ws.cell(row_no, 1).number(row_no - 1);
              ws.cell(row_no, 2).string(credit.created_at ? String(date) : 'N/A');
              ws.cell(row_no, 3).string(credit.inv_id ? credit.inv_id : 'N/A');
              ws.cell(row_no, 4).string(credit.razorpay_payment_id ? credit.razorpay_payment_id : 'N/A');
              ws.cell(row_no, 5).string(credit.credit_qty ? String(credit.credit_qty) : "0");
              ws.cell(row_no, 6).string(credit.gst_amount ? String(credit.gst_amount) : "0");
              ws.cell(row_no, 7).string(credit.igst ? String(credit.igst) : "0");
              ws.cell(row_no, 8).string(credit.cgst ? String(credit.cgst) : "0");
              ws.cell(row_no, 9).string(credit.sgst ? String(credit.sgst) : "0");
              ws.cell(row_no, 10).string(String(inv_amt));


            })).then(async (value) => {
              // let file_location =  Site_helper.createFiles(wb,"company-purchase-export",'xlsx', req.authData.corporate_id);
              let file_name = "company-purchase-export.xlsx";
              // let file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
              let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/employee-module');
              await Site_helper.downloadAndDelete(file.file_name, file.location, req.authData.corporate_id, resp);
              // await Site_helper.downloadAndDelete(file_name,file_path, req.authData.corporate_id,resp);
              // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
            });
          });
        }
        else {
          credit.aggregatePaginate(myAggregate, options, async function (err, credit) {
            if (err) return resp.json({ status: 'error', message: err.message });
            return resp.status(200).json({ status: 'success', credit: credit });
          })
        }
      }
    } catch (err) {
      return resp.status(200).send({ status: "error", message: err.message });
    }
  },
  download_purchase_history_data: async function (req, resp) {
    try {
      const v = new Validator(req.body, {
        purchase_id: "required",
        type: "required|in:view,download"
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(403).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {
        var creditdata = await credit.findOne({ '_id': mongoose.Types.ObjectId(req.body.purchase_id) });
        if (creditdata) {
          file_path = creditdata.file_path;

          var dir = absolutePath + "/" + file_path;
          if (fs.existsSync(dir)) {
            await Site_helper.driect_download(file_path, req.authData.corporate_id, resp);
          }
          else {
            return resp.status(200).json({
              status: "success",
              message: "File not exist in our server.",
            });
          }
        }
        else {
          return resp.status(200).json({ status: "success", message: "Something went wrong.", });
        }
      }
    }
    catch (e) {
      return resp.status(403).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  get_consumption_history: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        wage_month_from: "required",
        wage_year_from: "required",
        wage_month_to: "required",
        wage_year_to: "required"
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
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
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : perpage,
          sort: sortoption,
        };

        var start_month = parseInt(req.body.wage_month_from);
        var start_year = parseInt(req.body.wage_year_from);
        var end_month = parseInt(req.body.wage_month_to);
        var end_year = parseInt(req.body.wage_year_to);

        var search_option = { $match: {} };
        var search_option_details = {};
        var lookupSearchOptions = {
          $match: {
            $and: [
              { $expr: { $eq: ["$company_id", "$$emp_db_idVar"] } },
              { type: { $in: ["credit", "credit_coupon", "consumed"] } },
              {
                $or: [
                  { wage_year: { $gt: start_year } },
                  {
                    $and: [
                      { wage_year: { $gte: start_year } },
                      { wage_month: { $gte: start_month } },
                    ],
                  },
                ],
              },
              {
                $or: [
                  { wage_year: { $lt: end_year } },
                  {
                    $and: [
                      { wage_year: { $lte: end_year } },
                      { wage_month: { $lte: end_month } },
                    ],
                  },
                ],
              },
            ],
          },
        };
        orderby = { $sort: { created_at: -1 } }

        if (req.authData.corporate_id) {
          search_option.$match.corporate_id = { "$eq": req.authData.corporate_id };
        }

        if (req.body.row_checked_all === "true") {
          if (typeof req.body.unchecked_row_ids == "string") {
            var ids = JSON.parse(req.body.unchecked_row_ids);
          }
          else {
            var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
          }
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            lookupSearchOptions.$match._id = { $nin: ids };
          }
        } else {
          if (typeof req.body.checked_row_ids == "string") {
            var ids = JSON.parse(req.body.checked_row_ids);
          }
          else {
            var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
          }
          if (ids.length > 0) {
            ids = ids.map(function (el) {
              return mongoose.Types.ObjectId(el);
            });
            lookupSearchOptions.$match._id = { $in: ids };
          }
        }

        // var search_option_details = { 
        //   $match: {
        //     "company_credit_history_logs._id" :{ $exists: true, $ne: null },
        //   }
        // };           
        // search_option_details.$match["employee_monthly_reports.bonus_report"] = { $exists: true, $ne: null };
        var myAggregate = Company.aggregate([
          search_option,
          {
            $lookup: {
              from: 'company_credit_history_logs',
              "let": { "emp_db_idVar": "$_id" },
              "pipeline": [lookupSearchOptions],
              as: 'company_credit_history_logs'
            }
          },
          {
            $match: {
              "company_credit_history_logs._id": { $exists: true, $ne: null },
            }
          },
          {
            "$project": {
              "_id": 1,
              "corporate_id": 1,
              "userid": 1,
              "suspension": 1,
              "establishment_name": 1,
              company_credit_history_logs: 1
            }
          },
        ])
        myAggregate.then(async (companies) => {
          if (req.body.generate == 'excel') {
            var field_list_array = ["date", "particulars", "addition", "deduction", "balance"];
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");

            ws.cell(1, 1).string("SL");
            ws.cell(1, 2).string("Date");
            ws.cell(1, 3).string("Particulars");
            ws.cell(1, 4).string("");
            ws.cell(1, 5).string("Addition");
            ws.cell(1, 6).string("Deduction");
            ws.cell(1, 7).string("Balance");

            var row = 2;
            await Promise.all(companies.map(async function (company, index) {
              if (company.company_credit_history_logs) {
                company.company_credit_history_logs.map(async function (logs, index_l) {

                  const credit_balance = logs.credit_balance ? String(logs.credit_balance) : '';

                  let particular = logs.type ?? '';
                  if (particular == 'consumed') {
                    particular = 'Consumed';
                  }
                  if (particular == 'credit_coupon') {
                    particular = 'Promo';
                  }
                  if (particular == 'credit') {
                    particular = 'Purchase';
                  }

                  let inv_id;
                  if (logs.type == 'credit' || logs.type == 'credit_coupon') {
                    inv_id = logs.details.inv_id ?? '';
                  }

                  if (logs.type == 'consumed') {
                    inv_id = moment(`${logs.details.wage_year}-${logs.details.wage_month + 1}-01`).format('MMM') + '-' + logs.details.wage_year;
                  }
                  logs.inv_id = inv_id ?? '';

                  let credited_amnt;
                  if (logs.type == 'credit' || logs.type == 'credit_coupon') {
                    credited_amnt = logs.details.credit_amount ?? '';
                  }
                  logs.credited_amnt = credited_amnt ?? '';

                  let deduct_amnt;
                  if (logs.type == 'consumed') {
                    deduct_amnt = logs.balance ?? '';
                  }

                  ws.cell(row, 1).number(row - 1);
                  ws.cell(row, 2).string(logs.created_at ? String(moment(logs.created_at).format("DD/MM/YYYY")) : "");
                  ws.cell(row, 3).string(String(particular ?? ''))
                  ws.cell(row, 4).string(String(inv_id ?? ''))
                  ws.cell(row, 5).string(String(credited_amnt ?? '0'))
                  ws.cell(row, 6).string(String(deduct_amnt ?? '0'))
                  ws.cell(row, 7).string(String(credit_balance ?? '0'))

                  // if (logs.type == "credit") {
                  //   ws.cell(row, 3).string(String("Purchase"));
                  //   ws.cell(row, 4).string(logs.details ? String(logs.details.inv_id) : "");
                  // } else if (logs.type == "credit_coupon") {
                  //   ws.cell(row, 3).string("Promo");
                  //   ws.cell(row, 4).string(logs.details ? String(logs.details?.coupon_code) : "");
                  // } else if (logs.type == "consumed") {
                  //   ws.cell(row, 3).string(logs.details ? String(logs.details?.plan?.plan_name) : "");
                  // }

                  // if(logs.type !== 'credit' && logs.type !== 'credit_coupon'){
                  //   ws.cell(row, 4).string(logs.wage_month? String(logs.wage_month + "-" + logs.wage_year): "");
                  // }


                  // if (logs.type == "credit" || logs.type == "credit_coupon") {
                  //   ws.cell(row, 5).string(
                  //     logs.balance ? String(logs.balance) : ""
                  //   );
                  // } else {
                  //   ws.cell(row, 5).string("");
                  // }

                  // if (logs.type == "credit" || logs.type == "credit_coupon") {
                  //   ws.cell(row, 6).string("");
                  // } else {
                  //   ws.cell(row, 6).string(
                  //     logs.balance ? String(logs.balance) : ""
                  //   );
                  // }
                  // ws.cell(row, 7).string(
                  //   logs.credit_balance ? String(logs.credit_balance) : ""
                  // );
                  row++;
                });
              }
            })).then(async (value) => {
              // let file_location =  Site_helper.createFiles(wb,"company-consumption-export",'xlsx', req.authData.corporate_id);
              let file_name = "company-consumption-export.xlsx";
              let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/employee-module');
              await Site_helper.downloadAndDelete(file.file_name, file.location, req.authData.corporate_id, resp);
              // let file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
              // await Site_helper.downloadAndDelete(file_name,file_path, req.authData.corporate_id,resp);
              // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
              // wb.write("admin-company-credit-usage-details-list-export.xlsx");
              // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-credit-usage-details-list-export.xlsx",});
            });
          }
          else {
            return resp.status(200).json({ status: 'success', company: companies });
          }
        });
        // Company.aggregatePaginate(myAggregate,options, async function (err, company) {
        //   if (err) return resp.json({ status: 'error', message: err.message });

        //   return resp.status(200).json({ status: 'success', company: company });
        // })
      }
    }
    catch (e) {
      return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
    }
  },
  full_and_final_history: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        start_date: "required",
        end_date: "required"
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
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
          page: req.body.pageno,
          limit: req.body.perpage ? req.body.perpage : perpage,
          sort: sortoption,
        };

        var start_date = req.body.start_date;
        var end_date = req.body.end_date;

        var search_option = {
          $match: {
            $and: [
              { corporate_id: req.authData.corporate_id },
            ],
          },
        };
        if (req.body.searchkey) {
          search_option = {
            $match: {
              $text: { $search: req.body.searchkey },
              corporate_id: req.authData.corporate_id,
              parent_hods: { $in: [req.authId] },
            },
          };
        }
        if (req.body.generate == 'excel') {

          if (req.body.row_checked_all === "true") {
            if (typeof req.body.unchecked_row_ids == "string") {
              var ids = JSON.parse(req.body.unchecked_row_ids);
            }
            else {
              var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
            }
            if (ids.length > 0) {
              ids = ids.map(function (el) {
                return mongoose.Types.ObjectId(el);
              });
              search_option.$match._id = { $nin: ids };
            }
          } else {
            if (typeof req.body.checked_row_ids == "string") {
              var ids = JSON.parse(req.body.checked_row_ids);
            }
            else {
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
              from: "full_and_finals",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "full_and_finals",
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
              from: "clients",
              localField: "client_code",
              foreignField: "_id",
              as: "client",
            },
          },
          {
            $lookup: {
              from: "branches",
              localField: "employee_details.employment_hr_details.branch",
              foreignField: "_id",
              as: "branches",
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
            $match: {
              "employee_details.full_and_final.do_resignation": { $exists: true, $ne: null },
              "employee_details.full_and_final.do_resignation": {
                $gte: new Date(moment(start_date).startOf("day")),
                $lte: new Date(moment(end_date).endOf("day")),
              },
            }
          },
          {
            $addFields: {
              employee_details: {
                $arrayElemAt: ["$employee_details", 0],
              },
              full_and_final: {
                $arrayElemAt: ["$full_and_finals", 0],
              },
              designation: {
                $arrayElemAt: ["$designation", 0],
              },
              client: {
                $arrayElemAt: ["$client", 0],
              },
              branch: {
                $arrayElemAt: ["$branches", 0],
              },
              department: {
                $arrayElemAt: ["$department", 0],
              },
            },
          },
          {
            $project: {
              _id: 1,
              status: 1,
              emp_id: 1,
              emp_first_name: 1,
              emp_last_name: 1,
              designation: "$designation.designation_name",
              client: "$client.client_code",
              branch: "$branch.branch_name",
              department: "$department.department_name",
              date_of_resignation: "$employee_details.full_and_final.do_resignation",
              last_working_date: "$employee_details.full_and_final.last_working_date",
              notice_pay: "$employee_details.full_and_final.is_notice_pay",
              payble_days: "$employee_details.full_and_final.payble_days",
              full_and_final: 1
            }
          }

          // }
        ])

        if (req.body.generate == 'excel') {
          myAggregate.then(async (employees) => {
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Sheet 1");

            ws.cell(1, 1).string("SL");
            ws.cell(1, 2).string("Status");
            ws.cell(1, 3).string("Emp Id");
            ws.cell(1, 4).string("Name");
            ws.cell(1, 5).string("Department");
            ws.cell(1, 6).string("Designation");
            ws.cell(1, 7).string("Branch");
            ws.cell(1, 8).string("Client");
            ws.cell(1, 9).string("Date of Resignation");
            ws.cell(1, 10).string("Last Date of work");
            ws.cell(1, 11).string("Notice Pay");
            ws.cell(1, 12).string("Notice Deduct");

            let commonHeaderHeads = [];
            let col_no = 13
            await Promise.all(employees.map(employee => {
              if (employee.full_and_final && employee.full_and_final.payfor_payment_data) {
                employee.full_and_final.payfor_payment_data.heads.map(head => {
                  if (!commonHeaderHeads.find(h => h.head_id.toString() === head.head_id.toString())) {
                    commonHeaderHeads.push(head)
                    ws.cell(1, col_no).string(head.head_title.toUpperCase());
                    col_no++
                  }
                })
              }
            }))

            ws.cell(1, col_no).string("Total Amt");

            var row = 2;


            await Promise.all(employees.map(async function (employee, index) {

              ws.cell(row, 1).number(row - 1);
              ws.cell(row, 2).string(employee.status == 'inactive' && employee.full_and_final ? 'Completed' : 'Pending');
              ws.cell(row, 3).string(employee.emp_id ? String(employee.emp_id) : '')
              ws.cell(row, 4).string(employee.emp_first_name ? String(employee.emp_first_name) : '')
              ws.cell(row, 5).string(employee.department ? String(employee.department) : '')
              ws.cell(row, 6).string(employee.designation ? String(employee.designation) : '')
              ws.cell(row, 7).string(employee.branch ? String(employee.branch) : '')
              ws.cell(row, 8).string(employee.client ? String(employee.client) : '')
              ws.cell(row, 9).string(employee.date_of_resignation ? String(employee.date_of_resignation) : '')
              ws.cell(row, 10).string(employee.last_working_date ? String(employee.last_working_date) : '')
              ws.cell(row, 11).string(employee.notice_pay ? 'Yes' : 'No')
              ws.cell(row, 12).string(employee.payble_days ? String(employee.payble_days) : '')
              ws.cell(row, 13 + commonHeaderHeads.length).string(employee.full_and_final && employee.full_and_final.total_payable ? String(employee.full_and_final.total_payable) : '')

              let col_no = 13;
              if (employee.full_and_final && employee.full_and_final.payfor_payment_data) {
                ws.cell(row, col_no).string('')
                commonHeaderHeads.map(h => {
                  employee.full_and_final.payfor_payment_data.heads.map(head => {
                    if (h?.head_id.toString() === head?.head_id.toString()) {
                      ws.cell(row, col_no).string(head.amount ? String(head.amount) : '')
                    }
                  })
                  col_no++
                })
              }

              row++;
            })).then(async (value) => {
              // let file_location =  Site_helper.createFiles(wb,"full-and-final-report",'xlsx', req.authData.corporate_id);
              let file_name = "full-and-final-report.xlsx";
              // let file_path = '/storage/company/temp_files/'+req.authData.corporate_id;
              let file = Site_helper.createFiles(wb, file_name, req.authData.corporate_id, 'temp_files/employee-module');
              await Site_helper.downloadAndDelete(file.file_name, file.location, req.authData.corporate_id, resp);
              // await Site_helper.downloadAndDelete(file_name,file_path, req.authData.corporate_id,resp);

              // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl + file_location});
              // wb.write("admin-company-credit-usage-details-list-export.xlsx");
              // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-credit-usage-details-list-export.xlsx",});
            });
          }, (err) => {
            if (err) return resp.json({ status: 'error', message: err.message });
          })
        }
        else {
          Employee.aggregatePaginate(myAggregate, options, async function (err, employee) {
            if (err) return resp.json({ status: 'error', message: err.message });
            return resp.status(200).json({ status: 'success', employee: employee });
          })
        }
      }
    }
    catch (e) {
      return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
    }
  },
  delete_employee: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        employee_id: "required",
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      }

      if (req.authData.user_type !== 'company') throw "Insufficient privileges to perform this action"

      var myAggregate = Employee.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.body.employee_id),
            status: { $nin: ['inactive', 'deleted'] }
          }
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
            from: "employees_attendances",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "employees_attendances",
          },
        },
        {
          $lookup: {
            from: "employee_monthly_reports",
            localField: "emp_id",
            foreignField: "emp_id",
            as: "employee_monthly_reports",
          },
        },
        {
          $addFields: {
            employee_details: {
              $arrayElemAt: ["$employee_details", 0],
            },
            attendance_count: { $size: "$employees_attendances" },
            monthly_reports_count: { $size: "$employee_monthly_reports" },
          },
        },
        {
          $project: {
            _id: 1,
            emp_id: 1,
            emp_first_name: 1,
            emp_last_name: 1,
            employee_details: 1,
            attendance_count: 1,
            monthly_reports_count: 1,
          }
        }
      ]).then(async (employees) => {
        const employee = employees[0];
        if (employee) {
          if (employee.emp_id) {
            if ((employee.attendance_count > 0) || (employee.monthly_reports_count > 0)) {
              return resp.status(200).json({ status: 'error', message: "This employee cannot be deleted due to associated processed data" });
            }
          }
          const entity = await Employee.findOneAndUpdate({ _id: employee._id }, { emp_id: "", status: "deleted", approval_status: "deleted" })

          const log = {
            emp_db_id: employee._id,
            action: "deleted",
            action_by: req.authData.user_id,
            description: `Employee ${employee?.emp_first_name} ${employee?.emp_last_name} (ID: ${employee?.emp_id}) has been permanently removed from the system by ${req.authData.userid}, associated with ${req.authData?.first_name} (Corp ID:  ${req.authData.corporate_id}). This action signifies the termination of the employee’s record, rendering their data inactive and irretrievable in the active database.`
          }
          await EmployeeLog.create(log)
          return resp.status(200).json({ status: 'success', message: "Employee deleted successfully" });
        } else {
          return resp.status(200).json({ status: 'error', message: "Employee not found" });
        }
      })

    } catch (e) {
      return resp.status(200).json({ status: 'error', message: e ? e.message : 'Something went wrong' });
    }
  }
};
async function get_parent_hods(hod_id, usertype) {
  var parent_hods = [];
  if (usertype === "staff") {
    await Staff.findOne(
      { _id: hod_id },
      "parent_hods",
      async function (err, parent_hod) {
        if (!err) {
          if (parent_hod) {
            parent_hods = parent_hod.parent_hods;
          }
          parent_hods.push(hod_id);
        }
      }
    );
  } else {
    await Company.findOne(
      { _id: hod_id },
      "parent_hods",
      async function (err, parent_hod) {
        if (!err) {
          if (parent_hod) {
            parent_hods = parent_hod.parent_hods;
          }
          parent_hods.push(hod_id);
        }
      }
    );
  }
  return parent_hods;
}

let full_and_final_process = async (req, resp, res) => {
  try {
    // leave balance
    res = await Site_helper.get_leave_encashment_balance({ docs: res });

    let entity = res.docs[0];
    const date = new Date();
    let monthdays = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
    let emp_data = entity.employee_details;

    var salary_earning_data = {
      heads: [],
      ctc: 0,
      total_pf_bucket: 0,
      total_pf_wages: 0,
      total_esic_bucket: 0,
      total_esic_wages: 0,
      total_pt_wages: 0,
      total_tds_wages: 0,
      total_ot_wages: 0,
      total_gratuity_wages: 0,
      net_take_home: 0,
      voluntary_pf_amount: 0,
      gross_earning: 0,
      gross_deduct: 0,
      total_bonus_wages: 0,
      total_employee_pf_contribution: 0,
      total_employeer_pf_contribution: 0,
      total_employee_esic_contribution: 0,
      total_employeer_esic_contribution: 0,
    };
    // let employee_payable_salary = {
    //   heads: [],
    //   gross_earning: 0,
    //   net_take_home: 0,
    //   ctc: 0,
    //   total_employee_pf_contribution: 0,
    //   total_employeer_pf_contribution: 0,
    //   total_employee_esic_contribution: 0,
    //   total_employeer_esic_contribution: 0,
    //   total_pt_wages: 0
    // }
    let employee_salary_breakup = [];

    let payfor_payment = await Site_helper.get_salary_breakup(
      req,
      emp_data.template_data.salary_temp_data,
      emp_data.employment_hr_details.gross_salary ||
      emp_data.employment_hr_details.gross_sallery,
      emp_data,
      req.body.payble_days,
      new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
      null,
      entity.emp_id,
      req.authData.corporate_id
    );

    if (entity.employee_monthly_reports.length) {
      let report_date = new Date(
        entity.employee_monthly_reports[0].wage_year,
        entity.employee_monthly_reports[0].wage_month + 1,
        0
      );
      let last_working_date = new Date(req.body.last_working_date);

      while (report_date < last_working_date) {
        report_date = new Date(
          report_date.setMonth(
            report_date.getMonth() === 11 ? 0 : report_date.getMonth() + 1
          )
        );
        let salary_breakup = await Site_helper.get_salary_breakup(
          req,
          emp_data.template_data.salary_temp_data,
          emp_data.employment_hr_details.gross_salary ||
          emp_data.employment_hr_details.gross_sallery,
          emp_data,
          new Date(
            report_date.getFullYear(),
            report_date.getMonth() + 1,
            0
          ).getDate(),
          new Date(
            report_date.getFullYear(),
            report_date.getMonth() + 1,
            0
          ).getDate(),
          null,
          entity.emp_id,
          req.authData.corporate_id
        );
        employee_salary_breakup.push(salary_breakup);

        (salary_earning_data.ctc += salary_breakup.ctc),
          (salary_earning_data.total_pf_bucket +=
            salary_breakup.total_pf_wages),
          (salary_earning_data.total_pf_wages += salary_breakup.total_pf_wages),
          (salary_earning_data.total_esic_bucket +=
            salary_breakup.total_esi_wages),
          (salary_earning_data.total_esic_wages +=
            salary_breakup.restrict_esic_wages),
          (salary_earning_data.total_pt_wages += salary_breakup.total_pt_wages),
          (salary_earning_data.total_tds_wages +=
            salary_breakup.total_tds_wages),
          (salary_earning_data.total_ot_wages += salary_breakup.total_ot_wages),
          (salary_earning_data.total_gratuity_wages +=
            salary_breakup.total_gratuity_wages),
          (salary_earning_data.net_take_home += salary_breakup.net_take_home),
          (salary_earning_data.voluntary_pf_amount +=
            salary_breakup.voluntary_pf_amount),
          (salary_earning_data.gross_earning += salary_breakup.gross_earning),
          (salary_earning_data.gross_deduct += salary_breakup.gross_deduct),
          (salary_earning_data.total_bonus_wages +=
            salary_breakup.total_bonus_wages),
          (salary_earning_data.total_employee_pf_contribution +=
            salary_breakup.total_employee_pf_contribution);
        salary_earning_data.total_employeer_pf_contribution +=
          salary_breakup.total_employeer_pf_contribution;
        salary_earning_data.total_employee_esic_contribution +=
          salary_breakup.total_employee_esic_contribution;
        salary_earning_data.total_employeer_esic_contribution +=
          salary_breakup.total_employeer_esic_contribution;
        salary_earning_data.heads = salary_breakup.heads.map((head) => {
          let hd = salary_earning_data.heads.find(
            (h) => h.head_id == head.head_id
          );
          if (hd) {
            hd.amount += +head.amount;
            return hd;
          } else {
            return head;
          }
        });
      }
    }

    // if (req.body.is_notice_pay) {
    //   let currentDate = new Date(req.body.do_resignation);
    //   let endDate = new Date(req.body.do_resignation);
    //   endDate.setDate(endDate.getDate() + +req.body.er_notice_period);

    //   while (currentDate.getMonth() < endDate.getMonth()) {
    //     let salary_breakup = await Site_helper.get_salary_breakup(
    //       req,
    //       emp_data.template_data.salary_temp_data,
    //       emp_data.employment_hr_details.gross_salary || emp_data.employment_hr_details.gross_sallery,
    //       emp_data,
    //       new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate(),
    //       new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate(),
    //       null,
    //       entity.emp_id,
    //       req.authData.corporate_id
    //     )
    //     employee_salary_breakup.push(salary_breakup)
    //     employee_payable_salary.gross_earning += salary_breakup.gross_earning;
    //     employee_payable_salary.net_take_home += salary_breakup.net_take_home;
    //     employee_payable_salary.ctc += salary_breakup.ctc;
    //     employee_payable_salary.total_employee_pf_contribution += salary_breakup.total_employee_pf_contribution;
    //     employee_payable_salary.total_employeer_pf_contribution += salary_breakup.total_employeer_pf_contribution;
    //     employee_payable_salary.total_employee_esic_contribution += salary_breakup.total_employee_esic_contribution;
    //     employee_payable_salary.total_employeer_esic_contribution += salary_breakup.total_employeer_esic_contribution;
    //     employee_payable_salary.total_pt_wages += salary_breakup.total_pt_wages
    //     employee_payable_salary.heads = salary_breakup.heads.map(head => {
    //       let hd = employee_payable_salary.heads.find((h) => h.head_id == head.head_id)
    //       if (hd) {
    //         hd.amount += +head.amount
    //         return hd
    //        } else { return head }
    //     })
    //     currentDate.setMonth(currentDate.getMonth() + 1);
    //   }

    //   const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    //   const diffInMilliseconds = Math.abs(endDate - currentDate); // Absolute difference in milliseconds

    //   let salary_breakup = await Site_helper.get_salary_breakup(
    //     req,
    //     emp_data.template_data.salary_temp_data,
    //     emp_data.employment_hr_details.gross_salary || emp_data.employment_hr_details.gross_sallery,
    //     emp_data,
    //     Math.floor(diffInMilliseconds / oneDay) + 1,
    //     new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate(),
    //     null,
    //     entity.emp_id,
    //     req.authData.corporate_id
    //   )
    //   employee_salary_breakup.push(salary_breakup)
    //   employee_payable_salary.gross_earning += salary_breakup.gross_earning;
    //   employee_payable_salary.net_take_home += salary_breakup.net_take_home;
    //   employee_payable_salary.ctc += salary_breakup.ctc;
    //   employee_payable_salary.total_employee_pf_contribution += salary_breakup.total_employee_pf_contribution;
    //   employee_payable_salary.total_employeer_pf_contribution += salary_breakup.total_employeer_pf_contribution;
    //   employee_payable_salary.total_employee_esic_contribution += salary_breakup.total_employee_esic_contribution;
    //   employee_payable_salary.total_employeer_esic_contribution += salary_breakup.total_employeer_esic_contribution;
    //   employee_payable_salary.total_pt_wages += salary_breakup.total_pt_wages
    //   employee_payable_salary.heads = salary_breakup.heads.map(head => {
    //     let hd = employee_payable_salary.heads.find((h) => h.head_id == head.head_id)
    //     if (hd) {
    //       hd.amount += +head.amount
    //       return hd
    //      } else { return head }
    //   })

    // } else if (req.body.net_pay) {
    //   let currentDate = new Date(req.body.do_resignation);
    //   let endDate = new Date(req.body.last_working_date);

    //   while (currentDate <= endDate) {
    //     let attendance_data = await Attendance_summaries.findOne({
    //       emp_id: entity.emp_id,
    //       attendance_month: String(currentDate.getMonth()),
    //       attendance_year: String(currentDate.getFullYear())
    //     })

    //     if (attendance_data) {
    //       let salary_breakup = await Site_helper.get_salary_breakup(
    //         req,
    //         emp_data.template_data.salary_temp_data,
    //         emp_data.employment_hr_details.gross_salary,
    //         emp_data,
    //         attendance_data.paydays,
    //         new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate(),
    //         null,
    //         entity.emp_id,
    //         req.authData.corporate_id
    //       );
    //       employee_salary_breakup.push(salary_breakup);

    //       employee_payable_salary.gross_earning += salary_breakup.gross_earning;
    //       employee_payable_salary.net_take_home += salary_breakup.net_take_home;
    //       employee_payable_salary.ctc += salary_breakup.ctc;
    //       employee_payable_salary.total_employee_pf_contribution += salary_breakup.total_employee_pf_contribution;
    //       employee_payable_salary.total_employeer_pf_contribution += salary_breakup.total_employeer_pf_contribution;
    //       employee_payable_salary.total_employee_esic_contribution += salary_breakup.total_employee_esic_contribution;
    //       employee_payable_salary.total_employeer_esic_contribution += salary_breakup.total_employeer_esic_contribution;
    //       employee_payable_salary.total_pt_wages += salary_breakup.total_pt_wages
    //       employee_payable_salary.heads = salary_breakup.heads.map(head => {
    //         let hd = employee_payable_salary.heads.find((h) => h.head_id == head.head_id)
    //         if (hd) {
    //           hd.amount += +head.amount
    //           return hd
    //          } else { return head }
    //       })
    //     }
    //     currentDate.setMonth(currentDate.getMonth() + 1);
    //   }
    // }

    if (req.body.leave_encashment) {
      var leave_encashment = await Site_helper.get_salary_breakup(
        req,
        emp_data.template_data.salary_temp_data,
        emp_data.employment_hr_details.gross_salary,
        emp_data,
        emp_data.total_encash_balance,
        monthdays,
        null,
        entity.emp_id,
        req.authData.corporate_id
      );
    }

    if (req.body.accumulated_bonus) {
      var bonus_date = [];
      await Promise.all(
        entity.bonus_modules.map(async (module) => {
          await Site_helper.calculate_bonus(
            emp_data.template_data.bonus_temp_data,
            emp_data.employment_hr_details.date_of_join,
            emp_data.employment_hr_details.gross_salary,
            module,
            req.companyData,
            date.getMonth()
          ).then((res) => {
            bonus_date.push(res);
          });
        })
      );
    }

    if (req.body.outstanding_incentive) {
      var incentive_data = await Site_helper.calculate_incentive(
        entity._id,
        emp_data.template_data.incentive_temp_data,
        emp_data.employment_hr_details.gross_salary,
        entity.incentive_modules,
        req.companyData,
        date.getMonth(),
        date.getFullYear()
      );
    }

    if (!req.body.outstanding_advance) {
      var advance_amount = await entity.advance_modules.reduce(
        (t_val, c_val) => t_val + +c_val.remaining_amount,
        0
      );
    }

    if (!req.body.tds) {
      var tds_amount = await entity.employee_tds_calculations.reduce(
        (t_val, c_val) => t_val + (+c_val.total_tds_wages || 0),
        0
      );
    }

    let doc = {
      corporate_id: req.authData.corporate_id,
      emp_db_id: entity._id,
      emp_id: entity.emp_id,
      payfor_payment_data: payfor_payment || null,
      salary_breakup_data: employee_salary_breakup || null,
      leave_encashment_data: leave_encashment || null,
      bonus_data: bonus_date || null,
      incentive_data: incentive_data || null,
      advance_data: advance_amount || null,
      salary_report: salary_earning_data || null,
      incentive_amount: incentive_data
        ? incentive_data.total_incentive_value
        : 0,
      bonus_amount: bonus_date
        ? bonus_date.reduce((t_val, c_val) => t_val + +c_val.bonus_amount, 0)
        : 0,
      advance_amount: advance_amount || 0,
      tds_amount: tds_amount || 0,
      leave_encashment_amount: leave_encashment
        ? leave_encashment.gross_earning
        : 0,
      is_notice_pay: req.body.is_notice_pay,
      other_deduction: 0,
      other_contribution: 0,
      gratuity_amount: 0,
      total_payable: 0,
      total_income: 0,
      created_at: Date.now(),
      status: "active",
    };

    doc.other_contribution = JSON.parse(req.body.extra_fields)
      .filter((d) => d.label == "add")
      .reduce((t_val, c_val) => t_val + +c_val.value, 0);
    doc.other_deduction = JSON.parse(req.body.extra_fields)
      .filter((d) => d.label == "less")
      .reduce((t_val, c_val) => t_val + +c_val.value, 0);

    let total_contribution =
      doc.bonus_amount +
      doc.gratuity_amount +
      doc.incentive_amount +
      doc.leave_encashment_amount +
      doc.other_contribution +
      doc.salary_report.gross_earning;

    let total_deduction =
      doc.advance_amount + doc.tds_amount + doc.other_deduction;

    if (!doc.is_notice_pay) {
      total_contribution += doc.payfor_payment_data.gross_earning;
    } else {
      total_deduction += doc.payfor_payment_data.gross_earning;
    }

    doc.total_income = total_contribution;
    doc.total_payable = total_contribution - total_deduction;

    Full_and_final.create(doc, function (err, data) {
      if (err) {
        return resp.status(200).send({ status: "error", message: err.message });
      }
    });
  } catch (err) {
    return resp.status(200).send({ status: "error", message: err.message });
  }
};

function extractIdFromDesignation(designation) {
  const startIndex = designation.lastIndexOf("[");
  const endIndex = designation.lastIndexOf("]");

  if (startIndex !== -1 && endIndex !== -1) {
    return designation.substring(startIndex + 1, endIndex);
  } else {
    // No square brackets found, return the entire designation
    return designation;
  }
}

function colorCell(color, pattern) {
  var wb = new xl.Workbook();
  return wb.createStyle({
    fill: {
      type: 'pattern',
      fgColor: color,
      patternType: pattern || 'solid',
    }
  });
}
