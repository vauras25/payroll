const mongoose = require("mongoose");
var Employee = require("../Model/Company/employee");
var RevisionController = require("../Controller/Company/RevisionController");
var cron = require("node-cron");
const {
  create_monthly_emp_logs,
} = require("../Controller/Company/EmployeeController");
const { monthly_credit_usage_cron_job, low_balance_companies_suspension } = require("../Controller/Company/Company_infoController");
const url_taskMap = {};

// var task2='';
const today = new Date();
const lastDayOfMonth = new Date(
  today.getFullYear(),
  today.getMonth() + 1,
  0
).getDate();
var generate_rivision_task = cron.schedule(
  "2 * * * * *",
  async () => {
    await RevisionController.generate_rivision_data();
  },
  // {
  //   scheduled: false,
  // }
);
var update_emp_revision_data = cron.schedule(
  "2 * * * * *",
  async () => {
    await RevisionController.update_emp_revision_temp_data();
  },
  // {
  //   scheduled: false,
  // }
);

cron.schedule(`55 23 ${lastDayOfMonth} * *`, async () => {
  console.log("Running the monthly tasks...");

  monthly_credit_usage_cron_job();
  create_monthly_emp_logs();
});

cron.schedule('2 0 * * *', () => {
  console.log("Running the daily tasks...");
  low_balance_companies_suspension()
})

//update_emp_revision_data.start();
//generate_rivision_task.start();
module.exports = {
  revision_cron: async function (req, resp) {
    //console.log('function call successfully');
  },
};
