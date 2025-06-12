export const _advanceReportTempMasterNew: any[] = [
  {
      main_title: "",
      main_slug: "",
      // bg_color: "rgb(131 0 0 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Advance",
              module_slug: "Advance",
              fields: [
                  { slug: "sl_no", title: "SL. No.", abbreviation: "", mapping: "", field_type:'employee_detail' },
                  { slug: "emp_id", title: "Emp ID", abbreviation: "", mapping: "emp_id", field_type:'employee_detail' },
                  { slug: "emp_name", title: "Name", abbreviation: "", mapping: ["emp_first_name", "emp_last_name"], field_type:'employee_detail' },
                  { slug: "department", title: "Department", abbreviation: "", mapping: "emp_data.department.department_name", field_type:'employee_detail' },
                  { slug: "designation", title: "Designation", abbreviation: "", mapping: "emp_data.designation.designation_name", field_type:'employee_detail' },
                  { slug: "client", title: "Client", abbreviation: "", mapping: "emp_data.client.client_name", field_type:'employee_detail' },
                  { slug: "branch", title: "Branch", abbreviation: "", mapping: "emp_data.branch.branch_name", field_type:'employee_detail' },
                  { slug: "hod", title: "HOD", abbreviation: "", mapping: "emp_data.hod", field_type:'employee_detail' },
                  { slug: "advance_id", title: "Advance ID", abbreviation: "", mapping: "recovery_from", field_type:"advance_data" },
                  { slug: "recover_form", title: "Recover Form", abbreviation: "", mapping: "recovery_from", field_type:"advance_data" },
                  { slug: "no_of_instalments", title: "No Of Instalments", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "intstalment_amount", title: "Instalment Amount", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "start_month", title: "Start Month", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "end_month", title: "End Month", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "advance_given", title: "Advance Given", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "advance_recovered", title: "Advance Recovered", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "advance_balance", title: "Advance Balance", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "opening_balance", title: "Opening Balance", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "total_advance_given", title: "Total Advance Given", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "total_advance_recovered", title: "Total Advance Recovered", abbreviation: "", mapping: "", field_type:"advance_data" },
                  { slug: "closing_balance", title: "Closing Balance", abbreviation: "", mapping: "", field_type:"advance_data" },
                ],
          },
      ]
  },
];
