var SalaryTemp = require('../../Model/Admin/SalaryTemp');
var SalaryTempHead = require('../../Model/Admin/SalaryTempHead');
var Epforule = require('../../Model/Admin/Epforule');
var Esicrule = require('../../Model/Admin/Esicrule');
var Ptaxrule = require('../../Model/Admin/Ptaxrule');
const { Validator } = require('node-input-validator');
const mongoose = require('mongoose');
const Site_helper = require('../../Helpers/Site_helper');
module.exports = {
  get_master_data: async function (req, resp, next) {
    try {
      var masters = { salary_temp: [] };
      await SalaryTemp.find({ status: 'active' }, '_id template_name', function (err, salary_temp) {
        if (!err) {
          masters.salary_temp = salary_temp;
          return resp.status(200).send({ status: 'success', message: "", masters: masters });
        }
      })
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  calculate_salary: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        salary_template: 'required',
        amount: 'required',
        state: 'required',
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {
        //var salary_template= SalaryTemp.findOne({"corporate_id":req.authData.corporate_id,"_id": req.body.salary_template});

        //console.log('aaaa',await template_data);
        SalaryTemp.findById({ "corporate_id": req.authData.corporate_id, "_id": req.body.salary_template }, async function (err, salary_template) {
          if (err) return resp.json({ status: 'error', message: err.message });
          var currdate = new Date();
          var epfo_temp = Epforule.findOne({ "corporate_id": req.authData.corporate_id, effective_date: { $lte: currdate } }, '-history', { sort: { effective_date: -1 } });
          var esic_temp = Esicrule.findOne({ "corporate_id": req.authData.corporate_id, effective_date: { $lte: currdate } }, '-history', { sort: { effective_date: -1 } });
          epfo_temp = await epfo_temp;

          let daysInCurrMonth = new Date(currdate.getFullYear(), currdate.getMonth(), 0).getDate();


          let salary_breakup = await Site_helper.get_salary_breakup(
            req,
            salary_template,
            +req.body.amount,
            { emp_address: { state: req.body.state } },
            daysInCurrMonth,
            daysInCurrMonth,
            null,
            null,
            req.authData.corporate_id,
            null
          )

          var pt_temp = Ptaxrule.findOne({ "corporate_id": req.authData.corporate_id, effective_from: { $lte: currdate }, state_name: req.body.state, 'tax_range_amount.amount_from': { $lte: parseFloat(salary_breakup.total_pt_wages) }, 'tax_range_amount.amount_to': { $gte: parseFloat(salary_breakup.total_pt_wages) } }, '-history', { sort: { effective_from: -1 } });

          // var template_heads = SalaryTemp.aggregate([{
          //   "$match": {
          //     "_id": new mongoose.mongo.ObjectId(req.body.salary_template)
          //   }
          // }, {
          //   "$unwind": "$earnings"
          // }, {
          //   "$sort": {
          //     "earnings.priority": 1, "earnings.earning_type": 1
          //   }
          // }, {
          //   "$group": {
          //     "earnings": {
          //       "$push": "$earnings"
          //     },
          //     "_id": 1
          //   }
          // }])
          // //console.log('esic-temp',await esic_temp)
          // //calculate_esic(await esic_temp,req.body.amount)
          // //calculate_pf(await epfo_temp,req.body.amount)
          // var input_salary = req.body.amount;
          // var minimum_wage_amount = salary_template.minimum_wage_amount;
          // var earnings_head = await template_heads;
          // //console.log(await template_heads,earnings_head[0].earnings)
          // var earnings = earnings_head[0].earnings;
          // var retddata = []
          // var basic = 0;
          // var gross_earning = 0;
          // var gross_deduct = 0;
          // var net_take_home = 0;
          // var voluntary_pf_amount = 0;
          // var epf_contri_data = {
          //   emoloyee_contribution: 0,
          //   total_employer_contribution: 0,
          //   emoloyer_pf_contribution: 0,
          //   emoloyer_eps_contribution: 0,
          //   emoloyer_edlis_contribution: 0,
          //   emoloyer_epf_admin_contribution: 0,
          //   emoloyer_edlis_admin_contribution: 0
          // }
          // var pf_total_earnings = 0;
          // var esi_total_earnings = 0;
          // var pt_total_earnings = 0;
          // var esic_contri_data = {
          //   emoloyee_contribution: 0,
          //   emoloyer_contribution: 0,
          // }
          // await Promise.all(earnings.map(async (earning, keyval) => {
          //   var earning2 = 0;
          //   //if(earning.priority === '1')
          //   /* -------------    First head will consider as basic salary ---------*/
          //   if (keyval == '0') {
          //     if (salary_template.advance === "yes") {
          //       var percentage_amount = ((input_salary * salary_template.minimum_wage_percentage) / 100);
          //       if (salary_template.wage_applicable === "higher") {
          //         basic = parseFloat((percentage_amount > minimum_wage_amount ? percentage_amount : minimum_wage_amount));
          //         var rate_type = (percentage_amount > minimum_wage_amount ? 'percent' : 'amount');
          //       }
          //       else {
          //         basic = parseFloat((percentage_amount < minimum_wage_amount ? percentage_amount : minimum_wage_amount));
          //         var rate_type = (percentage_amount < minimum_wage_amount ? 'percent' : 'amount');
          //       }
          //       var rate = (rate_type === 'percent' ? salary_template.minimum_wage_percentage : minimum_wage_amount);
          //     }
          //     else {
          //       /* --------   checking the earning type  --------------*/
          //       if (earning.earning_type === "percent") {
          //         basic = parseFloat(((input_salary * earning.earning_value) / 100));
          //       }
          //       else {
          //         basic = parseFloat(earning.earning_value);
          //       }
          //       var rate_type = earning.earning_type;
          //       var rate = earning.earning_value;
          //     }
          //     /* --------   checking max allowance amount  --------------*/
          //     if (earning.earning_type === "amount") {
          //       basic = (basic > earning.earning_value ? earning.earning_value : basic)
          //     }
          //     else if (earning.earning_type === "percent") {
          //       var head_max_amount = ((input_salary * earning.earning_value) / 100);
          //       basic = (basic > head_max_amount ? head_max_amount : basic)
          //     }
          //     /* --------   check allowance id exceeding the total salary or not  --------------*/
          //     var curr_gross_earning = gross_earning + parseFloat(basic);
          //     if (curr_gross_earning > input_salary) {
          //       basic = (input_salary - gross_earning);
          //     }
          //     gross_earning = gross_earning + parseFloat(basic);
          //     /* --------  check the heads and calculate the deduction and earning   --------------*/
          //     var head_inc = earning.head_include_in;
          //     if (head_inc.indexOf("PF") !== -1) {
          //       pf_total_earnings = pf_total_earnings + parseFloat(basic);
          //       // var pf_return_val=calculate_pf(await epfo_temp,basic,salary_template);
          //       // epf_contri_data.emoloyee_contribution=(epf_contri_data.emoloyee_contribution+pf_return_val.emoloyee_contribution);
          //       // epf_contri_data.emoloyer_pf_contribution=(epf_contri_data.emoloyer_pf_contribution+pf_return_val.emoloyer_pf_contribution);
          //       // epf_contri_data.emoloyer_eps_contribution=(epf_contri_data.emoloyer_eps_contribution+pf_return_val.emoloyer_eps_contribution);
          //       // epf_contri_data.emoloyer_edlis_contribution=(epf_contri_data.emoloyer_edlis_contribution+pf_return_val.emoloyer_edlis_contribution);
          //       // epf_contri_data.emoloyer_epf_admin_contribution=(epf_contri_data.emoloyer_epf_admin_contribution+pf_return_val.emoloyer_epf_admin_contribution);
          //       // epf_contri_data.emoloyer_edlis_admin_contribution=(epf_contri_data.emoloyer_edlis_admin_contribution+pf_return_val.emoloyer_edlis_admin_contribution);
          //       // gross_deduct =gross_deduct + parseFloat(pf_return_val.emoloyee_contribution);
          //     }
          //     if (head_inc.indexOf("ESI") !== -1) {
          //       esi_total_earnings = esi_total_earnings + parseFloat(basic);
          //     }
          //     if (head_inc.indexOf("PT") !== -1) {
          //       pt_total_earnings = pt_total_earnings + parseFloat(basic);
          //     }
          //     /* ------   if earning is greater then 0 then add the earning head  --------------------*/
          //     if (basic > 0) {
          //       retddata.push({ head_id: earning.head_id, head_title: earning.head_full_name, head_rate_type: rate_type, head_rate: rate, amount: roundoff_func(epfo_temp.round_off, basic) })
          //     }
          //   }
          //   else {
          //     if (earning.dependent_head) {

          //       var filterObj = earnings.filter(function (filter_earning) {
          //         //console.log(filter_earning.head_id,'-',earning.dependent_head)
          //         return filter_earning.head_id == earning.dependent_head;
          //       });
          //       var dependant_headvalue = retddata.filter(function (retddata_val) {
          //         return retddata_val.head_id == earning.dependent_head;
          //       });
          //       //console.log('aaaaa',dependant_headvalue,'bbbbb',retddata,'ccccc',filterObj)
          //       //earning2=parseFloat(((basic*earning.percentage_amount)/100));
          //       earning2 = parseFloat(((dependant_headvalue[0].amount * earning.percentage_amount) / 100));
          //       var rate_type = 'percent';
          //       var rate = earning.percentage_amount;
          //     }
          //     else {
          //       /* --------   checking the earning type  --------------*/
          //       if (earning.earning_type === "percent") {
          //         earning2 = parseFloat(((input_salary * earning.earning_value) / 100))
          //       }
          //       else {
          //         earning2 = parseFloat(earning.earning_value)
          //       }
          //       var rate_type = earning.earning_type;
          //       var rate = earning.earning_value;
          //     }
          //     /* --------   checking max allowance amount  --------------*/
          //     if (earning.earning_type === "amount") {
          //       earning2 = (earning2 > earning.earning_value ? earning.earning_value : earning2)
          //     }
          //     else if (earning.earning_type === "percent") {
          //       var head_max_amount = ((input_salary * earning.earning_value) / 100);
          //       earning2 = (earning2 > head_max_amount ? head_max_amount : earning2)
          //     }
          //     /* --------   check allowance id exceeding the total salary or not  --------------*/
          //     var curr_gross_earning = gross_earning + parseFloat(earning2);
          //     if (curr_gross_earning > input_salary) {
          //       earning2 = (input_salary - gross_earning);
          //     }
          //     gross_earning = gross_earning + parseFloat(earning2);
          //     /* --------  check the heads and calculate the deduction and earning   --------------*/
          //     var head_inc = earning.head_include_in;
          //     if (head_inc.indexOf("PF") !== -1) {
          //       pf_total_earnings = pf_total_earnings + parseFloat(earning2);
          //     }
          //     if (head_inc.indexOf("ESI") !== -1) {
          //       esi_total_earnings = esi_total_earnings + parseFloat(earning2);
          //     }
          //     if (head_inc.indexOf("PT") !== -1) {
          //       pt_total_earnings = pt_total_earnings + parseFloat(earning2);
          //     }
          //     /* -------------------   if earning is greater then 0 then add the earning head  --------------------*/
          //     if (earning2 > 0) {
          //       retddata.push({ head_id: earning.head_id, head_title: earning.head_full_name, head_rate_type: rate_type, head_rate: rate, amount: roundoff_func(epfo_temp.round_off, earning2) })
          //     }

          //   }
          // }));

          // var pf_return_val = calculate_pf(await epfo_temp, pf_total_earnings, salary_template);
          // epf_contri_data.emoloyee_contribution = (epf_contri_data.emoloyee_contribution + pf_return_val.emoloyee_contribution);
          // epf_contri_data.total_employer_contribution = (epf_contri_data.total_employer_contribution + pf_return_val.total_employer_contribution);

          // if (salary_template.no_pension === "no") {
          //   epf_contri_data.emoloyer_eps_contribution = (epf_contri_data.emoloyer_eps_contribution + pf_return_val.emoloyer_eps_contribution);
          // }
          // epf_contri_data.emoloyer_pf_contribution = (epf_contri_data.total_employer_contribution - epf_contri_data.emoloyer_eps_contribution);
          // epf_contri_data.emoloyer_edlis_contribution = (epf_contri_data.emoloyer_edlis_contribution + pf_return_val.emoloyer_edlis_contribution);
          // epf_contri_data.emoloyer_epf_admin_contribution = (epf_contri_data.emoloyer_epf_admin_contribution + pf_return_val.emoloyer_epf_admin_contribution);
          // epf_contri_data.emoloyer_edlis_admin_contribution = (epf_contri_data.emoloyer_edlis_admin_contribution + pf_return_val.emoloyer_edlis_admin_contribution);
          // gross_deduct = gross_deduct + parseFloat(pf_return_val.emoloyee_contribution);
          // esic_temp = await esic_temp;
          // if (parseFloat(esic_temp.wage_ceiling) > esi_total_earnings) {
          //   var esic_return_val = calculate_esic(esic_temp, esi_total_earnings);
          //   esic_contri_data.emoloyee_contribution = (esic_contri_data.emoloyee_contribution + esic_return_val.emoloyee_contribution);
          //   esic_contri_data.emoloyer_contribution = (esic_contri_data.emoloyer_contribution + esic_return_val.emoloyer_contribution);
          //   gross_deduct = gross_deduct + parseFloat(esic_return_val.emoloyee_contribution);
          // }
          // var pt_temp = Ptaxrule.findOne({ "corporate_id": req.authData.corporate_id, effective_from: { $lte: currdate }, state_name: req.body.state, 'tax_range_amount.amount_from': { $lte: parseFloat(pt_total_earnings) }, 'tax_range_amount.amount_to': { $gte: parseFloat(pt_total_earnings) } }, '-history', { sort: { effective_from: -1 } });
          // pt_temp = await pt_temp;
          // var p_tax_amount = 0;
          // if (pt_temp) {
          //   var ptax_arr = pt_temp.tax_range_amount;
          //   var tax_amount = await Promise.all(ptax_arr.map(async (ptax_arr_exp) => {
          //     if (ptax_arr_exp.amount_from <= pt_total_earnings && ptax_arr_exp.amount_to >= pt_total_earnings) {
          //       p_tax_amount = ptax_arr_exp.tax_amount;
          //     }
          //   }))
          // }
          // gross_deduct = gross_deduct + parseFloat(p_tax_amount);

          // net_take_home = (gross_earning - gross_deduct);
          // //console.log(gross_earning, gross_deduct,net_take_home)
          // var voluntary_pf = salary_template.voluntary_pf;
          // if (voluntary_pf > 0) {
          //   voluntary_pf_amount = ((net_take_home * voluntary_pf) / 100);
          //   gross_deduct = (gross_deduct + voluntary_pf_amount);
          //   net_take_home = (net_take_home - voluntary_pf_amount);
          // }
          // var total_employeer_pf_contribution = (epf_contri_data.emoloyer_pf_contribution + epf_contri_data.emoloyer_eps_contribution + epf_contri_data.emoloyer_edlis_contribution + epf_contri_data.emoloyer_epf_admin_contribution + epf_contri_data.emoloyer_edlis_admin_contribution);
          // var total_employeer_esic_contribution = esic_contri_data.emoloyer_contribution;
          // var ctc_amount = (gross_earning + total_employeer_pf_contribution + total_employeer_esic_contribution);
          // // var restricted_pf = salary_template.restricted_pf;
          // // var no_pension = salary_template.no_pension;
          // //console.log(basic, salary_template)

          var dataval = {
            heads: salary_breakup.heads,
            epf_data: {
              emoloyee_contribution: salary_breakup.epf_data.emoloyee_contribution,
              total_employer_contribution: salary_breakup.epf_data.total_employer_contribution,
              emoloyer_pf_contribution: salary_breakup.epf_data.emoloyer_pf_contribution,
              emoloyer_eps_contribution: salary_breakup.epf_data.emoloyer_eps_contribution,
              emoloyer_edlis_contribution: salary_breakup.epf_data.emoloyer_edlis_contribution,
              emoloyer_epf_admin_contribution: salary_breakup.epf_data.emoloyer_epf_admin_contribution,
              emoloyer_edlis_admin_contribution: salary_breakup.epf_data.emoloyer_edlis_admin_contribution,
            },
            p_tax_amount: salary_breakup.p_tax_amount,
            esic_data: {
              emoloyee_contribution: salary_breakup.esic_data.emoloyee_contribution,
              emoloyer_contribution: salary_breakup.esic_data.emoloyer_contribution,
            },
            gross_earning: salary_breakup.gross_earning,
            gross_deduct: salary_breakup.gross_deduct,
            net_take_home: salary_breakup.net_take_home,
            voluntary_pf_amount: salary_breakup.voluntary_pf_amount,
            total_employeer_pf_contribution: salary_breakup.total_employeer_pf_contribution,
            total_employeer_esic_contribution: salary_breakup.total_employeer_esic_contribution,
            ctc_amount: salary_breakup.ctc,
          }
          return resp.status(200).json({ status: 'success', data: dataval, salary_template: salary_template, epfo_temp: await epfo_temp, esic_temp: await esic_temp, pt_temp: await pt_temp });
        })
      }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },
  calculate_salary_range: async function (req, resp, next) {
    try {
      const v = new Validator(req.body, {
        salary_template: 'required',
        from_amount: 'required',
        to_amount: 'required',
        amount_span: 'required',
        state: 'required',
      });
      const matched = await v.check();
      if (!matched) {
        return resp.status(200).send({ status: 'val_err', message: "Validation error", val_msg: v.errors });
      }
      else {


        var from_amount = parseFloat(req.body.from_amount);
        var to_amount = parseFloat(req.body.to_amount);
        var amount_span = parseFloat(req.body.amount_span);

        SalaryTemp.findById({ "corporate_id": req.authData.corporate_id, "_id": req.body.salary_template }, async function (err, salary_template) {
          if (err) return resp.json({ status: 'error', message: err.message });
          var currdate = new Date();
          var epfo_temp = Epforule.findOne({ "corporate_id": req.authData.corporate_id, effective_date: { $lte: currdate } }, '-history', { sort: { effective_date: -1 } });
          var esic_temp = Esicrule.findOne({ "corporate_id": req.authData.corporate_id, effective_date: { $lte: currdate } }, '-history', { sort: { effective_date: -1 } });
          var template_heads = SalaryTemp.aggregate([{
            "$match": {
              "_id": new mongoose.mongo.ObjectId(req.body.salary_template)
            }
          }, {
            "$unwind": "$earnings"
          }, {
            "$sort": {
              "earnings.priority": 1, "earnings.earning_type": 1
            }
          }, {
            "$group": {
              "earnings": {
                "$push": "$earnings"
              },
              "_id": 1
            }
          }]);
          var rettabledata = [];
          for (from_amount; from_amount <= to_amount; from_amount = from_amount + amount_span) {
            var input_salary = from_amount;
            //var input_salary = req.body.amount;
            var minimum_wage_amount = salary_template.minimum_wage_amount;
            var earnings_head = await template_heads;
            var earnings = earnings_head[0].earnings;
            //var earnings=salary_template.earnings;
            var retddata = []
            var basic = 0;
            var gross_earning = 0;
            var gross_deduct = 0;
            var net_take_home = 0;
            var voluntary_pf_amount = 0;
            var epf_contri_data = {
              emoloyee_contribution: 0,
              total_employer_contribution: 0,
              emoloyer_pf_contribution: 0,
              emoloyer_eps_contribution: 0,
              emoloyer_edlis_contribution: 0,
              emoloyer_epf_admin_contribution: 0,
              emoloyer_edlis_admin_contribution: 0
            }
            var pf_total_earnings = 0;
            var esi_total_earnings = 0;
            var pt_total_earnings = 0;
            var esic_contri_data = {
              emoloyee_contribution: 0,
              emoloyer_contribution: 0,
            }
            await Promise.all(earnings.map(async (earning, keyval) => {
              var earning2 = 0;
              //if(earning.priority === '1')
              /* -------------    First head will consider as basic salary ---------*/
              if (keyval == '0') {
                if (salary_template.advance === "yes") {
                  var percentage_amount = ((input_salary * salary_template.minimum_wage_percentage) / 100);
                  if (salary_template.wage_applicable === "higher") {
                    basic = parseFloat((percentage_amount > minimum_wage_amount ? percentage_amount : minimum_wage_amount));
                    var rate_type = (percentage_amount > minimum_wage_amount ? 'percent' : 'amount');
                  }
                  else {
                    basic = parseFloat((percentage_amount < minimum_wage_amount ? percentage_amount : minimum_wage_amount));
                    var rate_type = (percentage_amount < minimum_wage_amount ? 'percent' : 'amount');
                  }
                  var rate = (rate_type === 'percent' ? salary_template.minimum_wage_percentage : minimum_wage_amount);
                }
                else {
                  /* --------   checking the earning type  --------------*/
                  if (earning.earning_type === "percent") {
                    basic = parseFloat(((input_salary * earning.earning_value) / 100));
                  }
                  else {
                    basic = parseFloat(earning.earning_value);
                  }
                  var rate_type = earning.earning_type;
                  var rate = earning.earning_value;
                }
                /* --------   checking max allowance amount  --------------*/
                if (earning.earning_type === "amount") {
                  basic = (basic > earning.earning_value ? earning.earning_value : basic)
                }
                else if (earning.earning_type === "percent") {
                  var head_max_amount = ((input_salary * earning.earning_value) / 100);
                  basic = (basic > head_max_amount ? head_max_amount : basic)
                }
                /* --------   check allowance id exceeding the total salary or not  --------------*/
                var curr_gross_earning = gross_earning + parseFloat(basic);
                if (curr_gross_earning > input_salary) {
                  basic = (input_salary - gross_earning);
                }
                gross_earning = gross_earning + parseFloat(basic);
                /* --------  check the heads and calculate the deduction and earning   --------------*/
                var head_inc = earning.head_include_in;
                if (head_inc.indexOf("PF") !== -1) {
                  pf_total_earnings = pf_total_earnings + parseFloat(basic);
                }
                if (head_inc.indexOf("ESI") !== -1) {
                  esi_total_earnings = esi_total_earnings + parseFloat(basic);
                }
                if (head_inc.indexOf("PT") !== -1) {
                  pt_total_earnings = pt_total_earnings + parseFloat(basic);
                }
                /* ------   if earning is greater then 0 then add the earning head  --------------------*/
                if (basic > 0) {
                  retddata.push({ head_id: earning.head_id, head_title: earning.head_full_name, head_rate_type: rate_type, head_rate: rate, amount: basic })
                }
              }
              else {
                if (earning.dependent_head) {

                  var filterObj = earnings.filter(function (filter_earning) {
                    return filter_earning.head_id == earning.dependent_head;
                  });
                  var dependant_headvalue = retddata.filter(function (retddata_val) {
                    return retddata_val.head_id == earning.dependent_head;
                  });
                  //console.log('aaaaaaaaaa',dependant_headvalue,retddata,filterObj)
                  //earning2=parseFloat(((basic*earning.percentage_amount)/100));
                  earning2 = parseFloat(((dependant_headvalue[0].amount * earning.percentage_amount) / 100));
                  var rate_type = 'percent';
                  var rate = earning.percentage_amount;
                }
                else {
                  //console.log('bbbbbbbb')
                  /* --------   checking the earning type  --------------*/
                  if (earning.earning_type === "percent") {
                    earning2 = parseFloat(((input_salary * earning.earning_value) / 100))
                  }
                  else {
                    earning2 = parseFloat(earning.earning_value)
                  }
                  var rate_type = earning.earning_type;
                  var rate = earning.earning_value;
                }
                /* --------   checking max allowance amount  --------------*/
                if (earning.earning_type === "amount") {
                  earning2 = (earning2 > earning.earning_value ? earning.earning_value : earning2)
                }
                else if (earning.earning_type === "percent") {
                  var head_max_amount = ((input_salary * earning.earning_value) / 100);
                  earning2 = (earning2 > head_max_amount ? head_max_amount : earning2)
                }
                /* --------   check allowance id exceeding the total salary or not  --------------*/
                var curr_gross_earning = gross_earning + parseFloat(earning2);
                if (curr_gross_earning > input_salary) {
                  earning2 = (input_salary - gross_earning);
                }
                gross_earning = gross_earning + parseFloat(earning2);
                /* --------  check the heads and calculate the deduction and earning   --------------*/
                var head_inc = earning.head_include_in;
                if (head_inc.indexOf("PF") !== -1) {
                  pf_total_earnings = pf_total_earnings + parseFloat(earning2);
                }
                if (head_inc.indexOf("ESI") !== -1) {
                  esi_total_earnings = esi_total_earnings + parseFloat(earning2);
                }
                if (head_inc.indexOf("PT") !== -1) {
                  pt_total_earnings = pt_total_earnings + parseFloat(earning2);
                }
                /* -------------------   if earning is greater then 0 then add the earning head  --------------------*/
                if (earning2 > 0) {
                  retddata.push({ head_id: earning.head_id, head_title: earning.head_full_name, head_rate_type: rate_type, head_rate: rate, amount: earning2 })
                }

              }
            }));

            var pf_return_val = calculate_pf(await epfo_temp, pf_total_earnings, salary_template);

            // console.log(pf_return_val, "pf return val")
            epf_contri_data.emoloyee_contribution = (epf_contri_data.emoloyee_contribution + pf_return_val.emoloyee_contribution);
            epf_contri_data.total_employer_contribution = (epf_contri_data.total_employer_contribution + pf_return_val.total_employer_contribution);

            if (salary_template.no_pension === "no") {
              epf_contri_data.emoloyer_eps_contribution = (epf_contri_data.emoloyer_eps_contribution + pf_return_val.emoloyer_eps_contribution);
            }
            epf_contri_data.emoloyer_pf_contribution = (epf_contri_data.total_employer_contribution - epf_contri_data.emoloyer_eps_contribution);
            epf_contri_data.emoloyer_edlis_contribution = (epf_contri_data.emoloyer_edlis_contribution + pf_return_val.emoloyer_edlis_contribution);
            epf_contri_data.emoloyer_epf_admin_contribution = (epf_contri_data.emoloyer_epf_admin_contribution + pf_return_val.emoloyer_epf_admin_contribution);
            epf_contri_data.emoloyer_edlis_admin_contribution = (epf_contri_data.emoloyer_edlis_admin_contribution + pf_return_val.emoloyer_edlis_admin_contribution);
            gross_deduct = gross_deduct + parseFloat(pf_return_val.emoloyee_contribution);
            // console.log(gross_deduct, "gross deduct")

            esic_temp = await esic_temp;
            if (parseFloat(esic_temp.wage_ceiling) > esi_total_earnings) {
              var esic_return_val = calculate_esic(esic_temp, esi_total_earnings);
              esic_contri_data.emoloyee_contribution = (esic_contri_data.emoloyee_contribution + esic_return_val.emoloyee_contribution);
              esic_contri_data.emoloyer_contribution = (esic_contri_data.emoloyer_contribution + esic_return_val.emoloyer_contribution);
              gross_deduct = gross_deduct + parseFloat(esic_return_val.emoloyee_contribution);
            }
            var pt_temp = Ptaxrule.findOne(
              {
                "corporate_id": req.authData.corporate_id,
                effective_from: { $lte: currdate },
                state_name: req.body.state,
                // 'tax_range_amount.amount_from': { $lte: parseFloat(pt_total_earnings) },
                // 'tax_range_amount.amount_to': { $gte: parseFloat(pt_total_earnings) }
              },
              '-history',
              {
                sort: { effective_from: -1 }
              });


            pt_temp = await pt_temp;
            // console.log(pt_temp)
            var p_tax_amount = 0;
            if (pt_temp) {
              if (pt_temp.settlement_frequency === 'monthly') {
                const wageMonthIndex = new Date().getMonth();

                // Find the relevant period based on month index
                const relevantPeriod = pt_temp.periods.find((period) => {
                  return wageMonthIndex >= parseInt(period.from_month) && wageMonthIndex <= parseInt(period.to_month);
                });
                // console.log(relevantPeriod, "relevant period")
                if (relevantPeriod) {
                  // Access tax_range_amount array within the relevant period
                  const ptax_arr_rate = relevantPeriod.tax_range_amount ?? [];
                  ptax_arr_rate.forEach((ptax_arr_exp_rate) => {
                    if (ptax_arr_exp_rate.last_slab === 'yes') {
                      if (ptax_arr_exp_rate.amount_from <= pt_total_earnings) {
                        p_tax_amount = ptax_arr_exp_rate.tax_amount;
                      }
                    } else if (ptax_arr_exp_rate.last_slab === 'no') {
                      if (
                        ptax_arr_exp_rate.amount_from <= pt_total_earnings &&
                        ptax_arr_exp_rate.amount_to >= pt_total_earnings
                      ) {
                        p_tax_amount = ptax_arr_exp_rate.tax_amount;
                      }
                    }
                  });
                }

              } else {
                var ptax_arr = pt_temp.tax_range_amount;
                var tax_amount = await Promise.all(ptax_arr.map(async (ptax_arr_exp) => {
                  if (ptax_arr_exp.last_slab == 'yes') {
                    if (ptax_arr_exp.amount_from <= pt_total_earnings) {
                      p_tax_amount = ptax_arr_exp.tax_amount;
                    }
                  } else if (ptax_arr_exp.last_slab == 'no') {
                    if (ptax_arr_exp.amount_from <= pt_total_earnings && ptax_arr_exp.amount_to >= pt_total_earnings) {
                      p_tax_amount = ptax_arr_exp.tax_amount;
                    }
                  }
                }))
              }
            }
            gross_deduct = gross_deduct + parseFloat(p_tax_amount);
            console.log(gross_deduct, "gross_Deduct", p_tax_amount, "ptax amount")


            net_take_home = (gross_earning - gross_deduct);
            // console.log(gross_earning, gross_deduct, net_take_home)

            var voluntary_pf = salary_template.voluntary_pf;
            if (voluntary_pf > 0) {
              voluntary_pf_amount = ((pf_total_earnings * voluntary_pf) / 100);
              gross_deduct = (gross_deduct + voluntary_pf_amount);
              net_take_home = (net_take_home - voluntary_pf_amount);
              // console.log(net_take_home, "net take home under v_pf")
            }
            var total_employeer_pf_contribution = (epf_contri_data.emoloyer_pf_contribution + epf_contri_data.emoloyer_eps_contribution + epf_contri_data.emoloyer_edlis_contribution + epf_contri_data.emoloyer_epf_admin_contribution + epf_contri_data.emoloyer_edlis_admin_contribution);
            var total_employeer_esic_contribution = esic_contri_data.emoloyer_contribution;
            var ctc_amount = (gross_earning + total_employeer_pf_contribution + total_employeer_esic_contribution);
            epfo_temp = await epfo_temp;
            rettabledata.push({ net_take_home: roundoff_func(epfo_temp.round_off, net_take_home), gross_deduct: roundoff_func(epfo_temp.round_off, gross_deduct), gross_earning: roundoff_func(epfo_temp.round_off, gross_earning), ctc_amount: roundoff_func(epfo_temp.round_off, ctc_amount) })
            //console.log(rettabledata)
          }
          return resp.status(200).json({ status: 'success', data: rettabledata });
        })
      }
    }
    catch (e) {
      return resp.status(200).json({ status: "error", message: e ? e.message : 'Something went wrong' });
    }
  },

}

function roundoff_func(round_rule, org_value) {
  switch (round_rule) {
    case 'up':
      org_value = Math.ceil(org_value);
      break
    case 'off':
      org_value = Math.round(org_value);
      break
    case 'down':
      org_value = Math.floor(org_value);
  }
  return org_value;
}
function calculate_pf(epfo_temp, baseamount, salary_template) {

  var emoloyee_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount) * parseFloat(epfo_temp.pf_employee_contribution)) / 100);
  var total_employer_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount) * parseFloat(epfo_temp.total_employer_contribution)) / 100);
  var emoloyer_pf_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount) * parseFloat(epfo_temp.pf_employer_contribution)) / 100);
  var emoloyer_eps_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.pension_employer_contribution_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.pension_employer_contribution)) / 100);
  var emoloyer_edlis_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.edli_employer_contribution_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.edli_employer_contribution)) / 100);
  var emoloyer_epf_admin_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.admin_charges_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.admin_charges)) / 100);
  var emoloyer_edlis_admin_contribution = (((salary_template.restricted_pf === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : (epfo_temp.edli_admin_charges_restrict === "yes" ? (baseamount < parseFloat(epfo_temp.wage_ceiling) ? baseamount : parseFloat(epfo_temp.wage_ceiling)) : baseamount)) * parseFloat(epfo_temp.edli_admin_charges)) / 100);
  // var emoloyer_eps_contribution = (((epfo_temp.pension_employer_contribution_restrict === "yes"?(baseamount < parseFloat(epfo_temp.wage_ceiling)? baseamount: parseFloat(epfo_temp.wage_ceiling)):baseamount)* parseFloat(epfo_temp.pension_employer_contribution))/100)  ;
  // var emoloyer_edlis_contribution = (((epfo_temp.edli_employer_contribution_restrict === "yes"?(baseamount < parseFloat(epfo_temp.wage_ceiling)? baseamount: parseFloat(epfo_temp.wage_ceiling)):baseamount)* parseFloat(epfo_temp.edli_employer_contribution))/100);
  // var emoloyer_epf_admin_contribution = (((epfo_temp.admin_charges_restrict === "yes"?(baseamount < parseFloat(epfo_temp.wage_ceiling)? baseamount: parseFloat(epfo_temp.wage_ceiling)):baseamount)* parseFloat(epfo_temp.admin_charges))/100);
  // var emoloyer_edlis_admin_contribution = (((epfo_temp.edli_admin_charges_restrict === "yes"?(baseamount < parseFloat(epfo_temp.wage_ceiling)? baseamount: parseFloat(epfo_temp.wage_ceiling)):baseamount)* parseFloat(epfo_temp.edli_admin_charges))/100);
  var retdata = {
    emoloyee_contribution: emoloyee_contribution,
    total_employer_contribution: total_employer_contribution,
    emoloyer_pf_contribution: emoloyer_pf_contribution,
    emoloyer_eps_contribution: emoloyer_eps_contribution,
    emoloyer_edlis_contribution: emoloyer_edlis_contribution,
    emoloyer_epf_admin_contribution: emoloyer_epf_admin_contribution,
    emoloyer_edlis_admin_contribution: emoloyer_edlis_admin_contribution
  }
  return retdata;
  //console.log(baseamount,epfo_temp,emoloyee_contribution,emoloyer_pf_contribution,emoloyee_eps_contribution,emoloyee_edlis_contribution,emoloyee_epf_admin_contribution,emoloyee_edlis_admin_contribution)
}
function calculate_esic(esic_temp, baseamount) {
  var emoloyee_contribution = ((baseamount * parseFloat(esic_temp.employee_contribution)) / 100);
  var emoloyer_contribution = ((baseamount * parseFloat(esic_temp.employer_contribution)) / 100);
  var retdata = {
    emoloyee_contribution: emoloyee_contribution,
    emoloyer_contribution: emoloyer_contribution
  }
  return retdata;
}

