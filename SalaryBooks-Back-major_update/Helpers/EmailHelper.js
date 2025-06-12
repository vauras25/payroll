var SmtpSetup = require("../Model/Admin/SmtpSetup");
const { Validator } = require("node-input-validator");
const emailConfig = require("../Mail/Config");
const mongoose = require("mongoose");
const mustache = require("mustache");
const path = require("path");
const fs = require("fs");

const Config = require("../Mail/Config");

var smtp_setup = require("../Model/Admin/SmtpSetup");
var Site_helper = require("../Helpers/Site_helper");
var Employee = require("../Model/Company/employee");


let config_email_template = async (
    smtp_id,
    to_mail,
    subject,
    email_for,
    template_modal,
    attachments = ""
) => {
    if (smtp_id) {
        var smtp_data = await SmtpSetup.findById(
            mongoose.Types.ObjectId(smtp_id)
        );
        if (!smtp_data) throw 'Wrong SMTP Username!';
    }
    //  else {
    //     var smtp_data = {
    //         host_address: "mail.ivantechnology.in",
    //         port: 465,
    //         username: "smtp2.payroll@dev8.ivantechnology.in",
    //         password: "Mbl2YUkV0Cuh",
    //         from_email_address: "smtp2.payroll@dev8.ivantechnology.in",
    //     };
    // }
    // console.log(smtp_data);

    if (template_modal) {
        var templatePath = path.resolve(`emailTemplates/${email_for}.html`);
        var template = fs.readFileSync(templatePath, "utf8");
        var msg = mustache.render(template, template_modal);
    } else {
        var msg = email_for;
    }

    var ret_msg = await emailConfig.sendEmail({
        to_mail: to_mail,
        subject: subject,
        msg_body: msg,
        smtp_data: smtp_data,
        attachments: attachments,
    });
    return ret_msg;
}



const configTemplate = async (emailFor, content, corporate_id) => {
    try {
        const template = fs.readFileSync(path.resolve(`emailTemplates/${emailFor}.html`), "utf8")
        const body = mustache.render(template, content.body)

        const email = { ...content, body };

        smtpcredintials(corporate_id, email)
    } catch (err) {
        throw err
    }
}

const smtpcredintials = async (corporate_id, email) => {
    try {
        const smtp = await smtp_setup.findOne({
            corporate_id: corporate_id,
        });
        console.log(smtp, "amansmtp");
        Config.sendEmail(smtp, email)
    }
    catch (err) {
        throw err
    }
}

const smtpcredintials1 = async (corporate_id,maildata) => {
                console.log("second");
                try {
                  const smtp = await smtp_setup.findOne({
                    corporate_id,
                  });
                  console.log("third");
                  console.log(smtp, "amansmtp");
                  Config.sendEmail(smtp, maildata)
                }
                catch (err) {
                  throw err
                }
              }



