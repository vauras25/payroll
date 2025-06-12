import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'app-ptax-return-data',
  templateUrl: './ptax-return-data.component.html',
  styleUrls: ['./ptax-return-data.component.css'],
})
export class PtaxReturnDataComponent implements OnInit {
  reportListType = 'summary';
  Global = Global;
  employees: any[] = [];
  appraisalsListing: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  employee_id: any;
  isViewReportDetails: boolean = false;
  stateMaster:any[] = []
  monthYearArray:any[] = [];
  state:any = null
  isReportView:boolean = false;
  companyData:any
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.fetchStates()
  }

  ngOnInit() {}

  ptax_return_heads:any[] = [
    {
      main_title: "",
      main_slug: "",
      // bg_color: "rgb(131 0 0 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "P.Tax Return Data",
              module_slug: "p.tax return data",
              fields: [
                    //  { slug: "sl_no", title: "SL. No.", abbreviation: "", mapping: "" },
                    //  {slug:"salary_slab", title:"Salary Slab",abbreviation: "", mapping:"slary_slab"},
                     {slug:"no_of_emp", title:"No of Emp",abbreviation: "", mapping:"no_ofemp"},
                     {slug:"amount", title:"Amount",abbreviation: "", mapping:"amount"},
                    //  {slug:"membernameasperdoc", title:"MemberNameAsPerDoc",abbreviation: "", mapping: ["emp_first_name", "emp_last_name"]},
                    //  {slug:"ifsc", title:"IFSC",abbreviation: "", mapping:"ifsc"},
                    //  {slug:"expirydate", title:"ExpiryDate",abbreviation: "", mapping:"expirydate"},
                  // { slug: "emp_id", title: "Emp ID", abbreviation: "", mapping: "emp_id" },
                  // { slug: "emp_name", title: "Name", abbreviation: "", mapping: ["emp_first_name", "emp_last_name"] },
                  // { slug: "department", title: "Department", abbreviation: "", mapping: "department.department_name" },
                  // { slug: "designation", title: "Designation", abbreviation: "", mapping: "designation.designation_name" },
                  // { slug: "client", title: "Client", abbreviation: "", mapping: "client.client_code" },
             
                 

              ],
          },
      ]
  },
  ]
  fetchStates() {
    // this.spinner.show();

    this.companyuserService.fetchStates().subscribe(
      (res) => {
        if (res.status == 'success') {
          this.stateMaster = [];
          for (const key in res.state_list[0].states) {
            if (
              Object.prototype.hasOwnProperty.call(
                res.state_list[0].states,
                key
              )
            ) {
              const element = res.state_list[0].states[key];
              this.stateMaster.push({
                id: element.id,
                description: element.name,
              });
            }
          }
        } else {
          this.toastr.error(res.message);
        }

        // this.spinner.hide();
      },
      (err) => {
        this.toastr.error(Global.showServerErrorMessage(err));
        // this.spinner.hide();
      }
    );
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchEmployees();
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll(
      '[data-checkbox-id="' + rowId + '"]'
    );
    // console.log(row,'row emp');
      
    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
          }
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          if (!this.uncheckedRowIds.includes(rowId)) {
            this.uncheckedRowIds.push(rowId);
          }
        }
      }
    }
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  }

  getPayload() {
    let payload: any = {
      pageno: this.reportPaginationOptions.page,
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      rating_year: this.employeeListFilter?.year?.value ?? '',
      client_id: '',
      generate: 'listing',
      wage_month_from: this.employeeListFilter.wage_month_from,
      wage_year_from: this.employeeListFilter.wage_year_from,
      wage_month_to: this.employeeListFilter.wage_month_to,
      wage_year_to: this.employeeListFilter.wage_year_to,
      state_name: this.state?.value?.description,
    }
  // console.log(this.state.value);
    
    return payload;
  }

  async fetchEmployees() {
    try {
      if(!this.state) return;
      let payload = this.getPayload();
      let res = await this.companyuserService
        .fetchPtaxReturnData(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {

          this.monthYearArray = []
          this.companyData = res?.company
          const dateFrom = new Date(this.employeeListFilter.wage_year_from, this.employeeListFilter.wage_month_from, 1)
          const dateto = new Date(this.employeeListFilter.wage_year_to, this.employeeListFilter.wage_month_to, 1)
          const yearDiff = dateto.getFullYear() - dateFrom.getFullYear();
          const monthDiff = dateto.getMonth() - dateFrom.getMonth();
              
          let totalMonths = yearDiff * 12 + monthDiff;
      
          for (let i = 0; i <= totalMonths; i++) {
            const date = new Date(dateFrom.getFullYear(), dateFrom.getMonth() + i, 1);
            this.monthYearArray.push({
              month: Global.monthMaster.find(m => m.index == date.getMonth())?.sf,
              year: date.getFullYear().toString()
            });
          }
          
          this.employees = res?.employees;
          this.employees.forEach((doc: any) => {
            doc.tax_slab.checked = this.isRowChecked(doc._id);
          });
          return res;
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      this.toastr.error(err?.message || err);
    }
  }

  async downloadReport(){
    try {
      const payload = this.getPayload();
      payload.generate = 'excel';
      await this.companyuserService.downloadFile('get-pt-return-report','ptax-return-data', payload)
    } catch (err:any) {
      this.toastr.error(err?.message || err )
    }
    // .subscribe(res => {
    //   if (res.status == 'success') {
    //   location.href= res?.url;
    //   } else {
    //     this.toastr.error(res.message);
    //   }
    // }, (err) => {
    //   this.toastr.error("Internal server error occured. Please try again later.");
    // });
  }
  generatedReportTemplate:any[] = [];
  viewReport(){
    this.isReportView = true;
    this.generatedReportTemplate = this.ptax_return_heads[0]?.modules
  }

  cancelGenerateReport(){
    this.isReportView = false;
  }
}
