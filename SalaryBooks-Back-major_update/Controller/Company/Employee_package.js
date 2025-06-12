var EmployeePackage = require('../../Model/Company/EmployeePackage');
var Attendancerule = require('../../Model/Admin/Attendance');
var BonusTemp = require('../../Model/Admin/BonusTemp');
var PayslipTemp = require('../../Model/Admin/PayslipTemp');
var IncentiveTemp = require('../../Model/Admin/IncentiveTemp');
var OvertimeTemp = require('../../Model/Admin/OvertimeTemp');
var SalaryTemp = require('../../Model/Admin/SalaryTemp');
var Ptaxrule = require('../../Model/Admin/Ptaxrule');
var Tdsrule = require('../../Model/Admin/Tdsrule');
var LeaveRule = require('../../Model/Admin/LeaveRule');
var LwfRule = require('../../Model/Admin/LwfRule');
var ArrearSlipTemp = require('../../Model/Admin/ArrearSlipTemp');
var BonusSlipTemp = require('../../Model/Admin/BonusSlipTemp');
const { Validator } = require('node-input-validator');

module.exports = {
    get_package_master: async function (req, resp, next) {
        try{
            var masters={attendancerule:[],bonusTemp:[],incentiveTemp:[],overtimeTemp:[],ptaxrule:[],Tdsrule:[],salarytemp:[],leaverule:[],lwfrule:[],payslipTemp:[],bonusslipTemp:[],arrearslipTemp:[]};
        // update admin panel master data corporet id
            await Attendancerule.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id template_name',  function (err, attendancerule) {
                if (!err) 
                {
                    masters.attendancerule=attendancerule;
                }
            })
            await BonusTemp.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            }, function (err, bonusTemp) {
                if (!err) 
                {
                masters.bonusTemp=bonusTemp;
                }
            })
            await IncentiveTemp.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name n_a_applicable',  function (err, incentiveTemp) {
                if (!err) 
                {
                masters.incentiveTemp=incentiveTemp;
                }
            })
            await SalaryTemp.find({  status:'active',"corporate_id":req.authData.corporate_id },'_id template_name',  function (err, salarytemp) {
                if (!err) 
                {
                masters.salarytemp=salarytemp;
                }
            })
            await OvertimeTemp.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name n_a_applicable',  function (err, overtimeTemp) {
                if (!err) 
                {
                    masters.overtimeTemp=overtimeTemp;
                }
            })
            await Ptaxrule.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name state_name n_a_applicable',  function (err, ptaxrule) {
                if (!err) 
                {
                    ptaxrule.map(function(index){
                        index.template_name = index.state_name;
                    });
                    masters.ptaxrule=ptaxrule;
                }
            })
            await LeaveRule.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name n_a_applicable',  function (err, leaverule) {
                if (!err) 
                {
                    masters.leaverule=leaverule;
                }
            })
            await LwfRule.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id state n_a_applicable',  function (err, lwfrule) {
                if (!err) 
                {
                    masters.lwfrule=lwfrule;
                }
            })
            await Tdsrule.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name n_a_applicable',  function (err, Tdsrule) {
                if (!err) 
                {
                    masters.Tdsrule=Tdsrule;
                }
            })
            await PayslipTemp.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name n_a_applicable', function (err, payslipTemp) {
                if (!err) 
                {
                    masters.payslipTemp = payslipTemp;
                }
            })
            await BonusSlipTemp.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name n_a_applicable', function (err, bonusslipTemp) {
                if (!err) 
                {
                    masters.bonusslipTemp = bonusslipTemp;
                }
            })
            await ArrearSlipTemp.find({  
                $and: [
                    {status:'active' },
                    {
                        $or:[ 
                            {"corporate_id":req.authData.corporate_id},
                            {'n_a_applicable': 'yes'}, 
                        ]
                    }
                ],
            },'_id template_name n_a_applicable', function (err, arrearslipTemp) {
                if (!err) 
                {
                    return arrearslipTemp;
                }
            }).then((temps) => {
                masters.arrearslipTemp = temps;
                return resp.status(200).send({ status: 'success', message:"", masters: masters});
            })
        }
        catch(e){
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
    get_package_list: async function (req, resp, next) {
        try {
            var sortoption = {created_at: -1};
            const options = {
                page: req.body.pageno,
                limit: req.body.perpage?req.body.perpage:perpage,
                sort:    sortoption,
            };
            var filter_option={"corporate_id":req.authData.corporate_id};
            if(req.body.searchkey)
                { 
                    filter_option={$and:[{"corporate_id":req.authData.corporate_id},{$or:[
                            {"status":{$regex: ".*" + req.body.searchkey + ".*"}},
                            {"package_name":{$regex: ".*" + req.body.searchkey + ".*",  "$options":"i"}},
                        ]}
                    ]};
                }
            EmployeePackage.paginate(filter_option,options,  function (err, packages) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', packages: packages });
            })
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    
    add_package_data: async function (req, resp) {
        try {
            const v = new Validator(req.body, {
                package_name: 'required',
                attendance_temp: 'required',
                incentive_temp: 'required',
                bonus_temp: 'required',
                overtime_temp: 'required',
                tds_temp: 'required',
                ptax_temp: 'required',
                leave_temp: 'required',
                lwf_temp: 'required',
                payslip_temp:'required',
                bonus_slip_temp:'required',
                arrear_slip_temp:'required',
              });
              const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                var document = {
                    corporate_id:req.authData.corporate_id,
                    package_name:req.body.package_name,
                    attendance_temp:req.body.attendance_temp,
                    leave_policy_temp:req.body.leave_policy_temp,
                    incentive_temp:req.body.incentive_temp,
                    bonus_temp:req.body.bonus_temp,
                    overtime_temp:req.body.overtime_temp,
                    tds_temp:req.body.tds_temp,
                    ptax_temp:req.body.ptax_temp,
                    leave_temp:req.body.leave_temp,
                    lwf_temp:req.body.lwf_temp,
                    payslip_temp:req.body.payslip_temp,
                    bonus_slip_temp:req.body.bonus_slip_temp,
                    arrear_slip_temp:req.body.arrear_slip_temp,
                    status:'active', 
                    created_at: Date.now()
                };
                EmployeePackage.create(document,  function (err, packages) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    return resp.status(200).send({ status: 'success',message:"Package created successfully", packages: packages });
                })
            }
        } catch (e) {
            return resp.status(200).json({
              status: "error",
              message: e ? e.message : "Something went wrong",
            });
        }
    },
    update_package_data: async function (req, resp) {
        try{
            const v = new Validator(req.body, {
                package_id:'required',
                package_name: 'required',
                attendance_temp: 'required',
                incentive_temp: 'required',
                bonus_temp: 'required',
                overtime_temp: 'required',
                tds_temp: 'required',
                ptax_temp: 'required',
                leave_temp: 'required',
                lwf_temp: 'required',
                payslip_temp:'required',
                bonus_slip_temp:'required',
                arrear_slip_temp:'required',
            });
            const matched = await v.check();
            if (!matched) {
                return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
            }
            else{
                const employeePackage = await EmployeePackage.findById(req.body.package_id);
                if(employeePackage.assigned_status == 'assigned') return resp.status(403).json({ status: "error", message:"The action you're trying to perform is not available." });
                var document = {
                    package_name:req.body.package_name,
                    attendance_temp:req.body.attendance_temp,
                    incentive_temp:req.body.incentive_temp,
                    bonus_temp:req.body.bonus_temp,
                    overtime_temp:req.body.overtime_temp,
                    tds_temp:req.body.tds_temp,
                    ptax_temp:req.body.ptax_temp,
                    leave_temp:req.body.leave_temp,
                    lwf_temp:req.body.lwf_temp,
                    payslip_temp:req.body.payslip_temp,
                    bonus_slip_temp:req.body.bonus_slip_temp,
                    arrear_slip_temp:req.body.arrear_slip_temp,
                    updated_at: Date.now()
                    };
                    EmployeePackage.updateOne({'_id':req.body.package_id},document,  function (err, packages) {
                if (err) 
                {
                    return resp.status(200).send({ status: 'error', message: err.message });
                }
                else
                {
                    return resp.status(200).send({ status: 'success', message:"Package has been updated successfully", package: packages });
                }
                    
                })
            }
        }
        catch (e) {
            return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
        }
    },
}
