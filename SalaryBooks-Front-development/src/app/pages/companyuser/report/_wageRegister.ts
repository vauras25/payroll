export const _wageRegisterMasterNew: any[] = [
    {
        main_title: "User Details",
        main_slug: "userdetails",
        // bg_color: "rgb(131 0 0 / 47%)",
        // text_color: 'black',
        modules: [
            {
                module_title: "",
                module_slug: "",
                fields: [
                    { slug: "sl_no", title: "SL. No.", abbreviation: "", mapping: "" },
                    { slug: "name", title: "Name", abbreviation: "", mapping: ["emp_first_name", "emp_last_name"] },
                    { slug: "rate_of_wage", title: "Rate Of Wage", abbreviation: "", mapping: "rate_of_wage" },
                    { slug: "no_of_days_worked", title: "No. of days worked", abbreviation: "", mapping: "rate_of_wage" },
                    { slug: "overtime_hours_worked", title: "Overtime Hours Worked", abbreviation: "", mapping: "overtime_hours_worked" },
                ],
            },
            {
                module_title: "Earned Wages",
                module_slug: "earned_wages",
                fields: [
                    { slug: "basic", title: "BASIC", abbreviation: "", mapping: "basic" },
                    { slug: "hra", title: "HRA", abbreviation: "", mapping: "hra" },
                    { slug: "others", title: "Others", abbreviation: "", mapping: "others" },
                    { slug: "overtime", title: "OverTime", abbreviation: "", mapping: "overtime" },
                    { slug: "gross_wages", title: "Gross Wages", abbreviation: "", mapping: "gross_wages" },
                    // { slug: "age", title: "Age", abbreviation: "", mapping: "emp_data.age" },
                    // { slug: "branch", title: "Branch", abbreviation: "", mapping: "emp_data.branch.branch_name" },
                    // { slug: "department", title: "Department", abbreviation: "", mapping: "emp_data.department.department_name" },
                    // { slug: "hod", title: "HOD", abbreviation: "", mapping: "emp_data.hod" },
                    // { slug: "designation", title: "Designation", abbreviation: "", mapping: "emp_data.designation.designation_name" },
                    // { slug: "client", title: "Client", abbreviation: "", mapping: "emp_data.client.client_name" },
                    // { slug: "restricted_pf", title: "Restrict PF", abbreviation: "", mapping: "emp_data.Restrict_PF" },
                    // { slug: "reg_type", title: "Register Type", abbreviation: "", mapping: "emp_data.Reg_Type" },
                    // { slug: "epf", title: "EPF", abbreviation: "", mapping: "emp_data.EPF" },
                    // { slug: "eps", title: "EPS", abbreviation: "", mapping: "emp_data.EPS" },
                    // { slug: "esic", title: "ESIC", abbreviation: "", mapping: "emp_data.ESIC" },
                ],
            },
            {
                module_title: "Deductions",
                module_slug: "deductions",
                fields: [
                    { slug: "pf", title: "PF", abbreviation: "", mapping: "pf" },
                    { slug: "pt", title: "PT", abbreviation: "", mapping: "pt" },
                    { slug: "esi", title: "ESI", abbreviation: "", mapping: "esi" },
                    { slug: "advance", title: "Advance", abbreviation: "", mapping: "advance" },
                    { slug: "total_deduction", title: "Total Deduction", abbreviation: "", mapping: "total_deduction" },
                    { slug: "net_payment", title: "Net Payment", abbreviation: "", mapping: "net_payment" },
                    { slug: "employer_share", title: "Employer Share", abbreviation: "", mapping: "employer_share" },
                    { slug: "reciept_by_emp_bnk", title: "Reciept Employee/Bank Transaction", abbreviation: "", mapping: "reciept_by_emp_bnk" },
                    { slug: "date_of_payment", title: "Date of Payment", abbreviation: "", mapping: "date_of_payment" },
                    { slug: "remarks", title: "Remarks", abbreviation: "", mapping: "remarks" },
                ],
            },
        ]
    },
  
  ];