import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as moment from 'moment';
@Component({
  selector: 'companyuser-app-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.css'],
})
export class CompanyuserTableFilterComponent implements OnInit {
  Global = Global;
  monthMaster: any[] = Global.monthMaster;
  attendanceTypeMaster: any[] = Global.attendanceTypeMaster;
  yearMaster: any[] = [];
  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  hodMaster: any[] = [];
  clientMaster: any[] = [];
  bankAccounts:any = [];
  empStatusMaster: any[] = [
    { value: '', description: 'All' },
    { value: 'approved', description: 'Active' },
    { value: 'pending', description: 'Pending' },
    { value: 'inactive', description: 'Exited' },
  ];

  religionMaster: any = [
    { value: 'hindu', description: 'Hindu' },
    { value: 'muslim', description: 'Islamic' },
    { value: 'chiristian', description: 'Christian' },
    { value: 'other', description: 'Others' },
  ];

  frequencyMaster: any[] = [
    { value: 'monthly', description: 'Monthly' },
    { value: 'quaterly', description: 'Quaterly' },
    { value: 'half_yearly', description: 'Half Yearly' },
    { value: 'yearly', description: 'Yearly' },
  ];

  disburesmentMaster: any[] = [
    { value: 'fixed', description: 'Fixed Amount' },
    { value: 'percent', description: 'Percent' },
  ];

  salarySheetMaster: any[] = [
    { value: 'all', description: 'All' },
    { value: 'salary', description: 'Salary' },
    { value: 'supplement_salary', description: 'Supplement' },
    { value: 'incentive', description: 'Incentive' },
    { value: 'bonus', description: 'Bonus' },
    { value: 'ot', description: 'OT' },
  ];
  // salarySheetMaster: any[] = [
  //   { value: 'fixed', description: 'Fixed Amount' },
  //   { value: 'percent', description: 'Percent' },
  // ];
  challanTypeMaster: any[] = [
    { value: '1', description: 'Fixed' },
    { value: '2', description: 'Percent' },
  ];

  reportTypeMaster: any[] = [
    { value: '1', description: 'Form D' },
    {
      value: '2',
      description: 'Attendance Register (Time, Whole Day, Half Day)',
    },
    { value: 'monthly_late_report', description: 'Monthly Late Report' },
    { value: 'late_summary_report', description: 'Late Summary Report' },
    { value: 'month_wise_summary', description: 'Month wise Summary' },
    { value: 'summary', description: 'Summary' },
  ];

  bankInstStatusMaster: any[] = [
    { value: 'active', description: "Active" },
    { value: 'confirm', description: "Confirmed" },
  ]

  bankInstPayTypeMaster: any[] = [
    { value: 'salary', description: " Salary" },
    { value: 'supplement_salary', description: "Supplement Salary" },
    { value: 'incentive', description: "Incentive" },
    { value: 'bonus', description: "Bonus" },
    { value: 'ot', description: "Over-Time" },
    { value: 'reimbursment', description: "Reimbursement" },
    { value: 'earning', description: "Earning" },
    { value: 'arrear', description: "Arrear" },
  ];
  statusMaster:any=[
    {value:'approved',description: "Approved"},
    {value:'rejected',description: "Rejected"},
    {value:'pending',description: "Pending"},

  ];
  @Input() advanceFilter: boolean = false;
  @Input() searchKeyFilter: boolean = false;
  @Input() monthFilter: boolean = false;
  @Input() yearFilter: boolean = false;
  @Input() attendanceTypeFilter: boolean = false;
  @Input() empDetailsFilter: boolean = false;
  @Input() basicFilter: boolean = true;
  @Input() isClient: boolean = true;
  @Input() isHod: boolean = true;
  @Input() frequencyFilter: boolean = false;
  @Input() disburesmentFilter: boolean = false;
  @Input() empNameFilter: boolean = false;
  @Input() empIdFilter: boolean = false;
  @Input() salarySheet: boolean = false;
  @Input() challanType: boolean = false;
  @Input() reportType: boolean = false;
  @Input() registerType: boolean = false;
  @Input() isFilterBtnDisable: boolean = false;
  @Input() isFilterBtnHidden: boolean = true;
  @Input() dateFromFilter: boolean = false;
  @Input() dateToFilter: boolean = false;
  @Input() salaryTypeFilter: boolean = false;
  @Input() bankInstStatus: boolean = false;
  @Input() bankInstPayType: boolean = false;
  @Input() complianceStatus: boolean = false;
  @Input() isBranchMultiple: boolean = true;
  @Input() isBankAccount: boolean = false;
  @Input() rivisionreport_type: boolean = false;
  @Input() is_approval_status: boolean = false;
  @Input() filter_btn: boolean = true;

