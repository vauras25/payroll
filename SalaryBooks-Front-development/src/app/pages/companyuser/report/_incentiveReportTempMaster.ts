export const _incentiveReportTempMasterNew: any[] = [
    {
        main_title: "",
        main_slug: "",
        // bg_color: "rgb(131 0 0 / 47%)",
        // text_color: 'black',
        modules: [
            {
                module_title: "Incentive",
                module_slug: "incentive",
                fields: [
                    { slug: "sl_no", title: "SL. No.", abbreviation: "", mapping: "", field_type:'personal_detail' },
                    { slug: "emp_id", title: "Emp Id", abbreviation: "", mapping: "emp_id", field_type:'personal_detail' },
                    { slug: "emp_name", title: "Name", abbreviation: "", mapping: ["emp_first_name", "emp_last_name"], field_type:'personal_detail' },
                    { slug: "department", title: "Department", abbreviation: "", mapping: "department.department_name", field_type:'personal_detail' },
                    { slug: "designation", title: "Designation", abbreviation: "", mapping: "designation.designation_name", field_type:'personal_detail' },
                    { slug: "client", title: "Client", abbreviation: "", mapping: "client.client_name", field_type:'personal_detail' },
                    { slug: "branch", title: "Branch", abbreviation: "", mapping: "branch.branch_name", field_type:'personal_detail' },
                    { slug: "hod", title: "HOD", abbreviation: "", mapping: ["hod.first_name", "hod.last_name"], field_type:'personal_detail' },
                    { slug: "incentive_Accumulated", title: "Incentive Accumulated", abbreviation: "", mapping: "incentive_report.accumulated", field_type:'other_detail' },
                    { slug: "incentive_Setteled", title: "Incentive Setteled", abbreviation: "", mapping: "incentive_report.setteled", field_type:'other_detail' },
                    { slug: "advance_Paid", title: "Advance Paid", abbreviation: "", mapping: "incentive_report.advance_paid", field_type:'other_detail' },
                    { slug: "advance_Recovered", title: "Advance Recovered", abbreviation: "", mapping: "incentive_report.advance_recovery", field_type:'other_detail' },
                    { slug: "tds", title: "TDS", abbreviation: "", mapping: "", field_type:'other_detail' },
                    { slug: "er_pf", title: "ER PF", abbreviation: "", mapping: "incentive_report.pf_data.emoloyer_pf_contribution", field_type:'other_detail' },
                    { slug: "ee_pf", title: "EE PF", abbreviation: "", mapping: "incentive_report.pf_data.emoloyee_contribution", field_type:'other_detail' },
                    { slug: "er_esic", title: "ER ESI", abbreviation: "", mapping: "incentive_report.esic_data.emoloyer_contribution", field_type:'other_detail' },
                    { slug: "ee_esic", title: "EE ESI", abbreviation: "", mapping: "incentive_report.esic_data.emoloyee_contribution", field_type:'other_detail' },
                    { slug: "net_pay", title: "Net Pay", abbreviation: "", mapping: "incentive_report.gross_earning", field_type:'other_detail' },
                ],
            },
        ]
    },

];
