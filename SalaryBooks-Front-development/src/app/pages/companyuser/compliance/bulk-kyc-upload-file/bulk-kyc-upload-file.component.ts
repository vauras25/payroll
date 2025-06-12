import { Component, OnInit, ViewChild,ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { title } from 'process';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'app-bulk-kyc-upload-file',
  templateUrl: './bulk-kyc-upload-file.component.html',
  styleUrls: ['./bulk-kyc-upload-file.component.css']
})
export class BulkKycUploadFileComponent implements OnInit {

  @ViewChild('all') checkboxAll?:HTMLInputElement ;
  @ViewChild('b') checkboxBank?:HTMLInputElement ;
  @ViewChild('p') checkboxPan?:HTMLInputElement ;
  @ViewChild('a') checkboxAddhar?:HTMLInputElement;
  @ViewChild('t') checkboxPassport?:HTMLInputElement ;

  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  Global = Global;
  employees: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  documents: any[] = [];
  uncheckedRowIds: any[] = [];
  contributionPeriodType: any[] = [];
  viewAllEmp:any[]=[]
  contributionPeriodform:FormGroup = new FormGroup({
    contributionPeriod:new FormControl('')
  })
  viewMode:'listing'|'report' = 'listing'

  bulk_kyc_heads:any[] = [
    {
      main_title: "",
      main_slug: "",
      // bg_color: "rgb(131 0 0 / 47%)",
      // text_color: 'black',
      modules: [
          {
              module_title: "Bulk KYC",
              module_slug: "bulk kyc",
              fields: [
                     { slug: "sl_no", title: "SL. No.", abbreviation: "", mapping: "" },
                     {slug:"uan", title:"UAN",abbreviation: "", mapping:"uan_no"},
                     {slug:"typeid", title:"TypeID",abbreviation: "", mapping:"typeid"},
                     {slug:"docnumber", title:"docNumber",abbreviation: "", mapping:"docnumber"},
                     {slug:"membernameasperdoc", title:"MemberNameAsPerDoc",abbreviation: "", mapping: ["emp_first_name", "emp_last_name"]},
                     {slug:"ifsc", title:"IFSC",abbreviation: "", mapping:"ifsc"},
                     {slug:"expirydate", title:"ExpiryDate",abbreviation: "", mapping:"expirydate"},
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

  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private authService:AuthService
  ) {
    const companyData = JSON.parse(localStorage.getItem('payroll-companyuser-user') || '{}');
    if(companyData?.esic_rules){
      const contribution_period_a_from = Global.monthMaster.find(m => (m.index+1) == companyData?.esic_rules?.contribution_period_a_from)
      const contribution_period_b_from = Global.monthMaster.find(m => (m.index+1) == companyData?.esic_rules?.contribution_period_b_from)
      const contribution_period_a_to = Global.monthMaster.find(m => (m.index+1) == companyData?.esic_rules?.contribution_period_a_to)
      const contribution_period_b_to = Global.monthMaster.find(m => (m.index+1) == companyData?.esic_rules?.contribution_period_b_to)

      this.contributionPeriodType = [
        {label:`A ${contribution_period_a_from?.sf}-${contribution_period_a_to?.sf}`, value:{
          wage_month_from:contribution_period_a_from?.index,
          wage_month_to:contribution_period_a_to?.index
        }},
        {label:`B ${contribution_period_b_from?.sf}-${contribution_period_b_to?.sf}`, value:{
          wage_month_from:contribution_period_b_from?.index,
          wage_month_to:contribution_period_b_to?.index
        }}
      ]

      this.contributionPeriodform.get('contributionPeriod')?.setValue(this.contributionPeriodType[0])
    }

  }

  ngOnInit() {
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

  viewEmpDoc:any[] = [];
  viewEmpDocData:any[] = [];
  rowCheckBoxChecked(event: any, row: any) {
    
    let rowId: any = row._id;
    let viewEmp:any = {};
    // viewEmp.uan_no = row?.uan_no;
    // viewEmp.uan_no = row?.uan_no;

    // viewEmpDoc.push(row.uan_no) 
    const docs:any = []
    let checkbox: any = document.querySelectorAll(
      '[data-checkbox-id="' + rowId + '"]'
    );
   

    let els = document.getElementsByClassName(`emp=${row.emp_id}`);
    
    Array.from(els).forEach((el:any) => {
      
      if(checkbox[0].checked){
        el.disabled = false;
        if(el.checked){
          if(el.name == 'all'){
            
            // docs.push('B', 'P', 'A', 'T');
            // viewEmp?.
            // viewEmpDoc.push('B', 'P', 'A', 'T');
          }else if(!docs.includes(el.name)){
            docs.push(el.name)
            
            this.viewEmpDocData.push(el.name)
          }
        }else{
          if(el.name == 'all'){
            let typeid = ['B', 'P', 'A', 'T'];
            typeid?.map((t:any,i:number)=>{
              if (t === 'B') {
                viewEmp = {}
                viewEmp.id = row?._id;
                viewEmp.uan_no = row?.uan_no;
                viewEmp.typeid = t;
                viewEmp.docnumber = row?.employee_details?.bank_details?.account_no;
                viewEmp.emp_first_name = row?.emp_first_name;
                viewEmp.emp_last_name = row?.emp_last_name;
                // viewEmp.emp_last_name = row?.emp_last_name;
                viewEmp.ifsc = row?.employee_details?.bank_details?.ifsc_code;
                viewEmp.expirydate = "";
                this.viewEmpDocData.push(viewEmp)
              }
                else if (t === 'P') {
                viewEmp = {}
                viewEmp.id = row?._id;
                viewEmp.uan_no = row?.uan_no;
                viewEmp.typeid = t;
                viewEmp.docnumber = row?.pan_no;
                viewEmp.emp_first_name = row?.emp_first_name;
                viewEmp.emp_last_name = row?.emp_last_name;
                viewEmp.ifsc = "";
                viewEmp.expirydate = "";
                // viewEmp.emp_last_name = row?.emp_last_name;
                // viewEmp.ifsc = row?.employee_details?.bank_details?.ifsc_code;
                this.viewEmpDocData.push(viewEmp)
              }
                else if (t === 'A') {
                viewEmp = {}
                viewEmp.id = row?._id;
                viewEmp.uan_no = row?.uan_no;
                viewEmp.typeid = t;
                viewEmp.docnumber = row?.aadhar_no;
                viewEmp.emp_first_name = row?.emp_first_name;
                viewEmp.emp_last_name = row?.emp_last_name;
                viewEmp.ifsc = "";
                viewEmp.expirydate = "";
                // viewEmp.emp_last_name = row?.emp_last_name;
                // viewEmp.ifsc = row?.employee_details?.bank_details?.ifsc_code;
                this.viewEmpDocData.push(viewEmp)
              }
                else if (t === 'T') {
                viewEmp = {}
                viewEmp.id = row?._id;
                viewEmp.uan_no = row?.uan_no;
                viewEmp.typeid = t;
                viewEmp.docnumber = row?.passport_no;
                viewEmp.emp_first_name = row?.emp_first_name;
                viewEmp.emp_last_name = row?.emp_last_name;
                viewEmp.ifsc = "";
                viewEmp.expirydate = row?.passport_val_to;

                // viewEmp.emp_last_name = row?.emp_last_name;
                // viewEmp.ifsc = row?.employee_details?.bank_details?.ifsc_code;
                this.viewEmpDocData.push(viewEmp)
              }
         
              
            })
            // viewEmp.TypeID = ['B', 'P', 'A', 'T']
            docs.push('B', 'P', 'A', 'T');
           
          }
          el.checked = true
        }
      }else{
        el.disabled = true;
        el.checked = false
      }
    })
    

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
            this.documents.push({
                _id:rowId,
                documents:docs
            })
          }
        }
      } else {
        
        
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        this.documents = this.documents.filter((d) => d._id !== rowId);
        this.viewEmpDocData = this.viewEmpDocData.filter((d) => d.id !== rowId);
       
        if (this.rowCheckedAll) {
          if (!this.uncheckedRowIds.includes(rowId)) {
            this.uncheckedRowIds.push(rowId);
          }
        }
      }
    }
  }

  anyRowsChecked(): boolean {
    
    // if(this.documents.length <= 0) {
    // // console.log(this.documents,'doc');
      
    //   return false
    // }
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
      pageno: this.paginationOptions.page || 1,
      perpage:this.paginationOptions.limit,
      searchkey:this.employeeTableFilterOptions.searchkey || '',
      client_id: this.employeeListFilter?.client_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      hod_id: this.employeeListFilter?.hod_id ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      document:JSON.stringify(this.documents)
    };
    return payload;
  }

