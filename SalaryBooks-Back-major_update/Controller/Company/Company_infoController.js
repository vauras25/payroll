var Company = require('../../Model/Admin/Company');
var CompanyDetails = require('../../Model/Admin/Company_details');
var Esicrule = require('../../Model/Admin/Esicrule');
const { Validator } = require('node-input-validator');
var fs = require('fs');
const  niv = require('node-input-validator');
var multer = require('multer');
const moment = require('moment');
const lowBalanceCompany = require('../../Model/Company/LowBalanceCompanies');
const mongoose = require('mongoose');
var CompanyMonthlyCreditUsage = require('../../Model/Admin/CompanyMonthlyCreditUsage');
const CompanyCreditHistoryLogs = require('../../Model/Admin/CompanyCreditHistoryLog');
var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, '../../storage/admin/company_reg_certificate');
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + Date.now());
    }
  });
module.exports = {
    get_company_data:async function (req, resp, next) {
        try{
            const options = {
                sort:     { created_at: -1 },
              };
              var search_option= {$match: { corporate_id:req.authData.corporate_id}} ;
              //console.log(search_option);
              // var myAggregate = Company.aggregate([
              //   search_option,
              //   {$lookup:{
              //     from: 'company_details',
              //     localField: '_id',
              //     foreignField: 'company_id',
              //     as: 'com_det'
              //   }},
                
              // ]);
              Company.aggregate([search_option,
                {$lookup:{
                  from: 'company_details',
                  localField: '_id',
                  foreignField: 'company_id',
                  as: 'com_det'
                }}
                ,
                {$lookup:{
                  from: 'plans',
                  localField: 'plan_id',
                  foreignField: '_id',
                  as: 'plans'
                }
              },
              {$lookup:{
                from: 'packages',
                localField: 'plans.package_id',
                foreignField: '_id',
                as: 'package'
              }
            },
            {
              $lookup: {
                from: "file_managers",
                localField: "corporate_id",
                foreignField: "corporate_id",
                as: "file_managers",
              },
            },
            { "$addFields": {
                  "com_det": {
                      "$arrayElemAt": [ "$com_det", 0 ]
                  },
                  total_file_size:{
                    "$sum": "$file_managers.file_size",
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
              "package_id":1,
              "plan_id":1,
              "com_det":1,
              "plans._id":1,
              "plans.plan_name":1,
              "package.package_name":1,
              "package.gov_gratuity_rule":1,
              "package.gov_pf_rule":1,
              "package.gov_esic_rule":1,
              "package.gov_ptax_rule":1,
              "package.gov_bonus_rule":1,
              "package.gov_tds_rule":1,
              "package.gov_lwf_rule":1,
              "package.gov_pf_rule_type":1,
              "package.gov_esic_rule_type":1,
              "package.gov_gratuity_rule_type":1,
              "package.gov_ptax_rule_type":1,
              "package.gov_bonus_rule_type":1,
              "package.gov_lwf_rule_type":1,
              "package.module":1,
              "package.employee_vault":1,
              "total_file_size":1,
            }
          },

            ], async function (err, company_det) {
                  if (err) return resp.json({ status: 'error', message: err.message });
                  if(company_det.length>0)
                  {
                    company_det[0].esic_rules  = await Esicrule.findOne({'corporate_id':{$eq: req.authData.corporate_id},'effective_date': {$lt: new Date() }}).sort({effective_date:-1});
                    return resp.status(200).json({ status: 'success', company_det: company_det[0] });
                  }
                  else
                  {
                    return resp.status(200).json({ status: 'error', message: err ? err.message:'Something went wrong.' });
                  }
              })
          }
          catch (e) {
            return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
          }
    },
    update_company_logo: async function (req, resp) {
      try{
          var document = {};
            var upload = multer({ storage: storage }).single("com_logo");
            upload(req, resp, (err) => {
            if(!err) {
              if (req.files.length > 0) {
                document.com_logo=req.files[0].path;
                Company.findOne({'corporate_id':req.authData.corporate_id},'com_logo',  function (err, com_data) {
                    if (err) 
                    {
                      return resp.status(200).send({ status: 'error', message: err.message });
                    }
                    else{                      
                      var filePath = file_path+'/'+com_data.com_logo; 
                      //resp.status(200).send({ status: 'success', message:"Account has been updated successfullyc" });
                      if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                      }
                      
                      Company.updateOne({'corporate_id':req.authData.corporate_id},document,  function (err, com_data) {
                          if (err) 
                          {
                            return resp.status(200).send({ status: 'error', message: err.message });
                          }
                          else
                          {
                            return resp.status(200).send({ status: 'success', message:"Logo has been updated successfully", com_data: com_data });
                          }
                      })
                    }
                })
              }
            }
            else{
              return resp.status(200).send({ status: 'error', message: 'error upload' });
            }
          });
      }
      catch (e) {
        return resp.status(200).json({ status: "error", message: e ? e.message:'Something went wrong' });
      }
    },
    get_company_branch:async function (req, resp, next) {
      try{
        CompanyDetails.findOne({'company_id':req.authData.company_id},'company_branch', function (err, branches) {
            if (err) 
            {
              return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
              return resp.status(200).send({ status: 'success', branches: branches.company_branch });
            }
          
          })
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
  },
    
    update_company_details:async function (req, resp, next) {
      try{
        const v = new Validator(req.body, {
          establishment_type: 'required|in:individual,proprietorship,partnership,pvt_ltd,ltd,llp,trust,other',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var document = {
              'details.establishment_type':req.body.establishment_type,
          }
          if (req.files.length > 0) {
              document['details.establishment_reg_certificate']=req.files[0].path;
          }
          if (req.files.length > 0) {
            var logo_document={com_logo:req.files[0].path};
            Company.findOne({'corporate_id':req.authData.corporate_id},'com_logo',  function (err, com_data) {
                if (err) 
                {
                  return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                  
                  var filePath = file_path+'/'+com_data.com_logo; 
                  //resp.status(200).send({ status: 'success', message:"Account has been updated successfullyc" });
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                  }
                  
                  Company.updateOne({'corporate_id':req.authData.corporate_id},logo_document,  function (err, com_data) {
                      if (err) 
                      {
                        return resp.status(200).send({ status: 'error', message: err.message });
                      }
                  })
                }
            })
          }
          var company_id=req.authData.company_id;
          //console.log(document,company_id)
          CompanyDetails.updateOne({'company_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Company details updated successfully", comp_det: comp_det });
          })
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_reg_office_address:async function (req, resp, next) {
      try{
        const v = new Validator(req.body, {
          door_no: 'required',
          street_name: 'required',
          pin_code: 'required',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var document = {
            'reg_office_address.door_no':req.body.door_no,
            'reg_office_address.street_name':req.body.street_name,
            'reg_office_address.locality':req.body.locality,
            'reg_office_address.district_name':req.body.district_name,
            'reg_office_address.state':req.body.state,
            'reg_office_address.pin_code':req.body.pin_code,
            'reg_office_address.state_code':req.body.state_code,
          }
          var company_id=req.authData.company_id;
          //console.log(document,company_id)
          CompanyDetails.updateOne({'company_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Company Registered Office Address updated successfully", comp_det: comp_det });
          })
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_communication_office_address:async function (req, resp, next) {
      try{
        const v = new Validator(req.body, {
          door_no: 'required',
          street_name: 'required',
          pin_code: 'required',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var document = {
            'communication_office_address.door_no':req.body.door_no,
            'communication_office_address.street_name':req.body.street_name,
            'communication_office_address.locality':req.body.locality,
            'communication_office_address.district_name':req.body.district_name,
            'communication_office_address.state':req.body.state,
            'communication_office_address.pin_code':req.body.pin_code,
          }
          var company_id=req.authData.company_id;
          //console.log(document,company_id)
          CompanyDetails.updateOne({'company_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Company Communication Office Address updated successfully", comp_det: comp_det });
          })
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_epf:async function (req, resp, next) {
      try{
        const v = new Validator(req.body, {
          registration_no: 'required',
          pf_rule_apply: 'required|in:yes,no',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var document = {
            'epf.registration_no':req.body.registration_no,
            'epf.group_no':req.body.group_no,
            'epf.pf_rule_apply':req.body.pf_rule_apply,
            'epf.pf_rule':req.body.pf_rule,
            'epf.lin_no':req.body.lin_no,
            'epf.note_box':req.body.note_box,
            'epf.regional_office_address':req.body.regional_office_address,
          }
          if (req.files.length > 0) {
              document['epf.pf_certificate']=req.files[0].path;
          }
          var company_id=req.authData.company_id;
          //console.log(document,company_id)
          CompanyDetails.updateOne({'company_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Company Employer’s Provident Fund updated successfully", comp_det: comp_det });
          })
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_esic:async function (req, resp, next) {
      try{
        const v = new Validator(req.body, {
          registration_no: 'required',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var document = {
            'esic.registration_no':req.body.registration_no,
            'esic.regional_pf_office':req.body.regional_pf_office,
            'esic.lin_no':req.body.lin_no,
            'esic.note_box':req.body.note_box,
          }
          if (req.files.length > 0) {
              document['esic.esic_certificate']=req.files[0].path;
          }
          var company_id=req.authData.company_id;
          //console.log(document,company_id)
          CompanyDetails.updateOne({'company_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Company Employer’s State Insurance updated successfully", comp_det: comp_det });
          })
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_professional_tax:async function (req, resp, next) {
      try{
        const v = new Validator(req.body, {
          registration_no_enrolment: 'required',
          registration_no_rgistration: 'required',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var document = {
            'professional_tax.registration_no_enrolment':req.body.registration_no_enrolment,
            'professional_tax.registration_no_rgistration':req.body.registration_no_rgistration,
            'professional_tax.note_box':req.body.note_box,
          }
          //console.log(req.files)
          if (req.files.length > 0) {
            if(req.files[0].path.fieldname == 'registration_no_enrolment_certificate')
            {
              document['professional_tax.registration_no_enrolment_certificate']=req.files[0].path;
            }
            else{
              document['professional_tax.registration_no_rgistration_certificate']=req.files[0].path;
            } 
            if (req.files.length > 1) {
              if(req.files[1].path.fieldname == 'registration_no_enrolment_certificate')
              {
                document['professional_tax.registration_no_enrolment_certificate']=req.files[1].path;
              }
              else{
                document['professional_tax.registration_no_rgistration_certificate']=req.files[1].path;
              } 
            }
              
          }
          var company_id=req.authData.company_id;
          //console.log(document,company_id)
          CompanyDetails.updateOne({'company_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Company Professional Tax updated successfully", comp_det: comp_det });
          })
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_branch_details:async function (req, resp, next) {
      try{
        //return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: req.body });
        const v = new Validator(req.body, {
          branch_name: 'required',
          status: 'required|in:active,inactive',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var company_id=req.authData.company_id;
          var branch_id=req.body.branch_id;
          var obj = req.files;
          //console.log(document,company_id)
          if(branch_id)
          {
            var document ={
              'company_branch.$.branch_name':req.body.branch_name?req.body.branch_name:null,
              'company_branch.$.branch_contact_person':req.body.branch_contact_person?req.body.branch_contact_person:null,
              'company_branch.$.contact_person_number':req.body.contact_person_number?req.body.contact_person_number:null,
              'company_branch.$.contact_person_email':req.body.contact_person_email?req.body.contact_person_email:null,
              // 'company_branch.$.branch_EPFO_number':req.body.branch_EPFO_number?req.body.branch_EPFO_number:null,
              // 'company_branch.$.branch_ESIC_number':req.body.branch_ESIC_number?req.body.branch_ESIC_number:null,
              // 'company_branch.$.branch_P_Tax_number':req.body.branch_P_Tax_number?req.body.branch_P_Tax_number:null,
              'company_branch.$.branch_address':req.body.branch_address?req.body.branch_address:null,
              'company_branch.$.lwf_shop':req.body.lwf_shop?req.body.lwf_shop:null,
              'company_branch.$.establishment_labour_license':req.body.establishment_labour_license?req.body.establishment_labour_license:null,
              'company_branch.$.status':req.body.status,

              'company_branch.$.p_tax_registration_no_enrolment':req.body.p_tax_registration_no_enrolment,
              'company_branch.$.p_tax_registration_no_rgistration':req.body.p_tax_registration_no_rgistration,

              'company_branch.$.esic_registration_no':req.body.esic_registration_no,
              'company_branch.$.esic_regional_pf_office':req.body.esic_regional_pf_office,
              'company_branch.$.esic_lin_no':req.body.esic_lin_no,

              'company_branch.$.epf_registration_no':req.body.epf_registration_no,
              'company_branch.$.epf_group_no':req.body.epf_group_no,
              'company_branch.$.epf_pf_rule_apply':req.body.epf_pf_rule_apply,
              'company_branch.$.epf_pf_rule':req.body.epf_pf_rule,
              'company_branch.$.epf_lin_no':req.body.epf_lin_no,
              'company_branch.$.epf_regional_office_address':req.body.epf_regional_office_address,
              'company_branch.$.state':req.body.state,
              'company_branch.$.state_code':req.body.state_code,
            }
            await Promise.all(obj.map(async (file) => {
              if(file.fieldname === 'branch_EPFO_number_doc')
              {
                document['company_branch.$.branch_EPFO_number_doc']=file.path;
              }
              if(file.fieldname === 'branch_ESIC_number_doc')
              {
                document['company_branch.$.branch_ESIC_number_doc']=file.path;
              }
              // if(file.fieldname === 'branch_P_Tax_number_doc')
              // {
              //   document['company_branch.$.branch_P_Tax_number_doc']=file.path;
              // }

              if(file.fieldname === 'ptax_enrolment_certificate')
              {
                document['company_branch.$.ptax_enrolment_certificate']=file.path;
              }
              if(file.fieldname === 'ptax_rgistratihion_certificate')
              {
                document['company_branch.$.ptax_rgistration_certificate']=file.path;
              }
            }));
            //console.log('document',company_id)
            CompanyDetails.updateOne({'company_id':company_id,"company_branch._id": branch_id},{$set :document},   function (err, comp_det) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Company Branch updated successfully", comp_det: comp_det });
            })
          }
          else{
            var document2 ={
              'branch_name':req.body.branch_name?req.body.branch_name:null,
              'branch_contact_person':req.body.branch_contact_person?req.body.branch_contact_person:null,
              'contact_person_number':req.body.contact_person_number?req.body.contact_person_number:null,
              'contact_person_email':req.body.contact_person_email?req.body.contact_person_email:null,
              // 'branch_EPFO_number':req.body.branch_EPFO_number?req.body.branch_EPFO_number:null,
              // 'branch_ESIC_number':req.body.branch_ESIC_number?req.body.branch_ESIC_number:null,
              // 'branch_P_Tax_number':req.body.branch_P_Tax_number?req.body.branch_P_Tax_number:null,
              'branch_address':req.body.branch_address?req.body.branch_address:null,
              'lwf_shop':req.body.lwf_shop?req.body.lwf_shop:null,
              'establishment_labour_license':req.body.establishment_labour_license?req.body.establishment_labour_license:null,
              'status':req.body.status,

              'p_tax_registration_no_enrolment':req.body.p_tax_registration_no_enrolment,
              'p_tax_registration_no_rgistration':req.body.p_tax_registration_no_rgistration,

              'esic_registration_no':req.body.esic_registration_no,
              'esic_regional_pf_office':req.body.esic_regional_pf_office,
              'esic_lin_no':req.body.esic_lin_no,

              'epf_registration_no':req.body.epf_registration_no,
              'epf_group_no':req.body.epf_group_no,
              'epf_pf_rule_apply':req.body.epf_pf_rule_apply,
              'epf_pf_rule':req.body.epf_pf_rule,
              'epf_lin_no':req.body.epf_lin_no,
              'epf_regional_office_address':req.body.epf_regional_office_address,
              'state':req.body.state,
              'state_code':req.body.state_code,
            }
            await Promise.all(obj.map(async (file) => {
              if(file.fieldname === 'branch_EPFO_number_doc')
              {
                document2['branch_EPFO_number_doc']=file.path;
              }
              if(file.fieldname === 'branch_ESIC_number_doc')
              {
                document2['branch_ESIC_number_doc']=file.path;
              }
              // if(file.fieldname === 'branch_P_Tax_number_doc')
              // {
              //   document2['branch_P_Tax_number_doc']=file.path;
              // }
              if(file.fieldname === 'ptax_enrolment_certificate')
              {
                document2['ptax_enrolment_certificate']=file.path;
              }
              if(file.fieldname === 'ptax_rgistration_certificate')
              {
                document2['ptax_rgistration_certificate']=file.path;
              }
            }));
            //console.log('document2',company_id)
            CompanyDetails.updateOne({'company_id':company_id},{$addToSet: {company_branch : document2}},   function (err, comp_det) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Company Branch added successfully", comp_det: comp_det });
            })
          }
          // 
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_establishment_details:async function (req, resp, next) {
      try{
          var company_id=req.authData.company_id;
          var obj = req.files;
            var document2 ={
              'establishment.nature_of_business':req.body.nature_of_business? req.body.nature_of_business:null,
              'establishment.date_of_incorporation':req.body.date_of_incorporation?req.body.date_of_incorporation:null,
              'establishment.trade_licence_no':req.body.trade_licence_no?req.body.trade_licence_no:null,
              'establishment.gst_no':req.body.gst_no?req.body.gst_no:null,
              'establishment.pan_numberc':req.body.pan_numberc?req.body.pan_numberc:null,
              'establishment.tan_number':req.body.tan_number?req.body.tan_number:null,
              'establishment.website':req.body.website?req.body.website:null,
              'establishment.mobile_no':req.body.mobile_no?req.body.mobile_no:null,
              'establishment.land_line':req.body.land_line?req.body.land_line:null,
              'establishment.email_id':req.body.email_id?req.body.email_id:null,
              'establishment.alternate_email_id':req.body.alternate_email_id?req.body.alternate_email_id:null,

            }
            await Promise.all(obj.map(async (file) => {
              if(file.fieldname === 'gst_doc')
              {
                document2['establishment.gst_doc']=file.path;
              }
              if(file.fieldname === 'trade_Licence_doc')
              {
                document2['establishment.trade_Licence_doc']=file.path;
              }
              if(file.fieldname === 'pan_numberc_doc')
              {
                document2['establishment.pan_numberc_doc']=file.path;
              }
              if(file.fieldname === 'tan_number_doc')
              {
                document2['establishment.tan_number_doc']=file.path;
              }
            }));
            CompanyDetails.updateOne({'company_id':company_id},document2,   function (err, comp_det) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Company Establishment details updated successfully", comp_det: comp_det });
            })
      }
      
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_partners_details:async function (req, resp, next) {
      try{
          var company_id=req.authData.company_id;
          var partner_id=req.body.partner_id;
          var obj = req.files;
          if(partner_id)
          {
            var document ={
              'partners.$.first_name':req.body.first_name? req.body.first_name:null,
              'partners.$.last_name':req.body.last_name?req.body.last_name:null,
              'partners.$.designation':req.body.designation?req.body.designation:null,
              'partners.$.din_no':req.body.din_no?req.body.din_no:null,
              'partners.$.date_of_appointment':req.body.date_of_appointment?req.body.date_of_appointment:null,
              'partners.$.mobile_no':req.body.mobile_no?req.body.mobile_no:null,
              'partners.$.pan_no':req.body.pan_no?req.body.pan_no:null,
              'partners.$.aadhaar_no':req.body.aadhaar_no?req.body.aadhaar_no:null,
            }
            await Promise.all(obj.map(async (file) => {
              if(file.fieldname === 'partners_pan_doc')
              {
                document['partners.$.partners_pan_doc']=file.path;
              }
              if(file.fieldname === 'partners_aadhaar_no')
              {
                document['partners.$.partners_aadhaar_no']=file.path;
              }
            }));
            CompanyDetails.updateOne({'company_id':company_id,"partners._id": partner_id},{$set :document},   function (err, comp_det) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Company Partner updated successfully", comp_det: comp_det });
            })
          }
          else{
            var document2 ={
              'first_name':req.body.first_name? req.body.first_name:null,
              'last_name':req.body.last_name?req.body.last_name:null,
              'designation':req.body.designation?req.body.designation:null,
              'din_no':req.body.din_no?req.body.din_no:null,
              'date_of_appointment':req.body.date_of_appointment?req.body.date_of_appointment:null,
              'mobile_no':req.body.mobile_no?req.body.mobile_no:null,
              'pan_no':req.body.pan_no?req.body.pan_no:null,
              'aadhaar_no':req.body.aadhaar_no?req.body.aadhaar_no:null,
            }
            await Promise.all(obj.map(async (file) => {
              if(file.fieldname === 'partners_pan_doc')
              {
                document2['partners_pan_doc']=file.path;
              }
              if(file.fieldname === 'partners_aadhaar_no')
              {
                document2['partners_aadhaar_no']=file.path;
              }
            }));
            //console.log(document2)
            CompanyDetails.updateOne({'company_id':company_id},{$addToSet: {partners : document2}},   function (err, comp_det) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Company Partner updated successfully", comp_det: comp_det });
            })
          }
      }
      
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    update_company_preference_settings:async function (req, resp, next) {
      try{
        const v = new Validator(req.body, {
          epfo_rule: 'required|in:default,custom',
          esic_rule: 'required|in:default,custom',
          gratuity_rule: 'required|in:default,custom',
          bonus_rule: 'required|in:default,custom',
          financial_year_end: 'required',
        });
        const matched = await v.check();
        if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
          var company_id=req.authData.company_id;
            var financial_year_end = moment(req.body.financial_year_end).format('YYYY-MM-DD');
            var financial_date = parseFloat(moment(req.body.financial_year_end).format('MM')); 
            
            var monthYear1 = moment(financial_year_end).add(3, 'M');
            var monthYear2 = moment(financial_year_end).add(6, 'M');
            var monthYear3 = moment(financial_year_end).add(9, 'M');
            var monthYear4 = moment(financial_year_end).add(12, 'M');
            var halfYear1 = moment(financial_year_end).add(6, 'M');
            var halfYear2 = moment(financial_year_end).add(12, 'M');

            var quater_1_form_date = (parseFloat(moment(financial_year_end).format('MM'))+1)+'-'+moment(financial_year_end).add(1, 'M').format('YYYY');
            var quater_1_to_date = parseFloat(moment(monthYear1).format('MM'))+'-'+moment(monthYear1).format('YYYY');
            var quater_2_form_date = (parseFloat(moment(monthYear1).format('MM'))+1)+'-'+moment(monthYear1).add(1, 'M').format('YYYY');
            var quater_2_to_date = parseFloat(moment(monthYear2).format('MM'))+'-'+moment(monthYear2).format('YYYY');
            var quater_3_form_date = (parseFloat(moment(monthYear2).format('MM'))+1)+'-'+moment(monthYear2).add(1, 'M').format('YYYY');
            var quater_3_to_date = parseFloat(moment(monthYear3).format('MM'))+'-'+moment(monthYear3).format('YYYY');
            var quater_4_form_date = (parseFloat(moment(monthYear3).format('MM'))+1)+'-'+moment(monthYear3).add(1, 'M').format('YYYY');
            var quater_4_to_date = (parseFloat(moment(monthYear4).format('MM')))+'-'+moment(monthYear4).format('YYYY');
            
            var half_year_1_form_date = (parseFloat(moment(financial_year_end).format('MM'))+1)+'-'+moment(financial_year_end).add(1, 'M').format('YYYY');
            var half_year_1_to_date = parseFloat(moment(halfYear1).format('MM'))+'-'+moment(halfYear1).format('YYYY');
            var half_year_2_form_date = (parseFloat(moment(halfYear1).format('MM'))+1)+'-'+moment(halfYear1).add(1, 'M').format('YYYY');
            var half_year_2_to_date = parseFloat(moment(halfYear2).format('MM'))+'-'+moment(halfYear2).format('YYYY');
            
            var quater = {
              'quaterly': [ 
                {
                    "form_date":quater_1_form_date,
                    "to_date":quater_1_to_date,
                    "quater":1,
                },
                {
                  "form_date":quater_2_form_date,
                  "to_date":quater_2_to_date,
                  "quater":2,
                },
                {
                  "form_date":quater_3_form_date,
                  "to_date":quater_3_to_date,
                  "quater":3,
                },
                {
                  "form_date":quater_4_form_date,
                  "to_date":quater_4_to_date,
                  "quater":4,
                },
              ],
              "half_yearly": [
                {
                    "form_date":half_year_1_form_date,
                    "to_date":half_year_1_to_date,
                    "quater":1,
                },
                {
                    "form_date":half_year_2_form_date,
                    "to_date":half_year_2_to_date,
                    "quater":2,
                },
              ],
              "yearly": [
                {
                    "form_date":half_year_1_form_date,
                    "to_date":half_year_2_to_date,
                    "quater":1,
                },
              ],
            };
            var document ={
              'preference_settings.epfo_rule':req.body.epfo_rule,
              'preference_settings.esic_rule':req.body.esic_rule,
              'preference_settings.gratuity_rule':req.body.gratuity_rule,
              'preference_settings.bonus_rule':req.body.bonus_rule,
              'preference_settings.financial_year_end':req.body.financial_year_end,
              'preference_settings.quater':quater,
            }
            CompanyDetails.updateOne({'company_id':company_id},document,   function (err, preference_settings) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Company Preference setting updated successfully", preference_settings: preference_settings });
            })
         
          // 
        }
      }
      catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
    },
    monthly_credit_usage_cron_job: async function () {
      try{
        var search_option= {$match: {status:"active", suspension:"active"}};
        // if (req.body.row_checked_all === "true") {
        //   if(typeof req.body.unchecked_row_ids == "string"){
        //     var ids = JSON.parse(req.body.unchecked_row_ids);
        //   }
        //   else{
        //     var ids = JSON.parse(JSON.stringify(req.body.unchecked_row_ids));
        //   }
        //   if (ids.length > 0) {
        //     ids = ids.map(function (el) {
        //       return mongoose.Types.ObjectId(el);
        //     });
        //     search_option.$match._id = { $nin: ids };
        //   }
        // } else {
        //   if(typeof req.body.checked_row_ids == "string"){
        //     var ids = JSON.parse(req.body.checked_row_ids);
        //   }
        //   else{
        //     var ids = JSON.parse(JSON.stringify(req.body.checked_row_ids));
        //   }
        //   if (ids.length > 0) {
        //     ids = ids.map(function (el) {
        //       return mongoose.Types.ObjectId(el);
        //     });
        //     search_option.$match._id = { $in: ids };
        //   }
        // }
        var myAggregate = await Company.aggregate([
          {
            $lookup:{
              from: 'plans',
              localField: 'plan_id',
              foreignField: '_id',
              as: 'plan'
            }
          },
          {
            $lookup:{
              from: 'employees',
              localField: 'corporate_id',
              foreignField: 'corporate_id',
              as: 'employees'
            }
          },
          {
            $lookup:{
              from: 'employees',
              "let": { "emp_db_idVar": "$corporate_id"},
              "pipeline": [
              { 
                "$match": { 
                  $and :[
                    {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                    {"approval_status": {"$in": ["active","approved"]}}
                  ] 
                } 
              }
              ],
              as: 'employees',
            }
          },
          {
            $lookup:{
              from: 'staffs',
              "let": { "emp_db_idVar": "$corporate_id"},
              "pipeline": [
              { 
                "$match": { 
                  $and :[
                    {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                    {"status": {"$eq": "active"}}
                  ] 
                } 
              }
              ],
              as: 'staffs',
            }
          },
          {
            $lookup:{
              from: 'salery_templates',
              "let": { "emp_db_idVar": "$corporate_id"},
              "pipeline": [
              { 
                "$match": { 
                  $and :[
                    {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                    {"status": {"$eq": "active"}}
                  ] 
                } 
              }
              ],
              as: 'salery_templates',
            }
          },
          {
            $lookup:{
              from: 'salery_temp_heads',
              "let": { "emp_db_idVar": "$corporate_id"},
              "pipeline": [
              { 
                "$match": { 
                  $and :[
                    {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                    {"status": {"$eq": "active"}}
                  ] 
                } 
              }
              ],
              as: 'salery_temp_heads',
            }
          },
          search_option,
          {
            $addFields: {
              plan: {
                $arrayElemAt: ["$plan", 0],
              },
              total_employee:{
                "$size": "$employees",
              },
              total_staff:{
                "$size": "$staffs",
              },
              total_salery_template:{
                "$size": "$salery_templates",
              },
              total_salery_temp_head:{
                "$size": "$salery_temp_heads",
              },
            }
          },
          { 
            "$project": { 
              "_id":1,
              "corporate_id":1,
              "status":1,
              "credit_stat":1,
              "credit_used":1,
              "plan._id":1,
              "plan.plan_name":1,
              "plan.monthly_rental_date":1,
              "plan.free_emp_no":1,
              "plan.additional_emp_cost":1,
              "plan.free_staff_no":1,
              "plan.additional_staff_cost":1,
              "plan.free_sallary_temp_no":1,
              "plan.additional_sallary_temp_cost":1,
              "plan.free_sallary_head_no":1,
              "plan.additional_sallary_head_cost":1,
              "plan.trigger_suspend_no":1,
              "plan.max_suspend_period":1,
              "plan.package_id":1,
              "plan.valid_from":1,
              "plan.status":1,
              "total_employee":1,
              "total_staff":1,
              "total_salery_template":1,
              "total_salery_temp_head":1,
            }
          },
        ]).then(async (companies) => {
          await Promise.all(companies.map(async function (company) {
            var total_cost = parseFloat(company.plan.monthly_rental_date);
            var total_employee_cost = 0;
            var total_free_employee = 0;
            var total_additional_employee = 0;
            var total_staff_cost = 0;
            var total_free_staff = 0;
            var total_additional_staff = 0;
            var total_salary_temp_cost = 0;
            var total_salary_head_cost = 0;
            var total_additional_salary_temp = 0
            var total_additional_salary_head = 0
            const trigger_suspend_no = company?.plan?.trigger_suspend_no ?? null;
            const max_suspend_period = company?.plan?.max_suspend_period ?? null;
            
            if(company.total_employee > company.plan.free_emp_no){
              var extra_emp = (company.total_employee - company.plan.free_emp_no) * company.plan.additional_emp_cost;
              total_employee_cost = extra_emp;
              total_cost += parseFloat(extra_emp);
              total_free_employee = company.plan.free_emp_no;
              total_additional_employee = (company.total_employee - company.plan.free_emp_no);
            }
            if(company.total_staff > company.plan.free_staff_no){
              var extra_emp = (company.total_staff - company.plan.free_staff_no) * company.plan.additional_staff_cost;
              total_staff_cost = extra_emp;
              total_cost += parseFloat(extra_emp);
              total_free_staff = company.plan.free_staff_no;
              total_additional_staff = (company.total_staff - company.plan.free_staff_no);
            }
            if(company.total_salery_template > company.plan.free_sallary_temp_no){
              var extra_emp = (company.total_salery_template - company.plan.free_sallary_temp_no) * company.plan.additional_sallary_temp_cost;
              total_salary_temp_cost = extra_emp;
              total_cost += parseFloat(extra_emp);
              total_additional_salary_temp = (company.total_salery_template - company.plan.free_sallary_temp_no);
            }
            if(company.total_salery_temp_head > company.plan.free_sallary_head_no){
              var extra_emp = (company.total_salery_temp_head - company.plan.free_sallary_head_no) * company.plan.additional_sallary_head_cost;
              total_salary_head_cost = extra_emp;
              total_cost += parseFloat(extra_emp);
              total_additional_salary_head = (company.total_salery_temp_head - company.plan.free_sallary_head_no);
            }
            var document = {
              corporate_id : company.corporate_id,
              wage_month : new Date().getMonth() + 1,
              wage_year : new Date().getFullYear(),
              company_id : mongoose.Types.ObjectId(company._id),
              plan_id : mongoose.Types.ObjectId(company.plan._id),
              total_monthly_rental_cost : company.plan.monthly_rental_date,
              total_employee_cost : total_employee_cost,
              total_free_employee : total_free_employee,
              total_additional_employee : total_additional_employee,
              total_staff_cost : total_staff_cost,
              total_free_staff : total_free_staff,
              total_additional_staff : total_additional_staff,
              total_salary_temp_cost : total_salary_temp_cost,
              total_additional_salary_temp : total_additional_salary_temp,
              total_salary_head_cost : total_salary_head_cost,
              total_additional_salary_head : total_additional_salary_head,
              total_cost : total_cost,
              status : "active",
              credit_balance : parseFloat(company.credit_stat) - parseFloat(total_cost),
              created_at: Date.now(),
              plan: company.plan,
            };
            var existData = await CompanyMonthlyCreditUsage.findOne({company_id: mongoose.Types.ObjectId(company._id) , wage_month : new Date().getMonth() + 1,wage_year:new Date().getFullYear()});
            if(!existData){
              CompanyMonthlyCreditUsage.create(document);
              var up_document = {
                "credit_stat": document.credit_balance,
                "credit_used": parseFloat(company.credit_used) + total_cost,
              };

              if(document.credit_balance <= 0 && trigger_suspend_no && max_suspend_period){
                const date = moment();
                await lowBalanceCompany.create({
                  'corporate_id': document.corporate_id,
                  'input_suspended_on': date.add(trigger_suspend_no, 'd').format('yyyy/MM/DD'),
                  'acc_suspended_on': date.add(max_suspend_period, 'd').format('yyyy/MM/DD'),
                  'created_at': new Date(),
                }).catch(err => console.error({ status: 'error', message: err ? err.message:'Entry in low Balance company collection is failed.' }));
              }
              
              await Company.updateOne({_id:mongoose.Types.ObjectId(company._id)},{ $set: up_document });
              var comMonCreditData = await CompanyMonthlyCreditUsage.findOne({company_id: mongoose.Types.ObjectId(company._id) , wage_month : new Date().getMonth() + 1,wage_year:new Date().getFullYear()});
              if(comMonCreditData){
                var cr_document = {
                  'corporate_id': company.corporate_id,
                  'wage_month': (new Date().getMonth()+1),
                  'wage_year': new Date().getFullYear(),
                  'company_id': mongoose.Types.ObjectId(company._id),
                  'type': "consumed",
                  'details': comMonCreditData,
                  'status': 'active',
                  'balance': parseFloat(total_cost),
                  'credit_balance': document.credit_balance,
                }

                await CompanyCreditHistoryLogs.create(cr_document);
              }
            }
          })).then((value) => {  
            console.log('Company credit deduct cron job run successfully.')
            // return resp.status(200).send({ status: 'success', messsage: "Cron job run successfully." });
          });
        });
      }
      catch (e) {
        console.error({ status: 'error', message: e ? e.message:'Company credit deduct cron job unsuccessful.' })
        // return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
      }
        },
    low_balance_companies_suspension: async () => {
      try {
        const today = moment().format('yyyy/MM/DD')
        const entities = await lowBalanceCompany.find({ $or: [{ acc_suspended_on: today }, { input_suspended_on: today }] });

        await entities.forEach(async (entity) => {
          if (today == entity.input_suspended_on && today == entity.acc_suspended_on) {
            entity.status = 'account_suspended';
            await entity.save();
            await Company.updateOne({ corporate_id: entity.corporate_id }, { suspension: 'account_suspended' })
          } else if (entity.status == 'active' && today == entity.input_suspended_on) {
            entity.status = 'input_suspended';
            await entity.save();
            await Company.updateOne({ corporate_id: entity.corporate_id }, { suspension: 'input_suspended' })
          } else if (entity.status == 'input_suspended' && today == entity.acc_suspended_on) {
            entity.status = 'account_suspended';
            await entity.save();
            await Company.updateOne({ corporate_id: entity.corporate_id }, { suspension: 'account_suspended' })
          }
        })
        return console.log({ status: "success", message: `account suspension completed, ${entities.length} ${entities.length == 1 ? 'account' : 'accounts'} suspend` })
      } catch (err) {
        console.error(err)
      }
    },
    companyPaymentRequired:async (req,resp) => {
      try {
        const {corporate_id} = req.authData;

        const entity = await Company.findOne({corporate_id, suspension:"account_suspended",credit_stat:{$lte:0}})
        return resp.json({status:"success",message:"",paymentRequired:Boolean(entity)})
      } catch (err) {
        return resp(200).json({status:"error", message:err.message ?? err ?? 'Somthing went wrong!' })
      }
    }
}
