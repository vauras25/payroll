export const _arrearReportTempMaster: any[] = [
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
                    { slug: "email_id", title: "Email", abbreviation: "", mapping: "email_id" },
                    { slug: "pan_no", title: "PAN No", abbreviation: "", mapping: "pan_no" },
                    { slug: "aadhar_no", title: "Aadhar No", abbreviation: "", mapping: "aadhar_no" },
                ],
            },
        ]
    },
    {
        main_title: "Arrear",
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
                    { slug: "total_pf_wages", title: "PF Bucket", abbreviation: "", mapping: "total_pf_bucket",first_key:'' },
                    { slug: "restricted_pf_wages", title: "PF WAGES", abbreviation: "", mapping: "total_pf_wages",first_key:'' },
                    { slug: "edlis_wages", title: "EDLI WAGES", abbreviation: "", mapping: "pf_data.edlis_wages",first_key:'' },
                    { slug: "eps_wages", title: "EPS WAGES", abbreviation: "", mapping: "eps_wages",first_key:'' },
                    { slug: "esi_bucket", title: "ESI Bucket", abbreviation: "", mapping: "total_esic_bucket",first_key:'' },
                    { slug: "total_esi_wages", title: "ESI WAGES", abbreviation: "", mapping: "total_esic_wages",first_key:'' },
                    { slug: "total_pt_wages", title: "PT WAGES", abbreviation: "", mapping: "total_pt_wages",first_key:'' },
                    { slug: "total_tds_wages", title: "TDS WAGES", abbreviation: "", mapping: "total_tds_wages",first_key:'' },
                    { slug: "total_ot_wages", title: "OT WAGES", abbreviation: "", mapping: "total_ot_wages",first_key:'' },
                    { slug: "total_bonus_wages", title: "BONUS WAGES", abbreviation: "", mapping: "total_bonus_wages",first_key:'' },
                    { slug: "total_gratuity_wages", title: "GRATUITY WAGES", abbreviation: "", mapping: "total_gratuity_wages",first_key:'' },
                ],
            },
            // {
            //     module_title: "Variable Earnings",
            //     module_slug: "variableearnings",
            //     fields: [
            //         // { slug: "dynamic-heads", title: "Dynamic Heads", abbreviation:"", mapping: "" },
            //         { slug: "incentive_val", title: "Incentive", abbreviation: "", mapping: "incentive_val" },
            //         { slug: "bonus_amount", title: "Bonus", abbreviation: "", mapping: "bonus_amount" },
            //         { slug: "total_ot_amount", title: "Over Time", abbreviation: "OT", mapping: "total_ot_amount" },
            //         { slug: "gross_earning", title: "Reimbursment", abbreviation: "", mapping: "gross_earning" },
            //     ],
            // },
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
                    { slug: "total_er_pf", title: "Total ER PF", abbreviation: "", mapping: "emoloyer_pf_contribution",first_key:'pf_data' },
                    { slug: "er_eps", title: "ER EPS", abbreviation: "", mapping: "emoloyer_eps_contribution",first_key:'pf_data' },
                    { slug: "edli", title: "EDLI", abbreviation: "", mapping: "emoloyer_edlis_contribution",first_key:'pf_data' },
                    { slug: "admin", title: "Admin", abbreviation: "", mapping: "emoloyer_epf_admin_contribution",first_key:'pf_data' },
                    { slug: "er_esic", title: "ER ESIC", abbreviation: "", mapping: "emoloyer_contribution",first_key:'esic_data'},
                    { slug: "total_er_contribution", title: "Total ER Contribution", abbreviation: "", mapping: "emoloyer_contribution",first_key:'esic_data' },
                ],
            },
            {
                module_title: "Deductions",
                module_slug: "deductions",
                fields: [
                    { slug: "emoloyer_pf_contribution", title: "Total EE PF", abbreviation: "", mapping: "emoloyee_contribution",first_key:'pf_data' },
                    { slug: "emoloyer_contribution", title: "EE ESIC", abbreviation: "", mapping: "emoloyee_contribution",first_key:'esic_data' },
                    // { slug: "emoloyee_contribution", title: "Employee's Pf Cont", abbreviation:"", mapping: "epf_data.emoloyee_contribution" },
                    // { slug: "emoloyee_contribution", title: "Employee's Esi Cont", abbreviation:"", mapping: "esic_data.emoloyee_contribution" },
                    { slug: "p_tax_amount", title: "P.Tax", abbreviation: "", mapping: "pt_amount",first_key:'' },
                    // { slug: "advance_start", title: "Advance Opening", abbreviation:"", mapping: "employee_advances_data.advance_start" },
                    // { slug: "recovered_advance_data", title: "Advance Adjusted", abbreviation:"", mapping: "employee_advances_data.recovered_advance_data" },
                    // { slug: "further_advance", title: "Advance Further", abbreviation:"", mapping: "employee_advances_data.further_advance" },
                    // { slug: "closing_advance", title: "Advance Closing", abbreviation:"", mapping: "employee_advances_data.closing_advance" },
                    { slug: "gross_deduct", title: "TOTAL DEDUCTION", abbreviation: "", mapping: "gross_deduct",first_key:'' },
                ],
            },
            {
                module_title: "Arrear",
                module_slug: "earnings",
                fields: [
                    { slug: "ctc_amount", title: "CTC", abbreviation: "", mapping: "ctc_amount" },
                    { slug: "gross_earning", title: "Gross", abbreviation: "", mapping: "gross_earning" },
                    { slug: "net_take_home", title: "Net Pay", abbreviation: "", mapping: "net_take_home" },
                ],
            },
        ]
    },
];