  async fetchEmployees() {
    
    try {
      let payload = this.getPayload() || {};
      
      payload['row_checked_all'] = false
      payload['checked_row_ids'] = '[]'
      payload['unchecked_row_ids'] = '[]'
      
      let res = await this.companyuserService
        .fetchEmployeeBulkUpload(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.employees = res.employees.docs;
          this.viewAllEmp = res.employees.docs;
          this.paginationOptions = {
            hasNextPage: res.employees?.hasNextPage,
            hasPrevPage: res.employees?.hasPrevPage,
            limit: res.employees?.limit,
            nextPage: res.employees?.nextPage,
            page: res.employees?.page,
            pagingCounter: res.employees?.pagingCounter,
            prevPage: res.employees?.prevPage,
            totalDocs: res.employees?.totalDocs,
            totalPages: res.employees?.totalPages,
          };
          this.employees.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
            const document = this.documents?.find((d) => d._id == doc._id);
            document?.documents?.forEach((d:any) => {
              // const el:HTMLInputElement = window.document.getElementById(doc?.emp_id + '-'+ d) as HTMLInputElement;
              // el.checked = true
              doc[`is${d}`] = true
            })
            
            // if(doc.checked){
            //   this.documents.push({
            //     _id:doc?._id,
            //     documents:['B', 'P', 'A', 'T']
            // })
            // }
          });
          return res;
        } else if (res.status == 'val_err') {
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      return this.toastr.error(err?.message || err);
    }
  }

  async exportForm() {
    
    try {
      let payload = this.getPayload() || {};
      payload = {...payload,}

      payload.generate = 'excel'
      await this.companyuserService.downloadFile('employee-bulk-upload','employee-bulk-upload', payload)
    } catch (err: any) {
      this.toastr.error(err?.message || err);
    }
  }
  generatedReportTemplate: any[] = [];
  isReportView:boolean = false;
  viewReport(){
    try {
      
      this.generatedReportTemplate = this.bulk_kyc_heads[0]?.modules ?? [];
      if (this.rowCheckedAll == true) {
        this.viewEmpDoc = this.viewAllEmp
      }
      else{
        this.viewEmpDoc = this.viewEmpDocData
      }
      this.isReportView = true;
    } catch (error) {
    // console.log(error);
      
    }
  }
  cancelGenerateReport() {
    this.isReportView = false;
    this.generatedReportTemplate = [];
    this.viewEmpDoc = [];
    this.viewEmpDocData = [];
    this.viewAllEmp = [];
    this.resetCheckedRows();
}
resetCheckedRows() {
  this.rowCheckedAll = false
  this.checkedRowIds = []
  this.uncheckedRowIds = []
  
  $('.employee-table').find('#srNo').prop('checked', false)
  $('.employee-table').find('.typeid').prop('checked', false)

  this.fetchEmployees();
}
  getReportTdValue(employee: any, field: any) {
   
    
    if (field.mapping) {
        if (Array.isArray(field.mapping)) {
            let value = '';
            field.mapping.forEach((mapping: any) => {
                value += this.getMappingValue(mapping, employee) + ' ';
            });

            return value ?? 'N/A';
        } else {
            return this.getMappingValue(field.mapping, employee) ?? 'N/A';
        }
    } else {
        return 'N/A';
    }
}
getMappingValue(mappingValue: string, obj: any) {
  
  let mapping = mappingValue.split('.');
  if (mapping.length > 0) {
      let value = obj;
      mapping.forEach((key: any) => {
          
          if (value !== null && value !== undefined) {
              // if(value[]){

              // }
              value = value[key] ?? "N/A";
          }
      });

      return value ?? "N/A"
  } else {
      return "N/A";
  }
}
  multiSelectDocs(e:any, _id:string, employee:any){
    
    if(e.name == 'all'){
    this.viewEmpDoc = this.viewEmpDoc.filter(item => item.id != _id )
  
      
      this.documents.map(row =>{
        if(row._id == _id){

            if(!e.checked){
                row.documents = []
              }else{
                row.documents = ['B', 'P', 'A', 'T']
              }
            }
            return row  
          })
        }
        if(e.name !== 'all'){
          
          this.documents.map(row =>{
            if(row._id == _id){
                if(!e.checked){
                  row.documents = row.documents.filter((doc:any)  => doc != e.name )
                  const el:HTMLInputElement | null = document.getElementById(employee.emp_id + '-ALL') as HTMLInputElement;
                  el.checked = false;
              }else if(!row.documents.includes(e.name)){
                row.documents.push(e.name)
              }
            }
            return row  
          })
          
          this.viewEmpDoc = this.viewEmpDoc.filter(item => { 
            if (item?.id == _id) {
              
              return item?.typeid != e.name
            }
            return item;
          }
         )
          
        }
  }


}
