export const _salarySheetTempMaster: any[] = [
  {
      main_title: "User Details",
      main_slug: "userdetails",
      // bg_color: "rgb(131 0 0 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Personal Details",
              module_slug: "personal_details",
              fields: [
                  { slug: "sl_no", title: "SL. No.", abbreviation: "", mapping: "" },
                  { slug: "emp_first_name", title: "First Name", abbreviation: "", mapping: "emp_data.emp_first_name" },
                  { slug: "emp_last_name", title: "Last Name", abbreviation: "", mapping: "emp_data.emp_last_name" },
                  { slug: "emp_id", title: "EMP ID", abbreviation: "", mapping: "emp_data.emp_id" },
              ],
          },
          {
              module_title: "Other Details",
              module_slug: "other_details",
              fields: [
                  { slug: "uan_no", title: "UAN No", abbreviation: "", mapping: "emp_data.emp_uan_no" },
                  { slug: "pf_no", title: "PF No", abbreviation: "", mapping: "emp_data.new_pf_no" },
                  { slug: "esic_no", title: "ESIC No", abbreviation: "", mapping: "emp_data.esic_no" },
                  { slug: "doj", title: "DOJ", abbreviation: "", mapping: "emp_data.date_of_join" },
                  { slug: "age", title: "Age", abbreviation: "", mapping: "emp_data.age" },
                  { slug: "sex", title: "Sex", abbreviation: "", mapping: "emp_data.sex" },
                  { slug: "hod", title: "HOD", abbreviation: "", mapping: "emp_data.hod" },
                  // { slug: "branch", title: "Branch", abbreviation: "", mapping: "" },
                  // { slug: "department", title: "Department", abbreviation: "", mapping: "" },
                  // { slug: "designation", title: "Designation", abbreviation: "", mapping: "" },
                  // { slug: "client", title: "Client", abbreviation: "", mapping: "" },
                  { slug: "epf", title: "EPF", abbreviation: "", mapping: "emp_data.EPF" },
                  { slug: "eps", title: "EPS", abbreviation: "", mapping: "emp_data.EPS" },
                  { slug: "restricted_pf", title: "Restrict PF", abbreviation: "", mapping: "emp_data.Restrict_PF" },
                  { slug: "esic", title: "ESIC", abbreviation: "", mapping: "emp_data.ESIC" },
                  { slug: "reg_type", title: "Reg Type", abbreviation: "", mapping: "emp_data.Reg_Type" },
              ],
          },
      ]
  },
  {
      main_title: "Master",
      main_slug: "master",
      // bg_color: "rgba(116, 131, 0, 0.47)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Dynamic Salary Heads",
              module_slug: "master_breakup",
              fields: [
                  { slug: "master-dynamic-heads", title: "Dynamic Heads", abbreviation: "", mapping: "" },
              ],
          },
          {
              module_title: "Master Total Wages",
              module_slug: "master_wagesbucket",
              fields: [
                  { slug: "total_pf_wages_rate", title: "PF Bucket", abbreviation: "", mapping: "total_pf_wages_rate" },
                  { slug: "restricted_pf_wages_rate", title: "PF WAGES", abbreviation: "", mapping: "restricted_pf_wages_rate" },
                  { slug: "edlis_wages_rate", title: "EDLI WAGES", abbreviation: "", mapping: "edlis_wages_rate" },
                  { slug: "eps_wages_rate", title: "EPS WAGES", abbreviation: "", mapping: "eps_wages_rate" },
                  { slug: "total_esi_wages_bucket_rate", title: "ESI Bucket", abbreviation: "", mapping: "total_esi_wages_bucket_rate" },
                  { slug: "total_esi_wages_rate", title: "ESI WAGES", abbreviation: "", mapping: "total_esi_wages_rate" },
                  { slug: "total_pt_wages_rate", title: "PT WAGES", abbreviation: "", mapping: "total_pt_wages_rate" },
                  { slug: "total_tds_wages_rate", title: "TDS WAGES", abbreviation: "", mapping: "total_tds_wages_rate" },
                  { slug: "total_ot_wages_rate", title: "OT WAGES", abbreviation: "", mapping: "total_ot_wages_rate" },
                  { slug: "total_bonus_wages_rate", title: "BONUS WAGES", abbreviation: "", mapping: "total_bonus_wages_rate" },
                  { slug: "total_gratuity_wages_rate", title: "GRATUITY WAGES", abbreviation: "", mapping: "total_gratuity_wages_rate" },
              ],
          },
          {
              module_title: "Contribution",
              module_slug: "master_contribution",
              fields: [
                  { slug: "total_er_pf", title: "Total ER PF", abbreviation: "", mapping: "epf_data_rate.total_employer_contribution_rate" },
                  { slug: "er_eps", title: "ER EPS", abbreviation: "", mapping: "epf_data_rate.emoloyer_eps_contribution_rate" },
                  { slug: "er_epf", title: "ER EPF", abbreviation: "", mapping: "epf_data_rate.emoloyer_pf_contribution_rate" },
                  { slug: "edli", title: "EDLI", abbreviation: "", mapping: "epf_data_rate.emoloyer_edlis_contribution_rate" },
                  { slug: "admin", title: "Admin", abbreviation: "", mapping: "epf_data_rate.emoloyer_epf_admin_contribution_rate" },
                  { slug: "er_esic", title: "ER ESIC", abbreviation: "", mapping: "esic_data_rate.emoloyer_contribution_rate" },
                  { slug: "total_er_contribution", title: "Total ER Contribution", abbreviation: "", mapping: "epf_data_rate.total_employer_contribution_rate" },
              ],
          },
          {
              module_title: "Deductions",
              module_slug: "master_deductions",
              fields: [
                  { slug: "epf_emoloyee_contribution_rate", title: "Total EE PF", abbreviation: "", mapping: "epf_data_rate.emoloyee_contribution_rate" },
                  { slug: "esic_emoloyee_contribution_rate", title: "EE ESIC", abbreviation: "", mapping: "esic_data_rate.emoloyee_contribution_rate" },
                  { slug: "p_tax_amount_rate", title: "P.Tax", abbreviation: "", mapping: "p_tax_amount_rate" },
                  { slug: "gross_deduct_rate", title: "TOTAL DEDUCTION", abbreviation: "", mapping: "gross_deduct_rate" },
              ],
          },
          {
              module_title: "Earnings",
              module_slug: "master_payment",
              fields: [
                  { slug: "ctc_amount_rate", title: "CTC", abbreviation: "", mapping: "ctc_amount_rate" },
                  { slug: "gross_earning_rate", title: "Gross", abbreviation: "", mapping: "gross_earning_rate" },
                  { slug: "net_take_home_rate", title: "Net Pay", abbreviation: "", mapping: "net_take_home_rate" },
              ],
          },
      ]
  },
  {
      main_title: "Attendance",
      main_slug: "attendance",
      // bg_color: "rgb(131 0 60 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Attendance",
              module_slug: "attendance",
              fields: [
                  { slug: "month_days", title: "Month Days", abbreviation: "Mth Days", mapping: "" },
                  { slug: "week_offs", title: "Week offs", abbreviation: "Wk Off", mapping: "emp_data.attendance_summaries.total_wo" },
                  { slug: "holidays", title: "Holidays", abbreviation: "", mapping: "emp_data.attendance_summaries.total_hl" }, // XXX
                  { slug: "paydays", title: "Pay Days", abbreviation: "", mapping: "emp_data.attendance_summaries.paydays" },
                  { slug: "total_attendance", title: "Present Days", abbreviation: "", mapping: "emp_data.attendance_summaries.total_attendance" },
                  { slug: "total_late_lop", title: "Late Loss of Pay", abbreviation: "Late LOP", mapping: "emp_data.attendance_summaries.total_late" },
                  { slug: "total_lop", title: "Loss of Pay", abbreviation: "LOP", mapping: "emp_data.attendance_summaries.total_lop" },
                  { slug: "roll_over_attendance", title: "Roll Over Attendance", abbreviation: "Roll Over Atten", mapping: "emp_data.attendance_summaries.adjust_day" },
              ],
          },
          {
              module_title: "Paid Leaves (Dynamic Heads)",
              module_slug: "paid_leaves_dynamic_heads",
              fields: [
                  { slug: "privilage_leave", title: "Privilage Leave", abbreviation: "PVL", mapping: "emp_data.attendance_summaries.total_PVL" },
                  { slug: "earned_leave", title: "Earned Leave", abbreviation: "ERL", mapping: "emp_data.attendance_summaries.total_ERL" },
                  { slug: "paid_leave", title: "Paid Leave", abbreviation: "PDL", mapping: "emp_data.attendance_summaries.total_PDL" },
                  { slug: "sick_leave", title: "Sick Leave", abbreviation: "SKL", mapping: "emp_data.attendance_summaries.total_SKL" },
                  { slug: "casual_leave", title: "Casual Leave", abbreviation: "CSL", mapping: "emp_data.attendance_summaries.total_CSL" },
                  { slug: "medical_leave", title: "Medical Leave", abbreviation: "MDL", mapping: "emp_data.attendance_summaries.total_MDL" },
                  { slug: "maternity_leave", title: "Maternity Leave", abbreviation: "MTL", mapping: "emp_data.attendance_summaries.total_MTL" },
                  { slug: "paternity_leave", title: "Paternity Leave", abbreviation: "PTL", mapping: "emp_data.attendance_summaries.total_PTL" },
                  { slug: "annual_leave", title: "Annual Leave", abbreviation: "ANL", mapping: "emp_data.attendance_summaries.total_ANL" },
                  { slug: "leave_earned_1", title: "Leave Earned", abbreviation: "LE1", mapping: "emp_data.attendance_summaries.total_LE1" },
                  { slug: "leave_earned_2", title: "Leave Earned", abbreviation: "LE2", mapping: "emp_data.attendance_summaries.total_LE2" },
                  { slug: "leave_paid_1", title: "Leave Paid", abbreviation: "LP1", mapping: "emp_data.attendance_summaries.total_LP1" },
                  { slug: "leave_paid_2", title: "Leave Paid", abbreviation: "LP2", mapping: "emp_data.attendance_summaries.total_LP2" },
                  { slug: "leave_paid_3", title: "Leave Paid", abbreviation: "LP3", mapping: "emp_data.attendance_summaries.total_LP3" },
              ],
          },
      ]
  },
  {
      main_title: "Earnings",
      main_slug: "earnings",
      // bg_color: "rgb(0 131 131 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Dynamic Salary Heads",
              module_slug: "breakup",
              fields: [
                  { slug: "dynamic-heads", title: "Dynamic Heads", abbreviation: "", mapping: "" },
              ],
          },
          {
              module_title: "Earned Wages",
              module_slug: "wagesbucket",
              fields: [
                  { slug: "total_pf_wages", title: "PF Bucket", abbreviation: "", mapping: "total_pf_wages" },
                  { slug: "restricted_pf_wages", title: "PF WAGES", abbreviation: "", mapping: "restricted_pf_wages" },
                  { slug: "edlis_wages", title: "EDLI WAGES", abbreviation: "", mapping: "edlis_wages" },
                  { slug: "eps_wages", title: "EPS WAGES", abbreviation: "", mapping: "eps_wages" },
                  { slug: "esi_bucket", title: "ESI Bucket", abbreviation: "", mapping: "total_esi_wages_bucket" },
                  { slug: "total_esi_wages", title: "ESI WAGES", abbreviation: "", mapping: "total_esi_wages" },
                  { slug: "total_pt_wages", title: "PT WAGES", abbreviation: "", mapping: "total_pt_wages" },
                  { slug: "total_tds_wages", title: "TDS WAGES", abbreviation: "", mapping: "total_tds_wages" },
                  { slug: "total_ot_wages", title: "OT WAGES", abbreviation: "", mapping: "total_ot_wages" },
                  { slug: "total_bonus_wages", title: "BONUS WAGES", abbreviation: "", mapping: "total_bonus_wages" },
                  { slug: "total_gratuity_wages", title: "GRATUITY WAGES", abbreviation: "", mapping: "total_gratuity_wages" },
              ],
          },
          {
              module_title: "Variable Earnings",
              module_slug: "variableearnings",
              fields: [
                  // { slug: "dynamic-heads", title: "Dynamic Heads", abbreviation:"", mapping: "" },
                  { slug: "incentive_val", title: "Incentive", abbreviation: "", mapping: "incentive_val" },
                  { slug: "bonus_amount", title: "Bonus", abbreviation: "", mapping: "bonus_amount" },
                  { slug: "total_ot_amount", title: "Over Time", abbreviation: "OT", mapping: "total_ot_amount" },
                  { slug: "reimbursement_gross_earning", title: "Reimbursement", abbreviation: "", mapping: "gross_earning" },
              ],
          },
          // {
          //     module_title: "Extra Earnings",
          //     module_slug: "extraearnings",
          //     fields: [
          //         { slug: "extra-earnings", title: "Dynamic Extra Earnings", abbreviation:"", mapping: "" },
          //     ],
          // },
          {
              module_title: "Contribution",
              module_slug: "contribution",
              fields: [
                  { slug: "total_er_pf", title: "Total ER PF", abbreviation: "", mapping: "epf_data.total_employer_contribution" },
                  { slug: "er_eps", title: "ER EPS", abbreviation: "", mapping: "epf_data.emoloyer_eps_contribution" },
                  { slug: "er_epf", title: "ER EPF", abbreviation: "", mapping: "epf_data.emoloyer_pf_contribution" },
                  { slug: "edli", title: "EDLI", abbreviation: "", mapping: "epf_data.emoloyer_edlis_contribution" },
                  { slug: "admin", title: "Admin", abbreviation: "", mapping: "epf_data.emoloyer_epf_admin_contribution" },
                  { slug: "er_esic", title: "ER ESIC", abbreviation: "", mapping: "esic_data.emoloyer_contribution" },
                  { slug: "total_er_contribution", title: "Total ER Contribution", abbreviation: "", mapping: "epf_data.total_employer_contribution" },
              ],
          },
          {
              module_title: "Deductions",
              module_slug: "deductions",
              fields: [
                  { slug: "emoloyer_pf_contribution", title: "Total EE PF", abbreviation: "", mapping: "epf_data.emoloyer_pf_contribution" },
                  { slug: "esic_emoloyee_contribution", title: "EE ESIC", abbreviation: "", mapping: "esic_data.emoloyee_contribution" },
                  // { slug: "emoloyee_contribution", title: "Employee's Pf Cont", abbreviation:"", mapping: "epf_data.emoloyee_contribution" },
                  // { slug: "emoloyee_contribution", title: "Employee's Esi Cont", abbreviation:"", mapping: "esic_data.emoloyee_contribution" },
                  { slug: "p_tax_amount", title: "P.Tax", abbreviation: "", mapping: "p_tax_amount" },
                  // { slug: "advance_start", title: "Advance Opening", abbreviation:"", mapping: "employee_advances_data.advance_start" },
                  // { slug: "recovered_advance_data", title: "Advance Adjusted", abbreviation:"", mapping: "employee_advances_data.recovered_advance_data" },
                  // { slug: "further_advance", title: "Advance Further", abbreviation:"", mapping: "employee_advances_data.further_advance" },
                  // { slug: "closing_advance", title: "Advance Closing", abbreviation:"", mapping: "employee_advances_data.closing_advance" },
                  { slug: "gross_deduct", title: "TOTAL DEDUCTION", abbreviation: "", mapping: "gross_deduct" },
              ],
          },
          {
              module_title: "Advance",
              module_slug: "advance",
              fields: [
                  { slug: "advance_start", title: "Opening Balance", abbreviation: "O/Bal", mapping: "employee_advances_data.advance_start" },
                  { slug: "recovered_advance_data", title: "Recovered for the Month", abbreviation: "Month's Recovery", mapping: "employee_advances_data.recovered_advance_data" },
                  { slug: "further_advance", title: "Further Advance", abbreviation: "New Advance", mapping: "employee_advances_data.further_advance" },
                  { slug: "closing_advance", title: "Closing Balance", abbreviation: "C/Bal", mapping: "employee_advances_data.closing_advance" },
              ],
          },
          {
              module_title: "Earnings",
              module_slug: "earnings",
              fields: [
                  { slug: "ctc_amount", title: "CTC", abbreviation: "", mapping: "ctc_amount" },
                  { slug: "gross_earning", title: "Gross", abbreviation: "", mapping: "gross_earning" },
                  { slug: "net_take_home", title: "Net Pay", abbreviation: "", mapping: "net_take_home" },
              ],
          },
      ]
  },
  {
      main_title: "Disbursment",
      main_slug: "disbursment",
      // bg_color: "rgb(131 127 0 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Disbursment",
              module_slug: "disbursment",
              fields: [
                  { slug: "payment_mode", title: "Payment Mode", abbreviation: "", mapping: "payment_mode" },
                  { slug: "bank", title: "Bank", abbreviation: "", mapping: "emp_data.bank_data.bank_name" },
                  { slug: "account_no", title: "Account No", abbreviation: "", mapping: "emp_data.bank_data.account_no" },
                  { slug: "ifsc_code", title: "IFSC Code", abbreviation: "", mapping: "emp_data.bank_data.ifsc_code" },
              ],
          },
      ]
  },
];