  @Output() onFiltered: EventEmitter<any> = new EventEmitter();

  curruntYear = moment().year();
  curruntMonth = moment().month() + 1;

  filterForm: UntypedFormGroup = this.formBuilder.group({
    month: [null, Validators.compose([])],
    year: [null, Validators.compose([])],
    attendance_type: [null, Validators.compose([])],
    searchkey: [null, Validators.compose([])],
    emp_first_name: [null, Validators.compose([])],
    emp_last_name: [null, Validators.compose([])],
    emp_email_id: [null, Validators.compose([])],
    emp_status: [null, Validators.compose([])],
    department_id: [null, Validators.compose([])],
    designation_id: [null, Validators.compose([])],
    branch_id: [null, Validators.compose([])],
    hod_id: [null, Validators.compose([])],
    client_id: [null, Validators.compose([])],
    emp_name: [null, Validators.compose([])],
    emp_id: [null, Validators.compose([])],
    advance_filter: [null, Validators.compose([])],
    gender: [null, Validators.compose([])],
    religion: [null, Validators.compose([])],
    age_from: [null, Validators.compose([])],
    age_to: [null, Validators.compose([])],
    doj_from: [null, Validators.compose([])],
    doj_to: [null, Validators.compose([])],
    doe_from: [null, Validators.compose([])],
    doe_to: [null, Validators.compose([])],
    disbursement_frequency: [null, Validators.compose([])],
    disbursement_type: [null, Validators.compose([])],
    salary_sheet: [null, Validators.compose([])],
    challan_type: [null, Validators.compose([])],
    report_type: [null, Validators.compose([])],
    register_type: [null, Validators.compose([])],
    approval_status: [null, Validators.compose([])],

    date_from: [null, Validators.compose([])],
    date_to: [null, Validators.compose([])],
    salary_type: [null, Validators.compose([])],
    compliance_status: [null, Validators.compose([])],
    bank_id: [null, Validators.compose([])],
    bankinst_status: [null, Validators.compose([])],
    bankinst_pay_type: [null, Validators.compose([])],
    search_type:[null, Validators.compose([])]
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {
    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }

    this.filterForm?.get('emp_status')?.setValue(
      this.empStatusMaster.find((obj: any) => {
        return obj.value == '';
      })
    );

  
  }

  async ngOnInit() {
    await this.fetchMaster();

    if (this.monthFilter == true) {
      this.filterForm.get('month')?.setValidators([Validators.required]);
      this.filterForm.get('month')?.updateValueAndValidity();
      this.filterForm.get('month')?.setValue(
        this.monthMaster.find(m => m == new Date().getMonth())
      )
    }

    if (this.yearFilter == true) {
      this.filterForm.get('year')?.setValidators([Validators.required]);
      this.filterForm.get('year')?.updateValueAndValidity();
    }

    if (this.dateFromFilter == true) {
      this.filterForm.get('date_from')?.setValidators([Validators.required]);
      this.filterForm.get('date_from')?.updateValueAndValidity();

      this.filterForm.get('date_from')?.setValue(moment().format('YYYY-MM'));
    }

    if (this.dateToFilter == true) {
      this.filterForm.get('date_to')?.setValidators([Validators.required]);
      this.filterForm.get('date_to')?.updateValueAndValidity();

      this.filterForm.get('date_to')?.setValue(moment().format('YYYY-MM'));
    }

    if (this.attendanceTypeFilter == true) {
      this.filterForm.get('attendance_type')?.setValidators([Validators.required]);
      this.filterForm.get('attendance_type')?.updateValueAndValidity();
    }

    if (this.salaryTypeFilter == true) {
      this.filterForm.get('salary_type')?.setValidators([Validators.required]);
      this.filterForm.get('salary_type')?.updateValueAndValidity();
      this.filterForm.get('salary_type')?.setValue('Salary');
    }

    if (this.salarySheet == true) {
      this.filterForm.get('salary_sheet')?.setValidators([Validators.required]);
      this.filterForm.get('salary_sheet')?.updateValueAndValidity();
      this.filterForm.get('salary_sheet')?.setValue({value: 'all', description: 'All'});
    }
    if (this.complianceStatus == true) {
      this.filterForm.get('compliance_status')?.setValidators([Validators.required]);
      this.filterForm.get('compliance_status')?.updateValueAndValidity();
      this.filterForm.get('compliance_status')?.setValue('Pending');
    }

    if (this.bankInstStatus == true) {
      this.filterForm.get('bankinst_status')?.setValidators([Validators.required]);
      this.filterForm.get('bankinst_status')?.updateValueAndValidity();
      this.filterForm.get('bankinst_status')?.setValue(this.bankInstStatusMaster.find((obj: any) => {
        return obj.value == 'active'
      }));
    }

    if (this.bankInstPayType == true) {
      this.filterForm.get('bankinst_pay_type')?.setValidators([Validators.required]);
      this.filterForm.get('bankinst_pay_type')?.updateValueAndValidity();
      this.filterForm.get('bankinst_pay_type')?.setValue(this.bankInstPayTypeMaster.find((obj: any) => {
        return obj.value == 'salary'
      }));
    }

    this.filterForm
    .get('advance_filter')
    ?.valueChanges.subscribe((value) => {
      if (value != true) {
        this.filterForm.get('gender')?.reset();
        this.filterForm.get('religion')?.reset();
        this.filterForm.get('age_from')?.reset();
        this.filterForm.get('age_to')?.reset();
        this.filterForm.get('doj_from')?.reset();
        this.filterForm.get('doj_to')?.reset();
        this.filterForm.get('doe_from')?.reset();
        this.filterForm.get('doe_to')?.reset();
      }
    });


    this.filterForm.patchValue({
      month: this.monthMaster.find((obj: any) => {
        return obj.index == new Date().getMonth();
      }),
      year: this.yearMaster.find((obj: any) => {
        return obj.value == new Date().getFullYear();
      }),
      attendance_type: this.attendanceTypeMaster.find((obj: any) => {
        return obj.value == 'time';
      }),
      date_from: moment().format('YYYY-MM'),
      date_to: moment().format('YYYY-MM'),
      search_type:'effective_date'
    });

    if(this.frequencyFilter){
      this.filterForm.get('disbursement_frequency')?.setValidators([Validators.required]);
      this.filterForm.get('disbursement_frequency')?.updateValueAndValidity();
      this.filterForm.get('disbursement_frequency')?.setValue(
        this.frequencyMaster.find(m => m?.value == 'monthly')
      )
    }
    if(this.disburesmentFilter){
      this.filterForm.get('disbursement_type')?.setValidators([Validators.required]);
      this.filterForm.get('disbursement_type')?.updateValueAndValidity();
      this.filterForm.get('disbursement_type')?.setValue(
        this.disburesmentMaster.find(m => m.value == 'percent')
      )
    }


    this.filter();
  }

  fetchMaster() {
    return new Promise((resolve, reject) => {
      // this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res: any) => {
          // this.spinner.hide();
          if (res.status == 'success') {
            if (
              res.masters.branch?.company_branch &&
              Array.isArray(res.masters.branch?.company_branch)
            ) {
              this.branchMaster = [];
              res.masters.branch?.company_branch.forEach((element: any) => {
                this.branchMaster.push({
                  id: element._id,
                  description: element.branch_name,
                });
              });
            }

            if (
              res.masters.designation &&
              Array.isArray(res.masters.designation)
            ) {
              this.designationMaster = [];
              res.masters.designation.forEach((element: any) => {
                this.designationMaster.push({
                  id: element._id,
                  description: element.designation_name,
                });
              });
            }

            if (
              res.masters.department &&
              Array.isArray(res.masters.department)
            ) {
              this.departmentMaster = [];
              res.masters.department.forEach((element: any) => {
                this.departmentMaster.push({
                  id: element._id,
                  description: element.department_name,
                });
              });
            }

            if (res.masters.hod && Array.isArray(res.masters.hod)) {
              this.hodMaster = [];
              res.masters.hod.forEach((element: any) => {
                this.hodMaster.push({
                  id: element._id,
                  description: `${element.first_name} ${element.last_name}`,
                });
              });
            }

            if (res.masters.clients && Array.isArray(res.masters.clients)) {
              this.clientMaster = [];
              res.masters.clients.forEach((element: any) => {
                this.clientMaster.push({
                  id: element._id,
                  description: `${element.client_name} (${element.client_code})`,
                  code: element.client_code,
                });
              });
            }
            if (res.masters.bank_accounts && Array.isArray(res.masters.bank_accounts)) {
              this.bankAccounts = [{label:"All", value:''}];
              res.masters.bank_accounts.forEach((element: any) => {
                this.bankAccounts.push({
                  label: `${element}`,
                  value: `${element}`,
                });
              });
            } 
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (err) => {
          // this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(false);
        }
      );
    });
  }

  filter() {
    let departments: any[] = [];
    (this.filterForm.value.department_id ?? []).forEach((element: any) => {
      departments.push(element.id);
    });

    let designations: any[] = [];
    (this.filterForm.value.designation_id ?? []).forEach((element: any) => {
      designations.push(element.id);
    });

    let branches: any[] = [];
    if(this.isBranchMultiple){
      (this.filterForm.value.branch_id ?? []).forEach((element: any) => {
        branches.push(element.id);
      });
    }


    let hods: any[] = [];
    (this.filterForm.value.hod_id ?? []).forEach((element: any) => {
      hods.push(element.id);
    });

    let clients: any[] = [];
    (this.filterForm.value.client_id ?? []).forEach((element: any) => {
      clients.push(element.id);
    });

    let clientsCode: any[] = [];
    (this.filterForm.value.client_id ?? []).forEach((element: any) => {
      clientsCode.push(element.code);
    });

    let banks: any[] = [];
    const isAllExist = this.filterForm.value?.bank_id?.find((bank:any) => bank.label === 'All')
    if(isAllExist){
      banks = []
    }else{
      (this.filterForm.value.bank_id ?? []).forEach((element: any) => {
        banks.push(element.value);
      });
    }


    // let disbursement_frequency =
    //   this.filterForm?.value?.disbursement_frequency?.map((el: any) => {
    //     return el.value;
    //   });
    // let disbursement_type = this.filterForm.value?.disbursement_type?.map(
    //   (el: any) => {
    //     return el.value;
    //   }
    // );

    // let salary_sheet = this.filterForm.value?.salary_sheet?.map((el: any) => {
    //   return el.value;
    // });
    let newData={
      wage_month_from:new Date(this.filterForm?.value?.date_from).getMonth(),
      wage_year_from:new Date(this.filterForm?.value?.date_from).getFullYear(),
      wage_month_to:new Date(this.filterForm?.value?.date_to).getMonth(),
      wage_year_to:new Date(this.filterForm?.value?.date_to).getFullYear(),
      date_from: this.filterForm?.value?.date_from ?? '',
      date_to: this.filterForm?.value?.date_to ?? '',
      searchkey: this.filterForm.value.searchkey ?? '',
      emp_status: this.filterForm.value.emp_status?.value ?? '',
      month: this.filterForm.value.month ?? '',
      year: this.filterForm.value.year ?? '',
      attendance_type: this.filterForm.value.attendance_type ?? '',
      emp_first_name: this.filterForm.value.emp_first_name ?? '',
      emp_last_name: this.filterForm.value.emp_last_name ?? '',
      emp_email_id: this.filterForm.value.emp_email_id ?? '',
      department_id: departments.length > 0 ? JSON.stringify(departments) : '',
      designation_id:designations.length > 0 ? JSON.stringify(designations) : '',
      branch_id: branches.length > 0 ? JSON.stringify(branches) : '',
      hod_id: hods.length > 0 ? JSON.stringify(hods) : '',
      client_id: clients.length > 0 ? JSON.stringify(clients) : '',
      client_code: clientsCode?.length > 0 ? JSON.stringify(clientsCode) : '',
      emp_id: this.filterForm.value.emp_id ?? '',
      emp_name: this.filterForm.value.emp_name ?? '',
      salary_type: this.filterForm.value?.salary_type?.toLowerCase() ?? 'salary',
      report_type:this.filterForm.value?.report_type?.value,
      advance_filter:
        this.filterForm?.value?.advance_filter == true ? 'yes' : 'no',
      gender: this.filterForm?.value?.gender?.value ?? '',
      religion: this.filterForm?.value?.religion?.value ?? '',
      age_from: this.filterForm?.value?.age_from ?? '',
      age_to: this.filterForm?.value?.age_to ?? '',
      doj_from: this.filterForm?.value?.doj_from ?? '',
      doj_to: this.filterForm?.value?.doj_to ?? '',
      doe_from: this.filterForm?.value?.doe_from ?? '',
      doe_to: this.filterForm?.value?.doe_to ?? '',
      disbursement_frequency: this.filterForm.value?.disbursement_frequency?.value ?? '',
      disbursement_type: this.filterForm.value?.disbursement_type?.value ?? '',
      bankinst_status: this.filterForm?.value?.bankinst_status?.value ?? '',
      bankinst_pay_type: this.filterForm?.value?.bankinst_pay_type?.value ?? '',
      sheet_type: this.filterForm?.value?.salary_sheet?.value ?? '',
      compliance_status: this.filterForm?.value?.compliance_status ?? '',
      // bank_id: this.filterForm?.value?.bank_id?.description ?? '',
      bank_id: banks.length > 0 ? JSON.stringify(banks) : '',
      search_type:this.filterForm?.value?.search_type,
      approval_status:this.filterForm?.value?.approval_status

    }

    if(!this.isBranchMultiple) newData.branch_id = this.filterForm.value?.branch_id?.id ?? ''
    // console.log(this.filterForm.value.branch_id);

    this.onFiltered.emit(newData);
  }

  reset({ refresh = <boolean>true } = {}) {
    Global.resetForm(this.filterForm);

    if (refresh == true) this.filter();
  }

  setFormControlValue({ refresh = <boolean>true, payload = <any>{} } = {}) {
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const value = payload[key];
        this.filterForm.get(key)?.setValue(value);
      }
    }

