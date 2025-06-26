var User = require("../Model/Admin/User");
var Role = require("../Model/Admin/Role");
var Company = require("../Model/Admin/Company");
var Staff = require("../Model/Company/Staff");
var Employee = require("../Model/Company/employee");
const bcrypt = require("bcrypt");
const { Validator } = require("node-input-validator");
const niv = require("node-input-validator");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const JWT_SECRET = "payrollsoftwarivandebasiscustomtokenkeyvalue";
const mongoose = require("mongoose");
var db = require(".././db");
const AuthController = require("../Controller/AuthController");
const nodemailer = require("nodemailer");

const EmailHelper = require("../Helpers/EmailHelper");

module.exports = {
  admin_signin: async function (req, resp, next) {
    const v = new Validator(req.body, {
      corporate_id: "required",
      userid: "required",
      password: "required|length:20,8",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
      //res.status(422).send(v.errors);
    } else {
      User.findOne(
        {
          corporate_id: req.body.corporate_id,
          userid: req.body.userid,
          user_type: "super_admin",
        },
        "",
        function (err, superadmin) {
          if (err) {
            resp.json({ status: "error", message: "no data found" });
          } else {
            if (!superadmin) {
              return resp
                .status(200)
                .json({ status: "error", message: "Wrong login credentials" });
            }
            if (superadmin.status != "active") {
              return resp.status(200).json({
                status: "error",
                message: "Your account has been blocked",
              });
            }
            var chkval = bcrypt.compareSync(
              req.body.password,
              superadmin.password
            );
            if (chkval) {
              const options = { expiresIn: "365d" };
              const tokendata = {
                user_id: superadmin._id,
                user_email: superadmin.email_id,
                roles: superadmin.roles,
                user_type: superadmin.user_type,
                corporate_id: superadmin.corporate_id,
                userid: superadmin.userid,
                first_name: superadmin.first_name,
                last_name: superadmin.last_name,
              };
              const token = jwt.sign(tokendata, JWT_SECRET, options);

              resp.status(200).json({
                status: "success",
                superadmin: superadmin,
                token: token,
              });
            } else {
              resp
                .status(200)
                .json({ status: "error", message: "Wrong login credentials" });
            }
          }
        }
      );
    }
  },
  admin_token_check: async function (req, resp, next) {
    var token = req.headers["x-access-token"];
    if (!token)
      return resp
        .status(200)
        .send({ status: "error", message: "No token provided." });
    jwt.verify(token, JWT_SECRET, function (err, decoded) {
      if (err)
        return resp
          .status(200)
          .send({ status: "error", message: "Failed to authenticate token." });

      return resp.status(200).send(decoded);
    });
  },
  sub_admin_signin: async function (req, resp, next) {
    const v = new Validator(req.body, {
      corporate_id: "required",
      userid: "required",
      password: "required|length:20,8",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
      //res.status(422).send(v.errors);
    } else {
      User.findOne(
        {
          corporate_id: req.body.corporate_id,
          userid: req.body.userid,
          user_type: "sub_admin",
        },
        "",
        function (err, subadmin) {
          if (err) {
            resp.json({ status: "error", message: "no data found" });
          } else {
            if (!subadmin) {
              return resp
                .status(200)
                .json({ status: "error", message: "Wrong login credentials" });
            }
            if (subadmin.status != "active") {
              return resp.status(200).json({
                status: "error",
                message: "Your account has been blocked",
              });
            }
            var chkval = bcrypt.compareSync(
              req.body.password,
              subadmin.password
            );
            if (chkval) {
              Role.find(
                { _id: { $in: subadmin.roles }, status: "active" },
                "role_name modules",
                function (err, permissiondata) {
                  if (err)
                    return res.status(200).send({
                      status: "error",
                      message: "Something Went wrong",
                    });
                  const options = { expiresIn: "365d" };
                  const tokendata = {
                    user_id: subadmin._id,
                    user_email: subadmin.email_id,
                    roles: subadmin.roles,
                    user_type: subadmin.user_type,
                    corporate_id: subadmin.corporate_id,
                    userid: subadmin.userid,
                  };
                  const token = jwt.sign(tokendata, JWT_SECRET, options);

                  return resp.status(200).json({
                    status: "success",
                    subadmin: subadmin,
                    token: token,
                    permission: permissiondata,
                  });
                  //resp.status(200).send({ status: 'success', user_data: user_data,permission:permissiondata });
                }
              );
            } else {
              return resp
                .status(200)
                .json({ status: "error", message: "Wrong login credentials" });
            }
          }
        }
      );
    }
  },
  company_signin: async function (req, resp, next) {
    const v = new Validator(req.body, {
      corporate_id: "required",
      userid: "required",
      password: "required|length:20,8",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
      //res.status(422).send(v.errors);
    } else {
      Company.findOne(
        { corporate_id: req.body.corporate_id, userid: req.body.userid },
        "_id email_id package_id plan_id corporate_id userid first_name last_name password status establishment_name com_logo",
        async function (err, company) {
          if (err) {
            resp.json({ status: "error", message: "no data found" });
          } else {
            if (!company) {
              Staff.findOne(
                {
                  corporate_id: req.body.corporate_id,
                  userid: req.body.userid,
                },
                "_id email_id corporate_id user_type userid first_name last_name password status establishment_name company_id",
                await function (err, staff) {
                  if (err) {
                    return resp.json({
                      status: "error",
                      message: "no data found",
                    });
                  } else {
                    if (!staff) {
                      AuthController.admin_signin();
                      // next()
                      // return resp.status(200).json({ status: 'error', message: 'Wrong login credentials' });
                    }
                    if (staff.status != "active") {
                      return resp.status(200).json({
                        status: "error",
                        message: "Your account has been blocked",
                      });
                    }
                    var chk_stuff_val = bcrypt.compareSync(
                      req.body.password,
                      staff.password
                    );
                    if (chk_stuff_val) {
                      const options = { expiresIn: "365d" };
                      const tokendata = {
                        user_id: staff._id,
                        userdb_id: staff._id,
                        company_id: staff.company_id,
                        user_email: staff.email_id,
                        package_id: "",
                        plan_id: "",
                        user_type: "staff",
                        corporate_id: staff.corporate_id,
                        userid: staff.userid,
                        first_name: staff.first_name,
                        last_name: staff.last_name,
                      };
                      const token = jwt.sign(tokendata, JWT_SECRET, options);

                      Company.findOne(
                        { corporate_id: req.body.corporate_id },
                        "com_logo",
                        async function (err, com_data) {
                          if (err)
                            return resp.status(200).send({
                              status: "error",
                              message: err.message + "no data found",
                            });
                          staff.com_logo = com_data.com_logo;
                          return resp.status(200).json({
                            status: "success",
                            curr_user_data: staff,
                            token: token,
                            com_logo: com_data.com_logo,
                          });
                        }
                      );
                      //return resp.status(200).json({ status: 'success', curr_user_data: staff, token:token });
                    } else {
                      return resp.status(200).json({
                        status: "error",
                        message: "Wrong login credentials",
                      });
                    }
                  }
                }
              );
            } else {
              if (company.status != "active") {
                return resp.status(200).json({
                  status: "error",
                  message: "Your account has been blocked",
                });
              }
              var chkval = bcrypt.compareSync(
                req.body.password,
                company.password
              );
              if (chkval) {
                const options = { expiresIn: "365d" };
                const tokendata = {
                  user_id: company._id,
                  userdb_id: company._id,
                  company_id: company._id,
                  user_email: company.email_id,
                  package_id: company.package_id,
                  plan_id: company.plan_id,
                  user_type: "company",
                  corporate_id: company.corporate_id,
                  userid: company.userid,
                  first_name: company.establishment_name,
                  last_name: " ",
                };
                const token = jwt.sign(tokendata, JWT_SECRET, options);
                company._doc["user_type"] = "company";
                //console.log(company,company._doc);
                return resp.status(200).json({
                  status: "success",
                  curr_user_data: company,
                  token: token,
                  com_logo: company.com_logo,
                });
              } else {
                return resp.status(200).json({
                  status: "error",
                  message: "Wrong login credentials",
                });
              }
            }
          }
        }
      );
    }
  },
  staff_signin: async function (req, resp, next) {
    const v = new Validator(req.body, {
      corporate_id: "required",
      userid: "required",
      password: "required|length:20,8",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
      //res.status(422).send(v.errors);
    } else {
      Staff.findOne(
        { corporate_id: req.body.corporate_id, userid: req.body.userid },
        "",
        function (err, staff) {
          if (err) {
            return resp.json({ status: "error", message: "no data found" });
          } else {
            if (!staff) {
              return resp
                .status(200)
                .json({ status: "error", message: "Wrong login credentials" });
            }
            if (staff.status != "active") {
              return resp.status(200).json({
                status: "error",
                message: "Your account has been blocked",
              });
            }
            var chkval = bcrypt.compareSync(req.body.password, staff.password);
            if (chkval) {
              const options = { expiresIn: "365d" };
              const tokendata = {
                user_id: staff._id,
                user_email: staff.email_id,
                corporate_id: staff.corporate_id,
                userid: staff.userid,
                first_name: staff.first_name,
                last_name: staff.last_name,
                user_type: staff.user_type,
              };
              const token = jwt.sign(tokendata, JWT_SECRET, options);
              //console.log(staff,tokendata);
              return resp
                .status(200)
                .json({ status: "success", staff: staff, token: token });
            } else {
              return resp
                .status(200)
                .json({ status: "error", message: "Wrong login credentials" });
            }
          }
        }
      );
    }
  },
  // employee_signin:async function (req, resp, next) {
  //     const v = new Validator(req.body, {
  //         corporate_id: 'required',
  //         userid: 'required',
  //         password:'required|length:20,8',
  //       });
  //     const matched = await v.check();
  //     if (!matched) {
  //         return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
  //         //res.status(422).send(v.errors);
  //     }
  //     else{
  //         Employee.findOne({ corporate_id:req.body.corporate_id,emp_id:req.body.user_id },'',  function (err, employee) {
  //             if (err)
  //             {
  //                 resp.json({ status: 'error', message: 'no data found' });
  //             }
  //             else
  //             {
  //                 if(!employee)
  //                 {
  //                     AuthController.company_signin()
  //                     // next();
  //                     // return resp.status(200).json({ status: 'error', message: 'Wrong login credentials' });
  //                 }
  //                 if(employee.status == 'inactive')
  //                 {
  //                     return resp.status(200).json({ status: 'error', message: 'Your account has been blocked' });
  //                 }
  //                 if(employee.status == 'pending')
  //                 {
  //                     return resp.status(200).json({ status: 'error', message: 'Your account waiting for approval' });
  //                 }
  //                 var chkval=bcrypt.compareSync(req.body.password, employee.password);
  //                 if(chkval)
  //                 {
  //                     const options = { expiresIn: '365d' };
  //                     const tokendata={user_id:employee._id,user_email:employee.email_id,corporate_id:employee.corporate_id,userid:employee.emp_id,first_name:employee.emp_first_name,last_name:employee.emp_last_name,user_type:'employee'}
  //                     const token = jwt.sign(tokendata, JWT_SECRET, options);
  //                     //console.log(staff,tokendata);
  //                     resp.status(200).json({ status: 'success', employee: employee, token:token });
  //                 }
  //                 else
  //                 {
  //                     resp.status(200).json({ status: 'error', message: 'Wrong login credentials' });
  //                 }
  //             }

  //         })
  //     }
  // }
  employee_signin: async function (req, resp, next) {
    console.log("function call");

    const v = new Validator(req.body, {
      corporate_id: "required",
      userid: "required",
      password: "required|length:20,8",
    });
    const matched = await v.check();
    if (!matched) {
      return resp.status(200).send({
        status: "val_err",
        message: "Validation error",
        val_msg: v.errors,
      });
      //res.status(422).send(v.errors);
    } else {
      let entity = await Employee.findOne({
        $and: [
          { corporate_id: { $eq: req.body.corporate_id } },
          { emp_id: { $eq: req.body.userid } },
        ],
      });

      if (entity) {
        if (entity.status == "inactive") {
          return resp.status(200).json({
            status: "error",
            message: "Your account has been blocked",
          });
        }
        if (entity.status == "pending") {
          return resp.status(200).json({
            status: "error",
            message: "Your account waiting for approval",
          });
        }
        var chkval = bcrypt.compareSync(req.body.password, entity.password);
        if (chkval) {
          const options = { expiresIn: "365d" };
          const tokendata = {
            user_id: entity._id,
            user_email: entity.email_id,
            corporate_id: entity.corporate_id,
            userid: entity.emp_id,
            first_name: entity.emp_first_name,
            last_name: entity.emp_last_name,
            user_type: "employee",
          };
          const token = jwt.sign(tokendata, JWT_SECRET, options);
          entity["user_type"] = "employee";

          //console.log(staff,tokendata);
          return resp
            .status(200)
            .json({ status: "success", user: entity, token: token });
        } else {
          return resp
            .status(200)
            .json({ status: "error", message: "Wrong login credentials-employee" });
        }
      } else {
        entity = await Company.findOne(
          { corporate_id: req.body.corporate_id, userid: req.body.userid },
          "_id email_id package_id plan_id corporate_id userid first_name last_name password status establishment_name com_logo"
        );
        // entity = await Company.findOne({
        //   corporate_id: req.body.corporate_id,
        //   userid: req.body.userid,
        // });
      }

      if (entity) {
        if (entity.status != "active") {
          return resp.status(200).json({
            status: "error",
            message: "Your account has been blocked",
          });
        }
        var chkval = bcrypt.compareSync(req.body.password, entity.password);
        if (chkval) {
          const options = { expiresIn: "365d" };
          const tokendata = {
            user_id: entity._id,
            userdb_id: entity._id,
            company_id: entity._id,
            user_email: entity.email_id,
            package_id: entity.package_id,
            plan_id: entity.plan_id,
            user_type: "company",
            corporate_id: entity.corporate_id,
            userid: entity.userid,
            first_name: entity.establishment_name,
            last_name: " ",
          };
          const token = jwt.sign(tokendata, JWT_SECRET, options);
          entity._doc["user_type"] = "company";
          //console.log(company,company._doc);
          return resp.status(200).json({
            status: "success",
            user: entity,
            token: token,
            com_logo: entity.com_logo,
          });
        } else {
          return resp.status(200).json({
            status: "error",
            message: "Wrong login credentials-company",
          });
        }
      } else {
        entity = await Staff.findOne(
          {
            corporate_id: req.body.corporate_id,
            userid: req.body.userid,
          },
          "_id email_id corporate_id user_type userid first_name last_name password status establishment_name company_id"
        );
      }

      if (entity) {
        if (entity.status != "active") {
          return resp.status(200).json({
            status: "error",
            message: "Your account has been blocked",
          });
        }
        var chk_stuff_val = bcrypt.compareSync(
          req.body.password,
          entity.password
        );
        if (chk_stuff_val) {
          const options = { expiresIn: "365d" };
          const tokendata = {
            user_id: entity._id,
            userdb_id: entity._id,
            company_id: entity.company_id,
            user_email: entity.email_id,
            package_id: "",
            plan_id: "",
            user_type: "staff",
            corporate_id: entity.corporate_id,
            userid: entity.userid,
            first_name: entity.first_name,
            last_name: entity.last_name,
          };
          const token = jwt.sign(tokendata, JWT_SECRET, options);

          Company.findOne(
            { corporate_id: req.body.corporate_id },
            "com_logo",
            async function (err, com_data) {
              if (err)
                return resp.status(200).send({
                  status: "error",
                  message: err.message + "no data found",
                });
              entity.com_logo = com_data.com_logo;
              return resp.status(200).json({
                status: "success",
                user: entity,
                token: token,
                com_logo: com_data.com_logo,
              });
            }
          );
          //return resp.status(200).json({ status: 'success', curr_user_data: staff, token:token });
        } else {
          return resp.status(200).json({
            status: "error",
            message: "Wrong login credentials-staff",
          });
        }
      } else {
        User.findOne(
          {
            corporate_id: req.body.corporate_id,
            userid: req.body.userid,
            user_type: "super_admin",
          },
          "",
          function (err, superadmin) {
            if (err) {
              resp.json({ status: "error", message: "no data found" });
            } else {
              if (!superadmin) {
                return resp.status(200).json({
                  status: "error",
                  message: "Wrong login credentials-!superadmin",
                });
              }
              if (superadmin.status != "active") {
                return resp.status(200).json({
                  status: "error",
                  message: "Your account has been blocked",
                });
              }
              var chkval = bcrypt.compareSync(
                req.body.password,
                superadmin.password
              );
              if (chkval) {
                const options = { expiresIn: "365d" };
                const tokendata = {
                  user_id: superadmin._id,
                  user_email: superadmin.email_id,
                  roles: superadmin.roles,
                  user_type: superadmin.user_type,
                  corporate_id: superadmin.corporate_id,
                  userid: superadmin.userid,
                  first_name: superadmin.first_name,
                  last_name: superadmin.last_name,
                };
                const token = jwt.sign(tokendata, JWT_SECRET, options);

                return resp.status(200).json({
                  status: "success",
                  user: superadmin,
                  token: token,
                });
              } else {
                return resp.status(200).json({
                  status: "error",
                  message: "Wrong login credentials-superadmin",
                });
              }
            }
          }
        );
        // entity = Admin.findOne({
        //   corporate_id: req.body.corporate_id,
        //   userid: req.body.userid,
        // });
      }
    }
  },

 

  findCompanyByCorporateId: async function (req, res, next) {
    const v = new Validator(req.body, {
      corporate_id: "required",
      userid: "required"
    });

    const matched = await v.check();
    if (!matched) {
      return res.status(400).json({
        status: "validation_error",
        message: "Validation failed",
        errors: v.errors,
      });
    }

    try {
      const company = await Company.findOne({
        corporate_id: req.body.corporate_id,
        userid: req.body.userid
      });

      if (company) {
        console.log(company.email_id,"company.email_id");
        EmailHelper.forgot_password_mail(company);
       

        // const html = emailTemplates[template_key](template_data);
        // to_mail="akshatagarwal1001@gmail.com";
        // const mailOptions = {
        //   from: smtp.from,
        //   to: to_mail,
        //   subject,
        //   html,
        //   attachments,
        // };

        // const info = await transporter.sendMail(mailOptions);
        return {
          status: "success", message: "Company found and email sent",
          super: "1",
        };
      }


      const staff = await Staff.findOne(
        { corporate_id: req.body.corporate_id, userid: req.body.userid });
      console.log(staff, "staffstaff");
      if (!staff) {
        return res.status(404).json({
          status: "not_found",
          message: "Company with the given Corporate ID not found",
        });
      }

      const company1 = await Company.findOne({
        corporate_id: req.body.corporate_id,
      });

      return res.status(200).json({
        status: "success",
        // data: company,
        email: company1.email_id,
        staff: staff,
      });


      // if(company)
      // {
      //     return res.status(200).json({
      //       status: "success",
      //        });
      // }

      // else {


      //   if (!company1) {
      //     return res.status(404).json({
      //       status: "not_found",
      //       message: "Company with the given Corporate ID not found",
      //     });
      //   }

      //   return res.status(200).json({
      //     status: "success",
      //     // data: company,
      //     email: company1.email_id,
      //     staff: staff,
      //   });
      // }
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        error: error.message,
      });
    }
  },

};