export const _salarySheetTempMasterNew: any[] = [
  {
      main_title: "User Details",
      main_slug: "userdetails",
      // bg_color: "rgb(131 0 0 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Personal Details",
              module_slug: "personal_details",
              fields: [
                  { slug: "sl_no", title: "SL. No.", abbreviation: "", mapping: "" },
                  { slug: "emp_first_name", title: "First Name", abbreviation: "", mapping: "emp_first_name" },
                  { slug: "emp_last_name", title: "Last Name", abbreviation: "", mapping: "emp_last_name" },
                  { slug: "emp_id", title: "EMP ID", abbreviation: "", mapping: "emp_id" },
              ],
          },
          {
              module_title: "Other Details",
              module_slug: "other_details",
              fields: [
                  { slug: "uan_no", title: "UAN No", abbreviation: "", mapping: "emp_data.emp_uan_no" },
                  { slug: "pf_no", title: "PF No", abbreviation: "", mapping: "emp_data.new_pf_no" },
                  { slug: "esic_no", title: "ESIC No", abbreviation: "", mapping: "emp_data.esic_no" },
                  { slug: "doj", title: "DOJ", abbreviation: "", mapping: "emp_data.date_of_join" },
                  { slug: "sex", title: "Sex", abbreviation: "", mapping: "emp_data.sex" },
                  { slug: "age", title: "Age", abbreviation: "", mapping: "emp_data.age" },
                  { slug: "branch", title: "Branch", abbreviation: "", mapping: "emp_data.branch.branch_name" },
                  { slug: "department", title: "Department", abbreviation: "", mapping: "emp_data.department.department_name" },
                  { slug: "hod", title: "HOD", abbreviation: "", mapping: "emp_data.hod" },
                  { slug: "designation", title: "Designation", abbreviation: "", mapping: "emp_data.designation.designation_name" },
                  { slug: "client", title: "Client", abbreviation: "", mapping: "emp_data.client.client_name" },
                  { slug: "restricted_pf", title: "Restrict PF", abbreviation: "", mapping: "emp_data.Restrict_PF" },
                  { slug: "reg_type", title: "Register Type", abbreviation: "", mapping: "emp_data.Reg_Type" },
                  { slug: "epf", title: "EPF", abbreviation: "", mapping: "emp_data.EPF" },
                  { slug: "eps", title: "EPS", abbreviation: "", mapping: "emp_data.EPS" },
                  { slug: "esic", title: "ESIC", abbreviation: "", mapping: "emp_data.ESIC" },
              ],
          },
      ]
  },
  {
      main_title: "Master",
      main_slug: "master",
      // bg_color: "rgba(116, 131, 0, 0.47)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Dynamic Salary Heads",
              module_slug: "master_breakup",
              fields: [
                  { slug: "master-dynamic-heads", title: "Dynamic Heads", abbreviation: "", mapping: "master_report.heads" },
              ],
          },
          {
              module_title: "Master Total Wages",
              module_slug: "master_wagesbucket",
              fields: [
                  { slug: "total_pf_bucket", title: "PF Bucket", abbreviation: "", mapping: "master_report.total_pf_wages" },
                  { slug: "total_pf_wages", title: "EPF WAGES", abbreviation: "", mapping: "master_report.restrict_pf_wages" },
                  { slug: "edlis_wages", title: "EDLI WAGES", abbreviation: "", mapping: "master_report.edlis_wages" },
                  { slug: "eps_wages", title: "EPS WAGES", abbreviation: "", mapping: "master_report.eps_wages" },
                  { slug: "total_esic_bucket", title: "ESIC Bucket", abbreviation: "", mapping: "master_report.total_esi_wages" },
                  { slug: "total_esic_wages", title: "ESIC WAGES", abbreviation: "", mapping: "master_report.restrict_esic_wages" },
                  { slug: "total_pt_wages", title: "PT WAGES", abbreviation: "", mapping: "master_report.total_pt_wages" },
                  { slug: "total_tds_wages", title: "TDS WAGES", abbreviation: "", mapping: "master_report.total_tds_wages" },
                  { slug: "total_ot_wages", title: "OT WAGES", abbreviation: "", mapping: "master_report.total_ot_wages" },
                  { slug: "total_bonus_wages", title: "BONUS WAGES", abbreviation: "", mapping: "master_report.total_bonus_wages" },
                  { slug: "total_gratuity_wages", title: "GRATUITY WAGES", abbreviation: "", mapping: "master_report.total_gratuity_wages" },
              ],
          },
          {
              module_title: "Contribution",
              module_slug: "master_contribution",
              fields: [

                // ws.cell( 4,excel_array['emoloyer_pf_contribution_rate']).string('ER EPF');
                // ws.cell( 4,excel_array['emoloyer_contribution_rate']).string('ER EPS');
                // ws.cell( 4,excel_array['total_employer_contribution_rate']).string('TOTAL ER PF');
                // ws.cell( 4,excel_array['emoloyee_pf_contribution_rate']).string('EDLI');
                // ws.cell( 4,excel_array['emoloyee_esic_contribution_rate']).string('ADMIN');
                // ws.cell( 4,excel_array['esic_data_rate']).string('ER ESIC');
                // ws.cell( 4,excel_array['total_employee_contribution_rate']).string('TOTAL ER CONTRIBUTION');

                  // { slug: "epf_data", title: "PF Break-up", abbreviation: "", mapping: "master_report.epf_data" }, /// ---- need to clear
                  { slug: "emoloyer_pf_contribution", title: "ER EPF", abbreviation: "", mapping: "master_report.epf_data.emoloyer_pf_contribution" },
                  { slug: "emoloyer_eps_contribution", title: "ER EPS", abbreviation: "", mapping: "master_report.epf_data.emoloyer_eps_contribution" },
                  { slug: "emoloyer_epf_admin_contribution", title: "Admin Charges", abbreviation: "", mapping: "master_report.epf_data.emoloyer_epf_admin_contribution" },
                  { slug: "emoloyer_edlis_contribution", title: "EDLI", abbreviation: "", mapping: "master_report.epf_data.emoloyer_edlis_contribution" },
                  { slug: "emoloyer_esic_contribution", title: "ER ESIC", abbreviation: "", mapping: "master_report.esic_data.emoloyer_contribution" },
                  { slug: "total_employer_contribution", title: "Total ER Contribution", abbreviation: "", mapping: [
                    "master_report.epf_data.emoloyer_pf_contribution",
                    "master_report.epf_data.emoloyer_eps_contribution",
                    "master_report.epf_data.emoloyer_epf_admin_contribution",
                    "master_report.epf_data.emoloyer_edlis_contribution",
                    "master_report.esic_data.emoloyer_contribution"
                ] },
              ],
          },
          {
              module_title: "Deductions",
              module_slug: "master_deductions",
              fields: [
                  { slug: "emoloyee_pf_contribution", title: "EE PF", abbreviation: "", mapping: "master_report.epf_data.emoloyee_contribution" },
                  { slug: "emoloyee_esic_contribution", title: "EE ESIC", abbreviation: "", mapping: "master_report.esic_data.emoloyee_contribution" },
                  { slug: "p_tax_amount", title: "P.Tax", abbreviation: "", mapping: "master_report.p_tax_amount" },
                  { slug: "voluntary_pf_amount", title: "VPF", abbreviation: "", mapping: "master_report.voluntary_pf_amount" },
                  { slug: "total_employee_contribution", title: "TOTAL EE DEDUCTION", abbreviation: "", mapping: [
                    "master_report.epf_data.emoloyee_contribution",
                    "master_report.esic_data.emoloyee_contribution",
                    "master_report.p_tax_amount",
                    "master_report.voluntary_pf_amount",
                  ] },
              ],
          },
          {
              module_title: "Earnings",
              module_slug: "master_payment",
              fields: [
                  { slug: "ctc", title: "CTC", abbreviation: "", mapping: "master_report.ctc" },
                  { slug: "gross_earning", title: "Gross", abbreviation: "", mapping: "master_report.gross_earning" },
                  { slug: "net_take_home", title: "Net Pay", abbreviation: "", mapping: "master_report.net_take_home" },
              ],
          },
      ]
  },
  {
      main_title: "Attendance",
      main_slug: "attendance",
      // bg_color: "rgb(131 0 60 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Attendance",
              module_slug: "attendance",
              fields: [
                  { slug: "month_days", title: "Month Days", abbreviation: "Mth Days", mapping: "" },
                  { slug: "week_offs", title: "Week offs", abbreviation: "Wk Off", mapping: "emp_data.attendance_summaries.total_wo" },
                  { slug: "holidays", title: "Holidays", abbreviation: "", mapping: "emp_data.attendance_summaries.holiday" },
                  { slug: "paydays", title: "Pay Days", abbreviation: "", mapping: "emp_data.attendance_summaries.paydays" },
                  { slug: "total_attendance", title: "Present Days", abbreviation: "", mapping: "emp_data.attendance_summaries.total_attendance" },
                  { slug: "assumed_present", title: "Assumed Present", abbreviation: "", mapping: "emp_data.attendance_summaries.assumed_pre_day" },
                  { slug: "total_late_lop", title: "Late Loss of Pay", abbreviation: "Late LOP", mapping: "emp_data.attendance_summaries.total_late" },
                  { slug: "total_lop", title: "Loss of Pay", abbreviation: "LOP", mapping: "emp_data.attendance_summaries.total_lop" },
                  { slug: "roll_over_attendance", title: "Roll Over Attendance", abbreviation: "Roll Over Atten", mapping: "emp_data.attendance_summaries.adjust_day" },
              ],
          },
          {
              module_title: "Paid Leaves (Dynamic Heads)",
              module_slug: "paid_leaves_dynamic_heads",
              fields: [
                  { slug: "attendance-dynamic-heads", title: "Dynamic Heads", abbreviation: "", mapping: "master_report.heads" },
              ],
          },
      ]
  },
  {
      main_title: "Earnings",
      main_slug: "earnings",
      // bg_color: "rgb(0 131 131 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Dynamic Salary Heads",
              module_slug: "breakup",
              fields: [
                  { slug: "dynamic-heads", title: "Dynamic Heads", abbreviation: "", mapping: "salary_report.heads" },
              ],
          },
          {
              module_title: "Earned Totals",
              module_slug: "wagesbucket",
              fields: [
                  { slug: "total_pf_bucket", title: "PF Bucket", abbreviation: "", mapping: "salary_report.total_pf_bucket" },
                  { slug: "total_pf_wages", title: "EPF WAGES", abbreviation: "", mapping: "salary_report.total_pf_wages" },
                  { slug: "edlis_wages", title: "EDLI WAGES", abbreviation: "", mapping: "salary_report.edlis_wages" },
                  { slug: "eps_wages", title: "EPS WAGES", abbreviation: "", mapping: "salary_report.eps_wages" },
                  { slug: "total_esic_bucket", title: "ESIC Bucket", abbreviation: "", mapping: "salary_report.total_esic_bucket" },
                  { slug: "total_esic_wages", title: "ESIC WAGES", abbreviation: "", mapping: "salary_report.total_esic_wages" },
                  { slug: "total_pt_wages", title: "PT WAGES", abbreviation: "", mapping: "salary_report.total_pt_wages" },
                  { slug: "total_tds_wages", title: "TDS WAGES", abbreviation: "", mapping: "salary_report.total_tds_wages" },
                  { slug: "total_ot_wages", title: "OT WAGES", abbreviation: "", mapping: "salary_report.total_ot_wages" },
                  { slug: "total_bonus_wages", title: "BONUS WAGES", abbreviation: "", mapping: "salary_report.total_bonus_wages" },
                  { slug: "total_gratuity_wages", title: "GRATUITY WAGES", abbreviation: "", mapping: "salary_report.total_gratuity_wages" },
              ],
          },
          {
              module_title: "Variable Earnings",
              module_slug: "variableearnings",
              fields: [
                  { slug: "incentive_val", title: "Incentive", abbreviation: "", mapping: "incentive_report.gross_earning" },
                  { slug: "bonus_amount", title: "Bonus", abbreviation: "", mapping: "bonus_report.gross_earning" },
                  { slug: "bonus_ex_gratia", title: "Bonus Ex-gratia", abbreviation: "", mapping: "bonus_report.exgratia_amount" },
                  { slug: "total_ot_amount", title: "Over Time", abbreviation: "OT", mapping: "ot_report.gross_earning" },
                  { slug: "reimbursement_gross_earning", title: "Reimbursement", abbreviation: "", mapping: "reimbursment_report.gross_earning" },
              ],
          },
          {
              module_title: "Contribution",
              module_slug: "contribution",
              fields: [
                  { slug: "emoloyer_pf_contribution", title: "ER EPF", abbreviation: "", mapping: "salary_report.pf_data.emoloyer_pf_contribution" },
                  { slug: "emoloyer_eps_contribution", title: "Total ER EPS", abbreviation: "", mapping: "salary_report.pf_data.emoloyer_eps_contribution" },
                  { slug: "emoloyer_epf_admin_contribution", title: "Admin Charges", abbreviation: "", mapping: "salary_report.pf_data.emoloyer_epf_admin_contribution" },
                  { slug: "emoloyer_edlis_contribution", title: "EDLI", abbreviation: "", mapping: "salary_report.pf_data.emoloyer_edlis_contribution" },
                  { slug: "emoloyer_esic_contribution", title: "ER ESIC", abbreviation: "", mapping: "salary_report.esic_data.emoloyer_contribution" },
                  { slug: "total_employer_contribution", title: "Total ER Contribution", abbreviation: "", mapping: 
                    [
                        "salary_report.pf_data.emoloyer_pf_contribution",
                        "salary_report.pf_data.emoloyer_eps_contribution",
                        "salary_report.pf_data.emoloyer_epf_admin_contribution",
                        "salary_report.pf_data.emoloyer_edlis_contribution",
                        "salary_report.esic_data.emoloyer_contribution"
                    ]
                   },
              ],
          },
          {
              module_title: "Deductions",
              module_slug: "deductions",
              fields: [
                  { slug: "emoloyee_pf_contribution", title: "EE PF", abbreviation: "", mapping: "salary_report.pf_data.emoloyee_contribution" },
                  { slug: "emoloyee_esic_contribution", title: "EE ESIC", abbreviation: "", mapping: "salary_report.esic_data.emoloyee_contribution" },
                  { slug: "pt_amount", title: "P.Tax", abbreviation: "", mapping: "salary_report.pt_amount" },
                  { slug: "voluntary_pf_amount", title: "VPF", abbreviation: "", mapping: "salary_report.voluntary_pf_amount" },
                  { slug: "total_ee_contribution", title: "TOTAL EE DEDUCTION", abbreviation: "", mapping: [
                    "salary_report.pf_data.emoloyee_contribution",
                    "salary_report.esic_data.emoloyee_contribution",
                    "salary_report.pt_amount",
                    "salary_report.voluntary_pf_amount",
                  ] },
              ],
          },
          {
              module_title: "Advance",
              module_slug: "advance",
              fields: [
                  { slug: "advance_start", title: "Opening Balance", abbreviation: "O/Bal", mapping: "advance_report.opening_balance" },
                  { slug: "recovered_advance_data", title: "Recovered for the Month", abbreviation: "Month's Recovery", mapping: "advance_report.advance_recovered" },
                  { slug: "further_advance", title: "Further Advance", abbreviation: "New Advance", mapping: "advance_report.new_advance" },
                  { slug: "closing_advance", title: "Closing Balance", abbreviation: "C/Bal", mapping: "advance_report.closing_balance" },
              ],
          },
          {
              module_title: "Earnings",
              module_slug: "earnings",
              fields: [
                  { slug: "ctc", title: "CTC", abbreviation: "", mapping: "salary_report.ctc" },
                  { slug: "gross_earning", title: "Gross", abbreviation: "", mapping: "salary_report.gross_earning" },
                  { slug: "net_take_home", title: "Net Pay", abbreviation: "", mapping: "salary_report.net_take_home" },
              ],
          },
      ]
  },
  {
      main_title: "Disbursment",
      main_slug: "disbursment",
      // bg_color: "rgb(131 127 0 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Disbursment",
              module_slug: "disbursment",
              fields: [
                  { slug: "payment_mode", title: "Payment Mode", abbreviation: "", mapping: "payment_mode" },
                  { slug: "bank", title: "Bank", abbreviation: "", mapping: "bank_details.bank_name" },
                  { slug: "account_no", title: "Account No", abbreviation: "", mapping: "bank_details.account_no" },
                  { slug: "ifsc_code", title: "IFSC Code", abbreviation: "", mapping: "bank_details.ifsc_code" },
              ],
          },
      ]
  },
];