module.exports = {

    employee_request_approval: async (
        smtp_id,
        to_mail,
        attachments = "",
        template_data = {
            first_name: "",
            last_name: "",
            request_type: "",
            submission_date: "",
            approved_by: "",
            company_name: "",
            request_status: ""
        }
    ) => {
        try {
            let subject = `${template_data.request_type} ${template_data.request_status}!`
            let templateBodyModal = {
                emp_name: template_data.first_name + ' ' + template_data.last_name,
                company_name: template_data.company_name,
                request_type: template_data.request_type,
                request_status: template_data.request_status
            };
            let res = await config_email_template(smtp_id, to_mail, subject, "employee_request_action", templateBodyModal, attachments);
            return res
        } catch (err) {
            throw err;
        }
    },

    forgot_password_mail: async (user) => {
        try {
            const emailContent = {
                // toMail: user.email_id,
                to_mail: "akshatagarwal1001@gmail.com",
                // to_mail: "aarya@vauras.in",
                // to_mail: "amanshawimp2023@gmail.com",
                subject: "Forgot company password",
                body: {
                    name: ((user?.userid || " ")),
                }
            }
            configTemplate("forgot_password", emailContent, user.corporate_id)
        } catch (err) {
            throw err
        }

    },


    send_payslip_bulk: async (req, resp) => {
        try {
            const v = new Validator(req.body, {
                wage_month: "required",
                wage_year: "required",
                smtp_id: "required",
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({
                    status: "val_err",
                    message: "Validation error",
                    val_msg: v.errors,
                });
            } else {
                var wage_month = req.body.wage_month;
                var wage_year = req.body.wage_year;
                var search_option = {
                    $match: {
                        $and: [
                            { corporate_id: req.authData.corporate_id },
                            { parent_hods: { $in: [req.authData.user_id] } },
                            { approval_status: "approved" },
                        ],
                    },
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
                    var query_data = await Site_helper.getEmpFilterData(
                        req,
                        search_option,
                        search_option_details
                    );
                    search_option_details = query_data.search_option_details;
                    search_option = query_data.search_option;
                }

                if (req.body.row_checked_all === "true") {
                    var ids = JSON.parse(req.body.unchecked_row_ids);
                    if (ids.length > 0) {
                        ids = ids.map(function (el) { return mongoose.Types.ObjectId(el) })
                        search_option.$match._id = { $nin: ids }
                    }
                }
                else {
                    var ids = JSON.parse(req.body.checked_row_ids);
                    if (ids.length > 0) {
                        ids = ids.map(function (el) { return mongoose.Types.ObjectId(el) })
                        search_option.$match._id = { $in: ids }
                    }
                }

                search_option_details.$match["employee_payslips.wage_month"] = parseInt(wage_month);
                search_option_details.$match["employee_payslips.wage_year"] = parseInt(wage_year);

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
                    {
                        $lookup: {
                            from: "employee_payslips",
                            "let": { "emp_db_idVar": "$emp_id" },
                            "pipeline": [
                                {
                                    "$match": {
                                        $and: [
                                            { "$expr": { "$eq": ["$emp_id", "$$emp_db_idVar"] } },
                                            { "wage_month": parseInt(wage_month) },
                                            { "wage_year": parseInt(wage_year) },
                                        ]
                                    }
                                }
                            ],
                            as: "employee_payslips",
                        },
                    },

                    search_option_details,
                    {
                        $addFields: {
                            employee_payslip: {
                                $arrayElemAt: ["$employee_payslips", 0],
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
                            email_id: 1,
                            payslip_temp_data: { $ifNull: ["$employee_detail.template_data.payslip_temp_data", {}] },
                            emp_data: "$employee_payslip.emp_data",
                            earnings_data: "$employee_payslip.earnings",
                            deductions_data: "$employee_payslip.deductions",
                            contribution_data: "$employee_payslip.contribution",
                            gross_earning: "$employee_payslip.gross_earning",
                            net_pay: "$employee_payslip.net_pay",
                            ctc: "$employee_payslip.ctc",
                            pdf_file_name: "$employee_payslip.pdf_file_name",
                            pdf_link: "$employee_payslip.pdf_link",
                            wage_month: "$employee_payslip.wage_month",
                            wage_year: "$employee_payslip.wage_year",
                            department: 1,
                            designation: 1,
                            client: 1,
                            hod: 1,
                            "deductions": 1,
                            "earnings": 1,
                            "contribution": 1
                        },
                    },
                ]).then(async (emps) => {
                    await Promise.all(emps.map(async function (employee) {
                        var attachments = [];
                        if (fs.existsSync(file_path + employee.pdf_link)) {
                            attachments.push({
                                filename: employee.pdf_file_name,
                                path: file_path + employee.pdf_link,
                            })
                        }

                        const wage_month = new Date(
                            new Date().getFullYear(),
                            employee.wage_month,
                            1
                        )
                        var email_subject = 'payslip-' + wage_month.toLocaleString("default", { month: "short" }).toLowerCase() + '-' + employee.wage_year;
                        var email_body = `Attached is your payslip for ${wage_month.toLocaleString("default", { month: "long" })},${employee.wage_year}.`
                        // var email_subject='payslip-'+empdata.wage_month+'-'+empdata.wage_year;
                        // var email_body = `Attached is your payslip for ${wage_month.toLocaleString("default", { month: "long" })},${employee.wage_year}.` 


                        // if(employee.email_id && attachments.length){
                        //   await EmailHelper.send_email(req.body.smtp_id,employee.email_id,email_subject,email_body,null,attachments);
                        // }


                        if (employee.email_id && attachments.length) {
                            const maildata = {
                                to_mail: employee.email_id,
                                subject: 'payslip-' + wage_month.toLocaleString("default", { month: "short" }).toLowerCase() + '-' + employee.wage_year,
                                body: `Attached is your payslip for ${wage_month.toLocaleString("default", { month: "long" })}, ${employee.wage_year}.`,
                                attachments: attachments
                            };

                            console.log("first");
                            // const smtp =  smtp_setup.findOne({
                            //   corporate_id: "VBL",
                            // });
                            // console.log(smtp, "amansmtp");
                            // // console.log(maildata, "aman11", smtp);
                            // // Config.sendEmail(smtp, email)
                            var corporate = "VBL";
                            smtpcredintials1(corporate, maildata)


                            // await config.sendEmail(smtp, maildata);


                        }

                        // var return_data= await EmailHelper.send_email(req.body.smtp_id,empdata.email_id,email_subject,'email content',attachments);
                    })).then(async (comp_emp) => {
                        return resp.status(200).json({ status: "success", message: 'Payslip has been sent successfully', });
                    })
                })
            }
        } catch (e) {
            return resp.status(200).json({
                status: "error",
                message: e ? e.message : "Something went wrong",
            });
        }
        // try {
        //   const v = new Validator(req.body, {
        //     wage_month: "required",
        //     wage_year: "required",
        //   });
        //   const matched = await v.check();
        //   if (!matched) {
        //       return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        //   }
        //   else{
        //       var emp_payslip=await EmployeePayslip.findById(req.body.payslip_id);

        //       var attachments =[ 
        //           {
        //             filename: emp_payslip.pdf_file_name,
        //             path: file_path+emp_payslip.pdf_link,
        //           }
        //       ];
        //       var email_subject='payslip-'+emp_payslip.wage_month+'-'+emp_payslip.wage_year;
        //       var return_data= await EmailHelper.send_email(req.body.smtp_id,'debasisjana77@yopmail.com',email_subject,'email content',attachments);
        //       return resp.status(200).json({status: "success",message:"Payslip has been sent successfully",});

        //   }
        // } catch (e) {
        //   return resp.status(200).json({
        //     status: "error",
        //     message: e ? e.message : "Something went wrong",
        //   });
        // }
    },

   
};

// let send_email = async (
//     smtp_id,
//     to_mail,
//     subject,
//     email_for,
//     template_modal,
//     attachments = ""
// ) => {
//     try {
//         if (smtp_id) {
//             var smtp_data = await SmtpSetup.findById(
//                 mongoose.Types.ObjectId(smtp_id)
//             );
//             if(!smtp_data) throw 'Wrong SMTP Username!';
//         } else {
//             var smtp_data = {
//                 host_address: "mail.ivantechnology.in",
//                 port: 465,
//                 username: "smtp2.payroll@dev8.ivantechnology.in",
//                 password: "Mbl2YUkV0Cuh",
//                 from_email_address: "smtp2.payroll@dev8.ivantechnology.in",
//             };
//         }
//         console.log(smtp_data);

//         var templatePath = path.resolve(`emailTemplates/${email_for}.html`);
//         var template = fs.readFileSync(templatePath, "utf8");
//         let msg = mustache.render(template, template_modal);

//         var ret_msg = await emailConfig.sendEmail({
//             to_mail: to_mail,
//             subject: subject,
//             msg_body: msg,
//             smtp_data: smtp_data,
//             attachments: attachments,
//         });
//         return ret_msg;
//     } catch (err) {
//         throw err
//     }
// }
