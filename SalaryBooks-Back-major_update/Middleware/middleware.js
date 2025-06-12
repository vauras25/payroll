var Role = require('../Model/Admin/Role');
var User = require('../Model/Admin/User');
var Package = require('../Model/Admin/Package');
var Plan = require('../Model/Admin/Plan');
var Company = require('../Model/Admin/Company');
var Staff = require('../Model/Company/Staff');
var ComRole = require('../Model/Company/Role');
const jwt = require('jsonwebtoken');
const JWT_SECRET='payrollsoftwarivandebasiscustomtokenkeyvalue';
module.exports = {
    
    checkStaffPermission(moduleval) {
        try{
            return async function (req, res, next) {
                var token = req.headers['x-access-token'];
                if (!token) return res.status(401).send({ status: 'error', message: 'No token provided.' });
                jwt.verify(token, JWT_SECRET, function(err, decoded) {
                    //console.log(decoded,req.authData);
                    //next();
                    
                    if (err) return res.status(401).send({ status: 'error', message: 'Failed to authenticate token.' });
                    if(decoded.user_type == "staff")
                    {
                        Staff.findById(decoded.user_id,'roles',  function (err, user_data) {
                            if (err) 
                            {
                                return res.status(200).send({ status: 'error', message: err.message });
                            }
                            else{
                                ComRole.find({$and:[{_id:{ $in: user_data.roles }},{status:'active'} ,{$or:moduleval},]}, 'role_name status modules', function (err, permissioncal) {
                                    if (err) res.status(200).send({ status: 'error', message: 'no data found' });
                                    if(permissioncal.length > 0)
                                    {
                                        next();
                                    }
                                    else
                                    {
                                        return res.status(401).send({ status: 'error', message: `No permission granted..` });
                                    }
                                }) 
                            }
                        })
                    }
                    else{
                        next();
                    }
                });
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    checkComPermission(moduleval,staffper) {
        try{
            return async function (req, res, next) {
                var token = req.headers['x-access-token'];
                if (!token) return res.status(401).send({ status: 'error', message: 'No token provided.' });
                jwt.verify(token, JWT_SECRET, function(err, decoded) {
                    //console.log(decoded,req.authData);
                    //next();
                    
                    if (err) return res.status(401).send({ status: 'error', message: 'Failed to authenticate token.' });
                    // if(decoded.user_type == "staff")
                    // {
                    //     Staff.findById(decoded.user_id,'roles',  function (err, user_data) {
                    //         if (err) 
                    //         {
                    //             resp.status(200).send({ status: 'error', message: err.message });
                    //         }
                    //         else{
                    //             ComRole.find({$and:[{_id:{ $in: user_data.roles }},{status:'active'} ,{$or:staffper},]}, 'role_name status modules', function (err, permissioncal) {
                    //                 if (err) res.status(200).send({ status: 'error', message: 'no data found' });
                    //                 if(permissioncal.length > 0)
                    //                 {
                    //                     next();
                    //                 }
                    //                 else
                    //                 {
                    //                     return res.status(401).send({ status: 'error', message: `No permission granted.` });
                    //                 }
                    //             }) 
                    //         }
                    //     })
                    // }
                    // else{
                    if(decoded.user_type == "company")
                    {
                        Company.findById(decoded.company_id,'plan_id',  function (err, user_data) {
                            if (err) 
                            {
                                return res.status(200).send({ status: 'error', message: err.message });
                            }
                            else{
                                Plan.findById(user_data.plan_id, 'package_id', function (err, Plandata) {
                                    if (err) return res.status(200).send({ status: 'error', message: err.message });
                                    Package.find({$and:[{_id:Plandata.package_id },{status:'active'} ,moduleval]},  function (err, permissioncal) {
                                        if (err) return res.status(200).send({ status: 'error', message: 'no data found' });
                                        if(permissioncal.length > 0)
                                        {
                                            next();
                                        }
                                        else
                                        {
                                            return res.status(401).send({ status: 'error', message: `No permission granted.`});
                                        }
                                    }) 
                                })
                                
                            }
                        })
                    } 
                    else{
                        next();
                    }
                });
            }
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    checkPermission(moduleval) {
        return async function (req, res, next) {
            var token = req.headers['x-access-token'];
            if (!token) return res.status(401).send({ status: 'error', message: 'No token provided.' });
            jwt.verify(token, JWT_SECRET, function(err, decoded) {
                //console.log(decoded.roles);
                if (err) return res.status(401).send({ status: 'error', message: 'Failed to authenticate token.' });
                    User.findById(decoded.user_id,'roles',  function (err, user_data) {
                        if (err) 
                        {
                            return res.status(200).send({ status: 'error', message: err.message });
                        }
                        else{
                            Role.find({$and:[{_id:{ $in: decoded.roles }},{status:'active'} ,{$or:moduleval},]}, 'role_name status modules', function (err, permissioncal) {
                                if (err) res.status(200).send({ status: 'error', message: 'no data found' });
                                if(permissioncal.length > 0)
                                {
                                    next();
                                }
                                else
                                {
                                    return res.status(401).send({ status: 'error', message: `No permission granted.` });
                                }
                            }) 
                        }
                    })
                    
            });
        }
    },
    adminAndSubadminPermission(moduleval) {
        return async function (req, res, next) {
            var token = req.headers['x-access-token'];
            if (!token) return res.status(401).send({ status: 'error', message: 'No token provided.' });
            jwt.verify(token, JWT_SECRET, function(err, decoded) {
                //console.log(decoded,'aaaaaaaaa');
                if (err) return res.status(401).send({ status: 'error', message: 'Failed to authenticate token.' });
                    if(decoded.user_type == "super_admin")
                    {
                        next();
                    }
                    else
                    {
                        User.findById(decoded.user_id,'roles',  function (err, user_data) {
                            if (err) 
                            {
                                return res.status(200).send({ status: 'error', message: err.message });
                            }
                            else{
                                Role.find({$and:[{_id:{ $in: decoded.roles }},{status:'active'} ,{$or:moduleval},]}, 'role_name status modules', function (err, permissioncal) {
                                    if (err) res.status(200).send({ status: 'error', message: 'no data found' });
                                    if(permissioncal.length > 0)
                                    {
                                        next();
                                    }
                                    else
                                    {
                                        return res.status(401).send({ status: 'error', message: `No permission granted.` });
                                    }
                                }) 
                            }
                        })
                    }
                    
                    
            });
        }
    },
    checkAuth:function (req, resp, next) {
        //return function (req, res, next) {
            var token = req.headers['x-access-token'];
            if (!token) return resp.status(401).send({ status: 'error', message: 'No token provided.' });
            jwt.verify(token, JWT_SECRET, function(err, decoded) {
                if (err) return resp.status(401).send({ status: 'error', message: 'Failed to authenticate token.' });
                req.authData=decoded;
                req.authId=decoded.user_id;
                
                //console.log(decoded)
                next();
            });
           
       // }
    },
    authUserType(usertype) {
        return function (req, res, next) {
            var token = req.headers['x-access-token'];
            if (!token) return resp.status(401).send({ status: 'error', message: 'No token provided.' });
            jwt.verify(token, JWT_SECRET, function(err, decoded) {
                if (err) return resp.status(401).send({ status: 'error', message: 'Failed to authenticate token.' });
                // console.log(decoded,usertype)
                if(usertype.includes(decoded.user_type))
                {
                    next();
                }
                else
                {
                    return res.status(401).send({ status: 'error', message: `No permission granted` });
                }
            });
        }
    },
    getCompanyData:function (req, resp, next) {
        var search_option= {$match: { corporate_id:req.authData.corporate_id}} ;
        Company.aggregate([search_option,
            {$lookup:{
              from: 'company_details',
              localField: '_id',
              foreignField: 'company_id',
              as: 'com_det'
            }}
            ,
            
            { "$addFields": {
                  "com_det": {
                      "$arrayElemAt": [ "$com_det", 0 ]
                  }
              }
            },
            { "$project": { 
              "_id":1,
              "corporate_id":1,
              "userid":1,
              "establishment_name":1,
              "com_logo":1,
              "credit_stat":1,
              "email_id":1,
              "phone_no":1,
              "com_det":1,
            }
            },
            ])
            .then(company_det => {
                //console.log(company_det,req.authData.corporate_id)
                req.companyData=
                {
                    financial_year_end:company_det[0].com_det.preference_settings.financial_year_end,
                    corporate_id:company_det[0].corporate_id,
                    com_state:company_det[0].com_det.reg_office_address.state,
                };
                next();
            });
    },
    checkCompanySuspension: (...args) => {
        return function (req, res, next) {
            Company.findOne({ corporate_id: req.authData.corporate_id }).then((company) => {
                if(company) {
                    if (args.includes(company.suspension)) {
                        return res.status(402).send({ status: 'error', suspension_type: company.suspension, message: `Insufficient credit balance` });
                    } else {
                        next();
                    }
                }
                else{
                    next();
                }
            }, (err) => {
                return res.status(200).send({ status: 'error', message: `Something went wrong` });
            })
            // const company = req.auth.corporate_id;

        }
    }
}