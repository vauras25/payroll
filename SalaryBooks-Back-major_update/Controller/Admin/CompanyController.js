var Company = require('../../Model/Admin/Company');
var CompanyDetails = require('../../Model/Admin/Company_details');
var Package = require('../../Model/Admin/Package');
var User = require('../../Model/Admin/User');
var Plan = require('../../Model/Admin/Plan');
var CompanyCreditHistoryLog = require('../../Model/Admin/CompanyCreditHistoryLog');
var CompanyMonthlyCreditUsage = require('../../Model/Admin/CompanyMonthlyCreditUsage');
const { Validator } = require('node-input-validator');
const  niv = require('node-input-validator');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
var fs = require("fs");
const csv = require("csv-parser");
var xl = require("excel4node");
const {resolve} = require('path');
const absolutePath = resolve('');
const moment = require('moment');
const archiver = require('archiver');
var Site_helper = require("../../Helpers/Site_helper");
const SalTempHead = require('../../Model/Admin/SalaryTempHead');

niv.extend('unique', async ({ value, args }) => {
    // default field is email in this example
    const filed = args[1] || 'userid';
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
    get_package_plans: async function (req, resp, next) {
        try{
            var masters={packages:[],plans:[]};
            await Package.find({  status:'active' },'_id package_name',  function (err, package) {
                if (!err) 
                {
                masters.packages=package;
                }
            })
            await Plan.find({  status:'active' },'_id plan_name',  function (err, plans) {
                if (!err) 
                {
                masters.plans=plans;
                return resp.status(200).send({ status: 'success', message:"", masters: masters});
                }
            })
        }
        catch (e) {
        return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    add_company_data: async function (req, resp, next) {
        const v = new Validator(req.body, {
            corporate_id: 'required|unique:companies,corporate_id',
            establishment_name:'required',
            userid:'required|unique:users,userid',
            email_id:'required|email',
            phone_no:'required',
            plan_id:'required',
            password:'required|length:20,8',
        });
        const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var parent_hods=[];
              //const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
              //var parent_hos =get_parent_hods('staffs','parent_hods',req.body.hod_id);
              await User.findOne({"_id":req.authData.user_id},'parent_hods', async function (err, parent_hod) {
                  if (!err) 
                  {
                    if(parent_hod.parent_hods)
                    {
                      parent_hods=parent_hod.parent_hods;
                      //console.log(parent_hods);
                    }
                    parent_hods.push(req.authData.user_id);
                  //console.log(parent_hods,req.authData)
                const hash_pass = bcrypt.hashSync(req.body.password, saltRounds);
                const plan = await Plan.findById(mongoose.Types.ObjectId(req.body.plan_id));

                var document = {
                    status:"active",
                    suspension:"active",
                    credit_stat:0,
                    credit_used:0,
                    hold_credit:0,
                    corporate_id:req.body.corporate_id,
                    establishment_name:req.body.establishment_name,
                    userid:req.body.userid, 
                    email_id:req.body.email_id, 
                    phone_no:req.body.phone_no, 
                    package_id:req.body.package_id, 
                    reseller_id:req.body.reseller_id, 
                    plan_id:req.body.plan_id, 
                    password:hash_pass,
                    parent_hods:parent_hods,
                    created_at: Date.now(),
                  };
                  if(!plan.max_suspend_period){
                  document.suspension = "account_suspended";
                }else if(!plan.trigger_suspend_no){
                  document.suspension = "input_suspended";
                }
                Company.create(document,  async function (err, company) {
                    if (err) return resp.status(200).send({ status: 'error', message: err.message });
                    var com_document={
                      company_id:company._id,
                      details:{
                        corporate_id:req.body.corporate_id,
                        establishment_name:req.body.establishment_name,
                      },
                      attendence_register:{
                        register_type:'monthly',
                        daily_type:'wholeday',
                      },
                      attendence_register:{
                        register_type:'monthly',
                        daily_type:'wholeday',
                      },
                      reg_office_address:{ 'door_no':'','street_name':'','locality':'','district_name':'','state':'','pin_code':''},
                      communication_office_address:{ 'door_no':'','street_name':'','locality':'','district_name':'','state':'','pin_code':''},
                      epf:{
                        registration_no    : '',
                        group_no    : '',
                        pf_rule_apply:'no',
                        pf_certificate    : '',
                        lin_no    : '',
                        login_id    : '',
                        password    : '',
                        regional_office_address    : '',
                      },
                      esic:{
                              registration_no    : '',
                              regional_pf_office    : '',
                              lin_no    : '',
                              esic_certificate    : '',
                              note_box    : '',
                      },
                      professional_tax:{
                              registration_no_enrolment    : '',
                              registration_no_rgistration    : '',
                              registration_no_enrolment_certificate    : '',
                              registration_no_rgistration_certificate    : '',
                              note_box    : '',
                      },
                      preference_settings:{
                              EPFO_rule    : 'default',
                              ESIC_rule    : 'default',
                              Gratuity_rule    : 'default',
                              financial_year_end    : '',
                      },
                      created_at: Date.now(),
                      status:'active'
                    }

                    SalTempHead.create({
                      corporate_id:req.body.corporate_id,
                      full_name:"Basic",
                      abbreviation:"Basic",
                      head_type:"earning",
                      pre_def_head:"yes",
                      status:'active', 
                      created_at: Date.now()
                    }).catch(err => console.error(err));

                    let currentPath = `storage/company/${req.body.corporate_id}/`;
        
                    if (!fs.existsSync(currentPath)) {
                      fs.mkdirSync(currentPath);
                    };

                    CompanyDetails.create(com_document,  function (com_err, companydet) {
                      if (com_err) return resp.status(200).send({ status: 'error', message: com_err.message });
                      
                        return resp.status(200).send({ status: 'success',message:"Company created successfully", company: company });
                    })
                })
              }
            });
        }
    },
    get_company_list: async function (req, resp, next) {
        try{
          const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
          if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            orderby=  { created_at: 1,establishment_name:1,email_id:1 } 
            if(req.body.orderby == 'desc')
            {
              orderby=  { created_at: -1,establishment_name:-1,email_id:-1 } 
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:     orderby,
            };
            var filter_option={};
            var search_option= {$match: {}};
            orderby= { $sort : { created_at: -1 } } 
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            }
            else
            {
                if(req.body.corporate_id)
                {
                  search_option.$match.corporate_id={"$regex": req.body.corporate_id, "$options": "i"};
                }
                if(req.body.establishment_name)
                {
                  search_option.$match.establishment_name={"$regex": req.body.establishment_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                  search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.phone_no)
                {
                  search_option.$match.phone_no={"$regex": req.body.phone_no, "$options": "i"};
                }
                if(req.body.package_id)
                {
                  search_option.$match.package_id=mongoose.Types.ObjectId(req.body.package_id);
                }
                if(req.body.plan_id)
                {
                  search_option.$match.plan_id=mongoose.Types.ObjectId(req.body.plan_id);
                }
                if(req.body.status)
                {
                  search_option.$match.status=req.body.status;
                }
                if(req.body.reseller_id) {
                    if(req.body.reseller_id.length > 0){
                        if(typeof req.body.reseller_id == "string"){
                            var reseller_ids = JSON.parse(req.body.reseller_id);
                        }
                        else{
                            var reseller_ids = JSON.parse(JSON.stringify(req.body.reseller_id));
                        }
                        if (reseller_ids.length > 0) {
                            reseller_ids = reseller_ids.map(function (el) {
                              return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match.reseller_id = { $in: reseller_ids };
                        }
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
            }            
            //console.log(search_option);
            var myAggregate = Company.aggregate([
              
              search_option,
              
              {$lookup:{
                from: 'plans',
                localField: 'plan_id',
                foreignField: '_id',
                as: 'plan'
                }},
               {$lookup:{
                from: 'resellers',
                localField: 'reseller_id',
                foreignField: '_id',
                as: 'resellers'
                }},
                {$lookup:{
                from: 'company_details',
                localField: '_id',
                foreignField: 'company_id',
                as: 'company_details'
                }},
                {$lookup:{
                from: 'resellers',
                localField: 'resellers.reseller_of',
                foreignField: '_id',
                as: 'sub_seller'
                }},
                {$lookup:{
                from: 'company_monthly_credit_usages',
                localField: '_id',
                foreignField: 'company_id',
                as: 'company_monthly_credit_usages'
                }},
                { $sort: { 'company_monthly_credit_usages._id':-1  } },
               {
                $addFields: {
                  "user_credit": 0,
                  resellers: {
                    $arrayElemAt: ["$resellers", 0],
                  },
                  plan: {
                    $arrayElemAt: ["$plan", 0],
                  },
                  company_details: {
                    $arrayElemAt: ["$company_details", 0],
                  },
                  sub_seller: {
                    $arrayElemAt: ["$sub_seller", 0],
                  },
                  company_monthly_credit_usages: {
                    $arrayElemAt: ["$company_monthly_credit_usages", 0],
                  },
                }
              },
              { "$project": { 
                "_id":1,
                "corporate_id":1,
                "userid":1,
                "suspension":1,
                'credit_stat':1,
                'hold_credit':1,
                "establishment_name":1,
                "package_id":1,
                "plan_id":1,
                "email_id":1,
                "created_at":1,
                "phone_no":1,
                "plan.plan_name":1,
                "status":1,
                "resellers._id":1,
                "resellers.reseller_name":1,
                "resellers.reseller_of":1,
                "sub_seller._id":1,
                "sub_seller.reseller_name":1,
                "sub_seller.reseller_of":1,
                "company_details.company_branch._id":1,
                "company_details.company_branch.branch_name":1,
                "company_details.company_branch.branch_contact_person":1,
                "company_details.company_branch.contact_person_number":1,
                "company_details.company_branch.contact_person_email":1,
                "company_details.reg_office_address":1,
                "company_details.establishment.gst_no":1,
                "company_details.establishment.pan_numberc":1,
                "last_wm_credit_consumption":"$company_monthly_credit_usages.total_cost",
              }
            },
            ]);
            if(req.body.generate == 'excel'){
              myAggregate.then(async (companies) => {
                var field_list_array=["status","reseller","sub_seller","branch","corp_id","establishment_name",
                "address","contact_person","contact_no","state","gst_no","pan_no",
                "client_since","credit_consumption","credit_bal"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, clmn_id++).string("SL");
                if(field_list_array.includes('status'))
                {
                  ws.cell(1, clmn_id++).string("Status");
                }
                if(field_list_array.includes('reseller'))
                {
                  ws.cell(1, clmn_id++).string("Reseller");
                }
                if(field_list_array.includes('sub_seller'))
                {
                  ws.cell(1, clmn_id++).string("Sub Seller");
                }
                if(field_list_array.includes('branch'))
                {
                  ws.cell(1, clmn_id++).string("Branch");
                }
                if(field_list_array.includes('corp_id'))
                {
                  ws.cell(1, clmn_id++).string("Corporate Id");
                }
                if(field_list_array.includes('establishment_name'))
                {
                  ws.cell(1, clmn_id++).string("Establishment Name");
                }
                if(field_list_array.includes('address'))
                {
                  ws.cell(1, clmn_id++).string("Address");
                }
                if(field_list_array.includes('contact_person'))
                {
                  ws.cell(1, clmn_id++).string("Contact Person");
                }
                if(field_list_array.includes('contact_no'))
                {
                  ws.cell(1, clmn_id++).string("Contact No");
                }
                if(field_list_array.includes('state'))
                {
                  ws.cell(1, clmn_id++).string("State");
                }
                if(field_list_array.includes('gst_no'))
                {
                  ws.cell(1, clmn_id++).string("GST No");
                }
                if(field_list_array.includes('pan_no'))
                {
                  ws.cell(1, clmn_id++).string("PAN No");
                }
                if(field_list_array.includes('client_since'))
                {
                  ws.cell(1, clmn_id++).string("Client Since");
                }
                if(field_list_array.includes('credit_consumption'))
                {
                  ws.cell(1, clmn_id++).string("Credit Consumption");
                }
                if(field_list_array.includes('credit_bal'))
                {
                  ws.cell(1, clmn_id++).string("Credit Balance");
                }
                await Promise.all(companies.map(async function (company, index) {
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id=1
                  ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                  if(field_list_array.includes('status'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.status ? String(company.status) : "");
                  }
                  if(field_list_array.includes('reseller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.resellers ? String(company.resellers.reseller_name) : "");
                  }
                  if(field_list_array.includes('sub_seller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.sub_seller ? String(company.sub_seller.reseller_name) : "");
                  }
                  if(field_list_array.includes('branch'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.company_branch ? String(company.company_details.company_branch[0]?.branch_name) : "");
                  }
                  if(field_list_array.includes('corp_id'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.corporate_id ? String(company.corporate_id) : "");
                  }
                  if(field_list_array.includes('establishment_name'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.establishment_name ? String(company.establishment_name) : "");
                  }
                  if(field_list_array.includes('address'))
                  {
                    var address = "";
                    if(company.company_details){
                      if(company.company_details.reg_office_address.door_no){
                        address += company.company_details.reg_office_address.door_no+',';
                      }
                      if(company.company_details.reg_office_address.street_name){
                        address += company.company_details.reg_office_address.street_name+',';
                      }
                      if(company.company_details.reg_office_address.locality){
                        address += company.company_details.reg_office_address.locality+',';
                      }
                      if(company.company_details.reg_office_address.district_name){
                        address += company.company_details.reg_office_address.district_name+',';
                      }
                      if(company.company_details.reg_office_address.state){
                        address += company.company_details.reg_office_address.state+',';
                      }
                      if(company.company_details.reg_office_address.pin_code){
                        address += company.company_details.reg_office_address.pin_code;
                      }
                    }
                    ws.cell(index_val, clmn_emp_id++).string(address);
                  }
                  if(field_list_array.includes('contact_person'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.company_branch[0] ? String(company.company_details.company_branch[0]?.branch_contact_person) : "");
                  }
                  if(field_list_array.includes('contact_no'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.phone_no ? String(company.phone_no) : "");
                  }
                  if(field_list_array.includes('state'))
                  {
                    var state = "";
                    if(company.company_details){
                      if(company.company_details.reg_office_address.street_name){
                        state = company.company_details.reg_office_address.street_name;
                      }
                    }
                    ws.cell(index_val, clmn_emp_id++).string(state);
                  }
                  if(field_list_array.includes('gst_no'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.establishment ? String(company.company_details.establishment?.gst_no) : "");
                  }
                  if(field_list_array.includes('pan_no'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.establishment ? String(company.company_details.establishment?.pan_numberc) : "");
                  }
                  if(field_list_array.includes('client_since'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.created_at ? String(moment(company.created_at).format('DD/MM/YYYY')) : "");
                  }
                  if(field_list_array.includes('credit_consumption'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.last_wm_credit_consumption ? String(company.last_wm_credit_consumption) : "0");
                  }
                  if(field_list_array.includes('credit_bal'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.credit_stat ? String(company.credit_stat) : "0");
                  }
                })).then(async(value) => {
                  const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                  if (!fs.existsSync(corporateIdFolder)) {
                    fs.mkdirSync(corporateIdFolder);
                  }
                  await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/admin-company-list-export.xlsx");
                  let file_name = "admin-company-list-export.xlsx";
                  let file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                  await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                  // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-list-export.xlsx",});
                });
              });
            }
            else{
              Company.aggregatePaginate(myAggregate,options, async function (err, company) {
                if (err) return resp.json({ status: 'error', message: err.message });
                return resp.status(200).json({ status: 'success', company: company });
              })
            }
          }
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_company_details: async function (req, resp){
      const v = new Validator(req.body, {
        company_id: 'required',
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        var search_option= {$match: {"_id": mongoose.Types.ObjectId(req.body.company_id)}};
        
        Company.aggregate([search_option,
          // {$lookup:{
          //   from: 'company_details',
          //   localField: '_id',
          //   foreignField: 'company_id',
          //   as: 'com_det'
          // }},
        
      ],
      async function (err, company) {
        if (err) return resp.json({ status: 'error', message: err.message });
        //console.log(company)
        if(company.length>0)
        {
          return resp.status(200).json({ status: 'success', company: company[0] });
        }
        else
        {
          return resp.status(200).json({ status: 'error', message:'Something went wrong' });
        }
      })
      }
    },
    update_credit_value: async function(req, resp){
      const v = new Validator(req.body, {
        company_id: 'required',
        update_amount: 'required',
        update_type:"required|in:credit,deduct"
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        var company_id=req.body.company_id;
        Company.findOne({'_id':company_id},   function (err, pre_comp_det) {
          if (err) return resp.status(200).send({ status: 'error', message: err.message });
         // console.log(pre_comp_det.credit_stat, pre_comp_det)
          var credit_stat=pre_comp_det.credit_stat;
          if(req.body.update_type === 'credit')
          {
            credit_stat=(parseFloat(req.body.update_amount) + parseFloat(pre_comp_det.credit_stat));
            var action_type = 'award';
          }
          else{
            credit_stat = (parseFloat(pre_comp_det.credit_stat) - parseFloat(req.body.update_amount));
            var action_type = 'deduct';
          }
          var document = {
            'credit_stat':credit_stat,
          }

          if(credit_stat > 0){
            document.suspension = 'active';
          }
          Company.updateOne({'_id':company_id},document,  async function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              var comDetails = await Company.findOne({'_id':company_id});
              if(comDetails){
                var cr_document = {
                  'corporate_id': comDetails.corporate_id,
                  'wage_month': (new Date().getMonth()+1),
                  'wage_year': new Date().getFullYear(),
                  'company_id': mongoose.Types.ObjectId(comDetails._id),
                  'type': action_type,
                  'details': comDetails,
                  'status': 'active',
                  'balance': parseFloat(req.body.update_amount),
                  'credit_balance': comDetails.credit_stat,
                }
                await CompanyCreditHistoryLog.create(cr_document);
              }
              return resp.status(200).send({ status: 'success',message:"Credit awarded successfully", comp_det: comp_det });
          })
        })
      }
    },
    update_suspend_status: async function(req, resp){
      const v = new Validator(req.body, {
        company_id: 'required',
        update_type:"required|in:input_suspended,active"
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        var company_id=req.body.company_id;
          var document = {
            'suspension':req.body.update_type,
          }
          Company.updateOne({'_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Status has been updated successfully", comp_det: comp_det });
          })
      }
    },
    update_company_status: async function(req, resp){
      const v = new Validator(req.body, {
        company_id: 'required',
        update_type:"required|in:active,deactivated"
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        var company_id=req.body.company_id;
          var document = {
            'status':req.body.update_type,
          }
          Company.updateOne({'_id':company_id},document,   function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Status has been updated successfully", comp_det: comp_det });
          })
      }
    },
    update_company_hold_credit: async function(req, resp){
      const v = new Validator(req.body, {
        company_id: 'required',
        update_amount: 'required',
        update_type:"required|in:hold,release"
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        var company_id=req.body.company_id;
        Company.findOne({'_id':company_id},   function (err, pre_comp_det) {
          if (err) return resp.status(200).send({ status: 'error', message: err.message });
         // console.log(pre_comp_det.credit_stat, pre_comp_det)
          var hold_credit=pre_comp_det.hold_credit?pre_comp_det.hold_credit:0;
          var credit_stat=pre_comp_det.credit_stat?pre_comp_det.credit_stat:0;
          if(req.body.update_type === 'hold')
          {
            hold_credit=(parseFloat(req.body.update_amount) + parseFloat(hold_credit));
            credit_stat = (parseFloat(credit_stat) - parseFloat(req.body.update_amount));
            var action_type = 'hold';
          }
          else{
            hold_credit = (parseFloat(hold_credit) - parseFloat(req.body.update_amount));
            credit_stat=(parseFloat(req.body.update_amount) + parseFloat(credit_stat));
            var action_type = 'release';
          }
          var document = {
            'hold_credit':hold_credit,
            'credit_stat':credit_stat,
          }
          Company.updateOne({'_id':company_id},document, async  function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              var comDetails = await Company.findOne({'_id':company_id});
              if(comDetails){
                var cr_document = {
                  'corporate_id': comDetails.corporate_id,
                  'wage_month': (new Date().getMonth()+1),
                  'wage_year': new Date().getFullYear(),
                  'company_id': mongoose.Types.ObjectId(comDetails._id),
                  'type': action_type,
                  'details': comDetails,
                  'status': 'active',
                  'balance': parseFloat(req.body.update_amount),
                  'credit_balance': comDetails.credit_stat,
                }
                await CompanyCreditHistoryLog.create(cr_document);
              }
              return resp.status(200).send({ status: 'success',message:"Hold credit status updated successfully", comp_det: comp_det });
          })
        })
      }
    },
    get_role_list: async function (req, resp, next) {
        const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            const options = {
                page: req.body.pageno,
                limit: 20,
                sort:     { created_at: -1 },
            };
            var filter_option={};
            if(req.body.searchkey)
            {
                filter_option={$or:[{"role_name":{$regex: req.body.searchkey , $options:"i"}},{"role_id_name":{$regex: req.body.searchkey , $options:"i"}}]};
            }
            Role.paginate(filter_option,options,  function (err, role_list) {
                if (err) resp.json({ status: 'error', message: 'no data found' });
                return resp.status(200).json({ status: 'success', role_list: role_list });
            })
        }
    },
    add_role: async function (req, resp) {
        const v = new Validator(req.body, {
            role_name: 'required',
            role_id_name:'required|unique:roles,role_id_name',
            status:'required',
            modules:'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {role_name:req.body.role_name,role_id_name:req.body.role_id_name,role_activity:req.body.role_activity?req.body.role_activity:"NULL", status:req.body.status,modules:JSON.parse(req.body.modules), created_at: Date.now()};
            
            Role.create(document,  function (err, role) {
                if (err) return resp.status(200).send({ status: 'error', message: err.message });
                return resp.status(200).send({ status: 'success',message:"Role created successfully", role: role });
            })
        }
    },
    role_details:function (req, resp) {
        Role.findById(req.body.role_id,  function (err, role) {
            if (err) 
            {
              return resp.status(200).send({ status: 'error', message: err.message });
            }
            else{
              return resp.status(200).send({ status: 'success', role: role });
            }
           
        })
    },
    update_role_data: async function (req, resp) {
        const v = new Validator(req.body, {
            role_name: 'required',
            modules: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {role_name:req.body.role_name,role_activity:req.body.role_activity?req.body.role_activity:"NULL", status:req.body.status,modules:JSON.parse(req.body.modules),updated_at: Date.now()};
            Role.updateOne({'_id':req.body.role_id},document,  function (err, role) {
                if (err) 
                {
                  return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                  return resp.status(200).send({ status: 'success',message:"Role updated successfully", role: role });
                }
            
            })
        }
    },
    update_role_status: async function (req, resp) {
        const v = new Validator(req.body, {
            status: 'required',
          });
          const matched = await v.check();
        if (!matched) {
            return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
        }
        else{
            var document = {status:req.body.status};
            Role.updateOne({'_id':req.body.role_id},document,  function (err, role) {
                if (err) 
                {
                  return resp.status(200).send({ status: 'error', message: err.message });
                }
                else{
                  return resp.status(200).send({ status: 'success',message:"Status updated successfully", role: role });
                }
            
            })
        }
    },
    monthly_credit_usage_cron_job: async function () {
      try{
        var search_option= {$match: {status:"active"}};
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
                await CompanyCreditHistoryLog.create(cr_document);
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
    get_company_credit_usage_list: async function (req, resp, next) {
        try{
          const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
          if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:     sortoption,
            };
            var filter_option={};
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            if(start_month >= 0 && start_year && end_month >= 0 && end_year){
              var use_start_month = '0';
              var use_end_month = '0';
              if(start_month <= 9 && start_month > 0){
                  use_start_month = "0"+start_month;
              }
              else{
                use_start_month = '01';
              }
              if(end_month <= 9 && start_month > 0){
                use_end_month = "0"+end_month;
              }
              else{
                use_end_month = "01";
              }
              var totalDays = moment(use_end_month).daysInMonth();
              var start_date = start_year+'-'+use_start_month+'-01';
              var end_date = end_year+'-'+use_end_month+'-'+totalDays;
            }
            else{
              if(new Date().getMonth() <= 9){
                start_month = "0"+(new Date().getMonth()+1);
              }
              var start_date = new Date().getFullYear()+'-'+start_month+'-01';
              var end_date = new Date().getFullYear()+'-'+start_month+'-'+new Date().getDate();
            }
            var search_option= {$match: {}};
            orderby= { $sort : { created_at: -1 } } 
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            }
            else
            {
                if(req.body.corporate_id)
                {
                  search_option.$match.corporate_id={"$regex": req.body.corporate_id, "$options": "i"};
                }
                if(req.body.establishment_name)
                {
                  search_option.$match.establishment_name={"$regex": req.body.establishment_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                  search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.phone_no)
                {
                  search_option.$match.phone_no={"$regex": req.body.phone_no, "$options": "i"};
                }
                if(req.body.package_id)
                {
                  search_option.$match.package_id=mongoose.Types.ObjectId(req.body.package_id);
                }
                if(req.body.plan_id)
                {
                  search_option.$match.plan_id=mongoose.Types.ObjectId(req.body.plan_id);
                }
                if(req.body.status)
                {
                  search_option.$match.status=req.body.status;
                }
                if(req.body.reseller_id) {
                    if(req.body.reseller_id.length > 0){
                        if(typeof req.body.reseller_id == "string"){
                            var reseller_ids = JSON.parse(req.body.reseller_id);
                        }
                        else{
                            var reseller_ids = JSON.parse(JSON.stringify(req.body.reseller_id));
                        }
                        if (reseller_ids.length > 0) {
                            reseller_ids = reseller_ids.map(function (el) {
                              return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match.reseller_id = { $in: reseller_ids };
                        }
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
            }            
           
            var myAggregate = Company.aggregate([
              
              search_option,
              
              {$lookup:{
                from: 'plans',
                localField: 'plan_id',
                foreignField: '_id',
                as: 'plan'
                }},
               {$lookup:{
                from: 'resellers',
                localField: 'reseller_id',
                foreignField: '_id',
                as: 'resellers'
                }},
                {$lookup:{
                from: 'company_details',
                localField: '_id',
                foreignField: 'company_id',
                as: 'company_details'
                }},
                {$lookup:{
                from: 'resellers',
                localField: 'resellers.reseller_of',
                foreignField: '_id',
                as: 'sub_seller'
                }},
                {
                  $lookup:{
                    from: 'company_monthly_credit_usages',
                    "let": { "emp_db_idVar": "$_id"},
                    "pipeline": [
                    { 
                      "$match": { 
                        $and :[
                        {"$expr": { "$eq": ["$company_id", "$$emp_db_idVar"] }},
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
                    }
                    ],
                    as: 'company_monthly_credit_usages',
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
                          {"status": {"$eq": "active"}},
                          {$or:[ 
                            {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                          },
                          { $or:[ 
                              {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                              { $and:[
                                  {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                                ]
                              } 
                            ]
                          }
                        ] 
                      } 
                    }
                    ],
                    as: 'staffs',
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
                          {"status": {"$eq": "active"}},
                          {$or:[ 
                            {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                          },
                          { $or:[ 
                              {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                              { $and:[
                                  {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                                ]
                              } 
                            ]
                          }
                        ] 
                      } 
                    }
                    ],
                    as: 'employees',
                  }
                },
                {
                  $lookup:{
                    from: 'credit_purchases',
                    "let": { "emp_db_idVar": "$corporate_id"},
                    "pipeline": [
                    { 
                      "$match": { 
                        $and :[
                        {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                        {$or:[ 
                            {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                        },
                        { $or:[ 
                            {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                        }
                        ] 
                      } 
                    }
                    ],
                    as: 'credit_purchases',
                  }
                },
                {
                $addFields: {
                  "user_credit": 0,
                  resellers: {
                    $arrayElemAt: ["$resellers", 0],
                  },
                  plan: {
                    $arrayElemAt: ["$plan", 0],
                  },
                  company_details: {
                    $arrayElemAt: ["$company_details", 0],
                  },
                  sub_seller: {
                    $arrayElemAt: ["$sub_seller", 0],
                  },
                  active_employee:{
                    "$size": "$employees",
                  },
                  staffs:{
                    "$size": "$staffs",
                  },
                  credit_consumed:{
                    "$sum": "$company_monthly_credit_usages.total_cost"
                  },
                }
              },
              { "$project": { 
                "_id":1,
                "corporate_id":1,
                "userid":1,
                "suspension":1,
                "establishment_name":1,
                "package_id":1,
                "plan_id":1,
                "email_id":1,
                "created_at":1,
                "phone_no":1,
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
                "status":1,
                "resellers._id":1,
                "resellers.reseller_name":1,
                "resellers.reseller_of":1,
                "sub_seller._id":1,
                "sub_seller.reseller_name":1,
                "sub_seller.reseller_of":1,
                "company_details.company_branch._id":1,
                "company_details.company_branch.branch_name":1,
                "company_details.company_branch.branch_contact_person":1,
                "company_details.company_branch.contact_person_number":1,
                "company_details.company_branch.contact_person_email":1,
                "company_details.reg_office_address":1,
                "company_details.establishment.gst_no":1,
                "company_details.establishment.pan_numberc":1,
                "sub_admins":1,
                "free_employee":"$plan.free_emp_no",
                "active_employee":"$active_employee",
                "emp_difference": { $subtract: ['$plan.free_emp_no' ,'$active_employee'] },
                "free_sub_admin": "$plan.free_staff_no",
                "active_sub_admin": "$staffs",
                "sub_admin_difference": { $subtract: ['$plan.free_staff_no','$staffs'] },
                "credit_o_b":"0",
                "credit_consumed":1,
                "hold_credit":1,
                "deducted_credit":"$credit_used",
                "available_credit_c_b":"$credit_stat",
                "credit_c_b":"0",
                "credit_purchases":1
              }
            },
            ]);
            if(req.body.generate == 'excel'){
              myAggregate.then(async (companies) => {
                var field_list_array=["reseller","sub_seller","branch","corp_id","establishment_name",
                "address","contact_person","contact_no","plan","free_emp","active_emp","emp_difference",
                "free_sub_admin","active_sub_admin","staff_difference",'credit_o_b',"credit_consumed",
                "hold_credit","deducted_credit","credit_purchesed","available_credit_c_b","credit_c_b"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, clmn_id++).string("SL");
                if(field_list_array.includes('reseller'))
                {
                  ws.cell(1, clmn_id++).string("Reseller");
                }
                if(field_list_array.includes('sub_seller'))
                {
                  ws.cell(1, clmn_id++).string("Sub Seller");
                }
                if(field_list_array.includes('branch'))
                {
                  ws.cell(1, clmn_id++).string("Branch");
                }
                if(field_list_array.includes('corp_id'))
                {
                  ws.cell(1, clmn_id++).string("Corporate Id");
                }
                if(field_list_array.includes('establishment_name'))
                {
                  ws.cell(1, clmn_id++).string("Establishment Name");
                }
                if(field_list_array.includes('address'))
                {
                  ws.cell(1, clmn_id++).string("Address");
                }
                if(field_list_array.includes('contact_person'))
                {
                  ws.cell(1, clmn_id++).string("Contact Person");
                }
                if(field_list_array.includes('contact_no'))
                {
                  ws.cell(1, clmn_id++).string("Contact No");
                }
                if(field_list_array.includes('plan'))
                {
                  ws.cell(1, clmn_id++).string("Plan");
                }
                if(field_list_array.includes('free_emp'))
                {
                  ws.cell(1, clmn_id++).string("Free Employee");
                }
                if(field_list_array.includes('active_emp'))
                {
                  ws.cell(1, clmn_id++).string("Active Employee");
                }
                if(field_list_array.includes('emp_difference'))
                {
                  ws.cell(1, clmn_id++).string("Difference");
                }
                if(field_list_array.includes('free_sub_admin'))
                {
                  ws.cell(1, clmn_id++).string("Free Sub Admin");
                }
                if(field_list_array.includes('active_sub_admin'))
                {
                  ws.cell(1, clmn_id++).string("Active Sub Admin");
                }
                if(field_list_array.includes('staff_difference'))
                {
                  ws.cell(1, clmn_id++).string("Difference");
                }
                if(field_list_array.includes('credit_o_b'))
                {
                  ws.cell(1, clmn_id++).string("Credit O/B");
                }
                if(field_list_array.includes('credit_consumed'))
                {
                  ws.cell(1, clmn_id++).string("Credit Consumed");
                }
                if(field_list_array.includes('hold_credit'))
                {
                  ws.cell(1, clmn_id++).string("Hold Credit");
                }
                if(field_list_array.includes('deducted_credit'))
                {
                  ws.cell(1, clmn_id++).string("Deducted Credit");
                }
                if(field_list_array.includes('credit_purchesed'))
                {
                  ws.cell(1, clmn_id++).string("Credit Purchesed");
                }
                if(field_list_array.includes('available_credit_c_b'))
                {
                  ws.cell(1, clmn_id++).string("Available Credit C/B");
                }
                if(field_list_array.includes('credit_c_b'))
                {
                  ws.cell(1, clmn_id++).string("Credit C/B");
                }
                await Promise.all(companies.map(async function (company, index) {
                  var credit_purchesed = 0;
                  if(company.credit_purchases){
                    if(company.credit_purchases.length > 0){
                      company.credit_purchases.map(function(credit_purchase){
                        credit_purchesed += parseFloat(credit_purchase.credit_amount);
                      })
                      let firstAndLast = company.credit_purchases.filter((value, index, array) => {
                        return index === 0 || index === array.length - 1;
                      });
                      if(firstAndLast.length > 0){
                        if(firstAndLast[0]){
                          company.credit_o_b = firstAndLast[0].credit_qty;
                        }
                      }
                      if(firstAndLast.length > 1){
                        if(firstAndLast[1]){
                          company.credit_c_b = firstAndLast[1].credit_qty;
                        }
                      }
                    }
                  }
                  company.credit_purchesed = credit_purchesed;

                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id=1
                  ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                  if(field_list_array.includes('reseller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.resellers ? String(company.resellers.reseller_name) : "");
                  }
                  if(field_list_array.includes('sub_seller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.sub_seller ? String(company.sub_seller.reseller_name) : "");
                  }
                  if(field_list_array.includes('branch'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.company_branch ? String(company.company_details.company_branch[0]?.branch_name) : "");
                  }
                  if(field_list_array.includes('corp_id'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.corporate_id ? String(company.corporate_id) : "");
                  }
                  if(field_list_array.includes('establishment_name'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.establishment_name ? String(company.establishment_name) : "");
                  }
                  if(field_list_array.includes('address'))
                  {
                    var address = "";
                    if(company.company_details){
                      if(company.company_details.reg_office_address.door_no){
                        address += company.company_details.reg_office_address.door_no+',';
                      }
                      if(company.company_details.reg_office_address.street_name){
                        address += company.company_details.reg_office_address.street_name+',';
                      }
                      if(company.company_details.reg_office_address.locality){
                        address += company.company_details.reg_office_address.locality+',';
                      }
                      if(company.company_details.reg_office_address.district_name){
                        address += company.company_details.reg_office_address.district_name+',';
                      }
                      if(company.company_details.reg_office_address.state){
                        address += company.company_details.reg_office_address.state+',';
                      }
                      if(company.company_details.reg_office_address.pin_code){
                        address += company.company_details.reg_office_address.pin_code;
                      }
                    }
                    ws.cell(index_val, clmn_emp_id++).string(address);
                  }
                  if(field_list_array.includes('contact_person'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.company_branch[0] ? String(company.company_details.company_branch[0]?.branch_contact_person) : "");
                  }
                  if(field_list_array.includes('contact_no'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.phone_no ? String(company.phone_no) : "");
                  }
                  if(field_list_array.includes('plan'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.plan ? String(company.plan?.plan_name) : "");
                  }
                  if(field_list_array.includes('free_emp'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.free_employee ? String(company.free_employee) : "0");
                  }
                  if(field_list_array.includes('active_emp'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.active_employee ? String(company.active_employee) : "0");
                  }
                  if(field_list_array.includes('emp_difference'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.emp_difference ? String(company.emp_difference) : "0");
                  }
                  if(field_list_array.includes('free_sub_admin'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.free_sub_admin ? String(company.free_sub_admin) : "0");
                  }
                  if(field_list_array.includes('active_sub_admin'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.active_sub_admin ? String(company.active_sub_admin) : "0");
                  }
                  if(field_list_array.includes('staff_difference'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.sub_admin_difference ? String(company.sub_admin_difference) : "0");
                  }
                  if(field_list_array.includes('credit_o_b'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.credit_o_b ? String(company.credit_o_b) : "0");
                  }
                  if(field_list_array.includes('credit_consumed'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.credit_consumed ? String(company.credit_consumed) : "0");
                  }
                  if(field_list_array.includes('hold_credit'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.hold_credit ? String(company.hold_credit) : "0");
                  }
                  if(field_list_array.includes('deducted_credit'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.deducted_credit ? String(company.deducted_credit) : "0");
                  }
                  if(field_list_array.includes('credit_purchesed'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.credit_purchesed ? String(company.credit_purchesed) : "0");
                  }
                  if(field_list_array.includes('available_credit_c_b'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.available_credit_c_b ? String(company.available_credit_c_b) : "0");
                  }
                  if(field_list_array.includes('credit_c_b'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.credit_c_b ? String(company.credit_c_b) : "0");
                  }
                })).then(async (value) => {
                    const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                    if (!fs.existsSync(corporateIdFolder)) {
                      fs.mkdirSync(corporateIdFolder);
                    }

                    await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/admin-company-credit-usage-export.xlsx");
                    file_name = "admin-company-credit-usage-export.xlsx";
                    file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                    await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                  // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-credit-usage-export.xlsx",});
                });
              });
            }
            else{
              Company.aggregatePaginate(myAggregate,options, async function (err, company) {
                if (err) return resp.json({ status: 'error', message: err.message });
                if(company.docs){
                  if(company.docs.length > 0){
                    company.docs.map(function(com){
                      var credit_purchesed = 0;
                      if(com.credit_purchases){
                        if(com.credit_purchases.length > 0){
                          com.credit_purchases.map(function(credit_purchase){
                            credit_purchesed += parseFloat(credit_purchase.credit_amount);
                          })
                          let firstAndLast = com.credit_purchases.filter((value, index, array) => {
                            return index === 0 || index === array.length - 1;
                          });
                          if(firstAndLast.length > 0){
                            if(firstAndLast[0]){
                              com.credit_o_b = firstAndLast[0].credit_qty;
                            }
                          }
                          if(firstAndLast.length > 1){
                            if(firstAndLast[1]){
                              com.credit_c_b = firstAndLast[1].credit_qty;
                            }
                          }
                        }
                      }
                      com.credit_purchesed = credit_purchesed;
                    });
                  }
                }
                return resp.status(200).json({ status: 'success', company: company });
              })
            }
          }
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_company_credit_usage_details_list: async function (req, resp, next) {
        try{
          const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
          if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:     sortoption,
            };
            var filter_option={};
            var start_month = parseInt(req.body.wage_month_from);
            var start_year = parseInt(req.body.wage_year_from);
            var end_month = parseInt(req.body.wage_month_to);
            var end_year = parseInt(req.body.wage_year_to);
            
            var search_option= {$match: {}};
            orderby= { $sort : { created_at: -1 } } 
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            }
            else
            {
                if(req.body.corporate_id)
                {
                  search_option.$match.corporate_id={"$eq": req.body.corporate_id};
                }
                if(req.body.establishment_name)
                {
                  search_option.$match.establishment_name={"$regex": req.body.establishment_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                  search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.phone_no)
                {
                  search_option.$match.phone_no={"$regex": req.body.phone_no, "$options": "i"};
                }
                if(req.body.package_id)
                {
                  search_option.$match.package_id=mongoose.Types.ObjectId(req.body.package_id);
                }
                if(req.body.plan_id)
                {
                  search_option.$match.plan_id=mongoose.Types.ObjectId(req.body.plan_id);
                }
                if(req.body.status)
                {
                  search_option.$match.status=req.body.status;
                }
                if(req.body.reseller_id) {
                    if(req.body.reseller_id.length > 0){
                        if(typeof req.body.reseller_id == "string"){
                            var reseller_ids = JSON.parse(req.body.reseller_id);
                        }
                        else{
                            var reseller_ids = JSON.parse(JSON.stringify(req.body.reseller_id));
                        }
                        if (reseller_ids.length > 0) {
                            reseller_ids = reseller_ids.map(function (el) {
                              return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match.reseller_id = { $in: reseller_ids };
                        }
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
                
            } 
            var search_option_details = { 
              $match: {
                "company_credit_history_logs._id" :{ $exists: true, $ne: null },
              }
            };           
            // search_option_details.$match["employee_monthly_reports.bonus_report"] = { $exists: true, $ne: null };
            var myAggregate = Company.aggregate([
              search_option,
              {
                $lookup:{
                  from: 'company_credit_history_logs',
                  "let": { "emp_db_idVar": "$_id"},
                  "pipeline": [
                  { 
                    "$match": { 
                      $and :[
                      {"$expr": { "$eq": ["$company_id", "$$emp_db_idVar"] }},
                      {"type" : {"$in": ["credit","credit_coupon","consumed"]}},
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
                  }
                  ],
                  as: 'company_credit_history_logs',
                }
              },
              search_option_details,
              { "$project": { 
                "_id":1,
                "corporate_id":1,
                "userid":1,
                "suspension":1,
                "establishment_name":1,
                company_credit_history_logs:1
              }
            },
            ]).then(async (companies) => {
              if(req.body.generate == 'excel'){
                var field_list_array=["date","particulars","addition","deduction","balance"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, clmn_id++).string("SL");
                if(field_list_array.includes('date'))
                {
                  ws.cell(1, clmn_id++).string("Date");
                }
                if(field_list_array.includes('particulars'))
                {
                  ws.cell(1, clmn_id++).string("Particulars");
                }
                ws.cell(1, clmn_id++).string("");
                if(field_list_array.includes('addition'))
                {
                  ws.cell(1, clmn_id++).string("Addition");
                }
                if(field_list_array.includes('deduction'))
                {
                  ws.cell(1, clmn_id++).string("Deduction");
                }
                if(field_list_array.includes('balance'))
                {
                  ws.cell(1, clmn_id++).string("Balance");
                }
                var his_loop = 0;
                await Promise.all(companies.map(async function (company, index) {
                  if(company.company_credit_history_logs){
                    company.company_credit_history_logs.map(async function(logs, index_l){
                      var index_val = 2 + his_loop;
                      index_val = index_val;
                      var clmn_emp_id=1
                      ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                      if(field_list_array.includes('date'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(logs.created_at ? String(moment(logs.created_at).format('DD/MM/YYYY')) : "");
                      }
                      if(field_list_array.includes('particulars'))
                      {
                        if(logs.type == 'credit'){
                          ws.cell(index_val, clmn_emp_id++).string(String("Purchase"));
                        }
                        else if(logs.type == 'credit_coupon'){
                          ws.cell(index_val, clmn_emp_id++).string("Promo");
                        }
                        else if(logs.type == 'consumed'){
                          ws.cell(index_val, clmn_emp_id++).string(logs.details ? String(logs.details?.plan?.plan_name) : "");
                        }
                        
                      }
                      if(logs.type == 'credit'){
                        ws.cell(index_val, clmn_emp_id++).string(logs.details ? String(logs.details.inv_id) : "");
                      }
                      else if(logs.type == 'credit_coupon'){
                        ws.cell(index_val, clmn_emp_id++).string(logs.details ? String(logs.details?.coupon_code) : "");
                      }
                      else{
                        ws.cell(index_val, clmn_emp_id++).string(logs.wage_month ? String(logs.wage_month +"-"+ logs.wage_year) : "");
                      }
                      if(field_list_array.includes('addition'))
                      {
                        if(logs.type == 'credit' || logs.type == 'credit_coupon'){
                          ws.cell(index_val, clmn_emp_id++).string(logs.balance ? String(logs.balance) : "");
                        }
                        else{
                          ws.cell(index_val, clmn_emp_id++).string("");
                        }
                      }
                      if(field_list_array.includes('deduction'))
                      {
                        if(logs.type == 'credit' || logs.type == 'credit_coupon'){
                          ws.cell(index_val, clmn_emp_id++).string("");
                        }
                        else{
                          ws.cell(index_val, clmn_emp_id++).string(logs.balance ? String(logs.balance) : "");
                        }
                      }
                      if(field_list_array.includes('balance'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(logs.credit_balance ? String(logs.credit_balance) : "");
                      }
                      his_loop ++;
                    });
                  }
                })).then(async(value) => {
                  // wb.write("admin-company-credit-usage-details-list-export.xlsx");
                  const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                  if (!fs.existsSync(corporateIdFolder)) {
                    fs.mkdirSync(corporateIdFolder);
                  }
                  await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/admin-company-credit-usage-details-list-export.xlsx");
                  file_name = "admin-company-credit-usage-details-list-export.xlsx";
                  file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                  await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                  // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-credit-usage-details-list-export.xlsx",});
                });
              }
              else{
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
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_company_ledgers_list: async function (req, resp, next) {
        try{
          const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
          if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort: sortoption,
            };
            var filter_option={};
            var start_date = req.body.wage_date_from;
            var end_date = req.body.wage_date_to;
            // if(!start_date && !end_date ){
            //   var start_date = new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-01';
            //   var end_date = new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate();
            // }
            var search_option= {$match: {}};
            orderby= { $sort : { created_at: -1 } } 
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            }
            else
            {
                if(req.body.corporate_id)
                {
                  search_option.$match.corporate_id={"$regex": req.body.corporate_id, "$options": "i"};
                }
                if(req.body.establishment_name)
                {
                  search_option.$match.establishment_name={"$regex": req.body.establishment_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                  search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.phone_no)
                {
                  search_option.$match.phone_no={"$regex": req.body.phone_no, "$options": "i"};
                }
                if(req.body.package_id)
                {
                  search_option.$match.package_id=mongoose.Types.ObjectId(req.body.package_id);
                }
                if(req.body.plan_id)
                {
                  search_option.$match.plan_id=mongoose.Types.ObjectId(req.body.plan_id);
                }
                if(req.body.status)
                {
                  search_option.$match.status=req.body.status;
                }
                if(req.body.reseller_id) {
                    if(req.body.reseller_id.length > 0){
                        if(typeof req.body.reseller_id == "string"){
                            var reseller_ids = JSON.parse(req.body.reseller_id);
                        }
                        else{
                            var reseller_ids = JSON.parse(JSON.stringify(req.body.reseller_id));
                        }
                        if (reseller_ids.length > 0) {
                            reseller_ids = reseller_ids.map(function (el) {
                              return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match.reseller_id = { $in: reseller_ids };
                        }
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
            }            
           
            var myAggregate = Company.aggregate([
              search_option,
               {$lookup:{
                from: 'resellers',
                localField: 'reseller_id',
                foreignField: '_id',
                as: 'resellers'
                }},
                {$lookup:{
                from: 'company_details',
                localField: '_id',
                foreignField: 'company_id',
                as: 'company_details'
                }},
                {$lookup:{
                from: 'resellers',
                localField: 'resellers.reseller_of',
                foreignField: '_id',
                as: 'sub_seller'
                }},
                {
                  $lookup:{
                    from: 'credit_purchases',
                    "let": { "emp_db_idVar": "$corporate_id"},
                    "pipeline": [
                    { 
                      "$match": { 
                        $and :[
                        {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                        {$or:[ 
                            {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                        },
                        { $or:[ 
                            {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                        }
                        ] 
                      } 
                    }
                    ],
                    as: 'credit_purchases',
                  }
                },
                {
                $addFields: {
                  "user_credit": 0,
                  resellers: {
                    $arrayElemAt: ["$resellers", 0],
                  },
                  company_details: {
                    $arrayElemAt: ["$company_details", 0],
                  },
                  sub_seller: {
                    $arrayElemAt: ["$sub_seller", 0],
                  },
                  // active_employee:{
                  //   "$size": "$employees",
                  // },
                  // staffs:{
                  //   "$size": "$staffs",
                  // },
                  // credit_consumed:{
                  //   "$sum": "$company_monthly_credit_usages.total_cost"
                  // },
                }
              },
              { "$project": { 
                "_id":1,
                "corporate_id":1,
                "establishment_name":1,
                "status":1,
                "resellers._id":1,
                "resellers.reseller_name":1,
                "resellers.reseller_of":1,
                "sub_seller._id":1,
                "sub_seller.reseller_name":1,
                "sub_seller.reseller_of":1,
                "company_details.company_branch._id":1,
                "company_details.company_branch.branch_name":1,
                "company_details.company_branch.branch_contact_person":1,
                "company_details.company_branch.contact_person_number":1,
                "company_details.company_branch.contact_person_email":1,
                "tds":"0",
                "credit_purchases":1
              }
            },
            ]);
            if(req.body.generate == 'excel'){
              myAggregate.then(async (companies) => {
                var field_list_array=["reseller","sub_seller","branch","corp_id","establishment_name",
                "qty","taxable_value","total_gst","tds","invoice_value","gateway"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, clmn_id++).string("SL");
                if(field_list_array.includes('reseller'))
                {
                  ws.cell(1, clmn_id++).string("Reseller");
                }
                if(field_list_array.includes('sub_seller'))
                {
                  ws.cell(1, clmn_id++).string("Sub Seller");
                }
                if(field_list_array.includes('branch'))
                {
                  ws.cell(1, clmn_id++).string("Branch");
                }
                if(field_list_array.includes('corp_id'))
                {
                  ws.cell(1, clmn_id++).string("Corporate Id");
                }
                if(field_list_array.includes('establishment_name'))
                {
                  ws.cell(1, clmn_id++).string("Establishment Name");
                }
                if(field_list_array.includes('qty'))
                {
                  ws.cell(1, clmn_id++).string("Qty");
                }
                if(field_list_array.includes('taxable_value'))
                {
                  ws.cell(1, clmn_id++).string("Taxable Value");
                }
                if(field_list_array.includes('total_gst'))
                {
                  ws.cell(1, clmn_id++).string("Total GST");
                }
                if(field_list_array.includes('tds'))
                {
                  ws.cell(1, clmn_id++).string("TDS");
                }
                if(field_list_array.includes('invoice_value'))
                {
                  ws.cell(1, clmn_id++).string("Invoice Value");
                }
                if(field_list_array.includes('gateway'))
                {
                  ws.cell(1, clmn_id++).string("Gateway");
                }
                
                await Promise.all(companies.map(async function (company, index) {
                  var credit_purchesed = 0;
                  var credit_qty = 0;
                  var gst_amount = 0;
                  var gateway = 'razorpay';
                  if(company.credit_purchases){
                    if(company.credit_purchases.length > 0){
                      company.credit_purchases.map(function(credit_purchase){
                        credit_purchesed += parseFloat(credit_purchase.credit_amount);
                        credit_qty += parseFloat(credit_purchase.credit_qty);
                        if(credit_purchase.gst_amount){
                          gst_amount += parseFloat(credit_purchase.gst_amount);
                        }
                        gateway = credit_purchase.gateway;
                      })
                    }
                  }
                  company.invoice_value = credit_purchesed;
                  company.qty = credit_qty;
                  company.gst_amount = gst_amount;
                  company.taxable_value = gst_amount;
                  company.gateway = gateway;

                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id=1
                  ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                  if(field_list_array.includes('reseller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.resellers ? String(company.resellers.reseller_name) : "");
                  }
                  if(field_list_array.includes('sub_seller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.sub_seller ? String(company.sub_seller.reseller_name) : "");
                  }
                  if(field_list_array.includes('branch'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.company_branch ? String(company.company_details.company_branch[0]?.branch_name) : "");
                  }
                  if(field_list_array.includes('corp_id'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.corporate_id ? String(company.corporate_id) : "");
                  }
                  if(field_list_array.includes('establishment_name'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.establishment_name ? String(company.establishment_name) : "");
                  }
                  if(field_list_array.includes('qty'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.qty ? String(company.qty) : "");
                  }
                  if(field_list_array.includes('taxable_value'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.taxable_value ? String(company.taxable_value) : "0");
                  }
                  if(field_list_array.includes('total_gst'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.gst_amount ? String(company.gst_amount) : "0");
                  }
                  if(field_list_array.includes('tds'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.tds ? String(company.tds) : "0");
                  }
                  if(field_list_array.includes('invoice_value'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.invoice_value ? String(company.invoice_value) : "0");
                  }
                  if(field_list_array.includes('gateway'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.gateway ? String(company.gateway) : "");
                  }
                  
                  
                })).then(async(value) => {
                  // wb.write("admin-company-ledgers-export.xlsx");
                  const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                  if (!fs.existsSync(corporateIdFolder)) {
                    fs.mkdirSync(corporateIdFolder);
                  }
                  await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/admin-company-ledgers-export.xlsx");
                  file_name = "admin-company-ledgers-export.xlsx";
                  file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                  await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                  // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-ledgers-export.xlsx",});
                });
              });
            }
            else{
              Company.aggregatePaginate(myAggregate,options, async function (err, company) {
                if (err) return resp.json({ status: 'error', message: err.message });
                if(company.docs){
                  if(company.docs.length > 0){
                    company.docs.map(function(com){
                      var credit_purchesed = 0;
                      var credit_qty = 0;
                      var gst_amount = 0;
                      var gateway = 'razorpay';
                      if(com.credit_purchases){
                        if(com.credit_purchases.length > 0){
                          com.credit_purchases.map(function(credit_purchase){
                            credit_purchesed += parseFloat(credit_purchase.credit_amount);
                            credit_qty += parseFloat(credit_purchase.credit_qty);
                            if(credit_purchase.gst_amount){
                              gst_amount += parseFloat(credit_purchase.gst_amount);
                            }
                            gateway = credit_purchase.gateway;
                          })
                        }
                      }
                      com.invoice_value = credit_purchesed;
                      com.qty = credit_qty;
                      com.gst_amount = gst_amount;
                      com.taxable_value = gst_amount;
                      com.gateway = gateway;
                    });
                  }
                }
                return resp.status(200).json({ status: 'success', company: company });
              })
            }
          }
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_company_ledgers_details_list: async function (req, resp, next) {
        try{
          const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
          if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort: sortoption,
            };
            var filter_option={};
            var start_date = req.body.wage_date_from;
            var end_date = req.body.wage_date_to;
            // if(!start_date && !end_date ){
            //   var start_date = new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-01';
            //   var end_date = new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate();
            // }
            var search_option= {$match: {}};
            orderby= { $sort : { created_at: -1 } } 
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            }
            else
            {
                if(req.body.corporate_id)
                {
                  search_option.$match.corporate_id={"$regex": req.body.corporate_id, "$options": "i"};
                }
                if(req.body.establishment_name)
                {
                  search_option.$match.establishment_name={"$regex": req.body.establishment_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                  search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.phone_no)
                {
                  search_option.$match.phone_no={"$regex": req.body.phone_no, "$options": "i"};
                }
                if(req.body.package_id)
                {
                  search_option.$match.package_id=mongoose.Types.ObjectId(req.body.package_id);
                }
                if(req.body.plan_id)
                {
                  search_option.$match.plan_id=mongoose.Types.ObjectId(req.body.plan_id);
                }
                if(req.body.status)
                {
                  search_option.$match.status=req.body.status;
                }
                if(req.body.reseller_id) {
                    if(req.body.reseller_id.length > 0){
                        if(typeof req.body.reseller_id == "string"){
                            var reseller_ids = JSON.parse(req.body.reseller_id);
                        }
                        else{
                            var reseller_ids = JSON.parse(JSON.stringify(req.body.reseller_id));
                        }
                        if (reseller_ids.length > 0) {
                            reseller_ids = reseller_ids.map(function (el) {
                              return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match.reseller_id = { $in: reseller_ids };
                        }
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
                var search_option_details = { 
                  $match: {
                    "credit_purchases._id" :{ $exists: true, $ne: null },
                  }
                }; 
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
                //     search_option_details.$match['credit_purchases._id'] = { $nin: ids };
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
                //     search_option_details.$match['credit_purchases._id'] = { $in: ids };
                //   }
                // }
                // console.log(search_option);
                // console.log(search_option_details);
            }            
            
            var myAggregate = Company.aggregate([
              search_option,
              {
                $lookup:{
                  from: 'credit_purchases',
                  "let": { "emp_db_idVar": "$corporate_id"},
                  "pipeline": [
                  { 
                    "$match": { 
                      $and :[
                      {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                      {$or:[ 
                          {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                          { $and:[
                              {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                            ]
                          } 
                        ]
                      },
                      { $or:[ 
                          {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                          { $and:[
                              {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                            ]
                          } 
                        ]
                      }
                      ] 
                    } 
                  }
                  ],
                  as: 'credit_purchases',
                }
              },
              search_option_details,
              { "$project": { 
                "_id":1,
                "corporate_id":1,
                "establishment_name":1,
                "status":1,
                "created_at":1,
                "credit_purchases":1,
              }
            },
            ]);
            if(req.body.generate == 'excel'){
              myAggregate.then(async (companies) => {
                var field_list_array=["invoice_date","invoice_no","order_id","transaction_id","credit_purchesed",
                "rate","sac_no","description","promo_code","free_credits","taxable_value","tds","igst","cgst","sgst",
                "total_gst","invoice_amount","gateway","amoumt_remitted"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, clmn_id++).string("SL");
                if(field_list_array.includes('invoice_date'))
                {
                  ws.cell(1, clmn_id++).string("Invoice Date");
                }
                if(field_list_array.includes('invoice_no'))
                {
                  ws.cell(1, clmn_id++).string("Invoice No");
                }
                if(field_list_array.includes('order_id'))
                {
                  ws.cell(1, clmn_id++).string("Order Id");
                }
                if(field_list_array.includes('transaction_id'))
                {
                  ws.cell(1, clmn_id++).string("Transaction Id");
                }
                if(field_list_array.includes('credit_purchesed'))
                {
                  ws.cell(1, clmn_id++).string("Credit Purchesed");
                }
                if(field_list_array.includes('rate'))
                {
                  ws.cell(1, clmn_id++).string("Rate");
                }
                if(field_list_array.includes('sac_no'))
                {
                  ws.cell(1, clmn_id++).string("SAC No");
                }
                if(field_list_array.includes('description'))
                {
                  ws.cell(1, clmn_id++).string("Description");
                }
                if(field_list_array.includes('promo_code'))
                {
                  ws.cell(1, clmn_id++).string("Promo Code");
                }
                if(field_list_array.includes('free_credits'))
                {
                  ws.cell(1, clmn_id++).string("Free Credits");
                }
                if(field_list_array.includes('taxable_value'))
                {
                  ws.cell(1, clmn_id++).string("Taxable Value");
                }
                if(field_list_array.includes('tds'))
                {
                  ws.cell(1, clmn_id++).string("TDS");
                }
                if(field_list_array.includes('igst'))
                {
                  ws.cell(1, clmn_id++).string("IGST");
                }
                if(field_list_array.includes('cgst'))
                {
                  ws.cell(1, clmn_id++).string("CGST");
                }
                if(field_list_array.includes('sgst'))
                {
                  ws.cell(1, clmn_id++).string("SGST");
                }
                if(field_list_array.includes('total_gst'))
                {
                  ws.cell(1, clmn_id++).string("Total GST");
                }
                if(field_list_array.includes('invoice_amount'))
                {
                  ws.cell(1, clmn_id++).string("Invoice Amount");
                }
                if(field_list_array.includes('gateway'))
                {
                  ws.cell(1, clmn_id++).string("Gateway");
                }
                if(field_list_array.includes('amoumt_remitted'))
                {
                  ws.cell(1, clmn_id++).string("Amoumt Remitted");
                }
                var array_data = [];
                await Promise.all(companies.map(async function (company, index) {
                  if(company.credit_purchases){
                    if(company.credit_purchases.length > 0){
                      company.credit_purchases.map(function(credit_purchase){
                        array_data.push(credit_purchase);
                      })
                    }
                  }
                })).then(async(value) => {
                  if(array_data.length > 0){
                    array_data.map(function(credit_purchase, index_2){
                      var index_val = 2;
                      index_val = index_val + index_2;
                      var clmn_emp_id=1
                      ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                      if(field_list_array.includes('invoice_date'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.created_at ? String(moment().format('DD/MM/YYYY')) : "");
                      }
                      if(field_list_array.includes('invoice_no'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.inv_id ? String(credit_purchase.inv_id) : "");
                      }
                      if(field_list_array.includes('order_id'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.razorpay_order_id ? String(credit_purchase.razorpay_order_id) : "");
                      }
                      if(field_list_array.includes('transaction_id'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.razorpay_payment_id ? String(credit_purchase.razorpay_payment_id) : "");
                      }
                      if(field_list_array.includes('credit_purchesed'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.credit_qty ? String(credit_purchase.credit_amount) : "");
                      }
                      if(field_list_array.includes('rate'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.credit_amount ? String(parseFloat(credit_purchase.credit_amount) + parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0)) : "");
                      }
                      if(field_list_array.includes('sac_no'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.sac_no ? String(credit_purchase.sac_no) : "");
                      }
                      if(field_list_array.includes('description'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.payment_details ? String(credit_purchase.payment_details?.description) : "");
                      }
                      if(field_list_array.includes('promo_code'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.coupon_code ? String(credit_purchase.coupon_code) : "");
                      }
                      if(field_list_array.includes('free_credits'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.free_credit ? String(credit_purchase.free_credit) : "0");
                      }
                      if(field_list_array.includes('taxable_value'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.gst_amount ? String(credit_purchase.gst_amount) : "0");
                      }
                      if(field_list_array.includes('tds'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.tds ? String(credit_purchase.tds) : "0");
                      }
                      if(field_list_array.includes('igst'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.igst ? String(credit_purchase.igst) : "0");
                      }
                      if(field_list_array.includes('cgst'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.cgst ? String(credit_purchase.cgst) : "0");
                      }
                      if(field_list_array.includes('sgst'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.sgst ? String(credit_purchase.sgst) : "0");
                      }
                      if(field_list_array.includes('total_gst'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.gst_amount ? String(credit_purchase.gst_amount) : "0");
                      }
                      if(field_list_array.includes('invoice_amount'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.credit_qty ? String(parseFloat(credit_purchase.credit_amount) + parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0)) : "");
                      }
                      if(field_list_array.includes('gateway'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.gateway ? String(credit_purchase.gateway) : "");
                      }
                      if(field_list_array.includes('amoumt_remitted'))
                      {
                        ws.cell(index_val, clmn_emp_id++).string(credit_purchase.credit_qty ? String(credit_purchase.credit_qty) : "");
                      }
                    });
                  }
                       

                  // wb.write("admin-company-ledgers-details-export.xlsx");
                  const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                  if (!fs.existsSync(corporateIdFolder)) {
                    fs.mkdirSync(corporateIdFolder);
                  }
                  await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/admin-company-ledgers-details-export.xlsx");
                  file_name = "admin-company-ledgers-details-export.xlsx";
                  file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                  await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                  // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-ledgers-details-export.xlsx",});
                });
              });
            }
            else if(req.body.generate == 'pdf'){
              var file_name_path_array = [];
              var path_link = '';
              myAggregate.then(async (companies) => {
                await Promise.all(companies.map(async function (company, index) {
                  if(company.credit_purchases){
                    await Promise.all(company.credit_purchases.map(function(credit_purchase){
                      if(credit_purchase.file_path){
                          file_name_path_array.push(credit_purchase);
                      }
                    }));
                  }
                }))
              }).then((value) => {
                  var dir = absolutePath+"/storage/company/credit_purchase_invoice/";
                  if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                  }
                  const output = fs.createWriteStream(dir+'purchase-invoice-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip');
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
                  if(file_name_path_array.length > 0){
                    file_name_path_array.map(function(credit_purchase){
                      if(credit_purchase.file_path){
                        const search = '/'; 
                        const replacer = new RegExp(search, 'g');
                        // console.log(absolutePath+credit_purchase.file_path);
                        archive.append(fs.createReadStream(absolutePath+credit_purchase.file_path), { name: credit_purchase.inv_id.replace(replacer, '-')+".pdf" });
                      }
                    });
                  }
                  archive.finalize();
                  path_link = baseurl+'storage/company/credit_purchase_invoice/purchase-invoice-'+new Date().getMonth()+'-'+new Date().getFullYear()+'.zip';
                
                return resp.status(200).json({status: "success", message: 'Purchase Invoice Generated successfully.', url: path_link});
              });
            }
            else{
              // Company.aggregatePaginate(myAggregate,options, async function (err, company) {
              //   if (err) return resp.json({ status: 'error', message: err.message });
              //   if(company.docs){
              //     if(company.docs.length > 0){
              //       company.docs.map(function(company){
              //         if(company.credit_purchases){
              //           if(company.credit_purchases.length > 0){
              //             company.credit_purchases.map(function(credit_purchase){
              //               credit_purchase.sac_no = "";
              //               credit_purchase.tds = 0;
              //               credit_purchase.igst = credit_purchase.igst?credit_purchase.igst:0;
              //               credit_purchase.cgst = credit_purchase.cgst?credit_purchase.cgst:0;
              //               credit_purchase.sgst = credit_purchase.sgst?credit_purchase.sgst:0;
              //             });
              //           }
              //         }
              //       })
              //     }
              //   }
              //   return resp.status(200).json({ status: 'success', company: company });
              // })
              myAggregate.then(async (companies) => {
                if(companies){
                  if(companies.length > 0){
                    companies.map(function(company){
                      if(company.credit_purchases){
                        if(company.credit_purchases.length > 0){
                          company.credit_purchases.map(function(credit_purchase){
                            credit_purchase.sac_no = "";
                            credit_purchase.tds = 0;
                            credit_purchase.igst = credit_purchase.igst?credit_purchase.igst:0;
                            credit_purchase.cgst = credit_purchase.cgst?credit_purchase.cgst:0;
                            credit_purchase.sgst = credit_purchase.sgst?credit_purchase.sgst:0;
                          });
                        }
                      }
                    })
                  }
                }
                return resp.status(200).json({ status: 'success', company: companies });
              });
            }
          }
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    get_company_sales_ledgers_list: async function (req, resp, next) {
        try{
          const v = new Validator(req.body, {
            pageno: 'required',
          });
          const matched = await v.check();
          if (!matched) {
              return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
          }
          else{
            var sortbyfield = req.body.sortbyfield;
            if (sortbyfield) {
                var sortoption = {};
                sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
            } else {
                var sortoption = { created_at: -1 };
            }
            const options = {
              page: req.body.pageno,
              limit: req.body.perpage?req.body.perpage:perpage,
              sort:     sortoption,
            };
            var filter_option={};
            var start_date = req.body.wage_date_from;
            var end_date = req.body.wage_date_to;
            // var start_month = parseInt(req.body.wage_month_from);
            // var start_year = parseInt(req.body.wage_year_from);
            // var end_month = parseInt(req.body.wage_month_to);
            // var end_year = parseInt(req.body.wage_year_to);
            // if(start_month && start_year && end_month && end_year){
            //   var use_start_month = '0';
            //   var use_end_month = '0';
            //   if(start_month <= 9){
            //     use_start_month = "0"+start_month;
            //   }
            //   if(end_month <= 9){
            //     use_end_month = "0"+end_month;
            //   }
            //   var start_date = start_year+'-'+use_start_month+'-01';
            //   var end_date = end_year+'-'+use_end_month+'-31';
            // }
            // else{
            //   if(new Date().getMonth() <= 9){
            //     start_month = "0"+(new Date().getMonth()+1);
            //   }
            //   var start_date = new Date().getFullYear()+'-'+start_month+'-01';
            //   var end_date = new Date().getFullYear()+'-'+start_month+'-'+new Date().getDate();
            // }
            var search_option= {$match: {}};
            var search_option_details= {$match: {} };           
            orderby= { $sort : { created_at: -1 } } 
            if(req.body.searchkey)
            {
              search_option={ $match: { $text: { $search: req.body.searchkey } }};    
            }
            else
            {
                if(req.body.corporate_id)
                {
                  search_option.$match.corporate_id={"$regex": req.body.corporate_id, "$options": "i"};
                }
                if(req.body.establishment_name)
                {
                  search_option.$match.establishment_name={"$regex": req.body.establishment_name, "$options": "i"};
                }
                if(req.body.email_id)
                {
                  search_option.$match.email_id={"$regex": req.body.email_id, "$options": "i"};
                }
                if(req.body.phone_no)
                {
                  search_option.$match.phone_no={"$regex": req.body.phone_no, "$options": "i"};
                }
                if(req.body.package_id)
                {
                  search_option.$match.package_id=mongoose.Types.ObjectId(req.body.package_id);
                }
                if(req.body.plan_id)
                {
                  search_option.$match.plan_id=mongoose.Types.ObjectId(req.body.plan_id);
                }
                if(req.body.status)
                {
                  search_option.$match.status=req.body.status;
                }
                if(req.body.reseller_id) {
                    if(req.body.reseller_id.length > 0){
                        if(typeof req.body.reseller_id == "string"){
                            var reseller_ids = JSON.parse(req.body.reseller_id);
                        }
                        else{
                            var reseller_ids = JSON.parse(JSON.stringify(req.body.reseller_id));
                        }
                        if (reseller_ids.length > 0) {
                            reseller_ids = reseller_ids.map(function (el) {
                              return mongoose.Types.ObjectId(el);
                            });
                            search_option.$match.reseller_id = { $in: reseller_ids };
                        }
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
            }

            search_option_details.$match['credit_purchases._id']=  {$exists: true , $ne: null};
            var myAggregate = Company.aggregate([
              search_option,
               {$lookup:{
                from: 'resellers',
                localField: 'reseller_id',
                foreignField: '_id',
                as: 'resellers'
                }},
                {$lookup:{
                from: 'company_details',
                localField: '_id',
                foreignField: 'company_id',
                as: 'company_details'
                }},
                {$lookup:{
                from: 'resellers',
                localField: 'resellers.reseller_of',
                foreignField: '_id',
                as: 'sub_seller'
                }},
                {
                  $lookup:{
                    from: 'credit_purchases',
                    "let": { "emp_db_idVar": "$corporate_id"},
                    "pipeline": [
                    { 
                      "$match": { 
                        $and :[
                        {"$expr": { "$eq": ["$corporate_id", "$$emp_db_idVar"] }},
                        {$or:[ 
                            {'created_at': {$gt: moment(start_date).startOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$gte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                        },
                        { $or:[ 
                            {'created_at': {$lt: moment(end_date).endOf('day').toDate() }}, 
                            { $and:[
                                {'created_at': {$lte: moment(start_date).startOf('day').toDate() }}
                              ]
                            } 
                          ]
                        }
                        ] 
                      } 
                    }
                    ],
                    as: 'credit_purchases',
                  }
                },
                search_option_details,
                {
                $addFields: {
                  "user_credit": 0,
                  resellers: {
                    $arrayElemAt: ["$resellers", 0],
                  },
                  plan: {
                    $arrayElemAt: ["$plan", 0],
                  },
                  company_details: {
                    $arrayElemAt: ["$company_details", 0],
                  },
                  sub_seller: {
                    $arrayElemAt: ["$sub_seller", 0],
                  },
                }
              },
              { "$project": { 
                "_id":1,
                "resellers._id":1,
                "resellers.reseller_name":1,
                "resellers.reseller_of":1,
                "sub_seller._id":1,
                "sub_seller.reseller_name":1,
                "sub_seller.reseller_of":1,

                "company_details.company_branch._id":1,
                "company_details.company_branch.branch_name":1,
                "company_details.company_branch.branch_contact_person":1,
                "company_details.company_branch.contact_person_number":1,
                "company_details.company_branch.contact_person_email":1,

                "corporate_id":1,
                "establishment_name":1,

                "company_details.reg_office_address":1,
                "company_details.establishment.gst_no":1,
                "company_details.establishment.pan_numberc":1,

                "userid":1,
                "suspension":1,
                "package_id":1,
                "plan_id":1,
                "email_id":1,
                "created_at":1,
                "phone_no":1,
                "status":1,
                "credit_purchases":1,
                "tds":"0"
              }
            },
            ]);
            if(req.body.generate == 'excel'){
              myAggregate.then(async (companies) => {
                var field_list_array=["reseller","sub_seller","branch","corp_id","establishment_name",
                "address","contact_person","contact_no","email","state","gst_no","pan_no","qty","taxable_value","igst","cgst","sgst","total_gst","tds",
                "invoice_value"];
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet("Sheet 1");
                var clmn_id = 1;
                ws.cell(1, clmn_id++).string("SL");
                if(field_list_array.includes('reseller'))
                {
                  ws.cell(1, clmn_id++).string("Reseller");
                }
                if(field_list_array.includes('sub_seller'))
                {
                  ws.cell(1, clmn_id++).string("Sub Seller");
                }
                if(field_list_array.includes('branch'))
                {
                  ws.cell(1, clmn_id++).string("Branch");
                }
                if(field_list_array.includes('corp_id'))
                {
                  ws.cell(1, clmn_id++).string("Corporate Id");
                }
                if(field_list_array.includes('establishment_name'))
                {
                  ws.cell(1, clmn_id++).string("Establishment Name");
                }
                if(field_list_array.includes('address'))
                {
                  ws.cell(1, clmn_id++).string("Address");
                }
                if(field_list_array.includes('contact_person'))
                {
                  ws.cell(1, clmn_id++).string("Contact Person");
                }
                if(field_list_array.includes('contact_no'))
                {
                  ws.cell(1, clmn_id++).string("Contact No");
                }
                if(field_list_array.includes('email'))
                {
                  ws.cell(1, clmn_id++).string("Email");
                }
                if(field_list_array.includes('state'))
                {
                  ws.cell(1, clmn_id++).string("State");
                }
                if(field_list_array.includes('gst_no'))
                {
                  ws.cell(1, clmn_id++).string("GST No");
                }
                if(field_list_array.includes('pan_no'))
                {
                  ws.cell(1, clmn_id++).string("PAN No");
                }
                if(field_list_array.includes('qty'))
                {
                  ws.cell(1, clmn_id++).string("Qty");
                }
                if(field_list_array.includes('taxable_value'))
                {
                  ws.cell(1, clmn_id++).string("Taxable Value");
                }
                if(field_list_array.includes('igst'))
                {
                  ws.cell(1, clmn_id++).string("IGST");
                }
                if(field_list_array.includes('cgst'))
                {
                  ws.cell(1, clmn_id++).string("CGST");
                }
                if(field_list_array.includes('sgst'))
                {
                  ws.cell(1, clmn_id++).string("SGST");
                }
                if(field_list_array.includes('total_gst'))
                {
                  ws.cell(1, clmn_id++).string("Total GST");
                }
                if(field_list_array.includes('tds'))
                {
                  ws.cell(1, clmn_id++).string("TDS");
                }
                if(field_list_array.includes('invoice_value'))
                {
                  ws.cell(1, clmn_id++).string("Invoice Value");
                }
                
                await Promise.all(companies.map(async function (company, index) {
                  if(company.credit_purchases){
                    if(company.credit_purchases.length > 0){
                      var credit_purchesed = 0;
                      var qty = 0;
                      var gst_amount = 0;
                      var igst = 0;
                      var cgst = 0;
                      var sgst = 0;
                      var tds = 0;
                      var inv_value = 0;
                      if(company.credit_purchases){
                        if(company.credit_purchases.length > 0){
                          company.credit_purchases.map(function(credit_purchase){
                            credit_purchesed += parseFloat(credit_purchase.credit_amount);
                            qty += parseFloat(credit_purchase.credit_qty);
                            gst_amount += parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0);
                            inv_value += parseFloat(credit_purchase.credit_amount) + parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0);
                            igst += parseFloat(credit_purchase.igst ? credit_purchase.igst : 0);
                            cgst += parseFloat(credit_purchase.cgst ? credit_purchase.cgst : 0);
                            sgst += parseFloat(credit_purchase.sgst ? credit_purchase.sgst : 0);
                          })
                        }
                      }
                      company.credit_purchesed = credit_purchesed;
                      company.qty = qty;
                      company.taxable_value = gst_amount;                      
                      company.igst = igst;
                      company.cgst = cgst;
                      company.sgst = sgst;
                      company.total_gst = gst_amount;
                      company.tds = tds;
                      company.inv_value = inv_value;
                    }
                  }
                  var index_val = 2;
                  index_val = index_val + index;
                  var clmn_emp_id=1
                  ws.cell(index_val, clmn_emp_id++).number(index_val - 1);
                  if(field_list_array.includes('reseller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.resellers ? String(company.resellers.reseller_name) : "");
                  }
                  if(field_list_array.includes('sub_seller'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.sub_seller ? String(company.sub_seller.reseller_name) : "");
                  }
                  if(field_list_array.includes('branch'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.company_branch ? String(company.company_details.company_branch[0]?.branch_name) : "");
                  }
                  if(field_list_array.includes('corp_id'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.corporate_id ? String(company.corporate_id) : "");
                  }
                  if(field_list_array.includes('establishment_name'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.establishment_name ? String(company.establishment_name) : "");
                  }
                  if(field_list_array.includes('address'))
                  {
                    var address = "";
                    if(company.company_details){
                      if(company.company_details.reg_office_address.door_no){
                        address += company.company_details.reg_office_address.door_no+',';
                      }
                      if(company.company_details.reg_office_address.street_name){
                        address += company.company_details.reg_office_address.street_name+',';
                      }
                      if(company.company_details.reg_office_address.locality){
                        address += company.company_details.reg_office_address.locality+',';
                      }
                      if(company.company_details.reg_office_address.district_name){
                        address += company.company_details.reg_office_address.district_name+',';
                      }
                      if(company.company_details.reg_office_address.state){
                        address += company.company_details.reg_office_address.state+',';
                      }
                      if(company.company_details.reg_office_address.pin_code){
                        address += company.company_details.reg_office_address.pin_code;
                      }
                    }
                    ws.cell(index_val, clmn_emp_id++).string(address);
                  }
                  if(field_list_array.includes('contact_person'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.company_branch[0] ? String(company.company_details.company_branch[0]?.branch_contact_person) : "");
                  }
                  if(field_list_array.includes('contact_no'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.phone_no ? String(company.phone_no) : "");
                  }
                  if(field_list_array.includes('email'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.email_id ? String(company.email_id) : "");
                  }
                  if(field_list_array.includes('state'))
                  {
                    var state = "";
                    if(company.company_details){
                      if(company.company_details.reg_office_address.state){
                        state = company.company_details.reg_office_address.state;
                      }
                    }
                    ws.cell(index_val, clmn_emp_id++).string(state ? String(state) : "");
                  }
                  if(field_list_array.includes('gst_no'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.establishment ? String(company.company_details.establishment?.gst_no) : "");
                  }
                  if(field_list_array.includes('pan_no'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.company_details?.establishment ? String(company.company_details.establishment?.pan_numberc) : "");
                  }
                  if(field_list_array.includes('qty'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.qty ? String(company.qty) : "0");
                  }
                  if(field_list_array.includes('taxable_value'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.taxable_value ? String(company.taxable_value) : "0");
                  }
                  if(field_list_array.includes('igst'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.igst ? String(company.igst) : "0");
                  }
                  if(field_list_array.includes('cgst'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.cgst ? String(company.cgst) : "0");
                  }
                  if(field_list_array.includes('sgst'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.sgst ? String(company.sgst) : "0");
                  }
                  if(field_list_array.includes('total_gst'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.total_gst ? String(company.total_gst) : "0");
                  }
                  if(field_list_array.includes('tds'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.tds ? String(company.tds) : "0");
                  }
                  if(field_list_array.includes('invoice_value'))
                  {
                    ws.cell(index_val, clmn_emp_id++).string(company.inv_value ? String(company.inv_value) : "0");
                  }
                  
                })).then(async(value) => {
                  // wb.write("admin-company-sales-ledgers-export.xlsx");
                  const corporateIdFolder = `storage/admin/temp_files/${req.authData.corporate_id}`;
                  if (!fs.existsSync(corporateIdFolder)) {
                    fs.mkdirSync(corporateIdFolder);
                  }
                  await wb.write("storage/admin/temp_files/"+req.authData.corporate_id+"/admin-company-sales-ledgers-export.xlsx");
                  file_name = "admin-company-sales-ledgers-export.xlsx";
                  file_path = '/storage/admin/temp_files/'+req.authData.corporate_id;
                  await Site_helper.download(file_name,file_path,req.authData.corporate_id,resp);
                  // return resp.status(200).json({status: "success",message: "Xlsx created successfully",url: baseurl +"admin-company-sales-ledgers-export.xlsx",});
                });
              });
            }
            else{
              Company.aggregatePaginate(myAggregate,options, async function (err, company) {
                if (err) return resp.json({ status: 'error', message: err.message });
                if(company.docs){
                  if(company.docs.length > 0){
                    company.docs.map(function(com){
                      var credit_purchesed = 0;
                      var qty = 0;
                      var gst_amount = 0;
                      var igst = 0;
                      var cgst = 0;
                      var sgst = 0;
                      var tds = 0;
                      var inv_value = 0;
                      if(com.credit_purchases){
                        if(com.credit_purchases.length > 0){
                          com.credit_purchases.map(function(credit_purchase){
                            credit_purchesed += parseFloat(credit_purchase.credit_amount);
                            qty += parseFloat(credit_purchase.credit_qty);
                            gst_amount += parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0);
                            inv_value += parseFloat(credit_purchase.credit_amount) + parseFloat(credit_purchase.gst_amount ? credit_purchase.gst_amount : 0);
                            igst += parseFloat(credit_purchase.igst ? credit_purchase.igst : 0);
                            cgst += parseFloat(credit_purchase.cgst ? credit_purchase.cgst : 0);
                            sgst += parseFloat(credit_purchase.sgst ? credit_purchase.sgst : 0);
                          })
                        }
                      }
                      com.credit_purchesed = credit_purchesed;
                      com.qty = qty;
                      com.taxable_value = gst_amount;
                      com.igst = igst;
                      com.cgst = cgst;
                      com.sgst = sgst;
                      com.total_gst = gst_amount;
                      com.tds = tds;
                      com.inv_value = inv_value;
                    });
                  }
                }
                return resp.status(200).json({ status: 'success', company: company });
              })
            }
          }
        }
        catch (e) {
          return resp.status(200).json({ status: 'error', message: e ? e.message:'Something went wrong' });
        }
    },
    change_company_plan: async function(req, resp){
      const v = new Validator(req.body, {
        company_id: 'required',
        plan_id: 'required',
      });
      const matched = await v.check();
      if (!matched) {
          return resp.status(200).send({ status: 'val_err', message:"Validation error", val_msg: v.errors });
      }
      else{
        var company_id=req.body.company_id;
          Company.updateOne({'_id':company_id},{plan_id:req.body.plan_id, updated_at:Date.now()},  async function (err, comp_det) {
              if (err) return resp.status(200).send({ status: 'error', message: err.message });
              return resp.status(200).send({ status: 'success',message:"Credit awarded successfully", comp_det: comp_det });
          })
      }
    },
    
}