    if (refresh == true) {
      this.filter();
    }
  }

  maxDateTo:any = this.curruntYear + '-0' + (this.curruntMonth)
  getDateFromToMaxValidation(dateFrom:any){
    const yearFrom = dateFrom?.split("-")[0]
    const monthFrom = dateFrom?.split("-")[1]
    if(dateFrom){
  
      
      if((yearFrom == this.curruntYear ) && (monthFrom == ('0' + (this.curruntMonth) )) ){
        this.maxDateTo = this.curruntYear + '-0' + (this.curruntMonth)
        return
      }else if((yearFrom == this.curruntYear)){
        let year = yearFrom
        this.maxDateTo = year +  '-0' + this.curruntMonth
        return year +  '-0' + this.curruntMonth
      }else if((yearFrom == (this.curruntYear -1))  && (monthFrom > ('0' + (this.curruntMonth) )) ){
        let year = yearFrom

        this.maxDateTo = (+year + 1) +  '-0' + this.curruntMonth
        return  (+year +1) +  '-0' + this.curruntMonth
      }
      let year = +yearFrom + 1
      let month:any = +monthFrom - 1
      if(month <= 0){
        year--
        month = 12
      }
      if(month < 10){
        month = '0' + month
      }

      
      this.maxDateTo = year + '-' + month
      this.filterForm.get('date_to')?.setValue(this.maxDateTo)
      // return (+year + 1) +  '-' + (+month - 1)
      return year + '-' + month
    }
    this.maxDateTo = this.curruntYear + '-0' + (this.curruntMonth)
    return
  }

  getMaxDateTo(){
    return this.maxDateTo
  }

  chnagereportType(ev:any)
  {

    if(ev.value.value==1 || ev.value.value=='monthly_late_report')
    {
      this.dateFromFilter=false;
      this.dateToFilter=false;
      this.yearFilter=true;
      this.monthFilter=true;
      this.attendanceTypeFilter=false;

    }


    else if(ev.value.value==2)
    {
      this.dateFromFilter=false;
      this.dateToFilter=false;
      this.yearFilter=true;
      this.monthFilter=true;
      this.attendanceTypeFilter=true;
    }

    else{
      this.dateFromFilter=true;
      this.dateToFilter=true;
      this.yearFilter=false;
      this.monthFilter=false;
      this.attendanceTypeFilter=false;


    }

  }
  changeDate(form_name:any,ev:any)
  {
    // console.log(ev.target.value);

  }
}
